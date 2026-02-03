from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import SponsorActivity, Sponsor
from datetime import datetime


def verify_club():
    """Helper function to verify club role and return club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


sponsor_activity_bp = Blueprint('sponsor_activity', __name__)


# GET - Lista attività di uno sponsor
@sponsor_activity_bp.route('/club/sponsors/<int:sponsor_id>/activities', methods=['GET'])
@jwt_required()
def get_sponsor_activities(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Verifica che lo sponsor appartenga al club
    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri opzionali
    tipo = request.args.get('tipo')
    esito = request.args.get('esito')
    limit = request.args.get('limit', type=int)

    query = SponsorActivity.query.filter_by(sponsor_id=sponsor_id, club_id=club_id)

    if tipo:
        query = query.filter_by(tipo=tipo)
    if esito:
        query = query.filter_by(esito=esito)

    # Ordina per data attività (più recenti prima)
    query = query.order_by(SponsorActivity.data_attivita.desc())

    if limit:
        query = query.limit(limit)

    activities = query.all()

    activities_data = []
    for activity in activities:
        activities_data.append({
            'id': activity.id,
            'tipo': activity.tipo,
            'titolo': activity.titolo,
            'descrizione': activity.descrizione,
            'data_attivita': activity.data_attivita.isoformat() if activity.data_attivita else None,
            'contatto_nome': activity.contatto_nome,
            'esito': activity.esito,
            'data_followup': activity.data_followup.isoformat() if activity.data_followup else None,
            'followup_completato': activity.followup_completato,
            'creato_da': activity.creato_da,
            'created_at': activity.created_at.isoformat() if activity.created_at else None
        })

    return jsonify(activities_data), 200


# POST - Crea nuova attività
@sponsor_activity_bp.route('/club/sponsors/<int:sponsor_id>/activities', methods=['POST'])
@jwt_required()
def create_activity(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Verifica che lo sponsor appartenga al club
    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione campi richiesti
    required_fields = ['tipo', 'titolo', 'data_attivita']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Campo {field} richiesto'}), 400

    # Validazione tipo
    valid_types = ['chiamata', 'meeting', 'email', 'nota', 'altro']
    if data['tipo'] not in valid_types:
        return jsonify({'error': f'Tipo non valido. Valori accettati: {", ".join(valid_types)}'}), 400

    # Parsing data
    try:
        data_attivita = datetime.fromisoformat(data['data_attivita'].replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return jsonify({'error': 'Formato data_attivita non valido'}), 400

    data_followup = None
    if data.get('data_followup'):
        try:
            data_followup = datetime.fromisoformat(data['data_followup'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({'error': 'Formato data_followup non valido'}), 400

    activity = SponsorActivity(
        sponsor_id=sponsor_id,
        club_id=club_id,
        tipo=data['tipo'],
        titolo=data['titolo'],
        descrizione=data.get('descrizione'),
        data_attivita=data_attivita,
        contatto_nome=data.get('contatto_nome'),
        esito=data.get('esito'),
        data_followup=data_followup,
        followup_completato=False,
        creato_da=data.get('creato_da', 'Club')
    )

    db.session.add(activity)
    db.session.commit()

    return jsonify({
        'message': 'Attività creata con successo',
        'activity': {
            'id': activity.id,
            'tipo': activity.tipo,
            'titolo': activity.titolo,
            'data_attivita': activity.data_attivita.isoformat()
        }
    }), 201


# GET - Singola attività
@sponsor_activity_bp.route('/club/sponsors/<int:sponsor_id>/activities/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity(sponsor_id, activity_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activity = SponsorActivity.query.get_or_404(activity_id)

    if activity.club_id != club_id or activity.sponsor_id != sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    return jsonify({
        'id': activity.id,
        'tipo': activity.tipo,
        'titolo': activity.titolo,
        'descrizione': activity.descrizione,
        'data_attivita': activity.data_attivita.isoformat() if activity.data_attivita else None,
        'contatto_nome': activity.contatto_nome,
        'esito': activity.esito,
        'data_followup': activity.data_followup.isoformat() if activity.data_followup else None,
        'followup_completato': activity.followup_completato,
        'creato_da': activity.creato_da,
        'created_at': activity.created_at.isoformat() if activity.created_at else None
    }), 200


# PUT - Aggiorna attività
@sponsor_activity_bp.route('/club/sponsors/<int:sponsor_id>/activities/<int:activity_id>', methods=['PUT'])
@jwt_required()
def update_activity(sponsor_id, activity_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activity = SponsorActivity.query.get_or_404(activity_id)

    if activity.club_id != club_id or activity.sponsor_id != sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Aggiorna campi
    if 'tipo' in data:
        valid_types = ['chiamata', 'meeting', 'email', 'nota', 'altro']
        if data['tipo'] not in valid_types:
            return jsonify({'error': f'Tipo non valido. Valori accettati: {", ".join(valid_types)}'}), 400
        activity.tipo = data['tipo']

    if 'titolo' in data:
        activity.titolo = data['titolo']

    if 'descrizione' in data:
        activity.descrizione = data['descrizione']

    if 'data_attivita' in data:
        try:
            activity.data_attivita = datetime.fromisoformat(data['data_attivita'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({'error': 'Formato data_attivita non valido'}), 400

    if 'contatto_nome' in data:
        activity.contatto_nome = data['contatto_nome']

    if 'esito' in data:
        activity.esito = data['esito']

    if 'data_followup' in data:
        if data['data_followup']:
            try:
                activity.data_followup = datetime.fromisoformat(data['data_followup'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return jsonify({'error': 'Formato data_followup non valido'}), 400
        else:
            activity.data_followup = None

    if 'followup_completato' in data:
        activity.followup_completato = data['followup_completato']

    db.session.commit()

    return jsonify({
        'message': 'Attività aggiornata con successo',
        'activity': {
            'id': activity.id,
            'tipo': activity.tipo,
            'titolo': activity.titolo
        }
    }), 200


# DELETE - Elimina attività
@sponsor_activity_bp.route('/club/sponsors/<int:sponsor_id>/activities/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(sponsor_id, activity_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activity = SponsorActivity.query.get_or_404(activity_id)

    if activity.club_id != club_id or activity.sponsor_id != sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(activity)
    db.session.commit()

    return jsonify({'message': 'Attività eliminata con successo'}), 200


# PATCH - Completa follow-up
@sponsor_activity_bp.route('/club/sponsors/<int:sponsor_id>/activities/<int:activity_id>/complete-followup', methods=['PATCH'])
@jwt_required()
def complete_followup(sponsor_id, activity_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activity = SponsorActivity.query.get_or_404(activity_id)

    if activity.club_id != club_id or activity.sponsor_id != sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activity.followup_completato = True
    db.session.commit()

    return jsonify({
        'message': 'Follow-up completato',
        'activity_id': activity.id
    }), 200


# GET - Attività con follow-up pendenti (tutte le sponsor del club)
@sponsor_activity_bp.route('/club/activities/pending-followups', methods=['GET'])
@jwt_required()
def get_pending_followups():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Attività con follow-up non completato e data passata o oggi
    today = datetime.utcnow().date()

    activities = SponsorActivity.query.filter(
        SponsorActivity.club_id == club_id,
        SponsorActivity.data_followup != None,
        SponsorActivity.followup_completato == False,
        db.func.date(SponsorActivity.data_followup) <= today
    ).order_by(SponsorActivity.data_followup.asc()).all()

    activities_data = []
    for activity in activities:
        activities_data.append({
            'id': activity.id,
            'sponsor_id': activity.sponsor_id,
            'sponsor_nome': activity.sponsor.ragione_sociale,
            'tipo': activity.tipo,
            'titolo': activity.titolo,
            'data_attivita': activity.data_attivita.isoformat() if activity.data_attivita else None,
            'data_followup': activity.data_followup.isoformat() if activity.data_followup else None
        })

    return jsonify(activities_data), 200
