import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { messageAPI, clubAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Chat from '../components/Chat';
import { FaSearch, FaPlus, FaTimes, FaComments, FaCircle, FaPaperPlane, FaEllipsisV } from 'react-icons/fa';
import FavIcon from '../static/logo/FavIcon.png';
import '../styles/messages.css';

function Messages() {
  const { user } = getAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [allSponsors, setAllSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showAllSponsors, setShowAllSponsors] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getConversations();
      setConversations(response.data.conversations);

      if (user.role === 'club') {
        const sponsorsRes = await clubAPI.getSponsors();
        const sponsorsData = Array.isArray(sponsorsRes.data)
          ? sponsorsRes.data
          : sponsorsRes.data.sponsors || [];
        setAllSponsors(sponsorsData);
      }
    } catch (error) {
      console.error('Errore caricamento conversazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'club' && user.role !== 'sponsor')) {
      navigate('/');
      return;
    }
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.state?.chat_context && user) {
      const { club_id, club_name, context_type, context_id } = location.state.chat_context;

      if (user.role === 'sponsor') {
        const newConversation = {
          club_id: club_id,
          club_name: club_name,
          sponsor_id: user.id,
          context_type: context_type,
          context_id: context_id,
          unread_count: 0,
          last_message: null
        };
        setSelectedConversation(newConversation);
      }
    }
  }, [location.state, user]);

  const formatLastMessageDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    setShowAllSponsors(false);
  };

  const handleSponsorClick = (sponsor) => {
    const newConversation = {
      club_id: user.id,
      sponsor_id: sponsor.id,
      sponsor_name: sponsor.ragione_sociale,
      sponsor_logo: sponsor.logo_url,
      unread_count: 0,
      last_message: null
    };
    setSelectedConversation(newConversation);
    setShowAllSponsors(false);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
    fetchConversations();
  };

  const filteredConversations = conversations
    .filter(conv => conv.last_message !== null)
    .filter(conv => {
      const name = user.role === 'club' ? conv.sponsor_name : conv.club_name;
      return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const filteredSponsors = allSponsors.filter(sponsor =>
    sponsor.ragione_sociale?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  if (loading) {
    return (
      <div className="wa-container">
        <div className="wa-loading">
          <FaComments />
          <span>Caricamento messaggi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wa-container">
      <div className="wa-chat-wrapper">
        {/* Sidebar */}
        <div className="wa-sidebar">
          {/* Sidebar Header */}
          <div className="wa-sidebar-header">
            <div className="wa-sidebar-title">
              <h2>Chat</h2>
              {totalUnread > 0 && (
                <span className="wa-total-unread">{totalUnread}</span>
              )}
            </div>
            {user.role === 'club' && (
              <button
                className="wa-new-chat-btn"
                onClick={() => setShowAllSponsors(!showAllSponsors)}
                title={showAllSponsors ? 'Chiudi' : 'Nuova Chat'}
              >
                {showAllSponsors ? <FaTimes /> : <FaPlus />}
              </button>
            )}
          </div>

          {/* Search */}
          <div className="wa-search">
            <FaSearch className="wa-search-icon" />
            <input
              type="text"
              placeholder={showAllSponsors ? "Cerca sponsor..." : "Cerca o inizia una nuova chat"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Contacts List */}
          <div className="wa-contacts">
            {showAllSponsors ? (
              // All Sponsors
              filteredSponsors.length === 0 ? (
                <div className="wa-empty">
                  <span className="wa-empty-icon">🤝</span>
                  <p>Nessuno sponsor trovato</p>
                </div>
              ) : (
                filteredSponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="wa-contact"
                    onClick={() => handleSponsorClick(sponsor)}
                  >
                    <div className="wa-contact-avatar">
                      <img
                        src={sponsor.logo_url ? getImageUrl(sponsor.logo_url) : FavIcon}
                        alt={sponsor.ragione_sociale}
                        onError={(e) => { e.target.src = FavIcon; }}
                      />
                    </div>
                    <div className="wa-contact-info">
                      <h4>{sponsor.ragione_sociale}</h4>
                      <p className="wa-contact-subtitle">{sponsor.settore_merceologico || 'Clicca per chattare'}</p>
                    </div>
                  </div>
                ))
              )
            ) : (
              // Conversations
              filteredConversations.length === 0 ? (
                <div className="wa-empty">
                  <span className="wa-empty-icon">💬</span>
                  <p>{searchQuery ? 'Nessuna conversazione trovata' : 'Nessuna conversazione'}</p>
                  {user.role === 'club' && !searchQuery && (
                    <button className="wa-start-btn" onClick={() => setShowAllSponsors(true)}>
                      <FaPlus /> Nuova Chat
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation &&
                    selectedConversation.club_id === conv.club_id &&
                    selectedConversation.sponsor_id === conv.sponsor_id;

                  return (
                    <div
                      key={`${conv.club_id}-${conv.sponsor_id}`}
                      className={`wa-contact ${isSelected ? 'active' : ''} ${conv.unread_count > 0 ? 'unread' : ''}`}
                      onClick={() => handleConversationClick(conv)}
                    >
                      <div className="wa-contact-avatar">
                        <img
                          src={(conv.sponsor_logo || conv.club_logo) ? getImageUrl(conv.sponsor_logo || conv.club_logo) : FavIcon}
                          alt="Logo"
                          onError={(e) => { e.target.src = FavIcon; }}
                        />
                      </div>
                      <div className="wa-contact-info">
                        <div className="wa-contact-row">
                          <h4>{user.role === 'club' ? conv.sponsor_name : conv.club_name}</h4>
                          {conv.last_message && (
                            <span className={`wa-contact-time ${conv.unread_count > 0 ? 'unread' : ''}`}>
                              {formatLastMessageDate(conv.last_message.data_invio)}
                            </span>
                          )}
                        </div>
                        <div className="wa-contact-row">
                          <p className="wa-contact-preview">
                            {conv.last_message ? (
                              <>
                                {conv.last_message.sender_type === user.role && (
                                  <span className="wa-check">✓✓</span>
                                )}
                                {conv.last_message.testo.length > 35
                                  ? conv.last_message.testo.substring(0, 35) + '...'
                                  : conv.last_message.testo}
                              </>
                            ) : (
                              'Nessun messaggio'
                            )}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="wa-unread-badge">{conv.unread_count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="wa-main">
          {selectedConversation ? (
            <Chat
              clubId={selectedConversation.club_id}
              sponsorId={selectedConversation.sponsor_id}
              contractId={selectedConversation.contract_id}
              contextType={selectedConversation.context_type}
              contextId={selectedConversation.context_id}
              otherPartyName={user.role === 'club' ? selectedConversation.sponsor_name : selectedConversation.club_name}
              otherPartyLogo={user.role === 'club' ? selectedConversation.sponsor_logo : selectedConversation.club_logo}
              myLogo={user.logo_url}
              onClose={handleCloseChat}
            />
          ) : (
            <div className="wa-placeholder">
              <div className="wa-placeholder-content">
                <div className="wa-placeholder-icon">
                  <FaComments />
                </div>
                <h2>Pitch Partner Chat</h2>
                <p>
                  Invia e ricevi messaggi in tempo reale con i tuoi {user.role === 'club' ? 'sponsor' : 'club'}.
                  <br />
                  Seleziona una conversazione per iniziare.
                </p>
                {user.role === 'club' && (
                  <button className="wa-placeholder-btn" onClick={() => setShowAllSponsors(true)}>
                    <FaPaperPlane /> Nuova Conversazione
                  </button>
                )}
              </div>
              <div className="wa-placeholder-footer">
                <span>🔒 Messaggi crittografati end-to-end</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
