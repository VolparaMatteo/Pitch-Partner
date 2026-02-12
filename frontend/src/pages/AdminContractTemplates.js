import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { adminDocumentAPI } from '../services/api';
import Toast from '../components/Toast';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaFileContract, FaTimes
} from 'react-icons/fa';
import '../styles/contract-templates.css';

const DEFAULT_TEMPLATE_HTML = `<div style="max-width:800px; margin:0 auto; font-family: 'Helvetica Neue', Arial, sans-serif; color:#333; line-height:1.6;">

  <!-- Header -->
  <div style="text-align:center; padding:30px 0; border-bottom:3px solid #1A1A1A; margin-bottom:30px;">
    <h1 style="margin:0; font-size:28px; color:#1A1A1A; letter-spacing:1px;">PITCH PARTNER</h1>
    <p style="margin:8px 0 0; font-size:14px; color:#6B7280;">Contratto di Servizio</p>
  </div>

  <!-- Parti -->
  <div style="margin-bottom:30px;">
    <h2 style="font-size:18px; color:#1A1A1A; margin:0 0 16px;">PARTI CONTRAENTI</h2>
    <div style="display:flex; gap:30px;">
      <div style="flex:1; background:#F9FAFB; padding:16px; border-radius:8px;">
        <strong>Pitch Partner S.r.l.</strong><br/>
        Via Example 1, 20100 Milano<br/>
        P.IVA: 00000000000
      </div>
      <div style="flex:1; background:#F9FAFB; padding:16px; border-radius:8px;">
        <strong>{{club.nome}}</strong><br/>
        {{club.indirizzo_sede_legale}}<br/>
        P.IVA: {{club.partita_iva}}<br/>
        C.F.: {{club.codice_fiscale}}<br/>
        Referente: {{club.referente_nome}} {{club.referente_cognome}} ({{club.referente_ruolo}})
      </div>
    </div>
  </div>

  <!-- Oggetto -->
  <div style="margin-bottom:30px;">
    <h2 style="font-size:18px; color:#1A1A1A; margin:0 0 16px;">OGGETTO DEL CONTRATTO</h2>
    <p>Il presente contratto regola la fornitura del servizio <strong>Piano {{contract.plan_type}}</strong> da parte di Pitch Partner al Club sopra indicato.</p>
  </div>

  <!-- Condizioni economiche -->
  <div style="margin-bottom:30px;">
    <h2 style="font-size:18px; color:#1A1A1A; margin:0 0 16px;">CONDIZIONI ECONOMICHE</h2>
    <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
      <tr style="background:#F3F4F6;">
        <td style="padding:10px 14px; border:1px solid #E5E7EB; font-weight:600;">Piano</td>
        <td style="padding:10px 14px; border:1px solid #E5E7EB;">{{contract.plan_type}}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px; border:1px solid #E5E7EB; font-weight:600;">Prezzo Piano</td>
        <td style="padding:10px 14px; border:1px solid #E5E7EB;">{{contract.plan_price}}</td>
      </tr>
      <tr style="background:#F3F4F6;">
        <td style="padding:10px 14px; border:1px solid #E5E7EB; font-weight:600;">Add-ons</td>
        <td style="padding:10px 14px; border:1px solid #E5E7EB;">{{contract.addons}}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px; border:1px solid #E5E7EB; font-weight:600;">Totale Netto</td>
        <td style="padding:10px 14px; border:1px solid #E5E7EB;">{{contract.total_value}}</td>
      </tr>
      <tr style="background:#F3F4F6;">
        <td style="padding:10px 14px; border:1px solid #E5E7EB; font-weight:600;">IVA ({{contract.vat_rate}})</td>
        <td style="padding:10px 14px; border:1px solid #E5E7EB;">{{contract.vat_amount}}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px; border:1px solid #E5E7EB; font-weight:700; font-size:16px;">Totale IVA Inclusa</td>
        <td style="padding:10px 14px; border:1px solid #E5E7EB; font-weight:700; font-size:16px;">{{contract.total_value_with_vat}}</td>
      </tr>
    </table>
    <p>Termini di pagamento: <strong>{{contract.payment_terms}}</strong></p>
  </div>

  <!-- Durata -->
  <div style="margin-bottom:30px;">
    <h2 style="font-size:18px; color:#1A1A1A; margin:0 0 16px;">DURATA</h2>
    <p>Il presente contratto ha validita dal <strong>{{contract.start_date}}</strong> al <strong>{{contract.end_date}}</strong>.</p>
  </div>

  <!-- Clausole -->
  <div style="margin-bottom:30px;">
    <h2 style="font-size:18px; color:#1A1A1A; margin:0 0 16px;">CLAUSOLE GENERALI</h2>
    <ol style="padding-left:20px;">
      <li style="margin-bottom:10px;">Il servizio sara erogato secondo le specifiche del piano sottoscritto.</li>
      <li style="margin-bottom:10px;">Il contratto si rinnova tacitamente alla scadenza salvo disdetta scritta con 30 giorni di preavviso.</li>
      <li style="margin-bottom:10px;">Pitch Partner si riserva il diritto di modificare le condizioni del servizio con preavviso di 60 giorni.</li>
      <li style="margin-bottom:10px;">Per quanto non espressamente previsto si applicano le norme del Codice Civile.</li>
      <li style="margin-bottom:10px;">Il foro competente per ogni controversia e quello di Milano.</li>
    </ol>
  </div>

  <!-- Firma -->
  <div style="margin-top:50px; padding-top:30px; border-top:2px solid #E5E7EB;">
    <p style="font-size:14px; color:#6B7280;">Luogo e data: Milano, {{data_odierna}}</p>
    <div style="display:flex; gap:60px; margin-top:30px;">
      <div style="flex:1;">
        <p style="margin:0 0 40px; font-weight:600;">Per Pitch Partner S.r.l.</p>
        <div style="border-bottom:1px solid #333; width:200px;"></div>
      </div>
      <div style="flex:1;">
        <p style="margin:0 0 40px; font-weight:600;">Per {{club.nome}}</p>
        <div style="border-bottom:1px solid #333; width:200px;"></div>
      </div>
    </div>
  </div>

  <!-- SIGNATURE_BLOCK -->

</div>`;

const AVAILABLE_VARIABLES = [
  { group: 'Club', vars: ['club.nome', 'club.email', 'club.indirizzo_sede_legale', 'club.referente_nome', 'club.referente_cognome', 'club.referente_ruolo', 'club.partita_iva', 'club.codice_fiscale', 'club.telefono'] },
  { group: 'Contratto', vars: ['contract.plan_type', 'contract.plan_price', 'contract.total_value', 'contract.vat_rate', 'contract.vat_amount', 'contract.total_value_with_vat', 'contract.start_date', 'contract.end_date', 'contract.payment_terms', 'contract.addons', 'contract.status'] },
  { group: 'Utilita', vars: ['data_odierna', 'anno_corrente'] },
];

function AdminContractTemplates() {
  const navigate = useNavigate();
  const { user } = getAuth();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome: '', codice: '', descrizione: '', corpo_html: '',
    stile_css: '', plan_type: '', attivo: true,
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await adminDocumentAPI.getTemplates();
      setTemplates(res.data.templates || []);
    } catch (err) {
      setToast({ message: 'Errore nel caricamento template', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setForm({
      nome: '', codice: '', descrizione: '', corpo_html: DEFAULT_TEMPLATE_HTML,
      stile_css: '', plan_type: '', attivo: true,
    });
    setShowModal(true);
  };

  const openEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setForm({
      nome: tmpl.nome,
      codice: tmpl.codice,
      descrizione: tmpl.descrizione || '',
      corpo_html: tmpl.corpo_html || '',
      stile_css: tmpl.stile_css || '',
      plan_type: tmpl.plan_type || '',
      attivo: tmpl.attivo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.codice || !form.corpo_html) {
      setToast({ message: 'Nome, codice e corpo HTML sono obbligatori', type: 'error' });
      return;
    }
    try {
      setSaving(true);
      if (editingTemplate) {
        await adminDocumentAPI.updateTemplate(editingTemplate.id, form);
        setToast({ message: 'Template aggiornato', type: 'success' });
      } else {
        await adminDocumentAPI.createTemplate(form);
        setToast({ message: 'Template creato', type: 'success' });
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Errore nel salvataggio', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo template?')) return;
    try {
      await adminDocumentAPI.deleteTemplate(id);
      setToast({ message: 'Template eliminato', type: 'success' });
      fetchTemplates();
    } catch (err) {
      setToast({ message: 'Errore nell\'eliminazione', type: 'error' });
    }
  };

  const handlePreview = async (id) => {
    try {
      const res = await adminDocumentAPI.previewTemplate(id);
      const css = res.data.css ? `<style>${res.data.css}</style>` : '';
      setPreviewHtml(css + res.data.html);
      setShowPreview(true);
    } catch (err) {
      setToast({ message: 'Errore nella preview', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="ct-page">
        <div className="ct-loading">
          <div className="ct-spinner"></div>
          <p style={{ marginTop: '12px', color: '#6B7280' }}>Caricamento template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ct-page">
      <div className="ct-header">
        <h1>Template Contratti</h1>
        <div className="ct-header-actions">
          <button className="ct-btn ct-btn-primary" onClick={openCreate}>
            <FaPlus size={14} /> Nuovo Template
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="ct-empty">
          <div className="ct-empty-icon"><FaFileContract /></div>
          <h3>Nessun template</h3>
          <p>Crea il tuo primo template per generare contratti PDF</p>
          <button className="ct-btn ct-btn-primary" onClick={openCreate}>
            <FaPlus size={14} /> Crea Template
          </button>
        </div>
      ) : (
        <div className="ct-grid">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="ct-card">
              <div className="ct-card-header">
                <div>
                  <h3 className="ct-card-title">{tmpl.nome}</h3>
                  <div className="ct-card-code">{tmpl.codice}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className={`ct-badge ${tmpl.attivo ? 'ct-badge-active' : 'ct-badge-inactive'}`}>
                    {tmpl.attivo ? 'Attivo' : 'Inattivo'}
                  </span>
                  {tmpl.plan_type && (
                    <span className="ct-badge ct-badge-plan">{tmpl.plan_type}</span>
                  )}
                </div>
              </div>
              {tmpl.descrizione && <p className="ct-card-desc">{tmpl.descrizione}</p>}
              <div className="ct-card-footer">
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  {tmpl.created_at ? new Date(tmpl.created_at).toLocaleDateString('it-IT') : ''}
                </span>
                <div className="ct-card-actions">
                  <button className="ct-btn ct-btn-outline ct-btn-sm" onClick={() => handlePreview(tmpl.id)} title="Anteprima">
                    <FaEye size={12} />
                  </button>
                  <button className="ct-btn ct-btn-outline ct-btn-sm" onClick={() => openEdit(tmpl)} title="Modifica">
                    <FaEdit size={12} />
                  </button>
                  <button className="ct-btn ct-btn-danger ct-btn-sm" onClick={() => handleDelete(tmpl.id)} title="Elimina">
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="ct-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ct-modal" onClick={e => e.stopPropagation()}>
            <div className="ct-modal-header">
              <h2>{editingTemplate ? 'Modifica Template' : 'Nuovo Template'}</h2>
              <button className="ct-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <div className="ct-modal-body">
              <div className="ct-form-row">
                <div className="ct-form-group">
                  <label className="ct-form-label">Nome *</label>
                  <input className="ct-form-input" value={form.nome}
                    onChange={e => setForm({...form, nome: e.target.value})}
                    placeholder="Contratto Standard" />
                </div>
                <div className="ct-form-group">
                  <label className="ct-form-label">Codice *</label>
                  <input className="ct-form-input" value={form.codice}
                    onChange={e => setForm({...form, codice: e.target.value})}
                    placeholder="contratto-standard" />
                </div>
              </div>

              <div className="ct-form-row">
                <div className="ct-form-group">
                  <label className="ct-form-label">Piano associato</label>
                  <select className="ct-form-select" value={form.plan_type}
                    onChange={e => setForm({...form, plan_type: e.target.value})}>
                    <option value="">Generico (tutti i piani)</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
                <div className="ct-form-group">
                  <label className="ct-form-label">Stato</label>
                  <select className="ct-form-select" value={form.attivo ? 'true' : 'false'}
                    onChange={e => setForm({...form, attivo: e.target.value === 'true'})}>
                    <option value="true">Attivo</option>
                    <option value="false">Inattivo</option>
                  </select>
                </div>
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Descrizione</label>
                <textarea className="ct-form-textarea" rows={2} value={form.descrizione}
                  onChange={e => setForm({...form, descrizione: e.target.value})}
                  placeholder="Descrizione del template..." />
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">Corpo HTML *</label>
                <textarea className="ct-form-textarea ct-form-textarea-code" rows={14} value={form.corpo_html}
                  onChange={e => setForm({...form, corpo_html: e.target.value})}
                  placeholder="<div>...</div>" />
              </div>

              <div className="ct-form-group">
                <label className="ct-form-label">CSS opzionale</label>
                <textarea className="ct-form-textarea ct-form-textarea-code" rows={4} value={form.stile_css}
                  onChange={e => setForm({...form, stile_css: e.target.value})}
                  placeholder="body { font-family: sans-serif; }" />
              </div>

              {/* Variables reference */}
              <div className="ct-form-group">
                <label className="ct-form-label">Variabili disponibili</label>
                <div className="ct-variables-ref">
                  {AVAILABLE_VARIABLES.map(g => (
                    <div key={g.group} style={{ marginBottom: '8px' }}>
                      <strong>{g.group}:</strong>{' '}
                      {g.vars.map(v => <code key={v}>{`{{${v}}}`}</code>).reduce((a, b) => [a, ' ', b])}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="ct-modal-footer">
              <button className="ct-btn ct-btn-outline" onClick={() => setShowModal(false)}>Annulla</button>
              <button className="ct-btn ct-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvataggio...' : (editingTemplate ? 'Salva Modifiche' : 'Crea Template')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="ct-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="ct-modal" onClick={e => e.stopPropagation()}>
            <div className="ct-modal-header">
              <h2>Anteprima Template</h2>
              <button className="ct-modal-close" onClick={() => setShowPreview(false)}><FaTimes /></button>
            </div>
            <div className="ct-modal-body">
              <div className="ct-preview-frame" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminContractTemplates;
