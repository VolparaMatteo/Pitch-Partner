// ============================================
// ELITE CATALOG TEMPLATES
// Per i top club mondiali - Juve, Inter, Milan
// 5 template PERFETTI per presentazioni d'elite
// ============================================

// Default global styles
export const DEFAULT_GLOBAL_STYLES = {
  fonts: {
    heading: 'Montserrat',
    body: 'Inter'
  },
  colors: {
    primary: '#1A1A1A',
    secondary: '#FFFFFF',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF',
    accent: '#D4AF37'
  },
  spacing: {
    sectionPadding: 80,
    containerWidth: 1200
  },
  borderRadius: 12
};

// Component types that can be dragged into areas
export const COMPONENT_TYPES = {
  // Text components
  'heading': {
    type: 'heading',
    name: 'Titolo',
    icon: 'FaHeading',
    category: 'text',
    defaultSettings: { text: 'Il tuo titolo', level: 'h1', fontSize: 48, fontWeight: '700', color: '', alignment: 'left' }
  },
  'paragraph': {
    type: 'paragraph',
    name: 'Paragrafo',
    icon: 'FaAlignLeft',
    category: 'text',
    defaultSettings: { text: 'Scrivi qui il tuo testo...', fontSize: 16, lineHeight: 1.6, color: '', alignment: 'left' }
  },
  'button': {
    type: 'button',
    name: 'Bottone',
    icon: 'FaMousePointer',
    category: 'text',
    defaultSettings: { text: 'Clicca qui', link: '', style: 'filled', size: 'medium', color: '#D4AF37', textColor: '#1A1A1A', alignment: 'left', fullWidth: false }
  },
  // Media components
  'image': {
    type: 'image',
    name: 'Immagine',
    icon: 'FaImage',
    category: 'media',
    defaultSettings: { src: '', alt: '', width: '100%', height: 'auto', objectFit: 'cover', borderRadius: 8, alignment: 'center' }
  },
  'logo': {
    type: 'logo',
    name: 'Logo',
    icon: 'FaCircle',
    category: 'media',
    defaultSettings: { src: '', size: 80, alignment: 'center', rounded: false }
  },
  'video': {
    type: 'video',
    name: 'Video',
    icon: 'FaVideo',
    category: 'media',
    defaultSettings: { url: '', aspectRatio: '16:9' }
  },
  // Layout components
  'spacer': {
    type: 'spacer',
    name: 'Spazio',
    icon: 'FaArrowsAltV',
    category: 'layout',
    defaultSettings: { height: 40 }
  },
  'divider': {
    type: 'divider',
    name: 'Divisore',
    icon: 'FaMinus',
    category: 'layout',
    defaultSettings: { style: 'line', color: '#E5E7EB', width: '100%', thickness: 1 }
  },
  // Data components
  'stats': {
    type: 'stats',
    name: 'Statistiche',
    icon: 'FaChartBar',
    category: 'data',
    defaultSettings: { items: [], layout: 'horizontal', alignment: 'center' }
  },
  'number-counter': {
    type: 'number-counter',
    name: 'Contatori',
    icon: 'FaSortNumericUp',
    category: 'data',
    defaultSettings: { items: [], columns: 4, alignment: 'center' }
  },
  'metrics-dashboard': {
    type: 'metrics-dashboard',
    name: 'Dashboard Metriche',
    icon: 'FaChartLine',
    category: 'data',
    defaultSettings: { metrics: [], columns: 4, style: 'cards', alignment: 'center' }
  },
  // Social proof components
  'testimonial': {
    type: 'testimonial',
    name: 'Testimonianza',
    icon: 'FaQuoteRight',
    category: 'social',
    defaultSettings: { quote: '', author: '', role: '', image: '', alignment: 'center', style: 'modern' }
  },
  'quote-carousel': {
    type: 'quote-carousel',
    name: 'Carosello Citazioni',
    icon: 'FaQuoteLeft',
    category: 'social',
    defaultSettings: { quotes: [], autoPlay: true, interval: 5000, alignment: 'center' }
  },
  'partner-logos': {
    type: 'partner-logos',
    name: 'Logo Partner',
    icon: 'FaHandshake',
    category: 'social',
    defaultSettings: { logos: [], columns: 4, size: 120, grayscale: true, title: 'I nostri partner' }
  },
  'awards': {
    type: 'awards',
    name: 'Trofei & Premi',
    icon: 'FaTrophy',
    category: 'social',
    defaultSettings: { awards: [], columns: 4, showYear: true, alignment: 'center' }
  },
  // Info components
  'feature-list': {
    type: 'feature-list',
    name: 'Lista Vantaggi',
    icon: 'FaCheckCircle',
    category: 'info',
    defaultSettings: { items: [], layout: 'grid', columns: 3, iconColor: '', alignment: 'center' }
  },
  'icon-grid': {
    type: 'icon-grid',
    name: 'Griglia Icone',
    icon: 'FaThLarge',
    category: 'info',
    defaultSettings: { items: [], columns: 3, iconSize: 48, alignment: 'center' }
  },
  'timeline': {
    type: 'timeline',
    name: 'Timeline',
    icon: 'FaHistory',
    category: 'info',
    defaultSettings: { items: [], layout: 'vertical', alignment: 'center' }
  },
  'accordion': {
    type: 'accordion',
    name: 'FAQ Accordion',
    icon: 'FaQuestionCircle',
    category: 'info',
    defaultSettings: { items: [], allowMultiple: false, style: 'minimal' }
  },
  // Conversion components
  'package-cards': {
    type: 'package-cards',
    name: 'Pacchetti Sponsor',
    icon: 'FaCrown',
    category: 'conversion',
    defaultSettings: { packages: [], columns: 3, highlightIndex: 1, alignment: 'center' }
  },
  'countdown': {
    type: 'countdown',
    name: 'Countdown',
    icon: 'FaClock',
    category: 'conversion',
    defaultSettings: { targetDate: '', title: 'Offerta limitata', alignment: 'center', style: 'boxes' }
  },
  'highlight-box': {
    type: 'highlight-box',
    name: 'Box Evidenziato',
    icon: 'FaStar',
    category: 'conversion',
    defaultSettings: { title: '', content: '', icon: '', style: 'accent', alignment: 'center' }
  },
  'badge': {
    type: 'badge',
    name: 'Badge Fiducia',
    icon: 'FaShieldAlt',
    category: 'conversion',
    defaultSettings: { badges: [], alignment: 'center', size: 'medium' }
  },
  // Contact components
  'contact-info': {
    type: 'contact-info',
    name: 'Contatti',
    icon: 'FaEnvelope',
    category: 'contact',
    defaultSettings: { email: '', phone: '', website: '', showLabels: true, layout: 'vertical', alignment: 'center' }
  },
  'social-links': {
    type: 'social-links',
    name: 'Social Links',
    icon: 'FaShareAlt',
    category: 'contact',
    defaultSettings: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '', size: 24, alignment: 'center' }
  },
  'team-showcase': {
    type: 'team-showcase',
    name: 'Team Contatti',
    icon: 'FaUsers',
    category: 'contact',
    defaultSettings: { members: [], columns: 3, showRole: true, showContact: true, alignment: 'center' }
  },
  // Asset components
  'asset-grid': {
    type: 'asset-grid',
    name: 'Griglia Asset',
    icon: 'FaTh',
    category: 'assets',
    defaultSettings: { columns: 3, gap: 24, showFilters: true, showCategory: true, showPrice: true, cardStyle: 'modern' }
  },
  'asset-carousel': {
    type: 'asset-carousel',
    name: 'Carosello Asset',
    icon: 'FaCaretSquareRight',
    category: 'assets',
    defaultSettings: { visibleItems: 3, showArrows: true }
  },
  // Table components
  'comparison-table': {
    type: 'comparison-table',
    name: 'Tabella Comparativa',
    icon: 'FaTable',
    category: 'data',
    defaultSettings: { headers: [], rows: [], highlightColumn: 1 }
  },
  // Gallery components
  'gallery-masonry': {
    type: 'gallery-masonry',
    name: 'Galleria Masonry',
    icon: 'FaImages',
    category: 'media',
    defaultSettings: { images: [], columns: 3, gap: 16, borderRadius: 12 }
  }
};

// Helper to create unique IDs
const uid = () => Math.random().toString(36).substr(2, 9);

// ============================================
// 5 TEMPLATE ELITE - PERFETTI
// ============================================

export const CATALOG_TEMPLATES = {

  // ==========================================
  // 1. ELITE PRESTIGE - Per i top club
  // Template premium con gold accents
  // ==========================================
  elite: {
    id: 'elite',
    name: 'Elite Prestige',
    description: 'Il template definitivo per club d\'elite. Oro, eleganza, potenza.',
    category: 'luxury',
    globalStyles: {
      ...DEFAULT_GLOBAL_STYLES,
      colors: { ...DEFAULT_GLOBAL_STYLES.colors, accent: '#D4AF37' }
    },
    areas: [
      // HERO - Full screen con immagine stadio
      {
        id: uid(),
        settings: {
          background: {
            type: 'image',
            image: {
              src: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80',
              overlay: true,
              overlayGradient: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)',
              position: 'center',
              size: 'cover'
            }
          },
          padding: { top: 140, bottom: 140, left: 24, right: 24 },
          textColor: '#FFFFFF',
          minHeight: '100vh'
        },
        components: [
          { id: uid(), type: 'logo', settings: { size: 120, alignment: 'center' } },
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'heading', settings: {
            text: 'Partnership di Prestigio',
            fontSize: 72,
            fontWeight: '800',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Unisci il tuo brand a una storia di eccellenza. Oltre 100 anni di vittorie, passione e milioni di tifosi in tutto il mondo.',
            fontSize: 22,
            alignment: 'center',
            color: 'rgba(255,255,255,0.9)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'button', settings: {
            text: 'Scopri le Opportunità',
            color: '#D4AF37',
            textColor: '#1A1A1A',
            alignment: 'center',
            size: 'large'
          }}
        ]
      },

      // STATS - Numeri impressionanti
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#0A0A0A' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'number-counter', settings: {
            columns: 4,
            alignment: 'center',
            items: [
              { value: 45, suffix: 'M+', label: 'Tifosi nel mondo' },
              { value: 850, suffix: 'M', label: 'Impression social/anno' },
              { value: 180, suffix: '+', label: 'Paesi raggiunti' },
              { value: 35, suffix: '', label: 'Trofei nazionali' }
            ]
          }}
        ]
      },

      // INTRO - Chi siamo
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Un\'Eredità di Eccellenza',
            fontSize: 48,
            fontWeight: '700',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 20 } },
          { id: uid(), type: 'paragraph', settings: {
            text: 'Da oltre un secolo, il nostro club rappresenta l\'eccellenza nel calcio mondiale. Una tradizione di vittorie costruita sulla passione, sulla determinazione e su un legame indissolubile con i nostri tifosi. Diventare nostro partner significa entrare a far parte di questa storia leggendaria.',
            fontSize: 18,
            alignment: 'center',
            color: '#4B5563'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'feature-list', settings: {
            layout: 'grid',
            columns: 3,
            alignment: 'center',
            items: [
              { icon: '🏟️', title: 'Stadio Iconico', description: '60.000 posti, sold-out garantito ad ogni partita casalinga' },
              { icon: '🌍', title: 'Brand Globale', description: 'Riconoscibilità immediata in oltre 180 paesi nel mondo' },
              { icon: '📱', title: 'Digital First', description: '35M follower sui social, engagement rate del 4.2%' },
              { icon: '🏆', title: 'Palmarès Unico', description: '35 scudetti, 14 coppe nazionali, 2 Champions League' },
              { icon: '👔', title: 'Network Esclusivo', description: 'Accesso a eventi VIP con sponsor e partner globali' },
              { icon: '📈', title: 'ROI Garantito', description: 'I nostri partner vedono un aumento medio del 40% in brand awareness' }
            ]
          }}
        ]
      },

      // AWARDS - Trofei e riconoscimenti
      {
        id: uid(),
        settings: {
          background: {
            type: 'gradient',
            gradient: { direction: '135deg', from: '#1A1A1A', to: '#2D2D2D' }
          },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Una Bacheca Invidiabile',
            fontSize: 42,
            fontWeight: '700',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'awards', settings: {
            columns: 5,
            showYear: true,
            alignment: 'center',
            awards: [
              { icon: '🏆', title: 'Champions League', year: '2023' },
              { icon: '🥇', title: 'Scudetto', year: '2024' },
              { icon: '🏅', title: 'Coppa Italia', year: '2024' },
              { icon: '⭐', title: 'Supercoppa', year: '2023' },
              { icon: '🌟', title: 'Best Club Award', year: '2024' }
            ]
          }}
        ]
      },

      // ASSET GRID - Le opportunità
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#F9FAFB' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Le Nostre Opportunità di Sponsorship',
            fontSize: 42,
            fontWeight: '700',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Scegli tra una vasta gamma di asset esclusivi per massimizzare la visibilità del tuo brand',
            fontSize: 18,
            alignment: 'center',
            color: '#6B7280'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'asset-grid', settings: {
            columns: 3,
            showFilters: true,
            showCategory: true,
            showPrice: false,
            cardStyle: 'modern'
          }}
        ]
      },

      // PACKAGES - Pacchetti sponsorship
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#1A1A1A' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Pacchetti Partnership',
            fontSize: 42,
            fontWeight: '700',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Soluzioni personalizzate per ogni obiettivo di business',
            fontSize: 18,
            alignment: 'center',
            color: 'rgba(255,255,255,0.7)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'package-cards', settings: {
            columns: 3,
            highlightIndex: 1,
            alignment: 'center',
            packages: [
              {
                name: 'Silver Partner',
                price: '€50.000',
                period: '/stagione',
                features: ['Logo su LED perimetrali', 'Visibilità social media', '10 biglietti VIP', 'Brand corner allo stadio', 'Report trimestrale']
              },
              {
                name: 'Gold Partner',
                price: '€150.000',
                period: '/stagione',
                features: ['Tutto Silver +', 'Backdrop conferenze stampa', 'Naming hospitality area', '30 biglietti VIP stagionali', 'Meet & greet giocatori', 'Evento esclusivo annuale']
              },
              {
                name: 'Platinum Partner',
                price: 'Su richiesta',
                period: '',
                features: ['Tutto Gold +', 'Jersey sponsor (manica)', 'Diritti di immagine giocatori', 'Co-branding prodotti', 'Accesso illimitato hospitality', 'Partnership content creation']
              }
            ]
          }}
        ]
      },

      // TESTIMONIAL - Citazione sponsor
      {
        id: uid(),
        settings: {
          background: {
            type: 'image',
            image: {
              src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80',
              overlay: true,
              overlayGradient: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)',
              position: 'center',
              size: 'cover'
            }
          },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'testimonial', settings: {
            quote: 'La partnership con questo club ha trasformato la percezione del nostro brand. In soli 18 mesi abbiamo visto un incremento del 65% nella brand awareness e un ROI che ha superato ogni aspettativa. Non è solo sponsorship, è una vera partnership strategica.',
            author: 'Marco Rossi',
            role: 'CMO, Global Tech Corporation',
            style: 'large',
            alignment: 'center'
          }}
        ]
      },

      // CTA - Call to action finale
      {
        id: uid(),
        settings: {
          background: {
            type: 'gradient',
            gradient: { direction: '135deg', from: '#D4AF37', to: '#B8962E' }
          },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Scrivi il Prossimo Capitolo Con Noi',
            fontSize: 48,
            fontWeight: '700',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Contattaci per una proposta personalizzata. Il nostro team è pronto a creare una partnership vincente per il tuo brand.',
            fontSize: 20,
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'button', settings: {
            text: 'Richiedi una Proposta',
            color: '#1A1A1A',
            textColor: '#FFFFFF',
            alignment: 'center',
            size: 'large'
          }}
        ]
      },

      // FOOTER - Contatti
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#0A0A0A' },
          padding: { top: 60, bottom: 60, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'logo', settings: { size: 60, alignment: 'center' } },
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'contact-info', settings: {
            email: 'partnership@club.com',
            phone: '+39 02 1234567',
            website: 'www.club.com',
            layout: 'horizontal',
            alignment: 'center'
          }},
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'social-links', settings: {
            facebook: '#', instagram: '#', twitter: '#', linkedin: '#', youtube: '#',
            size: 20,
            alignment: 'center'
          }},
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'paragraph', settings: {
            text: '© 2024 Football Club. Tutti i diritti riservati.',
            fontSize: 14,
            alignment: 'center',
            color: '#6B7280'
          }}
        ]
      }
    ]
  },

  // ==========================================
  // 2. STADIUM EXPERIENCE - Focus sportivo
  // Template energetico, action-focused
  // ==========================================
  stadium: {
    id: 'stadium',
    name: 'Stadium Experience',
    description: 'Energia pura. L\'emozione dello stadio in ogni sezione.',
    category: 'sports',
    globalStyles: {
      ...DEFAULT_GLOBAL_STYLES,
      colors: { ...DEFAULT_GLOBAL_STYLES.colors, accent: '#00FF87' }
    },
    areas: [
      // HERO - Azione sul campo
      {
        id: uid(),
        settings: {
          background: {
            type: 'image',
            image: {
              src: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1920&q=80',
              overlay: true,
              overlayGradient: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)',
              position: 'center bottom',
              size: 'cover'
            }
          },
          padding: { top: 120, bottom: 120, left: 24, right: 24 },
          textColor: '#FFFFFF',
          minHeight: '100vh'
        },
        components: [
          { id: uid(), type: 'logo', settings: { size: 100, alignment: 'center' } },
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'heading', settings: {
            text: 'DIVENTA PARTE DEL GIOCO',
            fontSize: 68,
            fontWeight: '900',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Porta il tuo brand sotto i riflettori. 60.000 tifosi ogni partita. Milioni di spettatori in TV. Un\'emozione che non ha eguali.',
            fontSize: 20,
            alignment: 'center',
            color: 'rgba(255,255,255,0.9)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'stats', settings: {
            layout: 'horizontal',
            alignment: 'center',
            items: [
              { value: '60K', label: 'Spettatori/partita' },
              { value: '2.5M', label: 'TV viewers' },
              { value: '95%', label: 'Occupazione media' }
            ]
          }}
        ]
      },

      // VIDEO - L'esperienza
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#000000' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'L\'Esperienza Allo Stadio',
            fontSize: 36,
            fontWeight: '700',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'video', settings: {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            aspectRatio: '16:9'
          }}
        ]
      },

      // OPPORTUNITA' - Icon grid
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Visibilità a 360°',
            fontSize: 42,
            fontWeight: '700',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'icon-grid', settings: {
            columns: 4,
            iconSize: 48,
            alignment: 'center',
            items: [
              { icon: '📺', title: 'LED Perimetrali', description: '320 metri di esposizione continua durante la partita' },
              { icon: '👕', title: 'Jersey Branding', description: 'Il tuo logo sulla maglia di campioni mondiali' },
              { icon: '🎤', title: 'Naming Rights', description: 'Il tuo nome su aree esclusive dello stadio' },
              { icon: '🎬', title: 'Content Creation', description: 'Video e foto con i giocatori per i tuoi canali' },
              { icon: '🎟️', title: 'Hospitality', description: 'Box VIP e esperienze esclusive matchday' },
              { icon: '📲', title: 'Digital Presence', description: 'Visibilità su tutti i canali social del club' },
              { icon: '🎪', title: 'Eventi', description: 'Accesso a presentazioni, gala e eventi esclusivi' },
              { icon: '🤝', title: 'B2B Network', description: 'Networking con gli altri top sponsor del club' }
            ]
          }}
        ]
      },

      // ASSET GRID
      {
        id: uid(),
        settings: {
          background: {
            type: 'gradient',
            gradient: { direction: '180deg', from: '#0A0A0A', to: '#1A1A1A' }
          },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Scegli i Tuoi Asset',
            fontSize: 42,
            fontWeight: '700',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Personalizza la tua partnership con gli asset più adatti ai tuoi obiettivi',
            fontSize: 18,
            alignment: 'center',
            color: 'rgba(255,255,255,0.7)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'asset-grid', settings: {
            columns: 3,
            showFilters: true,
            showCategory: true,
            showPrice: true,
            cardStyle: 'modern'
          }}
        ]
      },

      // METRICS DASHBOARD
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#00FF87' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'I Numeri Parlano Chiaro',
            fontSize: 36,
            fontWeight: '700',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'metrics-dashboard', settings: {
            columns: 4,
            style: 'cards',
            alignment: 'center',
            metrics: [
              { icon: '👁️', label: 'Media Views/Partita', value: '2.5M', change: '+15%' },
              { icon: '💬', label: 'Social Engagement', value: '4.2%', change: '+0.8%' },
              { icon: '📈', label: 'Brand Recall', value: '78%', change: '+12%' },
              { icon: '💰', label: 'ROI Medio Partner', value: '340%', change: '+45%' }
            ]
          }}
        ]
      },

      // COMPARISON TABLE
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Confronta i Pacchetti',
            fontSize: 42,
            fontWeight: '700',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'comparison-table', settings: {
            highlightColumn: 2,
            headers: ['Benefit', 'Bronze', 'Silver', 'Gold'],
            rows: [
              ['LED Perimetrali', '30 sec/partita', '60 sec/partita', '120 sec/partita'],
              ['Biglietti VIP', '4', '12', '30'],
              ['Social Posts', '2/mese', '4/mese', '8/mese'],
              ['Meet & Greet', '✗', '1/anno', '4/anno'],
              ['Backdrop Press', '✗', '✓', '✓'],
              ['Jersey Branding', '✗', '✗', '✓']
            ]
          }}
        ]
      },

      // CTA
      {
        id: uid(),
        settings: {
          background: {
            type: 'image',
            image: {
              src: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=80',
              overlay: true,
              overlayGradient: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 100%)',
              position: 'center',
              size: 'cover'
            }
          },
          padding: { top: 120, bottom: 120, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Entra in Campo Con Noi',
            fontSize: 52,
            fontWeight: '800',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Il nostro team partnership è pronto a costruire con te una strategia vincente.',
            fontSize: 20,
            alignment: 'center',
            color: 'rgba(255,255,255,0.9)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'button', settings: {
            text: 'Contattaci Ora',
            color: '#00FF87',
            textColor: '#1A1A1A',
            alignment: 'center',
            size: 'large'
          }}
        ]
      },

      // FOOTER
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#0A0A0A' },
          padding: { top: 60, bottom: 60, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'contact-info', settings: {
            email: 'sponsorship@club.com',
            phone: '+39 02 9876543',
            website: 'www.club.com/partner',
            layout: 'horizontal',
            alignment: 'center'
          }},
          { id: uid(), type: 'spacer', settings: { height: 20 } },
          { id: uid(), type: 'social-links', settings: {
            facebook: '#', instagram: '#', twitter: '#', linkedin: '#', youtube: '#',
            size: 20,
            alignment: 'center'
          }}
        ]
      }
    ]
  },

  // ==========================================
  // 3. CORPORATE - Professionale e pulito
  // Per presentazioni business-oriented
  // ==========================================
  corporate: {
    id: 'corporate',
    name: 'Corporate Pro',
    description: 'Professionale, pulito, orientato al business. Per CEO e decisori.',
    category: 'corporate',
    globalStyles: {
      ...DEFAULT_GLOBAL_STYLES,
      colors: { ...DEFAULT_GLOBAL_STYLES.colors, accent: '#2563EB', primary: '#1E3A5F' }
    },
    areas: [
      // HERO - Elegante e professionale
      {
        id: uid(),
        settings: {
          background: {
            type: 'gradient',
            gradient: { direction: '135deg', from: '#1E3A5F', to: '#0F172A' }
          },
          padding: { top: 120, bottom: 120, left: 24, right: 24 },
          textColor: '#FFFFFF',
          minHeight: '80vh'
        },
        components: [
          { id: uid(), type: 'logo', settings: { size: 80, alignment: 'left' } },
          { id: uid(), type: 'spacer', settings: { height: 60 } },
          { id: uid(), type: 'heading', settings: {
            text: 'Partnership Strategiche per la Crescita del Tuo Business',
            fontSize: 56,
            fontWeight: '700',
            alignment: 'left',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'spacer', settings: { height: 20 } },
          { id: uid(), type: 'paragraph', settings: {
            text: 'Una piattaforma unica per connettere il tuo brand con milioni di consumatori attraverso la passione per lo sport.',
            fontSize: 20,
            alignment: 'left',
            color: 'rgba(255,255,255,0.8)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'badge', settings: {
            alignment: 'left',
            size: 'medium',
            badges: [
              { icon: '✓', text: 'Partner di 45+ brand globali' },
              { icon: '✓', text: 'ROI documentato' },
              { icon: '✓', text: 'Report analytics mensili' }
            ]
          }}
        ]
      },

      // EXECUTIVE SUMMARY - Numeri chiave
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Executive Summary',
            fontSize: 14,
            fontWeight: '600',
            alignment: 'left',
            color: '#2563EB'
          }},
          { id: uid(), type: 'heading', settings: {
            text: 'Perché Investire in Questa Partnership',
            fontSize: 36,
            fontWeight: '700',
            alignment: 'left',
            color: '#1E3A5F'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'stats', settings: {
            layout: 'horizontal',
            alignment: 'left',
            items: [
              { value: '€2.1B', label: 'Brand Value' },
              { value: '89M', label: 'Social Reach' },
              { value: '4.8%', label: 'Engagement Rate' },
              { value: '340%', label: 'Avg. Partner ROI' }
            ]
          }}
        ]
      },

      // BENEFITS - Lista vantaggi business
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#F8FAFC' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Vantaggi Strategici',
            fontSize: 36,
            fontWeight: '700',
            alignment: 'center',
            color: '#1E3A5F'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'feature-list', settings: {
            layout: 'grid',
            columns: 2,
            alignment: 'left',
            items: [
              { icon: '📊', title: 'Data-Driven Insights', description: 'Accesso a dashboard analytics personalizzata con metriche di performance in tempo reale e report ROI mensili.' },
              { icon: '🎯', title: 'Target Precision', description: 'Raggiungi il tuo pubblico ideale attraverso segmentazione demografica avanzata e attivazioni mirate.' },
              { icon: '🌐', title: 'Global Footprint', description: 'Espandi la tua presenza in 180+ mercati internazionali attraverso la nostra rete di broadcast partner.' },
              { icon: '🤝', title: 'B2B Networking', description: 'Accesso esclusivo a eventi con C-level executives dei nostri partner Fortune 500.' }
            ]
          }}
        ]
      },

      // ASSET CATALOG
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Asset Disponibili',
            fontSize: 36,
            fontWeight: '700',
            alignment: 'left',
            color: '#1E3A5F'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Seleziona gli asset più adatti alla tua strategia di marketing',
            fontSize: 16,
            alignment: 'left',
            color: '#64748B'
          }},
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'asset-grid', settings: {
            columns: 3,
            showFilters: true,
            showCategory: true,
            showPrice: true,
            cardStyle: 'minimal'
          }}
        ]
      },

      // PRICING PACKAGES
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#F8FAFC' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Soluzioni di Partnership',
            fontSize: 36,
            fontWeight: '700',
            alignment: 'center',
            color: '#1E3A5F'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'package-cards', settings: {
            columns: 3,
            highlightIndex: 1,
            alignment: 'center',
            packages: [
              {
                name: 'Official Supplier',
                price: '€75.000',
                period: '/anno',
                features: ['Logo su materiali stampa', 'Menzione comunicati', '8 hospitality pass', 'Logo sito web', 'Report semestrale']
              },
              {
                name: 'Official Partner',
                price: '€200.000',
                period: '/anno',
                features: ['Tutto Supplier +', 'LED perimetrali', 'Backdrop conferenze', '20 hospitality pass', 'Content co-creation', 'Report mensile']
              },
              {
                name: 'Premium Partner',
                price: 'Custom',
                period: '',
                features: ['Tutto Partner +', 'Jersey placement', 'Naming rights', 'Player appearances', 'Exclusive activations', 'Dedicated account team']
              }
            ]
          }}
        ]
      },

      // TESTIMONIALS
      {
        id: uid(),
        settings: {
          background: {
            type: 'gradient',
            gradient: { direction: '135deg', from: '#1E3A5F', to: '#0F172A' }
          },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Cosa Dicono i Nostri Partner',
            fontSize: 36,
            fontWeight: '700',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'quote-carousel', settings: {
            autoPlay: true,
            interval: 6000,
            alignment: 'center',
            quotes: [
              { quote: 'La partnership ha generato un incremento del 45% nelle vendite retail nella regione target.', author: 'Elena Bianchi', role: 'VP Marketing, Retail Corp' },
              { quote: 'Il supporto del team partnership è stato eccezionale. ROI ampiamente superato.', author: 'Francesco Verdi', role: 'CEO, Tech Solutions' },
              { quote: 'Brand awareness triplicata in 12 mesi. Un investimento strategico che rifarei subito.', author: 'Laura Neri', role: 'CMO, Finance Group' }
            ]
          }}
        ]
      },

      // TEAM CONTACTS
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Il Nostro Team Partnership',
            fontSize: 36,
            fontWeight: '700',
            alignment: 'center',
            color: '#1E3A5F'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Professionisti dedicati al successo della tua partnership',
            fontSize: 16,
            alignment: 'center',
            color: '#64748B'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'team-showcase', settings: {
            columns: 3,
            showRole: true,
            showContact: true,
            alignment: 'center',
            members: [
              { name: 'Alessandro Martini', role: 'Head of Partnerships', email: 'a.martini@club.com', phone: '+39 02 1234567' },
              { name: 'Giulia Romano', role: 'Senior Partnership Manager', email: 'g.romano@club.com', phone: '+39 02 1234568' },
              { name: 'Marco Conti', role: 'Partnership Activation', email: 'm.conti@club.com', phone: '+39 02 1234569' }
            ]
          }}
        ]
      },

      // CTA FOOTER
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#2563EB' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Iniziamo a Costruire Insieme',
            fontSize: 42,
            fontWeight: '700',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'paragraph', settings: {
            text: 'Richiedi un incontro con il nostro team per discutere una partnership su misura per i tuoi obiettivi.',
            fontSize: 18,
            alignment: 'center',
            color: 'rgba(255,255,255,0.9)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'button', settings: {
            text: 'Richiedi un Incontro',
            color: '#FFFFFF',
            textColor: '#2563EB',
            alignment: 'center',
            size: 'large'
          }}
        ]
      }
    ]
  },

  // ==========================================
  // 4. MINIMAL LUXURY - Eleganza minimale
  // Meno è più, per brand sofisticati
  // ==========================================
  minimal: {
    id: 'minimal',
    name: 'Minimal Luxury',
    description: 'Eleganza discreta. Per brand che parlano attraverso la raffinatezza.',
    category: 'luxury',
    globalStyles: {
      ...DEFAULT_GLOBAL_STYLES,
      colors: { ...DEFAULT_GLOBAL_STYLES.colors, accent: '#1A1A1A', background: '#FAFAFA' }
    },
    areas: [
      // HERO - Ultra minimal
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FAFAFA' },
          padding: { top: 160, bottom: 160, left: 24, right: 24 },
          textColor: '#1A1A1A',
          minHeight: '100vh'
        },
        components: [
          { id: uid(), type: 'logo', settings: { size: 60, alignment: 'center' } },
          { id: uid(), type: 'spacer', settings: { height: 80 } },
          { id: uid(), type: 'heading', settings: {
            text: 'L\'Arte della Partnership',
            fontSize: 64,
            fontWeight: '300',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'divider', settings: { style: 'line', color: '#1A1A1A', width: '60px', thickness: 2 } },
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'paragraph', settings: {
            text: 'Dove eccellenza sportiva e raffinatezza si incontrano',
            fontSize: 18,
            alignment: 'center',
            color: '#6B7280'
          }}
        ]
      },

      // QUOTE - Impatto
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#1A1A1A' },
          padding: { top: 120, bottom: 120, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'testimonial', settings: {
            quote: 'Il nostro club non cerca sponsor. Cerca partner che condividano una visione di eccellenza assoluta.',
            author: '',
            role: '',
            style: 'large',
            alignment: 'center'
          }}
        ]
      },

      // NUMBERS - Essenziali
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'number-counter', settings: {
            columns: 3,
            alignment: 'center',
            items: [
              { value: 127, suffix: '', label: 'Anni di storia' },
              { value: 52, suffix: 'M', label: 'Fan globali' },
              { value: 41, suffix: '', label: 'Trofei' }
            ]
          }}
        ]
      },

      // PHILOSOPHY
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FAFAFA' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'La Nostra Filosofia',
            fontSize: 42,
            fontWeight: '300',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'paragraph', settings: {
            text: 'Selezioniamo con cura ogni partner. Non cerchiamo loghi da apporre, ma brand con cui costruire storie significative. La nostra tradizione di eccellenza si riflette in ogni collaborazione: esclusiva, curata, memorabile.\n\nLe nostre partnership sono progettate per creare valore autentico, non semplice visibilità. Ogni attivazione è pensata per risuonare con il nostro pubblico sofisticato e creare connessioni durature.',
            fontSize: 18,
            alignment: 'center',
            color: '#4B5563'
          }}
        ]
      },

      // ASSET GRID - Elegante
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Opportunità Esclusive',
            fontSize: 36,
            fontWeight: '300',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'asset-grid', settings: {
            columns: 3,
            showFilters: false,
            showCategory: false,
            showPrice: false,
            cardStyle: 'minimal'
          }}
        ]
      },

      // TIERS - Semplici
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#1A1A1A' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Livelli di Partnership',
            fontSize: 36,
            fontWeight: '300',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'feature-list', settings: {
            layout: 'grid',
            columns: 3,
            alignment: 'center',
            items: [
              { icon: '', title: 'Associate Partner', description: 'Presenza discreta ma significativa. Ideale per entrare nel nostro ecosistema.' },
              { icon: '', title: 'Premium Partner', description: 'Visibilità prominente e accesso privilegiato. Per brand che vogliono distinguersi.' },
              { icon: '', title: 'Principal Partner', description: 'La partnership più esclusiva. Integrazione totale e co-creazione.' }
            ]
          }}
        ]
      },

      // CTA - Discreto
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FAFAFA' },
          padding: { top: 120, bottom: 120, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'Parliamo',
            fontSize: 48,
            fontWeight: '300',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 20 } },
          { id: uid(), type: 'paragraph', settings: {
            text: 'partnership@club.com',
            fontSize: 20,
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'button', settings: {
            text: 'Richiedi Informazioni',
            color: '#1A1A1A',
            textColor: '#FFFFFF',
            alignment: 'center',
            size: 'medium'
          }}
        ]
      },

      // FOOTER
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 40, bottom: 40, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'logo', settings: { size: 40, alignment: 'center' } },
          { id: uid(), type: 'spacer', settings: { height: 20 } },
          { id: uid(), type: 'paragraph', settings: {
            text: '© 2024',
            fontSize: 12,
            alignment: 'center',
            color: '#9CA3AF'
          }}
        ]
      }
    ]
  },

  // ==========================================
  // 5. IMPACT - Bold e dinamico
  // Per club che vogliono fare colpo
  // ==========================================
  impact: {
    id: 'impact',
    name: 'Maximum Impact',
    description: 'Bold, dinamico, impossibile da ignorare. Per fare colpo subito.',
    category: 'bold',
    globalStyles: {
      ...DEFAULT_GLOBAL_STYLES,
      colors: { ...DEFAULT_GLOBAL_STYLES.colors, accent: '#FF3366' }
    },
    areas: [
      // HERO - Massive impact
      {
        id: uid(),
        settings: {
          background: {
            type: 'image',
            image: {
              src: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1920&q=80',
              overlay: true,
              overlayGradient: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.95) 100%)',
              position: 'center',
              size: 'cover'
            }
          },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#FFFFFF',
          minHeight: '100vh'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'IL TUO BRAND.',
            fontSize: 90,
            fontWeight: '900',
            alignment: 'left',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'heading', settings: {
            text: 'IL NOSTRO PALCOSCENICO.',
            fontSize: 90,
            fontWeight: '900',
            alignment: 'left',
            color: '#FF3366'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'paragraph', settings: {
            text: '60.000 persone. Milioni di occhi. Un\'opportunità unica.',
            fontSize: 24,
            alignment: 'left',
            color: 'rgba(255,255,255,0.8)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'button', settings: {
            text: 'VOGLIO SAPERNE DI PIÙ',
            color: '#FF3366',
            textColor: '#FFFFFF',
            alignment: 'left',
            size: 'large'
          }}
        ]
      },

      // STATS - Impatto visivo
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FF3366' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'number-counter', settings: {
            columns: 4,
            alignment: 'center',
            items: [
              { value: 850, suffix: 'M', label: 'IMPRESSION ANNUALI' },
              { value: 45, suffix: 'M', label: 'FAN NEL MONDO' },
              { value: 340, suffix: '%', label: 'ROI MEDIO' },
              { value: 98, suffix: '%', label: 'BRAND RECALL' }
            ]
          }}
        ]
      },

      // WHY US
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#0A0A0A' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'PERCHÉ NOI?',
            fontSize: 56,
            fontWeight: '900',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'icon-grid', settings: {
            columns: 3,
            iconSize: 48,
            alignment: 'center',
            items: [
              { icon: '🔥', title: 'PASSIONE', description: 'Tifosi che vivono il club 365 giorni l\'anno' },
              { icon: '🎯', title: 'REACH', description: 'Raggiungiamo il tuo target ovunque si trovi' },
              { icon: '⚡', title: 'VELOCITÀ', description: 'Attivazioni rapide e campagne real-time' },
              { icon: '📱', title: 'DIGITAL', description: '35M followers pronti ad interagire' },
              { icon: '🏆', title: 'VINCENTI', description: 'Associa il tuo brand a una storia di successi' },
              { icon: '💎', title: 'PREMIUM', description: 'Audience ad alto potere d\'acquisto' }
            ]
          }}
        ]
      },

      // ASSET GRID
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#1A1A1A'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'GLI ASSET',
            fontSize: 48,
            fontWeight: '900',
            alignment: 'center',
            color: '#1A1A1A'
          }},
          { id: uid(), type: 'spacer', settings: { height: 40 } },
          { id: uid(), type: 'asset-grid', settings: {
            columns: 3,
            showFilters: true,
            showCategory: true,
            showPrice: true,
            cardStyle: 'modern'
          }}
        ]
      },

      // PACKAGES - Bold
      {
        id: uid(),
        settings: {
          background: {
            type: 'gradient',
            gradient: { direction: '135deg', from: '#1A1A1A', to: '#2D2D2D' }
          },
          padding: { top: 100, bottom: 100, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'SCEGLI IL TUO LIVELLO',
            fontSize: 48,
            fontWeight: '900',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'package-cards', settings: {
            columns: 3,
            highlightIndex: 1,
            alignment: 'center',
            packages: [
              {
                name: 'STARTER',
                price: '€30K',
                period: '/stagione',
                features: ['LED 20 sec/partita', '4 VIP passes', '2 post social/mese', 'Logo sul sito']
              },
              {
                name: 'PRO',
                price: '€100K',
                period: '/stagione',
                features: ['LED 60 sec/partita', '16 VIP passes', '8 post social/mese', 'Backdrop press', 'Meet & greet', 'Evento dedicato']
              },
              {
                name: 'ELITE',
                price: 'CUSTOM',
                period: '',
                features: ['LED premium', 'Hospitality illimitata', 'Jersey branding', 'Player endorsement', 'Content studio', 'Full integration']
              }
            ]
          }}
        ]
      },

      // HIGHLIGHT BOX
      {
        id: uid(),
        settings: {
          background: { type: 'color', color: '#FF3366' },
          padding: { top: 80, bottom: 80, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'highlight-box', settings: {
            icon: '⏰',
            title: 'OFFERTA EARLY BIRD',
            content: 'Firma entro il 30 del mese e ricevi il 15% di visibilità bonus per tutta la stagione.',
            style: 'warning',
            alignment: 'center'
          }}
        ]
      },

      // FINAL CTA
      {
        id: uid(),
        settings: {
          background: {
            type: 'image',
            image: {
              src: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1920&q=80',
              overlay: true,
              overlayGradient: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%)',
              position: 'center',
              size: 'cover'
            }
          },
          padding: { top: 140, bottom: 140, left: 24, right: 24 },
          textColor: '#FFFFFF'
        },
        components: [
          { id: uid(), type: 'heading', settings: {
            text: 'PRONTO A FARE IL GRANDE SALTO?',
            fontSize: 56,
            fontWeight: '900',
            alignment: 'center',
            color: '#FFFFFF'
          }},
          { id: uid(), type: 'spacer', settings: { height: 20 } },
          { id: uid(), type: 'paragraph', settings: {
            text: 'Il nostro team ti aspetta per creare qualcosa di straordinario.',
            fontSize: 22,
            alignment: 'center',
            color: 'rgba(255,255,255,0.9)'
          }},
          { id: uid(), type: 'spacer', settings: { height: 50 } },
          { id: uid(), type: 'button', settings: {
            text: 'CONTATTACI ORA',
            color: '#FF3366',
            textColor: '#FFFFFF',
            alignment: 'center',
            size: 'large'
          }},
          { id: uid(), type: 'spacer', settings: { height: 30 } },
          { id: uid(), type: 'contact-info', settings: {
            email: 'impact@club.com',
            phone: '+39 02 5555555',
            layout: 'horizontal',
            alignment: 'center'
          }}
        ]
      }
    ]
  }
};

// Template categories for filtering
export const TEMPLATE_CATEGORIES = {
  all: 'Tutti',
  luxury: 'Lusso',
  sports: 'Sport',
  corporate: 'Corporate',
  bold: 'Bold'
};

// Get templates as array
export const getTemplatesArray = () => Object.values(CATALOG_TEMPLATES);

// Get template by ID
export const getTemplateById = (id) => CATALOG_TEMPLATES[id] || CATALOG_TEMPLATES.elite;

// Get templates by category
export const getTemplatesByCategory = (category) => {
  if (category === 'all') return getTemplatesArray();
  return getTemplatesArray().filter(t => t.category === category);
};

// Alias for backwards compatibility
export const TEMPLATES = CATALOG_TEMPLATES;

// Default area settings
export const DEFAULT_AREA_SETTINGS = {
  background: { type: 'color', color: '#FFFFFF' },
  padding: { top: 60, bottom: 60, left: 24, right: 24 },
  maxWidth: 1200,
  fullWidth: false,
  textColor: '#1A1A1A'
};

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create a new area with default settings
export const createArea = (overrides = {}) => {
  return {
    id: generateId(),
    settings: { ...DEFAULT_AREA_SETTINGS, ...overrides.settings },
    components: overrides.components || []
  };
};

// Create a new component from a component type
export const createComponent = (type, settingsOverrides = {}) => {
  const componentDef = COMPONENT_TYPES[type];
  if (!componentDef) {
    console.warn(`Unknown component type: ${type}`);
    return null;
  }
  return {
    id: generateId(),
    type,
    settings: { ...componentDef.defaultSettings, ...settingsOverrides }
  };
};

export default CATALOG_TEMPLATES;
