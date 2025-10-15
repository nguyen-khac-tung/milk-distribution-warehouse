import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogoutOutlined, StarOutlined, MenuOutlined, MenuFoldOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";
import { logout } from "../../services/AuthenticationServices";
import AnimatedBell from "../Common/AnimatedBell";

const HeaderBar = ({ onToggleSidebar, sidebarCollapsed }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem("userInfo");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            navigate("/login");
        }
    };

    const handleUserMenuClick = () => {
        setShowUserMenu(!showUserMenu);
    };

    const handleProfileClick = () => {
        setShowUserMenu(false);
        // Navigate to profile page
        console.log("Navigate to profile");
    };

    return (
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
            <div style={{ display: "flex", alignItems: "center" }}>
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
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
                <AnimatedBell
                    size={35}
                    color="#6b7280"
                    duration="3s"
                    delay="2s"
                    title="Thông báo"
                />

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
                                {user?.roles?.[0] || "Admin"}
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
    );
};

export default HeaderBar;
