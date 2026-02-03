import React from 'react';
import {
  FaTimes, FaTrash, FaAlignLeft, FaAlignCenter, FaAlignRight,
  FaPalette, FaFont, FaImage, FaPlus, FaMinus
} from 'react-icons/fa';

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' }
];

const FONT_WEIGHTS = [
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' }
];

const SectionEditor = ({
  section,
  globalStyles,
  onUpdateSection,
  onUpdateGlobalStyles,
  onDeleteSection,
  onClose
}) => {
  if (!section) {
    return (
      <GlobalStylesEditor
        globalStyles={globalStyles}
        onUpdateGlobalStyles={onUpdateGlobalStyles}
      />
    );
  }

  const updateSettings = (key, value) => {
    onUpdateSection(section.id, {
      ...section,
      settings: {
        ...section.settings,
        [key]: value
      }
    });
  };

  const updateNestedSettings = (parentKey, childKey, value) => {
    onUpdateSection(section.id, {
      ...section,
      settings: {
        ...section.settings,
        [parentKey]: {
          ...section.settings[parentKey],
          [childKey]: value
        }
      }
    });
  };

  const updateTextStyle = (textKey, styleKey, value) => {
    onUpdateSection(section.id, {
      ...section,
      settings: {
        ...section.settings,
        [textKey]: {
          ...section.settings[textKey],
          style: {
            ...section.settings[textKey]?.style,
            [styleKey]: value
          }
        }
      }
    });
  };

  const renderHeaderSettings = () => (
    <>
      <SettingsGroup title="Visualizzazione">
        <ToggleSetting
          label="Mostra Logo"
          value={section.settings?.showLogo !== false}
          onChange={(v) => updateSettings('showLogo', v)}
        />
        <ToggleSetting
          label="Mostra Nome Club"
          value={section.settings?.showClubName !== false}
          onChange={(v) => updateSettings('showClubName', v)}
        />
        <ToggleSetting
          label="Mostra Descrizione"
          value={section.settings?.showDescription !== false}
          onChange={(v) => updateSettings('showDescription', v)}
        />
        <ToggleSetting
          label="Mostra Benvenuto"
          value={section.settings?.showWelcomeMessage !== false}
          onChange={(v) => updateSettings('showWelcomeMessage', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Sfondo">
        <SelectSetting
          label="Tipo Sfondo"
          value={section.settings?.backgroundType || 'gradient'}
          options={[
            { value: 'gradient', label: 'Gradiente' },
            { value: 'solid', label: 'Colore Solido' },
            { value: 'image', label: 'Immagine' }
          ]}
          onChange={(v) => updateSettings('backgroundType', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Allineamento">
        <AlignmentSetting
          value={section.settings?.alignment || 'left'}
          onChange={(v) => updateSettings('alignment', v)}
        />
      </SettingsGroup>
    </>
  );

  const renderAssetGridSettings = () => (
    <>
      <SettingsGroup title="Layout">
        <SelectSetting
          label="Colonne"
          value={section.settings?.columns || 3}
          options={[
            { value: 2, label: '2 Colonne' },
            { value: 3, label: '3 Colonne' },
            { value: 4, label: '4 Colonne' }
          ]}
          onChange={(v) => updateSettings('columns', parseInt(v))}
        />
        <SelectSetting
          label="Stile Card"
          value={section.settings?.cardStyle || 'modern'}
          options={[
            { value: 'modern', label: 'Moderno' },
            { value: 'minimal', label: 'Minimale' },
            { value: 'card', label: 'Card' }
          ]}
          onChange={(v) => updateSettings('cardStyle', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Opzioni">
        <ToggleSetting
          label="Mostra Categorie"
          value={section.settings?.showCategory !== false}
          onChange={(v) => updateSettings('showCategory', v)}
        />
        <ToggleSetting
          label="Mostra Filtri"
          value={section.settings?.showFilters !== false}
          onChange={(v) => updateSettings('showFilters', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Titolo Sezione">
        <TextInputSetting
          label="Testo"
          value={section.settings?.title?.content || ''}
          onChange={(v) => updateNestedSettings('title', 'content', v)}
          placeholder="Titolo sezione..."
        />
      </SettingsGroup>
    </>
  );

  const renderAssetCarouselSettings = () => (
    <>
      <SettingsGroup title="Comportamento">
        <ToggleSetting
          label="Auto-play"
          value={section.settings?.autoPlay !== false}
          onChange={(v) => updateSettings('autoPlay', v)}
        />
        <NumberSetting
          label="Velocità (ms)"
          value={section.settings?.speed || 5000}
          min={1000}
          max={10000}
          step={500}
          onChange={(v) => updateSettings('speed', v)}
        />
        <NumberSetting
          label="Elementi Visibili"
          value={section.settings?.visibleItems || 3}
          min={1}
          max={5}
          step={1}
          onChange={(v) => updateSettings('visibleItems', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Controlli">
        <ToggleSetting
          label="Mostra Frecce"
          value={section.settings?.showArrows !== false}
          onChange={(v) => updateSettings('showArrows', v)}
        />
        <ToggleSetting
          label="Mostra Indicatori"
          value={section.settings?.showDots !== false}
          onChange={(v) => updateSettings('showDots', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Titolo Sezione">
        <TextInputSetting
          label="Testo"
          value={section.settings?.title?.content || ''}
          onChange={(v) => updateNestedSettings('title', 'content', v)}
          placeholder="Titolo sezione..."
        />
      </SettingsGroup>
    </>
  );

  const renderTextSettings = () => (
    <>
      <SettingsGroup title="Contenuto">
        <TextAreaSetting
          label="Testo"
          value={section.settings?.content || ''}
          onChange={(v) => updateSettings('content', v)}
          rows={5}
        />
      </SettingsGroup>

      <SettingsGroup title="Stile">
        <SelectSetting
          label="Tipo"
          value={section.settings?.style || 'normal'}
          options={[
            { value: 'normal', label: 'Normale' },
            { value: 'highlighted', label: 'Evidenziato' },
            { value: 'quote', label: 'Citazione' },
            { value: 'centered', label: 'Centrato' }
          ]}
          onChange={(v) => updateSettings('style', v)}
        />
        <AlignmentSetting
          value={section.settings?.alignment || 'left'}
          onChange={(v) => updateSettings('alignment', v)}
        />
      </SettingsGroup>
    </>
  );

  const renderCtaSettings = () => (
    <>
      <SettingsGroup title="Titolo">
        <TextInputSetting
          label="Testo"
          value={section.settings?.title?.content || ''}
          onChange={(v) => updateNestedSettings('title', 'content', v)}
          placeholder="Interessato?"
        />
      </SettingsGroup>

      <SettingsGroup title="Sottotitolo">
        <TextInputSetting
          label="Testo"
          value={section.settings?.subtitle?.content || ''}
          onChange={(v) => updateNestedSettings('subtitle', 'content', v)}
          placeholder="Contattaci per maggiori informazioni"
        />
      </SettingsGroup>

      <SettingsGroup title="Pulsante">
        <TextInputSetting
          label="Testo Pulsante"
          value={section.settings?.buttonText || 'Contattaci'}
          onChange={(v) => updateSettings('buttonText', v)}
        />
        <TextInputSetting
          label="Link (opzionale)"
          value={section.settings?.buttonLink || ''}
          onChange={(v) => updateSettings('buttonLink', v)}
          placeholder="https://..."
        />
      </SettingsGroup>

      <SettingsGroup title="Contatti">
        <ToggleSetting
          label="Mostra Email"
          value={section.settings?.showEmail !== false}
          onChange={(v) => updateSettings('showEmail', v)}
        />
        <ToggleSetting
          label="Mostra Telefono"
          value={section.settings?.showPhone !== false}
          onChange={(v) => updateSettings('showPhone', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Sfondo">
        <SelectSetting
          label="Stile"
          value={section.settings?.backgroundStyle || 'gradient'}
          options={[
            { value: 'gradient', label: 'Gradiente' },
            { value: 'solid', label: 'Colore Solido' },
            { value: 'transparent', label: 'Trasparente' }
          ]}
          onChange={(v) => updateSettings('backgroundStyle', v)}
        />
      </SettingsGroup>
    </>
  );

  const renderFooterSettings = () => (
    <>
      <SettingsGroup title="Contenuto">
        <ToggleSetting
          label="Mostra Contatti"
          value={section.settings?.showContacts !== false}
          onChange={(v) => updateSettings('showContacts', v)}
        />
        <ToggleSetting
          label="Mostra Social"
          value={section.settings?.showSocialLinks !== false}
          onChange={(v) => updateSettings('showSocialLinks', v)}
        />
        <ToggleSetting
          label="Mostra Sito Web"
          value={section.settings?.showWebsite !== false}
          onChange={(v) => updateSettings('showWebsite', v)}
        />
        <ToggleSetting
          label="Mostra Messaggio Footer"
          value={section.settings?.showFooterMessage !== false}
          onChange={(v) => updateSettings('showFooterMessage', v)}
        />
        <ToggleSetting
          label="Mostra Powered By"
          value={section.settings?.showPoweredBy !== false}
          onChange={(v) => updateSettings('showPoweredBy', v)}
        />
      </SettingsGroup>
    </>
  );

  const renderDividerSettings = () => (
    <>
      <SettingsGroup title="Stile">
        <SelectSetting
          label="Tipo"
          value={section.settings?.style || 'line'}
          options={[
            { value: 'line', label: 'Linea' },
            { value: 'space', label: 'Spazio' },
            { value: 'dots', label: 'Puntini' },
            { value: 'gradient', label: 'Gradiente' },
            { value: 'decorative', label: 'Decorativo' }
          ]}
          onChange={(v) => updateSettings('style', v)}
        />
        <NumberSetting
          label="Altezza (px)"
          value={section.settings?.height || 1}
          min={1}
          max={10}
          step={1}
          onChange={(v) => updateSettings('height', v)}
        />
        <NumberSetting
          label="Margine (px)"
          value={section.settings?.margin || 40}
          min={10}
          max={100}
          step={10}
          onChange={(v) => updateSettings('margin', v)}
        />
      </SettingsGroup>
    </>
  );

  const renderVideoSettings = () => (
    <>
      <SettingsGroup title="Video">
        <TextInputSetting
          label="URL Video"
          value={section.settings?.url || ''}
          onChange={(v) => updateSettings('url', v)}
          placeholder="https://youtube.com/watch?v=..."
        />
        <SelectSetting
          label="Proporzioni"
          value={section.settings?.aspectRatio || '16:9'}
          options={[
            { value: '16:9', label: '16:9' },
            { value: '4:3', label: '4:3' },
            { value: '21:9', label: '21:9' },
            { value: '1:1', label: '1:1' }
          ]}
          onChange={(v) => updateSettings('aspectRatio', v)}
        />
        <ToggleSetting
          label="Autoplay"
          value={section.settings?.autoplay === true}
          onChange={(v) => updateSettings('autoplay', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Titolo Sezione">
        <TextInputSetting
          label="Testo"
          value={section.settings?.title?.content || ''}
          onChange={(v) => updateNestedSettings('title', 'content', v)}
          placeholder="Titolo sezione..."
        />
      </SettingsGroup>
    </>
  );

  const renderGallerySettings = () => (
    <>
      <SettingsGroup title="Layout">
        <SelectSetting
          label="Disposizione"
          value={section.settings?.layout || 'grid'}
          options={[
            { value: 'grid', label: 'Griglia' },
            { value: 'masonry', label: 'Masonry' }
          ]}
          onChange={(v) => updateSettings('layout', v)}
        />
        <NumberSetting
          label="Colonne"
          value={section.settings?.columns || 3}
          min={2}
          max={4}
          step={1}
          onChange={(v) => updateSettings('columns', v)}
        />
        <ToggleSetting
          label="Lightbox"
          value={section.settings?.enableLightbox !== false}
          onChange={(v) => updateSettings('enableLightbox', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Titolo Sezione">
        <TextInputSetting
          label="Testo"
          value={section.settings?.title?.content || ''}
          onChange={(v) => updateNestedSettings('title', 'content', v)}
          placeholder="Titolo sezione..."
        />
      </SettingsGroup>
    </>
  );

  const renderStatsSettings = () => (
    <>
      <SettingsGroup title="Layout">
        <SelectSetting
          label="Disposizione"
          value={section.settings?.layout || 'row'}
          options={[
            { value: 'row', label: 'Riga' },
            { value: 'column', label: 'Colonna' }
          ]}
          onChange={(v) => updateSettings('layout', v)}
        />
        <ToggleSetting
          label="Mostra Icone"
          value={section.settings?.showIcons !== false}
          onChange={(v) => updateSettings('showIcons', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Titolo Sezione">
        <TextInputSetting
          label="Testo"
          value={section.settings?.title?.content || ''}
          onChange={(v) => updateNestedSettings('title', 'content', v)}
          placeholder="Titolo sezione..."
        />
      </SettingsGroup>
    </>
  );

  const renderSettings = () => {
    switch (section.type) {
      case 'header': return renderHeaderSettings();
      case 'asset-grid': return renderAssetGridSettings();
      case 'asset-carousel': return renderAssetCarouselSettings();
      case 'text': return renderTextSettings();
      case 'cta': return renderCtaSettings();
      case 'footer': return renderFooterSettings();
      case 'divider': return renderDividerSettings();
      case 'video': return renderVideoSettings();
      case 'gallery': return renderGallerySettings();
      case 'stats': return renderStatsSettings();
      default: return null;
    }
  };

  const SECTION_NAMES = {
    'header': 'Header',
    'asset-grid': 'Griglia Asset',
    'asset-carousel': 'Carosello Asset',
    'text': 'Testo',
    'cta': 'Call to Action',
    'gallery': 'Galleria',
    'stats': 'Statistiche',
    'divider': 'Separatore',
    'video': 'Video',
    'footer': 'Footer'
  };

  return (
    <div style={{
      width: '320px',
      background: '#FAFAFA',
      borderLeft: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: '#1A1A1A'
          }}>
            {SECTION_NAMES[section.type] || section.type}
          </h3>
          <p style={{
            margin: '4px 0 0',
            fontSize: '11px',
            color: '#6B7280'
          }}>
            Impostazioni sezione
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            background: '#FFFFFF',
            color: '#6B7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FaTimes />
        </button>
      </div>

      {/* Settings Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {renderSettings()}
      </div>

      {/* Footer with delete button */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #E5E7EB'
      }}>
        <button
          onClick={() => onDeleteSection(section.id)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #DC2626',
            background: 'transparent',
            color: '#DC2626',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          <FaTrash />
          Elimina Sezione
        </button>
      </div>
    </div>
  );
};

// Global Styles Editor Component
const GlobalStylesEditor = ({ globalStyles, onUpdateGlobalStyles }) => {
  const updateColor = (key, value) => {
    onUpdateGlobalStyles({
      ...globalStyles,
      colors: {
        ...globalStyles?.colors,
        [key]: value
      }
    });
  };

  const updateFont = (key, value) => {
    onUpdateGlobalStyles({
      ...globalStyles,
      fonts: {
        ...globalStyles?.fonts,
        [key]: value
      }
    });
  };

  const updateSpacing = (key, value) => {
    onUpdateGlobalStyles({
      ...globalStyles,
      spacing: {
        ...globalStyles?.spacing,
        [key]: value
      }
    });
  };

  return (
    <div style={{
      width: '320px',
      background: '#FAFAFA',
      borderLeft: '1px solid #E5E7EB',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaPalette style={{ color: '#22C55E' }} />
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: '#1A1A1A'
          }}>
            Stili Globali
          </h3>
        </div>
        <p style={{
          margin: '4px 0 0',
          fontSize: '11px',
          color: '#6B7280'
        }}>
          Personalizza colori e font
        </p>
      </div>

      {/* Settings Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        <SettingsGroup title="Colori">
          <ColorSetting
            label="Primario"
            value={globalStyles?.colors?.primary || '#1A1A1A'}
            onChange={(v) => updateColor('primary', v)}
          />
          <ColorSetting
            label="Secondario"
            value={globalStyles?.colors?.secondary || '#85FF00'}
            onChange={(v) => updateColor('secondary', v)}
          />
          <ColorSetting
            label="Sfondo"
            value={globalStyles?.colors?.background || '#0A0A0A'}
            onChange={(v) => updateColor('background', v)}
          />
          <ColorSetting
            label="Testo"
            value={globalStyles?.colors?.text || '#FFFFFF'}
            onChange={(v) => updateColor('text', v)}
          />
          <ColorSetting
            label="Testo Secondario"
            value={globalStyles?.colors?.textMuted || '#9CA3AF'}
            onChange={(v) => updateColor('textMuted', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="Font">
          <SelectSetting
            label="Titoli"
            value={globalStyles?.fonts?.heading || 'Montserrat'}
            options={FONT_OPTIONS}
            onChange={(v) => updateFont('heading', v)}
          />
          <SelectSetting
            label="Testi"
            value={globalStyles?.fonts?.body || 'Inter'}
            options={FONT_OPTIONS}
            onChange={(v) => updateFont('body', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="Spaziatura">
          <NumberSetting
            label="Padding Sezioni"
            value={globalStyles?.spacing?.sectionPadding || 60}
            min={20}
            max={120}
            step={10}
            onChange={(v) => updateSpacing('sectionPadding', v)}
          />
          <NumberSetting
            label="Larghezza Container"
            value={globalStyles?.spacing?.containerWidth || 1200}
            min={800}
            max={1600}
            step={100}
            onChange={(v) => updateSpacing('containerWidth', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="Altro">
          <NumberSetting
            label="Border Radius"
            value={globalStyles?.borderRadius || 12}
            min={0}
            max={24}
            step={2}
            onChange={(v) => onUpdateGlobalStyles({ ...globalStyles, borderRadius: v })}
          />
        </SettingsGroup>
      </div>
    </div>
  );
};

// Helper Components
const SettingsGroup = ({ title, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <h4 style={{
      margin: '0 0 12px',
      fontSize: '11px',
      fontWeight: '600',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {title}
    </h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {children}
    </div>
  </div>
);

const ToggleSetting = ({ label, value, onChange }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '11px',
        border: 'none',
        background: value ? '#22C55E' : '#D1D5DB',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s'
      }}
    >
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: '2px',
        left: value ? '20px' : '2px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }} />
    </button>
  </div>
);

const SelectSetting = ({ label, value, options, onChange }) => (
  <div>
    <label style={{
      display: 'block',
      fontSize: '12px',
      color: '#6B7280',
      marginBottom: '6px'
    }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        background: '#FFFFFF',
        color: '#1A1A1A',
        fontSize: '13px',
        cursor: 'pointer'
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const TextInputSetting = ({ label, value, onChange, placeholder }) => (
  <div>
    <label style={{
      display: 'block',
      fontSize: '12px',
      color: '#6B7280',
      marginBottom: '6px'
    }}>
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        background: '#FFFFFF',
        color: '#1A1A1A',
        fontSize: '13px'
      }}
    />
  </div>
);

const TextAreaSetting = ({ label, value, onChange, rows = 3 }) => (
  <div>
    <label style={{
      display: 'block',
      fontSize: '12px',
      color: '#6B7280',
      marginBottom: '6px'
    }}>
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        background: '#FFFFFF',
        color: '#1A1A1A',
        fontSize: '13px',
        resize: 'vertical'
      }}
    />
  </div>
);

const NumberSetting = ({ label, value, min, max, step, onChange }) => (
  <div>
    <label style={{
      display: 'block',
      fontSize: '12px',
      color: '#6B7280',
      marginBottom: '6px'
    }}>
      {label}
    </label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          color: '#6B7280',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <FaMinus size={10} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        min={min}
        max={max}
        step={step}
        style={{
          flex: 1,
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          color: '#1A1A1A',
          fontSize: '13px',
          textAlign: 'center'
        }}
      />
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          color: '#6B7280',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <FaPlus size={10} />
      </button>
    </div>
  </div>
);

const ColorSetting = ({ label, value, onChange }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '80px',
          padding: '6px 8px',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          color: '#1A1A1A',
          fontSize: '11px',
          textTransform: 'uppercase'
        }}
      />
    </div>
  </div>
);

const AlignmentSetting = ({ value, onChange }) => (
  <div style={{
    display: 'flex',
    gap: '4px'
  }}>
    {[
      { val: 'left', icon: FaAlignLeft },
      { val: 'center', icon: FaAlignCenter },
      { val: 'right', icon: FaAlignRight }
    ].map(({ val, icon: Icon }) => (
      <button
        key={val}
        onClick={() => onChange(val)}
        style={{
          flex: 1,
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid',
          borderColor: value === val ? '#22C55E' : '#E5E7EB',
          background: value === val ? 'rgba(34, 197, 94, 0.1)' : '#FFFFFF',
          color: value === val ? '#22C55E' : '#6B7280',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon />
      </button>
    ))}
  </div>
);

export default SectionEditor;
