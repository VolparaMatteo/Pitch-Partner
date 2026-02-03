import api from './api';

export const getPitchyContext = async () => {
    try {
        const response = await api.get('/pitchy/context');
        return response.data.context;
    } catch (error) {
        console.error('Error fetching Pitchy context:', error);
        return null;
    }
};
