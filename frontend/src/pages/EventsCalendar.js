import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import {
  FaCalendarAlt, FaSearch, FaTh, FaList, FaMapMarkerAlt, FaUsers, FaLaptop,
  FaClock, FaTrash, FaNewspaper, FaBriefcase, FaGlassCheers, FaHandshake,
  FaGraduationCap, FaGlobe, FaArrowRight, FaPlus, FaChevronDown, FaChevronLeft,
  FaChevronRight, FaLayerGroup, FaCheck, FaTimes, FaPause, FaEye, FaTrashAlt,
  FaSortAmountDown, FaFlag
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const EventsCalendar = () => {
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, eventId: null });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('date_asc');

  // Custom dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Type scroll state
  const typeScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const isClub = user?.role === 'club';

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'Tutti gli status', icon: FaLayerGroup, color: '#6B7280' },
    { value: 'programmato', label: 'Programmato', icon: FaCalendarAlt, color: '#3B82F6' },
    { value: 'confermato', label: 'Confermato', icon: FaCheck, color: '#10B981' },
    { value: 'in_corso', label: 'In Corso', icon: FaClock, color: '#F59E0B' },
    { value: 'completato', label: 'Completato', icon: FaFlag, color: '#6B7280' },
    { value: 'annullato', label: 'Annullato', icon: FaTimes, color: '#EF4444' }
  ];

  const sortOptions = [
    { value: 'date_asc', label: 'Prossimi', icon: FaCalendarAlt, color: '#10B981' },
    { value: 'date_desc', label: 'Passati', icon: FaCalendarAlt, color: '#6B7280' },
    { value: 'title_asc', label: 'Titolo A-Z', icon: FaNewspaper, color: '#3B82F6' },
    { value: 'participants_desc', label: 'Partecipanti ↓', icon: FaUsers, color: '#8B5CF6' }
  ];

  const eventTypes = [
    { value: 'ufficio_stampa', label: 'Ufficio Stampa', icon: FaNewspaper },
    { value: 'presentazione_commerciale', label: 'Presentazione', icon: FaBriefcase },
    { value: 'brand_event', label: 'Brand Event', icon: FaGlassCheers },
    { value: 'meeting', label: 'Meeting', icon: FaHandshake },
    { value: 'formazione', label: 'Formazione', icon: FaGraduationCap },
    { value: 'networking', label: 'Networking', icon: FaGlobe },
    { value: 'altro', label: 'Altro', icon: FaCalendarAlt }
  ];

  const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || options[0];

  // Scroll handlers
  const checkScrollArrows = () => {
    const el = typeScrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  const scrollTypes = (direction) => {
    const el = typeScrollRef.current;
    if (el) {
      const scrollAmount = 200;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener('resize', checkScrollArrows);
    return () => window.removeEventListener('resize', checkScrollArrows);
  }, [events]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    const now = new Date();
    const nextEvent = events
      .filter(e => {
        const eventDate = new Date(e.data_ora_inizio);
        return eventDate >= now && (e.status === 'programmato' || e.status === 'confermato');
      })
      .sort((a, b) => new Date(a.data_ora_inizio) - new Date(b.data_ora_inizio))[0];

    if (!nextEvent) return;

    const calculateCountdown = () => {
      const eventDate = new Date(nextEvent.data_ora_inizio);
      const now = new Date();
      const difference = eventDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [events]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data.events || response.data || []);
    } catch (error) {
      console.error('Errore nel caricamento degli eventi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.eventId) return;

    try {
      await axios.delete(`${API_URL}/events/${confirmModal.eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Evento eliminato con successo!', type: 'success' });
      setConfirmModal({ isOpen: false, eventId: null });
      fetchEvents();
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      setToast({ message: 'Errore nell\'eliminazione dell\'evento', type: 'error' });
    }
  };

  const getEventTypeIcon = (tipo) => {
    const found = eventTypes.find(t => t.value === tipo);
    return found ? <found.icon /> : <FaCalendarAlt />;
  };

  const getEventTypeLabel = (tipo) => {
    const found = eventTypes.find(t => t.value === tipo);
    return found ? found.label : tipo;
  };

  const getStatusConfig = (status) => {
    const configs = {
      programmato: { label: 'Programmato', className: 'tp-badge-neutral' },
      confermato: { label: 'Confermato', className: 'tp-badge-success' },
      in_corso: { label: 'In Corso', className: 'tp-badge-warning' },
      completato: { label: 'Completato', className: 'tp-badge-success' },
      annullato: { label: 'Annullato', className: 'tp-badge-error' }
    };
    return configs[status] || { label: status, className: 'tp-badge-neutral' };
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase(),
      time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
  };

  // Get unique types with counts
  const getTypeCounts = () => {
    return eventTypes.map(type => ({
      ...type,
      count: events.filter(e => e.tipo === type.value).length
    })).filter(t => t.count > 0);
  };

  // Filter and Sort
  const applyFilters = (eventsList) => {
    return eventsList.filter(event => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          event.titolo?.toLowerCase().includes(searchLower) ||
          event.descrizione?.toLowerCase().includes(searchLower) ||
          event.luogo?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.status !== 'all' && event.status !== filters.status) return false;
      if (selectedType !== 'all' && event.tipo !== selectedType) return false;
      return true;
    });
  };

  const applySorting = (eventsList) => {
    const sorted = [...eventsList];
    switch (sortBy) {
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.data_ora_inizio) - new Date(b.data_ora_inizio));
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.data_ora_inizio) - new Date(a.data_ora_inizio));
      case 'title_asc':
        return sorted.sort((a, b) => (a.titolo || '').localeCompare(b.titolo || ''));
      case 'participants_desc':
        return sorted.sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0));
      default:
        return sorted;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (selectedType !== 'all') count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({ status: 'all' });
    setSelectedType('all');
    setSearchTerm('');
  };

  const filteredEvents = applySorting(applyFilters(events));
  const activeFiltersCount = getActiveFiltersCount();
  const typeCounts = getTypeCounts();

  // Stats
  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => e.status === 'programmato' || e.status === 'confermato').length;
  const completedEvents = events.filter(e => e.status === 'completato').length;
  const totalParticipants = events.reduce((sum, e) => sum + (e.participants_count || 0), 0);

  // Next event
  const now = new Date();
  const nextEvent = events
    .filter(e => {
      const eventDate = new Date(e.data_ora_inizio);
      return eventDate >= now && (e.status === 'programmato' || e.status === 'confermato');
    })
    .sort((a, b) => new Date(a.data_ora_inizio) - new Date(b.data_ora_inizio))[0];

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento eventi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Eventi</h1>
          <p className="tp-page-subtitle">
            Gestisci gli eventi del club e le attività con gli sponsor
          </p>
        </div>
        <div className="tp-page-actions">
          {isClub && (
            <button
              className="tp-btn tp-btn-primary"
              onClick={() => navigate('/events/new')}
            >
              <FaPlus /> Nuovo Evento
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="tp-stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCalendarAlt style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{totalEvents}</div>
            <div className="tp-stat-label">Eventi Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaClock style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{upcomingEvents}</div>
            <div className="tp-stat-label">Prossimi Eventi</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCheck style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{completedEvents}</div>
            <div className="tp-stat-label">Completati</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaUsers style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{totalParticipants}</div>
            <div className="tp-stat-label">Partecipanti Totali</div>
          </div>
        </div>
      </div>

      {/* Next Event Banner */}
      {nextEvent && (
        <div className="tp-alert-card" style={{ cursor: 'pointer', marginBottom: '24px' }} onClick={() => navigate(`/events/${nextEvent.id}`)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px', background: '#1F2937',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0
            }}>
              <span style={{ color: '#FFFFFF' }}>{getEventTypeIcon(nextEvent.tipo)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="tp-badge tp-badge-dark">Prossimo Evento</span>
                <span className={`tp-badge ${getStatusConfig(nextEvent.status).className}`}>
                  {getStatusConfig(nextEvent.status).label}
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px 0' }}>
                {nextEvent.titolo}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6B7280' }}>
                {nextEvent.online ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaLaptop /> Online</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaMapMarkerAlt /> {nextEvent.luogo || 'In presenza'}</span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaCalendarAlt /> {formatDateShort(nextEvent.data_ora_inizio).full}
                </span>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
              background: '#F3F4F6', borderRadius: '12px', flexShrink: 0
            }}>
              {[
                { value: countdown.days, label: 'g' },
                { value: countdown.hours, label: 'h' },
                { value: countdown.minutes, label: 'm' },
                { value: countdown.seconds, label: 's' }
              ].map((item, idx) => (
                <div key={idx} style={{ textAlign: 'center', minWidth: '36px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', lineHeight: 1 }}>
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{item.label}</div>
                </div>
              ))}
            </div>
            <button className="tp-btn tp-btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/events/${nextEvent.id}`); }}>
              Dettagli <FaArrowRight style={{ marginLeft: '6px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Type Quick Filter */}
      {typeCounts.length > 0 && (
        <div className="tp-card" style={{ marginBottom: '24px' }}>
          <div className="tp-card-body" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 600, color: '#374151', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCalendarAlt style={{ color: '#6B7280' }} />
                Tipo:
              </span>
              <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                {showLeftArrow && (
                  <button onClick={() => scrollTypes('left')} style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                    background: 'linear-gradient(90deg, white 60%, transparent)', border: 'none',
                    padding: '8px 16px 8px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}>
                    <FaChevronLeft style={{ color: '#6B7280' }} />
                  </button>
                )}
                <div ref={typeScrollRef} onScroll={checkScrollArrows} style={{
                  display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '4px 0'
                }}>
                  <button onClick={() => setSelectedType('all')} style={{
                    padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.2s',
                    background: selectedType === 'all' ? '#1F2937' : '#F3F4F6',
                    color: selectedType === 'all' ? '#FFFFFF' : '#4B5563'
                  }}>
                    Tutti ({totalEvents})
                  </button>
                  {typeCounts.map((type) => (
                    <button key={type.value} onClick={() => setSelectedType(type.value)} style={{
                      padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.2s',
                      background: selectedType === type.value ? '#1F2937' : '#F3F4F6',
                      color: selectedType === type.value ? '#FFFFFF' : '#4B5563',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      <type.icon style={{ fontSize: '12px' }} />
                      {type.label} ({type.count})
                    </button>
                  ))}
                </div>
                {showRightArrow && (
                  <button onClick={() => scrollTypes('right')} style={{
                    position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                    background: 'linear-gradient(-90deg, white 60%, transparent)', border: 'none',
                    padding: '8px 4px 8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}>
                    <FaChevronRight style={{ color: '#6B7280' }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="tp-card">
        <div className="tp-card-header" style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <div className="tp-search-wrapper" style={{ minWidth: '200px' }}>
              <input type="text" className="tp-search-input" placeholder="Cerca eventi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Status Dropdown */}
            <div ref={statusDropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setSortDropdownOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                  background: filters.status !== 'all' ? '#EFF6FF' : '#F9FAFB',
                  border: `1px solid ${filters.status !== 'all' ? '#3B82F6' : '#E5E7EB'}`,
                  borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                  color: filters.status !== 'all' ? '#1D4ED8' : '#374151'
                }}>
                {(() => { const opt = getSelectedOption(statusOptions, filters.status); const Icon = opt.icon; return <Icon style={{ color: opt.color }} />; })()}
                <span>{getSelectedOption(statusOptions, filters.status).label}</span>
                <FaChevronDown style={{ fontSize: '10px', marginLeft: '4px' }} />
              </button>
              {statusDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'white',
                  borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
                  zIndex: 50, minWidth: '180px', overflow: 'hidden'
                }}>
                  {statusOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.value} onClick={() => { setFilters({ ...filters, status: opt.value }); setStatusDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px',
                          border: 'none', background: filters.status === opt.value ? '#F3F4F6' : 'transparent',
                          cursor: 'pointer', fontSize: '14px', textAlign: 'left', color: '#374151'
                        }}>
                        <Icon style={{ color: opt.color }} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sort Dropdown */}
            <div ref={sortDropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => { setSortDropdownOpen(!sortDropdownOpen); setStatusDropdownOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                  background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151'
                }}>
                <FaSortAmountDown style={{ color: '#6B7280' }} />
                <span>{getSelectedOption(sortOptions, sortBy).label}</span>
                <FaChevronDown style={{ fontSize: '10px', marginLeft: '4px' }} />
              </button>
              {sortDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'white',
                  borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
                  zIndex: 50, minWidth: '180px', overflow: 'hidden'
                }}>
                  {sortOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px',
                          border: 'none', background: sortBy === opt.value ? '#F3F4F6' : 'transparent',
                          cursor: 'pointer', fontSize: '14px', textAlign: 'left', color: '#374151'
                        }}>
                        <Icon style={{ color: opt.color }} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="tp-view-toggle">
              <button className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Lista">
                <FaList />
              </button>
              <button className={`tp-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Griglia">
                <FaTh />
              </button>
            </div>
          </div>
        </div>

        <div className="tp-card-body">
          {/* Active Filters */}
          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                {filteredEvents.length} eventi trovati
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>Rimuovi filtri</button>
            </div>
          )}

          {/* Events Grid/List */}
          {filteredEvents.length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon"><FaCalendarAlt /></div>
              <h3 className="tp-empty-title">Nessun evento trovato</h3>
              <p className="tp-empty-description">
                {activeFiltersCount > 0 || searchTerm ? 'Prova a modificare i filtri' : 'Inizia creando il tuo primo evento'}
              </p>
              {(activeFiltersCount > 0 || searchTerm) && (
                <button className="tp-btn tp-btn-outline" onClick={clearFilters}>Rimuovi filtri</button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="tp-grid">
              {filteredEvents.map((event) => {
                const dateInfo = formatDateShort(event.data_ora_inizio);
                const statusConfig = getStatusConfig(event.status);

                return (
                  <div key={event.id} className="tp-sponsor-card">
                    <div className="tp-sponsor-header">
                      <div className="tp-sponsor-logo" style={{ background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        <span style={{ color: '#FFFFFF' }}>{getEventTypeIcon(event.tipo)}</span>
                      </div>
                      <span className={`tp-badge ${statusConfig.className}`}>{statusConfig.label}</span>
                    </div>
                    <div className="tp-sponsor-content">
                      <div className="tp-sponsor-sector">{getEventTypeLabel(event.tipo)}</div>
                      <h3 className="tp-sponsor-name">{event.titolo}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F3F4F6', borderRadius: '10px', marginBottom: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', lineHeight: 1 }}>{dateInfo.day}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>{dateInfo.month}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaClock /> {dateInfo.time}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            {event.online ? <><FaLaptop /> Online</> : <><FaMapMarkerAlt /> {event.luogo || 'In presenza'}</>}
                          </div>
                        </div>
                      </div>
                      <div className="tp-sponsor-tags">
                        <span className="tp-sponsor-tag"><FaUsers style={{ marginRight: '4px' }} />{event.participants_count || 0} partecipanti</span>
                      </div>
                    </div>
                    <div className="tp-sponsor-footer">
                      <div className="tp-sponsor-contact"></div>
                      <div className="tp-sponsor-actions">
                        <button className="tp-btn-icon tp-btn-icon-view" onClick={() => navigate(`/events/${event.id}`)} title="Visualizza"><FaEye /></button>
                        {isClub && (
                          <button className="tp-btn-icon tp-btn-icon-delete" onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, eventId: event.id }); }} title="Elimina"><FaTrashAlt /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="tp-table-container">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Data</th>
                    <th>Luogo</th>
                    <th>Partecipanti</th>
                    <th>Status</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => {
                    const dateInfo = formatDateShort(event.data_ora_inizio);
                    const statusConfig = getStatusConfig(event.status);

                    return (
                      <tr key={event.id}>
                        <td>
                          <div className="tp-table-user">
                            <div className="tp-table-avatar" style={{ background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#FFFFFF' }}>{getEventTypeIcon(event.tipo)}</span>
                            </div>
                            <div className="tp-table-user-info">
                              <span className="tp-table-name">{event.titolo}</span>
                              <span className="tp-table-sector">{getEventTypeLabel(event.tipo)}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="tp-table-user-info">
                            <span className="tp-table-name">{dateInfo.day} {dateInfo.month}</span>
                            <span className="tp-table-sector">{dateInfo.time}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '14px', color: '#4B5563' }}>
                            {event.online ? 'Online' : (event.luogo || 'In presenza')}
                          </span>
                        </td>
                        <td><span className="tp-table-value">{event.participants_count || 0}</span></td>
                        <td><span className={`tp-badge ${statusConfig.className}`}>{statusConfig.label}</span></td>
                        <td>
                          <div className="tp-table-actions">
                            <button className="tp-btn-icon tp-btn-icon-view" onClick={() => navigate(`/events/${event.id}`)} title="Visualizza"><FaEye /></button>
                            {isClub && (
                              <button className="tp-btn-icon tp-btn-icon-delete" onClick={() => setConfirmModal({ isOpen: true, eventId: event.id })} title="Elimina"><FaTrashAlt /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, eventId: null })} title="Elimina Evento">
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px', color: '#6B7280' }}>
            Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="tp-btn tp-btn-outline" onClick={() => setConfirmModal({ isOpen: false, eventId: null })}>Annulla</button>
            <button className="tp-btn tp-btn-danger" onClick={handleDelete}>Elimina</button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EventsCalendar;
