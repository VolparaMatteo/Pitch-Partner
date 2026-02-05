from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
import uuid

upload_bp = Blueprint('upload', __name__)

BASE_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
LOGO_FOLDER = os.path.join(BASE_UPLOAD_FOLDER, 'logos')
DOCUMENTS_FOLDER = os.path.join(BASE_UPLOAD_FOLDER, 'documents')
MEDIA_FOLDER = os.path.join(BASE_UPLOAD_FOLDER, 'media')
FATTURE_FOLDER = os.path.join(BASE_UPLOAD_FOLDER, 'fatture')
CONTRACTS_FOLDER = os.path.join(BASE_UPLOAD_FOLDER, 'contracts')

# Crea cartelle se non esistono
for folder in [LOGO_FOLDER, DOCUMENTS_FOLDER, MEDIA_FOLDER, FATTURE_FOLDER, CONTRACTS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

ALLOWED_IMAGES = {'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'}
ALLOWED_DOCUMENTS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'}
ALLOWED_VIDEOS = {'mp4', 'mov', 'avi', 'webm'}
ALLOWED_MEDIA = ALLOWED_IMAGES | ALLOWED_VIDEOS | {'pdf'}

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def get_file_size(file):
    """Get file size in bytes"""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    return size

@upload_bp.route('/upload/logo', methods=['POST'])
def upload_logo():
    if 'file' not in request.files:
        return jsonify({'error': 'Nessun file caricato'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400

    if not allowed_file(file.filename, ALLOWED_IMAGES):
        return jsonify({'error': 'Formato file non supportato. Usa: png, jpg, jpeg, gif, svg, webp'}), 400

    # Genera nome file unico
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"

    # Salva file
    filepath = os.path.join(LOGO_FOLDER, filename)
    file.save(filepath)

    # Ritorna URL del file
    file_url = f"/api/uploads/logos/{filename}"

    return jsonify({
        'message': 'File caricato con successo',
        'file_url': file_url
    }), 200

@upload_bp.route('/upload/document', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({'error': 'Nessun file caricato'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400

    if not allowed_file(file.filename, ALLOWED_DOCUMENTS):
        return jsonify({'error': 'Formato file non supportato. Usa: pdf, doc, docx, xls, xlsx, ppt, pptx, txt'}), 400

    # Genera nome file unico
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"

    # Salva file
    filepath = os.path.join(DOCUMENTS_FOLDER, filename)
    file_size = get_file_size(file)
    file.save(filepath)

    # Ritorna URL del file
    file_url = f"/api/uploads/documents/{filename}"

    return jsonify({
        'message': 'File caricato con successo',
        'file_url': file_url,
        'file_size': file_size,
        'file_type': ext
    }), 200

@upload_bp.route('/upload/media', methods=['POST'])
def upload_media():
    if 'file' not in request.files:
        return jsonify({'error': 'Nessun file caricato'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400

    if not allowed_file(file.filename, ALLOWED_MEDIA):
        return jsonify({'error': 'Formato file non supportato. Usa: immagini (png, jpg, jpeg, gif), video (mp4, mov, avi, webm), pdf'}), 400

    # Genera nome file unico
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"

    # Determina tipo media
    if ext in ALLOWED_IMAGES:
        tipo = 'immagine'
    elif ext in ALLOWED_VIDEOS:
        tipo = 'video'
    elif ext == 'pdf':
        tipo = 'pdf'
    else:
        tipo = 'altro'

    # Salva file
    filepath = os.path.join(MEDIA_FOLDER, filename)
    file_size = get_file_size(file)
    file.save(filepath)

    # Ritorna URL del file
    file_url = f"/api/uploads/media/{filename}"

    return jsonify({
        'message': 'File caricato con successo',
        'file_url': file_url,
        'file_size': file_size,
        'file_type': ext,
        'tipo': tipo
    }), 200

@upload_bp.route('/uploads/logos/<filename>')
def serve_logo(filename):
    return send_from_directory(LOGO_FOLDER, filename)

@upload_bp.route('/uploads/documents/<filename>')
def serve_document(filename):
    return send_from_directory(DOCUMENTS_FOLDER, filename)

@upload_bp.route('/uploads/media/<filename>')
def serve_media(filename):
    return send_from_directory(MEDIA_FOLDER, filename)

@upload_bp.route('/upload/fattura', methods=['POST'])
def upload_fattura():
    if 'file' not in request.files:
        return jsonify({'error': 'Nessun file caricato'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400

    if not allowed_file(file.filename, {'pdf'}):
        return jsonify({'error': 'Solo file PDF sono accettati per le fatture'}), 400

    # Genera nome file unico
    filename = f"{uuid.uuid4()}.pdf"

    # Salva file
    filepath = os.path.join(FATTURE_FOLDER, filename)
    file_size = get_file_size(file)
    file.save(filepath)

    # Ritorna URL del file
    file_url = f"/api/uploads/fatture/{filename}"

    return jsonify({
        'message': 'Fattura caricata con successo',
        'file_url': file_url,
        'file_size': file_size
    }), 200

@upload_bp.route('/uploads/fatture/<filename>')
def serve_fattura(filename):
    return send_from_directory(FATTURE_FOLDER, filename)

@upload_bp.route('/upload/contract', methods=['POST'])
def upload_contract():
    if 'file' not in request.files:
        return jsonify({'error': 'Nessun file caricato'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400

    if not allowed_file(file.filename, {'pdf'}):
        return jsonify({'error': 'Solo file PDF sono accettati per i contratti'}), 400

    # Genera nome file unico
    filename = f"{uuid.uuid4()}.pdf"

    # Salva file
    filepath = os.path.join(CONTRACTS_FOLDER, filename)
    file_size = get_file_size(file)
    file.save(filepath)

    # Ritorna URL del file
    file_url = f"/api/uploads/contracts/{filename}"

    return jsonify({
        'message': 'Contratto caricato con successo',
        'file_url': file_url,
        'file_size': file_size
    }), 200

@upload_bp.route('/uploads/contracts/<filename>')
def serve_contract(filename):
    return send_from_directory(CONTRACTS_FOLDER, filename)
