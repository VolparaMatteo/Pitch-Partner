import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setAuth } from '../utils/auth';
import SplashScreen from '../components/SplashScreen';
import '../styles/login.css';
import img1 from '../static/images/christian-garcia-P3yyNuNY8n0-unsplash.jpg';
import img2 from '../static/images/radission-us-_XeQ8XEWb4Q-unsplash.jpg';
import img3 from '../static/images/jaime-lopes-0RDBOAdnbWM-unsplash.jpg';
import logoIcon from '../static/logo/FavIcon.png';
import logoFull from '../static/logo/logo_nobg.png';

const ROLE_CONFIG = {
  admin: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    label: 'Amministratore',
    redirect: '/admin/analytics',
    setAuthData: (data) => ({ ...data.admin, role: 'admin' })
  },
  club: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    label: 'Club',
    redirect: '/club/dashboard',
    setAuthData: (data) => {
      const userData = data.user || {};
      return {
        ...userData,
        role: 'club',
        club_id: data.club?.id,
        club_nome: data.club?.nome,
        club_logo: data.club?.logo_url
      };
    }
  },
  sponsor: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    label: 'Sponsor',
    redirect: '/sponsor/dashboard',
    setAuthData: (data) => ({
      id: data.sponsor?.id,
      role: 'sponsor',
      auth_type: data.auth_type,
      ragione_sociale: data.sponsor?.ragione_sociale,
      email: data.sponsor?.email,
      logo_url: data.sponsor?.logo_url,
      current_club: data.current_club,
      clubs: data.clubs,
      has_multiple_clubs: data.has_multiple_clubs
    })
  }
};

function Login() {
  const [showSplash, setShowSplash] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [availableRoles, setAvailableRoles] = useState(null);
  const [selectingRole, setSelectingRole] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const slides = [
    {
      image: img1,
      quote: "Abbiamo creato Pitch Partner per dare a club e sponsor gli strumenti giusti per costruire partnership di valore.",
      name: "Gabriele Ferretti",
      role: "Co-Founder Pitch Partner"
    },
    {
      image: img2,
      quote: "La tecnologia deve semplificare le relazioni, non complicarle. Pitch Partner nasce con questa missione.",
      name: "Simone Formaggio",
      role: "Co-Founder Pitch Partner"
    },
    {
      image: img3,
      quote: "Ogni sponsorizzazione sportiva è un'opportunità. Noi aiutiamo a trasformarla in una partnership vincente.",
      name: "Matteo Volpara",
      role: "Co-Founder Pitch Partner"
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const getErrorDetails = (errorResponse) => {
    const status = errorResponse?.response?.status;
    const data = errorResponse?.response?.data;

    if (!errorResponse.response) {
      return {
        title: 'Errore di Connessione',
        message: 'Impossibile raggiungere il server. Verifica la tua connessione internet e riprova.'
      };
    }

    if (status === 403 && data?.details) {
      return {
        title: 'Accesso Bloccato',
        message: data.details.join(' ')
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
          message: data?.error || 'Non hai i permessi necessari per accedere.'
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
          message: data?.error || 'Si è verificato un errore imprevisto. Riprova.'
        };
    }
  };

  const handleLoginSuccess = (data, role) => {
    const config = ROLE_CONFIG[role];
    if (!config) return;

    const userData = config.setAuthData(data);
    setAuth(data.access_token, userData);
    navigate(config.redirect);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.unifiedLogin(email, password);
      const data = response.data;

      if (data.select_role) {
        setAvailableRoles(data.available_roles);
        setSelectingRole(true);
      } else {
        handleLoginSuccess(data, data.role);
      }
    } catch (err) {
      const errorDetails = getErrorDetails(err);
      setError(errorDetails);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role) => {
    setSelectingRole(false);
    setLoading(true);

    try {
      const response = await authAPI.unifiedLogin(email, password, role.role, role.role_id);
      const data = response.data;
      handleLoginSuccess(data, data.role);
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
    <>
    {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
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
              <button className="nav-arrow" onClick={prevSlide}>&#8249;</button>
              <button className="nav-arrow" onClick={nextSlide}>&#8250;</button>
            </div>
            <a href="https://www.pitchpartner.it" className="learn-more-link" target="_blank" rel="noopener noreferrer">
              Scopri di più &rarr;
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

          <div className="login-header">
            <h1>Connettiti. Collabora. Vinci.</h1>
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
            <a href="#" className="login-help-link" onClick={(e) => { e.preventDefault(); setShowHelp(true); }}>Serve aiuto?</a>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {selectingRole && availableRoles && (
        <div className="role-selector-overlay" onClick={() => setSelectingRole(false)}>
          <div className="role-selector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-selector-header">
              <h2>Seleziona Portale</h2>
              <p>Il tuo account ha accesso a più portali. Scegli dove vuoi accedere.</p>
            </div>
            <div className="role-selector-list">
              {availableRoles.map((role, index) => {
                const config = ROLE_CONFIG[role.role];
                return (
                  <button
                    key={index}
                    className="role-card"
                    onClick={() => handleRoleSelect(role)}
                  >
                    <div className="role-card-icon">
                      {config?.icon}
                    </div>
                    <div className="role-card-info">
                      <div className="role-card-label">{role.label}</div>
                      <div className="role-card-detail">{role.detail}</div>
                    </div>
                    <div className="role-card-arrow">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
            <button className="role-selector-cancel" onClick={() => setSelectingRole(false)}>
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="role-selector-overlay" onClick={() => setShowHelp(false)}>
          <div className="role-selector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-selector-header">
              <h2>Come possiamo aiutarti?</h2>
              <p>Seleziona un'opzione per ricevere assistenza.</p>
            </div>
            <div className="role-selector-list">
              <button className="role-card" onClick={() => { setShowHelp(false); setError({ title: 'Password Dimenticata', message: 'Contatta il tuo amministratore di riferimento per reimpostare la password del tuo account.' }); setShowErrorModal(true); }}>
                <div className="role-card-icon" style={{ background: '#dc2626' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div className="role-card-info">
                  <div className="role-card-label">Password dimenticata?</div>
                  <div className="role-card-detail">Recupera l'accesso al tuo account</div>
                </div>
                <div className="role-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </button>

              <a href="https://www.pitchpartner.it" target="_blank" rel="noopener noreferrer" className="role-card" style={{ textDecoration: 'none' }}>
                <div className="role-card-icon" style={{ background: '#059669' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </div>
                <div className="role-card-info">
                  <div className="role-card-label">Non hai ancora Pitch Partner?</div>
                  <div className="role-card-detail">Scopri la piattaforma e richiedi una demo</div>
                </div>
                <div className="role-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </a>

              <button className="role-card" onClick={() => { setShowHelp(false); setError({ title: 'Sei uno sponsor invitato?', message: 'Controlla la tua casella email per il link di invito ricevuto dal club. Se non lo trovi, contatta direttamente il club che ti ha invitato.' }); setShowErrorModal(true); }}>
                <div className="role-card-icon" style={{ background: '#7c3aed' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="role-card-info">
                  <div className="role-card-label">Sei uno sponsor invitato?</div>
                  <div className="role-card-detail">Cerca il link di invito nella tua email</div>
                </div>
                <div className="role-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </button>

              <a href="mailto:supporto@pitchpartner.it" className="role-card" style={{ textDecoration: 'none' }}>
                <div className="role-card-icon" style={{ background: '#2563eb' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="role-card-info">
                  <div className="role-card-label">Contatta il supporto</div>
                  <div className="role-card-detail">Scrivici a supporto@pitchpartner.it</div>
                </div>
                <div className="role-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </a>
            </div>
            <button className="role-selector-cancel" onClick={() => setShowHelp(false)}>
              Chiudi
            </button>
          </div>
        </div>
      )}

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
            <div className="error-modal-icon">&#9888;&#65039;</div>
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
    </>
  );
}

export default Login;
