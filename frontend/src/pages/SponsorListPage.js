import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import DefaultLogo from '../static/logo/FavIcon.png';
import {
  FaSearch, FaList, FaTh, FaEye, FaPen, FaTrashAlt, FaHandshake,
  FaPlus, FaFileContract, FaChartLine, FaUsers, FaEuroSign,
  FaCheck, FaTimes, FaTag, FaChevronLeft, FaChevronRight,
  FaBuilding, FaChevronDown, FaLayerGroup, FaFileAlt
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function SponsorListPage() {
  const [sponsors, setSponsors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterValue, setFilterValue] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [viewMode, setViewMode] = useState('list');

  // Category scroll state
  const sectorScrollRef = useRef(null);
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
    { value: 'inattivo', label: 'Inattivi', icon: FaTimes, color: '#EF4444' }
  ];

  const valueOptions = [
    { value: 'all', label: 'Qualsiasi valore', icon: FaEuroSign, color: '#6B7280' },
    { value: 'under_50k', label: 'Fino a €50k', icon: FaEuroSign, color: '#10B981' },
    { value: '50k_100k', label: '€50k - €100k', icon: FaEuroSign, color: '#3B82F6' },
    { value: '100k_250k', label: '€100k - €250k', icon: FaEuroSign, color: '#8B5CF6' },
    { value: 'over_250k', label: 'Oltre €250k', icon: FaEuroSign, color: '#F59E0B' }
  ];

  const sortOptions = [
    { value: 'name_asc', label: 'Nome A-Z', icon: FaBuilding, color: '#6B7280' },
    { value: 'name_desc', label: 'Nome Z-A', icon: FaBuilding, color: '#6B7280' },
    { value: 'value_desc', label: 'Valore decrescente', icon: FaEuroSign, color: '#EF4444' },
    { value: 'value_asc', label: 'Valore crescente', icon: FaEuroSign, color: '#10B981' },
    { value: 'contracts_desc', label: 'Contratti ↓', icon: FaFileContract, color: '#8B5CF6' }
  ];

  const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || options[0];

  // Scroll handlers
  const checkScrollArrows = () => {
    const el = sectorScrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  const scrollSectors = (direction) => {
    const el = sectorScrollRef.current;
    if (el) {
      const scrollAmount = 200;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener('resize', checkScrollArrows);
    return () => window.removeEventListener('resize', checkScrollArrows);
  }, [sponsors]);

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
    fetchSponsors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [sponsorsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/club/sponsors`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/sponsors/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      let sponsorsData = [];
      if (Array.isArray(sponsorsRes.data)) {
        sponsorsData = sponsorsRes.data;
      } else if (sponsorsRes.data && sponsorsRes.data.sponsors) {
        sponsorsData = sponsorsRes.data.sponsors;
      } else if (sponsorsRes.data && typeof sponsorsRes.data === 'object') {
        sponsorsData = Object.values(sponsorsRes.data);
      }

      setSponsors(sponsorsData);
      setAnalytics(analyticsRes.data || null);
    } catch (error) {
      console.error('Errore nel caricamento sponsor:', error);
      setSponsors([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sponsorId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo sponsor?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/club/sponsors/${sponsorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSponsors();
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione dello sponsor');
    }
  };

  const getUniqueSectors = () => {
    const sectors = sponsors
      .map(s => s.settore_merceologico)
      .filter(s => s && s.trim() !== '')
      .reduce((acc, settore) => {
        if (!acc.find(item => item.name === settore)) {
          acc.push({
            name: settore,
            count: sponsors.filter(sp => sp.settore_merceologico === settore).length
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.count - a.count);
    return sectors;
  };

  const applyFilters = (sponsorsList) => {
    return sponsorsList.filter(sponsor => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          sponsor.ragione_sociale?.toLowerCase().includes(searchLower) ||
          sponsor.email?.toLowerCase().includes(searchLower) ||
          sponsor.settore_merceologico?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (selectedSector !== 'all') {
        if (sponsor.settore_merceologico !== selectedSector) return false;
      }

      if (filterStatus !== 'all') {
        const hasActiveContracts = (sponsor.active_contracts_count || 0) > 0;
        if (filterStatus === 'attivo' && !hasActiveContracts) return false;
        if (filterStatus === 'inattivo' && hasActiveContracts) return false;
      }

      if (filterValue !== 'all') {
        const value = sponsor.active_contracts_value || 0;
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

  const applySorting = (sponsorsList) => {
    const sorted = [...sponsorsList];

    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => a.ragione_sociale.localeCompare(b.ragione_sociale));
      case 'name_desc':
        return sorted.sort((a, b) => b.ragione_sociale.localeCompare(a.ragione_sociale));
      case 'value_asc':
        return sorted.sort((a, b) => (a.active_contracts_value || 0) - (b.active_contracts_value || 0));
      case 'value_desc':
        return sorted.sort((a, b) => (b.active_contracts_value || 0) - (a.active_contracts_value || 0));
      case 'contracts_desc':
        return sorted.sort((a, b) => (b.active_contracts_count || 0) - (a.active_contracts_count || 0));
      default:
        return sorted;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (selectedSector !== 'all') count++;
    if (filterValue !== 'all') count++;
    return count;
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setSelectedSector('all');
    setFilterValue('all');
    setSearchTerm('');
  };

  const filteredSponsors = applySorting(applyFilters(sponsors));
  const activeFiltersCount = getActiveFiltersCount();
  const sectors = getUniqueSectors();

  // Calculate stats
  const totalSponsors = sponsors.length;
  const activeSponsors = sponsors.filter(s => (s.active_contracts_count || 0) > 0).length;
  const totalValue = sponsors.reduce((sum, s) => sum + (s.active_contracts_value || 0), 0);
  const totalContracts = sponsors.reduce((sum, s) => sum + (s.active_contracts_count || 0), 0);

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento sponsor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Gestione Sponsor</h1>
          <p className="tp-page-subtitle">
            Gestisci il tuo portfolio di sponsor e le relazioni commerciali
          </p>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/contracts')}
          >
            <FaFileContract /> Contratti
          </button>
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/proposals')}
          >
            <FaFileAlt /> Proposte
          </button>
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/club/sponsors/new')}
          >
            <FaPlus /> Nuovo Sponsor
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="tp-stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaUsers style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{totalSponsors}</div>
            <div className="tp-stat-label">Sponsor Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCheck style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{activeSponsors}</div>
            <div className="tp-stat-label">Con Contratti Attivi</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaEuroSign style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">€{totalValue.toLocaleString()}</div>
            <div className="tp-stat-label">Valore Contratti</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaFileContract style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{totalContracts}</div>
            <div className="tp-stat-label">Contratti Attivi</div>
          </div>
        </div>
      </div>

      {/* Expiring Contracts Alert */}
      {analytics && analytics.expiring_contracts && analytics.expiring_contracts.length > 0 && (
        <div className="tp-alert-card">
          <div className="tp-alert-header">
            <h3 className="tp-alert-title">
              <FaChartLine style={{ marginRight: '8px' }} />
              Contratti in Scadenza (prossimi 60 giorni)
            </h3>
          </div>
          <div className="tp-alert-list">
            {analytics.expiring_contracts.slice(0, 5).map((contract) => (
              <div
                key={contract.contract_id}
                className="tp-alert-item"
                onClick={() => navigate(`/club/contracts/${contract.contract_id}`)}
              >
                <div className="tp-alert-item-content">
                  <div className="tp-alert-item-title">{contract.contract_name}</div>
                  <div className="tp-alert-item-subtitle">
                    {contract.sponsor_name} • €{contract.value?.toLocaleString()}
                  </div>
                </div>
                <div className="tp-alert-item-meta">
                  <div className="tp-alert-item-date">
                    {new Date(contract.expiry_date).toLocaleDateString('it-IT')}
                  </div>
                  <div className="tp-alert-item-days" style={{
                    color: contract.days_left <= 30 ? '#EF4444' : '#F59E0B'
                  }}>
                    {contract.days_left} giorni
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sectors Quick Filter */}
      {sectors.length > 0 && (
        <div className="tp-card" style={{ marginBottom: '24px' }}>
          <div className="tp-card-body" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 600, color: '#374151', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaTag /> Settori:
              </span>

              {showLeftArrow && (
                <button
                  onClick={() => scrollSectors('left')}
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
                ref={sectorScrollRef}
                onScroll={checkScrollArrows}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
                  overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none'
                }}
                className="hide-scrollbar"
              >
                <button
                  className={`tp-filter-chip ${selectedSector === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedSector('all')}
                  style={{ flexShrink: 0 }}
                >
                  Tutti ({sponsors.length})
                </button>
                {sectors.map(sector => (
                  <button
                    key={sector.name}
                    className={`tp-filter-chip ${selectedSector === sector.name ? 'active' : ''}`}
                    onClick={() => setSelectedSector(sector.name)}
                    style={{ flexShrink: 0 }}
                  >
                    {sector.name} ({sector.count})
                  </button>
                ))}
              </div>

              {showRightArrow && (
                <button
                  onClick={() => scrollSectors('right')}
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
                placeholder="Cerca sponsor, email, settore..."
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
                  background: 'white', cursor: 'pointer', transition: 'all 0.2s', minWidth: '170px'
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
                {filteredSponsors.length} sponsor trovati
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </div>
          )}

          {/* Sponsor Grid */}
          {filteredSponsors.length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon"><FaHandshake /></div>
              <h3 className="tp-empty-title">Nessuno sponsor trovato</h3>
              <p className="tp-empty-description">
                {activeFiltersCount > 0 || searchTerm
                  ? 'Prova a modificare i filtri o i termini di ricerca'
                  : 'Inizia creando il tuo primo sponsor'}
              </p>
              {activeFiltersCount > 0 || searchTerm ? (
                <button className="tp-btn tp-btn-outline" onClick={clearFilters}>
                  Rimuovi filtri
                </button>
              ) : (
                <button className="tp-btn tp-btn-primary" onClick={() => navigate('/club/sponsors/new')}>
                  <FaPlus /> Crea primo sponsor
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="tp-grid">
              {filteredSponsors.map((sponsor) => (
                <div key={sponsor.id} className="tp-sponsor-card" onClick={() => navigate(`/club/sponsors/${sponsor.id}`)}>
                  {/* Header */}
                  <div className="tp-sponsor-header">
                    <div className="tp-sponsor-logo">
                      {sponsor.logo_url ? (
                        <img
                          src={sponsor.logo_url.startsWith('http') ? sponsor.logo_url : `${API_URL.replace('/api', '')}${sponsor.logo_url}`}
                          alt={sponsor.ragione_sociale}
                        />
                      ) : (
                        <img
                          src={DefaultLogo}
                          alt="Default Logo"
                          style={{ opacity: 0.6, padding: '8px' }}
                        />
                      )}
                    </div>
                    <span className={`tp-badge ${(sponsor.active_contracts_count || 0) > 0 ? 'tp-badge-success' : 'tp-badge-neutral'}`}>
                      {(sponsor.active_contracts_count || 0) > 0 ? 'Attivo' : 'Inattivo'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="tp-sponsor-content">
                    <div className="tp-sponsor-sector">
                      {sponsor.settore_merceologico || 'Partnership'}
                    </div>
                    <h3 className="tp-sponsor-name">{sponsor.ragione_sociale}</h3>
                    <div className="tp-sponsor-tags">
                      <span className="tp-sponsor-tag">
                        <FaFileContract style={{ marginRight: '4px' }} />
                        {sponsor.active_contracts_count || 0} Contratti
                      </span>
                      <span className="tp-sponsor-tag">
                        <FaEuroSign style={{ marginRight: '4px' }} />
                        €{(sponsor.active_contracts_value || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="tp-sponsor-footer">
                    <div className="tp-sponsor-contact">
                      <span className="tp-sponsor-contact-item">
                        {sponsor.email || 'Nessuna email'}
                      </span>
                    </div>
                    <div className="tp-sponsor-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="tp-btn-icon tp-btn-icon-view"
                        onClick={() => navigate(`/club/sponsors/${sponsor.id}`)}
                        title="Visualizza"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="tp-btn-icon tp-btn-icon-edit"
                        onClick={() => navigate(`/club/sponsors/${sponsor.id}/edit`)}
                        title="Modifica"
                      >
                        <FaPen />
                      </button>
                      <button
                        className="tp-btn-icon tp-btn-icon-delete"
                        onClick={() => handleDelete(sponsor.id)}
                        title="Elimina"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LIST VIEW (Table) */
            <div className="tp-table-container">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Contatti</th>
                    <th>Contratti</th>
                    <th>Valore</th>
                    <th>Status</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSponsors.map((sponsor) => (
                    <tr key={sponsor.id} onClick={() => navigate(`/club/sponsors/${sponsor.id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="tp-table-user">
                          <div className="tp-table-avatar">
                            {sponsor.logo_url ? (
                              <img
                                src={sponsor.logo_url.startsWith('http') ? sponsor.logo_url : `${API_URL.replace('/api', '')}${sponsor.logo_url}`}
                                alt={sponsor.ragione_sociale}
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
                            <span className="tp-table-name">{sponsor.ragione_sociale}</span>
                            <span className="tp-table-sector">{sponsor.settore_merceologico || 'Partnership'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="tp-table-user-info">
                          <span style={{ fontSize: '14px', color: '#1f2937' }}>{sponsor.email || '-'}</span>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{sponsor.telefono || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tp-table-value">{sponsor.active_contracts_count || 0}</span>
                      </td>
                      <td>
                        <span className="tp-table-value">€{(sponsor.active_contracts_value || 0).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={`tp-badge ${(sponsor.active_contracts_count || 0) > 0 ? 'tp-badge-success' : 'tp-badge-neutral'}`}>
                          {(sponsor.active_contracts_count || 0) > 0 ? 'Attivo' : 'Inattivo'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="tp-table-actions">
                          <button
                            className="tp-btn-icon tp-btn-icon-view"
                            onClick={() => navigate(`/club/sponsors/${sponsor.id}`)}
                            title="Visualizza"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-edit"
                            onClick={() => navigate(`/club/sponsors/${sponsor.id}/edit`)}
                            title="Modifica"
                          >
                            <FaPen />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-delete"
                            onClick={() => handleDelete(sponsor.id)}
                            title="Elimina"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SponsorListPage;
