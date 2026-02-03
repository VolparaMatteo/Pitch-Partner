import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaPhone, FaEnvelope,
  FaCalendarAlt, FaStickyNote, FaEllipsisH
} from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const ACTIVITY_TYPES = [
  { id: 'chiamata', icon: <FaPhone />, label: 'Chiamata', color: '#059669' },
  { id: 'meeting', icon: <FaCalendarAlt />, label: 'Meeting', color: '#2563EB' },
  { id: 'email', icon: <FaEnvelope />, label: 'Email', color: '#D97706' },
  { id: 'nota', icon: <FaStickyNote />, label: 'Nota', color: '#9333EA' },
  { id: 'altro', icon: <FaEllipsisH />, label: 'Altro', color: '#6B7280' }
];

const ESITO_OPTIONS = [
  { value: 'positivo', label: 'Positivo', color: '#059669' },
  { value: 'negativo', label: 'Negativo', color: '#DC2626' },
  { value: 'neutro', label: 'Neutro', color: '#6B7280' },
  { value: 'da_seguire', label: 'Da seguire', color: '#D97706' }
];

function SponsorActivityForm() {
  const { sponsorId, activityId } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const isEdit = !!activityId;

  const [sponsor, setSponsor] = useState(null);
  const [formData, setFormData] = useState({
    tipo: '',
    titolo: '',
    descrizione: '',
    data_attivita: new Date().toISOString().slice(0, 16),
    contatto_nome: '',
    esito: '',
    data_followup: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 3;

  const steps = [
    { number: 1, title: 'Tipo' },
    { number: 2, title: 'Dettagli' },
    { number: 3, title: 'Esito' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchSponsor();
    if (isEdit) {
      fetchActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSponsor = async () => {
    try {
      const response = await clubAPI.getSponsor(sponsorId);
      setSponsor(response.data);
    } catch (error) {
      console.error('Errore caricamento sponsor:', error);
      setToast({ message: 'Errore nel caricamento dello sponsor', type: 'error' });
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await clubAPI.getSponsorActivity(sponsorId, activityId);
      const activity = response.data;
      setFormData({
        tipo: activity.tipo || '',
        titolo: activity.titolo || '',
        descrizione: activity.descrizione || '',
        data_attivita: activity.data_attivita ? activity.data_attivita.slice(0, 16) : '',
        contatto_nome: activity.contatto_nome || '',
        esito: activity.esito || '',
        data_followup: activity.data_followup ? activity.data_followup.slice(0, 16) : ''
      });
    } catch (error) {
      console.error('Errore caricamento attività:', error);
      setToast({ message: 'Errore nel caricamento dell\'attività', type: 'error' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectType = (tipo) => {
    setFormData(prev => ({ ...prev, tipo }));
    if (errors.tipo) {
      setErrors(prev => ({ ...prev, tipo: '' }));
    }
  };

  const selectEsito = (esito) => {
    setFormData(prev => ({
      ...prev,
      esito: prev.esito === esito ? '' : esito
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.tipo) newErrors.tipo = 'Seleziona un tipo di attività';
    }

    if (step === 2) {
      if (!formData.titolo.trim()) newErrors.titolo = 'Inserisci un titolo';
      if (!formData.data_attivita) newErrors.data_attivita = 'Inserisci la data';
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
        await clubAPI.updateSponsorActivity(sponsorId, activityId, formData);
        setToast({ message: 'Attività aggiornata con successo!', type: 'success' });
      } else {
        await clubAPI.createSponsorActivity(sponsorId, formData);
        setToast({ message: 'Attività creata con successo!', type: 'success' });
      }

      setTimeout(() => {
        navigate(`/club/sponsors/${sponsorId}`);
      }, 1500);
    } catch (error) {
      console.error('Errore salvataggio attività:', error);
      const errorMessage = error.response?.data?.error || 'Errore durante il salvataggio. Riprova.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate(`/club/sponsors/${sponsorId}`)}>
            <FaArrowLeft />
          </button>
          <div>
            <h1>{isEdit ? 'Modifica Attività' : 'Nuova Attività'}</h1>
            {sponsor && (
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
                per <strong>{sponsor.ragione_sociale}</strong>
              </p>
            )}
          </div>
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
          {/* Step 1: Tipo Attività */}
          {currentStep === 1 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Tipo di Attività</h2>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                Seleziona il tipo di interazione avuta con lo sponsor
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}>
                {ACTIVITY_TYPES.map((type) => {
                  const isSelected = formData.tipo === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => selectType(type.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '24px 16px',
                        background: isSelected ? '#1A1A1A' : 'white',
                        border: isSelected ? '2px solid #85FF00' : '2px solid #E5E7EB',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: isSelected ? 'white' : `${type.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: isSelected ? '#1A1A1A' : type.color
                      }}>
                        {type.icon}
                      </div>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isSelected ? 'white' : '#1A1A1A'
                      }}>
                        {type.label}
                      </span>
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#85FF00',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: '#1A1A1A'
                        }}>
                          <FaCheck />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {errors.tipo && <span className="error-message" style={{ marginTop: '16px', display: 'block' }}>{errors.tipo}</span>}
            </div>
          )}

          {/* Step 2: Dettagli */}
          {currentStep === 2 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Dettagli Attività</h2>

              <div className="form-group">
                <label>Titolo <span className="required">*</span></label>
                <input
                  type="text"
                  name="titolo"
                  value={formData.titolo}
                  onChange={handleChange}
                  placeholder="Es: Chiamata per rinnovo contratto"
                  className={errors.titolo ? 'error' : ''}
                />
                {errors.titolo && <span className="error-message">{errors.titolo}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data e Ora <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    name="data_attivita"
                    value={formData.data_attivita}
                    onChange={handleChange}
                    className={errors.data_attivita ? 'error' : ''}
                  />
                  {errors.data_attivita && <span className="error-message">{errors.data_attivita}</span>}
                </div>

                <div className="form-group">
                  <label>Contatto Coinvolto</label>
                  <input
                    type="text"
                    name="contatto_nome"
                    value={formData.contatto_nome}
                    onChange={handleChange}
                    placeholder="Es: Mario Rossi"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descrizione</label>
                <textarea
                  name="descrizione"
                  value={formData.descrizione}
                  onChange={handleChange}
                  placeholder="Aggiungi dettagli sull'attività, argomenti discussi, note importanti..."
                  rows={5}
                />
              </div>
            </div>
          )}

          {/* Step 3: Esito e Follow-up */}
          {currentStep === 3 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Esito e Follow-up</h2>

              {/* Esito */}
              <div className="sf-subsection">
                <label className="sf-label" style={{ marginBottom: '16px', display: 'block' }}>
                  Esito dell'attività
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px'
                }}>
                  {ESITO_OPTIONS.map((esito) => {
                    const isSelected = formData.esito === esito.value;
                    return (
                      <button
                        key={esito.value}
                        type="button"
                        onClick={() => selectEsito(esito.value)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '16px 12px',
                          background: isSelected ? `${esito.color}15` : 'white',
                          border: isSelected ? `2px solid ${esito.color}` : '2px solid #E5E7EB',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isSelected ? esito.color : `${esito.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <FaCheck style={{ color: 'white', fontSize: '14px' }} />}
                        </div>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isSelected ? esito.color : '#6B7280'
                        }}>
                          {esito.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px' }}>
                  Opzionale - Clicca di nuovo per deselezionare
                </p>
              </div>

              {/* Follow-up */}
              <div className="sf-subsection">
                <label className="sf-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Promemoria Follow-up
                </label>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                  Imposta una data per ricordarti di fare follow-up
                </p>
                <input
                  type="datetime-local"
                  name="data_followup"
                  value={formData.data_followup}
                  onChange={handleChange}
                  className="form-control"
                />
                {formData.data_followup && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: 'rgba(133, 255, 0, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(133, 255, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaCheck style={{ color: '#059669' }} />
                    <span style={{ fontSize: '14px', color: '#1A1A1A' }}>
                      Promemoria impostato per il {new Date(formData.data_followup).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
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
              <button type="button" className="sf-btn sf-btn-outline" onClick={() => navigate(`/club/sponsors/${sponsorId}`)}>
                Annulla
              </button>

              {currentStep < totalSteps ? (
                <button type="button" className="sf-btn sf-btn-primary" onClick={nextStep}>
                  Avanti
                  <FaArrowRight />
                </button>
              ) : (
                <button type="submit" className="sf-btn sf-btn-primary" disabled={loading}>
                  {loading ? 'Salvataggio...' : (isEdit ? 'Salva Modifiche' : 'Crea Attività')}
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
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
            {isEdit
              ? `Sei sicuro di voler salvare le modifiche all'attività "${formData.titolo}"?`
              : `Sei sicuro di voler registrare l'attività "${formData.titolo}"?`
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
              {isEdit ? 'Conferma' : 'Crea Attività'}
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

export default SponsorActivityForm;
