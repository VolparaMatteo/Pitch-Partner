import React, { useState } from 'react';
import { getImageUrl } from '../../../utils/imageUtils';
import DefaultAsset from '../../../static/logo/FavIcon.png';
import { FaEuroSign, FaSearch, FaLayerGroup } from 'react-icons/fa';

const AssetGridSection = ({ settings, globalStyles, catalog, assets, isPreview = false, onAssetClick }) => {
  const {
    layout = 'grid',
    columns = 3,
    showCategory = true,
    showFilters = true,
    cardStyle = 'modern',
    title = {}
  } = settings || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  // Get unique categories from assets
  const categories = assets
    ? [...new Set(assets.map(a => a.category_name || 'Altro'))]
    : [];

  // Filter assets
  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = asset.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.descrizione && asset.descrizione.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' ||
      (asset.category_name || 'Altro') === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Group assets by category
  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    const category = asset.category_name || 'Altro';
    if (!acc[category]) acc[category] = [];
    acc[category].push(asset);
    return acc;
  }, {});

  const getGridColumns = () => {
    if (isPreview) return 2;
    switch (columns) {
      case 2: return 'repeat(auto-fill, minmax(400px, 1fr))';
      case 4: return 'repeat(auto-fill, minmax(250px, 1fr))';
      case 3:
      default: return 'repeat(auto-fill, minmax(300px, 1fr))';
    }
  };

  const renderAssetCard = (asset) => {
    const cardStyles = {
      modern: {
        background: '#111',
        borderRadius: globalStyles?.borderRadius || 16,
        overflow: 'hidden',
        border: '1px solid #222',
        cursor: 'pointer',
        transition: 'all 0.3s'
      },
      minimal: {
        background: 'transparent',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #333',
        cursor: 'pointer',
        transition: 'all 0.2s'
      },
      card: {
        background: '#1A1A1A',
        borderRadius: globalStyles?.borderRadius || 12,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        transition: 'all 0.3s'
      }
    };

    return (
      <div
        key={asset.id}
        onClick={() => onAssetClick && onAssetClick(asset)}
        style={cardStyles[cardStyle] || cardStyles.modern}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
          e.currentTarget.style.borderColor = colors.secondary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = cardStyle === 'card' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none';
          e.currentTarget.style.borderColor = '#222';
        }}
      >
        {/* Image */}
        <div style={{
          height: isPreview ? '100px' : '200px',
          background: '#1A1A1A',
          position: 'relative',
          overflow: 'hidden'
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
              top: isPreview ? '6px' : '12px',
              right: isPreview ? '6px' : '12px',
              padding: isPreview ? '3px 6px' : '6px 12px',
              borderRadius: '20px',
              fontSize: isPreview ? '9px' : '12px',
              fontWeight: '500',
              background: asset.disponibile ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: '#fff'
            }}>
              {asset.disponibile ? 'Disponibile' : 'Non disponibile'}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: isPreview ? '10px' : '20px' }}>
          <h3 style={{
            fontSize: isPreview ? '12px' : '18px',
            fontWeight: '600',
            marginBottom: isPreview ? '4px' : '8px',
            color: colors.text,
            fontFamily: globalStyles?.fonts?.heading || 'Montserrat',
            margin: 0
          }}>
            {asset.nome}
          </h3>

          {asset.descrizione_breve && !isPreview && (
            <p style={{
              fontSize: '14px',
              color: colors.textMuted,
              marginBottom: '16px',
              lineHeight: 1.5,
              fontFamily: globalStyles?.fonts?.body || 'Inter'
            }}>
              {asset.descrizione_breve}
            </p>
          )}

          {/* Details */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: isPreview ? '6px' : '12px'
          }}>
            {/* Price */}
            {catalog?.mostra_prezzi && asset.prezzo_listino && (
              <div style={{
                fontSize: isPreview ? '11px' : '20px',
                fontWeight: '700',
                color: colors.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FaEuroSign style={{ fontSize: isPreview ? '9px' : '16px' }} />
                {asset.prezzo_listino.toLocaleString('it-IT')}
              </div>
            )}

            {/* Type */}
            <span style={{
              padding: isPreview ? '2px 6px' : '4px 10px',
              background: '#222',
              borderRadius: '6px',
              fontSize: isPreview ? '8px' : '12px',
              color: colors.textMuted,
              textTransform: 'capitalize'
            }}>
              {asset.tipo}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: colors.background,
      padding: isPreview ? '20px 10px' : '40px 20px'
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
            textAlign: title?.style?.textAlign || 'left',
            fontFamily: title?.style?.fontFamily || globalStyles?.fonts?.heading || 'Montserrat'
          }}>
            {title.content}
          </h2>
        )}

        {/* Search & Filter Bar */}
        {showFilters && !isPreview && (
          <div style={{
            background: '#111',
            borderBottom: '1px solid #222',
            padding: '16px 20px',
            borderRadius: globalStyles?.borderRadius || 12,
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Search */}
              <div style={{
                flex: 1,
                minWidth: '250px',
                position: 'relative'
              }}>
                <FaSearch style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280'
                }} />
                <input
                  type="text"
                  placeholder="Cerca asset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 42px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#1A1A1A',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedCategory === 'all' ? colors.secondary : '#222',
                    color: selectedCategory === 'all' ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  Tutti ({assets?.length || 0})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: selectedCategory === cat ? colors.secondary : '#222',
                      color: selectedCategory === cat ? '#000' : '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assets */}
        {showCategory ? (
          // Grouped by category
          Object.entries(groupedAssets).map(([category, categoryAssets]) => (
            <section key={category} style={{ marginBottom: isPreview ? '24px' : '48px' }}>
              {/* Category Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: isPreview ? '12px' : '24px'
              }}>
                <FaLayerGroup style={{ color: colors.secondary, fontSize: isPreview ? '14px' : '24px' }} />
                <h2 style={{
                  fontSize: isPreview ? '14px' : '24px',
                  fontWeight: '600',
                  color: colors.text,
                  margin: 0,
                  fontFamily: globalStyles?.fonts?.heading || 'Montserrat'
                }}>
                  {category}
                </h2>
                <span style={{
                  padding: '4px 12px',
                  background: '#222',
                  borderRadius: '20px',
                  fontSize: isPreview ? '10px' : '14px',
                  color: colors.textMuted
                }}>
                  {categoryAssets.length} asset
                </span>
              </div>

              {/* Assets Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isPreview ? 'repeat(2, 1fr)' : getGridColumns(),
                gap: isPreview ? '10px' : '20px'
              }}>
                {categoryAssets.map(renderAssetCard)}
              </div>
            </section>
          ))
        ) : (
          // Flat grid
          <div style={{
            display: 'grid',
            gridTemplateColumns: isPreview ? 'repeat(2, 1fr)' : getGridColumns(),
            gap: isPreview ? '10px' : '20px'
          }}>
            {filteredAssets.map(renderAssetCard)}
          </div>
        )}

        {filteredAssets.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: isPreview ? '30px 10px' : '60px 20px',
            color: colors.textMuted
          }}>
            <p style={{ margin: 0, fontSize: isPreview ? '12px' : '16px' }}>Nessun asset trovato</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetGridSection;
