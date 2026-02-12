import { useState, useEffect, useRef } from 'react';
import { adminEmailAPI } from '../services/api';
import { FaRedo, FaPaperPlane, FaTimes, FaSpinner, FaEnvelope, FaReply } from 'react-icons/fa';

function ConversationTab({ contactEmail, contactName }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [expandedUid, setExpandedUid] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [composeAccount, setComposeAccount] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);

  const messagesEndRef = useRef(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (contactEmail && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchConversation();
      fetchAccounts();
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactEmail]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchAccounts = async () => {
    try {
      const res = await adminEmailAPI.getAccounts();
      setAccounts(res.data.accounts || []);
      if (res.data.accounts?.length > 0) {
        setComposeAccount(res.data.accounts[0].key);
      }
    } catch { /* ignore */ }
  };

  const fetchTemplates = async () => {
    try {
      const res = await adminEmailAPI.getTemplates();
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

  const fetchConversation = async (refresh = false) => {
    setLoading(true);
    try {
      const res = await adminEmailAPI.getConversation(contactEmail, refresh);
      setMessages(res.data.messages || []);
      setSearchTime(res.data.search_time_ms);
      scrollToBottom();
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandMessage = async (msg) => {
    const key = `${msg.account_key}:${msg.uid}:${msg.folder}`;
    if (expandedUid === key) {
      setExpandedUid(null);
      setExpandedDetail(null);
      return;
    }

    setExpandedUid(key);
    setExpandedDetail(null);
    setLoadingDetail(true);

    try {
      const res = await adminEmailAPI.getMessageDetail(msg.account_key, msg.uid, msg.folder);
      setExpandedDetail(res.data);
    } catch {
      setExpandedDetail({ body_html: '<p>Errore nel caricamento del messaggio.</p>' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSend = async () => {
    if (!composeAccount || !composeSubject.trim() || !composeBody.trim()) return;

    setSending(true);
    try {
      const bodyHtml = composeBody.replace(/\n/g, '<br>');
      await adminEmailAPI.sendEmail(composeAccount, {
        to: contactEmail,
        subject: composeSubject,
        body_html: bodyHtml
      });
      setShowCompose(false);
      setComposeSubject('');
      setComposeBody('');
      // Refresh conversation
      fetchConversation(true);
    } catch {
      // Error handled silently
    } finally {
      setSending(false);
    }
  };

  const openCompose = () => {
    // Default subject: Re: last subject
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastMsg && lastMsg.subject) {
      const subj = lastMsg.subject.startsWith('Re:') ? lastMsg.subject : `Re: ${lastMsg.subject}`;
      setComposeSubject(subj);
    } else {
      setComposeSubject('');
    }
    setComposeBody('');
    setShowCompose(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getAccountLabel = (key) => {
    const acc = accounts.find(a => a.key === key);
    return acc ? acc.email : key;
  };

  if (!contactEmail) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
        <FaEnvelope size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p>Nessuna email associata a questo contatto.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          Conversazioni con <span style={{ color: '#4F46E5' }}>{contactName || contactEmail}</span>
          {searchTime !== null && !loading && (
            <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '8px', fontWeight: 400 }}>
              ({messages.length} messaggi, {(searchTime / 1000).toFixed(1)}s)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => fetchConversation(true)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '6px', border: '1px solid #E5E7EB',
              background: '#FFFFFF', color: '#374151', fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1
            }}
          >
            <FaRedo size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Aggiorna
          </button>
          <button
            onClick={openCompose}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              background: '#1A1A1A', color: '#FFFFFF', fontSize: '13px',
              cursor: 'pointer', fontWeight: 600
            }}
          >
            <FaReply size={11} /> Scrivi
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
            <FaSpinner size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p style={{ fontSize: '14px' }}>Ricerca conversazioni in 7 account email...</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <FaEnvelope size={28} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px' }}>Nessuna conversazione trovata con {contactEmail}</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOutbound = msg.direction === 'outbound';
              const isExpanded = expandedUid === `${msg.account_key}:${msg.uid}:${msg.folder}`;

              return (
                <div
                  key={`${msg.account_key}-${msg.uid}-${msg.folder}`}
                  style={{
                    display: 'flex',
                    justifyContent: isOutbound ? 'flex-end' : 'flex-start',
                    maxWidth: '100%'
                  }}
                >
                  <div
                    onClick={() => handleExpandMessage(msg)}
                    style={{
                      maxWidth: '75%',
                      minWidth: '280px',
                      padding: '12px 16px',
                      borderRadius: isOutbound ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: isOutbound ? '#EFF6FF' : '#F3F4F6',
                      border: isExpanded ? '2px solid #4F46E5' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Sender line */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isOutbound ? '#1E40AF' : '#374151' }}>
                        {isOutbound ? 'Pitch Partner' : (msg.from_name || msg.from_email)}
                      </span>
                      {isOutbound && (
                        <span style={{
                          fontSize: '10px', color: '#6B7280', background: '#E5E7EB',
                          padding: '1px 6px', borderRadius: '4px'
                        }}>
                          via {getAccountLabel(msg.account_key)}
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                      {msg.subject || '(senza oggetto)'}
                    </div>

                    {/* Snippet or expanded body */}
                    {isExpanded ? (
                      <div style={{ marginTop: '8px' }}>
                        {loadingDetail ? (
                          <div style={{ textAlign: 'center', padding: '12px' }}>
                            <FaSpinner size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          </div>
                        ) : expandedDetail ? (
                          <div
                            style={{
                              fontSize: '13px', lineHeight: '1.6', color: '#374151',
                              background: '#FFFFFF', borderRadius: '8px', padding: '12px',
                              maxHeight: '300px', overflowY: 'auto', border: '1px solid #E5E7EB'
                            }}
                            dangerouslySetInnerHTML={{ __html: expandedDetail.body_html || expandedDetail.body_text || '' }}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: '1.4', fontStyle: 'italic' }}>
                        Clicca per espandere...
                      </div>
                    )}

                    {/* Date & attachments */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: '6px'
                    }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        {formatDate(msg.date)}
                      </span>
                      {msg.has_attachments && (
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>📎</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Compose Area */}
      {showCompose && (
        <div style={{
          borderTop: '2px solid #E5E7EB', padding: '16px 20px', background: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <select
              value={composeAccount}
              onChange={(e) => setComposeAccount(e.target.value)}
              style={{
                flex: '0 0 auto', padding: '8px 12px', borderRadius: '6px',
                border: '1px solid #D1D5DB', fontSize: '13px', background: '#F9FAFB'
              }}
            >
              {accounts.map(acc => (
                <option key={acc.key} value={acc.key}>{acc.label} ({acc.email})</option>
              ))}
            </select>
            {templates.length > 0 && (
              <select
                onChange={(e) => { if (e.target.value) handleApplyTemplate(e.target.value); e.target.value = ''; }}
                style={{
                  flex: '0 0 auto', padding: '8px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', fontSize: '13px', background: '#FEF9C3',
                  cursor: 'pointer'
                }}
              >
                <option value="">Template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Oggetto..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '6px',
                border: '1px solid #D1D5DB', fontSize: '13px'
              }}
            />
          </div>
          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder="Scrivi un messaggio..."
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '6px',
              border: '1px solid #D1D5DB', fontSize: '13px', resize: 'vertical',
              fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              onClick={() => setShowCompose(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                background: '#FFFFFF', color: '#6B7280', fontSize: '13px', cursor: 'pointer'
              }}
            >
              <FaTimes size={11} /> Annulla
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !composeSubject.trim() || !composeBody.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '6px', border: 'none',
                background: sending ? '#9CA3AF' : '#1A1A1A', color: '#FFFFFF',
                fontSize: '13px', fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer'
              }}
            >
              {sending ? <FaSpinner size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <FaPaperPlane size={11} />}
              {sending ? 'Invio...' : 'Invia'}
            </button>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ConversationTab;
