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
        // // Debug tạm thời
        // console.log("=== PROTECTED ROUTE DEBUG ===");
        // console.log("Required permission:", requiredPermission);
        // console.log("User roles:", userRoles);
        // console.log("Has PURCHASE_ORDER_VIEW:", hasPermission('PurchaseOrder.View'));
        // console.log("Has PURCHASE_ORDER_VIEW_RS:", hasPermission('PurchaseOrder.ViewListRS'));
        // console.log("Has PURCHASE_ORDER_VIEW_SM:", hasPermission('PurchaseOrder.ViewListSM'));
        
        // Kiểm tra role
        if (requiredRole) {
            return userRoles.includes(requiredRole);
        }
        // Kiểm tra permission đơn lẻ hoặc array
        if (requiredPermission) {
            if (Array.isArray(requiredPermission)) {
                const hasAny = hasAnyPermission(requiredPermission);
                console.log("Has any permission:", hasAny);
                return requireAll
                    ? hasAllPermissions(requiredPermission)
                    : hasAny;
            } else {
                return hasPermission(requiredPermission);
            }
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
