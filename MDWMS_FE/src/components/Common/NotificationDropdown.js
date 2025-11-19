import React, { memo } from "react";
import { NotificationStatus, NotificationCategory } from "../../hooks/useNotifications";
import { RefreshCw } from "lucide-react";

const CONNECTION_META = {
    connected: {
        // label: "Realtime",
        description: "Đang đồng bộ",
        dot: "bg-emerald-500",
        color: "text-emerald-600",
    },
    reconnecting: {
        // label: "Realtime",
        description: "Đang kết nối lại",
        dot: "bg-amber-400",
        color: "text-amber-600",
    },
    disconnected: {
        // label: "Realtime",
        description: "Đã ngắt kết nối",
        dot: "bg-rose-500",
        color: "text-rose-600",
        hint: "Không thể nhận thông báo realtime. Bạn vẫn có thể bấm “Làm mới”.",
    },
    error: {
        // label: "Realtime",
        description: "Lỗi kết nối",
        dot: "bg-rose-500",
        color: "text-rose-600",
        hint: "Không thể kết nối tới NotificationHub. Vui lòng kiểm tra kết nối hoặc chạy lại BE.",
    },
    idle: {
        // label: "Realtime",
        description: "Chưa kết nối",
        dot: "bg-gray-400",
        color: "text-gray-500",
    },
};

const CATEGORY_META = {
    [NotificationCategory.IMPORTANT]: {
        label: "Quan trọng",
        dot: "bg-rose-500",
        pill: "bg-rose-100 text-rose-700",
    },
    [NotificationCategory.NORMAL]: {
        label: "Thông thường",
        dot: "bg-slate-400",
        pill: "bg-slate-100 text-slate-600",
    },
};

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
        <div className="fixed top-[75px] right-0 w-[440px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-slate-900">Thông báo</p>
                    <span className="text-slate-400 mb-4">•</span>
                    <p className="text-xs text-gray-500">
                        {unreadCount > 0
                            ? `${unreadCount} thông báo chưa đọc`
                            : "Bạn đã đọc tất cả thông báo"}
                    </p>
                </div>

                {/* Dòng 3: thanh chức năng */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                        <span className={`w-2 h-2 rounded-full ${connectionBadge.dot}`} />
                        <div className="leading-tight">
                            <span className="text-[11px] font-semibold text-slate-500">
                                {connectionBadge.label}
                            </span>
                            <span className={`block text-[11px] font-medium ${connectionBadge.color}`}>
                                {connectionBadge.description}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                        onClick={onRefresh}
                    >
                        <RefreshCw className="w-3 h-3" />
                        Làm mới
                    </button>

                    <span className="text-slate-200 mb-1">|</span>

                    <button
                        type="button"
                        className={`text-xs font-semibold ${unreadCount === 0
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
                    <div className="px-4 py-3 bg-rose-50 border-b border-rose-100">
                        <p className="text-[11px] text-rose-600">{connectionBadge.hint}</p>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                        <span className="text-xs font-medium mt-3">Đang tải thông báo...</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="px-4 py-6 text-center text-sm text-rose-500">
                        {error}
                        <div className="mt-2">
                            <button
                                type="button"
                                className="text-xs font-semibold text-orange-600"
                                onClick={onRefresh}
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && notifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                        <p className="text-sm text-slate-500">Chưa có thông báo nào</p>
                    </div>
                )}

                {!loading && !error && notifications.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                        {notifications.map((notification) => {
                            const isUnread = notification.status === NotificationStatus.UNREAD;
                            const meta = CATEGORY_META[notification.category] || CATEGORY_META[NotificationCategory.NORMAL];

                            return (
                                <li key={notification.notificationId}>
                                    <button
                                        type="button"
                                        className={`w-full text-left px-4 py-3 transition-colors ${
                                            isUnread
                                                ? "bg-orange-50/80 hover:bg-orange-100"
                                                : "hover:bg-slate-50"
                                        }`}
                                        onClick={() => onNotificationClick?.(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`mt-2 w-2 h-2 rounded-full ${meta.dot}`}
                                                aria-hidden="true"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p
                                                        className={`text-sm font-semibold ${
                                                            isUnread ? "text-slate-900" : "text-slate-700"
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                    <span
                                                        className={`text-[10px] font-semibold px-2 py-0.5 mb-3 rounded-full ${meta.pill}`}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                </div>
                                                <p
                                                    className="text-xs text-slate-500 mt-1"
                                                    style={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {notification.content}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[11px] text-gray-400">
                                                        {formatDateTime(notification.createdAt)}
                                                    </span>
                                                    {isUnread && (
                                                        <span className="text-[11px] font-semibold text-orange-600">
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

