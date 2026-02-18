import axios from 'axios';
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
    withCredentials: true,
});

API.interceptors.request.use((config) => {
    try {
        const storageData = localStorage.getItem('admin-auth-storage');
        if (storageData) {
            const parsed = JSON.parse(storageData);
            const token = parsed?.state?.adminUser?.token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        
        // Check for User Token (Fallback for cookie issues)
        // Check for User Token (Fallback for cookie issues)
        const userStorageData = localStorage.getItem('user-auth-storage');
        if (userStorageData) {
            const parsed = JSON.parse(userStorageData);
            // Check for token in 'user' object (as partialized in authStore) or root 'token' (fallback)
            const token = parsed?.state?.user?.token || parsed?.state?.token;
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (error) {
        console.error('Error retrieving auth token:', error);
    }
    return config;
});

export default API;
