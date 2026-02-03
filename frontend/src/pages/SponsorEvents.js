import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import api from '../services/api';
import '../styles/sponsor-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineCalendarDays,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineVideoCamera,
  HiOutlineTicket,
  HiOutlineArrowRight
} from 'react-icons/hi2';

function SponsorEvents() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totale: 0,
    futuri: 0,
    passati: 0,
    inviti_non_visualizzati: 0,
    registrati: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, invites

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchEvents();
  }, [filters.status]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/sponsor/events?${params.toString()}`);
      setEvents(response.data.events || []);
      setStats(response.data.stats || {});

    } catch (error) {
      console.error('Errore nel caricamento eventi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await api.post(`/sponsor/events/${eventId}/register`, {});
      fetchEvents(); // Refresh
    } catch (error) {
      console.error('Errore nella registrazione:', error);
      alert(error.response?.data?.error || 'Errore nella registrazione');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntil = (dateString) => {
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} giorni fa`;
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    return `Tra ${days} giorni`;
  };

  const getEventTypeLabel = (tipo) => {
    const types = {
      'ufficio_stampa': 'Ufficio Stampa',
      'presentazione_commerciale': 'Presentazione',
      'evento_brand': 'Evento Brand',
      'conferenza_stampa': 'Conferenza Stampa',
      'inaugurazione': 'Inaugurazione',
      'networking': 'Networking',
      'altro': 'Evento'
    };
    return types[tipo] || tipo || 'Evento';
  };

  const filteredEvents = events.filter(event => {
    // Tab filter
    if (activeTab === 'upcoming' && event.is_past) return false;
    if (activeTab === 'past' && !event.is_past) return false;
    if (activeTab === 'invites' && !event.is_invited) return false;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return event.titolo?.toLowerCase().includes(searchLower) ||
             event.luogo?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Caricamento eventi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Eventi</h1>
          <p className="page-subtitle">Eventi del club a cui sei invitato o puoi partecipare</p>
        </div>
      </div>

      {/* Stats */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Totale Eventi</div>
          <div className="tp-stat-value">{stats.totale}</div>
          <div className="tp-stat-description">Eventi disponibili</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">In Programma</div>
          <div className="tp-stat-value">{stats.futuri}</div>
          <div className="tp-stat-description">Eventi futuri</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Nuovi Inviti</div>
          <div className="tp-stat-value">{stats.inviti_non_visualizzati}</div>
          <div className="tp-stat-description">Da visualizzare</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Registrazioni</div>
          <div className="tp-stat-value">{stats.registrati}</div>
          <div className="tp-stat-description">Ti sei registrato</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          In Programma
          {stats.futuri > 0 && <span className="tab-badge">{stats.futuri}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveTab('invites')}
        >
          I Miei Inviti
          {stats.inviti_non_visualizzati > 0 && <span className="tab-badge new">{stats.inviti_non_visualizzati}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Passati
        </button>
      </div>

      {/* Search */}
      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineMagnifyingGlass size={18} />
          <input
            type="text"
            placeholder="Cerca evento..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Events List */}
      <div className="events-container">
        {filteredEvents.length === 0 ? (
          <div className="empty-state-card">
            <HiOutlineCalendarDays size={48} />
            <h3>Nessun evento trovato</h3>
            <p>Non ci sono eventi in questa sezione</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event, idx) => (
              <div key={idx} className={`event-card ${event.is_past ? 'past' : ''}`}>
                <div className="event-card-header">
                  <div className="event-date-large">
                    <span className="day">{new Date(event.data_inizio).getDate()}</span>
                    <span className="month">{new Date(event.data_inizio).toLocaleDateString('it-IT', { month: 'short' })}</span>
                  </div>
                  <div className="event-header-info">
                    <span className="event-type-badge">{getEventTypeLabel(event.tipo)}</span>
                    {event.is_invited && !event.invitation_viewed && (
                      <span className="new-invite-badge">Nuovo Invito</span>
                    )}
                  </div>
                </div>

                <div className="event-card-body">
                  <h4 className="event-card-title">{event.titolo}</h4>

                  <div className="event-card-details">
                    <div className="detail-row">
                      <HiOutlineClock size={16} />
                      <span>{formatTime(event.data_inizio)}</span>
                      {event.data_fine && <span> - {formatTime(event.data_fine)}</span>}
                    </div>

                    {event.online ? (
                      <div className="detail-row">
                        <HiOutlineVideoCamera size={16} />
                        <span>Evento Online</span>
                      </div>
                    ) : event.luogo && (
                      <div className="detail-row">
                        <HiOutlineMapPin size={16} />
                        <span>{event.luogo}</span>
                      </div>
                    )}
                  </div>

                  {event.descrizione && (
                    <p className="event-description">{event.descrizione.substring(0, 120)}...</p>
                  )}
                </div>

                <div className="event-card-footer">
                  <div className="event-status-info">
                    {event.is_registered ? (
                      <span className="registration-status registered">
                        <HiOutlineCheckCircle size={16} />
                        Registrato
                      </span>
                    ) : event.richiede_iscrizione ? (
                      <span className="registration-status required">
                        <HiOutlineTicket size={16} />
                        Richiede iscrizione
                      </span>
                    ) : (
                      <span className="registration-status open">
                        <HiOutlineUsers size={16} />
                        Aperto a tutti
                      </span>
                    )}
                  </div>

                  {!event.is_past && (
                    <div className="event-actions">
                      {event.richiede_iscrizione && !event.is_registered ? (
                        <button
                          className="event-btn primary"
                          onClick={() => handleRegister(event.id)}
                        >
                          Registrati
                        </button>
                      ) : event.online && event.link_meeting ? (
                        <a
                          href={event.link_meeting}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="event-btn secondary"
                        >
                          Partecipa <HiOutlineArrowRight size={14} />
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>

                {!event.is_past && (
                  <div className="event-countdown">
                    {getDaysUntil(event.data_inizio)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SponsorEvents;
