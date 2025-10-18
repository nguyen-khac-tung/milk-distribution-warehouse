import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

const PermissionGate = ({ 
    permission, 
    permissions, 
    requireAll = false,
    fallback = null,
    children 
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    const hasAccess = () => {
        if (permission) {
            return hasPermission(permission);
        }
        
        if (permissions) {
            return requireAll 
                ? hasAllPermissions(permissions)
                : hasAnyPermission(permissions);
        }
        
        return true;
    };

    return hasAccess() ? children : fallback;
};

export default PermissionGate;
