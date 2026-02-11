import time
import threading
from datetime import datetime
from app import db
from app.models import (
    NewsletterGroup, NewsletterRecipient, NewsletterCampaign,
    newsletter_campaign_groups
)
from app.services.admin_email_service import AdminEmailService


class AdminNewsletterService:

    # ------------------------------------------------------------------ Groups

    @staticmethod
    def get_groups():
        groups = NewsletterGroup.query.order_by(NewsletterGroup.nome).all()
        return [g.to_dict() for g in groups]

    @staticmethod
    def get_group(group_id):
        group = NewsletterGroup.query.get(group_id)
        if not group:
            return None
        return group.to_dict(include_recipients=True)

    @staticmethod
    def create_group(nome, descrizione=None, colore='#6B7280'):
        group = NewsletterGroup(nome=nome, descrizione=descrizione, colore=colore)
        db.session.add(group)
        db.session.commit()
        return group.to_dict()

    @staticmethod
    def update_group(group_id, data):
        group = NewsletterGroup.query.get(group_id)
        if not group:
            return None
        if 'nome' in data:
            group.nome = data['nome']
        if 'descrizione' in data:
            group.descrizione = data['descrizione']
        if 'colore' in data:
            group.colore = data['colore']
        db.session.commit()
        return group.to_dict()

    @staticmethod
    def delete_group(group_id):
        group = NewsletterGroup.query.get(group_id)
        if not group:
            return False
        db.session.delete(group)
        db.session.commit()
        return True

    # ------------------------------------------------------------------ Recipients

    @staticmethod
    def add_recipients(group_id, recipients_list):
        group = NewsletterGroup.query.get(group_id)
        if not group:
            return None

        added = 0
        skipped = 0
        for item in recipients_list:
            email = item.get('email', '').strip().lower()
            nome = item.get('nome', '').strip() or None
            if not email:
                skipped += 1
                continue
            existing = NewsletterRecipient.query.filter_by(
                group_id=group_id, email=email
            ).first()
            if existing:
                skipped += 1
                continue
            recipient = NewsletterRecipient(
                group_id=group_id, email=email, nome=nome
            )
            db.session.add(recipient)
            added += 1

        db.session.commit()
        return {'added': added, 'skipped': skipped}

    @staticmethod
    def remove_recipient(recipient_id):
        recipient = NewsletterRecipient.query.get(recipient_id)
        if not recipient:
            return False
        db.session.delete(recipient)
        db.session.commit()
        return True

    @staticmethod
    def get_recipients(group_id, page=1, per_page=50, search=None):
        query = NewsletterRecipient.query.filter_by(group_id=group_id)
        if search:
            search_filter = f'%{search}%'
            query = query.filter(
                db.or_(
                    NewsletterRecipient.email.ilike(search_filter),
                    NewsletterRecipient.nome.ilike(search_filter)
                )
            )
        query = query.order_by(NewsletterRecipient.email)
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            'recipients': [r.to_dict() for r in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages,
        }

    # ------------------------------------------------------------------ Campaigns

    @staticmethod
    def get_campaigns(page=1, per_page=20, status_filter=None):
        query = NewsletterCampaign.query
        if status_filter:
            query = query.filter_by(status=status_filter)
        query = query.order_by(NewsletterCampaign.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            'campaigns': [c.to_dict() for c in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages,
        }

    @staticmethod
    def get_campaign(campaign_id):
        campaign = NewsletterCampaign.query.get(campaign_id)
        if not campaign:
            return None
        return campaign.to_dict()

    @staticmethod
    def create_campaign(data):
        campaign = NewsletterCampaign(
            titolo=data['titolo'],
            oggetto=data['oggetto'],
            corpo_html=data['corpo_html'],
            account_key=data['account_key'],
            status='bozza'
        )
        # Associate groups
        group_ids = data.get('group_ids', [])
        if group_ids:
            groups = NewsletterGroup.query.filter(NewsletterGroup.id.in_(group_ids)).all()
            campaign.groups = groups

        db.session.add(campaign)
        db.session.commit()
        return campaign.to_dict()

    @staticmethod
    def update_campaign(campaign_id, data):
        campaign = NewsletterCampaign.query.get(campaign_id)
        if not campaign:
            return None
        if campaign.status != 'bozza':
            return {'error': 'Solo le campagne in bozza possono essere modificate'}

        if 'titolo' in data:
            campaign.titolo = data['titolo']
        if 'oggetto' in data:
            campaign.oggetto = data['oggetto']
        if 'corpo_html' in data:
            campaign.corpo_html = data['corpo_html']
        if 'account_key' in data:
            campaign.account_key = data['account_key']
        if 'group_ids' in data:
            groups = NewsletterGroup.query.filter(
                NewsletterGroup.id.in_(data['group_ids'])
            ).all()
            campaign.groups = groups

        db.session.commit()
        return campaign.to_dict()

    @staticmethod
    def delete_campaign(campaign_id):
        campaign = NewsletterCampaign.query.get(campaign_id)
        if not campaign:
            return None
        if campaign.status != 'bozza':
            return {'error': 'Solo le campagne in bozza possono essere eliminate'}
        db.session.delete(campaign)
        db.session.commit()
        return True

    # ------------------------------------------------------------------ Send

    @staticmethod
    def send_campaign(campaign_id):
        campaign = NewsletterCampaign.query.get(campaign_id)
        if not campaign:
            return None
        if campaign.status != 'bozza':
            return {'error': 'Solo le campagne in bozza possono essere inviate'}

        # Collect all unique recipients from associated groups
        seen_emails = set()
        recipients = []
        for group in campaign.groups:
            for r in group.recipients:
                if r.email not in seen_emails:
                    seen_emails.add(r.email)
                    recipients.append({'email': r.email, 'nome': r.nome})

        if not recipients:
            return {'error': 'Nessun destinatario nei gruppi selezionati'}

        # Update campaign status
        campaign.status = 'in_invio'
        campaign.totale_destinatari = len(recipients)
        campaign.inviati_ok = 0
        campaign.inviati_errore = 0
        db.session.commit()

        ok_count = 0
        err_count = 0

        for recipient in recipients:
            try:
                AdminEmailService.send_email(
                    account_key=campaign.account_key,
                    to=recipient['email'],
                    subject=campaign.oggetto,
                    body_html=campaign.corpo_html
                )
                ok_count += 1
            except Exception:
                err_count += 1

            # Update counters in DB
            campaign.inviati_ok = ok_count
            campaign.inviati_errore = err_count
            db.session.commit()

            # Rate limiting: 1 email/second
            time.sleep(1)

        # Final status
        if err_count == len(recipients):
            campaign.status = 'errore'
        else:
            campaign.status = 'inviata'
        campaign.sent_at = datetime.utcnow()
        db.session.commit()

        return campaign.to_dict()

    # ------------------------------------------------------------------ Stats

    @staticmethod
    def get_stats():
        total_groups = NewsletterGroup.query.count()

        # Count unique emails across all groups
        total_unique = db.session.query(
            db.func.count(db.distinct(NewsletterRecipient.email))
        ).scalar() or 0

        campaigns_sent = NewsletterCampaign.query.filter_by(status='inviata').count()

        last_campaign = NewsletterCampaign.query.filter(
            NewsletterCampaign.sent_at.isnot(None)
        ).order_by(NewsletterCampaign.sent_at.desc()).first()

        return {
            'total_groups': total_groups,
            'total_unique_recipients': total_unique,
            'campaigns_sent': campaigns_sent,
            'last_campaign': last_campaign.to_dict() if last_campaign else None,
        }
