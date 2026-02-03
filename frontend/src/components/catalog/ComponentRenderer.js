import React from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import {
  FaEnvelope, FaPhone, FaGlobe, FaFacebook, FaInstagram,
  FaTwitter, FaLinkedin, FaYoutube, FaPlay
} from 'react-icons/fa';

// Heading Component
export const HeadingComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    text = '',
    level = 'h1',
    fontSize = 48,
    fontWeight = '700',
    color = '',
    alignment = 'left'
  } = settings;

  // Don't render if no text (unless in preview mode)
  if (!text && !isPreview) return null;
  if (!text && isPreview) {
    return (
      <div style={{ padding: '16px', background: '#F3F4F6', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
        Titolo (clicca per modificare)
      </div>
    );
  }

  const textColor = color || areaSettings.textColor || globalStyles?.colors?.text || '#1A1A1A';
  const fontFamily = globalStyles?.fonts?.heading || 'Montserrat';

  const Tag = level;

  return (
    <Tag style={{
      fontSize: `${fontSize}px`,
      fontWeight,
      color: textColor,
      textAlign: alignment,
      fontFamily: `'${fontFamily}', sans-serif`,
      margin: 0,
      lineHeight: 1.2
    }}>
      {text}
    </Tag>
  );
};

// Paragraph Component
export const ParagraphComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    text = '',
    fontSize = 16,
    lineHeight = 1.6,
    color = '',
    alignment = 'left'
  } = settings;

  // Don't render if no text (unless in preview mode)
  if (!text && !isPreview) return null;
  if (!text && isPreview) {
    return (
      <div style={{ padding: '12px', background: '#F3F4F6', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
        Paragrafo (clicca per modificare)
      </div>
    );
  }

  const textColor = color || areaSettings.textColor || globalStyles?.colors?.text || '#1A1A1A';
  const fontFamily = globalStyles?.fonts?.body || 'Inter';

  return (
    <p style={{
      fontSize: `${fontSize}px`,
      lineHeight,
      color: textColor,
      textAlign: alignment,
      fontFamily: `'${fontFamily}', sans-serif`,
      margin: 0,
      whiteSpace: 'pre-line'
    }}>
      {text}
    </p>
  );
};

// Button Component
export const ButtonComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    text = '',
    link = '',
    style = 'filled',
    size = 'medium',
    color = '#85FF00',
    textColor = '#1A1A1A',
    alignment = 'left',
    fullWidth = false
  } = settings;

  // Don't render if no text (unless in preview mode)
  if (!text && !isPreview) return null;
  if (!text && isPreview) {
    return (
      <div style={{ padding: '12px', background: '#F3F4F6', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
        Bottone (clicca per modificare)
      </div>
    );
  }

  const sizeStyles = {
    small: { padding: '8px 16px', fontSize: '13px' },
    medium: { padding: '12px 24px', fontSize: '14px' },
    large: { padding: '16px 32px', fontSize: '16px' }
  };

  const styleVariants = {
    filled: {
      background: color,
      color: textColor,
      border: 'none'
    },
    outline: {
      background: 'transparent',
      color: color,
      border: `2px solid ${color}`
    },
    ghost: {
      background: 'transparent',
      color: color,
      border: 'none'
    }
  };

  const buttonStyle = {
    ...sizeStyles[size],
    ...styleVariants[style],
    borderRadius: `${globalStyles?.borderRadius || 8}px`,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    width: fullWidth ? '100%' : 'auto'
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'
  };

  const ButtonTag = link ? 'a' : 'button';
  const buttonProps = link ? { href: link, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <div style={containerStyle}>
      <ButtonTag style={buttonStyle} {...buttonProps}>
        {text}
      </ButtonTag>
    </div>
  );
};

// Image Component
export const ImageComponent = ({ settings = {}, isPreview = false }) => {
  const {
    src = '',
    alt = '',
    width = '100%',
    height = 'auto',
    objectFit = 'cover',
    borderRadius = 8,
    alignment = 'center'
  } = settings;

  // Don't render if no image (unless in preview mode)
  if (!src && !isPreview) return null;
  if (!src && isPreview) {
    return (
      <div style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: '150px',
        background: '#F3F4F6',
        borderRadius: `${borderRadius}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9CA3AF',
        fontSize: '14px'
      }}>
        Immagine (clicca per caricare)
      </div>
    );
  }

  const containerStyle = {
    display: 'flex',
    justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'
  };

  return (
    <div style={containerStyle}>
      <img
        src={getImageUrl(src)}
        alt={alt}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: height === 'auto' ? 'auto' : (typeof height === 'number' ? `${height}px` : height),
          objectFit,
          borderRadius: `${borderRadius}px`
        }}
      />
    </div>
  );
};

// Logo Component
export const LogoComponent = ({ settings = {}, isPreview = false }) => {
  const {
    src = '',
    size = 80,
    alignment = 'center',
    rounded = false
  } = settings;

  // Don't render if no logo (unless in preview mode)
  if (!src && !isPreview) return null;
  if (!src && isPreview) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'
      }}>
        <div style={{
          width: `${size}px`,
          height: `${size}px`,
          background: '#F3F4F6',
          borderRadius: rounded ? '50%' : '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: '12px'
        }}>
          Logo
        </div>
      </div>
    );
  }

  const containerStyle = {
    display: 'flex',
    justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'
  };

  return (
    <div style={containerStyle}>
      <img
        src={getImageUrl(src)}
        alt="Logo"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          borderRadius: rounded ? '50%' : '8px'
        }}
      />
    </div>
  );
};

// Video Component
export const VideoComponent = ({ settings = {}, isPreview = false }) => {
  const {
    url = '',
    aspectRatio = '16:9'
  } = settings;

  const ratios = {
    '16:9': 56.25,
    '4:3': 75,
    '21:9': 42.85,
    '1:1': 100
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  // Don't render if no URL (unless in preview mode)
  if (!url && !isPreview) return null;
  if (!url && isPreview) {
    return (
      <div style={{
        width: '100%',
        paddingBottom: `${ratios[aspectRatio]}%`,
        background: '#1A1A1A',
        borderRadius: '8px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#6B7280',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaPlay size={32} />
          <span style={{ fontSize: '13px' }}>Inserisci URL video</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      paddingBottom: `${ratios[aspectRatio]}%`,
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <iframe
        src={getEmbedUrl(url)}
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
      />
    </div>
  );
};

// Spacer Component - Always render (it's just space)
export const SpacerComponent = ({ settings = {} }) => {
  const { height = 40 } = settings;
  return <div style={{ height: `${height}px` }} />;
};

// Divider Component - Always render
export const DividerComponent = ({ settings = {} }) => {
  const {
    style = 'line',
    color = '#E5E7EB',
    width = '100%',
    thickness = 1
  } = settings;

  const styles = {
    line: { borderTop: `${thickness}px solid ${color}` },
    dashed: { borderTop: `${thickness}px dashed ${color}` },
    dots: { borderTop: `${thickness}px dotted ${color}` },
    gradient: {
      height: `${thickness}px`,
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`
    }
  };

  return (
    <div style={{
      width: typeof width === 'number' ? `${width}px` : width,
      margin: '0 auto',
      ...styles[style]
    }} />
  );
};

// Contact Info Component
export const ContactInfoComponent = ({ settings = {}, areaSettings = {}, isPreview = false }) => {
  const {
    email = '',
    phone = '',
    website = '',
    showLabels = true,
    layout = 'vertical',
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const items = [];

  if (email) items.push({ icon: FaEnvelope, label: 'Email', value: email, href: `mailto:${email}` });
  if (phone) items.push({ icon: FaPhone, label: 'Telefono', value: phone, href: `tel:${phone}` });
  if (website) items.push({ icon: FaGlobe, label: 'Sito Web', value: website, href: website.startsWith('http') ? website : `https://${website}` });

  // Don't render if no items (unless in preview mode)
  if (items.length === 0 && !isPreview) return null;
  if (items.length === 0 && isPreview) {
    return (
      <div style={{ textAlign: alignment, padding: '12px', background: '#F3F4F6', borderRadius: '8px', color: '#9CA3AF', fontSize: '13px' }}>
        Contatti (clicca per modificare)
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: layout === 'horizontal' ? 'row' : 'column',
      gap: layout === 'horizontal' ? '32px' : '12px',
      justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
      alignItems: layout === 'horizontal' ? 'center' : (alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'),
      flexWrap: 'wrap'
    }}>
      {items.map((item, idx) => (
        <a
          key={idx}
          href={item.href}
          target={item.icon === FaGlobe ? '_blank' : undefined}
          rel={item.icon === FaGlobe ? 'noopener noreferrer' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: textColor,
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          <item.icon size={16} style={{ opacity: 0.7 }} />
          {showLabels && <span style={{ opacity: 0.7 }}>{item.label}:</span>}
          <span>{item.value}</span>
        </a>
      ))}
    </div>
  );
};

// Social Links Component
export const SocialLinksComponent = ({ settings = {}, areaSettings = {}, isPreview = false }) => {
  const {
    facebook = '',
    instagram = '',
    twitter = '',
    linkedin = '',
    youtube = '',
    size = 24,
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || '#1A1A1A';

  const socials = [
    { key: 'facebook', icon: FaFacebook, url: facebook },
    { key: 'instagram', icon: FaInstagram, url: instagram },
    { key: 'twitter', icon: FaTwitter, url: twitter },
    { key: 'linkedin', icon: FaLinkedin, url: linkedin },
    { key: 'youtube', icon: FaYoutube, url: youtube }
  ].filter(s => s.url);

  // Don't render if no socials (unless in preview mode)
  if (socials.length === 0 && !isPreview) return null;
  if (socials.length === 0 && isPreview) {
    return (
      <div style={{ textAlign: alignment, padding: '12px', background: '#F3F4F6', borderRadius: '8px', color: '#9CA3AF', fontSize: '13px' }}>
        Social (clicca per modificare)
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'
    }}>
      {socials.map((social) => (
        <a
          key={social.key}
          href={social.url.startsWith('http') ? social.url : `https://${social.url}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: textColor,
            opacity: 0.8,
            transition: 'opacity 0.2s'
          }}
        >
          <social.icon size={size} />
        </a>
      ))}
    </div>
  );
};

// Stats Component
export const StatsComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    items = [],
    layout = 'horizontal',
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  // Filter out empty items
  const validItems = items.filter(item => item.value && item.label);

  // Don't render if no items (unless in preview mode)
  if (validItems.length === 0 && !isPreview) return null;
  if (validItems.length === 0 && isPreview) {
    return (
      <div style={{ textAlign: alignment, padding: '16px', background: '#F3F4F6', borderRadius: '8px', color: '#9CA3AF', fontSize: '13px' }}>
        Statistiche (clicca per modificare)
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: layout === 'horizontal' ? 'row' : 'column',
      gap: layout === 'horizontal' ? '48px' : '24px',
      justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
      flexWrap: 'wrap'
    }}>
      {validItems.map((item, idx) => (
        <div key={idx} style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '36px',
            fontWeight: '700',
            color: accentColor,
            lineHeight: 1
          }}>
            {item.value}
          </div>
          <div style={{
            fontSize: '14px',
            color: textColor,
            opacity: 0.7,
            marginTop: '8px'
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// Asset Grid Component (uses system assets)
export const AssetGridComponent = ({ settings = {}, assets = [], globalStyles = {}, onAssetClick, isPreview = false }) => {
  const {
    columns = 3,
    gap = 24,
    showFilters = true,
    showCategory = true,
    showPrice = true,
    cardStyle = 'modern'
  } = settings;

  // Don't render if no assets (unless in preview mode)
  if ((!assets || assets.length === 0) && !isPreview) return null;
  if ((!assets || assets.length === 0) && isPreview) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: '#F9FAFB',
        borderRadius: '12px',
        color: '#6B7280'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Griglia Asset</p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
          Seleziona gli asset dal pannello in alto
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: `${gap}px`
    }}>
      {assets.map((asset) => (
        <div
          key={asset.id}
          onClick={() => onAssetClick && onAssetClick(asset)}
          style={{
            background: cardStyle === 'minimal' ? 'transparent' : '#FFFFFF',
            borderRadius: `${globalStyles?.borderRadius || 12}px`,
            overflow: 'hidden',
            cursor: 'pointer',
            border: cardStyle === 'minimal' ? '1px solid #E5E7EB' : 'none',
            boxShadow: cardStyle === 'modern' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            height: '160px',
            background: asset.immagine_principale ? `url(${getImageUrl(asset.immagine_principale)})` : '#F3F4F6',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
          <div style={{ padding: '16px' }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: '#1A1A1A'
            }}>
              {asset.nome}
            </h3>
            {showCategory && asset.category_name && (
              <p style={{
                margin: '4px 0 0',
                fontSize: '12px',
                color: '#6B7280'
              }}>
                {asset.category_name}
              </p>
            )}
            {showPrice && asset.prezzo_listino && (
              <p style={{
                margin: '8px 0 0',
                fontSize: '18px',
                fontWeight: '700',
                color: globalStyles?.colors?.accent || '#85FF00'
              }}>
                € {asset.prezzo_listino.toLocaleString('it-IT')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Asset Carousel Component
export const AssetCarouselComponent = ({ settings = {}, assets = [], globalStyles = {}, onAssetClick, isPreview = false }) => {
  const {
    visibleItems = 3,
    showArrows = true
  } = settings;

  // Don't render if no assets (unless in preview mode)
  if ((!assets || assets.length === 0) && !isPreview) return null;
  if ((!assets || assets.length === 0) && isPreview) {
    return (
      <div style={{
        padding: '30px 20px',
        textAlign: 'center',
        background: '#F9FAFB',
        borderRadius: '12px',
        color: '#6B7280'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Carosello Asset</p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
          Seleziona gli asset dal pannello in alto
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      overflow: 'auto',
      padding: '8px 0'
    }}>
      {assets.slice(0, visibleItems * 2).map((asset) => (
        <div
          key={asset.id}
          onClick={() => onAssetClick && onAssetClick(asset)}
          style={{
            minWidth: `${100 / visibleItems - 2}%`,
            background: '#FFFFFF',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{
            height: '140px',
            background: asset.immagine_principale ? `url(${getImageUrl(asset.immagine_principale)})` : '#F3F4F6',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
          <div style={{ padding: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
              {asset.nome}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
};

// Testimonial Component
export const TestimonialComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    quote = '',
    author = '',
    role = '',
    image = '',
    alignment = 'center',
    style = 'modern'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  // Don't render if no quote (unless in preview mode)
  if (!quote && !isPreview) return null;
  if (!quote && isPreview) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        color: textColor,
        opacity: 0.6
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Testimonianza (clicca per modificare)</p>
      </div>
    );
  }

  const containerStyle = {
    textAlign: alignment,
    maxWidth: '800px',
    margin: alignment === 'center' ? '0 auto' : '0'
  };

  const quoteStyle = {
    fontSize: style === 'large' ? '28px' : '20px',
    fontWeight: '400',
    color: textColor,
    lineHeight: 1.6,
    fontStyle: 'italic',
    margin: 0,
    position: 'relative',
    fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
  };

  return (
    <div style={containerStyle}>
      {/* Quote mark */}
      <div style={{
        fontSize: '72px',
        color: accentColor,
        opacity: 0.3,
        lineHeight: 0.8,
        marginBottom: '-20px',
        fontFamily: 'Georgia, serif'
      }}>
        "
      </div>

      <p style={quoteStyle}>{quote}</p>

      <div style={{
        marginTop: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
        gap: '16px'
      }}>
        {image && (
          <img
            src={getImageUrl(image)}
            alt={author}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${accentColor}`
            }}
          />
        )}
        <div style={{ textAlign: 'left' }}>
          <p style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: textColor
          }}>
            {author}
          </p>
          {role && (
            <p style={{
              margin: '4px 0 0',
              fontSize: '14px',
              color: textColor,
              opacity: 0.7
            }}>
              {role}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Feature List Component
export const FeatureListComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    items = [],
    layout = 'grid',
    columns = 3,
    iconColor = '',
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = iconColor || globalStyles?.colors?.accent || '#85FF00';

  // Filter out empty items
  const validItems = items.filter(item => item.title || item.description);

  // Don't render if no items (unless in preview mode)
  if (validItems.length === 0 && !isPreview) return null;
  if (validItems.length === 0 && isPreview) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        color: textColor,
        opacity: 0.6
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Feature List (clicca per modificare)</p>
      </div>
    );
  }

  const containerStyle = layout === 'grid'
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '32px'
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '600px',
        margin: alignment === 'center' ? '0 auto' : '0'
      };

  return (
    <div style={containerStyle}>
      {validItems.map((item, idx) => (
        <div
          key={idx}
          style={{
            textAlign: layout === 'grid' ? 'center' : 'left',
            display: layout === 'list' ? 'flex' : 'block',
            alignItems: 'flex-start',
            gap: layout === 'list' ? '16px' : '0'
          }}
        >
          {/* Icon/emoji */}
          {item.icon && (
            <div style={{
              fontSize: layout === 'grid' ? '40px' : '28px',
              marginBottom: layout === 'grid' ? '16px' : '0',
              lineHeight: 1
            }}>
              {item.icon}
            </div>
          )}

          {/* Checkmark for list layout without icon */}
          {!item.icon && layout === 'list' && (
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              <span style={{ color: '#1A1A1A', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
            </div>
          )}

          <div>
            {item.title && (
              <h4 style={{
                margin: 0,
                fontSize: layout === 'grid' ? '18px' : '16px',
                fontWeight: '600',
                color: textColor,
                fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
              }}>
                {item.title}
              </h4>
            )}
            {item.description && (
              <p style={{
                margin: item.title ? '8px 0 0' : '0',
                fontSize: '14px',
                color: textColor,
                opacity: 0.8,
                lineHeight: 1.5,
                fontFamily: globalStyles?.fonts?.body || 'Inter'
              }}>
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// ELITE COMPONENTS FOR WORLD-CLASS CLUBS
// ============================================

// Partner Logos Component - Showcase existing sponsors
export const PartnerLogosComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    logos = [],
    columns = 4,
    size = 120,
    grayscale = true,
    alignment = 'center',
    title = ''
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';

  if (logos.length === 0 && !isPreview) return null;
  if (logos.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Partner Logos (clicca per aggiungere)</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: alignment }}>
      {title && (
        <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: textColor, opacity: 0.5, marginBottom: '32px' }}>
          {title}
        </p>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '32px',
        alignItems: 'center',
        justifyItems: 'center'
      }}>
        {logos.map((logo, idx) => (
          <img
            key={idx}
            src={getImageUrl(logo.src)}
            alt={logo.name || 'Partner'}
            style={{
              maxWidth: `${size}px`,
              maxHeight: `${size * 0.6}px`,
              objectFit: 'contain',
              filter: grayscale ? 'grayscale(100%) brightness(1.5)' : 'none',
              opacity: grayscale ? 0.7 : 1,
              transition: 'all 0.3s'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Pricing/Package Cards Component - Sponsorship tiers
export const PackageCardsComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    packages = [],
    columns = 3,
    highlightIndex = 1,
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (packages.length === 0 && !isPreview) return null;
  if (packages.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Pacchetti Sponsorship (clicca per configurare)</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(columns, packages.length)}, 1fr)`,
      gap: '24px',
      alignItems: 'stretch'
    }}>
      {packages.map((pkg, idx) => {
        const isHighlighted = idx === highlightIndex;
        return (
          <div
            key={idx}
            style={{
              background: isHighlighted ? accentColor : 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '40px 32px',
              textAlign: 'center',
              position: 'relative',
              transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isHighlighted ? '0 20px 60px rgba(0,0,0,0.3)' : 'none',
              border: isHighlighted ? 'none' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {isHighlighted && pkg.badge && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1A1A1A',
                color: accentColor,
                padding: '6px 20px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {pkg.badge}
              </div>
            )}
            <h3 style={{
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: isHighlighted ? '#1A1A1A' : textColor,
              opacity: isHighlighted ? 0.7 : 0.5,
              marginBottom: '16px'
            }}>
              {pkg.name}
            </h3>
            <div style={{
              fontSize: '48px',
              fontWeight: '700',
              color: isHighlighted ? '#1A1A1A' : textColor,
              marginBottom: '8px',
              fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
            }}>
              {pkg.price}
            </div>
            {pkg.period && (
              <p style={{ fontSize: '14px', color: isHighlighted ? '#1A1A1A' : textColor, opacity: 0.6, marginBottom: '24px' }}>
                {pkg.period}
              </p>
            )}
            <div style={{ borderTop: `1px solid ${isHighlighted ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, paddingTop: '24px' }}>
              {pkg.features?.map((feature, fIdx) => (
                <p key={fIdx} style={{
                  fontSize: '14px',
                  color: isHighlighted ? '#1A1A1A' : textColor,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <span style={{ color: isHighlighted ? '#1A1A1A' : accentColor }}>✓</span>
                  {feature}
                </p>
              ))}
            </div>
            {pkg.buttonText && (
              <button style={{
                marginTop: '24px',
                padding: '14px 32px',
                background: isHighlighted ? '#1A1A1A' : accentColor,
                color: isHighlighted ? '#FFFFFF' : '#1A1A1A',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}>
                {pkg.buttonText}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Timeline Component - Club history, milestones
export const TimelineComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    items = [],
    layout = 'vertical',
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (items.length === 0 && !isPreview) return null;
  if (items.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Timeline (clicca per aggiungere eventi)</p>
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div style={{ display: 'flex', gap: '48px', overflowX: 'auto', padding: '20px 0' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ textAlign: 'center', minWidth: '200px' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: accentColor,
              marginBottom: '12px',
              fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
            }}>
              {item.year}
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              {item.title}
            </h4>
            {item.description && (
              <p style={{ fontSize: '14px', color: textColor, opacity: 0.7, lineHeight: 1.5 }}>
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', maxWidth: '600px', margin: alignment === 'center' ? '0 auto' : '0' }}>
      <div style={{
        position: 'absolute',
        left: '24px',
        top: 0,
        bottom: 0,
        width: '2px',
        background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)`
      }} />
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '32px', marginBottom: '48px', position: 'relative' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            color: '#1A1A1A',
            fontSize: '14px',
            flexShrink: 0,
            zIndex: 1
          }}>
            {item.year}
          </div>
          <div style={{ paddingTop: '8px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              {item.title}
            </h4>
            {item.description && (
              <p style={{ fontSize: '14px', color: textColor, opacity: 0.7, lineHeight: 1.6 }}>
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Awards/Achievements Component
export const AwardsComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    awards = [],
    columns = 4,
    showYear = true,
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (awards.length === 0 && !isPreview) return null;
  if (awards.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Trofei e Riconoscimenti (clicca per aggiungere)</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '32px',
      textAlign: 'center'
    }}>
      {awards.map((award, idx) => (
        <div key={idx} style={{ padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {award.icon || '🏆'}
          </div>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: textColor,
            marginBottom: '8px'
          }}>
            {award.title}
          </h4>
          {showYear && award.year && (
            <p style={{
              fontSize: '24px',
              fontWeight: '700',
              color: accentColor,
              marginBottom: '8px'
            }}>
              {award.year}
            </p>
          )}
          {award.description && (
            <p style={{ fontSize: '13px', color: textColor, opacity: 0.6 }}>
              {award.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// Metrics Dashboard Component - ROI, reach, engagement
export const MetricsDashboardComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    metrics = [],
    columns = 4,
    style = 'cards',
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (metrics.length === 0 && !isPreview) return null;
  if (metrics.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Metriche e KPI (clicca per configurare)</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '24px'
    }}>
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          style={{
            background: style === 'cards' ? 'rgba(255,255,255,0.05)' : 'transparent',
            borderRadius: '16px',
            padding: style === 'cards' ? '32px 24px' : '24px',
            textAlign: 'center',
            border: style === 'cards' ? '1px solid rgba(255,255,255,0.1)' : 'none'
          }}
        >
          {metric.icon && (
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>
              {metric.icon}
            </div>
          )}
          <div style={{
            fontSize: '42px',
            fontWeight: '700',
            color: accentColor,
            marginBottom: '8px',
            fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
          }}>
            {metric.value}
          </div>
          <p style={{
            fontSize: '14px',
            color: textColor,
            opacity: 0.7,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {metric.label}
          </p>
          {metric.description && (
            <p style={{ fontSize: '12px', color: textColor, opacity: 0.5, marginTop: '8px' }}>
              {metric.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// Quote Carousel Component - Multiple testimonials
export const QuoteCarouselComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    quotes = [],
    autoPlay = true,
    interval = 5000,
    alignment = 'center'
  } = settings;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  React.useEffect(() => {
    if (autoPlay && quotes.length > 1 && !isPreview) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
      }, interval);
      return () => clearInterval(timer);
    }
  }, [autoPlay, quotes.length, interval, isPreview]);

  if (quotes.length === 0 && !isPreview) return null;
  if (quotes.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Carosello Testimonianze (clicca per aggiungere)</p>
      </div>
    );
  }

  const currentQuote = quotes[currentIndex] || quotes[0];

  return (
    <div style={{ textAlign: alignment, maxWidth: '800px', margin: alignment === 'center' ? '0 auto' : '0' }}>
      <div style={{ fontSize: '72px', color: accentColor, opacity: 0.3, lineHeight: 0.8, marginBottom: '-20px' }}>"</div>
      <p style={{
        fontSize: '24px',
        fontWeight: '400',
        color: textColor,
        lineHeight: 1.6,
        fontStyle: 'italic',
        marginBottom: '32px'
      }}>
        {currentQuote.quote}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: alignment === 'center' ? 'center' : 'flex-start', gap: '16px' }}>
        {currentQuote.image && (
          <img
            src={getImageUrl(currentQuote.image)}
            alt={currentQuote.author}
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentColor}` }}
          />
        )}
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: textColor, margin: 0 }}>{currentQuote.author}</p>
          {currentQuote.role && <p style={{ fontSize: '14px', color: textColor, opacity: 0.7, margin: '4px 0 0' }}>{currentQuote.role}</p>}
        </div>
      </div>
      {quotes.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '32px' }}>
          {quotes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: idx === currentIndex ? accentColor : 'rgba(255,255,255,0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Countdown Component - Limited time offers
export const CountdownComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    targetDate = '',
    title = '',
    alignment = 'center',
    style = 'boxes'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    if (!targetDate) return;
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate && !isPreview) return null;
  if (!targetDate && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Countdown Timer (imposta data target)</p>
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: 'Giorni' },
    { value: timeLeft.hours, label: 'Ore' },
    { value: timeLeft.minutes, label: 'Minuti' },
    { value: timeLeft.seconds, label: 'Secondi' }
  ];

  return (
    <div style={{ textAlign: alignment }}>
      {title && (
        <h3 style={{ fontSize: '18px', color: textColor, marginBottom: '24px', fontWeight: '600' }}>
          {title}
        </h3>
      )}
      <div style={{ display: 'flex', gap: '16px', justifyContent: alignment === 'center' ? 'center' : 'flex-start' }}>
        {units.map((unit, idx) => (
          <div
            key={idx}
            style={{
              background: style === 'boxes' ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderRadius: '12px',
              padding: style === 'boxes' ? '24px 20px' : '16px',
              minWidth: '80px',
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '36px',
              fontWeight: '700',
              color: accentColor,
              fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
            }}>
              {String(unit.value).padStart(2, '0')}
            </div>
            <p style={{ fontSize: '11px', color: textColor, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>
              {unit.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Comparison Table Component
export const ComparisonTableComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    headers = [],
    rows = [],
    highlightColumn = -1
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if ((headers.length === 0 || rows.length === 0) && !isPreview) return null;
  if ((headers.length === 0 || rows.length === 0) && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Tabella Comparativa (clicca per configurare)</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                style={{
                  padding: '20px 16px',
                  textAlign: idx === 0 ? 'left' : 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: idx === highlightColumn ? '#1A1A1A' : textColor,
                  background: idx === highlightColumn ? accentColor : 'rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  style={{
                    padding: '16px',
                    textAlign: cellIdx === 0 ? 'left' : 'center',
                    fontSize: '14px',
                    color: cellIdx === highlightColumn ? '#1A1A1A' : textColor,
                    background: cellIdx === highlightColumn ? `${accentColor}22` : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  {cell === true ? <span style={{ color: accentColor }}>✓</span> : cell === false ? '—' : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Icon Grid Component - Features with icons
export const IconGridComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    items = [],
    columns = 3,
    iconSize = 48,
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (items.length === 0 && !isPreview) return null;
  if (items.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Griglia Icone (clicca per aggiungere)</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '40px',
      textAlign: 'center'
    }}>
      {items.map((item, idx) => (
        <div key={idx}>
          <div style={{
            fontSize: `${iconSize}px`,
            marginBottom: '20px',
            lineHeight: 1
          }}>
            {item.icon}
          </div>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: textColor,
            marginBottom: '12px'
          }}>
            {item.title}
          </h4>
          {item.description && (
            <p style={{
              fontSize: '14px',
              color: textColor,
              opacity: 0.7,
              lineHeight: 1.6
            }}>
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// Highlight Box Component - Callout, important info
export const HighlightBoxComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    title = '',
    content = '',
    icon = '',
    style = 'accent',
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (!content && !isPreview) return null;
  if (!content && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Box Evidenziato (clicca per configurare)</p>
      </div>
    );
  }

  const styles = {
    accent: { background: accentColor, color: '#1A1A1A' },
    glass: { background: 'rgba(255,255,255,0.1)', color: textColor, border: '1px solid rgba(255,255,255,0.2)' },
    outline: { background: 'transparent', color: textColor, border: `2px solid ${accentColor}` }
  };

  return (
    <div style={{
      ...styles[style],
      borderRadius: '16px',
      padding: '32px 40px',
      textAlign: alignment,
      maxWidth: '800px',
      margin: alignment === 'center' ? '0 auto' : '0'
    }}>
      {icon && <div style={{ fontSize: '40px', marginBottom: '16px' }}>{icon}</div>}
      {title && (
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '12px',
          color: styles[style].color
        }}>
          {title}
        </h3>
      )}
      <p style={{
        fontSize: '16px',
        lineHeight: 1.6,
        margin: 0,
        color: styles[style].color,
        opacity: 0.9
      }}>
        {content}
      </p>
    </div>
  );
};

// Gallery Masonry Component
export const GalleryMasonryComponent = ({ settings = {}, isPreview = false }) => {
  const {
    images = [],
    columns = 3,
    gap = 16,
    borderRadius = 12
  } = settings;

  if (images.length === 0 && !isPreview) return null;
  if (images.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#F3F4F6', borderRadius: '16px', color: '#6B7280' }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Galleria Masonry (clicca per aggiungere immagini)</p>
      </div>
    );
  }

  return (
    <div style={{
      columnCount: columns,
      columnGap: `${gap}px`
    }}>
      {images.map((img, idx) => (
        <div key={idx} style={{ marginBottom: `${gap}px`, breakInside: 'avoid' }}>
          <img
            src={getImageUrl(img.src)}
            alt={img.alt || ''}
            style={{
              width: '100%',
              borderRadius: `${borderRadius}px`,
              display: 'block'
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Accordion/FAQ Component
export const AccordionComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    items = [],
    allowMultiple = false,
    style = 'minimal'
  } = settings;

  const [openItems, setOpenItems] = React.useState([0]);
  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (items.length === 0 && !isPreview) return null;
  if (items.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>FAQ Accordion (clicca per aggiungere domande)</p>
      </div>
    );
  }

  const toggleItem = (idx) => {
    if (allowMultiple) {
      setOpenItems(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    } else {
      setOpenItems(prev => prev.includes(idx) ? [] : [idx]);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {items.map((item, idx) => {
        const isOpen = openItems.includes(idx);
        return (
          <div
            key={idx}
            style={{
              marginBottom: '8px',
              background: style === 'boxed' ? 'rgba(255,255,255,0.05)' : 'transparent',
              borderRadius: style === 'boxed' ? '12px' : '0',
              border: style === 'minimal' ? 'none' : undefined,
              borderBottom: style === 'minimal' ? '1px solid rgba(255,255,255,0.1)' : undefined
            }}
          >
            <button
              onClick={() => toggleItem(idx)}
              style={{
                width: '100%',
                padding: style === 'boxed' ? '20px 24px' : '20px 0',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: '600', color: textColor }}>
                {item.question}
              </span>
              <span style={{
                color: accentColor,
                fontSize: '20px',
                transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}>
                +
              </span>
            </button>
            {isOpen && (
              <div style={{
                padding: style === 'boxed' ? '0 24px 20px' : '0 0 20px',
                color: textColor,
                opacity: 0.8,
                fontSize: '15px',
                lineHeight: 1.6
              }}>
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Badge/Trust Indicators Component
export const BadgeComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    badges = [],
    alignment = 'center',
    size = 'medium'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';

  const sizes = {
    small: { padding: '8px 16px', fontSize: '12px' },
    medium: { padding: '12px 24px', fontSize: '14px' },
    large: { padding: '16px 32px', fontSize: '16px' }
  };

  if (badges.length === 0 && !isPreview) return null;
  if (badges.length === 0 && isPreview) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Badge di Fiducia (clicca per aggiungere)</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'
    }}>
      {badges.map((badge, idx) => (
        <div
          key={idx}
          style={{
            ...sizes[size],
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: textColor,
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {badge.icon && <span>{badge.icon}</span>}
          <span style={{ fontWeight: '500' }}>{badge.text}</span>
        </div>
      ))}
    </div>
  );
};

// Number Counter Component (animated on scroll)
export const NumberCounterComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    items = [],
    columns = 4,
    prefix = '',
    suffix = '',
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (items.length === 0 && !isPreview) return null;
  if (items.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Contatori Numerici (clicca per configurare)</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '48px',
      textAlign: 'center'
    }}>
      {items.map((item, idx) => (
        <div key={idx}>
          <div style={{
            fontSize: '56px',
            fontWeight: '700',
            color: accentColor,
            lineHeight: 1,
            fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
          }}>
            {item.prefix || prefix}{item.value}{item.suffix || suffix}
          </div>
          <p style={{
            fontSize: '14px',
            color: textColor,
            opacity: 0.7,
            marginTop: '16px',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
};

// Team/Contact Showcase Component
export const TeamShowcaseComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    members = [],
    columns = 3,
    showRole = true,
    showContact = true,
    alignment = 'center'
  } = settings;

  const textColor = areaSettings.textColor || globalStyles?.colors?.text || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  if (members.length === 0 && !isPreview) return null;
  if (members.length === 0 && isPreview) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: textColor, opacity: 0.6 }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Team Showcase (clicca per aggiungere membri)</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '32px',
      textAlign: 'center'
    }}>
      {members.map((member, idx) => (
        <div key={idx}>
          {member.image && (
            <img
              src={getImageUrl(member.image)}
              alt={member.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: '20px',
                border: `3px solid ${accentColor}`
              }}
            />
          )}
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: textColor, marginBottom: '4px' }}>
            {member.name}
          </h4>
          {showRole && member.role && (
            <p style={{ fontSize: '14px', color: accentColor, marginBottom: '12px' }}>
              {member.role}
            </p>
          )}
          {showContact && (member.email || member.phone) && (
            <div style={{ fontSize: '13px', color: textColor, opacity: 0.7 }}>
              {member.email && <p style={{ margin: '4px 0' }}>{member.email}</p>}
              {member.phone && <p style={{ margin: '4px 0' }}>{member.phone}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Video Background Hero Component
export const VideoHeroComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const {
    videoUrl = '',
    overlayColor = 'rgba(0,0,0,0.5)',
    title = '',
    subtitle = '',
    buttonText = '',
    buttonLink = '',
    alignment = 'center',
    minHeight = '80vh'
  } = settings;

  const textColor = areaSettings.textColor || '#FFFFFF';
  const accentColor = globalStyles?.colors?.accent || '#C9A962';

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${youtubeMatch[1]}&controls=0&showinfo=0`;
    }
    return url;
  };

  if (!videoUrl && !isPreview) return null;

  return (
    <div style={{
      position: 'relative',
      minHeight: isPreview ? '300px' : minHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {videoUrl && (
        <iframe
          src={getEmbedUrl(videoUrl)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '200%',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            pointerEvents: 'none'
          }}
          allow="autoplay; fullscreen"
        />
      )}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: overlayColor
      }} />
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: alignment,
        padding: '40px',
        maxWidth: '900px'
      }}>
        {title && (
          <h1 style={{
            fontSize: isPreview ? '32px' : '64px',
            fontWeight: '700',
            color: textColor,
            marginBottom: '24px',
            lineHeight: 1.1,
            fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
          }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p style={{
            fontSize: isPreview ? '16px' : '20px',
            color: textColor,
            opacity: 0.9,
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            {subtitle}
          </p>
        )}
        {buttonText && (
          <a
            href={buttonLink}
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              background: accentColor,
              color: '#1A1A1A',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              textDecoration: 'none'
            }}
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
};

// Component renderer map
export const COMPONENT_RENDERERS = {
  'heading': HeadingComponent,
  'paragraph': ParagraphComponent,
  'button': ButtonComponent,
  'image': ImageComponent,
  'logo': LogoComponent,
  'video': VideoComponent,
  'spacer': SpacerComponent,
  'divider': DividerComponent,
  'contact-info': ContactInfoComponent,
  'social-links': SocialLinksComponent,
  'stats': StatsComponent,
  'asset-grid': AssetGridComponent,
  'asset-carousel': AssetCarouselComponent,
  'testimonial': TestimonialComponent,
  'feature-list': FeatureListComponent,
  // Elite components
  'partner-logos': PartnerLogosComponent,
  'package-cards': PackageCardsComponent,
  'timeline': TimelineComponent,
  'awards': AwardsComponent,
  'metrics-dashboard': MetricsDashboardComponent,
  'quote-carousel': QuoteCarouselComponent,
  'countdown': CountdownComponent,
  'comparison-table': ComparisonTableComponent,
  'icon-grid': IconGridComponent,
  'highlight-box': HighlightBoxComponent,
  'gallery-masonry': GalleryMasonryComponent,
  'accordion': AccordionComponent,
  'badge': BadgeComponent,
  'number-counter': NumberCounterComponent,
  'team-showcase': TeamShowcaseComponent,
  'video-hero': VideoHeroComponent
};

// Main component renderer
export const renderComponent = (component, { areaSettings, globalStyles, assets, onAssetClick, isPreview = false }) => {
  const Renderer = COMPONENT_RENDERERS[component.type];
  if (!Renderer) {
    if (isPreview) {
      return (
        <div style={{ padding: '16px', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px' }}>
          Componente sconosciuto: {component.type}
        </div>
      );
    }
    return null;
  }

  return (
    <Renderer
      settings={component.settings}
      areaSettings={areaSettings}
      globalStyles={globalStyles}
      assets={assets}
      onAssetClick={onAssetClick}
      isPreview={isPreview}
    />
  );
};

export default COMPONENT_RENDERERS;
