import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAdminAuthStore from '../store/adminAuthStore';

const ProtectedAdminRoute = ({ children }) => {
    const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
    const loading = useAdminAuthStore((state) => state.loading);
    const authChecked = useAdminAuthStore((state) => state.authChecked);
    const checkAuth = useAdminAuthStore((state) => state.checkAuth);

    useEffect(() => {
        if (!authChecked) {
            checkAuth();
        }
    }, [authChecked, checkAuth]);

    if (!authChecked || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-semibold">
                Checking admin session...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default ProtectedAdminRoute;
