/**
 * Automation API - Client per gestione automazioni
 */
import api from './api';

export const automationAPI = {
  // ==================== AUTOMATIONS CRUD ====================

  /**
   * Lista automazioni del club
   */
  getAutomations: () => api.get('/club/automations'),

  /**
   * Dettaglio automazione
   */
  getAutomation: (id) => api.get(`/club/automations/${id}`),

  /**
   * Crea nuova automazione
   */
  createAutomation: (data) => api.post('/club/automations', data),

  /**
   * Modifica automazione
   */
  updateAutomation: (id, data) => api.put(`/club/automations/${id}`, data),

  /**
   * Elimina automazione
   */
  deleteAutomation: (id) => api.delete(`/club/automations/${id}`),

  /**
   * Toggle abilita/disabilita
   */
  toggleAutomation: (id) => api.post(`/club/automations/${id}/toggle`),

  /**
   * Test manuale automazione
   */
  testAutomation: (id) => api.post(`/club/automations/${id}/test`),

  // ==================== EXECUTIONS ====================

  /**
   * Lista esecuzioni di un'automazione
   */
  getExecutions: (id, params = {}) => api.get(`/club/automations/${id}/executions`, { params }),

  // ==================== METADATA ====================

  /**
   * Lista tipi di trigger disponibili
   */
  getTriggerTypes: () => api.get('/club/automations/triggers'),

  /**
   * Lista tipi di azioni disponibili
   */
  getActionTypes: () => api.get('/club/automations/actions'),

  /**
   * Lista variabili disponibili
   */
  getVariables: () => api.get('/club/automations/variables'),

  // ==================== EMAIL TEMPLATES ====================

  /**
   * Lista template email
   */
  getEmailTemplates: () => api.get('/club/email-templates'),

  /**
   * Crea template email
   */
  createEmailTemplate: (data) => api.post('/club/email-templates', data),

  /**
   * Modifica template email
   */
  updateEmailTemplate: (id, data) => api.put(`/club/email-templates/${id}`, data),

  /**
   * Elimina template email
   */
  deleteEmailTemplate: (id) => api.delete(`/club/email-templates/${id}`),

  // ==================== SMTP CONFIG ====================

  /**
   * Recupera configurazione SMTP
   */
  getSMTPConfig: () => api.get('/club/smtp-config'),

  /**
   * Salva configurazione SMTP
   */
  saveSMTPConfig: (data) => api.post('/club/smtp-config', data),

  /**
   * Test connessione SMTP
   */
  testSMTPConfig: () => api.post('/club/smtp-config/test')
};

export default automationAPI;
