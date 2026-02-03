import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminCategoryAPI } from '../services/resourceAPI';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import '../styles/dashboard-new.css';

function AdminResourceCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    descrizione: '',
    icona: '',
    parent_id: '',
    ordine: 0,
    attiva: true
  });

  // Emoji predefinite per le categorie
  const availableEmojis = [
    '📊', '📈', '📉', '📝', '📋', '📁', '📂', '📄', '📃', '📑',
    '🏷️', '💼', '💰', '💡', '🎯', '🎨', '🔧', '🔨', '⚙️', '🛠️',
    '📱', '💻', '🖥️', '⌨️', '🖱️', '📞', '📧', '📮', '📬', '📭',
    '🎓', '📚', '📖', '📕', '📗', '📘', '📙', '🗂️', '🗃️', '🗄️',
    '🌟', '⭐', '✨', '💫', '🔥', '⚡', '🌈', '🎉', '🎊', '🎁',
    '📍', '📌', '📎', '🔗', '🔒', '🔓', '🔑', '🗝️', '🏆', '🥇'
  ];
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await adminCategoryAPI.getCategories();
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Errore caricamento categorie:', error);
      showToast('Errore nel caricamento delle categorie', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nome: category.nome,
        slug: category.slug,
        descrizione: category.descrizione || '',
        icona: category.icona || '',
        parent_id: category.parent_id || '',
        ordine: category.ordine || 0,
        attiva: category.attiva
      });
    } else {
      setEditingCategory(null);
      setFormData({
        nome: '',
        slug: '',
        descrizione: '',
        icona: '',
        parent_id: '',
        ordine: 0,
        attiva: true
      });
    }
    setShowEmojiPicker(false);
    setShowModal(true);
  };

  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({ ...prev, icona: emoji }));
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.slug) {
      showToast('Nome e slug sono obbligatori', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        ordine: parseInt(formData.ordine)
      };

      if (editingCategory) {
        await adminCategoryAPI.updateCategory(editingCategory.id, payload);
        showToast('Categoria aggiornata con successo', 'success');
      } else {
        await adminCategoryAPI.createCategory(payload);
        showToast('Categoria creata con successo', 'success');
      }

      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Errore salvataggio categoria:', error);
      showToast(error.response?.data?.error || 'Errore durante il salvataggio', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa categoria? Le risorse associate devono essere riassegnate prima.')) return;

    try {
      await adminCategoryAPI.deleteCategory(id);
      showToast('Categoria eliminata con successo', 'success');
      fetchCategories();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      showToast(error.response?.data?.error || 'Errore durante l\'eliminazione', 'error');
    }
  };

  const generateSlug = (nome) => {
    return nome
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  const activeCategories = categories.filter(c => c.attiva).length;
  const inactiveCategories = categories.length - activeCategories;
  const totalResources = categories.reduce((sum, cat) => sum + (cat.resource_count || 0), 0);

  return (
    <>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
              🏷️ Gestione Categorie
            </h1>
            <p style={{ color: '#666', fontSize: '15px' }}>
              Organizza e gestisci le categorie delle risorse
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin/resources')}
              style={{
                background: '#f5f5f5',
                color: '#3D3D3D',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e8e8e8'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f5f5f5'}
            >
              ← Torna alle Risorse
            </button>
            <button
              onClick={() => handleOpenModal()}
              style={{
                background: '#3D3D3D',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2a2a2a'}
              onMouseOut={(e) => e.currentTarget.style.background = '#3D3D3D'}
            >
              + Nuova Categoria
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
          {/* Total Categories */}
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A' }}>
              {categories.length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', opacity: 0.8 }}>
              📊 Totale Categorie
            </div>
            <div style={{ fontSize: '12px', color: '#1A1A1A', opacity: 0.6 }}>
              {totalResources} risorse totali
            </div>
          </div>

          {/* Active Categories */}
          <div style={{
            background: '#3D3D3D',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
              {activeCategories}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', opacity: 0.8 }}>
              ✅ Categorie Attive
            </div>
            <div style={{ fontSize: '12px', color: 'white', opacity: 0.6 }}>
              {((activeCategories / categories.length) * 100 || 0).toFixed(0)}% del totale
            </div>
          </div>

          {/* Inactive Categories */}
          <div style={{
            background: 'linear-gradient(135deg, #FFD4D4 0%, #FFC4C4 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A' }}>
              {inactiveCategories}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', opacity: 0.8 }}>
              ⏸️ Categorie Disattivate
            </div>
            <div style={{ fontSize: '12px', color: '#1A1A1A', opacity: 0.6 }}>
              {((inactiveCategories / categories.length) * 100 || 0).toFixed(0)}% del totale
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="widget-white">
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1a1a1a' }}>
            Elenco Categorie
          </h2>

          {categories.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📂</div>
              <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
                Nessuna categoria creata
              </p>
              <p style={{ fontSize: '14px' }}>
                Crea la tua prima categoria per organizzare le risorse
              </p>
            </div>
          ) : (
            <div style={{
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 200px 120px 100px 120px',
                gap: '16px',
                padding: '16px 20px',
                background: '#fafafa',
                borderBottom: '1px solid #e5e5e5',
                fontSize: '13px',
                fontWeight: '600',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <div>Icon</div>
                <div>Nome & Descrizione</div>
                <div>Slug</div>
                <div>Risorse</div>
                <div>Ordine</div>
                <div style={{ textAlign: 'center' }}>Azioni</div>
              </div>

              {/* Table Body */}
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 200px 120px 100px 120px',
                    gap: '16px',
                    padding: '20px',
                    borderBottom: index < categories.length - 1 ? '1px solid #f0f0f0' : 'none',
                    background: category.attiva ? 'white' : '#fafafa',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = category.attiva ? 'white' : '#fafafa'}
                >
                  {/* Icon */}
                  <div style={{ fontSize: '32px', textAlign: 'center' }}>
                    {category.icona || '📁'}
                  </div>

                  {/* Name & Description */}
                  <div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {category.nome}
                      {!category.attiva && (
                        <span style={{
                          background: '#FF9800',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          Disattivata
                        </span>
                      )}
                    </div>
                    {category.descrizione && (
                      <p style={{
                        margin: 0,
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}>
                        {category.descrizione.length > 80
                          ? category.descrizione.substring(0, 80) + '...'
                          : category.descrizione
                        }
                      </p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <span style={{
                      background: '#f0f0f0',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#666',
                      fontFamily: 'monospace'
                    }}>
                      /{category.slug}
                    </span>
                  </div>

                  {/* Resources Count */}
                  <div>
                    <span style={{
                      background: category.resource_count > 0 ? '#E8F5E9' : '#f5f5f5',
                      color: category.resource_count > 0 ? '#2E7D32' : '#999',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}>
                      {category.resource_count || 0}
                    </span>
                  </div>

                  {/* Order */}
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    fontWeight: '500'
                  }}>
                    {category.ordine}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => handleOpenModal(category)}
                      style={{
                        background: '#3D3D3D',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#2a2a2a'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#3D3D3D'}
                      title="Modifica"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={category.resource_count > 0}
                      style={{
                        background: category.resource_count > 0 ? '#e0e0e0' : '#FF4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: category.resource_count > 0 ? 'not-allowed' : 'pointer',
                        opacity: category.resource_count > 0 ? 0.5 : 1,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (category.resource_count === 0) {
                          e.currentTarget.style.background = '#cc0000';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (category.resource_count === 0) {
                          e.currentTarget.style.background = '#FF4444';
                        }
                      }}
                      title={category.resource_count > 0 ? 'Rimuovi prima le risorse' : 'Elimina'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '600px' }}
            >
              <div className="modal-header">
                <h2>{editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, nome: e.target.value }));
                      if (!editingCategory) {
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                      }
                    }}
                    required
                    placeholder="Es. Ricerche di Mercato"
                  />
                </div>

                <div className="form-group">
                  <label>Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                    placeholder="es. ricerche-di-mercato"
                  />
                </div>

                <div className="form-group">
                  <label>Descrizione</label>
                  <textarea
                    value={formData.descrizione}
                    onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                    rows="3"
                    placeholder="Descrizione della categoria..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label>Icona (emoji)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        style={{
                          width: '50px',
                          height: '50px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          cursor: 'pointer',
                          background: '#fafafa',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#7FFF00'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                        title="Clicca per selezionare un'emoji"
                      >
                        {formData.icona || '📁'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '12px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#666',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#7FFF00'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                      >
                        {showEmojiPicker ? 'Chiudi selettore' : 'Seleziona emoji'}
                      </button>
                    </div>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(10, 1fr)',
                          gap: '8px'
                        }}>
                          {availableEmojis.map((emoji, index) => (
                            <div
                              key={index}
                              onClick={() => handleEmojiSelect(emoji)}
                              style={{
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                background: formData.icona === emoji ? '#7FFF00' : 'transparent',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => {
                                if (formData.icona !== emoji) {
                                  e.currentTarget.style.background = '#f5f5f5';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (formData.icona !== emoji) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                              title={emoji}
                            >
                              {emoji}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Ordine</label>
                    <input
                      type="number"
                      value={formData.ordine}
                      onChange={(e) => setFormData(prev => ({ ...prev, ordine: e.target.value }))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Categoria Padre (opzionale)</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  >
                    <option value="">Nessuna (categoria principale)</option>
                    {categories
                      .filter(c => !editingCategory || c.id !== editingCategory.id)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.attiva}
                      onChange={(e) => setFormData(prev => ({ ...prev, attiva: e.target.checked }))}
                    />
                    Categoria attiva
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      background: '#f5f5f5',
                      color: '#3D3D3D',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#3D3D3D',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {editingCategory ? 'Aggiorna' : 'Crea Categoria'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast.show && <Toast message={toast.message} type={toast.type} />}
      </div>
    </>
  );
}

export default AdminResourceCategories;
