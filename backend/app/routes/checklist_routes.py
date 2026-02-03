from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Checklist, HeadOfTerms, Asset, Notification, Club, Sponsor
from datetime import datetime

checklist_bp = Blueprint('checklist', __name__)


def verify_club():
    """Verifica che l'utente sia un club"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    club_id = int(get_jwt_identity())
    return club_id


def verify_sponsor():
    """Verifica che l'utente sia uno sponsor"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None
    sponsor_id = int(get_jwt_identity())
    return sponsor_id


def create_notification(user_type, user_id, tipo, titolo, messaggio, link=None):
    """Crea una notifica"""
    notification = Notification(
        user_type=user_type,
        user_id=user_id,
        tipo=tipo,
        titolo=titolo,
        messaggio=messaggio,
        link=link
    )
    db.session.add(notification)
    db.session.commit()


# CREATE - Crea nuova checklist (Club e Sponsor possono creare task)
@checklist_bp.route('/contracts/<int:contract_id>/checklists', methods=['POST'])
@jwt_required()
def create_checklist(contract_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica che il contratto esista e l'utente abbia accesso
    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Validazione
    required_fields = ['titolo', 'assegnato_a']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    if data['assegnato_a'] not in ['club', 'sponsor']:
        return jsonify({'error': 'assegnato_a deve essere "club" o "sponsor"'}), 400

    # Ottieni informazioni su chi ha creato la checklist
    creato_da_user = None
    if role == 'club':
        club = Club.query.get(user_id)
        creato_da_user = club.nome if club else 'Club'
    else:
        sponsor = Sponsor.query.get(user_id)
        creato_da_user = sponsor.ragione_sociale if sponsor else 'Sponsor'

    # Converti scadenza da stringa a date object
    scadenza_date = None
    if data.get('scadenza'):
        try:
            scadenza_date = datetime.fromisoformat(data['scadenza']).date()
        except (ValueError, TypeError):
            pass

    # Crea checklist
    checklist = Checklist(
        head_of_terms_id=contract_id,
        asset_id=data.get('asset_id'),
        titolo=data['titolo'],
        descrizione=data.get('descrizione', ''),
        priorita=data.get('priorita', 'media'),
        assegnato_a=data['assegnato_a'],
        scadenza=scadenza_date,
        creato_da=role,
        creato_da_user=creato_da_user
    )

    db.session.add(checklist)
    db.session.commit()

    # Crea notifica per il destinatario
    if data['assegnato_a'] == 'club':
        create_notification(
            user_type='club',
            user_id=contract.club_id,
            tipo='nuova_task',
            titolo='Nuova attività assegnata',
            messaggio=f'Ti è stata assegnata una nuova attività: {data["titolo"]}',
            link=f'/club/contracts/{contract_id}/checklists'
        )
    else:
        create_notification(
            user_type='sponsor',
            user_id=contract.sponsor_id,
            tipo='nuova_task',
            titolo='Nuova attività assegnata',
            messaggio=f'Ti è stata assegnata una nuova attività: {data["titolo"]}',
            link=f'/sponsor/contracts/{contract_id}/checklists'
        )

    return jsonify({
        'message': 'Checklist creata con successo',
        'checklist': {
            'id': checklist.id,
            'titolo': checklist.titolo,
            'assegnato_a': checklist.assegnato_a,
            'priorita': checklist.priorita,
            'completato': checklist.completato
        }
    }), 201


# READ - Ottieni tutte le checklist di un contratto
@checklist_bp.route('/contracts/<int:contract_id>/checklists', methods=['GET'])
@jwt_required()
def get_checklists(contract_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica permessi
    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    checklists = Checklist.query.filter_by(head_of_terms_id=contract_id).all()

    checklists_data = []
    for checklist in checklists:
        asset_info = None
        if checklist.asset_id:
            asset = Asset.query.get(checklist.asset_id)
            if asset:
                asset_info = {
                    'id': asset.id,
                    'nome': asset.nome
                }

        checklists_data.append({
            'id': checklist.id,
            'titolo': checklist.titolo,
            'descrizione': checklist.descrizione,
            'priorita': checklist.priorita,
            'assegnato_a': checklist.assegnato_a,
            'scadenza': checklist.scadenza.isoformat() if checklist.scadenza else None,
            'completato': checklist.completato,
            'completato_da': checklist.completato_da,
            'completato_il': checklist.completato_il.isoformat() if checklist.completato_il else None,
            'note': checklist.note,
            'asset': asset_info,
            'creato_da': checklist.creato_da,
            'creato_da_user': checklist.creato_da_user,
            'created_at': checklist.created_at.isoformat(),
            'updated_at': checklist.updated_at.isoformat()
        })

    return jsonify({'checklists': checklists_data}), 200


# READ - Ottieni tutte le checklist assegnate all'utente corrente
@checklist_bp.route('/my-checklists', methods=['GET'])
@jwt_required()
def get_my_checklists():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role not in ['club', 'sponsor']:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Ottieni tutti i contratti dell'utente
    if role == 'club':
        contracts = HeadOfTerms.query.filter_by(club_id=user_id).all()
    else:
        contracts = HeadOfTerms.query.filter_by(sponsor_id=user_id).all()

    contract_ids = [c.id for c in contracts]

    # Ottieni checklist assegnate all'utente
    checklists = Checklist.query.filter(
        Checklist.head_of_terms_id.in_(contract_ids),
        Checklist.assegnato_a == role
    ).all()

    checklists_data = []
    for checklist in checklists:
        contract = HeadOfTerms.query.get(checklist.head_of_terms_id)
        sponsor = Sponsor.query.get(contract.sponsor_id)

        checklists_data.append({
            'id': checklist.id,
            'titolo': checklist.titolo,
            'descrizione': checklist.descrizione,
            'priorita': checklist.priorita,
            'completato': checklist.completato,
            'completato_il': checklist.completato_il.isoformat() if checklist.completato_il else None,
            'contract': {
                'id': contract.id,
                'nome_contratto': contract.nome_contratto
            },
            'sponsor': {
                'id': sponsor.id,
                'ragione_sociale': sponsor.ragione_sociale
            } if sponsor else None,
            'created_at': checklist.created_at.isoformat()
        })

    return jsonify({'checklists': checklists_data}), 200


# UPDATE - Completa/Modifica checklist
@checklist_bp.route('/checklists/<int:checklist_id>', methods=['PUT'])
@jwt_required()
def update_checklist(checklist_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    checklist = Checklist.query.get(checklist_id)
    if not checklist:
        return jsonify({'error': 'Checklist non trovata'}), 404

    # Verifica permessi
    contract = HeadOfTerms.query.get(checklist.head_of_terms_id)
    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Aggiorna campi (solo chi ha creato o chi è assegnato può modificare)
    if 'titolo' in data and role == 'club':
        checklist.titolo = data['titolo']
    if 'descrizione' in data and role == 'club':
        checklist.descrizione = data['descrizione']
    if 'priorita' in data and role == 'club':
        checklist.priorita = data['priorita']
    if 'note' in data:
        checklist.note = data['note']

    # Completa checklist (solo chi è assegnato)
    if 'completato' in data and checklist.assegnato_a == role:
        checklist.completato = data['completato']
        if data['completato']:
            checklist.completato_il = datetime.utcnow()
            # Ottieni email/username dell'utente
            if role == 'club':
                club = Club.query.get(user_id)
                checklist.completato_da = club.email if club else 'Club'
            else:
                sponsor = Sponsor.query.get(user_id)
                checklist.completato_da = sponsor.email if sponsor else 'Sponsor'

            # Crea notifica per l'altro ruolo
            if role == 'club':
                create_notification(
                    user_type='sponsor',
                    user_id=contract.sponsor_id,
                    tipo='checklist_completata',
                    titolo='Attività completata',
                    messaggio=f'L\'attività "{checklist.titolo}" è stata completata dal club',
                    link=f'/sponsor/contracts/{contract.id}/checklists'
                )
            else:
                create_notification(
                    user_type='club',
                    user_id=contract.club_id,
                    tipo='checklist_completata',
                    titolo='Attività completata',
                    messaggio=f'L\'attività "{checklist.titolo}" è stata completata dallo sponsor',
                    link=f'/club/contracts/{contract.id}/checklists'
                )
        else:
            checklist.completato_il = None
            checklist.completato_da = None

    db.session.commit()

    return jsonify({'message': 'Checklist aggiornata con successo'}), 200


# DELETE - Elimina checklist (solo chi l'ha creata può eliminarla)
@checklist_bp.route('/checklists/<int:checklist_id>', methods=['DELETE'])
@jwt_required()
def delete_checklist(checklist_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    checklist = Checklist.query.get(checklist_id)
    if not checklist:
        return jsonify({'error': 'Checklist non trovata'}), 404

    # Verifica permessi
    contract = HeadOfTerms.query.get(checklist.head_of_terms_id)
    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(checklist)
    db.session.commit()

    return jsonify({'message': 'Checklist eliminata con successo'}), 200
