import React, { useState, useEffect, useMemo } from "react";
import {
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Settings,
    RefreshCw,
    CheckCircle,
    Users,
    Clock,
    ClipboardList,
} from "lucide-react";
import { Input } from "../ui/input";
import ClearFiltersButton from "../Common/ClearFiltersButton";

/**
 * Mapping filters -> role visibility derived from the backend payloads:
 * - Warehouse Staff (GetDisposalRequestListWarehouseStaff) lacks approver info, so no approver/seller filters.
 * - Sale Manager (GetDisposalRequestListSaleManager) does not manage assignees.
 * - Warehouse Manager (GetDisposalRequestListWarehouseManager) can access every field.
 */
const ROLE_FILTER_RULES = {
    "Warehouse Staff": { approver: false, seller: false, assignee: true },
    "Sale Manager": { approver: true, seller: true, assignee: false },
    "Warehouse Manager": { approver: true, seller: true, assignee: true },
};

const DEFAULT_FILTER_ACCESS = { approver: true, seller: true, assignee: true };

const resolveFilterAccess = (userRoles = [], overrides) => {
    if (overrides) {
        return { ...DEFAULT_FILTER_ACCESS, ...overrides };
    }

    if (!userRoles.length) {
        return DEFAULT_FILTER_ACCESS;
    }

    const aggregated = userRoles.reduce(
        (acc, role) => {
            const rule = ROLE_FILTER_RULES[role];
            if (rule) {
                acc.approver = acc.approver || rule.approver;
                acc.seller = acc.seller || rule.seller;
                acc.assignee = acc.assignee || rule.assignee;
            }
            return acc;
        },
        { approver: false, seller: false, assignee: false }
    );

    if (!aggregated.approver && !aggregated.seller && !aggregated.assignee) {
        return DEFAULT_FILTER_ACCESS;
    }

    return aggregated;
};

export default function DisposalFilterToggle({
    // Search
    searchQuery,
    setSearchQuery,
    searchPlaceholder = "Tìm kiếm theo mã yêu cầu, người duyệt, người tạo...",

    // Status
    statusFilter,
    setStatusFilter,
    showStatusFilter,
    setShowStatusFilter,
    statusOptions = [],
    onStatusFilter,
    clearStatusFilter,

    // Approver
    approverFilter,
    setApproverFilter,
    showApproverFilter,
    setShowApproverFilter,
    approvers = [],
    onApproverFilter,
    clearApproverFilter,

    // Seller (creator)
    sellerFilter,
    setSellerFilter,
    showSellerFilter,
    setShowSellerFilter,
    sellers = [],
    onSellerFilter,
    clearSellerFilter,

    // Assignee
    assigneeFilter,
    setAssigneeFilter,
    showAssigneeFilter,
    setShowAssigneeFilter,
    assignees = [],
    onAssigneeFilter,
    clearAssigneeFilter,

    // Estimated date range
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
    onRefresh = null,
    showRefreshButton = true,

    // Pagination
    pageSize,
    showPageSizeFilter,
    setShowPageSizeFilter,
    pageSizeOptions = [10, 20, 30, 40],
    onPageSizeChange,
    showPageSizeButton = false,

    // Role-based config
    userRoles = [],
    filterAccessOverrides = null,
}) {
    const [showSearchFilter, setShowSearchFilter] = useState(defaultOpen);

    // Dropdown search states
    const [statusSearch, setStatusSearch] = useState("");
    const [approverSearch, setApproverSearch] = useState("");
    const [sellerSearch, setSellerSearch] = useState("");
    const [assigneeSearch, setAssigneeSearch] = useState("");

    const filterAccess = useMemo(
        () => resolveFilterAccess(userRoles, filterAccessOverrides),
        [userRoles, filterAccessOverrides]
    );

    const showApprover = filterAccess.approver && approvers.length > 0;
    const showSeller = filterAccess.seller && sellers.length > 0;
    const showAssignee = filterAccess.assignee && assignees.length > 0;

    const handleToggle = () => setShowSearchFilter((prev) => !prev);

    const filterOptions = (options, searchQuery, searchField = "label") => {
        if (!searchQuery.trim()) return options;
        const query = searchQuery.toLowerCase().trim();
        return options.filter((option) => {
            const fieldValue = (option[searchField] || "").toLowerCase();
            return fieldValue.includes(query);
        });
    };

    const closeAllDropdownsExcept = (dropdownToKeep) => {
        if (dropdownToKeep !== "status" && setShowStatusFilter) {
            setShowStatusFilter(false);
            setStatusSearch("");
        }

        if (dropdownToKeep !== "approver" && setShowApproverFilter) {
            setShowApproverFilter(false);
            setApproverSearch("");
        }

        if (dropdownToKeep !== "seller" && setShowSellerFilter) {
            setShowSellerFilter(false);
            setSellerSearch("");
        }

        if (dropdownToKeep !== "assignee" && setShowAssigneeFilter) {
            setShowAssigneeFilter(false);
            setAssigneeSearch("");
        }

        if (dropdownToKeep !== "estimatedDateRange" && setShowEstimatedDateRangeFilter) {
            setShowEstimatedDateRangeFilter(false);
        }

        if (dropdownToKeep !== "pageSize" && setShowPageSizeFilter) {
            setShowPageSizeFilter(false);
        }
    };

    const handleClearAll = () => {
        setShowStatusFilter(false);
        setShowApproverFilter(false);
        setShowSellerFilter(false);
        setShowAssigneeFilter(false);
        setShowEstimatedDateRangeFilter(false);
        setShowPageSizeFilter(false);

        setStatusSearch("");
        setApproverSearch("");
        setSellerSearch("");
        setAssigneeSearch("");

        if (onClearAll) {
            onClearAll();
            return;
        }

        setSearchQuery("");
        clearStatusFilter?.();
        clearApproverFilter?.();
        clearSellerFilter?.();
        clearAssigneeFilter?.();
        clearEstimatedDateRangeFilter?.();
    };

    const hasActiveFilters =
        searchQuery ||
        statusFilter ||
        approverFilter ||
        sellerFilter ||
        assigneeFilter ||
        estimatedDateRangeFilter?.fromEstimatedDate ||
        estimatedDateRangeFilter?.toEstimatedDate;

    useEffect(() => {
        const handleDocumentClick = (e) => {
            const target = e.target;
            const isInsideDropdown = target.closest?.(
                ".status-filter-dropdown, .approver-filter-dropdown, .seller-filter-dropdown, .assignee-filter-dropdown, .estimated-date-range-filter-dropdown, .page-size-filter-dropdown"
            );

            if (isInsideDropdown) return;

            setShowStatusFilter(false);
            setShowApproverFilter(false);
            setShowSellerFilter(false);
            setShowAssigneeFilter(false);
            setShowEstimatedDateRangeFilter(false);
            setShowPageSizeFilter(false);

            setStatusSearch("");
            setApproverSearch("");
            setSellerSearch("");
            setAssigneeSearch("");
        };

        document.addEventListener("mousedown", handleDocumentClick);
        return () => document.removeEventListener("mousedown", handleDocumentClick);
    }, [
        setShowStatusFilter,
        setShowApproverFilter,
        setShowSellerFilter,
        setShowAssigneeFilter,
        setShowEstimatedDateRangeFilter,
        setShowPageSizeFilter,
    ]);

    return (
        <>
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

            {showToggle && (
                <div className="bg-gray-50 border-b border-slate-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleToggle}
                            className="flex items-center space-x-2 text-slate-700 hover:text-orange-500 transition-colors"
                        >
                            <Settings className="h-4 w-4" />
                            <span className="font-medium text-sm">Tìm kiếm &amp; Lọc</span>
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
                                    {/* <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const wasOpen = showPageSizeFilter;
                                            closeAllDropdownsExcept("pageSize");
                                            setTimeout(() => {
                                                setShowPageSizeFilter(!wasOpen);
                                            }, 0);
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors bg-white text-slate-700"
                                    >
                                        <span className="text-sm font-medium">{pageSize} / trang</span>
                                        <ChevronDown className="h-4 w-4" />
                                    </button> */}

                                    {/* {showPageSizeFilter && (
                                        <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border z-50 max-h-48 overflow-y-auto dropdown-scroll">
                                            <div className="py-1">
                                                {pageSizeOptions.map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => {
                                                            onPageSizeChange(size);
                                                            setShowPageSizeFilter(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${pageSize === size ? "bg-orange-500 text-white" : "text-slate-700"
                                                            }`}
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

            {showSearchFilter && (
                <div className="bg-gray-50 border-b border-slate-200 px-8 py-4 relative overflow-visible">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 w-full lg:w-11/12">
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const wasOpen = showStatusFilter;
                                                closeAllDropdownsExcept("status");
                                                setTimeout(() => {
                                                    setShowStatusFilter(!wasOpen);
                                                }, 0);
                                            }}
                                            className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                            focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                            ${statusFilter ? "bg-[#d97706] text-white hover:bg-[#d97706]" : "bg-white text-slate-700 hover:bg-white"
                                                }`}
                                        >
                                            <Filter className="h-4 w-4 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">
                                                {statusOptions.find((option) => option.value === statusFilter)?.label || statusOptions[0]?.label || "Tất cả trạng thái"}
                                            </span>
                                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                        </button>

                                        {showStatusFilter && (
                                            <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-200">
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            placeholder="Tìm kiếm trạng thái..."
                                                            value={statusSearch}
                                                            onChange={(e) => setStatusSearch(e.target.value)}
                                                            className="pl-8 h-8 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto dropdown-scroll max-h-48">
                                                    <div className="py-1">
                                                        {filterOptions(statusOptions, statusSearch, "label").map((option) => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => {
                                                                    onStatusFilter(option.value);
                                                                    setShowStatusFilter(false);
                                                                    setStatusSearch("");
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                                            >
                                                                {option.label}
                                                                {statusFilter === option.value && <span className="text-[#d97706]">✓</span>}
                                                            </button>
                                                        ))}
                                                        {filterOptions(statusOptions, statusSearch, "label").length === 0 && (
                                                            <div className="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy kết quả</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Assignee Filter */}
                                    {showAssignee && (
                                        <div className="relative assignee-filter-dropdown flex-1 min-w-[160px]">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const wasOpen = showAssigneeFilter;
                                                    closeAllDropdownsExcept("assignee");
                                                    setTimeout(() => {
                                                        setShowAssigneeFilter(!wasOpen);
                                                    }, 0);
                                                }}
                                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                                focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                                ${assigneeFilter ? "bg-[#d97706] text-white hover:bg-[#d97706]" : "bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <Users className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {assigneeFilter
                                                        ? assignees.find((a) => a.userId.toString() === assigneeFilter)?.fullName || "Chọn người được giao"
                                                        : "Tất cả người được giao"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showAssigneeFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                                                    <div className="p-2 border-b border-gray-200">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Tìm kiếm người được giao..."
                                                                value={assigneeSearch}
                                                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                                                className="pl-8 h-8 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="overflow-y-auto dropdown-scroll max-h-48">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => {
                                                                    clearAssigneeFilter();
                                                                    setShowAssigneeFilter(false);
                                                                    setAssigneeSearch("");
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                            >
                                                                Tất cả người được giao
                                                            </button>
                                                            {filterOptions(assignees, assigneeSearch, "fullName").map((assignee) => (
                                                                <button
                                                                    key={assignee.userId}
                                                                    onClick={() => {
                                                                        onAssigneeFilter(assignee.userId.toString());
                                                                        setShowAssigneeFilter(false);
                                                                        setAssigneeSearch("");
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${assigneeFilter === assignee.userId.toString() ? "bg-orange-500 text-white" : "text-slate-700"
                                                                        }`}
                                                                >
                                                                    {assignee.fullName}
                                                                </button>
                                                            ))}
                                                            {filterOptions(assignees, assigneeSearch, "fullName").length === 0 && (
                                                                <div className="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy kết quả</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Second Row */}
                                <div className="flex flex-wrap gap-2 sm:gap-3 relative overflow-visible">
                                    {/* Approver Filter */}
                                    {showApprover && (
                                        <div className="relative approver-filter-dropdown flex-1 min-w-[150px]">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const wasOpen = showApproverFilter;
                                                    closeAllDropdownsExcept("approver");
                                                    setTimeout(() => {
                                                        setShowApproverFilter(!wasOpen);
                                                    }, 0);
                                                }}
                                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                                focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                                ${approverFilter ? "bg-[#d97706] text-white hover:bg-[#d97706]" : "bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {approverFilter
                                                        ? approvers.find((a) => a.userId.toString() === approverFilter)?.fullName || "Chọn người duyệt"
                                                        : "Tất cả người duyệt"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showApproverFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                                                    <div className="p-2 border-b border-gray-200">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Tìm kiếm người duyệt..."
                                                                value={approverSearch}
                                                                onChange={(e) => setApproverSearch(e.target.value)}
                                                                className="pl-8 h-8 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="overflow-y-auto dropdown-scroll max-h-48">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => {
                                                                    clearApproverFilter();
                                                                    setShowApproverFilter(false);
                                                                    setApproverSearch("");
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                            >
                                                                Tất cả người duyệt
                                                            </button>
                                                            {filterOptions(approvers, approverSearch, "fullName").map((approver) => (
                                                                <button
                                                                    key={approver.userId}
                                                                    onClick={() => {
                                                                        onApproverFilter(approver.userId.toString());
                                                                        setShowApproverFilter(false);
                                                                        setApproverSearch("");
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${approverFilter === approver.userId.toString() ? "bg-orange-500 text-white" : "text-slate-700"
                                                                        }`}
                                                                >
                                                                    {approver.fullName}
                                                                </button>
                                                            ))}
                                                            {filterOptions(approvers, approverSearch, "fullName").length === 0 && (
                                                                <div className="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy kết quả</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Seller Filter */}
                                    {showSeller && (
                                        <div className="relative seller-filter-dropdown flex-1 min-w-[150px]">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const wasOpen = showSellerFilter;
                                                    closeAllDropdownsExcept("seller");
                                                    setTimeout(() => {
                                                        setShowSellerFilter(!wasOpen);
                                                    }, 0);
                                                }}
                                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                                focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                                ${sellerFilter ? "bg-[#d97706] text-white hover:bg-[#d97706]" : "bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <ClipboardList className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {sellerFilter
                                                        ? sellers.find((s) => s.userId.toString() === sellerFilter)?.fullName || "Chọn người tạo"
                                                        : "Tất cả người tạo"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showSellerFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                                                    <div className="p-2 border-b border-gray-200">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Tìm kiếm người tạo..."
                                                                value={sellerSearch}
                                                                onChange={(e) => setSellerSearch(e.target.value)}
                                                                className="pl-8 h-8 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="overflow-y-auto dropdown-scroll max-h-48">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => {
                                                                    clearSellerFilter();
                                                                    setShowSellerFilter(false);
                                                                    setSellerSearch("");
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                            >
                                                                Tất cả người tạo
                                                            </button>
                                                            {filterOptions(sellers, sellerSearch, "fullName").map((seller) => (
                                                                <button
                                                                    key={seller.userId}
                                                                    onClick={() => {
                                                                        onSellerFilter(seller.userId.toString());
                                                                        setShowSellerFilter(false);
                                                                        setSellerSearch("");
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${sellerFilter === seller.userId.toString() ? "bg-orange-500 text-white" : "text-slate-700"
                                                                        }`}
                                                                >
                                                                    {seller.fullName}
                                                                </button>
                                                            ))}
                                                            {filterOptions(sellers, sellerSearch, "fullName").length === 0 && (
                                                                <div className="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy kết quả</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Estimated Date Range */}
                                    <div className="relative estimated-date-range-filter-dropdown flex-1 min-w-[160px]">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const wasOpen = showEstimatedDateRangeFilter;
                                                closeAllDropdownsExcept("estimatedDateRange");
                                                setTimeout(() => {
                                                    setShowEstimatedDateRangeFilter(!wasOpen);
                                                }, 0);
                                            }}
                                            className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                            focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]
                                            ${estimatedDateRangeFilter?.fromEstimatedDate || estimatedDateRangeFilter?.toEstimatedDate ? "bg-[#d97706] text-white hover:bg-[#d97706]" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                                        >
                                            <Clock className="h-4 w-4 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">
                                                {estimatedDateRangeFilter?.fromEstimatedDate && estimatedDateRangeFilter?.toEstimatedDate
                                                    ? `${estimatedDateRangeFilter.fromEstimatedDate} - ${estimatedDateRangeFilter.toEstimatedDate}`
                                                    : "Thời gian xuất hủy"}
                                            </span>
                                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                        </button>

                                        {showEstimatedDateRangeFilter && (
                                            <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-md shadow-lg border z-50 p-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
                                                        <input
                                                            type="date"
                                                            value={estimatedDateRangeFilter?.fromEstimatedDate || ""}
                                                            onChange={(e) => onEstimatedDateRangeFilter({ ...estimatedDateRangeFilter, fromEstimatedDate: e.target.value })}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">Đến ngày</label>
                                                        <input
                                                            type="date"
                                                            value={estimatedDateRangeFilter?.toEstimatedDate || ""}
                                                            onChange={(e) => onEstimatedDateRangeFilter({ ...estimatedDateRangeFilter, toEstimatedDate: e.target.value })}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                                                        />
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                clearEstimatedDateRangeFilter?.();
                                                                setShowEstimatedDateRangeFilter(false);
                                                            }}
                                                            className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                                                        >
                                                            Xóa
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                applyEstimatedDateRangeFilter?.();
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

                        {showClearButton && (
                            <div className="w-full lg:w-1/12 flex justify-end">
                                <ClearFiltersButton
                                    onClear={handleClearAll}
                                    hasActiveFilters={!!hasActiveFilters}
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