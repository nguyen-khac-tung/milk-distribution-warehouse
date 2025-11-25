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

        // Extract title and content - handle both camelCase and PascalCase
        const title = payload.title?.trim() || payload.Title?.trim() || "";
        const content = payload.content || payload.Content || "";

        // Only use DEFAULT_TITLE if title is truly empty (shouldn't happen from BE)
        // But we still need to ensure we have a valid notification
        if (!title && !content) {
            return null;
        }

        return {
            notificationId: payload.notificationId || payload.NotificationId || generateFallbackId(),
            title: title || DEFAULT_TITLE, // Use actual title, fallback only if empty
            content: content,
            category: payload.category ?? payload.Category ?? NotificationCategory.NORMAL,
            status: payload.status ?? payload.Status ?? NotificationStatus.UNREAD,
            userId: payload.userId ?? payload.UserId,
            createdAt: payload.createdAt || payload.CreatedAt || new Date().toISOString(),
        };
    }, []);

    const handleIncomingNotification = useCallback(
        (payload) => {
            // Handle both array and single object payloads
            const notificationsToProcess = Array.isArray(payload) ? payload : [payload];
            
            if (notificationsToProcess.length === 0) {
                return;
            }

            // Normalize all notifications first
            const normalizedList = [];
            notificationsToProcess.forEach((rawNotification) => {
                const normalized = normalizeNotification(rawNotification);
                if (normalized) {
                    normalizedList.push(normalized);
                }
            });

            if (normalizedList.length === 0) {
                return;
            }

            setNotifications((prev) => {
                const updated = [...prev];
                const seenIds = new Set(updated.map(n => n.notificationId));
                
                normalizedList.forEach((normalized) => {
                    // Skip if already in current list
                    if (seenIds.has(normalized.notificationId)) {
                        // Update existing notification
                        const existsIndex = updated.findIndex(
                            (item) => item.notificationId === normalized.notificationId
                        );
                        if (existsIndex !== -1) {
                            updated[existsIndex] = { ...updated[existsIndex], ...normalized };
                        }
                    } else {
                        // Add new notification at the beginning
                        updated.unshift(normalized);
                        seenIds.add(normalized.notificationId);
                    }
                });

                // Remove duplicates (in case of same notificationId appearing multiple times)
                const uniqueNotifications = [];
                const uniqueIds = new Set();
                updated.forEach((notification) => {
                    if (!uniqueIds.has(notification.notificationId)) {
                        uniqueNotifications.push(notification);
                        uniqueIds.add(notification.notificationId);
                    }
                });

                return uniqueNotifications;
            });

            // Show toast for new notifications
            if (normalizedList.length > 0) {
                const firstNormalized = normalizedList[0];
                
                // Show toast immediately
                if (typeof window !== "undefined" && window.showToast) {
                    try {
                        window.showToast(
                            DEFAULT_TITLE,
                            firstNormalized.category === NotificationCategory.IMPORTANT ? "warning" : "info"
                        );
                    } catch (err) {
                        // Silent fail
                    }
                }
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
            const notificationsList = Array.isArray(data) ? data : [];
            
            // Remove duplicates based on notificationId
            const uniqueNotifications = [];
            const seenIds = new Set();
            notificationsList.forEach((notification) => {
                const id = notification.notificationId || notification.NotificationId;
                if (id && !seenIds.has(id)) {
                    uniqueNotifications.push(notification);
                    seenIds.add(id);
                }
            });
            
            setNotifications(uniqueNotifications);
        } catch (err) {
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
            .then(() => {
                setConnectionState("connected");
            })
            .catch((err) => {
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
                // window.showToast("Đã đánh dấu tất cả thông báo là đã đọc", "success");
            }
        } catch (err) {
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

export { 
    NotificationStatus, 
    NotificationCategory,
    NotificationEntityType,
    getEntityRoute
} from "../services/NotificationService";

export default useNotifications;

