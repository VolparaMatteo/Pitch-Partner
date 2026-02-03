import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminResourceAPI, adminCategoryAPI } from '../services/resourceAPI';
import { uploadAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function AdminResourceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Stati per upload file
  const [resourceFile, setResourceFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [resourceFilePreview, setResourceFilePreview] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    titolo: '',
    slug: '',
    descrizione: '',
    tipo_risorsa: 'guida',
    category_id: '',
    tags: [],
    settori: [],
    file_url: '',
    file_tipo: '',
    file_size_kb: '',
    link_esterno: '',
    anteprima_url: '',
    autore: '',
    fonte: '',
    data_pubblicazione: '',
    visibilita: 'public',
    richiede_registrazione: false,
    in_evidenza: false,
    consigliata: false,
    pubblicata: true
  });
  const [tagInput, setTagInput] = useState('');
  const [settoreInput, setSettoreInput] = useState('');
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchCategories();
    if (isEdit) {
      fetchResource();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await adminCategoryAPI.getCategories();
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Errore caricamento categorie:', error);
    }
  };

  const fetchResource = async () => {
    try {
      setLoading(true);
      const res = await adminResourceAPI.getResourceDetail(id);
      const resource = res.data.resource;

      setFormData({
        titolo: resource.titolo,
        slug: resource.slug,
        descrizione: resource.descrizione || '',
        tipo_risorsa: resource.tipo_risorsa,
        category_id: resource.category_id,
        tags: resource.tags || [],
        settori: resource.settori || [],
        file_url: resource.file_url || '',
        file_tipo: resource.file_tipo || '',
        file_size_kb: resource.file_size_kb || '',
        link_esterno: resource.link_esterno || '',
        anteprima_url: resource.anteprima_url || '',
        autore: resource.autore || '',
        fonte: resource.fonte || '',
        data_pubblicazione: resource.data_pubblicazione || '',
        visibilita: resource.visibilita,
        richiede_registrazione: resource.richiede_registrazione,
        in_evidenza: resource.in_evidenza,
        consigliata: resource.consigliata,
        pubblicata: resource.pubblicata
      });

      // Imposta preview se esistono file già caricati
      if (resource.anteprima_url) {
        const imageUrl = resource.anteprima_url.startsWith('http')
          ? resource.anteprima_url
          : `${API_URL.replace('/api', '')}${resource.anteprima_url}`;
        setCoverImagePreview(imageUrl);
      }
    } catch (error) {
      console.error('Errore caricamento risorsa:', error);
      setToast({ message: 'Errore nel caricamento della risorsa', type: 'error' });
      setTimeout(() => navigate('/admin/resources'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.titolo || !formData.tipo_risorsa || !formData.category_id) {
      setToast({ message: 'Compila i campi obbligatori (Titolo, Tipo, Categoria)', type: 'error' });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);

    try {
      setLoading(true);

      // Upload file risorsa se presente
      let fileUrl = formData.file_url;
      if (resourceFile) {
        setUploadingFile(true);
        try {
          const uploadResponse = await uploadAPI.uploadDocument(resourceFile);
          fileUrl = uploadResponse.data.file_url;
        } catch (uploadError) {
          console.error('Errore upload file:', uploadError);
          setToast({
            message: 'Errore durante il caricamento del file. Riprova.',
            type: 'error'
          });
          setUploadingFile(false);
          setLoading(false);
          return;
        }
        setUploadingFile(false);
      }

      // Upload immagine copertina se presente
      let coverUrl = formData.anteprima_url;
      if (coverImage) {
        setUploadingCover(true);
        try {
          const uploadResponse = await uploadAPI.uploadMedia(coverImage);
          coverUrl = uploadResponse.data.file_url;
        } catch (uploadError) {
          console.error('Errore upload copertina:', uploadError);
          setToast({
            message: 'Errore durante il caricamento dell\'immagine di copertina. Riprova.',
            type: 'error'
          });
          setUploadingCover(false);
          setLoading(false);
          return;
        }
        setUploadingCover(false);
      }

      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        file_size_kb: formData.file_size_kb ? parseInt(formData.file_size_kb) : null,
        file_url: fileUrl,
        anteprima_url: coverUrl
      };

      if (isEdit) {
        await adminResourceAPI.updateResource(id, payload);
        setToast({ message: 'Risorsa aggiornata con successo!', type: 'success' });
      } else {
        await adminResourceAPI.createResource(payload);
        setToast({ message: 'Risorsa creata con successo!', type: 'success' });
      }

      setTimeout(() => {
        navigate('/admin/resources');
      }, 1500);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      setToast({
        message: error.response?.data?.error || 'Errore durante il salvataggio',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (titolo) => {
    return titolo
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleAddSettore = () => {
    if (settoreInput.trim() && !formData.settori.includes(settoreInput.trim())) {
      setFormData(prev => ({ ...prev, settori: [...prev.settori, settoreInput.trim()] }));
      setSettoreInput('');
    }
  };

  const handleRemoveSettore = (settore) => {
    setFormData(prev => ({ ...prev, settori: prev.settori.filter(s => s !== settore) }));
  };

  // Gestione upload file risorsa
  const handleResourceFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validazione dimensione (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setToast({ message: 'Il file è troppo grande. Dimensione massima: 50MB', type: 'error' });
      return;
    }

    setResourceFile(file);

    // Estrai tipo file dall'estensione
    const fileExt = file.name.split('.').pop().toLowerCase();
    setFormData(prev => ({
      ...prev,
      file_tipo: fileExt,
      file_size_kb: Math.round(file.size / 1024)
    }));

    // Preview solo per immagini
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResourceFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setResourceFilePreview(null);
    }
  };

  const removeResourceFile = () => {
    setResourceFile(null);
    setResourceFilePreview(null);
    setFormData(prev => ({ ...prev, file_url: '', file_tipo: '', file_size_kb: '' }));
  };

  // Gestione upload immagine copertina
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validazione tipo file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Formato non supportato. Usa: PNG, JPG, GIF, WEBP', type: 'error' });
      return;
    }

    // Validazione dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'L\'immagine è troppo grande. Dimensione massima: 5MB', type: 'error' });
      return;
    }

    setCoverImage(file);

    // Crea preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    setFormData(prev => ({ ...prev, anteprima_url: '' }));
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#666'
  };

  const sectionStyle = {
    marginBottom: '32px',
    paddingBottom: '32px',
    borderBottom: '1px solid #E0E0E0'
  };

  if (loading && isEdit) {
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
        {/* Back Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/admin/resources')}
            className="stat-btn"
            style={{ padding: '10px 20px' }}
          >
            ← Indietro
          </button>
        </div>

        {/* Header */}
        <div className="welcome-header" style={{ marginBottom: '32px' }}>
          <h1 className="welcome-title">{isEdit ? 'Modifica Risorsa' : 'Nuova Risorsa'}</h1>
        </div>

        {/* Form */}
        <div className="widget-white">
          <form onSubmit={handleSubmit}>
            {/* Informazioni Base */}
            <div style={sectionStyle}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1A1A1A' }}>
                Informazioni Base
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Titolo <span style={{ color: '#FF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, titolo: e.target.value }));
                    if (!isEdit) {
                      setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                    }
                  }}
                  required
                  placeholder="Es. Guida completa allo sponsorship sportivo"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Slug <span style={{ color: '#FF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  placeholder="guida-completa-sponsorship-sportivo"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Descrizione</label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                  rows="4"
                  placeholder="Descrizione dettagliata della risorsa..."
                  style={{
                    ...inputStyle,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>
                    Tipo Risorsa <span style={{ color: '#FF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.tipo_risorsa}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo_risorsa: e.target.value }))}
                    required
                    style={inputStyle}
                  >
                    <option value="ricerca">Ricerca</option>
                    <option value="case-study">Case Study</option>
                    <option value="guida">Guida</option>
                    <option value="template">Template</option>
                    <option value="video">Video</option>
                    <option value="articolo">Articolo</option>
                    <option value="whitepaper">Whitepaper</option>
                    <option value="toolkit">Toolkit</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>
                    Categoria <span style={{ color: '#FF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    required
                    style={inputStyle}
                  >
                    <option value="">Seleziona categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icona} {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Categorizzazione */}
            <div style={sectionStyle}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1A1A1A' }}>
                Categorizzazione
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Tags</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Aggiungi tag e premi Invio"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    style={{
                      background: '#3D3D3D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + Aggiungi
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.tags.map(tag => (
                    <span key={tag} style={{
                      background: '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#666'
                    }}>
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#999',
                          padding: 0,
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Settori di Interesse</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={settoreInput}
                    onChange={(e) => setSettoreInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSettore())}
                    placeholder="Aggiungi settore e premi Invio"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSettore}
                    style={{
                      background: '#3D3D3D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + Aggiungi
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.settori.map(settore => (
                    <span key={settore} style={{
                      background: '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#666'
                    }}>
                      {settore}
                      <button
                        type="button"
                        onClick={() => handleRemoveSettore(settore)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#999',
                          padding: 0,
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* File e Contenuti */}
            <div style={sectionStyle}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1A1A1A' }}>
                File e Contenuti
              </h3>

              {/* Upload File Risorsa */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>File della Risorsa</label>

                {formData.file_url && !resourceFile ? (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      padding: '12px 16px',
                      background: '#F9F9F9',
                      border: '1px solid #E0E0E0',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        File caricato: {formData.file_tipo?.toUpperCase() || 'File'} ({formData.file_size_kb ? `${formData.file_size_kb} KB` : 'N/A'})
                      </span>
                      <button
                        type="button"
                        onClick={removeResourceFile}
                        style={{
                          background: '#FF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Rimuovi
                      </button>
                    </div>
                  </div>
                ) : resourceFile ? (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      padding: '12px 16px',
                      background: '#F9F9F9',
                      border: '1px solid #E0E0E0',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ fontSize: '14px', color: '#666', display: 'block' }}>
                          {resourceFile.name}
                        </span>
                        <span style={{ fontSize: '12px', color: '#999' }}>
                          {(resourceFile.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeResourceFile}
                        style={{
                          background: '#FF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Rimuovi
                      </button>
                    </div>
                  </div>
                ) : null}

                <input
                  type="file"
                  id="resource-file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={handleResourceFileChange}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="resource-file-upload"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: '#F0F0F0',
                    border: '2px dashed #CCCCCC',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#666',
                    textAlign: 'center'
                  }}
                >
                  Scegli file risorsa (PDF, DOC, XLS, PPT, TXT - Max 50MB)
                </label>
              </div>

              {/* Link Esterno (alternativa) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Link Esterno (alternativa al file)</label>
                <input
                  type="url"
                  value={formData.link_esterno}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_esterno: e.target.value }))}
                  placeholder="https://example.com/risorsa"
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                  Usa questo campo se la risorsa è ospitata esternamente (es. Google Drive, Dropbox)
                </p>
              </div>

              {/* Upload Immagine Copertina */}
              <div>
                <label style={labelStyle}>Immagine di Copertina</label>

                {coverImagePreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px' }}>
                    <div style={{
                      width: '200px',
                      height: '120px',
                      border: '2px solid #E0E0E0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: '#F9F9F9'
                    }}>
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        Immagine caricata
                      </p>
                      <button
                        type="button"
                        onClick={removeCoverImage}
                        style={{
                          background: '#FF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Rimuovi Immagine
                      </button>
                    </div>
                  </div>
                ) : null}

                <input
                  type="file"
                  id="cover-image-upload"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleCoverImageChange}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="cover-image-upload"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: '#F0F0F0',
                    border: '2px dashed #CCCCCC',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#666',
                    textAlign: 'center'
                  }}
                >
                  Scegli immagine copertina (PNG, JPG, GIF, WEBP - Max 5MB)
                </label>
              </div>
            </div>

            {/* Autore e Fonte */}
            <div style={sectionStyle}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1A1A1A' }}>
                Autore e Fonte
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Autore</label>
                  <input
                    type="text"
                    value={formData.autore}
                    onChange={(e) => setFormData(prev => ({ ...prev, autore: e.target.value }))}
                    placeholder="Nome autore"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Fonte</label>
                  <input
                    type="text"
                    value={formData.fonte}
                    onChange={(e) => setFormData(prev => ({ ...prev, fonte: e.target.value }))}
                    placeholder="Organizzazione / Fonte"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Data Pubblicazione</label>
                <input
                  type="date"
                  value={formData.data_pubblicazione}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_pubblicazione: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Accesso e Visibilità */}
            <div style={sectionStyle}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1A1A1A' }}>
                Accesso e Visibilità
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Visibilità</label>
                <select
                  value={formData.visibilita}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibilita: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="public">Pubblico (tutti)</option>
                  <option value="sponsor-only">Solo Sponsor</option>
                  <option value="club-only">Solo Club</option>
                  <option value="premium">Premium</option>
                  <option value="admin-only">Solo Admin</option>
                </select>
              </div>

              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.richiede_registrazione}
                    onChange={(e) => setFormData(prev => ({ ...prev, richiede_registrazione: e.target.checked }))}
                  />
                  Richiede registrazione per accedere
                </label>
              </div>
            </div>

            {/* Evidenza e Stato */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1A1A1A' }}>
                Evidenza e Stato
              </h3>

              <div style={{ display: 'grid', gap: '12px' }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.in_evidenza}
                    onChange={(e) => setFormData(prev => ({ ...prev, in_evidenza: e.target.checked }))}
                  />
                  In evidenza
                </label>

                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.consigliata}
                    onChange={(e) => setFormData(prev => ({ ...prev, consigliata: e.target.checked }))}
                  />
                  Consigliata
                </label>

                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.pubblicata}
                    onChange={(e) => setFormData(prev => ({ ...prev, pubblicata: e.target.checked }))}
                  />
                  Pubblicata (visibile agli utenti)
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '24px',
              borderTop: '1px solid #E0E0E0'
            }}>
              <button
                type="button"
                onClick={() => navigate('/admin/resources')}
                disabled={loading}
                style={{
                  background: 'white',
                  color: '#1A1A1A',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="stat-btn"
                style={{
                  padding: '12px 32px',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploadingFile ? 'Caricamento file...' :
                 uploadingCover ? 'Caricamento copertina...' :
                 loading ? 'Salvataggio...' :
                 (isEdit ? 'Salva Modifiche' : 'Crea Risorsa')}
              </button>
            </div>
          </form>
        </div>

        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title={isEdit ? 'Conferma Modifiche' : 'Conferma Creazione'}
        >
          <div style={{ padding: '20px 0' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px', color: '#666' }}>
              {isEdit
                ? `Sei sicuro di voler salvare le modifiche alla risorsa "${formData.titolo}"?`
                : `Sei sicuro di voler creare la nuova risorsa "${formData.titolo}"?`
              }
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: 'white',
                  color: '#1A1A1A',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmedSubmit}
                className="stat-btn"
                style={{
                  padding: '12px 24px'
                }}
              >
                {isEdit ? 'Salva Modifiche' : 'Crea Risorsa'}
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
    </>
  );
}

export default AdminResourceForm;
