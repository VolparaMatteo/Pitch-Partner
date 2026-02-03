from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Notification
from datetime import datetime

notification_bp = Blueprint('notification', __name__)


# READ - Ottieni tutte le notifiche dell'utente corrente
@notification_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role not in ['admin', 'club', 'sponsor']:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Query parametri
    only_unread = request.args.get('only_unread', 'false').lower() == 'true'
    limit = request.args.get('limit', type=int)

    query = Notification.query.filter_by(user_type=role, user_id=user_id)

    if only_unread:
        query = query.filter_by(letta=False)

    query = query.order_by(Notification.created_at.desc())

    if limit:
        query = query.limit(limit)

    notifications = query.all()

    notifications_data = []
    for notif in notifications:
        notifications_data.append({
            'id': notif.id,
            'tipo': notif.tipo,
            'titolo': notif.titolo,
            'messaggio': notif.messaggio,
            'link': notif.link,
            'letta': notif.letta,
            'letta_il': notif.letta_il.isoformat() if notif.letta_il else None,
            'created_at': notif.created_at.isoformat()
        })

    # Conta notifiche non lette
    unread_count = Notification.query.filter_by(
        user_type=role,
        user_id=user_id,
        letta=False
    ).count()

    return jsonify({
        'notifications': notifications_data,
        'unread_count': unread_count
    }), 200


# READ - Conta notifiche non lette
@notification_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role not in ['admin', 'club', 'sponsor']:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    unread_count = Notification.query.filter_by(
        user_type=role,
        user_id=user_id,
        letta=False
    ).count()

    return jsonify({'unread_count': unread_count}), 200


# UPDATE - Segna notifica come letta
@notification_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notifica non trovata'}), 404

    # Verifica che la notifica appartenga all'utente
    if notification.user_type != role or notification.user_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    notification.letta = True
    notification.letta_il = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Notifica segnata come letta'}), 200


# UPDATE - Segna tutte le notifiche come lette
@notification_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    notifications = Notification.query.filter_by(
        user_type=role,
        user_id=user_id,
        letta=False
    ).all()

    for notif in notifications:
        notif.letta = True
        notif.letta_il = datetime.utcnow()

    db.session.commit()

    return jsonify({'message': f'{len(notifications)} notifiche segnate come lette'}), 200


# DELETE - Elimina notifica
@notification_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notifica non trovata'}), 404

    # Verifica che la notifica appartenga all'utente
    if notification.user_type != role or notification.user_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notifica eliminata con successo'}), 200


# DELETE - Elimina tutte le notifiche lette
@notification_bp.route('/notifications/clear-read', methods=['DELETE'])
@jwt_required()
def clear_read_notifications():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    notifications = Notification.query.filter_by(
        user_type=role,
        user_id=user_id,
        letta=True
    ).all()

    count = len(notifications)

    for notif in notifications:
        db.session.delete(notif)

    db.session.commit()

    return jsonify({'message': f'{count} notifiche eliminate'}), 200


# ============================================
# SSE (Server-Sent Events) per Real-Time
# ============================================

@notification_bp.route('/notifications/stream', methods=['GET'])
def notification_stream():
    """SSE endpoint per notifiche real-time"""
    from flask import Response, stream_with_context
    from flask_jwt_extended import decode_token
    import json
    import time

    # Autentica via query param token
    token = request.args.get('token')
    if not token:
        return jsonify({'error': 'Token mancante'}), 401

    try:
        decoded = decode_token(token)
        user_type = decoded['sub'].get('role') if isinstance(decoded['sub'], dict) else None
        user_id = int(decoded['sub'].get('id')) if isinstance(decoded['sub'], dict) else int(decoded['sub'])

        if not user_type:
            # Fallback per token vecchio formato
            from flask_jwt_extended import get_jwt
            claims = get_jwt()
            user_type = claims.get('role')
    except Exception as e:
        return jsonify({'error': 'Token non valido'}), 401

    def event_stream():
        """Generator per SSE"""
        last_check = datetime.utcnow()

        while True:
            # Poll database ogni 2 secondi per nuove notifiche
            new_notifications = Notification.query.filter(
                Notification.user_type == user_type,
                Notification.user_id == user_id,
                Notification.created_at > last_check,
                Notification.letta == False
            ).order_by(Notification.created_at.desc()).all()

            if new_notifications:
                # Invia nuove notifiche come SSE
                data = json.dumps([{
                    'id': n.id,
                    'tipo': n.tipo,
                    'titolo': n.titolo,
                    'messaggio': n.messaggio,
                    'link': n.link,
                    'priorita': n.priorita if hasattr(n, 'priorita') else 'normale',
                    'created_at': n.created_at.isoformat()
                } for n in new_notifications])
                yield f"data: {data}\n\n"

                last_check = datetime.utcnow()

            # Heartbeat ogni 30 secondi
            yield f": heartbeat\n\n"

            time.sleep(2)

    return Response(
        stream_with_context(event_stream()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )


# ============================================
# Settings & Analytics
# ============================================

@notification_bp.route('/notifications/settings', methods=['GET', 'PUT'])
@jwt_required()
def notification_settings():
    """Preferenze notifiche (GET/PUT)"""
    # TODO: Implementare tabella NotificationSettings se necessario
    # Per ora ritorno/aggiorno settings dummy

    if request.method == 'GET':
        return jsonify({
            'settings': {
                'email_enabled': True,
                'push_enabled': True,
                'in_app_enabled': True,
                'quiet_hours_start': '22:00',
                'quiet_hours_end': '08:00',
                'types': {
                    'project_update': True,
                    'task_assegnato': True,
                    'task_completato': True,
                    'milestone_raggiunto': True,
                    'scadenza_imminente': True,
                    'commento': True,
                    'cambio_stato': True
                }
            }
        }), 200
    else:  # PUT
        data = request.json
        # Salva settings nel database (da implementare)
        return jsonify({
            'message': 'Impostazioni aggiornate',
            'settings': data
        }), 200
