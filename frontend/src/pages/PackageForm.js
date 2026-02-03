import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaPlus, FaTrash, FaTimes,
  FaCloudUploadAlt, FaStar, FaBoxOpen, FaEuroSign, FaImage, FaCog,
  FaEye, FaCube, FaGripVertical, FaSearch
} from 'react-icons/fa';
import {
  HiOutlineCube, HiOutlinePhoto, HiOutlineCurrencyEuro,
  HiOutlineCog6Tooth, HiOutlineShieldCheck, HiOutlineChevronDown,
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

  const totalSteps = 4;
  const steps = [
    { number: 1, title: 'Informazioni', icon: HiOutlineCube },
    { number: 2, title: 'Asset', icon: HiOutlineSquares2X2 },
    { number: 3, title: 'Pricing', icon: HiOutlineCurrencyEuro },
    { number: 4, title: 'Opzioni', icon: HiOutlineCog6Tooth }
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
      if (!user?.club_id) return;
      setLoading(true);

      try {
        const [assetsRes, categoriesRes, levelsRes] = await Promise.all([
          axios.get(`${API_URL}/inventory/assets`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/inventory/categories`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/inventory/package-levels`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setAvailableAssets(assetsRes.data.assets || []);
        setCategories(categoriesRes.data.categories || []);

        // Build levelConfig from API levels
        const lvls = levelsRes.data.levels || [];
        setLevels(lvls);
        const config = {};
        lvls.forEach(lv => {
          config[lv.codice] = {
            label: lv.nome,
            color: lv.colore,
            description: lv.descrizione
          };
        });
        setLevelConfig(config);

        if (isEditing) {
          const pkgRes = await axios.get(`${API_URL}/inventory/packages/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const pkg = pkgRes.data.package;

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
  }, [user, token, id, isEditing]);

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.nome.trim()) newErrors.nome = 'Inserisci il nome del package';
      if (!formData.codice.trim()) newErrors.codice = 'Inserisci un codice';
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
      a.asset_id === assetId ? { ...a, quantita: parseInt(quantity) || 1 } : a
    ));
  };

  const updateAssetNote = (assetId, note) => {
    setSelectedAssets(selectedAssets.map(a =>
      a.asset_id === assetId ? { ...a, note } : a
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

  // Auto-calculate discount percentage
  useEffect(() => {
    if (formData.prezzo_listino && formData.prezzo_scontato) {
      const listino = parseFloat(formData.prezzo_listino);
      const scontato = parseFloat(formData.prezzo_scontato);
      if (listino > 0 && scontato > 0 && scontato < listino) {
        const sconto = Math.round(((listino - scontato) / listino) * 100);
        setFormData(prev => ({ ...prev, sconto_percentuale: sconto }));
      }
    }
  }, [formData.prezzo_listino, formData.prezzo_scontato]);

  // File upload handlers
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const file = files[0];
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await axios.post(`${API_URL}/upload/media`, formDataUpload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
      });

      setFormData(prev => ({ ...prev, immagine: res.data.file_url }));
      setToast({ message: 'Immagine caricata con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore upload:', error);
      setToast({ message: "Errore nel caricamento dell'immagine", type: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files);
  }, [token]);

  // Level management
  const saveLevel = async () => {
    if (!levelForm.label.trim()) return;
    setSavingLevel(true);

    try {
      const codice = levelForm.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      const response = await axios.post(`${API_URL}/inventory/package-levels`, {
        codice,
        nome: levelForm.label.trim(),
        descrizione: levelForm.description.trim(),
        colore: levelForm.color,
        ordine: levels.length + 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newLevel = response.data.level;
      setLevels([...levels, newLevel]);
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
      setToast({ message: error.response?.data?.error || 'Errore nella creazione del livello', type: 'error' });
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
        sconto_percentuale: parseFloat(formData.sconto_percentuale) || null,
        max_vendite: parseInt(formData.max_vendite) || null,
        items: selectedAssets.map(a => ({
          asset_id: a.asset_id,
          quantita: a.quantita,
          note: a.note
        }))
      };

      let response;
      if (isEditing) {
        response = await axios.put(`${API_URL}/inventory/packages/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Update items - first remove all, then add new ones
        const currentItems = selectedAssets;
        for (const item of currentItems) {
          await axios.post(`${API_URL}/inventory/packages/${id}/items`, {
            asset_id: item.asset_id,
            quantita: item.quantita,
            note: item.note
          }, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {}); // Ignore if already exists
        }
      } else {
        response = await axios.post(`${API_URL}/inventory/packages`, payload, {
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
    const matchesCategory = !categoryFilter || asset.category_id === parseInt(categoryFilter);
    const notSelected = !selectedAssets.find(a => a.asset_id === asset.id);
    return matchesSearch && matchesCategory && notSelected;
  });

  if (loading) {
    return (
      <div className="sf-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="sf-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="sf-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="sf-header">
        <button onClick={() => navigate('/club/inventory/packages')} className="sf-back-btn">
          <FaArrowLeft /> Packages
        </button>
        <div className="sf-header-content">
          <div className="sf-header-icon" style={{ background: 'linear-gradient(135deg, #85FF00, #66CC00)' }}>
            <FaBoxOpen size={24} color="#1A1A1A" />
          </div>
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
              {/* Step 1: Informazioni Base */}
              {currentStep === 1 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Informazioni Base</h2>

                  {/* Livello */}
                  <div className="form-group">
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
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: levelConfig[formData.livello].color
                              }} />
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
                            {Object.keys(levelConfig).length === 0 ? (
                              <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>
                                Nessun livello disponibile
                              </div>
                            ) : (
                              Object.entries(levelConfig).map(([key, val]) => (
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
                                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: val.color }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{val.label}</div>
                                    {val.description && <div style={{ fontSize: '12px', color: '#6B7280' }}>{val.description}</div>}
                                  </div>
                                  {formData.livello === key && <FaCheck size={14} color="#85FF00" />}
                                </div>
                              ))
                            )}
                          </div>
                          <div style={{ borderTop: '1px solid #E5E7EB', padding: '8px' }}>
                            <button
                              type="button"
                              onClick={() => { setLevelDropdownOpen(false); setShowLevelModal(true); }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '12px 16px', border: 'none', borderRadius: '8px', background: '#1A1A1A',
                                color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              <HiOutlinePlus size={16} /> Crea nuovo livello
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.livello && <span className="error-text">{errors.livello}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nome Package <span className="required">*</span></label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="es. Main Sponsor Package"
                        className={errors.nome ? 'error' : ''}
                      />
                      {errors.nome && <span className="error-text">{errors.nome}</span>}
                    </div>
                    <div className="form-group">
                      <label>Codice <span className="required">*</span></label>
                      <input
                        type="text"
                        value={formData.codice}
                        onChange={(e) => setFormData(prev => ({ ...prev, codice: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                        placeholder="es. main-sponsor"
                        className={errors.codice ? 'error' : ''}
                      />
                      {errors.codice && <span className="error-text">{errors.codice}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Descrizione Breve</label>
                    <input
                      type="text"
                      value={formData.descrizione_breve}
                      onChange={(e) => setFormData(prev => ({ ...prev, descrizione_breve: e.target.value }))}
                      placeholder="Breve descrizione del package"
                      maxLength={300}
                    />
                  </div>

                  <div className="form-group">
                    <label>Descrizione Completa</label>
                    <textarea
                      value={formData.descrizione}
                      onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                      placeholder="Descrizione dettagliata del package, benefici inclusi, target..."
                      rows={6}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Asset Selection */}
              {currentStep === 2 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Seleziona Asset</h2>
                  <p style={{ color: '#6B7280', marginBottom: '20px' }}>
                    Aggiungi gli asset che compongono questo package. Puoi specificare la quantita per ogni asset.
                  </p>

                  {errors.assets && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#991B1B', fontSize: '14px' }}>
                      {errors.assets}
                    </div>
                  )}

                  {/* Selected Assets */}
                  {selectedAssets.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>
                        Asset Selezionati ({selectedAssets.length})
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedAssets.map((item, index) => (
                          <div
                            key={item.asset_id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                              background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB'
                            }}
                          >
                            <FaGripVertical size={14} color="#9CA3AF" />
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '8px', background: '#E5E7EB',
                              backgroundImage: item.asset?.immagine_principale ? `url(${getImageUrl(item.asset.immagine_principale)})` : 'none',
                              backgroundSize: 'cover', backgroundPosition: 'center'
                            }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.asset?.nome}</div>
                              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                {item.asset?.codice} - €{(item.asset?.prezzo_listino || 0).toLocaleString()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <label style={{ fontSize: '12px', color: '#6B7280' }}>Qty:</label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantita}
                                onChange={(e) => updateAssetQuantity(item.asset_id, e.target.value)}
                                style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px', textAlign: 'center' }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAsset(item.asset_id)}
                              style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '12px', padding: '12px 16px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#166534' }}>Valore totale asset:</span>
                          <span style={{ fontWeight: 700, fontSize: '18px', color: '#166534' }}>€{calculateTotals().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search and Filter */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <FaSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        type="text"
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        placeholder="Cerca asset..."
                        style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                      />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', minWidth: '160px' }}
                    >
                      <option value="">Tutte le categorie</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Available Assets */}
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>
                    Asset Disponibili ({filteredAssets.length})
                  </label>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    {filteredAssets.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                        {assetSearch || categoryFilter ? 'Nessun asset trovato con questi filtri' : 'Tutti gli asset sono stati aggiunti'}
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
                            width: '48px', height: '48px', borderRadius: '8px', background: '#E5E7EB',
                            backgroundImage: asset.immagine_principale ? `url(${getImageUrl(asset.immagine_principale)})` : 'none',
                            backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{asset.nome}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>{asset.codice}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>€{(asset.prezzo_listino || 0).toLocaleString()}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>Qty: {asset.quantita_disponibile || 0}</div>
                          </div>
                          <FaPlus size={16} color="#85FF00" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {currentStep === 3 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Pricing Package</h2>

                  <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#166534', fontWeight: 500 }}>Valore singoli asset:</span>
                      <span style={{ color: '#166534', fontWeight: 700, fontSize: '18px' }}>€{calculateTotals().toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>
                      Questo e il valore totale se gli asset fossero venduti singolarmente
                    </p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Prezzo di Listino <span className="required">*</span></label>
                      <div className="input-with-icon">
                        <FaEuroSign className="input-icon" />
                        <input
                          type="number"
                          value={formData.prezzo_listino}
                          onChange={(e) => setFormData(prev => ({ ...prev, prezzo_listino: e.target.value }))}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className={errors.prezzo_listino ? 'error' : ''}
                        />
                      </div>
                      {errors.prezzo_listino && <span className="error-text">{errors.prezzo_listino}</span>}
                    </div>
                    <div className="form-group">
                      <label>Prezzo Scontato</label>
                      <div className="input-with-icon">
                        <FaEuroSign className="input-icon" />
                        <input
                          type="number"
                          value={formData.prezzo_scontato}
                          onChange={(e) => setFormData(prev => ({ ...prev, prezzo_scontato: e.target.value }))}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {formData.sconto_percentuale > 0 && (
                    <div style={{ background: '#FEF3C7', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid #FDE68A' }}>
                      <span style={{ color: '#92400E', fontWeight: 600 }}>
                        Sconto: {formData.sconto_percentuale}% rispetto al prezzo di listino
                      </span>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Limite Vendite</label>
                      <input
                        type="number"
                        value={formData.max_vendite}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_vendite: e.target.value }))}
                        placeholder="Illimitato"
                        min="1"
                      />
                      <span className="field-hint">Lascia vuoto per vendite illimitate</span>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Disponibile Da</label>
                      <input
                        type="date"
                        value={formData.disponibile_da}
                        onChange={(e) => setFormData(prev => ({ ...prev, disponibile_da: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Disponibile Fino</label>
                      <input
                        type="date"
                        value={formData.disponibile_fino}
                        onChange={(e) => setFormData(prev => ({ ...prev, disponibile_fino: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Opzioni */}
              {currentStep === 4 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Immagine e Opzioni</h2>

                  {/* Image Upload */}
                  <div className="form-group">
                    <label>Immagine Package</label>
                    {formData.immagine ? (
                      <div style={{ position: 'relative', width: '100%', paddingTop: '50%', borderRadius: '12px', overflow: 'hidden', background: '#F3F4F6' }}>
                        <img
                          src={getImageUrl(formData.immagine)}
                          alt="Package"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, immagine: '' }))}
                          style={{
                            position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px',
                            borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                          }}
                        >
                          <FaTimes color="white" size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                          border: `2px dashed ${isDragging ? '#85FF00' : '#E5E7EB'}`,
                          borderRadius: '12px', padding: '40px', textAlign: 'center',
                          cursor: 'pointer', background: isDragging ? 'rgba(133, 255, 0, 0.05)' : '#FAFAFA',
                          transition: 'all 0.2s'
                        }}
                      >
                        {uploading ? (
                          <div>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#85FF00', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                            <p style={{ color: '#6B7280', margin: 0 }}>Caricamento... {uploadProgress}%</p>
                          </div>
                        ) : (
                          <>
                            <FaCloudUploadAlt size={40} color="#9CA3AF" style={{ marginBottom: '12px' }} />
                            <p style={{ color: '#6B7280', margin: 0 }}>
                              <span style={{ color: '#85FF00', fontWeight: 600 }}>Clicca per caricare</span> o trascina qui
                            </p>
                            <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '8px 0 0' }}>PNG, JPG fino a 5MB</p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Options */}
                  <div style={{ marginTop: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '16px', fontWeight: 600 }}>Visibilita</label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#F9FAFB', borderRadius: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.attivo}
                          onChange={(e) => setFormData(prev => ({ ...prev, attivo: e.target.checked }))}
                          style={{ width: '20px', height: '20px', accentColor: '#85FF00' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>Package Attivo</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Il package e disponibile per la vendita</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#F9FAFB', borderRadius: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.visibile_marketplace}
                          onChange={(e) => setFormData(prev => ({ ...prev, visibile_marketplace: e.target.checked }))}
                          style={{ width: '20px', height: '20px', accentColor: '#85FF00' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>Visibile nel Marketplace</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Il package appare nel catalogo pubblico</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: formData.in_evidenza ? 'rgba(133, 255, 0, 0.1)' : '#F9FAFB', borderRadius: '8px', cursor: 'pointer', border: formData.in_evidenza ? '2px solid #85FF00' : '2px solid transparent' }}>
                        <input
                          type="checkbox"
                          checked={formData.in_evidenza}
                          onChange={(e) => setFormData(prev => ({ ...prev, in_evidenza: e.target.checked }))}
                          style={{ width: '20px', height: '20px', accentColor: '#85FF00' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaStar color="#F59E0B" /> In Evidenza
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Mostra il package in primo piano</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="sf-form-actions">
                {currentStep > 1 && (
                  <button type="button" onClick={prevStep} className="sf-btn-secondary">
                    <FaArrowLeft /> Indietro
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {currentStep < totalSteps ? (
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextStep(); }} className="sf-btn-primary">
                    Avanti <FaArrowRight />
                  </button>
                ) : (
                  <button type="submit" className="sf-btn-primary" disabled={saving}>
                    {saving ? 'Salvataggio...' : (isEditing ? 'Aggiorna Package' : 'Crea Package')} <FaCheck />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="sf-preview-column">
          <div className="sf-preview-card" style={{ position: 'sticky', top: '100px' }}>
            <div className="sf-preview-header">
              <FaEye /> Anteprima Package
            </div>
            <div className="sf-preview-content">
              {/* Package Preview Card */}
              <div style={{
                background: '#1A1A1A', borderRadius: '16px', overflow: 'hidden',
                border: `2px solid ${levelConfig[formData.livello]?.color || '#333'}`
              }}>
                {/* Image */}
                <div style={{
                  height: '140px', background: formData.immagine ? `url(${getImageUrl(formData.immagine)})` : 'linear-gradient(135deg, #2A2A2A, #1A1A1A)',
                  backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'
                }}>
                  {formData.livello && levelConfig[formData.livello] && (
                    <div style={{
                      position: 'absolute', top: '12px', left: '12px', padding: '6px 12px',
                      background: levelConfig[formData.livello].color, borderRadius: '20px',
                      fontSize: '12px', fontWeight: 600, color: 'white'
                    }}>
                      {levelConfig[formData.livello].label}
                    </div>
                  )}
                  {formData.in_evidenza && (
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px', padding: '6px 10px',
                      background: 'rgba(245, 158, 11, 0.9)', borderRadius: '20px',
                      fontSize: '12px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <FaStar size={10} /> Featured
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>
                    {formData.nome || 'Nome Package'}
                  </h3>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
                    {formData.descrizione_breve || 'Descrizione breve del package...'}
                  </p>

                  {/* Assets count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <FaCube size={14} color="#85FF00" />
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>
                      {selectedAssets.length} asset inclusi
                    </span>
                  </div>

                  {/* Pricing */}
                  <div style={{ borderTop: '1px solid #333', paddingTop: '16px' }}>
                    {formData.prezzo_scontato && parseFloat(formData.prezzo_scontato) < parseFloat(formData.prezzo_listino) ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#6B7280', textDecoration: 'line-through', fontSize: '14px' }}>
                            €{parseFloat(formData.prezzo_listino || 0).toLocaleString()}
                          </span>
                          {formData.sconto_percentuale > 0 && (
                            <span style={{ background: '#85FF00', color: '#1A1A1A', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                              -{formData.sconto_percentuale}%
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'white', fontSize: '24px', fontWeight: 700 }}>
                          €{parseFloat(formData.prezzo_scontato).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'white', fontSize: '24px', fontWeight: 700 }}>
                        €{parseFloat(formData.prezzo_listino || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Asset List Preview */}
              {selectedAssets.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', marginBottom: '12px' }}>
                    ASSET INCLUSI
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedAssets.slice(0, 5).map(item => (
                      <div key={item.asset_id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
                        background: '#F9FAFB', borderRadius: '8px', fontSize: '13px'
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '6px', background: '#E5E7EB',
                          backgroundImage: item.asset?.immagine_principale ? `url(${getImageUrl(item.asset.immagine_principale)})` : 'none',
                          backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0
                        }} />
                        <span style={{ flex: 1, fontWeight: 500 }}>{item.asset?.nome}</span>
                        <span style={{ color: '#6B7280' }}>x{item.quantita}</span>
                      </div>
                    ))}
                    {selectedAssets.length > 5 && (
                      <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '12px', padding: '8px' }}>
                        +{selectedAssets.length - 5} altri asset
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={isEditing ? 'Conferma Modifiche' : 'Conferma Creazione'}
      >
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '20px', color: '#4B5563' }}>
            {isEditing
              ? `Sei sicuro di voler salvare le modifiche al package "${formData.nome}"?`
              : `Sei sicuro di voler creare il package "${formData.nome}" con ${selectedAssets.length} asset?`}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowConfirmModal(false)}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB',
                background: 'white', cursor: 'pointer', fontWeight: 500
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmedSubmit}
              disabled={saving}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                background: '#85FF00', color: '#1A1A1A', cursor: 'pointer', fontWeight: 600
              }}
            >
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
      >
        <div style={{ padding: '20px' }}>
          <div className="form-group">
            <label>Nome Livello <span className="required">*</span></label>
            <input
              type="text"
              value={levelForm.label}
              onChange={(e) => setLevelForm(prev => ({ ...prev, label: e.target.value }))}
              placeholder="es. Main Sponsor"
            />
          </div>

          <div className="form-group">
            <label>Descrizione</label>
            <input
              type="text"
              value={levelForm.description}
              onChange={(e) => setLevelForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="es. Partner principale con massima visibilita"
            />
          </div>

          <div className="form-group">
            <label>Colore</label>
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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={() => setShowLevelModal(false)}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB',
                background: 'white', cursor: 'pointer', fontWeight: 500
              }}
            >
              Annulla
            </button>
            <button
              onClick={saveLevel}
              disabled={!levelForm.label.trim() || savingLevel}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                background: levelForm.label.trim() ? '#1A1A1A' : '#E5E7EB',
                color: levelForm.label.trim() ? 'white' : '#9CA3AF',
                cursor: levelForm.label.trim() ? 'pointer' : 'not-allowed', fontWeight: 600
              }}
            >
              {savingLevel ? 'Creazione...' : 'Crea Livello'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PackageForm;
