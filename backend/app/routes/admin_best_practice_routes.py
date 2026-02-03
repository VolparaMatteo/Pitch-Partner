"""
Route per gestione eventi Best Practice (Admin only)
- CRUD eventi
- Gestione pubblicazione
- Gestione registrazioni
- Q&A management
- Analytics e report
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import BestPracticeEvent, EventRegistration, EventQuestion, Admin, Sponsor, Club
from datetime import datetime
from sqlalchemy import func, and_

admin_best_practice_bp = Blueprint('admin_best_practice', __name__)


def verify_admin():
    """Verifica che l'utente sia admin e restituisce admin_id"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return None
    return int(get_jwt_identity())


# ==================== CRUD EVENTI ====================

@admin_best_practice_bp.route('/best-practice-events', methods=['POST'])
@jwt_required()
def create_event():
    """Crea nuovo evento best practice"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        data = request.get_json()

        # Validazione campi obbligatori
        if not data.get('tipo') or not data.get('titolo') or not data.get('descrizione') or not data.get('data_evento'):
            return jsonify({'error': 'Campi obbligatori: tipo, titolo, descrizione, data_evento'}), 400

        # Parsing data evento
        data_evento = datetime.fromisoformat(data['data_evento'].replace('Z', '+00:00'))

        event = BestPracticeEvent(
            tipo=data['tipo'],
            titolo=data['titolo'],
            descrizione=data['descrizione'],
            data_evento=data_evento,
            durata_minuti=data.get('durata_minuti', 60),
            location_fisica=data.get('location_fisica'),
            link_webinar=data.get('link_webinar'),
            speakers=data.get('speakers', []),
            visibile_sponsor=data.get('visibile_sponsor', True),
            visibile_club=data.get('visibile_club', True),
            solo_premium=data.get('solo_premium', False),
            categoria=data.get('categoria'),
            tags=data.get('tags', []),
            agenda_url=data.get('agenda_url'),
            materiali_urls=data.get('materiali_urls', []),
            max_partecipanti=data.get('max_partecipanti'),
            richiedi_conferma=data.get('richiedi_conferma', True),
            abilita_qna=data.get('abilita_qna', True),
            registra_evento=data.get('registra_evento', True),
            note_partecipanti=data.get('note_partecipanti'),
            status='bozza',
            pubblicato=data.get('pubblicato', False),
            creato_da_admin_id=admin_id
        )

        db.session.add(event)
        db.session.commit()

        return jsonify({
            'message': 'Evento creato con successo',
            'event': {
                'id': event.id,
                'tipo': event.tipo,
                'titolo': event.titolo,
                'data_evento': event.data_evento.isoformat(),
                'status': event.status,
                'pubblicato': event.pubblicato
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events', methods=['GET'])
@jwt_required()
def get_events():
    """Lista tutti gli eventi (con filtri)"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        # Filtri opzionali
        tipo = request.args.get('tipo')
        categoria = request.args.get('categoria')
        status = request.args.get('status')
        pubblicato = request.args.get('pubblicato')

        query = BestPracticeEvent.query

        if tipo:
            query = query.filter_by(tipo=tipo)
        if categoria:
            query = query.filter_by(categoria=categoria)
        if status:
            query = query.filter_by(status=status)
        if pubblicato is not None:
            is_pub = pubblicato.lower() == 'true'
            query = query.filter_by(pubblicato=is_pub)

        events = query.order_by(BestPracticeEvent.data_evento.desc()).all()

        return jsonify({
            'events': [{
                'id': e.id,
                'tipo': e.tipo,
                'titolo': e.titolo,
                'descrizione': e.descrizione[:200] + '...' if len(e.descrizione) > 200 else e.descrizione,
                'data_evento': e.data_evento.isoformat(),
                'durata_minuti': e.durata_minuti,
                'location_fisica': e.location_fisica,
                'link_webinar': e.link_webinar,
                'speakers': e.speakers,
                'categoria': e.categoria,
                'tags': e.tags,
                'visibile_sponsor': e.visibile_sponsor,
                'visibile_club': e.visibile_club,
                'solo_premium': e.solo_premium,
                'max_partecipanti': e.max_partecipanti,
                'status': e.status,
                'pubblicato': e.pubblicato,
                'registrations_count': len(e.registrations),
                'questions_count': len(e.questions),
                'created_at': e.created_at.isoformat()
            } for e in events]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event_detail(event_id):
    """Dettaglio evento"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        return jsonify({
            'event': {
                'id': event.id,
                'tipo': event.tipo,
                'titolo': event.titolo,
                'descrizione': event.descrizione,
                'data_evento': event.data_evento.isoformat(),
                'durata_minuti': event.durata_minuti,
                'location_fisica': event.location_fisica,
                'link_webinar': event.link_webinar,
                'speakers': event.speakers,
                'visibile_sponsor': event.visibile_sponsor,
                'visibile_club': event.visibile_club,
                'solo_premium': event.solo_premium,
                'categoria': event.categoria,
                'tags': event.tags,
                'agenda_url': event.agenda_url,
                'materiali_urls': event.materiali_urls,
                'max_partecipanti': event.max_partecipanti,
                'richiedi_conferma': event.richiedi_conferma,
                'abilita_qna': event.abilita_qna,
                'registra_evento': event.registra_evento,
                'recording_url': event.recording_url,
                'note_partecipanti': event.note_partecipanti,
                'status': event.status,
                'pubblicato': event.pubblicato,
                'registrations_count': len(event.registrations),
                'questions_count': len(event.questions),
                'created_at': event.created_at.isoformat(),
                'updated_at': event.updated_at.isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    """Aggiorna evento"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        data = request.get_json()

        # Aggiorna campi
        if 'tipo' in data:
            event.tipo = data['tipo']
        if 'titolo' in data:
            event.titolo = data['titolo']
        if 'descrizione' in data:
            event.descrizione = data['descrizione']
        if 'data_evento' in data:
            event.data_evento = datetime.fromisoformat(data['data_evento'].replace('Z', '+00:00'))
        if 'durata_minuti' in data:
            event.durata_minuti = data['durata_minuti']
        if 'location_fisica' in data:
            event.location_fisica = data['location_fisica']
        if 'link_webinar' in data:
            event.link_webinar = data['link_webinar']
        if 'speakers' in data:
            event.speakers = data['speakers']
        if 'visibile_sponsor' in data:
            event.visibile_sponsor = data['visibile_sponsor']
        if 'visibile_club' in data:
            event.visibile_club = data['visibile_club']
        if 'solo_premium' in data:
            event.solo_premium = data['solo_premium']
        if 'categoria' in data:
            event.categoria = data['categoria']
        if 'tags' in data:
            event.tags = data['tags']
        if 'agenda_url' in data:
            event.agenda_url = data['agenda_url']
        if 'materiali_urls' in data:
            event.materiali_urls = data['materiali_urls']
        if 'max_partecipanti' in data:
            event.max_partecipanti = data['max_partecipanti']
        if 'richiedi_conferma' in data:
            event.richiedi_conferma = data['richiedi_conferma']
        if 'abilita_qna' in data:
            event.abilita_qna = data['abilita_qna']
        if 'registra_evento' in data:
            event.registra_evento = data['registra_evento']
        if 'recording_url' in data:
            event.recording_url = data['recording_url']
        if 'note_partecipanti' in data:
            event.note_partecipanti = data['note_partecipanti']
        if 'status' in data:
            event.status = data['status']
        if 'pubblicato' in data:
            event.pubblicato = data['pubblicato']

        event.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Evento aggiornato con successo',
            'event': {
                'id': event.id,
                'titolo': event.titolo,
                'status': event.status,
                'pubblicato': event.pubblicato,
                'updated_at': event.updated_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Elimina evento"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        # Elimina tutte le dipendenze
        EventRegistration.query.filter_by(event_id=event_id).delete()
        EventQuestion.query.filter_by(event_id=event_id).delete()

        db.session.delete(event)
        db.session.commit()

        return jsonify({'message': 'Evento eliminato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== GESTIONE PUBBLICAZIONE ====================

@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/publish', methods=['POST'])
@jwt_required()
def publish_event(event_id):
    """Pubblica evento"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        event.pubblicato = True
        if event.status == 'bozza':
            event.status = 'pubblicato'
        event.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'message': 'Evento pubblicato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/unpublish', methods=['POST'])
@jwt_required()
def unpublish_event(event_id):
    """Rimuovi pubblicazione evento"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        event.pubblicato = False
        event.status = 'bozza'
        event.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'message': 'Pubblicazione rimossa con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_event(event_id):
    """Cancella evento"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        event.status = 'cancellato'
        event.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'message': 'Evento cancellato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== GESTIONE REGISTRAZIONI ====================

@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/registrations', methods=['GET'])
@jwt_required()
def get_registrations(event_id):
    """Lista iscritti all'evento"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        registrations = EventRegistration.query.filter_by(event_id=event_id).all()

        return jsonify({
            'registrations': [{
                'id': r.id,
                'user_type': r.user_type,
                'user_id': r.user_id,
                'user_name': r.user_name,
                'user_email': r.user_email,
                'status': r.status,
                'ha_partecipato': r.ha_partecipato,
                'minuti_partecipazione': r.minuti_partecipazione,
                'rating': r.rating,
                'feedback_testo': r.feedback_testo,
                'registrato_il': r.registrato_il.isoformat(),
                'confermato_il': r.confermato_il.isoformat() if r.confermato_il else None
            } for r in registrations]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/registrations/<int:reg_id>/status', methods=['PUT'])
@jwt_required()
def update_registration_status(event_id, reg_id):
    """Modifica status registrazione"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        registration = EventRegistration.query.get(reg_id)
        if not registration or registration.event_id != event_id:
            return jsonify({'error': 'Registrazione non trovata'}), 404

        data = request.get_json()
        new_status = data.get('status')

        if new_status:
            registration.status = new_status
            if new_status == 'confermato' and not registration.confermato_il:
                registration.confermato_il = datetime.utcnow()
            elif new_status == 'cancellato':
                registration.cancellato_il = datetime.utcnow()

        if 'ha_partecipato' in data:
            registration.ha_partecipato = data['ha_partecipato']

        if 'minuti_partecipazione' in data:
            registration.minuti_partecipazione = data['minuti_partecipazione']

        db.session.commit()

        return jsonify({'message': 'Status aggiornato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/registrations/<int:reg_id>', methods=['DELETE'])
@jwt_required()
def delete_registration(event_id, reg_id):
    """Rimuovi iscrizione"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        registration = EventRegistration.query.get(reg_id)
        if not registration or registration.event_id != event_id:
            return jsonify({'error': 'Registrazione non trovata'}), 404

        db.session.delete(registration)
        db.session.commit()

        return jsonify({'message': 'Iscrizione rimossa con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== Q&A MANAGEMENT ====================

@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/questions', methods=['GET'])
@jwt_required()
def get_questions(event_id):
    """Lista domande Q&A"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        questions = EventQuestion.query.filter_by(event_id=event_id).order_by(EventQuestion.upvotes.desc()).all()

        return jsonify({
            'questions': [{
                'id': q.id,
                'user_type': q.user_type,
                'user_name': q.user_name,
                'domanda': q.domanda,
                'risposta': q.risposta,
                'risposto_da': q.risposto_da,
                'upvotes': q.upvotes,
                'moderato': q.moderato,
                'risposto': q.risposto,
                'created_at': q.created_at.isoformat(),
                'risposto_il': q.risposto_il.isoformat() if q.risposto_il else None
            } for q in questions]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/questions/<int:q_id>/answer', methods=['POST'])
@jwt_required()
def answer_question(event_id, q_id):
    """Rispondi a domanda"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        admin = Admin.query.get(admin_id)
        question = EventQuestion.query.get(q_id)
        if not question or question.event_id != event_id:
            return jsonify({'error': 'Domanda non trovata'}), 404

        data = request.get_json()
        risposta = data.get('risposta')

        if not risposta:
            return jsonify({'error': 'Risposta obbligatoria'}), 400

        question.risposta = risposta
        question.risposto_da = admin.full_name if admin else 'Admin'
        question.risposto = True
        question.risposto_il = datetime.utcnow()

        db.session.commit()

        return jsonify({'message': 'Risposta inviata con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/questions/<int:q_id>', methods=['DELETE'])
@jwt_required()
def delete_question(event_id, q_id):
    """Elimina domanda"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        question = EventQuestion.query.get(q_id)
        if not question or question.event_id != event_id:
            return jsonify({'error': 'Domanda non trovata'}), 404

        db.session.delete(question)
        db.session.commit()

        return jsonify({'message': 'Domanda eliminata con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ANALYTICS & REPORTS ====================

@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/analytics', methods=['GET'])
@jwt_required()
def get_analytics(event_id):
    """Analytics e report dettagliato evento"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        # Conta registrazioni per tipo
        registrations_by_type = db.session.query(
            EventRegistration.user_type,
            func.count(EventRegistration.id)
        ).filter_by(event_id=event_id).group_by(EventRegistration.user_type).all()

        # Conta presenze
        total_registered = len(event.registrations)
        total_attended = len([r for r in event.registrations if r.ha_partecipato])
        attendance_rate = (total_attended / total_registered * 100) if total_registered > 0 else 0

        # Rating medio
        ratings = [r.rating for r in event.registrations if r.rating]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0

        # Engagement medio
        participation_times = [r.minuti_partecipazione for r in event.registrations if r.minuti_partecipazione]
        avg_participation = sum(participation_times) / len(participation_times) if participation_times else 0

        return jsonify({
            'analytics': {
                'total_registered': total_registered,
                'total_attended': total_attended,
                'attendance_rate': round(attendance_rate, 1),
                'registrations_by_type': {r[0]: r[1] for r in registrations_by_type},
                'avg_rating': round(avg_rating, 1),
                'total_questions': len(event.questions),
                'avg_participation_minutes': round(avg_participation, 0),
                'feedback_count': len([r for r in event.registrations if r.feedback_testo])
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_best_practice_bp.route('/best-practice-events/<int:event_id>/attendance', methods=['GET'])
@jwt_required()
def get_attendance(event_id):
    """Report presenza partecipanti"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        event = BestPracticeEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Evento non trovato'}), 404

        registrations = EventRegistration.query.filter_by(event_id=event_id).all()

        return jsonify({
            'attendance': [{
                'user_name': r.user_name,
                'user_type': r.user_type,
                'ha_partecipato': r.ha_partecipato,
                'minuti_partecipazione': r.minuti_partecipazione,
                'status': r.status
            } for r in registrations]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
