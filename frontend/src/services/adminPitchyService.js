import api from './api';

export const getAdminPitchyContext = async (currentPage = '') => {
    try {
        const params = currentPage ? { page: currentPage } : {};
        const response = await api.get('/admin/pitchy/context', { params });
        return response.data.context;
    } catch (error) {
        console.error('Error fetching Admin Pitchy context:', error);
        return null;
    }
};
