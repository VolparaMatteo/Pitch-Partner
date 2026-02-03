import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaSave, FaUndo, FaArrowLeft, FaThermometerHalf,
  FaUser, FaEuroSign, FaChartLine, FaLayerGroup, FaUsers,
  FaInfoCircle
} from 'react-icons/fa';
import { clubAPI } from '../services/api';
import '../styles/template-style.css';

const DEFAULT_CONFIG = {
  weight_profile: 15,
  weight_deal: 25,
  weight_engagement: 25,
  weight_pipeline: 25,
  weight_contacts: 10,
  threshold_cold: 33,
  threshold_warm: 66
};

const CATEGORY_INFO = {
  profile: {
    icon: <FaUser />,
    label: 'Profilo Completo',
    description: 'Completezza dei dati aziendali: email, telefono, P.IVA, sito web, referente, social media',
    color: '#6366F1',
    bgColor: '#EEF2FF'
  },
  deal: {
    icon: <FaEuroSign />,
    label: 'Potenziale Deal',
    description: 'Valore stimato della trattativa e probabilita di chiusura',
    color: '#10B981',
    bgColor: '#ECFDF5'
  },
  engagement: {
    icon: <FaChartLine />,
    label: 'Engagement',
    description: 'Numero di attivita registrate e recenza dell\'ultimo contatto',
    color: '#F59E0B',
    bgColor: '#FFFBEB'
  },
  pipeline: {
    icon: <FaLayerGroup />,
    label: 'Pipeline',
    description: 'Fase corrente nella pipeline: piu avanzata = punteggio piu alto',
    color: '#8B5CF6',
    bgColor: '#F5F3FF'
  },
  contacts: {
    icon: <FaUsers />,
    label: 'Contatti',
    description: 'Numero di persone di contatto associate al lead',
    color: '#EC4899',
    bgColor: '#FDF2F8'
  }
};

function LeadScoreConfig() {
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [originalConfig, setOriginalConfig] = useState({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [config, originalConfig]);

  const fetchConfig = async () => {
    try {
      const response = await clubAPI.getLeadScoreConfig();
      const data = response.data;
      setConfig(data);
      setOriginalConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
      setToast({ type: 'error', message: 'Errore nel caricamento della configurazione' });
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.min(100, Math.max(0, numValue));
    setConfig(prev => ({ ...prev, [key]: clampedValue }));
  };

  const handleThresholdChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.min(99, Math.max(1, numValue));
    setConfig(prev => ({ ...prev, [key]: clampedValue }));
  };

  const getTotalWeight = () => {
    return config.weight_profile + config.weight_deal + config.weight_engagement +
           config.weight_pipeline + config.weight_contacts;
  };

  const isValidConfig = () => {
    const totalWeight = getTotalWeight();
    const validThresholds = config.threshold_cold < config.threshold_warm;
    return totalWeight === 100 && validThresholds;
  };

  const handleSave = async () => {
    if (!isValidConfig()) {
      if (getTotalWeight() !== 100) {
        setToast({ type: 'error', message: `I pesi devono sommare a 100 (attualmente: ${getTotalWeight()})` });
      } else {
        setToast({ type: 'error', message: 'La soglia "Freddo" deve essere minore di "Tiepido"' });
      }
      return;
    }

    setSaving(true);
    try {
      await clubAPI.updateLeadScoreConfig(config);
      setOriginalConfig({ ...config });
      setToast({ type: 'success', message: 'Configurazione salvata con successo!' });
    } catch (error) {
      console.error('Error saving config:', error);
      setToast({ type: 'error', message: error.response?.data?.error || 'Errore nel salvataggio' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const response = await clubAPI.resetLeadScoreConfig();
      const data = response.data.config;
      setConfig(data);
      setOriginalConfig(data);
      setShowResetModal(false);
      setToast({ type: 'success', message: 'Configurazione resettata ai valori default' });
    } catch (error) {
      console.error('Error resetting config:', error);
      setToast({ type: 'error', message: 'Errore nel reset della configurazione' });
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = getTotalWeight();

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento configurazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="tp-btn-icon"
              onClick={() => navigate('/club/leads')}
              style={{ background: 'var(--tp-gray-100)', color: 'var(--tp-gray-600)' }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="tp-page-title">
                Configurazione Lead Score
              </h1>
              <p className="tp-page-subtitle">Personalizza i pesi dell'algoritmo di scoring per il tuo club</p>
            </div>
          </div>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => setShowResetModal(true)}
            disabled={saving}
          >
            <FaUndo /> Reset Default
          </button>
          <button
            className={`tp-btn ${hasChanges && isValidConfig() ? 'tp-btn-success' : 'tp-btn-outline'}`}
            onClick={handleSave}
            disabled={saving || !hasChanges || !isValidConfig()}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            <FaSave /> {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Weights Section */}
        <div className="tp-card">
          <div className="tp-card-header">
            <div className="tp-card-header-left">
              <h2 className="tp-card-title">Pesi Categorie</h2>
            </div>
            <div className="tp-card-header-right">
              <span style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                background: totalWeight === 100 ? 'var(--tp-success-100)' : 'var(--tp-danger-100)',
                color: totalWeight === 100 ? 'var(--tp-success-700)' : 'var(--tp-danger-600)'
              }}>
                Totale: {totalWeight}/100
              </span>
            </div>
          </div>
          <div className="tp-card-body">
            <p style={{ color: 'var(--tp-gray-500)', fontSize: '14px', marginBottom: '24px', marginTop: 0 }}>
              Distribuisci i 100 punti tra le categorie in base all'importanza per il tuo business.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                const weightKey = `weight_${key}`;
                const value = config[weightKey];

                return (
                  <div key={key} className="tp-card" style={{ border: '1px solid var(--tp-gray-200)', boxShadow: 'none' }}>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: info.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: info.color,
                          fontSize: '18px',
                          flexShrink: 0
                        }}>
                          {info.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--tp-black)' }}>{info.label}</div>
                          <div style={{ color: 'var(--tp-gray-500)', fontSize: '13px' }}>{info.description}</div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'var(--tp-gray-50)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--tp-gray-200)'
                        }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e) => handleWeightChange(weightKey, e.target.value)}
                            style={{
                              width: '48px',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '16px',
                              fontWeight: '600',
                              textAlign: 'center',
                              outline: 'none',
                              color: 'var(--tp-black)'
                            }}
                          />
                          <span style={{ color: 'var(--tp-gray-500)', fontWeight: '500', fontSize: '14px' }}>%</span>
                        </div>
                      </div>

                      {/* Slider */}
                      <div style={{ position: 'relative', paddingTop: '4px' }}>
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: 0,
                          height: '8px',
                          width: `${value}%`,
                          background: info.color,
                          borderRadius: '4px',
                          transition: 'width 0.2s ease',
                          pointerEvents: 'none'
                        }} />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => handleWeightChange(weightKey, e.target.value)}
                          className="tp-range-slider"
                          style={{
                            width: '100%',
                            height: '8px',
                            borderRadius: '4px',
                            background: 'var(--tp-gray-200)',
                            appearance: 'none',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Temperature Thresholds Section */}
        <div className="tp-card">
          <div className="tp-card-header">
            <div className="tp-card-header-left">
              <h2 className="tp-card-title">
                <FaThermometerHalf style={{ marginRight: '8px', color: '#F59E0B' }} />
                Soglie Temperatura
              </h2>
            </div>
          </div>
          <div className="tp-card-body">
            <p style={{ color: 'var(--tp-gray-500)', fontSize: '14px', marginBottom: '24px', marginTop: 0 }}>
              Definisci le soglie per classificare i lead come Freddo, Tiepido o Caldo.
            </p>

            {/* Temperature Bar Visualization */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                display: 'flex',
                height: '48px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--tp-shadow)'
              }}>
                <div style={{
                  width: `${config.threshold_cold}%`,
                  background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'width 0.3s ease'
                }}>
                  {config.threshold_cold >= 15 && 'Freddo'}
                </div>
                <div style={{
                  width: `${config.threshold_warm - config.threshold_cold}%`,
                  background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'width 0.3s ease'
                }}>
                  {(config.threshold_warm - config.threshold_cold) >= 15 && 'Tiepido'}
                </div>
                <div style={{
                  width: `${100 - config.threshold_warm}%`,
                  background: 'linear-gradient(135deg, #10B981, #34D399)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'width 0.3s ease'
                }}>
                  {(100 - config.threshold_warm) >= 15 && 'Caldo'}
                </div>
              </div>

              {/* Scale */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '12px',
                color: 'var(--tp-gray-500)',
                padding: '0 4px'
              }}>
                <span>0</span>
                <span style={{
                  position: 'absolute',
                  left: `calc(${config.threshold_cold}% - 10px)`,
                  marginTop: '0'
                }}>
                  {config.threshold_cold}
                </span>
                <span style={{
                  position: 'absolute',
                  left: `calc(${config.threshold_warm}% - 10px)`,
                  marginTop: '0'
                }}>
                  {config.threshold_warm}
                </span>
                <span>100</span>
              </div>
            </div>

            {/* Threshold Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="tp-card" style={{
                border: '1px solid #BFDBFE',
                background: '#EFF6FF',
                boxShadow: 'none'
              }}>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#3B82F6'
                    }}></div>
                    <span style={{ fontWeight: '600', color: 'var(--tp-black)' }}>Soglia Freddo</span>
                  </div>
                  <p style={{ color: 'var(--tp-gray-600)', fontSize: '13px', marginBottom: '16px', marginTop: 0 }}>
                    Score da 0 a questa soglia = Lead FREDDO
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="number"
                      min="1"
                      max="98"
                      value={config.threshold_cold}
                      onChange={(e) => handleThresholdChange('threshold_cold', e.target.value)}
                      style={{
                        width: '70px',
                        padding: '10px',
                        border: '1px solid #BFDBFE',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'center',
                        background: 'white'
                      }}
                    />
                    <input
                      type="range"
                      min="1"
                      max={config.threshold_warm - 1}
                      value={config.threshold_cold}
                      onChange={(e) => handleThresholdChange('threshold_cold', e.target.value)}
                      className="tp-range-slider"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div className="tp-card" style={{
                border: '1px solid #FDE68A',
                background: '#FFFBEB',
                boxShadow: 'none'
              }}>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#F59E0B'
                    }}></div>
                    <span style={{ fontWeight: '600', color: 'var(--tp-black)' }}>Soglia Tiepido</span>
                  </div>
                  <p style={{ color: 'var(--tp-gray-600)', fontSize: '13px', marginBottom: '16px', marginTop: 0 }}>
                    Score da {config.threshold_cold + 1} a questa soglia = Lead TIEPIDO
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="number"
                      min={config.threshold_cold + 1}
                      max="99"
                      value={config.threshold_warm}
                      onChange={(e) => handleThresholdChange('threshold_warm', e.target.value)}
                      style={{
                        width: '70px',
                        padding: '10px',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'center',
                        background: 'white'
                      }}
                    />
                    <input
                      type="range"
                      min={config.threshold_cold + 1}
                      max="99"
                      value={config.threshold_warm}
                      onChange={(e) => handleThresholdChange('threshold_warm', e.target.value)}
                      className="tp-range-slider"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div style={{
              marginTop: '24px',
              padding: '16px 20px',
              background: 'var(--tp-success-50)',
              borderRadius: '12px',
              border: '1px solid var(--tp-success-200)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <FaInfoCircle style={{ color: 'var(--tp-success-600)', fontSize: '18px', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '14px', color: 'var(--tp-success-700)' }}>
                <strong>Lead CALDO:</strong> Score da {config.threshold_warm + 1} a 100.
                I lead con punteggio superiore alla soglia Tiepido sono considerati "caldi" e pronti per la chiusura.
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="tp-card">
          <div className="tp-card-header">
            <div className="tp-card-header-left">
              <h2 className="tp-card-title">Anteprima Algoritmo</h2>
            </div>
          </div>
          <div className="tp-card-body">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                const weightKey = `weight_${key}`;
                const value = config[weightKey];

                return (
                  <div key={key} style={{
                    textAlign: 'center',
                    padding: '20px 12px',
                    background: info.bgColor,
                    borderRadius: '12px',
                    border: `1px solid ${info.color}30`
                  }}>
                    <div style={{ color: info.color, fontSize: '24px', marginBottom: '8px' }}>
                      {info.icon}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: info.color }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--tp-gray-500)', marginTop: '4px' }}>
                      punti max
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{
              color: 'var(--tp-gray-500)',
              fontSize: '14px',
              textAlign: 'center',
              margin: 0
            }}>
              Un lead con tutti i criteri al massimo otterra uno score di <strong>100</strong> punti
            </p>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Conferma Reset"
      >
        <p style={{ marginBottom: '24px', color: 'var(--tp-gray-600)' }}>
          Sei sicuro di voler ripristinare i valori di default?
          Questa azione non puo essere annullata.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => setShowResetModal(false)}
          >
            Annulla
          </button>
          <button
            className="tp-btn tp-btn-danger"
            onClick={handleReset}
            disabled={saving}
          >
            {saving ? 'Reset in corso...' : 'Conferma Reset'}
          </button>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        .tp-range-slider {
          -webkit-appearance: none;
          height: 8px;
          border-radius: 4px;
          background: var(--tp-gray-200);
          outline: none;
        }

        .tp-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--tp-dark);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.15s ease;
        }

        .tp-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .tp-range-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--tp-dark);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .tp-card-body > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .tp-card-body > div:last-child > div:last-child {
            grid-column: span 2;
          }
        }

        @media (max-width: 480px) {
          .tp-card-body > div:last-child {
            grid-template-columns: 1fr !important;
          }
          .tp-card-body > div:last-child > div:last-child {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}

export default LeadScoreConfig;
