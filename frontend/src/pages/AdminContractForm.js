import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaChevronDown,
  FaFileContract, FaCalendarAlt, FaCreditCard, FaBuilding,
  FaPen, FaPlus, FaTimes, FaFilePdf, FaUpload, FaTrash, FaExternalLinkAlt
} from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const PLAN_CONFIG = {
  Basic: { name: 'Basic', color: '#6B7280', bg: '#F3F4F6' },
  Premium: { name: 'Premium', color: '#3B82F6', bg: '#EFF6FF' },
  Elite: { name: 'Elite', color: '#F59E0B', bg: '#FFFBEB' }
};

const ADDON_OPTIONS = [
  { id: 'setup', name: 'Setup & Onboarding' },
  { id: 'training', name: 'Training Avanzato' },
  { id: 'custom', name: 'Sviluppo Custom' },
  { id: 'support_premium', name: 'Supporto Premium' },
  { id: 'integration', name: 'Integrazioni API' }
];

const PAYMENT_TERMS = [
  { value: 'annual', label: 'Annuale' },
  { value: 'semi_annual', label: 'Semestrale' },
  { value: 'quarterly', label: 'Trimestrale' },
  { value: 'monthly', label: 'Mensile' }
];


function AdminContractForm() {
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const isEdit = !!contractId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Custom Dropdowns
  const [clubOpen, setClubOpen] = useState(false);
  const [paymentTermsOpen, setPaymentTermsOpen] = useState(false);
  const clubRef = useRef(null);
  const paymentTermsRef = useRef(null);
  const fileInputRef = useRef(null);

  const totalSteps = 3;
  const steps = [
    { number: 1, title: 'Club & Piano' },
    { number: 2, title: 'Date & Pagamento' },
    { number: 3, title: 'Firma & Note' }
  ];

  const [formData, setFormData] = useState({
    club_id: searchParams.get('club_id') || '',
    plan_type: 'Premium',
    plan_price: 0,
    addons: [],
    vat_rate: 22,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    payment_terms: 'annual',
    payment_method: 'bank_transfer',
    notes: '',
    signed_by: '',
    signed_date: '',
    contract_document_url: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchClubs();
    if (isEdit) {
      fetchContract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  // Click-outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clubRef.current && !clubRef.current.contains(e.target)) setClubOpen(false);
      if (paymentTermsRef.current && !paymentTermsRef.current.contains(e.target)) setPaymentTermsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/contracts/clubs-without-contract`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClubs(res.data.clubs || []);
    } catch (error) {
      console.error('Errore caricamento clubs:', error);
    }
  };

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contract = res.data.contract || res.data;
      setFormData({
        club_id: contract.club_id || '',
        plan_type: contract.plan_type || 'Premium',
        plan_price: contract.plan_price || 0,
        addons: contract.addons || [],
        vat_rate: contract.vat_rate ?? 22,
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        payment_terms: contract.payment_terms || 'annual',
        payment_method: contract.payment_method || 'bank_transfer',
        notes: contract.notes || '',
        signed_by: contract.signed_by || '',
        signed_date: contract.signed_date || '',
        status: contract.status || 'draft',
        contract_document_url: contract.contract_document_url || ''
      });
    } catch (error) {
      console.error('Errore caricamento contratto:', error);
      setToast({ message: 'Errore nel caricamento del contratto', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (planType) => {
    setFormData({
      ...formData,
      plan_type: planType
    });
  };

  const handlePlanPriceChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData({
      ...formData,
      plan_price: value ? parseInt(value, 10) : 0
    });
  };

  const toggleAddon = (addon) => {
    const exists = formData.addons.find(a => a.id === addon.id);
    if (exists) {
      setFormData({
        ...formData,
        addons: formData.addons.filter(a => a.id !== addon.id)
      });
    } else {
      setFormData({
        ...formData,
        addons: [...formData.addons, { id: addon.id, name: addon.name, price: 0 }]
      });
    }
  };

  const handleAddonPriceChange = (addonId, value) => {
    const numValue = value.replace(/[^\d]/g, '');
    setFormData({
      ...formData,
      addons: formData.addons.map(a =>
        a.id === addonId ? { ...a, price: numValue ? parseInt(numValue, 10) : 0 } : a
      )
    });
  };

  const calculateTotal = () => {
    const planPrice = formData.plan_price || 0;
    const addonsTotal = formData.addons.reduce((sum, a) => sum + (a.price || 0), 0);
    return planPrice + addonsTotal;
  };

  const calculateVat = () => {
    return calculateTotal() * ((parseFloat(formData.vat_rate) || 22) / 100);
  };

  const calculateTotalWithVat = () => {
    return calculateTotal() + calculateVat();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setToast({ message: 'Solo file PDF sono accettati', type: 'error' });
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload/contract`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFormData(prev => ({ ...prev, contract_document_url: res.data.file_url }));
      setToast({ message: 'PDF caricato con successo', type: 'success' });
    } catch (error) {
      console.error('Errore upload:', error);
      setToast({ message: 'Errore nel caricamento del file', type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, contract_document_url: '' }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.club_id) newErrors.club_id = 'Seleziona un club';
    }
    if (step === 2) {
      if (!formData.start_date) newErrors.start_date = 'Inserisci la data di inizio';
      if (!formData.end_date) newErrors.end_date = 'Inserisci la data di fine';
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
      const payload = {
        ...formData,
        total_value: calculateTotal()
      };

      if (isEdit) {
        await axios.put(`${API_URL}/admin/contracts/${contractId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Contratto aggiornato con successo!', type: 'success' });
        setTimeout(() => navigate('/admin/contratti'), 1500);
      } else {
        await axios.post(`${API_URL}/admin/contracts`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Contratto creato con successo!', type: 'success' });
        setTimeout(() => navigate('/admin/contratti'), 1500);
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      setToast({ message: error.response?.data?.error || 'Errore nel salvataggio', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedClub = () => {
    return clubs.find(c => c.id === parseInt(formData.club_id)) || null;
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
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Caricamento contratto...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const selectedClub = getSelectedClub();
  const planConfig = PLAN_CONFIG[formData.plan_type] || PLAN_CONFIG.Premium;

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate('/admin/contratti')}>
            <FaArrowLeft />
          </button>
          <h1>{isEdit ? 'Modifica Contratto' : 'Nuovo Contratto'}</h1>
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
              {/* Step 1: Club & Piano */}
              {currentStep === 1 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Seleziona Club e Piano</h2>

                  {/* Club Selection */}
                  {!isEdit && (
                    <div className="form-group" ref={clubRef} style={{ position: 'relative' }}>
                      <label>Club <span className="required">*</span></label>
                      <button
                        type="button"
                        onClick={() => { setClubOpen(!clubOpen); }}
                        className={errors.club_id ? 'error' : ''}
                        style={{
                          width: '100%', padding: '12px 16px',
                          border: errors.club_id ? '2px solid #DC2626' : '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', fontSize: '14px',
                          color: formData.club_id ? '#1A1A1A' : '#9CA3AF'
                        }}
                      >
                        <span style={{ fontWeight: formData.club_id ? 500 : 400 }}>
                          {selectedClub?.nome || 'Seleziona un club...'}
                        </span>
                        <FaChevronDown size={12} style={{
                          transition: 'transform 0.2s',
                          transform: clubOpen ? 'rotate(180deg)' : 'rotate(0)',
                          color: '#9CA3AF'
                        }} />
                      </button>
                      {errors.club_id && <span className="error-message">{errors.club_id}</span>}
                      {clubOpen && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                          background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '280px', overflow: 'hidden'
                        }}>
                          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                            {clubs.length === 0 ? (
                              <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                                Nessun club disponibile
                              </div>
                            ) : (
                              clubs.map(club => (
                                <div
                                  key={club.id}
                                  onClick={() => { setFormData(prev => ({ ...prev, club_id: club.id.toString() })); setClubOpen(false); }}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 16px', cursor: 'pointer',
                                    background: formData.club_id === club.id.toString() ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                    borderLeft: formData.club_id === club.id.toString() ? '3px solid #85FF00' : '3px solid transparent'
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: formData.club_id === club.id.toString() ? 600 : 400 }}>{club.nome}</div>
                                    {club.tipologia && <div style={{ fontSize: '12px', color: '#6B7280' }}>{club.tipologia}</div>}
                                  </div>
                                  {formData.club_id === club.id.toString() && <FaCheck size={12} color="#85FF00" />}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plan Selection */}
                  <div className="form-group">
                    <label>Piano</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {Object.entries(PLAN_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handlePlanChange(key)}
                          style={{
                            padding: '20px 16px',
                            borderRadius: '12px',
                            border: formData.plan_type === key ? '2px solid #85FF00' : '2px solid #E5E7EB',
                            background: formData.plan_type === key ? 'rgba(133, 255, 0, 0.1)' : 'white',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: formData.plan_type === key ? '#059669' : '#1A1A1A'
                          }}>
                            {config.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plan Price Input */}
                  <div className="form-group">
                    <label>Prezzo Piano ({PLAN_CONFIG[formData.plan_type]?.name})</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6B7280',
                        fontWeight: 500
                      }}>€</span>
                      <input
                        type="text"
                        value={formData.plan_price || ''}
                        onChange={handlePlanPriceChange}
                        placeholder="0"
                        style={{
                          paddingLeft: '36px',
                          fontSize: '18px',
                          fontWeight: 600
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Inserisci il prezzo annuale del piano</span>
                  </div>

                  {/* Addons */}
                  <div className="form-group" style={{ marginTop: '24px' }}>
                    <label>Add-ons (opzionali)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ADDON_OPTIONS.map(addon => {
                        const selectedAddon = formData.addons.find(a => a.id === addon.id);
                        const isSelected = !!selectedAddon;
                        return (
                          <div
                            key={addon.id}
                            style={{
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #85FF00' : '2px solid #E5E7EB',
                              background: isSelected ? 'rgba(133, 255, 0, 0.05)' : 'white',
                              transition: 'all 0.2s',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              onClick={() => toggleAddon(addon)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 16px',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  width: '20px', height: '20px', borderRadius: '4px',
                                  border: isSelected ? '2px solid #85FF00' : '2px solid #D1D5DB',
                                  background: isSelected ? '#85FF00' : 'white',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {isSelected && <FaCheck size={10} color="#1A1A1A" />}
                                </div>
                                <span style={{ fontWeight: 500, color: '#1A1A1A' }}>{addon.name}</span>
                              </div>
                              {isSelected && (
                                <span style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(selectedAddon.price)}</span>
                              )}
                            </div>
                            {isSelected && (
                              <div style={{
                                padding: '12px 16px',
                                borderTop: '1px solid rgba(133, 255, 0, 0.3)',
                                background: 'rgba(133, 255, 0, 0.05)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>Prezzo:</span>
                                  <div style={{ position: 'relative', flex: 1 }}>
                                    <span style={{
                                      position: 'absolute',
                                      left: '12px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      color: '#6B7280',
                                      fontSize: '13px'
                                    }}>€</span>
                                    <input
                                      type="text"
                                      value={selectedAddon.price || ''}
                                      onChange={(e) => handleAddonPriceChange(addon.id, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="0"
                                      style={{
                                        width: '100%',
                                        padding: '8px 12px 8px 28px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: 500
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* IVA */}
                  <div className="form-group" style={{ marginTop: '20px' }}>
                    <label>Aliquota IVA (%)</label>
                    <input
                      type="number"
                      value={formData.vat_rate}
                      onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                      style={{ maxWidth: '120px' }}
                    />
                  </div>

                  {/* Total with VAT */}
                  <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #1A1A1A 0%, #374151 100%)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Imponibile</span>
                      <span style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>IVA ({formData.vat_rate}%)</span>
                      <span style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>{formatCurrency(calculateVat())}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>Totale Contratto (IVA incl.)</span>
                      <span style={{ color: '#85FF00', fontSize: '28px', fontWeight: 700 }}>{formatCurrency(calculateTotalWithVat())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Date & Pagamento */}
              {currentStep === 2 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Date e Pagamento</h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Data Inizio <span className="required">*</span></label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className={errors.start_date ? 'error' : ''}
                      />
                      {errors.start_date && <span className="error-message">{errors.start_date}</span>}
                    </div>
                    <div className="form-group">
                      <label>Data Fine <span className="required">*</span></label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className={errors.end_date ? 'error' : ''}
                      />
                      {errors.end_date && <span className="error-message">{errors.end_date}</span>}
                    </div>
                  </div>

                  <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                    <h2 className="sf-section-title">Termini di Pagamento</h2>

                    {/* Payment Terms Dropdown */}
                    <div className="form-group" ref={paymentTermsRef} style={{ position: 'relative' }}>
                      <label>Frequenza Pagamento</label>
                      <button
                        type="button"
                        onClick={() => { setPaymentTermsOpen(!paymentTermsOpen); }}
                        style={{
                          width: '100%', padding: '12px 16px',
                          border: '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', fontSize: '14px', color: '#1A1A1A'
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          {PAYMENT_TERMS.find(p => p.value === formData.payment_terms)?.label || 'Seleziona...'}
                        </span>
                        <FaChevronDown size={12} style={{
                          transition: 'transform 0.2s',
                          transform: paymentTermsOpen ? 'rotate(180deg)' : 'rotate(0)',
                          color: '#9CA3AF'
                        }} />
                      </button>
                      {paymentTermsOpen && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                          background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden'
                        }}>
                          {PAYMENT_TERMS.map(term => (
                            <div
                              key={term.value}
                              onClick={() => { setFormData(prev => ({ ...prev, payment_terms: term.value })); setPaymentTermsOpen(false); }}
                              style={{
                                padding: '10px 16px', cursor: 'pointer',
                                background: formData.payment_terms === term.value ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                borderLeft: formData.payment_terms === term.value ? '3px solid #85FF00' : '3px solid transparent'
                              }}
                            >
                              <span style={{ fontWeight: formData.payment_terms === term.value ? 600 : 400 }}>{term.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Method - Fixed to Bank Transfer */}
                    <div className="form-group">
                      <label>Metodo di Pagamento</label>
                      <div style={{
                        width: '100%', padding: '12px 16px',
                        border: '2px solid #E5E7EB', borderRadius: '8px', background: '#F9FAFB',
                        fontSize: '14px', color: '#1A1A1A', fontWeight: 500
                      }}>
                        Bonifico Bancario
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Firma & Note */}
              {currentStep === 3 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Firma e Note</h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Firmato da</label>
                      <input
                        type="text"
                        name="signed_by"
                        value={formData.signed_by}
                        onChange={(e) => setFormData({ ...formData, signed_by: e.target.value })}
                        placeholder="Nome del firmatario"
                      />
                    </div>
                    <div className="form-group">
                      <label>Data Firma</label>
                      <input
                        type="date"
                        name="signed_date"
                        value={formData.signed_date}
                        onChange={(e) => setFormData({ ...formData, signed_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Note</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Note aggiuntive sul contratto..."
                      rows={4}
                      style={{ resize: 'vertical', minHeight: '100px' }}
                    />
                  </div>

                  {/* PDF Upload */}
                  <div className="form-group" style={{ marginTop: '24px' }}>
                    <label>Documento Contratto (PDF)</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf"
                      style={{ display: 'none' }}
                    />
                    {!formData.contract_document_url ? (
                      <div
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed #E5E7EB',
                          borderRadius: '12px',
                          padding: '32px 20px',
                          textAlign: 'center',
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          background: '#FAFAFA'
                        }}
                        onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.borderColor = '#85FF00'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                      >
                        {uploading ? (
                          <>
                            <div style={{
                              width: '40px', height: '40px', margin: '0 auto 12px',
                              border: '3px solid #E5E7EB', borderTopColor: '#85FF00',
                              borderRadius: '50%', animation: 'spin 1s linear infinite'
                            }} />
                            <p style={{ color: '#6B7280', fontSize: '14px' }}>Caricamento in corso...</p>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                              <FaUpload size={32} color="#9CA3AF" />
                            </div>
                            <p style={{ color: '#1A1A1A', fontWeight: 500, marginBottom: '4px' }}>
                              Clicca per caricare il PDF
                            </p>
                            <p style={{ color: '#6B7280', fontSize: '13px' }}>
                              Solo file PDF
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        background: '#F0FDF4',
                        border: '2px solid #86EFAC',
                        borderRadius: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '10px',
                            background: '#DC2626', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}>
                            <FaFilePdf size={20} color="white" />
                          </div>
                          <div>
                            <p style={{ fontWeight: 500, color: '#1A1A1A', marginBottom: '2px' }}>
                              Contratto.pdf
                            </p>
                            <p style={{ fontSize: '12px', color: '#059669' }}>
                              PDF caricato con successo
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={getImageUrl(formData.contract_document_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '8px 12px', borderRadius: '8px',
                              background: '#E5E7EB', color: '#374151',
                              textDecoration: 'none', fontSize: '13px',
                              display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            <FaExternalLinkAlt size={12} /> Apri
                          </a>
                          <button
                            type="button"
                            onClick={removeFile}
                            style={{
                              padding: '8px 12px', borderRadius: '8px',
                              background: '#FEE2E2', color: '#DC2626',
                              border: 'none', cursor: 'pointer', fontSize: '13px',
                              display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            <FaTrash size={12} /> Rimuovi
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div style={{ marginTop: '24px', padding: '20px', background: '#F9FAFB', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>Riepilogo Contratto</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Club</span>
                        <span style={{ fontWeight: 500 }}>{selectedClub?.nome || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Piano</span>
                        <span style={{ fontWeight: 500 }}>{PLAN_CONFIG[formData.plan_type]?.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Periodo</span>
                        <span style={{ fontWeight: 500 }}>{formatDate(formData.start_date)} → {formatDate(formData.end_date)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>IVA ({formData.vat_rate}%)</span>
                        <span style={{ fontWeight: 500 }}>{formatCurrency(calculateVat())}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                        <span style={{ fontWeight: 600, color: '#1A1A1A' }}>Totale (IVA incl.)</span>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '18px' }}>{formatCurrency(calculateTotalWithVat())}</span>
                      </div>
                    </div>
                  </div>
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
                    {saving ? 'Salvataggio...' : isEdit ? 'Aggiorna Contratto' : 'Crea Contratto'}
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
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anteprima Contratto</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  background: planConfig.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FaFileContract size={24} color={planConfig.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    Piano {planConfig.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
                    {selectedClub?.nome || 'Club non selezionato'}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{ padding: '20px' }}>
              {/* Value */}
              <div style={{
                padding: '20px',
                background: '#ECFDF5',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 500, marginBottom: '4px' }}>Valore Contratto (IVA incl.)</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#059669' }}>{formatCurrency(calculateTotalWithVat())}</div>
                <div style={{ fontSize: '12px', color: '#065F46' }}>/anno</div>
                <div style={{ fontSize: '11px', color: '#065F46', marginTop: '4px' }}>Netto: {formatCurrency(calculateTotal())}</div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Prezzo Piano</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(formData.plan_price)}</span>
                </div>

                {formData.addons.length > 0 && (
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Add-ons</div>
                    {formData.addons.map(addon => (
                      <div key={addon.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#374151' }}>{addon.name}</span>
                        <span style={{ fontWeight: 500 }}>{formatCurrency(addon.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>IVA ({formData.vat_rate}%)</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(calculateVat())}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Periodo</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    {formData.start_date && formData.end_date
                      ? `${formatDate(formData.start_date)} → ${formatDate(formData.end_date)}`
                      : '-'
                    }
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Pagamento</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    {PAYMENT_TERMS.find(p => p.value === formData.payment_terms)?.label}
                  </span>
                </div>

                {formData.signed_by && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>Firmato da</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{formData.signed_by}</span>
                  </div>
                )}

                {formData.contract_document_url && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>Documento</span>
                    <a
                      href={getImageUrl(formData.contract_document_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '13px', fontWeight: 500, color: '#DC2626',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <FaFilePdf size={14} /> PDF Allegato
                    </a>
                  </div>
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
              {isEdit
                ? `Confermi di voler aggiornare il contratto?`
                : `Confermi di voler creare il contratto per "${selectedClub?.nome || 'il club selezionato'}"?`
              }
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

export default AdminContractForm;
