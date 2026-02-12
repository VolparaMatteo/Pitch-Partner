import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const clubsData = Array.isArray(response.data) ? response.data : [];
      setClubs(clubsData);
    } catch (error) {
      console.error('Errore nel caricamento club:', error);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (club) => {
    if (!club.account_attivo) {
      return { label: 'Disattivo', color: '#FF4444', bg: '#FFD4D4' };
    }
    if (!club.licenza_valida) {
      return { label: 'Licenza Scaduta', color: '#FF8C00', bg: '#FFE4CC' };
    }
    return { label: 'Attivo', color: '#1A1A1A', bg: '#7FFF00' };
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

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div className="welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="welcome-title">🏟️ Gestione Club</h1>
          <button
            onClick={() => navigate('/admin/clubs/new')}
            className="stat-btn"
          >
            + Nuovo Club
          </button>
        </div>

        {/* Clubs List */}
        <div className="widget-white">
          <div className="widget-header">
            <h3>Elenco Club</h3>
            <div className="widget-subtitle">Tutti i club della piattaforma</div>
          </div>

          {clubs.length === 0 ? (
            <div className="empty-state">
              <p>Nessun club registrato</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '24px',
              marginTop: '20px'
            }}>
              {clubs.map((club) => {
                const status = getStatusBadge(club);
                return (
                  <div
                    key={club.id}
                    style={{
                      background: 'white',
                      borderRadius: '24px',
                      padding: '0',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      overflow: 'hidden',
                      border: '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(127, 255, 0, 0.2)';
                      e.currentTarget.style.borderColor = '#7FFF00';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onClick={() => navigate(`/admin/clubs/${club.id}`)}
                  >
                    {/* Header with gradient background */}
                    <div style={{
                      background: status.bg,
                      padding: '24px',
                      position: 'relative',
                      minHeight: '140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {club.logo_url ? (
                        <img
                          src={getImageUrl(club.logo_url)}
                          alt={club.nome}
                          style={{
                            maxWidth: '120px',
                            maxHeight: '80px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '32px',
                          fontWeight: 700,
                          color: '#1A1A1A'
                        }}>
                          {club.nome.charAt(0)}
                        </div>
                      )}

                      {/* Status badge */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: status.color,
                        color: status.label === 'Attivo' ? '#1A1A1A' : 'white',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {status.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '24px' }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        lineHeight: 1.3
                      }}>
                        {club.nome}
                      </h4>

                      {club.tipologia && (
                        <div style={{
                          display: 'inline-block',
                          background: '#F5F5F5',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#666',
                          marginBottom: '16px'
                        }}>
                          {club.tipologia}
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #F0F0F0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>📧</span>
                          <span style={{ fontSize: '13px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {club.email}
                          </span>
                        </div>
                        {club.telefono && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px' }}>📞</span>
                            <span style={{ fontSize: '13px', color: '#666' }}>
                              {club.telefono}
                            </span>
                          </div>
                        )}
                        {club.nome_abbonamento && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px' }}>💎</span>
                            <span style={{ fontSize: '13px', color: '#666' }}>
                              {club.nome_abbonamento}
                              {club.costo_abbonamento && ` - €${club.costo_abbonamento}/mese`}
                            </span>
                          </div>
                        )}
                        {club.data_scadenza_licenza && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px' }}>⏰</span>
                            <span style={{ fontSize: '13px', color: club.licenza_valida ? '#666' : '#FF4444' }}>
                              Scadenza: {new Date(club.data_scadenza_licenza).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/clubs/${club.id}`); }}
                          style={{
                            flex: 1,
                            background: '#1A1A1A',
                            color: 'white',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#000000'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#1A1A1A'}
                        >
                          👁️ Visualizza
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/clubs/${club.id}/edit`); }}
                          style={{
                            flex: 1,
                            background: '#7FFF00',
                            color: '#1A1A1A',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#6FEF00'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#7FFF00'}
                        >
                          ✏️ Modifica
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AdminClubs;
