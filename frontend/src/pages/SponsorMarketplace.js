import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SponsorMarketplace() {
  const [activeTab, setActiveTab] = useState('discover');
  const [opportunities, setOpportunities] = useState([]);
  const [myOpportunities, setMyOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtri
  const [filters, setFilters] = useState({
    tipo: '',
    categoria: '',
    location: '',
    search: ''
  });

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'discover') {
        await fetchDiscoverOpportunities();
      } else if (activeTab === 'my-opportunities') {
        await fetchMyOpportunities();
      } else if (activeTab === 'applications') {
        await fetchApplications();
      } else if (activeTab === 'collaborations') {
        await fetchCollaborations();
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoverOpportunities = async () => {
    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.location) params.append('location', filters.location);
    if (filters.search) params.append('search', filters.search);

    const res = await axios.get(`${API_URL}/sponsor/marketplace/discover?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOpportunities(res.data.opportunities || []);
  };

  const fetchMyOpportunities = async () => {
    const res = await axios.get(`${API_URL}/sponsor/marketplace/opportunities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMyOpportunities(res.data.opportunities || []);
  };

  const fetchApplications = async () => {
    const res = await axios.get(`${API_URL}/sponsor/marketplace/applications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setApplications(res.data.applications || []);
  };

  const fetchCollaborations = async () => {
    const res = await axios.get(`${API_URL}/sponsor/marketplace/collaborations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCollaborations(res.data.collaborations || []);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchDiscoverOpportunities();
  };

  const getTipoBadgeColor = (tipo) => {
    const colors = {
      evento_speciale: '#2196F3',
      campagna_promozionale: '#9C27B0',
      progetto_csr: '#4CAF50',
      co_branding: '#FF9800',
      attivazione_speciale: '#F44336',
      altro: '#607D8B'
    };
    return colors[tipo] || '#757575';
  };

  const getStatoBadgeColor = (stato) => {
    const colors = {
      bozza: '#FFC107',
      pubblicata: '#4CAF50',
      in_corso: '#2196F3',
      completata: '#757575',
      annullata: '#F44336'
    };
    return colors[stato] || '#757575';
  };

  const getApplicationStatoBadge = (stato) => {
    const colors = {
      in_attesa: '#FF9800',
      accettata: '#4CAF50',
      rifiutata: '#F44336',
      ritirata: '#757575'
    };
    return colors[stato] || '#757575';
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento marketplace...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>🎯 Mercato delle Opportunità</h1>
          {activeTab === 'my-opportunities' && (
            <button
              onClick={() => navigate('/sponsor/marketplace/create')}
              style={{
                padding: '12px 24px',
                background: '#85FF00',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Pubblica Opportunità
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #f0f0f0',
          marginBottom: '24px'
        }}>
          {[
            { key: 'discover', label: '🔍 Scopri', count: opportunities.length },
            { key: 'my-opportunities', label: '📝 Le Mie Opportunità', count: myOpportunities.length },
            { key: 'applications', label: '📨 Candidature', count: applications.length },
            { key: 'collaborations', label: '🤝 Collaborazioni', count: collaborations.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #85FF00' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.key ? '600' : '400',
                color: activeTab === tab.key ? '#000' : '#666',
                marginBottom: '-2px'
              }}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <>
            {/* Filtri */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Filtri</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <input
                  type="text"
                  placeholder="Cerca per titolo..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <select
                  value={filters.tipo}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Tutti i tipi</option>
                  <option value="evento_speciale">Evento Speciale</option>
                  <option value="campagna_promozionale">Campagna Promozionale</option>
                  <option value="progetto_csr">Progetto CSR</option>
                  <option value="co_branding">Co-Branding</option>
                  <option value="attivazione_speciale">Attivazione Speciale</option>
                  <option value="altro">Altro</option>
                </select>
                <select
                  value={filters.categoria}
                  onChange={(e) => handleFilterChange('categoria', e.target.value)}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Tutte le categorie</option>
                  <option value="sport">Sport</option>
                  <option value="sociale">Sociale</option>
                  <option value="business">Business</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="digital">Digital</option>
                </select>
                <input
                  type="text"
                  placeholder="Location..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={applyFilters}
                style={{
                  marginTop: '12px',
                  padding: '10px 24px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Applica Filtri
              </button>
            </div>

            {/* Opportunities Grid */}
            {opportunities.length === 0 ? (
              <div className="empty-state">Nessuna opportunità disponibile</div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {opportunities.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => navigate(`/sponsor/marketplace/opportunities/${opp.id}`)}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {/* Header */}
                    <div style={{
                      padding: '16px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          background: getTipoBadgeColor(opp.tipo_opportunita),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {opp.tipo_opportunita?.replace('_', ' ')}
                        </span>
                        {opp.has_applied && (
                          <span style={{
                            background: '#4CAF50',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}>
                            ✓ Candidato
                          </span>
                        )}
                        {opp.visibilita === 'private' && (
                          <span style={{
                            background: '#FFD700',
                            color: '#3D3D3D',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            ★ Esclusiva
                          </span>
                        )}
                      </div>
                      <h3 style={{
                        margin: '8px 0',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        {opp.titolo}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        by {opp.creator_name}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px' }}>
                      <p style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {opp.descrizione}
                      </p>

                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '12px'
                      }}>
                        {opp.location && (
                          <div>📍 {opp.location}</div>
                        )}
                        {opp.budget_richiesto && (
                          <div>💰 €{opp.budget_richiesto.toLocaleString()}</div>
                        )}
                        <div>👥 {opp.spots_remaining} posti disponibili</div>
                      </div>

                      {opp.deadline_candidature && (
                        <div style={{
                          fontSize: '12px',
                          color: '#F44336',
                          marginBottom: '8px'
                        }}>
                          ⏰ Scadenza: {new Date(opp.deadline_candidature).toLocaleDateString('it-IT')}
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '12px', color: '#999' }}>
                          👁️ {opp.views_count} views
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sponsor/marketplace/opportunities/${opp.id}`);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: opp.can_apply ? '#2196F3' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: opp.can_apply ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {opp.has_applied ? 'Vedi Candidatura' : 'Dettagli'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MY OPPORTUNITIES TAB */}
        {activeTab === 'my-opportunities' && (
          <div>
            {myOpportunities.length === 0 ? (
              <div className="empty-state">
                <p>Non hai ancora creato opportunità</p>
                <button
                  onClick={() => navigate('/sponsor/marketplace/create')}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: '#85FF00',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  + Pubblica la tua prima opportunità
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {myOpportunities.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => navigate(`/sponsor/marketplace/manage/${opp.id}`)}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                          <span style={{
                            background: getTipoBadgeColor(opp.tipo_opportunita),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {opp.tipo_opportunita?.replace('_', ' ')}
                          </span>
                          <span style={{
                            background: getStatoBadgeColor(opp.stato),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            textTransform: 'capitalize'
                          }}>
                            {opp.stato}
                          </span>
                        </div>
                        <h3 style={{ margin: '8px 0', fontSize: '18px' }}>{opp.titolo}</h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                          {opp.descrizione?.substring(0, 150)}...
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666' }}>
                          <div>👁️ {opp.views_count} views</div>
                          <div>📨 {opp.applications_count} candidature</div>
                          <div>👥 {opp.spots_remaining} posti rimanenti</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                          Creata il {new Date(opp.created_at).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div>
            {applications.length === 0 ? (
              <div className="empty-state">Nessuna candidatura inviata</div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {applications.map(app => (
                  <div
                    key={app.id}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{
                            background: getApplicationStatoBadge(app.stato),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            textTransform: 'capitalize'
                          }}>
                            {app.stato.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 style={{ margin: '8px 0', fontSize: '18px' }}>
                          {app.opportunity?.titolo}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                          {app.messaggio_candidatura}
                        </p>
                        {app.proposta_budget && (
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#2196F3' }}>
                            Budget proposto: €{app.proposta_budget.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(app.created_at).toLocaleDateString('it-IT')}
                        </div>
                        {app.stato === 'in_attesa' && (
                          <button
                            onClick={() => navigate(`/sponsor/marketplace/applications/${app.id}/edit`)}
                            style={{
                              marginTop: '8px',
                              padding: '8px 16px',
                              background: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            Modifica
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COLLABORATIONS TAB */}
        {activeTab === 'collaborations' && (
          <div>
            {collaborations.length === 0 ? (
              <div className="empty-state">Nessuna collaborazione attiva</div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {collaborations.map(collab => (
                  <div
                    key={collab.id}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{
                            background: collab.stato === 'attiva' ? '#4CAF50' : '#757575',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            textTransform: 'capitalize'
                          }}>
                            {collab.stato}
                          </span>
                        </div>
                        <h3 style={{ margin: '8px 0', fontSize: '18px' }}>
                          {collab.opportunity?.titolo}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                          Ruolo: <strong>{collab.ruolo?.replace('_', ' ')}</strong>
                        </div>
                        {collab.budget_confermato && (
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#4CAF50' }}>
                            Budget: €{collab.budget_confermato.toLocaleString()}
                          </div>
                        )}
                        {collab.data_inizio && (
                          <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                            📅 {new Date(collab.data_inizio).toLocaleDateString('it-IT')} - {collab.data_fine ? new Date(collab.data_fine).toLocaleDateString('it-IT') : 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorMarketplace;
