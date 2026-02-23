import axios from 'axios';
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
    withCredentials: true,
});

API.interceptors.request.use((config) => {
    try {
        const requestUrl = `${config.baseURL || ''}${config.url || ''}`;
        const isAdminApiCall =
            requestUrl.includes('/admin') || requestUrl.includes('/notifications');

        const adminStorageData = localStorage.getItem('admin-auth-storage');
        const userStorageData = localStorage.getItem('user-auth-storage');

        const adminToken = adminStorageData
            ? JSON.parse(adminStorageData)?.state?.adminUser?.token
            : null;

        // Token is stored inside user object in zustand persist.
        const userToken = userStorageData
            ? (JSON.parse(userStorageData)?.state?.user?.token || JSON.parse(userStorageData)?.state?.token)
            : null;

        if (isAdminApiCall && adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        } else if (userToken) {
            config.headers.Authorization = `Bearer ${userToken}`;
        } else if (adminToken) {
            // Fallback so admin-only sessions still work on shared endpoints.
            config.headers.Authorization = `Bearer ${adminToken}`;
        }
    } catch (error) {
        console.error('Error retrieving auth token:', error);
    }
    return config;
});

export default API;
