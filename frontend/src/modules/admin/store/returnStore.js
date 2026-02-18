import { create } from 'zustand';
import API from '../../../services/api';

const useReturnStore = create((set) => ({
    returns: [],
    isLoading: false,

    fetchReturns: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/returns');
            set({ returns: data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    updateReturnStatus: async (id, status, note) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/returns/${id}`, { status, note });
            set((state) => ({
                returns: state.returns.map(r => (r.id === id || r._id === id) ? data : r),
                isLoading: false
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    }
}));

export default useReturnStore;
