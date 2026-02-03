import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import FavIcon from '../static/logo/FavIcon.png';

function Chat({ clubId, sponsorId, contractId = null, contextType = null, contextId = null, otherPartyName = null, otherPartyLogo = null, myLogo = null, onClose }) {
  const { user } = getAuth();
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [otherPartyInfo, setOtherPartyInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Update otherPartyInfo when props change
  useEffect(() => {
    if (otherPartyName || otherPartyLogo) {
      setOtherPartyInfo({
        name: otherPartyName,
        logo: otherPartyLogo
      });
    }
  }, [otherPartyName, otherPartyLogo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getConversation(clubId, sponsorId, contractId, contextType, contextId);
      setMessages(response.data.messages);

      // Extract other party info from first message only if not already set
      if (!otherPartyInfo && response.data.messages.length > 0) {
        const firstMsg = response.data.messages[0];
        if (user.role === 'club') {
          setOtherPartyInfo({
            name: firstMsg.sender_type === 'sponsor' ? firstMsg.sender_name : firstMsg.receiver_name,
            logo: firstMsg.sender_type === 'sponsor' ? firstMsg.sender_logo : firstMsg.receiver_logo
          });
        } else {
          setOtherPartyInfo({
            name: firstMsg.sender_type === 'club' ? firstMsg.sender_name : firstMsg.receiver_name,
            logo: firstMsg.sender_type === 'club' ? firstMsg.sender_logo : firstMsg.receiver_logo
          });
        }
      }
    } catch (error) {
      console.error('Errore caricamento messaggi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Polling ogni 5 secondi per nuovi messaggi
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, sponsorId, contractId, contextType, contextId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    try {
      setSending(true);
      const receiverType = user.role === 'club' ? 'sponsor' : 'club';
      const receiverId = user.role === 'club' ? sponsorId : clubId;

      let attachmentData = {};

      if (selectedFile) {
        const uploadRes = await messageAPI.uploadAttachment(selectedFile);
        attachmentData = {
          attachment_url: uploadRes.data.url,
          attachment_type: uploadRes.data.type,
          attachment_name: uploadRes.data.name
        };
      }

      await messageAPI.sendMessage({
        testo: newMessage || (selectedFile ? 'Allegato inviato' : ''),
        receiver_type: receiverType,
        receiver_id: receiverId,
        receiver_id: receiverId,
        contract_id: contractId,
        context_type: contextType,
        context_id: contextId,
        ...attachmentData
      });

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMessages(); // Ricarica messaggi
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      alert('Errore durante l\'invio del messaggio');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Oggi';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const isMyMessage = (msg) => {
    return msg.sender_type === user.role && msg.sender_id === user.id;
  };

  const groupMessagesByDate = (messages) => {
    const grouped = [];
    let currentDate = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.data_invio).toDateString();
      if (msgDate !== currentDate) {
        grouped.push({ type: 'date', date: msg.data_invio });
        currentDate = msgDate;
      }
      grouped.push({ type: 'message', data: msg });
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (loading && messages.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#6B7280'
      }}>
        Caricamento chat...
      </div>
    );
  }

  return (
    <div className="chat-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#FFFFFF',
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div className="chat-header" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 20px',
        background: '#1A1A1A',
        borderBottom: '1px solid #333',
        flexShrink: 0
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'white',
          flexShrink: 0
        }}>
          <img
            src={otherPartyInfo?.logo ? getImageUrl(otherPartyInfo.logo) : FavIcon}
            alt={otherPartyInfo?.name || 'Chat'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => { e.target.src = FavIcon; }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600
          }}>
            {otherPartyInfo?.name || 'Chat'}
          </h3>
          <p style={{
            margin: '2px 0 0 0',
            color: '#85FF00',
            fontSize: '12px'
          }}>
            Online
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: '18px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="chat-messages" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: '#FFFFFF'
      }}>
        {groupedMessages.length === 0 ? (
          // Empty state (unchanged)
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6B7280',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👋</div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Inizia una nuova conversazione
            </h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              Invia il tuo primo messaggio per iniziare la chat
            </p>
          </div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div
                  key={`date-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '16px 0 8px 0'
                  }}
                >
                  <div style={{
                    background: '#F0F2F5',
                    padding: '6px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6B7280',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    {formatDateHeader(item.date)}
                  </div>
                </div>
              );
            }

            const msg = item.data;
            const isMine = isMyMessage(msg);

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                  marginBottom: '4px'
                }}
              >
                <div style={{
                  maxWidth: '65%',
                  minWidth: '160px'
                }}>
                  <div style={{
                    background: '#1A1A1A',
                    color: 'white',
                    padding: '12px',
                    borderRadius: isMine
                      ? '12px 12px 4px 12px'
                      : '12px 12px 12px 4px',
                    border: '2px solid #7FFF00',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    wordWrap: 'break-word',
                    position: 'relative',
                    minWidth: '160px'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      {/* Logo for received messages (Left) */}
                      {!isMine && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'white',
                          flexShrink: 0,
                          border: '1px solid #333'
                        }}>
                          <img
                            src={(msg.sender_logo || otherPartyInfo?.logo) ? getImageUrl(msg.sender_logo || otherPartyInfo?.logo) : FavIcon}
                            alt="Sender"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              padding: (msg.sender_logo || otherPartyInfo?.logo) ? '0' : '4px'
                            }}
                          />
                        </div>
                      )}

                      <div style={{ flex: 1 }}>
                        {/* Sender name for received messages */}
                        {!isMine && (
                          <div style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#7FFF00',
                            marginBottom: '4px'
                          }}>
                            {msg.sender_name}
                          </div>
                        )}

                        {/* Attachment */}
                        {msg.attachment_url && (
                          <div style={{ marginBottom: '8px' }}>
                            {msg.attachment_type === 'image' ? (
                              <img
                                src={getImageUrl(msg.attachment_url)}
                                alt="Allegato"
                                style={{
                                  maxWidth: '100%',
                                  borderRadius: '8px',
                                  border: '1px solid #333'
                                }}
                              />
                            ) : msg.attachment_type === 'video' ? (
                              <video
                                src={getImageUrl(msg.attachment_url)}
                                controls
                                style={{
                                  maxWidth: '100%',
                                  borderRadius: '8px',
                                  border: '1px solid #333'
                                }}
                              />
                            ) : (
                              <a
                                href={getImageUrl(msg.attachment_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: '#333',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  color: 'white',
                                  textDecoration: 'none',
                                  fontSize: '14px'
                                }}
                              >
                                <span>📎</span>
                                <span style={{ textDecoration: 'underline' }}>{msg.attachment_name || 'Documento'}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Message text */}
                        {msg.testo && (
                          <p style={{
                            margin: '0 0 6px 0',
                            fontSize: '15px',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {msg.testo}
                          </p>
                        )}
                      </div>

                      {/* Logo for sent messages (Right) */}
                      {isMine && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'white',
                          flexShrink: 0,
                          border: '1px solid #333',
                          marginLeft: '4px'
                        }}>
                          <img
                            src={(msg.sender_logo || myLogo) ? getImageUrl(msg.sender_logo || myLogo) : FavIcon}
                            alt="Me"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              padding: (msg.sender_logo || myLogo) ? '0' : '4px'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginTop: '4px'
                    }}>
                      <span>{formatTime(msg.data_invio)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area" style={{
        background: '#F5F6F6',
        padding: '12px 20px',
        borderTop: '1px solid #E5E7EB',
        flexShrink: 0
      }}>
        {/* File Preview */}
        {selectedFile && (
          <div style={{
            marginBottom: '12px',
            padding: '8px 12px',
            background: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📎</span>
              <span style={{ fontSize: '14px', color: '#374151' }}>{selectedFile.name}</span>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#EF4444',
                fontSize: '18px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#E5E7EB',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#6B7280',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#D1D5DB';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#E5E7EB';
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            📎
          </button>

          <input
            type="text"
            placeholder="Scrivi un messaggio..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            style={{
              flex: 1,
              padding: '12px 18px',
              border: 'none',
              borderRadius: '24px',
              background: 'white',
              fontSize: '15px',
              outline: 'none',
              transition: 'box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 0 2px rgba(127, 255, 0, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending}
            style={{
              background: (newMessage.trim() || selectedFile) && !sending
                ? '#1A1A1A'
                : '#E5E7EB',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (newMessage.trim() || selectedFile) && !sending ? 'pointer' : 'not-allowed',
              fontSize: '24px',
              transition: 'all 0.2s',
              color: (newMessage.trim() || selectedFile) && !sending ? 'white' : '#9CA3AF',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if ((newMessage.trim() || selectedFile) && !sending) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {sending ? '...' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
