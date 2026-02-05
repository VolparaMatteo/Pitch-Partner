from datetime import datetime, timedelta
from app import db
from app.models import Notification, AdminContract, AdminInvoice, Club, CRMLead


class AdminNotificationService:
    """Genera notifiche automatiche per gli admin."""

    @staticmethod
    def _notification_exists(tipo, oggetto_type, oggetto_id):
        """Check deduplicazione: evita notifiche duplicate per lo stesso oggetto."""
        return Notification.query.filter_by(
            user_type='admin',
            user_id=0,
            tipo=tipo,
            oggetto_type=oggetto_type,
            oggetto_id=oggetto_id
        ).first() is not None

    @staticmethod
    def _create(tipo, titolo, messaggio, oggetto_type, oggetto_id, priorita='normale', link_url=None):
        """Crea notifica admin con deduplicazione."""
        if AdminNotificationService._notification_exists(tipo, oggetto_type, oggetto_id):
            return None
        return Notification.create_notification(
            user_type='admin',
            user_id=0,
            tipo=tipo,
            titolo=titolo,
            messaggio=messaggio,
            oggetto_type=oggetto_type,
            oggetto_id=oggetto_id,
            priorita=priorita,
            link_url=link_url
        )

    @staticmethod
    def generate_contract_expiring():
        """Contratti attivi con end_date entro 30/15/7 giorni."""
        today = datetime.utcnow().date()
        count = 0

        contracts = AdminContract.query.filter(
            AdminContract.status == 'active',
            AdminContract.end_date <= today + timedelta(days=30),
            AdminContract.end_date >= today
        ).all()

        for c in contracts:
            days_left = (c.end_date - today).days
            if days_left <= 7:
                priorita = 'urgente'
                titolo = f'Contratto in scadenza tra {days_left} giorni'
            elif days_left <= 15:
                priorita = 'alta'
                titolo = f'Contratto in scadenza tra {days_left} giorni'
            else:
                priorita = 'normale'
                titolo = f'Contratto in scadenza tra {days_left} giorni'

            club_name = c.club.nome if c.club else 'Club sconosciuto'
            messaggio = f'Il contratto {c.plan_type} di {club_name} scade il {c.end_date.strftime("%d/%m/%Y")}.'

            created = AdminNotificationService._create(
                tipo='contratto_scadenza',
                titolo=titolo,
                messaggio=messaggio,
                oggetto_type='admin_contract',
                oggetto_id=c.id,
                priorita=priorita,
                link_url=f'/admin/contratti/{c.id}'
            )
            if created:
                count += 1

        return count

    @staticmethod
    def generate_overdue_invoices():
        """Fatture con due_date < oggi e status non paid/cancelled."""
        today = datetime.utcnow().date()
        count = 0

        invoices = AdminInvoice.query.filter(
            AdminInvoice.due_date < today,
            AdminInvoice.status.notin_(['paid', 'cancelled'])
        ).all()

        for inv in invoices:
            days_overdue = (today - inv.due_date).days
            club_name = inv.club.nome if inv.club else 'Club sconosciuto'
            messaggio = (
                f'Fattura {inv.invoice_number} di {club_name} scaduta da {days_overdue} giorni. '
                f'Importo: {inv.total_amount:.2f}€.'
            )

            created = AdminNotificationService._create(
                tipo='fattura_scaduta',
                titolo=f'Fattura scaduta: {inv.invoice_number}',
                messaggio=messaggio,
                oggetto_type='admin_invoice',
                oggetto_id=inv.id,
                priorita='alta',
                link_url='/admin/finanze'
            )
            if created:
                count += 1

        return count

    @staticmethod
    def generate_new_clubs():
        """Club creati negli ultimi 7 giorni."""
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        count = 0

        clubs = Club.query.filter(
            Club.created_at >= seven_days_ago
        ).all()

        for club in clubs:
            messaggio = f'Il club {club.nome} si è registrato il {club.created_at.strftime("%d/%m/%Y")}.'

            created = AdminNotificationService._create(
                tipo='nuovo_club',
                titolo=f'Nuovo club: {club.nome}',
                messaggio=messaggio,
                oggetto_type='club',
                oggetto_id=club.id,
                priorita='normale',
                link_url=f'/admin/clubs/{club.id}'
            )
            if created:
                count += 1

        return count

    @staticmethod
    def generate_lead_followups():
        """CRMLead con data_prossima_azione < oggi e stage non vinto/perso."""
        today = datetime.utcnow()
        count = 0

        leads = CRMLead.query.filter(
            CRMLead.data_prossima_azione < today,
            CRMLead.stage.notin_(['vinto', 'perso'])
        ).all()

        for lead in leads:
            days_overdue = (today - lead.data_prossima_azione).days
            azione = lead.prossima_azione or 'Follow-up'
            messaggio = (
                f'{azione} per {lead.nome_club} in ritardo di {days_overdue} giorni. '
                f'Stage: {lead.stage}.'
            )

            created = AdminNotificationService._create(
                tipo='lead_followup',
                titolo=f'Follow-up scaduto: {lead.nome_club}',
                messaggio=messaggio,
                oggetto_type='crm_lead',
                oggetto_id=lead.id,
                priorita='normale',
                link_url=f'/admin/leads/{lead.id}'
            )
            if created:
                count += 1

        return count

    @staticmethod
    def generate_license_expiring():
        """Club con data_scadenza_licenza entro 30/15/7 giorni."""
        today = datetime.utcnow()
        count = 0

        clubs = Club.query.filter(
            Club.data_scadenza_licenza.isnot(None),
            Club.data_scadenza_licenza <= today + timedelta(days=30),
            Club.data_scadenza_licenza >= today
        ).all()

        for club in clubs:
            days_left = (club.data_scadenza_licenza - today).days
            if days_left <= 7:
                priorita = 'urgente'
                titolo = f'Licenza in scadenza tra {days_left} giorni'
            elif days_left <= 15:
                priorita = 'alta'
                titolo = f'Licenza in scadenza tra {days_left} giorni'
            else:
                priorita = 'normale'
                titolo = f'Licenza in scadenza tra {days_left} giorni'

            messaggio = (
                f'La licenza di {club.nome} scade il '
                f'{club.data_scadenza_licenza.strftime("%d/%m/%Y")}. '
                f'Piano: {club.nome_abbonamento or "N/D"}.'
            )

            created = AdminNotificationService._create(
                tipo='licenza_scadenza',
                titolo=titolo,
                messaggio=messaggio,
                oggetto_type='club',
                oggetto_id=club.id,
                priorita=priorita,
                link_url=f'/admin/clubs/{club.id}'
            )
            if created:
                count += 1

        return count

    @staticmethod
    def generate_all():
        """Chiama tutti i generatori e ritorna il riepilogo."""
        results = {
            'contratti_scadenza': AdminNotificationService.generate_contract_expiring(),
            'fatture_scadute': AdminNotificationService.generate_overdue_invoices(),
            'nuovi_club': AdminNotificationService.generate_new_clubs(),
            'lead_followup': AdminNotificationService.generate_lead_followups(),
            'licenze_scadenza': AdminNotificationService.generate_license_expiring(),
        }
        results['totale'] = sum(results.values())
        return results
