import { useMemo } from 'react';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../utils/permissions';


///FILE NÀY TRUNG TÂM XỬ LÝ PHÂN QUYỀN MINH NHÉ
export const usePermissions = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userRoles = userInfo.roles || [];

    const hasPermission = useMemo(() => {
        return (permission) => {
            if (!permission) return true;
            
            // Kiểm tra quyền theo role (bao gồm cả Admin)
            return userRoles.some(role => 
                ROLE_PERMISSIONS[role]?.includes(permission)
            );
        };
    }, [userRoles]);

    const hasAnyPermission = useMemo(() => {
        return (permissions) => {
            if (!permissions || permissions.length === 0) return true;
            return permissions.some(permission => hasPermission(permission));
        };
    }, [hasPermission]);

    const hasAllPermissions = useMemo(() => {
        return (permissions) => {
            if (!permissions || permissions.length === 0) return true;
            return permissions.every(permission => hasPermission(permission));
        };
    }, [hasPermission]);

    const canAccessRoute = useMemo(() => {
        return (route) => {
            const routePermissions = {
                '/dashboard': [PERMISSIONS.DASHBOARD_VIEW],
                '/accounts': [PERMISSIONS.ACCOUNT_VIEW],
                '/categories': [PERMISSIONS.CATEGORY_VIEW],
                '/unit-measures': [PERMISSIONS.UNIT_MEASURE_VIEW],
                '/goods': [PERMISSIONS.GOODS_VIEW],
                '/suppliers': [PERMISSIONS.SUPPLIER_VIEW],
                '/retailers': [PERMISSIONS.RETAILER_VIEW],
                '/areas': [PERMISSIONS.AREA_VIEW],
                '/locations': [PERMISSIONS.LOCATION_VIEW],
                '/storage-conditions': [PERMISSIONS.STORAGE_CONDITION_VIEW],
                '/batches': [PERMISSIONS.BATCH_VIEW],
                '/reports': [PERMISSIONS.REPORT_VIEW],
                '/settings': [PERMISSIONS.SETTINGS_VIEW]
            };
            
            const requiredPermissions = routePermissions[route];
            if (!requiredPermissions) return true;
            
            // Kiểm tra role trực tiếp
            if (requiredPermissions.some(p => Object.values(ROLES).includes(p))) {
                return requiredPermissions.some(role => userRoles.includes(role));
            }
            
            // Kiểm tra permission
            return hasAnyPermission(requiredPermissions);
        };
    }, [hasAnyPermission, userRoles]);

    const isAdministrator = useMemo(() => {
        return userRoles.includes(ROLES.ADMINISTRATOR);
    }, [userRoles]);

    const isBusinessOwner = useMemo(() => {
        return userRoles.includes(ROLES.BUSINESS_OWNER);
    }, [userRoles]);

    const isSaleManager = useMemo(() => {
        return userRoles.includes(ROLES.SALE_MANAGER);
    }, [userRoles]);

    const isSalesRepresentative = useMemo(() => {
        return userRoles.includes(ROLES.SALES_REPRESENTATIVE);
    }, [userRoles]);

    const isWarehouseManager = useMemo(() => {
        return userRoles.includes(ROLES.WAREHOUSE_MANAGER);
    }, [userRoles]);

    const isWarehouseStaff = useMemo(() => {
        return userRoles.includes(ROLES.WAREHOUSE_STAFF);
    }, [userRoles]);

    return {
        hasPermission,
        hasAnyPermission, 
        hasAllPermissions,
        canAccessRoute,
        userRoles,
        isAdministrator,
        isBusinessOwner,
        isSaleManager,
        isSalesRepresentative,
        isWarehouseManager,
        isWarehouseStaff
    };
};
