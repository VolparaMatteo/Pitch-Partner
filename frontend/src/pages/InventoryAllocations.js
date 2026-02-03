import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Modal from '../components/Modal';
import SupportWidget from '../components/SupportWidget';
import GuidedTour from '../components/GuidedTour';
import {
  FaSearch, FaFilter, FaPlus, FaBoxOpen, FaClock,
  FaEuroSign, FaCheck, FaChevronDown, FaChevronUp,
  FaUsers, FaFileAlt, FaEye, FaCalendar, FaCube,
  FaArrowUp, FaArrowDown, FaCheckCircle, FaTimesCircle,
  FaPauseCircle, FaChartLine, FaTimes, FaLayerGroup,
  FaLightbulb, FaHistory
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function InventoryAllocations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = getAuth();

  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assetFilter, setAssetFilter] = useState(searchParams.get('asset_id') || '');
  const [shouldAutoOpenModal, setShouldAutoOpenModal] = useState(searchParams.get('action') === 'new');
  const [sponsorFilter, setSponsorFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [expandedAllocations, setExpandedAllocations] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modal state for new allocation
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    asset_id: '',
    sponsor_id: '',
    data_inizio: '',
    data_fine: '',
    quantita: 1,
    prezzo_concordato: '',
    note: ''
  });

  // Guided Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Custom dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [sponsorDropdownOpen, setSponsorDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const assetDropdownRef = useRef(null);
  const sponsorDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);

  // Tour steps
  const tourSteps = [
    {
      target: '[data-tour="page-header"]',
      title: 'Storico Allocazioni',
      content: 'Questa pagina mostra tutte le allocazioni degli asset, raggruppate per asset. Puoi vedere lo storico completo, monitorare i prezzi e analizzare le variazioni nel tempo.',
      placement: 'bottom',
      icon: <FaHistory size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      tip: 'Le allocazioni sono ordinate dalla più recente alla più vecchia.'
    },
    {
      target: '[data-tour="stats-row"]',
      title: 'Statistiche Allocazioni',
      content: 'Qui vedi le metriche principali: allocazioni totali, quelle attive, il valore totale delle allocazioni attive e la durata media dei contratti.',
      placement: 'bottom',
      icon: <FaChartLine size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #34D399)'
    },
    {
      target: '[data-tour="filters"]',
      title: 'Filtri Avanzati',
      content: 'Usa i filtri per cercare allocazioni specifiche: per stato (attive, concluse), per asset, per sponsor o per stagione sportiva.',
      placement: 'bottom',
      icon: <FaFilter size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #FBBF24)'
    },
    {
      target: '[data-tour="allocations-list"]',
      title: 'Lista Allocazioni',
      content: 'Le allocazioni sono raggruppate per asset. Ogni gruppo mostra il totale delle allocazioni e il valore complessivo. Clicca su un\'allocazione per espandere i dettagli.',
      placement: 'top',
      icon: <FaLayerGroup size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
      tip: 'La variazione di prezzo rispetto all\'allocazione precedente è mostrata con una freccia verde (aumento) o rossa (diminuzione).'
    }
  ];

  const handleStartTour = () => {
    setIsTourOpen(true);
  };

  const handleTourClose = useCallback(() => {
    setIsTourOpen(false);
  }, []);

  // Click outside handler for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(e.target)) {
        setAssetDropdownOpen(false);
      }
      if (sponsorDropdownRef.current && !sponsorDropdownRef.current.contains(e.target)) {
        setSponsorDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target)) {
        setYearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open modal when action=new is in URL
  useEffect(() => {
    if (!loading && shouldAutoOpenModal) {
      openNewAllocationModal();
      setShouldAutoOpenModal(false);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [loading, shouldAutoOpenModal]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocationsRes, assetsRes, sponsorsRes] = await Promise.all([
        axios.get(`${API_URL}/club/inventory/allocations`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/inventory/assets`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/sponsors`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAllocations(allocationsRes.data?.allocations || allocationsRes.data || []);
      setAssets(assetsRes.data?.assets || assetsRes.data || []);
      setSponsors(sponsorsRes.data?.sponsors || sponsorsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setAllocations(getDemoAllocations());
      setAssets(getDemoAssets());
      setSponsors(getDemoSponsors());
    } finally {
      setLoading(false);
    }
  };

  const getDemoAssets = () => [
    { id: 1, codice: 'LED-001', nome: 'LED Bordocampo Lato Tribuna', categoria: { colore: '#6366F1' } },
    { id: 2, codice: 'LED-002', nome: 'LED Bordocampo Curva Nord', categoria: { colore: '#6366F1' } },
    { id: 3, codice: 'JER-001', nome: 'Manica Sinistra Prima Maglia', categoria: { colore: '#EC4899' } },
    { id: 4, codice: 'DIG-001', nome: 'Banner Homepage Sito', categoria: { colore: '#3B82F6' } },
    { id: 5, codice: 'HOS-001', nome: 'Sky Box Premium', categoria: { colore: '#F59E0B' } }
  ];

  const getDemoSponsors = () => [
    { id: 1, ragione_sociale: 'Fly Emirates' },
    { id: 2, ragione_sociale: 'Adidas' },
    { id: 3, ragione_sociale: 'Coca Cola' },
    { id: 4, ragione_sociale: 'Samsung' },
    { id: 5, ragione_sociale: 'UniCredit' }
  ];

  const getDemoAllocations = () => {
    const currentYear = new Date().getFullYear();
    return [
      { id: 1, asset_id: 1, asset: { id: 1, codice: 'LED-001', nome: 'LED Bordocampo Lato Tribuna', categoria: { colore: '#6366F1' } }, sponsor_id: 1, sponsor: { ragione_sociale: 'Fly Emirates' }, stagione: `${currentYear}-${currentYear + 1}`, data_inizio: `${currentYear}-07-01`, data_fine: `${currentYear + 1}-06-30`, quantita: 2, prezzo_concordato: 480000, status: 'attiva', created_at: `${currentYear}-05-15T10:30:00`, note: 'Contratto pluriennale con opzione di rinnovo' },
      { id: 2, asset_id: 1, asset: { id: 1, codice: 'LED-001', nome: 'LED Bordocampo Lato Tribuna', categoria: { colore: '#6366F1' } }, sponsor_id: 3, sponsor: { ragione_sociale: 'Coca Cola' }, stagione: `${currentYear - 1}-${currentYear}`, data_inizio: `${currentYear - 1}-07-01`, data_fine: `${currentYear}-06-30`, quantita: 2, prezzo_concordato: 420000, status: 'conclusa', created_at: `${currentYear - 1}-05-20T14:15:00`, note: 'Conclusa regolarmente' },
      { id: 3, asset_id: 3, asset: { id: 3, codice: 'JER-001', nome: 'Manica Sinistra Prima Maglia', categoria: { colore: '#EC4899' } }, sponsor_id: 2, sponsor: { ragione_sociale: 'Adidas' }, stagione: `${currentYear}-${currentYear + 3}`, data_inizio: `${currentYear}-07-01`, data_fine: `${currentYear + 3}-06-30`, quantita: 1, prezzo_concordato: 4500000, status: 'attiva', created_at: `${currentYear}-04-01T09:00:00`, note: 'Contratto triennale Main Sponsor Kit' },
      { id: 4, asset_id: 3, asset: { id: 3, codice: 'JER-001', nome: 'Manica Sinistra Prima Maglia', categoria: { colore: '#EC4899' } }, sponsor_id: 2, sponsor: { ragione_sociale: 'Adidas' }, stagione: `${currentYear - 3}-${currentYear}`, data_inizio: `${currentYear - 3}-07-01`, data_fine: `${currentYear}-06-30`, quantita: 1, prezzo_concordato: 3800000, status: 'conclusa', created_at: `${currentYear - 3}-03-15T11:30:00`, note: 'Contratto precedente completato' },
      { id: 5, asset_id: 4, asset: { id: 4, codice: 'DIG-001', nome: 'Banner Homepage Sito', categoria: { colore: '#3B82F6' } }, sponsor_id: 4, sponsor: { ragione_sociale: 'Samsung' }, stagione: `${currentYear}-${currentYear + 1}`, data_inizio: `${currentYear}-09-01`, data_fine: `${currentYear + 1}-08-31`, quantita: 1, prezzo_concordato: 100000, status: 'attiva', created_at: `${currentYear}-08-10T16:45:00`, note: '' },
      { id: 6, asset_id: 5, asset: { id: 5, codice: 'HOS-001', nome: 'Sky Box Premium', categoria: { colore: '#F59E0B' } }, sponsor_id: 5, sponsor: { ragione_sociale: 'UniCredit' }, stagione: `${currentYear}-${currentYear + 1}`, data_inizio: `${currentYear}-07-01`, data_fine: `${currentYear + 1}-06-30`, quantita: 5, prezzo_concordato: 700000, status: 'attiva', created_at: `${currentYear}-06-01T10:00:00`, note: 'Include catering premium e parcheggio VIP' },
      { id: 7, asset_id: 2, asset: { id: 2, codice: 'LED-002', nome: 'LED Bordocampo Curva Nord', categoria: { colore: '#6366F1' } }, sponsor_id: 1, sponsor: { ragione_sociale: 'Fly Emirates' }, stagione: `${currentYear - 2}-${currentYear - 1}`, data_inizio: `${currentYear - 2}-07-01`, data_fine: `${currentYear - 1}-06-30`, quantita: 3, prezzo_concordato: 380000, status: 'conclusa', created_at: `${currentYear - 2}-06-15T09:30:00`, note: 'Non rinnovato' },
      { id: 8, asset_id: 4, asset: { id: 4, codice: 'DIG-001', nome: 'Banner Homepage Sito', categoria: { colore: '#3B82F6' } }, sponsor_id: 3, sponsor: { ragione_sociale: 'Coca Cola' }, stagione: `${currentYear - 1}-${currentYear}`, data_inizio: `${currentYear - 1}-01-01`, data_fine: `${currentYear}-08-31`, quantita: 1, prezzo_concordato: 85000, status: 'conclusa', created_at: `${currentYear - 1}-12-01T14:00:00`, note: '' }
    ];
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    const statuses = {
      'attiva': { label: 'Attiva', color: '#22C55E', bg: '#DCFCE7', icon: FaCheckCircle },
      'conclusa': { label: 'Conclusa', color: '#6B7280', bg: '#F3F4F6', icon: FaCheckCircle },
      'annullata': { label: 'Annullata', color: '#EF4444', bg: '#FEE2E2', icon: FaTimesCircle },
      'sospesa': { label: 'Sospesa', color: '#F59E0B', bg: '#FEF3C7', icon: FaPauseCircle }
    };
    return statuses[status] || statuses['attiva'];
  };

  const calculatePriceVariation = (allocation) => {
    const assetAllocations = allocations
      .filter(a => a.asset_id === allocation.asset_id && a.id !== allocation.id)
      .sort((a, b) => new Date(b.data_inizio) - new Date(a.data_inizio));
    if (assetAllocations.length === 0) return null;
    const previousAllocation = assetAllocations[0];
    if (!previousAllocation.prezzo_concordato || !allocation.prezzo_concordato) return null;
    return ((allocation.prezzo_concordato - previousAllocation.prezzo_concordato) / previousAllocation.prezzo_concordato) * 100;
  };

  const toggleExpand = (id) => {
    setExpandedAllocations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openNewAllocationModal = () => {
    setAllocationForm({
      asset_id: assetFilter || '',
      sponsor_id: '',
      data_inizio: '',
      data_fine: '',
      quantita: 1,
      prezzo_concordato: '',
      note: ''
    });
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    setAllocationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAllocation = async () => {
    if (!allocationForm.asset_id || !allocationForm.sponsor_id ||
      !allocationForm.data_inizio || !allocationForm.data_fine) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/club/inventory/allocations`, {
        ...allocationForm,
        prezzo_concordato: parseFloat(allocationForm.prezzo_concordato) || 0,
        quantita: parseInt(allocationForm.quantita) || 1
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore salvataggio allocazione:', error);
      alert('Errore nel salvataggio dell\'allocazione');
    } finally {
      setSaving(false);
    }
  };

  // Filter allocations
  const filteredAllocations = allocations.filter(alloc => {
    const matchesSearch = !searchTerm ||
      alloc.asset?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alloc.sponsor?.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || alloc.status === statusFilter;
    const matchesAsset = !assetFilter || alloc.asset_id === parseInt(assetFilter);
    const matchesSponsor = !sponsorFilter || alloc.sponsor_id === parseInt(sponsorFilter);
    const allocYear = new Date(alloc.data_inizio).getFullYear();
    const matchesYear = !yearFilter || allocYear === parseInt(yearFilter);
    return matchesSearch && matchesStatus && matchesAsset && matchesSponsor && matchesYear;
  }).sort((a, b) => new Date(b.data_inizio) - new Date(a.data_inizio));

  const uniqueYears = [...new Set(allocations.map(a => new Date(a.data_inizio).getFullYear()))].sort((a, b) => b - a);

  const stats = {
    total: allocations.length,
    active: allocations.filter(a => a.status === 'attiva').length,
    totalValue: allocations.filter(a => a.status === 'attiva').reduce((sum, a) => sum + (a.prezzo_concordato || 0), 0),
    avgDuration: Math.round(
      allocations.reduce((sum, a) => {
        const start = new Date(a.data_inizio);
        const end = new Date(a.data_fine);
        return sum + (end - start) / (1000 * 60 * 60 * 24 * 30);
      }, 0) / allocations.length || 0
    )
  };

  // Pagination logic
  const totalItems = filteredAllocations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAllocations = filteredAllocations.slice(startIndex, startIndex + itemsPerPage);

  // Group paginated allocations by asset
  const groupedByAsset = paginatedAllocations.reduce((acc, alloc) => {
    const assetId = alloc.asset_id;
    if (!acc[assetId]) {
      acc[assetId] = { asset: alloc.asset, allocations: [] };
    }
    acc[assetId].allocations.push(alloc);
    return acc;
  }, {});

  // Count active filters
  const activeFiltersCount = [
    searchTerm,
    statusFilter,
    assetFilter,
    sponsorFilter,
    yearFilter
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setAssetFilter('');
    setSponsorFilter('');
    setYearFilter('');
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, assetFilter, sponsorFilter, yearFilter]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento allocazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header" data-tour="page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Storico Allocazioni</h1>
          <p className="tp-page-subtitle">
            Timeline completa delle allocazioni asset per sponsorizzazione
          </p>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/inventory')}
          >
            <FaCube /> Catalogo
          </button>
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/inventory/calendar')}
          >
            <FaCalendar /> Calendario
          </button>
          <button
            className="tp-btn tp-btn-primary"
            onClick={openNewAllocationModal}
          >
            <FaPlus /> Nuova Allocazione
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="tp-stats-row" data-tour="stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaClock style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.total}</div>
            <div className="tp-stat-label">Allocazioni Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCheck style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.active}</div>
            <div className="tp-stat-label">Attive</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaEuroSign style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="tp-stat-label">Valore Attivo</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaChartLine style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.avgDuration} mesi</div>
            <div className="tp-stat-label">Durata Media</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="tp-card">
        <div className="tp-card-header" data-tour="filters">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca asset o sponsor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Filter Status - Custom Dropdown */}
            <div ref={statusDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setAssetDropdownOpen(false);
                  setSponsorDropdownOpen(false);
                  setYearDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  border: statusFilter ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: statusFilter ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '140px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1A1A1A'
                }}
              >
                {(() => {
                  const statusInfo = statusFilter ? getStatusInfo(statusFilter) : null;
                  if (statusInfo) {
                    const StatusIcon = statusInfo.icon;
                    return (
                      <>
                        <StatusIcon size={12} color={statusInfo.color} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{statusInfo.label}</span>
                      </>
                    );
                  }
                  return <span style={{ flex: 1, textAlign: 'left' }}>Tutti gli stati</span>;
                })()}
                <FaChevronDown
                  size={12}
                  color="#6B7280"
                  style={{
                    transition: 'transform 0.2s',
                    transform: statusDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                  }}
                />
              </button>

              {statusDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '180px',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  {[
                    { value: '', label: 'Tutti gli stati', icon: FaLayerGroup, color: '#6B7280' },
                    { value: 'attiva', label: 'Attive', icon: FaCheckCircle, color: '#22C55E' },
                    { value: 'conclusa', label: 'Concluse', icon: FaCheckCircle, color: '#6B7280' },
                    { value: 'annullata', label: 'Annullate', icon: FaTimesCircle, color: '#EF4444' }
                  ].map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = statusFilter === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <OptionIcon size={14} color={option.color} />
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

            {/* Filter Asset - Custom Dropdown */}
            <div ref={assetDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setAssetDropdownOpen(!assetDropdownOpen);
                  setStatusDropdownOpen(false);
                  setSponsorDropdownOpen(false);
                  setYearDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  border: assetFilter ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: assetFilter ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '160px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1A1A1A'
                }}
              >
                <FaCube size={12} color={assetFilter ? '#85FF00' : '#6B7280'} />
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {assetFilter ? assets.find(a => a.id === parseInt(assetFilter))?.nome || 'Asset' : 'Tutti gli asset'}
                </span>
                <FaChevronDown
                  size={12}
                  color="#6B7280"
                  style={{
                    transition: 'transform 0.2s',
                    transform: assetDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                  }}
                />
              </button>

              {assetDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '220px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  <div
                    onClick={() => {
                      setAssetFilter('');
                      setAssetDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: !assetFilter ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                      borderLeft: !assetFilter ? '3px solid #85FF00' : '3px solid transparent',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (assetFilter) e.currentTarget.style.background = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (assetFilter) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <FaLayerGroup size={14} color="#6B7280" />
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                      Tutti gli asset
                    </span>
                    {!assetFilter && <FaCheck size={12} color="#85FF00" />}
                  </div>
                  <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />
                  {assets.map(asset => {
                    const isSelected = assetFilter === String(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => {
                          setAssetFilter(String(asset.id));
                          setAssetDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '2px',
                          background: asset.categoria?.colore || '#6B7280'
                        }} />
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {asset.nome}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Sponsor - Custom Dropdown */}
            <div ref={sponsorDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setSponsorDropdownOpen(!sponsorDropdownOpen);
                  setStatusDropdownOpen(false);
                  setAssetDropdownOpen(false);
                  setYearDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  border: sponsorFilter ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: sponsorFilter ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '160px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1A1A1A'
                }}
              >
                <FaUsers size={12} color={sponsorFilter ? '#85FF00' : '#6B7280'} />
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {sponsorFilter ? sponsors.find(s => s.id === parseInt(sponsorFilter))?.ragione_sociale || 'Sponsor' : 'Tutti gli sponsor'}
                </span>
                <FaChevronDown
                  size={12}
                  color="#6B7280"
                  style={{
                    transition: 'transform 0.2s',
                    transform: sponsorDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                  }}
                />
              </button>

              {sponsorDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '220px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  <div
                    onClick={() => {
                      setSponsorFilter('');
                      setSponsorDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: !sponsorFilter ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                      borderLeft: !sponsorFilter ? '3px solid #85FF00' : '3px solid transparent',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (sponsorFilter) e.currentTarget.style.background = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (sponsorFilter) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <FaLayerGroup size={14} color="#6B7280" />
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                      Tutti gli sponsor
                    </span>
                    {!sponsorFilter && <FaCheck size={12} color="#85FF00" />}
                  </div>
                  <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />
                  {sponsors.map(sponsor => {
                    const isSelected = sponsorFilter === String(sponsor.id);
                    return (
                      <div
                        key={sponsor.id}
                        onClick={() => {
                          setSponsorFilter(String(sponsor.id));
                          setSponsorDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <FaUsers size={14} color="#6B7280" />
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {sponsor.ragione_sociale}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Year - Custom Dropdown */}
            <div ref={yearDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setYearDropdownOpen(!yearDropdownOpen);
                  setStatusDropdownOpen(false);
                  setAssetDropdownOpen(false);
                  setSponsorDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  border: yearFilter ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: yearFilter ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '120px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1A1A1A'
                }}
              >
                <FaCalendar size={12} color={yearFilter ? '#85FF00' : '#6B7280'} />
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {yearFilter || 'Tutti gli anni'}
                </span>
                <FaChevronDown
                  size={12}
                  color="#6B7280"
                  style={{
                    transition: 'transform 0.2s',
                    transform: yearDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                  }}
                />
              </button>

              {yearDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '150px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  <div
                    onClick={() => {
                      setYearFilter('');
                      setYearDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: !yearFilter ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                      borderLeft: !yearFilter ? '3px solid #85FF00' : '3px solid transparent',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (yearFilter) e.currentTarget.style.background = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (yearFilter) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <FaLayerGroup size={14} color="#6B7280" />
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                      Tutti gli anni
                    </span>
                    {!yearFilter && <FaCheck size={12} color="#85FF00" />}
                  </div>
                  <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />
                  {uniqueYears.map(year => {
                    const isSelected = yearFilter === String(year);
                    return (
                      <div
                        key={year}
                        onClick={() => {
                          setYearFilter(String(year));
                          setYearDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <FaCalendar size={14} color="#6B7280" />
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {year}
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
            <span style={{ fontSize: '14px', color: '#6B7280' }}>
              {filteredAllocations.length} allocazioni
            </span>
          </div>
        </div>

        <div className="tp-card-body" data-tour="allocations-list">
          {/* Active Filters Badge */}
          {activeFiltersCount > 0 && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                <FaFilter style={{ marginRight: '6px' }} />
                {filteredAllocations.length} allocazioni trovate
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button
                className="tp-clear-filters-btn"
                onClick={clearAllFilters}
              >
                Rimuovi tutti i filtri
              </button>
            </div>
          )}

          {Object.keys(groupedByAsset).length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon"><FaBoxOpen /></div>
              <h3 className="tp-empty-title">Nessuna allocazione trovata</h3>
              <p className="tp-empty-description">
                {activeFiltersCount > 0
                  ? 'Prova a modificare i filtri o i termini di ricerca'
                  : 'Inizia creando la tua prima allocazione'}
              </p>
              {activeFiltersCount > 0 ? (
                <button className="tp-btn tp-btn-outline" onClick={clearAllFilters}>
                  Rimuovi filtri
                </button>
              ) : (
                <button className="tp-btn tp-btn-primary" onClick={openNewAllocationModal}>
                  <FaPlus /> Crea Allocazione
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.values(groupedByAsset).map(group => (
                <div key={group.asset.id} style={{
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden'
                }}>
                  {/* Asset Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: 'white',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        backgroundColor: group.asset.categoria?.colore || '#6B7280'
                      }} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{group.asset.nome}</h3>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{group.asset.codice}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        <strong style={{ color: '#1F2937' }}>{group.allocations.length}</strong> allocazioni
                      </span>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        <strong style={{ color: '#1F2937' }}>{formatCurrency(group.allocations.reduce((s, a) => s + (a.prezzo_concordato || 0), 0))}</strong> totale
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ padding: '16px 20px' }}>
                    {group.allocations
                      .sort((a, b) => new Date(b.data_inizio) - new Date(a.data_inizio))
                      .map((alloc, index) => {
                        const statusInfo = getStatusInfo(alloc.status);
                        const StatusIcon = statusInfo.icon;
                        const priceVariation = calculatePriceVariation(alloc);
                        const isExpanded = expandedAllocations[alloc.id];

                        return (
                          <div key={alloc.id} style={{ display: 'flex', gap: '14px' }}>
                            {/* Timeline connector */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '16px' }}>
                              <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: statusInfo.color,
                                flexShrink: 0
                              }} />
                              {index < group.allocations.length - 1 && (
                                <div style={{ width: '2px', flex: 1, background: '#E5E7EB', marginTop: '6px' }} />
                              )}
                            </div>

                            {/* Content */}
                            <div
                              style={{
                                flex: 1,
                                background: isExpanded ? 'white' : '#FFFFFF',
                                borderRadius: '10px',
                                padding: '14px 16px',
                                marginBottom: '10px',
                                cursor: 'pointer',
                                border: isExpanded ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                                transition: 'all 0.2s'
                              }}
                              onClick={() => toggleExpand(alloc.id)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>
                                    <FaUsers size={12} style={{ color: '#9CA3AF' }} />
                                    {alloc.sponsor?.ragione_sociale}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                                    {formatDate(alloc.data_inizio)} - {formatDate(alloc.data_fine)}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                      {formatCurrency(alloc.prezzo_concordato)}
                                    </span>
                                    {priceVariation !== null && (
                                      <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: priceVariation >= 0 ? '#DCFCE7' : '#FEE2E2',
                                        color: priceVariation >= 0 ? '#16A34A' : '#DC2626'
                                      }}>
                                        {priceVariation >= 0 ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                                        {Math.abs(priceVariation).toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                  <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: statusInfo.bg,
                                    color: statusInfo.color
                                  }}>
                                    <StatusIcon size={10} />
                                    {statusInfo.label}
                                  </span>
                                  <button style={{
                                    width: '28px',
                                    height: '28px',
                                    border: 'none',
                                    background: 'transparent',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: '#9CA3AF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Details */}
                              {isExpanded && (
                                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E5E7EB' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Stagione</label>
                                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>{alloc.stagione}</span>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Quantità</label>
                                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>{alloc.quantita}</span>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Creata il</label>
                                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>{formatDate(alloc.created_at)}</span>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Durata</label>
                                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>
                                        {Math.round((new Date(alloc.data_fine) - new Date(alloc.data_inizio)) / (1000 * 60 * 60 * 24 * 30))} mesi
                                      </span>
                                    </div>
                                  </div>
                                  {alloc.note && (
                                    <div style={{ background: '#F3F4F6', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                                      <label style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Note</label>
                                      <p style={{ margin: 0, fontSize: '13px', color: '#4B5563' }}>{alloc.note}</p>
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      className="tp-btn tp-btn-outline"
                                      style={{ padding: '6px 12px', fontSize: '12px' }}
                                      onClick={(e) => { e.stopPropagation(); navigate(`/club/sponsors/${alloc.sponsor_id}`); }}
                                    >
                                      <FaEye size={10} /> Vedi Sponsor
                                    </button>
                                    {alloc.contract_id && (
                                      <button
                                        className="tp-btn tp-btn-outline"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                        onClick={(e) => { e.stopPropagation(); navigate(`/club/contracts/${alloc.contract_id}`); }}
                                      >
                                        <FaFileAlt size={10} /> Vedi Contratto
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalItems > itemsPerPage && (
            <div className="tp-pagination" style={{ marginTop: '24px' }}>
              <div className="tp-pagination-info">
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} di {totalItems} allocazioni
              </div>
              <ul className="tp-pagination-list">
                <li
                  className={`tp-pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                >
                  ‹
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <li className="tp-pagination-item" style={{ background: 'transparent', cursor: 'default' }}>...</li>
                      )}
                      <li
                        className={`tp-pagination-item ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </li>
                    </span>
                  ))
                }
                <li
                  className={`tp-pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                >
                  ›
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* New Allocation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuova Allocazione"
        maxWidth="500px"
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Asset <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={allocationForm.asset_id}
                onChange={(e) => handleFormChange('asset_id', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="">Seleziona asset...</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.codice} - {asset.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Sponsor <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={allocationForm.sponsor_id}
                onChange={(e) => handleFormChange('sponsor_id', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="">Seleziona sponsor...</option>
                {sponsors.map(sponsor => (
                  <option key={sponsor.id} value={sponsor.id}>{sponsor.ragione_sociale || sponsor.company_name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Data Inizio <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={allocationForm.data_inizio}
                  onChange={(e) => handleFormChange('data_inizio', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Data Fine <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={allocationForm.data_fine}
                  onChange={(e) => handleFormChange('data_fine', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Quantità</label>
                <input
                  type="number"
                  min="1"
                  value={allocationForm.quantita}
                  onChange={(e) => handleFormChange('quantita', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Prezzo (€)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={allocationForm.prezzo_concordato}
                  onChange={(e) => handleFormChange('prezzo_concordato', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Note</label>
              <textarea
                rows="3"
                placeholder="Note aggiuntive..."
                value={allocationForm.note}
                onChange={(e) => handleFormChange('note', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{ padding: '10px 20px', border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', color: '#374151' }}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSaveAllocation}
              disabled={saving}
              style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#1A1A1A', color: 'white', fontWeight: 600, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Salvataggio...' : 'Crea Allocazione'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Support Widget */}
      <SupportWidget
        pageTitle="Storico Allocazioni"
        pageDescription="Visualizza lo storico completo delle allocazioni degli asset. Monitora i contratti attivi, analizza le variazioni di prezzo nel tempo e gestisci le relazioni con gli sponsor."
        pageIcon={FaHistory}
        docsSection="inventory-allocations"
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleTourClose}
        onComplete={handleTourClose}
      />

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default InventoryAllocations;
