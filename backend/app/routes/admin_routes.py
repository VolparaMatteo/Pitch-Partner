from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    Admin, Club, Pagamento, Fattura, Sponsor, Proposal,
    SubscriptionPlan, Subscription, SubscriptionEvent,
    CRMLead, CRMLeadActivity, AuditLog, AdminEmailTemplate, EmailLog, PlatformMetrics,
    ClubInvoice, ClubActivity, AdminContract, AdminInvoice
)
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
import json


def verify_admin():
    """Helper function to verify admin role"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


def log_action(azione, entita, entita_id=None, dettagli=None, dati_prima=None, dati_dopo=None):
    """Helper function to log admin actions"""
    try:
        admin_id = get_jwt_identity()
        log = AuditLog(
            admin_id=int(admin_id) if admin_id else None,
            azione=azione,
            entita=entita,
            entita_id=entita_id,
            dettagli=dettagli,
            dati_prima=json.dumps(dati_prima) if dati_prima else None,
            dati_dopo=json.dumps(dati_dopo) if dati_dopo else None,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string[:500] if request.user_agent else None
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Error logging action: {e}")

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email e password richiesti'}), 400

    admin = Admin.query.filter_by(email=email).first()

    if not admin or not admin.check_password(password):
        return jsonify({'error': 'Credenziali non valide'}), 401

    if not admin.is_active:
        return jsonify({'error': 'Account disabilitato'}), 401

    # Aggiorna last_login
    admin.last_login = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(
        identity=str(admin.id),
        additional_claims={'role': 'admin'}
    )

    return jsonify({
        'access_token': access_token,
        'admin': {
            'id': admin.id,
            'email': admin.email,
            'nome': admin.nome,
            'cognome': admin.cognome,
            'full_name': admin.full_name,
            'avatar': admin.avatar
        }
    }), 200


@admin_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current admin profile"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id)

    if not admin:
        return jsonify({'error': 'Admin non trovato'}), 404

    return jsonify({
        'id': admin.id,
        'email': admin.email,
        'nome': admin.nome,
        'cognome': admin.cognome,
        'full_name': admin.full_name,
        'avatar': admin.avatar,
        'created_at': admin.created_at.isoformat() if admin.created_at else None,
        'last_login': admin.last_login.isoformat() if admin.last_login else None,
        'is_active': admin.is_active
    }), 200


@admin_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current admin profile"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id)

    if not admin:
        return jsonify({'error': 'Admin non trovato'}), 404

    # Handle form data (for file uploads) or JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        nome = request.form.get('nome')
        cognome = request.form.get('cognome')
        avatar_file = request.files.get('avatar')
    else:
        data = request.get_json()
        nome = data.get('nome')
        cognome = data.get('cognome')
        avatar_file = None

    # Validate required fields
    if not nome or not cognome:
        return jsonify({'error': 'Nome e cognome sono obbligatori'}), 400

    admin.nome = nome.strip()
    admin.cognome = cognome.strip()

    # Handle avatar upload
    if avatar_file:
        import os
        from werkzeug.utils import secure_filename

        # Create uploads directory if not exists
        upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads', 'avatars')
        os.makedirs(upload_folder, exist_ok=True)

        # Generate unique filename
        filename = secure_filename(f"admin_{admin.id}_{avatar_file.filename}")
        filepath = os.path.join(upload_folder, filename)
        avatar_file.save(filepath)

        # Store relative path
        admin.avatar = f"/static/uploads/avatars/{filename}"

    db.session.commit()

    return jsonify({
        'id': admin.id,
        'email': admin.email,
        'nome': admin.nome,
        'cognome': admin.cognome,
        'full_name': admin.full_name,
        'avatar': admin.avatar
    }), 200


@admin_bp.route('/profile/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change admin password"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id)

    if not admin:
        return jsonify({'error': 'Admin non trovato'}), 404

    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'error': 'Password attuale e nuova password sono obbligatorie'}), 400

    # Verify current password
    if not admin.check_password(current_password):
        return jsonify({'error': 'Password attuale non corretta'}), 400

    # Validate new password
    if len(new_password) < 8:
        return jsonify({'error': 'La nuova password deve essere di almeno 8 caratteri'}), 400

    # Update password
    admin.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password aggiornata con successo'}), 200


@admin_bp.route('/clubs', methods=['GET'])
@jwt_required()
def get_clubs():
    try:
        if not verify_admin():
            return jsonify({'error': 'Accesso non autorizzato'}), 403

        clubs = Club.query.all()
        now = datetime.utcnow().date()

        result = []
        for club in clubs:
            # Trova il contratto attivo per questo club
            active_contract = AdminContract.query.filter(
                AdminContract.club_id == club.id,
                AdminContract.status == 'active'
            ).order_by(AdminContract.end_date.desc()).first()

            # Determina scadenza contratto
            contract_end_date = None
            contract_expired = False
            if active_contract:
                contract_end_date = active_contract.end_date.isoformat() if active_contract.end_date else None
                contract_expired = active_contract.end_date < now if active_contract.end_date else False

            result.append({
                'id': club.id,
                'nome': club.nome,
                'tipologia': club.tipologia,
                'logo_url': club.logo_url,
                'email': club.email,
                'telefono': club.telefono,
                'nome_abbonamento': active_contract.plan_type.capitalize() if active_contract else club.nome_abbonamento,
                'costo_abbonamento': active_contract.total_value if active_contract else club.costo_abbonamento,
                'data_scadenza_licenza': contract_end_date,
                'contract_end_date': contract_end_date,
                'contract_expired': contract_expired,
                'has_active_contract': active_contract is not None,
                'account_attivo': club.account_attivo,
                'licenza_valida': not contract_expired if active_contract else False,
                'created_at': club.created_at.isoformat()
            })

        return jsonify(result), 200
    except Exception as e:
        print(f"Error in get_clubs: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/clubs/<int:club_id>', methods=['GET'])
@jwt_required()
def get_club(club_id):
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)

    response = {
        'id': club.id,
        'nome': club.nome,
        'tipologia': club.tipologia,
        'logo_url': club.logo_url,
        'codice_fiscale': club.codice_fiscale,
        'partita_iva': club.partita_iva,
        'numero_affiliazione': club.numero_affiliazione,
        'indirizzo_sede_legale': club.indirizzo_sede_legale,
        'indirizzo_sede_operativa': club.indirizzo_sede_operativa,
        'email': club.email,
        'telefono': club.telefono,
        'sito_web': club.sito_web,
        'referente_nome': club.referente_nome,
        'referente_cognome': club.referente_cognome,
        'referente_ruolo': club.referente_ruolo,
        'referente_contatto': club.referente_contatto,
        'numero_tesserati': club.numero_tesserati,
        'categoria_campionato': club.categoria_campionato,
        'facebook': club.facebook,
        'instagram': club.instagram,
        'tiktok': club.tiktok,
        'pubblico_medio': club.pubblico_medio,
        'nome_abbonamento': club.nome_abbonamento,
        'costo_abbonamento': club.costo_abbonamento,
        'tipologia_abbonamento': club.tipologia_abbonamento,
        'data_scadenza_licenza': club.data_scadenza_licenza.isoformat() if club.data_scadenza_licenza else None,
        'account_attivo': club.account_attivo,
        'licenza_valida': club.is_licenza_valida(),
        'created_at': club.created_at.isoformat(),
        'is_activated': club.is_activated,
        'activated_at': club.activated_at.isoformat() if club.activated_at else None
    }

    # Include activation token info only for non-activated clubs
    if not club.is_activated:
        response['activation_token'] = club.activation_token
        response['activation_token_expires'] = club.activation_token_expires.isoformat() if club.activation_token_expires else None
        response['activation_token_valid'] = club.is_activation_token_valid()

    return jsonify(response), 200


@admin_bp.route('/clubs', methods=['POST'])
@jwt_required()
def create_club():
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione campi obbligatori (password non più richiesta)
    if not data.get('nome') or not data.get('email') or not data.get('tipologia'):
        return jsonify({'error': 'Nome, email e tipologia sono obbligatori'}), 400

    # Verifica email unica
    if Club.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email già utilizzata'}), 400

    club = Club(
        nome=data['nome'],
        tipologia=data['tipologia'],
        logo_url=data.get('logo_url'),
        codice_fiscale=data.get('codice_fiscale'),
        partita_iva=data.get('partita_iva'),
        numero_affiliazione=data.get('numero_affiliazione'),
        indirizzo_sede_legale=data.get('indirizzo_sede_legale'),
        indirizzo_sede_operativa=data.get('indirizzo_sede_operativa'),
        email=data['email'],
        telefono=data.get('telefono'),
        sito_web=data.get('sito_web'),
        referente_nome=data.get('referente_nome'),
        referente_cognome=data.get('referente_cognome'),
        referente_ruolo=data.get('referente_ruolo'),
        referente_contatto=data.get('referente_contatto'),
        numero_tesserati=data.get('numero_tesserati'),
        categoria_campionato=data.get('categoria_campionato'),
        facebook=data.get('facebook'),
        instagram=data.get('instagram'),
        tiktok=data.get('tiktok'),
        pubblico_medio=data.get('pubblico_medio'),
        nome_abbonamento=data.get('nome_abbonamento'),
        costo_abbonamento=data.get('costo_abbonamento'),
        tipologia_abbonamento=data.get('tipologia_abbonamento'),
        data_scadenza_licenza=datetime.fromisoformat(data['data_scadenza_licenza']) if data.get('data_scadenza_licenza') else None,
        account_attivo=data.get('account_attivo', True),
        is_activated=False
    )

    # Genera token di attivazione invece di impostare la password
    activation_token = club.generate_activation_token(days=7)

    db.session.add(club)
    db.session.commit()

    # Registra attività di creazione
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id)
    admin_name = admin.email if admin else 'admin'

    activity = ClubActivity(
        club_id=club.id,
        tipo='altro',
        descrizione=f'Club "{club.nome}" creato da {admin_name}',
        esito='positivo',
        created_by=admin_name
    )
    db.session.add(activity)
    db.session.commit()

    return jsonify({
        'message': 'Club creato con successo',
        'club': {
            'id': club.id,
            'nome': club.nome,
            'email': club.email,
            'activation_token': activation_token,
            'activation_token_expires': club.activation_token_expires.isoformat() if club.activation_token_expires else None
        }
    }), 201


@admin_bp.route('/clubs/<int:club_id>', methods=['PUT'])
@jwt_required()
def update_club(club_id):
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    data = request.get_json()

    # Verifica email unica se viene modificata
    if data.get('email') and data['email'] != club.email:
        if Club.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email già utilizzata'}), 400

    # Aggiorna campi
    if 'nome' in data:
        club.nome = data['nome']
    if 'tipologia' in data:
        club.tipologia = data['tipologia']
    if 'logo_url' in data:
        club.logo_url = data['logo_url']
    if 'codice_fiscale' in data:
        club.codice_fiscale = data['codice_fiscale']
    if 'partita_iva' in data:
        club.partita_iva = data['partita_iva']
    if 'numero_affiliazione' in data:
        club.numero_affiliazione = data['numero_affiliazione']
    if 'indirizzo_sede_legale' in data:
        club.indirizzo_sede_legale = data['indirizzo_sede_legale']
    if 'indirizzo_sede_operativa' in data:
        club.indirizzo_sede_operativa = data['indirizzo_sede_operativa']
    if 'email' in data:
        club.email = data['email']
    if 'telefono' in data:
        club.telefono = data['telefono']
    if 'sito_web' in data:
        club.sito_web = data['sito_web']
    if 'referente_nome' in data:
        club.referente_nome = data['referente_nome']
    if 'referente_cognome' in data:
        club.referente_cognome = data['referente_cognome']
    if 'referente_ruolo' in data:
        club.referente_ruolo = data['referente_ruolo']
    if 'referente_contatto' in data:
        club.referente_contatto = data['referente_contatto']
    if 'numero_tesserati' in data:
        club.numero_tesserati = data['numero_tesserati']
    if 'categoria_campionato' in data:
        club.categoria_campionato = data['categoria_campionato']
    if 'facebook' in data:
        club.facebook = data['facebook']
    if 'instagram' in data:
        club.instagram = data['instagram']
    if 'tiktok' in data:
        club.tiktok = data['tiktok']
    if 'pubblico_medio' in data:
        club.pubblico_medio = data['pubblico_medio']
    if 'nome_abbonamento' in data:
        club.nome_abbonamento = data['nome_abbonamento']
    if 'costo_abbonamento' in data:
        club.costo_abbonamento = data['costo_abbonamento']
    if 'tipologia_abbonamento' in data:
        club.tipologia_abbonamento = data['tipologia_abbonamento']
    if 'data_scadenza_licenza' in data:
        club.data_scadenza_licenza = datetime.fromisoformat(data['data_scadenza_licenza']) if data['data_scadenza_licenza'] else None
    if 'account_attivo' in data:
        club.account_attivo = data['account_attivo']
    if 'password' in data:
        club.set_password(data['password'])

    db.session.commit()

    return jsonify({'message': 'Club aggiornato con successo'}), 200


@admin_bp.route('/clubs/<int:club_id>', methods=['DELETE'])
@jwt_required()
def delete_club(club_id):
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    db.session.delete(club)
    db.session.commit()

    return jsonify({'message': 'Club eliminato con successo'}), 200


@admin_bp.route('/clubs/<int:club_id>/regenerate-token', methods=['POST'])
@jwt_required()
def regenerate_activation_token(club_id):
    """Rigenera il token di attivazione per un club non ancora attivato"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)

    if club.is_activated:
        return jsonify({'error': 'Il club è già stato attivato'}), 400

    activation_token = club.generate_activation_token(days=7)
    db.session.commit()

    return jsonify({
        'message': 'Token rigenerato con successo',
        'activation_token': activation_token,
        'activation_token_expires': club.activation_token_expires.isoformat()
    }), 200


@admin_bp.route('/clubs/<int:club_id>/toggle-status', methods=['POST'])
@jwt_required()
def toggle_club_status(club_id):
    """Sospende o riattiva l'account di un club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    data = request.get_json()

    action = data.get('action')  # 'suspend' o 'activate'
    motivo = data.get('motivo', '').strip()

    # Get admin info for activity log
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id)
    admin_name = admin.full_name if admin else 'Admin'

    if action == 'suspend':
        club.account_attivo = False
        message = 'Account sospeso con successo'
        activity_tipo = 'sospensione'
        activity_esito = 'negativo'
        activity_desc = f"Account sospeso"
        if motivo:
            activity_desc += f". Motivo: {motivo}"
    elif action == 'activate':
        club.account_attivo = True
        message = 'Account riattivato con successo'
        activity_tipo = 'riattivazione'
        activity_esito = 'positivo'
        activity_desc = f"Account riattivato"
        if motivo:
            activity_desc += f". Motivo: {motivo}"
    else:
        return jsonify({'error': 'Azione non valida. Usa "suspend" o "activate"'}), 400

    # Create activity log
    activity = ClubActivity(
        club_id=club_id,
        tipo=activity_tipo,
        descrizione=activity_desc,
        esito=activity_esito,
        created_by=admin_name,
        data_schedulata=datetime.utcnow()
    )
    db.session.add(activity)
    db.session.commit()

    return jsonify({
        'message': message,
        'account_attivo': club.account_attivo
    }), 200


# Gestione Pagamenti - Tutti i club
@admin_bp.route('/pagamenti', methods=['GET'])
@jwt_required()
def get_all_pagamenti():
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    pagamenti = Pagamento.query.order_by(Pagamento.data_pagamento.desc()).all()

    return jsonify([{
        'id': p.id,
        'importo': p.importo,
        'data_pagamento': p.data_pagamento.isoformat(),
        'descrizione': p.descrizione,
        'metodo_pagamento': p.metodo_pagamento,
        'club_id': p.club_id,
        'club_nome': p.club.nome if p.club else None
    } for p in pagamenti]), 200


# Gestione Pagamenti - Singolo club
@admin_bp.route('/clubs/<int:club_id>/pagamenti', methods=['GET'])
@jwt_required()
def get_pagamenti(club_id):
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    pagamenti = Pagamento.query.filter_by(club_id=club_id).order_by(Pagamento.data_pagamento.desc()).all()

    return jsonify([{
        'id': p.id,
        'importo': p.importo,
        'data_pagamento': p.data_pagamento.isoformat(),
        'descrizione': p.descrizione,
        'metodo_pagamento': p.metodo_pagamento
    } for p in pagamenti]), 200


@admin_bp.route('/clubs/<int:club_id>/pagamenti', methods=['POST'])
@jwt_required()
def create_pagamento(club_id):
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    data = request.get_json()

    if not data.get('importo') or not data.get('data_pagamento'):
        return jsonify({'error': 'Importo e data pagamento sono obbligatori'}), 400

    pagamento = Pagamento(
        club_id=club_id,
        importo=data['importo'],
        data_pagamento=datetime.fromisoformat(data['data_pagamento']),
        descrizione=data.get('descrizione'),
        metodo_pagamento=data.get('metodo_pagamento')
    )

    db.session.add(pagamento)
    db.session.commit()

    return jsonify({'message': 'Pagamento registrato con successo', 'id': pagamento.id}), 201


# Gestione Fatture - Tutte le fatture
@admin_bp.route('/fatture', methods=['GET'])
@jwt_required()
def get_all_fatture():
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    fatture = Fattura.query.order_by(Fattura.data_fattura.desc()).all()

    return jsonify([{
        'id': f.id,
        'numero_fattura': f.numero_fattura,
        'data_fattura': f.data_fattura.isoformat(),
        'importo': f.importo,
        'file_url': f.file_url,
        'note': f.note,
        'club_id': f.club_id,
        'club_nome': f.club.nome if f.club else None
    } for f in fatture]), 200


# Gestione Fatture - Singolo club
@admin_bp.route('/clubs/<int:club_id>/fatture', methods=['GET'])
@jwt_required()
def get_fatture(club_id):
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    fatture = Fattura.query.filter_by(club_id=club_id).order_by(Fattura.data_fattura.desc()).all()

    return jsonify([{
        'id': f.id,
        'numero_fattura': f.numero_fattura,
        'data_fattura': f.data_fattura.isoformat(),
        'importo': f.importo,
        'file_url': f.file_url,
        'note': f.note
    } for f in fatture]), 200


@admin_bp.route('/clubs/<int:club_id>/fatture', methods=['POST'])
@jwt_required()
def create_fattura(club_id):
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    data = request.get_json()

    if not data.get('numero_fattura') or not data.get('data_fattura') or not data.get('importo'):
        return jsonify({'error': 'Numero fattura, data e importo sono obbligatori'}), 400

    fattura = Fattura(
        club_id=club_id,
        numero_fattura=data['numero_fattura'],
        data_fattura=datetime.fromisoformat(data['data_fattura']),
        importo=data['importo'],
        file_url=data.get('file_url'),
        note=data.get('note')
    )

    db.session.add(fattura)
    db.session.commit()

    return jsonify({'message': 'Fattura registrata con successo', 'id': fattura.id}), 201


# Gestione Sponsor del Club
@admin_bp.route('/clubs/<int:club_id>/sponsors', methods=['GET'])
@jwt_required()
def get_club_sponsors(club_id):
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    sponsors = Sponsor.query.filter_by(club_id=club_id).all()

    return jsonify([{
        'id': s.id,
        'ragione_sociale': s.ragione_sociale,
        'logo_url': s.logo_url,
        'email': s.email,
        'telefono': s.telefono,
        'settore_merceologico': s.settore_merceologico,
        'account_attivo': s.account_attivo,
        'created_at': s.created_at.isoformat()
    } for s in sponsors]), 200


# ============================================================
# DASHBOARD & ANALYTICS
# ============================================================

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Dashboard principale con KPIs e metriche chiave"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    try:
        today = datetime.utcnow().date()
        thirty_days_ago = today - timedelta(days=30)

        # Conteggi base
        total_clubs = Club.query.count()
        active_clubs = Club.query.filter_by(account_attivo=True).count()
        total_sponsors = Sponsor.query.count()

        # Subscription stats
        active_subscriptions = Subscription.query.filter(
            Subscription.status.in_(['active', 'trial'])
        ).count()

        trial_subscriptions = Subscription.query.filter_by(
            status='trial', is_trial=True
        ).count()

        # Calcola MRR
        mrr = db.session.query(func.sum(Subscription.importo_corrente)).filter(
            Subscription.status == 'active',
            Subscription.billing_cycle == 'monthly'
        ).scalar() or 0

        # Aggiungi la quota mensile degli annuali
        annual_mrr = db.session.query(func.sum(Subscription.importo_corrente / 12)).filter(
            Subscription.status == 'active',
            Subscription.billing_cycle == 'yearly'
        ).scalar() or 0

        mrr += annual_mrr
        arr = mrr * 12

        # Lead stats
        total_leads = CRMLead.query.count()
        hot_leads = CRMLead.query.filter_by(temperatura='hot').count()
        leads_this_month = CRMLead.query.filter(
            CRMLead.created_at >= thirty_days_ago
        ).count()

        # Licenze in scadenza (prossimi 30 giorni)
        expiring_soon = Club.query.filter(
            Club.data_scadenza_licenza.isnot(None),
            Club.data_scadenza_licenza <= today + timedelta(days=30),
            Club.data_scadenza_licenza >= today
        ).count()

        # Club con licenza scaduta
        expired_licenses = Club.query.filter(
            Club.data_scadenza_licenza.isnot(None),
            Club.data_scadenza_licenza < today
        ).count()

        # Proposte accettate (contratti attivi)
        total_contracts = Proposal.query.filter_by(stato='accettata').count()
        total_contract_value = db.session.query(func.sum(Proposal.valore_finale)).filter(
            Proposal.stato == 'accettata'
        ).scalar() or 0

        # Nuovi club questo mese
        new_clubs_month = Club.query.filter(
            Club.created_at >= thirty_days_ago
        ).count()

        # Recent activities
        recent_logs = AuditLog.query.order_by(
            AuditLog.timestamp.desc()
        ).limit(10).all()

        # Pipeline summary
        pipeline = db.session.query(
            CRMLead.stage,
            func.count(CRMLead.id).label('count'),
            func.sum(CRMLead.valore_stimato).label('value')
        ).group_by(CRMLead.stage).all()

        pipeline_data = {
            stage: {'count': count, 'value': float(value or 0)}
            for stage, count, value in pipeline
        }

        return jsonify({
            'kpis': {
                'total_clubs': total_clubs,
                'active_clubs': active_clubs,
                'total_sponsors': total_sponsors,
                'active_subscriptions': active_subscriptions,
                'trial_subscriptions': trial_subscriptions,
                'mrr': round(mrr, 2),
                'arr': round(arr, 2),
                'total_leads': total_leads,
                'hot_leads': hot_leads,
                'leads_this_month': leads_this_month,
                'expiring_soon': expiring_soon,
                'expired_licenses': expired_licenses,
                'new_clubs_month': new_clubs_month,
                'total_contracts': total_contracts,
                'total_contract_value': float(total_contract_value)
            },
            'pipeline': pipeline_data,
            'recent_activities': [log.to_dict() for log in recent_logs]
        }), 200

    except Exception as e:
        print(f"Error in dashboard: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Analytics avanzate con trend e metriche storiche"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    try:
        period = request.args.get('period', '30')  # giorni
        days = int(period)

        today = datetime.utcnow().date()
        start_date = today - timedelta(days=days)
        prev_start = start_date - timedelta(days=days)

        # Club growth
        clubs_current = Club.query.filter(
            Club.created_at >= start_date
        ).count()
        clubs_previous = Club.query.filter(
            Club.created_at >= prev_start,
            Club.created_at < start_date
        ).count()

        # Sponsor growth
        sponsors_current = Sponsor.query.filter(
            Sponsor.created_at >= start_date
        ).count()
        sponsors_previous = Sponsor.query.filter(
            Sponsor.created_at >= prev_start,
            Sponsor.created_at < start_date
        ).count()

        # Revenue (pagamenti)
        revenue_current = db.session.query(func.sum(Pagamento.importo)).filter(
            Pagamento.data_pagamento >= start_date
        ).scalar() or 0
        revenue_previous = db.session.query(func.sum(Pagamento.importo)).filter(
            Pagamento.data_pagamento >= prev_start,
            Pagamento.data_pagamento < start_date
        ).scalar() or 0

        # Daily metrics for chart
        daily_data = []
        for i in range(days):
            day = today - timedelta(days=days - 1 - i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())

            new_clubs = Club.query.filter(
                Club.created_at >= day_start,
                Club.created_at <= day_end
            ).count()

            new_sponsors = Sponsor.query.filter(
                Sponsor.created_at >= day_start,
                Sponsor.created_at <= day_end
            ).count()

            daily_revenue = db.session.query(func.sum(Pagamento.importo)).filter(
                Pagamento.data_pagamento >= day_start,
                Pagamento.data_pagamento <= day_end
            ).scalar() or 0

            daily_data.append({
                'date': day.isoformat(),
                'new_clubs': new_clubs,
                'new_sponsors': new_sponsors,
                'revenue': float(daily_revenue)
            })

        # Club per tipologia
        clubs_by_type = db.session.query(
            Club.tipologia,
            func.count(Club.id)
        ).group_by(Club.tipologia).all()

        # Subscription by plan
        subs_by_plan = db.session.query(
            SubscriptionPlan.nome,
            func.count(Subscription.id)
        ).join(Subscription).filter(
            Subscription.status.in_(['active', 'trial'])
        ).group_by(SubscriptionPlan.nome).all()

        # Lead conversion funnel
        lead_stages = ['nuovo', 'contattato', 'qualificato', 'demo', 'proposta', 'negoziazione', 'vinto', 'perso']
        funnel = {}
        for stage in lead_stages:
            funnel[stage] = CRMLead.query.filter_by(stage=stage).count()

        # Churn (licenze scadute non rinnovate)
        churned = Club.query.filter(
            Club.data_scadenza_licenza < today,
            Club.account_attivo == False
        ).count()

        return jsonify({
            'growth': {
                'clubs': {
                    'current': clubs_current,
                    'previous': clubs_previous,
                    'change': ((clubs_current - clubs_previous) / clubs_previous * 100) if clubs_previous > 0 else 0
                },
                'sponsors': {
                    'current': sponsors_current,
                    'previous': sponsors_previous,
                    'change': ((sponsors_current - sponsors_previous) / sponsors_previous * 100) if sponsors_previous > 0 else 0
                },
                'revenue': {
                    'current': float(revenue_current),
                    'previous': float(revenue_previous),
                    'change': ((revenue_current - revenue_previous) / revenue_previous * 100) if revenue_previous > 0 else 0
                }
            },
            'daily': daily_data,
            'clubs_by_type': dict(clubs_by_type),
            'subscriptions_by_plan': dict(subs_by_plan),
            'lead_funnel': funnel,
            'churned': churned
        }), 200

    except Exception as e:
        print(f"Error in analytics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# SUBSCRIPTION PLANS
# ============================================================

@admin_bp.route('/plans', methods=['GET'])
@jwt_required()
def get_plans():
    """Lista piani di abbonamento"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    plans = SubscriptionPlan.query.filter_by(attivo=True).order_by(
        SubscriptionPlan.ordine
    ).all()

    return jsonify([p.to_dict() for p in plans]), 200


@admin_bp.route('/plans', methods=['POST'])
@jwt_required()
def create_plan():
    """Crea nuovo piano abbonamento"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    if not data.get('nome') or not data.get('codice'):
        return jsonify({'error': 'Nome e codice sono obbligatori'}), 400

    if SubscriptionPlan.query.filter_by(codice=data['codice']).first():
        return jsonify({'error': 'Codice già esistente'}), 400

    plan = SubscriptionPlan(
        nome=data['nome'],
        codice=data['codice'],
        descrizione=data.get('descrizione'),
        prezzo_mensile=data.get('prezzo_mensile', 0),
        prezzo_trimestrale=data.get('prezzo_trimestrale', 0),
        prezzo_annuale=data.get('prezzo_annuale', 0),
        features=json.dumps(data.get('features', [])),
        max_sponsors=data.get('max_sponsors', -1),
        max_contracts=data.get('max_contracts', -1),
        max_users=data.get('max_users', 5),
        storage_gb=data.get('storage_gb', 5),
        giorni_trial=data.get('giorni_trial', 14),
        ordine=data.get('ordine', 0)
    )

    db.session.add(plan)
    db.session.commit()

    log_action('create', 'subscription_plan', plan.id, f"Creato piano {plan.nome}")

    return jsonify({
        'message': 'Piano creato con successo',
        'plan': plan.to_dict()
    }), 201


@admin_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    """Aggiorna piano abbonamento"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    plan = SubscriptionPlan.query.get_or_404(plan_id)
    data = request.get_json()

    old_data = plan.to_dict()

    if 'nome' in data:
        plan.nome = data['nome']
    if 'descrizione' in data:
        plan.descrizione = data['descrizione']
    if 'prezzo_mensile' in data:
        plan.prezzo_mensile = data['prezzo_mensile']
    if 'prezzo_trimestrale' in data:
        plan.prezzo_trimestrale = data['prezzo_trimestrale']
    if 'prezzo_annuale' in data:
        plan.prezzo_annuale = data['prezzo_annuale']
    if 'features' in data:
        plan.features = json.dumps(data['features'])
    if 'max_sponsors' in data:
        plan.max_sponsors = data['max_sponsors']
    if 'max_contracts' in data:
        plan.max_contracts = data['max_contracts']
    if 'max_users' in data:
        plan.max_users = data['max_users']
    if 'storage_gb' in data:
        plan.storage_gb = data['storage_gb']
    if 'giorni_trial' in data:
        plan.giorni_trial = data['giorni_trial']
    if 'attivo' in data:
        plan.attivo = data['attivo']
    if 'ordine' in data:
        plan.ordine = data['ordine']

    db.session.commit()

    log_action('update', 'subscription_plan', plan.id,
               f"Aggiornato piano {plan.nome}", old_data, plan.to_dict())

    return jsonify({'message': 'Piano aggiornato', 'plan': plan.to_dict()}), 200


@admin_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_plan(plan_id):
    """Disattiva piano (non elimina)"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    plan = SubscriptionPlan.query.get_or_404(plan_id)

    # Verifica se ci sono abbonamenti attivi
    active_subs = Subscription.query.filter_by(
        plan_id=plan_id,
        status='active'
    ).count()

    if active_subs > 0:
        return jsonify({
            'error': f'Impossibile disattivare: {active_subs} abbonamenti attivi'
        }), 400

    plan.attivo = False
    db.session.commit()

    log_action('delete', 'subscription_plan', plan.id, f"Disattivato piano {plan.nome}")

    return jsonify({'message': 'Piano disattivato'}), 200


# ============================================================
# SUBSCRIPTIONS
# ============================================================

@admin_bp.route('/subscriptions', methods=['GET'])
@jwt_required()
def get_subscriptions():
    """Lista abbonamenti con filtri"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    status = request.args.get('status')
    plan_id = request.args.get('plan_id')
    expiring = request.args.get('expiring')  # days

    query = Subscription.query

    if status:
        query = query.filter_by(status=status)
    if plan_id:
        query = query.filter_by(plan_id=int(plan_id))
    if expiring:
        days = int(expiring)
        future_date = datetime.utcnow() + timedelta(days=days)
        query = query.filter(
            Subscription.data_fine <= future_date,
            Subscription.data_fine >= datetime.utcnow()
        )

    subscriptions = query.order_by(Subscription.data_fine).all()

    return jsonify([s.to_dict() for s in subscriptions]), 200


@admin_bp.route('/subscriptions', methods=['POST'])
@jwt_required()
def create_subscription():
    """Crea nuovo abbonamento per un club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    if not data.get('club_id') or not data.get('plan_id'):
        return jsonify({'error': 'club_id e plan_id sono obbligatori'}), 400

    club = Club.query.get_or_404(data['club_id'])
    plan = SubscriptionPlan.query.get_or_404(data['plan_id'])

    # Verifica abbonamento esistente
    existing = Subscription.query.filter_by(
        club_id=club.id,
        status='active'
    ).first()

    if existing:
        return jsonify({'error': 'Il club ha già un abbonamento attivo'}), 400

    billing_cycle = data.get('billing_cycle', 'monthly')
    is_trial = data.get('is_trial', False)

    # Calcola date
    data_inizio = datetime.utcnow()
    if is_trial:
        data_fine = data_inizio + timedelta(days=plan.giorni_trial)
        importo = 0
    else:
        if billing_cycle == 'monthly':
            data_fine = data_inizio + timedelta(days=30)
            importo = plan.prezzo_mensile
        elif billing_cycle == 'quarterly':
            data_fine = data_inizio + timedelta(days=90)
            importo = plan.prezzo_trimestrale
        else:  # yearly
            data_fine = data_inizio + timedelta(days=365)
            importo = plan.prezzo_annuale

    subscription = Subscription(
        club_id=club.id,
        plan_id=plan.id,
        billing_cycle=billing_cycle,
        status='trial' if is_trial else 'active',
        is_trial=is_trial,
        data_inizio=data_inizio,
        data_fine=data_fine,
        importo_corrente=importo,
        note=data.get('note')
    )

    db.session.add(subscription)

    # Aggiorna il club
    club.nome_abbonamento = plan.nome
    club.costo_abbonamento = importo
    club.data_scadenza_licenza = data_fine
    club.account_attivo = True

    # Log evento
    event = SubscriptionEvent(
        subscription_id=subscription.id,
        tipo='created',
        descrizione=f"Abbonamento creato: {plan.nome} ({billing_cycle})",
        dati=json.dumps({
            'plan': plan.nome,
            'billing_cycle': billing_cycle,
            'is_trial': is_trial,
            'importo': importo
        })
    )
    db.session.add(event)

    db.session.commit()

    log_action('create', 'subscription', subscription.id,
               f"Creato abbonamento {plan.nome} per {club.nome}")

    return jsonify({
        'message': 'Abbonamento creato',
        'subscription': subscription.to_dict()
    }), 201


@admin_bp.route('/subscriptions/<int:sub_id>', methods=['GET'])
@jwt_required()
def get_subscription(sub_id):
    """Dettaglio abbonamento con storico eventi"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    subscription = Subscription.query.get_or_404(sub_id)
    events = SubscriptionEvent.query.filter_by(
        subscription_id=sub_id
    ).order_by(SubscriptionEvent.timestamp.desc()).all()

    result = subscription.to_dict()
    result['events'] = [e.to_dict() for e in events]

    return jsonify(result), 200


@admin_bp.route('/subscriptions/<int:sub_id>/renew', methods=['POST'])
@jwt_required()
def renew_subscription(sub_id):
    """Rinnova abbonamento"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    subscription = Subscription.query.get_or_404(sub_id)
    data = request.get_json() or {}

    plan = subscription.plan
    billing_cycle = data.get('billing_cycle', subscription.billing_cycle)

    # Calcola nuova data fine
    if billing_cycle == 'monthly':
        days = 30
        importo = plan.prezzo_mensile
    elif billing_cycle == 'quarterly':
        days = 90
        importo = plan.prezzo_trimestrale
    else:
        days = 365
        importo = plan.prezzo_annuale

    # Se ancora attivo, estendi dalla data_fine
    # Se scaduto, estendi da oggi
    if subscription.data_fine and subscription.data_fine > datetime.utcnow():
        new_end = subscription.data_fine + timedelta(days=days)
    else:
        new_end = datetime.utcnow() + timedelta(days=days)

    old_end = subscription.data_fine
    subscription.data_fine = new_end
    subscription.billing_cycle = billing_cycle
    subscription.importo_corrente = importo
    subscription.status = 'active'
    subscription.is_trial = False
    subscription.data_ultimo_rinnovo = datetime.utcnow()

    # Aggiorna club
    subscription.club.data_scadenza_licenza = new_end
    subscription.club.costo_abbonamento = importo
    subscription.club.account_attivo = True

    # Log evento
    event = SubscriptionEvent(
        subscription_id=subscription.id,
        tipo='renewed',
        descrizione=f"Abbonamento rinnovato fino al {new_end.strftime('%d/%m/%Y')}",
        dati=json.dumps({
            'old_end': old_end.isoformat() if old_end else None,
            'new_end': new_end.isoformat(),
            'billing_cycle': billing_cycle,
            'importo': importo
        })
    )
    db.session.add(event)

    db.session.commit()

    log_action('renew', 'subscription', subscription.id,
               f"Rinnovato abbonamento per {subscription.club.nome}")

    return jsonify({
        'message': 'Abbonamento rinnovato',
        'subscription': subscription.to_dict()
    }), 200


@admin_bp.route('/subscriptions/<int:sub_id>/upgrade', methods=['POST'])
@jwt_required()
def upgrade_subscription(sub_id):
    """Upgrade/downgrade piano"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    subscription = Subscription.query.get_or_404(sub_id)
    data = request.get_json()

    if not data.get('new_plan_id'):
        return jsonify({'error': 'new_plan_id richiesto'}), 400

    old_plan = subscription.plan
    new_plan = SubscriptionPlan.query.get_or_404(data['new_plan_id'])

    # Determina tipo cambio
    is_upgrade = new_plan.prezzo_mensile > old_plan.prezzo_mensile
    tipo = 'upgraded' if is_upgrade else 'downgraded'

    # Calcola nuovo importo
    billing_cycle = subscription.billing_cycle
    if billing_cycle == 'monthly':
        importo = new_plan.prezzo_mensile
    elif billing_cycle == 'quarterly':
        importo = new_plan.prezzo_trimestrale
    else:
        importo = new_plan.prezzo_annuale

    subscription.plan_id = new_plan.id
    subscription.importo_corrente = importo

    # Aggiorna club
    subscription.club.nome_abbonamento = new_plan.nome
    subscription.club.costo_abbonamento = importo

    # Log evento
    event = SubscriptionEvent(
        subscription_id=subscription.id,
        tipo=tipo,
        descrizione=f"Piano cambiato da {old_plan.nome} a {new_plan.nome}",
        dati=json.dumps({
            'old_plan': old_plan.nome,
            'new_plan': new_plan.nome,
            'new_importo': importo
        })
    )
    db.session.add(event)

    db.session.commit()

    log_action(tipo, 'subscription', subscription.id,
               f"{tipo.capitalize()} da {old_plan.nome} a {new_plan.nome}")

    return jsonify({
        'message': f'Piano {"aggiornato" if is_upgrade else "modificato"}',
        'subscription': subscription.to_dict()
    }), 200


@admin_bp.route('/subscriptions/<int:sub_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription(sub_id):
    """Cancella abbonamento"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    subscription = Subscription.query.get_or_404(sub_id)
    data = request.get_json() or {}

    motivo = data.get('motivo', 'Cancellato da admin')
    immediate = data.get('immediate', False)

    if immediate:
        subscription.status = 'cancelled'
        subscription.data_cancellazione = datetime.utcnow()
        subscription.club.account_attivo = False
    else:
        # Cancella a fine periodo
        subscription.auto_renew = False
        subscription.motivo_cancellazione = motivo

    # Log evento
    event = SubscriptionEvent(
        subscription_id=subscription.id,
        tipo='cancelled',
        descrizione=f"Abbonamento cancellato: {motivo}",
        dati=json.dumps({
            'immediate': immediate,
            'motivo': motivo
        })
    )
    db.session.add(event)

    db.session.commit()

    log_action('cancel', 'subscription', subscription.id,
               f"Cancellato abbonamento per {subscription.club.nome}: {motivo}")

    return jsonify({
        'message': 'Abbonamento cancellato',
        'subscription': subscription.to_dict()
    }), 200


# ============================================================
# CRM - LEADS
# ============================================================

@admin_bp.route('/leads', methods=['GET'])
@jwt_required()
def get_leads():
    """Lista leads con filtri"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    stage = request.args.get('stage')
    temperatura = request.args.get('temperatura')
    fonte = request.args.get('fonte')
    assigned_to = request.args.get('assigned_to')
    search = request.args.get('search')

    query = CRMLead.query

    if stage:
        query = query.filter_by(stage=stage)
    if temperatura:
        query = query.filter_by(temperatura=temperatura)
    if fonte:
        query = query.filter_by(fonte=fonte)
    if assigned_to:
        query = query.filter_by(assegnato_a=int(assigned_to))
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                CRMLead.nome_club.ilike(search_term),
                CRMLead.contatto_nome.ilike(search_term),
                CRMLead.email.ilike(search_term)
            )
        )

    leads = query.order_by(CRMLead.score.desc(), CRMLead.updated_at.desc()).all()

    return jsonify([l.to_dict() for l in leads]), 200


@admin_bp.route('/leads', methods=['POST'])
@jwt_required()
def create_lead():
    """Crea nuovo lead"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    if not data.get('nome_club'):
        return jsonify({'error': 'Nome club è obbligatorio'}), 400

    lead = CRMLead(
        nome_club=data['nome_club'],
        tipologia_sport=data.get('tipologia_sport'),
        logo_url=data.get('logo_url'),
        citta=data.get('citta'),
        provincia=data.get('provincia'),
        regione=data.get('regione'),
        sito_web=data.get('sito_web'),
        fonte=data.get('fonte', 'direct'),
        # Referente principale
        contatto_nome=data.get('contatto_nome'),
        contatto_cognome=data.get('contatto_cognome'),
        contatto_ruolo=data.get('contatto_ruolo'),
        contatto_email=data.get('contatto_email'),
        contatto_telefono=data.get('contatto_telefono'),
        contatti_aggiuntivi=data.get('contatti_aggiuntivi'),
        # Pipeline defaults
        stage='nuovo',
        temperatura='cold',
        valore_stimato=data.get('valore_stimato', 0),
        piano_interesse=data.get('piano_interesse'),
        note=data.get('note')
    )

    # Calcola score iniziale
    lead.update_score()

    db.session.add(lead)
    db.session.commit()

    # Log attività creazione
    activity = CRMLeadActivity(
        lead_id=lead.id,
        tipo='note',
        descrizione='Lead creato',
        admin_id=int(get_jwt_identity())
    )
    db.session.add(activity)
    db.session.commit()

    log_action('create', 'lead', lead.id, f"Creato lead {lead.nome_club}")

    # Trigger automazione
    try:
        from app.services.admin_automation_triggers import trigger_admin_lead_created
        trigger_admin_lead_created(lead)
    except Exception as e:
        print(f"[Trigger] lead_created error: {e}")

    return jsonify({
        'message': 'Lead creato',
        'lead': lead.to_dict()
    }), 201


@admin_bp.route('/leads/<int:lead_id>', methods=['GET'])
@jwt_required()
def get_lead(lead_id):
    """Dettaglio lead con attività"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = CRMLead.query.get_or_404(lead_id)
    activities = CRMLeadActivity.query.filter_by(
        lead_id=lead_id
    ).order_by(CRMLeadActivity.created_at.desc()).all()

    result = lead.to_dict()
    result['activities'] = [a.to_dict() for a in activities]

    return jsonify(result), 200


@admin_bp.route('/leads/<int:lead_id>', methods=['PUT'])
@jwt_required()
def update_lead(lead_id):
    """Aggiorna lead"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = CRMLead.query.get_or_404(lead_id)
    data = request.get_json()

    old_stage = lead.stage

    # Update fields
    for field in ['nome_club', 'tipologia_sport', 'logo_url', 'citta', 'provincia', 'regione',
                  'sito_web', 'fonte', 'contatto_nome', 'contatto_cognome', 'contatto_ruolo',
                  'contatto_email', 'contatto_telefono', 'contatti_aggiuntivi',
                  'email', 'telefono', 'stage', 'temperatura', 'valore_stimato',
                  'piano_interesse', 'note', 'data_prossimo_contatto', 'motivo_perdita']:
        if field in data:
            if field == 'data_prossimo_contatto' and data[field]:
                setattr(lead, field, datetime.fromisoformat(data[field]))
            else:
                setattr(lead, field, data[field])

    # Ricalcola score
    lead.update_score()
    lead.updated_at = datetime.utcnow()

    # Log cambio stage
    stage_changed = old_stage != lead.stage
    if stage_changed:
        activity = CRMLeadActivity(
            lead_id=lead.id,
            tipo='stage_change',
            descrizione=f"Stage cambiato da {old_stage} a {lead.stage}",
            admin_id=int(get_jwt_identity())
        )
        db.session.add(activity)

    db.session.commit()

    # Trigger automazione cambio stage
    if stage_changed:
        try:
            from app.services.admin_automation_triggers import trigger_admin_lead_stage_changed
            trigger_admin_lead_stage_changed(lead, old_stage, lead.stage)
        except Exception as e:
            print(f"[Trigger] lead_stage_changed error: {e}")

    log_action('update', 'lead', lead.id, f"Aggiornato lead {lead.nome_club}")

    return jsonify({
        'message': 'Lead aggiornato',
        'lead': lead.to_dict()
    }), 200


@admin_bp.route('/leads/<int:lead_id>/activity', methods=['POST'])
@jwt_required()
def add_lead_activity(lead_id):
    """Aggiungi attività al lead"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = CRMLead.query.get_or_404(lead_id)
    data = request.get_json()

    if not data.get('tipo') or not data.get('descrizione'):
        return jsonify({'error': 'tipo e descrizione richiesti'}), 400

    activity = CRMLeadActivity(
        lead_id=lead.id,
        tipo=data['tipo'],
        descrizione=data['descrizione'],
        admin_id=int(get_jwt_identity()),
        data_schedulata=datetime.fromisoformat(data['data_schedulata']) if data.get('data_schedulata') else None,
        completata=data.get('completata', False),
        esito=data.get('esito')
    )

    db.session.add(activity)

    # Aggiorna data ultimo contatto per attività di contatto effettivo
    contact_activities = ['call', 'email', 'meeting', 'demo', 'proposal_sent', 'follow_up']
    if data['tipo'] in contact_activities:
        lead.data_ultimo_contatto = datetime.utcnow()

    # Aggiorna temperatura se specificata
    if data.get('update_temperatura'):
        lead.temperatura = data['update_temperatura']

    lead.update_score()
    lead.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Attività aggiunta',
        'activity': activity.to_dict()
    }), 201


@admin_bp.route('/leads/<int:lead_id>/convert', methods=['POST'])
@jwt_required()
def convert_lead(lead_id):
    """Converti lead in club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = CRMLead.query.get_or_404(lead_id)
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'email e password richiesti per creare il club'}), 400

    # Verifica email non già usata
    if Club.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email già utilizzata'}), 400

    # Crea club
    club = Club(
        nome=lead.nome_club,
        tipologia=lead.tipologia_club or 'calcio',
        email=data['email'],
        telefono=lead.telefono,
        referente_nome=lead.contatto_nome,
        referente_ruolo=lead.contatto_ruolo,
        account_attivo=True
    )
    club.set_password(data['password'])

    db.session.add(club)
    db.session.flush()  # Get club.id

    # Aggiorna lead
    lead.stage = 'vinto'
    lead.converted_club_id = club.id
    lead.data_conversione = datetime.utcnow()

    # Crea abbonamento se richiesto
    if data.get('plan_id'):
        plan = SubscriptionPlan.query.get(data['plan_id'])
        if plan:
            billing_cycle = data.get('billing_cycle', 'monthly')
            is_trial = data.get('is_trial', True)

            if is_trial:
                data_fine = datetime.utcnow() + timedelta(days=plan.giorni_trial)
                importo = 0
            else:
                if billing_cycle == 'monthly':
                    data_fine = datetime.utcnow() + timedelta(days=30)
                    importo = plan.prezzo_mensile
                elif billing_cycle == 'quarterly':
                    data_fine = datetime.utcnow() + timedelta(days=90)
                    importo = plan.prezzo_trimestrale
                else:
                    data_fine = datetime.utcnow() + timedelta(days=365)
                    importo = plan.prezzo_annuale

            subscription = Subscription(
                club_id=club.id,
                plan_id=plan.id,
                billing_cycle=billing_cycle,
                status='trial' if is_trial else 'active',
                is_trial=is_trial,
                data_inizio=datetime.utcnow(),
                data_fine=data_fine,
                importo_corrente=importo
            )
            db.session.add(subscription)

            club.nome_abbonamento = plan.nome
            club.costo_abbonamento = importo
            club.data_scadenza_licenza = data_fine

    # Log attività
    activity = CRMLeadActivity(
        lead_id=lead.id,
        tipo='note',
        descrizione=f"Lead convertito in club (ID: {club.id})",
        admin_id=int(get_jwt_identity())
    )
    db.session.add(activity)

    db.session.commit()

    log_action('convert', 'lead', lead.id,
               f"Lead {lead.nome_club} convertito in club {club.id}")

    # Trigger automazione
    try:
        from app.services.admin_automation_triggers import trigger_admin_lead_converted, trigger_admin_club_created
        trigger_admin_lead_converted(lead, club)
        trigger_admin_club_created(club)
    except Exception as e:
        print(f"[Trigger] lead_converted error: {e}")

    return jsonify({
        'message': 'Lead convertito con successo',
        'club_id': club.id,
        'lead': lead.to_dict()
    }), 200


@admin_bp.route('/leads/pipeline', methods=['GET'])
@jwt_required()
def get_pipeline():
    """Vista pipeline con lead raggruppati per stage"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # TUTTI gli 8 stage del pipeline - inclusi vinto e perso
    stages = ['nuovo', 'contattato', 'qualificato', 'demo', 'proposta', 'negoziazione', 'vinto', 'perso']

    pipeline = {}
    for stage in stages:
        leads = CRMLead.query.filter_by(stage=stage).order_by(
            CRMLead.score.desc()
        ).all()
        pipeline[stage] = {
            'leads': [l.to_dict() for l in leads],
            'count': len(leads),
            'value': sum(l.valore_stimato or 0 for l in leads)
        }

    # Statistiche generali - escludi vinto/perso dal valore pipeline attiva
    active_stages = ['nuovo', 'contattato', 'qualificato', 'demo', 'proposta', 'negoziazione']
    total_value = sum(pipeline[s]['value'] for s in active_stages)
    total_leads = sum(pipeline[s]['count'] for s in active_stages)

    # Won/Lost questo mese
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    won_month = CRMLead.query.filter(
        CRMLead.stage == 'vinto',
        CRMLead.data_conversione >= month_start
    ).count()
    lost_month = CRMLead.query.filter(
        CRMLead.stage == 'perso',
        CRMLead.updated_at >= month_start
    ).count()

    return jsonify({
        'pipeline': pipeline,
        'stats': {
            'total_value': total_value,
            'total_leads': total_leads,
            'won_month': won_month,
            'lost_month': lost_month
        }
    }), 200


# ============================================================
# EMAIL TEMPLATES & COMMUNICATIONS
# ============================================================

@admin_bp.route('/email-templates', methods=['GET'])
@jwt_required()
def get_email_templates():
    """Lista template email"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    include_inactive = request.args.get('all', 'false').lower() == 'true'
    if include_inactive:
        templates = AdminEmailTemplate.query.order_by(AdminEmailTemplate.nome).all()
    else:
        templates = AdminEmailTemplate.query.filter_by(attivo=True).order_by(AdminEmailTemplate.nome).all()
    return jsonify([t.to_dict() for t in templates]), 200


@admin_bp.route('/email-templates', methods=['POST'])
@jwt_required()
def create_email_template():
    """Crea template email"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    if not data.get('codice') or not data.get('nome') or not data.get('oggetto'):
        return jsonify({'error': 'codice, nome e oggetto sono obbligatori'}), 400

    if AdminEmailTemplate.query.filter_by(codice=data['codice']).first():
        return jsonify({'error': 'Codice già esistente'}), 400

    template = AdminEmailTemplate(
        codice=data['codice'],
        nome=data['nome'],
        oggetto=data['oggetto'],
        corpo_html=data.get('corpo_html', ''),
        corpo_text=data.get('corpo_text', ''),
        variabili=json.dumps(data.get('variabili', [])),
        categoria=data.get('categoria', 'general'),
        trigger_automatico=data.get('trigger_automatico', False),
        trigger_evento=data.get('trigger_evento'),
        trigger_giorni=data.get('trigger_giorni')
    )

    db.session.add(template)
    db.session.commit()

    log_action('create', 'email_template', template.id, f"Creato template {template.nome}")

    return jsonify({
        'message': 'Template creato',
        'template': template.to_dict()
    }), 201


@admin_bp.route('/email-templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_email_template(template_id):
    """Aggiorna template email"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = AdminEmailTemplate.query.get_or_404(template_id)
    data = request.get_json()

    for field in ['nome', 'oggetto', 'corpo_html', 'corpo_text', 'categoria',
                  'trigger_automatico', 'trigger_evento', 'trigger_giorni', 'attivo']:
        if field in data:
            setattr(template, field, data[field])

    if 'variabili' in data:
        template.variabili = json.dumps(data['variabili'])

    template.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Template aggiornato',
        'template': template.to_dict()
    }), 200


@admin_bp.route('/email-templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_email_template(template_id):
    """Elimina template email"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = AdminEmailTemplate.query.get_or_404(template_id)
    nome = template.nome
    db.session.delete(template)
    db.session.commit()

    log_action('delete', 'email_template', template_id, f"Eliminato template {nome}")

    return jsonify({'message': 'Template eliminato'}), 200


@admin_bp.route('/communications/send', methods=['POST'])
@jwt_required()
def send_communication():
    """Invia comunicazione a uno o più destinatari"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    template_id = data.get('template_id')
    recipients = data.get('recipients', [])  # [{type: 'club', id: 1}, ...]
    custom_subject = data.get('subject')
    custom_body = data.get('body')

    if not recipients:
        return jsonify({'error': 'Nessun destinatario specificato'}), 400

    template = None
    if template_id:
        template = AdminEmailTemplate.query.get(template_id)

    sent_count = 0
    errors = []

    for recipient in recipients:
        try:
            # Determina email destinatario
            email = None
            nome = None

            if recipient['type'] == 'club':
                club = Club.query.get(recipient['id'])
                if club:
                    email = club.email
                    nome = club.nome
            elif recipient['type'] == 'lead':
                lead = CRMLead.query.get(recipient['id'])
                if lead and lead.email:
                    email = lead.email
                    nome = lead.nome_club
            elif recipient['type'] == 'email':
                email = recipient.get('email')
                nome = recipient.get('nome', email)

            if not email:
                errors.append(f"Email non trovata per {recipient}")
                continue

            # Prepara contenuto
            subject = custom_subject or (template.oggetto if template else 'Messaggio da Pitch Partner')
            body = custom_body or (template.corpo_html if template else '')

            # Sostituisci variabili base
            body = body.replace('{{nome}}', nome or '')
            subject = subject.replace('{{nome}}', nome or '')

            # Log email (in produzione qui invieresti realmente)
            email_log = EmailLog(
                template_id=template_id,
                destinatario_tipo=recipient['type'],
                destinatario_id=recipient.get('id'),
                destinatario_email=email,
                oggetto=subject,
                status='sent',  # In produzione: 'queued'
                inviato_da=int(get_jwt_identity())
            )
            db.session.add(email_log)
            sent_count += 1

        except Exception as e:
            errors.append(f"Errore per {recipient}: {str(e)}")

    db.session.commit()

    log_action('send_email', 'communication', None,
               f"Inviate {sent_count} email")

    return jsonify({
        'message': f'Inviate {sent_count} comunicazioni',
        'sent': sent_count,
        'errors': errors
    }), 200


@admin_bp.route('/communications/history', methods=['GET'])
@jwt_required()
def get_communication_history():
    """Storico comunicazioni inviate"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    logs = EmailLog.query.order_by(
        EmailLog.created_at.desc()
    ).paginate(page=page, per_page=per_page)

    return jsonify({
        'emails': [l.to_dict() for l in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }), 200


# ============================================================
# AUDIT LOG
# ============================================================

@admin_bp.route('/audit-log', methods=['GET'])
@jwt_required()
def get_audit_log():
    """Storico azioni admin"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 100, type=int)
    entita = request.args.get('entita')
    azione = request.args.get('azione')

    query = AuditLog.query

    if entita:
        query = query.filter_by(entita=entita)
    if azione:
        query = query.filter_by(azione=azione)

    logs = query.order_by(
        AuditLog.timestamp.desc()
    ).paginate(page=page, per_page=per_page)

    return jsonify({
        'logs': [l.to_dict() for l in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }), 200


# ============================================================
# CLUB MANAGEMENT - ABBONAMENTI E FATTURE
# ============================================================

@admin_bp.route('/clubs/stats', methods=['GET'])
@jwt_required()
def get_clubs_stats():
    """Statistiche KPI per i club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    try:
        # Conta club totali
        total_clubs = Club.query.count()

        # Club attivi (account_attivo = True)
        active_clubs = Club.query.filter_by(account_attivo=True).count()

        # Contratti attivi
        now = datetime.utcnow().date()
        active_contracts = AdminContract.query.filter(
            AdminContract.status == 'active',
            AdminContract.end_date >= now
        ).all()

        # Contratti scaduti
        expired_contracts = AdminContract.query.filter(
            or_(
                AdminContract.status == 'expired',
                and_(AdminContract.status == 'active', AdminContract.end_date < now)
            )
        ).count()

        # Calcola MRR dai contratti attivi (valore annuale / 12)
        mrr = 0
        for contract in active_contracts:
            if contract.total_value:
                # Assumiamo contratti annuali, dividiamo per 12
                if contract.payment_terms == 'monthly':
                    mrr += contract.total_value
                elif contract.payment_terms == 'quarterly':
                    mrr += contract.total_value / 3
                elif contract.payment_terms == 'semi_annual':
                    mrr += contract.total_value / 6
                else:  # annual o default
                    mrr += contract.total_value / 12

        # Fatture non pagate
        unpaid_invoices = ClubInvoice.query.filter(
            ClubInvoice.status.in_(['sent', 'overdue'])
        ).count()

        unpaid_amount = db.session.query(func.sum(ClubInvoice.total)).filter(
            ClubInvoice.status.in_(['sent', 'overdue'])
        ).scalar() or 0

        return jsonify({
            'total_clubs': total_clubs,
            'active_clubs': active_clubs,
            'trial_clubs': 0,
            'active_subscriptions': len(active_contracts),
            'expired_subscriptions': expired_contracts,
            'mrr': round(mrr, 2),
            'unpaid_invoices': unpaid_invoices,
            'unpaid_amount': round(unpaid_amount, 2)
        }), 200

    except Exception as e:
        print(f"Error in get_clubs_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/clubs/<int:club_id>/subscription', methods=['GET'])
@jwt_required()
def get_club_subscription(club_id):
    """Ottieni dettagli abbonamento di un club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)

    # Cerca abbonamento attivo
    subscription = Subscription.query.filter_by(club_id=club_id).order_by(
        Subscription.created_at.desc()
    ).first()

    # Storico eventi abbonamento
    events = []
    if subscription:
        events = SubscriptionEvent.query.filter_by(
            subscription_id=subscription.id
        ).order_by(SubscriptionEvent.created_at.desc()).limit(20).all()

    return jsonify({
        'subscription': subscription.to_dict() if subscription else None,
        'events': [e.to_dict() for e in events],
        'club_legacy': {
            'nome_abbonamento': club.nome_abbonamento,
            'costo_abbonamento': club.costo_abbonamento,
            'tipologia_abbonamento': club.tipologia_abbonamento,
            'data_scadenza_licenza': club.data_scadenza_licenza.isoformat() if club.data_scadenza_licenza else None,
            'account_attivo': club.account_attivo
        }
    }), 200


@admin_bp.route('/clubs/<int:club_id>/subscription', methods=['POST'])
@jwt_required()
def create_club_subscription(club_id):
    """Crea un nuovo abbonamento per il club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    data = request.get_json()

    # Verifica se esiste un piano
    plan_id = data.get('plan_id')
    plan = SubscriptionPlan.query.get(plan_id) if plan_id else None

    if not plan:
        return jsonify({'error': 'Piano non valido'}), 400

    # Calcola date
    now = datetime.utcnow()
    billing_cycle = data.get('billing_cycle', 'monthly')

    if billing_cycle == 'monthly':
        end_date = now + timedelta(days=30)
    elif billing_cycle == 'quarterly':
        end_date = now + timedelta(days=90)
    else:  # annual
        end_date = now + timedelta(days=365)

    # Crea subscription
    subscription = Subscription(
        club_id=club_id,
        plan_id=plan_id,
        billing_cycle=billing_cycle,
        data_inizio=now,
        data_fine=end_date,
        data_prossimo_rinnovo=end_date,
        status=data.get('status', 'active'),
        auto_renew=data.get('auto_renew', True),
        is_trial=data.get('is_trial', False),
        trial_ends_at=datetime.fromisoformat(data['trial_ends_at']) if data.get('trial_ends_at') else None,
        prezzo_concordato=data.get('prezzo_concordato', plan.prezzo_mensile if plan else 0),
        sconto_percentuale=data.get('sconto_percentuale', 0),
        payment_method=data.get('payment_method'),
        note_interne=data.get('note_interne')
    )

    db.session.add(subscription)

    # Crea evento
    event = SubscriptionEvent(
        subscription_id=subscription.id,
        evento='created',
        new_plan_id=plan_id,
        new_price=subscription.prezzo_concordato,
        triggered_by='admin',
        admin_id=int(get_jwt_identity()),
        note=data.get('note')
    )
    db.session.add(event)

    # Aggiorna anche i campi legacy del club
    club.nome_abbonamento = plan.nome if plan else None
    club.costo_abbonamento = subscription.prezzo_concordato
    club.tipologia_abbonamento = billing_cycle
    club.data_scadenza_licenza = end_date
    club.account_attivo = True

    db.session.commit()

    return jsonify({
        'message': 'Abbonamento creato con successo',
        'subscription': subscription.to_dict()
    }), 201


@admin_bp.route('/clubs/<int:club_id>/subscription', methods=['PUT'])
@jwt_required()
def update_club_subscription(club_id):
    """Aggiorna abbonamento di un club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    data = request.get_json()

    subscription = Subscription.query.filter_by(club_id=club_id).order_by(
        Subscription.created_at.desc()
    ).first()

    if not subscription:
        return jsonify({'error': 'Nessun abbonamento trovato'}), 404

    old_status = subscription.status
    old_plan_id = subscription.plan_id

    # Aggiorna campi
    if 'status' in data:
        subscription.status = data['status']
        if data['status'] == 'cancelled':
            subscription.cancelled_at = datetime.utcnow()
            subscription.cancellation_reason = data.get('cancellation_reason')

    if 'plan_id' in data:
        subscription.plan_id = data['plan_id']
        plan = SubscriptionPlan.query.get(data['plan_id'])
        if plan:
            club.nome_abbonamento = plan.nome

    if 'prezzo_concordato' in data:
        subscription.prezzo_concordato = data['prezzo_concordato']
        club.costo_abbonamento = data['prezzo_concordato']

    if 'auto_renew' in data:
        subscription.auto_renew = data['auto_renew']

    if 'data_fine' in data:
        subscription.data_fine = datetime.fromisoformat(data['data_fine'])
        club.data_scadenza_licenza = subscription.data_fine

    if 'note_interne' in data:
        subscription.note_interne = data['note_interne']

    # Determina tipo evento
    evento_tipo = 'updated'
    if old_status != subscription.status:
        if subscription.status == 'cancelled':
            evento_tipo = 'cancelled'
        elif subscription.status == 'active' and old_status in ['suspended', 'cancelled']:
            evento_tipo = 'reactivated'
        elif subscription.status == 'suspended':
            evento_tipo = 'suspended'

    if old_plan_id != subscription.plan_id:
        old_plan = SubscriptionPlan.query.get(old_plan_id)
        new_plan = SubscriptionPlan.query.get(subscription.plan_id)
        if old_plan and new_plan:
            if (new_plan.prezzo_mensile or 0) > (old_plan.prezzo_mensile or 0):
                evento_tipo = 'upgraded'
            else:
                evento_tipo = 'downgraded'

    # Crea evento
    event = SubscriptionEvent(
        subscription_id=subscription.id,
        evento=evento_tipo,
        old_plan_id=old_plan_id,
        new_plan_id=subscription.plan_id,
        triggered_by='admin',
        admin_id=int(get_jwt_identity()),
        note=data.get('note')
    )
    db.session.add(event)

    # Aggiorna stato club
    club.account_attivo = subscription.status in ['active', 'trial']

    db.session.commit()

    return jsonify({
        'message': 'Abbonamento aggiornato',
        'subscription': subscription.to_dict()
    }), 200


# ============================================================
# CLUB INVOICES - FATTURE
# ============================================================

@admin_bp.route('/clubs/<int:club_id>/invoices', methods=['GET'])
@jwt_required()
def get_club_invoices(club_id):
    """Ottieni fatture di un club (usa AdminInvoice)"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    Club.query.get_or_404(club_id)

    # Usa AdminInvoice invece di ClubInvoice
    invoices = AdminInvoice.query.filter_by(club_id=club_id).order_by(
        AdminInvoice.issue_date.desc()
    ).all()

    # Calcola totali
    total_paid = sum(i.total_amount for i in invoices if i.status == 'paid')
    total_pending = sum(i.total_amount for i in invoices if i.status in ['pending', 'overdue'])

    return jsonify({
        'invoices': [i.to_dict() for i in invoices],
        'summary': {
            'total_invoices': len(invoices),
            'total_paid': round(total_paid, 2),
            'total_pending': round(total_pending, 2),
            'paid_count': len([i for i in invoices if i.status == 'paid']),
            'pending_count': len([i for i in invoices if i.status in ['pending', 'overdue']])
        }
    }), 200


@admin_bp.route('/clubs/<int:club_id>/invoices', methods=['POST'])
@jwt_required()
def create_club_invoice(club_id):
    """Crea una nuova fattura per il club (usa AdminInvoice)"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    data = request.get_json()

    # Trova il contratto attivo per questo club
    active_contract = AdminContract.query.filter_by(
        club_id=club_id, status='active'
    ).first()

    if not active_contract:
        return jsonify({'error': 'Nessun contratto attivo per questo club. Crea prima un contratto.'}), 400

    # Genera numero fattura
    year = datetime.utcnow().year
    last_invoice = AdminInvoice.query.filter(
        AdminInvoice.invoice_number.ilike(f'PP-{year}-%')
    ).order_by(AdminInvoice.id.desc()).first()

    if last_invoice:
        last_num = int(last_invoice.invoice_number.split('-')[-1])
        new_num = last_num + 1
    else:
        new_num = 1

    invoice_number = f"PP-{year}-{new_num:04d}"

    # Calcola importi
    subtotal = float(data.get('subtotal', 0))
    vat_rate = float(data.get('tax_rate', 22))
    vat_amount = subtotal * (vat_rate / 100)
    total_amount = subtotal + vat_amount

    # Crea fattura AdminInvoice
    invoice = AdminInvoice(
        contract_id=active_contract.id,
        club_id=club_id,
        invoice_number=invoice_number,
        amount=subtotal,
        vat_rate=vat_rate,
        vat_amount=vat_amount,
        total_amount=total_amount,
        issue_date=datetime.fromisoformat(data['issue_date']).date() if data.get('issue_date') else datetime.utcnow().date(),
        due_date=datetime.fromisoformat(data['due_date']).date() if data.get('due_date') else (datetime.utcnow() + timedelta(days=30)).date(),
        notes=data.get('notes'),
        status=data.get('status', 'pending'),
        created_by=get_jwt_identity()
    )

    db.session.add(invoice)
    db.session.commit()

    # Log azione
    log_action('fattura_creata', 'admin_invoice', invoice.id,
               f"Fattura {invoice_number} creata per club {club.nome}")

    return jsonify({
        'message': 'Fattura creata con successo',
        'invoice': invoice.to_dict()
    }), 201


@admin_bp.route('/clubs/<int:club_id>/invoices/<int:invoice_id>', methods=['PUT'])
@jwt_required()
def update_club_invoice(club_id, invoice_id):
    """Aggiorna una fattura (usa AdminInvoice)"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    invoice = AdminInvoice.query.filter_by(id=invoice_id, club_id=club_id).first_or_404()
    data = request.get_json()

    # Aggiorna campi
    if 'status' in data:
        old_status = invoice.status
        invoice.status = data['status']

        # Se pagata, registra data pagamento
        if data['status'] == 'paid' and old_status != 'paid':
            invoice.payment_date = datetime.utcnow().date()
            invoice.payment_method = data.get('payment_method')
            invoice.payment_reference = data.get('payment_reference')

    if 'amount' in data:
        invoice.amount = float(data['amount'])
    if 'subtotal' in data:
        invoice.amount = float(data['subtotal'])

    if 'vat_rate' in data or 'tax_rate' in data:
        invoice.vat_rate = float(data.get('vat_rate', data.get('tax_rate', invoice.vat_rate)))

    # Ricalcola IVA e totale
    invoice.vat_amount = invoice.amount * (invoice.vat_rate / 100)
    invoice.total_amount = invoice.amount + invoice.vat_amount

    if 'due_date' in data:
        invoice.due_date = datetime.fromisoformat(data['due_date']).date() if data['due_date'] else None

    if 'notes' in data:
        invoice.notes = data['notes']

    if 'invoice_document_url' in data:
        invoice.invoice_document_url = data['invoice_document_url']

    db.session.commit()

    return jsonify({
        'message': 'Fattura aggiornata',
        'invoice': invoice.to_dict()
    }), 200


@admin_bp.route('/clubs/<int:club_id>/invoices/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
def delete_club_invoice(club_id, invoice_id):
    """Elimina una fattura"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    invoice = AdminInvoice.query.filter_by(id=invoice_id, club_id=club_id).first_or_404()

    if invoice.status == 'paid':
        return jsonify({'error': 'Impossibile eliminare una fattura già pagata'}), 400

    db.session.delete(invoice)
    db.session.commit()

    return jsonify({'message': 'Fattura eliminata'}), 200


# ============================================================
# CLUB ACTIVITIES - ATTIVITÀ
# ============================================================

@admin_bp.route('/clubs/<int:club_id>/activities', methods=['GET'])
@jwt_required()
def get_club_activities(club_id):
    """Ottieni attività di un club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    Club.query.get_or_404(club_id)

    activities = ClubActivity.query.filter_by(club_id=club_id).order_by(
        ClubActivity.created_at.desc()
    ).all()

    return jsonify({
        'activities': [a.to_dict() for a in activities]
    }), 200


@admin_bp.route('/clubs/<int:club_id>/activities', methods=['POST'])
@jwt_required()
def create_club_activity(club_id):
    """Crea una nuova attività per il club"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    Club.query.get_or_404(club_id)
    data = request.get_json()

    # Ottieni admin corrente
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id)

    activity = ClubActivity(
        club_id=club_id,
        tipo=data.get('tipo', 'nota'),
        descrizione=data.get('descrizione'),
        esito=data.get('esito'),
        data_schedulata=datetime.fromisoformat(data['data_schedulata']) if data.get('data_schedulata') else None,
        created_by=admin.email if admin else 'admin'
    )

    db.session.add(activity)
    db.session.commit()

    return jsonify({
        'message': 'Attività registrata',
        'activity': activity.to_dict()
    }), 201


## GET /invoices route rimossa - gestita da admin_finance_routes.py (admin_finance_bp)
## La vecchia route leggeva da ClubInvoice (tabella sbagliata)
## La route corretta in admin_finance_routes legge da AdminInvoice


# ============================================
# GLOBAL SEARCH
# ============================================

@admin_bp.route('/search', methods=['GET'])
@jwt_required()
def admin_global_search():
    """Ricerca globale su lead, club, contratti, fatture"""
    if not verify_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    q = request.args.get('q', '').strip()
    if not q or len(q) < 2:
        return jsonify({'results': [], 'total': 0}), 200

    limit_per_type = 5
    search_term = f'%{q}%'
    results = []

    # Search Leads
    leads = CRMLead.query.filter(
        or_(
            CRMLead.nome_club.ilike(search_term),
            CRMLead.contatto_nome.ilike(search_term),
            CRMLead.contatto_cognome.ilike(search_term),
            CRMLead.email.ilike(search_term),
            CRMLead.citta.ilike(search_term)
        )
    ).limit(limit_per_type).all()

    for lead in leads:
        results.append({
            'type': 'lead',
            'id': lead.id,
            'title': lead.nome_club,
            'subtitle': f'{lead.stage} - {lead.citta or ""}',
            'link': f'/admin/leads/{lead.id}'
        })

    # Search Clubs
    clubs = Club.query.filter(
        or_(
            Club.nome.ilike(search_term),
            Club.email.ilike(search_term),
            Club.referente_nome.ilike(search_term),
            Club.referente_cognome.ilike(search_term)
        )
    ).limit(limit_per_type).all()

    for club in clubs:
        results.append({
            'type': 'club',
            'id': club.id,
            'title': club.nome,
            'subtitle': f'{club.email}',
            'link': f'/admin/clubs/{club.id}'
        })

    # Search Admin Contracts
    contracts = AdminContract.query.join(Club).filter(
        or_(
            Club.nome.ilike(search_term),
            AdminContract.plan_type.ilike(search_term),
            AdminContract.notes.ilike(search_term)
        )
    ).limit(limit_per_type).all()

    for c in contracts:
        club_name = c.club.nome if c.club else 'N/D'
        results.append({
            'type': 'contratto',
            'id': c.id,
            'title': f'{c.plan_type} - {club_name}',
            'subtitle': f'{c.status} | {c.start_date.strftime("%d/%m/%Y") if c.start_date else ""} - {c.end_date.strftime("%d/%m/%Y") if c.end_date else ""}',
            'link': f'/admin/contratti/{c.id}'
        })

    # Search Admin Invoices
    invoices = AdminInvoice.query.join(Club).filter(
        or_(
            AdminInvoice.invoice_number.ilike(search_term),
            Club.nome.ilike(search_term)
        )
    ).limit(limit_per_type).all()

    for inv in invoices:
        club_name = inv.club.nome if inv.club else 'N/D'
        results.append({
            'type': 'fattura',
            'id': inv.id,
            'title': f'{inv.invoice_number} - {club_name}',
            'subtitle': f'{inv.status} | {inv.total_amount:.2f}€',
            'link': '/admin/finanze'
        })

    return jsonify({
        'results': results,
        'total': len(results),
        'query': q
    }), 200
