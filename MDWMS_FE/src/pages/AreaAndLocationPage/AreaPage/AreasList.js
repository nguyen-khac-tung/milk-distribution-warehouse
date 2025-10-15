import React, { useEffect, useState, useRef } from "react";
import { Button } from "antd";
import { getAreas, deleteArea, getAreaDetail, updateAreaStatus } from "../../../services/AreaServices";
import { Edit, Trash2, ChevronDown, Plus, Eye, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import DeleteModal from "../../../components/Common/DeleteModal";
import SearchFilterToggle from "../../../components/Common/SearchFilterToggle";
import Pagination from "../../../components/Common/Pagination";
import Loading from "../../../components/Common/Loading";
import CreateAreaModal from "./CreateAreaModal";
import UpdateAreaModal from "./UpdateAreaModal";
import { Card, CardContent } from "../../../components/ui/card";
import { Table as CustomTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { extractErrorMessage } from "../../../utils/Validation";
import { ModalAreaDetail } from "./ViewAreaModal";
import StatsCards from "../../../components/Common/StatsCards";
import { StatusToggle } from "../../../components/Common/SwitchToggle/StatusToggle";

const AreaLists = () => {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // Stats states - không bị ảnh hưởng bởi filter
    const [totalStats, setTotalStats] = useState({
        total: 0,
        active: 0,
        inactive: 0
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [updateAreaId, setUpdateAreaId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const searchQueryRef = useRef("");
    const [areaDetail, setAreaDetail] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);


    // Fetch total stats (không filter)
    const fetchTotalStats = async () => {
        try {
            const res = await getAreas({
                pageNumber: 1,
                pageSize: 1000, // Lấy tất cả để tính stats
                search: "",
                filters: {},
            });

            const payload = res ?? {};
            const allItems = Array.isArray(payload.items)
                ? payload.items
                : Array.isArray(payload.data?.items)
                    ? payload.data.items
                    : Array.isArray(payload.data)
                        ? payload.data
                        : [];

            const total = allItems.length;
            const active = allItems.filter((a) => a.status === 1).length;
            const inactive = allItems.filter((a) => a.status === 2).length;

            setTotalStats({ total, active, inactive });
        } catch (err) {
            console.log("Không thể tải thống kê tổng!", err);
        }
    };

    // Fetch list areas
    const fetchAreas = async (page = 1, pageSize = 10, params = {}) => {
        try {
            setLoading(true);
            const res = await getAreas({
                pageNumber: page,
                pageSize,
                search: params.search,
                filters: params.filters,
                sortField: params.sortField || "",        // thêm dòng này
                sortOrder: params.sortOrder || ""         // thêm dòng này
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

            setAreas(items);
            setPagination({ current: page, pageSize, total });
        } catch (err) {
            console.log("Không thể tải danh sách khu vực!", err);
            window.showToast("Không thể tải danh sách khu vực!", "error");
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas(pagination.current, pagination.pageSize);
        fetchTotalStats(); // Load tổng stats
    }, []);

    // Close filters when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusFilter && !event.target.closest('.status-filter-dropdown')) {
                setShowStatusFilter(false);
            }
            if (showPageSizeFilter && !event.target.closest('.page-size-filter-dropdown')) {
                setShowPageSizeFilter(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showStatusFilter, showPageSizeFilter]);

    // Search input change handler
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        searchQueryRef.current = value;
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchLoading(true);
            fetchAreas(1, pagination.pageSize, {
                search: searchQuery || "",
                filters: {
                    status: statusFilter ? Number(statusFilter) : undefined
                }
            });
            setPagination((p) => ({ ...p, current: 1 }));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, statusFilter]);

    // Filter handlers
    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setSearchLoading(true);
        fetchAreas(1, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: status ? Number(status) : undefined
            }
        });
        setPagination((p) => ({ ...p, current: 1 }));
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        setSearchLoading(true);
        fetchAreas(1, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: undefined
            }
        });
        setPagination((p) => ({ ...p, current: 1 }));
    };

    // Page handlers
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current: newPage }));
        fetchAreas(newPage, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            }
        });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
        fetchAreas(1, newPageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            }
        });
    };

    // Sort handler
    const handleSort = (field) => {
        if (sortField === field) {
            setSortAscending(!sortAscending);
        } else {
            setSortField(field)
            setSortAscending(true)
        }
    }

    // Mở modal thêm mới
    const handleOpenCreate = () => {
        setShowCreateModal(true);
    };

    // Mở modal sửa
    const handleOpenEdit = (record) => {
        setEditingArea(record);
        setUpdateAreaId(record.areaId);
        setShowUpdateModal(true);
    };

    // Handle create success
    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchAreas(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            }
        });
        fetchTotalStats(); // Cập nhật tổng stats
    };

    // Handle update success
    const handleUpdateSuccess = () => {
        setShowUpdateModal(false);
        setEditingArea(null);
        setUpdateAreaId(null);
        fetchAreas(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            }
        });
        fetchTotalStats(); // Cập nhật tổng stats
    };

    // Handle update cancel
    const handleUpdateCancel = () => {
        setShowUpdateModal(false);
        setEditingArea(null);
        setUpdateAreaId(null);
    };

    const handleViewClose = () => {
        setShowViewModal(false)
        setItemToView(null)
        setAreaDetail(null)
    }

    const handleStatusChange = async (areaId, newStatus) => {
        try {
            await updateAreaStatus(areaId, newStatus)

            // Update local state
            setAreas(prevAreas =>
                prevAreas.map(area =>
                    area.areaId === areaId
                        ? { ...area, status: newStatus }
                        : area
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

    // Xem chi tiết khu vực
    const handleViewClick = async (area) => {
        try {
            console.log("Viewing area:", area)
            setItemToView(area)
            setLoadingDetail(true)
            setShowViewModal(true)

            const response = await getAreaDetail(area.areaId)
            // console.log("API Response Area:", response)

            if (response && response.data) {
                const areaDetailData = {
                    ...area,
                    ...response.data
                }
                setAreaDetail(areaDetailData)
                // console.log("Area detail set:", areaDetailData)
            } else {
                setAreaDetail(area)
                // console.log("Using fallback area data:", area)
            }
        } catch (error) {
            // console.error("Error loading area detail:", error)
            setAreaDetail(area)
            // console.log("Using fallback area data due to error:", area)
        } finally {
            setLoadingDetail(false)
        }
    }

    // Xóa khu vực
    const handleDeleteConfirm = async () => {
        try {
            await deleteArea(itemToDelete?.areaId);
            window.showToast(
                `Đã xóa khu vực: ${itemToDelete?.areaCode || ""}`,
                "success"
            );

            setShowDeleteModal(false);
            setItemToDelete(null);

            fetchAreas(pagination.current, pagination.pageSize, {
                search: searchQuery,
                filters: {
                    status: statusFilter ? Number(statusFilter) : undefined,
                },
            });
            fetchTotalStats();
        } catch (error) {
            // console.error("Error deleting area:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi xóa khu vực")
            window.showToast(errorMessage, "error");
        }
    };

    const { total: totalCount, active: activeCount, inactive: inactiveCount } = totalStats;

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý Khu vực</h1>
                        <p className="text-slate-600 mt-1">Quản lý các khu vực lưu trữ trong hệ thống</p>
                    </div>
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 h-8 px-6 text-white"
                        onClick={handleOpenCreate}
                    >
                        <Plus className="mr-2 h-4 w-4 text-white" />
                        Thêm khu vực
                    </Button>
                </div>

                {/* Stats Cards */}
                <StatsCards
                    totalCount={totalCount}
                    activeCount={activeCount}
                    inactiveCount={inactiveCount}
                    totalLabel="Tổng khu vực"
                    activeLabel="Hoạt động"
                    inactiveLabel="Ngừng hoạt động"
                />

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
                    <SearchFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo mã khu vực..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: "1", label: "Hoạt động" },
                            { value: "2", label: "Ngừng hoạt động" }
                        ]}
                        onStatusFilter={handleStatusFilter}
                        clearStatusFilter={clearStatusFilter}
                        onClearAll={() => {
                            setSearchQuery("");
                            setStatusFilter("");
                            setShowStatusFilter(false);
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
                                                Tên khu vực
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Mã khu vực
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Mô tả
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
                                        {areas.length > 0 ? (
                                            areas.map((area, index) => (
                                                <TableRow
                                                    key={area.areaId}
                                                    className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150 border-b border-slate-100"
                                                >
                                                    <TableCell className="text-slate-600 px-6 py-3 text-left font-medium">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {area?.areaName || "—"}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900 px-6 py-3 text-left">
                                                        {area?.areaCode || ''}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {area?.description || "—"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-center">
                                                        <div className="flex justify-center">
                                                            <StatusToggle
                                                                status={area?.status}
                                                                onStatusChange={handleStatusChange}
                                                                supplierId={area?.areaId}
                                                                supplierName={area?.areaName}
                                                                entityType="khu vực"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Xem chi tiết"
                                                                onClick={() => handleViewClick(area)}
                                                            >
                                                                <Eye className="h-4 w-4 text-[#d97706]" />
                                                            </button>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Chỉnh sửa"
                                                                onClick={() => handleOpenEdit(area)}
                                                            >
                                                                <Edit className="h-4 w-4 text-[#d97706]" />
                                                            </button>
                                                            <button
                                                                className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                                                title="Xóa"
                                                                onClick={() => {
                                                                    setItemToDelete(area);
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
                                                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                                    Không tìm thấy khu vực nào
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
                                    Hiển thị {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} trong tổng số {pagination.total} khu vực
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

            {/* Create Area Modal */}
            <CreateAreaModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Update Area Modal */}
            <UpdateAreaModal
                isOpen={showUpdateModal}
                onClose={handleUpdateCancel}
                onSuccess={handleUpdateSuccess}
                areaId={updateAreaId}
                areaData={editingArea}
            />

            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                itemName={itemToDelete?.areaCode || ""}
            />

            {/* View Area Detail Modal */}
            {showViewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {loadingDetail ? (
                            <Loading size="large" text="Đang tải chi tiết khu vực..." />
                        ) : areaDetail ? (
                            <ModalAreaDetail
                                area={areaDetail}
                                onClose={handleViewClose}
                            />
                        ) : (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-slate-600">Không có dữ liệu để hiển thị</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AreaLists;