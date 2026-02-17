"""
Admin Automation Triggers - Gestione trigger real-time per workflow admin
"""
from datetime import datetime, date
from app import db
from app.models import AdminWorkflow, AdminWorkflowExecution
from app.services.admin_automation_service import AdminAutomationService


class AdminAutomationTriggers:
    """
    Gestisce i trigger real-time per i workflow admin.
    Chiamato dalle route quando avvengono eventi specifici.
    """

    @staticmethod
    def fire_trigger(trigger_type, entity_data):
        """
        Trova ed esegue tutti i workflow attivi che matchano il trigger.

        Args:
            trigger_type: Tipo di trigger (lead_created, lead_stage_changed, etc.)
            entity_data: Dict con dati dell'entita {entity_type, entity_id, ...extra_data}

        Returns:
            list: Lista di esecuzioni/enrollment create
        """
        workflows = AdminWorkflow.query.filter(
            AdminWorkflow.abilitata == True,
            AdminWorkflow.trigger_type == trigger_type
        ).all()

        results = []

        for workflow in workflows:
            try:
                if AdminAutomationTriggers._check_trigger_conditions(workflow, entity_data):
                    # Deduplicazione: non eseguire lo stesso workflow per la stessa entita nello stesso giorno
                    if AdminAutomationTriggers._is_duplicate(workflow, entity_data):
                        continue

                    result = AdminAutomationService.execute_workflow(workflow, entity_data)
                    if result:
                        results.append(result)
            except Exception as e:
                print(f"[AdminAutomationTriggers] Error executing workflow {workflow.id}: {e}")

        return results

    @staticmethod
    def _check_trigger_conditions(workflow, entity_data):
        """Verifica che le condizioni del trigger siano soddisfatte"""
        trigger_config = workflow.trigger_config or {}

        # Filtri specifici per trigger type
        if workflow.trigger_type == 'lead_stage_changed':
            from_stage = trigger_config.get('from_stage')
            to_stage = trigger_config.get('to_stage')
            if from_stage and entity_data.get('old_stage') != from_stage:
                return False
            if to_stage and entity_data.get('new_stage') != to_stage:
                return False

        if workflow.trigger_type == 'contract_status_changed':
            from_status = trigger_config.get('from_status')
            to_status = trigger_config.get('to_status')
            if from_status and entity_data.get('old_status') != from_status:
                return False
            if to_status and entity_data.get('new_status') != to_status:
                return False

        # Filtri generici
        filters = trigger_config.get('filters', {})
        for field, expected_value in filters.items():
            actual_value = entity_data.get(field)
            if isinstance(expected_value, list):
                if actual_value not in expected_value:
                    return False
            elif actual_value != expected_value:
                return False

        return True

    @staticmethod
    def _is_duplicate(workflow, entity_data):
        """Controlla che lo stesso workflow non venga eseguito 2 volte per la stessa entita nello stesso giorno"""
        entity_id = entity_data.get('entity_id')
        if not entity_id:
            return False

        today_start = datetime.combine(date.today(), datetime.min.time())
        existing = AdminWorkflowExecution.query.filter(
            AdminWorkflowExecution.workflow_id == workflow.id,
            AdminWorkflowExecution.started_at >= today_start
        ).all()

        for exec_record in existing:
            if exec_record.trigger_data and exec_record.trigger_data.get('entity_id') == entity_id:
                return True

        return False


# ==================== HELPER FUNCTIONS PER TRIGGER SPECIFICI ====================

def trigger_admin_lead_created(lead):
    """Trigger: Nuovo lead CRM creato"""
    entity_data = {
        'entity_type': 'lead',
        'entity_id': lead.id,
        'nome_club': lead.nome_club,
        'contatto_email': lead.contatto_email,
        'stage': lead.stage,
        'temperatura': lead.temperatura,
        'fonte': lead.fonte,
        'tipologia_sport': lead.tipologia_sport,
    }
    return AdminAutomationTriggers.fire_trigger('lead_created', entity_data)


def trigger_admin_lead_stage_changed(lead, old_stage, new_stage):
    """Trigger: Cambio stage lead CRM"""
    entity_data = {
        'entity_type': 'lead',
        'entity_id': lead.id,
        'nome_club': lead.nome_club,
        'contatto_email': lead.contatto_email,
        'old_stage': old_stage,
        'new_stage': new_stage,
        'stage': new_stage,
        'temperatura': lead.temperatura,
    }
    return AdminAutomationTriggers.fire_trigger('lead_stage_changed', entity_data)


def trigger_admin_lead_converted(lead, club):
    """Trigger: Lead convertito in club"""
    entity_data = {
        'entity_type': 'lead',
        'entity_id': lead.id,
        'nome_club': lead.nome_club,
        'club_id': club.id,
        'club_nome': club.nome,
        'club_email': club.email,
    }
    return AdminAutomationTriggers.fire_trigger('lead_converted', entity_data)


def trigger_admin_contract_created(contract):
    """Trigger: Nuovo contratto admin creato"""
    entity_data = {
        'entity_type': 'contract',
        'entity_id': contract.id,
        'club_id': contract.club_id,
        'plan_type': contract.plan_type,
        'total_value': contract.total_value,
        'status': contract.status,
    }
    return AdminAutomationTriggers.fire_trigger('contract_created', entity_data)


def trigger_admin_booking_created(booking):
    """Trigger: Nuova demo booking creata"""
    entity_data = {
        'entity_type': 'booking',
        'entity_id': booking.id,
        'nome': booking.nome,
        'cognome': booking.cognome,
        'email': booking.email,
        'nome_club': booking.nome_club,
        'data_ora': booking.data_ora.isoformat() if booking.data_ora else None,
    }
    return AdminAutomationTriggers.fire_trigger('booking_created', entity_data)


def trigger_admin_club_created(club):
    """Trigger: Nuovo club creato"""
    entity_data = {
        'entity_type': 'club',
        'entity_id': club.id,
        'nome': club.nome,
        'email': club.email,
    }
    return AdminAutomationTriggers.fire_trigger('club_created', entity_data)


def trigger_admin_task_created(task):
    """Trigger: Nuovo task admin creato"""
    entity_data = {
        'entity_type': 'task',
        'entity_id': task.id,
        'titolo': task.titolo,
        'tipo': task.tipo,
        'priorita': task.priorita,
        'lead_id': task.lead_id,
        'club_id': task.club_id,
    }
    return AdminAutomationTriggers.fire_trigger('task_created', entity_data)


def trigger_admin_task_completed(task):
    """Trigger: Task admin completato"""
    entity_data = {
        'entity_type': 'task',
        'entity_id': task.id,
        'titolo': task.titolo,
        'tipo': task.tipo,
    }
    return AdminAutomationTriggers.fire_trigger('task_completed', entity_data)


def trigger_admin_invoice_created(invoice):
    """Trigger: Nuova fattura creata"""
    entity_data = {
        'entity_type': 'invoice',
        'entity_id': invoice.id,
        'invoice_number': invoice.invoice_number,
        'amount': invoice.amount,
        'total_amount': invoice.total_amount,
        'club_id': invoice.club_id,
        'status': invoice.status,
    }
    return AdminAutomationTriggers.fire_trigger('invoice_created', entity_data)


def trigger_admin_invoice_paid(invoice):
    """Trigger: Fattura pagata"""
    entity_data = {
        'entity_type': 'invoice',
        'entity_id': invoice.id,
        'invoice_number': invoice.invoice_number,
        'amount': invoice.amount,
        'total_amount': invoice.total_amount,
        'club_id': invoice.club_id,
    }
    return AdminAutomationTriggers.fire_trigger('invoice_paid', entity_data)


def trigger_admin_contract_status_changed(contract, old_status, new_status):
    """Trigger: Cambio stato contratto"""
    entity_data = {
        'entity_type': 'contract',
        'entity_id': contract.id,
        'club_id': contract.club_id,
        'plan_type': contract.plan_type,
        'total_value': contract.total_value,
        'old_status': old_status,
        'new_status': new_status,
    }
    return AdminAutomationTriggers.fire_trigger('contract_status_changed', entity_data)


def trigger_admin_calendar_event_created(event):
    """Trigger: Nuovo evento calendario creato"""
    entity_data = {
        'entity_type': 'calendar_event',
        'entity_id': event.id,
        'titolo': event.titolo,
        'tipo': event.tipo,
        'lead_id': event.lead_id,
        'club_id': event.club_id,
    }
    return AdminAutomationTriggers.fire_trigger('calendar_event_created', entity_data)


def trigger_admin_booking_confirmed(booking):
    """Trigger: Demo confermata"""
    entity_data = {
        'entity_type': 'booking',
        'entity_id': booking.id,
        'nome': booking.nome,
        'cognome': booking.cognome,
        'email': booking.email,
        'nome_club': booking.nome_club,
        'data_ora': booking.data_ora.isoformat() if booking.data_ora else None,
    }
    return AdminAutomationTriggers.fire_trigger('booking_confirmed', entity_data)
