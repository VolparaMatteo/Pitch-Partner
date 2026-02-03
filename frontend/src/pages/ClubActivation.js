import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/login.css';
import img1 from '../static/images/christian-garcia-P3yyNuNY8n0-unsplash.jpg';
import logoIcon from '../static/logo/FavIcon.png';
import logoFull from '../static/logo/logo_nobg.png';
import { getImageUrl } from '../utils/imageUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ClubActivation() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [activating, setActivating] = useState(false);
  const [club, setClub] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  useEffect(() => {
    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyToken = async () => {
    try {
      setVerifying(true);
      const response = await axios.get(`${API_URL}/public/club/activate/${token}`);
      setClub(response.data.club);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Token non valido';
      setError({
        title: getErrorTitle(errorMessage),
        message: getErrorMessage(errorMessage)
      });
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const getErrorTitle = (message) => {
    if (message.includes('scaduto')) return 'Link Scaduto';
    if (message.includes('già attivato')) return 'Account Già Attivato';
    return 'Link Non Valido';
  };

  const getErrorMessage = (message) => {
    if (message.includes('scaduto')) {
      return 'Il link di attivazione è scaduto. Contatta l\'amministratore per ricevere un nuovo link.';
    }
    if (message.includes('già attivato')) {
      return 'Questo account è già stato attivato. Puoi accedere con le tue credenziali.';
    }
    return 'Il link di attivazione non è valido. Verifica di aver copiato correttamente il link o contatta l\'amministratore.';
  };

  const checkPasswordStrength = (pwd) => {
    const strength = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
    setPasswordStrength(strength);
    return strength;
  };

  const isPasswordValid = () => {
    return Object.values(passwordStrength).every(v => v === true);
  };

  const validateForm = () => {
    const errors = {};

    if (!password) {
      errors.password = 'La password è obbligatoria';
    } else if (!isPasswordValid()) {
      errors.password = 'La password non soddisfa tutti i requisiti di sicurezza';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Conferma la password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Le password non corrispondono';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setActivating(true);
      await axios.post(`${API_URL}/public/club/activate/${token}`, {
        password,
        confirm_password: confirmPassword
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/club/login');
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Errore durante l\'attivazione';
      setFormErrors({ submit: errorMessage });
    } finally {
      setActivating(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="modern-login-container">
        <div className="login-left-section">
          <img src={img1} alt="" className="login-background-image active" />
          <div className="login-left-content">
            <div className="login-brand">
              <img src={logoIcon} alt="Pitch Partner" className="login-brand-logo" />
            </div>
          </div>
        </div>
        <div className="login-right-section">
          <div className="login-form-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#85FF00',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '16px', color: '#6B7280' }}>Verifica link in corso...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-login-container">
        <div className="login-left-section">
          <img src={img1} alt="" className="login-background-image active" />
          <div className="login-left-content">
            <div className="login-brand">
              <img src={logoIcon} alt="Pitch Partner" className="login-brand-logo" />
            </div>
          </div>
        </div>
        <div className="login-right-section">
          <div className="login-form-container">
            <div className="login-logo-container">
              <img src={logoFull} alt="Pitch Partner" className="login-form-logo" />
            </div>

            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '36px'
              }}>
                {error.title === 'Account Già Attivato' ? '✓' : '!'}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
                {error.title}
              </h2>
              <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6, marginBottom: '32px' }}>
                {error.message}
              </p>
              <button
                onClick={() => navigate('/club/login')}
                className="btn-continue"
              >
                Vai al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="modern-login-container">
        <div className="login-left-section">
          <img src={img1} alt="" className="login-background-image active" />
          <div className="login-left-content">
            <div className="login-brand">
              <img src={logoIcon} alt="Pitch Partner" className="login-brand-logo" />
            </div>
          </div>
        </div>
        <div className="login-right-section">
          <div className="login-form-container">
            <div className="login-logo-container">
              <img src={logoFull} alt="Pitch Partner" className="login-form-logo" />
            </div>

            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '36px',
                color: '#059669'
              }}>
                ✓
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
                Account Attivato!
              </h2>
              <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6, marginBottom: '16px' }}>
                Il tuo account è stato attivato con successo.<br />
                Verrai reindirizzato alla pagina di login...
              </p>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #E5E7EB',
                borderTopColor: '#059669',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-login-container">
      {/* Left Side */}
      <div className="login-left-section">
        <img src={img1} alt="" className="login-background-image active" />
        <div className="login-left-content">
          <div className="login-brand">
            <img src={logoIcon} alt="Pitch Partner" className="login-brand-logo" />
          </div>

          <div className="testimonial-container">
            <div className="testimonial-slide active">
              <div className="testimonial-quote">
                "Benvenuto in Pitch Partner! Imposta la tua password per iniziare a gestire le sponsorizzazioni del tuo club."
              </div>
              <div className="testimonial-author">
                <div className="testimonial-name">Il Team</div>
                <div className="testimonial-role">Pitch Partner</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Activation Form */}
      <div className="login-right-section">
        <div className="login-form-container">
          <div className="login-logo-container">
            <img src={logoFull} alt="Pitch Partner" className="login-form-logo" />
          </div>

          <div className="portal-badge" style={{ background: '#ECFDF5', color: '#059669' }}>Attivazione Account</div>

          {/* Club Info */}
          {club && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              background: '#F9FAFB',
              borderRadius: '16px',
              marginBottom: '24px'
            }}>
              {club.logo_url ? (
                <img
                  src={getImageUrl(club.logo_url)}
                  alt={club.nome}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
              ) : (
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #85FF00 0%, #70E000 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1A1A1A'
                }}>
                  {club.nome?.substring(0, 2).toUpperCase() || 'CL'}
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                  {club.nome}
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
                  {club.email}
                </p>
              </div>
            </div>
          )}

          <div className="login-header">
            <h1>Imposta la tua password</h1>
            <p>Crea una password sicura per accedere al tuo account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-new">
            <div className="form-group-new">
              <label className="form-label-new">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  const pwd = e.target.value;
                  setPassword(pwd);
                  checkPasswordStrength(pwd);
                  if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                }}
                className={`form-input-new ${formErrors.password ? 'error' : ''}`}
                placeholder="Crea una password sicura"
                disabled={activating}
              />
              {formErrors.password && (
                <span style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                  {formErrors.password}
                </span>
              )}

              {/* Password Requirements Checklist */}
              {password && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Requisiti password:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { key: 'minLength', label: 'Almeno 8 caratteri' },
                      { key: 'hasUppercase', label: 'Una lettera maiuscola' },
                      { key: 'hasLowercase', label: 'Una lettera minuscola' },
                      { key: 'hasNumber', label: 'Un numero' },
                      { key: 'hasSpecial', label: 'Un carattere speciale (!@#$%^&*...)' }
                    ].map(req => (
                      <div key={req.key} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: passwordStrength[req.key] ? '#059669' : '#9CA3AF'
                      }}>
                        <span style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: passwordStrength[req.key] ? '#ECFDF5' : '#F3F4F6',
                          border: `1px solid ${passwordStrength[req.key] ? '#059669' : '#D1D5DB'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}>
                          {passwordStrength[req.key] ? '✓' : ''}
                        </span>
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group-new">
              <label className="form-label-new">Conferma Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
                }}
                className={`form-input-new ${formErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Ripeti la password"
                disabled={activating}
              />
              {formErrors.confirmPassword && (
                <span style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                  {formErrors.confirmPassword}
                </span>
              )}
            </div>

            {formErrors.submit && (
              <div style={{
                padding: '12px 16px',
                background: '#FEF2F2',
                borderRadius: '8px',
                border: '1px solid #FEE2E2',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '14px', color: '#DC2626', margin: 0 }}>
                  {formErrors.submit}
                </p>
              </div>
            )}

            <button type="submit" className="btn-continue" disabled={activating}>
              {activating ? 'Attivazione in corso...' : 'Attiva Account'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#EFF6FF',
            borderRadius: '12px',
            border: '1px solid #3B82F6'
          }}>
            <p style={{ fontSize: '13px', color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
              <strong>Sicurezza:</strong> La tua password deve contenere almeno 8 caratteri, includendo maiuscole, minuscole, numeri e caratteri speciali.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default ClubActivation;
