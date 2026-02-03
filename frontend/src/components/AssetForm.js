import { useState } from 'react';
import '../styles/form.css';

function AssetForm({ onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    tipo_asset: '',
    categoria: 'led',
    descrizione: '',
    quantita: '',
    quantita_utilizzata: 0
  });
  const [errors, setErrors] = useState({});

  const categorie = [
    { value: 'led', label: 'LED' },
    { value: 'social', label: 'Social Media' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'biglietti', label: 'Biglietti' },
    { value: 'eventi', label: 'Eventi' },
    { value: 'merchandise', label: 'Merchandise' },
    { value: 'altro', label: 'Altro' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.tipo_asset.trim()) newErrors.tipo_asset = 'Inserisci il tipo di asset';
    // Quantità è ora opzionale
    if (formData.quantita && formData.quantita <= 0) newErrors.quantita = 'Inserisci una quantità valida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Mappa i campi del frontend ai campi del backend
    const submitData = {
      categoria: formData.categoria,
      nome: formData.tipo_asset, // Backend usa 'nome', non 'tipo_asset'
      descrizione: formData.descrizione,
      quantita_utilizzata: parseInt(formData.quantita_utilizzata) || 0
    };

    // Aggiungi quantita_totale solo se specificata
    if (formData.quantita) {
      submitData.quantita_totale = parseInt(formData.quantita);
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
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
        <label htmlFor="tipo_asset">
          Nome/Tipo Asset <span className="required">*</span>
        </label>
        <input
          type="text"
          id="tipo_asset"
          name="tipo_asset"
          value={formData.tipo_asset}
          onChange={handleChange}
          placeholder="es. Banner LED Curva Nord, Post Instagram, Biglietti VIP"
          className={errors.tipo_asset ? 'error' : ''}
        />
        {errors.tipo_asset && <span className="error-message">{errors.tipo_asset}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="descrizione">Descrizione</label>
        <textarea
          id="descrizione"
          name="descrizione"
          value={formData.descrizione}
          onChange={handleChange}
          rows="3"
          placeholder="Dettagli aggiuntivi sull'asset..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="quantita">
          Quantità Totale
        </label>
        <input
          type="number"
          id="quantita"
          name="quantita"
          value={formData.quantita}
          onChange={handleChange}
          placeholder="es. 10 (opzionale)"
          min="1"
          className={errors.quantita ? 'error' : ''}
        />
        {errors.quantita && <span className="error-message">{errors.quantita}</span>}
        <p className="form-hint">
          Numero totale di unità disponibili (es. 10 post, 50 biglietti) - Opzionale
        </p>
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
          {loading ? 'Salvataggio...' : 'Aggiungi Asset'}
        </button>
      </div>
    </form>
  );
}

export default AssetForm;
