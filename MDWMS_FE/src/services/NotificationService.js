import api from "./api";

export const NotificationStatus = {
    READ: 1,
    UNREAD: 2,
    DELETED: 3,
};

export const NotificationCategory = {
    NORMAL: 1,
    IMPORTANT: 2,
};

export const NotificationEntityType = {
    PURCHASE_ORDER: 1,
    SALE_ORDER: 2,
    GOODS_RECEIPT_NOTE: 3,
    GOODS_ISSUE_NOTE: 4,
    DISPOSAL_REQUEST: 5,
    DISPOSAL_NOTE: 6,
    STOCKTAKING_SHEET: 7,
    INVENTORY_REPORT: 8,
    NO_NAVIGATION: 9,
    STOCKTAKING_AREA_STAFF: 10,
    STOCKTAKING_AREA_MANAGER: 11
};

const unwrapResponse = (response, fallbackMessage = "Không thể xử lý yêu cầu thông báo.") => {
    const payload = response?.data ?? {};
    const statusCode = payload?.status ?? response?.status ?? 200;

    if (statusCode >= 400) {
        throw new Error(payload?.message || fallbackMessage);
    }

    return payload;
};

export const getNotifications = async () => {
    const res = await api.get("/Notification/GetNotifications");
    const payload = unwrapResponse(res, "Không thể tải danh sách thông báo.");
    return payload?.data ?? [];
};

/**
 * Get notification detail - returns NotificationDetailDto with EntityType and EntityId
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{notificationId: string, entityType: number, entityId: string}>}
 */
export const getNotificationDetail = async (notificationId) => {
    if (!notificationId) {
        throw new Error("Thiếu thông tin thông báo cần xem chi tiết.");
    }

    try {
        const res = await api.get(`/Notification/GetNotificationDetail/${notificationId}`);
        const payload = unwrapResponse(res, "Không thể tải chi tiết thông báo.");
        return payload?.data;
    } catch (err) {
        // Extract error message from response
        const errorMessage = err?.response?.data?.message || 
                            err?.response?.data?.data?.message ||
                            err?.message || 
                            "Không thể tải chi tiết thông báo.";
        
        // Create new error with proper message
        const error = new Error(errorMessage);
        error.status = err?.response?.status;
        error.originalError = err;
        throw error;
    }
};

/**
 * Map EntityType to route path
 * @param {number} entityType - NotificationEntityType constant
 * @param {string} entityId - Entity ID (optional for some entity types)
 * @returns {string|null} - Route path or null if invalid
 */
export const getEntityRoute = (entityType, entityId) => {
    switch (entityType) {
        case NotificationEntityType.PURCHASE_ORDER:
            if (!entityId) return null;
            return `/purchase-orders/${entityId}`;
        case NotificationEntityType.SALE_ORDER:
            if (!entityId) return null;
            return `/sales-orders/${entityId}`;
        case NotificationEntityType.GOODS_RECEIPT_NOTE:
            if (!entityId) return null;
            return `/goods-receipt-notes/${entityId}`;
        case NotificationEntityType.GOODS_ISSUE_NOTE:
            if (!entityId) return null;
            return `/goods-issue-note-detail/${entityId}`;
        case NotificationEntityType.DISPOSAL_REQUEST:
            if (!entityId) return null;
            return `/disposal/${entityId}`;
        case NotificationEntityType.DISPOSAL_NOTE:
            if (!entityId) return null;
            return `/disposal-note-detail/${entityId}`;
        case NotificationEntityType.STOCKTAKING_SHEET:
            if (!entityId) return null;
            return `/stocktakings/${entityId}`;
        case NotificationEntityType.INVENTORY_REPORT:
            // Thông báo về báo cáo tồn kho - link đến trang báo cáo tồn kho
            return `/reports/inventory`;
        case NotificationEntityType.NO_NAVIGATION:
            // Thông báo không có navigation - chỉ đánh dấu đã đọc, không điều hướng
            return null;
        case NotificationEntityType.STOCKTAKING_AREA_STAFF:
            return `/stocktaking-area/${entityId}`;
        case NotificationEntityType.STOCKTAKING_AREA_MANAGER:
            return `/stocktaking-area-detail-other/${entityId}`;
        default:
            return null;
    }
};

export const markAllNotificationsAsRead = async () => {
    const res = await api.put("/Notification/MarkAllAsRead");
    return unwrapResponse(res, "Không thể đánh dấu tất cả thông báo.");
};

export const markNotificationsAsRead = async (notificationIds = []) => {
    if (!notificationIds.length) return;

    const res = await api.put("/Notification/MarkAsRead", {
        notificationIds,
    });

    return unwrapResponse(res, "Không thể cập nhật trạng thái thông báo.");
};

