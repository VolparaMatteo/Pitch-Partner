from flask import Blueprint, request, jsonify
from app import db
from app.models import Project, ProjectTask, TaskComment
from app.services.notification_service import NotificationService
from datetime import datetime
import json

sponsor_project_bp = Blueprint('sponsor_projects', __name__)

# Helper per autenticazione
def token_required(f):
    from functools import wraps
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'sponsor':
            return jsonify({'error': 'Accesso non autorizzato'}), 403
        user_id = int(get_jwt_identity())
        current_user = {'id': user_id}
        return f(current_user, *args, **kwargs)
    return decorated


# ============================================
# PROJECTS VIEW ENDPOINTS (3)
# ============================================

@sponsor_project_bp.route('/projects', methods=['GET'])
@token_required
def get_projects(current_user):
    """Lista progetti a cui partecipo"""
    sponsor_id = current_user['id']

    # Filtri
    stato = request.args.get('stato')
    priorita = request.args.get('priorita')

    query = Project.query.filter_by(sponsor_id=sponsor_id)

    if stato:
        query = query.filter_by(stato=stato)
    if priorita:
        query = query.filter_by(priorita=priorita)

    query = query.filter(Project.archived_at.is_(None))
    projects = query.order_by(Project.created_at.desc()).all()

    return jsonify({
        'projects': [p.to_dict() for p in projects],
        'total': len(projects)
    }), 200


@sponsor_project_bp.route('/projects/<int:id>', methods=['GET'])
@token_required
def get_project(current_user, id):
    """Dettaglio progetto (read-only)"""
    sponsor_id = current_user['id']

    project = Project.query.get(id)
    if not project or project.sponsor_id != sponsor_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    return jsonify({'project': project.to_dict_detailed()}), 200


@sponsor_project_bp.route('/projects/<int:id>/timeline', methods=['GET'])
@token_required
def get_project_timeline(current_user, id):
    """Timeline aggiornamenti progetto"""
    sponsor_id = current_user['id']

    project = Project.query.get(id)
    if not project or project.sponsor_id != sponsor_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    # Timeline: updates ordinati per data
    updates = project.updates.order_by(ProjectUpdate.created_at.desc()).all()

    return jsonify({
        'project_id': project.id,
        'project_title': project.titolo,
        'timeline': [u.to_dict() for u in updates]
    }), 200


# ============================================
# TASKS ENDPOINTS (4)
# ============================================

@sponsor_project_bp.route('/tasks', methods=['GET'])
@token_required
def get_my_tasks(current_user):
    """Le mie tasks"""
    sponsor_id = current_user['id']

    # Filtri
    stato = request.args.get('stato')
    priorita = request.args.get('priorita')
    project_id = request.args.get('project_id')

    query = ProjectTask.query.filter_by(
        assegnato_a_type='sponsor',
        assegnato_a_id=sponsor_id
    )

    if stato:
        query = query.filter_by(stato=stato)
    if priorita:
        query = query.filter_by(priorita=priorita)
    if project_id:
        query = query.filter_by(project_id=project_id)

    tasks = query.order_by(ProjectTask.data_scadenza.asc()).all()

    return jsonify({
        'tasks': [t.to_dict() for t in tasks],
        'total': len(tasks)
    }), 200


@sponsor_project_bp.route('/tasks/<int:id>/status', methods=['PATCH'])
@token_required
def update_task_status(current_user, id):
    """Aggiorna stato task"""
    sponsor_id = current_user['id']

    task = ProjectTask.query.get(id)
    if not task or task.assegnato_a_type != 'sponsor' or task.assegnato_a_id != sponsor_id:
        return jsonify({'error': 'Task non trovato'}), 404

    data = request.json
    new_status = data.get('stato')

    if new_status not in ['da_fare', 'in_corso', 'in_revisione', 'completato', 'bloccato']:
        return jsonify({'error': 'Stato non valido'}), 400

    task.stato = new_status

    if new_status == 'completato':
        task.mark_completed()
        # Notifica club
        NotificationService.notify_task_completed(task)
    else:
        db.session.commit()

    task.project.update_progress()

    return jsonify({
        'message': 'Stato task aggiornato',
        'task': task.to_dict()
    }), 200


@sponsor_project_bp.route('/tasks/<int:id>/comments', methods=['POST'])
@token_required
def add_task_comment(current_user, id):
    """Commenta task"""
    sponsor_id = current_user['id']

    task = ProjectTask.query.get(id)
    if not task or (task.assegnato_a_type != 'sponsor' or task.assegnato_a_id != sponsor_id):
        # Permetti anche se il progetto appartiene allo sponsor
        if not task or task.project.sponsor_id != sponsor_id:
            return jsonify({'error': 'Task non trovato'}), 404

    data = request.json

    comment = TaskComment(
        task_id=id,
        autore_type='sponsor',
        autore_id=sponsor_id,
        contenuto=data.get('contenuto'),
        allegati_urls=json.dumps(data.get('allegati_urls', [])),
        parent_comment_id=data.get('parent_comment_id')
    )

    db.session.add(comment)
    db.session.commit()

    # Notifica
    NotificationService.notify_comment_added(comment)

    return jsonify({
        'message': 'Commento aggiunto',
        'comment': comment.to_dict()
    }), 201


@sponsor_project_bp.route('/tasks/<int:task_id>/comments/<int:comment_id>', methods=['PUT'])
@token_required
def update_comment(current_user, task_id, comment_id):
    """Modifica commento"""
    sponsor_id = current_user['id']

    comment = TaskComment.query.get(comment_id)
    if not comment or comment.task_id != task_id:
        return jsonify({'error': 'Commento non trovato'}), 404

    if comment.autore_type != 'sponsor' or comment.autore_id != sponsor_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    data = request.json

    if 'contenuto' in data:
        comment.contenuto = data['contenuto']
    if 'allegati_urls' in data:
        comment.allegati_urls = json.dumps(data['allegati_urls'])

    db.session.commit()

    return jsonify({
        'message': 'Commento aggiornato',
        'comment': comment.to_dict()
    }), 200


@sponsor_project_bp.route('/tasks/<int:task_id>/comments/<int:comment_id>', methods=['DELETE'])
@token_required
def delete_comment(current_user, task_id, comment_id):
    """Elimina commento"""
    sponsor_id = current_user['id']

    comment = TaskComment.query.get(comment_id)
    if not comment or comment.task_id != task_id:
        return jsonify({'error': 'Commento non trovato'}), 404

    if comment.autore_type != 'sponsor' or comment.autore_id != sponsor_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    db.session.delete(comment)
    db.session.commit()

    return jsonify({'message': 'Commento eliminato'}), 200


# ============================================
# FEEDBACK ENDPOINT (2)
# ============================================

@sponsor_project_bp.route('/projects/<int:id>/feedback', methods=['POST'])
@token_required
def send_feedback(current_user, id):
    """Invia feedback su progetto (come ProjectUpdate da sponsor)"""
    sponsor_id = current_user['id']

    project = Project.query.get(id)
    if not project or project.sponsor_id != sponsor_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    from app.models import ProjectUpdate

    data = request.json

    # Crea update come sponsor (solo per feedback)
    update = ProjectUpdate(
        project_id=id,
        autore_type='sponsor',  # Eccezione: sponsor può creare update di tipo feedback
        autore_id=sponsor_id,
        titolo=f"Feedback Sponsor: {data.get('titolo', 'Feedback')}",
        contenuto=data.get('contenuto'),
        tipo_update='feedback',
        visibilita='team_only'  # Visibile solo al club
    )

    db.session.add(update)
    db.session.commit()

    # Notifica club
    Notification.create_notification(
        user_type='club',
        user_id=project.club_id,
        tipo='project_update',
        titolo=f'Feedback da {project.sponsor.nome_azienda}',
        messaggio=data.get('contenuto')[:200],
        link_url=f'/club/projects/{project.id}#update-{update.id}',
        oggetto_type='update',
        oggetto_id=update.id,
        priorita='normale'
    )

    return jsonify({
        'message': 'Feedback inviato',
        'update': update.to_dict()
    }), 201


@sponsor_project_bp.route('/projects/<int:id>/stats', methods=['GET'])
@token_required
def get_project_stats(current_user, id):
    """Statistiche mio coinvolgimento nel progetto"""
    sponsor_id = current_user['id']

    project = Project.query.get(id)
    if not project or project.sponsor_id != sponsor_id:
        return jsonify({'error': 'Progetto non trovato'}), 404

    # Tasks stats
    my_tasks = ProjectTask.query.filter_by(
        project_id=id,
        assegnato_a_type='sponsor',
        assegnato_a_id=sponsor_id
    )

    total_tasks = my_tasks.count()
    completed_tasks = my_tasks.filter_by(stato='completato').count()
    in_progress_tasks = my_tasks.filter_by(stato='in_corso').count()
    late_tasks = sum(1 for t in my_tasks.all() if t.is_late())

    # Comments stats
    my_comments = TaskComment.query.filter_by(
        autore_type='sponsor',
        autore_id=sponsor_id
    ).join(ProjectTask).filter(ProjectTask.project_id == id).count()

    return jsonify({
        'project_id': id,
        'stats': {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'late_tasks': late_tasks,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            'total_comments': my_comments
        }
    }), 200


# TOTALE: 10 endpoints
