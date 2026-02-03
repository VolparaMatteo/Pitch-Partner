import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { uploadAPI, getImageUrl } from '../services/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaChevronDown,
  FaImage, FaTimes, FaBuilding, FaEnvelope, FaPhone,
  FaGlobe, FaMapMarkerAlt, FaUserTie, FaCrown
} from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const SPORT_OPTIONS = [
  'Calcio', 'Calcio a 5', 'Futsal', 'Basket', 'Pallavolo', 'Beach Volley',
  'Tennis', 'Padel', 'Ping Pong', 'Rugby', 'Pallamano', 'Hockey',
  'Baseball', 'Golf', 'Atletica', 'Nuoto', 'Pallanuoto', 'Ciclismo',
  'Boxe', 'Arti Marziali', 'Judo', 'Karate', 'MMA', 'Scherma',
  'Ginnastica', 'Pattinaggio', 'Vela', 'Canottaggio', 'Equitazione',
  'E-Sports', 'Triathlon', 'CrossFit', 'Fitness', 'Sci', 'Snowboard', 'Altro'
].sort();

const REGIONI_ITALIANE = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
];

const ABBONAMENTO_OPTIONS = [
  { value: 'trial', label: 'Trial' },
  { value: 'base', label: 'Base' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' }
];

function AdminClubForm() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const isEdit = !!clubId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Logo upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  // Custom Dropdowns
  const [sportOpen, setSportOpen] = useState(false);
  const [regioneOpen, setRegioneOpen] = useState(false);
  const [abbonamentoOpen, setAbbonamentoOpen] = useState(false);
  const sportRef = useRef(null);
  const regioneRef = useRef(null);
  const abbonamentoRef = useRef(null);

  const totalSteps = 3;
  const steps = [
    { number: 1, title: 'Club' },
    { number: 2, title: 'Contatti' },
    { number: 3, title: 'Licenza' }
  ];

  const [formData, setFormData] = useState({
    // Club Info
    nome: '',
    tipologia: '',
    logo_url: '',
    citta: '',
    provincia: '',
    regione: '',
    sito_web: '',
    // Dati Fiscali
    partita_iva: '',
    codice_fiscale: '',
    indirizzo_sede_legale: '',
    // Contatti
    email: '',
    telefono: '',
    // Referente
    referente_nome: '',
    referente_cognome: '',
    referente_ruolo: '',
    referente_contatto: '',
    // Licenza
    nome_abbonamento: '',
    costo_abbonamento: '',
    data_scadenza_licenza: '',
    account_attivo: true
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    if (isEdit) {
      fetchClub();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // Click-outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sportRef.current && !sportRef.current.contains(e.target)) setSportOpen(false);
      if (regioneRef.current && !regioneRef.current.contains(e.target)) setRegioneOpen(false);
      if (abbonamentoRef.current && !abbonamentoRef.current.contains(e.target)) setAbbonamentoOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchClub = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const club = res.data;
      setFormData({
        nome: club.nome || '',
        tipologia: club.tipologia || '',
        logo_url: club.logo_url || '',
        citta: club.citta || '',
        provincia: club.provincia || '',
        regione: club.regione || '',
        sito_web: club.sito_web || '',
        partita_iva: club.partita_iva || '',
        codice_fiscale: club.codice_fiscale || '',
        indirizzo_sede_legale: club.indirizzo_sede_legale || '',
        email: club.email || '',
        telefono: club.telefono || '',
        referente_nome: club.referente_nome || '',
        referente_cognome: club.referente_cognome || '',
        referente_ruolo: club.referente_ruolo || '',
        referente_contatto: club.referente_contatto || '',
        nome_abbonamento: club.nome_abbonamento || '',
        costo_abbonamento: club.costo_abbonamento || '',
        data_scadenza_licenza: club.data_scadenza_licenza ? club.data_scadenza_licenza.split('T')[0] : '',
        account_attivo: club.account_attivo !== false
      });
    } catch (error) {
      console.error('Errore caricamento club:', error);
      setToast({ message: 'Errore nel caricamento del club', type: 'error' });
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToast({ message: 'Formato non supportato. Usa JPG, PNG, GIF o WebP.', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Il file è troppo grande. Max 5MB.', type: 'error' });
      return;
    }

    try {
      setLogoUploading(true);
      setLogoFile(file);
      const response = await uploadAPI.uploadLogo(file);
      setFormData(prev => ({ ...prev, logo_url: response.data.file_url }));
      setToast({ message: 'Logo caricato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore upload logo:', error);
      setToast({ message: 'Errore nel caricamento del logo', type: 'error' });
      setLogoFile(null);
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: '' }));
    setLogoFile(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.nome.trim()) newErrors.nome = 'Inserisci il nome del club';
    }
    if (step === 2) {
      if (!formData.email.trim()) newErrors.email = 'Inserisci l\'email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validate = () => {
    let allValid = true;
    for (let step = 1; step <= totalSteps; step++) {
      if (!validateStep(step)) allValid = false;
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
    e.stopPropagation();
    if (currentStep !== totalSteps) return;
    if (!validate()) {
      setToast({ message: 'Completa tutti i campi obbligatori', type: 'error' });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    try {
      setSaving(true);
      const payload = { ...formData };

      if (isEdit) {
        await axios.put(`${API_URL}/admin/clubs/${clubId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Club aggiornato con successo!', type: 'success' });
        setTimeout(() => navigate(`/admin/clubs/${clubId}`), 1500);
      } else {
        const res = await axios.post(`${API_URL}/admin/clubs`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Club creato con successo!', type: 'success' });
        setTimeout(() => navigate(`/admin/clubs/${res.data.club?.id || ''}`), 1500);
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      setToast({ message: error.response?.data?.error || 'Errore nel salvataggio', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sponsor-form-page">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '400px', gap: '16px'
        }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #E5E7EB',
            borderTopColor: '#85FF00', borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Caricamento dati club...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <h1>{isEdit ? 'Modifica Club' : 'Nuovo Club'}</h1>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="sf-two-column-layout">
        {/* Left Column - Form */}
        <div className="sf-form-column">
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
              {/* Step 1: Club Info */}
              {currentStep === 1 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Informazioni Club</h2>

                  <div className="form-group">
                    <label>Nome Club <span className="required">*</span></label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="Es: AC Milan, Juventus FC..."
                      className={errors.nome ? 'error' : ''}
                    />
                    {errors.nome && <span className="error-message">{errors.nome}</span>}
                  </div>

                  {/* Logo Upload */}
                  <div className="form-group">
                    <label>Logo Club</label>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    {formData.logo_url ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        padding: '12px', background: '#F9FAFB', borderRadius: '12px',
                        border: '2px solid #E5E7EB'
                      }}>
                        <img
                          src={getImageUrl(formData.logo_url)}
                          alt="Logo Club"
                          style={{
                            width: '64px', height: '64px', borderRadius: '10px',
                            objectFit: 'cover', border: '2px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                            Logo caricato
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            Clicca per cambiare
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeLogo}
                          style={{
                            padding: '8px', borderRadius: '8px', border: 'none',
                            background: '#FEE2E2', color: '#DC2626', cursor: 'pointer'
                          }}
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={logoUploading}
                        style={{
                          width: '100%', padding: '24px', border: '2px dashed #E5E7EB',
                          borderRadius: '12px', background: '#FAFAFA', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                        }}
                      >
                        {logoUploading ? (
                          <>
                            <div style={{
                              width: '24px', height: '24px', border: '3px solid #E5E7EB',
                              borderTopColor: '#85FF00', borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            <span style={{ fontSize: '13px', color: '#6B7280' }}>Caricamento...</span>
                          </>
                        ) : (
                          <>
                            <FaImage size={24} color="#9CA3AF" />
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>Carica logo club</span>
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>JPG, PNG, GIF o WebP - Max 5MB</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Custom Dropdown: Sport */}
                  <div className="form-group" ref={sportRef} style={{ position: 'relative' }}>
                    <label>Sport</label>
                    <button
                      type="button"
                      onClick={() => { setSportOpen(!sportOpen); setRegioneOpen(false); setAbbonamentoOpen(false); }}
                      style={{
                        width: '100%', padding: '12px 16px',
                        border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', fontSize: '14px',
                        color: formData.tipologia ? '#1A1A1A' : '#9CA3AF'
                      }}
                    >
                      <span style={{ fontWeight: formData.tipologia ? 500 : 400 }}>
                        {formData.tipologia || 'Seleziona sport...'}
                      </span>
                      <FaChevronDown size={12} style={{
                        transition: 'transform 0.2s',
                        transform: sportOpen ? 'rotate(180deg)' : 'rotate(0)',
                        color: '#9CA3AF'
                      }} />
                    </button>
                    {sportOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '280px', overflow: 'hidden'
                      }}>
                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                          {SPORT_OPTIONS.map(s => (
                            <div
                              key={s}
                              onClick={() => { setFormData(prev => ({ ...prev, tipologia: s })); setSportOpen(false); }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 16px', cursor: 'pointer',
                                background: formData.tipologia === s ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                borderLeft: formData.tipologia === s ? '3px solid #85FF00' : '3px solid transparent'
                              }}
                            >
                              <span style={{ fontWeight: formData.tipologia === s ? 600 : 400 }}>{s}</span>
                              {formData.tipologia === s && <FaCheck size={12} color="#85FF00" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Città</label>
                      <input type="text" name="citta" value={formData.citta} onChange={handleChange} placeholder="Es: Milano" />
                    </div>
                    <div className="form-group">
                      <label>Provincia</label>
                      <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} placeholder="Es: MI" maxLength={2} style={{ textTransform: 'uppercase' }} />
                    </div>
                  </div>

                  {/* Custom Dropdown: Regione */}
                  <div className="form-group" ref={regioneRef} style={{ position: 'relative' }}>
                    <label>Regione</label>
                    <button
                      type="button"
                      onClick={() => { setRegioneOpen(!regioneOpen); setSportOpen(false); setAbbonamentoOpen(false); }}
                      style={{
                        width: '100%', padding: '12px 16px',
                        border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', fontSize: '14px',
                        color: formData.regione ? '#1A1A1A' : '#9CA3AF'
                      }}
                    >
                      <span style={{ fontWeight: formData.regione ? 500 : 400 }}>
                        {formData.regione || 'Seleziona regione...'}
                      </span>
                      <FaChevronDown size={12} style={{
                        transition: 'transform 0.2s',
                        transform: regioneOpen ? 'rotate(180deg)' : 'rotate(0)'
                      }} />
                    </button>
                    {regioneOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '280px', overflow: 'hidden'
                      }}>
                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                          {REGIONI_ITALIANE.map(r => (
                            <div
                              key={r}
                              onClick={() => { setFormData(prev => ({ ...prev, regione: r })); setRegioneOpen(false); }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 16px', cursor: 'pointer',
                                background: formData.regione === r ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                borderLeft: formData.regione === r ? '3px solid #85FF00' : '3px solid transparent'
                              }}
                            >
                              <span style={{ fontWeight: formData.regione === r ? 600 : 400 }}>{r}</span>
                              {formData.regione === r && <FaCheck size={12} color="#85FF00" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Sito Web</label>
                    <input type="url" name="sito_web" value={formData.sito_web} onChange={handleChange} placeholder="https://www.esempio.it" />
                  </div>

                  <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                    <h2 className="sf-section-title">Dati Fiscali</h2>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Partita IVA</label>
                        <input type="text" name="partita_iva" value={formData.partita_iva} onChange={handleChange} placeholder="Es: 12345678901" />
                      </div>
                      <div className="form-group">
                        <label>Codice Fiscale</label>
                        <input type="text" name="codice_fiscale" value={formData.codice_fiscale} onChange={handleChange} placeholder="Es: 12345678901" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Sede Legale</label>
                      <input type="text" name="indirizzo_sede_legale" value={formData.indirizzo_sede_legale} onChange={handleChange} placeholder="Es: Via Roma 1, 20100 Milano (MI)" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contatti */}
              {currentStep === 2 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Contatti Club</h2>

                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="info@club.it"
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Telefono</label>
                    <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="+39 02 1234567" />
                  </div>

                  <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                    <h2 className="sf-section-title">Referente Principale</h2>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', marginTop: '-8px' }}>
                      Indica la persona di riferimento principale per questo club.
                    </p>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Nome</label>
                        <input type="text" name="referente_nome" value={formData.referente_nome} onChange={handleChange} placeholder="Es: Mario" />
                      </div>
                      <div className="form-group">
                        <label>Cognome</label>
                        <input type="text" name="referente_cognome" value={formData.referente_cognome} onChange={handleChange} placeholder="Es: Rossi" />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Ruolo</label>
                        <input type="text" name="referente_ruolo" value={formData.referente_ruolo} onChange={handleChange} placeholder="Es: Presidente" />
                      </div>
                      <div className="form-group">
                        <label>Contatto</label>
                        <input type="text" name="referente_contatto" value={formData.referente_contatto} onChange={handleChange} placeholder="+39 333 1234567" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Licenza & Accesso */}
              {currentStep === 3 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Licenza & Abbonamento</h2>

                  {/* Custom Dropdown: Abbonamento */}
                  <div className="form-group" ref={abbonamentoRef} style={{ position: 'relative' }}>
                    <label>Piano Abbonamento</label>
                    <button
                      type="button"
                      onClick={() => { setAbbonamentoOpen(!abbonamentoOpen); setSportOpen(false); setRegioneOpen(false); }}
                      style={{
                        width: '100%', padding: '12px 16px',
                        border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', fontSize: '14px',
                        color: formData.nome_abbonamento ? '#1A1A1A' : '#9CA3AF'
                      }}
                    >
                      <span style={{ fontWeight: formData.nome_abbonamento ? 500 : 400 }}>
                        {ABBONAMENTO_OPTIONS.find(a => a.value === formData.nome_abbonamento)?.label || formData.nome_abbonamento || 'Seleziona piano...'}
                      </span>
                      <FaChevronDown size={12} style={{
                        transition: 'transform 0.2s',
                        transform: abbonamentoOpen ? 'rotate(180deg)' : 'rotate(0)'
                      }} />
                    </button>
                    {abbonamentoOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100
                      }}>
                        {ABBONAMENTO_OPTIONS.map(a => (
                          <div
                            key={a.value}
                            onClick={() => { setFormData(prev => ({ ...prev, nome_abbonamento: a.value })); setAbbonamentoOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 16px', cursor: 'pointer',
                              background: formData.nome_abbonamento === a.value ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                              borderLeft: formData.nome_abbonamento === a.value ? '3px solid #85FF00' : '3px solid transparent'
                            }}
                          >
                            <span style={{ fontWeight: formData.nome_abbonamento === a.value ? 600 : 400 }}>{a.label}</span>
                            {formData.nome_abbonamento === a.value && <FaCheck size={12} color="#85FF00" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Costo Mensile (€)</label>
                      <input type="number" name="costo_abbonamento" value={formData.costo_abbonamento} onChange={handleChange} placeholder="99.00" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>Scadenza Licenza</label>
                      <input type="date" name="data_scadenza_licenza" value={formData.data_scadenza_licenza} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="account_attivo"
                        checked={formData.account_attivo}
                        onChange={handleChange}
                        style={{ width: '20px', height: '20px', accentColor: '#85FF00' }}
                      />
                      <span>Account Attivo</span>
                    </label>
                  </div>

                  {!isEdit && (
                    <div style={{ marginTop: '28px', padding: '16px', background: '#FEF3C7', borderRadius: '12px', border: '1px solid #F59E0B' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>🔐</span>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#92400E', margin: 0 }}>
                            Attivazione Account
                          </p>
                          <p style={{ fontSize: '13px', color: '#B45309', margin: '4px 0 0' }}>
                            Dopo la creazione, verrà generato un link di attivazione. Il club potrà impostare la propria password accedendo al link.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="sf-form-actions">
                {currentStep > 1 && (
                  <button type="button" className="sf-btn sf-btn-outline" onClick={(e) => { e.preventDefault(); prevStep(); }}>
                    <FaArrowLeft /> Indietro
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {currentStep < totalSteps ? (
                  <button type="button" className="sf-btn sf-btn-primary" onClick={(e) => { e.preventDefault(); nextStep(); }}>
                    Avanti <FaArrowRight />
                  </button>
                ) : (
                  <button type="submit" className="sf-btn sf-btn-primary" disabled={saving} style={{ background: '#1A1A1A' }}>
                    {saving ? 'Salvataggio...' : isEdit ? 'Aggiorna Club' : 'Crea Club'}
                    {!saving && <FaCheck style={{ marginLeft: '8px' }} />}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Live Preview Card */}
        <div className="sf-preview-column">
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* Preview Header */}
            <div style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)', padding: '20px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ color: '#85FF00' }}>●</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anteprima Club</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {formData.logo_url ? (
                  <img src={getImageUrl(formData.logo_url)} alt="Logo" style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, #85FF00 0%, #70E000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>
                    {(formData.nome || 'N').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{formData.nome || 'Nome Club'}</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>{formData.tipologia || 'Sport non specificato'}</p>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{ padding: '20px' }}>
              {/* Location badge */}
              {formData.citta && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaMapMarkerAlt size={10} /> {formData.citta}{formData.regione ? `, ${formData.regione}` : ''}
                  </span>
                </div>
              )}

              {/* Contact Info */}
              {(formData.email || formData.telefono) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>Contatti</div>
                  {formData.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                      <FaEnvelope size={12} color="#9CA3AF" /> {formData.email}
                    </div>
                  )}
                  {formData.telefono && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                      <FaPhone size={12} color="#9CA3AF" /> {formData.telefono}
                    </div>
                  )}
                </div>
              )}

              {/* Referente */}
              {(formData.referente_nome || formData.referente_cognome) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>Referente</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>
                      {(formData.referente_nome || 'N').substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{formData.referente_nome} {formData.referente_cognome}</div>
                      {formData.referente_ruolo && <div style={{ fontSize: '12px', color: '#6B7280' }}>{formData.referente_ruolo}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Dati Fiscali */}
              {(formData.partita_iva || formData.codice_fiscale || formData.indirizzo_sede_legale) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>Dati Fiscali</div>
                  {formData.partita_iva && (
                    <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>P.IVA: {formData.partita_iva}</div>
                  )}
                  {formData.codice_fiscale && (
                    <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>C.F.: {formData.codice_fiscale}</div>
                  )}
                  {formData.indirizzo_sede_legale && (
                    <div style={{ fontSize: '13px', color: '#374151' }}>{formData.indirizzo_sede_legale}</div>
                  )}
                </div>
              )}

              {/* Abbonamento */}
              {formData.nome_abbonamento && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>Abbonamento</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCrown size={14} color="#F59E0B" />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                      {ABBONAMENTO_OPTIONS.find(a => a.value === formData.nome_abbonamento)?.label || formData.nome_abbonamento}
                    </span>
                    {formData.costo_abbonamento && (
                      <span style={{ fontSize: '14px', color: '#059669', fontWeight: 600 }}>€{formData.costo_abbonamento}/mese</span>
                    )}
                  </div>
                </div>
              )}

              {/* Status */}
              <div style={{ padding: '12px', background: formData.account_attivo ? '#ECFDF5' : '#FEF2F2', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {formData.account_attivo ? (
                  <>
                    <FaCheck size={14} color="#059669" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>Account Attivo</span>
                  </>
                ) : (
                  <>
                    <FaTimes size={14} color="#DC2626" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>Account Sospeso</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title={isEdit ? 'Conferma Modifica' : 'Conferma Creazione'}>
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '20px', color: '#4B5563' }}>
              {isEdit ? `Confermi di voler aggiornare il club "${formData.nome}"?` : `Confermi di voler creare il club "${formData.nome}"?`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="sf-btn sf-btn-outline" onClick={() => setShowConfirmModal(false)}>Annulla</button>
              <button className="sf-btn sf-btn-primary" onClick={handleConfirmedSubmit} disabled={saving}>
                {saving ? 'Salvataggio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminClubForm;
