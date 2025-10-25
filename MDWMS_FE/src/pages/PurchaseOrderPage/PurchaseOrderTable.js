import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-react';
import EmptyState from '../../components/Common/EmptyState';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { PERMISSIONS } from '../../utils/permissions';
import { Package } from 'lucide-react';
import StatusDisplay from '../../components/PurchaseOrderComponents/StatusDisplay';

const PurchaseOrderTable = ({
  purchaseOrders,
  pagination,
  sortField,
  sortAscending,
  onSort,
  onView,
  onEdit,
  onDelete,
  onClearFilters,
  loading
}) => {
  // Detect available fields in data
  const availableFields = React.useMemo(() => {
    if (!purchaseOrders || purchaseOrders.length === 0) {
      return {
        hasSupplierName: false,
        hasApprovalByName: false,
        hasCreatedByName: false,
        hasArrivalConfirmedByName: false,
        hasAssignToName: false,
        hasCreatedAt: false
      };
    }

    const firstItem = purchaseOrders[0];
    const fields = {
      hasSupplierName: firstItem.supplierName !== undefined,
      hasApprovalByName: firstItem.approvalByName !== undefined,
      hasCreatedByName: firstItem.createdByName !== undefined,
      hasArrivalConfirmedByName: firstItem.arrivalConfirmedByName !== undefined,
      hasAssignToName: firstItem.assignToName !== undefined || firstItem.assignToByName !== undefined,
      hasCreatedAt: firstItem.createdAt !== undefined
    };
    
    // Show fields if they exist in the API response
    if (firstItem.approvalBy !== undefined || firstItem.approvalByName !== undefined) {
      fields.hasApprovalByName = true;
    }
    
    if (firstItem.arrivalConfirmedBy !== undefined || firstItem.arrivalConfirmedByName !== undefined) {
      fields.hasArrivalConfirmedByName = true;
    }
    return fields;
  }, [purchaseOrders]);

  const handleSort = (field) => {
    onSort(field);
  };

  const handleViewClick = (order) => {
    onView(order);
  };

  const handleEditClick = (order) => {
    onEdit(order);
  };

  const handleDeleteClick = (order) => {
    onDelete(order);
  };

  // Calculate paginated data
  const paginatedPurchaseOrders = React.useMemo(() => {
    if (!purchaseOrders || !Array.isArray(purchaseOrders)) {
      return [];
    }
    
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return purchaseOrders.slice(startIndex, endIndex);
  }, [purchaseOrders, pagination.current, pagination.pageSize]);

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className={`overflow-x-auto overflow-y-visible ${(paginatedPurchaseOrders || []).length === 0 ? 'max-h-96' : ''}`}>
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-16">
                  STT
                </TableHead>
                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                  <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("supplierId")}>
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
                {availableFields.hasApprovalByName && (
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
                )}
                {availableFields.hasCreatedByName && (
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
                )}
                {availableFields.hasArrivalConfirmedByName && (
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
                )}
                {availableFields.hasAssignToName && (
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
                )}
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
                    <TableCell className="px-6 py-4 text-slate-700 text-left">
                      {order.supplierName || order.supplierId || '-'}
                    </TableCell>
                    {availableFields.hasApprovalByName && (
                      <TableCell className="px-6 py-4 text-slate-700 text-center">
                        {order.approvalByName || order.approvalBy || '-'}
                      </TableCell>
                    )}
                    {availableFields.hasCreatedByName && (
                      <TableCell className="px-6 py-4 text-slate-700 text-center">
                        {order.createdByName || order.createdBy || '-'}
                      </TableCell>
                    )}
                    {availableFields.hasArrivalConfirmedByName && (
                      <TableCell className="px-6 py-4 text-slate-700 text-center">
                        {order.arrivalConfirmedByName || order.arrivalConfirmedBy || '-'}
                      </TableCell>
                    )}
                    {availableFields.hasAssignToName && (
                      <TableCell className="px-6 py-4 text-slate-700 text-center">
                        {order.assignToName || order.assignToByName || order.assignTo || '-'}
                      </TableCell>
                    )}
                    <TableCell className="px-6 py-4 text-slate-700 text-center">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <StatusDisplay status={order.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <PermissionWrapper requiredPermission={PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS}>
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Xem chi tiết"
                            onClick={() => handleViewClick(order)}
                          >
                            <Eye className="h-4 w-4 text-orange-500" />
                          </button>
                        </PermissionWrapper>
                        <PermissionWrapper requiredPermission={PERMISSIONS.PURCHASE_ORDER_UPDATE}>
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Chỉnh sửa"
                            onClick={() => handleEditClick(order)}
                          >
                            <Edit className="h-4 w-4 text-orange-500" />
                          </button>
                        </PermissionWrapper>
                        <PermissionWrapper requiredPermission={PERMISSIONS.PURCHASE_ORDER_DELETE}>
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Xóa"
                            onClick={() => handleDeleteClick(order)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </PermissionWrapper>
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
                  onAction={onClearFilters}
                  showAction={false}
                  colSpan={5 + Object.values(availableFields).filter(Boolean).length + 2}
                />
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderTable;
