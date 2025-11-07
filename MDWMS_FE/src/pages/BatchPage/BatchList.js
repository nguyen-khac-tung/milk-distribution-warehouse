import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import Pagination from "../../components/Common/Pagination";
import { Table as CustomTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Plus, Edit, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Folder } from "lucide-react";
import SearchFilterToggle from "../../components/Common/SearchFilterToggle";
import Loading from "../../components/Common/Loading";
import StatsCards from "../../components/Common/StatsCards";
import DeleteModal from "../../components/Common/DeleteModal";
import { StatusToggle } from "../../components/Common/SwitchToggle/StatusToggle";
import { extractErrorMessage } from "../../utils/Validation";
import { getBatches, deleteBatch, updateBatchStatus } from "../../services/BatchService";
import CreateBatchModal from "./CreateBatchModal";
import UpdateBatchModal from "./UpdateBatchModal";
import EmptyState from "../../components/Common/EmptyState";

const BatchList = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10, totalCount: 0 });
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);
    const [statusSearchQuery, setStatusSearchQuery] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateBatchId, setUpdateBatchId] = useState(null);
    const [editingBatch, setEditingBatch] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [totalStats, setTotalStats] = useState({ total: 0, active: 0, inactive: 0 });

    const fetchBatches = async (params = {}) => {
        try {
            setLoading(true);
            const res = await getBatches({
                pageNumber: params.pageNumber ?? pagination.pageNumber,
                pageSize: params.pageSize ?? pagination.pageSize,
                search: params.search ?? searchQuery,
                sortField: params.sortField ?? sortField,
                sortAscending: typeof params.sortAscending === 'boolean' ? params.sortAscending : sortAscending,
                status: params.status ?? statusFilter,
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

            setBatches(items);
            setPagination(prev => ({ ...prev, pageNumber: params.pageNumber ?? prev.pageNumber, pageSize: params.pageSize ?? prev.pageSize, totalCount: total }));
        } catch (error) {
            console.error("Không thể tải danh sách lô hàng:", error);
            window.showToast("Không thể tải danh sách lô hàng", "error");
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    const fetchTotalStats = async () => {
        try {
            const res = await getBatches({ pageNumber: 1, pageSize: 1000, search: "", sortField: "", sortAscending: true });
            const items = Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.items) ? res.items : [];
            const total = items.length;
            const active = items.filter(b => b.status === 1).length;
            const inactive = items.filter(b => b.status === 2).length;
            setTotalStats({ total, active, inactive });
        } catch (e) {
            console.error("Không thể tải thống kê lô hàng", e);
        }
    };

    useEffect(() => {
        fetchBatches({ pageNumber: 1, pageSize: 10 });
        fetchTotalStats();
    }, []);

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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showStatusFilter, showPageSizeFilter]);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchLoading(true);
            fetchBatches({ pageNumber: 1, pageSize: pagination.pageSize, search: searchQuery });
        }, 500);
        return () => clearTimeout(t);
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

    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        setShowStatusFilter(false);
        setStatusSearchQuery("");
        setSearchLoading(true);
        fetchBatches({ pageNumber: 1, status: value });
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        setStatusSearchQuery("");
        setSearchLoading(true);
        fetchBatches({ pageNumber: 1, status: "" });
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, pageNumber: newPage }));
        fetchBatches({ pageNumber: newPage });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 1 }));
        fetchBatches({ pageNumber: 1, pageSize: newPageSize });
    };

    const handleClearAllFilters = () => {
        setSearchQuery("")
        setStatusFilter("")
        setStatusSearchQuery("")
        setShowStatusFilter(false)
    }

    const clearAllFilters = handleClearAllFilters

    const handleClearAll = () => {
        setSearchQuery("");
        setStatusFilter("");
        setStatusSearchQuery("");
        setShowStatusFilter(false);
        setSearchLoading(true);
        fetchBatches({ pageNumber: 1, search: "", status: "" });
    };

    const handleSort = (field) => {
        if (sortField === field) {
            if (sortAscending === true) {
                setSortAscending(false);
                fetchBatches({ sortField: field, sortAscending: false });
            } else {
                setSortField("");
                setSortAscending(true);
                fetchBatches({ sortField: "", sortAscending: undefined });
            }
        } else {
            setSortField(field);
            setSortAscending(true);
            fetchBatches({ sortField: field, sortAscending: true });
        }
    };

    const handleOpenCreate = () => setShowCreateModal(true);
    const handleOpenEdit = (record) => {
        setEditingBatch(record);
        setUpdateBatchId(record.batchId);
        setShowUpdateModal(true);
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchBatches({ pageNumber: pagination.pageNumber });
        fetchTotalStats();
    };

    const handleUpdateSuccess = () => {
        setShowUpdateModal(false);
        setEditingBatch(null);
        setUpdateBatchId(null);
        fetchBatches({ pageNumber: pagination.pageNumber });
        fetchTotalStats();
    };

    const handleUpdateCancel = () => {
        setShowUpdateModal(false);
        setEditingBatch(null);
        setUpdateBatchId(null);
    };

    const handleStatusChange = async (batchId, newStatus, displayName) => {
        try {
            await updateBatchStatus({ batchId: batchId, status: newStatus });
            setBatches(prev => prev.map(b => b.batchId === batchId ? { ...b, status: newStatus } : b));
            window.showToast(`Đã ${newStatus === 1 ? 'kích hoạt' : 'ngừng hoạt động'} lô: ${displayName}`, "success");
        } catch (error) {
            console.error("Error updating batch status:", error);
            const msg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật trạng thái");
            window.showToast(msg, "error");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteBatch(itemToDelete?.batchId);
            window.showToast(`Đã xóa lô: ${itemToDelete?.batchCode || ''}`, "success");
            setShowDeleteModal(false);
            setItemToDelete(null);
            fetchBatches({ pageNumber: pagination.pageNumber });
            fetchTotalStats();
        } catch (error) {
            const msg = extractErrorMessage(error, "Có lỗi xảy ra khi xóa lô hàng");
            window.showToast(msg, "error");
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý Lô hàng</h1>
                        <p className="text-slate-600 mt-1">Quản lý các lô hàng trong hệ thống</p>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white" onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4 text-white" />
                        Thêm lô hàng
                    </Button>
                </div>

                {/* Stats Cards */}
                <StatsCards
                    totalCount={totalStats.total}
                    activeCount={totalStats.active}
                    inactiveCount={totalStats.inactive}
                    totalLabel="Tổng lô hàng"
                    activeLabel="Hoạt động"
                    inactiveLabel="Ngừng hoạt động"
                />

                {/* Search + Table */}
                <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
                    <SearchFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo mã lô, tên hàng hóa"
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
                                                    onClick={() => handleSort("batchCode")}
                                                >
                                                    <span>Mã lô hàng</span>
                                                    {sortField === "batchCode" ? (
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
                                                Tên hàng hóa
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Mô tả
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Ngày sản xuất
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Ngày hết hạn
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-22">
                                                Trạng thái
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                                                Hoạt động
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.isArray(batches) && batches.length > 0 ? (
                                            batches.map((batch, index) => (
                                                <TableRow key={batch.batchId} className="hover:bg-slate-50 border-b border-slate-200">
                                                    <TableCell className="px-6 py-4 text-slate-600 font-medium">{index + 1}</TableCell>
                                                    <TableCell className="font-medium text-slate-900 px-6 py-3 text-left">{batch?.batchCode || ''}</TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {batch?.goodsName
                                                            ? batch.goodsName.length > 20
                                                                ? batch.goodsName.slice(0, 20) + "..."
                                                                : batch.goodsName
                                                            : ""}
                                                    </TableCell>

                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {batch?.description
                                                            ? batch.description.length > 30
                                                                ? batch.description.slice(0, 30) + "..."
                                                                : batch.description
                                                            : ""}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {batch?.manufacturingDate
                                                            ? new Date(batch.manufacturingDate).toLocaleDateString('vi-VN')
                                                            : ''}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 px-6 py-3 text-left">
                                                        {batch?.expiryDate
                                                            ? new Date(batch.expiryDate).toLocaleDateString('vi-VN')
                                                            : ''}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center w-22">
                                                        <div className="flex justify-center">
                                                            <StatusToggle
                                                                status={batch?.status}
                                                                onStatusChange={handleStatusChange}
                                                                supplierId={batch?.batchId}
                                                                supplierName={batch?.batchCode}
                                                                entityType="lô hàng"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <button className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Chỉnh sửa" onClick={() => handleOpenEdit(batch)}>
                                                                <Edit className="h-4 w-4 text-orange-500" />
                                                            </button>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Xóa"
                                                                onClick={() => { setItemToDelete(batch); setShowDeleteModal(true); }}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="p-0">
                                                    <div className="flex items-center justify-center text-center h-[300px] w-full">
                                                        <EmptyState
                                                            icon={Folder}
                                                            title="Không tìm lô hàng nào"
                                                            description={
                                                                searchQuery || statusFilter
                                                                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                                                                    : "Chưa có lô hàng nào trong hệ thống"
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
                {!loading && !searchLoading && pagination.totalCount > 0 && (
                    <Pagination
                        current={pagination.pageNumber}
                        pageSize={pagination.pageSize}
                        total={pagination.totalCount}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        showPageSize={true}
                        pageSizeOptions={[10, 20, 30, 40]}
                        className="bg-gray-50"
                    />
                )}
            </div>

            {/* Create */}
            <CreateBatchModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />

            {/* Update */}
            <UpdateBatchModal isOpen={showUpdateModal} onClose={handleUpdateCancel} onSuccess={handleUpdateSuccess} batchId={updateBatchId} batchData={editingBatch} />

            {/* Delete */}
            <DeleteModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} itemName={itemToDelete?.batchCode || ""} />
        </div>
    );
};

export default BatchList;