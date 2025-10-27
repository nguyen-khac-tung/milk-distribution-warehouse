import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Plus, Edit, Trash2, Eye, ArrowUp, ArrowDown, ArrowUpDown, Package } from "lucide-react";
import Loading from "../../components/Common/Loading";
import EmptyState from "../../components/Common/EmptyState";
import Pagination from "../../components/Common/Pagination";
import PurchaseOrderFilterToggle from "../../components/PurchaseOrderComponents/PurchaseOrderFilterToggle";
import PurchaseOrderStatsChart from "../../components/PurchaseOrderComponents/PurchaseOrderStatsChart";
import StatusDisplay, { STATUS_LABELS } from "../../components/PurchaseOrderComponents/StatusDisplay";
import { PURCHASE_ORDER_STATUS } from "../../utils/permissions";
import PurchaseOrderTable from "./PurchaseOrderTable";
import DeleteModal from "../../components/Common/DeleteModal";
import { extractErrorMessage } from "../../utils/Validation";
import { getPurchaseOrderSaleRepresentatives, getPurchaseOrderSaleManagers, getPurchaseOrderWarehouseManagers, getPurchaseOrderWarehouseStaff, deletePurchaseOrder } from "../../services/PurchaseOrderService";
import { getSuppliersDropdown } from "../../services/SupplierService";
import { getUserDropDownByRoleName } from "../../services/AccountService";
import { PERMISSIONS } from "../../utils/permissions";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";


export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const { hasPermission, userRoles } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortAscending, setSortAscending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [creators, setCreators] = useState([]);
  const [confirmers, setConfirmers] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showPageSizeFilter, setShowPageSizeFilter] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New filter states
  const [supplierFilter, setSupplierFilter] = useState("");
  const [showSupplierFilter, setShowSupplierFilter] = useState(false);
  const [approverFilter, setApproverFilter] = useState("");
  const [showApproverFilter, setShowApproverFilter] = useState(false);
  const [creatorFilter, setCreatorFilter] = useState("");
  const [showCreatorFilter, setShowCreatorFilter] = useState(false);
  const [confirmerFilter, setConfirmerFilter] = useState("");
  const [showConfirmerFilter, setShowConfirmerFilter] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [showAssigneeFilter, setShowAssigneeFilter] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState({ fromDate: '', toDate: '' });
  const [showDateRangeFilter, setShowDateRangeFilter] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [apiCallCount, setApiCallCount] = useState(0);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch data from API
  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliersDropdown();
      if (response && response.data && Array.isArray(response.data)) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
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
      console.error(`Error fetching users for role ${roleName}:`, error);
      setter([]);
    }
  };

  // Fetch all users for filters
  const fetchAllUsers = async () => {
    // Fetch approvers (Sales Manager role)
    await fetchUsersByRole("Sale Manager", setApprovers);

    // Fetch creators (Sales Representative role)
    await fetchUsersByRole("Sales Representative", setCreators);

    // Fetch confirmers (Warehouse Manager role)
    await fetchUsersByRole("Warehouse Manager", setConfirmers);

    // Fetch assignees (Warehouse Staff role)
    await fetchUsersByRole("Warehouse Staff", setAssignees);
  };

  const fetchDataWithParams = async (params) => {
    try {
      setLoading(true);

      // Đếm số lần gọi API
      setApiCallCount(prev => {
        const newCount = prev + 1;
        console.log(`=== API CALL #${newCount} ===`);
        console.log("API Call Count:", newCount);
        console.log("Params:", params);
        return newCount;
      });

      // Chọn API dựa trên permissions của user
      let response;

      // Kiểm tra permissions để chọn API phù hợp
      if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_SM)) {
        response = await getPurchaseOrderSaleManagers(params);
      } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM)) {
        // Warehouse Manager - có quyền xem đơn hàng cho quản lý kho
        response = await getPurchaseOrderWarehouseManagers(params);
      } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS)) {
        // Warehouse Staff - có quyền xem đơn hàng được giao
        response = await getPurchaseOrderWarehouseStaff(params);
      } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS)) {
        // Sales Representative - chỉ xem đơn hàng của mình
        response = await getPurchaseOrderSaleRepresentatives(params);
      } else {
        // Fallback - mặc định dùng API cho representatives
        response = await getPurchaseOrderSaleRepresentatives(params);
      }

      if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
        console.log("=== PAGINATION UPDATE ===");
        console.log("Total count:", response.data.totalCount);
        console.log("Page number:", response.data.pageNumber);
        console.log("Total pages:", response.data.totalPages);

        setPurchaseOrders(response.data.items);
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount || 0,
          current: response.data.pageNumber || 1
        }));
      } else {
        console.log("No valid data found");
        setPurchaseOrders([]);
        setPagination(prev => ({ ...prev, total: 0, current: 1 }));
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setPurchaseOrders([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Helper function để tạo request params
  const createRequestParams = (overrides = {}) => {
    // Format createdAt từ dateRangeFilter
    let createdAtFilter = "";
    if (dateRangeFilter.fromDate && dateRangeFilter.toDate) {
      createdAtFilter = `${dateRangeFilter.fromDate}~${dateRangeFilter.toDate}`;
    } else if (dateRangeFilter.fromDate) {
      createdAtFilter = `${dateRangeFilter.fromDate}~`;
    } else if (dateRangeFilter.toDate) {
      createdAtFilter = `~${dateRangeFilter.toDate}`;
    }

    return {
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
      search: searchQuery,
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter,
      supplierId: supplierFilter,
      approvalBy: approverFilter,
      createdBy: creatorFilter,
      arrivalConfirmedBy: confirmerFilter,
      assignTo: assigneeFilter,
      createdAt: createdAtFilter,
      ...overrides // Override với giá trị mới
    };
  };

  const fetchData = async () => {
    const requestParams = createRequestParams();

    // Log dữ liệu search được gửi từ frontend
    console.log("=== FRONTEND SEARCH PARAMS ===");
    console.log("Request Params:", requestParams);
    console.log("Search Query:", searchQuery);
    console.log("Status Filter:", statusFilter);
    console.log("Supplier Filter:", supplierFilter);
    console.log("Approver Filter:", approverFilter);
    console.log("Creator Filter:", creatorFilter);
    console.log("Confirmer Filter:", confirmerFilter);
    console.log("Assignee Filter:", assigneeFilter);
    console.log("Date Range Filter:", dateRangeFilter);
    console.log("Created At Filter:", requestParams.createdAt);
    console.log("Sort Field:", sortField);
    console.log("Sort Ascending:", sortAscending);
    console.log("===============================");

    return await fetchDataWithParams(requestParams);
  };

  // Initial load
  useEffect(() => {
    fetchSuppliers();
    fetchAllUsers();
    if (!hasInitialLoad) {
      console.log("=== INITIAL LOAD START ===");
      console.log("API Call Count before initial load:", apiCallCount);
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
      console.log("=== SEARCH CHANGE DETECTED ===");
      console.log("API Call Count before search:", apiCallCount);
      fetchData();
    }
  }, [hasInitialLoad, searchQuery]);

  // Filter được xử lý ở backend, không cần filter ở frontend nữa
  const filteredPurchaseOrders = purchaseOrders;

  // Sort được xử lý ở backend, không cần sort ở frontend nữa
  const sortedPurchaseOrders = filteredPurchaseOrders;



  const handleSort = (field) => {
    let newSortAscending = true;

    if (sortField === field) {
      newSortAscending = !sortAscending;
    }

    setSortField(field);
    setSortAscending(newSortAscending);

    // Gọi API với sort mới
    const requestParams = createRequestParams({
      pageNumber: 1, // Reset về trang 1 khi sort
      sortField: field,
      sortAscending: newSortAscending
    });

    fetchDataWithParams(requestParams);
  };

  const handleViewClick = (order) => {
    navigate(`/purchase-orders/${order.purchaseOderId}`);
  };

  const handleEditClick = (order) => {
    // Navigate to update page with order ID
    navigate(`/purchase-orders/update/${order.purchaseOderId}`);
  };

  const handleDeleteClick = (order) => {
    setSelectedPurchaseOrder(order);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPurchaseOrder) return;

    console.log("=== DELETE CONFIRM ===");
    console.log("Selected purchase order:", selectedPurchaseOrder);
    console.log("All keys:", Object.keys(selectedPurchaseOrder));

    setDeleteLoading(true);
    try {
      const orderId = selectedPurchaseOrder.purchaseOderId;

      if (!orderId) {
        console.error("No valid ID found. Available fields:", Object.keys(selectedPurchaseOrder));
        throw new Error("Không tìm thấy ID của đơn nhập");
      }

      await deletePurchaseOrder(orderId);

      // Show success message
      if (window.showToast) {
        window.showToast("Xóa đơn nhập thành công!", "success");
      }

      // Close modal and refresh data
      setShowDeleteModal(false);
      setSelectedPurchaseOrder(null);

      // Refresh the list
      fetchData();

    } catch (error) {
      console.error("Error deleting purchase order:", error);

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

    // Format createdAt từ dateRangeFilter
    let createdAtFilter = "";
    if (dateRangeFilter.fromDate && dateRangeFilter.toDate) {
      createdAtFilter = `${dateRangeFilter.fromDate}~${dateRangeFilter.toDate}`;
    } else if (dateRangeFilter.fromDate) {
      createdAtFilter = `${dateRangeFilter.fromDate}~`;
    } else if (dateRangeFilter.toDate) {
      createdAtFilter = `~${dateRangeFilter.toDate}`;
    }

    // Call fetchData with the new page number directly
    const requestParams = {
      pageNumber: newPage, // Use the new page directly
      pageSize: pagination.pageSize,
      search: searchQuery,
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter,
      supplierId: supplierFilter,
      approvalBy: approverFilter,
      createdBy: creatorFilter,
      arrivalConfirmedBy: confirmerFilter,
      assignTo: assigneeFilter,
      createdAt: createdAtFilter
    };

    fetchDataWithParams(requestParams);
  };

  const handlePageSizeChange = (newPageSize) => {
    // Update pagination state first
    setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));

    // Format createdAt từ dateRangeFilter
    let createdAtFilter = "";
    if (dateRangeFilter.fromDate && dateRangeFilter.toDate) {
      createdAtFilter = `${dateRangeFilter.fromDate}~${dateRangeFilter.toDate}`;
    } else if (dateRangeFilter.fromDate) {
      createdAtFilter = `${dateRangeFilter.fromDate}~`;
    } else if (dateRangeFilter.toDate) {
      createdAtFilter = `~${dateRangeFilter.toDate}`;
    }

    // Call fetchData with the new page size directly
    const requestParams = {
      pageNumber: 1, // Reset to page 1 when changing page size
      pageSize: newPageSize,
      search: searchQuery,
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter,
      supplierId: supplierFilter,
      approvalBy: approverFilter,
      createdBy: creatorFilter,
      arrivalConfirmedBy: confirmerFilter,
      assignTo: assigneeFilter,
      createdAt: createdAtFilter
    };

    fetchDataWithParams(requestParams);
  };

  // Filter handlers
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setShowStatusFilter(false);

    // Gọi API với giá trị mới ngay lập tức
    const requestParams = createRequestParams({
      pageNumber: 1, // Reset về trang 1
      status: value // Sử dụng giá trị mới
    });

    fetchDataWithParams(requestParams);
  };

  const clearStatusFilter = () => {
    setStatusFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));

    // Gọi API khi clear filter
    const requestParams = createRequestParams({
      pageNumber: 1,
      status: "" // Clear status filter
    });

    fetchDataWithParams(requestParams);
  };

  const clearAllFilters = () => {
    console.log("=== CLEAR ALL FILTERS ===");
    console.log("API Call Count before clear:", apiCallCount);

    // Reset tất cả filters về giá trị mặc định
    setSearchQuery("");
    setStatusFilter("");
    setSupplierFilter("");
    setApproverFilter("");
    setCreatorFilter("");
    setConfirmerFilter("");
    setAssigneeFilter("");
    setDateRangeFilter({ fromDate: '', toDate: '' });

    // Reset pagination về trang đầu
    setPagination(prev => ({ ...prev, current: 1 }));

    // Reset các show states về false
    setShowStatusFilter(false);
    setShowSupplierFilter(false);
    setShowApproverFilter(false);
    setShowCreatorFilter(false);
    setShowConfirmerFilter(false);
    setShowAssigneeFilter(false);
    setShowDateRangeFilter(false);

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
      supplierId: "",
      approvalBy: "",
      createdBy: "",
      arrivalConfirmedBy: "",
      assignTo: "",
      createdAt: ""
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
  const handleSupplierFilter = (value) => {
    setSupplierFilter(value);
    setShowSupplierFilter(false);

    const requestParams = createRequestParams({
      pageNumber: 1,
      supplierId: value
    });
    fetchDataWithParams(requestParams);
  };

  const clearSupplierFilter = () => {
    setSupplierFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));

    const requestParams = createRequestParams({
      pageNumber: 1,
      supplierId: ""
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

  const handleCreatorFilter = (value) => {
    setCreatorFilter(value);
    setShowCreatorFilter(false);

    const requestParams = createRequestParams({
      pageNumber: 1,
      createdBy: value
    });
    fetchDataWithParams(requestParams);
  };

  const clearCreatorFilter = () => {
    setCreatorFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));

    const requestParams = createRequestParams({
      pageNumber: 1,
      createdBy: ""
    });
    fetchDataWithParams(requestParams);
  };

  const handleConfirmerFilter = (value) => {
    setConfirmerFilter(value);
    setShowConfirmerFilter(false);

    const requestParams = createRequestParams({
      pageNumber: 1,
      arrivalConfirmedBy: value
    });
    fetchDataWithParams(requestParams);
  };

  const clearConfirmerFilter = () => {
    setConfirmerFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));

    const requestParams = createRequestParams({
      pageNumber: 1,
      arrivalConfirmedBy: ""
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

  const handleDateRangeFilter = (value) => {
    setDateRangeFilter(value);
    // Chỉ cập nhật state, không gọi API ngay
  };

  const applyDateRangeFilter = () => {
    // Format createdAt từ dateRangeFilter hiện tại
    let createdAtFilter = "";
    if (dateRangeFilter.fromDate && dateRangeFilter.toDate) {
      createdAtFilter = `${dateRangeFilter.fromDate}~${dateRangeFilter.toDate}`;
    } else if (dateRangeFilter.fromDate) {
      createdAtFilter = `${dateRangeFilter.fromDate}~`;
    } else if (dateRangeFilter.toDate) {
      createdAtFilter = `~${dateRangeFilter.toDate}`;
    }

    console.log("=== DATE RANGE FILTER DEBUG ===");
    console.log("Original fromDate:", dateRangeFilter.fromDate);
    console.log("Original toDate:", dateRangeFilter.toDate);
    console.log("Formatted createdAtFilter:", createdAtFilter);
    console.log("Full requestParams:", {
      pageNumber: 1,
      createdAt: createdAtFilter
    });
    console.log("=================================");

    const requestParams = createRequestParams({
      pageNumber: 1,
      createdAt: createdAtFilter
    });
    fetchDataWithParams(requestParams);
  };

  const clearDateRangeFilter = () => {
    setDateRangeFilter({ fromDate: '', toDate: '' });
    setPagination(prev => ({ ...prev, current: 1 }));

    const requestParams = createRequestParams({
      pageNumber: 1,
      createdAt: ""
    });
    fetchDataWithParams(requestParams);
  };


  // Logic để hiển thị filter dựa trên role
  const getFilterConfig = () => {
    // Mặc định hiển thị tất cả 7 nút filter
    const defaultConfig = {
      showSupplier: true,
      showApprover: true,
      showCreator: true,
      showConfirmer: true,
      showAssignee: true,
      showDateRange: true
    };

    if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_SM)) {
      // Sales Manager - ẩn Assignee (không có quyền giao việc)
      return {
        ...defaultConfig,
        showAssignee: false
      };
    } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM)) {
      return {
        ...defaultConfig,
      };
    } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS)) {
      // Warehouse Staff - filter cơ bản cho nhân viên kho
      return {
        ...defaultConfig,
        showApprover: false,
        showCreator: false,
      };
    } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS)) {
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

  const purchaseOrderStats = useMemo(() => {
    const totalOrders = purchaseOrders.length;
    const draftOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.Draft).length;
    const pendingOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.PendingApproval).length;
    const approvedOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.Approved).length;
    const rejectedOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.Rejected).length;
    const completedOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.Completed).length;
    const goodsReceivedOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.GoodsReceived).length;
    const assignedOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.AssignedForReceiving).length;
    const receivingOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.Receiving).length;
    const inspectedOrders = purchaseOrders.filter(order => order.status === PURCHASE_ORDER_STATUS.Inspected).length;

    const stats = {
      totalOrders,
      draftOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      completedOrders,
      goodsReceivedOrders,
      assignedOrders,
      receivingOrders,
      inspectedOrders,
      statusStats: [
        { status: PURCHASE_ORDER_STATUS.Draft, count: draftOrders, percentage: totalOrders > 0 ? Math.round((draftOrders / totalOrders) * 100) : 0 },
        { status: PURCHASE_ORDER_STATUS.PendingApproval, count: pendingOrders, percentage: totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0 },
        { status: PURCHASE_ORDER_STATUS.Approved, count: approvedOrders, percentage: totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0 },
        { status: PURCHASE_ORDER_STATUS.Rejected, count: rejectedOrders, percentage: totalOrders > 0 ? Math.round((rejectedOrders / totalOrders) * 100) : 0 },
        { status: PURCHASE_ORDER_STATUS.Completed, count: completedOrders, percentage: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0 },
        { status: PURCHASE_ORDER_STATUS.GoodsReceived, count: goodsReceivedOrders, percentage: totalOrders > 0 ? Math.round((goodsReceivedOrders / totalOrders) * 100) : 0 },
        { status: PURCHASE_ORDER_STATUS.AssignedForReceiving, count: assignedOrders, percentage: totalOrders > 0 ? Math.round((assignedOrders / totalOrders) * 100) : 0 },
        { status: PURCHASE_ORDER_STATUS.Receiving, count: receivingOrders, percentage: totalOrders > 0 ? Math.round((receivingOrders / totalOrders) * 100) : 0 },
        { status: PURCHASE_ORDER_STATUS.Inspected, count: inspectedOrders, percentage: totalOrders > 0 ? Math.round((inspectedOrders / totalOrders) * 100) : 0 }
      ]
    };

    return stats;
  }, [purchaseOrders]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Quản lý Đơn hàng nhập</h1>
            <p className="text-slate-600 mt-1">
              Quản lý các đơn hàng nhập trong hệ thống
            </p>
          </div>
          <div className="flex space-x-3">
            <PermissionWrapper requiredPermission={PERMISSIONS.PURCHASE_ORDER_CREATE}>
              <Button
                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                onClick={() => {
                  navigate("/purchase-orders/create");
                }}
              >
                <Plus className="mr-2 h-4 w-4 text-white" />
                Tạo đơn hàng mới
              </Button>
            </PermissionWrapper>
          </div>
        </div>

        {/* Stats Chart */}
        <PurchaseOrderStatsChart
          purchaseOrderStats={purchaseOrderStats}
        />

        {/* Search and Table Combined */}
        <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
          <PurchaseOrderFilterToggle
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo mã đơn hàng, nhà cung cấp..."
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            showStatusFilter={showStatusFilter}
            setShowStatusFilter={setShowStatusFilter}
            statusOptions={[
              { value: "", label: "Tất cả trạng thái đơn" },
              { value: "1", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.Draft] },
              { value: "2", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.PendingApproval] },
              { value: "3", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.Rejected] },
              { value: "4", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.Approved] },
              { value: "5", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.GoodsReceived] },
              { value: "6", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.AssignedForReceiving] },
              { value: "7", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.Receiving] },
              { value: "8", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.Inspected] },
              { value: "9", label: STATUS_LABELS[PURCHASE_ORDER_STATUS.Completed] }
            ]}
            onStatusFilter={handleStatusFilter}
            clearStatusFilter={clearStatusFilter}
            // Supplier Filter - hiển thị theo config
            supplierFilter={filterConfig.showSupplier ? supplierFilter : ""}
            setSupplierFilter={filterConfig.showSupplier ? setSupplierFilter : () => { }}
            showSupplierFilter={filterConfig.showSupplier ? showSupplierFilter : false}
            setShowSupplierFilter={filterConfig.showSupplier ? setShowSupplierFilter : () => { }}
            suppliers={suppliers}
            onSupplierFilter={filterConfig.showSupplier ? handleSupplierFilter : () => { }}
            clearSupplierFilter={filterConfig.showSupplier ? clearSupplierFilter : () => { }}
            showSupplier={filterConfig.showSupplier}
            // Approver Filter - hiển thị theo config
            approverFilter={filterConfig.showApprover ? approverFilter : ""}
            setApproverFilter={filterConfig.showApprover ? setApproverFilter : () => { }}
            showApproverFilter={filterConfig.showApprover ? showApproverFilter : false}
            setShowApproverFilter={filterConfig.showApprover ? setShowApproverFilter : () => { }}
            approvers={filterConfig.showApprover ? approvers : []}
            onApproverFilter={filterConfig.showApprover ? handleApproverFilter : () => { }}
            clearApproverFilter={filterConfig.showApprover ? clearApproverFilter : () => { }}
            showApprover={filterConfig.showApprover}
            // Creator Filter - hiển thị theo config
            creatorFilter={filterConfig.showCreator ? creatorFilter : ""}
            setCreatorFilter={filterConfig.showCreator ? setCreatorFilter : () => { }}
            showCreatorFilter={filterConfig.showCreator ? showCreatorFilter : false}
            setShowCreatorFilter={filterConfig.showCreator ? setShowCreatorFilter : () => { }}
            creators={filterConfig.showCreator ? creators : []}
            onCreatorFilter={filterConfig.showCreator ? handleCreatorFilter : () => { }}
            clearCreatorFilter={filterConfig.showCreator ? clearCreatorFilter : () => { }}
            showCreator={filterConfig.showCreator}
            // Confirmer Filter - hiển thị theo config
            confirmerFilter={filterConfig.showConfirmer ? confirmerFilter : ""}
            setConfirmerFilter={filterConfig.showConfirmer ? setConfirmerFilter : () => { }}
            showConfirmerFilter={filterConfig.showConfirmer ? showConfirmerFilter : false}
            setShowConfirmerFilter={filterConfig.showConfirmer ? setShowConfirmerFilter : () => { }}
            confirmers={filterConfig.showConfirmer ? confirmers : []}
            onConfirmerFilter={filterConfig.showConfirmer ? handleConfirmerFilter : () => { }}
            clearConfirmerFilter={filterConfig.showConfirmer ? clearConfirmerFilter : () => { }}
            showConfirmer={filterConfig.showConfirmer}
            // Assignee Filter - hiển thị theo config
            assigneeFilter={filterConfig.showAssignee ? assigneeFilter : ""}
            setAssigneeFilter={filterConfig.showAssignee ? setAssigneeFilter : () => { }}
            showAssigneeFilter={filterConfig.showAssignee ? showAssigneeFilter : false}
            setShowAssigneeFilter={filterConfig.showAssignee ? setShowAssigneeFilter : () => { }}
            assignees={filterConfig.showAssignee ? assignees : []}
            onAssigneeFilter={filterConfig.showAssignee ? handleAssigneeFilter : () => { }}
            clearAssigneeFilter={filterConfig.showAssignee ? clearAssigneeFilter : () => { }}
            showAssignee={filterConfig.showAssignee}
            // Date Range Filter
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            showDateRangeFilter={showDateRangeFilter}
            setShowDateRangeFilter={setShowDateRangeFilter}
            onDateRangeFilter={handleDateRangeFilter}
            applyDateRangeFilter={applyDateRangeFilter}
            clearDateRangeFilter={clearDateRangeFilter}
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
          <PurchaseOrderTable
            purchaseOrders={sortedPurchaseOrders}
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
          itemName="đơn nhập hàng này"
        />
      </div>
    </div>
  );
}