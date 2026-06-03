import React from 'react';
import { Navigate } from 'react-router-dom';
import useAdminAuthStore from '../store/adminAuthStore';
import { getDefaultAdminRoute, hasAdminPermission } from '../constants/adminPermissions';

const AdminPermissionRoute = ({ permission, children }) => {
    const adminUser = useAdminAuthStore((state) => state.adminUser);

    if (hasAdminPermission(adminUser, permission)) {
        return children;
    }

    return <Navigate to={getDefaultAdminRoute(adminUser)} replace />;
};

export default AdminPermissionRoute;
