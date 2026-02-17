import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { workflowAPI } from '../services/api';
import {
  HiOutlineBolt, HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash,
  HiOutlinePencilSquare, HiOutlinePlay, HiOutlineDocumentText,
  HiOutlineXMark, HiOutlineEnvelope, HiOutlineClipboardDocumentList,
  HiOutlineBell, HiOutlineArrowRight, HiOutlineClock, HiOutlineGlobeAlt,
  HiOutlineAdjustmentsVertical, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineArrowPath, HiOutlineDocumentCheck, HiOutlineClipboardDocumentCheck,
  HiOutlineCalendarDays, HiOutlinePencil, HiOutlineMinusCircle,
  HiOutlineUserPlus, HiOutlineChevronDown, HiOutlineCheck,
  HiOutlineBuildingStorefront, HiOutlineCurrencyEuro, HiOutlineExclamationTriangle,
  HiOutlineCalendar, HiOutlineStar, HiOutlineRocketLaunch,
  HiOutlineChatBubbleBottomCenterText
} from 'react-icons/hi2';
import '../styles/template-style.css';
import '../styles/workflow-editor.css';

const STEP_ICONS = {
  send_email: HiOutlineEnvelope,
  create_task: HiOutlineClipboardDocumentList,
  create_notification: HiOutlineBell,
  update_lead_stage: HiOutlineArrowRight,
  update_lead_temperature: HiOutlineAdjustmentsVertical,
  delay: HiOutlineClock,
  condition: HiOutlineArrowPath,
  webhook: HiOutlineGlobeAlt,
  update_contract_status: HiOutlineDocumentCheck,
  update_task_status: HiOutlineClipboardDocumentCheck,
  create_calendar_event: HiOutlineCalendarDays,
  log_lead_activity: HiOutlinePencilSquare,
  update_lead_field: HiOutlinePencil,
  enroll_in_sequence: HiOutlineArrowPath,
  remove_from_sequence: HiOutlineMinusCircle,
  send_whatsapp: HiOutlineChatBubbleBottomCenterText,
};

const STEP_COLORS = {
  send_email: '#3B82F6',
  create_task: '#8B5CF6',
  create_notification: '#F59E0B',
  update_lead_stage: '#059669',
  update_lead_temperature: '#EA580C',
  delay: '#6B7280',
  condition: '#6366F1',
  webhook: '#0EA5E9',
  update_contract_status: '#059669',
  update_task_status: '#8B5CF6',
  create_calendar_event: '#3B82F6',
  log_lead_activity: '#6366F1',
  update_lead_field: '#EA580C',
  enroll_in_sequence: '#7C3AED',
  remove_from_sequence: '#DC2626',
  send_whatsapp: '#25D366',
};

const TRIGGER_ICONS = {
  lead_created: HiOutlineUserPlus,
  lead_stage_changed: HiOutlineArrowRight,
  lead_inactive: HiOutlineClock,
  lead_score_changed: HiOutlineStar,
  contract_created: HiOutlineDocumentCheck,
  contract_expiring: HiOutlineExclamationTriangle,
  contract_expired: HiOutlineXCircle,
  contract_status_changed: HiOutlineDocumentCheck,
  invoice_created: HiOutlineCurrencyEuro,
  invoice_overdue: HiOutlineExclamationTriangle,
  invoice_paid: HiOutlineCheckCircle,
  club_created: HiOutlineBuildingStorefront,
  task_created: HiOutlineClipboardDocumentList,
  task_completed: HiOutlineClipboardDocumentCheck,
  task_overdue: HiOutlineExclamationTriangle,
  booking_created: HiOutlineCalendar,
  booking_confirmed: HiOutlineCheckCircle,
  calendar_event_created: HiOutlineCalendarDays,
  scheduled: HiOutlineClock,
};

const TRIGGER_COLORS = {
  lead_created: '#3B82F6',
  lead_stage_changed: '#059669',
  lead_inactive: '#F59E0B',
  lead_score_changed: '#8B5CF6',
  contract_created: '#059669',
  contract_expiring: '#F59E0B',
  contract_expired: '#DC2626',
  contract_status_changed: '#6366F1',
  invoice_created: '#0EA5E9',
  invoice_overdue: '#DC2626',
  invoice_paid: '#059669',
  club_created: '#8B5CF6',
  task_created: '#6366F1',
  task_completed: '#059669',
  task_overdue: '#DC2626',
  booking_created: '#3B82F6',
  booking_confirmed: '#059669',
  calendar_event_created: '#0EA5E9',
  scheduled: '#6B7280',
};

function SVGConnector() {
  return (
    <div className="wf-connector-wrapper">
      <svg width="2" height="40" style={{ display: 'block' }}>
        <line x1="1" y1="0" x2="1" y2="32" stroke="#D1D5DB" strokeWidth="2" />
        <polygon points="-2,32 4,32 1,40" fill="#D1D5DB" />
      </svg>
    </div>
  );
}

function AdminWorkflowEditor() {
  const navigate = useNavigate();
  const { workflowId } = useParams();
  const { user, token } = getAuth();
  const isNew = !workflowId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [meta, setMeta] = useState({ trigger_types: [], action_types: [] });
  const [templates, setTemplates] = useState([]);

  // Workflow data
  const [nome, setNome] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [tipo, setTipo] = useState('workflow');
  const [abilitata, setAbilitata] = useState(false);
  const [triggerType, setTriggerType] = useState('');
  const [triggerConfig, setTriggerConfig] = useState({});
  const [steps, setSteps] = useState([]);
  const [seqExitReply, setSeqExitReply] = useState(true);
  const [seqExitConvert, setSeqExitConvert] = useState(true);

  // Panels & modals
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showStepTypeSelector, setShowStepTypeSelector] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [executionDetail, setExecutionDetail] = useState(null);

  // Drag
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadMeta();
    if (!isNew) loadWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadMeta = async () => {
    try {
      const [metaRes, tplRes] = await Promise.all([
        workflowAPI.getMeta(),
        workflowAPI.getTemplates(),
      ]);
      setMeta(metaRes.data);
      setTemplates(tplRes.data.templates || []);
    } catch (err) {
      console.error('Meta load error:', err);
    }
  };

  const loadWorkflow = async () => {
    try {
      const res = await workflowAPI.getById(workflowId);
      const wf = res.data;
      setNome(wf.nome);
      setDescrizione(wf.descrizione || '');
      setTipo(wf.tipo);
      setAbilitata(wf.abilitata);
      setTriggerType(wf.trigger_type);
      setTriggerConfig(wf.trigger_config || {});
      setSteps(wf.steps || []);
      setSeqExitReply(wf.sequence_exit_on_reply);
      setSeqExitConvert(wf.sequence_exit_on_convert);
    } catch (err) {
      setToast({ type: 'error', message: 'Errore caricamento workflow' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nome.trim() || !triggerType) {
      setToast({ type: 'error', message: 'Nome e trigger sono obbligatori' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        nome, descrizione, tipo, abilitata,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        steps: steps.map((s, i) => ({ ...s, order: i })),
        sequence_exit_on_reply: seqExitReply,
        sequence_exit_on_convert: seqExitConvert,
      };

      if (isNew) {
        const res = await workflowAPI.create(data);
        setToast({ type: 'success', message: 'Workflow creato' });
        navigate(`/admin/workflows/${res.data.workflow.id}`, { replace: true });
      } else {
        await workflowAPI.update(workflowId, data);
        setToast({ type: 'success', message: 'Workflow salvato' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Errore salvataggio' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (isNew) return;
    try {
      await workflowAPI.test(workflowId);
      setToast({ type: 'success', message: 'Test eseguito' });
    } catch (err) {
      setToast({ type: 'error', message: 'Errore nel test' });
    }
  };

  const loadExecutions = async () => {
    if (isNew) return;
    try {
      const res = await workflowAPI.getExecutions(workflowId, { per_page: 20 });
      setExecutions(res.data.executions || []);
      setShowLogPanel(true);
    } catch (err) {
      console.error('Load executions error:', err);
    }
  };

  const loadExecutionDetail = async (execId) => {
    try {
      const res = await workflowAPI.getExecutionDetail(execId);
      setExecutionDetail(res.data);
    } catch (err) {
      console.error('Load execution detail error:', err);
    }
  };

  // Step management
  const addStep = (type, insertIdx) => {
    const newStep = {
      id: `step_${Date.now()}`,
      type,
      config: {},
      order: insertIdx,
    };
    const newSteps = [...steps];
    newSteps.splice(insertIdx, 0, newStep);
    setSteps(newSteps);
    setShowStepTypeSelector(null);
    setEditingStep({ index: insertIdx, step: newStep });
  };

  const removeStep = (idx) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const updateStepConfig = (idx, config) => {
    const newSteps = [...steps];
    newSteps[idx] = { ...newSteps[idx], config };
    setSteps(newSteps);
  };

  // Drag handlers
  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const newSteps = [...steps];
    const [moved] = newSteps.splice(dragIdx, 1);
    newSteps.splice(dropIdx, 0, moved);
    setSteps(newSteps);
    setDragIdx(null);
  };

  const getTriggerMeta = () => meta.trigger_types.find(t => t.value === triggerType);
  const getActionMeta = (type) => meta.action_types.find(a => a.value === type);

  const getStepSummary = (step) => {
    const cfg = step.config || {};
    switch (step.type) {
      case 'send_email': return cfg.oggetto ? `Oggetto: ${cfg.oggetto}` : 'Email non configurata';
      case 'create_task': return cfg.titolo || 'Task non configurato';
      case 'create_notification': return cfg.titolo || 'Notifica non configurata';
      case 'update_lead_stage': return cfg.new_stage ? `Nuovo stage: ${cfg.new_stage}` : 'Non configurato';
      case 'update_lead_temperature': return cfg.new_temperatura ? `Temp: ${cfg.new_temperatura}` : 'Non configurato';
      case 'delay': {
        const parts = [];
        if (cfg.days) parts.push(`${cfg.days}g`);
        if (cfg.hours) parts.push(`${cfg.hours}h`);
        if (cfg.minutes) parts.push(`${cfg.minutes}m`);
        return parts.length > 0 ? `Attendi ${parts.join(' ')}` : 'Attesa non configurata';
      }
      case 'condition': return 'Valuta condizioni';
      case 'webhook': return cfg.url ? `${cfg.method || 'POST'} ${cfg.url}` : 'Webhook non configurato';
      case 'update_contract_status': return cfg.new_status ? `Stato: ${cfg.new_status}` : 'Non configurato';
      case 'update_task_status': return cfg.new_status ? `Stato: ${cfg.new_status}` : 'Non configurato';
      case 'create_calendar_event': return cfg.titolo || 'Evento non configurato';
      case 'log_lead_activity': return cfg.titolo || 'Attivita non configurata';
      case 'update_lead_field': return cfg.field_name ? `${cfg.field_name} = ${cfg.value || ''}` : 'Non configurato';
      case 'enroll_in_sequence': return cfg.workflow_id ? `Sequenza #${cfg.workflow_id}` : 'Non configurato';
      case 'remove_from_sequence': return cfg.workflow_id ? `Sequenza #${cfg.workflow_id}` : 'Non configurato';
      case 'send_whatsapp': return cfg.to ? `A: ${cfg.to}` : 'WhatsApp non configurato';
      default: return '';
    }
  };

  const getStepColor = (type) => STEP_COLORS[type] || '#6B7280';

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading"><div className="tp-spinner" /><p>Caricamento...</p></div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {toast && <div className={`tp-toast tp-toast-${toast.type}`}>{toast.message}</div>}

      {/* Back link */}
      <button
        onClick={() => navigate('/admin/workflows')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', color: '#6B7280', padding: 0, marginBottom: '20px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
      >
        <HiOutlineArrowLeft size={16} /> Torna alla lista
      </button>

      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Nuovo Workflow' : (nome || 'Workflow')}</h1>
          <p className="text-gray-500 mt-1">Configura trigger, azioni e flusso di automazione</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className={`wf-status-btn ${abilitata ? 'active' : 'inactive'}`}
            onClick={() => setAbilitata(!abilitata)}
          >
            {abilitata ? <HiOutlineCheckCircle size={16} /> : <HiOutlineXCircle size={16} />}
            {abilitata ? 'Attivo' : 'Inattivo'}
          </button>
          {!isNew && (
            <>
              <button className="tp-btn tp-btn-outline tp-btn-sm" onClick={handleTest}>
                <HiOutlinePlay size={16} /> Test
              </button>
              <button className="tp-btn tp-btn-outline tp-btn-sm" onClick={loadExecutions}>
                <HiOutlineDocumentText size={16} /> Log
              </button>
            </>
          )}
          <button
            className="tp-btn tp-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="tp-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="tp-form-group">
            <label className="tp-form-label">Nome workflow</label>
            <input
              className="tp-form-input"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome workflow..."
            />
          </div>
          <div className="tp-form-group">
            <label className="tp-form-label">Tipo</label>
            <div className="wf-type-row" style={{ marginBottom: 0 }}>
              <button
                className={`wf-type-btn ${tipo === 'workflow' ? 'active' : ''}`}
                onClick={() => setTipo('workflow')}
              >
                <HiOutlineBolt size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Workflow
              </button>
              <button
                className={`wf-type-btn ${tipo === 'email_sequence' ? 'active' : ''}`}
                onClick={() => setTipo('email_sequence')}
              >
                <HiOutlineEnvelope size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Sequenza Email
              </button>
            </div>
          </div>
        </div>

        <div className="tp-form-group" style={{ marginBottom: tipo === 'email_sequence' ? '16px' : 0 }}>
          <label className="tp-form-label">Descrizione</label>
          <textarea
            className="tp-form-textarea"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            placeholder="Descrizione (opzionale)..."
            rows={2}
          />
        </div>

        {/* Sequence settings */}
        {tipo === 'email_sequence' && (
          <div className="wf-sequence-settings" style={{ marginBottom: 0 }}>
            <h4>Impostazioni Sequenza</h4>
            <label>
              <input
                type="checkbox"
                checked={seqExitReply}
                onChange={(e) => setSeqExitReply(e.target.checked)}
              />
              Esci dalla sequenza se il lead risponde
            </label>
            <label>
              <input
                type="checkbox"
                checked={seqExitConvert}
                onChange={(e) => setSeqExitConvert(e.target.checked)}
              />
              Esci dalla sequenza se il lead viene convertito
            </label>
          </div>
        )}
      </div>

      {/* Flow Canvas */}
      <div className="tp-card wf-canvas">
        <div className="wf-flow">
          {/* Trigger Node */}
          <div className="wf-trigger-node" onClick={() => setShowTriggerModal(true)}>
            <div className="wf-trigger-card-header">
              <div className="wf-trigger-icon">
                <HiOutlineBolt size={20} />
              </div>
              <h3>{triggerType ? (getTriggerMeta()?.label || triggerType) : 'Seleziona Trigger'}</h3>
            </div>
            <p>
              {triggerType
                ? (getTriggerMeta()?.description || 'Clicca per configurare')
                : 'Clicca per selezionare quando attivare il workflow'}
            </p>
          </div>

          <SVGConnector />

          {/* Steps */}
          {steps.map((step, idx) => {
            const actionMeta = getActionMeta(step.type);
            const IconComponent = STEP_ICONS[step.type] || HiOutlineBolt;
            const color = getStepColor(step.type);

            return (
              <div key={step.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div
                  className={`wf-step-card ${dragIdx === idx ? 'dragging' : ''}`}
                  style={{ borderLeftColor: color }}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  onClick={() => setEditingStep({ index: idx, step })}
                >
                  <div className="wf-step-card-header">
                    <span className="wf-step-number">{idx + 1}</span>
                    <div className="wf-step-icon" style={{ background: `${color}15`, color }}>
                      <IconComponent size={18} />
                    </div>
                    <h4>{actionMeta?.label || step.type}</h4>
                  </div>
                  <p className="wf-step-summary" style={{ paddingLeft: '64px' }}>{getStepSummary(step)}</p>
                  <div className="wf-step-actions">
                    <button
                      className="wf-step-action-btn"
                      onClick={(e) => { e.stopPropagation(); setEditingStep({ index: idx, step }); }}
                    >
                      <HiOutlinePencilSquare size={14} />
                    </button>
                    <button
                      className="wf-step-action-btn delete"
                      onClick={(e) => { e.stopPropagation(); removeStep(idx); }}
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                </div>

                <SVGConnector />

                {/* Add step button between steps */}
                <button
                  className="wf-add-step-btn"
                  onClick={() => setShowStepTypeSelector(idx + 1)}
                >
                  <HiOutlinePlus size={16} />
                </button>

                <SVGConnector />
              </div>
            );
          })}

          {/* Add first/last step button */}
          {steps.length === 0 && (
            <button
              className="wf-add-step-btn"
              onClick={() => setShowStepTypeSelector(0)}
              style={{ width: '40px', height: '40px' }}
            >
              <HiOutlinePlus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Trigger Modal */}
      {showTriggerModal && (
        <TriggerModal
          triggerType={triggerType}
          triggerConfig={triggerConfig}
          triggerTypes={meta.trigger_types}
          onSelectTrigger={(value) => { setTriggerType(value); setTriggerConfig({}); }}
          onUpdateConfig={(name, value) => setTriggerConfig({ ...triggerConfig, [name]: value })}
          onClose={() => setShowTriggerModal(false)}
        />
      )}

      {/* Step Type Selector Modal */}
      {showStepTypeSelector !== null && (
        <div className="wf-modal-overlay" onClick={() => setShowStepTypeSelector(null)}>
          <div className="wf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <h3>Aggiungi Azione</h3>
            <div className="wf-step-type-grid">
              {meta.action_types.map(action => {
                const Icon = STEP_ICONS[action.value] || HiOutlineBolt;
                const color = STEP_COLORS[action.value] || action.color || '#6B7280';
                return (
                  <div
                    key={action.value}
                    className="wf-step-type-option"
                    onClick={() => addStep(action.value, showStepTypeSelector)}
                  >
                    <div className="wf-step-type-icon" style={{ background: `${color}15`, color }}>
                      <Icon size={22} />
                    </div>
                    <span>{action.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step Config Side Panel */}
      {editingStep && (
        <StepConfigPanel
          step={editingStep.step}
          actionMeta={getActionMeta(editingStep.step.type)}
          templates={templates}
          meta={meta}
          triggerType={triggerType}
          onSave={(config) => {
            updateStepConfig(editingStep.index, config);
            setEditingStep(null);
          }}
          onClose={() => setEditingStep(null)}
        />
      )}

      {/* Execution Log Panel */}
      <div className={`wf-log-panel ${showLogPanel ? 'open' : ''}`}>
        <div className="wf-log-panel-header">
          <h3>Log Esecuzioni</h3>
          <button className="wf-step-action-btn" onClick={() => { setShowLogPanel(false); setExecutionDetail(null); }}>
            <HiOutlineXMark size={18} />
          </button>
        </div>

        {executionDetail ? (
          <div>
            <button
              onClick={() => setExecutionDetail(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#6B7280', padding: 0, marginBottom: '12px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
            >
              <HiOutlineArrowLeft size={14} /> Torna alla lista
            </button>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
              Avviato: {formatDate(executionDetail.started_at)}<br/>
              Status: <span style={{ color: executionDetail.status === 'completed' ? '#059669' : '#DC2626', fontWeight: 600 }}>
                {executionDetail.status}
              </span>
            </div>
            {(executionDetail.steps || []).map((s, i) => (
              <div key={i} className="wf-log-item" style={{ cursor: 'default' }}>
                <span className={`wf-log-status ${s.status}`} />
                <strong style={{ fontSize: '13px', color: '#111827' }}>Step {i + 1}: {s.step_type}</strong>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Status: {s.status}
                  {s.error_message && <div style={{ color: '#DC2626' }}>Errore: {s.error_message}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          executions.length === 0 ? (
            <p style={{ color: '#6B7280', fontSize: '13px' }}>Nessuna esecuzione</p>
          ) : (
            executions.map(exec => (
              <div
                key={exec.id}
                className="wf-log-item"
                onClick={() => loadExecutionDetail(exec.id)}
              >
                <span className={`wf-log-status ${exec.status}`} />
                <span style={{ fontSize: '13px', color: '#111827' }}>
                  {formatDate(exec.started_at)}
                </span>
                <span style={{
                  fontSize: '12px', marginLeft: '8px',
                  color: exec.status === 'completed' ? '#059669' :
                         exec.status === 'failed' ? '#DC2626' : '#F59E0B'
                }}>
                  {exec.status}
                </span>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}


// ==================== Trigger Modal Component ====================

function TriggerModal({ triggerType, triggerConfig, triggerTypes, onSelectTrigger, onUpdateConfig, onClose }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedTrigger = triggerTypes.find(t => t.value === triggerType);
  const TriggerIcon = TRIGGER_ICONS[triggerType] || HiOutlineBolt;
  const triggerColor = TRIGGER_COLORS[triggerType] || '#6B7280';

  return (
    <div className="wf-modal-overlay" onClick={onClose}>
      <div className="wf-modal" onClick={e => e.stopPropagation()}>
        <h3>Configura Trigger</h3>

        <div className="wf-field">
          <label>Tipo Trigger</label>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                border: dropdownOpen ? '2px solid #111827' : triggerType ? '2px solid #85FF00' : '2px solid #E5E7EB',
                borderRadius: '8px', width: '100%',
                background: triggerType ? 'rgba(133, 255, 0, 0.08)' : 'white',
                cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box',
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: triggerType ? triggerColor : '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <TriggerIcon size={14} color="white" />
              </div>
              <span style={{
                flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500,
                color: triggerType ? '#1A1A1A' : '#9CA3AF',
              }}>
                {selectedTrigger?.label || 'Seleziona trigger...'}
              </span>
              <HiOutlineChevronDown
                size={14} color="#6B7280"
                style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}
              />
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200,
                maxHeight: '280px', overflowY: 'auto',
              }}>
                {triggerTypes.map(t => {
                  const isSelected = triggerType === t.value;
                  const Icon = TRIGGER_ICONS[t.value] || HiOutlineBolt;
                  const color = TRIGGER_COLORS[t.value] || '#6B7280';
                  return (
                    <div
                      key={t.value}
                      onClick={() => { onSelectTrigger(t.value); setDropdownOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px',
                        cursor: 'pointer', transition: 'background 0.15s',
                        background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                        borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent'; }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '6px', background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={14} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>{t.label}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{t.description}</div>
                      </div>
                      {isSelected && <HiOutlineCheck size={16} color="#85FF00" style={{ flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {triggerType && selectedTrigger?.config_fields?.map(field => (
          <div className="wf-field" key={field.name}>
            <label>{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={triggerConfig[field.name] || ''}
                onChange={(e) => onUpdateConfig(field.name, e.target.value)}
              >
                <option value="">Qualsiasi</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'number' ? (
              <input
                type="number"
                value={triggerConfig[field.name] || field.default || ''}
                onChange={(e) => onUpdateConfig(field.name, parseInt(e.target.value) || 0)}
              />
            ) : (
              <input
                type="text"
                value={triggerConfig[field.name] || ''}
                onChange={(e) => onUpdateConfig(field.name, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="wf-modal-footer">
          <button className="tp-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}


// ==================== Step Config Side Panel Component ====================

const TRIGGER_ENTITY_MAP = {
  lead_created: 'lead', lead_stage_changed: 'lead', lead_inactive: 'lead', lead_score_changed: 'lead',
  contract_created: 'contract', contract_expiring: 'contract', contract_expired: 'contract', contract_status_changed: 'contract',
  invoice_created: 'invoice', invoice_overdue: 'invoice', invoice_paid: 'invoice',
  task_created: 'task', task_completed: 'task', task_overdue: 'task',
  booking_created: 'booking', booking_confirmed: 'booking',
  club_created: 'club',
  calendar_event_created: 'calendar_event',
};

const ENTITY_VARIABLES = {
  lead: ['lead.id', 'lead.nome_club', 'lead.contatto_nome', 'lead.contatto_cognome', 'lead.contatto_email', 'lead.contatto_telefono', 'lead.stage', 'lead.temperatura', 'lead.valore_stimato', 'lead.fonte', 'lead.citta', 'lead.score'],
  contract: ['contract.id', 'contract.plan_type', 'contract.total_value', 'contract.status', 'contract.start_date', 'contract.end_date', 'club.nome', 'club.email'],
  invoice: ['invoice.id', 'invoice.invoice_number', 'invoice.amount', 'invoice.total_amount', 'invoice.status', 'invoice.due_date', 'club.nome', 'club.email'],
  task: ['task.id', 'task.titolo', 'task.tipo', 'task.priorita', 'task.stato', 'task.data_scadenza'],
  booking: ['booking.id', 'booking.nome', 'booking.cognome', 'booking.email', 'booking.nome_club', 'booking.data_ora'],
  club: ['club.id', 'club.nome', 'club.email', 'club.tipologia', 'club.account_attivo'],
  calendar_event: ['calendar_event.id', 'calendar_event.titolo', 'calendar_event.tipo', 'calendar_event.data_inizio'],
};

function StepConfigPanel({ step, actionMeta, templates, meta, triggerType, onSave, onClose }) {
  const [config, setConfig] = useState(step.config || {});

  const updateField = (name, value) => {
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const fields = actionMeta?.config_fields || [];
  const color = STEP_COLORS[step.type] || '#6B7280';

  // Entity type for condition fields and variables
  const entityType = TRIGGER_ENTITY_MAP[triggerType] || 'lead';
  const conditionFields = (meta?.condition_fields || {})[entityType] || [];
  const variables = ENTITY_VARIABLES[entityType] || ENTITY_VARIABLES.lead;

  const renderConditionBuilder = () => {
    const rules = config.conditions?.rules || [{ field: '', operator: 'equals', value: '' }];
    const logicOperator = config.conditions?.operator || 'AND';

    const updateRule = (idx, key, val) => {
      const newRules = [...rules];
      newRules[idx] = { ...newRules[idx], [key]: val };
      setConfig({ ...config, conditions: { operator: logicOperator, rules: newRules } });
    };

    const addRule = () => {
      setConfig({
        ...config,
        conditions: {
          operator: logicOperator,
          rules: [...rules, { field: '', operator: 'equals', value: '' }],
        },
      });
    };

    const removeRule = (idx) => {
      if (rules.length <= 1) return;
      const newRules = rules.filter((_, i) => i !== idx);
      setConfig({ ...config, conditions: { operator: logicOperator, rules: newRules } });
    };

    // Get the selected field meta for value input rendering
    const getFieldMeta = (fieldValue) => conditionFields.find(f => f.value === fieldValue);

    return (
      <>
        {rules.length > 1 && (
          <div className="tp-form-group">
            <label className="tp-form-label">Operatore logico</label>
            <select
              className="tp-form-select"
              value={logicOperator}
              onChange={(e) => setConfig({ ...config, conditions: { ...config.conditions, operator: e.target.value } })}
            >
              <option value="AND">AND (tutte le condizioni)</option>
              <option value="OR">OR (almeno una condizione)</option>
            </select>
          </div>
        )}

        {rules.map((rule, idx) => {
          const fieldMeta = getFieldMeta(rule.field);
          return (
            <div key={idx} style={{ padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '8px' }}>
              {idx > 0 && (
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#6B7280', marginBottom: '8px', fontWeight: 600 }}>
                  {logicOperator}
                </div>
              )}
              <div className="tp-form-group" style={{ marginBottom: '8px' }}>
                <label className="tp-form-label" style={{ fontSize: '12px' }}>Campo</label>
                <select
                  className="tp-form-select"
                  value={rule.field || ''}
                  onChange={(e) => updateRule(idx, 'field', e.target.value)}
                >
                  <option value="">Seleziona campo...</option>
                  {conditionFields.map(f => (
                    <option key={f.value} value={f.value}>{f.label} ({f.value})</option>
                  ))}
                </select>
              </div>

              <div className="tp-form-group" style={{ marginBottom: '8px' }}>
                <label className="tp-form-label" style={{ fontSize: '12px' }}>Operatore</label>
                <select
                  className="tp-form-select"
                  value={rule.operator || 'equals'}
                  onChange={(e) => updateRule(idx, 'operator', e.target.value)}
                >
                  <option value="equals">Uguale a</option>
                  <option value="not_equals">Diverso da</option>
                  <option value="contains">Contiene</option>
                  <option value="greater_than">Maggiore di</option>
                  <option value="less_than">Minore di</option>
                  <option value="is_empty">Vuoto</option>
                  <option value="is_not_empty">Non vuoto</option>
                </select>
              </div>

              {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                <div className="tp-form-group" style={{ marginBottom: '4px' }}>
                  <label className="tp-form-label" style={{ fontSize: '12px' }}>Valore</label>
                  {fieldMeta?.type === 'select' && fieldMeta.options ? (
                    <select
                      className="tp-form-select"
                      value={rule.value || ''}
                      onChange={(e) => updateRule(idx, 'value', e.target.value)}
                    >
                      <option value="">Seleziona...</option>
                      {fieldMeta.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : fieldMeta?.type === 'number' ? (
                    <input
                      className="tp-form-input"
                      type="number"
                      value={rule.value || ''}
                      onChange={(e) => updateRule(idx, 'value', e.target.value)}
                    />
                  ) : (
                    <input
                      className="tp-form-input"
                      type="text"
                      value={rule.value || ''}
                      onChange={(e) => updateRule(idx, 'value', e.target.value)}
                    />
                  )}
                </div>
              )}

              {rules.length > 1 && (
                <button
                  className="wf-step-action-btn delete"
                  onClick={() => removeRule(idx)}
                  style={{ marginTop: '4px', fontSize: '11px' }}
                >
                  <HiOutlineTrash size={12} /> Rimuovi
                </button>
              )}
            </div>
          );
        })}

        <button
          className="tp-btn tp-btn-outline tp-btn-sm"
          onClick={addRule}
          style={{ marginTop: '4px' }}
        >
          <HiOutlinePlus size={14} /> Aggiungi condizione
        </button>
      </>
    );
  };

  const renderFields = () => {
    // Condition type: custom UI
    if (step.type === 'condition') {
      return renderConditionBuilder();
    }

    // Generic fields
    return fields.map(field => (
      <div className="tp-form-group" key={field.name}>
        <label className="tp-form-label">{field.label}</label>
        {field.type === 'select' ? (
          <select
            className="tp-form-select"
            value={config[field.name] || ''}
            onChange={(e) => updateField(field.name, e.target.value)}
          >
            <option value="">Seleziona...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : field.type === 'number' ? (
          <input
            className="tp-form-input"
            type="number"
            value={config[field.name] || field.default || ''}
            onChange={(e) => updateField(field.name, parseInt(e.target.value) || 0)}
          />
        ) : field.type === 'textarea' || field.type === 'richtext' ? (
          <textarea
            className="tp-form-textarea"
            value={config[field.name] || ''}
            onChange={(e) => updateField(field.name, e.target.value)}
            rows={field.type === 'richtext' ? 6 : 3}
          />
        ) : field.type === 'template_select' ? (
          <select
            className="tp-form-select"
            value={config[field.name] || ''}
            onChange={(e) => updateField(field.name, e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Nessun template</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        ) : (
          <input
            className="tp-form-input"
            type="text"
            value={config[field.name] || ''}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.name === 'to' ? 'es. {{lead.contatto_email}}' : ''}
          />
        )}
      </div>
    ));
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)', zIndex: 899,
        }}
        onClick={onClose}
      />
      {/* Side Panel */}
      <div className="wf-side-panel open">
        <div className="wf-side-panel-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: color, display: 'inline-block',
            }} />
            Configura: {actionMeta?.label || step.type}
          </h3>
          <button className="wf-step-action-btn" onClick={onClose}>
            <HiOutlineXMark size={18} />
          </button>
        </div>

        <div className="wf-side-panel-body">
          {renderFields()}

          <div className="wf-variables-hint">
            <strong>Variabili disponibili ({entityType}):</strong><br />
            {variables.map((v, i) => (
              <span key={v}>
                <code>{`{{${v}}}`}</code>
                {i < variables.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="wf-side-panel-footer">
          <button className="tp-btn" onClick={onClose}>Annulla</button>
          <button className="tp-btn tp-btn-primary" onClick={() => onSave(config)}>Salva</button>
        </div>
      </div>
    </>
  );
}

export default AdminWorkflowEditor;
