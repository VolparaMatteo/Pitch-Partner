import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaPen, FaTrashAlt, FaCube, FaCheck,
  FaEuroSign, FaCalendarAlt, FaHistory, FaCog, FaExclamationTriangle,
  FaMapMarkerAlt, FaLayerGroup, FaExternalLinkAlt, FaClipboardList,
  FaBoxOpen, FaPlus, FaImage, FaChartLine, FaTimes,
  FaChevronLeft, FaChevronRight, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState([]);
  const [activeTab, setActiveTab] = useState('specifiche');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Allocation modal state
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    sponsor_id: '',
    data_inizio: '',
    data_fine: '',
    quantita: 1,
    prezzo_concordato: '',
    note: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchAsset();
    fetchAllocations();
  }, [id]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/club/inventory/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAsset(res.data.asset);
    } catch (error) {
      console.error('Errore caricamento asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    try {
      const res = await axios.get(`${API_URL}/club/inventory/allocations?asset_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllocations(res.data.allocations || []);
    } catch (error) {
      setAllocations([]);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      await axios.delete(`${API_URL}/club/inventory/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ type: 'success', message: 'Asset eliminato' });
      setTimeout(() => navigate('/club/inventory'), 1000);
    } catch (error) {
      setToast({ type: 'error', message: 'Errore nell\'eliminazione' });
    }
  };

  // Allocation modal functions
  const openAllocationModal = async () => {
    // Fetch sponsors
    try {
      const res = await axios.get(`${API_URL}/club/sponsors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSponsors(res.data.sponsors || res.data || []);
    } catch (error) {
      console.error('Errore caricamento sponsor:', error);
      setSponsors([]);
    }
    // Reset form
    setAllocationForm({
      sponsor_id: '',
      data_inizio: '',
      data_fine: '',
      quantita: 1,
      prezzo_concordato: asset?.prezzo_listino || '',
      note: ''
    });
    setShowAllocationModal(true);
  };

  const handleAllocationFormChange = (field, value) => {
    setAllocationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAllocation = async () => {
    if (!allocationForm.sponsor_id || !allocationForm.data_inizio || !allocationForm.data_fine) {
      setToast({ type: 'error', message: 'Compila tutti i campi obbligatori' });
      return;
    }
    setSavingAllocation(true);
    try {
      await axios.post(`${API_URL}/club/inventory/allocations`, {
        asset_id: id,
        ...allocationForm,
        prezzo_concordato: parseFloat(allocationForm.prezzo_concordato) || 0,
        quantita: parseInt(allocationForm.quantita) || 1
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAllocationModal(false);
      setToast({ type: 'success', message: 'Allocazione creata con successo' });
      fetchAllocations();
      fetchAsset(); // Refresh asset to update quantities
    } catch (error) {
      console.error('Errore salvataggio allocazione:', error);
      setToast({ type: 'error', message: 'Errore nel salvataggio dell\'allocazione' });
    } finally {
      setSavingAllocation(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#85FF00', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6B7280' }}>Caricamento...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <FaCube style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '16px' }} />
          <p style={{ color: '#6B7280', fontSize: '18px' }}>Asset non trovato</p>
          <button
            onClick={() => navigate('/club/inventory')}
            style={{
              marginTop: '16px', padding: '10px 24px', background: '#1A1A1A', color: 'white',
              border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 500
            }}
          >
            Torna al catalogo
          </button>
        </div>
      </div>
    );
  }

  const activeAllocations = allocations.filter(a => a.stato === 'attiva');
  const hasSpecs = asset.specifiche_tecniche && Object.keys(asset.specifiche_tecniche).length > 0;
  const hasPricing = asset.pricing_tiers && asset.pricing_tiers.length > 0;
  const hasExclusions = asset.categorie_escluse && asset.categorie_escluse.length > 0;
  const categoryColor = asset.category?.colore || '#3B82F6';

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ background: '#0D0D0D', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
            <Link to="/club/inventory" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Inventario</Link>
            <span style={{ color: '#4B5563' }}>/</span>
            <span style={{ color: 'white' }}>{asset.nome || `#${asset.id}`}</span>
          </div>

          {/* Title Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 600, margin: 0 }}>{asset.nome}</h1>
                <span style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  background: `${categoryColor}20`, color: categoryColor
                }}>
                  {asset.category?.nome || 'Asset'}
                </span>
                <span style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  background: asset.disponibile ? '#D1FAE5' : '#FEE2E2',
                  color: asset.disponibile ? '#059669' : '#DC2626'
                }}>
                  {asset.disponibile ? 'Disponibile' : 'Non disponibile'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#9CA3AF', fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaCube /> {asset.tipo || 'Fisico'}
                </span>
                {asset.posizione && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaMapMarkerAlt /> {asset.posizione}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate(`/club/inventory/assets/${id}/edit`)}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '14px'
                }}
              >
                <FaPen /> Modifica
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaEuroSign style={{ color: '#059669', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
                  {formatCurrency(asset.prezzo_listino)}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Prezzo Listino</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaLayerGroup style={{ color: '#2563EB', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{asset.quantita_totale || 1}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Quantità Totale</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaHistory style={{ color: '#D97706', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{allocations.length}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Allocazioni Totali</p>
              </div>
            </div>
          </div>

          <div style={{
            background: activeAllocations.length > 0 ? '#F0FDF4' : 'white',
            borderRadius: '16px', padding: '20px',
            border: activeAllocations.length > 0 ? '1px solid #BBF7D0' : '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: activeAllocations.length > 0 ? '#DCFCE7' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FaChartLine style={{ color: activeAllocations.length > 0 ? '#16A34A' : '#6B7280', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{
                  fontSize: '20px', fontWeight: 700, margin: 0,
                  color: activeAllocations.length > 0 ? '#16A34A' : '#1F2937'
                }}>
                  {activeAllocations.length}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Allocazioni Attive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          {/* Left Column - Tabs Content */}
          <div>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '4px', marginBottom: '16px', background: '#F3F4F6',
              padding: '4px', borderRadius: '12px', width: 'fit-content'
            }}>
              {[
                { id: 'specifiche', label: 'Specifiche', show: true },
                { id: 'listino', label: 'Listino', show: asset.prezzo_listino || hasPricing },
                { id: 'allocazioni', label: 'Allocazioni', count: allocations.length, show: true },
                { id: 'note', label: 'Note & Restrizioni', show: asset.note_interne || hasExclusions }
              ].filter(t => t.show).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 20px', border: 'none', borderRadius: '10px',
                    background: activeTab === tab.id ? 'white' : 'transparent',
                    boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 500, fontSize: '14px',
                    color: activeTab === tab.id ? '#1F2937' : '#6B7280'
                  }}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span style={{
                      background: activeTab === tab.id ? '#1F2937' : '#E5E7EB',
                      color: activeTab === tab.id ? 'white' : '#6B7280',
                      padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              {/* Specifiche Tab */}
              {activeTab === 'specifiche' && (
                <div style={{ padding: '24px' }}>
                  {/* Descrizione */}
                  {asset.descrizione && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Descrizione
                      </h4>
                      <p style={{ color: '#374151', lineHeight: '1.7', margin: 0 }}>
                        {asset.descrizione}
                      </p>
                    </div>
                  )}

                  {/* Specifiche Tecniche */}
                  {hasSpecs ? (
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Specifiche Tecniche
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {Object.entries(asset.specifiche_tecniche).map(([key, value], idx) => (
                          <div key={idx} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 18px', background: '#F9FAFB', borderRadius: '10px'
                          }}>
                            <span style={{ fontSize: '13px', color: '#6B7280' }}>{key}</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : !asset.descrizione && (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaCog style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: 0 }}>Nessuna specifica tecnica</p>
                    </div>
                  )}
                </div>
              )}

              {/* Listino Tab */}
              {activeTab === 'listino' && (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {/* Prezzo Generale */}
                    {asset.prezzo_listino && (
                      <div style={{
                        padding: '24px', background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
                        borderRadius: '14px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                          Prezzo Base
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>
                          Generale
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#85FF00' }}>
                          {formatCurrency(asset.prezzo_listino)}
                        </div>
                        {asset.prezzo_minimo && (
                          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
                            Min: {formatCurrency(asset.prezzo_minimo)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing Tiers */}
                    {hasPricing && asset.pricing_tiers.map((tier, idx) => (
                      <div key={idx} style={{
                        padding: '24px', background: '#F9FAFB', borderRadius: '14px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                          {tier.durata_tipo || 'Variante'}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                          {tier.nome}
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669' }}>
                          {formatCurrency(tier.prezzo)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!asset.prezzo_listino && !hasPricing && (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaEuroSign style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: 0 }}>Nessun listino configurato</p>
                    </div>
                  )}
                </div>
              )}

              {/* Allocazioni Tab */}
              {activeTab === 'allocazioni' && (
                <div style={{ padding: '24px' }}>
                  {allocations.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {allocations.map(alloc => (
                        <div
                          key={alloc.id}
                          onClick={() => alloc.contract_id && navigate(`/club/contracts/${alloc.contract_id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px 20px', background: '#F9FAFB', borderRadius: '12px',
                            cursor: alloc.contract_id ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: alloc.stato === 'attiva' ? '#D1FAE5' : '#F3F4F6'
                          }}>
                            <FaHistory style={{ color: alloc.stato === 'attiva' ? '#059669' : '#6B7280' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, color: '#1F2937', margin: 0 }}>
                              {alloc.sponsor_name || 'Sponsor'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>
                              {formatDate(alloc.data_inizio)} → {formatDate(alloc.data_fine)}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 700, color: '#1F2937', margin: 0, fontSize: '16px' }}>
                              {formatCurrency(alloc.valore)}
                            </p>
                            <span style={{
                              display: 'inline-block', marginTop: '4px',
                              padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              background: alloc.stato === 'attiva' ? '#D1FAE5' : '#F3F4F6',
                              color: alloc.stato === 'attiva' ? '#059669' : '#6B7280'
                            }}>
                              {alloc.stato === 'attiva' ? 'Attiva' : 'Completata'}
                            </span>
                          </div>
                          {alloc.contract_id && <FaExternalLinkAlt size={12} color="#9CA3AF" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaCalendarAlt style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#374151' }}>Nessuna allocazione</p>
                      <p style={{ margin: 0, fontSize: '14px' }}>Questo asset non ha ancora allocazioni registrate</p>
                    </div>
                  )}
                </div>
              )}

              {/* Note Tab */}
              {activeTab === 'note' && (
                <div style={{ padding: '24px' }}>
                  {asset.note_interne && (
                    <div style={{
                      background: '#FFFBEB', border: '1px solid #FCD34D',
                      borderRadius: '12px', padding: '16px', marginBottom: hasExclusions ? '16px' : 0
                    }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', marginBottom: '10px', textTransform: 'uppercase' }}>
                        Note Interne
                      </h4>
                      <p style={{ color: '#78350F', lineHeight: '1.7', margin: 0 }}>
                        {asset.note_interne}
                      </p>
                    </div>
                  )}

                  {hasExclusions && (
                    <div style={{
                      background: '#FEF2F2', border: '1px solid #FECACA',
                      borderRadius: '12px', padding: '16px'
                    }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626', marginBottom: '10px', textTransform: 'uppercase' }}>
                        Categorie Escluse
                      </h4>
                      <p style={{ fontSize: '13px', color: '#991B1B', marginBottom: '12px' }}>
                        Questo asset non può essere assegnato a sponsor delle seguenti categorie:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {asset.categorie_escluse.map((cat, idx) => (
                          <span key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', background: 'white', color: '#DC2626',
                            borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: '1px solid #FECACA'
                          }}>
                            <FaTimes size={10} /> {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!asset.note_interne && !hasExclusions && (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaClipboardList style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: 0 }}>Nessuna nota o restrizione</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Asset Image */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
              <div
                onClick={() => asset.immagine_principale && setViewingImage(asset.immagine_principale)}
                style={{
                  width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden',
                  background: asset.immagine_principale ? '#F3F4F6' : categoryColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: asset.immagine_principale ? 'pointer' : 'default'
                }}
              >
                {asset.immagine_principale ? (
                  <img
                    src={getImageUrl(asset.immagine_principale)}
                    alt={asset.nome}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <FaCube size={48} color="white" />
                )}
              </div>

              {/* Gallery */}
              {asset.immagini_gallery && asset.immagini_gallery.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px'
                  }}>
                    {asset.immagini_gallery.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setViewingImage(img)}
                        style={{
                          aspectRatio: '1', borderRadius: '8px', overflow: 'hidden',
                          background: '#F3F4F6', cursor: 'pointer'
                        }}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`Gallery ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Azioni Rapide
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/club/inventory/assets/${id}/edit`)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500, fontSize: '14px', color: '#374151', textAlign: 'left'
                  }}
                >
                  <FaPen style={{ color: '#6B7280' }} /> Modifica Asset
                </button>
                <button
                  onClick={openAllocationModal}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500, fontSize: '14px', color: '#374151', textAlign: 'left'
                  }}
                >
                  <FaPlus style={{ color: '#6B7280' }} /> Nuova Allocazione
                </button>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500, fontSize: '14px', color: '#374151', textAlign: 'left'
                  }}
                >
                  <FaCalendarAlt style={{ color: '#6B7280' }} /> Calendario Disponibilità
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500, fontSize: '14px', color: '#DC2626', textAlign: 'left'
                  }}
                >
                  <FaTrashAlt /> Elimina Asset
                </button>
              </div>
            </div>

            {/* Details Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dettagli
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Tipo</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>{asset.tipo || 'Fisico'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Categoria</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>{asset.category?.nome || '-'}</span>
                </div>
                {asset.prezzo_minimo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>Prezzo Minimo</span>
                    <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>{formatCurrency(asset.prezzo_minimo)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Creato il</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>{formatDate(asset.created_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Aggiornato il</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>{formatDate(asset.updated_at)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Elimina Asset" maxWidth="420px">
        <div style={{ padding: '12px 0 0' }}>
          <p style={{ color: '#6B7280', lineHeight: 1.6, marginBottom: '24px' }}>
            Sei sicuro di voler eliminare <strong>"{asset.nome}"</strong>? Questa azione non può essere annullata.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              style={{
                padding: '10px 20px', background: 'white', color: '#374151',
                border: '2px solid #E5E7EB', borderRadius: '10px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 20px', background: '#EF4444', color: 'white',
                border: 'none', borderRadius: '10px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              Elimina
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          onClick={() => setViewingImage(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <button
            onClick={() => setViewingImage(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', cursor: 'pointer', fontSize: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <FaTimes />
          </button>
          <img
            src={getImageUrl(viewingImage)}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain', borderRadius: '8px',
              cursor: 'default'
            }}
          />
        </div>
      )}

      {/* Calendar Modal */}
      <Modal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        title={`Calendario Disponibilità - ${asset?.nome || ''}`}
        maxWidth="900px"
      >
        <div style={{ padding: '8px 0' }}>
          {/* Year Navigation */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '24px', padding: '0 8px'
          }}>
            <button
              onClick={() => setCalendarYear(y => y - 1)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <FaChevronLeft size={12} /> Precedente
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
              {calendarYear}
            </h3>
            <button
              onClick={() => setCalendarYear(y => y + 1)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              Successivo <FaChevronRight size={12} />
            </button>
          </div>

          {/* Timeline Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '2px', marginBottom: '8px', padding: '0 8px'
          }}>
            {['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'].map((m, i) => (
              <div key={i} style={{
                textAlign: 'center', fontSize: '11px', fontWeight: 600,
                color: '#6B7280', padding: '8px 0'
              }}>
                {m}
              </div>
            ))}
          </div>

          {/* Timeline Track */}
          <div style={{
            position: 'relative', height: '60px', background: '#F3F4F6',
            borderRadius: '12px', overflow: 'hidden', margin: '0 8px'
          }}>
            {/* Month grid lines */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute', left: `${(i / 12) * 100}%`,
                  top: 0, bottom: 0, width: '1px',
                  background: i === 0 ? 'transparent' : '#E5E7EB'
                }}
              />
            ))}

            {/* Allocation bars */}
            {allocations.map(alloc => {
              const viewStart = new Date(calendarYear, 0, 1);
              const viewEnd = new Date(calendarYear, 11, 31);
              const allocStart = new Date(alloc.data_inizio);
              const allocEnd = new Date(alloc.data_fine);

              // Skip if allocation doesn't overlap with this year
              if (allocEnd < viewStart || allocStart > viewEnd) return null;

              const effectiveStart = allocStart < viewStart ? viewStart : allocStart;
              const effectiveEnd = allocEnd > viewEnd ? viewEnd : allocEnd;
              const totalDays = (viewEnd - viewStart) / (1000 * 60 * 60 * 24);
              const startOffset = (effectiveStart - viewStart) / (1000 * 60 * 60 * 24);
              const duration = (effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24);
              const left = (startOffset / totalDays) * 100;
              const width = (duration / totalDays) * 100;

              return (
                <div
                  key={alloc.id}
                  style={{
                    position: 'absolute', top: '10px', height: '40px',
                    left: `${Math.max(0, left)}%`,
                    width: `${Math.min(100 - left, Math.max(2, width))}%`,
                    background: alloc.stato === 'conclusa'
                      ? 'linear-gradient(135deg, #9CA3AF, #6B7280)'
                      : 'linear-gradient(135deg, #10B981, #059669)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center',
                    padding: '0 10px', overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  title={`${alloc.sponsor?.ragione_sociale || 'Sponsor'} - ${formatCurrency(alloc.prezzo_concordato)}`}
                >
                  <span style={{
                    color: 'white', fontSize: '12px', fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {alloc.sponsor?.ragione_sociale || 'Sponsor'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend & Stats */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '4px',
                  background: 'linear-gradient(135deg, #10B981, #059669)'
                }} />
                <span style={{ fontSize: '13px', color: '#374151' }}>Allocazione attiva</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '4px',
                  background: 'linear-gradient(135deg, #9CA3AF, #6B7280)'
                }} />
                <span style={{ fontSize: '13px', color: '#374151' }}>Allocazione conclusa</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '4px',
                  background: '#F3F4F6', border: '1px solid #E5E7EB'
                }} />
                <span style={{ fontSize: '13px', color: '#374151' }}>Disponibile</span>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', background: 'white', borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              {asset?.quantita_disponibile > 0 ? (
                <>
                  <FaCheckCircle color="#10B981" />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    {asset?.quantita_disponibile}/{asset?.quantita_totale} disponibili
                  </span>
                </>
              ) : (
                <>
                  <FaTimesCircle color="#EF4444" />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    Completamente allocato
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Allocations List */}
          {allocations.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{
                fontSize: '12px', fontWeight: 600, color: '#6B7280',
                textTransform: 'uppercase', marginBottom: '12px', padding: '0 8px'
              }}>
                Allocazioni ({allocations.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allocations.map(alloc => (
                  <div
                    key={alloc.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', background: 'white', borderRadius: '10px',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: alloc.stato === 'attiva' ? '#10B981' : '#9CA3AF'
                      }} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>
                          {alloc.sponsor?.ragione_sociale || 'Sponsor'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {new Date(alloc.data_inizio).toLocaleDateString('it-IT')} - {new Date(alloc.data_fine).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#059669' }}>
                        {formatCurrency(alloc.prezzo_concordato)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {alloc.quantita} unità
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allocations.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px', color: '#6B7280', marginTop: '16px'
            }}>
              <FaCalendarAlt style={{ fontSize: '32px', opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>Nessuna allocazione per questo asset</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Allocation Modal */}
      <Modal
        isOpen={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        title="Nuova Allocazione"
        maxWidth="500px"
      >
        <div style={{ padding: '8px 0' }}>
          {/* Asset Info (read-only) */}
          <div style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
            padding: '16px 20px', borderRadius: '12px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '16px'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px',
              background: asset?.category?.colore || '#6366F1',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FaCube color="white" size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>
                {asset?.nome}
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '13px' }}>
                {asset?.quantita_disponibile}/{asset?.quantita_totale} disponibili
              </div>
            </div>
          </div>

          <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Sponsor <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={allocationForm.sponsor_id}
                onChange={(e) => handleAllocationFormChange('sponsor_id', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="">Seleziona sponsor...</option>
                {sponsors.map(sponsor => (
                  <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.ragione_sociale || sponsor.company_name}
                  </option>
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
                  onChange={(e) => handleAllocationFormChange('data_inizio', e.target.value)}
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
                  onChange={(e) => handleAllocationFormChange('data_fine', e.target.value)}
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
                  max={asset?.quantita_disponibile || 1}
                  value={allocationForm.quantita}
                  onChange={(e) => handleAllocationFormChange('quantita', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Prezzo (€)</label>
                <input
                  type="number"
                  placeholder={asset?.prezzo_listino || '50000'}
                  value={allocationForm.prezzo_concordato}
                  onChange={(e) => handleAllocationFormChange('prezzo_concordato', e.target.value)}
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
                onChange={(e) => handleAllocationFormChange('note', e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setShowAllocationModal(false)}
              style={{ padding: '10px 20px', border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', color: '#374151' }}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSaveAllocation}
              disabled={savingAllocation}
              style={{
                padding: '10px 20px', border: 'none', borderRadius: '8px',
                background: '#1A1A1A', color: 'white', fontWeight: 600, fontSize: '14px',
                cursor: savingAllocation ? 'not-allowed' : 'pointer',
                opacity: savingAllocation ? 0.7 : 1
              }}
            >
              {savingAllocation ? 'Salvataggio...' : 'Crea Allocazione'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default AssetDetail;
