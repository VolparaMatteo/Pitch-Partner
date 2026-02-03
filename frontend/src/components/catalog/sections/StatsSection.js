import React from 'react';
import { FaCube, FaTrophy, FaUsers, FaCalendarAlt } from 'react-icons/fa';

const StatsSection = ({ settings, globalStyles, catalog, isPreview = false }) => {
  const {
    stats = [],
    title = {},
    layout = 'row',
    showIcons = true
  } = settings || {};

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const iconMap = {
    cube: FaCube,
    trophy: FaTrophy,
    users: FaUsers,
    calendar: FaCalendarAlt
  };

  // Default stats based on catalog
  const defaultStats = [
    {
      value: catalog?.assets?.length || catalog?.num_assets || 0,
      label: 'Asset Disponibili',
      icon: 'cube'
    },
    {
      value: catalog?.assets?.filter(a => a.disponibile).length || 0,
      label: 'Disponibili',
      icon: 'trophy'
    }
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <section style={{
      background: colors.background,
      padding: isPreview ? '30px 15px' : '80px 20px'
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
            marginBottom: isPreview ? '24px' : '48px',
            textAlign: title?.style?.textAlign || 'center',
            fontFamily: title?.style?.fontFamily || globalStyles?.fonts?.heading || 'Montserrat',
            margin: 0,
            marginBottom: isPreview ? '24px' : '48px'
          }}>
            {title.content}
          </h2>
        )}

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: layout === 'row'
            ? `repeat(${Math.min(displayStats.length, isPreview ? 2 : 4)}, 1fr)`
            : '1fr',
          gap: isPreview ? '16px' : '32px'
        }}>
          {displayStats.map((stat, index) => {
            const IconComponent = iconMap[stat.icon] || FaCube;
            return (
              <div
                key={index}
                style={{
                  background: '#111',
                  borderRadius: globalStyles?.borderRadius || 12,
                  padding: isPreview ? '16px' : '32px',
                  textAlign: 'center',
                  border: '1px solid #222'
                }}
              >
                {showIcons && (
                  <IconComponent style={{
                    fontSize: isPreview ? '20px' : '40px',
                    color: colors.secondary,
                    marginBottom: isPreview ? '8px' : '16px'
                  }} />
                )}
                <div style={{
                  fontSize: isPreview ? '24px' : '48px',
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: isPreview ? '4px' : '8px',
                  fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: isPreview ? '11px' : '14px',
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontFamily: globalStyles?.fonts?.body || 'Inter'
                }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
