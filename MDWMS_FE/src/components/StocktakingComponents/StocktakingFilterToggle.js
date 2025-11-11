import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Settings,
  RefreshCw,
  X
} from "lucide-react";
import { Input } from "../ui/input";
import ClearFiltersButton from "../Common/ClearFiltersButton";

export default function StocktakingFilterToggle({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Tìm kiếm phiếu kiểm kê...",
  statusFilter,
  setStatusFilter,
  showStatusFilter,
  setShowStatusFilter,
  statusOptions = [
    { value: "", label: "Tất cả trạng thái" }
  ],
  onStatusFilter,
  clearStatusFilter,
  searchWidth = "w-[450px]",
  showToggle = true,
  defaultOpen = true,
  onClearAll = null,
  showClearButton = true,
  // Page Size Filter
  pageSize,
  setPageSize,
  showPageSizeFilter,
  setShowPageSizeFilter,
  pageSizeOptions = [10, 20, 30, 40],
  onPageSizeChange,
  showPageSizeButton = false,
  // Refresh button
  onRefresh = null,
  showRefreshButton = true
}) {
  const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);
  const [statusSearchQuery, setStatusSearchQuery] = useState("");
  
  // Refs for dropdown elements
  const statusFilterRef = useRef(null);
  const pageSizeFilterRef = useRef(null);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close status filter dropdown if clicked outside
      if (showStatusFilter && statusFilterRef.current && !statusFilterRef.current.contains(event.target)) {
        setShowStatusFilter(false);
        setStatusSearchQuery("");
      }
      
      // Close page size filter dropdown if clicked outside
      if (showPageSizeFilter && pageSizeFilterRef.current && !pageSizeFilterRef.current.contains(event.target)) {
        setShowPageSizeFilter(false);
      }
    };

    // Add event listener when dropdowns are open
    if (showStatusFilter || showPageSizeFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusFilter, showPageSizeFilter]);

  const handleToggle = () => {
    setShowSearchFilter(!showSearchFilter);
  };

  // Filter status options based on search query
  const filteredStatusOptions = statusOptions.filter(option =>
    option.label.toLowerCase().includes(statusSearchQuery.toLowerCase())
  );

  const handleStatusClick = (value) => {
    setStatusFilter(value);
    setShowStatusFilter(false);
    setStatusSearchQuery("");
    if (onStatusFilter) {
      onStatusFilter(value);
    }
  };

  return (
    <div className="w-full">
      <style>{`
        .status-filter-dropdown {
          position: relative;
        }
        .page-size-filter-dropdown {
          position: relative;
        }
        .dropdown-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .dropdown-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
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

            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              {showRefreshButton && onRefresh && (
                <button
                  onClick={onRefresh}
                  className="flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors bg-white text-slate-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm font-medium">Làm mới</span>
                </button>
              )}

              {/* Page Size Filter */}
              {showPageSizeButton && (
                <div className="relative page-size-filter-dropdown" ref={pageSizeFilterRef}>
                  <button
                    onClick={() => setShowPageSizeFilter(!showPageSizeFilter)}
                    className="flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors bg-white text-slate-700"
                  >
                    <span className="text-sm font-medium">
                      {pageSize} / trang
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {showPageSizeFilter && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                      <div className="py-1">
                        {pageSizeOptions.map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              onPageSizeChange(size);
                              setShowPageSizeFilter(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${pageSize === size ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                          >
                            {size} / trang
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      {showSearchFilter && (
        <div className="bg-gray-50 border-b border-slate-200 px-6 py-4 relative overflow-visible">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 relative overflow-visible flex-1">
              {/* Search Bar */}
              <div className={`relative ${searchWidth}`}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-[38px] text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
              </div>

              {/* Status Filter */}
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
                  <Filter className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {filteredStatusOptions.find(option => option.value === statusFilter)?.label || statusOptions[0].label}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </button>

                {showStatusFilter && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                    {/* Search input for status filter */}
                    <div className="p-2 border-b border-slate-200">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Tìm kiếm trạng thái..."
                          value={statusSearchQuery}
                          onChange={(e) => setStatusSearchQuery(e.target.value)}
                          className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                        {statusSearchQuery && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusSearchQuery("");
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                      {filteredStatusOptions.length > 0 ? (
                        filteredStatusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleStatusClick(option.value)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors ${
                              statusFilter === option.value
                                ? 'bg-orange-100 text-orange-700 font-medium'
                                : 'text-slate-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500 text-center">
                          Không tìm thấy trạng thái
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clear Filters Button - Đặt ở bên phải nhất */}
            {showClearButton && (
              <div className="w-full lg:w-auto flex justify-end">
                <ClearFiltersButton
                  onClear={onClearAll}
                  hasActiveFilters={!!(statusFilter || searchQuery)}
                  buttonText="Bỏ lọc"
                  variant="outline"
                  size="sm"
                  showIcon={true}
                  className="h-[38px]"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

