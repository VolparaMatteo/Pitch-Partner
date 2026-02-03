from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    Budget, BudgetCategory, Expense, Payment, FinancialDocument,
    HeadOfTerms, Club, Sponsor, Notification
)
from datetime import datetime
from sqlalchemy import extract, func

sponsor_budget_bp = Blueprint('sponsor_budget', __name__)


def verify_sponsor():
    """Verifica che l'utente sia uno sponsor"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None
    sponsor_id = int(get_jwt_identity())
    return sponsor_id


# ============================================================================
# BUDGET ENDPOINTS (READ-ONLY per Sponsor)
# ============================================================================

@sponsor_budget_bp.route('/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    """Lista tutti i budget dello sponsor"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri
    anno = request.args.get('anno_fiscale', type=int)
    contract_id = request.args.get('contract_id', type=int)

    query = Budget.query.filter_by(owner_type='sponsor', owner_id=sponsor_id)

    if anno:
        query = query.filter_by(anno_fiscale=anno)
    if contract_id:
        query = query.filter_by(contract_id=contract_id)

    budgets = query.all()

    budgets_data = []
    for budget in budgets:
        contract = HeadOfTerms.query.get(budget.contract_id)
        club = Club.query.get(contract.club_id) if contract else None

        # Prossimi pagamenti
        prossimi_pagamenti = budget.payments.filter_by(stato='pianificato').order_by(Payment.data_prevista.asc()).limit(3).all()

        budgets_data.append({
            'id': budget.id,
            'contract_id': budget.contract_id,
            'contract_name': contract.nome_contratto if contract else None,
            'club': {
                'id': club.id,
                'nome': club.nome
            } if club else None,
            'anno_fiscale': budget.anno_fiscale,
            'importo_totale': float(budget.importo_totale),
            'importo_speso': float(budget.importo_speso),
            'importo_rimanente': float(budget.calculate_remaining()),
            'percentuale_utilizzo': budget.get_percentage_used(),
            'valuta': budget.valuta,
            'prossimi_pagamenti': [{
                'id': p.id,
                'importo': float(p.importo),
                'data_prevista': p.data_prevista.isoformat()
            } for p in prossimi_pagamenti],
            'created_at': budget.created_at.isoformat()
        })

    return jsonify({'budgets': budgets_data}), 200


@sponsor_budget_bp.route('/budgets/<int:budget_id>', methods=['GET'])
@jwt_required()
def get_budget(budget_id):
    """Dettaglio budget singolo"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({'error': 'Budget non trovato'}), 404

    if budget.owner_type != 'sponsor' or budget.owner_id != sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contract = HeadOfTerms.query.get(budget.contract_id)
    club = Club.query.get(contract.club_id) if contract else None

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

    # Pagamenti: quanto pagato, quanto da pagare
    total_payments = budget.payments.count()
    completed_payments = budget.payments.filter_by(stato='completato').count()
    pending_amount = db.session.query(func.sum(Payment.importo)).filter(
        Payment.budget_id == budget_id,
        Payment.stato.in_(['pianificato', 'in_corso'])
    ).scalar() or 0

    return jsonify({
        'budget': {
            'id': budget.id,
            'contract': {
                'id': contract.id,
                'nome_contratto': contract.nome_contratto
            } if contract else None,
            'club': {
                'id': club.id,
                'nome': club.nome
            } if club else None,
            'anno_fiscale': budget.anno_fiscale,
            'importo_totale': float(budget.importo_totale),
            'importo_speso': float(budget.importo_speso),
            'importo_rimanente': float(budget.calculate_remaining()),
            'percentuale_utilizzo': budget.get_percentage_used(),
            'valuta': budget.valuta,
            'note': budget.note,
            'categories': categories_data,
            'payments_stats': {
                'total_payments': total_payments,
                'completed_payments': completed_payments,
                'pending_amount': float(pending_amount)
            },
            'created_at': budget.created_at.isoformat()
        }
    }), 200


# ============================================================================
# EXPENSES - Sponsor può visualizzare e proporre spese
# ============================================================================

@sponsor_budget_bp.route('/budgets/<int:budget_id>/expenses', methods=['GET'])
@jwt_required()
def get_expenses(budget_id):
    """Lista spese budget (read-only)"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'sponsor' or budget.owner_id != sponsor_id:
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
            'fattura_url': expense.fattura_url,
            'ricevuta_url': expense.ricevuta_url,
            'note': expense.note,
            'created_at': expense.created_at.isoformat()
        })

    return jsonify({'expenses': expenses_data}), 200


@sponsor_budget_bp.route('/budgets/<int:budget_id>/expenses', methods=['POST'])
@jwt_required()
def propose_expense(budget_id):
    """Proponi nuova spesa (richiede approvazione club)"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'sponsor' or budget.owner_id != sponsor_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    data = request.json

    required_fields = ['descrizione', 'importo', 'data_spesa']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    expense = Expense(
        budget_id=budget_id,
        category_id=data.get('category_id'),
        descrizione=data['descrizione'],
        importo=data['importo'],
        data_spesa=datetime.fromisoformat(data['data_spesa']).date(),
        tipo_spesa=data.get('tipo_spesa', 'preventivo'),
        stato='in_sospeso',  # Richiede approvazione club
        fattura_url=data.get('fattura_url'),
        creato_da_type='sponsor',
        creato_da_id=sponsor_id,
        note=data.get('note', '')
    )

    db.session.add(expense)
    db.session.commit()

    # Notifica club
    contract = budget.contract
    Notification.create_notification(
        user_type='club',
        user_id=contract.club_id,
        tipo='spesa_proposta',
        titolo='Nuova spesa proposta',
        messaggio=f'Lo sponsor ha proposto una spesa: "{expense.descrizione}" - €{expense.importo}',
        link_url=f'/club/budgets/{budget.id}',
        priorita='normale'
    )

    return jsonify({
        'message': 'Spesa proposta con successo (in attesa di approvazione)',
        'expense': {
            'id': expense.id,
            'descrizione': expense.descrizione,
            'importo': float(expense.importo),
            'stato': expense.stato
        }
    }), 201


# ============================================================================
# PAYMENTS - Sponsor visualizza pagamenti e conferma ricezione
# ============================================================================

@sponsor_budget_bp.route('/budgets/<int:budget_id>/payments', methods=['GET'])
@jwt_required()
def get_payments(budget_id):
    """Lista pagamenti budget"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'sponsor' or budget.owner_id != sponsor_id:
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


@sponsor_budget_bp.route('/payments/<int:payment_id>/confirm-sent', methods=['POST'])
@jwt_required()
def confirm_payment_sent(payment_id):
    """Sponsor conferma invio pagamento"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Pagamento non trovato'}), 404

    budget = payment.budget
    if budget.owner_type != 'sponsor' or budget.owner_id != sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Aggiorna stato
    payment.stato = 'in_corso'
    db.session.commit()

    # Notifica club
    contract = budget.contract
    Notification.create_notification(
        user_type='club',
        user_id=contract.club_id,
        tipo='pagamento_inviato',
        titolo='Pagamento in arrivo',
        messaggio=f'Lo sponsor ha confermato l\'invio del pagamento di €{payment.importo}',
        link_url=f'/club/budgets/{budget.id}'
    )

    return jsonify({'message': 'Pagamento confermato come inviato'}), 200


# ============================================================================
# DOCUMENTS - Sponsor visualizza e carica documenti
# ============================================================================

@sponsor_budget_bp.route('/budgets/<int:budget_id>/documents', methods=['GET'])
@jwt_required()
def get_documents(budget_id):
    """Lista documenti finanziari"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'sponsor' or budget.owner_id != sponsor_id:
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


@sponsor_budget_bp.route('/budgets/<int:budget_id>/documents', methods=['POST'])
@jwt_required()
def upload_document(budget_id):
    """Carica nuovo documento (fattura emessa allo sponsor)"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'sponsor' or budget.owner_id != sponsor_id:
        return jsonify({'error': 'Budget non trovato'}), 404

    data = request.json

    required_fields = ['tipo', 'file_url', 'data_emissione', 'importo']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    document = FinancialDocument(
        budget_id=budget_id,
        payment_id=data.get('payment_id'),
        tipo=data['tipo'],
        numero_documento=data.get('numero_documento'),
        data_emissione=datetime.fromisoformat(data['data_emissione']).date(),
        file_url=data['file_url'],
        file_size=data.get('file_size'),
        file_type=data.get('file_type'),
        importo=data['importo'],
        iva_percentuale=data.get('iva_percentuale'),
        emesso_da=data.get('emesso_da'),
        emesso_a=data.get('emesso_a'),
        stato='emessa',
        note=data.get('note', '')
    )

    document.calculate_total()

    db.session.add(document)
    db.session.commit()

    # Notifica club
    contract = budget.contract
    Notification.create_notification(
        user_type='club',
        user_id=contract.club_id,
        tipo='documento_caricato',
        titolo='Nuovo documento caricato',
        messaggio=f'Lo sponsor ha caricato un documento: {document.tipo}',
        link_url=f'/club/budgets/{budget.id}'
    )

    return jsonify({
        'message': 'Documento caricato con successo',
        'document': {
            'id': document.id,
            'tipo': document.tipo
        }
    }), 201


# ============================================================================
# REPORTS - Sponsor visualizza i propri report
# ============================================================================

@sponsor_budget_bp.route('/budgets/<int:budget_id>/report', methods=['GET'])
@jwt_required()
def get_budget_report(budget_id):
    """Report finanziario budget sponsor"""
    sponsor_id = verify_sponsor()
    if not sponsor_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    budget = Budget.query.get(budget_id)
    if not budget or budget.owner_type != 'sponsor' or budget.owner_id != sponsor_id:
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

    # Pagamenti overview
    total_payments_amount = db.session.query(func.sum(Payment.importo)).filter(
        Payment.budget_id == budget_id
    ).scalar() or 0

    paid_amount = db.session.query(func.sum(Payment.importo)).filter(
        Payment.budget_id == budget_id,
        Payment.stato == 'completato'
    ).scalar() or 0

    pending_amount = db.session.query(func.sum(Payment.importo)).filter(
        Payment.budget_id == budget_id,
        Payment.stato.in_(['pianificato', 'in_corso'])
    ).scalar() or 0

    return jsonify({
        'report': {
            'budget_overview': {
                'totale': float(budget.importo_totale),
                'speso': float(budget.importo_speso),
                'rimanente': float(budget.calculate_remaining()),
                'percentuale_utilizzo': budget.get_percentage_used()
            },
            'categories': categories_report,
            'payments_overview': {
                'totale_da_pagare': float(total_payments_amount),
                'gia_pagato': float(paid_amount),
                'da_pagare': float(pending_amount)
            }
        }
    }), 200
