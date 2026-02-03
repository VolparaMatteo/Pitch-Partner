"""
Rights Management API Routes
Sistema completo per la gestione dei diritti di sponsorizzazione
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import (
    Club, Sponsor, HeadOfTerms,
    RightCategory, Right, RightPricingTier, RightAvailability,
    RightAllocation, SectorExclusivity, RightConflict,
    RightPackage, RightPackageItem
)
from datetime import datetime, date
from sqlalchemy import or_, and_, func
import json

rights_bp = Blueprint('rights', __name__)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_current_club():
    """Ottiene il club corrente dall'identità JWT"""
    identity = get_jwt_identity()
    if identity.get('role') != 'club':
        return None
    return Club.query.get(identity.get('id'))


def check_sector_conflict(club_id, settore, sponsor_id, data_inizio, data_fine, exclude_allocation_id=None):
    """
    Verifica conflitti di esclusività settoriale
    Ritorna lista di conflitti trovati
    """
    conflicts = []

    # Cerca allocazioni esistenti nello stesso settore
    query = RightAllocation.query.filter(
        RightAllocation.club_id == club_id,
        RightAllocation.settore_merceologico == settore,
        RightAllocation.esclusivita_settoriale == True,
        RightAllocation.status == 'attiva',
        RightAllocation.sponsor_id != sponsor_id
    )

    if exclude_allocation_id:
        query = query.filter(RightAllocation.id != exclude_allocation_id)

    # Filtra per sovrapposizione date
    overlapping = query.filter(
        or_(
            and_(RightAllocation.data_inizio <= data_inizio, RightAllocation.data_fine >= data_inizio),
            and_(RightAllocation.data_inizio <= data_fine, RightAllocation.data_fine >= data_fine),
            and_(RightAllocation.data_inizio >= data_inizio, RightAllocation.data_fine <= data_fine)
        )
    ).all()

    for alloc in overlapping:
        conflicts.append({
            'tipo': 'settore',
            'allocation_id': alloc.id,
            'sponsor_id': alloc.sponsor_id,
            'sponsor_nome': alloc.sponsor.ragione_sociale if alloc.sponsor else None,
            'settore': settore,
            'data_inizio': alloc.data_inizio.isoformat() if alloc.data_inizio else None,
            'data_fine': alloc.data_fine.isoformat() if alloc.data_fine else None,
            'right_id': alloc.right_id,
            'right_nome': alloc.right.nome if alloc.right else None
        })

    # Cerca anche in SectorExclusivity
    sector_excl = SectorExclusivity.query.filter(
        SectorExclusivity.club_id == club_id,
        SectorExclusivity.settore_codice == settore,
        SectorExclusivity.attiva == True,
        SectorExclusivity.sponsor_id != sponsor_id
    ).filter(
        or_(
            and_(SectorExclusivity.data_inizio <= data_inizio, SectorExclusivity.data_fine >= data_inizio),
            and_(SectorExclusivity.data_inizio <= data_fine, SectorExclusivity.data_fine >= data_fine),
            and_(SectorExclusivity.data_inizio >= data_inizio, SectorExclusivity.data_fine <= data_fine)
        )
    ).all()

    for excl in sector_excl:
        conflicts.append({
            'tipo': 'esclusivita_settoriale',
            'exclusivity_id': excl.id,
            'sponsor_id': excl.sponsor_id,
            'sponsor_nome': excl.sponsor.ragione_sociale if excl.sponsor else None,
            'settore': settore,
            'data_inizio': excl.data_inizio.isoformat() if excl.data_inizio else None,
            'data_fine': excl.data_fine.isoformat() if excl.data_fine else None
        })

    return conflicts


def check_right_allocation_conflict(club_id, right_id, sponsor_id, data_inizio, data_fine, exclude_allocation_id=None):
    """
    Verifica conflitti di allocazione diritto
    """
    conflicts = []

    right = Right.query.get(right_id)
    if not right:
        return conflicts

    # Se il diritto è esclusivo, cerca altre allocazioni attive
    if right.esclusivo:
        query = RightAllocation.query.filter(
            RightAllocation.right_id == right_id,
            RightAllocation.status == 'attiva',
            RightAllocation.sponsor_id != sponsor_id
        )

        if exclude_allocation_id:
            query = query.filter(RightAllocation.id != exclude_allocation_id)

        # Filtra per sovrapposizione date
        overlapping = query.filter(
            or_(
                and_(RightAllocation.data_inizio <= data_inizio, RightAllocation.data_fine >= data_inizio),
                and_(RightAllocation.data_inizio <= data_fine, RightAllocation.data_fine >= data_fine),
                and_(RightAllocation.data_inizio >= data_inizio, RightAllocation.data_fine <= data_fine)
            )
        ).all()

        for alloc in overlapping:
            conflicts.append({
                'tipo': 'esclusivita_diritto',
                'allocation_id': alloc.id,
                'sponsor_id': alloc.sponsor_id,
                'sponsor_nome': alloc.sponsor.ragione_sociale if alloc.sponsor else None,
                'right_id': right_id,
                'right_nome': right.nome,
                'data_inizio': alloc.data_inizio.isoformat() if alloc.data_inizio else None,
                'data_fine': alloc.data_fine.isoformat() if alloc.data_fine else None
            })

    return conflicts


# =============================================================================
# RIGHT CATEGORIES
# =============================================================================

@rights_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Lista categorie di diritti"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    include_rights = request.args.get('include_rights', 'false').lower() == 'true'
    include_stats = request.args.get('include_stats', 'false').lower() == 'true'

    categories = RightCategory.query.filter_by(
        club_id=club.id,
        attivo=True
    ).order_by(RightCategory.ordine).all()

    return jsonify([c.to_dict(include_rights=include_rights, include_stats=include_stats) for c in categories])


@rights_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Crea nuova categoria di diritti"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Verifica codice unico
    existing = RightCategory.query.filter_by(club_id=club.id, codice=data.get('codice')).first()
    if existing:
        return jsonify({'error': 'Codice categoria già esistente'}), 400

    category = RightCategory(
        club_id=club.id,
        codice=data.get('codice'),
        nome=data.get('nome'),
        descrizione=data.get('descrizione'),
        descrizione_breve=data.get('descrizione_breve'),
        icona=data.get('icona'),
        colore=data.get('colore'),
        immagine=data.get('immagine'),
        ordine=data.get('ordine', 0),
        esclusivita_default=data.get('esclusivita_default', True),
        richiede_approvazione=data.get('richiede_approvazione', False),
        max_sponsor_categoria=data.get('max_sponsor_categoria', 1)
    )

    db.session.add(category)
    db.session.commit()

    return jsonify(category.to_dict()), 201


@rights_bp.route('/categories/<int:category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    """Dettaglio categoria"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    category = RightCategory.query.filter_by(id=category_id, club_id=club.id).first()
    if not category:
        return jsonify({'error': 'Categoria non trovata'}), 404

    return jsonify(category.to_dict(include_rights=True, include_stats=True))


@rights_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Aggiorna categoria"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    category = RightCategory.query.filter_by(id=category_id, club_id=club.id).first()
    if not category:
        return jsonify({'error': 'Categoria non trovata'}), 404

    data = request.get_json()

    for field in ['nome', 'descrizione', 'descrizione_breve', 'icona', 'colore', 'immagine',
                  'ordine', 'esclusivita_default', 'richiede_approvazione', 'max_sponsor_categoria', 'attivo']:
        if field in data:
            setattr(category, field, data[field])

    db.session.commit()
    return jsonify(category.to_dict())


@rights_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Elimina categoria (soft delete)"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    category = RightCategory.query.filter_by(id=category_id, club_id=club.id).first()
    if not category:
        return jsonify({'error': 'Categoria non trovata'}), 404

    # Verifica che non ci siano diritti attivi
    active_rights = Right.query.filter_by(category_id=category_id, attivo=True).count()
    if active_rights > 0:
        return jsonify({'error': f'Impossibile eliminare: {active_rights} diritti attivi in questa categoria'}), 400

    category.attivo = False
    db.session.commit()

    return jsonify({'message': 'Categoria disattivata'})


@rights_bp.route('/categories/init-defaults', methods=['POST'])
@jwt_required()
def init_default_categories():
    """Inizializza categorie di default per un club"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Categorie di default
    defaults = [
        {'codice': 'naming', 'nome': 'Naming Rights', 'descrizione': 'Diritti di denominazione (stadio, centro sportivo, academy)', 'icona': 'building', 'colore': '#6366F1', 'ordine': 1},
        {'codice': 'kit', 'nome': 'Kit Rights', 'descrizione': 'Diritti su maglia, abbigliamento gara, allenamento e staff', 'icona': 'shirt', 'colore': '#EC4899', 'ordine': 2},
        {'codice': 'digital', 'nome': 'Digital Rights', 'descrizione': 'Diritti su canali digitali: website, app, social media, newsletter', 'icona': 'globe', 'colore': '#3B82F6', 'ordine': 3},
        {'codice': 'broadcast', 'nome': 'Broadcast Rights', 'descrizione': 'Diritti broadcast: LED, backdrop, cartellonistica TV', 'icona': 'tv', 'colore': '#F59E0B', 'ordine': 4},
        {'codice': 'hospitality', 'nome': 'Hospitality Rights', 'descrizione': 'Diritti hospitality: skybox, lounge, catering, meet&greet', 'icona': 'star', 'colore': '#10B981', 'ordine': 5},
        {'codice': 'activation', 'nome': 'Activation Rights', 'descrizione': 'Diritti di attivazione: sampling, eventi, promozioni', 'icona': 'zap', 'colore': '#8B5CF6', 'ordine': 6},
        {'codice': 'ip', 'nome': 'IP Rights', 'descrizione': 'Diritti di proprietà intellettuale: uso logo, immagini giocatori, licensing', 'icona': 'shield', 'colore': '#EF4444', 'ordine': 7},
    ]

    created = []
    for cat_data in defaults:
        # Verifica se esiste già
        existing = RightCategory.query.filter_by(club_id=club.id, codice=cat_data['codice']).first()
        if not existing:
            category = RightCategory(club_id=club.id, **cat_data)
            db.session.add(category)
            created.append(cat_data['nome'])

    db.session.commit()

    return jsonify({
        'message': f'Create {len(created)} categorie',
        'created': created
    })


# =============================================================================
# RIGHTS
# =============================================================================

@rights_bp.route('', methods=['GET'])
@jwt_required()
def get_rights():
    """Lista diritti con filtri"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Query base
    query = Right.query.filter_by(club_id=club.id, attivo=True)

    # Filtri
    category_id = request.args.get('category_id')
    if category_id:
        query = query.filter_by(category_id=int(category_id))

    categoria = request.args.get('categoria')
    if categoria:
        query = query.join(RightCategory).filter(RightCategory.codice == categoria)

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    disponibile = request.args.get('disponibile')
    if disponibile:
        query = query.filter_by(disponibile=disponibile.lower() == 'true')

    esclusivo = request.args.get('esclusivo')
    if esclusivo:
        query = query.filter_by(esclusivo=esclusivo.lower() == 'true')

    search = request.args.get('search')
    if search:
        query = query.filter(or_(
            Right.nome.ilike(f'%{search}%'),
            Right.codice.ilike(f'%{search}%'),
            Right.descrizione.ilike(f'%{search}%')
        ))

    # Ordinamento
    sort = request.args.get('sort', 'ordine')
    if sort == 'nome':
        query = query.order_by(Right.nome)
    elif sort == 'prezzo':
        query = query.order_by(Right.prezzo_listino.desc())
    elif sort == 'created':
        query = query.order_by(Right.created_at.desc())
    else:
        query = query.order_by(Right.ordine, Right.nome)

    # Paginazione
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    include_allocations = request.args.get('include_allocations', 'false').lower() == 'true'
    include_pricing = request.args.get('include_pricing', 'false').lower() == 'true'

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'items': [r.to_dict(include_allocations=include_allocations, include_pricing=include_pricing) for r in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    })


@rights_bp.route('', methods=['POST'])
@jwt_required()
def create_right():
    """Crea nuovo diritto"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Verifica categoria
    category = RightCategory.query.filter_by(id=data.get('category_id'), club_id=club.id).first()
    if not category:
        return jsonify({'error': 'Categoria non valida'}), 400

    # Verifica codice unico
    existing = Right.query.filter_by(club_id=club.id, codice=data.get('codice')).first()
    if existing:
        return jsonify({'error': 'Codice diritto già esistente'}), 400

    right = Right(
        club_id=club.id,
        category_id=data.get('category_id'),
        codice=data.get('codice'),
        nome=data.get('nome'),
        descrizione=data.get('descrizione'),
        descrizione_breve=data.get('descrizione_breve'),
        tipo=data.get('tipo'),
        sottotipo=data.get('sottotipo'),
        posizione=data.get('posizione'),
        dimensioni=data.get('dimensioni'),
        specifiche_tecniche=data.get('specifiche_tecniche'),
        immagine_principale=data.get('immagine_principale'),
        immagini_gallery=json.dumps(data.get('immagini_gallery', [])) if data.get('immagini_gallery') else None,
        video_presentazione=data.get('video_presentazione'),
        documento_specifiche=data.get('documento_specifiche'),
        # Esclusività
        esclusivo=data.get('esclusivo', True),
        esclusivita_settoriale=data.get('esclusivita_settoriale', True),
        settori_esclusi=json.dumps(data.get('settori_esclusi', [])) if data.get('settori_esclusi') else None,
        max_allocazioni=data.get('max_allocazioni', 1),
        # Territorio
        territorio_disponibile=data.get('territorio_disponibile', 'world'),
        territori_inclusi=json.dumps(data.get('territori_inclusi', [])) if data.get('territori_inclusi') else None,
        territori_esclusi=json.dumps(data.get('territori_esclusi', [])) if data.get('territori_esclusi') else None,
        # Durata
        durata_minima_mesi=data.get('durata_minima_mesi'),
        durata_massima_mesi=data.get('durata_massima_mesi'),
        rinnovo_automatico=data.get('rinnovo_automatico', False),
        preavviso_disdetta_giorni=data.get('preavviso_disdetta_giorni', 90),
        # Sublicenza
        sublicenziabile=data.get('sublicenziabile', False),
        condizioni_sublicenza=data.get('condizioni_sublicenza'),
        percentuale_sublicenza=data.get('percentuale_sublicenza'),
        # Pricing
        prezzo_listino=data.get('prezzo_listino'),
        prezzo_minimo=data.get('prezzo_minimo'),
        valuta=data.get('valuta', 'EUR'),
        prezzo_per=data.get('prezzo_per', 'stagione'),
        sconto_biennale=data.get('sconto_biennale'),
        sconto_triennale=data.get('sconto_triennale'),
        # Visibilità
        disponibile=data.get('disponibile', True),
        visibile_marketplace=data.get('visibile_marketplace', True),
        in_evidenza=data.get('in_evidenza', False),
        riservato=data.get('riservato', False),
        # Altro
        ordine=data.get('ordine', 0),
        priorita=data.get('priorita', 0),
        tags=data.get('tags'),
        note_interne=data.get('note_interne'),
        stagione_corrente=data.get('stagione_corrente')
    )

    db.session.add(right)
    db.session.commit()

    return jsonify(right.to_dict()), 201


@rights_bp.route('/<int:right_id>', methods=['GET'])
@jwt_required()
def get_right(right_id):
    """Dettaglio diritto"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    right = Right.query.filter_by(id=right_id, club_id=club.id).first()
    if not right:
        return jsonify({'error': 'Diritto non trovato'}), 404

    return jsonify(right.to_dict(include_allocations=True, include_pricing=True))


@rights_bp.route('/<int:right_id>', methods=['PUT'])
@jwt_required()
def update_right(right_id):
    """Aggiorna diritto"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    right = Right.query.filter_by(id=right_id, club_id=club.id).first()
    if not right:
        return jsonify({'error': 'Diritto non trovato'}), 404

    data = request.get_json()

    # Campi semplici
    simple_fields = [
        'nome', 'descrizione', 'descrizione_breve', 'tipo', 'sottotipo', 'posizione', 'dimensioni',
        'specifiche_tecniche', 'immagine_principale', 'video_presentazione', 'documento_specifiche',
        'esclusivo', 'esclusivita_settoriale', 'max_allocazioni',
        'territorio_disponibile', 'durata_minima_mesi', 'durata_massima_mesi',
        'rinnovo_automatico', 'preavviso_disdetta_giorni',
        'sublicenziabile', 'condizioni_sublicenza', 'percentuale_sublicenza',
        'prezzo_listino', 'prezzo_minimo', 'valuta', 'prezzo_per',
        'sconto_biennale', 'sconto_triennale',
        'disponibile', 'visibile_marketplace', 'in_evidenza', 'riservato', 'status', 'attivo',
        'ordine', 'priorita', 'tags', 'note_interne', 'stagione_corrente'
    ]

    for field in simple_fields:
        if field in data:
            setattr(right, field, data[field])

    # Campi JSON
    json_fields = ['immagini_gallery', 'settori_esclusi', 'territori_inclusi', 'territori_esclusi']
    for field in json_fields:
        if field in data:
            setattr(right, field, json.dumps(data[field]) if data[field] else None)

    if 'category_id' in data:
        category = RightCategory.query.filter_by(id=data['category_id'], club_id=club.id).first()
        if category:
            right.category_id = data['category_id']

    db.session.commit()
    return jsonify(right.to_dict())


@rights_bp.route('/<int:right_id>', methods=['DELETE'])
@jwt_required()
def delete_right(right_id):
    """Elimina diritto (soft delete)"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    right = Right.query.filter_by(id=right_id, club_id=club.id).first()
    if not right:
        return jsonify({'error': 'Diritto non trovato'}), 404

    # Verifica allocazioni attive
    active_allocs = RightAllocation.query.filter_by(right_id=right_id, status='attiva').count()
    if active_allocs > 0:
        return jsonify({'error': f'Impossibile eliminare: {active_allocs} allocazioni attive'}), 400

    right.attivo = False
    right.disponibile = False
    db.session.commit()

    return jsonify({'message': 'Diritto disattivato'})


# =============================================================================
# RIGHT PRICING TIERS
# =============================================================================

@rights_bp.route('/<int:right_id>/pricing-tiers', methods=['GET'])
@jwt_required()
def get_pricing_tiers(right_id):
    """Lista tier di prezzo per diritto"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    right = Right.query.filter_by(id=right_id, club_id=club.id).first()
    if not right:
        return jsonify({'error': 'Diritto non trovato'}), 404

    tiers = RightPricingTier.query.filter_by(right_id=right_id, attivo=True).order_by(RightPricingTier.ordine).all()
    return jsonify([t.to_dict() for t in tiers])


@rights_bp.route('/<int:right_id>/pricing-tiers', methods=['POST'])
@jwt_required()
def create_pricing_tier(right_id):
    """Crea tier di prezzo"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    right = Right.query.filter_by(id=right_id, club_id=club.id).first()
    if not right:
        return jsonify({'error': 'Diritto non trovato'}), 404

    data = request.get_json()

    tier = RightPricingTier(
        right_id=right_id,
        nome=data.get('nome'),
        codice=data.get('codice'),
        descrizione=data.get('descrizione'),
        prezzo=data.get('prezzo'),
        prezzo_scontato=data.get('prezzo_scontato'),
        valuta=data.get('valuta', 'EUR'),
        moltiplicatore=data.get('moltiplicatore', 1.0),
        competizioni=json.dumps(data.get('competizioni', [])) if data.get('competizioni') else None,
        partite_specifiche=json.dumps(data.get('partite_specifiche', [])) if data.get('partite_specifiche') else None,
        date_range=json.dumps(data.get('date_range')) if data.get('date_range') else None,
        ordine=data.get('ordine', 0)
    )

    db.session.add(tier)
    db.session.commit()

    return jsonify(tier.to_dict()), 201


@rights_bp.route('/<int:right_id>/pricing-tiers/<int:tier_id>', methods=['PUT'])
@jwt_required()
def update_pricing_tier(right_id, tier_id):
    """Aggiorna tier di prezzo"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    right = Right.query.filter_by(id=right_id, club_id=club.id).first()
    if not right:
        return jsonify({'error': 'Diritto non trovato'}), 404

    tier = RightPricingTier.query.filter_by(id=tier_id, right_id=right_id).first()
    if not tier:
        return jsonify({'error': 'Tier non trovato'}), 404

    data = request.get_json()

    for field in ['nome', 'codice', 'descrizione', 'prezzo', 'prezzo_scontato', 'valuta', 'moltiplicatore', 'ordine', 'attivo']:
        if field in data:
            setattr(tier, field, data[field])

    for field in ['competizioni', 'partite_specifiche', 'date_range']:
        if field in data:
            setattr(tier, field, json.dumps(data[field]) if data[field] else None)

    db.session.commit()
    return jsonify(tier.to_dict())


@rights_bp.route('/<int:right_id>/pricing-tiers/<int:tier_id>', methods=['DELETE'])
@jwt_required()
def delete_pricing_tier(right_id, tier_id):
    """Elimina tier di prezzo"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    tier = RightPricingTier.query.filter_by(id=tier_id, right_id=right_id).first()
    if not tier:
        return jsonify({'error': 'Tier non trovato'}), 404

    db.session.delete(tier)
    db.session.commit()

    return jsonify({'message': 'Tier eliminato'})


# =============================================================================
# RIGHT ALLOCATIONS
# =============================================================================

@rights_bp.route('/allocations', methods=['GET'])
@jwt_required()
def get_allocations():
    """Lista allocazioni con filtri"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    query = RightAllocation.query.filter_by(club_id=club.id)

    # Filtri
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    sponsor_id = request.args.get('sponsor_id')
    if sponsor_id:
        query = query.filter_by(sponsor_id=int(sponsor_id))

    right_id = request.args.get('right_id')
    if right_id:
        query = query.filter_by(right_id=int(right_id))

    contract_id = request.args.get('contract_id')
    if contract_id:
        query = query.filter_by(contract_id=int(contract_id))

    stagione = request.args.get('stagione')
    if stagione:
        query = query.filter_by(stagione=stagione)

    settore = request.args.get('settore')
    if settore:
        query = query.filter_by(settore_merceologico=settore)

    # Solo attive (non scadute)
    active_only = request.args.get('active_only', 'false').lower() == 'true'
    if active_only:
        today = date.today()
        query = query.filter(
            RightAllocation.status == 'attiva',
            RightAllocation.data_fine >= today
        )

    # Ordinamento
    query = query.order_by(RightAllocation.data_inizio.desc())

    allocations = query.all()
    return jsonify([a.to_dict() for a in allocations])


@rights_bp.route('/allocations', methods=['POST'])
@jwt_required()
def create_allocation():
    """Crea nuova allocazione"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Verifica diritto
    right = Right.query.filter_by(id=data.get('right_id'), club_id=club.id).first()
    if not right:
        return jsonify({'error': 'Diritto non valido'}), 400

    # Verifica sponsor
    sponsor = Sponsor.query.filter_by(id=data.get('sponsor_id'), club_id=club.id).first()
    if not sponsor:
        return jsonify({'error': 'Sponsor non valido'}), 400

    # Parse date
    try:
        data_inizio = datetime.strptime(data.get('data_inizio'), '%Y-%m-%d').date()
        data_fine = datetime.strptime(data.get('data_fine'), '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return jsonify({'error': 'Date non valide'}), 400

    # Verifica conflitti esclusività diritto
    right_conflicts = check_right_allocation_conflict(
        club.id, right.id, sponsor.id, data_inizio, data_fine
    )

    # Verifica conflitti settoriali
    sector_conflicts = []
    if data.get('esclusivita_settoriale') and data.get('settore_merceologico'):
        sector_conflicts = check_sector_conflict(
            club.id, data.get('settore_merceologico'), sponsor.id, data_inizio, data_fine
        )

    all_conflicts = right_conflicts + sector_conflicts

    # Se ci sono conflitti e non forziamo, ritorna errore
    if all_conflicts and not data.get('force', False):
        return jsonify({
            'error': 'Conflitti rilevati',
            'conflicts': all_conflicts,
            'message': 'Usa force=true per ignorare i conflitti'
        }), 409

    # Crea allocazione
    allocation = RightAllocation(
        right_id=data.get('right_id'),
        club_id=club.id,
        sponsor_id=data.get('sponsor_id'),
        contract_id=data.get('contract_id'),
        stagione=data.get('stagione'),
        data_inizio=data_inizio,
        data_fine=data_fine,
        territorio=data.get('territorio', 'world'),
        territori_specifici=json.dumps(data.get('territori_specifici', [])) if data.get('territori_specifici') else None,
        esclusivita_settoriale=data.get('esclusivita_settoriale', True),
        settore_merceologico=data.get('settore_merceologico'),
        sottosettore=data.get('sottosettore'),
        sublicenza_concessa=data.get('sublicenza_concessa', False),
        prezzo_concordato=data.get('prezzo_concordato'),
        valuta=data.get('valuta', 'EUR'),
        modalita_pagamento=data.get('modalita_pagamento'),
        note_pagamento=data.get('note_pagamento'),
        status=data.get('status', 'attiva'),
        rinnovo_automatico=data.get('rinnovo_automatico', False),
        note=data.get('note'),
        note_interne=data.get('note_interne'),
        created_by=f"club:{club.id}"
    )

    db.session.add(allocation)

    # Aggiorna status diritto
    if right.esclusivo:
        right.status = 'allocato'
        right.disponibile = False

    # Registra conflitti se ignorati
    if all_conflicts:
        for conflict_data in all_conflicts:
            conflict = RightConflict(
                club_id=club.id,
                tipo_conflitto=conflict_data['tipo'],
                right_id=right.id,
                allocation_id_1=allocation.id if allocation.id else None,
                sponsor_id_1=sponsor.id,
                sponsor_id_2=conflict_data.get('sponsor_id'),
                descrizione=f"Conflitto {conflict_data['tipo']} ignorato alla creazione",
                dettagli=json.dumps(conflict_data),
                severita='warning',
                status='ignorato'
            )
            db.session.add(conflict)

    db.session.commit()

    return jsonify(allocation.to_dict()), 201


@rights_bp.route('/allocations/<int:allocation_id>', methods=['GET'])
@jwt_required()
def get_allocation(allocation_id):
    """Dettaglio allocazione"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    allocation = RightAllocation.query.filter_by(id=allocation_id, club_id=club.id).first()
    if not allocation:
        return jsonify({'error': 'Allocazione non trovata'}), 404

    return jsonify(allocation.to_dict())


@rights_bp.route('/allocations/<int:allocation_id>', methods=['PUT'])
@jwt_required()
def update_allocation(allocation_id):
    """Aggiorna allocazione"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    allocation = RightAllocation.query.filter_by(id=allocation_id, club_id=club.id).first()
    if not allocation:
        return jsonify({'error': 'Allocazione non trovata'}), 404

    data = request.get_json()

    # Campi aggiornabili
    for field in ['stagione', 'territorio', 'esclusivita_settoriale', 'settore_merceologico', 'sottosettore',
                  'sublicenza_concessa', 'prezzo_concordato', 'valuta', 'modalita_pagamento', 'note_pagamento',
                  'status', 'rinnovo_automatico', 'note', 'note_interne']:
        if field in data:
            setattr(allocation, field, data[field])

    # Date
    if 'data_inizio' in data:
        allocation.data_inizio = datetime.strptime(data['data_inizio'], '%Y-%m-%d').date()
    if 'data_fine' in data:
        allocation.data_fine = datetime.strptime(data['data_fine'], '%Y-%m-%d').date()

    # Territori (JSON)
    if 'territori_specifici' in data:
        allocation.territori_specifici = json.dumps(data['territori_specifici']) if data['territori_specifici'] else None

    # Se status cambia a conclusa/annullata, libera il diritto
    if data.get('status') in ['conclusa', 'annullata']:
        right = allocation.right
        if right and right.esclusivo:
            # Verifica se ci sono altre allocazioni attive
            other_active = RightAllocation.query.filter(
                RightAllocation.right_id == right.id,
                RightAllocation.id != allocation.id,
                RightAllocation.status == 'attiva'
            ).count()
            if other_active == 0:
                right.status = 'disponibile'
                right.disponibile = True

    db.session.commit()
    return jsonify(allocation.to_dict())


@rights_bp.route('/allocations/<int:allocation_id>', methods=['DELETE'])
@jwt_required()
def delete_allocation(allocation_id):
    """Elimina allocazione"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    allocation = RightAllocation.query.filter_by(id=allocation_id, club_id=club.id).first()
    if not allocation:
        return jsonify({'error': 'Allocazione non trovata'}), 404

    right = allocation.right

    db.session.delete(allocation)

    # Libera diritto se necessario
    if right and right.esclusivo:
        other_active = RightAllocation.query.filter(
            RightAllocation.right_id == right.id,
            RightAllocation.id != allocation.id,
            RightAllocation.status == 'attiva'
        ).count()
        if other_active == 0:
            right.status = 'disponibile'
            right.disponibile = True

    db.session.commit()
    return jsonify({'message': 'Allocazione eliminata'})


# =============================================================================
# SECTOR EXCLUSIVITIES
# =============================================================================

@rights_bp.route('/sectors', methods=['GET'])
@jwt_required()
def get_sectors():
    """Lista esclusività settoriali"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sectors = SectorExclusivity.query.filter_by(club_id=club.id).order_by(SectorExclusivity.settore_nome).all()
    return jsonify([s.to_dict() for s in sectors])


@rights_bp.route('/sectors', methods=['POST'])
@jwt_required()
def create_sector():
    """Crea esclusività settoriale"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    sector = SectorExclusivity(
        club_id=club.id,
        settore_codice=data.get('settore_codice'),
        settore_nome=data.get('settore_nome'),
        descrizione=data.get('descrizione'),
        icona=data.get('icona'),
        colore=data.get('colore'),
        sottosettori=json.dumps(data.get('sottosettori', [])) if data.get('sottosettori') else None,
        sponsor_id=data.get('sponsor_id'),
        contract_id=data.get('contract_id'),
        stagione=data.get('stagione'),
        data_inizio=datetime.strptime(data['data_inizio'], '%Y-%m-%d').date() if data.get('data_inizio') else None,
        data_fine=datetime.strptime(data['data_fine'], '%Y-%m-%d').date() if data.get('data_fine') else None,
        territorio=data.get('territorio', 'world'),
        territori_specifici=json.dumps(data.get('territori_specifici', [])) if data.get('territori_specifici') else None,
        valore=data.get('valore'),
        valuta=data.get('valuta', 'EUR'),
        status='allocata' if data.get('sponsor_id') else 'disponibile',
        attiva=bool(data.get('sponsor_id')),
        note=data.get('note')
    )

    db.session.add(sector)
    db.session.commit()

    return jsonify(sector.to_dict()), 201


@rights_bp.route('/sectors/<int:sector_id>', methods=['PUT'])
@jwt_required()
def update_sector(sector_id):
    """Aggiorna esclusività settoriale"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sector = SectorExclusivity.query.filter_by(id=sector_id, club_id=club.id).first()
    if not sector:
        return jsonify({'error': 'Settore non trovato'}), 404

    data = request.get_json()

    for field in ['settore_nome', 'descrizione', 'icona', 'colore', 'sponsor_id', 'contract_id',
                  'stagione', 'territorio', 'valore', 'valuta', 'status', 'note']:
        if field in data:
            setattr(sector, field, data[field])

    if 'data_inizio' in data:
        sector.data_inizio = datetime.strptime(data['data_inizio'], '%Y-%m-%d').date() if data['data_inizio'] else None
    if 'data_fine' in data:
        sector.data_fine = datetime.strptime(data['data_fine'], '%Y-%m-%d').date() if data['data_fine'] else None

    if 'sottosettori' in data:
        sector.sottosettori = json.dumps(data['sottosettori']) if data['sottosettori'] else None
    if 'territori_specifici' in data:
        sector.territori_specifici = json.dumps(data['territori_specifici']) if data['territori_specifici'] else None

    # Aggiorna status
    sector.attiva = bool(sector.sponsor_id)
    sector.status = 'allocata' if sector.sponsor_id else 'disponibile'

    db.session.commit()
    return jsonify(sector.to_dict())


@rights_bp.route('/sectors/<int:sector_id>', methods=['DELETE'])
@jwt_required()
def delete_sector(sector_id):
    """Elimina esclusività settoriale"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sector = SectorExclusivity.query.filter_by(id=sector_id, club_id=club.id).first()
    if not sector:
        return jsonify({'error': 'Settore non trovato'}), 404

    db.session.delete(sector)
    db.session.commit()

    return jsonify({'message': 'Settore eliminato'})


@rights_bp.route('/sectors/init-defaults', methods=['POST'])
@jwt_required()
def init_default_sectors():
    """Inizializza settori merceologici di default"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    defaults = [
        {'settore_codice': 'bevande', 'settore_nome': 'Bevande & Soft Drinks', 'icona': 'coffee', 'colore': '#3B82F6'},
        {'settore_codice': 'automotive', 'settore_nome': 'Automotive', 'icona': 'car', 'colore': '#EF4444'},
        {'settore_codice': 'tech', 'settore_nome': 'Tecnologia & Elettronica', 'icona': 'smartphone', 'colore': '#8B5CF6'},
        {'settore_codice': 'banking', 'settore_nome': 'Banking & Finanza', 'icona': 'credit-card', 'colore': '#10B981'},
        {'settore_codice': 'insurance', 'settore_nome': 'Assicurazioni', 'icona': 'shield', 'colore': '#F59E0B'},
        {'settore_codice': 'energy', 'settore_nome': 'Energia & Utilities', 'icona': 'zap', 'colore': '#FBBF24'},
        {'settore_codice': 'food', 'settore_nome': 'Food & Beverage', 'icona': 'utensils', 'colore': '#F97316'},
        {'settore_codice': 'fashion', 'settore_nome': 'Moda & Abbigliamento', 'icona': 'shirt', 'colore': '#EC4899'},
        {'settore_codice': 'telecom', 'settore_nome': 'Telecomunicazioni', 'icona': 'phone', 'colore': '#6366F1'},
        {'settore_codice': 'betting', 'settore_nome': 'Betting & Gaming', 'icona': 'dice', 'colore': '#14B8A6'},
        {'settore_codice': 'airlines', 'settore_nome': 'Compagnie Aeree & Viaggi', 'icona': 'plane', 'colore': '#0EA5E9'},
        {'settore_codice': 'healthcare', 'settore_nome': 'Healthcare & Pharma', 'icona': 'heart', 'colore': '#22C55E'},
        {'settore_codice': 'retail', 'settore_nome': 'Retail & GDO', 'icona': 'shopping-bag', 'colore': '#A855F7'},
        {'settore_codice': 'crypto', 'settore_nome': 'Crypto & Blockchain', 'icona': 'bitcoin', 'colore': '#F7931A'},
        {'settore_codice': 'luxury', 'settore_nome': 'Luxury & Premium', 'icona': 'gem', 'colore': '#1F2937'},
    ]

    created = []
    for sector_data in defaults:
        existing = SectorExclusivity.query.filter_by(club_id=club.id, settore_codice=sector_data['settore_codice']).first()
        if not existing:
            sector = SectorExclusivity(club_id=club.id, **sector_data)
            db.session.add(sector)
            created.append(sector_data['settore_nome'])

    db.session.commit()

    return jsonify({
        'message': f'Creati {len(created)} settori',
        'created': created
    })


# =============================================================================
# CONFLICTS
# =============================================================================

@rights_bp.route('/conflicts', methods=['GET'])
@jwt_required()
def get_conflicts():
    """Lista conflitti"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    query = RightConflict.query.filter_by(club_id=club.id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    severita = request.args.get('severita')
    if severita:
        query = query.filter_by(severita=severita)

    tipo = request.args.get('tipo')
    if tipo:
        query = query.filter_by(tipo_conflitto=tipo)

    query = query.order_by(RightConflict.created_at.desc())

    conflicts = query.all()
    return jsonify([c.to_dict() for c in conflicts])


@rights_bp.route('/conflicts/<int:conflict_id>', methods=['PUT'])
@jwt_required()
def update_conflict(conflict_id):
    """Aggiorna stato conflitto"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    conflict = RightConflict.query.filter_by(id=conflict_id, club_id=club.id).first()
    if not conflict:
        return jsonify({'error': 'Conflitto non trovato'}), 404

    data = request.get_json()

    if 'status' in data:
        conflict.status = data['status']
        if data['status'] == 'risolto':
            conflict.data_risoluzione = datetime.utcnow()
            conflict.risolto_da = f"club:{club.id}"

    if 'risoluzione' in data:
        conflict.risoluzione = data['risoluzione']

    db.session.commit()
    return jsonify(conflict.to_dict())


@rights_bp.route('/check-conflicts', methods=['POST'])
@jwt_required()
def check_conflicts():
    """Verifica conflitti prima di creare allocazione"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    try:
        data_inizio = datetime.strptime(data.get('data_inizio'), '%Y-%m-%d').date()
        data_fine = datetime.strptime(data.get('data_fine'), '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return jsonify({'error': 'Date non valide'}), 400

    all_conflicts = []

    # Conflitti diritto
    if data.get('right_id'):
        right_conflicts = check_right_allocation_conflict(
            club.id, data['right_id'], data.get('sponsor_id'), data_inizio, data_fine
        )
        all_conflicts.extend(right_conflicts)

    # Conflitti settore
    if data.get('settore_merceologico') and data.get('esclusivita_settoriale', True):
        sector_conflicts = check_sector_conflict(
            club.id, data['settore_merceologico'], data.get('sponsor_id'), data_inizio, data_fine
        )
        all_conflicts.extend(sector_conflicts)

    return jsonify({
        'has_conflicts': len(all_conflicts) > 0,
        'conflicts': all_conflicts
    })


# =============================================================================
# RIGHT PACKAGES
# =============================================================================

@rights_bp.route('/packages', methods=['GET'])
@jwt_required()
def get_packages():
    """Lista package di diritti"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    packages = RightPackage.query.filter_by(club_id=club.id, attivo=True).order_by(RightPackage.livello, RightPackage.ordine).all()

    include_items = request.args.get('include_items', 'true').lower() == 'true'
    return jsonify([p.to_dict(include_items=include_items) for p in packages])


@rights_bp.route('/packages', methods=['POST'])
@jwt_required()
def create_package():
    """Crea package di diritti"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    package = RightPackage(
        club_id=club.id,
        codice=data.get('codice'),
        nome=data.get('nome'),
        descrizione=data.get('descrizione'),
        descrizione_breve=data.get('descrizione_breve'),
        livello=data.get('livello', 0),
        ordine=data.get('ordine', 0),
        colore=data.get('colore'),
        icona=data.get('icona'),
        immagine=data.get('immagine'),
        badge_url=data.get('badge_url'),
        prezzo_listino=data.get('prezzo_listino'),
        prezzo_minimo=data.get('prezzo_minimo'),
        prezzo_scontato=data.get('prezzo_scontato'),
        sconto_percentuale=data.get('sconto_percentuale'),
        valuta=data.get('valuta', 'EUR'),
        esclusivo=data.get('esclusivo', True),
        max_vendite=data.get('max_vendite', 1),
        durata_default_mesi=data.get('durata_default_mesi', 12),
        visibile_marketplace=data.get('visibile_marketplace', True),
        in_evidenza=data.get('in_evidenza', False),
        stagione=data.get('stagione'),
        disponibile_da=datetime.strptime(data['disponibile_da'], '%Y-%m-%d').date() if data.get('disponibile_da') else None,
        disponibile_fino=datetime.strptime(data['disponibile_fino'], '%Y-%m-%d').date() if data.get('disponibile_fino') else None
    )

    db.session.add(package)
    db.session.flush()  # Per ottenere l'ID

    # Aggiungi items
    if data.get('items'):
        for item_data in data['items']:
            item = RightPackageItem(
                package_id=package.id,
                right_id=item_data['right_id'],
                quantita=item_data.get('quantita', 1),
                incluso=item_data.get('incluso', True),
                opzionale=item_data.get('opzionale', False),
                prezzo_aggiuntivo=item_data.get('prezzo_aggiuntivo'),
                note=item_data.get('note'),
                condizioni_specifiche=item_data.get('condizioni_specifiche'),
                ordine=item_data.get('ordine', 0)
            )
            db.session.add(item)

    db.session.commit()

    return jsonify(package.to_dict()), 201


@rights_bp.route('/packages/<int:package_id>', methods=['GET'])
@jwt_required()
def get_package(package_id):
    """Dettaglio package"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    package = RightPackage.query.filter_by(id=package_id, club_id=club.id).first()
    if not package:
        return jsonify({'error': 'Package non trovato'}), 404

    return jsonify(package.to_dict(include_items=True))


@rights_bp.route('/packages/<int:package_id>', methods=['PUT'])
@jwt_required()
def update_package(package_id):
    """Aggiorna package"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    package = RightPackage.query.filter_by(id=package_id, club_id=club.id).first()
    if not package:
        return jsonify({'error': 'Package non trovato'}), 404

    data = request.get_json()

    for field in ['nome', 'descrizione', 'descrizione_breve', 'livello', 'ordine', 'colore', 'icona', 'immagine',
                  'badge_url', 'prezzo_listino', 'prezzo_minimo', 'prezzo_scontato', 'sconto_percentuale', 'valuta',
                  'esclusivo', 'max_vendite', 'durata_default_mesi', 'attivo', 'visibile_marketplace', 'in_evidenza', 'stagione']:
        if field in data:
            setattr(package, field, data[field])

    if 'disponibile_da' in data:
        package.disponibile_da = datetime.strptime(data['disponibile_da'], '%Y-%m-%d').date() if data['disponibile_da'] else None
    if 'disponibile_fino' in data:
        package.disponibile_fino = datetime.strptime(data['disponibile_fino'], '%Y-%m-%d').date() if data['disponibile_fino'] else None

    # Aggiorna items se forniti
    if 'items' in data:
        # Rimuovi items esistenti
        RightPackageItem.query.filter_by(package_id=package.id).delete()

        # Aggiungi nuovi items
        for item_data in data['items']:
            item = RightPackageItem(
                package_id=package.id,
                right_id=item_data['right_id'],
                quantita=item_data.get('quantita', 1),
                incluso=item_data.get('incluso', True),
                opzionale=item_data.get('opzionale', False),
                prezzo_aggiuntivo=item_data.get('prezzo_aggiuntivo'),
                note=item_data.get('note'),
                condizioni_specifiche=item_data.get('condizioni_specifiche'),
                ordine=item_data.get('ordine', 0)
            )
            db.session.add(item)

    db.session.commit()
    return jsonify(package.to_dict())


@rights_bp.route('/packages/<int:package_id>', methods=['DELETE'])
@jwt_required()
def delete_package(package_id):
    """Elimina package (soft delete)"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    package = RightPackage.query.filter_by(id=package_id, club_id=club.id).first()
    if not package:
        return jsonify({'error': 'Package non trovato'}), 404

    package.attivo = False
    db.session.commit()

    return jsonify({'message': 'Package disattivato'})


# =============================================================================
# STATS & DASHBOARD
# =============================================================================

@rights_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Statistiche Rights Management"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Conteggi base
    total_rights = Right.query.filter_by(club_id=club.id, attivo=True).count()
    available_rights = Right.query.filter_by(club_id=club.id, attivo=True, disponibile=True).count()
    allocated_rights = Right.query.filter_by(club_id=club.id, attivo=True, status='allocato').count()

    # Valore totale
    total_value = db.session.query(func.sum(Right.prezzo_listino)).filter(
        Right.club_id == club.id,
        Right.attivo == True
    ).scalar() or 0

    allocated_value = db.session.query(func.sum(RightAllocation.prezzo_concordato)).filter(
        RightAllocation.club_id == club.id,
        RightAllocation.status == 'attiva'
    ).scalar() or 0

    # Allocazioni attive
    active_allocations = RightAllocation.query.filter_by(club_id=club.id, status='attiva').count()

    # Conflitti aperti
    open_conflicts = RightConflict.query.filter_by(club_id=club.id, status='aperto').count()

    # Esclusività settoriali
    total_sectors = SectorExclusivity.query.filter_by(club_id=club.id).count()
    allocated_sectors = SectorExclusivity.query.filter_by(club_id=club.id, attiva=True).count()

    # Categorie
    categories = RightCategory.query.filter_by(club_id=club.id, attivo=True).all()
    category_stats = []
    for cat in categories:
        cat_rights = Right.query.filter_by(club_id=club.id, category_id=cat.id, attivo=True).all()
        cat_allocated = sum(1 for r in cat_rights if r.status == 'allocato')
        cat_value = sum(r.prezzo_listino or 0 for r in cat_rights)
        category_stats.append({
            'id': cat.id,
            'nome': cat.nome,
            'codice': cat.codice,
            'colore': cat.colore,
            'totale': len(cat_rights),
            'allocati': cat_allocated,
            'disponibili': len(cat_rights) - cat_allocated,
            'valore': cat_value
        })

    # Allocazioni in scadenza (prossimi 30 giorni)
    from datetime import timedelta
    thirty_days = date.today() + timedelta(days=30)
    expiring_soon = RightAllocation.query.filter(
        RightAllocation.club_id == club.id,
        RightAllocation.status == 'attiva',
        RightAllocation.data_fine <= thirty_days,
        RightAllocation.data_fine >= date.today()
    ).count()

    return jsonify({
        'rights': {
            'totale': total_rights,
            'disponibili': available_rights,
            'allocati': allocated_rights,
            'valore_listino': total_value,
            'valore_allocato': allocated_value
        },
        'allocations': {
            'attive': active_allocations,
            'in_scadenza': expiring_soon
        },
        'sectors': {
            'totale': total_sectors,
            'allocati': allocated_sectors,
            'disponibili': total_sectors - allocated_sectors
        },
        'conflicts': {
            'aperti': open_conflicts
        },
        'categories': category_stats
    })


@rights_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar():
    """Calendario allocazioni per timeline"""
    club = get_current_club()
    if not club:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Parametri
    start_date = request.args.get('start')
    end_date = request.args.get('end')

    query = RightAllocation.query.filter_by(club_id=club.id)

    if start_date:
        query = query.filter(RightAllocation.data_fine >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(RightAllocation.data_inizio <= datetime.strptime(end_date, '%Y-%m-%d').date())

    allocations = query.all()

    events = []
    for alloc in allocations:
        color = '#10B981' if alloc.status == 'attiva' else '#6B7280' if alloc.status == 'conclusa' else '#EF4444'
        events.append({
            'id': alloc.id,
            'title': f"{alloc.right.nome if alloc.right else 'Diritto'} - {alloc.sponsor.ragione_sociale if alloc.sponsor else 'Sponsor'}",
            'start': alloc.data_inizio.isoformat() if alloc.data_inizio else None,
            'end': alloc.data_fine.isoformat() if alloc.data_fine else None,
            'color': color,
            'extendedProps': {
                'right_id': alloc.right_id,
                'sponsor_id': alloc.sponsor_id,
                'status': alloc.status,
                'prezzo': alloc.prezzo_concordato
            }
        })

    return jsonify(events)
