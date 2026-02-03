from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Lead, Sponsor, Note
from datetime import datetime


def verify_club():
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


def _note_to_dict(n):
    return {
        'id': n.id,
        'lead_id': n.lead_id,
        'sponsor_id': n.sponsor_id,
        'contenuto': n.contenuto,
        'tipo': n.tipo,
        'created_at': n.created_at.isoformat() if n.created_at else None,
        'updated_at': n.updated_at.isoformat() if n.updated_at else None,
    }


note_bp = Blueprint('note', __name__)


# ==================== LEAD NOTES ====================

@note_bp.route('/club/leads/<int:lead_id>/notes', methods=['GET'])
@jwt_required()
def get_lead_notes(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    notes = Note.query.filter_by(lead_id=lead_id, club_id=club_id)\
        .order_by(Note.created_at.desc()).all()

    return jsonify([_note_to_dict(n) for n in notes]), 200


@note_bp.route('/club/leads/<int:lead_id>/notes', methods=['POST'])
@jwt_required()
def create_lead_note(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data.get('contenuto'):
        return jsonify({'error': 'Il contenuto della nota è obbligatorio'}), 400

    valid_types = ['generale', 'strategia', 'feedback', 'follow_up', 'interno']
    tipo = data.get('tipo', 'generale')
    if tipo not in valid_types:
        tipo = 'generale'

    note = Note(
        club_id=club_id,
        lead_id=lead_id,
        contenuto=data['contenuto'],
        tipo=tipo,
    )

    db.session.add(note)
    db.session.commit()
    return jsonify({'message': 'Nota creata', 'note': _note_to_dict(note)}), 201


@note_bp.route('/club/leads/<int:lead_id>/notes/<int:note_id>', methods=['PUT'])
@jwt_required()
def update_lead_note(lead_id, note_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    note = Note.query.get_or_404(note_id)
    if note.lead_id != lead_id or note.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if 'contenuto' in data:
        if not data['contenuto']:
            return jsonify({'error': 'Il contenuto non può essere vuoto'}), 400
        note.contenuto = data['contenuto']
    if 'tipo' in data:
        note.tipo = data['tipo']

    db.session.commit()
    return jsonify({'message': 'Nota aggiornata', 'note': _note_to_dict(note)}), 200


@note_bp.route('/club/leads/<int:lead_id>/notes/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_lead_note(lead_id, note_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    note = Note.query.get_or_404(note_id)
    if note.lead_id != lead_id or note.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Nota eliminata'}), 200


# ==================== SPONSOR NOTES ====================

@note_bp.route('/club/sponsors/<int:sponsor_id>/notes', methods=['GET'])
@jwt_required()
def get_sponsor_notes(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    notes = Note.query.filter_by(sponsor_id=sponsor_id, club_id=club_id)\
        .order_by(Note.created_at.desc()).all()

    return jsonify([_note_to_dict(n) for n in notes]), 200


@note_bp.route('/club/sponsors/<int:sponsor_id>/notes', methods=['POST'])
@jwt_required()
def create_sponsor_note(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data.get('contenuto'):
        return jsonify({'error': 'Il contenuto della nota è obbligatorio'}), 400

    valid_types = ['generale', 'strategia', 'feedback', 'follow_up', 'interno']
    tipo = data.get('tipo', 'generale')
    if tipo not in valid_types:
        tipo = 'generale'

    note = Note(
        club_id=club_id,
        sponsor_id=sponsor_id,
        contenuto=data['contenuto'],
        tipo=tipo,
    )

    db.session.add(note)
    db.session.commit()
    return jsonify({'message': 'Nota creata', 'note': _note_to_dict(note)}), 201


@note_bp.route('/club/sponsors/<int:sponsor_id>/notes/<int:note_id>', methods=['PUT'])
@jwt_required()
def update_sponsor_note(sponsor_id, note_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    note = Note.query.get_or_404(note_id)
    if note.sponsor_id != sponsor_id or note.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if 'contenuto' in data:
        if not data['contenuto']:
            return jsonify({'error': 'Il contenuto non può essere vuoto'}), 400
        note.contenuto = data['contenuto']
    if 'tipo' in data:
        note.tipo = data['tipo']

    db.session.commit()
    return jsonify({'message': 'Nota aggiornata', 'note': _note_to_dict(note)}), 200


@note_bp.route('/club/sponsors/<int:sponsor_id>/notes/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_sponsor_note(sponsor_id, note_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    note = Note.query.get_or_404(note_id)
    if note.sponsor_id != sponsor_id or note.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Nota eliminata'}), 200
