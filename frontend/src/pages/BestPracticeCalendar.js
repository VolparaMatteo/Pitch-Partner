import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getAuth } from '../utils/auth';
import { FaGraduationCap, FaArrowLeft } from 'react-icons/fa';
import '../styles/template-style.css';

function BestPracticeCalendar() {
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="tp-page">
      {/* Header */}
      <div className="tp-page-header">
        <button
          className="tp-btn tp-btn-outline"
          onClick={() => navigate(-1)}
          style={{ marginRight: '16px' }}
        >
          <FaArrowLeft />
        </button>
        <h1 className="tp-page-title">Best Practice Events</h1>
      </div>

      {/* Coming Soon Card */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}>
          <FaGraduationCap style={{ fontSize: '48px', color: '#FFFFFF' }} />
        </div>

        <h2 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#1A1A1A',
          margin: '0 0 16px 0'
        }}>
          Sezione in Arrivo
        </h2>

        <p style={{
          fontSize: '16px',
          color: '#6B7280',
          maxWidth: '480px',
          lineHeight: 1.7,
          margin: '0 0 32px 0'
        }}>
          Presto potrai partecipare a webinar, workshop e sessioni formative esclusive per migliorare le tue competenze nel mondo delle sponsorizzazioni sportive.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <span style={{
            background: 'rgba(133, 255, 0, 0.15)',
            color: '#1A1A1A',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600
          }}>
            Webinar
          </span>
          <span style={{
            background: 'rgba(133, 255, 0, 0.15)',
            color: '#1A1A1A',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600
          }}>
            Workshop
          </span>
          <span style={{
            background: 'rgba(133, 255, 0, 0.15)',
            color: '#1A1A1A',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600
          }}>
            Formazione
          </span>
        </div>
      </div>
    </div>
  );
}

export default BestPracticeCalendar;
