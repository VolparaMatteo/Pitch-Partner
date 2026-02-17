import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';
const API_BASE_URL = API_URL.replace('/api', ''); // Base URL senza /api

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper per costruire URL completi per le immagini
export const getImageUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath; // già completo (URL assoluto)
  if (relativePath.startsWith('data:')) return relativePath; // data URL (base64)
  if (relativePath.startsWith('blob:')) return relativePath; // blob URL (oggetto locale)
  return `${API_BASE_URL}${relativePath}`; // path relativo, aggiungi base URL
};

// Interceptor per aggiungere token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire errori
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Non fare redirect se siamo in una pagina di login
      const isLoginPage = window.location.pathname.includes('/login') ||
        window.location.pathname === '/';

      if (!isLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
// Auth API (Unified Login)
export const authAPI = {
  unifiedLogin: (email, password, role, roleId) =>
    api.post('/auth/unified-login', { email, password, role, role_id: roleId }),
};

// Admin API
export const adminAPI = {
  login: (email, password) =>
    api.post('/admin/login', { email, password }),

  getClubs: () =>
    api.get('/admin/clubs'),

  getClub: (id) =>
    api.get(`/admin/clubs/${id}`),

  createClub: (data) =>
    api.post('/admin/clubs', data),

  updateClub: (id, data) =>
    api.put(`/admin/clubs/${id}`, data),

  deleteClub: (id) =>
    api.delete(`/admin/clubs/${id}`),

  getPagamenti: (clubId) =>
    api.get(`/admin/clubs/${clubId}/pagamenti`),

  createPagamento: (clubId, data) =>
    api.post(`/admin/clubs/${clubId}/pagamenti`, data),

  getFatture: (clubId) =>
    api.get(`/admin/clubs/${clubId}/fatture`),

  createFattura: (clubId, data) =>
    api.post(`/admin/clubs/${clubId}/fatture`, data),

  globalSearch: (q) =>
    api.get('/admin/search', { params: { q } })
};

// Club API
export const clubAPI = {
  login: (email, password) =>
    api.post('/club/login', { email, password }),

  getProfile: () =>
    api.get('/club/profile'),

  getSponsors: () =>
    api.get('/club/sponsors'),

  getSponsor: (id) =>
    api.get(`/club/sponsors/${id}`),

  createSponsor: (data) =>
    api.post('/club/sponsors', data),

  updateSponsor: (id, data) =>
    api.put(`/club/sponsors/${id}`, data),

  deleteSponsor: (id) =>
    api.delete(`/club/sponsors/${id}`),

  // Sponsor Invitation
  getSponsorInvitation: (sponsorId) =>
    api.get(`/club/sponsors/${sponsorId}/invitation`),

  regenerateSponsorInvitation: (sponsorId) =>
    api.post(`/club/sponsors/${sponsorId}/invitation/regenerate`),

  // Sponsor Proposals
  getSponsorProposals: (sponsorId) =>
    api.get(`/club/sponsors/${sponsorId}/proposals`),

  // Sponsor Assets (inventario allocato)
  getSponsorAssets: (sponsorId) =>
    api.get(`/club/sponsors/${sponsorId}/assets`),

  // Sponsor Contracts
  getSponsorContracts: (sponsorId) =>
    api.get(`/club/sponsors/${sponsorId}/contracts`),

  // Sponsor Drive
  getSponsorDrive: (sponsorId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.contract_id) queryParams.append('contract_id', params.contract_id);
    if (params.categoria) queryParams.append('categoria', params.categoria);
    if (params.search) queryParams.append('search', params.search);
    return api.get(`/club/sponsors/${sponsorId}/drive?${queryParams.toString()}`);
  },

  getSponsorDriveFolders: (sponsorId) =>
    api.get(`/club/sponsors/${sponsorId}/drive/folders`),

  getSponsorDriveStats: (sponsorId) =>
    api.get(`/club/sponsors/${sponsorId}/drive/stats`),

  uploadSponsorDriveFile: (sponsorId, data) =>
    api.post(`/club/sponsors/${sponsorId}/drive`, data),

  updateSponsorDriveFile: (sponsorId, fileId, data) =>
    api.put(`/club/sponsors/${sponsorId}/drive/${fileId}`, data),

  deleteSponsorDriveFile: (sponsorId, fileId) =>
    api.delete(`/club/sponsors/${sponsorId}/drive/${fileId}`),

  // Sponsor Activities
  getSponsorActivities: (sponsorId, params = {}) =>
    api.get(`/club/sponsors/${sponsorId}/activities`, { params }),

  getSponsorActivity: (sponsorId, activityId) =>
    api.get(`/club/sponsors/${sponsorId}/activities/${activityId}`),

  createSponsorActivity: (sponsorId, data) =>
    api.post(`/club/sponsors/${sponsorId}/activities`, data),

  updateSponsorActivity: (sponsorId, activityId, data) =>
    api.put(`/club/sponsors/${sponsorId}/activities/${activityId}`, data),

  deleteSponsorActivity: (sponsorId, activityId) =>
    api.delete(`/club/sponsors/${sponsorId}/activities/${activityId}`),

  completeSponsorActivityFollowup: (sponsorId, activityId) =>
    api.patch(`/club/sponsors/${sponsorId}/activities/${activityId}/complete-followup`),

  getPendingFollowups: () =>
    api.get('/club/activities/pending-followups'),

  // ==================== LEAD API ====================
  // Lista lead
  getLeads: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.fonte) queryParams.append('fonte', params.fonte);
    if (params.priorita) queryParams.append('priorita', params.priorita);
    if (params.include_converted) queryParams.append('include_converted', params.include_converted);
    return api.get(`/club/leads?${queryParams.toString()}`);
  },

  // Singolo lead
  getLead: (id) =>
    api.get(`/club/leads/${id}`),

  // Crea lead
  createLead: (data) =>
    api.post('/club/leads', data),

  // Aggiorna lead
  updateLead: (id, data) =>
    api.put(`/club/leads/${id}`, data),

  // Elimina lead
  deleteLead: (id) =>
    api.delete(`/club/leads/${id}`),

  // Cambia status lead (per Kanban drag & drop)
  changeLeadStatus: (id, status, motivo_perdita = null) =>
    api.patch(`/club/leads/${id}/status`, { status, motivo_perdita }),

  // Converti lead a sponsor
  convertLeadToSponsor: (id, data) =>
    api.post(`/club/leads/${id}/convert`, data),

  // Statistiche lead pipeline
  getLeadStats: () =>
    api.get('/club/leads/stats'),

  // Lead Proposals
  getLeadProposals: (leadId) =>
    api.get(`/club/leads/${leadId}/proposals`),

  // Lead Activities
  getLeadActivities: (leadId) =>
    api.get(`/club/leads/${leadId}/activities`),

  createLeadActivity: (leadId, data) =>
    api.post(`/club/leads/${leadId}/activities`, data),

  deleteLeadActivity: (leadId, activityId) =>
    api.delete(`/club/leads/${leadId}/activities/${activityId}`),

  // Lead Stage History
  getLeadStageHistory: (leadId) =>
    api.get(`/club/leads/${leadId}/stage-history`),

  // Lead Score Config
  getLeadScoreConfig: () =>
    api.get('/club/lead-score-config'),
  updateLeadScoreConfig: (data) =>
    api.put('/club/lead-score-config', data),
  resetLeadScoreConfig: () =>
    api.post('/club/lead-score-config/reset'),

  // Lead Products (Deal Breakdown)
  getLeadProducts: (leadId) =>
    api.get(`/club/leads/${leadId}/products`),
  createLeadProduct: (leadId, data) =>
    api.post(`/club/leads/${leadId}/products`, data),
  updateLeadProduct: (leadId, productId, data) =>
    api.put(`/club/leads/${leadId}/products/${productId}`, data),
  deleteLeadProduct: (leadId, productId) =>
    api.delete(`/club/leads/${leadId}/products/${productId}`),
  getAvailableCatalog: (leadId, q) =>
    api.get(`/club/leads/${leadId}/available-catalog`, { params: { q } }),
  syncLeadProductsValue: (leadId) =>
    api.patch(`/club/leads/${leadId}/products/sync-value`),

  // Lead Proposals
  getLeadProposals: (leadId) =>
    api.get(`/club/proposals`, { params: { lead_id: leadId } }),

  // ==================== PROPOSAL BUILDER ====================
  getProposals: (params) =>
    api.get('/club/proposals', { params }),
  getProposalStats: () =>
    api.get('/club/proposals/stats'),
  getProposal: (id) =>
    api.get(`/club/proposals/${id}`),
  createProposalBuilder: (data) =>
    api.post('/club/proposals', data),
  updateProposal: (id, data) =>
    api.put(`/club/proposals/${id}`, data),
  deleteProposal: (id) =>
    api.delete(`/club/proposals/${id}`),
  sendProposal: (id) =>
    api.post(`/club/proposals/${id}/send`),
  duplicateProposal: (id, data) =>
    api.post(`/club/proposals/${id}/duplicate`, data),
  updateProposalStatus: (id, data) =>
    api.put(`/club/proposals/${id}/status`, data),

  convertProposalToContract: (id, data = {}) =>
    api.post(`/club/proposals/${id}/convert-to-contract`, data),

  // Proposal Items
  getProposalItems: (proposalId) =>
    api.get(`/club/proposals/${proposalId}/items`),
  addProposalItem: (proposalId, data) =>
    api.post(`/club/proposals/${proposalId}/items`, data),
  updateProposalItem: (proposalId, itemId, data) =>
    api.put(`/club/proposals/${proposalId}/items/${itemId}`, data),
  deleteProposalItem: (proposalId, itemId) =>
    api.delete(`/club/proposals/${proposalId}/items/${itemId}`),

  // Proposal Templates
  getProposalTemplates: () =>
    api.get('/club/proposals/templates'),
  createProposalTemplate: (data) =>
    api.post('/club/proposals/templates', data),
  getProposalTemplate: (id) =>
    api.get(`/club/proposals/templates/${id}`),
  updateProposalTemplate: (id, data) =>
    api.put(`/club/proposals/templates/${id}`, data),
  deleteProposalTemplate: (id) =>
    api.delete(`/club/proposals/templates/${id}`),

  // Proposal Available Items
  getAvailableProposalItems: () =>
    api.get('/club/proposals/available-items'),

  // Lead Documents
  getLeadDocuments: (leadId, categoria) =>
    api.get(`/club/leads/${leadId}/documents`, { params: categoria ? { categoria } : {} }),
  createLeadDocument: (leadId, data) =>
    api.post(`/club/leads/${leadId}/documents`, data),
  updateLeadDocument: (leadId, docId, data) =>
    api.put(`/club/leads/${leadId}/documents/${docId}`, data),
  deleteLeadDocument: (leadId, docId) =>
    api.delete(`/club/leads/${leadId}/documents/${docId}`),

  completeLeadFollowup: (leadId, activityId) =>
    api.patch(`/club/leads/${leadId}/activities/${activityId}/complete-followup`),

  // Lead Asset Interests
  getLeadAssetInterests: (leadId) =>
    api.get(`/club/leads/${leadId}/asset-interests`),
  addLeadAssetInterest: (leadId, assetId) =>
    api.post(`/club/leads/${leadId}/asset-interests`, { asset_id: assetId }),
  removeLeadAssetInterest: (leadId, assetId) =>
    api.delete(`/club/leads/${leadId}/asset-interests/${assetId}`),
  setLeadAssetInterests: (leadId, assetIds) =>
    api.put(`/club/leads/${leadId}/asset-interests`, { asset_ids: assetIds }),

  // ==================== CALENDAR API ====================
  getCalendarEvents: (params) => api.get('/club/calendar/events', { params }),
  createCalendarEvent: (data) => api.post('/club/calendar/events', data),
  getCalendarEvent: (id) => api.get(`/club/calendar/events/${id}`),
  updateCalendarEvent: (id, data) => api.put(`/club/calendar/events/${id}`, data),
  deleteCalendarEvent: (id) => api.delete(`/club/calendar/events/${id}`),
  completeCalendarEvent: (id) => api.patch(`/club/calendar/events/${id}/complete`),
  getCalendarAggregate: (params) => api.get('/club/calendar/aggregate', { params }),
  getCalendarStats: () => api.get('/club/calendar/stats'),

  // ==================== CONTACT PERSON API ====================
  // Lead Contacts
  getLeadContacts: (leadId) =>
    api.get(`/club/leads/${leadId}/contacts`),

  createLeadContact: (leadId, data) =>
    api.post(`/club/leads/${leadId}/contacts`, data),

  updateLeadContact: (leadId, contactId, data) =>
    api.put(`/club/leads/${leadId}/contacts/${contactId}`, data),

  deleteLeadContact: (leadId, contactId) =>
    api.delete(`/club/leads/${leadId}/contacts/${contactId}`),

  setLeadPrimaryContact: (leadId, contactId) =>
    api.patch(`/club/leads/${leadId}/contacts/${contactId}/set-primary`),

  // Sponsor Contacts
  getSponsorContacts: (sponsorId) =>
    api.get(`/club/sponsors/${sponsorId}/contacts`),

  createSponsorContact: (sponsorId, data) =>
    api.post(`/club/sponsors/${sponsorId}/contacts`, data),

  updateSponsorContact: (sponsorId, contactId, data) =>
    api.put(`/club/sponsors/${sponsorId}/contacts/${contactId}`, data),

  deleteSponsorContact: (sponsorId, contactId) =>
    api.delete(`/club/sponsors/${sponsorId}/contacts/${contactId}`),

  setSponsorPrimaryContact: (sponsorId, contactId) =>
    api.patch(`/club/sponsors/${sponsorId}/contacts/${contactId}/set-primary`),

  // ==================== NOTE TIMELINE API ====================
  // Lead Notes
  getLeadNotes: (leadId) =>
    api.get(`/club/leads/${leadId}/notes`),

  createLeadNote: (leadId, data) =>
    api.post(`/club/leads/${leadId}/notes`, data),

  updateLeadNote: (leadId, noteId, data) =>
    api.put(`/club/leads/${leadId}/notes/${noteId}`, data),

  deleteLeadNote: (leadId, noteId) =>
    api.delete(`/club/leads/${leadId}/notes/${noteId}`),

  // Sponsor Notes
  getSponsorNotes: (sponsorId) =>
    api.get(`/club/sponsors/${sponsorId}/notes`),

  createSponsorNote: (sponsorId, data) =>
    api.post(`/club/sponsors/${sponsorId}/notes`, data),

  updateSponsorNote: (sponsorId, noteId, data) =>
    api.put(`/club/sponsors/${sponsorId}/notes/${noteId}`, data),

  deleteSponsorNote: (sponsorId, noteId) =>
    api.delete(`/club/sponsors/${sponsorId}/notes/${noteId}`),

  // Tags
  getTags: () =>
    api.get('/club/tags'),

  createTag: (data) =>
    api.post('/club/tags', data),

  updateTag: (tagId, data) =>
    api.put(`/club/tags/${tagId}`, data),

  deleteTag: (tagId) =>
    api.delete(`/club/tags/${tagId}`),

  getLeadTags: (leadId) =>
    api.get(`/club/leads/${leadId}/tags`),

  assignLeadTag: (leadId, tagId) =>
    api.post(`/club/leads/${leadId}/tags`, { tag_id: tagId }),

  removeLeadTag: (leadId, tagId) =>
    api.delete(`/club/leads/${leadId}/tags/${tagId}`),

  // ==================== INVENTORY API ====================
  // Categories
  getInventoryCategories: () =>
    api.get('/club/inventory/categories'),
  createInventoryCategory: (data) =>
    api.post('/club/inventory/categories', data),
  updateInventoryCategory: (id, data) =>
    api.put(`/club/inventory/categories/${id}`, data),
  deleteInventoryCategory: (id) =>
    api.delete(`/club/inventory/categories/${id}`),

  // Assets
  getInventoryAssets: (params) =>
    api.get('/club/inventory/assets', { params }),
  getInventoryAsset: (id) =>
    api.get(`/club/inventory/assets/${id}`),
  createInventoryAsset: (data) =>
    api.post('/club/inventory/assets', data),
  updateInventoryAsset: (id, data) =>
    api.put(`/club/inventory/assets/${id}`, data),
  deleteInventoryAsset: (id) =>
    api.delete(`/club/inventory/assets/${id}`),
  archiveInventoryAsset: (id) =>
    api.post(`/club/inventory/assets/${id}/archive`),
  restoreInventoryAsset: (id) =>
    api.post(`/club/inventory/assets/${id}/restore`),

  // Asset Availability & Pricing
  getAssetAvailability: (assetId) =>
    api.get(`/club/inventory/assets/${assetId}/availability`),
  setAssetAvailability: (assetId, data) =>
    api.post(`/club/inventory/assets/${assetId}/availability`, data),
  getAssetPricingTiers: (assetId) =>
    api.get(`/club/inventory/assets/${assetId}/pricing-tiers`),
  setAssetPricingTiers: (assetId, data) =>
    api.post(`/club/inventory/assets/${assetId}/pricing-tiers`, data),

  // Allocations
  getInventoryAllocations: (params) =>
    api.get('/club/inventory/allocations', { params }),
  createInventoryAllocation: (data) =>
    api.post('/club/inventory/allocations', data),
  updateInventoryAllocation: (id, data) =>
    api.put(`/club/inventory/allocations/${id}`, data),
  deleteInventoryAllocation: (id) =>
    api.delete(`/club/inventory/allocations/${id}`),

  // Packages
  getInventoryPackages: () =>
    api.get('/club/inventory/packages'),
  getInventoryPackage: (id) =>
    api.get(`/club/inventory/packages/${id}`),
  createInventoryPackage: (data) =>
    api.post('/club/inventory/packages', data),
  updateInventoryPackage: (id, data) =>
    api.put(`/club/inventory/packages/${id}`, data),
  deleteInventoryPackage: (id) =>
    api.delete(`/club/inventory/packages/${id}`),

  // Inventory Stats
  getInventoryStats: () =>
    api.get('/club/inventory/stats'),

  // Catalogs
  getCatalogs: () =>
    api.get('/club/catalogs'),
  getCatalog: (id) =>
    api.get(`/club/catalogs/${id}`),
  createCatalog: (data) =>
    api.post('/club/catalogs', data),
  updateCatalog: (id, data) =>
    api.put(`/club/catalogs/${id}`, data),
  deleteCatalog: (id) =>
    api.delete(`/club/catalogs/${id}`),
  duplicateCatalog: (id) =>
    api.post(`/club/catalogs/${id}/duplicate`),
  regenerateCatalogToken: (id) =>
    api.post(`/club/catalogs/${id}/regenerate-token`),
  getCatalogAvailableAssets: () =>
    api.get('/club/catalogs/available-assets'),
  exportCatalogExcel: (id) =>
    api.get(`/club/catalogs/${id}/export/excel`, { responseType: 'blob' }),
  exportCatalogPdf: (id) =>
    api.get(`/club/catalogs/${id}/export/pdf`, { responseType: 'blob' }),

  // Rights (Diritti)
  getRights: (params) =>
    api.get('/club/rights', { params }),
  getRight: (id) =>
    api.get(`/club/rights/${id}`),
  createRight: (data) =>
    api.post('/club/rights', data),
  updateRight: (id, data) =>
    api.put(`/club/rights/${id}`, data),
  deleteRight: (id) =>
    api.delete(`/club/rights/${id}`),
  getRightCategories: () =>
    api.get('/club/rights/categories'),

  // ==================== BRAND SETTINGS ====================
  getBrandSettings: () =>
    api.get('/club/brand-settings'),
  updateBrandSettings: (data) =>
    api.put('/club/brand-settings', data)
};

// Sponsor API
export const sponsorAPI = {
  login: (email, password) =>
    api.post('/sponsor/login', { email, password }),

  getProfile: () =>
    api.get('/sponsor/profile')
};

// Contract API
export const contractAPI = {
  getContracts: () =>
    api.get('/contracts'),

  getContract: (id) =>
    api.get(`/contracts/${id}`),

  createContract: (data) =>
    api.post('/contracts', data),

  updateContract: (id, data) =>
    api.put(`/contracts/${id}`, data),

  deleteContract: (id) =>
    api.delete(`/contracts/${id}`),

  // Contract Inventory Assets
  getContractInventoryAssets: (contractId) =>
    api.get(`/contracts/${contractId}/inventory-assets`),

  addContractInventoryAsset: (contractId, data) =>
    api.post(`/contracts/${contractId}/inventory-assets`, data),

  removeContractInventoryAsset: (contractId, allocationId) =>
    api.delete(`/contracts/${contractId}/inventory-assets/${allocationId}`)
};

// Asset API
export const assetAPI = {
  getAssets: (contractId) =>
    api.get(`/contracts/${contractId}/assets`),

  getAsset: (id) =>
    api.get(`/assets/${id}`),

  createAsset: (contractId, data) =>
    api.post(`/contracts/${contractId}/assets`, data),

  updateAsset: (contractId, assetId, data) =>
    api.put(`/assets/${assetId}`, data),

  deleteAsset: (id) =>
    api.delete(`/assets/${id}`)
};

// Checklist API
export const checklistAPI = {
  getChecklist: (contractId) =>
    api.get(`/contracts/${contractId}/checklists`),

  getChecklists: (contractId) =>
    api.get(`/contracts/${contractId}/checklists`),

  getMyChecklists: () =>
    api.get('/my-checklists'),

  createChecklistItem: (contractId, data) =>
    api.post(`/contracts/${contractId}/checklists`, data),

  updateChecklistItem: (contractId, itemId, data) =>
    api.put(`/checklists/${itemId}`, data),

  deleteChecklistItem: (contractId, itemId) =>
    api.delete(`/checklists/${itemId}`)
};

// Repository API (Documents & Media)
export const repositoryAPI = {
  // Documents (by contract)
  getDocuments: (contractId, categoria) =>
    api.get(`/contracts/${contractId}/documents${categoria ? `?categoria=${categoria}` : ''}`),

  // Documents (by sponsor - for sponsor dashboard)
  getDocumentsBySponsor: (sponsorId, categoria) =>
    api.get(`/sponsors/${sponsorId}/documents${categoria ? `?categoria=${categoria}` : ''}`),

  uploadDocument: (sponsorId, data) =>
    api.post(`/sponsors/${sponsorId}/documents`, data),

  deleteDocument: (id) =>
    api.delete(`/documents/${id}`),

  // Media (by contract)
  getMedia: (contractId, tipo, tags) => {
    let url = `/contracts/${contractId}/media?`;
    if (tipo) url += `tipo=${tipo}&`;
    if (tags) url += `tags=${tags}`;
    return api.get(url);
  },

  // Media (by sponsor - for sponsor dashboard)
  getMediaBySponsor: (sponsorId, tipo, tags) => {
    let url = `/sponsors/${sponsorId}/media?`;
    if (tipo) url += `tipo=${tipo}&`;
    if (tags) url += `tags=${tags}`;
    return api.get(url);
  },

  uploadMedia: (sponsorId, data) =>
    api.post(`/sponsors/${sponsorId}/media`, data),

  deleteMedia: (id) =>
    api.delete(`/media/${id}`)
};

// Upload API
export const uploadAPI = {
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadMedia: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Notification API
export const notificationAPI = {
  getNotifications: (onlyUnread = false, limit = null) => {
    let url = '/notifications?';
    if (onlyUnread) url += 'only_unread=true&';
    if (limit) url += `limit=${limit}`;
    return api.get(url);
  },

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markAsRead: (id) =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/notifications/read-all'),

  deleteNotification: (id) =>
    api.delete(`/notifications/${id}`),

  clearRead: () =>
    api.delete('/notifications/clear-read')
};

// Message API
export const messageAPI = {
  sendMessage: (data) =>
    api.post('/messages', data),

  getConversation: (clubId, sponsorId, contractId = null, contextType = null, contextId = null) => {
    let url = `/messages/${clubId}/${sponsorId}`;
    const params = new URLSearchParams();
    if (contractId) params.append('contract_id', contractId);
    if (contextType) params.append('context_type', contextType);
    if (contextId) params.append('context_id', contextId);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    return api.get(url);
  },

  getConversations: () =>
    api.get('/messages/conversations'),

  getUnreadCount: () =>
    api.get('/messages/unread-count'),

  markAsRead: (id) =>
    api.put(`/messages/${id}/read`),

  deleteMessage: (id) =>
    api.delete(`/messages/${id}`),

  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Sponsor Network API
export const sponsorNetworkAPI = {
  // Directory sponsor
  getProfiles: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.settore) params.append('settore', filters.settore);
    if (filters.dimensione) params.append('dimensione', filters.dimensione);
    if (filters.target_audience) params.append('target_audience', filters.target_audience);
    if (filters.interesse) params.append('interesse', filters.interesse);
    return api.get(`/sponsor-network/profiles?${params.toString()}`);
  },

  getProfileDetail: (profileId) =>
    api.get(`/sponsor-network/profiles/${profileId}`),

  // Gestione proprio profilo
  getMyProfile: () =>
    api.get('/sponsor-network/my-profile'),

  createMyProfile: (data) =>
    api.post('/sponsor-network/my-profile', data),

  updateMyProfile: (data) =>
    api.put('/sponsor-network/my-profile', data)
};

// Sponsor Messages API (S2S messaging)
export const sponsorMessageAPI = {
  getConversations: () =>
    api.get('/sponsor-messages/conversations'),

  getThread: (otherSponsorId) =>
    api.get(`/sponsor-messages/thread/${otherSponsorId}`),

  sendMessage: (data) =>
    api.post('/sponsor-messages/send', data),

  deleteMessage: (messageId) =>
    api.delete(`/sponsor-messages/${messageId}`),

  getUnreadCount: () =>
    api.get('/sponsor-messages/unread-count')
};

// Partnership API
export const partnershipAPI = {
  // Proposte
  getSentProposals: () =>
    api.get('/partnerships/proposals/sent'),

  getReceivedProposals: () =>
    api.get('/partnerships/proposals/received'),

  createProposal: (data) =>
    api.post('/partnerships/proposals', data),

  getProposalDetail: (proposalId) =>
    api.get(`/partnerships/proposals/${proposalId}`),

  acceptProposal: (proposalId, data = {}) =>
    api.post(`/partnerships/proposals/${proposalId}/accept`, data),

  rejectProposal: (proposalId, data = {}) =>
    api.post(`/partnerships/proposals/${proposalId}/reject`, data),

  withdrawProposal: (proposalId) =>
    api.post(`/partnerships/proposals/${proposalId}/withdraw`),

  // Partnership attive
  getPartnerships: () =>
    api.get('/partnerships/'),

  getPartnershipDetail: (partnershipId) =>
    api.get(`/partnerships/${partnershipId}`),

  updatePartnership: (partnershipId, data) =>
    api.put(`/partnerships/${partnershipId}`, data)
};

// Press Area API - Social Feed Unificato
export const pressAPI = {
  // Feed unificato (sia club che sponsor)
  getFeed: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.categoria) params.append('categoria', filters.categoria);
    return api.get(`/press-feed?${params.toString()}`);
  },

  // Dettaglio post
  getPublication: (id) =>
    api.get(`/press-publications/${id}`),

  // Crea post (club o sponsor)
  createPublication: (data) =>
    api.post('/press-publications', data),

  // Modifica post (solo autore)
  updatePublication: (id, data) =>
    api.put(`/press-publications/${id}`, data),

  // Elimina post (autore o club owner)
  deletePublication: (id) =>
    api.delete(`/press-publications/${id}`),

  // Like (toggle)
  toggleLike: (pubId) =>
    api.post(`/press-publications/${pubId}/like`),

  // Commenti
  getComments: (pubId) =>
    api.get(`/press-publications/${pubId}/comments`),

  addComment: (pubId, data) =>
    api.post(`/press-publications/${pubId}/comments`, data),

  deleteComment: (commentId) =>
    api.delete(`/press-comments/${commentId}`),

  // Statistiche
  getStats: () =>
    api.get('/press-stats')
};

// Best Practice Events API
export const bestPracticeAPI = {
  // Admin - CRUD Eventi
  adminGetEvents: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.status) params.append('status', filters.status);
    if (filters.pubblicato !== undefined) params.append('pubblicato', filters.pubblicato);
    return api.get(`/admin/best-practice-events?${params.toString()}`);
  },

  adminGetEvent: (id) =>
    api.get(`/admin/best-practice-events/${id}`),

  adminCreateEvent: (data) =>
    api.post('/admin/best-practice-events', data),

  adminUpdateEvent: (id, data) =>
    api.put(`/admin/best-practice-events/${id}`, data),

  adminDeleteEvent: (id) =>
    api.delete(`/admin/best-practice-events/${id}`),

  // Admin - Gestione Pubblicazione
  publishEvent: (id) =>
    api.post(`/admin/best-practice-events/${id}/publish`),

  unpublishEvent: (id) =>
    api.post(`/admin/best-practice-events/${id}/unpublish`),

  cancelEvent: (id) =>
    api.post(`/admin/best-practice-events/${id}/cancel`),

  // Admin - Registrazioni
  getRegistrations: (eventId) =>
    api.get(`/admin/best-practice-events/${eventId}/registrations`),

  updateRegistrationStatus: (eventId, regId, data) =>
    api.put(`/admin/best-practice-events/${eventId}/registrations/${regId}/status`, data),

  deleteRegistration: (eventId, regId) =>
    api.delete(`/admin/best-practice-events/${eventId}/registrations/${regId}`),

  // Admin - Q&A
  adminGetQuestions: (eventId) =>
    api.get(`/admin/best-practice-events/${eventId}/questions`),

  answerQuestion: (eventId, qId, risposta) =>
    api.post(`/admin/best-practice-events/${eventId}/questions/${qId}/answer`, { risposta }),

  deleteQuestion: (eventId, qId) =>
    api.delete(`/admin/best-practice-events/${eventId}/questions/${qId}`),

  // Admin - Analytics
  getAnalytics: (eventId) =>
    api.get(`/admin/best-practice-events/${eventId}/analytics`),

  getAttendance: (eventId) =>
    api.get(`/admin/best-practice-events/${eventId}/attendance`),

  // Public - Browse Eventi
  getEvents: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.time) params.append('time', filters.time);
    return api.get(`/best-practice-events?${params.toString()}`);
  },

  getEvent: (id) =>
    api.get(`/best-practice-events/${id}`),

  getUpcomingEvents: () =>
    api.get('/best-practice-events/upcoming'),

  getPastEvents: () =>
    api.get('/best-practice-events/past'),

  // Public - Registrazione
  registerToEvent: (eventId) =>
    api.post(`/best-practice-events/${eventId}/register`),

  unregisterFromEvent: (eventId) =>
    api.delete(`/best-practice-events/${eventId}/register`),

  getMyEvents: () =>
    api.get('/my-best-practice-events'),

  markAttendance: (eventId) =>
    api.post(`/best-practice-events/${eventId}/attendance`),

  // Public - Q&A
  getQuestions: (eventId) =>
    api.get(`/best-practice-events/${eventId}/questions`),

  submitQuestion: (eventId, domanda) =>
    api.post(`/best-practice-events/${eventId}/questions`, { domanda }),

  upvoteQuestion: (eventId, qId) =>
    api.post(`/best-practice-events/${eventId}/questions/${qId}/upvote`),

  // Public - Feedback
  submitFeedback: (eventId, data) =>
    api.post(`/best-practice-events/${eventId}/feedback`, data)
};

// Admin Notification API
export const adminNotificationAPI = {
  generate: () =>
    api.post('/admin/notifications/generate'),

  getNotifications: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.tipo) queryParams.append('tipo', params.tipo);
    if (params.priorita) queryParams.append('priorita', params.priorita);
    if (params.letta !== undefined) queryParams.append('letta', params.letta);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    return api.get(`/admin/notifications?${queryParams.toString()}`);
  },

  getSummary: () =>
    api.get('/admin/notifications/summary'),

  markAsRead: (id) =>
    api.put(`/admin/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/admin/notifications/read-all'),

  deleteNotification: (id) =>
    api.delete(`/admin/notifications/${id}`)
};

// Admin Email API
export const adminEmailAPI = {
  getAccounts: () =>
    api.get('/admin/email/accounts'),

  getConversation: (email, refresh = false) =>
    api.get('/admin/email/conversation', { params: { email, refresh } }),

  getUnreadCounts: (refresh = false) =>
    api.get(`/admin/email/unread-counts${refresh ? '?refresh=true' : ''}`),

  getMessages: (key, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.folder) queryParams.append('folder', params.folder);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    if (params.refresh) queryParams.append('refresh', 'true');
    return api.get(`/admin/email/${key}/messages?${queryParams.toString()}`);
  },

  getMessageDetail: (key, uid, folder) => {
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    return api.get(`/admin/email/${key}/messages/${uid}${params}`);
  },

  sendEmail: (key, data) =>
    api.post(`/admin/email/${key}/send`, data),

  markAsRead: (key, uid, folder) => {
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    return api.put(`/admin/email/${key}/messages/${uid}/read${params}`);
  },

  deleteMessage: (key, uid, folder) => {
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    return api.delete(`/admin/email/${key}/messages/${uid}${params}`);
  },

  getAttachmentUrl: (key, uid, filename, folder) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (folder) params.append('folder', folder);
    return `${API_URL}/admin/email/${key}/messages/${uid}/attachment/${encodeURIComponent(filename)}?${params.toString()}`;
  },

  // Email Templates
  getTemplates: (all = false) =>
    api.get(`/admin/email-templates${all ? '?all=true' : ''}`),

  createTemplate: (data) =>
    api.post('/admin/email-templates', data),

  updateTemplate: (id, data) =>
    api.put(`/admin/email-templates/${id}`, data),

  deleteTemplate: (id) =>
    api.delete(`/admin/email-templates/${id}`)
};

// Admin Newsletter API
export const adminNewsletterAPI = {
  getStats: () =>
    api.get('/admin/newsletter/stats'),

  // Groups
  getGroups: () =>
    api.get('/admin/newsletter/groups'),

  createGroup: (data) =>
    api.post('/admin/newsletter/groups', data),

  getGroup: (id) =>
    api.get(`/admin/newsletter/groups/${id}`),

  updateGroup: (id, data) =>
    api.put(`/admin/newsletter/groups/${id}`, data),

  deleteGroup: (id) =>
    api.delete(`/admin/newsletter/groups/${id}`),

  // Recipients
  addRecipients: (groupId, recipients) =>
    api.post(`/admin/newsletter/groups/${groupId}/recipients`, { recipients }),

  getRecipients: (groupId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    return api.get(`/admin/newsletter/groups/${groupId}/recipients?${queryParams.toString()}`);
  },

  removeRecipient: (recipientId) =>
    api.delete(`/admin/newsletter/recipients/${recipientId}`),

  // Campaigns
  getCampaigns: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.status) queryParams.append('status', params.status);
    return api.get(`/admin/newsletter/campaigns?${queryParams.toString()}`);
  },

  createCampaign: (data) =>
    api.post('/admin/newsletter/campaigns', data),

  getCampaign: (id) =>
    api.get(`/admin/newsletter/campaigns/${id}`),

  updateCampaign: (id, data) =>
    api.put(`/admin/newsletter/campaigns/${id}`, data),

  deleteCampaign: (id) =>
    api.delete(`/admin/newsletter/campaigns/${id}`),

  sendCampaign: (id) =>
    api.post(`/admin/newsletter/campaigns/${id}/send`),
};

// Admin WhatsApp API
export const adminWhatsAppAPI = {
  getStatus: () => api.get('/admin/whatsapp/status'),
  getQR: () => api.get('/admin/whatsapp/qr'),
  send: (data) => api.post('/admin/whatsapp/send', data),
  getContacts: () => api.get('/admin/whatsapp/contacts'),
  getChats: (params) => api.get(`/admin/whatsapp/chats${params || ''}`),
  getChatMessages: (chatId) => api.get(`/admin/whatsapp/chats/${chatId}/messages`),
  getMedia: (msgId) => api.get(`/admin/whatsapp/media/${msgId}`),
  disconnect: () => api.post('/admin/whatsapp/disconnect'),
  getDBContacts: () => api.get('/admin/whatsapp/db-contacts'),
  getMessagesByPhone: (phone) => api.get(`/admin/whatsapp/messages-by-phone/${encodeURIComponent(phone)}`),
};

// Admin Workflow / Automation API
export const workflowAPI = {
  getMeta: () => api.get('/admin/workflows/meta'),
  getAll: (params) => api.get('/admin/workflows', { params }),
  getStats: () => api.get('/admin/workflows/stats'),
  getTemplates: () => api.get('/admin/workflows/templates'),
  getById: (id) => api.get(`/admin/workflows/${id}`),
  create: (data) => api.post('/admin/workflows', data),
  update: (id, data) => api.put(`/admin/workflows/${id}`, data),
  delete: (id) => api.delete(`/admin/workflows/${id}`),
  toggle: (id) => api.post(`/admin/workflows/${id}/toggle`),
  test: (id, data) => api.post(`/admin/workflows/${id}/test`, data),
  getExecutions: (id, params) => api.get(`/admin/workflows/${id}/executions`, { params }),
  getExecutionDetail: (execId) => api.get(`/admin/workflows/executions/${execId}`),
  getEnrollments: (id, params) => api.get(`/admin/workflows/${id}/enrollments`, { params }),
  createEnrollment: (id, data) => api.post(`/admin/workflows/${id}/enrollments`, data),
  removeEnrollment: (id, eid) => api.delete(`/admin/workflows/${id}/enrollments/${eid}`),
};

// Admin Document & Contract Template API
export const adminDocumentAPI = {
    // Templates
    getTemplates: (params) => api.get('/admin/document/templates', { params }),
    getTemplate: (id) => api.get(`/admin/document/templates/${id}`),
    createTemplate: (data) => api.post('/admin/document/templates', data),
    updateTemplate: (id, data) => api.put(`/admin/document/templates/${id}`, data),
    deleteTemplate: (id) => api.delete(`/admin/document/templates/${id}`),
    previewTemplate: (id, data) => api.post(`/admin/document/templates/${id}/preview`, data),
    // Documents
    generateDocument: (contractId, data) => api.post(`/admin/contracts/${contractId}/documents/generate`, data),
    getContractDocuments: (contractId) => api.get(`/admin/contracts/${contractId}/documents`),
    getDocument: (id) => api.get(`/admin/documents/${id}`),
    sendDocument: (id, data) => api.post(`/admin/documents/${id}/send`, data),
    revokeDocument: (id) => api.post(`/admin/documents/${id}/revoke`),
    getDocumentTracking: (id) => api.get(`/admin/documents/${id}/tracking`),
};

// Admin Credential Vault API
export const adminCredentialAPI = {
    getAll: (params) => api.get('/admin/credentials', { params }),
    create: (data) => api.post('/admin/credentials', data),
    update: (id, data) => api.put(`/admin/credentials/${id}`, data),
    delete: (id) => api.delete(`/admin/credentials/${id}`),
    revealPassword: (id) => api.post(`/admin/credentials/${id}/reveal`),
};

// Public Catalog API (no auth required)
export const publicAPI = {
  getCatalog: (token) =>
    api.get(`/club/public/catalog/${token}`)
};

export default api;
