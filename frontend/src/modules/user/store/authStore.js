import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../../../services/api';
import { useCartStore } from './cartStore';
import { requestForToken } from '../../../services/firebase';


export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            loading: true,
            error: null,

            registerFcmToken: async () => {
                try {
                    await requestForToken();
                } catch (error) {
                    console.error('FCM token registration failed:', error);
                }
            },

            // Check if user is logged in (on app mount)
            checkAuth: async () => {
                const storedToken = get().user?.token;
                if (!storedToken) {
                    set({ user: null, isAuthenticated: false, loading: false });
                    return;
                }

                try {
                    const { data } = await API.get('/auth/profile');
                    if (data?.isAdmin || data?.role === 'admin' || data?.role === 'superadmin') {
                        set({ user: null, isAuthenticated: false, loading: false });
                        localStorage.removeItem('user-auth-storage');
                        return;
                    }
                    // Ensure token is preserved if it exists in data or state
                    set({ user: { ...data, token: storedToken }, isAuthenticated: true, loading: false });
                    get().registerFcmToken();
                } catch (error) {
                    set({ user: null, isAuthenticated: false, loading: false });
                }
            },

    // Send OTP
    sendOtp: async (mobile, userType = 'Customer') => {
        set({ loading: true, error: null });
        try {
            const { data } = await API.post('/auth/send-otp', { mobile, userType });
            set({ loading: false });
            return data;
        } catch (error) {
            set({ 
                loading: false, 
                error: error.response?.data?.message || 'Failed to send OTP' 
            });
            throw error;
        }
    },

    // Verify OTP & Login
    verifyOtp: async (mobile, otp, userType = 'Customer', name = '', email = '') => {
        set({ loading: true, error: null });
        try {
            const payload = { mobile, otp, userType, name, email };
            const { data } = await API.post('/auth/verify-otp', payload);
            set({ user: data, isAuthenticated: true, loading: false });
            get().registerFcmToken();
            return data;
        } catch (error) {
            set({ 
                loading: false, 
                error: error.response?.data?.message || 'Failed to verify OTP' 
            });
            throw error;
        }
    },

    // Login with Email/Password
    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const { data } = await API.post('/auth/login', { email, password });
            set({ user: data, isAuthenticated: true, loading: false });
            get().registerFcmToken();
        } catch (error) {
            set({ 
                loading: false, 
                error: error.response?.data?.message || 'Login failed' 
            });
            throw error;
        }
    },

    // Signup
    signup: async (userData) => {
        set({ loading: true, error: null });
        try {
            const { data } = await API.post('/auth/register', userData);
            set({ user: data, isAuthenticated: true, loading: false });
            get().registerFcmToken();
        } catch (error) {
            set({ 
                loading: false, 
                error: error.response?.data?.message || 'Signup failed' 
            });
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            await API.post('/auth/logout');
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('user-auth-storage');
            useCartStore.getState().clearStore();
        } catch (error) {
            console.error('Logout failed', error);
            // Force client-side logout anyway
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('user-auth-storage');
        }
    },
    
    // Update Profile
    updateProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
            const currentUser = get().user;
            const isAdmin = currentUser?.isAdmin || currentUser?.role;
            
            // Use different endpoint based on user type
            const endpoint = isAdmin ? '/admin/profile' : '/auth/profile';
            const { data } = await API.put(endpoint, profileData);
            
            set({ user: data, loading: false });
            return data;
        } catch (error) {
            set({ 
                loading: false, 
                error: error.response?.data?.message || 'Update failed' 
            });
            throw error;
        }
        }
    }), {
        name: 'user-auth-storage',
        getStorage: () => localStorage,
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Token is inside user object
    }
));
