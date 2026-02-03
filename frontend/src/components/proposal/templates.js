// Proposal Builder Templates - Preventivo Style
// Version 2.0 - Area/Component Architecture

import {
  FaHeading, FaAlignLeft, FaImage, FaTable, FaCalculator,
  FaFileContract, FaHandshake, FaUser, FaBuilding, FaCalendarAlt,
  FaEuroSign, FaListOl, FaQuoteLeft, FaCheckCircle, FaMinus,
  FaEnvelope, FaPhone, FaGlobe
} from 'react-icons/fa';

// Generate unique ID
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Component Types for Proposal/Preventivo
export const COMPONENT_TYPES = {
  // Header Components
  'proposal-header': {
    type: 'proposal-header',
    name: 'Intestazione',
    icon: 'FaBuilding',
    category: 'header',
    description: 'Logo, titolo e codice proposta',
    defaultSettings: {
      showLogo: true,
      showCode: true,
      showDate: true,
      alignment: 'left'
    }
  },
  'proposal-title': {
    type: 'proposal-title',
    name: 'Titolo Proposta',
    icon: 'FaHeading',
    category: 'header',
    description: 'Titolo principale del preventivo',
    defaultSettings: {
      text: '',
      subtitle: '',
      fontSize: 36,
      alignment: 'left'
    }
  },

  // Recipient Components
  'recipient-card': {
    type: 'recipient-card',
    name: 'Destinatario',
    icon: 'FaUser',
    category: 'recipient',
    description: 'Informazioni del destinatario',
    defaultSettings: {
      style: 'card',
      showRole: true,
      showContact: true,
      showSector: true
    }
  },
  'recipient-inline': {
    type: 'recipient-inline',
    name: 'Destinatario Inline',
    icon: 'FaBuilding',
    category: 'recipient',
    description: 'Destinatario in formato compatto',
    defaultSettings: {
      layout: 'horizontal'
    }
  },

  // Content Components
  'heading': {
    type: 'heading',
    name: 'Titolo',
    icon: 'FaHeading',
    category: 'content',
    description: 'Titolo di sezione',
    defaultSettings: {
      text: '',
      level: 'h2',
      fontSize: 24,
      alignment: 'left'
    }
  },
  'paragraph': {
    type: 'paragraph',
    name: 'Paragrafo',
    icon: 'FaAlignLeft',
    category: 'content',
    description: 'Blocco di testo',
    defaultSettings: {
      text: '',
      fontSize: 16,
      alignment: 'left'
    }
  },
  'intro-message': {
    type: 'intro-message',
    name: 'Messaggio Intro',
    icon: 'FaQuoteLeft',
    category: 'content',
    description: 'Messaggio introduttivo personalizzato',
    defaultSettings: {
      text: '',
      style: 'highlighted'
    }
  },
  'value-proposition': {
    type: 'value-proposition',
    name: 'Proposta di Valore',
    icon: 'FaHandshake',
    category: 'content',
    description: 'Sezione proposta di valore',
    defaultSettings: {
      title: 'Perché Sceglierci',
      text: '',
      showIcon: true
    }
  },

  // Items & Pricing Components
  'items-table': {
    type: 'items-table',
    name: 'Tabella Voci',
    icon: 'FaTable',
    category: 'pricing',
    description: 'Tabella dettagliata delle voci',
    defaultSettings: {
      showDescription: true,
      showQuantity: true,
      showUnitPrice: true,
      showDiscount: true,
      showTotal: true,
      groupByCategory: false,
      style: 'modern'
    }
  },
  'items-list': {
    type: 'items-list',
    name: 'Lista Voci',
    icon: 'FaListOl',
    category: 'pricing',
    description: 'Lista semplificata delle voci',
    defaultSettings: {
      showPrice: true,
      showDescription: false,
      compact: false
    }
  },
  'pricing-summary': {
    type: 'pricing-summary',
    name: 'Riepilogo Prezzi',
    icon: 'FaCalculator',
    category: 'pricing',
    description: 'Subtotale, sconti, totale finale',
    defaultSettings: {
      showSubtotal: true,
      showDiscount: true,
      showVAT: false,
      vatPercentage: 22,
      style: 'boxed',
      highlightTotal: true
    }
  },
  'total-highlight': {
    type: 'total-highlight',
    name: 'Totale in Evidenza',
    icon: 'FaEuroSign',
    category: 'pricing',
    description: 'Totale grande e visibile',
    defaultSettings: {
      showLabel: true,
      size: 'large',
      style: 'accent'
    }
  },

  // Terms & Conditions
  'terms-conditions': {
    type: 'terms-conditions',
    name: 'Termini e Condizioni',
    icon: 'FaFileContract',
    category: 'terms',
    description: 'Condizioni contrattuali',
    defaultSettings: {
      text: '',
      showTitle: true,
      collapsible: false
    }
  },
  'validity-info': {
    type: 'validity-info',
    name: 'Validità Offerta',
    icon: 'FaCalendarAlt',
    category: 'terms',
    description: 'Durata e scadenza proposta',
    defaultSettings: {
      showDuration: true,
      showExpiry: true,
      showSeasons: true,
      style: 'inline'
    }
  },
  'payment-terms': {
    type: 'payment-terms',
    name: 'Modalità Pagamento',
    icon: 'FaEuroSign',
    category: 'terms',
    description: 'Termini di pagamento',
    defaultSettings: {
      showPaymentMethod: true,
      showInstallments: true
    }
  },

  // CTA Components
  'cta-accept': {
    type: 'cta-accept',
    name: 'Accetta Proposta',
    icon: 'FaCheckCircle',
    category: 'cta',
    description: 'Pulsante accettazione',
    defaultSettings: {
      text: 'Accetta Proposta',
      style: 'primary',
      showEmail: true,
      showPhone: true
    }
  },
  'contact-cta': {
    type: 'contact-cta',
    name: 'Contattaci',
    icon: 'FaEnvelope',
    category: 'cta',
    description: 'Sezione contatti',
    defaultSettings: {
      title: 'Hai domande?',
      text: 'Contattaci per maggiori informazioni',
      showEmail: true,
      showPhone: true
    }
  },

  // Layout Components
  'divider': {
    type: 'divider',
    name: 'Separatore',
    icon: 'FaMinus',
    category: 'layout',
    description: 'Linea di separazione',
    defaultSettings: {
      style: 'line',
      color: '#E5E7EB',
      width: '100%',
      thickness: 1
    }
  },
  'spacer': {
    type: 'spacer',
    name: 'Spazio',
    icon: 'FaMinus',
    category: 'layout',
    description: 'Spazio verticale',
    defaultSettings: {
      height: 40
    }
  },
  'image': {
    type: 'image',
    name: 'Immagine',
    icon: 'FaImage',
    category: 'layout',
    description: 'Immagine o grafica',
    defaultSettings: {
      src: '',
      alt: '',
      width: '100%',
      alignment: 'center',
      borderRadius: 8
    }
  }
};

// Component Categories
export const COMPONENT_CATEGORIES = {
  header: { name: 'Intestazione', icon: 'FaBuilding' },
  recipient: { name: 'Destinatario', icon: 'FaUser' },
  content: { name: 'Contenuto', icon: 'FaAlignLeft' },
  pricing: { name: 'Prezzi', icon: 'FaEuroSign' },
  terms: { name: 'Condizioni', icon: 'FaFileContract' },
  cta: { name: 'Azioni', icon: 'FaCheckCircle' },
  layout: { name: 'Layout', icon: 'FaMinus' }
};

// Default Area Settings
export const DEFAULT_AREA_SETTINGS = {
  background: { type: 'color', color: '#FFFFFF' },
  padding: { top: 40, bottom: 40, left: 40, right: 40 },
  textColor: '#1A1A1A',
  maxWidth: 800,
  fullWidth: false
};

// Default Global Styles for Proposals
export const DEFAULT_GLOBAL_STYLES = {
  fonts: {
    heading: 'Inter',
    body: 'Inter'
  },
  colors: {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    accent: '#85FF00',
    background: '#F5F5F5',
    text: '#1A1A1A',
    textMuted: '#6B7280'
  },
  borderRadius: 12
};

// Create a new area
export const createArea = (overrides = {}) => ({
  id: generateId(),
  settings: { ...DEFAULT_AREA_SETTINGS },
  components: [],
  ...overrides
});

// Create a new component
export const createComponent = (type, overrides = {}) => {
  const componentDef = COMPONENT_TYPES[type];
  if (!componentDef) return null;

  return {
    id: generateId(),
    type,
    settings: { ...componentDef.defaultSettings, ...overrides }
  };
};

// ============================================
// TEMPLATES - Preventivo Style
// ============================================

export const TEMPLATES = {
  blank: {
    id: 'blank',
    name: 'Vuoto',
    description: 'Inizia da zero',
    preview: 'blank',
    areas: [
      createArea({
        id: 'main-blank',
        settings: {
          ...DEFAULT_AREA_SETTINGS,
          padding: { top: 60, bottom: 60, left: 40, right: 40 }
        },
        components: []
      })
    ],
    globalStyles: DEFAULT_GLOBAL_STYLES
  },

  standard: {
    id: 'standard',
    name: 'Preventivo Standard',
    description: 'Layout classico per preventivi',
    preview: 'standard',
    areas: [
      // Header
      createArea({
        id: 'header-standard',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 40, bottom: 30, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('proposal-header', { showLogo: true, showCode: true, showDate: true }),
          createComponent('proposal-title', { text: '', subtitle: '' })
        ]
      }),
      // Recipient
      createArea({
        id: 'recipient-standard',
        settings: {
          background: { type: 'color', color: '#F9FAFB' },
          padding: { top: 30, bottom: 30, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('recipient-card', { style: 'card', showRole: true, showContact: true })
        ]
      }),
      // Intro
      createArea({
        id: 'intro-standard',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('intro-message', { text: '', style: 'highlighted' })
        ]
      }),
      // Items
      createArea({
        id: 'items-standard',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 30, bottom: 30, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'Dettaglio Offerta', level: 'h2', fontSize: 24 }),
          createComponent('spacer', { height: 20 }),
          createComponent('items-table', { showDescription: true, showQuantity: true, style: 'modern' }),
          createComponent('spacer', { height: 30 }),
          createComponent('pricing-summary', { showSubtotal: true, showDiscount: true, style: 'boxed' })
        ]
      }),
      // Terms
      createArea({
        id: 'terms-standard',
        settings: {
          background: { type: 'color', color: '#F9FAFB' },
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('validity-info', { showDuration: true, showExpiry: true }),
          createComponent('spacer', { height: 20 }),
          createComponent('terms-conditions', { text: '', showTitle: true })
        ]
      }),
      // CTA
      createArea({
        id: 'cta-standard',
        settings: {
          background: { type: 'color', color: '#1A1A1A' },
          padding: { top: 50, bottom: 50, left: 40, right: 40 },
          textColor: '#FFFFFF',
          maxWidth: 800
        },
        components: [
          createComponent('cta-accept', { text: 'Accetta Proposta', style: 'primary' })
        ]
      })
    ],
    globalStyles: {
      ...DEFAULT_GLOBAL_STYLES,
      colors: {
        primary: '#1A1A1A',
        secondary: '#85FF00',
        accent: '#85FF00',
        background: '#F5F5F5',
        text: '#1A1A1A',
        textMuted: '#6B7280'
      }
    }
  },

  professional: {
    id: 'professional',
    name: 'Professionale',
    description: 'Design elegante e professionale',
    preview: 'professional',
    areas: [
      // Dark Header
      createArea({
        id: 'header-pro',
        settings: {
          background: {
            type: 'gradient',
            gradient: { from: '#1A1A1A', to: '#2D2D2D', direction: '135deg' }
          },
          padding: { top: 50, bottom: 50, left: 40, right: 40 },
          textColor: '#FFFFFF',
          maxWidth: 800
        },
        components: [
          createComponent('proposal-header', { showLogo: true, showCode: true, showDate: true }),
          createComponent('spacer', { height: 30 }),
          createComponent('proposal-title', { text: '', subtitle: '', fontSize: 42, alignment: 'left' })
        ]
      }),
      // Recipient
      createArea({
        id: 'recipient-pro',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'Spett.le', level: 'h3', fontSize: 14, alignment: 'left' }),
          createComponent('recipient-card', { style: 'minimal', showRole: true, showContact: true })
        ]
      }),
      // Intro & Value
      createArea({
        id: 'intro-pro',
        settings: {
          background: { type: 'color', color: '#F9FAFB' },
          padding: { top: 50, bottom: 50, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('intro-message', { text: '', style: 'elegant' }),
          createComponent('spacer', { height: 30 }),
          createComponent('value-proposition', { title: 'Perché Sceglierci', text: '' })
        ]
      }),
      // Items Table
      createArea({
        id: 'items-pro',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 50, bottom: 50, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'Offerta Economica', level: 'h2', fontSize: 28 }),
          createComponent('spacer', { height: 24 }),
          createComponent('items-table', { showDescription: true, showQuantity: true, groupByCategory: true, style: 'elegant' }),
          createComponent('spacer', { height: 40 }),
          createComponent('divider', { style: 'gradient', color: '#85FF00' }),
          createComponent('spacer', { height: 30 }),
          createComponent('pricing-summary', { showSubtotal: true, showDiscount: true, style: 'modern', highlightTotal: true })
        ]
      }),
      // Total Highlight
      createArea({
        id: 'total-pro',
        settings: {
          background: {
            type: 'gradient',
            gradient: { from: '#85FF00', to: '#66CC00', direction: '135deg' }
          },
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('total-highlight', { showLabel: true, size: 'large', style: 'dark' })
        ]
      }),
      // Terms
      createArea({
        id: 'terms-pro',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 50, bottom: 50, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'Condizioni', level: 'h2', fontSize: 24 }),
          createComponent('spacer', { height: 20 }),
          createComponent('validity-info', { showDuration: true, showExpiry: true, style: 'cards' }),
          createComponent('spacer', { height: 30 }),
          createComponent('payment-terms', { showPaymentMethod: true, showInstallments: true }),
          createComponent('spacer', { height: 30 }),
          createComponent('terms-conditions', { text: '', showTitle: false })
        ]
      }),
      // CTA
      createArea({
        id: 'cta-pro',
        settings: {
          background: { type: 'color', color: '#1A1A1A' },
          padding: { top: 60, bottom: 60, left: 40, right: 40 },
          textColor: '#FFFFFF',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'Pronto a Procedere?', level: 'h2', fontSize: 28, alignment: 'center', color: '#FFFFFF' }),
          createComponent('spacer', { height: 24 }),
          createComponent('cta-accept', { text: 'Accetta Proposta', style: 'accent' }),
          createComponent('spacer', { height: 20 }),
          createComponent('contact-cta', { title: '', text: 'Oppure contattaci per discutere i dettagli' })
        ]
      })
    ],
    globalStyles: {
      fonts: {
        heading: 'Montserrat',
        body: 'Inter'
      },
      colors: {
        primary: '#1A1A1A',
        secondary: '#85FF00',
        accent: '#85FF00',
        background: '#FFFFFF',
        text: '#1A1A1A',
        textMuted: '#6B7280'
      },
      borderRadius: 16
    }
  },

  minimal: {
    id: 'minimal',
    name: 'Minimale',
    description: 'Design pulito ed essenziale',
    preview: 'minimal',
    areas: [
      // Header
      createArea({
        id: 'header-min',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 60, bottom: 40, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 700
        },
        components: [
          createComponent('proposal-header', { showLogo: true, showCode: true, showDate: true, alignment: 'center' }),
          createComponent('spacer', { height: 40 }),
          createComponent('proposal-title', { text: '', subtitle: '', fontSize: 32, alignment: 'center' }),
          createComponent('spacer', { height: 20 }),
          createComponent('divider', { style: 'line', color: '#E5E7EB', width: '60px' })
        ]
      }),
      // Recipient Inline
      createArea({
        id: 'recipient-min',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 30, bottom: 30, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 700
        },
        components: [
          createComponent('recipient-inline', { layout: 'horizontal' })
        ]
      }),
      // Content
      createArea({
        id: 'content-min',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 700
        },
        components: [
          createComponent('intro-message', { text: '', style: 'simple' }),
          createComponent('spacer', { height: 40 }),
          createComponent('items-list', { showPrice: true, showDescription: false, compact: true }),
          createComponent('spacer', { height: 40 }),
          createComponent('pricing-summary', { showSubtotal: true, showDiscount: true, style: 'simple' })
        ]
      }),
      // Terms & CTA
      createArea({
        id: 'footer-min',
        settings: {
          background: { type: 'color', color: '#F9FAFB' },
          padding: { top: 50, bottom: 50, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 700
        },
        components: [
          createComponent('validity-info', { showDuration: true, showExpiry: true, style: 'inline' }),
          createComponent('spacer', { height: 30 }),
          createComponent('terms-conditions', { text: '', showTitle: true }),
          createComponent('spacer', { height: 40 }),
          createComponent('cta-accept', { text: 'Conferma', style: 'minimal' })
        ]
      })
    ],
    globalStyles: {
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      },
      colors: {
        primary: '#1A1A1A',
        secondary: '#1A1A1A',
        accent: '#1A1A1A',
        background: '#FFFFFF',
        text: '#1A1A1A',
        textMuted: '#9CA3AF'
      },
      borderRadius: 8
    }
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Per offerte di alto valore',
    preview: 'premium',
    areas: [
      // Hero Header
      createArea({
        id: 'header-prem',
        settings: {
          background: {
            type: 'gradient',
            gradient: { from: '#0D0D0D', to: '#1A1A1A', direction: '180deg' }
          },
          padding: { top: 60, bottom: 60, left: 40, right: 40 },
          textColor: '#FFFFFF',
          maxWidth: 800
        },
        components: [
          createComponent('proposal-header', { showLogo: true, showCode: true, showDate: true }),
          createComponent('spacer', { height: 40 }),
          createComponent('proposal-title', { text: '', subtitle: '', fontSize: 48, alignment: 'left' }),
          createComponent('spacer', { height: 30 }),
          createComponent('total-highlight', { showLabel: true, size: 'large', style: 'accent' })
        ]
      }),
      // Recipient
      createArea({
        id: 'recipient-prem',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 50, bottom: 50, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'Preparata per', level: 'h3', fontSize: 12, alignment: 'left' }),
          createComponent('spacer', { height: 16 }),
          createComponent('recipient-card', { style: 'premium', showRole: true, showContact: true, showSector: true })
        ]
      }),
      // Value Proposition
      createArea({
        id: 'value-prem',
        settings: {
          background: {
            type: 'gradient',
            gradient: { from: '#F9FAFB', to: '#FFFFFF', direction: '180deg' }
          },
          padding: { top: 60, bottom: 60, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('intro-message', { text: '', style: 'premium' }),
          createComponent('spacer', { height: 40 }),
          createComponent('value-proposition', { title: 'I Vantaggi della Partnership', text: '', showIcon: true })
        ]
      }),
      // Items Premium
      createArea({
        id: 'items-prem',
        settings: {
          background: { type: 'color', color: '#FFFFFF' },
          padding: { top: 60, bottom: 60, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'La Tua Offerta Esclusiva', level: 'h2', fontSize: 32 }),
          createComponent('spacer', { height: 30 }),
          createComponent('items-table', { showDescription: true, showQuantity: true, groupByCategory: true, style: 'premium' }),
          createComponent('spacer', { height: 50 }),
          createComponent('pricing-summary', { showSubtotal: true, showDiscount: true, showVAT: true, style: 'premium' })
        ]
      }),
      // Terms
      createArea({
        id: 'terms-prem',
        settings: {
          background: { type: 'color', color: '#F9FAFB' },
          padding: { top: 50, bottom: 50, left: 40, right: 40 },
          textColor: '#1A1A1A',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'Dettagli dell\'Accordo', level: 'h2', fontSize: 24 }),
          createComponent('spacer', { height: 24 }),
          createComponent('validity-info', { showDuration: true, showExpiry: true, showSeasons: true, style: 'cards' }),
          createComponent('spacer', { height: 30 }),
          createComponent('payment-terms', { showPaymentMethod: true, showInstallments: true }),
          createComponent('spacer', { height: 30 }),
          createComponent('terms-conditions', { text: '', showTitle: true })
        ]
      }),
      // CTA Premium
      createArea({
        id: 'cta-prem',
        settings: {
          background: {
            type: 'gradient',
            gradient: { from: '#1A1A1A', to: '#0D0D0D', direction: '180deg' }
          },
          padding: { top: 70, bottom: 70, left: 40, right: 40 },
          textColor: '#FFFFFF',
          maxWidth: 800
        },
        components: [
          createComponent('heading', { text: 'Iniziamo la Partnership', level: 'h2', fontSize: 32, alignment: 'center', color: '#FFFFFF' }),
          createComponent('paragraph', { text: 'Siamo entusiasti di lavorare insieme. Accetta la proposta per iniziare.', fontSize: 16, alignment: 'center', color: '#9CA3AF' }),
          createComponent('spacer', { height: 30 }),
          createComponent('cta-accept', { text: 'Accetta Proposta', style: 'premium' }),
          createComponent('spacer', { height: 24 }),
          createComponent('contact-cta', { title: '', text: 'Hai domande? Siamo qui per te.' })
        ]
      })
    ],
    globalStyles: {
      fonts: {
        heading: 'Montserrat',
        body: 'Inter'
      },
      colors: {
        primary: '#0D0D0D',
        secondary: '#85FF00',
        accent: '#85FF00',
        background: '#FFFFFF',
        text: '#1A1A1A',
        textMuted: '#6B7280'
      },
      borderRadius: 16
    }
  }
};

// Get template by ID
export const getTemplateById = (id) => {
  return TEMPLATES[id] || TEMPLATES.standard;
};

export default TEMPLATES;
