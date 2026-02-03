"""
Routes per marketplace opportunità - Sponsor
- Sponsor crea, gestisce e scopre opportunità
- Sistema candidature e collaborazioni
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    MarketplaceOpportunity, OpportunityApplication, OpportunityCollaboration,
    OpportunityAsset, OpportunityMessage, OpportunityReview,
    Sponsor, Club, Notification, Message
)
from datetime import datetime, timedelta
from sqlalchemy import or_, and_, func

sponsor_marketplace_bp = Blueprint('sponsor_marketplace', __name__)


def verify_sponsor():
    """Verifica che l'utente sia uno sponsor e restituisce sponsor_id"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None
    return int(get_jwt_identity())


# ==================== GESTIONE OPPORTUNITÀ PROPRIE ====================

@sponsor_marketplace_bp.route('/marketplace/opportunities', methods=['POST'])
@jwt_required()
def create_opportunity():
    """Crea nuova opportunità (sponsor)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato - solo sponsor'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        data = request.get_json()

        # Validazione
        if not data.get('titolo') or not data.get('descrizione'):
            return jsonify({'error': 'Titolo e descrizione obbligatori'}), 400

        if not data.get('tipo_opportunita'):
            return jsonify({'error': 'Tipo opportunità obbligatorio'}), 400

        # Crea opportunità
        opportunity = MarketplaceOpportunity(
            creator_type='sponsor',
            creator_id=sponsor_id,
            titolo=data['titolo'],
            descrizione=data['descrizione'],
            tipo_opportunita=data['tipo_opportunita'],
            categoria=data.get('categoria'),
            budget_richiesto=data.get('budget_richiesto'),
            asset_richiesti=data.get('asset_richiesti', {}),
            numero_sponsor_cercati=data.get('numero_sponsor_cercati', 1),
            data_inizio=datetime.fromisoformat(data['data_inizio']) if data.get('data_inizio') else None,
            data_fine=datetime.fromisoformat(data['data_fine']) if data.get('data_fine') else None,
            location=data.get('location'),
            target_audience=data.get('target_audience', {}),
            visibilita=data.get('visibilita', 'pubblica'),
            stato='bozza',
            deadline_candidature=datetime.fromisoformat(data['deadline_candidature']) if data.get('deadline_candidature') else None
        )

        db.session.add(opportunity)
        db.session.commit()

        # Se stato = pubblicata, pubblica subito
        if data.get('stato') == 'pubblicata':
            opportunity.stato = 'pubblicata'
            opportunity.pubblicata_at = datetime.utcnow()
            db.session.commit()

            # Notifica sponsor nel network (opzionale)
            # TODO: Implementare notifica broadcast

        return jsonify({
            'success': True,
            'opportunity': opportunity.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/opportunities', methods=['GET'])
@jwt_required()
def get_my_opportunities():
    """Lista opportunità create dallo sponsor"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')  # bozza, pubblicata, in_corso, completata, annullata

        query = MarketplaceOpportunity.query.filter_by(
            creator_type='sponsor',
            creator_id=sponsor_id
        )

        if stato:
            query = query.filter_by(stato=stato)

        opportunities = query.order_by(MarketplaceOpportunity.created_at.desc()).all()

        return jsonify({
            'opportunities': [opp.to_dict() for opp in opportunities],
            'total': len(opportunities)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>', methods=['GET'])
@jwt_required()
def get_opportunity_detail(opp_id):
    """Dettaglio opportunità creata"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica ownership
        if opportunity.creator_type != 'sponsor' or opportunity.creator_id != sponsor_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Include stats
        data = opportunity.to_dict()
        data['applications_received'] = OpportunityApplication.query.filter_by(
            opportunity_id=opp_id
        ).count()
        data['collaborations_active'] = OpportunityCollaboration.query.filter_by(
            opportunity_id=opp_id,
            stato='attiva'
        ).count()

        # Aggiungi info creator
        if opportunity.creator_type == 'sponsor':
            creator = Sponsor.query.get(opportunity.creator_id)
            data['creator_name'] = creator.ragione_sociale if creator else 'Sponsor'
            data['creator_logo'] = creator.logo_url if creator else None
        elif opportunity.creator_type == 'club':
            creator = Club.query.get(opportunity.creator_id)
            data['creator_name'] = creator.nome if creator else 'Club'
            data['creator_logo'] = creator.logo_url if creator else None

        return jsonify({'opportunity': data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>', methods=['PUT'])
@jwt_required()
def update_opportunity(opp_id):
    """Modifica opportunità"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica ownership
        if opportunity.creator_type != 'sponsor' or opportunity.creator_id != sponsor_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        data = request.get_json()

        # Update fields
        if 'titolo' in data:
            opportunity.titolo = data['titolo']
        if 'descrizione' in data:
            opportunity.descrizione = data['descrizione']
        if 'tipo_opportunita' in data:
            opportunity.tipo_opportunita = data['tipo_opportunita']
        if 'categoria' in data:
            opportunity.categoria = data['categoria']
        if 'budget_richiesto' in data:
            opportunity.budget_richiesto = data['budget_richiesto']
        if 'asset_richiesti' in data:
            opportunity.asset_richiesti = data['asset_richiesti']
        if 'numero_sponsor_cercati' in data:
            opportunity.numero_sponsor_cercati = data['numero_sponsor_cercati']
        if 'data_inizio' in data:
            opportunity.data_inizio = datetime.fromisoformat(data['data_inizio']) if data['data_inizio'] else None
        if 'data_fine' in data:
            opportunity.data_fine = datetime.fromisoformat(data['data_fine']) if data['data_fine'] else None
        if 'location' in data:
            opportunity.location = data['location']
        if 'target_audience' in data:
            opportunity.target_audience = data['target_audience']
        if 'visibilita' in data:
            opportunity.visibilita = data['visibilita']
        if 'deadline_candidature' in data:
            opportunity.deadline_candidature = datetime.fromisoformat(data['deadline_candidature']) if data['deadline_candidature'] else None

        # Cambio stato
        if 'stato' in data:
            if data['stato'] == 'pubblicata' and opportunity.stato == 'bozza':
                opportunity.stato = 'pubblicata'
                opportunity.pubblicata_at = datetime.utcnow()
            else:
                opportunity.stato = data['stato']

        opportunity.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'opportunity': opportunity.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>', methods=['DELETE'])
@jwt_required()
def delete_opportunity(opp_id):
    """Elimina opportunità (solo se bozza)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica ownership
        if opportunity.creator_type != 'sponsor' or opportunity.creator_id != sponsor_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Solo bozze possono essere eliminate
        if opportunity.stato != 'bozza':
            return jsonify({'error': 'Solo bozze possono essere eliminate'}), 400

        db.session.delete(opportunity)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Opportunità eliminata'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== SCOPERTA E CANDIDATURE ====================

@sponsor_marketplace_bp.route('/marketplace/discover', methods=['GET'])
@jwt_required()
def discover_opportunities():
    """Esplora opportunità disponibili con filtri"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        tipo = request.args.get('tipo')  # tipo_opportunita
        categoria = request.args.get('categoria')
        location = request.args.get('location')
        budget_min = request.args.get('budget_min', type=float)
        budget_max = request.args.get('budget_max', type=float)
        search = request.args.get('search')  # ricerca nel titolo/descrizione

        # Query base: solo opportunità pubblicate, non scadute, con posti disponibili
        query = MarketplaceOpportunity.query.filter_by(stato='pubblicata')

        # Esclude opportunità create dallo stesso sponsor
        query = query.filter(
            or_(
                MarketplaceOpportunity.creator_type != 'sponsor',
                MarketplaceOpportunity.creator_id != sponsor_id
            )
        )

        # Filtri
        if tipo:
            query = query.filter_by(tipo_opportunita=tipo)
        if categoria:
            query = query.filter_by(categoria=categoria)
        if location:
            query = query.filter(MarketplaceOpportunity.location.ilike(f'%{location}%'))
        if budget_min:
            query = query.filter(MarketplaceOpportunity.budget_richiesto >= budget_min)
        if budget_max:
            query = query.filter(MarketplaceOpportunity.budget_richiesto <= budget_max)
        # Filtri visibilità:
        # 1. Community: visibile a tutti
        # 2. Private: visibile solo se lo sponsor appartiene al club creatore
        sponsor = Sponsor.query.get(sponsor_id)
        
        query = query.filter(
            or_(
                MarketplaceOpportunity.visibilita == 'community',
                and_(
                    MarketplaceOpportunity.visibilita == 'private',
                    MarketplaceOpportunity.creator_id == sponsor.club_id
                )
            )
        )

        if search:
            query = query.filter(
                or_(
                    MarketplaceOpportunity.titolo.ilike(f'%{search}%'),
                    MarketplaceOpportunity.descrizione.ilike(f'%{search}%')
                )
            )

        opportunities = query.order_by(MarketplaceOpportunity.pubblicata_at.desc()).all()

        # Filtra opportunità con posti disponibili
        opportunities_available = [opp for opp in opportunities if opp.can_apply()]

        # Check se sponsor ha già candidato
        for opp in opportunities_available:
            existing_app = OpportunityApplication.query.filter_by(
                opportunity_id=opp.id,
                applicant_id=sponsor_id
            ).first()
            opp_dict = opp.to_dict()
            opp_dict['has_applied'] = existing_app is not None
            opp_dict['application_status'] = existing_app.stato if existing_app else None

        return jsonify({
            'opportunities': [opp.to_dict() for opp in opportunities_available],
            'total': len(opportunities_available)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/discover/<int:opp_id>', methods=['GET'])
@jwt_required()
def get_public_opportunity_detail(opp_id):
    """Dettaglio opportunità pubblica (incrementa view counter)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica visibilità
        if opportunity.stato != 'pubblicata':
            return jsonify({'error': 'Opportunità non disponibile'}), 403

        # Incrementa views
        opportunity.increment_views()

        # Check candidatura esistente
        existing_app = OpportunityApplication.query.filter_by(
            opportunity_id=opp_id,
            applicant_id=sponsor_id
        ).first()

        data = opportunity.to_dict()
        data['has_applied'] = existing_app is not None
        data['application'] = existing_app.to_dict() if existing_app else None

        # Info creatore
        if opportunity.creator_type == 'sponsor':
            sponsor = Sponsor.query.get(opportunity.creator_id)
            data['creator_name'] = sponsor.ragione_sociale if sponsor else 'Sponsor'
            data['creator_logo'] = sponsor.logo_url if sponsor else None
        elif opportunity.creator_type == 'club':
            club = Club.query.get(opportunity.creator_id)
            data['creator_name'] = club.nome if club else 'Club'
            data['creator_logo'] = club.logo_url if club else None

        # Include collaborazioni attive (sponsor già accettati)
        collaborations = OpportunityCollaboration.query.filter_by(
            opportunity_id=opp_id,
            stato='attiva'
        ).all()
        data['collaborators'] = [
            {
                'sponsor_id': c.sponsor_id,
                'sponsor_name': c.sponsor.ragione_sociale if c.sponsor else None,
                'ruolo': c.ruolo
            }
            for c in collaborations
        ]

        return jsonify({'opportunity': data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_opportunity(opp_id):
    """Candidati a opportunità"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica se può candidarsi
        if not opportunity.can_apply():
            return jsonify({'error': 'Impossibile candidarsi a questa opportunità'}), 400

        # Verifica candidatura duplicata
        existing = OpportunityApplication.query.filter_by(
            opportunity_id=opp_id,
            applicant_id=sponsor_id
        ).first()
        if existing:
            return jsonify({'error': 'Candidatura già inviata'}), 400

        # Verifica che non sia l'owner
        if opportunity.creator_type == 'sponsor' and opportunity.creator_id == sponsor_id:
            return jsonify({'error': 'Non puoi candidarti alla tua opportunità'}), 400

        data = request.get_json()

        # Crea candidatura
        application = OpportunityApplication(
            opportunity_id=opp_id,
            applicant_type='sponsor',
            applicant_id=sponsor_id,
            messaggio_candidatura=data.get('messaggio'),
            proposta_budget=data.get('proposta_budget'),
            asset_offerti=data.get('asset_offerti', {}),
            stato='in_attesa'
        )

        db.session.add(application)
        db.session.commit()

        # Notifica creator
        Notification.create_notification(
            user_type=opportunity.creator_type,
            user_id=opportunity.creator_id,
            tipo='nuova_candidatura',
            titolo='Nuova candidatura ricevuta',
            messaggio=f'{sponsor.ragione_sociale} si è candidato per "{opportunity.titolo}"',
            link_url=f'/marketplace/opportunities/{opp_id}/applications',
            priorita='normale'
        )

        return jsonify({
            'success': True,
            'application': application.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    """Le mie candidature"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')  # in_attesa, accettata, rifiutata, ritirata

        query = OpportunityApplication.query.filter_by(
            applicant_type='sponsor',
            applicant_id=sponsor_id
        )

        if stato:
            query = query.filter_by(stato=stato)

        applications = query.order_by(OpportunityApplication.created_at.desc()).all()

        return jsonify({
            'applications': [app.to_dict() for app in applications],
            'total': len(applications),
            'stats': {
                'in_attesa': OpportunityApplication.query.filter_by(applicant_id=sponsor_id, stato='in_attesa').count(),
                'accettata': OpportunityApplication.query.filter_by(applicant_id=sponsor_id, stato='accettata').count(),
                'rifiutata': OpportunityApplication.query.filter_by(applicant_id=sponsor_id, stato='rifiutata').count()
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/applications/<int:app_id>', methods=['PUT'])
@jwt_required()
def update_application(app_id):
    """Modifica candidatura (solo se in_attesa)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        application = OpportunityApplication.query.get(app_id)
        if not application:
            return jsonify({'error': 'Candidatura non trovata'}), 404

        # Verifica ownership
        if application.applicant_id != sponsor_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Solo candidature in attesa possono essere modificate
        if application.stato != 'in_attesa':
            return jsonify({'error': 'Candidatura già processata'}), 400

        data = request.get_json()

        if 'messaggio_candidatura' in data:
            application.messaggio_candidatura = data['messaggio_candidatura']
        if 'proposta_budget' in data:
            application.proposta_budget = data['proposta_budget']
        if 'asset_offerti' in data:
            application.asset_offerti = data['asset_offerti']

        application.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'application': application.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/applications/<int:app_id>', methods=['DELETE'])
@jwt_required()
def withdraw_application(app_id):
    """Ritira candidatura"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        application = OpportunityApplication.query.get(app_id)
        if not application:
            return jsonify({'error': 'Candidatura non trovata'}), 404

        # Verifica ownership
        if application.applicant_id != sponsor_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Ritira
        if application.withdraw():
            return jsonify({
                'success': True,
                'message': 'Candidatura ritirata'
            }), 200
        else:
            return jsonify({'error': 'Impossibile ritirare candidatura già processata'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== GESTIONE CANDIDATURE RICEVUTE ====================

@sponsor_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>/applications', methods=['GET'])
@jwt_required()
def get_opportunity_applications(opp_id):
    """Candidature ricevute per un'opportunità"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica ownership
        if opportunity.creator_type != 'sponsor' or opportunity.creator_id != sponsor_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Filtri
        stato = request.args.get('stato')

        query = OpportunityApplication.query.filter_by(opportunity_id=opp_id)
        if stato:
            query = query.filter_by(stato=stato)

        applications = query.order_by(OpportunityApplication.created_at.desc()).all()

        return jsonify({
            'applications': [app.to_dict() for app in applications],
            'total': len(applications),
            'stats': {
                'in_attesa': OpportunityApplication.query.filter_by(opportunity_id=opp_id, stato='in_attesa').count(),
                'accettata': OpportunityApplication.query.filter_by(opportunity_id=opp_id, stato='accettata').count(),
                'rifiutata': OpportunityApplication.query.filter_by(opportunity_id=opp_id, stato='rifiutata').count()
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/applications/<int:app_id>/accept', methods=['POST'])
@jwt_required()
def accept_application(app_id):
    """Accetta candidatura"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        application = OpportunityApplication.query.get(app_id)
        if not application:
            return jsonify({'error': 'Candidatura non trovata'}), 404

        opportunity = application.opportunity

        # Verifica ownership opportunità
        if opportunity.creator_type != 'sponsor' or opportunity.creator_id != sponsor_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Verifica stato
        if application.stato != 'in_attesa':
            return jsonify({'error': 'Candidatura già processata'}), 400

        # Verifica posti disponibili
        if opportunity.get_spots_remaining() <= 0:
            return jsonify({'error': 'Nessun posto disponibile'}), 400

        # Accetta e crea collaborazione
        collaboration = application.accept('sponsor', sponsor_id)

        # Notifica candidato
        Notification.create_notification(
            user_type='sponsor',
            user_id=application.applicant_id,
            tipo='candidatura_accettata',
            titolo='Candidatura accettata!',
            messaggio=f'La tua candidatura per "{opportunity.titolo}" è stata accettata',
            link_url=f'/marketplace/collaborations/{collaboration.id}',
            priorita='alta'
        )

        return jsonify({
            'success': True,
            'application': application.to_dict(),
            'collaboration': collaboration.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/applications/<int:app_id>/reject', methods=['POST'])
@jwt_required()
def reject_application(app_id):
    """Rifiuta candidatura"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        application = OpportunityApplication.query.get(app_id)
        if not application:
            return jsonify({'error': 'Candidatura non trovata'}), 404

        opportunity = application.opportunity

        # Verifica ownership opportunità
        if opportunity.creator_type != 'sponsor' or opportunity.creator_id != sponsor_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Verifica stato
        if application.stato != 'in_attesa':
            return jsonify({'error': 'Candidatura già processata'}), 400

        data = request.get_json()
        motivo = data.get('motivo')

        # Rifiuta
        application.reject('sponsor', sponsor_id, motivo)

        # Notifica candidato
        Notification.create_notification(
            user_type='sponsor',
            user_id=application.applicant_id,
            tipo='candidatura_rifiutata',
            titolo='Candidatura rifiutata',
            messaggio=f'La tua candidatura per "{opportunity.titolo}" non è stata accettata',
            link_url=f'/marketplace/applications',
            priorita='normale'
        )

        return jsonify({
            'success': True,
            'application': application.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== COLLABORAZIONI ====================

@sponsor_marketplace_bp.route('/marketplace/collaborations', methods=['GET'])
@jwt_required()
def get_collaborations():
    """Collaborazioni attive/completate dello sponsor"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')  # attiva, completata, annullata

        query = OpportunityCollaboration.query.filter_by(sponsor_id=sponsor_id)
        if stato:
            query = query.filter_by(stato=stato)

        collaborations = query.order_by(OpportunityCollaboration.created_at.desc()).all()

        # Include opportunità data
        result = []
        for collab in collaborations:
            collab_dict = collab.to_dict()
            collab_dict['opportunity'] = collab.opportunity.to_dict() if collab.opportunity else None
            result.append(collab_dict)

        return jsonify({
            'collaborations': result,
            'total': len(result),
            'stats': {
                'attiva': OpportunityCollaboration.query.filter_by(sponsor_id=sponsor_id, stato='attiva').count(),
                'completata': OpportunityCollaboration.query.filter_by(sponsor_id=sponsor_id, stato='completata').count()
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>/chat', methods=['POST'])
@jwt_required()
def initiate_chat(opp_id):
    """Inizia chat con il club per questa opportunità"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica che lo sponsor possa vedere questa opportunità
        sponsor = Sponsor.query.get(sponsor_id)
        if opportunity.visibilita == 'private' and opportunity.creator_id != sponsor.club_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Restituisce i dettagli per aprire la chat nel frontend
        # Il frontend userà questi dati per navigare al Messenger con il contesto giusto
        return jsonify({
            'success': True,
            'chat_context': {
                'club_id': opportunity.creator_id,
                'club_name': opportunity.creator.nome if opportunity.creator else 'Club',
                'context_type': 'marketplace_opportunity',
                'context_id': opp_id,
                'opportunity_title': opportunity.titolo
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
