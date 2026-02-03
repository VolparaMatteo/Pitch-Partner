import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { uploadAPI, getImageUrl } from '../services/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaMapMarkerAlt, FaChevronDown,
  FaImage, FaTimes, FaPlus, FaTrashAlt, FaUsers
} from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const FONTE_OPTIONS = [
  { value: 'sito_web', label: 'Sito Web' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'vamos_group', label: 'Vamos Group' },
  { value: 'altro', label: 'Altro' }
];

const SPORT_OPTIONS = [
  'Calcio', 'Basket', 'Pallavolo', 'Rugby', 'Tennis',
  'Nuoto', 'Atletica', 'Ciclismo', 'Golf', 'Hockey',
  'Baseball', 'Handball', 'Futsal', 'Altro'
];

const REGIONI_ITALIANE = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
];

const EMPTY_CONTACT = {
  nome: '',
  cognome: '',
  ruolo: '',
  email: '',
  telefono: ''
};

function AdminLeadForm() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const isEdit = !!leadId;

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
  const [fonteOpen, setFonteOpen] = useState(false);
  const sportRef = useRef(null);
  const regioneRef = useRef(null);
  const fonteRef = useRef(null);

  // Additional contacts
  const [contactsList, setContactsList] = useState([]);

  const totalSteps = 2;
  const steps = [
    { number: 1, title: 'Club' },
    { number: 2, title: 'Contatti' }
  ];

  const [formData, setFormData] = useState({
    // Club Info
    nome_club: '',
    tipologia_sport: '',
    citta: '',
    provincia: '',
    regione: '',
    sito_web: '',
    logo_url: '',
    fonte: '',
    // Primary Contact
    contatto_nome: '',
    contatto_cognome: '',
    contatto_ruolo: '',
    contatto_email: '',
    contatto_telefono: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    if (isEdit) {
      fetchLead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  // Click-outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sportRef.current && !sportRef.current.contains(e.target)) setSportOpen(false);
      if (regioneRef.current && !regioneRef.current.contains(e.target)) setRegioneOpen(false);
      if (fonteRef.current && !fonteRef.current.contains(e.target)) setFonteOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lead = res.data.lead || res.data;
      setFormData({
        nome_club: lead.nome_club || '',
        tipologia_sport: lead.tipologia_sport || '',
        citta: lead.citta || '',
        provincia: lead.provincia || '',
        regione: lead.regione || '',
        sito_web: lead.sito_web || '',
        logo_url: lead.logo_url || '',
        fonte: lead.fonte || '',
        contatto_nome: lead.contatto_nome || '',
        contatto_cognome: lead.contatto_cognome || '',
        contatto_ruolo: lead.contatto_ruolo || '',
        contatto_email: lead.contatto_email || '',
        contatto_telefono: lead.contatto_telefono || ''
      });
      // Load additional contacts if available
      if (lead.contatti_aggiuntivi) {
        try {
          setContactsList(JSON.parse(lead.contatti_aggiuntivi) || []);
        } catch (e) {
          setContactsList([]);
        }
      }
    } catch (error) {
      console.error('Errore caricamento lead:', error);
      setToast({ message: 'Errore nel caricamento del lead', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToast({ message: 'Formato non supportato. Usa JPG, PNG, GIF o WebP.', type: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Il file è troppo grande. Max 5MB.', type: 'error' });
      return;
    }

    try {
      setLogoUploading(true);
      setLogoFile(file);

      const response = await uploadAPI.uploadLogo(file);
      const uploadedUrl = response.data.file_url;

      setFormData(prev => ({ ...prev, logo_url: uploadedUrl }));
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
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Contact helpers
  const addContact = () => {
    setContactsList(prev => [...prev, { ...EMPTY_CONTACT }]);
  };

  const removeContact = (index) => {
    setContactsList(prev => prev.filter((_, i) => i !== index));
  };

  const updateContact = (index, field, value) => {
    setContactsList(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.nome_club.trim()) {
        newErrors.nome_club = 'Inserisci il nome del club';
      }
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
    // Only allow submission on the last step
    if (currentStep !== totalSteps) {
      return;
    }
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
      const payload = {
        ...formData,
        contatti_aggiuntivi: JSON.stringify(contactsList)
      };

      if (isEdit) {
        await axios.put(`${API_URL}/admin/leads/${leadId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Lead aggiornato con successo!', type: 'success' });
        setTimeout(() => navigate(`/admin/leads/${leadId}`), 1500);
      } else {
        const res = await axios.post(`${API_URL}/admin/leads`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Lead creato con successo!', type: 'success' });
        setTimeout(() => navigate(`/admin/leads/${res.data.lead?.id || ''}`), 1500);
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
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Caricamento dati lead...</p>
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
          <h1>{isEdit ? 'Modifica Lead' : 'Nuovo Lead'}</h1>
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
                      name="nome_club"
                      value={formData.nome_club}
                      onChange={handleChange}
                      placeholder="Es: AC Milan, Juventus FC..."
                      className={errors.nome_club ? 'error' : ''}
                    />
                    {errors.nome_club && <span className="error-message">{errors.nome_club}</span>}
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
                            background: '#FEE2E2', color: '#DC2626', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Rimuovi logo"
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
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          gap: '8px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#85FF00';
                          e.currentTarget.style.background = 'rgba(133, 255, 0, 0.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.background = '#FAFAFA';
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
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                              Carica logo club
                            </span>
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              JPG, PNG, GIF o WebP - Max 5MB
                            </span>
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
                      onClick={() => { setSportOpen(!sportOpen); setRegioneOpen(false); setFonteOpen(false); }}
                      style={{
                        width: '100%', padding: '12px 16px',
                        border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', fontSize: '14px',
                        color: formData.tipologia_sport ? '#1A1A1A' : '#9CA3AF'
                      }}
                    >
                      <span style={{ fontWeight: formData.tipologia_sport ? 500 : 400 }}>
                        {formData.tipologia_sport || 'Seleziona sport...'}
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
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100,
                        maxHeight: '280px', overflow: 'hidden'
                      }}>
                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                          {SPORT_OPTIONS.map(s => (
                            <div
                              key={s}
                              onClick={() => { setFormData(prev => ({ ...prev, tipologia_sport: s })); setSportOpen(false); }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 16px', cursor: 'pointer',
                                background: formData.tipologia_sport === s ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                borderLeft: formData.tipologia_sport === s ? '3px solid #85FF00' : '3px solid transparent',
                                fontSize: '14px', color: '#1A1A1A'
                              }}
                              onMouseEnter={e => { if (formData.tipologia_sport !== s) e.currentTarget.style.background = '#F9FAFB'; }}
                              onMouseLeave={e => { if (formData.tipologia_sport !== s) e.currentTarget.style.background = 'transparent'; }}
                            >
                              <span style={{ fontWeight: formData.tipologia_sport === s ? 600 : 400 }}>{s}</span>
                              {formData.tipologia_sport === s && <FaCheck size={12} color="#85FF00" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Citta</label>
                      <input
                        type="text"
                        name="citta"
                        value={formData.citta}
                        onChange={handleChange}
                        placeholder="Es: Milano"
                      />
                    </div>
                    <div className="form-group">
                      <label>Provincia</label>
                      <input
                        type="text"
                        name="provincia"
                        value={formData.provincia}
                        onChange={handleChange}
                        placeholder="Es: MI"
                        maxLength={2}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>

                  {/* Custom Dropdown: Regione */}
                  <div className="form-group" ref={regioneRef} style={{ position: 'relative' }}>
                    <label>Regione</label>
                    <button
                      type="button"
                      onClick={() => { setRegioneOpen(!regioneOpen); setSportOpen(false); setFonteOpen(false); }}
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
                        transform: regioneOpen ? 'rotate(180deg)' : 'rotate(0)',
                        color: '#9CA3AF'
                      }} />
                    </button>
                    {regioneOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100,
                        maxHeight: '280px', overflow: 'hidden'
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
                                borderLeft: formData.regione === r ? '3px solid #85FF00' : '3px solid transparent',
                                fontSize: '14px', color: '#1A1A1A'
                              }}
                              onMouseEnter={e => { if (formData.regione !== r) e.currentTarget.style.background = '#F9FAFB'; }}
                              onMouseLeave={e => { if (formData.regione !== r) e.currentTarget.style.background = 'transparent'; }}
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
                    <input
                      type="url"
                      name="sito_web"
                      value={formData.sito_web}
                      onChange={handleChange}
                      placeholder="https://www.esempio.it"
                    />
                  </div>

                  {/* Custom Dropdown: Fonte */}
                  <div className="form-group" ref={fonteRef} style={{ position: 'relative' }}>
                    <label>Fonte Lead</label>
                    <button
                      type="button"
                      onClick={() => { setFonteOpen(!fonteOpen); setSportOpen(false); setRegioneOpen(false); }}
                      style={{
                        width: '100%', padding: '12px 16px',
                        border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', fontSize: '14px',
                        color: formData.fonte ? '#1A1A1A' : '#9CA3AF'
                      }}
                    >
                      <span style={{ fontWeight: formData.fonte ? 500 : 400 }}>
                        {FONTE_OPTIONS.find(f => f.value === formData.fonte)?.label || 'Seleziona fonte...'}
                      </span>
                      <FaChevronDown size={12} style={{
                        transition: 'transform 0.2s',
                        transform: fonteOpen ? 'rotate(180deg)' : 'rotate(0)',
                        color: '#9CA3AF'
                      }} />
                    </button>
                    {fonteOpen && (
                      <div style={{
                        position: 'absolute', top: 'auto', bottom: '100%', left: 0, right: 0, marginBottom: '4px',
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                        boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', zIndex: 100
                      }}>
                        {FONTE_OPTIONS.map(f => (
                          <div
                            key={f.value}
                            onClick={() => { setFormData(prev => ({ ...prev, fonte: f.value })); setFonteOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 16px', cursor: 'pointer',
                              background: formData.fonte === f.value ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                              borderLeft: formData.fonte === f.value ? '3px solid #85FF00' : '3px solid transparent',
                              fontSize: '14px', color: '#1A1A1A'
                            }}
                            onMouseEnter={e => { if (formData.fonte !== f.value) e.currentTarget.style.background = '#F9FAFB'; }}
                            onMouseLeave={e => { if (formData.fonte !== f.value) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <span style={{ fontWeight: formData.fonte === f.value ? 600 : 400 }}>{f.label}</span>
                            {formData.fonte === f.value && <FaCheck size={12} color="#85FF00" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Contatti */}
              {currentStep === 2 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Referente Principale</h2>
                  <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', marginTop: '-8px' }}>
                    Indica la persona di riferimento principale per questo club.
                  </p>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nome</label>
                      <input
                        type="text"
                        name="contatto_nome"
                        value={formData.contatto_nome}
                        onChange={handleChange}
                        placeholder="Es: Mario"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cognome</label>
                      <input
                        type="text"
                        name="contatto_cognome"
                        value={formData.contatto_cognome}
                        onChange={handleChange}
                        placeholder="Es: Rossi"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Ruolo</label>
                      <input
                        type="text"
                        name="contatto_ruolo"
                        value={formData.contatto_ruolo}
                        onChange={handleChange}
                        placeholder="Es: Presidente, Direttore..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="contatto_email"
                        value={formData.contatto_email}
                        onChange={handleChange}
                        placeholder="mario.rossi@club.it"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Telefono</label>
                    <input
                      type="tel"
                      name="contatto_telefono"
                      value={formData.contatto_telefono}
                      onChange={handleChange}
                      placeholder="+39 333 1234567"
                    />
                  </div>

                  {/* Additional Contacts Section */}
                  <div style={{
                    marginTop: '28px',
                    paddingTop: '20px',
                    borderTop: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaUsers style={{ color: '#6366F1' }} />
                          Contatti Aggiuntivi
                          {contactsList.length > 0 && (
                            <span style={{
                              fontSize: '11px', fontWeight: 600, background: '#6366F1', color: 'white',
                              borderRadius: '10px', padding: '2px 8px', minWidth: '20px', textAlign: 'center'
                            }}>
                              {contactsList.length}
                            </span>
                          )}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                          Aggiungi altri referenti del club.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addContact}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '8px',
                          border: '1px solid #85FF00', background: 'rgba(133, 255, 0, 0.1)',
                          color: '#1A1A1A', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(133, 255, 0, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(133, 255, 0, 0.1)'; }}
                      >
                        <FaPlus size={12} /> Aggiungi Contatto
                      </button>
                    </div>

                    {contactsList.length === 0 && (
                      <div style={{
                        padding: '24px', background: '#F9FAFB', borderRadius: '10px',
                        border: '1px dashed #D1D5DB', textAlign: 'center'
                      }}>
                        <FaUsers size={24} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
                        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                          Nessun contatto aggiuntivo. Clicca "Aggiungi Contatto" per inserire altri referenti.
                        </p>
                      </div>
                    )}

                    {contactsList.map((contact, index) => (
                      <div key={index} style={{
                        padding: '16px', background: '#FAFAFA', borderRadius: '10px',
                        border: '1px solid #E5E7EB', marginBottom: '12px',
                        position: 'relative'
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: '12px'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#6366F1' }}>
                            Contatto #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '4px 10px', borderRadius: '6px', border: '1px solid #FCA5A5',
                              background: '#FEF2F2', color: '#DC2626', fontSize: '12px',
                              cursor: 'pointer', fontWeight: 500
                            }}
                          >
                            <FaTrashAlt size={10} /> Rimuovi
                          </button>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Nome</label>
                            <input
                              type="text"
                              value={contact.nome}
                              onChange={e => updateContact(index, 'nome', e.target.value)}
                              placeholder="Nome"
                            />
                          </div>
                          <div className="form-group">
                            <label>Cognome</label>
                            <input
                              type="text"
                              value={contact.cognome}
                              onChange={e => updateContact(index, 'cognome', e.target.value)}
                              placeholder="Cognome"
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Ruolo</label>
                            <input
                              type="text"
                              value={contact.ruolo}
                              onChange={e => updateContact(index, 'ruolo', e.target.value)}
                              placeholder="Es: Vice Presidente"
                            />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              value={contact.email}
                              onChange={e => updateContact(index, 'email', e.target.value)}
                              placeholder="email@club.it"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Telefono</label>
                          <input
                            type="tel"
                            value={contact.telefono}
                            onChange={e => updateContact(index, 'telefono', e.target.value)}
                            placeholder="+39 333 1234567"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="sf-form-actions">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="sf-btn sf-btn-outline"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevStep(); }}
                  >
                    <FaArrowLeft /> Indietro
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    className="sf-btn sf-btn-primary"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextStep(); }}
                  >
                    Avanti <FaArrowRight />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="sf-btn sf-btn-primary"
                    disabled={saving}
                    style={{ background: '#1A1A1A' }}
                  >
                    {saving ? 'Salvataggio...' : isEdit ? 'Aggiorna Lead' : 'Crea Lead'}
                    {!saving && <FaCheck style={{ marginLeft: '8px' }} />}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Live Preview Card */}
        <div className="sf-preview-column">
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            {/* Preview Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ color: '#85FF00' }}>●</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anteprima Lead</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {formData.logo_url ? (
                  <img
                    src={getImageUrl(formData.logo_url)}
                    alt="Logo Club"
                    style={{
                      width: '56px', height: '56px', borderRadius: '12px',
                      objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #85FF00 0%, #70E000 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 700, color: '#1A1A1A'
                  }}>
                    {(formData.nome_club || 'N').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    {formData.nome_club || 'Nome Club'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
                    {formData.tipologia_sport || 'Sport non specificato'}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{ padding: '20px' }}>
              {/* Location & Source badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {formData.citta && (
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#FEF2F2', color: '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <FaMapMarkerAlt size={10} /> {formData.citta}
                  </span>
                )}
                {formData.fonte && (
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#EEF2FF', color: '#6366F1'
                  }}>
                    {FONTE_OPTIONS.find(f => f.value === formData.fonte)?.label || formData.fonte}
                  </span>
                )}
              </div>

              {/* Website */}
              {formData.sito_web && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Sito Web
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                    <span style={{ color: '#9CA3AF' }}>🌐</span> {formData.sito_web}
                  </div>
                </div>
              )}

              {/* Referente */}
              {(formData.contatto_nome || formData.contatto_cognome) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Referente Principale
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 600, color: '#6B7280'
                    }}>
                      {(formData.contatto_nome || 'N').substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                        {formData.contatto_nome} {formData.contatto_cognome}
                      </div>
                      {formData.contatto_ruolo && (
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{formData.contatto_ruolo}</div>
                      )}
                    </div>
                  </div>
                  {(formData.contatto_email || formData.contatto_telefono) && (
                    <div style={{ marginTop: '8px', paddingLeft: '46px' }}>
                      {formData.contatto_email && (
                        <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
                          ✉ {formData.contatto_email}
                        </div>
                      )}
                      {formData.contatto_telefono && (
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          📞 {formData.contatto_telefono}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Contacts Preview */}
              {contactsList.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Contatti Aggiuntivi ({contactsList.length})
                  </div>
                  {contactsList.map((c, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', background: '#F9FAFB', borderRadius: '8px',
                      marginBottom: '6px', fontSize: '13px'
                    }}>
                      <div style={{ fontWeight: 600, color: '#1A1A1A' }}>
                        {c.nome} {c.cognome}
                      </div>
                      {c.ruolo && <div style={{ fontSize: '12px', color: '#6B7280' }}>{c.ruolo}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title={isEdit ? 'Conferma Modifica' : 'Conferma Creazione'}
        >
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '20px', color: '#4B5563' }}>
              {isEdit
                ? `Confermi di voler aggiornare il lead "${formData.nome_club}"?`
                : `Confermi di voler creare il lead "${formData.nome_club}"?`
              }
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="sf-btn sf-btn-outline"
                onClick={() => setShowConfirmModal(false)}
              >
                Annulla
              </button>
              <button
                className="sf-btn sf-btn-primary"
                onClick={handleConfirmedSubmit}
                disabled={saving}
              >
                {saving ? 'Salvataggio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </Modal>
      )}

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

export default AdminLeadForm;
