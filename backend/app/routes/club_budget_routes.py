from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    Budget, BudgetCategory, Expense, Payment, FinancialDocument, BudgetAlert,
    HeadOfTerms, Club, Sponsor, Project, Activation, Event, Notification
)
from datetime import datetime, date
from sqlalchemy import extract, func

club_budget_bp = Blueprint('club_budget', __name__)


def verify_club():
    """Verifica che l'utente sia un club"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    club_id = int(get_jwt_identity())
    return club_id


# ============================================================================
# BUDGET ENDPOINTS
# ============================================================================

@club_budget_bp.route('/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    """Lista tutti i budget del club con filtri"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri
    anno = request.args.get('anno_fiscale', type=int)
    contract_id = request.args.get('contract_id', type=int)

    query = Budget.query.filter_by(owner_type='club', owner_id=club_id)

    if anno:
        query = query.filter_by(anno_fiscale=anno)
    if contract_id:
        query = query.filter_by(contract_id=contract_id)

    budgets = query.all()

    budgets_data = []
    for budget in budgets:
        contract = HeadOfTerms.query.get(budget.contract_id)
        sponsor = Sponsor.query.get(contract.sponsor_id) if contract else None

        budgets_data.append({
            'id': budget.id,
            'contract_id': budget.contract_id,
            'contract_name': contract.nome_contratto if contract else None,
            'sponsor': {
                'id': sponsor.id,
                'ragione_sociale': sponsor.ragione_sociale
            } if sponsor else None,
            'anno_fiscale': budget.anno_fiscale,
            'importo_totale': float(budget.importo_totale),
            'importo_speso': float(budget.importo_speso),
            'importo_rimanente': float(budget.calculate_remaining()),
            'percentuale_utilizzo': budget.get_percentage_used(),
            'valuta': budget.valuta,
            'created_at': budget.created_at.isoformat(),
            'updated_at': budget.updated_at.isoformat()
        })

    return jsonify({'budgets': budgets_data}), 200


@club_budget_bp.route('/budgets/<int:budget_id>', methods=['GET'])
@jwt_required()
def get_budget(budget_id):
    """Dettaglio budget singolo"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({'error': 'Budget non trovato'}), 404

    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = HeadOfTerms.query.get(budget.contract_id)
    sponsor = Sponsor.query.get(contract.sponsor_id) if contract else None

    # Statistiche categorie
    categories = budget.categories.all()
    categories_data = [{
        'id': cat.id,
        'nome': cat.nome,
        'descrizione': cat.descrizione,
        'importo_allocato': float(cat.importo_allocato),
        'importo_speso': float(cat.importo_speso),
        'percentuale_utilizzo': cat.get_percentage_used()
    } for cat in categories]

    # Conteggio spese e pagamenti
    total_expenses = budget.expenses.count()
    pending_expenses = budget.expenses.filter_by(stato='in_sospeso').count()
    total_payments = budget.payments.count()
    pending_payments = budget.payments.filter_by(stato='pianificato').count()

    return jsonify({
        'budget': {
            'id': budget.id,
            'contract': {
                'id': contract.id,
                'nome_contratto': contract.nome_contratto
            } if contract else None,
            'sponsor': {
                'id': sponsor.id,
                'ragione_sociale': sponsor.ragione_sociale
            } if sponsor else None,
            'anno_fiscale': budget.anno_fiscale,
            'importo_totale': float(budget.importo_totale),
            'importo_speso': float(budget.importo_speso),
            'importo_rimanente': float(budget.calculate_remaining()),
            'percentuale_utilizzo': budget.get_percentage_used(),
            'valuta': budget.valuta,
            'note': budget.note,
            'categories': categories_data,
            'stats': {
                'total_expenses': total_expenses,
                'pending_expenses': pending_expenses,
                'total_payments': total_payments,
                'pending_payments': pending_payments
            },
            'created_at': budget.created_at.isoformat(),
            'updated_at': budget.updated_at.isoformat()
        }
    }), 200


@club_budget_bp.route('/budgets', methods=['POST'])
@jwt_required()
def create_budget():
    """Crea nuovo budget"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Validazione
    required_fields = ['contract_id', 'anno_fiscale', 'importo_totale']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    # Verifica contratto
    contract = HeadOfTerms.query.get(data['contract_id'])
    if not contract or contract.club_id != club_id:
        return jsonify({'error': 'Contratto non trovato'}), 404

    # Verifica se esiste già budget per stesso anno
    existing = Budget.query.filter_by(
        contract_id=data['contract_id'],
        owner_type='club',
        owner_id=club_id,
        anno_fiscale=data['anno_fiscale']
    ).first()

    if existing:
        return jsonify({'error': 'Budget già esistente per questo anno'}), 400

    # Crea budget
    budget = Budget(
        contract_id=data['contract_id'],
        owner_type='club',
        owner_id=club_id,
        anno_fiscale=data['anno_fiscale'],
        importo_totale=float(data['importo_totale']),
        importo_speso=0.0,
        valuta=data.get('valuta', 'EUR'),
        note=data.get('note', '')
    )
    budget.calculate_remaining()

    db.session.add(budget)
    db.session.commit()

    # Crea alert automatici (75%, 90%, 100%)
    for soglia in [75, 90, 100]:
        alert = BudgetAlert(
            budget_id=budget.id,
            tipo='soglia_superata',
            soglia_percentuale=soglia,
            attivo=True
        )
        db.session.add(alert)

    db.session.commit()

    return jsonify({
        'message': 'Budget creato con successo',
        'budget': {
            'id': budget.id,
            'contract_id': budget.contract_id,
            'anno_fiscale': budget.anno_fiscale,
            'importo_totale': float(budget.importo_totale)
        }
    }), 201


@club_budget_bp.route('/budgets/<int:budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    """Aggiorna budget"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({'error': 'Budget non trovato'}), 404

    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    if 'importo_totale' in data:
        budget.importo_totale = data['importo_totale']
        budget.calculate_remaining()
    if 'valuta' in data:
        budget.valuta = data['valuta']
    if 'note' in data:
        budget.note = data['note']

    db.session.commit()

    return jsonify({'message': 'Budget aggiornato con successo'}), 200


@club_budget_bp.route('/budgets/<int:budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    """Elimina budget"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({'error': 'Budget non trovato'}), 404

    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(budget)
    db.session.commit()

    return jsonify({'message': 'Budget eliminato con successo'}), 200


# ============================================================================
# BUDGET CATEGORIES ENDPOINTS
# ============================================================================

@club_budget_bp.route('/budgets/<int:budget_id>/categories', methods=['GET'])
@jwt_required()
def get_categories(budget_id):
    """Lista categorie budget"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    categories = budget.categories.all()

    categories_data = [{
        'id': cat.id,
        'nome': cat.nome,
        'descrizione': cat.descrizione,
        'importo_allocato': float(cat.importo_allocato),
        'importo_speso': float(cat.importo_speso),
        'percentuale_utilizzo': cat.get_percentage_used(),
        'created_at': cat.created_at.isoformat()
    } for cat in categories]

    return jsonify({'categories': categories_data}), 200


@club_budget_bp.route('/budgets/<int:budget_id>/categories', methods=['POST'])
@jwt_required()
def create_category(budget_id):
    """Crea nuova categoria"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    data = request.json

    required_fields = ['nome', 'importo_allocato']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    category = BudgetCategory(
        budget_id=budget_id,
        nome=data['nome'],
        descrizione=data.get('descrizione', ''),
        importo_allocato=data['importo_allocato']
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        'message': 'Categoria creata con successo',
        'category': {
            'id': category.id,
            'nome': category.nome,
            'importo_allocato': float(category.importo_allocato)
        }
    }), 201


@club_budget_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Modifica categoria"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    category = BudgetCategory.query.get(category_id)
    if not category:
        return jsonify({'error': 'Categoria non trovata'}), 404

    budget = category.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    if 'nome' in data:
        category.nome = data['nome']
    if 'descrizione' in data:
        category.descrizione = data['descrizione']
    if 'importo_allocato' in data:
        category.importo_allocato = data['importo_allocato']

    db.session.commit()

    return jsonify({'message': 'Categoria aggiornata con successo'}), 200


@club_budget_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Elimina categoria"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    category = BudgetCategory.query.get(category_id)
    if not category:
        return jsonify({'error': 'Categoria non trovata'}), 404

    budget = category.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(category)
    db.session.commit()

    return jsonify({'message': 'Categoria eliminata con successo'}), 200


# ============================================================================
# EXPENSES ENDPOINTS
# ============================================================================

@club_budget_bp.route('/budgets/<int:budget_id>/expenses', methods=['GET'])
@jwt_required()
def get_expenses(budget_id):
    """Lista spese budget"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    # Filtri
    category_id = request.args.get('category_id', type=int)
    stato = request.args.get('stato')

    query = budget.expenses

    if category_id:
        query = query.filter_by(category_id=category_id)
    if stato:
        query = query.filter_by(stato=stato)

    expenses = query.order_by(Expense.data_spesa.desc()).all()

    expenses_data = []
    for expense in expenses:
        category = BudgetCategory.query.get(expense.category_id) if expense.category_id else None

        expenses_data.append({
            'id': expense.id,
            'descrizione': expense.descrizione,
            'importo': float(expense.importo),
            'data_spesa': expense.data_spesa.isoformat(),
            'tipo_spesa': expense.tipo_spesa,
            'stato': expense.stato,
            'category': {
                'id': category.id,
                'nome': category.nome
            } if category else None,
            'project_id': expense.project_id,
            'activation_id': expense.activation_id,
            'event_id': expense.event_id,
            'fattura_url': expense.fattura_url,
            'ricevuta_url': expense.ricevuta_url,
            'note': expense.note,
            'created_at': expense.created_at.isoformat()
        })

    return jsonify({'expenses': expenses_data}), 200


@club_budget_bp.route('/budgets/<int:budget_id>/expenses', methods=['POST'])
@jwt_required()
def create_expense(budget_id):
    """Registra nuova spesa"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    data = request.json

    required_fields = ['descrizione', 'importo', 'data_spesa']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    expense = Expense(
        budget_id=budget_id,
        category_id=data.get('category_id'),
        project_id=data.get('project_id'),
        activation_id=data.get('activation_id'),
        event_id=data.get('event_id'),
        descrizione=data['descrizione'],
        importo=data['importo'],
        data_spesa=datetime.fromisoformat(data['data_spesa']).date(),
        tipo_spesa=data.get('tipo_spesa', 'effettivo'),
        stato=data.get('stato', 'in_sospeso'),
        fattura_url=data.get('fattura_url'),
        ricevuta_url=data.get('ricevuta_url'),
        creato_da_type='club',
        creato_da_id=club_id,
        note=data.get('note', '')
    )

    db.session.add(expense)
    db.session.commit()

    # Se già approvata, aggiorna budget
    if expense.stato == 'pagato':
        expense.mark_paid()

    return jsonify({
        'message': 'Spesa registrata con successo',
        'expense': {
            'id': expense.id,
            'descrizione': expense.descrizione,
            'importo': float(expense.importo),
            'stato': expense.stato
        }
    }), 201


@club_budget_bp.route('/expenses/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Modifica spesa"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({'error': 'Spesa non trovata'}), 404

    budget = expense.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    if 'descrizione' in data:
        expense.descrizione = data['descrizione']
    if 'importo' in data:
        expense.importo = data['importo']
    if 'data_spesa' in data:
        expense.data_spesa = datetime.fromisoformat(data['data_spesa']).date()
    if 'tipo_spesa' in data:
        expense.tipo_spesa = data['tipo_spesa']
    if 'category_id' in data:
        expense.category_id = data['category_id']
    if 'note' in data:
        expense.note = data['note']
    if 'fattura_url' in data:
        expense.fattura_url = data['fattura_url']
    if 'ricevuta_url' in data:
        expense.ricevuta_url = data['ricevuta_url']

    db.session.commit()

    return jsonify({'message': 'Spesa aggiornata con successo'}), 200


@club_budget_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Elimina spesa"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({'error': 'Spesa non trovata'}), 404

    budget = expense.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(expense)
    db.session.commit()

    # Ricalcola budget
    budget.update_spent_amount()

    return jsonify({'message': 'Spesa eliminata con successo'}), 200


@club_budget_bp.route('/expenses/<int:expense_id>/approve', methods=['POST'])
@jwt_required()
def approve_expense(expense_id):
    """Approva spesa proposta"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({'error': 'Spesa non trovata'}), 404

    budget = expense.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    expense.approve('club', club_id)

    # Notifica sponsor
    contract = budget.contract
    Notification.create_notification(
        user_type='sponsor',
        user_id=contract.sponsor_id,
        tipo='spesa_approvata',
        titolo='Spesa approvata',
        messaggio=f'La spesa "{expense.descrizione}" è stata approvata.',
        link_url=f'/sponsor/budgets/{budget.id}'
    )

    return jsonify({'message': 'Spesa approvata con successo'}), 200


@club_budget_bp.route('/expenses/<int:expense_id>/mark-paid', methods=['POST'])
@jwt_required()
def mark_expense_paid(expense_id):
    """Segna spesa come pagata"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({'error': 'Spesa non trovata'}), 404

    budget = expense.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    expense.mark_paid()

    # Check alert budget
    for alert in budget.alerts.filter_by(attivo=True):
        alert.check_and_notify()

    return jsonify({'message': 'Spesa segnata come pagata'}), 200


# ============================================================================
# PAYMENTS ENDPOINTS
# ============================================================================

@club_budget_bp.route('/budgets/<int:budget_id>/payments', methods=['GET'])
@jwt_required()
def get_payments(budget_id):
    """Lista pagamenti budget"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    stato = request.args.get('stato')

    query = budget.payments

    if stato:
        query = query.filter_by(stato=stato)

    payments = query.order_by(Payment.data_prevista.asc()).all()

    payments_data = []
    for payment in payments:
        # Check se in ritardo
        payment.check_if_late()

        payments_data.append({
            'id': payment.id,
            'tipo': payment.tipo,
            'importo': float(payment.importo),
            'data_prevista': payment.data_prevista.isoformat(),
            'data_effettiva': payment.data_effettiva.isoformat() if payment.data_effettiva else None,
            'stato': payment.stato,
            'metodo_pagamento': payment.metodo_pagamento,
            'ricevuta_url': payment.ricevuta_url,
            'note': payment.note,
            'created_at': payment.created_at.isoformat()
        })

    return jsonify({'payments': payments_data}), 200


@club_budget_bp.route('/budgets/<int:budget_id>/payments', methods=['POST'])
@jwt_required()
def create_payment(budget_id):
    """Pianifica nuovo pagamento"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    data = request.json

    required_fields = ['tipo', 'importo', 'data_prevista']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    contract = budget.contract

    payment = Payment(
        budget_id=budget_id,
        contract_id=budget.contract_id,
        tipo=data['tipo'],
        importo=data['importo'],
        data_prevista=datetime.fromisoformat(data['data_prevista']).date(),
        stato='pianificato',
        metodo_pagamento=data.get('metodo_pagamento'),
        ricevuto_da_type='club',
        ricevuto_da_id=club_id,
        inviato_da_type='sponsor',
        inviato_da_id=contract.sponsor_id,
        note=data.get('note', '')
    )

    db.session.add(payment)
    db.session.commit()

    # Notifica sponsor
    Notification.create_notification(
        user_type='sponsor',
        user_id=contract.sponsor_id,
        tipo='pagamento_pianificato',
        titolo='Nuovo pagamento pianificato',
        messaggio=f'Pagamento di €{payment.importo} previsto per {payment.data_prevista.strftime("%d/%m/%Y")}',
        link_url=f'/sponsor/budgets/{budget.id}'
    )

    return jsonify({
        'message': 'Pagamento pianificato con successo',
        'payment': {
            'id': payment.id,
            'tipo': payment.tipo,
            'importo': float(payment.importo),
            'data_prevista': payment.data_prevista.isoformat()
        }
    }), 201


@club_budget_bp.route('/payments/<int:payment_id>', methods=['PUT'])
@jwt_required()
def update_payment(payment_id):
    """Modifica pagamento"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Pagamento non trovato'}), 404

    budget = payment.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    if 'tipo' in data:
        payment.tipo = data['tipo']
    if 'importo' in data:
        payment.importo = data['importo']
    if 'data_prevista' in data:
        payment.data_prevista = datetime.fromisoformat(data['data_prevista']).date()
    if 'metodo_pagamento' in data:
        payment.metodo_pagamento = data['metodo_pagamento']
    if 'note' in data:
        payment.note = data['note']

    db.session.commit()

    return jsonify({'message': 'Pagamento aggiornato con successo'}), 200


@club_budget_bp.route('/payments/<int:payment_id>/mark-paid', methods=['POST'])
@jwt_required()
def mark_payment_paid(payment_id):
    """Segna pagamento come completato"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Pagamento non trovato'}), 404

    budget = payment.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json
    data_pagamento = datetime.fromisoformat(data['data_pagamento']).date() if data.get('data_pagamento') else None

    payment.mark_completed(data_pagamento)

    # Notifica sponsor
    contract = budget.contract
    Notification.create_notification(
        user_type='sponsor',
        user_id=contract.sponsor_id,
        tipo='pagamento_ricevuto',
        titolo='Pagamento ricevuto',
        messaggio=f'Il pagamento di €{payment.importo} è stato ricevuto.',
        link_url=f'/sponsor/budgets/{budget.id}'
    )

    return jsonify({'message': 'Pagamento confermato'}), 200


# ============================================================================
# DOCUMENTS ENDPOINTS
# ============================================================================

@club_budget_bp.route('/budgets/<int:budget_id>/documents', methods=['GET'])
@jwt_required()
def get_documents(budget_id):
    """Lista documenti finanziari"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    tipo = request.args.get('tipo')

    query = budget.documents

    if tipo:
        query = query.filter_by(tipo=tipo)

    documents = query.order_by(FinancialDocument.data_emissione.desc()).all()

    documents_data = [{
        'id': doc.id,
        'tipo': doc.tipo,
        'numero_documento': doc.numero_documento,
        'data_emissione': doc.data_emissione.isoformat(),
        'data_scadenza': doc.data_scadenza.isoformat() if doc.data_scadenza else None,
        'file_url': doc.file_url,
        'importo': float(doc.importo),
        'importo_totale': float(doc.importo_totale) if doc.importo_totale else None,
        'emesso_da': doc.emesso_da,
        'emesso_a': doc.emesso_a,
        'stato': doc.stato,
        'created_at': doc.created_at.isoformat()
    } for doc in documents]

    return jsonify({'documents': documents_data}), 200


@club_budget_bp.route('/budgets/<int:budget_id>/documents', methods=['POST'])
@jwt_required()
def create_document(budget_id):
    """Carica nuovo documento"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    data = request.json

    required_fields = ['tipo', 'file_url', 'data_emissione', 'importo']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    document = FinancialDocument(
        budget_id=budget_id,
        expense_id=data.get('expense_id'),
        payment_id=data.get('payment_id'),
        tipo=data['tipo'],
        numero_documento=data.get('numero_documento'),
        data_emissione=datetime.fromisoformat(data['data_emissione']).date(),
        data_scadenza=datetime.fromisoformat(data['data_scadenza']).date() if data.get('data_scadenza') else None,
        file_url=data['file_url'],
        file_size=data.get('file_size'),
        file_type=data.get('file_type'),
        importo=data['importo'],
        iva_percentuale=data.get('iva_percentuale'),
        emesso_da=data.get('emesso_da'),
        emesso_a=data.get('emesso_a'),
        stato=data.get('stato', 'emessa'),
        note=data.get('note', '')
    )

    document.calculate_total()

    db.session.add(document)
    db.session.commit()

    return jsonify({
        'message': 'Documento caricato con successo',
        'document': {
            'id': document.id,
            'tipo': document.tipo,
            'numero_documento': document.numero_documento
        }
    }), 201


@club_budget_bp.route('/documents/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """Elimina documento"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    document = FinancialDocument.query.get(document_id)
    if not document:
        return jsonify({'error': 'Documento non trovato'}), 404

    budget = document.budget
    if budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(document)
    db.session.commit()

    return jsonify({'message': 'Documento eliminato con successo'}), 200


# ============================================================================
# REPORTS & ANALYTICS
# ============================================================================

@club_budget_bp.route('/budgets/<int:budget_id>/report', methods=['GET'])
@jwt_required()
def get_budget_report(budget_id):
    """Report finanziario budget"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    # Spese per categoria
    categories_report = []
    for category in budget.categories:
        categories_report.append({
            'nome': category.nome,
            'allocato': float(category.importo_allocato),
            'speso': float(category.importo_speso),
            'percentuale': category.get_percentage_used()
        })

    # Spese per mese
    monthly_expenses = db.session.query(
        extract('month', Expense.data_spesa).label('month'),
        func.sum(Expense.importo).label('total')
    ).filter(
        Expense.budget_id == budget_id,
        Expense.stato == 'pagato'
    ).group_by('month').all()

    monthly_report = [{
        'mese': int(month),
        'totale': float(total)
    } for month, total in monthly_expenses]

    # Pagamenti overview
    total_payments = budget.payments.count()
    completed_payments = budget.payments.filter_by(stato='completato').count()
    late_payments = budget.payments.filter_by(stato='in_ritardo').count()

    return jsonify({
        'report': {
            'budget_overview': {
                'totale': float(budget.importo_totale),
                'speso': float(budget.importo_speso),
                'rimanente': float(budget.calculate_remaining()),
                'percentuale_utilizzo': budget.get_percentage_used()
            },
            'categories': categories_report,
            'monthly_expenses': monthly_report,
            'payments_overview': {
                'totale': total_payments,
                'completati': completed_payments,
                'in_ritardo': late_payments
            }
        }
    }), 200


@club_budget_bp.route('/budgets/<int:budget_id>/forecast', methods=['GET'])
@jwt_required()
def get_budget_forecast(budget_id):
    """Previsione spesa rimanente"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'club' or budget.owner_id != club_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    # Calcola burn rate (spesa media mensile)
    paid_expenses = budget.expenses.filter_by(stato='pagato').all()

    if not paid_expenses:
        return jsonify({
            'forecast': {
                'burn_rate_mensile': 0,
                'mesi_rimanenti': 0,
                'data_esaurimento_prevista': None
            }
        }), 200

    # Raggruppa per mese
    monthly_totals = {}
    for expense in paid_expenses:
        month_key = expense.data_spesa.strftime('%Y-%m')
        monthly_totals[month_key] = monthly_totals.get(month_key, 0) + float(expense.importo)

    # Burn rate medio
    burn_rate = sum(monthly_totals.values()) / len(monthly_totals)

    # Stima mesi rimanenti
    mesi_rimanenti = float(budget.calculate_remaining()) / burn_rate if burn_rate > 0 else 0

    # Data esaurimento prevista
    from datetime import timedelta
    data_esaurimento = datetime.utcnow() + timedelta(days=mesi_rimanenti * 30)

    return jsonify({
        'forecast': {
            'burn_rate_mensile': round(burn_rate, 2),
            'mesi_rimanenti': round(mesi_rimanenti, 1),
            'data_esaurimento_prevista': data_esaurimento.date().isoformat() if mesi_rimanenti > 0 else None
        }
    }), 200
