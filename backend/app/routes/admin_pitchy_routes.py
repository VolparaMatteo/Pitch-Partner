from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models import (
    CRMLead, AdminContract, AdminInvoice, AdminTask,
    AdminCalendarEvent, Club, NewsletterCampaign, AuditLog, DemoBooking
)
from datetime import datetime, timedelta
from sqlalchemy import func

admin_pitchy_bp = Blueprint('admin_pitchy', __name__)


def _require_admin():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


@admin_pitchy_bp.route('/pitchy/context', methods=['GET'])
@jwt_required()
def get_pitchy_context():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    page = request.args.get('page', '')
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    month_start = datetime(now.year, now.month, 1)
    in_30_days = now + timedelta(days=30)

    lines = []

    # --- Pipeline Lead ---
    try:
        total_leads = CRMLead.query.count()
        stages = {}
        for s in ['nuovo', 'contattato', 'qualificato', 'demo', 'proposta', 'negoziazione', 'vinto', 'perso']:
            stages[s] = CRMLead.query.filter_by(stage=s).count()

        hot_leads = CRMLead.query.filter_by(temperatura='hot').filter(
            CRMLead.stage.notin_(['vinto', 'perso'])
        ).count()

        inactive_leads = CRMLead.query.filter(
            CRMLead.stage.notin_(['vinto', 'perso']),
            CRMLead.data_ultima_attivita < now - timedelta(days=14)
        ).count()

        won_this_month = CRMLead.query.filter(
            CRMLead.stage == 'vinto',
            CRMLead.data_chiusura >= month_start
        ).count()

        lost_this_month = CRMLead.query.filter(
            CRMLead.stage == 'perso',
            CRMLead.data_chiusura >= month_start
        ).count()

        pipeline_value = db.session.query(func.sum(CRMLead.valore_stimato)).filter(
            CRMLead.stage.notin_(['vinto', 'perso'])
        ).scalar() or 0

        lines.append("## PIPELINE LEAD")
        lines.append(f"Totale lead: {total_leads}")
        stages_str = ", ".join([f"{k}: {v}" for k, v in stages.items() if v > 0])
        lines.append(f"Per stage: {stages_str}")
        lines.append(f"Lead caldi (hot): {hot_leads}")
        lines.append(f"Lead inattivi (>14gg): {inactive_leads}")
        lines.append(f"Vinti mese: {won_this_month}, Persi mese: {lost_this_month}")
        lines.append(f"Valore pipeline aperta: €{pipeline_value:,.0f}")
    except Exception:
        lines.append("## PIPELINE LEAD\nDati non disponibili")

    # --- Revenue & Contratti ---
    try:
        active_contracts = AdminContract.query.filter_by(status='active').count()
        mrr = db.session.query(func.sum(AdminContract.total_value)).filter_by(status='active').scalar() or 0
        mrr = mrr / 12

        expiring = AdminContract.query.filter(
            AdminContract.status == 'active',
            AdminContract.end_date <= in_30_days.date(),
            AdminContract.end_date >= now.date()
        ).count()

        expired = AdminContract.query.filter_by(status='expired').count()

        lines.append("\n## REVENUE & CONTRATTI")
        lines.append(f"MRR: €{mrr:,.0f} | ARR: €{mrr * 12:,.0f}")
        lines.append(f"Contratti attivi: {active_contracts}")
        lines.append(f"In scadenza (30gg): {expiring}")
        lines.append(f"Scaduti: {expired}")
    except Exception:
        lines.append("\n## REVENUE & CONTRATTI\nDati non disponibili")

    # --- Fatture ---
    try:
        overdue_invoices = AdminInvoice.query.filter(
            AdminInvoice.status == 'overdue'
        ).all()
        overdue_count = len(overdue_invoices)
        overdue_amount = sum(i.total_amount or 0 for i in overdue_invoices)

        pending_invoices = AdminInvoice.query.filter(
            AdminInvoice.status == 'pending'
        ).all()
        pending_count = len(pending_invoices)
        pending_amount = sum(i.total_amount or 0 for i in pending_invoices)

        lines.append("\n## FATTURE")
        lines.append(f"Scadute: {overdue_count} (€{overdue_amount:,.0f})")
        lines.append(f"In attesa: {pending_count} (€{pending_amount:,.0f})")
    except Exception:
        lines.append("\n## FATTURE\nDati non disponibili")

    # --- Task ---
    try:
        open_tasks = AdminTask.query.filter(
            AdminTask.stato.in_(['da_fare', 'in_corso'])
        ).count()

        overdue_tasks = AdminTask.query.filter(
            AdminTask.stato.in_(['da_fare', 'in_corso']),
            AdminTask.data_scadenza.isnot(None),
            AdminTask.data_scadenza < now
        ).count()

        completed_today = AdminTask.query.filter(
            AdminTask.stato == 'completato',
            AdminTask.completato_il >= today_start
        ).count()

        urgent_tasks = AdminTask.query.filter(
            AdminTask.priorita == 'urgente',
            AdminTask.stato.in_(['da_fare', 'in_corso'])
        ).count()

        lines.append("\n## TASK")
        lines.append(f"Aperti: {open_tasks} | Scaduti: {overdue_tasks} | Completati oggi: {completed_today}")
        lines.append(f"Urgenti: {urgent_tasks}")
    except Exception:
        lines.append("\n## TASK\nDati non disponibili")

    # --- Calendario ---
    try:
        upcoming_events = AdminCalendarEvent.query.filter(
            AdminCalendarEvent.data_inizio >= now,
            AdminCalendarEvent.data_inizio <= now + timedelta(days=7)
        ).order_by(AdminCalendarEvent.data_inizio.asc()).limit(5).all()

        pending_demos = DemoBooking.query.filter_by(stato='confermato').filter(
            DemoBooking.data_ora >= now
        ).count()

        lines.append("\n## CALENDARIO")
        if upcoming_events:
            for ev in upcoming_events:
                ev_date = ev.data_inizio.strftime('%d/%m %H:%M') if ev.data_inizio else '?'
                lines.append(f"- {ev_date}: {ev.titolo} ({ev.tipo})")
        else:
            lines.append("Nessun evento nei prossimi 7 giorni")
        lines.append(f"Demo in attesa: {pending_demos}")
    except Exception:
        lines.append("\n## CALENDARIO\nDati non disponibili")

    # --- Club ---
    try:
        active_clubs = Club.query.filter_by(account_attivo=True).count()
        total_clubs = Club.query.count()
        lines.append(f"\n## CLUB\nAttivi: {active_clubs} / {total_clubs} totali")
    except Exception:
        lines.append("\n## CLUB\nDati non disponibili")

    # --- Newsletter ---
    try:
        recent_campaigns = NewsletterCampaign.query.filter(
            NewsletterCampaign.status == 'inviata'
        ).order_by(NewsletterCampaign.sent_at.desc()).limit(3).all()

        lines.append("\n## NEWSLETTER")
        if recent_campaigns:
            for c in recent_campaigns:
                sent_date = c.sent_at.strftime('%d/%m') if c.sent_at else '?'
                lines.append(f"- {sent_date}: \"{c.titolo}\" -> {c.inviati_ok}/{c.totale_destinatari} OK")
        else:
            lines.append("Nessuna campagna recente")
    except Exception:
        lines.append("\n## NEWSLETTER\nDati non disponibili")

    # --- Audit Log recenti ---
    try:
        recent_logs = AuditLog.query.order_by(
            AuditLog.created_at.desc()
        ).limit(5).all()

        lines.append("\n## ATTIVITA RECENTI")
        for log in recent_logs:
            log_date = log.created_at.strftime('%d/%m %H:%M') if log.created_at else '?'
            lines.append(f"- {log_date}: {log.azione} {log.entita or ''} {log.dettagli or ''}"[:120])
    except Exception:
        lines.append("\n## ATTIVITA RECENTI\nDati non disponibili")

    # --- Contesto pagina-specifico ---
    if page:
        lines.append(f"\n## PAGINA CORRENTE: {page}")
        try:
            if 'leads' in page or 'lead' in page:
                next_actions = CRMLead.query.filter(
                    CRMLead.data_prossima_azione.isnot(None),
                    CRMLead.data_prossima_azione <= now + timedelta(days=3),
                    CRMLead.stage.notin_(['vinto', 'perso'])
                ).order_by(CRMLead.data_prossima_azione.asc()).limit(5).all()
                if next_actions:
                    lines.append("Prossime azioni lead:")
                    for l in next_actions:
                        action_date = l.data_prossima_azione.strftime('%d/%m') if l.data_prossima_azione else '?'
                        lines.append(f"- {l.nome_club}: {l.prossima_azione or 'N/A'} ({action_date})")

            elif 'finanz' in page or 'finance' in page:
                paid_this_month = db.session.query(func.sum(AdminInvoice.total_amount)).filter(
                    AdminInvoice.status == 'paid',
                    AdminInvoice.payment_date >= month_start.date()
                ).scalar() or 0
                lines.append(f"Incassato questo mese: €{paid_this_month:,.0f}")

            elif 'task' in page:
                upcoming_tasks = AdminTask.query.filter(
                    AdminTask.stato.in_(['da_fare', 'in_corso']),
                    AdminTask.data_scadenza.isnot(None),
                    AdminTask.data_scadenza <= now + timedelta(days=3)
                ).order_by(AdminTask.data_scadenza.asc()).limit(5).all()
                if upcoming_tasks:
                    lines.append("Task in scadenza (3gg):")
                    for t in upcoming_tasks:
                        due = t.data_scadenza.strftime('%d/%m') if t.data_scadenza else '?'
                        lines.append(f"- [{t.priorita}] {t.titolo} (scad. {due})")
        except Exception:
            pass

    context_text = "\n".join(lines)
    # Limit to ~4000 chars
    if len(context_text) > 4000:
        context_text = context_text[:3950] + "\n...(troncato)"

    return jsonify({'context': context_text}), 200
