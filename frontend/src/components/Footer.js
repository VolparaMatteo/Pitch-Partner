import React from 'react';
import logo from '../static/logo/bianco.png';
import { FaLinkedin, FaInstagram, FaFacebook } from 'react-icons/fa';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: '#0D0D0D',
      color: 'rgba(255, 255, 255, 0.7)',
      padding: '24px 32px',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        {/* Logo & Copyright */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <img
            src={logo}
            alt="Pitch Partner"
            style={{
              height: '55px',
              width: 'auto',
              opacity: 0.9
            }}
          />
          <span style={{
            fontSize: '13px',
            color: '#FFFFFF'
          }}>
            © {currentYear} Pitch Partner
          </span>
        </div>

        {/* Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <a
            href="https://www.pitchpartner.it"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '13px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#85FF00'}
            onMouseLeave={(e) => e.target.style.color = '#FFFFFF'}
          >
            Sito Web
          </a>
          <a
            href="/privacy"
            style={{
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '13px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#85FF00'}
            onMouseLeave={(e) => e.target.style.color = '#FFFFFF'}
          >
            Privacy
          </a>
          <a
            href="/terms"
            style={{
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '13px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#85FF00'}
            onMouseLeave={(e) => e.target.style.color = '#FFFFFF'}
          >
            Termini
          </a>
          <a
            href="/faq"
            style={{
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '13px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#85FF00'}
            onMouseLeave={(e) => e.target.style.color = '#FFFFFF'}
          >
            FAQ
          </a>
        </div>

        {/* Social */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(133, 255, 0, 0.15)';
              e.currentTarget.style.borderColor = '#85FF00';
              e.currentTarget.style.color = '#85FF00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            <FaLinkedin size={16} />
          </a>

          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(133, 255, 0, 0.15)';
              e.currentTarget.style.borderColor = '#85FF00';
              e.currentTarget.style.color = '#85FF00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            <FaInstagram size={16} />
          </a>

          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(133, 255, 0, 0.15)';
              e.currentTarget.style.borderColor = '#85FF00';
              e.currentTarget.style.color = '#85FF00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            <FaFacebook size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
