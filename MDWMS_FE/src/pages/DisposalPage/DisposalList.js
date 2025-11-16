import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import Pagination from "../../components/Common/Pagination";
import { STATUS_LABELS, DISPOSAL_REQUEST_STATUS } from "../../components/DisposalComponents/StatusDisplayDisposalRequest";
import DeleteModal from "../../components/Common/DeleteModal";
import { extractErrorMessage } from "../../utils/Validation";
import {
    deleteDisposalRequest,
    getDisposalRequestListSaleManager,
    getDisposalRequestListWarehouseManager,
    getDisposalRequestListWarehouseStaff
} from "../../services/DisposalService";
import { getUserDropDownByRoleName } from "../../services/AccountService";
import { PERMISSIONS } from "../../utils/permissions";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import DisposalTable from "../../components/DisposalComponents/DisposalTable";
import SaleOrderFilterToggle from "../../components/SaleOrderCompoents/SaleOrderFilterToggle";

const DisposalList = () => {
    const navigate = useNavigate();
    const { hasPermission, userRoles } = usePermissions();
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const [loading, setLoading] = useState(true);
    const [disposalRequests, setDisposalRequests] = useState([]);
    const [approvers, setApprovers] = useState([]);
    const [creators, setCreators] = useState([]);
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
    const [approverFilter, setApproverFilter] = useState("");
    const [showApproverFilter, setShowApproverFilter] = useState(false);
    const [sellerFilter, setSellerFilter] = useState("");
    const [showSellerFilter, setShowSellerFilter] = useState(false);
    const [assigneeFilter, setAssigneeFilter] = useState("");
    const [showAssigneeFilter, setShowAssigneeFilter] = useState(false);
    const [estimatedDateRangeFilter, setEstimatedDateRangeFilter] = useState({ fromEstimatedDate: '', toEstimatedDate: '' });
    const [showEstimatedDateRangeFilter, setShowEstimatedDateRangeFilter] = useState(false);
    const [hasInitialLoad, setHasInitialLoad] = useState(false);

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDisposalRequest, setSelectedDisposalRequest] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

        // Fetch creators (Warehouse Manager role)
        await fetchUsersByRole("Warehouse Manager", setCreators);

        // Fetch assignees (Warehouse Staff role)
        await fetchUsersByRole("Warehouse Staff", setAssignees);
    };

    const fetchDataWithParams = async (params) => {
        try {
            setLoading(true);

            // Chọn API dựa trên permissions của user
            let response;

            // Kiểm tra permissions để chọn API phù hợp
            if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM)) {
                response = await getDisposalRequestListSaleManager(params);
            } else if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM)) {
                // Warehouse Manager - có quyền xem yêu cầu xuất hủy cho quản lý kho
                response = await getDisposalRequestListWarehouseManager(params);
            } else if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS)) {
                // Warehouse Staff - có quyền xem yêu cầu xuất hủy được giao
                response = await getDisposalRequestListWarehouseStaff(params);
            } else {
                // Fallback - mặc định dùng API cho warehouse manager
                response = await getDisposalRequestListWarehouseManager(params);
            }

            if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
                setDisposalRequests(response.data.items);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.totalCount || 0,
                    current: response.data.pageNumber || 1
                }));
            } else {
                setDisposalRequests([]);
                setPagination(prev => ({ ...prev, total: 0, current: 1 }));
            }
        } catch (error) {
            setDisposalRequests([]);
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
            salesRepId: sellerFilter,
            createdBy: sellerFilter,
            approvalBy: approverFilter,
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
    const filteredDisposalRequests = disposalRequests;

    // Sort được xử lý ở backend, không cần sort ở frontend nữa
    const sortedDisposalRequests = filteredDisposalRequests;

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

    const handleViewClick = (request) => {
        navigate(`/disposal/${request.disposalRequestId}`);
    };

    const handleEditClick = (request) => {
        // Navigate to update page with request ID
        navigate(`/disposal/update/${request.disposalRequestId}`);
    };

    const handleDeleteClick = (request) => {
        setSelectedDisposalRequest(request);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDisposalRequest) return;

        setDeleteLoading(true);
        try {
            const requestId = selectedDisposalRequest.disposalRequestId;

            if (!requestId) {
                throw new Error("Không tìm thấy ID của yêu cầu xuất hủy");
            }

            await deleteDisposalRequest(requestId);
            if (window.showToast) {
                window.showToast("Xóa yêu cầu xuất hủy thành công!", "success");
            }

            // Close modal and refresh data
            setShowDeleteModal(false);
            setSelectedDisposalRequest(null);

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
        setSelectedDisposalRequest(null);
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
        setApproverFilter("");
        setSellerFilter("");
        setAssigneeFilter("");
        setEstimatedDateRangeFilter({ fromEstimatedDate: '', toEstimatedDate: '' });

        // Reset pagination về trang đầu
        setPagination(prev => ({ ...prev, current: 1 }));

        // Reset các show states về false
        setShowStatusFilter(false);
        setShowApproverFilter(false);
        setShowSellerFilter(false);
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
        // Mặc định hiển thị tất cả các nút filter
        const defaultConfig = {
            showApprover: true,
            showSeller: true,
            showAssignee: true,
            showEstimatedDateRange: true
        };

        if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM)) {
            // Sale Manager - ẩn Assignee (không có quyền giao việc)
            return {
                ...defaultConfig,
                showAssignee: false
            };
        } else if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM)) {
            return {
                ...defaultConfig,
            };
        } else if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS)) {
            // Warehouse Staff - filter cơ bản cho nhân viên kho
            return {
                ...defaultConfig,
                showApprover: false,
                showSeller: false,
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
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý yêu cầu xuất hủy</h1>
                        <p className="text-slate-600 mt-1">
                            Quản lý các yêu cầu xuất hủy trong hệ thống
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <PermissionWrapper requiredPermission={PERMISSIONS.DISPOSAL_REQUEST_CREATE}>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                                onClick={() => {
                                    navigate("/disposal/create");
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4 text-white" />
                                Tạo yêu cầu xuất hủy
                            </Button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
                    <SaleOrderFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo mã yêu cầu, người duyệt, người tạo..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: String(DISPOSAL_REQUEST_STATUS.Draft), label: STATUS_LABELS[DISPOSAL_REQUEST_STATUS.Draft] },
                            { value: String(DISPOSAL_REQUEST_STATUS.PendingApproval), label: STATUS_LABELS[DISPOSAL_REQUEST_STATUS.PendingApproval] },
                            { value: String(DISPOSAL_REQUEST_STATUS.Rejected), label: STATUS_LABELS[DISPOSAL_REQUEST_STATUS.Rejected] },
                            { value: String(DISPOSAL_REQUEST_STATUS.Approved), label: STATUS_LABELS[DISPOSAL_REQUEST_STATUS.Approved] },
                            { value: String(DISPOSAL_REQUEST_STATUS.AssignedForPicking), label: STATUS_LABELS[DISPOSAL_REQUEST_STATUS.AssignedForPicking] },
                            { value: String(DISPOSAL_REQUEST_STATUS.Picking), label: STATUS_LABELS[DISPOSAL_REQUEST_STATUS.Picking] },
                            { value: String(DISPOSAL_REQUEST_STATUS.Completed), label: STATUS_LABELS[DISPOSAL_REQUEST_STATUS.Completed] },
                        ]}
                        onStatusFilter={handleStatusFilter}
                        clearStatusFilter={clearStatusFilter}
                        // Retailer - không có cho Disposal
                        retailerFilter=""
                        setRetailerFilter={() => { }}
                        showRetailerFilter={false}
                        setShowRetailerFilter={() => { }}
                        retailers={[]}
                        onRetailerFilter={() => { }}
                        clearRetailerFilter={() => { }}
                        showRetailer={false}
                        // Approver
                        approverFilter={filterConfig.showApprover ? approverFilter : ""}
                        setApproverFilter={filterConfig.showApprover ? setApproverFilter : () => { }}
                        showApproverFilter={filterConfig.showApprover ? showApproverFilter : false}
                        setShowApproverFilter={filterConfig.showApprover ? setShowApproverFilter : () => { }}
                        approvers={filterConfig.showApprover ? approvers : []}
                        onApproverFilter={filterConfig.showApprover ? handleApproverFilter : () => { }}
                        clearApproverFilter={filterConfig.showApprover ? clearApproverFilter : () => { }}
                        showApprover={filterConfig.showApprover}
                        // Seller (người tạo)
                        sellerFilter={filterConfig.showSeller ? sellerFilter : ""}
                        setSellerFilter={filterConfig.showSeller ? setSellerFilter : () => { }}
                        showSellerFilter={filterConfig.showSeller ? showSellerFilter : false}
                        setShowSellerFilter={filterConfig.showSeller ? setShowSellerFilter : () => { }}
                        sellers={filterConfig.showSeller ? creators : []}
                        onSellerFilter={filterConfig.showSeller ? handleSellerFilter : () => { }}
                        clearSellerFilter={filterConfig.showSeller ? clearSellerFilter : () => { }}
                        showSeller={filterConfig.showSeller}
                        // Confirmer - không có cho Disposal
                        confirmerFilter=""
                        setConfirmerFilter={() => { }}
                        showConfirmerFilter={false}
                        setShowConfirmerFilter={() => { }}
                        confirmers={[]}
                        onConfirmerFilter={() => { }}
                        clearConfirmerFilter={() => { }}
                        showConfirmer={false}
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
                    <DisposalTable
                        disposalRequests={sortedDisposalRequests}
                        pagination={pagination}
                        sortField={sortField}
                        sortAscending={sortAscending}
                        onSort={handleSort}
                        onView={handleViewClick}
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
                    itemName="yêu cầu xuất hủy này"
                />
            </div>
        </div>
    );
}

export default DisposalList;
