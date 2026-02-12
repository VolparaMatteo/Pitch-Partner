import React, { useState, useEffect, useMemo } from 'react';
import { getAuth } from '../utils/auth';
import { adminEmailAPI } from '../services/api';
import {
  HiOutlineEnvelope,
  HiOutlinePaperAirplane,
  HiOutlineInboxStack,
  HiOutlinePaperClip,
  HiOutlineArrowUturnLeft,
  HiOutlinePencilSquare,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiOutlineXMark
} from 'react-icons/hi2';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const AdminEmail = () => {
  const authData = useMemo(() => getAuth(), []);
  const { token } = authData;

  // State
  const [accounts, setAccounts] = useState([]);
  const [sentFolder, setSentFolder] = useState('INBOX.Sent');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeFolder, setActiveFolder] = useState('INBOX');
  const [emails, setEmails] = useState([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(true);
  const perPage = 20;

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  // Template state
  const [templates, setTemplates] = useState([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    codice: '', nome: '', descrizione: '', categoria: 'general',
    oggetto: '', corpo_html: ''
  });

  // Load accounts + templates on mount
  useEffect(() => {
    if (token) {
      fetchAccounts();
      fetchUnreadCounts(true);
      fetchTemplates();
    }
  }, [token]);

  // Load emails when account/folder/page/search changes
  useEffect(() => {
    if (selectedAccount) {
      fetchEmails(needsRefresh);
      if (needsRefresh) setNeedsRefresh(false);
    }
  }, [selectedAccount, activeFolder, currentPage, searchQuery]);

  // Poll unread counts every 30s
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetchUnreadCounts(true), 30000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchAccounts = async () => {
    try {
      const res = await adminEmailAPI.getAccounts();
      setAccounts(res.data.accounts);
      if (res.data.sent_folder) setSentFolder(res.data.sent_folder);
      if (res.data.accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(res.data.accounts[0].key);
      }
    } catch (err) {
      console.error('Errore caricamento account:', err);
    }
  };

  const fetchUnreadCounts = async (refresh = false) => {
    try {
      const res = await adminEmailAPI.getUnreadCounts(refresh);
      setUnreadCounts(res.data.counts);
    } catch (err) {
      console.error('Errore conteggio non lette:', err);
    }
  };

  const fetchEmails = async (refresh = false) => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await adminEmailAPI.getMessages(selectedAccount, {
        folder: activeFolder,
        page: currentPage,
        per_page: perPage,
        search: searchQuery || undefined,
        refresh: refresh || undefined
      });
      setEmails(res.data.emails || []);
      setTotalEmails(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error('Errore caricamento email:', err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchEmails(true), fetchUnreadCounts(true)]);
    setRefreshing(false);
  };

  const handleSelectAccount = (key) => {
    setSelectedAccount(key);
    setSelectedEmail(null);
    setCurrentPage(1);
    setSearchQuery('');
    setSearchInput('');
    setActiveFolder('INBOX');
    setNeedsRefresh(true);
  };

  const handleSelectFolder = (folder) => {
    setActiveFolder(folder);
    setSelectedEmail(null);
    setCurrentPage(1);
    setNeedsRefresh(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
    setSelectedEmail(null);
  };

  const handleEmailClick = async (em) => {
    // Immediately mark as read in UI
    if (!em.seen) {
      setEmails(prev => prev.map(e => e.uid === em.uid ? { ...e, seen: true } : e));
      setUnreadCounts(prev => {
        const current = prev[selectedAccount] || 0;
        return { ...prev, [selectedAccount]: Math.max(0, current - 1) };
      });
    }

    setDetailLoading(true);
    setSelectedEmail({ ...em, _loading: true });
    try {
      const res = await adminEmailAPI.getMessageDetail(selectedAccount, em.uid, activeFolder);
      setSelectedEmail(res.data);
    } catch (err) {
      console.error('Errore dettaglio email:', err);
      setSelectedEmail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteEmail = async (uid) => {
    if (!window.confirm('Eliminare questa email?')) return;
    try {
      await adminEmailAPI.deleteMessage(selectedAccount, uid, activeFolder);
      setEmails(prev => prev.filter(e => e.uid !== uid));
      if (selectedEmail?.uid === uid) setSelectedEmail(null);
      setTotalEmails(prev => prev - 1);
      fetchUnreadCounts(true);
    } catch (err) {
      console.error('Errore eliminazione:', err);
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject) return;
    setSending(true);
    try {
      await adminEmailAPI.sendEmail(selectedAccount, {
        to: composeTo,
        subject: composeSubject,
        body_html: composeBody.replace(/\n/g, '<br>'),
        cc: composeCc || undefined
      });
      setShowCompose(false);
      setComposeTo('');
      setComposeCc('');
      setComposeSubject('');
      setComposeBody('');
      if (activeFolder !== 'INBOX') fetchEmails(true);
    } catch (err) {
      console.error('Errore invio:', err);
      const msg = err.response?.data?.error || 'Errore durante l\'invio dell\'email';
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  const handleReply = (email) => {
    setComposeTo(email.from_email);
    setComposeSubject(email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`);
    setComposeBody('');
    setShowCompose(true);
  };

  const handleDownloadAttachment = (filename) => {
    if (!selectedEmail) return;
    const url = `${API_URL}/admin/email/${selectedAccount}/messages/${selectedEmail.uid}/attachment/${encodeURIComponent(filename)}?folder=${encodeURIComponent(activeFolder)}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => console.error('Errore download:', err));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    } catch { return dateStr; }
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('it-IT', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  // Template functions
  const fetchTemplates = async () => {
    try {
      const res = await adminEmailAPI.getTemplates(true);
      setTemplates(res.data || []);
    } catch { /* ignore */ }
  };

  const handleApplyTemplate = (templateId) => {
    const t = templates.find(tp => tp.id === parseInt(templateId));
    if (t) {
      setComposeSubject(t.oggetto);
      setComposeBody(t.corpo_html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({ codice: '', nome: '', descrizione: '', categoria: 'general', oggetto: '', corpo_html: '' });
    setEditingTemplate(null);
  };

  const handleEditTemplate = (t) => {
    setEditingTemplate(t.id);
    setTemplateForm({
      codice: t.codice, nome: t.nome, descrizione: t.descrizione || '',
      categoria: t.categoria || 'general', oggetto: t.oggetto,
      corpo_html: t.corpo_html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.codice || !templateForm.nome || !templateForm.oggetto) return;
    try {
      const payload = {
        ...templateForm,
        corpo_html: templateForm.corpo_html.replace(/\n/g, '<br>'),
        corpo_text: templateForm.corpo_html
      };
      if (editingTemplate) {
        await adminEmailAPI.updateTemplate(editingTemplate, payload);
      } else {
        await adminEmailAPI.createTemplate(payload);
      }
      resetTemplateForm();
      fetchTemplates();
    } catch { /* ignore */ }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Eliminare questo template?')) return;
    try {
      await adminEmailAPI.deleteTemplate(id);
      fetchTemplates();
    } catch { /* ignore */ }
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const currentAccount = accounts.find(a => a.key === selectedAccount);

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title">Email Aziendale</h1>
          <p className="tp-page-subtitle">Gestisci le caselle email Pitch Partner</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px',
              border: '1px solid #E5E7EB', background: '#fff',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: '#374151', opacity: refreshing ? 0.6 : 1
            }}
          >
            <HiOutlineArrowPath size={15} className={refreshing ? 'spin' : ''} />
            Aggiorna
          </button>
          <button
            onClick={() => { setShowTemplateManager(!showTemplateManager); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px',
              border: '1px solid #E5E7EB', background: showTemplateManager ? '#F0F9FF' : '#fff',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: showTemplateManager ? '#2563EB' : '#374151'
            }}
          >
            <HiOutlineEnvelope size={15} />
            Template ({templates.length})
          </button>
          <button
            onClick={() => { setShowCompose(true); setComposeTo(''); setComposeCc(''); setComposeSubject(''); setComposeBody(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px',
              border: 'none', background: '#1F2937',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: '#fff'
            }}
          >
            <HiOutlinePencilSquare size={15} />
            Scrivi
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '16px', minHeight: '600px' }}>
        {/* Sidebar Accounts */}
        <div style={{
          width: '240px', flexShrink: 0,
          background: '#fff', borderRadius: '12px',
          border: '1px solid #E5E7EB', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Account
            </span>
          </div>
          <div style={{ padding: '8px' }}>
            {accounts.map(acc => {
              const unread = unreadCounts[acc.key] || 0;
              const isSelected = selectedAccount === acc.key;
              return (
                <button
                  key={acc.key}
                  onClick={() => handleSelectAccount(acc.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isSelected ? '#F0F9FF' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: isSelected ? '#DBEAFE' : (acc.type === 'personal' ? '#FEF3C7' : '#E0E7FF'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '13px', fontWeight: 700,
                    color: isSelected ? '#2563EB' : (acc.type === 'personal' ? '#D97706' : '#4F46E5')
                  }}>
                    {acc.key.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#1E40AF' : '#374151',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {acc.label}
                    </div>
                    <div style={{
                      fontSize: '11px', color: '#9CA3AF',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {acc.email}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span style={{
                      minWidth: '20px', height: '20px', borderRadius: '10px',
                      background: '#2563EB', color: '#fff', fontSize: '11px',
                      fontWeight: 700, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', padding: '0 6px', flexShrink: 0
                    }}>
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Folder Tabs + Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', background: '#fff', borderRadius: '12px 12px 0 0',
            border: '1px solid #E5E7EB', borderBottom: 'none'
          }}>
            <button
              onClick={() => handleSelectFolder('INBOX')}
              style={{
                padding: '6px 16px', borderRadius: '6px', border: 'none',
                background: activeFolder === 'INBOX' ? '#1F2937' : '#F3F4F6',
                color: activeFolder === 'INBOX' ? '#fff' : '#6B7280',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Ricevute
            </button>
            <button
              onClick={() => handleSelectFolder(sentFolder)}
              style={{
                padding: '6px 16px', borderRadius: '6px', border: 'none',
                background: activeFolder !== 'INBOX' ? '#1F2937' : '#F3F4F6',
                color: activeFolder !== 'INBOX' ? '#fff' : '#6B7280',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Inviate
            </button>
            <div style={{ flex: 1 }} />
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px' }}>
              <div style={{ position: 'relative' }}>
                <HiOutlineMagnifyingGlass size={14} style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  color: '#9CA3AF'
                }} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Cerca email..."
                  style={{
                    padding: '7px 12px 7px 30px', borderRadius: '8px',
                    border: '1px solid #E5E7EB', fontSize: '13px',
                    width: '200px', outline: 'none'
                  }}
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchInput(''); setCurrentPage(1); }}
                  style={{
                    padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB',
                    background: '#FEF2F2', color: '#DC2626', fontSize: '12px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <HiOutlineXMark size={12} /> Resetta
                </button>
              )}
            </form>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
              {totalEmails} email
            </span>
          </div>

          {/* Email List Content */}
          <div style={{
            flex: 1, background: '#fff', border: '1px solid #E5E7EB',
            borderTop: '1px solid #F3F4F6', borderRadius: '0 0 12px 12px',
            overflow: 'auto'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <HiOutlineArrowPath size={24} className="spin" />
                <p style={{ marginTop: '12px', fontSize: '13px' }}>Caricamento...</p>
              </div>
            ) : emails.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <HiOutlineInboxStack size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
                <h3 style={{ color: '#6B7280', fontWeight: 600, margin: '0 0 4px', fontSize: '15px' }}>
                  Nessuna email
                </h3>
                <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                  {searchQuery ? 'Nessun risultato per la ricerca' : 'La casella è vuota'}
                </p>
              </div>
            ) : (
              <div>
                {emails.map(em => (
                  <div
                    key={em.uid}
                    onClick={() => handleEmailClick(em)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', cursor: 'pointer',
                      borderBottom: '1px solid #F3F4F6',
                      background: em.seen ? '#FAFAFA' : '#fff',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = em.seen ? '#FAFAFA' : '#fff'; }}
                  >
                    {/* Unread indicator */}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: em.seen ? 'transparent' : '#2563EB',
                      flexShrink: 0
                    }} />
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '13px', fontWeight: em.seen ? 400 : 600,
                          color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis', flex: 1
                        }}>
                          {activeFolder === 'INBOX' ? em.from_name : em.subject}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>
                          {formatDate(em.date)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '12px', color: '#6B7280',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        fontWeight: em.seen ? 400 : 500
                      }}>
                        {activeFolder === 'INBOX' ? em.subject : (em.from_name || em.from_email)}
                      </div>
                    </div>
                    {em.has_attachments && (
                      <HiOutlinePaperClip size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteEmail(em.uid); }}
                      title="Elimina"
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: 'none', background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#D1D5DB', flexShrink: 0
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEF2F2'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#D1D5DB'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    gap: '12px', padding: '16px'
                  }}>
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid #E5E7EB', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: currentPage <= 1 ? 'default' : 'pointer',
                        opacity: currentPage <= 1 ? 0.4 : 1, color: '#374151'
                      }}
                    >
                      <HiOutlineChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid #E5E7EB', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: currentPage >= totalPages ? 'default' : 'pointer',
                        opacity: currentPage >= totalPages ? 0.4 : 1, color: '#374151'
                      }}
                    >
                      <HiOutlineChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}
          onClick={() => setSelectedEmail(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px', width: '100%',
              maxWidth: '800px', maxHeight: '85vh', display: 'flex',
              flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <HiOutlineArrowPath size={24} className="spin" />
                <p style={{ marginTop: '12px', fontSize: '13px' }}>Caricamento...</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{
                        fontSize: '18px', fontWeight: 700, color: '#1F2937',
                        margin: '0 0 12px', lineHeight: 1.3
                      }}>
                        {selectedEmail.subject || '(Nessun oggetto)'}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: '#E0E7FF', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0
                        }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#4F46E5' }}>
                            {(selectedEmail.from_name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                            {selectedEmail.from_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            {selectedEmail.from_email} &middot; {formatFullDate(selectedEmail.date)}
                          </div>
                        </div>
                      </div>
                      {selectedEmail.to && (
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
                          A: {selectedEmail.to}
                        </div>
                      )}
                      {selectedEmail.cc && (
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                          Cc: {selectedEmail.cc}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleReply(selectedEmail)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '8px 14px', borderRadius: '8px',
                          border: '1px solid #E5E7EB', background: '#fff',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          color: '#374151'
                        }}
                      >
                        <HiOutlineArrowUturnLeft size={14} />
                        Rispondi
                      </button>
                      <button
                        onClick={() => { handleDeleteEmail(selectedEmail.uid); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '8px 14px', borderRadius: '8px',
                          border: '1px solid #FEE2E2', background: '#fff',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          color: '#DC2626'
                        }}
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                      <button
                        onClick={() => setSelectedEmail(null)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          border: 'none', background: '#F3F4F6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#6B7280'
                        }}
                      >
                        <HiOutlineXMark size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div style={{ padding: '12px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HiOutlinePaperClip size={13} /> {selectedEmail.attachments.length} allegat{selectedEmail.attachments.length === 1 ? 'o' : 'i'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedEmail.attachments.map((att, i) => (
                        <button
                          key={i}
                          onClick={() => handleDownloadAttachment(att.filename)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px',
                            border: '1px solid #E5E7EB', background: '#fff',
                            fontSize: '12px', cursor: 'pointer', color: '#374151'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                        >
                          <HiOutlinePaperClip size={13} style={{ color: '#6B7280' }} />
                          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.filename}
                          </span>
                          {att.size > 0 && (
                            <span style={{ color: '#9CA3AF', fontSize: '11px' }}>
                              ({(att.size / 1024).toFixed(0)} KB)
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body */}
                <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                  {selectedEmail.body_html ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                      style={{
                        fontSize: '14px', lineHeight: 1.6, color: '#374151',
                        wordBreak: 'break-word', overflowWrap: 'break-word'
                      }}
                    />
                  ) : (
                    <pre style={{
                      fontSize: '14px', lineHeight: 1.6, color: '#374151',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      fontFamily: 'inherit', margin: 0
                    }}>
                      {selectedEmail.body_text || '(Nessun contenuto)'}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}
          onClick={() => setShowCompose(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px', width: '100%',
              maxWidth: '640px', maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HiOutlinePencilSquare size={20} style={{ color: '#1F2937' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                  Nuova Email
                </h3>
              </div>
              <button
                onClick={() => setShowCompose(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: 'none', background: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6B7280'
                }}
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Da</label>
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', background: '#F9FAFB',
                  border: '1px solid #E5E7EB', fontSize: '13px', color: '#374151'
                }}>
                  {currentAccount?.email || '—'}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>A *</label>
                <input type="text" value={composeTo} onChange={e => setComposeTo(e.target.value)}
                  placeholder="email@esempio.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Cc</label>
                <input type="text" value={composeCc} onChange={e => setComposeCc(e.target.value)}
                  placeholder="cc@esempio.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {templates.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Usa Template</label>
                  <select
                    onChange={e => { if (e.target.value) handleApplyTemplate(e.target.value); e.target.value = ''; }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', background: '#F9FAFB', cursor: 'pointer', boxSizing: 'border-box' }}
                  >
                    <option value="">Seleziona un template...</option>
                    {templates.filter(t => t.attivo).map(t => (
                      <option key={t.id} value={t.id}>{t.nome} — {t.categoria}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Oggetto *</label>
                <input type="text" value={composeSubject} onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Oggetto dell'email"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Messaggio</label>
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)}
                  rows={10} placeholder="Scrivi il messaggio..."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setShowCompose(false)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#6B7280' }}
                >
                  Annulla
                </button>
                <button onClick={handleSendEmail}
                  disabled={sending || !composeTo || !composeSubject}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 24px', borderRadius: '8px',
                    border: 'none', background: '#1F2937',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    color: '#fff', opacity: (sending || !composeTo || !composeSubject) ? 0.5 : 1
                  }}
                >
                  <HiOutlinePaperAirplane size={15} />
                  {sending ? 'Invio in corso...' : 'Invia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}
          onClick={() => { setShowTemplateManager(false); resetTemplateForm(); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px', width: '100%',
              maxWidth: '900px', maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                Gestione Template Email
              </h3>
              <button
                onClick={() => { setShowTemplateManager(false); resetTemplateForm(); }}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: 'none', background: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6B7280'
                }}
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', minHeight: '400px' }}>
              {/* Template List */}
              <div style={{ width: '320px', borderRight: '1px solid #E5E7EB', overflowY: 'auto', maxHeight: '70vh' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  <button
                    onClick={resetTemplateForm}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: '1px dashed #D1D5DB', background: '#FAFAFA',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      color: '#4F46E5', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px'
                    }}
                  >
                    + Nuovo Template
                  </button>
                </div>
                {templates.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleEditTemplate(t)}
                    style={{
                      padding: '12px 16px', borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      background: editingTemplate === t.id ? '#F0F9FF' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '2px' }}>{t.nome}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{t.codice} — {t.categoria}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.oggetto}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
                        {!t.attivo && (
                          <span style={{ fontSize: '10px', background: '#FEF2F2', color: '#DC2626', padding: '2px 6px', borderRadius: '4px' }}>OFF</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                          style={{
                            width: '24px', height: '24px', borderRadius: '6px',
                            border: 'none', background: 'transparent',
                            cursor: 'pointer', color: '#9CA3AF', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                    Nessun template. Creane uno!
                  </div>
                )}
              </div>

              {/* Template Form */}
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', maxHeight: '70vh' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                  {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Codice *</label>
                    <input
                      value={templateForm.codice}
                      onChange={e => setTemplateForm({...templateForm, codice: e.target.value})}
                      placeholder="es. welcome_club"
                      disabled={!!editingTemplate}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box',
                        background: editingTemplate ? '#F3F4F6' : '#fff'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Categoria</label>
                    <select
                      value={templateForm.categoria}
                      onChange={e => setTemplateForm({...templateForm, categoria: e.target.value})}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box'
                      }}
                    >
                      <option value="general">Generale</option>
                      <option value="subscription">Abbonamento</option>
                      <option value="lead">Lead</option>
                      <option value="notification">Notifica</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Nome *</label>
                  <input
                    value={templateForm.nome}
                    onChange={e => setTemplateForm({...templateForm, nome: e.target.value})}
                    placeholder="es. Benvenuto Nuovo Club"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Descrizione</label>
                  <input
                    value={templateForm.descrizione}
                    onChange={e => setTemplateForm({...templateForm, descrizione: e.target.value})}
                    placeholder="Breve descrizione del template"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Oggetto Email *</label>
                  <input
                    value={templateForm.oggetto}
                    onChange={e => setTemplateForm({...templateForm, oggetto: e.target.value})}
                    placeholder="Oggetto dell'email"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Corpo del Messaggio *</label>
                  <textarea
                    value={templateForm.corpo_html}
                    onChange={e => setTemplateForm({...templateForm, corpo_html: e.target.value})}
                    rows={8}
                    placeholder="Scrivi il testo del template...&#10;&#10;Puoi usare variabili come {{club_nome}}, {{data_scadenza}}, ecc."
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical',
                      fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                    Variabili disponibili: {'{{club_nome}}'}, {'{{contatto_nome}}'}, {'{{data_scadenza}}'}, {'{{piano}}'}, {'{{importo}}'}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  {editingTemplate && (
                    <button
                      onClick={resetTemplateForm}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                        background: '#fff', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', color: '#6B7280'
                      }}
                    >
                      Annulla
                    </button>
                  )}
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!templateForm.codice || !templateForm.nome || !templateForm.oggetto}
                    style={{
                      padding: '8px 20px', borderRadius: '8px', border: 'none',
                      background: '#1F2937', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', color: '#fff',
                      opacity: (!templateForm.codice || !templateForm.nome || !templateForm.oggetto) ? 0.5 : 1
                    }}
                  >
                    {editingTemplate ? 'Salva Modifiche' : 'Crea Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default AdminEmail;
