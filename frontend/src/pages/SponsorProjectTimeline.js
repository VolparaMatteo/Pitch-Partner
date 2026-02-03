import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SponsorProjectTimeline() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.user_type !== 'sponsor') {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [projectRes, timelineRes, tasksRes] = await Promise.all([
        axios.get(`${API_URL}/sponsor/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/sponsor/projects/${id}/timeline`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/sponsor/tasks?project_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setProject(projectRes.data.project);
      setTimeline(timelineRes.data.timeline || []);
      setMyTasks(tasksRes.data.tasks || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/sponsor/tasks/${taskId}/status`, { stato: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      alert('Stato task aggiornato!');
    } catch (error) {
      console.error('Errore aggiornamento task:', error);
      alert('Errore aggiornamento task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    try {
      await axios.post(`${API_URL}/sponsor/tasks/${selectedTask}/comments`, {
        contenuto: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewComment('');
      setSelectedTask(null);
      alert('Commento aggiunto!');
      fetchData();
    } catch (error) {
      console.error('Errore aggiunta commento:', error);
      alert('Errore aggiunta commento');
    }
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <div className="dashboard-container">
          <div className="empty-state">Progetto non trovato</div>
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
            onClick={() => navigate('/sponsor/projects')}
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

          <h1 style={{ margin: '0 0 8px 0' }}>{project.titolo}</h1>
          <div style={{ fontSize: '14px', color: '#666' }}>
            🏟️ Club: <strong>{project.club?.nome}</strong>
          </div>
        </div>

        {/* Project Overview */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Stato</div>
              <div style={{ fontSize: '18px', fontWeight: '600', textTransform: 'capitalize' }}>
                {project.stato}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Progresso</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#4CAF50' }}>
                {project.progresso_percentuale}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Milestones</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#2196F3' }}>
                {project.milestones_completati}/{project.milestones_count}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Tasks</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#4CAF50' }}>
                {project.tasks_completati}/{project.tasks_count}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Timeline */}
          <div>
            <h2 style={{ marginBottom: '16px' }}>📰 Timeline Aggiornamenti</h2>

            {timeline.length === 0 ? (
              <div className="empty-state">Nessun aggiornamento disponibile</div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Timeline Line */}
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: '0',
                  bottom: '0',
                  width: '2px',
                  background: '#e0e0e0'
                }} />

                {/* Timeline Items */}
                <div style={{ display: 'grid', gap: '24px' }}>
                  {timeline.map(update => (
                    <div
                      key={update.id}
                      style={{
                        position: 'relative',
                        paddingLeft: '56px'
                      }}
                    >
                      {/* Timeline Dot */}
                      <div style={{
                        position: 'absolute',
                        left: '12px',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#85FF00',
                        border: '3px solid white',
                        boxShadow: '0 0 0 2px #e0e0e0'
                      }} />

                      {/* Content */}
                      <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                            {update.titolo}
                          </h3>
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            {new Date(update.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '14px',
                          color: '#666',
                          lineHeight: '1.6',
                          margin: 0,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {update.contenuto}
                        </p>

                        {update.allegati_urls && update.allegati_urls.length > 0 && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>📎 Allegati:</div>
                            {update.allegati_urls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'block', fontSize: '13px', color: '#2196F3', marginBottom: '4px' }}
                              >
                                {url}
                              </a>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                          📝 {update.autore.nome}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - My Tasks */}
          <div>
            <h2 style={{ marginBottom: '16px' }}>✅ I Miei Task</h2>

            {myTasks.length === 0 ? (
              <div className="empty-state">Nessun task assegnato</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {myTasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      borderLeft: task.stato === 'completato' ? '4px solid #4CAF50' : '4px solid #FFA500'
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', flex: 1 }}>{task.titolo}</h4>
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

                      {task.descrizione && (
                        <p style={{ fontSize: '13px', color: '#666', margin: '6px 0' }}>{task.descrizione}</p>
                      )}

                      {task.data_scadenza && (
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                          📅 Scadenza: {new Date(task.data_scadenza).toLocaleDateString('it-IT')}
                        </div>
                      )}
                    </div>

                    {/* Status Selector */}
                    <select
                      value={task.stato}
                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '13px',
                        marginBottom: '8px'
                      }}
                    >
                      <option value="da_fare">📋 Da Fare</option>
                      <option value="in_corso">🚀 In Corso</option>
                      <option value="in_revisione">🔍 In Revisione</option>
                      <option value="completato">✅ Completato</option>
                      <option value="bloccato">🚫 Bloccato</option>
                    </select>

                    {/* Comment Button */}
                    <button
                      onClick={() => setSelectedTask(task.id)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#f0f0f0',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      💬 Aggiungi Commento
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Form Modal */}
            {selectedTask && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  maxWidth: '500px',
                  width: '90%'
                }}>
                  <h3 style={{ marginBottom: '16px' }}>Aggiungi Commento</h3>
                  <form onSubmit={handleAddComment}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Scrivi il tuo commento..."
                      rows={4}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        marginBottom: '16px',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => { setSelectedTask(null); setNewComment(''); }}
                        style={{
                          padding: '10px 20px',
                          background: '#f0f0f0',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ padding: '10px 20px' }}
                      >
                        Invia Commento
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SponsorProjectTimeline;
