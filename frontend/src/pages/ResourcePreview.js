import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { resourceAPI } from '../services/resourceAPI';
import { getImageUrl } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import '../styles/dashboard-new.css';

function ResourcePreview() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchResource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const res = await resourceAPI.getResourceDetail(id);
      setResource(res.data.resource);
    } catch (error) {
      console.error('Errore caricamento risorsa:', error);
      setToast({ message: error.response?.data?.error || 'Errore nel caricamento', type: 'error' });
      setTimeout(() => navigate('/resources'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem('token');

      // Call the download endpoint to track the download
      const res = await resourceAPI.downloadResource(id);
      const downloadUrl = res.data.download_url;

      // If it's an external link, just open it
      if (resource.link_esterno) {
        window.open(downloadUrl, '_blank');
        setToast({ message: 'Apertura risorsa esterna...', type: 'success' });
        return;
      }

      // For internal files, download with authentication
      const fullUrl = getImageUrl(downloadUrl);

      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resource.titolo}.${resource.file_tipo || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({ message: 'Download completato!', type: 'success' });
    } catch (error) {
      console.error('Errore download:', error);
      setToast({ message: error.response?.data?.error || 'Errore durante il download', type: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const getPreviewUrl = () => {
    if (!resource) return null;

    if (resource.link_esterno) {
      return resource.link_esterno;
    }

    if (resource.file_url) {
      return getImageUrl(resource.file_url);
    }

    return null;
  };

  const canPreviewInBrowser = () => {
    if (!resource) return false;
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
    return previewableTypes.includes(resource.file_tipo?.toLowerCase());
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  if (!resource) {
    return (
      <>
        <div className="dashboard-new-container">
          <div style={{ textAlign: 'center', padding: '48px' }}>
            Risorsa non trovata
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <button
              style={{
                background: '#3D3D3D',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(61, 61, 61, 0.3)',
                transition: 'all 0.2s',
                marginBottom: '16px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(61, 61, 61, 0.4)';
                e.target.style.background = '#2D2D2D';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(61, 61, 61, 0.3)';
                e.target.style.background = '#3D3D3D';
              }}
              onClick={() => navigate(`/resources/${id}`)}
            >
              ← Torna alla risorsa
            </button>
            <h1 className="welcome-title">{resource.titolo}</h1>
          </div>

          <button
            className="stat-btn"
            onClick={handleDownload}
            disabled={downloading}
            style={{
              padding: '14px 28px',
              fontSize: '15px',
              opacity: downloading ? 0.6 : 1
            }}
          >
            {downloading ? '⏳ Download in corso...' : '⬇️ Scarica risorsa'}
          </button>
        </div>

        {/* File Info */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                Tipo file
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>
                {resource.file_tipo?.toUpperCase() || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                Dimensione
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>
                {resource.file_size_kb
                  ? `${(resource.file_size_kb / 1024).toFixed(2)} MB`
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                Categoria
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>
                {resource.category?.icona} {resource.category?.nome || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          borderRadius: '20px',
          padding: '24px',
          minHeight: '600px'
        }}>
          <h2 style={{
            margin: '0 0 24px 0',
            fontSize: '20px',
            fontWeight: 600,
            color: '#3D3D3D'
          }}>
            Anteprima
          </h2>

          {canPreviewInBrowser() && getPreviewUrl() ? (
            <div style={{
              width: '100%',
              height: '700px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <iframe
                src={getPreviewUrl()}
                title="Resource Preview"
                allow="fullscreen"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
          ) : resource.link_esterno ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              background: '#F5F5F5',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
                Questa risorsa è ospitata esternamente
              </div>
              <button
                className="stat-btn"
                onClick={() => window.open(resource.link_esterno, '_blank')}
                style={{ padding: '12px 24px' }}
              >
                Apri link esterno
              </button>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              background: '#F5F5F5',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                Anteprima non disponibile per questo tipo di file
              </div>
              <div style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>
                Clicca su "Scarica risorsa" per scaricare il file
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default ResourcePreview;
