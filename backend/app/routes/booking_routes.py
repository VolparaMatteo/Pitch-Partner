from flask import Blueprint, request, jsonify
from app import db
from app.models import DemoBooking, AdminCalendarEvent, AdminAvailability, Admin
from datetime import datetime, date, timedelta
import uuid

booking_bp = Blueprint('booking', __name__)


# ==================== PUBLIC ENDPOINTS (NO AUTH) ====================

@booking_bp.route('/booking/config', methods=['GET'])
def get_booking_config():
    return jsonify({
        'nome_azienda': 'Pitch Partner',
        'durata_demo': 30,
        'descrizione': 'Scopri come Pitch Partner puo aiutare la tua societa sportiva a gestire sponsorizzazioni, contratti e molto altro.',
    }), 200


@booking_bp.route('/booking/available-dates', methods=['GET'])
def get_available_dates():
    month_str = request.args.get('month')  # YYYY-MM
    if not month_str:
        return jsonify({'error': 'Parametro month obbligatorio (YYYY-MM)'}), 400

    try:
        year, month = map(int, month_str.split('-'))
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)
    except (ValueError, IndexError):
        return jsonify({'error': 'Formato month non valido'}), 400

    # Get all availability slots
    slots = AdminAvailability.query.filter_by(attivo=True).all()
    if not slots:
        return jsonify({'dates': []}), 200

    available_days_of_week = set()
    for s in slots:
        available_days_of_week.add(s.giorno_settimana)

    available_dates = []
    current = first_day
    today = date.today()

    while current <= last_day:
        if current >= today:
            # Python: monday=0, our model: 0=Lunedi (same)
            weekday = current.weekday()
            if weekday in available_days_of_week:
                # Check if at least one slot is available for this date
                day_slots = _get_free_slots_for_date(current)
                if day_slots:
                    available_dates.append(current.isoformat())
        current += timedelta(days=1)

    return jsonify({'dates': available_dates}), 200


@booking_bp.route('/booking/slots', methods=['GET'])
def get_slots():
    date_str = request.args.get('date')  # YYYY-MM-DD
    if not date_str:
        return jsonify({'error': 'Parametro date obbligatorio (YYYY-MM-DD)'}), 400

    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({'error': 'Formato date non valido'}), 400

    free_slots = _get_free_slots_for_date(target_date)
    return jsonify({'slots': free_slots}), 200


@booking_bp.route('/booking/reserve', methods=['POST'])
def reserve_booking():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dati mancanti'}), 400

    required = ['nome', 'cognome', 'email', 'data_ora']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Il campo {field} e obbligatorio'}), 400

    try:
        data_ora = datetime.fromisoformat(data['data_ora'])
    except ValueError:
        return jsonify({'error': 'Formato data_ora non valido'}), 400

    # Check slot is still available
    target_date = data_ora.date()
    ora_str = data_ora.strftime('%H:%M')
    free_slots = _get_free_slots_for_date(target_date)
    if not any(s['ora'] == ora_str for s in free_slots):
        return jsonify({'error': 'Lo slot selezionato non e piu disponibile'}), 409

    # Get first admin for assignment
    admin = Admin.query.first()

    booking = DemoBooking(
        token=str(uuid.uuid4()),
        nome=data['nome'],
        cognome=data['cognome'],
        email=data['email'],
        telefono=data.get('telefono'),
        nome_club=data.get('nome_club'),
        sport_tipo=data.get('sport_tipo'),
        messaggio=data.get('messaggio'),
        data_ora=data_ora,
        durata=30,
        admin_id=admin.id if admin else None
    )

    db.session.add(booking)
    db.session.flush()  # Get the ID

    # Create corresponding calendar event
    event = AdminCalendarEvent(
        admin_id=admin.id if admin else None,
        titolo=f"Demo - {data['nome']} {data['cognome']}",
        descrizione=f"Demo prenotata da {data['nome']} {data['cognome']}\nEmail: {data['email']}\nClub: {data.get('nome_club', 'N/A')}\nSport: {data.get('sport_tipo', 'N/A')}\n\n{data.get('messaggio', '')}",
        tipo='demo',
        data_inizio=data_ora,
        data_fine=data_ora + timedelta(minutes=30),
        colore='#F59E0B',
        booking_id=booking.id
    )
    db.session.add(event)

    # Google Calendar sync (sempre con Meet per le demo)
    try:
        from app.services.google_calendar_service import google_calendar_service
        if admin and google_calendar_service.is_connected(admin):
            result = google_calendar_service.create_event(admin, {
                'titolo': event.titolo,
                'descrizione': event.descrizione,
                'data_inizio': data_ora.isoformat(),
                'data_fine': (data_ora + timedelta(minutes=30)).isoformat(),
            }, genera_meet=True)
            if result:
                event.google_event_id = result.get('google_event_id')
                booking.google_event_id = result.get('google_event_id')
                if result.get('meet_link'):
                    event.meet_link = result['meet_link']
                    booking.meet_link = result['meet_link']
    except Exception as e:
        print(f"Google sync on booking: {e}")

    db.session.commit()

    # Trigger automazione
    try:
        from app.services.admin_automation_triggers import trigger_admin_booking_created
        trigger_admin_booking_created(booking)
    except Exception as e:
        print(f"[Trigger] booking_created error: {e}")

    return jsonify({
        'message': 'Prenotazione confermata',
        'booking': booking.to_dict()
    }), 201


@booking_bp.route('/booking/<token>', methods=['GET'])
def get_booking(token):
    booking = DemoBooking.query.filter_by(token=token).first()
    if not booking:
        return jsonify({'error': 'Prenotazione non trovata'}), 404

    return jsonify(booking.to_dict()), 200


@booking_bp.route('/booking/<token>/cancel', methods=['PUT'])
def cancel_booking(token):
    booking = DemoBooking.query.filter_by(token=token).first()
    if not booking:
        return jsonify({'error': 'Prenotazione non trovata'}), 404

    if booking.stato == 'annullato':
        return jsonify({'error': 'Prenotazione gia annullata'}), 400

    booking.stato = 'annullato'
    booking.annullato_il = datetime.utcnow()

    # Update linked calendar event
    if booking.calendar_event:
        booking.calendar_event.titolo = f"[ANNULLATO] {booking.calendar_event.titolo}"

    # Google Calendar delete
    try:
        from app.services.google_calendar_service import google_calendar_service
        if booking.admin_id and booking.google_event_id:
            admin = Admin.query.get(booking.admin_id)
            if admin and google_calendar_service.is_connected(admin):
                google_calendar_service.delete_event(admin, booking.google_event_id)
    except Exception as e:
        print(f"Google delete on cancel: {e}")

    db.session.commit()

    return jsonify({
        'message': 'Prenotazione annullata',
        'booking': booking.to_dict()
    }), 200


# ==================== HELPER FUNCTIONS ====================

def _get_free_slots_for_date(target_date):
    """Calculate available 30-minute slots for a given date."""
    weekday = target_date.weekday()  # 0=Monday

    # 1. Get availability windows for this weekday
    avail_slots = AdminAvailability.query.filter_by(
        giorno_settimana=weekday,
        attivo=True
    ).all()

    if not avail_slots:
        return []

    # 2. Generate all possible 30-min slots
    all_slots = []
    for avail in avail_slots:
        start_h, start_m = map(int, avail.ora_inizio.split(':'))
        end_h, end_m = map(int, avail.ora_fine.split(':'))
        start_minutes = start_h * 60 + start_m
        end_minutes = end_h * 60 + end_m

        current = start_minutes
        while current + 30 <= end_minutes:
            h = current // 60
            m = current % 60
            all_slots.append(f"{h:02d}:{m:02d}")
            current += 30

    if not all_slots:
        return []

    # 3. Get existing events for this date
    day_start = datetime.combine(target_date, datetime.min.time())
    day_end = day_start + timedelta(days=1)

    events = AdminCalendarEvent.query.filter(
        AdminCalendarEvent.data_inizio < day_end,
        AdminCalendarEvent.data_fine > day_start
    ).all()

    # 4. Get existing confirmed bookings for this date
    bookings = DemoBooking.query.filter(
        DemoBooking.stato == 'confermato',
        DemoBooking.data_ora >= day_start,
        DemoBooking.data_ora < day_end
    ).all()

    # 5. Build list of busy intervals
    busy = []
    for ev in events:
        busy.append((ev.data_inizio, ev.data_fine))
    for bk in bookings:
        busy.append((bk.data_ora, bk.data_ora + timedelta(minutes=bk.durata)))

    # 6. Filter out overlapping slots + past slots
    now = datetime.utcnow()
    free = []
    for slot_str in all_slots:
        h, m = map(int, slot_str.split(':'))
        slot_start = datetime.combine(target_date, datetime.min.time().replace(hour=h, minute=m))
        slot_end = slot_start + timedelta(minutes=30)

        # Skip past slots
        if slot_start <= now:
            continue

        # Check overlap with busy intervals
        is_free = True
        for busy_start, busy_end in busy:
            if slot_start < busy_end and slot_end > busy_start:
                is_free = False
                break

        if is_free:
            free.append({'ora': slot_str, 'disponibile': True})

    return free
