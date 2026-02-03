import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import {
  FaSearch, FaList, FaTh, FaEye, FaPlus,
  FaBuilding, FaCheck, FaTimes, FaPause,
  FaInbox, FaEuroSign, FaChevronDown,
  FaFilter, FaCrown, FaRocket,
  FaChevronLeft, FaChevronRight,
  FaCalendarAlt
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Stati abbonamento
const SUBSCRIPTION_STATUS = [
  { id: 'all', label: 'Tutti', icon: <FaFilter />, color: '#6B7280', bg: '#F3F4F6' },
  { id: 'active', label: 'Attivo', icon: <FaCheck />, color: '#059669', bg: '#ECFDF5' },
  { id: 'trial', label: 'Trial', icon: <FaRocket />, color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'expired', label: 'Scaduto', icon: <FaTimes />, color: '#DC2626', bg: '#FEF2F2' },
  { id: 'suspended', label: 'Sospeso', icon: <FaPause />, color: '#6366F1', bg: '#EEF2FF' }
];

// Piani
const PLANS = [
  { id: 'all', label: 'Tutti i piani', color: '#6B7280' },
  { id: 'trial', label: 'Trial', color: '#F59E0B' },
  { id: 'base', label: 'Base', color: '#3B82F6' },
  { id: 'pro', label: 'Pro', color: '#8B5CF6' },
  { id: 'enterprise', label: 'Enterprise', color: '#059669' }
];

function AdminClubListPage() {
  const [clubs, setClubs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', plan: 'all' });
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  // Custom dropdown states
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Refs
  const statusDropdownRef = useRef(null);
  const planDropdownRef = useRef(null);
  const listRef = useRef(null);

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(e.target)) {
        setPlanDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch clubs e stats in parallelo
      const [clubsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/clubs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/clubs/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: null }))
      ]);

      setClubs(Array.isArray(clubsRes.data) ? clubsRes.data : []);
      setStats(statsRes.data);

    } catch (error) {
      console.error('Errore:', error);
      setClubs([]);
      setToast({ message: 'Errore nel caricamento dei club', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredClubs = () => {
    return clubs.filter(club => {
      // Search
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!club.nome?.toLowerCase().includes(s) &&
            !club.email?.toLowerCase().includes(s) &&
            !club.tipologia?.toLowerCase().includes(s)) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'active' && !club.account_attivo) return false;
        if (filters.status === 'expired' && club.licenza_valida) return false;
        if (filters.status === 'suspended' && club.account_attivo) return false;
        // trial check - questo richiederebbe dati subscription
      }

      // Plan filter (richiede dati subscription)
      // Per ora filtriamo su nome_abbonamento
      if (filters.plan !== 'all') {
        const planName = club.nome_abbonamento?.toLowerCase() || '';
        if (!planName.includes(filters.plan)) return false;
      }

      return true;
    });
  };

  const clearFilters = () => {
    setFilters({ status: 'all', plan: 'all' });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.plan !== 'all') count++;
    return count;
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredClubs = getFilteredClubs();
  const activeFiltersCount = getActiveFiltersCount();

  // Pagination calculations
  const totalPages = Math.ceil(filteredClubs.length / itemsPerPage);
  const paginatedClubs = filteredClubs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const getSelectedStatus = () => SUBSCRIPTION_STATUS.find(s => s.id === filters.status) || SUBSCRIPTION_STATUS[0];
  const getSelectedPlan = () => PLANS.find(p => p.id === filters.plan) || PLANS[0];

  const getStatusBadge = (club) => {
    if (!club.account_attivo) {
      return { label: 'Sospeso', color: '#6366F1', bg: '#EEF2FF' };
    }
    if (!club.licenza_valida) {
      return { label: 'Scaduto', color: '#DC2626', bg: '#FEF2F2' };
    }
    // Check if trial (nome_abbonamento contains 'trial')
    if (club.nome_abbonamento?.toLowerCase().includes('trial')) {
      return { label: 'Trial', color: '#F59E0B', bg: '#FFFBEB' };
    }
    return { label: 'Attivo', color: '#059669', bg: '#ECFDF5' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento Club...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <h1 className="tp-page-title">Gestione Club</h1>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/admin/clubs/new')}
          >
            <FaPlus /> Nuovo Club
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="tp-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaBuilding style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{stats.active_clubs || 0}</div>
              <div className="tp-stat-label">Club Attivi</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaRocket style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{stats.trial_clubs || 0}</div>
              <div className="tp-stat-label">In Trial</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaTimes style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{stats.expired_subscriptions || 0}</div>
              <div className="tp-stat-label">Scaduti</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaEuroSign style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">€{(stats.mrr || 0).toLocaleString()}</div>
              <div className="tp-stat-label">MRR</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Card with Filters */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Status Dropdown */}
            <div ref={statusDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setPlanDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: filters.status !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filters.status !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedStatus();
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '12px'
                      }}>
                        {selected.icon}
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown
                        size={12}
                        color="#6B7280"
                        style={{
                          transition: 'transform 0.2s',
                          transform: statusDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>
              {statusDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '200px', overflow: 'hidden'
                }}>
                  {SUBSCRIPTION_STATUS.map(option => {
                    const isSelected = filters.status === option.id;
                    return (
                      <div
                        key={option.id}
                        onClick={() => {
                          setFilters({ ...filters, status: option.id });
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', cursor: 'pointer',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '14px'
                        }}>
                          {option.icon}
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Plan Dropdown */}
            <div ref={planDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setPlanDropdownOpen(!planDropdownOpen);
                  setStatusDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: filters.plan !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filters.plan !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedPlan();
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FaCrown size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown
                        size={12}
                        color="#6B7280"
                        style={{
                          transition: 'transform 0.2s',
                          transform: planDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>
              {planDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '200px', overflow: 'hidden'
                }}>
                  {PLANS.map(option => {
                    const isSelected = filters.plan === option.id;
                    return (
                      <div
                        key={option.id}
                        onClick={() => {
                          setFilters({ ...filters, plan: option.id });
                          setPlanDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', cursor: 'pointer',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <FaCrown size={14} color="white" />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="tp-card-header-right">
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
                className={`tp-view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Cards"
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
                {filteredClubs.length} club trovati
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <>
              <div className="tp-table-container" ref={listRef}>
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th>Club</th>
                      <th>Piano</th>
                      <th>Stato</th>
                      <th>Scadenza</th>
                      <th>MRR</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClubs.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                          <FaInbox size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                          <p>Nessun club trovato</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedClubs.map(club => {
                        const statusBadge = getStatusBadge(club);
                        return (
                          <tr key={club.id} onClick={() => navigate(`/admin/clubs/${club.id}`)} style={{ cursor: 'pointer' }}>
                            <td>
                              <div className="tp-table-user">
                                <div className="tp-table-avatar" style={{ borderRadius: '50%' }}>
                                  {club.logo_url ? (
                                    <img
                                      src={getImageUrl(club.logo_url)}
                                      alt={club.nome}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    />
                                  ) : (
                                    <FaBuilding size={18} color="#9CA3AF" />
                                  )}
                                </div>
                                <div className="tp-table-user-info">
                                  <span className="tp-table-name">{club.nome}</span>
                                  <span className="tp-table-sector">{club.tipologia || 'Sport Club'}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {club.nome_abbonamento ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: '#F3F4F6',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: '#374151'
                                }}>
                                  <FaCrown size={10} color="#F59E0B" />
                                  {club.nome_abbonamento}
                                </span>
                              ) : (
                                <span style={{ color: '#9CA3AF' }}>-</span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                background: statusBadge.bg,
                                color: statusBadge.color,
                                fontSize: '12px',
                                fontWeight: 500
                              }}>
                                {statusBadge.label === 'Attivo' && <FaCheck size={10} />}
                                {statusBadge.label === 'Trial' && <FaRocket size={10} />}
                                {statusBadge.label === 'Scaduto' && <FaTimes size={10} />}
                                {statusBadge.label === 'Sospeso' && <FaPause size={10} />}
                                {statusBadge.label}
                              </span>
                            </td>
                            <td>
                              <div className="tp-table-user-info">
                                <span style={{ fontSize: '14px', color: '#1f2937' }}>
                                  {formatDate(club.data_scadenza_licenza)}
                                </span>
                                {club.data_scadenza_licenza && (
                                  <span style={{
                                    fontSize: '12px',
                                    color: new Date(club.data_scadenza_licenza) < new Date() ? '#DC2626' : '#6b7280'
                                  }}>
                                    {new Date(club.data_scadenza_licenza) < new Date() ? 'Scaduto' : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {club.costo_abbonamento ? (
                                <span style={{ fontWeight: 600, color: '#059669' }}>
                                  €{club.costo_abbonamento.toLocaleString()}
                                  <span style={{ fontWeight: 400, color: '#6B7280', fontSize: '12px' }}>/mese</span>
                                </span>
                              ) : (
                                <span style={{ color: '#9CA3AF' }}>-</span>
                              )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="tp-table-actions">
                                <button
                                  className="tp-btn-icon tp-btn-icon-view"
                                  onClick={() => navigate(`/admin/clubs/${club.id}`)}
                                  title="Visualizza"
                                >
                                  <FaEye />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="tp-pagination">
                  <button
                    className="tp-pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="tp-pagination-info">
                    Pagina {currentPage} di {totalPages}
                  </span>
                  <button
                    className="tp-pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}

          {/* CARDS VIEW */}
          {viewMode === 'cards' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
              padding: '20px 0'
            }}>
              {paginatedClubs.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                  <FaInbox size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>Nessun club trovato</p>
                </div>
              ) : (
                paginatedClubs.map(club => {
                  const statusBadge = getStatusBadge(club);
                  return (
                    <div
                      key={club.id}
                      onClick={() => navigate(`/admin/clubs/${club.id}`)}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: club.logo_url ? 'white' : 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                          border: '2px solid #E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {club.logo_url ? (
                            <img
                              src={getImageUrl(club.logo_url)}
                              alt={club.nome}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <FaBuilding size={24} color="#9CA3AF" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                            {club.nome}
                          </h3>
                          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6B7280' }}>
                            {club.tipologia || 'Sport Club'}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        padding: '16px 0',
                        borderTop: '1px solid #F3F4F6',
                        borderBottom: '1px solid #F3F4F6'
                      }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Piano
                          </span>
                          <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                            {club.nome_abbonamento || '-'}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            MRR
                          </span>
                          <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600, color: '#059669' }}>
                            {club.costo_abbonamento ? `€${club.costo_abbonamento}` : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}>
                          <FaCalendarAlt size={10} />
                          Scade: {formatDate(club.data_scadenza_licenza)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/clubs/${club.id}`);
                          }}
                          style={{
                            background: '#F3F4F6',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FaEye size={10} /> Dettagli
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

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

export default AdminClubListPage;
