import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Modal from '../components/Modal';
import SupportWidget from '../components/SupportWidget';
import GuidedTour from '../components/GuidedTour';
import {
  FaArrowLeft, FaBalanceScale, FaPlus, FaTimes, FaCube,
  FaEuroSign, FaUsers, FaSearch, FaChevronDown, FaStar,
  FaLayerGroup, FaInfoCircle, FaChartBar, FaCog, FaCheck,
  FaDesktop, FaTshirt, FaGlobe, FaBullhorn, FaBuilding, FaBoxOpen,
  FaLightbulb, FaClipboardList, FaPercentage, FaExchangeAlt,
  FaChartPie, FaTags, FaMapMarkerAlt
} from 'react-icons/fa';
import '../styles/template-style.css';

// Icone per categorie
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function AssetCompare() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = getAuth();

  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Guided Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [assetsBeforeTour, setAssetsBeforeTour] = useState([]);

  const [expandedSections, setExpandedSections] = useState({
    info: true,
    pricing: true,
    availability: true,
    specs: true
  });

  // Tour steps
  const tourSteps = [
    {
      target: '[data-tour="page-header"]',
      title: 'Confronto Asset',
      content: 'Questa pagina ti permette di confrontare fino a 4 asset side-by-side per aiutarti nelle presentazioni commerciali e nelle trattative con gli sponsor.',
      placement: 'bottom',
      icon: <FaBalanceScale size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      tip: 'Puoi condividere il link della pagina per mantenere la selezione degli asset.',
      requiresAssets: 0
    },
    {
      target: '[data-tour="asset-slots"]',
      title: 'Slot Asset',
      content: 'Qui vedi gli asset selezionati per il confronto. Puoi aggiungerne fino a 4 cliccando su "Aggiungi Asset" o rimuoverli cliccando sulla X.',
      placement: 'bottom',
      icon: <FaBoxOpen size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #34D399)',
      requiresAssets: 0
    },
    {
      target: '[data-tour="comparison-table"]',
      title: 'Tabella Confronto',
      content: 'La tabella mostra il confronto dettagliato tra gli asset selezionati. I valori migliori sono evidenziati in verde, quelli peggiori in rosso.',
      placement: 'top',
      icon: <FaChartBar size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
      tip: 'Clicca sulle sezioni per espanderle o comprimerle.',
      requiresAssets: 4
    }
  ];

  const handleStartTour = () => {
    // Save current selection before tour starts
    setAssetsBeforeTour([...selectedAssets]);
    setIsTourOpen(true);
  };

  const handleTourStepChange = useCallback((stepIndex, step) => {
    if (step?.requiresAssets > 0 && assets.length > 0) {
      // Select random assets for demonstration
      const shuffled = [...assets].sort(() => 0.5 - Math.random());
      const demoAssets = shuffled.slice(0, Math.min(step.requiresAssets, assets.length));
      setSelectedAssets(demoAssets);
    }
  }, [assets]);

  const handleTourClose = useCallback(() => {
    setIsTourOpen(false);
    // Restore original selection
    setSelectedAssets(assetsBeforeTour);
    setAssetsBeforeTour([]);
  }, [assetsBeforeTour]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const assetIds = searchParams.get('assets')?.split(',').filter(Boolean) || [];
    if (assetIds.length > 0 && assets.length > 0) {
      const selected = assets.filter(a => assetIds.includes(String(a.id)));
      setSelectedAssets(selected);
    }
  }, [searchParams, assets]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/club/inventory/assets`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/inventory/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAssets(assetsRes.data?.assets || assetsRes.data || []);
      setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setAssets(getDemoAssets());
      setCategories(getDemoCategories());
    } finally {
      setLoading(false);
    }
  };

  const getDemoCategories = () => [
    { id: 1, nome: 'LED & Banner', colore: '#6366F1', icona: 'led' },
    { id: 2, nome: 'Kit & Jersey', colore: '#EC4899', icona: 'jersey' },
    { id: 3, nome: 'Digital', colore: '#3B82F6', icona: 'digital' },
    { id: 4, nome: 'Hospitality', colore: '#F59E0B', icona: 'hospitality' },
    { id: 5, nome: 'Broadcast', colore: '#10B981', icona: 'broadcast' }
  ];

  const getDemoAssets = () => [
    {
      id: 1,
      codice: 'LED-001',
      nome: 'LED Bordocampo Lato Tribuna',
      descrizione: 'Pannelli LED ad alta definizione posizionati lungo il lato tribuna dello stadio.',
      categoria: { id: 1, nome: 'LED & Banner', colore: '#6366F1', icona: 'led' },
      tipo: 'fisico',
      posizione: 'Lato Tribuna - Stadio',
      dimensioni: '120m x 1m',
      prezzo_listino: 250000,
      prezzo_minimo: 200000,
      quantita_totale: 4,
      quantita_disponibile: 2,
      specifiche_tecniche: { risoluzione: '1080p', luminosita: '5000 nits', refresh: '60Hz' },
      pricing_tiers: [
        { nome: 'Partita Standard', prezzo: 8000 },
        { nome: 'Derby', prezzo: 15000 },
        { nome: 'Champions League', prezzo: 25000 }
      ],
      allocazioni_attive: 2,
      revenue_totale: 960000
    },
    {
      id: 2,
      codice: 'LED-002',
      nome: 'LED Bordocampo Curva Nord',
      descrizione: 'Pannelli LED posizionati nella curva nord, massima visibilità per il pubblico della curva.',
      categoria: { id: 1, nome: 'LED & Banner', colore: '#6366F1', icona: 'led' },
      tipo: 'fisico',
      posizione: 'Curva Nord - Stadio',
      dimensioni: '80m x 1m',
      prezzo_listino: 180000,
      prezzo_minimo: 140000,
      quantita_totale: 4,
      quantita_disponibile: 1,
      specifiche_tecniche: { risoluzione: '1080p', luminosita: '5000 nits', refresh: '60Hz' },
      pricing_tiers: [
        { nome: 'Partita Standard', prezzo: 6000 },
        { nome: 'Derby', prezzo: 12000 },
        { nome: 'Champions League', prezzo: 20000 }
      ],
      allocazioni_attive: 3,
      revenue_totale: 720000
    },
    {
      id: 3,
      codice: 'JER-001',
      nome: 'Manica Sinistra Prima Maglia',
      descrizione: 'Posizione premium sulla manica sinistra della prima maglia ufficiale.',
      categoria: { id: 2, nome: 'Kit & Jersey', colore: '#EC4899', icona: 'jersey' },
      tipo: 'fisico',
      posizione: 'Manica Sinistra',
      dimensioni: '10cm x 8cm',
      prezzo_listino: 5000000,
      prezzo_minimo: 4000000,
      quantita_totale: 1,
      quantita_disponibile: 0,
      specifiche_tecniche: { materiale: 'Ricamo HD', colori: 'Full color', durata: 'Stagione completa' },
      pricing_tiers: [
        { nome: 'Stagione Completa', prezzo: 5000000 }
      ],
      allocazioni_attive: 1,
      revenue_totale: 13500000
    },
    {
      id: 4,
      codice: 'DIG-001',
      nome: 'Banner Homepage Sito Ufficiale',
      descrizione: 'Banner pubblicitario in posizione premium sulla homepage del sito ufficiale del club.',
      categoria: { id: 3, nome: 'Digital', colore: '#3B82F6', icona: 'digital' },
      tipo: 'digitale',
      posizione: 'Homepage - Above the fold',
      dimensioni: '970x250 px',
      prezzo_listino: 120000,
      prezzo_minimo: 90000,
      quantita_totale: 3,
      quantita_disponibile: 2,
      specifiche_tecniche: { formato: 'HTML5/GIF/JPG', peso_max: '150KB', impression: '2M/mese' },
      pricing_tiers: [
        { nome: 'Mensile', prezzo: 10000 },
        { nome: 'Trimestrale', prezzo: 27000 },
        { nome: 'Stagione', prezzo: 120000 }
      ],
      allocazioni_attive: 1,
      revenue_totale: 320000
    },
    {
      id: 5,
      codice: 'HOS-001',
      nome: 'Sky Box Premium (10 posti)',
      descrizione: 'Box esclusivo con vista panoramica sul campo, servizio catering premium.',
      categoria: { id: 4, nome: 'Hospitality', colore: '#F59E0B', icona: 'hospitality' },
      tipo: 'esperienza',
      posizione: 'Tribuna VIP - Livello 3',
      dimensioni: '35mq',
      prezzo_listino: 150000,
      prezzo_minimo: 120000,
      quantita_totale: 8,
      quantita_disponibile: 3,
      specifiche_tecniche: { posti: '10', servizi: 'Catering, Hostess, Parcheggio', accesso: 'Dedicato' },
      pricing_tiers: [
        { nome: 'Partita Singola', prezzo: 5000 },
        { nome: 'Pacchetto 5 Partite', prezzo: 22000 },
        { nome: 'Stagione Completa', prezzo: 150000 }
      ],
      allocazioni_attive: 5,
      revenue_totale: 700000
    }
  ];

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const addAsset = (asset) => {
    if (selectedAssets.length >= 4) return;
    if (selectedAssets.find(a => a.id === asset.id)) return;

    const newSelected = [...selectedAssets, asset];
    setSelectedAssets(newSelected);
    updateURLParams(newSelected);
    setShowAssetPicker(false);
    setSearchTerm('');
    setCategoryFilter('');
  };

  const removeAsset = (assetId) => {
    const newSelected = selectedAssets.filter(a => a.id !== assetId);
    setSelectedAssets(newSelected);
    updateURLParams(newSelected);
  };

  const updateURLParams = (selected) => {
    if (selected.length > 0) {
      setSearchParams({ assets: selected.map(a => a.id).join(',') });
    } else {
      setSearchParams({});
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const availableAssets = assets.filter(asset => {
    const notSelected = !selectedAssets.find(a => a.id === asset.id);
    const matchesSearch = !searchTerm ||
      asset.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.codice?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter ||
      asset.categoria?.id === parseInt(categoryFilter) ||
      asset.category?.id === parseInt(categoryFilter);
    return notSelected && matchesSearch && matchesCategory;
  });

  const getComparisonHighlight = (assets, getValue, type = 'neutral') => {
    const values = assets.map(getValue);
    const numericValues = values.filter(v => typeof v === 'number');

    if (numericValues.length < 2) {
      return { values, best: null, worst: null };
    }

    let best, worst;
    if (type === 'higher') {
      best = Math.max(...numericValues);
      worst = Math.min(...numericValues);
    } else if (type === 'lower') {
      best = Math.min(...numericValues);
      worst = Math.max(...numericValues);
    }

    return { values, best, worst };
  };

  const renderComparisonRow = (label, getValue, options = {}) => {
    const { format = 'text', type = 'neutral', highlight = true } = options;
    const { values, best, worst } = getComparisonHighlight(selectedAssets, getValue, type);

    return (
      <div className="compare-row">
        <div className="compare-label">{label}</div>
        {selectedAssets.map((asset, index) => {
          const value = values[index];
          const isBest = highlight && value === best && best !== worst;
          const isWorst = highlight && value === worst && best !== worst;

          let displayValue = value;
          if (format === 'currency') displayValue = formatCurrency(value);
          else if (format === 'boolean') displayValue = value ? 'Sì' : 'No';
          else if (value === null || value === undefined) displayValue = '-';

          return (
            <div
              key={asset.id}
              className={`compare-value ${isBest ? 'best' : ''} ${isWorst ? 'worst' : ''}`}
            >
              {isBest && <FaStar size={12} style={{ color: '#16A34A', marginRight: '6px' }} />}
              {displayValue}
            </div>
          );
        })}
        {/* Empty cells for unfilled slots */}
        {Array(4 - selectedAssets.length).fill(0).map((_, i) => (
          <div key={`empty-${i}`} className="compare-value empty">-</div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento asset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header" data-tour="page-header">
        <div className="tp-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="tp-btn tp-btn-outline"
              onClick={() => navigate('/club/inventory')}
              style={{ padding: '10px 14px' }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="tp-page-title">Confronta Asset</h1>
              <p className="tp-page-subtitle">
                Confronto side-by-side per sales pitch e trattative commerciali
              </p>
            </div>
          </div>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => setShowAssetPicker(true)}
            disabled={selectedAssets.length >= 4}
          >
            <FaPlus /> Aggiungi Asset
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="tp-stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaBalanceScale style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{selectedAssets.length}/4</div>
            <div className="tp-stat-label">Asset Selezionati</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaEuroSign style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">
              {formatCurrency(selectedAssets.reduce((sum, a) => sum + (a.prezzo_listino || 0), 0))}
            </div>
            <div className="tp-stat-label">Valore Totale</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaChartPie style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">
              {selectedAssets.length > 0
                ? formatCurrency(selectedAssets.reduce((sum, a) => sum + (a.prezzo_listino || 0), 0) / selectedAssets.length)
                : '-'
              }
            </div>
            <div className="tp-stat-label">Media Prezzo</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaBoxOpen style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{assets.length}</div>
            <div className="tp-stat-label">Asset Disponibili</div>
          </div>
        </div>
      </div>

      {/* Asset Slots */}
      <div className="tp-card" style={{ marginBottom: '24px' }} data-tour="asset-slots">
        <div className="tp-card-header">
          <h3 className="tp-card-title">
            <FaLayerGroup /> Asset da Confrontare
          </h3>
          {selectedAssets.length > 0 && (
            <button
              className="tp-btn tp-btn-outline tp-btn-sm"
              onClick={() => {
                setSelectedAssets([]);
                setSearchParams({});
              }}
            >
              <FaTimes /> Rimuovi tutti
            </button>
          )}
        </div>
        <div className="tp-card-body">
          <div className="compare-slots-grid">
            {/* Selected Assets */}
            {selectedAssets.map(asset => (
              <div key={asset.id} className="compare-slot filled">
                <button
                  className="compare-slot-remove"
                  onClick={() => removeAsset(asset.id)}
                >
                  <FaTimes size={10} />
                </button>

                <div
                  className="compare-slot-image"
                  style={{
                    background: asset.immagine_principale
                      ? 'transparent'
                      : `linear-gradient(135deg, ${asset.categoria?.colore || asset.category?.colore || '#6B7280'}, ${asset.categoria?.colore || asset.category?.colore || '#6B7280'}dd)`
                  }}
                >
                  {asset.immagine_principale ? (
                    <img src={getImageUrl(asset.immagine_principale)} alt={asset.nome} />
                  ) : (
                    <span className="compare-slot-icon">
                      {getCategoryIcon(asset.categoria?.icona || asset.category?.icona)}
                    </span>
                  )}
                </div>

                <div className="compare-slot-content">
                  <span className="compare-slot-code">{asset.codice}</span>
                  <h4 className="compare-slot-name">{asset.nome}</h4>
                  <span
                    className="compare-slot-category"
                    style={{
                      background: `${asset.categoria?.colore || asset.category?.colore || '#6B7280'}15`,
                      color: asset.categoria?.colore || asset.category?.colore || '#6B7280'
                    }}
                  >
                    {asset.categoria?.nome || asset.category?.nome || 'Asset'}
                  </span>
                  <div className="compare-slot-price">
                    {formatCurrency(asset.prezzo_listino)}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty Slots */}
            {Array(4 - selectedAssets.length).fill(0).map((_, index) => (
              <button
                key={`empty-${index}`}
                className="compare-slot empty"
                onClick={() => setShowAssetPicker(true)}
              >
                <div className="compare-slot-empty-icon">
                  <FaPlus size={20} />
                </div>
                <span className="compare-slot-empty-text">Aggiungi Asset</span>
                <span className="compare-slot-empty-hint">
                  Slot {selectedAssets.length + index + 1} di 4
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table - only show when at least 2 assets are selected */}
      {selectedAssets.length >= 2 && (
        <div className="tp-card" data-tour="comparison-table">
          <div className="tp-card-header">
            <h3 className="tp-card-title">
              <FaChartBar /> Tabella Confronto
            </h3>
          </div>
          <div className="compare-table">
            {/* Info Section */}
            <div className="compare-section">
              <button
                className="compare-section-header"
                onClick={() => toggleSection('info')}
              >
                <div className="compare-section-title">
                  <FaInfoCircle size={16} />
                  <span>Informazioni Generali</span>
                </div>
                <FaChevronDown
                  size={14}
                  style={{
                    transform: expandedSections.info ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>
              {expandedSections.info && (
                <div className="compare-section-body">
                  {renderComparisonRow('Tipo', a => a.tipo)}
                  {renderComparisonRow('Posizione', a => a.posizione)}
                  {renderComparisonRow('Dimensioni', a => a.dimensioni)}
                </div>
              )}
            </div>

            {/* Pricing Section */}
            <div className="compare-section">
              <button
                className="compare-section-header"
                onClick={() => toggleSection('pricing')}
              >
                <div className="compare-section-title">
                  <FaEuroSign size={16} />
                  <span>Prezzi</span>
                </div>
                <FaChevronDown
                  size={14}
                  style={{
                    transform: expandedSections.pricing ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>
              {expandedSections.pricing && (
                <div className="compare-section-body">
                  {renderComparisonRow('Prezzo Listino', a => a.prezzo_listino, { format: 'currency', type: 'lower' })}
                  {renderComparisonRow('Prezzo Minimo', a => a.prezzo_minimo, { format: 'currency', type: 'lower' })}
                  {renderComparisonRow('Revenue Totale', a => a.revenue_totale, { format: 'currency', type: 'higher' })}

                  {/* Pricing Tiers */}
                  <div className="compare-row">
                    <div className="compare-label">Pricing Tiers</div>
                    {selectedAssets.map(asset => (
                      <div key={asset.id} className="compare-value" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                        {asset.pricing_tiers?.length > 0 ? (
                          asset.pricing_tiers.map((tier, i) => (
                            <div key={i} className="compare-tier">
                              <span className="compare-tier-name">{tier.nome}</span>
                              <span className="compare-tier-price">{formatCurrency(tier.prezzo)}</span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>-</span>
                        )}
                      </div>
                    ))}
                    {Array(4 - selectedAssets.length).fill(0).map((_, i) => (
                      <div key={`empty-${i}`} className="compare-value empty">-</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Availability Section */}
            <div className="compare-section">
              <button
                className="compare-section-header"
                onClick={() => toggleSection('availability')}
              >
                <div className="compare-section-title">
                  <FaChartBar size={16} />
                  <span>Disponibilità</span>
                </div>
                <FaChevronDown
                  size={14}
                  style={{
                    transform: expandedSections.availability ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>
              {expandedSections.availability && (
                <div className="compare-section-body">
                  {renderComparisonRow('Quantità Totale', a => a.quantita_totale, { type: 'higher' })}
                  {renderComparisonRow('Quantità Disponibile', a => a.quantita_disponibile, { type: 'higher' })}
                  {renderComparisonRow('Allocazioni Attive', a => a.allocazioni_attive)}

                  {/* Availability Bars */}
                  <div className="compare-row">
                    <div className="compare-label">Occupazione</div>
                    {selectedAssets.map(asset => {
                      const total = asset.quantita_totale || 1;
                      const available = asset.quantita_disponibile || 0;
                      const occupied = total - available;
                      const percentage = (occupied / total) * 100;
                      const barColor = percentage === 100 ? '#EF4444' : percentage > 50 ? '#F59E0B' : '#22C55E';
                      return (
                        <div key={asset.id} className="compare-value" style={{ flexDirection: 'column', gap: '8px' }}>
                          <div className="compare-progress-bar">
                            <div
                              className="compare-progress-fill"
                              style={{ width: `${percentage}%`, background: barColor }}
                            />
                          </div>
                          <span className="compare-progress-text" style={{ color: barColor }}>
                            {percentage.toFixed(0)}% occupato
                          </span>
                        </div>
                      );
                    })}
                    {Array(4 - selectedAssets.length).fill(0).map((_, i) => (
                      <div key={`empty-${i}`} className="compare-value empty">-</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Specs Section */}
            <div className="compare-section">
              <button
                className="compare-section-header"
                onClick={() => toggleSection('specs')}
              >
                <div className="compare-section-title">
                  <FaCog size={16} />
                  <span>Specifiche Tecniche</span>
                </div>
                <FaChevronDown
                  size={14}
                  style={{
                    transform: expandedSections.specs ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>
              {expandedSections.specs && (
                <div className="compare-section-body">
                  {(() => {
                    const allSpecs = new Set();
                    selectedAssets.forEach(a => {
                      if (a.specifiche_tecniche) {
                        Object.keys(a.specifiche_tecniche).forEach(k => allSpecs.add(k));
                      }
                    });

                    if (allSpecs.size === 0) {
                      return (
                        <div className="compare-row">
                          <div className="compare-label">Specifiche</div>
                          <div className="compare-value empty" style={{ flex: 4, color: '#9CA3AF', fontStyle: 'italic' }}>
                            Nessuna specifica tecnica disponibile
                          </div>
                        </div>
                      );
                    }

                    return Array.from(allSpecs).map(spec => (
                      <div key={spec} className="compare-row">
                        <div className="compare-label" style={{ textTransform: 'capitalize' }}>{spec}</div>
                        {selectedAssets.map(asset => (
                          <div key={asset.id} className="compare-value">
                            {asset.specifiche_tecniche?.[spec] || '-'}
                          </div>
                        ))}
                        {Array(4 - selectedAssets.length).fill(0).map((_, i) => (
                          <div key={`empty-${i}`} className="compare-value empty">-</div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
      <Modal
        isOpen={showAssetPicker}
        onClose={() => {
          setShowAssetPicker(false);
          setSearchTerm('');
          setCategoryFilter('');
        }}
        title="Seleziona Asset da Confrontare"
        maxWidth="640px"
      >
        <div className="compare-modal-content">
          {/* Filters */}
          <div className="compare-modal-filters">
            <div className="compare-modal-search">
              <FaSearch size={14} color="#9CA3AF" />
              <input
                type="text"
                placeholder="Cerca per nome o codice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="compare-modal-select"
            >
              <option value="">Tutte le categorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="compare-modal-count">
            {availableAssets.length} asset disponibil{availableAssets.length === 1 ? 'e' : 'i'}
          </div>

          {/* Asset List */}
          <div className="compare-modal-list">
            {availableAssets.length === 0 ? (
              <div className="compare-modal-empty">
                <FaCube size={32} color="#D1D5DB" />
                <p>Nessun asset trovato</p>
              </div>
            ) : (
              availableAssets.map(asset => (
                <div
                  key={asset.id}
                  className="compare-modal-item"
                  onClick={() => addAsset(asset)}
                >
                  <div
                    className="compare-modal-item-icon"
                    style={{
                      background: asset.immagine_principale
                        ? 'transparent'
                        : `linear-gradient(135deg, ${asset.categoria?.colore || asset.category?.colore || '#6B7280'}, ${asset.categoria?.colore || asset.category?.colore || '#6B7280'}dd)`
                    }}
                  >
                    {asset.immagine_principale ? (
                      <img
                        src={getImageUrl(asset.immagine_principale)}
                        alt={asset.nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '12px'
                        }}
                      />
                    ) : (
                      getCategoryIcon(asset.categoria?.icona || asset.category?.icona)
                    )}
                  </div>
                  <div className="compare-modal-item-content">
                    <span className="compare-modal-item-code">{asset.codice}</span>
                    <span className="compare-modal-item-name">{asset.nome}</span>
                    <span className="compare-modal-item-cat">
                      {asset.categoria?.nome || asset.category?.nome}
                    </span>
                  </div>
                  <div className="compare-modal-item-right">
                    <span className="compare-modal-item-price">
                      {formatCurrency(asset.prezzo_listino)}
                    </span>
                    <span
                      className={`compare-modal-item-badge ${asset.quantita_disponibile > 0 ? 'available' : 'unavailable'}`}
                    >
                      {asset.quantita_disponibile}/{asset.quantita_totale}
                    </span>
                  </div>
                  <div className="compare-modal-item-add">
                    <FaPlus />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Support Widget */}
      <SupportWidget
        pageTitle="Confronta Asset"
        pageDescription="In questa pagina puoi confrontare fino a 4 asset side-by-side. Seleziona gli asset che vuoi confrontare per vedere prezzi, disponibilità, specifiche tecniche e altre informazioni in una vista comparativa perfetta per le presentazioni commerciali."
        pageIcon={FaBalanceScale}
        docsSection="inventory-catalog"
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleTourClose}
        onComplete={handleTourClose}
        onStepChange={handleTourStepChange}
      />

      {/* Custom styles for compare page */}
      <style>{`
        .tp-page {
          min-height: auto !important;
          padding-bottom: 24px;
        }

        .compare-slots-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 1200px) {
          .compare-slots-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .compare-slots-grid {
            grid-template-columns: 1fr;
          }
        }

        .compare-slot {
          position: relative;
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .compare-slot.filled {
          background: white;
          border: 2px solid #E5E7EB;
          padding: 20px;
        }

        .compare-slot.filled:hover {
          border-color: #85FF00;
          box-shadow: 0 4px 20px rgba(133, 255, 0, 0.15);
        }

        .compare-slot.empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 280px;
          background: #FAFAFA;
          border: 2px dashed #E5E7EB;
          cursor: pointer;
          color: #9CA3AF;
        }

        .compare-slot.empty:hover {
          border-color: #85FF00;
          background: rgba(133, 255, 0, 0.05);
        }

        .compare-slot-remove {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3F4F6;
          border: none;
          border-radius: 8px;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 2;
        }

        .compare-slot-remove:hover {
          background: #FEE2E2;
          color: #DC2626;
        }

        .compare-slot-image {
          width: 100%;
          height: 120px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .compare-slot-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .compare-slot-icon {
          color: white;
          font-size: 32px;
          display: flex;
        }

        .compare-slot-content {
          text-align: center;
        }

        .compare-slot-code {
          font-size: 11px;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .compare-slot-name {
          font-size: 15px;
          font-weight: 600;
          color: #1A1A1A;
          margin: 8px 0 12px;
          line-height: 1.3;
        }

        .compare-slot-category {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .compare-slot-price {
          font-size: 20px;
          font-weight: 700;
          color: #1A1A1A;
        }

        .compare-slot-empty-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3F4F6;
          border-radius: 50%;
          margin-bottom: 16px;
          color: #9CA3AF;
        }

        .compare-slot-empty-text {
          font-size: 15px;
          font-weight: 600;
          color: #6B7280;
        }

        .compare-slot-empty-hint {
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 4px;
        }

        /* Comparison Table */
        .compare-table {
          border-radius: 0 0 12px 12px;
          overflow: hidden;
        }

        .compare-section {
          border-bottom: 1px solid #E5E7EB;
        }

        .compare-section:last-child {
          border-bottom: none;
        }

        .compare-section-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: linear-gradient(135deg, #1A1A1A, #2D2D2D);
          border: none;
          cursor: pointer;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .compare-section-header:hover {
          background: linear-gradient(135deg, #2D2D2D, #374151);
        }

        .compare-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .compare-section-body {
          background: white;
        }

        .compare-row {
          display: flex;
          border-bottom: 1px solid #F3F4F6;
        }

        .compare-row:last-child {
          border-bottom: none;
        }

        .compare-label {
          width: 180px;
          flex-shrink: 0;
          padding: 16px 20px;
          font-size: 13px;
          font-weight: 600;
          color: #6B7280;
          background: #FAFAFA;
          border-right: 1px solid #F3F4F6;
        }

        .compare-value {
          flex: 1;
          padding: 16px 20px;
          font-size: 14px;
          color: #1A1A1A;
          display: flex;
          align-items: center;
          border-right: 1px solid #F3F4F6;
          transition: all 0.2s;
        }

        .compare-value:last-child {
          border-right: none;
        }

        .compare-value.empty {
          color: #D1D5DB;
          background: #FAFAFA;
        }

        .compare-value.best {
          background: linear-gradient(135deg, #DCFCE7, #D1FAE5);
          color: #16A34A;
          font-weight: 600;
        }

        .compare-value.worst {
          background: linear-gradient(135deg, #FEF2F2, #FEE2E2);
          color: #DC2626;
        }

        .compare-tier {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 12px;
          padding: 4px 0;
        }

        .compare-tier-name {
          color: #6B7280;
        }

        .compare-tier-price {
          font-weight: 600;
          color: #1A1A1A;
        }

        .compare-progress-bar {
          width: 100%;
          height: 8px;
          background: #E5E7EB;
          border-radius: 4px;
          overflow: hidden;
        }

        .compare-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .compare-progress-text {
          font-size: 12px;
          font-weight: 600;
        }

        /* Empty State */
        .compare-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 20px;
          text-align: center;
        }

        .compare-empty-icon {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
          border-radius: 50%;
          color: #9CA3AF;
          margin-bottom: 24px;
        }

        .compare-empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px;
        }

        .compare-empty-state p {
          font-size: 15px;
          color: #9CA3AF;
          margin: 0 0 32px;
          max-width: 400px;
          line-height: 1.6;
        }

        /* Modal Styles */
        .compare-modal-content {
          padding: 0;
        }

        .compare-modal-filters {
          display: flex;
          gap: 12px;
          padding: 0 0 16px;
          border-bottom: 1px solid #E5E7EB;
          margin-bottom: 16px;
        }

        .compare-modal-search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #F5F5F5;
          border-radius: 10px;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .compare-modal-search:focus-within {
          border-color: #85FF00;
          background: white;
        }

        .compare-modal-search input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          color: #1A1A1A;
        }

        .compare-modal-select {
          padding: 12px 16px;
          border: 2px solid #E5E7EB;
          border-radius: 10px;
          font-size: 13px;
          color: #374151;
          background: white;
          cursor: pointer;
          min-width: 180px;
        }

        .compare-modal-select:focus {
          outline: none;
          border-color: #85FF00;
        }

        .compare-modal-count {
          font-size: 13px;
          color: #6B7280;
          margin-bottom: 12px;
        }

        .compare-modal-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .compare-modal-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 20px;
          color: #9CA3AF;
        }

        .compare-modal-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #FAFAFA;
          border-radius: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .compare-modal-item:hover {
          background: white;
          border-color: #85FF00;
          transform: translateX(4px);
        }

        .compare-modal-item:last-child {
          margin-bottom: 0;
        }

        .compare-modal-item-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
          font-size: 18px;
        }

        .compare-modal-item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .compare-modal-item-code {
          font-size: 11px;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .compare-modal-item-name {
          font-size: 14px;
          font-weight: 600;
          color: #1A1A1A;
        }

        .compare-modal-item-cat {
          font-size: 12px;
          color: #6B7280;
        }

        .compare-modal-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .compare-modal-item-price {
          font-size: 14px;
          font-weight: 700;
          color: #1A1A1A;
        }

        .compare-modal-item-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .compare-modal-item-badge.available {
          background: #D1FAE5;
          color: #059669;
        }

        .compare-modal-item-badge.unavailable {
          background: #FEE2E2;
          color: #DC2626;
        }

        .compare-modal-item-add {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1A1A1A;
          border-radius: 8px;
          color: white;
          opacity: 0;
          transition: all 0.2s;
        }

        .compare-modal-item:hover .compare-modal-item-add {
          opacity: 1;
          background: #1A1A1A;
          color: white;
        }
      `}</style>
    </div>
  );
}

export default AssetCompare;
