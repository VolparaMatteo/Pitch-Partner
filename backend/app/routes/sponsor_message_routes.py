"""
Route per messaggistica diretta sponsor-to-sponsor
- Invio messaggi tra sponsor
- Lista conversazioni
- Dettaglio thread messaggi
- Club NON ha accesso al contenuto (solo notificato del primo contatto)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import SponsorMessage, Sponsor, SponsorProfile
from datetime import datetime
from sqlalchemy import or_, and_

sponsor_message_bp = Blueprint('sponsor_messages', __name__)


def verify_sponsor():
    """Verifica che l'utente sia uno sponsor e restituisce sponsor_id"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None
    return int(get_jwt_identity())

# ==================== SPONSOR MESSAGING ====================

@sponsor_message_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """
    Lista conversazioni attive (sponsor only)
    Restituisce lista di sponsor con cui si è conversato + ultimo messaggio
    """
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        # Query per trovare tutti gli sponsor con cui si ha conversato
        # Messaggi inviati o ricevuti
        messages = SponsorMessage.query.filter(
            or_(
                SponsorMessage.sender_sponsor_id == sponsor.id,
                SponsorMessage.receiver_sponsor_id == sponsor.id
            )
        ).order_by(SponsorMessage.created_at.desc()).all()

        # Raggruppa per sponsor (conversazioni)
        conversations = {}
        for msg in messages:
            other_sponsor_id = msg.receiver_sponsor_id if msg.sender_sponsor_id == sponsor.id else msg.sender_sponsor_id

            if other_sponsor_id not in conversations:
                other_sponsor = Sponsor.query.get(other_sponsor_id)
                conversations[other_sponsor_id] = {
                    'sponsor_id': other_sponsor_id,
                    'ragione_sociale': other_sponsor.ragione_sociale,
                    'logo_url': other_sponsor.logo_url,
                    'settore_merceologico': other_sponsor.settore_merceologico,
                    'last_message': {
                        'id': msg.id,
                        'testo': msg.testo[:100] + '...' if len(msg.testo) > 100 else msg.testo,
                        'sender_is_me': msg.sender_sponsor_id == sponsor.id,
                        'letto': msg.letto,
                        'created_at': msg.created_at.isoformat() if msg.created_at else None
                    },
                    'unread_count': 0
                }

            # Conta messaggi non letti da questo sponsor
            if msg.receiver_sponsor_id == sponsor.id and not msg.letto:
                conversations[other_sponsor_id]['unread_count'] += 1

        return jsonify({
            'conversations': list(conversations.values())
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_message_bp.route('/thread/<int:other_sponsor_id>', methods=['GET'])
@jwt_required()
def get_message_thread(other_sponsor_id):
    """
    Thread completo messaggi con uno specifico sponsor
    """
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        other_sponsor = Sponsor.query.get(other_sponsor_id)
        if not other_sponsor:
            return jsonify({'error': 'Sponsor destinatario non trovato'}), 404

        # Query messaggi bidirezionali
        messages = SponsorMessage.query.filter(
            or_(
                and_(
                    SponsorMessage.sender_sponsor_id == sponsor.id,
                    SponsorMessage.receiver_sponsor_id == other_sponsor_id
                ),
                and_(
                    SponsorMessage.sender_sponsor_id == other_sponsor_id,
                    SponsorMessage.receiver_sponsor_id == sponsor.id
                )
            )
        ).order_by(SponsorMessage.created_at.asc()).all()

        # Marca come letti i messaggi ricevuti
        unread_messages = [m for m in messages if m.receiver_sponsor_id == sponsor.id and not m.letto]
        for msg in unread_messages:
            msg.letto = True
            msg.data_lettura = datetime.utcnow()

        if unread_messages:
            db.session.commit()

        return jsonify({
            'other_sponsor': {
                'id': other_sponsor.id,
                'ragione_sociale': other_sponsor.ragione_sociale,
                'logo_url': other_sponsor.logo_url,
                'settore_merceologico': other_sponsor.settore_merceologico
            },
            'messages': [{
                'id': m.id,
                'testo': m.testo,
                'sender_is_me': m.sender_sponsor_id == sponsor.id,
                'sender_sponsor_id': m.sender_sponsor_id,
                'receiver_sponsor_id': m.receiver_sponsor_id,
                'letto': m.letto,
                'data_lettura': m.data_lettura.isoformat() if m.data_lettura else None,
                'partnership_proposal_id': m.partnership_proposal_id,
                'created_at': m.created_at.isoformat() if m.created_at else None
            } for m in messages]
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_message_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    """
    Invia messaggio a sponsor
    Body: { receiver_sponsor_id, testo, partnership_proposal_id (opzionale) }
    """
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        data = request.get_json()
        receiver_sponsor_id = data.get('receiver_sponsor_id')
        testo = data.get('testo', '').strip()

        if not receiver_sponsor_id or not testo:
            return jsonify({'error': 'receiver_sponsor_id e testo sono obbligatori'}), 400

        # Verifica esistenza destinatario
        receiver = Sponsor.query.get(receiver_sponsor_id)
        if not receiver:
            return jsonify({'error': 'Sponsor destinatario non trovato'}), 404

        # Verifica che destinatario permetta messaggi
        receiver_profile = SponsorProfile.query.filter_by(sponsor_id=receiver_sponsor_id).first()
        if receiver_profile and not receiver_profile.permetti_messaggi:
            return jsonify({'error': 'Questo sponsor ha disabilitato i messaggi'}), 403

        # Verifica se è il primo messaggio tra questi due sponsor (per notifica club)
        is_first_contact = not SponsorMessage.query.filter(
            or_(
                and_(
                    SponsorMessage.sender_sponsor_id == sponsor.id,
                    SponsorMessage.receiver_sponsor_id == receiver_sponsor_id
                ),
                and_(
                    SponsorMessage.sender_sponsor_id == receiver_sponsor_id,
                    SponsorMessage.receiver_sponsor_id == sponsor.id
                )
            )
        ).first()

        # Crea messaggio
        message = SponsorMessage(
            sender_sponsor_id=sponsor.id,
            receiver_sponsor_id=receiver_sponsor_id,
            club_id=sponsor.club_id,  # Per tracking
            testo=testo,
            partnership_proposal_id=data.get('partnership_proposal_id')
        )

        db.session.add(message)
        db.session.commit()

        # TODO: Se is_first_contact == True, crea notifica per club
        # Notifica: "Contatto iniziato tra [Sponsor A] e [Sponsor B]"
        # NON include contenuto messaggi

        return jsonify({
            'message': 'Messaggio inviato con successo',
            'message_data': {
                'id': message.id,
                'sender_sponsor_id': message.sender_sponsor_id,
                'receiver_sponsor_id': message.receiver_sponsor_id,
                'testo': message.testo,
                'created_at': message.created_at.isoformat() if message.created_at else None
            },
            'is_first_contact': is_first_contact
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_message_bp.route('/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Elimina proprio messaggio (solo sender)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        message = SponsorMessage.query.get(message_id)
        if not message:
            return jsonify({'error': 'Messaggio non trovato'}), 404

        # Solo il sender può eliminare
        if message.sender_sponsor_id != sponsor.id:
            return jsonify({'error': 'Non puoi eliminare messaggi di altri'}), 403

        db.session.delete(message)
        db.session.commit()

        return jsonify({'message': 'Messaggio eliminato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_message_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Conta totale messaggi non letti"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        count = SponsorMessage.query.filter_by(
            receiver_sponsor_id=sponsor.id,
            letto=False
        ).count()

        return jsonify({'unread_count': count}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
