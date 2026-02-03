from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Lead, LeadDocument
from datetime import datetime
import os


def verify_club():
    """Helper function to verify club role and return club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


lead_document_bp = Blueprint('lead_document', __name__)

CATEGORIE_DOCUMENTO = [
    'proposta', 'presentazione', 'brochure', 'contratto_draft',
    'report', 'corrispondenza', 'altro'
]


# ── GET /club/leads/<lead_id>/documents ──────────────────────
@lead_document_bp.route('/club/leads/<int:lead_id>/documents', methods=['GET'])
@jwt_required()
def get_lead_documents(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    lead = Lead.query.filter_by(id=lead_id, club_id=club_id).first()
    if not lead:
        return jsonify({'error': 'Lead non trovato'}), 404

    categoria = request.args.get('categoria')

    query = LeadDocument.query.filter_by(lead_id=lead_id, club_id=club_id)
    if categoria:
        query = query.filter_by(categoria=categoria)

    docs = query.order_by(LeadDocument.created_at.desc()).all()

    return jsonify({
        'documents': [{
            'id': d.id,
            'nome': d.nome,
            'categoria': d.categoria,
            'file_url': d.file_url,
            'file_size': d.file_size,
            'file_type': d.file_type,
            'descrizione': d.descrizione,
            'created_at': d.created_at.isoformat() if d.created_at else None
        } for d in docs],
        'count': len(docs)
    })


# ── POST /club/leads/<lead_id>/documents ─────────────────────
@lead_document_bp.route('/club/leads/<int:lead_id>/documents', methods=['POST'])
@jwt_required()
def create_lead_document(lead_id):
    """Salva metadata di un documento già caricato via /upload/document"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    lead = Lead.query.filter_by(id=lead_id, club_id=club_id).first()
    if not lead:
        return jsonify({'error': 'Lead non trovato'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dati mancanti'}), 400

    nome = data.get('nome', '').strip()
    file_url = data.get('file_url', '').strip()

    if not nome or not file_url:
        return jsonify({'error': 'Nome e file_url sono obbligatori'}), 400

    categoria = data.get('categoria', 'altro')
    if categoria not in CATEGORIE_DOCUMENTO:
        categoria = 'altro'

    doc = LeadDocument(
        lead_id=lead_id,
        club_id=club_id,
        nome=nome,
        categoria=categoria,
        file_url=file_url,
        file_size=data.get('file_size'),
        file_type=data.get('file_type'),
        descrizione=data.get('descrizione')
    )
    db.session.add(doc)
    db.session.commit()

    return jsonify({
        'message': 'Documento aggiunto',
        'document': {
            'id': doc.id,
            'nome': doc.nome,
            'categoria': doc.categoria,
            'file_url': doc.file_url,
            'file_size': doc.file_size,
            'file_type': doc.file_type,
            'created_at': doc.created_at.isoformat() if doc.created_at else None
        }
    }), 201


# ── PUT /club/leads/<lead_id>/documents/<doc_id> ─────────────
@lead_document_bp.route('/club/leads/<int:lead_id>/documents/<int:doc_id>', methods=['PUT'])
@jwt_required()
def update_lead_document(lead_id, doc_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    doc = LeadDocument.query.filter_by(id=doc_id, lead_id=lead_id, club_id=club_id).first()
    if not doc:
        return jsonify({'error': 'Documento non trovato'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dati mancanti'}), 400

    if 'nome' in data:
        doc.nome = data['nome']
    if 'categoria' in data and data['categoria'] in CATEGORIE_DOCUMENTO:
        doc.categoria = data['categoria']
    if 'descrizione' in data:
        doc.descrizione = data['descrizione']

    db.session.commit()

    return jsonify({
        'message': 'Documento aggiornato',
        'document': {
            'id': doc.id,
            'nome': doc.nome,
            'categoria': doc.categoria,
            'file_url': doc.file_url,
            'descrizione': doc.descrizione
        }
    })


# ── DELETE /club/leads/<lead_id>/documents/<doc_id> ───────────
@lead_document_bp.route('/club/leads/<int:lead_id>/documents/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_lead_document(lead_id, doc_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    doc = LeadDocument.query.filter_by(id=doc_id, lead_id=lead_id, club_id=club_id).first()
    if not doc:
        return jsonify({'error': 'Documento non trovato'}), 404

    # Tenta di rimuovere il file fisico
    if doc.file_url:
        try:
            base_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                'uploads'
            )
            # file_url è tipo /api/uploads/documents/xxxx.pdf
            relative = doc.file_url.replace('/api/uploads/', '')
            file_path = os.path.join(base_path, relative)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass  # Il file potrebbe non esistere più

    db.session.delete(doc)
    db.session.commit()

    return jsonify({'message': 'Documento eliminato'})


# ── GET /club/leads/<lead_id>/documents/categories ────────────
@lead_document_bp.route('/club/leads/<int:lead_id>/documents/categories', methods=['GET'])
@jwt_required()
def get_document_categories(lead_id):
    """Restituisce le categorie disponibili con conteggio"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Non autorizzato'}), 403

    counts = {}
    docs = LeadDocument.query.filter_by(lead_id=lead_id, club_id=club_id).all()
    for d in docs:
        counts[d.categoria] = counts.get(d.categoria, 0) + 1

    return jsonify({
        'categories': CATEGORIE_DOCUMENTO,
        'counts': counts
    })
