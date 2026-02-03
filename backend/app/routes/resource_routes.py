from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Resource, ResourceCategory, ResourceReview, ResourceCollection, ResourceView, ResourceBookmark, Club, Sponsor
from datetime import datetime
from sqlalchemy import func, desc, or_
from functools import wraps

bp = Blueprint('resources', __name__, url_prefix='/api/resources')


def token_required(fn):
    """Decorator to require authentication (club or sponsor)"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        user_type = claims.get('role')  # 'club', 'sponsor', or 'admin'
        user_id = get_jwt_identity()

        # Get current user based on type
        current_user = None
        if user_type == 'club':
            current_user = Club.query.get(user_id)
        elif user_type == 'sponsor':
            current_user = Sponsor.query.get(user_id)
        elif user_type == 'admin':
            # Admin can access too
            from app.models import Admin
            current_user = Admin.query.get(user_id)

        if not current_user:
            return jsonify({'error': 'Utente non trovato'}), 404

        return fn(current_user=current_user, user_type=user_type, *args, **kwargs)
    return wrapper


# ============================================
# BROWSE & SEARCH
# ============================================

@bp.route('/categories', methods=['GET'])
def get_public_categories():
    """Get all active resource categories (public)"""
    categories = ResourceCategory.query.filter_by(attiva=True).order_by(
        ResourceCategory.ordine, ResourceCategory.nome
    ).all()

    result = []
    for cat in categories:
        # Count only published resources
        published_count = Resource.query.filter_by(
            category_id=cat.id,
            pubblicata=True
        ).count()

        result.append({
            'id': cat.id,
            'nome': cat.nome,
            'slug': cat.slug,
            'descrizione': cat.descrizione,
            'icona': cat.icona,
            'parent_id': cat.parent_id,
            'resource_count': published_count
        })

    return jsonify({'categories': result}), 200


@bp.route('', methods=['GET'])
@token_required
def browse_resources(current_user, user_type):
    """Browse resources with filters (accessible by Club and Sponsor)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Resource.query.filter_by(pubblicata=True)

    # Access control based on user type
    if user_type == 'sponsor':
        query = query.filter(
            or_(
                Resource.visibilita == 'public',
                Resource.visibilita == 'sponsor-only'
            )
        )
    elif user_type == 'club':
        query = query.filter(
            or_(
                Resource.visibilita == 'public',
                Resource.visibilita == 'club-only'
            )
        )
    else:
        # Admin sees all
        pass

    # Filters
    if request.args.get('category_id'):
        query = query.filter_by(category_id=request.args.get('category_id', type=int))

    if request.args.get('tipo_risorsa'):
        query = query.filter_by(tipo_risorsa=request.args.get('tipo_risorsa'))

    if request.args.get('tag'):
        tag = request.args.get('tag')
        query = query.filter(Resource.tags.contains([tag]))

    if request.args.get('settore'):
        settore = request.args.get('settore')
        query = query.filter(Resource.settori.contains([settore]))

    if request.args.get('search'):
        search = f"%{request.args.get('search')}%"
        query = query.filter(
            or_(
                Resource.titolo.ilike(search),
                Resource.descrizione.ilike(search),
                Resource.autore.ilike(search)
            )
        )

    # Featured/Recommended filters
    if request.args.get('in_evidenza') == 'true':
        query = query.filter_by(in_evidenza=True)

    if request.args.get('consigliata') == 'true':
        query = query.filter_by(consigliata=True)

    # Sort
    sort_by = request.args.get('sort', 'recent')
    if sort_by == 'popular':
        query = query.order_by(desc(Resource.views_count))
    elif sort_by == 'downloads':
        query = query.order_by(desc(Resource.downloads_count))
    elif sort_by == 'rating':
        query = query.order_by(desc(Resource.avg_rating))
    elif sort_by == 'recent':
        query = query.order_by(desc(Resource.created_at))
    else:
        query = query.order_by(desc(Resource.created_at))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    resources = []
    for r in pagination.items:
        # Check if user has bookmarked
        is_bookmarked = False
        if current_user:
            is_bookmarked = ResourceBookmark.query.filter_by(
                resource_id=r.id,
                user_type=user_type,
                user_id=current_user.id
            ).first() is not None

        resources.append({
            'id': r.id,
            'titolo': r.titolo,
            'slug': r.slug,
            'descrizione': r.descrizione,
            'tipo_risorsa': r.tipo_risorsa,
            'category': {'id': r.category.id, 'nome': r.category.nome, 'icona': r.category.icona} if r.category else None,
            'tags': r.tags or [],
            'settori': r.settori or [],
            'file_tipo': r.file_tipo,
            'file_size_kb': r.file_size_kb,
            'anteprima_url': r.anteprima_url,
            'autore': r.autore,
            'fonte': r.fonte,
            'data_pubblicazione': r.data_pubblicazione.isoformat() if r.data_pubblicazione else None,
            'views_count': r.views_count,
            'downloads_count': r.downloads_count,
            'bookmarks_count': r.bookmarks_count,
            'avg_rating': round(r.avg_rating, 1),
            'reviews_count': r.reviews_count,
            'in_evidenza': r.in_evidenza,
            'consigliata': r.consigliata,
            'is_bookmarked': is_bookmarked,
            'created_at': r.created_at.isoformat()
        })

    return jsonify({
        'resources': resources,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    }), 200


@bp.route('/<int:resource_id>', methods=['GET'])
@token_required
def get_resource(current_user, user_type, resource_id):
    """Get single resource detail"""
    resource = Resource.query.filter_by(id=resource_id, pubblicata=True).first()

    if not resource:
        return jsonify({'error': 'Risorsa non trovata'}), 404

    # Access control
    if resource.visibilita == 'sponsor-only' and user_type != 'sponsor' and user_type != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if resource.visibilita == 'club-only' and user_type != 'club' and user_type != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if resource.visibilita == 'premium':
        # TODO: check premium status
        pass

    # Track view
    track_resource_action(resource.id, user_type, current_user.id if current_user else None, 'view', request)

    # Check if bookmarked
    is_bookmarked = False
    if current_user:
        is_bookmarked = ResourceBookmark.query.filter_by(
            resource_id=resource.id,
            user_type=user_type,
            user_id=current_user.id
        ).first() is not None

    # Get approved reviews
    reviews = ResourceReview.query.filter_by(
        resource_id=resource.id,
        approvata=True
    ).order_by(desc(ResourceReview.created_at)).limit(10).all()

    reviews_list = []
    for rev in reviews:
        # Get reviewer name and logo
        reviewer_name = "Anonimo"
        reviewer_logo = None
        if rev.user_type == 'club':
            club = Club.query.get(rev.user_id)
            if club:
                reviewer_name = club.nome
                reviewer_logo = club.logo_url
            else:
                reviewer_name = "Club"
        elif rev.user_type == 'sponsor':
            sponsor = Sponsor.query.get(rev.user_id)
            if sponsor:
                reviewer_name = sponsor.ragione_sociale
                reviewer_logo = sponsor.logo_url
            else:
                reviewer_name = "Sponsor"

        reviews_list.append({
            'id': rev.id,
            'rating': rev.rating,
            'titolo': rev.titolo,
            'commento': rev.commento,
            'reviewer_name': reviewer_name,
            'reviewer_logo': reviewer_logo,
            'helpful_count': rev.helpful_count,
            'created_at': rev.created_at.isoformat()
        })

    return jsonify({
        'resource': {
            'id': resource.id,
            'titolo': resource.titolo,
            'slug': resource.slug,
            'descrizione': resource.descrizione,
            'tipo_risorsa': resource.tipo_risorsa,
            'category': {'id': resource.category.id, 'nome': resource.category.nome, 'icona': resource.category.icona} if resource.category else None,
            'tags': resource.tags or [],
            'settori': resource.settori or [],
            'file_url': resource.file_url,
            'file_tipo': resource.file_tipo,
            'file_size_kb': resource.file_size_kb,
            'link_esterno': resource.link_esterno,
            'anteprima_url': resource.anteprima_url,
            'autore': resource.autore,
            'fonte': resource.fonte,
            'data_pubblicazione': resource.data_pubblicazione.isoformat() if resource.data_pubblicazione else None,
            'views_count': resource.views_count,
            'downloads_count': resource.downloads_count,
            'bookmarks_count': resource.bookmarks_count,
            'avg_rating': round(resource.avg_rating, 1),
            'reviews_count': resource.reviews_count,
            'in_evidenza': resource.in_evidenza,
            'consigliata': resource.consigliata,
            'is_bookmarked': is_bookmarked,
            'created_at': resource.created_at.isoformat()
        },
        'reviews': reviews_list
    }), 200


@bp.route('/<int:resource_id>/download', methods=['POST'])
@token_required
def download_resource(current_user, user_type, resource_id):
    """Track download and return file URL"""
    resource = Resource.query.filter_by(id=resource_id, pubblicata=True).first()

    if not resource:
        return jsonify({'error': 'Risorsa non trovata'}), 404

    # Access control
    if resource.visibilita == 'sponsor-only' and user_type != 'sponsor' and user_type != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if resource.visibilita == 'club-only' and user_type != 'club' and user_type != 'admin':
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if not resource.file_url and not resource.link_esterno:
        return jsonify({'error': 'Nessun file disponibile per il download'}), 400

    # Track download
    track_resource_action(resource.id, user_type, current_user.id if current_user else None, 'download', request)

    download_url = resource.file_url or resource.link_esterno

    return jsonify({
        'download_url': download_url,
        'file_tipo': resource.file_tipo,
        'file_size_kb': resource.file_size_kb
    }), 200


# ============================================
# BOOKMARKS & COLLECTIONS
# ============================================

@bp.route('/<int:resource_id>/bookmark', methods=['POST'])
@token_required
def bookmark_resource(current_user, user_type, resource_id):
    """Bookmark a resource"""
    resource = Resource.query.filter_by(id=resource_id, pubblicata=True).first()

    if not resource:
        return jsonify({'error': 'Risorsa non trovata'}), 404

    # Check if already bookmarked
    existing = ResourceBookmark.query.filter_by(
        resource_id=resource_id,
        user_type=user_type,
        user_id=current_user.id
    ).first()

    if existing:
        return jsonify({'error': 'Risorsa già salvata'}), 400

    data = request.get_json() or {}

    bookmark = ResourceBookmark(
        resource_id=resource_id,
        user_type=user_type,
        user_id=current_user.id,
        collection_id=data.get('collection_id'),
        note_personali=data.get('note_personali')
    )

    db.session.add(bookmark)

    # Update resource bookmark count
    resource.bookmarks_count = ResourceBookmark.query.filter_by(resource_id=resource_id).count() + 1

    db.session.commit()

    return jsonify({'message': 'Risorsa salvata', 'bookmark_id': bookmark.id}), 201


@bp.route('/<int:resource_id>/unbookmark', methods=['DELETE'])
@token_required
def unbookmark_resource(current_user, user_type, resource_id):
    """Remove bookmark from a resource"""
    bookmark = ResourceBookmark.query.filter_by(
        resource_id=resource_id,
        user_type=user_type,
        user_id=current_user.id
    ).first()

    if not bookmark:
        return jsonify({'error': 'Bookmark non trovato'}), 404

    db.session.delete(bookmark)

    # Update resource bookmark count
    resource = Resource.query.get(resource_id)
    if resource:
        resource.bookmarks_count = ResourceBookmark.query.filter_by(resource_id=resource_id).count() - 1
        if resource.bookmarks_count < 0:
            resource.bookmarks_count = 0

    db.session.commit()

    return jsonify({'message': 'Bookmark rimosso'}), 200


@bp.route('/my-bookmarks', methods=['GET'])
@token_required
def get_my_bookmarks(current_user, user_type):
    """Get user's bookmarked resources"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = ResourceBookmark.query.filter_by(
        user_type=user_type,
        user_id=current_user.id
    )

    # Filter by collection
    if request.args.get('collection_id'):
        query = query.filter_by(collection_id=request.args.get('collection_id', type=int))

    query = query.order_by(desc(ResourceBookmark.created_at))
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    bookmarks = []
    for b in pagination.items:
        if b.resource and b.resource.pubblicata:
            bookmarks.append({
                'bookmark_id': b.id,
                'resource': {
                    'id': b.resource.id,
                    'titolo': b.resource.titolo,
                    'slug': b.resource.slug,
                    'descrizione': b.resource.descrizione,
                    'tipo_risorsa': b.resource.tipo_risorsa,
                    'category': {'id': b.resource.category.id, 'nome': b.resource.category.nome} if b.resource.category else None,
                    'anteprima_url': b.resource.anteprima_url,
                    'avg_rating': round(b.resource.avg_rating, 1)
                },
                'note_personali': b.note_personali,
                'collection_id': b.collection_id,
                'created_at': b.created_at.isoformat()
            })

    return jsonify({
        'bookmarks': bookmarks,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@bp.route('/collections', methods=['GET'])
@token_required
def get_my_collections(current_user, user_type):
    """Get user's collections"""
    collections = ResourceCollection.query.filter_by(
        owner_type=user_type,
        owner_id=current_user.id
    ).order_by(desc(ResourceCollection.created_at)).all()

    # Also get public collections created by admin
    public_collections = ResourceCollection.query.filter_by(
        owner_type='admin',
        pubblica=True
    ).order_by(desc(ResourceCollection.created_at)).all()

    result = []
    for c in collections:
        result.append({
            'id': c.id,
            'nome': c.nome,
            'descrizione': c.descrizione,
            'icona': c.icona,
            'pubblica': c.pubblica,
            'resources_count': len(c.bookmarks),
            'is_owner': True,
            'created_at': c.created_at.isoformat()
        })

    for c in public_collections:
        result.append({
            'id': c.id,
            'nome': c.nome,
            'descrizione': c.descrizione,
            'icona': c.icona,
            'pubblica': c.pubblica,
            'resources_count': len(c.bookmarks),
            'is_owner': False,
            'created_at': c.created_at.isoformat()
        })

    return jsonify({'collections': result}), 200


@bp.route('/collections', methods=['POST'])
@token_required
def create_collection(current_user, user_type):
    """Create a new collection"""
    data = request.get_json()

    if not data.get('nome'):
        return jsonify({'error': 'Nome collezione obbligatorio'}), 400

    collection = ResourceCollection(
        owner_type=user_type,
        owner_id=current_user.id,
        nome=data['nome'],
        descrizione=data.get('descrizione'),
        icona=data.get('icona'),
        pubblica=False  # User collections are always private
    )

    db.session.add(collection)
    db.session.commit()

    return jsonify({'message': 'Collezione creata', 'collection_id': collection.id}), 201


@bp.route('/collections/<int:collection_id>', methods=['PUT'])
@token_required
def update_collection(current_user, user_type, collection_id):
    """Update a collection"""
    collection = ResourceCollection.query.filter_by(
        id=collection_id,
        owner_type=user_type,
        owner_id=current_user.id
    ).first()

    if not collection:
        return jsonify({'error': 'Collezione non trovata'}), 404

    data = request.get_json()

    collection.nome = data.get('nome', collection.nome)
    collection.descrizione = data.get('descrizione', collection.descrizione)
    collection.icona = data.get('icona', collection.icona)

    db.session.commit()

    return jsonify({'message': 'Collezione aggiornata'}), 200


@bp.route('/collections/<int:collection_id>', methods=['DELETE'])
@token_required
def delete_collection(current_user, user_type, collection_id):
    """Delete a collection"""
    collection = ResourceCollection.query.filter_by(
        id=collection_id,
        owner_type=user_type,
        owner_id=current_user.id
    ).first()

    if not collection:
        return jsonify({'error': 'Collezione non trovata'}), 404

    # Remove collection_id from all bookmarks in this collection
    ResourceBookmark.query.filter_by(collection_id=collection_id).update({'collection_id': None})

    db.session.delete(collection)
    db.session.commit()

    return jsonify({'message': 'Collezione eliminata'}), 200


# ============================================
# REVIEWS
# ============================================

@bp.route('/<int:resource_id>/reviews', methods=['POST'])
@token_required
def create_review(current_user, user_type, resource_id):
    """Create a review for a resource"""
    resource = Resource.query.filter_by(id=resource_id, pubblicata=True).first()

    if not resource:
        return jsonify({'error': 'Risorsa non trovata'}), 404

    # Check if user already reviewed
    existing = ResourceReview.query.filter_by(
        resource_id=resource_id,
        user_type=user_type,
        user_id=current_user.id
    ).first()

    if existing:
        return jsonify({'error': 'Hai già recensito questa risorsa'}), 400

    data = request.get_json()

    if not data.get('rating') or data['rating'] < 1 or data['rating'] > 5:
        return jsonify({'error': 'Rating deve essere tra 1 e 5'}), 400

    review = ResourceReview(
        resource_id=resource_id,
        user_type=user_type,
        user_id=current_user.id,
        rating=data['rating'],
        titolo=data.get('titolo'),
        commento=data.get('commento'),
        approvata=True,  # Auto-approve by default
        moderata=True
    )

    db.session.add(review)
    db.session.commit()

    # Recalculate resource rating
    recalculate_resource_rating(resource_id)

    return jsonify({'message': 'Recensione pubblicata', 'review_id': review.id}), 201


@bp.route('/reviews/<int:review_id>', methods=['PUT'])
@token_required
def update_review(current_user, user_type, review_id):
    """Update own review"""
    review = ResourceReview.query.filter_by(
        id=review_id,
        user_type=user_type,
        user_id=current_user.id
    ).first()

    if not review:
        return jsonify({'error': 'Recensione non trovata'}), 404

    data = request.get_json()

    if data.get('rating') and (data['rating'] < 1 or data['rating'] > 5):
        return jsonify({'error': 'Rating deve essere tra 1 e 5'}), 400

    if 'rating' in data:
        review.rating = data['rating']
    if 'titolo' in data:
        review.titolo = data['titolo']
    if 'commento' in data:
        review.commento = data['commento']

    review.updated_at = datetime.utcnow()
    db.session.commit()

    # Recalculate resource rating
    recalculate_resource_rating(review.resource_id)

    return jsonify({'message': 'Recensione aggiornata'}), 200


@bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@token_required
def delete_review(current_user, user_type, review_id):
    """Delete own review"""
    review = ResourceReview.query.filter_by(
        id=review_id,
        user_type=user_type,
        user_id=current_user.id
    ).first()

    if not review:
        return jsonify({'error': 'Recensione non trovata'}), 404

    resource_id = review.resource_id

    db.session.delete(review)
    db.session.commit()

    # Recalculate resource rating
    recalculate_resource_rating(resource_id)

    return jsonify({'message': 'Recensione eliminata'}), 200


@bp.route('/reviews/<int:review_id>/helpful', methods=['POST'])
@token_required
def mark_review_helpful(current_user, user_type, review_id):
    """Mark a review as helpful"""
    review = ResourceReview.query.get_or_404(review_id)

    user_key = {'user_type': user_type, 'user_id': current_user.id}

    if not review.helpful_by:
        review.helpful_by = []

    # Check if already marked
    if user_key in review.helpful_by:
        return jsonify({'error': 'Già segnato come utile'}), 400

    review.helpful_by.append(user_key)
    review.helpful_count = len(review.helpful_by)

    db.session.commit()

    return jsonify({'message': 'Segnato come utile'}), 200


# ============================================
# MY ACTIVITY
# ============================================

@bp.route('/my-activity', methods=['GET'])
@token_required
def get_my_activity(current_user, user_type):
    """Get user's activity stats"""

    total_bookmarks = ResourceBookmark.query.filter_by(
        user_type=user_type,
        user_id=current_user.id
    ).count()

    total_reviews = ResourceReview.query.filter_by(
        user_type=user_type,
        user_id=current_user.id
    ).count()

    total_collections = ResourceCollection.query.filter_by(
        owner_type=user_type,
        owner_id=current_user.id
    ).count()

    # Recent views
    recent_views = ResourceView.query.filter_by(
        user_type=user_type,
        user_id=current_user.id,
        tipo_azione='view'
    ).order_by(desc(ResourceView.created_at)).limit(10).all()

    recent_resources = []
    seen_ids = set()
    for v in recent_views:
        if v.resource_id not in seen_ids and v.resource and v.resource.pubblicata:
            seen_ids.add(v.resource_id)
            recent_resources.append({
                'id': v.resource.id,
                'titolo': v.resource.titolo,
                'tipo_risorsa': v.resource.tipo_risorsa,
                'viewed_at': v.created_at.isoformat()
            })

    return jsonify({
        'stats': {
            'total_bookmarks': total_bookmarks,
            'total_reviews': total_reviews,
            'total_collections': total_collections
        },
        'recent_views': recent_resources
    }), 200


# ============================================
# HELPER FUNCTIONS
# ============================================

def track_resource_action(resource_id, user_type, user_id, action_type, request_obj):
    """Track a resource view or download"""
    resource = Resource.query.get(resource_id)
    if not resource:
        return

    # Create view record
    view = ResourceView(
        resource_id=resource_id,
        user_type=user_type,
        user_id=user_id,
        tipo_azione=action_type,
        ip_address=request_obj.remote_addr,
        user_agent=request_obj.headers.get('User-Agent', '')[:500]
    )

    db.session.add(view)

    # Update resource stats
    if action_type == 'view':
        resource.views_count += 1
    elif action_type == 'download':
        resource.downloads_count += 1

    db.session.commit()


def recalculate_resource_rating(resource_id):
    """Recalculate avg_rating and reviews_count for a resource"""
    resource = Resource.query.get(resource_id)
    if not resource:
        return

    approved_reviews = ResourceReview.query.filter_by(
        resource_id=resource_id,
        approvata=True
    ).all()

    if approved_reviews:
        resource.reviews_count = len(approved_reviews)
        resource.avg_rating = sum([r.rating for r in approved_reviews]) / len(approved_reviews)
    else:
        resource.reviews_count = 0
        resource.avg_rating = 0.0

    db.session.commit()
