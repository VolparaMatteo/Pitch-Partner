from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Lead, Sponsor, ContactPerson
from datetime import datetime


def verify_club():
    """Helper function to verify club role and return club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


def _contact_to_dict(c):
    return {
        'id': c.id,
        'lead_id': c.lead_id,
        'sponsor_id': c.sponsor_id,
        'nome': c.nome,
        'cognome': c.cognome,
        'ruolo': c.ruolo,
        'email': c.email,
        'telefono': c.telefono,
        'ruolo_decisionale': c.ruolo_decisionale,
        'linkedin': c.linkedin,
        'note': c.note,
        'is_referente_principale': c.is_referente_principale,
        'created_at': c.created_at.isoformat() if c.created_at else None,
        'updated_at': c.updated_at.isoformat() if c.updated_at else None,
    }


def _sync_referente(parent, contact):
    """Sync referente_* fields on parent from the primary contact."""
    parent.referente_nome = contact.nome
    parent.referente_cognome = contact.cognome
    parent.referente_ruolo = contact.ruolo
    parent.referente_contatto = contact.email or contact.telefono


def _clear_referente(parent):
    """Clear referente_* fields on parent."""
    parent.referente_nome = None
    parent.referente_cognome = None
    parent.referente_ruolo = None
    parent.referente_contatto = None


contact_bp = Blueprint('contact', __name__)


# ==================== LEAD CONTACTS ====================

@contact_bp.route('/club/leads/<int:lead_id>/contacts', methods=['GET'])
@jwt_required()
def get_lead_contacts(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contacts = ContactPerson.query.filter_by(lead_id=lead_id, club_id=club_id)\
        .order_by(ContactPerson.is_referente_principale.desc(), ContactPerson.created_at.asc()).all()

    return jsonify([_contact_to_dict(c) for c in contacts]), 200


@contact_bp.route('/club/leads/<int:lead_id>/contacts', methods=['POST'])
@jwt_required()
def create_lead_contact(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data.get('nome') or not data.get('cognome'):
        return jsonify({'error': 'Nome e cognome sono obbligatori'}), 400

    contact = ContactPerson(
        club_id=club_id,
        lead_id=lead_id,
        nome=data['nome'],
        cognome=data['cognome'],
        ruolo=data.get('ruolo'),
        email=data.get('email'),
        telefono=data.get('telefono'),
        ruolo_decisionale=data.get('ruolo_decisionale'),
        linkedin=data.get('linkedin'),
        note=data.get('note'),
        is_referente_principale=data.get('is_referente_principale', False),
    )

    db.session.add(contact)

    # If marked as primary, reset others and sync
    if contact.is_referente_principale:
        ContactPerson.query.filter(
            ContactPerson.lead_id == lead_id,
            ContactPerson.id != contact.id
        ).update({'is_referente_principale': False})
        _sync_referente(lead, contact)

    db.session.commit()
    return jsonify({'message': 'Contatto creato', 'contact': _contact_to_dict(contact)}), 201


@contact_bp.route('/club/leads/<int:lead_id>/contacts/<int:contact_id>', methods=['PUT'])
@jwt_required()
def update_lead_contact(lead_id, contact_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contact = ContactPerson.query.get_or_404(contact_id)
    if contact.lead_id != lead_id or contact.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    updatable = ['nome', 'cognome', 'ruolo', 'email', 'telefono', 'ruolo_decisionale', 'linkedin', 'note']
    for field in updatable:
        if field in data:
            setattr(contact, field, data[field])

    # If this contact is primary, re-sync referente fields
    if contact.is_referente_principale:
        _sync_referente(lead, contact)

    db.session.commit()
    return jsonify({'message': 'Contatto aggiornato', 'contact': _contact_to_dict(contact)}), 200


@contact_bp.route('/club/leads/<int:lead_id>/contacts/<int:contact_id>', methods=['DELETE'])
@jwt_required()
def delete_lead_contact(lead_id, contact_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contact = ContactPerson.query.get_or_404(contact_id)
    if contact.lead_id != lead_id or contact.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    was_primary = contact.is_referente_principale
    db.session.delete(contact)
    db.session.flush()

    if was_primary:
        # Auto-promote next contact by created_at
        next_contact = ContactPerson.query.filter_by(lead_id=lead_id, club_id=club_id)\
            .order_by(ContactPerson.created_at.asc()).first()
        if next_contact:
            next_contact.is_referente_principale = True
            _sync_referente(lead, next_contact)
        else:
            _clear_referente(lead)

    db.session.commit()
    return jsonify({'message': 'Contatto eliminato'}), 200


@contact_bp.route('/club/leads/<int:lead_id>/contacts/<int:contact_id>/set-primary', methods=['PATCH'])
@jwt_required()
def set_lead_primary_contact(lead_id, contact_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contact = ContactPerson.query.get_or_404(contact_id)
    if contact.lead_id != lead_id or contact.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Reset all, set target
    ContactPerson.query.filter_by(lead_id=lead_id, club_id=club_id)\
        .update({'is_referente_principale': False})
    contact.is_referente_principale = True
    _sync_referente(lead, contact)

    db.session.commit()
    return jsonify({'message': 'Referente principale impostato', 'contact': _contact_to_dict(contact)}), 200


# ==================== SPONSOR CONTACTS ====================

@contact_bp.route('/club/sponsors/<int:sponsor_id>/contacts', methods=['GET'])
@jwt_required()
def get_sponsor_contacts(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contacts = ContactPerson.query.filter_by(sponsor_id=sponsor_id, club_id=club_id)\
        .order_by(ContactPerson.is_referente_principale.desc(), ContactPerson.created_at.asc()).all()

    return jsonify([_contact_to_dict(c) for c in contacts]), 200


@contact_bp.route('/club/sponsors/<int:sponsor_id>/contacts', methods=['POST'])
@jwt_required()
def create_sponsor_contact(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data.get('nome') or not data.get('cognome'):
        return jsonify({'error': 'Nome e cognome sono obbligatori'}), 400

    contact = ContactPerson(
        club_id=club_id,
        sponsor_id=sponsor_id,
        nome=data['nome'],
        cognome=data['cognome'],
        ruolo=data.get('ruolo'),
        email=data.get('email'),
        telefono=data.get('telefono'),
        ruolo_decisionale=data.get('ruolo_decisionale'),
        linkedin=data.get('linkedin'),
        note=data.get('note'),
        is_referente_principale=data.get('is_referente_principale', False),
    )

    db.session.add(contact)

    if contact.is_referente_principale:
        ContactPerson.query.filter(
            ContactPerson.sponsor_id == sponsor_id,
            ContactPerson.id != contact.id
        ).update({'is_referente_principale': False})
        _sync_referente(sponsor, contact)

    db.session.commit()
    return jsonify({'message': 'Contatto creato', 'contact': _contact_to_dict(contact)}), 201


@contact_bp.route('/club/sponsors/<int:sponsor_id>/contacts/<int:contact_id>', methods=['PUT'])
@jwt_required()
def update_sponsor_contact(sponsor_id, contact_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contact = ContactPerson.query.get_or_404(contact_id)
    if contact.sponsor_id != sponsor_id or contact.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    updatable = ['nome', 'cognome', 'ruolo', 'email', 'telefono', 'ruolo_decisionale', 'linkedin', 'note']
    for field in updatable:
        if field in data:
            setattr(contact, field, data[field])

    if contact.is_referente_principale:
        _sync_referente(sponsor, contact)

    db.session.commit()
    return jsonify({'message': 'Contatto aggiornato', 'contact': _contact_to_dict(contact)}), 200


@contact_bp.route('/club/sponsors/<int:sponsor_id>/contacts/<int:contact_id>', methods=['DELETE'])
@jwt_required()
def delete_sponsor_contact(sponsor_id, contact_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contact = ContactPerson.query.get_or_404(contact_id)
    if contact.sponsor_id != sponsor_id or contact.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    was_primary = contact.is_referente_principale
    db.session.delete(contact)
    db.session.flush()

    if was_primary:
        next_contact = ContactPerson.query.filter_by(sponsor_id=sponsor_id, club_id=club_id)\
            .order_by(ContactPerson.created_at.asc()).first()
        if next_contact:
            next_contact.is_referente_principale = True
            _sync_referente(sponsor, next_contact)
        else:
            _clear_referente(sponsor)

    db.session.commit()
    return jsonify({'message': 'Contatto eliminato'}), 200


@contact_bp.route('/club/sponsors/<int:sponsor_id>/contacts/<int:contact_id>/set-primary', methods=['PATCH'])
@jwt_required()
def set_sponsor_primary_contact(sponsor_id, contact_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contact = ContactPerson.query.get_or_404(contact_id)
    if contact.sponsor_id != sponsor_id or contact.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    ContactPerson.query.filter_by(sponsor_id=sponsor_id, club_id=club_id)\
        .update({'is_referente_principale': False})
    contact.is_referente_principale = True
    _sync_referente(sponsor, contact)

    db.session.commit()
    return jsonify({'message': 'Referente principale impostato', 'contact': _contact_to_dict(contact)}), 200
