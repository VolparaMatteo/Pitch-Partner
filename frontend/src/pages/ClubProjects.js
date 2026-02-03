import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ClubProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    stato: '',
    sponsor_id: '',
    priorita: ''
  });
  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.stato) params.append('stato', filters.stato);
      if (filters.sponsor_id) params.append('sponsor_id', filters.sponsor_id);
      if (filters.priorita) params.append('priorita', filters.priorita);

      const res = await axios.get(`${API_URL}/club/projects?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data.projects || []);
    } catch (error) {
      console.error('Errore caricamento progetti:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (stato) => {
    const colors = {
      'pianificazione': '#FFA500',
      'in_corso': '#4CAF50',
      'in_pausa': '#FF9800',
      'completato': '#2196F3',
      'archiviato': '#9E9E9E'
    };
    return colors[stato] || '#666';
  };

  const getPriorityColor = (priorita) => {
    const colors = {
      'bassa': '#4CAF50',
      'media': '#FFA500',
      'alta': '#FF5722',
      'urgente': '#F44336'
    };
    return colors[priorita] || '#666';
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="loading">Caricamento progetti...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 className="welcome-title">🚀 Gestione Progetti</h1>
          <button
            onClick={() => navigate('/club/projects/new')}
            style={{
              background: '#7FFF00',
              color: '#1A1A1A',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Nuovo Progetto
          </button>
        </div>

        {/* Filtri */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <select
            value={filters.stato}
            onChange={(e) => setFilters(prev => ({ ...prev, stato: e.target.value }))}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              fontSize: '14px',
              fontWeight: 500,
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Tutti gli stati</option>
            <option value="pianificazione">📋 Pianificazione</option>
            <option value="in_corso">🚀 In Corso</option>
            <option value="in_pausa">⏸️ In Pausa</option>
            <option value="completato">✅ Completato</option>
          </select>

          <select
            value={filters.priorita}
            onChange={(e) => setFilters(prev => ({ ...prev, priorita: e.target.value }))}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              fontSize: '14px',
              fontWeight: 500,
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Tutte le priorità</option>
            <option value="bassa">🟢 Bassa</option>
            <option value="media">🟡 Media</option>
            <option value="alta">🟠 Alta</option>
            <option value="urgente">🔴 Urgente</option>
          </select>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A' }}>
              {projects.filter(p => p.stato === 'in_corso').length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', opacity: 0.8 }}>
              Progetti Attivi
            </div>
          </div>

          <div style={{
            background: '#3D3D3D',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
              {projects.filter(p => p.stato === 'completato').length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', opacity: 0.8 }}>
              Completati
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #FFD4D4 0%, #FFC4C4 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A' }}>
              {Math.round(projects.reduce((acc, p) => acc + p.progresso_percentuale, 0) / projects.length) || 0}%
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', opacity: 0.8 }}>
              Progresso Medio
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
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A' }}>
              {projects.length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#666' }}>
              Totale Progetti
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '20px',
            border: '2px dashed #E0E0E0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px', fontWeight: 500 }}>
              Nessun progetto trovato
            </p>
            <button
              onClick={() => navigate('/club/projects/new')}
              style={{
                background: '#7FFF00',
                color: '#1A1A1A',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Crea il primo progetto
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px' }}>
            {projects.map(project => (
              <div
                key={project.id}
                style={{
                  background: 'white',
                  border: '2px solid #E0E0E0',
                  borderRadius: '20px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => navigate(`/club/projects/${project.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#7FFF00';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(127, 255, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#E0E0E0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header with title and badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1A1A1A', flex: 1 }}>
                    {project.titolo}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    <span style={{
                      background: getStatusColor(project.stato),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'lowercase',
                      whiteSpace: 'nowrap'
                    }}>
                      {project.stato.replace('_', ' ')}
                    </span>
                    <span style={{
                      background: getPriorityColor(project.priorita),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'lowercase'
                    }}>
                      {project.priorita}
                    </span>
                  </div>
                </div>

                {/* Sponsor */}
                {project.sponsor && (
                  <div style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '16px',
                    fontWeight: 500
                  }}>
                    🤝 <strong style={{ color: '#1A1A1A' }}>{project.sponsor.nome_azienda}</strong>
                  </div>
                )}

                {/* Description */}
                {project.descrizione && (
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: '1.6',
                    marginBottom: '20px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {project.descrizione}
                  </p>
                )}

                {/* Progress section */}
                <div style={{
                  background: '#F5F5F5',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Progresso</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#7FFF00' }}>
                      {project.progresso_percentuale}%
                    </span>
                  </div>
                  <div style={{
                    background: '#E0E0E0',
                    borderRadius: '8px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #7FFF00 0%, #6FEF00 100%)',
                      width: `${project.progresso_percentuale}%`,
                      height: '100%',
                      transition: 'width 0.3s',
                      borderRadius: '8px'
                    }} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '2px solid #F5F5F5'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>
                      {project.milestones_completati}/{project.milestones_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontWeight: 600 }}>
                      Milestones
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>
                      {project.tasks_completati}/{project.tasks_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontWeight: 600 }}>
                      Tasks
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>
                      {project.updates_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontWeight: 600 }}>
                      Updates
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ClubProjects;
