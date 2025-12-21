import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Popover } from "antd";
import {
    DashboardOutlined,
    ShoppingCartOutlined,
    BarChartOutlined,
    EnvironmentOutlined,
    UsergroupAddOutlined,
    ClusterOutlined,
    AppstoreOutlined,
    DownOutlined,
    RightOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ComponentIcon } from "../../components/IconComponent/Icon";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../utils/permissions";

const Sidebar = memo(({ collapsed, isMobile }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [openKeys, setOpenKeys] = useState([]);
    const [activePopoverKey, setActivePopoverKey] = useState(null);

    const getOpenKeysFromPath = useCallback((pathname) => {
        const keys = [];
        if (pathname.startsWith('/suppliers') || pathname.startsWith('/retailers')) {
            keys.push('partner-management');
        }
        if (pathname.startsWith('/areas') || pathname.startsWith('/locations') || pathname.startsWith('/storage-conditions')) {
            keys.push('location-management');
        }
        if (pathname.startsWith('/purchase-orders')) {
            keys.push('purchase-orders-management');
        }
        if (pathname.startsWith('/sales-orders')) {
            keys.push('sales-orders-management');
        }
        if (pathname.startsWith('/stocktakings') || pathname.startsWith('/stocktaking')) {
            keys.push('stocktaking-management');
        }
        if (pathname.startsWith('/reports')) {
            keys.push('reports-management');
        }
        if (pathname.startsWith('/disposal')) {
            keys.push('disposal-management');
        }
        return keys;
    }, []);

    useEffect(() => {
        if (!collapsed) {
            setOpenKeys(getOpenKeysFromPath(location.pathname));
        } else {
            setOpenKeys([]);
            setActivePopoverKey(null);
        }
    }, [collapsed, location.pathname, getOpenKeysFromPath]);

    const { hasPermission, userRoles } = usePermissions();

    const menuItems = useMemo(() => {
        const allMenuItems = [
            {
                key: "/dashboard",
                icon: <DashboardOutlined style={{ color: '#000000' }} />,
                label: "Dashboard",
                permission: PERMISSIONS.DASHBOARD_VIEW
            },
            {
                key: "purchase-orders-management",
                icon: <ComponentIcon name="puscharorder" size={16} collapsed={collapsed} />,
                label: "Quản lý đơn mua hàng",
                permission: [PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_RS, PERMISSIONS.PURCHASE_ORDER_VIEW_SM],
                requireAll: false,
                children: [
                    {
                        key: "/purchase-orders",
                        icon: <ComponentIcon name="cart" size={14} collapsed={collapsed} />,
                        label: "Danh sách đơn mua hàng",
                        permission: [PERMISSIONS.PURCHASE_ORDER_VIEW, PERMISSIONS.PURCHASE_ORDER_VIEW_RS, PERMISSIONS.PURCHASE_ORDER_VIEW_SM],
                        requireAll: false,
                    },
                    {
                        key: "/purchase-orders/create",
                        icon: <ComponentIcon name="createpuscharorder" size={14} collapsed={collapsed} />,
                        label: "Tạo đơn mua hàng",
                        permission: PERMISSIONS.PURCHASE_ORDER_CREATE,
                    }
                ],
            },
            {
                key: "sales-orders-management",
                icon: <ComponentIcon name="puscharorder" size={16} collapsed={collapsed} />,
                label: "Quản lý đơn bán hàng",
                permission: [PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_SR, PERMISSIONS.SALES_ORDER_VIEW_SM],
                requireAll: false,
                children: [
                    {
                        key: "/sales-orders",
                        icon: <ComponentIcon name="cart" size={14} collapsed={collapsed} />,
                        label: "Danh sách đơn bán hàng",
                        permission: [PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_VIEW_SR, PERMISSIONS.SALES_ORDER_VIEW_SM, PERMISSIONS.SALES_ORDER_VIEW_WM, PERMISSIONS.SALES_ORDER_VIEW_WS],
                        requireAll: false,
                    },
                    {
                        key: "/sales-orders/create",
                        icon: <ComponentIcon name="createpuscharorder" size={14} collapsed={collapsed} />,
                        label: "Tạo đơn bán hàng",
                        permission: [PERMISSIONS.PURCHASE_ORDER_CREATE],
                    }
                ],
            },
            {
                key: "stocktaking-management",
                icon: <ComponentIcon name="clipboard" size={16} collapsed={collapsed} />,
                label: "Quản lý đơn kiểm kê",
                permission: [PERMISSIONS.STOCKTAKING_VIEW, PERMISSIONS.STOCKTAKING_VIEW_WM, PERMISSIONS.STOCKTAKING_VIEW_WS],
                requireAll: false,
                children: [
                    {
                        key: "/stocktakings",
                        icon: <ComponentIcon name="taskListEdit" size={14} collapsed={collapsed} />,
                        label: "Danh sách đơn kiểm kê",
                        permission: [PERMISSIONS.STOCKTAKING_VIEW, PERMISSIONS.STOCKTAKING_VIEW_WM, PERMISSIONS.STOCKTAKING_VIEW_WS],
                        requireAll: false,
                    },
                    {
                        key: "/stocktaking/create",
                        icon: <ComponentIcon name="createTaskListEdit" size={14} collapsed={collapsed} />,
                        label: "Tạo đơn kiểm kê",
                        permission: PERMISSIONS.STOCKTAKING_CREATE,
                    }
                ],
            },
            {
                key: "/backorder",
                icon: <ComponentIcon name="backorder" size={16} collapsed={collapsed} />,
                label: "Quản lý đơn bổ sung",
                permission: PERMISSIONS.BACKORDER_VIEW
            },
            {
                key: "disposal-management",
                icon: <ComponentIcon name="disposal" size={16} collapsed={collapsed} />,
                label: "Quản lý đơn xuất hủy",
                permission: [PERMISSIONS.DISPOSAL_REQUEST_VIEW, PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM, PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM, PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS],
                requireAll: false,
                children: [
                    {
                        key: "/disposal",
                        icon: <ComponentIcon name="disposalList" size={14} collapsed={collapsed} />,
                        label: "Danh sách đơn xuất hủy",
                        permission: [
                            PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM,
                            PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM,
                            PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS],
                        requireAll: false,
                    },
                    {
                        key: "/disposal/create",
                        icon: <ComponentIcon name="createDisposal" size={14} collapsed={collapsed} />,
                        label: "Tạo đơn xuất hủy",
                        permission: PERMISSIONS.DISPOSAL_REQUEST_CREATE,
                    }
                ],
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
                key: "/goods",
                icon: <ComponentIcon name="milk" size={16} collapsed={collapsed} />,
                label: "Quản lý hàng hóa",
                permission: PERMISSIONS.GOODS_VIEW
            },
            {
                key: "/categories",
                icon: <ComponentIcon name="category" size={16} collapsed={collapsed} />,
                label: "Quản lý phân loại",
                permission: PERMISSIONS.CATEGORY_VIEW
            },
            {
                key: "/unit-measures",
                icon: <ComponentIcon name="unitMeasure" size={16} collapsed={collapsed} />,
                label: "Quản lý đơn vị",
                permission: PERMISSIONS.UNIT_MEASURE_VIEW
            },

            {
                key: "/batches",
                icon: <ComponentIcon name="batch" size={16} collapsed={collapsed} />,
                label: "Quản lý lô hàng",
                permission: PERMISSIONS.BATCH_VIEW
            },
            {
                key: "/pallets",
                icon: <ComponentIcon name="pallet" size={16} collapsed={collapsed} />,
                label: "Quản lý pallet",
                permission: PERMISSIONS.PALLET_VIEW
            },

            {
                key: "/accounts",
                icon: <UsergroupAddOutlined style={{ color: '#000000' }} />,
                label: "Quản lý tài khoản",
                permission: PERMISSIONS.ACCOUNT_VIEW
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
                key: "reports-management",
                icon: <BarChartOutlined style={{ color: '#000000' }} />,
                label: "Báo cáo",
                permission: PERMISSIONS.REPORT_VIEW,
                children: [
                    {
                        key: "/reports/orders",
                        icon: <ShoppingCartOutlined style={{ color: '#000000' }} />,
                        label: "Báo cáo xuất/nhập kho",
                        permission: PERMISSIONS.REPORT_VIEW
                    },
                    {
                        key: "/reports/inventory",
                        icon: <AppstoreOutlined style={{ color: '#000000' }} />,
                        label: "Báo cáo tồn kho",
                        permission: PERMISSIONS.REPORT_VIEW
                    }
                ]
            },
        ];

        // Lọc menu theo quyền
        const filterMenuItems = (items) => {
            return items.filter(item => {
                if (item.role && !userRoles.includes(item.role)) return false;
                if (item.permission !== null && item.permission !== undefined) {
                    if (Array.isArray(item.permission)) {
                        if (!item.permission.some(p => hasPermission(p))) return false;
                    } else {
                        if (!hasPermission(item.permission)) return false;
                    }
                }
                if (item.children) {
                    const filteredChildren = filterMenuItems(item.children);
                    if (filteredChildren.length === 0) return false;
                    item.children = filteredChildren;
                }
                return true;
            });
        };

        return filterMenuItems(allMenuItems);
    }, [collapsed, hasPermission, userRoles]);


    const handleChildMenuClick = useCallback((path) => {
        navigate(path);
    }, [navigate]);

    const handleSubMenuClick = useCallback(({ key }, event) => {
        if (event) event.stopPropagation();

        setOpenKeys(prevKeys => {
            if (prevKeys.includes(key)) {
                return prevKeys.filter(k => k !== key);
            } else {
                return [...prevKeys, key];
            }
        });
    }, []);

    const renderMenuItem = useCallback((item, isActive) => {
        // ===========================================================
        // 1. LOGIC CHO SIDEBAR THU NHỎ (COLLAPSED) + CÓ MENU CON
        // ===========================================================
        if (collapsed && item.children && item.children.length > 0) {
            // Nội dung bên trong Popover
            const popoverContent = (
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
                    <div style={{
                        padding: '8px 16px',
                        fontWeight: 600,
                        color: '#6b7280',
                        borderBottom: '1px solid #f3f4f6',
                        marginBottom: 4
                    }}>
                        {item.label}
                    </div>

                    {item.children.map(child => {
                        const isChildActive = location.pathname === child.key;
                        return (
                            <div
                                key={child.key}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleChildMenuClick(child.key);
                                    setActivePopoverKey(null);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    color: isChildActive ? '#d97706' : '#374151',
                                    backgroundColor: isChildActive ? '#fef3c7' : 'transparent',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isChildActive) e.currentTarget.style.backgroundColor = '#f9fafb';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isChildActive) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <div style={{ marginRight: 10, display: 'flex', alignItems: 'center' }}>
                                    {React.cloneElement(child.icon, {
                                        color: isChildActive ? '#d97706' : '#6b7280',
                                        size: 16
                                    })}
                                </div>
                                <span style={{ fontSize: 14 }}>{child.label}</span>
                            </div>
                        );
                    })}
                </div>
            );

            return (
                <Popover
                    key={item.key}
                    content={popoverContent}
                    placement="rightTop"
                    trigger="click"
                    open={activePopoverKey === item.key} // Kiểm soát mở/đóng
                    onOpenChange={(visible) => setActivePopoverKey(visible ? item.key : null)}
                    overlayInnerStyle={{ padding: 0, borderRadius: 8, overflow: 'hidden' }}
                    arrow={false}
                >
                    <div
                        className={`menu-item ${isActive ? 'active' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px 0',
                            margin: '4px 12px',
                            cursor: 'pointer',
                            color: isActive ? '#d97706' : '#000000',
                            backgroundColor: isActive ? '#fef3c7' : 'transparent',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            height: 48
                        }}
                    >
                        {/* Chỉ hiển thị Icon ở giữa */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {React.cloneElement(item.icon, {
                                color: isActive ? '#d97706' : '#000000',
                                size: 20
                            })}
                        </div>
                    </div>
                </Popover>
            );
        }

        // ===========================================================
        // 2. LOGIC CHO SIDEBAR MỞ RỘNG (EXPANDED) HOẶC ITEM KHÔNG CÓ CON
        // ===========================================================
        if (item.children) {
            const isOpen = openKeys.includes(item.key);
            return (
                <div key={item.key}>
                    <div
                        className={`menu-item ${isActive ? 'active' : ''}`}
                        onClick={(e) => handleSubMenuClick({ key: item.key }, e)}
                        onMouseDown={(e) => e.stopPropagation()}
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
                                    <div
                                        key={child.key}
                                        className={`submenu-item ${isChildActive ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleChildMenuClick(child.key);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
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
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        // ===========================================================
        // 3. LOGIC CHO ITEM ĐƠN (KHÔNG CÓ CON)
        // ===========================================================
        return (
            <Link key={item.key} to={item.key} style={{ textDecoration: 'none' }}>
                <div
                    className={`menu-item ${isActive ? 'active' : ''}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: collapsed ? '12px 0' : '12px 20px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        margin: '4px 12px',
                        cursor: 'pointer',
                        color: isActive ? '#d97706' : '#000000',
                        backgroundColor: isActive ? '#fef3c7' : 'transparent',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        height: collapsed ? 48 : 'auto'
                    }}
                >
                    <div style={{ marginRight: collapsed ? 0 : 12, display: 'flex', alignItems: 'center' }}>
                        {React.cloneElement(item.icon, {
                            color: isActive ? '#d97706' : '#000000',
                            size: collapsed ? 20 : 16
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
    }, [collapsed, openKeys, location.pathname, handleSubMenuClick, handleChildMenuClick, activePopoverKey]);

    return (
        <aside
            style={{
                width: collapsed ? 80 : 280,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                transition: "width 0.3s ease-in-out, transform 0.3s ease-in-out",
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
            {/* Header với logo */}
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
                    <Link to="/">
                        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                            <img
                                src="/logo.png"
                                alt="Logo"
                                style={{ width: 80, height: 80, objectFit: 'contain' }}
                            />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: "#1f2937", lineHeight: 1.2 }}>
                                    Kho Sữa Hoàng Hà
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                {collapsed && (
                    <Link to="/">
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                            cursor: "pointer"
                        }}>
                            <img
                                src="/logo.png"
                                alt="Logo"
                                style={{ width: 28, height: 28, objectFit: 'contain' }}
                            />
                        </div>
                    </Link>
                )}
            </div>

            {/* Menu Container */}
            <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#ffffff", overflowX: 'hidden' }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.key ||
                        item.children?.some((c) => c.key === location.pathname);
                    return renderMenuItem(item, isActive);
                })}
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;