import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { workflowAPI } from '../services/api';
import {
  HiOutlineBolt, HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash,
  HiOutlinePlay, HiOutlineFunnel, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineClock, HiOutlineEnvelope, HiOutlineChevronDown, HiOutlineCheck
} from 'react-icons/hi2';
import '../styles/template-style.css';
import '../styles/workflow-editor.css';

const TRIGGER_LABELS = {
  lead_created: 'Lead Creato',
  lead_stage_changed: 'Cambio Stage Lead',
  lead_inactive: 'Lead Inattivo',
  lead_score_changed: 'Score Lead Cambiato',
  contract_expiring: 'Contratto in Scadenza',
  contract_expired: 'Contratto Scaduto',
  contract_created: 'Contratto Creato',
  contract_status_changed: 'Stato Contratto Cambiato',
  invoice_overdue: 'Fattura Scaduta',
  invoice_created: 'Fattura Creata',
  invoice_paid: 'Fattura Pagata',
  club_created: 'Club Creato',
  task_overdue: 'Task Scaduto',
  task_created: 'Task Creato',
  task_completed: 'Task Completato',
  booking_created: 'Demo Prenotata',
  booking_confirmed: 'Demo Confermata',
  calendar_event_created: 'Evento Calendario',
  scheduled: 'Schedulato',
};

const STATUS_OPTIONS = [
  { id: 'all', label: 'Tutti gli stati', icon: <HiOutlineFunnel size={14} />, color: '#6B7280' },
  { id: 'active', label: 'Attivi', icon: <HiOutlineCheckCircle size={14} />, color: '#059669' },
  { id: 'inactive', label: 'Inattivi', icon: <HiOutlineXCircle size={14} />, color: '#DC2626' },
];

const TIPO_OPTIONS = [
  { id: 'all', label: 'Tutti i tipi', icon: <HiOutlineBolt size={14} />, color: '#6B7280' },
  { id: 'workflow', label: 'Workflow', icon: <HiOutlineBolt size={14} />, color: '#7C3AED' },
  { id: 'email_sequence', label: 'Sequenza Email', icon: <HiOutlineEnvelope size={14} />, color: '#2563EB' },
];

const TRIGGER_OPTIONS = [
  { id: 'all', label: 'Tutti i trigger', icon: <HiOutlineFunnel size={14} />, color: '#6B7280' },
  ...Object.entries(TRIGGER_LABELS).map(([key, label]) => ({
    id: key, label, icon: <HiOutlineBolt size={14} />, color: '#F59E0B'
  })),
];

function AdminWorkflows() {
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTrigger, setFilterTrigger] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Custom dropdown states
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [tipoDropdownOpen, setTipoDropdownOpen] = useState(false);
  const [triggerDropdownOpen, setTriggerDropdownOpen] = useState(false);

  // Refs
  const statusDropdownRef = useRef(null);
  const tipoDropdownRef = useRef(null);
  const triggerDropdownRef = useRef(null);

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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (tipoDropdownRef.current && !tipoDropdownRef.current.contains(e.target)) {
        setTipoDropdownOpen(false);
      }
      if (triggerDropdownRef.current && !triggerDropdownRef.current.contains(e.target)) {
        setTriggerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {};
      if (filterTrigger !== 'all') params.trigger_type = filterTrigger;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterTipo !== 'all') params.tipo = filterTipo;

      const wfRes = await workflowAPI.getAll(params);
      setWorkflows(wfRes.data.workflows || []);
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

  const getSelectedOption = (options, value) => options.find(o => o.id === value) || options[0];

  const closeAllDropdowns = () => {
    setStatusDropdownOpen(false);
    setTipoDropdownOpen(false);
    setTriggerDropdownOpen(false);
  };

  const renderDropdown = (ref, options, value, setValue, isOpen, setIsOpen) => {
    const selected = getSelectedOption(options, value);
    const isFiltered = value !== 'all';

    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            closeAllDropdowns();
            setIsOpen(!isOpen);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            border: isFiltered ? '2px solid #111827' : '2px solid #E5E7EB',
            borderRadius: '8px',
            background: isFiltered ? 'rgba(17,24,39,0.04)' : 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: '150px'
          }}
        >
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: selected.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '12px'
          }}>
            {selected.icon}
          </div>
          <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
            {selected.label}
          </span>
          <HiOutlineChevronDown
            size={14}
            color="#6B7280"
            style={{
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
            }}
          />
        </button>
        {isOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: '4px',
            background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
            minWidth: '220px', overflow: 'hidden', maxHeight: '300px', overflowY: 'auto'
          }}>
            {options.map(option => {
              const isSelected = value === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => {
                    setValue(option.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', cursor: 'pointer',
                    background: isSelected ? 'rgba(17,24,39,0.06)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #111827' : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(17,24,39,0.06)' : 'transparent'; }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: option.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '14px'
                  }}>
                    {option.icon}
                  </div>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                    {option.label}
                  </span>
                  {isSelected && <HiOutlineCheck size={16} color="#111827" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
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
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automazioni</h1>
          <p className="text-gray-500 mt-1">Workflow e sequenze email automatiche</p>
        </div>
        <button
          className="tp-btn tp-btn-primary"
          onClick={() => navigate('/admin/workflows/new')}
        >
          <HiOutlinePlus size={18} />
          Nuovo Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            {renderDropdown(statusDropdownRef, STATUS_OPTIONS, filterStatus, setFilterStatus, statusDropdownOpen, setStatusDropdownOpen)}
            {renderDropdown(tipoDropdownRef, TIPO_OPTIONS, filterTipo, setFilterTipo, tipoDropdownOpen, setTipoDropdownOpen)}
            {renderDropdown(triggerDropdownRef, TRIGGER_OPTIONS, filterTrigger, setFilterTrigger, triggerDropdownOpen, setTriggerDropdownOpen)}
          </div>
        </div>

        {/* Workflow List */}
        {workflows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div className="tp-empty-icon">
              <HiOutlineBolt size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>Nessun workflow</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px' }}>
              Crea il tuo primo workflow automatico per velocizzare i processi
            </p>
            <button
              className="tp-btn tp-btn-primary"
              onClick={() => navigate('/admin/workflows/new')}
            >
              <HiOutlinePlus size={18} />
              Crea Workflow
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {workflows.map(wf => (
              <div
                key={wf.id}
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => navigate(`/admin/workflows/${wf.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <HiOutlineBolt size={20} style={{ color: wf.abilitata ? '#059669' : '#6B7280' }} />
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                        {wf.nome}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: wf.tipo === 'email_sequence' ? '#EFF6FF' : '#F5F3FF',
                        color: wf.tipo === 'email_sequence' ? '#2563EB' : '#7C3AED',
                      }}>
                        {wf.tipo === 'email_sequence' ? 'Sequenza Email' : 'Workflow'}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px 30px' }}>
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
                        background: wf.abilitata ? '#059669' : '#D1D5DB',
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
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="wf-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="wf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '12px' }}>Conferma Eliminazione</h3>
            <p style={{ color: '#6B7280', marginBottom: '20px' }}>
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
