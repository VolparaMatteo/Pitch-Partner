import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { setAuth } from '../utils/auth';
import '../styles/login.css';
import img1 from '../static/images/christian-garcia-P3yyNuNY8n0-unsplash.jpg';
import img2 from '../static/images/radission-us-_XeQ8XEWb4Q-unsplash.jpg';
import img3 from '../static/images/jaime-lopes-0RDBOAdnbWM-unsplash.jpg';
import logoIcon from '../static/logo/FavIcon.png';
import logoFull from '../static/logo/logo_nobg.png';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const getErrorDetails = (errorResponse) => {
    const status = errorResponse?.response?.status;
    const message = errorResponse?.response?.data?.error;

    if (!errorResponse.response) {
      return {
        title: 'Errore di Connessione',
        message: 'Impossibile raggiungere il server. Verifica la tua connessione internet e riprova.'
      };
    }

    switch (status) {
      case 401:
        return {
          title: 'Credenziali Non Valide',
          message: 'Email o password errati. Verifica i tuoi dati e riprova.'
        };
      case 403:
        return {
          title: 'Accesso Negato',
          message: 'Non hai i permessi necessari per accedere al pannello amministratore.'
        };
      case 404:
        return {
          title: 'Account Non Trovato',
          message: 'Non esiste un account amministratore associato a questa email.'
        };
      case 429:
        return {
          title: 'Troppi Tentativi',
          message: 'Hai effettuato troppi tentativi di accesso. Riprova tra qualche minuto.'
        };
      case 500:
      case 502:
      case 503:
        return {
          title: 'Errore del Server',
          message: 'Si è verificato un problema tecnico. I nostri tecnici stanno lavorando per risolverlo.'
        };
      default:
        return {
          title: 'Errore',
          message: message || 'Si è verificato un errore imprevisto. Riprova.'
        };
    }
  };

  const slides = [
    {
      image: img1,
      quote: "Managing the entire platform has never been easier. Pitch Partner's admin tools are powerful and intuitive!",
      name: "Giovanni Verdi",
      role: "Platform Administrator"
    },
    {
      image: img2,
      quote: "Managing the entire platform has never been easier. Pitch Partner's admin tools are powerful and intuitive!",
      name: "Giovanni Verdi",
      role: "Platform Administrator"
    },
    {
      image: img3,
      quote: "Managing the entire platform has never been easier. Pitch Partner's admin tools are powerful and intuitive!",
      name: "Giovanni Verdi",
      role: "Platform Administrator"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await adminAPI.login(email, password);
      setAuth(response.data.access_token, { ...response.data.admin, role: 'admin' });
      navigate('/admin/dashboard');
    } catch (err) {
      const errorDetails = getErrorDetails(err);
      setError(errorDetails);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const closeErrorModal = (e) => {
    if (e) e.preventDefault();
    setShowErrorModal(false);
    setError(null);
  };

  return (
    <div className="modern-login-container">
      {/* Left Side - Testimonial */}
      <div className="login-left-section">
        {slides.map((slide, index) => (
          <img
            key={index}
            src={slide.image}
            alt=""
            className={`login-background-image ${index === currentSlide ? 'active' : ''}`}
          />
        ))}
        <div className="login-left-content">
          <div className="login-brand">
            <img src={logoIcon} alt="Pitch Partner" className="login-brand-logo" />
          </div>

          <div className="testimonial-container">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`testimonial-slide ${index === currentSlide ? 'active' : ''}`}
              >
                <div className="testimonial-quote">
                  "{slide.quote}"
                </div>
                <div className="testimonial-author">
                  <div className="testimonial-name">{slide.name}</div>
                  <div className="testimonial-role">{slide.role}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="testimonial-navigation">
            <div className="nav-arrows">
              <button className="nav-arrow" onClick={prevSlide}>‹</button>
              <button className="nav-arrow" onClick={nextSlide}>›</button>
            </div>
            <a href="#" className="learn-more-link" onClick={(e) => e.preventDefault()}>
              Scopri di più →
            </a>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right-section">
        <div className="login-form-container">
          <div className="login-logo-container">
            <img src={logoFull} alt="Pitch Partner" className="login-form-logo" />
          </div>

          <div className="portal-badge">Admin Portal</div>

          <div className="login-header">
            <h1>Connettiti. Collabora. Vinci.</h1>
            <p>Partnership vincenti ti aspettano</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-new">
            <div className="form-group-new">
              <label className="form-label-new">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input-new"
                placeholder="Inserisci la tua email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group-new">
              <label className="form-label-new">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input-new"
                placeholder="Inserisci la tua password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-continue" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <div className="login-help">
            <a href="#" className="login-help-link" onClick={(e) => e.preventDefault()}>Serve aiuto?</a>
          </div>

          <div className="other-logins">
            <div className="other-logins-title">Altri portali</div>
            <div className="other-login-links">
              <a href="/club/login" className="other-login-link">Club Portal</a>
              <a href="/sponsor/login" className="other-login-link">Sponsor Portal</a>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && error && (
        <div className="error-modal-overlay" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          closeErrorModal();
        }}>
          <div className="error-modal" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
            <div className="error-modal-icon">⚠️</div>
            <h3 className="error-modal-title">{error.title}</h3>
            <p className="error-modal-message">{error.message}</p>
            <div className="error-modal-actions">
              <button
                type="button"
                className="error-modal-btn error-modal-btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeErrorModal();
                }}
              >
                Ho Capito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLogin;
