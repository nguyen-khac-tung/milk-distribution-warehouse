import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import Pagination from "../../components/Common/Pagination";
import { STATUS_LABELS, SALE_ORDER_STATUS } from "../../components/SaleOrderCompoents/StatusDisplaySaleOrder";
import DeleteModal from "../../components/Common/DeleteModal";
import { extractErrorMessage } from "../../utils/Validation";
import { deleteSaleOrder, getSalesOrderListSaleManager, getSalesOrderListSalesRepresentatives, getSalesOrderListWarehouseManager, getSalesOrderListWarehouseStaff, getSalesOrderDetail } from "../../services/SalesOrderService";
import { getAllRetailersDropdown } from "../../services/RetailerService";
import { getUserDropDownByRoleName } from "../../services/AccountService";
import { PERMISSIONS } from "../../utils/permissions";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import SalesOrderTable from "./SalesOrderTable";
import SaleOrderFilterToggle from "../../components/SaleOrderCompoents/SaleOrderFilterToggle";

const SalesOrderList = () => {
    const navigate = useNavigate();
    const { hasPermission, userRoles } = usePermissions();
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saleOrders, setsaleOrders] = useState([]);
    const [retailers, setRetailers] = useState([]);
    const [approvers, setApprovers] = useState([]);
    const [creators, setCreators] = useState([]);
    const [confirmers, setConfirmers] = useState([]);
    const [assignees, setAssignees] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Search
    const [searchQuery, setSearchQuery] = useState("");

    // Filter states
    const [statusFilter, setStatusFilter] = useState("");
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);

    // New filter states
    const [retailerFilter, setRetailerFilter] = useState("");
    const [showRetailerFilter, setShowRetailerFilter] = useState(false);
    const [approverFilter, setApproverFilter] = useState("");
    const [showApproverFilter, setShowApproverFilter] = useState(false);
    const [sellerFilter, setSellerFilter] = useState("");
    const [showSellerFilter, setShowSellerFilter] = useState(false);
    const [confirmerFilter, setConfirmerFilter] = useState("");
    const [showConfirmerFilter, setShowConfirmerFilter] = useState(false);
    const [assigneeFilter, setAssigneeFilter] = useState("");
    const [showAssigneeFilter, setShowAssigneeFilter] = useState(false);
    const [estimatedDateRangeFilter, setEstimatedDateRangeFilter] = useState({ fromEstimatedDate: '', toEstimatedDate: '' });
    const [showEstimatedDateRangeFilter, setShowEstimatedDateRangeFilter] = useState(false);
    const [hasInitialLoad, setHasInitialLoad] = useState(false);
    const [apiCallCount, setApiCallCount] = useState(0);

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch data from API
    const fetchRetailers = async () => {
        try {
            const response = await getAllRetailersDropdown();
            if (response && response.data && Array.isArray(response.data)) {
                setRetailers(response.data);
            }
        } catch (error) {
            // Error handled silently
        }
    };

    // Fetch users by role name
    const fetchUsersByRole = async (roleName, setter) => {
        try {
            const response = await getUserDropDownByRoleName(roleName);
            if (response && response.data && Array.isArray(response.data)) {
                setter(response.data);
            }
        } catch (error) {
            setter([]);
        }
    };

    // Fetch all users for filters
    const fetchAllUsers = async () => {
        // Fetch approvers (Sale Manager role)
        await fetchUsersByRole("Sale Manager", setApprovers);

        // Fetch creators/sellers (Sales Representative role)
        await fetchUsersByRole("Sales Representative", setCreators);

        // Fetch confirmers (Warehouse Manager role)
        await fetchUsersByRole("Warehouse Manager", setConfirmers);

        // Fetch assignees (Warehouse Staff role)
        await fetchUsersByRole("Warehouse Staff", setAssignees);
    };

    const fetchDataWithParams = async (params) => {
        try {
            setLoading(true);

            // Chọn API dựa trên permissions của user
            let response;

            // Kiểm tra permissions để chọn API phù hợp
            if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SM)) {
                response = await getSalesOrderListSaleManager(params);
            } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WM)) {
                // Warehouse Manager - có quyền xem đơn hàng cho quản lý kho
                response = await getSalesOrderListWarehouseManager(params);
            } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WS)) {
                // Warehouse Staff - có quyền xem đơn hàng được giao
                response = await getSalesOrderListWarehouseStaff(params);
            } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SR)) {
                // Sales Representative - chỉ xem đơn hàng của mình
                response = await getSalesOrderListSalesRepresentatives(params);
            } else {
                // Fallback - mặc định dùng API cho representatives
                response = await getSalesOrderListSalesRepresentatives(params);
            }

            if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
                setsaleOrders(response.data.items);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.totalCount || 0,
                    current: response.data.pageNumber || 1
                }));
            } else {
                setsaleOrders([]);
                setPagination(prev => ({ ...prev, total: 0, current: 1 }));
            }
        } catch (error) {
            setsaleOrders([]);
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
            status: statusFilter,
            retailerId: retailerFilter,
            salesRepId: sellerFilter,
            createdBy: sellerFilter,
            approvalBy: approverFilter,
            acknowledgedBy: confirmerFilter,
            assignTo: assigneeFilter,
            fromEstimatedDate: estimatedDateRangeFilter.fromEstimatedDate,
            toEstimatedDate: estimatedDateRangeFilter.toEstimatedDate,
            ...overrides
        };
    };

    const fetchData = async () => {
        const requestParams = createRequestParams();

        return await fetchDataWithParams(requestParams);
    };

    // Initial load
    useEffect(() => {
        fetchRetailers();
        fetchAllUsers();
        if (!hasInitialLoad) {
            fetchData();
            setHasInitialLoad(true);
        }
    }, [hasInitialLoad]);

    // Trigger search when search query changes (skip initial load)
    useEffect(() => {
        // Chỉ gọi API sau khi đã load dữ liệu ban đầu
        if (!hasInitialLoad) return;

        // Chỉ gọi fetchData() khi có search query thực sự active
        if (searchQuery.trim()) {
            fetchData();
        }
    }, [hasInitialLoad, searchQuery]);

    // Filter được xử lý ở backend, không cần filter ở frontend nữa
    const filteredSaleOrders = saleOrders;

    // Sort được xử lý ở backend, không cần sort ở frontend nữa
    const sortedSaleOrders = filteredSaleOrders;



    const handleSort = (field) => {
        let newSortAscending = true;

        if (sortField === field) {
            newSortAscending = !sortAscending;
        }

        setSortField(field);
        setSortAscending(newSortAscending);

        const requestParams = createRequestParams({
            pageNumber: 1,
            sortField: field,
            sortAscending: newSortAscending
        });

        fetchDataWithParams(requestParams);
    };

    const handleViewClick = (order) => {
        navigate(`/sales-orders/${order.salesOrderId}`);
    };

    const handleEditClick = (order) => {
        // Navigate to update page with order ID
        navigate(`/sales-orders/update/${order.salesOrderId}`);
    };

    const handleDeleteClick = (order) => {
        setSelectedPurchaseOrder(order);
        setShowDeleteModal(true);
    };

    const handleGoodsIssueNoteDetailClick = async (order) => {
        try {
            navigate(`/goods-issue-note-detail/${order.salesOrderId}`);
        } catch (error) {
            if (window.showToast) {
                window.showToast("Không thể mở phiếu xuất kho", "error");
            }
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPurchaseOrder) return;

        setDeleteLoading(true);
        try {
            const orderId = selectedPurchaseOrder.salesOrderId;

            if (!orderId) {
                throw new Error("Không tìm thấy ID của đơn bán hàng");
            }

            await deleteSaleOrder(orderId);
            if (window.showToast) {
                window.showToast("Xóa đơn bán hàng thành công!", "success");
            }

            // Close modal and refresh data
            setShowDeleteModal(false);
            setSelectedPurchaseOrder(null);

            // Refresh the list
            fetchData();

        } catch (error) {
            // Extract error message from backend using utility function
            const errorMessage = extractErrorMessage(error);

            // Show specific error message
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedPurchaseOrder(null);
    };

    const handlePageChange = (newPage) => {
        // Update pagination state first
        setPagination(prev => ({ ...prev, current: newPage }));

        const requestParams = createRequestParams({
            pageNumber: newPage
        });

        fetchDataWithParams(requestParams);
    };

    const handlePageSizeChange = (newPageSize) => {
        // Update pagination state first
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));

        // Call fetchData with the new page size directly
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

        // Gọi API với giá trị mới ngay lập tức
        const requestParams = createRequestParams({
            pageNumber: 1,
            status: value
        });

        fetchDataWithParams(requestParams);
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        setPagination(prev => ({ ...prev, current: 1 }));

        // Gọi API khi clear filter
        const requestParams = createRequestParams({
            pageNumber: 1,
            status: ""
        });

        fetchDataWithParams(requestParams);
    };

    const clearAllFilters = () => {

        // Reset tất cả filters về giá trị mặc định
        setSearchQuery("");
        setStatusFilter("");
        setRetailerFilter("");
        setApproverFilter("");
        setSellerFilter("");
        setConfirmerFilter("");
        setAssigneeFilter("");
        setEstimatedDateRangeFilter({ fromEstimatedDate: '', toEstimatedDate: '' });

        // Reset pagination về trang đầu
        setPagination(prev => ({ ...prev, current: 1 }));

        // Reset các show states về false
        setShowStatusFilter(false);
        setShowRetailerFilter(false);
        setShowApproverFilter(false);
        setShowSellerFilter(false);
        setShowConfirmerFilter(false);
        setShowAssigneeFilter(false);
        setShowEstimatedDateRangeFilter(false);

        // Reset hasInitialLoad để load lại dữ liệu ban đầu
        setHasInitialLoad(false);

        // Gọi fetchData() với params rỗng để đảm bảo load tất cả dữ liệu
        const emptyParams = {
            pageNumber: 1,
            pageSize: pagination.pageSize,
            search: "",
            sortField: sortField,
            sortAscending: sortAscending,
            status: "",
            retailerId: "",
            salesRepId: "",
            createdBy: "",
            approvedBy: "",
            assignedTo: "",
            fromEstimatedDate: "",
            toEstimatedDate: ""
        };

        // Gọi API trực tiếp với params rỗng
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

    // New filter handlers
    const handleRetailerFilter = (value) => {
        setRetailerFilter(value);
        setShowRetailerFilter(false);

        const requestParams = createRequestParams({
            pageNumber: 1,
            retailerId: value
        });

        fetchDataWithParams(requestParams);
    };

    const clearRetailerFilter = () => {
        setRetailerFilter("");
        setPagination(prev => ({ ...prev, current: 1 }));

        const requestParams = createRequestParams({
            pageNumber: 1,
            retailerId: ""
        });
        fetchDataWithParams(requestParams);
    };

    const handleApproverFilter = (value) => {
        setApproverFilter(value);
        setShowApproverFilter(false);

        const requestParams = createRequestParams({
            pageNumber: 1,
            approvalBy: value
        });
        fetchDataWithParams(requestParams);
    };

    const clearApproverFilter = () => {
        setApproverFilter("");
        setPagination(prev => ({ ...prev, current: 1 }));

        const requestParams = createRequestParams({
            pageNumber: 1,
            approvalBy: ""
        });
        fetchDataWithParams(requestParams);
    };

    const handleSellerFilter = (value) => {
        setSellerFilter(value);
        setShowSellerFilter(false);

        const requestParams = createRequestParams({
            pageNumber: 1,
            salesRepId: value,
            createdBy: value
        });
        fetchDataWithParams(requestParams);
    };

    const clearSellerFilter = () => {
        setSellerFilter("");
        setPagination(prev => ({ ...prev, current: 1 }));

        const requestParams = createRequestParams({
            pageNumber: 1,
            salesRepId: "",
            createdBy: ""
        });
        fetchDataWithParams(requestParams);
    };

    const handleConfirmerFilter = (value) => {
        setConfirmerFilter(value);
        setShowConfirmerFilter(false);

        const requestParams = createRequestParams({
            pageNumber: 1,
            acknowledgedBy: value
        });
        fetchDataWithParams(requestParams);
    };

    const clearConfirmerFilter = () => {
        setConfirmerFilter("");
        setPagination(prev => ({ ...prev, current: 1 }));

        const requestParams = createRequestParams({
            pageNumber: 1,
            acknowledgedBy: ""
        });
        fetchDataWithParams(requestParams);
    };

    const handleAssigneeFilter = (value) => {
        setAssigneeFilter(value);
        setShowAssigneeFilter(false);

        const requestParams = createRequestParams({
            pageNumber: 1,
            assignTo: value
        });
        fetchDataWithParams(requestParams);
    };

    const clearAssigneeFilter = () => {
        setAssigneeFilter("");
        setPagination(prev => ({ ...prev, current: 1 }));

        const requestParams = createRequestParams({
            pageNumber: 1,
            assignTo: ""
        });
        fetchDataWithParams(requestParams);
    };


    const handleEstimatedDateRangeFilter = (value) => {
        setEstimatedDateRangeFilter(value);
    };

    const applyEstimatedDateRangeFilter = () => {

        const requestParams = createRequestParams({
            pageNumber: 1,
            fromEstimatedDate: estimatedDateRangeFilter.fromEstimatedDate,
            toEstimatedDate: estimatedDateRangeFilter.toEstimatedDate
        });
        fetchDataWithParams(requestParams);
    };

    const clearEstimatedDateRangeFilter = () => {
        setEstimatedDateRangeFilter({ fromEstimatedDate: '', toEstimatedDate: '' });
        setPagination(prev => ({ ...prev, current: 1 }));

        const requestParams = createRequestParams({
            pageNumber: 1,
            fromEstimatedDate: "",
            toEstimatedDate: ""
        });
        fetchDataWithParams(requestParams);
    };


    // Logic để hiển thị filter dựa trên role
    const getFilterConfig = () => {
        // Mặc định hiển thị tất cả 6 nút filter
        const defaultConfig = {
            showRetailer: true,
            showApprover: true,
            showSeller: true,
            showConfirmer: true,
            showAssignee: true,
            showEstimatedDateRange: true
        };

        if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SM)) {
            // Sales Manager - ẩn Assignee (không có quyền giao việc)
            return {
                ...defaultConfig,
                showAssignee: false
            };
        } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WM)) {
            return {
                ...defaultConfig,
            };
        } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WS)) {
            // Warehouse Staff - filter cơ bản cho nhân viên kho
            return {
                ...defaultConfig,
                showApprover: false,
                showSeller: false,
            };
        } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SR)) {
            // Sales Representative - filter cơ bản
            return {
                ...defaultConfig,
                showConfirmer: false,
                showAssignee: false
            };
        }

        return defaultConfig;
    };

    const filterConfig = getFilterConfig();

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý đơn bán hàng</h1>
                        <p className="text-slate-600 mt-1">
                            Quản lý các đơn bán hàng trong hệ thống
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <PermissionWrapper requiredPermission={PERMISSIONS.SALES_ORDER_CREATE}>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                                onClick={() => {
                                    navigate("/sales-orders/create");
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4 text-white" />
                                Tạo đơn bán hàng
                            </Button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
                    <SaleOrderFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo nhà bán lẻ, người duyệt, người tạo..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái đơn" },
                            { value: String(SALE_ORDER_STATUS.Draft), label: STATUS_LABELS[SALE_ORDER_STATUS.Draft] },
                            { value: String(SALE_ORDER_STATUS.PendingApproval), label: STATUS_LABELS[SALE_ORDER_STATUS.PendingApproval] },
                            { value: String(SALE_ORDER_STATUS.Rejected), label: STATUS_LABELS[SALE_ORDER_STATUS.Rejected] },
                            { value: String(SALE_ORDER_STATUS.Approved), label: STATUS_LABELS[SALE_ORDER_STATUS.Approved] },
                            { value: String(SALE_ORDER_STATUS.AssignedForPicking), label: STATUS_LABELS[SALE_ORDER_STATUS.AssignedForPicking] },
                            { value: String(SALE_ORDER_STATUS.Picking), label: STATUS_LABELS[SALE_ORDER_STATUS.Picking] },
                            { value: String(SALE_ORDER_STATUS.Completed), label: STATUS_LABELS[SALE_ORDER_STATUS.Completed] },
                        ]}
                        onStatusFilter={handleStatusFilter}
                        clearStatusFilter={clearStatusFilter}
                        // Retailer
                        retailerFilter={filterConfig.showRetailer ? retailerFilter : ""}
                        setRetailerFilter={filterConfig.showRetailer ? setRetailerFilter : () => { }}
                        showRetailerFilter={filterConfig.showRetailer ? showRetailerFilter : false}
                        setShowRetailerFilter={filterConfig.showRetailer ? setShowRetailerFilter : () => { }}
                        retailers={retailers}
                        onRetailerFilter={filterConfig.showRetailer ? handleRetailerFilter : () => { }}
                        clearRetailerFilter={filterConfig.showRetailer ? clearRetailerFilter : () => { }}
                        showRetailer={filterConfig.showRetailer}
                        // Approver
                        approverFilter={filterConfig.showApprover ? approverFilter : ""}
                        setApproverFilter={filterConfig.showApprover ? setApproverFilter : () => { }}
                        showApproverFilter={filterConfig.showApprover ? showApproverFilter : false}
                        setShowApproverFilter={filterConfig.showApprover ? setShowApproverFilter : () => { }}
                        approvers={filterConfig.showApprover ? approvers : []}
                        onApproverFilter={filterConfig.showApprover ? handleApproverFilter : () => { }}
                        clearApproverFilter={filterConfig.showApprover ? clearApproverFilter : () => { }}
                        showApprover={filterConfig.showApprover}
                        // Seller
                        sellerFilter={filterConfig.showSeller ? sellerFilter : ""}
                        setSellerFilter={filterConfig.showSeller ? setSellerFilter : () => { }}
                        showSellerFilter={filterConfig.showSeller ? showSellerFilter : false}
                        setShowSellerFilter={filterConfig.showSeller ? setShowSellerFilter : () => { }}
                        sellers={filterConfig.showSeller ? creators : []}
                        onSellerFilter={filterConfig.showSeller ? handleSellerFilter : () => { }}
                        clearSellerFilter={filterConfig.showSeller ? clearSellerFilter : () => { }}
                        showSeller={filterConfig.showSeller}
                        // Confirmer
                        confirmerFilter={filterConfig.showConfirmer ? confirmerFilter : ""}
                        setConfirmerFilter={filterConfig.showConfirmer ? setConfirmerFilter : () => { }}
                        showConfirmerFilter={filterConfig.showConfirmer ? showConfirmerFilter : false}
                        setShowConfirmerFilter={filterConfig.showConfirmer ? setShowConfirmerFilter : () => { }}
                        confirmers={filterConfig.showConfirmer ? confirmers : []}
                        onConfirmerFilter={filterConfig.showConfirmer ? handleConfirmerFilter : () => { }}
                        clearConfirmerFilter={filterConfig.showConfirmer ? clearConfirmerFilter : () => { }}
                        showConfirmer={filterConfig.showConfirmer}
                        // Assignee
                        assigneeFilter={filterConfig.showAssignee ? assigneeFilter : ""}
                        setAssigneeFilter={filterConfig.showAssignee ? setAssigneeFilter : () => { }}
                        showAssigneeFilter={filterConfig.showAssignee ? showAssigneeFilter : false}
                        setShowAssigneeFilter={filterConfig.showAssignee ? setShowAssigneeFilter : () => { }}
                        assignees={filterConfig.showAssignee ? assignees : []}
                        onAssigneeFilter={filterConfig.showAssignee ? handleAssigneeFilter : () => { }}
                        clearAssigneeFilter={filterConfig.showAssignee ? clearAssigneeFilter : () => { }}
                        showAssignee={filterConfig.showAssignee}
                        // Estimated Date Range
                        estimatedDateRangeFilter={estimatedDateRangeFilter}
                        setEstimatedDateRangeFilter={setEstimatedDateRangeFilter}
                        showEstimatedDateRangeFilter={showEstimatedDateRangeFilter}
                        setShowEstimatedDateRangeFilter={setShowEstimatedDateRangeFilter}
                        onEstimatedDateRangeFilter={handleEstimatedDateRangeFilter}
                        applyEstimatedDateRangeFilter={applyEstimatedDateRangeFilter}
                        clearEstimatedDateRangeFilter={clearEstimatedDateRangeFilter}
                        onClearAll={clearAllFilters}
                        showClearButton={true}
                        onRefresh={handleRefresh}
                        pageSize={pagination.pageSize}
                        setPageSize={setPagination}
                        showPageSizeFilter={showPageSizeFilter}
                        setShowPageSizeFilter={setShowPageSizeFilter}
                        pageSizeOptions={[10, 20, 30, 40]}
                        onPageSizeChange={handlePageSizeChangeFilter}
                        showPageSizeButton={true}
                    />

                    {/* Table */}
                    <SalesOrderTable
                        saleOrders={sortedSaleOrders}
                        pagination={pagination}
                        sortField={sortField}
                        sortAscending={sortAscending}
                        onSort={handleSort}
                        onView={handleViewClick}
                        onGoodsIssueNoteDetail={handleGoodsIssueNoteDetailClick}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
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

                {/* Delete Confirmation Modal */}
                <DeleteModal
                    isOpen={showDeleteModal}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    itemName="đơn bán hàng này"
                />
            </div>
        </div>
    );
}

export default SalesOrderList