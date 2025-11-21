import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import {
    getNotificationDetail,
    getEntityRoute,
} from "../../services/NotificationService";

const NotificationDetailModal = ({ notificationId, open, onClose }) => {
    const navigate = useNavigate();
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
                if (!isMounted) return;
                
                // Auto-navigate if entity exists
                if (data?.entityType && data?.entityId) {
                    const route = getEntityRoute(data.entityType, data.entityId);
                    if (route) {
                        onClose();
                        navigate(route);
                        return;
                    }
                }
                
                // If no entity or invalid route, show error
                setError("Không thể xác định trang chi tiết cho thông báo này.");
            })
            .catch((err) => {
                if (!isMounted) return;
                
                console.error("Không thể tải chi tiết thông báo:", err);
                
                // Extract error message
                const errorMessage = err.message || 
                                    err.originalError?.response?.data?.message ||
                                    err.originalError?.response?.data?.data?.message ||
                                    "Không thể tải chi tiết thông báo";
                
                // Check if error is about entity not found (400 Bad Request from BE)
                const lowerMessage = errorMessage.toLowerCase();
                if (lowerMessage.includes("không tìm thấy") || 
                    lowerMessage.includes("trang này hiện tại không tìm thấy") ||
                    lowerMessage.includes("notification id is null") ||
                    err.status === 400) {
                    setError("Trang này hiện tại không tìm thấy.");
                } else {
                    setError(errorMessage);
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
                        <p className="text-sm text-gray-500">Thông tin chi tiết từ hệ thống</p>
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
                        <div className="text-center text-base text-rose-500">
                            {error}
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-base font-semibold text-white bg-orange-500 rounded-lg"
                                    onClick={onClose}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default NotificationDetailModal;

