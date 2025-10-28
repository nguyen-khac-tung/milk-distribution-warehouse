// Định nghĩa roles và permissions theo database thực tế
export const ROLES = {
    WAREHOUSE_MANAGER: 'Warehouse Manager',
    WAREHOUSE_STAFF: 'Warehouse Staff',
    ADMINISTRATOR: 'Administrator',
    BUSINESS_OWNER: 'Business Owner',
    SALES_REPRESENTATIVE: 'Sales Representative',
    SALE_MANAGER: 'Sale Manager'
};

export const PERMISSIONS = {
    // Goods permissions
    GOODS_VIEW: 'Goods.View',
    GOODS_CREATE: 'Goods.Create',
    GOODS_UPDATE: 'Goods.Update',
    GOODS_DELETE: 'Goods.Delete',

    // Category permissions
    CATEGORY_VIEW: 'Category.View',
    CATEGORY_CREATE: 'Category.Create',
    CATEGORY_UPDATE: 'Category.Update',
    CATEGORY_DELETE: 'Category.Delete',

    // Supplier permissions
    SUPPLIER_VIEW: 'Supplier.View',
    SUPPLIER_CREATE: 'Supplier.Create',
    SUPPLIER_UPDATE: 'Supplier.Update',
    SUPPLIER_DELETE: 'Supplier.Delete',

    // Retailer permissions  
    RETAILER_VIEW: 'Retailer.View',
    RETAILER_CREATE: 'Retailer.Create',
    RETAILER_UPDATE: 'Retailer.Update',
    RETAILER_DELETE: 'Retailer.Delete',

    // Unit Measure permissions
    UNIT_MEASURE_VIEW: 'UnitMeasure.View',
    UNIT_MEASURE_CREATE: 'UnitMeasure.Create',
    UNIT_MEASURE_UPDATE: 'UnitMeasure.Update',
    UNIT_MEASURE_DELETE: 'UnitMeasure.Delete',

    // Area permissions
    AREA_VIEW: 'Area.View',
    AREA_CREATE: 'Area.Create',
    AREA_UPDATE: 'Area.Update',
    AREA_DELETE: 'Area.Delete',

    // Location permissions
    LOCATION_VIEW: 'Location.View',
    LOCATION_CREATE: 'Location.Create',
    LOCATION_UPDATE: 'Location.Update',
    LOCATION_DELETE: 'Location.Delete',
    LOCATION_PRINT: 'Location.Print',


    // Storage Condition permissions
    STORAGE_CONDITION_VIEW: 'StorageCondition.View',
    STORAGE_CONDITION_CREATE: 'StorageCondition.Create',
    STORAGE_CONDITION_UPDATE: 'StorageCondition.Update',
    STORAGE_CONDITION_DELETE: 'StorageCondition.Delete',

    // Batch permissions
    BATCH_VIEW: 'Batch.View',
    BATCH_CREATE: 'Batch.Create',
    BATCH_UPDATE: 'Batch.Update',
    BATCH_DELETE: 'Batch.Delete',

    // Account permissions
    ACCOUNT_VIEW: 'Account.View',
    ACCOUNT_CREATE: 'Account.Create',
    ACCOUNT_UPDATE: 'Account.Update',
    ACCOUNT_DELETE: 'Account.Delete',

    // Profile permissions
    PROFILE_VIEW: 'Profile.View',
    PROFILE_CHANGE_PASSWORD: 'Profile.ChangePassword',

    // Report permissions
    REPORT_VIEW: 'Report.View',
    REPORT_EXPORT: 'Report.Export',

    // Settings permissions
    SETTINGS_VIEW: 'Settings.View',
    SETTINGS_UPDATE: 'Settings.Update',

    // Dashboard permissions
    DASHBOARD_VIEW: 'Dashboard.View',
    ADMIN_DASHBOARD_VIEW: 'AdminDashboard.View',

    // Sales Orde permissions
    SALES_ORDER_VIEW: 'SalesOrder.View',
    SALES_ORDER_VIEW_SR: 'SalesOrder.ViewListSR',
    SALES_ORDER_VIEW_SM: 'SalesOrder.ViewListSM',
    SALES_ORDER_VIEW_WM: 'SalesOrder.ViewListWM',
    SALES_ORDER_VIEW_WS: 'SalesOrder.ViewListWS',
    SALES_ORDER_CREATE: 'SalesOrder.Create',
    SALES_ORDER_UPDATE: 'SalesOrder.Update',
    SALES_ORDER_DELETE: 'SalesOrder.Delete',
    SALES_ORDER_VIEW_DETAILS: 'SalesOrder.ViewDetails',
    SALES_ORDER_SUBMIT_REQUEST: 'SalesOrder.SubmitRequest',
    SALES_ORDER_APPROVAL_REQUEST: 'SalesOrder.ApprovalRequest',
    SALES_ORDER_ASSIGN_PICKING: 'SalesOrder.AssignPicking',
    SALES_ORDER_CREATE_DELIVERY_SLIP: 'SalesOrder.CreateDeliverySlip',
    SALES_ORDER_VIEW_DELIVERY_SLIP: 'SalesOrder.ViewDeliverySlip',

    // Purchase Order permissions
    PURCHASE_ORDER_VIEW: 'PurchaseOrder.View',
    PURCHASE_ORDER_VIEW_RS: 'PurchaseOrder.ViewListRS',
    PURCHASE_ORDER_VIEW_SM: 'PurchaseOrder.ViewListSM',
    PURCHASE_ORDER_VIEW_WM: 'PurchaseOrder.ViewListWM',
    PURCHASE_ORDER_VIEW_WS: 'PurchaseOrder.ViewListWS',
    PURCHASE_ORDER_CREATE: 'PurchaseOrder.Create',
    PURCHASE_ORDER_UPDATE: 'PurchaseOrder.Update',
    PURCHASE_ORDER_DELETE: 'PurchaseOrder.Delete',
    PURCHASE_ORDER_VIEW_DETAILS: 'PurchaseOrder.ViewDetails',
    PURCHASE_ORDER_SUBMIT_REQUEST: 'PurchaseOrder.SubmitRequest',
    PURCHASE_ORDER_APPROVAL_REQUEST: 'PurchaseOrder.ApprovalRequest',
    PURCHASE_ORDER_REJECT_REQUEST: 'PurchaseOrder.RejectRequest',
    PURCHASE_ORDER_CONFIRM_DELIVERY: 'PurchaseOrder.ConfirmDelivery',
    PURCHASE_ORDER_ASSIGN_RECEIVING: 'PurchaseOrder.AssignReceiving',

    // Kệ Kê Hàng permissions
    PALLET_VIEW: 'Pallet.View',
    PALLET_CREATE: 'Pallet.Create',
    PALLET_UPDATE: 'Pallet.Update',
    PALLET_DELETE: 'Pallet.Delete',
    PALLET_VIEW_DETAILS: 'Pallet.ViewDetails',
    PALLET_UPDATE_STATUS: 'Pallet.UpdateStatus',
    PALLET_PRINT_BARCODE: 'Pallet.PrintBarcode',
    PALLET_SCAN_BARCODE: 'Pallet.ScanBarcode',
    PALLET_VIEW_SUGGESTED_LOCATIONS: 'Pallet.ViewSuggestedLocations',
    PALLET_CONFIRM_INBOUND_PUTAWAY: 'Pallet.ConfirmInboundPutaway'


};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMINISTRATOR]: [
        PERMISSIONS.ACCOUNT_VIEW, PERMISSIONS.ACCOUNT_CREATE, PERMISSIONS.ACCOUNT_UPDATE, PERMISSIONS.ACCOUNT_DELETE,
        PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ADMIN_DASHBOARD_VIEW,
        PERMISSIONS.AREA_VIEW, PERMISSIONS.AREA_CREATE, PERMISSIONS.AREA_UPDATE, PERMISSIONS.AREA_DELETE,
        PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_CREATE, PERMISSIONS.LOCATION_UPDATE, PERMISSIONS.LOCATION_DELETE,
        PERMISSIONS.STORAGE_CONDITION_VIEW, PERMISSIONS.STORAGE_CONDITION_CREATE, PERMISSIONS.STORAGE_CONDITION_UPDATE, PERMISSIONS.STORAGE_CONDITION_DELETE,
        PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT
    ],

    [ROLES.BUSINESS_OWNER]: [
        PERMISSIONS.ACCOUNT_VIEW, PERMISSIONS.ACCOUNT_CREATE, PERMISSIONS.ACCOUNT_UPDATE, PERMISSIONS.ACCOUNT_DELETE,
        PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ADMIN_DASHBOARD_VIEW,
        PERMISSIONS.AREA_VIEW, PERMISSIONS.AREA_CREATE, PERMISSIONS.AREA_UPDATE, PERMISSIONS.AREA_DELETE,
        PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_CREATE, PERMISSIONS.LOCATION_UPDATE, PERMISSIONS.LOCATION_DELETE,
        PERMISSIONS.STORAGE_CONDITION_VIEW, PERMISSIONS.STORAGE_CONDITION_CREATE, PERMISSIONS.STORAGE_CONDITION_UPDATE, PERMISSIONS.STORAGE_CONDITION_DELETE,
        PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT
    ],

    [ROLES.SALE_MANAGER]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.GOODS_VIEW, PERMISSIONS.GOODS_CREATE, PERMISSIONS.GOODS_UPDATE, PERMISSIONS.GOODS_DELETE,
        PERMISSIONS.CATEGORY_VIEW, PERMISSIONS.CATEGORY_CREATE, PERMISSIONS.CATEGORY_UPDATE, PERMISSIONS.CATEGORY_DELETE,
        PERMISSIONS.UNIT_MEASURE_VIEW, PERMISSIONS.UNIT_MEASURE_CREATE, PERMISSIONS.UNIT_MEASURE_UPDATE, PERMISSIONS.UNIT_MEASURE_DELETE,
        PERMISSIONS.SUPPLIER_VIEW, PERMISSIONS.SUPPLIER_CREATE, PERMISSIONS.SUPPLIER_UPDATE, PERMISSIONS.SUPPLIER_DELETE,
        PERMISSIONS.RETAILER_VIEW, PERMISSIONS.RETAILER_CREATE, PERMISSIONS.RETAILER_UPDATE, PERMISSIONS.RETAILER_DELETE,
        PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_SM, PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS, PERMISSIONS.PURCHASE_ORDER_APPROVAL_REQUEST, PERMISSIONS.PURCHASE_ORDER_REJECT_REQUEST,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_SM, PERMISSIONS.SALES_ORDER_VIEW_DETAILS, PERMISSIONS.SALES_ORDER_APPROVAL_REQUEST,
        PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT
    ],

    [ROLES.SALES_REPRESENTATIVE]: [
        PERMISSIONS.GOODS_VIEW,
        PERMISSIONS.SUPPLIER_VIEW,
        PERMISSIONS.RETAILER_VIEW,
        PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_RS, PERMISSIONS.PURCHASE_ORDER_CREATE, PERMISSIONS.PURCHASE_ORDER_UPDATE, PERMISSIONS.PURCHASE_ORDER_DELETE, PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS,
        PERMISSIONS.PURCHASE_ORDER_SUBMIT_REQUEST,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_SR, PERMISSIONS.SALES_ORDER_CREATE, PERMISSIONS.SALES_ORDER_UPDATE, PERMISSIONS.SALES_ORDER_DELETE, PERMISSIONS.SALES_ORDER_VIEW_DETAILS,
        PERMISSIONS.SALES_ORDER_SUBMIT_REQUEST,
        PERMISSIONS.REPORT_VIEW
    ],

    [ROLES.WAREHOUSE_MANAGER]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.AREA_VIEW,
        PERMISSIONS.LOCATION_VIEW,
        PERMISSIONS.BATCH_VIEW, PERMISSIONS.BATCH_CREATE, PERMISSIONS.BATCH_UPDATE, PERMISSIONS.BATCH_DELETE,
        PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_WM, PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS,
        PERMISSIONS.PURCHASE_ORDER_CONFIRM_DELIVERY, PERMISSIONS.PURCHASE_ORDER_ASSIGN_RECEIVING,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_WM, PERMISSIONS.SALES_ORDER_VIEW_DETAILS, PERMISSIONS.SALES_ORDER_ASSIGN_PICKING,
        PERMISSIONS.SALES_ORDER_VIEW_DELIVERY_SLIP,
        PERMISSIONS.PALLET_VIEW, PERMISSIONS.PALLET_VIEW_DETAILS,
        PERMISSIONS.PALLET_PRINT_BARCODE, PERMISSIONS.PALLET_SCAN_BARCODE, PERMISSIONS.PALLET_VIEW_SUGGESTED_LOCATIONS,
        PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT
    ],

    [ROLES.WAREHOUSE_STAFF]: [
        PERMISSIONS.AREA_VIEW,
        PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_PRINT,
        PERMISSIONS.BATCH_VIEW,
        PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_WS, PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_WS, PERMISSIONS.SALES_ORDER_VIEW_DETAILS,
        PERMISSIONS.SALES_ORDER_CREATE_DELIVERY_SLIP, PERMISSIONS.SALES_ORDER_VIEW_DELIVERY_SLIP,
        PERMISSIONS.PALLET_VIEW, PERMISSIONS.PALLET_CREATE, PERMISSIONS.PALLET_UPDATE, PERMISSIONS.PALLET_DELETE,
        PERMISSIONS.PALLET_VIEW_DETAILS, PERMISSIONS.PALLET_UPDATE_STATUS, PERMISSIONS.PALLET_PRINT_BARCODE,
        PERMISSIONS.PALLET_SCAN_BARCODE, PERMISSIONS.PALLET_VIEW_SUGGESTED_LOCATIONS, PERMISSIONS.PALLET_CONFIRM_INBOUND_PUTAWAY,
        PERMISSIONS.REPORT_VIEW
    ]
};

// Purchase Order Status Constants
export const PURCHASE_ORDER_STATUS = {
    Draft: 1,
    PendingApproval: 2,
    Rejected: 3,
    Approved: 4,
    GoodsReceived: 5,
    AssignedForReceiving: 6,
    Receiving: 7,
    Inspected: 8,
    Completed: 9
};

/**
 * Check if user can perform action on purchase order based on API response flags and role
 * @param {string} action - 'view', 'edit', 'delete'
 * @param {Object} order - Purchase order object with isDisableUpdate, isDisableDelete properties
 * @param {Function} hasPermission - Function to check user permissions
 * @returns {boolean} - Whether user can perform the action
 */
export const canPerformPurchaseOrderAction = (action, order, hasPermission) => {
    // For Sales Representative, check API response flags
    if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS)) {
        switch (action) {
            case 'view':
                return true; // Always can view
            case 'edit':
                // Can edit if not disabled by API
                return !order.isDisableUpdate;
            case 'delete':
                // Can delete if not disabled by API
                return !order.isDisableDelete;
            default:
                return false;
        }
    }

    // For Sale Manager, only can view
    if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_SM)) {
        switch (action) {
            case 'view':
                return true; // Can view
            case 'edit':
                return false; // Cannot edit
            case 'delete':
                return false; // Cannot delete
            default:
                return false;
        }
    }

    // For Warehouse Manager, only can view
    if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM)) {
        switch (action) {
            case 'view':
                return true; // Can view
            case 'edit':
                return false; // Cannot edit
            case 'delete':
                return false; // Cannot delete
            default:
                return false;
        }
    }

    // For Warehouse Staff, only can view
    if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS)) {
        switch (action) {
            case 'view':
                return true; // Can view
            case 'edit':
                return false; // Cannot edit
            case 'delete':
                return false; // Cannot delete
            default:
                return false;
        }
    }

    // For other roles, use existing permission system
    return true;
};

// Sales Order Status Constants
export const SALES_ORDER_STATUS = {
    Draft: 1,               // Nháp
    PendingApproval: 2,     // Chờ duyệt
    Rejected: 3,            // Từ chối
    Approved: 4,            // Đã duyệt
    AssignedForPicking: 5,  // Đã phân công lấy hàng
    Picking: 6,             // Đang lấy hàng
    Completed: 7            // Hoàn thành
};

export const canPerformSalesOrderAction = (action, order, hasPermission, userInfo = null) => {
    // Nếu có userInfo, sử dụng logic chi tiết
    if (userInfo) {
        return canPerformSalesOrderDetailAction(action, order, hasPermission, userInfo);
    }

    // Logic cũ cho backward compatibility
    if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SR)) {
        switch (action) {
            case 'view':
                return true;
            case 'edit':
                return !order.isDisableUpdate;
            case 'delete':
                return !order.isDisableDelete;
            default:
                return false;
        }
    }

    if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SM)) {
        return action === 'view';
    }

    if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WM)) {
        return action === 'view';
    }

    if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WS)) {
        return action === 'view';
    }

    return true;
};

/**
 * Kiểm tra quyền chi tiết cho Sales Order dựa trên role và trạng thái
 * @param {string} action - Hành động cần kiểm tra
 * @param {Object} order - Đối tượng sales order
 * @param {Function} hasPermission - Function kiểm tra permission
 * @param {Object} userInfo - Thông tin user hiện tại
 * @returns {boolean} - Có thể thực hiện hành động không
 */
export const canPerformSalesOrderDetailAction = (action, order, hasPermission, userInfo) => {
    const currentUserId = userInfo?.userId;
    
    // Flexible ownership check - handle different possible field structures
    const isOwnOrder = 
        order?.createdBy?.userId === currentUserId ||
        order?.createdBy?.id === currentUserId ||
        order?.createdBy === currentUserId ||
        order?.createdById === currentUserId ||
        order?.createdByUserId === currentUserId;
    
    const status = order?.status;


    // Sales Representative (Nhân viên kinh doanh)
    if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SR)) {
        switch (action) {
            case 'view':
                return true;
            case 'edit':
                // Chỉ có thể edit Draft/Rejected của mình
                // Handle both string and number status
                const canEditDraft = status === SALES_ORDER_STATUS.Draft || status === 1 || status === "1";
                const canEditRejected = status === SALES_ORDER_STATUS.Rejected || status === 3 || status === "3";
                return isOwnOrder && (canEditDraft || canEditRejected);
            case 'delete':
                // Chỉ có thể delete Draft của mình
                const canDeleteDraft = status === SALES_ORDER_STATUS.Draft || status === 1 || status === "1";
                return isOwnOrder && canDeleteDraft;
            case 'approve':
            case 'assign':
            case 'create_delivery_slip':
            case 'view_delivery_slip':
                return false; // Sales Rep không có quyền này
            default:
                return false;
        }
    }

    // Sale Manager (Quản lý kinh doanh)
    if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SM)) {
        switch (action) {
            case 'view':
                return true;
            case 'approve':
                // Chỉ có thể approve PendingApproval
                return status === SALES_ORDER_STATUS.PendingApproval;
            case 'edit':
            case 'delete':
            case 'assign':
            case 'create_delivery_slip':
            case 'view_delivery_slip':
                return false; // Sale Manager không có quyền này
            default:
                return false;
        }
    }

    // Warehouse Manager (Quản lý kho)
    if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WM)) {
        switch (action) {
            case 'view':
                return true;
            case 'assign':
                // Có thể assign Approved hoặc re-assign AssignedForPicking
                return status === SALES_ORDER_STATUS.Approved || status === SALES_ORDER_STATUS.AssignedForPicking;
            case 'view_delivery_slip':
                // Có thể xem delivery slip khi Picking hoặc Completed
                return status === SALES_ORDER_STATUS.Picking || status === SALES_ORDER_STATUS.Completed;
            case 'edit':
            case 'delete':
            case 'approve':
            case 'create_delivery_slip':
                return false; // Warehouse Manager không có quyền này
            default:
                return false;
        }
    }

    // Warehouse Staff (Nhân viên kho)
    if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WS)) {
        switch (action) {
            case 'view':
                return true;
            case 'create_delivery_slip':
                // Chỉ có thể tạo delivery slip cho AssignedForPicking của mình
                return isOwnOrder && status === SALES_ORDER_STATUS.AssignedForPicking;
            case 'view_delivery_slip':
                // Có thể xem delivery slip khi Picking hoặc Completed của mình
                return isOwnOrder && (status === SALES_ORDER_STATUS.Picking || status === SALES_ORDER_STATUS.Completed);
            case 'edit':
            case 'delete':
            case 'approve':
            case 'assign':
                return false; // Warehouse Staff không có quyền này
            default:
                return false;
        }
    }

    return false;
};
