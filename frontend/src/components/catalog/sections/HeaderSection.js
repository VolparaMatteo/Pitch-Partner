import React from 'react';
import { getImageUrl } from '../../../utils/imageUtils';

const HeaderSection = ({ settings, globalStyles, catalog, isPreview = false }) => {
  const {
    showLogo = true,
    showClubName = true,
    showWelcomeMessage = true,
    showDescription = true,
    backgroundType = 'gradient',
    alignment = 'left',
    title = {},
    subtitle = {},
    welcomeMessage = {}
  } = settings || {};

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const getBackgroundStyle = () => {
    switch (backgroundType) {
      case 'solid':
        return { background: colors.primary };
      case 'image':
        return {
          background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${catalog?.immagine_copertina ? getImageUrl(catalog.immagine_copertina) : ''})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      case 'gradient':
      default:
        return {
          background: `linear-gradient(135deg, ${colors.primary} 0%, #1A1A1A 100%)`
        };
    }
  };

  const getAlignmentStyle = () => {
    switch (alignment) {
      case 'center':
        return { textAlign: 'center', alignItems: 'center' };
      case 'right':
        return { textAlign: 'right', alignItems: 'flex-end' };
      default:
        return { textAlign: 'left', alignItems: 'flex-start' };
    }
  };

  const alignStyle = getAlignmentStyle();

  return (
    <header style={{
      ...getBackgroundStyle(),
      padding: isPreview ? '30px 15px' : '60px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: globalStyles?.spacing?.containerWidth || 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        ...alignStyle
      }}>
        {/* Logo */}
        {showLogo && (catalog?.logo_url || catalog?.club?.logo_url) && (
          <img
            src={catalog?.logo_url || getImageUrl(catalog?.club?.logo_url)}
            alt="Logo"
            style={{
              height: isPreview ? '40px' : '80px',
              marginBottom: isPreview ? '12px' : '24px',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
            }}
          />
        )}

        {/* Club Name */}
        {showClubName && catalog?.club?.nome && (
          <div style={{
            fontSize: isPreview ? '10px' : '14px',
            color: colors.secondary,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: isPreview ? '4px' : '8px',
            fontFamily: globalStyles?.fonts?.body || 'Inter',
            ...(subtitle?.style || {})
          }}>
            {catalog.club.nome}
          </div>
        )}

        {/* Catalog Title */}
        <h1 style={{
          fontSize: isPreview ? '18px' : 'clamp(32px, 5vw, 56px)',
          fontWeight: title?.style?.fontWeight || '700',
          marginBottom: isPreview ? '8px' : '16px',
          lineHeight: 1.1,
          color: title?.style?.color || colors.text,
          fontFamily: title?.style?.fontFamily || globalStyles?.fonts?.heading || 'Montserrat',
          margin: 0,
          ...(title?.style || {})
        }}>
          {title?.content || catalog?.nome || 'Catalogo'}
        </h1>

        {/* Description */}
        {showDescription && catalog?.descrizione && (
          <p style={{
            fontSize: isPreview ? '12px' : '18px',
            color: colors.textMuted,
            maxWidth: '600px',
            lineHeight: 1.6,
            margin: 0,
            fontFamily: globalStyles?.fonts?.body || 'Inter'
          }}>
            {catalog.descrizione}
          </p>
        )}

        {/* Welcome Message */}
        {showWelcomeMessage && catalog?.messaggio_benvenuto && (
          <div style={{
            marginTop: isPreview ? '16px' : '32px',
            padding: isPreview ? '10px 12px' : '20px 24px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: globalStyles?.borderRadius || 12,
            borderLeft: `4px solid ${colors.secondary}`,
            maxWidth: '600px'
          }}>
            <p style={{
              fontSize: isPreview ? '11px' : '16px',
              lineHeight: 1.6,
              margin: 0,
              color: colors.text,
              fontFamily: globalStyles?.fonts?.body || 'Inter',
              ...(welcomeMessage?.style || {})
            }}>
              {welcomeMessage?.content || catalog.messaggio_benvenuto}
            </p>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderSection;
