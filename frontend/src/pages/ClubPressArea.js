import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pressAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

function ClubPressArea() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPub, setEditingPub] = useState(null);
  const [tipoFilter, setTipoFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const navigate = useNavigate();
  const { user } = getAuth();

  const [formData, setFormData] = useState({
    tipo: 'comunicato',
    titolo: '',
    sottotitolo: '',
    testo: '',
    data_pubblicazione: new Date().toISOString().slice(0, 16),
    fonte_testata: '',
    link_esterno: '',
    categoria: 'generale',
    media_urls: [],
    documento_pdf_url: '',
    visibile_tutti_sponsor: true,
    visibile_solo_attivi: false,
    sponsor_ids: [],
    contract_id: null,
    tagged_sponsor_ids: [],
    pubblicato: true
  });

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchPublications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFilter, categoriaFilter]);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (tipoFilter) filters.tipo = tipoFilter;
      if (categoriaFilter) filters.categoria = categoriaFilter;

      const res = await pressAPI.getPublications(filters);
      setPublications(res.data.publications || []);
    } catch (error) {
      console.error('Errore nel caricamento pubblicazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPub) {
        await pressAPI.updatePublication(editingPub.id, formData);
      } else {
        await pressAPI.createPublication(formData);
      }
      setShowForm(false);
      setEditingPub(null);
      resetForm();
      fetchPublications();
    } catch (error) {
      console.error('Errore nel salvataggio pubblicazione:', error);
      alert(error.response?.data?.error || 'Errore nel salvataggio');
    }
  };

  const handleEdit = (pub) => {
    setEditingPub(pub);
    setFormData({
      tipo: pub.tipo,
      titolo: pub.titolo,
      sottotitolo: pub.sottotitolo || '',
      testo: pub.testo,
      data_pubblicazione: pub.data_pubblicazione ? new Date(pub.data_pubblicazione).toISOString().slice(0, 16) : '',
      fonte_testata: pub.fonte_testata || '',
      link_esterno: pub.link_esterno || '',
      categoria: pub.categoria || 'generale',
      media_urls: pub.media_urls || [],
      documento_pdf_url: pub.documento_pdf_url || '',
      visibile_tutti_sponsor: pub.visibile_tutti_sponsor !== false,
      visibile_solo_attivi: pub.visibile_solo_attivi || false,
      sponsor_ids: pub.sponsor_ids || [],
      contract_id: pub.contract_id || null,
      tagged_sponsor_ids: pub.tagged_sponsor_ids || [],
      pubblicato: pub.pubblicato !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confermi di voler eliminare questa pubblicazione?')) return;
    try {
      await pressAPI.deletePublication(id);
      fetchPublications();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert(error.response?.data?.error || 'Errore eliminazione');
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'comunicato',
      titolo: '',
      sottotitolo: '',
      testo: '',
      data_pubblicazione: new Date().toISOString().slice(0, 16),
      fonte_testata: '',
      link_esterno: '',
      categoria: 'generale',
      media_urls: [],
      documento_pdf_url: '',
      visibile_tutti_sponsor: true,
      visibile_solo_attivi: false,
      sponsor_ids: [],
      contract_id: null,
      tagged_sponsor_ids: [],
      pubblicato: true
    });
  };

  const getFilteredPublications = () => {
    if (activeTab === 'all') return publications;
    if (activeTab === 'published') return publications.filter(p => p.pubblicato);
    if (activeTab === 'drafts') return publications.filter(p => !p.pubblicato);
    return publications;
  };

  const getPublicationIcon = (tipo) => {
    const icons = {
      comunicato: '📰',
      tv: '📺',
      social: '📱',
      articolo: '📄',
      video: '🎥',
      photo: '📸',
      evento: '🎪'
    };
    return icons[tipo] || '📰';
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

  const totalViews = publications.reduce((sum, p) => sum + (p.visualizzazioni_count || 0), 0);
  const publishedCount = publications.filter(p => p.pubblicato).length;
  const draftsCount = publications.filter(p => !p.pubblicato).length;

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
          <h1 className="welcome-title">Press Area</h1>
          <button
            style={{
              background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
              color: '#3D3D3D',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(127, 255, 0, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(127, 255, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(127, 255, 0, 0.3)';
            }}
            onClick={() => { setShowForm(true); setEditingPub(null); resetForm(); }}
          >
            + Nuova Pubblicazione
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <div style={{ fontSize: '14px', color: '#3D3D3D', opacity: 0.8 }}>Pubblicazioni Totali</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              {publications.length}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: 'white', opacity: 0.7 }}>Pubblicate</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
              {publishedCount}
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
            <div style={{ fontSize: '14px', color: '#3D3D3D', opacity: 0.8 }}>Bozze</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              {draftsCount}
            </div>
          </div>

          <div style={{
            background: 'white',
            border: '2px solid #E0E0E0',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Visualizzazioni Totali</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              {totalViews}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '2px solid #E0E0E0',
          marginBottom: '32px'
        }}>
          {[
            { key: 'all', label: 'Tutte' },
            { key: 'published', label: 'Pubblicate' },
            { key: 'drafts', label: 'Bozze' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '14px 24px',
                background: activeTab === tab.key ? '#7FFF00' : 'transparent',
                border: 'none',
                borderRadius: activeTab === tab.key ? '12px 12px 0 0' : '0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.key ? 600 : 500,
                color: activeTab === tab.key ? '#3D3D3D' : '#666',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.background = '#F5F5F5';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
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
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
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
              <option value="comunicato">Comunicato</option>
              <option value="tv">TV</option>
              <option value="social">Social</option>
              <option value="articolo">Articolo</option>
              <option value="video">Video</option>
              <option value="photo">Photo</option>
              <option value="evento">Evento</option>
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
              Categoria
            </label>
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
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
              <option value="partita">Partita</option>
              <option value="evento">Evento</option>
              <option value="generale">Generale</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>
        </div>

        {/* Publications List */}
        {getFilteredPublications().length === 0 ? (
          <div style={{
            background: 'white',
            border: '2px dashed #E0E0E0',
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', color: '#999', marginBottom: '8px' }}>
              Nessuna pubblicazione trovata
            </div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>
              Crea la prima pubblicazione per iniziare
            </div>
            <button
              style={{
                background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                color: '#3D3D3D',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(127, 255, 0, 0.3)'
              }}
              onClick={() => { setShowForm(true); setEditingPub(null); resetForm(); }}
            >
              Crea prima pubblicazione
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {getFilteredPublications().map(pub => (
              <div
                key={pub.id}
                style={{
                  background: 'white',
                  border: '2px solid #E0E0E0',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7FFF00';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(127, 255, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
                  color: 'white',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{getPublicationIcon(pub.tipo)}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {pub.tipo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(pub)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(pub.id)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,100,100,0.3)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Title */}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#3D3D3D',
                    marginBottom: '8px',
                    lineHeight: 1.3
                  }}>
                    {pub.titolo}
                  </h3>

                  {pub.sottotitolo && (
                    <p style={{
                      fontSize: '14px',
                      color: '#999',
                      marginBottom: '16px',
                      lineHeight: 1.4
                    }}>
                      {pub.sottotitolo}
                    </p>
                  )}

                  {/* Meta */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <span>📅 {new Date(pub.data_pubblicazione).toLocaleDateString('it-IT')}</span>
                    {pub.categoria && <span>🏷️ {pub.categoria}</span>}
                    {pub.fonte_testata && <span>📰 {pub.fonte_testata}</span>}
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#F5F5F5',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <span>👁️ {pub.visualizzazioni_count || 0}</span>
                    <span>💬 {pub.comments_count || 0}</span>
                    {Object.entries(pub.reactions_count || {}).map(([type, count]) => (
                      <span key={type}>{getReactionEmoji(type)} {count}</span>
                    ))}
                  </div>

                  {/* Visibility */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {pub.pubblicato ? (
                      <span style={{
                        background: '#7FFF00',
                        color: '#3D3D3D',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        ✅ Pubblicato
                      </span>
                    ) : (
                      <span style={{
                        background: '#FFD4D4',
                        color: '#3D3D3D',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        📝 Bozza
                      </span>
                    )}
                    {pub.visibile_tutti_sponsor && (
                      <span style={{
                        background: '#F5F5F5',
                        color: '#666',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        👥 Tutti
                      </span>
                    )}
                    {pub.visibile_solo_attivi && (
                      <span style={{
                        background: '#F5F5F5',
                        color: '#666',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        ⭐ Solo Attivi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content press-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingPub ? 'Modifica Pubblicazione' : 'Nuova Pubblicazione'}</h2>
                <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="press-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo *</label>
                    <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} required>
                      <option value="comunicato">Comunicato</option>
                      <option value="tv">TV</option>
                      <option value="social">Social</option>
                      <option value="articolo">Articolo</option>
                      <option value="video">Video</option>
                      <option value="photo">Photo</option>
                      <option value="evento">Evento</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categoria</label>
                    <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})}>
                      <option value="generale">Generale</option>
                      <option value="partita">Partita</option>
                      <option value="evento">Evento</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Titolo *</label>
                  <input
                    type="text"
                    value={formData.titolo}
                    onChange={(e) => setFormData({...formData, titolo: e.target.value})}
                    required
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label>Sottotitolo</label>
                  <input
                    type="text"
                    value={formData.sottotitolo}
                    onChange={(e) => setFormData({...formData, sottotitolo: e.target.value})}
                    maxLength={300}
                  />
                </div>

                <div className="form-group">
                  <label>Testo *</label>
                  <textarea
                    value={formData.testo}
                    onChange={(e) => setFormData({...formData, testo: e.target.value})}
                    required
                    rows={8}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data Pubblicazione *</label>
                    <input
                      type="datetime-local"
                      value={formData.data_pubblicazione}
                      onChange={(e) => setFormData({...formData, data_pubblicazione: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fonte/Testata</label>
                    <input
                      type="text"
                      value={formData.fonte_testata}
                      onChange={(e) => setFormData({...formData, fonte_testata: e.target.value})}
                      placeholder="es. La Gazzetta dello Sport"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Link Esterno</label>
                  <input
                    type="url"
                    value={formData.link_esterno}
                    onChange={(e) => setFormData({...formData, link_esterno: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group visibility-group">
                  <label>Visibilità</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.visibile_tutti_sponsor}
                        onChange={(e) => setFormData({...formData, visibile_tutti_sponsor: e.target.checked})}
                      />
                      Visibile a tutti gli sponsor
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.visibile_solo_attivi}
                        onChange={(e) => setFormData({...formData, visibile_solo_attivi: e.target.checked})}
                      />
                      Visibile solo a sponsor con contratto attivo
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.pubblicato}
                        onChange={(e) => setFormData({...formData, pubblicato: e.target.checked})}
                      />
                      Pubblica subito (altrimenti salva come bozza)
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingPub ? 'Salva Modifiche' : 'Crea Pubblicazione'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function getReactionEmoji(type) {
  const emojis = { like: '👍', love: '❤️', applause: '👏', celebrate: '🎉' };
  return emojis[type] || '👍';
}

export default ClubPressArea;
