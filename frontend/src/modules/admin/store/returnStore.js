import { create } from 'zustand';
import API from '../../../services/api';

const useReturnStore = create((set) => ({
    returns: [],
    isLoading: false,

    fetchReturns: async (params = {}) => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/returns', { params });
            set({ returns: data, isLoading: false });
            return data;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    updateReturnStatus: async (id, status, note) => {
        set({ isLoading: true });
        try {
            await API.put(`/returns/${id}`, { status, note });
            const { data } = await API.get('/returns');
            set({ returns: data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    }
}));

export default useReturnStore;
