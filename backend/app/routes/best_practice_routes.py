"""
Route pubbliche per eventi Best Practice (Sponsor & Club)
- Browse eventi
- Registrazione
- Q&A
- Feedback
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import BestPracticeEvent, EventRegistration, EventQuestion, Sponsor, Club
from datetime import datetime
from sqlalchemy import or_, and_

best_practice_bp = Blueprint('best_practice', __name__)


def get_current_user():
    """Ottieni user_type e user_id dell'utente corrente"""
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())
    return role, user_id


def get_user_info(role, user_id):
    """Ottieni nome e email utente"""
    if role == 'sponsor':
        sponsor = Sponsor.query.get(user_id)
        return sponsor.ragione_sociale if sponsor else f'Sponsor {user_id}', sponsor.email if sponsor else None
    elif role == 'club':
        club = Club.query.get(user_id)
        return club.nome_club if club else f'Club {user_id}', club.email if club else None
    return f'User {user_id}', None


# ==================== BROWSE EVENTI ====================

@best_practice_bp.route('/best-practice-events', methods=['GET'])
@jwt_required()
def get_public_events():
    """Lista eventi pubblici (con filtri)"""
    try:
        role, user_id = get_current_user()

        # Solo sponsor e club possono vedere eventi
        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        # Base query: solo eventi pubblicati
        query = BestPracticeEvent.query.filter_by(pubblicato=True)

        # Filtri visibilità
        if role == 'sponsor':
            query = query.filter(
                or_(
                    BestPracticeEvent.visibile_sponsor == True,
                    and_(BestPracticeEvent.visibile_sponsor == True, BestPracticeEvent.solo_premium == False)
                )
            )
        elif role == 'club':
            query = query.filter_by(visibile_club=True)

        # Filtri opzionali
        tipo = request.args.get('tipo')
        if tipo:
            query = query.filter_by(tipo=tipo)

        categoria = request.args.get('categoria')
        if categoria:
            query = query.filter_by(categoria=categoria)

        # Filtra per data (upcoming/past)
        time_filter = request.args.get('time')
        now = datetime.utcnow()
        if time_filter == 'upcoming':
            query = query.filter(BestPracticeEvent.data_evento >= now)
        elif time_filter == 'past':
            query = query.filter(BestPracticeEvent.data_evento < now)

        events = query.order_by(BestPracticeEvent.data_evento.asc()).all()

        # Per ogni evento, verifica se l'utente è già registrato
        result = []
        for e in events:
            is_registered = EventRegistration.query.filter_by(
                event_id=e.id,
                user_type=role,
                user_id=user_id
            ).first() is not None

            # Conta posti disponibili
            posti_disponibili = None
            if e.max_partecipanti:
                registrati = len([r for r in e.registrations if r.status != 'cancellato'])
                posti_disponibili = e.max_partecipanti - registrati

            result.append({
                'id': e.id,
                'tipo': e.tipo,
                'titolo': e.titolo,
                'descrizione': e.descrizione[:200] + '...' if len(e.descrizione) > 200 else e.descrizione,
                'data_evento': e.data_evento.isoformat(),
                'durata_minuti': e.durata_minuti,
                'location_fisica': e.location_fisica,
                'speakers': e.speakers,
                'categoria': e.categoria,
                'tags': e.tags,
                'max_partecipanti': e.max_partecipanti,
                'posti_disponibili': posti_disponibili,
                'registrations_count': len([r for r in e.registrations if r.status != 'cancellato']),
                'is_registered': is_registered,
                'created_at': e.created_at.isoformat()
            })

        return jsonify({'events': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@best_practice_bp.route('/best-practice-events/<int:event_id>', methods=['GET'])
@jwt_required()
def get_public_event_detail(event_id):
    """Dettaglio evento pubblico"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        # Verifica pubblicazione e visibilità
        if not event.pubblicato:
            return jsonify({'error': 'Evento non disponibile'}), 403

        can_view = False
        if role == 'sponsor' and event.visibile_sponsor:
            can_view = True
        elif role == 'club' and event.visibile_club:
            can_view = True

        if not can_view:
            return jsonify({'error': 'Evento non accessibile'}), 403

        # Verifica se utente è registrato
        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_type=role,
            user_id=user_id
        ).first()

        # Conta posti disponibili
        posti_disponibili = None
        if event.max_partecipanti:
            registrati = len([r for r in event.registrations if r.status != 'cancellato'])
            posti_disponibili = event.max_partecipanti - registrati

        return jsonify({
            'event': {
                'id': event.id,
                'tipo': event.tipo,
                'titolo': event.titolo,
                'descrizione': event.descrizione,
                'data_evento': event.data_evento.isoformat(),
                'durata_minuti': event.durata_minuti,
                'location_fisica': event.location_fisica,
                'link_webinar': event.link_webinar if registration else None,  # Solo se registrato
                'speakers': event.speakers,
                'categoria': event.categoria,
                'tags': event.tags,
                'agenda_url': event.agenda_url,
                'materiali_urls': event.materiali_urls if registration else [],  # Solo se registrato
                'max_partecipanti': event.max_partecipanti,
                'posti_disponibili': posti_disponibili,
                'abilita_qna': event.abilita_qna,
                'note_partecipanti': event.note_partecipanti,
                'registrations_count': len([r for r in event.registrations if r.status != 'cancellato']),
                'is_registered': registration is not None,
                'my_registration': {
                    'status': registration.status,
                    'registrato_il': registration.registrato_il.isoformat()
                } if registration else None,
                'recording_url': event.recording_url if (registration and event.status == 'completato') else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@best_practice_bp.route('/best-practice-events/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_events():
    """Eventi in arrivo"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        now = datetime.utcnow()
        query = BestPracticeEvent.query.filter(
            BestPracticeEvent.pubblicato == True,
            BestPracticeEvent.data_evento >= now
        )

        # Filtri visibilità
        if role == 'sponsor':
            query = query.filter_by(visibile_sponsor=True)
        elif role == 'club':
            query = query.filter_by(visibile_club=True)

        events = query.order_by(BestPracticeEvent.data_evento.asc()).limit(10).all()

        result = []
        for e in events:
            is_registered = EventRegistration.query.filter_by(
                event_id=e.id,
                user_type=role,
                user_id=user_id
            ).first() is not None

            result.append({
                'id': e.id,
                'tipo': e.tipo,
                'titolo': e.titolo,
                'data_evento': e.data_evento.isoformat(),
                'durata_minuti': e.durata_minuti,
                'categoria': e.categoria,
                'is_registered': is_registered
            })

        return jsonify({'events': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@best_practice_bp.route('/best-practice-events/past', methods=['GET'])
@jwt_required()
def get_past_events():
    """Eventi passati"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        now = datetime.utcnow()
        query = BestPracticeEvent.query.filter(
            BestPracticeEvent.pubblicato == True,
            BestPracticeEvent.data_evento < now
        )

        # Filtri visibilità
        if role == 'sponsor':
            query = query.filter_by(visibile_sponsor=True)
        elif role == 'club':
            query = query.filter_by(visibile_club=True)

        events = query.order_by(BestPracticeEvent.data_evento.desc()).limit(20).all()

        result = []
        for e in events:
            registration = EventRegistration.query.filter_by(
                event_id=e.id,
                user_type=role,
                user_id=user_id
            ).first()

            result.append({
                'id': e.id,
                'tipo': e.tipo,
                'titolo': e.titolo,
                'data_evento': e.data_evento.isoformat(),
                'durata_minuti': e.durata_minuti,
                'categoria': e.categoria,
                'recording_url': e.recording_url if (registration and e.status == 'completato') else None,
                'materiali_urls': e.materiali_urls if registration else []
            })

        return jsonify({'events': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== REGISTRAZIONE ====================

@best_practice_bp.route('/best-practice-events/<int:event_id>/register', methods=['POST'])
@jwt_required()
def register_to_event(event_id):
    """Iscriviti all'evento"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        if not event.pubblicato:
            return jsonify({'error': 'Evento non disponibile'}), 403

        # Verifica visibilità
        can_register = False
        if role == 'sponsor' and event.visibile_sponsor:
            can_register = True
        elif role == 'club' and event.visibile_club:
            can_register = True

        if not can_register:
            return jsonify({'error': 'Non puoi iscriverti a questo evento'}), 403

        # Verifica se già registrato
        existing = EventRegistration.query.filter_by(
            event_id=event_id,
            user_type=role,
            user_id=user_id
        ).first()

        if existing:
            if existing.status == 'cancellato':
                # Ripristina registrazione cancellata
                existing.status = 'registrato'
                existing.cancellato_il = None
                existing.registrato_il = datetime.utcnow()
                db.session.commit()
                return jsonify({'message': 'Iscrizione ripristinata con successo'}), 200
            else:
                return jsonify({'error': 'Sei già iscritto a questo evento'}), 400

        # Verifica posti disponibili
        if event.max_partecipanti:
            registrati = len([r for r in event.registrations if r.status != 'cancellato'])
            if registrati >= event.max_partecipanti:
                return jsonify({'error': 'Evento al completo'}), 400

        # Ottieni info utente
        user_name, user_email = get_user_info(role, user_id)

        # Crea registrazione
        registration = EventRegistration(
            event_id=event_id,
            user_type=role,
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            status='registrato'
        )

        db.session.add(registration)
        db.session.commit()

        return jsonify({
            'message': 'Iscrizione completata con successo',
            'registration': {
                'id': registration.id,
                'status': registration.status,
                'registrato_il': registration.registrato_il.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@best_practice_bp.route('/best-practice-events/<int:event_id>/register', methods=['DELETE'])
@jwt_required()
def unregister_from_event(event_id):
    """Annulla iscrizione all'evento"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_type=role,
            user_id=user_id
        ).first()

        if not registration:
            return jsonify({'error': 'Iscrizione non trovata'}), 404

        if registration.status == 'cancellato':
            return jsonify({'error': 'Iscrizione già cancellata'}), 400

        registration.status = 'cancellato'
        registration.cancellato_il = datetime.utcnow()

        db.session.commit()

        return jsonify({'message': 'Iscrizione cancellata con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@best_practice_bp.route('/my-best-practice-events', methods=['GET'])
@jwt_required()
def get_my_events():
    """I miei eventi registrati"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        registrations = EventRegistration.query.filter_by(
            user_type=role,
            user_id=user_id
        ).filter(EventRegistration.status != 'cancellato').all()

        result = []
        for r in registrations:
            event = r.event
            result.append({
                'registration_id': r.id,
                'event': {
                    'id': event.id,
                    'tipo': event.tipo,
                    'titolo': event.titolo,
                    'descrizione': event.descrizione[:200] + '...' if len(event.descrizione) > 200 else event.descrizione,
                    'data_evento': event.data_evento.isoformat(),
                    'durata_minuti': event.durata_minuti,
                    'location_fisica': event.location_fisica,
                    'link_webinar': event.link_webinar,
                    'categoria': event.categoria,
                    'status': event.status,
                    'recording_url': event.recording_url if event.status == 'completato' else None
                },
                'registration_status': r.status,
                'ha_partecipato': r.ha_partecipato,
                'rating': r.rating,
                'registrato_il': r.registrato_il.isoformat()
            })

        return jsonify({'registrations': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@best_practice_bp.route('/best-practice-events/<int:event_id>/attendance', methods=['POST'])
@jwt_required()
def mark_attendance(event_id):
    """Conferma presenza (check-in)"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_type=role,
            user_id=user_id
        ).first()

        if not registration:
            return jsonify({'error': 'Iscrizione non trovata'}), 404

        registration.ha_partecipato = True
        registration.status = 'presente'
        registration.confermato_il = datetime.utcnow()

        db.session.commit()

        return jsonify({'message': 'Presenza confermata con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== Q&A ====================

@best_practice_bp.route('/best-practice-events/<int:event_id>/questions', methods=['GET'])
@jwt_required()
def get_event_questions(event_id):
    """Vedi domande Q&A"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event or not event.pubblicato:
            return jsonify({'error': 'Evento non trovato'}), 404

        if not event.abilita_qna:
            return jsonify({'error': 'Q&A non abilitato per questo evento'}), 403

        questions = EventQuestion.query.filter_by(
            event_id=event_id,
            moderato=True
        ).order_by(EventQuestion.upvotes.desc()).all()

        return jsonify({
            'questions': [{
                'id': q.id,
                'user_name': q.user_name,
                'domanda': q.domanda,
                'risposta': q.risposta,
                'risposto_da': q.risposto_da,
                'upvotes': q.upvotes,
                'risposto': q.risposto,
                'created_at': q.created_at.isoformat(),
                'risposto_il': q.risposto_il.isoformat() if q.risposto_il else None
            } for q in questions]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@best_practice_bp.route('/best-practice-events/<int:event_id>/questions', methods=['POST'])
@jwt_required()
def submit_question(event_id):
    """Invia domanda Q&A"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event or not event.pubblicato:
            return jsonify({'error': 'Evento non trovato'}), 404

        if not event.abilita_qna:
            return jsonify({'error': 'Q&A non abilitato per questo evento'}), 403

        # Verifica iscrizione
        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_type=role,
            user_id=user_id
        ).first()

        if not registration:
            return jsonify({'error': 'Devi essere iscritto per fare domande'}), 403

        data = request.get_json()
        domanda = data.get('domanda')

        if not domanda:
            return jsonify({'error': 'Domanda obbligatoria'}), 400

        user_name, _ = get_user_info(role, user_id)

        question = EventQuestion(
            event_id=event_id,
            user_type=role,
            user_id=user_id,
            user_name=user_name,
            domanda=domanda,
            moderato=True,
            upvoted_by=[]
        )

        db.session.add(question)
        db.session.commit()

        return jsonify({
            'message': 'Domanda inviata con successo',
            'question': {
                'id': question.id,
                'domanda': question.domanda,
                'created_at': question.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@best_practice_bp.route('/best-practice-events/<int:event_id>/questions/<int:q_id>/upvote', methods=['POST'])
@jwt_required()
def upvote_question(event_id, q_id):
    """Upvote domanda"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        question = EventQuestion.query.get(q_id)
        if not question or question.event_id != event_id:
            return jsonify({'error': 'Domanda non trovata'}), 404

        # Verifica se già votato
        upvoted_by = question.upvoted_by or []
        user_key = f"{role}_{user_id}"

        if user_key in upvoted_by:
            return jsonify({'error': 'Hai già votato questa domanda'}), 400

        upvoted_by.append(user_key)
        question.upvoted_by = upvoted_by
        question.upvotes += 1

        db.session.commit()

        return jsonify({'message': 'Voto registrato con successo', 'upvotes': question.upvotes}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== FEEDBACK ====================

@best_practice_bp.route('/best-practice-events/<int:event_id>/feedback', methods=['POST'])
@jwt_required()
def submit_feedback(event_id):
    """Invia feedback/rating post-evento"""
    try:
        role, user_id = get_current_user()

        if role not in ['sponsor', 'club']:
            return jsonify({'error': 'Accesso negato'}), 403

        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_type=role,
            user_id=user_id
        ).first()

        if not registration:
            return jsonify({'error': 'Devi aver partecipato per lasciare feedback'}), 403

        data = request.get_json()
        rating = data.get('rating')
        feedback_testo = data.get('feedback_testo')

        if rating:
            if not (1 <= rating <= 5):
                return jsonify({'error': 'Rating deve essere tra 1 e 5'}), 400
            registration.rating = rating

        if feedback_testo:
            registration.feedback_testo = feedback_testo

        db.session.commit()

        return jsonify({'message': 'Feedback inviato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
