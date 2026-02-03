import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAuth } from '../utils/auth';
import {
  FaBuilding, FaEnvelope, FaLock, FaUser, FaPhone, FaGlobe,
  FaCheck, FaExclamationTriangle, FaSpinner, FaArrowRight,
  FaEye, FaEyeSlash
} from 'react-icons/fa';
import '../styles/template-style.css';
import '../styles/form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function SponsorJoin() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Stati
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [club, setClub] = useState(null);

  // Step del flusso
  const [step, setStep] = useState('email'); // email, login, register
  const [emailChecked, setEmailChecked] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [existingAccount, setExistingAccount] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    ragione_sociale: '',
    partita_iva: '',
    telefono: '',
    sito_web: '',
    settore_merceologico: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Carica i dettagli dell'invito
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/invitation/${token}`);
        setInvitation(res.data.invitation);
        setClub(res.data.club);
        setEmail(res.data.invitation.email_suggerita || '');
        setFormData(prev => ({
          ...prev,
          ragione_sociale: res.data.invitation.ragione_sociale_suggerita || '',
          settore_merceologico: res.data.invitation.settore_suggerito || ''
        }));
      } catch (err) {
        console.error('Errore caricamento invito:', err);
        if (err.response?.data?.expired) {
          setError('Questo invito è scaduto. Contatta il club per richiedere un nuovo link.');
        } else {
          setError(err.response?.data?.error || 'Invito non valido');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Verifica email
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await axios.post(`${API_URL}/public/invitation/${token}/check-email`, { email });

      setEmailChecked(true);

      if (res.data.already_member) {
        setSubmitError(res.data.message);
        return;
      }

      if (res.data.exists) {
        setAccountExists(true);
        setExistingAccount(res.data.account);
        setStep('login');
      } else {
        setAccountExists(false);
        setStep('register');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Errore durante la verifica');
    } finally {
      setSubmitting(false);
    }
  };

  // Login e join
  const handleLoginJoin = async (e) => {
    e.preventDefault();
    if (!password) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await axios.post(`${API_URL}/public/invitation/${token}/login-join`, {
        email,
        password
      });

      // Salva auth e redirect
      setAuth({
        token: res.data.access_token,
        user: {
          ...res.data.sponsor,
          role: 'sponsor',
          current_club: res.data.current_club,
          clubs: res.data.clubs
        }
      });

      navigate('/sponsor/dashboard');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Errore durante il login');
    } finally {
      setSubmitting(false);
    }
  };

  // Registrazione e join
  const handleRegisterJoin = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setSubmitError('Le password non corrispondono');
      return;
    }

    if (password.length < 8) {
      setSubmitError('La password deve essere di almeno 8 caratteri');
      return;
    }

    if (!formData.ragione_sociale) {
      setSubmitError('Ragione sociale obbligatoria');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await axios.post(`${API_URL}/public/invitation/${token}/register`, {
        email,
        password,
        ...formData
      });

      // Salva auth e redirect
      setAuth({
        token: res.data.access_token,
        user: {
          ...res.data.sponsor,
          role: 'sponsor',
          current_club: res.data.club,
          clubs: [res.data.club]
        }
      });

      navigate('/sponsor/dashboard');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Errore durante la registrazione');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <FaSpinner className="spin" style={{ fontSize: '32px', color: '#85FF00' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: '#1F1F1F',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '400px',
          textAlign: 'center',
          border: '1px solid #333'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <FaExclamationTriangle style={{ fontSize: '24px', color: '#DC2626' }} />
          </div>
          <h2 style={{ color: 'white', marginBottom: '12px' }}>Invito Non Valido</h2>
          <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              background: '#85FF00',
              color: '#0A0A0A',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#1F1F1F',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        border: '1px solid #333'
      }}>
        {/* Header con logo club */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {club?.logo_url ? (
            <img
              src={club.logo_url.startsWith('http') ? club.logo_url : `${API_URL.replace('/api', '')}${club.logo_url}`}
              alt={club.nome}
              style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'contain', background: 'white', padding: '8px', marginBottom: '16px' }}
            />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #85FF00 0%, #65CC00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
              fontWeight: 700,
              color: '#0A0A0A'
            }}>
              {club?.nome?.charAt(0) || 'P'}
            </div>
          )}
          <h1 style={{ color: 'white', fontSize: '24px', marginBottom: '8px' }}>
            {club?.nome}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '15px' }}>
            ti invita a unirti come sponsor
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px'
        }}>
          {['email', 'login', 'register'].map((s, idx) => {
            const isActive = step === s || (step === 'login' && s === 'email') || (step === 'register' && s === 'email');
            const isCurrent = step === s;
            return (
              <div
                key={s}
                style={{
                  width: '40px',
                  height: '4px',
                  borderRadius: '2px',
                  background: isActive ? '#85FF00' : '#333',
                  opacity: isCurrent ? 1 : 0.5
                }}
              />
            );
          })}
        </div>

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleCheckEmail}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>
                La tua email aziendale
              </label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280'
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@azienda.it"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 42px',
                    background: '#2A2A2A',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '15px'
                  }}
                />
              </div>
              {invitation?.email_suggerita && invitation.email_suggerita !== email && (
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                  Email suggerita dal club: {invitation.email_suggerita}
                </p>
              )}
            </div>

            {submitError && (
              <div style={{
                background: '#FEE2E2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !email}
              style={{
                width: '100%',
                padding: '14px',
                background: '#85FF00',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? (
                <FaSpinner className="spin" />
              ) : (
                <>Continua <FaArrowRight /></>
              )}
            </button>
          </form>
        )}

        {/* Step 2a: Login (account esistente) */}
        {step === 'login' && (
          <form onSubmit={handleLoginJoin}>
            <div style={{
              background: '#2A2A2A',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {existingAccount?.logo_url ? (
                  <img src={existingAccount.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                ) : (
                  <FaBuilding style={{ color: '#85FF00' }} />
                )}
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                  {existingAccount?.ragione_sociale || 'Account trovato'}
                </p>
                <p style={{ color: '#6B7280', fontSize: '12px' }}>{email}</p>
              </div>
              <FaCheck style={{ color: '#85FF00', marginLeft: 'auto' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>
                Inserisci la tua password
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 42px 14px 42px',
                    background: '#2A2A2A',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '15px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6B7280',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {submitError && (
              <div style={{
                background: '#FEE2E2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              style={{
                width: '100%',
                padding: '14px',
                background: '#85FF00',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? (
                <FaSpinner className="spin" />
              ) : (
                <>Accedi e Unisciti <FaArrowRight /></>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setPassword(''); setSubmitError(null); }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#9CA3AF',
                border: 'none',
                marginTop: '12px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Usa un'altra email
            </button>
          </form>
        )}

        {/* Step 2b: Register (nuovo account) */}
        {step === 'register' && (
          <form onSubmit={handleRegisterJoin}>
            <div style={{
              background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaEnvelope style={{ color: '#A7F3D0' }} />
              <span style={{ color: '#A7F3D0', fontSize: '13px' }}>{email}</span>
              <button
                type="button"
                onClick={() => { setStep('email'); setSubmitError(null); }}
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cambia
              </button>
            </div>

            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '20px' }}>
              Crea il tuo account Pitch Partner
            </h3>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>
                  Ragione Sociale *
                </label>
                <input
                  type="text"
                  value={formData.ragione_sociale}
                  onChange={(e) => setFormData({ ...formData, ragione_sociale: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#2A2A2A',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    value={formData.partita_iva}
                    onChange={(e) => setFormData({ ...formData, partita_iva: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#2A2A2A',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>
                    Telefono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#2A2A2A',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 8 caratteri"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 12px',
                      background: '#2A2A2A',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>
                  Conferma Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#2A2A2A',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {submitError && (
              <div style={{
                background: '#FEE2E2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px',
                background: '#85FF00',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? (
                <FaSpinner className="spin" />
              ) : (
                <>Crea Account e Unisciti <FaArrowRight /></>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: '#6B7280',
          fontSize: '12px',
          marginTop: '24px'
        }}>
          Registrandoti accetti i <a href="/terms" style={{ color: '#85FF00' }}>Termini di Servizio</a> e la <a href="/privacy" style={{ color: '#85FF00' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default SponsorJoin;
