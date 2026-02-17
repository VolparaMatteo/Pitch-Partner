import os
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models import Club, Lead, ContactPerson

admin_whatsapp_bp = Blueprint('admin_whatsapp', __name__)

SIDECAR_URL = os.getenv('WHATSAPP_SIDECAR_URL', 'http://localhost:3200')


def _require_admin():
    claims = get_jwt()
    return claims.get('role') == 'admin'


def _proxy_get(path, timeout=15):
    """Proxy GET request to the WhatsApp sidecar."""
    try:
        resp = requests.get(f'{SIDECAR_URL}{path}', timeout=timeout)
        return jsonify(resp.json()), resp.status_code
    except requests.ConnectionError:
        return jsonify({'error': 'Servizio WhatsApp non raggiungibile. Assicurati che il sidecar sia avviato.'}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _proxy_post(path, data=None):
    """Proxy POST request to the WhatsApp sidecar."""
    try:
        resp = requests.post(f'{SIDECAR_URL}{path}', json=data or {}, timeout=30)
        return jsonify(resp.json()), resp.status_code
    except requests.ConnectionError:
        return jsonify({'error': 'Servizio WhatsApp non raggiungibile. Assicurati che il sidecar sia avviato.'}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- Proxy Routes ---

@admin_whatsapp_bp.route('/whatsapp/status', methods=['GET'])
@jwt_required()
def whatsapp_status():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    return _proxy_get('/status')


@admin_whatsapp_bp.route('/whatsapp/qr', methods=['GET'])
@jwt_required()
def whatsapp_qr():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    return _proxy_get('/qr')


@admin_whatsapp_bp.route('/whatsapp/send', methods=['POST'])
@jwt_required()
def whatsapp_send():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    data = request.get_json()
    return _proxy_post('/send', data)


@admin_whatsapp_bp.route('/whatsapp/contacts', methods=['GET'])
@jwt_required()
def whatsapp_contacts():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    return _proxy_get('/contacts')


@admin_whatsapp_bp.route('/whatsapp/chats', methods=['GET'])
@jwt_required()
def whatsapp_chats():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    refresh = request.args.get('refresh', '')
    path = '/chats?refresh=true' if refresh == 'true' else '/chats'
    return _proxy_get(path)


@admin_whatsapp_bp.route('/whatsapp/chats/<path:chat_id>/messages', methods=['GET'])
@jwt_required()
def whatsapp_chat_messages(chat_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    return _proxy_get(f'/chats/{chat_id}/messages')


@admin_whatsapp_bp.route('/whatsapp/media/<path:msg_id>', methods=['GET'])
@jwt_required()
def whatsapp_media(msg_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    return _proxy_get(f'/media/{msg_id}', timeout=30)


@admin_whatsapp_bp.route('/whatsapp/messages-by-phone/<phone>', methods=['GET'])
@jwt_required()
def whatsapp_messages_by_phone(phone):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    return _proxy_get(f'/messages-by-phone/{phone}', timeout=30)


@admin_whatsapp_bp.route('/whatsapp/disconnect', methods=['POST'])
@jwt_required()
def whatsapp_disconnect():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    return _proxy_post('/disconnect')


# --- DB Contacts (direct query, no sidecar) ---

@admin_whatsapp_bp.route('/whatsapp/db-contacts', methods=['GET'])
@jwt_required()
def whatsapp_db_contacts():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    contacts = []

    # Club con telefono
    clubs = Club.query.filter(
        Club.telefono.isnot(None),
        Club.telefono != ''
    ).all()
    for c in clubs:
        contacts.append({
            'tipo': 'club',
            'id': c.id,
            'nome': c.nome,
            'telefono': c.telefono,
            'email': c.email or ''
        })

    # Lead con telefono
    leads = Lead.query.filter(
        Lead.telefono.isnot(None),
        Lead.telefono != ''
    ).all()
    for l in leads:
        contacts.append({
            'tipo': 'lead',
            'id': l.id,
            'nome': l.ragione_sociale,
            'telefono': l.telefono,
            'email': l.email or ''
        })

    # ContactPerson con telefono
    contact_persons = ContactPerson.query.filter(
        ContactPerson.telefono.isnot(None),
        ContactPerson.telefono != ''
    ).all()
    for cp in contact_persons:
        contacts.append({
            'tipo': 'contatto',
            'id': cp.id,
            'nome': f'{cp.nome} {cp.cognome}',
            'telefono': cp.telefono,
            'email': cp.email or '',
            'ruolo': cp.ruolo or ''
        })

    return jsonify({'contacts': contacts}), 200
