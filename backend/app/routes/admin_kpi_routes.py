from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models import (
    KPIMonthlyData, KPIMilestone, KPIProductMetrics, KPICredibility,
    Club, Subscription, CRMLead, Sponsor, AdminContract, AdminInvoice
)
from datetime import datetime, date
from sqlalchemy import func, extract

admin_kpi_bp = Blueprint('admin_kpi', __name__)


def verify_admin():
    """Helper function to verify admin role"""
    claims = get_jwt()
    return claims.get('role') == 'admin'


# ==================== DASHBOARD OVERVIEW ====================

@admin_kpi_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_kpi_dashboard():
    """Get complete KPI dashboard with auto-calculated and manual data"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    year = request.args.get('year', 2026, type=int)
    current_year = datetime.now().year

    # ===== 100% AUTO-CALCULATED FROM DATABASE =====

    # Club attivi totali
    total_clubs = Club.query.filter(
        Club.account_attivo == True,
        Club.is_activated == True
    ).count()

    # Club per piano (basato su nome_abbonamento)
    clubs_by_plan = {
        'basic': Club.query.filter(
            Club.account_attivo == True,
            db.or_(
                Club.nome_abbonamento.ilike('%basic%'),
                Club.nome_abbonamento.ilike('%kickoff%')
            )
        ).count(),
        'premium': Club.query.filter(
            Club.account_attivo == True,
            Club.nome_abbonamento.ilike('%premium%')
        ).count(),
        'elite': Club.query.filter(
            Club.account_attivo == True,
            Club.nome_abbonamento.ilike('%elite%')
        ).count()
    }

    # ===== FUNNEL DATA - 100% AUTOMATIC FROM LEAD STAGES =====
    # Stage order: nuovo -> contattato -> qualificato -> demo -> proposta -> negoziazione -> vinto -> perso

    # Contattati: leads that reached stage 'contattato' or beyond (not nuovo, not perso)
    contacted_stages = ['contattato', 'qualificato', 'demo', 'proposta', 'negoziazione', 'vinto']
    funnel_contacts = CRMLead.query.filter(
        CRMLead.stage.in_(contacted_stages)
    ).count()

    # Demo: leads that reached stage 'demo' or beyond
    demo_stages = ['demo', 'proposta', 'negoziazione', 'vinto']
    funnel_demos = CRMLead.query.filter(
        CRMLead.stage.in_(demo_stages)
    ).count()

    # Proposte: leads that reached stage 'proposta' or beyond
    proposal_stages = ['proposta', 'negoziazione', 'vinto']
    funnel_proposals = CRMLead.query.filter(
        CRMLead.stage.in_(proposal_stages)
    ).count()

    # Contratti vinti
    funnel_contracts = CRMLead.query.filter(
        CRMLead.stage == 'vinto'
    ).count()

    # ===== ARR & REVENUE - 100% AUTOMATIC FROM CONTRACTS =====

    # ARR da contratti attivi
    active_contracts = AdminContract.query.filter(
        AdminContract.status == 'active'
    ).all()

    total_arr_contracts = sum(c.total_value for c in active_contracts)

    # ARR per piano da contratti
    arr_by_plan = {'basic': 0, 'premium': 0, 'elite': 0}
    contracts_by_plan = {'basic': 0, 'premium': 0, 'elite': 0}
    for contract in active_contracts:
        plan = contract.plan_type.lower()
        if plan in arr_by_plan:
            arr_by_plan[plan] += contract.total_value
            contracts_by_plan[plan] += 1
        elif plan == 'kickoff':
            arr_by_plan['basic'] += contract.total_value
            contracts_by_plan['basic'] += 1

    # Addon revenue da contratti - TUTTE le 5 categorie
    total_addon_revenue = 0
    addon_breakdown = {
        'setup': 0,
        'training': 0,
        'custom': 0,
        'support_premium': 0,
        'integration': 0
    }
    for contract in active_contracts:
        for addon in (contract.addons or []):
            addon_price = addon.get('price', 0)
            total_addon_revenue += addon_price
            addon_id = addon.get('id', '').lower()
            addon_name = addon.get('name', '').lower()

            # Match by ID first, then by name
            if addon_id == 'setup' or 'setup' in addon_name or 'onboarding' in addon_name:
                addon_breakdown['setup'] += addon_price
            elif addon_id == 'training' or 'training' in addon_name or 'formazione' in addon_name:
                addon_breakdown['training'] += addon_price
            elif addon_id == 'custom' or 'custom' in addon_name or 'sviluppo' in addon_name:
                addon_breakdown['custom'] += addon_price
            elif addon_id == 'support_premium' or 'support' in addon_name or 'supporto' in addon_name:
                addon_breakdown['support_premium'] += addon_price
            elif addon_id == 'integration' or 'integr' in addon_name or 'api' in addon_name:
                addon_breakdown['integration'] += addon_price

    # ===== CASH-IN - 100% AUTOMATIC FROM INVOICES =====

    # Fatture pagate nell'anno
    paid_invoices_year = AdminInvoice.query.filter(
        AdminInvoice.status == 'paid',
        extract('year', AdminInvoice.payment_date) == year
    ).all()

    cash_in_year = sum(inv.total_amount for inv in paid_invoices_year)

    # Cash-in per mese
    cash_in_by_month = {}
    for month in range(1, 13):
        month_invoices = [inv for inv in paid_invoices_year
                        if inv.payment_date and inv.payment_date.month == month]
        cash_in_by_month[month] = sum(inv.total_amount for inv in month_invoices)

    # Fatture pendenti
    pending_invoices = AdminInvoice.query.filter(
        AdminInvoice.status.in_(['pending', 'overdue'])
    ).all()
    total_pending = sum(inv.total_amount for inv in pending_invoices)

    # Sponsor totali attivi
    total_sponsors = Sponsor.query.filter(
        Sponsor.membership_status == 'active'
    ).count()

    # ===== MANUAL DATA (ONLY FOR MILESTONES & CREDIBILITY) =====

    # Dati mensili (ora usati solo per tracking storico, non più per funnel)
    monthly_data = KPIMonthlyData.query.filter_by(year=year).order_by(KPIMonthlyData.month).all()

    # YTD automatici dal funnel
    ytd_totals = {
        'contacts': funnel_contacts,
        'demos': funnel_demos,
        'proposals': funnel_proposals,
        'contracts': funnel_contracts,
        'booking': 0,  # Calcolato da cash-in mensile
        'arr_new': total_arr_contracts,
        'addon_setup': addon_breakdown['setup'],
        'addon_training': addon_breakdown['training'],
        'addon_custom': addon_breakdown['custom'],
        'new_clubs_basic': contracts_by_plan['basic'],
        'new_clubs_premium': contracts_by_plan['premium'],
        'new_clubs_elite': contracts_by_plan['elite'],
    }
    ytd_totals['addon_total'] = total_addon_revenue

    # Milestone (MANUAL)
    milestones = KPIMilestone.query.order_by(KPIMilestone.order, KPIMilestone.quarter).all()
    milestones_completed = sum(1 for m in milestones if m.status == 'completed')
    milestones_total = len(milestones)

    # Credibility KPIs (MANUAL)
    credibility = KPICredibility.query.order_by(KPICredibility.order).all()

    # ===== TARGETS (from PDF document) =====
    targets = {
        'clubs': 15,
        'arr': 225000,
        'addon': 70000,
        'total_revenue': 295000,
        'contacts': 120,
        'demos': 45,
        'proposals': 30,
        'contracts': 15,
        'clubs_basic': 6,
        'clubs_premium': 6,
        'clubs_elite': 3,
        'quarterly': {
            'Q1': {'clubs': 1, 'arr': 15000, 'demos': 12, 'contracts': 1},
            'Q2': {'clubs': 3, 'arr': 60000, 'demos': 12, 'contracts': 3},
            'Q3': {'clubs': 7, 'arr': 120000, 'demos': 11, 'contracts': 4},
            'Q4': {'clubs': 15, 'arr': 225000, 'demos': 10, 'contracts': 5}
        }
    }

    # ===== CALCOLA MONTHLY ACTUALS (100% AUTOMATICO) =====
    # Aggregazione mensile automatica da Lead, Contratti e Fatture

    def get_monthly_leads_count(stages, month):
        """Conta lead in determinati stages creati nel mese specificato"""
        return CRMLead.query.filter(
            CRMLead.stage.in_(stages),
            extract('year', CRMLead.created_at) == year,
            extract('month', CRMLead.created_at) == month
        ).count()

    def get_monthly_contracts_data(month):
        """Calcola dati da contratti firmati nel mese specificato"""
        contracts = AdminContract.query.filter(
            AdminContract.status == 'active',
            extract('year', AdminContract.signed_date) == year,
            extract('month', AdminContract.signed_date) == month
        ).all()

        clubs_by_plan = {'basic': 0, 'premium': 0, 'elite': 0}
        arr_total = 0
        addon_total = 0
        addon_breakdown = {'setup': 0, 'training': 0, 'custom': 0}

        for c in contracts:
            arr_total += c.total_value
            plan = c.plan_type.lower()
            if plan in clubs_by_plan:
                clubs_by_plan[plan] += 1
            elif plan == 'kickoff':
                clubs_by_plan['basic'] += 1

            for addon in (c.addons or []):
                addon_price = addon.get('price', 0)
                addon_total += addon_price
                addon_id = addon.get('id', '').lower()
                addon_name = addon.get('name', '').lower()
                if addon_id == 'setup' or 'setup' in addon_name or 'onboarding' in addon_name:
                    addon_breakdown['setup'] += addon_price
                elif addon_id == 'training' or 'training' in addon_name or 'formazione' in addon_name:
                    addon_breakdown['training'] += addon_price
                elif addon_id == 'custom' or 'custom' in addon_name:
                    addon_breakdown['custom'] += addon_price

        return {
            'count': len(contracts),
            'arr': arr_total,
            'addon_total': addon_total,
            'addon_breakdown': addon_breakdown,
            'clubs_by_plan': clubs_by_plan
        }

    # Calcola dati mensili automatici per tutti i 12 mesi
    monthly_auto_data = []
    for month in range(1, 13):
        m_contacts = get_monthly_leads_count(contacted_stages, month)
        m_demos = get_monthly_leads_count(demo_stages, month)
        m_proposals = get_monthly_leads_count(proposal_stages, month)
        m_contracts = get_monthly_leads_count(['vinto'], month)
        m_contract_data = get_monthly_contracts_data(month)
        m_cash_in = cash_in_by_month.get(month, 0)

        monthly_auto_data.append({
            'month': month,
            'year': year,
            # Funnel (da Lead stages)
            'contacts': m_contacts,
            'demos': m_demos,
            'proposals': m_proposals,
            'contracts': m_contracts,
            # Revenue (da Contratti)
            'booking': m_cash_in,
            'arr_new': m_contract_data['arr'],
            # Add-on (da Contratti)
            'addon_setup': m_contract_data['addon_breakdown']['setup'],
            'addon_training': m_contract_data['addon_breakdown']['training'],
            'addon_custom': m_contract_data['addon_breakdown']['custom'],
            'addon_total': m_contract_data['addon_total'],
            # Club (da Contratti)
            'new_clubs_basic': m_contract_data['clubs_by_plan']['basic'],
            'new_clubs_premium': m_contract_data['clubs_by_plan']['premium'],
            'new_clubs_elite': m_contract_data['clubs_by_plan']['elite'],
            'new_clubs_total': m_contract_data['count'],
            # Flag automatico
            'is_auto': True
        })

    # ===== CALCOLA QUARTERLY ACTUALS (100% AUTOMATICO) =====
    # Basato sulla data di creazione/conversione dei lead e contratti

    def get_quarterly_leads_count(stages, q_months):
        """Conta lead in determinati stages creati nei mesi specificati"""
        return CRMLead.query.filter(
            CRMLead.stage.in_(stages),
            extract('year', CRMLead.created_at) == year,
            extract('month', CRMLead.created_at).in_(q_months)
        ).count()

    def get_quarterly_contracts_arr(q_months):
        """Calcola ARR da contratti firmati nei mesi specificati"""
        contracts = AdminContract.query.filter(
            AdminContract.status == 'active',
            extract('year', AdminContract.signed_date) == year,
            extract('month', AdminContract.signed_date).in_(q_months)
        ).all()
        return {
            'count': len(contracts),
            'arr': sum(c.total_value for c in contracts),
            'addon': sum(sum(a.get('price', 0) for a in (c.addons or [])) for c in contracts)
        }

    def get_quarterly_cash_in(q_months):
        """Calcola cash-in (fatture pagate) nei mesi specificati"""
        invoices = AdminInvoice.query.filter(
            AdminInvoice.status == 'paid',
            extract('year', AdminInvoice.payment_date) == year,
            extract('month', AdminInvoice.payment_date).in_(q_months)
        ).all()
        return sum(inv.total_amount for inv in invoices)

    quarterly_actuals = {}
    for q in ['Q1', 'Q2', 'Q3', 'Q4']:
        q_months = {'Q1': [1, 2, 3], 'Q2': [4, 5, 6], 'Q3': [7, 8, 9], 'Q4': [10, 11, 12]}[q]

        # Dati dal funnel lead
        q_contacts = get_quarterly_leads_count(contacted_stages, q_months)
        q_demos = get_quarterly_leads_count(demo_stages, q_months)
        q_proposals = get_quarterly_leads_count(proposal_stages, q_months)
        q_contracts_leads = get_quarterly_leads_count(['vinto'], q_months)

        # Dati dai contratti firmati
        q_contract_data = get_quarterly_contracts_arr(q_months)

        # Cash-in
        q_cash_in = get_quarterly_cash_in(q_months)

        quarterly_actuals[q] = {
            'contacts': q_contacts,
            'demos': q_demos,
            'proposals': q_proposals,
            'contracts': q_contracts_leads,
            'booking': q_cash_in,
            'arr_new': q_contract_data['arr'],
            'addon_total': q_contract_data['addon'],
            'new_clubs': q_contract_data['count']
        }

    # ===== CONVERSION RATES (100% AUTOMATICO) =====
    conversion_rates = {
        'contact_to_demo': round((funnel_demos / funnel_contacts * 100) if funnel_contacts > 0 else 0, 1),
        'demo_to_proposal': round((funnel_proposals / funnel_demos * 100) if funnel_demos > 0 else 0, 1),
        'proposal_to_contract': round((funnel_contracts / funnel_proposals * 100) if funnel_proposals > 0 else 0, 1),
    }

    return jsonify({
        # Tutti i dati automatici dal database
        'auto_calculated': {
            'total_clubs': total_clubs,
            'clubs_by_plan': clubs_by_plan,
            'total_arr': total_arr_contracts,
            'arr_by_plan': arr_by_plan,
            'contracts_by_plan': contracts_by_plan,
            'total_addon_revenue': total_addon_revenue,
            'addon_breakdown': addon_breakdown,
            'converted_leads': funnel_contracts,
            'total_sponsors': total_sponsors,
            # Funnel automatico
            'funnel': {
                'contacts': funnel_contacts,
                'demos': funnel_demos,
                'proposals': funnel_proposals,
                'contracts': funnel_contracts
            },
            # Cash-in automatico
            'cash_in': {
                'year_total': cash_in_year,
                'by_month': cash_in_by_month,
                'pending': total_pending
            }
        },
        'ytd_totals': ytd_totals,
        'monthly_data': [m.to_dict() for m in monthly_data],
        'monthly_auto_data': monthly_auto_data,  # Dati mensili 100% automatici
        'quarterly_actuals': quarterly_actuals,
        'conversion_rates': conversion_rates,
        # Dati manuali
        'milestones': {
            'items': [m.to_dict() for m in milestones],
            'completed': milestones_completed,
            'total': milestones_total
        },
        'credibility': [c.to_dict() for c in credibility],
        'targets': targets,
        # Flag per indicare che i dati sono automatici
        'data_sources': {
            'funnel': 'automatic',  # Da CRMLead stages
            'arr': 'automatic',      # Da AdminContract
            'cash_in': 'automatic',  # Da AdminInvoice
            'clubs': 'automatic',    # Da Club table
            'milestones': 'manual',
            'credibility': 'manual'
        }
    }), 200


# ==================== MONTHLY DATA ====================

@admin_kpi_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly_data():
    """Get all monthly KPI data"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    year = request.args.get('year', 2026, type=int)
    data = KPIMonthlyData.query.filter_by(year=year).order_by(KPIMonthlyData.month).all()

    return jsonify({
        'year': year,
        'monthly_data': [m.to_dict() for m in data]
    }), 200


@admin_kpi_bp.route('/monthly', methods=['POST'])
@jwt_required()
def upsert_monthly_data():
    """Create or update monthly KPI data"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    year = data.get('year')
    month = data.get('month')

    if not year or not month:
        return jsonify({'error': 'Anno e mese sono obbligatori'}), 400

    # Find existing or create new
    kpi = KPIMonthlyData.query.filter_by(year=year, month=month).first()
    if not kpi:
        kpi = KPIMonthlyData(year=year, month=month)
        db.session.add(kpi)

    # Update fields
    if 'contacts' in data:
        kpi.contacts = data['contacts']
    if 'demos' in data:
        kpi.demos = data['demos']
    if 'proposals' in data:
        kpi.proposals = data['proposals']
    if 'contracts' in data:
        kpi.contracts = data['contracts']
    if 'booking' in data:
        kpi.booking = data['booking']
    if 'arr_new' in data:
        kpi.arr_new = data['arr_new']
    if 'addon_setup' in data:
        kpi.addon_setup = data['addon_setup']
    if 'addon_training' in data:
        kpi.addon_training = data['addon_training']
    if 'addon_custom' in data:
        kpi.addon_custom = data['addon_custom']
    if 'new_clubs_basic' in data:
        kpi.new_clubs_basic = data['new_clubs_basic']
    if 'new_clubs_premium' in data:
        kpi.new_clubs_premium = data['new_clubs_premium']
    if 'new_clubs_elite' in data:
        kpi.new_clubs_elite = data['new_clubs_elite']
    if 'notes' in data:
        kpi.notes = data['notes']

    db.session.commit()

    return jsonify({
        'message': 'Dati aggiornati con successo',
        'data': kpi.to_dict()
    }), 200


# ==================== MILESTONES ====================

@admin_kpi_bp.route('/milestones', methods=['GET'])
@jwt_required()
def get_milestones():
    """Get all milestones"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    milestones = KPIMilestone.query.order_by(KPIMilestone.order, KPIMilestone.quarter).all()
    return jsonify({
        'milestones': [m.to_dict() for m in milestones]
    }), 200


@admin_kpi_bp.route('/milestones', methods=['POST'])
@jwt_required()
def create_milestone():
    """Create a new milestone"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    milestone = KPIMilestone(
        name=data.get('name'),
        quarter=data.get('quarter'),
        status=data.get('status', 'not_started'),
        owner=data.get('owner'),
        notes=data.get('notes'),
        order=data.get('order', 0)
    )

    db.session.add(milestone)
    db.session.commit()

    return jsonify({
        'message': 'Milestone creata con successo',
        'milestone': milestone.to_dict()
    }), 201


@admin_kpi_bp.route('/milestones/<int:id>', methods=['PUT'])
@jwt_required()
def update_milestone(id):
    """Update a milestone"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    milestone = KPIMilestone.query.get_or_404(id)
    data = request.get_json()

    if 'name' in data:
        milestone.name = data['name']
    if 'quarter' in data:
        milestone.quarter = data['quarter']
    if 'status' in data:
        milestone.status = data['status']
        if data['status'] == 'completed' and not milestone.completion_date:
            milestone.completion_date = datetime.utcnow().date()
    if 'completion_date' in data:
        milestone.completion_date = datetime.fromisoformat(data['completion_date']).date() if data['completion_date'] else None
    if 'owner' in data:
        milestone.owner = data['owner']
    if 'notes' in data:
        milestone.notes = data['notes']
    if 'order' in data:
        milestone.order = data['order']

    db.session.commit()

    return jsonify({
        'message': 'Milestone aggiornata con successo',
        'milestone': milestone.to_dict()
    }), 200


@admin_kpi_bp.route('/milestones/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_milestone(id):
    """Delete a milestone"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    milestone = KPIMilestone.query.get_or_404(id)
    db.session.delete(milestone)
    db.session.commit()

    return jsonify({'message': 'Milestone eliminata con successo'}), 200


# ==================== PRODUCT METRICS ====================

@admin_kpi_bp.route('/product-metrics', methods=['GET'])
@jwt_required()
def get_product_metrics():
    """Get product metrics"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    year = request.args.get('year', 2026, type=int)
    month = request.args.get('month', type=int)

    query = KPIProductMetrics.query.filter_by(year=year)
    if month:
        query = query.filter_by(month=month)

    metrics = query.order_by(KPIProductMetrics.month).all()

    return jsonify({
        'year': year,
        'metrics': [m.to_dict() for m in metrics]
    }), 200


@admin_kpi_bp.route('/product-metrics', methods=['POST'])
@jwt_required()
def upsert_product_metrics():
    """Create or update product metrics"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    year = data.get('year')
    month = data.get('month')

    if not year or not month:
        return jsonify({'error': 'Anno e mese sono obbligatori'}), 400

    metrics = KPIProductMetrics.query.filter_by(year=year, month=month).first()
    if not metrics:
        metrics = KPIProductMetrics(year=year, month=month)
        db.session.add(metrics)

    fields = [
        'avg_onboarding_days', 'clubs_fully_onboarded_pct',
        'avg_sponsors_per_club', 'avg_assets_per_club', 'avg_events_per_club',
        'sponsors_with_access_pct', 'avg_monthly_sponsor_logins', 'feature_adoption_pct',
        'churn_rate', 'renewal_intention_pct', 'nps_score', 'notes'
    ]

    for field in fields:
        if field in data:
            setattr(metrics, field, data[field])

    db.session.commit()

    return jsonify({
        'message': 'Metriche aggiornate con successo',
        'metrics': metrics.to_dict()
    }), 200


# ==================== CREDIBILITY KPIs ====================

@admin_kpi_bp.route('/credibility', methods=['GET'])
@jwt_required()
def get_credibility():
    """Get credibility KPIs"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    kpis = KPICredibility.query.order_by(KPICredibility.order).all()
    return jsonify({
        'credibility': [k.to_dict() for k in kpis]
    }), 200


@admin_kpi_bp.route('/credibility', methods=['POST'])
@jwt_required()
def create_credibility():
    """Create a credibility KPI"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    kpi = KPICredibility(
        name=data.get('name'),
        target=data.get('target'),
        current_value=data.get('current_value', '0'),
        status=data.get('status', 'in_progress'),
        deadline=data.get('deadline'),
        notes=data.get('notes'),
        order=data.get('order', 0)
    )

    db.session.add(kpi)
    db.session.commit()

    return jsonify({
        'message': 'KPI creato con successo',
        'kpi': kpi.to_dict()
    }), 201


@admin_kpi_bp.route('/credibility/<int:id>', methods=['PUT'])
@jwt_required()
def update_credibility(id):
    """Update a credibility KPI"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    kpi = KPICredibility.query.get_or_404(id)
    data = request.get_json()

    fields = ['name', 'target', 'current_value', 'status', 'deadline', 'notes', 'order']
    for field in fields:
        if field in data:
            setattr(kpi, field, data[field])

    db.session.commit()

    return jsonify({
        'message': 'KPI aggiornato con successo',
        'kpi': kpi.to_dict()
    }), 200


# ==================== SEED INITIAL DATA ====================

@admin_kpi_bp.route('/seed', methods=['POST'])
@jwt_required()
def seed_initial_data():
    """Seed initial KPI data (milestones and credibility)"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Seed Milestones
    milestones_data = [
        {'name': 'MVP funzionante', 'quarter': 'Q1', 'order': 1},
        {'name': '10-15 demo effettuate', 'quarter': 'Q1', 'order': 2},
        {'name': '1° club pilota chiuso', 'quarter': 'Q1', 'order': 3},
        {'name': '3 club attivi', 'quarter': 'Q2', 'order': 4},
        {'name': 'Prime revenue (€30-50k)', 'quarter': 'Q2', 'order': 5},
        {'name': 'Feedback prodotto strutturato', 'quarter': 'Q2', 'order': 6},
        {'name': '7 club totali', 'quarter': 'Q3', 'order': 7},
        {'name': 'ARR run-rate €120k', 'quarter': 'Q3', 'order': 8},
        {'name': '1 caso studio solido', 'quarter': 'Q3', 'order': 9},
        {'name': '15 club totali', 'quarter': 'Q4', 'order': 10},
        {'name': 'ARR €225k+', 'quarter': 'Q4', 'order': 11},
        {'name': '3 case study pubblicati', 'quarter': 'Q4', 'order': 12},
        {'name': 'Investor narrative pronta', 'quarter': 'Q4', 'order': 13},
    ]

    for m_data in milestones_data:
        existing = KPIMilestone.query.filter_by(name=m_data['name']).first()
        if not existing:
            milestone = KPIMilestone(**m_data)
            db.session.add(milestone)

    # Seed Credibility KPIs
    credibility_data = [
        {'name': 'Club con brand riconoscibile', 'target': '≥5', 'current_value': '0', 'deadline': 'Q4 2026', 'order': 1},
        {'name': 'Partnership istituzionali', 'target': '1-2 MoU', 'current_value': '0', 'deadline': 'Q3 2026', 'order': 2},
        {'name': 'Testimonianze scritte/video', 'target': '≥5', 'current_value': '0', 'deadline': 'Q4 2026', 'order': 3},
        {'name': 'Deck investitori validato', 'target': '1', 'current_value': '0', 'deadline': 'Q4 2026', 'order': 4},
        {'name': 'ARR dimostrabile', 'target': '€225k', 'current_value': '€0', 'deadline': 'Q4 2026', 'order': 5},
        {'name': 'Club paganti e attivi', 'target': '15', 'current_value': '0', 'deadline': 'Q4 2026', 'order': 6},
    ]

    for c_data in credibility_data:
        existing = KPICredibility.query.filter_by(name=c_data['name']).first()
        if not existing:
            kpi = KPICredibility(**c_data)
            db.session.add(kpi)

    # Seed empty monthly data for 2026
    for month in range(1, 13):
        existing = KPIMonthlyData.query.filter_by(year=2026, month=month).first()
        if not existing:
            kpi = KPIMonthlyData(year=2026, month=month)
            db.session.add(kpi)

    db.session.commit()

    return jsonify({'message': 'Dati iniziali creati con successo'}), 200
