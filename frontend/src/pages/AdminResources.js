import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminResourceAPI, adminCategoryAPI } from '../services/resourceAPI';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import '../styles/dashboard-new.css';

function AdminResources() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    tipo_risorsa: '',
    visibilita: '',
    pubblicata: '',
    sort: 'created_at',
    page: 1
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1, current_page: 1 });
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchCategories();
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const res = await adminCategoryAPI.getCategories();
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Errore caricamento categorie:', error);
    }
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.tipo_risorsa) params.tipo_risorsa = filters.tipo_risorsa;
      if (filters.visibilita) params.visibilita = filters.visibilita;
      if (filters.pubblicata) params.pubblicata = filters.pubblicata;
      params.sort = filters.sort;
      params.page = filters.page;

      const res = await adminResourceAPI.getResources(params);
      setResources(res.data.resources || []);
      setPagination({
        total: res.data.total,
        pages: res.data.pages,
        current_page: res.data.current_page
      });
    } catch (error) {
      console.error('Errore caricamento risorse:', error);
      setToast({ message: 'Errore nel caricamento delle risorse', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa risorsa? L\'azione è irreversibile.')) return;

    try {
      await adminResourceAPI.deleteResource(id);
      setToast({ message: 'Risorsa eliminata con successo!', type: 'success' });
      fetchResources();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      setToast({ message: 'Errore durante l\'eliminazione', type: 'error' });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getVisibilityBadge = (visibility) => {
    const badges = {
      'public': { color: '#4CAF50', label: 'Pubblico' },
      'sponsor-only': { color: '#2196F3', label: 'Solo Sponsor' },
      'club-only': { color: '#FF9800', label: 'Solo Club' },
      'premium': { color: '#9C27B0', label: 'Premium' },
      'admin-only': { color: '#F44336', label: 'Admin' }
    };
    const badge = badges[visibility] || { color: '#999', label: visibility };
    return (
      <span style={{
        background: badge.color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600
      }}>
        {badge.label}
      </span>
    );
  };

  if (loading && resources.length === 0) {
    return (
      <>
        <div className="dashboard-new-container">
          <div style={{ textAlign: 'center', padding: '48px', color: '#666' }}>
            Caricamento...
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
            <h1 className="welcome-title" style={{ margin: 0 }}>📚 Portale Risorse</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
              Gestisci tutte le risorse della piattaforma
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin/resources/categories')}
              style={{
                background: '#3D3D3D',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🏷️ Categorie
            </button>
            <button
              onClick={() => navigate('/admin/resources/new')}
              className="stat-btn"
            >
              + Nuova Risorsa
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A' }}>
              {pagination.total}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', opacity: 0.8 }}>
              📊 Totale Risorse
            </div>
          </div>

          <div style={{
            background: '#3D3D3D',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
              {categories.length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', opacity: 0.8 }}>
              🏷️ Categorie Attive
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #FFD4D4 0%, #FFC4C4 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A' }}>
              {resources.filter(r => r.pubblicata).length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', opacity: 0.8 }}>
              ✓ Pubblicate
            </div>
          </div>
        </div>

        {/* Filters Widget */}
        <div className="widget-white" style={{ marginBottom: '24px' }}>
          <div className="widget-header">
            <h3>🔍 Filtri di Ricerca</h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <input
              type="text"
              placeholder="🔍 Cerca per titolo o autore..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #7FFF00'}
              onBlur={(e) => e.target.style.border = '1px solid #E0E0E0'}
            />

            <select
              value={filters.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Tutte le categorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icona} {cat.nome}
                </option>
              ))}
            </select>

            <select
              value={filters.tipo_risorsa}
              onChange={(e) => handleFilterChange('tipo_risorsa', e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Tutti i tipi</option>
              <option value="ricerca">📊 Ricerca</option>
              <option value="case-study">📖 Case Study</option>
              <option value="guida">📝 Guida</option>
              <option value="template">📄 Template</option>
              <option value="video">🎥 Video</option>
              <option value="articolo">📰 Articolo</option>
              <option value="whitepaper">📑 Whitepaper</option>
              <option value="toolkit">🧰 Toolkit</option>
            </select>

            <select
              value={filters.visibilita}
              onChange={(e) => handleFilterChange('visibilita', e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Tutte le visibilità</option>
              <option value="public">🌐 Pubblico</option>
              <option value="sponsor-only">💼 Solo Sponsor</option>
              <option value="club-only">⚽ Solo Club</option>
              <option value="premium">⭐ Premium</option>
              <option value="admin-only">🔒 Admin</option>
            </select>

            <select
              value={filters.pubblicata}
              onChange={(e) => handleFilterChange('pubblicata', e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Tutte</option>
              <option value="true">✓ Pubblicate</option>
              <option value="false">📝 Bozze</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="created_at">🕒 Più recenti</option>
              <option value="views">👁️ Più viste</option>
              <option value="downloads">⬇️ Più scaricate</option>
              <option value="rating">⭐ Miglior rating</option>
            </select>
          </div>
        </div>

        {/* Resources Table */}
        <div className="widget-white">
          <div className="widget-header">
            <h3>📋 Elenco Risorse</h3>
            <small style={{ color: '#666', fontWeight: 'normal' }}>
              {pagination.total} risorse trovate
            </small>
          </div>

          {resources.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: '#999'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                Nessuna risorsa trovata
              </p>
              <p style={{ fontSize: '14px' }}>
                Prova a modificare i filtri di ricerca
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ borderBottom: '2px solid #E0E0E0' }}>
                  <tr>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      Risorsa
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      Categoria
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      Tipo
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      Visibilità
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      Stats
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      Stato
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map(resource => (
                    <tr key={resource.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
                          {resource.titolo}
                        </div>
                        {resource.autore && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            di {resource.autore}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {resource.category && (
                          <span style={{
                            fontSize: '13px',
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{resource.category.icona}</span>
                            <span>{resource.category.nome}</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          background: '#F5F5F5',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {resource.tipo_risorsa}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {getVisibilityBadge(resource.visibilita)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          <div>👁️ {resource.views_count}</div>
                          <div>⬇️ {resource.downloads_count}</div>
                          <div>⭐ {resource.avg_rating.toFixed(1)} ({resource.reviews_count})</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {resource.pubblicata ? (
                          <span style={{
                            color: '#4CAF50',
                            fontWeight: 600,
                            fontSize: '13px'
                          }}>
                            ✓ Pubblicata
                          </span>
                        ) : (
                          <span style={{
                            color: '#FF9800',
                            fontWeight: 600,
                            fontSize: '13px'
                          }}>
                            📝 Bozza
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => navigate(`/admin/resources/${resource.id}/edit`)}
                            style={{
                              background: '#3D3D3D',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Modifica"
                          >
                            ✏️ Modifica
                          </button>
                          <button
                            onClick={() => handleDelete(resource.id)}
                            style={{
                              background: '#FF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Elimina"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              style={{
                background: filters.page === 1 ? '#F5F5F5' : '#3D3D3D',
                color: filters.page === 1 ? '#999' : 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: filters.page === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ← Precedente
            </button>
            <span style={{
              padding: '12px 24px',
              background: '#F5F5F5',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600
            }}>
              Pagina {filters.page} di {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === pagination.pages}
              style={{
                background: filters.page === pagination.pages ? '#F5F5F5' : '#3D3D3D',
                color: filters.page === pagination.pages ? '#999' : 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: filters.page === pagination.pages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Successiva →
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
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

export default AdminResources;
