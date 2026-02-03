from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    Proposal, ProposalTemplate, ProposalItem, ProposalVersion,
    ProposalTracking, ProposalComment, Club, Sponsor, Lead,
    InventoryAsset, Right, InventoryCategory, RightCategory
)
from datetime import datetime, timedelta
import json
import uuid

proposal_bp = Blueprint('proposals', __name__)


def verify_club():
    """Helper function to verify club role and return club_id, also sets g.club_id"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'club':
            return None
        club_id = int(get_jwt_identity())
        g.club_id = club_id
        g.club = Club.query.get(club_id)
        return club_id
    except Exception:
        return None


def setup_club_context():
    """Setup club context from JWT for authenticated routes"""
    try:
        claims = get_jwt()
        if claims.get('role') == 'club':
            club_id = int(get_jwt_identity())
            g.club_id = club_id
            g.club = Club.query.get(club_id)
    except Exception:
        pass


# =============================================================================
# PROPOSALS - CRUD
# =============================================================================

@proposal_bp.route('', methods=['GET'])
@jwt_required()
def get_proposals():
    """Lista proposte del club"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri
    stato = request.args.get('stato')
    priorita = request.args.get('priorita')
    search = request.args.get('search', '')
    lead_id = request.args.get('lead_id', type=int)
    sponsor_id = request.args.get('sponsor_id', type=int)
    destinatario_tipo = request.args.get('destinatario_tipo')  # 'lead' or 'sponsor'
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    query = Proposal.query.filter_by(club_id=club_id)

    if stato:
        query = query.filter_by(stato=stato)
    if priorita:
        query = query.filter_by(priorita=priorita)
    if lead_id:
        query = query.filter_by(lead_id=lead_id)
    if sponsor_id:
        query = query.filter_by(sponsor_id=sponsor_id)
    if destinatario_tipo == 'lead':
        query = query.filter(Proposal.lead_id.isnot(None))
    elif destinatario_tipo == 'sponsor':
        query = query.filter(Proposal.sponsor_id.isnot(None))
    if search:
        query = query.filter(
            db.or_(
                Proposal.titolo.ilike(f'%{search}%'),
                Proposal.codice.ilike(f'%{search}%'),
                Proposal.destinatario_azienda.ilike(f'%{search}%')
            )
        )
    if date_from:
        query = query.filter(Proposal.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Proposal.created_at <= datetime.fromisoformat(date_to))

    # Ordinamento
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    if sort_order == 'desc':
        query = query.order_by(db.desc(getattr(Proposal, sort_by, Proposal.created_at)))
    else:
        query = query.order_by(getattr(Proposal, sort_by, Proposal.created_at))

    proposals = query.all()

    return jsonify([p.to_dict(include_items=False) for p in proposals])


@proposal_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_proposal_stats():
    """Statistiche proposte"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposals = Proposal.query.filter_by(club_id=club_id).all()

    stats = {
        'totale': len(proposals),
        'per_stato': {},
        'valore_totale': 0,
        'valore_accettate': 0,
        'tasso_conversione': 0,
        'tempo_medio_risposta': 0,
        'visualizzazioni_totali': 0,
        'proposte_questo_mese': 0,
        'proposte_mese_scorso': 0
    }

    now = datetime.utcnow()
    inizio_mese = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    inizio_mese_scorso = (inizio_mese - timedelta(days=1)).replace(day=1)

    stati = ['bozza', 'inviata', 'visualizzata', 'in_trattativa', 'accettata', 'rifiutata', 'scaduta']
    for stato in stati:
        stats['per_stato'][stato] = 0

    tempi_risposta = []

    for p in proposals:
        stats['per_stato'][p.stato] = stats['per_stato'].get(p.stato, 0) + 1
        stats['valore_totale'] += p.valore_finale or 0
        stats['visualizzazioni_totali'] += p.visualizzazioni or 0

        if p.stato == 'accettata':
            stats['valore_accettate'] += p.valore_finale or 0

        if p.data_invio and p.data_risposta:
            tempi_risposta.append((p.data_risposta - p.data_invio).days)

        if p.created_at >= inizio_mese:
            stats['proposte_questo_mese'] += 1
        elif p.created_at >= inizio_mese_scorso:
            stats['proposte_mese_scorso'] += 1

    # Calcola tasso conversione
    inviate = stats['per_stato'].get('accettata', 0) + stats['per_stato'].get('rifiutata', 0)
    if inviate > 0:
        stats['tasso_conversione'] = round((stats['per_stato'].get('accettata', 0) / inviate) * 100, 1)

    # Tempo medio risposta
    if tempi_risposta:
        stats['tempo_medio_risposta'] = round(sum(tempi_risposta) / len(tempi_risposta), 1)

    return jsonify(stats)


@proposal_bp.route('', methods=['POST'])
@jwt_required()
def create_proposal():
    """Crea nuova proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Genera codice
    year = datetime.now().year
    count = Proposal.query.filter_by(club_id=club_id).count() + 1
    codice = f"PROP-{year}-{count:04d}"

    proposal = Proposal(
        club_id=club_id,
        codice=codice,
        titolo=data.get('titolo', 'Nuova Proposta'),
        sottotitolo=data.get('sottotitolo'),
        template_id=data.get('template_id'),
        lead_id=data.get('lead_id'),
        sponsor_id=data.get('sponsor_id'),
        destinatario_azienda=data.get('destinatario_azienda'),
        destinatario_nome=data.get('destinatario_nome'),
        destinatario_ruolo=data.get('destinatario_ruolo'),
        destinatario_email=data.get('destinatario_email'),
        destinatario_telefono=data.get('destinatario_telefono'),
        settore_merceologico=data.get('settore_merceologico'),
        messaggio_introduttivo=data.get('messaggio_introduttivo'),
        descrizione_opportunita=data.get('descrizione_opportunita'),
        proposta_valore=data.get('proposta_valore'),
        termini_condizioni=data.get('termini_condizioni'),
        durata_mesi=data.get('durata_mesi'),
        stagioni=data.get('stagioni'),
        giorni_validita=data.get('giorni_validita', 30),
        sconto_percentuale=data.get('sconto_percentuale', 0),
        modalita_pagamento=data.get('modalita_pagamento'),
        numero_rate=data.get('numero_rate'),
        colore_primario=data.get('colore_primario', '#1A1A1A'),
        colore_secondario=data.get('colore_secondario', '#85FF00'),
        created_by=data.get('created_by', 'Sistema')
    )

    # Genera link condivisione
    proposal.link_condivisione = str(uuid.uuid4())[:12]
    proposal.link_attivo = True

    # Data scadenza
    if proposal.giorni_validita:
        proposal.data_scadenza = datetime.utcnow() + timedelta(days=proposal.giorni_validita)

    # Se da template, copia contenuti
    if proposal.template_id:
        template = ProposalTemplate.query.get(proposal.template_id)
        if template:
            if not proposal.messaggio_introduttivo:
                proposal.messaggio_introduttivo = template.intestazione
            if not proposal.proposta_valore:
                proposal.proposta_valore = template.proposta_valore
            if not proposal.termini_condizioni:
                proposal.termini_condizioni = template.termini_standard
            if not proposal.colore_primario:
                proposal.colore_primario = template.colore_primario
            if not proposal.colore_secondario:
                proposal.colore_secondario = template.colore_secondario

            # Incrementa utilizzi template
            template.utilizzi = (template.utilizzi or 0) + 1

    # Se da lead, copia dati
    if proposal.lead_id:
        lead = Lead.query.get(proposal.lead_id)
        if lead:
            proposal.destinatario_azienda = proposal.destinatario_azienda or lead.ragione_sociale
            referente_nome = f"{lead.referente_nome or ''} {lead.referente_cognome or ''}".strip()
            proposal.destinatario_nome = proposal.destinatario_nome or referente_nome
            proposal.destinatario_email = proposal.destinatario_email or lead.email
            proposal.destinatario_telefono = proposal.destinatario_telefono or lead.telefono
            proposal.settore_merceologico = proposal.settore_merceologico or lead.settore_merceologico

    db.session.add(proposal)
    db.session.commit()

    # Calcola totali (per sconto)
    proposal.calcola_totali()
    db.session.commit()

    return jsonify(proposal.to_dict(include_items=True)), 201


@proposal_bp.route('/<int:proposal_id>', methods=['GET'])
@jwt_required()
def get_proposal(proposal_id):
    """Dettaglio proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    return jsonify(proposal.to_dict(include_items=True, include_tracking=True))


@proposal_bp.route('/<int:proposal_id>', methods=['PUT'])
@jwt_required()
def update_proposal(proposal_id):
    """Aggiorna proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    data = request.get_json()

    # Crea versione prima di modificare (se richiesto)
    if data.get('create_version', False):
        create_proposal_version(proposal, data.get('note_modifica', ''))

    # Campi aggiornabili
    updatable_fields = [
        'titolo', 'sottotitolo', 'destinatario_azienda', 'destinatario_nome',
        'destinatario_ruolo', 'destinatario_email', 'destinatario_telefono',
        'settore_merceologico', 'messaggio_introduttivo', 'descrizione_opportunita',
        'proposta_valore', 'termini_condizioni', 'note_interne', 'priorita',
        'durata_mesi', 'stagioni', 'giorni_validita', 'modalita_pagamento',
        'numero_rate', 'dettaglio_pagamento', 'sconto_percentuale',
        'colore_primario', 'colore_secondario', 'logo_header', 'sfondo_copertina',
        'assigned_to', 'lead_id', 'sponsor_id', 'link_attivo'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(proposal, field, data[field])

    # Date
    if 'data_inizio_proposta' in data:
        proposal.data_inizio_proposta = datetime.fromisoformat(data['data_inizio_proposta']).date() if data['data_inizio_proposta'] else None
    if 'data_fine_proposta' in data:
        proposal.data_fine_proposta = datetime.fromisoformat(data['data_fine_proposta']).date() if data['data_fine_proposta'] else None

    # Ricalcola scadenza se giorni_validita cambiati
    if 'giorni_validita' in data and proposal.stato == 'bozza':
        proposal.data_scadenza = datetime.utcnow() + timedelta(days=data['giorni_validita'])

    # Ricalcola totali
    proposal.calcola_totali()

    # Assicura che il link sia attivo
    if not proposal.link_attivo:
        proposal.link_attivo = True

    db.session.commit()

    return jsonify(proposal.to_dict(include_items=True))


@proposal_bp.route('/<int:proposal_id>', methods=['DELETE'])
@jwt_required()
def delete_proposal(proposal_id):
    """Elimina proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    if proposal.stato not in ['bozza', 'scaduta', 'rifiutata']:
        return jsonify({'error': 'Non puoi eliminare una proposta in questo stato'}), 400

    db.session.delete(proposal)
    db.session.commit()

    return jsonify({'message': 'Proposta eliminata'})


# =============================================================================
# PROPOSAL ITEMS
# =============================================================================

@proposal_bp.route('/<int:proposal_id>/items', methods=['GET'])
@jwt_required()
def get_proposal_items(proposal_id):
    """Lista items della proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    items = ProposalItem.query.filter_by(proposal_id=proposal_id).order_by(ProposalItem.ordine).all()

    return jsonify([item.to_dict() for item in items])


@proposal_bp.route('/<int:proposal_id>/items', methods=['POST'])
@jwt_required()
def add_proposal_item(proposal_id):
    """Aggiungi item alla proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    data = request.get_json()

    # Determina ordine
    max_ordine = db.session.query(db.func.max(ProposalItem.ordine)).filter_by(proposal_id=proposal_id).scalar() or 0

    item = ProposalItem(
        proposal_id=proposal_id,
        tipo=data.get('tipo', 'custom'),
        asset_id=data.get('asset_id'),
        right_id=data.get('right_id'),
        asset_package_id=data.get('asset_package_id'),
        right_package_id=data.get('right_package_id'),
        nome_custom=data.get('nome_custom'),
        descrizione_custom=data.get('descrizione_custom'),
        categoria_custom=data.get('categoria_custom'),
        nome_display=data.get('nome_display'),
        descrizione_display=data.get('descrizione_display'),
        quantita=data.get('quantita', 1),
        unita_misura=data.get('unita_misura'),
        prezzo_unitario=data.get('prezzo_unitario', 0),
        prezzo_listino=data.get('prezzo_listino'),
        sconto_percentuale=data.get('sconto_percentuale', 0),
        pricing_tier=data.get('pricing_tier'),
        data_inizio=datetime.fromisoformat(data['data_inizio']).date() if data.get('data_inizio') else None,
        data_fine=datetime.fromisoformat(data['data_fine']).date() if data.get('data_fine') else None,
        opzionale=data.get('opzionale', False),
        selezionato=data.get('selezionato', True),
        esclusivo=data.get('esclusivo', False),
        settore_esclusivita=data.get('settore_esclusivita'),
        territorio_esclusivita=data.get('territorio_esclusivita'),
        ordine=data.get('ordine', max_ordine + 1),
        gruppo=data.get('gruppo'),
        note=data.get('note'),
        condizioni_speciali=data.get('condizioni_speciali')
    )

    # Se da asset, copia dati
    if item.asset_id:
        asset = InventoryAsset.query.get(item.asset_id)
        if asset:
            item.nome_display = item.nome_display or asset.nome
            item.descrizione_display = item.descrizione_display or asset.descrizione
            item.prezzo_listino = item.prezzo_listino or asset.prezzo_listino
            item.prezzo_unitario = item.prezzo_unitario or asset.prezzo_listino

    # Se da right, copia dati
    if item.right_id:
        right = Right.query.get(item.right_id)
        if right:
            item.nome_display = item.nome_display or right.nome
            item.descrizione_display = item.descrizione_display or right.descrizione
            item.prezzo_listino = item.prezzo_listino or right.prezzo_listino
            item.prezzo_unitario = item.prezzo_unitario or right.prezzo_listino
            item.esclusivo = item.esclusivo or right.esclusivo

    # Calcola valore
    item.calcola_valore()

    db.session.add(item)
    db.session.commit()

    # Ricalcola totali proposta
    proposal.calcola_totali()
    db.session.commit()

    return jsonify(item.to_dict()), 201


@proposal_bp.route('/<int:proposal_id>/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_proposal_item(proposal_id, item_id):
    """Aggiorna item"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    item = ProposalItem.query.filter_by(id=item_id, proposal_id=proposal_id).first()
    if not item:
        return jsonify({'error': 'Item non trovato'}), 404

    data = request.get_json()

    updatable_fields = [
        'nome_display', 'descrizione_display', 'quantita', 'unita_misura',
        'prezzo_unitario', 'sconto_percentuale', 'pricing_tier', 'opzionale',
        'selezionato', 'esclusivo', 'settore_esclusivita', 'territorio_esclusivita',
        'ordine', 'gruppo', 'note', 'condizioni_speciali'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(item, field, data[field])

    if 'data_inizio' in data:
        item.data_inizio = datetime.fromisoformat(data['data_inizio']).date() if data['data_inizio'] else None
    if 'data_fine' in data:
        item.data_fine = datetime.fromisoformat(data['data_fine']).date() if data['data_fine'] else None

    # Ricalcola valore
    item.calcola_valore()

    db.session.commit()

    # Ricalcola totali proposta
    proposal.calcola_totali()
    db.session.commit()

    return jsonify(item.to_dict())


@proposal_bp.route('/<int:proposal_id>/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_proposal_item(proposal_id, item_id):
    """Elimina item"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    item = ProposalItem.query.filter_by(id=item_id, proposal_id=proposal_id).first()
    if not item:
        return jsonify({'error': 'Item non trovato'}), 404

    db.session.delete(item)
    db.session.commit()

    # Ricalcola totali proposta
    proposal.calcola_totali()
    db.session.commit()

    return jsonify({'message': 'Item eliminato'})


@proposal_bp.route('/<int:proposal_id>/items/reorder', methods=['PUT'])
@jwt_required()
def reorder_proposal_items(proposal_id):
    """Riordina items"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    data = request.get_json()
    items_order = data.get('items', [])  # [{id: 1, ordine: 0}, {id: 2, ordine: 1}, ...]

    for item_data in items_order:
        item = ProposalItem.query.filter_by(id=item_data['id'], proposal_id=proposal_id).first()
        if item:
            item.ordine = item_data['ordine']
            if 'gruppo' in item_data:
                item.gruppo = item_data['gruppo']

    db.session.commit()

    return jsonify({'message': 'Ordine aggiornato'})


# =============================================================================
# PROPOSAL WORKFLOW
# =============================================================================

@proposal_bp.route('/<int:proposal_id>/send', methods=['POST'])
@jwt_required()
def send_proposal(proposal_id):
    """Invia proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    if proposal.stato not in ['bozza']:
        return jsonify({'error': 'La proposta è già stata inviata'}), 400

    if not proposal.items.count():
        return jsonify({'error': 'La proposta non contiene items'}), 400

    data = request.get_json() or {}

    # Attiva link
    proposal.link_attivo = True
    proposal.stato = 'inviata'
    proposal.data_invio = datetime.utcnow()

    # Aggiorna scadenza da data invio
    if proposal.giorni_validita:
        proposal.data_scadenza = datetime.utcnow() + timedelta(days=proposal.giorni_validita)

    # Crea versione
    create_proposal_version(proposal, 'Proposta inviata')

    db.session.commit()

    # TODO: Inviare email con link

    return jsonify({
        'message': 'Proposta inviata',
        'link': f"/p/{proposal.link_condivisione}",
        'proposal': proposal.to_dict()
    })


@proposal_bp.route('/<int:proposal_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_proposal(proposal_id):
    """Duplica proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    original = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not original:
        return jsonify({'error': 'Proposta non trovata'}), 404

    # Genera nuovo codice
    year = datetime.now().year
    count = Proposal.query.filter_by(club_id=club_id).count() + 1
    codice = f"PROP-{year}-{count:04d}"

    # Crea copia
    new_proposal = Proposal(
        club_id=club_id,
        codice=codice,
        titolo=f"{original.titolo} (copia)",
        sottotitolo=original.sottotitolo,
        template_id=original.template_id,
        messaggio_introduttivo=original.messaggio_introduttivo,
        descrizione_opportunita=original.descrizione_opportunita,
        proposta_valore=original.proposta_valore,
        termini_condizioni=original.termini_condizioni,
        durata_mesi=original.durata_mesi,
        stagioni=original.stagioni,
        giorni_validita=original.giorni_validita,
        modalita_pagamento=original.modalita_pagamento,
        numero_rate=original.numero_rate,
        colore_primario=original.colore_primario,
        colore_secondario=original.colore_secondario,
        logo_header=original.logo_header,
        sfondo_copertina=original.sfondo_copertina,
        stato='bozza',
        created_by=request.get_json().get('created_by', 'Sistema')
    )

    new_proposal.link_condivisione = str(uuid.uuid4())[:12]
    new_proposal.data_scadenza = datetime.utcnow() + timedelta(days=new_proposal.giorni_validita or 30)

    db.session.add(new_proposal)
    db.session.flush()

    # Copia items
    for item in original.items:
        new_item = ProposalItem(
            proposal_id=new_proposal.id,
            tipo=item.tipo,
            asset_id=item.asset_id,
            right_id=item.right_id,
            asset_package_id=item.asset_package_id,
            right_package_id=item.right_package_id,
            nome_custom=item.nome_custom,
            descrizione_custom=item.descrizione_custom,
            categoria_custom=item.categoria_custom,
            nome_display=item.nome_display,
            descrizione_display=item.descrizione_display,
            quantita=item.quantita,
            unita_misura=item.unita_misura,
            prezzo_unitario=item.prezzo_unitario,
            prezzo_listino=item.prezzo_listino,
            sconto_percentuale=item.sconto_percentuale,
            sconto_valore=item.sconto_valore,
            valore_totale=item.valore_totale,
            pricing_tier=item.pricing_tier,
            opzionale=item.opzionale,
            selezionato=item.selezionato,
            esclusivo=item.esclusivo,
            settore_esclusivita=item.settore_esclusivita,
            territorio_esclusivita=item.territorio_esclusivita,
            ordine=item.ordine,
            gruppo=item.gruppo,
            note=item.note,
            condizioni_speciali=item.condizioni_speciali
        )
        db.session.add(new_item)

    new_proposal.calcola_totali()
    db.session.commit()

    return jsonify(new_proposal.to_dict(include_items=True)), 201


@proposal_bp.route('/<int:proposal_id>/status', methods=['PUT'])
@jwt_required()
def update_proposal_status(proposal_id):
    """Aggiorna stato proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    data = request.get_json()
    nuovo_stato = data.get('stato')

    stati_validi = ['bozza', 'inviata', 'visualizzata', 'in_trattativa', 'accettata', 'rifiutata', 'scaduta']
    if nuovo_stato not in stati_validi:
        return jsonify({'error': 'Stato non valido'}), 400

    proposal.stato = nuovo_stato

    # Aggiorna date specifiche
    if nuovo_stato == 'accettata':
        proposal.data_accettazione = datetime.utcnow()
        proposal.data_risposta = proposal.data_risposta or datetime.utcnow()
    elif nuovo_stato == 'rifiutata':
        proposal.data_rifiuto = datetime.utcnow()
        proposal.data_risposta = proposal.data_risposta or datetime.utcnow()
        proposal.motivo_rifiuto = data.get('motivo_rifiuto')
        proposal.feedback_cliente = data.get('feedback_cliente')
    elif nuovo_stato == 'in_trattativa':
        proposal.data_risposta = proposal.data_risposta or datetime.utcnow()

    db.session.commit()

    return jsonify(proposal.to_dict())


@proposal_bp.route('/<int:proposal_id>/convert-to-contract', methods=['POST'])
@jwt_required()
def convert_to_contract(proposal_id):
    """Converti proposta in contratto"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import HeadOfTerms, Asset, AssetAllocation, InventoryAsset

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    if proposal.stato != 'accettata':
        return jsonify({'error': 'Solo proposte accettate possono essere convertite'}), 400

    if proposal.convertita_in_contratto:
        return jsonify({'error': 'Proposta già convertita'}), 400

    data = request.get_json() or {}

    # Crea o trova sponsor
    sponsor_id = proposal.sponsor_id
    if not sponsor_id and proposal.lead_id:
        # Converti lead in sponsor - usa i nomi campi CORRETTI del modello Lead
        lead = Lead.query.get(proposal.lead_id)
        if lead:
            new_sponsor = Sponsor(
                club_id=club_id,
                ragione_sociale=lead.ragione_sociale,  # CORRETTO: era lead.azienda
                settore_merceologico=lead.settore_merceologico,
                referente_nome=lead.referente_nome,  # CORRETTO: era lead.contatto_nome
                referente_cognome=lead.referente_cognome,
                referente_ruolo=lead.referente_ruolo,
                referente_contatto=lead.referente_contatto,
                email=lead.email,  # CORRETTO: era lead.contatto_email
                telefono=lead.telefono,  # CORRETTO: era lead.contatto_telefono
                partita_iva=lead.partita_iva,
                codice_fiscale=lead.codice_fiscale,
                indirizzo_sede=lead.indirizzo_sede,
                sito_web=lead.sito_web,
                facebook=lead.facebook,
                instagram=lead.instagram,
                linkedin=lead.linkedin,
                from_lead_id=lead.id,
                data_conversione_lead=datetime.utcnow()
            )
            new_sponsor.set_password('temp123')  # Password temporanea
            db.session.add(new_sponsor)
            db.session.flush()
            sponsor_id = new_sponsor.id

            # Aggiorna lead come convertito
            lead.convertito = True
            lead.sponsor_id = new_sponsor.id
            lead.data_conversione = datetime.utcnow()
            lead.status = 'vinto'

    if not sponsor_id:
        return jsonify({'error': 'Nessun sponsor associato'}), 400

    # Crea contratto - usa i nomi campi CORRETTI del modello HeadOfTerms
    contract = HeadOfTerms(
        club_id=club_id,
        sponsor_id=sponsor_id,
        nome_contratto=proposal.titolo or f"Contratto da proposta {proposal.codice}",  # CORRETTO: era titolo
        compenso=proposal.valore_finale or 0,  # CORRETTO: era valore_totale
        descrizione=data.get('descrizione', f"Generato da proposta {proposal.codice}"),
        data_inizio=proposal.data_inizio_proposta or datetime.utcnow(),
        data_fine=proposal.data_fine_proposta or datetime.utcnow(),
        status='attivo'  # CORRETTO: era stato
    )

    db.session.add(contract)
    db.session.flush()

    # Crea asset dal contratto per ogni item - usa i nomi campi CORRETTI
    for item in proposal.items:
        if item.selezionato:
            # Crea Asset legacy per il contratto
            asset = Asset(
                head_of_terms_id=contract.id,
                categoria=item.tipo or item.gruppo or 'Altro',  # CORRETTO: era tipologia
                nome=item.nome_display,
                descrizione=item.descrizione_display,
                valore=item.valore_totale,
                quantita_totale=item.quantita or 1,  # CORRETTO: era quantita
                quantita_utilizzata=0,
                status='da_consegnare'
            )
            db.session.add(asset)

            # Se l'item è collegato a un InventoryAsset, crea anche l'allocazione
            if item.asset_id:
                inventory_asset = InventoryAsset.query.get(item.asset_id)
                if inventory_asset:
                    allocation = AssetAllocation(
                        asset_id=item.asset_id,
                        club_id=club_id,
                        contract_id=contract.id,
                        sponsor_id=sponsor_id,
                        data_inizio=contract.data_inizio.date() if hasattr(contract.data_inizio, 'date') else contract.data_inizio,
                        data_fine=contract.data_fine.date() if hasattr(contract.data_fine, 'date') else contract.data_fine,
                        quantita=item.quantita or 1,
                        prezzo_concordato=item.valore_totale,
                        status='attiva'
                    )
                    db.session.add(allocation)

                    # Aggiorna disponibilità dell'inventory asset
                    if inventory_asset.quantita_disponibile:
                        inventory_asset.quantita_disponibile = max(0, inventory_asset.quantita_disponibile - (item.quantita or 1))

    # Aggiorna proposta
    proposal.convertita_in_contratto = True
    proposal.contratto_id = contract.id

    db.session.commit()

    return jsonify({
        'message': 'Proposta convertita in contratto',
        'contratto_id': contract.id,
        'sponsor_id': sponsor_id,
        'proposal': proposal.to_dict()
    })


# =============================================================================
# VERSIONS
# =============================================================================

@proposal_bp.route('/<int:proposal_id>/versions', methods=['GET'])
@jwt_required()
def get_proposal_versions(proposal_id):
    """Lista versioni proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    versions = ProposalVersion.query.filter_by(proposal_id=proposal_id).order_by(ProposalVersion.versione.desc()).all()

    return jsonify([v.to_dict() for v in versions])


def create_proposal_version(proposal, note=''):
    """Helper per creare versione"""
    version = ProposalVersion(
        proposal_id=proposal.id,
        versione=proposal.versione_corrente,
        titolo=proposal.titolo,
        contenuto_json=json.dumps(proposal.to_dict()),
        items_json=json.dumps([i.to_dict() for i in proposal.items]),
        valore_totale=proposal.valore_totale,
        valore_finale=proposal.valore_finale,
        note_modifica=note,
        created_by=proposal.created_by
    )

    db.session.add(version)
    proposal.versione_corrente += 1

    return version


# =============================================================================
# TRACKING (Public)
# =============================================================================

@proposal_bp.route('/public/<link>', methods=['GET'])
def get_public_proposal(link):
    """Visualizza proposta pubblica"""
    proposal = Proposal.query.filter_by(link_condivisione=link).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    if not proposal.link_attivo:
        return jsonify({'error': 'Link non attivo'}), 403

    if proposal.data_scadenza and proposal.data_scadenza < datetime.utcnow():
        proposal.stato = 'scaduta'
        db.session.commit()
        return jsonify({'error': 'Proposta scaduta'}), 410

    # Registra visualizzazione
    proposal.visualizzazioni = (proposal.visualizzazioni or 0) + 1
    proposal.ultima_visualizzazione = datetime.utcnow()

    if not proposal.data_prima_visualizzazione:
        proposal.data_prima_visualizzazione = datetime.utcnow()
        if proposal.stato == 'inviata':
            proposal.stato = 'visualizzata'

    # Tracking
    tracking = ProposalTracking(
        proposal_id=proposal.id,
        evento='view',
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', '')[:500],
        referrer=request.headers.get('Referer', '')[:500]
    )
    db.session.add(tracking)
    db.session.commit()

    # Ritorna proposta senza note interne
    result = proposal.to_dict(include_items=True)
    result.pop('note_interne', None)

    # Aggiungi info club con brand settings
    if proposal.club:
        result['club'] = {
            'nome': proposal.club.nome,
            'logo_url': proposal.club.logo_url,
            'brand': {
                'colore_primario': proposal.club.brand_colore_primario or '#1A1A1A',
                'colore_secondario': proposal.club.brand_colore_secondario or '#85FF00',
                'colore_accento': proposal.club.brand_colore_accento or '#3B82F6',
                'font': proposal.club.brand_font or 'Inter',
                'stile_proposta': proposal.club.brand_stile_proposta or 'modern',
                'logo_chiaro': proposal.club.brand_logo_chiaro,
                'sfondo_header': proposal.club.brand_sfondo_header,
                'footer_text': proposal.club.brand_footer_text
            }
        }

    return jsonify(result)


@proposal_bp.route('/public/<link>/track', methods=['POST'])
def track_proposal_event(link):
    """Traccia evento su proposta pubblica"""
    proposal = Proposal.query.filter_by(link_condivisione=link).first()
    if not proposal or not proposal.link_attivo:
        return jsonify({'error': 'Proposta non trovata'}), 404

    data = request.get_json()

    tracking = ProposalTracking(
        proposal_id=proposal.id,
        evento=data.get('evento', 'interaction'),
        sezione=data.get('sezione'),
        dettaglio=json.dumps(data.get('dettaglio')) if data.get('dettaglio') else None,
        durata_secondi=data.get('durata_secondi'),
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', '')[:500]
    )

    db.session.add(tracking)

    # Aggiorna tempo totale se time_spent
    if data.get('durata_secondi'):
        proposal.tempo_visualizzazione_totale = (proposal.tempo_visualizzazione_totale or 0) + data['durata_secondi']

    # Incrementa download se evento download
    if data.get('evento') == 'download':
        proposal.download_pdf = (proposal.download_pdf or 0) + 1

    db.session.commit()

    return jsonify({'message': 'Evento registrato'})


# =============================================================================
# TEMPLATES
# =============================================================================

@proposal_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_templates():
    """Lista template"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    templates = ProposalTemplate.query.filter_by(club_id=club_id, attivo=True).all()
    return jsonify([t.to_dict() for t in templates])


@proposal_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_template():
    """Crea template"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Genera codice
    count = ProposalTemplate.query.filter_by(club_id=club_id).count() + 1
    codice = f"TMPL-{count:03d}"

    template = ProposalTemplate(
        club_id=club_id,
        codice=codice,
        nome=data.get('nome', 'Nuovo Template'),
        descrizione=data.get('descrizione'),
        tipologia=data.get('tipologia'),
        target_settore=data.get('target_settore'),
        intestazione=data.get('intestazione'),
        descrizione_club=data.get('descrizione_club'),
        proposta_valore=data.get('proposta_valore'),
        termini_standard=data.get('termini_standard'),
        note_legali=data.get('note_legali'),
        footer=data.get('footer'),
        colore_primario=data.get('colore_primario', '#1A1A1A'),
        colore_secondario=data.get('colore_secondario', '#85FF00'),
        logo_header=data.get('logo_header'),
        sfondo_copertina=data.get('sfondo_copertina'),
        sezioni_default=json.dumps(data.get('sezioni_default', [])),
        items_default=json.dumps(data.get('items_default', [])),
        valore_minimo=data.get('valore_minimo'),
        valore_massimo=data.get('valore_massimo'),
        durata_default=data.get('durata_default'),
        created_by=data.get('created_by', 'Sistema')
    )

    db.session.add(template)
    db.session.commit()

    return jsonify(template.to_dict()), 201


@proposal_bp.route('/templates/<int:template_id>', methods=['GET'])
@jwt_required()
def get_template(template_id):
    """Dettaglio template"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = ProposalTemplate.query.filter_by(id=template_id, club_id=club_id).first()
    if not template:
        return jsonify({'error': 'Template non trovato'}), 404

    return jsonify(template.to_dict(include_items=True))


@proposal_bp.route('/templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_template(template_id):
    """Aggiorna template"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = ProposalTemplate.query.filter_by(id=template_id, club_id=club_id).first()
    if not template:
        return jsonify({'error': 'Template non trovato'}), 404

    data = request.get_json()

    updatable_fields = [
        'nome', 'descrizione', 'tipologia', 'target_settore', 'intestazione',
        'descrizione_club', 'proposta_valore', 'termini_standard', 'note_legali',
        'footer', 'colore_primario', 'colore_secondario', 'logo_header',
        'sfondo_copertina', 'valore_minimo', 'valore_massimo', 'durata_default',
        'attivo', 'uso_interno'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(template, field, data[field])

    if 'sezioni_default' in data:
        template.sezioni_default = json.dumps(data['sezioni_default'])
    if 'items_default' in data:
        template.items_default = json.dumps(data['items_default'])

    db.session.commit()

    return jsonify(template.to_dict())


@proposal_bp.route('/templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    """Elimina template"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = ProposalTemplate.query.filter_by(id=template_id, club_id=club_id).first()
    if not template:
        return jsonify({'error': 'Template non trovato'}), 404

    # Soft delete
    template.attivo = False
    db.session.commit()

    return jsonify({'message': 'Template eliminato'})


# =============================================================================
# COMMENTS
# =============================================================================

@proposal_bp.route('/<int:proposal_id>/comments', methods=['GET'])
@jwt_required()
def get_proposal_comments(proposal_id):
    """Lista commenti"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    comments = ProposalComment.query.filter_by(proposal_id=proposal_id, parent_id=None).order_by(ProposalComment.created_at.desc()).all()

    return jsonify([c.to_dict(include_replies=True) for c in comments])


@proposal_bp.route('/<int:proposal_id>/comments', methods=['POST'])
@jwt_required()
def add_proposal_comment(proposal_id):
    """Aggiungi commento"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    proposal = Proposal.query.filter_by(id=proposal_id, club_id=club_id).first()
    if not proposal:
        return jsonify({'error': 'Proposta non trovata'}), 404

    data = request.get_json()

    comment = ProposalComment(
        proposal_id=proposal_id,
        parent_id=data.get('parent_id'),
        autore_tipo='club',
        autore_nome=data.get('autore_nome', 'Club'),
        contenuto=data.get('contenuto'),
        tipo=data.get('tipo', 'nota'),
        menzioni=json.dumps(data.get('menzioni', []))
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict()), 201


# =============================================================================
# AVAILABLE ITEMS (Asset dall'inventario per il builder)
# =============================================================================

@proposal_bp.route('/available-items', methods=['GET'])
@jwt_required()
def get_available_items():
    """Lista asset disponibili per le proposte dall'inventario"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Fetch all active inventory assets with their categories
    assets = InventoryAsset.query.filter_by(club_id=club_id, attivo=True).all()

    # Fetch all active categories
    categories = InventoryCategory.query.filter_by(club_id=club_id, attiva=True).all()

    return jsonify({
        'assets': [a.to_dict() for a in assets],
        'categories': [c.to_dict() for c in categories]
    })
