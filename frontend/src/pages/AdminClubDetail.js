import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaPen, FaPlus, FaCheck,
  FaHistory, FaPhone, FaEnvelope, FaCalendarAlt,
  FaStickyNote, FaEllipsisH, FaCrown, FaFileInvoice,
  FaTimes, FaPause, FaPlay, FaRocket,
  FaBuilding, FaUserTie,
  FaInbox, FaDownload, FaCopy, FaRedo, FaLink,
  FaFileContract, FaEye, FaFilePdf, FaExternalLinkAlt
} from 'react-icons/fa';
import ConversationTab from '../components/ConversationTab';
import UnifiedTimeline from '../components/UnifiedTimeline';
import { adminEmailAPI, adminWhatsAppAPI } from '../services/api';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const ACTIVITY_TYPES = {
  chiamata: { icon: <FaPhone />, label: 'Chiamata', color: '#3B82F6' },
  email: { icon: <FaEnvelope />, label: 'Email', color: '#8B5CF6' },
  meeting: { icon: <FaCalendarAlt />, label: 'Meeting', color: '#F59E0B' },
  nota: { icon: <FaStickyNote />, label: 'Nota', color: '#6B7280' },
  supporto: { icon: <FaUserTie />, label: 'Supporto', color: '#10B981' },
  fattura: { icon: <FaFileInvoice />, label: 'Fattura', color: '#059669' },
  sospensione: { icon: <FaPause />, label: 'Sospensione', color: '#DC2626' },
  riattivazione: { icon: <FaPlay />, label: 'Riattivazione', color: '#059669' },
  altro: { icon: <FaEllipsisH />, label: 'Altro', color: '#9CA3AF' }
};

const ESITO_OPTIONS = {
  positivo: { label: 'Positivo', bgColor: '#D1FAE5', color: '#059669' },
  negativo: { label: 'Negativo', bgColor: '#FEE2E2', color: '#DC2626' },
  neutro: { label: 'Neutro', bgColor: '#F3F4F6', color: '#6B7280' },
  da_seguire: { label: 'Da seguire', bgColor: '#FEF3C7', color: '#D97706' }
};

const INVOICE_STATUS = {
  draft: { label: 'Bozza', color: '#6B7280', bg: '#F3F4F6' },
  sent: { label: 'Inviata', color: '#3B82F6', bg: '#EFF6FF' },
  paid: { label: 'Pagata', color: '#059669', bg: '#ECFDF5' },
  overdue: { label: 'Scaduta', color: '#DC2626', bg: '#FEF2F2' },
  cancelled: { label: 'Annullata', color: '#6B7280', bg: '#F3F4F6' }
};

const CONTRACT_PLAN_CONFIG = {
  basic: { name: 'Basic', color: '#6B7280', bg: '#F9FAFB', price: 10000 },
  Basic: { name: 'Basic', color: '#6B7280', bg: '#F9FAFB', price: 10000 },
  premium: { name: 'Premium', color: '#3B82F6', bg: '#EFF6FF', price: 15000 },
  Premium: { name: 'Premium', color: '#3B82F6', bg: '#EFF6FF', price: 15000 },
  elite: { name: 'Elite', color: '#F59E0B', bg: '#FFFBEB', price: 25000 },
  Elite: { name: 'Elite', color: '#F59E0B', bg: '#FFFBEB', price: 25000 }
};

const CONTRACT_STATUS_CONFIG = {
  draft: { label: 'Bozza', color: '#6B7280', bg: '#F3F4F6' },
  active: { label: 'Attivo', color: '#059669', bg: '#ECFDF5' },
  expired: { label: 'Scaduto', color: '#DC2626', bg: '#FEF2F2' },
  cancelled: { label: 'Annullato', color: '#DC2626', bg: '#FEF2F2' },
  renewed: { label: 'Rinnovato', color: '#3B82F6', bg: '#EFF6FF' }
};

function AdminClubDetail() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [club, setClub] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionEvents, setSubscriptionEvents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [timelineEmails, setTimelineEmails] = useState([]);
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null); // 'suspend' or 'activate'
  const [statusMotivo, setStatusMotivo] = useState('');

  const [activityForm, setActivityForm] = useState({
    tipo: 'chiamata',
    descrizione: '',
    esito: '',
    data_schedulata: new Date().toISOString().slice(0, 16)
  });

  const [invoiceForm, setInvoiceForm] = useState({
    subtotal: '',
    tax_rate: 22,
    description: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: ''
  });

  const [regeneratingToken, setRegeneratingToken] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [clubRes, subRes, invoicesRes, activitiesRes, contractsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/clubs/${clubId}`, { headers }),
        axios.get(`${API_URL}/admin/clubs/${clubId}/subscription`, { headers }).catch(() => ({ data: { subscription: null, events: [] } })),
        axios.get(`${API_URL}/admin/clubs/${clubId}/invoices`, { headers }).catch(() => ({ data: { invoices: [], summary: null } })),
        axios.get(`${API_URL}/admin/clubs/${clubId}/activities`, { headers }).catch(() => ({ data: { activities: [] } })),
        axios.get(`${API_URL}/admin/contracts?club_id=${clubId}`, { headers }).catch(() => ({ data: { contracts: [] } }))
      ]);

      setClub(clubRes.data);
      setSubscription(subRes.data.subscription);
      setSubscriptionEvents(subRes.data.events || []);
      setInvoices(invoicesRes.data.invoices || []);
      setInvoiceSummary(invoicesRes.data.summary);
      setActivities(activitiesRes.data.activities || []);
      setContracts(contractsRes.data.contracts || []);

      // Fetch conversation emails for timeline (non-blocking)
      if (clubRes.data?.email) {
        adminEmailAPI.getConversation(clubRes.data.email).then(res => {
          setTimelineEmails(res.data?.messages || []);
        }).catch(() => {});
      }

      // Fetch WhatsApp messages (non-blocking)
      if (clubRes.data?.telefono) {
        adminWhatsAppAPI.getStatus().then(statusRes => {
          setWhatsappConnected(statusRes.data.connected);
          if (statusRes.data.connected) {
            adminWhatsAppAPI.getMessagesByPhone(clubRes.data.telefono).then(waRes => {
              setWhatsappMessages(waRes.data.messages || []);
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Errore caricamento club:', error);
      setToast({ message: 'Errore nel caricamento del club', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsApp = () => {
    if (club?.telefono) {
      adminWhatsAppAPI.getMessagesByPhone(club.telefono).then(waRes => {
        setWhatsappMessages(waRes.data.messages || []);
      }).catch(() => {});
    }
  };

  const handleCreateActivity = async () => {
    if (!activityForm.tipo) {
      setToast({ message: 'Seleziona un tipo', type: 'error' });
      return;
    }
    try {
      await axios.post(`${API_URL}/admin/clubs/${clubId}/activities`, activityForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Attivita registrata!', type: 'success' });
      setShowActivityModal(false);
      setActivityForm({ tipo: 'chiamata', descrizione: '', esito: '', data_schedulata: new Date().toISOString().slice(0, 16) });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Errore', type: 'error' });
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceForm.subtotal) {
      setToast({ message: 'Inserisci importo', type: 'error' });
      return;
    }
    try {
      await axios.post(`${API_URL}/admin/clubs/${clubId}/invoices`, {
        ...invoiceForm,
        subtotal: parseFloat(invoiceForm.subtotal),
        status: 'draft'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Fattura creata!', type: 'success' });
      setShowInvoiceModal(false);
      setInvoiceForm({
        subtotal: '',
        tax_rate: 22,
        description: '',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        notes: ''
      });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Errore', type: 'error' });
    }
  };

  const handleMarkInvoicePaid = async (invoiceId) => {
    try {
      await axios.put(`${API_URL}/admin/clubs/${clubId}/invoices/${invoiceId}`, {
        status: 'paid',
        payment_method: 'bonifico'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Fattura pagata!', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Errore', type: 'error' });
    }
  };

  const handleUpdateSubscription = async (updates) => {
    try {
      await axios.put(`${API_URL}/admin/clubs/${clubId}/subscription`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Abbonamento aggiornato!', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Errore', type: 'error' });
    }
  };

  const openStatusModal = (action) => {
    setStatusAction(action);
    setStatusMotivo('');
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusAction(null);
    setStatusMotivo('');
  };

  const handleToggleAccountStatus = async () => {
    try {
      await axios.post(`${API_URL}/admin/clubs/${clubId}/toggle-status`, {
        action: statusAction,
        motivo: statusMotivo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({
        message: statusAction === 'suspend' ? 'Account sospeso!' : 'Account riattivato!',
        type: 'success'
      });
      closeStatusModal();
      fetchAllData();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore', type: 'error' });
      closeStatusModal();
    }
  };

  const handleRegenerateToken = async () => {
    try {
      setRegeneratingToken(true);
      await axios.post(`${API_URL}/admin/clubs/${clubId}/regenerate-token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Token rigenerato con successo!', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore nella rigenerazione del token', type: 'error' });
    } finally {
      setRegeneratingToken(false);
    }
  };

  const handleCopyActivationLink = () => {
    const activationUrl = `${window.location.origin}/activate/${club.activation_token}`;
    navigator.clipboard.writeText(activationUrl);
    setToast({ message: 'Link copiato negli appunti!', type: 'success' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="sd-page">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento club...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="sd-page">
        <div className="tp-empty-state">
          <h3>Club non trovato</h3>
          <button className="tp-btn tp-btn-primary" onClick={() => navigate('/admin/clubs')}>
            Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!club.account_attivo) {
      return { label: 'Sospeso', color: '#6366F1', bg: '#EEF2FF', icon: <FaPause /> };
    }
    if (!club.licenza_valida) {
      return { label: 'Scaduto', color: '#DC2626', bg: '#FEF2F2', icon: <FaTimes /> };
    }
    if (subscription?.is_trial || club.nome_abbonamento?.toLowerCase().includes('trial')) {
      return { label: 'Trial', color: '#F59E0B', bg: '#FFFBEB', icon: <FaRocket /> };
    }
    return { label: 'Attivo', color: '#059669', bg: '#ECFDF5', icon: <FaCheck /> };
  };

  const statusBadge = getStatusBadge();
  const initials = club.nome?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* SIDEBAR */}
        <div className="sd-profile-card">
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate('/admin/clubs')}>
              <FaArrowLeft />
            </button>
            <div className="sd-header-actions">
              <button className="sd-header-btn edit" onClick={() => navigate(`/admin/clubs/${clubId}/edit`)}>
                <FaPen />
              </button>
            </div>
          </div>

          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar">
              {club.logo_url ? (
                <img src={getImageUrl(club.logo_url)} alt={club.nome} />
              ) : (
                <div className="sd-profile-avatar-placeholder">{initials || <FaBuilding />}</div>
              )}
            </div>
            <h1 className="sd-profile-name">{club.nome}</h1>
            <p className="sd-profile-sector">{club.tipologia || 'Sport Club'}</p>
            <span className="sd-profile-status" style={{ background: statusBadge.bg, color: statusBadge.color }}>
              {statusBadge.icon} {statusBadge.label}
            </span>
          </div>

          <div className="sd-profile-body">
            {/* Stato Account */}
            <div style={{ marginBottom: '20px' }}>
              {club.account_attivo ? (
                <button className="tp-btn tp-btn-outline" onClick={() => openStatusModal('suspend')} style={{ width: '100%', justifyContent: 'center', borderColor: '#F59E0B', color: '#F59E0B' }}>
                  <FaPause /> Sospendi Club
                </button>
              ) : (
                <button className="tp-btn tp-btn-primary" onClick={() => openStatusModal('activate')} style={{ width: '100%', justifyContent: 'center', background: '#059669' }}>
                  <FaPlay /> Riattiva Club
                </button>
              )}
            </div>

            {/* Sezione Attivazione Account */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Attivazione Account</h3>
              {club.is_activated ? (
                <div style={{ background: '#ECFDF5', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FaCheck style={{ color: '#059669' }} />
                    <span style={{ fontWeight: 600, color: '#059669' }}>Account Attivato</span>
                  </div>
                  {club.activated_at && (
                    <div style={{ fontSize: '13px', color: '#065F46' }}>
                      Attivato il {formatDate(club.activated_at)}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <FaLink style={{ color: '#D97706' }} />
                    <span style={{ fontWeight: 600, color: '#92400E' }}>In attesa di attivazione</span>
                  </div>

                  {club.activation_token && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#92400E', marginBottom: '4px' }}>Link di attivazione:</div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'white',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          border: '1px solid #F59E0B'
                        }}>
                          <span style={{
                            flex: 1,
                            fontSize: '12px',
                            color: '#1A1A1A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {window.location.origin}/activate/{club.activation_token}
                          </span>
                          <button
                            onClick={handleCopyActivationLink}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#1A1A1A',
                              color: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Copia link"
                          >
                            <FaCopy size={12} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#92400E', marginBottom: '12px' }}>
                        Scade: {formatDate(club.activation_token_expires)}
                        {!club.activation_token_valid && (
                          <span style={{ color: '#DC2626', fontWeight: 600, marginLeft: '8px' }}>(Scaduto)</span>
                        )}
                      </div>

                      <button
                        onClick={handleRegenerateToken}
                        disabled={regeneratingToken}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #D97706',
                          background: 'white',
                          color: '#D97706',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <FaRedo style={{ animation: regeneratingToken ? 'spin 1s linear infinite' : 'none' }} />
                        {regeneratingToken ? 'Rigenerando...' : 'Rigenera Token'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="sd-content-card">
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: '#D1D5DB transparent',
            maskImage: 'linear-gradient(to right, black calc(100% - 32px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 32px), transparent 100%)'
          }}>
            {[
              { id: 'timeline', label: 'Timeline', icon: <FaHistory size={14} />, count: activities.length + invoices.length + contracts.length },
              { id: 'subscription', label: 'Abbonamento', icon: <FaCrown size={14} /> },
              { id: 'contracts', label: 'Contratti', icon: <FaFileContract size={14} />, count: contracts.length },
              { id: 'invoices', label: 'Fatture', icon: <FaFileInvoice size={14} />, count: invoices.length },
              { id: 'activities', label: 'Attivita', icon: <FaHistory size={14} />, count: activities.length },
              { id: 'conversations', label: 'Conversazioni', icon: <FaEnvelope size={14} /> },
              { id: 'info', label: 'Informazioni', icon: <FaBuilding size={14} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab.id ? '#1A1A1A' : 'transparent',
                  color: activeTab === tab.id ? '#FFFFFF' : '#6B7280',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    background: activeTab === tab.id ? '#FFFFFF' : '#E5E7EB',
                    color: activeTab === tab.id ? '#1A1A1A' : '#6B7280',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="sd-tab-content">
            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaHistory style={{ color: '#4F46E5' }} /> Timeline Completa</h3>
                </div>
                <UnifiedTimeline
                  activities={activities}
                  invoices={invoices}
                  contracts={contracts}
                  subscriptionEvents={subscriptionEvents}
                  emails={timelineEmails}
                  whatsappMessages={whatsappMessages}
                />
              </div>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaCrown style={{ color: '#F59E0B' }} /> Abbonamento</h3>
                  {contracts.filter(c => c.status === 'active').length > 0 && (
                    <button
                      className="tp-btn tp-btn-outline"
                      onClick={() => setActiveTab('contracts')}
                    >
                      <FaFileContract /> Gestisci Contratti
                    </button>
                  )}
                </div>

                {/* Check if there's an active contract */}
                {contracts.filter(c => c.status === 'active').length === 0 ? (
                  /* No active contract - show simple message */
                  <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: '#FEF3C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px'
                    }}>
                      <FaCrown size={36} color="#D97706" />
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1A1A1A' }}>Nessun piano attivo</h4>
                    <p style={{ margin: '0 0 24px 0', fontSize: '14px', maxWidth: '400px' }}>
                      Questo club non ha un contratto attivo. Crea un nuovo contratto per attivare un piano.
                    </p>
                    <button
                      className="tp-btn tp-btn-primary"
                      onClick={() => window.location.href = `/admin/contratti/new?club_id=${clubId}`}
                    >
                      <FaPlus /> Crea Contratto
                    </button>
                  </div>
                ) : (
                  /* Has active contract - show details */
                  <>
                    {(() => {
                      const activeContract = contracts.find(c => c.status === 'active');
                      const planConfig = CONTRACT_PLAN_CONFIG[activeContract?.plan_type] || CONTRACT_PLAN_CONFIG.basic;
                      const annualValue = activeContract?.total_value_with_vat || activeContract?.total_value || 0;
                      const monthlyValue = Math.round(annualValue / 12);

                      return (
                        <>
                          {/* Summary Cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: '#ECFDF5', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
                                €{monthlyValue.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '13px', color: '#065F46' }}>MRR</div>
                            </div>
                            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6' }}>
                                €{annualValue.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '13px', color: '#1E40AF' }}>Valore Annuo (IVA incl.)</div>
                            </div>
                            <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: 700, color: '#D97706' }}>
                                {formatDate(activeContract?.end_date)}
                              </div>
                              <div style={{ fontSize: '13px', color: '#92400E' }}>Scadenza</div>
                            </div>
                            <div style={{ background: planConfig.bg, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: 700, color: planConfig.color }}>
                                {planConfig.name}
                              </div>
                              <div style={{ fontSize: '13px', color: '#6B7280' }}>Piano</div>
                            </div>
                          </div>

                          {/* Contract Card */}
                          <div style={{
                            background: '#FAFAFA',
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            overflow: 'hidden'
                          }}>
                            {/* Contract Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '20px 24px',
                              borderBottom: '1px solid #E5E7EB',
                              background: 'white'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '12px',
                                  background: 'linear-gradient(135deg, #85FF00 0%, #65D000 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <FaCrown size={22} color="#1A1A1A" />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 700, color: '#1A1A1A', fontSize: '18px' }}>
                                      Piano {planConfig.name}
                                    </span>
                                    <span style={{
                                      padding: '4px 10px',
                                      borderRadius: '12px',
                                      background: '#ECFDF5',
                                      color: '#059669',
                                      fontSize: '12px',
                                      fontWeight: 600
                                    }}>
                                      Attivo
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                                    {formatDate(activeContract?.start_date)} → {formatDate(activeContract?.end_date)}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669' }}>
                                  €{monthlyValue.toLocaleString()}
                                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>/mese</span>
                                </div>
                              </div>
                            </div>

                            {/* Contract Details */}
                            <div style={{ padding: '24px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prezzo Piano</div>
                                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                    €{(activeContract?.plan_price || 0).toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add-ons</div>
                                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                    {activeContract?.addons?.length > 0 ? `${activeContract.addons.length} inclusi` : 'Nessuno'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fatturazione</div>
                                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                    {activeContract?.payment_terms === 'annual' ? 'Annuale' :
                                     activeContract?.payment_terms === 'semi_annual' ? 'Semestrale' :
                                     activeContract?.payment_terms === 'quarterly' ? 'Trimestrale' :
                                     activeContract?.payment_terms === 'monthly' ? 'Mensile' : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Firmato</div>
                                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                    {activeContract?.signed_by || 'Non firmato'}
                                  </div>
                                </div>
                              </div>

                              {/* Add-ons list if present */}
                              {activeContract?.addons?.length > 0 && (
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add-ons inclusi</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {activeContract.addons.map((addon, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          padding: '6px 12px',
                                          borderRadius: '8px',
                                          background: '#EFF6FF',
                                          color: '#3B82F6',
                                          fontSize: '13px',
                                          fontWeight: 500
                                        }}
                                      >
                                        {addon.name} (€{(addon.price || 0).toLocaleString()})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* PDF Document if present */}
                              {activeContract?.contract_document_url && (
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Documento</div>
                                  <a
                                    href={getImageUrl(activeContract.contract_document_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '10px 16px',
                                      background: '#FEF2F2',
                                      border: '1px solid #FECACA',
                                      borderRadius: '8px',
                                      color: '#DC2626',
                                      textDecoration: 'none',
                                      fontSize: '14px',
                                      fontWeight: 500
                                    }}
                                  >
                                    <FaFilePdf size={16} />
                                    Visualizza PDF
                                    <FaExternalLinkAlt size={12} />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* CONTRACTS TAB */}
            {activeTab === 'contracts' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaFileContract /> Contratti</h3>
                  <button
                    className="tp-btn tp-btn-primary"
                    onClick={() => window.location.href = `/admin/contratti?club_id=${clubId}`}
                  >
                    <FaPlus /> Nuovo Contratto
                  </button>
                </div>

                {contracts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FaInbox size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 8px 0' }}>Nessun contratto</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Non ci sono contratti associati a questo club</p>
                    <button
                      className="tp-btn tp-btn-outline"
                      onClick={() => window.location.href = `/admin/contratti?club_id=${clubId}`}
                    >
                      <FaPlus /> Crea Contratto
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ background: '#ECFDF5', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
                          €{contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.total_value_with_vat || c.total_value || 0), 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '13px', color: '#065F46' }}>Valore Attivo</div>
                      </div>
                      <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6' }}>
                          {contracts.filter(c => c.status === 'active').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#1E40AF' }}>Contratti Attivi</div>
                      </div>
                      <div style={{ background: '#F3F4F6', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#374151' }}>
                          {contracts.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>Totale Contratti</div>
                      </div>
                    </div>

                    {/* Contracts List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {contracts.map((contract) => {
                        const planConfig = CONTRACT_PLAN_CONFIG[contract.plan_type] || CONTRACT_PLAN_CONFIG.basic;
                        const statusConfig = CONTRACT_STATUS_CONFIG[contract.status] || CONTRACT_STATUS_CONFIG.draft;
                        return (
                          <div
                            key={contract.id}
                            style={{
                              background: '#FAFAFA',
                              borderRadius: '12px',
                              border: '1px solid #E5E7EB',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Contract Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '16px 20px',
                              borderBottom: '1px solid #E5E7EB',
                              background: 'white'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  background: planConfig.bg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: planConfig.color
                                }}>
                                  <FaFileContract size={18} />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 600, color: '#1A1A1A', fontSize: '16px' }}>
                                      Piano {planConfig.name}
                                    </span>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      background: statusConfig.bg,
                                      color: statusConfig.color,
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}>
                                      {statusConfig.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                                    {formatDate(contract.start_date)} → {formatDate(contract.end_date)}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>
                                  €{(contract.total_value_with_vat || contract.total_value || 0).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6B7280' }}>/anno (IVA incl.)</div>
                              </div>
                            </div>

                            {/* Contract Details */}
                            <div style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Prezzo Piano</div>
                                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                                    €{(contract.plan_price || 0).toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Add-ons</div>
                                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                                    {contract.addons?.length > 0 ? `${contract.addons.length} inclusi` : 'Nessuno'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Pagamento</div>
                                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                                    {contract.payment_terms === 'annual' ? 'Annuale' :
                                     contract.payment_terms === 'semi_annual' ? 'Semestrale' :
                                     contract.payment_terms === 'quarterly' ? 'Trimestrale' :
                                     contract.payment_terms === 'monthly' ? 'Mensile' : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Firmato</div>
                                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                                    {contract.signed_by ? `${contract.signed_by}` : 'Non firmato'}
                                  </div>
                                </div>
                              </div>

                              {/* Add-ons list if present */}
                              {contract.addons?.length > 0 && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>Add-ons inclusi:</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {contract.addons.map((addon, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          padding: '4px 10px',
                                          borderRadius: '6px',
                                          background: '#EFF6FF',
                                          color: '#3B82F6',
                                          fontSize: '12px',
                                          fontWeight: 500
                                        }}
                                      >
                                        {addon.name} (€{(addon.price || 0).toLocaleString()})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Notes if present */}
                              {contract.notes && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Note:</div>
                                  <div style={{ fontSize: '14px', color: '#4B5563' }}>{contract.notes}</div>
                                </div>
                              )}

                              {/* PDF Document if present */}
                              {contract.contract_document_url && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>Documento Contratto:</div>
                                  <a
                                    href={getImageUrl(contract.contract_document_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '10px 16px',
                                      background: '#FEF2F2',
                                      border: '1px solid #FECACA',
                                      borderRadius: '8px',
                                      color: '#DC2626',
                                      textDecoration: 'none',
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                                  >
                                    <FaFilePdf size={16} />
                                    Visualizza PDF
                                    <FaExternalLinkAlt size={12} />
                                  </a>
                                </div>
                              )}

                              {/* Actions */}
                              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  className="tp-btn tp-btn-outline"
                                  onClick={() => window.location.href = `/admin/contratti`}
                                  style={{ padding: '8px 16px', fontSize: '13px' }}
                                >
                                  <FaEye style={{ marginRight: '6px' }} /> Gestisci Contratti
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaFileInvoice /> Fatture</h3>
                  <button className="tp-btn tp-btn-primary" onClick={() => setShowInvoiceModal(true)}>
                    <FaPlus /> Nuova Fattura
                  </button>
                </div>

                {invoiceSummary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#ECFDF5', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>€{invoiceSummary.total_paid?.toLocaleString() || 0}</div>
                      <div style={{ fontSize: '13px', color: '#065F46' }}>Totale Pagato</div>
                    </div>
                    <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#D97706' }}>€{invoiceSummary.total_pending?.toLocaleString() || 0}</div>
                      <div style={{ fontSize: '13px', color: '#92400E' }}>Da Incassare</div>
                    </div>
                    <div style={{ background: '#F3F4F6', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#374151' }}>{invoiceSummary.total_invoices || 0}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>Fatture Totali</div>
                    </div>
                  </div>
                )}

                {invoices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                    <FaInbox size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 8px 0' }}>Nessuna fattura</h4>
                    <button className="tp-btn tp-btn-outline" onClick={() => setShowInvoiceModal(true)}>
                      <FaPlus /> Crea Fattura
                    </button>
                  </div>
                ) : (
                  <div className="tp-table-container">
                    <table className="tp-table">
                      <thead>
                        <tr>
                          <th># Fattura</th>
                          <th>Data</th>
                          <th>Importo</th>
                          <th>Stato</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(invoice => {
                          const statusInfo = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.draft;
                          return (
                            <tr key={invoice.id}>
                              <td><span style={{ fontWeight: 600 }}>{invoice.invoice_number}</span></td>
                              <td>{formatDate(invoice.issue_date)}</td>
                              <td><span style={{ fontWeight: 600, color: '#059669' }}>€{(invoice.total_amount || invoice.total)?.toLocaleString()}</span></td>
                              <td>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  background: statusInfo.bg,
                                  color: statusInfo.color,
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}>
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {invoice.pdf_url && (
                                    <button className="tp-btn-icon tp-btn-icon-view" onClick={() => window.open(invoice.pdf_url, '_blank')} title="Scarica PDF">
                                      <FaDownload />
                                    </button>
                                  )}
                                  {invoice.status !== 'paid' && (
                                    <button className="tp-btn-icon" onClick={() => handleMarkInvoicePaid(invoice.id)} title="Segna come pagata" style={{ color: '#059669' }}>
                                      <FaCheck />
                                    </button>
                                  )}
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
            )}

            {/* ACTIVITIES TAB */}
            {activeTab === 'activities' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaHistory /> Storico Attivita</h3>
                  <button className="tp-btn tp-btn-primary" onClick={() => setShowActivityModal(true)}>
                    <FaPlus /> Nuova Attivita
                  </button>
                </div>

                {activities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                    <FaInbox size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 8px 0' }}>Nessuna attivita registrata</h4>
                    <button className="tp-btn tp-btn-outline" onClick={() => setShowActivityModal(true)}>
                      <FaPlus /> Registra Attivita
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {activities.map((activity, idx) => {
                      const typeConfig = ACTIVITY_TYPES[activity.tipo] || ACTIVITY_TYPES.altro;
                      const esitoConfig = activity.esito ? ESITO_OPTIONS[activity.esito] : null;
                      return (
                        <div key={activity.id || idx} style={{
                          display: 'flex',
                          gap: '16px',
                          padding: '16px',
                          background: '#FAFAFA',
                          borderRadius: '12px',
                          border: '1px solid #F0F0F0'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: typeConfig.color + '20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: typeConfig.color,
                            flexShrink: 0
                          }}>
                            {typeConfig.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{typeConfig.label}</span>
                              {esitoConfig && (
                                <span style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: esitoConfig.bgColor,
                                  color: esitoConfig.color,
                                  fontWeight: 500
                                }}>
                                  {esitoConfig.label}
                                </span>
                              )}
                              <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: 'auto' }}>
                                {formatDateTime(activity.data_schedulata || activity.created_at)}
                              </span>
                            </div>
                            {activity.descrizione && (
                              <p style={{ margin: 0, fontSize: '14px', color: '#4B5563', lineHeight: 1.5 }}>{activity.descrizione}</p>
                            )}
                            {activity.created_by && (
                              <div style={{ marginTop: '8px', fontSize: '12px', color: '#9CA3AF' }}>
                                Registrato da: {activity.created_by}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CONVERSATIONS TAB */}
            {activeTab === 'conversations' && (
              <div className="sd-tab-grid">
                <ConversationTab
                  contactEmail={club.email}
                  contactName={club.nome}
                  contactPhone={club.telefono}
                  whatsappMessages={whatsappMessages}
                  whatsappConnected={whatsappConnected}
                  onRefreshWhatsApp={fetchWhatsApp}
                />
              </div>
            )}

            {/* INFO TAB */}
            {activeTab === 'info' && (
              <div className="sd-tab-grid">
                <div className="sd-detail-section">
                  <div className="sd-tab-header">
                    <h3 className="sd-tab-title"><FaBuilding /> Informazioni Club</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Nome</span>
                      <span className="sd-info-value">{club.nome}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Tipologia</span>
                      <span className="sd-info-value">{club.tipologia || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Email</span>
                      <span className="sd-info-value">{club.email || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Telefono</span>
                      <span className="sd-info-value">{club.telefono || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">P.IVA</span>
                      <span className="sd-info-value">{club.partita_iva || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Codice Fiscale</span>
                      <span className="sd-info-value">{club.codice_fiscale || '-'}</span>
                    </div>
                    <div className="sd-info-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="sd-info-label">Sede Legale</span>
                      <span className="sd-info-value">{club.indirizzo_sede_legale || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="sd-detail-section">
                  <div className="sd-tab-header">
                    <h3 className="sd-tab-title"><FaUserTie /> Referente</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Nome</span>
                      <span className="sd-info-value">
                        {club.referente_nome ? `${club.referente_nome} ${club.referente_cognome || ''}` : '-'}
                      </span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Ruolo</span>
                      <span className="sd-info-value">{club.referente_ruolo || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Contatto</span>
                      <span className="sd-info-value">{club.referente_contatto || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="sd-detail-section">
                  <div className="sd-tab-header">
                    <h3 className="sd-tab-title"><FaCalendarAlt /> Date</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Creato il</span>
                      <span className="sd-info-value">{formatDate(club.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Modal */}
      {showActivityModal && (
        <Modal isOpen={showActivityModal} onClose={() => setShowActivityModal(false)} title="Nuova Attivita">
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Tipo Attivita</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivityForm({ ...activityForm, tipo: key })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: activityForm.tipo === key ? '2px solid #85FF00' : '1px solid #E5E7EB',
                      background: activityForm.tipo === key ? 'rgba(133, 255, 0, 0.1)' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ color: activityForm.tipo === key ? config.color : '#6B7280' }}>{config.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 500 }}>{config.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Data Attivita</label>
              <input
                type="datetime-local"
                value={activityForm.data_schedulata}
                onChange={(e) => setActivityForm({ ...activityForm, data_schedulata: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Descrizione</label>
              <textarea
                value={activityForm.descrizione}
                onChange={(e) => setActivityForm({ ...activityForm, descrizione: e.target.value })}
                placeholder="Descrivi..."
                style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Esito</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.entries(ESITO_OPTIONS).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivityForm({ ...activityForm, esito: key })}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: activityForm.esito === key ? `2px solid ${config.color}` : '1px solid #E5E7EB',
                      background: activityForm.esito === key ? config.bgColor : 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: activityForm.esito === key ? config.color : '#6B7280'
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="tp-btn tp-btn-outline" onClick={() => setShowActivityModal(false)}>Annulla</button>
              <button className="tp-btn tp-btn-primary" onClick={handleCreateActivity}>Salva</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Nuova Fattura">
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Importo (Imponibile)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}>€</span>
                <input
                  type="number"
                  value={invoiceForm.subtotal}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })}
                  placeholder="99.00"
                  style={{ width: '100%', padding: '12px 12px 12px 32px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>IVA %</label>
              <input
                type="number"
                value={invoiceForm.tax_rate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            {invoiceForm.subtotal && (
              <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6B7280' }}>Imponibile:</span>
                  <span>€{parseFloat(invoiceForm.subtotal).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6B7280' }}>IVA ({invoiceForm.tax_rate}%):</span>
                  <span>€{(parseFloat(invoiceForm.subtotal) * invoiceForm.tax_rate / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid #E5E7EB', paddingTop: '8px' }}>
                  <span>Totale:</span>
                  <span style={{ color: '#059669' }}>€{(parseFloat(invoiceForm.subtotal) * (1 + invoiceForm.tax_rate / 100)).toFixed(2)}</span>
                </div>
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Scadenza</label>
              <input
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Descrizione</label>
              <textarea
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                placeholder="Es: Abbonamento Pro - Marzo 2026"
                style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="tp-btn tp-btn-outline" onClick={() => setShowInvoiceModal(false)}>Annulla</button>
              <button className="tp-btn tp-btn-primary" onClick={handleCreateInvoice}>Crea Fattura</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusModal && (
        <Modal
          isOpen={showStatusModal}
          onClose={closeStatusModal}
          title={statusAction === 'suspend' ? 'Sospendi Club' : 'Riattiva Club'}
        >
          <div style={{ padding: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: statusAction === 'suspend' ? '#FEE2E2' : '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px'
            }}>
              {statusAction === 'suspend' ? <FaPause style={{ color: '#DC2626' }} /> : <FaPlay style={{ color: '#059669' }} />}
            </div>

            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#1A1A1A',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              {statusAction === 'suspend'
                ? `Vuoi sospendere l'account di ${club?.nome}?`
                : `Vuoi riattivare l'account di ${club?.nome}?`
              }
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: '20px'
            }}>
              {statusAction === 'suspend'
                ? 'Il club non potrà più accedere alla piattaforma fino alla riattivazione.'
                : 'Il club potrà nuovamente accedere alla piattaforma.'
              }
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '14px',
                color: '#374151'
              }}>
                Motivazione {statusAction === 'suspend' && <span style={{ color: '#DC2626' }}>*</span>}
              </label>
              <textarea
                value={statusMotivo}
                onChange={(e) => setStatusMotivo(e.target.value)}
                placeholder={statusAction === 'suspend'
                  ? 'Es: Mancato pagamento, violazione termini di servizio...'
                  : 'Es: Pagamento ricevuto, problema risolto...'
                }
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                La motivazione verrà registrata nello storico attività
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="tp-btn tp-btn-outline"
                onClick={closeStatusModal}
              >
                Annulla
              </button>
              <button
                className="tp-btn tp-btn-primary"
                onClick={handleToggleAccountStatus}
                disabled={statusAction === 'suspend' && !statusMotivo.trim()}
                style={{
                  background: statusAction === 'suspend' ? '#DC2626' : '#059669',
                  opacity: (statusAction === 'suspend' && !statusMotivo.trim()) ? 0.5 : 1
                }}
              >
                {statusAction === 'suspend' ? 'Sospendi Club' : 'Riattiva Club'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminClubDetail;
