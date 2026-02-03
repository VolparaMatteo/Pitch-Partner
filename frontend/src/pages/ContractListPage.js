import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import DefaultLogo from '../static/logo/FavIcon.png';
import {
  FaSearch, FaList, FaTh, FaEye, FaPen, FaTrashAlt, FaFileContract,
  FaPlus, FaEuroSign, FaCheck, FaClock, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaChevronDown, FaLayerGroup,
  FaBuilding, FaCalendarAlt, FaHandshake, FaUsers
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ContractListPage() {
  const [contracts, setContracts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterValue, setFilterValue] = useState('all');
  const [sortBy, setSortBy] = useState('expiry_asc');
  const [viewMode, setViewMode] = useState('list');

  // Sponsor scroll state
  const sponsorScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Custom dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [valueDropdownOpen, setValueDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const valueDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const navigate = useNavigate();
  const { user } = getAuth();

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'Tutti gli status', icon: FaLayerGroup, color: '#6B7280' },
    { value: 'attivo', label: 'Attivi', icon: FaCheck, color: '#10B981' },
    { value: 'in_attesa', label: 'In attesa', icon: FaClock, color: '#F59E0B' },
    { value: 'scaduto', label: 'Scaduti', icon: FaExclamationTriangle, color: '#EF4444' },
    { value: 'bozza', label: 'Bozza', icon: FaFileContract, color: '#6B7280' }
  ];

  const valueOptions = [
    { value: 'all', label: 'Qualsiasi valore', icon: FaEuroSign, color: '#6B7280' },
    { value: 'under_50k', label: 'Fino a €50k', icon: FaEuroSign, color: '#10B981' },
    { value: '50k_100k', label: '€50k - €100k', icon: FaEuroSign, color: '#3B82F6' },
    { value: '100k_250k', label: '€100k - €250k', icon: FaEuroSign, color: '#8B5CF6' },
    { value: 'over_250k', label: 'Oltre €250k', icon: FaEuroSign, color: '#F59E0B' }
  ];

  const sortOptions = [
    { value: 'expiry_asc', label: 'Scadenza ↑', icon: FaCalendarAlt, color: '#10B981' },
    { value: 'expiry_desc', label: 'Scadenza ↓', icon: FaCalendarAlt, color: '#EF4444' },
    { value: 'value_desc', label: 'Valore ↓', icon: FaEuroSign, color: '#EF4444' },
    { value: 'value_asc', label: 'Valore ↑', icon: FaEuroSign, color: '#10B981' },
    { value: 'name_asc', label: 'Nome A-Z', icon: FaFileContract, color: '#6B7280' },
    { value: 'name_desc', label: 'Nome Z-A', icon: FaFileContract, color: '#6B7280' },
    { value: 'sponsor_asc', label: 'Sponsor A-Z', icon: FaBuilding, color: '#6B7280' }
  ];

  const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || options[0];

  // Scroll handlers
  const checkScrollArrows = () => {
    const el = sponsorScrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  const scrollSponsors = (direction) => {
    const el = sponsorScrollRef.current;
    if (el) {
      const scrollAmount = 200;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener('resize', checkScrollArrows);
    return () => window.removeEventListener('resize', checkScrollArrows);
  }, [contracts]);

  // Click outside handler for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (valueDropdownRef.current && !valueDropdownRef.current.contains(e.target)) {
        setValueDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let contractsData = [];
      if (Array.isArray(response.data)) {
        contractsData = response.data;
      } else if (response.data && response.data.contracts) {
        contractsData = response.data.contracts;
      } else if (response.data && typeof response.data === 'object') {
        contractsData = Object.values(response.data);
      }

      setContracts(contractsData);
      calculateAnalytics(contractsData);
    } catch (error) {
      console.error('Errore nel caricamento contratti:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (contractsData) => {
    const now = new Date();

    const activeContracts = contractsData.filter(c => {
      const start = new Date(c.data_inizio);
      const end = new Date(c.data_fine);
      return c.status !== 'bozza' && now >= start && now <= end;
    });

    const totalActiveValue = activeContracts.reduce((sum, c) => sum + (c.compenso || 0), 0);
    const expiringSoon = activeContracts.filter(c => {
      const end = new Date(c.data_fine);
      const daysUntilEnd = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return daysUntilEnd <= 30 && daysUntilEnd > 0;
    }).length;

    setAnalytics({
      total_active_value: totalActiveValue,
      active_count: activeContracts.length,
      expiring_soon: expiringSoon,
      total_count: contractsData.length
    });
  };

  const getContractStatus = (contract) => {
    const now = new Date();
    const dataInizio = new Date(contract.data_inizio);
    const dataFine = new Date(contract.data_fine);

    if (contract.status === 'bozza') return { label: 'Bozza', className: 'tp-badge-neutral', value: 'bozza' };
    if (now < dataInizio) return { label: 'In attesa', className: 'tp-badge-warning', value: 'in_attesa' };
    if (now > dataFine) return { label: 'Scaduto', className: 'tp-badge-danger', value: 'scaduto' };
    return { label: 'Attivo', className: 'tp-badge-success', value: 'attivo' };
  };

  const getDaysUntilExpiry = (contract) => {
    const now = new Date();
    const end = new Date(contract.data_fine);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const getUniqueSponsors = () => {
    const sponsors = contracts
      .map(c => c.sponsor)
      .filter(s => s && s.id)
      .reduce((acc, sponsor) => {
        if (!acc.find(s => s.id === sponsor.id)) {
          acc.push({
            ...sponsor,
            count: contracts.filter(c => c.sponsor?.id === sponsor.id).length
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.count - a.count);
    return sponsors;
  };

  const handleDelete = async (contractId, e) => {
    e.stopPropagation();
    if (!window.confirm('Sei sicuro di voler eliminare questo contratto?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchContracts();
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione del contratto');
    }
  };

  const applyFilters = (contractsList) => {
    return contractsList.filter(contract => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          contract.nome_contratto?.toLowerCase().includes(searchLower) ||
          contract.sponsor?.ragione_sociale?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (selectedSponsor !== 'all') {
        if (contract.sponsor?.id !== parseInt(selectedSponsor)) return false;
      }

      if (filterStatus !== 'all') {
        const status = getContractStatus(contract);
        if (status.value !== filterStatus) return false;
      }

      if (filterValue !== 'all') {
        const value = contract.compenso || 0;
        switch (filterValue) {
          case 'under_50k':
            if (value >= 50000) return false;
            break;
          case '50k_100k':
            if (value < 50000 || value >= 100000) return false;
            break;
          case '100k_250k':
            if (value < 100000 || value >= 250000) return false;
            break;
          case 'over_250k':
            if (value < 250000) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  };

  const applySorting = (contractsList) => {
    const sorted = [...contractsList];

    switch (sortBy) {
      case 'expiry_asc':
        return sorted.sort((a, b) => new Date(a.data_fine) - new Date(b.data_fine));
      case 'expiry_desc':
        return sorted.sort((a, b) => new Date(b.data_fine) - new Date(a.data_fine));
      case 'value_asc':
        return sorted.sort((a, b) => (a.compenso || 0) - (b.compenso || 0));
      case 'value_desc':
        return sorted.sort((a, b) => (b.compenso || 0) - (a.compenso || 0));
      case 'name_asc':
        return sorted.sort((a, b) => a.nome_contratto.localeCompare(b.nome_contratto));
      case 'name_desc':
        return sorted.sort((a, b) => b.nome_contratto.localeCompare(a.nome_contratto));
      case 'sponsor_asc':
        return sorted.sort((a, b) =>
          (a.sponsor?.ragione_sociale || '').localeCompare(b.sponsor?.ragione_sociale || '')
        );
      default:
        return sorted;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (selectedSponsor !== 'all') count++;
    if (filterValue !== 'all') count++;
    return count;
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setSelectedSponsor('all');
    setFilterValue('all');
    setSearchTerm('');
  };

  const filteredContracts = applySorting(applyFilters(contracts));
  const activeFiltersCount = getActiveFiltersCount();
  const sponsors = getUniqueSponsors();

  // Calculate stats
  const totalContracts = contracts.length;
  const activeContracts = analytics?.active_count || 0;
  const totalValue = analytics?.total_active_value || 0;
  const expiringSoon = analytics?.expiring_soon || 0;

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento contratti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Gestione Contratti</h1>
          <p className="tp-page-subtitle">
            Gestisci i tuoi contratti di sponsorizzazione e monitora le scadenze
          </p>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/sponsors')}
          >
            <FaUsers /> Sponsor
          </button>
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/club/contracts/new')}
          >
            <FaPlus /> Nuovo Contratto
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="tp-stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaFileContract style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{totalContracts}</div>
            <div className="tp-stat-label">Contratti Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCheck style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{activeContracts}</div>
            <div className="tp-stat-label">Contratti Attivi</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaEuroSign style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">€{totalValue.toLocaleString()}</div>
            <div className="tp-stat-label">Valore Attivo</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaExclamationTriangle style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{expiringSoon}</div>
            <div className="tp-stat-label">In Scadenza (30gg)</div>
          </div>
        </div>
      </div>

      {/* Sponsors Quick Filter */}
      {sponsors.length > 0 && (
        <div className="tp-card" style={{ marginBottom: '24px' }}>
          <div className="tp-card-body" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 600, color: '#374151', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaHandshake /> Sponsor:
              </span>

              {showLeftArrow && (
                <button
                  onClick={() => scrollSponsors('left')}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '1px solid #E5E7EB', background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <FaChevronLeft size={12} color="#6B7280" />
                </button>
              )}

              <div
                ref={sponsorScrollRef}
                onScroll={checkScrollArrows}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
                  overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none'
                }}
                className="hide-scrollbar"
              >
                <button
                  className={`tp-filter-chip ${selectedSponsor === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedSponsor('all')}
                  style={{ flexShrink: 0 }}
                >
                  Tutti ({contracts.length})
                </button>
                {sponsors.map(sponsor => (
                  <button
                    key={sponsor.id}
                    className={`tp-filter-chip ${selectedSponsor === String(sponsor.id) ? 'active' : ''}`}
                    onClick={() => setSelectedSponsor(String(sponsor.id))}
                    style={{ flexShrink: 0 }}
                  >
                    {sponsor.ragione_sociale} ({sponsor.count})
                  </button>
                ))}
              </div>

              {showRightArrow && (
                <button
                  onClick={() => scrollSponsors('right')}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '1px solid #E5E7EB', background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <FaChevronRight size={12} color="#6B7280" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca contratto, sponsor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Status Filter - Custom Dropdown */}
            <div ref={statusDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setValueDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  border: filterStatus !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterStatus !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(statusOptions, filterStatus);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown size={12} color="#6B7280"
                        style={{ transform: statusDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </>
                  );
                })()}
              </button>
              {statusDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '180px', overflow: 'hidden'
                }}>
                  {statusOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        onClick={() => { setFilterStatus(option.value); setStatusDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer',
                          background: filterStatus === option.value ? '#F3F4F6' : 'white',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.target.style.background = filterStatus === option.value ? '#F3F4F6' : 'white'}
                      >
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Icon size={12} color="white" />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Value Filter - Custom Dropdown */}
            <div ref={valueDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setValueDropdownOpen(!valueDropdownOpen);
                  setStatusDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  border: filterValue !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterValue !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: '160px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(valueOptions, filterValue);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown size={12} color="#6B7280"
                        style={{ transform: valueDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </>
                  );
                })()}
              </button>
              {valueDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '180px', overflow: 'hidden'
                }}>
                  {valueOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        onClick={() => { setFilterValue(option.value); setValueDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer',
                          background: filterValue === option.value ? '#F3F4F6' : 'white',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.target.style.background = filterValue === option.value ? '#F3F4F6' : 'white'}
                      >
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Icon size={12} color="white" />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="tp-card-header-right">
            {/* Sort Dropdown */}
            <div ref={sortDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setSortDropdownOpen(!sortDropdownOpen);
                  setStatusDropdownOpen(false);
                  setValueDropdownOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px',
                  background: 'white', cursor: 'pointer', transition: 'all 0.2s', minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(sortOptions, sortBy);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown size={12} color="#6B7280"
                        style={{ transform: sortDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </>
                  );
                })()}
              </button>
              {sortDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '180px', overflow: 'hidden'
                }}>
                  {sortOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        onClick={() => { setSortBy(option.value); setSortDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer',
                          background: sortBy === option.value ? '#F3F4F6' : 'white',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.target.style.background = sortBy === option.value ? '#F3F4F6' : 'white'}
                      >
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Icon size={12} color="white" />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                      </div>
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
                {filteredContracts.length} contratti trovati
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </div>
          )}

          {/* Contract Grid */}
          {filteredContracts.length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon"><FaFileContract /></div>
              <h3 className="tp-empty-title">Nessun contratto trovato</h3>
              <p className="tp-empty-description">
                {activeFiltersCount > 0 || searchTerm
                  ? 'Prova a modificare i filtri o i termini di ricerca'
                  : 'Inizia creando il tuo primo contratto'}
              </p>
              {activeFiltersCount > 0 || searchTerm ? (
                <button className="tp-btn tp-btn-outline" onClick={clearFilters}>
                  Rimuovi filtri
                </button>
              ) : (
                <button className="tp-btn tp-btn-primary" onClick={() => navigate('/club/contracts/new')}>
                  <FaPlus /> Crea primo contratto
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="tp-grid">
              {filteredContracts.map((contract) => {
                const status = getContractStatus(contract);
                const sponsor = contract.sponsor || {};
                const daysLeft = getDaysUntilExpiry(contract);

                return (
                  <div
                    key={contract.id}
                    className="tp-sponsor-card"
                    onClick={() => navigate(`/club/contracts/${contract.id}`)}
                  >
                    {/* Header */}
                    <div className="tp-sponsor-header">
                      <div className="tp-sponsor-logo">
                        {sponsor.logo_url ? (
                          <img
                            src={getImageUrl(sponsor.logo_url)}
                            alt={sponsor.ragione_sociale}
                            onError={(e) => { e.target.src = DefaultLogo; }}
                          />
                        ) : (
                          <img
                            src={DefaultLogo}
                            alt="Default Logo"
                            style={{ opacity: 0.6, padding: '8px' }}
                          />
                        )}
                      </div>
                      <span className={`tp-badge ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="tp-sponsor-content">
                      <div className="tp-sponsor-sector">
                        {sponsor.ragione_sociale || 'Sponsor non disponibile'}
                      </div>
                      <h3 className="tp-sponsor-name">{contract.nome_contratto}</h3>
                      <div className="tp-sponsor-tags">
                        <span className="tp-sponsor-tag">
                          <FaEuroSign style={{ marginRight: '4px' }} />
                          €{(contract.compenso || 0).toLocaleString()}
                        </span>
                        <span className="tp-sponsor-tag">
                          <FaCalendarAlt style={{ marginRight: '4px' }} />
                          {Math.ceil((new Date(contract.data_fine) - new Date(contract.data_inizio)) / (1000 * 60 * 60 * 24 * 30))} mesi
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="tp-sponsor-footer">
                      <div className="tp-sponsor-contact">
                        <span className="tp-sponsor-contact-item">
                          {new Date(contract.data_inizio).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(contract.data_fine).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {status.value === 'attivo' && daysLeft > 0 && (
                          <span className="tp-sponsor-contact-item" style={{ color: daysLeft <= 30 ? '#DC2626' : '#6B7280' }}>
                            {daysLeft} giorni rimanenti
                          </span>
                        )}
                      </div>
                      <div className="tp-sponsor-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="tp-btn-icon tp-btn-icon-view"
                          onClick={() => navigate(`/club/contracts/${contract.id}`)}
                          title="Visualizza"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="tp-btn-icon tp-btn-icon-edit"
                          onClick={() => navigate(`/club/contracts/${contract.id}/edit`)}
                          title="Modifica"
                        >
                          <FaPen />
                        </button>
                        <button
                          className="tp-btn-icon tp-btn-icon-delete"
                          onClick={(e) => handleDelete(contract.id, e)}
                          title="Elimina"
                        >
                          <FaTrashAlt />
                        </button>
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
                    <th>Contratto</th>
                    <th>Sponsor</th>
                    <th>Valore</th>
                    <th>Periodo</th>
                    <th>Status</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => {
                    const status = getContractStatus(contract);
                    const sponsor = contract.sponsor || {};
                    const daysLeft = getDaysUntilExpiry(contract);

                    return (
                      <tr key={contract.id} onClick={() => navigate(`/club/contracts/${contract.id}`)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div className="tp-table-user">
                            <div className="tp-table-avatar">
                              {sponsor.logo_url ? (
                                <img
                                  src={getImageUrl(sponsor.logo_url)}
                                  alt={sponsor.ragione_sociale}
                                  onError={(e) => { e.target.src = DefaultLogo; }}
                                />
                              ) : (
                                <img
                                  src={DefaultLogo}
                                  alt="Default"
                                  style={{ opacity: 0.6, padding: '6px' }}
                                />
                              )}
                            </div>
                            <div className="tp-table-user-info">
                              <span className="tp-table-name">{contract.nome_contratto}</span>
                              <span className="tp-table-sector">{contract.descrizione || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '14px', color: '#1f2937' }}>{sponsor.ragione_sociale || '-'}</span>
                        </td>
                        <td>
                          <span className="tp-table-value" style={{ color: '#059669', fontWeight: 700 }}>
                            €{(contract.compenso || 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div className="tp-table-user-info">
                            <span style={{ fontSize: '13px', color: '#1f2937' }}>
                              {new Date(contract.data_inizio).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - {new Date(contract.data_fine).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {status.value === 'attivo' && daysLeft > 0 && (
                              <span style={{ fontSize: '12px', color: daysLeft <= 30 ? '#DC2626' : '#6B7280' }}>
                                {daysLeft} giorni rimanenti
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`tp-badge ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="tp-table-actions">
                            <button
                              className="tp-btn-icon tp-btn-icon-view"
                              onClick={() => navigate(`/club/contracts/${contract.id}`)}
                              title="Visualizza"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="tp-btn-icon tp-btn-icon-edit"
                              onClick={() => navigate(`/club/contracts/${contract.id}/edit`)}
                              title="Modifica"
                            >
                              <FaPen />
                            </button>
                            <button
                              className="tp-btn-icon tp-btn-icon-delete"
                              onClick={(e) => handleDelete(contract.id, e)}
                              title="Elimina"
                            >
                              <FaTrashAlt />
                            </button>
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
    </div>
  );
}

export default ContractListPage;
