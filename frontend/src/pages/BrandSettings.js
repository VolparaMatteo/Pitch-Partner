import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import {
  FaSave, FaArrowLeft, FaPalette, FaFont, FaImage,
  FaEye, FaUndo
} from 'react-icons/fa';
import { clubAPI, uploadAPI } from '../services/api';
import '../styles/template-style.css';

const DEFAULT_BRAND = {
  colore_primario: '#1A1A1A',
  colore_secondario: '#85FF00',
  colore_accento: '#3B82F6',
  font: 'Inter',
  stile_proposta: 'modern',
  logo_chiaro: '',
  sfondo_header: '',
  footer_text: ''
};

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', style: "'Inter', sans-serif" },
  { value: 'Poppins', label: 'Poppins', style: "'Poppins', sans-serif" },
  { value: 'Montserrat', label: 'Montserrat', style: "'Montserrat', sans-serif" },
  { value: 'Roboto', label: 'Roboto', style: "'Roboto', sans-serif" },
  { value: 'Open Sans', label: 'Open Sans', style: "'Open Sans', sans-serif" },
  { value: 'Playfair Display', label: 'Playfair Display', style: "'Playfair Display', serif" },
  { value: 'Oswald', label: 'Oswald', style: "'Oswald', sans-serif" }
];

const STYLE_OPTIONS = [
  { value: 'modern', label: 'Moderno', description: 'Design pulito con gradiente scuro' },
  { value: 'classic', label: 'Classico', description: 'Stile tradizionale elegante' },
  { value: 'minimal', label: 'Minimale', description: 'Essenziale e pulito' }
];

function BrandSettings() {
  const [brand, setBrand] = useState({ ...DEFAULT_BRAND });
  const [originalBrand, setOriginalBrand] = useState({ ...DEFAULT_BRAND });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, header: false });

  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchBrandSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(brand) !== JSON.stringify(originalBrand);
    setHasChanges(changed);
  }, [brand, originalBrand]);

  const fetchBrandSettings = async () => {
    try {
      const response = await clubAPI.getBrandSettings();
      const data = response.data;
      setBrand(data);
      setOriginalBrand(data);
    } catch (error) {
      console.error('Error fetching brand settings:', error);
      setToast({ type: 'error', message: 'Errore nel caricamento delle impostazioni' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setBrand(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (type, file) => {
    if (!file) return;

    const key = type === 'logo' ? 'logo_chiaro' : 'sfondo_header';
    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const response = await uploadAPI.uploadLogo(file);
      handleChange(key, response.data.url);
      setToast({ type: 'success', message: 'Immagine caricata con successo' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setToast({ type: 'error', message: 'Errore nel caricamento dell\'immagine' });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await clubAPI.updateBrandSettings(brand);
      setOriginalBrand({ ...brand });
      setToast({ type: 'success', message: 'Impostazioni brand salvate con successo!' });
    } catch (error) {
      console.error('Error saving brand settings:', error);
      setToast({ type: 'error', message: error.response?.data?.error || 'Errore nel salvataggio' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBrand({ ...DEFAULT_BRAND });
  };

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento impostazioni brand...</p>
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
              onClick={() => navigate(-1)}
              style={{ background: 'var(--tp-gray-100)', color: 'var(--tp-gray-600)' }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="tp-page-title">
                <FaPalette style={{ marginRight: '12px', color: brand.colore_primario }} />
                Personalizza Brand
              </h1>
              <p className="tp-page-subtitle">Configura l'aspetto delle tue proposte commerciali pubbliche</p>
            </div>
          </div>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-outline"
            onClick={handleReset}
            disabled={saving}
          >
            <FaUndo /> Reset
          </button>
          <button
            className={`tp-btn ${hasChanges ? 'tp-btn-success' : 'tp-btn-outline'}`}
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            <FaSave /> {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column - Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Colors Section */}
          <div className="tp-card">
            <div className="tp-card-header">
              <div className="tp-card-header-left">
                <h2 className="tp-card-title">
                  <FaPalette style={{ marginRight: '8px', color: '#8B5CF6' }} />
                  Colori
                </h2>
              </div>
            </div>
            <div className="tp-card-body">
              <p style={{ color: 'var(--tp-gray-500)', fontSize: '14px', marginBottom: '24px', marginTop: 0 }}>
                Scegli i colori che rappresentano il tuo club nelle proposte pubbliche.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {/* Primary Color */}
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    Colore Primario
                  </label>
                  <p style={{ color: 'var(--tp-gray-500)', fontSize: '12px', marginBottom: '12px', marginTop: 0 }}>
                    Header e sfondo principale
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={brand.colore_primario}
                      onChange={(e) => handleChange('colore_primario', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    />
                    <input
                      type="text"
                      value={brand.colore_primario}
                      onChange={(e) => handleChange('colore_primario', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid var(--tp-gray-200)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    Colore Secondario
                  </label>
                  <p style={{ color: 'var(--tp-gray-500)', fontSize: '12px', marginBottom: '12px', marginTop: 0 }}>
                    Accenti e call-to-action
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={brand.colore_secondario}
                      onChange={(e) => handleChange('colore_secondario', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    />
                    <input
                      type="text"
                      value={brand.colore_secondario}
                      onChange={(e) => handleChange('colore_secondario', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid var(--tp-gray-200)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    Colore Accento
                  </label>
                  <p style={{ color: 'var(--tp-gray-500)', fontSize: '12px', marginBottom: '12px', marginTop: 0 }}>
                    Link e elementi interattivi
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={brand.colore_accento}
                      onChange={(e) => handleChange('colore_accento', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    />
                    <input
                      type="text"
                      value={brand.colore_accento}
                      onChange={(e) => handleChange('colore_accento', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid var(--tp-gray-200)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Section */}
          <div className="tp-card">
            <div className="tp-card-header">
              <div className="tp-card-header-left">
                <h2 className="tp-card-title">
                  <FaFont style={{ marginRight: '8px', color: '#10B981' }} />
                  Tipografia
                </h2>
              </div>
            </div>
            <div className="tp-card-body">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                Font Principale
              </label>
              <p style={{ color: 'var(--tp-gray-500)', fontSize: '13px', marginBottom: '16px', marginTop: 0 }}>
                Il font usato in tutta la proposta commerciale
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {FONT_OPTIONS.map(font => (
                  <button
                    key={font.value}
                    onClick={() => handleChange('font', font.value)}
                    style={{
                      padding: '16px',
                      border: brand.font === font.value ? '2px solid var(--tp-dark)' : '1px solid var(--tp-gray-200)',
                      borderRadius: '12px',
                      background: brand.font === font.value ? 'var(--tp-gray-50)' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{
                      fontFamily: font.style,
                      fontSize: '18px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '4px',
                      color: 'var(--tp-black)'
                    }}>
                      Aa
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--tp-gray-500)' }}>
                      {font.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="tp-card">
            <div className="tp-card-header">
              <div className="tp-card-header-left">
                <h2 className="tp-card-title">
                  <FaImage style={{ marginRight: '8px', color: '#F59E0B' }} />
                  Immagini
                </h2>
              </div>
            </div>
            <div className="tp-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Light Logo */}
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    Logo Chiaro (per header scuro)
                  </label>
                  <p style={{ color: 'var(--tp-gray-500)', fontSize: '12px', marginBottom: '12px', marginTop: 0 }}>
                    Versione chiara del logo per lo sfondo scuro
                  </p>

                  {brand.logo_chiaro ? (
                    <div style={{
                      position: 'relative',
                      background: '#1A1A1A',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center'
                    }}>
                      <img
                        src={brand.logo_chiaro}
                        alt="Logo chiaro"
                        style={{ maxHeight: '60px', maxWidth: '100%' }}
                      />
                      <button
                        onClick={() => handleChange('logo_chiaro', '')}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '32px',
                      border: '2px dashed var(--tp-gray-300)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: 'var(--tp-gray-50)',
                      transition: 'all 0.2s ease'
                    }}>
                      <FaImage style={{ fontSize: '24px', color: 'var(--tp-gray-400)', marginBottom: '8px' }} />
                      <span style={{ fontSize: '13px', color: 'var(--tp-gray-500)' }}>
                        {uploading.logo ? 'Caricamento...' : 'Clicca per caricare'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('logo', e.target.files[0])}
                        style={{ display: 'none' }}
                        disabled={uploading.logo}
                      />
                    </label>
                  )}
                </div>

                {/* Header Background */}
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    Sfondo Header
                  </label>
                  <p style={{ color: 'var(--tp-gray-500)', fontSize: '12px', marginBottom: '12px', marginTop: 0 }}>
                    Immagine di sfondo per l'header (opzionale)
                  </p>

                  {brand.sfondo_header ? (
                    <div style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      height: '108px'
                    }}>
                      <img
                        src={brand.sfondo_header}
                        alt="Sfondo header"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.7))'
                      }} />
                      <button
                        onClick={() => handleChange('sfondo_header', '')}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '32px',
                      border: '2px dashed var(--tp-gray-300)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: 'var(--tp-gray-50)',
                      transition: 'all 0.2s ease'
                    }}>
                      <FaImage style={{ fontSize: '24px', color: 'var(--tp-gray-400)', marginBottom: '8px' }} />
                      <span style={{ fontSize: '13px', color: 'var(--tp-gray-500)' }}>
                        {uploading.header ? 'Caricamento...' : 'Clicca per caricare'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('header', e.target.files[0])}
                        style={{ display: 'none' }}
                        disabled={uploading.header}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text Section */}
          <div className="tp-card">
            <div className="tp-card-header">
              <div className="tp-card-header-left">
                <h2 className="tp-card-title">Testo Footer</h2>
              </div>
            </div>
            <div className="tp-card-body">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                Messaggio Personalizzato
              </label>
              <p style={{ color: 'var(--tp-gray-500)', fontSize: '13px', marginBottom: '12px', marginTop: 0 }}>
                Testo mostrato nel footer della proposta (es. disclaimer, copyright, etc.)
              </p>
              <textarea
                value={brand.footer_text}
                onChange={(e) => handleChange('footer_text', e.target.value)}
                placeholder="Documento generato automaticamente. Tutti i diritti riservati."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--tp-gray-200)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div className="tp-card">
            <div className="tp-card-header">
              <div className="tp-card-header-left">
                <h2 className="tp-card-title">
                  <FaEye style={{ marginRight: '8px', color: 'var(--tp-gray-500)' }} />
                  Anteprima
                </h2>
              </div>
            </div>
            <div className="tp-card-body" style={{ padding: 0 }}>
              {/* Mini Preview */}
              <div style={{
                background: brand.sfondo_header
                  ? `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(${brand.sfondo_header}) center/cover`
                  : `linear-gradient(135deg, ${brand.colore_primario} 0%, #000 100%)`,
                padding: '32px 24px',
                borderRadius: '12px 12px 0 0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  {brand.logo_chiaro && (
                    <img
                      src={brand.logo_chiaro}
                      alt="Logo"
                      style={{ height: '32px', width: 'auto' }}
                    />
                  )}
                  <div>
                    <p style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '10px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      marginBottom: '2px'
                    }}>Proposta Commerciale</p>
                    <p style={{
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: `'${brand.font}', sans-serif`
                    }}>Il Tuo Club</p>
                  </div>
                </div>

                <h3 style={{
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '800',
                  fontFamily: `'${brand.font}', sans-serif`,
                  marginBottom: '8px'
                }}>
                  Titolo Proposta
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '13px',
                  fontFamily: `'${brand.font}', sans-serif`
                }}>
                  Sottotitolo della proposta commerciale
                </p>
              </div>

              {/* Content Preview */}
              <div style={{ padding: '24px', background: '#FAFAFA' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <p style={{
                    fontSize: '11px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px'
                  }}>Valore Totale</p>
                  <p style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    color: brand.colore_primario,
                    fontFamily: `'${brand.font}', sans-serif`
                  }}>
                    €25.000
                  </p>
                </div>

                <button style={{
                  width: '100%',
                  padding: '14px',
                  background: brand.colore_secondario,
                  color: brand.colore_primario,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: `'${brand.font}', sans-serif`
                }}>
                  Rispondi alla Proposta
                </button>
              </div>

              {/* Footer Preview */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #E5E7EB',
                textAlign: 'center',
                fontSize: '11px',
                color: '#9CA3AF',
                fontFamily: `'${brand.font}', sans-serif`
              }}>
                {brand.footer_text || 'Documento generato automaticamente. Tutti i diritti riservati.'}
              </div>
            </div>
          </div>

          {/* Color Palette Summary */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: brand.colore_primario,
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }} title="Primario" />
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: brand.colore_secondario,
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }} title="Secondario" />
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: brand.colore_accento,
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }} title="Accento" />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .tp-page-container > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }

        input[type="color"] {
          -webkit-appearance: none;
          border: none;
          padding: 0;
        }

        input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        input[type="color"]::-webkit-color-swatch {
          border: none;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

export default BrandSettings;
