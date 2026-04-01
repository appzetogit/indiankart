import axios from 'axios';
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
    withCredentials: true,
});

const parseStoredState = (key) => {
    try {
        const rawValue = localStorage.getItem(key);
        return rawValue ? JSON.parse(rawValue) : null;
    } catch (error) {
        console.error(`Error parsing localStorage key ${key}:`, error);
        return null;
    }
};

API.interceptors.request.use((config) => {
    try {
        const requestUrl = `${config.baseURL || ''}${config.url || ''}`;
        const requestPath = config.url || '';
        const requestMethod = String(config.method || 'get').toLowerCase();
        const currentPath =
            typeof window !== 'undefined' ? window.location.pathname : '';
        const isAdminContext = currentPath.startsWith('/admin');
        const isAdminApiCall = requestUrl.includes('/admin');
        const requiresAdminToken = [
            '/coupons',
            '/bank-offers',
            '/categories',
            '/subcategories',
            '/products',
            '/orders',
            '/returns',
            '/reels',
            '/banners',
            '/home-sections',
            '/pages',
            '/home-layout',
            '/pincodes',
            '/settings',
            '/offers',
            '/notifications',
            '/footer',
            '/header',
            '/seller-requests'
        ].some((path) => requestPath.startsWith(path)) && requestMethod !== 'get';

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

        // Keep admin/user sessions isolated:
        // admin pages -> admin token, user pages -> user token.
        if ((isAdminContext || isAdminApiCall || requiresAdminToken) && adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        } else if (userToken) {
            config.headers.Authorization = `Bearer ${userToken}`;
        } else {
            delete config.headers.Authorization;
        }
    } catch (error) {
        console.error('Error retrieving auth token:', error);
    }
    return config;
});

export default API;
