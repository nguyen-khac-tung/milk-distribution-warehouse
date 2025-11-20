import React, { useEffect, useState } from "react";
import Loading from "./Loading";
import {
    getNotificationDetail,
    NotificationCategory,
    NotificationStatus,
} from "../../services/NotificationService";

const CATEGORY_LABELS = {
    [NotificationCategory.IMPORTANT]: { label: "Quan trọng", color: "text-rose-600" },
    [NotificationCategory.NORMAL]: { label: "Thông thường", color: "text-slate-500" },
};

const STATUS_LABELS = {
    [NotificationStatus.UNREAD]: { label: "Chưa đọc", color: "text-orange-600" },
    [NotificationStatus.READ]: { label: "Đã đọc", color: "text-emerald-600" },
};

const formatFullDate = (value) => {
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

const NotificationDetailModal = ({ notificationId, open, onClose }) => {
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || !notificationId) {
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        getNotificationDetail(notificationId)
            .then((data) => {
                if (isMounted) {
                    setNotification(data || null);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error("Không thể tải chi tiết thông báo:", err);
                    setError(err.message || "Không thể tải chi tiết thông báo");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [notificationId, open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-lg font-semibold text-slate-800">Chi tiết thông báo</p>
                        <p className="text-xs text-gray-500">Thông tin chi tiết từ hệ thống</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900 transition-colors"
                        aria-label="Đóng"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 py-5 min-h-[200px]">
                    {loading && <Loading size="medium" text="Đang tải thông báo..." />}

                    {!loading && error && (
                        <div className="text-center text-sm text-rose-500">
                            {error}
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg"
                                    onClick={onClose}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}

                    {!loading && !error && !notification && (
                        <div className="text-center text-sm text-slate-500">
                            Không tìm thấy thông báo tương ứng.
                        </div>
                    )}

                    {!loading && !error && notification && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Tiêu đề</p>
                                <p className="text-lg font-semibold text-slate-900 mt-1">{notification.title}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Nội dung</p>
                                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
                                    {notification.content}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Thể loại</p>
                                    <p className={`text-sm font-semibold ${CATEGORY_LABELS[notification.category]?.color || "text-slate-600"}`}>
                                        {CATEGORY_LABELS[notification.category]?.label || "Không xác định"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Trạng thái</p>
                                    <p className={`text-sm font-semibold ${STATUS_LABELS[notification.status]?.color || "text-slate-600"}`}>
                                        {STATUS_LABELS[notification.status]?.label || "Không xác định"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Thời gian</p>
                                <p className="text-sm text-slate-600">{formatFullDate(notification.createdAt)}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailModal;

