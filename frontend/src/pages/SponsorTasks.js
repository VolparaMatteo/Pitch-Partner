import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import api from '../services/api';
import '../styles/sponsor-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineFlag,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowPath
} from 'react-icons/hi2';

function SponsorTasks() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totale: 0,
    da_fare: 0,
    in_corso: 0,
    completati: 0,
    in_ritardo: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    stato: '',
    priorita: '',
    search: ''
  });

  // Expanded tasks (for showing description)
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchTasks();
  }, [filters.stato, filters.priorita]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.stato) params.append('stato', filters.stato);
      if (filters.priorita) params.append('priorita', filters.priorita);

      const response = await api.get(`/sponsor/tasks?${params.toString()}`);
      setTasks(response.data.tasks || []);
      setStats(response.data.stats || {});

    } catch (error) {
      console.error('Errore nel caricamento task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/sponsor/tasks/${taskId}`, { stato: newStatus });
      fetchTasks(); // Refresh
    } catch (error) {
      console.error('Errore aggiornamento task:', error);
      alert(error.response?.data?.error || 'Errore nell\'aggiornamento');
    }
  };

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} giorni fa`;
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    return `${days} giorni`;
  };

  const getPriorityInfo = (priorita) => {
    const priorities = {
      'urgente': { label: 'Urgente', color: '#DC2626', bg: '#FEF2F2' },
      'alta': { label: 'Alta', color: '#F59E0B', bg: '#FFFBEB' },
      'media': { label: 'Media', color: '#3B82F6', bg: '#EFF6FF' },
      'bassa': { label: 'Bassa', color: '#6B7280', bg: '#F3F4F6' }
    };
    return priorities[priorita] || priorities['media'];
  };

  const getStatusInfo = (stato) => {
    const statuses = {
      'da_fare': { label: 'Da fare', color: '#6B7280', bg: '#F3F4F6' },
      'in_corso': { label: 'In corso', color: '#3B82F6', bg: '#EFF6FF' },
      'in_revisione': { label: 'In revisione', color: '#8B5CF6', bg: '#F5F3FF' },
      'completato': { label: 'Completato', color: '#059669', bg: '#ECFDF5' },
      'bloccato': { label: 'Bloccato', color: '#DC2626', bg: '#FEF2F2' }
    };
    return statuses[stato] || statuses['da_fare'];
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return task.titolo?.toLowerCase().includes(searchLower) ||
             task.descrizione?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Group by status
  const groupedTasks = {
    da_fare: filteredTasks.filter(t => t.stato === 'da_fare'),
    in_corso: filteredTasks.filter(t => t.stato === 'in_corso'),
    in_revisione: filteredTasks.filter(t => t.stato === 'in_revisione'),
    completato: filteredTasks.filter(t => t.stato === 'completato')
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Caricamento task...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Task</h1>
          <p className="page-subtitle">Task assegnati a te dal club</p>
        </div>
      </div>

      {/* Stats */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '24px' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Totale</div>
          <div className="tp-stat-value">{stats.totale}</div>
          <div className="tp-stat-description">Task assegnati</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Da Fare</div>
          <div className="tp-stat-value">{stats.da_fare}</div>
          <div className="tp-stat-description">Non iniziati</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">In Corso</div>
          <div className="tp-stat-value">{stats.in_corso}</div>
          <div className="tp-stat-description">In lavorazione</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Completati</div>
          <div className="tp-stat-value">{stats.completati}</div>
          <div className="tp-stat-description">Terminati</div>
        </div>
        <div className="tp-stat-card-dark" style={{ background: stats.in_ritardo > 0 ? '#DC2626' : undefined }}>
          <div className="tp-stat-label">In Ritardo</div>
          <div className="tp-stat-value">{stats.in_ritardo}</div>
          <div className="tp-stat-description">Scaduti</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineMagnifyingGlass size={18} />
          <input
            type="text"
            placeholder="Cerca task..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-buttons">
          <select
            className="filter-select"
            value={filters.stato}
            onChange={(e) => setFilters({ ...filters, stato: e.target.value })}
          >
            <option value="">Tutti gli stati</option>
            <option value="da_fare">Da fare</option>
            <option value="in_corso">In corso</option>
            <option value="in_revisione">In revisione</option>
            <option value="completato">Completato</option>
          </select>

          <select
            className="filter-select"
            value={filters.priorita}
            onChange={(e) => setFilters({ ...filters, priorita: e.target.value })}
          >
            <option value="">Tutte le priorità</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="bassa">Bassa</option>
          </select>
        </div>
      </div>

      {/* Tasks Board */}
      <div className="tasks-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-state-card">
            <HiOutlineClipboardDocumentList size={48} />
            <h3>Nessun task trovato</h3>
            <p>Non ci sono task assegnati a te</p>
          </div>
        ) : (
          <div className="tasks-board">
            {/* Da Fare Column */}
            <div className="tasks-column">
              <div className="column-header">
                <span className="column-title">Da Fare</span>
                <span className="column-count">{groupedTasks.da_fare.length}</span>
              </div>
              <div className="column-content">
                {groupedTasks.da_fare.map((task, idx) => (
                  <TaskCard
                    key={idx}
                    task={task}
                    expanded={expandedTasks[task.id]}
                    onToggle={() => toggleExpand(task.id)}
                    onStatusChange={handleStatusChange}
                    getPriorityInfo={getPriorityInfo}
                    getStatusInfo={getStatusInfo}
                    formatDate={formatDate}
                    getDaysUntil={getDaysUntil}
                  />
                ))}
              </div>
            </div>

            {/* In Corso Column */}
            <div className="tasks-column">
              <div className="column-header">
                <span className="column-title">In Corso</span>
                <span className="column-count">{groupedTasks.in_corso.length}</span>
              </div>
              <div className="column-content">
                {groupedTasks.in_corso.map((task, idx) => (
                  <TaskCard
                    key={idx}
                    task={task}
                    expanded={expandedTasks[task.id]}
                    onToggle={() => toggleExpand(task.id)}
                    onStatusChange={handleStatusChange}
                    getPriorityInfo={getPriorityInfo}
                    getStatusInfo={getStatusInfo}
                    formatDate={formatDate}
                    getDaysUntil={getDaysUntil}
                  />
                ))}
              </div>
            </div>

            {/* In Revisione Column */}
            <div className="tasks-column">
              <div className="column-header">
                <span className="column-title">In Revisione</span>
                <span className="column-count">{groupedTasks.in_revisione.length}</span>
              </div>
              <div className="column-content">
                {groupedTasks.in_revisione.map((task, idx) => (
                  <TaskCard
                    key={idx}
                    task={task}
                    expanded={expandedTasks[task.id]}
                    onToggle={() => toggleExpand(task.id)}
                    onStatusChange={handleStatusChange}
                    getPriorityInfo={getPriorityInfo}
                    getStatusInfo={getStatusInfo}
                    formatDate={formatDate}
                    getDaysUntil={getDaysUntil}
                  />
                ))}
              </div>
            </div>

            {/* Completato Column */}
            <div className="tasks-column completed">
              <div className="column-header">
                <span className="column-title">Completato</span>
                <span className="column-count">{groupedTasks.completato.length}</span>
              </div>
              <div className="column-content">
                {groupedTasks.completato.slice(0, 5).map((task, idx) => (
                  <TaskCard
                    key={idx}
                    task={task}
                    expanded={expandedTasks[task.id]}
                    onToggle={() => toggleExpand(task.id)}
                    onStatusChange={handleStatusChange}
                    getPriorityInfo={getPriorityInfo}
                    getStatusInfo={getStatusInfo}
                    formatDate={formatDate}
                    getDaysUntil={getDaysUntil}
                    completed
                  />
                ))}
                {groupedTasks.completato.length > 5 && (
                  <div className="show-more">
                    +{groupedTasks.completato.length - 5} altri completati
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, expanded, onToggle, onStatusChange, getPriorityInfo, getStatusInfo, formatDate, getDaysUntil, completed }) {
  const priorityInfo = getPriorityInfo(task.priorita);
  const statusInfo = getStatusInfo(task.stato);
  const daysUntil = getDaysUntil(task.data_scadenza);

  return (
    <div className={`task-card ${task.is_late ? 'late' : ''} ${completed ? 'completed' : ''}`}>
      <div className="task-card-header" onClick={onToggle}>
        <div className="task-card-title">
          <span className="priority-dot" style={{ backgroundColor: priorityInfo.color }}></span>
          <span className="title-text">{task.titolo}</span>
        </div>
        {expanded ? <HiOutlineChevronUp size={16} /> : <HiOutlineChevronDown size={16} />}
      </div>

      {expanded && task.descrizione && (
        <div className="task-card-description">
          {task.descrizione}
        </div>
      )}

      <div className="task-card-meta">
        {task.data_scadenza && (
          <div className={`task-deadline ${task.is_late ? 'late' : ''}`}>
            <HiOutlineCalendarDays size={14} />
            <span>{daysUntil}</span>
          </div>
        )}
        {task.comments_count > 0 && (
          <div className="task-comments">
            <HiOutlineChatBubbleLeftRight size={14} />
            <span>{task.comments_count}</span>
          </div>
        )}
        {task.project && (
          <div className="task-project">
            {task.project.nome}
          </div>
        )}
      </div>

      <div className="task-card-footer">
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityInfo.bg, color: priorityInfo.color }}
        >
          {priorityInfo.label}
        </span>

        {!completed && (
          <select
            className="status-select"
            value={task.stato}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="da_fare">Da fare</option>
            <option value="in_corso">In corso</option>
            <option value="in_revisione">In revisione</option>
            <option value="completato">Completato</option>
          </select>
        )}
      </div>
    </div>
  );
}

export default SponsorTasks;
