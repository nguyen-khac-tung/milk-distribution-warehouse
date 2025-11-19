import React, { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogoutOutlined, StarOutlined, MenuOutlined, MenuFoldOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";
import { logout } from "../../services/AuthenticationServices";
import AnimatedBell from "../Common/AnimatedBell";
import SearchBar from "../Common/SearchBar";
import { ViewProfileModal } from "../../pages/AccountPage/ViewProfileModal";
import NotificationDropdown from "../Common/NotificationDropdown";
import NotificationDetailModal from "../Common/NotificationDetailModal";
import useNotifications, { NotificationStatus } from "../../hooks/useNotifications";
import { Bell } from "lucide-react";

const HeaderBar = memo(({ onToggleSidebar, sidebarCollapsed }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedNotificationId, setSelectedNotificationId] = useState(null);
    const [showNotificationDetail, setShowNotificationDetail] = useState(false);

    const {
        notifications,
        unreadCount,
        loading: notificationsLoading,
        error: notificationError,
        connectionState: notificationConnectionState,
        refreshNotifications,
        markAllAsRead,
        markNotificationsAsRead,
    } = useNotifications();

    useEffect(() => {
        const savedUser = localStorage.getItem("userInfo");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            navigate("/login");
        }
    }, [navigate]);

    const handleUserMenuClick = useCallback(() => {
        setShowUserMenu(prev => !prev);
    }, []);

    const handleProfileClick = useCallback(() => {
        setShowUserMenu(false);
        setShowProfileModal(true);
    }, []);

    const handleToggleNotifications = useCallback(() => {
        setShowNotifications(prev => {
            const nextState = !prev;
            if (!prev) {
                refreshNotifications();
            }
            return nextState;
        });
    }, [refreshNotifications]);

    const handleMarkAllNotificationsAsRead = useCallback(() => {
        markAllAsRead();
    }, [markAllAsRead]);

    const handleNotificationClick = useCallback(
        (notification) => {
            if (!notification) return;

            setShowNotifications(false);
            setSelectedNotificationId(notification.notificationId);
            setShowNotificationDetail(true);

            if (notification.status === NotificationStatus.UNREAD && notification.notificationId) {
                markNotificationsAsRead([notification.notificationId]);
            }
        },
        [markNotificationsAsRead]
    );
    
    const handleCloseNotificationDetail = useCallback(() => {
        setShowNotificationDetail(false);
        setSelectedNotificationId(null);
    }, []);

    return (
        <>
            <div
                style={{
                    height: 75,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    borderBottom: "1px solid #e5e7eb",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                        onClick={onToggleSidebar}
                        style={{
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "50%",
                            transition: "background-color 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f59e0b",
                            width: 32,
                            height: 32,
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#d97706"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#f59e0b"}
                    >
                        {sidebarCollapsed ? (
                            <MenuOutlined style={{ fontSize: 14, color: "white" }} />
                        ) : (
                            <MenuFoldOutlined style={{ fontSize: 14, color: "white" }} />
                        )}
                    </div>

                    {/* Search Bar */}
                    <SearchBar />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
                    <div style={{ position: "relative" }}>
                        <div className={unreadCount > 0 ? "bell-shake" : ""}>
                            <Bell
                                size={30}
                                color={unreadCount > 0 ? "#f97316" : "#6b7280"}
                                onClick={handleToggleNotifications}
                                className="cursor-pointer"
                            />
                        </div>
                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: -4,
                                    right: -4,
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: 999,
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                            >
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}

                        {showNotifications && (
                            <>
                                <div
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        right: 0,
                                        bottom: 0,
                                        left: 0,
                                        zIndex: 998,
                                    }}
                                    onClick={() => setShowNotifications(false)}
                                />
                                <NotificationDropdown
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    loading={notificationsLoading}
                                    error={notificationError}
                                    connectionState={notificationConnectionState}
                                    onRefresh={refreshNotifications}
                                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                                    onNotificationClick={handleNotificationClick}
                                />
                            </>
                        )}
                    </div>

                    {/* User Section: Avatar + Name + Role */}
                    <div style={{ position: "relative" }}>
                        <div
                            onClick={handleUserMenuClick}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                cursor: "pointer",
                                padding: "4px 8px",
                                borderRadius: 8,
                                transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    backgroundColor: "#c7c7c7ff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                    border: "2px solid #ffffff",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }}
                            >
                                <UserOutlined style={{ fontSize: 18, color: "white" }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                                <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
                                    {user?.fullName || "Người dùng"}
                                </span>
                                <span style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
                                    {user?.roles?.[0]?.description || "Admin"}
                                </span>
                            </div>
                        </div>

                        {/* User Dropdown Menu */}
                        {showUserMenu && (
                            <>
                                {/* Backdrop */}
                                <div
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 998
                                    }}
                                    onClick={() => setShowUserMenu(false)}
                                />

                                {/* Dropdown Content */}
                                <div
                                    style={{
                                        position: "fixed",
                                        top: "72px",
                                        right: 0,
                                        marginTop: 3,
                                        backgroundColor: "#ffffff",
                                        borderRadius: "8px 0 0 8px",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                        border: "1px solid #e5e7eb",
                                        width: "200px",
                                        zIndex: 9999,
                                        overflow: "hidden"
                                    }}
                                >
                                    {/* User Info */}
                                    {/* <div style={{
                                    padding: "16px",
                                    borderBottom: "1px solid #f3f4f6",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px"
                                }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        backgroundColor: "#f59e0b",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <UserOutlined style={{ fontSize: 20, color: "white" }} />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 600,
                                            fontSize: "16px",
                                            color: "#1f2937",
                                            lineHeight: 1.2
                                        }}>
                                            {user?.fullName || "Người dùng"}
                                        </div>
                                        <div style={{
                                            marginTop: 2,
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            lineHeight: 1.2
                                        }}>
                                            {user?.roles?.[0] || "Admin"}
                                        </div>
                                    </div>
                                </div> */}

                                    {/* Menu Items */}
                                    <div style={{ padding: "8px 0" }}>
                                        <div
                                            onClick={handleProfileClick}
                                            style={{
                                                padding: "12px 16px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                cursor: "pointer",
                                                transition: "background-color 0.2s",
                                                color: "#374151"
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = "#f9fafb"}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                        >
                                            <UserOutlined style={{ fontSize: 16, color: "#6b7280" }} />
                                            <span style={{ fontSize: "14px", fontWeight: 400 }}>Thông tin cá nhân</span>
                                        </div>

                                        <div
                                            onClick={handleLogout}
                                            style={{
                                                padding: "12px 16px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                cursor: "pointer",
                                                transition: "background-color 0.2s",
                                                color: "#dc2626"
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = "#fef2f2"}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                        >
                                            <LogoutOutlined style={{ fontSize: 16, color: "#dc2626" }} />
                                            <span style={{ fontSize: "14px", fontWeight: 400 }}>Đăng xuất</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* View Profile Modal */}
            {showProfileModal && (
                <ViewProfileModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                />
            )}

            {showNotificationDetail && (
                <NotificationDetailModal
                    open={showNotificationDetail}
                    notificationId={selectedNotificationId}
                    onClose={handleCloseNotificationDetail}
                />
            )}
        </>
    );
});

HeaderBar.displayName = 'HeaderBar';

export default HeaderBar;