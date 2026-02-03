import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaPlay, FaCheck, FaLightbulb } from 'react-icons/fa';

function GuidedTour({ steps, isOpen, onClose, onComplete, onStepChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightStyle, setHighlightStyle] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!steps[currentStep]) return;

    const selector = steps[currentStep].target;
    const element = document.querySelector(selector);

    if (element) {
      setTargetElement(element);
      const rect = element.getBoundingClientRect();
      const padding = 12;

      // Highlight position (fixed, relative to viewport)
      setHighlightStyle({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Get actual tooltip dimensions
      const tooltipWidth = 400;
      const tooltipEl = tooltipRef.current;
      const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 350; // Use actual height or estimate

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const margin = 20;

      // Calculate available space in each direction
      const spaceAbove = rect.top - margin;
      const spaceBelow = viewportHeight - rect.bottom - margin;
      const spaceLeft = rect.left - margin;
      const spaceRight = viewportWidth - rect.right - margin;

      // Determine best placement based on preferred placement and available space
      let placement = steps[currentStep].placement || 'bottom';
      let top, left;

      // Check if preferred placement works, otherwise find best alternative
      const canFitBottom = spaceBelow >= tooltipHeight;
      const canFitTop = spaceAbove >= tooltipHeight;
      const canFitRight = spaceRight >= tooltipWidth;
      const canFitLeft = spaceLeft >= tooltipWidth;

      // Auto-adjust placement if needed
      if (placement === 'bottom' && !canFitBottom && canFitTop) {
        placement = 'top';
      } else if (placement === 'top' && !canFitTop && canFitBottom) {
        placement = 'bottom';
      } else if (placement === 'left' && !canFitLeft && canFitRight) {
        placement = 'right';
      } else if (placement === 'right' && !canFitRight && canFitLeft) {
        placement = 'left';
      } else if ((placement === 'bottom' || placement === 'bottom-left' || placement === 'bottom-right') && !canFitBottom && !canFitTop) {
        // If no vertical space, try side placements
        if (canFitRight) placement = 'right';
        else if (canFitLeft) placement = 'left';
      }

      switch (placement) {
        case 'top':
          top = rect.top - tooltipHeight - margin;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + margin;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - margin;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + margin;
          break;
        case 'bottom-left':
          top = rect.bottom + margin;
          left = rect.left;
          break;
        case 'bottom-right':
          top = rect.bottom + margin;
          left = rect.right - tooltipWidth;
          break;
        default:
          top = rect.bottom + margin;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
      }

      // Final adjustments to keep tooltip within viewport
      left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin));
      top = Math.max(margin, Math.min(top, viewportHeight - tooltipHeight - margin));

      setTooltipPosition({ top, left });

      // Scroll element into view if needed (only if element is outside viewport)
      const isInViewport = rect.top >= 0 && rect.bottom <= viewportHeight;
      if (!isInViewport) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (isOpen && steps.length > 0) {
      setIsAnimating(true);
      // Call onStepChange for the initial step when tour opens
      if (currentStep === 0) {
        onStepChange?.(0, steps[0]);
      }
      // First calculation
      const timer1 = setTimeout(() => {
        calculatePosition();
      }, 100);
      // Second calculation after tooltip renders to get actual height
      const timer2 = setTimeout(() => {
        calculatePosition();
        setIsAnimating(false);
      }, 350);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen, currentStep, calculatePosition, steps.length, onStepChange]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition);
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition);
      };
    }
  }, [isOpen, calculatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep, steps[nextStep]);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep, steps[prevStep]);
    }
  };

  const handleComplete = () => {
    setCurrentStep(0);
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Highlight Cutout - creates spotlight effect with box-shadow */}
      <div
        style={{
          position: 'fixed',
          ...highlightStyle,
          background: 'transparent',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
          borderRadius: '12px',
          zIndex: 10000,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        }}
      />

      {/* Highlight Border */}
      <div
        style={{
          position: 'fixed',
          ...highlightStyle,
          border: '3px solid #85FF00',
          borderRadius: '12px',
          zIndex: 10001,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(133, 255, 0, 0.4), inset 0 0 20px rgba(133, 255, 0, 0.1)',
        }}
      />

      {/* Pulse Animation */}
      <div
        style={{
          position: 'fixed',
          ...highlightStyle,
          border: '3px solid #85FF00',
          borderRadius: '12px',
          zIndex: 10001,
          animation: 'tourPulse 2s infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: '400px',
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 10003,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'translateY(10px)' : 'translateY(0)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1A1A1A, #2D2D2D)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: step.iconBg || 'linear-gradient(135deg, #85FF00, #65A30D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {step.icon || <FaLightbulb size={18} color="white" />}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Step {currentStep + 1} di {steps.length}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
                {step.title}
              </div>
            </div>
          </div>
          <button
            onClick={handleSkip}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <FaTimes size={14} color="white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '4px', background: '#E5E7EB' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #85FF00, #65A30D)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <p style={{
            fontSize: '15px',
            lineHeight: '1.7',
            color: '#4B5563',
            margin: 0,
          }}>
            {step.content}
          </p>

          {/* Tip */}
          {step.tip && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
                borderRadius: '10px',
                border: '1px solid #86EFAC',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <FaLightbulb size={14} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>
                {step.tip}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F9FAFB',
          }}
        >
          <button
            onClick={handleSkip}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              fontSize: '14px',
              color: '#6B7280',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1F2937'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
          >
            Salta tour
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  padding: '10px 18px',
                  background: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.background = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <FaChevronLeft size={12} /> Indietro
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                padding: '10px 20px',
                background: isLastStep
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #1A1A1A, #2D2D2D)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              {isLastStep ? (
                <>
                  <FaCheck size={14} /> Completa
                </>
              ) : (
                <>
                  Avanti <FaChevronRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step Dots */}
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
          }}
        >
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentStep(index);
                onStepChange?.(index, steps[index]);
              }}
              style={{
                width: index === currentStep ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                background: index === currentStep
                  ? '#85FF00'
                  : index < currentStep
                    ? '#10B981'
                    : '#D1D5DB',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes tourPulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(1.05);
          }
          100% {
            opacity: 0;
            transform: scale(1.1);
          }
        }
      `}</style>
    </>
  );
}

export default GuidedTour;
