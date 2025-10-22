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

    // Nếu user đang bắt buộc đổi mật khẩu (đăng nhập lần đầu), chặn truy cập các route bảo vệ
    // và điều hướng tới trang /change-password. Lưu ý: cho phép truy cập trang /change-password
    // để user có thể đổi mật khẩu.
    try {
        const forceChange = localStorage.getItem('forceChangePassword');
        const currentPath = window.location.pathname;
        if (forceChange === 'true' && currentPath !== '/change-password') {
            return <Navigate to="/change-password" replace />;
        }
    } catch (e) {
        // ignore localStorage errors and proceed with normal checks
        console.warn('ProtectedRoute: error reading forceChangePassword', e);
    }

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
