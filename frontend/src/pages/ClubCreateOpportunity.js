import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { FaArrowLeft, FaArrowRight, FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ClubCreateOpportunity() {
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [publishOnConfirm, setPublishOnConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    tipo_opportunita: 'evento_speciale',
    categoria: 'sport',
    budget_richiesto: '',
    numero_sponsor_cercati: 1,
    data_inizio: '',
    data_fine: '',
    location: '',
    location_city: '',
    location_province: '',
    location_region: '',
    location_country: 'Italia',
    location_lat: null,
    location_lng: null,
    deadline_candidature: '',
    visibilita: 'community',
    asset_richiesti: [],
    asset_forniti: []
  });

  const [errors, setErrors] = useState({});

  const totalSteps = 4;
  const steps = [
    { number: 1, title: 'Generale' },
    { number: 2, title: 'Dettagli' },
    { number: 3, title: 'Timeline' },
    { number: 4, title: 'Asset' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
    }
  }, [user, navigate]);

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

  const handleSubmit = (e, publish = true) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    setPublishOnConfirm(publish);
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);

    try {
      setLoading(true);

      const payload = {
        ...formData,
        budget_richiesto: formData.budget_richiesto ? parseFloat(formData.budget_richiesto) : null,
        numero_sponsor_cercati: parseInt(formData.numero_sponsor_cercati) || 1,
        stato: publishOnConfirm ? 'pubblicata' : 'bozza'
      };

      await axios.post(`${API_URL}/club/marketplace/opportunities`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToast({
        message: publishOnConfirm
          ? 'Opportunità pubblicata con successo!'
          : 'Bozza salvata con successo!',
        type: 'success'
      });

      setTimeout(() => {
        navigate('/club/marketplace');
      }, 1500);

    } catch (error) {
      console.error('Errore:', error);
      setToast({
        message: error.response?.data?.error || 'Errore durante il salvataggio',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const categorieAsset = [
    'LED Board', 'Social Media', 'Hospitality', 'Tickets', 'Branding',
    'Product Placement', 'Merchandise', 'Content Creation', 'Altro'
  ];

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate('/club/marketplace')}>
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
        <form onSubmit={(e) => handleSubmit(e, true)}>
          {/* Step 1: Informazioni Generali */}
          {currentStep === 1 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Informazioni Generali</h2>

              <div className="form-group">
                <label>Titolo Opportunità <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => handleChange('titolo', e.target.value)}
                  placeholder="es. Sponsorizzazione Derby Cittadino 2025"
                  className={errors.titolo ? 'error' : ''}
                />
                {errors.titolo && <span className="error-message">{errors.titolo}</span>}
              </div>

              <div className="form-group">
                <label>Descrizione <span className="required">*</span></label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => handleChange('descrizione', e.target.value)}
                  placeholder="Descrivi l'opportunità in dettaglio: obiettivi, target, benefici per lo sponsor..."
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
                    placeholder="10000"
                    min="0"
                    className={errors.budget_richiesto ? 'error' : ''}
                  />
                  <span className="form-hint">Lascia vuoto se il budget è da definire</span>
                  {errors.budget_richiesto && <span className="error-message">{errors.budget_richiesto}</span>}
                </div>

                <div className="form-group">
                  <label>Numero Partner Cercati</label>
                  <input
                    type="number"
                    value={formData.numero_sponsor_cercati}
                    onChange={(e) => handleChange('numero_sponsor_cercati', e.target.value)}
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <AddressAutocomplete
                  value={formData.location}
                  placeholder="Cerca indirizzo, stadio, città..."
                  onChange={(locationData) => {
                    if (locationData) {
                      setFormData(prev => ({
                        ...prev,
                        location: locationData.location,
                        location_city: locationData.location_city,
                        location_province: locationData.location_province,
                        location_region: locationData.location_region,
                        location_country: locationData.location_country,
                        location_lat: locationData.location_lat,
                        location_lng: locationData.location_lng
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        location: '',
                        location_city: '',
                        location_province: '',
                        location_region: '',
                        location_country: 'Italia',
                        location_lat: null,
                        location_lng: null
                      }));
                    }
                  }}
                />
              </div>

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
            </div>
          )}

          {/* Step 3: Timeline */}
          {currentStep === 3 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Timeline</h2>

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

              <div className="form-group">
                <label>Deadline Candidature</label>
                <input
                  type="datetime-local"
                  value={formData.deadline_candidature}
                  onChange={(e) => handleChange('deadline_candidature', e.target.value)}
                />
                <span className="form-hint">Dopo questa data, non sarà più possibile candidarsi</span>
              </div>
            </div>
          )}

          {/* Step 4: Asset */}
          {currentStep === 4 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Asset</h2>

              {/* Asset Richiesti */}
              <div className="sf-subsection">
                <div className="sf-subsection-header">
                  <h4>Asset Richiesti agli Sponsor</h4>
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
                    <FaPlus />
                    <p>Nessun asset richiesto aggiunto</p>
                  </div>
                ) : (
                  <div className="sf-assets-list">
                    {formData.asset_richiesti.map((asset, index) => (
                      <div key={index} className="sf-asset-row">
                        <select
                          value={asset.categoria}
                          onChange={(e) => handleAssetChange('asset_richiesti', index, 'categoria', e.target.value)}
                        >
                          <option value="">Seleziona categoria</option>
                          {categorieAsset.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="text"
                          placeholder="Descrizione (es. 2 LED board per partita)"
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
                  <h4>Asset Forniti dal Club</h4>
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
                    <FaPlus />
                    <p>Nessun asset fornito aggiunto</p>
                  </div>
                ) : (
                  <div className="sf-assets-list">
                    {formData.asset_forniti.map((asset, index) => (
                      <div key={index} className="sf-asset-row">
                        <select
                          value={asset.categoria}
                          onChange={(e) => handleAssetChange('asset_forniti', index, 'categoria', e.target.value)}
                        >
                          <option value="">Seleziona categoria</option>
                          {categorieAsset.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="text"
                          placeholder="Descrizione (es. Visibilità social 50k followers)"
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
              <button type="button" className="sf-btn sf-btn-outline" onClick={() => navigate('/club/marketplace')}>
                Annulla
              </button>

              {currentStep < totalSteps ? (
                <button type="button" className="sf-btn sf-btn-primary" onClick={nextStep}>
                  Avanti
                  <FaArrowRight />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="sf-btn sf-btn-outline"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={loading}
                  >
                    Salva Bozza
                  </button>
                  <button type="submit" className="sf-btn sf-btn-success" disabled={loading}>
                    {loading ? 'Pubblicazione...' : 'Pubblica Opportunità'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={publishOnConfirm ? 'Pubblica Opportunità' : 'Salva Bozza'}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6b7280' }}>
            {publishOnConfirm
              ? `Sei sicuro di voler pubblicare l'opportunità "${formData.titolo}"? Sarà visibile nel marketplace.`
              : `Sei sicuro di voler salvare la bozza "${formData.titolo}"? Potrai pubblicarla in seguito.`
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
              {publishOnConfirm ? 'Pubblica' : 'Salva Bozza'}
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

export default ClubCreateOpportunity;
