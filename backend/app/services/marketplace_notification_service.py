"""
Servizio notifiche automatiche per Marketplace Opportunità
- Notifiche per deadline candidature
- Notifiche per nuove opportunità matchate
- Reminder collaborazioni
"""

from app import db
from app.models import (
    MarketplaceOpportunity, OpportunityApplication, OpportunityCollaboration,
    Sponsor, Club, Notification
)
from datetime import datetime, timedelta


class MarketplaceNotificationService:
    """Gestione notifiche automatiche marketplace"""

    @staticmethod
    def notify_new_opportunity(opportunity_id):
        """
        Notifica sponsor potenzialmente interessati a nuova opportunità
        (basato su match categoria, location, budget)
        """
        opportunity = MarketplaceOpportunity.query.get(opportunity_id)
        if not opportunity or opportunity.stato != 'pubblicata':
            return

        # Trova sponsor potenzialmente interessati
        # TODO: Implementare matching algorithm basato su:
        # - Categoria opportunità vs settore sponsor
        # - Location vs area geografica sponsor
        # - Budget range compatibile

        # Per ora: notifica tutti gli sponsor (broadcast)
        sponsors = Sponsor.query.all()

        for sponsor in sponsors:
            # Skip se è il creator
            if opportunity.creator_type == 'sponsor' and opportunity.creator_id == sponsor.id:
                continue

            Notification.create_notification(
                user_type='sponsor',
                user_id=sponsor.id,
                tipo='nuova_opportunita',
                titolo='Nuova opportunità disponibile',
                messaggio=f'Nuova opportunità "{opportunity.titolo}" - {opportunity.tipo_opportunita}',
                link_url=f'/marketplace/discover/{opportunity.id}',
                priorita='normale'
            )

    @staticmethod
    def notify_deadline_approaching(days_before=3):
        """
        Notifica per deadline candidature in scadenza
        Args:
            days_before: giorni prima della deadline per notificare
        """
        threshold_date = datetime.utcnow() + timedelta(days=days_before)

        # Trova opportunità con deadline tra oggi e threshold_date
        opportunities = MarketplaceOpportunity.query.filter(
            MarketplaceOpportunity.stato == 'pubblicata',
            MarketplaceOpportunity.deadline_candidature.isnot(None),
            MarketplaceOpportunity.deadline_candidature <= threshold_date,
            MarketplaceOpportunity.deadline_candidature > datetime.utcnow()
        ).all()

        for opp in opportunities:
            # Notifica sponsor che hanno visualizzato ma non candidato
            # Per semplicità: notifica tutti gli sponsor
            sponsors = Sponsor.query.all()

            for sponsor in sponsors:
                # Skip se è il creator
                if opp.creator_type == 'sponsor' and opp.creator_id == sponsor.id:
                    continue

                # Check se già candidato
                existing_app = OpportunityApplication.query.filter_by(
                    opportunity_id=opp.id,
                    applicant_id=sponsor.id
                ).first()

                if not existing_app:
                    days_left = (opp.deadline_candidature - datetime.utcnow()).days
                    Notification.create_notification(
                        user_type='sponsor',
                        user_id=sponsor.id,
                        tipo='deadline_candidature',
                        titolo=f'Deadline in scadenza: {opp.titolo}',
                        messaggio=f'Mancano solo {days_left} giorni per candidarti!',
                        link_url=f'/marketplace/discover/{opp.id}',
                        priorita='alta' if days_left <= 1 else 'normale'
                    )

    @staticmethod
    def notify_application_update(application_id, stato):
        """
        Notifica cambio stato candidatura
        Args:
            application_id: ID candidatura
            stato: nuovo stato (accettata, rifiutata)
        """
        application = OpportunityApplication.query.get(application_id)
        if not application:
            return

        opportunity = application.opportunity
        applicant = Sponsor.query.get(application.applicant_id)

        if not applicant:
            return

        if stato == 'accettata':
            Notification.create_notification(
                user_type='sponsor',
                user_id=applicant.id,
                tipo='candidatura_accettata',
                titolo='🎉 Candidatura accettata!',
                messaggio=f'La tua candidatura per "{opportunity.titolo}" è stata accettata',
                link_url=f'/marketplace/applications/{application_id}',
                priorita='alta'
            )

        elif stato == 'rifiutata':
            Notification.create_notification(
                user_type='sponsor',
                user_id=applicant.id,
                tipo='candidatura_rifiutata',
                titolo='Candidatura rifiutata',
                messaggio=f'La tua candidatura per "{opportunity.titolo}" non è stata accettata',
                link_url=f'/marketplace/applications',
                priorita='normale'
            )

    @staticmethod
    def notify_collaboration_starting(collaboration_id):
        """
        Notifica inizio collaborazione (7 giorni prima data_inizio)
        """
        collaboration = OpportunityCollaboration.query.get(collaboration_id)
        if not collaboration or not collaboration.data_inizio:
            return

        days_until_start = (collaboration.data_inizio - datetime.utcnow().date()).days

        if days_until_start <= 7 and days_until_start > 0:
            opportunity = collaboration.opportunity
            sponsor = collaboration.sponsor

            Notification.create_notification(
                user_type='sponsor',
                user_id=sponsor.id,
                tipo='collaborazione_starting',
                titolo='Collaborazione in partenza',
                messaggio=f'La collaborazione "{opportunity.titolo}" inizia tra {days_until_start} giorni',
                link_url=f'/marketplace/collaborations/{collaboration.id}',
                priorita='alta' if days_until_start <= 3 else 'normale'
            )

            # Notifica anche il creator
            Notification.create_notification(
                user_type=opportunity.creator_type,
                user_id=opportunity.creator_id,
                tipo='collaborazione_starting',
                titolo='Collaborazione in partenza',
                messaggio=f'La collaborazione con {sponsor.ragione_sociale} inizia tra {days_until_start} giorni',
                link_url=f'/marketplace/opportunities/{opportunity.id}',
                priorita='alta' if days_until_start <= 3 else 'normale'
            )

    @staticmethod
    def notify_collaboration_ending(collaboration_id):
        """
        Notifica fine collaborazione (7 giorni prima data_fine)
        """
        collaboration = OpportunityCollaboration.query.get(collaboration_id)
        if not collaboration or not collaboration.data_fine:
            return

        days_until_end = (collaboration.data_fine - datetime.utcnow().date()).days

        if days_until_end <= 7 and days_until_end > 0 and collaboration.stato == 'attiva':
            opportunity = collaboration.opportunity
            sponsor = collaboration.sponsor

            Notification.create_notification(
                user_type='sponsor',
                user_id=sponsor.id,
                tipo='collaborazione_ending',
                titolo='Collaborazione in chiusura',
                messaggio=f'La collaborazione "{opportunity.titolo}" termina tra {days_until_end} giorni',
                link_url=f'/marketplace/collaborations/{collaboration.id}',
                priorita='alta' if days_until_end <= 3 else 'normale'
            )

    @staticmethod
    def notify_review_request(collaboration_id):
        """
        Richiesta recensione post-collaborazione
        (inviata quando collaborazione completata o 3 giorni dopo data_fine)
        """
        collaboration = OpportunityCollaboration.query.get(collaboration_id)
        if not collaboration:
            return

        opportunity = collaboration.opportunity
        sponsor = collaboration.sponsor

        # Notifica sponsor per recensire creator
        Notification.create_notification(
            user_type='sponsor',
            user_id=sponsor.id,
            tipo='richiesta_recensione',
            titolo='Lascia una recensione',
            messaggio=f'Come è stata la collaborazione con {opportunity.get_creator_name()}?',
            link_url=f'/marketplace/collaborations/{collaboration.id}/review',
            priorita='normale'
        )

        # Notifica creator per recensire sponsor
        Notification.create_notification(
            user_type=opportunity.creator_type,
            user_id=opportunity.creator_id,
            tipo='richiesta_recensione',
            titolo='Lascia una recensione',
            messaggio=f'Come è stata la collaborazione con {sponsor.ragione_sociale}?',
            link_url=f'/marketplace/collaborations/{collaboration.id}/review',
            priorita='normale'
        )

    @staticmethod
    def check_deadlines_approaching():
        """
        Cron job: Controlla deadline in scadenza (da eseguire giornalmente)
        """
        # Notifiche 7, 3, 1 giorni prima
        MarketplaceNotificationService.notify_deadline_approaching(days_before=7)
        MarketplaceNotificationService.notify_deadline_approaching(days_before=3)
        MarketplaceNotificationService.notify_deadline_approaching(days_before=1)

    @staticmethod
    def check_collaborations_lifecycle():
        """
        Cron job: Controlla lifecycle collaborazioni (da eseguire giornalmente)
        """
        # Collaborazioni in partenza
        collaborations = OpportunityCollaboration.query.filter_by(stato='attiva').all()

        for collab in collaborations:
            # Check starting
            if collab.data_inizio:
                days_until_start = (collab.data_inizio - datetime.utcnow().date()).days
                if 0 < days_until_start <= 7:
                    MarketplaceNotificationService.notify_collaboration_starting(collab.id)

            # Check ending
            if collab.data_fine:
                days_until_end = (collab.data_fine - datetime.utcnow().date()).days
                if 0 < days_until_end <= 7:
                    MarketplaceNotificationService.notify_collaboration_ending(collab.id)

                # Se finita, richiedi recensione
                if days_until_end <= -3:  # 3 giorni dopo fine
                    MarketplaceNotificationService.notify_review_request(collab.id)

    @staticmethod
    def run_daily_checks():
        """
        Master cron job da eseguire giornalmente
        """
        print("🔔 Running marketplace notification checks...")

        MarketplaceNotificationService.check_deadlines_approaching()
        MarketplaceNotificationService.check_collaborations_lifecycle()

        print("✅ Marketplace notification checks completed")
