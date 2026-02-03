"""
Budget Notification Service
Gestisce notifiche automatiche per scadenze pagamenti e alert budget
"""

from app import db
from app.models import Budget, Payment, BudgetAlert, Notification
from datetime import datetime, timedelta


class BudgetNotificationService:
    """Servizio per notifiche automatiche budget"""

    @staticmethod
    def notify_payment_due_soon(payment):
        """Notifica pagamento in scadenza (7/3/1 giorni prima)"""
        if not payment or payment.notifica_inviata or payment.stato != 'pianificato':
            return False

        days_until_due = (payment.data_prevista - datetime.utcnow().date()).days

        # Notifica a 7, 3, 1 giorno prima
        if days_until_due in [7, 3, 1]:
            budget = payment.budget

            # Notifica al ricevente (chi deve ricevere il pagamento)
            if payment.ricevuto_da_type and payment.ricevuto_da_id:
                Notification.create_notification(
                    user_type=payment.ricevuto_da_type,
                    user_id=payment.ricevuto_da_id,
                    tipo='pagamento_in_scadenza',
                    titolo=f'Pagamento in scadenza tra {days_until_due} giorni',
                    messaggio=f'Pagamento di €{payment.importo} previsto per {payment.data_prevista.strftime("%d/%m/%Y")}',
                    link_url=f'/{payment.ricevuto_da_type}/budgets/{budget.id}',
                    priorita='alta' if days_until_due <= 3 else 'normale'
                )

            # Notifica al mittente (chi deve pagare)
            if payment.inviato_da_type and payment.inviato_da_id:
                Notification.create_notification(
                    user_type=payment.inviato_da_type,
                    user_id=payment.inviato_da_id,
                    tipo='pagamento_da_effettuare',
                    titolo=f'Pagamento da effettuare tra {days_until_due} giorni',
                    messaggio=f'Ricorda di effettuare il pagamento di €{payment.importo} entro {payment.data_prevista.strftime("%d/%m/%Y")}',
                    link_url=f'/{payment.inviato_da_type}/budgets/{budget.id}',
                    priorita='alta' if days_until_due <= 3 else 'normale'
                )

            return True

        return False

    @staticmethod
    def notify_payment_overdue(payment):
        """Notifica pagamento scaduto"""
        if not payment or payment.stato != 'in_ritardo':
            return False

        budget = payment.budget
        days_overdue = (datetime.utcnow().date() - payment.data_prevista).days

        # Notifica solo una volta quando diventa in ritardo
        if days_overdue == 1 and not payment.notifica_inviata:
            # Notifica a entrambe le parti
            if payment.ricevuto_da_type and payment.ricevuto_da_id:
                Notification.create_notification(
                    user_type=payment.ricevuto_da_type,
                    user_id=payment.ricevuto_da_id,
                    tipo='pagamento_scaduto',
                    titolo='Pagamento scaduto',
                    messaggio=f'Il pagamento di €{payment.importo} previsto per {payment.data_prevista.strftime("%d/%m/%Y")} è scaduto',
                    link_url=f'/{payment.ricevuto_da_type}/budgets/{budget.id}',
                    priorita='urgente'
                )

            if payment.inviato_da_type and payment.inviato_da_id:
                Notification.create_notification(
                    user_type=payment.inviato_da_type,
                    user_id=payment.inviato_da_id,
                    tipo='pagamento_scaduto',
                    titolo='Pagamento scaduto',
                    messaggio=f'Il pagamento di €{payment.importo} è scaduto! Previsto per {payment.data_prevista.strftime("%d/%m/%Y")}',
                    link_url=f'/{payment.inviato_da_type}/budgets/{budget.id}',
                    priorita='urgente'
                )

            payment.notifica_inviata = True
            db.session.commit()
            return True

        return False

    @staticmethod
    def notify_budget_threshold(budget, percentage):
        """Notifica soglia budget raggiunta (75%, 90%, 100%)"""
        if not budget:
            return False

        # Trova alert corrispondente
        alert = BudgetAlert.query.filter_by(
            budget_id=budget.id,
            soglia_percentuale=percentage,
            attivo=True,
            notifica_inviata=False
        ).first()

        if alert:
            return alert.check_and_notify()

        return False

    @staticmethod
    def check_all_payments_due_soon():
        """Verifica tutti i pagamenti in scadenza (da eseguire daily via cron)"""
        today = datetime.utcnow().date()
        next_week = today + timedelta(days=7)

        # Pagamenti pianificati nelle prossime 7 giorni
        upcoming_payments = Payment.query.filter(
            Payment.stato == 'pianificato',
            Payment.data_prevista >= today,
            Payment.data_prevista <= next_week
        ).all()

        notifications_sent = 0
        for payment in upcoming_payments:
            if BudgetNotificationService.notify_payment_due_soon(payment):
                notifications_sent += 1

        return notifications_sent

    @staticmethod
    def check_all_overdue_payments():
        """Verifica tutti i pagamenti scaduti (da eseguire daily via cron)"""
        # Aggiorna stato pagamenti scaduti
        overdue_payments = Payment.query.filter_by(stato='pianificato').all()

        notifications_sent = 0
        for payment in overdue_payments:
            if payment.check_if_late():
                if BudgetNotificationService.notify_payment_overdue(payment):
                    notifications_sent += 1

        return notifications_sent

    @staticmethod
    def check_all_budget_alerts():
        """Verifica tutti gli alert budget attivi (da eseguire daily via cron)"""
        active_alerts = BudgetAlert.query.filter_by(attivo=True, notifica_inviata=False).all()

        notifications_sent = 0
        for alert in active_alerts:
            if alert.check_and_notify():
                notifications_sent += 1

        return notifications_sent

    @staticmethod
    def run_daily_checks():
        """
        Esegue tutti i controlli giornalieri
        Da chiamare via cron job o scheduler
        """
        results = {
            'payments_due_soon': BudgetNotificationService.check_all_payments_due_soon(),
            'overdue_payments': BudgetNotificationService.check_all_overdue_payments(),
            'budget_alerts': BudgetNotificationService.check_all_budget_alerts()
        }

        return results
