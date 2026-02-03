import React from 'react';
import { FaEnvelope, FaPhone, FaGlobe, FaFacebook, FaInstagram, FaTiktok, FaTwitter, FaLinkedin, FaExternalLinkAlt } from 'react-icons/fa';

const FooterSection = ({ settings, globalStyles, catalog, isPreview = false }) => {
  const {
    showContacts = true,
    showSocialLinks = true,
    showWebsite = true,
    showFooterMessage = true,
    showPoweredBy = true
  } = settings || {};

  const colors = globalStyles?.colors || {
    primary: '#1A1A1A',
    secondary: '#85FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#9CA3AF'
  };

  const club = catalog?.club;

  const socialLinks = [
    { icon: FaFacebook, url: club?.facebook, label: 'Facebook' },
    { icon: FaInstagram, url: club?.instagram, label: 'Instagram' },
    { icon: FaTiktok, url: club?.tiktok, label: 'TikTok' },
    { icon: FaTwitter, url: club?.twitter, label: 'Twitter' },
    { icon: FaLinkedin, url: club?.linkedin, label: 'LinkedIn' }
  ].filter(link => link.url);

  return (
    <footer style={{
      background: '#111',
      borderTop: '1px solid #222',
      padding: isPreview ? '20px 10px' : '40px 20px'
    }}>
      <div style={{
        maxWidth: globalStyles?.spacing?.containerWidth || 1200,
        margin: '0 auto'
      }}>
        {/* Footer Message */}
        {showFooterMessage && catalog?.messaggio_footer && (
          <div style={{
            marginBottom: isPreview ? '16px' : '32px',
            padding: isPreview ? '10px' : '20px',
            background: colors.primary,
            borderRadius: globalStyles?.borderRadius || 12,
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: isPreview ? '11px' : '16px',
              lineHeight: 1.6,
              color: colors.text,
              margin: 0,
              fontFamily: globalStyles?.fonts?.body || 'Inter'
            }}>
              {catalog.messaggio_footer}
            </p>
          </div>
        )}

        {/* Contact Info */}
        {showContacts && (catalog?.email_contatto || catalog?.telefono_contatto) && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isPreview ? '16px' : '32px',
            flexWrap: 'wrap',
            marginBottom: isPreview ? '16px' : '24px'
          }}>
            {catalog?.email_contatto && (
              <a
                href={`mailto:${catalog.email_contatto}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: colors.secondary,
                  textDecoration: 'none',
                  fontSize: isPreview ? '10px' : '16px',
                  fontFamily: globalStyles?.fonts?.body || 'Inter'
                }}
              >
                <FaEnvelope />
                {catalog.email_contatto}
              </a>
            )}
            {catalog?.telefono_contatto && (
              <a
                href={`tel:${catalog.telefono_contatto}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: colors.secondary,
                  textDecoration: 'none',
                  fontSize: isPreview ? '10px' : '16px',
                  fontFamily: globalStyles?.fonts?.body || 'Inter'
                }}
              >
                <FaPhone />
                {catalog.telefono_contatto}
              </a>
            )}
          </div>
        )}

        {/* Social Links */}
        {showSocialLinks && socialLinks.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: isPreview ? '16px' : '24px'
          }}>
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: isPreview ? '28px' : '40px',
                  height: isPreview ? '28px' : '40px',
                  borderRadius: '50%',
                  background: '#222',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textMuted,
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                title={link.label}
              >
                <link.icon style={{ fontSize: isPreview ? '12px' : '18px' }} />
              </a>
            ))}
          </div>
        )}

        {/* Website */}
        {showWebsite && club?.sito_web && (
          <div style={{
            textAlign: 'center',
            marginBottom: isPreview ? '16px' : '24px'
          }}>
            <a
              href={club.sito_web}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: colors.textMuted,
                textDecoration: 'none',
                fontSize: isPreview ? '10px' : '14px',
                fontFamily: globalStyles?.fonts?.body || 'Inter'
              }}
            >
              <FaGlobe />
              {club.sito_web}
              <FaExternalLinkAlt style={{ fontSize: isPreview ? '8px' : '10px' }} />
            </a>
          </div>
        )}

        {/* Powered By */}
        {showPoweredBy && (
          <div style={{
            paddingTop: isPreview ? '12px' : '24px',
            borderTop: '1px solid #222',
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: isPreview ? '9px' : '12px',
            fontFamily: globalStyles?.fonts?.body || 'Inter'
          }}>
            Powered by PitchPartner
          </div>
        )}
      </div>
    </footer>
  );
};

export default FooterSection;
