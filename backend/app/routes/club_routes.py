from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from app import db
from app.models import Club, ClubUser, Sponsor, SponsorInvitation, HeadOfTerms, Pagamento, Fattura
from datetime import datetime, timedelta
from sqlalchemy import func
import os
import uuid

# Upload configuration
BASE_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
LOGO_FOLDER = os.path.join(BASE_UPLOAD_FOLDER, 'logos')
os.makedirs(LOGO_FOLDER, exist_ok=True)
ALLOWED_IMAGES = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def verify_club():
    """Helper function to verify club role and return club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return claims.get('club_id')


def verify_club_user():
    """Helper function to verify club role and return user_id and club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None, None
    return claims.get('user_id'), claims.get('club_id')


club_bp = Blueprint('club', __name__)


@club_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email e password richiesti'}), 400

    # Cerca l'utente per email
    user = ClubUser.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error': 'Credenziali non valide'}), 401

    # Verifica password utente
    if not user.check_password(password):
        return jsonify({'error': 'Credenziali non valide'}), 401

    # Verifica utente attivo
    if not user.is_active:
        return jsonify({'error': 'Utente disabilitato. Contatta l\'amministratore del club.'}), 403

    # Ottieni il club
    club = user.club

    # Verifica se il club è stato attivato
    if not club.is_activated:
        return jsonify({'error': 'Account club non attivato. Controlla la tua email per il link di attivazione.'}), 403

    # Verifica club attivo (non sospeso)
    if not club.account_attivo:
        return jsonify({'error': 'Account sospeso. Contatta l\'amministrazione di Pitch Partner.'}), 403

    # Verifica licenza valida
    if not club.is_licenza_valida():
        return jsonify({'error': 'Licenza scaduta. Contatta l\'amministrazione di Pitch Partner per rinnovare.'}), 403

    # Aggiorna last_login
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
        'club': {
            'id': club.id,
            'nome': club.nome,
            'email': club.email,
            'logo_url': club.logo_url
        },
        'user': user.to_dict()
    }), 200


@club_bp.route('/users', methods=['GET'])
@jwt_required()
def get_club_users():
    """Ottieni tutti gli utenti del club"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    users = ClubUser.query.filter_by(club_id=club_id).order_by(ClubUser.created_at.asc()).all()

    return jsonify({
        'users': [user.to_dict() for user in users],
        'total': len(users)
    }), 200


@club_bp.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Ottieni l'utente corrente"""
    user_id, club_id = verify_club_user()
    if not user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    user = ClubUser.query.get_or_404(user_id)

    return jsonify(user.to_dict()), 200


@club_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)

    return jsonify({
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
        'account_attivo': club.account_attivo,
        'data_scadenza_licenza': club.data_scadenza_licenza.isoformat() if club.data_scadenza_licenza else None,
        'nome_abbonamento': club.nome_abbonamento,
        'costo_abbonamento': club.costo_abbonamento,
        'tipologia_abbonamento': club.tipologia_abbonamento
    }), 200


# Brand Settings
@club_bp.route('/brand-settings', methods=['GET'])
@jwt_required()
def get_brand_settings():
    """Restituisce le impostazioni brand del club"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)

    return jsonify({
        'colore_primario': club.brand_colore_primario or '#1A1A1A',
        'colore_secondario': club.brand_colore_secondario or '#85FF00',
        'colore_accento': club.brand_colore_accento or '#3B82F6',
        'font': club.brand_font or 'Inter',
        'stile_proposta': club.brand_stile_proposta or 'modern',
        'logo_chiaro': club.brand_logo_chiaro,
        'sfondo_header': club.brand_sfondo_header,
        'footer_text': club.brand_footer_text,
        'logo_url': club.logo_url,
        'nome_club': club.nome
    }), 200


@club_bp.route('/brand-settings', methods=['PUT'])
@jwt_required()
def update_brand_settings():
    """Aggiorna le impostazioni brand del club"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)
    data = request.get_json()

    # Aggiorna campi brand
    if 'colore_primario' in data:
        club.brand_colore_primario = data['colore_primario']
    if 'colore_secondario' in data:
        club.brand_colore_secondario = data['colore_secondario']
    if 'colore_accento' in data:
        club.brand_colore_accento = data['colore_accento']
    if 'font' in data:
        club.brand_font = data['font']
    if 'stile_proposta' in data:
        club.brand_stile_proposta = data['stile_proposta']
    if 'logo_chiaro' in data:
        club.brand_logo_chiaro = data['logo_chiaro']
    if 'sfondo_header' in data:
        club.brand_sfondo_header = data['sfondo_header']
    if 'footer_text' in data:
        club.brand_footer_text = data['footer_text']

    db.session.commit()

    return jsonify({
        'message': 'Impostazioni brand aggiornate',
        'colore_primario': club.brand_colore_primario,
        'colore_secondario': club.brand_colore_secondario,
        'colore_accento': club.brand_colore_accento,
        'font': club.brand_font,
        'stile_proposta': club.brand_stile_proposta,
        'logo_chiaro': club.brand_logo_chiaro,
        'sfondo_header': club.brand_sfondo_header,
        'footer_text': club.brand_footer_text
    }), 200


# CRUD Sponsor
@club_bp.route('/sponsors', methods=['GET'])
@jwt_required()
def get_sponsors():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsors = Sponsor.query.filter_by(club_id=club_id).all()

    sponsors_data = []
    for s in sponsors:
        # Calcola contratti attivi e valore totale per questo sponsor
        active_contracts = HeadOfTerms.query.filter_by(
            sponsor_id=s.id,
            status='attivo'
        ).all()

        active_contracts_count = len(active_contracts)
        active_contracts_value = sum(c.compenso for c in active_contracts if c.compenso)

        sponsors_data.append({
            'id': s.id,
            'ragione_sociale': s.ragione_sociale,
            'logo_url': s.logo_url,
            'email': s.email,
            'telefono': s.telefono,
            'sito_web': s.sito_web,
            'settore_merceologico': s.settore_merceologico,
            'account_attivo': s.account_attivo,
            'created_at': s.created_at.isoformat(),
            'active_contracts_count': active_contracts_count,
            'active_contracts_value': active_contracts_value
        })

    return jsonify({
        'sponsors': sponsors_data
    }), 200


@club_bp.route('/sponsors/analytics', methods=['GET'])
@jwt_required()
def get_sponsors_analytics():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Valore totale contratti attivi
    total_value = db.session.query(func.sum(HeadOfTerms.compenso)).filter(
        HeadOfTerms.club_id == club_id,
        HeadOfTerms.status == 'attivo'
    ).scalar() or 0

    # Timeline acquisizione sponsor (ultimi 12 mesi)
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    sponsors_timeline = db.session.query(
        func.strftime('%Y-%m', Sponsor.created_at).label('month'),
        func.count(Sponsor.id).label('count')
    ).filter(
        Sponsor.club_id == club_id,
        Sponsor.created_at >= twelve_months_ago
    ).group_by('month').order_by('month').all()

    timeline_data = [{'month': row.month, 'count': row.count} for row in sponsors_timeline]

    # Contratti in scadenza (prossimi 60 giorni)
    sixty_days_from_now = datetime.utcnow() + timedelta(days=60)
    expiring_contracts = HeadOfTerms.query.filter(
        HeadOfTerms.club_id == club_id,
        HeadOfTerms.status == 'attivo',
        HeadOfTerms.data_fine <= sixty_days_from_now,
        HeadOfTerms.data_fine >= datetime.utcnow()
    ).order_by(HeadOfTerms.data_fine).all()

    expiring_data = [{
        'contract_id': c.id,
        'contract_name': c.nome_contratto,
        'sponsor_id': c.sponsor_id,
        'sponsor_name': c.sponsor.ragione_sociale,
        'expiry_date': c.data_fine.isoformat(),
        'days_left': (c.data_fine - datetime.utcnow()).days,
        'value': c.compenso
    } for c in expiring_contracts]

    return jsonify({
        'total_active_value': total_value,
        'sponsors_timeline': timeline_data,
        'expiring_contracts': expiring_data
    }), 200


@club_bp.route('/sponsors/<int:sponsor_id>', methods=['GET'])
@jwt_required()
def get_sponsor(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.filter_by(id=sponsor_id, club_id=club_id).first_or_404()

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
        'membership_status': sponsor.membership_status or 'pending',
        'data_adesione': sponsor.data_adesione.isoformat() if sponsor.data_adesione else None,
        'ruolo_sponsorship': sponsor.ruolo_sponsorship,
        'note_interne_club': sponsor.note_interne_club,
        'created_at': sponsor.created_at.isoformat() if sponsor.created_at else None,
        'updated_at': sponsor.updated_at.isoformat() if sponsor.updated_at else None
    }), 200


@club_bp.route('/sponsors', methods=['POST'])
@jwt_required()
def create_sponsor():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione campi obbligatori - solo ragione sociale richiesta
    if not data.get('ragione_sociale'):
        return jsonify({'error': 'Ragione sociale è obbligatoria'}), 400

    # Verifica email unica (solo se fornita)
    if data.get('email') and Sponsor.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email già utilizzata'}), 400

    sponsor = Sponsor(
        club_id=club_id,
        ragione_sociale=data['ragione_sociale'],
        partita_iva=data.get('partita_iva'),
        codice_fiscale=data.get('codice_fiscale'),
        settore_merceologico=data.get('settore_merceologico'),
        logo_url=data.get('logo_url'),
        indirizzo_sede=data.get('indirizzo_sede'),
        email=data.get('email'),
        telefono=data.get('telefono'),
        sito_web=data.get('sito_web'),
        facebook=data.get('facebook'),
        instagram=data.get('instagram'),
        tiktok=data.get('tiktok'),
        linkedin=data.get('linkedin'),
        twitter=data.get('twitter'),
        referente_nome=data.get('referente_nome'),
        referente_cognome=data.get('referente_cognome'),
        referente_ruolo=data.get('referente_ruolo'),
        referente_contatto=data.get('referente_contatto'),
        note_interne_club=data.get('note_interne'),
        account_attivo=False  # Attivo solo dopo registrazione via invito
    )

    db.session.add(sponsor)
    db.session.flush()  # Get sponsor ID before commit

    # Crea automaticamente un invito per lo sponsor
    invitation = SponsorInvitation(
        club_id=club_id,
        token=str(uuid.uuid4()),
        email_suggerita=data.get('email'),
        ragione_sociale_suggerita=data['ragione_sociale'],
        settore_suggerito=data.get('settore_merceologico'),
        note_club=data.get('note_interne'),
        status='pending',
        expires_at=datetime.utcnow() + timedelta(days=30),
        sponsor_membership_id=sponsor.id
    )
    db.session.add(invitation)

    # Collega l'invito allo sponsor
    sponsor.from_invitation_id = invitation.id

    db.session.commit()

    return jsonify({
        'message': 'Sponsor creato con successo',
        'sponsor': {
            'id': sponsor.id,
            'ragione_sociale': sponsor.ragione_sociale,
            'email': sponsor.email
        },
        'invitation': {
            'id': invitation.id,
            'token': invitation.token,
            'expires_at': invitation.expires_at.isoformat()
        }
    }), 201


@club_bp.route('/sponsors/<int:sponsor_id>/invitation', methods=['GET'])
@jwt_required()
def get_sponsor_invitation(sponsor_id):
    """Ottieni l'invito attivo per uno sponsor"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.filter_by(id=sponsor_id, club_id=club_id).first_or_404()

    # Cerca un invito attivo per questo sponsor
    invitation = SponsorInvitation.query.filter_by(
        sponsor_membership_id=sponsor_id,
        status='pending'
    ).order_by(SponsorInvitation.created_at.desc()).first()

    if not invitation:
        return jsonify({'has_invitation': False}), 200

    return jsonify({
        'has_invitation': True,
        'invitation': {
            'id': invitation.id,
            'token': invitation.token,
            'email_suggerita': invitation.email_suggerita,
            'status': invitation.status,
            'expires_at': invitation.expires_at.isoformat(),
            'is_expired': invitation.is_expired(),
            'created_at': invitation.created_at.isoformat()
        }
    }), 200


@club_bp.route('/sponsors/<int:sponsor_id>/invitation/regenerate', methods=['POST'])
@jwt_required()
def regenerate_sponsor_invitation(sponsor_id):
    """Genera o rigenera un invito per uno sponsor"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.filter_by(id=sponsor_id, club_id=club_id).first_or_404()

    # Annulla eventuali inviti precedenti
    old_invitations = SponsorInvitation.query.filter_by(
        sponsor_membership_id=sponsor_id,
        status='pending'
    ).all()
    for inv in old_invitations:
        inv.status = 'cancelled'

    # Crea nuovo invito
    invitation = SponsorInvitation(
        club_id=club_id,
        token=str(uuid.uuid4()),
        email_suggerita=sponsor.email,
        ragione_sociale_suggerita=sponsor.ragione_sociale,
        settore_suggerito=sponsor.settore_merceologico,
        status='pending',
        expires_at=datetime.utcnow() + timedelta(days=30),
        sponsor_membership_id=sponsor.id
    )
    db.session.add(invitation)

    # Aggiorna riferimento nello sponsor
    sponsor.from_invitation_id = invitation.id

    db.session.commit()

    return jsonify({
        'message': 'Invito generato con successo',
        'invitation': {
            'id': invitation.id,
            'token': invitation.token,
            'email_suggerita': invitation.email_suggerita,
            'status': invitation.status,
            'expires_at': invitation.expires_at.isoformat(),
            'created_at': invitation.created_at.isoformat()
        }
    }), 201


@club_bp.route('/sponsors/<int:sponsor_id>', methods=['PUT'])
@jwt_required()
def update_sponsor(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.filter_by(id=sponsor_id, club_id=club_id).first_or_404()
    data = request.get_json()

    # Verifica email unica se viene modificata
    if data.get('email') and data['email'] != sponsor.email:
        if Sponsor.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email già utilizzata'}), 400

    # Aggiorna campi
    if 'ragione_sociale' in data:
        sponsor.ragione_sociale = data['ragione_sociale']
    if 'partita_iva' in data:
        sponsor.partita_iva = data['partita_iva']
    if 'codice_fiscale' in data:
        sponsor.codice_fiscale = data['codice_fiscale']
    if 'settore_merceologico' in data:
        sponsor.settore_merceologico = data['settore_merceologico']
    if 'logo_url' in data:
        sponsor.logo_url = data['logo_url']
    if 'indirizzo_sede' in data:
        sponsor.indirizzo_sede = data['indirizzo_sede']
    if 'email' in data:
        sponsor.email = data['email']
    if 'telefono' in data:
        sponsor.telefono = data['telefono']
    if 'sito_web' in data:
        sponsor.sito_web = data['sito_web']
    if 'facebook' in data:
        sponsor.facebook = data['facebook']
    if 'instagram' in data:
        sponsor.instagram = data['instagram']
    if 'tiktok' in data:
        sponsor.tiktok = data['tiktok']
    if 'linkedin' in data:
        sponsor.linkedin = data['linkedin']
    if 'twitter' in data:
        sponsor.twitter = data['twitter']
    if 'referente_nome' in data:
        sponsor.referente_nome = data['referente_nome']
    if 'referente_cognome' in data:
        sponsor.referente_cognome = data['referente_cognome']
    if 'referente_ruolo' in data:
        sponsor.referente_ruolo = data['referente_ruolo']
    if 'referente_contatto' in data:
        sponsor.referente_contatto = data['referente_contatto']
    if 'account_attivo' in data:
        sponsor.account_attivo = data['account_attivo']
    if 'password' in data:
        sponsor.set_password(data['password'])

    db.session.commit()

    return jsonify({'message': 'Sponsor aggiornato con successo'}), 200


@club_bp.route('/sponsors/<int:sponsor_id>', methods=['DELETE'])
@jwt_required()
def delete_sponsor(sponsor_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    sponsor = Sponsor.query.filter_by(id=sponsor_id, club_id=club_id).first_or_404()
    db.session.delete(sponsor)
    db.session.commit()

    return jsonify({'message': 'Sponsor eliminato con successo'}), 200


# Gestione Pagamenti e Fatture del Club
@club_bp.route('/pagamenti', methods=['GET'])
@jwt_required()
def get_club_pagamenti():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    pagamenti = Pagamento.query.filter_by(club_id=club_id).order_by(Pagamento.data_pagamento.desc()).all()

    return jsonify([{
        'id': p.id,
        'importo': p.importo,
        'data_pagamento': p.data_pagamento.isoformat(),
        'descrizione': p.descrizione,
        'metodo_pagamento': p.metodo_pagamento
    } for p in pagamenti]), 200


@club_bp.route('/fatture', methods=['GET'])
@jwt_required()
def get_club_fatture():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    fatture = Fattura.query.filter_by(club_id=club_id).order_by(Fattura.data_fattura.desc()).all()

    return jsonify([{
        'id': f.id,
        'numero_fattura': f.numero_fattura,
        'data_fattura': f.data_fattura.isoformat(),
        'importo': f.importo,
        'file_url': f.file_url,
        'note': f.note
    } for f in fatture]), 200


# Upload/Delete Club Logo
@club_bp.route('/upload-logo', methods=['POST'])
@jwt_required()
def upload_club_logo():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if 'logo' not in request.files:
        return jsonify({'error': 'Nessun file caricato'}), 400

    file = request.files['logo']

    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400

    # Check file extension
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_IMAGES:
        return jsonify({'error': 'Formato file non supportato. Usa: png, jpg, jpeg, gif, webp'}), 400

    # Check file size (max 5MB)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > 5 * 1024 * 1024:
        return jsonify({'error': 'File troppo grande. Massimo 5MB'}), 400

    club = Club.query.get_or_404(club_id)

    # Delete old logo if exists
    if club.logo_url:
        old_filename = club.logo_url.split('/')[-1]
        old_filepath = os.path.join(LOGO_FOLDER, old_filename)
        if os.path.exists(old_filepath):
            try:
                os.remove(old_filepath)
            except Exception:
                pass

    # Generate unique filename
    filename = f"club_{club_id}_{uuid.uuid4()}.{ext}"
    filepath = os.path.join(LOGO_FOLDER, filename)

    # Save file
    file.save(filepath)

    # Update club logo_url
    logo_url = f"/api/uploads/logos/{filename}"
    club.logo_url = logo_url
    db.session.commit()

    return jsonify({
        'message': 'Logo caricato con successo',
        'logo_url': logo_url
    }), 200


@club_bp.route('/delete-logo', methods=['DELETE'])
@jwt_required()
def delete_club_logo():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    club = Club.query.get_or_404(club_id)

    if not club.logo_url:
        return jsonify({'error': 'Nessun logo da eliminare'}), 400

    # Delete file from filesystem
    filename = club.logo_url.split('/')[-1]
    filepath = os.path.join(LOGO_FOLDER, filename)
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            print(f"Error deleting logo file: {e}")

    # Update database
    club.logo_url = None
    db.session.commit()

    return jsonify({'message': 'Logo eliminato con successo'}), 200


