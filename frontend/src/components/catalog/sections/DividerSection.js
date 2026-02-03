import React from 'react';

const DividerSection = ({ settings, globalStyles, isPreview = false }) => {
  const {
    style = 'line',
    height = 1,
    color = '',
    margin = 40
  } = settings || {};

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const dividerColor = color || '#333';
  const marginSize = isPreview ? margin / 2 : margin;

  const renderDivider = () => {
    switch (style) {
      case 'space':
        return (
          <div style={{
            height: isPreview ? '20px' : '60px'
          }} />
        );
      case 'dots':
        return (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isPreview ? '8px' : '16px'
          }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: isPreview ? '4px' : '8px',
                  height: isPreview ? '4px' : '8px',
                  borderRadius: '50%',
                  background: colors.secondary
                }}
              />
            ))}
          </div>
        );
      case 'gradient':
        return (
          <div style={{
            height: isPreview ? '1px' : `${height}px`,
            background: `linear-gradient(90deg, transparent, ${colors.secondary}, transparent)`
          }} />
        );
      case 'decorative':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPreview ? '10px' : '20px'
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${dividerColor})`
            }} />
            <div style={{
              width: isPreview ? '6px' : '12px',
              height: isPreview ? '6px' : '12px',
              borderRadius: '50%',
              background: colors.secondary
            }} />
            <div style={{
              flex: 1,
              height: '1px',
              background: `linear-gradient(90deg, ${dividerColor}, transparent)`
            }} />
          </div>
        );
      case 'line':
      default:
        return (
          <div style={{
            height: isPreview ? '1px' : `${height}px`,
            background: dividerColor
          }} />
        );
    }
  };

  return (
    <div style={{
      background: colors.background,
      padding: `${marginSize}px 20px`
    }}>
      <div style={{
        maxWidth: globalStyles?.spacing?.containerWidth || 1200,
        margin: '0 auto'
      }}>
        {renderDivider()}
      </div>
    </div>
  );
};

export default DividerSection;
