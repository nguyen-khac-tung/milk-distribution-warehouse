import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Plus, Edit, Trash2, Eye, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import Loading from "../../components/Common/Loading";
import EmptyState from "../../components/Common/EmptyState";
import Pagination from "../../components/Common/Pagination";

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

export default function PurchaseOrderList() {
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

  // Filter and sort data
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(order => {
      const searchLower = searchQuery.toLowerCase();
      return (
        order.purchaseOrderId.toLowerCase().includes(searchLower) ||
        order.supplierName.toLowerCase().includes(searchLower) ||
        order.creatorName.toLowerCase().includes(searchLower) ||
        statusConfig[order.status]?.label.toLowerCase().includes(searchLower)
      );
    });
  }, [purchaseOrders, searchQuery]);

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
              onClick={() => console.log("Create new purchase order")}
            >
              <Plus className="mr-2 h-4 w-4 text-white" />
              Thêm đơn hàng
            </Button>
          </div>
        </div>

        {/* Search and Table Combined */}
        <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo mã đơn hàng, nhà cung cấp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-[38px]"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="w-full min-h-[200px]">
            {loading ? (
              <Loading size="large" text="Đang tải dữ liệu..." />
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-16">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Mã nhập
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Quản lý kho
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Nhà cung cấp
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("creatorName")}>
                          <span>Người tạo</span>
                          {sortField === "creatorName" ? (
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
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("createdAt")}>
                          <span>Thời gian</span>
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
                        Tình trạng
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
                          <TableCell className="px-6 py-4 text-slate-600 font-medium">
                            {(pagination.current - 1) * pagination.pageSize + index + 1}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">
                            #{order.purchaseOrderId.substring(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">
                            {order.managerName}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">
                            {order.supplierName}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">
                            {order.creatorName}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">
                            {order.createdAt}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color}`}>
                                {statusConfig[order.status]?.label}
                              </span>
                            </div>
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
                        icon={Plus}
                        title="Không tìm thấy đơn hàng nào"
                        description={
                          searchQuery
                            ? "Thử thay đổi từ khóa tìm kiếm"
                            : "Chưa có đơn hàng nào trong hệ thống"
                        }
                        actionText="Xóa bộ lọc"
                        onAction={() => setSearchQuery("")}
                        showAction={!!searchQuery}
                        colSpan={8}
                      />
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

        {/* Pagination */}
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
      </div>
    </div>
  );
}