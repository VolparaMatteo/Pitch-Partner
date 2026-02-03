from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Tag, Lead, lead_tags


def verify_club():
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


def _tag_to_dict(tag):
    return {
        'id': tag.id,
        'nome': tag.nome,
        'colore': tag.colore,
        'created_at': tag.created_at.isoformat() if tag.created_at else None,
    }


tag_bp = Blueprint('tag', __name__)


# ==================== TAG CRUD ====================

@tag_bp.route('/club/tags', methods=['GET'])
@jwt_required()
def get_tags():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    tags = Tag.query.filter_by(club_id=club_id).order_by(Tag.nome).all()

    # Include lead count for each tag
    result = []
    for tag in tags:
        d = _tag_to_dict(tag)
        d['lead_count'] = db.session.query(lead_tags).filter(
            lead_tags.c.tag_id == tag.id
        ).count()
        result.append(d)

    return jsonify(result), 200


@tag_bp.route('/club/tags', methods=['POST'])
@jwt_required()
def create_tag():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    nome = (data.get('nome') or '').strip()
    if not nome:
        return jsonify({'error': 'Il nome del tag è obbligatorio'}), 400

    # Check duplicate within club
    existing = Tag.query.filter_by(club_id=club_id, nome=nome).first()
    if existing:
        return jsonify({'error': 'Un tag con questo nome esiste già'}), 409

    tag = Tag(
        club_id=club_id,
        nome=nome,
        colore=data.get('colore', '#6366F1'),
    )
    db.session.add(tag)
    db.session.commit()
    return jsonify({'message': 'Tag creato', 'tag': _tag_to_dict(tag)}), 201


@tag_bp.route('/club/tags/<int:tag_id>', methods=['PUT'])
@jwt_required()
def update_tag(tag_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    tag = Tag.query.get_or_404(tag_id)
    if tag.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if 'nome' in data:
        nome = (data['nome'] or '').strip()
        if not nome:
            return jsonify({'error': 'Il nome del tag è obbligatorio'}), 400
        # Check duplicate
        existing = Tag.query.filter_by(club_id=club_id, nome=nome).filter(Tag.id != tag_id).first()
        if existing:
            return jsonify({'error': 'Un tag con questo nome esiste già'}), 409
        tag.nome = nome
    if 'colore' in data:
        tag.colore = data['colore']

    db.session.commit()
    return jsonify({'message': 'Tag aggiornato', 'tag': _tag_to_dict(tag)}), 200


@tag_bp.route('/club/tags/<int:tag_id>', methods=['DELETE'])
@jwt_required()
def delete_tag(tag_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    tag = Tag.query.get_or_404(tag_id)
    if tag.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(tag)
    db.session.commit()
    return jsonify({'message': 'Tag eliminato'}), 200


# ==================== LEAD-TAG ASSIGNMENT ====================

@tag_bp.route('/club/leads/<int:lead_id>/tags', methods=['GET'])
@jwt_required()
def get_lead_tags(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    return jsonify([_tag_to_dict(t) for t in lead.tags]), 200


@tag_bp.route('/club/leads/<int:lead_id>/tags', methods=['POST'])
@jwt_required()
def assign_lead_tag(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    tag_id = data.get('tag_id')
    if not tag_id:
        return jsonify({'error': 'tag_id è obbligatorio'}), 400

    tag = Tag.query.get_or_404(tag_id)
    if tag.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if tag in lead.tags:
        return jsonify({'error': 'Tag già assegnato'}), 409

    lead.tags.append(tag)
    db.session.commit()
    return jsonify({'message': 'Tag assegnato', 'tags': [_tag_to_dict(t) for t in lead.tags]}), 200


@tag_bp.route('/club/leads/<int:lead_id>/tags/<int:tag_id>', methods=['DELETE'])
@jwt_required()
def remove_lead_tag(lead_id, tag_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    tag = Tag.query.get_or_404(tag_id)
    if tag.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if tag not in lead.tags:
        return jsonify({'error': 'Tag non assegnato'}), 404

    lead.tags.remove(tag)
    db.session.commit()
    return jsonify({'message': 'Tag rimosso', 'tags': [_tag_to_dict(t) for t in lead.tags]}), 200
