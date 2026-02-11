from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app import db
from app.models import Admin, ClubUser, SponsorAccount, Sponsor, Club
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/unified-login', methods=['POST'])
def unified_login():
    """
    Login unificato: determina automaticamente il ruolo dell'utente.
    Se l'email ha più ruoli, ritorna la lista per la selezione.
    """
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password')
    requested_role = data.get('role')       # 'admin', 'club', 'sponsor'
    requested_role_id = data.get('role_id')  # ID specifico per disambiguare

    if not email or not password:
        return jsonify({'error': 'Email e password richiesti'}), 400

    available_roles = []
    blocked_messages = []

    # --- 1. Check Admin ---
    admin = Admin.query.filter_by(email=email).first()
    if admin and admin.check_password(password):
        if not admin.is_active:
            blocked_messages.append('Account admin disabilitato.')
        else:
            available_roles.append({
                'role': 'admin',
                'role_id': admin.id,
                'label': 'Amministratore',
                'detail': admin.full_name
            })

    # --- 2. Check ClubUser ---
    club_users = ClubUser.query.filter_by(email=email).all()
    for user in club_users:
        if user.check_password(password):
            if not user.is_active:
                blocked_messages.append(f'Utente club disabilitato ({user.club.nome}).')
                continue
            club = user.club
            if not club.is_activated:
                blocked_messages.append(f'Club {club.nome} non attivato.')
                continue
            if not club.account_attivo:
                blocked_messages.append(f'Club {club.nome} sospeso.')
                continue
            if not club.is_licenza_valida():
                blocked_messages.append(f'Licenza club {club.nome} scaduta.')
                continue
            available_roles.append({
                'role': 'club',
                'role_id': user.id,
                'label': 'Club',
                'detail': club.nome
            })

    # --- 3. Check SponsorAccount ---
    sponsor_account = SponsorAccount.query.filter_by(email=email).first()
    if sponsor_account and sponsor_account.check_password(password):
        if not sponsor_account.account_attivo:
            blocked_messages.append('Account sponsor disattivato.')
        else:
            active_memberships = [
                m for m in sponsor_account.club_memberships
                if m.membership_status == 'active' and m.club.account_attivo
            ]
            if active_memberships:
                available_roles.append({
                    'role': 'sponsor',
                    'role_id': sponsor_account.id,
                    'label': 'Sponsor',
                    'detail': sponsor_account.ragione_sociale,
                    'auth_type': 'account'
                })
            else:
                blocked_messages.append('Nessun club attivo associato al tuo account sponsor.')

    # --- 4. Check Sponsor legacy ---
    if not sponsor_account:
        legacy_sponsor = Sponsor.query.filter_by(email=email).first()
        if legacy_sponsor and legacy_sponsor.password_hash and legacy_sponsor.check_password(password):
            if not legacy_sponsor.account_attivo:
                blocked_messages.append('Account sponsor disattivato.')
            elif not legacy_sponsor.club.is_licenza_valida() or not legacy_sponsor.club.account_attivo:
                blocked_messages.append('Account club dello sponsor non attivo.')
            else:
                available_roles.append({
                    'role': 'sponsor',
                    'role_id': legacy_sponsor.id,
                    'label': 'Sponsor',
                    'detail': legacy_sponsor.ragione_sociale,
                    'auth_type': 'legacy'
                })

    # --- Nessun ruolo ---
    if not available_roles:
        if blocked_messages:
            return jsonify({
                'error': 'Accesso bloccato',
                'details': blocked_messages
            }), 403
        return jsonify({'error': 'Credenziali non valide'}), 401

    # --- Più ruoli senza selezione ---
    if len(available_roles) > 1 and not requested_role:
        return jsonify({
            'select_role': True,
            'available_roles': available_roles
        }), 200

    # --- Determina quale ruolo usare ---
    if requested_role:
        match = None
        for r in available_roles:
            if r['role'] == requested_role:
                if requested_role_id and r['role_id'] != requested_role_id:
                    continue
                match = r
                break
        if not match:
            return jsonify({'error': 'Ruolo selezionato non disponibile'}), 403
        chosen = match
    else:
        chosen = available_roles[0]

    # --- Login per il ruolo scelto ---
    if chosen['role'] == 'admin':
        return _login_admin(admin)
    elif chosen['role'] == 'club':
        user = ClubUser.query.get(chosen['role_id'])
        return _login_club(user)
    elif chosen['role'] == 'sponsor':
        auth_type = chosen.get('auth_type', 'account')
        if auth_type == 'account':
            return _login_sponsor_account(sponsor_account)
        else:
            legacy = Sponsor.query.get(chosen['role_id'])
            return _login_sponsor_legacy(legacy)

    return jsonify({'error': 'Errore interno'}), 500


def _login_admin(admin):
    admin.last_login = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(
        identity=str(admin.id),
        additional_claims={'role': 'admin'}
    )

    return jsonify({
        'access_token': access_token,
        'role': 'admin',
        'admin': {
            'id': admin.id,
            'email': admin.email,
            'nome': admin.nome,
            'cognome': admin.cognome,
            'full_name': admin.full_name,
            'avatar': admin.avatar
        }
    }), 200


def _login_club(user):
    club = user.club

    user.last_login = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'role': 'club',
            'user_id': user.id,
            'club_id': club.id
        }
    )

    return jsonify({
        'access_token': access_token,
        'role': 'club',
        'club': {
            'id': club.id,
            'nome': club.nome,
            'email': club.email,
            'logo_url': club.logo_url
        },
        'user': user.to_dict()
    }), 200


def _login_sponsor_account(sponsor_account):
    active_memberships = [
        m for m in sponsor_account.club_memberships
        if m.membership_status == 'active' and m.club.account_attivo
    ]

    current_membership = active_memberships[0]

    sponsor_account.ultimo_accesso = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(
        identity=str(sponsor_account.id),
        additional_claims={
            'role': 'sponsor',
            'auth_type': 'account',
            'current_club_id': current_membership.club_id,
            'membership_id': current_membership.id
        }
    )

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
        'role': 'sponsor',
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


def _login_sponsor_legacy(legacy_sponsor):
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
        'role': 'sponsor',
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
