import React from 'react';
import {
  FaHeading, FaTh, FaCaretSquareRight, FaAlignLeft, FaBullhorn,
  FaImages, FaChartBar, FaMinus, FaVideo, FaFootballBall,
  FaQuoteLeft, FaListUl, FaHandshake, FaCrown, FaHistory,
  FaTrophy, FaChartLine, FaClock, FaTable, FaThLarge,
  FaStar, FaLayerGroup, FaQuestionCircle, FaShieldAlt,
  FaSortNumericUp, FaUsers, FaPlayCircle
} from 'react-icons/fa';

// Categorized section types for elite catalog builder
const SECTION_CATEGORIES = {
  base: {
    name: 'Base',
    icon: FaLayerGroup,
    sections: [
      {
        type: 'header',
        name: 'Header',
        icon: FaHeading,
        description: 'Hero con logo e titolo',
        defaultSettings: {
          showLogo: true,
          showClubName: true,
          showWelcomeMessage: true,
          showDescription: true,
          backgroundType: 'gradient',
          alignment: 'left'
        }
      },
      {
        type: 'text',
        name: 'Testo',
        icon: FaAlignLeft,
        description: 'Blocco di testo personalizzabile',
        defaultSettings: {
          content: 'Inserisci il tuo testo qui...',
          alignment: 'left',
          style: 'normal'
        }
      },
      {
        type: 'divider',
        name: 'Separatore',
        icon: FaMinus,
        description: 'Separatore visuale',
        defaultSettings: {
          style: 'line',
          height: 1,
          margin: 40
        }
      },
      {
        type: 'footer',
        name: 'Footer',
        icon: FaFootballBall,
        description: 'Footer con contatti',
        defaultSettings: {
          showContacts: true,
          showSocialLinks: true,
          showWebsite: true,
          showFooterMessage: true,
          showPoweredBy: true
        }
      }
    ]
  },
  assets: {
    name: 'Asset',
    icon: FaTh,
    sections: [
      {
        type: 'asset-grid',
        name: 'Griglia Asset',
        icon: FaTh,
        description: 'Griglia di asset con filtri',
        defaultSettings: {
          layout: 'grid',
          columns: 3,
          showCategory: true,
          showFilters: true,
          cardStyle: 'modern'
        }
      },
      {
        type: 'asset-carousel',
        name: 'Carosello Asset',
        icon: FaCaretSquareRight,
        description: 'Carosello scorrevole di asset',
        defaultSettings: {
          autoPlay: true,
          speed: 5000,
          visibleItems: 3,
          showDots: true,
          showArrows: true
        }
      }
    ]
  },
  media: {
    name: 'Media',
    icon: FaImages,
    sections: [
      {
        type: 'video',
        name: 'Video',
        icon: FaVideo,
        description: 'Video YouTube/Vimeo',
        defaultSettings: {
          url: '',
          aspectRatio: '16:9',
          autoplay: false
        }
      },
      {
        type: 'video-hero',
        name: 'Video Hero',
        icon: FaPlayCircle,
        description: 'Hero con video in background',
        defaultSettings: {
          videoUrl: '',
          overlayColor: 'rgba(0,0,0,0.5)',
          title: 'Titolo Impattante',
          subtitle: 'Sottotitolo descrittivo',
          buttonText: 'Scopri di più',
          alignment: 'center',
          minHeight: '80vh'
        }
      },
      {
        type: 'gallery',
        name: 'Galleria',
        icon: FaImages,
        description: 'Galleria di immagini',
        defaultSettings: {
          images: [],
          layout: 'grid',
          columns: 3,
          enableLightbox: true
        }
      },
      {
        type: 'gallery-masonry',
        name: 'Galleria Masonry',
        icon: FaThLarge,
        description: 'Galleria stile Pinterest',
        defaultSettings: {
          images: [],
          columns: 3,
          gap: 16,
          borderRadius: 12
        }
      }
    ]
  },
  social: {
    name: 'Social Proof',
    icon: FaStar,
    sections: [
      {
        type: 'testimonial',
        name: 'Testimonianza',
        icon: FaQuoteLeft,
        description: 'Citazione con autore',
        defaultSettings: {
          quote: '',
          author: '',
          role: '',
          image: '',
          style: 'modern',
          alignment: 'center'
        }
      },
      {
        type: 'quote-carousel',
        name: 'Carosello Citazioni',
        icon: FaQuoteLeft,
        description: 'Testimonianze multiple rotanti',
        defaultSettings: {
          quotes: [],
          autoPlay: true,
          interval: 5000,
          alignment: 'center'
        }
      },
      {
        type: 'partner-logos',
        name: 'Logo Partner',
        icon: FaHandshake,
        description: 'Griglia loghi sponsor/partner',
        defaultSettings: {
          logos: [],
          columns: 4,
          size: 120,
          grayscale: true,
          title: 'I nostri partner'
        }
      },
      {
        type: 'awards',
        name: 'Trofei & Premi',
        icon: FaTrophy,
        description: 'Riconoscimenti e vittorie',
        defaultSettings: {
          awards: [],
          columns: 4,
          showYear: true,
          alignment: 'center'
        }
      },
      {
        type: 'badge',
        name: 'Badge Fiducia',
        icon: FaShieldAlt,
        description: 'Indicatori di affidabilità',
        defaultSettings: {
          badges: [],
          alignment: 'center',
          size: 'medium'
        }
      }
    ]
  },
  data: {
    name: 'Dati & Metriche',
    icon: FaChartLine,
    sections: [
      {
        type: 'stats',
        name: 'Statistiche',
        icon: FaChartBar,
        description: 'Numeri e statistiche',
        defaultSettings: {
          stats: [],
          layout: 'row',
          showIcons: true
        }
      },
      {
        type: 'number-counter',
        name: 'Contatori',
        icon: FaSortNumericUp,
        description: 'Numeri con animazione',
        defaultSettings: {
          items: [],
          columns: 4,
          prefix: '',
          suffix: '',
          alignment: 'center'
        }
      },
      {
        type: 'metrics-dashboard',
        name: 'Dashboard Metriche',
        icon: FaChartLine,
        description: 'KPI e ROI per sponsor',
        defaultSettings: {
          metrics: [],
          columns: 4,
          style: 'cards',
          alignment: 'center'
        }
      },
      {
        type: 'comparison-table',
        name: 'Tabella Comparativa',
        icon: FaTable,
        description: 'Confronto pacchetti',
        defaultSettings: {
          headers: [],
          rows: [],
          highlightColumn: 1
        }
      },
      {
        type: 'timeline',
        name: 'Timeline',
        icon: FaHistory,
        description: 'Storia e milestones',
        defaultSettings: {
          items: [],
          layout: 'vertical',
          alignment: 'center'
        }
      }
    ]
  },
  conversion: {
    name: 'Conversione',
    icon: FaBullhorn,
    sections: [
      {
        type: 'cta',
        name: 'Call to Action',
        icon: FaBullhorn,
        description: 'Sezione con pulsante CTA',
        defaultSettings: {
          title: { content: 'Interessato?' },
          subtitle: { content: 'Contattaci per maggiori informazioni' },
          buttonText: 'Contattaci',
          showEmail: true,
          showPhone: true,
          backgroundStyle: 'gradient'
        }
      },
      {
        type: 'package-cards',
        name: 'Pacchetti Sponsor',
        icon: FaCrown,
        description: 'Piani e prezzi sponsorship',
        defaultSettings: {
          packages: [],
          columns: 3,
          highlightIndex: 1,
          alignment: 'center'
        }
      },
      {
        type: 'countdown',
        name: 'Countdown',
        icon: FaClock,
        description: 'Timer per offerte limitate',
        defaultSettings: {
          targetDate: '',
          title: 'Offerta limitata',
          alignment: 'center',
          style: 'boxes'
        }
      },
      {
        type: 'highlight-box',
        name: 'Box Evidenziato',
        icon: FaStar,
        description: 'Contenuto in evidenza',
        defaultSettings: {
          title: '',
          content: '',
          icon: '',
          style: 'accent',
          alignment: 'center'
        }
      }
    ]
  },
  info: {
    name: 'Informazioni',
    icon: FaListUl,
    sections: [
      {
        type: 'feature-list',
        name: 'Feature List',
        icon: FaListUl,
        description: 'Lista di caratteristiche',
        defaultSettings: {
          items: [],
          layout: 'grid',
          columns: 3,
          iconColor: '',
          alignment: 'center'
        }
      },
      {
        type: 'icon-grid',
        name: 'Griglia Icone',
        icon: FaThLarge,
        description: 'Feature con icone grandi',
        defaultSettings: {
          items: [],
          columns: 3,
          iconSize: 48,
          alignment: 'center'
        }
      },
      {
        type: 'accordion',
        name: 'FAQ Accordion',
        icon: FaQuestionCircle,
        description: 'Domande frequenti espandibili',
        defaultSettings: {
          items: [],
          allowMultiple: false,
          style: 'minimal'
        }
      },
      {
        type: 'team-showcase',
        name: 'Team Contatti',
        icon: FaUsers,
        description: 'Persone chiave e contatti',
        defaultSettings: {
          members: [],
          columns: 3,
          showRole: true,
          showContact: true,
          alignment: 'center'
        }
      }
    ]
  }
};

// Flatten sections for backward compatibility
const SECTION_TYPES = Object.values(SECTION_CATEGORIES).flatMap(cat => cat.sections);

const SectionLibrary = ({ onAddSection, isCollapsed = false }) => {
  const [activeCategory, setActiveCategory] = React.useState('base');

  const handleDragStart = (e, sectionType) => {
    e.dataTransfer.setData('sectionType', JSON.stringify(sectionType));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (isCollapsed) {
    return (
      <div style={{
        width: '60px',
        background: '#FAFAFA',
        borderRight: '1px solid #E5E7EB',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {SECTION_TYPES.slice(0, 12).map(section => (
          <div
            key={section.type}
            draggable
            onDragStart={(e) => handleDragStart(e, section)}
            onClick={() => onAddSection(section)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              transition: 'all 0.2s'
            }}
            title={section.name}
          >
            <section.icon style={{ color: '#6B7280', fontSize: '18px' }} />
          </div>
        ))}
      </div>
    );
  }

  const currentCategory = SECTION_CATEGORIES[activeCategory];

  return (
    <div style={{
      width: '280px',
      background: '#FAFAFA',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '700',
          color: '#1A1A1A',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Componenti Elite
        </h3>
        <p style={{
          margin: '8px 0 0',
          fontSize: '12px',
          color: '#6B7280'
        }}>
          Trascina per aggiungere
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        padding: '12px',
        borderBottom: '1px solid #E5E7EB',
        background: '#F3F4F6'
      }}>
        {Object.entries(SECTION_CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeCategory === key ? '#1A1A1A' : 'transparent',
              color: activeCategory === key ? '#FFFFFF' : '#6B7280',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <cat.icon size={10} />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Sections List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {currentCategory.sections.map(section => (
            <div
              key={section.type}
              draggable
              onDragStart={(e) => handleDragStart(e, section)}
              onClick={() => onAddSection(section)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                cursor: 'grab',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1A1A1A';
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1A1A1A 0%, #333 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <section.icon style={{ color: '#FFFFFF', fontSize: '16px' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  marginBottom: '2px'
                }}>
                  {section.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#6B7280',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {section.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tip */}
      <div style={{
        padding: '12px',
        background: 'linear-gradient(135deg, #1A1A1A 0%, #333 100%)',
        margin: '12px',
        borderRadius: '10px'
      }}>
        <p style={{
          margin: 0,
          fontSize: '11px',
          color: '#FFFFFF',
          opacity: 0.9,
          lineHeight: 1.5
        }}>
          💡 <strong>Pro tip:</strong> Combina Video Hero + Stats + Package Cards per massimizzare le conversioni.
        </p>
      </div>
    </div>
  );
};

export { SECTION_TYPES, SECTION_CATEGORIES };
export default SectionLibrary;
