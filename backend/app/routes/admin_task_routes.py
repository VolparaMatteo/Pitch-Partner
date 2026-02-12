from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models import Admin, AdminTask, CRMLead, Club, AdminContract, AuditLog
from datetime import datetime, date
from sqlalchemy import func, case, or_
import json

admin_task_bp = Blueprint('admin_task', __name__)


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


# GET - Lista utenti admin (per assegnazione task)
@admin_task_bp.route('/tasks/admins', methods=['GET'])
@jwt_required()
def get_admin_users():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    admins = Admin.query.filter_by(is_active=True).order_by(Admin.nome).all()
    return jsonify([
        {'id': a.id, 'nome': a.nome, 'cognome': a.cognome, 'email': a.email}
        for a in admins
    ]), 200


# GET - Lista task con filtri e paginazione
@admin_task_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri
    stato = request.args.get('stato')
    priorita = request.args.get('priorita')
    tipo = request.args.get('tipo')
    lead_id = request.args.get('lead_id', type=int)
    club_id = request.args.get('club_id', type=int)
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = AdminTask.query

    if stato:
        query = query.filter(AdminTask.stato == stato)
    if priorita:
        query = query.filter(AdminTask.priorita == priorita)
    if tipo:
        query = query.filter(AdminTask.tipo == tipo)
    if lead_id:
        query = query.filter(AdminTask.lead_id == lead_id)
    if club_id:
        query = query.filter(AdminTask.club_id == club_id)
    if search:
        s = f'%{search}%'
        query = query.filter(or_(
            AdminTask.titolo.ilike(s),
            AdminTask.descrizione.ilike(s),
            AdminTask.tags.ilike(s)
        ))

    # Ordinamento: priorita (urgente prima), scadenza ASC (null last)
    priorita_order = case(
        (AdminTask.priorita == 'urgente', 0),
        (AdminTask.priorita == 'alta', 1),
        (AdminTask.priorita == 'media', 2),
        (AdminTask.priorita == 'bassa', 3),
        else_=4
    )
    query = query.order_by(
        AdminTask.data_scadenza.is_(None).asc(),
        AdminTask.data_scadenza.asc(),
        priorita_order,
        AdminTask.created_at.desc()
    )

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'tasks': [t.to_dict() for t in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }), 200


# GET - Stats task
@admin_task_bp.route('/tasks/stats', methods=['GET'])
@jwt_required()
def get_task_stats():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    totale = AdminTask.query.count()
    da_fare = AdminTask.query.filter_by(stato='da_fare').count()
    in_corso = AdminTask.query.filter_by(stato='in_corso').count()
    completati_oggi = AdminTask.query.filter(
        AdminTask.stato == 'completato',
        AdminTask.completato_il >= today_start
    ).count()
    scaduti = AdminTask.query.filter(
        AdminTask.stato.in_(['da_fare', 'in_corso']),
        AdminTask.data_scadenza.isnot(None),
        AdminTask.data_scadenza < now
    ).count()

    # Per priorita
    per_priorita = {}
    for p in ['bassa', 'media', 'alta', 'urgente']:
        per_priorita[p] = AdminTask.query.filter(
            AdminTask.priorita == p,
            AdminTask.stato.in_(['da_fare', 'in_corso'])
        ).count()

    # Per tipo
    per_tipo = {}
    for t in ['generale', 'lead_followup', 'club_onboarding', 'rinnovo_contratto', 'fattura', 'supporto']:
        per_tipo[t] = AdminTask.query.filter(
            AdminTask.tipo == t,
            AdminTask.stato.in_(['da_fare', 'in_corso'])
        ).count()

    return jsonify({
        'totale': totale,
        'da_fare': da_fare,
        'in_corso': in_corso,
        'completati_oggi': completati_oggi,
        'scaduti': scaduti,
        'per_priorita': per_priorita,
        'per_tipo': per_tipo
    }), 200


# GET - Singolo task
@admin_task_bp.route('/tasks/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    task = AdminTask.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task non trovato'}), 404

    return jsonify(task.to_dict()), 200


# POST - Crea task
@admin_task_bp.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data or not data.get('titolo'):
        return jsonify({'error': 'Il titolo è obbligatorio'}), 400

    current_admin_id = get_jwt_identity()
    # Use provided admin_id (assignee) or default to current user
    assigned_admin_id = data.get('admin_id', current_admin_id)

    task = AdminTask(
        admin_id=int(assigned_admin_id) if assigned_admin_id else None,
        titolo=data['titolo'],
        descrizione=data.get('descrizione'),
        tipo=data.get('tipo', 'generale'),
        priorita=data.get('priorita', 'media'),
        stato=data.get('stato', 'da_fare'),
        lead_id=data.get('lead_id'),
        club_id=data.get('club_id'),
        contract_id=data.get('contract_id'),
        data_scadenza=datetime.fromisoformat(data['data_scadenza']) if data.get('data_scadenza') else None,
        tags=data.get('tags')
    )

    db.session.add(task)
    db.session.commit()

    log_action('create', 'task', task.id, f"Creato task: {task.titolo}")

    return jsonify(task.to_dict()), 201


# PUT - Aggiorna task
@admin_task_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    task = AdminTask.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task non trovato'}), 404

    data = request.get_json()

    if 'admin_id' in data:
        task.admin_id = int(data['admin_id']) if data['admin_id'] else None
    if 'titolo' in data:
        task.titolo = data['titolo']
    if 'descrizione' in data:
        task.descrizione = data['descrizione']
    if 'tipo' in data:
        task.tipo = data['tipo']
    if 'priorita' in data:
        task.priorita = data['priorita']
    if 'stato' in data:
        task.stato = data['stato']
        if data['stato'] == 'completato' and not task.completato_il:
            task.completato_il = datetime.utcnow()
        elif data['stato'] != 'completato':
            task.completato_il = None
    if 'lead_id' in data:
        task.lead_id = data['lead_id']
    if 'club_id' in data:
        task.club_id = data['club_id']
    if 'contract_id' in data:
        task.contract_id = data['contract_id']
    if 'data_scadenza' in data:
        task.data_scadenza = datetime.fromisoformat(data['data_scadenza']) if data['data_scadenza'] else None
    if 'tags' in data:
        task.tags = data['tags']

    db.session.commit()

    log_action('update', 'task', task.id, f"Aggiornato task: {task.titolo}")

    return jsonify(task.to_dict()), 200


# PUT - Cambio rapido stato (per drag&drop Kanban)
@admin_task_bp.route('/tasks/<int:task_id>/stato', methods=['PUT'])
@jwt_required()
def update_task_stato(task_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    task = AdminTask.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task non trovato'}), 404

    data = request.get_json()
    nuovo_stato = data.get('stato')

    if nuovo_stato not in ['da_fare', 'in_corso', 'completato']:
        return jsonify({'error': 'Stato non valido'}), 400

    task.stato = nuovo_stato
    if nuovo_stato == 'completato':
        task.completato_il = datetime.utcnow()
    else:
        task.completato_il = None

    db.session.commit()

    log_action('update', 'task', task.id, f"Stato task cambiato a: {nuovo_stato}")

    return jsonify(task.to_dict()), 200


# DELETE - Elimina task
@admin_task_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    task = AdminTask.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task non trovato'}), 404

    titolo = task.titolo
    db.session.delete(task)
    db.session.commit()

    log_action('delete', 'task', task_id, f"Eliminato task: {titolo}")

    return jsonify({'message': 'Task eliminato'}), 200
