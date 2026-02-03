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
        while self._running:
            try:
                with self.app.app_context():
                    self._check_scheduled_automations()
                    self._check_pending_steps()
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
