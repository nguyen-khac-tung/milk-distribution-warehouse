import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, Settings, X } from "lucide-react";
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
  searchWidth = "w-80"
}) {
  const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);
  const [showTimeRangeFilter, setShowTimeRangeFilter] = useState(false);
  const [showAreaFilter, setShowAreaFilter] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTimeRangeFilter && !event.target.closest('.time-range-filter-dropdown')) {
        setShowTimeRangeFilter(false);
      }
      if (showAreaFilter && !event.target.closest('.area-filter-dropdown')) {
        setShowAreaFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimeRangeFilter, showAreaFilter]);

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
    }
  };

  const hasActiveFilters = searchQuery || (timeRange && timeRange !== "week") || areaId;

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
        <div className="bg-gray-50 border-b border-slate-200 px-6 py-4 relative overflow-visible">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 relative overflow-visible">
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

              {/* Area Filter */}
              {areas && areas.length > 0 && (
                <div className="relative area-filter-dropdown">
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
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
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

