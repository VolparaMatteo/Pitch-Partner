import React from 'react';
import { FaPlay, FaYoutube, FaVimeo } from 'react-icons/fa';

const VideoSection = ({ settings, globalStyles, isPreview = false }) => {
  const {
    url = '',
    title = {},
    aspectRatio = '16:9',
    autoplay = false
  } = settings || {};

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const getEmbedUrl = () => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}${autoplay ? '?autoplay=1' : ''}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}${autoplay ? '?autoplay=1' : ''}`;
    }

    return url;
  };

  const getAspectRatioPadding = () => {
    switch (aspectRatio) {
      case '4:3':
        return '75%';
      case '1:1':
        return '100%';
      case '21:9':
        return '42.86%';
      case '16:9':
      default:
        return '56.25%';
    }
  };

  const embedUrl = getEmbedUrl();

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

        {/* Video Container */}
        {embedUrl ? (
          <div style={{
            position: 'relative',
            paddingBottom: getAspectRatioPadding(),
            height: 0,
            overflow: 'hidden',
            borderRadius: globalStyles?.borderRadius || 12,
            background: '#111'
          }}>
            <iframe
              src={embedUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title?.content || 'Video'}
            />
          </div>
        ) : (
          <div style={{
            background: '#111',
            borderRadius: globalStyles?.borderRadius || 12,
            padding: isPreview ? '30px' : '80px',
            textAlign: 'center',
            border: '2px dashed #333'
          }}>
            <FaPlay style={{
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
              Inserisci un URL YouTube o Vimeo
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoSection;
