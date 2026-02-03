from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Asset, HeadOfTerms, Notification
from datetime import datetime

asset_bp = Blueprint('asset', __name__)


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


# CREATE - Crea nuovo asset (solo Club)
@asset_bp.route('/contracts/<int:contract_id>/assets', methods=['POST'])
@jwt_required()
def create_asset(contract_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Verifica che il contratto appartenga al club
    contract = HeadOfTerms.query.filter_by(id=contract_id, club_id=club_id).first()
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    data = request.json

    # Validazione
    required_fields = ['categoria', 'nome']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    # Crea asset
    asset = Asset(
        head_of_terms_id=contract_id,
        categoria=data['categoria'],
        nome=data['nome'],
        descrizione=data.get('descrizione', ''),
        quantita_totale=data.get('quantita_totale'),  # None se non specificato
        quantita_utilizzata=data.get('quantita_utilizzata', 0),
        valore=data.get('valore'),
        status=data.get('status', 'da_consegnare')
    )

    db.session.add(asset)
    db.session.commit()

    # Crea notifica per lo sponsor
    create_notification(
        user_type='sponsor',
        user_id=contract.sponsor_id,
        tipo='nuovo_asset',
        titolo='Nuovo asset aggiunto',
        messaggio=f'È stato aggiunto un nuovo asset al contratto: {data["nome"]}',
        link=f'/sponsor/contracts/{contract_id}'
    )

    return jsonify({
        'message': 'Asset creato con successo',
        'asset': {
            'id': asset.id,
            'categoria': asset.categoria,
            'nome': asset.nome,
            'quantita_totale': asset.quantita_totale,
            'quantita_utilizzata': asset.quantita_utilizzata,
            'status': asset.status
        }
    }), 201


# READ - Ottieni tutti gli asset di un contratto
@asset_bp.route('/contracts/<int:contract_id>/assets', methods=['GET'])
@jwt_required()
def get_assets(contract_id):
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

    assets = Asset.query.filter_by(head_of_terms_id=contract_id).all()

    assets_data = []
    for asset in assets:
        assets_data.append({
            'id': asset.id,
            'categoria': asset.categoria,
            'nome': asset.nome,
            'descrizione': asset.descrizione,
            'quantita_totale': asset.quantita_totale,
            'quantita_utilizzata': asset.quantita_utilizzata,
            'valore': asset.valore,
            'status': asset.status,
            'progresso': round((asset.quantita_utilizzata / asset.quantita_totale * 100) if asset.quantita_totale and asset.quantita_totale > 0 else 0, 2),
            'created_at': asset.created_at.isoformat(),
            'updated_at': asset.updated_at.isoformat()
        })

    return jsonify({'assets': assets_data}), 200


# READ - Ottieni tutti gli asset del club
@asset_bp.route('/assets', methods=['GET'])
@jwt_required()
def get_all_assets():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Ottieni tutti i contratti del club
    contracts = HeadOfTerms.query.filter_by(club_id=user_id).all()
    contract_ids = [c.id for c in contracts]

    # Ottieni tutti gli asset di questi contratti
    assets = Asset.query.filter(Asset.head_of_terms_id.in_(contract_ids)).all()

    assets_data = []
    for asset in assets:
        assets_data.append({
            'id': asset.id,
            'head_of_terms_id': asset.head_of_terms_id,  # IMPORTANTE per il filtro
            'categoria': asset.categoria,
            'nome': asset.nome,
            'descrizione': asset.descrizione,
            'quantita_totale': asset.quantita_totale,
            'quantita_utilizzata': asset.quantita_utilizzata,
            'valore': asset.valore,
            'status': asset.status,
            'progresso': round((asset.quantita_utilizzata / asset.quantita_totale * 100) if asset.quantita_totale and asset.quantita_totale > 0 else 0, 2),
            'created_at': asset.created_at.isoformat(),
            'updated_at': asset.updated_at.isoformat()
        })

    return jsonify({'assets': assets_data}), 200


# READ - Ottieni singolo asset
@asset_bp.route('/assets/<int:asset_id>', methods=['GET'])
@jwt_required()
def get_asset(asset_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({'error': 'Asset non trovato'}), 404

    # Verifica permessi
    contract = HeadOfTerms.query.get(asset.head_of_terms_id)
    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    return jsonify({
        'asset': {
            'id': asset.id,
            'categoria': asset.categoria,
            'nome': asset.nome,
            'descrizione': asset.descrizione,
            'quantita_totale': asset.quantita_totale,
            'quantita_utilizzata': asset.quantita_utilizzata,
            'valore': asset.valore,
            'status': asset.status,
            'progresso': round((asset.quantita_utilizzata / asset.quantita_totale * 100) if asset.quantita_totale and asset.quantita_totale > 0 else 0, 2),
            'created_at': asset.created_at.isoformat(),
            'updated_at': asset.updated_at.isoformat()
        }
    }), 200


# UPDATE - Modifica asset (Club può tutto, Sponsor può solo aggiornare quantità utilizzata)
@asset_bp.route('/assets/<int:asset_id>', methods=['PUT'])
@jwt_required()
def update_asset(asset_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({'error': 'Asset non trovato'}), 404

    # Verifica permessi
    contract = HeadOfTerms.query.get(asset.head_of_terms_id)
    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Club può modificare tutto
    if role == 'club':
        if 'categoria' in data:
            asset.categoria = data['categoria']
        if 'nome' in data:
            asset.nome = data['nome']
        if 'descrizione' in data:
            asset.descrizione = data['descrizione']
        if 'quantita_totale' in data:
            asset.quantita_totale = data['quantita_totale']
        if 'quantita_utilizzata' in data:
            asset.quantita_utilizzata = data['quantita_utilizzata']
        if 'valore' in data:
            asset.valore = data['valore']
        if 'status' in data:
            asset.status = data['status']

    # Sponsor può solo segnalare utilizzo
    elif role == 'sponsor':
        if 'quantita_utilizzata' in data:
            asset.quantita_utilizzata = data['quantita_utilizzata']

            # Crea notifica per il club
            create_notification(
                user_type='club',
                user_id=contract.club_id,
                tipo='asset_utilizzato',
                titolo='Asset utilizzato',
                messaggio=f'Lo sponsor ha utilizzato l\'asset: {asset.nome}',
                link=f'/club/contracts/{contract.id}'
            )

    db.session.commit()

    return jsonify({'message': 'Asset aggiornato con successo'}), 200


# DELETE - Elimina asset (solo Club)
@asset_bp.route('/assets/<int:asset_id>', methods=['DELETE'])
@jwt_required()
def delete_asset(asset_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({'error': 'Asset non trovato'}), 404

    # Verifica che il contratto appartenga al club
    contract = HeadOfTerms.query.get(asset.head_of_terms_id)
    if contract.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(asset)
    db.session.commit()

    return jsonify({'message': 'Asset eliminato con successo'}), 200
