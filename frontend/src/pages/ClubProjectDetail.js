import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ClubProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newMilestone, setNewMilestone] = useState({ titolo: '', descrizione: '', data_scadenza: '' });
  const [newTask, setNewTask] = useState({
    titolo: '',
    descrizione: '',
    assegnato_a_type: 'sponsor',
    priorita: 'media',
    data_scadenza: ''
  });
  const [newUpdate, setNewUpdate] = useState({ titolo: '', contenuto: '', tipo_update: 'news' });
  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/club/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(res.data.project);
    } catch (error) {
      console.error('Errore caricamento progetto:', error);
      alert('Errore caricamento progetto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/club/projects/${id}/milestones`, newMilestone, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMilestone({ titolo: '', descrizione: '', data_scadenza: '' });
      fetchProject();
      alert('Milestone creato!');
    } catch (error) {
      console.error('Errore creazione milestone:', error);
      alert('Errore creazione milestone');
    }
  };

  const handleCompleteMilestone = async (milestoneId) => {
    try {
      await axios.patch(`${API_URL}/club/projects/${id}/milestones/${milestoneId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProject();
      alert('Milestone completato!');
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/club/projects/${id}/tasks`, {
        ...newTask,
        assegnato_a_id: project.sponsor_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTask({
        titolo: '',
        descrizione: '',
        assegnato_a_type: 'sponsor',
        priorita: 'media',
        data_scadenza: ''
      });
      fetchProject();
      alert('Task creato e assegnato!');
    } catch (error) {
      console.error('Errore creazione task:', error);
      alert('Errore creazione task');
    }
  };

  const handleCreateUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/club/projects/${id}/updates`, newUpdate, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewUpdate({ titolo: '', contenuto: '', tipo_update: 'news' });
      fetchProject();
      alert('Update pubblicato! Sponsor notificato.');
    } catch (error) {
      console.error('Errore pubblicazione update:', error);
      alert('Errore pubblicazione update');
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      await axios.patch(`${API_URL}/club/projects/${id}/status`, { stato: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProject();
      alert('Stato aggiornato! Sponsor notificato.');
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento progetto...</div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <div className="dashboard-container">
          <div className="empty-state">
            <p>Progetto non trovato</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/club/projects')}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '12px'
            }}
          >
            ← Torna ai progetti
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0' }}>{project.titolo}</h1>
              <div style={{ fontSize: '14px', color: '#666' }}>
                🤝 Sponsor: <strong>{project.sponsor?.nome_azienda}</strong>
              </div>
            </div>

            <select
              value={project.stato}
              onChange={(e) => handleChangeStatus(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <option value="pianificazione">📋 Pianificazione</option>
              <option value="in_corso">🚀 In Corso</option>
              <option value="in_pausa">⏸️ In Pausa</option>
              <option value="completato">✅ Completato</option>
              <option value="archiviato">📦 Archiviato</option>
            </select>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Progresso Progetto</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
              {project.progresso_percentuale}%
            </span>
          </div>
          <div style={{
            background: '#f0f0f0',
            borderRadius: '12px',
            height: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #4CAF50, #85FF00)',
              width: `${project.progresso_percentuale}%`,
              height: '100%',
              transition: 'width 0.5s'
            }} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          {['overview', 'milestones', 'tasks', 'updates'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #85FF00' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : '400',
                color: activeTab === tab ? '#000' : '#666',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'milestones' && `🎯 Milestones (${project.milestones?.length || 0})`}
              {tab === 'tasks' && `✅ Tasks (${project.tasks?.length || 0})`}
              {tab === 'updates' && `📰 Updates (${project.recent_updates?.length || 0})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>📋 Informazioni</h3>
              <div style={{ fontSize: '14px', lineHeight: '2' }}>
                <div><strong>Descrizione:</strong></div>
                <p style={{ color: '#666', margin: '8px 0 16px 0' }}>{project.descrizione || 'Nessuna descrizione'}</p>
                <div><strong>Priorità:</strong> <span style={{ textTransform: 'capitalize' }}>{project.priorita}</span></div>
                <div><strong>Data Inizio:</strong> {project.data_inizio || 'Non specificata'}</div>
                <div><strong>Data Fine:</strong> {project.data_fine || 'Non specificata'}</div>
                {project.budget_allocato && (
                  <div><strong>Budget:</strong> €{project.budget_allocato}</div>
                )}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>📊 Statistiche</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>
                    {project.milestones_completati}/{project.milestones_count}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Milestones</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {project.tasks_completati}/{project.tasks_count}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Tasks</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div>
            {/* Form Crea Milestone */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>+ Crea Nuovo Milestone</h3>
              <form onSubmit={handleCreateMilestone}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Titolo milestone"
                    value={newMilestone.titolo}
                    onChange={(e) => setNewMilestone({ ...newMilestone, titolo: e.target.value })}
                    required
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <input
                    type="date"
                    value={newMilestone.data_scadenza}
                    onChange={(e) => setNewMilestone({ ...newMilestone, data_scadenza: e.target.value })}
                    required
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
                <textarea
                  placeholder="Descrizione (opzionale)"
                  value={newMilestone.descrizione}
                  onChange={(e) => setNewMilestone({ ...newMilestone, descrizione: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px' }}
                />
                <button type="submit" className="btn-primary">Crea Milestone</button>
              </form>
            </div>

            {/* Lista Milestones */}
            {project.milestones?.length === 0 ? (
              <div className="empty-state">Nessun milestone creato</div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {project.milestones?.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      borderLeft: milestone.stato === 'completato' ? '4px solid #4CAF50' : '4px solid #FFA500'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#666'
                          }}>
                            {index + 1}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '16px' }}>{milestone.titolo}</h4>
                          <span style={{
                            background: milestone.stato === 'completato' ? '#4CAF50' : '#FFA500',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            {milestone.stato}
                          </span>
                        </div>
                        <p style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>{milestone.descrizione}</p>
                        <div style={{ fontSize: '13px', color: '#999' }}>
                          📅 Scadenza: {new Date(milestone.data_scadenza).toLocaleDateString('it-IT')}
                          {milestone.completato_il && (
                            <span style={{ marginLeft: '16px', color: '#4CAF50' }}>
                              ✅ Completato il {new Date(milestone.completato_il).toLocaleDateString('it-IT')}
                            </span>
                          )}
                        </div>
                      </div>
                      {milestone.stato !== 'completato' && (
                        <button
                          onClick={() => handleCompleteMilestone(milestone.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          ✓ Completa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            {/* Form Crea Task */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>+ Crea Nuovo Task</h3>
              <form onSubmit={handleCreateTask}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Titolo task"
                    value={newTask.titolo}
                    onChange={(e) => setNewTask({ ...newTask, titolo: e.target.value })}
                    required
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <select
                    value={newTask.priorita}
                    onChange={(e) => setNewTask({ ...newTask, priorita: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="bassa">🟢 Bassa</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={newTask.data_scadenza}
                    onChange={(e) => setNewTask({ ...newTask, data_scadenza: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
                <textarea
                  placeholder="Descrizione task"
                  value={newTask.descrizione}
                  onChange={(e) => setNewTask({ ...newTask, descrizione: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px' }}
                />
                <button type="submit" className="btn-primary">Crea e Assegna a Sponsor</button>
              </form>
            </div>

            {/* Lista Tasks */}
            {project.tasks?.length === 0 ? (
              <div className="empty-state">Nessun task creato</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {project.tasks?.map(task => (
                  <div
                    key={task.id}
                    style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px' }}>{task.titolo}</h4>
                        <span style={{
                          background: task.stato === 'completato' ? '#4CAF50' : '#FFA500',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          {task.stato}
                        </span>
                        <span style={{
                          background: task.priorita === 'urgente' ? '#F44336' : task.priorita === 'alta' ? '#FF5722' : '#FFA500',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          {task.priorita}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {task.assegnato_a && `👤 ${task.assegnato_a.nome}`}
                        {task.data_scadenza && (
                          <span style={{ marginLeft: '12px' }}>
                            📅 {new Date(task.data_scadenza).toLocaleDateString('it-IT')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#999' }}>
                      💬 {task.comments_count} commenti
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'updates' && (
          <div>
            {/* Form Pubblica Update */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>📰 Pubblica Aggiornamento</h3>
              <form onSubmit={handleCreateUpdate}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Titolo aggiornamento"
                    value={newUpdate.titolo}
                    onChange={(e) => setNewUpdate({ ...newUpdate, titolo: e.target.value })}
                    required
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <select
                    value={newUpdate.tipo_update}
                    onChange={(e) => setNewUpdate({ ...newUpdate, tipo_update: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="news">📰 News</option>
                    <option value="milestone_completato">🎯 Milestone Completato</option>
                    <option value="alert">⚠️ Alert</option>
                    <option value="documento">📄 Documento</option>
                  </select>
                </div>
                <textarea
                  placeholder="Contenuto aggiornamento (lo sponsor verrà notificato)"
                  value={newUpdate.contenuto}
                  onChange={(e) => setNewUpdate({ ...newUpdate, contenuto: e.target.value })}
                  required
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px' }}
                />
                <button type="submit" className="btn-primary">Pubblica e Notifica Sponsor</button>
              </form>
            </div>

            {/* Lista Updates */}
            {project.recent_updates?.length === 0 ? (
              <div className="empty-state">Nessun aggiornamento pubblicato</div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {project.recent_updates?.map(update => (
                  <div
                    key={update.id}
                    style={{
                      background: 'white',
                      padding: '24px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px' }}>{update.titolo}</h4>
                      <span style={{ fontSize: '13px', color: '#999' }}>
                        {new Date(update.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', margin: 0 }}>
                      {update.contenuto}
                    </p>
                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                      📝 Pubblicato da {update.autore.nome}
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

export default ClubProjectDetail;
