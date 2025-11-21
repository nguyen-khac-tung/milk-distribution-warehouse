import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { baseApi } from "../services/axiosConfig";
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationsAsRead,
    NotificationStatus,
    NotificationCategory,
} from "../services/NotificationService";

const buildHubUrl = () => {
    const envBase = process.env.REACT_APP_API_BASE_URL?.trim();
    const axiosBase = baseApi?.defaults?.baseURL;
    const baseUrl = (envBase || axiosBase || "").replace(/\/+$/, "");

    if (!baseUrl) return "";

    return `${baseUrl.replace(/\/api$/i, "")}/notificationHub`;
};

const generateFallbackId = () => {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const DEFAULT_TITLE = "Thông báo mới";

const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectionState, setConnectionState] = useState("idle");

    const connectionRef = useRef(null);

    const normalizeNotification = useCallback((payload) => {
        if (!payload) return null;

        return {
            notificationId: payload.notificationId || generateFallbackId(),
            title: payload.title?.trim() || DEFAULT_TITLE,
            content: payload.content || "",
            category: payload.category ?? NotificationCategory.NORMAL,
            status: payload.status ?? NotificationStatus.UNREAD,
            userId: payload.userId,
            createdAt: payload.createdAt || new Date().toISOString(),
        };
    }, []);

    const handleIncomingNotification = useCallback(
        (payload) => {
            const normalized = normalizeNotification(payload);
            if (!normalized) return;

            setNotifications((prev) => {
                const existsIndex = prev.findIndex(
                    (item) => item.notificationId === normalized.notificationId
                );

                if (existsIndex !== -1) {
                    const clone = [...prev];
                    clone[existsIndex] = { ...clone[existsIndex], ...normalized };
                    return clone;
                }

                return [normalized, ...prev];
            });

            if (typeof window !== "undefined" && window.showToast) {
                window.showToast(
                    normalized.title || DEFAULT_TITLE,
                    normalized.category === NotificationCategory.IMPORTANT ? "warning" : "info"
                );
            }
        },
        [normalizeNotification]
    );

    const refreshNotifications = useCallback(async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) {
            setNotifications([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Không thể tải danh sách thông báo:", err);
            setError(err.message || "Không thể tải danh sách thông báo");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const hubUrl = buildHubUrl();

        if (!token || !hubUrl) return undefined;

        const connection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        connectionRef.current = connection;

        connection.on("ReceiveNotification", handleIncomingNotification);

        connection
            .start()
            .then(() => setConnectionState("connected"))
            .catch((err) => {
                console.error("Không thể kết nối NotificationHub:", err);
                setConnectionState("error");
            });

        connection.onreconnecting(() => setConnectionState("reconnecting"));
        connection.onreconnected(() => setConnectionState("connected"));
        connection.onclose(() => setConnectionState("disconnected"));

        return () => {
            connection.off("ReceiveNotification", handleIncomingNotification);
            connection.stop();
        };
    }, [handleIncomingNotification]);

    const markNotificationsAsReadHandler = useCallback(async (ids = []) => {
        const validIds = (ids || []).filter(Boolean);
        if (!validIds.length) return;

        try {
            await markNotificationsAsRead(validIds);
            setNotifications((prev) =>
                prev.map((item) =>
                    validIds.includes(item.notificationId)
                        ? { ...item, status: NotificationStatus.READ }
                        : item
                )
            );
        } catch (err) {
            console.error("Không thể cập nhật trạng thái thông báo:", err);
            if (typeof window !== "undefined" && window.showToast) {
                window.showToast(err.message || "Không thể cập nhật thông báo", "error");
            }
        }
    }, []);

    const markAllAsReadHandler = useCallback(async () => {
        if (!notifications.some((item) => item.status === NotificationStatus.UNREAD)) {
            return;
        }

        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) =>
                prev.map((item) => ({ ...item, status: NotificationStatus.READ }))
            );

            if (typeof window !== "undefined" && window.showToast) {
                window.showToast("Đã đánh dấu tất cả thông báo là đã đọc", "success");
            }
        } catch (err) {
            console.error("Không thể đánh dấu tất cả thông báo:", err);
            if (typeof window !== "undefined" && window.showToast) {
                window.showToast(err.message || "Không thể cập nhật thông báo", "error");
            }
        }
    }, [notifications]);

    const unreadCount = useMemo(
        () => notifications.filter((item) => item.status === NotificationStatus.UNREAD).length,
        [notifications]
    );

    return {
        notifications,
        unreadCount,
        loading,
        error,
        connectionState,
        refreshNotifications,
        markAllAsRead: markAllAsReadHandler,
        markNotificationsAsRead: markNotificationsAsReadHandler,
    };
};

export { NotificationStatus, NotificationCategory } from "../services/NotificationService";

export default useNotifications;

