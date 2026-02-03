import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import InvitePartnerModal from '../components/InvitePartnerModal';
import Toast from '../components/Toast';
import DefaultLogo from '../static/logo/FavIcon.png';
import {
  FaArrowLeft, FaEye, FaPaperPlane, FaUsers, FaEuroSign,
  FaCheck, FaTimes, FaInfoCircle, FaCircle, FaHandshake,
  FaEnvelope, FaTrash, FaRocket, FaClock, FaCalendarAlt,
  FaMapMarkerAlt, FaBullseye, FaGift
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ClubManageOpportunity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [opportunity, setOpportunity] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const oppRes = await axios.get(`${API_URL}/club/marketplace/opportunities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpportunity(oppRes.data.opportunity);

      const appRes = await axios.get(`${API_URL}/club/marketplace/opportunities/${id}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(appRes.data.applications || []);

      const invRes = await axios.get(`${API_URL}/club/marketplace/opportunities/${id}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentInvites(invRes.data.invites || []);

    } catch (error) {
      console.error('Errore:', error);
      if (error.response?.status === 404) {
        setToast({ message: 'Opportunità non trovata', type: 'error' });
        setTimeout(() => navigate('/club/marketplace'), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (appId) => {
    try {
      await axios.post(`${API_URL}/club/marketplace/applications/${appId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Candidatura accettata!', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore durante l\'accettazione', type: 'error' });
    }
  };

  const handleRejectApplication = async (appId) => {
    try {
      await axios.post(`${API_URL}/club/marketplace/applications/${appId}/reject`, {
        motivo: rejectReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Candidatura rifiutata', type: 'success' });
      setShowRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore durante il rifiuto', type: 'error' });
    }
  };

  const handlePublish = async () => {
    try {
      await axios.put(`${API_URL}/club/marketplace/opportunities/${id}`, {
        stato: 'pubblicata'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Opportunità pubblicata!', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Errore durante la pubblicazione', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questa opportunità?')) return;

    try {
      await axios.delete(`${API_URL}/club/marketplace/opportunities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Opportunità eliminata', type: 'success' });
      setTimeout(() => navigate('/club/marketplace'), 1500);
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore durante l\'eliminazione', type: 'error' });
    }
  };

  const getTypeLabel = (tipo) => {
    const labels = {
      'evento_speciale': 'Evento Speciale',
      'campagna_promozionale': 'Campagna Promozionale',
      'progetto_csr': 'Progetto CSR',
      'co_branding': 'Co-Branding',
      'attivazione_speciale': 'Attivazione Speciale',
      'altro': 'Altro'
    };
    return labels[tipo] || tipo;
  };

  const formatBudget = (budget) => {
    if (!budget) return 'Da definire';
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="sd-page"><div className="sd-loading">Caricamento...</div></div>;
  }

  if (!opportunity) {
    return <div className="sd-page"><div className="sd-loading">Opportunità non trovata</div></div>;
  }

  const pendingApplications = applications.filter(a => a.stato === 'in_attesa');
  const acceptedApplications = applications.filter(a => a.stato === 'accettata');
  const initials = (opportunity.titolo || 'OP').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const assetRichiesti = opportunity.asset_richiesti
    ? (Array.isArray(opportunity.asset_richiesti) ? opportunity.asset_richiesti : Object.entries(opportunity.asset_richiesti))
    : [];
  const assetForniti = opportunity.asset_forniti
    ? (Array.isArray(opportunity.asset_forniti) ? opportunity.asset_forniti : Object.entries(opportunity.asset_forniti))
    : [];

  const tabs = [
    { id: 'details', label: 'Dettagli', icon: <FaInfoCircle />, count: null },
    { id: 'applications', label: 'Candidature', icon: <FaPaperPlane />, count: pendingApplications.length },
    { id: 'partners', label: 'Partner', icon: <FaHandshake />, count: acceptedApplications.length },
    { id: 'invites', label: 'Inviti', icon: <FaEnvelope />, count: sentInvites.length }
  ];

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR */}
        <div className="sd-profile-card">
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate('/club/marketplace')}>
              <FaArrowLeft />
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {opportunity.stato === 'bozza' && (
                <button
                  className="sd-header-btn"
                  onClick={handlePublish}
                  style={{ background: 'rgba(133, 255, 0, 0.2)', color: '#85FF00' }}
                  title="Pubblica"
                >
                  <FaRocket />
                </button>
              )}
              {opportunity.stato === 'pubblicata' && (
                <button
                  className="sd-header-btn"
                  onClick={() => setShowInviteModal(true)}
                  style={{ background: 'rgba(133, 255, 0, 0.2)', color: '#85FF00' }}
                  title="Invita Partner"
                >
                  <FaEnvelope />
                </button>
              )}
              <button
                className="sd-header-btn"
                onClick={handleDelete}
                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
                title="Elimina"
              >
                <FaTrash />
              </button>
            </div>
          </div>

          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar">
              {user?.logo_url ? (
                <img
                  src={getImageUrl(user.logo_url)}
                  alt={user.nome}
                  onError={(e) => { e.target.src = DefaultLogo; }}
                />
              ) : (
                <div className="sd-profile-avatar-placeholder">{initials}</div>
              )}
            </div>
            <h1 className="sd-profile-name">{opportunity.titolo}</h1>
            <p className="sd-profile-sector">{getTypeLabel(opportunity.tipo_opportunita)}</p>
            <span className={`sd-profile-status ${opportunity.stato === 'pubblicata' ? 'active' : 'inactive'}`}>
              <FaCircle /> {opportunity.stato === 'pubblicata' ? 'Pubblicata' : opportunity.stato === 'bozza' ? 'Bozza' : opportunity.stato}
            </span>
          </div>

          <div className="sd-profile-body">
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Dettagli Opportunità</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Budget</span>
                  <span className="sd-info-value" style={{ color: '#059669', fontWeight: 700 }}>
                    {formatBudget(opportunity.budget_richiesto)}
                  </span>
                </div>
                {opportunity.data_inizio && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Data Inizio</span>
                    <span className="sd-info-value">{formatDate(opportunity.data_inizio)}</span>
                  </div>
                )}
                {opportunity.data_fine && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Data Fine</span>
                    <span className="sd-info-value">{formatDate(opportunity.data_fine)}</span>
                  </div>
                )}
                {(opportunity.location || opportunity.location_city) && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Location</span>
                    <span className="sd-info-value">
                      {opportunity.location || `${opportunity.location_city}${opportunity.location_province ? `, ${opportunity.location_province}` : ''}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="sd-profile-section">
              <h3 className="sd-section-title">Informazioni</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Partner Cercati</span>
                  <span className="sd-info-value">{opportunity.numero_sponsor_cercati || 1}</span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Posti Disponibili</span>
                  <span className="sd-info-value">{opportunity.spots_remaining || 0}</span>
                </div>
                {opportunity.categoria && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Categoria</span>
                    <span className="sd-info-value" style={{ textTransform: 'capitalize' }}>{opportunity.categoria}</span>
                  </div>
                )}
              </div>
            </div>

            {opportunity.deadline_candidature && (
              <div className="sd-profile-section">
                <div style={{
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #F59E0B'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#92400E' }}>
                    <FaClock />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                        Scadenza Candidature
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700 }}>
                        {formatDate(opportunity.deadline_candidature)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="sd-main">
          {/* Stats Row */}
          <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Visualizzazioni</div>
              <div className="tp-stat-value">{opportunity.views_count || 0}</div>
              <div className="tp-stat-description">totali</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Candidature</div>
              <div className="tp-stat-value">{applications.length}</div>
              <div className="tp-stat-description">ricevute</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">In Attesa</div>
              <div className="tp-stat-value">{pendingApplications.length}</div>
              <div className="tp-stat-description">da valutare</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Accettate</div>
              <div className="tp-stat-value">{acceptedApplications.length}</div>
              <div className="tp-stat-description">partner attivi</div>
            </div>
          </div>

          {/* Content Card with Tabs */}
          <div className="sd-content-card">
            <div className="sd-tabs-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sd-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="sd-tab-icon">{tab.icon}</span>
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span className="sd-tab-count">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="sd-tab-content">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaInfoCircle /> Descrizione</h2>
                  </div>

                  <div style={{
                    background: '#F9FAFB',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '15px',
                      lineHeight: 1.8,
                      color: '#374151',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {opportunity.descrizione || 'Nessuna descrizione disponibile'}
                    </p>
                  </div>

                  {/* Quick Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    {opportunity.data_inizio && (
                      <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FaCalendarAlt style={{ color: '#6B7280' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Data Inizio</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{formatDate(opportunity.data_inizio)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {opportunity.data_fine && (
                      <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FaCalendarAlt style={{ color: '#6B7280' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Data Fine</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{formatDate(opportunity.data_fine)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(opportunity.location || opportunity.location_city) && (
                      <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FaMapMarkerAlt style={{ color: '#6B7280' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Location</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                              {opportunity.location || `${opportunity.location_city}${opportunity.location_province ? `, ${opportunity.location_province}` : ''}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaEuroSign style={{ color: '#6B7280' }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Budget</div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#059669' }}>{formatBudget(opportunity.budget_richiesto)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asset Richiesti */}
                  {assetRichiesti.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                        <FaBullseye /> Asset Richiesti
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {assetRichiesti.map((asset, i) => (
                          <span key={i} style={{ background: '#F3F4F6', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', color: '#1a1a1a' }}>
                            {typeof asset === 'object' ? `${asset.categoria}: ${asset.descrizione}` : Array.isArray(asset) ? `${asset[0]}: ${asset[1]}` : asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Asset Forniti */}
                  {assetForniti.length > 0 && (
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#059669' }}>
                        <FaGift /> Asset Forniti
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {assetForniti.map((asset, i) => (
                          <span key={i} style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', color: '#166534', border: '1px solid #86EFAC' }}>
                            {typeof asset === 'object' ? `${asset.categoria}: ${asset.descrizione}` : Array.isArray(asset) ? `${asset[0]}: ${asset[1]}` : asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Applications Tab */}
              {activeTab === 'applications' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaPaperPlane /> Candidature in Attesa</h2>
                  </div>

                  {pendingApplications.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaPaperPlane /></div>
                      <h3 className="sd-empty-title">Nessuna candidatura in attesa</h3>
                      <p className="sd-empty-desc">Le nuove candidature appariranno qui</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {pendingApplications.map(app => (
                        <div key={app.id} style={{
                          padding: '20px',
                          background: '#F9FAFB',
                          borderRadius: '16px',
                          border: '1px solid #E5E7EB'
                        }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{
                              width: '56px', height: '56px', borderRadius: '12px',
                              background: 'white', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                              border: '1px solid #E5E7EB'
                            }}>
                              <img
                                src={app.applicant_logo ? getImageUrl(app.applicant_logo) : DefaultLogo}
                                alt={app.applicant_name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={(e) => { e.target.src = DefaultLogo; }}
                              />
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>{app.applicant_name}</h3>
                                  <span style={{ fontSize: '12px', color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>{app.applicant_type}</span>
                                </div>
                                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{formatDate(app.created_at)}</span>
                              </div>

                              {app.messaggio_candidatura && (
                                <div style={{ background: 'white', padding: '14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #E5E7EB' }}>
                                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#374151' }}>{app.messaggio_candidatura}</p>
                                </div>
                              )}

                              {app.proposta_budget && (
                                <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', padding: '8px 16px', borderRadius: '8px', marginBottom: '14px' }}>
                                  <span style={{ fontSize: '13px', color: '#166534' }}>Budget proposto: <strong>{formatBudget(app.proposta_budget)}</strong></span>
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                  onClick={() => handleAcceptApplication(app.id)}
                                  className="sd-btn sd-btn-primary"
                                  style={{ background: '#1A1A1A', color: 'white' }}
                                >
                                  <FaCheck /> Accetta
                                </button>
                                <button
                                  onClick={() => setShowRejectModal(app.id)}
                                  className="sd-btn sd-btn-outline"
                                  style={{ borderColor: '#EF4444', color: '#EF4444' }}
                                >
                                  <FaTimes /> Rifiuta
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Partners Tab */}
              {activeTab === 'partners' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaHandshake /> Partner Attivi</h2>
                  </div>

                  {acceptedApplications.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaHandshake /></div>
                      <h3 className="sd-empty-title">Nessun partner attivo</h3>
                      <p className="sd-empty-desc">I partner accettati appariranno qui</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {acceptedApplications.map(app => (
                        <div key={app.id} style={{
                          padding: '20px',
                          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                          borderRadius: '14px',
                          border: '1px solid #86EFAC',
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            width: '56px', height: '56px', borderRadius: '12px',
                            background: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', overflow: 'hidden', flexShrink: 0
                          }}>
                            <img
                              src={app.applicant_logo ? getImageUrl(app.applicant_logo) : DefaultLogo}
                              alt={app.applicant_name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { e.target.src = DefaultLogo; }}
                            />
                          </div>

                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#166534' }}>{app.applicant_name}</h3>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#15803D' }}>
                              <span style={{ textTransform: 'capitalize' }}>{app.applicant_type}</span>
                              {app.proposta_budget && <span>• {formatBudget(app.proposta_budget)}</span>}
                              <span>• Accettata il {formatDate(app.reviewed_at || app.updated_at)}</span>
                            </div>
                          </div>

                          <span style={{
                            background: '#059669',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <FaCheck /> Partner
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Invites Tab */}
              {activeTab === 'invites' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaEnvelope /> Inviti Inviati</h2>
                    <button
                      className="sd-btn sd-btn-primary"
                      style={{ background: '#1A1A1A', color: 'white' }}
                      onClick={() => setShowInviteModal(true)}
                    >
                      <FaEnvelope /> Nuovo Invito
                    </button>
                  </div>

                  {sentInvites.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaEnvelope /></div>
                      <h3 className="sd-empty-title">Nessun invito inviato</h3>
                      <p className="sd-empty-desc">Invita partner specifici per aumentare le probabilità di match</p>
                      <button
                        className="sd-btn sd-btn-primary"
                        style={{ marginTop: '16px', background: '#1A1A1A', color: 'white' }}
                        onClick={() => setShowInviteModal(true)}
                      >
                        <FaEnvelope /> Invita Partner
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {sentInvites.map(invite => (
                        <div key={invite.id} style={{
                          padding: '18px',
                          background: '#F9FAFB',
                          borderRadius: '14px',
                          border: '1px solid #E5E7EB',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <div style={{
                              width: '48px', height: '48px', borderRadius: '50%',
                              background: 'white', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB'
                            }}>
                              {invite.recipient_logo ? (
                                <img
                                  src={invite.recipient_logo.startsWith('http') ? invite.recipient_logo : `${API_URL.replace('/api', '')}${invite.recipient_logo}`}
                                  alt={invite.recipient_name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <span style={{ fontSize: '20px' }}>{invite.recipient_type === 'club' ? '🏆' : '🏢'}</span>
                              )}
                            </div>

                            <div>
                              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#1A1A1A' }}>{invite.recipient_name}</div>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#6B7280' }}>
                                <span style={{
                                  background: invite.recipient_type === 'club' ? '#DBEAFE' : '#FEF3C7',
                                  color: invite.recipient_type === 'club' ? '#1E40AF' : '#92400E',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 500
                                }}>
                                  {invite.recipient_type === 'club' ? 'Club' : 'Sponsor'}
                                </span>
                                <span>{formatDate(invite.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          <span style={{
                            background: invite.stato === 'pending' ? '#FEF3C7' : invite.stato === 'accepted' ? '#DCFCE7' : '#FEE2E2',
                            color: invite.stato === 'pending' ? '#92400E' : invite.stato === 'accepted' ? '#166534' : '#991B1B',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {invite.stato === 'pending' && <><FaClock /> In attesa</>}
                            {invite.stato === 'accepted' && <><FaCheck /> Accettato</>}
                            {invite.stato === 'declined' && <><FaTimes /> Rifiutato</>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700 }}>Rifiuta Candidatura</h3>
            <p style={{ color: '#6B7280', marginBottom: '20px', fontSize: '14px' }}>Inserisci un motivo per il rifiuto (opzionale):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Es: Il profilo non corrisponde alle nostre esigenze..."
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: '2px solid #E5E7EB', minHeight: '120px', marginBottom: '20px',
                fontFamily: 'inherit', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="sd-btn sd-btn-outline"
              >
                Annulla
              </button>
              <button
                onClick={() => handleRejectApplication(showRejectModal)}
                className="sd-btn"
                style={{ background: '#EF4444', color: 'white' }}
              >
                Rifiuta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InvitePartnerModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        opportunityId={parseInt(id)}
        opportunityTitle={opportunity?.titolo}
        onInviteSent={() => { fetchData(); setToast({ message: 'Invito inviato con successo!', type: 'success' }); }}
      />

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

export default ClubManageOpportunity;
