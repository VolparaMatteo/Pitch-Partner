"""
Routes per marketplace opportunità - Club
- Club crea e gestisce opportunità
- Gestisce candidature ricevute
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    MarketplaceOpportunity, OpportunityApplication, OpportunityCollaboration,
    OpportunityInvite, Club, Sponsor, Notification
)
from datetime import datetime
from sqlalchemy import or_, and_, func

club_marketplace_bp = Blueprint('club_marketplace', __name__)


def verify_club():
    """Verifica che l'utente sia un club e restituisce club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


# ==================== GESTIONE OPPORTUNITÀ CLUB ====================

@club_marketplace_bp.route('/marketplace/opportunities', methods=['POST'])
@jwt_required()
def create_opportunity():
    """Crea nuova opportunità (club)"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato - solo club'}), 403

        club = Club.query.get(club_id)
        if not club:
            return jsonify({'error': 'Club non trovato'}), 404

        data = request.get_json()

        # Validazione
        if not data.get('titolo') or not data.get('descrizione'):
            return jsonify({'error': 'Titolo e descrizione obbligatori'}), 400

        if not data.get('tipo_opportunita'):
            return jsonify({'error': 'Tipo opportunità obbligatorio'}), 400

        # Crea opportunità
        opportunity = MarketplaceOpportunity(
            creator_type='club',
            creator_id=club_id,
            titolo=data['titolo'],
            descrizione=data['descrizione'],
            tipo_opportunita=data['tipo_opportunita'],
            categoria=data.get('categoria'),
            budget_richiesto=data.get('budget_richiesto'),
            asset_richiesti=data.get('asset_richiesti', []),
            asset_forniti=data.get('asset_forniti', []),
            numero_sponsor_cercati=data.get('numero_sponsor_cercati', 1),
            data_inizio=datetime.fromisoformat(data['data_inizio']) if data.get('data_inizio') else None,
            data_fine=datetime.fromisoformat(data['data_fine']) if data.get('data_fine') else None,
            location=data.get('location'),
            location_city=data.get('location_city'),
            location_province=data.get('location_province'),
            location_region=data.get('location_region'),
            location_country=data.get('location_country', 'Italia'),
            location_lat=data.get('location_lat'),
            location_lng=data.get('location_lng'),
            target_audience=data.get('target_audience', {}),
            visibilita=data.get('visibilita', 'community'),  # 'private' (solo miei sponsor) o 'community' (tutti)
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

        return jsonify({
            'success': True,
            'opportunity': opportunity.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/opportunities', methods=['GET'])
@club_marketplace_bp.route('/marketplace/my-opportunities', methods=['GET'])
@jwt_required()
def get_club_opportunities():
    """Lista opportunità create dal club"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')  # bozza, pubblicata, in_corso, completata, annullata

        query = MarketplaceOpportunity.query.filter_by(
            creator_type='club',
            creator_id=club_id
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


@club_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>', methods=['GET'])
@jwt_required()
def get_club_opportunity(opp_id):
    """Ottieni dettagli di una singola opportunità creata dal club"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.filter_by(
            id=opp_id,
            creator_type='club',
            creator_id=club_id
        ).first()

        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Aggiungi info creator
        opp_dict = opportunity.to_dict()
        if opportunity.creator_type == 'sponsor':
            creator = Sponsor.query.get(opportunity.creator_id)
            opp_dict['creator_name'] = creator.ragione_sociale if creator else 'Sponsor'
            opp_dict['creator_logo'] = creator.logo_url if creator else None
        elif opportunity.creator_type == 'club':
            creator = Club.query.get(opportunity.creator_id)
            opp_dict['creator_name'] = creator.nome if creator else 'Club'
            opp_dict['creator_logo'] = creator.logo_url if creator else None

        return jsonify({
            'opportunity': opp_dict
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>/applications', methods=['GET'])
@jwt_required()
def get_opportunity_applications(opp_id):
    """Ottieni tutte le candidature per un'opportunità del club"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Verifica che l'opportunità appartenga al club
        opportunity = MarketplaceOpportunity.query.filter_by(
            id=opp_id,
            creator_type='club',
            creator_id=club_id
        ).first()

        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Ottieni tutte le candidature
        applications = OpportunityApplication.query.filter_by(
            opportunity_id=opp_id
        ).order_by(OpportunityApplication.created_at.desc()).all()

        return jsonify({
            'applications': [
                {
                    **app.to_dict(),
                    'applicant_name': (
                        Sponsor.query.get(app.applicant_id).ragione_sociale 
                        if app.applicant_type == 'sponsor' 
                        else Club.query.get(app.applicant_id).nome
                    ) if app.applicant_id else 'Unknown'
                }
                for app in applications
            ],
            'total': len(applications)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# ==================== MODIFICA/ELIMINA OPPORTUNITÀ ====================

@club_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>', methods=['PUT'])
@jwt_required()
def update_opportunity(opp_id):
    """Modifica opportunità"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.filter_by(
            id=opp_id,
            creator_type='club',
            creator_id=club_id
        ).first()

        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

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
        if 'asset_forniti' in data:
            opportunity.asset_forniti = data['asset_forniti']
        if 'numero_sponsor_cercati' in data:
            opportunity.numero_sponsor_cercati = data['numero_sponsor_cercati']
        if 'data_inizio' in data:
            opportunity.data_inizio = datetime.fromisoformat(data['data_inizio']) if data['data_inizio'] else None
        if 'data_fine' in data:
            opportunity.data_fine = datetime.fromisoformat(data['data_fine']) if data['data_fine'] else None
        if 'location' in data:
            opportunity.location = data['location']
        if 'location_city' in data:
            opportunity.location_city = data['location_city']
        if 'location_province' in data:
            opportunity.location_province = data['location_province']
        if 'location_region' in data:
            opportunity.location_region = data['location_region']
        if 'location_country' in data:
            opportunity.location_country = data['location_country']
        if 'location_lat' in data:
            opportunity.location_lat = data['location_lat']
        if 'location_lng' in data:
            opportunity.location_lng = data['location_lng']
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


@club_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>', methods=['DELETE'])
@jwt_required()
def delete_opportunity(opp_id):
    """Elimina opportunità (solo se bozza o senza collaborazioni attive)"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.filter_by(
            id=opp_id,
            creator_type='club',
            creator_id=club_id
        ).first()

        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica collaborazioni attive
        active_collaborations = OpportunityCollaboration.query.filter_by(
            opportunity_id=opp_id,
            stato='attiva'
        ).count()

        if active_collaborations > 0:
            return jsonify({'error': 'Impossibile eliminare: collaborazioni attive esistenti'}), 400

        db.session.delete(opportunity)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Opportunità eliminata'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== GESTIONE CANDIDATURE RICEVUTE ====================

@club_marketplace_bp.route('/marketplace/applications/<int:app_id>/accept', methods=['POST'])
@jwt_required()
def accept_application(app_id):
    """Accetta candidatura ricevuta"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        application = OpportunityApplication.query.get(app_id)
        if not application:
            return jsonify({'error': 'Candidatura non trovata'}), 404

        opportunity = application.opportunity

        # Verifica ownership opportunità
        if opportunity.creator_type != 'club' or opportunity.creator_id != club_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Verifica stato
        if application.stato != 'in_attesa':
            return jsonify({'error': 'Candidatura già processata'}), 400

        # Verifica posti disponibili
        if opportunity.get_spots_remaining() <= 0:
            return jsonify({'error': 'Nessun posto disponibile'}), 400

        # Accetta e crea collaborazione
        collaboration = application.accept('club', club_id)

        # Notifica candidato
        applicant_name = ''
        if application.applicant_type == 'sponsor':
            applicant = Sponsor.query.get(application.applicant_id)
            applicant_name = applicant.ragione_sociale if applicant else 'Sponsor'
            Notification.create_notification(
                user_type='sponsor',
                user_id=application.applicant_id,
                tipo='candidatura_accettata',
                titolo='Candidatura accettata!',
                messaggio=f'La tua candidatura per "{opportunity.titolo}" è stata accettata',
                link_url=f'/sponsor/marketplace/collaborations',
                priorita='alta'
            )
        elif application.applicant_type == 'club':
            applicant = Club.query.get(application.applicant_id)
            applicant_name = applicant.nome if applicant else 'Club'
            Notification.create_notification(
                user_type='club',
                user_id=application.applicant_id,
                tipo='candidatura_accettata',
                titolo='Candidatura accettata!',
                messaggio=f'La tua candidatura per "{opportunity.titolo}" è stata accettata',
                link_url=f'/club/marketplace',
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


@club_marketplace_bp.route('/marketplace/applications/<int:app_id>/reject', methods=['POST'])
@jwt_required()
def reject_application(app_id):
    """Rifiuta candidatura ricevuta"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        application = OpportunityApplication.query.get(app_id)
        if not application:
            return jsonify({'error': 'Candidatura non trovata'}), 404

        opportunity = application.opportunity

        # Verifica ownership opportunità
        if opportunity.creator_type != 'club' or opportunity.creator_id != club_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Verifica stato
        if application.stato != 'in_attesa':
            return jsonify({'error': 'Candidatura già processata'}), 400

        data = request.get_json() or {}
        motivo = data.get('motivo')

        # Rifiuta
        application.reject('club', club_id, motivo)

        # Notifica candidato
        if application.applicant_type == 'sponsor':
            Notification.create_notification(
                user_type='sponsor',
                user_id=application.applicant_id,
                tipo='candidatura_rifiutata',
                titolo='Candidatura rifiutata',
                messaggio=f'La tua candidatura per "{opportunity.titolo}" non è stata accettata',
                link_url=f'/sponsor/marketplace',
                priorita='normale'
            )
        elif application.applicant_type == 'club':
            Notification.create_notification(
                user_type='club',
                user_id=application.applicant_id,
                tipo='candidatura_rifiutata',
                titolo='Candidatura rifiutata',
                messaggio=f'La tua candidatura per "{opportunity.titolo}" non è stata accettata',
                link_url=f'/club/marketplace',
                priorita='normale'
            )

        return jsonify({
            'success': True,
            'application': application.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== COLLABORAZIONI COME CREATOR ====================

@club_marketplace_bp.route('/marketplace/my-collaborations', methods=['GET'])
@jwt_required()
def get_my_opportunity_collaborations():
    """Collaborazioni per opportunità create dal club"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')

        # Trova tutte le opportunità del club
        my_opportunities = MarketplaceOpportunity.query.filter_by(
            creator_type='club',
            creator_id=club_id
        ).all()

        opp_ids = [o.id for o in my_opportunities]

        if not opp_ids:
            return jsonify({
                'collaborations': [],
                'total': 0
            }), 200

        # Trova collaborazioni per queste opportunità
        query = OpportunityCollaboration.query.filter(
            OpportunityCollaboration.opportunity_id.in_(opp_ids)
        )

        if stato:
            query = query.filter_by(stato=stato)

        collaborations = query.order_by(OpportunityCollaboration.created_at.desc()).all()

        result = []
        for collab in collaborations:
            collab_dict = collab.to_dict()
            collab_dict['opportunity'] = collab.opportunity.to_dict() if collab.opportunity else None

            # Aggiungi info partecipante
            if collab.sponsor_id:
                sponsor = Sponsor.query.get(collab.sponsor_id)
                collab_dict['participant_name'] = sponsor.ragione_sociale if sponsor else 'Sponsor'
                collab_dict['participant_logo'] = sponsor.logo_url if sponsor else None
            elif collab.club_id:
                club = Club.query.get(collab.club_id)
                collab_dict['participant_name'] = club.nome if club else 'Club'
                collab_dict['participant_logo'] = club.logo_url if club else None

            result.append(collab_dict)

        return jsonify({
            'collaborations': result,
            'total': len(result),
            'stats': {
                'attiva': len([c for c in collaborations if c.stato == 'attiva']),
                'completata': len([c for c in collaborations if c.stato == 'completata'])
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/collaborations/<int:collab_id>/complete', methods=['POST'])
@jwt_required()
def complete_collaboration(collab_id):
    """Segna collaborazione come completata"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        collaboration = OpportunityCollaboration.query.get(collab_id)
        if not collaboration:
            return jsonify({'error': 'Collaborazione non trovata'}), 404

        opportunity = collaboration.opportunity

        # Verifica ownership
        if opportunity.creator_type != 'club' or opportunity.creator_id != club_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        collaboration.complete()

        return jsonify({
            'success': True,
            'collaboration': collaboration.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== SCOPERTA E CANDIDATURE ====================

@club_marketplace_bp.route('/marketplace/discover', methods=['GET'])
@jwt_required()
def discover_opportunities():
    """Esplora opportunità disponibili (create da Sponsor o altri Club)"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        tipo = request.args.get('tipo')
        categoria = request.args.get('categoria')
        location = request.args.get('location')
        search = request.args.get('search')
        creator_type = request.args.get('creator_type')  # 'sponsor' o 'club'
        sponsor_only = request.args.get('sponsor_only')  # 'true' per vedere solo sponsor propri

        # Query base: solo opportunità pubblicate
        query = MarketplaceOpportunity.query.filter_by(stato='pubblicata')

        # Esclude opportunità create dallo stesso club
        query = query.filter(
            or_(
                MarketplaceOpportunity.creator_type != 'club',
                MarketplaceOpportunity.creator_id != club_id
            )
        )

        # Filtro sponsor_only: mostra solo opportunità dei propri sponsor
        if sponsor_only == 'true':
            my_sponsor_ids = db.session.query(Sponsor.id).filter_by(club_id=club_id).all()
            my_sponsor_ids = [s[0] for s in my_sponsor_ids]
            
            if my_sponsor_ids:
                query = query.filter(
                    and_(
                        MarketplaceOpportunity.creator_type == 'sponsor',
                        MarketplaceOpportunity.creator_id.in_(my_sponsor_ids)
                    )
                )
            else:
                # Se non ha sponsor, non mostrare nulla
                return jsonify({
                    'opportunities': [],
                    'total': 0
                }), 200

        # Filtri
        if tipo:
            query = query.filter_by(tipo_opportunita=tipo)
        if categoria:
            query = query.filter_by(categoria=categoria)
        if location:
            query = query.filter(MarketplaceOpportunity.location.ilike(f'%{location}%'))
        if creator_type:
            query = query.filter_by(creator_type=creator_type)
        
        
        # Visibilità: 
        # - pubblica: visibile a tutti
        # - privata: visibile solo se il club è il "proprietario" dello sponsor creatore
        
        query = query.filter(
            or_(
                MarketplaceOpportunity.visibilita == 'pubblica',
                and_(
                    MarketplaceOpportunity.visibilita == 'privata',
                    MarketplaceOpportunity.creator_type == 'sponsor',
                    MarketplaceOpportunity.creator_id.in_(
                        db.session.query(Sponsor.id).filter_by(club_id=club_id)
                    )
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

        # Check se club ha già candidato
        for opp in opportunities_available:
            existing_app = OpportunityApplication.query.filter_by(
                opportunity_id=opp.id,
                applicant_type='club',
                applicant_id=club_id
            ).first()
            opp_dict = opp.to_dict()
            opp_dict['has_applied'] = existing_app is not None
            opp_dict['application_status'] = existing_app.stato if existing_app else None
            
            # Aggiungi info creatore
            if opp.creator_type == 'sponsor':
                sponsor = Sponsor.query.get(opp.creator_id)
                opp_dict['creator_name'] = sponsor.ragione_sociale if sponsor else 'Sponsor'
            elif opp.creator_type == 'club':
                club = Club.query.get(opp.creator_id)
                opp_dict['creator_name'] = club.nome if club else 'Club'

        # Build response with safe creator lookups
        result = []
        for opp in opportunities_available:
            opp_data = opp.to_dict()
            opp_data['has_applied'] = OpportunityApplication.query.filter_by(
                opportunity_id=opp.id, applicant_type='club', applicant_id=club_id
            ).count() > 0

            # Safe creator lookup
            if opp.creator_type == 'sponsor':
                creator = Sponsor.query.get(opp.creator_id)
                opp_data['creator_name'] = creator.ragione_sociale if creator else 'Sponsor sconosciuto'
                opp_data['creator_logo'] = creator.logo_url if creator else None
            elif opp.creator_type == 'club':
                creator = Club.query.get(opp.creator_id)
                opp_data['creator_name'] = creator.nome if creator else 'Club sconosciuto'
                opp_data['creator_logo'] = creator.logo_url if creator else None
            else:
                opp_data['creator_name'] = 'Sconosciuto'
                opp_data['creator_logo'] = None

            result.append(opp_data)

        return jsonify({
            'opportunities': result,
            'total': len(result)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_opportunity(opp_id):
    """Candidati a opportunità (come Club)"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        club = Club.query.get(club_id)
        if not club:
            return jsonify({'error': 'Club non trovato'}), 404

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica se può candidarsi
        if not opportunity.can_apply():
            return jsonify({'error': 'Impossibile candidarsi a questa opportunità'}), 400

        # Verifica candidatura duplicata
        existing = OpportunityApplication.query.filter_by(
            opportunity_id=opp_id,
            applicant_type='club',
            applicant_id=club_id
        ).first()
        if existing:
            return jsonify({'error': 'Candidatura già inviata'}), 400

        # Verifica che non sia l'owner
        if opportunity.creator_type == 'club' and opportunity.creator_id == club_id:
            return jsonify({'error': 'Non puoi candidarti alla tua opportunità'}), 400

        data = request.get_json()

        # Crea candidatura
        application = OpportunityApplication(
            opportunity_id=opp_id,
            applicant_type='club',
            applicant_id=club_id,
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
            messaggio=f'{club.nome} si è candidato per "{opportunity.titolo}"',
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


@club_marketplace_bp.route('/marketplace/applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    """Le mie candidature (inviate dal Club)"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')

        query = OpportunityApplication.query.filter_by(
            applicant_type='club',
            applicant_id=club_id
        )

        if stato:
            query = query.filter_by(stato=stato)

        applications = query.order_by(OpportunityApplication.created_at.desc()).all()

        return jsonify({
            'applications': [app.to_dict() for app in applications],
            'total': len(applications)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/collaborations', methods=['GET'])
@jwt_required()
def get_collaborations():
    """Collaborazioni attive/completate del club (come partecipante)"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Collaborazioni dove il club è partecipante
        collaborations = OpportunityCollaboration.query.filter_by(
            club_id=club_id,
            stato='attiva'
        ).all()

        return jsonify({
            'collaborations': [c.to_dict() for c in collaborations],
            'total': len(collaborations)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/discover/<int:opp_id>', methods=['GET'])
@jwt_required()
def get_public_opportunity_detail(opp_id):
    """Dettaglio opportunità pubblica per Club"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        # Verifica visibilità
        if opportunity.stato != 'pubblicata':
            # Se è il creatore, ok
            if not (opportunity.creator_type == 'club' and opportunity.creator_id == club_id):
                return jsonify({'error': 'Opportunità non disponibile'}), 403

        # Incrementa views se non è il creatore
        if not (opportunity.creator_type == 'club' and opportunity.creator_id == club_id):
            opportunity.increment_views()

        # Check candidatura esistente
        existing_app = OpportunityApplication.query.filter_by(
            opportunity_id=opp_id,
            applicant_type='club',
            applicant_id=club_id
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

        return jsonify({'opportunity': data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== ANALYTICS ====================

@club_marketplace_bp.route('/marketplace/analytics', methods=['GET'])
@jwt_required()
def get_marketplace_analytics():
    """Analytics marketplace del club"""
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Opportunità create dal club
        opportunities = MarketplaceOpportunity.query.filter_by(
            creator_type='club',
            creator_id=club_id
        ).all()

        total_opportunities = len(opportunities)
        published = len([o for o in opportunities if o.stato == 'pubblicata'])
        completed = len([o for o in opportunities if o.stato == 'completata'])

        # Candidature totali RICEVUTE
        opp_ids = [o.id for o in opportunities]
        total_applications = OpportunityApplication.query.filter(
            OpportunityApplication.opportunity_id.in_(opp_ids)
        ).count() if opp_ids else 0

        accepted_applications = OpportunityApplication.query.filter(
            OpportunityApplication.opportunity_id.in_(opp_ids),
            OpportunityApplication.stato == 'accettata'
        ).count() if opp_ids else 0

        # Collaborazioni attive (come creator)
        total_collaborations = OpportunityCollaboration.query.filter(
            OpportunityCollaboration.opportunity_id.in_(opp_ids)
        ).count() if opp_ids else 0

        # Top opportunità per views
        top_opportunities = sorted(opportunities, key=lambda o: o.views_count, reverse=True)[:5]

        return jsonify({
            'analytics': {
                'total_opportunities': total_opportunities,
                'published': published,
                'completed': completed,
                'total_applications': total_applications,
                'accepted_applications': accepted_applications,
                'acceptance_rate': round((accepted_applications / total_applications * 100), 1) if total_applications > 0 else 0,
                'total_collaborations': total_collaborations,
                'top_opportunities': [
                    {
                        'id': o.id,
                        'titolo': o.titolo,
                        'views': o.views_count,
                        'applications': o.applications_count
                    }
                    for o in top_opportunities
                ]
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== RICERCA GEOGRAFICA ====================

import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calcola la distanza in km tra due coordinate usando la formula di Haversine
    """
    R = 6371  # Raggio della Terra in km

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c


@club_marketplace_bp.route('/marketplace/discover/geo', methods=['GET'])
@jwt_required()
def discover_opportunities_geo():
    """
    Esplora opportunità con filtro geografico
    Parametri:
    - lat: latitudine centro ricerca
    - lng: longitudine centro ricerca
    - radius: raggio in km (default 50)
    - city: filtra per città
    - province: filtra per provincia
    - region: filtra per regione
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Parametri geografici
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 50, type=float)  # Default 50km
        city = request.args.get('city')
        province = request.args.get('province')
        region = request.args.get('region')

        # Filtri standard
        tipo = request.args.get('tipo')
        categoria = request.args.get('categoria')
        search = request.args.get('search')

        # Query base: solo opportunità pubblicate
        query = MarketplaceOpportunity.query.filter_by(stato='pubblicata')

        # Esclude opportunità create dallo stesso club
        query = query.filter(
            or_(
                MarketplaceOpportunity.creator_type != 'club',
                MarketplaceOpportunity.creator_id != club_id
            )
        )

        # Filtro città
        if city:
            query = query.filter(MarketplaceOpportunity.location_city.ilike(f'%{city}%'))

        # Filtro provincia
        if province:
            query = query.filter(MarketplaceOpportunity.location_province.ilike(f'%{province}%'))

        # Filtro regione
        if region:
            query = query.filter(MarketplaceOpportunity.location_region.ilike(f'%{region}%'))

        # Filtri standard
        if tipo:
            query = query.filter_by(tipo_opportunita=tipo)
        if categoria:
            query = query.filter_by(categoria=categoria)
        if search:
            query = query.filter(
                or_(
                    MarketplaceOpportunity.titolo.ilike(f'%{search}%'),
                    MarketplaceOpportunity.descrizione.ilike(f'%{search}%')
                )
            )

        # Visibilità
        query = query.filter(
            or_(
                MarketplaceOpportunity.visibilita == 'pubblica',
                MarketplaceOpportunity.visibilita == 'community',
                and_(
                    MarketplaceOpportunity.visibilita == 'privata',
                    MarketplaceOpportunity.creator_type == 'sponsor',
                    MarketplaceOpportunity.creator_id.in_(
                        db.session.query(Sponsor.id).filter_by(club_id=club_id)
                    )
                )
            )
        )

        opportunities = query.order_by(MarketplaceOpportunity.pubblicata_at.desc()).all()

        # Filtra per distanza se coordinate fornite
        if lat and lng:
            filtered_opportunities = []
            for opp in opportunities:
                if opp.location_lat and opp.location_lng:
                    distance = haversine_distance(lat, lng, opp.location_lat, opp.location_lng)
                    if distance <= radius:
                        opp_dict = opp.to_dict()
                        opp_dict['distance_km'] = round(distance, 1)
                        filtered_opportunities.append(opp_dict)
                else:
                    # Include opportunità senza coordinate (non filtrate per distanza)
                    opp_dict = opp.to_dict()
                    opp_dict['distance_km'] = None
                    filtered_opportunities.append(opp_dict)

            # Ordina per distanza
            filtered_opportunities.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else float('inf'))
            opportunities_data = filtered_opportunities
        else:
            opportunities_data = [opp.to_dict() for opp in opportunities]

        # Aggiungi info candidatura e creatore
        for opp_dict in opportunities_data:
            opp_id = opp_dict['id']
            opp_dict['has_applied'] = OpportunityApplication.query.filter_by(
                opportunity_id=opp_id,
                applicant_type='club',
                applicant_id=club_id
            ).count() > 0

            # Info creatore
            opp = MarketplaceOpportunity.query.get(opp_id)
            if opp.creator_type == 'sponsor':
                sponsor = Sponsor.query.get(opp.creator_id)
                opp_dict['creator_name'] = sponsor.ragione_sociale if sponsor else 'Sponsor'
                opp_dict['creator_logo'] = sponsor.logo_url if sponsor else None
            else:
                club = Club.query.get(opp.creator_id)
                opp_dict['creator_name'] = club.nome if club else 'Club'
                opp_dict['creator_logo'] = club.logo_url if club else None

        return jsonify({
            'opportunities': opportunities_data,
            'total': len(opportunities_data),
            'filters': {
                'lat': lat,
                'lng': lng,
                'radius': radius,
                'city': city,
                'province': province,
                'region': region
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/locations', methods=['GET'])
@jwt_required()
def get_available_locations():
    """
    Restituisce lista di città/province/regioni con opportunità attive
    Utile per popolare filtri dropdown
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Query opportunità pubblicate
        opportunities = MarketplaceOpportunity.query.filter_by(stato='pubblicata').all()

        cities = set()
        provinces = set()
        regions = set()

        for opp in opportunities:
            if opp.location_city:
                cities.add(opp.location_city)
            if opp.location_province:
                provinces.add(opp.location_province)
            if opp.location_region:
                regions.add(opp.location_region)

        return jsonify({
            'cities': sorted(list(cities)),
            'provinces': sorted(list(provinces)),
            'regions': sorted(list(regions))
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== SISTEMA INVITI DIRETTI ====================

@club_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>/invite', methods=['POST'])
@jwt_required()
def send_invite(opp_id):
    """
    Invia un invito diretto a partecipare all'opportunità.
    Il club owner può invitare sponsor o altri club.
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Verifica che l'opportunità esista e sia del club
        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        if not (opportunity.creator_type == 'club' and opportunity.creator_id == club_id):
            return jsonify({'error': 'Non sei il proprietario di questa opportunità'}), 403

        data = request.get_json()
        recipient_type = data.get('recipient_type')  # 'club' o 'sponsor'
        recipient_id = data.get('recipient_id')
        messaggio = data.get('messaggio', '')

        if not recipient_type or not recipient_id:
            return jsonify({'error': 'Destinatario obbligatorio'}), 400

        if recipient_type not in ['club', 'sponsor']:
            return jsonify({'error': 'Tipo destinatario non valido'}), 400

        # Verifica che il destinatario esista
        if recipient_type == 'club':
            recipient = Club.query.get(recipient_id)
            if not recipient:
                return jsonify({'error': 'Club destinatario non trovato'}), 404
            # Non può invitare se stesso
            if recipient_id == club_id:
                return jsonify({'error': 'Non puoi invitare te stesso'}), 400
        else:
            recipient = Sponsor.query.get(recipient_id)
            if not recipient:
                return jsonify({'error': 'Sponsor destinatario non trovato'}), 404

        # Verifica che non esista già un invito pending
        existing_invite = OpportunityInvite.query.filter_by(
            opportunity_id=opp_id,
            recipient_type=recipient_type,
            recipient_id=recipient_id,
            stato='pending'
        ).first()
        if existing_invite:
            return jsonify({'error': 'Invito già inviato a questo destinatario'}), 400

        # Verifica che non abbia già una candidatura
        existing_application = OpportunityApplication.query.filter_by(
            opportunity_id=opp_id,
            applicant_type=recipient_type,
            applicant_id=recipient_id
        ).first()
        if existing_application:
            return jsonify({'error': 'Il destinatario ha già una candidatura per questa opportunità'}), 400

        # Crea l'invito
        invite = OpportunityInvite(
            opportunity_id=opp_id,
            sender_type='club',
            sender_id=club_id,
            recipient_type=recipient_type,
            recipient_id=recipient_id,
            messaggio=messaggio,
            stato='pending'
        )

        db.session.add(invite)
        db.session.commit()

        # Invia notifica al destinatario
        club = Club.query.get(club_id)
        Notification.create_notification(
            user_type=recipient_type,
            user_id=recipient_id,
            tipo='invito_opportunita',
            titolo='Nuovo invito ricevuto!',
            messaggio=f'{club.nome} ti ha invitato a partecipare a "{opportunity.titolo}"',
            link_url=f'/marketplace/invites',
            priorita='alta'
        )

        return jsonify({
            'success': True,
            'invite': invite.to_dict(),
            'message': 'Invito inviato con successo'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/opportunities/<int:opp_id>/invites', methods=['GET'])
@jwt_required()
def get_opportunity_invites(opp_id):
    """
    Lista inviti inviati per una specifica opportunità (per il proprietario)
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Verifica che l'opportunità sia del club
        opportunity = MarketplaceOpportunity.query.get(opp_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        if not (opportunity.creator_type == 'club' and opportunity.creator_id == club_id):
            return jsonify({'error': 'Non sei il proprietario di questa opportunità'}), 403

        # Filtro opzionale per stato
        stato = request.args.get('stato')

        query = OpportunityInvite.query.filter_by(opportunity_id=opp_id)
        if stato:
            query = query.filter_by(stato=stato)

        invites = query.order_by(OpportunityInvite.created_at.desc()).all()

        return jsonify({
            'invites': [inv.to_dict() for inv in invites],
            'total': len(invites),
            'stats': {
                'pending': len([i for i in invites if i.stato == 'pending']),
                'accepted': len([i for i in invites if i.stato == 'accepted']),
                'declined': len([i for i in invites if i.stato == 'declined'])
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/invites/sent', methods=['GET'])
@jwt_required()
def get_sent_invites():
    """
    Tutti gli inviti inviati dal club (per tutte le sue opportunità)
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')
        opportunity_id = request.args.get('opportunity_id')

        query = OpportunityInvite.query.filter_by(
            sender_type='club',
            sender_id=club_id
        )

        if stato:
            query = query.filter_by(stato=stato)
        if opportunity_id:
            query = query.filter_by(opportunity_id=int(opportunity_id))

        invites = query.order_by(OpportunityInvite.created_at.desc()).all()

        return jsonify({
            'invites': [inv.to_dict() for inv in invites],
            'total': len(invites)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/invites/received', methods=['GET'])
@jwt_required()
def get_received_invites():
    """
    Inviti ricevuti dal club (da altri club o sponsor)
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri
        stato = request.args.get('stato')

        query = OpportunityInvite.query.filter_by(
            recipient_type='club',
            recipient_id=club_id
        )

        if stato:
            query = query.filter_by(stato=stato)

        invites = query.order_by(OpportunityInvite.created_at.desc()).all()

        # Marca come visualizzati
        for invite in invites:
            if invite.stato == 'pending' and not invite.viewed_at:
                invite.mark_as_viewed()

        return jsonify({
            'invites': [inv.to_dict() for inv in invites],
            'total': len(invites),
            'pending_count': len([i for i in invites if i.stato == 'pending'])
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/invites/count', methods=['GET'])
@jwt_required()
def get_invites_count():
    """
    Conteggio inviti pending (per badge notifica)
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        count = OpportunityInvite.query.filter_by(
            recipient_type='club',
            recipient_id=club_id,
            stato='pending'
        ).count()

        return jsonify({
            'pending_count': count
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/invites/<int:invite_id>/accept', methods=['POST'])
@jwt_required()
def accept_invite(invite_id):
    """
    Accetta un invito - NON crea automaticamente la candidatura,
    ma restituisce i dati per pre-compilare il form
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        invite = OpportunityInvite.query.get(invite_id)
        if not invite:
            return jsonify({'error': 'Invito non trovato'}), 404

        # Verifica che sia il destinatario
        if not (invite.recipient_type == 'club' and invite.recipient_id == club_id):
            return jsonify({'error': 'Non sei il destinatario di questo invito'}), 403

        if invite.stato != 'pending':
            return jsonify({'error': f'Invito già {invite.stato}'}), 400

        # Accetta l'invito
        invite.accept()

        # Restituisce i dati per pre-compilare il form candidatura
        opportunity = invite.opportunity

        return jsonify({
            'success': True,
            'message': 'Invito accettato! Completa la candidatura.',
            'invite': invite.to_dict(),
            'prefill_data': {
                'opportunity_id': opportunity.id,
                'opportunity_title': opportunity.titolo,
                'invited_by': invite.get_sender_name(),
                'invite_message': invite.messaggio,
                'suggested_budget': float(opportunity.budget_richiesto) if opportunity.budget_richiesto else None,
                'asset_richiesti': opportunity.asset_richiesti
            },
            'redirect_url': f'/club/marketplace/opportunities/{opportunity.id}?from_invite={invite_id}'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/invites/<int:invite_id>/decline', methods=['POST'])
@jwt_required()
def decline_invite(invite_id):
    """
    Rifiuta un invito
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        invite = OpportunityInvite.query.get(invite_id)
        if not invite:
            return jsonify({'error': 'Invito non trovato'}), 404

        # Verifica che sia il destinatario
        if not (invite.recipient_type == 'club' and invite.recipient_id == club_id):
            return jsonify({'error': 'Non sei il destinatario di questo invito'}), 403

        if invite.stato != 'pending':
            return jsonify({'error': f'Invito già {invite.stato}'}), 400

        # Rifiuta l'invito
        invite.decline()

        # Notifica al mittente
        club = Club.query.get(club_id)
        Notification.create_notification(
            user_type=invite.sender_type,
            user_id=invite.sender_id,
            tipo='invito_rifiutato',
            titolo='Invito rifiutato',
            messaggio=f'{club.nome} ha rifiutato il tuo invito per "{invite.opportunity.titolo}"',
            link_url=f'/marketplace/manage/{invite.opportunity_id}',
            priorita='normale'
        )

        return jsonify({
            'success': True,
            'message': 'Invito rifiutato',
            'invite': invite.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@club_marketplace_bp.route('/marketplace/invitable-partners', methods=['GET'])
@jwt_required()
def get_invitable_partners():
    """
    Lista di tutti i partner (club e sponsor) invitabili per un'opportunità.
    Esclude: se stesso, chi ha già un invito pending, chi ha già una candidatura.
    """
    try:
        club_id = verify_club()
        if not club_id:
            return jsonify({'error': 'Accesso negato'}), 403

        opportunity_id = request.args.get('opportunity_id')
        if not opportunity_id:
            return jsonify({'error': 'opportunity_id obbligatorio'}), 400

        opportunity_id = int(opportunity_id)

        # Verifica che l'opportunità sia del club
        opportunity = MarketplaceOpportunity.query.get(opportunity_id)
        if not opportunity:
            return jsonify({'error': 'Opportunità non trovata'}), 404

        if not (opportunity.creator_type == 'club' and opportunity.creator_id == club_id):
            return jsonify({'error': 'Non sei il proprietario di questa opportunità'}), 403

        # Filtri opzionali
        search = request.args.get('search', '').lower()
        partner_type = request.args.get('type')  # 'club', 'sponsor', o None per entrambi

        # IDs già invitati o con candidatura
        invited_club_ids = set(
            inv.recipient_id for inv in OpportunityInvite.query.filter_by(
                opportunity_id=opportunity_id,
                recipient_type='club',
                stato='pending'
            ).all()
        )
        invited_sponsor_ids = set(
            inv.recipient_id for inv in OpportunityInvite.query.filter_by(
                opportunity_id=opportunity_id,
                recipient_type='sponsor',
                stato='pending'
            ).all()
        )

        applied_club_ids = set(
            app.applicant_id for app in OpportunityApplication.query.filter_by(
                opportunity_id=opportunity_id,
                applicant_type='club'
            ).all()
        )
        applied_sponsor_ids = set(
            app.applicant_id for app in OpportunityApplication.query.filter_by(
                opportunity_id=opportunity_id,
                applicant_type='sponsor'
            ).all()
        )

        partners = []

        # Club (escluso se stesso)
        if partner_type in [None, 'club']:
            clubs = Club.query.filter(Club.id != club_id).all()
            for c in clubs:
                if c.id in invited_club_ids or c.id in applied_club_ids:
                    continue
                if search and search not in c.nome.lower():
                    continue
                partners.append({
                    'id': c.id,
                    'type': 'club',
                    'name': c.nome,
                    'logo': c.logo_url,
                    'tipologia': c.tipologia,
                    'location': c.indirizzo_sede_operativa,
                    'already_invited': False,
                    'already_applied': False
                })

        # Sponsor (tutti quelli della piattaforma)
        if partner_type in [None, 'sponsor']:
            sponsors = Sponsor.query.all()
            for s in sponsors:
                if s.id in invited_sponsor_ids or s.id in applied_sponsor_ids:
                    continue
                if search and search not in s.ragione_sociale.lower():
                    continue
                partners.append({
                    'id': s.id,
                    'type': 'sponsor',
                    'name': s.ragione_sociale,
                    'logo': s.logo_url,
                    'settore': s.settore_merceologico,
                    'location': s.indirizzo_sede_legale,
                    'already_invited': False,
                    'already_applied': False
                })

        # Ordina per nome
        partners.sort(key=lambda x: x['name'].lower())

        return jsonify({
            'partners': partners,
            'total': len(partners),
            'stats': {
                'clubs': len([p for p in partners if p['type'] == 'club']),
                'sponsors': len([p for p in partners if p['type'] == 'sponsor'])
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
