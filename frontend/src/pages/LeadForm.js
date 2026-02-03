import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubAPI, uploadAPI, getImageUrl } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import GuidedTour from '../components/GuidedTour';
import SupportWidget from '../components/SupportWidget';
import { FaArrowLeft, FaArrowRight, FaCheck, FaExclamationTriangle, FaEye, FaPlus, FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaGlobe, FaUserTie, FaTrashAlt, FaUsers, FaTag, FaImage, FaTimes, FaChevronDown, FaPalette } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { SETTORI_MERCEOLOGICI as SETTORI } from '../constants/settori';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const FONTE_OPTIONS = [
  { value: 'referral', label: 'Referral' },
  { value: 'evento', label: 'Evento' },
  { value: 'social', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'website', label: 'Website' },
  { value: 'altro', label: 'Altro' }
];

const RUOLO_DECISIONALE_OPTIONS = [
  { value: 'decisore', label: 'Decisore', color: '#059669' },
  { value: 'influencer', label: 'Influencer', color: '#8B5CF6' },
  { value: 'campione', label: 'Campione', color: '#3B82F6' },
  { value: 'bloccante', label: 'Bloccante', color: '#EF4444' },
  { value: 'utente', label: 'Utente', color: '#F59E0B' }
];

const EMPTY_CONTACT = {
  nome: '',
  cognome: '',
  ruolo: '',
  email: '',
  telefono: '',
  ruolo_decisionale: '',
  linkedin: '',
  note: ''
};

function LeadForm() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const isEdit = !!leadId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState([]);

  // Logo upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  // Custom Dropdowns
  const [settoreOpen, setSettoreOpen] = useState(false);
  const [fonteOpen, setFonteOpen] = useState(false);
  const settoreRef = useRef(null);
  const fonteRef = useRef(null);

  // Ruolo decisionale dropdown (tracks which contact index is open)
  const [ruoloDropdownIndex, setRuoloDropdownIndex] = useState(null);

  // New Tag creation inline
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366F1');
  const [savingTag, setSavingTag] = useState(false);

  const TAG_COLORS = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#10B981', '#14B8A6', '#3B82F6', '#F97316', '#84CC16'
  ];

  // Guided Tour
  const [isTourOpen, setIsTourOpen] = useState(false);
  const handleStartTour = () => setIsTourOpen(true);
  const handleTourClose = useCallback(() => setIsTourOpen(false), []);

  const tourSteps = [
    {
      target: '[data-tour="form-wizard"]',
      title: 'Wizard Guidato in 4 Step',
      content: 'Il form è organizzato in 4 step progressivi: Azienda, Contatti, Contatti Aziendali e Valutazione. Puoi navigare liberamente tra gli step cliccando sui numeri in alto oppure usando i pulsanti Avanti/Indietro in basso. Uno step completato mostra un segno di spunta verde.',
      placement: 'bottom',
      tip: 'Solo la ragione sociale è obbligatoria per creare un lead. Tutti gli altri campi possono essere compilati anche successivamente dalla scheda di dettaglio del lead.',
      icon: <FaCheck size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #85FF00, #65A30D)'
    },
    {
      target: '[data-tour="form-company"]',
      title: 'Step 1 — Identità Aziendale',
      content: 'Inserisci l\'identità dell\'azienda: Ragione Sociale (unico campo obbligatorio) e URL Logo per il branding visuale nella pipeline. Poi Settore Merceologico (23 categorie), Fonte di acquisizione (Referral, Evento, Social, Cold Call, Website), dati fiscali (Partita IVA 11 cifre, Codice Fiscale 16 caratteri) e Priorità (Bassa, Media, Alta).',
      placement: 'top',
      tip: 'Il logo viene mostrato nella scheda lead e nella pipeline Kanban. Il sistema controlla automaticamente i duplicati su ragione sociale, email e P.IVA prima della creazione.',
      icon: <FaArrowRight size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    },
    {
      target: '[data-tour="form-contacts"]',
      title: 'Step 2 — Contatti e Social Media',
      content: 'Compila tutti i canali di comunicazione: Email aziendale (con validazione automatica), Telefono, Sito Web, Indirizzo Sede. In basso la sezione Social Media: LinkedIn, Instagram, Facebook, X (Twitter) e TikTok. Questi profili social contribuiscono al Lead Score nella componente "completezza profilo".',
      placement: 'top',
      tip: 'Più canali di contatto inserisci, più alto sarà il Lead Score. Ogni social media compilato aggiunge punti alla valutazione del profilo.',
      icon: <FaGlobe size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
    },
    {
      target: '[data-tour="form-referente"]',
      title: 'Step 3 — Referente e Contatti Decisionali',
      content: 'In alto il Referente Principale: Nome, Cognome, Ruolo aziendale e Contatto diretto. Sotto, la sezione "Contatti Aziendali Aggiuntivi" per mappare l\'intero team decisionale: per ogni contatto puoi indicare Nome, Cognome, Ruolo, il Ruolo Decisionale (Decisore, Influencer, Campione, Bloccante, Utente), Email, Telefono, LinkedIn e Note.',
      placement: 'top',
      tip: 'Mappare i ruoli decisionali fin da subito accelera la trattativa. Sapere chi è il Decisore, chi l\'Influencer e chi il potenziale Bloccante ti dà un vantaggio strategico nella negoziazione.',
      icon: <FaUsers size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    {
      target: '[data-tour="form-deal"]',
      title: 'Step 4 — Valutazione, Tag e Riepilogo',
      content: 'Stima il Valore del deal in euro e la Probabilità di Chiusura (barra colorata: verde >70%, giallo 40-70%, rosso <40%). Pianifica la Data del Prossimo Contatto e aggiungi Note (max 2000 car.). Sezione Tag: seleziona tag colorati per segmentare il lead nella pipeline. In fondo, il Riepilogo automatico mostra azienda, valore, probabilità, referente, contatti e tag.',
      placement: 'top',
      tip: 'Valore e Probabilità influenzano il Lead Score e le previsioni pipeline. I tag facilitano il filtraggio nella vista Kanban e Lista.',
      icon: <FaTag size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #059669)'
    }
  ];

  const totalSteps = 4;

  const steps = [
    { number: 1, title: 'Azienda' },
    { number: 2, title: 'Contatti' },
    { number: 3, title: 'Contatti' },
    { number: 4, title: 'Valutazione' }
  ];

  const [formData, setFormData] = useState({
    ragione_sociale: '',
    settore_merceologico: '',
    fonte: '',
    priorita: 2,
    logo_url: '',
    email: '',
    telefono: '',
    sito_web: '',
    indirizzo_sede: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    tiktok: '',
    referente_nome: '',
    referente_cognome: '',
    referente_ruolo: '',
    referente_contatto: '',
    valore_stimato: '',
    probabilita_chiusura: '',
    data_prossimo_contatto: '',
    note: '',
    partita_iva: '',
    codice_fiscale: ''
  });

  // Additional contacts (beyond the primary referente)
  const [contactsList, setContactsList] = useState([]);

  // Tags
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchTags();
    if (isEdit) {
      fetchLead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const fetchTags = async () => {
    try {
      const response = await clubAPI.getTags();
      setAvailableTags(response.data || []);
    } catch (error) {
      console.error('Errore caricamento tag:', error);
    }
  };

  // Click-outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settoreRef.current && !settoreRef.current.contains(e.target)) {
        setSettoreOpen(false);
      }
      if (fonteRef.current && !fonteRef.current.contains(e.target)) {
        setFonteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      setSavingTag(true);
      const response = await clubAPI.createTag({ nome: newTagName.trim(), colore: newTagColor });
      const createdTag = response.data.tag;
      setAvailableTags(prev => [...prev, createdTag]);
      setSelectedTagIds(prev => [...prev, createdTag.id]);
      setNewTagName('');
      setNewTagColor('#6366F1');
      setShowNewTagForm(false);
      setToast({ message: `Tag "${createdTag.nome}" creato e assegnato!`, type: 'success' });
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore creazione tag', type: 'error' });
    } finally {
      setSavingTag(false);
    }
  };

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await clubAPI.getLead(leadId);
      const lead = response.data;

      setFormData({
        ragione_sociale: lead.ragione_sociale || '',
        settore_merceologico: lead.settore_merceologico || '',
        fonte: lead.fonte || '',
        priorita: lead.priorita || 2,
        logo_url: lead.logo_url || '',
        email: lead.email || '',
        telefono: lead.telefono || '',
        sito_web: lead.sito_web || '',
        indirizzo_sede: lead.indirizzo_sede || '',
        facebook: lead.facebook || '',
        instagram: lead.instagram || '',
        linkedin: lead.linkedin || '',
        twitter: lead.twitter || '',
        tiktok: lead.tiktok || '',
        referente_nome: lead.referente_nome || '',
        referente_cognome: lead.referente_cognome || '',
        referente_ruolo: lead.referente_ruolo || '',
        referente_contatto: lead.referente_contatto || '',
        valore_stimato: lead.valore_stimato || '',
        probabilita_chiusura: lead.probabilita_chiusura || '',
        data_prossimo_contatto: lead.data_prossimo_contatto ? lead.data_prossimo_contatto.slice(0, 16) : '',
        note: lead.note || '',
        partita_iva: lead.partita_iva || '',
        codice_fiscale: lead.codice_fiscale || ''
      });

      // Load existing contacts
      try {
        const contactsRes = await clubAPI.getLeadContacts(leadId);
        const existingContacts = (contactsRes.data || []).map(c => ({
          id: c.id,
          nome: c.nome || '',
          cognome: c.cognome || '',
          ruolo: c.ruolo || '',
          email: c.email || '',
          telefono: c.telefono || '',
          ruolo_decisionale: c.ruolo_decisionale || '',
          linkedin: c.linkedin || '',
          note: c.note || ''
        }));
        setContactsList(existingContacts);
      } catch (err) {
        console.error('Errore caricamento contatti:', err);
      }

      // Load existing tags
      try {
        const tagsRes = await clubAPI.getLeadTags(leadId);
        setSelectedTagIds((tagsRes.data || []).map(t => t.id));
      } catch (err) {
        console.error('Errore caricamento tag:', err);
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

  // ── Contact helpers ──
  const addContact = () => {
    setContactsList(prev => [...prev, { ...EMPTY_CONTACT }]);
  };

  const removeContact = (index) => {
    setContactsList(prev => prev.filter((_, i) => i !== index));
  };

  const updateContact = (index, field, value) => {
    setContactsList(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  // ── Tag helpers ──
  const toggleTag = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.ragione_sociale.trim()) {
        newErrors.ragione_sociale = 'Inserisci la ragione sociale';
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

  // Logo upload handler
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Seleziona un file immagine valido', type: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Il file non può superare 5MB', type: 'error' });
      return;
    }

    try {
      setLogoUploading(true);
      setLogoFile(file);

      const response = await uploadAPI.uploadLogo(file);
      const { file_url } = response.data;

      setFormData(prev => ({ ...prev, logo_url: file_url }));
      setToast({ message: 'Logo caricato con successo', type: 'success' });
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

  const handleConfirmedSubmit = async (force = false) => {
    setShowConfirmModal(false);
    setShowDuplicateModal(false);

    try {
      setSaving(true);

      const dataToSend = {
        ...formData,
        valore_stimato: formData.valore_stimato ? parseFloat(formData.valore_stimato) : 0,
        probabilita_chiusura: formData.probabilita_chiusura ? parseInt(formData.probabilita_chiusura) : 0,
        priorita: parseInt(formData.priorita),
        ...(force ? { force: true } : {})
      };

      let targetLeadId;

      if (isEdit) {
        await clubAPI.updateLead(leadId, dataToSend);
        targetLeadId = leadId;

        // In edit mode: sync contacts - create new ones (existing ones already loaded)
        for (const contact of contactsList) {
          if (!contact.id && contact.nome && contact.cognome) {
            try {
              await clubAPI.createLeadContact(targetLeadId, contact);
            } catch (err) {
              console.error('Errore creazione contatto:', err);
            }
          }
        }

        // Sync tags - get current tags and diff
        try {
          const currentTagsRes = await clubAPI.getLeadTags(targetLeadId);
          const currentTagIds = (currentTagsRes.data || []).map(t => t.id);
          // Add new tags
          for (const tagId of selectedTagIds) {
            if (!currentTagIds.includes(tagId)) {
              await clubAPI.assignLeadTag(targetLeadId, tagId);
            }
          }
          // Remove unselected tags
          for (const tagId of currentTagIds) {
            if (!selectedTagIds.includes(tagId)) {
              await clubAPI.removeLeadTag(targetLeadId, tagId);
            }
          }
        } catch (err) {
          console.error('Errore sincronizzazione tag:', err);
        }

        setToast({ message: 'Lead aggiornato con successo!', type: 'success' });
        setTimeout(() => navigate(`/club/leads/${targetLeadId}`), 1500);
      } else {
        const response = await clubAPI.createLead(dataToSend);
        targetLeadId = response.data.lead?.id || response.data.id;

        // Create additional contacts
        for (const contact of contactsList) {
          if (contact.nome && contact.cognome) {
            try {
              await clubAPI.createLeadContact(targetLeadId, {
                ...contact,
                is_referente_principale: false
              });
            } catch (err) {
              console.error('Errore creazione contatto:', err);
            }
          }
        }

        // Assign selected tags
        for (const tagId of selectedTagIds) {
          try {
            await clubAPI.assignLeadTag(targetLeadId, tagId);
          } catch (err) {
            console.error('Errore assegnazione tag:', err);
          }
        }

        setToast({ message: 'Lead creato con successo!', type: 'success' });
        setTimeout(() => navigate(`/club/leads/${targetLeadId}`), 1500);
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      // Handle duplicate detection
      if (error.response?.status === 409 && error.response?.data?.warning === 'duplicate') {
        setDuplicates(error.response.data.duplicates || []);
        setShowDuplicateModal(true);
      } else {
        setToast({ message: error.response?.data?.error || 'Errore nel salvataggio', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sponsor-form-page">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #E5E7EB',
            borderTopColor: '#85FF00',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Caricamento dati lead...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Priority config for preview
  const PRIORITY_LABELS = { 1: 'Bassa', 2: 'Media', 3: 'Alta' };
  const PRIORITY_COLORS = { 1: '#3B82F6', 2: '#F59E0B', 3: '#EF4444' };

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
          {/* Main Card */}
          <div className="sf-card">
        {/* Wizard Steps */}
        <div className="sf-wizard-steps" data-tour="form-wizard">
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
          {/* Step 1: Dati Aziendali */}
          {currentStep === 1 && (
            <div className="sf-step-content" data-tour="form-company">
              <h2 className="sf-section-title">Dati Aziendali</h2>

              {/* Ragione Sociale */}
              <div className="form-group">
                <label>Ragione Sociale <span className="required">*</span></label>
                <input
                  type="text"
                  name="ragione_sociale"
                  value={formData.ragione_sociale}
                  onChange={handleChange}
                  placeholder="Nome dell'azienda"
                  className={errors.ragione_sociale ? 'error' : ''}
                />
                {errors.ragione_sociale && <span className="error-message">{errors.ragione_sociale}</span>}
              </div>

              {/* Logo Azienda */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaImage style={{ color: '#8B5CF6' }} /> Logo Azienda
                </label>
                {formData.logo_url ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px', border: '2px solid #E5E7EB', borderRadius: '8px', background: '#FAFAFA'
                  }}>
                    <img
                      src={getImageUrl(formData.logo_url)}
                      alt="Logo"
                      style={{
                        width: '48px', height: '48px', borderRadius: '8px',
                        objectFit: 'contain', border: '1px solid #E5E7EB', background: 'white'
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>Logo caricato</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{logoFile?.name || 'Immagine esistente'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      style={{
                        padding: '8px 12px', borderRadius: '6px', border: 'none',
                        background: '#FEE2E2', color: '#DC2626', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500
                      }}
                    >
                      <FaTimes size={12} /> Rimuovi
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                      padding: '20px', border: '2px dashed #E5E7EB', borderRadius: '8px',
                      background: '#FAFAFA', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#85FF00'; e.currentTarget.style.background = '#F0FDF4'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#FAFAFA'; }}
                  >
                    {logoUploading ? (
                      <>
                        <div className="spinner" style={{ width: '20px', height: '20px' }} />
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>Caricamento in corso...</span>
                      </>
                    ) : (
                      <>
                        <FaImage style={{ fontSize: '20px', color: '#9CA3AF' }} />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Clicca per caricare il logo</span>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>PNG, JPG fino a 5MB</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="form-row">
                {/* Custom Dropdown: Settore */}
                <div className="form-group" ref={settoreRef} style={{ position: 'relative' }}>
                  <label>Settore Merceologico</label>
                  <button
                    type="button"
                    onClick={() => { setSettoreOpen(!settoreOpen); setFonteOpen(false); }}
                    style={{
                      width: '100%', padding: '12px 16px',
                      border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px',
                      color: formData.settore_merceologico ? '#1A1A1A' : '#9CA3AF'
                    }}
                  >
                    <span style={{ fontWeight: formData.settore_merceologico ? 500 : 400 }}>
                      {formData.settore_merceologico || 'Seleziona settore...'}
                    </span>
                    <FaChevronDown size={12} style={{
                      transition: 'transform 0.2s',
                      transform: settoreOpen ? 'rotate(180deg)' : 'rotate(0)',
                      color: '#9CA3AF'
                    }} />
                  </button>
                  {settoreOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                      background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100,
                      maxHeight: '280px', overflow: 'hidden'
                    }}>
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {SETTORI.map(s => (
                          <div
                            key={s}
                            onClick={() => { setFormData(prev => ({ ...prev, settore_merceologico: s })); setSettoreOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 16px', cursor: 'pointer', transition: 'background 0.15s',
                              background: formData.settore_merceologico === s ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                              borderLeft: formData.settore_merceologico === s ? '3px solid #85FF00' : '3px solid transparent',
                              fontSize: '14px', color: '#1A1A1A'
                            }}
                            onMouseEnter={e => { if (formData.settore_merceologico !== s) e.currentTarget.style.background = '#F9FAFB'; }}
                            onMouseLeave={e => { if (formData.settore_merceologico !== s) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <span style={{ fontWeight: formData.settore_merceologico === s ? 600 : 400 }}>{s}</span>
                            {formData.settore_merceologico === s && <FaCheck size={12} color="#85FF00" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Dropdown: Fonte */}
                <div className="form-group" ref={fonteRef} style={{ position: 'relative' }}>
                  <label>Fonte del Lead</label>
                  <button
                    type="button"
                    onClick={() => { setFonteOpen(!fonteOpen); setSettoreOpen(false); }}
                    style={{
                      width: '100%', padding: '12px 16px',
                      border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px',
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
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                      background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100,
                      maxHeight: '280px', overflow: 'hidden'
                    }}>
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {FONTE_OPTIONS.map(f => (
                          <div
                            key={f.value}
                            onClick={() => { setFormData(prev => ({ ...prev, fonte: f.value })); setFonteOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 16px', cursor: 'pointer', transition: 'background 0.15s',
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
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Partita IVA</label>
                  <input
                    type="text"
                    name="partita_iva"
                    value={formData.partita_iva}
                    onChange={handleChange}
                    placeholder="Inserisci P.IVA"
                  />
                </div>

                <div className="form-group">
                  <label>Codice Fiscale</label>
                  <input
                    type="text"
                    name="codice_fiscale"
                    value={formData.codice_fiscale}
                    onChange={handleChange}
                    placeholder="Inserisci Codice Fiscale"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Priorita</label>
                <div className="sf-priority-selector">
                  {[
                    { value: 1, label: 'Bassa', color: '#3B82F6' },
                    { value: 2, label: 'Media', color: '#F59E0B' },
                    { value: 3, label: 'Alta', color: '#EF4444' }
                  ].map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priorita: p.value })}
                      className={`sf-priority-btn ${formData.priorita === p.value ? 'active' : ''}`}
                      style={{
                        '--priority-color': p.color,
                        borderColor: formData.priorita === p.value ? p.color : '#E5E7EB',
                        background: formData.priorita === p.value ? `${p.color}15` : 'white',
                        color: formData.priorita === p.value ? p.color : '#6B7280'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contatti */}
          {currentStep === 2 && (
            <div className="sf-step-content" data-tour="form-contacts">
              <h2 className="sf-section-title">Informazioni di Contatto</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@azienda.it"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
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
                  placeholder="https://www.azienda.it"
                />
              </div>

              <div className="form-group">
                <label>Indirizzo Sede</label>
                <textarea
                  name="indirizzo_sede"
                  value={formData.indirizzo_sede}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Via Roma, 123&#10;20100 Milano (MI)"
                />
              </div>

              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginTop: '24px', marginBottom: '12px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                Social Media & Presenza Online
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaLinkedin style={{ color: '#0A66C2' }} /> LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/company/azienda"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaInstagram style={{ color: '#E4405F' }} /> Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/azienda"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaFacebook style={{ color: '#1877F2' }} /> Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="https://facebook.com/azienda"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaTwitter style={{ color: '#1DA1F2' }} /> X (Twitter)
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder="https://x.com/azienda"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SiTiktok style={{ color: '#000000' }} /> TikTok
                  </label>
                  <input
                    type="url"
                    name="tiktok"
                    value={formData.tiktok}
                    onChange={handleChange}
                    placeholder="https://tiktok.com/@azienda"
                  />
                </div>
                <div className="form-group" />
              </div>
            </div>
          )}

          {/* Step 3: Referente + Contatti Aziendali */}
          {currentStep === 3 && (
            <div className="sf-step-content" data-tour="form-referente">
              <h2 className="sf-section-title">
                <FaUserTie style={{ marginRight: '8px', color: '#85FF00' }} />
                Referente Principale
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', marginTop: '-8px' }}>
                Indica la persona di riferimento principale per questa trattativa.
              </p>

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
                    placeholder="es. Marketing Manager"
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
                      Contatti Aziendali Aggiuntivi
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
                      Mappa i contatti decisionali dell'azienda: decisori, influencer, campioni.
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
                    onMouseEnter={e => { e.target.style.background = 'rgba(133, 255, 0, 0.2)'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(133, 255, 0, 0.1)'; }}
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
                      Nessun contatto aggiuntivo. Clicca "Aggiungi Contatto" per mappare altri referenti aziendali.
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
                        <label>Ruolo Aziendale</label>
                        <input
                          type="text"
                          value={contact.ruolo}
                          onChange={e => updateContact(index, 'ruolo', e.target.value)}
                          placeholder="es. Marketing Director"
                        />
                      </div>
                      <div className="form-group" style={{ position: 'relative' }}>
                        <label>Ruolo Decisionale</label>
                        <button
                          type="button"
                          onClick={() => setRuoloDropdownIndex(ruoloDropdownIndex === index ? null : index)}
                          style={{
                            width: '100%', padding: '12px 16px',
                            border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px',
                            color: contact.ruolo_decisionale ? '#1A1A1A' : '#9CA3AF'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {contact.ruolo_decisionale && (
                              <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: RUOLO_DECISIONALE_OPTIONS.find(r => r.value === contact.ruolo_decisionale)?.color || '#6B7280'
                              }} />
                            )}
                            <span style={{ fontWeight: contact.ruolo_decisionale ? 500 : 400 }}>
                              {RUOLO_DECISIONALE_OPTIONS.find(r => r.value === contact.ruolo_decisionale)?.label || 'Seleziona ruolo...'}
                            </span>
                          </div>
                          <FaChevronDown size={12} style={{
                            transition: 'transform 0.2s',
                            transform: ruoloDropdownIndex === index ? 'rotate(180deg)' : 'rotate(0)',
                            color: '#9CA3AF'
                          }} />
                        </button>
                        {ruoloDropdownIndex === index && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                            background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden'
                          }}>
                            {RUOLO_DECISIONALE_OPTIONS.map(r => (
                              <div
                                key={r.value}
                                onClick={() => { updateContact(index, 'ruolo_decisionale', r.value); setRuoloDropdownIndex(null); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                  padding: '10px 16px', cursor: 'pointer', transition: 'background 0.15s',
                                  background: contact.ruolo_decisionale === r.value ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                  borderLeft: contact.ruolo_decisionale === r.value ? '3px solid #85FF00' : '3px solid transparent',
                                  fontSize: '14px', color: '#1A1A1A'
                                }}
                                onMouseEnter={e => { if (contact.ruolo_decisionale !== r.value) e.currentTarget.style.background = '#F9FAFB'; }}
                                onMouseLeave={e => { if (contact.ruolo_decisionale !== r.value) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <span style={{
                                  width: '10px', height: '10px', borderRadius: '50%',
                                  background: r.color, flexShrink: 0
                                }} />
                                <span style={{ fontWeight: contact.ruolo_decisionale === r.value ? 600 : 400, flex: 1 }}>{r.label}</span>
                                {contact.ruolo_decisionale === r.value && <FaCheck size={12} color="#85FF00" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={e => updateContact(index, 'email', e.target.value)}
                          placeholder="nome@azienda.it"
                        />
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

                    <div className="form-row">
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaLinkedin style={{ color: '#0A66C2' }} /> LinkedIn
                        </label>
                        <input
                          type="url"
                          value={contact.linkedin}
                          onChange={e => updateContact(index, 'linkedin', e.target.value)}
                          placeholder="https://linkedin.com/in/nome"
                        />
                      </div>
                      <div className="form-group">
                        <label>Note</label>
                        <input
                          type="text"
                          value={contact.note}
                          onChange={e => updateContact(index, 'note', e.target.value)}
                          placeholder="Note sul contatto..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Valutazione */}
          {currentStep === 4 && (
            <div className="sf-step-content" data-tour="form-deal">
              <h2 className="sf-section-title">Valutazione Opportunita</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Valore Stimato (EUR)</label>
                  <input
                    type="number"
                    name="valore_stimato"
                    value={formData.valore_stimato}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                  />
                  {formData.valore_stimato && (
                    <span className="form-hint" style={{ color: '#059669' }}>
                      = €{parseInt(formData.valore_stimato).toLocaleString('it-IT')}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Probabilita di Chiusura (%)</label>
                  <input
                    type="number"
                    name="probabilita_chiusura"
                    value={formData.probabilita_chiusura}
                    onChange={handleChange}
                    placeholder="50"
                    min="0"
                    max="100"
                  />
                  {formData.probabilita_chiusura && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        height: '6px',
                        background: '#E5E7EB',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(0, formData.probabilita_chiusura))}%`,
                          background: formData.probabilita_chiusura >= 70 ? '#059669' :
                                     formData.probabilita_chiusura >= 40 ? '#F59E0B' : '#EF4444',
                          transition: 'width 0.3s ease, background 0.3s ease'
                        }} />
                      </div>
                      <span className="form-hint" style={{
                        color: formData.probabilita_chiusura >= 70 ? '#059669' :
                               formData.probabilita_chiusura >= 40 ? '#D97706' : '#DC2626'
                      }}>
                        {formData.probabilita_chiusura >= 70 ? 'Alta probabilità' :
                         formData.probabilita_chiusura >= 40 ? 'Probabilità media' : 'Bassa probabilità'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Note</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Aggiungi note, dettagli o informazioni utili su questo lead..."
                  rows={4}
                  maxLength={2000}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span className="form-hint">Aggiungi informazioni utili per il follow-up</span>
                  <span className="form-hint">{formData.note?.length || 0}/2000</span>
                </div>
              </div>

              {/* Tag Selector */}
              <div style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaTag style={{ color: '#14B8A6' }} />
                  Tag e Segmentazione
                  {selectedTagIds.length > 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 600, background: '#14B8A6', color: 'white',
                      borderRadius: '10px', padding: '2px 8px'
                    }}>
                      {selectedTagIds.length}
                    </span>
                  )}
                </h3>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 12px 0' }}>
                  Seleziona i tag per categorizzare e segmentare questo lead. I tag facilitano il filtraggio nella pipeline.
                </p>

                {/* Tag chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableTags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 14px', borderRadius: '20px',
                          border: `2px solid ${isSelected ? tag.colore : '#E5E7EB'}`,
                          background: isSelected ? `${tag.colore}18` : 'white',
                          color: isSelected ? tag.colore : '#6B7280',
                          fontSize: '13px', fontWeight: isSelected ? 600 : 500,
                          cursor: 'pointer', transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: tag.colore, flexShrink: 0
                        }} />
                        {tag.nome}
                        {isSelected && <FaCheck size={10} />}
                      </button>
                    );
                  })}

                  {/* Create new tag button */}
                  {!showNewTagForm && (
                    <button
                      type="button"
                      onClick={() => setShowNewTagForm(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '20px',
                        border: '2px dashed #D1D5DB', background: 'white',
                        color: '#6B7280', fontSize: '13px', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#85FF00'; e.currentTarget.style.color = '#1A1A1A'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280'; }}
                    >
                      <FaPlus size={10} /> Crea nuovo tag
                    </button>
                  )}
                </div>

                {/* Inline new tag form */}
                {showNewTagForm && (
                  <div style={{
                    marginTop: '12px', padding: '16px', background: '#F9FAFB',
                    borderRadius: '10px', border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaPalette style={{ color: '#8B5CF6' }} /> Nuovo Tag
                      </span>
                      <button
                        type="button"
                        onClick={() => { setShowNewTagForm(false); setNewTagName(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px', display: 'block' }}>Nome tag</label>
                        <input
                          type="text"
                          value={newTagName}
                          onChange={e => setNewTagName(e.target.value)}
                          placeholder="es. Premium, B2B, Sponsor Tecnico..."
                          style={{
                            width: '100%', padding: '8px 12px', border: '2px solid #E5E7EB',
                            borderRadius: '8px', fontSize: '13px', outline: 'none'
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px', display: 'block' }}>Colore</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {TAG_COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewTagColor(c)}
                              style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                background: c, border: newTagColor === c ? '2px solid #1A1A1A' : '2px solid transparent',
                                cursor: 'pointer', transition: 'all 0.15s',
                                transform: newTagColor === c ? 'scale(1.15)' : 'scale(1)'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateTag}
                        disabled={!newTagName.trim() || savingTag}
                        style={{
                          padding: '8px 16px', borderRadius: '8px', border: 'none',
                          background: newTagName.trim() ? '#1A1A1A' : '#E5E7EB',
                          color: newTagName.trim() ? 'white' : '#9CA3AF',
                          fontSize: '13px', fontWeight: 600, cursor: newTagName.trim() ? 'pointer' : 'default',
                          transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}
                      >
                        {savingTag ? 'Creazione...' : 'Crea'}
                      </button>
                    </div>
                  </div>
                )}

                {availableTags.length === 0 && !showNewTagForm && (
                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '8px 0 0 0' }}>
                    Nessun tag ancora creato. Usa il pulsante sopra per creare il primo tag.
                  </p>
                )}
              </div>

              {/* Summary */}
              {formData.ragione_sociale && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  background: 'rgba(133, 255, 0, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(133, 255, 0, 0.3)'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                    Riepilogo Lead
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Azienda</div>
                      <div style={{ fontWeight: 600, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {formData.logo_url && (
                          <img src={getImageUrl(formData.logo_url)} alt="" style={{
                            width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain'
                          }} onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        {formData.ragione_sociale}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Valore</div>
                      <div style={{ fontWeight: 600, color: '#1A1A1A' }}>
                        EUR {formData.valore_stimato ? parseInt(formData.valore_stimato).toLocaleString('it-IT') : '0'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Probabilita</div>
                      <div style={{ fontWeight: 600, color: '#1A1A1A' }}>{formData.probabilita_chiusura || 0}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Referente</div>
                      <div style={{ fontWeight: 600, color: '#1A1A1A' }}>
                        {formData.referente_nome || formData.referente_cognome
                          ? `${formData.referente_nome} ${formData.referente_cognome}`.trim()
                          : 'Non specificato'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Contatti</div>
                      <div style={{ fontWeight: 600, color: '#1A1A1A' }}>
                        {contactsList.length > 0 ? `${contactsList.length} aggiuntiv${contactsList.length === 1 ? 'o' : 'i'}` : 'Solo referente'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Tag</div>
                      <div style={{ fontWeight: 600, color: '#1A1A1A' }}>
                        {selectedTagIds.length > 0 ? `${selectedTagIds.length} tag` : 'Nessun tag'}
                      </div>
                    </div>
                  </div>
                </div>
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
              <button type="button" className="sf-btn sf-btn-outline" onClick={() => navigate(-1)}>
                Annulla
              </button>

              {currentStep < totalSteps ? (
                <button type="button" className="sf-btn sf-btn-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextStep(); }}>
                  Avanti
                  <FaArrowRight />
                </button>
              ) : (
                <button type="submit" className="sf-btn sf-btn-primary" disabled={saving}>
                  {saving ? 'Salvataggio...' : (isEdit ? 'Salva Modifiche' : 'Crea Lead')}
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
            overflow: 'hidden'
          }}>
            {/* Preview Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FaEye style={{ color: '#85FF00' }} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anteprima Lead</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {formData.logo_url ? (
                  <img
                    src={getImageUrl(formData.logo_url)}
                    alt=""
                    style={{
                      width: '56px', height: '56px', borderRadius: '12px',
                      objectFit: 'contain', background: 'white', border: '2px solid rgba(255,255,255,0.2)'
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #85FF00 0%, #70E000 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 700, color: '#1A1A1A'
                  }}>
                    {(formData.ragione_sociale || 'N').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    {formData.ragione_sociale || 'Nome Azienda'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
                    {formData.settore_merceologico || 'Settore non specificato'}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{ padding: '20px' }}>
              {/* Priority & Source */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: `${PRIORITY_COLORS[formData.priorita] || '#F59E0B'}15`,
                  color: PRIORITY_COLORS[formData.priorita] || '#F59E0B'
                }}>
                  Priorità {PRIORITY_LABELS[formData.priorita] || 'Media'}
                </span>
                {formData.fonte && (
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#EEF2FF', color: '#6366F1'
                  }}>
                    {FONTE_OPTIONS.find(f => f.value === formData.fonte)?.label || formData.fonte}
                  </span>
                )}
              </div>

              {/* Dati Fiscali */}
              {(formData.partita_iva || formData.codice_fiscale) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Dati Fiscali
                  </div>
                  {formData.partita_iva && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', color: '#374151' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>P.IVA</span> {formData.partita_iva}
                    </div>
                  )}
                  {formData.codice_fiscale && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>C.F.</span> {formData.codice_fiscale}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Info */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Contatti
                </div>
                {formData.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', color: '#374151' }}>
                    <span style={{ color: '#9CA3AF' }}>✉</span> {formData.email}
                  </div>
                )}
                {formData.telefono && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', color: '#374151' }}>
                    <span style={{ color: '#9CA3AF' }}>📞</span> {formData.telefono}
                  </div>
                )}
                {formData.sito_web && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', color: '#374151' }}>
                    <FaGlobe style={{ color: '#9CA3AF', fontSize: '12px' }} /> {formData.sito_web}
                  </div>
                )}
                {formData.indirizzo_sede && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', color: '#374151' }}>
                    <span style={{ color: '#9CA3AF' }}>📍</span> {formData.indirizzo_sede}
                  </div>
                )}
                {!formData.email && !formData.telefono && !formData.sito_web && !formData.indirizzo_sede && (
                  <div style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>Nessun contatto inserito</div>
                )}
              </div>

              {/* Referente */}
              {(formData.referente_nome || formData.referente_cognome) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Referente Principale
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaUserTie style={{ color: '#6B7280', fontSize: '14px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                        {formData.referente_nome} {formData.referente_cognome}
                      </div>
                      {formData.referente_ruolo && (
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{formData.referente_ruolo}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Contacts Count */}
              {contactsList.filter(c => c.nome || c.cognome).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 12px', background: '#F9FAFB', borderRadius: '8px'
                  }}>
                    <FaUsers style={{ color: '#6B7280' }} />
                    <span style={{ fontSize: '13px', color: '#374151' }}>
                      +{contactsList.filter(c => c.nome || c.cognome).length} altri contatti
                    </span>
                  </div>
                </div>
              )}

              {/* Value & Probability */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Valore Stimato</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
                    €{(parseFloat(formData.valore_stimato) || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Probabilità</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#3B82F6' }}>
                    {formData.probabilita_chiusura || 0}%
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {(formData.linkedin || formData.instagram || formData.facebook || formData.twitter || formData.tiktok) && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Social
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {formData.linkedin && <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaLinkedin style={{ color: '#0A66C2' }} /></div>}
                    {formData.instagram && <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaInstagram style={{ color: '#E4405F' }} /></div>}
                    {formData.facebook && <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaFacebook style={{ color: '#1877F2' }} /></div>}
                    {formData.twitter && <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTwitter style={{ color: '#1DA1F2' }} /></div>}
                    {formData.tiktok && <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SiTiktok style={{ color: '#000000' }} /></div>}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedTagIds.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Tags
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedTagIds.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <span
                          key={tagId}
                          style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                            background: `${tag.colore}20`, color: tag.colore
                          }}
                        >
                          {tag.nome}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes Preview */}
              {formData.note && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Note
                  </div>
                  <div style={{
                    fontSize: '13px', color: '#6B7280', lineHeight: 1.5,
                    padding: '10px 12px', background: '#FFFBEB', borderRadius: '8px', borderLeft: '3px solid #F59E0B'
                  }}>
                    {formData.note.length > 100 ? formData.note.substring(0, 100) + '...' : formData.note}
                  </div>
                </div>
              )}
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
              ? `Sei sicuro di voler salvare le modifiche al lead "${formData.ragione_sociale}"?`
              : `Sei sicuro di voler creare il nuovo lead "${formData.ragione_sociale}"?`
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
              {isEdit ? 'Conferma' : 'Crea Lead'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Warning Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Possibili Duplicati"
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '14px',
            padding: '14px', background: '#FFFBEB', borderRadius: '12px', marginBottom: '20px'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <FaExclamationTriangle size={16} color="#D97706" />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#92400E', fontWeight: 600, marginBottom: '2px' }}>
                Attenzione: lead simile gia' presente
              </p>
              <p style={{ fontSize: '13px', color: '#A16207' }}>
                Abbiamo trovato {duplicates.length === 1 ? 'un lead' : `${duplicates.length} lead`} con dati corrispondenti. Vuoi procedere comunque?
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {duplicates.map(dup => {
              const matchLabels = {
                ragione_sociale: 'Stessa ragione sociale',
                email: 'Stessa email',
                partita_iva: 'Stessa P.IVA'
              };
              return (
                <div key={dup.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', background: '#F9FAFB', borderRadius: '10px',
                  border: '1px solid #F3F4F6'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                      {dup.ragione_sociale}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                        background: '#FEF3C7', color: '#D97706', fontWeight: 500
                      }}>
                        {matchLabels[dup.match_field] || dup.match_field}
                      </span>
                      {dup.email && (
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>{dup.email}</span>
                      )}
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                        background: '#EEF2FF', color: '#6366F1', fontWeight: 500
                      }}>
                        {dup.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/club/leads/${dup.id}`)}
                    className="sf-btn sf-btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FaEye size={11} /> Vedi
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              className="sf-btn sf-btn-outline"
              onClick={() => setShowDuplicateModal(false)}
            >
              Annulla
            </button>
            <button
              className="sf-btn sf-btn-primary"
              onClick={() => handleConfirmedSubmit(true)}
              disabled={saving}
            >
              {saving ? 'Creazione...' : 'Crea Comunque'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Support Widget */}
      <SupportWidget
        pageTitle={isEdit ? "Modifica Lead" : "Nuovo Lead"}
        pageDescription={isEdit
          ? "Modifica tutti i dati del lead in 4 step. Step 1: ragione sociale, logo aziendale, settore, fonte, P.IVA, C.F. e priorità. Step 2: email, telefono, sito web, indirizzo sede e 5 social media (LinkedIn, Instagram, Facebook, X, TikTok). Step 3: referente principale + contatti aziendali aggiuntivi con ruoli decisionali (Decisore, Influencer, Campione, Bloccante, Utente). Step 4: valore stimato, probabilità chiusura, data prossimo contatto, note, tag di segmentazione e riepilogo completo."
          : "Form guidato in 4 step per creare un lead completo. Step 1: identità aziendale con logo, settore, fonte, dati fiscali e priorità. Step 2: contatti aziendali e 5 profili social media. Step 3: referente principale + mappatura contatti decisionali (ruolo aziendale, ruolo decisionale, email, telefono, LinkedIn). Step 4: valutazione economica, pianificazione follow-up, tag per la segmentazione e riepilogo finale. Solo la ragione sociale è obbligatoria — il sistema rileva duplicati automaticamente."
        }
        pageIcon={FaPlus}
        docsSection="lead-create"
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleTourClose}
        onComplete={handleTourClose}
      />

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

export default LeadForm;
