"""
Automation Routes - API per gestione automazioni
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Automation, AutomationExecution, EmailTemplate, SMTPConfiguration
from app.services.automation_service import AutomationService
from app.services.email_service import EmailService
from app.services.automation_scheduler import scheduler
from datetime import datetime


automation_bp = Blueprint('automation', __name__)


def verify_club():
    """Helper per verificare che l'utente sia un club"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


# ==================== TRIGGER & ACTION TYPES ====================

TRIGGER_TYPES = [
    # Lead
    {'type': 'lead_created', 'label': 'Lead creato', 'category': 'Lead', 'icon': 'user-plus',
     'config_fields': [
         {'name': 'fonte', 'label': 'Fonte', 'type': 'select', 'options': ['referral', 'evento', 'sito_web', 'social', 'cold_call', 'altro']}
     ]},
    {'type': 'lead_status_changed', 'label': 'Cambio stato lead', 'category': 'Lead', 'icon': 'exchange',
     'config_fields': [
         {'name': 'new_status', 'label': 'Nuovo stato', 'type': 'select', 'options': ['nuovo', 'contattato', 'in_trattativa', 'proposta_inviata', 'negoziazione', 'vinto', 'perso']}
     ]},
    {'type': 'lead_converted', 'label': 'Lead convertito', 'category': 'Lead', 'icon': 'check-circle'},

    # Sponsor
    {'type': 'sponsor_created', 'label': 'Sponsor creato', 'category': 'Sponsor', 'icon': 'building'},
    {'type': 'sponsor_activated', 'label': 'Sponsor attivato', 'category': 'Sponsor', 'icon': 'toggle-on'},
    {'type': 'sponsor_deactivated', 'label': 'Sponsor disattivato', 'category': 'Sponsor', 'icon': 'toggle-off'},

    # Contratti
    {'type': 'contract_created', 'label': 'Contratto creato', 'category': 'Contratti', 'icon': 'file-contract'},
    {'type': 'contract_expiring', 'label': 'Contratto in scadenza', 'category': 'Contratti', 'icon': 'clock',
     'config_fields': [
         {'name': 'days_before', 'label': 'Giorni prima', 'type': 'number', 'default': 30}
     ]},
    {'type': 'contract_expired', 'label': 'Contratto scaduto', 'category': 'Contratti', 'icon': 'calendar-times'},

    # Match
    {'type': 'match_created', 'label': 'Partita creata', 'category': 'Partite', 'icon': 'futbol'},
    {'type': 'match_starting', 'label': 'Partita in arrivo', 'category': 'Partite', 'icon': 'bell',
     'config_fields': [
         {'name': 'hours_before', 'label': 'Ore prima', 'type': 'number', 'default': 24}
     ]},

    # Eventi
    {'type': 'event_created', 'label': 'Evento creato', 'category': 'Eventi', 'icon': 'calendar-plus'},
    {'type': 'event_registration', 'label': 'Iscrizione evento', 'category': 'Eventi', 'icon': 'user-check'},

    # Budget
    {'type': 'budget_threshold', 'label': 'Soglia budget', 'category': 'Budget', 'icon': 'chart-pie',
     'config_fields': [
         {'name': 'percentage', 'label': 'Percentuale', 'type': 'number', 'default': 90}
     ]},
    {'type': 'payment_overdue', 'label': 'Pagamento scaduto', 'category': 'Budget', 'icon': 'exclamation-triangle'},

    # Messaggi
    {'type': 'message_received', 'label': 'Messaggio ricevuto', 'category': 'Messaggi', 'icon': 'envelope'},

    # Marketplace
    {'type': 'opportunity_published', 'label': 'Opportunità pubblicata', 'category': 'Marketplace', 'icon': 'store'},
    {'type': 'application_received', 'label': 'Candidatura ricevuta', 'category': 'Marketplace', 'icon': 'paper-plane'},

    # Progetti
    {'type': 'milestone_completed', 'label': 'Milestone completato', 'category': 'Progetti', 'icon': 'flag-checkered'},
    {'type': 'task_overdue', 'label': 'Task in ritardo', 'category': 'Progetti', 'icon': 'tasks'},

    # Schedulati
    {'type': 'cron', 'label': 'Programmato (Cron)', 'category': 'Schedulati', 'icon': 'clock',
     'config_fields': [
         {'name': 'cron', 'label': 'Espressione Cron', 'type': 'text', 'placeholder': '0 9 * * *', 'help': 'min ora giorno mese giorno_settimana'}
     ]},
    {'type': 'interval', 'label': 'Intervallo', 'category': 'Schedulati', 'icon': 'redo',
     'config_fields': [
         {'name': 'interval_minutes', 'label': 'Ogni X minuti', 'type': 'number', 'default': 60}
     ]},
    {'type': 'specific_date', 'label': 'Data specifica', 'category': 'Schedulati', 'icon': 'calendar-day',
     'config_fields': [
         {'name': 'date', 'label': 'Data e ora', 'type': 'datetime'}
     ]},
]

ACTION_TYPES = [
    {'type': 'send_notification', 'label': 'Invia notifica', 'icon': 'bell', 'color': '#4CAF50',
     'config_fields': [
         {'name': 'user_type', 'label': 'Destinatario', 'type': 'select', 'options': ['club', 'sponsor', 'trigger_entity']},
         {'name': 'titolo', 'label': 'Titolo', 'type': 'text', 'required': True},
         {'name': 'messaggio', 'label': 'Messaggio', 'type': 'textarea', 'required': True},
         {'name': 'priorita', 'label': 'Priorità', 'type': 'select', 'options': ['bassa', 'normale', 'alta', 'urgente'], 'default': 'normale'},
         {'name': 'link', 'label': 'Link (opzionale)', 'type': 'text'}
     ]},
    {'type': 'send_email', 'label': 'Invia email', 'icon': 'envelope', 'color': '#2196F3',
     'config_fields': [
         {'name': 'to', 'label': 'Destinatario', 'type': 'text', 'required': True, 'help': 'Email o {{lead.email}}'},
         {'name': 'template_id', 'label': 'Template', 'type': 'template_select'},
         {'name': 'oggetto', 'label': 'Oggetto', 'type': 'text', 'required': True},
         {'name': 'corpo', 'label': 'Corpo email', 'type': 'richtext'}
     ]},
    {'type': 'create_task', 'label': 'Crea task', 'icon': 'tasks', 'color': '#FF9800',
     'config_fields': [
         {'name': 'titolo', 'label': 'Titolo', 'type': 'text', 'required': True},
         {'name': 'descrizione', 'label': 'Descrizione', 'type': 'textarea'},
         {'name': 'assegnato_a', 'label': 'Assegnato a', 'type': 'select', 'options': ['club', 'sponsor']},
         {'name': 'priorita', 'label': 'Priorità', 'type': 'select', 'options': ['bassa', 'media', 'alta'], 'default': 'media'},
         {'name': 'scadenza_giorni', 'label': 'Scadenza (giorni)', 'type': 'number', 'default': 7}
     ]},
    {'type': 'update_status', 'label': 'Aggiorna stato', 'icon': 'edit', 'color': '#9C27B0',
     'config_fields': [
         {'name': 'entity_type', 'label': 'Tipo entità', 'type': 'select', 'options': ['lead', 'contract']},
         {'name': 'new_value', 'label': 'Nuovo stato', 'type': 'text', 'required': True}
     ]},
    {'type': 'create_activity', 'label': 'Crea attività', 'icon': 'clipboard-list', 'color': '#00BCD4',
     'config_fields': [
         {'name': 'entity_type', 'label': 'Tipo entità', 'type': 'select', 'options': ['lead', 'sponsor']},
         {'name': 'tipo', 'label': 'Tipo attività', 'type': 'select', 'options': ['chiamata', 'meeting', 'email', 'nota', 'altro']},
         {'name': 'descrizione', 'label': 'Descrizione', 'type': 'textarea', 'required': True}
     ]},
    {'type': 'webhook', 'label': 'Webhook', 'icon': 'globe', 'color': '#607D8B',
     'config_fields': [
         {'name': 'url', 'label': 'URL', 'type': 'text', 'required': True},
         {'name': 'method', 'label': 'Metodo', 'type': 'select', 'options': ['POST', 'GET', 'PUT'], 'default': 'POST'},
         {'name': 'body', 'label': 'Body (JSON)', 'type': 'textarea'}
     ]},
    {'type': 'delay', 'label': 'Attendi', 'icon': 'hourglass-half', 'color': '#795548',
     'config_fields': [
         {'name': 'minutes', 'label': 'Minuti', 'type': 'number', 'default': 0},
         {'name': 'hours', 'label': 'Ore', 'type': 'number', 'default': 0},
         {'name': 'days', 'label': 'Giorni', 'type': 'number', 'default': 0}
     ]},
    {'type': 'condition', 'label': 'Condizione', 'icon': 'code-branch', 'color': '#E91E63',
     'config_fields': [
         {'name': 'conditions', 'label': 'Condizioni', 'type': 'condition_builder'}
     ]},
]


# ==================== AUTOMATIONS CRUD ====================

@automation_bp.route('/club/automations', methods=['GET'])
@jwt_required()
def get_automations():
    """Lista automazioni del club"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    automations = Automation.query.filter_by(club_id=club_id).order_by(Automation.created_at.desc()).all()

    return jsonify({
        'automations': [a.to_dict() for a in automations]
    }), 200


@automation_bp.route('/club/automations/<int:automation_id>', methods=['GET'])
@jwt_required()
def get_automation(automation_id):
    """Dettaglio automazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    automation = Automation.query.get_or_404(automation_id)
    if automation.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    return jsonify(automation.to_dict()), 200


@automation_bp.route('/club/automations', methods=['POST'])
@jwt_required()
def create_automation():
    """Crea nuova automazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione
    if not data.get('nome'):
        return jsonify({'error': 'Nome richiesto'}), 400
    if not data.get('trigger_type'):
        return jsonify({'error': 'Trigger type richiesto'}), 400

    automation = Automation(
        club_id=club_id,
        nome=data['nome'],
        descrizione=data.get('descrizione'),
        trigger_type=data['trigger_type'],
        trigger_config=data.get('trigger_config', {}),
        steps=data.get('steps', []),
        abilitata=data.get('abilitata', True)
    )

    db.session.add(automation)
    db.session.flush()

    # Se è schedulata, imposta next_run
    if automation.trigger_type in ['cron', 'interval', 'specific_date']:
        scheduler.schedule_automation(automation)

    db.session.commit()

    return jsonify({
        'message': 'Automazione creata con successo',
        'automation': automation.to_dict()
    }), 201


@automation_bp.route('/club/automations/<int:automation_id>', methods=['PUT'])
@jwt_required()
def update_automation(automation_id):
    """Modifica automazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    automation = Automation.query.get_or_404(automation_id)
    if automation.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Aggiorna campi
    if 'nome' in data:
        automation.nome = data['nome']
    if 'descrizione' in data:
        automation.descrizione = data['descrizione']
    if 'trigger_type' in data:
        automation.trigger_type = data['trigger_type']
    if 'trigger_config' in data:
        automation.trigger_config = data['trigger_config']
    if 'steps' in data:
        automation.steps = data['steps']
    if 'abilitata' in data:
        automation.abilitata = data['abilitata']

    # Ricalcola next_run se necessario
    if automation.trigger_type in ['cron', 'interval', 'specific_date']:
        scheduler.schedule_automation(automation)

    db.session.commit()

    return jsonify({
        'message': 'Automazione aggiornata',
        'automation': automation.to_dict()
    }), 200


@automation_bp.route('/club/automations/<int:automation_id>', methods=['DELETE'])
@jwt_required()
def delete_automation(automation_id):
    """Elimina automazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    automation = Automation.query.get_or_404(automation_id)
    if automation.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(automation)
    db.session.commit()

    return jsonify({'message': 'Automazione eliminata'}), 200


@automation_bp.route('/club/automations/<int:automation_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_automation(automation_id):
    """Abilita/disabilita automazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    automation = Automation.query.get_or_404(automation_id)
    if automation.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    automation.abilitata = not automation.abilitata

    # Ricalcola next_run se abilitata
    if automation.abilitata and automation.trigger_type in ['cron', 'interval', 'specific_date']:
        scheduler.schedule_automation(automation)

    db.session.commit()

    return jsonify({
        'message': f'Automazione {"abilitata" if automation.abilitata else "disabilitata"}',
        'abilitata': automation.abilitata
    }), 200


@automation_bp.route('/club/automations/<int:automation_id>/test', methods=['POST'])
@jwt_required()
def test_automation(automation_id):
    """Test manuale automazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    automation = Automation.query.get_or_404(automation_id)
    if automation.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Esegui con dati di test
    trigger_data = {
        'entity_type': 'test',
        'entity_id': 0,
        'test': True
    }

    try:
        execution = AutomationService.execute_automation(automation, trigger_data)
        return jsonify({
            'message': 'Test eseguito',
            'execution': execution.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': f'Errore durante il test: {str(e)}'}), 500


# ==================== EXECUTIONS ====================

@automation_bp.route('/club/automations/<int:automation_id>/executions', methods=['GET'])
@jwt_required()
def get_executions(automation_id):
    """Lista esecuzioni di un'automazione"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    automation = Automation.query.get_or_404(automation_id)
    if automation.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Paginazione
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    executions = automation.executions.order_by(
        AutomationExecution.started_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'executions': [e.to_dict() for e in executions.items],
        'total': executions.total,
        'pages': executions.pages,
        'current_page': page
    }), 200


# ==================== METADATA ====================

@automation_bp.route('/club/automations/triggers', methods=['GET'])
@jwt_required()
def get_trigger_types():
    """Lista tipi di trigger disponibili"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    return jsonify({'triggers': TRIGGER_TYPES}), 200


@automation_bp.route('/club/automations/actions', methods=['GET'])
@jwt_required()
def get_action_types():
    """Lista tipi di azioni disponibili"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    return jsonify({'actions': ACTION_TYPES}), 200


# ==================== EMAIL TEMPLATES ====================

@automation_bp.route('/club/email-templates', methods=['GET'])
@jwt_required()
def get_email_templates():
    """Lista template email"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    templates = EmailTemplate.query.filter_by(club_id=club_id).order_by(EmailTemplate.nome).all()

    return jsonify({
        'templates': [t.to_dict() for t in templates]
    }), 200


@automation_bp.route('/club/email-templates', methods=['POST'])
@jwt_required()
def create_email_template():
    """Crea template email"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    if not data.get('nome') or not data.get('oggetto') or not data.get('corpo_html'):
        return jsonify({'error': 'Nome, oggetto e corpo sono richiesti'}), 400

    template = EmailTemplate(
        club_id=club_id,
        nome=data['nome'],
        oggetto=data['oggetto'],
        corpo_html=data['corpo_html'],
        corpo_text=data.get('corpo_text'),
        variabili_disponibili=data.get('variabili_disponibili', [])
    )

    db.session.add(template)
    db.session.commit()

    return jsonify({
        'message': 'Template creato',
        'template': template.to_dict()
    }), 201


@automation_bp.route('/club/email-templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_email_template(template_id):
    """Modifica template email"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = EmailTemplate.query.get_or_404(template_id)
    if template.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    if 'nome' in data:
        template.nome = data['nome']
    if 'oggetto' in data:
        template.oggetto = data['oggetto']
    if 'corpo_html' in data:
        template.corpo_html = data['corpo_html']
    if 'corpo_text' in data:
        template.corpo_text = data['corpo_text']
    if 'variabili_disponibili' in data:
        template.variabili_disponibili = data['variabili_disponibili']

    db.session.commit()

    return jsonify({
        'message': 'Template aggiornato',
        'template': template.to_dict()
    }), 200


@automation_bp.route('/club/email-templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_email_template(template_id):
    """Elimina template email"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = EmailTemplate.query.get_or_404(template_id)
    if template.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(template)
    db.session.commit()

    return jsonify({'message': 'Template eliminato'}), 200


# ==================== SMTP CONFIG ====================

@automation_bp.route('/club/smtp-config', methods=['GET'])
@jwt_required()
def get_smtp_config():
    """Recupera configurazione SMTP"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    config = SMTPConfiguration.query.filter_by(club_id=club_id).first()

    if config:
        return jsonify(config.to_dict()), 200
    else:
        return jsonify({'configured': False}), 200


@automation_bp.route('/club/smtp-config', methods=['POST'])
@jwt_required()
def save_smtp_config():
    """Salva configurazione SMTP"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    required = ['host', 'port', 'username', 'password', 'from_email']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} richiesto'}), 400

    config = EmailService.save_smtp_config(
        club_id=club_id,
        host=data['host'],
        port=data['port'],
        username=data['username'],
        password=data['password'],
        use_tls=data.get('use_tls', True),
        from_email=data['from_email'],
        from_name=data.get('from_name')
    )

    return jsonify({
        'message': 'Configurazione salvata',
        'config': config.to_dict()
    }), 200


@automation_bp.route('/club/smtp-config/test', methods=['POST'])
@jwt_required()
def test_smtp_config():
    """Test connessione SMTP"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    result = EmailService.test_connection(club_id)

    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


# ==================== VARIABILI DISPONIBILI ====================

@automation_bp.route('/club/automations/variables', methods=['GET'])
@jwt_required()
def get_available_variables():
    """Lista variabili disponibili per template"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    variables = {
        'lead': [
            {'var': '{{lead.ragione_sociale}}', 'label': 'Ragione Sociale'},
            {'var': '{{lead.email}}', 'label': 'Email'},
            {'var': '{{lead.telefono}}', 'label': 'Telefono'},
            {'var': '{{lead.nome_contatto}}', 'label': 'Nome Contatto'},
            {'var': '{{lead.status}}', 'label': 'Status'},
            {'var': '{{lead.settore_merceologico}}', 'label': 'Settore'},
        ],
        'sponsor': [
            {'var': '{{sponsor.ragione_sociale}}', 'label': 'Ragione Sociale'},
            {'var': '{{sponsor.email}}', 'label': 'Email'},
            {'var': '{{sponsor.telefono}}', 'label': 'Telefono'},
            {'var': '{{sponsor.referente_nome}}', 'label': 'Nome Referente'},
            {'var': '{{sponsor.settore_merceologico}}', 'label': 'Settore'},
        ],
        'contract': [
            {'var': '{{contract.nome_contratto}}', 'label': 'Nome Contratto'},
            {'var': '{{contract.compenso}}', 'label': 'Compenso'},
            {'var': '{{contract.data_inizio}}', 'label': 'Data Inizio'},
            {'var': '{{contract.data_fine}}', 'label': 'Data Fine'},
            {'var': '{{contract.status}}', 'label': 'Status'},
        ],
        'trigger': [
            {'var': '{{trigger_data.entity_type}}', 'label': 'Tipo Entità'},
            {'var': '{{trigger_data.entity_id}}', 'label': 'ID Entità'},
        ],
        'system': [
            {'var': '{{now}}', 'label': 'Data/Ora Attuale'},
            {'var': '{{club_id}}', 'label': 'ID Club'},
        ]
    }

    return jsonify({'variables': variables}), 200
