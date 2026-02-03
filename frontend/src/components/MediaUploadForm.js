import { useState } from 'react';
import '../styles/form.css';

function MediaUploadForm({ onSubmit, onCancel, loading, contract }) {
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'promo',
    descrizione: '',
    tags: '',
    file: null
  });
  const [errors, setErrors] = useState({});

  const categorie = [
    { value: 'promo', label: 'Materiale Promo' },
    { value: 'evento', label: 'Eventi' },
    { value: 'social', label: 'Social Media' },
    { value: 'backstage', label: 'Backstage' },
    { value: 'prodotto', label: 'Prodotto' },
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

    if (!formData.nome.trim()) newErrors.nome = 'Inserisci il nome del media';
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
      tags: formData.tags,
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
          accept="image/*,video/*,.pdf"
          className={`file-input ${errors.file ? 'error' : ''}`}
        />
        {errors.file && <span className="error-message">{errors.file}</span>}
        <p className="form-hint">
          Formati supportati: Immagini (PNG, JPG, GIF), Video (MP4, MOV, AVI, WEBM), PDF
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="nome">
          Nome Media <span className="required">*</span>
        </label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          placeholder="es. Video Promo Campagna 2024"
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
        <label htmlFor="tags">Tags</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="es. promo, campagna, 2024"
        />
        <p className="form-hint">
          Separa i tag con virgole per facilitare la ricerca
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="descrizione">Descrizione</label>
        <textarea
          id="descrizione"
          name="descrizione"
          value={formData.descrizione}
          onChange={handleChange}
          rows="3"
          placeholder="Note aggiuntive sul media..."
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
          {loading ? 'Caricamento...' : 'Carica Media'}
        </button>
      </div>
    </form>
  );
}

export default MediaUploadForm;
