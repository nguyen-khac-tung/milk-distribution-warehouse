import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLES } from '../../utils/permissions';
import { validateAndRefreshToken } from '../../services/AuthenticationServices';

/// File này là Setup độ ưu tiên truy cập route theo role
const RoleBasedRedirect = () => {
    const { 
        isAdministrator, 
        isBusinessOwner, 
        isSaleManager, 
        isSalesRepresentative, 
        isWarehouseManager, 
        isWarehouseStaff,
        hasPermission,
        userRoles
    } = usePermissions();
    
    const [authStatus, setAuthStatus] = useState(null);
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


    // Định nghĩa trang mặc định cho từng role
    const getDefaultRoute = () => {
        // Admin và Business Owner -> Dashboard
        if (isAdministrator || isBusinessOwner) {
            return '/dashboard';
        }

        // Sale Manager -> Dashboard (quản lý kinh doanh)
        if (isSaleManager) {
            return '/dashboard';
        }

        // Warehouse Manager -> Dashboard (quản lý kho)
        if (isWarehouseManager) {
            return '/dashboard';
        }

        // Sales Representative -> Reports
        if (isSalesRepresentative) {
            return '/reports';
        }

        // Warehouse Staff -> Reports
        if (isWarehouseStaff) {
            return '/reports';
        }

        // Fallback: kiểm tra permission có sẵn
        const availableRoutes = [
            { path: '/dashboard', permission: 'DASHBOARD_VIEW' },
            { path: '/reports', permission: 'REPORT_VIEW' }
        ];

        // Tìm route đầu tiên mà user có quyền
        for (const route of availableRoutes) {
            if (hasPermission(route.permission)) {
                return route.path;
            }
        }

        // Nếu không có quyền gì -> unauthorized
        return '/unauthorized';
    };

    // Hiển thị loading khi đang kiểm tra auth
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // Nếu chưa đăng nhập, redirect về login
    if (authStatus === false) {
        return <Navigate to="/login" replace />;
    }

    const defaultRoute = getDefaultRoute();
    
    return <Navigate to={defaultRoute} replace />;
};

export default RoleBasedRedirect;
