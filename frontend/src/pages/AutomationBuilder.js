/**
 * AutomationBuilder - Builder visuale drag & drop per automazioni
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { automationAPI } from '../services/automationAPI';
import '../styles/automation-builder.css';

import {
  HiOutlineArrowLeft,
  HiOutlinePlay,
  HiOutlineTrash,
  HiOutlineBolt,
  HiOutlineBell,
  HiOutlineEnvelope,
  HiOutlineClipboardDocumentList,
  HiOutlinePencil,
  HiOutlineGlobeAlt,
  HiOutlineClock,
  HiOutlineCodeBracket,
  HiOutlineVariable,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineArrowsUpDown
} from 'react-icons/hi2';

// Icone per i blocchi
const BLOCK_ICONS = {
  send_notification: HiOutlineBell,
  send_email: HiOutlineEnvelope,
  create_task: HiOutlineClipboardDocumentList,
  update_status: HiOutlinePencil,
  create_activity: HiOutlineClipboardDocumentList,
  webhook: HiOutlineGlobeAlt,
  delay: HiOutlineClock,
  condition: HiOutlineCodeBracket
};

const BLOCK_COLORS = {
  send_notification: '#4CAF50',
  send_email: '#2196F3',
  create_task: '#FF9800',
  update_status: '#9C27B0',
  create_activity: '#00BCD4',
  webhook: '#607D8B',
  delay: '#795548',
  condition: '#E91E63'
};

function AutomationBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = getAuth();
  const isEditing = !!id;

  // State
  const [automation, setAutomation] = useState({
    nome: 'Nuova Automazione',
    descrizione: '',
    trigger_type: '',
    trigger_config: {},
    steps: [],
    abilitata: true
  });
  const [triggers, setTriggers] = useState([]);
  const [actions, setActions] = useState([]);
  const [variables, setVariables] = useState({});
  const [selectedStep, setSelectedStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  // Canvas drag & pan state
  const canvasRef = useRef(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [blockPositions, setBlockPositions] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carica metadata
      const [triggersRes, actionsRes, variablesRes] = await Promise.all([
        automationAPI.getTriggerTypes(),
        automationAPI.getActionTypes(),
        automationAPI.getVariables()
      ]);

      setTriggers(triggersRes.data.triggers || []);
      setActions(actionsRes.data.actions || []);
      setVariables(variablesRes.data.variables || {});

      // Se editing, carica automazione
      if (id) {
        const automationRes = await automationAPI.getAutomation(id);
        setAutomation(automationRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!automation.nome || !automation.trigger_type) {
      alert('Nome e trigger sono obbligatori');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await automationAPI.updateAutomation(id, automation);
      } else {
        await automationAPI.createAutomation(automation);
      }
      navigate('/club/automations');
    } catch (error) {
      console.error('Error saving automation:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!id) {
      alert('Salva prima l\'automazione per testarla');
      return;
    }

    try {
      const result = await automationAPI.testAutomation(id);
      alert(`Test completato: ${result.data.execution?.status || 'OK'}`);
    } catch (error) {
      console.error('Error testing:', error);
      alert('Errore durante il test');
    }
  };

  const handleTriggerChange = (triggerType) => {
    const trigger = triggers.find(t => t.type === triggerType);
    setAutomation(prev => ({
      ...prev,
      trigger_type: triggerType,
      trigger_config: trigger?.config_fields?.reduce((acc, f) => {
        if (f.default !== undefined) acc[f.name] = f.default;
        return acc;
      }, {}) || {}
    }));
  };

  const handleAddStep = (actionType) => {
    const action = actions.find(a => a.type === actionType);
    const newStep = {
      id: Date.now(),
      type: actionType,
      config: action?.config_fields?.reduce((acc, f) => {
        if (f.default !== undefined) acc[f.name] = f.default;
        return acc;
      }, {}) || {},
      delay_minutes: 0
    };

    setAutomation(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));

    setSelectedStep(newStep.id);
  };

  const handleRemoveStep = (stepId) => {
    setAutomation(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId)
    }));
    if (selectedStep === stepId) {
      setSelectedStep(null);
    }
  };

  const handleMoveStep = (stepId, direction) => {
    setAutomation(prev => {
      const steps = [...prev.steps];
      const index = steps.findIndex(s => s.id === stepId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= steps.length) return prev;

      // Swap elements
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];

      return { ...prev, steps };
    });
  };

  const handleStepConfigChange = (stepId, field, value) => {
    setAutomation(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.id === stepId
          ? { ...s, config: { ...s.config, [field]: value } }
          : s
      )
    }));
  };

  const handleTriggerConfigChange = (field, value) => {
    setAutomation(prev => ({
      ...prev,
      trigger_config: { ...prev.trigger_config, [field]: value }
    }));
  };

  const insertVariable = (variable, field) => {
    const input = document.querySelector(`[data-field="${field}"]`);
    if (input) {
      const start = input.selectionStart || 0;
      const currentValue = automation.steps.find(s => s.id === selectedStep)?.config[field] || '';
      const newValue = currentValue.slice(0, start) + variable + currentValue.slice(start);
      handleStepConfigChange(selectedStep, field, newValue);
    }
  };

  // Get block position (with default)
  const getBlockPosition = (blockId, defaultPos) => {
    return blockPositions[blockId] || defaultPos;
  };

  // Block drag handlers
  const handleBlockMouseDown = (e, blockId) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    setDraggedBlock(blockId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Canvas pan handlers
  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-grid')) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && draggedBlock) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setBlockPositions(prev => {
        const currentPos = prev[draggedBlock] || { x: 0, y: 0 };
        return {
          ...prev,
          [draggedBlock]: {
            x: currentPos.x + dx,
            y: currentPos.y + dy
          }
        };
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isPanning) {
      setCanvasOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, isPanning, draggedBlock, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
    setDraggedBlock(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(Math.max(prev + delta, 0.25), 2));
    }
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.25));
  const handleZoomReset = () => {
    setZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  // Add/remove global mouse listeners
  useEffect(() => {
    if (isDragging || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isPanning, handleMouseMove, handleMouseUp]);

  const getSelectedStepAction = () => {
    if (!selectedStep) return null;
    const step = automation.steps.find(s => s.id === selectedStep);
    if (!step) return null;
    return actions.find(a => a.type === step.type);
  };

  const getTriggerConfig = () => {
    return triggers.find(t => t.type === automation.trigger_type);
  };

  if (loading) {
    return (
      <div className="automation-builder-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p>Caricamento builder...</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedAction = getSelectedStepAction();
  const triggerConfig = getTriggerConfig();

  return (
    <div className="automation-builder-page">
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        height: '64px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/club/automations')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginRight: '24px'
            }}
          >
            <HiOutlineArrowLeft size={16} />
            Indietro
          </button>
          <input
            type="text"
            value={automation.nome}
            onChange={(e) => setAutomation(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Nome automazione"
            style={{
              fontSize: '18px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              color: '#1A1A1A',
              outline: 'none',
              width: '300px',
              padding: '4px 0'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isEditing && (
            <button
              onClick={handleTest}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151'
              }}
            >
              <HiOutlinePlay size={16} />
              Test
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: '#1A1A1A',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {saving ? 'Salvataggio...' : 'Salva Automazione'}
          </button>
        </div>
      </header>

      {/* Builder */}
      <div className="automation-builder">
        {/* Toolbar */}
        <div className="builder-toolbar">
          <div className="toolbar-header">
            <h3>Blocchi</h3>
          </div>

          {/* Trigger Section */}
          <div className="toolbar-section">
            <div className="toolbar-section-title">Trigger</div>
            <select
              value={automation.trigger_type}
              onChange={(e) => handleTriggerChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                marginBottom: '12px'
              }}
            >
              <option value="">Seleziona trigger...</option>
              {triggers.map(trigger => (
                <option key={trigger.type} value={trigger.type}>
                  {trigger.label}
                </option>
              ))}
            </select>

            {/* Trigger config fields */}
            {triggerConfig?.config_fields?.map(field => (
              <div key={field.name} className="config-field" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={automation.trigger_config[field.name] || ''}
                    onChange={(e) => handleTriggerConfigChange(field.name, e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                  >
                    <option value="">Seleziona...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={automation.trigger_config[field.name] || ''}
                    onChange={(e) => handleTriggerConfigChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                  />
                )}
                {field.help && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{field.help}</div>
                )}
              </div>
            ))}
          </div>

          {/* Actions Section */}
          <div className="toolbar-section">
            <div className="toolbar-section-title">Azioni</div>
            {actions.map(action => {
              const Icon = BLOCK_ICONS[action.type] || HiOutlineBolt;
              return (
                <div
                  key={action.type}
                  className="block-item"
                  onClick={() => handleAddStep(action.type)}
                >
                  <div
                    className="block-icon"
                    style={{ backgroundColor: action.color || BLOCK_COLORS[action.type] || '#666' }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="block-item-info">
                    <div className="block-item-label">{action.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="builder-canvas"
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : 'grab', overflow: 'hidden', position: 'relative' }}
        >
          {/* Zoom Controls */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            gap: '8px',
            zIndex: 100,
            background: 'white',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={handleZoomOut}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={handleZoomReset}
              style={{
                padding: '0 12px',
                height: '32px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500
              }}
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Zoom in"
            >
              +
            </button>
          </div>
          {/* Zoomable Content Container */}
          <div style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}>
            {/* Canvas Grid (draggable background) */}
            <div
              className="canvas-grid"
              style={{
                position: 'absolute',
                width: '3000px',
                height: '3000px',
                left: canvasOffset.x - 1000,
                top: canvasOffset.y - 1000,
                backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                pointerEvents: 'none'
              }}
            />

          {/* Connection Lines */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              overflow: 'visible'
            }}
          >
            {automation.trigger_type && automation.steps.length > 0 && (() => {
              const triggerPos = getBlockPosition('trigger', { x: 300, y: 50 });
              const firstStepPos = getBlockPosition(automation.steps[0].id, { x: 300, y: 180 });

              const startX = triggerPos.x + canvasOffset.x + 140;
              const startY = triggerPos.y + canvasOffset.y + 85;
              const endX = firstStepPos.x + canvasOffset.x + 140;
              const endY = firstStepPos.y + canvasOffset.y;

              return (
                <path
                  d={`M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`}
                  stroke="#85FF00"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })()}

            {automation.steps.map((step, index) => {
              if (index === automation.steps.length - 1) return null;

              const currentPos = getBlockPosition(step.id, { x: 300, y: 180 + index * 140 });
              const nextPos = getBlockPosition(automation.steps[index + 1].id, { x: 300, y: 180 + (index + 1) * 140 });

              const startX = currentPos.x + canvasOffset.x + 140;
              const startY = currentPos.y + canvasOffset.y + 120;
              const endX = nextPos.x + canvasOffset.x + 140;
              const endY = nextPos.y + canvasOffset.y;

              return (
                <path
                  key={`line-${step.id}`}
                  d={`M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`}
                  stroke="#85FF00"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Trigger Node */}
          {automation.trigger_type && (() => {
            const pos = getBlockPosition('trigger', { x: 300, y: 50 });
            return (
              <div
                className="canvas-node trigger"
                style={{
                  left: pos.x + canvasOffset.x,
                  top: pos.y + canvasOffset.y,
                  cursor: isDragging && draggedBlock === 'trigger' ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => handleBlockMouseDown(e, 'trigger')}
              >
                <div className="node-header">
                  <div className="node-icon" style={{ backgroundColor: '#2196F3' }}>
                    <HiOutlineBolt size={20} />
                  </div>
                  <div className="node-title">
                    <h4>Trigger</h4>
                    <span>{triggers.find(t => t.type === automation.trigger_type)?.label}</span>
                  </div>
                </div>
                <div className="node-connectors">
                  <div className="connector-dot" />
                </div>
              </div>
            );
          })()}

          {/* Step Nodes */}
          {automation.steps.map((step, index) => {
            const action = actions.find(a => a.type === step.type);
            const Icon = BLOCK_ICONS[step.type] || HiOutlineBolt;
            const isSelected = selectedStep === step.id;
            const defaultPos = { x: 300, y: 180 + index * 140 };
            const pos = getBlockPosition(step.id, defaultPos);

            return (
              <div
                key={step.id}
                className={`canvas-node action ${isSelected ? 'selected' : ''}`}
                style={{
                  left: pos.x + canvasOffset.x,
                  top: pos.y + canvasOffset.y,
                  cursor: isDragging && draggedBlock === step.id ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => handleBlockMouseDown(e, step.id)}
                onClick={() => setSelectedStep(step.id)}
              >
                <div className="node-header">
                  <div
                    className="node-icon"
                    style={{ backgroundColor: action?.color || BLOCK_COLORS[step.type] || '#666' }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="node-title">
                    <h4>{action?.label || step.type}</h4>
                    <span>Step {index + 1}</span>
                  </div>
                  <button
                    className="node-delete"
                    onClick={(e) => { e.stopPropagation(); handleRemoveStep(step.id); }}
                    title="Elimina"
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
                <div className="node-body">
                  <div className="node-config-preview">
                    {step.config.titolo || step.config.to || step.config.url || 'Clicca per configurare'}
                  </div>
                </div>
                <div className="node-connectors">
                  <div className="connector-dot" />
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {!automation.trigger_type && automation.steps.length === 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#999'
            }}>
              <HiOutlineBolt size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>Seleziona un trigger dalla barra laterale per iniziare</p>
            </div>
          )}
          </div>{/* End Zoomable Content Container */}
        </div>

        {/* Config Panel */}
        <div className="builder-config">
          <div className="config-header">
            <h3>Configurazione</h3>
            {selectedStep && (
              <button
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => setShowVariables(!showVariables)}
              >
                <HiOutlineVariable size={14} />
                Variabili
                <HiOutlineChevronDown size={12} />
              </button>
            )}
          </div>

          <div className="config-body">
            {selectedStep && selectedAction ? (
              <>
                {/* Variables Picker */}
                {showVariables && (
                  <div className="variables-picker">
                    {Object.entries(variables).map(([category, vars]) => (
                      <div key={category} className="variables-category">
                        <div className="variables-category-title">{category}</div>
                        {vars.map(v => (
                          <div
                            key={v.var}
                            className="variable-item"
                            onClick={() => {
                              navigator.clipboard.writeText(v.var);
                              alert(`Variabile "${v.var}" copiata!`);
                            }}
                          >
                            <span className="variable-code">{v.var}</span>
                            <span className="variable-label">{v.label}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Config Fields */}
                <div className="config-section">
                  <div className="config-section-title">
                    {selectedAction.label}
                  </div>

                  {selectedAction.config_fields?.map(field => {
                    const step = automation.steps.find(s => s.id === selectedStep);
                    const value = step?.config[field.name] || '';

                    return (
                      <div key={field.name} className="config-field">
                        <label>
                          {field.label}
                          {field.required && <span style={{ color: 'red' }}> *</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={value}
                            onChange={(e) => handleStepConfigChange(selectedStep, field.name, e.target.value)}
                            data-field={field.name}
                          >
                            <option value="">Seleziona...</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' || field.type === 'richtext' ? (
                          <textarea
                            value={value}
                            onChange={(e) => handleStepConfigChange(selectedStep, field.name, e.target.value)}
                            placeholder={field.placeholder}
                            data-field={field.name}
                          />
                        ) : (
                          <input
                            type={field.type || 'text'}
                            value={value}
                            onChange={(e) => handleStepConfigChange(selectedStep, field.name, e.target.value)}
                            placeholder={field.placeholder}
                            data-field={field.name}
                          />
                        )}
                        {field.help && (
                          <div className="help-text">{field.help}</div>
                        )}
                      </div>
                    );
                  })}

                  {/* Delay Option */}
                  <div className="config-field" style={{ marginTop: '24px' }}>
                    <label>Ritardo (minuti)</label>
                    <input
                      type="number"
                      min="0"
                      value={automation.steps.find(s => s.id === selectedStep)?.delay_minutes || 0}
                      onChange={(e) => {
                        setAutomation(prev => ({
                          ...prev,
                          steps: prev.steps.map(s =>
                            s.id === selectedStep
                              ? { ...s, delay_minutes: parseInt(e.target.value) || 0 }
                              : s
                          )
                        }));
                      }}
                    />
                    <div className="help-text">
                      Esegui questo step dopo X minuti dal precedente
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="config-empty">
                <div className="config-empty-icon">⚙️</div>
                <p>Seleziona un blocco dal canvas per configurarlo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomationBuilder;
