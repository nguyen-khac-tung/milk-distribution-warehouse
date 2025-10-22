import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Plus, Edit, Trash2, Eye, ArrowUp, ArrowDown, ArrowUpDown, Package } from "lucide-react";
import Loading from "../../components/Common/Loading";
import EmptyState from "../../components/Common/EmptyState";
import Pagination from "../../components/Common/Pagination";
import PurchaseOrderFilterToggle from "../../components/PurchaseOrderComponents/PurchaseOrderFilterToggle";
import PurchaseOrderStatsChart from "../../components/PurchaseOrderComponents/PurchaseOrderStatsChart";
import { getPurchaseOrderSaleRepresentatives } from "../../services/PurchaseOrderService";
import { getSuppliersDropdown } from "../../services/SupplierService";


// Mapping status numbers to Vietnamese labels and colors
const statusConfig = {
  1: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
  2: { label: "Đã xuất", color: "bg-blue-100 text-blue-800" },
  3: { label: "Từ chối", color: "bg-red-100 text-red-800" },
  4: { label: "Đã duyệt", color: "bg-green-100 text-green-800" }
};

// Sample data for users (temporary until we have user API)
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

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("=== FETCHING PURCHASE ORDERS ===");
      
      const response = await getPurchaseOrderSaleRepresentatives({
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
      });
      
      console.log("API response:", response);
      
      if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
        setPurchaseOrders(response.data.items);
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount || 0
        }));
        console.log("Data loaded successfully:", response.data.items.length, "items");
      } else {
        console.log("No data received or data is not array");
        console.log("Response structure:", response);
        setPurchaseOrders([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setPurchaseOrders([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSuppliers();
    fetchData();
  }, []);

  // Trigger search/filter when filters change
  useEffect(() => {
    if (searchQuery || statusFilter || supplierFilter || approverFilter || creatorFilter || confirmerFilter || assigneeFilter || dateRangeFilter.fromDate || dateRangeFilter.toDate) {
      fetchData();
    }
  }, [searchQuery, statusFilter, supplierFilter, approverFilter, creatorFilter, confirmerFilter, assigneeFilter, dateRangeFilter]);

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
        (statusConfig[order.status]?.label || '').toLowerCase().includes(searchLower)
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

  // Paginate data
  const paginatedPurchaseOrders = useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return sortedPurchaseOrders.slice(startIndex, endIndex);
  }, [sortedPurchaseOrders, pagination.current, pagination.pageSize]);

  // Update total count when filtered data changes
  React.useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: (filteredPurchaseOrders || []).length,
      current: 1 // Reset to first page when filter changes
    }));
  }, [(filteredPurchaseOrders || []).length]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  const handleViewClick = (order) => {
    console.log("Viewing purchase order:", order);
    // TODO: Implement view modal
  };

  const handleEditClick = (order) => {
    console.log("Editing purchase order:", order);
    // TODO: Implement edit modal
  };

  const handleDeleteClick = (order) => {
    console.log("Deleting purchase order:", order);
    // TODO: Implement delete modal
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current: newPage }));
    fetchData();
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
    fetchData();
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
    setSearchQuery("");
    setStatusFilter("");
    setSupplierFilter("");
    setApproverFilter("");
    setCreatorFilter("");
    setConfirmerFilter("");
    setAssigneeFilter("");
    setDateRangeFilter({ fromDate: '', toDate: '' });
    // Reset pagination and fetch data
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData();
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

  // Calculate stats for chart
  const purchaseOrderStats = useMemo(() => {
    const totalOrders = purchaseOrders.length;
    const pendingOrders = purchaseOrders.filter(order => order.status === 1).length;
    const approvedOrders = purchaseOrders.filter(order => order.status === 4).length;
    const rejectedOrders = purchaseOrders.filter(order => order.status === 3).length;
    const shippedOrders = purchaseOrders.filter(order => order.status === 2).length;

    return {
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      shippedOrders,
      statusStats: [
        { status: 1, count: pendingOrders, percentage: totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0 },
        { status: 2, count: shippedOrders, percentage: totalOrders > 0 ? Math.round((shippedOrders / totalOrders) * 100) : 0 },
        { status: 3, count: rejectedOrders, percentage: totalOrders > 0 ? Math.round((rejectedOrders / totalOrders) * 100) : 0 },
        { status: 4, count: approvedOrders, percentage: totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0 }
      ]
    };
  }, [purchaseOrders]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Quản lý Đơn hàng nhập</h1>
            <p className="text-slate-600 mt-1">Quản lý các đơn hàng nhập trong hệ thống</p>
          </div>
          <div className="flex space-x-3">
            <Button
              className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
              onClick={() => {
                navigate("/purchase-orders/create");
              }}
            >
              <Plus className="mr-2 h-4 w-4 text-white" />
              Thêm đơn hàng
            </Button>
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
              { value: "", label: "Tất cả trạng thái" },
              { value: "1", label: "Chờ duyệt" },
              { value: "2", label: "Đã xuất" },
              { value: "3", label: "Từ chối" },
              { value: "4", label: "Đã duyệt" }
            ]}
            onStatusFilter={handleStatusFilter}
            clearStatusFilter={clearStatusFilter}
            // Supplier Filter
            supplierFilter={supplierFilter}
            setSupplierFilter={setSupplierFilter}
            showSupplierFilter={showSupplierFilter}
            setShowSupplierFilter={setShowSupplierFilter}
            suppliers={suppliers}
            onSupplierFilter={handleSupplierFilter}
            clearSupplierFilter={clearSupplierFilter}
            // Approver Filter
            approverFilter={approverFilter}
            setApproverFilter={setApproverFilter}
            showApproverFilter={showApproverFilter}
            setShowApproverFilter={setShowApproverFilter}
            approvers={sampleUsers}
            onApproverFilter={handleApproverFilter}
            clearApproverFilter={clearApproverFilter}
            // Creator Filter
            creatorFilter={creatorFilter}
            setCreatorFilter={setCreatorFilter}
            showCreatorFilter={showCreatorFilter}
            setShowCreatorFilter={setShowCreatorFilter}
            creators={sampleUsers}
            onCreatorFilter={handleCreatorFilter}
            clearCreatorFilter={clearCreatorFilter}
            // Confirmer Filter
            confirmerFilter={confirmerFilter}
            setConfirmerFilter={setConfirmerFilter}
            showConfirmerFilter={showConfirmerFilter}
            setShowConfirmerFilter={setShowConfirmerFilter}
            confirmers={sampleUsers}
            onConfirmerFilter={handleConfirmerFilter}
            clearConfirmerFilter={clearConfirmerFilter}
            // Assignee Filter
            assigneeFilter={assigneeFilter}
            setAssigneeFilter={setAssigneeFilter}
            showAssigneeFilter={showAssigneeFilter}
            setShowAssigneeFilter={setShowAssigneeFilter}
            assignees={sampleUsers}
            onAssigneeFilter={handleAssigneeFilter}
            clearAssigneeFilter={clearAssigneeFilter}
            // Date Range Filter
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            showDateRangeFilter={showDateRangeFilter}
            setShowDateRangeFilter={setShowDateRangeFilter}
            onDateRangeFilter={handleDateRangeFilter}
            clearDateRangeFilter={clearDateRangeFilter}
            onClearAll={clearAllFilters}
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
          <div className="w-full">
            {loading ? (
              <Loading size="large" text="Đang tải dữ liệu..." />
            ) : (
              <div className={`overflow-x-auto overflow-y-visible ${(filteredPurchaseOrders || []).length === 0 ? 'max-h-96' : ''}`}>
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-16">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("supplierId")}>
                          <span>Tên nhà cung cấp</span>
                          {sortField === "supplierId" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("approvalBy")}>
                          <span>Người duyệt</span>
                          {sortField === "approvalBy" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("createdBy")}>
                          <span>Người tạo</span>
                          {sortField === "createdBy" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("arrivalConfirmedBy")}>
                          <span>Người xác nhận đến</span>
                          {sortField === "arrivalConfirmedBy" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("assignTo")}>
                          <span>Giao cho</span>
                          {sortField === "assignTo" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("createdAt")}>
                          <span>Thời gian tạo</span>
                          {sortField === "createdAt" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("status")}>
                          <span>Trạng thái</span>
                          {sortField === "status" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(paginatedPurchaseOrders || []).length > 0 ? (
                      (paginatedPurchaseOrders || []).map((order, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-slate-50 border-b border-slate-200 min-h-[60px]"
                        >
                          <TableCell className="px-6 py-4 text-slate-600 font-medium text-center">
                            {(pagination.current - 1) * pagination.pageSize + index + 1}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.supplierName || order.supplierId || '-'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.approvalByName || order.approvalBy || '-'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.createdByName || order.createdBy || '-'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.arrivalConfirmedByName || order.arrivalConfirmedBy || '-'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.assignToName || order.assignTo || '-'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color}`}>
                              {statusConfig[order.status]?.label}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Xem chi tiết"
                                onClick={() => handleViewClick(order)}
                              >
                                <Eye className="h-4 w-4 text-orange-500" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => handleEditClick(order)}
                              >
                                <Edit className="h-4 w-4 text-orange-500" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Xóa"
                                onClick={() => handleDeleteClick(order)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyState
                        icon={Package}
                        title="Không tìm thấy đơn hàng nào"
                        description="Chưa có đơn hàng nào trong hệ thống"
                        actionText="Xóa bộ lọc"
                        onAction={clearAllFilters}
                        showAction={false}
                        colSpan={9}
                      />
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
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
      </div>
    </div>
  );
}