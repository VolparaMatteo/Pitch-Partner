from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt
from app.services.admin_email_service import AdminEmailService
import smtplib

admin_email_bp = Blueprint('admin_email', __name__)


def _require_admin():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


# GET - Lista account email
@admin_email_bp.route('/email/accounts', methods=['GET'])
@jwt_required()
def get_accounts():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    return jsonify({
        'accounts': AdminEmailService.get_accounts(),
        'sent_folder': AdminEmailService.SENT_FOLDER
    }), 200


# GET - Conteggio non lette per account
@admin_email_bp.route('/email/unread-counts', methods=['GET'])
@jwt_required()
def get_unread_counts():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    force = request.args.get('refresh', 'false').lower() == 'true'
    try:
        counts = AdminEmailService.get_unread_counts(force_refresh=force)
        return jsonify({'counts': counts}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET - Lista email per account
@admin_email_bp.route('/email/<key>/messages', methods=['GET'])
@jwt_required()
def get_messages(key):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    account = AdminEmailService.get_account(key)
    if not account:
        return jsonify({'error': 'Account non trovato'}), 404

    folder = request.args.get('folder', 'INBOX')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', None)
    force = request.args.get('refresh', 'false').lower() == 'true'

    try:
        result = AdminEmailService.fetch_emails(key, folder, page, per_page, search, force_refresh=force)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET - Dettaglio singola email
@admin_email_bp.route('/email/<key>/messages/<uid>', methods=['GET'])
@jwt_required()
def get_message_detail(key, uid):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    account = AdminEmailService.get_account(key)
    if not account:
        return jsonify({'error': 'Account non trovato'}), 404

    folder = request.args.get('folder', 'INBOX')

    try:
        result = AdminEmailService.fetch_email_detail(key, uid, folder)
        if not result:
            return jsonify({'error': 'Email non trovata'}), 404
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET - Download allegato
@admin_email_bp.route('/email/<key>/messages/<uid>/attachment/<filename>', methods=['GET'])
@jwt_required()
def download_attachment(key, uid, filename):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    folder = request.args.get('folder', 'INBOX')

    try:
        result = AdminEmailService.download_attachment(key, uid, filename, folder)
        if not result:
            return jsonify({'error': 'Allegato non trovato'}), 404

        return Response(
            result['data'],
            mimetype=result['content_type'],
            headers={
                'Content-Disposition': f'attachment; filename="{result["filename"]}"',
                'Content-Length': str(len(result['data']))
            }
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# POST - Invio email
@admin_email_bp.route('/email/<key>/send', methods=['POST'])
@jwt_required()
def send_email(key):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    account = AdminEmailService.get_account(key)
    if not account:
        return jsonify({'error': 'Account non trovato'}), 404

    data = request.get_json()
    to = data.get('to')
    subject = data.get('subject')
    body_html = data.get('body_html', '')
    cc = data.get('cc')
    bcc = data.get('bcc')

    if not to or not subject:
        return jsonify({'error': 'Destinatario e oggetto sono obbligatori'}), 400

    try:
        AdminEmailService.send_email(key, to, subject, body_html, cc, bcc)
        return jsonify({'message': 'Email inviata con successo'}), 200
    except smtplib.SMTPSenderRefused as e:
        return jsonify({'error': f'Invio bloccato da Aruba per {key}@pitchpartner.it. Cambiare la password dal pannello Aruba.'}), 502
    except smtplib.SMTPAuthenticationError:
        return jsonify({'error': f'Autenticazione fallita per {key}@pitchpartner.it. Verificare la password.'}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# PUT - Segna come letta
@admin_email_bp.route('/email/<key>/messages/<uid>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(key, uid):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    folder = request.args.get('folder', 'INBOX')

    try:
        AdminEmailService.mark_as_read(key, uid, folder)
        return jsonify({'message': 'Email segnata come letta'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# DELETE - Elimina email
@admin_email_bp.route('/email/<key>/messages/<uid>', methods=['DELETE'])
@jwt_required()
def delete_email(key, uid):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    folder = request.args.get('folder', 'INBOX')

    try:
        AdminEmailService.delete_email(key, uid, folder)
        return jsonify({'message': 'Email eliminata'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
