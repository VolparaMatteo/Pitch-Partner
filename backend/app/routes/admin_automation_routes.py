"""
Admin Automation Routes - API per gestione workflow/automazioni admin
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models import (
    AdminWorkflow, AdminWorkflowExecution, AdminWorkflowStepExecution,
    AdminWorkflowEnrollment, AdminEmailTemplate, CRMLead, AuditLog
)
from app.services.admin_automation_service import AdminAutomationService
from datetime import datetime
from sqlalchemy import func
import json

admin_automation_bp = Blueprint('admin_automation', __name__)


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


# ==================== META ====================

TRIGGER_TYPES = [
    {
        'value': 'lead_created',
        'label': 'Lead Creato',
        'description': 'Quando viene creato un nuovo lead nel CRM',
        'config_fields': [
            {'name': 'fonte', 'type': 'select', 'label': 'Fonte (opzionale)',
             'options': ['direct', 'referral', 'website', 'event', 'partner', 'cold_outreach']},
        ]
    },
    {
        'value': 'lead_stage_changed',
        'label': 'Lead Cambia Stage',
        'description': 'Quando un lead cambia fase nella pipeline',
        'config_fields': [
            {'name': 'from_stage', 'type': 'select', 'label': 'Da stage',
             'options': ['nuovo', 'contattato', 'qualificato', 'proposta', 'negoziazione', 'vinto', 'perso']},
            {'name': 'to_stage', 'type': 'select', 'label': 'A stage',
             'options': ['nuovo', 'contattato', 'qualificato', 'proposta', 'negoziazione', 'vinto', 'perso']},
        ]
    },
    {
        'value': 'lead_inactive',
        'label': 'Lead Inattivo',
        'description': 'Quando un lead non ha attivita da N giorni',
        'config_fields': [
            {'name': 'days', 'type': 'number', 'label': 'Giorni di inattivita', 'default': 7},
        ]
    },
    {
        'value': 'contract_expiring',
        'label': 'Contratto in Scadenza',
        'description': 'Quando un contratto sta per scadere',
        'config_fields': [
            {'name': 'days', 'type': 'number', 'label': 'Giorni prima della scadenza', 'default': 30},
        ]
    },
    {
        'value': 'contract_expired',
        'label': 'Contratto Scaduto',
        'description': 'Quando un contratto e scaduto',
        'config_fields': []
    },
    {
        'value': 'contract_created',
        'label': 'Contratto Creato',
        'description': 'Quando viene creato un nuovo contratto',
        'config_fields': []
    },
    {
        'value': 'invoice_overdue',
        'label': 'Fattura Scaduta',
        'description': 'Quando una fattura supera la data di scadenza',
        'config_fields': [
            {'name': 'days', 'type': 'number', 'label': 'Giorni oltre scadenza', 'default': 7},
        ]
    },
    {
        'value': 'club_created',
        'label': 'Club Creato',
        'description': 'Quando un lead viene convertito in club',
        'config_fields': []
    },
    {
        'value': 'task_overdue',
        'label': 'Task Scaduto',
        'description': 'Quando un task admin supera la scadenza',
        'config_fields': []
    },
    {
        'value': 'booking_created',
        'label': 'Demo Prenotata',
        'description': 'Quando viene prenotata una demo',
        'config_fields': []
    },
    {
        'value': 'scheduled',
        'label': 'Schedulato',
        'description': 'Esecuzione periodica (cron/intervallo)',
        'config_fields': [
            {'name': 'cron', 'type': 'text', 'label': 'Espressione Cron (es. 0 9 * * *)'},
            {'name': 'interval_minutes', 'type': 'number', 'label': 'Intervallo in minuti'},
        ]
    },
]

ACTION_TYPES = [
    {
        'value': 'send_email',
        'label': 'Invia Email',
        'icon': 'mail',
        'color': '#3B82F6',
        'description': 'Invia email tramite account Aruba',
        'config_fields': [
            {'name': 'account_key', 'type': 'select', 'label': 'Account mittente',
             'options': ['hello', 'sales', 'support', 'notifications', 'g.ferretti', 'm.volpara', 's.formaggio']},
            {'name': 'to', 'type': 'text', 'label': 'Destinatario (o {{lead.contatto_email}})'},
            {'name': 'oggetto', 'type': 'text', 'label': 'Oggetto'},
            {'name': 'template_id', 'type': 'template_select', 'label': 'Template (opzionale)'},
            {'name': 'corpo', 'type': 'richtext', 'label': 'Corpo email (se no template)'},
            {'name': 'cc', 'type': 'text', 'label': 'CC (opzionale)'},
        ]
    },
    {
        'value': 'create_task',
        'label': 'Crea Task',
        'icon': 'clipboard',
        'color': '#8B5CF6',
        'description': 'Crea un task nel pannello admin',
        'config_fields': [
            {'name': 'titolo', 'type': 'text', 'label': 'Titolo'},
            {'name': 'descrizione', 'type': 'textarea', 'label': 'Descrizione'},
            {'name': 'tipo', 'type': 'select', 'label': 'Tipo',
             'options': ['generale', 'lead_followup', 'club_onboarding', 'rinnovo_contratto', 'fattura', 'supporto']},
            {'name': 'priorita', 'type': 'select', 'label': 'Priorita', 'options': ['bassa', 'media', 'alta', 'urgente']},
            {'name': 'scadenza_giorni', 'type': 'number', 'label': 'Scadenza (giorni da oggi)'},
        ]
    },
    {
        'value': 'create_notification',
        'label': 'Crea Notifica',
        'icon': 'bell',
        'color': '#F59E0B',
        'description': 'Invia notifica in-app agli admin',
        'config_fields': [
            {'name': 'titolo', 'type': 'text', 'label': 'Titolo'},
            {'name': 'messaggio', 'type': 'textarea', 'label': 'Messaggio'},
            {'name': 'link', 'type': 'text', 'label': 'Link (opzionale)'},
            {'name': 'priorita', 'type': 'select', 'label': 'Priorita', 'options': ['bassa', 'normale', 'alta']},
        ]
    },
    {
        'value': 'update_lead_stage',
        'label': 'Aggiorna Stage Lead',
        'icon': 'arrow-right',
        'color': '#059669',
        'description': 'Cambia lo stage di un lead nella pipeline',
        'config_fields': [
            {'name': 'new_stage', 'type': 'select', 'label': 'Nuovo stage',
             'options': ['nuovo', 'contattato', 'qualificato', 'proposta', 'negoziazione', 'vinto', 'perso']},
        ]
    },
    {
        'value': 'update_lead_temperature',
        'label': 'Aggiorna Temperatura Lead',
        'icon': 'thermometer',
        'color': '#DC2626',
        'description': 'Cambia la temperatura di un lead',
        'config_fields': [
            {'name': 'new_temperatura', 'type': 'select', 'label': 'Nuova temperatura',
             'options': ['cold', 'warm', 'hot']},
        ]
    },
    {
        'value': 'delay',
        'label': 'Attesa',
        'icon': 'clock',
        'color': '#6B7280',
        'description': 'Attendi prima di procedere',
        'config_fields': [
            {'name': 'minutes', 'type': 'number', 'label': 'Minuti', 'default': 0},
            {'name': 'hours', 'type': 'number', 'label': 'Ore', 'default': 0},
            {'name': 'days', 'type': 'number', 'label': 'Giorni', 'default': 0},
        ]
    },
    {
        'value': 'condition',
        'label': 'Condizione',
        'icon': 'git-branch',
        'color': '#0EA5E9',
        'description': 'Valuta condizioni e crea rami (if/else)',
        'config_fields': [
            {'name': 'conditions', 'type': 'condition_builder', 'label': 'Condizioni'},
        ]
    },
    {
        'value': 'webhook',
        'label': 'Webhook',
        'icon': 'globe',
        'color': '#7C3AED',
        'description': 'Chiama un URL esterno',
        'config_fields': [
            {'name': 'url', 'type': 'text', 'label': 'URL'},
            {'name': 'method', 'type': 'select', 'label': 'Metodo', 'options': ['POST', 'GET', 'PUT']},
            {'name': 'body', 'type': 'textarea', 'label': 'Body JSON (template supportato)'},
        ]
    },
]


@admin_automation_bp.route('/workflows/meta', methods=['GET'])
@jwt_required()
def get_workflows_meta():
    """Ritorna TRIGGER_TYPES e ACTION_TYPES con config_fields per form dinamici"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    return jsonify({
        'trigger_types': TRIGGER_TYPES,
        'action_types': ACTION_TYPES,
    }), 200


# ==================== CRUD WORKFLOWS ====================

@admin_automation_bp.route('/workflows', methods=['GET'])
@jwt_required()
def get_workflows():
    """Lista workflow con filtri"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    trigger_type = request.args.get('trigger_type')
    status = request.args.get('status')  # active/inactive
    tipo = request.args.get('tipo')  # workflow/email_sequence

    query = AdminWorkflow.query

    if trigger_type:
        query = query.filter(AdminWorkflow.trigger_type == trigger_type)
    if status == 'active':
        query = query.filter(AdminWorkflow.abilitata == True)
    elif status == 'inactive':
        query = query.filter(AdminWorkflow.abilitata == False)
    if tipo:
        query = query.filter(AdminWorkflow.tipo == tipo)

    workflows = query.order_by(AdminWorkflow.created_at.desc()).all()

    return jsonify({
        'workflows': [w.to_dict() for w in workflows]
    }), 200


@admin_automation_bp.route('/workflows/stats', methods=['GET'])
@jwt_required()
def get_workflows_stats():
    """Stats aggregate"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    total = AdminWorkflow.query.count()
    active = AdminWorkflow.query.filter_by(abilitata=True).count()

    total_executions = db.session.query(func.sum(AdminWorkflow.executions_count)).scalar() or 0
    successful = AdminWorkflowExecution.query.filter_by(status='completed').count()
    total_exec_count = AdminWorkflowExecution.query.count()
    success_rate = round((successful / total_exec_count * 100), 1) if total_exec_count > 0 else 0

    return jsonify({
        'totali': total,
        'attivi': active,
        'esecuzioni_totali': int(total_executions),
        'percentuale_successo': success_rate,
    }), 200


@admin_automation_bp.route('/workflows/templates', methods=['GET'])
@jwt_required()
def get_workflow_templates():
    """Lista AdminEmailTemplate per selezione template"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    templates = AdminEmailTemplate.query.order_by(AdminEmailTemplate.nome.asc()).all()
    return jsonify({
        'templates': [{'id': t.id, 'nome': t.nome, 'oggetto': t.oggetto} for t in templates]
    }), 200


@admin_automation_bp.route('/workflows/<int:workflow_id>', methods=['GET'])
@jwt_required()
def get_workflow(workflow_id):
    """Dettaglio singolo workflow"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    workflow = AdminWorkflow.query.get_or_404(workflow_id)
    return jsonify(workflow.to_dict()), 200


@admin_automation_bp.route('/workflows', methods=['POST'])
@jwt_required()
def create_workflow():
    """Crea workflow"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    if not data.get('nome') or not data.get('trigger_type'):
        return jsonify({'error': 'nome e trigger_type sono obbligatori'}), 400

    workflow = AdminWorkflow(
        nome=data['nome'],
        descrizione=data.get('descrizione'),
        abilitata=data.get('abilitata', False),
        tipo=data.get('tipo', 'workflow'),
        trigger_type=data['trigger_type'],
        trigger_config=data.get('trigger_config'),
        steps=data.get('steps', []),
        sequence_exit_on_reply=data.get('sequence_exit_on_reply', True),
        sequence_exit_on_convert=data.get('sequence_exit_on_convert', True),
        created_by=int(get_jwt_identity())
    )

    # Set next_run per workflow scheduled
    if data['trigger_type'] == 'scheduled':
        config = data.get('trigger_config', {})
        if config.get('interval_minutes'):
            from datetime import timedelta
            workflow.next_run = datetime.utcnow() + timedelta(minutes=config['interval_minutes'])
        else:
            from datetime import timedelta
            workflow.next_run = datetime.utcnow() + timedelta(days=1)

    db.session.add(workflow)
    db.session.commit()

    log_action('create', 'workflow', workflow.id, f"Creato workflow: {workflow.nome}")

    return jsonify({
        'message': 'Workflow creato',
        'workflow': workflow.to_dict()
    }), 201


@admin_automation_bp.route('/workflows/<int:workflow_id>', methods=['PUT'])
@jwt_required()
def update_workflow(workflow_id):
    """Aggiorna workflow"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    workflow = AdminWorkflow.query.get_or_404(workflow_id)
    data = request.get_json()

    for field in ['nome', 'descrizione', 'abilitata', 'tipo', 'trigger_type',
                  'trigger_config', 'steps', 'sequence_exit_on_reply', 'sequence_exit_on_convert']:
        if field in data:
            setattr(workflow, field, data[field])

    workflow.updated_at = datetime.utcnow()
    db.session.commit()

    log_action('update', 'workflow', workflow.id, f"Aggiornato workflow: {workflow.nome}")

    return jsonify({
        'message': 'Workflow aggiornato',
        'workflow': workflow.to_dict()
    }), 200


@admin_automation_bp.route('/workflows/<int:workflow_id>', methods=['DELETE'])
@jwt_required()
def delete_workflow(workflow_id):
    """Elimina workflow + cascade"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    workflow = AdminWorkflow.query.get_or_404(workflow_id)
    nome = workflow.nome

    db.session.delete(workflow)
    db.session.commit()

    log_action('delete', 'workflow', workflow_id, f"Eliminato workflow: {nome}")

    return jsonify({'message': 'Workflow eliminato'}), 200


@admin_automation_bp.route('/workflows/<int:workflow_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_workflow(workflow_id):
    """Abilita/disabilita workflow"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    workflow = AdminWorkflow.query.get_or_404(workflow_id)
    workflow.abilitata = not workflow.abilitata
    workflow.updated_at = datetime.utcnow()
    db.session.commit()

    stato = 'abilitato' if workflow.abilitata else 'disabilitato'
    log_action('toggle', 'workflow', workflow.id, f"Workflow {workflow.nome} {stato}")

    return jsonify({
        'message': f'Workflow {stato}',
        'abilitata': workflow.abilitata
    }), 200


@admin_automation_bp.route('/workflows/<int:workflow_id>/test', methods=['POST'])
@jwt_required()
def test_workflow(workflow_id):
    """Test manuale con dati mock"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    workflow = AdminWorkflow.query.get_or_404(workflow_id)
    data = request.get_json() or {}

    # Mock trigger data basato su trigger_type
    mock_data = data.get('trigger_data') or _generate_mock_trigger_data(workflow.trigger_type)

    try:
        execution = AdminAutomationService.execute_workflow(workflow, mock_data)
        return jsonify({
            'message': 'Test eseguito',
            'execution': execution.to_dict() if hasattr(execution, 'to_dict') else {'status': 'enrolled'},
        }), 200
    except Exception as e:
        return jsonify({'error': f'Errore durante il test: {str(e)}'}), 500


def _generate_mock_trigger_data(trigger_type):
    """Genera dati mock per test"""
    # Trova un lead reale per dati piu realistici
    lead = CRMLead.query.first()

    if trigger_type in ('lead_created', 'lead_stage_changed', 'lead_inactive'):
        return {
            'entity_type': 'lead',
            'entity_id': lead.id if lead else 1,
            'nome_club': lead.nome_club if lead else 'Test Club',
            'contatto_email': lead.contatto_email if lead else 'test@example.com',
            'stage': lead.stage if lead else 'nuovo',
            'old_stage': 'nuovo',
            'new_stage': 'contattato',
            'temperatura': 'warm',
        }
    elif trigger_type in ('contract_expiring', 'contract_expired', 'contract_created'):
        return {
            'entity_type': 'contract',
            'entity_id': 1,
            'plan_type': 'premium',
            'total_value': 5000,
        }
    elif trigger_type == 'booking_created':
        return {
            'entity_type': 'booking',
            'entity_id': 1,
            'nome': 'Test',
            'cognome': 'Demo',
            'email': 'test@example.com',
            'nome_club': 'Test Club',
        }
    return {'entity_type': 'test', 'entity_id': 0}


# ==================== EXECUTIONS ====================

@admin_automation_bp.route('/workflows/<int:workflow_id>/executions', methods=['GET'])
@jwt_required()
def get_workflow_executions(workflow_id):
    """Storico esecuzioni (paginato)"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    paginated = AdminWorkflowExecution.query.filter_by(
        workflow_id=workflow_id
    ).order_by(
        AdminWorkflowExecution.started_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'executions': [e.to_dict() for e in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'page': page,
    }), 200


@admin_automation_bp.route('/workflows/executions/<int:exec_id>', methods=['GET'])
@jwt_required()
def get_execution_detail(exec_id):
    """Dettaglio esecuzione con tutti gli step"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    execution = AdminWorkflowExecution.query.get_or_404(exec_id)
    steps = execution.step_executions.order_by(
        AdminWorkflowStepExecution.step_index.asc()
    ).all()

    result = execution.to_dict()
    result['steps'] = [s.to_dict() for s in steps]

    return jsonify(result), 200


# ==================== ENROLLMENTS ====================

@admin_automation_bp.route('/workflows/<int:workflow_id>/enrollments', methods=['GET'])
@jwt_required()
def get_workflow_enrollments(workflow_id):
    """Enrollment attivi (sequenze email)"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    status = request.args.get('status', 'active')

    query = AdminWorkflowEnrollment.query.filter_by(workflow_id=workflow_id)
    if status != 'all':
        query = query.filter_by(status=status)

    enrollments = query.order_by(AdminWorkflowEnrollment.enrolled_at.desc()).all()

    return jsonify({
        'enrollments': [e.to_dict() for e in enrollments]
    }), 200


@admin_automation_bp.route('/workflows/<int:workflow_id>/enrollments', methods=['POST'])
@jwt_required()
def create_enrollment(workflow_id):
    """Enrolla lead manualmente"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    workflow = AdminWorkflow.query.get_or_404(workflow_id)
    data = request.get_json()

    lead_id = data.get('lead_id')
    if not lead_id:
        return jsonify({'error': 'lead_id richiesto'}), 400

    lead = CRMLead.query.get(lead_id)
    if not lead:
        return jsonify({'error': 'Lead non trovato'}), 404

    # Check se gia enrollato
    existing = AdminWorkflowEnrollment.query.filter_by(
        workflow_id=workflow_id,
        lead_id=lead_id,
        status='active'
    ).first()
    if existing:
        return jsonify({'error': 'Lead gia enrollato in questa sequenza'}), 400

    enrollment = AdminWorkflowEnrollment(
        workflow_id=workflow_id,
        lead_id=lead_id,
        status='active',
        current_step_index=0,
        next_send_at=datetime.utcnow(),
        enrolled_at=datetime.utcnow()
    )
    db.session.add(enrollment)
    db.session.commit()

    log_action('enroll', 'workflow_enrollment', enrollment.id,
               f"Lead {lead.nome_club} enrollato in {workflow.nome}")

    return jsonify({
        'message': 'Lead enrollato',
        'enrollment': enrollment.to_dict()
    }), 201


@admin_automation_bp.route('/workflows/<int:workflow_id>/enrollments/<int:enrollment_id>', methods=['DELETE'])
@jwt_required()
def remove_enrollment(workflow_id, enrollment_id):
    """Rimuovi lead da sequenza"""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    enrollment = AdminWorkflowEnrollment.query.filter_by(
        id=enrollment_id,
        workflow_id=workflow_id
    ).first_or_404()

    enrollment.status = 'removed'
    enrollment.exited_at = datetime.utcnow()
    enrollment.exit_reason = 'Rimosso manualmente'
    db.session.commit()

    log_action('remove_enrollment', 'workflow_enrollment', enrollment.id,
               f"Lead rimosso da sequenza")

    return jsonify({'message': 'Lead rimosso dalla sequenza'}), 200
