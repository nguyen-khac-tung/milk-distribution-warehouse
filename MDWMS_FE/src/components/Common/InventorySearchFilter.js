import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, ChevronUp, Settings, X, Building2, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function InventorySearchFilter({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Tìm kiếm theo mã lô, tên hàng hóa...",
  timeRange,
  setTimeRange,
  // timeRangeOptions = [
  //   { value: "week", label: "Tuần này" },
  //   { value: "month", label: "Tháng này" },
  //   { value: "year", label: "Năm nay" }
  // ],
  areaId,
  setAreaId,
  areas = [],
  onClearAll = null,
  showClearButton = true,
  showToggle = true,
  defaultOpen = true,
  searchWidth = "w-80",
  // Supplier filter props
  supplierFilter,
  setSupplierFilter,
  showSupplierFilter,
  setShowSupplierFilter,
  supplierSearchTerm,
  setSupplierSearchTerm,
  suppliers = [],
  filteredSuppliers = [],
  reportType = "current", // "current" or "period"
  // Additional filters for current inventory report
  quantityRange,
  setQuantityRange,
  remainingDaysRange,
  setRemainingDaysRange,
  statusFilter,
  setStatusFilter
}) {
  const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);
  const [showTimeRangeFilter, setShowTimeRangeFilter] = useState(false);
  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const supplierFilterRef = useRef(null);
  const [supplierDropdownPosition, setSupplierDropdownPosition] = useState({ top: 0, left: 0 });
  const areaFilterRef = useRef(null);
  const [areaDropdownPosition, setAreaDropdownPosition] = useState({ top: 0, left: 0 });
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const statusFilterRef = useRef(null);
  const [statusDropdownPosition, setStatusDropdownPosition] = useState({ top: 0, left: 0 });

  // Calculate dropdown position for fixed positioning
  const updateSupplierPosition = () => {
    if (supplierFilterRef.current) {
      const rect = supplierFilterRef.current.getBoundingClientRect();
      setSupplierDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  };

  const updateAreaPosition = () => {
    if (areaFilterRef.current) {
      const rect = areaFilterRef.current.getBoundingClientRect();
      setAreaDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  };

  const updateStatusPosition = () => {
    if (statusFilterRef.current) {
      const rect = statusFilterRef.current.getBoundingClientRect();
      setStatusDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  };

  useEffect(() => {
    if (showSupplierFilter) {
      updateSupplierPosition();
      const handleScroll = () => updateSupplierPosition();
      const handleResize = () => updateSupplierPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showSupplierFilter]);

  useEffect(() => {
    if (showAreaFilter) {
      updateAreaPosition();
      const handleScroll = () => updateAreaPosition();
      const handleResize = () => updateAreaPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showAreaFilter]);

  useEffect(() => {
    if (showStatusFilter) {
      updateStatusPosition();
      const handleScroll = () => updateStatusPosition();
      const handleResize = () => updateStatusPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showStatusFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTimeRangeFilter && !event.target.closest('.time-range-filter-dropdown')) {
        setShowTimeRangeFilter(false);
      }
      if (showAreaFilter && !event.target.closest('.area-filter-dropdown')) {
        setShowAreaFilter(false);
      }
      if (showSupplierFilter && !event.target.closest('.supplier-filter-dropdown')) {
        setShowSupplierFilter && setShowSupplierFilter(false);
        setSupplierSearchTerm && setSupplierSearchTerm("");
      }
      if (showStatusFilter && !event.target.closest('.status-filter-dropdown')) {
        setShowStatusFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimeRangeFilter, showAreaFilter, showSupplierFilter, showStatusFilter]);

  const handleToggle = () => {
    setShowSearchFilter(!showSearchFilter);
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      setSearchQuery("");
      setTimeRange && setTimeRange("week");
      setAreaId && setAreaId("");
      setSupplierFilter && setSupplierFilter("");
      setSupplierSearchTerm && setSupplierSearchTerm("");
      setQuantityRange && setQuantityRange({ value: "", type: "", min: "", max: "" });
      setRemainingDaysRange && setRemainingDaysRange({ value: "", type: "", min: "", max: "" });
      setStatusFilter && setStatusFilter("");
    }
  };

  const hasActiveFilters = searchQuery ||
    (timeRange && timeRange !== "week") ||
    areaId ||
    supplierFilter ||
    (quantityRange && quantityRange.value) ||
    (remainingDaysRange && remainingDaysRange.value !== undefined && remainingDaysRange.value !== "") ||
    statusFilter;

  // 🔧 Thêm ở đầu component
  const normalizeString = (str) =>
    str
      ?.toLowerCase()
      .trim()
      .replace(/\s+/g, " ");


  // const currentTimeRangeLabel = timeRangeOptions.find(opt => opt.value === timeRange)?.label || timeRangeOptions[0].label;

  return (
    <>
      {/* Custom scrollbar styles */}
      <style>{`
        .dropdown-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .dropdown-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Search and Filter Toggle Header */}
      {showToggle && (
        <div className="bg-gray-50 border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleToggle}
              className="flex items-center space-x-2 text-slate-700 hover:text-orange-500 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="font-medium text-sm">Tìm kiếm & Lọc</span>
              {showSearchFilter ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      {showSearchFilter && (
        <div className="bg-gray-50 border-b border-slate-200 px-6 py-2 relative" style={{ overflow: 'visible' }}>
          <div className="flex flex-row gap-4 items-start">
            <div className="flex flex-col gap-1 flex-1">
              {/* First Row: Search and Supplier Filter */}
              <div className="flex flex-wrap items-center gap-[30px] relative" style={{ overflow: 'visible' }}>
                {/* Search Bar */}
                <div className={`relative ${searchWidth}`}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 h-[38px] text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Time Range Filter */}
                {/* <div className="relative time-range-filter-dropdown">
                <button
                  onClick={() => setShowTimeRangeFilter(!showTimeRangeFilter)}
                  className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                    focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                    ${timeRange && timeRange !== "week"
                      ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                      : 'bg-white text-slate-700 hover:bg-white'
                    }`}
                >
                  <span className="text-sm font-medium truncate">
                    {currentTimeRangeLabel}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </button>

                {showTimeRangeFilter && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                    <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                      {timeRangeOptions.length > 0 ? (
                        timeRangeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTimeRange(option.value);
                              setShowTimeRangeFilter(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                          >
                            {option.label}
                            {timeRange === option.value && <span className="text-[#d97706]">✓</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-slate-500 text-center">
                          Không có tùy chọn
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div> */}

                {/* Area Filter - Only show for current report, not period report */}
                {reportType === "current" && areas && areas.length > 0 && (
                  <div className="relative area-filter-dropdown" ref={areaFilterRef}>
                    <button
                      onClick={() => setShowAreaFilter(!showAreaFilter)}
                      className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${areaId
                          ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                          : 'bg-white text-slate-700 hover:bg-white'
                        }`}
                    >
                      <span className="text-sm font-medium truncate">
                        {areaId
                          ? (areas.find(a => String(a.areaId || a.AreaId) === String(areaId))?.areaName || areas.find(a => String(a.areaId || a.AreaId) === String(areaId))?.AreaName || "Chọn khu vực")
                          : "Tất cả khu vực"
                        }
                      </span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </button>

                    {showAreaFilter && (
                      <div
                        className="fixed w-48 bg-white rounded-md shadow-lg border z-[9999] overflow-hidden flex flex-col"
                        style={{
                          top: `${areaDropdownPosition.top}px`,
                          left: `${areaDropdownPosition.left}px`,
                          maxHeight: '400px'
                        }}
                      >
                        <div className="py-1 overflow-y-auto flex-1 dropdown-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9', maxHeight: '350px' }}>
                          <button
                            onClick={() => {
                              setAreaId("");
                              setShowAreaFilter(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                          >
                            Tất cả khu vực
                            {!areaId && <span className="text-[#d97706]">✓</span>}
                          </button>
                          {areas.map((area) => {
                            const areaIdValue = String(area.areaId || area.AreaId);
                            const areaName = area.areaName || area.AreaName;
                            return (
                              <button
                                key={areaIdValue}
                                onClick={() => {
                                  setAreaId(areaIdValue);
                                  setShowAreaFilter(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                              >
                                <span className="truncate">{areaName}</span>
                                {areaId === areaIdValue && <span className="text-[#d97706]">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Supplier Filter */}
                {suppliers && suppliers.length > 0 && (
                  <div className="relative supplier-filter-dropdown" ref={supplierFilterRef}>
                    <button
                      onClick={() => setShowSupplierFilter && setShowSupplierFilter(!showSupplierFilter)}
                      className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-64
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${supplierFilter
                          ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                          : 'bg-white text-slate-700 hover:bg-white'
                        }`}
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {supplierFilter
                          ? (suppliers.find(s => s.supplierId.toString() === supplierFilter)?.companyName || "Chọn nhà cung cấp")
                          : "Tất cả nhà cung cấp"
                        }
                      </span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </button>

                    {showSupplierFilter && (
                      <div
                        className="fixed w-64 bg-white rounded-md shadow-lg border z-[9999] overflow-hidden flex flex-col"
                        style={{
                          top: `${supplierDropdownPosition.top}px`,
                          left: `${supplierDropdownPosition.left}px`,
                          maxHeight: '400px'
                        }}
                      >
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10 flex-shrink-0">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm nhà cung cấp..."
                              value={supplierSearchTerm || ""}
                              onChange={(e) => setSupplierSearchTerm && setSupplierSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {/* Dropdown List */}
                        <div className="py-1 overflow-y-auto flex-1 dropdown-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9', maxHeight: '350px' }}>
                          <button
                            onClick={() => {
                              setSupplierFilter && setSupplierFilter("")
                              setShowSupplierFilter && setShowSupplierFilter(false)
                              setSupplierSearchTerm && setSupplierSearchTerm("")
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                          >
                            Tất cả nhà cung cấp
                            {!supplierFilter && <span className="text-[#d97706]">✓</span>}
                          </button>
                          {(filteredSuppliers && filteredSuppliers.length > 0 ? filteredSuppliers : suppliers).map((supplier) => (
                            <button
                              key={supplier.supplierId}
                              onClick={() => {
                                setSupplierFilter && setSupplierFilter(supplier.supplierId.toString())
                                setShowSupplierFilter && setShowSupplierFilter(false)
                                setSupplierSearchTerm && setSupplierSearchTerm("")
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${supplierFilter === supplier.supplierId.toString()
                                ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                                : 'text-slate-700'
                                }`}
                            >
                              <span className="truncate">{supplier.companyName}</span>
                              {supplierFilter === supplier.supplierId.toString() && <span className="text-white">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Second Row: Additional Filters for Current Inventory Report */}
              {reportType === "current" && (
                <div className="flex flex-wrap items-center gap-[30px] mt-1">
                  {/* Quantity Range Filter */}
                  <div className="flex items-center gap-[10px]">
                    <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Số lượng thùng:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Nhập số lượng"
                        min="0"
                        value={quantityRange?.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (parseFloat(value) >= 0 && !isNaN(value))) {
                            const numValue = value === "" ? "" : parseFloat(value);
                            if (numValue === "") {
                              setQuantityRange && setQuantityRange({ value: "", type: "", min: "", max: "" })
                            } else {
                              // Giữ nguyên type nếu đã có, nếu không thì mặc định là "below"
                              const currentType = quantityRange?.type || "below";
                              if (currentType === "below") {
                                setQuantityRange && setQuantityRange({
                                  value: value,
                                  type: "below",
                                  min: "1",
                                  max: value
                                })
                              } else {
                                setQuantityRange && setQuantityRange({
                                  value: value,
                                  type: "above",
                                  min: value,
                                  max: ""
                                })
                              }
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                            e.preventDefault();
                          }
                        }}
                        className="w-32 px-2 h-[38px] text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      {quantityRange?.value && (
                        <button
                          type="button"
                          onClick={() => {
                            const currentType = quantityRange?.type || "below";
                            const newType = currentType === "below" ? "above" : "below";
                            const numValue = parseFloat(quantityRange.value);
                            if (newType === "below") {
                              setQuantityRange && setQuantityRange({
                                value: quantityRange.value,
                                type: "below",
                                min: "1",
                                max: quantityRange.value
                              })
                            } else {
                              setQuantityRange && setQuantityRange({
                                value: quantityRange.value,
                                type: "above",
                                min: quantityRange.value,
                                max: ""
                              })
                            }
                          }}
                          className={`flex items-center justify-center w-[38px] h-[38px] border rounded-md transition-colors ${quantityRange?.type === "above"
                            ? 'bg-[#d97706] text-white border-[#d97706] hover:bg-[#d97706]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          title={quantityRange?.type === "above" ? "Trên" : "Dưới"}
                        >
                          {quantityRange?.type === "above" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remaining Days Range Filter */}
                  <div className="flex items-center gap-[10px]">
                    <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Hạn sử dụng còn (ngày):</label>
                    <div className="flex items-center gap-[10px]">
                      <input
                        type="number"
                        placeholder="Nhập số ngày"
                        value={remainingDaysRange?.value !== undefined ? remainingDaysRange.value : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (!isNaN(value) && value !== '-')) {
                            const numValue = value === "" ? "" : parseFloat(value);
                            if (numValue === "") {
                              setRemainingDaysRange && setRemainingDaysRange({ value: "", type: "", min: "", max: "" })
                            } else {
                              // Giữ nguyên type nếu đã có, nếu không thì mặc định là "below"
                              const currentType = remainingDaysRange?.type || "below";
                              if (currentType === "below") {
                                setRemainingDaysRange && setRemainingDaysRange({
                                  value: value,
                                  type: "below",
                                  min: "",
                                  max: value
                                })
                              } else {
                                setRemainingDaysRange && setRemainingDaysRange({
                                  value: value,
                                  type: "above",
                                  min: value,
                                  max: ""
                                })
                              }
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'e' || e.key === 'E' || e.key === '+') {
                            e.preventDefault();
                          }
                        }}
                        className="w-32 px-2 h-[38px] text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      {remainingDaysRange?.value !== undefined && remainingDaysRange.value !== "" && (
                        <button
                          type="button"
                          onClick={() => {
                            const currentType = remainingDaysRange?.type || "below";
                            const newType = currentType === "below" ? "above" : "below";
                            if (newType === "below") {
                              setRemainingDaysRange && setRemainingDaysRange({
                                value: remainingDaysRange.value,
                                type: "below",
                                min: "",
                                max: remainingDaysRange.value
                              })
                            } else {
                              setRemainingDaysRange && setRemainingDaysRange({
                                value: remainingDaysRange.value,
                                type: "above",
                                min: remainingDaysRange.value,
                                max: ""
                              })
                            }
                          }}
                          className={`flex items-center justify-center w-[38px] h-[38px] border rounded-md transition-colors ${remainingDaysRange?.type === "above"
                            ? 'bg-[#d97706] text-white border-[#d97706] hover:bg-[#d97706]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          title={remainingDaysRange?.type === "above" ? "Trên" : "Dưới"}
                        >
                          {remainingDaysRange?.type === "above" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-[10px]">
                    <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Trạng thái:</label>
                    <div className="relative status-filter-dropdown" ref={statusFilterRef}>
                      <button
                        onClick={() => setShowStatusFilter(!showStatusFilter)}
                        className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                        focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                        ${statusFilter
                            ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                            : 'bg-white text-slate-700 hover:bg-white'
                          }`}
                      >
                        <span className="text-sm font-medium truncate">
                          {statusFilter === "expired"
                            ? "Hết hạn"
                            : statusFilter === "expiringSoon"
                              ? "Sắp hết hạn"
                              : statusFilter === "valid"
                                ? "Còn hạn"
                                : "Tất cả"
                          }
                        </span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </button>

                      {showStatusFilter && (
                        <div
                          className="fixed w-48 bg-white rounded-md shadow-lg border z-[9999] overflow-hidden flex flex-col"
                          style={{
                            top: `${statusDropdownPosition.top}px`,
                            left: `${statusDropdownPosition.left}px`,
                            maxHeight: '400px'
                          }}
                        >
                          {/* Dropdown List */}
                          <div className="py-1 overflow-y-auto flex-1 dropdown-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9', maxHeight: '350px' }}>
                            <button
                              onClick={() => {
                                setStatusFilter && setStatusFilter("")
                                setShowStatusFilter(false)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              Tất cả
                              {!statusFilter && <span className="text-[#d97706]">✓</span>}
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter && setStatusFilter("expired")
                                setShowStatusFilter(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${statusFilter === "expired"
                                ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                                : 'text-slate-700'
                                }`}
                            >
                              <span>Hết hạn</span>
                              {statusFilter === "expired" && <span className="text-white">✓</span>}
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter && setStatusFilter("expiringSoon")
                                setShowStatusFilter(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${statusFilter === "expiringSoon"
                                ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                                : 'text-slate-700'
                                }`}
                            >
                              <span>Sắp hết hạn</span>
                              {statusFilter === "expiringSoon" && <span className="text-white">✓</span>}
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter && setStatusFilter("valid")
                                setShowStatusFilter(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${statusFilter === "valid"
                                ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                                : 'text-slate-700'
                                }`}
                            >
                              <span>Còn hạn</span>
                              {statusFilter === "valid" && <span className="text-white">✓</span>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters Button - Positioned between the two rows */}
            {showClearButton && (
              <div className="flex items-center">
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  size="sm"
                  className="h-[38px]"
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Bỏ lọc
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

