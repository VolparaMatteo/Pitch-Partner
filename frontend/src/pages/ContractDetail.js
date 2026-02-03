import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contractAPI, checklistAPI, repositoryAPI, uploadAPI, clubAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import ChecklistForm from '../components/ChecklistForm';
import DocumentUploadForm from '../components/DocumentUploadForm';
import MediaUploadForm from '../components/MediaUploadForm';
import {
  FaArrowLeft, FaPen, FaTrashAlt, FaPlus, FaFileContract,
  FaEuroSign, FaCalendarAlt, FaBoxes, FaCheck, FaClipboardList,
  FaFileAlt, FaImage, FaPlay, FaDownload, FaEye, FaTimes,
  FaBuilding, FaCircle, FaInfoCircle, FaFootballBall
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const [contract, setContract] = useState(null);
  const [allocations, setAllocations] = useState([]); // Inventory allocations
  const [availableAssets, setAvailableAssets] = useState([]); // Available inventory assets
  const [checklist, setChecklist] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [media, setMedia] = useState([]);
  const [activations, setActivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [allocationForm, setAllocationForm] = useState({ quantita: 1, note: '' });
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, title: '', message: '' });

  const isClub = user?.role === 'club';

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractRes, allocationsRes, inventoryRes, checklistRes, documentsRes, mediaRes, activationsRes] = await Promise.all([
        contractAPI.getContract(id),
        contractAPI.getContractInventoryAssets(id),
        clubAPI.getInventoryAssets({ disponibile: true }),
        checklistAPI.getChecklist(id),
        repositoryAPI.getDocuments(id),
        repositoryAPI.getMedia(id),
        fetch(`${API_URL}/contracts/${id}/activations`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(async res => {
          if (!res.ok) {
            return { activations: [] };
          }
          return res.json();
        }).catch(() => {
          return { activations: [] };
        })
      ]);
      setContract(contractRes.data.contract);
      setAllocations(allocationsRes.data.allocations || []);
      setAvailableAssets(inventoryRes.data.assets || []);
      setChecklist(checklistRes.data.checklists || []);
      setDocuments(documentsRes.data.documents || []);
      setMedia(mediaRes.data.media || []);
      setActivations(activationsRes.activations || []);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContractStatus = () => {
    if (!contract) return { label: '-', className: 'draft' };
    const now = new Date();
    const dataInizio = new Date(contract.data_inizio);
    const dataFine = new Date(contract.data_fine);

    if (contract.status === 'bozza') return { label: 'Bozza', className: 'draft' };
    if (now < dataInizio) return { label: 'In attesa', className: 'pending' };
    if (now > dataFine) return { label: 'Scaduto', className: 'expired' };
    return { label: 'Attivo', className: 'active' };
  };

  const getAllocationProgress = (allocation) => {
    // Per ora non abbiamo un tracking dell'utilizzo sulle allocazioni
    // Potresti aggiungere un campo "utilizzato" in futuro
    return 0;
  };

  const handleDeleteContract = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Contratto',
      message: `Sei sicuro di voler eliminare il contratto "${contract?.nome_contratto}"? Questa azione non può essere annullata.`,
      action: async () => {
        try {
          await contractAPI.deleteContract(id);
          setToast({ message: 'Contratto eliminato con successo!', type: 'success' });
          setTimeout(() => navigate('/club/contracts'), 1500);
        } catch (error) {
          console.error('Errore eliminazione contratto:', error);
          setToast({ message: 'Errore durante l\'eliminazione del contratto', type: 'error' });
        }
      }
    });
  };

  const handleToggleChecklistItem = async (itemId, currentStatus, item) => {
    const userRole = user?.role;
    if (item.assegnato_a !== userRole) {
      setToast({
        message: 'Questa task non è assegnata a te',
        type: 'warning'
      });
      return;
    }

    try {
      await checklistAPI.updateChecklistItem(id, itemId, {
        completato: !currentStatus
      });
      await fetchData();
      setToast({
        message: !currentStatus ? 'Task completato!' : 'Task riaperto',
        type: 'success'
      });
    } catch (error) {
      console.error('Errore aggiornamento checklist:', error);
      setToast({ message: 'Errore durante l\'aggiornamento del task', type: 'error' });
    }
  };

  const handleAllocateAsset = async () => {
    if (!selectedAssetId) {
      setToast({ message: 'Seleziona un asset dall\'inventario', type: 'error' });
      return;
    }
    try {
      setFormLoading(true);
      await contractAPI.addContractInventoryAsset(id, {
        asset_id: parseInt(selectedAssetId),
        quantita: parseInt(allocationForm.quantita) || 1,
        note: allocationForm.note,
        sponsor_id: contract.sponsor?.id
      });
      await fetchData();
      setShowAllocateModal(false);
      setSelectedAssetId('');
      setAllocationForm({ quantita: 1, note: '' });
      setToast({ message: 'Asset allocato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore allocazione asset:', error);
      setToast({ message: error.response?.data?.error || 'Errore durante l\'allocazione dell\'asset', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveAllocation = (allocationId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Rimuovi Allocazione',
      message: 'Sei sicuro di voler rimuovere questa allocazione? L\'asset tornerà disponibile nell\'inventario.',
      action: async () => {
        try {
          await contractAPI.removeContractInventoryAsset(id, allocationId);
          await fetchData();
          setToast({ message: 'Allocazione rimossa con successo!', type: 'success' });
        } catch (error) {
          console.error('Errore rimozione allocazione:', error);
          setToast({ message: 'Errore durante la rimozione dell\'allocazione', type: 'error' });
        }
      }
    });
  };

  const handleCreateChecklistItem = async (checklistData) => {
    try {
      setFormLoading(true);
      await checklistAPI.createChecklistItem(id, checklistData);
      await fetchData();
      setShowChecklistModal(false);
      setToast({ message: 'Task creato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore creazione task:', error);
      setToast({ message: 'Errore durante la creazione del task', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteChecklistItem = (itemId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Task',
      message: 'Sei sicuro di voler eliminare questo task? Questa azione non può essere annullata.',
      action: async () => {
        try {
          await checklistAPI.deleteChecklistItem(id, itemId);
          await fetchData();
          setToast({ message: 'Task eliminato con successo!', type: 'success' });
        } catch (error) {
          console.error('Errore eliminazione task:', error);
          setToast({ message: 'Errore durante l\'eliminazione del task', type: 'error' });
        }
      }
    });
  };

  const handleDeleteDocument = (docId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Documento',
      message: 'Sei sicuro di voler eliminare questo documento? Questa azione non può essere annullata.',
      action: async () => {
        try {
          await repositoryAPI.deleteDocument(docId);
          await fetchData();
          setToast({ message: 'Documento eliminato con successo!', type: 'success' });
        } catch (error) {
          console.error('Errore eliminazione documento:', error);
          setToast({ message: 'Errore durante l\'eliminazione del documento', type: 'error' });
        }
      }
    });
  };

  const handleDeleteMedia = (mediaId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Media',
      message: 'Sei sicuro di voler eliminare questo media? Questa azione non può essere annullata.',
      action: async () => {
        try {
          await repositoryAPI.deleteMedia(mediaId);
          await fetchData();
          setToast({ message: 'Media eliminato con successo!', type: 'success' });
        } catch (error) {
          console.error('Errore eliminazione media:', error);
          setToast({ message: 'Errore durante l\'eliminazione del media', type: 'error' });
        }
      }
    });
  };

  const handleUploadDocument = async (data) => {
    try {
      setFormLoading(true);
      const uploadResponse = await uploadAPI.uploadDocument(data.file);
      const { file_url, file_size, file_type } = uploadResponse.data;

      await repositoryAPI.uploadDocument(contract.sponsor.id, {
        categoria: data.categoria,
        nome: data.nome,
        file_url,
        file_size,
        file_type,
        descrizione: data.descrizione,
        caricato_da: user.role,
        caricato_da_user: user.role === 'club' ? user.nome : user.ragione_sociale
      });

      await fetchData();
      setShowDocumentModal(false);
      setToast({ message: 'Documento caricato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore upload documento:', error);
      setToast({ message: 'Errore durante il caricamento del documento', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUploadMedia = async (data) => {
    try {
      setFormLoading(true);
      const uploadResponse = await uploadAPI.uploadMedia(data.file);
      const { file_url, file_size, file_type, tipo } = uploadResponse.data;

      await repositoryAPI.uploadMedia(contract.sponsor.id, {
        tipo,
        nome: data.nome,
        file_url,
        file_size,
        file_type,
        descrizione: data.descrizione,
        tags: data.tags,
        caricato_da: user.role,
        caricato_da_user: user.role === 'club' ? user.nome : user.ragione_sociale
      });

      await fetchData();
      setShowMediaModal(false);
      setToast({ message: 'Media caricato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore upload media:', error);
      setToast({ message: 'Errore durante il caricamento del media', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div className="sd-page"><div className="sd-loading">Caricamento...</div></div>;
  }

  if (!contract) {
    return <div className="sd-page"><div className="sd-loading">Contratto non trovato</div></div>;
  }

  const status = getContractStatus();
  const completedChecklist = checklist.filter(item => item.completato).length;
  const checklistProgress = checklist.length > 0
    ? Math.round((completedChecklist / checklist.length) * 100)
    : 0;

  const totalAllocatedValue = allocations.reduce((sum, alloc) => sum + (alloc.prezzo_concordato || alloc.asset?.prezzo_listino || 0), 0);

  const initials = (contract.sponsor?.ragione_sociale || 'SP').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: <FaInfoCircle />, count: null },
    { id: 'assets', label: 'Inventario', icon: <FaBoxes />, count: allocations.length },
    { id: 'checklist', label: 'Checklist', icon: <FaClipboardList />, count: `${completedChecklist}/${checklist.length}` },
    { id: 'activations', label: 'Attivazioni', icon: <FaFootballBall />, count: activations.length },
    { id: 'documents', label: 'Documenti', icon: <FaFileAlt />, count: documents.length },
    { id: 'media', label: 'Media', icon: <FaImage />, count: media.length }
  ];

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR - Contract Info Card */}
        <div className="sd-profile-card">
          {/* Header with dark background */}
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate(-1)}>
              <FaArrowLeft />
            </button>
            {isClub && (
              <div className="sd-header-actions">
                <button className="sd-header-btn edit" onClick={() => navigate(`/club/contracts/${id}/edit`)}>
                  <FaPen />
                </button>
                <button className="sd-header-btn delete" onClick={handleDeleteContract}>
                  <FaTrashAlt />
                </button>
              </div>
            )}
          </div>

          {/* Avatar Section */}
          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar">
              {contract.sponsor?.logo_url ? (
                <img
                  src={contract.sponsor.logo_url.startsWith('http') ? contract.sponsor.logo_url : `${API_URL.replace('/api', '')}${contract.sponsor.logo_url}`}
                  alt={contract.sponsor.ragione_sociale}
                />
              ) : (
                <div className="sd-profile-avatar-placeholder">{initials}</div>
              )}
            </div>
            <h1 className="sd-profile-name">{contract.nome_contratto}</h1>
            <p className="sd-profile-sector">{contract.sponsor?.ragione_sociale}</p>
            <span className={`sd-profile-status ${status.className}`}>
              <FaCircle /> {status.label}
            </span>
          </div>

          {/* Profile Body */}
          <div className="sd-profile-body">
            {/* Contract Details */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Dettagli Contratto</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Compenso</span>
                  <span className="sd-info-value" style={{ color: '#059669', fontWeight: 700 }}>
                    €{contract.compenso?.toLocaleString()}
                  </span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Data Inizio</span>
                  <span className="sd-info-value">
                    {new Date(contract.data_inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Data Fine</span>
                  <span className="sd-info-value">
                    {new Date(contract.data_fine).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Durata</span>
                  <span className="sd-info-value">
                    {Math.ceil((new Date(contract.data_fine) - new Date(contract.data_inizio)) / (1000 * 60 * 60 * 24 * 30))} mesi
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Progresso</h3>
              <div className="sd-info-list">
                <div className="sd-info-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="sd-info-label">Checklist</span>
                    <span className="sd-info-value" style={{ fontWeight: 600 }}>{checklistProgress}%</span>
                  </div>
                  <div style={{ background: '#F0F0F0', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      background: '#85FF00',
                      width: `${checklistProgress}%`,
                      height: '100%',
                      borderRadius: '8px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                <div className="sd-info-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="sd-info-label">Asset Allocati</span>
                    <span className="sd-info-value" style={{ fontWeight: 600 }}>{allocations.length}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Valore: €{totalAllocatedValue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {contract.descrizione && (
              <div className="sd-profile-section">
                <h3 className="sd-section-title">Descrizione</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                  {contract.descrizione}
                </p>
              </div>
            )}

            {/* Sponsor Link */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Sponsor</h3>
              <button
                className="sd-btn sd-btn-outline"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate(`/club/sponsors/${contract.sponsor?.id}`)}
              >
                <FaBuilding /> Vai allo Sponsor
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="sd-main">
          {/* Stats Row */}
          <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Compenso Totale</div>
              <div className="tp-stat-value">€{contract.compenso?.toLocaleString()}</div>
              <div className="tp-stat-description">valore contratto</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Asset Allocati</div>
              <div className="tp-stat-value">{allocations.length}</div>
              <div className="tp-stat-description">dall'inventario</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Task Completati</div>
              <div className="tp-stat-value">{completedChecklist}/{checklist.length}</div>
              <div className="tp-stat-description">checklist</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Durata</div>
              <div className="tp-stat-value">{Math.ceil((new Date(contract.data_fine) - new Date(contract.data_inizio)) / (1000 * 60 * 60 * 24 * 30))}</div>
              <div className="tp-stat-description">mesi</div>
            </div>
          </div>

          {/* Content Card with Tabs */}
          <div className="sd-content-card">
            {/* Tabs Navigation */}
            <div className="sd-tabs-nav" style={{ overflowX: 'auto' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sd-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="sd-tab-icon">{tab.icon}</span>
                  {tab.label}
                  {tab.count !== null && <span className="sd-tab-count">{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="sd-tab-content">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaInfoCircle /> Panoramica Contratto</h2>
                  </div>

                  {/* Contract Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px'
                  }}>
                    {/* Checklist Progress Card */}
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#1A1A1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <FaClipboardList />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                            Progresso Checklist
                          </h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                            {completedChecklist} di {checklist.length} task completati
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1, background: '#E5E7EB', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
                          <div style={{
                            background: '#85FF00',
                            width: `${checklistProgress}%`,
                            height: '100%',
                            borderRadius: '8px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', minWidth: '50px', textAlign: 'right' }}>
                          {checklistProgress}%
                        </span>
                      </div>
                    </div>

                    {/* Inventory Allocations Card */}
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#1A1A1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <FaBoxes />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                            Asset Inventario
                          </h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                            {allocations.length} asset allocati al contratto
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>Valore totale allocato</span>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>
                          €{totalAllocatedValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div>
                      <h3 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>
                        Azioni Rapide
                      </h3>
                      <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>
                        Gestisci il contratto con un click
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        className="sd-btn"
                        style={{ background: 'white', color: '#1A1A1A' }}
                        onClick={() => setActiveTab('assets')}
                      >
                        <FaBoxes /> Gestisci Asset
                      </button>
                      <button
                        className="sd-btn"
                        style={{ background: 'white', color: '#1A1A1A' }}
                        onClick={() => setActiveTab('checklist')}
                      >
                        <FaClipboardList /> Gestisci Task
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Assets Tab - Inventory Allocations */}
              {activeTab === 'assets' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaBoxes /> Asset dall'Inventario</h2>
                    {isClub && (
                      <button className="sd-btn sd-btn-primary" onClick={() => setShowAllocateModal(true)}>
                        <FaPlus /> Alloca Asset
                      </button>
                    )}
                  </div>

                  {allocations.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                      gap: '20px'
                    }}>
                      {allocations.map(allocation => (
                        <div key={allocation.id} className="sd-contract-card" style={{ cursor: 'default' }}>
                          <div className="sd-contract-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {allocation.asset?.immagine_principale && (
                                <img
                                  src={allocation.asset.immagine_principale.startsWith('http')
                                    ? allocation.asset.immagine_principale
                                    : `${API_URL.replace('/api', '')}${allocation.asset.immagine_principale}`}
                                  alt={allocation.asset?.nome}
                                  style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <h3 className="sd-contract-title">{allocation.asset?.nome || 'Asset'}</h3>
                                <p className="sd-contract-desc" style={{ margin: 0 }}>
                                  {allocation.asset?.codice && <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{allocation.asset.codice}</span>}
                                </p>
                              </div>
                            </div>
                            <span className="sd-contract-status active" style={{ fontSize: '11px' }}>
                              {allocation.status || 'attiva'}
                            </span>
                          </div>

                          <div style={{
                            background: '#F9FAFB',
                            borderRadius: '12px',
                            padding: '16px',
                            marginTop: '16px'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>Quantità</span>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>
                                  {allocation.quantita || 1}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>Valore</span>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
                                  €{(allocation.prezzo_concordato || allocation.asset?.prezzo_listino || 0).toLocaleString()}
                                </span>
                              </div>
                              {allocation.stagione && (
                                <div>
                                  <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>Stagione</span>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                                    {allocation.stagione}
                                  </span>
                                </div>
                              )}
                              {allocation.data_inizio && (
                                <div>
                                  <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>Periodo</span>
                                  <span style={{ fontSize: '12px', color: '#1A1A1A' }}>
                                    {new Date(allocation.data_inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                                    {allocation.data_fine && ` - ${new Date(allocation.data_fine).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`}
                                  </span>
                                </div>
                              )}
                            </div>
                            {allocation.note && (
                              <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
                                {allocation.note}
                              </p>
                            )}
                          </div>

                          {isClub && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                              <button
                                className="sd-btn sd-btn-outline"
                                style={{ flex: 1 }}
                                onClick={() => navigate(`/club/inventory/${allocation.asset_id}`)}
                              >
                                <FaEye /> Vedi nell'Inventario
                              </button>
                              <button
                                className="sd-btn"
                                style={{ background: '#FEE2E2', color: '#DC2626' }}
                                onClick={() => handleRemoveAllocation(allocation.id)}
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaBoxes /></div>
                      <h3 className="sd-empty-title">Nessun asset allocato</h3>
                      <p className="sd-empty-desc">Alloca asset dall'inventario per associarli a questo contratto</p>
                      {isClub && (
                        <button className="sd-btn sd-btn-primary" onClick={() => setShowAllocateModal(true)}>
                          <FaPlus /> Alloca Asset
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Checklist Tab */}
              {activeTab === 'checklist' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaClipboardList /> Checklist Task</h2>
                    <button className="sd-btn sd-btn-primary" onClick={() => setShowChecklistModal(true)}>
                      <FaPlus /> Aggiungi Task
                    </button>
                  </div>

                  {checklist.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {checklist.map(item => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '20px',
                            background: item.completato ? '#F9FAFB' : 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            opacity: item.completato ? 0.7 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.completato}
                            onChange={() => handleToggleChecklistItem(item.id, item.completato, item)}
                            style={{
                              width: '22px',
                              height: '22px',
                              cursor: 'pointer',
                              accentColor: '#85FF00',
                              marginTop: '2px',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{
                              margin: '0 0 4px 0',
                              fontSize: '15px',
                              fontWeight: 600,
                              color: '#1A1A1A',
                              textDecoration: item.completato ? 'line-through' : 'none'
                            }}>
                              {item.titolo}
                            </h4>
                            {item.descrizione && (
                              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6B7280' }}>
                                {item.descrizione}
                              </p>
                            )}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                background: item.assegnato_a === 'club' ? '#85FF00' : '#1A1A1A',
                                color: item.assegnato_a === 'club' ? '#1A1A1A' : 'white',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {item.assegnato_a === 'club' ? 'Club' : 'Sponsor'}
                              </span>
                              {item.scadenza && !item.completato && (
                                <span style={{
                                  background: '#FEF3C7',
                                  color: '#D97706',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <FaCalendarAlt /> Scadenza: {new Date(item.scadenza).toLocaleDateString('it-IT')}
                                </span>
                              )}
                              {item.completato && item.completato_il && (
                                <span style={{
                                  background: '#D1FAE5',
                                  color: '#059669',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <FaCheck /> Completata il {new Date(item.completato_il).toLocaleDateString('it-IT')}
                                </span>
                              )}
                            </div>
                            {item.created_at && (
                              <p style={{
                                margin: '12px 0 0 0',
                                paddingTop: '12px',
                                borderTop: '1px solid #E5E7EB',
                                fontSize: '11px',
                                color: '#9CA3AF'
                              }}>
                                Creata {item.creato_da === 'club' ? 'dal Club' : 'dallo Sponsor'} {item.creato_da_user && `(${item.creato_da_user})`} il {new Date(item.created_at + 'Z').toLocaleDateString('it-IT')}
                              </p>
                            )}
                          </div>
                          {isClub && (
                            <button
                              className="sd-action-btn delete"
                              onClick={() => handleDeleteChecklistItem(item.id)}
                            >
                              <FaTrashAlt />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaClipboardList /></div>
                      <h3 className="sd-empty-title">Nessun task presente</h3>
                      <p className="sd-empty-desc">Crea task per gestire le attività del contratto</p>
                      <button className="sd-btn sd-btn-primary" onClick={() => setShowChecklistModal(true)}>
                        <FaPlus /> Aggiungi Task
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Activations Tab */}
              {activeTab === 'activations' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaFootballBall /> Attivazioni Match</h2>
                  </div>

                  {activations.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Partita</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Asset</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Tipo</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Quantità</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Stato</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activations.map(activation => (
                            <tr key={activation.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <td style={{ padding: '16px 12px' }}>
                                {activation.match ? (
                                  <div>
                                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>vs {activation.match.avversario}</div>
                                    <small style={{ color: '#6B7280' }}>
                                      {new Date(activation.match.data_ora).toLocaleDateString('it-IT', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </small>
                                  </div>
                                ) : (
                                  <span style={{ color: '#9CA3AF' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '16px 12px' }}>
                                {activation.asset ? (
                                  <div>
                                    <div style={{ fontWeight: 500 }}>{activation.asset.nome}</div>
                                    <small style={{ color: '#6B7280' }}>{activation.asset.categoria}</small>
                                  </div>
                                ) : (
                                  <span style={{ color: '#9CA3AF' }}>Nessuno</span>
                                )}
                              </td>
                              <td style={{ padding: '16px 12px' }}>
                                <span style={{
                                  background: '#F3F4F6',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontSize: '13px'
                                }}>
                                  {activation.tipo}
                                </span>
                              </td>
                              <td style={{ padding: '16px 12px' }}>
                                {activation.quantita_utilizzata ? (
                                  <span style={{ fontWeight: 600, color: '#059669' }}>
                                    {activation.quantita_utilizzata}
                                    {activation.asset?.quantita_totale && ` / ${activation.asset.quantita_totale}`}
                                  </span>
                                ) : (
                                  <span style={{ color: '#9CA3AF' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '16px 12px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  background: activation.stato === 'confermata' ? '#D1FAE5' :
                                    activation.stato === 'eseguita' ? '#D1FAE5' : '#FEF3C7',
                                  color: activation.stato === 'confermata' ? '#059669' :
                                    activation.stato === 'eseguita' ? '#059669' : '#D97706'
                                }}>
                                  {activation.stato}
                                </span>
                              </td>
                              <td style={{ padding: '16px 12px', fontSize: '13px', color: '#6B7280' }}>
                                {new Date(activation.created_at).toLocaleDateString('it-IT')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaFootballBall /></div>
                      <h3 className="sd-empty-title">Nessuna attivazione</h3>
                      <p className="sd-empty-desc">Le attivazioni vengono create dalle pagine delle partite</p>
                    </div>
                  )}
                </>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaFileAlt /> Documenti</h2>
                    <button className="sd-btn sd-btn-primary" onClick={() => setShowDocumentModal(true)}>
                      <FaPlus /> Carica Documento
                    </button>
                  </div>

                  {documents.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '16px'
                    }}>
                      {documents.map(doc => (
                        <div key={doc.id} className="sd-contract-card" style={{ cursor: 'default' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'start', marginBottom: '12px' }}>
                            <div style={{
                              background: '#85FF00',
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FaFileAlt style={{ color: '#1A1A1A', fontSize: '20px' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                {doc.nome}
                              </h4>
                              <span style={{
                                display: 'inline-block',
                                background: '#1A1A1A',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}>
                                {doc.categoria}
                              </span>
                            </div>
                          </div>
                          {doc.descrizione && (
                            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                              {doc.descrizione}
                            </p>
                          )}
                          <p style={{
                            margin: '0 0 12px 0',
                            paddingTop: '12px',
                            borderTop: '1px solid #E5E7EB',
                            fontSize: '11px',
                            color: '#9CA3AF'
                          }}>
                            Caricato {doc.caricato_da === 'club' ? 'dal Club' : 'dallo Sponsor'} il {new Date(doc.created_at + 'Z').toLocaleDateString('it-IT')}
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                              href={doc.file_url.startsWith('http') ? doc.file_url : `${API_URL.replace('/api', '')}${doc.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sd-btn sd-btn-primary"
                              style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
                            >
                              <FaEye /> Visualizza
                            </a>
                            {isClub && (
                              <button
                                className="sd-btn"
                                style={{ background: '#FEE2E2', color: '#DC2626' }}
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <FaTrashAlt />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaFileAlt /></div>
                      <h3 className="sd-empty-title">Nessun documento</h3>
                      <p className="sd-empty-desc">Carica documenti relativi al contratto</p>
                      <button className="sd-btn sd-btn-primary" onClick={() => setShowDocumentModal(true)}>
                        <FaPlus /> Carica Documento
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaImage /> Media Gallery</h2>
                    <button className="sd-btn sd-btn-primary" onClick={() => setShowMediaModal(true)}>
                      <FaPlus /> Carica Media
                    </button>
                  </div>

                  {media.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px'
                    }}>
                      {media.map(item => (
                        <div key={item.id} style={{
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '16px',
                          overflow: 'hidden'
                        }}>
                          {/* Preview */}
                          <div style={{
                            background: '#F3F4F6',
                            height: '180px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            {item.tipo === 'immagine' && (
                              <img
                                src={item.file_url.startsWith('http') ? item.file_url : `${API_URL.replace('/api', '')}${item.file_url}`}
                                alt={item.nome}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            )}
                            {item.tipo === 'video' && (
                              <video
                                src={item.file_url.startsWith('http') ? item.file_url : `${API_URL.replace('/api', '')}${item.file_url}`}
                                controls
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            )}
                            {item.tipo === 'pdf' && (
                              <FaFileAlt style={{ fontSize: '48px', color: '#9CA3AF' }} />
                            )}
                          </div>

                          {/* Content */}
                          <div style={{ padding: '16px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                                {item.nome}
                              </h4>
                              <span style={{
                                display: 'inline-block',
                                background: '#1A1A1A',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}>
                                {item.tipo}
                              </span>
                            </div>

                            {item.tags && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                                {item.tags.split(',').map((tag, idx) => (
                                  <span key={idx} style={{
                                    background: '#F3F4F6',
                                    color: '#6B7280',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px'
                                  }}>
                                    #{tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.descrizione && (
                              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.4 }}>
                                {item.descrizione}
                              </p>
                            )}

                            <p style={{
                              margin: '0 0 12px 0',
                              paddingTop: '8px',
                              borderTop: '1px solid #E5E7EB',
                              fontSize: '11px',
                              color: '#9CA3AF'
                            }}>
                              Caricato il {new Date(item.created_at + 'Z').toLocaleDateString('it-IT')}
                            </p>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <a
                                href={item.file_url.startsWith('http') ? item.file_url : `${API_URL.replace('/api', '')}${item.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sd-btn sd-btn-primary"
                                style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '13px' }}
                              >
                                <FaEye /> Visualizza
                              </a>
                              {isClub && (
                                <button
                                  className="sd-btn"
                                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                                  onClick={() => handleDeleteMedia(item.id)}
                                >
                                  <FaTrashAlt />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaImage /></div>
                      <h3 className="sd-empty-title">Nessun media</h3>
                      <p className="sd-empty-desc">Carica foto e video relativi al contratto</p>
                      <button className="sd-btn sd-btn-primary" onClick={() => setShowMediaModal(true)}>
                        <FaPlus /> Carica Media
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showAllocateModal}
        onClose={() => { setShowAllocateModal(false); setSelectedAssetId(''); setAllocationForm({ quantita: 1, note: '' }); }}
        title="Alloca Asset dall'Inventario"
      >
        <div style={{ padding: '20px 0' }}>
          <div className="form-group">
            <label>Asset dall'Inventario <span className="required">*</span></label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
            >
              <option value="">Seleziona un asset...</option>
              {availableAssets.filter(a => a.disponibile && a.quantita_disponibile > 0).map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.nome} - {asset.codice} (€{asset.prezzo_listino?.toLocaleString() || 0}) - Disp: {asset.quantita_disponibile}
                </option>
              ))}
            </select>
            {availableAssets.filter(a => a.disponibile && a.quantita_disponibile > 0).length === 0 && (
              <p style={{ color: '#D97706', fontSize: '12px', marginTop: '8px' }}>
                Nessun asset disponibile nell'inventario. Vai all'inventario per aggiungerne.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Quantità</label>
            <input
              type="number"
              min="1"
              value={allocationForm.quantita}
              onChange={(e) => setAllocationForm({ ...allocationForm, quantita: parseInt(e.target.value) || 1 })}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
            />
          </div>

          <div className="form-group">
            <label>Note (opzionale)</label>
            <textarea
              value={allocationForm.note}
              onChange={(e) => setAllocationForm({ ...allocationForm, note: e.target.value })}
              placeholder="Note sull'allocazione..."
              rows={3}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              className="sd-btn sd-btn-outline"
              onClick={() => { setShowAllocateModal(false); setSelectedAssetId(''); setAllocationForm({ quantita: 1, note: '' }); }}
              disabled={formLoading}
            >
              Annulla
            </button>
            <button
              className="sd-btn sd-btn-primary"
              onClick={handleAllocateAsset}
              disabled={formLoading || !selectedAssetId}
            >
              {formLoading ? 'Allocazione...' : 'Alloca Asset'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showChecklistModal}
        onClose={() => setShowChecklistModal(false)}
        title="Aggiungi Task"
      >
        <ChecklistForm
          onSubmit={handleCreateChecklistItem}
          onCancel={() => setShowChecklistModal(false)}
          loading={formLoading}
        />
      </Modal>

      <Modal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        title="Carica Documento"
      >
        <DocumentUploadForm
          onSubmit={handleUploadDocument}
          onCancel={() => setShowDocumentModal(false)}
          loading={formLoading}
          contract={contract}
        />
      </Modal>

      <Modal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        title="Carica Media"
      >
        <MediaUploadForm
          onSubmit={handleUploadMedia}
          onCancel={() => setShowMediaModal(false)}
          loading={formLoading}
          contract={contract}
        />
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, title: '', message: '' })}
        title={confirmModal.title}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
            {confirmModal.message}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="sd-btn sd-btn-outline"
              onClick={() => setConfirmModal({ isOpen: false, action: null, title: '', message: '' })}
            >
              Annulla
            </button>
            <button
              className="sd-btn"
              style={{ background: '#EF4444', color: 'white' }}
              onClick={async () => {
                setConfirmModal({ isOpen: false, action: null, title: '', message: '' });
                if (confirmModal.action) await confirmModal.action();
              }}
            >
              Conferma
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default ContractDetail;
