import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { validateAndRefreshToken } from '../../services/AuthenticationServices';

const ProtectedRoute = ({
    children,
    requiredPermission,
    requiredRole,
    requiredPermissions,
    requireAll = false,
    fallback = <Navigate to="/unauthorized" replace />
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, userRoles } = usePermissions();
    const [authStatus, setAuthStatus] = useState(null); // null = checking, true = authenticated, false = not authenticated
    const [isLoading, setIsLoading] = useState(true);

    // Kiểm tra authentication với token validation
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoading(true);
                const isValid = await validateAndRefreshToken();
                setAuthStatus(isValid);
            } catch (error) {
                console.error("Auth check failed:", error);
                setAuthStatus(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

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

    // Hiển thị loading khi đang kiểm tra auth
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // Nếu chưa đăng nhập, redirect về login
    if (authStatus === false) {
        return <Navigate to="/login" replace />;
    }

    // Nếu đã đăng nhập, kiểm tra permissions
    return hasAccess() ? children : fallback;
};

export default ProtectedRoute;
