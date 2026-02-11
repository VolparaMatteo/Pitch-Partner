from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Sponsor, HeadOfTerms, SponsorAccount, SponsorInvitation, Club
from datetime import datetime, timedelta
from sqlalchemy import func
import secrets


def verify_sponsor():
    """Helper function to verify sponsor role and return sponsor_account_id"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None
    return int(get_jwt_identity())


def get_current_club_id():
    """Get the current club_id from JWT (for multi-club support)"""
    claims = get_jwt()
    return claims.get('current_club_id')


def verify_club():
    """Helper function to verify club role and return club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


sponsor_bp = Blueprint('sponsor', __name__)


@sponsor_bp.route('/sponsor/login', methods=['POST'])
def login():
    """
    Login sponsor - supporta sia nuovo sistema (SponsorAccount) che legacy (Sponsor con password)
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    selected_club_id = data.get('club_id')  # Opzionale: per multi-club

    if not email or not password:
        return jsonify({'error': 'Email e password richiesti'}), 400

    # 1. Prima prova con il nuovo sistema (SponsorAccount)
    sponsor_account = SponsorAccount.query.filter_by(email=email).first()

    if sponsor_account:
        if not sponsor_account.check_password(password):
            return jsonify({'error': 'Credenziali non valide'}), 401

        if not sponsor_account.account_attivo:
            return jsonify({'error': 'Account disattivato'}), 403

        # Ottieni tutti i club attivi dello sponsor
        active_memberships = [m for m in sponsor_account.club_memberships
                              if m.membership_status == 'active' and m.club.account_attivo]

        if not active_memberships:
            return jsonify({'error': 'Nessun club attivo associato al tuo account'}), 403

        # Se c'è un solo club, selezionalo automaticamente
        # Altrimenti usa quello specificato o il primo disponibile
        if selected_club_id:
            current_membership = next((m for m in active_memberships if m.club_id == selected_club_id), None)
            if not current_membership:
                return jsonify({'error': 'Club non trovato o non attivo'}), 403
        else:
            current_membership = active_memberships[0]

        # Aggiorna ultimo accesso
        sponsor_account.ultimo_accesso = datetime.utcnow()
        db.session.commit()

        # Crea token con account_id e current_club
        access_token = create_access_token(
            identity=str(sponsor_account.id),
            additional_claims={
                'role': 'sponsor',
                'auth_type': 'account',
                'current_club_id': current_membership.club_id,
                'membership_id': current_membership.id
            }
        )

        # Prepara lista club per il frontend
        clubs_list = [{
            'id': m.club_id,
            'membership_id': m.id,
            'nome': m.club.nome,
            'logo_url': m.club.logo_url,
            'ruolo': m.ruolo_sponsorship,
            'data_adesione': m.data_adesione.isoformat() if m.data_adesione else None
        } for m in active_memberships]

        return jsonify({
            'access_token': access_token,
            'auth_type': 'account',
            'sponsor': {
                'id': sponsor_account.id,
                'ragione_sociale': sponsor_account.ragione_sociale,
                'email': sponsor_account.email,
                'logo_url': sponsor_account.logo_url
            },
            'current_club': {
                'id': current_membership.club_id,
                'nome': current_membership.club.nome,
                'logo_url': current_membership.club.logo_url
            },
            'clubs': clubs_list,
            'has_multiple_clubs': len(clubs_list) > 1
        }), 200

    # 2. Fallback: prova con sistema legacy (Sponsor con password_hash)
    legacy_sponsor = Sponsor.query.filter_by(email=email).first()

    if legacy_sponsor and legacy_sponsor.password_hash and legacy_sponsor.check_password(password):
        if not legacy_sponsor.account_attivo:
            return jsonify({'error': 'Account disattivato. Contattare il club'}), 403

        if not legacy_sponsor.club.is_licenza_valida() or not legacy_sponsor.club.account_attivo:
            return jsonify({'error': 'Account club non attivo. Contattare il club'}), 403

        access_token = create_access_token(
            identity=str(legacy_sponsor.id),
            additional_claims={
                'role': 'sponsor',
                'auth_type': 'legacy',
                'current_club_id': legacy_sponsor.club_id,
                'membership_id': legacy_sponsor.id
            }
        )

        return jsonify({
            'access_token': access_token,
            'auth_type': 'legacy',
            'sponsor': {
                'id': legacy_sponsor.id,
                'ragione_sociale': legacy_sponsor.ragione_sociale,
                'email': legacy_sponsor.email,
                'logo_url': legacy_sponsor.logo_url
            },
            'current_club': {
                'id': legacy_sponsor.club_id,
                'nome': legacy_sponsor.club.nome,
                'logo_url': legacy_sponsor.club.logo_url
            },
            'clubs': [{
                'id': legacy_sponsor.club_id,
                'membership_id': legacy_sponsor.id,
                'nome': legacy_sponsor.club.nome,
                'logo_url': legacy_sponsor.club.logo_url
            }],
            'has_multiple_clubs': False
        }), 200

    return jsonify({'error': 'Credenziali non valide'}), 401


@sponsor_bp.route('/sponsor/switch-club/<int:club_id>', methods=['POST'])
@jwt_required()
def switch_club(club_id):
    """Cambia il club attivo per uno sponsor multi-club"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    auth_type = claims.get('auth_type')

    if auth_type == 'legacy':
        return jsonify({'error': 'Funzione non disponibile per account legacy'}), 400

    sponsor_account_id = int(get_jwt_identity())
    sponsor_account = SponsorAccount.query.get_or_404(sponsor_account_id)

    # Trova la membership per il club richiesto
    membership = Sponsor.query.filter_by(
        sponsor_account_id=sponsor_account_id,
        club_id=club_id,
        membership_status='active'
    ).first()

    if not membership:
        return jsonify({'error': 'Club non trovato o non attivo'}), 404

    if not membership.club.account_attivo:
        return jsonify({'error': 'Account club non attivo'}), 403

    # Crea nuovo token con il club aggiornato
    access_token = create_access_token(
        identity=str(sponsor_account_id),
        additional_claims={
            'role': 'sponsor',
            'auth_type': 'account',
            'current_club_id': club_id,
            'membership_id': membership.id
        }
    )

    return jsonify({
        'access_token': access_token,
        'current_club': {
            'id': membership.club_id,
            'nome': membership.club.nome,
            'logo_url': membership.club.logo_url
        }
    }), 200


@sponsor_bp.route('/sponsor/my-clubs', methods=['GET'])
@jwt_required()
def get_my_clubs():
    """Lista tutti i club associati allo sponsor"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    auth_type = claims.get('auth_type')

    if auth_type == 'legacy':
        # Per legacy, ritorna solo il club corrente
        membership_id = claims.get('membership_id')
        membership = Sponsor.query.get(membership_id)
        if not membership:
            return jsonify({'error': 'Membership non trovata'}), 404

        return jsonify({
            'clubs': [{
                'id': membership.club_id,
                'membership_id': membership.id,
                'nome': membership.club.nome,
                'logo_url': membership.club.logo_url,
                'ruolo': membership.ruolo_sponsorship,
                'data_adesione': membership.data_adesione.isoformat() if membership.data_adesione else None,
                'is_current': True
            }]
        }), 200

    # Nuovo sistema
    sponsor_account_id = int(get_jwt_identity())
    current_club_id = claims.get('current_club_id')

    memberships = Sponsor.query.filter_by(
        sponsor_account_id=sponsor_account_id,
        membership_status='active'
    ).all()

    clubs_list = []
    for m in memberships:
        if m.club.account_attivo:
            clubs_list.append({
                'id': m.club_id,
                'membership_id': m.id,
                'nome': m.club.nome,
                'logo_url': m.club.logo_url,
                'ruolo': m.ruolo_sponsorship,
                'data_adesione': m.data_adesione.isoformat() if m.data_adesione else None,
                'is_current': m.club_id == current_club_id
            })

    return jsonify({'clubs': clubs_list}), 200


@sponsor_bp.route('/sponsor/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Profilo sponsor - supporta entrambi i sistemi"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    auth_type = claims.get('auth_type', 'legacy')
    current_club_id = claims.get('current_club_id')

    if auth_type == 'account':
        sponsor_account_id = int(get_jwt_identity())
        sponsor_account = SponsorAccount.query.get_or_404(sponsor_account_id)

        # Ottieni la membership corrente
        membership = Sponsor.query.filter_by(
            sponsor_account_id=sponsor_account_id,
            club_id=current_club_id
        ).first()

        return jsonify({
            'id': sponsor_account.id,
            'ragione_sociale': sponsor_account.ragione_sociale,
            'logo_url': sponsor_account.logo_url,
            'email': sponsor_account.email,
            'telefono': sponsor_account.telefono,
            'sito_web': sponsor_account.sito_web,
            'membership': {
                'id': membership.id if membership else None,
                'ruolo': membership.ruolo_sponsorship if membership else None,
                'data_adesione': membership.data_adesione.isoformat() if membership and membership.data_adesione else None
            },
            'club': {
                'id': membership.club.id if membership else None,
                'nome': membership.club.nome if membership else None,
                'logo_url': membership.club.logo_url if membership else None
            } if membership else None
        }), 200

    # Legacy system
    membership_id = claims.get('membership_id')
    sponsor = Sponsor.query.get_or_404(membership_id)

    return jsonify({
        'id': sponsor.id,
        'ragione_sociale': sponsor.ragione_sociale,
        'logo_url': sponsor.logo_url,
        'email': sponsor.email,
        'telefono': sponsor.telefono,
        'sito_web': sponsor.sito_web,
        'club': {
            'id': sponsor.club.id,
            'nome': sponsor.club.nome,
            'logo_url': sponsor.club.logo_url
        }
    }), 200


# ================== CLUB ENDPOINTS ==================

# GET - Lista sponsor del club
@sponsor_bp.route('/club/sponsors', methods=['GET'])
@jwt_required()
def get_club_sponsors():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsors = Sponsor.query.filter_by(club_id=club_id).all()

    sponsors_data = []
    for sponsor in sponsors:
        sponsors_data.append({
            'id': sponsor.id,
            'ragione_sociale': sponsor.ragione_sociale,
            'email': sponsor.email,
            'telefono': sponsor.telefono,
            'sito_web': sponsor.sito_web,
            'logo_url': sponsor.logo_url,
            'settore_merceologico': sponsor.settore_merceologico,
            'account_attivo': sponsor.account_attivo,
            'created_at': sponsor.created_at.isoformat() if sponsor.created_at else None
        })

    return jsonify(sponsors_data), 200


# GET - Analytics sponsor
@sponsor_bp.route('/club/sponsors/analytics', methods=['GET'])
@jwt_required()
def get_sponsors_analytics():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Valore totale contratti attivi
    total_active = db.session.query(func.sum(HeadOfTerms.valore_totale)).filter(
        HeadOfTerms.club_id == club_id,
        HeadOfTerms.stato == 'attivo'
    ).scalar() or 0

    # Nuovi sponsor negli ultimi 12 mesi
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    sponsors_timeline = db.session.query(
        func.strftime('%Y-%m', Sponsor.created_at).label('month'),
        func.count(Sponsor.id).label('count')
    ).filter(
        Sponsor.club_id == club_id,
        Sponsor.created_at >= twelve_months_ago
    ).group_by('month').all()

    timeline_data = [{'month': item[0], 'count': item[1]} for item in sponsors_timeline]

    # Contratti in scadenza (60 giorni)
    sixty_days = datetime.utcnow() + timedelta(days=60)
    expiring = HeadOfTerms.query.filter(
        HeadOfTerms.club_id == club_id,
        HeadOfTerms.stato == 'attivo',
        HeadOfTerms.data_fine <= sixty_days,
        HeadOfTerms.data_fine >= datetime.utcnow()
    ).all()

    expiring_data = []
    for contract in expiring:
        days_left = (contract.data_fine - datetime.utcnow()).days
        expiring_data.append({
            'contract_id': contract.id,
            'contract_name': contract.nome_accordo,
            'sponsor_name': contract.sponsor.ragione_sociale,
            'value': float(contract.valore_totale),
            'expiry_date': contract.data_fine.isoformat(),
            'days_left': days_left
        })

    return jsonify({
        'total_active_value': float(total_active),
        'sponsors_timeline': timeline_data,
        'expiring_contracts': expiring_data
    }), 200


# POST - Crea nuovo sponsor (con sistema inviti)
@sponsor_bp.route('/club/sponsors', methods=['POST'])
@jwt_required()
def create_sponsor():
    """
    Crea un nuovo sponsor in stato 'pending' e genera un link di invito.
    Lo sponsor dovrà cliccare il link per registrarsi/unirsi.
    """
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione - solo ragione_sociale obbligatoria
    if not data.get('ragione_sociale'):
        return jsonify({'error': 'Ragione sociale richiesta'}), 400

    club = Club.query.get(club_id)

    # Crea la membership in stato pending (senza password, senza account)
    sponsor = Sponsor(
        club_id=club_id,
        ragione_sociale=data['ragione_sociale'],
        email=data.get('email', ''),  # Email opzionale, suggerita
        telefono=data.get('telefono'),
        sito_web=data.get('sito_web'),
        logo_url=data.get('logo_url'),
        settore_merceologico=data.get('settore_merceologico'),
        membership_status='pending',  # In attesa che lo sponsor accetti l'invito
        account_attivo=True,
        note_interne_club=data.get('note_interne'),
        ruolo_sponsorship=data.get('ruolo_sponsorship')
    )

    db.session.add(sponsor)
    db.session.flush()  # Per ottenere l'ID

    # Genera il token di invito
    token = secrets.token_urlsafe(32)

    invitation = SponsorInvitation(
        club_id=club_id,
        token=token,
        email_suggerita=data.get('email'),
        ragione_sociale_suggerita=data['ragione_sociale'],
        settore_suggerito=data.get('settore_merceologico'),
        note_club=data.get('note_interne'),
        status='pending',
        expires_at=datetime.utcnow() + timedelta(days=30),  # Scade in 30 giorni
        sponsor_membership_id=sponsor.id
    )

    db.session.add(invitation)

    # Collega l'invito allo sponsor
    sponsor.from_invitation_id = invitation.id

    db.session.commit()

    return jsonify({
        'message': 'Sponsor creato con successo. Condividi il link di invito.',
        'sponsor': {
            'id': sponsor.id,
            'ragione_sociale': sponsor.ragione_sociale,
            'email': sponsor.email,
            'membership_status': sponsor.membership_status
        },
        'invitation': {
            'id': invitation.id,
            'token': invitation.token,
            'link': f'/join/sponsor/{invitation.token}',
            'expires_at': invitation.expires_at.isoformat(),
            'status': invitation.status
        }
    }), 201


# GET - Ottieni/Rigenera invito per uno sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/invitation', methods=['GET'])
@jwt_required()
def get_sponsor_invitation(sponsor_id):
    """Ottieni il link di invito corrente per uno sponsor"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Trova l'invito attivo
    invitation = SponsorInvitation.query.filter_by(
        club_id=club_id,
        sponsor_membership_id=sponsor_id,
        status='pending'
    ).first()

    if not invitation or invitation.is_expired():
        return jsonify({
            'has_invitation': False,
            'message': 'Nessun invito attivo. Genera un nuovo invito.'
        }), 200

    return jsonify({
        'has_invitation': True,
        'invitation': {
            'id': invitation.id,
            'token': invitation.token,
            'link': f'/join/sponsor/{invitation.token}',
            'expires_at': invitation.expires_at.isoformat(),
            'email_suggerita': invitation.email_suggerita,
            'status': invitation.status,
            'created_at': invitation.created_at.isoformat() if invitation.created_at else None
        }
    }), 200


# POST - Rigenera invito per uno sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/invitation/regenerate', methods=['POST'])
@jwt_required()
def regenerate_sponsor_invitation(sponsor_id):
    """Genera un nuovo link di invito (invalida il precedente)"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if sponsor.membership_status == 'active':
        return jsonify({'error': 'Lo sponsor ha già accettato l\'invito'}), 400

    # Cancella inviti precedenti
    SponsorInvitation.query.filter_by(
        club_id=club_id,
        sponsor_membership_id=sponsor_id,
        status='pending'
    ).update({'status': 'cancelled'})

    # Genera nuovo invito
    token = secrets.token_urlsafe(32)

    invitation = SponsorInvitation(
        club_id=club_id,
        token=token,
        email_suggerita=sponsor.email,
        ragione_sociale_suggerita=sponsor.ragione_sociale,
        settore_suggerito=sponsor.settore_merceologico,
        status='pending',
        expires_at=datetime.utcnow() + timedelta(days=30),
        sponsor_membership_id=sponsor_id
    )

    db.session.add(invitation)
    sponsor.from_invitation_id = invitation.id
    db.session.commit()

    return jsonify({
        'message': 'Nuovo invito generato',
        'invitation': {
            'id': invitation.id,
            'token': invitation.token,
            'link': f'/join/sponsor/{invitation.token}',
            'expires_at': invitation.expires_at.isoformat(),
            'status': invitation.status
        }
    }), 201


# GET - Dettaglio sponsor (completo)
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>', methods=['GET'])
@jwt_required()
def get_sponsor_detail(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)

    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Lead Journey - se lo sponsor proviene da una lead
    lead_journey = None
    if sponsor.from_lead_id:
        from app.models import Lead, LeadActivity, LeadStageHistory
        lead = Lead.query.get(sponsor.from_lead_id)
        if lead:
            # Storico fasi della lead
            stage_history = LeadStageHistory.query.filter_by(lead_id=lead.id).order_by(LeadStageHistory.changed_at.asc()).all()
            # Attività della lead
            activities = LeadActivity.query.filter_by(lead_id=lead.id).order_by(LeadActivity.data_attivita.desc()).limit(10).all()

            lead_journey = {
                'lead_id': lead.id,
                'ragione_sociale': lead.ragione_sociale,
                'created_at': lead.created_at.isoformat() if lead.created_at else None,
                'data_conversione': sponsor.data_conversione_lead.isoformat() if sponsor.data_conversione_lead else None,
                'fonte': lead.fonte,
                'valore_stimato': lead.valore_stimato,
                'probabilita_chiusura': lead.probabilita_chiusura,
                'giorni_in_pipeline': (sponsor.data_conversione_lead - lead.created_at).days if sponsor.data_conversione_lead and lead.created_at else None,
                'stage_history': [{
                    'from_status': sh.from_status,
                    'to_status': sh.to_status,
                    'changed_at': sh.changed_at.isoformat() if sh.changed_at else None,
                    'note': sh.note
                } for sh in stage_history],
                'activities_count': LeadActivity.query.filter_by(lead_id=lead.id).count(),
                'recent_activities': [{
                    'tipo': a.tipo,
                    'titolo': a.titolo,
                    'data_attivita': a.data_attivita.isoformat() if a.data_attivita else None
                } for a in activities]
            }

    return jsonify({
        'id': sponsor.id,
        'ragione_sociale': sponsor.ragione_sociale,
        'partita_iva': sponsor.partita_iva,
        'codice_fiscale': sponsor.codice_fiscale,
        'settore_merceologico': sponsor.settore_merceologico,
        'logo_url': sponsor.logo_url,
        'indirizzo_sede': sponsor.indirizzo_sede,
        'email': sponsor.email,
        'telefono': sponsor.telefono,
        'sito_web': sponsor.sito_web,
        'facebook': sponsor.facebook,
        'instagram': sponsor.instagram,
        'tiktok': sponsor.tiktok,
        'linkedin': sponsor.linkedin,
        'twitter': sponsor.twitter,
        'referente_nome': sponsor.referente_nome,
        'referente_cognome': sponsor.referente_cognome,
        'referente_ruolo': sponsor.referente_ruolo,
        'referente_contatto': sponsor.referente_contatto,
        'account_attivo': sponsor.account_attivo,
        'created_at': sponsor.created_at.isoformat() if sponsor.created_at else None,
        'updated_at': sponsor.updated_at.isoformat() if sponsor.updated_at else None,
        # Membership info
        'membership_status': sponsor.membership_status or 'active',  # Default 'active' per backward compat
        'data_adesione': sponsor.data_adesione.isoformat() if sponsor.data_adesione else None,
        'ruolo_sponsorship': sponsor.ruolo_sponsorship,
        'note_interne_club': sponsor.note_interne_club,
        'has_sponsor_account': sponsor.sponsor_account_id is not None,
        # Lead Journey
        'from_lead_id': sponsor.from_lead_id,
        'lead_journey': lead_journey
    }), 200


# GET - Proposte dello sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/proposals', methods=['GET'])
@jwt_required()
def get_sponsor_proposals(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import Proposal

    proposals = Proposal.query.filter_by(
        club_id=club_id,
        sponsor_id=sponsor_id
    ).order_by(Proposal.created_at.desc()).all()

    return jsonify([{
        'id': p.id,
        'codice': p.codice,
        'titolo': p.titolo,
        'stato': p.stato,
        'valore_totale': p.valore_totale,
        'valore_finale': p.valore_finale,
        'sconto_percentuale': p.sconto_percentuale,
        'data_scadenza': p.data_scadenza.isoformat() if p.data_scadenza else None,
        'created_at': p.created_at.isoformat() if p.created_at else None,
        'link_condivisione': p.link_condivisione,
        'link_attivo': p.link_attivo,
        'visualizzazioni': p.visualizzazioni
    } for p in proposals]), 200


# GET - Contratti dello sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/contracts', methods=['GET'])
@jwt_required()
def get_sponsor_contracts(sponsor_id):
    """Lista contratti di uno sponsor"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import Asset

    contracts = HeadOfTerms.query.filter_by(
        club_id=club_id,
        sponsor_id=sponsor_id
    ).order_by(HeadOfTerms.data_inizio.desc()).all()

    contracts_data = []
    for c in contracts:
        # Calcola statistiche asset
        assets = Asset.query.filter_by(head_of_terms_id=c.id).all()
        assets_count = len(assets)
        assets_completati = len([a for a in assets if a.status == 'completato'])

        contracts_data.append({
            'id': c.id,
            'nome_contratto': c.nome_contratto,
            'compenso': c.compenso,
            'descrizione': c.descrizione,
            'data_inizio': c.data_inizio.isoformat() if c.data_inizio else None,
            'data_fine': c.data_fine.isoformat() if c.data_fine else None,
            'status': c.status,
            'file_contratto_url': c.file_contratto_url,
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'assets_count': assets_count,
            'assets_completati': assets_completati,
            'progresso': round((assets_completati / assets_count * 100) if assets_count > 0 else 0)
        })

    # Calcola statistiche aggregate
    totale_valore = sum(c.compenso or 0 for c in contracts)
    contratti_attivi = len([c for c in contracts if c.status == 'attivo'])
    contratti_scaduti = len([c for c in contracts if c.status == 'scaduto'])

    return jsonify({
        'contracts': contracts_data,
        'stats': {
            'totale': len(contracts),
            'attivi': contratti_attivi,
            'scaduti': contratti_scaduti,
            'valore_totale': totale_valore
        }
    }), 200


# GET - Asset allocati allo sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/assets', methods=['GET'])
@jwt_required()
def get_sponsor_assets(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import AssetAllocation, InventoryAsset

    # Asset allocati direttamente allo sponsor
    allocations = AssetAllocation.query.filter_by(
        sponsor_id=sponsor_id
    ).all()

    assets_data = []
    for alloc in allocations:
        if alloc.asset_id:
            asset = InventoryAsset.query.get(alloc.asset_id)
            if asset:
                assets_data.append({
                    'id': asset.id,
                    'nome': asset.nome,
                    'tipo': asset.tipo,
                    'categoria': asset.category.nome if asset.category else None,
                    'posizione': asset.posizione,
                    'dimensioni': asset.dimensioni,
                    'immagine_principale': asset.immagine_principale,
                    'immagine_url': asset.immagine_principale,
                    'prezzo_listino': asset.prezzo_listino,
                    'prezzo': alloc.prezzo_concordato or asset.prezzo_listino or 0,
                    'quantita_totale': asset.quantita_totale,
                    'quantita_allocata': alloc.quantita or 1,
                    'allocation': {
                        'id': alloc.id,
                        'stagione': alloc.stagione,
                        'data_inizio': alloc.data_inizio.isoformat() if alloc.data_inizio else None,
                        'data_fine': alloc.data_fine.isoformat() if alloc.data_fine else None,
                        'quantita': alloc.quantita,
                        'prezzo_concordato': alloc.prezzo_concordato,
                        'stato': alloc.status,
                        'contract_id': alloc.contract_id
                    }
                })

    return jsonify({
        'total': len(assets_data),
        'assets': assets_data
    }), 200


# PUT - Aggiorna sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>', methods=['PUT'])
@jwt_required()
def update_sponsor(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)

    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Aggiorna campi
    if 'ragione_sociale' in data:
        sponsor.ragione_sociale = data['ragione_sociale']
    if 'email' in data:
        # Verifica email univoca
        existing = Sponsor.query.filter_by(email=data['email']).first()
        if existing and existing.id != sponsor_id:
            return jsonify({'error': 'Email già in uso'}), 400
        sponsor.email = data['email']
    if 'telefono' in data:
        sponsor.telefono = data['telefono']
    if 'sito_web' in data:
        sponsor.sito_web = data['sito_web']
    if 'logo_url' in data:
        sponsor.logo_url = data['logo_url']
    if 'settore_merceologico' in data:
        sponsor.settore_merceologico = data['settore_merceologico']
    if 'account_attivo' in data:
        sponsor.account_attivo = data['account_attivo']
    if 'password' in data and data['password']:
        sponsor.set_password(data['password'])

    db.session.commit()

    return jsonify({
        'message': 'Sponsor aggiornato con successo',
        'sponsor': {
            'id': sponsor.id,
            'ragione_sociale': sponsor.ragione_sociale,
            'email': sponsor.email
        }
    }), 200


# DELETE - Elimina sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>', methods=['DELETE'])
@jwt_required()
def delete_sponsor(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)

    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Verifica che non ci siano contratti attivi
    active_contracts = HeadOfTerms.query.filter_by(
        sponsor_id=sponsor_id,
        stato='attivo'
    ).count()

    if active_contracts > 0:
        return jsonify({'error': 'Impossibile eliminare: lo sponsor ha contratti attivi'}), 400

    db.session.delete(sponsor)
    db.session.commit()

    return jsonify({'message': 'Sponsor eliminato con successo'}), 200


# ================== SPONSOR DRIVE ENDPOINTS ==================

# GET - Lista file nel drive dello sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/drive', methods=['GET'])
@jwt_required()
def get_sponsor_drive(sponsor_id):
    """Lista file nel drive condiviso con filtri"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import SponsorDriveFile

    # Filtri opzionali
    contract_id = request.args.get('contract_id', type=int)
    activation_id = request.args.get('activation_id', type=int)
    event_activation_id = request.args.get('event_activation_id', type=int)
    inventory_asset_id = request.args.get('inventory_asset_id', type=int)
    categoria = request.args.get('categoria')
    cartella = request.args.get('cartella')
    search = request.args.get('search')

    query = SponsorDriveFile.query.filter_by(
        club_id=club_id,
        sponsor_id=sponsor_id,
        stato='attivo'
    )

    # Filtro per entità collegata
    if contract_id:
        query = query.filter_by(contract_id=contract_id)
    if activation_id:
        query = query.filter_by(activation_id=activation_id)
    if event_activation_id:
        query = query.filter_by(event_activation_id=event_activation_id)
    if inventory_asset_id:
        query = query.filter_by(inventory_asset_id=inventory_asset_id)
    if categoria:
        query = query.filter_by(categoria=categoria)
    if cartella:
        query = query.filter_by(cartella=cartella)
    if search:
        query = query.filter(SponsorDriveFile.nome.ilike(f'%{search}%'))

    files = query.order_by(SponsorDriveFile.created_at.desc()).all()

    files_data = []
    for f in files:
        import json
        tags = []
        if f.tags:
            try:
                tags = json.loads(f.tags)
            except:
                pass

        files_data.append({
            'id': f.id,
            'nome': f.nome,
            'file_url': f.file_url,
            'file_size': f.file_size,
            'file_type': f.file_type,
            'estensione': f.estensione,
            'descrizione': f.descrizione,
            'categoria': f.categoria,
            'cartella': f.cartella,
            'tags': tags,
            'contract_id': f.contract_id,
            'contract_nome': f.contract.nome_contratto if f.contract else None,
            'activation_id': f.activation_id,
            'event_activation_id': f.event_activation_id,
            'inventory_asset_id': f.inventory_asset_id,
            'inventory_asset_nome': f.inventory_asset.nome if f.inventory_asset else None,
            'caricato_da': f.caricato_da,
            'caricato_da_nome': f.caricato_da_nome,
            'thumbnail_url': f.thumbnail_url,
            'created_at': f.created_at.isoformat() if f.created_at else None,
            'updated_at': f.updated_at.isoformat() if f.updated_at else None
        })

    return jsonify({
        'total': len(files_data),
        'files': files_data
    }), 200


# GET - Struttura cartelle del drive
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/drive/folders', methods=['GET'])
@jwt_required()
def get_sponsor_drive_folders(sponsor_id):
    """Lista cartelle uniche nel drive"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import SponsorDriveFile

    folders = db.session.query(SponsorDriveFile.cartella).filter_by(
        club_id=club_id,
        sponsor_id=sponsor_id,
        stato='attivo'
    ).distinct().all()

    # Conta file per cartella
    folder_data = []
    for (folder,) in folders:
        count = SponsorDriveFile.query.filter_by(
            club_id=club_id,
            sponsor_id=sponsor_id,
            cartella=folder,
            stato='attivo'
        ).count()
        folder_data.append({
            'path': folder,
            'name': folder.split('/')[-1] if folder != '/' else 'Root',
            'files_count': count
        })

    return jsonify(folder_data), 200


# POST - Carica file nel drive
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/drive', methods=['POST'])
@jwt_required()
def upload_sponsor_drive_file(sponsor_id):
    """Carica un nuovo file nel drive"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import SponsorDriveFile, Club
    import json

    data = request.get_json()

    # Validazione campi richiesti
    if not data.get('nome') or not data.get('file_url'):
        return jsonify({'error': 'Nome e file_url sono richiesti'}), 400

    # Ottieni info club per nome caricatore
    club = Club.query.get(club_id)

    # Prepara tags come JSON
    tags_json = None
    if data.get('tags'):
        tags_json = json.dumps(data['tags']) if isinstance(data['tags'], list) else data['tags']

    file = SponsorDriveFile(
        club_id=club_id,
        sponsor_id=sponsor_id,
        nome=data['nome'],
        file_url=data['file_url'],
        file_size=data.get('file_size'),
        file_type=data.get('file_type'),
        estensione=data.get('estensione'),
        descrizione=data.get('descrizione'),
        categoria=data.get('categoria', 'altro'),
        cartella=data.get('cartella', '/'),
        tags=tags_json,
        contract_id=data.get('contract_id'),
        activation_id=data.get('activation_id'),
        event_activation_id=data.get('event_activation_id'),
        inventory_asset_id=data.get('inventory_asset_id'),
        caricato_da='club',
        caricato_da_nome=club.nome if club else None,
        thumbnail_url=data.get('thumbnail_url')
    )

    db.session.add(file)
    db.session.commit()

    return jsonify({
        'message': 'File caricato con successo',
        'file': {
            'id': file.id,
            'nome': file.nome,
            'file_url': file.file_url
        }
    }), 201


# PUT - Aggiorna metadati file
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/drive/<int:file_id>', methods=['PUT'])
@jwt_required()
def update_sponsor_drive_file(sponsor_id, file_id):
    """Aggiorna metadati e associazioni di un file"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import SponsorDriveFile
    import json

    file = SponsorDriveFile.query.get_or_404(file_id)
    if file.sponsor_id != sponsor_id or file.club_id != club_id:
        return jsonify({'error': 'File non trovato'}), 404

    data = request.get_json()

    # Aggiorna metadati
    if 'nome' in data:
        file.nome = data['nome']
    if 'descrizione' in data:
        file.descrizione = data['descrizione']
    if 'categoria' in data:
        file.categoria = data['categoria']
    if 'cartella' in data:
        file.cartella = data['cartella']
    if 'tags' in data:
        file.tags = json.dumps(data['tags']) if isinstance(data['tags'], list) else data['tags']

    # Aggiorna associazioni entità
    if 'contract_id' in data:
        file.contract_id = data['contract_id']
    if 'activation_id' in data:
        file.activation_id = data['activation_id']
    if 'event_activation_id' in data:
        file.event_activation_id = data['event_activation_id']
    if 'inventory_asset_id' in data:
        file.inventory_asset_id = data['inventory_asset_id']

    # Aggiorna visibilità
    if 'visibile_sponsor' in data:
        file.visibile_sponsor = data['visibile_sponsor']
    if 'visibile_club' in data:
        file.visibile_club = data['visibile_club']

    db.session.commit()

    return jsonify({
        'message': 'File aggiornato con successo',
        'file': {
            'id': file.id,
            'nome': file.nome
        }
    }), 200


# DELETE - Elimina file dal drive
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/drive/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_sponsor_drive_file(sponsor_id, file_id):
    """Elimina un file (soft delete)"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import SponsorDriveFile

    file = SponsorDriveFile.query.get_or_404(file_id)
    if file.sponsor_id != sponsor_id or file.club_id != club_id:
        return jsonify({'error': 'File non trovato'}), 404

    # Soft delete
    file.stato = 'eliminato'
    db.session.commit()

    return jsonify({'message': 'File eliminato con successo'}), 200


# GET - Statistiche drive sponsor
@sponsor_bp.route('/club/sponsors/<int:sponsor_id>/drive/stats', methods=['GET'])
@jwt_required()
def get_sponsor_drive_stats(sponsor_id):
    """Statistiche del drive dello sponsor"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.get_or_404(sponsor_id)
    if sponsor.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import SponsorDriveFile

    # Totale file attivi
    total_files = SponsorDriveFile.query.filter_by(
        club_id=club_id,
        sponsor_id=sponsor_id,
        stato='attivo'
    ).count()

    # Dimensione totale
    total_size = db.session.query(func.sum(SponsorDriveFile.file_size)).filter_by(
        club_id=club_id,
        sponsor_id=sponsor_id,
        stato='attivo'
    ).scalar() or 0

    # File per categoria
    by_category = db.session.query(
        SponsorDriveFile.categoria,
        func.count(SponsorDriveFile.id)
    ).filter_by(
        club_id=club_id,
        sponsor_id=sponsor_id,
        stato='attivo'
    ).group_by(SponsorDriveFile.categoria).all()

    # File collegati a entità
    files_with_contract = SponsorDriveFile.query.filter(
        SponsorDriveFile.club_id == club_id,
        SponsorDriveFile.sponsor_id == sponsor_id,
        SponsorDriveFile.stato == 'attivo',
        SponsorDriveFile.contract_id.isnot(None)
    ).count()

    files_with_activation = SponsorDriveFile.query.filter(
        SponsorDriveFile.club_id == club_id,
        SponsorDriveFile.sponsor_id == sponsor_id,
        SponsorDriveFile.stato == 'attivo',
        (SponsorDriveFile.activation_id.isnot(None)) | (SponsorDriveFile.event_activation_id.isnot(None))
    ).count()

    files_with_asset = SponsorDriveFile.query.filter(
        SponsorDriveFile.club_id == club_id,
        SponsorDriveFile.sponsor_id == sponsor_id,
        SponsorDriveFile.stato == 'attivo',
        SponsorDriveFile.inventory_asset_id.isnot(None)
    ).count()

    return jsonify({
        'total_files': total_files,
        'total_size_bytes': total_size,
        'by_category': [{'categoria': cat, 'count': count} for cat, count in by_category],
        'files_with_contract': files_with_contract,
        'files_with_activation': files_with_activation,
        'files_with_asset': files_with_asset
    }), 200


# ================== PUBLIC INVITATION ENDPOINTS ==================
# Questi endpoint sono pubblici (no auth) per permettere agli sponsor di registrarsi

@sponsor_bp.route('/public/invitation/<token>', methods=['GET'])
def get_invitation_details(token):
    """
    Ottieni i dettagli di un invito (pubblico, senza auth)
    Lo sponsor vede le info del club e può decidere se registrarsi
    """
    invitation = SponsorInvitation.query.filter_by(token=token).first()

    if not invitation:
        return jsonify({'error': 'Invito non trovato'}), 404

    if invitation.status == 'accepted':
        return jsonify({'error': 'Invito già utilizzato'}), 400

    if invitation.status == 'cancelled':
        return jsonify({'error': 'Invito annullato'}), 400

    if invitation.is_expired():
        return jsonify({'error': 'Invito scaduto', 'expired': True}), 400

    club = invitation.club

    return jsonify({
        'valid': True,
        'invitation': {
            'id': invitation.id,
            'email_suggerita': invitation.email_suggerita,
            'ragione_sociale_suggerita': invitation.ragione_sociale_suggerita,
            'settore_suggerito': invitation.settore_suggerito,
            'expires_at': invitation.expires_at.isoformat()
        },
        'club': {
            'id': club.id,
            'nome': club.nome,
            'logo_url': club.logo_url,
            'tipologia': club.tipologia
        }
    }), 200


@sponsor_bp.route('/public/invitation/<token>/check-email', methods=['POST'])
def check_invitation_email(token):
    """
    Verifica se un'email è già registrata su Pitch Partner
    Lo sponsor può inserire un'email diversa da quella suggerita dal club
    """
    invitation = SponsorInvitation.query.filter_by(token=token).first()

    if not invitation or not invitation.is_valid():
        return jsonify({'error': 'Invito non valido o scaduto'}), 400

    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email richiesta'}), 400

    # Verifica se l'email esiste già come SponsorAccount
    existing_account = SponsorAccount.query.filter_by(email=email).first()

    if existing_account:
        # Verifica se è già membro di questo club
        existing_membership = Sponsor.query.filter_by(
            sponsor_account_id=existing_account.id,
            club_id=invitation.club_id
        ).first()

        if existing_membership:
            if existing_membership.membership_status == 'active':
                return jsonify({
                    'exists': True,
                    'already_member': True,
                    'message': 'Sei già sponsor di questo club'
                }), 200
            else:
                return jsonify({
                    'exists': True,
                    'already_member': True,
                    'pending': True,
                    'message': 'Hai già una richiesta in sospeso per questo club'
                }), 200

        return jsonify({
            'exists': True,
            'already_member': False,
            'message': 'Account esistente. Effettua il login per unirti al club.',
            'account': {
                'ragione_sociale': existing_account.ragione_sociale,
                'logo_url': existing_account.logo_url
            }
        }), 200

    # Email non registrata
    return jsonify({
        'exists': False,
        'message': 'Email non registrata. Puoi creare un nuovo account.'
    }), 200


@sponsor_bp.route('/public/invitation/<token>/register', methods=['POST'])
def register_and_join(token):
    """
    Registra un nuovo account sponsor e accetta l'invito
    Per sponsor che non hanno ancora un account Pitch Partner
    """
    invitation = SponsorInvitation.query.filter_by(token=token).first()

    if not invitation or not invitation.is_valid():
        return jsonify({'error': 'Invito non valido o scaduto'}), 400

    data = request.get_json()

    # Validazione
    required_fields = ['email', 'password', 'ragione_sociale']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Campo {field} richiesto'}), 400

    email = data['email']

    # Verifica che l'email non sia già in uso
    if SponsorAccount.query.filter_by(email=email).first():
        return jsonify({'error': 'Email già registrata. Effettua il login.'}), 400

    # Crea il nuovo account sponsor
    sponsor_account = SponsorAccount(
        email=email,
        ragione_sociale=data['ragione_sociale'],
        partita_iva=data.get('partita_iva'),
        codice_fiscale=data.get('codice_fiscale'),
        settore_merceologico=data.get('settore_merceologico', invitation.settore_suggerito),
        logo_url=data.get('logo_url'),
        indirizzo_sede=data.get('indirizzo_sede'),
        telefono=data.get('telefono'),
        sito_web=data.get('sito_web'),
        account_attivo=True
    )
    sponsor_account.set_password(data['password'])

    db.session.add(sponsor_account)
    db.session.flush()

    # Trova o crea la membership
    membership = Sponsor.query.get(invitation.sponsor_membership_id) if invitation.sponsor_membership_id else None

    if membership:
        # Aggiorna la membership esistente (creata dal club)
        membership.sponsor_account_id = sponsor_account.id
        membership.membership_status = 'active'
        membership.data_adesione = datetime.utcnow()
        # Aggiorna i dati con quelli forniti dallo sponsor
        membership.ragione_sociale = data['ragione_sociale']
        membership.email = email
    else:
        # Crea una nuova membership
        membership = Sponsor(
            club_id=invitation.club_id,
            sponsor_account_id=sponsor_account.id,
            ragione_sociale=data['ragione_sociale'],
            email=email,
            settore_merceologico=data.get('settore_merceologico'),
            membership_status='active',
            data_adesione=datetime.utcnow(),
            account_attivo=True,
            from_invitation_id=invitation.id
        )
        db.session.add(membership)
        db.session.flush()

    # Aggiorna l'invito
    invitation.status = 'accepted'
    invitation.accepted_at = datetime.utcnow()
    invitation.accepted_by_account_id = sponsor_account.id
    invitation.sponsor_membership_id = membership.id

    db.session.commit()

    # Crea token di accesso
    access_token = create_access_token(
        identity=str(sponsor_account.id),
        additional_claims={
            'role': 'sponsor',
            'auth_type': 'account',
            'current_club_id': invitation.club_id,
            'membership_id': membership.id
        }
    )

    return jsonify({
        'message': 'Registrazione completata! Benvenuto su Pitch Partner.',
        'access_token': access_token,
        'sponsor': {
            'id': sponsor_account.id,
            'ragione_sociale': sponsor_account.ragione_sociale,
            'email': sponsor_account.email
        },
        'club': {
            'id': invitation.club.id,
            'nome': invitation.club.nome,
            'logo_url': invitation.club.logo_url
        }
    }), 201


@sponsor_bp.route('/public/invitation/<token>/login-join', methods=['POST'])
def login_and_join(token):
    """
    Login con account esistente e accetta l'invito
    Per sponsor che hanno già un account Pitch Partner
    """
    invitation = SponsorInvitation.query.filter_by(token=token).first()

    if not invitation or not invitation.is_valid():
        return jsonify({'error': 'Invito non valido o scaduto'}), 400

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email e password richiesti'}), 400

    # Trova l'account sponsor
    sponsor_account = SponsorAccount.query.filter_by(email=email).first()

    if not sponsor_account or not sponsor_account.check_password(password):
        return jsonify({'error': 'Credenziali non valide'}), 401

    if not sponsor_account.account_attivo:
        return jsonify({'error': 'Account disattivato'}), 403

    # Verifica se è già membro di questo club
    existing_membership = Sponsor.query.filter_by(
        sponsor_account_id=sponsor_account.id,
        club_id=invitation.club_id
    ).first()

    if existing_membership and existing_membership.membership_status == 'active':
        return jsonify({'error': 'Sei già sponsor di questo club'}), 400

    # Trova o crea la membership
    if invitation.sponsor_membership_id:
        membership = Sponsor.query.get(invitation.sponsor_membership_id)
        if membership:
            # Aggiorna la membership esistente
            membership.sponsor_account_id = sponsor_account.id
            membership.membership_status = 'active'
            membership.data_adesione = datetime.utcnow()
            membership.email = email
    else:
        # Crea nuova membership
        membership = Sponsor(
            club_id=invitation.club_id,
            sponsor_account_id=sponsor_account.id,
            ragione_sociale=sponsor_account.ragione_sociale,
            email=email,
            settore_merceologico=sponsor_account.settore_merceologico,
            membership_status='active',
            data_adesione=datetime.utcnow(),
            account_attivo=True,
            from_invitation_id=invitation.id
        )
        db.session.add(membership)
        db.session.flush()

    # Aggiorna l'invito
    invitation.status = 'accepted'
    invitation.accepted_at = datetime.utcnow()
    invitation.accepted_by_account_id = sponsor_account.id
    invitation.sponsor_membership_id = membership.id

    # Aggiorna ultimo accesso
    sponsor_account.ultimo_accesso = datetime.utcnow()

    db.session.commit()

    # Ottieni tutti i club dello sponsor
    all_memberships = Sponsor.query.filter_by(
        sponsor_account_id=sponsor_account.id,
        membership_status='active'
    ).all()

    clubs_list = [{
        'id': m.club_id,
        'membership_id': m.id,
        'nome': m.club.nome,
        'logo_url': m.club.logo_url,
        'ruolo': m.ruolo_sponsorship,
        'is_new': m.id == membership.id
    } for m in all_memberships if m.club.account_attivo]

    # Crea token di accesso
    access_token = create_access_token(
        identity=str(sponsor_account.id),
        additional_claims={
            'role': 'sponsor',
            'auth_type': 'account',
            'current_club_id': invitation.club_id,
            'membership_id': membership.id
        }
    )

    return jsonify({
        'message': f'Benvenuto! Ti sei unito a {invitation.club.nome}.',
        'access_token': access_token,
        'sponsor': {
            'id': sponsor_account.id,
            'ragione_sociale': sponsor_account.ragione_sociale,
            'email': sponsor_account.email
        },
        'current_club': {
            'id': invitation.club.id,
            'nome': invitation.club.nome,
            'logo_url': invitation.club.logo_url
        },
        'clubs': clubs_list,
        'has_multiple_clubs': len(clubs_list) > 1
    }), 200


# ================== SPONSOR PANEL ENDPOINTS ==================
# Questi endpoint sono per il pannello dello sponsor (autenticato)


def get_sponsor_membership():
    """Helper function per ottenere la membership corrente dello sponsor"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None, None

    auth_type = claims.get('auth_type', 'legacy')
    current_club_id = claims.get('current_club_id')
    membership_id = claims.get('membership_id')

    if auth_type == 'legacy':
        membership = Sponsor.query.get(membership_id)
        return membership, membership.club_id if membership else None
    else:
        membership = Sponsor.query.get(membership_id)
        return membership, current_club_id


@sponsor_bp.route('/sponsor/dashboard', methods=['GET'])
@jwt_required()
def get_sponsor_dashboard():
    """Dashboard data per lo sponsor - statistiche, attivazioni imminenti, task pendenti"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import (HeadOfTerms, Activation, Event, EventAssetActivation,
                           EventInvitation, SponsorDriveFile, AssetAllocation,
                           InventoryAsset, Match, ProjectTask, Project)

    now = datetime.utcnow()

    # 1. Contratti attivi
    contracts = HeadOfTerms.query.filter_by(
        sponsor_id=membership.id,
        club_id=club_id
    ).all()

    active_contracts = [c for c in contracts if c.status == 'attivo' and
                        c.data_inizio <= now and c.data_fine >= now]

    total_value = sum(c.compenso or 0 for c in active_contracts)

    # 2. Asset allocati
    allocations = AssetAllocation.query.filter_by(sponsor_id=membership.id).all()
    total_assets = len(allocations)

    # 3. Attivazioni imminenti (prossimi 30 giorni)
    thirty_days = now + timedelta(days=30)

    # Attivazioni match
    upcoming_match_activations = []
    for contract in active_contracts:
        activations = Activation.query.filter_by(contract_id=contract.id).all()
        for act in activations:
            if act.match and act.match.data_ora:
                match_date = act.match.data_ora
                if now <= match_date <= thirty_days and act.stato != 'annullata':
                    upcoming_match_activations.append({
                        'id': act.id,
                        'tipo': 'match',
                        'data': match_date.isoformat(),
                        'titolo': f"{act.match.squadra_casa} vs {act.match.squadra_trasferta}",
                        'asset_tipo': act.tipo,
                        'asset_nome': act.inventory_asset.nome if act.inventory_asset else None,
                        'stato': act.stato
                    })

    # Attivazioni evento
    upcoming_event_activations = []
    for contract in active_contracts:
        event_acts = EventAssetActivation.query.filter_by(contract_id=contract.id).all()
        for act in event_acts:
            if act.event and act.event.data_ora_inizio:
                event_date = act.event.data_ora_inizio
                if now <= event_date <= thirty_days and act.stato != 'annullata':
                    upcoming_event_activations.append({
                        'id': act.id,
                        'tipo': 'evento',
                        'data': event_date.isoformat(),
                        'titolo': act.event.titolo,
                        'asset_tipo': act.tipo,
                        'asset_nome': act.inventory_asset.nome if act.inventory_asset else None,
                        'stato': act.stato
                    })

    # Combina e ordina attivazioni
    all_activations = upcoming_match_activations + upcoming_event_activations
    all_activations.sort(key=lambda x: x['data'])

    # 4. Eventi con invito per lo sponsor
    event_invitations = EventInvitation.query.filter_by(sponsor_id=membership.id).all()
    upcoming_events = []
    for inv in event_invitations:
        if inv.event and inv.event.data_ora_inizio and inv.event.data_ora_inizio >= now:
            upcoming_events.append({
                'id': inv.event.id,
                'titolo': inv.event.titolo,
                'tipo': inv.event.tipo,
                'data': inv.event.data_ora_inizio.isoformat(),
                'luogo': inv.event.luogo,
                'status': inv.event.status,
                'visualizzato': inv.visualizzato
            })

    upcoming_events.sort(key=lambda x: x['data'])

    # 5. Task assegnati allo sponsor
    tasks = ProjectTask.query.filter_by(
        assegnato_a_type='sponsor',
        assegnato_a_id=membership.id
    ).filter(ProjectTask.stato.in_(['da_fare', 'in_corso', 'in_revisione'])).all()

    pending_tasks = [{
        'id': t.id,
        'titolo': t.titolo,
        'priorita': t.priorita,
        'stato': t.stato,
        'data_scadenza': t.data_scadenza.isoformat() if t.data_scadenza else None,
        'is_late': t.is_late(),
        'project_id': t.project_id
    } for t in tasks]

    pending_tasks.sort(key=lambda x: (0 if x['is_late'] else 1, x['data_scadenza'] or '9999'))

    # 6. File recenti nel drive
    recent_files = SponsorDriveFile.query.filter_by(
        sponsor_id=membership.id,
        club_id=club_id,
        visibile_sponsor=True,
        stato='attivo'
    ).order_by(SponsorDriveFile.created_at.desc()).limit(5).all()

    recent_files_data = [{
        'id': f.id,
        'nome': f.nome,
        'categoria': f.categoria,
        'file_type': f.file_type,
        'created_at': f.created_at.isoformat() if f.created_at else None,
        'caricato_da': f.caricato_da
    } for f in recent_files]

    # 7. Statistiche generali
    total_files = SponsorDriveFile.query.filter_by(
        sponsor_id=membership.id,
        club_id=club_id,
        visibile_sponsor=True,
        stato='attivo'
    ).count()

    return jsonify({
        'stats': {
            'contratti_attivi': len(active_contracts),
            'valore_contratti': total_value,
            'asset_allocati': total_assets,
            'attivazioni_imminenti': len(all_activations),
            'task_pendenti': len(pending_tasks),
            'file_condivisi': total_files
        },
        'upcoming_activations': all_activations[:10],
        'upcoming_events': upcoming_events[:5],
        'pending_tasks': pending_tasks[:5],
        'recent_files': recent_files_data,
        'club': {
            'id': membership.club.id,
            'nome': membership.club.nome,
            'logo_url': membership.club.logo_url
        }
    }), 200


@sponsor_bp.route('/sponsor/activations', methods=['GET'])
@jwt_required()
def get_sponsor_activations():
    """Lista tutte le attivazioni dello sponsor (match + eventi)"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import HeadOfTerms, Activation, EventAssetActivation

    # Filtri
    tipo = request.args.get('tipo')  # 'match' o 'evento'
    stato = request.args.get('stato')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    # Ottieni contratti dello sponsor
    contracts = HeadOfTerms.query.filter_by(
        sponsor_id=membership.id,
        club_id=club_id
    ).all()

    contract_ids = [c.id for c in contracts]

    activations_data = []

    # Attivazioni match
    if not tipo or tipo == 'match':
        match_acts = Activation.query.filter(
            Activation.contract_id.in_(contract_ids)
        ).all()

        for act in match_acts:
            if stato and act.stato != stato:
                continue

            match_date = act.match.data_ora if act.match else None

            if from_date and match_date:
                if match_date < datetime.fromisoformat(from_date):
                    continue
            if to_date and match_date:
                if match_date > datetime.fromisoformat(to_date):
                    continue

            contract = next((c for c in contracts if c.id == act.contract_id), None)

            activations_data.append({
                'id': act.id,
                'tipo_attivazione': 'match',
                'data': match_date.isoformat() if match_date else None,
                'titolo': f"{act.match.squadra_casa} vs {act.match.squadra_trasferta}" if act.match else 'N/A',
                'luogo': act.match.luogo if act.match else None,
                'asset_tipo': act.tipo,
                'asset_nome': act.inventory_asset.nome if act.inventory_asset else None,
                'asset_immagine': act.inventory_asset.immagine_principale if act.inventory_asset else None,
                'descrizione': act.descrizione,
                'quantita': act.quantita_utilizzata,
                'stato': act.stato,
                'eseguita': act.eseguita,
                'eseguita_il': act.eseguita_il.isoformat() if act.eseguita_il else None,
                'foto_attivazione': act.foto_attivazione,
                'contract': {
                    'id': contract.id,
                    'nome': contract.nome_contratto
                } if contract else None
            })

    # Attivazioni evento
    if not tipo or tipo == 'evento':
        event_acts = EventAssetActivation.query.filter(
            EventAssetActivation.contract_id.in_(contract_ids)
        ).all()

        for act in event_acts:
            if stato and act.stato != stato:
                continue

            event_date = act.event.data_ora_inizio if act.event else None

            if from_date and event_date:
                if event_date < datetime.fromisoformat(from_date):
                    continue
            if to_date and event_date:
                if event_date > datetime.fromisoformat(to_date):
                    continue

            contract = next((c for c in contracts if c.id == act.contract_id), None)

            activations_data.append({
                'id': act.id,
                'tipo_attivazione': 'evento',
                'data': event_date.isoformat() if event_date else None,
                'titolo': act.event.titolo if act.event else 'N/A',
                'luogo': act.event.luogo if act.event else None,
                'asset_tipo': act.tipo,
                'asset_nome': act.inventory_asset.nome if act.inventory_asset else None,
                'asset_immagine': act.inventory_asset.immagine_principale if act.inventory_asset else None,
                'descrizione': act.descrizione,
                'quantita': act.quantita_utilizzata,
                'stato': act.stato,
                'eseguita': act.eseguita,
                'eseguita_il': act.eseguita_il.isoformat() if act.eseguita_il else None,
                'foto_attivazione': act.foto_attivazione,
                'contract': {
                    'id': contract.id,
                    'nome': contract.nome_contratto
                } if contract else None
            })

    # Ordina per data
    activations_data.sort(key=lambda x: x['data'] or '9999', reverse=True)

    # Statistiche
    total = len(activations_data)
    pianificate = len([a for a in activations_data if a['stato'] == 'pianificata'])
    confermate = len([a for a in activations_data if a['stato'] == 'confermata'])
    eseguite = len([a for a in activations_data if a['eseguita']])

    return jsonify({
        'activations': activations_data,
        'stats': {
            'totale': total,
            'pianificate': pianificate,
            'confermate': confermate,
            'eseguite': eseguite
        }
    }), 200


@sponsor_bp.route('/sponsor/events', methods=['GET'])
@jwt_required()
def get_sponsor_events():
    """Lista eventi dove lo sponsor è invitato o può partecipare"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import Event, EventInvitation, EventRegistrationForm

    # Filtri
    status = request.args.get('status')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    now = datetime.utcnow()

    # Eventi dove lo sponsor è invitato
    invitations = EventInvitation.query.filter_by(sponsor_id=membership.id).all()
    invitation_event_ids = [inv.event_id for inv in invitations]

    # Eventi pubblici del club
    public_events = Event.query.filter(
        Event.club_id == club_id,
        Event.visibile_a.in_(['tutti', 'solo_sponsor'])
    ).all()

    # Combina gli eventi (senza duplicati)
    all_event_ids = set(invitation_event_ids + [e.id for e in public_events])

    events_data = []
    for event_id in all_event_ids:
        event = Event.query.get(event_id)
        if not event:
            continue

        # Applica filtri
        if status and event.status != status:
            continue

        if from_date and event.data_ora_inizio:
            if event.data_ora_inizio < datetime.fromisoformat(from_date):
                continue
        if to_date and event.data_ora_inizio:
            if event.data_ora_inizio > datetime.fromisoformat(to_date):
                continue

        # Verifica se lo sponsor è invitato
        invitation = next((inv for inv in invitations if inv.event_id == event_id), None)

        # Verifica se lo sponsor è registrato
        registration = EventRegistrationForm.query.filter_by(
            event_id=event_id,
            sponsor_id=membership.id
        ).first()

        events_data.append({
            'id': event.id,
            'titolo': event.titolo,
            'tipo': event.tipo,
            'data_inizio': event.data_ora_inizio.isoformat() if event.data_ora_inizio else None,
            'data_fine': event.data_ora_fine.isoformat() if event.data_ora_fine else None,
            'luogo': event.luogo,
            'online': event.online,
            'link_meeting': event.link_meeting if event.online else None,
            'descrizione': event.descrizione,
            'status': event.status,
            'richiede_iscrizione': event.richiede_iscrizione,
            'max_iscrizioni': event.max_iscrizioni,
            'is_invited': invitation is not None,
            'invitation_viewed': invitation.visualizzato if invitation else None,
            'is_registered': registration is not None,
            'registration_status': registration.status if registration else None,
            'is_past': event.data_ora_inizio < now if event.data_ora_inizio else False,
            'created_by_club': event.creato_da_tipo == 'club'
        })

    # Ordina per data (futuri prima, poi passati)
    future_events = [e for e in events_data if not e['is_past']]
    past_events = [e for e in events_data if e['is_past']]

    future_events.sort(key=lambda x: x['data_inizio'] or '9999')
    past_events.sort(key=lambda x: x['data_inizio'] or '0000', reverse=True)

    all_events = future_events + past_events

    return jsonify({
        'events': all_events,
        'stats': {
            'totale': len(all_events),
            'futuri': len(future_events),
            'passati': len(past_events),
            'inviti_non_visualizzati': len([e for e in all_events if e['is_invited'] and not e['invitation_viewed']]),
            'registrati': len([e for e in all_events if e['is_registered']])
        }
    }), 200


@sponsor_bp.route('/sponsor/events/<int:event_id>/register', methods=['POST'])
@jwt_required()
def register_to_event(event_id):
    """Registra lo sponsor a un evento"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import Event, EventRegistrationForm
    import json

    event = Event.query.get_or_404(event_id)

    # Verifica che l'evento sia del club corrente o pubblico
    if event.club_id != club_id:
        return jsonify({'error': 'Evento non trovato'}), 404

    # Verifica se già registrato
    existing = EventRegistrationForm.query.filter_by(
        event_id=event_id,
        sponsor_id=membership.id
    ).first()

    if existing:
        return jsonify({'error': 'Già registrato a questo evento'}), 400

    # Verifica limite iscrizioni
    if event.max_iscrizioni:
        current_count = EventRegistrationForm.query.filter_by(
            event_id=event_id,
            status='registrato'
        ).count()
        if current_count >= event.max_iscrizioni:
            return jsonify({'error': 'Limite iscrizioni raggiunto'}), 400

    data = request.get_json() or {}

    registration = EventRegistrationForm(
        event_id=event_id,
        sponsor_id=membership.id,
        form_data=json.dumps(data.get('form_data', {})),
        note_sponsor=data.get('note')
    )

    db.session.add(registration)

    # Marca l'invito come visualizzato se esiste
    from app.models import EventInvitation
    invitation = EventInvitation.query.filter_by(
        event_id=event_id,
        sponsor_id=membership.id
    ).first()
    if invitation and not invitation.visualizzato:
        invitation.visualizzato = True
        invitation.visualizzato_il = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Registrazione completata',
        'registration': {
            'id': registration.id,
            'status': registration.status
        }
    }), 201


@sponsor_bp.route('/sponsor/tasks', methods=['GET'])
@jwt_required()
def get_sponsor_tasks():
    """Lista task assegnati allo sponsor"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import ProjectTask, Project

    # Filtri
    stato = request.args.get('stato')
    priorita = request.args.get('priorita')
    project_id = request.args.get('project_id', type=int)

    query = ProjectTask.query.filter_by(
        assegnato_a_type='sponsor',
        assegnato_a_id=membership.id
    )

    if stato:
        query = query.filter_by(stato=stato)
    if priorita:
        query = query.filter_by(priorita=priorita)
    if project_id:
        query = query.filter_by(project_id=project_id)

    tasks = query.order_by(ProjectTask.data_scadenza.asc().nullslast()).all()

    tasks_data = []
    for task in tasks:
        project = Project.query.get(task.project_id)
        tasks_data.append({
            'id': task.id,
            'titolo': task.titolo,
            'descrizione': task.descrizione,
            'priorita': task.priorita,
            'stato': task.stato,
            'data_scadenza': task.data_scadenza.isoformat() if task.data_scadenza else None,
            'completato_il': task.completato_il.isoformat() if task.completato_il else None,
            'tempo_stimato': task.tempo_stimato,
            'tags': task.tags.split(',') if task.tags else [],
            'is_late': task.is_late(),
            'comments_count': task.comments.count(),
            'project': {
                'id': project.id,
                'nome': project.nome
            } if project else None,
            'created_at': task.created_at.isoformat()
        })

    # Statistiche
    all_tasks = ProjectTask.query.filter_by(
        assegnato_a_type='sponsor',
        assegnato_a_id=membership.id
    ).all()

    return jsonify({
        'tasks': tasks_data,
        'stats': {
            'totale': len(all_tasks),
            'da_fare': len([t for t in all_tasks if t.stato == 'da_fare']),
            'in_corso': len([t for t in all_tasks if t.stato == 'in_corso']),
            'completati': len([t for t in all_tasks if t.stato == 'completato']),
            'in_ritardo': len([t for t in all_tasks if t.is_late()])
        }
    }), 200


@sponsor_bp.route('/sponsor/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_sponsor_task(task_id):
    """Aggiorna stato di un task assegnato allo sponsor"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import ProjectTask

    task = ProjectTask.query.get_or_404(task_id)

    # Verifica che il task sia assegnato a questo sponsor
    if task.assegnato_a_type != 'sponsor' or task.assegnato_a_id != membership.id:
        return jsonify({'error': 'Task non trovato'}), 404

    data = request.get_json()

    # Lo sponsor può solo aggiornare lo stato (non può modificare titolo, descrizione, ecc.)
    if 'stato' in data:
        old_stato = task.stato
        task.stato = data['stato']

        if data['stato'] == 'completato' and old_stato != 'completato':
            task.completato_il = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Task aggiornato',
        'task': task.to_dict()
    }), 200


@sponsor_bp.route('/sponsor/drive', methods=['GET'])
@jwt_required()
def get_sponsor_drive_files():
    """Lista file nel drive condiviso visibili allo sponsor"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import SponsorDriveFile
    import json

    # Filtri
    categoria = request.args.get('categoria')
    cartella = request.args.get('cartella')
    contract_id = request.args.get('contract_id', type=int)
    search = request.args.get('search')

    query = SponsorDriveFile.query.filter_by(
        sponsor_id=membership.id,
        club_id=club_id,
        visibile_sponsor=True,
        stato='attivo'
    )

    if categoria:
        query = query.filter_by(categoria=categoria)
    if cartella:
        query = query.filter_by(cartella=cartella)
    if contract_id:
        query = query.filter_by(contract_id=contract_id)
    if search:
        query = query.filter(SponsorDriveFile.nome.ilike(f'%{search}%'))

    files = query.order_by(SponsorDriveFile.created_at.desc()).all()

    files_data = []
    for f in files:
        tags = []
        if f.tags:
            try:
                tags = json.loads(f.tags)
            except:
                pass

        files_data.append({
            'id': f.id,
            'nome': f.nome,
            'file_url': f.file_url,
            'file_size': f.file_size,
            'file_type': f.file_type,
            'estensione': f.estensione,
            'descrizione': f.descrizione,
            'categoria': f.categoria,
            'cartella': f.cartella,
            'tags': tags,
            'contract_id': f.contract_id,
            'contract_nome': f.contract.nome_contratto if f.contract else None,
            'caricato_da': f.caricato_da,
            'caricato_da_nome': f.caricato_da_nome,
            'thumbnail_url': f.thumbnail_url,
            'created_at': f.created_at.isoformat() if f.created_at else None
        })

    # Cartelle uniche
    folders = db.session.query(SponsorDriveFile.cartella).filter_by(
        sponsor_id=membership.id,
        club_id=club_id,
        visibile_sponsor=True,
        stato='attivo'
    ).distinct().all()

    folder_list = list(set([f[0] for f in folders if f[0]]))

    # Categorie con conteggio
    categories = db.session.query(
        SponsorDriveFile.categoria,
        func.count(SponsorDriveFile.id)
    ).filter_by(
        sponsor_id=membership.id,
        club_id=club_id,
        visibile_sponsor=True,
        stato='attivo'
    ).group_by(SponsorDriveFile.categoria).all()

    return jsonify({
        'files': files_data,
        'total': len(files_data),
        'folders': folder_list,
        'categories': [{'categoria': cat, 'count': count} for cat, count in categories]
    }), 200


@sponsor_bp.route('/sponsor/drive', methods=['POST'])
@jwt_required()
def upload_sponsor_file():
    """Sponsor carica un file nel drive condiviso"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import SponsorDriveFile
    import json

    data = request.get_json()

    if not data.get('nome') or not data.get('file_url'):
        return jsonify({'error': 'Nome e file_url sono richiesti'}), 400

    tags_json = None
    if data.get('tags'):
        tags_json = json.dumps(data['tags']) if isinstance(data['tags'], list) else data['tags']

    file = SponsorDriveFile(
        club_id=club_id,
        sponsor_id=membership.id,
        nome=data['nome'],
        file_url=data['file_url'],
        file_size=data.get('file_size'),
        file_type=data.get('file_type'),
        estensione=data.get('estensione'),
        descrizione=data.get('descrizione'),
        categoria=data.get('categoria', 'altro'),
        cartella=data.get('cartella', '/'),
        tags=tags_json,
        contract_id=data.get('contract_id'),
        caricato_da='sponsor',
        caricato_da_nome=membership.ragione_sociale,
        thumbnail_url=data.get('thumbnail_url')
    )

    db.session.add(file)
    db.session.commit()

    return jsonify({
        'message': 'File caricato con successo',
        'file': {
            'id': file.id,
            'nome': file.nome,
            'file_url': file.file_url
        }
    }), 201


@sponsor_bp.route('/sponsor/contracts', methods=['GET'])
@jwt_required()
def get_sponsor_contracts_list():
    """Lista contratti dello sponsor con il club corrente"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import AssetAllocation, InventoryAsset

    contracts = HeadOfTerms.query.filter_by(
        sponsor_id=membership.id,
        club_id=club_id
    ).order_by(HeadOfTerms.data_inizio.desc()).all()

    now = datetime.utcnow()

    contracts_data = []
    for c in contracts:
        # Conta asset allocati
        allocations = AssetAllocation.query.filter_by(contract_id=c.id).count()

        # Determina status effettivo
        is_active = c.status == 'attivo' and c.data_inizio <= now <= c.data_fine

        contracts_data.append({
            'id': c.id,
            'nome_contratto': c.nome_contratto,
            'descrizione': c.descrizione,
            'compenso': c.compenso,
            'data_inizio': c.data_inizio.isoformat() if c.data_inizio else None,
            'data_fine': c.data_fine.isoformat() if c.data_fine else None,
            'status': c.status,
            'is_active': is_active,
            'file_contratto_url': c.file_contratto_url,
            'asset_count': allocations,
            'created_at': c.created_at.isoformat() if c.created_at else None
        })

    # Statistiche
    active_count = len([c for c in contracts_data if c['is_active']])
    total_value = sum(c['compenso'] or 0 for c in contracts_data if c['is_active'])

    return jsonify({
        'contracts': contracts_data,
        'stats': {
            'totale': len(contracts_data),
            'attivi': active_count,
            'valore_totale': total_value
        }
    }), 200


@sponsor_bp.route('/sponsor/assets', methods=['GET'])
@jwt_required()
def get_sponsor_allocated_assets():
    """Lista asset allocati allo sponsor"""
    membership, club_id = get_sponsor_membership()
    if not membership:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import AssetAllocation, InventoryAsset

    allocations = AssetAllocation.query.filter_by(
        sponsor_id=membership.id
    ).all()

    assets_data = []
    for alloc in allocations:
        asset = InventoryAsset.query.get(alloc.asset_id) if alloc.asset_id else None
        if not asset:
            continue

        contract = HeadOfTerms.query.get(alloc.contract_id) if alloc.contract_id else None

        assets_data.append({
            'allocation_id': alloc.id,
            'asset': {
                'id': asset.id,
                'nome': asset.nome,
                'tipo': asset.tipo,
                'categoria': asset.category.nome if asset.category else None,
                'posizione': asset.posizione,
                'dimensioni': asset.dimensioni,
                'immagine_principale': asset.immagine_principale,
                'immagine_url': asset.immagine_principale,
                'prezzo_listino': asset.prezzo_listino,
                'prezzo': alloc.prezzo_concordato or asset.prezzo_listino or 0,
                'quantita_totale': asset.quantita_totale,
                'quantita_allocata': alloc.quantita or 1
            },
            'stagione': alloc.stagione,
            'data_inizio': alloc.data_inizio.isoformat() if alloc.data_inizio else None,
            'data_fine': alloc.data_fine.isoformat() if alloc.data_fine else None,
            'quantita': alloc.quantita,
            'prezzo_concordato': alloc.prezzo_concordato,
            'status': alloc.status,
            'contract': {
                'id': contract.id,
                'nome': contract.nome_contratto
            } if contract else None
        })

    return jsonify({
        'assets': assets_data,
        'total': len(assets_data)
    }), 200
