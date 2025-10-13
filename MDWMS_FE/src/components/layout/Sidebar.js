import React, { useEffect, useState } from "react";
import { Menu, Avatar } from "antd";
import {
    DashboardOutlined,
    ShoppingOutlined,
    ShoppingCartOutlined,
    BarChartOutlined,
    SettingOutlined,
    EnvironmentOutlined,
    UsergroupAddOutlined,
    ClusterOutlined,
    AppstoreOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { ComponentIcon } from "../../components/IconComponent/Icon";

const Sidebar = ({ collapsed, isMobile }) => {
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("userInfo");
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    const role = user?.roles?.[0] || "Guest";

    // màu trắng cho mũi tên dropdown
    const arrowWhiteStyle = `
        .ant-menu-submenu-arrow {
            color: white !important;
        }
    `;

    const menuItems = [
        {
            key: "/admin/accounts",
            icon: <UsergroupAddOutlined />,
            label: "Quản lý tài khoản",
        },
        {
            key: "/sales-manager/categorys",
            icon: <ComponentIcon name="category" size={15} collapsed={collapsed} />,
            label: "Quản lý danh mục",
        },
        {
            key: "/sales-manager/unitMeasures",
            icon: <ComponentIcon name="unitMeasure" size={15} collapsed={collapsed} />,
            label: "Quản lý đơn vị",
        },
        {
            key: "/sales-manager/goods",
            icon: <ComponentIcon name="milk" size={15} collapsed={collapsed} />,
            label: "Quản lý hàng hóa",
        },
        {
            key: "partner-management",
            icon: <ComponentIcon name="partner" size={15} collapsed={collapsed} />,
            label: "Quản lý đối tác",
            children: [
                {
                    key: "/sales-manager/suppliers",
                    icon: <ComponentIcon name="supplier" size={15} collapsed={collapsed} />,
                    label: "Quản lý nhà cung cấp",
                },
                {
                    key: "/sales-manager/retailers",
                    icon: <ComponentIcon name="retailer" size={15} collapsed={collapsed} />,
                    label: "Quản lý nhà bán lẻ",
                },
            ],
        },
        {
            key: "location-management",
            icon: <EnvironmentOutlined />,
            label: "Quản lý vị trí và khu vực",
            children: [
                {
                    key: "/admin/areas",
                    icon: <AppstoreOutlined />,
                    label: "Quản lý khu vực",
                },
                {
                    key: "/admin/locations",
                    icon: <ClusterOutlined />,
                    label: "Quản lý vị trí",
                },
                {
                    key: "/admin/storage-condition",
                    icon: <ComponentIcon name="storageCondition" size={15} collapsed={collapsed} />,
                    label: "Quản lý điều kiện bảo quản",
                },
            ],
        },
        {
            key: "/admin/dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
        },
        {
            key: "/admin/reports",
            icon: <BarChartOutlined />,
            label: "Báo cáo",
        },
        {
            key: "/admin/settings",
            icon: <SettingOutlined />,
            label: "Cài đặt",
        },
    ];

    // Hàm render icon có màu động (đen nếu được chọn)
    const renderIcon = (icon, active) => {
        // nếu là ComponentIcon custom
        if (icon?.type?.name === "ComponentIcon") {
            return React.cloneElement(icon, { color: active ? "black" : "white" });
        }
        // nếu là icon Ant Design
        return React.cloneElement(icon, {
            style: { color: active ? "black" : "white" },
        });
    };

    const getInitial = (name) => {
        if (!name) return "?";
        const words = name.trim().split(" ");
        return words[words.length - 1][0].toUpperCase();
    };

    return (
        <>
            <style>{arrowWhiteStyle}</style>

            <aside
                className={collapsed ? "" : "sidebar-container"}
                style={{
                    position: "fixed",
                    left: 0,
                    top: 64,
                    bottom: 0,
                    width: collapsed ? 80 : 280,
                    background: "#237486",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 10,
                    transition: "width 0.3s ease-in-out, transform 0.3s ease-in-out",
                    overflow: "hidden",
                    transform: isMobile && collapsed ? "translateX(-100%)" : "translateX(0)",
                    boxShadow: isMobile ? "2px 0 8px rgba(0,0,0,0.15)" : "none",
                }}
            >
                {/* Thông tin user */}
                <div
                    style={{
                        padding: collapsed ? "20px 12px" : "20px 16px",
                        borderBottom: "1px solid #e9ecef",
                        display: "flex",
                        justifyContent: collapsed ? "center" : "flex-start",
                        alignItems: "center",
                    }}
                >
                    <Avatar
                        size={collapsed ? 40 : 50}
                        style={{
                            background: "#ffc107",
                            color: "white",
                            fontWeight: "bold",
                        }}
                    >
                        {getInitial(user?.fullName || "U")}
                    </Avatar>
                    {!collapsed && (
                        <div style={{ marginLeft: 12, color: "white" }}>
                            <div style={{ fontWeight: 600, fontSize: 16 }}>
                                {user?.fullName || "Người dùng"}
                            </div>
                            <div style={{ fontSize: 12 }}>
                                Chức vụ: {role}
                            </div>
                        </div>
                    )}
                </div>

                {/* Menu */}
                <div className="sidebar-scroll" style={{ flex: 1, background: "#237486" }}>
                    <Menu
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={menuItems.map((item) => {
                            // Kiểm tra active cho item
                            const isActive =
                                location.pathname === item.key ||
                                item.children?.some((c) => c.key === location.pathname);

                            // Nếu là submenu cha
                            if (item.children) {
                                return {
                                    ...item,
                                    icon: renderIcon(item.icon, isActive),
                                    label: collapsed ? null : <span style={{ color: "white" }}>{item.label}</span>,
                                    children: item.children.map((sub) => ({
                                        ...sub,
                                        icon: sub.icon
                                            ? renderIcon(sub.icon, location.pathname === sub.key)
                                            : null,
                                        label: collapsed ? null : (
                                            <Link
                                                to={sub.key}
                                                style={{
                                                    color:
                                                        location.pathname === sub.key
                                                            ? "black"
                                                            : "white",
                                                }}
                                            >
                                                {sub.label}
                                            </Link>
                                        ),
                                    })),
                                };
                            }

                            // Nếu là menu con bình thường
                            return {
                                ...item,
                                icon: renderIcon(item.icon, isActive),
                                label: collapsed ? null : (
                                    <Link
                                        to={item.key}
                                        style={{
                                            color: isActive ? "black" : "white",
                                        }}
                                    >
                                        {item.label}
                                    </Link>
                                ),
                            };
                        })}
                        style={{
                            borderRight: 0,
                            backgroundColor: "#237486",
                        }}
                        defaultOpenKeys={collapsed ? [] : ["location-management"]}
                        inlineCollapsed={collapsed}
                    />
                </div>
            </aside>
        </>
    );
};

export default Sidebar;