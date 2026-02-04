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
  FaArrowLeft, FaArrowRight, FaCheck, FaPlus, FaTrash, FaTimes,
  FaCloudUploadAlt, FaStar, FaBoxOpen, FaEuroSign, FaImage, FaCog,
  FaEye, FaCube, FaGripVertical, FaSearch, FaLayerGroup, FaMinus,
  FaPercentage
} from 'react-icons/fa';
import {
  HiOutlineCube, HiOutlinePhoto, HiOutlineCurrencyEuro,
  HiOutlineCog6Tooth, HiOutlineChevronDown,
  HiOutlinePlus, HiOutlineSquares2X2
} from 'react-icons/hi2';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function PackageForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user, token } = getAuth();

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Assets and levels
  const [availableAssets, setAvailableAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [levelConfig, setLevelConfig] = useState({});

  // Level management
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [levelForm, setLevelForm] = useState({ label: '', color: '#3B82F6', description: '' });
  const [savingLevel, setSavingLevel] = useState(false);

  const availableColors = [
    '#FFD700', '#C0C0C0', '#CD7F32', '#3B82F6', '#10B981',
    '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#6366F1'
  ];

  const totalSteps = 3;
  const steps = [
    { number: 1, title: 'Informazioni', icon: HiOutlineCube },
    { number: 2, title: 'Asset', icon: HiOutlineSquares2X2 },
    { number: 3, title: 'Pricing', icon: HiOutlineCurrencyEuro }
  ];

  const [formData, setFormData] = useState({
    nome: '',
    codice: '',
    descrizione: '',
    descrizione_breve: '',
    livello: '',
    prezzo_listino: '',
    prezzo_scontato: '',
    sconto_percentuale: '',
    immagine: '',
    colore: '#85FF00',
    attivo: true,
    visibile_marketplace: true,
    in_evidenza: false,
    max_vendite: '',
    disponibile_da: '',
    disponibile_fino: ''
  });

  const [selectedAssets, setSelectedAssets] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Level dropdown
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const levelDropdownRef = useRef(null);

  // Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Tour steps - Guida interattiva completa per la creazione package
  const tourSteps = [
    {
      target: '[data-tour="wizard-steps"]',
      title: 'Wizard di Creazione',
      content: 'La creazione del package è guidata da un wizard in 3 step:\n\n• Step 1: Informazioni base (livello, nome, descrizione)\n• Step 2: Selezione degli asset da includere\n• Step 3: Configurazione del prezzo\n\nPuoi navigare tra gli step cliccando sui numeri o usando i pulsanti Avanti/Indietro.',
      placement: 'bottom',
      icon: <FaLayerGroup size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      wizardStep: 1,
      tip: 'Ogni step deve essere completato correttamente prima di passare al successivo.'
    },
    {
      target: '[data-tour="package-level"]',
      title: 'Scegli il Livello',
      content: 'Il livello definisce la categoria del package:\n\n• Main Sponsor: massima visibilità, prezzo premium\n• Official Partner: alta esposizione, sponsor di categoria\n• Premium: visibilità elevata su asset selezionati\n• Standard: pacchetto base per nuovi sponsor\n\nPuoi anche creare livelli personalizzati cliccando su "Crea nuovo livello".',
      placement: 'bottom',
      icon: <FaStar size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
      wizardStep: 1,
      tip: 'Il colore del livello verrà usato come colore identificativo del package nelle card.'
    },
    {
      target: '[data-tour="package-info"]',
      title: 'Informazioni Package',
      content: 'Inserisci le informazioni di base:\n\n• Nome Package: un nome descrittivo e accattivante (es. "Gold Package 2024/25")\n• Descrizione: spiega cosa include il package e perché è vantaggioso per lo sponsor',
      placement: 'bottom',
      icon: <FaCube size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
      wizardStep: 1
    },
    {
      target: '[data-tour="asset-selection"]',
      title: 'Seleziona gli Asset',
      content: 'Costruisci il tuo package selezionando gli asset:\n\n• Cerca asset per nome usando la barra di ricerca\n• Clicca su un asset per aggiungerlo al package\n• Usa + e - per modificare la quantità\n• Il valore totale viene calcolato automaticamente\n\nGli asset selezionati appaiono nella sezione "Asset nel Package".',
      placement: 'top',
      icon: <FaBoxOpen size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #34D399)',
      wizardStep: 2,
      tip: 'Combina asset di diverse categorie (LED, hospitality, digitale) per creare offerte complete.'
    },
    {
      target: '[data-tour="package-pricing"]',
      title: 'Configura il Prezzo',
      content: 'Imposta il prezzo del bundle:\n\n• Il riepilogo mostra: asset inclusi, valore totale e sconto\n• Inserisci il prezzo del package\n• Lo sconto viene calcolato automaticamente\n• Viene mostrato il risparmio per lo sponsor\n\nUn buon sconto bundle è tra il 10% e il 20%.',
      placement: 'top',
      icon: <FaEuroSign size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #EC4899, #F472B6)',
      wizardStep: 3,
      tip: 'Se il prezzo è superiore al valore degli asset, lo sconto sarà 0%.'
    },
    {
      target: '[data-tour="preview-column"]',
      title: 'Anteprima Live',
      content: 'Mentre compili il form, l\'anteprima sulla destra ti mostra come apparirà il package:\n\n• Badge del livello con colore\n• Nome e descrizione\n• Lista degli asset inclusi\n• Prezzo finale con eventuale sconto\n\nL\'anteprima si aggiorna in tempo reale.',
      placement: 'left',
      icon: <FaEye size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
      wizardStep: 1
    },
    {
      target: '[data-tour="form-actions"]',
      title: 'Salva il Package',
      content: 'Una volta completati tutti gli step:\n\n• Clicca "Crea Package" per salvare\n• Verrà mostrata una conferma con il riepilogo\n• Dopo il salvataggio, verrai reindirizzato alla lista package\n\nPuoi anche annullare in qualsiasi momento.',
      placement: 'top',
      icon: <FaCheck size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #059669, #34D399)',
      wizardStep: 3
    }
  ];

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(e.target)) {
        setLevelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [assetsRes, levelsRes] = await Promise.all([
          axios.get(`${API_URL}/club/inventory/assets`, { headers }).catch(() => ({ data: { assets: [] } })),
          axios.get(`${API_URL}/club/inventory/package-levels`, { headers }).catch(() => ({ data: { levels: [] } }))
        ]);

        setAvailableAssets(assetsRes.data.assets || []);

        // Build levelConfig from API response
        const lvlData = levelsRes.data.levels || [];
        let config = {};

        if (Array.isArray(lvlData) && lvlData.length > 0) {
          // Backend restituisce array di livelli
          lvlData.forEach(lv => {
            config[lv.codice] = {
              label: lv.nome,
              color: lv.colore,
              description: lv.descrizione
            };
          });
        }

        // Solo se non ci sono livelli creati dall'utente, usa i default
        if (Object.keys(config).length === 0) {
          config = {
            main: { label: 'Main Sponsor', color: '#FFD700', description: 'Partner principale' },
            official: { label: 'Official Partner', color: '#3B82F6', description: 'Partner ufficiale' },
            premium: { label: 'Premium', color: '#8B5CF6', description: 'Visibilità premium' },
            standard: { label: 'Standard', color: '#6B7280', description: 'Pacchetto base' }
          };
        }

        setLevelConfig(config);

        if (isEditing) {
          const pkgRes = await axios.get(`${API_URL}/club/inventory/packages/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const pkg = pkgRes.data.package || pkgRes.data;

          setFormData({
            nome: pkg.nome || '',
            codice: pkg.codice || '',
            descrizione: pkg.descrizione || '',
            descrizione_breve: pkg.descrizione_breve || '',
            livello: pkg.livello || '',
            prezzo_listino: pkg.prezzo_listino || '',
            prezzo_scontato: pkg.prezzo_scontato || '',
            sconto_percentuale: pkg.sconto_percentuale || '',
            immagine: pkg.immagine || '',
            colore: pkg.colore || '#85FF00',
            attivo: pkg.attivo !== false,
            visibile_marketplace: pkg.visibile_marketplace !== false,
            in_evidenza: pkg.in_evidenza || false,
            max_vendite: pkg.max_vendite || '',
            disponibile_da: pkg.disponibile_da || '',
            disponibile_fino: pkg.disponibile_fino || ''
          });

          if (pkg.items) {
            setSelectedAssets(pkg.items.map(item => ({
              asset_id: item.asset_id,
              asset: item.asset,
              quantita: item.quantita || 1,
              note: item.note || ''
            })));
          }
        }
      } catch (error) {
        console.error('Errore caricamento dati:', error);
        setToast({ message: 'Errore nel caricamento dei dati', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id, isEditing]);

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.nome.trim()) newErrors.nome = 'Inserisci il nome del package';
      if (!formData.livello) newErrors.livello = 'Seleziona un livello';
    }

    if (step === 2) {
      if (selectedAssets.length === 0) newErrors.assets = 'Aggiungi almeno un asset al package';
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

  // Asset selection handlers
  const addAsset = (asset) => {
    if (selectedAssets.find(a => a.asset_id === asset.id)) return;
    setSelectedAssets([...selectedAssets, {
      asset_id: asset.id,
      asset: asset,
      quantita: 1,
      note: ''
    }]);
  };

  const removeAsset = (assetId) => {
    setSelectedAssets(selectedAssets.filter(a => a.asset_id !== assetId));
  };

  const updateAssetQuantity = (assetId, quantity) => {
    setSelectedAssets(selectedAssets.map(a =>
      a.asset_id === assetId ? { ...a, quantita: Math.max(1, parseInt(quantity) || 1) } : a
    ));
  };

  // Calculate totals
  const calculateTotals = () => {
    const total = selectedAssets.reduce((sum, item) => {
      const price = item.asset?.prezzo_listino || 0;
      return sum + (price * item.quantita);
    }, 0);
    return total;
  };

  // Calculate discount
  const calculateDiscount = () => {
    const totalValue = calculateTotals();
    const packagePrice = parseFloat(formData.prezzo_listino) || 0;
    if (totalValue > 0 && packagePrice > 0 && packagePrice < totalValue) {
      return Math.round(((totalValue - packagePrice) / totalValue) * 100);
    }
    return 0;
  };

  // Format currency
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num);
  };

  // Level management
  const saveLevel = async () => {
    if (!levelForm.label.trim()) return;
    setSavingLevel(true);

    try {
      const codice = levelForm.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      // Invia nel formato che il backend si aspetta
      const response = await axios.post(`${API_URL}/club/inventory/package-levels`, {
        codice,
        nome: levelForm.label.trim(),
        descrizione: levelForm.description.trim(),
        colore: levelForm.color,
        ordine: Object.keys(levelConfig).length + 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Aggiorna il levelConfig locale
      const newLevel = response.data.level;
      setLevelConfig(prev => ({
        ...prev,
        [newLevel.codice]: {
          label: newLevel.nome,
          color: newLevel.colore,
          description: newLevel.descrizione
        }
      }));
      setFormData(prev => ({ ...prev, livello: newLevel.codice }));
      setLevelForm({ label: '', color: '#3B82F6', description: '' });
      setShowLevelModal(false);
      setToast({ message: 'Livello creato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore creazione livello:', error);
      const errMsg = error.response?.data?.error || 'Errore nella creazione del livello';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSavingLevel(false);
    }
  };

  // Submit
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
    setSaving(true);

    try {
      const payload = {
        ...formData,
        prezzo_listino: parseFloat(formData.prezzo_listino) || null,
        prezzo_scontato: parseFloat(formData.prezzo_scontato) || null,
        sconto_percentuale: calculateDiscount(),
        max_vendite: parseInt(formData.max_vendite) || null,
        items: selectedAssets.map(a => ({
          asset_id: a.asset_id,
          quantita: a.quantita,
          note: a.note
        }))
      };

      if (isEditing) {
        await axios.put(`${API_URL}/club/inventory/packages/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/club/inventory/packages`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setToast({ message: isEditing ? 'Package aggiornato!' : 'Package creato!', type: 'success' });
      setTimeout(() => navigate('/club/inventory/packages'), 1500);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      setToast({ message: 'Errore durante il salvataggio', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Filter assets
  const filteredAssets = availableAssets.filter(asset => {
    const matchesSearch = !assetSearch ||
      asset.nome?.toLowerCase().includes(assetSearch.toLowerCase()) ||
      asset.codice?.toLowerCase().includes(assetSearch.toLowerCase());
    const notSelected = !selectedAssets.find(a => a.asset_id === asset.id);
    return matchesSearch && notSelected && asset.disponibile !== false;
  });

  // Tour handlers
  const handleStartTour = () => setIsTourOpen(true);
  const handleTourClose = useCallback(() => setIsTourOpen(false), []);
  const handleTourStepChange = useCallback((stepIndex) => {
    const step = tourSteps[stepIndex];
    if (step?.wizardStep && step.wizardStep !== currentStep) {
      setCurrentStep(step.wizardStep);
    }
  }, [currentStep]);

  if (loading) {
    return (
      <div className="sponsor-form-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
          <div className="loading-spinner" style={{
            width: '48px', height: '48px', border: '4px solid #E5E7EB',
            borderTopColor: '#85FF00', borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
          <span style={{ color: '#6B7280', fontSize: '15px' }}>Caricamento...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="sponsor-form-page">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate('/club/inventory/packages')}>
            <FaArrowLeft />
          </button>
          <div>
            <h1>{isEditing ? 'Modifica Package' : 'Nuovo Package'}</h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0 0' }}>
              {isEditing ? `Modifica ${formData.nome || 'package'}` : 'Crea un nuovo package di sponsorizzazione'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="sf-two-column-layout">
        {/* Left Column - Form */}
        <div className="sf-form-column">
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

                  {/* Livello */}
                  <div className="form-group" data-tour="package-level">
                    <label>Livello Package <span className="required">*</span></label>
                    <div ref={levelDropdownRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setLevelDropdownOpen(!levelDropdownOpen)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: errors.livello ? '2px solid #EF4444' : '2px solid #E5E7EB',
                          borderRadius: '8px',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: formData.livello ? '#1A1A1A' : '#9CA3AF'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {formData.livello && levelConfig[formData.livello] ? (
                            <>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '6px',
                                background: levelConfig[formData.livello].color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <FaStar size={12} color="white" />
                              </div>
                              <span style={{ fontWeight: 500 }}>{levelConfig[formData.livello].label}</span>
                            </>
                          ) : (
                            <span>Seleziona un livello</span>
                          )}
                        </div>
                        <HiOutlineChevronDown
                          size={18}
                          style={{ transition: 'transform 0.2s', transform: levelDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                        />
                      </button>

                      {levelDropdownOpen && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                          background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden'
                        }}>
                          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                            {Object.entries(levelConfig).map(([key, val]) => (
                              <div
                                key={key}
                                onClick={() => { setFormData(prev => ({ ...prev, livello: key })); setLevelDropdownOpen(false); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                                  cursor: 'pointer', background: formData.livello === key ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                  borderLeft: formData.livello === key ? '3px solid #85FF00' : '3px solid transparent'
                                }}
                                onMouseEnter={(e) => { if (formData.livello !== key) e.currentTarget.style.background = '#F9FAFB'; }}
                                onMouseLeave={(e) => { if (formData.livello !== key) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '8px',
                                  background: val.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <FaStar size={14} color="white" />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{val.label}</div>
                                  {val.description && <div style={{ fontSize: '12px', color: '#6B7280' }}>{val.description}</div>}
                                </div>
                                {formData.livello === key && <FaCheck size={14} color="#85FF00" />}
                              </div>
                            ))}
                          </div>
                          <div style={{ borderTop: '1px solid #E5E7EB', padding: '8px' }}>
                            <button
                              type="button"
                              onClick={() => { setLevelDropdownOpen(false); setShowLevelModal(true); }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '12px 16px', border: '2px dashed #E5E7EB', borderRadius: '8px', background: 'transparent',
                                color: '#6B7280', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#85FF00'; e.currentTarget.style.color = '#1A1A1A'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
                            >
                              <HiOutlinePlus size={16} /> Crea nuovo livello
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.livello && <span className="error-message">{errors.livello}</span>}
                  </div>

                  {/* Nome e Descrizione */}
                  <div data-tour="package-info">
                    <div className="form-group">
                      <label>Nome Package <span className="required">*</span></label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="es. Gold Package"
                        className={errors.nome ? 'error' : ''}
                      />
                      {errors.nome && <span className="error-message">{errors.nome}</span>}
                    </div>

                    <div className="form-group">
                      <label>Descrizione</label>
                      <textarea
                        value={formData.descrizione}
                        onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                        placeholder="Descrivi cosa include questo package..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Asset Selection */}
              {currentStep === 2 && (
                <div className="sf-step-content" data-tour="asset-selection">
                  <h2 className="sf-section-title">Seleziona Asset</h2>
                  <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                    Aggiungi gli asset che compongono questo package
                  </p>

                  {errors.assets && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#991B1B', fontSize: '14px' }}>
                      {errors.assets}
                    </div>
                  )}

                  {/* Selected Assets */}
                  <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaLayerGroup /> Asset nel Package ({selectedAssets.length})
                    </h4>

                    {selectedAssets.length === 0 ? (
                      <div style={{
                        padding: '32px', textAlign: 'center', color: '#9CA3AF',
                        border: '2px dashed #E5E7EB', borderRadius: '8px', background: 'white'
                      }}>
                        <FaBoxOpen size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <div>Nessun asset selezionato</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>Seleziona gli asset dalla lista sottostante</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedAssets.map((item) => (
                          <div key={item.asset_id} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 16px', background: 'white', borderRadius: '10px',
                            border: '1px solid #E5E7EB'
                          }}>
                            <div style={{
                              width: '48px', height: '48px', borderRadius: '8px',
                              background: '#F3F4F6', overflow: 'hidden', flexShrink: 0
                            }}>
                              {item.asset?.immagine_principale ? (
                                <img src={getImageUrl(item.asset.immagine_principale)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <FaCube size={20} color="#9CA3AF" />
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#1A1A1A', fontSize: '14px' }}>{item.asset?.nome}</div>
                              <div style={{ fontSize: '13px', color: '#6B7280' }}>{formatCurrency(item.asset?.prezzo_listino)}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button type="button" onClick={() => updateAssetQuantity(item.asset_id, item.quantita - 1)}
                                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaMinus size={10} />
                              </button>
                              <span style={{ fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{item.quantita}</span>
                              <button type="button" onClick={() => updateAssetQuantity(item.asset_id, item.quantita + 1)}
                                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaPlus size={10} />
                              </button>
                            </div>
                            <button type="button" onClick={() => removeAsset(item.asset_id)}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#FEE2E2', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ))}

                        {/* Total Value */}
                        <div style={{ marginTop: '12px', padding: '12px 16px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#166534' }}>Valore totale asset:</span>
                            <span style={{ fontWeight: 700, fontSize: '18px', color: '#166534' }}>{formatCurrency(calculateTotals())}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ position: 'relative' }}>
                      <FaSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        type="text"
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        placeholder="Cerca asset..."
                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '2px solid #E5E7EB', fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  {/* Available Assets */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredAssets.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                        {assetSearch ? 'Nessun asset trovato' : 'Tutti gli asset sono stati aggiunti'}
                      </div>
                    ) : (
                      filteredAssets.map(asset => (
                        <div
                          key={asset.id}
                          onClick={() => addAsset(asset)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                            borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '48px', height: '48px', borderRadius: '8px', background: '#F3F4F6',
                            overflow: 'hidden', flexShrink: 0
                          }}>
                            {asset.immagine_principale ? (
                              <img src={getImageUrl(asset.immagine_principale)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaCube size={20} color="#9CA3AF" />
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>{asset.nome}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>{asset.category?.nome || 'Asset'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{formatCurrency(asset.prezzo_listino)}</div>
                          </div>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaPlus size={12} color="#10B981" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {currentStep === 3 && (
                <div className="sf-step-content" data-tour="package-pricing">
                  <h2 className="sf-section-title">Pricing Package</h2>

                  {/* Summary Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1F2937, #374151)',
                    borderRadius: '16px', padding: '24px', marginBottom: '24px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Asset Inclusi</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>{selectedAssets.length}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Valore Totale</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>{formatCurrency(calculateTotals())}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Sconto</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: calculateDiscount() > 0 ? '#10B981' : 'white' }}>
                          {calculateDiscount() > 0 ? `-${calculateDiscount()}%` : '0%'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Input */}
                  <div className="form-group">
                    <label>Prezzo Package <span className="required">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <FaEuroSign style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        type="number"
                        value={formData.prezzo_listino}
                        onChange={(e) => setFormData(prev => ({ ...prev, prezzo_listino: e.target.value }))}
                        placeholder="100000"
                        className={errors.prezzo_listino ? 'error' : ''}
                        style={{ paddingLeft: '40px' }}
                      />
                    </div>
                    {errors.prezzo_listino && <span className="error-message">{errors.prezzo_listino}</span>}
                  </div>

                  {/* Discount Display */}
                  {calculateDiscount() > 0 && (
                    <div style={{
                      background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '12px',
                      padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                      <FaPercentage size={20} color="#10B981" />
                      <div>
                        <div style={{ fontWeight: 700, color: '#166534' }}>
                          Risparmio: {formatCurrency(calculateTotals() - (parseFloat(formData.prezzo_listino) || 0))}
                        </div>
                        <div style={{ fontSize: '13px', color: '#15803D' }}>
                          -{calculateDiscount()}% rispetto al valore singolo degli asset
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
                  <button type="button" className="sf-btn sf-btn-outline" onClick={() => navigate('/club/inventory/packages')}>
                    Annulla
                  </button>

                  {currentStep === totalSteps ? (
                    <button type="submit" className="sf-btn sf-btn-primary" disabled={saving}>
                      {saving ? 'Salvataggio...' : (isEditing ? 'Salva Modifiche' : 'Crea Package')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sf-btn sf-btn-primary"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextStep(); }}
                    >
                      Avanti <FaArrowRight />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="sf-preview-column" data-tour="preview-column">
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
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anteprima Package</span>
              </div>

              {/* Level Badge */}
              {formData.livello && levelConfig[formData.livello] && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '20px',
                  background: levelConfig[formData.livello].color, marginBottom: '12px'
                }}>
                  <FaStar size={10} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{levelConfig[formData.livello].label}</span>
                </div>
              )}

              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>
                {formData.nome || 'Nome Package'}
              </h3>
              {formData.descrizione && (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
                  {formData.descrizione.substring(0, 100)}{formData.descrizione.length > 100 ? '...' : ''}
                </p>
              )}
            </div>

            {/* Preview Content */}
            <div style={{ padding: '20px' }}>
              {/* Assets */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                  Asset Inclusi ({selectedAssets.length})
                </div>
                {selectedAssets.length === 0 ? (
                  <div style={{ color: '#9CA3AF', fontSize: '13px', fontStyle: 'italic' }}>
                    Nessun asset selezionato
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedAssets.slice(0, 5).map(item => (
                      <span key={item.asset_id} style={{
                        padding: '4px 10px', background: '#F3F4F6', borderRadius: '6px',
                        fontSize: '12px', color: '#374151'
                      }}>
                        {item.asset?.nome} {item.quantita > 1 && `(x${item.quantita})`}
                      </span>
                    ))}
                    {selectedAssets.length > 5 && (
                      <span style={{ padding: '4px 10px', background: '#F3F4F6', borderRadius: '6px', fontSize: '12px', color: '#6B7280' }}>
                        +{selectedAssets.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>
                    {formatCurrency(formData.prezzo_listino || 0)}
                  </span>
                  {calculateDiscount() > 0 && (
                    <span style={{
                      padding: '4px 8px', background: '#DCFCE7', color: '#166534',
                      borderRadius: '6px', fontSize: '12px', fontWeight: 600
                    }}>
                      -{calculateDiscount()}%
                    </span>
                  )}
                </div>
                {calculateDiscount() > 0 && (
                  <div style={{ fontSize: '13px', color: '#9CA3AF', textDecoration: 'line-through', marginTop: '4px' }}>
                    {formatCurrency(calculateTotals())}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={isEditing ? 'Conferma Modifiche' : 'Conferma Creazione'}
        maxWidth="480px"
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: '#6B7280', marginBottom: '20px' }}>
            {isEditing
              ? `Sei sicuro di voler salvare le modifiche al package "${formData.nome}"?`
              : `Sei sicuro di voler creare il package "${formData.nome}" con ${selectedAssets.length} asset?`}
          </p>

          <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>{formData.nome}</div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {selectedAssets.length} asset • {formatCurrency(formData.prezzo_listino)}
              {calculateDiscount() > 0 && ` (sconto ${calculateDiscount()}%)`}
            </div>
          </div>

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

      {/* Level Modal */}
      <Modal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        title="Crea Nuovo Livello"
        maxWidth="480px"
      >
        <div style={{ padding: '8px 0' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nome Livello *</label>
            <input
              type="text"
              value={levelForm.label}
              onChange={(e) => setLevelForm(prev => ({ ...prev, label: e.target.value }))}
              placeholder="es. Main Sponsor"
              style={{ width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Descrizione</label>
            <input
              type="text"
              value={levelForm.description}
              onChange={(e) => setLevelForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="es. Partner principale con massima visibilità"
              style={{ width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Colore</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availableColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setLevelForm(prev => ({ ...prev, color }))}
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px', background: color,
                    border: levelForm.color === color ? '3px solid #1A1A1A' : '2px solid #E5E7EB',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {levelForm.color === color && <FaCheck size={14} color="white" />}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowLevelModal(false)} className="sf-btn sf-btn-outline">
              Annulla
            </button>
            <button
              onClick={saveLevel}
              disabled={!levelForm.label.trim() || savingLevel}
              className="sf-btn sf-btn-primary"
              style={{ opacity: levelForm.label.trim() ? 1 : 0.5 }}
            >
              {savingLevel ? 'Creazione...' : 'Crea Livello'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Support Widget */}
      <SupportWidget
        pageTitle={isEditing ? 'Modifica Package' : 'Nuovo Package'}
        pageDescription={isEditing
          ? "Modifica le informazioni, gli asset inclusi o il prezzo di questo package. Le modifiche non influenzano le assegnazioni già effettuate."
          : "Crea un nuovo package di sponsorizzazione in 3 semplici step: scegli il livello, seleziona gli asset da includere e configura il prezzo. L'anteprima live ti mostra come apparirà il package finale. Puoi creare livelli personalizzati e combinare asset di diverse categorie."}
        pageIcon={FaLayerGroup}
        docsSection="inventory-packages"
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleTourClose}
        onStepChange={handleTourStepChange}
      />
    </div>
  );
}

export default PackageForm;
