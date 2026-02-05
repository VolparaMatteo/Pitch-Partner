import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaChevronDown,
  FaFileInvoiceDollar, FaBuilding, FaCalendarAlt, FaCrown,
  FaFilePdf, FaUpload, FaTimes, FaSpinner
} from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const PLAN_COLORS = {
  basic: { color: '#6B7280', bg: '#F3F4F6' },
  premium: { color: '#3B82F6', bg: '#EFF6FF' },
  elite: { color: '#F59E0B', bg: '#FFFBEB' }
};

function AdminInvoiceForm() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const isEdit = !!invoiceId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [contracts, setContracts] = useState([]);

  // Custom Dropdowns
  const [contractOpen, setContractOpen] = useState(false);
  const contractRef = useRef(null);
  const fileInputRef = useRef(null);

  // PDF Upload
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const totalSteps = 2;
  const steps = [
    { number: 1, title: 'Contratto & Importo' },
    { number: 2, title: 'Date & Note' }
  ];

  const [formData, setFormData] = useState({
    contract_id: '',
    amount: '',
    vat_rate: 22,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchContracts();
    if (isEdit) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // Click-outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contractRef.current && !contractRef.current.contains(e.target)) setContractOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContracts(res.data.contracts || []);
    } catch (error) {
      console.error('Errore caricamento contratti:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invoice = res.data;
      setFormData({
        contract_id: invoice.contract_id?.toString() || '',
        amount: invoice.amount || '',
        vat_rate: invoice.vat_rate || 22,
        issue_date: invoice.issue_date || '',
        due_date: invoice.due_date || '',
        notes: invoice.notes || ''
      });
      if (invoice.invoice_document_url) {
        setPdfUrl(invoice.invoice_document_url);
      }
    } catch (error) {
      console.error('Errore caricamento fattura:', error);
      setToast({ message: 'Errore nel caricamento della fattura', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setToast({ message: 'Solo file PDF sono accettati', type: 'error' });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setToast({ message: 'Il file non può superare i 10MB', type: 'error' });
      return;
    }

    try {
      setUploadingPdf(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${API_URL}/upload/fattura`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setPdfUrl(res.data.file_url);
      setToast({ message: 'PDF caricato con successo', type: 'success' });
    } catch (error) {
      console.error('Errore upload PDF:', error);
      setToast({ message: 'Errore nel caricamento del PDF', type: 'error' });
    } finally {
      setUploadingPdf(false);
    }
  };

  const removePdf = () => {
    setPdfUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContractChange = (contract) => {
    setFormData({
      ...formData,
      contract_id: contract.id.toString(),
      amount: contract.total_value || ''
    });
    setContractOpen(false);
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const vatRate = parseFloat(formData.vat_rate) || 22;
    const vat = amount * (vatRate / 100);
    return amount + vat;
  };

  const calculateVat = () => {
    const amount = parseFloat(formData.amount) || 0;
    const vatRate = parseFloat(formData.vat_rate) || 22;
    return amount * (vatRate / 100);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.contract_id) newErrors.contract_id = 'Seleziona un contratto';
      if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Inserisci un importo valido';
    }
    if (step === 2) {
      if (!formData.issue_date) newErrors.issue_date = 'Inserisci la data di emissione';
      if (!formData.due_date) newErrors.due_date = 'Inserisci la data di scadenza';
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
        contract_id: parseInt(formData.contract_id),
        amount: parseFloat(formData.amount),
        vat_rate: parseFloat(formData.vat_rate),
        invoice_document_url: pdfUrl || null
      };

      if (isEdit) {
        await axios.put(`${API_URL}/admin/invoices/${invoiceId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Fattura aggiornata con successo!', type: 'success' });
        setTimeout(() => navigate('/admin/finanze?tab=invoices'), 1500);
      } else {
        await axios.post(`${API_URL}/admin/invoices`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ message: 'Fattura creata con successo!', type: 'success' });
        setTimeout(() => navigate('/admin/finanze?tab=invoices'), 1500);
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      setToast({ message: error.response?.data?.error || 'Errore nel salvataggio', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedContract = () => {
    return contracts.find(c => c.id === parseInt(formData.contract_id)) || null;
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
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Caricamento fattura...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const selectedContract = getSelectedContract();
  const planColors = selectedContract ? (PLAN_COLORS[selectedContract.plan_type?.toLowerCase()] || PLAN_COLORS.basic) : PLAN_COLORS.basic;

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate('/admin/finanze')}>
            <FaArrowLeft />
          </button>
          <h1>{isEdit ? 'Modifica Fattura' : 'Nuova Fattura'}</h1>
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
              {/* Step 1: Contratto & Importo */}
              {currentStep === 1 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Seleziona Contratto e Importo</h2>

                  {/* Contract Selection */}
                  <div className="form-group" ref={contractRef} style={{ position: 'relative' }}>
                    <label>Contratto <span className="required">*</span></label>
                    <button
                      type="button"
                      onClick={() => { setContractOpen(!contractOpen); }}
                      className={errors.contract_id ? 'error' : ''}
                      style={{
                        width: '100%', padding: '12px 16px',
                        border: errors.contract_id ? '2px solid #DC2626' : '2px solid #E5E7EB', borderRadius: '8px', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', fontSize: '14px',
                        color: formData.contract_id ? '#1A1A1A' : '#9CA3AF'
                      }}
                    >
                      <span style={{ fontWeight: formData.contract_id ? 500 : 400 }}>
                        {selectedContract ? `${selectedContract.club_name} - ${selectedContract.plan_type}` : 'Seleziona un contratto...'}
                      </span>
                      <FaChevronDown size={12} style={{
                        transition: 'transform 0.2s',
                        transform: contractOpen ? 'rotate(180deg)' : 'rotate(0)',
                        color: '#9CA3AF'
                      }} />
                    </button>
                    {errors.contract_id && <span className="error-message">{errors.contract_id}</span>}
                    {contractOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '320px', overflow: 'hidden'
                      }}>
                        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                          {contracts.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                              Nessun contratto attivo
                            </div>
                          ) : (
                            contracts.map(contract => {
                              const colors = PLAN_COLORS[contract.plan_type?.toLowerCase()] || PLAN_COLORS.basic;
                              return (
                                <div
                                  key={contract.id}
                                  onClick={() => handleContractChange(contract)}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', cursor: 'pointer',
                                    background: formData.contract_id === contract.id.toString() ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                                    borderLeft: formData.contract_id === contract.id.toString() ? '3px solid #85FF00' : '3px solid transparent'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                      width: '36px', height: '36px', borderRadius: '8px',
                                      background: '#F3F4F6', display: 'flex',
                                      alignItems: 'center', justifyContent: 'center'
                                    }}>
                                      <FaBuilding size={16} color="#6B7280" />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 500, color: '#1A1A1A' }}>{contract.club_name}</div>
                                      <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                                          padding: '2px 8px', borderRadius: '4px',
                                          background: colors.bg, color: colors.color,
                                          fontSize: '11px', fontWeight: 600
                                        }}>
                                          <FaCrown size={8} />
                                          {contract.plan_type}
                                        </span>
                                        <span>{formatCurrency(contract.total_value)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {formData.contract_id === contract.id.toString() && <FaCheck size={12} color="#85FF00" />}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="form-group" style={{ marginTop: '20px' }}>
                    <label>Importo Netto <span className="required">*</span></label>
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
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className={errors.amount ? 'error' : ''}
                        style={{
                          paddingLeft: '36px',
                          fontSize: '18px',
                          fontWeight: 600
                        }}
                      />
                    </div>
                    {errors.amount && <span className="error-message">{errors.amount}</span>}
                  </div>

                  {/* VAT Rate */}
                  <div className="form-group">
                    <label>Aliquota IVA (%)</label>
                    <input
                      type="number"
                      value={formData.vat_rate}
                      onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                      style={{ maxWidth: '120px' }}
                    />
                  </div>

                  {/* Total Preview */}
                  <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #1A1A1A 0%, #374151 100%)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Imponibile</span>
                      <span style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>{formatCurrency(formData.amount || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>IVA ({formData.vat_rate}%)</span>
                      <span style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>{formatCurrency(calculateVat())}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>Totale Fattura</span>
                      <span style={{ color: '#85FF00', fontSize: '28px', fontWeight: 700 }}>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Date & Note */}
              {currentStep === 2 && (
                <div className="sf-step-content">
                  <h2 className="sf-section-title">Date e Note</h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Data Emissione <span className="required">*</span></label>
                      <input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                        className={errors.issue_date ? 'error' : ''}
                      />
                      {errors.issue_date && <span className="error-message">{errors.issue_date}</span>}
                    </div>
                    <div className="form-group">
                      <label>Data Scadenza <span className="required">*</span></label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className={errors.due_date ? 'error' : ''}
                      />
                      {errors.due_date && <span className="error-message">{errors.due_date}</span>}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '20px' }}>
                    <label>Note</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Note aggiuntive sulla fattura..."
                      rows={4}
                      style={{ resize: 'vertical', minHeight: '100px' }}
                    />
                  </div>

                  {/* PDF Upload */}
                  <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                    <h2 className="sf-section-title">Documento Fattura</h2>
                    <div className="form-group">
                      <label>Allega PDF Fattura</label>

                      {!pdfUrl ? (
                        <div
                          onClick={() => !uploadingPdf && fileInputRef.current?.click()}
                          style={{
                            border: '2px dashed #E5E7EB',
                            borderRadius: '12px',
                            padding: '32px',
                            textAlign: 'center',
                            cursor: uploadingPdf ? 'wait' : 'pointer',
                            background: '#FAFAFA',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { if (!uploadingPdf) e.currentTarget.style.borderColor = '#85FF00'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                        >
                          {uploadingPdf ? (
                            <>
                              <FaSpinner size={32} color="#85FF00" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Caricamento in corso...</p>
                            </>
                          ) : (
                            <>
                              <FaUpload size={32} color="#9CA3AF" style={{ marginBottom: '12px' }} />
                              <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 4px' }}>
                                Clicca per caricare o trascina il file
                              </p>
                              <p style={{ color: '#9CA3AF', fontSize: '12px', margin: 0 }}>
                                Solo PDF, max 10MB
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          background: '#F0FDF4',
                          border: '2px solid #86EFAC',
                          borderRadius: '12px'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            background: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FaFilePdf size={24} color="white" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px', fontSize: '14px' }}>
                              Fattura PDF allegata
                            </p>
                            <a
                              href={`${API_URL.replace('/api', '')}${pdfUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#059669', fontSize: '12px', textDecoration: 'none' }}
                            >
                              Visualizza documento →
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={removePdf}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Rimuovi PDF"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ marginTop: '24px', padding: '20px', background: '#F9FAFB', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>Riepilogo Fattura</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Contratto</span>
                        <span style={{ fontWeight: 500 }}>{selectedContract?.club_name || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Piano</span>
                        <span style={{ fontWeight: 500 }}>{selectedContract?.plan_type || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Scadenza</span>
                        <span style={{ fontWeight: 500 }}>{formatDate(formData.due_date)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                        <span style={{ fontWeight: 600, color: '#1A1A1A' }}>Totale</span>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '18px' }}>{formatCurrency(calculateTotal())}</span>
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
                    {saving ? 'Salvataggio...' : isEdit ? 'Aggiorna Fattura' : 'Crea Fattura'}
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
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anteprima Fattura</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  background: planColors.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FaFileInvoiceDollar size={24} color={planColors.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    {selectedContract ? selectedContract.club_name : 'Seleziona contratto'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
                    {selectedContract ? `Piano ${selectedContract.plan_type}` : '-'}
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
                <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 500, marginBottom: '4px' }}>Totale Fattura</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#059669' }}>{formatCurrency(calculateTotal())}</div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Imponibile</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(formData.amount || 0)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>IVA ({formData.vat_rate}%)</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(calculateVat())}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Emissione</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{formatDate(formData.issue_date)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Scadenza</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{formatDate(formData.due_date)}</span>
                </div>

                {formData.notes && (
                  <div style={{ padding: '8px 0' }}>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>Note</span>
                    <p style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>{formData.notes}</p>
                  </div>
                )}

                {pdfUrl && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#FEF2F2',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FaFilePdf size={20} color="#DC2626" />
                    <span style={{ fontSize: '13px', color: '#991B1B', fontWeight: 500 }}>PDF Allegato</span>
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
                ? `Confermi di voler aggiornare la fattura?`
                : `Confermi di voler creare la fattura per "${selectedContract?.club_name || 'il contratto selezionato'}"?`
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

export default AdminInvoiceForm;
