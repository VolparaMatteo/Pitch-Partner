import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models import AdminCalendarEvent, AdminAvailability, DemoBooking, Admin, CRMLead, Club, AuditLog
from datetime import datetime, date, timedelta
from sqlalchemy import and_

admin_calendar_bp = Blueprint('admin_calendar', __name__)


def _require_admin():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


def log_action(azione, entita, entita_id=None, dettagli=None):
    try:
        admin_id = get_jwt_identity()
        log = AuditLog(
            admin_id=int(admin_id) if admin_id else None,
            azione=azione,
            entita=entita,
            entita_id=entita_id,
            dettagli=dettagli,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string[:500] if request.user_agent else None
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Error logging action: {e}")


# ==================== EVENTI CRUD ====================

@admin_calendar_bp.route('/calendar/events', methods=['GET'])
@jwt_required()
def get_events():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    start = request.args.get('start')
    end = request.args.get('end')
    tipo = request.args.get('tipo')

    query = AdminCalendarEvent.query

    if start:
        try:
            start_dt = datetime.fromisoformat(start)
            query = query.filter(AdminCalendarEvent.data_fine >= start_dt)
        except ValueError:
            pass
    if end:
        try:
            end_dt = datetime.fromisoformat(end)
            query = query.filter(AdminCalendarEvent.data_inizio <= end_dt)
        except ValueError:
            pass
    if tipo:
        query = query.filter(AdminCalendarEvent.tipo == tipo)

    events = query.order_by(AdminCalendarEvent.data_inizio.asc()).all()
    return jsonify([e.to_dict() for e in events]), 200


@admin_calendar_bp.route('/calendar/events', methods=['POST'])
@jwt_required()
def create_event():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data or not data.get('titolo'):
        return jsonify({'error': 'Il titolo e obbligatorio'}), 400
    if not data.get('data_inizio') or not data.get('data_fine'):
        return jsonify({'error': 'Date inizio e fine obbligatorie'}), 400

    admin_id = get_jwt_identity()

    event = AdminCalendarEvent(
        admin_id=int(admin_id) if admin_id else None,
        titolo=data['titolo'],
        descrizione=data.get('descrizione'),
        tipo=data.get('tipo', 'appuntamento'),
        data_inizio=datetime.fromisoformat(data['data_inizio']),
        data_fine=datetime.fromisoformat(data['data_fine']),
        tutto_il_giorno=data.get('tutto_il_giorno', False),
        colore=data.get('colore', '#6366F1'),
        lead_id=data.get('lead_id'),
        club_id=data.get('club_id'),
        note=data.get('note')
    )

    db.session.add(event)
    db.session.commit()

    # Google Calendar sync
    try:
        from app.services.google_calendar_service import google_calendar_service
        admin = Admin.query.get(int(admin_id))
        if admin and google_calendar_service.is_connected(admin):
            g_id = google_calendar_service.create_event(admin, data)
            if g_id:
                event.google_event_id = g_id
                db.session.commit()
    except Exception as e:
        print(f"Google sync on create: {e}")

    log_action('create', 'calendar_event', event.id, f"Creato evento: {event.titolo}")

    return jsonify(event.to_dict()), 201


@admin_calendar_bp.route('/calendar/events/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    event = AdminCalendarEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    return jsonify(event.to_dict()), 200


@admin_calendar_bp.route('/calendar/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    event = AdminCalendarEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    data = request.get_json()

    if 'titolo' in data:
        event.titolo = data['titolo']
    if 'descrizione' in data:
        event.descrizione = data['descrizione']
    if 'tipo' in data:
        event.tipo = data['tipo']
    if 'data_inizio' in data:
        event.data_inizio = datetime.fromisoformat(data['data_inizio'])
    if 'data_fine' in data:
        event.data_fine = datetime.fromisoformat(data['data_fine'])
    if 'tutto_il_giorno' in data:
        event.tutto_il_giorno = data['tutto_il_giorno']
    if 'colore' in data:
        event.colore = data['colore']
    if 'lead_id' in data:
        event.lead_id = data['lead_id']
    if 'club_id' in data:
        event.club_id = data['club_id']
    if 'note' in data:
        event.note = data['note']

    db.session.commit()

    # Google Calendar sync
    try:
        from app.services.google_calendar_service import google_calendar_service
        admin_id = get_jwt_identity()
        admin = Admin.query.get(int(admin_id))
        if admin and google_calendar_service.is_connected(admin) and event.google_event_id:
            google_calendar_service.update_event(admin, event.google_event_id, event.to_dict())
    except Exception as e:
        print(f"Google sync on update: {e}")

    log_action('update', 'calendar_event', event.id, f"Aggiornato evento: {event.titolo}")

    return jsonify(event.to_dict()), 200


@admin_calendar_bp.route('/calendar/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    event = AdminCalendarEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    # Google Calendar delete
    try:
        from app.services.google_calendar_service import google_calendar_service
        admin_id = get_jwt_identity()
        admin = Admin.query.get(int(admin_id))
        if admin and google_calendar_service.is_connected(admin) and event.google_event_id:
            google_calendar_service.delete_event(admin, event.google_event_id)
    except Exception as e:
        print(f"Google sync on delete: {e}")

    titolo = event.titolo
    db.session.delete(event)
    db.session.commit()

    log_action('delete', 'calendar_event', event_id, f"Eliminato evento: {titolo}")

    return jsonify({'message': 'Evento eliminato'}), 200


# ==================== DISPONIBILITA ====================

@admin_calendar_bp.route('/calendar/availability', methods=['GET'])
@jwt_required()
def get_availability():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    admin_id = get_jwt_identity()
    slots = AdminAvailability.query.filter_by(admin_id=int(admin_id)).order_by(
        AdminAvailability.giorno_settimana, AdminAvailability.ora_inizio
    ).all()

    return jsonify([s.to_dict() for s in slots]), 200


@admin_calendar_bp.route('/calendar/availability', methods=['POST'])
@jwt_required()
def save_availability():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    admin_id = int(get_jwt_identity())
    data = request.get_json()
    slots_data = data.get('slots', [])

    # Delete existing and replace
    AdminAvailability.query.filter_by(admin_id=admin_id).delete()

    for slot in slots_data:
        new_slot = AdminAvailability(
            admin_id=admin_id,
            giorno_settimana=slot['giorno_settimana'],
            ora_inizio=slot['ora_inizio'],
            ora_fine=slot['ora_fine'],
            attivo=slot.get('attivo', True)
        )
        db.session.add(new_slot)

    db.session.commit()
    log_action('update', 'availability', None, 'Aggiornata disponibilita')

    slots = AdminAvailability.query.filter_by(admin_id=admin_id).order_by(
        AdminAvailability.giorno_settimana, AdminAvailability.ora_inizio
    ).all()

    return jsonify([s.to_dict() for s in slots]), 200


# ==================== BOOKINGS (gestione admin) ====================

@admin_calendar_bp.route('/calendar/bookings', methods=['GET'])
@jwt_required()
def get_bookings():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    stato = request.args.get('stato')
    data_da = request.args.get('data_da')
    data_a = request.args.get('data_a')

    query = DemoBooking.query

    if stato:
        query = query.filter(DemoBooking.stato == stato)
    if data_da:
        try:
            query = query.filter(DemoBooking.data_ora >= datetime.fromisoformat(data_da))
        except ValueError:
            pass
    if data_a:
        try:
            query = query.filter(DemoBooking.data_ora <= datetime.fromisoformat(data_a))
        except ValueError:
            pass

    bookings = query.order_by(DemoBooking.data_ora.desc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200


@admin_calendar_bp.route('/calendar/bookings/<int:booking_id>/stato', methods=['PUT'])
@jwt_required()
def update_booking_stato(booking_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    booking = DemoBooking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Prenotazione non trovata'}), 404

    data = request.get_json()
    nuovo_stato = data.get('stato')

    if nuovo_stato not in ['confermato', 'completato', 'annullato', 'no_show']:
        return jsonify({'error': 'Stato non valido'}), 400

    booking.stato = nuovo_stato
    if nuovo_stato == 'annullato':
        booking.annullato_il = datetime.utcnow()

    db.session.commit()

    log_action('update', 'booking', booking.id, f"Stato booking cambiato a: {nuovo_stato}")

    return jsonify(booking.to_dict()), 200


# ==================== GOOGLE CALENDAR ====================

@admin_calendar_bp.route('/calendar/google/status', methods=['GET'])
@jwt_required()
def google_status():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.services.google_calendar_service import google_calendar_service

    admin_id = get_jwt_identity()
    admin = Admin.query.get(int(admin_id))

    return jsonify({
        'configured': google_calendar_service.is_configured,
        'connected': google_calendar_service.is_connected(admin) if admin else False
    }), 200


@admin_calendar_bp.route('/calendar/google/connect', methods=['POST'])
@jwt_required()
def google_connect():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.services.google_calendar_service import google_calendar_service

    admin_id = get_jwt_identity()
    auth_url = google_calendar_service.get_auth_url(int(admin_id))

    if not auth_url:
        return jsonify({'error': 'Google Calendar non configurato'}), 400

    return jsonify({'auth_url': auth_url}), 200


@admin_calendar_bp.route('/calendar/google/callback', methods=['GET'])
def google_callback():
    from app.services.google_calendar_service import google_calendar_service

    code = request.args.get('code')
    state = request.args.get('state')  # admin_id

    if not code or not state:
        return jsonify({'error': 'Parametri mancanti'}), 400

    admin = Admin.query.get(int(state))
    if not admin:
        return jsonify({'error': 'Admin non trovato'}), 404

    success = google_calendar_service.handle_callback(admin, code)
    if success:
        # Redirect to frontend calendar page
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3001')
        return f'<html><script>window.location.href="{frontend_url}/admin/calendario?google=connected"</script></html>'
    else:
        return jsonify({'error': 'Errore nella connessione Google'}), 400


@admin_calendar_bp.route('/calendar/google/sync', methods=['POST'])
@jwt_required()
def google_sync():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.services.google_calendar_service import google_calendar_service

    admin_id = get_jwt_identity()
    admin = Admin.query.get(int(admin_id))

    if not admin or not google_calendar_service.is_connected(admin):
        return jsonify({'error': 'Google Calendar non connesso'}), 400

    now = datetime.utcnow()
    start = now - timedelta(days=30)
    end = now + timedelta(days=90)

    stats = google_calendar_service.sync_events(admin, start, end)

    return jsonify({
        'message': 'Sincronizzazione completata',
        'stats': stats
    }), 200


@admin_calendar_bp.route('/calendar/google/disconnect', methods=['POST'])
@jwt_required()
def google_disconnect():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.services.google_calendar_service import google_calendar_service

    admin_id = get_jwt_identity()
    admin = Admin.query.get(int(admin_id))

    if admin:
        google_calendar_service.disconnect(admin)

    return jsonify({'message': 'Google Calendar disconnesso'}), 200


# ==================== STATS ====================

@admin_calendar_bp.route('/calendar/stats', methods=['GET'])
@jwt_required()
def get_calendar_stats():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)

    appuntamenti_oggi = AdminCalendarEvent.query.filter(
        AdminCalendarEvent.data_inizio >= today_start,
        AdminCalendarEvent.data_inizio < today_end
    ).count()

    demo_settimana = DemoBooking.query.filter(
        DemoBooking.stato == 'confermato',
        DemoBooking.data_ora >= today_start,
        DemoBooking.data_ora < week_end
    ).count()

    prossimo_evento = AdminCalendarEvent.query.filter(
        AdminCalendarEvent.data_inizio >= now
    ).order_by(AdminCalendarEvent.data_inizio.asc()).first()

    bookings_pendenti = DemoBooking.query.filter(
        DemoBooking.stato == 'confermato',
        DemoBooking.data_ora >= now
    ).count()

    return jsonify({
        'appuntamenti_oggi': appuntamenti_oggi,
        'demo_settimana': demo_settimana,
        'prossimo_evento': prossimo_evento.to_dict() if prossimo_evento else None,
        'bookings_pendenti': bookings_pendenti
    }), 200
