import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

const AdminLayout = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Kiểm tra kích thước màn hình
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            // Tự động thu gọn sidebar trên mobile
            if (window.innerWidth <= 768) {
                setSidebarCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleLogout = () => {
        // Xóa token và chuyển về trang login
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", position: "relative" }}>
            <Sidebar collapsed={sidebarCollapsed} isMobile={isMobile} />

            {isMobile && !sidebarCollapsed && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 5,
                    }}
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}

            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 280),
                transition: 'margin-left 0.3s ease-in-out',
                minHeight: "100vh"
            }}>
                <HeaderBar
                    onLogout={handleLogout}
                    onToggleSidebar={toggleSidebar}
                    sidebarCollapsed={sidebarCollapsed}
                />
                <main
                    style={{
                        padding: isMobile ? 16 : 24,
                        paddingTop: 16,
                        transition: 'padding 0.3s ease-in-out',
                        minHeight: 'calc(100vh - 64px)',
                        backgroundColor: "#f8fafc",
                        flex: 1,
                        overflow: "auto"
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
