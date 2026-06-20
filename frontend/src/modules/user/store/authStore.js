import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../../../services/api';
import { useCartStore } from './cartStore';
import { requestForToken } from '../../../services/firebase';

const PORTAL_SESSION_STORAGE_KEY = 'ik-portal-session-id';

const setUserTokenCache = (token) => {
    if (typeof window === 'undefined') {
        return;
    }

    if (token) {
        localStorage.setItem('user-auth-token', token);
    } else {
        localStorage.removeItem('user-auth-token');
    }
};

const createPortalSessionId = () => {
    if (typeof window === 'undefined') {
        return '';
    }

    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const syncPortalSessionCache = (sessionId) => {
    if (typeof window === 'undefined') {
        return;
    }

    if (sessionId) {
        localStorage.setItem(PORTAL_SESSION_STORAGE_KEY, sessionId);
    } else {
        localStorage.removeItem(PORTAL_SESSION_STORAGE_KEY);
    }
};

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            loading: true,
            error: null,

            syncAddresses: (addresses = []) => {
                useCartStore.getState().setAddresses(addresses);
                set((state) => ({
                    user: state.user ? { ...state.user, addresses } : state.user
                }));
            },

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
                    const currentSessionId = get().user?.sessionId || null;
                    setUserTokenCache(storedToken);
                    syncPortalSessionCache(currentSessionId);
                    set({ user: { ...data, token: storedToken, sessionId: currentSessionId }, isAuthenticated: true, loading: false });
                    useCartStore.getState().setAddresses(data?.addresses || []);
                    get().registerFcmToken();
                } catch (error) {
                    setUserTokenCache(null);
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
            setUserTokenCache(data?.token);
            syncPortalSessionCache(data?.sessionId);
            set({ user: data, isAuthenticated: true, loading: false });
            useCartStore.getState().setAddresses(data?.addresses || []);
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
            setUserTokenCache(data?.token);
            syncPortalSessionCache(data?.sessionId);
            set({ user: data, isAuthenticated: true, loading: false });
            useCartStore.getState().setAddresses(data?.addresses || []);
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
            setUserTokenCache(data?.token);
            syncPortalSessionCache(data?.sessionId);
            set({ user: data, isAuthenticated: true, loading: false });
            useCartStore.getState().setAddresses(data?.addresses || []);
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
            setUserTokenCache(null);
            syncPortalSessionCache(createPortalSessionId());
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('user-auth-storage');
            useCartStore.getState().clearStore();
        } catch (error) {
            console.error('Logout failed', error);
            // Force client-side logout anyway
            setUserTokenCache(null);
            syncPortalSessionCache(createPortalSessionId());
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('user-auth-storage');
        }
    },

    deleteAccount: async () => {
        set({ error: null });
        try {
            await API.delete('/auth/profile');
            setUserTokenCache(null);
            syncPortalSessionCache(createPortalSessionId());
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('user-auth-storage');
            useCartStore.getState().clearStore();
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Delete account failed'
            });
            throw error;
        }
    },
    
    // Update Profile
    updateProfile: async (profileData) => {
        set({ error: null });
        try {
            const currentUser = get().user;
            const isAdmin = currentUser?.isAdmin || currentUser?.role;
            
            // Use different endpoint based on user type
            const endpoint = isAdmin ? '/admin/profile' : '/auth/profile';
            const { data } = await API.put(endpoint, profileData);
            
            const mergedUser = currentUser?.token
                ? { ...data, token: currentUser.token, sessionId: currentUser?.sessionId || data?.sessionId || null }
                : { ...data, sessionId: currentUser?.sessionId || data?.sessionId || null };

            setUserTokenCache(mergedUser?.token);
            syncPortalSessionCache(mergedUser?.sessionId);
            set({ user: mergedUser, isAuthenticated: true });
            useCartStore.getState().setAddresses(mergedUser?.addresses || []);
            return mergedUser;
        } catch (error) {
            set({ 
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
