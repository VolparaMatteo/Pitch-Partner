import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaRoute, FaBook, FaHeadset, FaBoxOpen, FaChevronRight } from 'react-icons/fa';
import PitchAvatar from '../static/logo/FavIcon.png';

function SupportWidget({ pageTitle, pageDescription, pageIcon, docsSection, onStartTour, onOpenDocs, onContactSupport }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleStartTour = () => {
    setIsOpen(false);
    if (onStartTour) {
      setTimeout(() => onStartTour(), 300);
    }
  };

  const handleOpenDocs = () => {
    setIsOpen(false);
    if (onOpenDocs) {
      onOpenDocs();
    } else {
      // Navigate to docs page, optionally with a section hash
      const docsUrl = docsSection ? `/docs#${docsSection}` : '/docs#inventory-catalog';
      navigate(docsUrl);
    }
  };

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    }
  };

  const PageIcon = pageIcon || FaBoxOpen;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1A1A1A, #2D2D2D)',
          border: '3px solid #85FF00',
          boxShadow: '0 4px 20px rgba(133, 255, 0, 0.3), 0 8px 32px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'all 0.3s ease',
          transform: isOpen ? 'scale(0.9) rotate(90deg)' : 'scale(1)',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? 'scale(0.95) rotate(90deg)' : 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(133, 255, 0, 0.4), 0 12px 40px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'scale(0.9) rotate(90deg)' : 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(133, 255, 0, 0.3), 0 8px 32px rgba(0,0,0,0.3)';
        }}
      >
        {isOpen ? (
          <FaTimes size={24} color="#85FF00" />
        ) : (
          <img
            src={PitchAvatar}
            alt="Support"
            style={{
              width: '36px',
              height: '36px',
              filter: 'invert(1) brightness(2)'
            }}
          />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9997,
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      {/* Help Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '380px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 60px rgba(0,0,0,0.2)',
            zIndex: 9998,
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1A1A1A, #2D2D2D)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={PitchAvatar}
                alt="Pitch Partner"
                style={{ width: '32px', height: '32px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'white' }}>
                Pitch Partner
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Centro Assistenza
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <FaTimes size={16} color="white" />
            </button>
          </div>

          {/* Page Info */}
          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FaBoxOpen size={20} color="#6366F1" />
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  marginBottom: '4px'
                }}>
                  Ti trovi nella pagina
                </div>
                <div style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  lineHeight: '1.3'
                }}>
                  {pageTitle || 'Gestione Inventario Asset'}
                </div>
              </div>
            </div>

            <div style={{
              background: '#F9FAFB',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#4B5563'
            }}>
              {pageDescription || 'Qui puoi gestire tutti gli asset del tuo inventario: visualizzarli, filtrarli per categoria, tipo o disponibilità, e accedere rapidamente alle azioni di modifica, archiviazione o eliminazione. Usa i filtri in alto per trovare velocemente ciò che cerchi.'}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: '#E5E7EB',
            margin: '0 24px'
          }} />

          {/* Help Options */}
          <div style={{ padding: '24px' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '16px'
            }}>
              Hai bisogno?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Tour Guidato */}
              <button
                onClick={handleStartTour}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  background: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#85FF00';
                  e.currentTarget.style.background = 'rgba(133, 255, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FaRoute size={18} color="#059669" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>
                    Tour Guidato
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    Scopri le funzionalità passo dopo passo
                  </div>
                </div>
                <FaChevronRight size={14} color="#9CA3AF" />
              </button>

              {/* Documentazione */}
              <button
                onClick={handleOpenDocs}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  background: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#85FF00';
                  e.currentTarget.style.background = 'rgba(133, 255, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FaBook size={18} color="#6366F1" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>
                    Documentazione Ufficiale
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    Guide e manuali dettagliati
                  </div>
                </div>
                <FaChevronRight size={14} color="#9CA3AF" />
              </button>

              {/* Assistenza */}
              <button
                onClick={handleContactSupport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  background: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#85FF00';
                  e.currentTarget.style.background = 'rgba(133, 255, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FaHeadset size={18} color="#D97706" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>
                    Hai Bisogno di Assistenza?
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    Contatta il nostro team di supporto
                  </div>
                </div>
                <FaChevronRight size={14} color="#9CA3AF" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export default SupportWidget;
