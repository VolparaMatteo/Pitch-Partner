import { useState, useEffect } from 'react';
import { clubAPI, uploadAPI } from '../services/api';

function SponsorForm({ sponsor, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    ragione_sociale: '',
    partita_iva: '',
    codice_fiscale: '',
    settore_merceologico: '',
    logo_url: '',
    indirizzo_sede: '',
    email: '',
    telefono: '',
    sito_web: '',
    referente_nome: '',
    referente_cognome: '',
    referente_ruolo: '',
    referente_contatto: '',
    account_attivo: true,
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (sponsor) {
      setFormData({
        ...sponsor,
        password: '' // Non pre-popolare la password
      });
    }
  }, [sponsor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validazione dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Il file deve essere inferiore a 5MB');
      return;
    }

    setUploadingLogo(true);
    setError('');

    try {
      const response = await uploadAPI.uploadLogo(file);
      const logoUrl = `http://localhost:5001${response.data.file_url}`;
      setFormData(prev => ({ ...prev, logo_url: logoUrl }));
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante l\'upload del logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validazione
    if (!sponsor && !formData.password) {
      setError('La password è obbligatoria per i nuovi sponsor');
      setLoading(false);
      return;
    }

    try {
      const dataToSend = { ...formData };

      // Rimuovi password se vuota durante l'aggiornamento
      if (sponsor && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (sponsor) {
        await clubAPI.updateSponsor(sponsor.id, dataToSend);
      } else {
        await clubAPI.createSponsor(dataToSend);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>{sponsor ? 'Modifica Sponsor' : 'Nuovo Sponsor'}</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.scrollContainer}>
            {/* Dati Aziendali */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Dati Aziendali</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Ragione Sociale *</label>
                <input
                  type="text"
                  name="ragione_sociale"
                  value={formData.ragione_sociale}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Partita IVA</label>
                  <input
                    type="text"
                    name="partita_iva"
                    value={formData.partita_iva}
                    onChange={handleChange}
                    style={styles.input}
                    maxLength="11"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Codice Fiscale</label>
                  <input
                    type="text"
                    name="codice_fiscale"
                    value={formData.codice_fiscale}
                    onChange={handleChange}
                    style={styles.input}
                    maxLength="16"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Settore Merceologico</label>
                <input
                  type="text"
                  name="settore_merceologico"
                  value={formData.settore_merceologico}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="es. Abbigliamento sportivo, Ristorazione"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={styles.input}
                  disabled={uploadingLogo}
                />
                {uploadingLogo && <p style={styles.uploading}>Caricamento in corso...</p>}
                {formData.logo_url && (
                  <div style={styles.logoPreview}>
                    <img src={formData.logo_url} alt="Logo preview" style={styles.logoImage} />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      style={styles.removeLogoBtn}
                    >
                      Rimuovi logo
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Contatti */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Contatti</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Indirizzo Sede</label>
                <input
                  type="text"
                  name="indirizzo_sede"
                  value={formData.indirizzo_sede}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Telefono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Sito Web</label>
                <input
                  type="url"
                  name="sito_web"
                  value={formData.sito_web}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="https://esempio.com"
                />
              </div>
            </section>

            {/* Referente */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Referente Marketing/Commerciale</h3>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nome</label>
                  <input
                    type="text"
                    name="referente_nome"
                    value={formData.referente_nome}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Cognome</label>
                  <input
                    type="text"
                    name="referente_cognome"
                    value={formData.referente_cognome}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ruolo</label>
                  <input
                    type="text"
                    name="referente_ruolo"
                    value={formData.referente_ruolo}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="es. Marketing Manager"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Contatto</label>
                  <input
                    type="text"
                    name="referente_contatto"
                    value={formData.referente_contatto}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Email o telefono"
                  />
                </div>
              </div>
            </section>

            {/* Account */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Configurazione Account</h3>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="account_attivo"
                    checked={formData.account_attivo}
                    onChange={handleChange}
                  />
                  <span style={styles.checkboxText}>Account Attivo</span>
                </label>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Password {!sponsor && '*'}
                  {sponsor && <span style={styles.hint}> (lascia vuoto per non modificare)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  required={!sponsor}
                  minLength="6"
                />
              </div>
            </section>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Annulla
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Salvataggio...' : sponsor ? 'Aggiorna' : 'Crea Sponsor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderBottom: '1px solid #eee'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#333'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    color: '#999',
    lineHeight: '1'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden'
  },
  scrollContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 30px'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#28a745',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #28a745'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#555',
    fontSize: '14px'
  },
  hint: {
    fontWeight: 'normal',
    fontSize: '12px',
    color: '#999'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  checkboxGroup: {
    marginBottom: '15px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  checkboxText: {
    marginLeft: '8px',
    fontSize: '14px',
    color: '#555'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px 30px',
    borderTop: '1px solid #eee'
  },
  cancelBtn: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  submitBtn: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb'
  },
  uploading: {
    color: '#28a745',
    fontSize: '14px',
    marginTop: '5px'
  },
  logoPreview: {
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#f8f9fa'
  },
  logoImage: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    padding: '5px'
  },
  removeLogoBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  }
};

export default SponsorForm;
