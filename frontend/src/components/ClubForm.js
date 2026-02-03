import { useState, useEffect } from 'react';
import { adminAPI, uploadAPI } from '../services/api';

function ClubForm({ club, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: '',
    tipologia: '',
    logo_url: '',
    codice_fiscale: '',
    partita_iva: '',
    numero_affiliazione: '',
    indirizzo_sede_legale: '',
    indirizzo_sede_operativa: '',
    email: '',
    telefono: '',
    sito_web: '',
    referente_nome: '',
    referente_cognome: '',
    referente_ruolo: '',
    referente_contatto: '',
    numero_tesserati: '',
    categoria_campionato: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    pubblico_medio: '',
    nome_abbonamento: '',
    costo_abbonamento: '',
    data_scadenza_licenza: '',
    account_attivo: true,
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (club) {
      setFormData({
        ...club,
        numero_tesserati: club.numero_tesserati || '',
        pubblico_medio: club.pubblico_medio || '',
        costo_abbonamento: club.costo_abbonamento || '',
        data_scadenza_licenza: club.data_scadenza_licenza ? club.data_scadenza_licenza.split('T')[0] : '',
        password: '' // Non pre-popolare la password
      });
    }
  }, [club]);

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
    if (!club && !formData.password) {
      setError('La password è obbligatoria per i nuovi club');
      setLoading(false);
      return;
    }

    try {
      // Prepara i dati convertendo stringhe vuote in null
      const dataToSend = { ...formData };

      // Converti numeri
      if (dataToSend.numero_tesserati) {
        dataToSend.numero_tesserati = parseInt(dataToSend.numero_tesserati);
      }
      if (dataToSend.pubblico_medio) {
        dataToSend.pubblico_medio = parseInt(dataToSend.pubblico_medio);
      }
      if (dataToSend.costo_abbonamento) {
        dataToSend.costo_abbonamento = parseFloat(dataToSend.costo_abbonamento);
      }

      // Rimuovi password se vuota durante l'aggiornamento
      if (club && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (club) {
        await adminAPI.updateClub(club.id, dataToSend);
      } else {
        await adminAPI.createClub(dataToSend);
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
          <h2 style={styles.title}>{club ? 'Modifica Club' : 'Nuovo Club'}</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.scrollContainer}>
            {/* Dati Anagrafici */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Dati Anagrafici</h3>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nome Club *</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Tipologia *</label>
                  <select
                    name="tipologia"
                    value={formData.tipologia}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  >
                    <option value="">Seleziona...</option>
                    <option value="calcio">Calcio</option>
                    <option value="basket">Basket</option>
                    <option value="volley">Volley</option>
                    <option value="rugby">Rugby</option>
                    <option value="tennis">Tennis</option>
                    <option value="nuoto">Nuoto</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
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

              <div style={styles.row}>
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
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Numero Affiliazione</label>
                <input
                  type="text"
                  name="numero_affiliazione"
                  value={formData.numero_affiliazione}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </section>

            {/* Contatti */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Contatti</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Indirizzo Sede Legale</label>
                <input
                  type="text"
                  name="indirizzo_sede_legale"
                  value={formData.indirizzo_sede_legale}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Indirizzo Sede Operativa</label>
                <input
                  type="text"
                  name="indirizzo_sede_operativa"
                  value={formData.indirizzo_sede_operativa}
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
              <h3 style={styles.sectionTitle}>Referente Principale</h3>

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
                    placeholder="es. Presidente, Direttore"
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

            {/* Informazioni Operative */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Informazioni Operative</h3>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Numero Tesserati</label>
                  <input
                    type="number"
                    name="numero_tesserati"
                    value={formData.numero_tesserati}
                    onChange={handleChange}
                    style={styles.input}
                    min="0"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Categoria Campionato</label>
                  <input
                    type="text"
                    name="categoria_campionato"
                    value={formData.categoria_campionato}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="es. Serie C, Under 18"
                  />
                </div>
              </div>
            </section>

            {/* Social */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Canali Social</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Facebook</label>
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Instagram</label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>TikTok</label>
                <input
                  type="url"
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="https://tiktok.com/@..."
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Pubblico Medio (stima spettatori)</label>
                <input
                  type="number"
                  name="pubblico_medio"
                  value={formData.pubblico_medio}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                />
              </div>
            </section>

            {/* Abbonamento */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Abbonamento e Licenza</h3>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nome Abbonamento</label>
                  <input
                    type="text"
                    name="nome_abbonamento"
                    value={formData.nome_abbonamento}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="es. Basic, Pro, Premium"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Costo (€)</label>
                  <input
                    type="number"
                    name="costo_abbonamento"
                    value={formData.costo_abbonamento}
                    onChange={handleChange}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Data Scadenza Licenza</label>
                <input
                  type="date"
                  name="data_scadenza_licenza"
                  value={formData.data_scadenza_licenza}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

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
            </section>

            {/* Autenticazione */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Autenticazione</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Password {!club && '*'}
                  {club && <span style={styles.hint}> (lascia vuoto per non modificare)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  required={!club}
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
              {loading ? 'Salvataggio...' : club ? 'Aggiorna' : 'Crea Club'}
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
    maxWidth: '800px',
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
    color: '#007bff',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #007bff'
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
    marginTop: '15px'
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
    backgroundColor: '#007bff',
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
    color: '#007bff',
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

export default ClubForm;
