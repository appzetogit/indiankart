import { create } from 'zustand';
import API from '../../../services/api';

const useUserStore = create((set) => ({
    users: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/auth/users');
            set({ users: data, isLoading: false });
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
        }
    },

    deleteUser: async (id) => {
        set({ isLoading: true });
        try {
            await API.delete(`/auth/users/${id}`);
            set((state) => ({
                users: state.users.filter(u => u._id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ isLoading: false, error: error.message });
        }
    },

    toggleUserStatus: async (id) => {
        set({ isLoading: true });
        try {
            const { data } = await API.patch(`/auth/users/${id}/toggle-status`);
            set((state) => ({
                users: state.users.map(u => 
                    (u._id === id || u.id === id) ? { ...u, status: data.status } : u
                ),
                isLoading: false
            }));
            return data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message,
                isLoading: false 
            });
            throw error;
        }
    },
    
    // Potentially add updateUser if needed
}));

export default useUserStore;
