import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { FaArrowLeft, FaArrowRight, FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function CreateOpportunity() {
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    tipo_opportunita: 'evento_speciale',
    categoria: 'sport',
    budget_richiesto: '',
    numero_sponsor_cercati: '1',
    data_inizio: '',
    data_fine: '',
    location: '',
    deadline_candidature: '',
    visibilita: 'community',
    stato: 'bozza',
    asset_richiesti: [],
    asset_forniti: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const navigate = useNavigate();
  const { user, token } = getAuth();

  const totalSteps = 4;
  const steps = [
    { number: 1, title: 'Generale' },
    { number: 2, title: 'Dettagli' },
    { number: 3, title: 'Asset' },
    { number: 4, title: 'Pubblica' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddAsset = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { categoria: '', descrizione: '' }]
    }));
  };

  const handleRemoveAsset = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleAssetChange = (type, index, field, value) => {
    const newAssets = [...formData[type]];
    newAssets[index] = { ...newAssets[index], [field]: value };
    setFormData(prev => ({ ...prev, [type]: newAssets }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.titolo.trim()) newErrors.titolo = 'Il titolo è obbligatorio';
      if (!formData.descrizione.trim()) newErrors.descrizione = 'La descrizione è obbligatoria';
    }

    if (step === 2) {
      if (formData.budget_richiesto && isNaN(formData.budget_richiesto)) {
        newErrors.budget_richiesto = 'Inserisci un numero valido';
      }
      if (formData.numero_sponsor_cercati && parseInt(formData.numero_sponsor_cercati) < 1) {
        newErrors.numero_sponsor_cercati = 'Almeno 1 sponsor richiesto';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    if (step <= currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);

    try {
      setLoading(true);

      const payload = {
        ...formData,
        budget_richiesto: formData.budget_richiesto ? parseFloat(formData.budget_richiesto) : null,
        numero_sponsor_cercati: parseInt(formData.numero_sponsor_cercati) || 1
      };

      const endpoint = user.role === 'sponsor'
        ? `${API_URL}/sponsor/marketplace/opportunities`
        : `${API_URL}/club/marketplace/opportunities`;

      await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToast({
        message: formData.stato === 'pubblicata'
          ? 'Opportunità pubblicata con successo!'
          : 'Bozza salvata con successo!',
        type: 'success'
      });

      setTimeout(() => {
        if (user.role === 'sponsor') {
          navigate('/sponsor/marketplace');
        } else {
          navigate('/club/marketplace');
        }
      }, 1500);
    } catch (error) {
      console.error('Errore creazione opportunità:', error);
      setToast({
        message: error.response?.data?.error || 'Errore durante la creazione',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <h1>Nuova Opportunità</h1>
        </div>
      </div>

      {/* Main Card */}
      <div className="sf-card">
        {/* Wizard Steps */}
        <div className="sf-wizard-steps">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`sf-step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
              onClick={() => goToStep(step.number)}
            >
              <div className="sf-step-number">
                {currentStep > step.number ? <FaCheck /> : step.number}
              </div>
              <span className="sf-step-title">{step.title}</span>
              {index < steps.length - 1 && <div className="sf-step-connector" />}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Informazioni Generali */}
          {currentStep === 1 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Informazioni Generali</h2>

              <div className="form-group">
                <label>Titolo <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => handleChange('titolo', e.target.value)}
                  placeholder="es. Torneo Padel Aziendale 2025"
                  className={errors.titolo ? 'error' : ''}
                />
                {errors.titolo && <span className="error-message">{errors.titolo}</span>}
              </div>

              <div className="form-group">
                <label>Descrizione <span className="required">*</span></label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => handleChange('descrizione', e.target.value)}
                  placeholder="Descrivi l'opportunità in dettaglio..."
                  rows={6}
                  className={errors.descrizione ? 'error' : ''}
                />
                {errors.descrizione && <span className="error-message">{errors.descrizione}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo Opportunità</label>
                  <select
                    value={formData.tipo_opportunita}
                    onChange={(e) => handleChange('tipo_opportunita', e.target.value)}
                  >
                    <option value="evento_speciale">Evento Speciale</option>
                    <option value="campagna_promozionale">Campagna Promozionale</option>
                    <option value="progetto_csr">Progetto CSR</option>
                    <option value="co_branding">Co-Branding</option>
                    <option value="attivazione_speciale">Attivazione Speciale</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                  >
                    <option value="sport">Sport</option>
                    <option value="sociale">Sociale</option>
                    <option value="business">Business</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dettagli & Budget */}
          {currentStep === 2 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Dettagli & Budget</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget Richiesto (€)</label>
                  <input
                    type="number"
                    value={formData.budget_richiesto}
                    onChange={(e) => handleChange('budget_richiesto', e.target.value)}
                    placeholder="15000"
                    className={errors.budget_richiesto ? 'error' : ''}
                  />
                  {errors.budget_richiesto && <span className="error-message">{errors.budget_richiesto}</span>}
                </div>

                <div className="form-group">
                  <label>Numero Sponsor Cercati</label>
                  <input
                    type="number"
                    value={formData.numero_sponsor_cercati}
                    onChange={(e) => handleChange('numero_sponsor_cercati', e.target.value)}
                    min="1"
                    className={errors.numero_sponsor_cercati ? 'error' : ''}
                  />
                  {errors.numero_sponsor_cercati && <span className="error-message">{errors.numero_sponsor_cercati}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data Inizio</label>
                  <input
                    type="date"
                    value={formData.data_inizio}
                    onChange={(e) => handleChange('data_inizio', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Data Fine</label>
                  <input
                    type="date"
                    value={formData.data_fine}
                    onChange={(e) => handleChange('data_fine', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deadline Candidature</label>
                  <input
                    type="datetime-local"
                    value={formData.deadline_candidature}
                    onChange={(e) => handleChange('deadline_candidature', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Milano, Italia"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Asset */}
          {currentStep === 3 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Asset</h2>

              {/* Asset Richiesti */}
              <div className="sf-subsection">
                <div className="sf-subsection-header">
                  <h3>Asset Richiesti</h3>
                  <button
                    type="button"
                    className="sf-btn sf-btn-outline sf-btn-sm"
                    onClick={() => handleAddAsset('asset_richiesti')}
                  >
                    <FaPlus />
                    Aggiungi
                  </button>
                </div>

                {formData.asset_richiesti.length === 0 ? (
                  <div className="sf-empty-assets">
                    Nessun asset richiesto aggiunto
                  </div>
                ) : (
                  <div className="sf-assets-list">
                    {formData.asset_richiesti.map((asset, index) => (
                      <div key={index} className="sf-asset-row">
                        <input
                          type="text"
                          placeholder="Categoria (es. LED)"
                          value={asset.categoria}
                          onChange={(e) => handleAssetChange('asset_richiesti', index, 'categoria', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Descrizione (es. 2 minuti a partita)"
                          value={asset.descrizione}
                          onChange={(e) => handleAssetChange('asset_richiesti', index, 'descrizione', e.target.value)}
                          style={{ flex: 2 }}
                        />
                        <button
                          type="button"
                          className="sf-btn-icon sf-btn-icon-delete"
                          onClick={() => handleRemoveAsset('asset_richiesti', index)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Asset Forniti */}
              <div className="sf-subsection">
                <div className="sf-subsection-header">
                  <h3>Asset Forniti (Opzionale)</h3>
                  <button
                    type="button"
                    className="sf-btn sf-btn-outline sf-btn-sm"
                    onClick={() => handleAddAsset('asset_forniti')}
                  >
                    <FaPlus />
                    Aggiungi
                  </button>
                </div>

                {formData.asset_forniti.length === 0 ? (
                  <div className="sf-empty-assets">
                    Nessun asset fornito aggiunto
                  </div>
                ) : (
                  <div className="sf-assets-list">
                    {formData.asset_forniti.map((asset, index) => (
                      <div key={index} className="sf-asset-row">
                        <input
                          type="text"
                          placeholder="Categoria (es. Hospitality)"
                          value={asset.categoria}
                          onChange={(e) => handleAssetChange('asset_forniti', index, 'categoria', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Descrizione (es. 2 pass VIP)"
                          value={asset.descrizione}
                          onChange={(e) => handleAssetChange('asset_forniti', index, 'descrizione', e.target.value)}
                          style={{ flex: 2 }}
                        />
                        <button
                          type="button"
                          className="sf-btn-icon sf-btn-icon-delete"
                          onClick={() => handleRemoveAsset('asset_forniti', index)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Pubblicazione */}
          {currentStep === 4 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Pubblicazione</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Visibilità</label>
                  <select
                    value={formData.visibilita}
                    onChange={(e) => handleChange('visibilita', e.target.value)}
                  >
                    <option value="community">Community - Tutti gli sponsor Pitch Partner</option>
                    <option value="private">Privata - Solo i miei sponsor</option>
                  </select>
                  <span className="form-hint">
                    {formData.visibilita === 'community'
                      ? 'L\'opportunità sarà visibile a tutti gli sponsor registrati sulla piattaforma.'
                      : 'L\'opportunità sarà visibile solo agli sponsor che hai già invitato o con cui collabori.'}
                  </span>
                </div>

                <div className="form-group">
                  <label>Stato</label>
                  <select
                    value={formData.stato}
                    onChange={(e) => handleChange('stato', e.target.value)}
                  >
                    <option value="bozza">Bozza - Salva senza pubblicare</option>
                    <option value="pubblicata">Pubblicata - Pubblica subito</option>
                  </select>
                  <span className="form-hint">
                    {formData.stato === 'pubblicata'
                      ? 'L\'opportunità sarà immediatamente attiva e visibile.'
                      : 'L\'opportunità sarà salvata come bozza e potrai pubblicarla in seguito.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="sf-form-actions">
            <div className="sf-actions-left">
              {currentStep > 1 && (
                <button type="button" className="sf-btn sf-btn-outline" onClick={prevStep}>
                  <FaArrowLeft />
                  Indietro
                </button>
              )}
            </div>

            <div className="sf-actions-right">
              <button type="button" className="sf-btn sf-btn-outline" onClick={() => navigate(-1)}>
                Annulla
              </button>

              {currentStep < totalSteps ? (
                <button type="button" className="sf-btn sf-btn-primary" onClick={nextStep}>
                  Avanti
                  <FaArrowRight />
                </button>
              ) : (
                <button type="submit" className="sf-btn sf-btn-success" disabled={loading}>
                  {loading ? 'Salvataggio...' : (formData.stato === 'pubblicata' ? 'Pubblica Opportunità' : 'Salva Bozza')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Conferma Creazione"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6b7280' }}>
            {formData.stato === 'pubblicata'
              ? `Sei sicuro di voler pubblicare l'opportunità "${formData.titolo}"?`
              : `Sei sicuro di voler salvare la bozza "${formData.titolo}"?`
            }
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="sf-btn sf-btn-outline"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmedSubmit}
              className="sf-btn sf-btn-success"
            >
              {formData.stato === 'pubblicata' ? 'Pubblica' : 'Salva Bozza'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default CreateOpportunity;
