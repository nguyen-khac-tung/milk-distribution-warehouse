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
                background: "#237486",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                boxShadow: "0 1px 1px #f0f1f2",
                position: "sticky",
                top: 0,
                zIndex: 100,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                    onClick={onToggleSidebar}
                    style={{
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                    {sidebarCollapsed ? (
                        <MenuOutlined style={{ fontSize: 18, color: "white" }} />
                    ) : (
                        <MenuFoldOutlined style={{ fontSize: 18, color: "white" }} />
                    )}
                </div>
                <StarOutlined style={{ fontSize: 20, color: "white" }} />
                <span style={{ fontWeight: 600, fontSize: 18, color: "white" }}>
                    Kho Phân Phối Sữa
                </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <BellOutlined
                    style={{ fontSize: 22, color: "white", cursor: "pointer" }}
                    title="Thông báo"
                />
                <LogoutOutlined
                    style={{ fontSize: 22, color: "white", cursor: "pointer" }}
                    title="Đăng xuất"
                    onClick={handleLogout}
                />
            </div>
        </div>
    );
};

export default HeaderBar;
