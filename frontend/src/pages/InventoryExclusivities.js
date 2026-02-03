import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import {
  FaArrowLeft, FaPlus, FaTag, FaEdit, FaTrash, FaSearch,
  FaTimes, FaSave, FaExclamationTriangle, FaCheck, FaFilter,
  FaCalendar, FaBuilding, FaCube, FaChevronRight, FaShieldAlt,
  FaInfoCircle, FaLink
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Categorie merceologiche disponibili
const categorieSettori = [
  { value: 'bevande', label: 'Bevande & Soft Drinks', icon: '🥤' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'tech', label: 'Technology', icon: '💻' },
  { value: 'banking', label: 'Banking & Finance', icon: '🏦' },
  { value: 'insurance', label: 'Assicurazioni', icon: '🛡️' },
  { value: 'food', label: 'Food & Beverage', icon: '🍕' },
  { value: 'fashion', label: 'Fashion & Apparel', icon: '👔' },
  { value: 'telecom', label: 'Telecomunicazioni', icon: '📱' },
  { value: 'energy', label: 'Energy & Utilities', icon: '⚡' },
  { value: 'airlines', label: 'Airlines & Travel', icon: '✈️' },
  { value: 'betting', label: 'Betting & Gaming', icon: '🎰' },
  { value: 'crypto', label: 'Crypto & Blockchain', icon: '₿' }
];

function InventoryExclusivities() {
  const [exclusivities, setExclusivities] = useState([]);
  const [assets, setAssets] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingExclusivity, setEditingExclusivity] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    sponsor_id: '',
    categoria_settore: '',
    asset_ids: [],
    tipo_esclusiva: 'categoria', // 'categoria' | 'asset' | 'totale'
    data_inizio: '',
    data_fine: '',
    valore: '',
    note: ''
  });

  const navigate = useNavigate();
  const { user, token } = getAuth();

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

      const [exclusivitiesRes, assetsRes, sponsorsRes] = await Promise.all([
        axios.get(`${API_URL}/club/inventory/exclusivities`, { headers }),
        axios.get(`${API_URL}/club/inventory/assets`, { headers }),
        axios.get(`${API_URL}/club/sponsors`, { headers })
      ]);

      setExclusivities(exclusivitiesRes.data?.exclusivities || exclusivitiesRes.data || []);
      setAssets(assetsRes.data?.assets || assetsRes.data || []);
      setSponsors(sponsorsRes.data?.sponsors || sponsorsRes.data || []);
    } catch (error) {
      console.error('Errore caricamento:', error);
      // Demo data
      setExclusivities([
        {
          id: 1,
          sponsor_id: 1,
          sponsor_name: 'Coca-Cola Italia',
          categoria_settore: 'bevande',
          tipo_esclusiva: 'categoria',
          asset_ids: [],
          data_inizio: '2024-08-01',
          data_fine: '2025-06-30',
          valore: 150000,
          stato: 'attiva'
        },
        {
          id: 2,
          sponsor_id: 2,
          sponsor_name: 'Nike',
          categoria_settore: 'fashion',
          tipo_esclusiva: 'categoria',
          asset_ids: [],
          data_inizio: '2024-08-01',
          data_fine: '2025-06-30',
          valore: 200000,
          stato: 'attiva'
        },
        {
          id: 3,
          sponsor_id: 3,
          sponsor_name: 'Intesa Sanpaolo',
          categoria_settore: 'banking',
          tipo_esclusiva: 'totale',
          asset_ids: [],
          data_inizio: '2024-08-01',
          data_fine: '2026-06-30',
          valore: 500000,
          stato: 'attiva'
        },
        {
          id: 4,
          sponsor_id: 4,
          sponsor_name: 'TIM',
          categoria_settore: 'telecom',
          tipo_esclusiva: 'asset',
          asset_ids: [1, 2, 3],
          data_inizio: '2023-08-01',
          data_fine: '2024-06-30',
          valore: 120000,
          stato: 'scaduta'
        }
      ]);
      setAssets([
        { id: 1, nome: 'LED Board Tribuna Centrale', codice: 'LED-001' },
        { id: 2, nome: 'LED Board Curva Nord', codice: 'LED-002' },
        { id: 3, nome: 'Maglia Gara - Fronte', codice: 'JER-001' }
      ]);
      setSponsors([
        { id: 1, company_name: 'Coca-Cola Italia' },
        { id: 2, company_name: 'Nike' },
        { id: 3, company_name: 'Intesa Sanpaolo' },
        { id: 4, company_name: 'TIM' },
        { id: 5, company_name: 'Enel' }
      ]);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryInfo = (code) => {
    return categorieSettori.find(c => c.value === code) || { label: code, icon: '📦' };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'attiva':
        return <span className="tp-badge tp-badge-success">Attiva</span>;
      case 'scaduta':
        return <span className="tp-badge tp-badge-neutral">Scaduta</span>;
      case 'sospesa':
        return <span className="tp-badge tp-badge-warning">Sospesa</span>;
      default:
        return <span className="tp-badge tp-badge-neutral">{status}</span>;
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'categoria':
        return 'Categoria Merceologica';
      case 'asset':
        return 'Asset Specifici';
      case 'totale':
        return 'Esclusiva Totale';
      default:
        return tipo;
    }
  };

  const openNewExclusivity = () => {
    setEditingExclusivity(null);
    setFormData({
      sponsor_id: '',
      categoria_settore: '',
      asset_ids: [],
      tipo_esclusiva: 'categoria',
      data_inizio: '',
      data_fine: '',
      valore: '',
      note: ''
    });
    setShowModal(true);
  };

  const openEditExclusivity = (excl) => {
    setEditingExclusivity(excl);
    setFormData({
      sponsor_id: excl.sponsor_id,
      categoria_settore: excl.categoria_settore,
      asset_ids: excl.asset_ids || [],
      tipo_esclusiva: excl.tipo_esclusiva,
      data_inizio: excl.data_inizio,
      data_fine: excl.data_fine,
      valore: excl.valore,
      note: excl.note || ''
    });
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleAssetSelection = (assetId) => {
    setFormData(prev => {
      const current = prev.asset_ids || [];
      if (current.includes(assetId)) {
        return { ...prev, asset_ids: current.filter(id => id !== assetId) };
      } else {
        return { ...prev, asset_ids: [...current, assetId] };
      }
    });
  };

  const handleSave = async () => {
    if (!formData.sponsor_id || !formData.data_inizio || !formData.data_fine) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    if (formData.tipo_esclusiva === 'categoria' && !formData.categoria_settore) {
      alert('Seleziona una categoria merceologica');
      return;
    }

    if (formData.tipo_esclusiva === 'asset' && formData.asset_ids.length === 0) {
      alert('Seleziona almeno un asset');
      return;
    }

    setSaving(true);
    try {
      if (editingExclusivity) {
        await axios.put(
          `${API_URL}/club/inventory/exclusivities/${editingExclusivity.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/club/inventory/exclusivities`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa esclusività?')) return;

    try {
      await axios.delete(`${API_URL}/club/inventory/exclusivities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const filteredExclusivities = exclusivities.filter(excl => {
    const matchesSearch = !searchTerm ||
      excl.sponsor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryInfo(excl.categoria_settore).label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || excl.categoria_settore === filterCategory;
    const matchesStatus = filterStatus === 'all' || excl.stato === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const activeCount = exclusivities.filter(e => e.stato === 'attiva').length;
  const totalValue = exclusivities.filter(e => e.stato === 'attiva').reduce((sum, e) => sum + (e.valore || 0), 0);
  const categoriesBlocked = [...new Set(exclusivities.filter(e => e.stato === 'attiva').map(e => e.categoria_settore))].length;

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento esclusività...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <button className="tp-btn-back" onClick={() => navigate('/club/inventory')}>
            <FaArrowLeft /> Torna al Catalogo
          </button>
          <h1 className="tp-page-title">
            <FaShieldAlt style={{ color: '#85FF00' }} />
            Gestione Esclusività
          </h1>
          <p className="tp-page-subtitle">
            Gestisci le esclusività di categoria e asset per gli sponsor
          </p>
        </div>
        <div className="tp-page-actions">
          <button className="tp-btn tp-btn-primary" onClick={openNewExclusivity}>
            <FaPlus /> Nuova Esclusività
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="tp-stats-row">
        <div className="tp-stat-card">
          <div className="tp-stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <FaCheck />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{activeCount}</div>
            <div className="tp-stat-label">Esclusività Attive</div>
          </div>
        </div>
        <div className="tp-stat-card">
          <div className="tp-stat-icon" style={{ background: 'linear-gradient(135deg, #85FF00, #65A30D)' }}>
            <FaTag />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{formatCurrency(totalValue)}</div>
            <div className="tp-stat-label">Valore Totale</div>
          </div>
        </div>
        <div className="tp-stat-card">
          <div className="tp-stat-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
            <FaExclamationTriangle />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{categoriesBlocked}</div>
            <div className="tp-stat-label">Categorie Bloccate</div>
          </div>
        </div>
        <div className="tp-stat-card">
          <div className="tp-stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            <FaBuilding />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{[...new Set(exclusivities.filter(e => e.stato === 'attiva').map(e => e.sponsor_id))].length}</div>
            <div className="tp-stat-label">Sponsor con Esclusività</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            <h3 className="tp-card-title">Esclusività</h3>
            <span className="tp-badge tp-badge-neutral">{filteredExclusivities.length}</span>
          </div>
          <div className="tp-card-header-right">
            <div className="tp-search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Cerca sponsor o categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="tp-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Tutte le categorie</option>
              {categorieSettori.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <select
              className="tp-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tutti gli stati</option>
              <option value="attiva">Attive</option>
              <option value="scaduta">Scadute</option>
              <option value="sospesa">Sospese</option>
            </select>
          </div>
        </div>

        <div className="tp-card-body" style={{ padding: 0 }}>
          {filteredExclusivities.length === 0 ? (
            <div className="tp-empty-state" style={{ padding: '60px' }}>
              <FaShieldAlt size={48} />
              <h3>Nessuna esclusività trovata</h3>
              <p>Crea la tua prima esclusività per proteggere categorie merceologiche</p>
              <button className="tp-btn tp-btn-primary" onClick={openNewExclusivity}>
                <FaPlus /> Nuova Esclusività
              </button>
            </div>
          ) : (
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Sponsor</th>
                  <th>Tipo</th>
                  <th>Categoria/Asset</th>
                  <th>Periodo</th>
                  <th>Valore</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredExclusivities.map(excl => {
                  const categoryInfo = getCategoryInfo(excl.categoria_settore);
                  return (
                    <tr key={excl.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            color: '#6B7280'
                          }}>
                            {excl.sponsor_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1F2937' }}>
                              {excl.sponsor_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tp-badge tp-badge-info">
                          {getTipoLabel(excl.tipo_esclusiva)}
                        </span>
                      </td>
                      <td>
                        {excl.tipo_esclusiva === 'asset' ? (
                          <span style={{ color: '#6B7280', fontSize: '14px' }}>
                            <FaCube style={{ marginRight: '6px' }} />
                            {excl.asset_ids?.length || 0} asset
                          </span>
                        ) : excl.tipo_esclusiva === 'totale' ? (
                          <span style={{ color: '#8B5CF6', fontWeight: 600 }}>
                            🔒 Tutte le categorie
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px' }}>
                            {categoryInfo.icon} {categoryInfo.label}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '14px' }}>
                          <div>{formatDate(excl.data_inizio)}</div>
                          <div style={{ color: '#9CA3AF' }}>→ {formatDate(excl.data_fine)}</div>
                        </div>
                      </td>
                      <td>
                        <strong>{formatCurrency(excl.valore)}</strong>
                      </td>
                      <td>
                        {getStatusBadge(excl.stato)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="tp-btn-icon"
                            title="Modifica"
                            onClick={() => openEditExclusivity(excl)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="tp-btn-icon danger"
                            title="Elimina"
                            onClick={() => handleDelete(excl.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="tp-card" style={{ marginTop: '24px' }}>
        <div className="tp-card-header">
          <h3 className="tp-card-title">
            <FaInfoCircle style={{ color: '#3B82F6' }} /> Come funzionano le Esclusività
          </h3>
        </div>
        <div className="tp-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1F2937' }}>
                <FaTag style={{ color: '#10B981' }} /> Categoria
              </h4>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Blocca tutti gli asset per una specifica categoria merceologica (es: Bevande).
                Nessun competitor della stessa categoria potrà acquistare.
              </p>
            </div>
            <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1F2937' }}>
                <FaCube style={{ color: '#F59E0B' }} /> Asset Specifici
              </h4>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Blocca solo specifici asset per lo sponsor.
                Utile per esclusività parziali o premium placement.
              </p>
            </div>
            <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1F2937' }}>
                <FaShieldAlt style={{ color: '#8B5CF6' }} /> Totale
              </h4>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Esclusiva completa: nessun altro sponsor può acquistare asset nel periodo.
                Riservata a Main Sponsor o Title Sponsor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="tp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="tp-modal-header">
              <h2>
                <FaShieldAlt style={{ color: '#85FF00', marginRight: '8px' }} />
                {editingExclusivity ? 'Modifica Esclusività' : 'Nuova Esclusività'}
              </h2>
              <button className="tp-modal-close" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="tp-modal-body">
              <div className="tp-form-group">
                <label className="tp-label">Sponsor *</label>
                <select
                  className="tp-input"
                  value={formData.sponsor_id}
                  onChange={(e) => handleFormChange('sponsor_id', e.target.value)}
                >
                  <option value="">Seleziona sponsor...</option>
                  {sponsors.map(s => (
                    <option key={s.id} value={s.id}>{s.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="tp-form-group">
                <label className="tp-label">Tipo Esclusività *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['categoria', 'asset', 'totale'].map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => handleFormChange('tipo_esclusiva', tipo)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: formData.tipo_esclusiva === tipo ? '2px solid #85FF00' : '1px solid #E5E7EB',
                        borderRadius: '10px',
                        background: formData.tipo_esclusiva === tipo ? 'rgba(133, 255, 0, 0.1)' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                        {tipo === 'categoria' && <FaTag style={{ marginRight: '6px' }} />}
                        {tipo === 'asset' && <FaCube style={{ marginRight: '6px' }} />}
                        {tipo === 'totale' && <FaShieldAlt style={{ marginRight: '6px' }} />}
                        {getTipoLabel(tipo)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.tipo_esclusiva === 'categoria' && (
                <div className="tp-form-group">
                  <label className="tp-label">Categoria Merceologica *</label>
                  <select
                    className="tp-input"
                    value={formData.categoria_settore}
                    onChange={(e) => handleFormChange('categoria_settore', e.target.value)}
                  >
                    <option value="">Seleziona categoria...</option>
                    {categorieSettori.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.tipo_esclusiva === 'asset' && (
                <div className="tp-form-group">
                  <label className="tp-label">Asset Inclusi *</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '10px' }}>
                    {assets.map(asset => (
                      <label
                        key={asset.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                          background: formData.asset_ids.includes(asset.id) ? 'rgba(133, 255, 0, 0.1)' : 'white'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.asset_ids.includes(asset.id)}
                          onChange={() => toggleAssetSelection(asset.id)}
                        />
                        <div>
                          <div style={{ fontWeight: 500, color: '#1F2937' }}>{asset.nome}</div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{asset.codice}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <span className="tp-help-text">
                    {formData.asset_ids.length} asset selezionati
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="tp-form-group">
                  <label className="tp-label">
                    <FaCalendar /> Data Inizio *
                  </label>
                  <input
                    type="date"
                    className="tp-input"
                    value={formData.data_inizio}
                    onChange={(e) => handleFormChange('data_inizio', e.target.value)}
                  />
                </div>
                <div className="tp-form-group">
                  <label className="tp-label">
                    <FaCalendar /> Data Fine *
                  </label>
                  <input
                    type="date"
                    className="tp-input"
                    value={formData.data_fine}
                    onChange={(e) => handleFormChange('data_fine', e.target.value)}
                  />
                </div>
              </div>

              <div className="tp-form-group">
                <label className="tp-label">Valore Esclusività (€)</label>
                <input
                  type="number"
                  className="tp-input"
                  placeholder="150000"
                  value={formData.valore}
                  onChange={(e) => handleFormChange('valore', e.target.value)}
                />
              </div>

              <div className="tp-form-group">
                <label className="tp-label">Note</label>
                <textarea
                  className="tp-textarea"
                  rows={3}
                  placeholder="Note interne..."
                  value={formData.note}
                  onChange={(e) => handleFormChange('note', e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  className="tp-btn tp-btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1 }}
                >
                  Annulla
                </button>
                <button
                  className="tp-btn tp-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? 'Salvataggio...' : (
                    <>
                      <FaSave /> {editingExclusivity ? 'Aggiorna' : 'Crea Esclusività'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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

        .tp-btn-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 8px;
          background: #F3F4F6;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tp-btn-icon:hover {
          background: #E5E7EB;
          color: #1F2937;
        }
        .tp-btn-icon.danger:hover {
          background: #FEE2E2;
          color: #DC2626;
        }

        .tp-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          min-width: 240px;
        }
        .tp-search-box input {
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          flex: 1;
        }
        .tp-search-box svg {
          color: #9CA3AF;
        }

        .tp-select {
          padding: 8px 32px 8px 12px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          cursor: pointer;
        }

        .tp-form-group {
          margin-bottom: 20px;
        }
        .tp-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }
        .tp-input, .tp-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
        }
        .tp-input:focus, .tp-textarea:focus {
          outline: none;
          border-color: #85FF00;
          box-shadow: 0 0 0 3px rgba(133, 255, 0, 0.1);
        }
        .tp-help-text {
          display: block;
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 6px;
        }

        .tp-empty-state {
          text-align: center;
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

        .tp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .tp-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
        }
        .tp-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #E5E7EB;
        }
        .tp-modal-header h2 {
          margin: 0;
          font-size: 18px;
          display: flex;
          align-items: center;
        }
        .tp-modal-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: #F3F4F6;
          border-radius: 8px;
          cursor: pointer;
        }
        .tp-modal-body {
          padding: 24px;
          max-height: calc(90vh - 80px);
          overflow-y: auto;
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
      `}</style>
    </div>
  );
}

export default InventoryExclusivities;
