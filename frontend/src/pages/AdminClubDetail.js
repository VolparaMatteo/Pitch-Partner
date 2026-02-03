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
  FaInbox, FaDownload, FaCopy, FaRedo, FaLink
} from 'react-icons/fa';
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
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('subscription');

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

      const [clubRes, subRes, invoicesRes, activitiesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/clubs/${clubId}`, { headers }),
        axios.get(`${API_URL}/admin/clubs/${clubId}/subscription`, { headers }).catch(() => ({ data: { subscription: null, events: [] } })),
        axios.get(`${API_URL}/admin/clubs/${clubId}/invoices`, { headers }).catch(() => ({ data: { invoices: [], summary: null } })),
        axios.get(`${API_URL}/admin/clubs/${clubId}/activities`, { headers }).catch(() => ({ data: { activities: [] } }))
      ]);

      setClub(clubRes.data);
      setSubscription(subRes.data.subscription);
      setSubscriptionEvents(subRes.data.events || []);
      setInvoices(invoicesRes.data.invoices || []);
      setInvoiceSummary(invoicesRes.data.summary);
      setActivities(activitiesRes.data.activities || []);
    } catch (error) {
      console.error('Errore caricamento club:', error);
      setToast({ message: 'Errore nel caricamento del club', type: 'error' });
    } finally {
      setLoading(false);
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
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Abbonamento</h3>
              <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FaCrown style={{ color: '#F59E0B' }} />
                  <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{club.nome_abbonamento || 'Nessun piano'}</span>
                </div>
                {club.costo_abbonamento && (
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
                    €{club.costo_abbonamento}<span style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>/mese</span>
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#6B7280' }}>Scade: {formatDate(club.data_scadenza_licenza)}</div>
              </div>
            </div>

            <div className="sd-profile-section">
              <h3 className="sd-section-title">Contatti</h3>
              <div className="sd-info-list">
                {club.email && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaEnvelope style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Email</span>
                    <span className="sd-info-value">
                      <a href={`mailto:${club.email}`} style={{ color: '#4338CA', textDecoration: 'none' }}>{club.email}</a>
                    </span>
                  </div>
                )}
                {club.telefono && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaPhone style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Telefono</span>
                    <span className="sd-info-value">
                      <a href={`tel:${club.telefono}`} style={{ color: '#4338CA', textDecoration: 'none' }}>{club.telefono}</a>
                    </span>
                  </div>
                )}
              </div>
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

            <div className="sd-profile-section">
              <h3 className="sd-section-title">Azioni Rapide</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="tp-btn tp-btn-outline" onClick={() => setShowInvoiceModal(true)} style={{ width: '100%', justifyContent: 'center' }}>
                  <FaFileInvoice /> Nuova Fattura
                </button>
                <button className="tp-btn tp-btn-outline" onClick={() => setShowActivityModal(true)} style={{ width: '100%', justifyContent: 'center' }}>
                  <FaHistory /> Registra Attivita
                </button>
                {club.account_attivo ? (
                  <button className="tp-btn tp-btn-outline" onClick={() => openStatusModal('suspend')} style={{ width: '100%', justifyContent: 'center', borderColor: '#F59E0B', color: '#F59E0B' }}>
                    <FaPause /> Sospendi Account
                  </button>
                ) : (
                  <button className="tp-btn tp-btn-primary" onClick={() => openStatusModal('activate')} style={{ width: '100%', justifyContent: 'center', background: '#059669' }}>
                    <FaPlay /> Riattiva Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="sd-content-card">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
            {[
              { id: 'subscription', label: 'Abbonamento', icon: <FaCrown size={14} /> },
              { id: 'invoices', label: 'Fatture', icon: <FaFileInvoice size={14} />, count: invoices.length },
              { id: 'activities', label: 'Attivita', icon: <FaHistory size={14} />, count: activities.length },
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
                  cursor: 'pointer'
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    background: activeTab === tab.id ? '#85FF00' : '#E5E7EB',
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
            {/* SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
              <div className="sd-tab-grid">
                <div className="sd-detail-section">
                  <div className="sd-tab-header">
                    <h3 className="sd-tab-title"><FaCrown /> Abbonamento Corrente</h3>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    color: 'white',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <span style={{
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {statusBadge.icon} {statusBadge.label}
                        </span>
                        <h2 style={{ margin: '12px 0 4px', fontSize: '28px', fontWeight: 700 }}>
                          {club.nome_abbonamento || 'Nessun piano attivo'}
                        </h2>
                        <p style={{ margin: 0, color: '#9CA3AF', fontSize: '14px' }}>
                          {club.tipologia_abbonamento || 'Fatturazione mensile'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: '#85FF00' }}>
                          €{club.costo_abbonamento || 0}
                        </div>
                        <div style={{ color: '#9CA3AF', fontSize: '14px' }}>/mese</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Inizio</div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatDate(subscription?.data_inizio || club.created_at)}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Scadenza</div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatDate(club.data_scadenza_licenza)}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Rinnovo</div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{subscription?.auto_renew ? 'Automatico' : 'Manuale'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sd-detail-section">
                  <div className="sd-tab-header">
                    <h3 className="sd-tab-title"><FaHistory /> Storico</h3>
                  </div>
                  {subscriptionEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                      <FaInbox size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p>Nessun evento registrato</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {subscriptionEvents.slice(0, 10).map((event, idx) => (
                        <div key={event.id || idx} style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px',
                          background: '#F9FAFB',
                          borderRadius: '8px'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#85FF00',
                            marginTop: '6px',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>{event.evento}</div>
                            {event.note && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>{event.note}</p>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{formatDate(event.created_at)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                              <td><span style={{ fontWeight: 600, color: '#059669' }}>€{invoice.total?.toLocaleString()}</span></td>
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
          title={statusAction === 'suspend' ? 'Sospendi Account' : 'Riattiva Account'}
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
                {statusAction === 'suspend' ? 'Sospendi Account' : 'Riattiva Account'}
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
