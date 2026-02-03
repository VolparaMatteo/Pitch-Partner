import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { clubAPI } from '../services/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import ProposalAreaRenderer from '../components/proposal/ProposalAreaRenderer';
import {
  TEMPLATES,
  COMPONENT_TYPES,
  COMPONENT_CATEGORIES,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_AREA_SETTINGS,
  getTemplateById,
  generateId,
  createArea,
  createComponent
} from '../components/proposal/templates';
import {
  FaArrowLeft, FaSave, FaEye, FaPlus, FaTrash, FaCopy, FaShare,
  FaHeading, FaAlignLeft, FaImage, FaTable, FaCalculator,
  FaFileContract, FaHandshake, FaUser, FaBuilding, FaCalendarAlt,
  FaEuroSign, FaListOl, FaQuoteLeft, FaCheckCircle, FaMinus,
  FaEnvelope, FaPhone, FaPalette, FaCube, FaLayerGroup,
  FaChevronUp, FaChevronDown, FaSearch, FaCheck, FaTimes,
  FaUserTie, FaBriefcase
} from 'react-icons/fa';

// Icon mapping
const ICON_MAP = {
  FaHeading, FaAlignLeft, FaImage, FaTable, FaCalculator,
  FaFileContract, FaHandshake, FaUser, FaBuilding, FaCalendarAlt,
  FaEuroSign, FaListOl, FaQuoteLeft, FaCheckCircle, FaMinus,
  FaEnvelope, FaPhone, FaCube
};

function ProposalBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadIdFromUrl = searchParams.get('lead_id');
  const isEditing = !!id;

  // Core state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Proposal data
  const [proposalData, setProposalData] = useState({
    titolo: '',
    sottotitolo: '',
    lead_id: leadIdFromUrl ? parseInt(leadIdFromUrl) : null,
    sponsor_id: null,
    destinatario_azienda: '',
    destinatario_nome: '',
    destinatario_ruolo: '',
    destinatario_email: '',
    destinatario_telefono: '',
    settore_merceologico: '',
    messaggio_introduttivo: '',
    proposta_valore: '',
    termini_condizioni: '',
    note_interne: '',
    durata_mesi: 12,
    stagioni: '',
    giorni_validita: 30,
    sconto_percentuale: 0,
    modalita_pagamento: 'unica_soluzione',
    numero_rate: 1
  });

  // Items
  const [items, setItems] = useState([]);

  // Layout state
  const [areas, setAreas] = useState([]);
  const [globalStyles, setGlobalStyles] = useState(DEFAULT_GLOBAL_STYLES);

  // UI state
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('header');
  const [showTemplateSelector, setShowTemplateSelector] = useState(!isEditing);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // Modals
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);

  // Data for modals
  const [leads, setLeads] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clubData, setClubData] = useState(null);

  // Search states
  const [searchLead, setSearchLead] = useState('');
  const [searchSponsor, setSearchSponsor] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Load data
  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load club data
      const clubRes = await clubAPI.getProfile();
      setClubData(clubRes.data.club);

      // Load leads, sponsors, inventory
      const [leadsRes, sponsorsRes, inventoryRes, categoriesRes] = await Promise.all([
        clubAPI.getLeads().catch(() => ({ data: { leads: [] } })),
        clubAPI.getSponsors().catch(() => ({ data: { sponsors: [] } })),
        clubAPI.getInventoryAssets().catch(() => ({ data: { assets: [] } })),
        clubAPI.getAssetCategories().catch(() => ({ data: { categories: [] } }))
      ]);

      setLeads(leadsRes.data.leads || []);
      setSponsors(sponsorsRes.data.sponsors || []);
      setInventory(inventoryRes.data.assets || []);
      setCategories(categoriesRes.data.categories || []);

      // If lead_id from URL, pre-select the lead
      if (leadIdFromUrl && !isEditing) {
        const lead = (leadsRes.data.leads || []).find(l => l.id === parseInt(leadIdFromUrl));
        if (lead) {
          setProposalData(prev => ({
            ...prev,
            lead_id: lead.id,
            destinatario_azienda: lead.azienda || '',
            destinatario_nome: lead.nome || '',
            destinatario_ruolo: lead.ruolo || '',
            destinatario_email: lead.email || '',
            destinatario_telefono: lead.telefono || '',
            settore_merceologico: lead.settore || ''
          }));
        }
      }

      // Load existing proposal if editing
      if (isEditing) {
        const res = await clubAPI.getProposal(id);
        const proposal = res.data.proposal;

        // Set proposal data
        setProposalData({
          titolo: proposal.titolo || '',
          sottotitolo: proposal.sottotitolo || '',
          lead_id: proposal.lead_id,
          sponsor_id: proposal.sponsor_id,
          destinatario_azienda: proposal.destinatario_azienda || '',
          destinatario_nome: proposal.destinatario_nome || '',
          destinatario_ruolo: proposal.destinatario_ruolo || '',
          destinatario_email: proposal.destinatario_email || '',
          destinatario_telefono: proposal.destinatario_telefono || '',
          settore_merceologico: proposal.settore_merceologico || '',
          messaggio_introduttivo: proposal.messaggio_introduttivo || '',
          proposta_valore: proposal.proposta_valore || '',
          termini_condizioni: proposal.termini_condizioni || '',
          note_interne: proposal.note_interne || '',
          durata_mesi: proposal.durata_mesi || 12,
          stagioni: proposal.stagioni || '',
          giorni_validita: proposal.giorni_validita || 30,
          sconto_percentuale: proposal.sconto_percentuale || 0,
          modalita_pagamento: proposal.modalita_pagamento || 'unica_soluzione',
          numero_rate: proposal.numero_rate || 1
        });

        // Set items
        setItems(proposal.items || []);

        // Parse layout_json if exists
        if (proposal.layout_json) {
          try {
            const layoutData = typeof proposal.layout_json === 'string'
              ? JSON.parse(proposal.layout_json)
              : proposal.layout_json;

            if (layoutData.version === '2.0' && layoutData.areas) {
              setAreas(layoutData.areas);
              setGlobalStyles(layoutData.globalStyles || DEFAULT_GLOBAL_STYLES);
              setShowTemplateSelector(false);
            } else {
              // Old format - use default template
              const template = getTemplateById('standard');
              setAreas(JSON.parse(JSON.stringify(template.areas)));
              setGlobalStyles(template.globalStyles);
              setShowTemplateSelector(false);
            }
          } catch (e) {
            console.error('Error parsing layout_json:', e);
            const template = getTemplateById('standard');
            setAreas(JSON.parse(JSON.stringify(template.areas)));
            setGlobalStyles(template.globalStyles);
          }
        } else {
          // No layout - use standard template
          const template = getTemplateById('standard');
          setAreas(JSON.parse(JSON.stringify(template.areas)));
          setGlobalStyles(template.globalStyles);
          setShowTemplateSelector(false);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ type: 'error', message: 'Errore nel caricamento dei dati' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.valore_totale || 0), 0);
    const discountValue = subtotal * (proposalData.sconto_percentuale || 0) / 100;
    const total = subtotal - discountValue;
    return { subtotal, discountValue, total };
  };

  // Template selection
  const handleSelectTemplate = (templateId) => {
    const template = getTemplateById(templateId);
    setAreas(JSON.parse(JSON.stringify(template.areas)));
    setGlobalStyles(template.globalStyles);
    setShowTemplateSelector(false);
  };

  // Area operations
  const handleAddArea = () => {
    const newArea = createArea();
    setAreas([...areas, newArea]);
    setSelectedAreaId(newArea.id);
    setSelectedComponentId(null);
  };

  const handleDeleteArea = (areaId) => {
    if (areas.length <= 1) {
      setToast({ type: 'warning', message: 'Devi avere almeno un\'area' });
      return;
    }
    setAreas(areas.filter(a => a.id !== areaId));
    if (selectedAreaId === areaId) {
      setSelectedAreaId(null);
      setSelectedComponentId(null);
    }
  };

  const handleMoveArea = (areaId, direction) => {
    const index = areas.findIndex(a => a.id === areaId);
    if (direction === 'up' && index > 0) {
      const newAreas = [...areas];
      [newAreas[index], newAreas[index - 1]] = [newAreas[index - 1], newAreas[index]];
      setAreas(newAreas);
    } else if (direction === 'down' && index < areas.length - 1) {
      const newAreas = [...areas];
      [newAreas[index], newAreas[index + 1]] = [newAreas[index + 1], newAreas[index]];
      setAreas(newAreas);
    }
  };

  // Component operations
  const handleAddComponent = (componentType, areaId) => {
    const newComponent = createComponent(componentType);
    if (!newComponent) return;

    setAreas(areas.map(area => {
      if (area.id === areaId) {
        return { ...area, components: [...area.components, newComponent] };
      }
      return area;
    }));

    setSelectedComponentId(newComponent.id);
    setSelectedAreaId(areaId);
  };

  const handleDeleteComponent = (componentId, areaId) => {
    setAreas(areas.map(area => {
      if (area.id === areaId) {
        return { ...area, components: area.components.filter(c => c.id !== componentId) };
      }
      return area;
    }));

    if (selectedComponentId === componentId) {
      setSelectedComponentId(null);
    }
  };

  const handleUpdateComponent = (componentId, areaId, updates) => {
    setAreas(areas.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          components: area.components.map(c => {
            if (c.id === componentId) {
              return { ...c, settings: { ...c.settings, ...updates } };
            }
            return c;
          })
        };
      }
      return area;
    }));
  };

  const handleUpdateAreaSettings = (areaId, updates) => {
    setAreas(areas.map(area => {
      if (area.id === areaId) {
        return { ...area, settings: { ...area.settings, ...updates } };
      }
      return area;
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e, areaId, index) => {
    e.preventDefault();
    setDropTarget({ areaId, index });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e, targetAreaId, targetIndex) => {
    e.preventDefault();

    if (!draggedItem) return;

    if (draggedItem.type === 'new') {
      // Adding new component
      const newComponent = createComponent(draggedItem.componentType);
      if (newComponent) {
        setAreas(prevAreas => prevAreas.map(area => {
          if (area.id === targetAreaId) {
            const newComponents = [...area.components];
            newComponents.splice(targetIndex, 0, newComponent);
            return { ...area, components: newComponents };
          }
          return area;
        }));
        setSelectedComponentId(newComponent.id);
        setSelectedAreaId(targetAreaId);
      }
    } else if (draggedItem.type === 'existing') {
      // Moving existing component
      const { componentId, sourceAreaId } = draggedItem;

      setAreas(prevAreas => {
        let movedComponent = null;

        // First, find and remove the component from source
        const areasAfterRemove = prevAreas.map(area => {
          if (area.id === sourceAreaId) {
            const comp = area.components.find(c => c.id === componentId);
            if (comp) movedComponent = comp;
            return { ...area, components: area.components.filter(c => c.id !== componentId) };
          }
          return area;
        });

        if (!movedComponent) return prevAreas;

        // Then add to target
        return areasAfterRemove.map(area => {
          if (area.id === targetAreaId) {
            const newComponents = [...area.components];
            // Adjust index if moving within same area and moving down
            let adjustedIndex = targetIndex;
            if (sourceAreaId === targetAreaId) {
              const oldIndex = prevAreas.find(a => a.id === sourceAreaId)?.components.findIndex(c => c.id === componentId) || 0;
              if (oldIndex < targetIndex) adjustedIndex--;
            }
            newComponents.splice(Math.max(0, adjustedIndex), 0, movedComponent);
            return { ...area, components: newComponents };
          }
          return area;
        });
      });
    }

    setDraggedItem(null);
    setDropTarget(null);
  };

  // Recipient selection
  const handleSelectLead = (lead) => {
    setProposalData({
      ...proposalData,
      lead_id: lead.id,
      sponsor_id: null,
      destinatario_azienda: lead.azienda || '',
      destinatario_nome: lead.nome || '',
      destinatario_ruolo: lead.ruolo || '',
      destinatario_email: lead.email || '',
      destinatario_telefono: lead.telefono || '',
      settore_merceologico: lead.settore || ''
    });
    setShowLeadModal(false);
  };

  const handleSelectSponsor = (sponsor) => {
    setProposalData({
      ...proposalData,
      lead_id: null,
      sponsor_id: sponsor.id,
      destinatario_azienda: sponsor.nome || '',
      destinatario_nome: sponsor.referente_nome || '',
      destinatario_ruolo: sponsor.referente_ruolo || '',
      destinatario_email: sponsor.email || '',
      destinatario_telefono: sponsor.telefono || '',
      settore_merceologico: sponsor.settore || ''
    });
    setShowSponsorModal(false);
  };

  // Item operations
  const handleAddItem = (asset) => {
    const existing = items.find(i => i.asset_id === asset.id);
    if (existing) {
      setToast({ type: 'info', message: 'Asset già aggiunto' });
      return;
    }

    const newItem = {
      id: generateId(),
      tipo: 'asset',
      asset_id: asset.id,
      nome_display: asset.nome,
      descrizione_display: asset.descrizione || '',
      quantita: 1,
      prezzo_unitario: asset.prezzo_listino || 0,
      prezzo_listino: asset.prezzo_listino || 0,
      sconto_percentuale: 0,
      valore_totale: asset.prezzo_listino || 0,
      gruppo: asset.category_name || 'Altro'
    };

    setItems([...items, newItem]);
  };

  const handleUpdateItem = (itemId, updates) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        // Recalculate total
        const base = updated.prezzo_unitario * updated.quantita;
        updated.valore_totale = base - (base * (updated.sconto_percentuale || 0) / 100);
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  // Save
  const handleSave = async () => {
    if (!proposalData.titolo) {
      setToast({ type: 'error', message: 'Inserisci un titolo' });
      return;
    }
    if (!proposalData.destinatario_azienda) {
      setToast({ type: 'error', message: 'Seleziona un destinatario' });
      return;
    }

    try {
      setSaving(true);

      const { subtotal, discountValue, total } = calculateTotals();

      const layoutJson = {
        version: '2.0',
        areas,
        globalStyles
      };

      const payload = {
        ...proposalData,
        valore_totale: subtotal,
        sconto_valore: discountValue,
        valore_finale: total,
        layout_json: JSON.stringify(layoutJson)
      };

      let proposalId;

      if (isEditing) {
        await clubAPI.updateProposal(id, payload);
        proposalId = id;

        // Update items - delete all and re-add
        const currentItems = (await clubAPI.getProposal(id)).data.proposal.items || [];
        for (const item of currentItems) {
          await clubAPI.deleteProposalItem(id, item.id);
        }
      } else {
        const res = await clubAPI.createProposalBuilder(payload);
        proposalId = res.data.proposal.id;
      }

      // Add items
      for (const item of items) {
        await clubAPI.addProposalItem(proposalId, {
          tipo: item.tipo,
          asset_id: item.asset_id,
          nome_display: item.nome_display,
          descrizione_display: item.descrizione_display,
          quantita: item.quantita,
          prezzo_unitario: item.prezzo_unitario,
          sconto_percentuale: item.sconto_percentuale,
          valore_totale: item.valore_totale,
          gruppo: item.gruppo
        });
      }

      setToast({ type: 'success', message: isEditing ? 'Proposta aggiornata!' : 'Proposta creata!' });

      if (!isEditing) {
        navigate(`/club/proposals/${proposalId}`);
      }
    } catch (error) {
      console.error('Error saving:', error);
      setToast({ type: 'error', message: 'Errore nel salvataggio' });
    } finally {
      setSaving(false);
    }
  };

  // Get selected component and area
  const getSelectedComponent = () => {
    for (const area of areas) {
      const comp = area.components.find(c => c.id === selectedComponentId);
      if (comp) return { component: comp, areaId: area.id };
    }
    return null;
  };

  const getSelectedArea = () => areas.find(a => a.id === selectedAreaId);

  // Full proposal data with calculated totals
  const getFullProposalData = () => {
    const { subtotal, discountValue, total } = calculateTotals();
    return {
      ...proposalData,
      items,
      valore_totale: subtotal,
      sconto_valore: discountValue,
      valore_finale: total
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F5F5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #85FF00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6B7280' }}>Caricamento...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Template Selector
  if (showTemplateSelector) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F5', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/club/proposals')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6B7280', marginBottom: '30px' }}
          >
            <FaArrowLeft /> Torna alle proposte
          </button>

          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#1A1A1A' }}>
            Crea un Preventivo
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '40px' }}>
            Scegli un template per iniziare
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {Object.values(TEMPLATES).map(template => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#85FF00';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
              >
                {/* Preview */}
                <div style={{
                  height: '160px',
                  background: template.id === 'blank' ? '#F9FAFB' :
                    template.globalStyles?.colors?.primary === '#0D0D0D' ? 'linear-gradient(135deg, #0D0D0D, #1A1A1A)' :
                      'linear-gradient(135deg, #1A1A1A, #2D2D2D)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {template.id === 'blank' ? (
                    <FaPlus style={{ fontSize: '32px', color: '#9CA3AF' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#FFFFFF' }}>
                      <FaFileContract style={{ fontSize: '40px', marginBottom: '8px', color: template.globalStyles?.colors?.accent || '#85FF00' }} />
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>Preventivo</div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#1A1A1A' }}>
                    {template.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                    {template.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F5F5' }}>
      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/club/proposals')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6B7280', borderRadius: '6px' }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <input
              type="text"
              value={proposalData.titolo}
              onChange={(e) => setProposalData({ ...proposalData, titolo: e.target.value })}
              placeholder="Titolo Preventivo"
              style={{
                border: 'none',
                fontSize: '18px',
                fontWeight: '600',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'transparent',
                width: '300px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Components & Data */}
        <div style={{
          width: '300px',
          background: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
            <button
              onClick={() => setActiveCategory('data')}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                background: activeCategory === 'data' ? '#F9FAFB' : 'transparent',
                borderBottom: activeCategory === 'data' ? '2px solid #1A1A1A' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: activeCategory === 'data' ? '#1A1A1A' : '#6B7280'
              }}
            >
              <FaFileContract style={{ marginRight: '6px' }} /> Dati
            </button>
            <button
              onClick={() => setActiveCategory('header')}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                background: activeCategory !== 'data' ? '#F9FAFB' : 'transparent',
                borderBottom: activeCategory !== 'data' ? '2px solid #1A1A1A' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: activeCategory !== 'data' ? '#1A1A1A' : '#6B7280'
              }}
            >
              <FaCube style={{ marginRight: '6px' }} /> Blocchi
            </button>
          </div>

          {activeCategory === 'data' ? (
            // Data Panel
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {/* Recipient Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
                  Destinatario
                </h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    onClick={() => setShowLeadModal(true)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      background: proposalData.lead_id ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    <FaUserTie style={{ color: proposalData.lead_id ? '#10B981' : '#6B7280' }} />
                    Lead
                  </button>
                  <button
                    onClick={() => setShowSponsorModal(true)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      background: proposalData.sponsor_id ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    <FaBriefcase style={{ color: proposalData.sponsor_id ? '#10B981' : '#6B7280' }} />
                    Sponsor
                  </button>
                </div>

                {proposalData.destinatario_azienda && (
                  <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '13px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{proposalData.destinatario_azienda}</div>
                    {proposalData.destinatario_nome && (
                      <div style={{ color: '#6B7280' }}>{proposalData.destinatario_nome}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
                    Voci ({items.length})
                  </h4>
                  <button
                    onClick={() => setShowItemsModal(true)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#1A1A1A',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FaPlus /> Aggiungi
                  </button>
                </div>

                {items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map(item => (
                      <div key={item.id} style={{
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.nome_display}</div>
                            <div style={{ color: '#6B7280', fontSize: '12px' }}>
                              {item.quantita} × € {item.prezzo_unitario.toLocaleString('it-IT')}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', color: '#10B981' }}>
                              € {item.valore_totale.toLocaleString('it-IT')}
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div style={{
                      padding: '16px',
                      background: '#1A1A1A',
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ opacity: 0.7 }}>Subtotale</span>
                        <span>€ {calculateTotals().subtotal.toLocaleString('it-IT')}</span>
                      </div>
                      {proposalData.sconto_percentuale > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#85FF00' }}>
                          <span>Sconto ({proposalData.sconto_percentuale}%)</span>
                          <span>- € {calculateTotals().discountValue.toLocaleString('it-IT')}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #333', fontWeight: '700', fontSize: '16px' }}>
                        <span>Totale</span>
                        <span style={{ color: '#85FF00' }}>€ {calculateTotals().total.toLocaleString('it-IT')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px', fontSize: '13px' }}>
                    Nessuna voce aggiunta
                  </div>
                )}
              </div>

              {/* Conditions */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
                  Condizioni
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Durata (mesi)</label>
                    <input
                      type="number"
                      value={proposalData.durata_mesi}
                      onChange={(e) => setProposalData({ ...proposalData, durata_mesi: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Validità (giorni)</label>
                    <input
                      type="number"
                      value={proposalData.giorni_validita}
                      onChange={(e) => setProposalData({ ...proposalData, giorni_validita: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Sconto (%)</label>
                  <input
                    type="number"
                    value={proposalData.sconto_percentuale}
                    onChange={(e) => setProposalData({ ...proposalData, sconto_percentuale: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Stagioni</label>
                  <input
                    type="text"
                    value={proposalData.stagioni}
                    onChange={(e) => setProposalData({ ...proposalData, stagioni: e.target.value })}
                    placeholder="es. 2024/2025"
                    style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
                  Contenuti
                </h4>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Messaggio Introduttivo</label>
                  <textarea
                    value={proposalData.messaggio_introduttivo}
                    onChange={(e) => setProposalData({ ...proposalData, messaggio_introduttivo: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Proposta di Valore</label>
                  <textarea
                    value={proposalData.proposta_valore}
                    onChange={(e) => setProposalData({ ...proposalData, proposta_valore: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Termini e Condizioni</label>
                  <textarea
                    value={proposalData.termini_condizioni}
                    onChange={(e) => setProposalData({ ...proposalData, termini_condizioni: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Components Panel
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Category Tabs */}
              <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.entries(COMPONENT_CATEGORIES).map(([key, cat]) => {
                  const Icon = ICON_MAP[cat.icon] || FaCube;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      style={{
                        padding: '6px 10px',
                        border: 'none',
                        borderRadius: '6px',
                        background: activeCategory === key ? '#1A1A1A' : '#F3F4F6',
                        color: activeCategory === key ? '#FFFFFF' : '#6B7280',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon size={10} /> {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Components Grid */}
              <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
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
                            gap: '6px',
                            padding: '12px 8px',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            cursor: 'grab',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#85FF00';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#1A1A1A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon style={{ color: '#FFFFFF', fontSize: '14px' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '500', color: '#374151', textAlign: 'center' }}>
                            {comp.name}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: '#E5E7EB',
          padding: '30px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {areas.map((area, areaIndex) => (
              <div key={area.id} style={{ position: 'relative' }}>
                {/* Area Label */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: selectedAreaId === area.id ? '#85FF00' : '#1A1A1A',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: selectedAreaId === area.id ? '#1A1A1A' : '#FFFFFF'
                  }}
                >
                  Area {areaIndex + 1}
                  <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveArea(area.id, 'up'); }}
                      disabled={areaIndex === 0}
                      style={{ padding: '2px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: areaIndex === 0 ? 0.3 : 1 }}
                    >
                      <FaChevronUp size={10} color={selectedAreaId === area.id ? '#1A1A1A' : '#FFFFFF'} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveArea(area.id, 'down'); }}
                      disabled={areaIndex === areas.length - 1}
                      style={{ padding: '2px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: areaIndex === areas.length - 1 ? 0.3 : 1 }}
                    >
                      <FaChevronDown size={10} color={selectedAreaId === area.id ? '#1A1A1A' : '#FFFFFF'} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteArea(area.id); }}
                      style={{ padding: '2px', background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '4px' }}
                    >
                      <FaTrash size={10} color="#EF4444" />
                    </button>
                  </div>
                </div>

                <ProposalAreaRenderer
                  area={area}
                  globalStyles={globalStyles}
                  proposalData={getFullProposalData()}
                  clubData={clubData}
                  isPreview={true}
                  isSelected={selectedAreaId === area.id}
                  onClick={(areaId) => {
                    setSelectedAreaId(areaId);
                    setSelectedComponentId(null);
                  }}
                  onComponentClick={(componentId, areaId) => {
                    setSelectedComponentId(componentId);
                    setSelectedAreaId(areaId);
                  }}
                  selectedComponentId={selectedComponentId}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  dropTarget={dropTarget}
                  draggedItem={draggedItem}
                />
              </div>
            ))}

            {/* Add Area Button */}
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <button
                onClick={handleAddArea}
                style={{
                  padding: '12px 24px',
                  border: '2px dashed #D1D5DB',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#6B7280',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#85FF00';
                  e.currentTarget.style.color = '#85FF00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.color = '#6B7280';
                }}
              >
                <FaPlus /> Aggiungi Area
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Editor */}
        <div style={{
          width: '300px',
          background: '#FFFFFF',
          borderLeft: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {selectedComponentId && getSelectedComponent() ? (
            <ComponentEditor
              component={getSelectedComponent().component}
              areaId={getSelectedComponent().areaId}
              onUpdate={(updates) => handleUpdateComponent(selectedComponentId, getSelectedComponent().areaId, updates)}
              onDelete={() => handleDeleteComponent(selectedComponentId, getSelectedComponent().areaId)}
              onClose={() => setSelectedComponentId(null)}
            />
          ) : selectedAreaId && getSelectedArea() ? (
            <AreaEditor
              area={getSelectedArea()}
              onUpdate={(updates) => handleUpdateAreaSettings(selectedAreaId, updates)}
              onClose={() => setSelectedAreaId(null)}
            />
          ) : (
            <GlobalStylesEditor
              globalStyles={globalStyles}
              onUpdate={setGlobalStyles}
            />
          )}
        </div>
      </div>

      {/* Lead Modal */}
      <Modal isOpen={showLeadModal} onClose={() => setShowLeadModal(false)} title="Seleziona Lead">
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={searchLead}
              onChange={(e) => setSearchLead(e.target.value)}
              placeholder="Cerca lead..."
              style={{ width: '100%', padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
            />
          </div>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {leads
              .filter(l => (l.azienda || '').toLowerCase().includes(searchLead.toLowerCase()) || (l.nome || '').toLowerCase().includes(searchLead.toLowerCase()))
              .map(lead => (
                <div
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#85FF00'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                >
                  <div style={{ fontWeight: '600' }}>{lead.azienda || 'N/A'}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>{lead.nome}</div>
                </div>
              ))}
          </div>
        </div>
      </Modal>

      {/* Sponsor Modal */}
      <Modal isOpen={showSponsorModal} onClose={() => setShowSponsorModal(false)} title="Seleziona Sponsor">
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={searchSponsor}
              onChange={(e) => setSearchSponsor(e.target.value)}
              placeholder="Cerca sponsor..."
              style={{ width: '100%', padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
            />
          </div>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {sponsors
              .filter(s => (s.nome || '').toLowerCase().includes(searchSponsor.toLowerCase()))
              .map(sponsor => (
                <div
                  key={sponsor.id}
                  onClick={() => handleSelectSponsor(sponsor)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#85FF00'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                >
                  <div style={{ fontWeight: '600' }}>{sponsor.nome}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>{sponsor.settore}</div>
                </div>
              ))}
          </div>
        </div>
      </Modal>

      {/* Items Modal */}
      <Modal isOpen={showItemsModal} onClose={() => setShowItemsModal(false)} title="Aggiungi Voci" size="large">
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              placeholder="Cerca asset..."
              style={{ flex: 1, padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
            />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              style={{ padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
            >
              <option value="all">Tutte le categorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxHeight: '400px', overflow: 'auto' }}>
            {inventory
              .filter(a => {
                const matchSearch = a.nome.toLowerCase().includes(searchItem.toLowerCase());
                const matchCategory = selectedCategoryFilter === 'all' || a.categoria_id === parseInt(selectedCategoryFilter);
                return matchSearch && matchCategory;
              })
              .map(asset => {
                const isAdded = items.some(i => i.asset_id === asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => !isAdded && handleAddItem(asset)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: `2px solid ${isAdded ? '#10B981' : '#E5E7EB'}`,
                      background: isAdded ? '#F0FDF4' : '#FFFFFF',
                      cursor: isAdded ? 'default' : 'pointer',
                      opacity: isAdded ? 0.7 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{asset.nome}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{asset.category_name}</div>
                      </div>
                      {isAdded ? (
                        <FaCheck style={{ color: '#10B981' }} />
                      ) : (
                        <FaPlus style={{ color: '#6B7280' }} />
                      )}
                    </div>
                    <div style={{ marginTop: '8px', fontWeight: '600', color: '#10B981' }}>
                      € {(asset.prezzo_listino || 0).toLocaleString('it-IT')}
                    </div>
                  </div>
                );
              })}
          </div>
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button
              onClick={() => setShowItemsModal(false)}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                background: '#1A1A1A',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Fatto
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Component Editor
const ComponentEditor = ({ component, areaId, onUpdate, onDelete, onClose }) => {
  if (!component) return null;

  const { type, settings = {} } = component;
  const componentDef = COMPONENT_TYPES[type];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', background: '#3B82F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
            {componentDef?.name || type}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Generic text settings */}
        {(type === 'heading' || type === 'paragraph' || type === 'proposal-title') && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Testo</label>
              <textarea
                value={settings.text || ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            {type === 'proposal-title' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Sottotitolo</label>
                <input
                  type="text"
                  value={settings.subtitle || ''}
                  onChange={(e) => onUpdate({ subtitle: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Dimensione ({settings.fontSize || 16}px)</label>
              <input
                type="range"
                min="12"
                max="72"
                value={settings.fontSize || 16}
                onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Allineamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ alignment: align })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      background: settings.alignment === align ? '#1A1A1A' : '#FFFFFF',
                      color: settings.alignment === align ? '#FFFFFF' : '#6B7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Spacer height */}
        {type === 'spacer' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Altezza ({settings.height || 40}px)</label>
            <input
              type="range"
              min="10"
              max="200"
              value={settings.height || 40}
              onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Items table settings */}
        {type === 'items-table' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.showDescription !== false}
                  onChange={(e) => onUpdate({ showDescription: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>Mostra descrizione</span>
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.showQuantity !== false}
                  onChange={(e) => onUpdate({ showQuantity: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>Mostra quantità</span>
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.groupByCategory === true}
                  onChange={(e) => onUpdate({ groupByCategory: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>Raggruppa per categoria</span>
              </label>
            </div>
          </>
        )}

        {/* Pricing summary settings */}
        {type === 'pricing-summary' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.showSubtotal !== false}
                  onChange={(e) => onUpdate({ showSubtotal: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>Mostra subtotale</span>
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.showDiscount !== false}
                  onChange={(e) => onUpdate({ showDiscount: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>Mostra sconto</span>
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.highlightTotal !== false}
                  onChange={(e) => onUpdate({ highlightTotal: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>Evidenzia totale</span>
              </label>
            </div>
          </>
        )}

        {/* CTA settings */}
        {type === 'cta-accept' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Testo pulsante</label>
            <input
              type="text"
              value={settings.text || 'Accetta Proposta'}
              onChange={(e) => onUpdate({ text: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={onDelete}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            background: 'transparent',
            color: '#EF4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          <FaTrash /> Elimina componente
        </button>
      </div>
    </div>
  );
};

// Area Editor
const AreaEditor = ({ area, onUpdate, onClose }) => {
  const { settings = {} } = area;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', background: '#85FF00' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
            Impostazioni Area
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#1A1A1A', cursor: 'pointer' }}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Background Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '8px' }}>Sfondo</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['color', 'gradient'].map(type => (
              <button
                key={type}
                onClick={() => onUpdate({ background: { ...settings.background, type } })}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: settings.background?.type === type ? '#1A1A1A' : '#FFFFFF',
                  color: settings.background?.type === type ? '#FFFFFF' : '#6B7280',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textTransform: 'capitalize'
                }}
              >
                {type === 'color' ? 'Colore' : 'Gradiente'}
              </button>
            ))}
          </div>

          {settings.background?.type === 'color' && (
            <input
              type="color"
              value={settings.background?.color || '#FFFFFF'}
              onChange={(e) => onUpdate({ background: { ...settings.background, color: e.target.value } })}
              style={{ width: '100%', height: '40px', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}
            />
          )}

          {settings.background?.type === 'gradient' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#9CA3AF' }}>Da</label>
                <input
                  type="color"
                  value={settings.background?.gradient?.from || '#1A1A1A'}
                  onChange={(e) => onUpdate({ background: { ...settings.background, gradient: { ...settings.background?.gradient, from: e.target.value } } })}
                  style={{ width: '100%', height: '32px', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#9CA3AF' }}>A</label>
                <input
                  type="color"
                  value={settings.background?.gradient?.to || '#333333'}
                  onChange={(e) => onUpdate({ background: { ...settings.background, gradient: { ...settings.background?.gradient, to: e.target.value } } })}
                  style={{ width: '100%', height: '32px', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Text Color */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '8px' }}>Colore Testo</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['#1A1A1A', '#FFFFFF', '#6B7280'].map(color => (
              <button
                key={color}
                onClick={() => onUpdate({ textColor: color })}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: settings.textColor === color ? '3px solid #85FF00' : '1px solid #E5E7EB',
                  background: color,
                  cursor: 'pointer'
                }}
              />
            ))}
            <input
              type="color"
              value={settings.textColor || '#1A1A1A'}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              style={{ width: '36px', height: '36px', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Padding */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '8px' }}>Padding</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#9CA3AF' }}>Sopra</label>
              <input
                type="number"
                value={settings.padding?.top || 40}
                onChange={(e) => onUpdate({ padding: { ...settings.padding, top: parseInt(e.target.value) } })}
                style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#9CA3AF' }}>Sotto</label>
              <input
                type="number"
                value={settings.padding?.bottom || 40}
                onChange={(e) => onUpdate({ padding: { ...settings.padding, bottom: parseInt(e.target.value) } })}
                style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px' }}
              />
            </div>
          </div>
        </div>

        {/* Max Width */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '8px' }}>Larghezza Max ({settings.maxWidth || 800}px)</label>
          <input
            type="range"
            min="600"
            max="1200"
            value={settings.maxWidth || 800}
            onChange={(e) => onUpdate({ maxWidth: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

// Global Styles Editor
const GlobalStylesEditor = ({ globalStyles, onUpdate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
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

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Hint */}
        <div style={{
          padding: '14px',
          background: '#F9FAFB',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
            Seleziona un'area o un componente per modificarlo.
          </p>
        </div>

        {/* Colors */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
            Colori
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                value={globalStyles?.colors?.primary || '#1A1A1A'}
                onChange={(e) => onUpdate({ ...globalStyles, colors: { ...globalStyles?.colors, primary: e.target.value } })}
                style={{ width: '40px', height: '40px', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px' }}>Primario</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                value={globalStyles?.colors?.accent || '#85FF00'}
                onChange={(e) => onUpdate({ ...globalStyles, colors: { ...globalStyles?.colors, accent: e.target.value } })}
                style={{ width: '40px', height: '40px', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px' }}>Accento</span>
            </div>
          </div>
        </div>

        {/* Border Radius */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
            Arrotondamento ({globalStyles?.borderRadius || 12}px)
          </h4>
          <input
            type="range"
            min="0"
            max="30"
            value={globalStyles?.borderRadius || 12}
            onChange={(e) => onUpdate({ ...globalStyles, borderRadius: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProposalBuilder;
