import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Settings,
  Calendar,
  RefreshCw,
  Building2,      // Supplier icon
  Shield,         // Approver icon
  User,           // Creator icon
  CheckCircle,    // Confirmer icon
  Users,          // Assignee icon
  Clock           // Date range icon
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ClearFiltersButton from "../Common/ClearFiltersButton";

export default function PurchaseOrderFilterToggle({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Tìm kiếm theo mã đơn hàng, nhà cung cấp...",
  statusFilter,
  setStatusFilter,
  showStatusFilter,
  setShowStatusFilter,
  statusOptions = [
    { value: "", label: "Tất cả trạng thái đơn" },
    { value: "1", label: "Chờ duyệt" },
    { value: "2", label: "Đã xuất" },
    { value: "3", label: "Từ chối" },
    { value: "4", label: "Đã duyệt" },
    { value: "5", label: "Đã hủy" }
  ],
  onStatusFilter,
  clearStatusFilter,
  // Supplier Filter
  supplierFilter,
  setSupplierFilter,
  showSupplierFilter,
  setShowSupplierFilter,
  suppliers = [],
  onSupplierFilter,
  clearSupplierFilter,
  showSupplier = true, // Prop để kiểm tra có hiển thị filter hay không
  // Approver Filter (Người duyệt)
  approverFilter,
  setApproverFilter,
  showApproverFilter,
  setShowApproverFilter,
  approvers = [],
  onApproverFilter,
  clearApproverFilter,
  showApprover = true, // Prop để kiểm tra có hiển thị filter hay không
  // Creator Filter (Người tạo)
  creatorFilter,
  setCreatorFilter,
  showCreatorFilter,
  setShowCreatorFilter,
  creators = [],
  onCreatorFilter,
  clearCreatorFilter,
  showCreator = true, // Prop để kiểm tra có hiển thị filter hay không
  // Confirmer Filter (Người xác nhận đến)
  confirmerFilter,
  setConfirmerFilter,
  showConfirmerFilter,
  setShowConfirmerFilter,
  confirmers = [],
  onConfirmerFilter,
  clearConfirmerFilter,
  showConfirmer = true, // Prop để kiểm tra có hiển thị filter hay không
  // Assignee Filter (Người được giao)
  assigneeFilter,
  setAssigneeFilter,
  showAssigneeFilter,
  setShowAssigneeFilter,
  assignees = [],
  onAssigneeFilter,
  clearAssigneeFilter,
  showAssignee = true, // Prop để kiểm tra có hiển thị filter hay không
  // Date Range Filter
  dateRangeFilter,
  setDateRangeFilter,
  showDateRangeFilter,
  setShowDateRangeFilter,
  onDateRangeFilter,
  applyDateRangeFilter,
  clearDateRangeFilter,
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
  onRefresh = null,
  showRefreshButton = true
}) {
  const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);
  // Search states for filter dropdowns
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState("");
  const [approverSearchTerm, setApproverSearchTerm] = useState("");
  const [creatorSearchTerm, setCreatorSearchTerm] = useState("");
  const [confirmerSearchTerm, setConfirmerSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  const handleToggle = () => {
    setShowSearchFilter(!showSearchFilter);
  };

  // Filter functions based on search term
  const filteredStatusOptions = statusOptions.filter(option =>
    option.label?.toLowerCase().includes(statusSearchTerm.toLowerCase())
  );
  const filteredAssignees = assignees.filter(assignee =>
    assignee.fullName?.toLowerCase().includes(assigneeSearchTerm.toLowerCase())
  );
  const filteredApprovers = approvers.filter(approver =>
    approver.fullName?.toLowerCase().includes(approverSearchTerm.toLowerCase())
  );
  const filteredCreators = creators.filter(creator =>
    creator.fullName?.toLowerCase().includes(creatorSearchTerm.toLowerCase())
  );
  const filteredConfirmers = confirmers.filter(confirmer =>
    confirmer.fullName?.toLowerCase().includes(confirmerSearchTerm.toLowerCase())
  );
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.companyName?.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );

  const handleClearAll = () => {
    // Đóng tất cả dropdown filters
    setShowStatusFilter(false);
    setShowSupplierFilter(false);
    setShowApproverFilter(false);
    setShowCreatorFilter(false);
    setShowConfirmerFilter(false);
    setShowAssigneeFilter(false);
    setShowDateRangeFilter(false);
    // Reset all search terms
    setStatusSearchTerm("");
    setSupplierSearchTerm("");
    setApproverSearchTerm("");
    setCreatorSearchTerm("");
    setConfirmerSearchTerm("");
    setAssigneeSearchTerm("");

    if (onClearAll) {
      onClearAll();
    } else {
      // Default clear behavior
      setSearchQuery("");
      if (clearStatusFilter) {
        clearStatusFilter();
      }
      if (clearSupplierFilter) {
        clearSupplierFilter();
      }
      if (clearApproverFilter) {
        clearApproverFilter();
      }
      if (clearCreatorFilter) {
        clearCreatorFilter();
      }
      if (clearConfirmerFilter) {
        clearConfirmerFilter();
      }
      if (clearAssigneeFilter) {
        clearAssigneeFilter();
      }
      if (clearDateRangeFilter) {
        clearDateRangeFilter();
      }
    }
  };

  const hasActiveFilters = searchQuery || statusFilter || supplierFilter || approverFilter || creatorFilter || confirmerFilter || assigneeFilter || dateRangeFilter?.fromDate || dateRangeFilter?.toDate;

  // Helper function to close all dropdowns except the one specified
  const closeAllDropdownsExcept = (except = null) => {
    if (except !== 'status') setShowStatusFilter(false);
    if (except !== 'supplier') setShowSupplierFilter(false);
    if (except !== 'approver') setShowApproverFilter(false);
    if (except !== 'creator') setShowCreatorFilter(false);
    if (except !== 'confirmer') setShowConfirmerFilter(false);
    if (except !== 'assignee') setShowAssigneeFilter(false);
    if (except !== 'dateRange') setShowDateRangeFilter(false);
    if (except !== 'pageSize') setShowPageSizeFilter(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const target = e.target;
      // If click is inside any dropdown container, do nothing
      const isInsideAnyDropdown = target.closest?.(
        '.status-filter-dropdown, .supplier-filter-dropdown, .approver-filter-dropdown, .creator-filter-dropdown, .confirmer-filter-dropdown, .assignee-filter-dropdown, .date-range-filter-dropdown, .page-size-filter-dropdown'
      );
      if (isInsideAnyDropdown) return;

      // Otherwise close all dropdowns
      closeAllDropdownsExcept();
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

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

            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              {showRefreshButton && (
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
                <div className="relative page-size-filter-dropdown">
                  {/* <button
                    onClick={() => {
                      closeAllDropdownsExcept('pageSize');
                      setShowPageSizeFilter(!showPageSizeFilter);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors bg-white text-slate-700"
                  >
                    <span className="text-sm font-medium">
                      {pageSize} / trang
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button> */}

                  {/* {showPageSizeFilter && (
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
                  )} */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      {showSearchFilter && (
        <div className="bg-gray-50 border-b border-slate-200 px-8 py-4 relative overflow-visible">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 w-full lg:w-11/12">
              <div className="space-y-3">
                {/* First Row - Search and 2 Main Filters */}
                <div className="flex flex-wrap gap-2 sm:gap-3 relative overflow-visible">
                  {/* Search Bar */}
                  <div className={`relative flex-shrink-0 ${searchWidth}`}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-[38px] text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative status-filter-dropdown flex-1 min-w-[140px]">
                    <button
                      onClick={() => {
                        closeAllDropdownsExcept('status');
                        setShowStatusFilter(!showStatusFilter);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
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
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm..."
                              value={statusSearchTerm}
                              onChange={(e) => setStatusSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {/* Dropdown List */}
                        <div className="py-1 overflow-y-auto dropdown-scroll max-h-48">
                          {filteredStatusOptions.length > 0 ? filteredStatusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                onStatusFilter(option.value);
                                setShowStatusFilter(false);
                                setStatusSearchTerm("");
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              {option.label}
                              {statusFilter === option.value && <span className="text-[#d97706]">✓</span>}
                            </button>
                          )) : (
                            <div className="px-4 py-2 text-sm text-slate-500">
                              {statusOptions.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Supplier Filter */}
                  {showSupplier && suppliers.length > 0 && (
                    <div className="relative supplier-filter-dropdown flex-1 min-w-[160px]">
                      <button
                        onClick={() => {
                          closeAllDropdownsExcept('supplier');
                          setShowSupplierFilter(!showSupplierFilter);
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                          focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                          ${supplierFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {supplierFilter ? suppliers.find(s => s.supplierId.toString() === supplierFilter)?.companyName || "Chọn nhà cung cấp" : "Tất cả nhà cung cấp"}
                        </span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </button>

                      {showSupplierFilter && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                          {/* Search Input */}
                          <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={supplierSearchTerm}
                                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          {/* Dropdown List */}
                          <div className="py-1 overflow-y-auto dropdown-scroll max-h-48">
                            <button
                              onClick={() => {
                                clearSupplierFilter();
                                setShowSupplierFilter(false);
                                setSupplierSearchTerm("");
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                            >
                              Tất cả nhà cung cấp
                            </button>
                            {filteredSuppliers.length > 0 ? filteredSuppliers.map((supplier) => (
                              <button
                                key={supplier.supplierId}
                                onClick={() => {
                                  onSupplierFilter(supplier.supplierId.toString());
                                  setShowSupplierFilter(false);
                                  setSupplierSearchTerm("");
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${supplierFilter === supplier.supplierId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                              >
                                {supplier.companyName}
                              </button>
                            )) : (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                {suppliers.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Second Row - Additional Filters */}
                <div className="flex flex-wrap gap-2 sm:gap-3 relative overflow-visible">
                  {/* Approver Filter */}
                  {showApprover && approvers.length > 0 && (
                    <div className="relative approver-filter-dropdown flex-1 min-w-[150px]">
                      <button
                        onClick={() => {
                          closeAllDropdownsExcept('approver');
                          setShowApproverFilter(!showApproverFilter);
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                          focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                          ${approverFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Shield className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {approverFilter ? approvers.find(a => a.userId.toString() === approverFilter)?.fullName || "Chọn người duyệt đơn" : "Tất cả người duyệt đơn"}
                        </span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </button>

                      {showApproverFilter && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                          {/* Search Input */}
                          <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={approverSearchTerm}
                                onChange={(e) => setApproverSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          {/* Dropdown List */}
                          <div className="py-1 overflow-y-auto dropdown-scroll max-h-48">
                            <button
                              onClick={() => {
                                clearApproverFilter();
                                setShowApproverFilter(false);
                                setApproverSearchTerm("");
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                            >
                              Tất cả người duyệt đơn
                            </button>
                            {filteredApprovers.length > 0 ? filteredApprovers.map((approver) => (
                              <button
                                key={approver.userId}
                                onClick={() => {
                                  onApproverFilter(approver.userId.toString());
                                  setShowApproverFilter(false);
                                  setApproverSearchTerm("");
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${approverFilter === approver.userId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                              >
                                {approver.fullName}
                              </button>
                            )) : (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                {approvers.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Creator Filter */}
                  {showCreator && creators.length > 0 && (
                    <div className="relative creator-filter-dropdown flex-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          closeAllDropdownsExcept('creator');
                          setShowCreatorFilter(!showCreatorFilter);
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                          focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                          ${creatorFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {creatorFilter ? creators.find(c => c.userId.toString() === creatorFilter)?.fullName || "Chọn người tạo đơn" : "Tất cả người tạo đơn"}
                        </span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </button>

                      {showCreatorFilter && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                          {/* Search Input */}
                          <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={creatorSearchTerm}
                                onChange={(e) => setCreatorSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          {/* Dropdown List */}
                          <div className="py-1 overflow-y-auto dropdown-scroll max-h-48">
                            <button
                              onClick={() => {
                                clearCreatorFilter();
                                setShowCreatorFilter(false);
                                setCreatorSearchTerm("");
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                            >
                              Tất cả người tạo đơn
                            </button>
                            {filteredCreators.length > 0 ? filteredCreators.map((creator) => (
                              <button
                                key={creator.userId}
                                onClick={() => {
                                  onCreatorFilter(creator.userId.toString());
                                  setShowCreatorFilter(false);
                                  setCreatorSearchTerm("");
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${creatorFilter === creator.userId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                              >
                                {creator.fullName}
                              </button>
                            )) : (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                {creators.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirmer Filter */}
                  {showConfirmer && confirmers.length > 0 && (
                    <div className="relative confirmer-filter-dropdown flex-1 min-w-[160px]">
                      <button
                        onClick={() => {
                          closeAllDropdownsExcept('confirmer');
                          setShowConfirmerFilter(!showConfirmerFilter);
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                          focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                          ${confirmerFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {confirmerFilter ? confirmers.find(c => c.userId.toString() === confirmerFilter)?.fullName || "Chọn người xác nhận đơn" : "Tất cả người xác nhận đơn"}
                        </span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </button>

                      {showConfirmerFilter && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                          {/* Search Input */}
                          <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={confirmerSearchTerm}
                                onChange={(e) => setConfirmerSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          {/* Dropdown List */}
                          <div className="py-1 overflow-y-auto dropdown-scroll max-h-48">
                            <button
                              onClick={() => {
                                clearConfirmerFilter();
                                setShowConfirmerFilter(false);
                                setConfirmerSearchTerm("");
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                            >
                              Tất cả người xác nhận đơn
                            </button>
                            {filteredConfirmers.length > 0 ? filteredConfirmers.map((confirmer) => (
                              <button
                                key={confirmer.userId}
                                onClick={() => {
                                  onConfirmerFilter(confirmer.userId.toString());
                                  setShowConfirmerFilter(false);
                                  setConfirmerSearchTerm("");
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${confirmerFilter === confirmer.userId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                              >
                                {confirmer.fullName}
                              </button>
                            )) : (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                {confirmers.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assignee Filter */}
                  {showAssignee && (
                    <div className="relative assignee-filter-dropdown flex-1 min-w-[170px]">
                      <button
                        onClick={() => {
                          closeAllDropdownsExcept('assignee');
                          setShowAssigneeFilter(!showAssigneeFilter);
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                          focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                          ${assigneeFilter ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {assigneeFilter ? assignees.find(a => a.userId.toString() === assigneeFilter)?.fullName || "Chọn người được giao" : "Tất cả người được giao"}
                        </span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </button>

                      {showAssigneeFilter && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                          {/* Search Input */}
                          <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={assigneeSearchTerm}
                                onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          {/* Dropdown List */}
                          <div className="py-1 overflow-y-auto dropdown-scroll max-h-48">
                            <button
                              onClick={() => {
                                clearAssigneeFilter();
                                setShowAssigneeFilter(false);
                                setAssigneeSearchTerm("");
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                            >
                              Tất cả người được giao đơn
                            </button>
                            {filteredAssignees.length > 0 ? filteredAssignees.map((assignee) => (
                              <button
                                key={assignee.userId}
                                onClick={() => {
                                  onAssigneeFilter(assignee.userId.toString());
                                  setShowAssigneeFilter(false);
                                  setAssigneeSearchTerm("");
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${assigneeFilter === assignee.userId.toString() ? 'bg-orange-500 text-white' : 'text-slate-700'}`}
                              >
                                {assignee.fullName}
                              </button>
                            )) : (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                {assignees.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date Range Filter */}
                  <div className="relative date-range-filter-dropdown flex-1 min-w-[140px]">
                    <button
                      onClick={() => {
                        closeAllDropdownsExcept('dateRange');
                        setShowDateRangeFilter(!showDateRangeFilter);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                      focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                      ${dateRangeFilter ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {dateRangeFilter && dateRangeFilter.fromDate && dateRangeFilter.toDate
                          ? `${dateRangeFilter.fromDate} - ${dateRangeFilter.toDate}`
                          : "Khoảng thời gian"}
                      </span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </button>

                    {showDateRangeFilter && (
                      <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-md shadow-lg border z-50 p-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
                            <input
                              type="date"
                              value={dateRangeFilter?.fromDate || ''}
                              onChange={(e) => onDateRangeFilter({ ...dateRangeFilter, fromDate: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Đến ngày</label>
                            <input
                              type="date"
                              value={dateRangeFilter?.toDate || ''}
                              onChange={(e) => onDateRangeFilter({ ...dateRangeFilter, toDate: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                if (clearDateRangeFilter) {
                                  clearDateRangeFilter();
                                }
                                setShowDateRangeFilter(false);
                              }}
                              className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                            >
                              Xóa
                            </button>
                            <button
                              onClick={() => {
                                if (applyDateRangeFilter) {
                                  applyDateRangeFilter();
                                }
                                setShowDateRangeFilter(false);
                              }}
                              className="flex-1 px-3 py-2 text-sm bg-[#d97706] text-white rounded-lg hover:bg-[#b8650f]"
                            >
                              Áp dụng
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {showClearButton && (
              <div className="w-full lg:w-1/12 flex justify-end">
                <ClearFiltersButton
                  onClear={handleClearAll}
                  hasActiveFilters={hasActiveFilters}
                  buttonText="Bỏ lọc"
                  variant="outline"
                  size="sm"
                  showIcon={true}
                  className="h-[38px] ml-auto"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
