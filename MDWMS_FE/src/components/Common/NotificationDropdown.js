import React, { memo, useMemo } from "react";
import { NotificationStatus, NotificationCategory } from "../../hooks/useNotifications";
import { RefreshCw, AlertCircle } from "lucide-react";

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
        hint: "Không nhận được realtime. Hãy thử bấm “Làm mới”.",
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
}) => {
    const connectionBadge = CONNECTION_META[connectionState] || CONNECTION_META.idle;

    return (
        <div className="fixed top-[75px] right-6 w-[430px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3 mb-2">
                    <p className="text-lg font-semibold text-slate-900">Thông báo</p>
                    <span className="text-slate-400 mb-4">•</span>
                    <p className="text-sm text-gray-500">
                        {unreadCount > 0
                            ? `${unreadCount} thông báo chưa đọc`
                            : "Bạn đã đọc tất cả thông báo"}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900"
                        onClick={onRefresh}
                    >
                        <RefreshCw className="w-4 h-4" /> Làm mới
                    </button>

                    <span className="text-slate-200">|</span>

                    <button
                        type="button"
                        className={`text-sm font-semibold ${unreadCount === 0
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-orange-600 hover:text-orange-700"
                            }`}
                        onClick={unreadCount > 0 ? onMarkAllAsRead : undefined}
                        disabled={unreadCount === 0}
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
                {!loading && !error && notifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                        <p className="text-base text-slate-500">Chưa có thông báo nào</p>
                    </div>
                )}

                {/* List */}
                {!loading && !error && notifications.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                        {notifications.map((notification) => {
                            const isUnread = notification.status === NotificationStatus.UNREAD;
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
                                        onClick={() => onNotificationClick?.(notification)}
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
                                                    style={{
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