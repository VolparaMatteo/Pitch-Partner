import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import api from '../services/api';
import '../styles/sponsor-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineDocumentText,
  HiOutlineCurrencyEuro,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineEnvelope,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineFolderOpen,
  HiOutlineBolt,
  HiOutlineClipboardDocumentList,
  HiOutlineArchiveBox,
  HiOutlineTrophy,
  HiOutlineExclamationCircle,
  HiOutlineDocumentArrowDown
} from 'react-icons/hi2';

function SponsorDashboard() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState({
    contratti_attivi: 0,
    valore_contratti: 0,
    asset_allocati: 0,
    attivazioni_imminenti: 0,
    task_pendenti: 0,
    file_condivisi: 0
  });
  const [upcomingActivations, setUpcomingActivations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [club, setClub] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await api.get('/sponsor/dashboard');
      const data = response.data;

      setStats(data.stats);
      setUpcomingActivations(data.upcoming_activations || []);
      setUpcomingEvents(data.upcoming_events || []);
      setPendingTasks(data.pending_tasks || []);
      setRecentFiles(data.recent_files || []);
      setClub(data.club);

    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntil = (dateString) => {
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    if (days < 0) return 'Passato';
    return `${days} giorni`;
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return formatDate(dateString);
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return '#DC2626';
      case 'alta': return '#F59E0B';
      case 'media': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('video')) return '🎬';
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return '📊';
    return '📎';
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span>Caricamento dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">
            {getCurrentGreeting()}, <span className="sponsor-name">{user?.ragione_sociale || 'Sponsor'}</span>
          </h1>
          <p className="dashboard-subtitle">
            {club ? `Partner di ${club.nome}` : 'Il tuo pannello sponsorship'}
          </p>
        </div>
        <div className="dashboard-header-right">
          <button className="dashboard-action-btn secondary" onClick={() => navigate('/sponsor/analytics')}>
            <HiOutlineChartBar size={18} />
            <span>Analytics</span>
          </button>
          <button className="dashboard-action-btn primary" onClick={() => navigate('/pitchy')}>
            <HiOutlineSparkles size={18} />
            <span>Pitchy AI</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="tp-stat-card-dark" onClick={() => navigate('/sponsor/contracts')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-label">Valore Contratti</div>
          <div className="tp-stat-value">{formatCurrency(stats.valore_contratti)}</div>
          <div className="tp-stat-description">{stats.contratti_attivi} contratti attivi</div>
        </div>

        <div className="tp-stat-card-dark" onClick={() => navigate('/sponsor/assets')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-label">Asset Allocati</div>
          <div className="tp-stat-value">{stats.asset_allocati}</div>
          <div className="tp-stat-description">Asset in uso</div>
        </div>

        <div className="tp-stat-card-dark" onClick={() => navigate('/sponsor/activations')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-label">Attivazioni</div>
          <div className="tp-stat-value">{stats.attivazioni_imminenti}</div>
          <div className="tp-stat-description">Prossimi 30 giorni</div>
        </div>

        <div className="tp-stat-card-dark" onClick={() => navigate('/sponsor/tasks')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-label">Task Pendenti</div>
          <div className="tp-stat-value">{stats.task_pendenti}</div>
          <div className="tp-stat-description">Da completare</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <button className="quick-action-btn" onClick={() => navigate('/sponsor/activations')}>
          <HiOutlineBolt size={18} />
          <span>Attivazioni</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/sponsor/events')}>
          <HiOutlineCalendarDays size={18} />
          <span>Eventi</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/sponsor/tasks')}>
          <HiOutlineClipboardDocumentList size={18} />
          <span>Task</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/sponsor/drive')}>
          <HiOutlineFolderOpen size={18} />
          <span>Drive</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/messages')}>
          <HiOutlineEnvelope size={18} />
          <span>Messaggi</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Upcoming Activations */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineBolt size={20} className="card-header-icon" />
                <h3>Prossime Attivazioni</h3>
              </div>
              <button className="card-header-link" onClick={() => navigate('/sponsor/activations')}>
                Vedi tutte <HiOutlineArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {upcomingActivations.length === 0 ? (
                <div className="empty-state small">
                  <HiOutlineBolt size={28} />
                  <p>Nessuna attivazione in programma</p>
                </div>
              ) : (
                <div className="activations-list">
                  {upcomingActivations.slice(0, 5).map((activation, idx) => (
                    <div
                      key={idx}
                      className="activation-item"
                      onClick={() => navigate('/sponsor/activations')}
                    >
                      <div className="activation-date-badge">
                        <span className="activation-day">{new Date(activation.data).getDate()}</span>
                        <span className="activation-month">{new Date(activation.data).toLocaleDateString('it-IT', { month: 'short' })}</span>
                      </div>
                      <div className="activation-info">
                        <span className="activation-title">{activation.titolo}</span>
                        <span className="activation-details">
                          {activation.tipo === 'match' ? <HiOutlineTrophy size={12} /> : <HiOutlineCalendarDays size={12} />}
                          {activation.asset_tipo || 'Attivazione'} • {activation.asset_nome || 'Asset'}
                        </span>
                      </div>
                      <div className={`activation-status ${activation.stato}`}>
                        {activation.stato === 'pianificata' ? 'Pianificata' :
                         activation.stato === 'confermata' ? 'Confermata' : activation.stato}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineClipboardDocumentList size={20} className="card-header-icon" />
                <h3>Task da Completare</h3>
                {pendingTasks.length > 0 && (
                  <span className="card-badge">{pendingTasks.length}</span>
                )}
              </div>
              <button className="card-header-link" onClick={() => navigate('/sponsor/tasks')}>
                Vedi tutti <HiOutlineArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {pendingTasks.length === 0 ? (
                <div className="empty-state small">
                  <HiOutlineCheckCircle size={28} />
                  <p>Nessun task in sospeso</p>
                </div>
              ) : (
                <div className="tasks-list">
                  {pendingTasks.slice(0, 5).map((task, idx) => (
                    <div
                      key={idx}
                      className="task-item"
                      onClick={() => navigate('/sponsor/tasks')}
                    >
                      <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priorita) + '20', color: getPriorityColor(task.priorita) }}>
                        {task.priorita === 'urgente' ? '!' : task.priorita === 'alta' ? '↑' : '•'}
                      </div>
                      <div className="task-info">
                        <span className="task-title">{task.titolo}</span>
                        {task.data_scadenza && (
                          <span className={`task-deadline ${task.is_late ? 'late' : ''}`}>
                            <HiOutlineClock size={12} />
                            {task.is_late ? 'Scaduto' : getDaysUntil(task.data_scadenza)}
                          </span>
                        )}
                      </div>
                      <div className={`task-status ${task.stato}`}>
                        {task.stato === 'da_fare' ? 'Da fare' :
                         task.stato === 'in_corso' ? 'In corso' : task.stato}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Upcoming Events */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineCalendarDays size={20} className="card-header-icon" />
                <h3>Prossimi Eventi</h3>
              </div>
              <button className="card-header-link" onClick={() => navigate('/sponsor/events')}>
                Vedi tutti <HiOutlineArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {upcomingEvents.length === 0 ? (
                <div className="empty-state small">
                  <HiOutlineCalendarDays size={28} />
                  <p>Nessun evento in programma</p>
                </div>
              ) : (
                <div className="events-list">
                  {upcomingEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="event-item"
                      onClick={() => navigate('/sponsor/events')}
                    >
                      <div className="event-date">
                        <span className="event-day">{new Date(event.data).getDate()}</span>
                        <span className="event-month">{new Date(event.data).toLocaleDateString('it-IT', { month: 'short' })}</span>
                      </div>
                      <div className="event-info">
                        <span className="event-title">{event.titolo}</span>
                        <span className="event-type">
                          {event.luogo || 'Luogo da definire'}
                          {!event.visualizzato && <span className="new-badge">Nuovo</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Files */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineFolderOpen size={20} className="card-header-icon" />
                <h3>File Recenti</h3>
              </div>
              <button className="card-header-link" onClick={() => navigate('/sponsor/drive')}>
                Apri Drive <HiOutlineArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {recentFiles.length === 0 ? (
                <div className="empty-state small">
                  <HiOutlineFolderOpen size={28} />
                  <p>Nessun file condiviso</p>
                </div>
              ) : (
                <div className="files-list">
                  {recentFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="file-item"
                      onClick={() => navigate('/sponsor/drive')}
                    >
                      <div className="file-icon">
                        {getFileIcon(file.file_type)}
                      </div>
                      <div className="file-info">
                        <span className="file-name">{file.nome}</span>
                        <span className="file-meta">
                          {file.categoria || 'Documento'} • {getTimeAgo(file.created_at)}
                        </span>
                      </div>
                      <div className="file-upload-badge">
                        {file.caricato_da === 'club' ? 'Club' : 'Tu'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contracts Summary */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineDocumentText size={20} className="card-header-icon" />
                <h3>Contratti</h3>
              </div>
              <button className="card-header-link" onClick={() => navigate('/sponsor/contracts')}>
                Gestisci <HiOutlineArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              <div className="contracts-summary">
                <div className="contract-stat">
                  <span className="contract-stat-value">{stats.contratti_attivi}</span>
                  <span className="contract-stat-label">Attivi</span>
                </div>
                <div className="contract-stat">
                  <span className="contract-stat-value">{formatCurrency(stats.valore_contratti)}</span>
                  <span className="contract-stat-label">Valore Totale</span>
                </div>
              </div>
              <button className="card-action-btn" onClick={() => navigate('/sponsor/contracts')}>
                <HiOutlineDocumentText size={18} />
                Visualizza Contratti
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SponsorDashboard;
