import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import Pagination from "../../components/Common/Pagination";
import StocktakingFilterToggle from "../../components/StocktakingComponents/StocktakingFilterToggle";
import CancelStocktakingModal from "../../components/StocktakingComponents/CancelStocktakingModal";
import DeleteModal from "../../components/Common/DeleteModal";
import StocktakingTable from "./StocktakingTable";
import { extractErrorMessage } from "../../utils/Validation";
import { getStocktakingListForWarehouseManager, getStocktakingListForWarehouseStaff, getStocktakingListForSaleManager, cancelStocktaking, deleteStocktaking, inProgressStocktaking } from "../../services/StocktakingService";
import { PERMISSIONS, STOCKTAKING_STATUS } from "../../utils/permissions";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";

export default function StocktakingList() {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const [loading, setLoading] = useState(true);
    const [stocktakings, setStocktakings] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Filter states
    const [statusFilter, setStatusFilter] = useState("");
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);
    const [hasInitialLoad, setHasInitialLoad] = useState(false);

    // Cancel modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedStocktaking, setSelectedStocktaking] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch data from API
    const fetchDataWithParams = async (params) => {
        try {
            setLoading(true);

            // Chọn API dựa trên permissions của user
            let response;

            // Kiểm tra permissions để chọn API phù hợp
            // Thứ tự ưu tiên: WM > WS > SM
            if (hasPermission(PERMISSIONS.STOCKTAKING_VIEW_WM)) {
                // Warehouse Manager - có quyền xem tất cả phiếu kiểm kê
                response = await getStocktakingListForWarehouseManager(params);
            } else if (hasPermission(PERMISSIONS.STOCKTAKING_VIEW_WS)) {
                // Warehouse Staff - có quyền xem phiếu kiểm kê được giao
                response = await getStocktakingListForWarehouseStaff(params);
            } else if (hasPermission(PERMISSIONS.STOCKTAKING_VIEW_SM)) {
                // Sale Manager - có quyền xem phiếu kiểm kê
                response = await getStocktakingListForSaleManager(params);
            } else {
                // Fallback - mặc định dùng API cho Warehouse Manager
                response = await getStocktakingListForWarehouseManager(params);
            }

            // Handle different response structures
            let items = [];
            let totalCount = 0;
            let pageNumber = 1;

            if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
                // Structure: response.data.items (nested data)
                items = response.data.items;
                totalCount = response.data.totalCount || 0;
                pageNumber = response.data.pageNumber || 1;
            } else if (response && response.items && Array.isArray(response.items)) {
                // Structure: response.items (direct)
                items = response.items;
                totalCount = response.totalCount || 0;
                pageNumber = response.pageNumber || 1;
            } else if (response && Array.isArray(response)) {
                // Structure: response is array directly
                items = response;
                totalCount = response.length;
                pageNumber = 1;
            }

            setStocktakings(items);
            setPagination(prev => ({
                ...prev,
                total: totalCount,
                current: pageNumber
            }));
        } catch (error) {
            console.error("Error fetching stocktaking list:", error);
            setStocktakings([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    // Helper function để tạo request params
    const createRequestParams = (overrides = {}) => {
        return {
            pageNumber: pagination.current,
            pageSize: pagination.pageSize,
            search: searchQuery,
            sortField: sortField,
            sortAscending: sortAscending,
            filters: {
                ...(statusFilter && { status: statusFilter }),
                ...overrides.filters
            },
            ...overrides
        };
    };

    const fetchData = async () => {
        const requestParams = createRequestParams();
        return await fetchDataWithParams(requestParams);
    };

    // Initial load
    useEffect(() => {
        if (!hasInitialLoad) {
            fetchData();
            setHasInitialLoad(true);
        }
    }, [hasInitialLoad]);

    // Trigger search when search query changes (skip initial load)
    useEffect(() => {
        if (!hasInitialLoad) return;

        if (searchQuery.trim() || searchQuery === "") {
            // Reset về trang 1 khi search
            setPagination(prev => ({ ...prev, current: 1 }));
            const requestParams = createRequestParams({
                pageNumber: 1
            });
            fetchDataWithParams(requestParams);
        }
    }, [searchQuery]);

    // Sort được xử lý ở backend
    const sortedStocktakings = stocktakings;

    const handleSort = (field) => {
        let newSortAscending = true;

        if (sortField === field) {
            newSortAscending = !sortAscending;
        }

        setSortField(field);
        setSortAscending(newSortAscending);

        // Gọi API với sort mới
        const requestParams = createRequestParams({
            pageNumber: 1,
            sortField: field,
            sortAscending: newSortAscending
        });

        fetchDataWithParams(requestParams);
    };

    const handleViewClick = (stocktaking) => {
        // Navigate to detail page - cần cập nhật route sau
        navigate(`/stocktakings/${stocktaking.stocktakingSheetId}`);
    };

    const handleEditClick = (stocktaking) => {
        // Navigate to update page - cần cập nhật route sau
        navigate(`/stocktakings/update/${stocktaking.stocktakingSheetId}`);
    };

    const handleCancelClick = (stocktaking) => {
        setSelectedStocktaking(stocktaking);
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async () => {
        if (!selectedStocktaking) return;

        setCancelLoading(true);
        try {
            await cancelStocktaking(selectedStocktaking.stocktakingSheetId);

            if (window.showToast) {
                window.showToast("Hủy phiếu kiểm kê thành công!", "success");
            }

            setShowCancelModal(false);
            setSelectedStocktaking(null);
            fetchData();
        } catch (error) {
            console.error("Error cancelling stocktaking:", error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setCancelLoading(false);
        }
    };

    const handleCancelModalClose = () => {
        setShowCancelModal(false);
        setSelectedStocktaking(null);
    };

    const handleDeleteClick = (stocktaking) => {
        setSelectedStocktaking(stocktaking);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedStocktaking) return;

        setDeleteLoading(true);
        try {
            await deleteStocktaking(selectedStocktaking.stocktakingSheetId);

            if (window.showToast) {
                window.showToast("Xóa phiếu kiểm kê thành công!", "success");
            }

            setShowDeleteModal(false);
            setSelectedStocktaking(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting stocktaking:", error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || "Có lỗi xảy ra khi xóa phiếu kiểm kê", "error");
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
        setSelectedStocktaking(null);
    };

    const handleStartStocktaking = async (stocktaking) => {
        try {
            // Nếu status là Assigned (2), gọi API inProgressStocktaking trước
            if (stocktaking.status === STOCKTAKING_STATUS.Assigned || 
                stocktaking.status === 2 || 
                stocktaking.status === '2') {
                await inProgressStocktaking({ stocktakingSheetId: stocktaking.stocktakingSheetId });
                
                if (window.showToast) {
                    window.showToast("Bắt đầu kiểm kê thành công!", "success");
                }
            }
            
            // Navigate đến màn hình StocktakingArea
            navigate(`/stocktaking-area/${stocktaking.stocktakingSheetId}`);
        } catch (error) {
            console.error("Error starting stocktaking:", error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || "Có lỗi xảy ra khi bắt đầu kiểm kê", "error");
            }
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current: newPage }));

        const requestParams = createRequestParams({
            pageNumber: newPage
        });

        fetchDataWithParams(requestParams);
    };

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));

        const requestParams = createRequestParams({
            pageNumber: 1,
            pageSize: newPageSize
        });

        fetchDataWithParams(requestParams);
    };

    // Filter handlers
    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        setShowStatusFilter(false);

        const requestParams = createRequestParams({
            pageNumber: 1,
            filters: {
                ...(value && { status: value })
            }
        });

        fetchDataWithParams(requestParams);
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        setPagination(prev => ({ ...prev, current: 1 }));

        const requestParams = createRequestParams({
            pageNumber: 1,
            filters: {}
        });

        fetchDataWithParams(requestParams);
    };

    const clearAllFilters = () => {
        setSearchQuery("");
        setStatusFilter("");
        setPagination(prev => ({ ...prev, current: 1 }));
        setShowStatusFilter(false);

        const emptyParams = {
            pageNumber: 1,
            pageSize: pagination.pageSize,
            search: "",
            sortField: "",
            sortAscending: true,
            filters: {}
        };

        setTimeout(() => {
            fetchDataWithParams(emptyParams);
            setHasInitialLoad(true);
        }, 50);
    };

    const handleRefresh = () => {
        fetchData();
    };

    const handlePageSizeChangeFilter = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
        setShowPageSizeFilter(false);
        fetchData();
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý phiếu kiểm kê</h1>
                        <p className="text-slate-600 mt-1">
                            Quản lý các phiếu kiểm kê trong hệ thống
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_CREATE}>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                                onClick={() => {
                                    navigate("/stocktaking/create");
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4 text-white" />
                                Tạo phiếu kiểm kê
                            </Button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
                    <StocktakingFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm phiếu kiểm kê..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: STOCKTAKING_STATUS.Draft.toString(), label: "Nháp" },
                            { value: STOCKTAKING_STATUS.Assigned.toString(), label: "Đã phân công" },
                            { value: STOCKTAKING_STATUS.Cancelled.toString(), label: "Đã huỷ" },
                            { value: STOCKTAKING_STATUS.InProgress.toString(), label: "Đang kiểm kê" },
                            { value: STOCKTAKING_STATUS.PendingApproval.toString(), label: "Chờ duyệt" },
                            { value: STOCKTAKING_STATUS.Approved.toString(), label: "Đã duyệt" },
                            { value: STOCKTAKING_STATUS.Completed.toString(), label: "Đã hoàn thành" }
                        ]}
                        onStatusFilter={handleStatusFilter}
                        clearStatusFilter={clearStatusFilter}
                        onClearAll={clearAllFilters}
                        showClearButton={true}
                        onRefresh={handleRefresh}
                        showRefreshButton={true}
                        pageSize={pagination.pageSize}
                        setPageSize={setPagination}
                        showPageSizeFilter={showPageSizeFilter}
                        setShowPageSizeFilter={setShowPageSizeFilter}
                        pageSizeOptions={[10, 20, 30, 40]}
                        onPageSizeChange={handlePageSizeChangeFilter}
                        showPageSizeButton={true}
                    />

                    {/* Table */}
                    <StocktakingTable
                        stocktakings={sortedStocktakings}
                        pagination={pagination}
                        sortField={sortField}
                        sortAscending={sortAscending}
                        onSort={handleSort}
                        onView={handleViewClick}
                        onEdit={handleEditClick}
                        onCancel={handleCancelClick}
                        onDelete={handleDeleteClick}
                        onStartStocktaking={handleStartStocktaking}
                        onClearFilters={clearAllFilters}
                        loading={loading}
                    />
                </Card>

                {/* Pagination */}
                {!loading && pagination.total > 0 && (
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

                {/* Cancel Confirmation Modal */}
                <CancelStocktakingModal
                    isOpen={showCancelModal}
                    onClose={handleCancelModalClose}
                    onConfirm={handleCancelConfirm}
                    stocktakingSheetId={selectedStocktaking?.stocktakingSheetId || ''}
                />

                {/* Delete Confirmation Modal */}
                <DeleteModal
                    isOpen={showDeleteModal}
                    onClose={handleDeleteModalClose}
                    onConfirm={handleDeleteConfirm}
                    itemName={"phiếu kiểm kê này"}
                />
            </div>
        </div>
    );
}
