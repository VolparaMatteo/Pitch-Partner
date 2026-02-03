from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    Activation, Match, HeadOfTerms, Asset, Sponsor, Notification,
    AssetAllocation, InventoryAsset
)
from datetime import datetime

activation_bp = Blueprint('activation', __name__)


# CREATE - Crea nuova attivazione
@activation_bp.route('/matches/<int:match_id>/activations', methods=['POST'])
@jwt_required()
def create_activation(match_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Solo club può creare attivazioni
    if role != 'club':
        return jsonify({'error': 'Solo i club possono creare attivazioni'}), 403

    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    if match.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione
    if not data.get('contract_id') or not data.get('tipo'):
        return jsonify({'error': 'Contract ID e tipo sono obbligatori'}), 400

    contract = HeadOfTerms.query.get(data['contract_id'])
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    try:
        # Determina la sorgente dell'asset (priorità: allocation > inventory_asset > asset legacy)
        allocation_id = data.get('allocation_id')
        inventory_asset_id = data.get('inventory_asset_id')
        asset_id = data.get('asset_id')  # Legacy

        # Se viene passato allocation_id, recupera anche inventory_asset_id
        if allocation_id:
            allocation = AssetAllocation.query.get(allocation_id)
            if allocation:
                inventory_asset_id = allocation.asset_id
                # Verifica che l'allocazione appartenga al contratto
                if allocation.contract_id and allocation.contract_id != data['contract_id']:
                    return jsonify({'error': 'L\'allocazione non appartiene a questo contratto'}), 400

        # Crea attivazione
        activation = Activation(
            match_id=match_id,
            contract_id=data['contract_id'],
            asset_id=asset_id,  # Legacy
            allocation_id=allocation_id,
            inventory_asset_id=inventory_asset_id,
            tipo=data['tipo'],
            descrizione=data.get('descrizione'),
            stato='pianificata',
            responsabile=data.get('responsabile'),
            quantita_utilizzata=data.get('quantita_utilizzata')
        )

        db.session.add(activation)

        # Se c'è un inventory asset, scala dalla disponibilità
        if inventory_asset_id and activation.quantita_utilizzata:
            inv_asset = InventoryAsset.query.get(inventory_asset_id)
            if inv_asset and inv_asset.quantita_disponibile:
                # Non scaliamo permanentemente, ma tracciamo l'utilizzo
                pass  # L'utilizzo è tracciato nelle attivazioni

        # Legacy: Se c'è un asset vecchio con quantità, aggiorna quantita_utilizzata dell'asset
        elif asset_id and activation.quantita_utilizzata:
            asset = Asset.query.get(asset_id)
            if asset and asset.quantita_totale:
                asset.quantita_utilizzata = (asset.quantita_utilizzata or 0) + activation.quantita_utilizzata

        db.session.commit()

        # Crea notifica per lo sponsor
        sponsor = Sponsor.query.get(contract.sponsor_id)
        if sponsor:
            notification = Notification(
                user_type='sponsor',
                user_id=sponsor.id,
                tipo='nuova_attivazione',
                titolo=f'Nuova attivazione pianificata per {match.avversario}',
                messaggio=f'Attivazione {data["tipo"]} pianificata per la partita del {match.data_ora.strftime("%d/%m/%Y")}',
                link=f'/matches/{match_id}'
            )
            db.session.add(notification)
            db.session.commit()

        # Prepara info asset per la risposta
        inventory_asset_info = None
        if activation.inventory_asset_id:
            inv_asset = InventoryAsset.query.get(activation.inventory_asset_id)
            if inv_asset:
                inventory_asset_info = {
                    'id': inv_asset.id,
                    'codice': inv_asset.codice,
                    'nome': inv_asset.nome,
                    'tipo': inv_asset.tipo,
                    'immagine_principale': inv_asset.immagine_principale
                }

        return jsonify({
            'message': 'Attivazione creata con successo',
            'activation': {
                'id': activation.id,
                'match_id': activation.match_id,
                'contract_id': activation.contract_id,
                'asset_id': activation.asset_id,
                'allocation_id': activation.allocation_id,
                'inventory_asset_id': activation.inventory_asset_id,
                'inventory_asset': inventory_asset_info,
                'tipo': activation.tipo,
                'descrizione': activation.descrizione,
                'stato': activation.stato,
                'responsabile': activation.responsabile,
                'quantita_utilizzata': activation.quantita_utilizzata
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Ottieni attivazioni di una partita
@activation_bp.route('/matches/<int:match_id>/activations', methods=['GET'])
@jwt_required()
def get_activations(match_id):
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
        activations = Activation.query.filter_by(match_id=match_id).all()
    elif role == 'sponsor':
        sponsor = Sponsor.query.get(user_id)
        if not sponsor or sponsor.club_id != match.club_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
        # Sponsor vede solo sue attivazioni
        activations = Activation.query.join(HeadOfTerms).filter(
            Activation.match_id == match_id,
            HeadOfTerms.sponsor_id == user_id
        ).all()
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activations_data = []
    for activation in activations:
        # Ottieni info asset legacy se presente
        asset_info = None
        if activation.asset_id:
            asset = Asset.query.get(activation.asset_id)
            if asset:
                asset_info = {
                    'id': asset.id,
                    'categoria': asset.categoria,
                    'nome': asset.nome
                }

        # NUOVO: Ottieni info inventory asset se presente
        inventory_asset_info = None
        if activation.inventory_asset_id:
            inv_asset = InventoryAsset.query.get(activation.inventory_asset_id)
            if inv_asset:
                inventory_asset_info = {
                    'id': inv_asset.id,
                    'codice': inv_asset.codice,
                    'nome': inv_asset.nome,
                    'tipo': inv_asset.tipo,
                    'posizione': inv_asset.posizione,
                    'immagine_principale': inv_asset.immagine_principale,
                    'prezzo_listino': inv_asset.prezzo_listino
                }

        # Ottieni info allocazione se presente
        allocation_info = None
        if activation.allocation_id:
            allocation = AssetAllocation.query.get(activation.allocation_id)
            if allocation:
                allocation_info = {
                    'id': allocation.id,
                    'stagione': allocation.stagione,
                    'quantita': allocation.quantita,
                    'prezzo_concordato': allocation.prezzo_concordato
                }

        # Ottieni info contratto
        contract = HeadOfTerms.query.get(activation.contract_id)
        sponsor_nome = None
        if contract:
            sponsor = Sponsor.query.get(contract.sponsor_id)
            if sponsor:
                sponsor_nome = sponsor.ragione_sociale

        activations_data.append({
            'id': activation.id,
            'match_id': activation.match_id,
            'contract_id': activation.contract_id,
            'asset_id': activation.asset_id,
            'asset': asset_info,
            'allocation_id': activation.allocation_id,
            'allocation': allocation_info,
            'inventory_asset_id': activation.inventory_asset_id,
            'inventory_asset': inventory_asset_info,
            'sponsor_nome': sponsor_nome,
            'tipo': activation.tipo,
            'descrizione': activation.descrizione,
            'stato': activation.stato,
            'responsabile': activation.responsabile,
            'quantita_utilizzata': activation.quantita_utilizzata,
            'eseguita': activation.eseguita,
            'eseguita_da': activation.eseguita_da,
            'eseguita_il': activation.eseguita_il.isoformat() if activation.eseguita_il else None,
            'note_esecuzione': activation.note_esecuzione,
            'foto_attivazione': activation.foto_attivazione,
            'report_url': activation.report_url,
            'created_at': activation.created_at.isoformat()
        })

    return jsonify({'activations': activations_data}), 200


# UPDATE - Aggiorna attivazione
@activation_bp.route('/activations/<int:activation_id>', methods=['PUT'])
@jwt_required()
def update_activation(activation_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    activation = Activation.query.get(activation_id)
    if not activation:
        return jsonify({'error': 'Attivazione non trovata'}), 404

    match = Match.query.get(activation.match_id)
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    # Verifica accesso
    if role == 'club':
        if match.club_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor':
        contract = HeadOfTerms.query.get(activation.contract_id)
        if not contract or contract.sponsor_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    try:
        # Club può aggiornare tutto
        if role == 'club':
            if 'tipo' in data:
                activation.tipo = data['tipo']
            if 'descrizione' in data:
                activation.descrizione = data['descrizione']
            if 'stato' in data:
                activation.stato = data['stato']
            if 'responsabile' in data:
                activation.responsabile = data['responsabile']
            if 'eseguita' in data:
                activation.eseguita = data['eseguita']
                if data['eseguita']:
                    activation.eseguita_il = datetime.utcnow()
                    activation.eseguita_da = data.get('eseguita_da')
            if 'note_esecuzione' in data:
                activation.note_esecuzione = data['note_esecuzione']
            if 'foto_attivazione' in data:
                activation.foto_attivazione = data['foto_attivazione']
            if 'report_url' in data:
                activation.report_url = data['report_url']

        # Sponsor può solo confermare o aggiungere note
        elif role == 'sponsor':
            if 'stato' in data and data['stato'] in ['confermata', 'pianificata']:
                activation.stato = data['stato']
                # Notifica club della conferma
                if data['stato'] == 'confermata':
                    notification = Notification(
                        user_type='club',
                        user_id=match.club_id,
                        tipo='attivazione_confermata',
                        titolo='Attivazione confermata da sponsor',
                        messaggio=f'Attivazione {activation.tipo} confermata per partita vs {match.avversario}',
                        link=f'/matches/{match.id}'
                    )
                    db.session.add(notification)

        activation.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Attivazione aggiornata con successo',
            'activation': {
                'id': activation.id,
                'stato': activation.stato,
                'eseguita': activation.eseguita
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE - Elimina attivazione
@activation_bp.route('/activations/<int:activation_id>', methods=['DELETE'])
@jwt_required()
def delete_activation(activation_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Solo club può eliminare
    if role != 'club':
        return jsonify({'error': 'Solo i club possono eliminare attivazioni'}), 403

    activation = Activation.query.get(activation_id)
    if not activation:
        return jsonify({'error': 'Attivazione non trovata'}), 404

    match = Match.query.get(activation.match_id)
    if not match or match.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    try:
        db.session.delete(activation)
        db.session.commit()
        return jsonify({'message': 'Attivazione eliminata con successo'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# GET - Ottieni attivazioni per sponsor (tutte le partite)
@activation_bp.route('/sponsor/activations', methods=['GET'])
@jwt_required()
def get_sponsor_activations():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'sponsor':
        return jsonify({'error': 'Solo sponsor possono accedere'}), 403

    sponsor = Sponsor.query.get(user_id)
    if not sponsor:
        return jsonify({'error': 'Sponsor non trovato'}), 404

    # Ottieni tutte le attivazioni dello sponsor
    activations = Activation.query.join(HeadOfTerms).filter(
        HeadOfTerms.sponsor_id == user_id
    ).order_by(Activation.created_at.desc()).all()

    activations_data = []
    for activation in activations:
        match = Match.query.get(activation.match_id)

        activations_data.append({
            'id': activation.id,
            'match': {
                'id': match.id,
                'data_ora': match.data_ora.isoformat(),
                'avversario': match.avversario,
                'competizione': match.competizione
            },
            'tipo': activation.tipo,
            'descrizione': activation.descrizione,
            'stato': activation.stato,
            'eseguita': activation.eseguita,
            'foto_attivazione': activation.foto_attivazione,
            'report_url': activation.report_url
        })

    return jsonify({'activations': activations_data}), 200


# GET - Ottieni attivazioni di un contratto
@activation_bp.route('/contracts/<int:contract_id>/activations', methods=['GET'])
@jwt_required()
def get_contract_activations(contract_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    # Verifica accesso
    if role == 'club':
        if contract.club_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor':
        if contract.sponsor_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Ottieni tutte le attivazioni del contratto
    activations = Activation.query.filter_by(contract_id=contract_id).order_by(Activation.created_at.desc()).all()

    activations_data = []
    for activation in activations:
        # Ottieni info match
        match = Match.query.get(activation.match_id)
        match_info = None
        if match:
            match_info = {
                'id': match.id,
                'data_ora': match.data_ora.isoformat(),
                'avversario': match.avversario,
                'competizione': match.competizione
            }

        # Ottieni info asset se presente
        asset_info = None
        if activation.asset_id:
            asset = Asset.query.get(activation.asset_id)
            if asset:
                asset_info = {
                    'id': asset.id,
                    'categoria': asset.categoria,
                    'nome': asset.nome,
                    'quantita_totale': asset.quantita_totale,
                    'quantita_utilizzata': asset.quantita_utilizzata
                }

        # NUOVO: Ottieni info inventory asset se presente
        inventory_asset_info = None
        if activation.inventory_asset_id:
            inv_asset = InventoryAsset.query.get(activation.inventory_asset_id)
            if inv_asset:
                inventory_asset_info = {
                    'id': inv_asset.id,
                    'codice': inv_asset.codice,
                    'nome': inv_asset.nome,
                    'tipo': inv_asset.tipo,
                    'immagine_principale': inv_asset.immagine_principale
                }

        activations_data.append({
            'id': activation.id,
            'match': match_info,
            'asset': asset_info,
            'inventory_asset': inventory_asset_info,
            'allocation_id': activation.allocation_id,
            'inventory_asset_id': activation.inventory_asset_id,
            'tipo': activation.tipo,
            'descrizione': activation.descrizione,
            'stato': activation.stato,
            'responsabile': activation.responsabile,
            'quantita_utilizzata': activation.quantita_utilizzata,
            'eseguita': activation.eseguita,
            'eseguita_da': activation.eseguita_da,
            'eseguita_il': activation.eseguita_il.isoformat() if activation.eseguita_il else None,
            'note_esecuzione': activation.note_esecuzione,
            'foto_attivazione': activation.foto_attivazione,
            'report_url': activation.report_url,
            'created_at': activation.created_at.isoformat()
        })

    return jsonify({'activations': activations_data}), 200


# GET - Ottieni allocazioni inventario disponibili per un match
@activation_bp.route('/matches/<int:match_id>/available-allocations', methods=['GET'])
@jwt_required()
def get_available_allocations_for_match(match_id):
    """Restituisce le allocazioni inventario disponibili per una specifica partita"""
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo i club possono accedere'}), 403

    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    if match.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtra per contratto se specificato
    contract_id = request.args.get('contract_id', type=int)
    sponsor_id = request.args.get('sponsor_id', type=int)

    # Query per allocazioni attive che coprono la data del match
    match_date = match.data_ora.date()

    query = AssetAllocation.query.filter(
        AssetAllocation.club_id == user_id,
        AssetAllocation.status == 'attiva',
        AssetAllocation.data_inizio <= match_date,
        AssetAllocation.data_fine >= match_date
    )

    if contract_id:
        query = query.filter(AssetAllocation.contract_id == contract_id)
    if sponsor_id:
        query = query.filter(AssetAllocation.sponsor_id == sponsor_id)

    allocations = query.all()

    # Costruisci risposta con info complete
    allocations_data = []
    for allocation in allocations:
        inv_asset = InventoryAsset.query.get(allocation.asset_id)
        if not inv_asset or not inv_asset.attivo:
            continue

        # Controlla se l'asset è già usato in un'altra attivazione per questo match
        existing_activation = Activation.query.filter(
            Activation.match_id == match_id,
            Activation.allocation_id == allocation.id
        ).first()

        sponsor = Sponsor.query.get(allocation.sponsor_id) if allocation.sponsor_id else None
        contract = HeadOfTerms.query.get(allocation.contract_id) if allocation.contract_id else None

        allocations_data.append({
            'id': allocation.id,
            'asset_id': allocation.asset_id,
            'inventory_asset': {
                'id': inv_asset.id,
                'codice': inv_asset.codice,
                'nome': inv_asset.nome,
                'tipo': inv_asset.tipo,
                'posizione': inv_asset.posizione,
                'immagine_principale': inv_asset.immagine_principale,
                'prezzo_listino': inv_asset.prezzo_listino
            },
            'sponsor': {
                'id': sponsor.id,
                'nome': sponsor.ragione_sociale
            } if sponsor else None,
            'contract': {
                'id': contract.id,
                'nome': contract.nome_contratto
            } if contract else None,
            'stagione': allocation.stagione,
            'quantita': allocation.quantita,
            'prezzo_concordato': allocation.prezzo_concordato,
            'gia_attivato': existing_activation is not None,
            'activation_id': existing_activation.id if existing_activation else None
        })

    return jsonify({'allocations': allocations_data}), 200


# GET - Ottieni asset inventario disponibili per un match (senza allocazione specifica)
@activation_bp.route('/matches/<int:match_id>/available-assets', methods=['GET'])
@jwt_required()
def get_available_inventory_assets_for_match(match_id):
    """Restituisce gli asset inventario del club disponibili per una partita"""
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo i club possono accedere'}), 403

    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    if match.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Ottieni tutti gli asset inventario attivi del club
    assets = InventoryAsset.query.filter(
        InventoryAsset.club_id == user_id,
        InventoryAsset.attivo == True,
        InventoryAsset.archiviato == False,
        InventoryAsset.disponibile == True
    ).all()

    assets_data = []
    for asset in assets:
        # Conta quante attivazioni esistono per questo asset in questo match
        activations_count = Activation.query.filter(
            Activation.match_id == match_id,
            Activation.inventory_asset_id == asset.id
        ).count()

        assets_data.append({
            'id': asset.id,
            'codice': asset.codice,
            'nome': asset.nome,
            'tipo': asset.tipo,
            'posizione': asset.posizione,
            'dimensioni': asset.dimensioni,
            'immagine_principale': asset.immagine_principale,
            'quantita_totale': asset.quantita_totale,
            'quantita_disponibile': asset.quantita_disponibile,
            'prezzo_listino': asset.prezzo_listino,
            'attivazioni_match': activations_count
        })

    return jsonify({'assets': assets_data}), 200
