"""
Route per press area social - stile Instagram
- Club e Sponsor possono pubblicare post
- Feed unificato: Club vede post suoi + di tutti sponsor
- Feed unificato: Sponsor vede post del club + di tutti sponsor del club
- Sistema like e commenti
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import PressPublication, PressReaction, PressComment, PressView, Club, Sponsor, HeadOfTerms
from datetime import datetime
from sqlalchemy import or_, and_, func

press_bp = Blueprint('press', __name__)


def get_current_user():
    """Restituisce (role, user_id, user_name) dell'utente corrente"""
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role == 'club':
        club = Club.query.get(user_id)
        user_name = club.nome if club else f'Club {user_id}'
        return ('club', user_id, user_name, club)
    elif role == 'sponsor':
        sponsor = Sponsor.query.get(user_id)
        user_name = sponsor.ragione_sociale if sponsor else f'Sponsor {user_id}'
        return ('sponsor', user_id, user_name, sponsor)
    else:
        return (None, None, None, None)


def get_sponsor_club_id(sponsor_id):
    """Ottiene il club_id dello sponsor attraverso il primo contratto"""
    contract = HeadOfTerms.query.filter_by(sponsor_id=sponsor_id).first()
    return contract.club_id if contract else None


# ==================== FEED UNIFICATO ====================

@press_bp.route('/press-feed', methods=['GET'])
@jwt_required()
def get_unified_feed():
    """
    Feed unificato Pitch Community
    - visibility='interna': Club vede suoi post + sponsor del club
    - visibility='community': Tutti vedono post di TUTTA la piattaforma Pitch Partner
    """
    try:
        role, user_id, user_name, user_obj = get_current_user()

        if not role:
            return jsonify({'error': 'Accesso negato'}), 403

        # Filtri opzionali
        tipo = request.args.get('tipo')
        categoria = request.args.get('categoria')
        hashtag = request.args.get('hashtag')

        if role == 'club':
            # CLUB: Vede i suoi post + post di tutti i suoi sponsor (interna) + post community
            sponsor_ids = db.session.query(Sponsor.id).join(HeadOfTerms).filter(
                HeadOfTerms.club_id == user_id
            ).all()
            sponsor_ids = [s[0] for s in sponsor_ids]

            # Query: (post interni del club+sponsor) OR (post community di tutti)
            query = PressPublication.query.filter(
                or_(
                    # Post interni: miei + miei sponsor
                    and_(
                        PressPublication.visibility == 'interna',
                        or_(
                            and_(PressPublication.author_type == 'club', PressPublication.author_id == user_id),
                            and_(PressPublication.author_type == 'sponsor', PressPublication.author_id.in_(sponsor_ids))
                        )
                    ),
                    # Post community: tutti
                    PressPublication.visibility == 'community'
                )
            ).filter_by(pubblicato=True)

        else:  # sponsor
            # SPONSOR: Vede post del club + sponsor del club (interna) + post community
            club_id = get_sponsor_club_id(user_id)

            if not club_id:
                # Se sponsor senza club, vede solo community
                query = PressPublication.query.filter_by(visibility='community', pubblicato=True)
            else:
                sponsor_ids = db.session.query(Sponsor.id).join(HeadOfTerms).filter(
                    HeadOfTerms.club_id == club_id
                ).all()
                sponsor_ids = [s[0] for s in sponsor_ids]

                # Query: (post interni del club+sponsor) OR (post community di tutti)
                query = PressPublication.query.filter(
                    or_(
                        # Post interni: club + sponsor del club
                        and_(
                            PressPublication.visibility == 'interna',
                            or_(
                                and_(PressPublication.author_type == 'club', PressPublication.author_id == club_id),
                                and_(PressPublication.author_type == 'sponsor', PressPublication.author_id.in_(sponsor_ids))
                            )
                        ),
                        # Post community: tutti
                        PressPublication.visibility == 'community'
                    )
                ).filter_by(pubblicato=True)

        # Applica filtri
        if tipo:
            query = query.filter_by(tipo=tipo)
        if categoria:
            query = query.filter_by(categoria=categoria)
        if hashtag:
            # Filtra per hashtag specifico
            query = query.filter(PressPublication.hashtags.contains([hashtag]))

        # Ordina per data pubblicazione
        publications = query.order_by(PressPublication.data_pubblicazione.desc()).all()

        # Formatta risultati
        result = []
        for p in publications:
            # Conta likes
            likes_count = PressReaction.query.filter_by(publication_id=p.id, tipo_reazione='like').count()

            # Verifica se l'utente corrente ha messo like
            user_liked = PressReaction.query.filter_by(
                publication_id=p.id,
                user_type=role,
                user_id=user_id,
                tipo_reazione='like'
            ).first() is not None

            # Conta commenti
            comments_count = PressComment.query.filter_by(publication_id=p.id).count()

            # Recupera logo del club se l'autore è un club
            club_logo_url = None
            if p.author_type == 'club':
                club = Club.query.get(p.author_id)
                if club:
                    club_logo_url = club.logo_url

            result.append({
                'id': p.id,
                'author_type': p.author_type,
                'author_id': p.author_id,
                'author_name': p.author_name,
                'club_logo_url': club_logo_url,
                'tipo': p.tipo,
                'titolo': p.titolo,
                'sottotitolo': p.sottotitolo,
                'testo': p.testo,
                'data_pubblicazione': p.data_pubblicazione.isoformat(),
                'fonte_testata': p.fonte_testata,
                'link_esterno': p.link_esterno,
                'categoria': p.categoria,
                'media_urls': p.media_urls or [],
                'documento_pdf_url': p.documento_pdf_url,
                'hashtags': p.hashtags or [],
                'mentioned_user_ids': p.mentioned_user_ids or [],
                'visibility': p.visibility,
                'likes_count': likes_count,
                'user_liked': user_liked,
                'comments_count': comments_count,
                'pubblicato': p.pubblicato,
                'created_at': p.created_at.isoformat()
            })

        return jsonify({'publications': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== CREAZIONE POST ====================

@press_bp.route('/press-publications', methods=['POST'])
@jwt_required()
def create_publication():
    """Crea nuovo post (club o sponsor)"""
    try:
        role, user_id, user_name, user_obj = get_current_user()

        if not role or role not in ['club', 'sponsor']:
            return jsonify({'error': 'Accesso negato'}), 403

        data = request.get_json()

        import sys
        print('=== BACKEND: RICEVUTO DATI ===', file=sys.stderr, flush=True)
        print(f'Titolo: {data.get("titolo")}', file=sys.stderr, flush=True)
        print(f'Media URLs: {data.get("media_urls")}', file=sys.stderr, flush=True)
        print(f'Numero media URLs: {len(data.get("media_urls", []))}', file=sys.stderr, flush=True)

        # Validazione
        if not data.get('tipo') or not data.get('titolo') or not data.get('testo'):
            return jsonify({'error': 'Campi obbligatori: tipo, titolo, testo'}), 400

        # INSTAGRAM STYLE: Almeno un'immagine obbligatoria
        media_urls = data.get('media_urls', [])
        if not media_urls or len(media_urls) == 0:
            return jsonify({'error': 'Almeno un\'immagine è obbligatoria per creare un post'}), 400

        # Data pubblicazione
        data_pub = data.get('data_pubblicazione')
        if data_pub:
            data_pub = datetime.fromisoformat(data_pub.replace('Z', '+00:00'))
        else:
            data_pub = datetime.utcnow()

        # Determina club_id e sponsor_id
        club_id = user_id if role == 'club' else None
        sponsor_id = user_id if role == 'sponsor' else None

        # Se sponsor, trova il club_id
        if role == 'sponsor':
            club_id = get_sponsor_club_id(user_id)

        publication = PressPublication(
            author_type=role,
            author_id=user_id,
            author_name=user_name,
            club_id=club_id,
            sponsor_id=sponsor_id,
            tipo=data['tipo'],
            titolo=data['titolo'],
            sottotitolo=data.get('sottotitolo'),
            testo=data['testo'],
            data_pubblicazione=data_pub,
            fonte_testata=data.get('fonte_testata'),
            link_esterno=data.get('link_esterno'),
            categoria=data.get('categoria'),
            media_urls=data.get('media_urls', []),
            documento_pdf_url=data.get('documento_pdf_url'),
            hashtags=data.get('hashtags', []),
            mentioned_user_ids=data.get('mentioned_user_ids', []),
            visibility=data.get('visibility', 'interna'),  # Default: interna
            creato_da_user_id=user_id,
            creato_da_nome=user_name,
            pubblicato=data.get('pubblicato', True),
            visibile_tutti_sponsor=True  # Default per post social
        )

        db.session.add(publication)
        db.session.commit()

        return jsonify({
            'message': 'Post creato con successo',
            'publication': {
                'id': publication.id,
                'author_type': publication.author_type,
                'author_name': publication.author_name,
                'tipo': publication.tipo,
                'titolo': publication.titolo,
                'data_pubblicazione': publication.data_pubblicazione.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== DETTAGLIO POST ====================

@press_bp.route('/press-publications/<int:pub_id>', methods=['GET'])
@jwt_required()
def get_publication_detail(pub_id):
    """Dettaglio singolo post con commenti"""
    try:
        role, user_id, user_name, user_obj = get_current_user()

        publication = PressPublication.query.get(pub_id)
        if not publication:
            return jsonify({'error': 'Post non trovato'}), 404

        # Likes
        likes_count = PressReaction.query.filter_by(publication_id=pub_id, tipo_reazione='like').count()
        user_liked = PressReaction.query.filter_by(
            publication_id=pub_id,
            user_type=role,
            user_id=user_id,
            tipo_reazione='like'
        ).first() is not None

        # Commenti top-level
        top_comments = PressComment.query.filter_by(
            publication_id=pub_id,
            parent_comment_id=None
        ).order_by(PressComment.created_at.desc()).all()

        def format_comment(comment):
            return {
                'id': comment.id,
                'user_type': comment.user_type,
                'user_name': comment.user_name,
                'testo': comment.testo,
                'parent_comment_id': comment.parent_comment_id,
                'replies': [format_comment(r) for r in comment.replies],
                'created_at': comment.created_at.isoformat()
            }

        # Recupera logo del club se l'autore è un club
        club_logo_url = None
        if publication.author_type == 'club':
            club = Club.query.get(publication.author_id)
            if club:
                club_logo_url = club.logo_url

        return jsonify({
            'publication': {
                'id': publication.id,
                'author_type': publication.author_type,
                'author_id': publication.author_id,
                'author_name': publication.author_name,
                'club_logo_url': club_logo_url,
                'tipo': publication.tipo,
                'titolo': publication.titolo,
                'sottotitolo': publication.sottotitolo,
                'testo': publication.testo,
                'data_pubblicazione': publication.data_pubblicazione.isoformat(),
                'fonte_testata': publication.fonte_testata,
                'link_esterno': publication.link_esterno,
                'categoria': publication.categoria,
                'media_urls': publication.media_urls or [],
                'documento_pdf_url': publication.documento_pdf_url,
                'hashtags': publication.hashtags or [],
                'mentioned_user_ids': publication.mentioned_user_ids or [],
                'visibility': publication.visibility,
                'pubblicato': publication.pubblicato,
                'likes_count': likes_count,
                'user_liked': user_liked,
                'comments': [format_comment(c) for c in top_comments],
                'created_at': publication.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== MODIFICA/ELIMINA POST ====================

@press_bp.route('/press-publications/<int:pub_id>', methods=['PUT'])
@jwt_required()
def update_publication(pub_id):
    """Aggiorna post (solo autore)"""
    try:
        role, user_id, user_name, user_obj = get_current_user()

        publication = PressPublication.query.get(pub_id)
        if not publication:
            return jsonify({'error': 'Post non trovato'}), 404

        # Verifica ownership
        if publication.author_type != role or publication.author_id != user_id:
            return jsonify({'error': 'Non autorizzato'}), 403

        data = request.get_json()

        # Aggiorna campi
        if 'tipo' in data:
            publication.tipo = data['tipo']
        if 'titolo' in data:
            publication.titolo = data['titolo']
        if 'sottotitolo' in data:
            publication.sottotitolo = data['sottotitolo']
        if 'testo' in data:
            publication.testo = data['testo']
        if 'data_pubblicazione' in data:
            publication.data_pubblicazione = datetime.fromisoformat(data['data_pubblicazione'].replace('Z', '+00:00'))
        if 'fonte_testata' in data:
            publication.fonte_testata = data['fonte_testata']
        if 'link_esterno' in data:
            publication.link_esterno = data['link_esterno']
        if 'categoria' in data:
            publication.categoria = data['categoria']
        if 'media_urls' in data:
            publication.media_urls = data['media_urls']
        if 'documento_pdf_url' in data:
            publication.documento_pdf_url = data['documento_pdf_url']
        if 'hashtags' in data:
            publication.hashtags = data['hashtags']
        if 'mentioned_user_ids' in data:
            publication.mentioned_user_ids = data['mentioned_user_ids']
        if 'visibility' in data:
            publication.visibility = data['visibility']
        if 'pubblicato' in data:
            publication.pubblicato = data['pubblicato']

        publication.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'message': 'Post aggiornato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@press_bp.route('/press-publications/<int:pub_id>', methods=['DELETE'])
@jwt_required()
def delete_publication(pub_id):
    """
    Elimina post
    - Autore può eliminare il proprio post
    - Club può eliminare i post dei suoi sponsor
    """
    try:
        role, user_id, user_name, user_obj = get_current_user()

        publication = PressPublication.query.get(pub_id)
        if not publication:
            return jsonify({'error': 'Post non trovato'}), 404

        # Verifica permessi
        is_author = (publication.author_type == role and publication.author_id == user_id)
        is_club_owner = (role == 'club' and publication.club_id == user_id)

        if not is_author and not is_club_owner:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Elimina tutte le dipendenze (cascade dovrebbe farlo automaticamente)
        db.session.delete(publication)
        db.session.commit()

        return jsonify({'message': 'Post eliminato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== LIKE ====================

@press_bp.route('/press-publications/<int:pub_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(pub_id):
    """Toggle like su un post (club o sponsor)"""
    try:
        role, user_id, user_name, user_obj = get_current_user()

        publication = PressPublication.query.get(pub_id)
        if not publication:
            return jsonify({'error': 'Post non trovato'}), 404

        # Verifica se esiste già un like
        existing_like = PressReaction.query.filter_by(
            publication_id=pub_id,
            user_type=role,
            user_id=user_id
        ).first()

        if existing_like:
            # Rimuovi like
            db.session.delete(existing_like)
            publication.likes_count = max(0, publication.likes_count - 1)
            message = 'Like rimosso'
            liked = False
        else:
            # Aggiungi like
            # Determina sponsor_id o club_id
            sponsor_id = user_id if role == 'sponsor' else None
            club_id = user_id if role == 'club' else None

            like = PressReaction(
                publication_id=pub_id,
                user_type=role,
                user_id=user_id,
                user_name=user_name,
                sponsor_id=sponsor_id,
                club_id=club_id,
                tipo_reazione='like'
            )
            db.session.add(like)
            publication.likes_count += 1
            message = 'Like aggiunto'
            liked = True

        db.session.commit()

        return jsonify({
            'message': message,
            'liked': liked,
            'likes_count': publication.likes_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== COMMENTI ====================

@press_bp.route('/press-publications/<int:pub_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(pub_id):
    """Aggiungi commento a post (club o sponsor)"""
    try:
        role, user_id, user_name, user_obj = get_current_user()

        publication = PressPublication.query.get(pub_id)
        if not publication:
            return jsonify({'error': 'Post non trovato'}), 404

        data = request.get_json()
        testo = data.get('testo')
        parent_comment_id = data.get('parent_comment_id')

        if not testo:
            return jsonify({'error': 'Testo commento obbligatorio'}), 400

        # Verifica parent comment se specificato
        if parent_comment_id:
            parent = PressComment.query.get(parent_comment_id)
            if not parent or parent.publication_id != pub_id:
                return jsonify({'error': 'Commento parent non valido'}), 400

        comment = PressComment(
            publication_id=pub_id,
            user_type=role,
            user_id=user_id,
            user_name=user_name,
            testo=testo,
            parent_comment_id=parent_comment_id
        )

        db.session.add(comment)
        db.session.commit()

        return jsonify({
            'message': 'Commento aggiunto con successo',
            'comment': {
                'id': comment.id,
                'user_type': comment.user_type,
                'user_name': comment.user_name,
                'testo': comment.testo,
                'created_at': comment.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@press_bp.route('/press-comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Elimina commento (autore o club owner del post)"""
    try:
        role, user_id, user_name, user_obj = get_current_user()

        comment = PressComment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Commento non trovato'}), 404

        # Verifica autorizzazione
        is_author = (comment.user_type == role and comment.user_id == user_id)
        is_club_owner = (role == 'club' and comment.publication.club_id == user_id)

        if not is_author and not is_club_owner:
            return jsonify({'error': 'Non autorizzato'}), 403

        # Elimina anche tutte le reply (cascade dovrebbe farlo)
        db.session.delete(comment)
        db.session.commit()

        return jsonify({'message': 'Commento eliminato con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== STATISTICHE ====================

@press_bp.route('/press-stats', methods=['GET'])
@jwt_required()
def get_press_stats():
    """Statistiche press area per l'utente corrente"""
    try:
        role, user_id, user_name, user_obj = get_current_user()

        if role == 'club':
            # Stats per club
            my_posts = PressPublication.query.filter_by(author_type='club', author_id=user_id, pubblicato=True).count()
            my_likes = db.session.query(func.sum(PressPublication.likes_count)).filter_by(
                author_type='club', author_id=user_id
            ).scalar() or 0

            # Post degli sponsor
            sponsor_posts = db.session.query(func.count(PressPublication.id)).join(
                HeadOfTerms, PressPublication.sponsor_id == HeadOfTerms.sponsor_id
            ).filter(
                HeadOfTerms.club_id == user_id,
                PressPublication.author_type == 'sponsor'
            ).scalar() or 0

            return jsonify({
                'stats': {
                    'my_posts': my_posts,
                    'my_likes': my_likes,
                    'sponsor_posts': sponsor_posts
                }
            }), 200

        else:  # sponsor
            my_posts = PressPublication.query.filter_by(author_type='sponsor', author_id=user_id, pubblicato=True).count()
            my_likes = db.session.query(func.sum(PressPublication.likes_count)).filter_by(
                author_type='sponsor', author_id=user_id
            ).scalar() or 0

            return jsonify({
                'stats': {
                    'my_posts': my_posts,
                    'my_likes': my_likes
                }
            }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
