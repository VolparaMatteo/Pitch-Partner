from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Budget, Payment, Expense, Club, Sponsor, HeadOfTerms
from datetime import datetime, timedelta
from sqlalchemy import func

admin_budget_bp = Blueprint('admin_budget', __name__)


def verify_admin():
    """Verifica che l'utente sia un admin"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


# ============================================================================
# ADMIN BUDGET OVERVIEW
# ============================================================================

@admin_budget_bp.route('/admin/budgets/overview', methods=['GET'])
@jwt_required()
def get_budgets_overview():
    """Panoramica globale di tutti i budget"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Totale budget per tipo
    club_budgets_total = db.session.query(func.sum(Budget.importo_totale)).filter_by(owner_type='club').scalar() or 0
    sponsor_budgets_total = db.session.query(func.sum(Budget.importo_totale)).filter_by(owner_type='sponsor').scalar() or 0

    # Totale speso
    club_spent = db.session.query(func.sum(Budget.importo_speso)).filter_by(owner_type='club').scalar() or 0
    sponsor_spent = db.session.query(func.sum(Budget.importo_speso)).filter_by(owner_type='sponsor').scalar() or 0

    # Numero budget
    total_club_budgets = Budget.query.filter_by(owner_type='club').count()
    total_sponsor_budgets = Budget.query.filter_by(owner_type='sponsor').count()

    # Pagamenti in ritardo
    late_payments = Payment.query.filter_by(stato='in_ritardo').count()

    # Spese in sospeso
    pending_expenses = Expense.query.filter_by(stato='in_sospeso').count()

    # Budget per club (top 5)
    club_budgets = db.session.query(
        Club.nome,
        func.count(Budget.id).label('num_budgets'),
        func.sum(Budget.importo_totale).label('total_budget'),
        func.sum(Budget.importo_speso).label('total_spent')
    ).join(Budget, (Budget.owner_type == 'club') & (Budget.owner_id == Club.id)
    ).group_by(Club.id).order_by(func.sum(Budget.importo_totale).desc()).limit(5).all()

    club_budgets_data = [{
        'club_nome': nome,
        'num_budgets': num_budgets,
        'budget_totale': float(total_budget or 0),
        'speso': float(total_spent or 0),
        'percentuale_utilizzo': round((float(total_spent or 0) / float(total_budget or 1)) * 100, 2)
    } for nome, num_budgets, total_budget, total_spent in club_budgets]

    return jsonify({
        'overview': {
            'club_budgets': {
                'totale': float(club_budgets_total),
                'speso': float(club_spent),
                'numero': total_club_budgets
            },
            'sponsor_budgets': {
                'totale': float(sponsor_budgets_total),
                'speso': float(sponsor_spent),
                'numero': total_sponsor_budgets
            },
            'alerts': {
                'pagamenti_in_ritardo': late_payments,
                'spese_in_sospeso': pending_expenses
            },
            'top_clubs': club_budgets_data
        }
    }), 200


@admin_budget_bp.route('/admin/budgets/analytics', methods=['GET'])
@jwt_required()
def get_budgets_analytics():
    """Analytics finanziarie globali"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    anno = request.args.get('anno', type=int, default=datetime.utcnow().year)

    # Budget dell'anno
    budgets_anno = Budget.query.filter_by(anno_fiscale=anno).all()

    total_budget_anno = sum(float(b.importo_totale) for b in budgets_anno)
    total_speso_anno = sum(float(b.importo_speso) for b in budgets_anno)

    # Spese per mese
    monthly_expenses = db.session.query(
        func.extract('month', Expense.data_spesa).label('month'),
        func.sum(Expense.importo).label('total')
    ).join(Budget).filter(
        Budget.anno_fiscale == anno,
        Expense.stato == 'pagato'
    ).group_by('month').all()

    monthly_data = [{
        'mese': int(month),
        'totale': float(total)
    } for month, total in monthly_expenses]

    # Revenue (pagamenti completati)
    total_revenue = db.session.query(func.sum(Payment.importo)).join(Budget).filter(
        Budget.anno_fiscale == anno,
        Payment.stato == 'completato'
    ).scalar() or 0

    # Spese per categoria (top 5)
    from app.models import BudgetCategory
    top_categories = db.session.query(
        BudgetCategory.nome,
        func.sum(BudgetCategory.importo_speso).label('total_speso')
    ).join(Budget).filter(
        Budget.anno_fiscale == anno
    ).group_by(BudgetCategory.nome).order_by(func.sum(BudgetCategory.importo_speso).desc()).limit(5).all()

    categories_data = [{
        'nome': nome,
        'totale_speso': float(total_speso or 0)
    } for nome, total_speso in top_categories]

    return jsonify({
        'analytics': {
            'anno': anno,
            'budget_totale': total_budget_anno,
            'speso_totale': total_speso_anno,
            'percentuale_utilizzo': round((total_speso_anno / total_budget_anno * 100), 2) if total_budget_anno > 0 else 0,
            'revenue_totale': float(total_revenue),
            'spese_mensili': monthly_data,
            'top_categorie': categories_data
        }
    }), 200


@admin_budget_bp.route('/admin/budgets/health-check', methods=['GET'])
@jwt_required()
def get_budgets_health():
    """Budget in difficoltà e ritardi pagamenti"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Budget con utilizzo > 90%
    high_usage_budgets = Budget.query.all()
    high_usage = []
    for budget in high_usage_budgets:
        if budget.get_percentage_used() >= 90:
            contract = HeadOfTerms.query.get(budget.contract_id)
            if budget.owner_type == 'club':
                club = Club.query.get(budget.owner_id)
                owner_name = club.nome if club else 'N/A'
            else:
                sponsor = Sponsor.query.get(budget.owner_id)
                owner_name = sponsor.ragione_sociale if sponsor else 'N/A'

            high_usage.append({
                'budget_id': budget.id,
                'owner_type': budget.owner_type,
                'owner_name': owner_name,
                'contract_name': contract.nome_contratto if contract else 'N/A',
                'percentuale_utilizzo': round(budget.get_percentage_used(), 2),
                'importo_rimanente': float(budget.calculate_remaining())
            })

    # Pagamenti in ritardo
    late_payments = Payment.query.filter_by(stato='in_ritardo').all()
    late_payments_data = []
    for payment in late_payments:
        budget = payment.budget
        contract = HeadOfTerms.query.get(budget.contract_id)

        late_payments_data.append({
            'payment_id': payment.id,
            'budget_id': budget.id,
            'contract_name': contract.nome_contratto if contract else 'N/A',
            'importo': float(payment.importo),
            'data_prevista': payment.data_prevista.isoformat(),
            'giorni_ritardo': (datetime.utcnow().date() - payment.data_prevista).days
        })

    # Spese in sospeso (da approvare)
    pending_expenses = Expense.query.filter_by(stato='in_sospeso').all()
    pending_expenses_data = []
    for expense in pending_expenses:
        budget = expense.budget
        contract = HeadOfTerms.query.get(budget.contract_id)

        pending_expenses_data.append({
            'expense_id': expense.id,
            'budget_id': budget.id,
            'contract_name': contract.nome_contratto if contract else 'N/A',
            'descrizione': expense.descrizione,
            'importo': float(expense.importo),
            'creato_da': expense.creato_da_type,
            'created_at': expense.created_at.isoformat()
        })

    return jsonify({
        'health': {
            'high_usage_budgets': high_usage,
            'late_payments': late_payments_data,
            'pending_expenses': pending_expenses_data
        }
    }), 200
