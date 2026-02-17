import { useState, useEffect, useRef, useMemo } from 'react';
import { adminEmailAPI, adminWhatsAppAPI } from '../services/api';
import { FaRedo, FaPaperPlane, FaTimes, FaSpinner, FaEnvelope, FaReply, FaWhatsapp } from 'react-icons/fa';

function ConversationTab({ contactEmail, contactName, contactPhone, whatsappMessages = [], whatsappConnected = false, onRefreshWhatsApp }) {
  const [emailMessages, setEmailMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [expandedUid, setExpandedUid] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Channel filter: 'all', 'email', 'whatsapp'
  const [channelFilter, setChannelFilter] = useState('all');

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [composeChannel, setComposeChannel] = useState('email'); // 'email' or 'whatsapp'
  const [composeAccount, setComposeAccount] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);

  const messagesEndRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const hasEmail = !!contactEmail;
  const hasPhone = !!contactPhone;
  const showChannelFilter = hasEmail || hasPhone;

  useEffect(() => {
    if (contactEmail && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchConversation();
      fetchAccounts();
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactEmail]);

  // Unified messages: merge email + WA, sorted by date
  const unifiedMessages = useMemo(() => {
    const items = [];

    // Email messages
    emailMessages.forEach(msg => {
      items.push({
        ...msg,
        channel: 'email',
        sortDate: new Date(msg.date).getTime(),
        key: `email-${msg.account_key}-${msg.uid}-${msg.folder}`,
      });
    });

    // WhatsApp messages
    whatsappMessages.forEach(msg => {
      items.push({
        ...msg,
        channel: 'whatsapp',
        sortDate: msg.timestamp * 1000,
        key: `wa-${msg.id}`,
      });
    });

    // Sort chronologically (oldest first for chat view)
    items.sort((a, b) => a.sortDate - b.sortDate);

    return items;
  }, [emailMessages, whatsappMessages]);

  const filteredMessages = useMemo(() => {
    if (channelFilter === 'all') return unifiedMessages;
    return unifiedMessages.filter(m => m.channel === channelFilter);
  }, [unifiedMessages, channelFilter]);

  const emailCount = emailMessages.length;
  const waCount = whatsappMessages.length;

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
      setEmailMessages(res.data.messages || []);
      setSearchTime(res.data.search_time_ms);
      scrollToBottom();
    } catch {
      setEmailMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (contactEmail) fetchConversation(true);
    if (onRefreshWhatsApp) onRefreshWhatsApp();
  };

  const handleExpandMessage = async (msg) => {
    if (msg.channel === 'whatsapp') return; // WA messages don't expand
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

  const handleSendEmail = async () => {
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
      fetchConversation(true);
    } catch {
      // Error handled silently
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!composeBody.trim() || !contactPhone) return;

    setSending(true);
    try {
      await adminWhatsAppAPI.send({
        to: contactPhone,
        message: composeBody
      });
      setShowCompose(false);
      setComposeBody('');
      if (onRefreshWhatsApp) {
        setTimeout(() => onRefreshWhatsApp(), 1500);
      }
    } catch {
      // Error handled silently
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (composeChannel === 'whatsapp') {
      handleSendWhatsApp();
    } else {
      handleSendEmail();
    }
  };

  const openCompose = () => {
    if (composeChannel === 'email') {
      const lastEmailMsg = emailMessages.length > 0 ? emailMessages[emailMessages.length - 1] : null;
      if (lastEmailMsg && lastEmailMsg.subject) {
        const subj = lastEmailMsg.subject.startsWith('Re:') ? lastEmailMsg.subject : `Re: ${lastEmailMsg.subject}`;
        setComposeSubject(subj);
      } else {
        setComposeSubject('');
      }
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

  const formatWaDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp * 1000);
      return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getAccountLabel = (key) => {
    const acc = accounts.find(a => a.key === key);
    return acc ? acc.email : key;
  };

  const getMediaLabel = (msg) => {
    if (!msg.hasMedia) return null;
    const type = msg.mediaType || msg.type;
    if (type === 'image') return '(immagine)';
    if (type === 'video') return '(video)';
    if (type === 'document' || type === 'ptt') return '(documento)';
    if (type === 'audio') return '(audio)';
    if (type === 'sticker') return '(sticker)';
    return '(media)';
  };

  if (!contactEmail && !contactPhone) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
        <FaEnvelope size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p>Nessuna email o telefono associato a questo contatto.</p>
      </div>
    );
  }

  const canSendEmail = hasEmail && accounts.length > 0;
  const canSendWhatsApp = hasPhone && whatsappConnected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          Conversazioni con <span style={{ color: '#4F46E5' }}>{contactName || contactEmail || contactPhone}</span>
          {searchTime !== null && !loading && (
            <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '8px', fontWeight: 400 }}>
              ({unifiedMessages.length} messaggi)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRefresh}
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

      {/* Channel Filter Bar */}
      {showChannelFilter && (
        <div style={{
          display: 'flex', gap: '6px', padding: '8px 20px',
          borderBottom: '1px solid #E5E7EB', background: '#FFFFFF', alignItems: 'center'
        }}>
          {[
            { id: 'all', label: 'Tutto', count: unifiedMessages.length },
            ...(hasEmail ? [{ id: 'email', label: 'Email', count: emailCount, icon: <FaEnvelope size={11} /> }] : []),
            ...(hasPhone ? [{ id: 'whatsapp', label: 'WhatsApp', count: waCount, icon: <FaWhatsapp size={11} /> }] : []),
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setChannelFilter(f.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                border: channelFilter === f.id ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                background: channelFilter === f.id ? '#EEF2FF' : '#FFFFFF',
                color: channelFilter === f.id ? '#4F46E5' : '#6B7280',
                cursor: 'pointer'
              }}
            >
              {f.icon}
              {f.label}
              <span style={{
                fontSize: '10px', padding: '1px 5px', borderRadius: '8px',
                background: channelFilter === f.id ? '#C7D2FE' : '#F3F4F6',
                color: channelFilter === f.id ? '#4338CA' : '#9CA3AF'
              }}>
                {f.count}
              </span>
            </button>
          ))}
          {hasPhone && !whatsappConnected && (
            <span style={{ fontSize: '11px', color: '#D97706', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaWhatsapp size={11} /> WA non connesso
            </span>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
            <FaSpinner size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p style={{ fontSize: '14px' }}>Ricerca conversazioni...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <FaEnvelope size={28} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px' }}>Nessuna conversazione trovata</p>
          </div>
        ) : (
          <>
            {filteredMessages.map((msg) => {
              // WhatsApp bubble
              if (msg.channel === 'whatsapp') {
                const isOutbound = msg.fromMe;
                const mediaLabel = getMediaLabel(msg);
                return (
                  <div
                    key={msg.key}
                    style={{
                      display: 'flex',
                      justifyContent: isOutbound ? 'flex-end' : 'flex-start',
                      maxWidth: '100%'
                    }}
                  >
                    <div style={{
                      maxWidth: '75%',
                      minWidth: '200px',
                      padding: '10px 14px',
                      borderRadius: isOutbound ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: isOutbound ? '#DCF8C6' : '#FFFFFF',
                      border: '1px solid ' + (isOutbound ? '#B4E6A0' : '#E5E7EB'),
                    }}>
                      {/* Channel indicator */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#25D366', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaWhatsapp size={12} /> {isOutbound ? 'Tu' : (contactName || contactPhone)}
                        </span>
                      </div>

                      {/* Message body */}
                      {msg.body && (
                        <div style={{ fontSize: '13px', color: '#1F2937', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {msg.body}
                        </div>
                      )}
                      {mediaLabel && (
                        <div style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic', marginTop: msg.body ? '4px' : '0' }}>
                          {mediaLabel}
                        </div>
                      )}

                      {/* Date */}
                      <div style={{ marginTop: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {formatWaDate(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Email bubble (existing style)
              const isOutbound = msg.direction === 'outbound';
              const isExpanded = expandedUid === `${msg.account_key}:${msg.uid}:${msg.folder}`;

              return (
                <div
                  key={msg.key}
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
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isOutbound ? '#1E40AF' : '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaEnvelope size={11} style={{ color: '#6B7280' }} /> {isOutbound ? 'Pitch Partner' : (msg.from_name || msg.from_email)}
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
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>Allegati</span>
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
          {/* Channel selector */}
          {(canSendEmail || canSendWhatsApp) && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {canSendEmail && (
                <button
                  onClick={() => setComposeChannel('email')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    border: composeChannel === 'email' ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                    background: composeChannel === 'email' ? '#EEF2FF' : '#FFFFFF',
                    color: composeChannel === 'email' ? '#4F46E5' : '#6B7280',
                    cursor: 'pointer'
                  }}
                >
                  <FaEnvelope size={11} /> Email
                </button>
              )}
              {canSendWhatsApp && (
                <button
                  onClick={() => setComposeChannel('whatsapp')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    border: composeChannel === 'whatsapp' ? '2px solid #25D366' : '1px solid #E5E7EB',
                    background: composeChannel === 'whatsapp' ? '#F0FFF4' : '#FFFFFF',
                    color: composeChannel === 'whatsapp' ? '#25D366' : '#6B7280',
                    cursor: 'pointer'
                  }}
                >
                  <FaWhatsapp size={11} /> WhatsApp
                </button>
              )}
              {hasPhone && !whatsappConnected && (
                <span style={{ fontSize: '11px', color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                  <FaWhatsapp size={11} /> WA non connesso
                </span>
              )}
            </div>
          )}

          {/* Email compose */}
          {composeChannel === 'email' && (
            <>
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
            </>
          )}

          {/* WhatsApp compose - destination info */}
          {composeChannel === 'whatsapp' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', marginBottom: '10px',
              borderRadius: '6px', background: '#F0FFF4', fontSize: '12px', color: '#25D366'
            }}>
              <FaWhatsapp size={12} /> Invia a {contactPhone}
            </div>
          )}

          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder={composeChannel === 'whatsapp' ? 'Scrivi un messaggio WhatsApp...' : 'Scrivi un messaggio...'}
            rows={composeChannel === 'whatsapp' ? 3 : 4}
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
              disabled={sending || !composeBody.trim() || (composeChannel === 'email' && !composeSubject.trim())}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '6px', border: 'none',
                background: sending ? '#9CA3AF' : (composeChannel === 'whatsapp' ? '#25D366' : '#1A1A1A'),
                color: '#FFFFFF',
                fontSize: '13px', fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer'
              }}
            >
              {sending ? <FaSpinner size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <FaPaperPlane size={11} />}
              {sending ? 'Invio...' : (composeChannel === 'whatsapp' ? 'Invia WA' : 'Invia')}
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
