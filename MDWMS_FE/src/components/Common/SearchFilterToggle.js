import React, { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, ChevronUp, Settings, X } from "lucide-react";
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
  // Retailer Filter
  retailerFilter,
  setRetailerFilter,
  showRetailerFilter,
  setShowRetailerFilter,
  retailers = [],
  onRetailerFilter,
  clearRetailerFilter,
  // Unit Measure Filter
  unitMeasureFilter,
  setUnitMeasureFilter,
  showUnitMeasureFilter,
  setShowUnitMeasureFilter,
  unitMeasures = [],
  onUnitMeasureFilter,
  clearUnitMeasureFilter,
  // Area Filter
  areaFilter,
  setAreaFilter,
  showAreaFilter,
  setShowAreaFilter,
  areas = [],
  onAreaFilter,
  clearAreaFilter,
  // Creator Filter
  creatorFilter,
  setCreatorFilter,
  showCreatorFilter,
  setShowCreatorFilter,
  creators = [],
  onCreatorFilter,
  clearCreatorFilter,
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
  enableConditionFilter = false,
  // Search functionality for dropdowns
  enableRetailerSearch = false,
  enableStatusSearch = false,
  enableCategorySearch = false,
  enableSupplierSearch = false,
  enableUnitMeasureSearch = false,
  enableRoleSearch = false,
  enableAreaSearch = false,
  enableCreatorSearch = false,
  enableConditionSearch = false,
  retailerSearchQuery: externalRetailerSearchQuery = "",
  setRetailerSearchQuery: setExternalRetailerSearchQuery = null,
  statusSearchQuery: externalStatusSearchQuery = "",
  setStatusSearchQuery: setExternalStatusSearchQuery = null,
  categorySearchQuery: externalCategorySearchQuery = "",
  setCategorySearchQuery: setExternalCategorySearchQuery = null,
  supplierSearchQuery: externalSupplierSearchQuery = "",
  setSupplierSearchQuery: setExternalSupplierSearchQuery = null,
  unitMeasureSearchQuery: externalUnitMeasureSearchQuery = "",
  setUnitMeasureSearchQuery: setExternalUnitMeasureSearchQuery = null,
  roleSearchQuery: externalRoleSearchQuery = "",
  setRoleSearchQuery: setExternalRoleSearchQuery = null,
  areaSearchQuery: externalAreaSearchQuery = "",
  setAreaSearchQuery: setExternalAreaSearchQuery = null,
  creatorSearchQuery: externalCreatorSearchQuery = "",
  setCreatorSearchQuery: setExternalCreatorSearchQuery = null,
  conditionSearchQuery: externalConditionSearchQuery = "",
  setConditionSearchQuery: setExternalConditionSearchQuery = null,
  filteredRetailers: externalFilteredRetailers = null,
  filteredStatusOptions: externalFilteredStatusOptions = null,
  filteredCategories: externalFilteredCategories = null,
  filteredSuppliers: externalFilteredSuppliers = null,
  filteredUnitMeasures: externalFilteredUnitMeasures = null,
  filteredRoles: externalFilteredRoles = null,
  filteredAreas: externalFilteredAreas = null,
  filteredCreators: externalFilteredCreators = null,
  filteredConditionOptions: externalFilteredConditionOptions = null
}) {
  const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);
  const [internalRetailerSearchQuery, setInternalRetailerSearchQuery] = useState("");
  const [internalStatusSearchQuery, setInternalStatusSearchQuery] = useState("");
  const [internalCategorySearchQuery, setInternalCategorySearchQuery] = useState("");
  const [internalSupplierSearchQuery, setInternalSupplierSearchQuery] = useState("");
  const [internalUnitMeasureSearchQuery, setInternalUnitMeasureSearchQuery] = useState("");
  const [internalRoleSearchQuery, setInternalRoleSearchQuery] = useState("");
  const [internalAreaSearchQuery, setInternalAreaSearchQuery] = useState("");
  const [internalCreatorSearchQuery, setInternalCreatorSearchQuery] = useState("");
  const [internalConditionSearchQuery, setInternalConditionSearchQuery] = useState("");

  // Use external or internal search queries
  const retailerSearchQuery = enableRetailerSearch ? (externalRetailerSearchQuery !== undefined ? externalRetailerSearchQuery : internalRetailerSearchQuery) : "";
  const setRetailerSearchQuery = enableRetailerSearch ? (setExternalRetailerSearchQuery || setInternalRetailerSearchQuery) : null;
  const statusSearchQuery = enableStatusSearch ? (externalStatusSearchQuery !== undefined ? externalStatusSearchQuery : internalStatusSearchQuery) : "";
  const setStatusSearchQuery = enableStatusSearch ? (setExternalStatusSearchQuery || setInternalStatusSearchQuery) : null;
  const categorySearchQuery = enableCategorySearch ? (externalCategorySearchQuery !== undefined ? externalCategorySearchQuery : internalCategorySearchQuery) : "";
  const setCategorySearchQuery = enableCategorySearch ? (setExternalCategorySearchQuery || setInternalCategorySearchQuery) : null;
  const supplierSearchQuery = enableSupplierSearch ? (externalSupplierSearchQuery !== undefined ? externalSupplierSearchQuery : internalSupplierSearchQuery) : "";
  const setSupplierSearchQuery = enableSupplierSearch ? (setExternalSupplierSearchQuery || setInternalSupplierSearchQuery) : null;
  const unitMeasureSearchQuery = enableUnitMeasureSearch ? (externalUnitMeasureSearchQuery !== undefined ? externalUnitMeasureSearchQuery : internalUnitMeasureSearchQuery) : "";
  const setUnitMeasureSearchQuery = enableUnitMeasureSearch ? (setExternalUnitMeasureSearchQuery || setInternalUnitMeasureSearchQuery) : null;
  const roleSearchQuery = enableRoleSearch ? (externalRoleSearchQuery !== undefined ? externalRoleSearchQuery : internalRoleSearchQuery) : "";
  const setRoleSearchQuery = enableRoleSearch ? (setExternalRoleSearchQuery || setInternalRoleSearchQuery) : null;
  const areaSearchQuery = enableAreaSearch ? (externalAreaSearchQuery !== undefined ? externalAreaSearchQuery : internalAreaSearchQuery) : "";
  const setAreaSearchQuery = enableAreaSearch ? (setExternalAreaSearchQuery || setInternalAreaSearchQuery) : null;
  const creatorSearchQuery = enableCreatorSearch ? (externalCreatorSearchQuery !== undefined ? externalCreatorSearchQuery : internalCreatorSearchQuery) : "";
  const setCreatorSearchQuery = enableCreatorSearch ? (setExternalCreatorSearchQuery || setInternalCreatorSearchQuery) : null;
  const conditionSearchQuery = enableConditionSearch ? (externalConditionSearchQuery !== undefined ? externalConditionSearchQuery : internalConditionSearchQuery) : "";
  const setConditionSearchQuery = enableConditionSearch ? (setExternalConditionSearchQuery || setInternalConditionSearchQuery) : null;

  // Filter retailers based on search query
  const filteredRetailers = useMemo(() => {
    if (externalFilteredRetailers) return externalFilteredRetailers;
    if (!enableRetailerSearch || !retailerSearchQuery) return retailers;
    const query = retailerSearchQuery.toLowerCase();
    return retailers.filter(retailer => {
      const retailerName = (retailer.companyName || retailer.retailerName || "").toLowerCase();
      return retailerName.includes(query);
    });
  }, [retailers, retailerSearchQuery, enableRetailerSearch, externalFilteredRetailers]);

  // Filter status options based on search query
  const filteredStatusOptions = useMemo(() => {
    if (externalFilteredStatusOptions) return externalFilteredStatusOptions;
    if (!enableStatusSearch || !statusSearchQuery) return statusOptions;
    const query = statusSearchQuery.toLowerCase();
    return statusOptions.filter(option =>
      option.label.toLowerCase().includes(query)
    );
  }, [statusOptions, statusSearchQuery, enableStatusSearch, externalFilteredStatusOptions]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (externalFilteredCategories) return externalFilteredCategories;
    if (!enableCategorySearch || !categorySearchQuery) return categories;
    const query = categorySearchQuery.toLowerCase();
    return categories.filter(category => {
      const categoryName = (category.categoryName || "").toLowerCase();
      return categoryName.includes(query);
    });
  }, [categories, categorySearchQuery, enableCategorySearch, externalFilteredCategories]);

  // Filter suppliers based on search query
  const filteredSuppliers = useMemo(() => {
    if (externalFilteredSuppliers) return externalFilteredSuppliers;
    if (!enableSupplierSearch || !supplierSearchQuery) return suppliers;
    const query = supplierSearchQuery.toLowerCase();
    return suppliers.filter(supplier => {
      const supplierName = (supplier.companyName || "").toLowerCase();
      return supplierName.includes(query);
    });
  }, [suppliers, supplierSearchQuery, enableSupplierSearch, externalFilteredSuppliers]);

  // Filter unit measures based on search query
  const filteredUnitMeasures = useMemo(() => {
    if (externalFilteredUnitMeasures) return externalFilteredUnitMeasures;
    if (!enableUnitMeasureSearch || !unitMeasureSearchQuery) return unitMeasures;
    const query = unitMeasureSearchQuery.toLowerCase();
    return unitMeasures.filter(unit => {
      const unitName = (unit.name || "").toLowerCase();
      return unitName.includes(query);
    });
  }, [unitMeasures, unitMeasureSearchQuery, enableUnitMeasureSearch, externalFilteredUnitMeasures]);

  // Filter roles based on search query
  const filteredRoles = useMemo(() => {
    if (externalFilteredRoles) return externalFilteredRoles;
    if (!enableRoleSearch || !roleSearchQuery) return roles;
    const query = roleSearchQuery.toLowerCase();
    return roles.filter(role => {
      const roleLabel = typeof role === 'object' ? (role.label || role.description || role.roleName || "").toLowerCase() : role.toString().toLowerCase();
      return roleLabel.includes(query);
    });
  }, [roles, roleSearchQuery, enableRoleSearch, externalFilteredRoles]);

  // Filter areas based on search query
  const filteredAreas = useMemo(() => {
    if (externalFilteredAreas) return externalFilteredAreas;
    if (!enableAreaSearch || !areaSearchQuery) return areas;
    const query = areaSearchQuery.toLowerCase();
    return areas.filter(area => {
      const areaName = (area.areaName || area.AreaName || area.name || "").toLowerCase();
      return areaName.includes(query);
    });
  }, [areas, areaSearchQuery, enableAreaSearch, externalFilteredAreas]);

  // Filter creators based on search query
  const filteredCreators = useMemo(() => {
    if (externalFilteredCreators) return externalFilteredCreators;
    if (!enableCreatorSearch || !creatorSearchQuery) return creators;
    const query = creatorSearchQuery.toLowerCase();
    return creators.filter(creator => {
      const creatorName = (creator.fullName || "").toLowerCase();
      return creatorName.includes(query);
    });
  }, [creators, creatorSearchQuery, enableCreatorSearch, externalFilteredCreators]);

  // Filter condition options based on search query
  const filteredConditionOptions = useMemo(() => {
    if (externalFilteredConditionOptions) return externalFilteredConditionOptions;
    if (!enableConditionSearch || !conditionSearchQuery) return conditionOptions;
    const query = conditionSearchQuery.toLowerCase();
    return conditionOptions.filter(option =>
      option.label.toLowerCase().includes(query)
    );
  }, [conditionOptions, conditionSearchQuery, enableConditionSearch, externalFilteredConditionOptions]);

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
      if (clearRetailerFilter) {
        clearRetailerFilter();
      }
      if (clearUnitMeasureFilter) {
        clearUnitMeasureFilter();
      }
      if (clearAreaFilter) {
        clearAreaFilter();
      }
      if (clearCreatorFilter) {
        clearCreatorFilter();
      }
    }
  };

  const hasActiveFilters = searchQuery || statusFilter || roleFilter || categoryFilter || supplierFilter || retailerFilter || unitMeasureFilter || areaFilter || creatorFilter;

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
                    {(filteredStatusOptions || statusOptions).find(option => option.value === statusFilter)?.label || statusOptions[0].label}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </button>

                {showStatusFilter && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                    {/* Search input for status filter */}
                    {enableStatusSearch && (
                      <div className="p-2 border-b border-slate-200">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="text"
                            placeholder="Tìm kiếm trạng thái..."
                            value={statusSearchQuery}
                            onChange={(e) => setStatusSearchQuery && setStatusSearchQuery(e.target.value)}
                            className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          {statusSearchQuery && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusSearchQuery && setStatusSearchQuery("");
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                      {(filteredStatusOptions || statusOptions).length > 0 ? (
                        (filteredStatusOptions || statusOptions).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              onStatusFilter(option.value);
                              setShowStatusFilter(false);
                              if (setStatusSearchQuery) setStatusSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                          >
                            {option.label}
                            {statusFilter === option.value && <span className="text-[#d97706]">✓</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-slate-500 text-center">
                          Không tìm thấy kết quả
                        </div>
                      )}
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
                      {(filteredConditionOptions || conditionOptions).find(option => option.value === conditionFilter)?.label || conditionOptions[0].label}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showConditionFilter && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      {/* Search input for condition filter */}
                      {enableConditionSearch && (
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm tình trạng..."
                              value={conditionSearchQuery}
                              onChange={(e) => setConditionSearchQuery && setConditionSearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {conditionSearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConditionSearchQuery && setConditionSearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        {(filteredConditionOptions || conditionOptions).length > 0 ? (
                          (filteredConditionOptions || conditionOptions).map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                onConditionFilter(option.value);
                                setShowConditionFilter(false);
                                if (setConditionSearchQuery) setConditionSearchQuery("");
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              {option.label}
                              {conditionFilter === option.value && <span className="text-[#d97706]">✓</span>}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-slate-500 text-center">
                            Không tìm thấy kết quả
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role Filter */}
              {roles && Array.isArray(roles) && roles.length > 0 && (
                <div className="relative role-filter-dropdown">
                  <button
                    onClick={() => setShowRoleFilter(!showRoleFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${roleFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-sm font-medium truncate">
                      {roleFilter ? (roles.find(r => {
                        const rValue = typeof r === 'object' ? r.value || r.roleName || r.roleId : r
                        return String(rValue) === String(roleFilter)
                      })?.label || roles.find(r => {
                        const rValue = typeof r === 'object' ? r.value || r.roleName || r.roleId : r
                        return String(rValue) === String(roleFilter)
                      })?.description || roleFilter) : "Tất cả chức vụ"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showRoleFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      {/* Search input for role filter */}
                      {enableRoleSearch && (
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm chức vụ..."
                              value={roleSearchQuery}
                              onChange={(e) => setRoleSearchQuery && setRoleSearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {roleSearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRoleSearchQuery && setRoleSearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        <button
                          onClick={() => { clearRoleFilter(); setShowRoleFilter(false); if (setRoleSearchQuery) setRoleSearchQuery(""); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả chức vụ
                        </button>
                        {(filteredRoles || roles).length > 0 ? (
                          (filteredRoles || roles).map((role) => {
                            const roleValue = typeof role === 'object' ? role.value || role.roleName || role.roleId : role
                            const roleLabel = typeof role === 'object' ? role.label || role.description || role.roleName : role

                            return (
                              <button
                                key={roleValue}
                                onClick={() => { onRoleFilter(roleValue); setShowRoleFilter(false); if (setRoleSearchQuery) setRoleSearchQuery(""); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${roleFilter === roleValue ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                              >
                                {roleLabel}
                              </button>
                            )
                          })
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">
                            Không tìm thấy kết quả
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Category Filter */}
              {categories && Array.isArray(categories) && categories.length > 0 && (
                <div className="relative category-filter-dropdown">
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${categoryFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-sm font-medium truncate">
                      {categoryFilter ? categories.find(c => c.categoryId.toString() === categoryFilter)?.categoryName || "Chọn danh mục" : "Tất cả danh mục"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showCategoryFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      {/* Search input for category filter */}
                      {enableCategorySearch && (
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm danh mục..."
                              value={categorySearchQuery}
                              onChange={(e) => setCategorySearchQuery && setCategorySearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {categorySearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCategorySearchQuery && setCategorySearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        <button
                          onClick={() => { clearCategoryFilter(); setShowCategoryFilter(false); if (setCategorySearchQuery) setCategorySearchQuery(""); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả danh mục
                        </button>
                        {(filteredCategories || categories).length > 0 ? (
                          (filteredCategories || categories).map((category) => (
                            <button
                              key={category.categoryId}
                              onClick={() => { onCategoryFilter(category.categoryId.toString()); setShowCategoryFilter(false); if (setCategorySearchQuery) setCategorySearchQuery(""); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${categoryFilter === category.categoryId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                            >
                              {category.categoryName}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">
                            Không tìm thấy kết quả
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Supplier Filter */}
              {suppliers && Array.isArray(suppliers) && suppliers.length > 0 && (
                <div className="relative supplier-filter-dropdown">
                  <button
                    onClick={() => setShowSupplierFilter(!showSupplierFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${supplierFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-sm font-medium truncate">
                      {supplierFilter ? suppliers.find(s => s.supplierId.toString() === supplierFilter)?.companyName || "Chọn nhà cung cấp" : "Tất cả nhà cung cấp"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showSupplierFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      {/* Search input for supplier filter */}
                      {enableSupplierSearch && (
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm nhà cung cấp..."
                              value={supplierSearchQuery}
                              onChange={(e) => setSupplierSearchQuery && setSupplierSearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {supplierSearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSupplierSearchQuery && setSupplierSearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        <button
                          onClick={() => { clearSupplierFilter(); setShowSupplierFilter(false); if (setSupplierSearchQuery) setSupplierSearchQuery(""); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả nhà cung cấp
                        </button>
                        {(filteredSuppliers || suppliers).length > 0 ? (
                          (filteredSuppliers || suppliers).map((supplier) => (
                            <button
                              key={supplier.supplierId}
                              onClick={() => { onSupplierFilter(supplier.supplierId.toString()); setShowSupplierFilter(false); if (setSupplierSearchQuery) setSupplierSearchQuery(""); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${supplierFilter === supplier.supplierId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                            >
                              {supplier.companyName}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">
                            Không tìm thấy kết quả
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Retailer Filter */}
              {retailers && Array.isArray(retailers) && retailers.length > 0 && (
                <div className="relative retailer-filter-dropdown">
                  <button
                    onClick={() => setShowRetailerFilter(!showRetailerFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${retailerFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-sm font-medium truncate">
                      {retailerFilter ? retailers.find(r => r.retailerId?.toString() === retailerFilter || r.retailerId === retailerFilter)?.companyName || retailers.find(r => r.retailerId?.toString() === retailerFilter || r.retailerId === retailerFilter)?.retailerName || "Chọn nhà bán lẻ" : "Tất cả nhà bán lẻ"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showRetailerFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      {/* Search input for retailer filter */}
                      {enableRetailerSearch && (
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm nhà bán lẻ..."
                              value={retailerSearchQuery}
                              onChange={(e) => setRetailerSearchQuery && setRetailerSearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {retailerSearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRetailerSearchQuery && setRetailerSearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        <button
                          onClick={() => { clearRetailerFilter(); setShowRetailerFilter(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả nhà bán lẻ
                        </button>
                        {(filteredRetailers || retailers).length > 0 ? (
                          (filteredRetailers || retailers).map((retailer) => {
                            const retailerId = retailer.retailerId?.toString() || retailer.retailerId;
                            const retailerName = retailer.companyName || retailer.retailerName || '';
                            return (
                              <button
                                key={retailerId}
                                onClick={() => { onRetailerFilter(retailerId); setShowRetailerFilter(false); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${retailerFilter === retailerId ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                              >
                                {retailerName}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">
                            Không tìm thấy kết quả
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Area Filter */}
              {areas && Array.isArray(areas) && areas.length > 0 && (
                <div className="relative area-filter-dropdown">
                  <button
                    onClick={() => setShowAreaFilter(!showAreaFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${areaFilter
                        ? 'bg-[#d97706] text-white hover:bg-[#d97706]'
                        : 'bg-white text-slate-700 hover:bg-white'}
                    `}
                  >
                    <span className="text-sm font-medium">
                      {areaFilter ? (areas.find(a => (a.areaId?.toString?.() ?? a.AreaId?.toString?.()) === areaFilter)?.areaName || areas.find(a => (a.areaId?.toString?.() ?? a.AreaId?.toString?.()) === areaFilter)?.AreaName || "Chọn khu vực") : "Tất cả khu vực"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {showAreaFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      {/* Search input for area filter */}
                      {enableAreaSearch && (
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm khu vực..."
                              value={areaSearchQuery}
                              onChange={(e) => setAreaSearchQuery && setAreaSearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {areaSearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAreaSearchQuery && setAreaSearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        <button
                          onClick={() => { clearAreaFilter(); setShowAreaFilter(false); if (setAreaSearchQuery) setAreaSearchQuery(""); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả khu vực
                        </button>
                        {(filteredAreas || areas).length > 0 ? (
                          (filteredAreas || areas).map((area) => {
                            const id = area.areaId ?? area.AreaId;
                            const name = area.areaName ?? area.AreaName ?? area.name;
                            const idStr = id?.toString?.() ?? '';
                            const isActive = areaFilter === idStr;
                            return (
                              <button
                                key={idStr || name}
                                onClick={() => { onAreaFilter(idStr); setShowAreaFilter(false); if (setAreaSearchQuery) setAreaSearchQuery(""); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${isActive ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                              >
                                {name}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">
                            Không tìm thấy kết quả
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Unit Measure Filter */}
              {unitMeasures && Array.isArray(unitMeasures) && unitMeasures.length > 0 && (
                <div className="relative unit-measure-filter-dropdown">
                  <button
                    onClick={() => setShowUnitMeasureFilter(!showUnitMeasureFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${unitMeasureFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-sm font-medium truncate">
                      {unitMeasureFilter ? unitMeasures.find(u => u.unitMeasureId.toString() === unitMeasureFilter)?.name || "Chọn đơn vị" : "Tất cả đơn vị"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showUnitMeasureFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      {/* Search input for unit measure filter */}
                      {enableUnitMeasureSearch && (
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm đơn vị..."
                              value={unitMeasureSearchQuery}
                              onChange={(e) => setUnitMeasureSearchQuery && setUnitMeasureSearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {unitMeasureSearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnitMeasureSearchQuery && setUnitMeasureSearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        <button
                          onClick={() => { clearUnitMeasureFilter(); setShowUnitMeasureFilter(false); if (setUnitMeasureSearchQuery) setUnitMeasureSearchQuery(""); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả đơn vị
                        </button>
                        {(filteredUnitMeasures || unitMeasures).length > 0 ? (
                          (filteredUnitMeasures || unitMeasures).map((unit) => (
                            <button
                              key={unit.unitMeasureId}
                              onClick={() => { onUnitMeasureFilter(unit.unitMeasureId.toString()); setShowUnitMeasureFilter(false); if (setUnitMeasureSearchQuery) setUnitMeasureSearchQuery(""); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${unitMeasureFilter === unit.unitMeasureId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                            >
                              {unit.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">
                            Không tìm thấy kết quả
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Creator Filter */}
              {creators && Array.isArray(creators) && creators.length > 0 && (
                <div className="relative creator-filter-dropdown">
                  <button
                    onClick={() => setShowCreatorFilter(!showCreatorFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors min-w-0 max-w-48
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${creatorFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-sm font-medium truncate">
                      {creatorFilter ? creators.find(c => c.userId.toString() === creatorFilter)?.fullName || "Chọn người tạo" : "Tất cả người tạo"}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>

                  {showCreatorFilter && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                      {/* Search input for creator filter */}
                      {enableCreatorSearch && (
                        <div className="p-2 border-b border-slate-200">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm người tạo..."
                              value={creatorSearchQuery}
                              onChange={(e) => setCreatorSearchQuery && setCreatorSearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {creatorSearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCreatorSearchQuery && setCreatorSearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="py-1 overflow-y-auto dropdown-scroll max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        <button
                          onClick={() => { clearCreatorFilter(); setShowCreatorFilter(false); if (setCreatorSearchQuery) setCreatorSearchQuery(""); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                        >
                          Tất cả người tạo
                        </button>
                        {(filteredCreators || creators).length > 0 ? (
                          (filteredCreators || creators).map((creator) => (
                            <button
                              key={creator.userId}
                              onClick={() => { onCreatorFilter(creator.userId.toString()); setShowCreatorFilter(false); if (setCreatorSearchQuery) setCreatorSearchQuery(""); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${creatorFilter === creator.userId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                            >
                              {creator.fullName}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">
                            Không tìm thấy kết quả
                          </div>
                        )}
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