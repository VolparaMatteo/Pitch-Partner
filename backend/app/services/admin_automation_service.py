"""
Admin Automation Service - Engine di esecuzione workflow admin
Specchia automation_service.py per il contesto admin (CRM leads, contratti, fatture, ecc.)
"""
from datetime import datetime, timedelta
from app import db
from app.models import (
    AdminWorkflow, AdminWorkflowExecution, AdminWorkflowStepExecution,
    AdminWorkflowEnrollment, CRMLead, CRMLeadActivity, AdminContract,
    AdminInvoice, AdminTask, DemoBooking, Club, AdminEmailTemplate,
    Notification, AdminCalendarEvent
)
import requests
import json
import re


class AdminAutomationService:
    """Engine principale per esecuzione workflow admin"""

    STEP_HANDLERS = {}

    @classmethod
    def register_handler(cls, step_type):
        """Decorator per registrare handler di step"""
        def decorator(func):
            cls.STEP_HANDLERS[step_type] = func
            return func
        return decorator

    @staticmethod
    def execute_workflow(workflow, trigger_data=None):
        """
        Esegue un workflow completo.
        Per email_sequence, enrolla il lead invece di eseguire direttamente.
        """
        if workflow.tipo == 'email_sequence' and trigger_data:
            return AdminAutomationService._enroll_in_sequence(workflow, trigger_data)

        execution = AdminWorkflowExecution(
            workflow_id=workflow.id,
            status='running',
            trigger_data=trigger_data,
            started_at=datetime.utcnow()
        )
        db.session.add(execution)
        db.session.flush()

        context = AdminAutomationService._build_admin_context(trigger_data)
        steps = workflow.steps or []
        all_success = True
        has_pending = False
        skip_branches = set()

        for idx, step in enumerate(steps):
            step_type = step.get('type')
            step_config = step.get('config', {})
            step_id = step.get('id', str(idx))
            branch = step.get('branch')
            parent_condition_id = step.get('parent_condition_id')

            # Skip se appartiene a un branch da skippare
            if parent_condition_id and branch:
                key = f"{parent_condition_id}:{branch}"
                if key in skip_branches:
                    continue

            step_exec = AdminWorkflowStepExecution(
                execution_id=execution.id,
                step_index=idx,
                step_type=step_type,
                step_id=step_id,
                input_data=step_config,
                status='pending'
            )
            db.session.add(step_exec)
            db.session.flush()

            # Gestisci delay
            if step_type == 'delay':
                minutes = step_config.get('minutes', 0)
                hours = step_config.get('hours', 0)
                days = step_config.get('days', 0)
                total_minutes = minutes + (hours * 60) + (days * 24 * 60)
                if total_minutes > 0:
                    step_exec.scheduled_for = datetime.utcnow() + timedelta(minutes=total_minutes)
                    step_exec.status = 'pending'
                    has_pending = True
                    # Tutti gli step successivi diventano pending
                    for remaining_idx in range(idx + 1, len(steps)):
                        rem_step = steps[remaining_idx]
                        rem_exec = AdminWorkflowStepExecution(
                            execution_id=execution.id,
                            step_index=remaining_idx,
                            step_type=rem_step.get('type'),
                            step_id=rem_step.get('id', str(remaining_idx)),
                            input_data=rem_step.get('config', {}),
                            status='pending',
                            scheduled_for=step_exec.scheduled_for
                        )
                        db.session.add(rem_exec)
                    break
                continue

            # Esegui step
            try:
                step_exec.status = 'running'
                step_exec.started_at = datetime.utcnow()
                db.session.commit()

                result = AdminAutomationService.execute_step(step_type, step_config, context)

                step_exec.status = 'completed'
                step_exec.output_data = result
                step_exec.completed_at = datetime.utcnow()

                context['last_step_output'] = result

                # Gestisci branching per condition
                if step_type == 'condition' and result:
                    condition_met = result.get('condition_met', False)
                    skip_branch = 'if_false' if condition_met else 'if_true'
                    skip_branches.add(f"{step_id}:{skip_branch}")

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

        # Aggiorna workflow stats
        workflow.last_run = datetime.utcnow()
        workflow.executions_count = (workflow.executions_count or 0) + 1
        workflow.last_status = execution.status

        db.session.commit()
        return execution

    @staticmethod
    def _enroll_in_sequence(workflow, trigger_data):
        """Enrolla un lead in una sequenza email"""
        lead_id = trigger_data.get('entity_id')
        if not lead_id:
            return None

        # Check deduplicazione: non enrollare se gia attivo
        existing = AdminWorkflowEnrollment.query.filter_by(
            workflow_id=workflow.id,
            lead_id=lead_id,
            status='active'
        ).first()
        if existing:
            return None

        steps = workflow.steps or []
        first_delay = 0
        for step in steps:
            if step.get('type') == 'delay':
                cfg = step.get('config', {})
                first_delay = cfg.get('minutes', 0) + cfg.get('hours', 0) * 60 + cfg.get('days', 0) * 1440
                break

        enrollment = AdminWorkflowEnrollment(
            workflow_id=workflow.id,
            lead_id=lead_id,
            status='active',
            current_step_index=0,
            next_send_at=datetime.utcnow() + timedelta(minutes=first_delay) if first_delay else datetime.utcnow(),
            enrolled_at=datetime.utcnow()
        )
        db.session.add(enrollment)
        db.session.commit()
        return enrollment

    @staticmethod
    def execute_step(step_type, config, context):
        """Esegue un singolo step"""
        handler = AdminAutomationService.STEP_HANDLERS.get(step_type)
        if not handler:
            raise ValueError(f"Handler non trovato per step type: {step_type}")
        return handler(config, context)

    @staticmethod
    def execute_pending_steps():
        """Esegue step pendenti con delay scaduto"""
        now = datetime.utcnow()
        pending_steps = AdminWorkflowStepExecution.query.filter(
            AdminWorkflowStepExecution.status == 'pending',
            AdminWorkflowStepExecution.scheduled_for <= now,
            AdminWorkflowStepExecution.scheduled_for.isnot(None)
        ).all()

        for step_exec in pending_steps:
            try:
                execution = step_exec.execution
                workflow = execution.workflow

                context = AdminAutomationService._build_admin_context(execution.trigger_data)

                step_exec.status = 'running'
                step_exec.started_at = datetime.utcnow()
                db.session.commit()

                result = AdminAutomationService.execute_step(
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
        AdminAutomationService._update_execution_statuses()

    @staticmethod
    def _update_execution_statuses():
        """Aggiorna status delle execution con step pendenti completati"""
        partial_executions = AdminWorkflowExecution.query.filter_by(status='partial').all()

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
    def _build_admin_context(trigger_data):
        """Costruisce il context per l'esecuzione degli step admin"""
        context = {
            'trigger_data': trigger_data or {},
            'now': datetime.utcnow()
        }

        if not trigger_data:
            return context

        entity_type = trigger_data.get('entity_type')
        entity_id = trigger_data.get('entity_id')

        if entity_type == 'lead' and entity_id:
            lead = CRMLead.query.get(entity_id)
            if lead:
                context['lead'] = {
                    'id': lead.id,
                    'nome_club': lead.nome_club,
                    'contatto_nome': lead.contatto_nome,
                    'contatto_cognome': lead.contatto_cognome,
                    'contatto_email': lead.contatto_email,
                    'contatto_telefono': lead.contatto_telefono,
                    'contatto_ruolo': getattr(lead, 'contatto_ruolo', None),
                    'referente_nome': getattr(lead, 'referente_nome', None),
                    'referente_email': getattr(lead, 'referente_email', None),
                    'stage': lead.stage,
                    'temperatura': lead.temperatura,
                    'valore_stimato': lead.valore_stimato,
                    'probabilita': getattr(lead, 'probabilita', None),
                    'tipologia_sport': lead.tipologia_sport,
                    'citta': lead.citta,
                    'provincia': getattr(lead, 'provincia', None),
                    'regione': getattr(lead, 'regione', None),
                    'fonte': lead.fonte,
                    'score': getattr(lead, 'score', None),
                    'priorita': getattr(lead, 'priorita', None),
                    'prossima_azione': getattr(lead, 'prossima_azione', None),
                    'data_prossima_azione': lead.data_prossima_azione.isoformat() if getattr(lead, 'data_prossima_azione', None) else None,
                }

        elif entity_type == 'contract' and entity_id:
            contract = AdminContract.query.get(entity_id)
            if contract:
                context['contract'] = {
                    'id': contract.id,
                    'club_id': contract.club_id,
                    'plan_type': contract.plan_type,
                    'plan_price': contract.plan_price,
                    'total_value': contract.total_value,
                    'vat_rate': contract.vat_rate,
                    'start_date': contract.start_date.isoformat() if contract.start_date else None,
                    'end_date': contract.end_date.isoformat() if contract.end_date else None,
                    'renewal_date': contract.renewal_date.isoformat() if getattr(contract, 'renewal_date', None) else None,
                    'status': contract.status,
                    'payment_terms': getattr(contract, 'payment_terms', None),
                    'signed_by': getattr(contract, 'signed_by', None),
                }
                # Carica anche il club
                club = Club.query.get(contract.club_id)
                if club:
                    context['club'] = {
                        'id': club.id,
                        'nome': club.nome,
                        'email': club.email,
                    }

        elif entity_type == 'invoice' and entity_id:
            invoice = AdminInvoice.query.get(entity_id)
            if invoice:
                context['invoice'] = {
                    'id': invoice.id,
                    'invoice_number': invoice.invoice_number,
                    'amount': invoice.amount,
                    'vat_amount': invoice.vat_amount,
                    'total_amount': invoice.total_amount,
                    'status': invoice.status,
                    'issue_date': invoice.issue_date.isoformat() if invoice.issue_date else None,
                    'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
                    'payment_date': invoice.payment_date.isoformat() if invoice.payment_date else None,
                    'contract_id': invoice.contract_id,
                    'club_id': invoice.club_id,
                }
                # Carica club associato
                if invoice.club_id:
                    club = Club.query.get(invoice.club_id)
                    if club:
                        context['club'] = {
                            'id': club.id,
                            'nome': club.nome,
                            'email': club.email,
                        }

        elif entity_type == 'booking' and entity_id:
            booking = DemoBooking.query.get(entity_id)
            if booking:
                context['booking'] = {
                    'id': booking.id,
                    'nome': booking.nome,
                    'cognome': booking.cognome,
                    'email': booking.email,
                    'nome_club': booking.nome_club,
                    'telefono': getattr(booking, 'telefono', None),
                    'sport_tipo': getattr(booking, 'sport_tipo', None),
                    'stato': getattr(booking, 'stato', None),
                    'durata': getattr(booking, 'durata', None),
                    'data_ora': booking.data_ora.isoformat() if booking.data_ora else None,
                }

        elif entity_type == 'club' and entity_id:
            club = Club.query.get(entity_id)
            if club:
                context['club'] = {
                    'id': club.id,
                    'nome': club.nome,
                    'email': club.email,
                    'tipologia': getattr(club, 'tipologia', None),
                    'telefono': getattr(club, 'telefono', None),
                    'citta': getattr(club, 'citta', None),
                    'referente_nome': getattr(club, 'referente_nome', None),
                    'account_attivo': getattr(club, 'account_attivo', None),
                }

        elif entity_type == 'task' and entity_id:
            task = AdminTask.query.get(entity_id)
            if task:
                context['task'] = {
                    'id': task.id,
                    'titolo': task.titolo,
                    'descrizione': task.descrizione,
                    'tipo': task.tipo,
                    'priorita': task.priorita,
                    'stato': task.stato,
                    'lead_id': task.lead_id,
                    'club_id': task.club_id,
                    'data_scadenza': task.data_scadenza.isoformat() if task.data_scadenza else None,
                }

        elif entity_type == 'calendar_event' and entity_id:
            event = AdminCalendarEvent.query.get(entity_id)
            if event:
                context['calendar_event'] = {
                    'id': event.id,
                    'titolo': event.titolo,
                    'tipo': event.tipo,
                    'descrizione': getattr(event, 'descrizione', None),
                    'data_inizio': event.data_inizio.isoformat() if event.data_inizio else None,
                    'data_fine': event.data_fine.isoformat() if event.data_fine else None,
                    'lead_id': event.lead_id,
                    'club_id': event.club_id,
                }

        # Aggiungi dati extra dal trigger
        for key, value in (trigger_data or {}).items():
            if key not in ('entity_type', 'entity_id') and key not in context:
                context[key] = value

        return context

    @staticmethod
    def render_template(template_str, context):
        """Sostituzione variabili {{lead.nome_club}}, {{contract.total_value}}, ecc."""
        if not template_str:
            return template_str

        def replacer(match):
            path = match.group(1).strip()
            value = AdminAutomationService._get_nested_value(context, path)
            return str(value) if value is not None else ''

        return re.sub(r'\{\{(.+?)\}\}', replacer, template_str)

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
    def check_conditions(conditions, context):
        """Verifica se le condizioni sono soddisfatte"""
        if not conditions:
            return True

        rules = conditions.get('rules', [])
        operator = conditions.get('operator', 'AND')

        if not rules:
            return True

        results = []
        for rule in rules:
            field_path = rule.get('field', '')
            op = rule.get('operator', 'equals')
            expected_value = rule.get('value')

            actual_value = AdminAutomationService._get_nested_value(context, field_path)
            result = AdminAutomationService._evaluate_condition(actual_value, op, expected_value)
            results.append(result)

        if operator == 'AND':
            return all(results)
        else:
            return any(results)

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
        elif operator == 'greater_than':
            try:
                return float(actual) > float(expected)
            except (ValueError, TypeError):
                return False
        elif operator == 'less_than':
            try:
                return float(actual) < float(expected)
            except (ValueError, TypeError):
                return False
        elif operator == 'is_empty':
            return not actual
        elif operator == 'is_not_empty':
            return bool(actual)
        elif operator == 'in_list':
            return actual in (expected if isinstance(expected, list) else [expected])

        return False


# ==================== STEP HANDLERS ====================

@AdminAutomationService.register_handler('send_email')
def handle_send_email(config, context):
    """Invia email via account Aruba admin"""
    from app.services.admin_email_service import AdminEmailService

    account_key = config.get('account_key', 'hello')
    to_email = AdminAutomationService.render_template(config.get('to', ''), context)
    subject = AdminAutomationService.render_template(config.get('oggetto', ''), context)

    template_id = config.get('template_id')
    if template_id:
        template = AdminEmailTemplate.query.get(template_id)
        if template:
            body_html = AdminAutomationService.render_template(template.corpo_html, context)
        else:
            body_html = AdminAutomationService.render_template(config.get('corpo', ''), context)
    else:
        body_html = AdminAutomationService.render_template(config.get('corpo', ''), context)

    AdminEmailService.send_email(
        account_key=account_key,
        to=to_email,
        subject=subject,
        body_html=body_html,
        cc=config.get('cc'),
        bcc=config.get('bcc')
    )

    return {'to': to_email, 'subject': subject, 'sent': True}


@AdminAutomationService.register_handler('create_task')
def handle_create_task(config, context):
    """Crea task admin"""
    trigger_data = context.get('trigger_data', {})

    titolo = AdminAutomationService.render_template(config.get('titolo', ''), context)
    descrizione = AdminAutomationService.render_template(config.get('descrizione', ''), context)

    lead_id = config.get('lead_id')
    if not lead_id and trigger_data.get('entity_type') == 'lead':
        lead_id = trigger_data.get('entity_id')

    club_id = config.get('club_id')
    if not club_id and trigger_data.get('entity_type') == 'club':
        club_id = trigger_data.get('entity_id')

    scadenza = None
    if config.get('scadenza_giorni'):
        scadenza = datetime.utcnow() + timedelta(days=config['scadenza_giorni'])

    task = AdminTask(
        titolo=titolo,
        descrizione=descrizione,
        tipo=config.get('tipo', 'generale'),
        priorita=config.get('priorita', 'media'),
        stato='da_fare',
        lead_id=lead_id,
        club_id=club_id,
        data_scadenza=scadenza
    )
    db.session.add(task)
    db.session.commit()

    return {'task_id': task.id, 'titolo': titolo}


@AdminAutomationService.register_handler('create_notification')
def handle_create_notification(config, context):
    """Crea notifica admin"""
    titolo = AdminAutomationService.render_template(config.get('titolo', ''), context)
    messaggio = AdminAutomationService.render_template(config.get('messaggio', ''), context)
    link = AdminAutomationService.render_template(config.get('link', ''), context)

    notification = Notification(
        user_type='admin',
        user_id=config.get('admin_id', 1),
        tipo=config.get('tipo', 'automazione'),
        titolo=titolo,
        messaggio=messaggio,
        link=link,
        priorita=config.get('priorita', 'normale')
    )
    db.session.add(notification)
    db.session.commit()

    return {'notification_id': notification.id}


@AdminAutomationService.register_handler('update_lead_stage')
def handle_update_lead_stage(config, context):
    """Cambia stage di un lead + log activity"""
    trigger_data = context.get('trigger_data', {})
    lead_id = config.get('lead_id') or trigger_data.get('entity_id')
    new_stage = config.get('new_stage')

    if not lead_id or not new_stage:
        raise ValueError("lead_id e new_stage sono richiesti")

    lead = CRMLead.query.get(lead_id)
    if not lead:
        raise ValueError(f"Lead {lead_id} non trovato")

    old_stage = lead.stage
    lead.stage = new_stage
    lead.updated_at = datetime.utcnow()

    activity = CRMLeadActivity(
        lead_id=lead.id,
        tipo='stage_change',
        descrizione=f"[Automazione] Stage cambiato da {old_stage} a {new_stage}"
    )
    db.session.add(activity)
    db.session.commit()

    return {'lead_id': lead_id, 'old_stage': old_stage, 'new_stage': new_stage}


@AdminAutomationService.register_handler('update_lead_temperature')
def handle_update_lead_temperature(config, context):
    """Aggiorna temperatura lead"""
    trigger_data = context.get('trigger_data', {})
    lead_id = config.get('lead_id') or trigger_data.get('entity_id')
    new_temp = config.get('new_temperatura')

    if not lead_id or not new_temp:
        raise ValueError("lead_id e new_temperatura sono richiesti")

    lead = CRMLead.query.get(lead_id)
    if not lead:
        raise ValueError(f"Lead {lead_id} non trovato")

    old_temp = lead.temperatura
    lead.temperatura = new_temp
    lead.updated_at = datetime.utcnow()
    db.session.commit()

    return {'lead_id': lead_id, 'old_temperatura': old_temp, 'new_temperatura': new_temp}


@AdminAutomationService.register_handler('delay')
def handle_delay(config, context):
    """Delay - gestito a livello di execute_workflow"""
    minutes = config.get('minutes', 0)
    hours = config.get('hours', 0)
    days = config.get('days', 0)
    total_minutes = minutes + (hours * 60) + (days * 24 * 60)
    return {'delay_minutes': total_minutes, 'scheduled': True}


@AdminAutomationService.register_handler('condition')
def handle_condition(config, context):
    """Valuta condizioni, ritorna branch"""
    conditions = config.get('conditions', {})
    result = AdminAutomationService.check_conditions(conditions, context)
    return {'condition_met': result}


@AdminAutomationService.register_handler('webhook')
def handle_webhook(config, context):
    """Chiama URL esterno"""
    url = config.get('url')
    if not url:
        raise ValueError("URL richiesto per webhook")

    method = config.get('method', 'POST').upper()
    headers = config.get('headers', {})

    body_template = config.get('body', '{}')
    body_str = AdminAutomationService.render_template(body_template, context)

    try:
        body = json.loads(body_str)
    except (json.JSONDecodeError, TypeError):
        body = {'data': body_str}

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


@AdminAutomationService.register_handler('update_contract_status')
def handle_update_contract_status(config, context):
    """Aggiorna stato contratto"""
    trigger_data = context.get('trigger_data', {})
    contract_id = config.get('contract_id') or trigger_data.get('entity_id')
    new_status = config.get('new_status')

    if not contract_id or not new_status:
        raise ValueError("contract_id e new_status sono richiesti")

    contract = AdminContract.query.get(contract_id)
    if not contract:
        raise ValueError(f"Contratto {contract_id} non trovato")

    old_status = contract.status
    contract.status = new_status
    db.session.commit()

    return {'contract_id': contract_id, 'old_status': old_status, 'new_status': new_status}


@AdminAutomationService.register_handler('update_task_status')
def handle_update_task_status(config, context):
    """Aggiorna stato task"""
    trigger_data = context.get('trigger_data', {})
    task_id = config.get('task_id') or trigger_data.get('entity_id')
    new_status = config.get('new_status')

    if not task_id or not new_status:
        raise ValueError("task_id e new_status sono richiesti")

    task = AdminTask.query.get(task_id)
    if not task:
        raise ValueError(f"Task {task_id} non trovato")

    old_status = task.stato
    task.stato = new_status
    if new_status == 'completato':
        task.completato_il = datetime.utcnow()
    db.session.commit()

    return {'task_id': task_id, 'old_status': old_status, 'new_status': new_status}


@AdminAutomationService.register_handler('create_calendar_event')
def handle_create_calendar_event(config, context):
    """Crea evento calendario"""
    titolo = AdminAutomationService.render_template(config.get('titolo', ''), context)
    descrizione = AdminAutomationService.render_template(config.get('descrizione', ''), context)
    days_offset = config.get('days_offset', 0)
    durata_ore = config.get('durata_ore', 1)
    data_inizio = datetime.utcnow() + timedelta(days=days_offset)

    event = AdminCalendarEvent(
        admin_id=1,
        titolo=titolo,
        descrizione=descrizione,
        tipo=config.get('tipo', 'appuntamento'),
        data_inizio=data_inizio,
        data_fine=data_inizio + timedelta(hours=durata_ore),
    )

    trigger_data = context.get('trigger_data', {})
    if trigger_data.get('entity_type') == 'lead':
        event.lead_id = trigger_data.get('entity_id')
    elif trigger_data.get('entity_type') == 'club':
        event.club_id = trigger_data.get('entity_id')
    # Usa lead_id/club_id dai dati trigger extra se presenti
    if trigger_data.get('lead_id'):
        event.lead_id = trigger_data.get('lead_id')
    if trigger_data.get('club_id'):
        event.club_id = trigger_data.get('club_id')

    db.session.add(event)
    db.session.commit()

    return {'event_id': event.id, 'titolo': titolo}


@AdminAutomationService.register_handler('log_lead_activity')
def handle_log_lead_activity(config, context):
    """Registra attivita lead"""
    trigger_data = context.get('trigger_data', {})
    lead_id = config.get('lead_id') or trigger_data.get('entity_id')

    if not lead_id:
        raise ValueError("lead_id richiesto")

    titolo = AdminAutomationService.render_template(config.get('titolo', ''), context)
    descrizione = AdminAutomationService.render_template(config.get('descrizione', ''), context)

    activity = CRMLeadActivity(
        lead_id=lead_id,
        tipo=config.get('tipo', 'nota'),
        titolo=titolo,
        descrizione=descrizione
    )
    db.session.add(activity)
    db.session.commit()

    return {'activity_id': activity.id}


@AdminAutomationService.register_handler('update_lead_field')
def handle_update_lead_field(config, context):
    """Aggiorna campo lead"""
    trigger_data = context.get('trigger_data', {})
    lead_id = config.get('lead_id') or trigger_data.get('entity_id')

    if not lead_id:
        raise ValueError("lead_id richiesto")

    lead = CRMLead.query.get(lead_id)
    if not lead:
        raise ValueError(f"Lead {lead_id} non trovato")

    field_name = config.get('field_name')
    value = config.get('value')

    ALLOWED_FIELDS = ['valore_stimato', 'probabilita', 'fonte', 'temperatura',
                      'prossima_azione', 'data_prossimo_contatto', 'tags', 'note', 'priorita']
    if field_name not in ALLOWED_FIELDS:
        raise ValueError(f"Campo non consentito: {field_name}")

    old_value = getattr(lead, field_name, None)
    setattr(lead, field_name, value)
    db.session.commit()

    return {'field': field_name, 'old_value': str(old_value), 'new_value': str(value)}


@AdminAutomationService.register_handler('enroll_in_sequence')
def handle_enroll_in_sequence(config, context):
    """Iscrivi lead a sequenza email"""
    trigger_data = context.get('trigger_data', {})
    lead_id = trigger_data.get('entity_id')
    workflow_id = config.get('workflow_id')

    if not lead_id or not workflow_id:
        raise ValueError("lead_id e workflow_id sono richiesti")

    existing = AdminWorkflowEnrollment.query.filter_by(
        workflow_id=workflow_id, lead_id=lead_id, status='active').first()
    if existing:
        return {'already_enrolled': True}

    enrollment = AdminWorkflowEnrollment(
        workflow_id=workflow_id,
        lead_id=lead_id,
        status='active',
        current_step_index=0,
        next_send_at=datetime.utcnow(),
        enrolled_at=datetime.utcnow()
    )
    db.session.add(enrollment)
    db.session.commit()

    return {'enrollment_id': enrollment.id}


@AdminAutomationService.register_handler('remove_from_sequence')
def handle_remove_from_sequence(config, context):
    """Rimuovi lead da sequenza email"""
    trigger_data = context.get('trigger_data', {})
    lead_id = trigger_data.get('entity_id')
    workflow_id = config.get('workflow_id')

    if not lead_id or not workflow_id:
        raise ValueError("lead_id e workflow_id sono richiesti")

    enrollment = AdminWorkflowEnrollment.query.filter_by(
        workflow_id=workflow_id, lead_id=lead_id, status='active').first()
    if enrollment:
        enrollment.status = 'removed'
        enrollment.exited_at = datetime.utcnow()
        enrollment.exit_reason = 'Rimosso da automazione'
        db.session.commit()
        return {'removed': True}
    return {'removed': False}


@AdminAutomationService.register_handler('send_whatsapp')
def handle_send_whatsapp(config, context):
    """Invia messaggio WhatsApp tramite sidecar Node.js"""
    import re

    to = AdminAutomationService.render_template(config.get('to', ''), context)
    messaggio = AdminAutomationService.render_template(config.get('messaggio', ''), context)

    if not to or not messaggio:
        raise ValueError("Numero destinatario e messaggio sono richiesti")

    # Normalizza numero: rimuovi +, spazi, trattini
    to_normalized = re.sub(r'[\s\-\+]', '', to)

    resp = requests.post('http://localhost:3200/send', json={
        'to': to_normalized,
        'message': messaggio
    }, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    return {'to': to_normalized, 'message_id': data.get('message_id'), 'sent': True}
