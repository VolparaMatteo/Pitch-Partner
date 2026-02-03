import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaPlus, FaSearch, FaCalendarAlt, FaFutbol, FaBullseye, FaMapMarkerAlt,
  FaHome, FaPlane, FaClock, FaCheck, FaPause, FaTimes, FaFlag, FaTrashAlt,
  FaArrowRight, FaTicketAlt, FaTh, FaList, FaEye, FaPen, FaChevronDown,
  FaChevronLeft, FaChevronRight, FaLayerGroup, FaTrophy, FaSortAmountDown
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function MatchCalendar() {
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, matchId: null });
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({
    status: 'all',
    luogo: 'all'
  });
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [sortBy, setSortBy] = useState('date_asc');

  // Custom dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [luogoDropdownOpen, setLuogoDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const luogoDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Competition scroll state
  const competitionScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const isClub = user?.role === 'club';

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'Tutti gli stati', icon: FaLayerGroup, color: '#6B7280' },
    { value: 'programmata', label: 'Programmata', icon: FaCalendarAlt, color: '#3B82F6' },
    { value: 'confermata', label: 'Confermata', icon: FaCheck, color: '#10B981' },
    { value: 'in_corso', label: 'In Corso', icon: FaFutbol, color: '#F59E0B' },
    { value: 'completata', label: 'Completata', icon: FaFlag, color: '#10B981' },
    { value: 'rinviata', label: 'Rinviata', icon: FaPause, color: '#6B7280' },
    { value: 'annullata', label: 'Annullata', icon: FaTimes, color: '#EF4444' }
  ];

  const luogoOptions = [
    { value: 'all', label: 'Casa/Trasferta', icon: FaMapMarkerAlt, color: '#6B7280' },
    { value: 'casa', label: 'Solo Casa', icon: FaHome, color: '#10B981' },
    { value: 'trasferta', label: 'Solo Trasferta', icon: FaPlane, color: '#3B82F6' }
  ];

  const sortOptions = [
    { value: 'date_asc', label: 'Prossime', icon: FaCalendarAlt, color: '#10B981' },
    { value: 'date_desc', label: 'Passate', icon: FaCalendarAlt, color: '#6B7280' },
    { value: 'opponent_asc', label: 'Avversario A-Z', icon: FaFutbol, color: '#3B82F6' },
    { value: 'activations_desc', label: 'Attivazioni ↓', icon: FaBullseye, color: '#8B5CF6' }
  ];

  const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || options[0];

  // Scroll handlers
  const checkScrollArrows = () => {
    const el = competitionScrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  const scrollCompetitions = (direction) => {
    const el = competitionScrollRef.current;
    if (el) {
      const scrollAmount = 200;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener('resize', checkScrollArrows);
    return () => window.removeEventListener('resize', checkScrollArrows);
  }, [matches]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (luogoDropdownRef.current && !luogoDropdownRef.current.contains(e.target)) {
        setLuogoDropdownOpen(false);
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
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Errore nel caricamento delle partite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.matchId) return;

    try {
      await axios.delete(`${API_URL}/matches/${confirmModal.matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Partita eliminata con successo!', type: 'success' });
      setConfirmModal({ isOpen: false, matchId: null });
      fetchMatches();
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      setToast({ message: 'Errore nell\'eliminazione della partita', type: 'error' });
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      programmata: { label: 'Programmata', className: 'tp-badge-neutral' },
      confermata: { label: 'Confermata', className: 'tp-badge-success' },
      in_corso: { label: 'In Corso', className: 'tp-badge-warning' },
      completata: { label: 'Completata', className: 'tp-badge-success' },
      rinviata: { label: 'Rinviata', className: 'tp-badge-neutral' },
      annullata: { label: 'Annullata', className: 'tp-badge-error' }
    };
    return configs[status] || { label: status, className: 'tp-badge-neutral' };
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase(),
      time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  };

  // Get unique competitions
  const getUniqueCompetitions = () => {
    const competitions = matches
      .map(m => m.competizione)
      .filter(c => c && c.trim() !== '')
      .reduce((acc, comp) => {
        if (!acc.find(item => item.name === comp)) {
          acc.push({
            name: comp,
            count: matches.filter(m => m.competizione === comp).length
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.count - a.count);
    return competitions;
  };

  // Filter and Sort
  const applyFilters = (matchesList) => {
    return matchesList.filter(match => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          match.avversario?.toLowerCase().includes(searchLower) ||
          match.competizione?.toLowerCase().includes(searchLower) ||
          match.stadio?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.status !== 'all' && match.status !== filters.status) return false;
      if (filters.luogo !== 'all' && match.luogo !== filters.luogo) return false;
      if (selectedCompetition !== 'all' && match.competizione !== selectedCompetition) return false;
      return true;
    });
  };

  const applySorting = (matchesList) => {
    const sorted = [...matchesList];
    switch (sortBy) {
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.data_ora) - new Date(b.data_ora));
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.data_ora) - new Date(a.data_ora));
      case 'opponent_asc':
        return sorted.sort((a, b) => a.avversario.localeCompare(b.avversario));
      case 'activations_desc':
        return sorted.sort((a, b) => (b.attivazioni_count || 0) - (a.attivazioni_count || 0));
      default:
        return sorted;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.luogo !== 'all') count++;
    if (selectedCompetition !== 'all') count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({ status: 'all', luogo: 'all' });
    setSelectedCompetition('all');
    setSearchTerm('');
  };

  const filteredMatches = applySorting(applyFilters(matches));
  const activeFiltersCount = getActiveFiltersCount();
  const competitions = getUniqueCompetitions();

  // Stats
  const totalMatches = matches.length;
  const upcomingMatches = matches.filter(m => m.status === 'programmata' || m.status === 'confermata').length;
  const homeMatches = matches.filter(m => m.luogo === 'casa').length;
  const totalActivations = matches.reduce((sum, m) => sum + (m.attivazioni_count || 0), 0);

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento partite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Partite</h1>
          <p className="tp-page-subtitle">
            Gestisci il calendario delle partite e le attivazioni sponsor
          </p>
        </div>
        <div className="tp-page-actions">
          {isClub && (
            <>
              <button
                className="tp-btn tp-btn-outline"
                onClick={() => navigate('/club/business-boxes')}
              >
                <FaTicketAlt /> Business Box
              </button>
              <button
                className="tp-btn tp-btn-primary"
                onClick={() => navigate('/matches/new')}
              >
                <FaPlus /> Nuova Partita
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row - Same style as SponsorListPage */}
      <div className="tp-stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaFutbol style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{totalMatches}</div>
            <div className="tp-stat-label">Partite Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCalendarAlt style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{upcomingMatches}</div>
            <div className="tp-stat-label">Prossime Partite</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaHome style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{homeMatches}</div>
            <div className="tp-stat-label">Partite in Casa</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaBullseye style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{totalActivations}</div>
            <div className="tp-stat-label">Attivazioni Sponsor</div>
          </div>
        </div>
      </div>

      {/* Competitions Quick Filter */}
      {competitions.length > 0 && (
        <div className="tp-card" style={{ marginBottom: '24px' }}>
          <div className="tp-card-body" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 600, color: '#374151', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaTrophy style={{ color: '#6B7280' }} />
                Competizione:
              </span>
              <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                {showLeftArrow && (
                  <button
                    onClick={() => scrollCompetitions('left')}
                    style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      zIndex: 2, background: 'linear-gradient(90deg, white 60%, transparent)', border: 'none',
                      padding: '8px 16px 8px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                  >
                    <FaChevronLeft style={{ color: '#6B7280' }} />
                  </button>
                )}
                <div
                  ref={competitionScrollRef}
                  onScroll={checkScrollArrows}
                  style={{
                    display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none',
                    msOverflowStyle: 'none', padding: '4px 0'
                  }}
                >
                  <button
                    onClick={() => setSelectedCompetition('all')}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.2s',
                      background: selectedCompetition === 'all' ? '#1F2937' : '#F3F4F6',
                      color: selectedCompetition === 'all' ? '#FFFFFF' : '#4B5563'
                    }}
                  >
                    Tutte ({totalMatches})
                  </button>
                  {competitions.map((comp) => (
                    <button
                      key={comp.name}
                      onClick={() => setSelectedCompetition(comp.name)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.2s',
                        background: selectedCompetition === comp.name ? '#1F2937' : '#F3F4F6',
                        color: selectedCompetition === comp.name ? '#FFFFFF' : '#4B5563'
                      }}
                    >
                      {comp.name} ({comp.count})
                    </button>
                  ))}
                </div>
                {showRightArrow && (
                  <button
                    onClick={() => scrollCompetitions('right')}
                    style={{
                      position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                      zIndex: 2, background: 'linear-gradient(-90deg, white 60%, transparent)', border: 'none',
                      padding: '8px 4px 8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                  >
                    <FaChevronRight style={{ color: '#6B7280' }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Card with Filters and List */}
      <div className="tp-card">
        <div className="tp-card-header" style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <div className="tp-search-wrapper" style={{ minWidth: '200px' }}>
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca avversario, stadio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Status Dropdown */}
            <div ref={statusDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setLuogoDropdownOpen(false); setSortDropdownOpen(false); }}
                className={`tp-dropdown-trigger ${filters.status !== 'all' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                  background: filters.status !== 'all' ? '#EFF6FF' : '#F9FAFB', border: `1px solid ${filters.status !== 'all' ? '#3B82F6' : '#E5E7EB'}`,
                  borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                  color: filters.status !== 'all' ? '#1D4ED8' : '#374151'
                }}
              >
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
                      <button
                        key={opt.value}
                        onClick={() => { setFilters({ ...filters, status: opt.value }); setStatusDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px',
                          border: 'none', background: filters.status === opt.value ? '#F3F4F6' : 'transparent',
                          cursor: 'pointer', fontSize: '14px', textAlign: 'left', color: '#374151'
                        }}
                      >
                        <Icon style={{ color: opt.color }} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Luogo Dropdown */}
            <div ref={luogoDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setLuogoDropdownOpen(!luogoDropdownOpen); setStatusDropdownOpen(false); setSortDropdownOpen(false); }}
                className={`tp-dropdown-trigger ${filters.luogo !== 'all' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                  background: filters.luogo !== 'all' ? '#EFF6FF' : '#F9FAFB', border: `1px solid ${filters.luogo !== 'all' ? '#3B82F6' : '#E5E7EB'}`,
                  borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                  color: filters.luogo !== 'all' ? '#1D4ED8' : '#374151'
                }}
              >
                {(() => { const opt = getSelectedOption(luogoOptions, filters.luogo); const Icon = opt.icon; return <Icon style={{ color: opt.color }} />; })()}
                <span>{getSelectedOption(luogoOptions, filters.luogo).label}</span>
                <FaChevronDown style={{ fontSize: '10px', marginLeft: '4px' }} />
              </button>
              {luogoDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'white',
                  borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
                  zIndex: 50, minWidth: '160px', overflow: 'hidden'
                }}>
                  {luogoOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => { setFilters({ ...filters, luogo: opt.value }); setLuogoDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px',
                          border: 'none', background: filters.luogo === opt.value ? '#F3F4F6' : 'transparent',
                          cursor: 'pointer', fontSize: '14px', textAlign: 'left', color: '#374151'
                        }}
                      >
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
              <button
                onClick={() => { setSortDropdownOpen(!sortDropdownOpen); setStatusDropdownOpen(false); setLuogoDropdownOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                  background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151'
                }}
              >
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
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px',
                          border: 'none', background: sortBy === opt.value ? '#F3F4F6' : 'transparent',
                          cursor: 'pointer', fontSize: '14px', textAlign: 'left', color: '#374151'
                        }}
                      >
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
              <button
                className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Lista"
              >
                <FaList />
              </button>
              <button
                className={`tp-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Griglia"
              >
                <FaTh />
              </button>
            </div>
          </div>
        </div>

        <div className="tp-card-body">
          {/* Active Filters Badge */}
          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                {filteredMatches.length} partite trovate
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </div>
          )}

          {/* Matches Grid/List */}
          {filteredMatches.length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon"><FaFutbol /></div>
              <h3 className="tp-empty-title">Nessuna partita trovata</h3>
              <p className="tp-empty-description">
                {activeFiltersCount > 0 || searchTerm
                  ? 'Prova a modificare i filtri o i termini di ricerca'
                  : 'Inizia aggiungendo una nuova partita al calendario'}
              </p>
              {(activeFiltersCount > 0 || searchTerm) && (
                <button className="tp-btn tp-btn-outline" onClick={clearFilters}>
                  Rimuovi filtri
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="tp-grid">
              {filteredMatches.map((match) => {
                const dateInfo = formatDateShort(match.data_ora);
                const statusConfig = getStatusConfig(match.status);

                return (
                  <div key={match.id} className="tp-sponsor-card">
                    {/* Header */}
                    <div className="tp-sponsor-header">
                      <div className="tp-sponsor-logo" style={{ background: 'var(--tp-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--tp-dark)' }}>{dateInfo.day}</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tp-gray-500)', letterSpacing: '0.5px' }}>{dateInfo.month}</div>
                        </div>
                      </div>
                      <span className={`tp-badge ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="tp-sponsor-content">
                      <div className="tp-sponsor-sector">
                        {match.competizione || 'Partita'}
                      </div>
                      <h3 className="tp-sponsor-name">
                        {match.luogo === 'casa' ? `vs ${match.avversario}` : `@ ${match.avversario}`}
                      </h3>
                      <div className="tp-sponsor-tags">
                        <span className="tp-sponsor-tag">
                          {match.luogo === 'casa' ? <><FaHome style={{ marginRight: '4px' }} />Casa</> : <><FaPlane style={{ marginRight: '4px' }} />Trasferta</>}
                        </span>
                        <span className="tp-sponsor-tag">
                          <FaClock style={{ marginRight: '4px' }} />{dateInfo.time}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ padding: '12px 20px', borderTop: '1px solid var(--tp-gray-100)', display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaBullseye style={{ color: 'var(--tp-gray-400)', fontSize: '13px' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tp-dark)' }}>{match.attivazioni_count || 0}</span>
                        <span style={{ fontSize: '12px', color: 'var(--tp-gray-500)' }}>Attivazioni</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaTicketAlt style={{ color: 'var(--tp-gray-400)', fontSize: '13px' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tp-dark)' }}>{match.inviti_count || 0}</span>
                        <span style={{ fontSize: '12px', color: 'var(--tp-gray-500)' }}>Inviti</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="tp-sponsor-footer">
                      <div className="tp-sponsor-contact">
                        {match.stadio && (
                          <span className="tp-sponsor-contact-item">
                            <FaMapMarkerAlt style={{ marginRight: '4px' }} />
                            {match.stadio}
                          </span>
                        )}
                        {match.risultato && (
                          <span className="tp-sponsor-contact-item" style={{ fontWeight: 600 }}>
                            Risultato: {match.risultato}
                          </span>
                        )}
                      </div>
                      <div className="tp-sponsor-actions">
                        <button
                          className="tp-btn-icon tp-btn-icon-view"
                          onClick={() => navigate(`/matches/${match.id}`)}
                          title="Visualizza"
                        >
                          <FaEye />
                        </button>
                        {isClub && (
                          <button
                            className="tp-btn-icon tp-btn-icon-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({ isOpen: true, matchId: match.id });
                            }}
                            title="Elimina"
                          >
                            <FaTrashAlt />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW (Table) */
            <div className="tp-table-container">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Partita</th>
                    <th>Competizione</th>
                    <th>Stadio</th>
                    <th>Attivazioni</th>
                    <th>Status</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => {
                    const dateInfo = formatDateShort(match.data_ora);
                    const statusConfig = getStatusConfig(match.status);

                    return (
                      <tr key={match.id}>
                        <td>
                          <div className="tp-table-user-info">
                            <span className="tp-table-name">{dateInfo.day} {dateInfo.month}</span>
                            <span className="tp-table-sector">{dateInfo.time}</span>
                          </div>
                        </td>
                        <td>
                          <div className="tp-table-user">
                            <div className="tp-table-avatar" style={{ background: 'var(--tp-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {match.luogo === 'casa' ? <FaHome /> : <FaPlane />}
                            </div>
                            <div className="tp-table-user-info">
                              <span className="tp-table-name">vs {match.avversario}</span>
                              <span className="tp-table-sector">{match.luogo === 'casa' ? 'Casa' : 'Trasferta'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '14px', color: '#1f2937' }}>{match.competizione || '-'}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '14px', color: '#1f2937' }}>{match.stadio || '-'}</span>
                        </td>
                        <td>
                          <span className="tp-table-value">{match.attivazioni_count || 0}</span>
                        </td>
                        <td>
                          <span className={`tp-badge ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td>
                          <div className="tp-table-actions">
                            <button
                              className="tp-btn-icon tp-btn-icon-view"
                              onClick={() => navigate(`/matches/${match.id}`)}
                              title="Visualizza"
                            >
                              <FaEye />
                            </button>
                            {isClub && (
                              <button
                                className="tp-btn-icon tp-btn-icon-delete"
                                onClick={() => setConfirmModal({ isOpen: true, matchId: match.id })}
                                title="Elimina"
                              >
                                <FaTrashAlt />
                              </button>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, matchId: null })}
        title="Elimina Partita"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px', color: '#6B7280' }}>
            Sei sicuro di voler eliminare questa partita? Questa azione non può essere annullata.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="tp-btn tp-btn-outline"
              onClick={() => setConfirmModal({ isOpen: false, matchId: null })}
            >
              Annulla
            </button>
            <button
              className="tp-btn tp-btn-danger"
              onClick={handleDelete}
            >
              Elimina
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default MatchCalendar;
