"""
Automation Triggers - Gestione trigger real-time
"""
from datetime import datetime
from app import db
from app.models import Automation
from app.services.automation_service import AutomationService


class AutomationTriggers:
    """
    Gestisce i trigger real-time per le automazioni.
    Chiamato dalle route quando avvengono eventi specifici.
    """

    @staticmethod
    def fire_trigger(club_id, trigger_type, entity_data):
        """
        Trova ed esegue tutte le automazioni che matchano il trigger

        Args:
            club_id: ID del club
            trigger_type: Tipo di trigger (lead_created, contract_expiring, etc.)
            entity_data: Dict con dati dell'entità {entity_type, entity_id, ...extra_data}

        Returns:
            list: Lista di AutomationExecution create
        """
        # Trova automazioni attive per questo trigger
        automations = Automation.query.filter(
            Automation.club_id == club_id,
            Automation.abilitata == True,
            Automation.trigger_type == trigger_type
        ).all()

        executions = []

        for automation in automations:
            try:
                # Verifica condizioni del trigger
                if AutomationTriggers._check_trigger_conditions(automation, entity_data):
                    execution = AutomationService.execute_automation(automation, entity_data)
                    executions.append(execution)
            except Exception as e:
                print(f"[AutomationTriggers] Error executing automation {automation.id}: {e}")

        return executions

    @staticmethod
    def _check_trigger_conditions(automation, entity_data):
        """
        Verifica che le condizioni del trigger siano soddisfatte

        Args:
            automation: Oggetto Automation
            entity_data: Dati dell'entità

        Returns:
            bool: True se le condizioni sono soddisfatte
        """
        trigger_config = automation.trigger_config or {}

        # Verifica filtri specifici per trigger type
        filters = trigger_config.get('filters', {})

        for field, expected_value in filters.items():
            actual_value = entity_data.get(field)

            # Se è una lista, controlla se il valore è nella lista
            if isinstance(expected_value, list):
                if actual_value not in expected_value:
                    return False
            # Altrimenti confronto diretto
            elif actual_value != expected_value:
                return False

        return True


# ==================== HELPER FUNCTIONS PER TRIGGER SPECIFICI ====================

def trigger_lead_created(club_id, lead):
    """
    Trigger: Nuovo lead creato
    Chiamare dopo db.session.commit() nella creazione lead
    """
    entity_data = {
        'entity_type': 'lead',
        'entity_id': lead.id,
        'ragione_sociale': lead.ragione_sociale,
        'email': lead.email,
        'status': lead.status,
        'fonte': lead.fonte,
        'settore_merceologico': lead.settore_merceologico
    }
    return AutomationTriggers.fire_trigger(club_id, 'lead_created', entity_data)


def trigger_lead_status_changed(club_id, lead, old_status, new_status):
    """
    Trigger: Cambio status lead
    """
    entity_data = {
        'entity_type': 'lead',
        'entity_id': lead.id,
        'ragione_sociale': lead.ragione_sociale,
        'old_status': old_status,
        'new_status': new_status,
        'status': new_status
    }
    return AutomationTriggers.fire_trigger(club_id, 'lead_status_changed', entity_data)


def trigger_lead_converted(club_id, lead, sponsor):
    """
    Trigger: Lead convertito in sponsor
    """
    entity_data = {
        'entity_type': 'lead',
        'entity_id': lead.id,
        'lead_ragione_sociale': lead.ragione_sociale,
        'sponsor_id': sponsor.id,
        'sponsor_ragione_sociale': sponsor.ragione_sociale
    }
    return AutomationTriggers.fire_trigger(club_id, 'lead_converted', entity_data)


def trigger_sponsor_created(club_id, sponsor):
    """
    Trigger: Nuovo sponsor creato
    """
    entity_data = {
        'entity_type': 'sponsor',
        'entity_id': sponsor.id,
        'ragione_sociale': sponsor.ragione_sociale,
        'email': sponsor.email,
        'settore_merceologico': sponsor.settore_merceologico
    }
    return AutomationTriggers.fire_trigger(club_id, 'sponsor_created', entity_data)


def trigger_sponsor_activated(club_id, sponsor, activated):
    """
    Trigger: Sponsor attivato/disattivato
    """
    trigger_type = 'sponsor_activated' if activated else 'sponsor_deactivated'
    entity_data = {
        'entity_type': 'sponsor',
        'entity_id': sponsor.id,
        'ragione_sociale': sponsor.ragione_sociale,
        'account_attivo': activated
    }
    return AutomationTriggers.fire_trigger(club_id, trigger_type, entity_data)


def trigger_contract_created(club_id, contract):
    """
    Trigger: Nuovo contratto creato
    """
    entity_data = {
        'entity_type': 'contract',
        'entity_id': contract.id,
        'nome_contratto': contract.nome_contratto,
        'compenso': contract.compenso,
        'sponsor_id': contract.sponsor_id,
        'status': contract.status
    }
    return AutomationTriggers.fire_trigger(club_id, 'contract_created', entity_data)


def trigger_contract_expiring(club_id, contract, days_until_expiry):
    """
    Trigger: Contratto in scadenza
    Chiamare da scheduler giornaliero
    """
    entity_data = {
        'entity_type': 'contract',
        'entity_id': contract.id,
        'nome_contratto': contract.nome_contratto,
        'compenso': contract.compenso,
        'sponsor_id': contract.sponsor_id,
        'days_until_expiry': days_until_expiry,
        'data_fine': contract.data_fine.isoformat() if contract.data_fine else None
    }
    return AutomationTriggers.fire_trigger(club_id, 'contract_expiring', entity_data)


def trigger_contract_expired(club_id, contract):
    """
    Trigger: Contratto scaduto
    """
    entity_data = {
        'entity_type': 'contract',
        'entity_id': contract.id,
        'nome_contratto': contract.nome_contratto,
        'sponsor_id': contract.sponsor_id
    }
    return AutomationTriggers.fire_trigger(club_id, 'contract_expired', entity_data)


def trigger_match_created(club_id, match):
    """
    Trigger: Nuova partita creata
    """
    entity_data = {
        'entity_type': 'match',
        'entity_id': match.id,
        'squadra_casa': match.squadra_casa,
        'squadra_trasferta': match.squadra_trasferta,
        'data_ora': match.data_ora.isoformat() if match.data_ora else None,
        'competizione': match.competizione
    }
    return AutomationTriggers.fire_trigger(club_id, 'match_created', entity_data)


def trigger_match_starting(club_id, match, hours_until):
    """
    Trigger: Partita in arrivo
    Chiamare da scheduler
    """
    entity_data = {
        'entity_type': 'match',
        'entity_id': match.id,
        'squadra_casa': match.squadra_casa,
        'squadra_trasferta': match.squadra_trasferta,
        'hours_until': hours_until
    }
    return AutomationTriggers.fire_trigger(club_id, 'match_starting', entity_data)


def trigger_event_created(club_id, event):
    """
    Trigger: Nuovo evento creato
    """
    entity_data = {
        'entity_type': 'event',
        'entity_id': event.id,
        'titolo': event.titolo,
        'tipo': event.tipo,
        'data_ora_inizio': event.data_ora_inizio.isoformat() if event.data_ora_inizio else None
    }
    return AutomationTriggers.fire_trigger(club_id, 'event_created', entity_data)


def trigger_event_registration(club_id, event, sponsor):
    """
    Trigger: Nuova iscrizione a evento
    """
    entity_data = {
        'entity_type': 'event',
        'entity_id': event.id,
        'titolo': event.titolo,
        'sponsor_id': sponsor.id,
        'sponsor_ragione_sociale': sponsor.ragione_sociale
    }
    return AutomationTriggers.fire_trigger(club_id, 'event_registration', entity_data)


def trigger_message_received(club_id, message, sender_type, sender_id):
    """
    Trigger: Nuovo messaggio ricevuto
    """
    entity_data = {
        'entity_type': 'message',
        'entity_id': message.id,
        'sender_type': sender_type,
        'sender_id': sender_id,
        'contract_id': message.contract_id
    }
    return AutomationTriggers.fire_trigger(club_id, 'message_received', entity_data)


def trigger_budget_threshold(club_id, budget, percentage):
    """
    Trigger: Soglia budget raggiunta
    """
    entity_data = {
        'entity_type': 'budget',
        'entity_id': budget.id,
        'percentage': percentage,
        'importo_totale': budget.importo_totale,
        'importo_speso': budget.importo_speso
    }
    return AutomationTriggers.fire_trigger(club_id, 'budget_threshold', entity_data)


def trigger_payment_overdue(club_id, payment, contract):
    """
    Trigger: Pagamento scaduto
    """
    entity_data = {
        'entity_type': 'payment',
        'entity_id': payment.id,
        'importo': payment.importo,
        'data_prevista': payment.data_prevista.isoformat() if payment.data_prevista else None,
        'contract_id': contract.id,
        'sponsor_id': contract.sponsor_id
    }
    return AutomationTriggers.fire_trigger(club_id, 'payment_overdue', entity_data)


def trigger_milestone_completed(club_id, milestone, project):
    """
    Trigger: Milestone progetto completato
    """
    entity_data = {
        'entity_type': 'milestone',
        'entity_id': milestone.id,
        'titolo': milestone.titolo,
        'project_id': project.id,
        'project_nome': project.nome
    }
    return AutomationTriggers.fire_trigger(club_id, 'milestone_completed', entity_data)


def trigger_task_overdue(club_id, task, project):
    """
    Trigger: Task in ritardo
    """
    entity_data = {
        'entity_type': 'task',
        'entity_id': task.id,
        'titolo': task.titolo,
        'project_id': project.id,
        'assegnato_a_type': task.assegnato_a_type,
        'assegnato_a_id': task.assegnato_a_id
    }
    return AutomationTriggers.fire_trigger(club_id, 'task_overdue', entity_data)


def trigger_opportunity_published(club_id, opportunity):
    """
    Trigger: Nuova opportunità marketplace pubblicata
    """
    entity_data = {
        'entity_type': 'opportunity',
        'entity_id': opportunity.id,
        'titolo': opportunity.titolo,
        'tipo_opportunita': opportunity.tipo_opportunita
    }
    return AutomationTriggers.fire_trigger(club_id, 'opportunity_published', entity_data)


def trigger_application_received(club_id, application, opportunity):
    """
    Trigger: Nuova candidatura a opportunità
    """
    entity_data = {
        'entity_type': 'application',
        'entity_id': application.id,
        'opportunity_id': opportunity.id,
        'opportunity_titolo': opportunity.titolo,
        'sponsor_id': application.sponsor_id
    }
    return AutomationTriggers.fire_trigger(club_id, 'application_received', entity_data)
