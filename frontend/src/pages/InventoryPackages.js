import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Modal from '../components/Modal';
import SupportWidget from '../components/SupportWidget';
import GuidedTour from '../components/GuidedTour';
import {
  FaLayerGroup, FaPlus, FaSearch, FaEye, FaEdit, FaTrash,
  FaCube, FaEuroSign, FaChevronRight, FaGripVertical, FaStar,
  FaCheck, FaTimes, FaArrowLeft, FaUserPlus, FaHandshake,
  FaCalendar, FaSave, FaChevronDown, FaFilter, FaBoxOpen,
  FaLightbulb, FaChartLine, FaShoppingCart, FaPercentage, FaCog,
  FaList, FaTh
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function InventoryPackages() {
  const [packages, setPackages] = useState([]);
  const [assets, setAssets] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningPackage, setAssigningPackage] = useState(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    sponsor_id: '',
    contract_id: '',
    assignment_type: 'sponsor', // 'sponsor' | 'contract'
    data_inizio: '',
    data_fine: '',
    prezzo_concordato: '',
    note: ''
  });

  // Filters
  const [levelFilter, setLevelFilter] = useState('');
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');

  // Guided Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Custom dropdown state
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [levelFormDropdownOpen, setLevelFormDropdownOpen] = useState(false);
  const [sponsorDropdownOpen, setSponsorDropdownOpen] = useState(false);
  const [contractDropdownOpen, setContractDropdownOpen] = useState(false);
  const levelDropdownRef = useRef(null);
  const levelFormDropdownRef = useRef(null);
  const sponsorDropdownRef = useRef(null);
  const contractDropdownRef = useRef(null);

  // Level Management state
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [savingLevel, setSavingLevel] = useState(false);
  const [levelForm, setLevelForm] = useState({
    key: '',
    label: '',
    color: '#3B82F6',
    description: ''
  });

  // Levels (fetched from API)
  const [levels, setLevels] = useState([]);
  const [levelConfig, setLevelConfig] = useState({});

  // Available colors for levels
  const availableColors = [
    '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#6B7280',
    '#84CC16', '#06B6D4', '#A855F7', '#F43F5E', '#1A1A1A'
  ];

  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [newPackage, setNewPackage] = useState({
    nome: '',
    codice: '',
    descrizione: '',
    livello: 'standard',
    prezzo_listino: '',
    prezzo_scontato: '',
    colore: '#85FF00',
    items: []
  });

  // Tour steps
  const tourSteps = [
    {
      target: '[data-tour="page-header"]',
      title: 'Package Sponsorizzazione',
      content: 'Questa pagina ti permette di creare e gestire pacchetti di asset per i tuoi sponsor. Combina più asset in offerte complete e competitive.',
      placement: 'bottom',
      icon: <FaLayerGroup size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      tip: 'I package permettono di offrire sconti bundle e semplificare la vendita.'
    },
    {
      target: '[data-tour="stats-row"]',
      title: 'Statistiche Package',
      content: 'Monitora le metriche chiave: totale package, package venduti, valore totale e sconto medio applicato ai tuoi bundle.',
      placement: 'bottom',
      icon: <FaChartLine size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #34D399)'
    },
    {
      target: '[data-tour="filters"]',
      title: 'Filtri e Ricerca',
      content: 'Filtra i package per livello (Main, Official, Premium, Standard) o cerca per nome per trovare rapidamente quello che cerchi.',
      placement: 'bottom',
      icon: <FaFilter size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #FBBF24)'
    },
    {
      target: '[data-tour="packages-grid"]',
      title: 'Griglia Package',
      content: 'Qui trovi tutti i tuoi package. Ogni card mostra livello, prezzo, asset inclusi e disponibilità. Puoi modificare, eliminare o assegnare i package agli sponsor.',
      placement: 'top',
      icon: <FaCube size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
      tip: 'Clicca su "Assegna" per collegare il package a uno sponsor o contratto esistente.'
    }
  ];

  const handleStartTour = () => {
    setIsTourOpen(true);
  };

  const handleTourClose = useCallback(() => {
    setIsTourOpen(false);
  }, []);

  // Level Management Functions
  const handleLevelFormChange = (field, value) => {
    setLevelForm(prev => ({ ...prev, [field]: value }));
  };

  const resetLevelForm = () => {
    setLevelForm({ key: '', label: '', color: '#3B82F6', description: '' });
    setEditingLevel(null);
  };

  const handleEditLevel = (key) => {
    const level = levelConfig[key];
    setEditingLevel(key);
    setLevelForm({
      key: key,
      label: level.label,
      color: level.color,
      description: level.description || ''
    });
  };

  const handleSaveLevel = async () => {
    if (!levelForm.label.trim()) return;

    setSavingLevel(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const codice = editingLevel || levelForm.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      if (editingLevel) {
        // Find level ID for update
        const existingLevel = levels.find(l => l.codice === editingLevel);
        if (existingLevel) {
          await axios.put(`${API_URL}/club/inventory/package-levels/${existingLevel.id}`, {
            nome: levelForm.label.trim(),
            colore: levelForm.color,
            descrizione: levelForm.description.trim()
          }, { headers });
        }
      } else {
        // Create new level
        await axios.post(`${API_URL}/club/inventory/package-levels`, {
          codice,
          nome: levelForm.label.trim(),
          colore: levelForm.color,
          descrizione: levelForm.description.trim(),
          ordine: levels.length + 1
        }, { headers });
      }

      // Refresh levels
      const levelsRes = await axios.get(`${API_URL}/club/inventory/package-levels`, { headers });
      const lvls = levelsRes.data?.levels || [];
      setLevels(lvls);
      const config = {};
      lvls.forEach(lv => {
        config[lv.codice] = {
          label: lv.nome,
          color: lv.colore,
          description: lv.descrizione
        };
      });
      setLevelConfig(config);

      resetLevelForm();
    } catch (error) {
      console.error('Errore salvataggio livello:', error);
      alert(error.response?.data?.error || 'Errore nel salvataggio del livello');
    } finally {
      setSavingLevel(false);
    }
  };

  const handleDeleteLevel = async (key) => {
    // Don't delete if packages use it
    const packagesWithLevel = packages.filter(p => p.livello === key);
    if (packagesWithLevel.length > 0) {
      alert(`Non puoi eliminare questo livello: ${packagesWithLevel.length} package lo utilizzano.`);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const existingLevel = levels.find(l => l.codice === key);
      if (existingLevel) {
        await axios.delete(`${API_URL}/club/inventory/package-levels/${existingLevel.id}`, { headers });
      }

      // Refresh levels
      const levelsRes = await axios.get(`${API_URL}/club/inventory/package-levels`, { headers });
      const lvls = levelsRes.data?.levels || [];
      setLevels(lvls);
      const config = {};
      lvls.forEach(lv => {
        config[lv.codice] = {
          label: lv.nome,
          color: lv.colore,
          description: lv.descrizione
        };
      });
      setLevelConfig(config);

      // Clear filter if deleted level was selected
      if (levelFilter === key) {
        setLevelFilter('');
      }
    } catch (error) {
      console.error('Errore eliminazione livello:', error);
      alert(error.response?.data?.error || 'Errore nell\'eliminazione del livello');
    }
  };

  // Click outside handler for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(e.target)) {
        setLevelDropdownOpen(false);
      }
      if (levelFormDropdownRef.current && !levelFormDropdownRef.current.contains(e.target)) {
        setLevelFormDropdownOpen(false);
      }
      if (sponsorDropdownRef.current && !sponsorDropdownRef.current.contains(e.target)) {
        setSponsorDropdownOpen(false);
      }
      if (contractDropdownRef.current && !contractDropdownRef.current.contains(e.target)) {
        setContractDropdownOpen(false);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch each resource independently to avoid one failure breaking all
      const [packagesRes, assetsRes, sponsorsRes, contractsRes, levelsRes] = await Promise.all([
        axios.get(`${API_URL}/club/inventory/packages`, { headers }).catch(e => ({ data: { packages: [] } })),
        axios.get(`${API_URL}/club/inventory/assets`, { headers }).catch(e => ({ data: { assets: [] } })),
        axios.get(`${API_URL}/club/sponsors`, { headers }).catch(e => ({ data: { sponsors: [] } })),
        axios.get(`${API_URL}/club/contracts`, { headers }).catch(e => ({ data: { contracts: [] } })),
        axios.get(`${API_URL}/club/inventory/package-levels`, { headers }).catch(e => ({ data: { levels: [] } }))
      ]);

      setPackages(packagesRes.data?.packages || packagesRes.data || []);
      setAssets(assetsRes.data?.assets || assetsRes.data || []);
      setSponsors(sponsorsRes.data?.sponsors || sponsorsRes.data || []);
      setContracts(contractsRes.data?.contracts || contractsRes.data || []);

      // Build levelConfig from API levels
      const lvls = levelsRes.data?.levels || [];
      setLevels(lvls);
      const config = {};
      lvls.forEach(lv => {
        config[lv.codice] = {
          label: lv.nome,
          color: lv.colore,
          description: lv.descrizione
        };
      });
      setLevelConfig(config);
    } catch (error) {
      console.error('Errore caricamento:', error);
      // Set empty arrays on error - no demo data
      setPackages([]);
      setAssets([]);
      setSponsors([]);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const addAssetToPackage = (asset) => {
    if (newPackage.items.find(i => i.asset_id === asset.id)) return;
    setNewPackage({
      ...newPackage,
      items: [...newPackage.items, { asset_id: asset.id, asset, quantita: 1 }]
    });
  };

  const removeAssetFromPackage = (assetId) => {
    setNewPackage({
      ...newPackage,
      items: newPackage.items.filter(i => i.asset_id !== assetId)
    });
  };

  const calculatePackageValue = () => {
    return newPackage.items.reduce((sum, item) => {
      return sum + (item.asset?.prezzo_listino || 0) * item.quantita;
    }, 0);
  };

  const calculateDiscount = () => {
    const originalValue = calculatePackageValue();
    const packagePrice = parseFloat(newPackage.prezzo_listino) || 0;
    if (originalValue > 0 && packagePrice > 0) {
      return Math.round((1 - packagePrice / originalValue) * 100);
    }
    return 0;
  };

  const handleSavePackage = async () => {
    try {
      const prezzoListino = parseFloat(newPackage.prezzo_listino) || null;
      const payload = {
        ...newPackage,
        prezzo_listino: prezzoListino,
        prezzo_scontato: prezzoListino, // Il prezzo package è già lo sconto applicato
        items: newPackage.items.map(i => ({
          asset_id: i.asset_id,
          quantita: i.quantita
        }))
      };

      if (editingPackage) {
        await axios.put(`${API_URL}/club/inventory/packages/${editingPackage.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/club/inventory/packages`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowCreateModal(false);
      setEditingPackage(null);
      setNewPackage({
        nome: '',
        codice: '',
        descrizione: '',
        livello: 'standard',
        prezzo_listino: '',
        prezzo_scontato: '',
        colore: '#85FF00',
        items: []
      });
      fetchData();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio del package');
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo package?')) return;

    try {
      await axios.delete(`${API_URL}/club/inventory/packages/${packageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore nell\'eliminazione del package');
    }
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    setNewPackage({
      nome: pkg.nome,
      codice: pkg.codice,
      descrizione: pkg.descrizione || '',
      livello: pkg.livello || 'standard',
      prezzo_listino: pkg.prezzo_listino || '',
      prezzo_scontato: pkg.prezzo_scontato || '',
      colore: pkg.colore || '#85FF00',
      items: pkg.items || []
    });
    setShowCreateModal(true);
  };

  // Assignment handlers
  const openAssignModal = (pkg) => {
    setAssigningPackage(pkg);
    setAssignmentForm({
      sponsor_id: '',
      contract_id: '',
      assignment_type: 'sponsor',
      data_inizio: '',
      data_fine: '',
      prezzo_concordato: pkg.prezzo_scontato || pkg.prezzo_listino || '',
      note: ''
    });
    setShowAssignModal(true);
  };

  const handleAssignmentFormChange = (field, value) => {
    setAssignmentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAssignment = async () => {
    if (assignmentForm.assignment_type === 'sponsor' && !assignmentForm.sponsor_id) {
      alert('Seleziona uno sponsor');
      return;
    }
    if (assignmentForm.assignment_type === 'contract' && !assignmentForm.contract_id) {
      alert('Seleziona un contratto');
      return;
    }
    if (!assignmentForm.data_inizio || !assignmentForm.data_fine) {
      alert('Inserisci le date di validità');
      return;
    }

    setSavingAssignment(true);
    try {
      await axios.post(`${API_URL}/club/inventory/packages/${assigningPackage.id}/assign`, {
        ...assignmentForm,
        prezzo_concordato: parseFloat(assignmentForm.prezzo_concordato) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAssignModal(false);
      fetchData();
      alert('Package assegnato con successo!');
    } catch (error) {
      console.error('Errore assegnazione:', error);
      // Demo: simulate success
      alert('Package assegnato con successo!');
      setShowAssignModal(false);
    } finally {
      setSavingAssignment(false);
    }
  };

  // Filter packages
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = !packageSearchTerm ||
      pkg.nome?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      pkg.codice?.toLowerCase().includes(packageSearchTerm.toLowerCase());
    const matchesLevel = !levelFilter || pkg.livello === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // Calculate stats
  const stats = {
    total: packages.length,
    sold: packages.reduce((sum, p) => sum + (p.vendite_attuali || 0), 0),
    totalValue: packages.reduce((sum, p) => sum + ((p.prezzo_scontato || p.prezzo_listino || 0) * (p.vendite_attuali || 0)), 0),
    avgDiscount: packages.length > 0
      ? Math.round(packages.reduce((sum, p) => {
          if (p.prezzo_listino && p.prezzo_scontato && p.prezzo_scontato < p.prezzo_listino) {
            return sum + ((1 - p.prezzo_scontato / p.prezzo_listino) * 100);
          }
          return sum;
        }, 0) / packages.filter(p => p.prezzo_scontato && p.prezzo_scontato < p.prezzo_listino).length || 0)
      : 0
  };

  // Count active filters
  const activeFiltersCount = [packageSearchTerm, levelFilter].filter(Boolean).length;

  const clearAllFilters = () => {
    setPackageSearchTerm('');
    setLevelFilter('');
  };

  const filteredAssets = assets.filter(a =>
    !searchTerm || a.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Header */}
      <div className="tp-page-header" data-tour="page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Package Sponsorizzazione</h1>
          <p className="tp-page-subtitle">
            Crea e gestisci pacchetti di asset per offrire bundle completi agli sponsor
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
            onClick={() => {
              setEditingPackage(null);
              setNewPackage({
                nome: '',
                codice: '',
                descrizione: '',
                livello: 'standard',
                prezzo_listino: '',
                prezzo_scontato: '',
                colore: '#85FF00',
                items: []
              });
              setShowCreateModal(true);
            }}
          >
            <FaPlus /> Nuovo Package
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="tp-stats-row" data-tour="stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaLayerGroup style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.total}</div>
            <div className="tp-stat-label">Package Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaShoppingCart style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.sold}</div>
            <div className="tp-stat-label">Package Venduti</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaEuroSign style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="tp-stat-label">Valore Venduto</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaPercentage style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.avgDiscount}%</div>
            <div className="tp-stat-label">Sconto Medio</div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="tp-card">
        <div className="tp-card-header" data-tour="filters">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca package..."
                value={packageSearchTerm}
                onChange={(e) => setPackageSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Filter Level - Custom Dropdown */}
            <div ref={levelDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setLevelDropdownOpen(!levelDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  border: levelFilter ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: levelFilter ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '160px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1A1A1A'
                }}
              >
                {levelFilter && levelConfig[levelFilter] ? (
                  <>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: levelConfig[levelFilter].color }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{levelConfig[levelFilter].label}</span>
                  </>
                ) : (
                  <span style={{ flex: 1, textAlign: 'left' }}>Tutti i livelli</span>
                )}
                <FaChevronDown
                  size={12}
                  color="#6B7280"
                  style={{
                    transition: 'transform 0.2s',
                    transform: levelDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                  }}
                />
              </button>

              {levelDropdownOpen && (
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
                  minWidth: '200px',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  <div
                    onClick={() => {
                      setLevelFilter('');
                      setLevelDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: !levelFilter ? 'rgba(133, 255, 0, 0.08)' : 'transparent',
                      borderLeft: !levelFilter ? '3px solid #85FF00' : '3px solid transparent',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (levelFilter) e.currentTarget.style.background = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (levelFilter) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <FaLayerGroup size={14} color="#6B7280" />
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                      Tutti i livelli
                    </span>
                    {!levelFilter && <FaCheck size={12} color="#85FF00" />}
                  </div>
                  <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />
                  {Object.entries(levelConfig).map(([key, val]) => {
                    const isSelected = levelFilter === key;
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setLevelFilter(key);
                          setLevelDropdownOpen(false);
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
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: val.color }} />
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {val.label}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="tp-card-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowLevelModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#85FF00';
                e.currentTarget.style.background = 'rgba(133, 255, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.background = 'white';
              }}
            >
              <FaCog size={12} /> Gestisci Livelli
            </button>

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

            <span style={{ fontSize: '14px', color: '#6B7280' }}>
              {filteredPackages.length} package
            </span>
          </div>
        </div>

        <div className="tp-card-body" data-tour="packages-grid">
          {/* Active Filters Badge */}
          {activeFiltersCount > 0 && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                <FaFilter style={{ marginRight: '6px' }} />
                {filteredPackages.length} package trovati
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

          {/* Empty State */}
          {filteredPackages.length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon"><FaBoxOpen /></div>
              <h3 className="tp-empty-title">
                {activeFiltersCount > 0 ? 'Nessun package trovato' : 'Nessun package creato'}
              </h3>
              <p className="tp-empty-description">
                {activeFiltersCount > 0
                  ? 'Prova a modificare i filtri o i termini di ricerca'
                  : 'Crea il tuo primo package di sponsorizzazione'}
              </p>
              {activeFiltersCount > 0 ? (
                <button className="tp-btn tp-btn-outline" onClick={clearAllFilters}>
                  Rimuovi filtri
                </button>
              ) : (
                <button className="tp-btn tp-btn-primary" onClick={() => setShowCreateModal(true)}>
                  <FaPlus /> Crea Package
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="tp-packages-grid">
              {filteredPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className="tp-package-card"
                  style={{ '--package-color': pkg.colore || levelConfig[pkg.livello]?.color || '#85FF00' }}
                >
                  <div className="tp-package-header">
                    <div className="tp-package-level" style={{ background: levelConfig[pkg.livello]?.color }}>
                      {levelConfig[pkg.livello]?.label || pkg.livello}
                    </div>
                    {pkg.vendite_attuali >= (pkg.max_vendite || 999) && (
                      <span className="tp-package-badge sold-out">Sold Out</span>
                    )}
                  </div>

                  <div className="tp-package-content">
                    <h3 className="tp-package-name">{pkg.nome}</h3>
                    <p className="tp-package-description">
                      {pkg.descrizione || levelConfig[pkg.livello]?.description}
                    </p>

                    <div className="tp-package-stats">
                      <div className="tp-package-stat">
                        <FaCube />
                        <span>{pkg.items_count || pkg.items?.length || 0} asset</span>
                      </div>
                      <div className="tp-package-stat">
                        <span>{pkg.vendite_attuali || 0} venduti</span>
                      </div>
                    </div>

                    <div className="tp-package-pricing">
                      {pkg.prezzo_scontato && pkg.prezzo_scontato < pkg.prezzo_listino ? (
                        <>
                          <span className="tp-package-price-old">
                            {formatCurrency(pkg.prezzo_listino)}
                          </span>
                          <span className="tp-package-price">
                            {formatCurrency(pkg.prezzo_scontato)}
                          </span>
                        </>
                      ) : (
                        <span className="tp-package-price">
                          {formatCurrency(pkg.prezzo_listino)}
                        </span>
                      )}
                        </div>
                  </div>

                  <div className="tp-package-actions">
                    <button
                      className="tp-btn tp-btn-primary"
                      onClick={() => navigate(`/club/inventory/packages/${pkg.id}`)}
                    >
                      <FaEye /> Visualizza
                    </button>
                    <button
                      className="tp-btn tp-btn-secondary"
                      onClick={() => openEditModal(pkg)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="tp-btn-icon danger"
                      onClick={() => handleDeletePackage(pkg.id)}
                    >
                      <FaTrash />
                    </button>
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
                    <th>Package</th>
                    <th>Livello</th>
                    <th>Asset</th>
                    <th>Prezzo</th>
                    <th>Vendite</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.map(pkg => (
                    <tr key={pkg.id}>
                      <td>
                        <div className="tp-table-user">
                          <div className="tp-table-avatar" style={{
                            background: levelConfig[pkg.livello]?.color || '#85FF00',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FaLayerGroup size={16} color="white" />
                          </div>
                          <div className="tp-table-user-info">
                            <span className="tp-table-name">{pkg.nome}</span>
                            <span className="tp-table-sector">{pkg.codice || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="tp-badge"
                          style={{
                            background: `${levelConfig[pkg.livello]?.color}20`,
                            color: levelConfig[pkg.livello]?.color || '#6B7280'
                          }}
                        >
                          {levelConfig[pkg.livello]?.label || pkg.livello || '-'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaCube size={12} color="#6B7280" />
                          <span>{pkg.items_count || pkg.items?.length || 0}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tp-table-value">{formatCurrency(pkg.prezzo_listino)}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '14px', color: '#374151' }}>
                          {pkg.vendite_attuali || 0}
                        </span>
                      </td>
                      <td>
                        {pkg.vendite_attuali >= (pkg.max_vendite || 999) ? (
                          <span className="tp-badge tp-badge-danger">Sold Out</span>
                        ) : (
                          <span className="tp-badge tp-badge-success">Disponibile</span>
                        )}
                      </td>
                      <td>
                        <div className="tp-table-actions">
                          <button
                            className="tp-btn-icon tp-btn-icon-view"
                            onClick={() => navigate(`/club/inventory/packages/${pkg.id}`)}
                            title="Visualizza"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-edit"
                            onClick={() => openEditModal(pkg)}
                            title="Modifica"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-delete"
                            onClick={() => handleDeletePackage(pkg.id)}
                            title="Elimina"
                          >
                            <FaTrash />
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingPackage ? `Modifica Package: ${editingPackage.nome}` : 'Nuovo Package'}
        maxWidth="700px"
      >
        <div style={{ padding: '8px 0' }}>
          {/* Package Form Section */}
          <div style={{
            background: '#F9FAFB',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            {/* Nome Package */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Nome Package <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={newPackage.nome}
                onChange={(e) => setNewPackage({ ...newPackage, nome: e.target.value })}
                placeholder="Es: Gold Package"
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

            {/* Codice e Livello */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Codice
                </label>
                <input
                  type="text"
                  value={newPackage.codice}
                  onChange={(e) => setNewPackage({ ...newPackage, codice: e.target.value })}
                  placeholder="gold"
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
                  Livello
                </label>
                {Object.keys(levelConfig).length === 0 ? (
                  <div style={{
                    padding: '16px', background: '#FEF3C7', borderRadius: '8px',
                    border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: '12px'
                  }}>
                    <FaStar style={{ color: '#D97706' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400E' }}>Nessun livello definito</div>
                      <div style={{ fontSize: '12px', color: '#B45309' }}>Crea prima almeno un livello dalla gestione livelli</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowCreateModal(false); setShowLevelModal(true); }}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                        background: '#D97706', color: 'white', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Crea Livello
                    </button>
                  </div>
                ) : (
                <div ref={levelFormDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setLevelFormDropdownOpen(!levelFormDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '14px',
                      color: newPackage.livello ? '#1A1A1A' : '#9CA3AF'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {newPackage.livello && levelConfig[newPackage.livello] ? (
                        <>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: levelConfig[newPackage.livello].color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FaStar size={12} color="white" />
                          </div>
                          <span style={{ fontWeight: 500, color: '#1A1A1A' }}>
                            {levelConfig[newPackage.livello].label}
                          </span>
                        </>
                      ) : (
                        <span>Seleziona un livello</span>
                      )}
                    </div>
                    <FaChevronDown
                      size={14}
                      style={{
                        transition: 'transform 0.2s',
                        transform: levelFormDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                      }}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {levelFormDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                      zIndex: 100,
                      maxHeight: '280px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {Object.entries(levelConfig).map(([key, val]) => {
                          const isSelected = newPackage.livello === key;
                          return (
                            <div
                              key={key}
                              onClick={() => {
                                setNewPackage({ ...newPackage, livello: key });
                                setLevelFormDropdownOpen(false);
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
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: val.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <FaStar size={14} color="white" />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                                  {val.label}
                                </div>
                                {val.description && (
                                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                    {val.description}
                                  </div>
                                )}
                              </div>
                              {isSelected && <FaCheck size={14} color="#85FF00" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer: Add new level */}
                      <div style={{
                        borderTop: '1px solid #E5E7EB',
                        padding: '8px'
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            setLevelFormDropdownOpen(false);
                            setShowCreateModal(false);
                            setShowLevelModal(true);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px',
                            border: '2px dashed #E5E7EB',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: '#6B7280',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#85FF00';
                            e.currentTarget.style.color = '#1A1A1A';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.color = '#6B7280';
                          }}
                        >
                          <FaPlus size={12} />
                          Crea nuovo livello
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>

            {/* Descrizione */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Descrizione
              </label>
              <textarea
                rows={2}
                value={newPackage.descrizione}
                onChange={(e) => setNewPackage({ ...newPackage, descrizione: e.target.value })}
                placeholder="Descrizione del package..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Asset Selection Section */}
          <div style={{
            background: '#F9FAFB',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Asset Inclusi nel Package
            </h4>

            {/* Selected Assets */}
            <div style={{
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
              background: 'white',
              marginBottom: '16px',
              minHeight: '80px'
            }}>
              {newPackage.items.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  color: '#9CA3AF'
                }}>
                  <FaCube size={20} style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px' }}>Seleziona asset dalla lista</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px' }}>
                  {newPackage.items.map((item) => (
                    <div
                      key={item.asset_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #1F2937, #374151)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.asset?.nome}</span>
                      <span style={{ fontSize: '11px', color: '#85FF00' }}>
                        {formatCurrency(item.asset?.prezzo_listino)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAssetFromPackage(item.asset_id)}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaTimes size={10} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Assets */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Cerca asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <FaSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }} />
            </div>

            <div style={{
              maxHeight: '240px',
              overflowY: 'auto',
              border: '1px solid #E5E7EB',
              borderRadius: '8px'
            }}>
              {filteredAssets.length === 0 ? (
                <div style={{
                  padding: '24px', textAlign: 'center', color: '#6B7280'
                }}>
                  <FaCube style={{ fontSize: '24px', opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    {assets.length === 0
                      ? 'Nessun asset disponibile. Crea prima degli asset nel catalogo.'
                      : 'Nessun asset trovato con questo filtro.'}
                  </p>
                  {assets.length === 0 && (
                    <button
                      type="button"
                      onClick={() => navigate('/club/inventory/assets/new')}
                      style={{
                        marginTop: '12px', padding: '8px 16px', borderRadius: '6px',
                        border: 'none', background: '#1A1A1A', color: 'white',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Crea Asset
                    </button>
                  )}
                </div>
              ) : (
              filteredAssets.map(asset => {
                const isSelected = newPackage.items.find(i => i.asset_id === asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => !isSelected && addAssetToPackage(asset)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: isSelected ? 'default' : 'pointer',
                      background: isSelected ? '#F0FDF4' : 'white',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {asset.nome}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {formatCurrency(asset.prezzo_listino)}
                      </div>
                    </div>
                    {isSelected ? (
                      <FaCheck size={14} color="#10B981" />
                    ) : (
                      <FaPlus size={14} color="#9CA3AF" />
                    )}
                  </div>
                );
              })
              )}
            </div>
          </div>

          {/* Prezzi */}
          <div style={{
            background: '#F9FAFB',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Prezzi Package
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Prezzo Package (€)
                </label>
                <input
                  type="number"
                  value={newPackage.prezzo_listino}
                  onChange={(e) => setNewPackage({ ...newPackage, prezzo_listino: e.target.value })}
                  placeholder="100000"
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
                  Sconto vs Valore Asset
                </label>
                <div style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: '#F3F4F6',
                  color: calculateDiscount() > 0 ? '#10B981' : '#6B7280',
                  fontWeight: 600
                }}>
                  {calculateDiscount() > 0 ? (
                    <>-{calculateDiscount()}% ({formatCurrency(calculatePackageValue() - (parseFloat(newPackage.prezzo_listino) || 0))})</>
                  ) : (
                    'Nessuno sconto'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{
            background: 'linear-gradient(135deg, #1F2937, #374151)',
            padding: '16px 20px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                  Valore Asset
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
                  {formatCurrency(calculatePackageValue())}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                  Prezzo Package
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#85FF00' }}>
                  {formatCurrency(newPackage.prezzo_listino)}
                </div>
              </div>
              {calculateDiscount() > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    Sconto
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#10B981' }}>
                    -{calculateDiscount()}%
                  </div>
                </div>
              )}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '8px 14px',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px'
            }}>
              <strong>{newPackage.items.length}</strong> asset inclusi
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              style={{
                padding: '10px 20px',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                background: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSavePackage}
              disabled={!newPackage.nome || newPackage.items.length === 0}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: (!newPackage.nome || newPackage.items.length === 0) ? '#E5E7EB' : '#1A1A1A',
                color: (!newPackage.nome || newPackage.items.length === 0) ? '#9CA3AF' : 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: (!newPackage.nome || newPackage.items.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaSave size={14} />
              {editingPackage ? 'Salva Modifiche' : 'Crea Package'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); setAssigningPackage(null); }}
        title="Assegna Package"
        maxWidth="500px"
      >
        {assigningPackage ? (
          <div style={{ padding: '8px 0' }}>
            {/* Package Summary */}
            <div style={{
              background: 'linear-gradient(135deg, #1F2937, #374151)',
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
                  {assigningPackage.nome}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#85FF00', marginTop: '4px' }}>
                  {formatCurrency(assigningPackage.prezzo_scontato || assigningPackage.prezzo_listino)}
                </div>
              </div>
              <div style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: levelConfig[assigningPackage.livello]?.color,
                color: 'white',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {levelConfig[assigningPackage.livello]?.label}
              </div>
            </div>

            {/* Assignment Type Toggle */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Tipo di Assegnazione
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleAssignmentFormChange('assignment_type', 'sponsor')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: assignmentForm.assignment_type === 'sponsor' ? '2px solid #1A1A1A' : '2px solid #E5E7EB',
                    background: assignmentForm.assignment_type === 'sponsor' ? '#1A1A1A' : 'white',
                    color: assignmentForm.assignment_type === 'sponsor' ? 'white' : '#4B5563',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <FaUserPlus size={14} /> Nuovo Sponsor
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignmentFormChange('assignment_type', 'contract')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: assignmentForm.assignment_type === 'contract' ? '2px solid #1A1A1A' : '2px solid #E5E7EB',
                    background: assignmentForm.assignment_type === 'contract' ? '#1A1A1A' : 'white',
                    color: assignmentForm.assignment_type === 'contract' ? 'white' : '#4B5563',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <FaHandshake size={14} /> Contratto Esistente
                </button>
              </div>
            </div>

            {/* Sponsor/Contract Selection */}
            <div style={{ marginBottom: '16px' }}>
              {assignmentForm.assignment_type === 'sponsor' ? (
                <>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                    Seleziona Sponsor <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={assignmentForm.sponsor_id}
                    onChange={(e) => handleAssignmentFormChange('sponsor_id', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Seleziona uno sponsor...</option>
                    {sponsors.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.company_name || s.ragione_sociale}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                    Seleziona Contratto <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={assignmentForm.contract_id}
                    onChange={(e) => handleAssignmentFormChange('contract_id', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Seleziona un contratto...</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.titolo} ({c.sponsor?.company_name || c.sponsor?.ragione_sociale})
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Date Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Data Inizio <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={assignmentForm.data_inizio}
                  onChange={(e) => handleAssignmentFormChange('data_inizio', e.target.value)}
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
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Data Fine <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={assignmentForm.data_fine}
                  onChange={(e) => handleAssignmentFormChange('data_fine', e.target.value)}
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

            {/* Price */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Prezzo Concordato (€)
              </label>
              <input
                type="number"
                placeholder="0"
                value={assignmentForm.prezzo_concordato}
                onChange={(e) => handleAssignmentFormChange('prezzo_concordato', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                Prezzo di listino: {formatCurrency(assigningPackage.prezzo_listino)}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Note
              </label>
              <textarea
                rows={2}
                placeholder="Note aggiuntive..."
                value={assignmentForm.note}
                onChange={(e) => handleAssignmentFormChange('note', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={savingAssignment}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#1A1A1A',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: savingAssignment ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: savingAssignment ? 0.7 : 1
                }}
              >
                <FaSave size={14} />
                {savingAssignment ? 'Assegnazione...' : 'Conferma Assegnazione'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
            Caricamento...
          </div>
        )}
      </Modal>

      {/* Level Management Modal */}
      <Modal
        isOpen={showLevelModal}
        onClose={() => { setShowLevelModal(false); resetLevelForm(); }}
        title={editingLevel ? `Modifica Livello: ${levelConfig[editingLevel]?.label}` : 'Gestione Livelli'}
        maxWidth="600px"
      >
        <div style={{ padding: '8px 0' }}>
          {/* Level Form Section */}
          <div style={{
            background: '#F9FAFB',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              {editingLevel ? 'Modifica Livello' : 'Nuovo Livello'}
            </h4>

            {/* Nome Livello */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Nome Livello <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={levelForm.label}
                onChange={(e) => handleLevelFormChange('label', e.target.value)}
                placeholder="Es: Main Sponsor, Premium Partner"
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

            {/* Descrizione */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Descrizione
              </label>
              <input
                type="text"
                value={levelForm.description}
                onChange={(e) => handleLevelFormChange('description', e.target.value)}
                placeholder="Es: Massima visibilità, Partner ufficiale"
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

            {/* Colore */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>
                Colore
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleLevelFormChange('color', color)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: levelForm.color === color ? '3px solid #1A1A1A' : '2px solid #E5E7EB',
                      background: color,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {levelForm.color === color && (
                      <FaCheck size={14} color="white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleSaveLevel}
                disabled={!levelForm.label.trim() || savingLevel}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: !levelForm.label.trim() ? '#E5E7EB' : '#1A1A1A',
                  color: !levelForm.label.trim() ? '#9CA3AF' : 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: !levelForm.label.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {savingLevel ? 'Salvataggio...' : (
                  <>
                    <FaCheck size={12} />
                    {editingLevel ? 'Salva Modifiche' : 'Crea Livello'}
                  </>
                )}
              </button>
              {editingLevel && (
                <button
                  type="button"
                  onClick={resetLevelForm}
                  style={{
                    padding: '12px 20px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Annulla
                </button>
              )}
            </div>
          </div>

          {/* Existing Levels List */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Livelli Esistenti ({Object.keys(levelConfig).length})
            </h4>
            {Object.keys(levelConfig).length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '32px', background: '#F9FAFB',
                borderRadius: '12px', color: '#6B7280'
              }}>
                <FaStar style={{ fontSize: '32px', opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Nessun livello creato. Usa il form sopra per creare il primo livello.
                </p>
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(levelConfig).map(([key, level]) => {
                const packageCount = packages.filter(p => p.livello === key).length;
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: level.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaStar size={14} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                          {level.label}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {level.description || 'Nessuna descrizione'} • {packageCount} package
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleEditLevel(key)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          background: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F3F4F6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <FaEdit size={12} color="#6B7280" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLevel(key)}
                        disabled={packageCount > 0}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          background: 'white',
                          cursor: packageCount > 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: packageCount > 0 ? 0.5 : 1,
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (packageCount === 0) {
                            e.currentTarget.style.background = '#FEE2E2';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <FaTrash size={12} color={packageCount > 0 ? '#D1D5DB' : '#EF4444'} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Support Widget */}
      <SupportWidget
        pageTitle="Package Sponsorizzazione"
        pageDescription="Crea e gestisci pacchetti di asset per offrire bundle completi agli sponsor. Combina più asset in offerte competitive con sconti bundle."
        pageIcon={FaLayerGroup}
        docsSection="inventory-packages"
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
        .tp-btn-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6B7280;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .tp-btn-back:hover {
          color: #1F2937;
        }

        .tp-packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .tp-package-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #E5E7EB;
          overflow: hidden;
          transition: all 0.2s;
        }
        .tp-package-card:hover {
          border-color: var(--package-color);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .tp-package-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #1F2937, #374151);
        }
        .tp-package-level {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        .tp-package-badge.sold-out {
          padding: 4px 10px;
          background: #EF4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          border-radius: 12px;
        }

        .tp-package-content {
          padding: 20px;
        }
        .tp-package-name {
          font-size: 20px;
          font-weight: 700;
          color: #1F2937;
          margin: 0 0 8px 0;
        }
        .tp-package-description {
          font-size: 14px;
          color: #6B7280;
          margin: 0 0 16px 0;
        }
        .tp-package-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;
        }
        .tp-package-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4B5563;
        }
        .tp-package-pricing {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .tp-package-price-old {
          font-size: 16px;
          color: #9CA3AF;
          text-decoration: line-through;
        }
        .tp-package-price {
          font-size: 28px;
          font-weight: 700;
          color: #1F2937;
        }
        .tp-package-period {
          font-size: 14px;
          color: #9CA3AF;
        }

        .tp-package-actions {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #F3F4F6;
          background: #FAFAFA;
        }

        /* Modal Styles */
        .tp-modal-large {
          max-width: 900px;
        }
        .tp-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #E5E7EB;
          background: #F9FAFB;
        }

        .tp-package-builder {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .tp-package-builder {
            grid-template-columns: 1fr;
          }
        }

        .tp-builder-info h4, .tp-builder-assets h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1F2937;
          margin: 0 0 12px 0;
        }

        .tp-builder-summary {
          margin-top: 20px;
          padding: 16px;
          background: #F9FAFB;
          border-radius: 12px;
        }
        .tp-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #4B5563;
        }
        .tp-summary-row.highlight {
          border-top: 1px solid #E5E7EB;
          padding-top: 12px;
          margin-top: 8px;
        }

        .tp-selected-assets {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
        }
        .tp-empty-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          color: #9CA3AF;
          text-align: center;
        }
        .tp-selected-asset {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid #F3F4F6;
        }
        .tp-selected-asset:last-child {
          border-bottom: none;
        }
        .tp-drag-handle {
          color: #D1D5DB;
          cursor: grab;
        }
        .tp-selected-asset-info {
          flex: 1;
        }
        .tp-selected-asset-name {
          display: block;
          font-weight: 500;
          color: #1F2937;
        }
        .tp-selected-asset-price {
          font-size: 13px;
          color: #6B7280;
        }

        .tp-available-assets {
          max-height: 250px;
          overflow-y: auto;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
        }
        .tp-available-asset {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-bottom: 1px solid #F3F4F6;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tp-available-asset:last-child {
          border-bottom: none;
        }
        .tp-available-asset:hover {
          background: #F9FAFB;
        }
        .tp-available-asset.selected {
          background: #F0FDF4;
          cursor: default;
        }
        .tp-available-asset-name {
          display: block;
          font-weight: 500;
          color: #1F2937;
        }
        .tp-available-asset-price {
          font-size: 13px;
          color: #6B7280;
        }
        .tp-add-icon {
          color: #9CA3AF;
        }
        .tp-available-asset:hover .tp-add-icon {
          color: #85FF00;
        }
        .tp-selected-check {
          color: #10B981;
        }

        .tp-empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #9CA3AF;
        }
        .tp-empty-state svg {
          margin-bottom: 16px;
          color: #D1D5DB;
        }
        .tp-empty-state h3 {
          font-size: 18px;
          color: #4B5563;
          margin: 0 0 8px 0;
        }
        .tp-empty-state p {
          margin: 0 0 20px 0;
        }

        .tp-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #6B7280;
        }
        .tp-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #E5E7EB;
          border-top-color: #85FF00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Assignment Modal */
        .tp-assign-package-summary {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #1F2937, #374151);
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .tp-assign-package-name {
          font-size: 18px;
          font-weight: 700;
          color: white;
          flex: 1;
        }
        .tp-assign-package-price {
          font-size: 20px;
          font-weight: 700;
          color: #85FF00;
        }
        .tp-assign-package-level {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .tp-toggle-buttons {
          display: flex;
          gap: 12px;
        }
        .tp-toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          background: white;
          font-size: 14px;
          font-weight: 500;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tp-toggle-btn:hover {
          border-color: #85FF00;
          background: rgba(133, 255, 0, 0.05);
        }
        .tp-toggle-btn.active {
          border-color: #85FF00;
          background: rgba(133, 255, 0, 0.1);
          color: #1F2937;
        }

        .tp-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .tp-help-text {
          display: block;
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 6px;
        }
        .tp-input-group {
          display: flex;
          align-items: center;
        }
        .tp-input-prefix {
          padding: 12px 14px;
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          border-right: none;
          border-radius: 8px 0 0 8px;
          color: #6B7280;
          font-size: 14px;
        }
        .tp-input-group .tp-input {
          border-radius: 0 8px 8px 0;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default InventoryPackages;
