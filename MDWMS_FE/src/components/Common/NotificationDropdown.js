import React, { memo, useMemo, useState, useCallback } from "react";
import { NotificationStatus, NotificationCategory } from "../../hooks/useNotifications";
import { RefreshCw, AlertCircle } from "lucide-react";
import { getNotificationDetail, NotificationEntityType } from "../../services/NotificationService";

const CONNECTION_META = {
    connected: {
        description: "Đang đồng bộ",
        dot: "bg-emerald-500",
        color: "text-emerald-600",
    },
    reconnecting: {
        description: "Đang kết nối lại",
        dot: "bg-amber-400",
        color: "text-amber-600",
    },
    disconnected: {
        description: "Đã ngắt kết nối",
        dot: "bg-rose-500",
        color: "text-rose-600",
        hint: "Không nhận được realtime. Hãy load lại trang.",
    },
    error: {
        description: "Lỗi kết nối",
        dot: "bg-rose-500",
        color: "text-rose-600",
        hint: "Không thể kết nối realtime. Kiểm tra mạng hoặc backend.",
    },
    idle: {
        description: "Chưa kết nối",
        dot: "bg-gray-400",
        color: "text-gray-500",
    },
};

// Meta danh mục thông báo — giữ nguyên
const CATEGORY_META = {
    [NotificationCategory.IMPORTANT]: {
        dot: "bg-rose-500",
    },
    [NotificationCategory.NORMAL]: {
        dot: "bg-slate-400",
    },
};

// Format ngày giờ
const formatDateTime = (value) => {
    if (!value) return "Không rõ thời gian";

    try {
        return new Date(value).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return "Không rõ thời gian";
    }
};

const NotificationDropdown = ({
    notifications = [],
    unreadCount = 0,
    loading = false,
    error = null,
    connectionState = "idle",
    onRefresh,
    onMarkAllAsRead,
    onNotificationClick,
    markNotificationsAsRead,
}) => {
    const [filterType, setFilterType] = useState("all");
    const [expandedNotificationIds, setExpandedNotificationIds] = useState(new Set());
    const connectionBadge = CONNECTION_META[connectionState] || CONNECTION_META.idle;

    // Filter notifications based on filterType
    const filteredNotifications = useMemo(() => {
        if (filterType === "important") {
            return notifications.filter(
                (n) => n.category === NotificationCategory.IMPORTANT
            );
        }
        return notifications;
    }, [notifications, filterType]);

    // Calculate unread count for filtered notifications
    const filteredUnreadCount = useMemo(() => {
        return filteredNotifications.filter(
            (n) => n.status === NotificationStatus.UNREAD
        ).length;
    }, [filteredNotifications]);

    const handleNotificationClick = useCallback(
        async (notification) => {
            if (!notification) return;

            try {
                const detail = await getNotificationDetail(notification.notificationId);

                if (detail?.entityType === NotificationEntityType.NO_NAVIGATION) {
                    setExpandedNotificationIds((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(notification.notificationId)) {
                            newSet.delete(notification.notificationId);
                        } else {
                            newSet.add(notification.notificationId);
                        }
                        return newSet;
                    });

                    if (notification.status === NotificationStatus.UNREAD && markNotificationsAsRead) {
                        markNotificationsAsRead([notification.notificationId]);
                    }
                    return;
                }
            } catch (err) {
                console.error("Error getting notification detail:", err);
            }

            onNotificationClick?.(notification);
        },
        [onNotificationClick, markNotificationsAsRead]
    );

    return (
        <div className="fixed top-[75px] right-6 w-[430px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3 mb-2">
                    <p className="text-lg font-semibold text-slate-900">Thông báo</p>
                    <span className="text-slate-400 mb-4">•</span>
                    <p className="text-sm text-gray-500">
                        {filteredUnreadCount > 0
                            ? `${filteredUnreadCount} thông báo chưa đọc`
                            : "Bạn đã đọc tất cả thông báo"}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setFilterType("all")}
                        className={`text-sm font-semibold transition-colors ${filterType === "all"
                            ? "text-orange-600 border-b-2 border-orange-600 pb-1"
                            : "text-slate-700 hover:text-slate-900"
                            }`}
                    >
                        Tất cả
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType("important")}
                        className={`text-sm font-semibold transition-colors ${filterType === "important"
                            ? "text-rose-600 border-b-2 border-rose-600 pb-1"
                            : "text-slate-700 hover:text-slate-900"
                            }`}
                    >
                        Quan trọng
                    </button>
                    {/* <button
                        type="button"
                        onClick={onRefresh}
                        className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900"
                    >
                        <RefreshCw className="w-4 h-4" /> Làm mới
                    </button> */}


                    <span className="text-slate-200">|</span>

                    <button
                        type="button"
                        className={`text-sm font-semibold ${filteredUnreadCount === 0
                            ? "text-slate-300 cursor-not-allowed"
                            : "text-orange-600 hover:text-orange-700"
                            }`}
                        onClick={filteredUnreadCount > 0 ? onMarkAllAsRead : undefined}
                        disabled={filteredUnreadCount === 0}
                    >
                        Đánh dấu đã đọc
                    </button>
                </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
                {connectionBadge?.hint && (
                    <div className="px-3 py-1.5 bg-rose-50 border-b border-rose-100 ">
                        <p className="text-[11px] text-rose-600 mb-0">{connectionBadge.hint}</p>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-h-[420px] overflow-y-auto">
                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                        <div className="w-7 h-7 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                        <span className="text-sm font-medium mt-3">Đang tải thông báo...</span>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && filteredNotifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                        <p className="text-base text-slate-500">
                            {filterType === "important"
                                ? "Chưa có thông báo quan trọng nào"
                                : "Chưa có thông báo nào"}
                        </p>
                    </div>
                )}

                {/* List */}
                {!loading && !error && filteredNotifications.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                        {filteredNotifications.map((notification) => {
                            const isUnread = notification.status === NotificationStatus.UNREAD;
                            const isExpanded = expandedNotificationIds.has(notification.notificationId);
                            const meta =
                                CATEGORY_META[notification.category] || CATEGORY_META[NotificationCategory.NORMAL];

                            return (
                                <li key={notification.notificationId}>
                                    <button
                                        type="button"
                                        className={`w-full text-left px-4 py-4 transition-colors ${isUnread
                                            ? "bg-orange-100 hover:bg-orange-200"
                                            : "hover:bg-slate-50"
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-3">

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p
                                                        className={`text-base font-semibold ${notification.category === NotificationCategory.IMPORTANT
                                                            ? "text-rose-600"
                                                            : isUnread
                                                                ? "text-slate-900"
                                                                : "text-slate-700"
                                                            }`}
                                                    >
                                                        {notification.title}
                                                    </p>

                                                    {notification.category === NotificationCategory.IMPORTANT && (
                                                        <AlertCircle className="w-5 h-5 text-rose-500 ml-auto mb-3" />
                                                    )}
                                                </div>
                                                <p
                                                    className="text-sm text-slate-500 mt-1 leading-snug"
                                                    style={isExpanded ? {} : {
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: notification.content.replace(
                                                            /'(.*?)'/g,
                                                            "<span class='font-bold'>$1</span>"
                                                        ),
                                                    }}
                                                ></p>

                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-[13px] text-gray-400">
                                                        {formatDateTime(notification.createdAt)}
                                                    </span>
                                                    {isUnread && (
                                                        <span className="text-sm font-semibold text-orange-600">
                                                            Chưa đọc
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default memo(NotificationDropdown);