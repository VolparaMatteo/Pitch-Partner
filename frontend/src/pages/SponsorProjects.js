import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SponsorProjects() {
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    stato: '',
    priorita: ''
  });
  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch projects
      const params = new URLSearchParams();
      if (filters.stato) params.append('stato', filters.stato);
      if (filters.priorita) params.append('priorita', filters.priorita);

      const [projectsRes, tasksRes] = await Promise.all([
        axios.get(`${API_URL}/sponsor/projects?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/sponsor/tasks?stato=da_fare,in_corso`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setProjects(projectsRes.data.projects || []);
      setMyTasks(tasksRes.data.tasks || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (stato) => {
    const colors = {
      'pianificazione': '#FFD4D4',
      'in_corso': '#7FFF00',
      'in_pausa': '#FFE4B3',
      'completato': '#3D3D3D',
      'archiviato': '#E0E0E0'
    };
    return colors[stato] || '#E0E0E0';
  };

  const getStatusTextColor = (stato) => {
    const colors = {
      'pianificazione': '#2D2D2D',
      'in_corso': '#2D2D2D',
      'in_pausa': '#2D2D2D',
      'completato': '#FFF',
      'archiviato': '#666'
    };
    return colors[stato] || '#3D3D3D';
  };

  const getStatusLabel = (stato) => {
    const labels = {
      'pianificazione': 'Pianificazione',
      'in_corso': 'In Corso',
      'in_pausa': 'In Pausa',
      'completato': 'Completato',
      'archiviato': 'Archiviato'
    };
    return labels[stato] || stato;
  };

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.stato === 'in_corso').length;
  const totalTasks = myTasks.length;
  const urgentTasks = myTasks.filter(t => t.priorita === 'urgente' || t.priorita === 'alta').length;
  const dueSoonTasks = myTasks.filter(t => t.data_scadenza && new Date(t.data_scadenza) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).length;

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Caricamento progetti...</div>
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
          <h1 className="welcome-title">📊 I Miei Progetti</h1>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Total Projects */}
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#2D2D2D', fontWeight: 600 }}>Progetti Totali</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2D2D2D' }}>{totalProjects}</div>
          </div>

          {/* Active Projects */}
          <div style={{
            background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#FFF', fontWeight: 600 }}>Progetti Attivi</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFF' }}>{activeProjects}</div>
          </div>

          {/* Total Tasks */}
          <div style={{
            background: 'linear-gradient(135deg, #FFD4D4 0%, #FFC4C4 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#2D2D2D', fontWeight: 600 }}>Tasks Assegnati</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2D2D2D' }}>{totalTasks}</div>
          </div>

          {/* Urgent Tasks */}
          <div style={{
            background: 'white',
            border: '2px solid #E0E0E0',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 600 }}>Tasks Urgenti</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>{urgentTasks}</div>
          </div>
        </div>

        {/* My Tasks Summary */}
        {totalTasks > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2D2D2D', margin: '0 0 20px 0' }}>
              ✅ Le Mie Tasks in Sospeso
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#2D2D2D' }}>
                  {totalTasks}
                </div>
                <div style={{ fontSize: '14px', color: '#2D2D2D', fontWeight: 600 }}>Tasks Assegnati</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#2D2D2D' }}>
                  {urgentTasks}
                </div>
                <div style={{ fontSize: '14px', color: '#2D2D2D', fontWeight: 600 }}>Priorità Alta/Urgente</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#2D2D2D' }}>
                  {dueSoonTasks}
                </div>
                <div style={{ fontSize: '14px', color: '#2D2D2D', fontWeight: 600 }}>In Scadenza (3 giorni)</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {/* Status Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#3D3D3D',
                marginBottom: '8px'
              }}>
                Stato Progetto
              </label>
              <select
                value={filters.stato}
                onChange={(e) => setFilters(prev => ({ ...prev, stato: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#7FFF00'}
                onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
              >
                <option value="">Tutti gli stati</option>
                <option value="pianificazione">📋 Pianificazione</option>
                <option value="in_corso">🚀 In Corso</option>
                <option value="in_pausa">⏸️ In Pausa</option>
                <option value="completato">✅ Completato</option>
                <option value="archiviato">📦 Archiviato</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#3D3D3D',
                marginBottom: '8px'
              }}>
                Priorità
              </label>
              <select
                value={filters.priorita}
                onChange={(e) => setFilters(prev => ({ ...prev, priorita: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#7FFF00'}
                onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
              >
                <option value="">Tutte le priorità</option>
                <option value="bassa">🟢 Bassa</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🟠 Alta</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div style={{
            background: 'white',
            border: '2px dashed #E0E0E0',
            borderRadius: '20px',
            padding: '60px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3D3D3D', marginBottom: '8px' }}>
              Nessun progetto disponibile
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              I progetti a cui sei assegnato appariranno qui
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '24px'
          }}>
            {projects.map(project => {
              const myProjectTasks = myTasks.filter(t => t.project_id === project.id);

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/sponsor/projects/${project.id}`)}
                  style={{
                    background: 'white',
                    border: '2px solid #E0E0E0',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#7FFF00';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(127, 255, 0, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E0E0E0';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7FFF00', fontWeight: 600, marginBottom: '4px' }}>
                        {project.club?.nome || 'Club'}
                      </div>
                      <div style={{ fontSize: '16px', color: '#FFF', fontWeight: 600 }}>
                        {project.titolo}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <span style={{
                        background: getStatusColor(project.stato),
                        color: getStatusTextColor(project.stato),
                        padding: '6px 16px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        {getStatusLabel(project.stato)}
                      </span>

                      {myProjectTasks.length > 0 && (
                        <span style={{
                          background: '#7FFF00',
                          color: '#2D2D2D',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          {myProjectTasks.length} task{myProjectTasks.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '24px' }}>
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

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '14px', color: '#666', fontWeight: 600 }}>Progresso</span>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#7FFF00' }}>
                          {project.progresso_percentuale}%
                        </span>
                      </div>
                      <div style={{
                        background: '#F5F5F5',
                        borderRadius: '12px',
                        height: '12px',
                        overflow: 'hidden',
                        border: '2px solid #E0E0E0'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                          width: `${project.progresso_percentuale}%`,
                          height: '100%',
                          transition: 'width 0.3s ease',
                          borderRadius: '10px'
                        }} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      paddingTop: '20px',
                      borderTop: '2px solid #E0E0E0'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        background: '#F5F5F5',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#3D3D3D' }}>
                          {project.milestones_completati}/{project.milestones_count}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontWeight: 600 }}>
                          Milestones
                        </div>
                      </div>

                      <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        background: '#F5F5F5',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#3D3D3D' }}>
                          {project.tasks_completati}/{project.tasks_count}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontWeight: 600 }}>
                          Tasks
                        </div>
                      </div>

                      <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        background: '#F5F5F5',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#3D3D3D' }}>
                          {project.updates_count}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontWeight: 600 }}>
                          Updates
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorProjects;
