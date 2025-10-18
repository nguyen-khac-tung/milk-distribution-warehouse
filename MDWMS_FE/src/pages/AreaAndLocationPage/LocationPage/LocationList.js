import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "../../../components/ui/button";
import { getLocations, deleteLocation, updateLocationStatus } from "../../../services/LocationServices";
import { Edit, Trash2, ChevronDown, Plus, Eye, ArrowUpDown, ArrowDown, ArrowUp, Printer, Folder } from "lucide-react";
import DeleteModal from "../../../components/Common/DeleteModal";
import SearchFilterToggle from "../../../components/Common/SearchFilterToggle";
import StatsCards from "../../../components/Common/StatsCards";
import Loading from "../../../components/Common/Loading";
import CreateLocationModal from "./CreateLocationModal";
import UpdateLocationModal from "./UpdateLocationModal";
import { Card, CardContent } from "../../../components/ui/card";
import Pagination from "../../../components/Common/Pagination";
import { Table as CustomTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { extractErrorMessage } from "../../../utils/Validation";
import { StatusToggle } from "../../../components/Common/SwitchToggle/StatusToggle";
import BulkCreateLocationModal from "../LocationPage/BulkCreateLocation";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import EmptyState from "../../../components/Common/EmptyState";
import { getAreaDropdown } from "../../../services/AreaServices";
import PermissionWrapper from "../../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../../utils/permissions";

const LocationList = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [globalStats, setGlobalStats] = useState({ total: 0, available: 0, unavailable: 0 });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [updateLocationId, setUpdateLocationId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [statusTypeFilter, setStatusTypeFilter] = useState("");
    const [showStatusTypeFilter, setShowStatusTypeFilter] = useState(false);
    const [showConditionFilter, setShowConditionFilter] = useState(false);
    const [conditionFilter, setConditionFilter] = useState("");
    const [areaFilter, setAreaFilter] = useState("");
    const [showAreaFilter, setShowAreaFilter] = useState(false);
    const [areas, setAreas] = useState([]);
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);
    const printRef = useRef();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const didMountRef = useRef(false);
    const skipFirstSearchRef = useRef(true);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Phiếu dán vị trí kho",
        pageStyle: `@page { size: auto; margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`,
    });

    const fetchLocations = async (page = 1, pageSize = 10, params = {}) => {
        try {
            setLoading(true);
            console.log("Fetching with params:", {
                pageNumber: page,
                pageSize,
                search: params.search,
                isAvailable: params.filters?.isAvailable,
                areaId: params.filters?.areaId,
                status: params.filters?.status,
                sortField: params.sortField ?? sortField,
                sortAscending: typeof (params.sortAscending ?? sortAscending) === 'boolean' ? (params.sortAscending ?? sortAscending) : undefined,
            });
            const res = await getLocations({
                pageNumber: page,
                pageSize,
                search: params.search,
                isAvailable: params.filters?.isAvailable,
                areaId: params.filters?.areaId,
                status: params.filters?.status,
                // Sorting params (align with AreasList)
                sortField: params.sortField ?? sortField ?? "",
                sortAscending: typeof (params.sortAscending ?? sortAscending) === 'boolean' ? (params.sortAscending ?? sortAscending) : undefined,
                // Fallback if API expects sortOrder string
                sortOrder: typeof (params.sortAscending ?? sortAscending) === 'boolean'
                    ? ((params.sortAscending ?? sortAscending) ? 'asc' : 'desc')
                    : (params.sortOrder || "")
            });

            const payload = res ?? {};
            const items = Array.isArray(payload.items)
                ? payload.items
                : Array.isArray(payload.data?.items)
                    ? payload.data.items
                    : Array.isArray(payload.data)
                        ? payload.data
                        : [];
            const total = (payload.totalCount ?? payload.data?.totalCount) || 0;

            setLocations(items);
            setPagination({ current: page, pageSize, total });
        } catch (err) {
            console.log("Không thể tải danh sách vị trí!", err);
            window.showToast("Không thể tải danh sách vị trí!", "error");
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await getLocations({ pageNumber: 1, pageSize: 1 });
            const payload = res ?? {};
            const total = (payload.totalCount ?? payload.data?.totalCount) || 0;

            let available = 0;
            let unavailable = 0;

            // If total is reasonable (<=1000) fetch all and compute counts client-side.
            if (total <= 1000 && total > 0) {
                const allRes = await getLocations({ pageNumber: 1, pageSize: total });
                const items = Array.isArray(allRes.items)
                    ? allRes.items
                    : Array.isArray(allRes.data?.items)
                        ? allRes.data.items
                        : Array.isArray(allRes.data)
                            ? allRes.data
                            : [];
                available = items.filter((l) => l.isAvailable === true).length;
                unavailable = items.filter((l) => l.isAvailable === false).length;
            } else {
                // Fallback: request counts via filtered calls which return totalCount for each filter
                const availRes = await getLocations({ pageNumber: 1, pageSize: 1, isAvailable: true });
                const availTotal = (availRes.totalCount ?? availRes.data?.totalCount) || 0;
                const unavailRes = await getLocations({ pageNumber: 1, pageSize: 1, isAvailable: false });
                const unavailTotal = (unavailRes.totalCount ?? unavailRes.data?.totalCount) || 0;
                available = availTotal;
                unavailable = unavailTotal;
            }

            setGlobalStats({ total, available, unavailable });
        } catch (err) {
            console.error("Error fetching global stats:", err);
        }
    };

    useEffect(() => {
        if (didMountRef.current) return; // Guard against React 18 StrictMode double-invoke in dev
        didMountRef.current = true;
        fetchLocations(1, 10);
        // Also fetch global stats once on mount
        fetchStats();
        // Load areas for dropdown
        (async () => {
            try {
                const res = await getAreaDropdown();
                const list = res?.data ?? res ?? [];
                setAreas(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error("Failed to load areas dropdown", e);
            }
        })();
    }, []);

    // Close filters when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusFilter && !event.target.closest('.status-filter-dropdown')) {
                setShowStatusFilter(false);
            }
            if (showStatusTypeFilter && !event.target.closest('.status-type-filter-dropdown')) {
                setShowStatusTypeFilter(false);
            }
            if (showAreaFilter && !event.target.closest('.area-filter-dropdown')) {
                setShowAreaFilter(false);
            }
            if (showPageSizeFilter && !event.target.closest('.page-size-filter-dropdown')) {
                setShowPageSizeFilter(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showStatusFilter, showStatusTypeFilter, showAreaFilter, showPageSizeFilter]);

    // Callback khi filter thay đổi
    const handleFilterChange = useCallback((params) => {
        setSearchLoading(true);
        setPagination((p) => ({ ...p, current: 1 }));
        fetchLocations(1, pagination.pageSize, params);
    }, [pagination.pageSize]);

    // Debounced search effect: only searchQuery; skip first run on mount to avoid duplicate with initial fetch
    useEffect(() => {
        if (skipFirstSearchRef.current) {
            skipFirstSearchRef.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            handleFilterChange({
                search: searchQuery,
                filters: {
                    isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                    status: statusFilter !== "" ? Number(statusFilter) : undefined,
                    areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
                }
            });
        }, 500);

        return () => clearTimeout(timeoutId);
        // Only depend on searchQuery to avoid triggering twice when clicking filters
    }, [searchQuery]);

    const handleStatusFilter = (value) => {
        setStatusFilter(value);

        handleFilterChange({
            search: searchQuery,
            filters: {
                // Nếu value rỗng → bỏ qua filter
                status: value !== "" ? Number(value) : undefined,
                isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
            },
        });
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        handleFilterChange({
            search: searchQuery,
            filters: {
                status: undefined,
                isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
            },
        });
    };

    const handleConditionFilter = (value) => {
        setConditionFilter(value);

        handleFilterChange({
            search: searchQuery,
            filters: {
                status: statusFilter !== "" ? Number(statusFilter) : undefined,
                isAvailable: value !== "" ? value === "true" : undefined,
                areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
            },
        });
    };

    const clearConditionFilter = () => {
        setConditionFilter("");
        handleFilterChange({
            search: searchQuery,
            filters: {
                status: statusFilter !== "" ? Number(statusFilter) : undefined,
                isAvailable: undefined,
                areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
            },
        });
    };

    const handleAreaFilter = (value) => {
        setAreaFilter(value);
        handleFilterChange({
            search: searchQuery,
            filters: {
                status: statusFilter !== "" ? Number(statusFilter) : undefined,
                isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                areaId: value !== "" ? Number(value) : undefined,
            },
        });
    };

    const clearAreaFilter = () => {
        setAreaFilter("");
        handleFilterChange({
            search: searchQuery,
            filters: {
                status: statusFilter !== "" ? Number(statusFilter) : undefined,
                isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                areaId: undefined,
            },
        });
        setShowAreaFilter(false);
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current: newPage }));
        fetchLocations(newPage, pagination.pageSize, {
            search: searchQuery,
            filters: {
                isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                status: statusFilter !== "" ? Number(statusFilter) : undefined,
                areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
            }
        });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
        fetchLocations(1, newPageSize, {
            search: searchQuery,
            filters: {
                isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                status: statusFilter !== "" ? Number(statusFilter) : undefined,
                areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
            }
        });
    };

    const handleSort = (field) => {
        if (sortField === field) {
            if (sortAscending === true) {
                // Second click: descending
                setSortAscending(false);
                fetchLocations(pagination.current, pagination.pageSize, {
                    search: searchQuery,
                    filters: {
                        isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                        status: statusFilter !== "" ? Number(statusFilter) : undefined,
                        areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
                    },
                    sortField: field,
                    sortAscending: false,
                });
            } else {
                // Third click: clear sorting
                setSortField("");
                setSortAscending(true);
                fetchLocations(pagination.current, pagination.pageSize, {
                    search: searchQuery,
                    filters: {
                        isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                        status: statusFilter !== "" ? Number(statusFilter) : undefined,
                        areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
                    },
                    sortField: "",
                    sortAscending: undefined,
                });
            }
        } else {
            // First click on a different column: ascending
            setSortField(field);
            setSortAscending(true);
            fetchLocations(pagination.current, pagination.pageSize, {
                search: searchQuery,
                filters: {
                    isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                    status: statusFilter !== "" ? Number(statusFilter) : undefined,
                    areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
                },
                sortField: field,
                sortAscending: true,
            });
        }
    };

    // Open modal for create
    const handleOpenCreate = () => {
        setShowCreateModal(true);
    };

    // Open modal for update
    const handleOpenEdit = (record) => {
        console.log("Editing record:", record);
        setEditingLocation(record);
        setUpdateLocationId(record.locationId);
        setShowUpdateModal(true);
    };

    // Handle create success
    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchLocations(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                status: statusFilter !== "" ? Number(statusFilter) : undefined,
                areaId: areaFilter !== "" ? Number(areaFilter) : undefined,
            }
        });
        fetchStats(); // Cập nhật tổng stats
    };

    const handleClearAllFilters = () => {
        setSearchQuery("")
        setStatusFilter("")
        setShowStatusFilter(false)
        setConditionFilter("")
        setShowConditionFilter(false)
        setAreaFilter("")
        setShowAreaFilter(false)
    }

    const clearAllFilters = handleClearAllFilters

    // Handle update success
    const handleUpdateSuccess = () => {
        setShowUpdateModal(false);
        setEditingLocation(null);
        setUpdateLocationId(null);
        fetchLocations(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                status: statusFilter !== "" ? Number(statusFilter) : undefined
            }
        });
        fetchStats(); // Cập nhật tổng stats
    };

    // Handle update cancel
    const handleUpdateCancel = () => {
        setShowUpdateModal(false);
        setEditingLocation(null);
        setUpdateLocationId(null);
    };

    const handleStatusChange = async (locationId, newStatus) => {
        try {
            await updateLocationStatus(locationId, newStatus)

            // Update local state
            setLocations(prevLocation =>
                prevLocation.map(location =>
                    location.locationId === locationId
                        ? { ...location, status: newStatus }
                        : location
                )
            )

            const statusText = newStatus === 1 ? "kích hoạt" : "ngừng hoạt động"
            window.showToast(`Đã ${statusText} nhà cung cấp thành công`, "success")
        } catch (error) {
            console.error("Error updating area status:", error)

            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật trạng thái")
            window.showToast(errorMessage, "error")
        }
    }

    //Delete location
    const handleDeleteConfirm = async () => {
        try {
            await deleteLocation(itemToDelete?.locationId);
            window.showToast(`Đã xóa vị trí: ${itemToDelete?.locationCode || ""}`, "success");
            setShowDeleteModal(false);
            setItemToDelete(null);
            fetchLocations(pagination.current, pagination.pageSize, {
                search: searchQuery,
                filters: {
                    isAvailable: conditionFilter !== "" ? conditionFilter === "true" : undefined,
                    status: statusFilter !== "" ? Number(statusFilter) : undefined
                }
            });
            // refresh global stats
            fetchStats();
        } catch (error) {
            window.showToast("Có lỗi xảy ra khi xóa vị trí", "error");
        }
    };

    const PrintableLocationLabel = React.forwardRef(({ location }, ref) => (
        <div ref={ref} className="p-6 w-[600px] h-[600px] text-center border border-gray-200 rounded-md bg-white flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">MÃ VỊ TRÍ</h2>
            <div className="flex justify-center">
                {location?.locationCode && (
                    <Barcode
                        value={location.locationCode}
                        height={100}
                        width={2.5}
                        margin={0}
                        displayValue={true}
                        fontSize={30}
                    />
                )}
            </div>
        </div>
    ));

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý Vị trí</h1>
                        <p className="text-slate-600 mt-1">
                            Quản lý các vị trí lưu trữ trong hệ thống
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_CREATE}>
                            <Button
                                className="bg-orange-400 hover:bg-orange-500 h-[38px] px-6 text-white transition-colors duration-200"
                                onClick={() => setShowBulkModal(true)}
                            >
                                <Plus className="mr-2 h-4 w-4 text-white" />
                                Thêm nhiều vị trí
                            </Button>
                        </PermissionWrapper>

                        <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_CREATE}>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white transition-colors duration-200"
                                onClick={handleOpenCreate}
                            >
                                <Plus className="mr-2 h-4 w-4 text-white" />
                                Thêm vị trí
                            </Button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* Stats Cards */}
                <StatsCards
                    totalCount={globalStats.total}
                    activeCount={globalStats.available}
                    inactiveCount={globalStats.unavailable}
                    totalLabel="Tổng vị trí"
                    activeLabel="Trống"
                    inactiveLabel="Đang sử dụng"
                />

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
                    <SearchFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo mã vị trí, khu vực"

                        // Filter TRẠNG THÁI
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: "1", label: "Hoạt động" },
                            { value: "2", label: "Ngừng hoạt động" },
                        ]}
                        onStatusFilter={handleStatusFilter}
                        clearStatusFilter={clearStatusFilter}

                        // Filter TÌNH TRẠNG
                        enableConditionFilter={true}
                        conditionFilter={conditionFilter}
                        setConditionFilter={setConditionFilter}
                        showConditionFilter={showConditionFilter}
                        setShowConditionFilter={setShowConditionFilter}
                        conditionOptions={[
                            { value: "", label: "Tất cả tình trạng" },
                            { value: "true", label: "Trống" },
                            { value: "false", label: "Đang sử dụng" },
                        ]}
                        onConditionFilter={handleConditionFilter}
                        clearConditionFilter={clearConditionFilter}

                        // Khác
                        // Filter KHU VỰC
                        areaFilter={areaFilter}
                        setAreaFilter={setAreaFilter}
                        showAreaFilter={showAreaFilter}
                        setShowAreaFilter={setShowAreaFilter}
                        areas={areas}
                        onAreaFilter={handleAreaFilter}
                        clearAreaFilter={clearAreaFilter}

                        // Khác
                        onClearAll={() => {
                            setSearchQuery("");
                            setStatusFilter("");
                            setConditionFilter("");
                            setShowStatusFilter(false);
                            setShowConditionFilter(false);
                            setAreaFilter("");
                            setShowAreaFilter(false);
                        }}
                        searchWidth="w-80"
                        showToggle={true}
                        defaultOpen={true}
                        showClearButton={true}
                    />

                    {/* Table */}
                    <div className="w-full">
                        {loading ? (
                            <Loading size="large" text="Đang tải dữ liệu..." />
                        ) : searchLoading ? (
                            <Loading size="medium" text="Đang tìm kiếm..." />
                        ) : (
                            <div className="overflow-x-auto">
                                <CustomTable className="w-full">
                                    <TableHeader>
                                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-16">
                                                STT
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                <div
                                                    className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1"
                                                    onClick={() => handleSort("locationCode")}
                                                >
                                                    <span>Mã vị trí</span>
                                                    {sortField === "locationCode" ? (
                                                        sortAscending ? (
                                                            <ArrowUp className="h-4 w-4 text-orange-500" />
                                                        ) : (
                                                            <ArrowDown className="h-4 w-4 text-orange-500" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                <div
                                                    className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1"
                                                    onClick={() => handleSort("areaName")}
                                                >
                                                    <span>Khu vực</span>
                                                    {sortField === "areaName" ? (
                                                        sortAscending ? (
                                                            <ArrowUp className="h-4 w-4 text-orange-500" />
                                                        ) : (
                                                            <ArrowDown className="h-4 w-4 text-orange-500" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Kệ
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Hàng
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Cột
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-48">
                                                Tình trạng
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-48">
                                                Trạng thái
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                                                Hoạt động
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {locations.length > 0 ? (
                                            locations.map((location, index) => (
                                                <TableRow
                                                    key={location.locationId}
                                                    className="hover:bg-slate-50 border-b border-slate-200"
                                                >
                                                    <TableCell className="px-6 py-4 text-slate-600 font-medium">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700 font-medium">{location?.locationCode || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{location?.areaName || "—"}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{location?.rack || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{location?.row || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{location?.column || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${location?.isAvailable
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${location?.isAvailable ? 'bg-green-400' : 'bg-red-400'
                                                                }`}></span>
                                                            {location?.isAvailable ? 'Trống' : 'Đang sử dụng'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <PermissionWrapper 
                                                                requiredPermission={PERMISSIONS.LOCATION_UPDATE}
                                                                hide={false}
                                                                fallback={
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 ${
                                                                        location?.status === 1 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        <span className={`w-2 h-2 rounded-full ${
                                                                            location?.status === 1 ? 'bg-green-500' : 'bg-red-500'
                                                                        }`}></span>
                                                                        {location?.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                                                                    </span>
                                                                }
                                                            >
                                                                <StatusToggle
                                                                    status={location?.status}
                                                                    onStatusChange={handleStatusChange}
                                                                    supplierId={location?.locationId}
                                                                    supplierName={location?.locationCode}
                                                                    entityType="Vị trí"
                                                                />
                                                            </PermissionWrapper>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_PRINT}>
                                                                <button
                                                                    className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                                                    title="In phiếu vị trí"
                                                                    onClick={() => {
                                                                        setSelectedLocation(location);
                                                                        setTimeout(() => handlePrint(), 100);
                                                                    }}
                                                                >
                                                                    <Printer className="h-4 w-4 text-blue-600" />
                                                                </button>
                                                            </PermissionWrapper>
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_UPDATE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Chỉnh sửa"
                                                                    onClick={() => handleOpenEdit(location)}
                                                                >
                                                                    <Edit className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_DELETE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xóa"
                                                                    onClick={() => {
                                                                        setItemToDelete(location);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </button>
                                                            </PermissionWrapper>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9}>
                                                    <div className="flex flex-col items-center justify-center text-center min-h-[260px]">
                                                        <EmptyState
                                                            icon={Folder}
                                                            title="Không tìm thấy vị trí nào"
                                                            description={
                                                                searchQuery || statusFilter
                                                                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                                                                    : "Chưa có vị trí nào trong hệ thống"
                                                            }
                                                            actionText="Xóa bộ lọc"
                                                            onAction={clearAllFilters}
                                                            showAction={!!(searchQuery || statusFilter)}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </CustomTable>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Pagination */}
                {!loading && !searchLoading && pagination.total > 0 && (
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        showPageSize={true}
                        pageSizeOptions={[10, 20, 30, 40]}
                        className="bg-gray-50"
                    />
                )}
            </div>

            {/* Create Location Modal */}
            <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_CREATE}>
                <CreateLocationModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            </PermissionWrapper>

            {/* Modal Tạo nhiều vị trí */}
            <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_CREATE}>
                {showBulkModal && (
                    <BulkCreateLocationModal
                        isOpen={showBulkModal}
                        onClose={() => setShowBulkModal(false)}
                    />
                )}
            </PermissionWrapper>

            {/* Update Location Modal */}
            <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_UPDATE}>
                <UpdateLocationModal
                    isOpen={showUpdateModal}
                    onClose={handleUpdateCancel}
                    onSuccess={handleUpdateSuccess}
                    locationId={updateLocationId}
                    locationData={editingLocation}
                />
            </PermissionWrapper>

            {/* Delete Confirmation Modal */}
            <PermissionWrapper requiredPermission={PERMISSIONS.LOCATION_DELETE}>
                <DeleteModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteConfirm}
                    itemName={itemToDelete?.locationCode || ""}
                />
            </PermissionWrapper>

            {/* Vùng in phiếu - căn giữa khi in */}
            <div className="print-wrapper">
                <div ref={printRef} className="print-container">
                    <PrintableLocationLabel location={selectedLocation} />
                </div>
            </div>

        </div>
    );
};

export default LocationList;
