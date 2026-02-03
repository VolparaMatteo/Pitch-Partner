import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pressAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/press-area.css';

function SponsorPressFeed() {
  const [publications, setPublications] = useState([]);
  const [selectedPub, setSelectedPub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFilter, categoriaFilter]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (tipoFilter) filters.tipo = tipoFilter;
      if (categoriaFilter) filters.categoria = categoriaFilter;

      const res = await pressAPI.getSponsorFeed(filters);
      setPublications(res.data.publications || []);
    } catch (error) {
      console.error('Errore nel caricamento feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPublication = async (pub) => {
    try {
      // Carica dettaglio completo
      const res = await pressAPI.getSponsorPublication(pub.id);
      setSelectedPub(res.data.publication);

      // Traccia visualizzazione
      if (!pub.has_viewed) {
        await pressAPI.trackView(pub.id);
        // Aggiorna stato locale
        setPublications(publications.map(p =>
          p.id === pub.id ? { ...p, has_viewed: true, visualizzazioni_count: (p.visualizzazioni_count || 0) + 1 } : p
        ));
      }
    } catch (error) {
      console.error('Errore apertura pubblicazione:', error);
      alert(error.response?.data?.error || 'Errore caricamento');
    }
  };

  const handleReaction = async (pubId, tipo) => {
    try {
      const pub = publications.find(p => p.id === pubId);

      if (pub.my_reaction === tipo) {
        // Rimuovi reazione
        await pressAPI.removeReaction(pubId);
        setPublications(publications.map(p => {
          if (p.id === pubId) {
            const newReactions = { ...p.reactions_count };
            newReactions[tipo] = Math.max(0, (newReactions[tipo] || 0) - 1);
            return { ...p, my_reaction: null, reactions_count: newReactions };
          }
          return p;
        }));
        if (selectedPub?.id === pubId) {
          const newReactions = { ...selectedPub.reactions_count };
          newReactions[tipo] = Math.max(0, (newReactions[tipo] || 0) - 1);
          setSelectedPub({ ...selectedPub, my_reaction: null, reactions_count: newReactions });
        }
      } else {
        // Aggiungi/modifica reazione
        await pressAPI.addReaction(pubId, tipo);
        setPublications(publications.map(p => {
          if (p.id === pubId) {
            const newReactions = { ...p.reactions_count };
            if (p.my_reaction) {
              newReactions[p.my_reaction] = Math.max(0, (newReactions[p.my_reaction] || 0) - 1);
            }
            newReactions[tipo] = (newReactions[tipo] || 0) + 1;
            return { ...p, my_reaction: tipo, reactions_count: newReactions };
          }
          return p;
        }));
        if (selectedPub?.id === pubId) {
          const newReactions = { ...selectedPub.reactions_count };
          if (selectedPub.my_reaction) {
            newReactions[selectedPub.my_reaction] = Math.max(0, (newReactions[selectedPub.my_reaction] || 0) - 1);
          }
          newReactions[tipo] = (newReactions[tipo] || 0) + 1;
          setSelectedPub({ ...selectedPub, my_reaction: tipo, reactions_count: newReactions });
        }
      }
    } catch (error) {
      console.error('Errore reazione:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const data = { testo: commentText };
      if (replyTo) {
        data.parent_comment_id = replyTo.id;
      }

      await pressAPI.addComment(selectedPub.id, data);
      setCommentText('');
      setReplyTo(null);

      // Ricarica dettaglio
      const res = await pressAPI.getSponsorPublication(selectedPub.id);
      setSelectedPub(res.data.publication);
    } catch (error) {
      console.error('Errore invio commento:', error);
      alert(error.response?.data?.error || 'Errore invio commento');
    }
  };

  const getPublicationIcon = (tipo) => {
    const icons = {
      comunicato: '📰',
      tv: '📺',
      social: '📱',
      articolo: '📄',
      video: '🎥',
      photo: '📸',
      evento: '🎪'
    };
    return icons[tipo] || '📰';
  };

  const getReactionEmoji = (type) => {
    const emojis = { like: '👍', love: '❤️', applause: '👏', celebrate: '🎉' };
    return emojis[type] || '👍';
  };

  const renderComment = (comment, level = 0) => (
    <div key={comment.id} className={`comment ${level > 0 ? 'comment-reply' : ''}`} style={{ marginLeft: `${level * 20}px` }}>
      <div className="comment-header">
        <span className="comment-author">
          {comment.user_type === 'club' ? '🏟️' : '💼'} {comment.user_name}
        </span>
        <span className="comment-date">{new Date(comment.created_at).toLocaleString('it-IT')}</span>
      </div>
      <div className="comment-text">{comment.testo}</div>
      <button className="btn-link comment-reply-btn" onClick={() => setReplyTo(comment)}>
        Rispondi
      </button>
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => renderComment(reply, level + 1))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container press-feed-container">
        <div className="dashboard-header">
          <h1>Press Feed</h1>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="filter-select">
            <option value="">Tutti i tipi</option>
            <option value="comunicato">Comunicato</option>
            <option value="tv">TV</option>
            <option value="social">Social</option>
            <option value="articolo">Articolo</option>
            <option value="video">Video</option>
            <option value="photo">Photo</option>
            <option value="evento">Evento</option>
          </select>
          <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className="filter-select">
            <option value="">Tutte le categorie</option>
            <option value="partita">Partita</option>
            <option value="evento">Evento</option>
            <option value="generale">Generale</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>

        {/* Feed */}
        <div className="press-feed">
          {publications.map(pub => (
            <div key={pub.id} className={`feed-card ${pub.has_viewed ? 'viewed' : 'new'}`}>
              <div className="feed-card-header">
                <div className="pub-type">
                  <span className="pub-icon">{getPublicationIcon(pub.tipo)}</span>
                  <span className="pub-type-label">{pub.tipo}</span>
                  {!pub.has_viewed && <span className="badge badge-new">Nuovo</span>}
                </div>
                <span className="pub-date">{new Date(pub.data_pubblicazione).toLocaleDateString('it-IT')}</span>
              </div>

              <h3 className="feed-card-title" onClick={() => handleOpenPublication(pub)}>
                {pub.titolo}
              </h3>
              {pub.sottotitolo && <p className="feed-card-subtitle">{pub.sottotitolo}</p>}

              {pub.fonte_testata && (
                <div className="pub-source">
                  <span>📰 {pub.fonte_testata}</span>
                </div>
              )}

              {pub.categoria && (
                <div className="pub-category">
                  <span className="badge">🏷️ {pub.categoria}</span>
                </div>
              )}

              {/* Reactions */}
              <div className="reactions-bar">
                {['like', 'love', 'applause', 'celebrate'].map(tipo => (
                  <button
                    key={tipo}
                    className={`reaction-btn ${pub.my_reaction === tipo ? 'active' : ''}`}
                    onClick={() => handleReaction(pub.id, tipo)}
                  >
                    {getReactionEmoji(tipo)} {pub.reactions_count?.[tipo] || 0}
                  </button>
                ))}
              </div>

              <div className="feed-card-stats">
                <span>👁️ {pub.visualizzazioni_count || 0}</span>
                <span>💬 {pub.comments_count || 0}</span>
                <button className="btn-link" onClick={() => handleOpenPublication(pub)}>
                  Leggi tutto →
                </button>
              </div>
            </div>
          ))}
        </div>

        {publications.length === 0 && (
          <div className="empty-state">
            <p>Nessuna pubblicazione disponibile</p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedPub && (
          <div className="modal-overlay" onClick={() => setSelectedPub(null)}>
            <div className="modal-content publication-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="pub-type">
                  <span className="pub-icon">{getPublicationIcon(selectedPub.tipo)}</span>
                  <span className="pub-type-label">{selectedPub.tipo}</span>
                </div>
                <button className="btn-close" onClick={() => setSelectedPub(null)}>×</button>
              </div>

              <div className="publication-detail">
                <h2>{selectedPub.titolo}</h2>
                {selectedPub.sottotitolo && <h3 className="subtitle">{selectedPub.sottotitolo}</h3>}

                <div className="pub-meta">
                  <span>📅 {new Date(selectedPub.data_pubblicazione).toLocaleDateString('it-IT')}</span>
                  {selectedPub.fonte_testata && <span>📰 {selectedPub.fonte_testata}</span>}
                  {selectedPub.categoria && <span>🏷️ {selectedPub.categoria}</span>}
                </div>

                {selectedPub.media_urls && selectedPub.media_urls.length > 0 && (
                  <div className="pub-media">
                    {selectedPub.media_urls.map((url, idx) => (
                      <img key={idx} src={url} alt={`Media ${idx + 1}`} className="pub-image" />
                    ))}
                  </div>
                )}

                <div className="pub-content">
                  {selectedPub.testo.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                {selectedPub.link_esterno && (
                  <div className="pub-link">
                    <a href={selectedPub.link_esterno} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      🔗 Leggi l'articolo completo
                    </a>
                  </div>
                )}

                {selectedPub.documento_pdf_url && (
                  <div className="pub-document">
                    <a href={selectedPub.documento_pdf_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      📄 Scarica PDF
                    </a>
                  </div>
                )}

                {/* Reactions */}
                <div className="reactions-bar large">
                  {['like', 'love', 'applause', 'celebrate'].map(tipo => (
                    <button
                      key={tipo}
                      className={`reaction-btn ${selectedPub.my_reaction === tipo ? 'active' : ''}`}
                      onClick={() => handleReaction(selectedPub.id, tipo)}
                    >
                      {getReactionEmoji(tipo)} {selectedPub.reactions_count?.[tipo] || 0}
                    </button>
                  ))}
                </div>

                {/* Comments Section */}
                <div className="comments-section">
                  <h3>Commenti</h3>

                  {/* Comment Form */}
                  <form onSubmit={handleAddComment} className="comment-form">
                    {replyTo && (
                      <div className="reply-to-badge">
                        Rispondi a {replyTo.user_name}
                        <button type="button" onClick={() => setReplyTo(null)}>×</button>
                      </div>
                    )}
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={replyTo ? "Scrivi una risposta..." : "Scrivi un commento..."}
                      rows={3}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!commentText.trim()}>
                      Invia
                    </button>
                  </form>

                  {/* Comments List */}
                  <div className="comments-list">
                    {selectedPub.comments && selectedPub.comments.length > 0 ? (
                      selectedPub.comments.map(comment => renderComment(comment))
                    ) : (
                      <p className="no-comments">Nessun commento ancora</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorPressFeed;
