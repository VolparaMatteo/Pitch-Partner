import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { workflowAPI } from '../services/api';
import {
  HiOutlineBolt, HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash,
  HiOutlinePencilSquare, HiOutlinePlay, HiOutlineDocumentText,
  HiOutlineXMark, HiOutlineEnvelope, HiOutlineClipboardDocumentList,
  HiOutlineBell, HiOutlineArrowRight, HiOutlineClock, HiOutlineGlobeAlt,
  HiOutlineAdjustmentsVertical, HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowPath
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
};

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

  // Modals
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showStepTypeSelector, setShowStepTypeSelector] = useState(null); // index or null
  const [editingStep, setEditingStep] = useState(null); // {index, step}
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
    const actionMeta = meta.action_types.find(a => a.value === type);
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
    // Open config immediately
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
      default: return '';
    }
  };

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

      {/* Back button */}
      <button
        className="tp-btn"
        onClick={() => navigate('/admin/workflows')}
        style={{ marginBottom: '16px' }}
      >
        <HiOutlineArrowLeft size={16} /> Torna alla lista
      </button>

      <div className="wf-editor">
        {/* Header */}
        <div className="wf-editor-header">
          <div className="wf-editor-header-left">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome workflow..."
            />
            <textarea
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Descrizione (opzionale)..."
              rows={1}
            />
          </div>
          <div className="wf-editor-actions">
            <button
              className="tp-btn"
              onClick={() => setAbilitata(!abilitata)}
              style={{
                background: abilitata ? 'rgba(5,150,105,0.15)' : 'rgba(255,255,255,0.05)',
                color: abilitata ? '#34D399' : '#9CA3AF',
                border: `1px solid ${abilitata ? 'rgba(5,150,105,0.3)' : 'rgba(255,255,255,0.08)'}`
              }}
            >
              {abilitata ? <HiOutlineCheckCircle size={16} /> : <HiOutlineXCircle size={16} />}
              {abilitata ? 'Attivo' : 'Inattivo'}
            </button>
            {!isNew && (
              <>
                <button className="tp-btn" onClick={handleTest}>
                  <HiOutlinePlay size={16} /> Test
                </button>
                <button className="tp-btn" onClick={loadExecutions}>
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

        {/* Type selector */}
        <div className="wf-type-row">
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Tipo:</span>
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

        {/* Sequence settings */}
        {tipo === 'email_sequence' && (
          <div className="wf-sequence-settings">
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

        {/* Flow */}
        <div className="wf-flow">
          {/* Trigger Card */}
          <div className="wf-trigger-card" onClick={() => setShowTriggerModal(true)}>
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

          <div className="wf-connector" />

          {/* Steps */}
          {steps.map((step, idx) => {
            const actionMeta = getActionMeta(step.type);
            const IconComponent = STEP_ICONS[step.type] || HiOutlineBolt;
            const color = actionMeta?.color || '#6B7280';

            return (
              <div key={step.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div
                  className={`wf-step-card ${dragIdx === idx ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  onClick={() => setEditingStep({ index: idx, step })}
                >
                  <div className="wf-step-card-header">
                    <div className="wf-step-icon" style={{ background: `${color}20`, color }}>
                      <IconComponent size={18} />
                    </div>
                    <h4>{actionMeta?.label || step.type}</h4>
                  </div>
                  <p className="wf-step-summary">{getStepSummary(step)}</p>
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

                <div className="wf-connector" />

                {/* Add step button between steps */}
                <button
                  className="wf-add-step-btn"
                  onClick={() => setShowStepTypeSelector(idx + 1)}
                >
                  <HiOutlinePlus size={18} />
                </button>

                <div className="wf-connector" />
              </div>
            );
          })}

          {/* Add first/last step button */}
          {steps.length === 0 && (
            <button
              className="wf-add-step-btn"
              onClick={() => setShowStepTypeSelector(0)}
              style={{ width: '48px', height: '48px' }}
            >
              <HiOutlinePlus size={22} />
            </button>
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Trigger Modal */}
      {showTriggerModal && (
        <div className="wf-modal-overlay" onClick={() => setShowTriggerModal(false)}>
          <div className="wf-modal" onClick={e => e.stopPropagation()}>
            <h3>Configura Trigger</h3>

            <div className="wf-field">
              <label>Tipo Trigger</label>
              <select
                value={triggerType}
                onChange={(e) => { setTriggerType(e.target.value); setTriggerConfig({}); }}
              >
                <option value="">Seleziona...</option>
                {meta.trigger_types.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {triggerType && getTriggerMeta()?.config_fields?.map(field => (
              <div className="wf-field" key={field.name}>
                <label>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={triggerConfig[field.name] || ''}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, [field.name]: e.target.value })}
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
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, [field.name]: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <input
                    type="text"
                    value={triggerConfig[field.name] || ''}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, [field.name]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <div className="wf-modal-footer">
              <button className="tp-btn" onClick={() => setShowTriggerModal(false)}>
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Type Selector Modal */}
      {showStepTypeSelector !== null && (
        <div className="wf-modal-overlay" onClick={() => setShowStepTypeSelector(null)}>
          <div className="wf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <h3>Aggiungi Azione</h3>
            <div className="wf-step-type-grid">
              {meta.action_types.map(action => {
                const Icon = STEP_ICONS[action.value] || HiOutlineBolt;
                return (
                  <div
                    key={action.value}
                    className="wf-step-type-option"
                    onClick={() => addStep(action.value, showStepTypeSelector)}
                  >
                    <div className="wf-step-type-icon" style={{ background: `${action.color}20`, color: action.color }}>
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

      {/* Step Config Modal */}
      {editingStep && (
        <StepConfigModal
          step={editingStep.step}
          actionMeta={getActionMeta(editingStep.step.type)}
          templates={templates}
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
            <button className="tp-btn" onClick={() => setExecutionDetail(null)} style={{ marginBottom: '12px' }}>
              <HiOutlineArrowLeft size={14} /> Torna alla lista
            </button>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '12px' }}>
              Avviato: {formatDate(executionDetail.started_at)}<br/>
              Status: <span style={{ color: executionDetail.status === 'completed' ? '#059669' : '#DC2626' }}>
                {executionDetail.status}
              </span>
            </div>
            {(executionDetail.steps || []).map((s, i) => (
              <div key={i} className="wf-log-item" style={{ cursor: 'default' }}>
                <span className={`wf-log-status ${s.status}`} />
                <strong style={{ fontSize: '13px', color: '#D1D5DB' }}>Step {i + 1}: {s.step_type}</strong>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Status: {s.status}
                  {s.error_message && <div style={{ color: '#F87171' }}>Errore: {s.error_message}</div>}
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
                <span style={{ fontSize: '13px', color: '#D1D5DB' }}>
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


// ==================== Step Config Modal Component ====================

function StepConfigModal({ step, actionMeta, templates, onSave, onClose }) {
  const [config, setConfig] = useState(step.config || {});

  const updateField = (name, value) => {
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const fields = actionMeta?.config_fields || [];

  // For condition type, provide a simple UI
  if (step.type === 'condition') {
    return (
      <div className="wf-modal-overlay" onClick={onClose}>
        <div className="wf-modal" onClick={e => e.stopPropagation()}>
          <h3>Configura Condizione</h3>

          <div className="wf-field">
            <label>Campo da verificare (es. lead.stage, lead.temperatura)</label>
            <input
              type="text"
              value={config.conditions?.rules?.[0]?.field || ''}
              onChange={(e) => setConfig({
                ...config,
                conditions: {
                  operator: 'AND',
                  rules: [{
                    field: e.target.value,
                    operator: config.conditions?.rules?.[0]?.operator || 'equals',
                    value: config.conditions?.rules?.[0]?.value || '',
                  }]
                }
              })}
            />
          </div>

          <div className="wf-field">
            <label>Operatore</label>
            <select
              value={config.conditions?.rules?.[0]?.operator || 'equals'}
              onChange={(e) => setConfig({
                ...config,
                conditions: {
                  operator: 'AND',
                  rules: [{
                    ...config.conditions?.rules?.[0],
                    operator: e.target.value,
                  }]
                }
              })}
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

          <div className="wf-field">
            <label>Valore</label>
            <input
              type="text"
              value={config.conditions?.rules?.[0]?.value || ''}
              onChange={(e) => setConfig({
                ...config,
                conditions: {
                  operator: 'AND',
                  rules: [{
                    ...config.conditions?.rules?.[0],
                    value: e.target.value,
                  }]
                }
              })}
            />
          </div>

          <div className="wf-modal-footer">
            <button className="tp-btn" onClick={onClose}>Annulla</button>
            <button className="tp-btn tp-btn-primary" onClick={() => onSave(config)}>Salva</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wf-modal-overlay" onClick={onClose}>
      <div className="wf-modal" onClick={e => e.stopPropagation()}>
        <h3>Configura: {actionMeta?.label || step.type}</h3>

        {fields.map(field => (
          <div className="wf-field" key={field.name}>
            <label>{field.label}</label>
            {field.type === 'select' ? (
              <select
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
                type="number"
                value={config[field.name] || field.default || ''}
                onChange={(e) => updateField(field.name, parseInt(e.target.value) || 0)}
              />
            ) : field.type === 'textarea' || field.type === 'richtext' ? (
              <textarea
                value={config[field.name] || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
                rows={field.type === 'richtext' ? 6 : 3}
              />
            ) : field.type === 'template_select' ? (
              <select
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
                type="text"
                value={config[field.name] || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
                placeholder={field.name === 'to' ? 'es. {{lead.contatto_email}}' : ''}
              />
            )}
          </div>
        ))}

        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
          Variabili disponibili: {'{{lead.nome_club}}'}, {'{{lead.contatto_email}}'}, {'{{lead.stage}}'}, {'{{contract.total_value}}'}, {'{{booking.email}}'}, {'{{club.nome}}'}
        </div>

        <div className="wf-modal-footer">
          <button className="tp-btn" onClick={onClose}>Annulla</button>
          <button className="tp-btn tp-btn-primary" onClick={() => onSave(config)}>Salva</button>
        </div>
      </div>
    </div>
  );
}

export default AdminWorkflowEditor;
