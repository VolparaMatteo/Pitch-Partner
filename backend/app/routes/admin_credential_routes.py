from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models import AdminCredential, AuditLog
from cryptography.fernet import Fernet
from datetime import datetime
import base64
import hashlib

admin_credential_bp = Blueprint('admin_credential', __name__)


def _require_admin():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


def log_action(azione, entita, entita_id=None, dettagli=None):
    try:
        admin_id = get_jwt_identity()
        log = AuditLog(
            admin_id=int(admin_id) if admin_id else None,
            azione=azione,
            entita=entita,
            entita_id=entita_id,
            dettagli=dettagli,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string[:500] if request.user_agent else None
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Error logging action: {e}")


def _get_fernet():
    """Derive Fernet key from app SECRET_KEY."""
    secret = current_app.config['SECRET_KEY'].encode('utf-8')
    key = base64.urlsafe_b64encode(hashlib.sha256(secret).digest())
    return Fernet(key)


def _encrypt_password(password):
    if not password:
        return None
    f = _get_fernet()
    return f.encrypt(password.encode('utf-8')).decode('utf-8')


def _decrypt_password(encrypted):
    if not encrypted:
        return None
    f = _get_fernet()
    return f.decrypt(encrypted.encode('utf-8')).decode('utf-8')


# GET - Lista credenziali (senza password)
@admin_credential_bp.route('/credentials', methods=['GET'])
@jwt_required()
def get_credentials():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    categoria = request.args.get('categoria')
    search = request.args.get('search', '')

    query = AdminCredential.query

    if categoria and categoria != 'tutte':
        query = query.filter(AdminCredential.categoria == categoria)
    if search:
        s = f'%{search}%'
        query = query.filter(
            db.or_(
                AdminCredential.nome_servizio.ilike(s),
                AdminCredential.username.ilike(s),
                AdminCredential.url.ilike(s),
                AdminCredential.note.ilike(s)
            )
        )

    query = query.order_by(AdminCredential.nome_servizio.asc())
    credentials = query.all()

    return jsonify({
        'credentials': [c.to_dict() for c in credentials]
    }), 200


# POST - Crea credenziale
@admin_credential_bp.route('/credentials', methods=['POST'])
@jwt_required()
def create_credential():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data or not data.get('nome_servizio'):
        return jsonify({'error': 'Il nome servizio è obbligatorio'}), 400

    admin_id = get_jwt_identity()

    credential = AdminCredential(
        nome_servizio=data['nome_servizio'],
        categoria=data.get('categoria', 'altro'),
        username=data.get('username'),
        password_encrypted=_encrypt_password(data.get('password')),
        url=data.get('url'),
        note=data.get('note'),
        created_by=int(admin_id) if admin_id else None
    )

    db.session.add(credential)
    db.session.commit()

    log_action('create', 'credential', credential.id, f"Creata credenziale: {credential.nome_servizio}")

    return jsonify(credential.to_dict()), 201


# PUT - Aggiorna credenziale
@admin_credential_bp.route('/credentials/<int:cred_id>', methods=['PUT'])
@jwt_required()
def update_credential(cred_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    credential = AdminCredential.query.get(cred_id)
    if not credential:
        return jsonify({'error': 'Credenziale non trovata'}), 404

    data = request.get_json()

    if 'nome_servizio' in data:
        credential.nome_servizio = data['nome_servizio']
    if 'categoria' in data:
        credential.categoria = data['categoria']
    if 'username' in data:
        credential.username = data['username']
    if 'password' in data and data['password']:
        credential.password_encrypted = _encrypt_password(data['password'])
    if 'url' in data:
        credential.url = data['url']
    if 'note' in data:
        credential.note = data['note']

    db.session.commit()

    log_action('update', 'credential', credential.id, f"Aggiornata credenziale: {credential.nome_servizio}")

    return jsonify(credential.to_dict()), 200


# DELETE - Elimina credenziale
@admin_credential_bp.route('/credentials/<int:cred_id>', methods=['DELETE'])
@jwt_required()
def delete_credential(cred_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    credential = AdminCredential.query.get(cred_id)
    if not credential:
        return jsonify({'error': 'Credenziale non trovata'}), 404

    nome = credential.nome_servizio
    db.session.delete(credential)
    db.session.commit()

    log_action('delete', 'credential', cred_id, f"Eliminata credenziale: {nome}")

    return jsonify({'message': 'Credenziale eliminata'}), 200


# POST - Reveal password (decripta)
@admin_credential_bp.route('/credentials/<int:cred_id>/reveal', methods=['POST'])
@jwt_required()
def reveal_password(cred_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    credential = AdminCredential.query.get(cred_id)
    if not credential:
        return jsonify({'error': 'Credenziale non trovata'}), 404

    if not credential.password_encrypted:
        return jsonify({'password': ''}), 200

    try:
        password = _decrypt_password(credential.password_encrypted)
    except Exception:
        return jsonify({'error': 'Errore nella decriptazione della password'}), 500

    log_action('reveal', 'credential', credential.id, f"Password rivelata per: {credential.nome_servizio}")

    return jsonify({'password': password}), 200
