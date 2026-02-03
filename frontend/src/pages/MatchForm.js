import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

function MatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    data_ora: '',
    avversario: '',
    competizione: '',
    luogo: 'casa',
    stadio: '',
    status: 'programmata'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 2;

  const steps = [
    { number: 1, title: 'Partita' },
    { number: 2, title: 'Dettagli' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    if (isEdit) {
      fetchMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMatch = async () => {
    try {
      const response = await clubAPI.getMatch(id);
      const match = response.data;
      setFormData({
        data_ora: match.data_ora ? match.data_ora.slice(0, 16) : '',
        avversario: match.avversario || '',
        competizione: match.competizione || '',
        luogo: match.luogo || 'casa',
        stadio: match.stadio || '',
        status: match.status || 'programmata'
      });
    } catch (error) {
      console.error('Errore nel caricamento della partita:', error);
      setToast({
        type: 'error',
        message: 'Errore nel caricamento della partita'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.data_ora) newErrors.data_ora = 'Data e ora sono obbligatorie';
      if (!formData.avversario.trim()) newErrors.avversario = 'Avversario è obbligatorio';
      if (!formData.competizione.trim()) newErrors.competizione = 'Competizione è obbligatoria';
    }

    if (step === 2) {
      if (!formData.stadio.trim()) newErrors.stadio = 'Stadio è obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validate = () => {
    let allValid = true;
    for (let step = 1; step <= totalSteps; step++) {
      if (!validateStep(step)) {
        allValid = false;
      }
    }
    return allValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const goToStep = (step) => {
    if (step <= currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast({ message: 'Completa tutti i campi obbligatori', type: 'error' });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);

    try {
      setLoading(true);

      if (isEdit) {
        await clubAPI.updateMatch(id, formData);
        setToast({
          type: 'success',
          message: 'Partita aggiornata con successo!'
        });
      } else {
        await clubAPI.createMatch(formData);
        setToast({
          type: 'success',
          message: 'Partita creata con successo!'
        });
      }

      setTimeout(() => {
        navigate('/matches');
      }, 1500);
    } catch (error) {
      console.error('Errore nel salvataggio della partita:', error);
      setToast({
        type: 'error',
        message: error.response?.data?.error || 'Errore nel salvataggio della partita'
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
          <h1>{isEdit ? 'Modifica Partita' : 'Nuova Partita'}</h1>
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
          {/* Step 1: Informazioni Partita */}
          {currentStep === 1 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Informazioni Partita</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Data e Ora <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    name="data_ora"
                    value={formData.data_ora}
                    onChange={handleChange}
                    className={errors.data_ora ? 'error' : ''}
                  />
                  {errors.data_ora && <span className="error-message">{errors.data_ora}</span>}
                </div>

                <div className="form-group">
                  <label>Luogo</label>
                  <select
                    name="luogo"
                    value={formData.luogo}
                    onChange={handleChange}
                  >
                    <option value="casa">Casa</option>
                    <option value="trasferta">Trasferta</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Avversario <span className="required">*</span></label>
                <input
                  type="text"
                  name="avversario"
                  value={formData.avversario}
                  onChange={handleChange}
                  placeholder="es. Juventus FC"
                  className={errors.avversario ? 'error' : ''}
                />
                {errors.avversario && <span className="error-message">{errors.avversario}</span>}
              </div>

              <div className="form-group">
                <label>Competizione <span className="required">*</span></label>
                <input
                  type="text"
                  name="competizione"
                  value={formData.competizione}
                  onChange={handleChange}
                  placeholder="es. Serie A, Champions League, Amichevole..."
                  className={errors.competizione ? 'error' : ''}
                />
                {errors.competizione && <span className="error-message">{errors.competizione}</span>}
              </div>
            </div>
          )}

          {/* Step 2: Dettagli e Status */}
          {currentStep === 2 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Dettagli e Status</h2>

              <div className="form-group">
                <label>Stadio <span className="required">*</span></label>
                <input
                  type="text"
                  name="stadio"
                  value={formData.stadio}
                  onChange={handleChange}
                  placeholder="es. San Siro"
                  className={errors.stadio ? 'error' : ''}
                />
                {errors.stadio && <span className="error-message">{errors.stadio}</span>}
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="programmata">Programmata</option>
                  <option value="confermata">Confermata</option>
                  <option value="in_corso">In Corso</option>
                  <option value="completata">Completata</option>
                  <option value="rinviata">Rinviata</option>
                  <option value="annullata">Annullata</option>
                </select>
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
                <button type="submit" className="sf-btn sf-btn-primary" disabled={loading}>
                  {loading ? 'Salvataggio...' : (isEdit ? 'Salva Modifiche' : 'Crea Partita')}
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
        title={isEdit ? 'Conferma Modifiche' : 'Conferma Creazione'}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6b7280' }}>
            {isEdit
              ? `Sei sicuro di voler salvare le modifiche alla partita vs "${formData.avversario}"?`
              : `Sei sicuro di voler creare la partita vs "${formData.avversario}"?`
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
              className="sf-btn sf-btn-primary"
            >
              {isEdit ? 'Conferma' : 'Crea Partita'}
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

export default MatchForm;
