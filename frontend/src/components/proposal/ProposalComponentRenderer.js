import React from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import {
  FaEnvelope, FaPhone, FaGlobe, FaBuilding, FaUser,
  FaCalendarAlt, FaCheckCircle, FaClock, FaFileContract,
  FaHandshake, FaEuroSign
} from 'react-icons/fa';

// ============================================
// HEADER COMPONENTS
// ============================================

// Proposal Header - Logo, code, date
export const ProposalHeaderComponent = ({
  settings = {},
  proposalData = {},
  clubData = {},
  areaSettings = {},
  isPreview = false
}) => {
  const { showLogo = true, showCode = true, showDate = true, alignment = 'left' } = settings;
  const textColor = areaSettings.textColor || '#1A1A1A';

  const logoUrl = clubData?.logo_url || clubData?.brand?.logo_chiaro;

  if (!showLogo && !showCode && !showDate && !isPreview) return null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: alignment === 'center' ? 'center' : 'space-between',
      alignItems: 'flex-start',
      gap: '20px',
      flexWrap: 'wrap'
    }}>
      {/* Logo */}
      {showLogo && (
        <div>
          {logoUrl ? (
            <img
              src={getImageUrl(logoUrl)}
              alt={clubData?.nome || 'Logo'}
              style={{ height: '50px', objectFit: 'contain' }}
            />
          ) : isPreview ? (
            <div style={{
              width: '120px',
              height: '50px',
              background: '#F3F4F6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              fontSize: '12px'
            }}>
              Logo Club
            </div>
          ) : null}
        </div>
      )}

      {/* Info */}
      <div style={{ textAlign: alignment === 'center' ? 'center' : 'right' }}>
        {showCode && (
          <div style={{ fontSize: '12px', color: textColor, opacity: 0.6 }}>
            {proposalData?.codice || (isPreview ? 'PROP-2024-001' : '')}
          </div>
        )}
        {showDate && (
          <div style={{ fontSize: '12px', color: textColor, opacity: 0.6, marginTop: '4px' }}>
            {proposalData?.created_at
              ? new Date(proposalData.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
              : (isPreview ? new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
            }
          </div>
        )}
      </div>
    </div>
  );
};

// Proposal Title
export const ProposalTitleComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const {
    text = '',
    subtitle = '',
    fontSize = 36,
    alignment = 'left',
    color = ''
  } = settings;

  const title = text || proposalData?.titolo;
  const sub = subtitle || proposalData?.sottotitolo;
  const textColor = color || areaSettings.textColor || '#1A1A1A';
  const fontFamily = globalStyles?.fonts?.heading || 'Montserrat';

  if (!title && !sub && !isPreview) return null;
  if (!title && !sub && isPreview) {
    return (
      <div style={{ padding: '20px', background: '#F3F4F6', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF' }}>
        Titolo Proposta (clicca per modificare)
      </div>
    );
  }

  return (
    <div style={{ textAlign: alignment }}>
      {(title || isPreview) && (
        <h1 style={{
          fontSize: `${fontSize}px`,
          fontWeight: '700',
          color: textColor,
          fontFamily: `'${fontFamily}', sans-serif`,
          margin: 0,
          lineHeight: 1.2
        }}>
          {title || 'Titolo Proposta'}
        </h1>
      )}
      {(sub || isPreview) && (
        <p style={{
          fontSize: `${Math.max(14, fontSize * 0.45)}px`,
          color: textColor,
          opacity: 0.7,
          margin: '12px 0 0',
          fontFamily: `'${globalStyles?.fonts?.body || 'Inter'}', sans-serif`
        }}>
          {sub || 'Sottotitolo opzionale'}
        </p>
      )}
    </div>
  );
};

// ============================================
// RECIPIENT COMPONENTS
// ============================================

// Recipient Card
export const RecipientCardComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const {
    style = 'card',
    showRole = true,
    showContact = true,
    showSector = true
  } = settings;

  const recipient = {
    company: proposalData?.destinatario_azienda,
    name: proposalData?.destinatario_nome,
    role: proposalData?.destinatario_ruolo,
    email: proposalData?.destinatario_email,
    phone: proposalData?.destinatario_telefono,
    sector: proposalData?.settore_merceologico
  };

  const hasData = recipient.company || recipient.name;
  if (!hasData && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  const cardStyles = {
    card: {
      padding: '24px',
      background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.1)' : '#F9FAFB',
      borderRadius: `${globalStyles?.borderRadius || 12}px`,
      border: `1px solid ${areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`
    },
    minimal: {
      padding: '0'
    },
    premium: {
      padding: '32px',
      background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      borderRadius: `${globalStyles?.borderRadius || 16}px`,
      border: `2px solid ${accentColor}20`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    }
  };

  return (
    <div style={cardStyles[style] || cardStyles.card}>
      {/* Company */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <FaBuilding style={{ color: accentColor, fontSize: '20px' }} />
        <span style={{
          fontSize: '20px',
          fontWeight: '700',
          color: textColor,
          fontFamily: `'${globalStyles?.fonts?.heading || 'Montserrat'}', sans-serif`
        }}>
          {recipient.company || (isPreview ? 'Nome Azienda' : '')}
        </span>
      </div>

      {/* Name & Role */}
      {(recipient.name || isPreview) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <FaUser style={{ color: textColor, opacity: 0.5, fontSize: '14px' }} />
          <span style={{ color: textColor, fontSize: '15px' }}>
            {recipient.name || 'Nome Contatto'}
            {showRole && (recipient.role || isPreview) && (
              <span style={{ opacity: 0.6, marginLeft: '8px' }}>
                • {recipient.role || 'Ruolo'}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Contact */}
      {showContact && (
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
          {(recipient.email || isPreview) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaEnvelope style={{ color: textColor, opacity: 0.5, fontSize: '12px' }} />
              <span style={{ color: textColor, fontSize: '13px', opacity: 0.8 }}>
                {recipient.email || 'email@esempio.it'}
              </span>
            </div>
          )}
          {(recipient.phone || isPreview) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaPhone style={{ color: textColor, opacity: 0.5, fontSize: '12px' }} />
              <span style={{ color: textColor, fontSize: '13px', opacity: 0.8 }}>
                {recipient.phone || '+39 000 0000000'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sector */}
      {showSector && (recipient.sector || isPreview) && (
        <div style={{
          marginTop: '16px',
          padding: '8px 12px',
          background: `${accentColor}15`,
          borderRadius: '6px',
          display: 'inline-block'
        }}>
          <span style={{ fontSize: '12px', color: textColor, fontWeight: '500' }}>
            {recipient.sector || 'Settore'}
          </span>
        </div>
      )}
    </div>
  );
};

// Recipient Inline
export const RecipientInlineComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  isPreview = false
}) => {
  const { layout = 'horizontal' } = settings;
  const textColor = areaSettings.textColor || '#1A1A1A';

  const recipient = {
    company: proposalData?.destinatario_azienda,
    name: proposalData?.destinatario_nome
  };

  if (!recipient.company && !recipient.name && !isPreview) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: layout === 'horizontal' ? 'row' : 'column',
      gap: '8px',
      alignItems: layout === 'horizontal' ? 'center' : 'flex-start'
    }}>
      <span style={{ color: textColor, opacity: 0.6, fontSize: '14px' }}>Per:</span>
      <span style={{ color: textColor, fontWeight: '600', fontSize: '16px' }}>
        {recipient.company || (isPreview ? 'Nome Azienda' : '')}
        {recipient.name && ` - ${recipient.name}`}
      </span>
    </div>
  );
};

// ============================================
// CONTENT COMPONENTS
// ============================================

// Generic Heading
export const HeadingComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const { text = '', level = 'h2', fontSize = 24, alignment = 'left', color = '' } = settings;

  if (!text && !isPreview) return null;
  if (!text && isPreview) {
    return (
      <div style={{ padding: '12px', background: '#F3F4F6', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
        Titolo sezione
      </div>
    );
  }

  const textColor = color || areaSettings.textColor || '#1A1A1A';
  const Tag = level;

  return (
    <Tag style={{
      fontSize: `${fontSize}px`,
      fontWeight: '700',
      color: textColor,
      textAlign: alignment,
      fontFamily: `'${globalStyles?.fonts?.heading || 'Montserrat'}', sans-serif`,
      margin: 0,
      lineHeight: 1.3
    }}>
      {text}
    </Tag>
  );
};

// Generic Paragraph
export const ParagraphComponent = ({ settings = {}, areaSettings = {}, globalStyles = {}, isPreview = false }) => {
  const { text = '', fontSize = 16, alignment = 'left', color = '' } = settings;

  if (!text && !isPreview) return null;
  if (!text && isPreview) {
    return (
      <div style={{ padding: '10px', background: '#F3F4F6', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
        Testo paragrafo
      </div>
    );
  }

  const textColor = color || areaSettings.textColor || '#1A1A1A';

  return (
    <p style={{
      fontSize: `${fontSize}px`,
      color: textColor,
      textAlign: alignment,
      fontFamily: `'${globalStyles?.fonts?.body || 'Inter'}', sans-serif`,
      margin: 0,
      lineHeight: 1.7,
      whiteSpace: 'pre-line'
    }}>
      {text}
    </p>
  );
};

// Intro Message
export const IntroMessageComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { text = '', style = 'highlighted' } = settings;
  const message = text || proposalData?.messaggio_introduttivo;

  if (!message && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  const styles = {
    simple: {},
    highlighted: {
      padding: '24px',
      background: `${accentColor}10`,
      borderRadius: `${globalStyles?.borderRadius || 12}px`,
      borderLeft: `4px solid ${accentColor}`
    },
    elegant: {
      padding: '32px',
      background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : '#FAFAFA',
      borderRadius: `${globalStyles?.borderRadius || 16}px`,
      fontStyle: 'italic'
    },
    premium: {
      padding: '40px',
      background: 'linear-gradient(135deg, rgba(133,255,0,0.1) 0%, rgba(133,255,0,0.02) 100%)',
      borderRadius: `${globalStyles?.borderRadius || 20}px`,
      border: `1px solid ${accentColor}30`
    }
  };

  return (
    <div style={styles[style] || styles.highlighted}>
      <p style={{
        fontSize: '17px',
        color: textColor,
        lineHeight: 1.8,
        margin: 0,
        fontFamily: `'${globalStyles?.fonts?.body || 'Inter'}', sans-serif`,
        whiteSpace: 'pre-line'
      }}>
        {message || (isPreview ? 'Gentile Cliente,\n\nSiamo lieti di presentarvi la nostra proposta...' : '')}
      </p>
    </div>
  );
};

// Value Proposition
export const ValuePropositionComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { title = 'Perché Sceglierci', text = '', showIcon = true } = settings;
  const content = text || proposalData?.proposta_valore;

  if (!content && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {showIcon && (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaHandshake style={{ color: '#1A1A1A', fontSize: '20px' }} />
          </div>
        )}
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: textColor,
          margin: 0,
          fontFamily: `'${globalStyles?.fonts?.heading || 'Montserrat'}', sans-serif`
        }}>
          {title}
        </h3>
      </div>
      <p style={{
        fontSize: '16px',
        color: textColor,
        lineHeight: 1.7,
        margin: 0,
        whiteSpace: 'pre-line'
      }}>
        {content || (isPreview ? 'Descrivi qui i vantaggi della tua proposta...' : '')}
      </p>
    </div>
  );
};

// ============================================
// PRICING COMPONENTS
// ============================================

// Items Table
export const ItemsTableComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const {
    showDescription = true,
    showQuantity = true,
    showUnitPrice = true,
    showDiscount = true,
    showTotal = true,
    groupByCategory = false,
    style = 'modern'
  } = settings;

  const items = proposalData?.items || [];

  if (items.length === 0 && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  // Mock items for preview
  const displayItems = items.length > 0 ? items : (isPreview ? [
    { id: 1, nome_display: 'Sponsorizzazione LED', descrizione_display: 'Visibilità bordo campo', quantita: 1, prezzo_unitario: 5000, valore_totale: 5000, gruppo: 'Visibilità' },
    { id: 2, nome_display: 'Logo su maglie', descrizione_display: 'Stampa fronte', quantita: 20, prezzo_unitario: 50, valore_totale: 1000, gruppo: 'Branding' }
  ] : []);

  const tableStyles = {
    modern: {
      borderRadius: `${globalStyles?.borderRadius || 12}px`,
      overflow: 'hidden',
      border: `1px solid ${areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`
    },
    elegant: {
      borderRadius: `${globalStyles?.borderRadius || 16}px`,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    },
    premium: {
      borderRadius: `${globalStyles?.borderRadius || 20}px`,
      overflow: 'hidden',
      border: `2px solid ${accentColor}30`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }
  };

  // Group items if needed
  let groupedItems = {};
  if (groupByCategory) {
    displayItems.forEach(item => {
      const group = item.gruppo || 'Altro';
      if (!groupedItems[group]) groupedItems[group] = [];
      groupedItems[group].push(item);
    });
  }

  const renderItemRow = (item, idx) => (
    <tr key={item.id || idx} style={{
      borderBottom: `1px solid ${areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`
    }}>
      <td style={{ padding: '16px', verticalAlign: 'top' }}>
        <div style={{ fontWeight: '600', color: textColor }}>{item.nome_display}</div>
        {showDescription && item.descrizione_display && (
          <div style={{ fontSize: '13px', color: textColor, opacity: 0.6, marginTop: '4px' }}>
            {item.descrizione_display}
          </div>
        )}
      </td>
      {showQuantity && (
        <td style={{ padding: '16px', textAlign: 'center', color: textColor }}>{item.quantita}</td>
      )}
      {showUnitPrice && (
        <td style={{ padding: '16px', textAlign: 'right', color: textColor }}>
          € {(item.prezzo_unitario || 0).toLocaleString('it-IT')}
        </td>
      )}
      {showTotal && (
        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: textColor }}>
          € {(item.valore_totale || 0).toLocaleString('it-IT')}
        </td>
      )}
    </tr>
  );

  return (
    <div style={tableStyles[style] || tableStyles.modern}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{
            background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : '#F9FAFB'
          }}>
            <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: textColor, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Descrizione
            </th>
            {showQuantity && (
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: textColor, opacity: 0.7, textTransform: 'uppercase' }}>Qtà</th>
            )}
            {showUnitPrice && (
              <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: textColor, opacity: 0.7, textTransform: 'uppercase' }}>Prezzo</th>
            )}
            {showTotal && (
              <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: textColor, opacity: 0.7, textTransform: 'uppercase' }}>Totale</th>
            )}
          </tr>
        </thead>
        <tbody>
          {groupByCategory ? (
            Object.entries(groupedItems).map(([group, groupItems]) => (
              <React.Fragment key={group}>
                <tr>
                  <td colSpan={4} style={{
                    padding: '12px 16px',
                    background: `${accentColor}10`,
                    fontWeight: '600',
                    fontSize: '13px',
                    color: textColor
                  }}>
                    {group}
                  </td>
                </tr>
                {groupItems.map(renderItemRow)}
              </React.Fragment>
            ))
          ) : (
            displayItems.map(renderItemRow)
          )}
        </tbody>
      </table>
    </div>
  );
};

// Items List (Simple)
export const ItemsListComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { showPrice = true, showDescription = false, compact = false } = settings;
  const items = proposalData?.items || [];

  if (items.length === 0 && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  const displayItems = items.length > 0 ? items : (isPreview ? [
    { id: 1, nome_display: 'Sponsorizzazione LED', valore_totale: 5000 },
    { id: 2, nome_display: 'Logo su maglie', valore_totale: 1000 }
  ] : []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '16px' }}>
      {displayItems.map((item, idx) => (
        <div key={item.id || idx} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: compact ? '12px 0' : '16px 0',
          borderBottom: `1px solid ${areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: accentColor
              }} />
              <span style={{ fontWeight: '500', color: textColor }}>{item.nome_display}</span>
            </div>
            {showDescription && item.descrizione_display && (
              <p style={{ fontSize: '13px', color: textColor, opacity: 0.6, margin: '4px 0 0 18px' }}>
                {item.descrizione_display}
              </p>
            )}
          </div>
          {showPrice && (
            <span style={{ fontWeight: '600', color: textColor }}>
              € {(item.valore_totale || 0).toLocaleString('it-IT')}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Pricing Summary
export const PricingSummaryComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const {
    showSubtotal = true,
    showDiscount = true,
    showVAT = false,
    vatPercentage = 22,
    style = 'boxed',
    highlightTotal = true
  } = settings;

  const subtotal = proposalData?.valore_totale || (isPreview ? 6000 : 0);
  const discount = proposalData?.sconto_percentuale || 0;
  const discountValue = proposalData?.sconto_valore || (subtotal * discount / 100);
  const total = proposalData?.valore_finale || (subtotal - discountValue);
  const vat = showVAT ? total * vatPercentage / 100 : 0;

  if (subtotal === 0 && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  const containerStyles = {
    simple: {},
    boxed: {
      padding: '24px',
      background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
      borderRadius: `${globalStyles?.borderRadius || 12}px`
    },
    modern: {
      padding: '30px',
      background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
      borderRadius: `${globalStyles?.borderRadius || 16}px`,
      border: `1px solid ${areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`
    },
    premium: {
      padding: '40px',
      background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
      borderRadius: `${globalStyles?.borderRadius || 20}px`,
      color: '#FFFFFF'
    }
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0'
  };

  return (
    <div style={containerStyles[style] || containerStyles.boxed}>
      {showSubtotal && (
        <div style={rowStyle}>
          <span style={{ color: style === 'premium' ? '#FFFFFF' : textColor, opacity: 0.7 }}>Subtotale</span>
          <span style={{ color: style === 'premium' ? '#FFFFFF' : textColor, fontWeight: '500' }}>
            € {subtotal.toLocaleString('it-IT')}
          </span>
        </div>
      )}

      {showDiscount && discount > 0 && (
        <div style={rowStyle}>
          <span style={{ color: '#10B981' }}>Sconto ({discount}%)</span>
          <span style={{ color: '#10B981', fontWeight: '500' }}>
            - € {discountValue.toLocaleString('it-IT')}
          </span>
        </div>
      )}

      {showVAT && (
        <div style={rowStyle}>
          <span style={{ color: style === 'premium' ? '#FFFFFF' : textColor, opacity: 0.7 }}>IVA ({vatPercentage}%)</span>
          <span style={{ color: style === 'premium' ? '#FFFFFF' : textColor, fontWeight: '500' }}>
            € {vat.toLocaleString('it-IT')}
          </span>
        </div>
      )}

      <div style={{
        ...rowStyle,
        borderTop: `2px solid ${style === 'premium' ? '#FFFFFF20' : '#E5E7EB'}`,
        marginTop: '12px',
        paddingTop: '20px'
      }}>
        <span style={{
          fontSize: '18px',
          fontWeight: '700',
          color: style === 'premium' ? '#FFFFFF' : textColor
        }}>
          Totale
        </span>
        <span style={{
          fontSize: highlightTotal ? '28px' : '20px',
          fontWeight: '700',
          color: style === 'premium' ? accentColor : (highlightTotal ? accentColor : textColor)
        }}>
          € {(total + vat).toLocaleString('it-IT')}
        </span>
      </div>
    </div>
  );
};

// Total Highlight
export const TotalHighlightComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { showLabel = true, size = 'large', style = 'accent' } = settings;
  const total = proposalData?.valore_finale || (isPreview ? 6000 : 0);

  if (total === 0 && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  const sizes = {
    small: { value: '32px', label: '14px' },
    medium: { value: '42px', label: '16px' },
    large: { value: '56px', label: '18px' }
  };

  const styles = {
    accent: { valueColor: accentColor, labelColor: textColor },
    dark: { valueColor: '#1A1A1A', labelColor: '#6B7280' },
    light: { valueColor: '#FFFFFF', labelColor: 'rgba(255,255,255,0.7)' }
  };

  const currentSize = sizes[size] || sizes.large;
  const currentStyle = styles[style] || styles.accent;

  return (
    <div style={{ textAlign: 'center' }}>
      {showLabel && (
        <div style={{
          fontSize: currentSize.label,
          color: currentStyle.labelColor,
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          Totale Proposta
        </div>
      )}
      <div style={{
        fontSize: currentSize.value,
        fontWeight: '800',
        color: currentStyle.valueColor,
        fontFamily: `'${globalStyles?.fonts?.heading || 'Montserrat'}', sans-serif`
      }}>
        € {total.toLocaleString('it-IT')}
      </div>
    </div>
  );
};

// ============================================
// TERMS COMPONENTS
// ============================================

// Terms & Conditions
export const TermsConditionsComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { text = '', showTitle = true, collapsible = false } = settings;
  const terms = text || proposalData?.termini_condizioni;

  if (!terms && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';

  return (
    <div>
      {showTitle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <FaFileContract style={{ color: textColor, opacity: 0.5 }} />
          <h4 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: textColor
          }}>
            Termini e Condizioni
          </h4>
        </div>
      )}
      <div style={{
        fontSize: '14px',
        color: textColor,
        opacity: 0.8,
        lineHeight: 1.7,
        whiteSpace: 'pre-line'
      }}>
        {terms || (isPreview ? 'I termini e le condizioni della proposta verranno visualizzati qui...' : '')}
      </div>
    </div>
  );
};

// Validity Info
export const ValidityInfoComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { showDuration = true, showExpiry = true, showSeasons = true, style = 'inline' } = settings;

  const duration = proposalData?.durata_mesi || (isPreview ? 12 : 0);
  const validity = proposalData?.giorni_validita || (isPreview ? 30 : 0);
  const seasons = proposalData?.stagioni || (isPreview ? '2024/2025' : '');
  const expiry = proposalData?.data_scadenza;

  const hasData = duration > 0 || validity > 0 || seasons;
  if (!hasData && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  if (style === 'cards') {
    return (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {showDuration && (duration > 0 || isPreview) && (
          <div style={{
            flex: '1 1 150px',
            padding: '20px',
            background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
            borderRadius: `${globalStyles?.borderRadius || 12}px`,
            textAlign: 'center'
          }}>
            <FaClock style={{ color: accentColor, fontSize: '24px', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: '700', color: textColor }}>{duration}</div>
            <div style={{ fontSize: '13px', color: textColor, opacity: 0.6 }}>mesi</div>
          </div>
        )}
        {showExpiry && (validity > 0 || isPreview) && (
          <div style={{
            flex: '1 1 150px',
            padding: '20px',
            background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
            borderRadius: `${globalStyles?.borderRadius || 12}px`,
            textAlign: 'center'
          }}>
            <FaCalendarAlt style={{ color: accentColor, fontSize: '24px', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: '700', color: textColor }}>{validity}</div>
            <div style={{ fontSize: '13px', color: textColor, opacity: 0.6 }}>giorni validità</div>
          </div>
        )}
        {showSeasons && (seasons || isPreview) && (
          <div style={{
            flex: '1 1 150px',
            padding: '20px',
            background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
            borderRadius: `${globalStyles?.borderRadius || 12}px`,
            textAlign: 'center'
          }}>
            <FaCalendarAlt style={{ color: accentColor, fontSize: '24px', marginBottom: '8px' }} />
            <div style={{ fontSize: '18px', fontWeight: '700', color: textColor }}>{seasons || '2024/25'}</div>
            <div style={{ fontSize: '13px', color: textColor, opacity: 0.6 }}>stagione</div>
          </div>
        )}
      </div>
    );
  }

  // Inline style
  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {showDuration && (duration > 0 || isPreview) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaClock style={{ color: accentColor }} />
          <span style={{ color: textColor }}>
            <strong>{duration}</strong> mesi
          </span>
        </div>
      )}
      {showExpiry && (validity > 0 || isPreview) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaCalendarAlt style={{ color: accentColor }} />
          <span style={{ color: textColor }}>
            Valida <strong>{validity}</strong> giorni
          </span>
        </div>
      )}
      {showSeasons && (seasons || isPreview) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaCalendarAlt style={{ color: accentColor }} />
          <span style={{ color: textColor }}>
            Stagione <strong>{seasons || '2024/25'}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

// Payment Terms
export const PaymentTermsComponent = ({
  settings = {},
  proposalData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { showPaymentMethod = true, showInstallments = true } = settings;

  const paymentMethod = proposalData?.modalita_pagamento || (isPreview ? 'rate' : '');
  const installments = proposalData?.numero_rate || (isPreview ? 3 : 0);

  if (!paymentMethod && !isPreview) return null;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const accentColor = globalStyles?.colors?.accent || '#85FF00';

  const paymentLabels = {
    'unica_soluzione': 'Pagamento in unica soluzione',
    'rate': `Pagamento in ${installments} rate`,
    'personalizzato': 'Pagamento personalizzato'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      background: areaSettings.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
      borderRadius: `${globalStyles?.borderRadius || 10}px`
    }}>
      <FaEuroSign style={{ color: accentColor, fontSize: '18px' }} />
      <span style={{ color: textColor, fontWeight: '500' }}>
        {paymentLabels[paymentMethod] || paymentMethod || 'Modalità di pagamento'}
      </span>
    </div>
  );
};

// ============================================
// CTA COMPONENTS
// ============================================

// CTA Accept
export const CtaAcceptComponent = ({
  settings = {},
  proposalData = {},
  clubData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { text = 'Accetta Proposta', style = 'primary', showEmail = true, showPhone = true } = settings;

  const accentColor = globalStyles?.colors?.accent || '#85FF00';
  const email = clubData?.email || proposalData?.club?.email;
  const phone = clubData?.telefono || proposalData?.club?.telefono;

  const buttonStyles = {
    primary: {
      background: accentColor,
      color: '#1A1A1A',
      border: 'none'
    },
    accent: {
      background: accentColor,
      color: '#1A1A1A',
      border: 'none',
      boxShadow: `0 4px 20px ${accentColor}40`
    },
    minimal: {
      background: 'transparent',
      color: areaSettings.textColor || '#1A1A1A',
      border: `2px solid ${areaSettings.textColor || '#1A1A1A'}`
    },
    premium: {
      background: `linear-gradient(135deg, ${accentColor} 0%, #66CC00 100%)`,
      color: '#1A1A1A',
      border: 'none',
      boxShadow: `0 8px 30px ${accentColor}50`
    }
  };

  const currentStyle = buttonStyles[style] || buttonStyles.primary;

  return (
    <div style={{ textAlign: 'center' }}>
      <a
        href={email ? `mailto:${email}?subject=Accettazione Proposta ${proposalData?.codice || ''}` : '#'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '16px 40px',
          borderRadius: `${globalStyles?.borderRadius || 12}px`,
          fontSize: '16px',
          fontWeight: '700',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          ...currentStyle
        }}
      >
        <FaCheckCircle />
        {text}
      </a>

      {(showEmail || showPhone) && (email || phone || isPreview) && (
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {showEmail && (email || isPreview) && (
            <a href={`mailto:${email}`} style={{
              color: areaSettings.textColor || '#1A1A1A',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              fontSize: '14px'
            }}>
              <FaEnvelope /> {email || 'email@club.it'}
            </a>
          )}
          {showPhone && (phone || isPreview) && (
            <a href={`tel:${phone}`} style={{
              color: areaSettings.textColor || '#1A1A1A',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              fontSize: '14px'
            }}>
              <FaPhone /> {phone || '+39 000 0000000'}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// Contact CTA
export const ContactCtaComponent = ({
  settings = {},
  clubData = {},
  areaSettings = {},
  globalStyles = {},
  isPreview = false
}) => {
  const { title = 'Hai domande?', text = 'Contattaci per maggiori informazioni', showEmail = true, showPhone = true } = settings;

  const textColor = areaSettings.textColor || '#1A1A1A';
  const email = clubData?.email;
  const phone = clubData?.telefono;

  return (
    <div style={{ textAlign: 'center' }}>
      {title && (
        <h4 style={{
          margin: '0 0 8px',
          fontSize: '16px',
          fontWeight: '600',
          color: textColor
        }}>
          {title}
        </h4>
      )}
      {text && (
        <p style={{
          margin: '0 0 16px',
          fontSize: '14px',
          color: textColor,
          opacity: 0.7
        }}>
          {text}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {showEmail && (email || isPreview) && (
          <a href={`mailto:${email}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            color: textColor,
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            <FaEnvelope /> Email
          </a>
        )}
        {showPhone && (phone || isPreview) && (
          <a href={`tel:${phone}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            color: textColor,
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            <FaPhone /> Chiama
          </a>
        )}
      </div>
    </div>
  );
};

// ============================================
// LAYOUT COMPONENTS
// ============================================

// Divider
export const DividerComponent = ({ settings = {} }) => {
  const { style = 'line', color = '#E5E7EB', width = '100%', thickness = 1 } = settings;

  const styles = {
    line: { borderTop: `${thickness}px solid ${color}` },
    dashed: { borderTop: `${thickness}px dashed ${color}` },
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

// Spacer
export const SpacerComponent = ({ settings = {} }) => {
  const { height = 40 } = settings;
  return <div style={{ height: `${height}px` }} />;
};

// Image
export const ImageComponent = ({ settings = {}, isPreview = false }) => {
  const { src = '', alt = '', width = '100%', alignment = 'center', borderRadius = 8 } = settings;

  if (!src && !isPreview) return null;
  if (!src && isPreview) {
    return (
      <div style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: '120px',
        background: '#F3F4F6',
        borderRadius: `${borderRadius}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9CA3AF',
        margin: alignment === 'center' ? '0 auto' : (alignment === 'right' ? '0 0 0 auto' : '0')
      }}>
        Immagine
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: alignment === 'center' ? 'center' : (alignment === 'right' ? 'flex-end' : 'flex-start')
    }}>
      <img
        src={getImageUrl(src)}
        alt={alt}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          borderRadius: `${borderRadius}px`,
          maxWidth: '100%'
        }}
      />
    </div>
  );
};

// ============================================
// COMPONENT RENDERERS MAP
// ============================================

export const COMPONENT_RENDERERS = {
  'proposal-header': ProposalHeaderComponent,
  'proposal-title': ProposalTitleComponent,
  'recipient-card': RecipientCardComponent,
  'recipient-inline': RecipientInlineComponent,
  'heading': HeadingComponent,
  'paragraph': ParagraphComponent,
  'intro-message': IntroMessageComponent,
  'value-proposition': ValuePropositionComponent,
  'items-table': ItemsTableComponent,
  'items-list': ItemsListComponent,
  'pricing-summary': PricingSummaryComponent,
  'total-highlight': TotalHighlightComponent,
  'terms-conditions': TermsConditionsComponent,
  'validity-info': ValidityInfoComponent,
  'payment-terms': PaymentTermsComponent,
  'cta-accept': CtaAcceptComponent,
  'contact-cta': ContactCtaComponent,
  'divider': DividerComponent,
  'spacer': SpacerComponent,
  'image': ImageComponent
};

// Main component renderer
export const renderProposalComponent = (component, {
  areaSettings,
  globalStyles,
  proposalData,
  clubData,
  isPreview = false
}) => {
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
      proposalData={proposalData}
      clubData={clubData}
      isPreview={isPreview}
    />
  );
};

export default COMPONENT_RENDERERS;
