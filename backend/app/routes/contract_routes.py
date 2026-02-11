from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import HeadOfTerms, Club, Sponsor, Asset, Checklist, Notification
from datetime import datetime

contract_bp = Blueprint('contract', __name__)


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


# CREATE - Crea nuovo contratto (solo Club)
@contract_bp.route('/contracts', methods=['POST'])
@jwt_required()
def create_contract():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Validazione
    required_fields = ['sponsor_id', 'nome_contratto', 'compenso', 'data_inizio', 'data_fine']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    # Verifica che lo sponsor appartenga al club
    sponsor = Sponsor.query.filter_by(id=data['sponsor_id'], club_id=club_id).first()
    if not sponsor:
        return jsonify({'error': 'Sponsor non trovato o non autorizzato'}), 404

    # Crea contratto
    contract = HeadOfTerms(
        club_id=club_id,
        sponsor_id=data['sponsor_id'],
        nome_contratto=data['nome_contratto'],
        compenso=data['compenso'],
        data_inizio=datetime.fromisoformat(data['data_inizio']),
        data_fine=datetime.fromisoformat(data['data_fine']),
        descrizione=data.get('descrizione', ''),
        status=data.get('status', 'bozza')
    )

    db.session.add(contract)
    db.session.commit()

    # Crea notifica per lo sponsor
    create_notification(
        user_type='sponsor',
        user_id=data['sponsor_id'],
        tipo='nuovo_contratto',
        titolo='Nuovo contratto creato',
        messaggio=f'È stato creato un nuovo contratto: {data["nome_contratto"]}',
        link=f'/sponsor/contracts/{contract.id}'
    )

    return jsonify({
        'message': 'Contratto creato con successo',
        'contract': {
            'id': contract.id,
            'nome_contratto': contract.nome_contratto,
            'compenso': contract.compenso,
            'data_inizio': contract.data_inizio.isoformat(),
            'data_fine': contract.data_fine.isoformat(),
            'status': contract.status
        }
    }), 201


# READ - Ottieni tutti i contratti
@contract_bp.route('/contracts', methods=['GET'])
@jwt_required()
def get_contracts():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role == 'club':
        contracts = HeadOfTerms.query.filter_by(club_id=user_id).all()
    elif role == 'sponsor':
        contracts = HeadOfTerms.query.filter_by(sponsor_id=user_id).all()
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contracts_data = []
    for contract in contracts:
        sponsor = Sponsor.query.get(contract.sponsor_id)
        club = Club.query.get(contract.club_id)

        # Carica gli asset del contratto
        assets = Asset.query.filter_by(head_of_terms_id=contract.id).all()
        assets_data = [{
            'id': asset.id,
            'categoria': asset.categoria,
            'nome': asset.nome,
            'descrizione': asset.descrizione,
            'quantita_totale': asset.quantita_totale,
            'quantita_utilizzata': asset.quantita_utilizzata,
            'valore': float(asset.valore) if asset.valore else 0,
            'status': asset.status,
            'created_at': asset.created_at.isoformat() if asset.created_at else None,
            'updated_at': asset.updated_at.isoformat() if asset.updated_at else None
        } for asset in assets]

        contracts_data.append({
            'id': contract.id,
            'nome_contratto': contract.nome_contratto,
            'compenso': contract.compenso,
            'data_inizio': contract.data_inizio.isoformat(),
            'data_fine': contract.data_fine.isoformat(),
            'descrizione': contract.descrizione,
            'file_contratto_url': contract.file_contratto_url,
            'status': contract.status,
            'sponsor': {
                'id': sponsor.id,
                'ragione_sociale': sponsor.ragione_sociale,
                'logo_url': sponsor.logo_url
            } if sponsor else None,
            'club': {
                'id': club.id,
                'nome': club.nome,
                'logo_url': club.logo_url
            } if club else None,
            'assets': assets_data,
            'created_at': contract.created_at.isoformat(),
            'updated_at': contract.updated_at.isoformat()
        })

    return jsonify({'contracts': contracts_data}), 200


# READ - Ottieni singolo contratto
@contract_bp.route('/contracts/<int:contract_id>', methods=['GET'])
@jwt_required()
def get_contract(contract_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    # Verifica permessi
    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get(contract.sponsor_id)
    club = Club.query.get(contract.club_id)

    # Carica asset legacy
    assets = Asset.query.filter_by(head_of_terms_id=contract.id).all()
    assets_data = [{
        'id': asset.id,
        'categoria': asset.categoria,
        'nome': asset.nome,
        'descrizione': asset.descrizione,
        'quantita_totale': asset.quantita_totale,
        'quantita_utilizzata': asset.quantita_utilizzata,
        'valore': float(asset.valore) if asset.valore else 0,
        'status': asset.status
    } for asset in assets]

    # Carica anche inventory assets allocati via AssetAllocation
    from app.models import AssetAllocation, InventoryAsset
    allocations = AssetAllocation.query.filter_by(contract_id=contract.id).all()
    inventory_assets_data = []
    for alloc in allocations:
        inv_asset = InventoryAsset.query.get(alloc.asset_id)
        if inv_asset:
            inventory_assets_data.append({
                'allocation_id': alloc.id,
                'asset_id': inv_asset.id,
                'nome': inv_asset.nome,
                'tipo': inv_asset.tipo,
                'categoria': inv_asset.category.nome if inv_asset.category else None,
                'posizione': inv_asset.posizione,
                'dimensioni': inv_asset.dimensioni,
                'immagine_principale': inv_asset.immagine_principale,
                'immagine_url': inv_asset.immagine_principale,
                'prezzo_listino': inv_asset.prezzo_listino,
                'prezzo': alloc.prezzo_concordato or inv_asset.prezzo_listino or 0,
                'quantita_totale': inv_asset.quantita_totale,
                'quantita_allocata': alloc.quantita or 1,
                'prezzo_concordato': alloc.prezzo_concordato,
                'data_inizio': alloc.data_inizio.isoformat() if alloc.data_inizio else None,
                'data_fine': alloc.data_fine.isoformat() if alloc.data_fine else None,
                'status': alloc.status
            })

    return jsonify({
        'contract': {
            'id': contract.id,
            'nome_contratto': contract.nome_contratto,
            'compenso': contract.compenso,
            'data_inizio': contract.data_inizio.isoformat(),
            'data_fine': contract.data_fine.isoformat(),
            'descrizione': contract.descrizione,
            'file_contratto_url': contract.file_contratto_url,
            'status': contract.status,
            'sponsor': {
                'id': sponsor.id,
                'ragione_sociale': sponsor.ragione_sociale,
                'logo_url': sponsor.logo_url
            } if sponsor else None,
            'club': {
                'id': club.id,
                'nome': club.nome,
                'logo_url': club.logo_url
            } if club else None,
            'assets': assets_data,
            'inventory_assets': inventory_assets_data,
            'created_at': contract.created_at.isoformat(),
            'updated_at': contract.updated_at.isoformat()
        }
    }), 200


# GET - Inventory assets allocati a un contratto
@contract_bp.route('/contracts/<int:contract_id>/inventory-assets', methods=['GET'])
@jwt_required()
def get_contract_inventory_assets(contract_id):
    """Ottieni inventory assets allocati a un contratto"""
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    # Verifica permessi
    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import AssetAllocation, InventoryAsset, InventoryCategory

    allocations = AssetAllocation.query.filter_by(contract_id=contract_id).all()

    assets_data = []
    for alloc in allocations:
        inv_asset = InventoryAsset.query.get(alloc.asset_id)
        if inv_asset:
            category = InventoryCategory.query.get(inv_asset.category_id) if inv_asset.category_id else None
            # Struttura flat per il frontend
            assets_data.append({
                'id': alloc.id,
                'asset_id': alloc.asset_id,
                'quantita': alloc.quantita,
                'prezzo_concordato': alloc.prezzo_concordato,
                'data_inizio': alloc.data_inizio.isoformat() if alloc.data_inizio else None,
                'data_fine': alloc.data_fine.isoformat() if alloc.data_fine else None,
                'stagione': alloc.stagione,
                'esclusivita_categoria': alloc.esclusivita_categoria,
                'categoria_merceologica': alloc.categoria_merceologica,
                'status': alloc.status,
                'note': alloc.note,
                'asset': {
                    'id': inv_asset.id,
                    'nome': inv_asset.nome,
                    'descrizione': inv_asset.descrizione,
                    'tipo': inv_asset.tipo,
                    'posizione': inv_asset.posizione,
                    'dimensioni': inv_asset.dimensioni,
                    'immagine_principale': inv_asset.immagine_principale,
                    'prezzo_listino': inv_asset.prezzo_listino,
                    'category': {
                        'id': category.id,
                        'nome': category.nome,
                        'icona': category.icona
                    } if category else None
                }
            })

    return jsonify({
        'contract_id': contract_id,
        'allocations': assets_data,
        'inventory_assets': assets_data,  # Backward compatibility
        'totale_valore': sum(a['prezzo_concordato'] or 0 for a in assets_data)
    }), 200


# POST - Alloca un inventory asset a un contratto
@contract_bp.route('/contracts/<int:contract_id>/inventory-assets', methods=['POST'])
@jwt_required()
def add_contract_inventory_asset(contract_id):
    """Alloca un inventory asset a un contratto"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    if contract.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json
    asset_id = data.get('asset_id')

    if not asset_id:
        return jsonify({'error': 'asset_id richiesto'}), 400

    from app.models import AssetAllocation, InventoryAsset

    # Verifica che l'asset appartenga al club
    inv_asset = InventoryAsset.query.filter_by(id=asset_id, club_id=club_id).first()
    if not inv_asset:
        return jsonify({'error': 'Asset non trovato'}), 404

    # Verifica disponibilità
    quantita = data.get('quantita', 1)
    if inv_asset.quantita_disponibile < quantita:
        return jsonify({'error': f'Quantità non disponibile. Disponibili: {inv_asset.quantita_disponibile}'}), 400

    # Crea allocazione
    allocation = AssetAllocation(
        asset_id=asset_id,
        club_id=club_id,
        contract_id=contract_id,
        sponsor_id=contract.sponsor_id,
        data_inizio=contract.data_inizio.date() if hasattr(contract.data_inizio, 'date') else contract.data_inizio,
        data_fine=contract.data_fine.date() if hasattr(contract.data_fine, 'date') else contract.data_fine,
        quantita=quantita,
        prezzo_concordato=data.get('prezzo_concordato', inv_asset.prezzo_listino),
        esclusivita_categoria=data.get('esclusivita_categoria', False),
        categoria_merceologica=data.get('categoria_merceologica'),
        note=data.get('note'),
        status='attiva'
    )

    db.session.add(allocation)

    # Aggiorna disponibilità asset
    inv_asset.quantita_disponibile = max(0, inv_asset.quantita_disponibile - quantita)

    db.session.commit()

    return jsonify({
        'message': 'Asset allocato al contratto',
        'allocation': allocation.to_dict()
    }), 201


# DELETE - Rimuovi allocazione asset da contratto
@contract_bp.route('/contracts/<int:contract_id>/inventory-assets/<int:allocation_id>', methods=['DELETE'])
@jwt_required()
def remove_contract_inventory_asset(contract_id, allocation_id):
    """Rimuovi allocazione asset da contratto"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    if contract.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import AssetAllocation, InventoryAsset

    allocation = AssetAllocation.query.filter_by(
        id=allocation_id,
        contract_id=contract_id
    ).first()

    if not allocation:
        return jsonify({'error': 'Allocazione non trovata'}), 404

    # Ripristina disponibilità asset
    inv_asset = InventoryAsset.query.get(allocation.asset_id)
    if inv_asset:
        inv_asset.quantita_disponibile = min(
            inv_asset.quantita_totale,
            inv_asset.quantita_disponibile + allocation.quantita
        )

    db.session.delete(allocation)
    db.session.commit()

    return jsonify({'message': 'Allocazione rimossa'}), 200


# UPDATE - Modifica contratto (solo Club)
@contract_bp.route('/contracts/<int:contract_id>', methods=['PUT'])
@jwt_required()
def update_contract(contract_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    if contract.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Aggiorna campi
    if 'nome_contratto' in data:
        contract.nome_contratto = data['nome_contratto']
    if 'compenso' in data:
        contract.compenso = data['compenso']
    if 'data_inizio' in data:
        contract.data_inizio = datetime.fromisoformat(data['data_inizio'])
    if 'data_fine' in data:
        contract.data_fine = datetime.fromisoformat(data['data_fine'])
    if 'descrizione' in data:
        contract.descrizione = data['descrizione']
    if 'file_contratto_url' in data:
        contract.file_contratto_url = data['file_contratto_url']
    if 'status' in data:
        contract.status = data['status']

    db.session.commit()

    # Crea notifica per lo sponsor
    create_notification(
        user_type='sponsor',
        user_id=contract.sponsor_id,
        tipo='contratto_modificato',
        titolo='Contratto modificato',
        messaggio=f'Il contratto "{contract.nome_contratto}" è stato modificato',
        link=f'/sponsor/contracts/{contract.id}'
    )

    return jsonify({'message': 'Contratto aggiornato con successo'}), 200


# DELETE - Elimina contratto (solo Club)
@contract_bp.route('/contracts/<int:contract_id>', methods=['DELETE'])
@jwt_required()
def delete_contract(contract_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    if contract.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(contract)
    db.session.commit()

    return jsonify({'message': 'Contratto eliminato con successo'}), 200
