from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Document, Media, Sponsor, Club, Notification, HeadOfTerms
from datetime import datetime

repository_bp = Blueprint('repository', __name__)


def verify_club():
    """Verifica che l'utente sia un club"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    club_id = int(get_jwt_identity())
    return club_id


def verify_sponsor():
    """Verifica che l'utente sia uno sponsor"""
    claims = get_jwt()
    if claims.get('role') != 'sponsor':
        return None
    sponsor_id = int(get_jwt_identity())
    return sponsor_id


def create_notification(user_type, user_id, tipo, titolo, messaggio, link=None):
    """Crea una notifica"""
    notification = Notification(
        user_type=user_type,
        user_id=user_id,
        tipo=tipo,
        titolo=titolo,
        messaggio=messaggio,
        link=link
    )
    db.session.add(notification)
    db.session.commit()


# ================== DOCUMENTS ==================

# CREATE - Carica documento
@repository_bp.route('/sponsors/<int:sponsor_id>/documents', methods=['POST'])
@jwt_required()
def upload_document(sponsor_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica permessi
    sponsor = Sponsor.query.get(sponsor_id)
    if not sponsor:
        return jsonify({'error': 'Sponsor non trovato'}), 404

    if role == 'club' and sponsor.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Validazione
    required_fields = ['categoria', 'nome', 'file_url']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    # Ottieni email utente
    if role == 'club':
        club = Club.query.get(user_id)
        user_email = club.email if club else 'Club'
    else:
        user_email = sponsor.email

    # Crea documento
    document = Document(
        club_id=sponsor.club_id,
        sponsor_id=sponsor_id,
        categoria=data['categoria'],
        nome=data['nome'],
        file_url=data['file_url'],
        file_size=data.get('file_size'),
        file_type=data.get('file_type'),
        descrizione=data.get('descrizione', ''),
        caricato_da=role,
        caricato_da_user=user_email
    )

    db.session.add(document)
    db.session.commit()

    # Crea notifica per l'altro ruolo
    if role == 'club':
        create_notification(
            user_type='sponsor',
            user_id=sponsor_id,
            tipo='nuovo_documento',
            titolo='Nuovo documento caricato',
            messaggio=f'Il club ha caricato un nuovo documento: {data["nome"]}',
            link=f'/sponsor/documents'
        )
    else:
        create_notification(
            user_type='club',
            user_id=sponsor.club_id,
            tipo='nuovo_documento',
            titolo='Nuovo documento caricato',
            messaggio=f'Lo sponsor {sponsor.ragione_sociale} ha caricato un nuovo documento: {data["nome"]}',
            link=f'/club/sponsors/{sponsor_id}/documents'
        )

    return jsonify({
        'message': 'Documento caricato con successo',
        'document': {
            'id': document.id,
            'nome': document.nome,
            'categoria': document.categoria,
            'file_url': document.file_url
        }
    }), 201


# READ - Ottieni documenti di uno sponsor
# GET - Ottieni documenti per contratto
@repository_bp.route('/contracts/<int:contract_id>/documents', methods=['GET'])
@jwt_required()
def get_documents_by_contract(contract_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica che il contratto esista e l'utente abbia accesso
    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Ottieni documenti dello sponsor
    categoria = request.args.get('categoria')
    query = Document.query.filter_by(sponsor_id=contract.sponsor_id)
    if categoria:
        query = query.filter_by(categoria=categoria)

    documents = query.order_by(Document.created_at.desc()).all()

    documents_data = []
    for doc in documents:
        documents_data.append({
            'id': doc.id,
            'categoria': doc.categoria,
            'nome': doc.nome,
            'file_url': doc.file_url,
            'file_size': doc.file_size,
            'file_type': doc.file_type,
            'descrizione': doc.descrizione,
            'caricato_da': doc.caricato_da,
            'caricato_da_user': doc.caricato_da_user,
            'created_at': doc.created_at.isoformat()
        })

    return jsonify({'documents': documents_data}), 200


@repository_bp.route('/sponsors/<int:sponsor_id>/documents', methods=['GET'])
@jwt_required()
def get_documents(sponsor_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica permessi
    sponsor = Sponsor.query.get(sponsor_id)
    if not sponsor:
        return jsonify({'error': 'Sponsor non trovato'}), 404

    if role == 'club' and sponsor.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri opzionali
    categoria = request.args.get('categoria')

    query = Document.query.filter_by(sponsor_id=sponsor_id)
    if categoria:
        query = query.filter_by(categoria=categoria)

    documents = query.order_by(Document.created_at.desc()).all()

    documents_data = []
    for doc in documents:
        documents_data.append({
            'id': doc.id,
            'categoria': doc.categoria,
            'nome': doc.nome,
            'file_url': doc.file_url,
            'file_size': doc.file_size,
            'file_type': doc.file_type,
            'descrizione': doc.descrizione,
            'caricato_da': doc.caricato_da,
            'caricato_da_user': doc.caricato_da_user,
            'created_at': doc.created_at.isoformat()
        })

    return jsonify({'documents': documents_data}), 200


# DELETE - Elimina documento
@repository_bp.route('/documents/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    document = Document.query.get(document_id)
    if not document:
        return jsonify({'error': 'Documento non trovato'}), 404

    # Solo chi ha caricato può eliminare
    if role == 'club' and (document.club_id != user_id or document.caricato_da != 'club'):
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and (document.sponsor_id != user_id or document.caricato_da != 'sponsor'):
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(document)
    db.session.commit()

    return jsonify({'message': 'Documento eliminato con successo'}), 200


# ================== MEDIA ==================

# CREATE - Carica media
@repository_bp.route('/sponsors/<int:sponsor_id>/media', methods=['POST'])
@jwt_required()
def upload_media(sponsor_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica permessi
    sponsor = Sponsor.query.get(sponsor_id)
    if not sponsor:
        return jsonify({'error': 'Sponsor non trovato'}), 404

    if role == 'club' and sponsor.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.json

    # Validazione
    required_fields = ['tipo', 'nome', 'file_url']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo {field} mancante'}), 400

    # Ottieni email utente
    if role == 'club':
        club = Club.query.get(user_id)
        user_email = club.email if club else 'Club'
    else:
        user_email = sponsor.email

    # Crea media
    media = Media(
        club_id=sponsor.club_id,
        sponsor_id=sponsor_id,
        tipo=data['tipo'],
        nome=data['nome'],
        file_url=data['file_url'],
        thumbnail_url=data.get('thumbnail_url'),
        file_size=data.get('file_size'),
        tags=data.get('tags', ''),
        descrizione=data.get('descrizione', ''),
        caricato_da=role,
        caricato_da_user=user_email
    )

    db.session.add(media)
    db.session.commit()

    # Crea notifica per l'altro ruolo
    if role == 'club':
        create_notification(
            user_type='sponsor',
            user_id=sponsor_id,
            tipo='nuovo_media',
            titolo='Nuovo media caricato',
            messaggio=f'Il club ha caricato un nuovo file: {data["nome"]}',
            link=f'/sponsor/media'
        )
    else:
        create_notification(
            user_type='club',
            user_id=sponsor.club_id,
            tipo='nuovo_media',
            titolo='Nuovo media caricato',
            messaggio=f'Lo sponsor {sponsor.ragione_sociale} ha caricato un nuovo file: {data["nome"]}',
            link=f'/club/sponsors/{sponsor_id}/media'
        )

    return jsonify({
        'message': 'Media caricato con successo',
        'media': {
            'id': media.id,
            'nome': media.nome,
            'tipo': media.tipo,
            'file_url': media.file_url
        }
    }), 201


# READ - Ottieni media di uno sponsor
# GET - Ottieni media per contratto
@repository_bp.route('/contracts/<int:contract_id>/media', methods=['GET'])
@jwt_required()
def get_media_by_contract(contract_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica che il contratto esista e l'utente abbia accesso
    contract = HeadOfTerms.query.get(contract_id)
    if not contract:
        return jsonify({'error': 'Contratto non trovato'}), 404

    if role == 'club' and contract.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and contract.sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri opzionali
    tipo = request.args.get('tipo')
    tags = request.args.get('tags')

    query = Media.query.filter_by(sponsor_id=contract.sponsor_id)
    if tipo:
        query = query.filter_by(tipo=tipo)
    if tags:
        query = query.filter(Media.tags.ilike(f'%{tags}%'))

    media_list = query.order_by(Media.created_at.desc()).all()

    media_data = []
    for media in media_list:
        media_data.append({
            'id': media.id,
            'tipo': media.tipo,
            'nome': media.nome,
            'file_url': media.file_url,
            'thumbnail_url': media.thumbnail_url,
            'file_size': media.file_size,
            'descrizione': media.descrizione,
            'tags': media.tags,
            'caricato_da': media.caricato_da,
            'caricato_da_user': media.caricato_da_user,
            'created_at': media.created_at.isoformat()
        })

    return jsonify({'media': media_data}), 200


@repository_bp.route('/sponsors/<int:sponsor_id>/media', methods=['GET'])
@jwt_required()
def get_media(sponsor_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Verifica permessi
    sponsor = Sponsor.query.get(sponsor_id)
    if not sponsor:
        return jsonify({'error': 'Sponsor non trovato'}), 404

    if role == 'club' and sponsor.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and sponsor_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri opzionali
    tipo = request.args.get('tipo')
    tags = request.args.get('tags')

    query = Media.query.filter_by(sponsor_id=sponsor_id)
    if tipo:
        query = query.filter_by(tipo=tipo)
    if tags:
        query = query.filter(Media.tags.like(f'%{tags}%'))

    media_list = query.order_by(Media.created_at.desc()).all()

    media_data = []
    for media in media_list:
        media_data.append({
            'id': media.id,
            'tipo': media.tipo,
            'nome': media.nome,
            'file_url': media.file_url,
            'thumbnail_url': media.thumbnail_url,
            'file_size': media.file_size,
            'tags': media.tags,
            'descrizione': media.descrizione,
            'caricato_da': media.caricato_da,
            'caricato_da_user': media.caricato_da_user,
            'created_at': media.created_at.isoformat()
        })

    return jsonify({'media': media_data}), 200


# DELETE - Elimina media
@repository_bp.route('/media/<int:media_id>', methods=['DELETE'])
@jwt_required()
def delete_media(media_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    media = Media.query.get(media_id)
    if not media:
        return jsonify({'error': 'Media non trovato'}), 404

    # Solo chi ha caricato può eliminare
    if role == 'club' and (media.club_id != user_id or media.caricato_da != 'club'):
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    if role == 'sponsor' and (media.sponsor_id != user_id or media.caricato_da != 'sponsor'):
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(media)
    db.session.commit()

    return jsonify({'message': 'Media eliminato con successo'}), 200
