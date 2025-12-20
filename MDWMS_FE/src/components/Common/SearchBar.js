import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../utils/permissions";
import {
  Search,
  X,
  Home,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  FileText,
  MapPin,
  Truck,
  Building2,
  Tag,
  Scale,
  Thermometer,
  UserCheck,
  ClipboardList,
  TrendingUp,
  Calendar,
  CreditCard,
  Bell,
  Shield,
  ShoppingBag,
  PlusCircle,
  Trash2,
  RotateCcw,
  Edit,
  Eye,
  Receipt,
  FileCheck
} from "lucide-react";

const SearchBar = () => {
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize function: lowercase, trim, and collapse multiple spaces into one
  const normalize = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // gom nhiều space thành 1 space
  };

  // Danh sách các chức năng có thể tìm kiếm (dựa trên Sidebar)
  const searchItems = [
    // Dashboard
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Trang tổng quan hệ thống",
      icon: Home,
      path: "/dashboard",
      category: "DASHBOARD",
      permissions: [PERMISSIONS.DASHBOARD_VIEW]
    },

    // Purchase Orders Management
    {
      id: "purchase-orders",
      title: "Danh sách đơn mua hàng",
      description: "Xem và quản lý các đơn mua hàng",
      icon: ShoppingCart,
      path: "/purchase-orders",
      category: "QUẢN LÝ ĐƠN MUA HÀNG",
      permissions: [
        PERMISSIONS.PURCHASE_ORDER_VIEW,
        PERMISSIONS.PURCHASE_ORDER_VIEW_RS,
        PERMISSIONS.PURCHASE_ORDER_VIEW_SM,
        PERMISSIONS.PURCHASE_ORDER_VIEW_WM,
        PERMISSIONS.PURCHASE_ORDER_VIEW_WS
      ]
    },
    {
      id: "purchase-orders-create",
      title: "Tạo đơn mua hàng",
      description: "Tạo đơn mua hàng mới",
      icon: PlusCircle,
      path: "/purchase-orders/create",
      category: "QUẢN LÝ ĐƠN MUA HÀNG",
      permissions: [PERMISSIONS.PURCHASE_ORDER_CREATE]
    },

    // Sales Orders Management
    {
      id: "sales-orders",
      title: "Danh sách đơn bán hàng",
      description: "Xem và quản lý các đơn bán hàng",
      icon: ShoppingBag,
      path: "/sales-orders",
      category: "QUẢN LÝ ĐƠN BÁN HÀNG",
      permissions: [
        PERMISSIONS.SALES_ORDER_VIEW,
        PERMISSIONS.SALES_ORDER_VIEW_SR,
        PERMISSIONS.SALES_ORDER_VIEW_SM,
        PERMISSIONS.SALES_ORDER_VIEW_WM,
        PERMISSIONS.SALES_ORDER_VIEW_WS
      ]
    },
    {
      id: "sales-orders-create",
      title: "Tạo đơn bán hàng",
      description: "Tạo đơn bán hàng mới",
      icon: PlusCircle,
      path: "/sales-orders/create",
      category: "QUẢN LÝ ĐƠN BÁN HÀNG",
      permissions: [PERMISSIONS.SALES_ORDER_CREATE]
    },

    // Stocktaking Management
    {
      id: "stocktakings",
      title: "Danh sách đơn kiểm kê",
      description: "Xem và quản lý các đơn kiểm kê",
      icon: ClipboardList,
      path: "/stocktakings",
      category: "QUẢN LÝ ĐƠN KIỂM KÊ",
      permissions: [
        PERMISSIONS.STOCKTAKING_VIEW,
        PERMISSIONS.STOCKTAKING_VIEW_WM,
        PERMISSIONS.STOCKTAKING_VIEW_WS,
        PERMISSIONS.STOCKTAKING_VIEW_SM
      ]
    },
    {
      id: "stocktaking-create",
      title: "Tạo đơn kiểm kê",
      description: "Tạo đơn kiểm kê mới",
      icon: PlusCircle,
      path: "/stocktaking/create",
      category: "QUẢN LÝ ĐƠN KIỂM KÊ",
      permissions: [PERMISSIONS.STOCKTAKING_CREATE]
    },

    // User Management
    {
      id: "accounts",
      title: "Quản lý tài khoản",
      description: "Quản lý tài khoản người dùng",
      icon: Users,
      path: "/accounts",
      category: "QUẢN LÝ NGƯỜI DÙNG",
      permissions: [PERMISSIONS.ACCOUNT_VIEW]
    },

    // Product Management
    {
      id: "categories",
      title: "Quản lý phân loại",
      description: "Phân loại hàng hóa",
      icon: Tag,
      path: "/categories",
      category: "QUẢN LÝ HÀNG HÓA",
      permissions: [PERMISSIONS.CATEGORY_VIEW]
    },
    {
      id: "unitMeasures",
      title: "Quản lý đơn vị",
      description: "Quản lý đơn vị đo lường",
      icon: Scale,
      path: "/unit-measures",
      category: "QUẢN LÝ HÀNG HÓA",
      permissions: [PERMISSIONS.UNIT_MEASURE_VIEW]
    },
    {
      id: "goods",
      title: "Quản lý hàng hóa",
      description: "Quản lý hàng hóa và hàng hóa",
      icon: Package,
      path: "/goods",
      category: "QUẢN LÝ HÀNG HÓA",
      permissions: [PERMISSIONS.GOODS_VIEW]
    },
    {
      id: "batches",
      title: "Quản lý lô hàng",
      description: "Quản lý các lô hàng",
      icon: Package,
      path: "/batches",
      category: "QUẢN LÝ HÀNG HÓA",
      permissions: [PERMISSIONS.BATCH_VIEW]
    },
    {
      id: "pallets",
      title: "Quản lý pallet",
      description: "Quản lý các pallet trong kho",
      icon: Package,
      path: "/pallets",
      category: "QUẢN LÝ HÀNG HÓA",
      permissions: [PERMISSIONS.PALLET_VIEW]
    },

    // Disposal Management
    {
      id: "disposal",
      title: "Danh sách đơn xuất hủy",
      description: "Xem và quản lý các đơn xuất hủy",
      icon: Trash2,
      path: "/disposal",
      category: "QUẢN LÝ ĐƠN XUẤT HỦY",
      permissions: [
        PERMISSIONS.DISPOSAL_REQUEST_VIEW,
        PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM,
        PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM,
        PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS
      ]
    },
    {
      id: "disposal-create",
      title: "Tạo đơn xuất hủy",
      description: "Tạo đơn xuất hủy mới",
      icon: PlusCircle,
      path: "/disposal/create",
      category: "QUẢN LÝ ĐƠN XUẤT HỦY",
      permissions: [PERMISSIONS.DISPOSAL_REQUEST_CREATE]
    },

    // Backorder Management
    {
      id: "backorder",
      title: "Quản lý đơn bổ sung",
      description: "Quản lý các đơn bổ sung",
      icon: RotateCcw,
      path: "/backorder",
      category: "QUẢN LÝ ĐƠN BỔ SUNG",
      permissions: [PERMISSIONS.BACKORDER_VIEW]
    },

    // Business Partners
    {
      id: "suppliers",
      title: "Quản lý nhà cung cấp",
      description: "Quản lý đối tác cung cấp",
      icon: Truck,
      path: "/suppliers",
      category: "QUẢN LÝ ĐỐI TÁC",
      permissions: [PERMISSIONS.SUPPLIER_VIEW]
    },
    {
      id: "retailers",
      title: "Quản lý nhà bán lẻ",
      description: "Quản lý đối tác bán lẻ",
      icon: ShoppingCart,
      path: "/retailers",
      category: "QUẢN LÝ ĐỐI TÁC",
      permissions: [PERMISSIONS.RETAILER_VIEW]
    },

    // Location Management
    {
      id: "areas",
      title: "Quản lý khu vực",
      description: "Quản lý các khu vực kho",
      icon: MapPin,
      path: "/areas",
      category: "QUẢN LÝ VỊ TRÍ VÀ KHU VỰC",
      permissions: [PERMISSIONS.AREA_VIEW]
    },
    {
      id: "locations",
      title: "Quản lý vị trí",
      description: "Quản lý vị trí lưu trữ",
      icon: Building2,
      path: "/locations",
      category: "QUẢN LÝ VỊ TRÍ VÀ KHU VỰC",
      permissions: [PERMISSIONS.LOCATION_VIEW]
    },
    {
      id: "storage-condition",
      title: "Quản lý điều kiện bảo quản",
      description: "Quản lý điều kiện lưu trữ",
      icon: Thermometer,
      path: "/storage-conditions",
      category: "QUẢN LÝ VỊ TRÍ VÀ KHU VỰC",
      permissions: [PERMISSIONS.STORAGE_CONDITION_VIEW]
    },

    // Reports
    {
      id: "reports-orders",
      title: "Báo cáo xuất/nhập kho",
      description: "Xem báo cáo xuất nhập kho",
      icon: BarChart3,
      path: "/reports/orders",
      category: "BÁO CÁO",
      permissions: [PERMISSIONS.REPORT_VIEW]
    },
    {
      id: "reports-inventory",
      title: "Báo cáo tồn kho",
      description: "Xem báo cáo tồn kho",
      icon: BarChart3,
      path: "/reports/inventory",
      category: "BÁO CÁO",
      permissions: [PERMISSIONS.REPORT_VIEW]
    }
  ];

  // Lọc kết quả tìm kiếm
  useEffect(() => {
    // Lọc theo quyền trước
    const visibleItems = searchItems.filter(item => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return hasAnyPermission(item.permissions);
    });

    // Normalize search query để kiểm tra
    const normalizedSearchQuery = normalize(searchQuery);

    if (!normalizedSearchQuery) {
      setFilteredItems(visibleItems);
      return;
    }

    const filtered = visibleItems.filter(item =>
      normalize(item.title).includes(normalizedSearchQuery) ||
      normalize(item.description).includes(normalizedSearchQuery) ||
      normalize(item.category).includes(normalizedSearchQuery)
    );

    setFilteredItems(filtered);
  }, [searchQuery]);

  // Xử lý phím tắt
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input khi mở
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Đóng khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item) => {
    navigate(item.path);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  // Nhóm kết quả theo category
  const groupedResults = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Search Button */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s",
          minWidth: "400px",
          height: "38px"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f3f4f6";
          e.currentTarget.style.borderColor = "#d1d5db";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#f9fafb";
          e.currentTarget.style.borderColor = "#e5e7eb";
        }}
      >
        <Search size={16} color="#6b7280" />
        <span style={{
          color: "#6b7280",
          fontSize: "14px",
          flex: 1,
          textAlign: "left"
        }}>
          Tìm kiếm chức năng...
        </span>
        <span style={{
          color: "#9ca3af",
          fontSize: "12px",
          backgroundColor: "#f3f4f6",
          padding: "2px 6px",
          borderRadius: "4px",
          border: "1px solid #e5e7eb"
        }}>
          Ctrl+K
        </span>
      </div>

      {/* Search Modal */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "10vh"
          }}
        >
          <div
            ref={searchRef}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Search Input */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}
            >
              <Search size={20} color="#6b7280" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Tìm kiếm chức năng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "16px",
                  color: "#111827",
                  backgroundColor: "transparent"
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  color: "#9ca3af",
                  fontSize: "12px",
                  backgroundColor: "#f3f4f6",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #e5e7eb"
                }}>
                  ESC
                </span>
                <button
                  onClick={handleClose}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f3f4f6"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                  <X size={16} color="#6b7280" />
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 0"
              }}
            >
              {searchQuery.trim() === "" ? (
                <div style={{ padding: "0 20px" }}>
                  <div style={{
                    color: "#6b7280",
                    fontSize: "14px",
                    marginBottom: "16px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Tìm kiếm phổ biến
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {filteredItems.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          transition: "background-color 0.2s",
                          border: "1px solid #f3f4f6"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f9fafb"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        <item.icon size={16} color="#6b7280" />
                        <span style={{ fontSize: "14px", color: "#374151" }}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredItems.length > 0 ? (
                <div style={{ padding: "0 20px" }}>
                  {Object.entries(groupedResults).map(([category, items]) => (
                    <div key={category} style={{ marginBottom: "24px" }}>
                      <div style={{
                        color: "#6b7280",
                        fontSize: "12px",
                        marginBottom: "8px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {category}
                      </div>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          style={{
                            padding: "12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            transition: "background-color 0.2s",
                            marginBottom: "4px"
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#f9fafb"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                        >
                          <item.icon size={16} color="#6b7280" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                              {item.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#6b7280",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Search size={32} color="#d1d5db" style={{ marginBottom: "12px" }} />
                  <div style={{ fontSize: "16px", marginBottom: "4px" }}>
                    Không tìm thấy kết quả
                  </div>
                  <div style={{ fontSize: "14px" }}>
                    Thử tìm kiếm với từ khóa khác
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBar;
