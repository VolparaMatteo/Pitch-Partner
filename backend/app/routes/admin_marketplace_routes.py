"""
Routes per marketplace opportunità - Admin
- Overview e moderazione marketplace
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    MarketplaceOpportunity, OpportunityApplication, OpportunityCollaboration,
    OpportunityReview, Admin
)
from datetime import datetime
from sqlalchemy import func

admin_marketplace_bp = Blueprint('admin_marketplace', __name__)


def verify_admin():
    """Verifica che l'utente sia un admin e restituisce admin_id"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return None
    return int(get_jwt_identity())


@admin_marketplace_bp.route('/admin/marketplace/overview', methods=['GET'])
@jwt_required()
def get_marketplace_overview():
    """Overview totale marketplace (admin)"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato - solo admin'}), 403

        # Opportunità totali
        total_opportunities = MarketplaceOpportunity.query.count()
        published = MarketplaceOpportunity.query.filter_by(stato='pubblicata').count()
        completed = MarketplaceOpportunity.query.filter_by(stato='completata').count()
        draft = MarketplaceOpportunity.query.filter_by(stato='bozza').count()

        # Opportunità per creator type
        opportunities_by_club = MarketplaceOpportunity.query.filter_by(creator_type='club').count()
        opportunities_by_sponsor = MarketplaceOpportunity.query.filter_by(creator_type='sponsor').count()

        # Opportunità per tipo
        tipo_stats = db.session.query(
            MarketplaceOpportunity.tipo_opportunita,
            func.count(MarketplaceOpportunity.id)
        ).group_by(MarketplaceOpportunity.tipo_opportunita).all()

        # Candidature totali
        total_applications = OpportunityApplication.query.count()
        pending_applications = OpportunityApplication.query.filter_by(stato='in_attesa').count()
        accepted_applications = OpportunityApplication.query.filter_by(stato='accettata').count()
        rejected_applications = OpportunityApplication.query.filter_by(stato='rifiutata').count()

        # Collaborazioni
        total_collaborations = OpportunityCollaboration.query.count()
        active_collaborations = OpportunityCollaboration.query.filter_by(stato='attiva').count()
        completed_collaborations = OpportunityCollaboration.query.filter_by(stato='completata').count()

        # Budget totale movimentato (somma budget confermati collaborazioni)
        budget_result = db.session.query(
            func.sum(OpportunityCollaboration.budget_confermato)
        ).filter_by(stato='attiva').scalar()
        total_budget = float(budget_result) if budget_result else 0

        # Recensioni medie
        avg_rating_result = db.session.query(
            func.avg(OpportunityReview.rating)
        ).scalar()
        average_rating = round(float(avg_rating_result), 1) if avg_rating_result else 0

        # Top opportunità per views
        top_opportunities = MarketplaceOpportunity.query.order_by(
            MarketplaceOpportunity.views_count.desc()
        ).limit(10).all()

        # Opportunità recenti
        recent_opportunities = MarketplaceOpportunity.query.filter_by(
            stato='pubblicata'
        ).order_by(MarketplaceOpportunity.pubblicata_at.desc()).limit(10).all()

        return jsonify({
            'overview': {
                'opportunities': {
                    'total': total_opportunities,
                    'published': published,
                    'completed': completed,
                    'draft': draft,
                    'by_club': opportunities_by_club,
                    'by_sponsor': opportunities_by_sponsor,
                    'by_type': [{'tipo': t[0], 'count': t[1]} for t in tipo_stats]
                },
                'applications': {
                    'total': total_applications,
                    'pending': pending_applications,
                    'accepted': accepted_applications,
                    'rejected': rejected_applications,
                    'acceptance_rate': round((accepted_applications / total_applications * 100), 1) if total_applications > 0 else 0
                },
                'collaborations': {
                    'total': total_collaborations,
                    'active': active_collaborations,
                    'completed': completed_collaborations,
                    'total_budget': total_budget
                },
                'reviews': {
                    'average_rating': average_rating
                },
                'top_opportunities': [
                    {
                        'id': o.id,
                        'titolo': o.titolo,
                        'creator_name': o.get_creator_name(),
                        'views': o.views_count,
                        'applications': o.applications_count
                    }
                    for o in top_opportunities
                ],
                'recent_opportunities': [
                    {
                        'id': o.id,
                        'titolo': o.titolo,
                        'creator_name': o.get_creator_name(),
                        'tipo': o.tipo_opportunita,
                        'pubblicata_at': o.pubblicata_at.isoformat() if o.pubblicata_at else None
                    }
                    for o in recent_opportunities
                ]
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_marketplace_bp.route('/admin/marketplace/opportunities', methods=['GET'])
@jwt_required()
def get_all_opportunities():
    """Tutte le opportunità (admin - moderazione)"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')
        tipo = request.args.get('tipo')
        creator_type = request.args.get('creator_type')
        search = request.args.get('search')

        query = MarketplaceOpportunity.query

        if stato:
            query = query.filter_by(stato=stato)
        if tipo:
            query = query.filter_by(tipo_opportunita=tipo)
        if creator_type:
            query = query.filter_by(creator_type=creator_type)
        if search:
            query = query.filter(
                or_(
                    MarketplaceOpportunity.titolo.ilike(f'%{search}%'),
                    MarketplaceOpportunity.descrizione.ilike(f'%{search}%')
                )
            )

        opportunities = query.order_by(MarketplaceOpportunity.created_at.desc()).all()

        return jsonify({
            'opportunities': [opp.to_dict() for opp in opportunities],
            'total': len(opportunities)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_marketplace_bp.route('/admin/marketplace/opportunities/<int:opp_id>/moderate', methods=['POST'])
@jwt_required()
def moderate_opportunity(opp_id):
    """Modera/rimuovi opportunità (admin)"""
    try:
        admin_id = verify_admin()
        if not admin_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        data = request.get_json()
        action = data.get('action')  # 'approve', 'reject', 'remove'

        if action == 'approve':
            opportunity.stato = 'pubblicata'
            opportunity.pubblicata_at = datetime.utcnow()
            db.session.commit()
            return jsonify({'success': True, 'message': 'Opportunità approvata'}), 200

        elif action == 'reject':
            opportunity.stato = 'annullata'
            db.session.commit()
            return jsonify({'success': True, 'message': 'Opportunità rifiutata'}), 200

        elif action == 'remove':
            # Solo se non ha collaborazioni attive
            active_collaborations = OpportunityCollaboration.query.filter_by(
                opportunity_id=opp_id,
                stato='attiva'
            ).count()

            if active_collaborations > 0:
                return jsonify({'error': 'Impossibile rimuovere: collaborazioni attive esistenti'}), 400

            db.session.delete(opportunity)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Opportunità rimossa'}), 200

        else:
            return jsonify({'error': 'Azione non valida'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
