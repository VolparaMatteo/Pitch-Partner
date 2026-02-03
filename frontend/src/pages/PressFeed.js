import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pressAPI, uploadAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ImageCarousel from '../components/ImageCarousel';
import ImageCropModal from '../components/ImageCropModal';
import FavIcon from '../static/logo/FavIcon.png';
import '../styles/press-feed.css';
import '../styles/dashboard-new.css';

function PressFeed() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activeTab, setActiveTab] = useState('published'); // published, drafts
  const fileInputRef = useRef(null);

  // FILTRI
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // all, interna, community
  const [searchText, setSearchText] = useState('');
  const [searchHashtag, setSearchHashtag] = useState('');

  // INSTAGRAM 2-STEP FLOW
  const [createStep, setCreateStep] = useState(1); // 1 = select images, 2 = add content
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [formData, setFormData] = useState({
    tipo: 'social',
    titolo: '',
    sottotitolo: '',
    testo: '',
    categoria: 'generale',
    link_esterno: '',
    fonte_testata: '',
    hashtags: [],
    media_urls: [],
    media_blobs: [], // Blob delle immagini per l'upload
    visibility: 'interna', // interna o community
    pubblicato: true
  });

  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || !['club', 'sponsor'].includes(user.role)) {
      navigate('/');
      return;
    }
    fetchFeed();
    // eslint-disable-next-line
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await pressAPI.getFeed();
      setPublications(res.data.publications || []);
    } catch (error) {
      console.error('Errore caricamento feed:', error);
      setToast({ message: 'Errore nel caricamento del feed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (isDraft = false) => {
    // VALIDAZIONE: Immagine obbligatoria
    if (formData.media_blobs.length === 0) {
      setToast({ message: 'Almeno un\'immagine è obbligatoria per creare un post!', type: 'error' });
      return;
    }

    if (!formData.titolo.trim() || !formData.testo.trim()) {
      setToast({ message: 'Titolo e testo sono obbligatori', type: 'error' });
      return;
    }

    setUploadingImages(true);

    try {
      console.log('=== INIZIO UPLOAD ===');
      console.log('Numero di blob da caricare:', formData.media_blobs.length);

      // Prima carica tutte le immagini
      const uploadPromises = formData.media_blobs.map(async (blob, index) => {
        console.log(`Uploading blob ${index}, size:`, blob.size);
        const file = new File([blob], `image_${Date.now()}_${index}.jpg`, { type: 'image/jpeg' });
        const result = await uploadAPI.uploadMedia(file);
        console.log(`Upload ${index} FULL result:`, JSON.stringify(result, null, 2));
        console.log(`Upload ${index} result.data:`, result.data);
        console.log(`Upload ${index} result.data.file_url:`, result.data?.file_url);

        if (!result.data?.file_url) {
          console.error(`ERRORE: Upload ${index} non ha restituito file_url!`);
          return null;
        }

        return result.data.file_url; // Backend ritorna 'file_url', non 'url'
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log('=== UPLOADED URLs ===', uploadedUrls);

      // Poi crea il post con gli URL delle immagini caricate
      const postData = {
        ...formData,
        media_urls: uploadedUrls,
        pubblicato: !isDraft
      };

      // Rimuovi media_blobs prima di inviare al backend
      delete postData.media_blobs;

      console.log('=== DATI INVIATI AL BACKEND ===');
      console.log('media_urls:', postData.media_urls);
      console.log('titolo:', postData.titolo);

      await pressAPI.createPublication(postData);
      setToast({ message: isDraft ? 'Bozza salvata!' : 'Post pubblicato con successo!', type: 'success' });
      setShowCreateModal(false);
      resetForm();
      fetchFeed();
    } catch (error) {
      console.error('Errore pubblicazione:', error);
      setToast({ message: error.response?.data?.error || 'Errore nella pubblicazione', type: 'error' });
    } finally {
      setUploadingImages(false);
    }
  };

  // INSTAGRAM 2-STEP: Step 1 - Selezione immagini
  const handleStartImageSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Controlla limite considerando le immagini già caricate
    if (formData.media_urls.length + files.length > 5) {
      setToast({ message: 'Massimo 5 immagini per post', type: 'warning' });
      return;
    }

    // Crea URL preview per le immagini
    const urls = files.map(file => URL.createObjectURL(file));
    setSelectedFiles(files);
    setPreviewUrls(urls);

    // Chiudi il modal dello step 1 e apri il crop
    setShowCreateModal(false);
    setShowCropModal(true);
  };

  // Dopo il crop, converti blob in data URL e torna allo step 1
  const handleCropComplete = async (croppedImages) => {
    setShowCropModal(false);
    setUploadingImages(true);

    try {
      // Converti i blob in data URL (base64) per preview affidabile
      const imagePromises = croppedImages.map(async (img) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob: img.blob,
              dataUrl: reader.result // data:image/jpeg;base64,...
            });
          };
          reader.readAsDataURL(img.blob);
        });
      });

      const processedImages = await Promise.all(imagePromises);

      // Aggiungi alle immagini esistenti
      const currentBlobs = formData.media_blobs || [];
      const currentUrls = formData.media_urls || [];

      const newBlobs = processedImages.map(img => img.blob);
      const newUrls = processedImages.map(img => img.dataUrl);

      setFormData({
        ...formData,
        media_blobs: [...currentBlobs, ...newBlobs],
        media_urls: [...currentUrls, ...newUrls]
      });

      setToast({ message: `${newBlobs.length} immagine${newBlobs.length > 1 ? 'i' : ''} aggiunta!`, type: 'success' });
    } catch (error) {
      console.error('Errore conversione immagini:', error);
      setToast({ message: 'Errore nel processare le immagini', type: 'error' });
    } finally {
      setUploadingImages(false);
      // Riapri il modal dello step 1
      setShowCreateModal(true);
    }
  };

  // Procedi allo step 2
  const handleProceedToStep2 = () => {
    if (formData.media_urls.length === 0) {
      setToast({ message: 'Seleziona almeno un\'immagine prima di continuare', type: 'error' });
      return;
    }
    setCreateStep(2);
  };

  const removeImage = (index) => {
    // Revoca l'URL blob per liberare memoria
    if (formData.media_urls[index]) {
      URL.revokeObjectURL(formData.media_urls[index]);
    }

    setFormData({
      ...formData,
      media_urls: formData.media_urls.filter((_, i) => i !== index),
      media_blobs: formData.media_blobs.filter((_, i) => i !== index)
    });
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !formData.hashtags.includes(tag)) {
      setFormData({...formData, hashtags: [...formData.hashtags, tag]});
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag) => {
    setFormData({...formData, hashtags: formData.hashtags.filter(h => h !== tag)});
  };

  const insertEmoji = (emoji) => {
    const textarea = document.querySelector('textarea[name="testo"]');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.testo;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setFormData({...formData, testo: newText});
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const handleToggleLike = async (pubId) => {
    try {
      const res = await pressAPI.toggleLike(pubId);
      setPublications(publications.map(p =>
        p.id === pubId ? { ...p, user_liked: res.data.liked, likes_count: res.data.likes_count } : p
      ));
      if (selectedPost && selectedPost.id === pubId) {
        setSelectedPost({ ...selectedPost, user_liked: res.data.liked, likes_count: res.data.likes_count });
      }
    } catch (error) {
      console.error('Errore like:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPost) return;

    try {
      await pressAPI.addComment(selectedPost.id, { testo: commentText });
      setCommentText('');
      const res = await pressAPI.getPublication(selectedPost.id);
      setSelectedPost(res.data.publication);
    } catch (error) {
      setToast({ message: 'Errore nell\'invio del commento', type: 'error' });
    }
  };

  const handleOpenDetail = async (pub) => {
    try {
      const res = await pressAPI.getPublication(pub.id);
      setSelectedPost(res.data.publication);
      setShowDetailModal(true);
    } catch (error) {
      setToast({ message: 'Errore nel caricamento del post', type: 'error' });
    }
  };

  const handleDeletePost = async (pubId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo post?')) return;

    try {
      await pressAPI.deletePublication(pubId);
      setToast({ message: 'Post eliminato con successo', type: 'success' });
      setShowDetailModal(false);
      fetchFeed();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore nell\'eliminazione', type: 'error' });
    }
  };

  const resetForm = () => {
    // Revoca tutti gli URL blob per liberare memoria
    formData.media_urls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignora errori se l'URL non è un blob
      }
    });

    setFormData({
      tipo: 'social',
      titolo: '',
      sottotitolo: '',
      testo: '',
      categoria: 'generale',
      link_esterno: '',
      fonte_testata: '',
      hashtags: [],
      media_urls: [],
      media_blobs: [],
      visibility: 'interna',
      pubblicato: true
    });
    setHashtagInput('');
    setCreateStep(1); // Reset a step 1
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const getAuthorIcon = (authorType, clubLogoUrl) => {
    // Se è un club e abbiamo il logo, mostra il logo
    if (authorType === 'club' && clubLogoUrl) {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';
      const logoUrl = clubLogoUrl.startsWith('http')
        ? clubLogoUrl
        : `${API_URL.replace('/api', '')}${clubLogoUrl}`;

      return (
        <img
          src={logoUrl}
          alt="Club Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '4px'
          }}
        />
      );
    }

    // Fallback alle emoji
    return authorType === 'club' ? '🏟️' : '💼';
  };

  const getVisibilityBadge = (visibility) => {
    return visibility === 'community' ? '🌍 Pitch Community' : '🔒 Interna';
  };

  const getFilteredPublications = () => {
    let filtered = publications;

    // Filtra per tab (pubblicati o bozze)
    if (activeTab === 'published') {
      filtered = filtered.filter(p => p.pubblicato);
    } else {
      filtered = filtered.filter(p => !p.pubblicato && p.author_id === user.id);
    }

    // Filtra per visibilità
    if (visibilityFilter === 'interna') {
      filtered = filtered.filter(p => p.visibility === 'interna');
    } else if (visibilityFilter === 'community') {
      filtered = filtered.filter(p => p.visibility === 'community');
    }

    // Filtra per testo
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(p =>
        p.titolo.toLowerCase().includes(query) ||
        p.testo.toLowerCase().includes(query) ||
        (p.sottotitolo && p.sottotitolo.toLowerCase().includes(query))
      );
    }

    // Filtra per hashtag
    if (searchHashtag.trim()) {
      const tag = searchHashtag.toLowerCase().replace(/^#/, '');
      filtered = filtered.filter(p =>
        p.hashtags && p.hashtags.some(h => h.toLowerCase().includes(tag))
      );
    }

    return filtered;
  };

  // Emoji comuni
  const commonEmojis = ['😀', '😂', '❤️', '🎉', '👍', '🔥', '⚽', '🏆', '💪', '🎯', '📢', '✨'];

  if (loading) {
    return (
      <>
        <div className="press-feed-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="press-feed-container">
        <div className="feed-inner">
          {/* Header */}
          <div className="feed-header">
            <div className="feed-title-wrapper">
              <img src={FavIcon} alt="Pitch Partner" className="feed-logo" />
              <h1 className="feed-title">Community</h1>
            </div>
            <button className="btn-premium" onClick={() => setShowCreateModal(true)}>
              + Nuovo Post
            </button>
          </div>

          {/* Layout a 3 colonne: Sidebar + Feed + Spacer */}
          <div className="feed-layout">
            {/* SIDEBAR FILTRI */}
            <aside className="feed-sidebar">
              <div className="sidebar-card">
                <h3 className="sidebar-title">🔍 Filtra Post</h3>

                {/* Tabs Pubblicati/Bozze */}
                <div className="filter-group">
                  <label className="filter-label">Stato</label>
                  <div className="filter-tabs">
                    <button
                      className={`filter-tab ${activeTab === 'published' ? 'active' : ''}`}
                      onClick={() => setActiveTab('published')}
                    >
                      📰 Pubblicati
                    </button>
                    <button
                      className={`filter-tab ${activeTab === 'drafts' ? 'active' : ''}`}
                      onClick={() => setActiveTab('drafts')}
                    >
                      📝 Bozze
                    </button>
                  </div>
                </div>

                {/* Visibilità */}
                <div className="filter-group">
                  <label className="filter-label">Visibilità</label>
                  <div className="filter-options">
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="visibility"
                        value="all"
                        checked={visibilityFilter === 'all'}
                        onChange={(e) => setVisibilityFilter(e.target.value)}
                      />
                      <span>🌐 Tutti i Post</span>
                    </label>
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="visibility"
                        value="interna"
                        checked={visibilityFilter === 'interna'}
                        onChange={(e) => setVisibilityFilter(e.target.value)}
                      />
                      <span>🔒 Community Interna</span>
                    </label>
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="visibility"
                        value="community"
                        checked={visibilityFilter === 'community'}
                        onChange={(e) => setVisibilityFilter(e.target.value)}
                      />
                      <span>🌍 Pitch Community</span>
                    </label>
                  </div>
                </div>

                {/* Ricerca Testuale */}
                <div className="filter-group">
                  <label className="filter-label">Cerca Testo</label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Cerca nel titolo o contenuto..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  {searchText && (
                    <button
                      className="btn-clear-filter"
                      onClick={() => setSearchText('')}
                    >
                      ✕ Cancella
                    </button>
                  )}
                </div>

                {/* Ricerca Hashtag */}
                <div className="filter-group">
                  <label className="filter-label">Cerca Hashtag</label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="es: partnership, evento..."
                    value={searchHashtag}
                    onChange={(e) => setSearchHashtag(e.target.value)}
                  />
                  {searchHashtag && (
                    <button
                      className="btn-clear-filter"
                      onClick={() => setSearchHashtag('')}
                    >
                      ✕ Cancella
                    </button>
                  )}
                </div>

                {/* Reset Filtri */}
                {(visibilityFilter !== 'all' || searchText || searchHashtag) && (
                  <button
                    className="btn-reset-filters"
                    onClick={() => {
                      setVisibilityFilter('all');
                      setSearchText('');
                      setSearchHashtag('');
                    }}
                  >
                    🔄 Reset Filtri
                  </button>
                )}
              </div>
            </aside>

            {/* FEED POSTS */}
            <main className="feed-main">
              <div className="feed-posts">
          {getFilteredPublications().length === 0 ? (
            <div className="empty-feed">
              <p>{activeTab === 'drafts' ? 'Nessuna bozza salvata' : 'Nessun post ancora. Sii il primo a condividere qualcosa!'}</p>
            </div>
          ) : (
            getFilteredPublications().map(pub => (
              <div key={pub.id} className="post-card">
                {/* Post Header */}
                <div className="post-header">
                  <div className="post-author">
                    <div className="author-avatar">
                      {getAuthorIcon(pub.author_type, pub.club_logo_url)}
                    </div>
                    <div className="author-info">
                      <div className="author-name">{pub.author_name}</div>
                      <div className="post-date">{new Date(pub.data_pubblicazione).toLocaleDateString('it-IT')}</div>
                    </div>
                  </div>
                  <span className={`visibility-badge ${pub.visibility}`}>
                    {getVisibilityBadge(pub.visibility)}
                  </span>
                </div>

                {/* Post Images - Carosello Instagram */}
                {pub.media_urls && pub.media_urls.length > 0 && (
                  <div onClick={() => handleOpenDetail(pub)} style={{ cursor: 'pointer' }}>
                    <ImageCarousel images={pub.media_urls} />
                  </div>
                )}

                {/* Post Content */}
                <div className="post-content" onClick={() => handleOpenDetail(pub)}>
                  <h3 className="post-title">{pub.titolo}</h3>
                  {pub.sottotitolo && <p className="post-subtitle">{pub.sottotitolo}</p>}
                  <p className="post-text">{pub.testo.substring(0, 200)}{pub.testo.length > 200 ? '...' : ''}</p>

                  {/* Hashtags */}
                  {pub.hashtags && pub.hashtags.length > 0 && (
                    <div className="post-hashtags">
                      {pub.hashtags.map((tag, idx) => (
                        <span key={idx} className="hashtag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="post-actions">
                  <button
                    className={`btn-like ${pub.user_liked ? 'liked' : ''}`}
                    onClick={() => handleToggleLike(pub.id)}
                  >
                    ❤️ {pub.likes_count}
                  </button>
                  <button className="btn-comment" onClick={() => handleOpenDetail(pub)}>
                    💬 {pub.comments_count}
                  </button>
                </div>
              </div>
            ))
          )}
              </div>
            </main>
          </div>
        </div>

        {/* Image Crop Modal */}
        {showCropModal && (
          <ImageCropModal
            isOpen={showCropModal}
            onClose={() => {
              setShowCropModal(false);
              previewUrls.forEach(url => URL.revokeObjectURL(url));
              setSelectedFiles([]);
              setPreviewUrls([]);
              // Riapri il modal dello step 1
              setShowCreateModal(true);
            }}
            images={previewUrls}
            onCropComplete={handleCropComplete}
          />
        )}

        {/* Create Modal - Instagram 2-STEP */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            title={createStep === 1 ? "📸 Step 1: Scegli Immagini" : "✍️ Step 2: Aggiungi Contenuto"}
            maxWidth="800px"
          >
            <div className="post-form">
              {/* STEP 1: Selezione Immagini */}
              {createStep === 1 && (
                <div className="step-1-container">
                  <div className="step-indicator">
                    <div className="step-dot active">1</div>
                    <div className="step-line"></div>
                    <div className="step-dot">2</div>
                  </div>

                  {/* Se non ci sono immagini ancora, mostra upload hero */}
                  {formData.media_urls.length === 0 ? (
                    <div className="upload-hero">
                      <div className="upload-icon">📸</div>
                      <h3>Seleziona le tue immagini</h3>
                      <p>Scegli fino a 5 immagini per il tuo post</p>
                      <p className="upload-hint">Le immagini verranno ritagliate in formato quadrato (1:1)</p>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleStartImageSelection}
                        accept="image/jpeg,image/jpg,image/png"
                        multiple
                        style={{display: 'none'}}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="btn-upload-hero"
                        disabled={uploadingImages}
                      >
                        {uploadingImages ? '⏳ Caricamento...' : '📷 Scegli Immagini'}
                      </button>

                      <div className="upload-requirements">
                        <p>✓ Minimo 1 immagine (obbligatoria)</p>
                        <p>✓ Massimo 5 immagini</p>
                        <p>✓ Formati supportati: JPG, PNG</p>
                      </div>
                    </div>
                  ) : (
                    /* Se ci sono immagini, mostra preview e opzione per aggiungerne */
                    <div className="images-loaded-container">
                      <h3 className="images-loaded-title">
                        ✓ {formData.media_urls.length} Immagine{formData.media_urls.length > 1 ? 'i' : ''} Caricata{formData.media_urls.length > 1 ? 'e' : ''}
                      </h3>

                      {/* Preview immagini con carosello */}
                      <div className="images-preview-step1">
                        <ImageCarousel images={formData.media_urls} />
                      </div>

                      {/* Griglia mini thumbnails */}
                      <div className="images-grid">
                        {formData.media_urls.map((url, idx) => (
                          <div key={idx} className="image-thumbnail">
                            <img src={url} alt={`Immagine ${idx + 1}`} />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="btn-remove-thumb"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Opzione per aggiungere altre immagini */}
                      <div className="add-more-section">
                        <p className="add-more-question">Vuoi selezionarne un'altra?</p>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleStartImageSelection}
                          accept="image/jpeg,image/jpg,image/png"
                          multiple
                          style={{display: 'none'}}
                        />

                        <div className="step1-actions">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="btn-add-more"
                            disabled={uploadingImages || formData.media_urls.length >= 5}
                          >
                            📷 {uploadingImages ? 'Caricamento...' : 'Sì, aggiungi altre'}
                          </button>

                          <button
                            type="button"
                            onClick={handleProceedToStep2}
                            className="btn-proceed"
                          >
                            ✓ No, procedi al contenuto
                          </button>
                        </div>

                        {formData.media_urls.length >= 5 && (
                          <p className="max-images-notice">Hai raggiunto il limite di 5 immagini</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Contenuto Post */}
              {createStep === 2 && (
                <div className="step-2-container">
                  <div className="step-indicator">
                    <div className="step-dot completed">✓</div>
                    <div className="step-line completed"></div>
                    <div className="step-dot active">2</div>
                  </div>

                  {/* Preview Immagini */}
                  <div className="images-preview-step2">
                    <ImageCarousel images={formData.media_urls} />
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      className="btn-change-images"
                    >
                      🔄 Cambia Immagini
                    </button>
                  </div>

              {/* Titolo */}
              <div className="form-group">
                <label>Titolo *</label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => setFormData({...formData, titolo: e.target.value})}
                  required
                  maxLength={200}
                  placeholder="Inserisci un titolo accattivante..."
                />
              </div>

              {/* Testo */}
              <div className="form-group">
                <label>Testo *</label>
                <textarea
                  name="testo"
                  value={formData.testo}
                  onChange={(e) => setFormData({...formData, testo: e.target.value})}
                  required
                  rows={6}
                  placeholder="Condividi le tue notizie..."
                />
                {/* Emoji Picker */}
                <div className="emoji-picker">
                  {commonEmojis.map((emoji, idx) => (
                    <button key={idx} type="button" onClick={() => insertEmoji(emoji)} className="emoji-btn">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              <div className="form-group">
                <label>Hashtags</label>
                <div className="hashtag-input-container">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
                    placeholder="Aggiungi hashtag (es: partnership, sponsorizzazione)"
                  />
                  <button type="button" onClick={addHashtag} className="btn-add-hashtag">+ Aggiungi</button>
                </div>
                <div className="hashtags-list">
                  {formData.hashtags.map((tag, idx) => (
                    <span key={idx} className="hashtag-item">
                      #{tag} <button type="button" onClick={() => removeHashtag(tag)} className="btn-remove-hashtag">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tipo e Categoria */}
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
                    <option value="social">Social</option>
                    <option value="comunicato">Comunicato</option>
                    <option value="articolo">Articolo</option>
                    <option value="video">Video</option>
                    <option value="photo">Photo</option>
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

              {/* Visibility */}
              <div className="form-group">
                <label>Visibilità</label>
                <div className="visibility-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="visibility"
                      value="interna"
                      checked={formData.visibility === 'interna'}
                      onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                    />
                    <span>🔒 Interna - Solo il tuo club e i tuoi sponsor</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="visibility"
                      value="community"
                      checked={formData.visibility === 'community'}
                      onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                    />
                    <span>🌍 Pitch Community - Tutti i club e sponsor della piattaforma</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn-secondary">
                  Annulla
                </button>
                <button type="button" onClick={() => handleCreatePost(true)} className="btn-draft">
                  💾 Salva Bozza
                </button>
                <button type="button" onClick={() => handleCreatePost(false)} className="btn-primary">
                  🚀 Pubblica
                </button>
              </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPost && (
          <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Dettaglio Post" maxWidth="700px">
            <div className="post-detail">
              {/* Author */}
              <div className="post-author">
                <div className="author-avatar">{getAuthorIcon(selectedPost.author_type, selectedPost.club_logo_url)}</div>
                <div className="author-info">
                  <div className="author-name">{selectedPost.author_name}</div>
                  <div className="post-date">{new Date(selectedPost.data_pubblicazione).toLocaleDateString('it-IT')}</div>
                </div>
                <span className={`visibility-badge ${selectedPost.visibility}`}>
                  {getVisibilityBadge(selectedPost.visibility)}
                </span>
                {((user.role === 'club' && selectedPost.club_id === user.id) ||
                  (selectedPost.author_type === user.role && selectedPost.author_id === user.id)) && (
                  <button onClick={() => handleDeletePost(selectedPost.id)} className="btn-delete">
                    🗑️
                  </button>
                )}
              </div>

              {/* Images - Carosello */}
              {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                <ImageCarousel images={selectedPost.media_urls} />
              )}

              {/* Content */}
              <h2>{selectedPost.titolo}</h2>
              {selectedPost.sottotitolo && <h3>{selectedPost.sottotitolo}</h3>}
              <p className="post-full-text">{selectedPost.testo}</p>

              {/* Hashtags */}
              {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                <div className="post-hashtags">
                  {selectedPost.hashtags.map((tag, idx) => (
                    <span key={idx} className="hashtag">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="post-actions">
                <button
                  className={`btn-like ${selectedPost.user_liked ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(selectedPost.id)}
                >
                  ❤️ {selectedPost.likes_count}
                </button>
              </div>

              {/* Comments */}
              <div className="comments-section">
                <h4>Commenti</h4>
                <form onSubmit={handleAddComment} className="comment-form">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Scrivi un commento..."
                    rows={2}
                  />
                  <button type="submit" disabled={!commentText.trim()} className="btn-primary">
                    Invia
                  </button>
                </form>

                <div className="comments-list">
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    selectedPost.comments.map(comment => (
                      <div key={comment.id} className="comment">
                        <div className="comment-author">
                          <span>{getAuthorIcon(comment.user_type)}</span>
                          <span>{comment.user_name}</span>
                          <span className="comment-date">{new Date(comment.created_at).toLocaleString('it-IT')}</span>
                        </div>
                        <div className="comment-text">{comment.testo}</div>
                      </div>
                    ))
                  ) : (
                    <p className="no-comments">Nessun commento ancora</p>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </>
  );
}

export default PressFeed;
