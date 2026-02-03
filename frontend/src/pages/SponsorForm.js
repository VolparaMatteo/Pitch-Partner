import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubAPI, uploadAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaTwitter,
  FaArrowLeft, FaArrowRight, FaCheck, FaCamera, FaTrash,
  FaBuilding, FaGlobe, FaEye, FaUserTie
} from 'react-icons/fa';
import {
  HiOutlineUserGroup, HiOutlinePhone, HiOutlineGlobeAlt,
  HiOutlineBuildingOffice2
} from 'react-icons/hi2';
import { SETTORI_MERCEOLOGICI } from '../constants/settori';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function SponsorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    ragione_sociale: '',
    email: '',
    telefono: '',
    indirizzo_sede: '',
    partita_iva: '',
    codice_fiscale: '',
    settore_merceologico: '',
    sito_web: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    linkedin: '',
    twitter: '',
    referente_nome: '',
    referente_cognome: '',
    referente_ruolo: '',
    referente_contatto: '',
    logo_url: '',
    note_interne: '',
    ruolo_sponsorship: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 3;

  const steps = [
    { number: 1, title: 'Informazioni', icon: HiOutlineBuildingOffice2 },
    { number: 2, title: 'Contatti', icon: HiOutlinePhone },
    { number: 3, title: 'Social', icon: HiOutlineGlobeAlt }
  ];

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    if (isEdit) {
      fetchSponsor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSponsor = async () => {
    try {
      const response = await clubAPI.getSponsor(id);
      const sponsor = response.data;
      setFormData({
        ragione_sociale: sponsor.ragione_sociale || '',
        email: sponsor.email || '',
        telefono: sponsor.telefono || '',
        indirizzo_sede: sponsor.indirizzo_sede || '',
        partita_iva: sponsor.partita_iva || '',
        codice_fiscale: sponsor.codice_fiscale || '',
        settore_merceologico: sponsor.settore_merceologico || '',
        sito_web: sponsor.sito_web || '',
        facebook: sponsor.facebook || '',
        instagram: sponsor.instagram || '',
        tiktok: sponsor.tiktok || '',
        linkedin: sponsor.linkedin || '',
        twitter: sponsor.twitter || '',
        referente_nome: sponsor.referente_nome || '',
        referente_cognome: sponsor.referente_cognome || '',
        referente_ruolo: sponsor.referente_ruolo || '',
        referente_contatto: sponsor.referente_contatto || '',
        logo_url: sponsor.logo_url || '',
        note_interne: sponsor.note_interne_club || '',
        ruolo_sponsorship: sponsor.ruolo_sponsorship || ''
      });
      if (sponsor.logo_url) {
        setLogoPreview(sponsor.logo_url.startsWith('http') ? sponsor.logo_url : `${API_URL.replace('/api', '')}${sponsor.logo_url}`);
      }
    } catch (error) {
      console.error('Errore caricamento sponsor:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: 'Formato non supportato. Usa: PNG, JPG, GIF, SVG, WEBP' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'Il file è troppo grande. Dimensione massima: 5MB' }));
      return;
    }

    setLogoFile(file);
    setErrors(prev => ({ ...prev, logo: '' }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo_url: '' }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.ragione_sociale.trim()) newErrors.ragione_sociale = 'Inserisci la ragione sociale';
      if (formData.partita_iva && formData.partita_iva.length !== 11) {
        newErrors.partita_iva = 'La partita IVA deve essere di 11 cifre';
      }
      if (formData.codice_fiscale && formData.codice_fiscale.length !== 16) {
        newErrors.codice_fiscale = 'Il Codice Fiscale deve essere di 16 caratteri';
      }
    }

    if (step === 2) {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Inserisci un\'email valida';
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
      setLoading(true);

      let logoUrl = formData.logo_url;
      if (logoFile) {
        setUploadingLogo(true);
        try {
          const uploadResponse = await uploadAPI.uploadLogo(logoFile);
          logoUrl = uploadResponse.data.file_url;
        } catch (uploadError) {
          console.error('Errore upload logo:', uploadError);
          setToast({
            message: 'Errore durante il caricamento del logo. Riprova.',
            type: 'error'
          });
          setUploadingLogo(false);
          setLoading(false);
          return;
        }
        setUploadingLogo(false);
      }

      const submitData = {};
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword' && formData[key]) {
          submitData[key] = formData[key];
        }
      });

      if (logoUrl) {
        submitData.logo_url = logoUrl;
      }

      let sponsorId = id;

      if (isEdit) {
        await clubAPI.updateSponsor(id, submitData);
        setToast({
          message: 'Sponsor aggiornato con successo!',
          type: 'success'
        });
      } else {
        const response = await clubAPI.createSponsor(submitData);
        sponsorId = response.data.id || response.data.sponsor?.id;
        setToast({
          message: 'Sponsor creato con successo!',
          type: 'success'
        });
      }

      setTimeout(() => {
        navigate(`/club/sponsors/${sponsorId}`);
      }, 1500);
    } catch (error) {
      console.error('Errore salvataggio sponsor:', error);
      const errorMessage = error.response?.data?.error || 'Errore durante il salvataggio dello sponsor. Riprova.';
      setToast({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Count social links
  const socialCount = [
    formData.facebook, formData.instagram, formData.tiktok,
    formData.linkedin, formData.twitter
  ].filter(Boolean).length;

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate('/club/sponsors')}>
            <FaArrowLeft />
          </button>
          <div>
            <h1>{isEdit ? 'Modifica Sponsor' : 'Nuovo Sponsor'}</h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0 0' }}>
              {isEdit ? `Modifica ${formData.ragione_sociale || 'sponsor'}` : 'Aggiungi un nuovo sponsor al tuo club'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="sf-two-column-layout">
        {/* Left Column - Form */}
        <div className="sf-form-column">
          {/* Main Card */}
          <div className="sf-card">
            {/* Wizard Steps */}
            <div className="sf-wizard-steps">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.number}
                    className={`sf-step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
                    onClick={() => goToStep(step.number)}
                  >
                    <div className="sf-step-number">
                      {currentStep > step.number ? <FaCheck /> : <StepIcon size={18} />}
                    </div>
                    <span className="sf-step-title">{step.title}</span>
                    {index < steps.length - 1 && <div className="sf-step-connector" />}
                  </div>
                );
              })}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
              {/* Step 1: Informazioni */}
              {currentStep === 1 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Informazioni Generali</h2>

                  {/* Logo Upload */}
                  <div className="sf-logo-section">
                    <label className="sf-label">Logo Sponsor</label>
                    {logoPreview ? (
                      <div className="sf-logo-preview">
                        <img src={logoPreview} alt="Logo preview" />
                        <button type="button" className="sf-logo-remove" onClick={removeLogo}>
                          <FaTrash />
                        </button>
                      </div>
                    ) : (
                      <label className="sf-logo-upload" htmlFor="logo-upload">
                        <FaCamera />
                        <span>Carica Logo</span>
                        <small>PNG, JPG, GIF, SVG, WEBP - Max 5MB</small>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
                          onChange={handleLogoChange}
                        />
                      </label>
                    )}
                    {errors.logo && <span className="sf-error">{errors.logo}</span>}
                  </div>

                  <div className="form-group">
                    <label>Ragione Sociale <span className="required">*</span></label>
                    <input
                      type="text"
                      name="ragione_sociale"
                      value={formData.ragione_sociale}
                      onChange={handleChange}
                      placeholder="es. Acme Corporation S.r.l."
                      className={errors.ragione_sociale ? 'error' : ''}
                    />
                    {errors.ragione_sociale && <span className="error-message">{errors.ragione_sociale}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Settore Merceologico</label>
                      <select
                        name="settore_merceologico"
                        value={formData.settore_merceologico}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '2px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: 'white',
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center'
                        }}
                      >
                        <option value="">Seleziona settore...</option>
                        {SETTORI_MERCEOLOGICI.map(settore => (
                          <option key={settore} value={settore}>{settore}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Partita IVA</label>
                      <input
                        type="text"
                        name="partita_iva"
                        value={formData.partita_iva}
                        onChange={handleChange}
                        placeholder="12345678901"
                        maxLength="11"
                        className={errors.partita_iva ? 'error' : ''}
                      />
                      {errors.partita_iva && <span className="error-message">{errors.partita_iva}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Codice Fiscale</label>
                    <input
                      type="text"
                      name="codice_fiscale"
                      value={formData.codice_fiscale}
                      onChange={handleChange}
                      placeholder="RSSMRA80A01H501U"
                      maxLength="16"
                      className={errors.codice_fiscale ? 'error' : ''}
                    />
                    {errors.codice_fiscale && <span className="error-message">{errors.codice_fiscale}</span>}
                  </div>
                </div>
              )}

              {/* Step 2: Contatti */}
              {currentStep === 2 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Informazioni di Contatto</h2>

                  {/* Info Box */}
                  {!isEdit && (
                    <div style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '18px' }}>💡</span>
                      <div style={{ fontSize: '13px', color: '#1E40AF', lineHeight: '1.5' }}>
                        <strong>Nuovo sistema di invito:</strong> Dopo aver creato lo sponsor, riceverai un link da condividere.
                        Lo sponsor cliccherà il link per registrarsi con le proprie credenziali e unirsi al tuo club.
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email (opzionale)</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="info@sponsor.com"
                        className={errors.email ? 'error' : ''}
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                      <span className="form-hint">Verrà pre-compilata nel link di invito</span>
                    </div>

                    <div className="form-group">
                      <label>Telefono</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+39 02 1234567"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Sito Web</label>
                    <input
                      type="url"
                      name="sito_web"
                      value={formData.sito_web}
                      onChange={handleChange}
                      placeholder="https://www.sponsor.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Indirizzo Sede</label>
                    <textarea
                      name="indirizzo_sede"
                      value={formData.indirizzo_sede}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Via Roma, 123&#10;20100 Milano (MI)"
                    />
                  </div>

                  <h3 className="sf-section-title" style={{ marginTop: '24px' }}>Referente (opzionale)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nome</label>
                      <input
                        type="text"
                        name="referente_nome"
                        value={formData.referente_nome}
                        onChange={handleChange}
                        placeholder="Mario"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cognome</label>
                      <input
                        type="text"
                        name="referente_cognome"
                        value={formData.referente_cognome}
                        onChange={handleChange}
                        placeholder="Rossi"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Ruolo</label>
                      <input
                        type="text"
                        name="referente_ruolo"
                        value={formData.referente_ruolo}
                        onChange={handleChange}
                        placeholder="Marketing Manager"
                      />
                    </div>
                    <div className="form-group">
                      <label>Contatto Diretto</label>
                      <input
                        type="text"
                        name="referente_contatto"
                        value={formData.referente_contatto}
                        onChange={handleChange}
                        placeholder="email o telefono"
                      />
                    </div>
                  </div>

                  <h3 className="sf-section-title" style={{ marginTop: '24px' }}>Note Interne</h3>
                  <div className="form-group">
                    <label>Note per il club (non visibili allo sponsor)</label>
                    <textarea
                      name="note_interne"
                      value={formData.note_interne}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Appunti interni, storico relazione, ecc."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Social */}
              {currentStep === 3 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Profili Social Media</h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="sf-social-label">
                        <FaFacebook style={{ color: '#1877F2' }} />
                        Facebook
                      </label>
                      <input
                        type="url"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleChange}
                        placeholder="https://www.facebook.com/pagina"
                      />
                    </div>

                    <div className="form-group">
                      <label className="sf-social-label">
                        <FaInstagram style={{ color: '#E4405F' }} />
                        Instagram
                      </label>
                      <input
                        type="url"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        placeholder="https://www.instagram.com/profilo"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="sf-social-label">
                        <FaTiktok />
                        TikTok
                      </label>
                      <input
                        type="url"
                        name="tiktok"
                        value={formData.tiktok}
                        onChange={handleChange}
                        placeholder="https://www.tiktok.com/@profilo"
                      />
                    </div>

                    <div className="form-group">
                      <label className="sf-social-label">
                        <FaLinkedin style={{ color: '#0A66C2' }} />
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        placeholder="https://www.linkedin.com/company/profilo"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="sf-social-label">
                        <FaTwitter style={{ color: '#1DA1F2' }} />
                        Twitter/X
                      </label>
                      <input
                        type="url"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleChange}
                        placeholder="https://twitter.com/profilo"
                      />
                    </div>
                    <div className="form-group" />
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="sf-form-actions">
                <div className="sf-actions-left">
                  {currentStep > 1 && (
                    <button type="button" className="sf-btn sf-btn-outline" onClick={prevStep}>
                      <FaArrowLeft /> Indietro
                    </button>
                  )}
                </div>

                <div className="sf-actions-right">
                  <button type="button" className="sf-btn sf-btn-outline" onClick={() => navigate('/club/sponsors')}>
                    Annulla
                  </button>

                  {currentStep < totalSteps ? (
                    <button type="button" className="sf-btn sf-btn-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextStep(); }}>
                      Avanti <FaArrowRight />
                    </button>
                  ) : (
                    <button type="submit" className="sf-btn sf-btn-primary" disabled={loading}>
                      {uploadingLogo ? 'Caricamento...' : loading ? 'Salvataggio...' : (isEdit ? 'Salva Modifiche' : 'Crea Sponsor')}
                    </button>
                  )}
                </div>
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
            overflow: 'hidden',
            position: 'sticky',
            top: '24px'
          }}>
            {/* Preview Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FaEye style={{ color: '#85FF00' }} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anteprima Sponsor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt=""
                    style={{
                      width: '64px', height: '64px', borderRadius: '12px',
                      objectFit: 'contain', background: 'white', border: '2px solid rgba(255,255,255,0.2)',
                      padding: '4px'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FaBuilding size={24} color="white" />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    {formData.ragione_sociale || 'Nome Sponsor'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
                    {formData.settore_merceologico || 'Settore'}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{ padding: '20px' }}>
              {/* Settore Badge */}
              {formData.settore_merceologico && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#EEF2FF', color: '#6366F1'
                  }}>
                    {formData.settore_merceologico}
                  </span>
                </div>
              )}

              {/* Contact Info */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Contatti
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#374151' }}>
                      <span style={{ color: '#9CA3AF' }}>📧</span> {formData.email}
                    </div>
                  )}
                  {formData.telefono && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#374151' }}>
                      <span style={{ color: '#9CA3AF' }}>📞</span> {formData.telefono}
                    </div>
                  )}
                  {formData.sito_web && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#374151' }}>
                      <FaGlobe style={{ color: '#9CA3AF', fontSize: '12px' }} /> {formData.sito_web}
                    </div>
                  )}
                  {!formData.email && !formData.telefono && !formData.sito_web && (
                    <div style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
                      Nessun contatto inserito
                    </div>
                  )}
                </div>
              </div>

              {/* Referente */}
              {(formData.referente_nome || formData.referente_cognome) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Referente
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: '#F9FAFB', borderRadius: '10px'
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaUserTie size={16} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                        {formData.referente_nome} {formData.referente_cognome}
                      </div>
                      {formData.referente_ruolo && (
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {formData.referente_ruolo}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fiscal Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>P.IVA</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                    {formData.partita_iva || '—'}
                  </div>
                </div>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Cod. Fiscale</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                    {formData.codice_fiscale || '—'}
                  </div>
                </div>
              </div>

              {/* Social Links Preview */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Social Media ({socialCount}/5)
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: formData.facebook ? '#1877F2' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <FaFacebook size={16} color={formData.facebook ? 'white' : '#9CA3AF'} />
                  </div>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: formData.instagram ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <FaInstagram size={16} color={formData.instagram ? 'white' : '#9CA3AF'} />
                  </div>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: formData.tiktok ? '#000000' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <FaTiktok size={16} color={formData.tiktok ? 'white' : '#9CA3AF'} />
                  </div>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: formData.linkedin ? '#0A66C2' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <FaLinkedin size={16} color={formData.linkedin ? 'white' : '#9CA3AF'} />
                  </div>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: formData.twitter ? '#1DA1F2' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <FaTwitter size={16} color={formData.twitter ? 'white' : '#9CA3AF'} />
                  </div>
                </div>
              </div>

              {/* Address */}
              {formData.indirizzo_sede && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px', background: '#F9FAFB', borderRadius: '10px'
                }}>
                  <span style={{ color: '#9CA3AF', marginTop: '2px' }}>📍</span>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {formData.indirizzo_sede}
                  </div>
                </div>
              )}

              {/* Completion Status */}
              <div style={{
                marginTop: '20px',
                padding: '12px 16px',
                background: currentStep === totalSteps ? '#ECFDF5' : '#FEF3C7',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: currentStep === totalSteps ? '#059669' : '#D97706'
                }}>
                  {currentStep === totalSteps ? 'Pronto per la creazione' : `Step ${currentStep} di ${totalSteps}`}
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  {Math.round((currentStep / totalSteps) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
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
              ? `Sei sicuro di voler salvare le modifiche allo sponsor "${formData.ragione_sociale}"?`
              : `Sei sicuro di voler creare il nuovo sponsor "${formData.ragione_sociale}"?`
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
              {isEdit ? 'Conferma' : 'Crea Sponsor'}
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

export default SponsorForm;
