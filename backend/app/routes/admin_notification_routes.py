from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models import Notification
from app.services.admin_notification_service import AdminNotificationService
from datetime import datetime

admin_notification_bp = Blueprint('admin_notification', __name__)


def _require_admin():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


# POST - Genera notifiche admin (scansiona DB)
@admin_notification_bp.route('/notifications/generate', methods=['POST'])
@jwt_required()
def generate_notifications():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    results = AdminNotificationService.generate_all()
    return jsonify({
        'message': f'{results["totale"]} nuove notifiche generate',
        'details': results
    }), 200


# GET - Lista notifiche admin con filtri e paginazione
@admin_notification_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_admin_notifications():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri
    tipo = request.args.get('tipo')
    priorita = request.args.get('priorita')
    letta = request.args.get('letta')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Notification.query.filter_by(user_type='admin', user_id=0)

    if tipo:
        query = query.filter_by(tipo=tipo)
    if priorita:
        query = query.filter_by(priorita=priorita)
    if letta is not None:
        query = query.filter_by(letta=letta.lower() == 'true')

    query = query.order_by(Notification.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'notifications': [n.to_dict() for n in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }), 200


# GET - Summary conteggi per tipo e priorita
@admin_notification_bp.route('/notifications/summary', methods=['GET'])
@jwt_required()
def get_notifications_summary():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    base_query = Notification.query.filter_by(user_type='admin', user_id=0)

    # Conteggi per stato
    non_lette = base_query.filter_by(letta=False).count()
    totale = base_query.count()

    # Conteggi per tipo (solo non lette)
    by_tipo = {}
    for tipo in ['contratto_scadenza', 'fattura_scaduta', 'nuovo_club', 'lead_followup', 'licenza_scadenza']:
        by_tipo[tipo] = base_query.filter_by(tipo=tipo, letta=False).count()

    # Conteggi per priorita (solo non lette)
    by_priorita = {}
    for p in ['normale', 'alta', 'urgente']:
        by_priorita[p] = base_query.filter_by(priorita=p, letta=False).count()

    return jsonify({
        'non_lette': non_lette,
        'totale': totale,
        'per_tipo': by_tipo,
        'per_priorita': by_priorita
    }), 200


# PUT - Segna singola notifica come letta
@admin_notification_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notifica non trovata'}), 404

    if notification.user_type != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    notification.letta = True
    notification.letta_il = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Notifica segnata come letta'}), 200


# PUT - Segna tutte come lette
@admin_notification_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    notifications = Notification.query.filter_by(
        user_type='admin', user_id=0, letta=False
    ).all()

    for n in notifications:
        n.letta = True
        n.letta_il = datetime.utcnow()

    db.session.commit()

    return jsonify({'message': f'{len(notifications)} notifiche segnate come lette'}), 200


# DELETE - Elimina singola notifica
@admin_notification_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notifica non trovata'}), 404

    if notification.user_type != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notifica eliminata'}), 200
