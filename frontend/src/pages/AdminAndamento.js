import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/template-style.css';

import {
  FaChartLine, FaUsers, FaEuroSign, FaCalendarAlt, FaEdit, FaSave,
  FaTimes, FaCheckCircle, FaClock, FaExclamationTriangle, FaArrowUp,
  FaArrowDown, FaPhone, FaVideo, FaFileAlt, FaHandshake, FaPlus,
  FaSyncAlt, FaChartBar, FaPercent, FaTrophy, FaRocket, FaStar,
  FaCrown, FaGem, FaDatabase, FaUserCheck, FaBuilding, FaFlag,
  FaClipboardCheck, FaBullseye, FaLightbulb, FaCoins, FaReceipt,
  FaPencilAlt, FaInfoCircle, FaRobot, FaKeyboard, FaMousePointer
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Badge component for data type indicator
const DataTypeBadge = ({ type, small = false }) => {
  const isAuto = type === 'auto';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: small ? '2px 6px' : '4px 10px',
      borderRadius: '20px',
      fontSize: small ? '9px' : '10px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: isAuto ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
      color: isAuto ? '#047857' : '#92400E',
      border: `1px solid ${isAuto ? '#A7F3D0' : '#FCD34D'}`
    }}>
      {isAuto ? <FaRobot size={small ? 8 : 10} /> : <FaPencilAlt size={small ? 8 : 10} />}
      {isAuto ? 'Auto' : 'Manuale'}
    </span>
  );
};

// Editable field wrapper with hover effect
const EditableField = ({ children, onClick, tooltip = 'Clicca per modificare' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {children}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: '#1A1A1A',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 10
        }}>
          <FaPencilAlt size={10} />
        </div>
      )}
    </div>
  );
};

function AdminAndamento() {
  const navigate = useNavigate();
  const authData = useMemo(() => getAuth(), []);
  const { user, token } = authData;
  const hasFetched = useRef(false);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [editingMonth, setEditingMonth] = useState(null);
  const [monthlyFormData, setMonthlyFormData] = useState({});
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingCredibility, setEditingCredibility] = useState(null);
  const [toast, setToast] = useState(null);
  const [showLegend, setShowLegend] = useState(true);

  const months = [
    { value: 1, label: 'Gennaio', short: 'Gen' },
    { value: 2, label: 'Febbraio', short: 'Feb' },
    { value: 3, label: 'Marzo', short: 'Mar' },
    { value: 4, label: 'Aprile', short: 'Apr' },
    { value: 5, label: 'Maggio', short: 'Mag' },
    { value: 6, label: 'Giugno', short: 'Giu' },
    { value: 7, label: 'Luglio', short: 'Lug' },
    { value: 8, label: 'Agosto', short: 'Ago' },
    { value: 9, label: 'Settembre', short: 'Set' },
    { value: 10, label: 'Ottobre', short: 'Ott' },
    { value: 11, label: 'Novembre', short: 'Nov' },
    { value: 12, label: 'Dicembre', short: 'Dic' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDashboard();
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/kpi/dashboard?year=2026`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      showToast('Errore nel caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
  };

  const seedInitialData = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/admin/kpi/seed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboard();
      showToast('Dati iniziali creati con successo', 'success');
    } catch (error) {
      console.error('Error seeding data:', error);
      showToast('Errore nella creazione dei dati', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startEditMonth = (month) => {
    const monthData = dashboardData?.monthly_data?.find(m => m.month === month) || {};
    setMonthlyFormData({
      year: 2026,
      month: month,
      contacts: monthData.contacts || 0,
      demos: monthData.demos || 0,
      proposals: monthData.proposals || 0,
      contracts: monthData.contracts || 0,
      booking: monthData.booking || 0,
      arr_new: monthData.arr_new || 0,
      addon_setup: monthData.addon_setup || 0,
      addon_training: monthData.addon_training || 0,
      addon_custom: monthData.addon_custom || 0,
      new_clubs_basic: monthData.new_clubs_basic || 0,
      new_clubs_premium: monthData.new_clubs_premium || 0,
      new_clubs_elite: monthData.new_clubs_elite || 0,
      notes: monthData.notes || ''
    });
    setEditingMonth(month);
  };

  const saveMonthlyData = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/admin/kpi/monthly`, monthlyFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboard();
      setEditingMonth(null);
      showToast('Dati salvati con successo', 'success');
    } catch (error) {
      console.error('Error saving monthly data:', error);
      showToast('Errore nel salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateMilestone = async (id, updates) => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/admin/kpi/milestones/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboard();
      setEditingMilestone(null);
      showToast('Milestone aggiornata', 'success');
    } catch (error) {
      console.error('Error updating milestone:', error);
      showToast('Errore nell\'aggiornamento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateCredibility = async (id, updates) => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/admin/kpi/credibility/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboard();
      setEditingCredibility(null);
      showToast('KPI aggiornato', 'success');
    } catch (error) {
      console.error('Error updating credibility:', error);
      showToast('Errore nell\'aggiornamento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value, total) => {
    if (!total || total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const getProgressColor = (actual, target) => {
    if (!target) return '#6B7280';
    const pct = (actual / target) * 100;
    if (pct >= 100) return '#10B981';
    if (pct >= 70) return '#F59E0B';
    if (pct >= 40) return '#3B82F6';
    return '#EF4444';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'at_risk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completato';
      case 'in_progress': return 'In Corso';
      case 'not_started': return 'Da Iniziare';
      case 'at_risk': return 'A Rischio';
      default: return status;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaChartBar },
    { id: 'monthly', label: 'Dati Mensili', icon: FaCalendarAlt },
    { id: 'funnel', label: 'Funnel Vendite', icon: FaChartLine },
    { id: 'milestones', label: 'Milestone', icon: FaFlag },
    { id: 'credibility', label: 'Credibilità', icon: FaTrophy }
  ];

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento dati...</p>
        </div>
      </div>
    );
  }

  const { auto_calculated, ytd_totals, targets, quarterly_actuals, conversion_rates, milestones, credibility } = dashboardData || {};

  return (
    <div className="tp-page">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '12px',
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: 'white',
          fontWeight: '600',
          zIndex: 9999,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaChartLine size={24} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 className="tp-page-title">Andamento 2026</h1>
              <p className="tp-page-subtitle">
                Monitoraggio KPI in tempo reale
              </p>
            </div>
          </div>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-outline"
            onClick={fetchDashboard}
            disabled={saving}
          >
            <FaSyncAlt className={saving ? 'spinning' : ''} /> Aggiorna
          </button>
          {(!dashboardData?.milestones?.items?.length) && (
            <button
              className="tp-btn tp-btn-primary"
              onClick={seedInitialData}
              disabled={saving}
            >
              <FaDatabase /> Inizializza Dati
            </button>
          )}
        </div>
      </div>

      {/* Legend Banner - Data Types Explanation */}
      {showLegend && (
        <div style={{
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '20px',
          border: '2px solid #E2E8F0',
          position: 'relative'
        }}>
          <button
            onClick={() => setShowLegend(false)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px'
            }}
          >
            <FaTimes size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FaInfoCircle size={18} style={{ color: '#3B82F6' }} />
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>
              Come leggere i dati
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {/* Auto Data */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              border: '2px solid #A7F3D0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaRobot size={16} style={{ color: '#047857' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#047857', fontSize: '14px' }}>Dati Automatici</div>
                  <DataTypeBadge type="auto" small />
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: '1.5' }}>
                Calcolati in tempo reale dal database:<br/>
                <strong>Funnel</strong> (contatti/demo/proposte/contratti) da Lead stages<br/>
                <strong>ARR</strong> da Contratti attivi &bull; <strong>Cash-in</strong> da Fatture pagate
                <strong style={{ color: '#047857' }}> Non modificabili manualmente.</strong>
              </p>
            </div>

            {/* Manual Data */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              border: '2px solid #FCD34D'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaPencilAlt size={14} style={{ color: '#92400E' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#92400E', fontSize: '14px' }}>Dati Manuali</div>
                  <DataTypeBadge type="manual" small />
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: '1.5' }}>
                Solo per <strong>Milestone</strong> e <strong>Credibilità</strong> (obiettivi qualitativi).
                Tutti i dati numerici del funnel/revenue sono ora automatici!
                <strong style={{ color: '#92400E' }}> Clicca "Modifica" per aggiornare milestone e credibility.</strong>
              </p>
            </div>
          </div>

          {/* Quick tip */}
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#EFF6FF',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaMousePointer size={14} style={{ color: '#3B82F6' }} />
            <span style={{ fontSize: '13px', color: '#1E40AF' }}>
              <strong>Suggerimento:</strong> Cerca il badge <DataTypeBadge type="manual" small /> per identificare i campi modificabili.
              I pulsanti <span style={{ background: '#1A1A1A', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}><FaEdit size={10} style={{ marginRight: '4px' }} />Modifica</span> appaiono accanto ai dati editabili.
            </span>
          </div>
        </div>
      )}

      {/* Show legend button when hidden */}
      {!showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            marginBottom: '20px',
            background: '#F1F5F9',
            border: '2px solid #E2E8F0',
            borderRadius: '10px',
            color: '#64748B',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <FaInfoCircle size={14} />
          Mostra legenda dati
        </button>
      )}

      {/* Auto-calculated Stats Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
        borderRadius: '20px',
        padding: '24px 32px',
        marginBottom: '24px',
        border: '3px solid #065F46'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaRobot size={18} style={{ color: '#047857' }} />
            </div>
            <div>
              <span style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>Dati Automatici</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <DataTypeBadge type="auto" />
                <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Aggiornati in tempo reale dal database</span>
              </div>
            </div>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaDatabase size={14} style={{ color: '#10B981' }} />
            <span style={{ color: '#10B981', fontSize: '12px', fontWeight: '600' }}>
              Sincronizzazione live
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <FaUsers size={18} style={{ color: '#85FF00' }} />
              <span style={{
                background: 'rgba(133, 255, 0, 0.2)',
                color: '#85FF00',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '600'
              }}>LIVE</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#85FF00' }}>
              {auto_calculated?.total_clubs || 0}
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Club Attivi</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <FaEuroSign size={18} style={{ color: '#10B981' }} />
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '600'
              }}>LIVE</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#10B981' }}>
              {formatCurrency(auto_calculated?.total_arr || 0)}
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>ARR Attuale</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <FaUserCheck size={18} style={{ color: '#6366F1' }} />
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#6366F1',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '600'
              }}>LIVE</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#6366F1' }}>
              {auto_calculated?.converted_leads || 0}
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Lead Convertiti</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <FaHandshake size={18} style={{ color: '#F59E0B' }} />
              <span style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '600'
              }}>LIVE</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#F59E0B' }}>
              {auto_calculated?.total_sponsors || 0}
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Sponsor Attivi</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.id ? '#1A1A1A' : '#F5F5F5',
              color: activeTab === tab.id ? 'white' : '#6B7280',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Progress Cards */}
          <div className="tp-stats-row" style={{ marginBottom: '24px' }}>
            {/* Club Progress */}
            <div className="tp-stat-card-dark">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div className="tp-stat-icon" style={{ background: '#85FF00' }}>
                  <FaUsers style={{ color: '#1A1A1A' }} />
                </div>
                <DataTypeBadge type="auto" small />
              </div>
              <div className="tp-stat-content">
                <div className="tp-stat-value">{auto_calculated?.total_clubs || 0} / {targets?.clubs}</div>
                <div className="tp-stat-label">Club Target</div>
                <div style={{
                  marginTop: '8px',
                  height: '6px',
                  background: '#374151',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(((auto_calculated?.total_clubs || 0) / targets?.clubs) * 100, 100)}%`,
                    height: '100%',
                    background: getProgressColor(auto_calculated?.total_clubs, targets?.clubs),
                    borderRadius: '3px',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            </div>

            {/* ARR Progress */}
            <div className="tp-stat-card-dark">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div className="tp-stat-icon" style={{ background: '#85FF00' }}>
                  <FaEuroSign style={{ color: '#1A1A1A' }} />
                </div>
                <DataTypeBadge type="auto" small />
              </div>
              <div className="tp-stat-content">
                <div className="tp-stat-value">{formatPercent(auto_calculated?.total_arr, targets?.arr)}</div>
                <div className="tp-stat-label">ARR vs Target €225k</div>
                <div style={{
                  marginTop: '8px',
                  height: '6px',
                  background: '#374151',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(((auto_calculated?.total_arr || 0) / targets?.arr) * 100, 100)}%`,
                    height: '100%',
                    background: getProgressColor(auto_calculated?.total_arr, targets?.arr),
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            </div>

            {/* Contracts Progress - Auto from Lead stages */}
            <div className="tp-stat-card-dark">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div className="tp-stat-icon" style={{ background: '#85FF00' }}>
                  <FaHandshake style={{ color: '#1A1A1A' }} />
                </div>
                <DataTypeBadge type="auto" small />
              </div>
              <div className="tp-stat-content">
                <div className="tp-stat-value">{auto_calculated?.funnel?.contracts || ytd_totals?.contracts || 0} / {targets?.contracts}</div>
                <div className="tp-stat-label">Contratti Chiusi (Lead Vinti)</div>
                <div style={{
                  marginTop: '8px',
                  height: '6px',
                  background: '#374151',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(((auto_calculated?.funnel?.contracts || ytd_totals?.contracts || 0) / targets?.contracts) * 100, 100)}%`,
                    height: '100%',
                    background: getProgressColor(auto_calculated?.funnel?.contracts || ytd_totals?.contracts, targets?.contracts),
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            </div>

            {/* Milestones Progress - Manual */}
            <div className="tp-stat-card-dark">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div className="tp-stat-icon" style={{ background: '#85FF00' }}>
                  <FaFlag style={{ color: '#1A1A1A' }} />
                </div>
                <DataTypeBadge type="manual" small />
              </div>
              <div className="tp-stat-content">
                <div className="tp-stat-value">{milestones?.completed || 0} / {milestones?.total || 0}</div>
                <div className="tp-stat-label">Milestone Completate</div>
                <div style={{
                  marginTop: '8px',
                  height: '6px',
                  background: '#374151',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${milestones?.total ? (milestones.completed / milestones.total) * 100 : 0}%`,
                    height: '100%',
                    background: '#10B981',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quarterly Progress */}
          <div className="tp-card" style={{ marginBottom: '24px' }}>
            <div className="tp-card-header">
              <h3 className="tp-card-title">
                <FaCalendarAlt /> Andamento Trimestrale
              </h3>
              <DataTypeBadge type="auto" />
            </div>
            <div className="tp-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                  const target = targets?.quarterly?.[q];
                  const actual = quarterly_actuals?.[q];
                  const isCurrentQuarter = (q === 'Q1' && new Date().getMonth() < 3) ||
                    (q === 'Q2' && new Date().getMonth() >= 3 && new Date().getMonth() < 6) ||
                    (q === 'Q3' && new Date().getMonth() >= 6 && new Date().getMonth() < 9) ||
                    (q === 'Q4' && new Date().getMonth() >= 9);

                  return (
                    <div key={q} style={{
                      background: isCurrentQuarter ? 'linear-gradient(135deg, #1A1A1A, #2D2D2D)' : '#FAFAFA',
                      borderRadius: '16px',
                      padding: '20px',
                      border: isCurrentQuarter ? '2px solid #85FF00' : '2px solid #E5E7EB'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: isCurrentQuarter ? 'white' : '#1A1A1A'
                        }}>
                          {q}
                        </span>
                        {isCurrentQuarter && (
                          <span style={{
                            background: '#85FF00',
                            color: '#1A1A1A',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '700'
                          }}>
                            ATTUALE
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: isCurrentQuarter ? '#9CA3AF' : '#6B7280',
                            marginBottom: '4px'
                          }}>
                            <span>Club</span>
                            <span>{actual?.new_clubs || 0} / {target?.clubs}</span>
                          </div>
                          <div style={{ height: '4px', background: isCurrentQuarter ? '#374151' : '#E5E7EB', borderRadius: '2px' }}>
                            <div style={{
                              width: `${Math.min(((actual?.new_clubs || 0) / (target?.clubs || 1)) * 100, 100)}%`,
                              height: '100%',
                              background: getProgressColor(actual?.new_clubs, target?.clubs),
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>

                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: isCurrentQuarter ? '#9CA3AF' : '#6B7280',
                            marginBottom: '4px'
                          }}>
                            <span>Demo</span>
                            <span>{actual?.demos || 0} / {target?.demos}</span>
                          </div>
                          <div style={{ height: '4px', background: isCurrentQuarter ? '#374151' : '#E5E7EB', borderRadius: '2px' }}>
                            <div style={{
                              width: `${Math.min(((actual?.demos || 0) / (target?.demos || 1)) * 100, 100)}%`,
                              height: '100%',
                              background: getProgressColor(actual?.demos, target?.demos),
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>

                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: isCurrentQuarter ? '#9CA3AF' : '#6B7280',
                            marginBottom: '4px'
                          }}>
                            <span>Contratti</span>
                            <span>{actual?.contracts || 0} / {target?.contracts}</span>
                          </div>
                          <div style={{ height: '4px', background: isCurrentQuarter ? '#374151' : '#E5E7EB', borderRadius: '2px' }}>
                            <div style={{
                              width: `${Math.min(((actual?.contracts || 0) / (target?.contracts || 1)) * 100, 100)}%`,
                              height: '100%',
                              background: getProgressColor(actual?.contracts, target?.contracts),
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Club Mix */}
          <div className="tp-card">
            <div className="tp-card-header">
              <h3 className="tp-card-title">
                <FaCrown /> Distribuzione Club per Piano
              </h3>
              <DataTypeBadge type="auto" />
            </div>
            <div className="tp-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{
                  background: '#FAFAFA',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  border: '2px solid #E5E7EB'
                }}>
                  <FaStar size={32} color="#6B7280" />
                  <div style={{ fontSize: '36px', fontWeight: '800', color: '#1A1A1A', margin: '12px 0' }}>
                    {auto_calculated?.clubs_by_plan?.basic || 0}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Basic / Kickoff</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9CA3AF',
                    padding: '6px 12px',
                    background: '#E5E7EB',
                    borderRadius: '20px',
                    display: 'inline-block'
                  }}>
                    Target: {targets?.clubs_basic}
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  border: '2px solid #C7D2FE'
                }}>
                  <FaCrown size={32} color="#6366F1" />
                  <div style={{ fontSize: '36px', fontWeight: '800', color: '#1A1A1A', margin: '12px 0' }}>
                    {auto_calculated?.clubs_by_plan?.premium || 0}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6366F1', marginBottom: '8px' }}>Premium</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6366F1',
                    padding: '6px 12px',
                    background: '#C7D2FE',
                    borderRadius: '20px',
                    display: 'inline-block'
                  }}>
                    Target: {targets?.clubs_premium}
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  border: '2px solid #FCD34D'
                }}>
                  <FaGem size={32} color="#F59E0B" />
                  <div style={{ fontSize: '36px', fontWeight: '800', color: '#1A1A1A', margin: '12px 0' }}>
                    {auto_calculated?.clubs_by_plan?.elite || 0}
                  </div>
                  <div style={{ fontSize: '14px', color: '#B45309', marginBottom: '8px' }}>Elite</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#92400E',
                    padding: '6px 12px',
                    background: '#FCD34D',
                    borderRadius: '20px',
                    display: 'inline-block'
                  }}>
                    Target: {targets?.clubs_elite}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB: MONTHLY DATA */}
      {activeTab === 'monthly' && (
        <div className="tp-card">
          <div className="tp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className="tp-card-title">
                <FaCalendarAlt /> Inserimento Dati Mensili
              </h3>
              <DataTypeBadge type="manual" />
            </div>
            <div style={{
              background: '#FEF3C7',
              color: '#92400E',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaPencilAlt size={12} />
              Seleziona un mese e clicca "Modifica" per aggiornare i dati
            </div>
          </div>
          <div className="tp-card-body">
            {/* Month Selector */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '8px',
              marginBottom: '24px'
            }}>
              {months.map(m => {
                const monthData = dashboardData?.monthly_data?.find(d => d.month === m.value);
                const hasData = monthData && (monthData.contacts > 0 || monthData.demos > 0 || monthData.contracts > 0);

                return (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMonth(m.value)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '10px',
                      border: selectedMonth === m.value ? '2px solid #1A1A1A' : '2px solid #E5E7EB',
                      background: selectedMonth === m.value ? '#1A1A1A' : hasData ? '#F0FDF4' : 'white',
                      color: selectedMonth === m.value ? 'white' : '#1A1A1A',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {m.short}
                    {hasData && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10B981'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Edit Form */}
            {editingMonth === selectedMonth ? (
              <div style={{
                background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
                borderRadius: '16px',
                padding: '24px',
                border: '2px solid #FCD34D'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaPencilAlt size={16} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>
                        Modifica {months.find(m => m.value === selectedMonth)?.label} 2026
                      </h4>
                      <span style={{ fontSize: '12px', color: '#92400E' }}>Compila i campi e salva le modifiche</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setEditingMonth(null)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: '2px solid #E5E7EB',
                        background: 'white',
                        color: '#6B7280',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaTimes /> Annulla
                    </button>
                    <button
                      onClick={saveMonthlyData}
                      disabled={saving}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#10B981',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaSave /> {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                  </div>
                </div>

                {/* Funnel Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '12px' }}>
                    <FaChartLine style={{ marginRight: '8px' }} />
                    Funnel Vendite
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {[
                      { key: 'contacts', label: 'Contatti', icon: FaPhone },
                      { key: 'demos', label: 'Demo', icon: FaVideo },
                      { key: 'proposals', label: 'Proposte', icon: FaFileAlt },
                      { key: 'contracts', label: 'Contratti', icon: FaHandshake }
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <field.icon size={12} /> {field.label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={monthlyFormData[field.key] || 0}
                          onChange={(e) => setMonthlyFormData({ ...monthlyFormData, [field.key]: parseInt(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '2px solid #E5E7EB',
                            fontSize: '16px',
                            fontWeight: '600',
                            background: 'white'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '12px' }}>
                    <FaEuroSign style={{ marginRight: '8px' }} />
                    Revenue
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', display: 'block' }}>
                        Booking (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={monthlyFormData.booking || 0}
                        onChange={(e) => setMonthlyFormData({ ...monthlyFormData, booking: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '2px solid #E5E7EB',
                          fontSize: '16px',
                          fontWeight: '600',
                          background: 'white'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', display: 'block' }}>
                        ARR Nuovo (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={monthlyFormData.arr_new || 0}
                        onChange={(e) => setMonthlyFormData({ ...monthlyFormData, arr_new: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '2px solid #E5E7EB',
                          fontSize: '16px',
                          fontWeight: '600',
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Add-on Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '12px' }}>
                    <FaCoins style={{ marginRight: '8px' }} />
                    Add-on Revenue
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                      { key: 'addon_setup', label: 'Setup/Onboarding (€)' },
                      { key: 'addon_training', label: 'Formazione (€)' },
                      { key: 'addon_custom', label: 'Custom/Integrazioni (€)' }
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', display: 'block' }}>
                          {field.label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={monthlyFormData[field.key] || 0}
                          onChange={(e) => setMonthlyFormData({ ...monthlyFormData, [field.key]: parseFloat(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '2px solid #E5E7EB',
                            fontSize: '16px',
                            fontWeight: '600',
                            background: 'white'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Clubs Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '12px' }}>
                    <FaUsers style={{ marginRight: '8px' }} />
                    Nuovi Club per Piano
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                      { key: 'new_clubs_basic', label: 'Basic', icon: FaStar, color: '#6B7280' },
                      { key: 'new_clubs_premium', label: 'Premium', icon: FaCrown, color: '#6366F1' },
                      { key: 'new_clubs_elite', label: 'Elite', icon: FaGem, color: '#F59E0B' }
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ fontSize: '12px', color: field.color, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <field.icon size={12} /> {field.label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={monthlyFormData[field.key] || 0}
                          onChange={(e) => setMonthlyFormData({ ...monthlyFormData, [field.key]: parseInt(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: `2px solid ${field.color}40`,
                            fontSize: '16px',
                            fontWeight: '600',
                            background: 'white'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', display: 'block' }}>
                    Note
                  </label>
                  <textarea
                    value={monthlyFormData.notes || ''}
                    onChange={(e) => setMonthlyFormData({ ...monthlyFormData, notes: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #E5E7EB',
                      fontSize: '14px',
                      resize: 'vertical',
                      background: 'white'
                    }}
                    placeholder="Note opzionali per questo mese..."
                  />
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                {(() => {
                  const monthData = dashboardData?.monthly_data?.find(d => d.month === selectedMonth) || {};
                  return (
                    <div style={{
                      background: '#FAFAFA',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '2px solid #E5E7EB'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px'
                      }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A' }}>
                          {months.find(m => m.value === selectedMonth)?.label} 2026
                        </h4>
                        <button
                          onClick={() => startEditMonth(selectedMonth)}
                          style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <FaPencilAlt size={14} /> Modifica Dati
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                          <FaPhone size={20} color="#6B7280" />
                          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', margin: '8px 0' }}>
                            {monthData.contacts || 0}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Contatti</div>
                        </div>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                          <FaVideo size={20} color="#3B82F6" />
                          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', margin: '8px 0' }}>
                            {monthData.demos || 0}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Demo</div>
                        </div>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                          <FaFileAlt size={20} color="#8B5CF6" />
                          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', margin: '8px 0' }}>
                            {monthData.proposals || 0}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Proposte</div>
                        </div>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                          <FaHandshake size={20} color="#10B981" />
                          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', margin: '8px 0' }}>
                            {monthData.contracts || 0}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Contratti</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#065F46', marginBottom: '4px' }}>Booking</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#047857' }}>
                            {formatCurrency(monthData.booking || 0)}
                          </div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#1E40AF', marginBottom: '4px' }}>ARR Nuovo</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1D4ED8' }}>
                            {formatCurrency(monthData.arr_new || 0)}
                          </div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#92400E', marginBottom: '4px' }}>Add-on Totale</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#B45309' }}>
                            {formatCurrency((monthData.addon_setup || 0) + (monthData.addon_training || 0) + (monthData.addon_custom || 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: FUNNEL */}
      {activeTab === 'funnel' && (
        <div className="tp-card">
          <div className="tp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className="tp-card-title">
                <FaChartLine /> Funnel Vendite YTD
              </h3>
              <DataTypeBadge type="auto" />
            </div>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Calcolato automaticamente dagli stage dei Lead CRM
            </span>
          </div>
          <div className="tp-card-body">
            {/* Funnel Visual - DATI AUTOMATICI DA LEAD STAGES */}
            <div style={{ maxWidth: '600px', margin: '0 auto 32px' }}>
              {[
                { stage: 'Contatti Qualificati', value: auto_calculated?.funnel?.contacts || ytd_totals?.contacts || 0, target: targets?.contacts, color: '#E5E7EB' },
                { stage: 'Demo Effettuate', value: auto_calculated?.funnel?.demos || ytd_totals?.demos || 0, target: targets?.demos, color: '#93C5FD', rate: conversion_rates?.contact_to_demo },
                { stage: 'Proposte Inviate', value: auto_calculated?.funnel?.proposals || ytd_totals?.proposals || 0, target: targets?.proposals, color: '#6366F1', rate: conversion_rates?.demo_to_proposal },
                { stage: 'Contratti Chiusi', value: auto_calculated?.funnel?.contracts || ytd_totals?.contracts || 0, target: targets?.contracts, color: '#10B981', rate: conversion_rates?.proposal_to_contract }
              ].map((stage, index) => (
                <div key={index} style={{ position: 'relative', marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    background: stage.color,
                    borderRadius: '12px',
                    width: `${100 - (index * 12)}%`,
                    marginLeft: `${index * 6}%`,
                    transition: 'all 0.3s'
                  }}>
                    <span style={{ fontWeight: '600', color: index > 0 ? 'white' : '#1A1A1A' }}>
                      {stage.stage}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: index > 0 ? 'white' : '#1A1A1A' }}>
                        {stage.value}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: index > 0 ? 'rgba(255,255,255,0.7)' : '#6B7280'
                      }}>
                        / {stage.target}
                      </span>
                      {stage.rate !== undefined && (
                        <span style={{
                          background: 'rgba(255,255,255,0.2)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'white'
                        }}>
                          {stage.rate}% conv.
                        </span>
                      )}
                    </div>
                  </div>
                  {index < 3 && (
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: '-12px',
                      transform: 'translateX(-50%)',
                      zIndex: 1
                    }}>
                      <FaArrowDown size={16} color="#9CA3AF" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Conversion Rates */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              background: '#FAFAFA',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                  Contatto → Demo
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: conversion_rates?.contact_to_demo >= 37 ? '#10B981' : '#EF4444'
                }}>
                  {conversion_rates?.contact_to_demo || 0}%
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Target: 37%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                  Demo → Proposta
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: conversion_rates?.demo_to_proposal >= 67 ? '#10B981' : '#EF4444'
                }}>
                  {conversion_rates?.demo_to_proposal || 0}%
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Target: 67%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                  Proposta → Chiusura
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: conversion_rates?.proposal_to_contract >= 50 ? '#10B981' : '#EF4444'
                }}>
                  {conversion_rates?.proposal_to_contract || 0}%
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Target: 50%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="tp-card">
          <div className="tp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className="tp-card-title">
                <FaFlag /> Milestone 2026
              </h3>
              <DataTypeBadge type="manual" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: '#FEF3C7',
                color: '#92400E',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FaMousePointer size={10} />
                Clicca per cambiare stato
              </span>
              <span style={{
                background: milestones?.completed === milestones?.total ? '#D1FAE5' : '#FEF3C7',
                color: milestones?.completed === milestones?.total ? '#065F46' : '#92400E',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {milestones?.completed || 0} / {milestones?.total || 0} completate
              </span>
            </div>
          </div>
          <div className="tp-card-body">
            {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
              const quarterMilestones = milestones?.items?.filter(m => m.quarter === quarter) || [];
              if (quarterMilestones.length === 0) return null;

              return (
                <div key={quarter} style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      background: '#1A1A1A',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      {quarter}
                    </span>
                    <span style={{ color: '#6B7280', fontWeight: '400', fontSize: '14px' }}>
                      {quarterMilestones.filter(m => m.status === 'completed').length} / {quarterMilestones.length}
                    </span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {quarterMilestones.map(milestone => (
                      <div
                        key={milestone.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          background: milestone.status === 'completed' ? '#F0FDF4' : '#FAFAFA',
                          borderRadius: '12px',
                          border: `2px solid ${milestone.status === 'completed' ? '#A7F3D0' : '#E5E7EB'}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <button
                            onClick={() => updateMilestone(milestone.id, {
                              status: milestone.status === 'completed' ? 'not_started' : 'completed'
                            })}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              border: `2px solid ${getStatusColor(milestone.status)}`,
                              background: milestone.status === 'completed' ? '#10B981' : 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Clicca per cambiare stato"
                          >
                            {milestone.status === 'completed' && (
                              <FaCheckCircle size={14} color="white" />
                            )}
                          </button>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: milestone.status === 'completed' ? '#065F46' : '#1A1A1A',
                            textDecoration: milestone.status === 'completed' ? 'line-through' : 'none'
                          }}>
                            {milestone.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <select
                            value={milestone.status}
                            onChange={(e) => updateMilestone(milestone.id, { status: e.target.value })}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '2px solid #E5E7EB',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: getStatusColor(milestone.status),
                              background: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="not_started">Da Iniziare</option>
                            <option value="in_progress">In Corso</option>
                            <option value="completed">Completato</option>
                          </select>

                          {milestone.completion_date && (
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>
                              {new Date(milestone.completion_date).toLocaleDateString('it-IT')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: CREDIBILITY */}
      {activeTab === 'credibility' && (
        <div className="tp-card">
          <div className="tp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className="tp-card-title">
                <FaTrophy /> KPI Credibilità (Investor-Ready)
              </h3>
              <DataTypeBadge type="manual" />
            </div>
            <span style={{
              background: '#FEF3C7',
              color: '#92400E',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FaMousePointer size={10} />
              Clicca sul valore "Attuale" per modificarlo
            </span>
          </div>
          <div className="tp-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {credibility?.map(kpi => (
                <div
                  key={kpi.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 140px 140px 100px',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 24px',
                    background: '#FAFAFA',
                    borderRadius: '12px',
                    border: '2px solid #E5E7EB'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>
                      {kpi.name}
                    </div>
                    {kpi.notes && (
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                        {kpi.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Target</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A' }}>{kpi.target}</div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Attuale</div>
                    {editingCredibility === kpi.id ? (
                      <input
                        type="text"
                        defaultValue={kpi.current_value}
                        onBlur={(e) => {
                          updateCredibility(kpi.id, { current_value: e.target.value });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateCredibility(kpi.id, { current_value: e.target.value });
                          }
                          if (e.key === 'Escape') {
                            setEditingCredibility(null);
                          }
                        }}
                        autoFocus
                        style={{
                          width: '100px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '2px solid #F59E0B',
                          fontSize: '14px',
                          fontWeight: '600',
                          textAlign: 'center',
                          background: '#FFFBEB'
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => setEditingCredibility(kpi.id)}
                        style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#10B981',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: '#F0FDF4',
                          border: '2px dashed #A7F3D0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        title="Clicca per modificare"
                      >
                        {kpi.current_value}
                        <FaPencilAlt size={10} style={{ opacity: 0.5 }} />
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <select
                      value={kpi.status}
                      onChange={(e) => updateCredibility(kpi.id, { status: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '2px solid #E5E7EB',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: getStatusColor(kpi.status),
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="in_progress">In Corso</option>
                      <option value="completed">Completato</option>
                      <option value="at_risk">A Rischio</option>
                    </select>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      background: '#E5E7EB',
                      color: '#374151',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {kpi.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSS for spinning animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default AdminAndamento;
