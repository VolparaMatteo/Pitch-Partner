import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SignaturePad from '../components/SignaturePad';
import { FaCheck, FaTimes, FaClock, FaBan, FaDownload } from 'react-icons/fa';
import '../styles/contract-signing.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ContractSigning() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [docInfo, setDocInfo] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);

  const [form, setForm] = useState({
    signer_name: '',
    signer_email: '',
    signer_role: '',
    signature_image: null,
  });
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetchDocInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchDocInfo = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/sign/${token}`);
      setDocInfo(res.data);

      if (res.data.already_signed) {
        setSigned(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Documento non trovato');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.signer_name || !form.signer_email || !form.signature_image) {
      alert('Compila tutti i campi obbligatori e apponi la firma');
      return;
    }
    if (!accepted) {
      alert('Devi accettare i termini per procedere');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_URL}/sign/${token}`, form);
      setSigned(true);
      setSignedPdfUrl(res.data.signed_pdf_url);
    } catch (err) {
      alert(err.response?.data?.error || 'Errore durante la firma');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="cs-page">
        <div className="cs-loading">
          <div className="cs-spinner"></div>
          <p style={{ marginTop: '12px', color: '#6B7280' }}>Caricamento documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cs-page">
        <div className="cs-header">
          <div className="cs-logo">PITCH PARTNER</div>
          <div className="cs-subtitle">Firma Contratto</div>
        </div>
        <div className="cs-card">
          <div className="cs-card-body">
            <div className="cs-status">
              <div className="cs-status-icon"><FaTimes color="#DC2626" /></div>
              <h3>Documento non disponibile</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const doc = docInfo?.document;
  const contract = docInfo?.contract;

  // Check document status
  if (doc?.status === 'revoked') {
    return (
      <div className="cs-page">
        <div className="cs-header">
          <div className="cs-logo">PITCH PARTNER</div>
        </div>
        <div className="cs-card">
          <div className="cs-card-body">
            <div className="cs-status cs-status-revoked">
              <div className="cs-status-icon"><FaBan /></div>
              <h3>Documento Revocato</h3>
              <p>Questo documento e stato revocato e non e piu disponibile per la firma.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (doc?.status === 'expired') {
    return (
      <div className="cs-page">
        <div className="cs-header">
          <div className="cs-logo">PITCH PARTNER</div>
        </div>
        <div className="cs-card">
          <div className="cs-card-body">
            <div className="cs-status cs-status-expired">
              <div className="cs-status-icon"><FaClock /></div>
              <h3>Documento Scaduto</h3>
              <p>Questo documento e scaduto. Contatta Pitch Partner per un nuovo invio.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Already signed
  if (signed || docInfo?.already_signed) {
    const sig = docInfo?.signature;
    return (
      <div className="cs-page">
        <div className="cs-header">
          <div className="cs-logo">PITCH PARTNER</div>
        </div>
        <div className="cs-card">
          <div className="cs-card-body">
            <div className="cs-success">
              <div className="cs-success-icon"><FaCheck /></div>
              <h3 style={{ color: '#059669' }}>Documento Firmato</h3>
              <p style={{ color: '#6B7280', marginBottom: '20px' }}>
                {sig ? `Firmato da ${sig.signer_name} il ${new Date(sig.signed_at).toLocaleDateString('it-IT')}` :
                  'Il documento e stato firmato con successo.'}
              </p>
              <a
                href={`${API_URL}/sign/${token}/signed-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="cs-btn cs-btn-success"
                style={{ maxWidth: '300px', margin: '0 auto', textDecoration: 'none' }}
              >
                <FaDownload /> Scarica PDF Firmato
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Signing form
  return (
    <div className="cs-page">
      <div className="cs-header">
        <div className="cs-logo">PITCH PARTNER</div>
        <div className="cs-subtitle">Firma Contratto Digitale</div>
      </div>

      <div className="cs-card">
        <div className="cs-card-header">
          <h2 className="cs-card-title">Contratto di Servizio</h2>
          <div className="cs-card-info">
            {contract?.club_name && (
              <span className="cs-info-item"><strong>Club:</strong> {contract.club_name}</span>
            )}
            {contract?.plan_type && (
              <span className="cs-info-item"><strong>Piano:</strong> {contract.plan_type}</span>
            )}
            {doc?.versione && (
              <span className="cs-info-item"><strong>Versione:</strong> {doc.versione}</span>
            )}
          </div>
        </div>

        <div className="cs-card-body">
          {/* PDF Viewer */}
          <iframe
            className="cs-pdf-viewer"
            src={`${API_URL}/sign/${token}/pdf`}
            title="Contratto PDF"
          />

          {/* Signing Form */}
          <form onSubmit={handleSubmit} className="cs-form-section">
            <h3 className="cs-form-title">Firma il Documento</h3>

            <div className="cs-form-row">
              <div className="cs-form-group">
                <label className="cs-form-label">Nome e Cognome *</label>
                <input
                  className="cs-form-input"
                  value={form.signer_name}
                  onChange={e => setForm({...form, signer_name: e.target.value})}
                  placeholder="es. Mario Rossi"
                  required
                />
              </div>
              <div className="cs-form-group">
                <label className="cs-form-label">Email *</label>
                <input
                  className="cs-form-input"
                  type="email"
                  value={form.signer_email}
                  onChange={e => setForm({...form, signer_email: e.target.value})}
                  placeholder="es. mario.rossi@club.it"
                  required
                />
              </div>
            </div>

            <div className="cs-form-group">
              <label className="cs-form-label">Ruolo</label>
              <input
                className="cs-form-input"
                value={form.signer_role}
                onChange={e => setForm({...form, signer_role: e.target.value})}
                placeholder="es. Presidente"
              />
            </div>

            <div className="cs-signature-section">
              <div className="cs-signature-label">Apponi la tua firma *</div>
              {!form.signature_image ? (
                <SignaturePad
                  onSave={(base64) => setForm({...form, signature_image: base64})}
                  height={180}
                />
              ) : (
                <div className="cs-signature-preview">
                  <img src={form.signature_image} alt="Firma" />
                  <span style={{ color: '#059669', fontWeight: 600 }}>Firma acquisita</span>
                  <button
                    type="button"
                    onClick={() => setForm({...form, signature_image: null})}
                    style={{
                      marginLeft: 'auto', padding: '4px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer',
                      fontSize: '12px', color: '#6B7280'
                    }}
                  >
                    Rifai
                  </button>
                </div>
              )}
            </div>

            <div className="cs-checkbox-group">
              <input
                type="checkbox"
                id="accept-terms"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
              />
              <label htmlFor="accept-terms">
                Confermo di aver letto il documento e accetto i termini e le condizioni in esso contenuti.
                La firma digitale apposta ha pieno valore legale ai sensi della normativa vigente.
              </label>
            </div>

            <button
              type="submit"
              className="cs-btn cs-btn-primary"
              disabled={submitting || !form.signer_name || !form.signer_email || !form.signature_image || !accepted}
            >
              {submitting ? 'Invio firma in corso...' : 'Firma e Conferma'}
            </button>
          </form>
        </div>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
        Powered by Pitch Partner - Documento generato digitalmente
      </p>
    </div>
  );
}

export default ContractSigning;
