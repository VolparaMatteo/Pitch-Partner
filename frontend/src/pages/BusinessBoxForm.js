import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft,
  FaTicketAlt,
  FaUtensils,
  FaCar,
  FaHandshake,
  FaGift,
  FaCheck,
  FaInfoCircle,
  FaCog
} from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function BusinessBoxForm() {
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [formData, setFormData] = useState({
    nome: '',
    settore: '',
    numero_posti: '',
    catering: false,
    parcheggio: false,
    meet_and_greet: false,
    merchandising: false,
    tipo: 'stagionale'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 2;

  const steps = [
    { number: 1, title: 'Informazioni' },
    { number: 2, title: 'Servizi' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.nome.trim()) {
        newErrors.nome = 'Inserisci il nome del box';
      }
      if (!formData.numero_posti || formData.numero_posti <= 0) {
        newErrors.numero_posti = 'Inserisci un numero di posti valido';
      }
      if (!formData.settore.trim()) {
        newErrors.settore = 'Inserisci il settore';
      }
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
  };

  const goToStep = (step) => {
    if (step <= currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);

    try {
      setLoading(true);

      const dataToSend = {
        ...formData,
        numero_posti: parseInt(formData.numero_posti)
      };

      await axios.post(`${API_URL}/business-boxes`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToast({
        message: 'Business Box creato con successo!',
        type: 'success'
      });

      setTimeout(() => {
        navigate('/club/business-boxes');
      }, 1500);

    } catch (error) {
      console.error('Errore creazione box:', error);
      setToast({
        message: error.response?.data?.error || 'Errore nella creazione del box',
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
          <button className="sf-back-btn" onClick={() => navigate('/club/business-boxes')}>
            <FaArrowLeft />
          </button>
          <h1>Nuovo Business Box</h1>
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
          {/* Step 1: Informazioni */}
          {currentStep === 1 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Informazioni Business Box</h2>

              {/* Nome e Settore */}
              <div className="form-row">
                <div className="form-group">
                  <label>Nome Box <span className="required">*</span></label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="es. Skybox Premium, Box VIP Area A"
                    className={errors.nome ? 'error' : ''}
                  />
                  {errors.nome && <span className="error-message">{errors.nome}</span>}
                </div>

                <div className="form-group">
                  <label>Settore <span className="required">*</span></label>
                  <input
                    type="text"
                    name="settore"
                    value={formData.settore}
                    onChange={handleChange}
                    placeholder="es. Tribuna Est, Area VIP 1"
                    className={errors.settore ? 'error' : ''}
                  />
                  {errors.settore && <span className="error-message">{errors.settore}</span>}
                </div>
              </div>

              {/* Numero Posti e Tipo */}
              <div className="form-row">
                <div className="form-group">
                  <label>Numero Posti <span className="required">*</span></label>
                  <input
                    type="number"
                    name="numero_posti"
                    value={formData.numero_posti}
                    onChange={handleChange}
                    placeholder="es. 10"
                    min="1"
                    className={errors.numero_posti ? 'error' : ''}
                  />
                  {errors.numero_posti && <span className="error-message">{errors.numero_posti}</span>}
                </div>

                <div className="form-group">
                  <label>Tipo Box</label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                  >
                    <option value="stagionale">Stagionale</option>
                    <option value="per_partita">Per Partita</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Servizi */}
          {currentStep === 2 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Servizi Inclusi</h2>
              <p style={{ color: 'var(--tp-gray-500)', marginBottom: '24px', fontSize: '14px' }}>
                Seleziona i servizi inclusi nel business box
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}>
                <label className="sf-checkbox-card">
                  <input
                    type="checkbox"
                    name="catering"
                    checked={formData.catering}
                    onChange={handleChange}
                  />
                  <div className="sf-checkbox-content">
                    <FaUtensils className="sf-checkbox-icon" />
                    <div>
                      <span>Catering</span>
                      <small style={{ display: 'block', color: 'var(--tp-gray-500)', fontWeight: 400 }}>
                        Servizio ristorazione incluso
                      </small>
                    </div>
                  </div>
                  {formData.catering && <FaCheck className="sf-checkbox-check" />}
                </label>

                <label className="sf-checkbox-card">
                  <input
                    type="checkbox"
                    name="parcheggio"
                    checked={formData.parcheggio}
                    onChange={handleChange}
                  />
                  <div className="sf-checkbox-content">
                    <FaCar className="sf-checkbox-icon" />
                    <div>
                      <span>Parcheggio</span>
                      <small style={{ display: 'block', color: 'var(--tp-gray-500)', fontWeight: 400 }}>
                        Posto auto riservato
                      </small>
                    </div>
                  </div>
                  {formData.parcheggio && <FaCheck className="sf-checkbox-check" />}
                </label>

                <label className="sf-checkbox-card">
                  <input
                    type="checkbox"
                    name="meet_and_greet"
                    checked={formData.meet_and_greet}
                    onChange={handleChange}
                  />
                  <div className="sf-checkbox-content">
                    <FaHandshake className="sf-checkbox-icon" />
                    <div>
                      <span>Meet & Greet</span>
                      <small style={{ display: 'block', color: 'var(--tp-gray-500)', fontWeight: 400 }}>
                        Incontro con giocatori
                      </small>
                    </div>
                  </div>
                  {formData.meet_and_greet && <FaCheck className="sf-checkbox-check" />}
                </label>

                <label className="sf-checkbox-card">
                  <input
                    type="checkbox"
                    name="merchandising"
                    checked={formData.merchandising}
                    onChange={handleChange}
                  />
                  <div className="sf-checkbox-content">
                    <FaGift className="sf-checkbox-icon" />
                    <div>
                      <span>Merchandising</span>
                      <small style={{ display: 'block', color: 'var(--tp-gray-500)', fontWeight: 400 }}>
                        Gadget e materiale ufficiale
                      </small>
                    </div>
                  </div>
                  {formData.merchandising && <FaCheck className="sf-checkbox-check" />}
                </label>
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
              <button
                type="button"
                className="sf-btn sf-btn-outline"
                onClick={() => navigate('/club/business-boxes')}
              >
                Annulla
              </button>

              {currentStep < totalSteps ? (
                <button type="button" className="sf-btn sf-btn-primary" onClick={nextStep}>
                  Avanti
                  <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="sf-btn sf-btn-success"
                  disabled={loading}
                >
                  {loading ? 'Creazione...' : 'Crea Business Box'}
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
            Sei sicuro di voler creare il nuovo Business Box "{formData.nome}"?
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
              Crea Business Box
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
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

export default BusinessBoxForm;
