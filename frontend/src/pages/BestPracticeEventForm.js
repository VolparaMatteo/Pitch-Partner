import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bestPracticeAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import '../styles/dashboard-new.css';

function BestPracticeEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'webinar',
    titolo: '',
    descrizione: '',
    data_evento: '',
    durata_minuti: 60,
    location_fisica: '',
    link_webinar: '',
    speakers: [],
    visibile_sponsor: true,
    visibile_club: true,
    solo_premium: false,
    categoria: '',
    tags: [],
    agenda_url: '',
    materiali_urls: [],
    max_partecipanti: '',
    richiedi_conferma: true,
    abilita_qna: true,
    registra_evento: true,
    recording_url: '',
    note_partecipanti: ''
  });

  const [speakerInput, setSpeakerInput] = useState({
    nome: '',
    ruolo: '',
    bio: '',
    foto_url: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [materialeInput, setMaterialeInput] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    if (isEdit) {
      loadEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const res = await bestPracticeAPI.adminGetEvent(id);
      const event = res.data.event;

      // Convert datetime to input format
      const dateObj = new Date(event.data_evento);
      const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
      const formattedDate = localDate.toISOString().slice(0, 16);

      setFormData({
        tipo: event.tipo || 'webinar',
        titolo: event.titolo || '',
        descrizione: event.descrizione || '',
        data_evento: formattedDate,
        durata_minuti: event.durata_minuti || 60,
        location_fisica: event.location_fisica || '',
        link_webinar: event.link_webinar || '',
        speakers: event.speakers || [],
        visibile_sponsor: event.visibile_sponsor !== false,
        visibile_club: event.visibile_club !== false,
        solo_premium: event.solo_premium || false,
        categoria: event.categoria || '',
        tags: event.tags || [],
        agenda_url: event.agenda_url || '',
        materiali_urls: event.materiali_urls || [],
        max_partecipanti: event.max_partecipanti || '',
        richiedi_conferma: event.richiedi_conferma !== false,
        abilita_qna: event.abilita_qna !== false,
        registra_evento: event.registra_evento !== false,
        recording_url: event.recording_url || '',
        note_partecipanti: event.note_partecipanti || ''
      });
    } catch (error) {
      console.error('Errore caricamento evento:', error);
      setToast({ message: 'Errore nel caricamento dell\'evento', type: 'error' });
      setTimeout(() => navigate('/admin/best-practice-events'), 2000);
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
  };

  const handleAddSpeaker = () => {
    if (!speakerInput.nome) {
      setToast({ message: 'Inserisci almeno il nome dello speaker', type: 'error' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, { ...speakerInput }]
    }));

    setSpeakerInput({
      nome: '',
      ruolo: '',
      bio: '',
      foto_url: ''
    });

    setToast({ message: 'Speaker aggiunto', type: 'success' });
  };

  const handleRemoveSpeaker = (index) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));
    setTagInput('');
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleAddMateriale = () => {
    if (!materialeInput.trim()) return;

    setFormData(prev => ({
      ...prev,
      materiali_urls: [...prev.materiali_urls, materialeInput.trim()]
    }));
    setMaterialeInput('');
  };

  const handleRemoveMateriale = (index) => {
    setFormData(prev => ({
      ...prev,
      materiali_urls: prev.materiali_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.titolo || !formData.descrizione || !formData.data_evento) {
      setToast({ message: 'Compila tutti i campi obbligatori', type: 'error' });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    try {
      setLoading(true);
      setShowConfirmModal(false);

      const payload = {
        ...formData,
        max_partecipanti: formData.max_partecipanti ? parseInt(formData.max_partecipanti) : null,
        durata_minuti: parseInt(formData.durata_minuti)
      };

      if (isEdit) {
        await bestPracticeAPI.adminUpdateEvent(id, payload);
        setToast({ message: 'Evento aggiornato con successo!', type: 'success' });
      } else {
        await bestPracticeAPI.adminCreateEvent(payload);
        setToast({ message: 'Evento creato con successo!', type: 'success' });
      }

      setTimeout(() => navigate('/admin/best-practice-events'), 1500);
    } catch (error) {
      console.error('Errore salvataggio evento:', error);
      setToast({ message: error.response?.data?.error || 'Errore nel salvataggio', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 className="welcome-title">
            {isEdit ? 'Modifica Evento' : 'Nuovo Evento Best Practice'}
          </h1>
          <button
            style={{
              background: '#3D3D3D',
              color: 'white',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(61, 61, 61, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(61, 61, 61, 0.4)';
              e.target.style.background = '#2D2D2D';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(61, 61, 61, 0.3)';
              e.target.style.background = '#3D3D3D';
            }}
            onClick={() => navigate('/admin/best-practice-events')}
          >
            ← Torna indietro
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informazioni Base */}
          <div className="widget-white" style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#3D3D3D',
              paddingBottom: '16px',
              borderBottom: '2px solid #F5F5F5'
            }}>
              Informazioni Base
            </h2>

            <div className="form-group">
              <label>Tipo Evento *</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange} required>
                <option value="webinar">Webinar</option>
                <option value="seminario">Seminario</option>
                <option value="workshop">Workshop</option>
                <option value="conferenza">Conferenza</option>
              </select>
            </div>

            <div className="form-group">
              <label>Titolo *</label>
              <input
                type="text"
                name="titolo"
                value={formData.titolo}
                onChange={handleChange}
                required
                maxLength="200"
                placeholder="Es. Come ottimizzare la strategia di sponsorizzazione"
              />
            </div>

            <div className="form-group">
              <label>Descrizione *</label>
              <textarea
                name="descrizione"
                value={formData.descrizione}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Descrizione dettagliata dell'evento..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Data e Ora *</label>
                <input
                  type="datetime-local"
                  name="data_evento"
                  value={formData.data_evento}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Durata (minuti) *</label>
                <input
                  type="number"
                  name="durata_minuti"
                  value={formData.durata_minuti}
                  onChange={handleChange}
                  required
                  min="15"
                  step="15"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Categoria</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange}>
                <option value="">Seleziona categoria</option>
                <option value="marketing">Marketing</option>
                <option value="digital">Digital</option>
                <option value="legal">Legal</option>
                <option value="finance">Finance</option>
                <option value="strategy">Strategy</option>
                <option value="innovation">Innovation</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="widget-white" style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#3D3D3D',
              paddingBottom: '16px',
              borderBottom: '2px solid #F5F5F5'
            }}>
              Location
            </h2>

            <div className="form-group">
              <label>Location Fisica</label>
              <input
                type="text"
                name="location_fisica"
                value={formData.location_fisica}
                onChange={handleChange}
                placeholder="Es. Sede Milano - Via Roma 123"
              />
            </div>

            <div className="form-group">
              <label>Link Webinar/Streaming</label>
              <input
                type="url"
                name="link_webinar"
                value={formData.link_webinar}
                onChange={handleChange}
                placeholder="https://zoom.us/j/123456789"
              />
            </div>
          </div>

          {/* Speaker */}
          <div className="widget-white" style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#3D3D3D',
              paddingBottom: '16px',
              borderBottom: '2px solid #F5F5F5'
            }}>
              Speaker
            </h2>

            {formData.speakers.length > 0 && (
              <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {formData.speakers.map((speaker, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#F5F5F5',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{speaker.nome}</div>
                      {speaker.ruolo && (
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                          {speaker.ruolo}
                        </div>
                      )}
                      {speaker.bio && (
                        <div style={{ fontSize: '13px', color: '#999' }}>{speaker.bio}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpeaker(index)}
                      style={{
                        background: '#FFE0E0',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              background: '#F9F9F9',
              padding: '20px',
              borderRadius: '12px',
              border: '2px dashed #E0E0E0'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                Aggiungi Speaker
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Nome *"
                  value={speakerInput.nome}
                  onChange={(e) => setSpeakerInput(prev => ({ ...prev, nome: e.target.value }))}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Ruolo"
                  value={speakerInput.ruolo}
                  onChange={(e) => setSpeakerInput(prev => ({ ...prev, ruolo: e.target.value }))}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    fontSize: '14px'
                  }}
                />
              </div>
              <textarea
                placeholder="Bio"
                rows="2"
                value={speakerInput.bio}
                onChange={(e) => setSpeakerInput(prev => ({ ...prev, bio: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0',
                  fontSize: '14px',
                  marginBottom: '12px',
                  resize: 'vertical'
                }}
              />
              <input
                type="url"
                placeholder="URL Foto"
                value={speakerInput.foto_url}
                onChange={(e) => setSpeakerInput(prev => ({ ...prev, foto_url: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              />
              <button
                type="button"
                className="stat-btn"
                onClick={handleAddSpeaker}
                style={{ padding: '10px 20px' }}
              >
                + Aggiungi Speaker
              </button>
            </div>
          </div>

          {/* Visibilità */}
          <div className="widget-white" style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#3D3D3D',
              paddingBottom: '16px',
              borderBottom: '2px solid #F5F5F5'
            }}>
              Visibilità e Target
            </h2>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="visibile_sponsor"
                  checked={formData.visibile_sponsor}
                  onChange={handleChange}
                />
                Visibile agli Sponsor
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="visibile_club"
                  checked={formData.visibile_club}
                  onChange={handleChange}
                />
                Visibile ai Club
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="solo_premium"
                  checked={formData.solo_premium}
                  onChange={handleChange}
                />
                Solo per sponsor Premium
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="widget-white" style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#3D3D3D',
              paddingBottom: '16px',
              borderBottom: '2px solid #F5F5F5'
            }}>
              Tags
            </h2>

            {formData.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      background: '#F5F5F5',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0',
                        lineHeight: 1,
                        color: '#999'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Aggiungi tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0',
                  fontSize: '14px'
                }}
              />
              <button
                type="button"
                className="stat-btn"
                onClick={handleAddTag}
                style={{ padding: '10px 20px' }}
              >
                + Aggiungi
              </button>
            </div>
          </div>

          {/* Materiali */}
          <div className="widget-white" style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#3D3D3D',
              paddingBottom: '16px',
              borderBottom: '2px solid #F5F5F5'
            }}>
              Materiali
            </h2>

            <div className="form-group">
              <label>URL Agenda</label>
              <input
                type="url"
                name="agenda_url"
                value={formData.agenda_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>URL Recording</label>
              <input
                type="url"
                name="recording_url"
                value={formData.recording_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            {formData.materiali_urls.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.materiali_urls.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#F5F5F5',
                      padding: '12px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#1976D2', wordBreak: 'break-all' }}
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveMateriale(index)}
                      style={{
                        background: '#FFE0E0',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginLeft: '12px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                placeholder="URL materiale..."
                value={materialeInput}
                onChange={(e) => setMaterialeInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0',
                  fontSize: '14px'
                }}
              />
              <button
                type="button"
                className="stat-btn"
                onClick={handleAddMateriale}
                style={{ padding: '10px 20px' }}
              >
                + Aggiungi
              </button>
            </div>
          </div>

          {/* Impostazioni */}
          <div className="widget-white" style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#3D3D3D',
              paddingBottom: '16px',
              borderBottom: '2px solid #F5F5F5'
            }}>
              Impostazioni
            </h2>

            <div className="form-group">
              <label>Max Partecipanti</label>
              <input
                type="number"
                name="max_partecipanti"
                value={formData.max_partecipanti}
                onChange={handleChange}
                min="1"
                placeholder="Lascia vuoto per illimitati"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="richiedi_conferma"
                  checked={formData.richiedi_conferma}
                  onChange={handleChange}
                />
                Richiedi conferma iscrizione
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="abilita_qna"
                  checked={formData.abilita_qna}
                  onChange={handleChange}
                />
                Abilita sezione Q&A
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="registra_evento"
                  checked={formData.registra_evento}
                  onChange={handleChange}
                />
                Registra l'evento
              </label>
            </div>

            <div className="form-group">
              <label>Note per i Partecipanti</label>
              <textarea
                name="note_partecipanti"
                value={formData.note_partecipanti}
                onChange={handleChange}
                rows="4"
                placeholder="Informazioni aggiuntive, istruzioni per l'accesso, ecc."
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '24px',
            borderTop: '2px solid #E0E0E0'
          }}>
            <button
              type="button"
              onClick={() => navigate('/admin/best-practice-events')}
              disabled={loading}
              style={{
                background: '#F5F5F5',
                color: '#3D3D3D',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="stat-btn"
              disabled={loading}
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Salvataggio...' : (isEdit ? 'Aggiorna Evento' : 'Crea Evento')}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <Modal onClose={() => setShowConfirmModal(false)}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>Conferma Salvataggio</h2>
          <p style={{ margin: '0 0 24px 0', color: '#666' }}>
            Sei sicuro di voler {isEdit ? 'aggiornare' : 'creare'} questo evento?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowConfirmModal(false)}
              style={{
                background: '#F5F5F5',
                color: '#3D3D3D',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmedSubmit}
              className="stat-btn"
              style={{ padding: '12px 24px' }}
            >
              Conferma
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default BestPracticeEventForm;
