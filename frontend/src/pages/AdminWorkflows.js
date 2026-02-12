import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { workflowAPI } from '../services/api';
import {
  HiOutlineBolt, HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash,
  HiOutlinePlay, HiOutlineClipboardDocumentList, HiOutlineFunnel,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock
} from 'react-icons/hi2';
import '../styles/template-style.css';

const TRIGGER_LABELS = {
  lead_created: 'Lead Creato',
  lead_stage_changed: 'Cambio Stage Lead',
  lead_inactive: 'Lead Inattivo',
  contract_expiring: 'Contratto in Scadenza',
  contract_expired: 'Contratto Scaduto',
  contract_created: 'Contratto Creato',
  invoice_overdue: 'Fattura Scaduta',
  club_created: 'Club Creato',
  task_overdue: 'Task Scaduto',
  booking_created: 'Demo Prenotata',
  scheduled: 'Schedulato',
};

function AdminWorkflows() {
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterTrigger, setFilterTrigger] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {};
      if (filterTrigger !== 'all') params.trigger_type = filterTrigger;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterTipo !== 'all') params.tipo = filterTipo;

      const [wfRes, statsRes] = await Promise.all([
        workflowAPI.getAll(params),
        workflowAPI.getStats(),
      ]);
      setWorkflows(wfRes.data.workflows || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, filterTrigger, filterStatus, filterTipo]);

  useEffect(() => {
    if (token) fetchAll();
  }, [fetchAll, token]);

  const handleToggle = async (wf) => {
    try {
      await workflowAPI.toggle(wf.id);
      setToast({ type: 'success', message: `Workflow ${wf.abilitata ? 'disabilitato' : 'abilitato'}` });
      fetchAll();
    } catch (err) {
      setToast({ type: 'error', message: 'Errore nel toggle' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await workflowAPI.delete(id);
      setToast({ type: 'success', message: 'Workflow eliminato' });
      setShowDeleteConfirm(null);
      fetchAll();
    } catch (err) {
      setToast({ type: 'error', message: 'Errore nell\'eliminazione' });
    }
  };

  const handleTest = async (wf) => {
    try {
      await workflowAPI.test(wf.id);
      setToast({ type: 'success', message: 'Test eseguito con successo' });
      fetchAll();
    } catch (err) {
      setToast({ type: 'error', message: 'Errore nel test' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading && workflows.length === 0) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner" />
          <p>Caricamento workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Toast */}
      {toast && (
        <div className={`tp-toast tp-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="tp-header">
        <div className="tp-header-left">
          <HiOutlineBolt size={28} />
          <div>
            <h1 className="tp-title">Automazioni</h1>
            <p className="tp-subtitle">Workflow e sequenze email automatiche</p>
          </div>
        </div>
        <button
          className="tp-btn tp-btn-primary"
          onClick={() => navigate('/admin/workflows/new')}
        >
          <HiOutlinePlus size={18} />
          Nuovo Workflow
        </button>
      </div>

      {/* Stats Cards */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="tp-stat-card">
          <div className="tp-stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
            <HiOutlineClipboardDocumentList size={24} />
          </div>
          <div className="tp-stat-info">
            <span className="tp-stat-value">{stats.totali || 0}</span>
            <span className="tp-stat-label">Totali</span>
          </div>
        </div>
        <div className="tp-stat-card">
          <div className="tp-stat-icon" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
            <HiOutlineCheckCircle size={24} />
          </div>
          <div className="tp-stat-info">
            <span className="tp-stat-value">{stats.attivi || 0}</span>
            <span className="tp-stat-label">Attivi</span>
          </div>
        </div>
        <div className="tp-stat-card">
          <div className="tp-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
            <HiOutlinePlay size={24} />
          </div>
          <div className="tp-stat-info">
            <span className="tp-stat-value">{stats.esecuzioni_totali || 0}</span>
            <span className="tp-stat-label">Esecuzioni</span>
          </div>
        </div>
        <div className="tp-stat-card">
          <div className="tp-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
            <HiOutlineBolt size={24} />
          </div>
          <div className="tp-stat-info">
            <span className="tp-stat-value">{stats.percentuale_successo || 0}%</span>
            <span className="tp-stat-label">Successo</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tp-filters" style={{ display: 'flex', gap: '12px', margin: '20px 0' }}>
        <select
          className="tp-select"
          value={filterTrigger}
          onChange={(e) => setFilterTrigger(e.target.value)}
        >
          <option value="all">Tutti i trigger</option>
          {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          className="tp-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tutti gli stati</option>
          <option value="active">Attivi</option>
          <option value="inactive">Inattivi</option>
        </select>
        <select
          className="tp-select"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="all">Tutti i tipi</option>
          <option value="workflow">Workflow</option>
          <option value="email_sequence">Sequenza Email</option>
        </select>
      </div>

      {/* Workflow List */}
      {workflows.length === 0 ? (
        <div className="tp-empty-state">
          <HiOutlineBolt size={48} style={{ color: '#6B7280' }} />
          <h3>Nessun workflow</h3>
          <p>Crea il tuo primo workflow automatico per velocizzare i processi</p>
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/admin/workflows/new')}
          >
            <HiOutlinePlus size={18} />
            Crea Workflow
          </button>
        </div>
      ) : (
        <div className="tp-card-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workflows.map(wf => (
            <div
              key={wf.id}
              className="tp-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
              }}
              onClick={() => navigate(`/admin/workflows/${wf.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <HiOutlineBolt size={20} style={{ color: wf.abilitata ? '#059669' : '#6B7280' }} />
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#E5E7EB' }}>
                      {wf.nome}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: wf.tipo === 'email_sequence' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                      color: wf.tipo === 'email_sequence' ? '#60A5FA' : '#A78BFA',
                    }}>
                      {wf.tipo === 'email_sequence' ? 'Sequenza Email' : 'Workflow'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 8px 30px' }}>
                    {wf.descrizione || TRIGGER_LABELS[wf.trigger_type] || wf.trigger_type}
                  </p>
                  <div style={{ display: 'flex', gap: '20px', marginLeft: '30px', fontSize: '12px', color: '#6B7280' }}>
                    <span><HiOutlineFunnel size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {TRIGGER_LABELS[wf.trigger_type] || wf.trigger_type}
                    </span>
                    <span><HiOutlinePlay size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {wf.executions_count || 0} esecuzioni
                    </span>
                    <span><HiOutlineClock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      Ultimo: {formatDate(wf.last_run)}
                    </span>
                    {wf.last_status && (
                      <span style={{
                        color: wf.last_status === 'completed' ? '#059669' :
                               wf.last_status === 'failed' ? '#DC2626' : '#F59E0B'
                      }}>
                        {wf.last_status === 'completed' ? 'Completato' :
                         wf.last_status === 'failed' ? 'Fallito' : wf.last_status}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                     onClick={(e) => e.stopPropagation()}>
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(wf)}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                      background: wf.abilitata ? '#059669' : '#374151',
                      cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '3px',
                      left: wf.abilitata ? '23px' : '3px',
                      transition: 'left 0.2s',
                    }} />
                  </button>

                  <button className="tp-btn-icon" onClick={() => navigate(`/admin/workflows/${wf.id}`)}>
                    <HiOutlinePencilSquare size={16} />
                  </button>
                  <button className="tp-btn-icon" onClick={() => handleTest(wf)}>
                    <HiOutlinePlay size={16} />
                  </button>
                  <button className="tp-btn-icon tp-btn-danger" onClick={() => setShowDeleteConfirm(wf.id)}>
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="tp-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="tp-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '12px' }}>Conferma Eliminazione</h3>
            <p style={{ color: '#9CA3AF', marginBottom: '20px' }}>
              Sei sicuro di voler eliminare questo workflow? L'azione non e reversibile.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="tp-btn" onClick={() => setShowDeleteConfirm(null)}>
                Annulla
              </button>
              <button className="tp-btn tp-btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWorkflows;
