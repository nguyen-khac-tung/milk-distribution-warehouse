import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLES } from '../../utils/permissions';

const RoleBasedRedirect = () => {
    const { 
        isAdministrator, 
        isBusinessOwner, 
        isSaleManager, 
        isSalesRepresentative, 
        isWarehouseManager, 
        isWarehouseStaff,
        hasPermission
    } = usePermissions();

    // Định nghĩa trang mặc định cho từng role
    const getDefaultRoute = () => {
        // Admin và Business Owner -> Dashboard
        if (isAdministrator || isBusinessOwner) {
            return '/dashboard';
        }

        // Sale Manager -> Goods management (có quyền cao nhất)
        if (isSaleManager) {
            return '/goods';
        }

        // Sales Representative -> Reports (chỉ xem)
        if (isSalesRepresentative) {
            return '/reports';
        }

        // Warehouse Manager -> Batches (quản lý kho)
        if (isWarehouseManager) {
            return '/batches';
        }

        // Warehouse Staff -> Goods (chỉ xem)
        if (isWarehouseStaff) {
            return '/goods';
        }

        // Fallback: kiểm tra permission có sẵn
        const availableRoutes = [
            { path: '/dashboard', permission: 'ADMIN_DASHBOARD_VIEW' },
            { path: '/accounts', permission: 'ACCOUNT_VIEW' },
            { path: '/goods', permission: 'GOODS_VIEW' },
            { path: '/batches', permission: 'BATCH_VIEW' },
            { path: '/suppliers', permission: 'SUPPLIER_VIEW' },
            { path: '/retailers', permission: 'RETAILER_VIEW' },
            { path: '/areas', permission: 'AREA_VIEW' },
            { path: '/locations', permission: 'LOCATION_VIEW' },
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

    const defaultRoute = getDefaultRoute();
    
    return <Navigate to={defaultRoute} replace />;
};

export default RoleBasedRedirect;
