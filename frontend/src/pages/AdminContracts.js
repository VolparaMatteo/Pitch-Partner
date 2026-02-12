import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import {
  FaSearch, FaList, FaTh, FaEye, FaPlus, FaTrash,
  FaCheck, FaTimes, FaClock,
  FaInbox, FaChevronDown,
  FaFilter, FaCrown, FaRedo,
  FaChevronLeft, FaChevronRight,
  FaCalendarAlt, FaExclamationTriangle, FaBuilding, FaFileContract
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Stati contratto
const CONTRACT_STATUS = [
  { id: 'all', label: 'Tutti', icon: <FaFilter />, color: '#6B7280', bg: '#F3F4F6' },
  { id: 'active', label: 'Attivo', icon: <FaCheck />, color: '#059669', bg: '#ECFDF5' },
  { id: 'draft', label: 'Bozza', icon: <FaClock />, color: '#6B7280', bg: '#F3F4F6' },
  { id: 'expired', label: 'Scaduto', icon: <FaTimes />, color: '#DC2626', bg: '#FEF2F2' },
  { id: 'renewed', label: 'Rinnovato', icon: <FaRedo />, color: '#3B82F6', bg: '#EFF6FF' }
];

// Piani
const PLANS = [
  { id: 'all', label: 'Tutti i piani', color: '#6B7280' },
  { id: 'Basic', label: 'Basic', color: '#6B7280' },
  { id: 'Premium', label: 'Premium', color: '#3B82F6' },
  { id: 'Elite', label: 'Elite', color: '#F59E0B' }
];

const PLAN_COLORS = {
  basic: { bg: '#F9FAFB', color: '#6B7280' },
  Basic: { bg: '#F9FAFB', color: '#6B7280' },
  premium: { bg: '#EFF6FF', color: '#3B82F6' },
  Premium: { bg: '#EFF6FF', color: '#3B82F6' },
  elite: { bg: '#FFFBEB', color: '#F59E0B' },
  Elite: { bg: '#FFFBEB', color: '#F59E0B' }
};

function AdminContracts() {
  const [contracts, setContracts] = useState([]);
  const [clubsWithoutContract, setClubsWithoutContract] = useState([]);
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
      const headers = { Authorization: `Bearer ${token}` };

      const [contractsRes, clubsRes] = await Promise.all([
        fetch(`${API_URL}/admin/contracts`, { headers }),
        fetch(`${API_URL}/admin/contracts/clubs-without-contract`, { headers }).catch(() => ({ ok: false }))
      ]);

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data.contracts || []);
      }

      if (clubsRes.ok) {
        const data = await clubsRes.json();
        setClubsWithoutContract(data.clubs || []);
      }

    } catch (error) {
      console.error('Errore:', error);
      setContracts([]);
      setToast({ message: 'Errore nel caricamento dei contratti', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (contractId, e) => {
    e.stopPropagation();
    if (!window.confirm('Sei sicuro di voler eliminare questo contratto?')) return;

    try {
      const response = await fetch(`${API_URL}/admin/contracts/${contractId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setToast({ message: 'Contratto eliminato', type: 'success' });
        fetchData();
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Errore nell\'eliminazione', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Errore nell\'eliminazione', type: 'error' });
    }
  };

  const getFilteredContracts = () => {
    return contracts.filter(contract => {
      // Search
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!contract.club_name?.toLowerCase().includes(s) &&
            !contract.plan_type?.toLowerCase().includes(s)) return false;
      }

      // Status filter
      if (filters.status !== 'all' && contract.status !== filters.status) return false;

      // Plan filter
      if (filters.plan !== 'all' && contract.plan_type !== filters.plan) return false;

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

  const filteredContracts = getFilteredContracts();
  const activeFiltersCount = getActiveFiltersCount();

  // Pagination calculations
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const getSelectedStatus = () => CONTRACT_STATUS.find(s => s.id === filters.status) || CONTRACT_STATUS[0];
  const getSelectedPlan = () => PLANS.find(p => p.id === filters.plan) || PLANS[0];

  const getStatusBadge = (status) => {
    const statusConfig = CONTRACT_STATUS.find(s => s.id === status);
    if (statusConfig) {
      return { label: statusConfig.label, color: statusConfig.color, bg: statusConfig.bg, icon: statusConfig.icon };
    }
    return { label: status, color: '#6B7280', bg: '#F3F4F6', icon: <FaClock /> };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento Contratti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <h1 className="tp-page-title">Gestione Contratti</h1>
        <div className="tp-page-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/admin/contract-templates')}
          >
            <FaFileContract /> Template
          </button>
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/admin/contratti/new')}
          >
            <FaPlus /> Nuovo Contratto
          </button>
        </div>
      </div>

      {/* Clubs without contract alert */}
      {clubsWithoutContract.length > 0 && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FaExclamationTriangle color="#D97706" />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, color: '#92400E' }}>
              {clubsWithoutContract.length} club senza contratto attivo:
            </span>
            <span style={{ color: '#B45309', marginLeft: '8px' }}>
              {clubsWithoutContract.map(c => c.nome).join(', ')}
            </span>
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
                placeholder="Cerca contratto..."
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
                  {CONTRACT_STATUS.map(option => {
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
                {filteredContracts.length} contratti trovati
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
                      <th>Valore</th>
                      <th>Periodo</th>
                      <th>Stato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedContracts.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <FaInbox size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p>Nessun contratto trovato</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedContracts.map(contract => {
                        const statusBadge = getStatusBadge(contract.status);
                        const planColors = PLAN_COLORS[contract.plan_type] || PLAN_COLORS.Basic;
                        return (
                          <tr key={contract.id} onClick={() => navigate(`/admin/contratti/${contract.id}`)} style={{ cursor: 'pointer' }}>
                            <td>
                              <div className="tp-table-user">
                                <div className="tp-table-avatar" style={{ borderRadius: '50%' }}>
                                  {contract.club_logo_url ? (
                                    <img
                                      src={getImageUrl(contract.club_logo_url)}
                                      alt={contract.club_name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>
                                      {contract.club_name?.charAt(0) || '?'}
                                    </span>
                                  )}
                                </div>
                                <div className="tp-table-user-info">
                                  <span className="tp-table-name">{contract.club_name}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: planColors.bg,
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: planColors.color,
                                  width: 'fit-content'
                                }}>
                                  <FaCrown size={10} />
                                  {contract.plan_type}
                                </span>
                                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                  {contract.addons?.length > 0 ? `+${contract.addons.length} addon` : 'Nessun addon'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: '#059669' }}>
                                {formatCurrency(contract.total_value_with_vat || contract.total_value)}
                              </span>
                              <span style={{ fontWeight: 400, color: '#6B7280', fontSize: '12px' }}>/anno</span>
                            </td>
                            <td>
                              <div className="tp-table-user-info">
                                <span style={{ fontSize: '14px', color: '#1f2937' }}>
                                  {formatDate(contract.start_date)}
                                </span>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                  → {formatDate(contract.end_date)}
                                </span>
                              </div>
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
                                {statusBadge.icon}
                                {statusBadge.label}
                              </span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="tp-table-actions">
                                <button
                                  className="tp-btn-icon tp-btn-icon-view"
                                  onClick={() => navigate(`/admin/contratti/${contract.id}`)}
                                  title="Visualizza"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="tp-btn-icon"
                                  onClick={(e) => handleDeleteContract(contract.id, e)}
                                  title="Elimina"
                                  style={{ color: '#DC2626' }}
                                >
                                  <FaTrash />
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
              {paginatedContracts.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                  <FaInbox size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>Nessun contratto trovato</p>
                </div>
              ) : (
                paginatedContracts.map(contract => {
                  const statusBadge = getStatusBadge(contract.status);
                  const planColors = PLAN_COLORS[contract.plan_type] || PLAN_COLORS.Basic;
                  return (
                    <div
                      key={contract.id}
                      onClick={() => navigate(`/admin/contratti/${contract.id}`)}
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
                          background: contract.club_logo_url ? 'white' : 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                          border: '2px solid #E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {contract.club_logo_url ? (
                            <img
                              src={getImageUrl(contract.club_logo_url)}
                              alt={contract.club_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A' }}>
                              {contract.club_name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                            {contract.club_name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: planColors.bg,
                              fontSize: '11px',
                              fontWeight: 500,
                              color: planColors.color
                            }}>
                              <FaCrown size={8} />
                              {contract.plan_type}
                            </span>
                            {contract.addons?.length > 0 && (
                              <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                +{contract.addons.length} addon
                              </span>
                            )}
                          </div>
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

                      {/* Value */}
                      <div style={{
                        padding: '16px',
                        background: '#ECFDF5',
                        borderRadius: '12px',
                        textAlign: 'center',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
                          {formatCurrency(contract.total_value_with_vat || contract.total_value)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#065F46' }}>/anno</div>
                      </div>

                      {/* Info */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        padding: '16px 0',
                        borderTop: '1px solid #F3F4F6'
                      }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Inizio
                          </span>
                          <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                            {formatDate(contract.start_date)}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Scadenza
                          </span>
                          <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                            {formatDate(contract.end_date)}
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}>
                          <FaCalendarAlt size={10} />
                          {formatDate(contract.start_date)} → {formatDate(contract.end_date)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/contratti/${contract.id}`);
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

export default AdminContracts;
