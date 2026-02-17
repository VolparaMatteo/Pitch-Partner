"""
Automation Scheduler - Cron job interno per trigger temporali
"""
import threading
import time
from datetime import datetime, timedelta
from flask import current_app


class AutomationScheduler:
    """
    Scheduler interno per automazioni temporali.
    Gira in un thread separato e controlla periodicamente:
    - Automazioni schedulate (cron, interval)
    - Step pendenti con delay scaduto
    """

    def __init__(self, app=None):
        self.app = app
        self._thread = None
        self._running = False
        self._interval = 60  # Controlla ogni 60 secondi

    def init_app(self, app):
        self.app = app

    def start(self):
        """Avvia lo scheduler in un thread separato"""
        if self._running:
            return

        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print("[AutomationScheduler] Started")

    def stop(self):
        """Ferma lo scheduler"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        print("[AutomationScheduler] Stopped")

    def _run_loop(self):
        """Loop principale dello scheduler"""
        last_daily_check = None
        while self._running:
            try:
                with self.app.app_context():
                    self._check_scheduled_automations()
                    self._check_pending_steps()

                    # Admin workflow checks
                    self._check_admin_scheduled_workflows()
                    self._check_admin_pending_steps()
                    self._process_admin_email_sequences()

                    # Daily admin time-based triggers (1 volta al giorno)
                    today = datetime.utcnow().date()
                    if last_daily_check != today:
                        self._check_admin_time_based_triggers()
                        last_daily_check = today

            except Exception as e:
                print(f"[AutomationScheduler] Error: {e}")

            time.sleep(self._interval)

    def _check_scheduled_automations(self):
        """Controlla ed esegue automazioni schedulate"""
        from app import db
        from app.models import Automation
        from app.services.automation_service import AutomationService

        now = datetime.utcnow()

        # Trova automazioni con next_run passato
        due_automations = Automation.query.filter(
            Automation.abilitata == True,
            Automation.next_run <= now,
            Automation.trigger_type.in_(['scheduled', 'cron', 'interval'])
        ).all()

        for automation in due_automations:
            try:
                print(f"[AutomationScheduler] Executing scheduled automation: {automation.nome}")

                # Esegui automazione
                trigger_data = {
                    'entity_type': 'scheduled',
                    'scheduled_time': now.isoformat()
                }
                AutomationService.execute_automation(automation, trigger_data)

                # Calcola prossimo run
                automation.next_run = self._calculate_next_run(automation)
                db.session.commit()

            except Exception as e:
                print(f"[AutomationScheduler] Error executing {automation.nome}: {e}")

    def _check_pending_steps(self):
        """Esegue step pendenti con delay scaduto"""
        from app.services.automation_service import AutomationService

        try:
            AutomationService.execute_pending_steps()
        except Exception as e:
            print(f"[AutomationScheduler] Error executing pending steps: {e}")

    def _calculate_next_run(self, automation):
        """
        Calcola il prossimo run per un'automazione schedulata

        Supporta:
        - cron: espressione cron (es. "0 9 * * *")
        - interval: minuti tra esecuzioni
        - specific_date: data specifica (one-time)
        """
        config = automation.trigger_config or {}
        trigger_type = automation.trigger_type
        now = datetime.utcnow()

        if trigger_type == 'cron' or config.get('cron'):
            cron_expr = config.get('cron', '0 9 * * *')
            try:
                from croniter import croniter
                cron = croniter(cron_expr, now)
                return cron.get_next(datetime)
            except ImportError:
                # Se croniter non installato, fallback a domani stessa ora
                return now + timedelta(days=1)
            except Exception:
                return now + timedelta(days=1)

        elif trigger_type == 'interval' or config.get('interval_minutes'):
            interval = config.get('interval_minutes', 60)
            return now + timedelta(minutes=interval)

        elif trigger_type == 'specific_date':
            # One-time, disabilita dopo esecuzione
            automation.abilitata = False
            return None

        # Default: domani alla stessa ora
        return now + timedelta(days=1)

    # ==================== ADMIN WORKFLOW SCHEDULER ====================

    def _check_admin_scheduled_workflows(self):
        """Esegue workflow admin con trigger 'scheduled' dove next_run <= now"""
        from app import db
        from app.models import AdminWorkflow
        from app.services.admin_automation_service import AdminAutomationService

        now = datetime.utcnow()

        due_workflows = AdminWorkflow.query.filter(
            AdminWorkflow.abilitata == True,
            AdminWorkflow.trigger_type == 'scheduled',
            AdminWorkflow.next_run <= now
        ).all()

        for workflow in due_workflows:
            try:
                print(f"[AdminScheduler] Executing scheduled workflow: {workflow.nome}")

                trigger_data = {
                    'entity_type': 'scheduled',
                    'scheduled_time': now.isoformat()
                }
                AdminAutomationService.execute_workflow(workflow, trigger_data)

                # Calcola prossimo run
                config = workflow.trigger_config or {}
                if config.get('interval_minutes'):
                    workflow.next_run = now + timedelta(minutes=config['interval_minutes'])
                elif config.get('cron'):
                    try:
                        from croniter import croniter
                        cron = croniter(config['cron'], now)
                        workflow.next_run = cron.get_next(datetime)
                    except (ImportError, Exception):
                        workflow.next_run = now + timedelta(days=1)
                else:
                    workflow.next_run = now + timedelta(days=1)

                db.session.commit()

            except Exception as e:
                print(f"[AdminScheduler] Error executing {workflow.nome}: {e}")

    def _check_admin_pending_steps(self):
        """Esegue step admin pendenti con delay scaduto"""
        from app.services.admin_automation_service import AdminAutomationService

        try:
            AdminAutomationService.execute_pending_steps()
        except Exception as e:
            print(f"[AdminScheduler] Error executing pending steps: {e}")

    def _check_admin_time_based_triggers(self):
        """Controlla trigger temporali admin (1 volta al giorno)"""
        from app import db
        from app.models import (
            CRMLead, CRMLeadActivity, AdminContract, AdminInvoice, AdminTask
        )
        from app.services.admin_automation_triggers import AdminAutomationTriggers

        now = datetime.utcnow()

        # Lead inattivi
        try:
            from app.models import AdminWorkflow
            inactive_workflows = AdminWorkflow.query.filter_by(
                abilitata=True, trigger_type='lead_inactive'
            ).all()

            for wf in inactive_workflows:
                days = (wf.trigger_config or {}).get('days', 7)
                cutoff = now - timedelta(days=days)

                # Lead senza attivita recenti
                inactive_leads = CRMLead.query.filter(
                    CRMLead.stage.notin_(['vinto', 'perso']),
                    CRMLead.updated_at < cutoff
                ).all()

                for lead in inactive_leads:
                    last_activity = CRMLeadActivity.query.filter_by(
                        lead_id=lead.id
                    ).order_by(CRMLeadActivity.created_at.desc()).first()

                    if not last_activity or last_activity.created_at < cutoff:
                        entity_data = {
                            'entity_type': 'lead',
                            'entity_id': lead.id,
                            'nome_club': lead.nome_club,
                            'contatto_email': lead.contatto_email,
                            'days_inactive': days,
                        }
                        try:
                            AdminAutomationTriggers.fire_trigger('lead_inactive', entity_data)
                        except Exception as e:
                            print(f"[AdminScheduler] Lead inactive trigger error: {e}")
        except Exception as e:
            print(f"[AdminScheduler] Lead inactive check error: {e}")

        # Contratti in scadenza
        try:
            expiring_workflows = AdminWorkflow.query.filter_by(
                abilitata=True, trigger_type='contract_expiring'
            ).all()

            for wf in expiring_workflows:
                days = (wf.trigger_config or {}).get('days', 30)
                expiry_date = (now + timedelta(days=days)).date()

                contracts = AdminContract.query.filter(
                    AdminContract.status == 'active',
                    AdminContract.end_date <= expiry_date,
                    AdminContract.end_date > now.date()
                ).all()

                for contract in contracts:
                    entity_data = {
                        'entity_type': 'contract',
                        'entity_id': contract.id,
                        'club_id': contract.club_id,
                        'plan_type': contract.plan_type,
                        'total_value': contract.total_value,
                        'end_date': contract.end_date.isoformat() if contract.end_date else None,
                    }
                    try:
                        AdminAutomationTriggers.fire_trigger('contract_expiring', entity_data)
                    except Exception as e:
                        print(f"[AdminScheduler] Contract expiring trigger error: {e}")
        except Exception as e:
            print(f"[AdminScheduler] Contract expiring check error: {e}")

        # Contratti scaduti
        try:
            expired_contracts = AdminContract.query.filter(
                AdminContract.status == 'active',
                AdminContract.end_date < now.date()
            ).all()

            for contract in expired_contracts:
                entity_data = {
                    'entity_type': 'contract',
                    'entity_id': contract.id,
                    'club_id': contract.club_id,
                }
                try:
                    AdminAutomationTriggers.fire_trigger('contract_expired', entity_data)
                except Exception as e:
                    print(f"[AdminScheduler] Contract expired trigger error: {e}")
        except Exception as e:
            print(f"[AdminScheduler] Contract expired check error: {e}")

        # Fatture scadute
        try:
            overdue_workflows = AdminWorkflow.query.filter_by(
                abilitata=True, trigger_type='invoice_overdue'
            ).all()

            for wf in overdue_workflows:
                days = (wf.trigger_config or {}).get('days', 7)
                overdue_date = (now - timedelta(days=days)).date()

                invoices = AdminInvoice.query.filter(
                    AdminInvoice.status.in_(['pending', 'overdue']),
                    AdminInvoice.due_date <= overdue_date
                ).all()

                for invoice in invoices:
                    entity_data = {
                        'entity_type': 'invoice',
                        'entity_id': invoice.id,
                        'invoice_number': invoice.invoice_number,
                        'amount': invoice.amount,
                        'total_amount': invoice.total_amount,
                    }
                    try:
                        AdminAutomationTriggers.fire_trigger('invoice_overdue', entity_data)
                    except Exception as e:
                        print(f"[AdminScheduler] Invoice overdue trigger error: {e}")
        except Exception as e:
            print(f"[AdminScheduler] Invoice overdue check error: {e}")

        # Task scaduti
        try:
            overdue_tasks = AdminTask.query.filter(
                AdminTask.stato != 'completato',
                AdminTask.data_scadenza < now
            ).all()

            for task in overdue_tasks:
                entity_data = {
                    'entity_type': 'task',
                    'entity_id': task.id,
                    'titolo': task.titolo,
                    'tipo': task.tipo,
                    'priorita': task.priorita,
                }
                try:
                    AdminAutomationTriggers.fire_trigger('task_overdue', entity_data)
                except Exception as e:
                    print(f"[AdminScheduler] Task overdue trigger error: {e}")
        except Exception as e:
            print(f"[AdminScheduler] Task overdue check error: {e}")

    def _process_admin_email_sequences(self):
        """Processa enrollment attivi con next_send_at <= now"""
        from app import db
        from app.models import AdminWorkflowEnrollment, AdminWorkflow, CRMLead
        from app.services.admin_automation_service import AdminAutomationService

        now = datetime.utcnow()

        active_enrollments = AdminWorkflowEnrollment.query.filter(
            AdminWorkflowEnrollment.status == 'active',
            AdminWorkflowEnrollment.next_send_at <= now
        ).all()

        for enrollment in active_enrollments:
            try:
                workflow = enrollment.workflow
                if not workflow or not workflow.abilitata:
                    continue

                lead = CRMLead.query.get(enrollment.lead_id)
                if not lead:
                    enrollment.status = 'removed'
                    enrollment.exit_reason = 'Lead non trovato'
                    enrollment.exited_at = now
                    continue

                # Check exit conditions
                if workflow.sequence_exit_on_convert and lead.stage == 'vinto':
                    enrollment.status = 'exited_convert'
                    enrollment.exit_reason = 'Lead convertito'
                    enrollment.exited_at = now
                    continue

                steps = workflow.steps or []
                current_idx = enrollment.current_step_index

                if current_idx >= len(steps):
                    enrollment.status = 'completed'
                    enrollment.exited_at = now
                    continue

                step = steps[current_idx]
                step_type = step.get('type')
                step_config = step.get('config', {})

                # Costruisci context per il lead
                context = AdminAutomationService._build_admin_context({
                    'entity_type': 'lead',
                    'entity_id': lead.id,
                })

                if step_type == 'delay':
                    # Calcola prossimo invio
                    minutes = step_config.get('minutes', 0)
                    hours = step_config.get('hours', 0)
                    days = step_config.get('days', 0)
                    total_minutes = minutes + (hours * 60) + (days * 24 * 60)
                    enrollment.current_step_index = current_idx + 1
                    enrollment.next_send_at = now + timedelta(minutes=total_minutes)
                else:
                    # Esegui step
                    AdminAutomationService.execute_step(step_type, step_config, context)
                    enrollment.current_step_index = current_idx + 1

                    # Se ci sono ancora step, controlla se il prossimo e un delay
                    next_idx = current_idx + 1
                    if next_idx < len(steps):
                        next_step = steps[next_idx]
                        if next_step.get('type') == 'delay':
                            cfg = next_step.get('config', {})
                            total = cfg.get('minutes', 0) + cfg.get('hours', 0) * 60 + cfg.get('days', 0) * 1440
                            enrollment.current_step_index = next_idx + 1
                            enrollment.next_send_at = now + timedelta(minutes=total)
                        else:
                            enrollment.next_send_at = now  # Esegui subito
                    else:
                        enrollment.status = 'completed'
                        enrollment.exited_at = now

                db.session.commit()

            except Exception as e:
                print(f"[AdminScheduler] Sequence processing error for enrollment {enrollment.id}: {e}")

    def schedule_automation(self, automation):
        """
        Imposta il next_run iniziale per una nuova automazione schedulata
        """
        from app import db

        if automation.trigger_type not in ['scheduled', 'cron', 'interval', 'specific_date']:
            automation.next_run = None
            return

        config = automation.trigger_config or {}

        if automation.trigger_type == 'specific_date':
            # Data specifica
            date_str = config.get('date')
            if date_str:
                try:
                    automation.next_run = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except:
                    automation.next_run = None
        else:
            # Per cron e interval, calcola prossimo run
            automation.next_run = self._calculate_next_run(automation)

        db.session.commit()


# Istanza globale dello scheduler
scheduler = AutomationScheduler()
