import { create } from 'zustand';
import API from '../../../services/api';
import toast from 'react-hot-toast';

const useBankOfferStore = create((set) => ({
    offers: [],
    isLoading: false,

    fetchOffers: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/bank-offers');
            set({ offers: data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            console.error(error);
            // toast.error('Failed to load bank offers');
        }
    },

    createOffer: async (offerData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/bank-offers', offerData);
            set(state => ({
                offers: [data, ...state.offers],
                isLoading: false
            }));
            toast.success('Bank Offer created');
            return true;
        } catch (error) {
            set({ isLoading: false });
            toast.error(error.response?.data?.message || 'Failed to create offer');
            return false;
        }
    },

    deleteOffer: async (id) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;
        try {
            await API.delete(`/bank-offers/${id}`);
            set(state => ({
                offers: state.offers.filter(o => o._id !== id)
            }));
            toast.success('Offer deleted');
        } catch (error) {
            toast.error('Failed to delete offer');
        }
    },

    toggleOfferStatus: async (id) => {
        try {
            const { data } = await API.put(`/bank-offers/${id}/status`);
            set(state => ({
                offers: state.offers.map(o => o._id === id ? data : o)
            }));
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    }
}));

export default useBankOfferStore;
