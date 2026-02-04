"""
Inventory Management Routes
Gestione completa dell'inventario asset per club professionistici
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    InventoryCategory, InventoryAsset, AssetPricingTier, AssetAvailability,
    AssetAllocation, AssetPackage, AssetPackageItem, CategoryExclusivity,
    PackageLevel, Club, Sponsor, HeadOfTerms
)
from datetime import datetime, date
from sqlalchemy import func, or_, and_
import json

inventory_bp = Blueprint('inventory', __name__)


def verify_club():
    """Verifica che l'utente sia un club"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    club_id = int(get_jwt_identity())
    return club_id


# =============================================================================
# CATEGORIE ASSET
# =============================================================================

@inventory_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Lista categorie asset del club"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    categories = InventoryCategory.query.filter_by(
        club_id=club_id
    ).order_by(InventoryCategory.ordine).all()

    return jsonify({
        'categories': [c.to_dict() for c in categories]
    }), 200


@inventory_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Crea nuova categoria"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Genera codice automaticamente dal nome se non fornito
    codice = data.get('codice')
    if not codice and data.get('nome'):
        import re
        # Genera codice: lowercase, rimuovi caratteri speciali, sostituisci spazi con -
        base_codice = re.sub(r'[^a-z0-9\s-]', '', data.get('nome').lower())
        base_codice = re.sub(r'\s+', '-', base_codice.strip())
        codice = base_codice

        # Se esiste già, aggiungi un numero
        counter = 1
        while InventoryCategory.query.filter_by(club_id=club_id, codice=codice).first():
            codice = f"{base_codice}-{counter}"
            counter += 1

    # Verifica codice univoco (se fornito manualmente)
    if data.get('codice'):
        existing = InventoryCategory.query.filter_by(
            club_id=club_id, codice=data.get('codice')
        ).first()
        if existing:
            return jsonify({'error': 'Codice categoria già esistente'}), 400

    category = InventoryCategory(
        club_id=club_id,
        nome=data.get('nome'),
        codice=codice,
        descrizione=data.get('descrizione'),
        icona=data.get('icona'),
        colore=data.get('colore'),
        ordine=data.get('ordine', 0),
        attivo=data.get('attivo', True)
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        'message': 'Categoria creata',
        'category': category.to_dict()
    }), 201


@inventory_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Modifica categoria"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    category = InventoryCategory.query.get(category_id)
    if not category or category.club_id != club_id:
        return jsonify({'error': 'Categoria non trovata'}), 404

    data = request.json

    category.nome = data.get('nome', category.nome)
    category.descrizione = data.get('descrizione', category.descrizione)
    category.icona = data.get('icona', category.icona)
    category.colore = data.get('colore', category.colore)
    category.ordine = data.get('ordine', category.ordine)
    category.attivo = data.get('attivo', category.attivo)

    db.session.commit()

    return jsonify({
        'message': 'Categoria aggiornata',
        'category': category.to_dict()
    }), 200


@inventory_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Elimina categoria (solo se senza asset)"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    category = InventoryCategory.query.get(category_id)
    if not category or category.club_id != club_id:
        return jsonify({'error': 'Categoria non trovata'}), 404

    if category.assets:
        return jsonify({'error': 'Impossibile eliminare: categoria contiene asset'}), 400

    db.session.delete(category)
    db.session.commit()

    return jsonify({'message': 'Categoria eliminata'}), 200


# =============================================================================
# ASSET INVENTARIO
# =============================================================================

@inventory_bp.route('/assets', methods=['GET'])
@jwt_required()
def get_assets():
    """Lista asset con filtri"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri
    category_id = request.args.get('category_id', type=int)
    tipo = request.args.get('tipo')
    disponibile = request.args.get('disponibile')
    search = request.args.get('search', '')
    in_evidenza = request.args.get('in_evidenza')
    visibile_marketplace = request.args.get('visibile_marketplace')

    # Filter by archiviato status (default: show only non-archived)
    include_archived = request.args.get('include_archived', 'false') == 'true'
    only_archived = request.args.get('only_archived', 'false') == 'true'

    query = InventoryAsset.query.filter_by(club_id=club_id, attivo=True)

    if only_archived:
        query = query.filter_by(archiviato=True)
    elif not include_archived:
        query = query.filter(or_(InventoryAsset.archiviato == False, InventoryAsset.archiviato == None))

    if category_id:
        query = query.filter_by(category_id=category_id)
    if tipo:
        query = query.filter_by(tipo=tipo)
    if disponibile is not None:
        query = query.filter_by(disponibile=disponibile == 'true')
    if in_evidenza is not None:
        query = query.filter_by(in_evidenza=in_evidenza == 'true')
    if visibile_marketplace is not None:
        query = query.filter_by(visibile_marketplace=visibile_marketplace == 'true')
    if search:
        query = query.filter(
            or_(
                InventoryAsset.nome.ilike(f'%{search}%'),
                InventoryAsset.descrizione.ilike(f'%{search}%')
            )
        )

    assets = query.order_by(InventoryAsset.ordine, InventoryAsset.nome).all()

    # Calcola statistiche
    total_value = sum(a.prezzo_listino or 0 for a in assets)
    available_count = sum(1 for a in assets if a.disponibile)

    return jsonify({
        'assets': [a.to_dict(include_pricing=True) for a in assets],
        'stats': {
            'total': len(assets),
            'available': available_count,
            'total_value': total_value
        }
    }), 200


@inventory_bp.route('/assets/<int:asset_id>', methods=['GET'])
@jwt_required()
def get_asset(asset_id):
    """Dettaglio singolo asset"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    # Carica allocazioni attive
    active_allocations = AssetAllocation.query.filter_by(
        asset_id=asset_id,
        status='attiva'
    ).all()

    return jsonify({
        'asset': asset.to_dict(include_pricing=True, include_availability=True),
        'allocations': [a.to_dict() for a in active_allocations]
    }), 200


@inventory_bp.route('/assets', methods=['POST'])
@jwt_required()
def create_asset():
    """Crea nuovo asset"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Verifica categoria
    category = InventoryCategory.query.get(data.get('category_id'))
    if not category or category.club_id != club_id:
        return jsonify({'error': 'Categoria non valida'}), 400

    asset = InventoryAsset(
        club_id=club_id,
        category_id=data.get('category_id'),
        nome=data.get('nome'),
        descrizione=data.get('descrizione'),
        descrizione_breve=data.get('descrizione_breve'),
        tipo=data.get('tipo', 'fisico'),
        posizione=data.get('posizione'),
        dimensioni=data.get('dimensioni'),
        specifiche_tecniche=json.dumps(data.get('specifiche_tecniche')) if data.get('specifiche_tecniche') else None,
        immagine_principale=data.get('immagine_principale'),
        immagini_gallery=json.dumps(data.get('immagini_gallery')) if data.get('immagini_gallery') else None,
        disponibile=data.get('disponibile', True),
        quantita_totale=data.get('quantita_totale', 1),
        quantita_disponibile=data.get('quantita_disponibile', data.get('quantita_totale', 1)),
        prezzo_listino=data.get('prezzo_listino'),
        prezzo_minimo=data.get('prezzo_minimo'),
        valuta=data.get('valuta', 'EUR'),
        categorie_escluse=json.dumps(data.get('categorie_escluse')) if data.get('categorie_escluse') else None,
        visibile_marketplace=data.get('visibile_marketplace', True),
        in_evidenza=data.get('in_evidenza', False),
        tags=data.get('tags'),
        note_interne=data.get('note_interne'),
        ordine=data.get('ordine', 0)
    )

    db.session.add(asset)
    db.session.commit()

    # Crea pricing tiers se forniti
    if data.get('pricing_tiers'):
        for tier_data in data['pricing_tiers']:
            tier = AssetPricingTier(
                asset_id=asset.id,
                nome=tier_data.get('nome'),
                descrizione=tier_data.get('descrizione'),
                prezzo=tier_data.get('prezzo'),
                prezzo_scontato=tier_data.get('prezzo_scontato'),
                durata_tipo=tier_data.get('durata_tipo'),
                durata_valore=tier_data.get('durata_valore'),
                minimo_partite=tier_data.get('minimo_partite'),
                massimo_partite=tier_data.get('massimo_partite'),
                ordine=tier_data.get('ordine', 0)
            )
            db.session.add(tier)
        db.session.commit()

    return jsonify({
        'message': 'Asset creato',
        'asset': asset.to_dict(include_pricing=True)
    }), 201


@inventory_bp.route('/assets/<int:asset_id>', methods=['PUT'])
@jwt_required()
def update_asset(asset_id):
    """Modifica asset"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    data = request.json

    # Update fields
    fields = [
        'nome', 'descrizione', 'descrizione_breve', 'tipo', 'posizione',
        'dimensioni', 'immagine_principale', 'disponibile', 'quantita_totale',
        'quantita_disponibile', 'prezzo_listino', 'prezzo_minimo', 'valuta',
        'visibile_marketplace', 'in_evidenza', 'tags', 'note_interne', 'ordine', 'attivo'
    ]

    for field in fields:
        if field in data:
            setattr(asset, field, data[field])

    if 'category_id' in data:
        category = InventoryCategory.query.get(data['category_id'])
        if category and category.club_id == club_id:
            asset.category_id = data['category_id']

    if 'specifiche_tecniche' in data:
        asset.specifiche_tecniche = json.dumps(data['specifiche_tecniche']) if data['specifiche_tecniche'] else None

    if 'immagini_gallery' in data:
        asset.immagini_gallery = json.dumps(data['immagini_gallery']) if data['immagini_gallery'] else None

    if 'categorie_escluse' in data:
        asset.categorie_escluse = json.dumps(data['categorie_escluse']) if data['categorie_escluse'] else None

    db.session.commit()

    return jsonify({
        'message': 'Asset aggiornato',
        'asset': asset.to_dict(include_pricing=True)
    }), 200


@inventory_bp.route('/assets/<int:asset_id>', methods=['DELETE'])
@jwt_required()
def delete_asset(asset_id):
    """Elimina asset (soft delete)"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    # Verifica che non ci siano allocazioni attive
    active_allocations = AssetAllocation.query.filter_by(
        asset_id=asset_id, status='attiva'
    ).count()

    if active_allocations > 0:
        return jsonify({'error': 'Impossibile eliminare: asset ha allocazioni attive'}), 400

    # Soft delete
    asset.attivo = False
    asset.disponibile = False
    db.session.commit()

    return jsonify({'message': 'Asset eliminato'}), 200


@inventory_bp.route('/assets/<int:asset_id>/archive', methods=['POST'])
@jwt_required()
def archive_asset(asset_id):
    """Archivia asset (mantiene tutti i dati ma lo nasconde dalla vista attiva)"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    if asset.archiviato:
        return jsonify({'error': 'Asset già archiviato'}), 400

    data = request.json or {}

    # Archivia l'asset
    asset.archiviato = True
    asset.data_archiviazione = datetime.utcnow()
    asset.motivo_archiviazione = data.get('motivo')
    asset.disponibile = False  # L'asset archiviato non è più disponibile

    db.session.commit()

    return jsonify({
        'message': 'Asset archiviato con successo',
        'asset': asset.to_dict()
    }), 200


@inventory_bp.route('/assets/<int:asset_id>/restore', methods=['POST'])
@jwt_required()
def restore_asset(asset_id):
    """Ripristina asset archiviato"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    if not asset.archiviato:
        return jsonify({'error': 'Asset non è archiviato'}), 400

    # Ripristina l'asset
    asset.archiviato = False
    asset.data_archiviazione = None
    asset.motivo_archiviazione = None
    asset.disponibile = True  # Ripristina disponibilità

    db.session.commit()

    return jsonify({
        'message': 'Asset ripristinato con successo',
        'asset': asset.to_dict()
    }), 200


# =============================================================================
# PRICING TIERS
# =============================================================================

@inventory_bp.route('/assets/<int:asset_id>/pricing', methods=['GET'])
@jwt_required()
def get_asset_pricing(asset_id):
    """Lista pricing tiers di un asset"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    tiers = AssetPricingTier.query.filter_by(
        asset_id=asset_id, attivo=True
    ).order_by(AssetPricingTier.ordine).all()

    return jsonify({
        'pricing_tiers': [t.to_dict() for t in tiers]
    }), 200


@inventory_bp.route('/assets/<int:asset_id>/pricing', methods=['POST'])
@jwt_required()
def add_pricing_tier(asset_id):
    """Aggiungi pricing tier"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    data = request.json

    tier = AssetPricingTier(
        asset_id=asset_id,
        nome=data.get('nome'),
        codice=data.get('codice'),
        descrizione=data.get('descrizione'),
        prezzo=data.get('prezzo'),
        prezzo_scontato=data.get('prezzo_scontato'),
        durata_tipo=data.get('durata_tipo'),
        durata_valore=data.get('durata_valore'),
        minimo_partite=data.get('minimo_partite'),
        massimo_partite=data.get('massimo_partite'),
        ordine=data.get('ordine', 0)
    )

    db.session.add(tier)
    db.session.commit()

    return jsonify({
        'message': 'Pricing tier aggiunto',
        'tier': tier.to_dict()
    }), 201


@inventory_bp.route('/pricing/<int:tier_id>', methods=['PUT'])
@jwt_required()
def update_pricing_tier(tier_id):
    """Modifica pricing tier"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    tier = AssetPricingTier.query.get(tier_id)
    if not tier:
        return jsonify({'error': 'Pricing tier non trovato'}), 404

    # Verifica ownership
    asset = InventoryAsset.query.get(tier.asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    fields = ['nome', 'codice', 'descrizione', 'prezzo', 'prezzo_scontato',
              'durata_tipo', 'durata_valore', 'minimo_partite', 'massimo_partite',
              'ordine', 'attivo']

    for field in fields:
        if field in data:
            setattr(tier, field, data[field])

    db.session.commit()

    return jsonify({
        'message': 'Pricing tier aggiornato',
        'tier': tier.to_dict()
    }), 200


@inventory_bp.route('/pricing/<int:tier_id>', methods=['DELETE'])
@jwt_required()
def delete_pricing_tier(tier_id):
    """Elimina pricing tier"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    tier = AssetPricingTier.query.get(tier_id)
    if not tier:
        return jsonify({'error': 'Pricing tier non trovato'}), 404

    asset = InventoryAsset.query.get(tier.asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(tier)
    db.session.commit()

    return jsonify({'message': 'Pricing tier eliminato'}), 200


# =============================================================================
# DISPONIBILITÀ
# =============================================================================

@inventory_bp.route('/assets/<int:asset_id>/availability', methods=['GET'])
@jwt_required()
def get_asset_availability(asset_id):
    """Lista disponibilità asset per stagione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    stagione = request.args.get('stagione')

    query = AssetAvailability.query.filter_by(asset_id=asset_id, club_id=club_id)
    if stagione:
        query = query.filter_by(stagione=stagione)

    availabilities = query.order_by(AssetAvailability.data_inizio).all()

    return jsonify({
        'availabilities': [a.to_dict() for a in availabilities]
    }), 200


@inventory_bp.route('/assets/<int:asset_id>/availability', methods=['POST'])
@jwt_required()
def set_availability(asset_id):
    """Imposta disponibilità per stagione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    data = request.json

    availability = AssetAvailability(
        asset_id=asset_id,
        club_id=club_id,
        stagione=data.get('stagione'),
        data_inizio=datetime.strptime(data.get('data_inizio'), '%Y-%m-%d').date(),
        data_fine=datetime.strptime(data.get('data_fine'), '%Y-%m-%d').date(),
        disponibile=data.get('disponibile', True),
        quantita_disponibile=data.get('quantita_disponibile', asset.quantita_totale),
        prezzo_stagionale=data.get('prezzo_stagionale'),
        note=data.get('note')
    )

    db.session.add(availability)
    db.session.commit()

    return jsonify({
        'message': 'Disponibilità impostata',
        'availability': availability.to_dict()
    }), 201


# =============================================================================
# ALLOCAZIONI
# =============================================================================

@inventory_bp.route('/allocations', methods=['GET'])
@jwt_required()
def get_allocations():
    """Lista tutte le allocazioni"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    status = request.args.get('status', 'attiva')
    asset_id = request.args.get('asset_id', type=int)
    sponsor_id = request.args.get('sponsor_id', type=int)
    stagione = request.args.get('stagione')

    query = AssetAllocation.query.filter_by(club_id=club_id)

    if status:
        query = query.filter_by(status=status)
    if asset_id:
        query = query.filter_by(asset_id=asset_id)
    if sponsor_id:
        query = query.filter_by(sponsor_id=sponsor_id)
    if stagione:
        query = query.filter_by(stagione=stagione)

    allocations = query.order_by(AssetAllocation.data_inizio.desc()).all()

    return jsonify({
        'allocations': [a.to_dict() for a in allocations]
    }), 200


@inventory_bp.route('/allocations', methods=['POST'])
@jwt_required()
def create_allocation():
    """Crea nuova allocazione asset"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Verifica asset
    asset = InventoryAsset.query.get(data.get('asset_id'))
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non valido'}), 400

    # Verifica disponibilità
    if asset.quantita_disponibile < data.get('quantita', 1):
        return jsonify({'error': 'Quantità non disponibile'}), 400

    # Verifica esclusività categoria
    if data.get('esclusivita_categoria') and data.get('categoria_merceologica'):
        existing_exclusivity = CategoryExclusivity.query.filter_by(
            club_id=club_id,
            categoria_merceologica=data.get('categoria_merceologica'),
            attiva=True
        ).first()

        if existing_exclusivity and existing_exclusivity.sponsor_id != data.get('sponsor_id'):
            return jsonify({
                'error': f"Categoria {data.get('categoria_merceologica')} già in esclusiva a {existing_exclusivity.sponsor.ragione_sociale}"
            }), 400

    allocation = AssetAllocation(
        asset_id=data.get('asset_id'),
        club_id=club_id,
        contract_id=data.get('contract_id'),
        sponsor_id=data.get('sponsor_id'),
        stagione=data.get('stagione'),
        data_inizio=datetime.strptime(data.get('data_inizio'), '%Y-%m-%d').date(),
        data_fine=datetime.strptime(data.get('data_fine'), '%Y-%m-%d').date(),
        quantita=data.get('quantita', 1),
        prezzo_concordato=data.get('prezzo_concordato'),
        esclusivita_categoria=data.get('esclusivita_categoria', False),
        categoria_merceologica=data.get('categoria_merceologica'),
        note=data.get('note')
    )

    # Aggiorna disponibilità asset
    asset.quantita_disponibile -= data.get('quantita', 1)
    if asset.quantita_disponibile == 0:
        asset.disponibile = False

    db.session.add(allocation)
    db.session.commit()

    return jsonify({
        'message': 'Allocazione creata',
        'allocation': allocation.to_dict()
    }), 201


@inventory_bp.route('/allocations/<int:allocation_id>', methods=['PUT'])
@jwt_required()
def update_allocation(allocation_id):
    """Modifica allocazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    allocation = AssetAllocation.query.get(allocation_id)
    if not allocation or allocation.club_id != club_id:
        return jsonify({'error': 'Allocazione non trovata'}), 404

    data = request.json

    if 'status' in data:
        old_status = allocation.status
        allocation.status = data['status']

        # Se conclusa/annullata, ripristina disponibilità
        if data['status'] in ['conclusa', 'annullata'] and old_status == 'attiva':
            asset = InventoryAsset.query.get(allocation.asset_id)
            asset.quantita_disponibile += allocation.quantita
            asset.disponibile = True

    if 'prezzo_concordato' in data:
        allocation.prezzo_concordato = data['prezzo_concordato']
    if 'note' in data:
        allocation.note = data['note']

    db.session.commit()

    return jsonify({
        'message': 'Allocazione aggiornata',
        'allocation': allocation.to_dict()
    }), 200


# =============================================================================
# PACKAGES
# =============================================================================

@inventory_bp.route('/packages', methods=['GET'])
@jwt_required()
def get_packages():
    """Lista packages"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    attivo = request.args.get('attivo')

    query = AssetPackage.query.filter_by(club_id=club_id)
    if attivo is not None:
        query = query.filter_by(attivo=attivo == 'true')

    packages = query.order_by(AssetPackage.ordine).all()

    return jsonify({
        'packages': [p.to_dict(include_items=True) for p in packages]
    }), 200


@inventory_bp.route('/packages/<int:package_id>', methods=['GET'])
@jwt_required()
def get_package(package_id):
    """Dettaglio package"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    package = AssetPackage.query.get(package_id)
    if not package or package.club_id != club_id:
        return jsonify({'error': 'Package non trovato'}), 404

    return jsonify({
        'package': package.to_dict(include_items=True)
    }), 200


@inventory_bp.route('/packages', methods=['POST'])
@jwt_required()
def create_package():
    """Crea nuovo package"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    package = AssetPackage(
        club_id=club_id,
        nome=data.get('nome'),
        codice=data.get('codice'),
        descrizione=data.get('descrizione'),
        descrizione_breve=data.get('descrizione_breve'),
        livello=data.get('livello'),
        ordine=data.get('ordine', 0),
        prezzo_listino=data.get('prezzo_listino'),
        prezzo_scontato=data.get('prezzo_scontato'),
        sconto_percentuale=data.get('sconto_percentuale'),
        immagine=data.get('immagine'),
        colore=data.get('colore'),
        attivo=data.get('attivo', True),
        visibile_marketplace=data.get('visibile_marketplace', True),
        in_evidenza=data.get('in_evidenza', False),
        max_vendite=data.get('max_vendite')
    )

    if data.get('disponibile_da'):
        package.disponibile_da = datetime.strptime(data.get('disponibile_da'), '%Y-%m-%d').date()
    if data.get('disponibile_fino'):
        package.disponibile_fino = datetime.strptime(data.get('disponibile_fino'), '%Y-%m-%d').date()

    db.session.add(package)
    db.session.commit()

    # Aggiungi items
    if data.get('items'):
        for item_data in data['items']:
            item = AssetPackageItem(
                package_id=package.id,
                asset_id=item_data.get('asset_id'),
                quantita=item_data.get('quantita', 1),
                prezzo_override=item_data.get('prezzo_override'),
                note=item_data.get('note'),
                ordine=item_data.get('ordine', 0)
            )
            db.session.add(item)
        db.session.commit()

    return jsonify({
        'message': 'Package creato',
        'package': package.to_dict(include_items=True)
    }), 201


@inventory_bp.route('/packages/<int:package_id>', methods=['PUT'])
@jwt_required()
def update_package(package_id):
    """Modifica package"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    package = AssetPackage.query.get(package_id)
    if not package or package.club_id != club_id:
        return jsonify({'error': 'Package non trovato'}), 404

    data = request.json

    fields = ['nome', 'descrizione', 'descrizione_breve', 'livello', 'ordine',
              'prezzo_listino', 'prezzo_scontato', 'sconto_percentuale',
              'immagine', 'colore', 'attivo', 'visibile_marketplace',
              'in_evidenza', 'max_vendite']

    for field in fields:
        if field in data:
            setattr(package, field, data[field])

    if 'disponibile_da' in data:
        package.disponibile_da = datetime.strptime(data['disponibile_da'], '%Y-%m-%d').date() if data['disponibile_da'] else None
    if 'disponibile_fino' in data:
        package.disponibile_fino = datetime.strptime(data['disponibile_fino'], '%Y-%m-%d').date() if data['disponibile_fino'] else None

    db.session.commit()

    return jsonify({
        'message': 'Package aggiornato',
        'package': package.to_dict(include_items=True)
    }), 200


@inventory_bp.route('/packages/<int:package_id>/items', methods=['POST'])
@jwt_required()
def add_package_item(package_id):
    """Aggiungi asset a package"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    package = AssetPackage.query.get(package_id)
    if not package or package.club_id != club_id:
        return jsonify({'error': 'Package non trovato'}), 404

    data = request.json

    # Verifica asset appartiene al club
    asset = InventoryAsset.query.get(data.get('asset_id'))
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non valido'}), 400

    item = AssetPackageItem(
        package_id=package_id,
        asset_id=data.get('asset_id'),
        quantita=data.get('quantita', 1),
        prezzo_override=data.get('prezzo_override'),
        note=data.get('note'),
        ordine=data.get('ordine', 0)
    )

    db.session.add(item)
    db.session.commit()

    return jsonify({
        'message': 'Asset aggiunto al package',
        'item': item.to_dict()
    }), 201


@inventory_bp.route('/packages/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_package_item(item_id):
    """Rimuovi asset da package"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    item = AssetPackageItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item non trovato'}), 404

    package = AssetPackage.query.get(item.package_id)
    if not package or package.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(item)
    db.session.commit()

    return jsonify({'message': 'Asset rimosso dal package'}), 200


# =============================================================================
# PACKAGE LEVELS
# =============================================================================

@inventory_bp.route('/package-levels', methods=['GET'])
@jwt_required()
def get_package_levels():
    """Lista livelli package del club"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    levels = PackageLevel.query.filter_by(club_id=club_id, attivo=True).order_by(PackageLevel.ordine).all()

    return jsonify({
        'levels': [l.to_dict() for l in levels]
    })


@inventory_bp.route('/package-levels', methods=['POST'])
@jwt_required()
def create_package_level():
    """Crea nuovo livello package"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    data = request.json

    # Verifica codice unico per club
    existing = PackageLevel.query.filter_by(club_id=club_id, codice=data.get('codice')).first()
    if existing:
        return jsonify({'error': 'Codice livello già esistente'}), 400

    level = PackageLevel(
        club_id=club_id,
        codice=data.get('codice'),
        nome=data.get('nome'),
        descrizione=data.get('descrizione'),
        colore=data.get('colore', '#3B82F6'),
        ordine=data.get('ordine', 0)
    )

    db.session.add(level)
    db.session.commit()

    return jsonify({
        'message': 'Livello creato',
        'level': level.to_dict()
    }), 201


@inventory_bp.route('/package-levels/<int:level_id>', methods=['PUT'])
@jwt_required()
def update_package_level(level_id):
    """Modifica livello package"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    level = PackageLevel.query.get(level_id)
    if not level or level.club_id != club_id:
        return jsonify({'error': 'Livello non trovato'}), 404

    data = request.json

    for field in ['nome', 'descrizione', 'colore', 'ordine']:
        if field in data:
            setattr(level, field, data[field])

    db.session.commit()

    return jsonify({
        'message': 'Livello aggiornato',
        'level': level.to_dict()
    })


@inventory_bp.route('/package-levels/<int:level_id>', methods=['DELETE'])
@jwt_required()
def delete_package_level(level_id):
    """Elimina livello package"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    level = PackageLevel.query.get(level_id)
    if not level or level.club_id != club_id:
        return jsonify({'error': 'Livello non trovato'}), 404

    # Verifica se ci sono package che usano questo livello
    packages_count = AssetPackage.query.filter_by(club_id=club_id, livello=level.codice).count()
    if packages_count > 0:
        return jsonify({
            'error': f'Non puoi eliminare questo livello: {packages_count} package lo utilizzano'
        }), 400

    db.session.delete(level)
    db.session.commit()

    return jsonify({'message': 'Livello eliminato'}), 200


# =============================================================================
# ESCLUSIVITÀ
# =============================================================================

@inventory_bp.route('/exclusivities', methods=['GET'])
@jwt_required()
def get_exclusivities():
    """Lista esclusività categorie"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    exclusivities = CategoryExclusivity.query.filter_by(club_id=club_id).all()

    return jsonify({
        'exclusivities': [e.to_dict() for e in exclusivities]
    }), 200


@inventory_bp.route('/exclusivities', methods=['POST'])
@jwt_required()
def create_exclusivity():
    """Crea nuova categoria esclusività"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    exclusivity = CategoryExclusivity(
        club_id=club_id,
        categoria_merceologica=data.get('categoria_merceologica'),
        nome_display=data.get('nome_display'),
        descrizione=data.get('descrizione'),
        valore=data.get('valore')
    )

    db.session.add(exclusivity)
    db.session.commit()

    return jsonify({
        'message': 'Esclusività creata',
        'exclusivity': exclusivity.to_dict()
    }), 201


@inventory_bp.route('/exclusivities/<int:exclusivity_id>/assign', methods=['POST'])
@jwt_required()
def assign_exclusivity(exclusivity_id):
    """Assegna esclusività a sponsor"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    exclusivity = CategoryExclusivity.query.get(exclusivity_id)
    if not exclusivity or exclusivity.club_id != club_id:
        return jsonify({'error': 'Esclusività non trovata'}), 404

    if exclusivity.attiva:
        return jsonify({'error': 'Esclusività già assegnata'}), 400

    data = request.json

    exclusivity.sponsor_id = data.get('sponsor_id')
    exclusivity.contract_id = data.get('contract_id')
    exclusivity.stagione = data.get('stagione')
    exclusivity.attiva = True

    if data.get('data_inizio'):
        exclusivity.data_inizio = datetime.strptime(data.get('data_inizio'), '%Y-%m-%d').date()
    if data.get('data_fine'):
        exclusivity.data_fine = datetime.strptime(data.get('data_fine'), '%Y-%m-%d').date()

    db.session.commit()

    return jsonify({
        'message': 'Esclusività assegnata',
        'exclusivity': exclusivity.to_dict()
    }), 200


@inventory_bp.route('/exclusivities/<int:exclusivity_id>/release', methods=['POST'])
@jwt_required()
def release_exclusivity(exclusivity_id):
    """Rilascia esclusività"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    exclusivity = CategoryExclusivity.query.get(exclusivity_id)
    if not exclusivity or exclusivity.club_id != club_id:
        return jsonify({'error': 'Esclusività non trovata'}), 404

    exclusivity.sponsor_id = None
    exclusivity.contract_id = None
    exclusivity.stagione = None
    exclusivity.data_inizio = None
    exclusivity.data_fine = None
    exclusivity.attiva = False

    db.session.commit()

    return jsonify({
        'message': 'Esclusività rilasciata',
        'exclusivity': exclusivity.to_dict()
    }), 200


# =============================================================================
# STATISTICHE E DASHBOARD
# =============================================================================

@inventory_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_inventory_stats():
    """Statistiche inventario"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Totale asset (esclusi archiviati)
    total_assets = InventoryAsset.query.filter_by(club_id=club_id, attivo=True).filter(
        or_(InventoryAsset.archiviato == False, InventoryAsset.archiviato == None)
    ).count()
    available_assets = InventoryAsset.query.filter_by(club_id=club_id, attivo=True, disponibile=True).filter(
        or_(InventoryAsset.archiviato == False, InventoryAsset.archiviato == None)
    ).count()
    archived_assets = InventoryAsset.query.filter_by(club_id=club_id, attivo=True, archiviato=True).count()

    # Valore inventario (esclusi archiviati)
    assets = InventoryAsset.query.filter_by(club_id=club_id, attivo=True).filter(
        or_(InventoryAsset.archiviato == False, InventoryAsset.archiviato == None)
    ).all()
    total_value = sum(a.prezzo_listino or 0 for a in assets)
    available_value = sum(a.prezzo_listino or 0 for a in assets if a.disponibile)

    # Allocazioni attive
    active_allocations = AssetAllocation.query.filter_by(club_id=club_id, status='attiva').count()
    allocation_value = db.session.query(func.sum(AssetAllocation.prezzo_concordato)).filter_by(
        club_id=club_id, status='attiva'
    ).scalar() or 0

    # Per categoria
    categories = InventoryCategory.query.filter_by(club_id=club_id, attivo=True).all()
    by_category = []
    for cat in categories:
        cat_assets = InventoryAsset.query.filter_by(club_id=club_id, category_id=cat.id, attivo=True).all()
        by_category.append({
            'category': cat.to_dict(),
            'total_assets': len(cat_assets),
            'available_assets': sum(1 for a in cat_assets if a.disponibile),
            'total_value': sum(a.prezzo_listino or 0 for a in cat_assets),
            'available_value': sum(a.prezzo_listino or 0 for a in cat_assets if a.disponibile)
        })

    # Esclusività
    total_exclusivities = CategoryExclusivity.query.filter_by(club_id=club_id).count()
    assigned_exclusivities = CategoryExclusivity.query.filter_by(club_id=club_id, attiva=True).count()

    # Packages
    total_packages = AssetPackage.query.filter_by(club_id=club_id, attivo=True).count()
    packages_sold = db.session.query(func.sum(AssetPackage.vendite_attuali)).filter_by(
        club_id=club_id, attivo=True
    ).scalar() or 0

    return jsonify({
        'inventory': {
            'total_assets': total_assets,
            'available_assets': available_assets,
            'archived_assets': archived_assets,
            'occupancy_rate': round((total_assets - available_assets) / total_assets * 100, 1) if total_assets > 0 else 0,
            'total_value': total_value,
            'available_value': available_value,
            'allocated_value': allocation_value
        },
        'allocations': {
            'active': active_allocations,
            'total_value': allocation_value
        },
        'exclusivities': {
            'total': total_exclusivities,
            'assigned': assigned_exclusivities,
            'available': total_exclusivities - assigned_exclusivities
        },
        'packages': {
            'total': total_packages,
            'sold': packages_sold
        },
        'by_category': by_category
    }), 200


# =============================================================================
# CHECK CONFLITTI
# =============================================================================

@inventory_bp.route('/check-conflict', methods=['POST'])
@jwt_required()
def check_conflict():
    """Verifica conflitti esclusività prima di allocazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json
    categoria = data.get('categoria_merceologica')
    sponsor_id = data.get('sponsor_id')
    asset_id = data.get('asset_id')

    conflicts = []

    # Verifica esclusività categoria
    if categoria:
        exclusivity = CategoryExclusivity.query.filter_by(
            club_id=club_id,
            categoria_merceologica=categoria,
            attiva=True
        ).first()

        if exclusivity and exclusivity.sponsor_id != sponsor_id:
            conflicts.append({
                'type': 'exclusivity',
                'message': f"Categoria '{categoria}' in esclusiva a {exclusivity.sponsor.ragione_sociale}",
                'blocking': True
            })

    # Verifica asset già allocato
    if asset_id:
        asset = InventoryAsset.query.get(asset_id)
        if asset and asset.club_id == club_id:
            if not asset.disponibile:
                conflicts.append({
                    'type': 'availability',
                    'message': f"Asset '{asset.nome}' non disponibile",
                    'blocking': True
                })

            # Verifica categorie escluse dell'asset
            if asset.categorie_escluse and categoria:
                escluse = json.loads(asset.categorie_escluse) if isinstance(asset.categorie_escluse, str) else asset.categorie_escluse
                if categoria in escluse:
                    conflicts.append({
                        'type': 'category_restriction',
                        'message': f"Asset '{asset.nome}' non disponibile per categoria '{categoria}'",
                        'blocking': True
                    })

    return jsonify({
        'has_conflicts': len([c for c in conflicts if c['blocking']]) > 0,
        'conflicts': conflicts
    }), 200
