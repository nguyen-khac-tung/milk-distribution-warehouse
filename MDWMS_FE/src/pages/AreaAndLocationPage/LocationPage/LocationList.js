import React, { useEffect, useState, useCallback } from "react";
import { Button } from "antd";
import { getLocations, deleteLocation, updateLocationStatus } from "../../../services/LocationServices";
import { Edit, Trash2, ChevronDown, Plus } from "lucide-react";
import DeleteModal from "../../../components/Common/DeleteModal";
import SearchFilterToggle from "../../../components/Common/SearchFilterToggle";
import StatsCards from "../../../components/Common/StatsCards";
import Loading from "../../../components/Common/Loading";
import CreateLocationModal from "./CreateLocationModal";
import UpdateLocationModal from "./UpdateLocationModal";
import { Card, CardContent } from "../../../components/ui/card";
import { Table as CustomTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { extractErrorMessage } from "../../../utils/Validation";
import { StatusToggle } from "../../../components/Common/SwitchToggle/StatusToggle";


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
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);

    const fetchLocations = async (page = 1, pageSize = 10, params = {}) => {
        try {
            setLoading(true);
            console.log("Fetching with params:", {
                pageNumber: page,
                pageSize,
                search: params.search,
                isAvailable: params.filters?.isAvailable,
                status: params.filters?.status,
            });
            const res = await getLocations({
                pageNumber: page,
                pageSize,
                search: params.search,
                isAvailable: params.filters?.isAvailable,
                areaId: params.filters?.areaId,
                status: params.filters?.status,
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
        fetchLocations(1, 10);
        // Also fetch global stats once on mount
        fetchStats();
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
            if (showPageSizeFilter && !event.target.closest('.page-size-filter-dropdown')) {
                setShowPageSizeFilter(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showStatusFilter, showStatusTypeFilter, showPageSizeFilter]);

    // Callback khi filter thay đổi
    const handleFilterChange = useCallback((params) => {
        setSearchLoading(true);
        setPagination((p) => ({ ...p, current: 1 }));
        fetchLocations(1, pagination.pageSize, params);
    }, [pagination.pageSize]);

    // Search input change handler
    const handleSearchInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleFilterChange({
                search: searchQuery,
                filters: {
                    isAvailable: statusFilter ? statusFilter === "true" : undefined,
                    status: statusTypeFilter ? Number(statusTypeFilter) : undefined
                }
            });
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, statusFilter, statusTypeFilter, handleFilterChange]);

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        handleFilterChange({
            search: searchQuery,
            filters: {
                isAvailable: status ? status === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        handleFilterChange({
            search: searchQuery,
            filters: {
                isAvailable: undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
    };

    const handleStatusTypeFilter = (status) => {
        setStatusTypeFilter(status);
        handleFilterChange({
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: status ? Number(status) : undefined
            }
        });
    };

    const clearStatusTypeFilter = () => {
        setStatusTypeFilter("");
        handleFilterChange({
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: undefined
            }
        });
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current: newPage }));
        fetchLocations(newPage, pagination.pageSize, {
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
        fetchLocations(1, newPageSize, {
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortAscending(!sortAscending);
        } else {
            setSortField(field);
            setSortAscending(true);
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
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
        fetchStats(); // Cập nhật tổng stats
    };

    // Handle update success
    const handleUpdateSuccess = () => {
        setShowUpdateModal(false);
        setEditingLocation(null);
        setUpdateLocationId(null);
        fetchLocations(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
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
                    isAvailable: statusFilter ? statusFilter === "true" : undefined,
                    status: statusTypeFilter ? Number(statusTypeFilter) : undefined
                }
            });
            // refresh global stats
            fetchStats();
        } catch (error) {
            window.showToast("Có lỗi xảy ra khi xóa vị trí", "error");
        }
    };


    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý Vị trí</h1>
                        <p className="text-slate-600 mt-1">Quản lý các vị trí lưu trữ trong hệ thống</p>
                    </div>
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 h-8 px-6 text-white"
                        onClick={handleOpenCreate}
                    >
                        <Plus className="mr-2 h-4 w-4 text-white" />
                        Thêm vị trí
                    </Button>
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
                        searchPlaceholder="Tìm kiếm theo mã vị trí..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả tình trạng" },
                            { value: "true", label: "Trống" },
                            { value: "false", label: "Đang sử dụng" }
                        ]}
                        onStatusFilter={handleStatusFilter}
                        clearStatusFilter={clearStatusFilter}
                        onClearAll={() => {
                            setSearchQuery("");
                            setStatusFilter("");
                            setStatusTypeFilter("");
                            setShowStatusFilter(false);
                            setShowStatusTypeFilter(false);
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
                                                <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("locationCode")}>
                                                    <span>Mã vị trí</span>
                                                    <div className="flex flex-col">
                                                        <ChevronDown
                                                            className={`h-3 w-3 ${sortField === "locationCode" && sortAscending ? "text-orange-500" : "text-slate-400"}`}
                                                        />
                                                        <ChevronDown
                                                            className={`h-3 w-3 ${sortField === "locationCode" && !sortAscending ? "text-orange-500" : "text-slate-400"}`}
                                                            style={{ transform: "rotate(180deg)" }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Khu vực
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
                                                    <TableCell className="font-medium text-slate-900 px-6 py-3 text-left">
                                                        {location?.locationCode || ''}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {location?.areaName || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {location?.rack || ''}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {location?.row || ''}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {location?.column || ''}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${location?.isAvailable
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${location?.isAvailable ? 'bg-green-400' : 'bg-red-400'
                                                                }`}></span>
                                                            {location?.isAvailable ? 'Trống' : 'Đang sử dụng'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-center">
                                                        <div className="flex justify-center">
                                                            <StatusToggle
                                                                status={location?.status}
                                                                onStatusChange={handleStatusChange}
                                                                supplierId={location?.locationId}
                                                                supplierName={location?.locationCode}
                                                                entityType="Vị trí"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Xem chi tiết"
                                                            >
                                                                <Eye className="h-4 w-4 text-orange-500" />
                                                            </button>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Chỉnh sửa"
                                                                onClick={() => handleOpenEdit(location)}
                                                            >
                                                                <Edit className="h-4 w-4 text-orange-500" />
                                                            </button>
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
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                                                    Không tìm thấy vị trí nào
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
                    <Card className="bg-gray-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-600">
                                    Hiển thị {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} trong tổng số {pagination.total} vị trí
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => {
                                                if (pagination.current > 1) {
                                                    handlePageChange(pagination.current - 1);
                                                }
                                            }}
                                            disabled={pagination.current <= 1}
                                        >
                                            Trước
                                        </Button>
                                        <span className="text-sm text-slate-600">
                                            Trang {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => {
                                                if (pagination.current < Math.ceil(pagination.total / pagination.pageSize)) {
                                                    handlePageChange(pagination.current + 1);
                                                }
                                            }}
                                            disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                                        >
                                            Sau
                                        </Button>
                                    </div>

                                    {/* Page Size Selector */}
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-slate-600">Hiển thị:</span>
                                        <div className="relative page-size-filter-dropdown">
                                            <button
                                                onClick={() => setShowPageSizeFilter(!showPageSizeFilter)}
                                                className="flex items-center space-x-2 px-3 py-2 h-8 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <span>{pagination.pageSize}</span>
                                                <ChevronDown className="h-4 w-4" />
                                            </button>

                                            {showPageSizeFilter && (
                                                <div className="absolute bottom-full right-0 mb-1 w-20 bg-gray-50 rounded-md shadow-lg border z-10">
                                                    <div className="py-1">
                                                        {[10, 20, 30, 40].map((size) => (
                                                            <button
                                                                key={size}
                                                                onClick={() => handlePageSizeChange(size)}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${pagination.pageSize === size ? 'bg-[#d97706] text-white' : 'text-slate-700'
                                                                    }`}
                                                            >
                                                                {size}
                                                                {pagination.pageSize === size && <span className="text-white">✓</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm text-slate-600">/ Trang</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create Location Modal */}
            <CreateLocationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Update Location Modal */}
            <UpdateLocationModal
                isOpen={showUpdateModal}
                onClose={handleUpdateCancel}
                onSuccess={handleUpdateSuccess}
                locationId={updateLocationId}
                locationData={editingLocation}
            />

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                itemName={itemToDelete?.locationCode || ""}
            />
        </div>
    );
};

export default LocationList;
