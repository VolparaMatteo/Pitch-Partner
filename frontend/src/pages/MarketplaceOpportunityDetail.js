import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import DefaultLogo from '../static/logo/FavIcon.png';
import {
  FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaEye,
  FaPaperPlane, FaUsers, FaEuroSign, FaCheck, FaTimes, FaBullseye,
  FaGift, FaInfoCircle, FaCircle, FaGlobe, FaLock
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function MarketplaceOpportunityDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fromInvite = searchParams.get('from_invite');

  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [applicationData, setApplicationData] = useState({
    messaggio: '',
    proposta_budget: '',
    asset_offerti: {}
  });

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || (user.role !== 'sponsor' && user.role !== 'club')) {
      navigate('/');
      return;
    }
    fetchOpportunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (fromInvite && opportunity && !opportunity.has_applied) {
      setShowApplicationForm(true);
      setApplicationData(prev => ({
        ...prev,
        proposta_budget: opportunity.budget_richiesto ? opportunity.budget_richiesto.toString() : '',
        messaggio: `Grazie per l'invito! Sono interessato a partecipare a "${opportunity.titolo}".`
      }));
      setInviteInfo({
        message: 'Hai accettato l\'invito! Completa la candidatura qui sotto.',
        inviteId: fromInvite
      });
    }
  }, [fromInvite, opportunity]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'sponsor'
        ? `${API_URL}/sponsor/marketplace/discover/${id}`
        : `${API_URL}/club/marketplace/discover/${id}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpportunity(res.data.opportunity);
    } catch (error) {
      console.error('Errore caricamento opportunità:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (!applicationData.messaggio) {
      setToast({ message: 'Inserisci un messaggio di candidatura', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = user.role === 'sponsor'
        ? `${API_URL}/sponsor/marketplace/opportunities/${id}/apply`
        : `${API_URL}/club/marketplace/opportunities/${id}/apply`;

      await axios.post(endpoint, {
        messaggio: applicationData.messaggio,
        proposta_budget: applicationData.proposta_budget ? parseFloat(applicationData.proposta_budget) : null,
        asset_offerti: applicationData.asset_offerti
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToast({ message: 'Candidatura inviata con successo!', type: 'success' });
      setShowApplicationForm(false);
      fetchOpportunity();
    } catch (error) {
      console.error('Errore invio candidatura:', error);
      setToast({ message: error.response?.data?.error || 'Errore durante l\'invio della candidatura', type: 'error' });
    } finally {
      setSubmitting(false);
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
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(budget);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const basePath = user?.role === 'sponsor' ? '/sponsor' : '/club';

  if (loading) {
    return <div className="sd-page"><div className="sd-loading">Caricamento...</div></div>;
  }

  if (!opportunity) {
    return <div className="sd-page"><div className="sd-loading">Opportunità non trovata</div></div>;
  }

  const spotsRemaining = opportunity.spots_remaining ??
    (opportunity.numero_sponsor_cercati || 1) - (opportunity.collaborations_count || 0);

  const assetRichiesti = opportunity.asset_richiesti
    ? (Array.isArray(opportunity.asset_richiesti) ? opportunity.asset_richiesti : Object.entries(opportunity.asset_richiesti))
    : [];
  const assetForniti = opportunity.asset_forniti
    ? (Array.isArray(opportunity.asset_forniti) ? opportunity.asset_forniti : Object.entries(opportunity.asset_forniti))
    : [];

  const initials = (opportunity.creator_name || 'OP').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: <FaInfoCircle />, count: null },
    { id: 'assets', label: 'Asset', icon: <FaBullseye />, count: assetRichiesti.length + assetForniti.length }
  ];

  // Add application tab if user can apply
  if (!opportunity.has_applied && opportunity.can_apply) {
    tabs.push({ id: 'apply', label: 'Candidatura', icon: <FaPaperPlane />, count: null });
  }

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR - Opportunity Info Card */}
        <div className="sd-profile-card">
          {/* Header with dark background */}
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate(`${basePath}/marketplace`)}>
              <FaArrowLeft />
            </button>
          </div>

          {/* Avatar Section */}
          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar">
              {opportunity.creator_logo ? (
                <img
                  src={opportunity.creator_logo.startsWith('http') ? opportunity.creator_logo : `${API_URL.replace('/api', '')}${opportunity.creator_logo}`}
                  alt={opportunity.creator_name}
                  onError={(e) => { e.target.onerror = null; e.target.src = DefaultLogo; }}
                />
              ) : (
                <div className="sd-profile-avatar-placeholder">{initials}</div>
              )}
            </div>
            <h1 className="sd-profile-name">{opportunity.titolo}</h1>
            <p className="sd-profile-sector">{opportunity.creator_name}</p>
            <span className={`sd-profile-status ${opportunity.has_applied ? 'active' : 'inactive'}`}>
              <FaCircle /> {opportunity.has_applied ? 'Candidatura Inviata' : getTypeLabel(opportunity.tipo_opportunita)}
            </span>
          </div>

          {/* Profile Body */}
          <div className="sd-profile-body">
            {/* Opportunity Details */}
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

            {/* Info Section */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Informazioni</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Tipo</span>
                  <span className="sd-info-value">{getTypeLabel(opportunity.tipo_opportunita)}</span>
                </div>
                {opportunity.categoria && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Categoria</span>
                    <span className="sd-info-value" style={{ textTransform: 'capitalize' }}>{opportunity.categoria}</span>
                  </div>
                )}
                <div className="sd-info-item">
                  <span className="sd-info-label">Creato da</span>
                  <span className="sd-info-value">{opportunity.creator_type === 'club' ? 'Club' : 'Sponsor'}</span>
                </div>
                {opportunity.visibilita && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Visibilità</span>
                    <span className="sd-info-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {opportunity.visibilita === 'community' ? <><FaGlobe /> Community</> : <><FaLock /> Privata</>}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Deadline Warning */}
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
          {/* Invite Banner */}
          {inviteInfo && (
            <div style={{
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid #34D399'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
              }}>
                <FaCheck />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#065F46', marginBottom: '4px' }}>{inviteInfo.message}</div>
                <div style={{ fontSize: '13px', color: '#047857' }}>Il form di candidatura è già pre-compilato per te</div>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Budget</div>
              <div className="tp-stat-value">{formatBudget(opportunity.budget_richiesto)}</div>
              <div className="tp-stat-description">richiesto</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Visualizzazioni</div>
              <div className="tp-stat-value">{opportunity.views_count || 0}</div>
              <div className="tp-stat-description">totali</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Candidature</div>
              <div className="tp-stat-value">{opportunity.applications_count || 0}</div>
              <div className="tp-stat-description">ricevute</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Posti</div>
              <div className="tp-stat-value">{spotsRemaining}</div>
              <div className="tp-stat-description">disponibili</div>
            </div>
          </div>

          {/* Content Card with Tabs */}
          <div className="sd-content-card">
            {/* Tabs Navigation */}
            <div className="sd-tabs-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sd-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="sd-tab-icon">{tab.icon}</span>
                  {tab.label}
                  {tab.count !== null && <span className="sd-tab-count">{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="sd-tab-content">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaInfoCircle /> Descrizione Opportunità</h2>
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
                      {opportunity.descrizione}
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
                      <div style={{
                        background: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FaCalendarAlt style={{ color: '#6B7280' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>
                              Data Inizio
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                              {formatDate(opportunity.data_inizio)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {opportunity.data_fine && (
                      <div style={{
                        background: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FaCalendarAlt style={{ color: '#6B7280' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>
                              Data Fine
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                              {formatDate(opportunity.data_fine)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(opportunity.location || opportunity.location_city) && (
                      <div style={{
                        background: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FaMapMarkerAlt style={{ color: '#6B7280' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>
                              Location
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                              {opportunity.location || `${opportunity.location_city}${opportunity.location_province ? `, ${opportunity.location_province}` : ''}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaUsers style={{ color: '#6B7280' }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>
                            Partner Cercati
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                            {opportunity.numero_sponsor_cercati || 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {opportunity.has_applied && (
                    <div style={{
                      background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      border: '1px solid #34D399'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px'
                      }}>
                        <FaCheck />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#065F46' }}>
                          Candidatura Inviata
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                          Hai già inviato la tua candidatura per questa opportunità
                        </p>
                      </div>
                    </div>
                  )}

                  {!opportunity.can_apply && !opportunity.has_applied && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      border: '1px solid #F87171'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px'
                      }}>
                        <FaTimes />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#991B1B' }}>
                          Candidature Chiuse
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#B91C1C' }}>
                          Non è più possibile candidarsi a questa opportunità
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CTA for Apply */}
                  {!opportunity.has_applied && opportunity.can_apply && (
                    <div style={{
                      background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div>
                        <h3 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>
                          Interessato a questa opportunità?
                        </h3>
                        <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>
                          Invia la tua candidatura e inizia una nuova collaborazione
                        </p>
                      </div>
                      <button
                        className="sd-btn"
                        style={{ background: 'white', color: '#1A1A1A', fontWeight: 600 }}
                        onClick={() => setActiveTab('apply')}
                      >
                        <FaPaperPlane /> Invia Candidatura
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Assets Tab */}
              {activeTab === 'assets' && (
                <>
                  {/* Asset Richiesti */}
                  {assetRichiesti.length > 0 && (
                    <>
                      <div className="sd-tab-header">
                        <h2 className="sd-tab-title"><FaBullseye /> Asset Richiesti</h2>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '16px',
                        marginBottom: '32px'
                      }}>
                        {assetRichiesti.map((asset, index) => (
                          <div key={index} style={{
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            padding: '20px'
                          }}>
                            {typeof asset === 'object' && !Array.isArray(asset) ? (
                              <>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                  {asset.categoria || 'Asset'}
                                </h4>
                                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                                  {asset.descrizione || '-'}
                                </p>
                              </>
                            ) : Array.isArray(asset) ? (
                              <>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                  {asset[0]}
                                </h4>
                                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                                  {asset[1]}
                                </p>
                              </>
                            ) : (
                              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                {asset}
                              </h4>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Asset Forniti */}
                  {assetForniti.length > 0 && (
                    <>
                      <div className="sd-tab-header">
                        <h2 className="sd-tab-title" style={{ color: '#059669' }}><FaGift /> Asset Forniti</h2>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '16px'
                      }}>
                        {assetForniti.map((asset, index) => (
                          <div key={index} style={{
                            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                            border: '1px solid #86EFAC',
                            borderRadius: '12px',
                            padding: '20px'
                          }}>
                            {typeof asset === 'object' && !Array.isArray(asset) ? (
                              <>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#166534' }}>
                                  {asset.categoria || 'Asset'}
                                </h4>
                                <p style={{ margin: 0, fontSize: '14px', color: '#15803D' }}>
                                  {asset.descrizione || '-'}
                                </p>
                              </>
                            ) : Array.isArray(asset) ? (
                              <>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#166534' }}>
                                  {asset[0]}
                                </h4>
                                <p style={{ margin: 0, fontSize: '14px', color: '#15803D' }}>
                                  {asset[1]}
                                </p>
                              </>
                            ) : (
                              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#166534' }}>
                                {asset}
                              </h4>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Empty State */}
                  {assetRichiesti.length === 0 && assetForniti.length === 0 && (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaBullseye /></div>
                      <h3 className="sd-empty-title">Nessun asset specificato</h3>
                      <p className="sd-empty-desc">Questa opportunità non ha asset specifici definiti</p>
                    </div>
                  )}
                </>
              )}

              {/* Apply Tab */}
              {activeTab === 'apply' && !opportunity.has_applied && opportunity.can_apply && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaPaperPlane /> Invia Candidatura</h2>
                  </div>

                  <form onSubmit={handleApply}>
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid #E5E7EB',
                      marginBottom: '24px'
                    }}>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1A1A1A',
                          marginBottom: '8px'
                        }}>
                          Messaggio di Candidatura *
                        </label>
                        <textarea
                          value={applicationData.messaggio}
                          onChange={(e) => setApplicationData({ ...applicationData, messaggio: e.target.value })}
                          placeholder="Spiega perché sei interessato a questa opportunità..."
                          required
                          rows={6}
                          style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '10px',
                            border: '2px solid #E5E7EB',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s ease'
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#85FF00'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; }}
                        />
                      </div>

                      {opportunity.budget_richiesto && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#1A1A1A',
                            marginBottom: '8px'
                          }}>
                            Proposta Budget (€)
                          </label>
                          <input
                            type="number"
                            value={applicationData.proposta_budget}
                            onChange={(e) => setApplicationData({ ...applicationData, proposta_budget: e.target.value })}
                            placeholder={`Es. ${opportunity.budget_richiesto}`}
                            style={{
                              width: '100%',
                              padding: '14px',
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = '#85FF00'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; }}
                          />
                          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6B7280' }}>
                            Budget richiesto: {formatBudget(opportunity.budget_richiesto)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="sd-btn sd-btn-outline"
                        onClick={() => setActiveTab('overview')}
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="sd-btn sd-btn-primary"
                        style={{ background: '#85FF00', color: '#1A1A1A' }}
                        disabled={submitting}
                      >
                        {submitting ? 'Invio in corso...' : 'Invia Candidatura'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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

export default MarketplaceOpportunityDetail;
