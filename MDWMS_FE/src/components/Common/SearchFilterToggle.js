import React, { useState } from "react";
import { Search, Filter, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ClearFiltersButton from "./ClearFiltersButton";

export default function SearchFilterToggle({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Tìm kiếm...",
  statusFilter,
  setStatusFilter,
  showStatusFilter,
  setShowStatusFilter,
  statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "1", label: "Hoạt động" },
    { value: "2", label: "Ngừng hoạt động" }
  ],
  onStatusFilter,
  clearStatusFilter,
  searchWidth = "w-80",
  showToggle = true,
  defaultOpen = true,
  onClearAll = null,
  showClearButton = true
}) {
  const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);

  const handleToggle = () => {
    setShowSearchFilter(!showSearchFilter);
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      // Default clear behavior
      setSearchQuery("");
      if (clearStatusFilter) {
        clearStatusFilter();
      }
    }
  };

  const hasActiveFilters = searchQuery || statusFilter;

  return (
    <>
      {/* Search and Filter Toggle Header */}
      {showToggle && (
        <div className="bg-white border-b border-slate-200 px-6 py-3">
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
      )}

          {/* Search and Filter Bar */}
          {showSearchFilter && (
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className={`relative ${searchWidth}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
              />
            </div>

            {/* Status Filter */}
            <div className="relative status-filter-dropdown">
              <button
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className={`flex items-center space-x-2 px-4 py-2 h-8 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors ${
                  statusFilter ? 'bg-[#d97706] text-white' : 'bg-white text-slate-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {statusOptions.find(option => option.value === statusFilter)?.label || statusOptions[0].label}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showStatusFilter && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                  <div className="py-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onStatusFilter(option.value)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                      >
                        {option.label}
                        {statusFilter === option.value && <span className="text-[#d97706]">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
                )}
              </div>
                </div>
                
                {/* Clear Filters Button */}
                {showClearButton && (
                  <ClearFiltersButton
                    onClear={handleClearAll}
                    hasActiveFilters={hasActiveFilters}
                    buttonText="Bỏ lọc"
                    variant="outline"
                    size="sm"
                    showIcon={true}
                    className="h-8"
                  />
                )}
              </div>
            </div>
          )}
    </>
  );
}
