import React from 'react';
import { renderComponent } from './ComponentRenderer';
import { getImageUrl } from '../../utils/imageUtils';
import { FaGripVertical } from 'react-icons/fa';

// Get background style for an area
const getBackgroundStyle = (background = {}) => {
  const { type = 'color', color = '#FFFFFF', gradient = {}, image = {} } = background;

  switch (type) {
    case 'gradient':
      return {
        background: `linear-gradient(${gradient.direction || '135deg'}, ${gradient.from || '#1A1A1A'}, ${gradient.to || '#333333'})`
      };

    case 'image':
      if (!image.src) return { background: color };

      // Build overlay string - supports both simple overlay and gradient overlay
      let overlay = '';
      if (image.overlayGradient) {
        // Use custom gradient overlay (for more complex effects)
        overlay = `${image.overlayGradient}, `;
      } else if (image.overlay) {
        // Use simple color overlay
        overlay = `linear-gradient(${image.overlayColor || 'rgba(0,0,0,0.5)'}, ${image.overlayColor || 'rgba(0,0,0,0.5)'}), `;
      }

      return {
        backgroundImage: `${overlay}url(${getImageUrl(image.src)})`,
        backgroundSize: image.size || 'cover',
        backgroundPosition: image.position || 'center',
        backgroundAttachment: image.fixed ? 'fixed' : 'scroll',
        backgroundRepeat: 'no-repeat'
      };

    case 'color':
    default:
      return { background: color };
  }
};

// Area Renderer Component
const AreaRenderer = ({
  area,
  globalStyles = {},
  assets = [],
  onAssetClick,
  isPreview = false,
  isSelected = false,
  onClick,
  onComponentClick,
  selectedComponentId,
  // Drag and drop props
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dropTarget,
  draggedItem
}) => {
  const { settings = {}, components = [] } = area;
  const { background, padding = {}, maxWidth = 1200, textColor, fullWidth = false, minHeight } = settings;

  const backgroundStyle = getBackgroundStyle(background);

  // Calculate minHeight - in preview mode, use a scaled version
  let computedMinHeight = 'auto';
  if (isPreview) {
    computedMinHeight = minHeight ? `calc(${minHeight} * 0.4)` : '120px';
  } else if (minHeight) {
    computedMinHeight = minHeight;
  }

  const areaStyle = {
    ...backgroundStyle,
    paddingTop: isPreview ? `${Math.max(24, padding.top / 2)}px` : `${padding.top || 60}px`,
    paddingBottom: isPreview ? `${Math.max(24, padding.bottom / 2)}px` : `${padding.bottom || 60}px`,
    paddingLeft: `${padding.left || 24}px`,
    paddingRight: `${padding.right || 24}px`,
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
    outline: isSelected ? '3px solid #85FF00' : 'none',
    outlineOffset: '-3px',
    minHeight: computedMinHeight,
    display: minHeight ? 'flex' : 'block',
    alignItems: minHeight ? 'center' : 'stretch',
    transition: 'outline 0.15s ease'
  };

  const containerStyle = {
    maxWidth: fullWidth ? '100%' : `${maxWidth}px`,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: isPreview ? '12px' : '16px'
  };

  // Check if this area is a valid drop target
  const isDropTarget = dropTarget && dropTarget.areaId === area.id;
  const isDragging = !!draggedItem;

  // Render drop indicator
  const renderDropIndicator = (index) => {
    const showIndicator = isDropTarget && dropTarget.index === index;
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDragOver) onDragOver(e, area.id, index);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDragOver) onDragOver(e, area.id, index);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDrop) onDrop(e, area.id, index);
        }}
        style={{
          height: isDragging ? '24px' : '0px',
          background: showIndicator ? '#85FF00' : 'transparent',
          borderRadius: '4px',
          transition: 'all 0.15s ease',
          margin: isDragging ? '4px 0' : '0',
          border: isDragging && !showIndicator ? '2px dashed #D1D5DB' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {showIndicator && (
          <span style={{ fontSize: '11px', color: '#1A1A1A', fontWeight: '500' }}>
            Rilascia qui
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      style={areaStyle}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(area.id);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDragOver && components.length === 0) {
          onDragOver(e, area.id, 0);
        }
      }}
      onDragLeave={(e) => {
        if (onDragLeave && !e.currentTarget.contains(e.relatedTarget)) {
          onDragLeave(e);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDrop && components.length === 0) {
          onDrop(e, area.id, 0);
        }
      }}
    >
      <div style={containerStyle}>
        {components.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onDragOver) onDragOver(e, area.id, 0);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onDragOver) onDragOver(e, area.id, 0);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onDrop) onDrop(e, area.id, 0);
            }}
            style={{
              padding: isDragging ? '60px 20px' : '40px 20px',
              textAlign: 'center',
              border: `2px dashed ${isDropTarget ? '#85FF00' : (isDragging ? '#85FF00' : (textColor ? `${textColor}33` : '#E5E7EB'))}`,
              borderRadius: '12px',
              color: isDropTarget ? '#85FF00' : (textColor || '#6B7280'),
              opacity: isDropTarget ? 1 : (isDragging ? 0.8 : 0.6),
              background: isDropTarget ? 'rgba(133, 255, 0, 0.1)' : (isDragging ? 'rgba(133, 255, 0, 0.02)' : 'transparent'),
              transition: 'all 0.2s'
            }}
          >
            <p style={{ margin: 0, fontSize: '14px', fontWeight: isDropTarget ? '600' : '400' }}>
              {isDropTarget ? '↓ Rilascia qui ↓' : (isDragging ? 'Trascina qui' : 'Area vuota - Trascina i componenti qui')}
            </p>
          </div>
        ) : (
          <>
            {/* Drop indicator at top */}
            {isPreview && renderDropIndicator(0)}

            {components.map((component, index) => (
              <React.Fragment key={component.id}>
                <div
                  draggable={isPreview}
                  onDragStart={(e) => {
                    if (isPreview && onDragStart) {
                      onDragStart(e, { type: 'existing', componentId: component.id, sourceAreaId: area.id });
                    }
                  }}
                  onDragEnd={(e) => {
                    if (onDragEnd) onDragEnd(e);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Determine if dropping above or below this component
                    const rect = e.currentTarget.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    const dropIndex = e.clientY < midY ? index : index + 1;
                    if (onDragOver) onDragOver(e, area.id, dropIndex);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    const dropIndex = e.clientY < midY ? index : index + 1;
                    if (onDrop) onDrop(e, area.id, dropIndex);
                  }}
                  onClick={(e) => {
                    if (onComponentClick) {
                      e.stopPropagation();
                      onComponentClick(component.id, area.id);
                    }
                  }}
                  style={{
                    position: 'relative',
                    outline: selectedComponentId === component.id ? '2px solid #3B82F6' : 'none',
                    outlineOffset: '4px',
                    borderRadius: '4px',
                    cursor: isPreview ? 'grab' : 'default',
                    opacity: draggedItem?.componentId === component.id ? 0.4 : 1,
                    transition: 'all 0.2s',
                    background: draggedItem?.componentId === component.id ? 'rgba(0,0,0,0.05)' : 'transparent'
                  }}
                >
                  {/* Drag handle - always visible in preview mode */}
                  {isPreview && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '-28px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '22px',
                        height: '22px',
                        borderRadius: '4px',
                        background: selectedComponentId === component.id ? '#3B82F6' : '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        zIndex: 10,
                        opacity: selectedComponentId === component.id ? 1 : 0.6,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#3B82F6';
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedComponentId !== component.id) {
                          e.currentTarget.style.background = '#E5E7EB';
                          e.currentTarget.style.opacity = '0.6';
                        }
                      }}
                    >
                      <FaGripVertical style={{ color: selectedComponentId === component.id ? '#fff' : '#6B7280', fontSize: '10px' }} />
                    </div>
                  )}

                  {renderComponent(component, {
                    areaSettings: { textColor },
                    globalStyles,
                    assets,
                    onAssetClick,
                    isPreview
                  })}
                </div>

                {/* Drop indicator after each component */}
                {isPreview && renderDropIndicator(index + 1)}
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default AreaRenderer;
