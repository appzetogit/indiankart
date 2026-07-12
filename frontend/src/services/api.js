import axios from 'axios';

const PORTAL_SESSION_STORAGE_KEY = 'ik-portal-session-id';
const localStorageJsonCache = new Map();
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const API_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 30000;

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
    withCredentials: true,
    timeout: API_TIMEOUT_MS,
});

const parseStoredState = (key) => {
    try {
        const rawValue = localStorage.getItem(key);
        const cachedEntry = localStorageJsonCache.get(key);

        if (cachedEntry && cachedEntry.rawValue === rawValue) {
            return cachedEntry.parsedValue;
        }

        const parsedValue = rawValue ? JSON.parse(rawValue) : null;
        localStorageJsonCache.set(key, { rawValue, parsedValue });
        return parsedValue;
    } catch (error) {
        console.error(`Error parsing localStorage key ${key}:`, error);
        localStorageJsonCache.delete(key);
        return null;
    }
};

API.interceptors.request.use((config) => {
    try {
        const requestUrl = `${config.baseURL || ''}${config.url || ''}`;
        const currentPath =
            typeof window !== 'undefined' ? window.location.pathname : '';
        const isAdminContext = currentPath.startsWith('/admin');
        const isAdminApiCall = requestUrl.includes('/admin');

        const adminStorageState = parseStoredState('admin-auth-storage');
        const userStorageState = parseStoredState('user-auth-storage');

        const adminToken =
            localStorage.getItem('admin-auth-token') ||
            adminStorageState?.state?.adminUser?.token ||
            null;

        // Token is stored inside user object in zustand persist.
        const userToken =
            localStorage.getItem('user-auth-token') ||
            userStorageState?.state?.user?.token ||
            userStorageState?.state?.token ||
            null;
        const userSessionId =
            userStorageState?.state?.user?.sessionId ||
            null;
        const guestSessionId =
            localStorage.getItem(PORTAL_SESSION_STORAGE_KEY) ||
            null;

        // Keep admin/user sessions isolated:
        // admin pages -> admin token, user pages -> user token.
        if ((isAdminContext || isAdminApiCall) && adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        } else if (userToken) {
            config.headers.Authorization = `Bearer ${userToken}`;
        } else {
            delete config.headers.Authorization;
        }

        if (!(isAdminContext || isAdminApiCall)) {
            const effectiveSessionId = userSessionId || guestSessionId;
            if (effectiveSessionId) {
                config.headers['X-User-Session-Id'] = effectiveSessionId;
            }
        }
    } catch (error) {
        console.error('Error retrieving auth token:', error);
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const method = config?.method?.toLowerCase();
        const isReadOnlyRequest = method === 'get' || method === 'head';
        const isTransientFailure =
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ERR_NETWORK';

        if (config && isReadOnlyRequest && isTransientFailure && !config._readRetryAttempted) {
            config._readRetryAttempted = true;
            return API.request(config);
        }

        return Promise.reject(error);
    }
);

export default API;
