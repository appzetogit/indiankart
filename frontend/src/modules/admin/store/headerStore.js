import { create } from 'zustand';
import API from '../../../services/api';

const HEADER_CACHE_TTL_MS = 5 * 60 * 1000;

export const useHeaderStore = create((set, get) => ({
    headerCategories: [], // Array of populated Category objects
    isLoading: false,
    fetchedAt: 0,

    fetchHeaderConfig: async (options = {}) => {
        const { force = false } = options;
        const { headerCategories, fetchedAt, isLoading } = get();
        const hasFreshCache =
            headerCategories.length > 0 &&
            fetchedAt > 0 &&
            (Date.now() - fetchedAt) < HEADER_CACHE_TTL_MS;

        if (!force && (isLoading || hasFreshCache)) {
            return headerCategories;
        }

        set({ isLoading: true });
        try {
            const { data } = await API.get('/header');
            const categories = data.categories || [];
            set({ headerCategories: categories, isLoading: false, fetchedAt: Date.now() });
            return categories;
        } catch (error) {
            console.error("Failed to fetch header config:", error);
            set({ isLoading: false });
            return [];
        }
    },

    updateHeaderConfig: async (categoryIds) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put('/header', { categories: categoryIds });
            set({ headerCategories: data.categories || [], isLoading: false, fetchedAt: Date.now() });
            return data;
        } catch (error) {
            console.error("Failed to update header config:", error);
            set({ isLoading: false });
            throw error;
        }
    }
}));
