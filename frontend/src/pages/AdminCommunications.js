import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import api from '../services/api';
import '../styles/admin-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineEnvelope,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineUserGroup,
  HiOutlineBuildingOffice2,
  HiOutlineCursorArrowRays,
  HiOutlinePaperAirplane,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash
} from 'react-icons/hi2';

function AdminCommunications() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);

  const [activeTab, setActiveTab] = useState('send'); // send, templates, history

  // Send form
  const [sendForm, setSendForm] = useState({
    template_id: '',
    subject: '',
    body: '',
    recipient_type: 'club', // club, lead
    recipients: [],
    filters: {
      status: '',
      expiring: ''
    }
  });

  // Recipients preview
  const [previewRecipients, setPreviewRecipients] = useState([]);

  // Template form
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    codice: '',
    nome: '',
    oggetto: '',
    corpo_html: '',
    categoria: 'general',
    variabili: []
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, historyRes] = await Promise.all([
        api.get('/admin/email-templates'),
        api.get('/admin/communications/history')
      ]);

      setTemplates(templatesRes.data);
      setEmailHistory(historyRes.data.emails || []);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommunication = async () => {
    try {
      if (previewRecipients.length === 0) {
        alert('Seleziona almeno un destinatario');
        return;
      }

      if (!sendForm.template_id && !sendForm.subject) {
        alert('Seleziona un template o inserisci un oggetto');
        return;
      }

      const payload = {
        template_id: sendForm.template_id || undefined,
        subject: sendForm.subject,
        body: sendForm.body,
        recipients: previewRecipients.map(r => ({
          type: sendForm.recipient_type,
          id: r.id
        }))
      };

      await api.post('/admin/communications/send', payload);
      alert(`Comunicazione inviata a ${previewRecipients.length} destinatari`);

      // Reset form
      setSendForm({
        template_id: '',
        subject: '',
        body: '',
        recipient_type: 'club',
        recipients: [],
        filters: { status: '', expiring: '' }
      });
      setPreviewRecipients([]);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nell\'invio');
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setSendForm({
        ...sendForm,
        template_id: templateId,
        subject: template.oggetto,
        body: template.corpo_html
      });
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!templateForm.codice || !templateForm.nome || !templateForm.oggetto) {
        alert('Compila tutti i campi obbligatori');
        return;
      }

      await api.post('/admin/email-templates', templateForm);
      setShowTemplateModal(false);
      setTemplateForm({
        codice: '',
        nome: '',
        oggetto: '',
        corpo_html: '',
        categoria: 'general',
        variabili: []
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nella creazione');
    }
  };

  const loadRecipients = async () => {
    try {
      let recipients = [];

      if (sendForm.recipient_type === 'club') {
        const res = await api.get('/admin/clubs');
        recipients = res.data.map(club => ({
          id: club.id,
          nome: club.nome,
          email: club.email
        }));

        // Apply filters
        if (sendForm.filters.status === 'active') {
          recipients = recipients.filter(r => r.account_attivo);
        }
      } else if (sendForm.recipient_type === 'lead') {
        const res = await api.get('/admin/leads');
        recipients = res.data.filter(l => l.email).map(lead => ({
          id: lead.id,
          nome: lead.nome_club,
          email: lead.email
        }));
      }

      setPreviewRecipients(recipients);
    } catch (error) {
      console.error('Errore nel caricamento destinatari:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    const statuses = {
      sent: { label: 'Inviato', color: '#10B981', bg: '#ECFDF5', icon: HiOutlineCheckCircle },
      delivered: { label: 'Consegnato', color: '#3B82F6', bg: '#EFF6FF', icon: HiOutlineCheckCircle },
      opened: { label: 'Aperto', color: '#8B5CF6', bg: '#F5F3FF', icon: HiOutlineEye },
      clicked: { label: 'Click', color: '#EC4899', bg: '#FDF2F8', icon: HiOutlineCursorArrowRays },
      bounced: { label: 'Rimbalzato', color: '#EF4444', bg: '#FEF2F2', icon: HiOutlineExclamationCircle },
      failed: { label: 'Fallito', color: '#EF4444', bg: '#FEF2F2', icon: HiOutlineXCircle },
      queued: { label: 'In coda', color: '#6B7280', bg: '#F3F4F6', icon: HiOutlineClock }
    };
    return statuses[status] || statuses.queued;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Caricamento...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Comunicazioni</h1>
          <p className="page-subtitle">Gestione email e comunicazioni ai club</p>
        </div>
        <div className="page-header-right">
          <button className="btn-secondary" onClick={fetchData}>
            <HiOutlineArrowPath size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          <HiOutlinePaperAirplane size={18} />
          Invia
        </button>
        <button
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <HiOutlineDocumentText size={18} />
          Template
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <HiOutlineClock size={18} />
          Storico
        </button>
      </div>

      {/* Send Tab */}
      {activeTab === 'send' && (
        <div className="communication-composer">
          <div className="composer-main">
            <div className="form-section">
              <h3>Destinatari</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo Destinatari</label>
                  <select
                    value={sendForm.recipient_type}
                    onChange={(e) => setSendForm({ ...sendForm, recipient_type: e.target.value })}
                  >
                    <option value="club">Club</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                {sendForm.recipient_type === 'club' && (
                  <div className="form-group">
                    <label>Filtro Stato</label>
                    <select
                      value={sendForm.filters.status}
                      onChange={(e) => setSendForm({
                        ...sendForm,
                        filters: { ...sendForm.filters, status: e.target.value }
                      })}
                    >
                      <option value="">Tutti</option>
                      <option value="active">Solo attivi</option>
                      <option value="expiring">In scadenza</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>&nbsp;</label>
                  <button className="btn-secondary" onClick={loadRecipients}>
                    Carica Destinatari
                  </button>
                </div>
              </div>

              {previewRecipients.length > 0 && (
                <div className="recipients-preview">
                  <div className="recipients-header">
                    <span>{previewRecipients.length} destinatari selezionati</span>
                    <button onClick={() => setPreviewRecipients([])}>Cancella</button>
                  </div>
                  <div className="recipients-list">
                    {previewRecipients.slice(0, 5).map((r, idx) => (
                      <span key={idx} className="recipient-chip">
                        {r.nome} ({r.email})
                      </span>
                    ))}
                    {previewRecipients.length > 5 && (
                      <span className="recipient-chip more">
                        +{previewRecipients.length - 5} altri
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Messaggio</h3>

              <div className="form-group">
                <label>Template (opzionale)</label>
                <select
                  value={sendForm.template_id}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  <option value="">Nessun template</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Oggetto *</label>
                <input
                  type="text"
                  value={sendForm.subject}
                  onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  placeholder="Oggetto dell'email"
                />
              </div>

              <div className="form-group">
                <label>Corpo</label>
                <textarea
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                  placeholder="Contenuto dell'email... Usa {{nome}} per il nome del destinatario"
                  rows={10}
                />
              </div>

              <div className="variables-hint">
                <strong>Variabili disponibili:</strong> {"{{nome}}"}, {"{{email}}"}
              </div>
            </div>

            <div className="composer-actions">
              <button
                className="btn-primary large"
                onClick={handleSendCommunication}
                disabled={previewRecipients.length === 0}
              >
                <HiOutlinePaperAirplane size={20} />
                Invia a {previewRecipients.length} destinatari
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="templates-section">
          <div className="section-header">
            <h3>Template Email</h3>
            <button className="btn-primary" onClick={() => setShowTemplateModal(true)}>
              <HiOutlinePlusCircle size={18} />
              Nuovo Template
            </button>
          </div>

          <div className="templates-grid">
            {templates.length === 0 ? (
              <div className="empty-state-card">
                <HiOutlineDocumentText size={48} />
                <h3>Nessun template</h3>
                <p>Crea il tuo primo template email</p>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <span className="template-name">{template.nome}</span>
                    <span className="template-category">{template.categoria}</span>
                  </div>
                  <div className="template-subject">
                    <HiOutlineEnvelope size={14} />
                    {template.oggetto}
                  </div>
                  <div className="template-preview">
                    {template.corpo_html?.substring(0, 100)}...
                  </div>
                  <div className="template-footer">
                    <span className="template-code">{template.codice}</span>
                    <div className="template-actions">
                      <button className="icon-btn">
                        <HiOutlinePencil size={16} />
                      </button>
                      <button className="icon-btn danger">
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-section">
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Destinatario</th>
                  <th>Oggetto</th>
                  <th>Template</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {emailHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      <HiOutlineEnvelope size={32} />
                      <span>Nessuna email inviata</span>
                    </td>
                  </tr>
                ) : (
                  emailHistory.map((email, idx) => {
                    const statusInfo = getStatusInfo(email.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={idx}>
                        <td>{formatDate(email.created_at)}</td>
                        <td>
                          <div className="cell-content">
                            <span className="primary-text">{email.destinatario_email}</span>
                            <span className="secondary-text">{email.destinatario_tipo}</span>
                          </div>
                        </td>
                        <td>{email.oggetto}</td>
                        <td>{email.template?.nome || '-'}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                          >
                            <StatusIcon size={14} />
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuovo Template</h2>
              <button className="modal-close" onClick={() => setShowTemplateModal(false)}>
                <HiOutlineXCircle size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Codice *</label>
                  <input
                    type="text"
                    value={templateForm.codice}
                    onChange={(e) => setTemplateForm({ ...templateForm, codice: e.target.value })}
                    placeholder="es. welcome_email"
                  />
                </div>

                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={templateForm.nome}
                    onChange={(e) => setTemplateForm({ ...templateForm, nome: e.target.value })}
                    placeholder="Nome del template"
                  />
                </div>

                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={templateForm.categoria}
                    onChange={(e) => setTemplateForm({ ...templateForm, categoria: e.target.value })}
                  >
                    <option value="general">Generale</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="subscription">Abbonamento</option>
                    <option value="notification">Notifica</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Oggetto *</label>
                  <input
                    type="text"
                    value={templateForm.oggetto}
                    onChange={(e) => setTemplateForm({ ...templateForm, oggetto: e.target.value })}
                    placeholder="Oggetto dell'email"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Corpo HTML</label>
                  <textarea
                    value={templateForm.corpo_html}
                    onChange={(e) => setTemplateForm({ ...templateForm, corpo_html: e.target.value })}
                    placeholder="Contenuto HTML dell'email..."
                    rows={10}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTemplateModal(false)}>
                Annulla
              </button>
              <button className="btn-primary" onClick={handleCreateTemplate}>
                Crea Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCommunications;
