import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bestPracticeAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import '../styles/dashboard-new.css';

function AdminBestPractice() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFilter, categoriaFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (tipoFilter) filters.tipo = tipoFilter;
      if (categoriaFilter) filters.categoria = categoriaFilter;

      const res = await bestPracticeAPI.adminGetEvents(filters);
      setEvents(res.data.events || []);
    } catch (error) {
      console.error('Errore caricamento eventi:', error);
      setToast({ message: 'Errore nel caricamento degli eventi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await bestPracticeAPI.publishEvent(id);
      fetchEvents();
      setToast({ message: 'Evento pubblicato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore pubblicazione:', error);
      setToast({ message: error.response?.data?.error || 'Errore pubblicazione', type: 'error' });
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await bestPracticeAPI.unpublishEvent(id);
      fetchEvents();
      setToast({ message: 'Pubblicazione rimossa', type: 'success' });
    } catch (error) {
      console.error('Errore unpublish:', error);
      setToast({ message: error.response?.data?.error || 'Errore unpublish', type: 'error' });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Confermi di voler cancellare questo evento?')) return;
    try {
      await bestPracticeAPI.cancelEvent(id);
      fetchEvents();
      setToast({ message: 'Evento cancellato', type: 'success' });
    } catch (error) {
      console.error('Errore cancellazione:', error);
      setToast({ message: error.response?.data?.error || 'Errore cancellazione', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confermi di voler eliminare definitivamente questo evento?')) return;
    try {
      await bestPracticeAPI.adminDeleteEvent(id);
      fetchEvents();
      setToast({ message: 'Evento eliminato definitivamente', type: 'success' });
    } catch (error) {
      console.error('Errore eliminazione:', error);
      setToast({ message: error.response?.data?.error || 'Errore eliminazione', type: 'error' });
    }
  };

  const getFilteredEvents = () => {
    if (activeTab === 'all') return events;
    if (activeTab === 'published') return events.filter(e => e.pubblicato && e.status !== 'cancellato');
    if (activeTab === 'drafts') return events.filter(e => !e.pubblicato || e.status === 'bozza');
    if (activeTab === 'upcoming') {
      const now = new Date();
      return events.filter(e => new Date(e.data_evento) >= now && e.pubblicato);
    }
    if (activeTab === 'completed') return events.filter(e => e.status === 'completato');
    return events;
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

  const getStatusBadge = (event) => {
    if (event.status === 'cancellato') {
      return (
        <span style={{
          background: '#FFE0E0',
          color: '#D32F2F',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700
        }}>
          Cancellato
        </span>
      );
    }

    if (!event.pubblicato) {
      return (
        <span style={{
          background: '#FFF4E0',
          color: '#F57C00',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700
        }}>
          Bozza
        </span>
      );
    }

    const now = new Date();
    const dataEvento = new Date(event.data_evento);

    if (event.status === 'completato') {
      return (
        <span style={{
          background: '#E8F5E9',
          color: '#2E7D32',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700
        }}>
          Completato
        </span>
      );
    }

    if (dataEvento < now) {
      return (
        <span style={{
          background: '#E3F2FD',
          color: '#1976D2',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700
        }}>
          Passato
        </span>
      );
    }

    return (
      <span style={{
        background: '#F0F0F0',
        color: '#3D3D3D',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 700
      }}>
        Pubblicato
      </span>
    );
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

  const filteredEvents = getFilteredEvents();
  const publishedEvents = events.filter(e => e.pubblicato);
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registrations_count || 0), 0);
  const totalQuestions = events.reduce((sum, e) => sum + (e.questions_count || 0), 0);

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 className="welcome-title">Eventi Best Practice</h1>
          <button
            className="stat-btn"
            onClick={() => navigate('/admin/best-practice-events/new')}
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            + Nuovo Evento
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Green Lime Card */}
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#3D3D3D', opacity: 0.8 }}>
              Eventi Totali
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              {events.length}
            </div>
          </div>

          {/* Dark Gray Card */}
          <div style={{
            background: '#3D3D3D',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: 'white', opacity: 0.8 }}>
              Pubblicati
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
              {publishedEvents.length}
            </div>
          </div>

          {/* Pink Card */}
          <div style={{
            background: 'linear-gradient(135deg, #FFD4D4 0%, #FFC4C4 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#3D3D3D', opacity: 0.8 }}>
              Iscritti Totali
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              {totalRegistrations}
            </div>
          </div>

          {/* Gray Card */}
          <div style={{
            background: '#F5F5F5',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#3D3D3D', opacity: 0.8 }}>
              Domande Q&A
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              {totalQuestions}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #E0E0E0',
          overflowX: 'auto'
        }}>
          {[
            { key: 'all', label: 'Tutti' },
            { key: 'published', label: 'Pubblicati' },
            { key: 'upcoming', label: 'In Arrivo' },
            { key: 'completed', label: 'Completati' },
            { key: 'drafts', label: 'Bozze' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: activeTab === tab.key ? '#3D3D3D' : '#999',
                borderBottom: activeTab === tab.key ? '3px solid #7FFF00' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666'
              }}>
                Tipo Evento
              </label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tutti i tipi</option>
                <option value="webinar">🎓 Webinar</option>
                <option value="seminario">💼 Seminario</option>
                <option value="workshop">🛠️ Workshop</option>
                <option value="conferenza">🎤 Conferenza</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666'
              }}>
                Categoria
              </label>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tutte le categorie</option>
                <option value="marketing">Marketing</option>
                <option value="digital">Digital</option>
                <option value="legal">Legal</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div style={{
            background: 'white',
            border: '2px dashed #E0E0E0',
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', color: '#999', marginBottom: '16px' }}>
              Nessun evento trovato
            </div>
            <button
              className="stat-btn"
              onClick={() => navigate('/admin/best-practice-events/new')}
              style={{ padding: '12px 24px' }}
            >
              Crea il primo evento
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {filteredEvents.map(event => (
              <div
                key={event.id}
                style={{
                  background: 'white',
                  border: '2px solid #E0E0E0',
                  borderRadius: '20px',
                  padding: '24px',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7FFF00';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(127, 255, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header with Type and Status */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#F5F5F5',
                    padding: '6px 12px',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{getEventIcon(event.tipo)}</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#3D3D3D',
                      textTransform: 'capitalize'
                    }}>
                      {event.tipo}
                    </span>
                  </div>
                  {getStatusBadge(event)}
                </div>

                {/* Title */}
                <h3
                  onClick={() => navigate(`/admin/best-practice-events/${event.id}`)}
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '18px',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: '#3D3D3D',
                    cursor: 'pointer'
                  }}
                >
                  {event.titolo}
                </h3>

                {/* Event Meta */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📅</span>
                    <span>
                      {new Date(event.data_evento).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {event.durata_minuti && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⏱️</span>
                      <span>{event.durata_minuti} min</span>
                    </div>
                  )}
                  {event.categoria && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🏷️</span>
                      <span style={{ textTransform: 'capitalize' }}>{event.categoria}</span>
                    </div>
                  )}
                  {event.location_fisica && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📍</span>
                      <span>{event.location_fisica}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #F5F5F5',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  <span>👥 {event.registrations_count || 0}</span>
                  <span>💬 {event.questions_count || 0}</span>
                </div>

                {/* Visibility Badges */}
                {(event.visibile_sponsor || event.visibile_club || event.solo_premium) && (
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    marginBottom: '16px'
                  }}>
                    {event.visibile_sponsor && (
                      <span style={{
                        background: '#E3F2FD',
                        color: '#1976D2',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        👥 Sponsor
                      </span>
                    )}
                    {event.visibile_club && (
                      <span style={{
                        background: '#E8F5E9',
                        color: '#2E7D32',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        🏟️ Club
                      </span>
                    )}
                    {event.solo_premium && (
                      <span style={{
                        background: '#FFF4E0',
                        color: '#F57C00',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        ⭐ Premium
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  paddingTop: '16px',
                  borderTop: '2px solid #F5F5F5'
                }}>
                  <button
                    onClick={() => navigate(`/admin/best-practice-events/${event.id}/edit`)}
                    style={{
                      background: '#F5F5F5',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#E0E0E0'}
                    onMouseLeave={(e) => e.target.style.background = '#F5F5F5'}
                    title="Modifica"
                  >
                    ✏️
                  </button>

                  {!event.pubblicato && event.status !== 'cancellato' && (
                    <button
                      onClick={() => handlePublish(event.id)}
                      style={{
                        background: '#E8F5E9',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#C8E6C9'}
                      onMouseLeave={(e) => e.target.style.background = '#E8F5E9'}
                      title="Pubblica"
                    >
                      ✅
                    </button>
                  )}

                  {event.pubblicato && event.status !== 'cancellato' && (
                    <button
                      onClick={() => handleUnpublish(event.id)}
                      style={{
                        background: '#FFF4E0',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#FFE4B0'}
                      onMouseLeave={(e) => e.target.style.background = '#FFF4E0'}
                      title="Rimuovi Pubblicazione"
                    >
                      ⏸️
                    </button>
                  )}

                  {event.status !== 'cancellato' && (
                    <button
                      onClick={() => handleCancel(event.id)}
                      style={{
                        background: '#FFE0E0',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#FFD0D0'}
                      onMouseLeave={(e) => e.target.style.background = '#FFE0E0'}
                      title="Cancella Evento"
                    >
                      🚫
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/admin/best-practice-events/${event.id}`)}
                    style={{
                      background: '#F5F5F5',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#E0E0E0'}
                    onMouseLeave={(e) => e.target.style.background = '#F5F5F5'}
                    title="Dettagli & Analytics"
                  >
                    📊
                  </button>

                  <button
                    onClick={() => handleDelete(event.id)}
                    style={{
                      background: '#FFE0E0',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#FFD0D0'}
                    onMouseLeave={(e) => e.target.style.background = '#FFE0E0'}
                    title="Elimina Definitivamente"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default AdminBestPractice;
