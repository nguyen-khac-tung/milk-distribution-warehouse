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
import { usePermissions } from "../../hooks/usePermissions";
import { ROLES, PERMISSIONS } from "../../utils/permissions";

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

    const { hasPermission, userRoles } = usePermissions();

    const menuItems = useMemo(() => {
        const allMenuItems = [
            {
                key: "/dashboard",
                icon: <DashboardOutlined style={{ color: '#000000' }} />,
                label: "Dashboard",
                permission: PERMISSIONS.ADMIN_DASHBOARD_VIEW
            },
            {
                key: "/accounts",
                icon: <UsergroupAddOutlined style={{ color: '#000000' }} />,
                label: "Quản lý tài khoản",
                permission: PERMISSIONS.ACCOUNT_VIEW
            },
            {
                key: "/categories",
                icon: <ComponentIcon name="category" size={16} collapsed={collapsed} />,
                label: "Quản lý danh mục",
                permission: PERMISSIONS.CATEGORY_VIEW
            },
            {
                key: "/unit-measures",
                icon: <ComponentIcon name="unitMeasure" size={16} collapsed={collapsed} />,
                label: "Quản lý đơn vị",
                permission: PERMISSIONS.UNIT_MEASURE_VIEW
            },
            {
                key: "/goods",
                icon: <ComponentIcon name="milk" size={16} collapsed={collapsed} />,
                label: "Quản lý hàng hóa",
                permission: PERMISSIONS.GOODS_VIEW
            },
            {
                key: "/batches",
                icon: <ComponentIcon name="batch" size={16} collapsed={collapsed} />,
                label: "Quản lý lô hàng",
                permission: PERMISSIONS.BATCH_VIEW
            },
            {
                key: "partner-management",
                icon: <ComponentIcon name="partner" size={16} collapsed={collapsed} />,
                label: "Quản lý đối tác",
                permission: [PERMISSIONS.SUPPLIER_VIEW, PERMISSIONS.RETAILER_VIEW],
                children: [
                    {
                        key: "/suppliers",
                        icon: <ComponentIcon name="supplier" size={14} collapsed={collapsed} />,
                        label: "Quản lý nhà cung cấp",
                        permission: PERMISSIONS.SUPPLIER_VIEW
                    },
                    {
                        key: "/retailers",
                        icon: <ComponentIcon name="retailer" size={14} collapsed={collapsed} />,
                        label: "Quản lý nhà bán lẻ",
                        permission: PERMISSIONS.RETAILER_VIEW
                    },
                ],
            },
            {
                key: "location-management",
                icon: <EnvironmentOutlined style={{ color: '#000000' }} />,
                label: "Quản lý vị trí và khu vực",
                permission: [PERMISSIONS.AREA_VIEW, PERMISSIONS.LOCATION_VIEW, PERMISSIONS.STORAGE_CONDITION_VIEW],
                children: [
                    {
                        key: "/areas",
                        icon: <AppstoreOutlined style={{ color: '#000000' }} />,
                        label: "Quản lý khu vực",
                        permission: PERMISSIONS.AREA_VIEW
                    },
                    {
                        key: "/locations",
                        icon: <ClusterOutlined style={{ color: '#000000' }} />,
                        label: "Quản lý vị trí",
                        permission: PERMISSIONS.LOCATION_VIEW
                    },
                    {
                        key: "/storage-conditions",
                        icon: <ComponentIcon name="storageCondition" size={14} collapsed={collapsed} />,
                        label: "Quản lý điều kiện bảo quản",
                        permission: PERMISSIONS.STORAGE_CONDITION_VIEW
                    },
                ],
            },
            {
                key: "/reports",
                icon: <BarChartOutlined style={{ color: '#000000' }} />,
                label: "Báo cáo",
                permission: PERMISSIONS.REPORT_VIEW
            },
            {
                key: "/settings",
                icon: <SettingOutlined style={{ color: '#000000' }} />,
                label: "Cài đặt",
                permission: PERMISSIONS.SETTINGS_VIEW
            },
        ];

        // Lọc menu theo quyền
        const filterMenuItems = (items) => {
            return items.filter(item => {
                // Kiểm tra quyền của menu chính
                if (item.role && !userRoles.includes(item.role)) {
                    return false;
                }
                if (item.permission) {
                    if (Array.isArray(item.permission)) {
                        if (!item.permission.some(p => hasPermission(p))) {
                            return false;
                        }
                    } else {
                        if (!hasPermission(item.permission)) {
                            return false;
                        }
                    }
                }
                
                // Kiểm tra children nếu có
                if (item.children) {
                    const filteredChildren = filterMenuItems(item.children);
                    if (filteredChildren.length === 0) {
                        return false;
                    }
                    item.children = filteredChildren;
                }
                
                return true;
            });
        };

        return filterMenuItems(allMenuItems);
    }, [collapsed, hasPermission, userRoles]);


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
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                        }}
                    /* Hover effects handled by CSS for better performance */
                    >
                        <div style={{ marginRight: 12, display: 'flex', alignItems: 'center' }}>
                            {React.cloneElement(item.icon, {
                                color: isActive ? '#d97706' : '#000000',
                                size: 16
                            })}
                        </div>
                        {!collapsed && (
                            <>
                                <span style={{
                                    flex: 1,
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>{item.label}</span>
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
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                            }}
                                        /* Hover effects handled by CSS for better performance */
                                        >
                                            <div style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>
                                                {React.cloneElement(child.icon, {
                                                    color: isChildActive ? '#d97706' : '#000000',
                                                    size: 14
                                                })}
                                            </div>
                                            <span style={{
                                                fontWeight: 400,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>{child.label}</span>
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
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                /* Hover effects handled by CSS for better performance */
                >
                    <div style={{ marginRight: 12, display: 'flex', alignItems: 'center' }}>
                        {React.cloneElement(item.icon, {
                            color: isActive ? '#d97706' : '#000000',
                            size: 16
                        })}
                    </div>
                    {!collapsed && (
                        <span style={{
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>{item.label}</span>
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
                height: 75,
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img 
                            src="/logo.png" 
                            alt="Logo" 
                            style={{ width: 80, height: 80, objectFit: 'contain' }}
                        />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#1f2937", lineHeight: 1.2 }}>
                                Kho Phân Phối Sữa
                            </div>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto"
                    }}>
                        <img 
                            src="/logo.png" 
                            alt="Logo" 
                            style={{ width: 28, height: 28, objectFit: 'contain' }}
                        />
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