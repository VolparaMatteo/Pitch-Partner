import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pressAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import ImageCarousel from '../components/ImageCarousel';
import Toast from '../components/Toast';
import '../styles/post-detail.css';
import '../styles/dashboard-new.css';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user || !['club', 'sponsor'].includes(user.role)) {
      navigate('/');
      return;
    }
    fetchPost();
    // eslint-disable-next-line
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await pressAPI.getPublication(id);
      setPost(res.data.publication);
    } catch (error) {
      console.error('Errore caricamento post:', error);
      setToast({ message: 'Errore nel caricamento del post', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!post) return;

    try {
      const res = await pressAPI.toggleLike(post.id);
      setPost({
        ...post,
        user_liked: res.data.liked,
        likes_count: res.data.likes_count
      });
    } catch (error) {
      console.error('Errore like:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await pressAPI.addComment(post.id, { testo: commentText });
      setCommentText('');
      fetchPost(); // Ricarica per mostrare il nuovo commento
      setToast({ message: 'Commento aggiunto!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Errore nell\'invio del commento', type: 'error' });
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questo post?')) return;

    try {
      await pressAPI.deletePublication(post.id);
      setToast({ message: 'Post eliminato con successo', type: 'success' });
      setTimeout(() => navigate('/press-feed'), 1500);
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore nell\'eliminazione', type: 'error' });
    }
  };

  const getAuthorIcon = (authorType) => {
    // Se è un club e abbiamo il logo, mostra il logo
    if (authorType === 'club' && post && post.club_logo_url) {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';
      const logoUrl = post.club_logo_url.startsWith('http')
        ? post.club_logo_url
        : `${API_URL.replace('/api', '')}${post.club_logo_url}`;

      return (
        <img
          src={logoUrl}
          alt="Club Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '4px'
          }}
        />
      );
    }

    // Fallback alle emoji
    return authorType === 'club' ? '🏟️' : '💼';
  };

  const getVisibilityBadge = (visibility) => {
    return visibility === 'community' ? (
      <span className="visibility-badge community">🌍 Pitch Community</span>
    ) : (
      <span className="visibility-badge internal">🔒 Interna</span>
    );
  };

  const canDelete = () => {
    if (!post || !user) return false;
    return (
      (user.role === 'club' && post.club_id === user.id) ||
      (post.author_type === user.role && post.author_id === user.id)
    );
  };

  if (loading) {
    return (
      <>
        <div className="post-detail-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <div className="post-detail-container">
          <div className="error-message">Post non trovato</div>
          <button onClick={() => navigate('/press-feed')} className="btn-back-to-feed">
            ← Torna al Feed
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="post-detail-container">
        <div className="post-detail-inner">
          {/* Back Button */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => navigate('/press-feed')}
              className="stat-btn"
              style={{ padding: '10px 20px' }}
            >
              ← Torna al Feed
            </button>
          </div>

          {/* Main Post Card */}
          <article className="post-detail-card">
            {/* LEFT COLUMN - Main Content */}
            <div className="post-main-content">
              {/* Header */}
              <header className="post-detail-header">
                <div className="author-section">
                  <div className="author-avatar-large">
                    {getAuthorIcon(post.author_type)}
                  </div>
                  <div className="author-info">
                    <h2 className="author-name">{post.author_name}</h2>
                    <p className="post-meta">
                      {new Date(post.data_pubblicazione).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="header-actions">
                  {getVisibilityBadge(post.visibility)}
                  {canDelete() && (
                    <button onClick={handleDeletePost} className="btn-delete" title="Elimina post">
                      🗑️
                    </button>
                  )}
                </div>
              </header>

              {/* Images Carousel */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="post-images-section">
                  <ImageCarousel images={post.media_urls} />
                </div>
              )}

              {/* Content */}
              <div className="post-detail-content">
                <h1 className="post-title">{post.titolo}</h1>
                {post.sottotitolo && (
                  <h2 className="post-subtitle">{post.sottotitolo}</h2>
                )}
                <div className="post-text">{post.testo}</div>

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="post-hashtags">
                    {post.hashtags.map((tag, idx) => (
                      <span key={idx} className="hashtag">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Categoria Badge */}
                {post.categoria && (
                  <div className="post-category">
                    <span className="category-badge">{post.categoria}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR - Engagement & Comments */}
            <aside className="post-sidebar">
              {/* Engagement Stats */}
              <div className="engagement-section">
                <div className="engagement-stats">
                  <span className="stat-item">
                    <span className="stat-icon">❤️</span>
                    <span className="stat-number">{post.likes_count || 0}</span>
                    <span className="stat-label">{post.likes_count === 1 ? 'Like' : 'Likes'}</span>
                  </span>
                  <span className="stat-divider">•</span>
                  <span className="stat-item">
                    <span className="stat-icon">💬</span>
                    <span className="stat-number">{post.comments_count || 0}</span>
                    <span className="stat-label">{(post.comments_count || 0) === 1 ? 'Commento' : 'Commenti'}</span>
                  </span>
                </div>

                <button
                  className={`btn-like-large ${post.user_liked ? 'liked' : ''}`}
                  onClick={handleToggleLike}
                >
                  {post.user_liked ? '❤️ Ti piace' : '🤍 Mi piace'}
                </button>
              </div>

              {/* Comments Section */}
              <div className="comments-section">
                <h3 className="comments-title">
                  💬 Commenti ({post.comments_count})
                </h3>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="comment-form">
                  <div className="comment-input-wrapper">
                    <div className="current-user-avatar">
                      {getAuthorIcon(user.role)}
                    </div>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Scrivi un commento..."
                      rows={3}
                      className="comment-input"
                    />
                  </div>
                  <div className="comment-form-actions">
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="btn-submit-comment"
                    >
                      💬 Pubblica
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="comments-list">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-avatar">
                          {getAuthorIcon(comment.user_type)}
                        </div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-author">{comment.user_name}</span>
                            <span className="comment-date">
                              {new Date(comment.created_at).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="comment-text">{comment.testo}</p>
                        </div>
                      </div>
                  ))
                ) : (
                  <div className="no-comments">
                    <span className="no-comments-icon">💭</span>
                    <p>Nessun commento ancora. Sii il primo a commentare!</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </article>
        </div>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </>
  );
}

export default PostDetail;
