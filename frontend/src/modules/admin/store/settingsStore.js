import { create } from 'zustand';
import API from '../../../services/api';

const SETTINGS_CACHE_TTL_MS = 2 * 60 * 1000;
let settingsFetchPromise = null;
let settingsFetchedAt = 0;

const useSettingsStore = create((set, get) => ({
    settings: null,
    isLoading: false,
    error: null,

    fetchSettings: async (force = false) => {
        const hasFreshCache =
            !force &&
            get().settings &&
            (Date.now() - settingsFetchedAt) < SETTINGS_CACHE_TTL_MS;

        if (hasFreshCache) {
            return get().settings;
        }

        if (settingsFetchPromise) {
            return settingsFetchPromise;
        }

        set({ isLoading: true, error: null });

        settingsFetchPromise = (async () => {
            try {
                const { data } = await API.get('/settings');
                settingsFetchedAt = Date.now();
                set({ settings: data, isLoading: false, error: null });
                return data;
            } catch (error) {
                set({
                    error: error.response?.data?.message || error.message,
                    isLoading: false
                });
                throw error;
            } finally {
                settingsFetchPromise = null;
            }
        })();

        return settingsFetchPromise;
    },

    updateSettings: async (payload, requestConfig = {}) => {
        set({ isLoading: true, error: null });

        try {
            const { data } = await API.put('/settings', payload, requestConfig);
            settingsFetchedAt = Date.now();
            set({ settings: data, isLoading: false, error: null });
            return data;
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            throw error;
        }
    }
}));

export default useSettingsStore;
