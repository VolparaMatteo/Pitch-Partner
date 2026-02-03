from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Message, Club, Sponsor, Notification
from datetime import datetime

message_bp = Blueprint('message', __name__)


# CREATE - Invia messaggio
@message_bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role not in ['club', 'sponsor']:
        return jsonify({'error': 'Solo club e sponsor possono inviare messaggi'}), 403

    data = request.get_json()

    # Validazione
    if not data.get('testo'):
        return jsonify({'error': 'Il testo del messaggio è obbligatorio'}), 400

    if not data.get('receiver_type') or not data.get('receiver_id'):
        return jsonify({'error': 'Destinatario non specificato'}), 400

    receiver_type = data['receiver_type']
    receiver_id = int(data['receiver_id'])

    # Verifica che mittente e destinatario siano collegati
    if role == 'club':
        # Club invia a Sponsor
        sender = Club.query.get(user_id)
        if not sender:
            return jsonify({'error': 'Club non trovato'}), 404

        if receiver_type != 'sponsor':
            return jsonify({'error': 'Un club può inviare messaggi solo agli sponsor'}), 403

        receiver = Sponsor.query.get(receiver_id)
        if not receiver:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        # Verifica che lo sponsor appartenga al club
        if receiver.club_id != user_id:
            return jsonify({'error': 'Puoi inviare messaggi solo ai tuoi sponsor'}), 403

        club_id = user_id
        sponsor_id = receiver_id
        sender_name = sender.nome
        receiver_name = receiver.ragione_sociale

    else:  # role == 'sponsor'
        # Sponsor invia a Club
        sender = Sponsor.query.get(user_id)
        if not sender:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        if receiver_type != 'club':
            return jsonify({'error': 'Uno sponsor può inviare messaggi solo al club'}), 403

        receiver = Club.query.get(receiver_id)
        if not receiver:
            return jsonify({'error': 'Club non trovato'}), 404

        # Verifica che lo sponsor appartenga al club
        if sender.club_id != receiver_id:
            return jsonify({'error': 'Puoi inviare messaggi solo al tuo club'}), 403

        club_id = receiver_id
        sponsor_id = user_id
        sender_name = sender.ragione_sociale
        receiver_name = receiver.nome

    # Crea messaggio
    message = Message(
        club_id=club_id,
        sponsor_id=sponsor_id,
        sender_type=role,
        sender_id=user_id,
        sender_name=sender_name,
        contract_id=data.get('contract_id'),
        testo=data['testo'],
        attachment_url=data.get('attachment_url'),
        attachment_type=data.get('attachment_type'),
        attachment_name=data.get('attachment_name')
    )

    db.session.add(message)
    db.session.commit()

    # Crea notifica per il destinatario
    notification = Notification(
        user_type=receiver_type,
        user_id=receiver_id,
        tipo='nuovo_messaggio',
        titolo=f'Nuovo messaggio da {sender_name}',
        messaggio=data['testo'][:100] + ('...' if len(data['testo']) > 100 else ''),
        link=f'/messages/{club_id}/{sponsor_id}'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({
        'message': 'Messaggio inviato con successo',
        'data': {
            'id': message.id,
            'club_id': message.club_id,
            'sponsor_id': message.sponsor_id,
            'sender_type': message.sender_type,
            'sender_id': message.sender_id,
            'sender_name': message.sender_name,
            'contract_id': message.contract_id,
            'testo': message.testo,
            'attachment_url': message.attachment_url,
            'attachment_type': message.attachment_type,
            'attachment_name': message.attachment_name,
            'letto': message.letto,
            'data_invio': message.data_invio.isoformat()
        }
    }), 201


# UPLOAD - Carica allegato
@message_bp.route('/messages/upload', methods=['POST'])
@jwt_required()
def upload_attachment():
    if 'file' not in request.files:
        return jsonify({'error': 'Nessun file caricato'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400

    if file:
        from werkzeug.utils import secure_filename
        import os
        from flask import current_app

        filename = secure_filename(file.filename)
        # Aggiungi timestamp per unicità
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filename = timestamp + filename
        
        # Assicurati che la cartella esista
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'chat')
        os.makedirs(upload_folder, exist_ok=True)
        
        file.save(os.path.join(upload_folder, filename))
        
        # Determina tipo
        ext = filename.rsplit('.', 1)[1].lower()
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
            att_type = 'image'
        elif ext in ['mp4', 'mov', 'avi', 'webm']:
            att_type = 'video'
        else:
            att_type = 'document'
            
        return jsonify({
            'url': f'/static/uploads/chat/{filename}',
            'type': att_type,
            'name': file.filename
        }), 200


# READ - Ottieni conversazione tra club e sponsor
@message_bp.route('/messages/<int:club_id>/<int:sponsor_id>', methods=['GET'])
@jwt_required()
def get_conversation(club_id, sponsor_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica accesso
    if role == 'club':
        if user_id != club_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor':
        sponsor = Sponsor.query.get(user_id)
        if not sponsor or sponsor.club_id != club_id or sponsor.id != sponsor_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri opzionali
    contract_id = request.args.get('contract_id', type=int)
    limit = request.args.get('limit', type=int)

    query = Message.query.filter_by(club_id=club_id, sponsor_id=sponsor_id)

    if contract_id:
        query = query.filter_by(contract_id=contract_id)

    query = query.order_by(Message.data_invio.asc())

    if limit:
        query = query.limit(limit)

    messages = query.all()

    messages_data = []
    for msg in messages:
        messages_data.append({
            'id': msg.id,
            'club_id': msg.club_id,
            'sponsor_id': msg.sponsor_id,
            'sender_type': msg.sender_type,
            'sender_id': msg.sender_id,
            'sender_name': msg.sender_name,
            'contract_id': msg.contract_id,
            'testo': msg.testo,
            'attachment_url': msg.attachment_url,
            'attachment_type': msg.attachment_type,
            'attachment_name': msg.attachment_name,
            'letto': msg.letto,
            'data_invio': msg.data_invio.isoformat(),
            'data_lettura': msg.data_lettura.isoformat() if msg.data_lettura else None
        })

    # Segna come letti i messaggi ricevuti
    unread_messages = Message.query.filter(
        Message.club_id == club_id,
        Message.sponsor_id == sponsor_id,
        Message.sender_type != role,
        Message.letto == False
    ).all()

    for msg in unread_messages:
        msg.letto = True
        msg.data_lettura = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'messages': messages_data,
        'total': len(messages_data)
    }), 200


# READ - Ottieni tutte le conversazioni dell'utente
@message_bp.route('/messages/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role not in ['club', 'sponsor']:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    conversations = []

    if role == 'club':
        # Ottieni tutti gli sponsor del club
        sponsors = Sponsor.query.filter_by(club_id=user_id).all()

        for sponsor in sponsors:
            # Ottieni ultimo messaggio
            last_message = Message.query.filter_by(
                club_id=user_id,
                sponsor_id=sponsor.id
            ).order_by(Message.data_invio.desc()).first()

            # Conta messaggi non letti
            unread_count = Message.query.filter(
                Message.club_id == user_id,
                Message.sponsor_id == sponsor.id,
                Message.sender_type == 'sponsor',
                Message.letto == False
            ).count()

            conversations.append({
                'club_id': user_id,
                'sponsor_id': sponsor.id,
                'sponsor_name': sponsor.ragione_sociale,
                'sponsor_logo': sponsor.logo_url,
                'last_message': {
                    'testo': last_message.testo,
                    'sender_type': last_message.sender_type,
                    'data_invio': last_message.data_invio.isoformat()
                } if last_message else None,
                'unread_count': unread_count
            })

    else:  # role == 'sponsor'
        sponsor = Sponsor.query.get(user_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        club = Club.query.get(sponsor.club_id)

        # Ottieni ultimo messaggio
        last_message = Message.query.filter_by(
            club_id=sponsor.club_id,
            sponsor_id=user_id
        ).order_by(Message.data_invio.desc()).first()

        # Conta messaggi non letti
        unread_count = Message.query.filter(
            Message.club_id == sponsor.club_id,
            Message.sponsor_id == user_id,
            Message.sender_type == 'club',
            Message.letto == False
        ).count()

        conversations.append({
            'club_id': sponsor.club_id,
            'sponsor_id': user_id,
            'club_name': club.nome,
            'club_logo': club.logo_url,
            'last_message': {
                'testo': last_message.testo,
                'sender_type': last_message.sender_type,
                'data_invio': last_message.data_invio.isoformat()
            } if last_message else None,
            'unread_count': unread_count
        })

    # Ordina per data ultimo messaggio
    conversations.sort(key=lambda x: x['last_message']['data_invio'] if x['last_message'] else '', reverse=True)

    return jsonify({
        'conversations': conversations,
        'total': len(conversations)
    }), 200


# READ - Conta messaggi non letti
@message_bp.route('/messages/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role not in ['club', 'sponsor']:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if role == 'club':
        unread_count = Message.query.filter(
            Message.club_id == user_id,
            Message.sender_type == 'sponsor',
            Message.letto == False
        ).count()
    else:  # sponsor
        sponsor = Sponsor.query.get(user_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        unread_count = Message.query.filter(
            Message.sponsor_id == user_id,
            Message.sender_type == 'club',
            Message.letto == False
        ).count()

    return jsonify({'unread_count': unread_count}), 200


# UPDATE - Segna messaggio come letto
@message_bp.route('/messages/<int:message_id>/read', methods=['PUT'])
@jwt_required()
def mark_message_as_read(message_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Messaggio non trovato'}), 404

    # Verifica accesso (solo il destinatario può segnare come letto)
    if role == 'club' and message.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor' and message.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Verifica che sia destinatario
    if message.sender_type == role:
        return jsonify({'error': 'Non puoi segnare come letto un tuo messaggio'}), 400

    message.letto = True
    message.data_lettura = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Messaggio segnato come letto'}), 200


# DELETE - Elimina messaggio (solo mittente)
@message_bp.route('/messages/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Messaggio non trovato'}), 404

    # Solo il mittente può eliminare
    if message.sender_type != role or message.sender_id != user_id:
        return jsonify({'error': 'Solo il mittente può eliminare il messaggio'}), 403

    db.session.delete(message)
    db.session.commit()

    return jsonify({'message': 'Messaggio eliminato con successo'}), 200
