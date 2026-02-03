import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookmarkAPI } from '../services/resourceAPI';
import { getImageUrl } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

function MyLibrary() {
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    tipo_risorsa: '',
    sort: 'recent'
  });
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchCategories();
    fetchBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const { categoryAPI } = require('../services/resourceAPI');
      const res = await categoryAPI.getCategories();
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Errore caricamento categorie:', error);
    }
  };

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.tipo_risorsa) params.tipo_risorsa = filters.tipo_risorsa;
      params.sort = filters.sort;

      const res = await bookmarkAPI.getMyBookmarks(params);
      setBookmarks(res.data.bookmarks || []);
    } catch (error) {
      console.error('Errore caricamento bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (resourceId) => {
    if (!window.confirm('Rimuovere questa risorsa dai preferiti?')) return;

    try {
      const axios = require('axios');
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5003/api'}/resources/${resourceId}/unbookmark`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookmarks();
    } catch (error) {
      console.error('Errore rimozione bookmark:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getTypeIcon = (tipo) => {
    const icons = {
      'ricerca': '📊',
      'case-study': '💼',
      'guida': '📖',
      'template': '📄',
      'video': '🎥',
      'articolo': '📰',
      'whitepaper': '📑',
      'toolkit': '🧰'
    };
    return icons[tipo] || '📄';
  };

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
          <h1 className="welcome-title">⭐ I Miei Preferiti</h1>
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
              transition: 'all 0.2s'
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
            onClick={() => navigate('/resources')}
          >
            ← Torna alle risorse
          </button>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666'
              }}>
                Cerca
              </label>
              <input
                type="text"
                placeholder="🔍 Cerca nei preferiti..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666'
              }}>
                Categoria
              </label>
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tutte le categorie</option>
                {categories.filter(c => c.resource_count > 0).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icona} {cat.nome} ({cat.resource_count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666'
              }}>
                Tipo
              </label>
              <select
                value={filters.tipo_risorsa}
                onChange={(e) => handleFilterChange('tipo_risorsa', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tutti i tipi</option>
                <option value="ricerca">📊 Ricerca</option>
                <option value="case-study">💼 Case Study</option>
                <option value="guida">📖 Guida</option>
                <option value="template">📄 Template</option>
                <option value="video">🎥 Video</option>
                <option value="articolo">📰 Articolo</option>
                <option value="whitepaper">📑 Whitepaper</option>
                <option value="toolkit">🧰 Toolkit</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666'
              }}>
                Ordina per
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="recent">📅 Più recenti</option>
                <option value="oldest">🕰️ Più vecchi</option>
                <option value="rating">⭐ Miglior rating</option>
              </select>
            </div>
          </div>
        </div>

            {loading ? (
              <div className="loading">Caricamento...</div>
            ) : bookmarks.length === 0 ? (
              <div style={{
                background: 'white',
                border: '2px dashed #E0E0E0',
                borderRadius: '20px',
                padding: '48px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '16px', color: '#999', marginBottom: '16px' }}>
                  Nessuna risorsa salvata nei preferiti
                </div>
                <button
                  className="stat-btn"
                  onClick={() => navigate('/resources')}
                  style={{ padding: '12px 24px' }}
                >
                  Esplora le risorse
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {bookmarks.map(bookmark => (
                  <div
                    key={bookmark.bookmark_id}
                    style={{
                      background: 'white',
                      border: '2px solid #E0E0E0',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => navigate(`/resources/${bookmark.resource.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#7FFF00';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(127, 255, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E0E0E0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Cover Image */}
                    {bookmark.resource.anteprima_url ? (
                      <div
                        style={{
                          height: '180px',
                          background: `url(${getImageUrl(bookmark.resource.anteprima_url)}) center/cover`,
                          backgroundColor: '#F5F5F5'
                        }}
                      />
                    ) : (
                      <div style={{
                        height: '180px',
                        background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '64px'
                      }}>
                        📚
                      </div>
                    )}

                    <div style={{ padding: '24px' }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {bookmark.resource.category && (
                          <span style={{
                            background: '#F5F5F5',
                            color: '#3D3D3D',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            {bookmark.resource.category.icona} {bookmark.resource.category.nome}
                          </span>
                        )}
                        <span style={{
                          background: '#FFF4E0',
                          color: '#3D3D3D',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          ⭐ Salvato
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '18px',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: '#3D3D3D'
                      }}>
                        {bookmark.resource.titolo}
                      </h3>

                      {/* Description */}
                      {bookmark.resource.descrizione && (
                        <p style={{
                          margin: '0 0 12px 0',
                          color: '#999',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {bookmark.resource.descrizione}
                        </p>
                      )}

                      {/* Personal Notes */}
                      {bookmark.note_personali && (
                        <div style={{
                          padding: '12px 16px',
                          background: '#FFFBEA',
                          borderLeft: '4px solid #FFD700',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          fontSize: '13px',
                          fontStyle: 'italic',
                          color: '#666'
                        }}>
                          💭 "{bookmark.note_personali}"
                        </div>
                      )}

                      {/* Stats and Actions */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '16px',
                        borderTop: '2px solid #F5F5F5',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span>👁️ {bookmark.resource.views_count}</span>
                          <span>⬇️ {bookmark.resource.downloads_count}</span>
                          <span>⭐ {bookmark.resource.avg_rating.toFixed(1)}</span>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBookmark(bookmark.resource.id);
                          }}
                          style={{
                            background: '#FFE0E0',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#FFD0D0';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#FFE0E0';
                          }}
                          title="Rimuovi dai preferiti"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>
    </>
  );
}

export default MyLibrary;
