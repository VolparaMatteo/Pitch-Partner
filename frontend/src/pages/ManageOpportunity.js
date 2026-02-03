import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import DefaultLogo from '../static/logo/FavIcon.png';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ManageOpportunity() {
  const { id } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || (user.role !== 'sponsor' && user.role !== 'club')) {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseEndpoint = user.role === 'sponsor' ? 'sponsor' : 'club';

      const [oppRes, appsRes] = await Promise.all([
        axios.get(`${API_URL}/${baseEndpoint}/marketplace/opportunities/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/${baseEndpoint}/marketplace/opportunities/${id}/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setOpportunity(oppRes.data.opportunity);
      setApplications(appsRes.data.applications || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (appId) => {
    if (!window.confirm('Confermi di accettare questa candidatura?')) return;

    try {
      const baseEndpoint = user.role === 'sponsor' ? 'sponsor' : 'club';
      await axios.post(`${API_URL}/${baseEndpoint}/marketplace/applications/${appId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Candidatura accettata!', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Errore:', error);
      setToast({ message: error.response?.data?.error || 'Errore durante l\'accettazione', type: 'error' });
    }
  };

  const handleRejectApplication = async (appId) => {
    const motivo = window.prompt('Motivo del rifiuto (opzionale):');
    if (motivo === null) return; // Cancelled

    try {
      const baseEndpoint = user.role === 'sponsor' ? 'sponsor' : 'club';
      await axios.post(`${API_URL}/${baseEndpoint}/marketplace/applications/${appId}/reject`, { motivo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Candidatura rifiutata', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Errore:', error);
      setToast({ message: 'Errore durante il rifiuto', type: 'error' });
    }
  };

  const getApplicationStatoBadge = (stato) => {
    const colors = {
      in_attesa: '#FFA500',
      accettata: '#4CAF50',
      rifiutata: '#F44336'
    };
    return colors[stato] || '#999';
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  if (!opportunity) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="empty-state">Opportunità non trovata</div>
        </div>
      </>
    );
  }

  const pendingApps = applications.filter(a => a.stato === 'in_attesa').length;
  const acceptedApps = applications.filter(a => a.stato === 'accettata').length;
  const rejectedApps = applications.filter(a => a.stato === 'rifiutata').length;

  return (
    <>
      <div className="dashboard-new-container">
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: toast.type === 'success' ? '#4CAF50' : '#F44336',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}>
            {toast.message}
          </div>
        )}

        {/* Back Button */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => navigate(user.role === 'sponsor' ? '/sponsor/marketplace' : '/club/marketplace')}
            className="btn-premium"
          >
            ← Indietro
          </button>
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Creator Logo */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: '#f8f8f8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid #E0E0E0',
              padding: '8px'
            }}>
              {opportunity.creator_logo ? (
                <img
                  src={opportunity.creator_logo.startsWith('http') ? opportunity.creator_logo : `${API_URL.replace('/api', '')}${opportunity.creator_logo}`}
                  alt={opportunity.creator_name || 'Logo'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DefaultLogo;
                  }}
                />
              ) : (
                <img
                  src={DefaultLogo}
                  alt="Default Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: 0.8
                  }}
                />
              )}
            </div>
            <div>
              <h1 className="welcome-title" style={{ margin: 0 }}>{opportunity.titolo}</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                Gestisci candidature e collaborazioni
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div className="stat-card-green">
            <div className="stat-card-content">
              <div className="stat-label">👁️ Visualizzazioni</div>
              <div className="stat-value">{opportunity.views_count || 0}</div>
            </div>
          </div>

          <div className="stat-card-dark">
            <div className="stat-card-content">
              <div className="stat-label">📨 Candidature Totali</div>
              <div className="stat-value-green">{applications.length}</div>
            </div>
          </div>

          <div className="stat-card-pink">
            <div className="stat-card-content">
              <div className="stat-label">⏳ In Attesa</div>
              <div className="stat-value-dark">{pendingApps}</div>
            </div>
          </div>

          <div style={{
            background: 'white',
            border: '2px solid #E0E0E0',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>
              {acceptedApps} / {rejectedApps}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#666' }}>
              ✅ Accettate / ❌ Rifiutate
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Applications List */}
          <div className="widget-white">
            <div className="widget-header">
              <h3>📋 Candidature Ricevute</h3>
              <div className="widget-subtitle">
                {applications.length} candidature totali
              </div>
            </div>

            {applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
                Nessuna candidatura ricevuta
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {applications.map(app => (
                  <div
                    key={app.id}
                    style={{
                      background: '#f8f8f8',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{
                            background: getApplicationStatoBadge(app.stato),
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}>
                            {app.stato.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 style={{ margin: '8px 0', fontSize: '18px', fontWeight: 600 }}>
                          {app.applicant_name || 'Candidato'}
                        </h4>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px', lineHeight: '1.6' }}>
                          {app.messaggio}
                        </p>
                        {app.proposta_budget && (
                          <div style={{ fontSize: '16px', fontWeight: 600, color: '#2196F3', marginBottom: '8px' }}>
                            💰 Budget proposto: €{app.proposta_budget.toLocaleString()}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          📅 {new Date(app.created_at).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>

                    {app.stato === 'in_attesa' && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button
                          onClick={() => handleAcceptApplication(app.id)}
                          className="btn-premium"
                          style={{ flex: 1 }}
                        >
                          ✅ Accetta
                        </button>
                        <button
                          onClick={() => handleRejectApplication(app.id)}
                          style={{
                            flex: 1,
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                        >
                          ❌ Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opportunity Details */}
          <div className="widget-white">
            <div className="widget-header">
              <h3>📄 Dettagli Opportunità</h3>
            </div>

            {/* Descrizione */}
            {opportunity.descrizione && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: 500 }}>
                  Descrizione
                </div>
                <p style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>
                  {opportunity.descrizione}
                </p>
              </div>
            )}

            {/* Info Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: 500 }}>
                  Stato
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', textTransform: 'capitalize' }}>
                  {opportunity.stato}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: 500 }}>
                  Tipo Opportunità
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', textTransform: 'capitalize' }}>
                  {opportunity.tipo_opportunita?.replace('_', ' ')}
                </div>
              </div>
              {opportunity.categoria && (
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: 500 }}>
                    Categoria
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', textTransform: 'capitalize' }}>
                    {opportunity.categoria}
                  </div>
                </div>
              )}
              {opportunity.budget_richiesto && (
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: 500 }}>
                    Budget Richiesto
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#2D8B00' }}>
                    €{opportunity.budget_richiesto.toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: 500 }}>
                  Posti Disponibili
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                  {opportunity.spots_remaining || 0}
                </div>
              </div>
              {opportunity.visibilita && (
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: 500 }}>
                    Visibilità
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', textTransform: 'capitalize' }}>
                    {opportunity.visibilita}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline & Location */}
            {(opportunity.data_inizio || opportunity.data_fine || opportunity.location || opportunity.deadline_candidature) && (
              <div style={{
                background: '#f8f8f8',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>📅 Timeline & Location</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {opportunity.data_inizio && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Data Inizio</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>
                        {new Date(opportunity.data_inizio).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  )}
                  {opportunity.data_fine && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Data Fine</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>
                        {new Date(opportunity.data_fine).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  )}
                  {opportunity.location && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Location</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>📍 {opportunity.location}</div>
                    </div>
                  )}
                  {opportunity.deadline_candidature && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#F57C00', marginBottom: '4px' }}>⏰ Scadenza Candidature</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#F57C00' }}>
                        {new Date(opportunity.deadline_candidature).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Asset Richiesti */}
            {opportunity.asset_richiesti && (Array.isArray(opportunity.asset_richiesti) ? opportunity.asset_richiesti.length > 0 : Object.keys(opportunity.asset_richiesti).length > 0) && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>🎯 Asset Richiesti</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px'
                }}>
                  {Array.isArray(opportunity.asset_richiesti) ? (
                    opportunity.asset_richiesti.map((asset, index) => (
                      <div key={index} style={{
                        background: '#f0f0f0',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1A1A1A'
                      }}>
                        {typeof asset === 'object' ? asset.categoria || asset.descrizione || 'Asset' : asset}
                      </div>
                    ))
                  ) : (
                    Object.entries(opportunity.asset_richiesti).map(([key, value]) => (
                      <div key={key} style={{
                        background: '#f0f0f0',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                          {key}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {value}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Asset Forniti */}
            {opportunity.asset_forniti && (Array.isArray(opportunity.asset_forniti) ? opportunity.asset_forniti.length > 0 : Object.keys(opportunity.asset_forniti).length > 0) && (
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>✨ Asset Forniti</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px'
                }}>
                  {Array.isArray(opportunity.asset_forniti) ? (
                    opportunity.asset_forniti.map((asset, index) => (
                      <div key={index} style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0369a1'
                      }}>
                        {typeof asset === 'object' ? asset.categoria || asset.descrizione || 'Asset' : asset}
                      </div>
                    ))
                  ) : (
                    Object.entries(opportunity.asset_forniti).map(([key, value]) => (
                      <div key={key} style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1', marginBottom: '4px' }}>
                          {key}
                        </div>
                        <div style={{ fontSize: '12px', color: '#0c4a6e' }}>
                          {value}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ManageOpportunity;
