const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');

const app = express();
const PORT = 3200;

app.use(cors({ origin: /localhost/ }));
app.use(express.json({ limit: '20mb' }));

// --- State ---
let qrDataUri = null;
let isConnected = false;
let clientInfo = null;

// Chat cache — populated in background, served instantly
let cachedChats = [];
let chatsSyncing = false;
let chatsSyncedAt = null;

// Message store — keeps original Message objects for downloadMedia()
const messageStore = new Map();
const MESSAGE_STORE_MAX = 2000;

// --- WhatsApp Client ---
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ]
  }
});

client.on('qr', async (qr) => {
  console.log('[WA] QR code received');
  try {
    qrDataUri = await QRCode.toDataURL(qr, { width: 300 });
  } catch (err) {
    console.error('[WA] QR generation error:', err);
  }
});

client.on('ready', () => {
  console.log('[WA] Client ready!');
  isConnected = true;
  qrDataUri = null;
  clientInfo = {
    pushname: client.info?.pushname || '',
    wid: client.info?.wid?._serialized || '',
    platform: client.info?.platform || ''
  };
  // Start background chat sync
  syncChatsBackground();
});

client.on('authenticated', () => {
  console.log('[WA] Authenticated');
});

client.on('auth_failure', (msg) => {
  console.error('[WA] Auth failure:', msg);
  isConnected = false;
  clientInfo = null;
});

client.on('message', (msg) => {
  messageStore.set(msg.id._serialized, msg);
  _pruneMessageStore();
});

client.on('message_create', (msg) => {
  messageStore.set(msg.id._serialized, msg);
  _pruneMessageStore();
});

client.on('disconnected', (reason) => {
  console.log('[WA] Disconnected:', reason);
  isConnected = false;
  clientInfo = null;
  qrDataUri = null;
  cachedChats = [];
  chatsSyncedAt = null;
  messageStore.clear();
});

function _pruneMessageStore() {
  if (messageStore.size > MESSAGE_STORE_MAX) {
    const keysToDelete = [...messageStore.keys()].slice(0, messageStore.size - MESSAGE_STORE_MAX);
    keysToDelete.forEach(k => messageStore.delete(k));
  }
}

// Initialize client
console.log('[WA] Initializing client...');
client.initialize().catch(err => {
  console.error('[WA] Initialization error:', err);
});

// --- Background chat sync ---
async function syncChatsBackground() {
  if (chatsSyncing || !isConnected) return;
  chatsSyncing = true;
  console.log('[WA] Syncing chats in background...');
  try {
    const chats = await client.getChats();
    cachedChats = chats.slice(0, 50).map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      lastMessage: chat.lastMessage ? {
        body: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp,
        fromMe: chat.lastMessage.fromMe
      } : null,
      timestamp: chat.timestamp
    }));
    chatsSyncedAt = Date.now();
    console.log(`[WA] Synced ${cachedChats.length} chats`);
  } catch (err) {
    console.error('[WA] Chat sync error:', err.message);
  }
  chatsSyncing = false;
}

// Re-sync chats every 60 seconds
setInterval(() => {
  if (isConnected) syncChatsBackground();
}, 60000);

// --- Helpers ---

function normalizePhone(phone) {
  if (!phone) return '';
  // Remove +, spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  // If starts with 0 and is Italian mobile (3xx...), prepend 39
  if (/^3\d{8,9}$/.test(cleaned)) {
    cleaned = '39' + cleaned;
  }
  return cleaned;
}

// --- Routes ---

// GET /status
app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    info: clientInfo
  });
});

// GET /qr
app.get('/qr', (req, res) => {
  res.json({
    qr: isConnected ? null : qrDataUri
  });
});

// POST /send
app.post('/send', async (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: 'WhatsApp non connesso' });
  }

  const { to, message, media } = req.body;
  if (!to || (!message && !media)) {
    return res.status(400).json({ error: 'Parametri "to" e "message" (o "media") obbligatori' });
  }

  try {
    let chatId = to;
    if (!chatId.includes('@')) {
      chatId = chatId.replace(/[^\d]/g, '');
      chatId = chatId + '@c.us';
    }

    let result;
    if (media && media.data && media.mimetype) {
      const attachment = new MessageMedia(media.mimetype, media.data, media.filename || undefined);
      result = await client.sendMessage(chatId, attachment, { caption: message || '' });
    } else {
      result = await client.sendMessage(chatId, message);
    }
    // Trigger background refresh after sending
    setTimeout(() => syncChatsBackground(), 2000);
    res.json({
      success: true,
      messageId: result.id._serialized,
      to: chatId
    });
  } catch (err) {
    console.error('[WA] Send error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /chats — serves from cache, never blocks
app.get('/chats', (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: 'WhatsApp non connesso' });
  }

  // If force refresh requested and not already syncing, trigger background sync
  if (req.query.refresh === 'true') {
    syncChatsBackground();
  }

  res.json({
    chats: cachedChats,
    syncing: chatsSyncing,
    syncedAt: chatsSyncedAt
  });
});

// GET /chats/:chatId/messages
app.get('/chats/:chatId/messages', async (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: 'WhatsApp non connesso' });
  }

  try {
    const chatId = req.params.chatId;
    const chat = await client.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit: 50 });
    const msgList = messages.map(m => {
      // Store original message object for later downloadMedia()
      messageStore.set(m.id._serialized, m);
      return {
        id: m.id._serialized,
        body: m.body,
        timestamp: m.timestamp,
        fromMe: m.fromMe,
        from: m.from,
        to: m.to,
        type: m.type,
        hasMedia: m.hasMedia,
        mediaType: m.hasMedia ? m.type : null
      };
    });
    _pruneMessageStore();
    res.json({ messages: msgList });
  } catch (err) {
    console.error('[WA] Chat messages error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /media/:msgId — download media from a message
app.get('/media/:msgId', async (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: 'WhatsApp non connesso' });
  }

  try {
    const msgId = req.params.msgId;
    const msg = messageStore.get(msgId);
    if (!msg) {
      return res.status(404).json({ error: 'Messaggio non trovato nella cache' });
    }
    if (!msg.hasMedia) {
      return res.status(400).json({ error: 'Il messaggio non contiene media' });
    }
    const media = await msg.downloadMedia();
    if (!media) {
      return res.status(404).json({ error: 'Media non disponibile' });
    }
    res.json({
      data: media.data,
      mimetype: media.mimetype,
      filename: media.filename || null
    });
  } catch (err) {
    console.error('[WA] Media download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /messages-by-phone/:phone
app.get('/messages-by-phone/:phone', async (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: 'WhatsApp non connesso' });
  }

  try {
    const normalized = normalizePhone(req.params.phone);
    if (!normalized) {
      return res.status(400).json({ error: 'Numero di telefono non valido' });
    }

    // Search in cached chats first, then fall back to full chat list
    let targetChat = null;
    const chatIdSuffix = normalized + '@c.us';

    // Try cached chats
    const cachedMatch = cachedChats.find(c => c.id === chatIdSuffix);
    if (cachedMatch) {
      try {
        targetChat = await client.getChatById(cachedMatch.id);
      } catch (e) {
        // Chat not found by ID, will try getChats below
      }
    }

    // If not in cache, search through all chats
    if (!targetChat) {
      try {
        targetChat = await client.getChatById(chatIdSuffix);
      } catch (e) {
        // Chat doesn't exist with this ID
      }
    }

    if (!targetChat) {
      return res.json({ found: false, chatId: null, chatName: null, messages: [] });
    }

    const messages = await targetChat.fetchMessages({ limit: 50 });
    const msgList = messages.map(m => {
      messageStore.set(m.id._serialized, m);
      return {
        id: m.id._serialized,
        body: m.body,
        timestamp: m.timestamp,
        fromMe: m.fromMe,
        from: m.from,
        to: m.to,
        type: m.type,
        hasMedia: m.hasMedia,
        mediaType: m.hasMedia ? m.type : null
      };
    });
    _pruneMessageStore();

    res.json({
      found: true,
      chatId: targetChat.id._serialized,
      chatName: targetChat.name || targetChat.id._serialized,
      messages: msgList
    });
  } catch (err) {
    console.error('[WA] Messages by phone error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /search?q=...  — search cached chats by name and last message
app.get('/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) {
    return res.json({ results: [] });
  }

  const results = [];

  for (const chat of cachedChats) {
    const nameMatch = chat.name && chat.name.toLowerCase().includes(q);
    const msgMatch = chat.lastMessage && chat.lastMessage.body &&
                     chat.lastMessage.body.toLowerCase().includes(q);

    if (nameMatch || msgMatch) {
      let subtitle = '';
      if (msgMatch && chat.lastMessage) {
        const body = chat.lastMessage.body;
        subtitle = body.length > 80 ? body.substring(0, 80) + '...' : body;
      } else {
        subtitle = chat.lastMessage ? chat.lastMessage.body || '' : '';
        if (subtitle.length > 80) subtitle = subtitle.substring(0, 80) + '...';
      }

      results.push({
        chatId: chat.id,
        title: chat.name || chat.id,
        subtitle: subtitle,
        isGroup: chat.isGroup
      });
    }

    if (results.length >= 10) break;
  }

  res.json({ results });
});

// POST /disconnect
app.post('/disconnect', async (req, res) => {
  try {
    await client.logout();
    isConnected = false;
    clientInfo = null;
    qrDataUri = null;
    cachedChats = [];
    chatsSyncedAt = null;
    res.json({ success: true, message: 'Disconnesso' });
  } catch (err) {
    console.error('[WA] Disconnect error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`[WA] WhatsApp service running on port ${PORT}`);
});
