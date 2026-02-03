import React from 'react';

const TextSection = ({ settings, globalStyles, isPreview = false }) => {
  const {
    content = '',
    alignment = 'left',
    style = 'normal',
    textStyle = {}
  } = settings || {};

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const getStyleVariant = () => {
    switch (style) {
      case 'highlighted':
        return {
          background: 'rgba(255,255,255,0.05)',
          borderLeft: `4px solid ${colors.secondary}`,
          padding: isPreview ? '15px' : '24px',
          borderRadius: globalStyles?.borderRadius || 12
        };
      case 'quote':
        return {
          fontStyle: 'italic',
          borderLeft: `3px solid ${colors.secondary}`,
          paddingLeft: isPreview ? '15px' : '24px',
          marginLeft: 0
        };
      case 'centered':
        return {
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto'
        };
      default:
        return {};
    }
  };

  return (
    <section style={{
      background: colors.background,
      padding: isPreview ? '20px 15px' : '60px 20px'
    }}>
      <div style={{
        maxWidth: globalStyles?.spacing?.containerWidth || 1200,
        margin: '0 auto',
        ...getStyleVariant()
      }}>
        <div
          style={{
            fontSize: textStyle?.fontSize || (isPreview ? '12px' : '16px'),
            lineHeight: textStyle?.lineHeight || 1.7,
            color: textStyle?.color || colors.text,
            textAlign: textStyle?.textAlign || alignment,
            fontFamily: textStyle?.fontFamily || globalStyles?.fonts?.body || 'Inter',
            fontWeight: textStyle?.fontWeight || '400',
            letterSpacing: textStyle?.letterSpacing || 0,
            ...(textStyle || {})
          }}
          dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
        />
      </div>
    </section>
  );
};

export default TextSection;
