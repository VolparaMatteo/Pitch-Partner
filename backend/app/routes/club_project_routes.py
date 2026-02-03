from flask import Blueprint, request, jsonify
from app import db
from app.models import Project, ProjectMilestone, ProjectTask, ProjectUpdate, HeadOfTerms, Club, Sponsor
from app.services.notification_service import NotificationService
from datetime import datetime
import json

club_project_bp = Blueprint('club_projects', __name__)

# Helper per autenticazione
def token_required(f):
    from functools import wraps
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'club':
            return jsonify({'error': 'Accesso non autorizzato'}), 403
        user_id = int(get_jwt_identity())
        current_user = {'id': user_id}
        return f(current_user, *args, **kwargs)
    return decorated


# ============================================
# PROJECTS ENDPOINTS (6)
# ============================================

@club_project_bp.route('/projects', methods=['GET'])
@token_required
def get_projects(current_user):
    """Lista progetti del club con filtri"""
    club_id = current_user['id']

    # Filtri
    stato = request.args.get('stato')
    sponsor_id = request.args.get('sponsor_id')
    priorita = request.args.get('priorita')

    query = Project.query.filter_by(club_id=club_id)

    if stato:
        query = query.filter_by(stato=stato)
    if sponsor_id:
        query = query.filter_by(sponsor_id=sponsor_id)
    if priorita:
        query = query.filter_by(priorita=priorita)

    query = query.filter(Project.archived_at.is_(None))  # Escludi archiviati
    projects = query.order_by(Project.created_at.desc()).all()

    return jsonify({
        'projects': [p.to_dict() for p in projects],
        'total': len(projects)
    }), 200


@club_project_bp.route('/projects', methods=['POST'])
@token_required
def create_project(current_user):
    """Crea nuovo progetto condiviso con tutti gli sponsor"""
    club_id = current_user['id']
    data = request.json

    # Valida campi obbligatori
    if not data.get('titolo'):
        return jsonify({'error': 'Titolo progetto obbligatorio'}), 400

    project = Project(
        contract_id=None,  # Progetti non legati a contratti
        club_id=club_id,
        sponsor_id=None,  # Condiviso con tutti gli sponsor
        titolo=data.get('titolo'),
        descrizione=data.get('descrizione'),
        data_inizio=datetime.fromisoformat(data['data_inizio']) if data.get('data_inizio') else None,
        data_fine=datetime.fromisoformat(data['data_fine']) if data.get('data_fine') else None,
        priorita=data.get('priorita', 'media'),
        budget_allocato=data.get('budget_allocato'),
        stato='pianificazione'
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({
        'message': 'Progetto creato',
        'project': project.to_dict()
    }), 201


@club_project_bp.route('/projects/<int:id>', methods=['GET'])
@token_required
def get_project(current_user, id):
    """Dettaglio progetto completo"""
    club_id = current_user['id']

    project = Project.query.get(id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    return jsonify({'project': project.to_dict_detailed()}), 200


@club_project_bp.route('/projects/<int:id>', methods=['PUT'])
@token_required
def update_project(current_user, id):
    """Modifica progetto"""
    club_id = current_user['id']

    project = Project.query.get(id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    data = request.json

    if 'titolo' in data:
        project.titolo = data['titolo']
    if 'descrizione' in data:
        project.descrizione = data['descrizione']
    if 'data_inizio' in data:
        project.data_inizio = datetime.fromisoformat(data['data_inizio']) if data['data_inizio'] else None
    if 'data_fine' in data:
        project.data_fine = datetime.fromisoformat(data['data_fine']) if data['data_fine'] else None
    if 'priorita' in data:
        project.priorita = data['priorita']
    if 'budget_allocato' in data:
        project.budget_allocato = data['budget_allocato']

    db.session.commit()

    return jsonify({
        'message': 'Progetto aggiornato',
        'project': project.to_dict()
    }), 200


@club_project_bp.route('/projects/<int:id>/status', methods=['PATCH'])
@token_required
def change_project_status(current_user, id):
    """Cambia stato progetto"""
    club_id = current_user['id']

    project = Project.query.get(id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    data = request.json
    new_status = data.get('stato')

    if new_status not in ['pianificazione', 'in_corso', 'in_pausa', 'completato', 'archiviato']:
        return jsonify({'error': 'Stato non valido'}), 400

    old_status = project.stato
    project.stato = new_status

    if new_status == 'archiviato':
        project.archived_at = datetime.utcnow()

    db.session.commit()

    # Notifica sponsor
    NotificationService.notify_status_changed(project, old_status, new_status)

    return jsonify({
        'message': 'Stato aggiornato',
        'project': project.to_dict()
    }), 200


@club_project_bp.route('/projects/<int:id>', methods=['DELETE'])
@token_required
def archive_project(current_user, id):
    """Archivia progetto (soft delete)"""
    club_id = current_user['id']

    project = Project.query.get(id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    project.stato = 'archiviato'
    project.archived_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Progetto archiviato'}), 200


# ============================================
# MILESTONES ENDPOINTS (4)
# ============================================

@club_project_bp.route('/projects/<int:project_id>/milestones', methods=['POST'])
@token_required
def create_milestone(current_user, project_id):
    """Crea milestone"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    data = request.json

    milestone = ProjectMilestone(
        project_id=project_id,
        titolo=data.get('titolo'),
        descrizione=data.get('descrizione'),
        data_scadenza=datetime.fromisoformat(data['data_scadenza']).date(),
        ordine=data.get('ordine', 0)
    )

    db.session.add(milestone)
    db.session.commit()

    return jsonify({
        'message': 'Milestone creato',
        'milestone': milestone.to_dict()
    }), 201


@club_project_bp.route('/projects/<int:project_id>/milestones/<int:id>', methods=['PUT'])
@token_required
def update_milestone(current_user, project_id, id):
    """Modifica milestone"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    milestone = ProjectMilestone.query.get(id)
    if not milestone or milestone.project_id != project_id:
        return jsonify({'error': 'Milestone non trovato'}), 404

    data = request.json

    if 'titolo' in data:
        milestone.titolo = data['titolo']
    if 'descrizione' in data:
        milestone.descrizione = data['descrizione']
    if 'data_scadenza' in data:
        milestone.data_scadenza = datetime.fromisoformat(data['data_scadenza']).date()
    if 'ordine' in data:
        milestone.ordine = data['ordine']

    db.session.commit()

    return jsonify({
        'message': 'Milestone aggiornato',
        'milestone': milestone.to_dict()
    }), 200


@club_project_bp.route('/projects/<int:project_id>/milestones/<int:id>/complete', methods=['PATCH'])
@token_required
def complete_milestone(current_user, project_id, id):
    """Completa milestone"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    milestone = ProjectMilestone.query.get(id)
    if not milestone or milestone.project_id != project_id:
        return jsonify({'error': 'Milestone non trovato'}), 404

    milestone.mark_completed()

    # Notifica sponsor
    NotificationService.notify_milestone_completed(milestone)

    return jsonify({
        'message': 'Milestone completato',
        'milestone': milestone.to_dict()
    }), 200


@club_project_bp.route('/projects/<int:project_id>/milestones/<int:id>', methods=['DELETE'])
@token_required
def delete_milestone(current_user, project_id, id):
    """Elimina milestone"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    milestone = ProjectMilestone.query.get(id)
    if not milestone or milestone.project_id != project_id:
        return jsonify({'error': 'Milestone non trovato'}), 404

    db.session.delete(milestone)
    db.session.commit()

    return jsonify({'message': 'Milestone eliminato'}), 200


# ============================================
# TASKS ENDPOINTS (3)
# ============================================

@club_project_bp.route('/projects/<int:project_id>/tasks', methods=['POST'])
@token_required
def create_task(current_user, project_id):
    """Crea task"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    data = request.json

    task = ProjectTask(
        project_id=project_id,
        milestone_id=data.get('milestone_id'),
        titolo=data.get('titolo'),
        descrizione=data.get('descrizione'),
        assegnato_a_type=data.get('assegnato_a_type'),
        assegnato_a_id=data.get('assegnato_a_id'),
        creato_da_type='club',
        creato_da_id=club_id,
        priorita=data.get('priorita', 'media'),
        stato='da_fare',
        data_scadenza=datetime.fromisoformat(data['data_scadenza']) if data.get('data_scadenza') else None,
        tempo_stimato=data.get('tempo_stimato'),
        tags=data.get('tags')
    )

    db.session.add(task)
    db.session.commit()

    # Notifica assegnatario
    if task.assegnato_a_type and task.assegnato_a_id:
        NotificationService.notify_task_assigned(task)

    return jsonify({
        'message': 'Task creato',
        'task': task.to_dict()
    }), 201


@club_project_bp.route('/projects/<int:project_id>/tasks/<int:id>', methods=['PUT'])
@token_required
def update_task(current_user, project_id, id):
    """Modifica task"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    task = ProjectTask.query.get(id)
    if not task or task.project_id != project_id:
        return jsonify({'error': 'Task non trovato'}), 404

    data = request.json

    if 'titolo' in data:
        task.titolo = data['titolo']
    if 'descrizione' in data:
        task.descrizione = data['descrizione']
    if 'milestone_id' in data:
        task.milestone_id = data['milestone_id']
    if 'priorita' in data:
        task.priorita = data['priorita']
    if 'stato' in data:
        task.stato = data['stato']
    if 'data_scadenza' in data:
        task.data_scadenza = datetime.fromisoformat(data['data_scadenza']) if data['data_scadenza'] else None
    if 'tempo_stimato' in data:
        task.tempo_stimato = data['tempo_stimato']
    if 'tags' in data:
        task.tags = data['tags']

    db.session.commit()
    project.update_progress()

    return jsonify({
        'message': 'Task aggiornato',
        'task': task.to_dict()
    }), 200


@club_project_bp.route('/projects/<int:project_id>/tasks/<int:id>/assign', methods=['PATCH'])
@token_required
def assign_task(current_user, project_id, id):
    """Assegna/riassegna task"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    task = ProjectTask.query.get(id)
    if not task or task.project_id != project_id:
        return jsonify({'error': 'Task non trovato'}), 404

    data = request.json

    task.assegnato_a_type = data.get('assegnato_a_type')
    task.assegnato_a_id = data.get('assegnato_a_id')

    db.session.commit()

    # Notifica nuovo assegnatario
    if task.assegnato_a_type and task.assegnato_a_id:
        NotificationService.notify_task_assigned(task)

    return jsonify({
        'message': 'Task assegnato',
        'task': task.to_dict()
    }), 200


@club_project_bp.route('/projects/<int:project_id>/tasks/<int:id>', methods=['DELETE'])
@token_required
def delete_task(current_user, project_id, id):
    """Elimina task"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    task = ProjectTask.query.get(id)
    if not task or task.project_id != project_id:
        return jsonify({'error': 'Task non trovato'}), 404

    db.session.delete(task)
    db.session.commit()
    project.update_progress()

    return jsonify({'message': 'Task eliminato'}), 200


# ============================================
# UPDATES ENDPOINT (1)
# ============================================

@club_project_bp.route('/projects/<int:project_id>/updates', methods=['POST'])
@token_required
def create_update(current_user, project_id):
    """Pubblica update/news progetto"""
    club_id = current_user['id']

    project = Project.query.get(project_id)
    if not project or project.club_id != club_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    data = request.json

    update = ProjectUpdate(
        project_id=project_id,
        autore_type='club',
        autore_id=club_id,
        titolo=data.get('titolo'),
        contenuto=data.get('contenuto'),
        tipo_update=data.get('tipo_update', 'news'),
        allegati_urls=json.dumps(data.get('allegati_urls', [])),
        visibilita=data.get('visibilita', 'sponsor_only'),
        pin_in_alto=data.get('pin_in_alto', False)
    )

    db.session.add(update)
    db.session.commit()

    # Notifica sponsor
    NotificationService.notify_project_update(update)

    return jsonify({
        'message': 'Update pubblicato',
        'update': update.to_dict()
    }), 201


# TOTALE: 15 endpoints
