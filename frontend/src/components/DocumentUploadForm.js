import { useState } from 'react';
import { getAuth } from '../utils/auth';
import '../styles/form.css';

function DocumentUploadForm({ onSubmit, onCancel, loading, contract }) {
  const { user } = getAuth();
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'brand_guidelines',
    descrizione: '',
    file: null
  });
  const [errors, setErrors] = useState({});

  const categorie = [
    { value: 'brand_guidelines', label: 'Brand Guidelines' },
    { value: 'led_graphics', label: 'LED Graphics' },
    { value: 'contratto', label: 'Contratto' },
    { value: 'fattura', label: 'Fattura' },
    { value: 'report', label: 'Report' },
    { value: 'altro', label: 'Altro' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, file, nome: prev.nome || file.name }));
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = 'Inserisci il nome del documento';
    if (!formData.file) newErrors.file = 'Seleziona un file da caricare';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      nome: formData.nome,
      categoria: formData.categoria,
      descrizione: formData.descrizione,
      file: formData.file
    });
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="form-group">
        <label htmlFor="file">
          File <span className="required">*</span>
        </label>
        <input
          type="file"
          id="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          className={`file-input ${errors.file ? 'error' : ''}`}
        />
        {errors.file && <span className="error-message">{errors.file}</span>}
        <p className="form-hint">
          Formati supportati: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="nome">
          Nome Documento <span className="required">*</span>
        </label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          placeholder="es. Brand Guidelines 2024"
          className={errors.nome ? 'error' : ''}
        />
        {errors.nome && <span className="error-message">{errors.nome}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="categoria">
          Categoria <span className="required">*</span>
        </label>
        <select
          id="categoria"
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
        >
          {categorie.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="descrizione">Descrizione</label>
        <textarea
          id="descrizione"
          name="descrizione"
          value={formData.descrizione}
          onChange={handleChange}
          rows="3"
          placeholder="Note aggiuntive sul documento..."
        />
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Annulla
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Caricamento...' : 'Carica Documento'}
        </button>
      </div>
    </form>
  );
}

export default DocumentUploadForm;
