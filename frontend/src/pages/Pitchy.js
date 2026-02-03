import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { sendMessageToGemini } from '../services/gemini';
import { getPitchyContext } from '../services/pitchyService';
import { getImageUrl } from '../utils/imageUtils';
import ReactMarkdown from 'react-markdown';
import PitchyAvatar from '../components/PitchyAvatar';
import { FaPaperPlane, FaRedo, FaChartLine, FaHandshake, FaLightbulb, FaRocket, FaBullseye, FaGem } from 'react-icons/fa';
import '../styles/pitchy.css';

const PITCHY_SYSTEM_PROMPT = `Sei Pitchy, l'assistente AI esperto di sponsorizzazioni sportive della piattaforma Pitch Partner.

**LA TUA IDENTITÀ:**
- Nome: Pitchy
- Ruolo: Esperto di sponsorizzazioni sportive e networking
- Piattaforma: Pitch Partner (piattaforma che connette club sportivi e sponsor)
- Tono: Professionale, amichevole, proattivo e orientato ai risultati

**LE TUE COMPETENZE:**
- Sponsorizzazioni sportive (pricing, ROI, contratti, attivazioni)
- Prospettiva Club (asset, proposte commerciali, retention)
- Prospettiva Sponsor (target, brand exposure, attivazione marketing)
- Networking e best practice del settore

**COMPORTAMENTO:**
- Risposte concise e actionable
- Usa i dati del database quando disponibili
- Adatta i consigli al livello del club/sponsor
- Suggerisci sempre passi concreti

**IMPORTANTE - ACCESSO AI DATI:**
Se ricevi "**CONTESTO DAL DATABASE**", USA quei dati per rispondere. Non dire "non ho accesso" se l'info è nel contesto.`;

function Pitchy() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const isClub = user?.role === 'club';
  const isSponsor = user?.role === 'sponsor';

  const suggestions = isClub ? [
    { icon: FaChartLine, text: 'Analizza i miei sponsor attuali', color: '#3B82F6' },
    { icon: FaGem, text: 'Crea un pacchetto sponsorship', color: '#8B5CF6' },
    { icon: FaRocket, text: 'Come aumentare il valore degli asset?', color: '#F59E0B' },
    { icon: FaHandshake, text: 'Trova nuovi sponsor per il mio club', color: '#10B981' },
  ] : isSponsor ? [
    { icon: FaBullseye, text: 'Trova club per il mio target', color: '#3B82F6' },
    { icon: FaChartLine, text: 'Calcola il ROI delle sponsorizzazioni', color: '#10B981' },
    { icon: FaLightbulb, text: 'Idee per attivare la sponsorizzazione', color: '#F59E0B' },
    { icon: FaRocket, text: 'Trend delle sponsorizzazioni sportive', color: '#8B5CF6' },
  ] : [
    { icon: FaHandshake, text: 'Come funzionano le sponsorizzazioni?', color: '#3B82F6' },
    { icon: FaChartLine, text: 'Strategie di sponsorship', color: '#10B981' },
    { icon: FaLightbulb, text: 'Best practice del settore', color: '#F59E0B' },
    { icon: FaRocket, text: 'Trend attuali', color: '#8B5CF6' },
  ];

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      let prompt = PITCHY_SYSTEM_PROMPT;

      if (user) {
        prompt += `\n\n**UTENTE:** ${user.role === 'club' ? `Club: ${user.nome}` : `Sponsor: ${user.ragione_sociale}`}`;
        try {
          const ctx = await getPitchyContext();
          if (ctx) prompt += `\n\n**CONTESTO DAL DATABASE:**\n${ctx}`;
        } catch (e) {}
      }

      const recent = messages.slice(-8);
      if (recent.length) {
        prompt += '\n\n**CONVERSAZIONE:**\n';
        recent.forEach(m => prompt += `${m.sender === 'user' ? 'Utente' : 'Pitchy'}: ${m.text}\n`);
      }
      prompt += `\nUtente: ${text}\n\nPitchy:`;

      const response = await sendMessageToGemini(prompt);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: response, timestamp: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'Mi dispiace, si è verificato un errore. Riprova.', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const userName = isClub ? user?.nome : isSponsor ? user?.ragione_sociale : '';

  return (
    <div className="pitchy-wrapper">
      {/* Messages Area */}
      <div className="pitchy-scroll">
        {messages.length === 0 ? (
          <div className="pitchy-empty">
            <PitchyAvatar size={56} />
            <h2>Ciao{userName ? `, ${userName}` : ''}!</h2>
            <p>Sono Pitchy, il tuo esperto di sponsorizzazioni sportive. Come posso aiutarti?</p>

            <div className="pitchy-chips">
              {suggestions.map((s, i) => (
                <button key={i} className="pitchy-chip" onClick={() => sendMessage(s.text)}>
                  <s.icon style={{ color: s.color }} />
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pitchy-chat">
            {messages.map((msg) => (
              <div key={msg.id} className={`pitchy-row ${msg.sender}`}>
                <div className="pitchy-avatar">
                  {msg.sender === 'bot' ? (
                    <PitchyAvatar size={28} />
                  ) : (
                    <img
                      src={user?.logo_url ? getImageUrl(user.logo_url) : require('../static/logo/FavIcon.png')}
                      alt=""
                      onError={(e) => { e.target.src = require('../static/logo/FavIcon.png'); }}
                    />
                  )}
                </div>
                <div className="pitchy-bubble">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="pitchy-row bot">
                <div className="pitchy-avatar"><PitchyAvatar size={28} /></div>
                <div className="pitchy-bubble pitchy-typing-bubble">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="pitchy-bottom">
        {messages.length > 0 && (
          <button className="pitchy-clear" onClick={() => setMessages([])}>
            <FaRedo /> Nuova conversazione
          </button>
        )}
        <form className="pitchy-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Chiedi qualcosa a Pitchy..."
            disabled={isTyping}
          />
          <button type="submit" disabled={isTyping || !inputMessage.trim()}>
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Pitchy;
