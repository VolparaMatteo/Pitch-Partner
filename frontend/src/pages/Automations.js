/**
 * Automations - Pagina lista automazioni
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { automationAPI } from '../services/automationAPI';
import '../styles/automation-builder.css';
import '../styles/template-style.css';

import {
  HiOutlineBolt,
  HiOutlinePlus,
  HiOutlinePlay,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';

function Automations() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    executions: 0,
    failed: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const response = await automationAPI.getAutomations();
      const data = response.data.automations || [];
      setAutomations(data);

      // Calcola stats
      setStats({
        total: data.length,
        active: data.filter(a => a.abilitata).length,
        executions: data.reduce((sum, a) => sum + (a.executions_count || 0), 0),
        failed: data.filter(a => a.last_status === 'failed').length
      });
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (automation, e) => {
    e.stopPropagation();
    try {
      await automationAPI.toggleAutomation(automation.id);
      fetchAutomations();
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleDelete = async (automation, e) => {
    e.stopPropagation();
    if (window.confirm(`Eliminare l'automazione "${automation.nome}"?`)) {
      try {
        await automationAPI.deleteAutomation(automation.id);
        fetchAutomations();
      } catch (error) {
        console.error('Error deleting automation:', error);
      }
    }
  };

  const handleTest = async (automation, e) => {
    e.stopPropagation();
    try {
      const result = await automationAPI.testAutomation(automation.id);
      alert(`Test completato: ${result.data.execution?.status || 'OK'}`);
      fetchAutomations();
    } catch (error) {
      console.error('Error testing automation:', error);
      alert('Errore durante il test');
    }
  };

  const getTriggerLabel = (type) => {
    const labels = {
      'lead_created': 'Lead creato',
      'lead_status_changed': 'Cambio stato lead',
      'lead_converted': 'Lead convertito',
      'sponsor_created': 'Sponsor creato',
      'sponsor_activated': 'Sponsor attivato',
      'contract_created': 'Contratto creato',
      'contract_expiring': 'Contratto in scadenza',
      'contract_expired': 'Contratto scaduto',
      'match_created': 'Partita creata',
      'match_starting': 'Partita in arrivo',
      'event_created': 'Evento creato',
      'event_registration': 'Iscrizione evento',
      'budget_threshold': 'Soglia budget',
      'payment_overdue': 'Pagamento scaduto',
      'message_received': 'Messaggio ricevuto',
      'cron': 'Programmato',
      'interval': 'Intervallo',
      'specific_date': 'Data specifica'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="automations-page">
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner"></div>
          <p>Caricamento automazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="automations-page">
      {/* Header */}
      <div className="automations-header">
        <div>
          <h1>Automazioni</h1>
          <p>Automatizza i tuoi flussi di lavoro</p>
        </div>
        <button
          className="btn-create-automation"
          onClick={() => navigate('/club/automations/new')}
        >
          <HiOutlinePlus size={20} />
          Nuova Automazione
        </button>
      </div>

      {/* Stats */}
      <div className="tp-stats-grid">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Automazioni Totali</div>
          <div className="tp-stat-value">{stats.total}</div>
          <div className="tp-stat-description">Workflow configurati</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Attive</div>
          <div className="tp-stat-value">{stats.active}</div>
          <div className="tp-stat-description">In esecuzione automatica</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Esecuzioni Totali</div>
          <div className="tp-stat-value">{stats.executions}</div>
          <div className="tp-stat-description">Azioni completate</div>
        </div>
      </div>

      {/* List */}
      {automations.length === 0 ? (
        <div className="automations-empty">
          <div className="automations-empty-icon">
            <HiOutlineBolt size={48} />
          </div>
          <h3>Nessuna automazione</h3>
          <p>Crea la tua prima automazione per automatizzare i flussi di lavoro</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <button
              className="btn-create-automation"
              onClick={() => navigate('/club/automations/new')}
            >
              <HiOutlinePlus size={20} />
              Crea Automazione
            </button>
          </div>
        </div>
      ) : (
        <div className="automations-list">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className={`automation-card ${!automation.abilitata ? 'disabled' : ''}`}
              onClick={() => navigate(`/club/automations/${automation.id}`)}
            >
              {/* Toggle */}
              <div className="automation-toggle" onClick={(e) => e.stopPropagation()}>
                <div
                  className={`toggle-switch ${automation.abilitata ? 'active' : ''}`}
                  onClick={(e) => handleToggle(automation, e)}
                />
              </div>

              {/* Info */}
              <div className="automation-info">
                <h3 className="automation-name">{automation.nome}</h3>
                <div className="automation-trigger">
                  <span className="trigger-badge">
                    <HiOutlineBolt size={12} />
                    {getTriggerLabel(automation.trigger_type)}
                  </span>
                  {automation.steps && (
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      • {automation.steps.length} azioni
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="automation-stats">
                <div className="automation-stat">
                  <div className="automation-stat-value">
                    {automation.executions_count || 0}
                  </div>
                  <div className="automation-stat-label">Esecuzioni</div>
                </div>
                <div className="automation-stat">
                  <div className="automation-stat-value" style={{ fontSize: '12px', fontWeight: 500 }}>
                    {formatDate(automation.last_run)}
                  </div>
                  <div className="automation-stat-label">Ultimo run</div>
                </div>
              </div>

              {/* Status */}
              <div className={`automation-status ${automation.last_status || 'none'}`}>
                {automation.last_status === 'completed' && <><HiOutlineCheckCircle size={14} /> Successo</>}
                {automation.last_status === 'failed' && <><HiOutlineXCircle size={14} /> Fallita</>}
                {automation.last_status === 'partial' && <><HiOutlineClock size={14} /> Parziale</>}
                {!automation.last_status && <span style={{ color: '#9CA3AF' }}>—</span>}
              </div>

              {/* Actions */}
              <div className="automation-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn-icon"
                  onClick={(e) => handleTest(automation, e)}
                  title="Test"
                >
                  <HiOutlinePlay size={16} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => navigate(`/club/automations/${automation.id}/edit`)}
                  title="Modifica"
                >
                  <HiOutlinePencil size={16} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={(e) => handleDelete(automation, e)}
                  title="Elimina"
                >
                  <HiOutlineTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Automations;
