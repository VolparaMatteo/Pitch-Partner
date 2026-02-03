import axios from 'axios';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

/**
 * Invia un messaggio a Gemini e riceve una risposta
 * @param {string} prompt - Il prompt completo da inviare (include system prompt e contesto)
 * @returns {Promise<string>} - La risposta di Gemini
 */
export const sendMessageToGemini = async (prompt) => {
  try {
    console.log('🤖 Pitchy - Invio richiesta a Gemini...');
    console.log('API URL:', GEMINI_API_URL);
    console.log('API Key presente:', !!GEMINI_API_KEY);

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('✅ Risposta ricevuta da Gemini');

    // Estrai il testo dalla risposta
    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('❌ Nessun testo nella risposta:', response.data);
      throw new Error('Nessuna risposta valida da Gemini');
    }

    console.log('✅ Testo estratto con successo');
    return generatedText;
  } catch (error) {
    console.error('❌ Errore nella chiamata a Gemini:', error);

    if (error.response) {
      console.error('📄 Dettagli risposta errore:', error.response.data);
      console.error('📄 Status:', error.response.status);
    }

    if (error.message) {
      console.error('💬 Messaggio errore:', error.message);
    }

    throw new Error('Errore nella comunicazione con Pitchy. Riprova.');
  }
};

/**
 * Invia un messaggio a Gemini con un system prompt personalizzato
 * @param {string} systemPrompt - Il prompt di sistema che definisce il comportamento
 * @param {string} userMessage - Il messaggio dell'utente
 * @returns {Promise<string>} - La risposta di Gemini
 */
export const sendMessageWithSystemPrompt = async (systemPrompt, userMessage) => {
  try {
    const fullPrompt = `${systemPrompt}\n\nUtente: ${userMessage}`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('Nessuna risposta valida da Gemini');
    }

    return generatedText;
  } catch (error) {
    console.error('Errore nella chiamata a Gemini:', error);
    throw new Error('Errore nella comunicazione con Pitchy. Riprova.');
  }
};
