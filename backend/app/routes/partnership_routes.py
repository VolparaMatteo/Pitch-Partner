"""
Route per gestione proposte di partnership e partnership attive
- Proposte partnership sponsor-to-sponsor
- Accept/Reject proposte
- Partnership attive
- Club NON vede dettagli proposte, solo notificato quando partnership confermata
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import PartnershipProposal, Partnership, Sponsor, SponsorProfile
from datetime import datetime
from sqlalchemy import or_, and_

partnership_bp = Blueprint('partnerships', __name__)


def verify_sponsor():
    """Verifica che l'utente sia uno sponsor e restituisce sponsor_id"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None
    return int(get_jwt_identity())

# ==================== PARTNERSHIP PROPOSALS ====================

@partnership_bp.route('/proposals/sent', methods=['GET'])
@jwt_required()
def get_sent_proposals():
    """Lista proposte inviate dallo sponsor corrente"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        proposals = PartnershipProposal.query.filter_by(
            proposer_sponsor_id=sponsor.id
        ).order_by(PartnershipProposal.created_at.desc()).all()

        return jsonify({
            'proposals': [{
                'id': p.id,
                'target_sponsor': {
                    'id': p.target_sponsor_id,
                    'ragione_sociale': p.target.ragione_sociale,
                    'logo_url': p.target.logo_url
                },
                'tipo': p.tipo,
                'titolo': p.titolo,
                'descrizione': p.descrizione,
                'budget_stimato': float(p.budget_stimato) if p.budget_stimato else None,
                'data_inizio': p.data_inizio.isoformat() if p.data_inizio else None,
                'data_fine': p.data_fine.isoformat() if p.data_fine else None,
                'documento_url': p.documento_url,
                'status': p.status,
                'risposta_note': p.risposta_note,
                'risposta_data': p.risposta_data.isoformat() if p.risposta_data else None,
                'created_at': p.created_at.isoformat() if p.created_at else None
            } for p in proposals]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@partnership_bp.route('/proposals/received', methods=['GET'])
@jwt_required()
def get_received_proposals():
    """Lista proposte ricevute dallo sponsor corrente"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        proposals = PartnershipProposal.query.filter_by(
            target_sponsor_id=sponsor.id
        ).order_by(PartnershipProposal.created_at.desc()).all()

        return jsonify({
            'proposals': [{
                'id': p.id,
                'proposer_sponsor': {
                    'id': p.proposer_sponsor_id,
                    'ragione_sociale': p.proposer.ragione_sociale,
                    'logo_url': p.proposer.logo_url,
                    'settore_merceologico': p.proposer.settore_merceologico
                },
                'tipo': p.tipo,
                'titolo': p.titolo,
                'descrizione': p.descrizione,
                'budget_stimato': float(p.budget_stimato) if p.budget_stimato else None,
                'data_inizio': p.data_inizio.isoformat() if p.data_inizio else None,
                'data_fine': p.data_fine.isoformat() if p.data_fine else None,
                'documento_url': p.documento_url,
                'status': p.status,
                'created_at': p.created_at.isoformat() if p.created_at else None
            } for p in proposals]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@partnership_bp.route('/proposals', methods=['POST'])
@jwt_required()
def create_proposal():
    """
    Crea nuova proposta di partnership
    Body: { target_sponsor_id, tipo, titolo, descrizione, budget_stimato, data_inizio, data_fine, documento_url }
    """
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        data = request.get_json()
        target_sponsor_id = data.get('target_sponsor_id')
        tipo = data.get('tipo')
        titolo = data.get('titolo')

        if not target_sponsor_id or not tipo or not titolo:
            return jsonify({'error': 'target_sponsor_id, tipo e titolo sono obbligatori'}), 400

        # Verifica esistenza target
        target = Sponsor.query.get(target_sponsor_id)
        if not target:
            return jsonify({'error': 'Sponsor destinatario non trovato'}), 404

        # Non puoi inviare proposta a te stesso
        if target_sponsor_id == sponsor.id:
            return jsonify({'error': 'Non puoi inviare proposte a te stesso'}), 400

        # Verifica che target permetta messaggi/contatti
        target_profile = SponsorProfile.query.filter_by(sponsor_id=target_sponsor_id).first()
        if target_profile and not target_profile.permetti_messaggi:
            return jsonify({'error': 'Questo sponsor ha disabilitato i contatti'}), 403

        # Crea proposta
        proposal = PartnershipProposal(
            club_id=sponsor.club_id,
            proposer_sponsor_id=sponsor.id,
            target_sponsor_id=target_sponsor_id,
            tipo=tipo,
            titolo=titolo,
            descrizione=data.get('descrizione'),
            budget_stimato=data.get('budget_stimato'),
            data_inizio=datetime.strptime(data['data_inizio'], '%Y-%m-%d').date() if data.get('data_inizio') else None,
            data_fine=datetime.strptime(data['data_fine'], '%Y-%m-%d').date() if data.get('data_fine') else None,
            documento_url=data.get('documento_url'),
            status='pending'
        )

        db.session.add(proposal)
        db.session.commit()

        # TODO: Notifica club del contatto (se primo contatto tra questi sponsor)
        # Notifica: "Proposta partnership tra [Sponsor A] e [Sponsor B]"
        # NON include dettagli proposta

        return jsonify({
            'message': 'Proposta creata con successo',
            'proposal': {
                'id': proposal.id,
                'target_sponsor_id': proposal.target_sponsor_id,
                'tipo': proposal.tipo,
                'titolo': proposal.titolo,
                'status': proposal.status,
                'created_at': proposal.created_at.isoformat() if proposal.created_at else None
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@partnership_bp.route('/proposals/<int:proposal_id>', methods=['GET'])
@jwt_required()
def get_proposal_detail(proposal_id):
    """Dettaglio proposta (solo proposer o target)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        proposal = PartnershipProposal.query.get(proposal_id)
        if not proposal:
            return jsonify({'error': 'Proposta non trovata'}), 404

        # Verifica autorizzazione (solo proposer o target)
        if proposal.proposer_sponsor_id != sponsor.id and proposal.target_sponsor_id != sponsor.id:
            return jsonify({'error': 'Non autorizzato a vedere questa proposta'}), 403

        is_proposer = proposal.proposer_sponsor_id == sponsor.id

        return jsonify({
            'proposal': {
                'id': proposal.id,
                'proposer_sponsor': {
                    'id': proposal.proposer_sponsor_id,
                    'ragione_sociale': proposal.proposer.ragione_sociale,
                    'logo_url': proposal.proposer.logo_url
                },
                'target_sponsor': {
                    'id': proposal.target_sponsor_id,
                    'ragione_sociale': proposal.target.ragione_sociale,
                    'logo_url': proposal.target.logo_url
                },
                'tipo': proposal.tipo,
                'titolo': proposal.titolo,
                'descrizione': proposal.descrizione,
                'budget_stimato': float(proposal.budget_stimato) if proposal.budget_stimato else None,
                'data_inizio': proposal.data_inizio.isoformat() if proposal.data_inizio else None,
                'data_fine': proposal.data_fine.isoformat() if proposal.data_fine else None,
                'documento_url': proposal.documento_url,
                'status': proposal.status,
                'risposta_note': proposal.risposta_note,
                'risposta_data': proposal.risposta_data.isoformat() if proposal.risposta_data else None,
                'created_at': proposal.created_at.isoformat() if proposal.created_at else None,
                'is_proposer': is_proposer
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@partnership_bp.route('/proposals/<int:proposal_id>/accept', methods=['POST'])
@jwt_required()
def accept_proposal(proposal_id):
    """
    Accetta proposta partnership (solo target sponsor)
    Crea automaticamente Partnership attiva
    Body: { risposta_note (opzionale) }
    """
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        proposal = PartnershipProposal.query.get(proposal_id)
        if not proposal:
            return jsonify({'error': 'Proposta non trovata'}), 404

        # Solo target può accettare
        if proposal.target_sponsor_id != sponsor.id:
            return jsonify({'error': 'Solo il destinatario può accettare la proposta'}), 403

        if proposal.status != 'pending':
            return jsonify({'error': f'Proposta già gestita (status: {proposal.status})'}), 400

        data = request.get_json() or {}

        # Aggiorna proposta
        proposal.status = 'accepted'
        proposal.risposta_note = data.get('risposta_note')
        proposal.risposta_data = datetime.utcnow()

        # Crea Partnership attiva
        partnership = Partnership(
            club_id=proposal.club_id,
            sponsor_1_id=proposal.proposer_sponsor_id,
            sponsor_2_id=proposal.target_sponsor_id,
            proposal_id=proposal.id,
            tipo=proposal.tipo,
            titolo=proposal.titolo,
            descrizione=proposal.descrizione,
            data_inizio=proposal.data_inizio,
            data_fine=proposal.data_fine,
            status='attiva',
            visibile_pubblico=True,
            club_notificato=False  # Sarà notificato via sistema notifiche
        )

        db.session.add(partnership)
        db.session.commit()

        # TODO: Notifica club della partnership confermata
        # Notifica: "Partnership confermata tra [Sponsor A] e [Sponsor B]: [Titolo]"
        # Include tipo e titolo, NON dettagli privati

        return jsonify({
            'message': 'Proposta accettata e partnership creata con successo',
            'proposal': {
                'id': proposal.id,
                'status': proposal.status,
                'risposta_data': proposal.risposta_data.isoformat()
            },
            'partnership': {
                'id': partnership.id,
                'tipo': partnership.tipo,
                'titolo': partnership.titolo,
                'status': partnership.status,
                'created_at': partnership.created_at.isoformat() if partnership.created_at else None
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@partnership_bp.route('/proposals/<int:proposal_id>/reject', methods=['POST'])
@jwt_required()
def reject_proposal(proposal_id):
    """
    Rifiuta proposta partnership (solo target sponsor)
    Body: { risposta_note (opzionale) }
    """
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        proposal = PartnershipProposal.query.get(proposal_id)
        if not proposal:
            return jsonify({'error': 'Proposta non trovata'}), 404

        # Solo target può rifiutare
        if proposal.target_sponsor_id != sponsor.id:
            return jsonify({'error': 'Solo il destinatario può rifiutare la proposta'}), 403

        if proposal.status != 'pending':
            return jsonify({'error': f'Proposta già gestita (status: {proposal.status})'}), 400

        data = request.get_json() or {}

        # Aggiorna proposta
        proposal.status = 'rejected'
        proposal.risposta_note = data.get('risposta_note')
        proposal.risposta_data = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Proposta rifiutata',
            'proposal': {
                'id': proposal.id,
                'status': proposal.status,
                'risposta_data': proposal.risposta_data.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@partnership_bp.route('/proposals/<int:proposal_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_proposal(proposal_id):
    """Ritira proposta (solo proposer, solo se pending)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        proposal = PartnershipProposal.query.get(proposal_id)
        if not proposal:
            return jsonify({'error': 'Proposta non trovata'}), 404

        # Solo proposer può ritirare
        if proposal.proposer_sponsor_id != sponsor.id:
            return jsonify({'error': 'Solo il proponente può ritirare la proposta'}), 403

        if proposal.status != 'pending':
            return jsonify({'error': f'Non puoi ritirare una proposta già gestita (status: {proposal.status})'}), 400

        proposal.status = 'withdrawn'
        proposal.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Proposta ritirata',
            'proposal': {
                'id': proposal.id,
                'status': proposal.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== PARTNERSHIPS ATTIVE ====================

@partnership_bp.route('/', methods=['GET'])
@jwt_required()
def get_partnerships():
    """
    Lista partnership attive dello sponsor corrente
    """
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        # Partnership dove sponsor è sponsor_1 o sponsor_2
        partnerships = Partnership.query.filter(
            or_(
                Partnership.sponsor_1_id == sponsor.id,
                Partnership.sponsor_2_id == sponsor.id
            )
        ).order_by(Partnership.created_at.desc()).all()

        return jsonify({
            'partnerships': [{
                'id': p.id,
                'partner_sponsor': {
                    'id': p.sponsor_2_id if p.sponsor_1_id == sponsor.id else p.sponsor_1_id,
                    'ragione_sociale': p.sponsor_2.ragione_sociale if p.sponsor_1_id == sponsor.id else p.sponsor_1.ragione_sociale,
                    'logo_url': p.sponsor_2.logo_url if p.sponsor_1_id == sponsor.id else p.sponsor_1.logo_url
                },
                'tipo': p.tipo,
                'titolo': p.titolo,
                'descrizione': p.descrizione,
                'data_inizio': p.data_inizio.isoformat() if p.data_inizio else None,
                'data_fine': p.data_fine.isoformat() if p.data_fine else None,
                'status': p.status,
                'visibile_pubblico': p.visibile_pubblico,
                'created_at': p.created_at.isoformat() if p.created_at else None
            } for p in partnerships]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@partnership_bp.route('/<int:partnership_id>', methods=['GET'])
@jwt_required()
def get_partnership_detail(partnership_id):
    """Dettaglio partnership (solo sponsor coinvolti)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        partnership = Partnership.query.get(partnership_id)
        if not partnership:
            return jsonify({'error': 'Partnership non trovata'}), 404

        # Verifica autorizzazione
        if partnership.sponsor_1_id != sponsor.id and partnership.sponsor_2_id != sponsor.id:
            return jsonify({'error': 'Non autorizzato a vedere questa partnership'}), 403

        return jsonify({
            'partnership': {
                'id': partnership.id,
                'sponsor_1': {
                    'id': partnership.sponsor_1_id,
                    'ragione_sociale': partnership.sponsor_1.ragione_sociale,
                    'logo_url': partnership.sponsor_1.logo_url
                },
                'sponsor_2': {
                    'id': partnership.sponsor_2_id,
                    'ragione_sociale': partnership.sponsor_2.ragione_sociale,
                    'logo_url': partnership.sponsor_2.logo_url
                },
                'tipo': partnership.tipo,
                'titolo': partnership.titolo,
                'descrizione': partnership.descrizione,
                'data_inizio': partnership.data_inizio.isoformat() if partnership.data_inizio else None,
                'data_fine': partnership.data_fine.isoformat() if partnership.data_fine else None,
                'status': partnership.status,
                'visibile_pubblico': partnership.visibile_pubblico,
                'created_at': partnership.created_at.isoformat() if partnership.created_at else None,
                'updated_at': partnership.updated_at.isoformat() if partnership.updated_at else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@partnership_bp.route('/<int:partnership_id>', methods=['PUT'])
@jwt_required()
def update_partnership(partnership_id):
    """
    Aggiorna partnership (entrambi sponsor possono aggiornare)
    Body: { descrizione, data_fine, status, visibile_pubblico }
    """
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        partnership = Partnership.query.get(partnership_id)
        if not partnership:
            return jsonify({'error': 'Partnership non trovata'}), 404

        # Verifica autorizzazione
        if partnership.sponsor_1_id != sponsor.id and partnership.sponsor_2_id != sponsor.id:
            return jsonify({'error': 'Non autorizzato a modificare questa partnership'}), 403

        data = request.get_json()

        # Aggiorna campi
        if 'descrizione' in data:
            partnership.descrizione = data['descrizione']
        if 'data_fine' in data:
            partnership.data_fine = datetime.strptime(data['data_fine'], '%Y-%m-%d').date() if data['data_fine'] else None
        if 'status' in data:
            partnership.status = data['status']
        if 'visibile_pubblico' in data:
            partnership.visibile_pubblico = data['visibile_pubblico']

        partnership.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Partnership aggiornata con successo',
            'partnership': {
                'id': partnership.id,
                'status': partnership.status,
                'updated_at': partnership.updated_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
