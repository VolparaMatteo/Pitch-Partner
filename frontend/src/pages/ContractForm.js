import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { contractAPI, clubAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { FaArrowLeft, FaArrowRight, FaCheck, FaCube, FaLayerGroup, FaPlus, FaTimes, FaEuroSign } from 'react-icons/fa';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    sponsor_id: '',
    nome_contratto: '',
    compenso: '',
    data_inizio: '',
    data_fine: '',
    descrizione: '',
    status: 'bozza'
  });
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Inventory integration
  const [inventoryAssets, setInventoryAssets] = useState([]);
  const [inventoryPackages, setInventoryPackages] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const { token } = getAuth();

  const totalSteps = 4;

  const steps = [
    { number: 1, title: 'Generale' },
    { number: 2, title: 'Economici' },
    { number: 3, title: 'Inventario' },
    { number: 4, title: 'Dettagli' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchSponsors();
    fetchInventory();
    if (isEdit) {
      fetchContract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInventory = async () => {
    try {
      const [assetsRes, packagesRes] = await Promise.all([
        axios.get(`${API_URL}/club/inventory/assets`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/inventory/packages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setInventoryAssets(assetsRes.data.assets || assetsRes.data || []);
      setInventoryPackages(packagesRes.data.packages || packagesRes.data || []);
    } catch (error) {
      console.error('Errore caricamento inventario:', error);
      // Demo data
      setInventoryAssets([
        { id: 1, codice: 'LED-001', nome: 'LED Board Tribuna Centrale', prezzo_listino: 50000, categoria: { nome: 'LED', colore: '#6366F1' } },
        { id: 2, codice: 'JER-001', nome: 'Maglia Gara - Fronte', prezzo_listino: 500000, categoria: { nome: 'Jersey', colore: '#EC4899' } },
        { id: 3, codice: 'DIG-001', nome: 'Banner Homepage', prezzo_listino: 25000, categoria: { nome: 'Digital', colore: '#3B82F6' } },
        { id: 4, codice: 'HOS-001', nome: 'Skybox VIP (10 posti)', prezzo_listino: 80000, categoria: { nome: 'Hospitality', colore: '#F59E0B' } }
      ]);
      setInventoryPackages([
        { id: 1, nome: 'Gold Package', prezzo_listino: 800000, livello: 'main', items_count: 8 },
        { id: 2, nome: 'Silver Package', prezzo_listino: 400000, livello: 'official', items_count: 5 },
        { id: 3, nome: 'Bronze Package', prezzo_listino: 150000, livello: 'premium', items_count: 3 }
      ]);
    }
  };

  // Asset selection handlers
  const addAsset = (asset) => {
    if (selectedAssets.find(a => a.id === asset.id)) return;
    setSelectedAssets([...selectedAssets, { ...asset, quantita: 1 }]);
    setSelectedPackage(null); // Clear package if selecting individual assets
  };

  const removeAsset = (assetId) => {
    setSelectedAssets(selectedAssets.filter(a => a.id !== assetId));
  };

  const updateAssetQuantity = (assetId, quantity) => {
    setSelectedAssets(selectedAssets.map(a =>
      a.id === assetId ? { ...a, quantita: Math.max(1, parseInt(quantity) || 1) } : a
    ));
  };

  const selectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setSelectedAssets([]); // Clear individual assets if selecting a package
  };

  const calculateSelectedValue = () => {
    if (selectedPackage) {
      return selectedPackage.prezzo_listino || 0;
    }
    return selectedAssets.reduce((sum, a) => sum + (a.prezzo_listino || 0) * (a.quantita || 1), 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const fetchSponsors = async () => {
    try {
      const response = await clubAPI.getSponsors();
      setSponsors(response.data.sponsors || response.data || []);
    } catch (error) {
      console.error('Errore caricamento sponsor:', error);
    }
  };

  const fetchContract = async () => {
    try {
      const response = await contractAPI.getContract(id);
      const contract = response.data.contract || response.data;
      setFormData({
        sponsor_id: contract.sponsor_id || '',
        nome_contratto: contract.nome_contratto || '',
        compenso: contract.compenso || '',
        data_inizio: contract.data_inizio ? contract.data_inizio.split('T')[0] : '',
        data_fine: contract.data_fine ? contract.data_fine.split('T')[0] : '',
        descrizione: contract.descrizione || '',
        status: contract.status || 'bozza'
      });
    } catch (error) {
      console.error('Errore caricamento contratto:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!isEdit && !formData.sponsor_id) {
        newErrors.sponsor_id = 'Seleziona uno sponsor';
      }
      if (!formData.nome_contratto.trim()) {
        newErrors.nome_contratto = 'Inserisci il nome del contratto';
      }
    }

    if (step === 2) {
      if (!formData.compenso || formData.compenso <= 0) {
        newErrors.compenso = 'Inserisci un compenso valido';
      }
      if (!formData.data_inizio) {
        newErrors.data_inizio = 'Inserisci la data di inizio';
      }
      if (!formData.data_fine) {
        newErrors.data_fine = 'Inserisci la data di fine';
      }
      if (formData.data_inizio && formData.data_fine) {
        if (new Date(formData.data_fine) <= new Date(formData.data_inizio)) {
          newErrors.data_fine = 'La data di fine deve essere successiva alla data di inizio';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validate = () => {
    let isValid = true;
    for (let i = 1; i <= totalSteps; i++) {
      if (!validateStep(i)) {
        isValid = false;
      }
    }
    return isValid;
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

      const submitData = {
        sponsor_id: parseInt(formData.sponsor_id),
        nome_contratto: formData.nome_contratto,
        compenso: parseFloat(formData.compenso),
        data_inizio: formData.data_inizio,
        data_fine: formData.data_fine,
        descrizione: formData.descrizione,
        status: formData.status,
        // Inventory data
        package_id: selectedPackage?.id || null,
        assets: selectedAssets.map(a => ({
          asset_id: a.id,
          quantita: a.quantita || 1
        }))
      };

      let contractId = id;

      if (isEdit) {
        await contractAPI.updateContract(id, submitData);
        setToast({
          message: 'Contratto aggiornato con successo!',
          type: 'success'
        });
      } else {
        const response = await contractAPI.createContract(submitData);
        contractId = response.data.id || response.data.contract?.id;
        setToast({
          message: 'Contratto creato con successo!',
          type: 'success'
        });
      }

      setTimeout(() => {
        navigate(`/club/contracts/${contractId}`);
      }, 1500);
    } catch (error) {
      console.error('Errore salvataggio contratto:', error);
      const errorMessage = error.response?.data?.error || 'Errore durante il salvataggio del contratto. Riprova.';
      setToast({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sponsor-form-page">
      {/* Page Header */}
      <div className="sf-page-header">
        <div className="sf-header-left">
          <button className="sf-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <h1>{isEdit ? 'Modifica Contratto' : 'Nuovo Contratto'}</h1>
        </div>
      </div>

      {/* Main Card */}
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
          {/* Step 1: Informazioni Generali */}
          {currentStep === 1 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Informazioni Generali</h2>

              <div className="form-group">
                <label>Sponsor <span className="required">*</span></label>
                <select
                  name="sponsor_id"
                  value={formData.sponsor_id}
                  onChange={handleChange}
                  disabled={isEdit}
                  className={errors.sponsor_id ? 'error' : ''}
                  style={isEdit ? { background: '#F5F5F5', cursor: 'not-allowed' } : {}}
                >
                  <option value="">Seleziona uno sponsor</option>
                  {sponsors.map(sponsor => (
                    <option key={sponsor.id} value={sponsor.id}>
                      {sponsor.ragione_sociale}
                    </option>
                  ))}
                </select>
                {errors.sponsor_id && <span className="error-message">{errors.sponsor_id}</span>}
                {isEdit && (
                  <span className="form-hint">Lo sponsor non può essere modificato</span>
                )}
              </div>

              <div className="form-group">
                <label>Nome Contratto <span className="required">*</span></label>
                <input
                  type="text"
                  name="nome_contratto"
                  value={formData.nome_contratto}
                  onChange={handleChange}
                  placeholder="es. Sponsorizzazione Maglia Home 2024/25"
                  className={errors.nome_contratto ? 'error' : ''}
                />
                {errors.nome_contratto && <span className="error-message">{errors.nome_contratto}</span>}
              </div>
            </div>
          )}

          {/* Step 2: Dettagli Economici */}
          {currentStep === 2 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Dettagli Economici</h2>

              <div className="form-group">
                <label>Compenso (€) <span className="required">*</span></label>
                <input
                  type="number"
                  name="compenso"
                  value={formData.compenso}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  step="0.01"
                  className={errors.compenso ? 'error' : ''}
                />
                {errors.compenso && <span className="error-message">{errors.compenso}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data Inizio <span className="required">*</span></label>
                  <input
                    type="date"
                    name="data_inizio"
                    value={formData.data_inizio}
                    onChange={handleChange}
                    className={errors.data_inizio ? 'error' : ''}
                  />
                  {errors.data_inizio && <span className="error-message">{errors.data_inizio}</span>}
                </div>

                <div className="form-group">
                  <label>Data Fine <span className="required">*</span></label>
                  <input
                    type="date"
                    name="data_fine"
                    value={formData.data_fine}
                    onChange={handleChange}
                    className={errors.data_fine ? 'error' : ''}
                  />
                  {errors.data_fine && <span className="error-message">{errors.data_fine}</span>}
                </div>
              </div>

              {formData.data_inizio && formData.data_fine && new Date(formData.data_fine) > new Date(formData.data_inizio) && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: 'rgba(133, 255, 0, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(133, 255, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaCheck style={{ color: '#059669' }} />
                  <span style={{ fontSize: '14px', color: '#1A1A1A' }}>
                    Durata contratto: {Math.ceil((new Date(formData.data_fine) - new Date(formData.data_inizio)) / (1000 * 60 * 60 * 24 * 30))} mesi
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Inventario */}
          {currentStep === 3 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">
                <FaCube style={{ marginRight: '8px', color: '#85FF00' }} />
                Seleziona Asset Inventario
              </h2>
              <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '14px' }}>
                Associa asset dall'inventario al contratto o seleziona un package esistente.
              </p>

              {/* Package Selection */}
              {inventoryPackages.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                    <FaLayerGroup style={{ marginRight: '8px' }} />
                    Oppure seleziona un Package
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {inventoryPackages.map(pkg => (
                      <div
                        key={pkg.id}
                        onClick={() => selectPackage(selectedPackage?.id === pkg.id ? null : pkg)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: selectedPackage?.id === pkg.id ? '2px solid #85FF00' : '1px solid #E5E7EB',
                          background: selectedPackage?.id === pkg.id ? 'rgba(133, 255, 0, 0.1)' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>{pkg.nome}</div>
                        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                          {pkg.items_count} asset inclusi
                        </div>
                        <div style={{ fontWeight: 700, color: '#85FF00' }}>
                          {formatCurrency(pkg.prezzo_listino)}
                        </div>
                        {selectedPackage?.id === pkg.id && (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', color: '#059669', fontSize: '13px' }}>
                            <FaCheck style={{ marginRight: '4px' }} /> Selezionato
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Asset Selection */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                  <FaCube style={{ marginRight: '8px' }} />
                  Seleziona Asset Singoli
                </h3>

                {/* Search */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <FaCube style={{ color: '#9CA3AF' }} />
                  <input
                    type="text"
                    placeholder="Cerca asset..."
                    value={assetSearchTerm}
                    onChange={(e) => setAssetSearchTerm(e.target.value)}
                    style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '14px' }}
                  />
                </div>

                {/* Selected Assets */}
                {selectedAssets.length > 0 && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'rgba(133, 255, 0, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(133, 255, 0, 0.3)'
                  }}>
                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                      Asset Selezionati ({selectedAssets.length})
                    </div>
                    {selectedAssets.map(asset => (
                      <div key={asset.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        background: 'white',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: asset.categoria?.colore || '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <FaCube size={14} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{asset.nome}</div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{asset.codice}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            min="1"
                            value={asset.quantita}
                            onChange={(e) => updateAssetQuantity(asset.id, e.target.value)}
                            style={{
                              width: '60px',
                              padding: '6px 10px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ color: '#6B7280', fontSize: '13px' }}>
                            × {formatCurrency(asset.prezzo_listino)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAsset(asset.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available Assets */}
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px'
                }}>
                  {inventoryAssets
                    .filter(a => !assetSearchTerm || a.nome?.toLowerCase().includes(assetSearchTerm.toLowerCase()))
                    .map(asset => {
                      const isSelected = selectedAssets.find(a => a.id === asset.id);
                      return (
                        <div
                          key={asset.id}
                          onClick={() => !isSelected && addAsset(asset)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 16px',
                            borderBottom: '1px solid #F3F4F6',
                            cursor: isSelected ? 'default' : 'pointer',
                            background: isSelected ? '#F9FAFB' : 'white',
                            opacity: isSelected ? 0.6 : 1,
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: asset.categoria?.colore || '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <FaCube size={14} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: '14px', color: '#1F2937' }}>{asset.nome}</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{asset.codice}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{formatCurrency(asset.prezzo_listino)}</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{asset.categoria?.nome}</div>
                          </div>
                          {!isSelected && <FaPlus style={{ color: '#9CA3AF' }} />}
                          {isSelected && <FaCheck style={{ color: '#10B981' }} />}
                        </div>
                      );
                    })}
                </div>

                {/* Total Value */}
                {(selectedAssets.length > 0 || selectedPackage) && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #1F2937, #374151)',
                    borderRadius: '12px',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        Valore Inventario Selezionato
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        {selectedPackage ? `Package: ${selectedPackage.nome}` : `${selectedAssets.length} asset`}
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#85FF00' }}>
                      {formatCurrency(calculateSelectedValue())}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Descrizione e Status */}
          {currentStep === 4 && (
            <div className="sf-step-content">
              <h2 className="sf-section-title">Descrizione e Status</h2>

              <div className="form-group">
                <label>Status <span className="required">*</span></label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="bozza">Bozza</option>
                  <option value="attivo">Attivo</option>
                  <option value="concluso">Concluso</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descrizione</label>
                <textarea
                  name="descrizione"
                  value={formData.descrizione}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Descrizione del contratto, note aggiuntive, termini speciali..."
                />
              </div>
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
                <button type="button" className="sf-btn sf-btn-primary" onClick={nextStep}>
                  Avanti
                  <FaArrowRight />
                </button>
              ) : (
                <button type="submit" className="sf-btn sf-btn-primary" disabled={loading}>
                  {loading ? 'Salvataggio...' : (isEdit ? 'Salva Modifiche' : 'Crea Contratto')}
                </button>
              )}
            </div>
          </div>
        </form>
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
              ? `Sei sicuro di voler salvare le modifiche al contratto "${formData.nome_contratto}"?`
              : `Sei sicuro di voler creare il nuovo contratto "${formData.nome_contratto}"?`
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
              {isEdit ? 'Conferma' : 'Crea Contratto'}
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

export default ContractForm;
