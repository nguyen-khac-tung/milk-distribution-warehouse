import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Settings,
    RefreshCw,
    User,
    CheckCircle,
    Users,
    Clock,
    ClipboardList,
} from "lucide-react";
import { Input } from "../ui/input";
import ClearFiltersButton from "../Common/ClearFiltersButton";

export default function SaleOrderFilterToggle({
    // Search
    searchQuery,
    setSearchQuery,
    searchPlaceholder = "Tìm kiếm theo mã đơn hàng, khách hàng...",

    // Status
    statusFilter,
    setStatusFilter,
    showStatusFilter,
    setShowStatusFilter,
    statusOptions = [
        { value: "", label: "Tất cả trạng thái đơn" },
        { value: "1", label: "Chờ xác nhận" },
        { value: "2", label: "Đang giao" },
        { value: "3", label: "Đã hoàn thành" },
        { value: "4", label: "Đã hủy" },
        { value: "5", label: "Trả hàng / Hoàn tiền" },
    ],
    onStatusFilter,
    clearStatusFilter,

    // Retailer
    retailerFilter,
    setRetailerFilter,
    showRetailerFilter,
    setShowRetailerFilter,
    retailers = [],
    onRetailerFilter,
    clearRetailerFilter,
    showRetailer = true,

    // Approver Filter (Người duyệt)
    approverFilter,
    setApproverFilter,
    showApproverFilter,
    setShowApproverFilter,
    approvers = [],
    onApproverFilter,
    clearApproverFilter,
    showApprover = true,

    // Seller (người tạo đơn)
    sellerFilter,
    setSellerFilter,
    showSellerFilter,
    setShowSellerFilter,
    sellers = [],
    onSellerFilter,
    clearSellerFilter,
    showSeller = true,

    // Confirmer (người xác nhận đơn bán)
    confirmerFilter,
    setConfirmerFilter,
    showConfirmerFilter,
    setShowConfirmerFilter,
    confirmers = [],
    onConfirmerFilter,
    clearConfirmerFilter,
    showConfirmer = true,

    // Assignee (người giao hàng)
    assigneeFilter,
    setAssigneeFilter,
    showAssigneeFilter,
    setShowAssigneeFilter,
    assignees = [],
    onAssigneeFilter,
    clearAssigneeFilter,
    showAssignee = true,

    // Estimated Date Range
    estimatedDateRangeFilter,
    setEstimatedDateRangeFilter,
    showEstimatedDateRangeFilter,
    setShowEstimatedDateRangeFilter,
    onEstimatedDateRangeFilter,
    applyEstimatedDateRangeFilter,
    clearEstimatedDateRangeFilter,

    // UI
    searchWidth = "w-[450px]",
    showToggle = true,
    defaultOpen = true,
    onClearAll = null,
    showClearButton = true,

    // Pagination
    pageSize,
    setPageSize,
    showPageSizeFilter,
    setShowPageSizeFilter,
    pageSizeOptions = [10, 20, 30, 40],
    onPageSizeChange,
    showPageSizeButton = false,
    onRefresh = null,
    showRefreshButton = true,
}) {
    const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);

    const handleToggle = () => setShowSearchFilter(!showSearchFilter);

    // Function to close all dropdowns except the one being opened
    const closeAllDropdownsExcept = (dropdownToKeep) => {
        if (dropdownToKeep !== 'status' && setShowStatusFilter) setShowStatusFilter(false);
        if (dropdownToKeep !== 'retailer' && setShowRetailerFilter) setShowRetailerFilter(false);
        if (dropdownToKeep !== 'approver' && setShowApproverFilter) setShowApproverFilter(false);
        if (dropdownToKeep !== 'seller' && setShowSellerFilter) setShowSellerFilter(false);
        if (dropdownToKeep !== 'confirmer' && setShowConfirmerFilter) setShowConfirmerFilter(false);
        if (dropdownToKeep !== 'assignee' && setShowAssigneeFilter) setShowAssigneeFilter(false);
        if (dropdownToKeep !== 'estimatedDateRange' && setShowEstimatedDateRangeFilter) setShowEstimatedDateRangeFilter(false);
        if (dropdownToKeep !== 'pageSize' && setShowPageSizeFilter) setShowPageSizeFilter(false);
    };

    const handleClearAll = () => {
        setShowStatusFilter(false);
        setShowRetailerFilter(false);
        setShowSellerFilter(false);
        setShowConfirmerFilter(false);
        setShowAssigneeFilter(false);
        setShowEstimatedDateRangeFilter(false);

        if (onClearAll) onClearAll();
        else {
            setSearchQuery("");
            clearStatusFilter?.();
            clearRetailerFilter?.();
            clearSellerFilter?.();
            clearConfirmerFilter?.();
            clearAssigneeFilter?.();
            clearEstimatedDateRangeFilter?.();
        }
    };

    const hasActiveFilters =
        searchQuery ||
        statusFilter ||
        retailerFilter ||
        approverFilter ||
        sellerFilter ||
        confirmerFilter ||
        assigneeFilter ||
        estimatedDateRangeFilter?.fromEstimatedDate ||
        estimatedDateRangeFilter?.toEstimatedDate;

    // Close dropdowns on outside click
    useEffect(() => {
        const handleDocumentClick = (e) => {
            const target = e.target;
            // If click is inside any dropdown container, do nothing
            const isInsideAnyDropdown = target.closest?.(
                '.status-filter-dropdown, .retailer-filter-dropdown, .approver-filter-dropdown, .seller-filter-dropdown, .confirmer-filter-dropdown, .assignee-filter-dropdown, .estimated-date-range-filter-dropdown, .page-size-filter-dropdown'
            );
            if (isInsideAnyDropdown) return;

            // Otherwise close all dropdowns
            if (setShowStatusFilter) setShowStatusFilter(false);
            if (setShowRetailerFilter) setShowRetailerFilter(false);
            if (setShowApproverFilter) setShowApproverFilter(false);
            if (setShowSellerFilter) setShowSellerFilter(false);
            if (setShowConfirmerFilter) setShowConfirmerFilter(false);
            if (setShowAssigneeFilter) setShowAssigneeFilter(false);
            if (setShowEstimatedDateRangeFilter) setShowEstimatedDateRangeFilter(false);
            if (setShowPageSizeFilter) setShowPageSizeFilter(false);
        };

        document.addEventListener('mousedown', handleDocumentClick);
        return () => document.removeEventListener('mousedown', handleDocumentClick);
    }, [
        setShowStatusFilter,
        setShowRetailerFilter,
        setShowApproverFilter,
        setShowSellerFilter,
        setShowConfirmerFilter,
        setShowAssigneeFilter,
        setShowEstimatedDateRangeFilter,
        setShowPageSizeFilter,
    ]);

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
            {/* Header toggle */}
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
                            {showRefreshButton && (
                                <button
                                    onClick={onRefresh}
                                    className="flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors bg-white text-slate-700"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="text-sm font-medium">Làm mới</span>
                                </button>
                            )}

                            {showPageSizeButton && (
                                <div className="relative page-size-filter-dropdown">
                                    <button
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
                                    </button>

                                    {showPageSizeFilter && (
                                        <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll">
                                            <div className="py-1">
                                                {pageSizeOptions.map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => {
                                                            onPageSizeChange(size);
                                                            setShowPageSizeFilter(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${pageSize === size
                                                            ? "bg-orange-500 text-white"
                                                            : "text-slate-700"
                                                            }`}
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
                <div className="bg-gray-50 border-b border-slate-200 px-8 py-4 relative overflow-visible">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 w-full lg:w-5/6">
                            <div className="space-y-3">
                                {/* First Row */}
                                <div className="flex flex-wrap gap-2 sm:gap-3 relative overflow-visible">
                                    {/* Search */}
                                    <div className={`relative flex-shrink-0 ${searchWidth}`}>
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder={searchPlaceholder}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 h-[38px] text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
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
                                                    ? "bg-[#d97706] text-white hover:bg-[#d97706]"
                                                    : "bg-white text-slate-700 hover:bg-white"
                                                }`}
                                        >
                                            <Filter className="h-4 w-4 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">
                                                {
                                                    statusOptions.find(
                                                        (option) => option.value === statusFilter
                                                    )?.label || statusOptions[0].label
                                                }
                                            </span>
                                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                        </button>

                                        {showStatusFilter && (
                                            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll">
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
                                                            {statusFilter === option.value && (
                                                                <span className="text-[#d97706]">✓</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Retailer Filter */}
                                    {showRetailer && retailers.length > 0 && (
                                        <div className="relative retailer-filter-dropdown flex-1 min-w-[160px]">
                                            <button
                                                onClick={() => {
                                                    closeAllDropdownsExcept('retailer');
                                                    setShowRetailerFilter(!showRetailerFilter);
                                                }}
                                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                                focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                                ${retailerFilter
                                                        ? "bg-[#d97706] text-white hover:bg-[#d97706]"
                                                        : "bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <User className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {retailerFilter
                                                        ? retailers.find(
                                                            (r) =>
                                                                r.retailerId.toString() === retailerFilter
                                                        )?.retailerName || "Chọn đại lý"
                                                        : "Tất cả đại lý"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showRetailerFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                clearRetailerFilter();
                                                                setShowRetailerFilter(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                        >
                                                            Tất cả đại lý
                                                        </button>
                                                        {retailers.map((retailer) => (
                                                            <button
                                                                key={retailer.retailerId}
                                                                onClick={() => {
                                                                    onRetailerFilter(
                                                                        retailer.retailerId.toString()
                                                                    );
                                                                    setShowRetailerFilter(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${retailerFilter ===
                                                                    retailer.retailerId.toString()
                                                                    ? "bg-orange-500 text-white"
                                                                    : "text-slate-700"
                                                                    }`}
                                                            >
                                                                {retailer.retailerName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Second Row */}
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
                                                ${approverFilter
                                                        ? "bg-[#d97706] text-white hover:bg-[#d97706]"
                                                        : "bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {approverFilter
                                                        ? approvers.find(
                                                            (a) => a.userId.toString() === approverFilter
                                                        )?.fullName || "Chọn người duyệt"
                                                        : "Tất cả người duyệt"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showApproverFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                clearApproverFilter();
                                                                setShowApproverFilter(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                        >
                                                            Tất cả người duyệt
                                                        </button>
                                                        {approvers.map((approver) => (
                                                            <button
                                                                key={approver.userId}
                                                                onClick={() => {
                                                                    onApproverFilter(approver.userId.toString());
                                                                    setShowApproverFilter(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${approverFilter === approver.userId.toString()
                                                                    ? "bg-orange-500 text-white"
                                                                    : "text-slate-700"
                                                                    }`}
                                                            >
                                                                {approver.fullName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Seller Filter */}
                                    {showSeller && sellers.length > 0 && (
                                        <div className="relative seller-filter-dropdown flex-1 min-w-[150px]">
                                            <button
                                                onClick={() => {
                                                    closeAllDropdownsExcept('seller');
                                                    setShowSellerFilter(!showSellerFilter);
                                                }}
                                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                                focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                                ${sellerFilter
                                                        ? "bg-[#d97706] text-white hover:bg-[#d97706]"
                                                        : "bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <ClipboardList className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {sellerFilter
                                                        ? sellers.find(
                                                            (s) => s.userId.toString() === sellerFilter
                                                        )?.fullName || "Chọn người tạo đơn"
                                                        : "Tất cả người tạo đơn"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showSellerFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                clearSellerFilter();
                                                                setShowSellerFilter(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                        >
                                                            Tất cả nhân viên bán hàng
                                                        </button>
                                                        {sellers.map((seller) => (
                                                            <button
                                                                key={seller.userId}
                                                                onClick={() => {
                                                                    onSellerFilter(seller.userId.toString());
                                                                    setShowSellerFilter(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${sellerFilter === seller.userId.toString()
                                                                    ? "bg-orange-500 text-white"
                                                                    : "text-slate-700"
                                                                    }`}
                                                            >
                                                                {seller.fullName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Confirmer Filter */}
                                    {showConfirmer && confirmers.length > 0 && (
                                        <div className="relative confirmer-filter-dropdown flex-1 min-w-[150px]">
                                            <button
                                                onClick={() => {
                                                    closeAllDropdownsExcept('confirmer');
                                                    setShowConfirmerFilter(!showConfirmerFilter);
                                                }}
                                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                                focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                                ${confirmerFilter
                                                        ? "bg-[#d97706] text-white hover:bg-[#d97706]"
                                                        : "bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {confirmerFilter
                                                        ? confirmers.find(
                                                            (c) => c.userId.toString() === confirmerFilter
                                                        )?.fullName || "Chọn người xác nhận"
                                                        : "Tất cả người xác nhận"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showConfirmerFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                clearConfirmerFilter();
                                                                setShowConfirmerFilter(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                        >
                                                            Tất cả người xác nhận
                                                        </button>
                                                        {confirmers.map((confirmer) => (
                                                            <button
                                                                key={confirmer.userId}
                                                                onClick={() => {
                                                                    onConfirmerFilter(
                                                                        confirmer.userId.toString()
                                                                    );
                                                                    setShowConfirmerFilter(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${confirmerFilter ===
                                                                    confirmer.userId.toString()
                                                                    ? "bg-orange-500 text-white"
                                                                    : "text-slate-700"
                                                                    }`}
                                                            >
                                                                {confirmer.fullName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Assignee Filter */}
                                    {showAssignee && assignees.length > 0 && (
                                        <div className="relative assignee-filter-dropdown flex-1 min-w-[160px]">
                                            <button
                                                onClick={() => {
                                                    closeAllDropdownsExcept('assignee');
                                                    setShowAssigneeFilter(!showAssigneeFilter);
                                                }}
                                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                                focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                                ${assigneeFilter
                                                        ? "bg-[#d97706] text-white hover:bg-[#d97706]"
                                                        : "bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <Users className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {assigneeFilter
                                                        ? assignees.find(
                                                            (a) => a.userId.toString() === assigneeFilter
                                                        )?.fullName || "Chọn người giao hàng"
                                                        : "Tất cả người giao hàng"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showAssigneeFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                clearAssigneeFilter();
                                                                setShowAssigneeFilter(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                        >
                                                            Tất cả người giao hàng
                                                        </button>
                                                        {assignees.map((assignee) => (
                                                            <button
                                                                key={assignee.userId}
                                                                onClick={() => {
                                                                    onAssigneeFilter(assignee.userId.toString());
                                                                    setShowAssigneeFilter(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${assigneeFilter ===
                                                                    assignee.userId.toString()
                                                                    ? "bg-orange-500 text-white"
                                                                    : "text-slate-700"
                                                                    }`}
                                                            >
                                                                {assignee.fullName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Estimated Date Range Filter */}
                                    <div className="relative estimated-date-range-filter-dropdown flex-1 min-w-[160px]">
                                        <button
                                            onClick={() => {
                                                closeAllDropdownsExcept('estimatedDateRange');
                                                setShowEstimatedDateRangeFilter(!showEstimatedDateRangeFilter);
                                            }}
                                            className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                            focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                            ${estimatedDateRangeFilter?.fromEstimatedDate || estimatedDateRangeFilter?.toEstimatedDate ? 'bg-[#d97706] text-white hover:bg-[#d97706]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <Clock className="h-4 w-4 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">
                                                {estimatedDateRangeFilter && estimatedDateRangeFilter.fromEstimatedDate && estimatedDateRangeFilter.toEstimatedDate
                                                    ? `${estimatedDateRangeFilter.fromEstimatedDate} - ${estimatedDateRangeFilter.toEstimatedDate}`
                                                    : "Thời gian xuất kho"}
                                            </span>
                                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                        </button>

                                        {showEstimatedDateRangeFilter && (
                                            <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-md shadow-lg border z-50 p-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày xuất kho</label>
                                                        <input
                                                            type="date"
                                                            value={estimatedDateRangeFilter?.fromEstimatedDate || ''}
                                                            onChange={(e) => onEstimatedDateRangeFilter({ ...estimatedDateRangeFilter, fromEstimatedDate: e.target.value })}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">Đến ngày xuất kho</label>
                                                        <input
                                                            type="date"
                                                            value={estimatedDateRangeFilter?.toEstimatedDate || ''}
                                                            onChange={(e) => onEstimatedDateRangeFilter({ ...estimatedDateRangeFilter, toEstimatedDate: e.target.value })}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                                        />
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                if (clearEstimatedDateRangeFilter) {
                                                                    clearEstimatedDateRangeFilter();
                                                                }
                                                                setShowEstimatedDateRangeFilter(false);
                                                            }}
                                                            className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                                                        >
                                                            Xóa
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (applyEstimatedDateRangeFilter) {
                                                                    applyEstimatedDateRangeFilter();
                                                                }
                                                                setShowEstimatedDateRangeFilter(false);
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
                            <div className="w-full lg:w-1/6 flex justify-end">
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
