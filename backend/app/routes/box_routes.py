from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import BusinessBox, BoxInvite, Match, Sponsor, Notification
from datetime import datetime
import uuid
import qrcode
import io
import base64
import os

box_bp = Blueprint('box', __name__)


# CREATE - Crea business box
@box_bp.route('/business-boxes', methods=['POST'])
@jwt_required()
def create_business_box():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Solo club può creare business box
    if role != 'club':
        return jsonify({'error': 'Solo i club possono creare business box'}), 403

    data = request.get_json()

    # Validazione
    if not data.get('nome') or not data.get('numero_posti'):
        return jsonify({'error': 'Nome e numero posti sono obbligatori'}), 400

    try:
        box = BusinessBox(
            club_id=user_id,
            contract_id=data.get('contract_id'),
            sponsor_id=data.get('sponsor_id'),
            nome=data['nome'],
            settore=data.get('settore'),
            numero_posti=data['numero_posti'],
            catering=data.get('catering', False),
            parcheggio=data.get('parcheggio', False),
            meet_and_greet=data.get('meet_and_greet', False),
            merchandising=data.get('merchandising', False),
            tipo=data.get('tipo', 'stagionale')
        )

        db.session.add(box)
        db.session.commit()

        return jsonify({
            'message': 'Business box creato con successo',
            'box': {
                'id': box.id,
                'nome': box.nome,
                'numero_posti': box.numero_posti,
                'sponsor_id': box.sponsor_id
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Ottieni business boxes
@box_bp.route('/business-boxes', methods=['GET'])
@jwt_required()
def get_business_boxes():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role == 'club':
        boxes = BusinessBox.query.filter_by(club_id=user_id).all()
    elif role == 'sponsor':
        boxes = BusinessBox.query.filter_by(sponsor_id=user_id).all()
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    boxes_data = []
    for box in boxes:
        # Conta inviti totali
        total_invites = len(box.invites)

        boxes_data.append({
            'id': box.id,
            'nome': box.nome,
            'settore': box.settore,
            'numero_posti': box.numero_posti,
            'catering': box.catering,
            'parcheggio': box.parcheggio,
            'meet_and_greet': box.meet_and_greet,
            'merchandising': box.merchandising,
            'tipo': box.tipo,
            'sponsor_id': box.sponsor_id,
            'total_invites': total_invites
        })

    return jsonify({'boxes': boxes_data}), 200


# CREATE - Invia invito per business box
@box_bp.route('/business-boxes/<int:box_id>/invites', methods=['POST'])
@jwt_required()
def create_box_invite(box_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    box = BusinessBox.query.get(box_id)
    if not box:
        return jsonify({'error': 'Business box non trovato'}), 404

    # Verifica accesso
    if role == 'club':
        if box.club_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor':
        if box.sponsor_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione
    if not data.get('match_id') or not data.get('nome') or not data.get('cognome') or not data.get('email'):
        return jsonify({'error': 'Match ID, nome, cognome ed email sono obbligatori'}), 400

    match = Match.query.get(data['match_id'])
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    # Verifica posti disponibili per quella partita
    existing_invites = BoxInvite.query.filter_by(
        business_box_id=box_id,
        match_id=data['match_id']
    ).count()

    if existing_invites >= box.numero_posti:
        return jsonify({'error': 'Box completo per questa partita'}), 400

    try:
        # Genera codice invito univoco
        codice_invito = str(uuid.uuid4())

        # Genera QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(codice_invito)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Salva QR code come immagine
        qr_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'qr_codes')
        os.makedirs(qr_folder, exist_ok=True)
        qr_filename = f"{codice_invito}.png"
        qr_path = os.path.join(qr_folder, qr_filename)
        img.save(qr_path)
        qr_url = f"/api/uploads/qr_codes/{qr_filename}"

        # Crea invito
        invite = BoxInvite(
            business_box_id=box_id,
            match_id=data['match_id'],
            sponsor_id=box.sponsor_id,
            nome=data['nome'],
            cognome=data['cognome'],
            email=data['email'],
            telefono=data.get('telefono'),
            azienda=data.get('azienda'),
            ruolo=data.get('ruolo'),
            codice_invito=codice_invito,
            qr_code_url=qr_url,
            status='inviato',
            inviato_il=datetime.utcnow(),
            note_ospite=data.get('note_ospite'),
            note_sponsor=data.get('note_sponsor'),
            vip=data.get('vip', False),
            parcheggio_richiesto=data.get('parcheggio_richiesto', False),
            badge_nome=data.get('badge_nome') or f"{data['nome']} {data['cognome']}"
        )

        db.session.add(invite)
        db.session.commit()

        # Notifica club del nuovo invito
        if role == 'sponsor':
            notification = Notification(
                user_type='club',
                user_id=box.club_id,
                tipo='nuovo_invito_box',
                titolo='Nuovo ospite registrato per Business Box',
                messaggio=f'{data["nome"]} {data["cognome"]} invitato per partita vs {match.avversario}',
                link=f'/matches/{match.id}'
            )
            db.session.add(notification)
            db.session.commit()

        return jsonify({
            'message': 'Invito creato con successo',
            'invite': {
                'id': invite.id,
                'codice_invito': invite.codice_invito,
                'qr_code_url': invite.qr_code_url,
                'nome': invite.nome,
                'cognome': invite.cognome,
                'email': invite.email,
                'status': invite.status
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Ottieni inviti per business box
@box_bp.route('/business-boxes/<int:box_id>/invites', methods=['GET'])
@jwt_required()
def get_box_invites(box_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    box = BusinessBox.query.get(box_id)
    if not box:
        return jsonify({'error': 'Business box non trovato'}), 404

    # Verifica accesso
    if role == 'club':
        if box.club_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor':
        if box.sponsor_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    invites = BoxInvite.query.filter_by(business_box_id=box_id).order_by(BoxInvite.created_at.desc()).all()

    invites_data = []
    for invite in invites:
        match = Match.query.get(invite.match_id)
        invites_data.append({
            'id': invite.id,
            'business_box_id': invite.business_box_id,
            'match_id': invite.match_id,
            'match_info': {
                'avversario': match.avversario if match else None,
                'data_ora': match.data_ora.isoformat() if match else None
            } if match else None,
            'sponsor_id': invite.sponsor_id,
            'nome': invite.nome,
            'cognome': invite.cognome,
            'email': invite.email,
            'telefono': invite.telefono,
            'azienda': invite.azienda,
            'ruolo': invite.ruolo,
            'codice_invito': invite.codice_invito,
            'qr_code_url': invite.qr_code_url,
            'status': invite.status,
            'inviato_il': invite.inviato_il.isoformat() if invite.inviato_il else None,
            'confermato_il': invite.confermato_il.isoformat() if invite.confermato_il else None,
            'check_in_at': invite.check_in_il.isoformat() if invite.check_in_il else None,
            'vip': invite.vip,
            'parcheggio_richiesto': invite.parcheggio_richiesto,
            'badge_nome': invite.badge_nome,
            'note_ospite': invite.note_ospite,
            'created_at': invite.created_at.isoformat() if invite.created_at else None
        })

    return jsonify({
        'box': {
            'id': box.id,
            'nome': box.nome,
            'settore': box.settore,
            'numero_posti': box.numero_posti
        },
        'invites': invites_data
    }), 200


# READ - Ottieni inviti per partita
@box_bp.route('/matches/<int:match_id>/box-invites', methods=['GET'])
@jwt_required()
def get_match_invites(match_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    # Verifica accesso
    if role == 'club':
        if match.club_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
        # Club vede tutti gli inviti
        invites = BoxInvite.query.filter_by(match_id=match_id).all()
    elif role == 'sponsor':
        # Sponsor vede solo i suoi inviti
        invites = BoxInvite.query.filter_by(match_id=match_id, sponsor_id=user_id).all()
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    invites_data = []
    for invite in invites:
        box = BusinessBox.query.get(invite.business_box_id)

        invites_data.append({
            'id': invite.id,
            'business_box': {
                'id': box.id,
                'nome': box.nome
            } if box else None,
            'sponsor_id': invite.sponsor_id,
            'nome': invite.nome,
            'cognome': invite.cognome,
            'email': invite.email,
            'telefono': invite.telefono,
            'azienda': invite.azienda,
            'ruolo': invite.ruolo,
            'codice_invito': invite.codice_invito,
            'qr_code_url': invite.qr_code_url,
            'status': invite.status,
            'inviato_il': invite.inviato_il.isoformat() if invite.inviato_il else None,
            'confermato_il': invite.confermato_il.isoformat() if invite.confermato_il else None,
            'check_in_il': invite.check_in_il.isoformat() if invite.check_in_il else None,
            'vip': invite.vip,
            'parcheggio_richiesto': invite.parcheggio_richiesto,
            'badge_nome': invite.badge_nome,
            'note_ospite': invite.note_ospite
        })

    return jsonify({'invites': invites_data}), 200


# READ - Ottieni tutti gli inviti di uno sponsor
@box_bp.route('/sponsor/box-invites', methods=['GET'])
@jwt_required()
def get_sponsor_invites():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'sponsor':
        return jsonify({'error': 'Solo sponsor possono accedere'}), 403

    invites = BoxInvite.query.filter_by(sponsor_id=user_id).order_by(BoxInvite.created_at.desc()).all()

    invites_data = []
    for invite in invites:
        match = Match.query.get(invite.match_id)
        box = BusinessBox.query.get(invite.business_box_id)

        invites_data.append({
            'id': invite.id,
            'match': {
                'id': match.id,
                'data_ora': match.data_ora.isoformat(),
                'avversario': match.avversario
            } if match else None,
            'business_box': {
                'id': box.id,
                'nome': box.nome
            } if box else None,
            'nome': invite.nome,
            'cognome': invite.cognome,
            'email': invite.email,
            'status': invite.status,
            'qr_code_url': invite.qr_code_url
        })

    return jsonify({'invites': invites_data}), 200


# UPDATE - Check-in ospite (scansione QR)
@box_bp.route('/box-invites/check-in', methods=['POST'])
@jwt_required()
def check_in_guest():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Solo club può fare check-in
    if role != 'club':
        return jsonify({'error': 'Solo il club può effettuare check-in'}), 403

    data = request.get_json()
    codice_invito = data.get('codice_invito')

    if not codice_invito:
        return jsonify({'error': 'Codice invito mancante'}), 400

    invite = BoxInvite.query.filter_by(codice_invito=codice_invito).first()
    if not invite:
        return jsonify({'error': 'Invito non trovato'}), 404

    # Verifica che sia per il club corretto
    box = BusinessBox.query.get(invite.business_box_id)
    if not box or box.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Verifica che non sia già stato fatto check-in
    if invite.status == 'check_in':
        return jsonify({
            'error': 'Check-in già effettuato',
            'check_in_il': invite.check_in_il.isoformat()
        }), 400

    try:
        invite.status = 'check_in'
        invite.check_in_il = datetime.utcnow()
        db.session.commit()

        # Notifica sponsor
        notification = Notification(
            user_type='sponsor',
            user_id=invite.sponsor_id,
            tipo='check_in_ospite',
            titolo='Ospite arrivato',
            messaggio=f'{invite.nome} {invite.cognome} ha effettuato il check-in',
            link=f'/matches/{invite.match_id}'
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({
            'message': 'Check-in effettuato con successo',
            'guest': {
                'nome': invite.nome,
                'cognome': invite.cognome,
                'vip': invite.vip,
                'parcheggio_richiesto': invite.parcheggio_richiesto
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# UPDATE - Conferma partecipazione ospite
@box_bp.route('/box-invites/<string:codice_invito>/confirm', methods=['PUT'])
def confirm_invite(codice_invito):
    """Endpoint pubblico per conferma ospite (da link in email)"""

    invite = BoxInvite.query.filter_by(codice_invito=codice_invito).first()
    if not invite:
        return jsonify({'error': 'Invito non trovato'}), 404

    data = request.get_json()

    try:
        invite.status = 'confermato' if data.get('confermato', True) else 'rifiutato'
        invite.confermato_il = datetime.utcnow()

        if data.get('note_ospite'):
            invite.note_ospite = data['note_ospite']

        db.session.commit()

        return jsonify({
            'message': 'Risposta registrata con successo',
            'status': invite.status
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE - Annulla invito
@box_bp.route('/box-invites/<int:invite_id>', methods=['DELETE'])
@jwt_required()
def delete_invite(invite_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    invite = BoxInvite.query.get(invite_id)
    if not invite:
        return jsonify({'error': 'Invito non trovato'}), 404

    # Verifica accesso
    if role == 'sponsor':
        if invite.sponsor_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'club':
        box = BusinessBox.query.get(invite.business_box_id)
        if not box or box.club_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    try:
        db.session.delete(invite)
        db.session.commit()
        return jsonify({'message': 'Invito annullato con successo'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Serve QR codes
from flask import send_from_directory
QR_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'qr_codes')

@box_bp.route('/uploads/qr_codes/<filename>')
def serve_qr_code(filename):
    return send_from_directory(QR_FOLDER, filename)
