from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    CalendarEvent, Lead, LeadActivity, Sponsor, SponsorActivity,
    Event, Match, Payment, HeadOfTerms
)
from datetime import datetime, timedelta
from dateutil import parser as dateutil_parser

calendar_bp = Blueprint('calendar', __name__)


def verify_club():
    """Helper function to verify club role and return club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


# ==================== CRUD CalendarEvent ====================

@calendar_bp.route('/club/calendar/events', methods=['GET'])
@jwt_required()
def get_calendar_events():
    """Lista CalendarEvent per range date"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    start = request.args.get('start')
    end = request.args.get('end')

    query = CalendarEvent.query.filter_by(club_id=club_id)

    if start:
        try:
            start_dt = datetime.fromisoformat(start)
            query = query.filter(CalendarEvent.data_inizio >= start_dt)
        except ValueError:
            pass

    if end:
        try:
            end_dt = datetime.fromisoformat(end)
            query = query.filter(CalendarEvent.data_inizio <= end_dt)
        except ValueError:
            pass

    events = query.order_by(CalendarEvent.data_inizio).all()
    return jsonify([e.to_dict() for e in events])


@calendar_bp.route('/club/calendar/events', methods=['POST'])
@jwt_required()
def create_calendar_event():
    """Crea CalendarEvent"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dati mancanti'}), 400

    # Validazione campi obbligatori
    tipo = data.get('tipo')
    titolo = data.get('titolo')
    data_inizio = data.get('data_inizio')

    if not tipo or tipo not in ('appuntamento', 'task', 'promemoria'):
        return jsonify({'error': 'Tipo non valido. Usa: appuntamento, task, promemoria'}), 400
    if not titolo:
        return jsonify({'error': 'Titolo obbligatorio'}), 400
    if not data_inizio:
        return jsonify({'error': 'Data inizio obbligatoria'}), 400

    try:
        data_inizio_dt = datetime.fromisoformat(data_inizio)
    except ValueError:
        return jsonify({'error': 'Formato data_inizio non valido'}), 400

    data_fine_dt = None
    if data.get('data_fine'):
        try:
            data_fine_dt = datetime.fromisoformat(data.get('data_fine'))
        except ValueError:
            return jsonify({'error': 'Formato data_fine non valido'}), 400

    # Validazione ownership lead/sponsor
    lead_id = data.get('lead_id')
    if lead_id:
        lead = Lead.query.filter_by(id=lead_id, club_id=club_id).first()
        if not lead:
            return jsonify({'error': 'Lead non trovato'}), 404

    sponsor_id = data.get('sponsor_id')
    if sponsor_id:
        sponsor = Sponsor.query.filter_by(id=sponsor_id, club_id=club_id).first()
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

    event = CalendarEvent(
        club_id=club_id,
        tipo=tipo,
        titolo=titolo,
        descrizione=data.get('descrizione'),
        data_inizio=data_inizio_dt,
        data_fine=data_fine_dt,
        tutto_il_giorno=data.get('tutto_il_giorno', False),
        priorita=data.get('priorita', 2),
        colore=data.get('colore'),
        lead_id=lead_id,
        sponsor_id=sponsor_id
    )

    db.session.add(event)
    db.session.commit()

    return jsonify(event.to_dict()), 201


@calendar_bp.route('/club/calendar/events/<int:event_id>', methods=['GET'])
@jwt_required()
def get_calendar_event(event_id):
    """Singolo CalendarEvent"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    event = CalendarEvent.query.filter_by(id=event_id, club_id=club_id).first()
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    return jsonify(event.to_dict())


@calendar_bp.route('/club/calendar/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_calendar_event(event_id):
    """Aggiorna CalendarEvent"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    event = CalendarEvent.query.filter_by(id=event_id, club_id=club_id).first()
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dati mancanti'}), 400

    if 'tipo' in data:
        if data['tipo'] not in ('appuntamento', 'task', 'promemoria'):
            return jsonify({'error': 'Tipo non valido'}), 400
        event.tipo = data['tipo']

    if 'titolo' in data:
        event.titolo = data['titolo']
    if 'descrizione' in data:
        event.descrizione = data['descrizione']

    if 'data_inizio' in data:
        try:
            event.data_inizio = datetime.fromisoformat(data['data_inizio'])
        except ValueError:
            return jsonify({'error': 'Formato data_inizio non valido'}), 400

    if 'data_fine' in data:
        if data['data_fine']:
            try:
                event.data_fine = datetime.fromisoformat(data['data_fine'])
            except ValueError:
                return jsonify({'error': 'Formato data_fine non valido'}), 400
        else:
            event.data_fine = None

    if 'tutto_il_giorno' in data:
        event.tutto_il_giorno = data['tutto_il_giorno']
    if 'priorita' in data:
        event.priorita = data['priorita']
    if 'colore' in data:
        event.colore = data['colore']

    if 'lead_id' in data:
        if data['lead_id']:
            lead = Lead.query.filter_by(id=data['lead_id'], club_id=club_id).first()
            if not lead:
                return jsonify({'error': 'Lead non trovato'}), 404
            event.lead_id = data['lead_id']
        else:
            event.lead_id = None

    if 'sponsor_id' in data:
        if data['sponsor_id']:
            sponsor = Sponsor.query.filter_by(id=data['sponsor_id'], club_id=club_id).first()
            if not sponsor:
                return jsonify({'error': 'Sponsor non trovato'}), 404
            event.sponsor_id = data['sponsor_id']
        else:
            event.sponsor_id = None

    db.session.commit()
    return jsonify(event.to_dict())


@calendar_bp.route('/club/calendar/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_calendar_event(event_id):
    """Elimina CalendarEvent"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    event = CalendarEvent.query.filter_by(id=event_id, club_id=club_id).first()
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': 'Evento eliminato'}), 200


@calendar_bp.route('/club/calendar/events/<int:event_id>/complete', methods=['PATCH'])
@jwt_required()
def toggle_complete_calendar_event(event_id):
    """Toggle completamento task"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    event = CalendarEvent.query.filter_by(id=event_id, club_id=club_id).first()
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    event.completato = not event.completato
    event.data_completamento = datetime.utcnow() if event.completato else None
    db.session.commit()

    return jsonify(event.to_dict())


# ==================== AGGREGAZIONE ====================

@calendar_bp.route('/club/calendar/aggregate', methods=['GET'])
@jwt_required()
def get_calendar_aggregate():
    """Dati unificati da 7 sorgenti"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    start = request.args.get('start')
    end = request.args.get('end')
    sources_param = request.args.get('sources', '')

    if not start or not end:
        return jsonify({'error': 'Parametri start e end obbligatori'}), 400

    try:
        # Use dateutil.parser to handle JS ISO format with Z and milliseconds
        start_dt = dateutil_parser.isoparse(start)
        end_dt = dateutil_parser.isoparse(end)
        # Remove timezone info for naive datetime comparison
        if start_dt.tzinfo is not None:
            start_dt = start_dt.replace(tzinfo=None)
        if end_dt.tzinfo is not None:
            end_dt = end_dt.replace(tzinfo=None)
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Formato date non valido: {str(e)}'}), 400

    # Filtro sorgenti (se specificato)
    all_sources = ['calendar_event', 'lead_followup', 'sponsor_followup', 'lead_contatto', 'event', 'match', 'payment']
    if sources_param:
        active_sources = [s.strip() for s in sources_param.split(',') if s.strip() in all_sources]
    else:
        active_sources = all_sources

    unified_events = []

    # 1. CalendarEvent
    if 'calendar_event' in active_sources:
        cal_events = CalendarEvent.query.filter(
            CalendarEvent.club_id == club_id,
            CalendarEvent.data_inizio >= start_dt,
            CalendarEvent.data_inizio <= end_dt
        ).all()

        for ev in cal_events:
            unified_events.append({
                'id': f'cal_{ev.id}',
                'source': 'calendar_event',
                'source_id': ev.id,
                'title': ev.titolo,
                'start': ev.data_inizio.isoformat(),
                'end': ev.data_fine.isoformat() if ev.data_fine else (ev.data_inizio + timedelta(hours=1)).isoformat(),
                'allDay': ev.tutto_il_giorno,
                'tipo': ev.tipo,
                'color': ev.colore or '#6366F1',
                'completato': ev.completato,
                'editable': True,
                'priorita': ev.priorita,
                'lead_id': ev.lead_id,
                'lead_nome': ev.lead.ragione_sociale if ev.lead else None,
                'sponsor_id': ev.sponsor_id,
                'sponsor_nome': ev.sponsor.ragione_sociale if ev.sponsor else None,
                'descrizione': ev.descrizione
            })

    # 2. LeadActivity follow-up
    if 'lead_followup' in active_sources:
        lead_followups = LeadActivity.query.filter(
            LeadActivity.club_id == club_id,
            LeadActivity.data_followup.isnot(None),
            LeadActivity.data_followup >= start_dt,
            LeadActivity.data_followup <= end_dt
        ).all()

        for lf in lead_followups:
            lead = Lead.query.get(lf.lead_id)
            unified_events.append({
                'id': f'lf_{lf.id}',
                'source': 'lead_followup',
                'source_id': lf.id,
                'title': f'Follow-up: {lf.titolo}',
                'start': lf.data_followup.isoformat(),
                'end': (lf.data_followup + timedelta(minutes=30)).isoformat(),
                'allDay': False,
                'tipo': 'follow-up',
                'color': '#F59E0B',
                'completato': lf.followup_completato,
                'editable': False,
                'lead_id': lf.lead_id,
                'lead_nome': lead.ragione_sociale if lead else None,
                'sponsor_id': None,
                'sponsor_nome': None,
                'descrizione': lf.descrizione,
                'link': f'/club/leads/{lf.lead_id}'
            })

    # 3. SponsorActivity follow-up
    if 'sponsor_followup' in active_sources:
        sponsor_followups = SponsorActivity.query.filter(
            SponsorActivity.club_id == club_id,
            SponsorActivity.data_followup.isnot(None),
            SponsorActivity.data_followup >= start_dt,
            SponsorActivity.data_followup <= end_dt
        ).all()

        for sf in sponsor_followups:
            sponsor = Sponsor.query.get(sf.sponsor_id)
            unified_events.append({
                'id': f'sf_{sf.id}',
                'source': 'sponsor_followup',
                'source_id': sf.id,
                'title': f'Follow-up: {sf.titolo}',
                'start': sf.data_followup.isoformat(),
                'end': (sf.data_followup + timedelta(minutes=30)).isoformat(),
                'allDay': False,
                'tipo': 'follow-up',
                'color': '#8B5CF6',
                'completato': sf.followup_completato,
                'editable': False,
                'sponsor_id': sf.sponsor_id,
                'sponsor_nome': sponsor.ragione_sociale if sponsor else None,
                'lead_id': None,
                'lead_nome': None,
                'descrizione': sf.descrizione,
                'link': f'/club/sponsors/{sf.sponsor_id}'
            })

    # 4. Lead.data_prossimo_contatto
    if 'lead_contatto' in active_sources:
        lead_contacts = Lead.query.filter(
            Lead.club_id == club_id,
            Lead.convertito == False,
            Lead.data_prossimo_contatto.isnot(None),
            Lead.data_prossimo_contatto >= start_dt,
            Lead.data_prossimo_contatto <= end_dt
        ).all()

        for lc in lead_contacts:
            unified_events.append({
                'id': f'lc_{lc.id}',
                'source': 'lead_contatto',
                'source_id': lc.id,
                'title': f'Contatto: {lc.ragione_sociale}',
                'start': lc.data_prossimo_contatto.isoformat(),
                'end': (lc.data_prossimo_contatto + timedelta(minutes=30)).isoformat(),
                'allDay': False,
                'tipo': 'contatto',
                'color': '#F59E0B',
                'completato': False,
                'editable': False,
                'lead_id': lc.id,
                'lead_nome': lc.ragione_sociale,
                'sponsor_id': None,
                'sponsor_nome': None,
                'descrizione': None,
                'link': f'/club/leads/{lc.id}'
            })

    # 5. Event
    if 'event' in active_sources:
        events = Event.query.filter(
            Event.club_id == club_id,
            Event.data_ora_inizio >= start_dt,
            Event.data_ora_inizio <= end_dt
        ).all()

        for ev in events:
            unified_events.append({
                'id': f'ev_{ev.id}',
                'source': 'event',
                'source_id': ev.id,
                'title': ev.titolo,
                'start': ev.data_ora_inizio.isoformat(),
                'end': ev.data_ora_fine.isoformat() if ev.data_ora_fine else (ev.data_ora_inizio + timedelta(hours=2)).isoformat(),
                'allDay': False,
                'tipo': 'evento',
                'color': '#10B981',
                'completato': False,
                'editable': False,
                'lead_id': None,
                'lead_nome': None,
                'sponsor_id': ev.sponsor_id,
                'sponsor_nome': None,
                'descrizione': None,
                'link': f'/events/{ev.id}'
            })

    # 6. Match
    if 'match' in active_sources:
        matches = Match.query.filter(
            Match.club_id == club_id,
            Match.data_ora >= start_dt,
            Match.data_ora <= end_dt
        ).all()

        for m in matches:
            unified_events.append({
                'id': f'ma_{m.id}',
                'source': 'match',
                'source_id': m.id,
                'title': f'vs {m.avversario}',
                'start': m.data_ora.isoformat(),
                'end': (m.data_ora + timedelta(hours=2)).isoformat(),
                'allDay': False,
                'tipo': 'partita',
                'color': '#EF4444',
                'completato': m.status == 'conclusa',
                'editable': False,
                'lead_id': None,
                'lead_nome': None,
                'sponsor_id': None,
                'sponsor_nome': None,
                'descrizione': f'{m.competizione or ""} - {m.luogo}'.strip(' - '),
                'link': f'/matches/{m.id}'
            })

    # 7. Payment
    if 'payment' in active_sources:
        # Get all contracts for this club
        club_contracts = HeadOfTerms.query.filter_by(club_id=club_id).all()
        contract_ids = [c.id for c in club_contracts]

        if contract_ids:
            start_date = start_dt.date()
            end_date = end_dt.date()

            payments = Payment.query.filter(
                Payment.contract_id.in_(contract_ids),
                Payment.data_prevista >= start_date,
                Payment.data_prevista <= end_date
            ).all()

            for p in payments:
                # Color based on stato
                payment_colors = {
                    'pianificato': '#F59E0B',
                    'in_corso': '#3B82F6',
                    'completato': '#10B981',
                    'in_ritardo': '#EF4444',
                    'annullato': '#6B7280'
                }
                color = payment_colors.get(p.stato, '#DC2626')

                contract = HeadOfTerms.query.get(p.contract_id)
                sponsor = Sponsor.query.get(contract.sponsor_id) if contract else None

                p_start = datetime.combine(p.data_prevista, datetime.min.time().replace(hour=9))

                unified_events.append({
                    'id': f'pa_{p.id}',
                    'source': 'payment',
                    'source_id': p.id,
                    'title': f'Pagamento: €{float(p.importo):,.0f} - {p.tipo}',
                    'start': p_start.isoformat(),
                    'end': (p_start + timedelta(hours=1)).isoformat(),
                    'allDay': True,
                    'tipo': 'pagamento',
                    'color': color,
                    'completato': p.stato == 'completato',
                    'editable': False,
                    'lead_id': None,
                    'lead_nome': None,
                    'sponsor_id': contract.sponsor_id if contract else None,
                    'sponsor_nome': sponsor.ragione_sociale if sponsor else None,
                    'descrizione': f'Stato: {p.stato} | {contract.nome_contratto if contract else ""}',
                    'link': f'/club/budgets'
                })

    return jsonify(unified_events)


# ==================== STATS ====================

@calendar_bp.route('/club/calendar/stats', methods=['GET'])
@jwt_required()
def get_calendar_stats():
    """Contatori KPI calendario"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    # Task pendenti (CalendarEvent non completati)
    tasks_pendenti = CalendarEvent.query.filter(
        CalendarEvent.club_id == club_id,
        CalendarEvent.completato == False,
        CalendarEvent.tipo.in_(['task', 'promemoria'])
    ).count()

    # Follow-up scaduti (LeadActivity + SponsorActivity con data_followup passata e non completati)
    followup_scaduti_lead = LeadActivity.query.filter(
        LeadActivity.club_id == club_id,
        LeadActivity.data_followup.isnot(None),
        LeadActivity.data_followup < now,
        LeadActivity.followup_completato == False
    ).count()

    followup_scaduti_sponsor = SponsorActivity.query.filter(
        SponsorActivity.club_id == club_id,
        SponsorActivity.data_followup.isnot(None),
        SponsorActivity.data_followup < now,
        SponsorActivity.followup_completato == False
    ).count()

    followup_scaduti = followup_scaduti_lead + followup_scaduti_sponsor

    # Appuntamenti oggi
    appuntamenti_oggi = CalendarEvent.query.filter(
        CalendarEvent.club_id == club_id,
        CalendarEvent.tipo == 'appuntamento',
        CalendarEvent.data_inizio >= today_start,
        CalendarEvent.data_inizio < today_end
    ).count()

    # Pagamenti in scadenza (prossimi 7 giorni, non completati)
    club_contracts = HeadOfTerms.query.filter_by(club_id=club_id).all()
    contract_ids = [c.id for c in club_contracts]

    pagamenti_in_scadenza = 0
    if contract_ids:
        next_week = (now + timedelta(days=7)).date()
        pagamenti_in_scadenza = Payment.query.filter(
            Payment.contract_id.in_(contract_ids),
            Payment.data_prevista <= next_week,
            Payment.data_prevista >= now.date(),
            Payment.stato.in_(['pianificato', 'in_corso', 'in_ritardo'])
        ).count()

    return jsonify({
        'tasks_pendenti': tasks_pendenti,
        'followup_scaduti': followup_scaduti,
        'appuntamenti_oggi': appuntamenti_oggi,
        'pagamenti_in_scadenza': pagamenti_in_scadenza
    })
