from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import AdminContract, AdminInvoice, Club
from datetime import datetime, date
from sqlalchemy import func

admin_contract_bp = Blueprint('admin_contract', __name__)

# ========================================
# PLAN PRICING CONFIGURATION
# ========================================
PLAN_PRICES = {
    'basic': 10000,      # €10,000/anno
    'kickoff': 10000,    # Alias per basic
    'premium': 15000,    # €15,000/anno
    'elite': 25000       # €25,000/anno
}

ADDON_PRICES = {
    'setup': 2500,           # Setup & Onboarding
    'training': 2000,        # Training Avanzato
    'custom': 5000,          # Sviluppo Custom
    'support_premium': 3000, # Supporto Premium
    'integration': 4000      # Integrazioni API
}


def verify_admin():
    """Helper function to verify admin role"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


# ========================================
# CONTRACT CRUD OPERATIONS
# ========================================

@admin_contract_bp.route('/contracts', methods=['GET'])
@jwt_required()
def get_contracts():
    """Lista tutti i contratti"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri opzionali
    status = request.args.get('status')
    club_id = request.args.get('club_id')
    plan_type = request.args.get('plan_type')

    query = AdminContract.query

    if status:
        query = query.filter(AdminContract.status == status)
    if club_id:
        query = query.filter(AdminContract.club_id == club_id)
    if plan_type:
        query = query.filter(AdminContract.plan_type == plan_type)

    contracts = query.order_by(AdminContract.created_at.desc()).all()

    return jsonify({
        'contracts': [c.to_dict() for c in contracts],
        'total': len(contracts)
    })


@admin_contract_bp.route('/contracts/<int:contract_id>', methods=['GET'])
@jwt_required()
def get_contract(contract_id):
    """Dettaglio singolo contratto"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = AdminContract.query.get_or_404(contract_id)

    # Include anche le fatture associate
    invoices = AdminInvoice.query.filter_by(contract_id=contract_id).order_by(AdminInvoice.issue_date.desc()).all()

    result = contract.to_dict()
    result['invoices'] = [inv.to_dict() for inv in invoices]

    return jsonify(result)


@admin_contract_bp.route('/contracts', methods=['POST'])
@jwt_required()
def create_contract():
    """Crea un nuovo contratto"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione campi obbligatori
    required_fields = ['club_id', 'plan_type', 'start_date', 'end_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo obbligatorio mancante: {field}'}), 400

    # Verifica che il club esista
    club = Club.query.get(data['club_id'])
    if not club:
        return jsonify({'error': 'Club non trovato'}), 404

    # Calcola prezzi
    plan_type = data['plan_type'].lower()
    plan_price = data.get('plan_price', PLAN_PRICES.get(plan_type, 10000))

    addons = data.get('addons', [])
    addon_total = sum(addon.get('price', 0) for addon in addons)

    total_value = plan_price + addon_total

    # Crea contratto
    contract = AdminContract(
        club_id=data['club_id'],
        plan_type=plan_type,
        plan_price=plan_price,
        addons=addons,
        total_value=total_value,
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
        renewal_date=datetime.strptime(data['renewal_date'], '%Y-%m-%d').date() if data.get('renewal_date') else None,
        status=data.get('status', 'active'),
        payment_terms=data.get('payment_terms', 'annual'),
        payment_method=data.get('payment_method'),
        notes=data.get('notes'),
        contract_document_url=data.get('contract_document_url'),
        signed_by=data.get('signed_by'),
        signed_date=datetime.strptime(data['signed_date'], '%Y-%m-%d').date() if data.get('signed_date') else None,
        created_by=get_jwt_identity()
    )

    db.session.add(contract)

    # Aggiorna anche il piano del club
    club.nome_abbonamento = plan_type.capitalize()
    club.costo_abbonamento = plan_price

    db.session.commit()

    return jsonify({
        'message': 'Contratto creato con successo',
        'contract': contract.to_dict()
    }), 201


@admin_contract_bp.route('/contracts/<int:contract_id>', methods=['PUT'])
@jwt_required()
def update_contract(contract_id):
    """Aggiorna un contratto esistente"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = AdminContract.query.get_or_404(contract_id)
    data = request.get_json()

    # Aggiorna campi
    if 'plan_type' in data:
        contract.plan_type = data['plan_type'].lower()
    if 'plan_price' in data:
        contract.plan_price = data['plan_price']
    if 'addons' in data:
        contract.addons = data['addons']
    if 'start_date' in data:
        contract.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    if 'end_date' in data:
        contract.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    if 'renewal_date' in data:
        contract.renewal_date = datetime.strptime(data['renewal_date'], '%Y-%m-%d').date() if data['renewal_date'] else None
    if 'status' in data:
        contract.status = data['status']
    if 'payment_terms' in data:
        contract.payment_terms = data['payment_terms']
    if 'payment_method' in data:
        contract.payment_method = data['payment_method']
    if 'notes' in data:
        contract.notes = data['notes']
    if 'contract_document_url' in data:
        contract.contract_document_url = data['contract_document_url']
    if 'signed_by' in data:
        contract.signed_by = data['signed_by']
    if 'signed_date' in data:
        contract.signed_date = datetime.strptime(data['signed_date'], '%Y-%m-%d').date() if data['signed_date'] else None

    # Ricalcola valore totale
    addon_total = sum(addon.get('price', 0) for addon in (contract.addons or []))
    contract.total_value = contract.plan_price + addon_total

    db.session.commit()

    return jsonify({
        'message': 'Contratto aggiornato con successo',
        'contract': contract.to_dict()
    })


@admin_contract_bp.route('/contracts/<int:contract_id>', methods=['DELETE'])
@jwt_required()
def delete_contract(contract_id):
    """Elimina un contratto"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = AdminContract.query.get_or_404(contract_id)

    # Verifica che non ci siano fatture pagate
    paid_invoices = AdminInvoice.query.filter_by(contract_id=contract_id, status='paid').count()
    if paid_invoices > 0:
        return jsonify({'error': 'Impossibile eliminare un contratto con fatture pagate'}), 400

    # Elimina fatture associate non pagate
    AdminInvoice.query.filter_by(contract_id=contract_id).delete()

    db.session.delete(contract)
    db.session.commit()

    return jsonify({'message': 'Contratto eliminato con successo'})


# ========================================
# CONTRACT STATISTICS
# ========================================

@admin_contract_bp.route('/contracts/stats', methods=['GET'])
@jwt_required()
def get_contract_stats():
    """Statistiche aggregate sui contratti"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    year = request.args.get('year', datetime.now().year, type=int)

    # Contratti attivi
    active_contracts = AdminContract.query.filter(
        AdminContract.status == 'active'
    ).all()

    # ARR totale
    total_arr = sum(c.total_value for c in active_contracts)

    # ARR per piano
    arr_by_plan = {}
    contracts_by_plan = {}
    for contract in active_contracts:
        plan = contract.plan_type
        arr_by_plan[plan] = arr_by_plan.get(plan, 0) + contract.total_value
        contracts_by_plan[plan] = contracts_by_plan.get(plan, 0) + 1

    # Contratti in scadenza nei prossimi 90 giorni
    today = date.today()
    expiring_soon = AdminContract.query.filter(
        AdminContract.status == 'active',
        AdminContract.end_date <= date(today.year, today.month + 3 if today.month <= 9 else 1, today.day)
    ).count()

    # Nuovi contratti questo mese
    start_of_month = date(today.year, today.month, 1)
    new_this_month = AdminContract.query.filter(
        AdminContract.created_at >= start_of_month
    ).count()

    # MRR (Monthly Recurring Revenue)
    mrr = total_arr / 12

    return jsonify({
        'total_arr': total_arr,
        'mrr': mrr,
        'active_contracts': len(active_contracts),
        'arr_by_plan': arr_by_plan,
        'contracts_by_plan': contracts_by_plan,
        'expiring_soon': expiring_soon,
        'new_this_month': new_this_month,
        'avg_contract_value': total_arr / len(active_contracts) if active_contracts else 0
    })


# ========================================
# PRICING CONFIGURATION
# ========================================

@admin_contract_bp.route('/contracts/pricing', methods=['GET'])
@jwt_required()
def get_pricing():
    """Restituisce la configurazione dei prezzi"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    return jsonify({
        'plans': PLAN_PRICES,
        'addons': ADDON_PRICES
    })


# ========================================
# CLUBS WITHOUT CONTRACT
# ========================================

@admin_contract_bp.route('/contracts/clubs-without-contract', methods=['GET'])
@jwt_required()
def get_clubs_without_contract():
    """Lista club senza contratto attivo"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Trova tutti i club
    all_clubs = Club.query.filter(Club.account_attivo == True).all()

    # Trova club con contratto attivo
    clubs_with_contract = db.session.query(AdminContract.club_id).filter(
        AdminContract.status == 'active'
    ).distinct().all()
    clubs_with_contract_ids = [c[0] for c in clubs_with_contract]

    # Filtra club senza contratto
    clubs_without = [c for c in all_clubs if c.id not in clubs_with_contract_ids]

    return jsonify({
        'clubs': [{'id': c.id, 'nome': c.nome, 'nome_abbonamento': c.nome_abbonamento} for c in clubs_without],
        'total': len(clubs_without)
    })
