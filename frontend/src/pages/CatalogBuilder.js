import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { clubAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { getImageUrl } from '../utils/imageUtils';
import AreaRenderer from '../components/catalog/AreaRenderer';
import {
  TEMPLATES,
  COMPONENT_TYPES,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_AREA_SETTINGS,
  getTemplateById,
  generateId,
  createArea,
  createComponent
} from '../components/catalog/templates';
import {
  FaArrowLeft, FaSave, FaEye, FaCheck, FaCopy, FaPlus,
  FaExternalLinkAlt, FaLink, FaCube, FaCog, FaTimes,
  FaUpload, FaTrash, FaGripVertical, FaPalette, FaImage,
  FaHeading, FaAlignLeft, FaMousePointer, FaTh, FaImages,
  FaVideo, FaMinus, FaArrowsAltV, FaEnvelope, FaShareAlt,
  FaChartBar, FaCrown, FaColumns
} from 'react-icons/fa';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3003';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Icon map for components
const ICON_MAP = {
  FaHeading, FaAlignLeft, FaMousePointer, FaImage, FaCrown, FaVideo,
  FaTh, FaImages, FaArrowsAltV, FaMinus, FaColumns, FaEnvelope,
  FaShareAlt, FaChartBar
};

// Component categories
const COMPONENT_CATEGORIES = [
  { id: 'text', name: 'Testo', icon: FaAlignLeft },
  { id: 'media', name: 'Media', icon: FaImage },
  { id: 'assets', name: 'Asset', icon: FaTh },
  { id: 'layout', name: 'Layout', icon: FaColumns },
  { id: 'info', name: 'Info', icon: FaEnvelope }
];

function CatalogBuilder() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user, token } = getAuth();

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(!isEditing);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Selection state
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('text');

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'new'|'existing', componentType?, componentId?, sourceAreaId? }
  const [dropTarget, setDropTarget] = useState(null); // { areaId, index }

  // Builder data
  const [areas, setAreas] = useState([]);
  const [globalStyles, setGlobalStyles] = useState(DEFAULT_GLOBAL_STYLES);

  // Available and selected assets
  const [availableAssets, setAvailableAssets] = useState({});
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);

  // Catalog metadata
  const [formData, setFormData] = useState({
    nome: 'Nuovo Catalogo',
    descrizione: '',
    public_token: '',
    mostra_prezzi: true,
    mostra_disponibilita: true,
    attivo: true
  });

  // Load data on mount
  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available assets
      const assetsResponse = await clubAPI.getCatalogAvailableAssets();
      setAvailableAssets(assetsResponse.data.categories || {});

      // If editing, fetch catalog data
      if (isEditing) {
        const catalogResponse = await clubAPI.getCatalog(id);
        const catalog = catalogResponse.data.catalog;

        setFormData({
          nome: catalog.nome || '',
          descrizione: catalog.descrizione || '',
          public_token: catalog.public_token || '',
          mostra_prezzi: catalog.mostra_prezzi !== false,
          mostra_disponibilita: catalog.mostra_disponibilita !== false,
          attivo: catalog.attivo !== false
        });

        setSelectedAssetIds(catalog.assets?.map(a => a.id) || []);

        // Parse layout_json
        if (catalog.layout_json) {
          try {
            const layout = typeof catalog.layout_json === 'string'
              ? JSON.parse(catalog.layout_json)
              : catalog.layout_json;

            if (layout.areas) setAreas(layout.areas);
            if (layout.globalStyles) setGlobalStyles(layout.globalStyles);
          } catch (e) {
            console.error('Error parsing layout:', e);
            const template = getTemplateById('modern');
            setAreas(template.areas);
          }
        } else {
          const template = getTemplateById('modern');
          setAreas(template.areas);
        }

        setShowTemplateSelector(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ type: 'error', message: 'Errore nel caricamento' });
    } finally {
      setLoading(false);
    }
  };

  // Get selected assets with full data
  const getSelectedAssets = useCallback(() => {
    const selected = [];
    Object.values(availableAssets).forEach(assets => {
      assets.forEach(asset => {
        if (selectedAssetIds.includes(asset.id)) {
          selected.push(asset);
        }
      });
    });
    return selected;
  }, [availableAssets, selectedAssetIds]);

  // Template selection
  const handleSelectTemplate = (templateId) => {
    const template = getTemplateById(templateId);
    // Deep clone the template areas
    const clonedAreas = JSON.parse(JSON.stringify(template.areas));
    // Regenerate IDs
    clonedAreas.forEach(area => {
      area.id = generateId('area');
      area.components.forEach(comp => {
        comp.id = generateId(comp.type);
      });
    });
    setAreas(clonedAreas);
    if (template.globalStyles) {
      setGlobalStyles({ ...DEFAULT_GLOBAL_STYLES, ...template.globalStyles });
    }
    setShowTemplateSelector(false);
  };

  // Area management
  const handleAddArea = (afterAreaId = null) => {
    const newArea = createArea();
    if (afterAreaId) {
      const idx = areas.findIndex(a => a.id === afterAreaId);
      const newAreas = [...areas];
      newAreas.splice(idx + 1, 0, newArea);
      setAreas(newAreas);
    } else {
      setAreas([...areas, newArea]);
    }
    setSelectedAreaId(newArea.id);
    setSelectedComponentId(null);
  };

  const handleDeleteArea = (areaId) => {
    setAreas(areas.filter(a => a.id !== areaId));
    if (selectedAreaId === areaId) {
      setSelectedAreaId(null);
      setSelectedComponentId(null);
    }
  };

  const handleUpdateArea = (areaId, newSettings) => {
    setAreas(areas.map(a =>
      a.id === areaId ? { ...a, settings: { ...a.settings, ...newSettings } } : a
    ));
  };

  const handleMoveArea = (areaId, direction) => {
    const idx = areas.findIndex(a => a.id === areaId);
    if (direction === 'up' && idx > 0) {
      const newAreas = [...areas];
      [newAreas[idx - 1], newAreas[idx]] = [newAreas[idx], newAreas[idx - 1]];
      setAreas(newAreas);
    } else if (direction === 'down' && idx < areas.length - 1) {
      const newAreas = [...areas];
      [newAreas[idx], newAreas[idx + 1]] = [newAreas[idx + 1], newAreas[idx]];
      setAreas(newAreas);
    }
  };

  // Component management
  const handleAddComponent = (componentType, areaId) => {
    const newComponent = createComponent(componentType);
    if (!newComponent) return;

    setAreas(areas.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          components: [...area.components, newComponent]
        };
      }
      return area;
    }));

    setSelectedAreaId(areaId);
    setSelectedComponentId(newComponent.id);
  };

  const handleDeleteComponent = (componentId, areaId) => {
    setAreas(areas.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          components: area.components.filter(c => c.id !== componentId)
        };
      }
      return area;
    }));
    if (selectedComponentId === componentId) {
      setSelectedComponentId(null);
    }
  };

  const handleUpdateComponent = (componentId, areaId, newSettings) => {
    setAreas(areas.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          components: area.components.map(c =>
            c.id === componentId ? { ...c, settings: { ...c.settings, ...newSettings } } : c
          )
        };
      }
      return area;
    }));
  };

  const handleMoveComponent = (componentId, areaId, direction) => {
    setAreas(areas.map(area => {
      if (area.id === areaId) {
        const idx = area.components.findIndex(c => c.id === componentId);
        if (direction === 'up' && idx > 0) {
          const newComponents = [...area.components];
          [newComponents[idx - 1], newComponents[idx]] = [newComponents[idx], newComponents[idx - 1]];
          return { ...area, components: newComponents };
        } else if (direction === 'down' && idx < area.components.length - 1) {
          const newComponents = [...area.components];
          [newComponents[idx], newComponents[idx + 1]] = [newComponents[idx + 1], newComponents[idx]];
          return { ...area, components: newComponents };
        }
      }
      return area;
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    console.log('Drag start:', item);
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));

    // Create a custom drag image
    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = '0.8';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = (e) => {
    console.log('Drag end');
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e, areaId, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Only update if different from current
    if (!dropTarget || dropTarget.areaId !== areaId || dropTarget.index !== index) {
      setDropTarget({ areaId, index });
    }
  };

  const handleDragLeave = (e) => {
    // Don't clear if still inside a valid drop zone
    e.preventDefault();
  };

  const handleDrop = (e, areaId, index) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Drop:', { areaId, index, draggedItem });

    if (!draggedItem) {
      setDropTarget(null);
      return;
    }

    if (draggedItem.type === 'new') {
      // Adding new component from sidebar
      const newComponent = createComponent(draggedItem.componentType);
      if (!newComponent) {
        setDropTarget(null);
        setDraggedItem(null);
        return;
      }

      setAreas(prevAreas => prevAreas.map(area => {
        if (area.id === areaId) {
          const newComponents = [...area.components];
          newComponents.splice(index, 0, newComponent);
          return { ...area, components: newComponents };
        }
        return area;
      }));

      setSelectedAreaId(areaId);
      setSelectedComponentId(newComponent.id);
    } else if (draggedItem.type === 'existing') {
      // Moving existing component
      const { componentId, sourceAreaId } = draggedItem;

      if (sourceAreaId === areaId) {
        // Reorder within same area
        setAreas(prevAreas => prevAreas.map(area => {
          if (area.id === areaId) {
            const components = [...area.components];
            const currentIndex = components.findIndex(c => c.id === componentId);
            if (currentIndex === -1) return area;

            const [movedComponent] = components.splice(currentIndex, 1);
            const newIndex = index > currentIndex ? index - 1 : index;
            components.splice(newIndex, 0, movedComponent);
            return { ...area, components };
          }
          return area;
        }));
      } else {
        // Move between areas - need to do this in one operation
        setAreas(prevAreas => {
          // First, find and remove the component from source area
          let movedComponent = null;
          const areasAfterRemove = prevAreas.map(area => {
            if (area.id === sourceAreaId) {
              const compToMove = area.components.find(c => c.id === componentId);
              if (compToMove) {
                movedComponent = compToMove;
                return { ...area, components: area.components.filter(c => c.id !== componentId) };
              }
            }
            return area;
          });

          // Then, add to target area
          if (!movedComponent) return prevAreas;

          return areasAfterRemove.map(area => {
            if (area.id === areaId) {
              const components = [...area.components];
              components.splice(index, 0, movedComponent);
              return { ...area, components };
            }
            return area;
          });
        });

        setSelectedAreaId(areaId);
        setSelectedComponentId(componentId);
      }
    }

    setDropTarget(null);
    setDraggedItem(null);
  };

  // Save catalog
  const handleSave = async () => {
    if (!formData.nome.trim()) {
      setToast({ type: 'error', message: 'Inserisci un nome per il catalogo' });
      return;
    }

    try {
      setSaving(true);

      const layoutJson = {
        version: '2.0',
        areas,
        globalStyles
      };

      const payload = {
        ...formData,
        asset_ids: selectedAssetIds,
        layout_json: layoutJson
      };

      let response;
      if (isEditing) {
        response = await clubAPI.updateCatalog(id, payload);
      } else {
        response = await clubAPI.createCatalog(payload);
      }

      setFormData(prev => ({ ...prev, public_token: response.data.catalog.public_token }));
      setShowShareModal(true);
      setToast({ type: 'success', message: 'Catalogo salvato!' });
    } catch (error) {
      console.error('Error saving:', error);
      setToast({ type: 'error', message: 'Errore nel salvataggio' });
    } finally {
      setSaving(false);
    }
  };

  // Preview
  const handlePreview = () => {
    if (formData.public_token) {
      window.open(`${FRONTEND_URL}/catalog/${formData.public_token}`, '_blank');
    }
  };

  // Copy link
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${FRONTEND_URL}/catalog/${formData.public_token}`);
      setCopySuccess(true);
      setToast({ type: 'success', message: 'Link copiato!' });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error('Copy error:', e);
    }
  };

  // Image upload
  const handleImageUpload = async (file, callback) => {
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await axios.post(`${API_URL}/upload/media`, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.file_url) {
        callback(res.data.file_url);
        setToast({ type: 'success', message: 'Immagine caricata!' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setToast({ type: 'error', message: 'Errore upload' });
    }
  };

  // Get current selection
  const getSelectedArea = () => areas.find(a => a.id === selectedAreaId);
  const getSelectedComponent = () => {
    if (!selectedComponentId || !selectedAreaId) return null;
    const area = areas.find(a => a.id === selectedAreaId);
    return area?.components.find(c => c.id === selectedComponentId);
  };

  // Loading
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FFFFFF', zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid #E5E7EB', borderTopColor: '#85FF00',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6B7280' }}>Caricamento...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Template selector
  if (showTemplateSelector) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#FFFFFF', zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{
          maxWidth: '1100px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px 60px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>
            Scegli un Template
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '48px', fontSize: '18px' }}>
            Seleziona un punto di partenza. Potrai personalizzare tutto.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px'
          }}>
            {Object.values(TEMPLATES).map(template => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: '2px solid #E5E7EB',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#FFFFFF',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#85FF00';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(133, 255, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Template preview */}
                <div style={{
                  height: '120px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  padding: '8px'
                }}>
                  {template.areas?.slice(0, 4).map((area, idx) => (
                    <div
                      key={idx}
                      style={{
                        height: `${100 / Math.min(template.areas.length, 4) - 4}%`,
                        marginBottom: '4px',
                        background: area.settings?.background?.type === 'gradient'
                          ? `linear-gradient(135deg, ${area.settings.background.gradient?.from || '#1A1A1A'}, ${area.settings.background.gradient?.to || '#333'})`
                          : area.settings?.background?.color || '#E5E7EB',
                        borderRadius: '4px'
                      }}
                    />
                  ))}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#1A1A1A' }}>
                  {template.name}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                  {template.description}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/club/catalogs')}
            style={{
              marginTop: '48px',
              padding: '12px 32px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: 'transparent',
              color: '#6B7280',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Annulla
          </button>
        </div>
      </div>
    );
  }

  // Main builder
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#FFFFFF', zIndex: 9998
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #E5E7EB',
        background: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/club/catalogs')}
            style={{
              width: '36px', height: '36px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: 'transparent',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaArrowLeft />
          </button>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome Catalogo"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1A1A1A',
              fontSize: '18px',
              fontWeight: '600',
              outline: 'none',
              width: '300px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowAssetModal(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <FaCube />
            Asset ({selectedAssetIds.length})
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <FaCog />
          </button>

          {formData.public_token && (
            <button
              onClick={handlePreview}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <FaEye />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#1A1A1A',
              color: '#FFFFFF',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
              opacity: saving ? 0.7 : 1
            }}
          >
            <FaSave />
            {saving ? 'Salvataggio...' : 'Pubblica'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Component Library */}
        <div style={{
          width: '280px',
          background: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Componenti
            </h3>
          </div>

          {/* Categories as icon tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #E5E7EB',
            background: '#FAFAFA'
          }}>
            {COMPONENT_CATEGORIES.map(cat => {
              const CatIcon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    flex: 1,
                    padding: '14px 8px',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #85FF00' : '2px solid transparent',
                    background: isActive ? '#FFFFFF' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s'
                  }}
                >
                  <CatIcon style={{ fontSize: '16px', color: isActive ? '#1A1A1A' : '#9CA3AF' }} />
                  <span style={{ fontSize: '10px', fontWeight: '600', color: isActive ? '#1A1A1A' : '#9CA3AF' }}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Components grid */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {Object.values(COMPONENT_TYPES)
                .filter(c => c.category === activeCategory)
                .map(comp => {
                  const Icon = ICON_MAP[comp.icon] || FaCube;
                  return (
                    <div
                      key={comp.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { type: 'new', componentType: comp.type })}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (selectedAreaId) {
                          handleAddComponent(comp.type, selectedAreaId);
                        } else {
                          setToast({ type: 'info', message: 'Seleziona prima un\'area' });
                        }
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '16px 8px',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        background: '#FFFFFF',
                        cursor: 'grab',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#85FF00';
                        e.currentTarget.style.background = '#F0FDF4';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(133, 255, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: '#1A1A1A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon style={{ color: '#FFFFFF', fontSize: '16px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151', lineHeight: '1.2' }}>
                        {comp.name}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Tip */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', lineHeight: '1.5' }}>
                <strong style={{ color: '#374151' }}>Suggerimento:</strong> Trascina i componenti nelle aree o seleziona un'area e clicca sul componente.
              </p>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div style={{
          flex: 1,
          background: '#F3F4F6',
          overflow: 'auto',
          padding: '24px'
        }}>
          {/* Drag indicator */}
          {draggedItem && (
            <div style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              background: '#1A1A1A',
              color: '#FFFFFF',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {draggedItem.type === 'new' ? 'Rilascia in un\'area' : 'Trascina per riordinare'}
            </div>
          )}

          <div
            onClick={(e) => {
              // Deselect when clicking on canvas background
              if (e.target === e.currentTarget) {
                setSelectedAreaId(null);
                setSelectedComponentId(null);
              }
            }}
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              background: '#FFFFFF',
              borderRadius: '12px',
              overflow: 'visible',
              boxShadow: draggedItem ? '0 4px 20px rgba(133, 255, 0, 0.15)' : '0 4px 20px rgba(0,0,0,0.08)',
              minHeight: '600px',
              transition: 'box-shadow 0.2s',
              border: draggedItem ? '2px dashed #85FF00' : '2px solid transparent',
              position: 'relative',
              paddingTop: '8px'
            }}>
            {areas.map((area, idx) => (
              <div
                key={area.id}
                style={{ position: 'relative' }}
                onMouseEnter={(e) => {
                  if (selectedAreaId !== area.id) {
                    const areaEl = e.currentTarget.querySelector('.area-content');
                    if (areaEl) {
                      areaEl.style.outline = '2px dashed #85FF00';
                      areaEl.style.outlineOffset = '-2px';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAreaId !== area.id) {
                    const areaEl = e.currentTarget.querySelector('.area-content');
                    if (areaEl) {
                      areaEl.style.outline = 'none';
                    }
                  }
                }}
              >
                {/* Area Label - Always visible on hover or selected */}
                <div
                  className="area-label"
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '20px',
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0'
                  }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAreaId(area.id);
                      setSelectedComponentId(null);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: selectedAreaId === area.id ? '#85FF00' : '#1A1A1A',
                      color: selectedAreaId === area.id ? '#1A1A1A' : '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '0 0 8px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    <FaGripVertical size={10} />
                    Area {idx + 1}
                  </div>

                  {/* Area toolbar - visible when selected */}
                  {selectedAreaId === area.id && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '4px',
                      gap: '2px'
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveArea(area.id, 'up'); }}
                        disabled={idx === 0}
                        title="Sposta su"
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '0 0 0 8px',
                          border: 'none',
                          background: '#374151',
                          color: '#fff',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          opacity: idx === 0 ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveArea(area.id, 'down'); }}
                        disabled={idx === areas.length - 1}
                        title="Sposta giù"
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '0',
                          border: 'none',
                          background: '#374151',
                          color: '#fff',
                          cursor: idx === areas.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: idx === areas.length - 1 ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddArea(area.id); }}
                        title="Aggiungi area dopo"
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '0',
                          border: 'none',
                          background: '#374151',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaPlus size={10} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteArea(area.id); }}
                        title="Elimina area"
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '0 0 8px 0',
                          border: 'none',
                          background: '#DC2626',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="area-content">
                  <AreaRenderer
                  area={area}
                  globalStyles={globalStyles}
                  assets={getSelectedAssets()}
                  isPreview={true}
                  isSelected={selectedAreaId === area.id}
                  selectedComponentId={selectedComponentId}
                  onClick={(areaId) => {
                    setSelectedAreaId(areaId);
                    setSelectedComponentId(null);
                  }}
                  onComponentClick={(compId, areaId) => {
                    setSelectedAreaId(areaId);
                    setSelectedComponentId(compId);
                  }}
                  // Drag and drop
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  dropTarget={dropTarget}
                  draggedItem={draggedItem}
                />
                </div>

                {/* Add area button between areas */}
                <div
                  onClick={() => handleAddArea(area.id)}
                  style={{
                    padding: '12px 0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  <div style={{
                    position: 'absolute',
                    left: '20px',
                    right: '20px',
                    top: '50%',
                    height: '2px',
                    background: '#85FF00'
                  }} />
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#85FF00',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <FaPlus size={10} />
                    Aggiungi area
                  </div>
                </div>
              </div>
            ))}

            {/* Add area button at end */}
            <div
              onClick={() => handleAddArea()}
              style={{
                padding: areas.length === 0 ? '80px 40px' : '32px 40px',
                textAlign: 'center',
                cursor: 'pointer',
                borderTop: areas.length > 0 ? '2px dashed #E5E7EB' : 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(133, 255, 0, 0.05)';
                e.currentTarget.querySelector('.add-btn').style.background = '#85FF00';
                e.currentTarget.querySelector('.add-btn').style.color = '#1A1A1A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.querySelector('.add-btn').style.background = '#F3F4F6';
                e.currentTarget.querySelector('.add-btn').style.color = '#6B7280';
              }}
            >
              <div
                className="add-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: '#F3F4F6',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6B7280',
                  transition: 'all 0.2s'
                }}
              >
                <FaPlus />
                {areas.length === 0 ? 'Aggiungi la tua prima area' : 'Aggiungi nuova area'}
              </div>
              {areas.length === 0 && (
                <p style={{ margin: '16px 0 0', fontSize: '13px', color: '#9CA3AF' }}>
                  Le aree sono contenitori per i tuoi componenti
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Editor */}
        <div style={{
          width: '320px',
          background: '#FAFAFA',
          borderLeft: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {selectedComponentId && selectedAreaId ? (
            // Component Editor
            <ComponentEditor
              component={getSelectedComponent()}
              areaId={selectedAreaId}
              onUpdate={(settings) => handleUpdateComponent(selectedComponentId, selectedAreaId, settings)}
              onDelete={() => handleDeleteComponent(selectedComponentId, selectedAreaId)}
              onMove={(dir) => handleMoveComponent(selectedComponentId, selectedAreaId, dir)}
              onImageUpload={handleImageUpload}
              onClose={() => setSelectedComponentId(null)}
            />
          ) : selectedAreaId ? (
            // Area Editor
            <AreaEditor
              area={getSelectedArea()}
              onUpdate={(settings) => handleUpdateArea(selectedAreaId, settings)}
              onDelete={() => handleDeleteArea(selectedAreaId)}
              onImageUpload={handleImageUpload}
              onClose={() => setSelectedAreaId(null)}
            />
          ) : (
            // Global Styles
            <GlobalStylesEditor
              globalStyles={globalStyles}
              onUpdate={setGlobalStyles}
            />
          )}
        </div>
      </div>

      {/* Asset Selection Modal */}
      <Modal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        title="Seleziona Asset"
      >
        <div style={{ padding: '20px', maxHeight: '70vh', overflow: 'auto' }}>
          {Object.entries(availableAssets).map(([category, assets]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '10px 14px',
                background: '#F3F4F6',
                borderRadius: '8px'
              }}>
                <span style={{ fontWeight: '600', color: '#1A1A1A' }}>
                  {category} ({assets.length})
                </span>
                <button
                  onClick={() => {
                    const categoryIds = assets.map(a => a.id);
                    const allSelected = categoryIds.every(id => selectedAssetIds.includes(id));
                    if (allSelected) {
                      setSelectedAssetIds(prev => prev.filter(id => !categoryIds.includes(id)));
                    } else {
                      setSelectedAssetIds(prev => [...new Set([...prev, ...categoryIds])]);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: assets.every(a => selectedAssetIds.includes(a.id)) ? '#85FF00' : '#E5E7EB',
                    color: '#1A1A1A',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {assets.every(a => selectedAssetIds.includes(a.id)) ? 'Deseleziona' : 'Seleziona tutti'}
                </button>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {assets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setSelectedAssetIds(prev =>
                        prev.includes(asset.id)
                          ? prev.filter(id => id !== asset.id)
                          : [...prev, asset.id]
                      );
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${selectedAssetIds.includes(asset.id) ? '#85FF00' : '#E5E7EB'}`,
                      background: selectedAssetIds.includes(asset.id) ? 'rgba(133, 255, 0, 0.05)' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: `2px solid ${selectedAssetIds.includes(asset.id) ? '#85FF00' : '#D1D5DB'}`,
                      background: selectedAssetIds.includes(asset.id) ? '#85FF00' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedAssetIds.includes(asset.id) && <FaCheck style={{ color: '#1A1A1A', fontSize: '10px' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '13px', color: '#1A1A1A' }}>{asset.nome}</div>
                    </div>
                    {asset.prezzo_listino && (
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#1A1A1A' }}>
                        € {asset.prezzo_listino.toLocaleString('it-IT')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setShowAssetModal(false)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#1A1A1A',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Fatto ({selectedAssetIds.length} selezionati)
          </button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Impostazioni Catalogo"
      >
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
              Nome Catalogo
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
              Descrizione
            </label>
            <textarea
              value={formData.descrizione}
              onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'mostra_prezzi', label: 'Mostra prezzi negli asset' },
              { key: 'mostra_disponibilita', label: 'Mostra disponibilità' },
              { key: 'attivo', label: 'Catalogo attivo' }
            ].map(opt => (
              <div key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>{opt.label}</span>
                <button
                  onClick={() => setFormData({ ...formData, [opt.key]: !formData[opt.key] })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: formData[opt.key] ? '#85FF00' : '#D1D5DB',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: formData[opt.key] ? '22px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setShowSettingsModal(false)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#1A1A1A',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Fatto
          </button>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Catalogo Pubblicato!"
      >
        <div style={{ padding: '20px' }}>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: 'rgba(133, 255, 0, 0.1)',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <FaCheck style={{ fontSize: '48px', color: '#85FF00', marginBottom: '12px' }} />
            <h3 style={{ marginBottom: '8px', color: '#1A1A1A' }}>Catalogo pubblicato!</h3>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A1A' }}>
              Link Pubblico
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={`${FRONTEND_URL}/catalog/${formData.public_token}`}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#F9FAFB'
                }}
              />
              <button
                onClick={copyLink}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  background: copySuccess ? '#D1FAE5' : '#FFFFFF',
                  cursor: 'pointer',
                  color: copySuccess ? '#059669' : '#1A1A1A'
                }}
              >
                <FaCopy />
              </button>
              <button
                onClick={() => window.open(`${FRONTEND_URL}/catalog/${formData.public_token}`, '_blank')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <FaExternalLinkAlt />
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={() => { setShowShareModal(false); navigate('/club/catalogs'); }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#1A1A1A',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Chiudi
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Area Editor Component
const AreaEditor = ({ area, onUpdate, onDelete, onImageUpload, onClose }) => {
  if (!area) return null;

  const { settings = {} } = area;
  const { background = {}, padding = {}, textColor = '#1A1A1A' } = settings;

  return (
    <>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #E5E7EB', background: '#85FF00' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#1A1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaImage style={{ color: '#85FF00', fontSize: '14px' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1A1A1A' }}>
                Area Selezionata
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#1A1A1A', opacity: 0.7 }}>
                Sfondo, padding, colore testo
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#1A1A1A',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaTimes size={12} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Background Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>
            SFONDO
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['color', 'gradient', 'image'].map(type => (
              <button
                key={type}
                onClick={() => onUpdate({ background: { ...background, type } })}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: background.type === type ? '#85FF00' : '#E5E7EB',
                  background: background.type === type ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#374151'
                }}
              >
                {type === 'color' ? 'Colore' : type === 'gradient' ? 'Gradiente' : 'Immagine'}
              </button>
            ))}
          </div>

          {background.type === 'color' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={background.color || '#FFFFFF'}
                onChange={(e) => onUpdate({ background: { ...background, color: e.target.value } })}
                style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={background.color || '#FFFFFF'}
                onChange={(e) => onUpdate({ background: { ...background, color: e.target.value } })}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
              />
            </div>
          )}

          {background.type === 'gradient' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', width: '30px' }}>Da</span>
                <input
                  type="color"
                  value={background.gradient?.from || '#1A1A1A'}
                  onChange={(e) => onUpdate({ background: { ...background, gradient: { ...background.gradient, from: e.target.value } } })}
                  style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={background.gradient?.from || '#1A1A1A'}
                  onChange={(e) => onUpdate({ background: { ...background, gradient: { ...background.gradient, from: e.target.value } } })}
                  style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', width: '30px' }}>A</span>
                <input
                  type="color"
                  value={background.gradient?.to || '#333333'}
                  onChange={(e) => onUpdate({ background: { ...background, gradient: { ...background.gradient, to: e.target.value } } })}
                  style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={background.gradient?.to || '#333333'}
                  onChange={(e) => onUpdate({ background: { ...background, gradient: { ...background.gradient, to: e.target.value } } })}
                  style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                />
              </div>
            </div>
          )}

          {background.type === 'image' && (
            <div>
              {background.image?.src ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={getImageUrl(background.image.src)}
                    alt="Background"
                    style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <button
                    onClick={() => onUpdate({ background: { ...background, image: { ...background.image, src: '' } } })}
                    style={{
                      position: 'absolute', top: '4px', right: '4px',
                      width: '24px', height: '24px', borderRadius: '50%',
                      border: 'none', background: '#DC2626', color: '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '24px', border: '2px dashed #E5E7EB', borderRadius: '8px',
                  cursor: 'pointer', background: '#F9FAFB'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        onImageUpload(file, (url) => {
                          onUpdate({ background: { ...background, image: { ...background.image, src: url } } });
                        });
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <FaUpload style={{ color: '#9CA3AF', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Carica immagine</p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>
            COLORE TESTO
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="color"
              value={textColor}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={textColor}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Padding */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>
            PADDING
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['top', 'bottom', 'left', 'right'].map(side => (
              <div key={side}>
                <label style={{ display: 'block', fontSize: '11px', color: '#9CA3AF', marginBottom: '4px', textTransform: 'capitalize' }}>
                  {side === 'top' ? 'Sopra' : side === 'bottom' ? 'Sotto' : side === 'left' ? 'Sinistra' : 'Destra'}
                </label>
                <input
                  type="number"
                  value={padding[side] || 60}
                  onChange={(e) => onUpdate({ padding: { ...padding, [side]: parseInt(e.target.value) || 0 } })}
                  style={{
                    width: '100%', padding: '8px', borderRadius: '6px',
                    border: '1px solid #E5E7EB', fontSize: '13px', textAlign: 'center'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={onDelete}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: '1px solid #DC2626', background: 'transparent',
            color: '#DC2626', cursor: 'pointer', fontWeight: '500',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <FaTrash />
          Elimina Area
        </button>
      </div>
    </>
  );
};

// Component Editor
const ComponentEditor = ({ component, areaId, onUpdate, onDelete, onMove, onImageUpload, onClose }) => {
  if (!component) return null;

  const { type, settings = {} } = component;
  const componentDef = COMPONENT_TYPES[type];

  const renderSettings = () => {
    switch (type) {
      case 'heading':
      case 'paragraph':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Testo</label>
              {type === 'heading' ? (
                <input
                  type="text"
                  value={settings.text || ''}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                />
              ) : (
                <textarea
                  value={settings.text || ''}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical' }}
                />
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Dimensione (px)</label>
              <input
                type="number"
                value={settings.fontSize || 16}
                onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 16 })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Allineamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.alignment === align ? '#85FF00' : '#E5E7EB',
                      background: settings.alignment === align ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {align === 'left' ? 'Sinistra' : align === 'center' ? 'Centro' : 'Destra'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colore (lascia vuoto per default)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={settings.color || '#000000'}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={settings.color || ''}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  placeholder="Auto"
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
            </div>
          </>
        );

      case 'button':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Testo</label>
              <input
                type="text"
                value={settings.text || ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Link (opzionale)</label>
              <input
                type="text"
                value={settings.link || ''}
                onChange={(e) => onUpdate({ link: e.target.value })}
                placeholder="https://..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colore Sfondo</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={settings.color || '#85FF00'}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={settings.color || '#85FF00'}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colore Testo</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={settings.textColor || '#1A1A1A'}
                  onChange={(e) => onUpdate({ textColor: e.target.value })}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={settings.textColor || '#1A1A1A'}
                  onChange={(e) => onUpdate({ textColor: e.target.value })}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Allineamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.alignment === align ? '#85FF00' : '#E5E7EB',
                      background: settings.alignment === align ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {align === 'left' ? 'Sinistra' : align === 'center' ? 'Centro' : 'Destra'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'image':
      case 'logo':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Immagine</label>
              {settings.src ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={getImageUrl(settings.src)}
                    alt=""
                    style={{ width: '100%', height: '100px', objectFit: 'contain', borderRadius: '8px', background: '#F3F4F6' }}
                  />
                  <button
                    onClick={() => onUpdate({ src: '' })}
                    style={{
                      position: 'absolute', top: '4px', right: '4px',
                      width: '24px', height: '24px', borderRadius: '50%',
                      border: 'none', background: '#DC2626', color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '32px', border: '2px dashed #E5E7EB', borderRadius: '8px',
                  cursor: 'pointer', background: '#F9FAFB'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        onImageUpload(file, (url) => onUpdate({ src: url }));
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <FaUpload style={{ color: '#9CA3AF', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Carica immagine</p>
                  </div>
                </label>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>
                {type === 'logo' ? 'Dimensione' : 'Larghezza'}
              </label>
              <input
                type="number"
                value={type === 'logo' ? (settings.size || 80) : (typeof settings.width === 'number' ? settings.width : 100)}
                onChange={(e) => onUpdate(type === 'logo' ? { size: parseInt(e.target.value) } : { width: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Allineamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.alignment === align ? '#85FF00' : '#E5E7EB',
                      background: settings.alignment === align ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {align === 'left' ? 'Sinistra' : align === 'center' ? 'Centro' : 'Destra'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'spacer':
        return (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Altezza (px)</label>
            <input
              type="number"
              value={settings.height || 40}
              onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 40 })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
            />
          </div>
        );

      case 'divider':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Stile</label>
              <select
                value={settings.style || 'line'}
                onChange={(e) => onUpdate({ style: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              >
                <option value="line">Linea</option>
                <option value="dashed">Tratteggiata</option>
                <option value="dots">Puntini</option>
                <option value="gradient">Gradiente</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colore</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={settings.color || '#E5E7EB'}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={settings.color || '#E5E7EB'}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
            </div>
          </>
        );

      case 'contact-info':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="info@esempio.com"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Telefono</label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+39 123 456 7890"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Sito Web</label>
              <input
                type="text"
                value={settings.website || ''}
                onChange={(e) => onUpdate({ website: e.target.value })}
                placeholder="www.esempio.com"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Layout</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['horizontal', 'vertical'].map(layout => (
                  <button
                    key={layout}
                    onClick={() => onUpdate({ layout })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.layout === layout ? '#85FF00' : '#E5E7EB',
                      background: settings.layout === layout ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {layout === 'horizontal' ? 'Orizzontale' : 'Verticale'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'social-links':
        return (
          <>
            {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].map(social => (
              <div key={social} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px', textTransform: 'capitalize' }}>
                  {social}
                </label>
                <input
                  type="text"
                  value={settings[social] || ''}
                  onChange={(e) => onUpdate({ [social]: e.target.value })}
                  placeholder={`URL ${social}`}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Dimensione icone</label>
              <input
                type="number"
                value={settings.size || 24}
                onChange={(e) => onUpdate({ size: parseInt(e.target.value) || 24 })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
          </>
        );

      case 'asset-grid':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
              <select
                value={settings.columns || 3}
                onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              >
                <option value={2}>2 colonne</option>
                <option value={3}>3 colonne</option>
                <option value={4}>4 colonne</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Stile card</label>
              <select
                value={settings.cardStyle || 'modern'}
                onChange={(e) => onUpdate({ cardStyle: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              >
                <option value="modern">Moderno</option>
                <option value="minimal">Minimale</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'showFilters', label: 'Mostra filtri' },
                { key: 'showCategory', label: 'Mostra categoria' },
                { key: 'showPrice', label: 'Mostra prezzo' }
              ].map(opt => (
                <div key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{opt.label}</span>
                  <button
                    onClick={() => onUpdate({ [opt.key]: !settings[opt.key] })}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                      background: settings[opt.key] !== false ? '#85FF00' : '#D1D5DB',
                      cursor: 'pointer', position: 'relative'
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px',
                      left: settings[opt.key] !== false ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </>
        );

      case 'stats':
        const statsItems = settings.items || [];

        const addStatItem = () => {
          const newItems = [...statsItems, { value: '', label: '' }];
          onUpdate({ items: newItems });
        };

        const updateStatItem = (index, field, value) => {
          const newItems = [...statsItems];
          newItems[index] = { ...newItems[index], [field]: value };
          onUpdate({ items: newItems });
        };

        const removeStatItem = (index) => {
          const newItems = statsItems.filter((_, i) => i !== index);
          onUpdate({ items: newItems });
        };

        return (
          <>
            {/* Layout */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Layout</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'horizontal', label: 'Orizzontale' },
                  { value: 'vertical', label: 'Verticale' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onUpdate({ layout: opt.value })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.layout === opt.value ? '#85FF00' : '#E5E7EB',
                      background: settings.layout === opt.value ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Allineamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.alignment === align ? '#85FF00' : '#E5E7EB',
                      background: settings.alignment === align ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {align === 'left' ? 'Sinistra' : align === 'center' ? 'Centro' : 'Destra'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Items */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Statistiche</label>
                <button
                  onClick={addStatItem}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #85FF00',
                    background: 'rgba(133, 255, 0, 0.1)',
                    color: '#1A1A1A',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {statsItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#F9FAFB',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Statistica {index + 1}</span>
                      <button
                        onClick={() => removeStatItem(index)}
                        style={{
                          background: '#FEE2E2',
                          border: 'none',
                          borderRadius: '4px',
                          width: '22px',
                          height: '22px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaTimes size={10} color="#DC2626" />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                      <input
                        type="text"
                        value={item.value || ''}
                        onChange={(e) => updateStatItem(index, 'value', e.target.value)}
                        placeholder="15+"
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          fontSize: '14px',
                          fontWeight: '700',
                          textAlign: 'center'
                        }}
                      />
                      <input
                        type="text"
                        value={item.label || ''}
                        onChange={(e) => updateStatItem(index, 'label', e.target.value)}
                        placeholder="Anni di esperienza"
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>
                ))}

                {statsItems.length === 0 && (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    border: '2px dashed #E5E7EB'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                      Nessuna statistica.<br />
                      <span style={{ fontSize: '12px' }}>Clicca "Aggiungi" per iniziare.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      case 'testimonial':
        return (
          <>
            {/* Quote */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                Citazione
              </label>
              <textarea
                value={settings.quote || ''}
                onChange={(e) => onUpdate({ quote: e.target.value })}
                placeholder="Inserisci la citazione..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Author */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                Autore
              </label>
              <input
                type="text"
                value={settings.author || ''}
                onChange={(e) => onUpdate({ author: e.target.value })}
                placeholder="Nome dell'autore"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Role */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                Ruolo / Titolo
              </label>
              <input
                type="text"
                value={settings.role || ''}
                onChange={(e) => onUpdate({ role: e.target.value })}
                placeholder="es. CEO, Sponsor, ecc."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Style */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                Stile
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['modern', 'large'].map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdate({ style: s })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: `2px solid ${settings.style === s ? '#1A1A1A' : '#E5E7EB'}`,
                      background: settings.style === s ? '#F9FAFB' : '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: settings.style === s ? '600' : '400',
                      textTransform: 'capitalize'
                    }}
                  >
                    {s === 'modern' ? 'Moderno' : 'Grande'}
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                Allineamento
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: `2px solid ${settings.alignment === align ? '#1A1A1A' : '#E5E7EB'}`,
                      background: settings.alignment === align ? '#F9FAFB' : '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {align === 'left' ? '◀' : align === 'center' ? '●' : '▶'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'feature-list':
        const featureItems = settings.items || [];

        const addFeatureItem = () => {
          const newItems = [...featureItems, { icon: '✓', title: '', description: '' }];
          onUpdate({ items: newItems });
        };

        const updateFeatureItem = (index, field, value) => {
          const newItems = [...featureItems];
          newItems[index] = { ...newItems[index], [field]: value };
          onUpdate({ items: newItems });
        };

        const removeFeatureItem = (index) => {
          const newItems = featureItems.filter((_, i) => i !== index);
          onUpdate({ items: newItems });
        };

        return (
          <>
            {/* Layout */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                Layout
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['grid', 'list'].map((l) => (
                  <button
                    key={l}
                    onClick={() => onUpdate({ layout: l })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: `2px solid ${settings.layout === l ? '#1A1A1A' : '#E5E7EB'}`,
                      background: settings.layout === l ? '#F9FAFB' : '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: settings.layout === l ? '600' : '400'
                    }}
                  >
                    {l === 'grid' ? 'Griglia' : 'Lista'}
                  </button>
                ))}
              </div>
            </div>

            {/* Columns (only for grid) */}
            {settings.layout !== 'list' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                  Colonne
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[2, 3, 4].map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ columns: c })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: `2px solid ${settings.columns === c ? '#1A1A1A' : '#E5E7EB'}`,
                        background: settings.columns === c ? '#F9FAFB' : '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: settings.columns === c ? '600' : '400'
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Items */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                  Features ({featureItems.length})
                </label>
                <button
                  onClick={addFeatureItem}
                  style={{
                    background: '#1A1A1A',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {featureItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#F9FAFB',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Feature {index + 1}</span>
                      <button
                        onClick={() => removeFeatureItem(index)}
                        style={{
                          background: '#FEE2E2',
                          border: 'none',
                          borderRadius: '4px',
                          width: '22px',
                          height: '22px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaTimes size={10} color="#DC2626" />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gap: '8px' }}>
                      {/* Icon */}
                      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px' }}>
                        <input
                          type="text"
                          value={item.icon || ''}
                          onChange={(e) => updateFeatureItem(index, 'icon', e.target.value)}
                          placeholder="🏆"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            fontSize: '18px',
                            textAlign: 'center'
                          }}
                        />
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => updateFeatureItem(index, 'title', e.target.value)}
                          placeholder="Titolo feature"
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        />
                      </div>

                      {/* Description */}
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => updateFeatureItem(index, 'description', e.target.value)}
                        placeholder="Descrizione..."
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          fontSize: '12px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                ))}

                {featureItems.length === 0 && (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    border: '2px dashed #E5E7EB'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                      Nessuna feature.<br />
                      <span style={{ fontSize: '12px' }}>Clicca "Aggiungi" per iniziare.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      case 'video':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>URL Video (YouTube/Vimeo)</label>
              <input
                type="text"
                value={settings.url || ''}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Aspect Ratio</label>
              <select
                value={settings.aspectRatio || '16:9'}
                onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              >
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
              </select>
            </div>
          </>
        );

      case 'video-hero':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>URL Video Background</label>
              <input
                type="text"
                value={settings.videoUrl || ''}
                onChange={(e) => onUpdate({ videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Titolo</label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Titolo impattante"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Sottotitolo</label>
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                placeholder="Sottotitolo descrittivo"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Testo Bottone</label>
              <input
                type="text"
                value={settings.buttonText || ''}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                placeholder="Scopri di più"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colore Overlay</label>
              <input
                type="text"
                value={settings.overlayColor || 'rgba(0,0,0,0.5)'}
                onChange={(e) => onUpdate({ overlayColor: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Altezza Minima</label>
              <select
                value={settings.minHeight || '80vh'}
                onChange={(e) => onUpdate({ minHeight: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              >
                <option value="60vh">60vh</option>
                <option value="70vh">70vh</option>
                <option value="80vh">80vh</option>
                <option value="90vh">90vh</option>
                <option value="100vh">100vh</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Allineamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.alignment === align ? '#85FF00' : '#E5E7EB',
                      background: settings.alignment === align ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {align === 'left' ? 'Sinistra' : align === 'center' ? 'Centro' : 'Destra'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'partner-logos':
        const partnerLogos = settings.logos || [];

        const addPartnerLogo = () => {
          const newLogos = [...partnerLogos, { src: '', name: '', url: '' }];
          onUpdate({ logos: newLogos });
        };

        const updatePartnerLogo = (index, field, value) => {
          const newLogos = [...partnerLogos];
          newLogos[index] = { ...newLogos[index], [field]: value };
          onUpdate({ logos: newLogos });
        };

        const removePartnerLogo = (index) => {
          const newLogos = partnerLogos.filter((_, i) => i !== index);
          onUpdate({ logos: newLogos });
        };

        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Titolo sezione</label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="I nostri partner"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
                <select
                  value={settings.columns || 4}
                  onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Dimensione</label>
                <input
                  type="number"
                  value={settings.size || 120}
                  onChange={(e) => onUpdate({ size: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#374151' }}>Scala di grigi</span>
              <button
                onClick={() => onUpdate({ grayscale: !settings.grayscale })}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                  background: settings.grayscale !== false ? '#85FF00' : '#D1D5DB',
                  cursor: 'pointer', position: 'relative'
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '2px',
                  left: settings.grayscale !== false ? '22px' : '2px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Loghi partner</label>
                <button onClick={addPartnerLogo} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {partnerLogos.map((logo, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Partner {index + 1}</span>
                    <button onClick={() => removePartnerLogo(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={logo.name || ''}
                    onChange={(e) => updatePartnerLogo(index, 'name', e.target.value)}
                    placeholder="Nome partner"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '8px' }}
                  />
                  <input
                    type="text"
                    value={logo.src || ''}
                    onChange={(e) => updatePartnerLogo(index, 'src', e.target.value)}
                    placeholder="URL immagine logo"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'package-cards':
        const packages = settings.packages || [];

        const addPackage = () => {
          const newPackages = [...packages, { name: '', price: '', period: '', features: [], highlighted: false }];
          onUpdate({ packages: newPackages });
        };

        const updatePackage = (index, field, value) => {
          const newPackages = [...packages];
          newPackages[index] = { ...newPackages[index], [field]: value };
          onUpdate({ packages: newPackages });
        };

        const removePackage = (index) => {
          const newPackages = packages.filter((_, i) => i !== index);
          onUpdate({ packages: newPackages });
        };

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
                <select
                  value={settings.columns || 3}
                  onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Evidenziato</label>
                <select
                  value={settings.highlightIndex || 1}
                  onChange={(e) => onUpdate({ highlightIndex: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  {packages.map((_, i) => (
                    <option key={i} value={i}>Pacchetto {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Pacchetti ({packages.length})</label>
                <button onClick={addPackage} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {packages.map((pkg, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Pacchetto {index + 1}</span>
                    <button onClick={() => removePackage(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={pkg.name || ''}
                    onChange={(e) => updatePackage(index, 'name', e.target.value)}
                    placeholder="Nome pacchetto (es. Gold)"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={pkg.price || ''}
                      onChange={(e) => updatePackage(index, 'price', e.target.value)}
                      placeholder="€10.000"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={pkg.period || ''}
                      onChange={(e) => updatePackage(index, 'period', e.target.value)}
                      placeholder="/stagione"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                  </div>
                  <textarea
                    value={(pkg.features || []).join('\n')}
                    onChange={(e) => updatePackage(index, 'features', e.target.value.split('\n').filter(f => f.trim()))}
                    placeholder="Una feature per riga"
                    rows={3}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '12px', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'timeline':
        const timelineItems = settings.items || [];

        const addTimelineItem = () => {
          const newItems = [...timelineItems, { year: '', title: '', description: '' }];
          onUpdate({ items: newItems });
        };

        const updateTimelineItem = (index, field, value) => {
          const newItems = [...timelineItems];
          newItems[index] = { ...newItems[index], [field]: value };
          onUpdate({ items: newItems });
        };

        const removeTimelineItem = (index) => {
          const newItems = timelineItems.filter((_, i) => i !== index);
          onUpdate({ items: newItems });
        };

        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Layout</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['vertical', 'horizontal'].map(l => (
                  <button
                    key={l}
                    onClick={() => onUpdate({ layout: l })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.layout === l ? '#85FF00' : '#E5E7EB',
                      background: settings.layout === l ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {l === 'vertical' ? 'Verticale' : 'Orizzontale'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Eventi ({timelineItems.length})</label>
                <button onClick={addTimelineItem} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {timelineItems.map((item, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Evento {index + 1}</span>
                    <button onClick={() => removeTimelineItem(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.year || ''}
                    onChange={(e) => updateTimelineItem(index, 'year', e.target.value)}
                    placeholder="Anno (es. 2020)"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '8px' }}
                  />
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => updateTimelineItem(index, 'title', e.target.value)}
                    placeholder="Titolo evento"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '8px' }}
                  />
                  <textarea
                    value={item.description || ''}
                    onChange={(e) => updateTimelineItem(index, 'description', e.target.value)}
                    placeholder="Descrizione..."
                    rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '12px', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'awards':
        const awardsItems = settings.awards || [];

        const addAward = () => {
          const newAwards = [...awardsItems, { icon: '🏆', title: '', year: '' }];
          onUpdate({ awards: newAwards });
        };

        const updateAward = (index, field, value) => {
          const newAwards = [...awardsItems];
          newAwards[index] = { ...newAwards[index], [field]: value };
          onUpdate({ awards: newAwards });
        };

        const removeAward = (index) => {
          const newAwards = awardsItems.filter((_, i) => i !== index);
          onUpdate({ awards: newAwards });
        };

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
                <select
                  value={settings.columns || 4}
                  onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showYear !== false}
                    onChange={(e) => onUpdate({ showYear: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px' }}>Mostra anno</span>
                </label>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Premi ({awardsItems.length})</label>
                <button onClick={addAward} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {awardsItems.map((award, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Premio {index + 1}</span>
                    <button onClick={() => removeAward(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: '8px' }}>
                    <input
                      type="text"
                      value={award.icon || ''}
                      onChange={(e) => updateAward(index, 'icon', e.target.value)}
                      placeholder="🏆"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '18px', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={award.title || ''}
                      onChange={(e) => updateAward(index, 'title', e.target.value)}
                      placeholder="Titolo premio"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={award.year || ''}
                      onChange={(e) => updateAward(index, 'year', e.target.value)}
                      placeholder="2024"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', textAlign: 'center' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'metrics-dashboard':
        const metricsItems = settings.metrics || [];

        const addMetric = () => {
          const newMetrics = [...metricsItems, { label: '', value: '', change: '', icon: '📈' }];
          onUpdate({ metrics: newMetrics });
        };

        const updateMetric = (index, field, value) => {
          const newMetrics = [...metricsItems];
          newMetrics[index] = { ...newMetrics[index], [field]: value };
          onUpdate({ metrics: newMetrics });
        };

        const removeMetric = (index) => {
          const newMetrics = metricsItems.filter((_, i) => i !== index);
          onUpdate({ metrics: newMetrics });
        };

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
                <select
                  value={settings.columns || 4}
                  onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Stile</label>
                <select
                  value={settings.style || 'cards'}
                  onChange={(e) => onUpdate({ style: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value="cards">Cards</option>
                  <option value="minimal">Minimale</option>
                  <option value="bordered">Con bordo</option>
                </select>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Metriche ({metricsItems.length})</label>
                <button onClick={addMetric} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {metricsItems.map((metric, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Metrica {index + 1}</span>
                    <button onClick={() => removeMetric(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={metric.icon || ''}
                      onChange={(e) => updateMetric(index, 'icon', e.target.value)}
                      placeholder="📈"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '18px', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={metric.label || ''}
                      onChange={(e) => updateMetric(index, 'label', e.target.value)}
                      placeholder="Nome metrica"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={metric.value || ''}
                      onChange={(e) => updateMetric(index, 'value', e.target.value)}
                      placeholder="2.5M"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', fontWeight: '700' }}
                    />
                    <input
                      type="text"
                      value={metric.change || ''}
                      onChange={(e) => updateMetric(index, 'change', e.target.value)}
                      placeholder="+15%"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'quote-carousel':
        const quotes = settings.quotes || [];

        const addQuote = () => {
          const newQuotes = [...quotes, { quote: '', author: '', role: '' }];
          onUpdate({ quotes: newQuotes });
        };

        const updateQuote = (index, field, value) => {
          const newQuotes = [...quotes];
          newQuotes[index] = { ...newQuotes[index], [field]: value };
          onUpdate({ quotes: newQuotes });
        };

        const removeQuote = (index) => {
          const newQuotes = quotes.filter((_, i) => i !== index);
          onUpdate({ quotes: newQuotes });
        };

        return (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoPlay !== false}
                    onChange={(e) => onUpdate({ autoPlay: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px' }}>Auto-play</span>
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Intervallo (ms)</label>
                <input
                  type="number"
                  value={settings.interval || 5000}
                  onChange={(e) => onUpdate({ interval: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Citazioni ({quotes.length})</label>
                <button onClick={addQuote} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {quotes.map((quote, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Citazione {index + 1}</span>
                    <button onClick={() => removeQuote(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <textarea
                    value={quote.quote || ''}
                    onChange={(e) => updateQuote(index, 'quote', e.target.value)}
                    placeholder="Testo della citazione..."
                    rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '8px', resize: 'vertical' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={quote.author || ''}
                      onChange={(e) => updateQuote(index, 'author', e.target.value)}
                      placeholder="Nome autore"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={quote.role || ''}
                      onChange={(e) => updateQuote(index, 'role', e.target.value)}
                      placeholder="Ruolo"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'countdown':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Titolo</label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Offerta limitata"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Data/Ora Obiettivo</label>
              <input
                type="datetime-local"
                value={settings.targetDate || ''}
                onChange={(e) => onUpdate({ targetDate: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Stile</label>
              <select
                value={settings.style || 'boxes'}
                onChange={(e) => onUpdate({ style: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              >
                <option value="boxes">Box</option>
                <option value="minimal">Minimale</option>
                <option value="flip">Flip</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Allineamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.alignment === align ? '#85FF00' : '#E5E7EB',
                      background: settings.alignment === align ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {align === 'left' ? 'Sinistra' : align === 'center' ? 'Centro' : 'Destra'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'comparison-table':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Intestazioni (una per riga)</label>
              <textarea
                value={(settings.headers || []).join('\n')}
                onChange={(e) => onUpdate({ headers: e.target.value.split('\n').filter(h => h.trim()) })}
                placeholder="Feature\nBase\nPro\nEnterprise"
                rows={4}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Righe (CSV: feature,val1,val2,...)</label>
              <textarea
                value={(settings.rows || []).map(r => r.join(',')).join('\n')}
                onChange={(e) => onUpdate({ rows: e.target.value.split('\n').filter(r => r.trim()).map(r => r.split(',').map(c => c.trim())) })}
                placeholder="Logo sul sito,✓,✓,✓\nBanner stadio,✗,✓,✓"
                rows={6}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical', fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonna evidenziata</label>
              <input
                type="number"
                value={settings.highlightColumn || 1}
                onChange={(e) => onUpdate({ highlightColumn: parseInt(e.target.value) })}
                min={0}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
          </>
        );

      case 'icon-grid':
        const iconGridItems = settings.items || [];

        const addIconGridItem = () => {
          const newItems = [...iconGridItems, { icon: '⭐', title: '', description: '' }];
          onUpdate({ items: newItems });
        };

        const updateIconGridItem = (index, field, value) => {
          const newItems = [...iconGridItems];
          newItems[index] = { ...newItems[index], [field]: value };
          onUpdate({ items: newItems });
        };

        const removeIconGridItem = (index) => {
          const newItems = iconGridItems.filter((_, i) => i !== index);
          onUpdate({ items: newItems });
        };

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
                <select
                  value={settings.columns || 3}
                  onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Dimensione icone</label>
                <input
                  type="number"
                  value={settings.iconSize || 48}
                  onChange={(e) => onUpdate({ iconSize: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Elementi ({iconGridItems.length})</label>
                <button onClick={addIconGridItem} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {iconGridItems.map((item, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Elemento {index + 1}</span>
                    <button onClick={() => removeIconGridItem(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={item.icon || ''}
                      onChange={(e) => updateIconGridItem(index, 'icon', e.target.value)}
                      placeholder="⭐"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '24px', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateIconGridItem(index, 'title', e.target.value)}
                      placeholder="Titolo"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', fontWeight: '600' }}
                    />
                  </div>
                  <textarea
                    value={item.description || ''}
                    onChange={(e) => updateIconGridItem(index, 'description', e.target.value)}
                    placeholder="Descrizione..."
                    rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '12px', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'highlight-box':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Icona</label>
              <input
                type="text"
                value={settings.icon || ''}
                onChange={(e) => onUpdate({ icon: e.target.value })}
                placeholder="💡"
                style={{ width: '60px', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '24px', textAlign: 'center' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Titolo</label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Titolo in evidenza"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Contenuto</label>
              <textarea
                value={settings.content || ''}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Testo del contenuto..."
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Stile</label>
              <select
                value={settings.style || 'accent'}
                onChange={(e) => onUpdate({ style: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              >
                <option value="accent">Accent</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Allineamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '6px',
                      border: '1px solid', borderColor: settings.alignment === align ? '#85FF00' : '#E5E7EB',
                      background: settings.alignment === align ? 'rgba(133, 255, 0, 0.1)' : '#FFFFFF',
                      cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {align === 'left' ? 'Sinistra' : align === 'center' ? 'Centro' : 'Destra'}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'gallery-masonry':
        const galleryImages = settings.images || [];

        const addGalleryImage = () => {
          const newImages = [...galleryImages, { src: '', alt: '' }];
          onUpdate({ images: newImages });
        };

        const updateGalleryImage = (index, field, value) => {
          const newImages = [...galleryImages];
          newImages[index] = { ...newImages[index], [field]: value };
          onUpdate({ images: newImages });
        };

        const removeGalleryImage = (index) => {
          const newImages = galleryImages.filter((_, i) => i !== index);
          onUpdate({ images: newImages });
        };

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
                <select
                  value={settings.columns || 3}
                  onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Gap</label>
                <input
                  type="number"
                  value={settings.gap || 16}
                  onChange={(e) => onUpdate({ gap: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Bordi</label>
                <input
                  type="number"
                  value={settings.borderRadius || 12}
                  onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Immagini ({galleryImages.length})</label>
                <button onClick={addGalleryImage} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {galleryImages.map((img, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Immagine {index + 1}</span>
                    <button onClick={() => removeGalleryImage(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={img.src || ''}
                    onChange={(e) => updateGalleryImage(index, 'src', e.target.value)}
                    placeholder="URL immagine"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '8px' }}
                  />
                  <input
                    type="text"
                    value={img.alt || ''}
                    onChange={(e) => updateGalleryImage(index, 'alt', e.target.value)}
                    placeholder="Testo alternativo"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'accordion':
        const accordionItems = settings.items || [];

        const addAccordionItem = () => {
          const newItems = [...accordionItems, { question: '', answer: '' }];
          onUpdate({ items: newItems });
        };

        const updateAccordionItem = (index, field, value) => {
          const newItems = [...accordionItems];
          newItems[index] = { ...newItems[index], [field]: value };
          onUpdate({ items: newItems });
        };

        const removeAccordionItem = (index) => {
          const newItems = accordionItems.filter((_, i) => i !== index);
          onUpdate({ items: newItems });
        };

        return (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.allowMultiple === true}
                    onChange={(e) => onUpdate({ allowMultiple: e.target.checked })}
                  />
                  <span style={{ fontSize: '13px' }}>Permetti multipli aperti</span>
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Stile</label>
                <select
                  value={settings.style || 'minimal'}
                  onChange={(e) => onUpdate({ style: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                >
                  <option value="minimal">Minimale</option>
                  <option value="boxed">Box</option>
                  <option value="bordered">Con bordo</option>
                </select>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>FAQ ({accordionItems.length})</label>
                <button onClick={addAccordionItem} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {accordionItems.map((item, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>FAQ {index + 1}</span>
                    <button onClick={() => removeAccordionItem(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.question || ''}
                    onChange={(e) => updateAccordionItem(index, 'question', e.target.value)}
                    placeholder="Domanda"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}
                  />
                  <textarea
                    value={item.answer || ''}
                    onChange={(e) => updateAccordionItem(index, 'answer', e.target.value)}
                    placeholder="Risposta..."
                    rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '12px', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'badge':
        const badgeItems = settings.badges || [];

        const addBadge = () => {
          const newBadges = [...badgeItems, { icon: '✓', text: '' }];
          onUpdate({ badges: newBadges });
        };

        const updateBadge = (index, field, value) => {
          const newBadges = [...badgeItems];
          newBadges[index] = { ...newBadges[index], [field]: value };
          onUpdate({ badges: newBadges });
        };

        const removeBadge = (index) => {
          const newBadges = badgeItems.filter((_, i) => i !== index);
          onUpdate({ badges: newBadges });
        };

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Allineamento</label>
                <select
                  value={settings.alignment || 'center'}
                  onChange={(e) => onUpdate({ alignment: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value="left">Sinistra</option>
                  <option value="center">Centro</option>
                  <option value="right">Destra</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Dimensione</label>
                <select
                  value={settings.size || 'medium'}
                  onChange={(e) => onUpdate({ size: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value="small">Piccolo</option>
                  <option value="medium">Medio</option>
                  <option value="large">Grande</option>
                </select>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Badge ({badgeItems.length})</label>
                <button onClick={addBadge} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {badgeItems.map((badge, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Badge {index + 1}</span>
                    <button onClick={() => removeBadge(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={badge.icon || ''}
                      onChange={(e) => updateBadge(index, 'icon', e.target.value)}
                      placeholder="✓"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '18px', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={badge.text || ''}
                      onChange={(e) => updateBadge(index, 'text', e.target.value)}
                      placeholder="Testo badge"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'number-counter':
        const counterItems = settings.items || [];

        const addCounterItem = () => {
          const newItems = [...counterItems, { value: 0, label: '', prefix: '', suffix: '' }];
          onUpdate({ items: newItems });
        };

        const updateCounterItem = (index, field, value) => {
          const newItems = [...counterItems];
          newItems[index] = { ...newItems[index], [field]: value };
          onUpdate({ items: newItems });
        };

        const removeCounterItem = (index) => {
          const newItems = counterItems.filter((_, i) => i !== index);
          onUpdate({ items: newItems });
        };

        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
              <select
                value={settings.columns || 4}
                onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Contatori ({counterItems.length})</label>
                <button onClick={addCounterItem} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {counterItems.map((item, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Contatore {index + 1}</span>
                    <button onClick={() => removeCounterItem(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={item.prefix || ''}
                      onChange={(e) => updateCounterItem(index, 'prefix', e.target.value)}
                      placeholder="€"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', textAlign: 'center' }}
                    />
                    <input
                      type="number"
                      value={item.value || 0}
                      onChange={(e) => updateCounterItem(index, 'value', parseInt(e.target.value) || 0)}
                      placeholder="1000"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={item.suffix || ''}
                      onChange={(e) => updateCounterItem(index, 'suffix', e.target.value)}
                      placeholder="+"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', textAlign: 'center' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={item.label || ''}
                    onChange={(e) => updateCounterItem(index, 'label', e.target.value)}
                    placeholder="Etichetta (es. Clienti soddisfatti)"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'team-showcase':
        const teamMembers = settings.members || [];

        const addTeamMember = () => {
          const newMembers = [...teamMembers, { name: '', role: '', email: '', phone: '', image: '' }];
          onUpdate({ members: newMembers });
        };

        const updateTeamMember = (index, field, value) => {
          const newMembers = [...teamMembers];
          newMembers[index] = { ...newMembers[index], [field]: value };
          onUpdate({ members: newMembers });
        };

        const removeTeamMember = (index) => {
          const newMembers = teamMembers.filter((_, i) => i !== index);
          onUpdate({ members: newMembers });
        };

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Colonne</label>
                <select
                  value={settings.columns || 3}
                  onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showRole !== false}
                    onChange={(e) => onUpdate({ showRole: e.target.checked })}
                  />
                  <span style={{ fontSize: '12px' }}>Mostra ruolo</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showContact !== false}
                    onChange={(e) => onUpdate({ showContact: e.target.checked })}
                  />
                  <span style={{ fontSize: '12px' }}>Mostra contatti</span>
                </label>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Membri ({teamMembers.length})</label>
                <button onClick={addTeamMember} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #85FF00',
                  background: 'rgba(133, 255, 0, 0.1)', color: '#1A1A1A', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaPlus size={8} /> Aggiungi
                </button>
              </div>
              {teamMembers.map((member, index) => (
                <div key={index} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>Membro {index + 1}</span>
                    <button onClick={() => removeTeamMember(index)} style={{
                      background: '#FEE2E2', border: 'none', borderRadius: '4px',
                      width: '22px', height: '22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaTimes size={10} color="#DC2626" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={member.image || ''}
                    onChange={(e) => updateTeamMember(index, 'image', e.target.value)}
                    placeholder="URL immagine"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={member.name || ''}
                      onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                      placeholder="Nome"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', fontWeight: '600' }}
                    />
                    <input
                      type="text"
                      value={member.role || ''}
                      onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                      placeholder="Ruolo"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="email"
                      value={member.email || ''}
                      onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                      placeholder="Email"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                    <input
                      type="tel"
                      value={member.phone || ''}
                      onChange={(e) => updateTeamMember(index, 'phone', e.target.value)}
                      placeholder="Telefono"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      default:
        return (
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Editor per "{type}" in costruzione
          </p>
        );
    }
  };

  const Icon = ICON_MAP[componentDef?.icon] || FaCube;

  return (
    <>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #E5E7EB', background: '#3B82F6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon style={{ color: '#3B82F6', fontSize: '14px' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                {componentDef?.name || type}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#FFFFFF', opacity: 0.8 }}>
                Componente selezionato
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaTimes size={12} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {renderSettings()}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onMove('up')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #E5E7EB', background: '#FFFFFF',
            cursor: 'pointer', fontSize: '12px',
            fontWeight: '500'
          }}
        >
          ↑ Su
        </button>
        <button
          onClick={() => onMove('down')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #E5E7EB', background: '#FFFFFF',
            cursor: 'pointer', fontSize: '12px',
            fontWeight: '500'
          }}
        >
          ↓ Giù
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '10px 16px', borderRadius: '8px',
            border: 'none', background: '#DC2626',
            color: '#FFFFFF', cursor: 'pointer'
          }}
        >
          <FaTrash size={12} />
        </button>
      </div>
    </>
  );
};

// Global Styles Editor
const GlobalStylesEditor = ({ globalStyles, onUpdate }) => {
  const updateColor = (key, value) => {
    onUpdate({
      ...globalStyles,
      colors: { ...globalStyles.colors, [key]: value }
    });
  };

  return (
    <>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaPalette style={{ color: '#FFFFFF', fontSize: '16px' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1A1A1A' }}>
              Stili Globali
            </h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>
              Colori e impostazioni
            </p>
          </div>
        </div>
      </div>

      {/* Selection hint */}
      <div style={{
        margin: '16px',
        padding: '16px',
        background: '#F0FDF4',
        borderRadius: '10px',
        border: '1px solid #85FF0033'
      }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#166534', lineHeight: '1.5' }}>
          <strong>Come funziona:</strong><br />
          • Clicca su un'<strong>area</strong> per modificare lo sfondo<br />
          • Clicca su un <strong>componente</strong> per personalizzarlo
        </p>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '12px', fontWeight: '600' }}>
            COLORI GLOBALI
          </label>
          {[
            { key: 'accent', label: 'Accent' },
            { key: 'primary', label: 'Primario' },
            { key: 'text', label: 'Testo' }
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={globalStyles?.colors?.[key] || '#000000'}
                  onChange={(e) => updateColor(key, e.target.value)}
                  style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={globalStyles?.colors?.[key] || ''}
                  onChange={(e) => updateColor(key, e.target.value)}
                  style={{ width: '80px', padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '11px' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '12px', fontWeight: '600' }}>
            BORDER RADIUS
          </label>
          <input
            type="number"
            value={globalStyles?.borderRadius || 12}
            onChange={(e) => onUpdate({ ...globalStyles, borderRadius: parseInt(e.target.value) || 12 })}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
          />
        </div>
      </div>
    </>
  );
};

export default CatalogBuilder;
