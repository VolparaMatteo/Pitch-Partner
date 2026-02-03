import React, { useState } from 'react';
import { getImageUrl } from '../../../utils/imageUtils';
import { FaTimes, FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';

const GallerySection = ({ settings, globalStyles, isPreview = false }) => {
  const {
    images = [],
    title = {},
    layout = 'grid',
    columns = 3,
    enableLightbox = true
  } = settings || {};

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const openLightbox = (index) => {
    if (enableLightbox && !isPreview) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getGridColumns = () => {
    if (isPreview) return 'repeat(2, 1fr)';
    switch (columns) {
      case 2:
        return 'repeat(2, 1fr)';
      case 4:
        return 'repeat(auto-fill, minmax(200px, 1fr))';
      case 3:
      default:
        return 'repeat(auto-fill, minmax(280px, 1fr))';
    }
  };

  const getMasonryColumns = () => {
    if (isPreview) return 2;
    return columns;
  };

  return (
    <section style={{
      background: colors.background,
      padding: isPreview ? '20px 15px' : '60px 20px'
    }}>
      <div style={{
        maxWidth: globalStyles?.spacing?.containerWidth || 1200,
        margin: '0 auto'
      }}>
        {/* Section Title */}
        {title?.content && (
          <h2 style={{
            fontSize: isPreview ? '16px' : '32px',
            fontWeight: title?.style?.fontWeight || '700',
            color: title?.style?.color || colors.text,
            marginBottom: isPreview ? '16px' : '32px',
            textAlign: title?.style?.textAlign || 'center',
            fontFamily: title?.style?.fontFamily || globalStyles?.fonts?.heading || 'Montserrat',
            margin: 0,
            marginBottom: isPreview ? '16px' : '32px'
          }}>
            {title.content}
          </h2>
        )}

        {/* Gallery */}
        {images.length > 0 ? (
          layout === 'masonry' ? (
            <div style={{
              columnCount: getMasonryColumns(),
              columnGap: isPreview ? '8px' : '16px'
            }}>
              {images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => openLightbox(index)}
                  style={{
                    marginBottom: isPreview ? '8px' : '16px',
                    breakInside: 'avoid',
                    borderRadius: globalStyles?.borderRadius || 12,
                    overflow: 'hidden',
                    cursor: enableLightbox ? 'pointer' : 'default'
                  }}
                >
                  <img
                    src={getImageUrl(image.url || image)}
                    alt={image.alt || `Gallery image ${index + 1}`}
                    style={{
                      width: '100%',
                      display: 'block',
                      transition: 'transform 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: getGridColumns(),
              gap: isPreview ? '8px' : '16px'
            }}>
              {images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => openLightbox(index)}
                  style={{
                    position: 'relative',
                    paddingBottom: '66.67%',
                    borderRadius: globalStyles?.borderRadius || 12,
                    overflow: 'hidden',
                    cursor: enableLightbox ? 'pointer' : 'default'
                  }}
                >
                  <img
                    src={getImageUrl(image.url || image)}
                    alt={image.alt || `Gallery image ${index + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{
            background: '#111',
            borderRadius: globalStyles?.borderRadius || 12,
            padding: isPreview ? '30px' : '60px',
            textAlign: 'center',
            border: '2px dashed #333'
          }}>
            <FaImage style={{
              fontSize: isPreview ? '24px' : '48px',
              color: colors.textMuted,
              marginBottom: isPreview ? '8px' : '16px'
            }} />
            <p style={{
              color: colors.textMuted,
              fontSize: isPreview ? '11px' : '14px',
              margin: 0,
              fontFamily: globalStyles?.fonts?.body || 'Inter'
            }}>
              Aggiungi immagini alla galleria
            </p>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && !isPreview && (
          <div
            onClick={closeLightbox}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              <FaTimes />
            </button>

            {/* Prev Button */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                style={{
                  position: 'absolute',
                  left: '20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}
              >
                <FaChevronLeft />
              </button>
            )}

            {/* Image */}
            <img
              onClick={(e) => e.stopPropagation()}
              src={getImageUrl(images[currentImageIndex]?.url || images[currentImageIndex])}
              alt={images[currentImageIndex]?.alt || `Gallery image ${currentImageIndex + 1}`}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain'
              }}
            />

            {/* Next Button */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}
              >
                <FaChevronRight />
              </button>
            )}

            {/* Counter */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: colors.textMuted,
              fontSize: '14px'
            }}>
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
