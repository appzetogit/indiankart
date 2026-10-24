import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAdminAuthStore from '../store/adminAuthStore';

const MFA_SETUP_PATH = '/admin/mfa-setup';

const ProtectedAdminRoute = ({ children }) => {
    const location = useLocation();
    const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
    const mfaEnabled = useAdminAuthStore((state) => state.adminUser?.mfaEnabled);
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

    // Every admin sets up two-step login before using the panel.
    if (mfaEnabled === false && location.pathname !== MFA_SETUP_PATH) {
        return <Navigate to={MFA_SETUP_PATH} replace />;
    }

    return children;
};

export default ProtectedAdminRoute;
