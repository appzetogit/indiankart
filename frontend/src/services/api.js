import axios from 'axios';
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
    withCredentials: true,
});

API.interceptors.request.use((config) => {
    try {
        const requestUrl = `${config.baseURL || ''}${config.url || ''}`;
        const currentPath =
            typeof window !== 'undefined' ? window.location.pathname : '';
        const isAdminContext = currentPath.startsWith('/admin');
        const isAdminApiCall = requestUrl.includes('/admin');

        const adminStorageData = localStorage.getItem('admin-auth-storage');
        const userStorageData = localStorage.getItem('user-auth-storage');

        const adminToken = adminStorageData
            ? JSON.parse(adminStorageData)?.state?.adminUser?.token
            : null;

        // Token is stored inside user object in zustand persist.
        const userToken = userStorageData
            ? (JSON.parse(userStorageData)?.state?.user?.token || JSON.parse(userStorageData)?.state?.token)
            : null;

        // Keep admin/user sessions isolated:
        // admin pages -> admin token, user pages -> user token.
        if (isAdminContext && adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        } else if (isAdminApiCall && adminToken) {
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
