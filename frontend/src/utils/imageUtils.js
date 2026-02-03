// Utility per costruire URL completi delle immagini

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

/**
 * Costruisce l'URL completo per un'immagine
 * @param {string} imageUrl - URL relativo o assoluto dell'immagine
 * @returns {string} - URL completo dell'immagine
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // Se l'URL inizia con http/https, è già completo
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // Altrimenti costruiamo l'URL completo
  // Rimuove /api dall'API_URL e aggiunge il percorso relativo
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}${imageUrl}`;
};

export default getImageUrl;
