import React from 'react';
import { Navigate } from 'react-router-dom';
import useAdminAuthStore from '../store/adminAuthStore';

const ProtectedAdminRoute = ({ children }) => {
    const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default ProtectedAdminRoute;
