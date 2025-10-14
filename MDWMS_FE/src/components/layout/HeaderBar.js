import React from "react";
import { useNavigate } from "react-router-dom";
import { LogoutOutlined, BellOutlined, StarOutlined, MenuOutlined, MenuFoldOutlined } from "@ant-design/icons";
import { logout } from "../../services/AuthenticationServices";

const HeaderBar = ({ onToggleSidebar, sidebarCollapsed }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            navigate("/login");
        }
    };

    return (
        <div
            style={{
                height: 64,
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

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <BellOutlined
                    style={{ fontSize: 20, color: "#6b7280", cursor: "pointer" }}
                    title="Thông báo"
                />
                <LogoutOutlined
                    style={{ fontSize: 20, color: "#6b7280", cursor: "pointer" }}
                    title="Đăng xuất"
                    onClick={handleLogout}
                />
            </div>
        </div>
    );
};

export default HeaderBar;
