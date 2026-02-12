"""
Route admin per gestione template contratti e documenti PDF.
Blueprint: admin_document_bp, prefix /api/admin
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models import (
    ContractTemplate, ContractDocument, ContractDocumentView,
    AdminContract, Club, AuditLog
)
from app.services.contract_document_service import ContractDocumentService
from datetime import datetime, timedelta
import json

admin_document_bp = Blueprint('admin_document', __name__)


def _require_admin():
    claims = get_jwt()
    return claims.get('role') == 'admin'


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


# ========================================
# TEMPLATE CRUD
# ========================================

@admin_document_bp.route('/document/templates', methods=['GET'])
@jwt_required()
def get_templates():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    plan_type = request.args.get('plan_type')
    attivo = request.args.get('attivo')

    query = ContractTemplate.query
    if plan_type:
        query = query.filter(ContractTemplate.plan_type == plan_type)
    if attivo is not None:
        query = query.filter(ContractTemplate.attivo == (attivo.lower() == 'true'))

    templates = query.order_by(ContractTemplate.created_at.desc()).all()
    return jsonify({'templates': [t.to_dict() for t in templates]})


@admin_document_bp.route('/document/templates/<int:template_id>', methods=['GET'])
@jwt_required()
def get_template(template_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = ContractTemplate.query.get_or_404(template_id)
    return jsonify(template.to_dict())


@admin_document_bp.route('/document/templates', methods=['POST'])
@jwt_required()
def create_template():
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    if not data.get('nome') or not data.get('codice') or not data.get('corpo_html'):
        return jsonify({'error': 'Nome, codice e corpo HTML sono obbligatori'}), 400

    # Check unique codice
    existing = ContractTemplate.query.filter_by(codice=data['codice']).first()
    if existing:
        return jsonify({'error': 'Codice template gia esistente'}), 400

    admin_id = get_jwt_identity()
    template = ContractTemplate(
        nome=data['nome'],
        codice=data['codice'],
        descrizione=data.get('descrizione', ''),
        corpo_html=data['corpo_html'],
        stile_css=data.get('stile_css', ''),
        variabili=data.get('variabili', ''),
        plan_type=data.get('plan_type'),
        attivo=data.get('attivo', True),
        created_by=int(admin_id) if admin_id else None
    )
    db.session.add(template)
    db.session.commit()

    log_action('creazione', 'contract_template', template.id, f'Template: {template.nome}')
    return jsonify(template.to_dict()), 201


@admin_document_bp.route('/document/templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_template(template_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = ContractTemplate.query.get_or_404(template_id)
    data = request.get_json()

    # Check unique codice if changed
    if data.get('codice') and data['codice'] != template.codice:
        existing = ContractTemplate.query.filter_by(codice=data['codice']).first()
        if existing:
            return jsonify({'error': 'Codice template gia esistente'}), 400

    for field in ['nome', 'codice', 'descrizione', 'corpo_html', 'stile_css', 'variabili', 'plan_type', 'attivo']:
        if field in data:
            setattr(template, field, data[field])

    db.session.commit()
    log_action('modifica', 'contract_template', template.id, f'Template: {template.nome}')
    return jsonify(template.to_dict())


@admin_document_bp.route('/document/templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = ContractTemplate.query.get_or_404(template_id)
    nome = template.nome
    db.session.delete(template)
    db.session.commit()

    log_action('eliminazione', 'contract_template', template_id, f'Template: {nome}')
    return jsonify({'message': 'Template eliminato'})


@admin_document_bp.route('/document/templates/<int:template_id>/preview', methods=['POST'])
@jwt_required()
def preview_template(template_id):
    """Preview: merge con dati sample, ritorna HTML renderizzato."""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    template = ContractTemplate.query.get_or_404(template_id)

    # Sample data for preview
    sample_context = {
        'club': {
            'nome': 'ASD Esempio Calcio',
            'email': 'info@esempioclub.it',
            'indirizzo_sede_legale': 'Via Roma 1, 20100 Milano (MI)',
            'referente_nome': 'Mario',
            'referente_cognome': 'Rossi',
            'referente_ruolo': 'Presidente',
            'partita_iva': '12345678901',
            'codice_fiscale': 'RSSMRA80A01F205X',
            'telefono': '+39 02 1234567',
        },
        'contract': {
            'plan_type': template.plan_type or 'premium',
            'plan_price': '\u20ac 15.000,00',
            'total_value': '\u20ac 15.000,00',
            'vat_rate': '22%',
            'vat_amount': '\u20ac 3.300,00',
            'total_value_with_vat': '\u20ac 18.300,00',
            'start_date': '01/01/2026',
            'end_date': '31/12/2026',
            'payment_terms': 'annual',
            'addons': 'Setup & Onboarding (\u20ac 2.500,00)',
            'status': 'active',
        },
        'data_odierna': datetime.now().strftime('%d/%m/%Y'),
        'anno_corrente': str(datetime.now().year),
    }

    rendered = ContractDocumentService.render_template(template.corpo_html, sample_context)
    return jsonify({'html': rendered, 'css': template.stile_css or ''})


# ========================================
# DOCUMENTI CONTRATTO
# ========================================

@admin_document_bp.route('/contracts/<int:contract_id>/documents/generate', methods=['POST'])
@jwt_required()
def generate_document(contract_id):
    """Genera PDF da template per un contratto."""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    template_id = data.get('template_id')
    if not template_id:
        return jsonify({'error': 'template_id obbligatorio'}), 400

    admin_id = get_jwt_identity()
    try:
        doc = ContractDocumentService.generate_contract_document(
            contract_id, template_id, int(admin_id) if admin_id else None
        )
        log_action('generazione_documento', 'contract_document', doc.id,
                    f'Contratto #{contract_id}, Template #{template_id}, v{doc.versione}')
        return jsonify(doc.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Errore generazione PDF: {str(e)}'}), 500


@admin_document_bp.route('/contracts/<int:contract_id>/documents', methods=['GET'])
@jwt_required()
def get_contract_documents(contract_id):
    """Lista versioni documento per contratto."""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    docs = ContractDocument.query.filter_by(
        contract_id=contract_id
    ).order_by(ContractDocument.versione.desc()).all()

    return jsonify({'documents': [d.to_dict() for d in docs]})


@admin_document_bp.route('/documents/<int:document_id>', methods=['GET'])
@jwt_required()
def get_document(document_id):
    """Dettaglio documento con views e firma."""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    doc = ContractDocument.query.get_or_404(document_id)
    result = doc.to_dict()

    # Include recent views
    recent_views = ContractDocumentView.query.filter_by(
        document_id=document_id
    ).order_by(ContractDocumentView.viewed_at.desc()).limit(50).all()
    result['views'] = [v.to_dict() for v in recent_views]

    return jsonify(result)


@admin_document_bp.route('/documents/<int:document_id>/send', methods=['POST'])
@jwt_required()
def send_document(document_id):
    """Invia link firma via email al club."""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    doc = ContractDocument.query.get_or_404(document_id)
    data = request.get_json() or {}

    email = data.get('email')
    if not email:
        # Try to get from club
        contract = AdminContract.query.get(doc.contract_id)
        if contract:
            club = Club.query.get(contract.club_id)
            if club:
                email = club.email

    if not email:
        return jsonify({'error': 'Email destinatario obbligatoria'}), 400

    # Update document status
    doc.status = 'sent'
    doc.sent_at = datetime.utcnow()
    doc.sent_to_email = email

    # Set expiry (30 days from now)
    days = data.get('expires_days', 30)
    doc.expires_at = datetime.utcnow() + timedelta(days=days)

    db.session.commit()

    # Build signing URL
    signing_url = f"/firma/{doc.token}"

    log_action('invio_documento', 'contract_document', doc.id,
               f'Inviato a {email}, token: {doc.token}')

    return jsonify({
        'message': 'Documento inviato',
        'signing_url': signing_url,
        'token': doc.token,
        'sent_to': email,
        'expires_at': doc.expires_at.isoformat()
    })


@admin_document_bp.route('/documents/<int:document_id>/revoke', methods=['POST'])
@jwt_required()
def revoke_document(document_id):
    """Revoca documento."""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    doc = ContractDocument.query.get_or_404(document_id)
    if doc.status == 'signed':
        return jsonify({'error': 'Non puoi revocare un documento gia firmato'}), 400

    doc.status = 'revoked'
    db.session.commit()

    log_action('revoca_documento', 'contract_document', doc.id)
    return jsonify({'message': 'Documento revocato'})


@admin_document_bp.route('/documents/<int:document_id>/tracking', methods=['GET'])
@jwt_required()
def get_document_tracking(document_id):
    """Dati tracking visualizzazioni."""
    if not _require_admin():
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    views = ContractDocumentView.query.filter_by(
        document_id=document_id
    ).order_by(ContractDocumentView.viewed_at.desc()).all()

    return jsonify({
        'views': [v.to_dict() for v in views],
        'total_views': len(views)
    })
