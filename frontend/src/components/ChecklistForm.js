import { useState } from 'react';
import { getAuth } from '../utils/auth';
import '../styles/form.css';

function ChecklistForm({ onSubmit, onCancel, loading }) {
  const { user } = getAuth();
  const isClub = user?.role === 'club';

  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    assegnato_a: isClub ? 'sponsor' : 'club',
    scadenza: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.titolo.trim()) newErrors.titolo = 'Inserisci il titolo del task';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      titolo: formData.titolo,
      descrizione: formData.descrizione,
      assegnato_a: formData.assegnato_a,
      completato: false
    };

    if (formData.scadenza) {
      submitData.scadenza = formData.scadenza;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="form-group">
        <label htmlFor="titolo">
          Titolo Task <span className="required">*</span>
        </label>
        <input
          type="text"
          id="titolo"
          name="titolo"
          value={formData.titolo}
          onChange={handleChange}
          placeholder="es. Invio materiale grafico per LED"
          className={errors.titolo ? 'error' : ''}
        />
        {errors.titolo && <span className="error-message">{errors.titolo}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="descrizione">Descrizione</label>
        <textarea
          id="descrizione"
          name="descrizione"
          value={formData.descrizione}
          onChange={handleChange}
          rows="3"
          placeholder="Dettagli e istruzioni per completare il task..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="assegnato_a">
          Assegnato a <span className="required">*</span>
        </label>
        <select
          id="assegnato_a"
          name="assegnato_a"
          value={formData.assegnato_a}
          onChange={handleChange}
        >
          <option value="club">🏟️ Club</option>
          <option value="sponsor">💼 Sponsor</option>
        </select>
        <p className="form-hint">
          Chi deve completare questo task
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="scadenza">Scadenza (opzionale)</label>
        <input
          type="date"
          id="scadenza"
          name="scadenza"
          value={formData.scadenza}
          onChange={handleChange}
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
          {loading ? 'Salvataggio...' : 'Aggiungi Task'}
        </button>
      </div>
    </form>
  );
}

export default ChecklistForm;
