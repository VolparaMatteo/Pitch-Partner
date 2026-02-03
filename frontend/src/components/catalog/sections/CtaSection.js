import React from 'react';
import { FaEnvelope, FaPhone, FaArrowRight } from 'react-icons/fa';

const CtaSection = ({ settings, globalStyles, catalog, isPreview = false }) => {
  const {
    title = { content: 'Interessato?' },
    subtitle = { content: 'Contattaci per maggiori informazioni' },
    buttonText = 'Contattaci',
    buttonLink = '',
    showEmail = true,
    showPhone = true,
    backgroundStyle = 'gradient'
  } = settings || {};

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const getBackgroundStyle = () => {
    switch (backgroundStyle) {
      case 'solid':
        return { background: colors.primary };
      case 'transparent':
        return { background: 'transparent' };
      case 'gradient':
      default:
        return {
          background: `linear-gradient(135deg, ${colors.primary} 0%, #2D2D2D 100%)`
        };
    }
  };

  const handleButtonClick = () => {
    if (buttonLink) {
      window.open(buttonLink, '_blank');
    } else if (catalog?.email_contatto) {
      window.location.href = `mailto:${catalog.email_contatto}`;
    }
  };

  return (
    <section style={{
      ...getBackgroundStyle(),
      padding: isPreview ? '30px 15px' : '80px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: globalStyles?.spacing?.containerWidth || 1200,
        margin: '0 auto'
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: isPreview ? '18px' : 'clamp(28px, 4vw, 42px)',
          fontWeight: title?.style?.fontWeight || '700',
          color: title?.style?.color || colors.text,
          marginBottom: isPreview ? '8px' : '16px',
          fontFamily: title?.style?.fontFamily || globalStyles?.fonts?.heading || 'Montserrat',
          margin: 0,
          ...(title?.style || {})
        }}>
          {title.content}
        </h2>

        {/* Subtitle */}
        {subtitle?.content && (
          <p style={{
            fontSize: isPreview ? '12px' : '18px',
            color: subtitle?.style?.color || colors.textMuted,
            maxWidth: '600px',
            margin: '0 auto',
            marginTop: isPreview ? '8px' : '16px',
            lineHeight: 1.6,
            fontFamily: subtitle?.style?.fontFamily || globalStyles?.fonts?.body || 'Inter',
            ...(subtitle?.style || {})
          }}>
            {subtitle.content}
          </p>
        )}

        {/* CTA Button */}
        <button
          onClick={handleButtonClick}
          style={{
            marginTop: isPreview ? '16px' : '32px',
            padding: isPreview ? '10px 20px' : '16px 40px',
            borderRadius: globalStyles?.borderRadius || 12,
            border: 'none',
            background: colors.secondary,
            color: colors.primary,
            fontSize: isPreview ? '12px' : '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontFamily: globalStyles?.fonts?.body || 'Inter'
          }}
        >
          {buttonText}
          <FaArrowRight style={{ fontSize: isPreview ? '10px' : '14px' }} />
        </button>

        {/* Contact Info */}
        {(showEmail || showPhone) && (catalog?.email_contatto || catalog?.telefono_contatto) && (
          <div style={{
            marginTop: isPreview ? '20px' : '40px',
            display: 'flex',
            justifyContent: 'center',
            gap: isPreview ? '16px' : '32px',
            flexWrap: 'wrap'
          }}>
            {showEmail && catalog?.email_contatto && (
              <a
                href={`mailto:${catalog.email_contatto}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: colors.secondary,
                  textDecoration: 'none',
                  fontSize: isPreview ? '11px' : '16px',
                  fontFamily: globalStyles?.fonts?.body || 'Inter'
                }}
              >
                <FaEnvelope />
                {catalog.email_contatto}
              </a>
            )}
            {showPhone && catalog?.telefono_contatto && (
              <a
                href={`tel:${catalog.telefono_contatto}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: colors.secondary,
                  textDecoration: 'none',
                  fontSize: isPreview ? '11px' : '16px',
                  fontFamily: globalStyles?.fonts?.body || 'Inter'
                }}
              >
                <FaPhone />
                {catalog.telefono_contatto}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CtaSection;
