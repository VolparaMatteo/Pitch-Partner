import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes, FaPaperPlane, FaTrash } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import PitchyAvatar from './PitchyAvatar';
import { sendMessageToGemini } from '../services/gemini';
import { getAdminPitchyContext } from '../services/adminPitchyService';
import '../styles/admin-pitchy.css';

const STORAGE_KEY = 'admin_pitchy_messages';

const SYSTEM_PROMPT = `Sei Pitchy Admin, l'assistente AI per il pannello amministrativo di Pitch Partner.
- Ruolo: Assistente strategico per gestione CRM e business development
- Competenze: Pipeline CRM, lead scoring, analisi finanziaria, email drafting, task prioritization, contratti, newsletter
- Rispondi SEMPRE in italiano, usa markdown, sii conciso e actionable
- Quando ricevi dati di contesto, usali per dare risposte specifiche e personalizzate
- Non inventare dati: se non hai informazioni sufficienti, dillo`;

const PAGE_SUGGESTIONS = {
    '/admin/dashboard': [
        'Analizza le metriche principali',
        'Lead che richiedono attenzione',
        'Riepilogo finanziario del mese',
        'Prioritizza i task della giornata'
    ],
    '/admin/leads': [
        'Analizza la pipeline attuale',
        'Next action per i lead caldi',
        'Lead a rischio di abbandono',
        'Bozza email di follow-up'
    ],
    '/admin/finanze': [
        'Analisi fatture scadute',
        'Previsione cash flow mensile',
        'Confronto MRR mese su mese'
    ],
    '/admin/tasks': [
        'Prioritizza i task aperti',
        'Task scaduti da gestire',
        'Organizza la giornata di lavoro'
    ],
    '/admin/email': [
        'Bozza email di follow-up',
        'Template proposta commerciale',
        'Rispondi a una richiesta demo'
    ],
    '/admin/calendario': [
        'Agenda di oggi',
        'Brief per la prossima demo'
    ],
    default: [
        'Analizza la pipeline',
        'Next action per i lead caldi',
        'Bozza email follow-up',
        'Prioritizza i task aperti'
    ]
};

function getPageLabel(pathname) {
    const map = {
        '/admin/dashboard': 'Dashboard',
        '/admin/leads': 'Lead',
        '/admin/clubs': 'Club',
        '/admin/contratti': 'Contratti',
        '/admin/finanze': 'Finanze',
        '/admin/tasks': 'Task',
        '/admin/email': 'Email',
        '/admin/newsletter': 'Newsletter',
        '/admin/calendario': 'Calendario',
        '/admin/workflows': 'Workflow'
    };
    for (const [path, label] of Object.entries(map)) {
        if (pathname.startsWith(path)) return label;
    }
    return 'Admin';
}

function getSuggestions(pathname) {
    for (const [path, suggestions] of Object.entries(PAGE_SUGGESTIONS)) {
        if (path !== 'default' && pathname.startsWith(path)) return suggestions;
    }
    return PAGE_SUGGESTIONS.default;
}

export default function AdminPitchyWidget() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [context, setContext] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const currentPage = location.pathname;
    const pageLabel = getPageLabel(currentPage);
    const suggestions = getSuggestions(currentPage);

    // Persist messages to sessionStorage
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Fetch context when page changes or panel opens
    useEffect(() => {
        if (isOpen) {
            getAdminPitchyContext(currentPage).then(ctx => {
                if (ctx) setContext(ctx);
            });
        }
    }, [isOpen, currentPage]);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || isLoading) return;

        const userMsg = { role: 'user', content: text.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Build prompt with context
            let prompt = SYSTEM_PROMPT + '\n\n';
            prompt += `Pagina corrente: ${pageLabel} (${currentPage})\n\n`;

            if (context) {
                prompt += `CONTESTO ADMIN:\n${context}\n\n`;
            }

            // Include last 8 messages for conversation history
            const recentMessages = [...messages.slice(-8), userMsg];
            prompt += 'CONVERSAZIONE:\n';
            for (const msg of recentMessages) {
                const role = msg.role === 'user' ? 'Utente' : 'Pitchy';
                prompt += `${role}: ${msg.content}\n`;
            }
            prompt += '\nPitchy:';

            const response = await sendMessageToGemini(prompt);
            setMessages(prev => [...prev, { role: 'bot', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: 'Mi scuso, si e verificato un errore. Riprova tra qualche momento.'
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, context, messages, pageLabel, currentPage]);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleClear = () => {
        setMessages([]);
        sessionStorage.removeItem(STORAGE_KEY);
    };

    const handleChip = (text) => {
        sendMessage(text);
    };

    return (
        <>
            {/* FAB */}
            <button
                className={`ap-fab ${isOpen ? 'ap-fab--open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Pitchy Admin"
            >
                {isOpen ? (
                    <FaTimes className="ap-fab-close" />
                ) : (
                    <PitchyAvatar size={38} />
                )}
            </button>

            {/* Overlay */}
            {isOpen && <div className="ap-overlay" onClick={() => setIsOpen(false)} />}

            {/* Chat Panel */}
            {isOpen && (
                <div className="ap-panel">
                    {/* Header */}
                    <div className="ap-header">
                        <PitchyAvatar size={36} />
                        <div className="ap-header-info">
                            <p className="ap-header-title">Pitchy Admin</p>
                            <p className="ap-header-page">{pageLabel}</p>
                        </div>
                        <button className="ap-header-close" onClick={() => setIsOpen(false)}>
                            <FaTimes />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="ap-messages">
                        {messages.length === 0 && !isLoading ? (
                            <div className="ap-empty">
                                <div className="ap-empty-avatar">
                                    <PitchyAvatar size={120} />
                                </div>
                                <p className="ap-empty-title">Ciao! Sono Pitchy Admin</p>
                                <p className="ap-empty-subtitle">
                                    Il tuo assistente per il pannello di controllo.
                                    Chiedimi quello che vuoi!
                                </p>
                                <div className="ap-chips">
                                    {suggestions.map((s, i) => (
                                        <button key={i} className="ap-chip" onClick={() => handleChip(s)}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, i) => (
                                    <div key={i} className={`ap-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
                                        <div className="ap-bubble">
                                            {msg.role === 'bot' ? (
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="ap-row bot">
                                        <div className="ap-typing">
                                            <span className="ap-typing-dot" />
                                            <span className="ap-typing-dot" />
                                            <span className="ap-typing-dot" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input area */}
                    <div className="ap-input-area">
                        {messages.length > 0 && (
                            <button className="ap-clear" onClick={handleClear}>
                                <FaTrash size={10} style={{ marginRight: 6 }} />
                                Nuova chat
                            </button>
                        )}
                        <form className="ap-form" onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Scrivi un messaggio..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={!input.trim() || isLoading}>
                                <FaPaperPlane size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
