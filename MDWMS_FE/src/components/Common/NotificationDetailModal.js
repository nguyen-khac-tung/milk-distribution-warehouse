import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
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
                
                if (data?.entityType && data?.entityId) {
                    const route = getEntityRoute(data.entityType, data.entityId);
                    if (route) {
                        onClose();
                        navigate(route);
                        setTimeout(() => {
                            window.location.reload();
                        }, 100);
                        return;
                    }
                }
                
                setError("Trang này hiện tại không tìm thấy.");
            })
            .catch((err) => {
                if (!isMounted) return;
                
                const errorMessage = err.message || 
                                    err.originalError?.response?.data?.message ||
                                    err.originalError?.response?.data?.data?.message ||
                                    "Không thể tải chi tiết thông báo";
                
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
    }, [notificationId, open, navigate, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border border-gray-100">
                {/* Header */}
                <div className="p-8 text-center">
                    {loading ? (
                        <>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 border-2 border-orange-100">
                                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Đang tải...</h2>
                            <p className="text-gray-600 text-lg">Đang xử lý thông báo của bạn</p>
                        </>
                    ) : error ? (
                        <>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border-2 border-red-100">
                                <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Lỗi</h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {error}
                            </p>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {!loading && error && (
                    <div className="flex gap-4 p-8 pt-0 justify-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                            Đóng
                        </Button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default NotificationDetailModal;
