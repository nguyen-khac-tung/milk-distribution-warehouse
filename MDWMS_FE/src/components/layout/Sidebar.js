import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Menu } from "antd";
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
    DownOutlined,
    RightOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { ComponentIcon } from "../../components/IconComponent/Icon";

const Sidebar = ({ collapsed, isMobile, onToggleSidebar }) => {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [openKeys, setOpenKeys] = useState([]);

    useEffect(() => {
        const savedUser = localStorage.getItem("userInfo");
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    // Xác định submenu nào cần mở dựa trên path hiện tại
    const getOpenKeysFromPath = useCallback((pathname) => {
        const keys = [];
        if (pathname.startsWith('/sales-manager/suppliers') || pathname.startsWith('/sales-manager/retailers')) {
            keys.push('partner-management');
        }
        if (pathname.startsWith('/admin/areas') || pathname.startsWith('/admin/locations') || pathname.startsWith('/admin/storage-condition')) {
            keys.push('location-management');
        }
        return keys;
    }, []);

    useEffect(() => {
        if (!collapsed) {
            setOpenKeys(getOpenKeysFromPath(location.pathname));
        } else {
            setOpenKeys([]);
        }
    }, [collapsed, location.pathname, getOpenKeysFromPath]);

    const role = user?.roles?.[0] || "Guest";

    const menuItems = useMemo(() => [
        {
            key: "/admin/dashboard",
            icon: <DashboardOutlined style={{ color: '#000000' }} />,
            label: "Dashboard",
        },
        {
            key: "/admin/accounts",
            icon: <UsergroupAddOutlined style={{ color: '#000000' }} />,
            label: "Quản lý tài khoản",
        },
        {
            key: "/sales-manager/categorys",
            icon: <ComponentIcon name="category" size={16} collapsed={collapsed} />,
            label: "Quản lý danh mục",
        },
        {
            key: "/sales-manager/unitMeasures",
            icon: <ComponentIcon name="unitMeasure" size={16} collapsed={collapsed} />,
            label: "Quản lý đơn vị",
        },
        {
            key: "/sales-manager/goods",
            icon: <ComponentIcon name="milk" size={16} collapsed={collapsed} />,
            label: "Quản lý hàng hóa",
        },
        {
            key: "partner-management",
            icon: <ComponentIcon name="partner" size={16} collapsed={collapsed} />,
            label: "Quản lý đối tác",
            children: [
                {
                    key: "/sales-manager/suppliers",
                    icon: <ComponentIcon name="supplier" size={14} collapsed={collapsed} />,
                    label: "Quản lý nhà cung cấp",
                },
                {
                    key: "/sales-manager/retailers",
                    icon: <ComponentIcon name="retailer" size={14} collapsed={collapsed} />,
                    label: "Quản lý nhà bán lẻ",
                },
            ],
        },
        {
            key: "location-management",
            icon: <EnvironmentOutlined style={{ color: '#000000' }} />,
            label: "Quản lý vị trí và khu vực",
            children: [
                {
                    key: "/admin/areas",
                    icon: <AppstoreOutlined style={{ color: '#000000' }} />,
                    label: "Quản lý khu vực",
                },
                {
                    key: "/admin/locations",
                    icon: <ClusterOutlined style={{ color: '#000000' }} />,
                    label: "Quản lý vị trí",
                },
                {
                    key: "/admin/storage-condition",
                    icon: <ComponentIcon name="storageCondition" size={14} collapsed={collapsed} />,
                    label: "Quản lý điều kiện bảo quản",
                },
            ],
        },
        {
            key: "/admin/reports",
            icon: <BarChartOutlined style={{ color: '#000000' }} />,
            label: "Báo cáo",
        },
        {
            key: "/admin/settings",
            icon: <SettingOutlined style={{ color: '#000000' }} />,
            label: "Cài đặt",
        },
    ], [collapsed]);


    const handleMenuClick = ({ key }) => {
        if (key.startsWith('/')) {
            // Đây là menu item thông thường, không cần xử lý gì thêm
        }
    };

    const handleSubMenuClick = ({ key }) => {
        if (openKeys.includes(key)) {
            setOpenKeys(openKeys.filter(k => k !== key));
        } else {
            setOpenKeys([...openKeys, key]);
        }
    };

    const renderMenuItem = (item, isActive) => {
        if (item.children) {
            const isOpen = openKeys.includes(item.key);
            return (
                <div key={item.key}>
                    <div
                        className={`menu-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleSubMenuClick({ key: item.key })}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 20px',
                            margin: '4px 12px',
                            cursor: 'pointer',
                            color: isActive ? '#d97706' : '#000000',
                            backgroundColor: isActive ? '#fef3c7' : 'transparent',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.target.style.backgroundColor = '#fef3c7';
                                e.target.style.color = '#d97706';
                                const icon = e.target.querySelector('svg');
                                if (icon) icon.style.color = '#d97706';
                                const arrow = e.target.querySelector('.anticon');
                                if (arrow) arrow.style.color = '#d97706';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#000000';
                                const icon = e.target.querySelector('svg');
                                if (icon) icon.style.color = '#000000';
                                const arrow = e.target.querySelector('.anticon');
                                if (arrow) arrow.style.color = '#000000';
                            }
                        }}
                    >
                        <div style={{ marginRight: 12, display: 'flex', alignItems: 'center' }}>
                            {React.cloneElement(item.icon, {
                                color: isActive ? '#d97706' : '#000000',
                                size: 16
                            })}
                        </div>
                        {!collapsed && (
                            <>
                                <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                                {isOpen ? <DownOutlined style={{ fontSize: 12, color: isActive ? '#d97706' : '#000000' }} /> : <RightOutlined style={{ fontSize: 12, color: isActive ? '#d97706' : '#000000' }} />}
                            </>
                        )}
                    </div>
                    {isOpen && !collapsed && (
                        <div style={{ backgroundColor: '#f9fafb' }}>
                            {item.children.map(child => {
                                const isChildActive = location.pathname === child.key;
                                return (
                                    <Link
                                        key={child.key}
                                        to={child.key}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <div
                                            className={`submenu-item ${isChildActive ? 'active' : ''}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '10px 20px 10px 48px',
                                                margin: '2px 12px',
                                                cursor: 'pointer',
                                                color: isChildActive ? '#d97706' : '#000000',
                                                backgroundColor: 'transparent',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isChildActive) {
                                                    e.target.style.backgroundColor = '#fef3c7';
                                                    e.target.style.color = '#d97706';
                                                    const icon = e.target.querySelector('svg');
                                                    if (icon) icon.style.color = '#d97706';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isChildActive) {
                                                    e.target.style.backgroundColor = 'transparent';
                                                    e.target.style.color = '#000000';
                                                    const icon = e.target.querySelector('svg');
                                                    if (icon) icon.style.color = '#000000';
                                                }
                                            }}
                                        >
                                            <div style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>
                                                {React.cloneElement(child.icon, {
                                                    color: isChildActive ? '#d97706' : '#000000',
                                                    size: 14
                                                })}
                                            </div>
                                            <span style={{ fontWeight: 400 }}>{child.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link key={item.key} to={item.key} style={{ textDecoration: 'none' }}>
                <div
                    className={`menu-item ${isActive ? 'active' : ''}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 20px',
                        margin: '4px 12px',
                        cursor: 'pointer',
                        color: isActive ? '#d97706' : '#000000',
                        backgroundColor: isActive ? '#fef3c7' : 'transparent',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive) {
                            e.target.style.backgroundColor = '#fef3c7';
                            e.target.style.color = '#d97706';
                            const icon = e.target.querySelector('svg');
                            if (icon) icon.style.color = '#d97706';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive) {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#000000';
                            const icon = e.target.querySelector('svg');
                            if (icon) icon.style.color = '#000000';
                        }
                    }}
                >
                    <div style={{ marginRight: 12, display: 'flex', alignItems: 'center' }}>
                        {React.cloneElement(item.icon, {
                            color: isActive ? '#d97706' : '#000000',
                            size: 16
                        })}
                    </div>
                    {!collapsed && (
                        <span style={{ fontWeight: 500 }}>{item.label}</span>
                    )}
                </div>
            </Link>
        );
    };

    return (
        <aside
            style={{
                width: collapsed ? 80 : 280,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                transition: "width 0.3s ease-in-out, transform 0.3s ease-in-out",
                overflow: "hidden",
                transform: isMobile && collapsed ? "translateX(-100%)" : "translateX(0)",
                boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
                borderRight: "1px solid #e5e7eb",
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: isMobile ? 50 : 10,
            }}
        >
            {/* Header với logo và nút toggle */}
            <div style={{
                height: 64,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                borderBottom: "1px solid #e5e7eb",
                flexShrink: 0,
                position: "sticky",
                top: 0,
                zIndex: 99,
            }}>
                {!collapsed && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ 
                            width: 24, 
                            height: 24, 
                            background: "linear-gradient(45deg, #f59e0b, #d97706)",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <div style={{ 
                                width: 8, 
                                height: 8, 
                                background: "white", 
                                borderRadius: "50%",
                                margin: "1px"
                            }}></div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 18, color: "#1f2937" }}>
                            Kho Phân Phối Sữa
                        </span>
                    </div>
                )}
                {collapsed && (
                    <div style={{ 
                        width: 24, 
                        height: 24, 
                        background: "linear-gradient(45deg, #f59e0b, #d97706)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto"
                    }}>
                        <div style={{ 
                            width: 8, 
                            height: 8, 
                            background: "white", 
                            borderRadius: "50%",
                            margin: "1px"
                        }}></div>
                    </div>
                )}
            </div>

            {/* Menu */}
            <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#ffffff" }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.key || 
                        item.children?.some((c) => c.key === location.pathname);
                    return renderMenuItem(item, isActive);
                })}
            </div>
        </aside>
    );
};

export default Sidebar;