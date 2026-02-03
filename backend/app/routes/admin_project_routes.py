from flask import Blueprint, request, jsonify
from app import db
from app.models import Project, ProjectTask, ProjectMilestone, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
from sqlalchemy import func

admin_project_bp = Blueprint('admin_projects', __name__)


# ============================================
# ADMIN MONITORING ENDPOINTS (5)
# ============================================

@admin_project_bp.route('/admin/projects', methods=['GET'])
@jwt_required()
def get_all_projects():
    """Overview tutti progetti (admin)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri
    stato = request.args.get('stato')
    priorita = request.args.get('priorita')
    club_id = request.args.get('club_id')
    sponsor_id = request.args.get('sponsor_id')

    query = Project.query

    if stato:
        query = query.filter_by(stato=stato)
    if priorita:
        query = query.filter_by(priorita=priorita)
    if club_id:
        query = query.filter_by(club_id=club_id)
    if sponsor_id:
        query = query.filter_by(sponsor_id=sponsor_id)

    query = query.filter(Project.archived_at.is_(None))
    projects = query.order_by(Project.created_at.desc()).all()

    return jsonify({
        'projects': [p.to_dict() for p in projects],
        'total': len(projects)
    }), 200


@admin_project_bp.route('/admin/projects/stats', methods=['GET'])
@jwt_required()
def get_projects_stats():
    """Statistiche globali progetti (admin)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Total projects
    total_projects = Project.query.filter(Project.archived_at.is_(None)).count()

    # By status
    by_status = db.session.query(
        Project.stato,
        func.count(Project.id)
    ).filter(Project.archived_at.is_(None)
    ).group_by(Project.stato).all()

    # By priority
    by_priority = db.session.query(
        Project.priorita,
        func.count(Project.id)
    ).filter(Project.archived_at.is_(None)
    ).group_by(Project.priorita).all()

    # Total tasks
    total_tasks = ProjectTask.query.count()
    completed_tasks = ProjectTask.query.filter_by(stato='completato').count()

    # Late tasks
    late_tasks = ProjectTask.query.filter(
        ProjectTask.stato != 'completato',
        ProjectTask.data_scadenza < datetime.utcnow()
    ).count()

    # Total milestones
    total_milestones = ProjectMilestone.query.count()
    completed_milestones = ProjectMilestone.query.filter_by(stato='completato').count()

    # Average progress
    avg_progress = db.session.query(
        func.avg(Project.progresso_percentuale)
    ).filter(
        Project.archived_at.is_(None),
        Project.stato.in_(['in_corso', 'in_pausa'])
    ).scalar() or 0

    return jsonify({
        'total_projects': total_projects,
        'by_status': {stato: count for stato, count in by_status},
        'by_priority': {pri: count for pri, count in by_priority},
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'late_tasks': late_tasks,
        'total_milestones': total_milestones,
        'completed_milestones': completed_milestones,
        'avg_progress': round(float(avg_progress), 2),
        'completion_rate': round((completed_tasks / total_tasks * 100), 2) if total_tasks > 0 else 0
    }), 200


@admin_project_bp.route('/admin/projects/<int:id>', methods=['GET'])
@jwt_required()
def get_project_detail(id):
    """Dettaglio progetto completo (admin - full access)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    project = Project.query.get(id)
    if not project:
        return jsonify({'error': 'Progetto non trovato'}), 404

    return jsonify({'project': project.to_dict_detailed()}), 200


@admin_project_bp.route('/admin/notifications/log', methods=['GET'])
@jwt_required()
def get_notifications_log():
    """Log tutte notifiche inviate (admin)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Pagination
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    # Filtri
    tipo = request.args.get('tipo')
    user_type = request.args.get('user_type')
    days = int(request.args.get('days', 7))  # Ultimi N giorni

    query = Notification.query

    if tipo:
        query = query.filter_by(tipo=tipo)
    if user_type:
        query = query.filter_by(user_type=user_type)

    # Filtra per data
    since_date = datetime.utcnow() - timedelta(days=days)
    query = query.filter(Notification.created_at >= since_date)

    query = query.order_by(Notification.created_at.desc())

    # Pagination
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'notifications': [{
            'id': n.id,
            'destinatario': {'type': n.user_type, 'id': n.user_id},
            'tipo': n.tipo,
            'titolo': n.titolo,
            'messaggio': n.messaggio[:100],
            'priorita': n.priorita if hasattr(n, 'priorita') else 'normale',
            'letta': n.letta,
            'created_at': n.created_at.isoformat()
        } for n in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    }), 200


@admin_project_bp.route('/admin/projects/health', methods=['GET'])
@jwt_required()
def get_projects_health():
    """Health check progetti: identifica problemi (admin)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Progetti in ritardo (scadenza passata e non completati)
    late_projects = Project.query.filter(
        Project.stato.in_(['pianificazione', 'in_corso', 'in_pausa']),
        Project.data_fine < datetime.utcnow().date(),
        Project.archived_at.is_(None)
    ).all()

    # Progetti bloccati (in pausa da più di 30 giorni)
    blocked_projects = Project.query.filter(
        Project.stato == 'in_pausa',
        Project.updated_at < datetime.utcnow() - timedelta(days=30),
        Project.archived_at.is_(None)
    ).all()

    # Progetti con basso progresso (in_corso da >30 giorni con progresso < 20%)
    low_progress_projects = Project.query.filter(
        Project.stato == 'in_corso',
        Project.progresso_percentuale < 20,
        Project.created_at < datetime.utcnow() - timedelta(days=30),
        Project.archived_at.is_(None)
    ).all()

    # Tasks critici in ritardo (priorità alta/urgente e scaduti)
    critical_late_tasks = ProjectTask.query.filter(
        ProjectTask.stato != 'completato',
        ProjectTask.priorita.in_(['alta', 'urgente']),
        ProjectTask.data_scadenza < datetime.utcnow()
    ).all()

    return jsonify({
        'health_summary': {
            'late_projects': len(late_projects),
            'blocked_projects': len(blocked_projects),
            'low_progress_projects': len(low_progress_projects),
            'critical_late_tasks': len(critical_late_tasks)
        },
        'issues': {
            'late_projects': [{
                'id': p.id,
                'titolo': p.titolo,
                'club': p.club.nome,
                'sponsor': p.sponsor.nome_azienda,
                'data_fine': p.data_fine.isoformat(),
                'days_late': (datetime.utcnow().date() - p.data_fine).days
            } for p in late_projects],
            'blocked_projects': [{
                'id': p.id,
                'titolo': p.titolo,
                'club': p.club.nome,
                'sponsor': p.sponsor.nome_azienda,
                'days_blocked': (datetime.utcnow() - p.updated_at).days
            } for p in blocked_projects],
            'low_progress_projects': [{
                'id': p.id,
                'titolo': p.titolo,
                'club': p.club.nome,
                'sponsor': p.sponsor.nome_azienda,
                'progresso': p.progresso_percentuale,
                'days_active': (datetime.utcnow() - p.created_at).days
            } for p in low_progress_projects],
            'critical_late_tasks': [{
                'id': t.id,
                'titolo': t.titolo,
                'project_id': t.project_id,
                'project_title': t.project.titolo,
                'priorita': t.priorita,
                'data_scadenza': t.data_scadenza.isoformat(),
                'assegnato_a': t.get_assignee_name()
            } for t in critical_late_tasks]
        }
    }), 200


# TOTALE: 5 endpoints
