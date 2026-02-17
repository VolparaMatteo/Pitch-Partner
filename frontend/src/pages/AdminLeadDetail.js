import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaPen, FaTrashAlt, FaPlus, FaCheck,
  FaEuroSign, FaHistory, FaPhone, FaEnvelope, FaCalendarAlt,
  FaStickyNote, FaEllipsisH, FaStar, FaFileAlt,
  FaHandshake, FaTimes, FaExchangeAlt,
  FaGlobe, FaBuilding, FaUserTie,
  FaMapMarkerAlt, FaFutbol, FaRocket, FaInbox
} from 'react-icons/fa';
import ConversationTab from '../components/ConversationTab';
import UnifiedTimeline from '../components/UnifiedTimeline';
import { adminEmailAPI, adminWhatsAppAPI } from '../services/api';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const PIPELINE_STAGES = [
  { id: 'nuovo', label: 'Nuovo', icon: <FaStar />, color: '#6366F1' },
  { id: 'contattato', label: 'Contattato', icon: <FaPhone />, color: '#8B5CF6' },
  { id: 'demo', label: 'Demo', icon: <FaRocket />, color: '#F59E0B' },
  { id: 'proposta', label: 'Proposta', icon: <FaFileAlt />, color: '#3B82F6' },
  { id: 'negoziazione', label: 'Negoziazione', icon: <FaHandshake />, color: '#10B981' },
  { id: 'vinto', label: 'Vinto', icon: <FaCheck />, color: '#059669' },
  { id: 'perso', label: 'Perso', icon: <FaTimes />, color: '#EF4444' }
];

const FONTE_OPTIONS = [
  { value: 'sito_web', label: 'Sito Web' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'vamos_group', label: 'Vamos Group' },
  { value: 'altro', label: 'Altro' }
];

const ACTIVITY_TYPES = {
  chiamata: { icon: <FaPhone />, label: 'Chiamata', className: 'call' },
  meeting: { icon: <FaCalendarAlt />, label: 'Meeting', className: 'meeting' },
  email: { icon: <FaEnvelope />, label: 'Email', className: 'email' },
  nota: { icon: <FaStickyNote />, label: 'Nota', className: 'note' },
  demo: { icon: <FaRocket />, label: 'Demo', className: 'demo' },
  proposta: { icon: <FaFileAlt />, label: 'Proposta', className: 'proposal' },
  altro: { icon: <FaEllipsisH />, label: 'Altro', className: 'other' }
};

const ESITO_OPTIONS = {
  positivo: { label: 'Positivo', bgColor: '#D1FAE5', color: '#059669' },
  negativo: { label: 'Negativo', bgColor: '#FEE2E2', color: '#DC2626' },
  neutro: { label: 'Neutro', bgColor: '#F3F4F6', color: '#6B7280' },
  da_seguire: { label: 'Da seguire', bgColor: '#FEF3C7', color: '#D97706' }
};

function AdminLeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [timelineEmails, setTimelineEmails] = useState([]);
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  // Activity Modal
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    tipo: 'chiamata',
    descrizione: '',
    esito: '',
    data_schedulata: new Date().toISOString().slice(0, 16)
  });

  // Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Convert Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLead(res.data);
      setActivities(res.data.activities || []);

      // Fetch conversation emails for timeline (non-blocking)
      if (res.data?.contatto_email) {
        adminEmailAPI.getConversation(res.data.contatto_email).then(emailRes => {
          setTimelineEmails(emailRes.data?.messages || []);
        }).catch(() => {});
      }

      // Fetch WhatsApp messages (non-blocking)
      if (res.data?.contatto_telefono) {
        adminWhatsAppAPI.getStatus().then(statusRes => {
          setWhatsappConnected(statusRes.data.connected);
          if (statusRes.data.connected) {
            adminWhatsAppAPI.getMessagesByPhone(res.data.contatto_telefono).then(waRes => {
              setWhatsappMessages(waRes.data.messages || []);
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Errore caricamento lead:', error);
      setToast({ message: 'Errore nel caricamento del lead', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsApp = () => {
    if (lead?.contatto_telefono) {
      adminWhatsAppAPI.getMessagesByPhone(lead.contatto_telefono).then(waRes => {
        setWhatsappMessages(waRes.data.messages || []);
      }).catch(() => {});
    }
  };

  const handleCreateActivity = async () => {
    if (!activityForm.tipo) {
      setToast({ message: 'Seleziona un tipo di attività', type: 'error' });
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/leads/${leadId}/activity`,
        activityForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: 'Attività registrata!', type: 'success' });
      setShowActivityModal(false);
      setActivityForm({ tipo: 'chiamata', descrizione: '', esito: '', data_schedulata: new Date().toISOString().slice(0, 16) });
      fetchData();
    } catch (error) {
      console.error('Errore creazione attività:', error);
      setToast({ message: 'Errore nella creazione dell\'attività', type: 'error' });
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(
        `${API_URL}/admin/leads/${leadId}`,
        { stage: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: 'Stage aggiornato!', type: 'success' });
      setShowStatusModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore cambio stage:', error);
      setToast({ message: 'Errore nel cambio stage', type: 'error' });
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/leads/${leadId}/convert`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: 'Lead convertito in club con successo!', type: 'success' });
      setShowConvertModal(false);
      setTimeout(() => {
        navigate(`/admin/clubs/${res.data.club?.id || ''}`);
      }, 2000);
    } catch (error) {
      console.error('Errore conversione:', error);
      setToast({ message: error.response?.data?.error || 'Errore nella conversione', type: 'error' });
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    setShowConfirmModal(false);
    try {
      await axios.delete(`${API_URL}/admin/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Lead eliminato con successo!', type: 'success' });
      setTimeout(() => navigate('/admin/leads'), 1500);
    } catch (error) {
      console.error('Errore eliminazione lead:', error);
      setToast({ message: 'Errore durante l\'eliminazione del lead', type: 'error' });
    }
  };

  const formatDate = (dateStr) => {
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
          <p className="tp-loading-text">Caricamento lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="sd-page">
        <div className="tp-empty-state">
          <h3>Lead non trovato</h3>
          <button className="tp-btn tp-btn-primary" onClick={() => navigate('/admin/leads')}>
            Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  const currentStage = PIPELINE_STAGES.find(s => s.id === lead.stage) || PIPELINE_STAGES[0];
  const initials = lead.nome_club?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR - Profile Card */}
        <div className="sd-profile-card">
          {/* Header with dark background */}
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate('/admin/leads')}>
              <FaArrowLeft />
            </button>
            <div className="sd-header-actions">
              <button className="sd-header-btn edit" onClick={() => navigate(`/admin/leads/${leadId}/edit`)}>
                <FaPen />
              </button>
              <button className="sd-header-btn delete" onClick={() => setShowConfirmModal(true)} style={{ color: '#EF4444' }}>
                <FaTrashAlt />
              </button>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar">
              {lead.logo_url ? (
                <img
                  src={getImageUrl(lead.logo_url)}
                  alt={lead.nome_club}
                />
              ) : (
                <div className="sd-profile-avatar-placeholder">{initials || <FaBuilding />}</div>
              )}
            </div>
            <h1 className="sd-profile-name">{lead.nome_club}</h1>
            <p className="sd-profile-sector">{lead.tipologia_sport || 'Sport Club'}</p>
            <span
              className="sd-profile-status"
              style={{ background: currentStage.color + '20', color: currentStage.color }}
            >
              {currentStage.icon} {currentStage.label}
            </span>
          </div>

          {/* Profile Body */}
          <div className="sd-profile-body">
            {/* Pipeline Progress */}
            {lead.stage !== 'vinto' && lead.stage !== 'perso' && (
              <div className="sd-profile-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 className="sd-section-title" style={{ margin: 0 }}>Pipeline</h3>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    style={{
                      background: '#F3F4F6',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FaExchangeAlt /> Cambia
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {PIPELINE_STAGES.filter(s => s.id !== 'vinto' && s.id !== 'perso').map((stage, index) => {
                    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
                    const isActive = stage.id === lead.stage;
                    const isPast = index < currentIndex;

                    return (
                      <div
                        key={stage.id}
                        style={{
                          flex: 1,
                          height: '8px',
                          borderRadius: '4px',
                          background: isActive ? stage.color : isPast ? '#10B981' : '#E5E7EB',
                          transition: 'all 0.3s ease'
                        }}
                        title={stage.label}
                      />
                    );
                  })}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ fontWeight: 600, color: currentStage.color }}>{currentStage.label}</span>
                </div>
              </div>
            )}

            {/* Won/Lost Badge */}
            {(lead.stage === 'vinto' || lead.stage === 'perso') && (
              <div className="sd-profile-section">
                <div style={{
                  background: lead.stage === 'vinto' ? '#D1FAE5' : '#FEE2E2',
                  border: `1px solid ${lead.stage === 'vinto' ? '#10B981' : '#EF4444'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  {lead.stage === 'vinto' ? (
                    <FaCheck style={{ color: '#059669', fontSize: '24px', marginBottom: '8px' }} />
                  ) : (
                    <FaTimes style={{ color: '#DC2626', fontSize: '24px', marginBottom: '8px' }} />
                  )}
                  <h4 style={{ margin: '0 0 4px 0', color: lead.stage === 'vinto' ? '#065F46' : '#991B1B', fontSize: '14px' }}>
                    {lead.stage === 'vinto' ? 'Lead Vinto' : 'Lead Perso'}
                  </h4>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Contatti</h3>
              <div className="sd-info-list">
                {lead.contatto_email && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaEnvelope style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Email</span>
                    <span className="sd-info-value">
                      <a href={`mailto:${lead.contatto_email}`} style={{ color: '#4338CA', textDecoration: 'none' }}>{lead.contatto_email}</a>
                    </span>
                  </div>
                )}
                {lead.contatto_telefono && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaPhone style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Telefono</span>
                    <span className="sd-info-value">
                      <a href={`tel:${lead.contatto_telefono}`} style={{ color: '#4338CA', textDecoration: 'none' }}>{lead.contatto_telefono}</a>
                    </span>
                  </div>
                )}
                {lead.sito_web && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaGlobe style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Sito Web</span>
                    <span className="sd-info-value">
                      <a href={lead.sito_web.startsWith('http') ? lead.sito_web : `https://${lead.sito_web}`} target="_blank" rel="noopener noreferrer" style={{ color: '#4338CA', textDecoration: 'none' }}>
                        {lead.sito_web.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    </span>
                  </div>
                )}
                {lead.citta && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaMapMarkerAlt style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Località</span>
                    <span className="sd-info-value">{lead.citta}{lead.regione ? `, ${lead.regione}` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fonte */}
            {lead.fonte && (
              <div className="sd-profile-section">
                <h3 className="sd-section-title">Fonte</h3>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#EEF2FF',
                  color: '#6366F1',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  <FaStar size={12} />
                  {FONTE_OPTIONS.find(f => f.value === lead.fonte)?.label || lead.fonte}
                </span>
              </div>
            )}

            {/* Quick Actions */}
            {lead.stage !== 'vinto' && lead.stage !== 'perso' && (
              <div className="sd-profile-section">
                <h3 className="sd-section-title">Azioni Rapide</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="tp-btn tp-btn-primary"
                    onClick={() => setShowConvertModal(true)}
                    style={{ width: '100%', justifyContent: 'center', background: '#059669' }}
                  >
                    <FaCheck /> Converti in Club
                  </button>
                  <button
                    className="tp-btn tp-btn-outline"
                    onClick={() => handleStatusChange('perso')}
                    style={{ width: '100%', justifyContent: 'center', borderColor: '#EF4444', color: '#EF4444' }}
                  >
                    <FaTimes /> Segna come Perso
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="sd-content-card">
          {/* Tabs Navigation */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '16px 24px',
            borderBottom: '1px solid #E5E7EB',
            background: '#FAFAFA'
          }}>
            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'timeline' ? '#1A1A1A' : 'transparent',
                color: activeTab === 'timeline' ? '#FFFFFF' : '#6B7280',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FaHistory size={14} />
              Timeline
              <span style={{
                background: activeTab === 'timeline' ? '#85FF00' : '#E5E7EB',
                color: activeTab === 'timeline' ? '#1A1A1A' : '#6B7280',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {activities.length + timelineEmails.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'activities' ? '#1A1A1A' : 'transparent',
                color: activeTab === 'activities' ? '#FFFFFF' : '#6B7280',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FaHistory size={14} />
              Attività
              <span style={{
                background: activeTab === 'activities' ? '#85FF00' : '#E5E7EB',
                color: activeTab === 'activities' ? '#1A1A1A' : '#6B7280',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {activities.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'conversations' ? '#1A1A1A' : 'transparent',
                color: activeTab === 'conversations' ? '#FFFFFF' : '#6B7280',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FaEnvelope size={14} />
              Conversazioni
            </button>
            <button
              onClick={() => setActiveTab('info')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'info' ? '#1A1A1A' : 'transparent',
                color: activeTab === 'info' ? '#FFFFFF' : '#6B7280',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FaBuilding size={14} />
              Informazioni
            </button>
          </div>

          {/* Tab Content */}
          <div className="sd-tab-content">
            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaHistory style={{ color: '#4F46E5' }} /> Timeline Completa</h3>
                </div>
                <UnifiedTimeline
                  activities={activities}
                  emails={timelineEmails}
                  whatsappMessages={whatsappMessages}
                />
              </div>
            )}

            {/* INFO TAB */}
            {activeTab === 'info' && (
              <div className="sd-tab-grid">
                {/* Club Info Section */}
                <div className="sd-detail-section">
                  <div className="sd-tab-header">
                    <h3 className="sd-tab-title"><FaBuilding /> Informazioni Club</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Nome Club</span>
                      <span className="sd-info-value">{lead.nome_club}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Sport</span>
                      <span className="sd-info-value">{lead.tipologia_sport || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Città</span>
                      <span className="sd-info-value">{lead.citta || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Provincia</span>
                      <span className="sd-info-value">{lead.provincia || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Regione</span>
                      <span className="sd-info-value">{lead.regione || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Sito Web</span>
                      <span className="sd-info-value">
                        {lead.sito_web ? (
                          <a href={lead.sito_web.startsWith('http') ? lead.sito_web : `https://${lead.sito_web}`} target="_blank" rel="noopener noreferrer" style={{ color: '#4338CA' }}>
                            {lead.sito_web}
                          </a>
                        ) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Referente Principale Section */}
                <div className="sd-detail-section">
                  <div className="sd-tab-header">
                    <h3 className="sd-tab-title"><FaUserTie /> Referente Principale</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Nome</span>
                      <span className="sd-info-value">
                        {lead.contatto_nome ? `${lead.contatto_nome}${lead.contatto_cognome ? ` ${lead.contatto_cognome}` : ''}` : '-'}
                      </span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Ruolo</span>
                      <span className="sd-info-value">{lead.contatto_ruolo || '-'}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Email</span>
                      <span className="sd-info-value">
                        {lead.contatto_email ? (
                          <a href={`mailto:${lead.contatto_email}`} style={{ color: '#4338CA' }}>{lead.contatto_email}</a>
                        ) : '-'}
                      </span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Telefono</span>
                      <span className="sd-info-value">
                        {lead.contatto_telefono ? (
                          <a href={`tel:${lead.contatto_telefono}`} style={{ color: '#4338CA' }}>{lead.contatto_telefono}</a>
                        ) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="sd-detail-section">
                  <div className="sd-tab-header">
                    <h3 className="sd-tab-title"><FaCalendarAlt /> Date</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Creato il</span>
                      <span className="sd-info-value">{formatDate(lead.created_at)}</span>
                    </div>
                    <div className="sd-info-item">
                      <span className="sd-info-label">Ultimo aggiornamento</span>
                      <span className="sd-info-value">{formatDate(lead.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Note Section */}
                {lead.note && (
                  <div className="sd-detail-section">
                    <div className="sd-tab-header">
                      <h3 className="sd-tab-title"><FaStickyNote /> Note</h3>
                    </div>
                    <p style={{ margin: 0, color: '#4B5563', lineHeight: 1.6 }}>{lead.note}</p>
                  </div>
                )}
              </div>
            )}

            {/* ACTIVITIES TAB */}
            {activeTab === 'activities' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaHistory /> Storico Attività</h3>
                  <button
                    className="tp-btn tp-btn-primary"
                    onClick={() => setShowActivityModal(true)}
                  >
                    <FaPlus /> Nuova Attività
                  </button>
                </div>

                {activities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
                    <FaInbox size={48} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
                    <h4 style={{ margin: '0 0 8px 0', color: '#4B5563' }}>Nessuna attività registrata</h4>
                    <p style={{ margin: '0 0 16px 0' }}>Registra la prima attività per questo lead</p>
                    <button
                      className="tp-btn tp-btn-outline"
                      onClick={() => setShowActivityModal(true)}
                    >
                      <FaPlus /> Registra Attività
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
                            background: '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6B7280',
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
                                {formatDate(activity.data_schedulata || activity.created_at)}
                              </span>
                            </div>
                            {activity.descrizione && (
                              <p style={{ margin: 0, fontSize: '14px', color: '#4B5563', lineHeight: 1.5 }}>
                                {activity.descrizione}
                              </p>
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
                  contactEmail={lead.contatto_email}
                  contactName={lead.contatto_nome ? `${lead.contatto_nome} (${lead.nome_club || ''})` : lead.nome_club}
                  contactPhone={lead.contatto_telefono}
                  whatsappMessages={whatsappMessages}
                  whatsappConnected={whatsappConnected}
                  onRefreshWhatsApp={fetchWhatsApp}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Cambia Stage"
        >
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '16px', color: '#4B5563' }}>Seleziona il nuovo stage per questo lead:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PIPELINE_STAGES.filter(s => s.id !== lead.stage).map(stage => (
                <button
                  key={stage.id}
                  onClick={() => handleStatusChange(stage.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px', borderRadius: '8px',
                    border: '1px solid #E5E7EB', background: 'white',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = stage.color + '10'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <span style={{ color: stage.color }}>{stage.icon}</span>
                  <span style={{ fontWeight: 500 }}>{stage.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <Modal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          title="Nuova Attività"
        >
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Tipo Attività
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivityForm({ ...activityForm, tipo: key })}
                    style={{
                      padding: '10px', borderRadius: '8px',
                      border: activityForm.tipo === key ? '2px solid #85FF00' : '1px solid #E5E7EB',
                      background: activityForm.tipo === key ? 'rgba(133, 255, 0, 0.1)' : 'white',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: '4px'
                    }}
                  >
                    <span style={{ color: activityForm.tipo === key ? '#65A30D' : '#6B7280' }}>{config.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 500 }}>{config.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Data Attività
              </label>
              <input
                type="datetime-local"
                value={activityForm.data_schedulata}
                onChange={(e) => setActivityForm({ ...activityForm, data_schedulata: e.target.value })}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Descrizione
              </label>
              <textarea
                value={activityForm.descrizione}
                onChange={(e) => setActivityForm({ ...activityForm, descrizione: e.target.value })}
                placeholder="Descrivi l'attività..."
                style={{
                  width: '100%', minHeight: '100px', padding: '12px',
                  borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Esito
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.entries(ESITO_OPTIONS).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivityForm({ ...activityForm, esito: key })}
                    style={{
                      padding: '8px', borderRadius: '6px',
                      border: activityForm.esito === key ? `2px solid ${config.color}` : '1px solid #E5E7EB',
                      background: activityForm.esito === key ? config.bgColor : 'white',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                      color: activityForm.esito === key ? config.color : '#6B7280'
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="tp-btn tp-btn-outline" onClick={() => setShowActivityModal(false)}>
                Annulla
              </button>
              <button className="tp-btn tp-btn-primary" onClick={handleCreateActivity}>
                Salva Attività
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Convert Modal */}
      {showConvertModal && (
        <Modal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          title="Converti in Club"
        >
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '20px', color: '#4B5563' }}>
              Stai per convertire il lead <strong>{lead.nome_club}</strong> in un club attivo sulla piattaforma.
              Verrà creato un account club con i dati del lead.
            </p>
            <div style={{
              background: '#FEF3C7', borderRadius: '8px', padding: '12px',
              marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start'
            }}>
              <FaStar style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#92400E' }}>
                Il club riceverà le credenziali di accesso via email.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="tp-btn tp-btn-outline"
                onClick={() => setShowConvertModal(false)}
                disabled={converting}
              >
                Annulla
              </button>
              <button
                className="tp-btn tp-btn-primary"
                onClick={handleConvert}
                disabled={converting}
                style={{ background: '#059669' }}
              >
                {converting ? 'Conversione...' : 'Conferma Conversione'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Elimina Lead"
        >
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '20px', color: '#4B5563' }}>
              Sei sicuro di voler eliminare il lead <strong>{lead.nome_club}</strong>?
              Questa azione non può essere annullata.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="tp-btn tp-btn-outline" onClick={() => setShowConfirmModal(false)}>
                Annulla
              </button>
              <button
                className="tp-btn tp-btn-primary"
                onClick={handleDelete}
                style={{ background: '#DC2626' }}
              >
                Elimina
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default AdminLeadDetail;
