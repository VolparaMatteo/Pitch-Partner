import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import SupportWidget from '../components/SupportWidget';
import GuidedTour from '../components/GuidedTour';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaCube, FaPlus, FaTrash, FaTimes,
  FaCloudUploadAlt, FaGlobe, FaStar, FaLayerGroup, FaTshirt, FaBullhorn,
  FaUsers, FaVideo, FaTv, FaFootballBall, FaHandshake, FaGift, FaBoxOpen,
  FaTags, FaEuroSign, FaImage, FaCog, FaEye, FaMapMarkerAlt, FaGavel
} from 'react-icons/fa';
import {
  HiOutlineCube, HiOutlinePhoto, HiOutlineCurrencyEuro,
  HiOutlineCog6Tooth, HiOutlineShieldCheck, HiOutlineChevronDown,
  HiOutlinePlus
} from 'react-icons/hi2';
import '../styles/form.css';
import '../styles/sponsor-form.css';
import { SETTORI_MERCEOLOGICI } from '../constants/settori';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function InventoryAssetForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user, token } = getAuth();

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 5;
  const steps = [
    { number: 1, title: 'Informazioni', icon: HiOutlineCube },
    { number: 2, title: 'Dettagli', icon: HiOutlineCog6Tooth },
    { number: 3, title: 'Pricing', icon: HiOutlineCurrencyEuro },
    { number: 4, title: 'Media', icon: HiOutlinePhoto },
    { number: 5, title: 'Opzioni', icon: HiOutlineShieldCheck }
  ];

  const [formData, setFormData] = useState({
    category_id: '',
    nome: '',
    descrizione: '',
    descrizione_breve: '',
    tipo: 'fisico',
    posizione: '',
    specifiche_tecniche: {},
    immagine_principale: '',
    immagini_gallery: [],
    disponibile: true,
    quantita_totale: 1,
    prezzo_listino: '',
    prezzo_minimo: '',
    valuta: 'EUR',
    categorie_escluse: [],
    visibile_marketplace: true,
    in_evidenza: false,
    tags: '',
    note_interne: ''
  });

  const [pricingTiers, setPricingTiers] = useState([]);

  // Specs state
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Category dropdown state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryConfirmModal, setShowCategoryConfirmModal] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    nome: '',
    colore: '#6366F1',
    icona: 'cube'
  });
  const categoryDropdownRef = useRef(null);

  // Guided Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Tour steps - each step has a wizardStep property to auto-navigate
  const tourSteps = [
    {
      target: '[data-tour="wizard-steps"]',
      title: 'Navigazione Wizard',
      content: 'Il form è diviso in 5 step: Informazioni base, Dettagli tecnici, Pricing, Media e Opzioni. Puoi navigare tra gli step cliccando sui numeri o usando i pulsanti Avanti/Indietro.',
      placement: 'bottom',
      icon: <FaBoxOpen size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      tip: 'Puoi tornare indietro in qualsiasi momento per modificare i dati inseriti.',
      wizardStep: 1
    },
    {
      target: '[data-tour="category-select"]',
      title: 'Categoria Asset',
      content: 'Seleziona la categoria dell\'asset dal menu a tendina. Ogni categoria ha un\'icona e un colore distintivo. Se non trovi la categoria giusta, puoi crearne una nuova direttamente da qui.',
      placement: 'bottom',
      icon: <FaCube size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
      tip: 'Le categorie aiutano a organizzare e filtrare gli asset nel catalogo.',
      wizardStep: 1
    },
    {
      target: '[data-tour="asset-name"]',
      title: 'Nome Asset',
      content: 'Inserisci un nome descrittivo per l\'asset. Usa nomi chiari come "LED Board Tribuna Centrale" o "Maglia Gara - Fronte".',
      placement: 'bottom',
      icon: <FaTags size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #34D399)',
      wizardStep: 1
    },
    {
      target: '[data-tour="asset-type"]',
      title: 'Tipo di Asset',
      content: 'Scegli tra 4 tipologie: Fisico (LED, Banner), Digitale (Web, Social), Esperienza (Hospitality, VIP) o Misto (combinazione). Il tipo determina le specifiche tecniche suggerite nello step successivo.',
      placement: 'bottom',
      icon: <FaLayerGroup size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
      tip: 'Selezionando il tipo corretto, riceverai suggerimenti per le specifiche tecniche più rilevanti.',
      wizardStep: 1
    },
    {
      target: '[data-tour="step-2-specs"]',
      title: 'Specifiche Tecniche',
      content: 'In questo step puoi aggiungere le specifiche tecniche dell\'asset. Usa i suggerimenti rapidi per aggiungere le specifiche più comuni per il tipo selezionato, oppure crea specifiche personalizzate.',
      placement: 'bottom',
      icon: <FaCog size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
      tip: 'Specifiche dettagliate aiutano gli sponsor a capire esattamente cosa stanno acquistando.',
      wizardStep: 2
    },
    {
      target: '[data-tour="step-3-pricing"]',
      title: 'Pricing e Listino',
      content: 'In questo step imposti il prezzo di listino e opzionalmente un prezzo minimo (floor) per le trattative. Puoi anche creare tier di pricing dinamico per eventi speciali come derby o partite europee.',
      placement: 'bottom',
      icon: <FaEuroSign size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #34D399)',
      tip: 'Il pricing dinamico ti permette di massimizzare il valore degli asset in occasioni speciali.',
      wizardStep: 3
    },
    {
      target: '[data-tour="step-4-media"]',
      title: 'Immagini e Media',
      content: 'In questo step carichi l\'immagine principale e la galleria dell\'asset. Puoi trascinare i file direttamente nell\'area di upload o inserire un URL. Le immagini di qualità aumentano l\'interesse degli sponsor.',
      placement: 'bottom',
      icon: <FaImage size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #EC4899, #F472B6)',
      tip: 'Usa foto ad alta risoluzione che mostrino chiaramente l\'asset nel contesto dello stadio.',
      wizardStep: 4
    },
    {
      target: '[data-tour="step-5-options"]',
      title: 'Opzioni e Restrizioni',
      content: 'Nell\'ultimo step configuri la disponibilità, le categorie merceologiche escluse (per esclusività) e le note interne. Rivedi il riepilogo prima di confermare la creazione.',
      placement: 'bottom',
      icon: <HiOutlineShieldCheck size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #EF4444, #F87171)',
      tip: 'Le esclusività sono fondamentali per gestire contratti con sponsor concorrenti.',
      wizardStep: 5
    },
    {
      target: '[data-tour="form-actions"]',
      title: 'Salvataggio',
      content: 'Usa i pulsanti di navigazione per spostarti tra gli step. Quando sei all\'ultimo step e tutti i campi obbligatori sono compilati, clicca "Crea Asset" per salvare.',
      placement: 'top',
      icon: <FaCheck size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #85FF00, #65A30D)',
      tip: 'Riceverai una conferma prima del salvataggio definitivo.',
      wizardStep: 5
    }
  ];

  const handleStartTour = () => {
    // Start tour from step 1 of the wizard
    setCurrentStep(1);
    setIsTourOpen(true);
  };

  // Handle tour step change - auto-navigate wizard to the correct step
  const handleTourStepChange = useCallback((stepIndex, step) => {
    if (step?.wizardStep) {
      setCurrentStep(step.wizardStep);
      // Scroll to top when changing wizard step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Available colors for category
  const categoryColors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#10B981', '#14B8A6', '#3B82F6', '#6B7280', '#1A1A1A'
  ];

  // Available icons for category
  const categoryIcons = [
    { value: 'cube', label: 'LED/Display', icon: FaCube },
    { value: 'tv', label: 'TV/Broadcast', icon: FaTv },
    { value: 'shirt', label: 'Jersey', icon: FaTshirt },
    { value: 'megaphone', label: 'Pubblicità', icon: FaBullhorn },
    { value: 'star', label: 'Premium', icon: FaStar },
    { value: 'users', label: 'Hospitality', icon: FaUsers },
    { value: 'globe', label: 'Digital', icon: FaGlobe },
    { value: 'video', label: 'Video', icon: FaVideo },
    { value: 'football', label: 'Sport', icon: FaFootballBall },
    { value: 'handshake', label: 'Partnership', icon: FaHandshake },
    { value: 'gift', label: 'Merchandising', icon: FaGift }
  ];

  // Asset types
  const assetTypes = [
    { value: 'fisico', label: 'Fisico', icon: FaCube, desc: 'LED, Banner, Cartelloni' },
    { value: 'digitale', label: 'Digitale', icon: FaGlobe, desc: 'Banner web, Social, App' },
    { value: 'esperienza', label: 'Esperienza', icon: FaStar, desc: 'Hospitality, VIP, Eventi' },
    { value: 'diritto', label: 'Diritto', icon: FaGavel, desc: 'Naming, Licenze, Esclusività' },
    { value: 'misto', label: 'Misto', icon: FaLayerGroup, desc: 'Combinazione di elementi' }
  ];

  // Suggested specs based on type
  const suggestedSpecs = {
    fisico: ['Dimensioni', 'Larghezza', 'Altezza', 'Materiale', 'Peso', 'Illuminazione'],
    digitale: ['Dimensioni', 'Risoluzione', 'Formato', 'Durata Spot', 'Impression/mese', 'Pixel Pitch'],
    esperienza: ['Capacità', 'Durata', 'Servizi Inclusi', 'Catering', 'Posti'],
    diritto: ['Durata Licenza', 'Ambito Territoriale', 'Esclusività', 'Utilizzi Consentiti', 'Limitazioni'],
    misto: ['Dimensioni', 'Componente Digitale', 'Durata', 'Formato']
  };

  // Categorie merceologiche per esclusività (stesse usate per Lead e Sponsor)
  const categorieExclusivity = SETTORI_MERCEOLOGICI.map(settore => ({
    value: settore,
    label: settore
  }));

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchCategories();
    if (isEditing) {
      fetchAsset();
    }
  }, [id]);

  // Click outside handler for category dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category selection handler
  const selectCategory = (categoryId) => {
    setFormData(prev => ({ ...prev, category_id: categoryId }));
    setCategoryDropdownOpen(false);
    if (errors.category_id) {
      setErrors(prev => ({ ...prev, category_id: '' }));
    }
  };

  // Open category creation modal
  const openCategoryModal = () => {
    setCategoryDropdownOpen(false);
    setNewCategoryForm({ nome: '', colore: '#6366F1', icona: 'cube' });
    setShowCategoryModal(true);
  };

  // Handle new category form change
  const handleNewCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategoryForm(prev => ({ ...prev, [name]: value }));
  };

  // Show category confirmation modal
  const handleSaveCategory = () => {
    if (!newCategoryForm.nome.trim()) {
      setToast({ message: 'Inserisci il nome della categoria', type: 'error' });
      return;
    }
    setShowCategoryConfirmModal(true);
  };

  // Confirm and save new category
  const handleConfirmedCategorySave = async () => {
    setShowCategoryConfirmModal(false);
    setSavingCategory(true);
    try {
      const res = await axios.post(`${API_URL}/club/inventory/categories`, newCategoryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newCategory = res.data?.category || res.data;

      // Add to categories list
      setCategories(prev => [...prev, newCategory]);

      // Select the new category
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));

      setShowCategoryModal(false);
      setToast({ message: 'Categoria creata con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore creazione categoria:', error);
      const errorMessage = error.response?.data?.error || 'Errore durante la creazione della categoria';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setSavingCategory(false);
    }
  };

  // Get selected category object
  const getSelectedCategory = () => {
    return categories.find(c => c.id == formData.category_id);
  };

  // Get icon component from icon value
  const getCategoryIcon = (iconValue) => {
    const iconItem = categoryIcons.find(i => i.value === iconValue);
    return iconItem?.icon || FaCube;
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/club/inventory/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data?.categories || res.data || []);
    } catch (error) {
      console.error('Errore caricamento categorie:', error);
      setCategories([
        { id: 1, nome: 'LED Boards', codice: 'led' },
        { id: 2, nome: 'Jersey & Kit', codice: 'jersey' },
        { id: 3, nome: 'Digital', codice: 'digital' },
        { id: 4, nome: 'Hospitality', codice: 'hospitality' },
        { id: 5, nome: 'Broadcast', codice: 'broadcast' }
      ]);
    }
  };

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/club/inventory/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const asset = res.data?.asset || res.data;
      setFormData({
        ...formData,
        ...asset,
        categorie_escluse: asset.categorie_escluse ? JSON.parse(asset.categorie_escluse) : [],
        immagini_gallery: asset.immagini_gallery ? JSON.parse(asset.immagini_gallery) : []
      });
      if (asset.pricing_tiers?.length > 0) {
        setPricingTiers(asset.pricing_tiers);
      }
      if (asset.specifiche_tecniche && Object.keys(asset.specifiche_tecniche).length > 0) {
        const specsArray = Object.entries(asset.specifiche_tecniche).map(([key, value]) => ({
          key, value: String(value)
        }));
        setSpecs(specsArray);
      }
    } catch (error) {
      console.error('Errore caricamento asset:', error);
      setToast({ message: 'Errore nel caricamento dell\'asset', type: 'error' });
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

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.category_id) newErrors.category_id = 'Seleziona una categoria';
      if (!formData.nome.trim()) newErrors.nome = 'Inserisci il nome dell\'asset';
    }

    if (step === 3) {
      if (!formData.prezzo_listino || parseFloat(formData.prezzo_listino) <= 0) {
        newErrors.prezzo_listino = 'Inserisci un prezzo di listino valido';
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      scrollToTop();
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    scrollToTop();
  };

  const goToStep = (step) => {
    if (step <= currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
      scrollToTop();
    }
  };

  // Pricing handlers
  const handlePricingChange = (index, field, value) => {
    const updated = [...pricingTiers];
    updated[index][field] = value;
    setPricingTiers(updated);
  };

  const addPricingTier = () => {
    setPricingTiers([...pricingTiers, { nome: '', prezzo: '', durata_tipo: 'partita' }]);
  };

  const removePricingTier = (index) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  // Specs handlers
  const handleSpecChange = (index, field, value) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
    updateSpecsInFormData(updated);
  };

  const addSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const removeSpec = (index) => {
    const updated = specs.filter((_, i) => i !== index);
    setSpecs(updated.length > 0 ? updated : [{ key: '', value: '' }]);
    updateSpecsInFormData(updated);
  };

  const updateSpecsInFormData = (specsArray) => {
    const specsObj = {};
    specsArray.forEach(spec => {
      if (spec.key && spec.value) specsObj[spec.key] = spec.value;
    });
    setFormData(prev => ({ ...prev, specifiche_tecniche: specsObj }));
  };

  const addSuggestedSpec = (suggestion) => {
    if (specs.some(s => s.key === suggestion)) return;
    const emptyIndex = specs.findIndex(s => !s.key);
    if (emptyIndex >= 0) {
      handleSpecChange(emptyIndex, 'key', suggestion);
    } else {
      setSpecs([...specs, { key: suggestion, value: '' }]);
    }
  };

  // Exclusivity toggle
  const toggleCategoriaEsclusa = (cat) => {
    const current = formData.categorie_escluse || [];
    setFormData(prev => ({
      ...prev,
      categorie_escluse: current.includes(cat)
        ? current.filter(c => c !== cat)
        : [...current, cat]
    }));
  };

  // File upload handlers
  const handleFileUpload = async (files, isGallery = false) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls = [];
      const fileArray = Array.from(files);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const res = await axios.post(`${API_URL}/upload/media`, formDataUpload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setUploadProgress(Math.round(((i + e.loaded / e.total) * 100) / fileArray.length))
        });

        uploadedUrls.push(res.data.file_url);
      }

      if (isGallery) {
        setFormData(prev => ({
          ...prev,
          immagini_gallery: [...(prev.immagini_gallery || []), ...uploadedUrls]
        }));
      } else {
        setFormData(prev => ({ ...prev, immagine_principale: uploadedUrls[0] }));
      }
      setToast({ message: 'Immagine caricata con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore upload:', error);
      setToast({ message: 'Errore nel caricamento dell\'immagine', type: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e, isGallery = false) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files, isGallery);
  }, [token]);

  const removeMainImage = () => setFormData(prev => ({ ...prev, immagine_principale: '' }));
  const removeGalleryImage = (index) => setFormData(prev => ({
    ...prev,
    immagini_gallery: prev.immagini_gallery.filter((_, i) => i !== index)
  }));

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only allow submission on step 5
    if (currentStep !== 5) {
      return; // Do nothing if not on last step
    }
    if (!validate()) {
      setToast({ message: 'Completa tutti i campi obbligatori', type: 'error' });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    setSaving(true);

    try {
      const payload = {
        ...formData,
        prezzo_listino: parseFloat(formData.prezzo_listino) || null,
        prezzo_minimo: parseFloat(formData.prezzo_minimo) || null,
        quantita_totale: parseInt(formData.quantita_totale) || 1,
        pricing_tiers: pricingTiers.filter(t => t.nome && t.prezzo).map(t => ({
          ...t, prezzo: parseFloat(t.prezzo)
        }))
      };

      if (isEditing) {
        await axios.put(`${API_URL}/club/inventory/assets/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Asset aggiornato con successo!', type: 'success' });
      } else {
        await axios.post(`${API_URL}/club/inventory/assets`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Asset creato con successo!', type: 'success' });
      }

      setTimeout(() => navigate('/club/inventory'), 1500);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      setToast({ message: error.response?.data?.error || 'Errore nel salvataggio', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0
  }).format(value || 0);

  if (loading) {
    return (
      <div className="sponsor-form-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner" style={{
            width: '48px', height: '48px', border: '4px solid #E5E7EB',
            borderTopColor: '#85FF00', borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
          <span style={{ color: '#6B7280', fontSize: '15px' }}>Caricamento asset...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate('/club/inventory')}>
            <FaArrowLeft />
          </button>
          <div>
            <h1>{isEditing ? 'Modifica Asset' : 'Nuovo Asset Inventario'}</h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0 0' }}>
              {isEditing ? `Modifica ${formData.nome || 'asset'}` : 'Aggiungi un nuovo asset al tuo catalogo'}
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
        <div className="sf-wizard-steps" data-tour="wizard-steps">
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
          {/* Step 1: Informazioni Base */}
          {currentStep === 1 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Informazioni Base</h2>

              <div className="form-group" data-tour="category-select">
                <label>Categoria Asset <span className="required">*</span></label>

                {/* Custom Category Dropdown */}
                <div ref={categoryDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: errors.category_id ? '2px solid #EF4444' : '2px solid #E5E7EB',
                      borderRadius: '8px',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '14px',
                      color: formData.category_id ? '#1A1A1A' : '#9CA3AF'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {getSelectedCategory() ? (() => {
                        const SelectedCatIcon = getCategoryIcon(getSelectedCategory().icona);
                        return (
                          <>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: getSelectedCategory().colore || '#6366F1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <SelectedCatIcon size={14} color="white" />
                            </div>
                            <span style={{ fontWeight: 500, color: '#1A1A1A' }}>
                              {getSelectedCategory().nome}
                            </span>
                          </>
                        );
                      })() : (
                        <span>Seleziona una categoria</span>
                      )}
                    </div>
                    <HiOutlineChevronDown
                      size={18}
                      style={{
                        transition: 'transform 0.2s',
                        transform: categoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                      }}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {categoryDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      maxHeight: '320px',
                      overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease'
                    }}>
                      {/* Categories List */}
                      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                        {categories.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>
                            Nessuna categoria disponibile
                          </div>
                        ) : (
                          categories.map(cat => {
                            const CatIcon = getCategoryIcon(cat.icona);
                            return (
                              <div
                                key={cat.id}
                                onClick={() => selectCategory(cat.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s',
                                  background: formData.category_id == cat.id ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                  borderLeft: formData.category_id == cat.id ? '3px solid #85FF00' : '3px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                  if (formData.category_id != cat.id) e.currentTarget.style.background = '#F9FAFB';
                                }}
                                onMouseLeave={(e) => {
                                  if (formData.category_id != cat.id) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: cat.colore || '#6366F1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <CatIcon size={16} color="white" />
                                </div>
                                <div style={{ flex: 1, fontWeight: 500, fontSize: '14px', color: '#1A1A1A' }}>
                                  {cat.nome}
                                </div>
                                {formData.category_id == cat.id && (
                                  <FaCheck size={14} color="#85FF00" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Create New Category Button */}
                      <div style={{
                        borderTop: '1px solid #E5E7EB',
                        padding: '8px'
                      }}>
                        <button
                          type="button"
                          onClick={openCategoryModal}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            background: '#1A1A1A',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#000000';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#1A1A1A';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <HiOutlinePlus size={18} />
                          Crea nuova categoria
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.category_id && <span className="error-message">{errors.category_id}</span>}
              </div>

              <div className="form-group">
                <label>Quantità Totale</label>
                <input
                  type="number"
                  name="quantita_totale"
                  value={formData.quantita_totale}
                  onChange={handleChange}
                  min="1"
                  placeholder="1"
                />
                <span className="form-hint">1 per asset unici, più per asset multipli</span>
              </div>

              <div className="form-group">
                <label>Nome Asset <span className="required">*</span></label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Es: LED Board Tribuna Centrale"
                  className={errors.nome ? 'error' : ''}
                />
                {errors.nome && <span className="error-message">{errors.nome}</span>}
              </div>

              <div className="form-group" data-tour="asset-type">
                <label>Tipo di Asset</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '8px' }}>
                  {assetTypes.map(type => {
                    const TypeIcon = type.icon;
                    const isSelected = formData.tipo === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tipo: type.value }))}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                          padding: '16px 12px', borderRadius: '12px', cursor: 'pointer',
                          border: isSelected ? '2px solid #85FF00' : '2px solid #E5E7EB',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        <TypeIcon size={24} color={isSelected ? '#1A1A1A' : '#9CA3AF'} />
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>{type.label}</span>
                        <span style={{ fontSize: '11px', color: '#6B7280', textAlign: 'center' }}>{type.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Descrizione Breve</label>
                <input
                  type="text"
                  name="descrizione_breve"
                  value={formData.descrizione_breve}
                  onChange={handleChange}
                  placeholder="Una breve descrizione per il catalogo (max 150 caratteri)"
                  maxLength={150}
                />
              </div>

              <div className="form-group">
                <label>Descrizione Completa</label>
                <textarea
                  name="descrizione"
                  value={formData.descrizione}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Descrizione dettagliata dell'asset, caratteristiche, benefici per lo sponsor..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Dettagli e Specifiche */}
          {currentStep === 2 && (
            <div className="sf-step-content" data-tour="step-2-specs">
              <h2 className="sf-section-title">Dettagli e Specifiche Tecniche</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Posizione</label>
                  <input
                    type="text"
                    name="posizione"
                    value={formData.posizione}
                    onChange={handleChange}
                    placeholder="Es: Tribuna Centrale, Lato Campo Ovest"
                  />
                </div>
              </div>

              {/* Specifiche Tecniche */}
              <div className="form-group" style={{ marginTop: '24px' }}>
                <label>Specifiche Tecniche</label>

                {/* Quick suggestions */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', display: 'block' }}>
                    Suggerimenti per {formData.tipo}:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(suggestedSpecs[formData.tipo] || suggestedSpecs.fisico).map((suggestion, idx) => {
                      const isAdded = specs.some(s => s.key === suggestion);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => addSuggestedSpec(suggestion)}
                          disabled={isAdded}
                          style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '13px',
                            border: 'none', cursor: isAdded ? 'default' : 'pointer',
                            background: isAdded ? '#85FF00' : '#F3F4F6',
                            color: isAdded ? '#1A1A1A' : '#4B5563',
                            fontWeight: isAdded ? 600 : 400,
                            opacity: isAdded ? 1 : 0.9,
                            transition: 'all 0.2s'
                          }}
                        >
                          {isAdded && <FaCheck size={10} style={{ marginRight: '4px' }} />}
                          {suggestion}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specs list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {specs.map((spec, index) => (
                    <div key={index} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px',
                      alignItems: 'center', padding: '12px 16px',
                      background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB'
                    }}>
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                        placeholder="Nome specifica"
                        style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                        placeholder="Valore"
                        style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeSpec(index)}
                        style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          border: 'none', background: '#FEE2E2', color: '#DC2626',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addSpec}
                  style={{
                    marginTop: '12px', padding: '10px 20px', borderRadius: '8px',
                    border: '2px dashed #D1D5DB', background: 'white', color: '#6B7280',
                    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <FaPlus /> Aggiungi Specifica
                </button>
              </div>

              <div className="form-group" style={{ marginTop: '24px' }}>
                <label>Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Separa i tag con virgole (es: premium, tribuna, alta visibilità)"
                />
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <div className="sf-step-content" data-tour="step-3-pricing">
              <h2 className="sf-section-title">Pricing e Listino</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Prezzo di Listino <span className="required">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: '#6B7280', fontWeight: 600
                    }}>€</span>
                    <input
                      type="number"
                      name="prezzo_listino"
                      value={formData.prezzo_listino}
                      onChange={handleChange}
                      placeholder="50000"
                      min="0"
                      className={errors.prezzo_listino ? 'error' : ''}
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                  {errors.prezzo_listino && <span className="error-message">{errors.prezzo_listino}</span>}
                </div>
                <div className="form-group">
                  <label>Prezzo Minimo (Floor)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: '#6B7280', fontWeight: 600
                    }}>€</span>
                    <input
                      type="number"
                      name="prezzo_minimo"
                      value={formData.prezzo_minimo}
                      onChange={handleChange}
                      placeholder="40000"
                      min="0"
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                  <span className="form-hint">Prezzo minimo accettabile per trattative</span>
                </div>
              </div>

              {/* Pricing preview */}
              {formData.prezzo_listino && (
                <div style={{
                  marginBottom: '32px', padding: '20px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1F2937, #374151)', color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                        Prezzo di Listino
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#85FF00' }}>
                        {formatCurrency(formData.prezzo_listino)}
                      </div>
                    </div>
                    {formData.prezzo_minimo && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                          Floor
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                          {formatCurrency(formData.prezzo_minimo)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Pricing Tiers */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Pricing Dinamico per Evento</h4>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>Prezzi differenziati per tipo di partita o periodo</span>
                  </div>
                  <span style={{ padding: '4px 12px', background: '#F3F4F6', borderRadius: '20px', fontSize: '12px', color: '#6B7280' }}>
                    Opzionale
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pricingTiers.map((tier, index) => (
                    <div key={index} style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px',
                      alignItems: 'center', padding: '16px', background: '#F9FAFB',
                      borderRadius: '12px', border: '1px solid #E5E7EB'
                    }}>
                      <input
                        type="text"
                        value={tier.nome}
                        onChange={(e) => handlePricingChange(index, 'nome', e.target.value)}
                        placeholder="Nome tier (es: Derby)"
                        style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
                      />
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                          color: '#6B7280', fontSize: '13px'
                        }}>€</span>
                        <input
                          type="number"
                          value={tier.prezzo}
                          onChange={(e) => handlePricingChange(index, 'prezzo', e.target.value)}
                          placeholder="Prezzo"
                          style={{ padding: '10px 10px 10px 28px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', width: '100%' }}
                        />
                      </div>
                      <select
                        value={tier.durata_tipo}
                        onChange={(e) => handlePricingChange(index, 'durata_tipo', e.target.value)}
                        style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
                      >
                        <option value="partita">/ Partita</option>
                        <option value="evento">/ Evento</option>
                        <option value="mese">/ Mese</option>
                        <option value="stagione">/ Stagione</option>
                        <option value="anno">/ Anno</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removePricingTier(index)}
                        style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          border: 'none', background: '#FEE2E2', color: '#DC2626',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addPricingTier}
                  style={{
                    marginTop: '12px', padding: '10px 20px', borderRadius: '8px',
                    border: '2px dashed #D1D5DB', background: 'white', color: '#6B7280',
                    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <FaPlus /> Aggiungi Tier
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Media */}
          {currentStep === 4 && (
            <div className="sf-step-content" data-tour="step-4-media">
              <h2 className="sf-section-title">Immagini e Media</h2>

              {/* Main Image */}
              <div className="form-group">
                <label>Immagine Principale</label>

                {formData.immagine_principale ? (
                  <div style={{ position: 'relative', display: 'inline-block', marginTop: '8px' }}>
                    <img
                      src={getImageUrl(formData.immagine_principale)}
                      alt="Preview"
                      style={{
                        maxWidth: '100%', maxHeight: '300px', borderRadius: '16px',
                        objectFit: 'cover', border: '2px solid #E5E7EB'
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeMainImage}
                      style={{
                        position: 'absolute', top: '-10px', right: '-10px',
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: '#EF4444', color: 'white', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`sf-logo-upload ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, false)}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      height: '200px',
                      background: isDragging ? 'rgba(133, 255, 0, 0.1)' : '#FAFAFA',
                      borderColor: isDragging ? '#85FF00' : '#D0D0D0'
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files, false)}
                      style={{ display: 'none' }}
                    />
                    {uploading ? (
                      <>
                        <div style={{
                          width: '60%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${uploadProgress}%`, height: '100%', background: '#85FF00', transition: 'width 0.3s'
                          }} />
                        </div>
                        <span style={{ marginTop: '12px', color: '#6B7280' }}>Caricamento... {uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <FaCloudUploadAlt size={40} color={isDragging ? '#85FF00' : '#9CA3AF'} />
                        <span style={{ fontWeight: 600, color: '#1A1A1A' }}>Trascina qui o clicca per caricare</span>
                        <small style={{ color: '#9CA3AF' }}>PNG, JPG, WebP fino a 5MB</small>
                      </>
                    )}
                  </div>
                )}

              </div>

              {/* Gallery */}
              <div className="form-group" style={{ marginTop: '32px' }}>
                <label>Galleria Immagini</label>

                {formData.immagini_gallery?.length > 0 && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px', marginTop: '12px', marginBottom: '16px'
                  }}>
                    {formData.immagini_gallery.map((img, index) => (
                      <div key={index} style={{
                        position: 'relative', paddingTop: '100%', borderRadius: '12px',
                        overflow: 'hidden', background: '#F3F4F6'
                      }}>
                        <img
                          src={getImageUrl(img)}
                          alt={`Gallery ${index + 1}`}
                          style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          style={{
                            position: 'absolute', top: '8px', right: '8px',
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => galleryInputRef.current?.click()}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '32px', border: '2px dashed #D0D0D0', borderRadius: '12px',
                    background: '#FAFAFA', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, true)}
                    style={{ display: 'none' }}
                  />
                  <FaPlus size={24} color="#9CA3AF" />
                  <span style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
                    Aggiungi immagini alla galleria
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Opzioni */}
          {currentStep === 5 && (
            <div className="sf-step-content" data-tour="step-5-options">
              <h2 className="sf-section-title">Opzioni e Restrizioni</h2>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {[
                  { name: 'disponibile', label: 'Disponibile', desc: 'L\'asset è disponibile per la vendita', icon: FaCheck }
                ].map(toggle => {
                  const ToggleIcon = toggle.icon;
                  return (
                    <label
                      key={toggle.name}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', background: formData[toggle.name] ? 'rgba(133, 255, 0, 0.1)' : '#F9FAFB',
                        border: formData[toggle.name] ? '2px solid #85FF00' : '2px solid #E5E7EB',
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: formData[toggle.name] ? '#85FF00' : '#E5E7EB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <ToggleIcon color={formData[toggle.name] ? '#1A1A1A' : '#9CA3AF'} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: '#1A1A1A' }}>{toggle.label}</div>
                          <div style={{ fontSize: '13px', color: '#6B7280' }}>{toggle.desc}</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        name={toggle.name}
                        checked={formData[toggle.name]}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '52px', height: '28px', borderRadius: '14px',
                        background: formData[toggle.name] ? '#85FF00' : '#D1D5DB',
                        position: 'relative', transition: 'all 0.2s'
                      }}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                          position: 'absolute', top: '3px',
                          left: formData[toggle.name] ? '27px' : '3px',
                          transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }} />
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Esclusività */}
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  Categorie Merceologiche Escluse
                </h4>
                <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
                  Seleziona le categorie che NON possono acquistare questo asset (es: se hai un'esclusiva con Coca-Cola, escludi "Bevande")
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                  {categorieExclusivity.map(cat => {
                    const isExcluded = formData.categorie_escluse?.includes(cat.value);
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => toggleCategoriaEsclusa(cat.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                          border: isExcluded ? '2px solid #EF4444' : '2px solid #E5E7EB',
                          background: isExcluded ? '#FEF2F2' : 'white',
                          color: isExcluded ? '#DC2626' : '#4B5563',
                          fontSize: '14px', fontWeight: isExcluded ? 600 : 400,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '4px',
                          border: isExcluded ? 'none' : '2px solid #D1D5DB',
                          background: isExcluded ? '#EF4444' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isExcluded && <FaTimes color="white" size={10} />}
                        </div>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note interne */}
              <div className="form-group" style={{ marginTop: '32px' }}>
                <label>Note Interne</label>
                <textarea
                  name="note_interne"
                  value={formData.note_interne}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Note visibili solo al tuo team (condizioni speciali, contatti, etc.)"
                />
              </div>

              {/* Summary */}
              {formData.nome && (
                <div style={{
                  marginTop: '32px', padding: '24px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #1F2937, #374151)', color: 'white'
                }}>
                  <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600 }}>
                    Riepilogo Asset
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Asset</div>
                      <div style={{ fontWeight: 600 }}>{formData.nome}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Prezzo Listino</div>
                      <div style={{ fontWeight: 700, fontSize: '20px', color: '#85FF00' }}>
                        {formatCurrency(formData.prezzo_listino)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Status</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        {formData.disponibile && (
                          <span style={{ padding: '4px 10px', background: 'rgba(133, 255, 0, 0.2)', borderRadius: '20px', fontSize: '12px', color: '#85FF00' }}>
                            Disponibile
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="sf-form-actions" data-tour="form-actions">
            <div className="sf-actions-left">
              {currentStep > 1 && (
                <button type="button" className="sf-btn sf-btn-outline" onClick={prevStep}>
                  <FaArrowLeft /> Indietro
                </button>
              )}
            </div>

            <div className="sf-actions-right">
              <button type="button" className="sf-btn sf-btn-outline" onClick={() => navigate('/club/inventory')}>
                Annulla
              </button>

              {currentStep === 5 ? (
                <button type="submit" className="sf-btn sf-btn-primary" disabled={saving}>
                  {saving ? 'Salvataggio...' : (isEditing ? 'Salva Modifiche' : 'Crea Asset')}
                </button>
              ) : (
                <button
                  type="button"
                  className="sf-btn sf-btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                >
                  Avanti <FaArrowRight />
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
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anteprima Asset</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {formData.immagine_principale ? (
                  <img
                    src={getImageUrl(formData.immagine_principale)}
                    alt=""
                    style={{
                      width: '64px', height: '64px', borderRadius: '12px',
                      objectFit: 'cover', background: 'white', border: '2px solid rgba(255,255,255,0.2)'
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '12px',
                    background: getSelectedCategory()?.colore || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {(() => {
                      const cat = getSelectedCategory();
                      if (cat) {
                        const CatIcon = getCategoryIcon(cat.icona);
                        return <CatIcon size={24} color="white" />;
                      }
                      return <FaCube size={24} color="white" />;
                    })()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    {formData.nome || 'Nome Asset'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{ padding: '20px' }}>
              {/* Category & Type */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {getSelectedCategory() && (
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: `${getSelectedCategory().colore}15`,
                    color: getSelectedCategory().colore
                  }}>
                    {getSelectedCategory().nome}
                  </span>
                )}
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: formData.tipo === 'fisico' ? '#DBEAFE' :
                             formData.tipo === 'digitale' ? '#F3E8FF' :
                             formData.tipo === 'esperienza' ? '#FEF3C7' :
                             formData.tipo === 'diritto' ? '#FCE7F3' : '#ECFDF5',
                  color: formData.tipo === 'fisico' ? '#1D4ED8' :
                         formData.tipo === 'digitale' ? '#7C3AED' :
                         formData.tipo === 'esperienza' ? '#D97706' :
                         formData.tipo === 'diritto' ? '#DB2777' : '#059669'
                }}>
                  {formData.tipo === 'fisico' ? 'Fisico' :
                   formData.tipo === 'digitale' ? 'Digitale' :
                   formData.tipo === 'esperienza' ? 'Esperienza' :
                   formData.tipo === 'diritto' ? 'Diritto' : 'Misto'}
                </span>
                {formData.in_evidenza && (
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: '#FEF3C7', color: '#D97706'
                  }}>
                    <FaStar style={{ marginRight: '4px', fontSize: '10px' }} /> In Evidenza
                  </span>
                )}
              </div>

              {/* Description */}
              {formData.descrizione_breve && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Descrizione
                  </div>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, margin: 0 }}>
                    {formData.descrizione_breve.length > 100
                      ? formData.descrizione_breve.substring(0, 100) + '...'
                      : formData.descrizione_breve}
                  </p>
                </div>
              )}

              {/* Position */}
              {formData.posizione && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Posizione
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                    <FaMapMarkerAlt style={{ color: '#9CA3AF', fontSize: '12px' }} /> {formData.posizione}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Prezzo Listino</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
                    €{(parseFloat(formData.prezzo_listino) || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Quantità</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#3B82F6' }}>
                    {formData.quantita_totale || 1}
                  </div>
                </div>
              </div>

              {/* Specs Preview */}
              {specs.filter(s => s.key && s.value).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Specifiche ({specs.filter(s => s.key && s.value).length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {specs.filter(s => s.key && s.value).slice(0, 4).map((spec, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                          background: '#F3F4F6', color: '#374151'
                        }}
                      >
                        {spec.key}: {spec.value}
                      </span>
                    ))}
                    {specs.filter(s => s.key && s.value).length > 4 && (
                      <span style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                        background: '#F3F4F6', color: '#6B7280'
                      }}>
                        +{specs.filter(s => s.key && s.value).length - 4} altre
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Gallery Preview */}
              {formData.immagini_gallery && formData.immagini_gallery.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Galleria ({formData.immagini_gallery.length} immagini)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {formData.immagini_gallery.slice(0, 4).map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '48px', height: '48px', borderRadius: '8px',
                          background: '#F3F4F6', overflow: 'hidden'
                        }}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ))}
                    {formData.immagini_gallery.length > 4 && (
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '8px',
                        background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 600, color: '#6B7280'
                      }}>
                        +{formData.immagini_gallery.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div style={{
                display: 'flex', alignItems: 'center',
                padding: '12px', background: formData.disponibile ? '#ECFDF5' : '#FEF2F2', borderRadius: '10px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: formData.disponibile ? '#059669' : '#DC2626' }}>
                  {formData.disponibile ? 'Disponibile' : 'Non Disponibile'}
                </span>
              </div>

              {/* Tags */}
              {formData.tags && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Tags
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {formData.tags.split(',').map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                          background: '#EEF2FF', color: '#6366F1'
                        }}
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Creation Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Crea Nuova Categoria"
      >
        <div style={{ padding: '8px 0' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
              Nome Categoria <span className="required">*</span>
            </label>
            <input
              type="text"
              name="nome"
              value={newCategoryForm.nome}
              onChange={handleNewCategoryChange}
              placeholder="Es: LED Boards, Jersey, Hospitality"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>
              Colore
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categoryColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategoryForm(prev => ({ ...prev, colore: color }))}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: newCategoryForm.colore === color ? '3px solid #1A1A1A' : '2px solid #E5E7EB',
                    background: color,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {newCategoryForm.colore === color && (
                    <FaCheck size={14} color="white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>
              Icona
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categoryIcons.map(iconItem => {
                const IconComponent = iconItem.icon;
                const isSelected = newCategoryForm.icona === iconItem.value;
                return (
                  <button
                    key={iconItem.value}
                    type="button"
                    onClick={() => setNewCategoryForm(prev => ({ ...prev, icona: iconItem.value }))}
                    title={iconItem.label}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #85FF00' : '2px solid #E5E7EB',
                      background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#1A1A1A' : '#6B7280'
                    }}
                  >
                    <IconComponent size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {newCategoryForm.nome && (() => {
            const selectedIcon = categoryIcons.find(i => i.value === newCategoryForm.icona);
            const PreviewIcon = selectedIcon?.icon || FaCube;
            return (
              <div style={{
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: newCategoryForm.colore,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PreviewIcon size={22} color="white" />
                </div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: '#1A1A1A' }}>
                  {newCategoryForm.nome}
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="sf-btn sf-btn-outline"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSaveCategory}
              className="sf-btn sf-btn-primary"
              disabled={savingCategory || !newCategoryForm.nome.trim()}
            >
              {savingCategory ? 'Creazione...' : 'Crea Categoria'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Confirmation Modal */}
      <Modal
        isOpen={showCategoryConfirmModal}
        onClose={() => setShowCategoryConfirmModal(false)}
        title="Conferma Creazione Categoria"
      >
        <div style={{ padding: '20px 0' }}>
          {/* Category Preview */}
          {(() => {
            const selectedIcon = categoryIcons.find(i => i.value === newCategoryForm.icona);
            const PreviewIcon = selectedIcon?.icon || FaCube;
            return (
              <div style={{
                padding: '20px',
                background: '#F9FAFB',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: newCategoryForm.colore,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PreviewIcon size={28} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#1A1A1A' }}>
                    {newCategoryForm.nome}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                    Nuova categoria asset
                  </div>
                </div>
              </div>
            );
          })()}

          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
            Sei sicuro di voler creare la categoria "<strong>{newCategoryForm.nome}</strong>"?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCategoryConfirmModal(false)}
              className="sf-btn sf-btn-outline"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmedCategorySave}
              className="sf-btn sf-btn-primary"
              disabled={savingCategory}
            >
              {savingCategory ? 'Creazione...' : 'Conferma'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={isEditing ? 'Conferma Modifiche' : 'Conferma Creazione Asset'}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Asset Preview */}
          {(() => {
            const selectedCategory = getSelectedCategory();
            const CategoryIcon = selectedCategory ? getCategoryIcon(selectedCategory.icona) : FaCube;
            return (
              <div style={{
                padding: '20px',
                background: '#F9FAFB',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: selectedCategory?.colore || '#6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CategoryIcon size={28} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#1A1A1A' }}>
                    {formData.nome || 'Nuovo Asset'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                    {selectedCategory?.nome || 'Categoria'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#1A1A1A' }}>
                    {formatCurrency(formData.prezzo_listino)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    Prezzo listino
                  </div>
                </div>
              </div>
            );
          })()}

          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
            {isEditing
              ? `Sei sicuro di voler salvare le modifiche all'asset "${formData.nome}"?`
              : `Sei sicuro di voler creare questo asset?`
            }
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowConfirmModal(false)} className="sf-btn sf-btn-outline">
              Annulla
            </button>
            <button onClick={handleConfirmedSubmit} className="sf-btn sf-btn-primary" disabled={saving}>
              {saving ? 'Salvataggio...' : 'Conferma'}
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

      {/* Support Widget */}
      <SupportWidget
        pageTitle={isEditing ? 'Modifica Asset Inventario' : 'Nuovo Asset Inventario'}
        pageDescription={isEditing
          ? 'In questa pagina puoi modificare un asset esistente nel tuo inventario. Segui i 5 step del wizard per aggiornare informazioni, specifiche tecniche, pricing, media e opzioni.'
          : 'In questa pagina puoi creare un nuovo asset per il tuo inventario. Il form è diviso in 5 step: informazioni base, dettagli tecnici, pricing, media e opzioni. Compila tutti i campi obbligatori per completare la creazione.'
        }
        pageIcon={FaBoxOpen}
        docsSection="inventory-asset-form"
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          setCurrentStep(1); // Return to step 1 when tour is closed
        }}
        onComplete={() => {
          setIsTourOpen(false);
          setCurrentStep(1); // Return to step 1 when tour is completed
        }}
        onStepChange={handleTourStepChange}
      />
    </div>
  );
}

export default InventoryAssetForm;
