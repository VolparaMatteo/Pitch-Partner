import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bestPracticeAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/best-practice.css';
import '../styles/contract-detail.css';

function BestPracticeEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();

  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [myRegistration, setMyRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Q&A
  const [questionText, setQuestionText] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Feedback
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    commento: ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!user || !['sponsor', 'club', 'admin'].includes(user.role)) {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (user.role === 'admin') {
        const [eventRes, questionsRes] = await Promise.all([
          bestPracticeAPI.adminGetEvent(id),
          bestPracticeAPI.adminGetQuestions(id)
        ]);
        setEvent(eventRes.data.event);
        setQuestions(questionsRes.data.questions || []);
      } else {
        const [eventRes, myEventsRes, questionsRes] = await Promise.all([
          bestPracticeAPI.getEvent(id),
          bestPracticeAPI.getMyEvents(),
          bestPracticeAPI.getQuestions(id)
        ]);
        setEvent(eventRes.data.event);
        setQuestions(questionsRes.data.questions || []);

        // Check if I'm registered
        const registration = myEventsRes.data.registrations?.find(
          r => r.event.id === parseInt(id)
        );
        setMyRegistration(registration || null);
      }
    } catch (error) {
      console.error('Errore caricamento evento:', error);
      alert('Errore nel caricamento dell\'evento');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await bestPracticeAPI.registerToEvent(id);
      alert('Iscrizione completata!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore durante l\'iscrizione');
    }
  };

  const handleUnregister = async () => {
    if (!window.confirm('Confermi di voler annullare l\'iscrizione?')) return;
    try {
      await bestPracticeAPI.unregisterFromEvent(id);
      alert('Iscrizione annullata');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore durante l\'annullamento');
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    try {
      setSubmittingQuestion(true);
      await bestPracticeAPI.submitQuestion(id, questionText);
      setQuestionText('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore invio domanda');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleUpvoteQuestion = async (qId) => {
    try {
      await bestPracticeAPI.upvoteQuestion(id, qId);
      fetchData();
    } catch (error) {
      console.error('Errore upvote:', error);
    }
  };

  const handleAnswerQuestion = async (qId, risposta) => {
    if (!risposta.trim()) return;
    try {
      await bestPracticeAPI.answerQuestion(id, qId, risposta);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore risposta');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Eliminare questa domanda?')) return;
    try {
      await bestPracticeAPI.deleteQuestion(id, qId);
      fetchData();
    } catch (error) {
      alert('Errore eliminazione domanda');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      await bestPracticeAPI.submitFeedback(id, feedbackData);
      alert('Feedback inviato con successo!');
      setFeedbackData({ rating: 5, commento: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore invio feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handlePublish = async () => {
    try {
      await bestPracticeAPI.publishEvent(id);
      alert('Evento pubblicato!');
      fetchData();
    } catch (error) {
      alert('Errore pubblicazione');
    }
  };

  const handleUnpublish = async () => {
    try {
      await bestPracticeAPI.unpublishEvent(id);
      alert('Evento rimosso dalla pubblicazione');
      fetchData();
    } catch (error) {
      alert('Errore');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Confermi di voler cancellare questo evento?')) return;
    try {
      await bestPracticeAPI.cancelEvent(id);
      alert('Evento cancellato');
      fetchData();
    } catch (error) {
      alert('Errore cancellazione');
    }
  };

  const getEventIcon = (tipo) => {
    const icons = {
      webinar: '🎓',
      seminario: '💼',
      workshop: '🛠️',
      conferenza: '🎤'
    };
    return icons[tipo] || '📚';
  };

  const getStatusBadge = (status) => {
    const badges = {
      bozza: { label: 'Bozza', class: 'badge-info' },
      pubblicato: { label: 'Pubblicato', class: 'badge-success' },
      in_corso: { label: 'In Corso', class: 'badge-primary' },
      completato: { label: 'Completato', class: 'badge-info' },
      cancellato: { label: 'Cancellato', class: 'badge-error' }
    };
    return badges[status] || badges.bozza;
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <div className="dashboard-container">
          <div className="empty-state">Evento non trovato</div>
        </div>
      </>
    );
  }

  const eventDate = new Date(event.data_evento);
  const isPastEvent = eventDate < new Date();
  const canJoin = myRegistration && !isPastEvent && event.link_webinar;
  const canSubmitFeedback = myRegistration && isPastEvent && !myRegistration.feedback_rating;

  return (
    <>
      <div className="dashboard-container">
        {/* Header */}
        <div className="detail-header">
          <div>
            <button className="btn-secondary" onClick={() => navigate(-1)}>
              ← Torna indietro
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <span style={{ fontSize: '32px' }}>{getEventIcon(event.tipo)}</span>
              <div>
                <h1 style={{ margin: 0 }}>{event.titolo}</h1>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <span className={`badge ${getStatusBadge(event.status).class}`}>
                    {getStatusBadge(event.status).label}
                  </span>
                  {event.pubblicato && <span className="badge badge-success">✓ Pubblicato</span>}
                  {myRegistration && <span className="badge badge-primary">✓ Iscritto</span>}
                  {event.solo_premium && <span className="badge badge-warning">⭐ Premium</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="detail-actions">
            {user.role === 'admin' && (
              <>
                <button className="btn-secondary" onClick={() => navigate(`/admin/best-practice-events/${id}/edit`)}>
                  ✏️ Modifica
                </button>
                {!event.pubblicato && event.status !== 'cancellato' && (
                  <button className="btn-primary" onClick={handlePublish}>
                    📢 Pubblica
                  </button>
                )}
                {event.pubblicato && event.status !== 'cancellato' && (
                  <button className="btn-secondary" onClick={handleUnpublish}>
                    🔒 Rimuovi Pubblicazione
                  </button>
                )}
                {event.status !== 'cancellato' && (
                  <button className="btn-outline" onClick={handleCancel}>
                    🚫 Cancella Evento
                  </button>
                )}
              </>
            )}

            {user.role !== 'admin' && !myRegistration && !isPastEvent && event.status === 'pubblicato' && (
              <button
                className="btn-primary"
                onClick={handleRegister}
                disabled={event.posti_disponibili === 0}
              >
                {event.posti_disponibili === 0 ? 'Sold Out' : '✅ Iscriviti'}
              </button>
            )}

            {canJoin && (
              <a href={event.link_webinar} target="_blank" rel="noopener noreferrer" className="btn-success">
                🔗 Join Evento
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📄 Dettagli
          </button>
          {event.abilita_qna && (
            <button
              className={`tab ${activeTab === 'qna' ? 'active' : ''}`}
              onClick={() => setActiveTab('qna')}
            >
              💬 Q&A ({questions.length})
            </button>
          )}
          {canSubmitFeedback && (
            <button
              className={`tab ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              ⭐ Feedback
            </button>
          )}
          {user.role === 'admin' && (
            <button
              className={`tab ${activeTab === 'registrations' ? 'active' : ''}`}
              onClick={() => setActiveTab('registrations')}
            >
              👥 Iscritti ({event.registrations_count || 0})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="detail-content">
              <div className="info-grid">
                <div className="info-card">
                  <h3>Informazioni Evento</h3>
                  <div className="info-row">
                    <span className="info-label">Tipo:</span>
                    <span>{event.tipo}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Data:</span>
                    <span>📅 {eventDate.toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Durata:</span>
                    <span>⏱️ {event.durata_minuti} minuti</span>
                  </div>
                  {event.categoria && (
                    <div className="info-row">
                      <span className="info-label">Categoria:</span>
                      <span>🏷️ {event.categoria}</span>
                    </div>
                  )}
                  {event.location_fisica && (
                    <div className="info-row">
                      <span className="info-label">Location:</span>
                      <span>📍 {event.location_fisica}</span>
                    </div>
                  )}
                  {event.max_partecipanti && (
                    <div className="info-row">
                      <span className="info-label">Posti:</span>
                      <span>👥 {event.registrations_count || 0} / {event.max_partecipanti}</span>
                    </div>
                  )}
                </div>

                <div className="info-card">
                  <h3>Descrizione</h3>
                  <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{event.descrizione}</p>

                  {event.note_partecipanti && (
                    <>
                      <h4 style={{ marginTop: '20px' }}>Note per i Partecipanti</h4>
                      <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#F9F9F9', padding: '12px', borderRadius: '8px' }}>
                        {event.note_partecipanti}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Speakers */}
              {event.speakers && event.speakers.length > 0 && (
                <div className="info-card" style={{ marginTop: '20px' }}>
                  <h3>👨‍🏫 Speaker</h3>
                  <div className="speakers-grid">
                    {event.speakers.map((speaker, idx) => (
                      <div key={idx} className="speaker-card">
                        {speaker.foto_url && (
                          <img src={speaker.foto_url} alt={speaker.nome} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                        )}
                        <div>
                          <strong>{speaker.nome}</strong>
                          {speaker.ruolo && <div style={{ color: '#666', fontSize: '14px' }}>{speaker.ruolo}</div>}
                          {speaker.bio && <p style={{ fontSize: '13px', marginTop: '8px' }}>{speaker.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="info-card" style={{ marginTop: '20px' }}>
                  <h3>🏷️ Tags</h3>
                  <div className="event-tags">
                    {event.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {(event.agenda_url || event.recording_url || (event.materiali_urls && event.materiali_urls.length > 0)) && (
                <div className="info-card" style={{ marginTop: '20px' }}>
                  <h3>📚 Materiali</h3>
                  {event.agenda_url && (
                    <div style={{ marginBottom: '12px' }}>
                      <a href={event.agenda_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                        📄 Scarica Agenda
                      </a>
                    </div>
                  )}
                  {event.recording_url && (
                    <div style={{ marginBottom: '12px' }}>
                      <a href={event.recording_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                        🎥 Guarda Recording
                      </a>
                    </div>
                  )}
                  {event.materiali_urls && event.materiali_urls.map((url, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                        📎 Materiale {idx + 1}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions for registered users */}
              {myRegistration && !isPastEvent && (
                <div className="info-card" style={{ marginTop: '20px', background: '#FFF4E5' }}>
                  <h3>Le tue azioni</h3>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    {event.link_webinar && (
                      <a href={event.link_webinar} target="_blank" rel="noopener noreferrer" className="btn-primary">
                        🔗 Join Evento
                      </a>
                    )}
                    <button className="btn-outline" onClick={handleUnregister}>
                      🚫 Annulla Iscrizione
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Q&A Tab */}
          {activeTab === 'qna' && event.abilita_qna && (
            <div className="qna-section">
              {myRegistration && (
                <div className="qna-form">
                  <h3>Fai una domanda</h3>
                  <form onSubmit={handleSubmitQuestion}>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Scrivi la tua domanda..."
                      rows="3"
                      required
                    />
                    <button type="submit" className="btn-primary" disabled={submittingQuestion}>
                      {submittingQuestion ? 'Invio...' : '📤 Invia Domanda'}
                    </button>
                  </form>
                </div>
              )}

              <div className="questions-list">
                <h3>Domande ({questions.length})</h3>
                {questions.length === 0 && (
                  <div className="empty-state">Nessuna domanda ancora</div>
                )}
                {questions.map(q => (
                  <div key={q.id} className="question-card">
                    <div className="question-header">
                      <div>
                        <strong>{q.user_name || 'Anonimo'}</strong>
                        <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                          {new Date(q.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleUpvoteQuestion(q.id)}
                          disabled={user.role === 'admin'}
                        >
                          👍 {q.upvotes || 0}
                        </button>
                        {user.role === 'admin' && (
                          <button className="btn-icon error" onClick={() => handleDeleteQuestion(q.id)}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="question-text">{q.domanda}</p>

                    {q.risposta && (
                      <div className="answer-box">
                        <strong>Risposta:</strong>
                        <p>{q.risposta}</p>
                        <small style={{ color: '#999' }}>
                          {new Date(q.risposta_at).toLocaleDateString('it-IT')}
                        </small>
                      </div>
                    )}

                    {!q.risposta && user.role === 'admin' && (
                      <div className="answer-form">
                        <textarea
                          placeholder="Scrivi una risposta..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleAnswerQuestion(q.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          rows="2"
                        />
                        <button
                          className="btn-secondary btn-sm"
                          onClick={(e) => {
                            const textarea = e.target.previousSibling;
                            handleAnswerQuestion(q.id, textarea.value);
                            textarea.value = '';
                          }}
                        >
                          Rispondi
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && canSubmitFeedback && (
            <div className="feedback-section">
              <div className="info-card">
                <h3>⭐ Lascia il tuo Feedback</h3>
                <form onSubmit={handleSubmitFeedback}>
                  <div className="form-group">
                    <label>Valutazione (1-5)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFeedbackData(prev => ({ ...prev, rating }))}
                          style={{
                            padding: '12px 20px',
                            fontSize: '20px',
                            border: feedbackData.rating === rating ? '2px solid #85FF00' : '1px solid #E0E0E0',
                            background: feedbackData.rating === rating ? '#F9FFF0' : 'white',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          {rating}⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Commento</label>
                    <textarea
                      value={feedbackData.commento}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, commento: e.target.value }))}
                      rows="4"
                      placeholder="Cosa ne pensi dell'evento?"
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={submittingFeedback}>
                    {submittingFeedback ? 'Invio...' : '📤 Invia Feedback'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Registrations Tab (Admin only) */}
          {activeTab === 'registrations' && user.role === 'admin' && (
            <div className="registrations-section">
              <button className="btn-primary" onClick={() => navigate(`/admin/best-practice-events/${id}/registrations`)}>
                📊 Gestisci Iscrizioni
              </button>
              <p style={{ marginTop: '12px', color: '#666' }}>
                {event.registrations_count || 0} iscritti totali
                {event.max_partecipanti && ` su ${event.max_partecipanti} posti disponibili`}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default BestPracticeEventDetail;
