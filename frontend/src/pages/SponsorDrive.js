import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import api from '../services/api';
import '../styles/sponsor-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineFolderOpen,
  HiOutlineDocument,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlineEye,
  HiOutlineFunnel,
  HiOutlineCloudArrowUp,
  HiOutlineFolder,
  HiOutlineDocumentText,
  HiOutlineTableCells,
  HiOutlineArchiveBox
} from 'react-icons/hi2';

function SponsorDrive() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    categoria: '',
    cartella: '',
    search: ''
  });

  // View mode
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchFiles();
  }, [filters.categoria, filters.cartella]);

  const fetchFiles = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.cartella) params.append('cartella', filters.cartella);

      const response = await api.get(`/sponsor/drive?${params.toString()}`);
      setFiles(response.data.files || []);
      setFolders(response.data.folders || []);
      setCategories(response.data.categories || []);

    } catch (error) {
      console.error('Errore nel caricamento file:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (file) => {
    const ext = file.estensione?.toLowerCase() || file.file_type?.toLowerCase() || '';

    if (ext.includes('pdf')) return <HiOutlineDocumentText size={24} />;
    if (ext.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <HiOutlinePhoto size={24} />;
    if (ext.includes('video') || ['mp4', 'mov', 'avi', 'webm'].includes(ext)) return <HiOutlineFilm size={24} />;
    if (ext.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return <HiOutlineTableCells size={24} />;
    return <HiOutlineDocument size={24} />;
  };

  const getCategoryLabel = (categoria) => {
    const labels = {
      'contratto': 'Contratto',
      'fattura': 'Fattura',
      'brand_guidelines': 'Brand Guidelines',
      'materiale_grafico': 'Materiale Grafico',
      'foto_attivazione': 'Foto Attivazione',
      'report': 'Report',
      'presentazione': 'Presentazione',
      'corrispondenza': 'Corrispondenza',
      'altro': 'Altro'
    };
    return labels[categoria] || categoria || 'Documento';
  };

  const filteredFiles = files.filter(file => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return file.nome?.toLowerCase().includes(searchLower) ||
             file.descrizione?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const handleDownload = (file) => {
    window.open(file.file_url, '_blank');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Caricamento file...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Drive</h1>
          <p className="page-subtitle">File condivisi tra te e il club</p>
        </div>
      </div>

      {/* Stats */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">File Totali</div>
          <div className="tp-stat-value">{files.length}</div>
          <div className="tp-stat-description">Nel tuo drive</div>
        </div>
        {categories.slice(0, 3).map((cat, idx) => (
          <div key={idx} className="tp-stat-card-dark">
            <div className="tp-stat-label">{getCategoryLabel(cat.categoria)}</div>
            <div className="tp-stat-value">{cat.count}</div>
            <div className="tp-stat-description">File</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineMagnifyingGlass size={18} />
          <input
            type="text"
            placeholder="Cerca file..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-buttons">
          <select
            className="filter-select"
            value={filters.categoria}
            onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
          >
            <option value="">Tutte le categorie</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat.categoria}>
                {getCategoryLabel(cat.categoria)} ({cat.count})
              </option>
            ))}
          </select>

          {folders.length > 0 && (
            <select
              className="filter-select"
              value={filters.cartella}
              onChange={(e) => setFilters({ ...filters, cartella: e.target.value })}
            >
              <option value="">Tutte le cartelle</option>
              {folders.map((folder, idx) => (
                <option key={idx} value={folder}>{folder}</option>
              ))}
            </select>
          )}

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <HiOutlineArchiveBox size={18} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <HiOutlineDocument size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      <div className="drive-container">
        {filteredFiles.length === 0 ? (
          <div className="empty-state-card">
            <HiOutlineFolderOpen size={48} />
            <h3>Nessun file trovato</h3>
            <p>Non ci sono file condivisi con te</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="files-grid">
            {filteredFiles.map((file, idx) => (
              <div key={idx} className="file-card">
                <div className="file-card-preview">
                  {file.thumbnail_url ? (
                    <img src={file.thumbnail_url} alt={file.nome} />
                  ) : (
                    <div className="file-icon-large">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                <div className="file-card-info">
                  <h4 className="file-card-name">{file.nome}</h4>
                  <div className="file-card-meta">
                    <span className="file-category">{getCategoryLabel(file.categoria)}</span>
                    <span className="file-size">{formatFileSize(file.file_size)}</span>
                  </div>
                </div>

                <div className="file-card-footer">
                  <span className="file-date">{formatDate(file.created_at)}</span>
                  <span className="file-uploader">
                    {file.caricato_da === 'club' ? 'Club' : 'Tu'}
                  </span>
                </div>

                <div className="file-card-actions">
                  <button
                    className="file-action-btn"
                    onClick={() => window.open(file.file_url, '_blank')}
                    title="Visualizza"
                  >
                    <HiOutlineEye size={18} />
                  </button>
                  <button
                    className="file-action-btn"
                    onClick={() => handleDownload(file)}
                    title="Scarica"
                  >
                    <HiOutlineArrowDownTray size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="files-table">
            <div className="files-table-header">
              <div className="col-name">Nome</div>
              <div className="col-category">Categoria</div>
              <div className="col-size">Dimensione</div>
              <div className="col-date">Data</div>
              <div className="col-uploader">Caricato da</div>
              <div className="col-actions">Azioni</div>
            </div>
            {filteredFiles.map((file, idx) => (
              <div key={idx} className="files-table-row">
                <div className="col-name">
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <span className="file-name-text">{file.nome}</span>
                </div>
                <div className="col-category">
                  <span className="category-badge">{getCategoryLabel(file.categoria)}</span>
                </div>
                <div className="col-size">{formatFileSize(file.file_size)}</div>
                <div className="col-date">{formatDate(file.created_at)}</div>
                <div className="col-uploader">
                  <span className={`uploader-badge ${file.caricato_da}`}>
                    {file.caricato_da === 'club' ? 'Club' : 'Tu'}
                  </span>
                </div>
                <div className="col-actions">
                  <button
                    className="table-action-btn"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <HiOutlineEye size={16} />
                  </button>
                  <button
                    className="table-action-btn"
                    onClick={() => handleDownload(file)}
                  >
                    <HiOutlineArrowDownTray size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SponsorDrive;
