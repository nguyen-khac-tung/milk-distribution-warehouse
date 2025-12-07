import React, { useEffect, useState, useRef, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import { getAreas, deleteArea, getAreaDetail, updateAreaStatus } from "../../../services/AreaServices";
import { Edit, Trash2, Plus, Eye, ArrowUpDown, ArrowDown, ArrowUp, Folder } from "lucide-react";
import DeleteModal from "../../../components/Common/DeleteModal";
import SearchFilterToggle from "../../../components/Common/SearchFilterToggle";
import Pagination from "../../../components/Common/Pagination";
import Loading from "../../../components/Common/Loading";
import CreateAreaModal from "./CreateAreaModal";
import UpdateAreaModal from "./UpdateAreaModal";
import { Card } from "../../../components/ui/card";
import { Table as CustomTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { extractErrorMessage } from "../../../utils/Validation";
import { ModalAreaDetail } from "./ViewAreaModal";
import StatsCards from "../../../components/Common/StatsCards";
import { StatusToggle } from "../../../components/Common/SwitchToggle/StatusToggle";
import EmptyState from "../../../components/Common/EmptyState";
import PermissionWrapper from "../../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../../utils/permissions";

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
    const [areaDetail, setAreaDetail] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);
    const [statusSearchQuery, setStatusSearchQuery] = useState("");



    // Fetch total stats (không filter)
    const fetchTotalStats = async () => {
        try {
            const res = await getAreas({
                pageNumber: 1,
                pageSize: 1000,
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

    // Normalize function: lowercase, trim, and collapse multiple spaces into one
    const normalize = (str) => {
        if (!str) return "";
        return str
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " "); // gom nhiều space thành 1 space
    };

    // Fetch list areas
    const fetchAreas = async (page = 1, pageSize = 10, params = {}) => {
        try {
            setLoading(true);
            // Normalize search query trước khi gọi API (nhưng vẫn giữ nguyên giá trị trong input khi đang gõ)
            const normalizedSearch = normalize(params.search || "");
            const res = await getAreas({
                pageNumber: page,
                pageSize,
                search: normalizedSearch,
                filters: params.filters,
                sortField: params.sortField || "",
                sortAscending: typeof params.sortAscending === 'boolean' ? params.sortAscending : undefined,
                sortOrder: typeof params.sortAscending === 'boolean' ? (params.sortAscending ? 'asc' : 'desc') : (params.sortOrder || "")
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

    const didMountRef = useRef(false);
    const skipFirstSearchRef = useRef(true);

    useEffect(() => {
        if (didMountRef.current) return;
        didMountRef.current = true;
        fetchAreas(pagination.current, pagination.pageSize);
        fetchTotalStats();
    }, []);

    // Close filters when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusFilter && !event.target.closest('.status-filter-dropdown')) {
                setShowStatusFilter(false);
                setStatusSearchQuery("");
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

    useEffect(() => {
        if (skipFirstSearchRef.current) {
            skipFirstSearchRef.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            setSearchLoading(true);
            fetchAreas(1, pagination.pageSize, {
                search: searchQuery || "",
                filters: {
                    status: statusFilter ? Number(statusFilter) : undefined
                },
                sortField,
                sortAscending
            });
            setPagination((p) => ({ ...p, current: 1 }));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Filter status options based on search query
    const filteredStatusOptions = useMemo(() => {
        const statusOptions = [
            { value: "", label: "Tất cả trạng thái" },
            { value: "1", label: "Hoạt động" },
            { value: "2", label: "Ngừng hoạt động" }
        ]
        if (!statusSearchQuery) return statusOptions
        const query = statusSearchQuery.toLowerCase()
        return statusOptions.filter(option =>
            option.label.toLowerCase().includes(query)
        )
    }, [statusSearchQuery])

    // Filter handlers
    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setShowStatusFilter(false);
        setStatusSearchQuery("");
        setSearchLoading(true);
        fetchAreas(1, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: status ? Number(status) : undefined
            },
            sortField,
            sortAscending
        });
        setPagination((p) => ({ ...p, current: 1 }));
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        setShowStatusFilter(false);
        setStatusSearchQuery("");
        setSearchLoading(true);
        fetchAreas(1, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: undefined
            },
            sortField,
            sortAscending
        });
        setPagination((p) => ({ ...p, current: 1 }));
    };

    const handleClearAllFilters = () => {
        setSearchQuery("")
        setStatusFilter("")
        setStatusSearchQuery("")
        setShowStatusFilter(false)
        setSearchLoading(true);
        fetchAreas(
            1,
            pagination.pageSize,
            {
                search: "",
                filters: {},
                sortField: "",
                sortAscending: true,
            }
        );
    }

    const clearAllFilters = handleClearAllFilters

    // Page handlers
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current: newPage }));
        fetchAreas(newPage, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            },
            sortField,
            sortAscending
        });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
        fetchAreas(1, newPageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            },
            sortField,
            sortAscending
        });
    };

    // Sort handler
    const handleSort = (field) => {
        if (sortField === field) {
            if (sortAscending === true) {
                setSortAscending(false);
                fetchAreas(pagination.current, pagination.pageSize, {
                    search: searchQuery,
                    filters: { status: statusFilter ? Number(statusFilter) : undefined },
                    sortField: field,
                    sortAscending: false,
                });
            } else {
                // Lần 3: bỏ sort
                setSortField("");
                setSortAscending(true);
                fetchAreas(pagination.current, pagination.pageSize, {
                    search: searchQuery,
                    filters: { status: statusFilter ? Number(statusFilter) : undefined },
                    sortField: "",
                    sortAscending: undefined,
                });
            }
        } else {
            // Lần đầu click cột khác → sort asc
            setSortField(field);
            setSortAscending(true);
            fetchAreas(pagination.current, pagination.pageSize, {
                search: searchQuery,
                filters: { status: statusFilter ? Number(statusFilter) : undefined },
                sortField: field,
                sortAscending: true,
            });
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
            },
            sortField,
            sortAscending
        });
        fetchTotalStats();
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
            },
            sortField,
            sortAscending
        });
        fetchTotalStats();
    };

    const handleClearAll = () => {
        // Reset UI states
        setSearchQuery("");
        setStatusFilter("");
        setStatusSearchQuery("");
        setShowStatusFilter(false);
        setSortField("");
        setSortAscending(true);

        // Reset về trang 1
        setPagination(prev => ({ ...prev, current: 1 }));

        setSearchLoading(true);

        // Gọi API load lại danh sách ban đầu TRANG 1
        fetchAreas(
            1,
            pagination.pageSize,
            {
                search: "",
                filters: {},
                sortField: "",
                sortAscending: true,
            }
        );
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
            window.showToast(`Đã ${statusText} khu vực thành công`, "success")
        } catch (error) {
            console.error("Error updating area status:", error)

            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật trạng thái")
            window.showToast(errorMessage, "error")
        }
    }

    // Xem chi tiết khu vực
    const handleViewClick = async (area) => {
        try {
            setItemToView(area)
            setLoadingDetail(true)
            setShowViewModal(true)

            const response = await getAreaDetail(area.areaId)

            if (response && response.data) {
                const areaDetailData = {
                    ...area,
                    ...response.data,
                    ...area,
                    ...response.data
                }
                setAreaDetail(areaDetailData)
            } else {
                setAreaDetail(area)
            }
        } catch (error) {
            setAreaDetail(area)
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
                sortField,
                sortAscending
            });
            fetchTotalStats();
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
                    <PermissionWrapper requiredPermission={PERMISSIONS.AREA_CREATE}>
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                            onClick={handleOpenCreate}
                        >
                            <Plus className="mr-2 h-4 w-4 text-white" />
                            Thêm khu vực
                        </Button>
                    </PermissionWrapper>
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
                <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
                    <SearchFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo tên, mã khu vực"
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
                        enableStatusSearch={true}
                        statusSearchQuery={statusSearchQuery}
                        setStatusSearchQuery={setStatusSearchQuery}
                        filteredStatusOptions={filteredStatusOptions}
                        onClearAll={handleClearAll}
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
                                                    onClick={() => handleSort("areaCode")}
                                                >
                                                    <span>Mã khu vực</span>
                                                    {sortField === "areaCode" ? (
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
                                                    <span>Tên khu vực</span>
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
                                                    className="hover:bg-slate-50 border-b border-slate-200"
                                                >
                                                    <TableCell className="px-6 py-4 text-slate-600 font-medium">
                                                        {(pagination.current - 1) * pagination.pageSize + index + 1}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700 font-medium">{area?.areaCode || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{area?.areaName || "—"}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{area?.description || "—"}</TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <PermissionWrapper
                                                                requiredPermission={PERMISSIONS.AREA_UPDATE}
                                                                hide={false}
                                                                fallback={
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 ${area?.status === 1
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        <span className={`w-2 h-2 rounded-full ${area?.status === 1 ? 'bg-green-500' : 'bg-red-500'
                                                                            }`}></span>
                                                                        {area?.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                                                                    </span>
                                                                }
                                                            >
                                                                <StatusToggle
                                                                    status={area?.status}
                                                                    onStatusChange={handleStatusChange}
                                                                    supplierId={area?.areaId}
                                                                    supplierName={area?.areaName}
                                                                    entityType="danh mục"
                                                                />
                                                            </PermissionWrapper>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.AREA_VIEW}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xem chi tiết"
                                                                    onClick={() => handleViewClick(area)}
                                                                >
                                                                    <Eye className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.AREA_UPDATE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Chỉnh sửa"
                                                                    onClick={() => handleOpenEdit(area)}
                                                                >
                                                                    <Edit className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.AREA_DELETE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xóa"
                                                                    onClick={() => {
                                                                        setItemToDelete(area);
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
                                                <TableCell colSpan={6}>
                                                    <div className="flex flex-col items-center justify-center text-center min-h-[260px]">
                                                        <EmptyState
                                                            icon={Folder}
                                                            title="Không tìm khu vực nào"
                                                            description={
                                                                searchQuery || statusFilter
                                                                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                                                                    : "Chưa có khu vực nào trong hệ thống"
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

            {/* Create Area Modal */}
            <PermissionWrapper requiredPermission={PERMISSIONS.AREA_CREATE}>
                <CreateAreaModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            </PermissionWrapper>

            {/* Update Area Modal */}
            <PermissionWrapper requiredPermission={PERMISSIONS.AREA_UPDATE}>
                <UpdateAreaModal
                    isOpen={showUpdateModal}
                    onClose={handleUpdateCancel}
                    onSuccess={handleUpdateSuccess}
                    areaId={updateAreaId}
                    areaData={editingArea}
                />
            </PermissionWrapper>

            <PermissionWrapper requiredPermission={PERMISSIONS.AREA_DELETE}>
                <DeleteModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteConfirm}
                    itemName={itemToDelete?.areaCode || ""}
                />
            </PermissionWrapper>

            {/* View Area Detail Modal */}
            <PermissionWrapper requiredPermission={PERMISSIONS.AREA_VIEW}>
                {showViewModal && (
                    <div >
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
                )}
            </PermissionWrapper>
        </div>
    );
};

export default AreaLists;