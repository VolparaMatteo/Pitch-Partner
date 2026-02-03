import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================
// ADMIN - CATEGORIES
// ============================================

export const adminCategoryAPI = {
  getCategories: () =>
    axios.get(`${API_URL}/admin/resources/categories`, { headers: getAuthHeader() }),

  createCategory: (data) =>
    axios.post(`${API_URL}/admin/resources/categories`, data, { headers: getAuthHeader() }),

  updateCategory: (id, data) =>
    axios.put(`${API_URL}/admin/resources/categories/${id}`, data, { headers: getAuthHeader() }),

  deleteCategory: (id) =>
    axios.delete(`${API_URL}/admin/resources/categories/${id}`, { headers: getAuthHeader() })
};

// ============================================
// ADMIN - RESOURCES
// ============================================

export const adminResourceAPI = {
  getResources: (params) =>
    axios.get(`${API_URL}/admin/resources`, { headers: getAuthHeader(), params }),

  getResourceDetail: (id) =>
    axios.get(`${API_URL}/admin/resources/${id}`, { headers: getAuthHeader() }),

  createResource: (data) =>
    axios.post(`${API_URL}/admin/resources`, data, { headers: getAuthHeader() }),

  updateResource: (id, data) =>
    axios.put(`${API_URL}/admin/resources/${id}`, data, { headers: getAuthHeader() }),

  deleteResource: (id) =>
    axios.delete(`${API_URL}/admin/resources/${id}`, { headers: getAuthHeader() }),

  getAnalyticsOverview: () =>
    axios.get(`${API_URL}/admin/resources/analytics/overview`, { headers: getAuthHeader() }),

  getResourceAnalytics: (id) =>
    axios.get(`${API_URL}/admin/resources/${id}/analytics`, { headers: getAuthHeader() })
};

// ============================================
// ADMIN - REVIEWS MODERATION
// ============================================

export const adminReviewAPI = {
  getReviews: (params) =>
    axios.get(`${API_URL}/admin/resources/reviews`, { headers: getAuthHeader(), params }),

  approveReview: (id) =>
    axios.post(`${API_URL}/admin/resources/reviews/${id}/approve`, {}, { headers: getAuthHeader() }),

  rejectReview: (id, data) =>
    axios.post(`${API_URL}/admin/resources/reviews/${id}/reject`, data, { headers: getAuthHeader() }),

  deleteReview: (id) =>
    axios.delete(`${API_URL}/admin/resources/reviews/${id}`, { headers: getAuthHeader() })
};

// ============================================
// PUBLIC - CATEGORIES
// ============================================

export const categoryAPI = {
  getCategories: () =>
    axios.get(`${API_URL}/resources/categories`)
};

// ============================================
// PUBLIC - RESOURCES
// ============================================

export const resourceAPI = {
  browseResources: (params) =>
    axios.get(`${API_URL}/resources`, { headers: getAuthHeader(), params }),

  getResourceDetail: (id) =>
    axios.get(`${API_URL}/resources/${id}`, { headers: getAuthHeader() }),

  downloadResource: (id) =>
    axios.post(`${API_URL}/resources/${id}/download`, {}, { headers: getAuthHeader() })
};

// ============================================
// PUBLIC - BOOKMARKS
// ============================================

export const bookmarkAPI = {
  bookmarkResource: (resourceId, data) =>
    axios.post(`${API_URL}/resources/${resourceId}/bookmark`, data, { headers: getAuthHeader() }),

  unbookmarkResource: (resourceId) =>
    axios.delete(`${API_URL}/resources/${resourceId}/unbookmark`, { headers: getAuthHeader() }),

  getMyBookmarks: (params) =>
    axios.get(`${API_URL}/resources/my-bookmarks`, { headers: getAuthHeader(), params })
};

// ============================================
// PUBLIC - COLLECTIONS
// ============================================

export const collectionAPI = {
  getCollections: () =>
    axios.get(`${API_URL}/resources/collections`, { headers: getAuthHeader() }),

  createCollection: (data) =>
    axios.post(`${API_URL}/resources/collections`, data, { headers: getAuthHeader() }),

  updateCollection: (id, data) =>
    axios.put(`${API_URL}/resources/collections/${id}`, data, { headers: getAuthHeader() }),

  deleteCollection: (id) =>
    axios.delete(`${API_URL}/resources/collections/${id}`, { headers: getAuthHeader() })
};

// ============================================
// PUBLIC - REVIEWS
// ============================================

export const reviewAPI = {
  createReview: (resourceId, data) =>
    axios.post(`${API_URL}/resources/${resourceId}/reviews`, data, { headers: getAuthHeader() }),

  updateReview: (reviewId, data) =>
    axios.put(`${API_URL}/resources/reviews/${reviewId}`, data, { headers: getAuthHeader() }),

  deleteReview: (reviewId) =>
    axios.delete(`${API_URL}/resources/reviews/${reviewId}`, { headers: getAuthHeader() }),

  markHelpful: (reviewId) =>
    axios.post(`${API_URL}/resources/reviews/${reviewId}/helpful`, {}, { headers: getAuthHeader() })
};

// ============================================
// PUBLIC - MY ACTIVITY
// ============================================

export const activityAPI = {
  getMyActivity: () =>
    axios.get(`${API_URL}/resources/my-activity`, { headers: getAuthHeader() })
};
