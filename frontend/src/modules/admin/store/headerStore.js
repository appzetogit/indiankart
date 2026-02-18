import { create } from 'zustand';
import API from '../../../services/api';

export const useHeaderStore = create((set, get) => ({
    headerCategories: [], // Array of populated Category objects
    isLoading: false,

    fetchHeaderConfig: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/header');
            set({ headerCategories: data.categories || [], isLoading: false });
        } catch (error) {
            console.error("Failed to fetch header config:", error);
            set({ isLoading: false });
        }
    },

    updateHeaderConfig: async (categoryIds) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put('/header', { categories: categoryIds });
            set({ headerCategories: data.categories || [], isLoading: false });
            return data;
        } catch (error) {
            console.error("Failed to update header config:", error);
            set({ isLoading: false });
            throw error;
        }
    }
}));
