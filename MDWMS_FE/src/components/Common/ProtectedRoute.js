import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const ProtectedRoute = ({
    children,
    requiredPermission,
    requiredRole,
    requiredPermissions,
    requireAll = false,
    fallback = <Navigate to="/unauthorized" replace />
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, userRoles } = usePermissions();

    const hasAccess = () => {
        // Kiểm tra role
        if (requiredRole) {
            return userRoles.includes(requiredRole);
        }

        // Kiểm tra permission đơn lẻ
        if (requiredPermission) {
            return hasPermission(requiredPermission);
        }

        // Kiểm tra nhiều permissions
        if (requiredPermissions) {
            return requireAll
                ? hasAllPermissions(requiredPermissions)
                : hasAnyPermission(requiredPermissions);
        }

        return true;
    };

    return hasAccess() ? children : fallback;
};

export default ProtectedRoute;
