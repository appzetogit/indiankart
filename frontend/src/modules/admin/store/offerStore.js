import { create } from 'zustand';
import API from '../../../services/api';

const useOfferStore = create((set, get) => ({
    offers: [],
    currentOffer: null,
    isLoading: false,
    error: null,

    // Fetch all offers
    fetchOffers: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams();
            if (filters.isActive !==undefined) params.append('isActive', filters.isActive);
            if (filters.applicableTo) params.append('applicableTo', filters.applicableTo);

            const { data } = await API.get(`/offers?${params.toString()}`);
            set({ offers: data, isLoading: false });
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to fetch offers', 
                isLoading: false 
            });
        }
    },

    // Fetch single offer
    fetchOfferById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await API.get(`/offers/${id}`);
            set({ currentOffer: data, isLoading: false });
            return data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to fetch offer', 
                isLoading: false 
            });
            throw error;
        }
    },

    // Create new offer
    createOffer: async (offerData) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await API.post('/offers', offerData);
            set((state) => ({ 
                offers: [data, ...state.offers], 
                isLoading: false 
            }));
            return data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create offer';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },

    // Update offer
    updateOffer: async (id, offerData) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await API.put(`/offers/${id}`, offerData);
            set((state) => ({
                offers: state.offers.map((o) => (o._id === id ? data : o)),
                currentOffer: data,
                isLoading: false
            }));
            return data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to update offer';
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
        }
    },

    // Delete offer
    deleteOffer: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await API.delete(`/offers/${id}`);
            set((state) => ({
                offers: state.offers.filter((o) => o._id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to delete offer', 
                isLoading: false 
            });
            throw error;
        }
    },

    // Toggle offer status
    toggleOfferStatus: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await API.put(`/offers/${id}/toggle`);
            set((state) => ({
                offers: state.offers.map((o) => (o._id === id ? data : o)),
                isLoading: false
            }));
            return data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to toggle offer status', 
                isLoading: false 
            });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Clear current offer
    clearCurrentOffer: () => set({ currentOffer: null })
}));

export default useOfferStore;
