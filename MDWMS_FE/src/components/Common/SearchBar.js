import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Shield
} from "lucide-react";

const SearchBar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Danh sách các chức năng có thể tìm kiếm (dựa trên Sidebar)
  const searchItems = [
    // Dashboard
    { 
      id: "dashboard", 
      title: "Dashboard", 
      description: "Trang tổng quan hệ thống",
      icon: Home, 
      path: "/admin/dashboard",
      category: "DASHBOARD"
    },

    // User Management
    { 
      id: "accounts", 
      title: "Quản lý tài khoản", 
      description: "Quản lý tài khoản người dùng",
      icon: Users, 
      path: "/admin/accounts",
      category: "QUẢN LÝ NGƯỜI DÙNG"
    },

    // Product Management
    { 
      id: "categories", 
      title: "Quản lý danh mục", 
      description: "Phân loại sản phẩm",
      icon: Tag, 
      path: "/sales-manager/categorys",
      category: "QUẢN LÝ HÀNG HÓA"
    },
    { 
      id: "unitMeasures", 
      title: "Quản lý đơn vị", 
      description: "Quản lý đơn vị đo lường",
      icon: Scale, 
      path: "/sales-manager/unitMeasures",
      category: "QUẢN LÝ HÀNG HÓA"
    },
    { 
      id: "goods", 
      title: "Quản lý hàng hóa", 
      description: "Quản lý sản phẩm và hàng hóa",
      icon: Package, 
      path: "/sales-manager/goods",
      category: "QUẢN LÝ HÀNG HÓA"
    },

    // Business Partners
    { 
      id: "suppliers", 
      title: "Quản lý nhà cung cấp", 
      description: "Quản lý đối tác cung cấp",
      icon: Truck, 
      path: "/sales-manager/suppliers",
      category: "QUẢN LÝ ĐỐI TÁC"
    },
    { 
      id: "retailers", 
      title: "Quản lý nhà bán lẻ", 
      description: "Quản lý đối tác bán lẻ",
      icon: ShoppingCart, 
      path: "/sales-manager/retailers",
      category: "QUẢN LÝ ĐỐI TÁC"
    },

    // Location Management
    { 
      id: "areas", 
      title: "Quản lý khu vực", 
      description: "Quản lý các khu vực kho",
      icon: MapPin, 
      path: "/admin/areas",
      category: "QUẢN LÝ VỊ TRÍ VÀ KHU VỰC"
    },
    { 
      id: "locations", 
      title: "Quản lý vị trí", 
      description: "Quản lý vị trí lưu trữ",
      icon: Building2, 
      path: "/admin/locations",
      category: "QUẢN LÝ VỊ TRÍ VÀ KHU VỰC"
    },
    { 
      id: "storage-condition", 
      title: "Quản lý điều kiện bảo quản", 
      description: "Quản lý điều kiện lưu trữ",
      icon: Thermometer, 
      path: "/admin/storage-condition",
      category: "QUẢN LÝ VỊ TRÍ VÀ KHU VỰC"
    },

    // Reports
    { 
      id: "reports", 
      title: "Báo cáo", 
      description: "Xem các báo cáo chi tiết",
      icon: BarChart3, 
      path: "/admin/reports",
      category: "BÁO CÁO"
    },

    // System
    { 
      id: "settings", 
      title: "Cài đặt", 
      description: "Cấu hình hệ thống",
      icon: Settings, 
      path: "/admin/settings",
      category: "HỆ THỐNG"
    }
  ];

  // Lọc kết quả tìm kiếm
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems([]);
      return;
    }

    const filtered = searchItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
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
                    {searchItems.slice(0, 8).map((item) => (
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
