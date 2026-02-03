import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaPen, FaTrashAlt, FaCube, FaCheck,
  FaEuroSign, FaCalendarAlt, FaHistory, FaCog, FaExclamationTriangle,
  FaLayerGroup, FaExternalLinkAlt, FaClipboardList,
  FaBoxOpen, FaPlus, FaChartLine, FaTimes, FaUserPlus, FaHandshake,
  FaStar, FaPercentage
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('asset');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    sponsor_id: '',
    contract_id: '',
    assignment_type: 'sponsor',
    data_inizio: '',
    data_fine: '',
    prezzo_concordato: '',
    note: ''
  });

  // Level config from API
  const [levelConfig, setLevelConfig] = useState({});

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchPackage();
    fetchAssignments();
    fetchLevels();
  }, [id]);

  const fetchLevels = async () => {
    try {
      const res = await axios.get(`${API_URL}/club/inventory/package-levels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lvls = res.data?.levels || [];
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
      console.error('Errore caricamento livelli:', error);
    }
  };

  const fetchPackage = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/club/inventory/packages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPkg(res.data.package || res.data);
    } catch (error) {
      console.error('Errore caricamento package:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`${API_URL}/club/inventory/packages/${id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data.assignments || []);
    } catch (error) {
      setAssignments([]);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      await axios.delete(`${API_URL}/club/inventory/packages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ type: 'success', message: 'Package eliminato' });
      setTimeout(() => navigate('/club/inventory/packages'), 1000);
    } catch (error) {
      setToast({ type: 'error', message: 'Errore nell\'eliminazione' });
    }
  };

  // Assignment modal functions
  const openAssignModal = async () => {
    try {
      const [sponsorsRes, contractsRes] = await Promise.all([
        axios.get(`${API_URL}/club/sponsors`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/club/contracts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSponsors(sponsorsRes.data.sponsors || sponsorsRes.data || []);
      setContracts(contractsRes.data.contracts || contractsRes.data || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setSponsors([]);
      setContracts([]);
    }
    setAssignmentForm({
      sponsor_id: '',
      contract_id: '',
      assignment_type: 'sponsor',
      data_inizio: '',
      data_fine: '',
      prezzo_concordato: pkg?.prezzo_listino || '',
      note: ''
    });
    setShowAssignModal(true);
  };

  const handleAssignmentFormChange = (field, value) => {
    setAssignmentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAssignment = async () => {
    const isValid = assignmentForm.assignment_type === 'sponsor'
      ? assignmentForm.sponsor_id && assignmentForm.data_inizio && assignmentForm.data_fine
      : assignmentForm.contract_id && assignmentForm.data_inizio && assignmentForm.data_fine;

    if (!isValid) {
      setToast({ type: 'error', message: 'Compila tutti i campi obbligatori' });
      return;
    }

    setSavingAssignment(true);
    try {
      await axios.post(`${API_URL}/club/inventory/packages/${id}/assign`, {
        ...assignmentForm,
        prezzo_concordato: parseFloat(assignmentForm.prezzo_concordato) || pkg?.prezzo_listino || 0
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAssignModal(false);
      setToast({ type: 'success', message: 'Package assegnato con successo' });
      fetchAssignments();
      fetchPackage();
    } catch (error) {
      console.error('Errore assegnazione:', error);
      setToast({ type: 'error', message: 'Errore nell\'assegnazione del package' });
    } finally {
      setSavingAssignment(false);
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

  if (!pkg) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <FaLayerGroup style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '16px' }} />
          <p style={{ color: '#6B7280', fontSize: '18px' }}>Package non trovato</p>
          <button
            onClick={() => navigate('/club/inventory/packages')}
            style={{
              marginTop: '16px', padding: '10px 24px', background: '#1A1A1A', color: 'white',
              border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 500
            }}
          >
            Torna ai Packages
          </button>
        </div>
      </div>
    );
  }

  const levelColor = levelConfig[pkg.livello]?.color || '#85FF00';
  const levelLabel = levelConfig[pkg.livello]?.label || pkg.livello || '-';
  const activeAssignments = assignments.filter(a => a.stato === 'attiva');
  const assetItems = pkg.items || [];
  const totalAssetValue = assetItems.reduce((sum, item) => sum + ((item.asset?.prezzo_listino || 0) * (item.quantita || 1)), 0);
  const discount = totalAssetValue > 0 && pkg.prezzo_listino ? Math.round((1 - pkg.prezzo_listino / totalAssetValue) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ background: '#0D0D0D', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
            <Link to="/club/inventory/packages" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Packages</Link>
            <span style={{ color: '#4B5563' }}>/</span>
            <span style={{ color: 'white' }}>{pkg.codice || pkg.nome}</span>
          </div>

          {/* Title Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 600, margin: 0 }}>{pkg.nome}</h1>
                <span style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  background: levelColor, color: 'white'
                }}>
                  {levelLabel}
                </span>
                {pkg.vendite_attuali >= (pkg.max_vendite || 999) && (
                  <span style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                    background: '#FEE2E2', color: '#DC2626'
                  }}>
                    Sold Out
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#9CA3AF', fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaCube /> {assetItems.length} asset
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaChartLine /> {pkg.vendite_attuali || 0} venduti
                </span>
                {pkg.codice && (
                  <span style={{ fontFamily: 'monospace' }}>
                    {pkg.codice}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate(`/club/inventory/packages/${id}/edit`)}
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
                  {formatCurrency(pkg.prezzo_listino)}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Prezzo Package</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaCube style={{ color: '#2563EB', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{formatCurrency(totalAssetValue)}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Valore Asset</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: discount > 0 ? '#D1FAE5' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaPercentage style={{ color: discount > 0 ? '#059669' : '#6B7280', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: discount > 0 ? '#059669' : '#1F2937', margin: 0 }}>
                  {discount > 0 ? `-${discount}%` : '0%'}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Sconto vs Asset</p>
              </div>
            </div>
          </div>

          <div style={{
            background: activeAssignments.length > 0 ? '#F0FDF4' : 'white',
            borderRadius: '16px', padding: '20px',
            border: activeAssignments.length > 0 ? '1px solid #BBF7D0' : '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: activeAssignments.length > 0 ? '#DCFCE7' : '#FEF3C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FaChartLine style={{ color: activeAssignments.length > 0 ? '#16A34A' : '#D97706', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{
                  fontSize: '20px', fontWeight: 700, margin: 0,
                  color: activeAssignments.length > 0 ? '#16A34A' : '#1F2937'
                }}>
                  {pkg.vendite_attuali || 0}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Vendite Totali</p>
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
                { id: 'asset', label: 'Asset Inclusi', count: assetItems.length },
                { id: 'assegnazioni', label: 'Assegnazioni', count: assignments.length },
                { id: 'descrizione', label: 'Descrizione', show: pkg.descrizione }
              ].filter(t => t.show !== false).map(tab => (
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
                      padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                      background: activeTab === tab.id ? '#E5E7EB' : '#D1D5DB'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              {/* Asset Tab */}
              {activeTab === 'asset' && (
                <div style={{ padding: '24px' }}>
                  {assetItems.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {assetItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => item.asset?.id && navigate(`/club/inventory/assets/${item.asset.id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px 20px', background: '#F9FAFB', borderRadius: '12px',
                            cursor: item.asset?.id ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: item.asset?.category?.colore ? `${item.asset.category.colore}20` : '#E5E7EB'
                          }}>
                            <FaCube style={{ color: item.asset?.category?.colore || '#6B7280' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, color: '#1F2937', margin: 0 }}>
                              {item.asset?.nome || 'Asset'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>
                              {item.asset?.category?.nome || 'Categoria'} {item.quantita > 1 && `• Quantità: ${item.quantita}`}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 700, color: '#1F2937', margin: 0, fontSize: '16px' }}>
                              {formatCurrency(item.asset?.prezzo_listino)}
                            </p>
                          </div>
                          {item.asset?.id && <FaExternalLinkAlt size={12} color="#9CA3AF" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaCube style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#374151' }}>Nessun asset</p>
                      <p style={{ margin: 0, fontSize: '14px' }}>Questo package non contiene asset</p>
                    </div>
                  )}
                </div>
              )}

              {/* Assegnazioni Tab */}
              {activeTab === 'assegnazioni' && (
                <div style={{ padding: '24px' }}>
                  {assignments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {assignments.map(assign => (
                        <div
                          key={assign.id}
                          onClick={() => assign.contract_id && navigate(`/club/contracts/${assign.contract_id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px 20px', background: '#F9FAFB', borderRadius: '12px',
                            cursor: assign.contract_id ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: assign.stato === 'attiva' ? '#D1FAE5' : '#F3F4F6'
                          }}>
                            <FaHandshake style={{ color: assign.stato === 'attiva' ? '#059669' : '#6B7280' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, color: '#1F2937', margin: 0 }}>
                              {assign.sponsor_name || 'Sponsor'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>
                              {formatDate(assign.data_inizio)} → {formatDate(assign.data_fine)}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 700, color: '#1F2937', margin: 0, fontSize: '16px' }}>
                              {formatCurrency(assign.prezzo_concordato)}
                            </p>
                            <span style={{
                              display: 'inline-block', marginTop: '4px',
                              padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              background: assign.stato === 'attiva' ? '#D1FAE5' : '#F3F4F6',
                              color: assign.stato === 'attiva' ? '#059669' : '#6B7280'
                            }}>
                              {assign.stato === 'attiva' ? 'Attiva' : 'Completata'}
                            </span>
                          </div>
                          {assign.contract_id && <FaExternalLinkAlt size={12} color="#9CA3AF" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaCalendarAlt style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#374151' }}>Nessuna assegnazione</p>
                      <p style={{ margin: 0, fontSize: '14px' }}>Questo package non è ancora stato assegnato</p>
                    </div>
                  )}
                </div>
              )}

              {/* Descrizione Tab */}
              {activeTab === 'descrizione' && (
                <div style={{ padding: '24px' }}>
                  {pkg.descrizione ? (
                    <div style={{
                      background: '#F9FAFB', borderRadius: '12px', padding: '20px'
                    }}>
                      <p style={{ color: '#374151', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {pkg.descrizione}
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaClipboardList style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: 0 }}>Nessuna descrizione</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Package Info Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
              <div style={{
                width: '100%', height: '120px', borderRadius: '12px', overflow: 'hidden',
                background: `linear-gradient(135deg, ${levelColor}, ${levelColor}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <FaLayerGroup size={48} color="white" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
                  background: levelColor, color: 'white', fontSize: '14px', fontWeight: 600
                }}>
                  {levelLabel}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Azioni Rapide
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={openAssignModal}
                  disabled={pkg.vendite_attuali >= (pkg.max_vendite || 999)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: 'none', background: pkg.vendite_attuali >= (pkg.max_vendite || 999) ? '#E5E7EB' : '#1A1A1A',
                    cursor: pkg.vendite_attuali >= (pkg.max_vendite || 999) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500, fontSize: '14px',
                    color: pkg.vendite_attuali >= (pkg.max_vendite || 999) ? '#9CA3AF' : 'white',
                    textAlign: 'left'
                  }}
                >
                  <FaUserPlus /> Assegna Package
                </button>
                <button
                  onClick={() => navigate(`/club/inventory/packages/${id}/edit`)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500, fontSize: '14px', color: '#374151', textAlign: 'left'
                  }}
                >
                  <FaPen style={{ color: '#6B7280' }} /> Modifica Package
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500, fontSize: '14px', color: '#DC2626', textAlign: 'left'
                  }}
                >
                  <FaTrashAlt /> Elimina Package
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Elimina Package"
        maxWidth="400px"
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: '#FEE2E2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <FaExclamationTriangle style={{ fontSize: '28px', color: '#DC2626' }} />
          </div>
          <p style={{ color: '#374151', marginBottom: '24px' }}>
            Sei sicuro di voler eliminare <strong>{pkg.nome}</strong>?<br />
            Questa azione non può essere annullata.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: '1px solid #E5E7EB',
                background: 'white', cursor: 'pointer', fontWeight: 500
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: '#DC2626', color: 'white', cursor: 'pointer', fontWeight: 500
              }}
            >
              Elimina
            </button>
          </div>
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assegna Package"
        maxWidth="500px"
      >
        <div style={{ padding: '8px 0' }}>
          {/* Package Summary */}
          <div style={{
            background: `linear-gradient(135deg, ${levelColor}, ${levelColor}99)`,
            padding: '16px 20px', borderRadius: '12px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>{pkg.nome}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginTop: '4px' }}>
                {formatCurrency(pkg.prezzo_listino)}
              </div>
            </div>
            <div style={{
              padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)',
              color: 'white', fontSize: '12px', fontWeight: 600
            }}>
              {levelLabel}
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
                  flex: 1, padding: '12px 16px', borderRadius: '8px',
                  border: assignmentForm.assignment_type === 'sponsor' ? '2px solid #1A1A1A' : '2px solid #E5E7EB',
                  background: assignmentForm.assignment_type === 'sponsor' ? '#1A1A1A' : 'white',
                  color: assignmentForm.assignment_type === 'sponsor' ? 'white' : '#4B5563',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <FaUserPlus size={14} /> Nuovo Sponsor
              </button>
              <button
                type="button"
                onClick={() => handleAssignmentFormChange('assignment_type', 'contract')}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '8px',
                  border: assignmentForm.assignment_type === 'contract' ? '2px solid #1A1A1A' : '2px solid #E5E7EB',
                  background: assignmentForm.assignment_type === 'contract' ? '#1A1A1A' : 'white',
                  color: assignmentForm.assignment_type === 'contract' ? 'white' : '#4B5563',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
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
                    width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB',
                    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
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
                    width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB',
                    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
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
                  width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB',
                  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
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
                  width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB',
                  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
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
              value={assignmentForm.prezzo_concordato}
              onChange={(e) => handleAssignmentFormChange('prezzo_concordato', e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB',
                borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
              Prezzo di listino: {formatCurrency(pkg.prezzo_listino)}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
              Note
            </label>
            <textarea
              rows={2}
              value={assignmentForm.note}
              onChange={(e) => handleAssignmentFormChange('note', e.target.value)}
              placeholder="Note aggiuntive..."
              style={{
                width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB',
                borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              style={{
                padding: '10px 20px', border: '2px solid #E5E7EB', borderRadius: '8px',
                background: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', color: '#374151'
              }}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSaveAssignment}
              disabled={savingAssignment}
              style={{
                padding: '10px 20px', border: 'none', borderRadius: '8px',
                background: '#1A1A1A', color: 'white', fontWeight: 600, fontSize: '14px',
                cursor: savingAssignment ? 'not-allowed' : 'pointer',
                opacity: savingAssignment ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {savingAssignment ? 'Salvataggio...' : 'Assegna Package'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PackageDetail;
