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
  // Condition Filter (Tình trạng)
  conditionFilter,
  setConditionFilter,
  showConditionFilter,
  setShowConditionFilter,
  conditionOptions = [
    { value: "", label: "Tất cả tình trạng" },
    { value: "true", label: "Trống" },
    { value: "false", label: "Đang sử dụng" },
  ],
  onConditionFilter,
  clearConditionFilter,
  // Role Filter
  roleFilter,
  setRoleFilter,
  showRoleFilter,
  setShowRoleFilter,
  roles = [],
  onRoleFilter,
  clearRoleFilter,
  // Category Filter
  categoryFilter,
  setCategoryFilter,
  showCategoryFilter,
  setShowCategoryFilter,
  categories = [],
  onCategoryFilter,
  clearCategoryFilter,
  // Supplier Filter
  supplierFilter,
  setSupplierFilter,
  showSupplierFilter,
  setShowSupplierFilter,
  suppliers = [],
  onSupplierFilter,
  clearSupplierFilter,
  // Unit Measure Filter
  unitMeasureFilter,
  setUnitMeasureFilter,
  showUnitMeasureFilter,
  setShowUnitMeasureFilter,
  unitMeasures = [],
  onUnitMeasureFilter,
  clearUnitMeasureFilter,
  searchWidth = "w-80",
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
  // Feature flags
  enableConditionFilter = false
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
      if (clearRoleFilter) {
        clearRoleFilter();
      }
      if (clearCategoryFilter) {
        clearCategoryFilter();
      }
      if (clearSupplierFilter) {
        clearSupplierFilter();
      }
      if (clearUnitMeasureFilter) {
        clearUnitMeasureFilter();
      }
    }
  };

  const hasActiveFilters = searchQuery || statusFilter || roleFilter || categoryFilter || supplierFilter || unitMeasureFilter;

  return (
    <>
      {/* Custom scrollbar styles */}
      <style jsx>{`
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

            {/* Page Size Filter */}
            {showPageSizeButton && (
              <div className="relative page-size-filter-dropdown">
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
                            onPageSizeChange(size)
                            setShowPageSizeFilter(false)
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
      )}

      {/* Search and Filter Bar */}
      {showSearchFilter && (
        <div className="bg-gray-50 border-b border-slate-200 px-6 py-4 relative overflow-visible">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 relative overflow-visible">
              {/* Search Bar */}
              <div className={`relative w-full sm:w-80`}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-[38px] text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
              </div>

              {/* Status Filter */}
              <div className="relative status-filter-dropdown">
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
                    {statusOptions.find(option => option.value === statusFilter)?.label || statusOptions[0].label}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </button>

                {showStatusFilter && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                    <div className="py-1">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            onStatusFilter(option.value);
                            setShowStatusFilter(false);
                          }}
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

              {/* Condition Filter (Tình trạng) */}
              {enableConditionFilter && (
                <div className="relative condition-filter-dropdown">
                  <button
                    onClick={() => setShowConditionFilter(!showConditionFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                    focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                    ${conditionFilter
                        ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                        : 'bg-white text-slate-700 hover:bg-white'
                      }`}
                  >
                    <Filter className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {conditionOptions.find(option => option.value === conditionFilter)?.label || conditionOptions[0].label}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showConditionFilter && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {conditionOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              onConditionFilter(option.value);
                              setShowConditionFilter(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                          >
                            {option.label}
                            {conditionFilter === option.value && <span className="text-[#d97706]">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role Filter */}
              {roles.length > 0 && (
                <div className="relative role-filter-dropdown">
                  <button
                    onClick={() => setShowRoleFilter(!showRoleFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors min-w-0 max-w-48 ${roleFilter ? 'bg-[#d97706] text-white' : 'bg-white text-slate-700'
                      }`}
                  >
                    <span className="text-sm font-medium truncate">
                      {roleFilter ? roleFilter : "Tất cả chức vụ"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showRoleFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-60 overflow-y-auto">
                      <div className="py-1">
                        <button
                          onClick={clearRoleFilter}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả chức vụ
                        </button>
                        {roles.map((role) => (
                          <button
                            key={role}
                            onClick={() => onRoleFilter(role)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${roleFilter === role ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="relative category-filter-dropdown">
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors min-w-0 max-w-48 ${categoryFilter ? 'bg-[#d97706] text-white' : 'bg-white text-slate-700'
                      }`}
                  >
                    <span className="text-sm font-medium truncate">
                      {categoryFilter ? categories.find(c => c.categoryId.toString() === categoryFilter)?.categoryName || "Chọn danh mục" : "Tất cả danh mục"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showCategoryFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                      <div className="py-1">
                        <button
                          onClick={clearCategoryFilter}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả danh mục
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category.categoryId}
                            onClick={() => onCategoryFilter(category.categoryId.toString())}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${categoryFilter === category.categoryId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                          >
                            {category.categoryName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Supplier Filter */}
              {suppliers.length > 0 && (
                <div className="relative supplier-filter-dropdown">
                  <button
                    onClick={() => setShowSupplierFilter(!showSupplierFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors min-w-0 max-w-48 ${supplierFilter ? 'bg-[#d97706] text-white' : 'bg-white text-slate-700'
                      }`}
                  >
                    <span className="text-sm font-medium truncate">
                      {supplierFilter ? suppliers.find(s => s.supplierId.toString() === supplierFilter)?.companyName || "Chọn nhà cung cấp" : "Tất cả nhà cung cấp"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showSupplierFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                      <div className="py-1">
                        <button
                          onClick={clearSupplierFilter}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả nhà cung cấp
                        </button>
                        {suppliers.map((supplier) => (
                          <button
                            key={supplier.supplierId}
                            onClick={() => onSupplierFilter(supplier.supplierId.toString())}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${supplierFilter === supplier.supplierId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                          >
                            {supplier.companyName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Unit Measure Filter */}
              {unitMeasures.length > 0 && (
                <div className="relative unit-measure-filter-dropdown">
                  <button
                    onClick={() => setShowUnitMeasureFilter(!showUnitMeasureFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors min-w-0 max-w-48 ${unitMeasureFilter ? 'bg-[#d97706] text-white' : 'bg-white text-slate-700'
                      }`}
                  >
                    <span className="text-sm font-medium truncate">
                      {unitMeasureFilter ? unitMeasures.find(u => u.unitMeasureId.toString() === unitMeasureFilter)?.name || "Chọn đơn vị" : "Tất cả đơn vị"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showUnitMeasureFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                      <div className="py-1">
                        <button
                          onClick={clearUnitMeasureFilter}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả đơn vị
                        </button>
                        {unitMeasures.map((unit) => (
                          <button
                            key={unit.unitMeasureId}
                            onClick={() => onUnitMeasureFilter(unit.unitMeasureId.toString())}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${unitMeasureFilter === unit.unitMeasureId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                          >
                            {unit.name}
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
                <ClearFiltersButton
                  onClear={handleClearAll}
                  hasActiveFilters={hasActiveFilters}
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
    </>
  );
}
