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

export const getNotificationDetail = async (notificationId) => {
    if (!notificationId) {
        throw new Error("Thiếu thông tin thông báo cần xem chi tiết.");
    }

    const res = await api.get(`/Notification/GetNotificationDetail/${notificationId}`);
    const payload = unwrapResponse(res, "Không thể tải chi tiết thông báo.");
    return payload?.data;
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

