import { useState } from 'react';
import { getImageUrl } from '../services/api';
import '../styles/image-carousel.css';

function ImageCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtra immagini null/undefined/empty
  const validImages = images?.filter(img => img && img.trim() !== '') || [];

  if (validImages.length === 0) return null;

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const goToPrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const goToSlide = (index, e) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div className="carousel-container">
      {/* Main Image */}
      <div className="carousel-image-wrapper">
        <img
          src={getImageUrl(validImages[currentIndex])}
          alt={`Slide ${currentIndex + 1}`}
          className="carousel-image"
        />

        {/* Navigation Arrows (solo se più di 1 immagine) */}
        {validImages.length > 1 && (
          <>
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={goToPrev}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={goToNext}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* Counter (es: 1/5) */}
        {validImages.length > 1 && (
          <div className="carousel-counter">
            {currentIndex + 1}/{validImages.length}
          </div>
        )}
      </div>

      {/* Dots Navigation */}
      {validImages.length > 1 && (
        <div className="carousel-dots">
          {validImages.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={(e) => goToSlide(index, e)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;
