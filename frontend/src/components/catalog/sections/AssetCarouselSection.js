import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../../utils/imageUtils';
import DefaultAsset from '../../../static/logo/FavIcon.png';
import { FaChevronLeft, FaChevronRight, FaEuroSign } from 'react-icons/fa';

const AssetCarouselSection = ({ settings, globalStyles, catalog, assets, isPreview = false, onAssetClick }) => {
  const {
    autoPlay = true,
    speed = 5000,
    visibleItems = 3,
    showDots = true,
    showArrows = true,
    title = {}
  } = settings || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const itemsToShow = isPreview ? 2 : visibleItems;
  const totalItems = assets?.length || 0;
  const maxIndex = Math.max(0, totalItems - itemsToShow);

  useEffect(() => {
    if (autoPlay && totalItems > itemsToShow) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
      }, speed);

      return () => clearInterval(intervalRef.current);
    }
  }, [autoPlay, speed, maxIndex, totalItems, itemsToShow]);

  const goTo = (index) => {
    setCurrentIndex(Math.min(Math.max(0, index), maxIndex));
  };

  const prev = () => {
    setCurrentIndex(prev => prev <= 0 ? maxIndex : prev - 1);
  };

  const next = () => {
    setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
  };

  const itemWidth = 100 / itemsToShow;

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

        {/* Carousel Container */}
        <div style={{ position: 'relative' }}>
          {/* Arrows */}
          {showArrows && totalItems > itemsToShow && (
            <>
              <button
                onClick={prev}
                style={{
                  position: 'absolute',
                  left: isPreview ? '-10px' : '-20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: isPreview ? '30px' : '40px',
                  height: isPreview ? '30px' : '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: colors.secondary,
                  color: colors.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  fontSize: isPreview ? '12px' : '16px'
                }}
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={next}
                style={{
                  position: 'absolute',
                  right: isPreview ? '-10px' : '-20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: isPreview ? '30px' : '40px',
                  height: isPreview ? '30px' : '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: colors.secondary,
                  color: colors.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  fontSize: isPreview ? '12px' : '16px'
                }}
              >
                <FaChevronRight />
              </button>
            </>
          )}

          {/* Carousel Track */}
          <div style={{
            overflow: 'hidden',
            margin: isPreview ? '0 10px' : '0 20px'
          }}>
            <div
              style={{
                display: 'flex',
                transition: 'transform 0.5s ease',
                transform: `translateX(-${currentIndex * itemWidth}%)`
              }}
            >
              {assets?.map((asset, index) => (
                <div
                  key={asset.id}
                  onClick={() => onAssetClick && onAssetClick(asset)}
                  style={{
                    flex: `0 0 ${itemWidth}%`,
                    padding: isPreview ? '0 5px' : '0 10px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    background: '#111',
                    borderRadius: globalStyles?.borderRadius || 12,
                    overflow: 'hidden',
                    border: '1px solid #222',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}>
                    {/* Image */}
                    <div style={{
                      height: isPreview ? '80px' : '180px',
                      position: 'relative'
                    }}>
                      <img
                        src={asset.immagine_principale ? getImageUrl(asset.immagine_principale) : DefaultAsset}
                        alt={asset.nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {/* Availability Badge */}
                      {catalog?.mostra_disponibilita && (
                        <div style={{
                          position: 'absolute',
                          top: isPreview ? '4px' : '8px',
                          right: isPreview ? '4px' : '8px',
                          padding: isPreview ? '2px 4px' : '4px 8px',
                          borderRadius: '12px',
                          fontSize: isPreview ? '8px' : '10px',
                          fontWeight: '500',
                          background: asset.disponibile ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                          color: '#fff'
                        }}>
                          {asset.disponibile ? 'Disp.' : 'N/D'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: isPreview ? '8px' : '16px' }}>
                      <h3 style={{
                        fontSize: isPreview ? '10px' : '14px',
                        fontWeight: '600',
                        color: colors.text,
                        margin: 0,
                        marginBottom: isPreview ? '4px' : '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
                      }}>
                        {asset.nome}
                      </h3>

                      {catalog?.mostra_prezzi && asset.prezzo_listino && (
                        <div style={{
                          fontSize: isPreview ? '11px' : '16px',
                          fontWeight: '700',
                          color: colors.secondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <FaEuroSign style={{ fontSize: isPreview ? '9px' : '12px' }} />
                          {asset.prezzo_listino.toLocaleString('it-IT')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          {showDots && totalItems > itemsToShow && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: isPreview ? '4px' : '8px',
              marginTop: isPreview ? '12px' : '24px'
            }}>
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  style={{
                    width: currentIndex === index ? (isPreview ? '16px' : '24px') : (isPreview ? '6px' : '8px'),
                    height: isPreview ? '6px' : '8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: currentIndex === index ? colors.secondary : '#333',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AssetCarouselSection;
