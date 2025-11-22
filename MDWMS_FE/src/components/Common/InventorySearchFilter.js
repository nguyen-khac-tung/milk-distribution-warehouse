import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, ChevronUp, Settings, X, Building2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function InventorySearchFilter({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Tìm kiếm theo mã lô, tên sản phẩm...",
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
  reportType = "current" // "current" or "period"
}) {
  const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);
  const [showTimeRangeFilter, setShowTimeRangeFilter] = useState(false);
  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const supplierFilterRef = useRef(null);
  const [supplierDropdownPosition, setSupplierDropdownPosition] = useState({ top: 0, left: 0 });
  const areaFilterRef = useRef(null);
  const [areaDropdownPosition, setAreaDropdownPosition] = useState({ top: 0, left: 0 });

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimeRangeFilter, showAreaFilter, showSupplierFilter]);

  const handleToggle = () => {
    setShowSearchFilter(!showSearchFilter);
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      setSearchQuery("");
      setTimeRange("week");
      setAreaId("");
      setSupplierFilter && setSupplierFilter("");
      setSupplierSearchTerm && setSupplierSearchTerm("");
    }
  };

  const hasActiveFilters = searchQuery || (timeRange && timeRange !== "week") || areaId || supplierFilter;

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
        <div className="bg-gray-50 border-b border-slate-200 px-6 py-4 relative" style={{ overflow: 'visible' }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 relative" style={{ overflow: 'visible' }}>
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

            {/* Clear Filters Button */}
            {showClearButton && (
              <div className="flex justify-end lg:justify-start">
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

