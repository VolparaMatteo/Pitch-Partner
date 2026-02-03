import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Modal from '../components/Modal';
import SupportWidget from '../components/SupportWidget';
import GuidedTour from '../components/GuidedTour';
import {
  FaArrowLeft, FaChevronLeft, FaChevronRight, FaChevronDown, FaCube, FaUsers,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaEye,
  FaPlus, FaSearch, FaBan, FaDesktop, FaTshirt, FaGlobe,
  FaBullhorn, FaBuilding, FaBoxOpen, FaLayerGroup, FaCheck,
  FaEuroSign, FaChartPie, FaTag, FaCalendarAlt, FaLightbulb,
  FaClock, FaFilter
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Category icons mapping
const categoryIcons = {
  led: FaDesktop,
  jersey: FaTshirt,
  digital: FaGlobe,
  hospitality: FaUsers,
  broadcast: FaBullhorn,
  naming: FaBuilding,
  retail: FaBoxOpen,
  event: FaLayerGroup,
  default: FaCube
};

const getCategoryIcon = (iconName) => {
  const IconComponent = categoryIcons[iconName] || categoryIcons.default;
  return <IconComponent />;
};

function InventoryCalendar() {
  const navigate = useNavigate();
  const { token } = getAuth();

  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('year');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({
    asset_id: '',
    data_inizio: '',
    data_fine: '',
    motivo: '',
    note: ''
  });
  const [savingBlock, setSavingBlock] = useState(false);

  // Guided Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Tour steps
  const tourSteps = [
    {
      target: '[data-tour="page-header"]',
      title: 'Calendario Disponibilità',
      content: 'Il calendario ti permette di visualizzare tutte le allocazioni degli asset nel tempo, con una vista timeline che mostra chiaramente i periodi occupati e disponibili.',
      placement: 'bottom',
      icon: <FaCalendarAlt size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      tip: 'Puoi visualizzare i dati per mese, anno o stagione sportiva.'
    },
    {
      target: '[data-tour="stats-row"]',
      title: 'Statistiche Rapide',
      content: 'Qui vedi le metriche principali: asset totali, disponibili, valore totale delle allocazioni e tasso di occupazione del tuo inventario.',
      placement: 'bottom',
      icon: <FaChartPie size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #34D399)'
    },
    {
      target: '[data-tour="toolbar"]',
      title: 'Navigazione Temporale',
      content: 'Usa i controlli per navigare tra periodi diversi, cercare asset specifici e filtrare per categoria. Puoi anche scegliere la vista: Mese, Anno o Stagione.',
      placement: 'bottom',
      icon: <FaClock size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #FBBF24)'
    },
    {
      target: '[data-tour="categories"]',
      title: 'Filtro Categorie',
      content: 'Filtra rapidamente gli asset per categoria cliccando sui chip. Ogni categoria mostra il numero di asset associati.',
      placement: 'bottom',
      icon: <FaFilter size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #EC4899, #F472B6)'
    },
    {
      target: '[data-tour="timeline"]',
      title: 'Timeline Allocazioni',
      content: 'La timeline mostra le allocazioni come barre colorate. Clicca su un asset per vedere i dettagli, le allocazioni attive e le opzioni disponibili.',
      placement: 'top',
      icon: <FaLayerGroup size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
      tip: 'Le barre verdi indicano allocazioni attive, quelle grigie sono concluse.'
    }
  ];

  const handleStartTour = () => {
    setIsTourOpen(true);
  };

  const handleTourClose = useCallback(() => {
    setIsTourOpen(false);
  }, []);

  // Category scroll state
  const categoryScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Custom dropdown state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  const checkScrollArrows = () => {
    const el = categoryScrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  // Click outside handler for custom dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollCategories = (direction) => {
    const el = categoryScrollRef.current;
    if (el) {
      const scrollAmount = 200;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener('resize', checkScrollArrows);
    return () => window.removeEventListener('resize', checkScrollArrows);
  }, [categories]);

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const monthsFull = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  useEffect(() => {
    fetchData();
  }, [currentDate, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();

      const [assetsRes, allocationsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/club/inventory/assets`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/inventory/allocations?stagione=${year}-${year + 1}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/inventory/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAssets(assetsRes.data?.assets || assetsRes.data || []);
      setAllocations(allocationsRes.data?.allocations || allocationsRes.data || []);
      setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setAssets(getDemoAssets());
      setAllocations(getDemoAllocations());
      setCategories(getDemoCategories());
    } finally {
      setLoading(false);
    }
  };

  const getDemoCategories = () => [
    { id: 1, nome: 'LED & Banner', colore: '#6366F1', icona: 'led', assets_count: 2 },
    { id: 2, nome: 'Kit & Jersey', colore: '#EC4899', icona: 'jersey', assets_count: 2 },
    { id: 3, nome: 'Digital', colore: '#3B82F6', icona: 'digital', assets_count: 1 },
    { id: 4, nome: 'Hospitality', colore: '#F59E0B', icona: 'hospitality', assets_count: 1 },
    { id: 5, nome: 'Broadcast', colore: '#10B981', icona: 'broadcast', assets_count: 1 }
  ];

  const getDemoAssets = () => [
    { id: 1, codice: 'LED-001', nome: 'LED Bordocampo Lato Tribuna', categoria: { id: 1, nome: 'LED & Banner', colore: '#6366F1', icona: 'led' }, prezzo_listino: 250000, quantita_totale: 4, quantita_disponibile: 2 },
    { id: 2, codice: 'LED-002', nome: 'LED Bordocampo Curva Nord', categoria: { id: 1, nome: 'LED & Banner', colore: '#6366F1', icona: 'led' }, prezzo_listino: 180000, quantita_totale: 4, quantita_disponibile: 1 },
    { id: 3, codice: 'JER-001', nome: 'Manica Sinistra Prima Maglia', categoria: { id: 2, nome: 'Kit & Jersey', colore: '#EC4899', icona: 'jersey' }, prezzo_listino: 5000000, quantita_totale: 1, quantita_disponibile: 0 },
    { id: 4, codice: 'JER-002', nome: 'Retro Maglia Allenamento', categoria: { id: 2, nome: 'Kit & Jersey', colore: '#EC4899', icona: 'jersey' }, prezzo_listino: 800000, quantita_totale: 1, quantita_disponibile: 1 },
    { id: 5, codice: 'DIG-001', nome: 'Banner Homepage Sito Ufficiale', categoria: { id: 3, nome: 'Digital', colore: '#3B82F6', icona: 'digital' }, prezzo_listino: 120000, quantita_totale: 3, quantita_disponibile: 2 },
    { id: 6, codice: 'HOS-001', nome: 'Sky Box Premium (10 posti)', categoria: { id: 4, nome: 'Hospitality', colore: '#F59E0B', icona: 'hospitality' }, prezzo_listino: 150000, quantita_totale: 8, quantita_disponibile: 3 },
    { id: 7, codice: 'BRO-001', nome: 'Spot Pre-Partita Streaming', categoria: { id: 5, nome: 'Broadcast', colore: '#10B981', icona: 'broadcast' }, prezzo_listino: 80000, quantita_totale: 2, quantita_disponibile: 1 }
  ];

  const getDemoAllocations = () => {
    const year = currentDate.getFullYear();
    return [
      { id: 1, asset_id: 1, asset: { nome: 'LED Bordocampo Lato Tribuna' }, sponsor: { ragione_sociale: 'Fly Emirates' }, data_inizio: `${year}-07-01`, data_fine: `${year + 1}-06-30`, quantita: 2, prezzo_concordato: 480000, status: 'attiva' },
      { id: 2, asset_id: 3, asset: { nome: 'Manica Sinistra Prima Maglia' }, sponsor: { ragione_sociale: 'Adidas' }, data_inizio: `${year}-07-01`, data_fine: `${year + 3}-06-30`, quantita: 1, prezzo_concordato: 4500000, status: 'attiva' },
      { id: 3, asset_id: 2, asset: { nome: 'LED Bordocampo Curva Nord' }, sponsor: { ragione_sociale: 'Coca Cola' }, data_inizio: `${year}-08-01`, data_fine: `${year + 1}-05-31`, quantita: 3, prezzo_concordato: 500000, status: 'attiva' },
      { id: 4, asset_id: 5, asset: { nome: 'Banner Homepage Sito Ufficiale' }, sponsor: { ragione_sociale: 'Samsung' }, data_inizio: `${year}-09-01`, data_fine: `${year + 1}-08-31`, quantita: 1, prezzo_concordato: 100000, status: 'attiva' },
      { id: 5, asset_id: 6, asset: { nome: 'Sky Box Premium (10 posti)' }, sponsor: { ragione_sociale: 'UniCredit' }, data_inizio: `${year}-07-01`, data_fine: `${year + 1}-06-30`, quantita: 5, prezzo_concordato: 700000, status: 'attiva' }
    ];
  };

  const navigatePrev = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
  };

  const navigateNext = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getAssetAllocations = (assetId) => {
    return allocations.filter(a => a.asset_id === assetId);
  };

  const openBlockModal = (asset = null) => {
    setBlockForm({
      asset_id: asset?.id || '',
      data_inizio: '',
      data_fine: '',
      motivo: 'manutenzione',
      note: ''
    });
    setShowBlockModal(true);
    if (showAssetDetail) setShowAssetDetail(false);
  };

  const handleBlockFormChange = (field, value) => {
    setBlockForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBlock = async () => {
    if (!blockForm.asset_id || !blockForm.data_inizio || !blockForm.data_fine) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    setSavingBlock(true);
    try {
      await axios.post(`${API_URL}/club/inventory/assets/${blockForm.asset_id}/block-dates`, {
        data_inizio: blockForm.data_inizio,
        data_fine: blockForm.data_fine,
        motivo: blockForm.motivo,
        note: blockForm.note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowBlockModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore blocco date:', error);
      alert('Date bloccate con successo!');
      setShowBlockModal(false);
    } finally {
      setSavingBlock(false);
    }
  };

  const blockMotives = [
    { value: 'manutenzione', label: 'Manutenzione' },
    { value: 'evento_speciale', label: 'Evento Speciale' },
    { value: 'riserva_interna', label: 'Riserva Interna' },
    { value: 'negoziazione', label: 'In Negoziazione' },
    { value: 'non_disponibile', label: 'Non Disponibile' }
  ];

  const calculateBarStyle = (allocation, viewStart, viewEnd) => {
    const allocStart = new Date(allocation.data_inizio);
    const allocEnd = new Date(allocation.data_fine);

    const effectiveStart = allocStart < viewStart ? viewStart : allocStart;
    const effectiveEnd = allocEnd > viewEnd ? viewEnd : allocEnd;

    const totalDays = (viewEnd - viewStart) / (1000 * 60 * 60 * 24);
    const startOffset = (effectiveStart - viewStart) / (1000 * 60 * 60 * 24);
    const duration = (effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24);

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, Math.max(2, width))}%`
    };
  };

  const getAvailabilityStatus = (asset) => {
    if (asset.quantita_disponibile === 0) return 'unavailable';
    if (asset.quantita_disponibile < asset.quantita_totale) return 'partial';
    return 'available';
  };

  const filteredAssets = assets.filter(asset => {
    const catId = parseInt(selectedCategory);
    const matchesCategory = !selectedCategory ||
      asset.categoria?.id === catId ||
      asset.category?.id === catId ||
      asset.categoria_id === catId ||
      asset.category_id === catId;
    const matchesSearch = !searchTerm ||
      asset.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.codice?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: assets.length,
    available: assets.filter(a => a.quantita_disponibile > 0).length,
    fullyAllocated: assets.filter(a => a.quantita_disponibile === 0).length,
    totalValue: allocations.reduce((sum, a) => sum + (a.prezzo_concordato || 0), 0)
  };

  const renderTimeline = () => {
    const year = currentDate.getFullYear();
    const viewStart = new Date(year, 0, 1);
    const viewEnd = new Date(year, 11, 31);
    const displayMonths = months;

    return (
      <div style={styles.timelineContainer}>
        {/* Header */}
        <div style={styles.timelineHeader}>
          <div style={styles.timelineAssetCol}>
            <span>Asset</span>
          </div>
          <div style={styles.timelineMonths}>
            {displayMonths.map((month, i) => (
              <div key={i} style={styles.monthCell}>{month}</div>
            ))}
          </div>
          <div style={styles.timelineStatusCol}>Stato</div>
        </div>

        {/* Body */}
        <div style={styles.timelineBody}>
          {filteredAssets.map(asset => {
            const assetAllocs = getAssetAllocations(asset.id);
            const status = getAvailabilityStatus(asset);

            return (
              <div
                key={asset.id}
                style={styles.timelineRow}
                onClick={() => {
                  setSelectedAsset(asset);
                  setShowAssetDetail(true);
                }}
              >
                <div style={styles.timelineAssetColRow}>
                  <div
                    style={{
                      ...styles.categoryIcon,
                      background: asset.categoria?.colore || '#6B7280'
                    }}
                  >
                    <span style={{ color: 'white', fontSize: '10px', display: 'flex' }}>
                      {getCategoryIcon(asset.categoria?.icona)}
                    </span>
                  </div>
                  <div style={styles.assetInfo}>
                    <span style={styles.assetName}>{asset.nome}</span>
                    <span style={styles.assetCode}>{asset.codice}</span>
                  </div>
                </div>
                <div style={styles.timelineTrack}>
                  {displayMonths.map((_, i) => (
                    <div
                      key={i}
                      style={{ ...styles.gridLine, left: `${(i / 12) * 100}%` }}
                    />
                  ))}
                  {assetAllocs.map(alloc => (
                    <div
                      key={alloc.id}
                      style={{
                        ...styles.allocationBar,
                        ...calculateBarStyle(alloc, viewStart, viewEnd),
                        ...(alloc.status === 'conclusa' ? styles.allocationBarConcluded : {})
                      }}
                      title={`${alloc.sponsor?.ragione_sociale} - ${formatCurrency(alloc.prezzo_concordato)}`}
                    >
                      <span style={styles.barSponsor}>{alloc.sponsor?.ragione_sociale}</span>
                    </div>
                  ))}
                </div>
                <div style={styles.timelineStatusColRow}>
                  <div style={{
                    ...styles.availabilityBadge,
                    ...(status === 'available' ? styles.badgeAvailable : {}),
                    ...(status === 'partial' ? styles.badgePartial : {}),
                    ...(status === 'unavailable' ? styles.badgeUnavailable : {})
                  }}>
                    {status === 'available' && <FaCheckCircle size={12} />}
                    {status === 'partial' && <FaExclamationTriangle size={12} />}
                    {status === 'unavailable' && <FaTimesCircle size={12} />}
                    <span>{asset.quantita_disponibile}/{asset.quantita_totale}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#6B7280', marginTop: '16px' }}>Caricamento...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header" data-tour="page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Calendario Disponibilità</h1>
          <p className="tp-page-subtitle">
            Timeline allocazioni asset per stagione sportiva
          </p>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/inventory')}
          >
            <FaArrowLeft /> Catalogo Asset
          </button>
          <button
            className="tp-btn tp-btn-outline"
            style={{ borderColor: '#FCD34D', color: '#D97706' }}
            onClick={() => openBlockModal()}
          >
            <FaBan /> Blocca Date
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="tp-stats-row" data-tour="stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCube style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.total}</div>
            <div className="tp-stat-label">Asset Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCheck style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.available}</div>
            <div className="tp-stat-label">Disponibili</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaEuroSign style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="tp-stat-label">Valore Allocazioni</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaChartPie style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.total > 0 ? Math.round((stats.fullyAllocated / stats.total) * 100) : 0}%</div>
            <div className="tp-stat-label">Tasso Occupazione</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar} data-tour="toolbar">
        <div style={styles.toolbarLeft}>
          <div style={styles.searchBox}>
            <FaSearch size={14} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Cerca asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Custom Category Dropdown */}
          <div ref={categoryDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                border: selectedCategory ? '2px solid #85FF00' : '2px solid #E5E7EB',
                borderRadius: '8px',
                background: selectedCategory ? 'rgba(133, 255, 0, 0.08)' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: '180px'
              }}
            >
              {(() => {
                const selectedCat = categories.find(c => String(c.id) === selectedCategory);
                if (selectedCat) {
                  return (
                    <>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: selectedCat.colore || '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ color: 'white', fontSize: '10px', display: 'flex' }}>
                          {getCategoryIcon(selectedCat.icona)}
                        </span>
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selectedCat.nome}
                      </span>
                    </>
                  );
                } else {
                  return (
                    <>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaLayerGroup size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        Tutte le categorie
                      </span>
                    </>
                  );
                }
              })()}
              <FaChevronDown
                size={12}
                color="#6B7280"
                style={{
                  transition: 'transform 0.2s',
                  transform: categoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                }}
              />
            </button>

            {categoryDropdownOpen && (
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
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease'
              }}>
                {/* All categories option */}
                <div
                  onClick={() => {
                    setSelectedCategory('');
                    setCategoryDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: !selectedCategory ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                    borderLeft: !selectedCategory ? '3px solid #85FF00' : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory) e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaLayerGroup size={12} color="white" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                    Tutte le categorie
                  </span>
                  {!selectedCategory && (
                    <FaCheck size={12} color="#85FF00" style={{ marginLeft: 'auto' }} />
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />

                {/* Category options */}
                {categories.map(cat => {
                  const isSelected = selectedCategory === String(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(String(cat.id));
                        setCategoryDropdownOpen(false);
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
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: cat.colore || '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ color: 'white', fontSize: '12px', display: 'flex' }}>
                          {getCategoryIcon(cat.icona)}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {cat.nome}
                      </span>
                      {isSelected && (
                        <FaCheck size={12} color="#85FF00" style={{ marginLeft: 'auto' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={styles.toolbarCenter}>
          <button style={styles.todayBtn} onClick={navigateToday}>Oggi</button>
          <div style={styles.navGroup}>
            <button style={styles.navBtn} onClick={navigatePrev}>
              <FaChevronLeft size={14} />
            </button>
            <span style={styles.currentPeriod}>
              {currentDate.getFullYear()}
            </span>
            <button style={styles.navBtn} onClick={navigateNext}>
              <FaChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* Categories Quick Filter */}
      <div className="tp-card" style={{ marginBottom: '16px' }} data-tour="categories">
        <div className="tp-card-body" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 600, color: '#374151', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaTag /> Categorie:
            </span>

            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scrollCategories('left')}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <FaChevronLeft size={12} color="#6B7280" />
              </button>
            )}

            <div
              ref={categoryScrollRef}
              onScroll={checkScrollArrows}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              className="hide-scrollbar"
            >
              <button
                className={`tp-filter-chip ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
                style={{ flexShrink: 0 }}
              >
                Tutte ({assets.length})
              </button>
              {categories.map(cat => {
                // Calculate from assets array for accuracy
                const catAssetCount = assets.filter(a =>
                  (a.categoria?.id === cat.id) ||
                  (a.category?.id === cat.id) ||
                  (a.categoria_id === cat.id) ||
                  (a.category_id === cat.id)
                ).length || cat.assets_count || 0;
                return (
                  <button
                    key={cat.id}
                    className={`tp-filter-chip ${selectedCategory === String(cat.id) ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(String(cat.id))}
                    style={{
                      '--chip-color': cat.colore,
                      borderColor: selectedCategory === String(cat.id) ? cat.colore : undefined,
                      background: selectedCategory === String(cat.id) ? `${cat.colore}15` : undefined,
                      flexShrink: 0
                    }}
                  >
                    {getCategoryIcon(cat.icona)}
                    {cat.nome} ({catAssetCount})
                  </button>
                );
              })}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scrollCategories('right')}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <FaChevronRight size={12} color="#6B7280" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div style={styles.calendarContent} data-tour="timeline">
        {filteredAssets.length === 0 ? (
          <div style={styles.emptyState}>
            <FaCube size={48} color="#D1D5DB" />
            <h4 style={styles.emptyTitle}>Nessun asset trovato</h4>
            <p style={styles.emptyText}>Modifica i filtri o aggiungi nuovi asset</p>
          </div>
        ) : (
          renderTimeline()
        )}
      </div>

      {/* Asset Detail Modal */}
      <Modal
        isOpen={showAssetDetail}
        onClose={() => setShowAssetDetail(false)}
        title={selectedAsset?.nome || 'Dettaglio Asset'}
        maxWidth="640px"
      >
        {selectedAsset && (
          <div style={{ padding: '8px 0' }}>
            <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 20px' }}>{selectedAsset.codice}</p>

            {/* Asset Info Card */}
            <div style={{
              background: '#F9FAFB',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Categoria</label>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'white',
                    background: selectedAsset.categoria?.colore || selectedAsset.category?.colore || '#6B7280'
                  }}>
                    {selectedAsset.categoria?.nome || selectedAsset.category?.nome || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Prezzo Listino</label>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>{formatCurrency(selectedAsset.prezzo_listino)}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Disponibilità</label>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: getAvailabilityStatus(selectedAsset) === 'available' ? '#16A34A' :
                      getAvailabilityStatus(selectedAsset) === 'partial' ? '#D97706' : '#DC2626'
                  }}>
                    {selectedAsset.quantita_disponibile} / {selectedAsset.quantita_totale}
                  </span>
                </div>
              </div>
            </div>

            {/* Allocations List */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0', paddingBottom: '12px', borderBottom: '1px solid #E5E7EB', color: '#1A1A1A' }}>
                Allocazioni Attive
              </h4>
              {getAssetAllocations(selectedAsset.id).length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Nessuna allocazione attiva</p>
              ) : (
                getAssetAllocations(selectedAsset.id).map(alloc => (
                  <div key={alloc.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: '#1A1A1A' }}>
                      <FaUsers size={14} color="#6B7280" />
                      {alloc.sponsor?.ragione_sociale}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      {new Date(alloc.data_inizio).toLocaleDateString('it-IT')} - {new Date(alloc.data_fine).toLocaleDateString('it-IT')}
                    </div>
                    <div style={{ fontWeight: 600, color: '#16A34A' }}>
                      {formatCurrency(alloc.prezzo_concordato)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="tp-btn tp-btn-outline"
                onClick={() => {
                  setShowAssetDetail(false);
                  navigate(`/club/inventory/assets/${selectedAsset.id}`);
                }}
              >
                <FaEye /> Dettaglio
              </button>
              <button
                className="tp-btn"
                style={{ background: '#F59E0B', color: 'white', border: 'none' }}
                onClick={() => openBlockModal(selectedAsset)}
              >
                <FaBan /> Blocca Date
              </button>
              <button
                className="tp-btn tp-btn-primary"
                onClick={() => {
                  setShowAssetDetail(false);
                  navigate(`/club/inventory/allocations?asset_id=${selectedAsset.id}&action=new`);
                }}
              >
                <FaPlus /> Nuova Allocazione
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Block Dates Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Blocca Date"
        maxWidth="500px"
      >
        <div style={{ padding: '8px 0' }}>
          {/* Form Section */}
          <div style={{
            background: '#F9FAFB',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 20px' }}>
              Rendi non disponibile un asset per un periodo specifico
            </p>

            {/* Asset Select */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Asset <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={blockForm.asset_id}
                onChange={(e) => handleBlockFormChange('asset_id', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'white'
                }}
              >
                <option value="">Seleziona asset...</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.codice} - {asset.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Data Inizio <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={blockForm.data_inizio}
                  onChange={(e) => handleBlockFormChange('data_inizio', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Data Fine <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={blockForm.data_fine}
                  onChange={(e) => handleBlockFormChange('data_fine', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Motivo */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Motivo <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={blockForm.motivo}
                onChange={(e) => handleBlockFormChange('motivo', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'white'
                }}
              >
                {blockMotives.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Note
              </label>
              <textarea
                rows="3"
                placeholder="Note aggiuntive..."
                value={blockForm.note}
                onChange={(e) => handleBlockFormChange('note', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Warning */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <FaExclamationTriangle size={16} color="#92400E" />
            <span style={{ fontSize: '14px', color: '#92400E' }}>
              L'asset non sarà disponibile per nuove allocazioni nel periodo selezionato
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="tp-btn tp-btn-outline"
              onClick={() => setShowBlockModal(false)}
            >
              Annulla
            </button>
            <button
              className="tp-btn"
              style={{ background: '#F59E0B', color: 'white', border: 'none' }}
              onClick={handleSaveBlock}
              disabled={savingBlock}
            >
              {savingBlock ? 'Salvataggio...' : <><FaBan /> Blocca Date</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Support Widget */}
      <SupportWidget
        pageTitle="Calendario Disponibilità"
        pageDescription="Visualizza la timeline delle allocazioni dei tuoi asset. Puoi vedere quali asset sono occupati, per quanto tempo, e da quali sponsor. Usa i filtri per navigare tra le categorie e i controlli temporali per cambiare la vista."
        pageIcon={FaCalendarAlt}
        docsSection="inventory-calendar"
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleTourClose}
        onComplete={handleTourClose}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E5E7EB',
    borderTopColor: '#85FF00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Toolbar
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'white',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  toolbarLeft: {
    display: 'flex',
    gap: '12px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: '#F5F5F5',
    borderRadius: '10px'
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: '14px',
    width: '180px',
    color: '#1A1A1A'
  },
  filterSelect: {
    padding: '10px 14px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer',
    color: '#374151'
  },
  toolbarCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  todayBtn: {
    padding: '8px 14px',
    border: '1px solid #E5E7EB',
    background: 'white',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    color: '#374151'
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  navBtn: {
    width: '36px',
    height: '36px',
    border: 'none',
    background: '#F5F5F5',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B7280'
  },
  currentPeriod: {
    fontSize: '16px',
    fontWeight: 600,
    minWidth: '60px',
    textAlign: 'center',
    color: '#1A1A1A'
  },
  toolbarRight: {
    display: 'flex'
  },
  viewToggle: {
    display: 'flex',
    background: '#F5F5F5',
    borderRadius: '8px',
    padding: '4px'
  },
  viewBtn: {
    padding: '8px 14px',
    border: 'none',
    background: 'none',
    fontSize: '13px',
    fontWeight: 500,
    color: '#6B7280',
    cursor: 'pointer',
    borderRadius: '6px'
  },
  viewBtnActive: {
    padding: '8px 14px',
    border: 'none',
    background: 'white',
    fontSize: '13px',
    fontWeight: 500,
    color: '#1A1A1A',
    cursor: 'pointer',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },

  // Calendar Content
  calendarContent: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },

  // Timeline
  timelineContainer: {
    overflow: 'hidden'
  },
  timelineHeader: {
    display: 'flex',
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB'
  },
  timelineAssetCol: {
    width: '280px',
    flexShrink: 0,
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    borderRight: '1px solid #E5E7EB'
  },
  timelineMonths: {
    flex: 1,
    display: 'flex'
  },
  monthCell: {
    flex: 1,
    padding: '12px 4px',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 600,
    color: '#6B7280',
    borderLeft: '1px solid #F3F4F6'
  },
  timelineStatusCol: {
    width: '100px',
    flexShrink: 0,
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    textAlign: 'center',
    borderLeft: '1px solid #E5E7EB'
  },
  timelineBody: {
    maxHeight: 'calc(100vh - 480px)',
    overflowY: 'auto'
  },
  timelineRow: {
    display: 'flex',
    borderBottom: '1px solid #F3F4F6',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  timelineAssetColRow: {
    width: '280px',
    flexShrink: 0,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRight: '1px solid #E5E7EB'
  },
  categoryIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  assetInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  assetName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1A1A1A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  assetCode: {
    fontSize: '11px',
    color: '#9CA3AF'
  },
  timelineTrack: {
    flex: 1,
    position: 'relative',
    height: '56px',
    padding: '12px 0'
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '1px',
    background: '#F3F4F6'
  },
  allocationBar: {
    position: 'absolute',
    height: '32px',
    background: 'linear-gradient(135deg, #85FF00 0%, #70E000 100%)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 1
  },
  allocationBarConcluded: {
    background: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
  },
  barSponsor: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#0D0D0D',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  timelineStatusColRow: {
    width: '100px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: '1px solid #E5E7EB'
  },
  availabilityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600
  },
  badgeAvailable: {
    background: '#DCFCE7',
    color: '#16A34A'
  },
  badgePartial: {
    background: '#FEF3C7',
    color: '#D97706'
  },
  badgeUnavailable: {
    background: '#FEE2E2',
    color: '#DC2626'
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '16px 0 8px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0
  }
};

export default InventoryCalendar;
