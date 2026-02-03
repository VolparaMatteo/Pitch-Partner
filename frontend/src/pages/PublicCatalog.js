import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import DefaultAsset from '../static/logo/FavIcon.png';
import { DEFAULT_GLOBAL_STYLES } from '../components/catalog/templates';
import AreaRenderer from '../components/catalog/AreaRenderer';
import {
  FaEnvelope, FaPhone, FaGlobe,
  FaTimes
} from 'react-icons/fa';

// Default layout when no layout_json is present (version 2.0 format)
const DEFAULT_LAYOUT = {
  version: '2.0',
  areas: [
    {
      id: 'header-default',
      settings: {
        background: {
          type: 'gradient',
          gradient: { from: '#1A1A1A', to: '#2D2D2D', direction: '135deg' }
        },
        padding: { top: 80, bottom: 80, left: 24, right: 24 },
        textColor: '#FFFFFF',
        maxWidth: 1200
      },
      components: [
        { id: 'heading-default', type: 'heading', settings: { text: 'Catalogo', fontSize: 48, alignment: 'center', color: '#FFFFFF' } },
        { id: 'paragraph-default', type: 'paragraph', settings: { text: 'Scopri le nostre opportunità', fontSize: 18, alignment: 'center', color: '#9CA3AF' } }
      ]
    },
    {
      id: 'assets-default',
      settings: {
        background: { type: 'color', color: '#FFFFFF' },
        padding: { top: 60, bottom: 60, left: 24, right: 24 },
        textColor: '#1A1A1A',
        maxWidth: 1200
      },
      components: [
        { id: 'assets-grid-default', type: 'asset-grid', settings: { columns: 3, showFilters: true, cardStyle: 'modern' } }
      ]
    },
    {
      id: 'footer-default',
      settings: {
        background: { type: 'color', color: '#1A1A1A' },
        padding: { top: 40, bottom: 40, left: 24, right: 24 },
        textColor: '#FFFFFF',
        maxWidth: 1200
      },
      components: [
        { id: 'paragraph-footer', type: 'paragraph', settings: { text: 'Powered by PitchPartner', fontSize: 12, alignment: 'center', color: '#6B7280' } }
      ]
    }
  ],
  globalStyles: DEFAULT_GLOBAL_STYLES
};

function PublicCatalog() {
  const { token } = useParams();
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    fetchCatalog();
  }, [token]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getCatalog(token);
      const catalogData = response.data.catalog;
      setCatalog(catalogData);

      // Parse layout_json if exists
      if (catalogData.layout_json) {
        try {
          const layoutData = typeof catalogData.layout_json === 'string'
            ? JSON.parse(catalogData.layout_json)
            : catalogData.layout_json;

          // Check if it's version 2.0 (area/component based)
          if (layoutData.version === '2.0' && layoutData.areas) {
            setLayout(layoutData);
          } else if (layoutData.sections) {
            // Old section-based layout - convert or use default
            // For now, use default layout for old formats
            setLayout(DEFAULT_LAYOUT);
          } else {
            setLayout(DEFAULT_LAYOUT);
          }
        } catch (e) {
          console.error('Error parsing layout_json:', e);
          setLayout(DEFAULT_LAYOUT);
        }
      } else {
        setLayout(DEFAULT_LAYOUT);
      }
    } catch (error) {
      console.error('Errore:', error);
      if (error.response?.status === 404) {
        setError('Catalogo non trovato');
      } else if (error.response?.status === 403) {
        setError(error.response.data.error || 'Catalogo non disponibile');
      } else {
        setError('Errore durante il caricamento del catalogo');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get global styles with fallbacks
  const globalStyles = layout?.globalStyles || DEFAULT_GLOBAL_STYLES;
  const colors = globalStyles?.colors || DEFAULT_GLOBAL_STYLES.colors;
  const secondaryColor = colors.accent || colors.secondary || '#85FF00';

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.background || '#0A0A0A',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            width: '50px',
            height: '50px',
            border: `3px solid ${secondaryColor}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Caricamento catalogo...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0A',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <FaTimes style={{ fontSize: '64px', color: '#EF4444', marginBottom: '20px' }} />
          <h2 style={{ marginBottom: '12px' }}>{error}</h2>
          <p style={{ color: '#9CA3AF' }}>
            Il catalogo potrebbe essere stato rimosso o disattivato.
          </p>
        </div>
      </div>
    );
  }

  const areas = layout?.areas || DEFAULT_LAYOUT.areas;

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background || '#FFFFFF',
      color: colors.text || '#1A1A1A',
      fontFamily: `'${globalStyles?.fonts?.body || 'Inter'}', -apple-system, BlinkMacSystemFont, sans-serif`
    }}>
      {/* Render areas dynamically */}
      {areas.map((area) => (
        <AreaRenderer
          key={area.id}
          area={area}
          globalStyles={globalStyles}
          assets={catalog?.assets || []}
          onAssetClick={setSelectedAsset}
          isPreview={false}
        />
      ))}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div
          onClick={() => setSelectedAsset(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111',
              borderRadius: globalStyles?.borderRadius || 20,
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #333'
            }}
          >
            {/* Modal Image */}
            <div style={{
              height: '300px',
              background: '#1A1A1A',
              position: 'relative'
            }}>
              <img
                src={selectedAsset.immagine_principale ? getImageUrl(selectedAsset.immagine_principale) : DefaultAsset}
                alt={selectedAsset.nome}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <button
                onClick={() => setSelectedAsset(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '32px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '8px',
                fontFamily: globalStyles?.fonts?.heading || 'Montserrat',
                color: '#FFFFFF'
              }}>
                {selectedAsset.nome}
              </h2>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '6px 14px',
                  background: '#222',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: '#D1D5DB'
                }}>
                  {selectedAsset.category_name || 'Altro'}
                </span>
                <span style={{
                  padding: '6px 14px',
                  background: '#222',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: '#D1D5DB',
                  textTransform: 'capitalize'
                }}>
                  {selectedAsset.tipo}
                </span>
                {catalog?.mostra_disponibilita && (
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    background: selectedAsset.disponibile ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: selectedAsset.disponibile ? '#10B981' : '#EF4444'
                  }}>
                    {selectedAsset.disponibile ? 'Disponibile' : 'Non disponibile'}
                  </span>
                )}
              </div>

              {selectedAsset.descrizione && (
                <p style={{
                  fontSize: '16px',
                  color: '#D1D5DB',
                  lineHeight: 1.7,
                  marginBottom: '24px',
                  fontFamily: globalStyles?.fonts?.body || 'Inter'
                }}>
                  {selectedAsset.descrizione}
                </p>
              )}

              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {selectedAsset.posizione && (
                  <div>
                    <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}>
                      Posizione
                    </div>
                    <div style={{ fontSize: '14px', color: '#FFFFFF' }}>
                      {selectedAsset.posizione}
                    </div>
                  </div>
                )}
                {selectedAsset.dimensioni && (
                  <div>
                    <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}>
                      Dimensioni
                    </div>
                    <div style={{ fontSize: '14px', color: '#FFFFFF' }}>
                      {selectedAsset.dimensioni}
                    </div>
                  </div>
                )}
                {catalog?.mostra_disponibilita && selectedAsset.quantita_disponibile > 0 && (
                  <div>
                    <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}>
                      Quantità Disponibile
                    </div>
                    <div style={{ fontSize: '14px', color: '#FFFFFF' }}>
                      {selectedAsset.quantita_disponibile}
                    </div>
                  </div>
                )}
              </div>

              {/* Price */}
              {catalog?.mostra_prezzi && selectedAsset.prezzo_listino && (
                <div style={{
                  padding: '20px',
                  background: '#1A1A1A',
                  borderRadius: globalStyles?.borderRadius || 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#9CA3AF' }}>Prezzo di listino</span>
                  <span style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: secondaryColor
                  }}>
                    {selectedAsset.valuta || 'EUR'} {selectedAsset.prezzo_listino.toLocaleString('it-IT')}
                  </span>
                </div>
              )}

              {/* Contact CTA */}
              {(catalog?.email_contatto || catalog?.telefono_contatto) && (
                <div style={{
                  marginTop: '24px',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  {catalog?.email_contatto && (
                    <a
                      href={`mailto:${catalog.email_contatto}?subject=Richiesta informazioni: ${selectedAsset.nome}`}
                      style={{
                        padding: '14px 28px',
                        borderRadius: globalStyles?.borderRadius || 8,
                        background: secondaryColor,
                        color: colors.primary || '#000',
                        textDecoration: 'none',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: globalStyles?.fonts?.body || 'Inter'
                      }}
                    >
                      <FaEnvelope />
                      Richiedi Informazioni
                    </a>
                  )}
                  {catalog?.telefono_contatto && (
                    <a
                      href={`tel:${catalog.telefono_contatto}`}
                      style={{
                        padding: '14px 28px',
                        borderRadius: globalStyles?.borderRadius || 8,
                        background: 'transparent',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: '1px solid #444',
                        fontFamily: globalStyles?.fonts?.body || 'Inter'
                      }}
                    >
                      <FaPhone />
                      Chiama
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * {
          box-sizing: border-box;
        }
        input:focus {
          outline: none;
          border-color: ${secondaryColor};
        }
        a:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

export default PublicCatalog;
