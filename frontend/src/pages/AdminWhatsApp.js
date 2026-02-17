import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { adminWhatsAppAPI } from '../services/api';
import '../styles/template-style.css';

import {
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineQrCode,
  HiOutlinePaperAirplane,
  HiOutlineSignal,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChevronLeft,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperClip,
  HiOutlineDocument,
  HiOutlineArrowDownTray
} from 'react-icons/hi2';

// --- MediaBubble: renders media content inside a chat bubble ---
function MediaBubble({ msgId, mediaType, fromMe }) {
  const [state, setState] = useState('loading'); // loading | loaded | error
  const [media, setMedia] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminWhatsAppAPI.getMedia(msgId)
      .then(res => {
        if (!cancelled) {
          setMedia(res.data);
          setState('loaded');
        }
      })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [msgId]);

  if (state === 'loading') {
    return <div style={{ padding: '12px', color: '#9CA3AF', fontSize: '12px' }}>Caricamento media...</div>;
  }
  if (state === 'error') {
    return <div style={{ padding: '8px', color: '#EF4444', fontSize: '12px' }}>Media non disponibile</div>;
  }

  const src = `data:${media.mimetype};base64,${media.data}`;

  if (mediaType === 'sticker') {
    return <img src={src} alt="sticker" style={{ maxWidth: '120px', borderRadius: '8px' }} />;
  }
  if (mediaType === 'image') {
    return (
      <>
        <img src={src} alt="immagine" onClick={() => setFullscreen(true)}
          style={{ maxWidth: '280px', borderRadius: '8px', cursor: 'pointer', display: 'block' }} />
        {fullscreen && (
          <div onClick={() => setFullscreen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, cursor: 'zoom-out'
          }}>
            <img src={src} alt="immagine" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }} />
          </div>
        )}
      </>
    );
  }
  if (mediaType === 'video') {
    return <video controls src={src} style={{ maxWidth: '280px', borderRadius: '8px', display: 'block' }} />;
  }
  if (mediaType === 'audio' || mediaType === 'ptt') {
    return <audio controls src={src} style={{ maxWidth: '260px' }} />;
  }
  // document or other
  const fname = media.filename || 'documento';
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = fname;
    a.click();
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0'
    }}>
      <HiOutlineDocument size={22} style={{ color: fromMe ? 'rgba(255,255,255,0.7)' : '#6B7280', flexShrink: 0 }} />
      <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{fname}</span>
      <button onClick={handleDownload} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        color: fromMe ? 'rgba(255,255,255,0.7)' : '#6B7280', flexShrink: 0
      }}>
        <HiOutlineArrowDownTray size={16} />
      </button>
    </div>
  );
}

const MAX_ATTACHMENT_SIZE = 16 * 1024 * 1024; // 16MB

function AdminWhatsApp() {
  const navigate = useNavigate();
  const { user } = getAuth();

  const [activeTab, setActiveTab] = useState('stato');

  // Connection state
  const [status, setStatus] = useState({ connected: false, info: null });
  const [qrCode, setQrCode] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Chats
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatName, setSelectedChatName] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatReplyText, setChatReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New message modal
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [dbContacts, setDbContacts] = useState([]);
  const [loadingDbContacts, setLoadingDbContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [newMsgTo, setNewMsgTo] = useState(null);
  const [newMsgText, setNewMsgText] = useState('');
  const [sendingNew, setSendingNew] = useState(false);
  const [newMsgResult, setNewMsgResult] = useState(null);

  // Attachment state (chat reply)
  const [replyAttachment, setReplyAttachment] = useState(null); // { data, mimetype, filename, preview }
  const replyFileRef = useRef(null);

  // Attachment state (new message modal)
  const [newMsgAttachment, setNewMsgAttachment] = useState(null);
  const newMsgFileRef = useRef(null);

  const pollingRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/admin/login'); return; }
    fetchStatus();
  }, [user, navigate]);

  // Poll status when disconnected
  useEffect(() => {
    if (!status.connected && activeTab === 'stato') {
      pollingRef.current = setInterval(fetchStatus, 3000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [status.connected, activeTab]);

  // Fetch chats when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && status.connected) fetchChats();
  }, [activeTab, status.connected]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- Fetchers ---
  const fetchStatus = async () => {
    try {
      const res = await adminWhatsAppAPI.getStatus();
      const data = res.data;
      setStatus({ connected: data.connected, info: data.info });
      if (!data.connected) {
        const qrRes = await adminWhatsAppAPI.getQR();
        setQrCode(qrRes.data.qr);
      } else {
        setQrCode(null);
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch (e) {
      console.error('Errore status WhatsApp:', e);
    }
    setLoadingStatus(false);
  };

  const [chatsSyncing, setChatsSyncing] = useState(false);

  const fetchChats = async (refresh = false) => {
    setLoadingChats(true);
    try {
      const url = refresh ? '/admin/whatsapp/chats?refresh=true' : '/admin/whatsapp/chats';
      const res = refresh
        ? await adminWhatsAppAPI.getChats('?refresh=true')
        : await adminWhatsAppAPI.getChats();
      setChats(res.data.chats || []);
      setChatsSyncing(res.data.syncing || false);
    } catch (e) { console.error(e); }
    setLoadingChats(false);
  };

  const fetchChatMessages = async (chatId) => {
    setLoadingMessages(true);
    try {
      const res = await adminWhatsAppAPI.getChatMessages(chatId);
      setChatMessages(res.data.messages || []);
    } catch (e) { console.error(e); }
    setLoadingMessages(false);
  };

  const fetchDbContacts = async () => {
    if (dbContacts.length > 0) return;
    setLoadingDbContacts(true);
    try {
      const res = await adminWhatsAppAPI.getDBContacts();
      setDbContacts(res.data.contacts || []);
    } catch (e) { console.error(e); }
    setLoadingDbContacts(false);
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnettere la sessione WhatsApp?')) return;
    setDisconnecting(true);
    try {
      await adminWhatsAppAPI.disconnect();
      setStatus({ connected: false, info: null });
      setQrCode(null);
    } catch (e) { console.error(e); }
    setDisconnecting(false);
  };

  const handleSendReply = async () => {
    if (!selectedChat || (!chatReplyText.trim() && !replyAttachment)) return;
    setSendingReply(true);
    try {
      const payload = { to: selectedChat, message: chatReplyText.trim() };
      if (replyAttachment) {
        payload.media = { data: replyAttachment.data, mimetype: replyAttachment.mimetype, filename: replyAttachment.filename };
      }
      await adminWhatsAppAPI.send(payload);
      setChatReplyText('');
      setReplyAttachment(null);
      await fetchChatMessages(selectedChat);
    } catch (e) { console.error(e); }
    setSendingReply(false);
  };

  const openChatDetail = (chat) => {
    setSelectedChat(chat.id);
    setSelectedChatName(chat.name || chat.id.replace('@c.us', ''));
    fetchChatMessages(chat.id);
  };

  const openNewMessage = () => {
    setShowNewMessage(true);
    setNewMsgTo(null);
    setNewMsgText('');
    setNewMsgResult(null);
    setNewMsgAttachment(null);
    setContactSearch('');
    fetchDbContacts();
  };

  const handleSendNewMessage = async () => {
    if (!newMsgTo || (!newMsgText.trim() && !newMsgAttachment)) return;
    setSendingNew(true);
    setNewMsgResult(null);
    try {
      const payload = { to: newMsgTo.telefono, message: newMsgText.trim() };
      if (newMsgAttachment) {
        payload.media = { data: newMsgAttachment.data, mimetype: newMsgAttachment.mimetype, filename: newMsgAttachment.filename };
      }
      await adminWhatsAppAPI.send(payload);
      setNewMsgResult({ type: 'success', text: 'Messaggio inviato!' });
      setNewMsgText('');
      setNewMsgAttachment(null);
      // Refresh chat list
      fetchChats();
    } catch (e) {
      setNewMsgResult({ type: 'error', text: e.response?.data?.error || 'Errore durante l\'invio' });
    }
    setSendingNew(false);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const handleFileSelect = (file, setter) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      alert('File troppo grande. Limite: 16 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      const preview = file.type.startsWith('image/') ? reader.result : null;
      setter({ data: base64, mimetype: file.type, filename: file.name, preview });
    };
    reader.readAsDataURL(file);
  };

  const tipoLabel = (tipo) => ({ club: 'Club', lead: 'Lead' }[tipo] || tipo);
  const tipoBadge = (tipo) => ({ club: 'tp-badge tp-badge-primary', lead: 'tp-badge tp-badge-warning' }[tipo] || 'tp-badge tp-badge-neutral');

  const filteredContacts = contactSearch
    ? dbContacts.filter(c =>
        c.nome.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.telefono.includes(contactSearch)
      )
    : dbContacts;

  // ================================================================== RENDER
  return (
    <div className="tp-page-container">
      {/* Header */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title">
            <HiOutlineChatBubbleBottomCenterText size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            WhatsApp
          </h1>
          <p className="tp-page-subtitle">Gestisci messaggi WhatsApp dal pannello admin</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
            background: status.connected ? '#F0FDF4' : '#FEF2F2',
            color: status.connected ? '#16A34A' : '#DC2626',
            border: `1px solid ${status.connected ? '#BBF7D0' : '#FECACA'}`
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: status.connected ? '#16A34A' : '#DC2626'
            }} />
            {status.connected ? 'Connesso' : 'Disconnesso'}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="tp-card">
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
          {[
            { key: 'stato', label: 'Stato & QR', icon: HiOutlineQrCode },
            { key: 'chat', label: 'Chat', icon: HiOutlineChatBubbleLeftRight },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedChat(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: activeTab === tab.key ? '#1A1A1A' : 'transparent',
                  color: activeTab === tab.key ? '#FFFFFF' : '#6B7280',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="tp-card-body">
          {activeTab === 'stato' && renderStatusTab()}
          {activeTab === 'chat' && renderChatTab()}
        </div>
      </div>

      {/* New Message Modal */}
      {renderNewMessageModal()}
    </div>
  );

  // ================================================================== Status Tab
  function renderStatusTab() {
    if (loadingStatus) {
      return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}><p style={{ fontSize: '13px' }}>Caricamento...</p></div>;
    }

    if (status.connected) {
      return (
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px',
            background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #BBF7D0'
          }}>
            <HiOutlineSignal size={36} style={{ color: '#16A34A' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>WhatsApp Connesso</h3>
          {status.info && (
            <div style={{ margin: '20px 0', padding: '20px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'grid', gap: '12px', textAlign: 'left' }}>
                {status.info.pushname && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome</div>
                    <div style={{ fontSize: '15px', color: '#1F2937', fontWeight: 500 }}>{status.info.pushname}</div>
                  </div>
                )}
                {status.info.wid && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Numero</div>
                    <div style={{ fontSize: '15px', color: '#1F2937', fontWeight: 500 }}>{status.info.wid.replace('@c.us', '')}</div>
                  </div>
                )}
                {status.info.platform && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Piattaforma</div>
                    <div style={{ fontSize: '15px', color: '#1F2937', fontWeight: 500 }}>{status.info.platform}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <button className="tp-btn tp-btn-outline" onClick={handleDisconnect} disabled={disconnecting} style={{ marginTop: '10px' }}>
            <HiOutlineXMark size={14} /> {disconnecting ? 'Disconnessione...' : 'Disconnetti'}
          </button>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px',
          background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #FECACA'
        }}>
          <HiOutlineQrCode size={36} style={{ color: '#DC2626' }} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>Collega WhatsApp</h3>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px', lineHeight: 1.6 }}>
          Apri WhatsApp sul telefono &rarr; <strong>Dispositivi collegati</strong> &rarr; <strong>Collega un dispositivo</strong> &rarr; Scansiona il QR code
        </p>
        {qrCode ? (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            border: '1px solid #E5E7EB', display: 'inline-block',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <img src={qrCode} alt="QR Code WhatsApp" style={{ width: '280px', height: '280px' }} />
          </div>
        ) : (
          <div style={{ background: '#F9FAFB', borderRadius: '16px', padding: '60px 20px', border: '1px solid #E5E7EB' }}>
            <HiOutlineArrowPath size={24} style={{ color: '#9CA3AF', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '12px' }}>
              In attesa del QR code... Assicurati che il servizio WhatsApp sia avviato.
            </p>
          </div>
        )}
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '16px' }}>
          Il QR code si aggiorna automaticamente. La pagina controlla lo stato ogni 3 secondi.
        </p>
      </div>
    );
  }

  // ================================================================== Chat Tab
  function renderChatTab() {
    if (!status.connected) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <HiOutlineSignal size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
          <h3 style={{ color: '#6B7280', fontWeight: 600, margin: '0 0 4px', fontSize: '15px' }}>WhatsApp non connesso</h3>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 16px' }}>Vai alla tab "Stato & QR" per collegare WhatsApp</p>
          <button className="tp-btn tp-btn-primary tp-btn-sm" onClick={() => setActiveTab('stato')}>
            <HiOutlineQrCode size={14} /> Vai a Stato & QR
          </button>
        </div>
      );
    }

    if (selectedChat) return renderChatDetail();

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Chat</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {chatsSyncing && (
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Sincronizzazione in corso...</span>
            )}
            <button className="tp-btn tp-btn-outline tp-btn-sm" onClick={() => fetchChats(true)}>
              <HiOutlineArrowPath size={14} /> Aggiorna
            </button>
            <button className="tp-btn tp-btn-primary tp-btn-sm" onClick={openNewMessage}>
              <HiOutlinePlus size={14} /> Nuovo Messaggio
            </button>
          </div>
        </div>

        {loadingChats ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}><p style={{ fontSize: '13px' }}>Caricamento chat...</p></div>
        ) : chats.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
            <HiOutlineChatBubbleLeftRight size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
            <h3 style={{ color: '#6B7280', fontWeight: 600, margin: '0 0 4px', fontSize: '15px' }}>Nessuna chat</h3>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Le chat appariranno qui dopo la connessione</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {chats.map(chat => (
              <div key={chat.id}
                onClick={() => openChatDetail(chat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                  transition: 'background 0.1s', borderBottom: '1px solid #F3F4F6'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: chat.isGroup ? '#EDE9FE' : '#E0F2FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: chat.isGroup ? '#7C3AED' : '#0284C7', fontWeight: 700, fontSize: '16px'
                }}>
                  {(chat.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.name || chat.id.replace('@c.us', '')}
                    </span>
                    {chat.lastMessage && (
                      <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0, marginLeft: '8px' }}>
                        {formatTimestamp(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <div style={{ fontSize: '13px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.lastMessage.fromMe && <span style={{ color: '#9CA3AF' }}>Tu: </span>}
                      {chat.lastMessage.body || '(media)'}
                    </div>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <span style={{
                    background: '#16A34A', color: '#fff', borderRadius: '10px',
                    padding: '2px 8px', fontSize: '11px', fontWeight: 700, flexShrink: 0
                  }}>{chat.unreadCount}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // ================================================================== Chat Detail
  function renderChatDetail() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0',
          borderBottom: '1px solid #E5E7EB', marginBottom: '12px', flexShrink: 0
        }}>
          <button className="tp-btn tp-btn-outline tp-btn-sm" onClick={() => { setSelectedChat(null); setChatMessages([]); setReplyAttachment(null); }}>
            <HiOutlineChevronLeft size={14} /> Indietro
          </button>
          <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '15px' }}>{selectedChatName}</div>
          <button className="tp-btn tp-btn-outline tp-btn-sm" onClick={() => fetchChatMessages(selectedChat)} style={{ marginLeft: 'auto' }}>
            <HiOutlineArrowPath size={14} />
          </button>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 8px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          background: '#F9FAFB', borderRadius: '12px'
        }}>
          {loadingMessages ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '13px' }}>Caricamento messaggi...</div>
          ) : chatMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '13px' }}>Nessun messaggio</div>
          ) : (
            chatMessages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.fromMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', borderRadius: '14px',
                  background: msg.fromMe ? '#1A1A1A' : '#fff',
                  color: msg.fromMe ? '#fff' : '#1F2937',
                  border: msg.fromMe ? 'none' : '1px solid #E5E7EB',
                  fontSize: '14px', lineHeight: 1.5,
                  overflow: 'hidden'
                }}>
                  {msg.hasMedia && msg.mediaType ? (
                    <>
                      <MediaBubble msgId={msg.id} mediaType={msg.mediaType} fromMe={msg.fromMe} />
                      {msg.body && <div style={{ wordBreak: 'break-word', marginTop: '6px' }}>{msg.body}</div>}
                    </>
                  ) : (
                    <div style={{ wordBreak: 'break-word' }}>{msg.body || `(${msg.type})`}</div>
                  )}
                  <div style={{
                    fontSize: '11px', marginTop: '4px', textAlign: 'right',
                    color: msg.fromMe ? 'rgba(255,255,255,0.6)' : '#9CA3AF'
                  }}>
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment preview */}
        {replyAttachment && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', background: '#F0F9FF', borderRadius: '8px',
            border: '1px solid #BAE6FD', marginTop: '8px'
          }}>
            {replyAttachment.preview ? (
              <img src={replyAttachment.preview} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
            ) : (
              <HiOutlineDocument size={20} style={{ color: '#0284C7' }} />
            )}
            <span style={{ flex: 1, fontSize: '13px', color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyAttachment.filename}</span>
            <button onClick={() => setReplyAttachment(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px'
            }}><HiOutlineXMark size={16} /></button>
          </div>
        )}

        <div style={{
          display: 'flex', gap: '10px', paddingTop: '12px',
          borderTop: '1px solid #E5E7EB', marginTop: '12px', flexShrink: 0
        }}>
          <input type="file" ref={replyFileRef} hidden
            onChange={e => { handleFileSelect(e.target.files[0], setReplyAttachment); e.target.value = ''; }} />
          <button onClick={() => replyFileRef.current?.click()} style={{
            background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px',
            padding: '8px 10px', cursor: 'pointer', color: '#6B7280', flexShrink: 0,
            display: 'flex', alignItems: 'center'
          }} title="Allega file">
            <HiOutlinePaperClip size={18} />
          </button>
          <input
            type="text" className="tp-form-input"
            value={chatReplyText} onChange={e => setChatReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
            placeholder="Scrivi un messaggio..." style={{ flex: 1 }}
          />
          <button className="tp-btn tp-btn-primary" onClick={handleSendReply}
            disabled={sendingReply || (!chatReplyText.trim() && !replyAttachment)}
            style={{ opacity: sendingReply || (!chatReplyText.trim() && !replyAttachment) ? 0.5 : 1, flexShrink: 0 }}>
            <HiOutlinePaperAirplane size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ================================================================== New Message Modal
  function renderNewMessageModal() {
    if (!showNewMessage) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px'
      }} onClick={() => setShowNewMessage(false)}>
        <div onClick={e => e.stopPropagation()} style={{
          background: '#fff', borderRadius: '16px', width: '100%',
          maxWidth: '540px', maxHeight: '85vh', display: 'flex',
          flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid #E5E7EB', flexShrink: 0
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>Nuovo Messaggio</h3>
            <button onClick={() => setShowNewMessage(false)} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none',
              background: '#F3F4F6', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#6B7280'
            }}><HiOutlineXMark size={18} /></button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
            {/* Step 1: Select contact */}
            {!newMsgTo ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label className="tp-form-label">Seleziona destinatario (Club o Lead)</label>
                  <div style={{ position: 'relative' }}>
                    <HiOutlineMagnifyingGlass size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input type="text" className="tp-form-input" value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      placeholder="Cerca per nome o telefono..."
                      style={{ paddingLeft: '34px' }}
                    />
                  </div>
                </div>

                {loadingDbContacts ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '13px' }}>Caricamento contatti...</div>
                ) : filteredContacts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '13px' }}>
                    {contactSearch ? 'Nessun risultato' : 'Nessun contatto con telefono nel database'}
                  </div>
                ) : (
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {filteredContacts.map((c, i) => (
                      <div key={`${c.tipo}-${c.id}-${i}`}
                        onClick={() => setNewMsgTo(c)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                          borderBottom: '1px solid #F3F4F6', transition: 'background 0.1s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                          background: c.tipo === 'club' ? '#DBEAFE' : '#FEF3C7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: c.tipo === 'club' ? '#2563EB' : '#D97706',
                          fontWeight: 700, fontSize: '14px'
                        }}>
                          {c.nome[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '14px' }}>{c.nome}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>{c.telefono}</div>
                        </div>
                        <span className={tipoBadge(c.tipo)} style={{ flexShrink: 0 }}>{tipoLabel(c.tipo)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Step 2: Write message */
              <>
                {/* Selected contact */}
                <div style={{
                  background: '#F0FDF4', borderRadius: '10px', padding: '12px 16px',
                  border: '1px solid #BBF7D0', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                    background: newMsgTo.tipo === 'club' ? '#DBEAFE' : '#FEF3C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: newMsgTo.tipo === 'club' ? '#2563EB' : '#D97706',
                    fontWeight: 700, fontSize: '14px'
                  }}>
                    {newMsgTo.nome[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '14px' }}>{newMsgTo.nome}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{newMsgTo.telefono}</div>
                  </div>
                  <button onClick={() => { setNewMsgTo(null); setNewMsgResult(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    <HiOutlineXMark size={16} />
                  </button>
                </div>

                <div className="tp-form-group" style={{ marginBottom: '20px' }}>
                  <label className="tp-form-label">Messaggio</label>
                  <textarea className="tp-form-textarea" value={newMsgText}
                    onChange={e => setNewMsgText(e.target.value)} rows={5}
                    placeholder="Scrivi il messaggio da inviare..."
                  />
                </div>

                {/* Attachment */}
                <div style={{ marginBottom: '20px' }}>
                  <input type="file" ref={newMsgFileRef} hidden
                    onChange={e => { handleFileSelect(e.target.files[0], setNewMsgAttachment); e.target.value = ''; }} />
                  {newMsgAttachment ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', background: '#F0F9FF', borderRadius: '8px',
                      border: '1px solid #BAE6FD'
                    }}>
                      {newMsgAttachment.preview ? (
                        <img src={newMsgAttachment.preview} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <HiOutlineDocument size={20} style={{ color: '#0284C7' }} />
                      )}
                      <span style={{ flex: 1, fontSize: '13px', color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newMsgAttachment.filename}</span>
                      <button onClick={() => setNewMsgAttachment(null)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px'
                      }}><HiOutlineXMark size={16} /></button>
                    </div>
                  ) : (
                    <button onClick={() => newMsgFileRef.current?.click()} className="tp-btn tp-btn-outline tp-btn-sm">
                      <HiOutlinePaperClip size={14} /> Allega file
                    </button>
                  )}
                </div>

                {newMsgResult && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
                    background: newMsgResult.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                    color: newMsgResult.type === 'success' ? '#16A34A' : '#DC2626',
                    border: `1px solid ${newMsgResult.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                    fontSize: '14px', fontWeight: 500
                  }}>
                    {newMsgResult.text}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {newMsgTo && (
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #E5E7EB',
              display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0
            }}>
              <button className="tp-btn tp-btn-outline" onClick={() => setShowNewMessage(false)}>Annulla</button>
              <button className="tp-btn tp-btn-primary" onClick={handleSendNewMessage}
                disabled={sendingNew || (!newMsgText.trim() && !newMsgAttachment)}
                style={{ opacity: sendingNew || (!newMsgText.trim() && !newMsgAttachment) ? 0.5 : 1 }}>
                <HiOutlinePaperAirplane size={14} />
                {sendingNew ? 'Invio...' : 'Invia'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default AdminWhatsApp;
