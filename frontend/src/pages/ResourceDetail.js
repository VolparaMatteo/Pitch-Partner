import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resourceAPI, bookmarkAPI, reviewAPI } from '../services/resourceAPI';
import { getImageUrl } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import '../styles/dashboard-new.css';

function ResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, titolo: '', commento: '' });
  const [bookmarkForm, setBookmarkForm] = useState({ note_personali: '' });
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchResource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const res = await resourceAPI.getResourceDetail(id);
      setResource(res.data.resource);
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error('Errore caricamento risorsa:', error);
      setToast({ message: error.response?.data?.error || 'Errore nel caricamento', type: 'error' });
      setTimeout(() => navigate('/resources'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    navigate(`/resources/${id}/preview`);
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    try {
      await bookmarkAPI.bookmarkResource(id, bookmarkForm);
      setShowBookmarkModal(false);
      setBookmarkForm({ note_personali: '' });
      fetchResource();
      setToast({ message: 'Risorsa salvata nei preferiti!', type: 'success' });
    } catch (error) {
      console.error('Errore bookmark:', error);
      setToast({ message: error.response?.data?.error || 'Errore durante il salvataggio', type: 'error' });
    }
  };

  const handleUnbookmark = async () => {
    try {
      await bookmarkAPI.unbookmarkResource(id);
      fetchResource();
      setToast({ message: 'Risorsa rimossa dai preferiti', type: 'success' });
    } catch (error) {
      console.error('Errore unbookmark:', error);
      setToast({ message: 'Errore durante la rimozione', type: 'error' });
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await reviewAPI.createReview(id, reviewForm);
      setShowReviewModal(false);
      setReviewForm({ rating: 5, titolo: '', commento: '' });
      fetchResource();
      setToast({ message: 'Recensione pubblicata con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore recensione:', error);
      setToast({ message: error.response?.data?.error || 'Errore durante la pubblicazione', type: 'error' });
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await reviewAPI.markHelpful(reviewId);
      fetchResource();
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  if (!resource) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="empty-state">Risorsa non trovata</div>
        </div>
      </>
    );
  }

  const getTypeIcon = (tipo) => {
    const icons = {
      'ricerca': '📊',
      'case-study': '💼',
      'guida': '📖',
      'template': '📄',
      'video': '🎥',
      'articolo': '📰',
      'whitepaper': '📑',
      'toolkit': '🧰'
    };
    return icons[tipo] || '📄';
  };

  return (
    <>
      <div className="dashboard-new-container">
        <button
          style={{
            background: '#3D3D3D',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(61, 61, 61, 0.3)',
            transition: 'all 0.2s',
            marginBottom: '32px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(61, 61, 61, 0.4)';
            e.target.style.background = '#2D2D2D';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(61, 61, 61, 0.3)';
            e.target.style.background = '#3D3D3D';
          }}
          onClick={() => navigate('/resources')}
        >
          ← Torna alle risorse
        </button>

        {/* Header with cover */}
        {resource.anteprima_url && (
          <div style={{
            height: '300px',
            background: `url(${getImageUrl(resource.anteprima_url)}) center/cover`,
            backgroundColor: '#f0f0f0',
            borderRadius: '20px',
            marginBottom: '32px'
          }} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          {/* Main Content */}
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{
                  background: '#f0f0f0',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  {getTypeIcon(resource.tipo_risorsa)} {resource.tipo_risorsa}
                </span>
                {resource.category && (
                  <span style={{
                    background: '#2196F3',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {resource.category.icona} {resource.category.nome}
                  </span>
                )}
                {resource.in_evidenza && (
                  <span style={{
                    background: '#FF6B00',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    ⭐ In evidenza
                  </span>
                )}
                {resource.consigliata && (
                  <span style={{
                    background: '#3D3D3D',
                    color: '#7FFF00',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    👍 Consigliata
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 style={{ margin: '0 0 16px 0', fontSize: '32px', fontWeight: '600', lineHeight: '1.3' }}>
                {resource.titolo}
              </h1>

              {/* Author & Date */}
              <div style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
                {resource.autore && <span>di <strong>{resource.autore}</strong></span>}
                {resource.fonte && <span> • {resource.fonte}</span>}
                {resource.data_pubblicazione && (
                  <span> • {new Date(resource.data_pubblicazione).toLocaleDateString('it-IT')}</span>
                )}
              </div>

              {/* Description */}
              {resource.descrizione && (
                <div style={{
                  padding: '20px',
                  background: '#f9f9f9',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  lineHeight: '1.8',
                  fontSize: '16px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {resource.descrizione}
                </div>
              )}

              {/* Tags & Settori */}
              {(resource.tags?.length > 0 || resource.settori?.length > 0) && (
                <div style={{ marginBottom: '24px' }}>
                  {resource.tags?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '14px', color: '#666', marginRight: '8px' }}>Tags:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {resource.tags.map(tag => (
                          <span key={tag} style={{
                            background: '#f0f0f0',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '13px'
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resource.settori?.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '14px', color: '#666', marginRight: '8px' }}>Settori:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {resource.settori.map(settore => (
                          <span key={settore} style={{
                            background: '#e3f2fd',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '13px',
                            color: '#1976D2'
                          }}>
                            {settore}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Info */}
              {(resource.file_url || resource.link_esterno) && (
                <div style={{
                  padding: '16px',
                  background: '#f9f9f9',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    {resource.file_tipo && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                        Formato: <strong>{resource.file_tipo.toUpperCase()}</strong>
                      </div>
                    )}
                    {resource.file_size_kb && (
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Dimensione: <strong>{(resource.file_size_kb / 1024).toFixed(2)} MB</strong>
                      </div>
                    )}
                  </div>
                  <button className="btn-primary" onClick={handleDownload}>
                    ⬇️ Download
                  </button>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Recensioni ({resource.reviews_count})</h2>
                <button className="stat-btn" onClick={() => setShowReviewModal(true)} style={{ padding: '12px 20px' }}>
                  + Scrivi recensione
                </button>
              </div>

              {reviews.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999' }}>Nessuna recensione ancora</p>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{
                      padding: '20px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
                            {review.reviewer_logo && (
                              <img
                                src={getImageUrl(review.reviewer_logo)}
                                alt={review.reviewer_name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #E0E0E0'
                                }}
                              />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontWeight: '600' }}>{review.reviewer_name}</span>
                              <span style={{ color: '#FF9800', fontWeight: '500' }}>
                                {'⭐'.repeat(review.rating)}
                              </span>
                            </div>
                          </div>
                          {review.titolo && (
                            <div style={{ fontWeight: '500', marginBottom: '8px' }}>{review.titolo}</div>
                          )}
                        </div>
                        <span style={{ fontSize: '13px', color: '#999' }}>
                          {new Date(review.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      {review.commento && (
                        <p style={{ margin: '0 0 12px 0', lineHeight: '1.6', color: '#666' }}>
                          {review.commento}
                        </p>
                      )}
                      <button
                        onClick={() => handleMarkHelpful(review.id)}
                        style={{
                          background: 'none',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        👍 Utile ({review.helpful_count})
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Stats */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Statistiche</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Visualizzazioni</span>
                  <strong>{resource.views_count.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Download</span>
                  <strong>{resource.downloads_count.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Bookmark</span>
                  <strong>{resource.bookmarks_count}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Rating medio</span>
                  <strong>⭐ {resource.avg_rating.toFixed(1)}</strong>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Azioni</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {resource.is_bookmarked ? (
                  <button className="stat-btn" onClick={handleUnbookmark} style={{ padding: '12px 20px', background: '#FFE0E0', color: '#3D3D3D' }}>
                    ⭐ Rimuovi dai preferiti
                  </button>
                ) : (
                  <button className="stat-btn" onClick={() => setShowBookmarkModal(true)} style={{ padding: '12px 20px' }}>
                    ☆ Salva nei preferiti
                  </button>
                )}
                {(resource.file_url || resource.link_esterno) && (
                  <button className="stat-btn" onClick={handleDownload} style={{ padding: '12px 20px' }}>
                    ⬇️ Download Risorsa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Scrivi una recensione</h2>
                <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Rating *</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '32px',
                          padding: '0',
                          lineHeight: 1,
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        {star <= reviewForm.rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    {reviewForm.rating === 1 && 'Pessimo'}
                    {reviewForm.rating === 2 && 'Scarso'}
                    {reviewForm.rating === 3 && 'Sufficiente'}
                    {reviewForm.rating === 4 && 'Buono'}
                    {reviewForm.rating === 5 && 'Eccellente'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Titolo</label>
                  <input
                    type="text"
                    value={reviewForm.titolo}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, titolo: e.target.value }))}
                    placeholder="Es. Ottima risorsa!"
                  />
                </div>

                <div className="form-group">
                  <label>Commento</label>
                  <textarea
                    value={reviewForm.commento}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, commento: e.target.value }))}
                    rows="4"
                    placeholder="Condividi la tua esperienza..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowReviewModal(false)}>
                    Annulla
                  </button>
                  <button type="submit" className="btn-primary">
                    Pubblica Recensione
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bookmark Modal */}
        {showBookmarkModal && (
          <div className="modal-overlay" onClick={() => setShowBookmarkModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Salva nei preferiti</h2>
                <button className="modal-close" onClick={() => setShowBookmarkModal(false)}>×</button>
              </div>

              <form onSubmit={handleBookmark}>
                <div className="form-group">
                  <label>Note personali (opzionale)</label>
                  <textarea
                    value={bookmarkForm.note_personali}
                    onChange={(e) => setBookmarkForm(prev => ({ ...prev, note_personali: e.target.value }))}
                    rows="3"
                    placeholder="Aggiungi note personali su questa risorsa..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowBookmarkModal(false)}>
                    Annulla
                  </button>
                  <button type="submit" className="btn-primary">
                    Salva nei preferiti
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  );
}

export default ResourceDetail;
