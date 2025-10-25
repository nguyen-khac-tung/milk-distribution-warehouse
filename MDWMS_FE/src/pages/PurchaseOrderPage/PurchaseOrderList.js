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
import StatusDisplay, { PURCHASE_ORDER_STATUS, STATUS_LABELS } from "../../components/PurchaseOrderComponents/StatusDisplay";
import PurchaseOrderTable from "./PurchaseOrderTable";
import DeleteModal from "../../components/Common/DeleteModal";
import { extractErrorMessage } from "../../utils/Validation";
import { getPurchaseOrderSaleRepresentatives, getPurchaseOrderSaleManagers, getPurchaseOrderWarehouseManagers, getPurchaseOrderWarehouseStaff, deletePurchaseOrder } from "../../services/PurchaseOrderService";
import { getSuppliersDropdown } from "../../services/SupplierService";
import { PERMISSIONS } from "../../utils/permissions";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";



const sampleUsers = [
  { userId: 1, fullName: "Nguyen Van A" },
  { userId: 2, fullName: "Tran Thi B" },
  { userId: 3, fullName: "Le Van C" },
  { userId: 4, fullName: "Pham Thi D" },
  { userId: 5, fullName: "Hoang Van E" },
  { userId: 6, fullName: "representative 6" }
];

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const { hasPermission, userRoles } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortAscending, setSortAscending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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

  const fetchData = async () => {
    const requestParams = {
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
      fromDate: dateRangeFilter.fromDate,
      toDate: dateRangeFilter.toDate
    };
    

    return await fetchDataWithParams(requestParams);
  };

  // Initial load
  useEffect(() => {
    fetchSuppliers();
    if (!hasInitialLoad) {
      console.log("=== INITIAL LOAD START ===");
      console.log("API Call Count before initial load:", apiCallCount);
      fetchData();
      setHasInitialLoad(true);
    }
  }, [hasInitialLoad]);

  // Trigger search/filter when filters change (skip initial load)
  useEffect(() => {
    // Chỉ gọi API sau khi đã load dữ liệu ban đầu
    if (!hasInitialLoad) return;

    // Chỉ gọi fetchData() khi có filter thực sự active (không phải empty string)
    const hasActiveFilters = searchQuery.trim() ||
      (statusFilter && statusFilter !== "") ||
      (supplierFilter && supplierFilter !== "") ||
      (approverFilter && approverFilter !== "") ||
      (creatorFilter && creatorFilter !== "") ||
      (confirmerFilter && confirmerFilter !== "") ||
      (assigneeFilter && assigneeFilter !== "") ||
      (dateRangeFilter.fromDate && dateRangeFilter.fromDate !== "") ||
      (dateRangeFilter.toDate && dateRangeFilter.toDate !== "");

    // Chỉ gọi API khi có filter thực sự active
    if (hasActiveFilters) {
      console.log("=== FILTER CHANGE DETECTED ===");
      console.log("API Call Count before filter:", apiCallCount);
      fetchData();
    }
  }, [hasInitialLoad, searchQuery, statusFilter, supplierFilter, approverFilter, creatorFilter, confirmerFilter, assigneeFilter, dateRangeFilter]);

  // Filter and sort data
  const filteredPurchaseOrders = useMemo(() => {
    if (!Array.isArray(purchaseOrders)) {
      return [];
    }
    return purchaseOrders.filter(order => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        (order.purchaseOrderId || '').toLowerCase().includes(searchLower) ||
        (order.supplierName || '').toLowerCase().includes(searchLower) ||
        (order.creatorName || '').toLowerCase().includes(searchLower) ||
        (STATUS_LABELS[order.status] || '').toLowerCase().includes(searchLower)
      );

      const matchesStatus = !statusFilter || (order.status || '').toString() === statusFilter;
      const matchesSupplier = !supplierFilter || (order.supplierId || '').toString() === supplierFilter;
      const matchesApprover = !approverFilter || (order.approvalBy || '').toString() === approverFilter;
      const matchesCreator = !creatorFilter || (order.createdBy || '').toString() === creatorFilter;
      const matchesConfirmer = !confirmerFilter || (order.arrivalConfirmedBy || '').toString() === confirmerFilter;
      const matchesAssignee = !assigneeFilter || (order.assignTo || '').toString() === assigneeFilter;

      // Date range filter
      let matchesDateRange = true;
      if (dateRangeFilter.fromDate || dateRangeFilter.toDate) {
        const orderDate = new Date(order.createdAt);
        if (dateRangeFilter.fromDate) {
          const fromDate = new Date(dateRangeFilter.fromDate);
          matchesDateRange = matchesDateRange && orderDate >= fromDate;
        }
        if (dateRangeFilter.toDate) {
          const toDate = new Date(dateRangeFilter.toDate);
          toDate.setHours(23, 59, 59, 999); // Include the entire day
          matchesDateRange = matchesDateRange && orderDate <= toDate;
        }
      }

      return matchesSearch && matchesStatus && matchesSupplier && matchesApprover &&
        matchesCreator && matchesConfirmer && matchesAssignee && matchesDateRange;
    });
  }, [purchaseOrders, searchQuery, statusFilter, supplierFilter, approverFilter, creatorFilter, confirmerFilter, assigneeFilter, dateRangeFilter]);

  // Sort data
  const sortedPurchaseOrders = useMemo(() => {
    return [...filteredPurchaseOrders].sort((a, b) => {
      if (!sortField) return 0;

      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortAscending ? -1 : 1;
      if (aValue > bValue) return sortAscending ? 1 : -1;
      return 0;
    });
  }, [filteredPurchaseOrders, sortField, sortAscending]);



  const handleSort = (field) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
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
      fromDate: dateRangeFilter.fromDate,
      toDate: dateRangeFilter.toDate
    };
    
    fetchDataWithParams(requestParams);
  };

  const handlePageSizeChange = (newPageSize) => {
    // Update pagination state first
    setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
    
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
      fromDate: dateRangeFilter.fromDate,
      toDate: dateRangeFilter.toDate
    };
    
    fetchDataWithParams(requestParams);
  };

  // Filter handlers
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setShowStatusFilter(false);
  };

  const clearStatusFilter = () => {
    setStatusFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));
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
      fromDate: "",
      toDate: ""
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
  };

  const clearSupplierFilter = () => {
    setSupplierFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleApproverFilter = (value) => {
    setApproverFilter(value);
    setShowApproverFilter(false);
  };

  const clearApproverFilter = () => {
    setApproverFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCreatorFilter = (value) => {
    setCreatorFilter(value);
    setShowCreatorFilter(false);
  };

  const clearCreatorFilter = () => {
    setCreatorFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleConfirmerFilter = (value) => {
    setConfirmerFilter(value);
    setShowConfirmerFilter(false);
  };

  const clearConfirmerFilter = () => {
    setConfirmerFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAssigneeFilter = (value) => {
    setAssigneeFilter(value);
    setShowAssigneeFilter(false);
  };

  const clearAssigneeFilter = () => {
    setAssigneeFilter("");
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDateRangeFilter = (value) => {
    setDateRangeFilter(value);
  };

  const clearDateRangeFilter = () => {
    setDateRangeFilter({ fromDate: '', toDate: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
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
            approvers={filterConfig.showApprover ? sampleUsers : []}
            onApproverFilter={filterConfig.showApprover ? handleApproverFilter : () => { }}
            clearApproverFilter={filterConfig.showApprover ? clearApproverFilter : () => { }}
            showApprover={filterConfig.showApprover}
            // Creator Filter - hiển thị theo config
            creatorFilter={filterConfig.showCreator ? creatorFilter : ""}
            setCreatorFilter={filterConfig.showCreator ? setCreatorFilter : () => { }}
            showCreatorFilter={filterConfig.showCreator ? showCreatorFilter : false}
            setShowCreatorFilter={filterConfig.showCreator ? setShowCreatorFilter : () => { }}
            creators={filterConfig.showCreator ? sampleUsers : []}
            onCreatorFilter={filterConfig.showCreator ? handleCreatorFilter : () => { }}
            clearCreatorFilter={filterConfig.showCreator ? clearCreatorFilter : () => { }}
            showCreator={filterConfig.showCreator}
            // Confirmer Filter - hiển thị theo config
            confirmerFilter={filterConfig.showConfirmer ? confirmerFilter : ""}
            setConfirmerFilter={filterConfig.showConfirmer ? setConfirmerFilter : () => { }}
            showConfirmerFilter={filterConfig.showConfirmer ? showConfirmerFilter : false}
            setShowConfirmerFilter={filterConfig.showConfirmer ? setShowConfirmerFilter : () => { }}
            confirmers={filterConfig.showConfirmer ? sampleUsers : []}
            onConfirmerFilter={filterConfig.showConfirmer ? handleConfirmerFilter : () => { }}
            clearConfirmerFilter={filterConfig.showConfirmer ? clearConfirmerFilter : () => { }}
            showConfirmer={filterConfig.showConfirmer}
            // Assignee Filter - hiển thị theo config
            assigneeFilter={filterConfig.showAssignee ? assigneeFilter : ""}
            setAssigneeFilter={filterConfig.showAssignee ? setAssigneeFilter : () => { }}
            showAssigneeFilter={filterConfig.showAssignee ? showAssigneeFilter : false}
            setShowAssigneeFilter={filterConfig.showAssignee ? setShowAssigneeFilter : () => { }}
            assignees={filterConfig.showAssignee ? sampleUsers : []}
            onAssigneeFilter={filterConfig.showAssignee ? handleAssigneeFilter : () => { }}
            clearAssigneeFilter={filterConfig.showAssignee ? clearAssigneeFilter : () => { }}
            showAssignee={filterConfig.showAssignee}
            // Date Range Filter
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            showDateRangeFilter={showDateRangeFilter}
            setShowDateRangeFilter={setShowDateRangeFilter}
            onDateRangeFilter={handleDateRangeFilter}
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
            purchaseOrders={purchaseOrders}
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