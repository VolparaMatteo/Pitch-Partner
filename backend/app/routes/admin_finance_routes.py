from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import AdminContract, AdminInvoice, Club
from datetime import datetime, date, timedelta
from sqlalchemy import func, extract

admin_finance_bp = Blueprint('admin_finance', __name__)


def verify_admin():
    """Helper function to verify admin role"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


def generate_invoice_number():
    """Genera un numero fattura univoco"""
    year = datetime.now().year
    # Trova l'ultimo numero fattura dell'anno
    last_invoice = AdminInvoice.query.filter(
        AdminInvoice.invoice_number.like(f'PP-{year}-%')
    ).order_by(AdminInvoice.id.desc()).first()

    if last_invoice:
        last_num = int(last_invoice.invoice_number.split('-')[-1])
        new_num = last_num + 1
    else:
        new_num = 1

    return f'PP-{year}-{new_num:04d}'


# ========================================
# INVOICE CRUD OPERATIONS
# ========================================

@admin_finance_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    """Lista tutte le fatture"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri opzionali
    status = request.args.get('status')
    club_id = request.args.get('club_id')
    contract_id = request.args.get('contract_id')
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    query = AdminInvoice.query

    if status:
        query = query.filter(AdminInvoice.status == status)
    if club_id:
        query = query.filter(AdminInvoice.club_id == club_id)
    if contract_id:
        query = query.filter(AdminInvoice.contract_id == contract_id)
    if year:
        query = query.filter(extract('year', AdminInvoice.issue_date) == year)
    if month:
        query = query.filter(extract('month', AdminInvoice.issue_date) == month)

    invoices = query.order_by(AdminInvoice.issue_date.desc()).all()

    print(f"[DEBUG] Found {len(invoices)} invoices")
    for inv in invoices:
        print(f"[DEBUG] Invoice: {inv.id} - {inv.invoice_number} - {inv.club_id}")

    return jsonify({
        'invoices': [inv.to_dict() for inv in invoices],
        'total': len(invoices)
    })


@admin_finance_bp.route('/invoices/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    """Dettaglio singola fattura"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    invoice = AdminInvoice.query.get_or_404(invoice_id)
    result = invoice.to_dict()

    # Include info contratto
    if invoice.contract:
        result['contract'] = invoice.contract.to_dict()

    return jsonify(result)


@admin_finance_bp.route('/invoices', methods=['POST'])
@jwt_required()
def create_invoice():
    """Crea una nuova fattura"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione campi obbligatori
    required_fields = ['contract_id', 'amount', 'issue_date', 'due_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo obbligatorio mancante: {field}'}), 400

    # Verifica che il contratto esista
    contract = AdminContract.query.get(data['contract_id'])
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    # Calcola IVA
    amount = float(data['amount'])
    vat_rate = float(data.get('vat_rate', 22.0))
    vat_amount = amount * (vat_rate / 100)
    total_amount = amount + vat_amount

    # Genera numero fattura
    invoice_number = data.get('invoice_number') or generate_invoice_number()

    # Crea fattura
    invoice = AdminInvoice(
        contract_id=contract.id,
        club_id=contract.club_id,
        invoice_number=invoice_number,
        amount=amount,
        vat_rate=vat_rate,
        vat_amount=vat_amount,
        total_amount=total_amount,
        line_items=data.get('line_items', []),
        issue_date=datetime.strptime(data['issue_date'], '%Y-%m-%d').date(),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
        payment_date=datetime.strptime(data['payment_date'], '%Y-%m-%d').date() if data.get('payment_date') else None,
        status=data.get('status', 'pending'),
        payment_method=data.get('payment_method'),
        payment_reference=data.get('payment_reference'),
        period_start=datetime.strptime(data['period_start'], '%Y-%m-%d').date() if data.get('period_start') else None,
        period_end=datetime.strptime(data['period_end'], '%Y-%m-%d').date() if data.get('period_end') else None,
        notes=data.get('notes'),
        invoice_document_url=data.get('invoice_document_url'),
        created_by=get_jwt_identity()
    )

    db.session.add(invoice)
    db.session.commit()

    return jsonify({
        'message': 'Fattura creata con successo',
        'invoice': invoice.to_dict()
    }), 201


@admin_finance_bp.route('/invoices/<int:invoice_id>', methods=['PUT'])
@jwt_required()
def update_invoice(invoice_id):
    """Aggiorna una fattura esistente"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    invoice = AdminInvoice.query.get_or_404(invoice_id)
    data = request.get_json()

    # Aggiorna campi
    if 'amount' in data:
        invoice.amount = float(data['amount'])
    if 'vat_rate' in data:
        invoice.vat_rate = float(data['vat_rate'])
    if 'line_items' in data:
        invoice.line_items = data['line_items']
    if 'issue_date' in data:
        invoice.issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date()
    if 'due_date' in data:
        invoice.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
    if 'payment_date' in data:
        invoice.payment_date = datetime.strptime(data['payment_date'], '%Y-%m-%d').date() if data['payment_date'] else None
    if 'status' in data:
        invoice.status = data['status']
    if 'payment_method' in data:
        invoice.payment_method = data['payment_method']
    if 'payment_reference' in data:
        invoice.payment_reference = data['payment_reference']
    if 'period_start' in data:
        invoice.period_start = datetime.strptime(data['period_start'], '%Y-%m-%d').date() if data['period_start'] else None
    if 'period_end' in data:
        invoice.period_end = datetime.strptime(data['period_end'], '%Y-%m-%d').date() if data['period_end'] else None
    if 'notes' in data:
        invoice.notes = data['notes']
    if 'invoice_document_url' in data:
        invoice.invoice_document_url = data['invoice_document_url']

    # Ricalcola IVA e totale
    invoice.vat_amount = invoice.amount * (invoice.vat_rate / 100)
    invoice.total_amount = invoice.amount + invoice.vat_amount

    db.session.commit()

    return jsonify({
        'message': 'Fattura aggiornata con successo',
        'invoice': invoice.to_dict()
    })


@admin_finance_bp.route('/invoices/<int:invoice_id>/mark-paid', methods=['POST'])
@jwt_required()
def mark_invoice_paid(invoice_id):
    """Segna una fattura come pagata"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    invoice = AdminInvoice.query.get_or_404(invoice_id)
    data = request.get_json() or {}

    invoice.status = 'paid'
    invoice.payment_date = datetime.strptime(data['payment_date'], '%Y-%m-%d').date() if data.get('payment_date') else date.today()
    invoice.payment_method = data.get('payment_method', invoice.payment_method)
    invoice.payment_reference = data.get('payment_reference')

    db.session.commit()

    return jsonify({
        'message': 'Fattura segnata come pagata',
        'invoice': invoice.to_dict()
    })


@admin_finance_bp.route('/invoices/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
def delete_invoice(invoice_id):
    """Elimina una fattura"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    invoice = AdminInvoice.query.get_or_404(invoice_id)

    if invoice.status == 'paid':
        return jsonify({'error': 'Impossibile eliminare una fattura già pagata'}), 400

    db.session.delete(invoice)
    db.session.commit()

    return jsonify({'message': 'Fattura eliminata con successo'})


# ========================================
# FINANCE DASHBOARD
# ========================================

@admin_finance_bp.route('/finance/dashboard', methods=['GET'])
@jwt_required()
def get_finance_dashboard():
    """Dashboard finanziaria completa"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    year = request.args.get('year', datetime.now().year, type=int)
    today = date.today()

    # === ARR (Annual Recurring Revenue) ===
    active_contracts = AdminContract.query.filter(
        AdminContract.status == 'active'
    ).all()
    total_arr = sum(c.total_value for c in active_contracts)
    mrr = total_arr / 12

    # ARR per piano
    arr_by_plan = {'basic': 0, 'premium': 0, 'elite': 0}
    for contract in active_contracts:
        plan = contract.plan_type.lower()
        if plan in arr_by_plan:
            arr_by_plan[plan] += contract.total_value
        elif plan == 'kickoff':
            arr_by_plan['basic'] += contract.total_value

    # === CASH-IN (Fatture pagate) ===
    # Totale anno
    paid_invoices_year = AdminInvoice.query.filter(
        AdminInvoice.status == 'paid',
        extract('year', AdminInvoice.payment_date) == year
    ).all()
    total_cash_in_year = sum(inv.total_amount for inv in paid_invoices_year)

    # Cash-in per mese
    cash_in_by_month = {}
    for month in range(1, 13):
        month_invoices = [inv for inv in paid_invoices_year
                        if inv.payment_date and inv.payment_date.month == month]
        cash_in_by_month[month] = sum(inv.total_amount for inv in month_invoices)

    # Cash-in questo mese
    current_month = today.month
    cash_in_this_month = cash_in_by_month.get(current_month, 0)

    # === DA INCASSARE (basato sui contratti, non solo fatture) ===
    # Totale pagato da tutti i contratti attivi
    total_paid_from_contracts = 0
    for contract in active_contracts:
        contract_invoices = AdminInvoice.query.filter_by(contract_id=contract.id, status='paid').all()
        total_paid_from_contracts += sum(inv.total_amount for inv in contract_invoices)

    # Da incassare = valore totale contratti - già pagato
    total_pending = total_arr - total_paid_from_contracts
    pending_count = len(active_contracts)  # Numero di contratti attivi

    # Fatture scadute (queste rimangono basate sulle fatture emesse)
    overdue_invoices = AdminInvoice.query.filter(
        AdminInvoice.status.in_(['pending', 'overdue']),
        AdminInvoice.due_date < today
    ).all()
    total_overdue = sum(inv.total_amount for inv in overdue_invoices)

    # Aggiorna status fatture scadute
    for inv in overdue_invoices:
        if inv.status != 'overdue':
            inv.status = 'overdue'
    db.session.commit()

    # === PREVISIONI ===
    # Fatture in scadenza nei prossimi 30 giorni
    next_30_days = today + timedelta(days=30)
    upcoming_invoices = AdminInvoice.query.filter(
        AdminInvoice.status == 'pending',
        AdminInvoice.due_date >= today,
        AdminInvoice.due_date <= next_30_days
    ).all()
    expected_cash_in_30d = sum(inv.total_amount for inv in upcoming_invoices)

    # === RIEPILOGO PER CLUB ===
    club_stats = []
    for contract in active_contracts:
        club = contract.club
        # Get all invoices for this specific contract
        contract_invoices = AdminInvoice.query.filter_by(contract_id=contract.id).all()
        paid = sum(inv.total_amount for inv in contract_invoices if inv.status == 'paid')
        # "Da Pagare" = contract value - what has been paid
        pending = contract.total_value - paid

        club_stats.append({
            'club_id': club.id,
            'club_name': club.nome,
            'club_logo_url': club.logo_url,
            'plan': contract.plan_type,
            'contract_value': contract.total_value,
            'paid': paid,
            'pending': max(0, pending),  # Ensure non-negative
            'balance': max(0, pending)
        })

    return jsonify({
        # ARR & MRR
        'arr': {
            'total': total_arr,
            'mrr': mrr,
            'by_plan': arr_by_plan,
            'active_contracts': len(active_contracts)
        },
        # Cash-in
        'cash_in': {
            'year_total': total_cash_in_year,
            'this_month': cash_in_this_month,
            'by_month': cash_in_by_month
        },
        # Da incassare (basato su contratti attivi)
        'pending': {
            'total': max(0, total_pending),
            'count': pending_count,
            'overdue_total': total_overdue,
            'overdue_count': len(overdue_invoices)
        },
        # Previsioni
        'forecast': {
            'expected_30_days': expected_cash_in_30d
        },
        # Per club
        'by_club': sorted(club_stats, key=lambda x: x['contract_value'], reverse=True),
        # Anno riferimento
        'year': year
    })


@admin_finance_bp.route('/finance/monthly-report', methods=['GET'])
@jwt_required()
def get_monthly_report():
    """Report mensile dettagliato"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    year = request.args.get('year', datetime.now().year, type=int)
    month = request.args.get('month', datetime.now().month, type=int)

    # Fatture del mese
    invoices = AdminInvoice.query.filter(
        extract('year', AdminInvoice.issue_date) == year,
        extract('month', AdminInvoice.issue_date) == month
    ).order_by(AdminInvoice.issue_date).all()

    # Totali
    total_issued = sum(inv.total_amount for inv in invoices)
    total_paid = sum(inv.total_amount for inv in invoices if inv.status == 'paid')
    total_pending = sum(inv.total_amount for inv in invoices if inv.status == 'pending')
    total_overdue = sum(inv.total_amount for inv in invoices if inv.status == 'overdue')

    return jsonify({
        'year': year,
        'month': month,
        'invoices': [inv.to_dict() for inv in invoices],
        'summary': {
            'total_issued': total_issued,
            'total_paid': total_paid,
            'total_pending': total_pending,
            'total_overdue': total_overdue,
            'invoice_count': len(invoices),
            'collection_rate': (total_paid / total_issued * 100) if total_issued > 0 else 0
        }
    })


# ========================================
# AUTO-GENERATE INVOICES
# ========================================

@admin_finance_bp.route('/finance/generate-invoices', methods=['POST'])
@jwt_required()
def generate_invoices():
    """Genera fatture automatiche per i contratti attivi"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json() or {}
    year = data.get('year', datetime.now().year)
    month = data.get('month', datetime.now().month)

    # Trova contratti attivi senza fattura per questo mese
    active_contracts = AdminContract.query.filter(
        AdminContract.status == 'active'
    ).all()

    generated = []
    skipped = []

    for contract in active_contracts:
        # Verifica se esiste già una fattura per questo periodo
        existing = AdminInvoice.query.filter(
            AdminInvoice.contract_id == contract.id,
            extract('year', AdminInvoice.period_start) == year,
            extract('month', AdminInvoice.period_start) == month
        ).first()

        if existing:
            skipped.append({
                'contract_id': contract.id,
                'club_name': contract.club.nome,
                'reason': 'Fattura già esistente'
            })
            continue

        # Calcola importo in base ai termini di pagamento
        if contract.payment_terms == 'annual':
            amount = contract.total_value
        elif contract.payment_terms == 'semi_annual':
            amount = contract.total_value / 2
        elif contract.payment_terms == 'quarterly':
            amount = contract.total_value / 4
        else:  # monthly
            amount = contract.total_value / 12

        # Date
        issue_date = date(year, month, 1)
        due_date = date(year, month, 28)  # Fine mese circa
        period_start = issue_date
        if contract.payment_terms == 'annual':
            period_end = date(year, 12, 31)
        elif contract.payment_terms == 'semi_annual':
            period_end = date(year, month + 5, 28) if month <= 7 else date(year + 1, (month + 5) % 12, 28)
        elif contract.payment_terms == 'quarterly':
            period_end = date(year, month + 2, 28) if month <= 10 else date(year + 1, (month + 2) % 12, 28)
        else:
            period_end = date(year, month, 28)

        # Calcola IVA
        vat_rate = 22.0
        vat_amount = amount * (vat_rate / 100)
        total_amount = amount + vat_amount

        # Crea fattura
        invoice = AdminInvoice(
            contract_id=contract.id,
            club_id=contract.club_id,
            invoice_number=generate_invoice_number(),
            amount=amount,
            vat_rate=vat_rate,
            vat_amount=vat_amount,
            total_amount=total_amount,
            line_items=[{
                'description': f'Piano {contract.plan_type.capitalize()} - {contract.club.nome}',
                'amount': contract.plan_price / (12 if contract.payment_terms == 'monthly' else
                                                  4 if contract.payment_terms == 'quarterly' else
                                                  2 if contract.payment_terms == 'semi_annual' else 1)
            }] + [{'description': addon.get('name'), 'amount': addon.get('price', 0)} for addon in (contract.addons or [])],
            issue_date=issue_date,
            due_date=due_date,
            period_start=period_start,
            period_end=period_end,
            status='pending',
            created_by=get_jwt_identity()
        )

        db.session.add(invoice)
        generated.append({
            'invoice_number': invoice.invoice_number,
            'club_name': contract.club.nome,
            'amount': total_amount
        })

    db.session.commit()

    return jsonify({
        'message': f'Generate {len(generated)} fatture',
        'generated': generated,
        'skipped': skipped
    })
