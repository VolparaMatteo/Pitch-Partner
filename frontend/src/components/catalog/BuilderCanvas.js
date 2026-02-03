import React, { useState } from 'react';
import { FaGripVertical, FaTrash, FaCog, FaPlus } from 'react-icons/fa';
import {
  HeaderSection,
  AssetGridSection,
  AssetCarouselSection,
  TextSection,
  CtaSection,
  GallerySection,
  StatsSection,
  DividerSection,
  VideoSection,
  FooterSection
} from './sections';

const SECTION_COMPONENTS = {
  'header': HeaderSection,
  'asset-grid': AssetGridSection,
  'asset-carousel': AssetCarouselSection,
  'text': TextSection,
  'cta': CtaSection,
  'gallery': GallerySection,
  'stats': StatsSection,
  'divider': DividerSection,
  'video': VideoSection,
  'footer': FooterSection
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

const BuilderCanvas = ({
  sections,
  globalStyles,
  catalog,
  assets,
  selectedSectionId,
  onSelectSection,
  onReorderSections,
  onDeleteSection,
  onAddSection,
  onDrop
}) => {
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('reorderIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedIndex(null);

    // Check if this is a reorder or new section
    const reorderIndex = e.dataTransfer.getData('reorderIndex');
    const sectionTypeData = e.dataTransfer.getData('sectionType');

    if (reorderIndex !== '') {
      // Reorder existing sections
      const fromIndex = parseInt(reorderIndex);
      if (fromIndex !== dropIndex) {
        onReorderSections(fromIndex, dropIndex);
      }
    } else if (sectionTypeData) {
      // Add new section from library
      const sectionType = JSON.parse(sectionTypeData);
      onDrop(sectionType, dropIndex);
    }
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedIndex(null);

    const sectionTypeData = e.dataTransfer.getData('sectionType');
    if (sectionTypeData) {
      const sectionType = JSON.parse(sectionTypeData);
      onDrop(sectionType, sections.length);
    }
  };

  const renderSection = (section, index) => {
    const Component = SECTION_COMPONENTS[section.type];
    if (!Component) return null;

    const isSelected = selectedSectionId === section.id;
    const isDraggedOver = dragOverIndex === index;

    return (
      <div
        key={section.id}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        style={{
          position: 'relative',
          opacity: draggedIndex === index ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
      >
        {/* Drop indicator */}
        {isDraggedOver && draggedIndex !== index && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#85FF00',
            zIndex: 100,
            borderRadius: '2px'
          }} />
        )}

        {/* Section container */}
        <div
          onClick={() => onSelectSection(section.id)}
          style={{
            position: 'relative',
            border: isSelected ? '2px solid #85FF00' : '2px solid transparent',
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
        >
          {/* Section controls */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 50,
            opacity: isSelected ? 1 : 0,
            transition: 'opacity 0.2s',
            pointerEvents: isSelected ? 'auto' : 'none'
          }}>
            {/* Left controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0,0,0,0.8)',
              padding: '6px 10px',
              borderRadius: '6px'
            }}>
              <FaGripVertical style={{ color: '#9CA3AF', cursor: 'grab' }} />
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                {SECTION_NAMES[section.type] || section.type}
              </span>
            </div>

            {/* Right controls */}
            <div style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(0,0,0,0.8)',
              padding: '4px',
              borderRadius: '6px'
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); onSelectSection(section.id); }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#333',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Impostazioni"
              >
                <FaCog size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSection(section.id); }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Elimina"
              >
                <FaTrash size={12} />
              </button>
            </div>
          </div>

          {/* Section content preview */}
          <Component
            settings={section.settings}
            globalStyles={globalStyles}
            catalog={catalog}
            assets={assets}
            isPreview={true}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
      style={{
        flex: 1,
        background: '#F3F4F6',
        overflow: 'auto',
        padding: '20px'
      }}
    >
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: globalStyles?.colors?.background || '#0A0A0A',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        minHeight: '400px',
        border: '1px solid #E5E7EB'
      }}>
        {sections.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              border: '2px dashed #374151',
              borderRadius: '12px',
              margin: '20px'
            }}
          >
            <FaPlus style={{ fontSize: '32px', color: '#9CA3AF', marginBottom: '16px' }} />
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '18px' }}>
              Inizia a costruire il tuo catalogo
            </h3>
            <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>
              Trascina i blocchi dalla barra laterale o clicca per aggiungerli
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {sections.map((section, index) => renderSection(section, index))}
          </div>
        )}

        {/* Add section button at the end */}
        {sections.length > 0 && (
          <div
            onClick={() => onAddSection && onAddSection()}
            onDragOver={(e) => handleDragOver(e, sections.length)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, sections.length)}
            style={{
              padding: '20px',
              textAlign: 'center',
              borderTop: '1px dashed #374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: dragOverIndex === sections.length ? 'rgba(133, 255, 0, 0.1)' : 'transparent'
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#9CA3AF',
              fontSize: '13px'
            }}>
              <FaPlus />
              Aggiungi sezione
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuilderCanvas;
