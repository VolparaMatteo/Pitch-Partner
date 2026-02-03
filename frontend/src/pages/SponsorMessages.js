import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sponsorMessageAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/sponsor-network.css';

function SponsorMessages() {
  const [conversations, setConversations] = useState([]);
  const [currentThread, setCurrentThread] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { sponsorId } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sponsorId) {
      loadThread(parseInt(sponsorId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsorId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await sponsorMessageAPI.getConversations();
      setConversations(res.data.conversations || []);
    } catch (error) {
      console.error('Errore nel caricamento conversazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (otherSponsorId) => {
    try {
      const res = await sponsorMessageAPI.getThread(otherSponsorId);
      setCurrentThread(res.data.messages || []);
      setSelectedSponsor(res.data.other_sponsor);
      // Aggiorna conversazioni per azzerare unread
      fetchConversations();
    } catch (error) {
      console.error('Errore nel caricamento thread:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSponsor) return;

    try {
      setSending(true);
      await sponsorMessageAPI.sendMessage({
        receiver_sponsor_id: selectedSponsor.id,
        testo: newMessage
      });
      setNewMessage('');
      loadThread(selectedSponsor.id);
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      alert('Errore nell\'invio del messaggio: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="messages-container">
        <div className="messages-sidebar">
          <div className="sidebar-header">
            <h2>Conversazioni</h2>
            <button
              className="btn-secondary btn-sm"
              onClick={() => navigate('/sponsor-network')}
            >
              + Nuovo
            </button>
          </div>

          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="empty-state-small">
                <p>Nessuna conversazione</p>
                <button
                  className="btn-link"
                  onClick={() => navigate('/sponsor-network')}
                >
                  Cerca sponsor →
                </button>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.sponsor_id}
                  className={`conversation-item ${selectedSponsor?.id === conv.sponsor_id ? 'active' : ''}`}
                  onClick={() => {
                    navigate(`/sponsor-messages/${conv.sponsor_id}`);
                    loadThread(conv.sponsor_id);
                  }}
                >
                  {conv.logo_url && (
                    <img src={conv.logo_url} alt={conv.ragione_sociale} className="conv-logo" />
                  )}
                  <div className="conv-info">
                    <div className="conv-name">
                      {conv.ragione_sociale}
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">{conv.unread_count}</span>
                      )}
                    </div>
                    <div className="conv-last-message">
                      {conv.last_message.sender_is_me ? 'Tu: ' : ''}
                      {conv.last_message.testo}
                    </div>
                    <div className="conv-time">
                      {new Date(conv.last_message.created_at).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="messages-main">
          {selectedSponsor ? (
            <>
              <div className="thread-header">
                {selectedSponsor.logo_url && (
                  <img src={selectedSponsor.logo_url} alt={selectedSponsor.ragione_sociale} className="thread-logo" />
                )}
                <div className="thread-info">
                  <h2>{selectedSponsor.ragione_sociale}</h2>
                  <p>{selectedSponsor.settore_merceologico}</p>
                </div>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => navigate(`/sponsor-network/profile/${selectedSponsor.id}`)}
                >
                  👤 Vedi Profilo
                </button>
              </div>

              <div className="thread-messages">
                {currentThread.length === 0 ? (
                  <div className="empty-state">
                    <p>Nessun messaggio ancora. Inizia la conversazione!</p>
                  </div>
                ) : (
                  currentThread.map(msg => (
                    <div
                      key={msg.id}
                      className={`message-bubble ${msg.sender_is_me ? 'message-sent' : 'message-received'}`}
                    >
                      <div className="message-text">{msg.testo}</div>
                      <div className="message-time">
                        {new Date(msg.created_at).toLocaleString('it-IT')}
                        {msg.sender_is_me && (
                          <span className="message-status">
                            {msg.letto ? ' ✓✓' : ' ✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Scrivi un messaggio..."
                  disabled={sending}
                />
                <button type="submit" className="btn-primary" disabled={sending || !newMessage.trim()}>
                  {sending ? '⏳' : '📤'} Invia
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state-main">
              <h3>Seleziona una conversazione</h3>
              <p>Scegli uno sponsor dalla lista per iniziare a chattare</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/sponsor-network')}
              >
                🔍 Cerca Sponsor
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SponsorMessages;
