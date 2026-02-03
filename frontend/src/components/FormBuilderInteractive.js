import React, { useState } from 'react';

const FormBuilderInteractive = ({ fields, onChange }) => {
  const [editingField, setEditingField] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const fieldTypes = [
    { type: 'text', icon: '🔤', label: 'Testo', color: '#4A90E2' },
    { type: 'email', icon: '📧', label: 'Email', color: '#7B68EE' },
    { type: 'tel', icon: '📱', label: 'Telefono', color: '#50C878' },
    { type: 'number', icon: '🔢', label: 'Numero', color: '#FF6B6B' },
    { type: 'textarea', icon: '📝', label: 'Testo Lungo', color: '#FFA500' },
    { type: 'select', icon: '☑️', label: 'Scelta Multipla', color: '#9B59B6' },
    { type: 'radio', icon: '⭕', label: 'Scelta Singola', color: '#E91E63' },
    { type: 'checkbox', icon: '✅', label: 'Checkbox', color: '#00BCD4' },
    { type: 'date', icon: '📅', label: 'Data', color: '#FF9800' }
  ];

  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    description: '',
    options: ''
  });

  const addField = (fieldType = null) => {
    const typeToAdd = fieldType || newField.type;
    const typeInfo = fieldTypes.find(ft => ft.type === typeToAdd);

    const field = {
      label: newField.label || `${typeInfo.label} ${fields.length + 1}`,
      type: typeToAdd,
      required: newField.required,
      placeholder: newField.placeholder,
      description: newField.description
    };

    if (['select', 'radio', 'checkbox'].includes(typeToAdd) && newField.options) {
      field.options = newField.options.split(',').map(opt => opt.trim()).filter(opt => opt);
    }

    onChange([...fields, field]);
    setNewField({
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      description: '',
      options: ''
    });
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
    if (editingField === index) setEditingField(null);
  };

  const updateField = (index, updates) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const duplicateField = (index) => {
    const fieldToDup = { ...fields[index] };
    fieldToDup.label = fieldToDup.label + ' (Copia)';
    onChange([...fields, fieldToDup]);
  };

  const moveField = (fromIndex, toIndex) => {
    const updated = [...fields];
    const [movedField] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedField);
    onChange(updated);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveField(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderPreviewField = (field, index) => {
    const commonStyle = {
      width: '100%',
      padding: '14px 16px',
      borderRadius: '10px',
      border: '2px solid #E5E7EB',
      fontSize: '15px',
      fontFamily: 'inherit',
      transition: 'all 0.2s'
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || 'Scrivi qui...'}
            rows="4"
            style={{ ...commonStyle, resize: 'vertical' }}
            disabled
          />
        );
      case 'select':
        return (
          <select style={commonStyle} disabled>
            <option>Seleziona...</option>
            {field.options?.map((opt, i) => (
              <option key={i}>{opt}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {field.options?.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', cursor: 'pointer' }}>
                <input type="radio" name={`preview-${index}`} style={{ width: '18px', height: '18px' }} disabled />
                {opt}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {field.options?.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '18px', height: '18px' }} disabled />
                {opt}
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            placeholder={field.placeholder || `Inserisci ${field.label.toLowerCase()}...`}
            style={commonStyle}
            disabled
          />
        );
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      border: '2px solid #E5E7EB',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '28px' }}>📝</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Costruisci il Form di Iscrizione</h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
            Trascina i campi per riordinarli • {fields.length} campo/i configurato/i
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '500px' }}>
        {/* Left: Builder */}
        <div style={{
          padding: '32px',
          borderRight: '2px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#3D3D3D', marginBottom: '16px' }}>
              🎨 Aggiungi Campo
            </h4>

            {/* Quick Add Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {fieldTypes.map((ft) => (
                <button
                  key={ft.type}
                  type="button"
                  onClick={() => {
                    setNewField({ ...newField, type: ft.type });
                    if (!['select', 'radio', 'checkbox'].includes(ft.type)) {
                      addField(ft.type);
                    }
                  }}
                  style={{
                    background: 'white',
                    border: `2px solid ${ft.color}`,
                    borderRadius: '12px',
                    padding: '16px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = ft.color;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 20px ${ft.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{ft.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#3D3D3D' }}>{ft.label}</span>
                </button>
              ))}
            </div>

            {/* Advanced Config (for select/radio/checkbox) */}
            {['select', 'radio', 'checkbox'].includes(newField.type) && newField.type !== 'text' && (
              <div style={{
                background: '#F9FAFB',
                borderRadius: '12px',
                padding: '20px',
                border: '2px dashed #E5E7EB'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#666', marginBottom: '12px' }}>
                  ⚙️ Configura Campo
                </h5>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="Nome del campo"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #E5E7EB',
                      fontSize: '14px'
                    }}
                  />

                  <input
                    type="text"
                    value={newField.options}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                    placeholder="Opzioni separate da virgola"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #E5E7EB',
                      fontSize: '14px'
                    }}
                  />

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={newField.required}
                      onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Campo obbligatorio
                  </label>

                  <button
                    type="button"
                    onClick={() => addField()}
                    style={{
                      background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                      color: '#3D3D3D',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Aggiungi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fields List */}
          {fields.length > 0 && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#3D3D3D', marginBottom: '16px' }}>
                📋 Campi Aggiunti ({fields.length})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {fields.map((field, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      background: draggedIndex === index ? '#F0FFF4' : '#F9FAFB',
                      border: draggedIndex === index ? '2px solid #7FFF00' : '2px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'move',
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    {/* Drag Handle */}
                    <div style={{ fontSize: '20px', color: '#999', cursor: 'grab', userSelect: 'none' }}>
                      ⋮⋮
                    </div>

                    {/* Icon */}
                    <span style={{ fontSize: '24px' }}>
                      {fieldTypes.find(ft => ft.type === field.type)?.icon || '📝'}
                    </span>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#3D3D3D', marginBottom: '4px' }}>
                        {field.label} {field.required && <span style={{ color: '#F44336' }}>*</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {fieldTypes.find(ft => ft.type === field.type)?.label || field.type}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingField(editingField === index ? null : index)}
                        style={{
                          background: '#E3F2FD',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        title="Modifica"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateField(index)}
                        style={{
                          background: '#F3E5F5',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        title="Duplica"
                      >
                        📋
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        style={{
                          background: '#FFD4D4',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        title="Elimina"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Panel */}
          {editingField !== null && fields[editingField] && (
            <div style={{
              background: '#FFF9E6',
              border: '2px solid #FFE082',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#666', marginBottom: '12px' }}>
                ✏️ Modifica "{fields[editingField].label}"
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  value={fields[editingField].label}
                  onChange={(e) => updateField(editingField, { label: e.target.value })}
                  placeholder="Nome campo"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #E5E7EB',
                    fontSize: '14px'
                  }}
                />

                <input
                  type="text"
                  value={fields[editingField].placeholder || ''}
                  onChange={(e) => updateField(editingField, { placeholder: e.target.value })}
                  placeholder="Testo segnaposto"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #E5E7EB',
                    fontSize: '14px'
                  }}
                />

                <input
                  type="text"
                  value={fields[editingField].description || ''}
                  onChange={(e) => updateField(editingField, { description: e.target.value })}
                  placeholder="Descrizione (opzionale)"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #E5E7EB',
                    fontSize: '14px'
                  }}
                />

                {['select', 'radio', 'checkbox'].includes(fields[editingField].type) && (
                  <input
                    type="text"
                    value={fields[editingField].options?.join(', ') || ''}
                    onChange={(e) => updateField(editingField, {
                      options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt)
                    })}
                    placeholder="Opzioni separate da virgola"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #E5E7EB',
                      fontSize: '14px'
                    }}
                  />
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666' }}>
                  <input
                    type="checkbox"
                    checked={fields[editingField].required || false}
                    onChange={(e) => updateField(editingField, { required: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Campo obbligatorio
                </label>

                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  style={{
                    background: '#7FFF00',
                    color: '#3D3D3D',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Fatto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div style={{
          padding: '32px',
          background: 'linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <span style={{ fontSize: '24px' }}>👁️</span>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#3D3D3D', margin: 0 }}>
              Anteprima Live
            </h4>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            border: '2px solid #E5E7EB',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
          }}>
            {fields.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '64px 32px',
                color: '#999'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  Nessun campo aggiunto
                </div>
                <div style={{ fontSize: '14px' }}>
                  Clicca su un tipo di campo per iniziare
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {fields.map((field, index) => (
                  <div key={index}>
                    <label style={{
                      display: 'block',
                      marginBottom: '10px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#3D3D3D'
                    }}>
                      {field.label} {field.required && <span style={{ color: '#F44336' }}>*</span>}
                    </label>

                    {field.description && (
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '10px',
                        lineHeight: 1.5
                      }}>
                        {field.description}
                      </div>
                    )}

                    {renderPreviewField(field, index)}
                  </div>
                ))}

                <button
                  type="button"
                  disabled
                  style={{
                    background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                    color: '#3D3D3D',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'not-allowed',
                    marginTop: '8px',
                    opacity: 0.7
                  }}
                >
                  Invia Iscrizione
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderInteractive;
