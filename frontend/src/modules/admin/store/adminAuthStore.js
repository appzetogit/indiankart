import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../../../services/api';
import { requestForToken } from '../../../services/firebase';
import { hasAdminPermission } from '../constants/adminPermissions';

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

            // Two-step login: step 1 is the password. Resolves to
            // 'ok' (signed in), 'mfa' (code needed), 'setup' (signed in, must set
            // up two-step login first) or false (failed; see `error`).
            mfaToken: null,
            login: async (usernameOrEmail, password) => {
                set({ loading: true, error: null, mfaToken: null });
                try {
                    const loginId = usernameOrEmail.trim();
                    const payload = {
                        password,
                        ...(loginId.includes('@') ? { email: loginId } : { username: loginId })
                    };
                    const { data } = await API.post('/admin/login', payload);
                    if (data.mfaRequired) {
                        set({ mfaToken: data.mfaToken, loading: false });
                        return 'mfa';
                    }
                    return get().finishLogin(data);
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

            // Step 2: the 6-digit code from the authenticator app, or a recovery code.
            verifyMfa: async (code) => {
                set({ loading: true, error: null });
                try {
                    const { data } = await API.post('/admin/login/mfa', { mfaToken: get().mfaToken, code });
                    set({ mfaToken: null });
                    return get().finishLogin(data);
                } catch (error) {
                    const expired = error.response?.data?.code === 'MFA_LOGIN_EXPIRED';
                    set({
                        error: error.response?.data?.message || 'Could not verify the code',
                        loading: false,
                        ...(expired ? { mfaToken: null } : {})
                    });
                    return expired ? 'restart' : false;
                }
            },

            cancelMfa: () => set({ mfaToken: null, error: null }),

            finishLogin: async (data) => {
                setAdminTokenCache(data.token);
                set({
                    isAuthenticated: true,
                    adminUser: data,
                    error: null,
                    loading: false,
                    authChecked: true
                });
                if (data.mfaSetupRequired) {
                    return 'setup';
                }
                await requestForToken();
                return 'ok';
            },

            // Called by the setup page once two-step login is on: the server
            // returns a fresh session that counts as verified.
            applyMfaEnabled: (data) => {
                setAdminTokenCache(data.token);
                set({ adminUser: { ...get().adminUser, ...data }, isAuthenticated: true });
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
            },

            hasSidebarAccess: (permissionKey) => {
                return hasAdminPermission(get().adminUser, permissionKey);
            }
        }),
        {
            name: 'admin-auth-storage',
            // The step-2 token is short-lived and must not survive a reload.
            partialize: (state) => {
                const { mfaToken, ...rest } = state;
                return rest;
            }
        }
    )
);

export default useAdminAuthStore;
