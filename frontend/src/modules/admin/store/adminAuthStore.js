import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../../../services/api';
import { requestForToken } from '../../../services/firebase';

const setAdminTokenCache = (token) => {
    if (typeof window === 'undefined') {
        return;
    }

    if (token) {
        localStorage.setItem('admin-auth-token', token);
    } else {
        localStorage.removeItem('admin-auth-token');
    }
};

const useAdminAuthStore = create(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            adminUser: null,
            error: null,
            loading: false,
            authChecked: false,

            // Real login
            login: async (usernameOrEmail, password) => {
                set({ loading: true, error: null });
                try {
                    const loginId = usernameOrEmail.trim();
                    const payload = {
                        password,
                        ...(loginId.includes('@') ? { email: loginId } : { username: loginId })
                    };
                    const { data } = await API.post('/admin/login', payload);
                    if (data.isAdmin || data.role === 'superadmin' || data.role === 'admin') {
                        setAdminTokenCache(data.token);
                        set({
                            isAuthenticated: true,
                            adminUser: data,
                            error: null,
                            loading: false,
                            authChecked: true
                        });
                        await requestForToken();
                        return true;
                    } else {
                        set({ error: 'Not authorized as admin', loading: false, authChecked: true });
                        return false;
                    }
                } catch (error) {
                    set({
                        error: error.response?.data?.message || 'Login failed',
                        isAuthenticated: false,
                        loading: false,
                        authChecked: true
                    });
                     return false;
                }
            },

            checkAuth: async () => {
                const storedToken =
                    get().adminUser?.token ||
                    (typeof window !== 'undefined' ? localStorage.getItem('admin-auth-token') : null);

                if (!storedToken) {
                    setAdminTokenCache(null);
                    set({
                        isAuthenticated: false,
                        adminUser: null,
                        loading: false,
                        authChecked: true
                    });
                    return false;
                }

                set({ loading: true, error: null });

                try {
                    const { data } = await API.get('/admin/profile');
                    const nextAdminUser = { ...data, token: storedToken };
                    setAdminTokenCache(storedToken);
                    set({
                        isAuthenticated: true,
                        adminUser: nextAdminUser,
                        error: null,
                        loading: false,
                        authChecked: true
                    });
                    return true;
                } catch (error) {
                    setAdminTokenCache(null);
                    localStorage.removeItem('admin-auth-storage');
                    set({
                        isAuthenticated: false,
                        adminUser: null,
                        error: error.response?.data?.message || 'Admin session expired',
                        loading: false,
                        authChecked: true
                    });
                    return false;
                }
            },

            logout: async () => {
                try {
                    await API.post('/admin/logout');
                } catch (e) { console.error(e); }
                setAdminTokenCache(null);
                localStorage.removeItem('admin-auth-storage');
                set({
                    isAuthenticated: false,
                    adminUser: null,
                    authChecked: true
                });
            },

            // Update admin profile
            updateProfile: async (profileData) => {
                try {
                    const { data } = await API.put('/admin/profile', profileData);
                    const existingToken = get().adminUser?.token;
                    if (existingToken) {
                        setAdminTokenCache(existingToken);
                    }
                    set({
                        adminUser: existingToken ? { ...data, token: existingToken } : data,
                        error: null
                    });
                    return data;
                } catch (error) {
                    set({
                        error: error.response?.data?.message || 'Update failed'
                    });
                    throw error;
                }
            }
        }),
        {
            name: 'admin-auth-storage'
        }
    )
);

export default useAdminAuthStore;
