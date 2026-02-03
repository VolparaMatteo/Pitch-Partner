import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import SupportWidget from '../components/SupportWidget';
import {
  FaPlus, FaSearch, FaBook, FaLink, FaCopy, FaExternalLinkAlt,
  FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaFileExcel, FaFilePdf, FaShareAlt, FaCube,
  FaTh, FaList
} from 'react-icons/fa';
import '../styles/template-style.css';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3003';

function CatalogList() {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showMenu, setShowMenu] = useState(null);
  const [toast, setToast] = useState(null);

  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [catalogToDelete, setCatalogToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const catalogRef = useRef(null);

  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchCatalogs();
  }, []);

  // Click outside handler for menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && !e.target.closest('.tp-catalog-menu')) {
        setShowMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const response = await clubAPI.getCatalogs();
      setCatalogs(response.data.catalogs || []);
    } catch (error) {
      console.error('Errore caricamento cataloghi:', error);
      setToast({ type: 'error', message: 'Errore nel caricamento dei cataloghi' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (catalog) => {
    setCatalogToDelete(catalog);
    setShowDeleteModal(true);
    setShowMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!catalogToDelete) return;
    setDeleting(true);
    try {
      await clubAPI.deleteCatalog(catalogToDelete.id);
      setCatalogs(catalogs.filter(c => c.id !== catalogToDelete.id));
      setToast({ type: 'success', message: 'Catalogo eliminato con successo' });
    } catch (error) {
      console.error('Errore eliminazione catalogo:', error);
      setToast({ type: 'error', message: 'Errore nell\'eliminazione' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setCatalogToDelete(null);
    }
  };

  const handleToggleActive = async (catalog) => {
    try {
      await clubAPI.updateCatalog(catalog.id, { attivo: !catalog.attivo });
      setCatalogs(catalogs.map(c =>
        c.id === catalog.id ? { ...c, attivo: !c.attivo } : c
      ));
      setToast({ type: 'success', message: catalog.attivo ? 'Catalogo disattivato' : 'Catalogo attivato' });
    } catch (error) {
      console.error('Errore aggiornamento catalogo:', error);
      setToast({ type: 'error', message: 'Errore nell\'aggiornamento' });
    }
    setShowMenu(null);
  };

  const getPublicUrl = (token) => `${FRONTEND_URL}/catalog/${token}`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setToast({ type: 'success', message: 'Link copiato negli appunti' });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Errore copia:', error);
    }
  };

  const handleExportExcel = async (catalog) => {
    try {
      const response = await clubAPI.exportCatalogExcel(catalog.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `catalogo_${catalog.nome}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setToast({ type: 'success', message: 'Excel scaricato' });
    } catch (error) {
      console.error('Errore export Excel:', error);
      setToast({ type: 'error', message: 'Errore nell\'export Excel' });
    }
  };

  const handleExportPdf = async (catalog) => {
    try {
      const response = await clubAPI.exportCatalogPdf(catalog.id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `catalogo_${catalog.nome}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setToast({ type: 'success', message: 'PDF scaricato' });
    } catch (error) {
      console.error('Errore export PDF:', error);
      setToast({ type: 'error', message: 'Errore nell\'export PDF' });
    }
  };

  const openShareModal = (catalog) => {
    setSelectedCatalog(catalog);
    setShowShareModal(true);
    setShowMenu(null);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => { setCurrentPage(1); }, [filterStatus, search]);

  // Filter catalogs
  const filteredCatalogs = catalogs.filter(catalog => {
    if (search) {
      const s = search.toLowerCase();
      if (!catalog.nome?.toLowerCase().includes(s) &&
        !catalog.descrizione?.toLowerCase().includes(s)) return false;
    }
    if (filterStatus === 'active' && !catalog.attivo) return false;
    if (filterStatus === 'inactive' && catalog.attivo) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredCatalogs.length / itemsPerPage);
  const paginatedCatalogs = filteredCatalogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    total: catalogs.length,
    active: catalogs.filter(c => c.attivo).length,
    inactive: catalogs.filter(c => !c.attivo).length
  };

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento cataloghi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Cataloghi Condivisibili</h1>
          <p className="tp-page-subtitle">Crea e condividi cataloghi personalizzati dei tuoi asset</p>
        </div>
        <div className="tp-header-actions">
          <button className="tp-btn tp-btn-primary" onClick={() => navigate('/club/catalogs/new')}>
            <FaPlus /> Nuovo Catalogo
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="tp-card" style={{ marginBottom: '24px' }}>
        <div className="tp-card-body" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>Status:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`tp-filter-chip ${!filterStatus ? 'active' : ''}`}
                onClick={() => setFilterStatus('')}
              >
                Tutti ({stats.total})
              </button>
              <button
                className={`tp-filter-chip ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => setFilterStatus(filterStatus === 'active' ? '' : 'active')}
              >
                <FaEye size={12} style={{ marginRight: '6px' }} />
                Attivi ({stats.active})
              </button>
              <button
                className={`tp-filter-chip ${filterStatus === 'inactive' ? 'active' : ''}`}
                onClick={() => setFilterStatus(filterStatus === 'inactive' ? '' : 'inactive')}
              >
                <FaEyeSlash size={12} style={{ marginRight: '6px' }} />
                Disattivati ({stats.inactive})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="tp-card" ref={catalogRef}>
        {/* Toolbar */}
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca catalogo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>
          </div>

          <div className="tp-card-header-right">
            <div className="tp-view-toggle">
              <button
                className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Lista"
              >
                <FaList />
              </button>
              <button
                className={`tp-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Griglia"
              >
                <FaTh />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="tp-card-body" style={{ padding: '24px' }}>
          {filteredCatalogs.length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon">
                <FaBook />
              </div>
              <h3 className="tp-empty-title">Nessun catalogo trovato</h3>
              <p className="tp-empty-description">Crea il tuo primo catalogo per condividere i tuoi asset</p>
              <button className="tp-btn tp-btn-primary" onClick={() => navigate('/club/catalogs/new')}>
                <FaPlus /> Nuovo Catalogo
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="tp-grid">
              {paginatedCatalogs.map(catalog => (
                <div key={catalog.id} className="tp-sponsor-card">
                  {/* Header */}
                  <div className="tp-sponsor-header">
                    <div className="tp-sponsor-logo" style={{ background: catalog.attivo ? '#D1FAE5' : '#F3F4F6' }}>
                      <FaBook style={{ fontSize: '24px', color: catalog.attivo ? '#059669' : '#6B7280' }} />
                    </div>
                    <span className={`tp-badge ${catalog.attivo ? 'tp-badge-success' : 'tp-badge-neutral'}`}>
                      {catalog.attivo ? 'Attivo' : 'Disattivato'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="tp-sponsor-content">
                    <div className="tp-sponsor-sector" style={{ color: '#6B7280' }}>
                      <FaCube style={{ marginRight: '4px' }} />
                      {catalog.num_assets || 0} asset
                    </div>
                    <h3 className="tp-sponsor-name">{catalog.nome}</h3>
                  </div>

                  {/* Footer */}
                  <div className="tp-sponsor-footer">
                    <div className="tp-sponsor-contact">
                      {catalog.descrizione && (
                        <span className="tp-sponsor-contact-item">
                          {catalog.descrizione.substring(0, 40)}{catalog.descrizione.length > 40 ? '...' : ''}
                        </span>
                      )}
                    </div>
                    <div className="tp-sponsor-actions">
                      <button
                        className="tp-btn-icon tp-btn-icon-view"
                        onClick={() => navigate(`/club/catalogs/${catalog.id}`)}
                        title="Modifica"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="tp-btn-icon tp-btn-icon-edit"
                        onClick={() => openShareModal(catalog)}
                        title="Condividi"
                      >
                        <FaShareAlt />
                      </button>
                      <button
                        className="tp-btn-icon tp-btn-icon-delete"
                        onClick={() => handleDeleteClick(catalog)}
                        title="Elimina"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LIST VIEW (Table) */
            <div className="tp-table-container">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Catalogo</th>
                    <th>Asset</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCatalogs.map(catalog => (
                    <tr key={catalog.id}>
                      <td>
                        <div className="tp-table-user">
                          <div className="tp-table-avatar" style={{ background: catalog.attivo ? '#D1FAE5' : '#F3F4F6' }}>
                            <FaBook style={{ color: catalog.attivo ? '#059669' : '#6B7280' }} />
                          </div>
                          <div className="tp-table-user-info">
                            <span className="tp-table-name">{catalog.nome}</span>
                            <span className="tp-table-sector">
                              {catalog.descrizione ? catalog.descrizione.substring(0, 50) + (catalog.descrizione.length > 50 ? '...' : '') : '-'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaCube size={12} color="#6B7280" />
                          <span>{catalog.num_assets || 0}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`tp-badge ${catalog.attivo ? 'tp-badge-success' : 'tp-badge-neutral'}`}>
                          {catalog.attivo ? 'Attivo' : 'Disattivato'}
                        </span>
                      </td>
                      <td>
                        <div className="tp-table-actions">
                          <button
                            className="tp-btn-icon tp-btn-icon-view"
                            onClick={() => navigate(`/club/catalogs/${catalog.id}`)}
                            title="Modifica"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-edit"
                            onClick={() => openShareModal(catalog)}
                            title="Condividi"
                          >
                            <FaShareAlt />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-archive"
                            onClick={() => handleToggleActive(catalog)}
                            title={catalog.attivo ? 'Disattiva' : 'Attiva'}
                          >
                            {catalog.attivo ? <FaEyeSlash /> : <FaEye />}
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-delete"
                            onClick={() => handleDeleteClick(catalog)}
                            title="Elimina"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredCatalogs.length > itemsPerPage && (
            <div className="tp-pagination">
              <div className="tp-pagination-info">
                Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredCatalogs.length)} di {filteredCatalogs.length} cataloghi
              </div>
              <ul className="tp-pagination-list">
                <li
                  className={`tp-pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                >
                  ‹
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <li className="tp-pagination-item" style={{ background: 'transparent', cursor: 'default' }}>...</li>
                      )}
                      <li
                        className={`tp-pagination-item ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </li>
                    </span>
                  ))
                }
                <li
                  className={`tp-pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                >
                  ›
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCatalogToDelete(null);
        }}
        title="Elimina Catalogo"
      >
        <div style={{ padding: '20px' }}>
          <p>Sei sicuro di voler eliminare il catalogo <strong>{catalogToDelete?.nome}</strong>?</p>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>
            Il link pubblico non sarà più accessibile.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              className="tp-btn tp-btn-outline"
              onClick={() => {
                setShowDeleteModal(false);
                setCatalogToDelete(null);
              }}
            >
              Annulla
            </button>
            <button
              className="tp-btn tp-btn-danger"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminazione...' : 'Elimina'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSelectedCatalog(null);
        }}
        title="Condividi Catalogo"
        maxWidth="500px"
      >
        {selectedCatalog && (
          <div style={{ padding: '8px 0' }}>
            {/* Catalog Header Card */}
            <div style={{
              background: 'linear-gradient(135deg, #1F2937, #374151)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(133, 255, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaBook style={{ fontSize: '24px', color: '#85FF00' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                  {selectedCatalog.nome}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaCube size={11} /> {selectedCatalog.num_assets || 0} asset
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: selectedCatalog.attivo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.3)',
                    color: selectedCatalog.attivo ? '#10B981' : '#9CA3AF'
                  }}>
                    {selectedCatalog.attivo ? 'Attivo' : 'Disattivato'}
                  </span>
                </div>
              </div>
            </div>

            {/* Public Link Section */}
            <div style={{
              background: '#F9FAFB',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FaLink style={{ color: '#6B7280' }} />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>Link Pubblico</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                padding: '4px',
                gap: '4px'
              }}>
                <input
                  type="text"
                  readOnly
                  value={getPublicUrl(selectedCatalog.public_token)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#374151',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => copyToClipboard(getPublicUrl(selectedCatalog.public_token))}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: copySuccess ? '#10B981' : '#1A1A1A',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaCopy size={12} />
                  {copySuccess ? 'Copiato!' : 'Copia'}
                </button>
              </div>
              <button
                onClick={() => window.open(getPublicUrl(selectedCatalog.public_token), '_blank')}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #E5E7EB',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <FaExternalLinkAlt size={12} />
                Apri Catalogo
              </button>
            </div>

            {/* Export Section */}
            <div style={{
              background: '#F9FAFB',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151', display: 'block', marginBottom: '12px' }}>
                Esporta
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => handleExportPdf(selectedCatalog)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '2px solid #FECACA',
                    background: '#FEF2F2',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaFilePdf style={{ fontSize: '28px', color: '#EF4444' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B' }}>Scarica PDF</span>
                </button>
                <button
                  onClick={() => handleExportExcel(selectedCatalog)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '2px solid #A7F3D0',
                    background: '#ECFDF5',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaFileExcel style={{ fontSize: '28px', color: '#10B981' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#065F46' }}>Scarica Excel</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <SupportWidget />
    </div>
  );
}

export default CatalogList;
