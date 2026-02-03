"""
Automation Service - Engine di esecuzione automazioni
"""
from datetime import datetime, timedelta
from app import db
from app.models import (
    Automation, AutomationExecution, AutomationStepExecution,
    Notification, Checklist, LeadActivity, SponsorActivity,
    Lead, Sponsor, HeadOfTerms, EmailTemplate
)
from app.services.email_service import EmailService
import requests
import json


class AutomationService:
    """Engine principale per esecuzione automazioni"""

    # Registry degli step handlers
    STEP_HANDLERS = {}

    @classmethod
    def register_handler(cls, step_type):
        """Decorator per registrare handler di step"""
        def decorator(func):
            cls.STEP_HANDLERS[step_type] = func
            return func
        return decorator

    @staticmethod
    def execute_automation(automation, trigger_data=None):
        """
        Esegue un'automazione completa

        Args:
            automation: Oggetto Automation
            trigger_data: Dati del trigger (entity_type, entity_id, entity_data)

        Returns:
            AutomationExecution
        """
        # Crea execution record
        execution = AutomationExecution(
            automation_id=automation.id,
            status='running',
            trigger_data=trigger_data,
            started_at=datetime.utcnow()
        )
        db.session.add(execution)
        db.session.flush()

        # Prepara context
        context = AutomationService._build_context(automation.club_id, trigger_data)

        steps = automation.steps or []
        all_success = True
        has_pending = False

        for idx, step in enumerate(steps):
            step_type = step.get('type')
            step_config = step.get('config', {})
            delay_minutes = step.get('delay_minutes', 0)

            # Crea step execution
            step_exec = AutomationStepExecution(
                execution_id=execution.id,
                step_index=idx,
                step_type=step_type,
                input_data=step_config,
                status='pending'
            )
            db.session.add(step_exec)
            db.session.flush()

            # Se c'è delay, schedula per dopo
            if delay_minutes > 0:
                step_exec.scheduled_for = datetime.utcnow() + timedelta(minutes=delay_minutes)
                step_exec.status = 'pending'
                has_pending = True
                continue

            # Esegui step
            try:
                step_exec.status = 'running'
                step_exec.started_at = datetime.utcnow()
                db.session.commit()

                result = AutomationService.execute_step(step_type, step_config, context)

                step_exec.status = 'completed'
                step_exec.output_data = result
                step_exec.completed_at = datetime.utcnow()

                # Aggiorna context con output
                context['last_step_output'] = result

            except Exception as e:
                step_exec.status = 'failed'
                step_exec.error_message = str(e)
                step_exec.completed_at = datetime.utcnow()
                all_success = False

        # Aggiorna execution status
        if has_pending:
            execution.status = 'partial'
        elif all_success:
            execution.status = 'completed'
        else:
            execution.status = 'failed'

        execution.completed_at = datetime.utcnow()

        # Aggiorna automation stats
        automation.last_run = datetime.utcnow()
        automation.executions_count = (automation.executions_count or 0) + 1
        automation.last_status = execution.status

        db.session.commit()
        return execution

    @staticmethod
    def execute_step(step_type, config, context):
        """
        Esegue un singolo step

        Args:
            step_type: Tipo di step (send_notification, send_email, etc.)
            config: Configurazione dello step
            context: Context con dati disponibili

        Returns:
            dict: Risultato dell'esecuzione
        """
        handler = AutomationService.STEP_HANDLERS.get(step_type)
        if not handler:
            raise ValueError(f"Handler non trovato per step type: {step_type}")

        return handler(config, context)

    @staticmethod
    def execute_pending_steps():
        """
        Esegue step pendenti con delay scaduto
        Chiamato periodicamente dallo scheduler
        """
        now = datetime.utcnow()
        pending_steps = AutomationStepExecution.query.filter(
            AutomationStepExecution.status == 'pending',
            AutomationStepExecution.scheduled_for <= now
        ).all()

        for step_exec in pending_steps:
            try:
                execution = step_exec.execution
                automation = execution.automation

                # Rebuild context
                context = AutomationService._build_context(
                    automation.club_id,
                    execution.trigger_data
                )

                step_exec.status = 'running'
                step_exec.started_at = datetime.utcnow()
                db.session.commit()

                result = AutomationService.execute_step(
                    step_exec.step_type,
                    step_exec.input_data,
                    context
                )

                step_exec.status = 'completed'
                step_exec.output_data = result
                step_exec.completed_at = datetime.utcnow()

            except Exception as e:
                step_exec.status = 'failed'
                step_exec.error_message = str(e)
                step_exec.completed_at = datetime.utcnow()

        db.session.commit()

        # Aggiorna execution status se tutti gli step sono completati
        AutomationService._update_execution_statuses()

    @staticmethod
    def _update_execution_statuses():
        """Aggiorna status delle execution con step pendenti completati"""
        from sqlalchemy import func

        # Trova execution con status 'partial'
        partial_executions = AutomationExecution.query.filter_by(status='partial').all()

        for execution in partial_executions:
            pending_count = execution.step_executions.filter_by(status='pending').count()
            failed_count = execution.step_executions.filter_by(status='failed').count()

            if pending_count == 0:
                if failed_count > 0:
                    execution.status = 'failed'
                else:
                    execution.status = 'completed'
                execution.completed_at = datetime.utcnow()

        db.session.commit()

    @staticmethod
    def _build_context(club_id, trigger_data):
        """
        Costruisce il context per l'esecuzione degli step

        Args:
            club_id: ID del club
            trigger_data: Dati del trigger

        Returns:
            dict: Context con tutti i dati disponibili
        """
        context = {
            'club_id': club_id,
            'trigger_data': trigger_data or {},
            'now': datetime.utcnow()
        }

        if trigger_data:
            entity_type = trigger_data.get('entity_type')
            entity_id = trigger_data.get('entity_id')

            if entity_type == 'lead' and entity_id:
                lead = Lead.query.get(entity_id)
                if lead:
                    context['lead'] = {
                        'id': lead.id,
                        'ragione_sociale': lead.ragione_sociale,
                        'email': lead.email,
                        'telefono': lead.telefono,
                        'status': lead.status,
                        'nome_contatto': lead.nome_contatto,
                        'settore_merceologico': lead.settore_merceologico
                    }

            elif entity_type == 'sponsor' and entity_id:
                sponsor = Sponsor.query.get(entity_id)
                if sponsor:
                    context['sponsor'] = {
                        'id': sponsor.id,
                        'ragione_sociale': sponsor.ragione_sociale,
                        'email': sponsor.email,
                        'telefono': sponsor.telefono,
                        'referente_nome': sponsor.referente_nome,
                        'settore_merceologico': sponsor.settore_merceologico
                    }

            elif entity_type == 'contract' and entity_id:
                contract = HeadOfTerms.query.get(entity_id)
                if contract:
                    context['contract'] = {
                        'id': contract.id,
                        'nome_contratto': contract.nome_contratto,
                        'compenso': contract.compenso,
                        'data_inizio': contract.data_inizio.isoformat() if contract.data_inizio else None,
                        'data_fine': contract.data_fine.isoformat() if contract.data_fine else None,
                        'status': contract.status
                    }

        return context

    @staticmethod
    def check_conditions(conditions, context):
        """
        Verifica se le condizioni sono soddisfatte

        Args:
            conditions: Lista di condizioni [{field, operator, value}]
            context: Context con dati

        Returns:
            bool: True se tutte le condizioni sono soddisfatte
        """
        if not conditions:
            return True

        rules = conditions.get('rules', [])
        operator = conditions.get('operator', 'AND')

        results = []
        for rule in rules:
            field_path = rule.get('field', '')
            op = rule.get('operator', 'equals')
            expected_value = rule.get('value')

            # Recupera valore dal context
            actual_value = AutomationService._get_nested_value(context, field_path)

            # Valuta condizione
            result = AutomationService._evaluate_condition(actual_value, op, expected_value)
            results.append(result)

        if operator == 'AND':
            return all(results)
        else:  # OR
            return any(results)

    @staticmethod
    def _get_nested_value(obj, path):
        """Recupera valore nested da dict usando dot notation"""
        parts = path.split('.')
        value = obj
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            else:
                return None
        return value

    @staticmethod
    def _evaluate_condition(actual, operator, expected):
        """Valuta una singola condizione"""
        if actual is None:
            return operator == 'is_empty'

        if operator == 'equals':
            return str(actual).lower() == str(expected).lower()
        elif operator == 'not_equals':
            return str(actual).lower() != str(expected).lower()
        elif operator == 'contains':
            return str(expected).lower() in str(actual).lower()
        elif operator == 'not_contains':
            return str(expected).lower() not in str(actual).lower()
        elif operator == 'starts_with':
            return str(actual).lower().startswith(str(expected).lower())
        elif operator == 'ends_with':
            return str(actual).lower().endswith(str(expected).lower())
        elif operator == 'greater_than':
            try:
                return float(actual) > float(expected)
            except:
                return False
        elif operator == 'less_than':
            try:
                return float(actual) < float(expected)
            except:
                return False
        elif operator == 'is_empty':
            return not actual
        elif operator == 'is_not_empty':
            return bool(actual)
        elif operator == 'in_list':
            return actual in (expected if isinstance(expected, list) else [expected])

        return False


# ==================== STEP HANDLERS ====================

@AutomationService.register_handler('send_notification')
def handle_send_notification(config, context):
    """Invia notifica in-app"""
    user_type = config.get('user_type', 'club')
    user_id = config.get('user_id') or context.get('club_id')

    # Se user_type è 'trigger_entity', usa l'entità del trigger
    if user_type == 'trigger_entity':
        trigger_data = context.get('trigger_data', {})
        user_type = trigger_data.get('entity_type', 'club')
        user_id = trigger_data.get('entity_id')

    # Render variabili nel titolo e messaggio
    titolo = EmailService.render_template(config.get('titolo', ''), context)
    messaggio = EmailService.render_template(config.get('messaggio', ''), context)
    link = EmailService.render_template(config.get('link', ''), context)

    notification = Notification(
        user_type=user_type,
        user_id=user_id,
        tipo=config.get('tipo', 'automazione'),
        titolo=titolo,
        messaggio=messaggio,
        link=link,
        priorita=config.get('priorita', 'normale')
    )
    db.session.add(notification)
    db.session.commit()

    return {'notification_id': notification.id, 'user_type': user_type, 'user_id': user_id}


@AutomationService.register_handler('send_email')
def handle_send_email(config, context):
    """Invia email via SMTP"""
    club_id = context.get('club_id')

    # Render variabili
    to_email = EmailService.render_template(config.get('to', ''), context)
    subject = EmailService.render_template(config.get('oggetto', ''), context)

    # Se c'è un template_id, usa quello
    template_id = config.get('template_id')
    if template_id:
        template = EmailTemplate.query.get(template_id)
        if template:
            body_html = EmailService.render_template(template.corpo_html, context)
            body_text = EmailService.render_template(template.corpo_text, context) if template.corpo_text else None
        else:
            body_html = EmailService.render_template(config.get('corpo', ''), context)
            body_text = None
    else:
        body_html = EmailService.render_template(config.get('corpo', ''), context)
        body_text = None

    result = EmailService.send_email(
        club_id=club_id,
        to_email=to_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        cc=config.get('cc'),
        bcc=config.get('bcc')
    )

    return result


@AutomationService.register_handler('create_task')
def handle_create_task(config, context):
    """Crea una checklist/task"""
    trigger_data = context.get('trigger_data', {})

    # Render variabili
    titolo = EmailService.render_template(config.get('titolo', ''), context)
    descrizione = EmailService.render_template(config.get('descrizione', ''), context)

    # Determina contract_id se disponibile
    contract_id = config.get('contract_id')
    if not contract_id and trigger_data.get('entity_type') == 'contract':
        contract_id = trigger_data.get('entity_id')

    # Calcola scadenza
    scadenza = None
    if config.get('scadenza_giorni'):
        scadenza = datetime.utcnow() + timedelta(days=config['scadenza_giorni'])

    checklist = Checklist(
        contract_id=contract_id,
        titolo=titolo,
        descrizione=descrizione,
        assegnato_a=config.get('assegnato_a', 'club'),
        priorita=config.get('priorita', 'media'),
        scadenza=scadenza
    )
    db.session.add(checklist)
    db.session.commit()

    return {'checklist_id': checklist.id, 'titolo': titolo}


@AutomationService.register_handler('update_status')
def handle_update_status(config, context):
    """Aggiorna lo status di un'entità"""
    trigger_data = context.get('trigger_data', {})
    entity_type = config.get('entity_type') or trigger_data.get('entity_type')
    entity_id = config.get('entity_id') or trigger_data.get('entity_id')
    new_status = config.get('new_value')

    if not entity_type or not entity_id or not new_status:
        raise ValueError("entity_type, entity_id e new_value sono richiesti")

    if entity_type == 'lead':
        entity = Lead.query.get(entity_id)
        if entity:
            entity.status = new_status
    elif entity_type == 'contract':
        entity = HeadOfTerms.query.get(entity_id)
        if entity:
            entity.status = new_status
    else:
        raise ValueError(f"Entity type non supportato: {entity_type}")

    db.session.commit()
    return {'entity_type': entity_type, 'entity_id': entity_id, 'new_status': new_status}


@AutomationService.register_handler('create_activity')
def handle_create_activity(config, context):
    """Crea attività su lead o sponsor"""
    trigger_data = context.get('trigger_data', {})
    entity_type = config.get('entity_type') or trigger_data.get('entity_type')
    entity_id = config.get('entity_id') or trigger_data.get('entity_id')

    descrizione = EmailService.render_template(config.get('descrizione', ''), context)
    tipo = config.get('tipo', 'nota')

    if entity_type == 'lead':
        activity = LeadActivity(
            lead_id=entity_id,
            tipo=tipo,
            descrizione=descrizione,
            esito='neutro'
        )
    elif entity_type == 'sponsor':
        activity = SponsorActivity(
            sponsor_id=entity_id,
            tipo=tipo,
            descrizione=descrizione,
            esito='neutro'
        )
    else:
        raise ValueError(f"Entity type non supportato per attività: {entity_type}")

    db.session.add(activity)
    db.session.commit()

    return {'activity_id': activity.id, 'tipo': tipo}


@AutomationService.register_handler('webhook')
def handle_webhook(config, context):
    """Chiama webhook esterno"""
    url = config.get('url')
    method = config.get('method', 'POST').upper()
    headers = config.get('headers', {})

    # Render body template
    body_template = config.get('body', '{}')
    body_str = EmailService.render_template(body_template, context)

    try:
        body = json.loads(body_str)
    except:
        body = {'data': body_str}

    # Default headers
    if 'Content-Type' not in headers:
        headers['Content-Type'] = 'application/json'

    response = requests.request(
        method=method,
        url=url,
        headers=headers,
        json=body,
        timeout=30
    )

    return {
        'status_code': response.status_code,
        'response': response.text[:500] if response.text else None
    }


@AutomationService.register_handler('delay')
def handle_delay(config, context):
    """
    Delay - questo handler non fa nulla direttamente,
    il delay è gestito a livello di execute_automation
    """
    minutes = config.get('minutes', 0)
    hours = config.get('hours', 0)
    days = config.get('days', 0)

    total_minutes = minutes + (hours * 60) + (days * 24 * 60)
    return {'delay_minutes': total_minutes, 'scheduled': True}


@AutomationService.register_handler('condition')
def handle_condition(config, context):
    """
    Valuta condizioni - se false, skippa gli step successivi
    """
    conditions = config.get('conditions', {})
    result = AutomationService.check_conditions(conditions, context)

    if not result:
        # Se condizione non soddisfatta, segnala per skippare step successivi
        raise Exception('SKIP_REMAINING_STEPS')

    return {'condition_met': result}
