import React, { useState, useMemo } from "react";
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

// Dữ liệu cứng cho Purchase Orders
const hardcodedPurchaseOrders = [
  {
    purchaseOrderId: "9788C239-7C4B-4A24-9879-19932E799571",
    status: 1,
    supplierId: 1,
    approvalBy: null,
    createdBy: 6,
    arrivalConfirmedBy: null,
    assignTo: 2,
    createdAt: "10/3/25 21:09",
    updatedAt: "10/3/25 21:09",
    supplierName: "Nhà cung cấp A",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "492210FE-F6EF-429B-9DE6-515DE60F93D8",
    status: 2,
    supplierId: 4,
    approvalBy: 1,
    createdBy: 6,
    arrivalConfirmedBy: null,
    assignTo: 3,
    createdAt: "10/1/25 21:09",
    updatedAt: "10/2/25 21:09",
    supplierName: "Nhà cung cấp D",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "A1EAFF57-C3A3-4CC2-B97A-791EC2E931E2",
    status: 3,
    supplierId: 1,
    approvalBy: 1,
    createdBy: 6,
    arrivalConfirmedBy: 2,
    assignTo: 2,
    createdAt: "9/23/25 21:09",
    updatedAt: "9/28/25 21:09",
    supplierName: "Nhà cung cấp A",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "DC3AE54B-A59D-414F-A8ED-99FD31E26394",
    status: 4,
    supplierId: 3,
    approvalBy: 1,
    createdBy: 6,
    arrivalConfirmedBy: 4,
    assignTo: 4,
    createdAt: "9/28/25 21:09",
    updatedAt: "10/1/25 21:09",
    supplierName: "Nhà cung cấp C",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "174C1291-225C-45EE-BD46-BE04AFD75C21",
    status: 3,
    supplierId: 1,
    approvalBy: 1,
    createdBy: 6,
    arrivalConfirmedBy: 2,
    assignTo: 2,
    createdAt: "9/23/25 21:09",
    updatedAt: "9/28/25 21:09",
    supplierName: "Nhà cung cấp A",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "22DCCCFC-8DC7-4890-A3D3-C31FA42E836F",
    status: 2,
    supplierId: 4,
    approvalBy: 1,
    createdBy: 6,
    arrivalConfirmedBy: null,
    assignTo: 3,
    createdAt: "10/1/25 21:09",
    updatedAt: "10/2/25 21:09",
    supplierName: "Nhà cung cấp D",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "78B2C96F-93B6-4A85-A782-DA46359DAF77",
    status: 4,
    supplierId: 3,
    approvalBy: 1,
    createdBy: 6,
    arrivalConfirmedBy: 4,
    assignTo: 4,
    createdAt: "9/28/25 21:09",
    updatedAt: "10/1/25 21:09",
    supplierName: "Nhà cung cấp C",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "FFD00FA4-EAE3-42D6-B3F7-DE8F656DE8A2",
    status: 1,
    supplierId: 1,
    approvalBy: null,
    createdBy: 6,
    arrivalConfirmedBy: null,
    assignTo: 2,
    createdAt: "10/3/25 21:09",
    updatedAt: "10/3/25 21:09",
    supplierName: "Nhà cung cấp A",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "80E46A9D-198C-465C-9E37-E94856375788",
    status: 3,
    supplierId: 2,
    approvalBy: 1,
    createdBy: 6,
    arrivalConfirmedBy: 3,
    assignTo: 3,
    createdAt: "9/18/25 21:09",
    updatedAt: "9/23/25 21:09",
    supplierName: "Nhà cung cấp B",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  },
  {
    purchaseOrderId: "552AC0E2-DFC3-4A2F-9A96-FB7112BDBAFE",
    status: 3,
    supplierId: 2,
    approvalBy: 1,
    createdBy: 6,
    arrivalConfirmedBy: 3,
    assignTo: 3,
    createdAt: "9/18/25 21:09",
    updatedAt: "9/23/25 21:09",
    supplierName: "Nhà cung cấp B",
    managerName: "Nguyen Van A",
    creatorName: "representative 6"
  }
];

// Mapping status numbers to Vietnamese labels and colors
const statusConfig = {
  1: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
  2: { label: "Đã xuất", color: "bg-blue-100 text-blue-800" },
  3: { label: "Từ chối", color: "bg-red-100 text-red-800" },
  4: { label: "Đã duyệt", color: "bg-green-100 text-green-800" }
};

// Sample data for filters
const sampleSuppliers = [
  { supplierId: 1, companyName: "Nhà cung cấp A" },
  { supplierId: 2, companyName: "Nhà cung cấp B" },
  { supplierId: 3, companyName: "Nhà cung cấp C" },
  { supplierId: 4, companyName: "Nhà cung cấp D" }
];

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
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState(hardcodedPurchaseOrders);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: hardcodedPurchaseOrders.length
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

  // Filter and sort data
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(order => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        order.purchaseOrderId.toLowerCase().includes(searchLower) ||
        order.supplierName.toLowerCase().includes(searchLower) ||
        order.creatorName.toLowerCase().includes(searchLower) ||
        statusConfig[order.status]?.label.toLowerCase().includes(searchLower)
      );

      const matchesStatus = !statusFilter || order.status.toString() === statusFilter;
      const matchesSupplier = !supplierFilter || order.supplierId.toString() === supplierFilter;
      const matchesApprover = !approverFilter || order.approvalBy?.toString() === approverFilter;
      const matchesCreator = !creatorFilter || order.createdBy.toString() === creatorFilter;
      const matchesConfirmer = !confirmerFilter || order.arrivalConfirmedBy?.toString() === confirmerFilter;
      const matchesAssignee = !assigneeFilter || order.assignTo.toString() === assigneeFilter;

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
      total: filteredPurchaseOrders.length,
      current: 1 // Reset to first page when filter changes
    }));
  }, [filteredPurchaseOrders.length]);

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
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
  };

  // Filter handlers
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setShowStatusFilter(false);
  };

  const clearStatusFilter = () => {
    setStatusFilter("");
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
  };

  const handlePageSizeChangeFilter = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
    setShowPageSizeFilter(false);
  };

  // New filter handlers
  const handleSupplierFilter = (value) => {
    setSupplierFilter(value);
    setShowSupplierFilter(false);
  };

  const clearSupplierFilter = () => {
    setSupplierFilter("");
  };

  const handleApproverFilter = (value) => {
    setApproverFilter(value);
    setShowApproverFilter(false);
  };

  const clearApproverFilter = () => {
    setApproverFilter("");
  };

  const handleCreatorFilter = (value) => {
    setCreatorFilter(value);
    setShowCreatorFilter(false);
  };

  const clearCreatorFilter = () => {
    setCreatorFilter("");
  };

  const handleConfirmerFilter = (value) => {
    setConfirmerFilter(value);
    setShowConfirmerFilter(false);
  };

  const clearConfirmerFilter = () => {
    setConfirmerFilter("");
  };

  const handleAssigneeFilter = (value) => {
    setAssigneeFilter(value);
    setShowAssigneeFilter(false);
  };

  const clearAssigneeFilter = () => {
    setAssigneeFilter("");
  };

  const handleDateRangeFilter = (value) => {
    setDateRangeFilter(value);
  };

  const clearDateRangeFilter = () => {
    setDateRangeFilter({ fromDate: '', toDate: '' });
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
            suppliers={sampleSuppliers}
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
              <div className={`overflow-x-auto overflow-y-visible ${filteredPurchaseOrders.length === 0 ? 'max-h-96' : ''}`}>
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
                    {paginatedPurchaseOrders.length > 0 ? (
                      paginatedPurchaseOrders.map((order, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-slate-50 border-b border-slate-200 min-h-[60px]"
                        >
                          <TableCell className="px-6 py-4 text-slate-600 font-medium text-center">
                            {(pagination.current - 1) * pagination.pageSize + index + 1}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.supplierId}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.approvalBy || '-'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.createdBy}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.arrivalConfirmedBy || '-'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.assignTo}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-center">
                            {order.createdAt}
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
                        description={
                          searchQuery || statusFilter || supplierFilter || approverFilter || creatorFilter || confirmerFilter || assigneeFilter || dateRangeFilter.fromDate || dateRangeFilter.toDate
                            ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                            : "Chưa có đơn hàng nào trong hệ thống"
                        }
                        actionText="Xóa bộ lọc"
                        onAction={clearAllFilters}
                        showAction={!!(searchQuery || statusFilter || supplierFilter || approverFilter || creatorFilter || confirmerFilter || assigneeFilter || dateRangeFilter.fromDate || dateRangeFilter.toDate)}
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