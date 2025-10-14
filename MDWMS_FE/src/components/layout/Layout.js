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
        <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            <HeaderBar
                onLogout={handleLogout}
                onToggleSidebar={toggleSidebar}
                sidebarCollapsed={sidebarCollapsed}
            />
            <Sidebar collapsed={sidebarCollapsed} isMobile={isMobile} />

            {isMobile && !sidebarCollapsed && (
                <div
                    style={{
                        position: "fixed",
                        top: 64,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 5,
                    }}
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}

            <main
                style={{
                    padding: isMobile ? 16 : 24,
                    paddingLeft: isMobile ? 16 : (sidebarCollapsed ? 100 : 300), 
                    transition: 'padding-left 0.3s ease-in-out, padding 0.3s ease-in-out',
                    minHeight: 'calc(100vh - 64px)',
                }}
            >
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
