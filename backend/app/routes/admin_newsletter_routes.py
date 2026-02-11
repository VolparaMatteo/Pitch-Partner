from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.admin_newsletter_service import AdminNewsletterService

admin_newsletter_bp = Blueprint('admin_newsletter', __name__)


def _require_admin():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


# ------------------------------------------------------------------ Stats

@admin_newsletter_bp.route('/newsletter/stats', methods=['GET'])
@jwt_required()
def get_stats():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    stats = AdminNewsletterService.get_stats()
    return jsonify(stats), 200


# ------------------------------------------------------------------ Groups

@admin_newsletter_bp.route('/newsletter/groups', methods=['GET'])
@jwt_required()
def get_groups():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    groups = AdminNewsletterService.get_groups()
    return jsonify({'groups': groups}), 200


@admin_newsletter_bp.route('/newsletter/groups', methods=['POST'])
@jwt_required()
def create_group():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    data = request.get_json()
    if not data or not data.get('nome'):
        return jsonify({'error': 'Nome obbligatorio'}), 400
    group = AdminNewsletterService.create_group(
        nome=data['nome'],
        descrizione=data.get('descrizione'),
        colore=data.get('colore', '#6B7280')
    )
    return jsonify(group), 201


@admin_newsletter_bp.route('/newsletter/groups/<int:group_id>', methods=['GET'])
@jwt_required()
def get_group(group_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    group = AdminNewsletterService.get_group(group_id)
    if not group:
        return jsonify({'error': 'Gruppo non trovato'}), 404
    return jsonify(group), 200


@admin_newsletter_bp.route('/newsletter/groups/<int:group_id>', methods=['PUT'])
@jwt_required()
def update_group(group_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    data = request.get_json()
    result = AdminNewsletterService.update_group(group_id, data)
    if not result:
        return jsonify({'error': 'Gruppo non trovato'}), 404
    return jsonify(result), 200


@admin_newsletter_bp.route('/newsletter/groups/<int:group_id>', methods=['DELETE'])
@jwt_required()
def delete_group(group_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    success = AdminNewsletterService.delete_group(group_id)
    if not success:
        return jsonify({'error': 'Gruppo non trovato'}), 404
    return jsonify({'message': 'Gruppo eliminato'}), 200


# ------------------------------------------------------------------ Recipients

@admin_newsletter_bp.route('/newsletter/groups/<int:group_id>/recipients', methods=['POST'])
@jwt_required()
def add_recipients(group_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    data = request.get_json()
    recipients_list = data.get('recipients', [])
    if not recipients_list:
        return jsonify({'error': 'Lista destinatari vuota'}), 400
    result = AdminNewsletterService.add_recipients(group_id, recipients_list)
    if result is None:
        return jsonify({'error': 'Gruppo non trovato'}), 404
    return jsonify(result), 200


@admin_newsletter_bp.route('/newsletter/groups/<int:group_id>/recipients', methods=['GET'])
@jwt_required()
def get_recipients(group_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    search = request.args.get('search', None)
    result = AdminNewsletterService.get_recipients(group_id, page, per_page, search)
    return jsonify(result), 200


@admin_newsletter_bp.route('/newsletter/recipients/<int:recipient_id>', methods=['DELETE'])
@jwt_required()
def remove_recipient(recipient_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    success = AdminNewsletterService.remove_recipient(recipient_id)
    if not success:
        return jsonify({'error': 'Destinatario non trovato'}), 404
    return jsonify({'message': 'Destinatario rimosso'}), 200


# ------------------------------------------------------------------ Campaigns

@admin_newsletter_bp.route('/newsletter/campaigns', methods=['GET'])
@jwt_required()
def get_campaigns():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', None)
    result = AdminNewsletterService.get_campaigns(page, per_page, status)
    return jsonify(result), 200


@admin_newsletter_bp.route('/newsletter/campaigns', methods=['POST'])
@jwt_required()
def create_campaign():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    data = request.get_json()
    required = ['titolo', 'oggetto', 'corpo_html', 'account_key']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} obbligatorio'}), 400
    campaign = AdminNewsletterService.create_campaign(data)
    return jsonify(campaign), 201


@admin_newsletter_bp.route('/newsletter/campaigns/<int:campaign_id>', methods=['GET'])
@jwt_required()
def get_campaign(campaign_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    campaign = AdminNewsletterService.get_campaign(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campagna non trovata'}), 404
    return jsonify(campaign), 200


@admin_newsletter_bp.route('/newsletter/campaigns/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    data = request.get_json()
    result = AdminNewsletterService.update_campaign(campaign_id, data)
    if result is None:
        return jsonify({'error': 'Campagna non trovata'}), 404
    if isinstance(result, dict) and 'error' in result:
        return jsonify(result), 400
    return jsonify(result), 200


@admin_newsletter_bp.route('/newsletter/campaigns/<int:campaign_id>', methods=['DELETE'])
@jwt_required()
def delete_campaign(campaign_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    result = AdminNewsletterService.delete_campaign(campaign_id)
    if result is None:
        return jsonify({'error': 'Campagna non trovata'}), 404
    if isinstance(result, dict) and 'error' in result:
        return jsonify(result), 400
    return jsonify({'message': 'Campagna eliminata'}), 200


@admin_newsletter_bp.route('/newsletter/campaigns/<int:campaign_id>/send', methods=['POST'])
@jwt_required()
def send_campaign(campaign_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    result = AdminNewsletterService.send_campaign(campaign_id)
    if result is None:
        return jsonify({'error': 'Campagna non trovata'}), 404
    if isinstance(result, dict) and 'error' in result:
        return jsonify(result), 400
    return jsonify(result), 200
