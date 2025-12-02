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

    // Sales Order permissions
    SALES_ORDER_VIEW: 'SalesOrder.View',
    SALES_ORDER_VIEW_SR: 'SalesOrder.ViewListSR',
    SALES_ORDER_VIEW_SM: 'SalesOrder.ViewListSM',
    SALES_ORDER_VIEW_WM: 'SalesOrder.ViewListWM',
    SALES_ORDER_VIEW_WS: 'SalesOrder.ViewListWS',
    SALES_ORDER_CREATE: 'SalesOrder.Create',
    SALES_ORDER_UPDATE: 'SalesOrder.Update',
    SALES_ORDER_DELETE: 'SalesOrder.Delete',
    SALES_ORDER_VIEW_DETAILS: 'SalesOrder.ViewDetails',
    SALES_ORDER_SUBMIT: 'SalesOrder.Submit',
    SALES_ORDER_APPROVAL: 'SalesOrder.Approval',
    SALES_ORDER_REJECT: 'SalesOrder.Reject',
    SALES_ORDER_ASSIGN_PICKING: 'SalesOrder.AssignPicking',
    SALES_ORDER_CREATE_DELIVERY_SLIP: 'SalesOrder.CreateDeliverySlip',
    SALES_ORDER_VIEW_DELIVERY_SLIP: 'SalesOrder.ViewDeliverySlip',
    SALES_ORDER_SUBMIT_PENDING_APPROVAL: 'SalesOrder.SubmitPendingApproval', // Sales Representative
    SALES_ORDER_APPROVE: 'SalesOrder.Approve', // Sale Manager
    SALES_ORDER_REJECT_ORDER: 'SalesOrder.RejectOrder', // Sale Manager
    SALES_ORDER_ASSIGN_FOR_PICKING: 'SalesOrder.AssignForPicking', // Warehouse Manager

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
    PURCHASE_ORDER_SUBMIT_DRAFT: 'PurchaseOrder.SubmitDraft',
    PURCHASE_ORDER_APPROVE: 'PurchaseOrder.Approve',
    PURCHASE_ORDER_REJECT: 'PurchaseOrder.Reject',
    PURCHASE_ORDER_CONFIRM_GOODS_RECEIVED: 'PurchaseOrder.ConfirmGoodsReceived',
    PURCHASE_ORDER_ASSIGN_FOR_RECEIVING: 'PurchaseOrder.AssignForReceiving',
    PURCHASE_ORDER_REASSIGN_FOR_RECEIVING: 'PurchaseOrder.ReAssignForReceiving',
    PURCHASE_ORDER_START_RECEIVE: 'PurchaseOrder.StartReceive',
    PURCHASE_ORDER_CONFIRM_ORDERED: 'PurchaseOrder.ConfirmOrdered',
    PURCHASE_ORDER_CHANGE_DELIVERY_DATE: 'PurchaseOrder.ChangeDeliveryDate',
    PURCHASE_ORDER_AWAITINGRRIVAL: 'PurchaseOrder.AwaitingArrival',


    // BackOrder permissions
    BACKORDER_VIEW: 'BackOrder.View',
    BACKORDER_VIEW_DETAILS: 'BackOrder.ViewDetails',
    BACKORDER_CREATE: 'BackOrder.Create',
    BACKORDER_UPDATE: 'BackOrder.Update',
    BACKORDER_DELETE: 'BackOrder.Delete',
    BACKORDER_CREATE_SALES_ORDER: 'BackOrder.CreateSalesOrderFromSelected',

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
    PALLET_CONFIRM_INBOUND_PUTAWAY: 'Pallet.ConfirmInboundPutaway',

    // Goods Receipt Note permissions
    GOODS_RECEIPT_NOTE_VIEW_DETAILS: 'GoodsReceiptNote.ViewDetails',
    GOODS_RECEIPT_NOTE_COMPLETE_RECEIVING: 'GoodsReceiptNote.CompleteReceiving',
    GOODS_RECEIPT_NOTE_COMPLETE_ARRANGING: 'GoodsReceiptNote.CompleteArranging',
    GOODS_RECEIPT_NOTE_DETAIL_APPROVE: 'GoodsReceiptNoteDetail.Approve',
    GOODS_RECEIPT_NOTE_DETAIL_REJECT: 'GoodsReceiptNoteDetail.Reject',
    GOODS_RECEIPT_NOTE_DETAIL_CANCEL: 'GoodsReceiptNoteDetail.Cancel',
    GOODS_RECEIPT_NOTE_DETAIL_CHECK: 'GoodsReceiptNoteDetail.Check',

    // Stocktaking permissions
    STOCKTAKING_VIEW: 'Stocktaking.View',
    STOCKTAKING_VIEW_WM: 'Stocktaking.ViewListWM',
    STOCKTAKING_VIEW_WS: 'Stocktaking.ViewListWS',
    STOCKTAKING_VIEW_SM: 'Stocktaking.ViewListSM',
    STOCKTAKING_CREATE: 'Stocktaking.Create',
    STOCKTAKING_UPDATE: 'Stocktaking.Update',
    STOCKTAKING_DELETE: 'Stocktaking.Delete',
    STOCKTAKING_VIEW_DETAILS: 'Stocktaking.ViewDetails',
    STOCKTAKING_IN_PROGRESS: 'Stocktaking.InProgress',
    STOCKTAKING_AREA_VIEW_DETAILS: 'StocktakingArea.ViewDetails',
    STOCKTAKING_AREA_VIEW_DETAILS_FOR_OTHER: 'StocktakingArea.ViewDetailsForOther',
    STOCKTAKING_REASSIGN_AREA: 'Stocktaking.ReAssignArea',

    // Disposal Request permissions
    DISPOSAL_REQUEST_VIEW: 'DisposalRequest.View',
    DISPOSAL_REQUEST_VIEW_WM: 'DisposalRequest.ViewListWM',        // Warehouse Manager - view list
    DISPOSAL_REQUEST_VIEW_SM: 'DisposalRequest.ViewListSM',        // Sale Manager - view list
    DISPOSAL_REQUEST_VIEW_WS: 'DisposalRequest.ViewListWS',        // Warehouse Staff - view list
    DISPOSAL_REQUEST_VIEW_DETAILS: 'DisposalRequest.ViewDetails',  // All roles (WM, SM, WS) - view detail

    DISPOSAL_REQUEST_GET_EXPIRED_GOODS: 'DisposalRequest.GetExpiredGoods', // Warehouse Manager - get expired goods

    DISPOSAL_REQUEST_CREATE: 'DisposalRequest.Create',   // Warehouse Manager
    DISPOSAL_REQUEST_UPDATE: 'DisposalRequest.Update',   // Warehouse Manager
    DISPOSAL_REQUEST_DELETE: 'DisposalRequest.Delete',   // Warehouse Manager

    // Status transitions
    DISPOSAL_REQUEST_SUBMIT_PENDING_APPROVAL: 'DisposalRequest.SubmitPendingApproval', // Warehouse Manager
    DISPOSAL_REQUEST_APPROVE: 'DisposalRequest.Approve',          // Sale Manager
    DISPOSAL_REQUEST_REJECT: 'DisposalRequest.Reject',            // Sale Manager
    DISPOSAL_REQUEST_ASSIGN_FOR_PICKING: 'DisposalRequest.AssignForPicking', // Warehouse Manager

};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMINISTRATOR]: [
        PERMISSIONS.ACCOUNT_VIEW, PERMISSIONS.ACCOUNT_CREATE, PERMISSIONS.ACCOUNT_UPDATE, PERMISSIONS.ACCOUNT_DELETE,
        PERMISSIONS.AREA_VIEW, PERMISSIONS.AREA_CREATE, PERMISSIONS.AREA_UPDATE, PERMISSIONS.AREA_DELETE,
        PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_CREATE, PERMISSIONS.LOCATION_UPDATE, PERMISSIONS.LOCATION_DELETE,
        PERMISSIONS.STORAGE_CONDITION_VIEW, PERMISSIONS.STORAGE_CONDITION_CREATE, PERMISSIONS.STORAGE_CONDITION_UPDATE, PERMISSIONS.STORAGE_CONDITION_DELETE
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
        PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_SM, PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS, PERMISSIONS.PURCHASE_ORDER_APPROVE, PERMISSIONS.PURCHASE_ORDER_REJECT,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_SM, PERMISSIONS.SALES_ORDER_VIEW_DETAILS,
        PERMISSIONS.SALES_ORDER_APPROVE, PERMISSIONS.SALES_ORDER_REJECT_ORDER,
        PERMISSIONS.STOCKTAKING_VIEW, PERMISSIONS.STOCKTAKING_VIEW_SM, PERMISSIONS.STOCKTAKING_VIEW_DETAILS,
        PERMISSIONS.STOCKTAKING_AREA_VIEW_DETAILS_FOR_OTHER,
        PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.DISPOSAL_REQUEST_VIEW, PERMISSIONS.DISPOSAL_REQUEST_VIEW_DETAILS, PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM, PERMISSIONS.DISPOSAL_REQUEST_APPROVE, PERMISSIONS.DISPOSAL_REQUEST_REJECT
    ],

    [ROLES.SALES_REPRESENTATIVE]: [
        PERMISSIONS.GOODS_VIEW,
        PERMISSIONS.SUPPLIER_VIEW,
        PERMISSIONS.RETAILER_VIEW,
        PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_RS, PERMISSIONS.PURCHASE_ORDER_CREATE, PERMISSIONS.PURCHASE_ORDER_UPDATE, PERMISSIONS.PURCHASE_ORDER_DELETE, PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS,
        PERMISSIONS.PURCHASE_ORDER_SUBMIT_DRAFT,
        PERMISSIONS.PURCHASE_ORDER_CONFIRM_ORDERED,
        PERMISSIONS.PURCHASE_ORDER_CHANGE_DELIVERY_DATE,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_SR, PERMISSIONS.SALES_ORDER_CREATE, PERMISSIONS.SALES_ORDER_UPDATE, PERMISSIONS.SALES_ORDER_DELETE, PERMISSIONS.SALES_ORDER_VIEW_DETAILS,
        PERMISSIONS.SALES_ORDER_SUBMIT_PENDING_APPROVAL,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.BACKORDER_CREATE, PERMISSIONS.BACKORDER_UPDATE, PERMISSIONS.BACKORDER_CREATE_SALES_ORDER, PERMISSIONS.BACKORDER_VIEW, PERMISSIONS.BACKORDER_VIEW_DETAILS, PERMISSIONS.BACKORDER_DELETE
    ],

    [ROLES.WAREHOUSE_MANAGER]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.AREA_VIEW,
        PERMISSIONS.LOCATION_VIEW,
        PERMISSIONS.BATCH_VIEW, PERMISSIONS.BATCH_CREATE, PERMISSIONS.BATCH_UPDATE, PERMISSIONS.BATCH_DELETE,
        PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_WM, PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS,
        PERMISSIONS.PURCHASE_ORDER_CONFIRM_GOODS_RECEIVED, PERMISSIONS.PURCHASE_ORDER_ASSIGN_FOR_RECEIVING, PERMISSIONS.PURCHASE_ORDER_REASSIGN_FOR_RECEIVING,
        PERMISSIONS.PURCHASE_ORDER_AWAITINGRRIVAL,
        PERMISSIONS.GOODS_RECEIPT_NOTE_VIEW_DETAILS,
        PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE, PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_WM, PERMISSIONS.SALES_ORDER_VIEW_DETAILS, PERMISSIONS.SALES_ORDER_ASSIGN_PICKING,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_WM, PERMISSIONS.SALES_ORDER_VIEW_DETAILS,
        PERMISSIONS.SALES_ORDER_ASSIGN_FOR_PICKING,
        PERMISSIONS.SALES_ORDER_VIEW_DELIVERY_SLIP,
        PERMISSIONS.PALLET_VIEW, PERMISSIONS.PALLET_VIEW_DETAILS,
        PERMISSIONS.PALLET_PRINT_BARCODE, PERMISSIONS.PALLET_SCAN_BARCODE, PERMISSIONS.PALLET_VIEW_SUGGESTED_LOCATIONS,
        PERMISSIONS.STOCKTAKING_VIEW, PERMISSIONS.STOCKTAKING_VIEW_WM, PERMISSIONS.STOCKTAKING_CREATE, PERMISSIONS.STOCKTAKING_UPDATE, PERMISSIONS.STOCKTAKING_DELETE, PERMISSIONS.STOCKTAKING_VIEW_DETAILS,
        PERMISSIONS.STOCKTAKING_AREA_VIEW_DETAILS_FOR_OTHER,
        PERMISSIONS.STOCKTAKING_REASSIGN_AREA,
        PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.DISPOSAL_REQUEST_VIEW_DETAILS, PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM, PERMISSIONS.DISPOSAL_REQUEST_CREATE, PERMISSIONS.DISPOSAL_REQUEST_UPDATE, PERMISSIONS.DISPOSAL_REQUEST_DELETE,
        PERMISSIONS.DISPOSAL_REQUEST_VIEW, PERMISSIONS.DISPOSAL_REQUEST_SUBMIT_PENDING_APPROVAL, PERMISSIONS.DISPOSAL_REQUEST_ASSIGN_FOR_PICKING, PERMISSIONS.DISPOSAL_REQUEST_GET_EXPIRED_GOODS
    ],

    [ROLES.WAREHOUSE_STAFF]: [
        PERMISSIONS.AREA_VIEW,
        PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_PRINT,
        PERMISSIONS.BATCH_VIEW,
        PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_WS, PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS,
        PERMISSIONS.PURCHASE_ORDER_START_RECEIVE,
        PERMISSIONS.GOODS_RECEIPT_NOTE_VIEW_DETAILS,
        PERMISSIONS.GOODS_RECEIPT_NOTE_COMPLETE_RECEIVING, PERMISSIONS.GOODS_RECEIPT_NOTE_COMPLETE_ARRANGING,
        PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_CANCEL, PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_CHECK,
        PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_WS, PERMISSIONS.SALES_ORDER_VIEW_DETAILS,
        PERMISSIONS.SALES_ORDER_CREATE_DELIVERY_SLIP, PERMISSIONS.SALES_ORDER_VIEW_DELIVERY_SLIP,
        PERMISSIONS.PALLET_VIEW, PERMISSIONS.PALLET_CREATE, PERMISSIONS.PALLET_UPDATE, PERMISSIONS.PALLET_DELETE,
        PERMISSIONS.PALLET_VIEW_DETAILS, PERMISSIONS.PALLET_UPDATE_STATUS, PERMISSIONS.PALLET_PRINT_BARCODE,
        PERMISSIONS.PALLET_SCAN_BARCODE, PERMISSIONS.PALLET_VIEW_SUGGESTED_LOCATIONS, PERMISSIONS.PALLET_CONFIRM_INBOUND_PUTAWAY,
        PERMISSIONS.STOCKTAKING_VIEW, PERMISSIONS.STOCKTAKING_VIEW_WS, PERMISSIONS.STOCKTAKING_VIEW_DETAILS,
        PERMISSIONS.STOCKTAKING_IN_PROGRESS, PERMISSIONS.STOCKTAKING_AREA_VIEW_DETAILS,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.DISPOSAL_REQUEST_VIEW, PERMISSIONS.DISPOSAL_REQUEST_VIEW_DETAILS, PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS
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
    Completed: 9,
    Ordered: 10,
    AwaitingArrival: 11
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

// Stocktaking Status Constants
export const STOCKTAKING_STATUS = {
    Draft: 1,                    // Nháp
    Assigned: 2,                 // Đã phân công
    Cancelled: 3,                // Đã huỷ
    InProgress: 4,               // Đang kiểm kê
    PendingApproval: 5,          // Chờ duyệt
    Approved: 6,                 // Đã duyệt
    Completed: 7                 // Đã hoàn thành
};

// Disposal Request Status Constants
export const DISPOSAL_REQUEST_STATUS = {
    Draft: 1,               // Nháp
    PendingApproval: 2,     // Chờ duyệt
    Rejected: 3,            // Từ chối
    Approved: 4,            // Đã duyệt
    AssignedForPicking: 5,  // Đã phân công
    Picking: 6,             // Đang lấy hàng
    Completed: 7            // Đã xuất hủy
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

    // For warehouse staff, actions are based on being the assigned user, not the creator
    const isAssignedToSelf =
        order?.assignTo?.userId === currentUserId ||
        order?.assignTo?.id === currentUserId ||
        order?.assignTo === currentUserId ||
        order?.assignToId === currentUserId ||
        order?.assignToUserId === currentUserId;

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
            case 'submit_pending_approval':
                // Chỉ có thể submit Draft/Rejected của mình
                const canSubmitDraft = status === SALES_ORDER_STATUS.Draft || status === 1 || status === "1";
                const canSubmitRejected = status === SALES_ORDER_STATUS.Rejected || status === 3 || status === "3";
                return isOwnOrder && (canSubmitDraft || canSubmitRejected);
            case 'approve':
            case 'reject':
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
                return status === SALES_ORDER_STATUS.PendingApproval || status === 2 || status === "2";
            case 'reject':
                // Chỉ có thể reject PendingApproval
                return status === SALES_ORDER_STATUS.PendingApproval || status === 2 || status === "2";
            case 'edit':
            case 'delete':
            case 'submit_pending_approval':
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
            case 'assign_for_picking':
                // Chỉ cho phép phân công/lại nếu trạng thái là Approved hoặc AssignedForPicking (Đã phân công)
                return (
                    status === SALES_ORDER_STATUS.Approved ||
                    status === SALES_ORDER_STATUS.AssignedForPicking ||
                    status === 4 ||
                    status === '4' ||
                    status === 5 ||
                    status === '5'
                );
            case 'view_delivery_slip':
                // Có thể xem delivery slip khi Picking hoặc Completed
                return status === SALES_ORDER_STATUS.Picking || status === SALES_ORDER_STATUS.Completed ||
                    status === 6 || status === "6" || status === 7 || status === "7";
            case 'edit':
            case 'delete':
            case 'approve':
            case 'reject':
            case 'submit_pending_approval':
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
                // Chỉ có thể tạo delivery slip cho AssignedForPicking của chính mình (được phân công)
                return isAssignedToSelf && (status === SALES_ORDER_STATUS.AssignedForPicking || status === 5 || status === "5");
            case 'view_delivery_slip':
                // Có thể xem delivery slip khi Picking hoặc Completed của chính mình (được phân công)
                return isAssignedToSelf && (status === SALES_ORDER_STATUS.Picking || status === SALES_ORDER_STATUS.Completed ||
                    status === 6 || status === "6" || status === 7 || status === "7");
            case 'edit':
            case 'delete':
            case 'approve':
            case 'reject':
            case 'submit_pending_approval':
            case 'assign':
            case 'assign_for_picking':
                return false; // Warehouse Staff không có quyền này
            default:
                return false;
        }
    }

    return false;
};

/**
 * Kiểm tra quyền chi tiết cho Disposal Request dựa trên role và trạng thái
 * @param {string} action - Hành động cần kiểm tra
 * @param {Object} request - Đối tượng disposal request
 * @param {Function} hasPermission - Function kiểm tra permission
 * @param {Object} userInfo - Thông tin user hiện tại
 * @returns {boolean} - Có thể thực hiện hành động không
 */
export const canPerformDisposalRequestDetailAction = (action, request, hasPermission, userInfo) => {
    const currentUserId = userInfo?.userId;

    // Flexible ownership check - handle different possible field structures
    const isOwnRequest =
        request?.createdBy?.userId === currentUserId ||
        request?.createdBy?.id === currentUserId ||
        request?.createdBy === currentUserId ||
        request?.createdById === currentUserId ||
        request?.createdByUserId === currentUserId;

    // For warehouse staff, actions are based on being the assigned user, not the creator
    const isAssignedToSelf =
        request?.assignTo?.userId === currentUserId ||
        request?.assignTo?.id === currentUserId ||
        request?.assignTo === currentUserId ||
        request?.assignToId === currentUserId ||
        request?.assignToUserId === currentUserId;

    const status = request?.status;

    // Warehouse Manager (Quản lý kho)
    if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM)) {
        switch (action) {
            case 'view':
                return true;
            case 'edit':
                // Chỉ có thể edit Draft/Rejected của mình
                const canEditDraft = status === DISPOSAL_REQUEST_STATUS.Draft || status === 1 || status === "1";
                const canEditRejected = status === DISPOSAL_REQUEST_STATUS.Rejected || status === 3 || status === "3";
                return isOwnRequest && (canEditDraft || canEditRejected);
            case 'delete':
                // Chỉ có thể delete Draft của mình
                const canDeleteDraft = status === DISPOSAL_REQUEST_STATUS.Draft || status === 1 || status === "1";
                return isOwnRequest && canDeleteDraft;
            case 'submit_pending_approval':
                // Chỉ có thể submit Draft/Rejected của mình
                const canSubmitDraft = status === DISPOSAL_REQUEST_STATUS.Draft || status === 1 || status === "1";
                const canSubmitRejected = status === DISPOSAL_REQUEST_STATUS.Rejected || status === 3 || status === "3";
                return isOwnRequest && (canSubmitDraft || canSubmitRejected);
            case 'assign_for_picking':
                // Chỉ cho phép phân công/lại nếu trạng thái là Approved hoặc AssignedForPicking
                return (
                    status === DISPOSAL_REQUEST_STATUS.Approved ||
                    status === DISPOSAL_REQUEST_STATUS.AssignedForPicking ||
                    status === 4 ||
                    status === '4' ||
                    status === 5 ||
                    status === '5'
                );
            case 'approve':
            case 'reject':
                return false; // Warehouse Manager không có quyền này
            default:
                return false;
        }
    }

    // Sale Manager (Quản lý kinh doanh)
    if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM)) {
        switch (action) {
            case 'view':
                return true;
            case 'approve':
                // Chỉ có thể approve PendingApproval
                return status === DISPOSAL_REQUEST_STATUS.PendingApproval || status === 2 || status === "2";
            case 'reject':
                // Chỉ có thể reject PendingApproval
                return status === DISPOSAL_REQUEST_STATUS.PendingApproval || status === 2 || status === "2";
            case 'edit':
            case 'delete':
            case 'submit_pending_approval':
            case 'assign_for_picking':
                return false; // Sale Manager không có quyền này
            default:
                return false;
        }
    }

    // Warehouse Staff (Nhân viên kho)
    if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS)) {
        switch (action) {
            case 'view':
                return true;
            case 'edit':
            case 'delete':
            case 'approve':
            case 'reject':
            case 'submit_pending_approval':
            case 'assign_for_picking':
                return false; // Warehouse Staff chỉ có quyền xem
            default:
                return false;
        }
    }

    return false;
};
