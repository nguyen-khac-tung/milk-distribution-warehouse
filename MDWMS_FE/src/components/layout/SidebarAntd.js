import React from "react";
import { Menu } from "antd";
import {
    DashboardOutlined,
    ShoppingOutlined,
    ShoppingCartOutlined,
    BarChartOutlined,
    SettingOutlined
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
    const location = useLocation();
    // const navigate = useNavigate();

    const menuItems = [
        {
            key: "/admin/dashboard",
            icon: <DashboardOutlined />,
            label: <Link to="/admin/dashboard">Dashboard</Link>,
        },
        {
            key: "/admin/products",
            icon: <ShoppingOutlined />,
            label: <Link to="/admin/products">Sản phẩm</Link>,
        },
        {
            key: "/admin/orders",
            icon: <ShoppingCartOutlined />,
            label: <Link to="/admin/orders">Đơn hàng</Link>,
        },
        {
            key: "/admin/reports",
            icon: <BarChartOutlined />,
            label: <Link to="/admin/reports">Báo cáo</Link>,
        },
        {
            key: "/admin/settings",
            icon: <SettingOutlined />,
            label: <Link to="/admin/settings">Cài đặt</Link>,
        },
        // {
        //     key: "logout",
        //     icon: <LogoutOutlined />,
        //     label: <span onClick={() => navigate("/auth/login")}>Đăng xuất</span>,
        // },
    ];

    return (
        <aside
            style={{
                position: "fixed",
                left: 0,
                top: 64, // Bắt đầu ngay dưới header
                bottom: 0,
                width: 240,
                background: "#fff",
                boxShadow: "2px 0 8px #f0f1f2",
                display: "flex",
                flexDirection: "column",
                zIndex: 10,
            }}
        >
            {/* Header của sidebar */}
            <div
                style={{
                    padding: "16px",
                    fontWeight: 700,
                    fontSize: 18,
                    textAlign: "center",
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                    lineHeight: 1.4,
                    borderBottom: "1px solid #f0f0f0", // 👈 thêm border ngăn cách
                    flexShrink: 0, // 👈 giữ cố định chiều cao
                }}
            >
                Nhân viên kinh doanh
            </div>

            {/* Menu chiếm phần còn lại */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                />
            </div>
        </aside>


    );
};

export default Sidebar;
