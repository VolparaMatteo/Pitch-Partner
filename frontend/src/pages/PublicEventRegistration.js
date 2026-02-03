import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../static/logo/logo_nobg2.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const PublicEventRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      // Chiamata pubblica senza token
      const response = await axios.get(`${API_URL}/events/${id}/public`);
      setEvent(response.data);

      // Inizializza form data
      if (response.data.registration_form_schema) {
        const schema = JSON.parse(response.data.registration_form_schema);
        const initialData = {};
        schema.forEach(field => {
          initialData[field.label] = '';
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Errore nel caricamento dell\'evento:', error);
      alert('Evento non trovato o iscrizioni non disponibili');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/events/${id}/public-register`, {
        form_data: formData
      });
      setSuccess(true);
    } catch (error) {
      console.error('Errore nell\'iscrizione:', error);
      alert(error.response?.data?.error || 'Errore nell\'iscrizione');
      setSubmitting(false);
    }
  };

  const renderFormField = (field) => {
    const commonStyle = {
      width: '100%',
      padding: '14px 16px',
      borderRadius: '12px',
      border: '2px solid #E0E0E0',
      fontSize: '15px',
      color: '#3D3D3D',
      background: 'white',
      fontFamily: 'inherit'
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={formData[field.label] || ''}
            onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder || ''}
            rows="4"
            style={{ ...commonStyle, resize: 'vertical' }}
          />
        );

      case 'select':
        return (
          <select
            value={formData[field.label] || ''}
            onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
            required={field.required}
            style={{ ...commonStyle, cursor: 'pointer' }}
          >
            <option value="">Seleziona...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {field.options?.map((option, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={field.label}
                  value={option}
                  checked={formData[field.label] === option}
                  onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                  required={field.required}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px', color: '#3D3D3D' }}>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {field.options?.map((option, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  value={option}
                  checked={(formData[field.label] || '').split(',').includes(option)}
                  onChange={(e) => {
                    const current = (formData[field.label] || '').split(',').filter(v => v);
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter(v => v !== option);
                    setFormData({ ...formData, [field.label]: updated.join(',') });
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px', color: '#3D3D3D' }}>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            value={formData[field.label] || ''}
            onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder || ''}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
            style={commonStyle}
          />
        );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%)'
      }}>
        <div style={{ fontSize: '18px', color: '#3D3D3D', fontWeight: 600 }}>Caricamento...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%)',
        padding: '20px'
      }}>
        <img src={logo} alt="Pitch Partner" style={{ height: '60px', marginBottom: '32px' }} />
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '500px',
          border: '2px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>😕</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#3D3D3D', marginBottom: '12px' }}>
            Evento non trovato
          </h2>
          <p style={{ fontSize: '16px', color: '#666' }}>
            L'evento che stai cercando non esiste o le iscrizioni non sono disponibili.
          </p>
        </div>
      </div>
    );
  }

  const formSchema = event.registration_form_schema ? JSON.parse(event.registration_form_schema) : [];

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%)',
        padding: '20px'
      }}>
        <img src={logo} alt="Pitch Partner" style={{ height: '60px', marginBottom: '32px' }} />
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '500px',
          border: '2px solid #E0E0E0'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px',
            fontWeight: 700,
            color: '#3D3D3D'
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#3D3D3D', marginBottom: '16px' }}>
            Iscrizione Completata!
          </h2>
          <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
            La tua iscrizione all'evento <strong>{event.titolo}</strong> è stata ricevuta con successo.
            Riceverai una conferma dal club organizzatore.
          </p>
          <div style={{
            background: '#F0FFF4',
            border: '2px solid #7FFF00',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '24px'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>📅 Data evento</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#3D3D3D' }}>
              {formatDate(event.data_ora_inizio)}
            </div>
          </div>
          <div style={{
            marginTop: '24px',
            fontSize: '13px',
            color: '#999',
            fontStyle: 'italic'
          }}>
            Puoi chiudere questa pagina
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src={logo} alt="Pitch Partner" style={{ height: '60px' }} />
        </div>

        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '24px',
          border: '2px solid #E0E0E0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D', marginBottom: '12px' }}>
              {event.titolo}
            </h1>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
              📅 {formatDate(event.data_ora_inizio)}
            </div>
            {event.online ? (
              <div style={{ fontSize: '15px', color: '#666' }}>
                💻 Evento Online
              </div>
            ) : (
              <div style={{ fontSize: '15px', color: '#666' }}>
                📍 {event.luogo || 'Luogo da definire'}
              </div>
            )}
          </div>

          {event.descrizione && (
            <div style={{
              background: '#F9FAFB',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
                Descrizione
              </div>
              <div style={{ fontSize: '15px', color: '#3D3D3D', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {event.descrizione}
              </div>
            </div>
          )}

          {event.max_iscrizioni && (
            <div style={{
              background: '#F0FFF4',
              border: '2px solid #7FFF00',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>
                📊 Posti disponibili
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3D3D3D' }}>
                {event.registrations_count || 0} / {event.max_iscrizioni}
              </div>
              {event.max_iscrizioni - (event.registrations_count || 0) <= 5 && (
                <div style={{ fontSize: '12px', color: '#FF9800', marginTop: '8px', fontWeight: 600 }}>
                  ⚠️ Pochi posti rimasti!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          border: '2px solid #E0E0E0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#3D3D3D', marginBottom: '24px' }}>
            Completa l'iscrizione
          </h2>

          <form onSubmit={handleSubmit}>
            {formSchema.map((field, index) => (
              <div key={index} style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#3D3D3D'
                }}>
                  {field.label} {field.required && <span style={{ color: '#F44336' }}>*</span>}
                </label>
                {field.description && (
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontStyle: 'italic' }}>
                    {field.description}
                  </div>
                )}
                {renderFormField(field)}
                {field.validation && (field.validation.minLength || field.validation.maxLength) && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                    {field.validation.minLength && `Min ${field.validation.minLength} caratteri`}
                    {field.validation.minLength && field.validation.maxLength && ' • '}
                    {field.validation.maxLength && `Max ${field.validation.maxLength} caratteri`}
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '16px',
                background: submitting ? '#E0E0E0' : 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                color: '#3D3D3D',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(127, 255, 0, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Invio in corso...' : '✓ Completa Iscrizione'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          color: '#666',
          fontSize: '13px',
          fontWeight: 500
        }}>
          Powered by <strong>Pitch Partner</strong>
        </div>
      </div>
    </div>
  );
};

export default PublicEventRegistration;
