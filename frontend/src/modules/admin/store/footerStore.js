import { create } from 'zustand';
import API from '../../../services/api';

export const useFooterStore = create((set, get) => ({
    footerConfig: null,
    isLoading: false,

    fetchFooterConfig: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/footer');
            set({ footerConfig: data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch footer config:', error);
            set({ isLoading: false });
        }
    },

    updateFooterConfig: async (configData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/footer', configData);
            set({ footerConfig: data, isLoading: false });
            return data;
        } catch (error) {
            console.error('Failed to update footer config:', error);
            set({ isLoading: false });
            throw error;
        }
    }
}));
