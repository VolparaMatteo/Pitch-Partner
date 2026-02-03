import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import FormBuilderInteractive from '../components/FormBuilderInteractive';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const CreateEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const isEditMode = Boolean(id);

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    titolo: '',
    tipo: '',
    data_ora_inizio: '',
    data_ora_fine: '',
    luogo: '',
    indirizzo: '',
    online: false,
    link_meeting: '',
    descrizione: '',
    richiede_iscrizione: false,
    max_iscrizioni: '',
    invited_sponsors: [],
    registration_form_schema: []
  });

  const [agendaItems, setAgendaItems] = useState([]);
  const [newAgendaItem, setNewAgendaItem] = useState({
    time: '',
    title: '',
    description: ''
  });

  const isClub = user?.role === 'club';
  const totalSteps = isClub ? 4 : 3;

  const steps = isClub ? [
    { number: 1, title: 'Generale' },
    { number: 2, title: 'Data e Luogo' },
    { number: 3, title: 'Dettagli' },
    { number: 4, title: 'Iscrizioni' }
  ] : [
    { number: 1, title: 'Generale' },
    { number: 2, title: 'Data e Luogo' },
    { number: 3, title: 'Dettagli' }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const initializeForm = async () => {
      if (isClub) {
        await fetchSponsors();
      }
      if (isEditMode) {
        await fetchEvent();
      } else {
        setLoading(false);
      }
    };
    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSponsors = async () => {
    try {
      const response = await axios.get(`${API_URL}/club/sponsors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSponsors(response.data.sponsors || []);
    } catch (error) {
      console.error('Errore nel caricamento degli sponsor:', error);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const event = response.data;

      const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        titolo: event.titolo || '',
        tipo: event.tipo || '',
        data_ora_inizio: formatDateTimeLocal(event.data_ora_inizio),
        data_ora_fine: formatDateTimeLocal(event.data_ora_fine),
        luogo: event.luogo || '',
        indirizzo: event.indirizzo || '',
        online: event.online || false,
        link_meeting: event.link_meeting || '',
        descrizione: event.descrizione || '',
        richiede_iscrizione: event.richiede_iscrizione || false,
        max_iscrizioni: event.max_iscrizioni || '',
        invited_sponsors: event.invited_sponsors || [],
        registration_form_schema: event.registration_form_schema ? JSON.parse(event.registration_form_schema) : []
      });

      if (event.agenda) {
        const lines = event.agenda.split('\n').filter(line => line.trim());
        const items = [];
        lines.forEach(line => {
          const match = line.match(/^(\d{1,2}:\d{2})\s*-\s*(.+)/);
          if (match) {
            items.push({
              time: match[1],
              title: match[2].trim(),
              description: ''
            });
          }
        });
        if (items.length > 0) {
          setAgendaItems(items);
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento dell\'evento:', error);
      setToast({ message: 'Errore nel caricamento dell\'evento', type: 'error' });
      setTimeout(() => navigate('/events'), 2000);
    } finally {
      setLoading(false);
    }
  };

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
      if (!formData.titolo.trim()) {
        newErrors.titolo = 'Inserisci il titolo dell\'evento';
      }
      if (!formData.tipo) {
        newErrors.tipo = 'Seleziona il tipo di evento';
      }
    }

    if (step === 2) {
      if (!formData.data_ora_inizio) {
        newErrors.data_ora_inizio = 'Inserisci la data e ora di inizio';
      }
      if (!formData.online && !formData.luogo.trim()) {
        newErrors.luogo = 'Inserisci il luogo dell\'evento';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validate = () => {
    let isValid = true;
    for (let i = 1; i <= totalSteps; i++) {
      if (!validateStep(i)) {
        isValid = false;
      }
    }
    return isValid;
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

  const addAgendaItem = () => {
    if (!newAgendaItem.time || !newAgendaItem.title) {
      setToast({ message: 'Orario e titolo sono obbligatori', type: 'warning' });
      return;
    }
    setAgendaItems([...agendaItems, { ...newAgendaItem }]);
    setNewAgendaItem({ time: '', title: '', description: '' });
  };

  const removeAgendaItem = (index) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const toggleSponsorInvitation = (sponsorId) => {
    const currentInvited = formData.invited_sponsors || [];
    if (currentInvited.includes(sponsorId)) {
      setFormData({
        ...formData,
        invited_sponsors: currentInvited.filter(id => id !== sponsorId)
      });
    } else {
      setFormData({
        ...formData,
        invited_sponsors: [...currentInvited, sponsorId]
      });
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
    setSubmitting(true);

    try {
      const agendaString = agendaItems.map(item =>
        `${item.time} - ${item.title}${item.description ? '\n  ' + item.description : ''}`
      ).join('\n');

      const eventData = {
        ...formData,
        agenda: agendaString,
        data_ora_inizio: new Date(formData.data_ora_inizio).toISOString(),
        data_ora_fine: formData.data_ora_fine ? new Date(formData.data_ora_fine).toISOString() : null
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/events/${id}`, eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Evento aggiornato con successo!', type: 'success' });
      } else {
        await axios.post(`${API_URL}/events`, eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Evento creato con successo!', type: 'success' });
      }
      setTimeout(() => navigate('/events'), 1500);
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      setToast({ message: error.response?.data?.error || 'Errore nel salvataggio dell\'evento', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="sponsor-form-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate('/events')}>
            <FaArrowLeft />
          </button>
          <h1>{isEditMode ? 'Modifica Evento' : 'Nuovo Evento'}</h1>
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
                <label>Titolo Evento <span className="required">*</span></label>
                <input
                  type="text"
                  name="titolo"
                  value={formData.titolo}
                  onChange={handleChange}
                  placeholder="Es. Presentazione partnership Q1 2024"
                  className={errors.titolo ? 'error' : ''}
                />
                {errors.titolo && <span className="error-message">{errors.titolo}</span>}
              </div>

              <div className="form-group">
                <label>Tipo Evento <span className="required">*</span></label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className={errors.tipo ? 'error' : ''}
                >
                  <option value="">Seleziona...</option>
                  <option value="ufficio_stampa">Ufficio Stampa</option>
                  <option value="presentazione_commerciale">Presentazione Commerciale</option>
                  <option value="brand_event">Brand Event</option>
                  <option value="meeting">Meeting</option>
                  <option value="formazione">Formazione</option>
                  <option value="networking">Networking</option>
                  <option value="altro">Altro</option>
                </select>
                {errors.tipo && <span className="error-message">{errors.tipo}</span>}
              </div>
            </div>
          )}

          {/* Step 2: Data e Luogo */}
          {currentStep === 2 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Data e Luogo</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Data/Ora Inizio <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    name="data_ora_inizio"
                    value={formData.data_ora_inizio}
                    onChange={handleChange}
                    className={errors.data_ora_inizio ? 'error' : ''}
                  />
                  {errors.data_ora_inizio && <span className="error-message">{errors.data_ora_inizio}</span>}
                </div>

                <div className="form-group">
                  <label>Data/Ora Fine</label>
                  <input
                    type="datetime-local"
                    name="data_ora_fine"
                    value={formData.data_ora_fine}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="sf-checkbox-label">
                  <input
                    type="checkbox"
                    name="online"
                    checked={formData.online}
                    onChange={handleChange}
                  />
                  <span>Evento Online</span>
                </label>
                <span className="form-hint">L'evento si svolgerà tramite videoconferenza</span>
              </div>

              {formData.online ? (
                <div className="form-group">
                  <label>Link Meeting</label>
                  <input
                    type="url"
                    name="link_meeting"
                    value={formData.link_meeting}
                    onChange={handleChange}
                    placeholder="https://zoom.us/j/... o https://meet.google.com/..."
                  />
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label>Luogo <span className="required">*</span></label>
                    <input
                      type="text"
                      name="luogo"
                      value={formData.luogo}
                      onChange={handleChange}
                      placeholder="Es. Sala Conferenze - Stadio"
                      className={errors.luogo ? 'error' : ''}
                    />
                    {errors.luogo && <span className="error-message">{errors.luogo}</span>}
                  </div>

                  <div className="form-group">
                    <label>Indirizzo</label>
                    <input
                      type="text"
                      name="indirizzo"
                      value={formData.indirizzo}
                      onChange={handleChange}
                      placeholder="Via, Città, CAP"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Dettagli */}
          {currentStep === 3 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Dettagli Evento</h2>

              <div className="form-group">
                <label>Descrizione</label>
                <textarea
                  name="descrizione"
                  value={formData.descrizione}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Descrizione dell'evento..."
                />
              </div>

              <div className="form-group">
                <label>Agenda</label>
                <span className="form-hint">{agendaItems.length} slot aggiunti</span>

                {agendaItems.length > 0 && (
                  <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                    {agendaItems.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          background: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}
                      >
                        <span style={{
                          background: '#85FF00',
                          color: '#1A1A1A',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}>
                          {item.time}
                        </span>
                        <span style={{ flex: 1, fontSize: '14px', color: '#1A1A1A' }}>{item.title}</span>
                        <button
                          type="button"
                          onClick={() => removeAgendaItem(index)}
                          style={{
                            background: '#FEE2E2',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#DC2626'
                          }}
                        >
                          Rimuovi
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: '12px',
                  alignItems: 'end',
                  marginTop: '12px'
                }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Orario</label>
                    <input
                      type="time"
                      value={newAgendaItem.time}
                      onChange={(e) => setNewAgendaItem({ ...newAgendaItem, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Titolo</label>
                    <input
                      type="text"
                      value={newAgendaItem.title}
                      onChange={(e) => setNewAgendaItem({ ...newAgendaItem, title: e.target.value })}
                      placeholder="Es. Registrazione partecipanti"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addAgendaItem}
                    className="sf-btn sf-btn-outline"
                    style={{ height: '44px' }}
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Iscrizioni (solo Club) */}
          {currentStep === 4 && isClub && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Registrazione Sponsor</h2>

              <div className="form-group">
                <label className="sf-checkbox-label">
                  <input
                    type="checkbox"
                    name="richiede_iscrizione"
                    checked={formData.richiede_iscrizione}
                    onChange={handleChange}
                  />
                  <span>Richiedi iscrizione sponsor</span>
                </label>
                <span className="form-hint">Gli sponsor dovranno confermare la loro partecipazione</span>
              </div>

              {formData.richiede_iscrizione && (
                <>
                  <div className="form-group">
                    <label>Numero massimo iscrizioni</label>
                    <input
                      type="number"
                      name="max_iscrizioni"
                      value={formData.max_iscrizioni}
                      onChange={handleChange}
                      placeholder="Lascia vuoto per illimitate"
                      min="1"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Sponsor da invitare</label>
                    <div style={{
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      maxHeight: '250px',
                      overflow: 'auto'
                    }}>
                      {sponsors.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                          Nessuno sponsor disponibile
                        </div>
                      ) : (
                        sponsors.map((sponsor) => (
                          <label
                            key={sponsor.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #F3F4F6',
                              background: formData.invited_sponsors.includes(sponsor.id) ? 'rgba(133, 255, 0, 0.1)' : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.invited_sponsors.includes(sponsor.id)}
                              onChange={() => toggleSponsorInvitation(sponsor.id)}
                            />
                            <span style={{ fontSize: '14px', color: '#1A1A1A' }}>{sponsor.ragione_sociale}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {formData.invited_sponsors.length > 0 && (
                      <span className="form-hint" style={{ color: '#059669' }}>
                        {formData.invited_sponsors.length} sponsor selezionati
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Campi del form di iscrizione</label>
                    <FormBuilderInteractive
                      fields={formData.registration_form_schema}
                      onChange={(fields) => setFormData({ ...formData, registration_form_schema: fields })}
                    />
                  </div>
                </>
              )}
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
              <button type="button" className="sf-btn sf-btn-outline" onClick={() => navigate('/events')}>
                Annulla
              </button>

              {currentStep < totalSteps ? (
                <button type="button" className="sf-btn sf-btn-primary" onClick={nextStep}>
                  Avanti
                  <FaArrowRight />
                </button>
              ) : (
                <button type="submit" className="sf-btn sf-btn-primary" disabled={submitting}>
                  {submitting ? 'Salvataggio...' : (isEditMode ? 'Salva Modifiche' : 'Crea Evento')}
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
        title={isEditMode ? 'Conferma Modifiche' : 'Conferma Creazione'}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6b7280' }}>
            {isEditMode
              ? `Sei sicuro di voler salvare le modifiche all'evento "${formData.titolo}"?`
              : `Sei sicuro di voler creare l'evento "${formData.titolo}"?`
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
              {isEditMode ? 'Conferma' : 'Crea Evento'}
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
};

export default CreateEvent;
