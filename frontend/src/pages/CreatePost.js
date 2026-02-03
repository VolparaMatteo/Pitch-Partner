import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { pressAPI, uploadAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import ImageCarousel from '../components/ImageCarousel';
import '../styles/create-post.css';

function CreatePost() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  // Check auth
  useEffect(() => {
    if (!user || !['club', 'sponsor'].includes(user.role)) {
      navigate('/');
    }
    // eslint-disable-next-line
  }, []);

  // Step management: 1 = upload/crop, 2 = content
  const [step, setStep] = useState(1);

  // Cropping state
  const [isCropping, setIsCropping] = useState(false);
  const [cropImageIndex, setCropImageIndex] = useState(0);
  const [tempFiles, setTempFiles] = useState([]);
  const [tempUrls, setTempUrls] = useState([]);
  const [crop, setCrop] = useState({ unit: '%', width: 100, height: 100, x: 0, y: 0, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);

  // Final cropped images
  const [finalImages, setFinalImages] = useState([]); // Array of { dataUrl, blob }

  // Form data
  const [formData, setFormData] = useState({
    titolo: '',
    sottotitolo: '',
    testo: '',
    categoria: 'generale',
    hashtags: [],
    visibility: 'interna'
  });
  const [hashtagInput, setHashtagInput] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // ========== IMAGE SELECTION ==========
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (finalImages.length + files.length > 5) {
      showToast('Massimo 5 immagini per post', 'warning');
      return;
    }

    // Create preview URLs
    const urls = files.map(f => URL.createObjectURL(f));
    setTempFiles(files);
    setTempUrls(urls);
    setCropImageIndex(0);
    setIsCropping(true);
  };

  // ========== CROP LOGIC ==========
  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const smaller = Math.min(width, height);
    const larger = Math.max(width, height);
    const cropSize = (smaller / larger) * 100;

    const newCrop = {
      unit: '%',
      width: width <= height ? 100 : cropSize,
      height: height <= width ? 100 : cropSize,
      x: width <= height ? 0 : (100 - cropSize) / 2,
      y: height <= width ? 0 : (100 - cropSize) / 2,
      aspect: 1
    };

    setCrop(newCrop);
    setCompletedCrop(newCrop);
  }, []);

  const createCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;

    const ctx = canvas.getContext('2d');

    // Debug log
    console.log('🎨 Creating cropped image:', {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      displayWidth: image.width,
      displayHeight: image.height,
      completedCrop: {
        unit: completedCrop.unit,
        x: completedCrop.x,
        y: completedCrop.y,
        width: completedCrop.width,
        height: completedCrop.height
      }
    });

    // ReactCrop restituisce sempre pixel relativi all'immagine visualizzata
    // Dobbiamo convertirli in pixel dell'immagine naturale usando la scala
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropW = completedCrop.width * scaleX;
    const cropH = completedCrop.height * scaleY;

    console.log('✂️ Crop coordinates:', { cropX, cropY, cropW, cropH, scaleX, scaleY });

    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, 1080, 1080);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('❌ Failed to create blob');
          return resolve(null);
        }

        console.log('✅ Blob created:', blob.size, 'bytes');

        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('✅ DataURL created, length:', reader.result?.length);
          resolve({ blob, dataUrl: reader.result });
        };
        reader.onerror = (error) => {
          console.error('❌ FileReader error:', error);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.92);
    });
  }, [completedCrop]);

  const handleCropNext = async () => {
    const croppedImage = await createCroppedImage();
    if (!croppedImage) {
      console.error('❌ No cropped image returned');
      return;
    }

    console.log('✅ Adding image to finalImages:', {
      blobSize: croppedImage.blob.size,
      dataUrlLength: croppedImage.dataUrl.length,
      dataUrlPreview: croppedImage.dataUrl.substring(0, 50) + '...'
    });

    const newFinalImages = [...finalImages, croppedImage];
    setFinalImages(newFinalImages);

    console.log('📦 Total final images:', newFinalImages.length);

    // Move to next image or finish
    if (cropImageIndex < tempFiles.length - 1) {
      setCropImageIndex(cropImageIndex + 1);
      setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0, aspect: 1 });
      setCompletedCrop(null);
    } else {
      finishCropping();
    }
  };

  const handleSkipCrop = async () => {
    try {
      const response = await fetch(tempUrls[cropImageIndex]);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        const newFinalImages = [...finalImages, { blob, dataUrl: reader.result }];
        setFinalImages(newFinalImages);

        if (cropImageIndex < tempFiles.length - 1) {
          setCropImageIndex(cropImageIndex + 1);
        } else {
          finishCropping();
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error skipping crop:', error);
    }
  };

  const handleCropBack = () => {
    if (cropImageIndex > 0 && finalImages.length > 0) {
      // Remove last added image and go back
      const newFinalImages = [...finalImages];
      newFinalImages.pop();
      setFinalImages(newFinalImages);
      setCropImageIndex(cropImageIndex - 1);
    }
  };

  const finishCropping = () => {
    // Cleanup temp URLs
    tempUrls.forEach(url => URL.revokeObjectURL(url));
    setTempUrls([]);
    setTempFiles([]);
    setIsCropping(false);
    setCropImageIndex(0);
  };

  const handleCancelCrop = () => {
    tempUrls.forEach(url => URL.revokeObjectURL(url));
    setTempUrls([]);
    setTempFiles([]);
    setIsCropping(false);
    setCropImageIndex(0);
  };

  // ========== IMAGE MANAGEMENT ==========
  const handleRemoveImage = (index) => {
    const newImages = finalImages.filter((_, i) => i !== index);
    setFinalImages(newImages);
  };

  const handleAddMoreImages = () => {
    if (finalImages.length >= 5) {
      showToast('Massimo 5 immagini', 'warning');
      return;
    }
    fileInputRef.current?.click();
  };

  // ========== FORM MANAGEMENT ==========
  const handleAddHashtag = (e) => {
    e.preventDefault();
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (!tag || formData.hashtags.includes(tag)) return;

    setFormData({ ...formData, hashtags: [...formData.hashtags, tag] });
    setHashtagInput('');
  };

  const handleRemoveHashtag = (tag) => {
    setFormData({ ...formData, hashtags: formData.hashtags.filter(t => t !== tag) });
  };

  // ========== PUBLISH ==========
  const handlePublish = async (isDraft = false) => {
    if (finalImages.length === 0) {
      showToast('Aggiungi almeno una immagine', 'error');
      return;
    }

    if (!formData.titolo.trim() || !formData.testo.trim()) {
      showToast('Titolo e testo sono obbligatori', 'error');
      return;
    }

    setLoading(true);

    try {
      // Upload all images
      const uploadPromises = finalImages.map(async (img, idx) => {
        const file = new File([img.blob], `post_${Date.now()}_${idx}.jpg`, { type: 'image/jpeg' });
        const result = await uploadAPI.uploadMedia(file);
        console.log(`Upload ${idx} result:`, result.data);
        return result.data.file_url; // Backend ritorna 'file_url', non 'url'
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log('All uploaded URLs:', uploadedUrls);

      // Create post
      await pressAPI.createPublication({
        tipo: 'social',
        titolo: formData.titolo,
        sottotitolo: formData.sottotitolo,
        testo: formData.testo,
        categoria: formData.categoria,
        hashtags: formData.hashtags,
        media_urls: uploadedUrls,
        visibility: formData.visibility,
        pubblicato: !isDraft
      });

      showToast(isDraft ? 'Bozza salvata!' : 'Post pubblicato!', 'success');
      setTimeout(() => navigate('/press-feed'), 1500);
    } catch (error) {
      console.error('Publish error:', error);
      showToast(error.response?.data?.error || 'Errore nella pubblicazione', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== UTILITIES ==========
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ========== RENDER CROPPING ==========
  if (isCropping && tempUrls[cropImageIndex]) {
    return (
      <>
        <div className="create-post-page">
          <div className="crop-container">
            <div className="crop-header">
              <h2>📸 Ritaglia Immagine</h2>
              <p>Immagine {cropImageIndex + 1} di {tempFiles.length}</p>
            </div>

            <div className="crop-progress">
              <div
                className="crop-progress-fill"
                style={{ width: `${((cropImageIndex + 1) / tempFiles.length) * 100}%` }}
              />
            </div>

            <div className="crop-workspace">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                minWidth={100}
              >
                <img
                  ref={imgRef}
                  src={tempUrls[cropImageIndex]}
                  alt="Crop"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '500px', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>

            <div className="crop-info">
              <p>📐 Ritaglia in formato quadrato 1:1</p>
              <p>🎯 Dimensione finale: 1080x1080px</p>
            </div>

            <div className="crop-actions">
              <button onClick={handleCancelCrop} className="btn-secondary">
                ✕ Annulla
              </button>

              {cropImageIndex > 0 && (
                <button onClick={handleCropBack} className="btn-secondary">
                  ← Indietro
                </button>
              )}

              <button
                onClick={handleCropNext}
                className="btn-primary"
                disabled={!completedCrop}
              >
                {cropImageIndex < tempFiles.length - 1 ? '→ Prossima' : 'Completa'}
              </button>
            </div>
          </div>

          {toast && (
            <div className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          )}
        </div>
      </>
    );
  }

  // ========== RENDER STEP 1: IMAGE SELECTION ==========
  if (step === 1) {
    return (
      <>
        <div className="create-post-page">
          <div className="page-container">
            <div className="page-header">
              <h1>📸 Crea Nuovo Post</h1>
              <p>Seleziona e ritaglia le tue immagini</p>
            </div>

            {finalImages.length === 0 ? (
              <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📁</div>
                <h3>Seleziona le tue immagini</h3>
                <p>Scegli fino a 5 immagini per il tuo post</p>
                <p className="upload-hint">Le immagini verranno ritagliate in formato quadrato</p>
                <button className="btn-upload" type="button">📷 Scegli Immagini</button>
                <p className="upload-info">✓ Formati supportati: JPG, PNG</p>
              </div>
            ) : (
              <div className="images-section">
                <div className="images-grid">
                  {finalImages.map((img, idx) => (
                    <div key={idx} className="image-item">
                      <img src={img.dataUrl} alt={`Immagine ${idx + 1}`} />
                      <button
                        className="btn-remove"
                        onClick={() => handleRemoveImage(idx)}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="step-actions">
                  {finalImages.length < 5 && (
                    <button onClick={handleAddMoreImages} className="btn-secondary">
                      ➕ Aggiungi Immagine
                    </button>
                  )}

                  <button onClick={() => setStep(2)} className="btn-primary btn-large">
                    Aggiungi Contenuto
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>

          {toast && (
            <div className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          )}
        </div>
      </>
    );
  }

  // ========== RENDER STEP 2: CONTENT ==========
  return (
    <>
      <div className="create-post-page">
        <div className="page-container-wide">
          <div className="page-header">
            <button onClick={() => setStep(1)} className="btn-back">
              ← Indietro
            </button>
            <div>
              <h1>✍️ Aggiungi Contenuto</h1>
              <p>Completa il tuo post</p>
            </div>
          </div>

          <div className="content-layout">
            {/* Form */}
            <div className="form-section">
              <div className="form-group">
                <label>Titolo *</label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={e => setFormData({ ...formData, titolo: e.target.value })}
                  placeholder="Inserisci un titolo..."
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Sottotitolo</label>
                <input
                  type="text"
                  value={formData.sottotitolo}
                  onChange={e => setFormData({ ...formData, sottotitolo: e.target.value })}
                  placeholder="Sottotitolo opzionale..."
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label>Testo *</label>
                <textarea
                  value={formData.testo}
                  onChange={e => setFormData({ ...formData, testo: e.target.value })}
                  placeholder="Scrivi il contenuto del post..."
                  rows={8}
                />
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                >
                  <option value="generale">Generale</option>
                  <option value="sponsorizzazioni">Sponsorizzazioni</option>
                  <option value="eventi">Eventi</option>
                  <option value="partite">Partite</option>
                  <option value="social_media">Social Media</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hashtags</label>
                <form onSubmit={handleAddHashtag} className="hashtag-form">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={e => setHashtagInput(e.target.value)}
                    placeholder="Aggiungi hashtag..."
                  />
                  <button type="submit" className="btn-add">+</button>
                </form>
                {formData.hashtags.length > 0 && (
                  <div className="hashtag-list">
                    {formData.hashtags.map((tag, i) => (
                      <span key={i} className="hashtag-tag">
                        #{tag}
                        <button onClick={() => handleRemoveHashtag(tag)} type="button">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Visibilità</label>
                <select
                  value={formData.visibility}
                  onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                >
                  <option value="interna">Solo Club/Sponsor</option>
                  <option value="community">Pitch Community</option>
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="preview-section">
              <h3>📱 Anteprima</h3>
              <div className="post-preview-card">
                {finalImages.length > 0 && (
                  <ImageCarousel images={finalImages.map(img => img.dataUrl)} />
                )}

                <div className="preview-body">
                  <h4>{formData.titolo || 'Titolo del post'}</h4>
                  {formData.sottotitolo && <p className="preview-subtitle">{formData.sottotitolo}</p>}
                  <p className="preview-text">{formData.testo || 'Testo del post...'}</p>

                  {formData.hashtags.length > 0 && (
                    <div className="preview-hashtags">
                      {formData.hashtags.map((tag, i) => (
                        <span key={i}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="publish-section">
            <button
              onClick={() => handlePublish(true)}
              className="btn-secondary"
              disabled={loading}
            >
              💾 Salva Bozza
            </button>
            <button
              onClick={() => handlePublish(false)}
              className="btn-primary btn-large"
              disabled={loading}
            >
              {loading ? '⏳ Pubblicazione...' : 'Pubblica Post'}
            </button>
          </div>
        </div>

        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}

export default CreatePost;
