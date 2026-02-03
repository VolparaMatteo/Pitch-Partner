import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Modal from './Modal';
import '../styles/image-crop.css';

function ImageCropModal({ isOpen, onClose, images, onCropComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    aspect: 1 // Aspect ratio 1:1 (quadrato come Instagram)
  });
  const [croppedImages, setCroppedImages] = useState([]);
  const imgRef = useRef(null);
  const [completedCrop, setCompletedCrop] = useState(null);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const smallerDimension = Math.min(width, height);
    const cropSize = (smallerDimension / Math.max(width, height)) * 100;

    // Centra il crop
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

  const getCroppedImage = useCallback(() => {
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Dimensione fissa Instagram: 1080x1080
    const targetSize = 1080;
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext('2d');

    const cropX = (completedCrop.x / 100) * image.naturalWidth;
    const cropY = (completedCrop.y / 100) * image.naturalHeight;
    const cropWidth = (completedCrop.width / 100) * image.naturalWidth;
    const cropHeight = (completedCrop.height / 100) * image.naturalHeight;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetSize,
      targetSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.92);
    });
  }, [completedCrop]);

  const handleNext = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      const blob = await getCroppedImage();
      const croppedUrl = URL.createObjectURL(blob);

      const newCroppedImages = [...croppedImages];
      newCroppedImages[currentIndex] = { url: croppedUrl, blob };
      setCroppedImages(newCroppedImages);

      if (currentIndex < images.length - 1) {
        // Vai alla prossima immagine
        setCurrentIndex(currentIndex + 1);
        setCrop({
          unit: '%',
          width: 100,
          height: 100,
          x: 0,
          y: 0,
          aspect: 1
        });
      } else {
        // Tutte le immagini sono state ritagliate
        onCropComplete(newCroppedImages);
      }
    } catch (error) {
      console.error('Errore nel ritaglio:', error);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkipCrop = async () => {
    // Salta il ritaglio ma converti comunque il blob in un formato utilizzabile
    try {
      // Fetch l'immagine originale come blob
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const croppedUrl = URL.createObjectURL(blob);

      const newCroppedImages = [...croppedImages];
      newCroppedImages[currentIndex] = { url: croppedUrl, blob, original: true };
      setCroppedImages(newCroppedImages);

      if (currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onCropComplete(newCroppedImages);
      }
    } catch (error) {
      console.error('Errore nel salvare immagine originale:', error);
    }
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📸 Ritaglia Immagini" maxWidth="900px">
      <div className="crop-modal-content">
        {/* Progress */}
        <div className="crop-progress">
          <div className="crop-progress-text">
            Immagine {currentIndex + 1} di {images.length}
          </div>
          <div className="crop-progress-bar">
            <div
              className="crop-progress-fill"
              style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Crop Area */}
        <div className="crop-area">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            minWidth={100}
          >
            <img
              ref={imgRef}
              src={images[currentIndex]}
              alt={`Crop ${currentIndex + 1}`}
              onLoad={onImageLoad}
              style={{ maxHeight: '500px', width: 'auto' }}
            />
          </ReactCrop>
        </div>

        {/* Info */}
        <div className="crop-info">
          <p>📐 Ritaglia l'immagine in formato quadrato (1:1)</p>
          <p>🎯 Dimensione finale: 1080x1080px</p>
        </div>

        {/* Actions */}
        <div className="crop-actions">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            ❌ Annulla
          </button>

          {currentIndex > 0 && (
            <button
              onClick={handleBack}
              className="btn-secondary"
            >
              ← Indietro
            </button>
          )}

          <button
            onClick={handleSkipCrop}
            className="btn-secondary"
          >
            ⏭️ Salta Ritaglio
          </button>

          <button
            onClick={handleNext}
            className="btn-primary"
            disabled={!completedCrop}
          >
            {currentIndex < images.length - 1 ? '→ Prossima' : '✓ Completa'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ImageCropModal;
