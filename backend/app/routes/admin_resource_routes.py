from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Resource, ResourceCategory, ResourceReview, ResourceCollection, ResourceView, ResourceBookmark, Admin
from datetime import datetime, date
from sqlalchemy import func, desc
from functools import wraps

bp = Blueprint('admin_resources', __name__, url_prefix='/api/admin/resources')


def admin_required(fn):
    """Decorator to require admin role"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Accesso riservato agli admin'}), 403

        # Get current admin
        admin_id = get_jwt_identity()
        current_admin = Admin.query.get(admin_id)
        if not current_admin:
            return jsonify({'error': 'Admin non trovato'}), 404

        return fn(current_admin=current_admin, *args, **kwargs)
    return wrapper


# ============================================
# CATEGORIES MANAGEMENT
# ============================================

@bp.route('/categories', methods=['GET'])
@admin_required
def get_categories(current_admin):
    """Get all resource categories"""
    categories = ResourceCategory.query.order_by(ResourceCategory.ordine, ResourceCategory.nome).all()

    result = []
    for cat in categories:
        result.append({
            'id': cat.id,
            'nome': cat.nome,
            'slug': cat.slug,
            'descrizione': cat.descrizione,
            'icona': cat.icona,
            'parent_id': cat.parent_id,
            'ordine': cat.ordine,
            'attiva': cat.attiva,
            'resource_count': len(cat.resources)
        })

    return jsonify({'categories': result}), 200


@bp.route('/categories', methods=['POST'])
@admin_required
def create_category(current_admin):
    """Create new resource category"""
    data = request.get_json()

    if not data.get('nome') or not data.get('slug'):
        return jsonify({'error': 'Nome e slug obbligatori'}), 400

    # Check unique slug
    if ResourceCategory.query.filter_by(slug=data['slug']).first():
        return jsonify({'error': 'Slug già esistente'}), 400

    category = ResourceCategory(
        nome=data['nome'],
        slug=data['slug'],
        descrizione=data.get('descrizione'),
        icona=data.get('icona'),
        parent_id=data.get('parent_id'),
        ordine=data.get('ordine', 0),
        attiva=data.get('attiva', True)
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({'message': 'Categoria creata', 'category_id': category.id}), 201


@bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(current_admin, category_id):
    """Update resource category"""
    category = ResourceCategory.query.get_or_404(category_id)
    data = request.get_json()

    # Check unique slug if changed
    if data.get('slug') and data['slug'] != category.slug:
        if ResourceCategory.query.filter_by(slug=data['slug']).first():
            return jsonify({'error': 'Slug già esistente'}), 400

    category.nome = data.get('nome', category.nome)
    category.slug = data.get('slug', category.slug)
    category.descrizione = data.get('descrizione', category.descrizione)
    category.icona = data.get('icona', category.icona)
    category.parent_id = data.get('parent_id', category.parent_id)
    category.ordine = data.get('ordine', category.ordine)
    category.attiva = data.get('attiva', category.attiva)

    db.session.commit()

    return jsonify({'message': 'Categoria aggiornata'}), 200


@bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(current_admin, category_id):
    """Delete resource category"""
    category = ResourceCategory.query.get_or_404(category_id)

    # Check if has resources
    if category.resources:
        return jsonify({'error': f'Categoria ha {len(category.resources)} risorse associate'}), 400

    db.session.delete(category)
    db.session.commit()

    return jsonify({'message': 'Categoria eliminata'}), 200


# ============================================
# RESOURCES MANAGEMENT
# ============================================

@bp.route('', methods=['GET'])
@admin_required
def get_all_resources(current_admin):
    """Get all resources with filters for admin"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Resource.query

    # Filters
    if request.args.get('category_id'):
        query = query.filter_by(category_id=request.args.get('category_id', type=int))

    if request.args.get('tipo_risorsa'):
        query = query.filter_by(tipo_risorsa=request.args.get('tipo_risorsa'))

    if request.args.get('visibilita'):
        query = query.filter_by(visibilita=request.args.get('visibilita'))

    if request.args.get('pubblicata') is not None:
        pubblicata = request.args.get('pubblicata').lower() == 'true'
        query = query.filter_by(pubblicata=pubblicata)

    if request.args.get('search'):
        search = f"%{request.args.get('search')}%"
        query = query.filter(
            db.or_(
                Resource.titolo.ilike(search),
                Resource.descrizione.ilike(search),
                Resource.autore.ilike(search)
            )
        )

    # Sort
    sort_by = request.args.get('sort', 'created_at')
    if sort_by == 'views':
        query = query.order_by(desc(Resource.views_count))
    elif sort_by == 'downloads':
        query = query.order_by(desc(Resource.downloads_count))
    elif sort_by == 'rating':
        query = query.order_by(desc(Resource.avg_rating))
    else:
        query = query.order_by(desc(Resource.created_at))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    resources = []
    for r in pagination.items:
        resources.append({
            'id': r.id,
            'titolo': r.titolo,
            'slug': r.slug,
            'descrizione': r.descrizione,
            'tipo_risorsa': r.tipo_risorsa,
            'category': {'id': r.category.id, 'nome': r.category.nome} if r.category else None,
            'tags': r.tags or [],
            'settori': r.settori or [],
            'file_url': r.file_url,
            'file_tipo': r.file_tipo,
            'file_size_kb': r.file_size_kb,
            'link_esterno': r.link_esterno,
            'anteprima_url': r.anteprima_url,
            'autore': r.autore,
            'fonte': r.fonte,
            'data_pubblicazione': r.data_pubblicazione.isoformat() if r.data_pubblicazione else None,
            'visibilita': r.visibilita,
            'richiede_registrazione': r.richiede_registrazione,
            'views_count': r.views_count,
            'downloads_count': r.downloads_count,
            'bookmarks_count': r.bookmarks_count,
            'avg_rating': r.avg_rating,
            'reviews_count': r.reviews_count,
            'in_evidenza': r.in_evidenza,
            'consigliata': r.consigliata,
            'pubblicata': r.pubblicata,
            'created_at': r.created_at.isoformat(),
            'updated_at': r.updated_at.isoformat() if r.updated_at else None
        })

    return jsonify({
        'resources': resources,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    }), 200


@bp.route('/<int:resource_id>', methods=['GET'])
@admin_required
def get_resource_detail(current_admin, resource_id):
    """Get resource detail for admin"""
    resource = Resource.query.get_or_404(resource_id)

    return jsonify({
        'resource': {
            'id': resource.id,
            'titolo': resource.titolo,
            'slug': resource.slug,
            'descrizione': resource.descrizione,
            'tipo_risorsa': resource.tipo_risorsa,
            'category_id': resource.category_id,
            'category': {'id': resource.category.id, 'nome': resource.category.nome} if resource.category else None,
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
            'visibilita': resource.visibilita,
            'richiede_registrazione': resource.richiede_registrazione,
            'views_count': resource.views_count,
            'downloads_count': resource.downloads_count,
            'bookmarks_count': resource.bookmarks_count,
            'avg_rating': resource.avg_rating,
            'reviews_count': resource.reviews_count,
            'in_evidenza': resource.in_evidenza,
            'consigliata': resource.consigliata,
            'pubblicata': resource.pubblicata,
            'created_at': resource.created_at.isoformat(),
            'updated_at': resource.updated_at.isoformat() if resource.updated_at else None,
            'created_by_admin_id': resource.created_by_admin_id
        }
    }), 200


@bp.route('', methods=['POST'])
@admin_required
def create_resource(current_admin):
    """Create new resource"""
    data = request.get_json()

    if not data.get('titolo') or not data.get('tipo_risorsa') or not data.get('category_id'):
        return jsonify({'error': 'Titolo, tipo risorsa e categoria obbligatori'}), 400

    # Generate slug
    slug = data.get('slug')
    if not slug:
        slug = data['titolo'].lower().replace(' ', '-')[:100]
        # Make unique
        base_slug = slug
        counter = 1
        while Resource.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
    else:
        if Resource.query.filter_by(slug=slug).first():
            return jsonify({'error': 'Slug già esistente'}), 400

    # Parse data_pubblicazione
    data_pub = None
    if data.get('data_pubblicazione'):
        try:
            data_pub = datetime.fromisoformat(data['data_pubblicazione']).date()
        except:
            data_pub = None

    resource = Resource(
        titolo=data['titolo'],
        slug=slug,
        descrizione=data.get('descrizione'),
        tipo_risorsa=data['tipo_risorsa'],
        category_id=data['category_id'],
        tags=data.get('tags', []),
        settori=data.get('settori', []),
        file_url=data.get('file_url'),
        file_tipo=data.get('file_tipo'),
        file_size_kb=data.get('file_size_kb'),
        link_esterno=data.get('link_esterno'),
        anteprima_url=data.get('anteprima_url'),
        autore=data.get('autore'),
        fonte=data.get('fonte'),
        data_pubblicazione=data_pub,
        visibilita=data.get('visibilita', 'public'),
        richiede_registrazione=data.get('richiede_registrazione', False),
        in_evidenza=data.get('in_evidenza', False),
        consigliata=data.get('consigliata', False),
        pubblicata=data.get('pubblicata', True),
        created_by_admin_id=current_admin.id
    )

    db.session.add(resource)
    db.session.commit()

    return jsonify({'message': 'Risorsa creata', 'resource_id': resource.id}), 201


@bp.route('/<int:resource_id>', methods=['PUT'])
@admin_required
def update_resource(current_admin, resource_id):
    """Update resource"""
    resource = Resource.query.get_or_404(resource_id)
    data = request.get_json()

    # Check unique slug if changed
    if data.get('slug') and data['slug'] != resource.slug:
        if Resource.query.filter_by(slug=data['slug']).first():
            return jsonify({'error': 'Slug già esistente'}), 400

    # Parse data_pubblicazione
    if data.get('data_pubblicazione'):
        try:
            data['data_pubblicazione'] = datetime.fromisoformat(data['data_pubblicazione']).date()
        except:
            pass

    # Update fields
    for field in ['titolo', 'slug', 'descrizione', 'tipo_risorsa', 'category_id', 'tags', 'settori',
                  'file_url', 'file_tipo', 'file_size_kb', 'link_esterno', 'anteprima_url',
                  'autore', 'fonte', 'data_pubblicazione', 'visibilita', 'richiede_registrazione',
                  'in_evidenza', 'consigliata', 'pubblicata']:
        if field in data:
            setattr(resource, field, data[field])

    resource.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Risorsa aggiornata'}), 200


@bp.route('/<int:resource_id>', methods=['DELETE'])
@admin_required
def delete_resource(current_admin, resource_id):
    """Delete resource"""
    resource = Resource.query.get_or_404(resource_id)

    db.session.delete(resource)
    db.session.commit()

    return jsonify({'message': 'Risorsa eliminata'}), 200


# ============================================
# REVIEWS MODERATION
# ============================================

@bp.route('/reviews', methods=['GET'])
@admin_required
def get_all_reviews(current_admin):
    """Get all reviews for moderation"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = ResourceReview.query

    # Filters
    if request.args.get('approvata') is not None:
        approvata = request.args.get('approvata').lower() == 'true'
        query = query.filter_by(approvata=approvata)

    if request.args.get('resource_id'):
        query = query.filter_by(resource_id=request.args.get('resource_id', type=int))

    query = query.order_by(desc(ResourceReview.created_at))
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    reviews = []
    for r in pagination.items:
        reviews.append({
            'id': r.id,
            'resource_id': r.resource_id,
            'resource_titolo': r.resource.titolo if r.resource else None,
            'user_type': r.user_type,
            'user_id': r.user_id,
            'rating': r.rating,
            'titolo': r.titolo,
            'commento': r.commento,
            'helpful_count': r.helpful_count,
            'approvata': r.approvata,
            'moderata': r.moderata,
            'motivo_rifiuto': r.motivo_rifiuto,
            'created_at': r.created_at.isoformat()
        })

    return jsonify({
        'reviews': reviews,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@bp.route('/reviews/<int:review_id>/approve', methods=['POST'])
@admin_required
def approve_review(current_admin, review_id):
    """Approve a review"""
    review = ResourceReview.query.get_or_404(review_id)

    review.approvata = True
    review.moderata = True
    review.motivo_rifiuto = None
    db.session.commit()

    # Recalculate resource avg_rating
    recalculate_resource_rating(review.resource_id)

    return jsonify({'message': 'Review approvata'}), 200


@bp.route('/reviews/<int:review_id>/reject', methods=['POST'])
@admin_required
def reject_review(current_admin, review_id):
    """Reject a review"""
    review = ResourceReview.query.get_or_404(review_id)
    data = request.get_json()

    review.approvata = False
    review.moderata = True
    review.motivo_rifiuto = data.get('motivo_rifiuto', 'Contenuto non appropriato')
    db.session.commit()

    # Recalculate resource avg_rating
    recalculate_resource_rating(review.resource_id)

    return jsonify({'message': 'Review rifiutata'}), 200


@bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@admin_required
def delete_review(current_admin, review_id):
    """Delete a review"""
    review = ResourceReview.query.get_or_404(review_id)
    resource_id = review.resource_id

    db.session.delete(review)
    db.session.commit()

    # Recalculate resource stats
    recalculate_resource_rating(resource_id)

    return jsonify({'message': 'Review eliminata'}), 200


# ============================================
# ANALYTICS
# ============================================

@bp.route('/analytics/overview', methods=['GET'])
@admin_required
def get_analytics_overview(current_admin):
    """Get overall analytics"""

    total_resources = Resource.query.filter_by(pubblicata=True).count()
    total_views = db.session.query(func.sum(Resource.views_count)).scalar() or 0
    total_downloads = db.session.query(func.sum(Resource.downloads_count)).scalar() or 0
    total_bookmarks = ResourceBookmark.query.count()
    total_reviews = ResourceReview.query.filter_by(approvata=True).count()
    avg_rating_overall = db.session.query(func.avg(Resource.avg_rating)).filter(Resource.avg_rating > 0).scalar() or 0

    # Top resources by views
    top_viewed = Resource.query.filter_by(pubblicata=True).order_by(desc(Resource.views_count)).limit(10).all()
    top_viewed_list = [{'id': r.id, 'titolo': r.titolo, 'views': r.views_count} for r in top_viewed]

    # Top resources by downloads
    top_downloaded = Resource.query.filter_by(pubblicata=True).order_by(desc(Resource.downloads_count)).limit(10).all()
    top_downloaded_list = [{'id': r.id, 'titolo': r.titolo, 'downloads': r.downloads_count} for r in top_downloaded]

    # Top resources by rating
    top_rated = Resource.query.filter(Resource.pubblicata == True, Resource.avg_rating > 0).order_by(desc(Resource.avg_rating)).limit(10).all()
    top_rated_list = [{'id': r.id, 'titolo': r.titolo, 'rating': r.avg_rating, 'reviews': r.reviews_count} for r in top_rated]

    # Resources by category
    categories_stats = db.session.query(
        ResourceCategory.nome,
        func.count(Resource.id).label('count')
    ).join(Resource).filter(Resource.pubblicata == True).group_by(ResourceCategory.nome).all()

    categories_list = [{'nome': cat, 'count': count} for cat, count in categories_stats]

    # Resources by type
    types_stats = db.session.query(
        Resource.tipo_risorsa,
        func.count(Resource.id).label('count')
    ).filter(Resource.pubblicata == True).group_by(Resource.tipo_risorsa).all()

    types_list = [{'tipo': tipo, 'count': count} for tipo, count in types_stats]

    return jsonify({
        'overview': {
            'total_resources': total_resources,
            'total_views': int(total_views),
            'total_downloads': int(total_downloads),
            'total_bookmarks': total_bookmarks,
            'total_reviews': total_reviews,
            'avg_rating_overall': round(float(avg_rating_overall), 2)
        },
        'top_viewed': top_viewed_list,
        'top_downloaded': top_downloaded_list,
        'top_rated': top_rated_list,
        'by_category': categories_list,
        'by_type': types_list
    }), 200


@bp.route('/<int:resource_id>/analytics', methods=['GET'])
@admin_required
def get_resource_analytics(current_admin, resource_id):
    """Get analytics for specific resource"""
    resource = Resource.query.get_or_404(resource_id)

    # Views over time (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    views_by_day = db.session.query(
        func.date(ResourceView.created_at).label('date'),
        func.count(ResourceView.id).label('count')
    ).filter(
        ResourceView.resource_id == resource_id,
        ResourceView.tipo_azione == 'view',
        ResourceView.created_at >= thirty_days_ago
    ).group_by(func.date(ResourceView.created_at)).all()

    downloads_by_day = db.session.query(
        func.date(ResourceView.created_at).label('date'),
        func.count(ResourceView.id).label('count')
    ).filter(
        ResourceView.resource_id == resource_id,
        ResourceView.tipo_azione == 'download',
        ResourceView.created_at >= thirty_days_ago
    ).group_by(func.date(ResourceView.created_at)).all()

    # Rating distribution
    rating_dist = db.session.query(
        ResourceReview.rating,
        func.count(ResourceReview.id).label('count')
    ).filter(
        ResourceReview.resource_id == resource_id,
        ResourceReview.approvata == True
    ).group_by(ResourceReview.rating).all()

    return jsonify({
        'resource': {
            'id': resource.id,
            'titolo': resource.titolo
        },
        'stats': {
            'views': resource.views_count,
            'downloads': resource.downloads_count,
            'bookmarks': resource.bookmarks_count,
            'reviews': resource.reviews_count,
            'avg_rating': resource.avg_rating
        },
        'views_by_day': [{'date': str(d), 'count': c} for d, c in views_by_day],
        'downloads_by_day': [{'date': str(d), 'count': c} for d, c in downloads_by_day],
        'rating_distribution': [{'rating': r, 'count': c} for r, c in rating_dist]
    }), 200


# ============================================
# HELPER FUNCTIONS
# ============================================

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
