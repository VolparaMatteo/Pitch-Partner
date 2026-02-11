from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Lead, LeadProduct, InventoryAsset, Right
from datetime import datetime


def verify_club():
    """Helper function to verify club role and return club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


lead_product_bp = Blueprint('lead_product', __name__)


# ── GET /club/leads/<lead_id>/products ──────────────────────
@lead_product_bp.route('/club/leads/<int:lead_id>/products', methods=['GET'])
@jwt_required()
def get_lead_products(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    lead = Lead.query.filter_by(id=lead_id, club_id=club_id).first()
    if not lead:
        return jsonify({'error': 'Lead non trovato'}), 404

    products = LeadProduct.query.filter_by(lead_id=lead_id, club_id=club_id)\
        .order_by(LeadProduct.created_at.asc()).all()

    result = []
    totale = 0
    for p in products:
        item = {
            'id': p.id,
            'lead_id': p.lead_id,
            'asset_id': p.asset_id,
            'right_id': p.right_id,
            'tipo': p.tipo,
            'nome': p.nome,
            'descrizione': p.descrizione,
            'quantita': p.quantita,
            'prezzo_unitario': p.prezzo_unitario,
            'sconto_percentuale': p.sconto_percentuale,
            'prezzo_totale': p.prezzo_totale,
            'note': p.note,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'updated_at': p.updated_at.isoformat() if p.updated_at else None
        }
        # Aggiungi info asset/right collegato
        if p.asset_id:
            asset = InventoryAsset.query.get(p.asset_id)
            if asset:
                item['asset_nome'] = asset.nome
                item['prezzo_listino'] = asset.prezzo_listino
        elif p.right_id:
            right = Right.query.get(p.right_id)
            if right:
                item['right_nome'] = right.nome
                item['right_codice'] = right.codice
                item['prezzo_listino'] = right.prezzo_listino
        totale += p.prezzo_totale or 0
        result.append(item)

    return jsonify({
        'products': result,
        'totale': totale,
        'count': len(result)
    })


# ── POST /club/leads/<lead_id>/products ─────────────────────
@lead_product_bp.route('/club/leads/<int:lead_id>/products', methods=['POST'])
@jwt_required()
def create_lead_product(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    lead = Lead.query.filter_by(id=lead_id, club_id=club_id).first()
    if not lead:
        return jsonify({'error': 'Lead non trovato'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dati mancanti'}), 400

    tipo = data.get('tipo', 'custom')
    nome = data.get('nome', '')
    asset_id = data.get('asset_id')
    right_id = data.get('right_id')

    # Se tipo asset/right, recupera nome e prezzo di default
    if tipo == 'asset' and asset_id:
        asset = InventoryAsset.query.filter_by(id=asset_id, club_id=club_id).first()
        if not asset:
            return jsonify({'error': 'Asset non trovato'}), 404
        if not nome:
            nome = asset.nome
        if not data.get('prezzo_unitario') and asset.prezzo_listino:
            data['prezzo_unitario'] = asset.prezzo_listino
    elif tipo == 'right' and right_id:
        right = Right.query.filter_by(id=right_id, club_id=club_id).first()
        if not right:
            return jsonify({'error': 'Diritto non trovato'}), 404
        if not nome:
            nome = right.nome
        if not data.get('prezzo_unitario') and right.prezzo_listino:
            data['prezzo_unitario'] = right.prezzo_listino

    if not nome:
        return jsonify({'error': 'Nome prodotto obbligatorio'}), 400

    quantita = data.get('quantita', 1)
    prezzo_unitario = data.get('prezzo_unitario', 0)
    sconto_percentuale = data.get('sconto_percentuale', 0)
    prezzo_totale = quantita * prezzo_unitario * (1 - sconto_percentuale / 100)

    product = LeadProduct(
        lead_id=lead_id,
        club_id=club_id,
        asset_id=asset_id if tipo == 'asset' else None,
        right_id=right_id if tipo == 'right' else None,
        tipo=tipo,
        nome=nome,
        descrizione=data.get('descrizione'),
        quantita=quantita,
        prezzo_unitario=prezzo_unitario,
        sconto_percentuale=sconto_percentuale,
        prezzo_totale=prezzo_totale,
        note=data.get('note')
    )
    db.session.add(product)

    # Aggiorna valore_stimato del lead
    _sync_lead_value(lead)

    db.session.commit()

    return jsonify({
        'message': 'Prodotto aggiunto',
        'product': {
            'id': product.id,
            'nome': product.nome,
            'tipo': product.tipo,
            'quantita': product.quantita,
            'prezzo_unitario': product.prezzo_unitario,
            'sconto_percentuale': product.sconto_percentuale,
            'prezzo_totale': product.prezzo_totale
        }
    }), 201


# ── PUT /club/leads/<lead_id>/products/<product_id> ─────────
@lead_product_bp.route('/club/leads/<int:lead_id>/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_lead_product(lead_id, product_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    lead = Lead.query.filter_by(id=lead_id, club_id=club_id).first()
    if not lead:
        return jsonify({'error': 'Lead non trovato'}), 404

    product = LeadProduct.query.filter_by(id=product_id, lead_id=lead_id, club_id=club_id).first()
    if not product:
        return jsonify({'error': 'Prodotto non trovato'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dati mancanti'}), 400

    # Aggiorna campi
    if 'nome' in data:
        product.nome = data['nome']
    if 'descrizione' in data:
        product.descrizione = data['descrizione']
    if 'quantita' in data:
        product.quantita = data['quantita']
    if 'prezzo_unitario' in data:
        product.prezzo_unitario = data['prezzo_unitario']
    if 'sconto_percentuale' in data:
        product.sconto_percentuale = data['sconto_percentuale']
    if 'note' in data:
        product.note = data['note']

    # Ricalcola prezzo totale
    product.prezzo_totale = (product.quantita or 1) * (product.prezzo_unitario or 0) * \
        (1 - (product.sconto_percentuale or 0) / 100)
    product.updated_at = datetime.utcnow()

    # Aggiorna valore_stimato del lead
    _sync_lead_value(lead)

    db.session.commit()

    return jsonify({
        'message': 'Prodotto aggiornato',
        'product': {
            'id': product.id,
            'nome': product.nome,
            'tipo': product.tipo,
            'quantita': product.quantita,
            'prezzo_unitario': product.prezzo_unitario,
            'sconto_percentuale': product.sconto_percentuale,
            'prezzo_totale': product.prezzo_totale
        }
    })


# ── DELETE /club/leads/<lead_id>/products/<product_id> ───────
@lead_product_bp.route('/club/leads/<int:lead_id>/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_lead_product(lead_id, product_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    lead = Lead.query.filter_by(id=lead_id, club_id=club_id).first()
    if not lead:
        return jsonify({'error': 'Lead non trovato'}), 404

    product = LeadProduct.query.filter_by(id=product_id, lead_id=lead_id, club_id=club_id).first()
    if not product:
        return jsonify({'error': 'Prodotto non trovato'}), 404

    db.session.delete(product)

    # Aggiorna valore_stimato del lead
    _sync_lead_value(lead)

    db.session.commit()

    return jsonify({'message': 'Prodotto eliminato'})


# ── GET /club/leads/<lead_id>/available-catalog ──────────────
@lead_product_bp.route('/club/leads/<int:lead_id>/available-catalog', methods=['GET'])
@jwt_required()
def get_available_catalog(lead_id):
    """Restituisce asset e diritti disponibili per il club, da collegare al lead"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    search = request.args.get('q', '').strip().lower()

    # Asset inventario
    assets_q = InventoryAsset.query.filter_by(club_id=club_id, attivo=True)
    if search:
        assets_q = assets_q.filter(InventoryAsset.nome.ilike(f'%{search}%'))
    assets = assets_q.order_by(InventoryAsset.nome).limit(50).all()

    # Diritti
    rights_q = Right.query.filter_by(club_id=club_id, status='attivo')
    if search:
        rights_q = rights_q.filter(Right.nome.ilike(f'%{search}%'))
    rights = rights_q.order_by(Right.nome).limit(50).all()

    return jsonify({
        'assets': [{
            'id': a.id,
            'nome': a.nome,
            'tipo': a.tipo,
            'prezzo_listino': a.prezzo_listino,
            'prezzo_minimo': a.prezzo_minimo,
            'quantita_disponibile': a.quantita_disponibile
        } for a in assets],
        'rights': [{
            'id': r.id,
            'codice': r.codice,
            'nome': r.nome,
            'tipo': r.tipo,
            'prezzo_listino': r.prezzo_listino,
            'prezzo_minimo': r.prezzo_minimo,
            'esclusivo': r.esclusivo
        } for r in rights]
    })


# ── PATCH /club/leads/<lead_id>/products/sync-value ──────────
@lead_product_bp.route('/club/leads/<int:lead_id>/products/sync-value', methods=['PATCH'])
@jwt_required()
def sync_lead_products_value(lead_id):
    """Ricalcola valore_stimato del lead dalla somma dei prodotti"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    lead = Lead.query.filter_by(id=lead_id, club_id=club_id).first()
    if not lead:
        return jsonify({'error': 'Lead non trovato'}), 404

    _sync_lead_value(lead)
    db.session.commit()

    return jsonify({
        'message': 'Valore aggiornato',
        'valore_stimato': lead.valore_stimato
    })


def _sync_lead_value(lead):
    """Ricalcola valore_stimato dalla somma dei prodotti"""
    products = LeadProduct.query.filter_by(lead_id=lead.id).all()
    if products:
        lead.valore_stimato = sum(p.prezzo_totale or 0 for p in products)
