"""
Route pubbliche per firma contratto (no auth, token-based).
Blueprint: contract_signing_bp, prefix /api
"""

from flask import Blueprint, request, jsonify, send_file
from app import db
from app.models import (
    ContractDocument, ContractDocumentView, ContractSignature, AdminContract
)
from app.services.contract_document_service import ContractDocumentService
from datetime import datetime
import os

contract_signing_bp = Blueprint('contract_signing', __name__)


def _get_document_by_token(token):
    """Recupera documento per token, None se non trovato."""
    return ContractDocument.query.filter_by(token=token).first()


def _record_view(document, req):
    """Registra una visualizzazione del documento."""
    view = ContractDocumentView(
        document_id=document.id,
        ip_address=req.remote_addr,
        user_agent=req.user_agent.string[:500] if req.user_agent else None
    )
    db.session.add(view)

    # Auto-update status to viewed if currently sent
    if document.status == 'sent':
        document.status = 'viewed'

    db.session.commit()


# ==================== PUBLIC ENDPOINTS (NO AUTH) ====================

@contract_signing_bp.route('/sign/<token>', methods=['GET'])
def get_signing_info(token):
    """Info documento per pagina firma. Registra view."""
    doc = _get_document_by_token(token)
    if not doc:
        return jsonify({'error': 'Documento non trovato'}), 404

    # Check expiry
    if doc.expires_at and datetime.utcnow() > doc.expires_at:
        if doc.status not in ('signed', 'revoked', 'expired'):
            doc.status = 'expired'
            db.session.commit()

    _record_view(doc, request)

    # Get contract info
    contract = AdminContract.query.get(doc.contract_id)
    contract_info = {}
    if contract:
        contract_info = {
            'club_name': contract.club.nome if contract.club else '',
            'plan_type': contract.plan_type,
            'total_value': contract.total_value,
            'total_value_with_vat': contract.total_value_with_vat,
            'start_date': contract.start_date.isoformat() if contract.start_date else None,
            'end_date': contract.end_date.isoformat() if contract.end_date else None,
        }

    result = {
        'document': {
            'id': doc.id,
            'status': doc.status,
            'versione': doc.versione,
            'file_name': doc.file_name,
            'created_at': doc.created_at.isoformat() if doc.created_at else None,
            'expires_at': doc.expires_at.isoformat() if doc.expires_at else None,
        },
        'contract': contract_info,
        'already_signed': doc.signature is not None,
        'signature': doc.signature.to_dict() if doc.signature else None,
    }

    return jsonify(result)


@contract_signing_bp.route('/sign/<token>', methods=['POST'])
def submit_signature(token):
    """Invia firma digitale."""
    doc = _get_document_by_token(token)
    if not doc:
        return jsonify({'error': 'Documento non trovato'}), 404

    # Validations
    if doc.status == 'revoked':
        return jsonify({'error': 'Documento revocato'}), 400
    if doc.status == 'expired' or (doc.expires_at and datetime.utcnow() > doc.expires_at):
        return jsonify({'error': 'Documento scaduto'}), 400
    if doc.signature:
        return jsonify({'error': 'Documento gia firmato'}), 400

    data = request.get_json()
    required = ['signer_name', 'signer_email', 'signature_image']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Campo {field} obbligatorio'}), 400

    try:
        # Generate signed PDF
        signature_data = {
            'signer_name': data['signer_name'],
            'signer_email': data['signer_email'],
            'signer_role': data.get('signer_role', ''),
            'signature_image': data['signature_image'],
            'ip_address': request.remote_addr,
        }

        signed_url, signed_hash, signed_size = ContractDocumentService.generate_signed_pdf(
            doc.id, signature_data
        )

        # Create signature record
        sig = ContractSignature(
            document_id=doc.id,
            signer_name=data['signer_name'],
            signer_email=data['signer_email'],
            signer_role=data.get('signer_role', ''),
            signature_image=data['signature_image'],
            document_hash_at_signing=doc.document_hash,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string[:500] if request.user_agent else None,
            signed_file_url=signed_url,
            signed_document_hash=signed_hash,
        )
        db.session.add(sig)

        # Update document status
        doc.status = 'signed'
        db.session.commit()

        return jsonify({
            'message': 'Documento firmato con successo',
            'signature': sig.to_dict(),
            'signed_pdf_url': signed_url,
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Errore durante la firma: {str(e)}'}), 500


@contract_signing_bp.route('/sign/<token>/pdf', methods=['GET'])
def download_pdf(token):
    """Download PDF corrente. Registra view."""
    doc = _get_document_by_token(token)
    if not doc:
        return jsonify({'error': 'Documento non trovato'}), 404

    _record_view(doc, request)

    # Resolve file path
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    file_path = os.path.join(base_dir, doc.file_url.lstrip('/'))

    if not os.path.exists(file_path):
        return jsonify({'error': 'File PDF non trovato'}), 404

    return send_file(file_path, mimetype='application/pdf', as_attachment=False,
                     download_name=doc.file_name)


@contract_signing_bp.route('/sign/<token>/signed-pdf', methods=['GET'])
def download_signed_pdf(token):
    """Download PDF firmato (solo dopo firma)."""
    doc = _get_document_by_token(token)
    if not doc:
        return jsonify({'error': 'Documento non trovato'}), 404

    if not doc.signature or not doc.signature.signed_file_url:
        return jsonify({'error': 'Documento non ancora firmato'}), 400

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    file_path = os.path.join(base_dir, doc.signature.signed_file_url.lstrip('/'))

    if not os.path.exists(file_path):
        return jsonify({'error': 'File PDF firmato non trovato'}), 404

    signed_name = os.path.basename(doc.signature.signed_file_url)
    return send_file(file_path, mimetype='application/pdf', as_attachment=False,
                     download_name=signed_name)
