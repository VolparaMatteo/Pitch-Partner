"""
Route per gestione rete sponsor e profili pubblici
- Directory sponsor visibili
- Gestione profilo pubblico sponsor
- Privacy opt-in/opt-out
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import SponsorProfile, Sponsor
from datetime import datetime

sponsor_network_bp = Blueprint('sponsor_network', __name__)


def verify_sponsor():
    """Verifica che l'utente sia uno sponsor e restituisce sponsor_id"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None
    return int(get_jwt_identity())

# ==================== SPONSOR NETWORK - DIRECTORY ====================

@sponsor_network_bp.route('/profiles', methods=['GET'])
@jwt_required()
def get_sponsor_profiles():
    """
    Lista profili pubblici sponsor visibili nella rete
    Query params: settore, dimensione, target_audience, interessi
    """
    try:
        # Solo sponsor possono vedere la directory
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        # Base query: solo profili visibili
        query = SponsorProfile.query.filter_by(visibile_rete_sponsor=True).join(Sponsor)

        # Filtri opzionali
        settore = request.args.get('settore')
        if settore:
            query = query.filter(Sponsor.settore_merceologico.ilike(f'%{settore}%'))

        dimensione = request.args.get('dimensione')
        if dimensione:
            query = query.filter(SponsorProfile.dimensione_azienda == dimensione)

        target = request.args.get('target_audience')
        if target:
            query = query.filter(SponsorProfile.target_audience.ilike(f'%{target}%'))

        # Filtro per interessi co-marketing
        interesse = request.args.get('interesse')
        if interesse == 'eventi':
            query = query.filter(SponsorProfile.interesse_eventi_congiunti == True)
        elif interesse == 'social':
            query = query.filter(SponsorProfile.interesse_campagne_social == True)
        elif interesse == 'promo':
            query = query.filter(SponsorProfile.interesse_promo_incrociate == True)
        elif interesse == 'merchandising':
            query = query.filter(SponsorProfile.interesse_merchandising == True)

        profiles = query.all()

        return jsonify({
            'profiles': [{
                'id': p.id,
                'sponsor_id': p.sponsor_id,
                'ragione_sociale': p.sponsor.ragione_sociale,
                'logo_url': p.sponsor.logo_url,
                'settore_merceologico': p.sponsor.settore_merceologico,
                'descrizione_pubblica': p.descrizione_pubblica,
                'dimensione_azienda': p.dimensione_azienda,
                'target_audience': p.target_audience,
                'anno_fondazione': p.anno_fondazione,
                'interessi': {
                    'eventi_congiunti': p.interesse_eventi_congiunti,
                    'campagne_social': p.interesse_campagne_social,
                    'promo_incrociate': p.interesse_promo_incrociate,
                    'merchandising': p.interesse_merchandising,
                    'altro': p.interesse_altro
                },
                'permetti_messaggi': p.permetti_messaggi,
                'media_pubblici': p.media_pubblici
            } for p in profiles]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_network_bp.route('/profiles/<int:profile_id>', methods=['GET'])
@jwt_required()
def get_sponsor_profile_detail(profile_id):
    """Dettaglio profilo pubblico sponsor specifico"""
    try:
        # Solo sponsor possono vedere profili
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        profile = SponsorProfile.query.get(profile_id)
        if not profile:
            return jsonify({'error': 'Profilo non trovato'}), 404

        # Verifica visibilità
        if not profile.visibile_rete_sponsor:
            return jsonify({'error': 'Profilo non visibile'}), 403

        return jsonify({
            'profile': {
                'id': profile.id,
                'sponsor_id': profile.sponsor_id,
                'ragione_sociale': profile.sponsor.ragione_sociale,
                'logo_url': profile.sponsor.logo_url,
                'settore_merceologico': profile.sponsor.settore_merceologico,
                'sito_web': profile.sponsor.sito_web,
                'descrizione_pubblica': profile.descrizione_pubblica,
                'dimensione_azienda': profile.dimensione_azienda,
                'target_audience': profile.target_audience,
                'anno_fondazione': profile.anno_fondazione,
                'interessi': {
                    'eventi_congiunti': profile.interesse_eventi_congiunti,
                    'campagne_social': profile.interesse_campagne_social,
                    'promo_incrociate': profile.interesse_promo_incrociate,
                    'merchandising': profile.interesse_merchandising,
                    'altro': profile.interesse_altro
                },
                'permetti_messaggi': profile.permetti_messaggi,
                'media_pubblici': profile.media_pubblici,
                'created_at': profile.created_at.isoformat() if profile.created_at else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== SPONSOR PROFILE - GESTIONE PROPRIA ====================

@sponsor_network_bp.route('/my-profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Recupera il proprio profilo pubblico (sponsor only)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        profile = SponsorProfile.query.filter_by(sponsor_id=sponsor.id).first()

        if not profile:
            # Profilo non ancora creato
            return jsonify({'profile': None, 'sponsor_id': sponsor.id}), 200

        return jsonify({
            'profile': {
                'id': profile.id,
                'sponsor_id': profile.sponsor_id,
                'descrizione_pubblica': profile.descrizione_pubblica,
                'dimensione_azienda': profile.dimensione_azienda,
                'target_audience': profile.target_audience,
                'anno_fondazione': profile.anno_fondazione,
                'interesse_eventi_congiunti': profile.interesse_eventi_congiunti,
                'interesse_campagne_social': profile.interesse_campagne_social,
                'interesse_promo_incrociate': profile.interesse_promo_incrociate,
                'interesse_merchandising': profile.interesse_merchandising,
                'interesse_altro': profile.interesse_altro,
                'visibile_rete_sponsor': profile.visibile_rete_sponsor,
                'permetti_messaggi': profile.permetti_messaggi,
                'media_pubblici': profile.media_pubblici,
                'created_at': profile.created_at.isoformat() if profile.created_at else None,
                'updated_at': profile.updated_at.isoformat() if profile.updated_at else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sponsor_network_bp.route('/my-profile', methods=['POST'])
@jwt_required()
def create_my_profile():
    """Crea profilo pubblico sponsor (primo accesso)"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        # Verifica se profilo già esiste
        existing = SponsorProfile.query.filter_by(sponsor_id=sponsor.id).first()
        if existing:
            return jsonify({'error': 'Profilo già esistente'}), 400

        data = request.get_json()

        profile = SponsorProfile(
            sponsor_id=sponsor.id,
            descrizione_pubblica=data.get('descrizione_pubblica'),
            dimensione_azienda=data.get('dimensione_azienda'),
            target_audience=data.get('target_audience'),
            anno_fondazione=data.get('anno_fondazione'),
            interesse_eventi_congiunti=data.get('interesse_eventi_congiunti', False),
            interesse_campagne_social=data.get('interesse_campagne_social', False),
            interesse_promo_incrociate=data.get('interesse_promo_incrociate', False),
            interesse_merchandising=data.get('interesse_merchandising', False),
            interesse_altro=data.get('interesse_altro'),
            visibile_rete_sponsor=data.get('visibile_rete_sponsor', True),
            permetti_messaggi=data.get('permetti_messaggi', True),
            media_pubblici=data.get('media_pubblici', [])
        )

        db.session.add(profile)
        db.session.commit()

        return jsonify({
            'message': 'Profilo creato con successo',
            'profile': {
                'id': profile.id,
                'sponsor_id': profile.sponsor_id,
                'visibile_rete_sponsor': profile.visibile_rete_sponsor,
                'permetti_messaggi': profile.permetti_messaggi
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@sponsor_network_bp.route('/my-profile', methods=['PUT'])
@jwt_required()
def update_my_profile():
    """Aggiorna proprio profilo pubblico sponsor"""
    try:
        sponsor_id = verify_sponsor()
        if not sponsor_id:
            return jsonify({'error': 'Accesso negato'}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404

        profile = SponsorProfile.query.filter_by(sponsor_id=sponsor.id).first()
        if not profile:
            return jsonify({'error': 'Profilo non trovato. Crealo prima con POST'}), 404

        data = request.get_json()

        # Aggiorna campi
        if 'descrizione_pubblica' in data:
            profile.descrizione_pubblica = data['descrizione_pubblica']
        if 'dimensione_azienda' in data:
            profile.dimensione_azienda = data['dimensione_azienda']
        if 'target_audience' in data:
            profile.target_audience = data['target_audience']
        if 'anno_fondazione' in data:
            profile.anno_fondazione = data['anno_fondazione']
        if 'interesse_eventi_congiunti' in data:
            profile.interesse_eventi_congiunti = data['interesse_eventi_congiunti']
        if 'interesse_campagne_social' in data:
            profile.interesse_campagne_social = data['interesse_campagne_social']
        if 'interesse_promo_incrociate' in data:
            profile.interesse_promo_incrociate = data['interesse_promo_incrociate']
        if 'interesse_merchandising' in data:
            profile.interesse_merchandising = data['interesse_merchandising']
        if 'interesse_altro' in data:
            profile.interesse_altro = data['interesse_altro']
        if 'visibile_rete_sponsor' in data:
            profile.visibile_rete_sponsor = data['visibile_rete_sponsor']
        if 'permetti_messaggi' in data:
            profile.permetti_messaggi = data['permetti_messaggi']
        if 'media_pubblici' in data:
            profile.media_pubblici = data['media_pubblici']

        profile.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Profilo aggiornato con successo',
            'profile': {
                'id': profile.id,
                'sponsor_id': profile.sponsor_id,
                'visibile_rete_sponsor': profile.visibile_rete_sponsor,
                'permetti_messaggi': profile.permetti_messaggi,
                'updated_at': profile.updated_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
