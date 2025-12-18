import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Edit, Trash2, Package2 } from 'lucide-react';
import EmptyState from '../../components/Common/EmptyState';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { PERMISSIONS, canPerformPurchaseOrderAction } from '../../utils/permissions';
import { Package } from 'lucide-react';
import StatusDisplay from '../../components/PurchaseOrderComponents/StatusDisplay';
import { usePermissions } from '../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { startReceive } from '../../services/PurchaseOrderService';
import { extractErrorMessage } from '../../utils/Validation';

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
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const isSalesManager = hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_SM);
  const isWarehouseManager = hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM);

  // Handle goods receipt action based on status
  const handleGoodsReceiptClick = async (order) => {
    try {
      if (order.status === 6) {
        // Trạng thái = 6 (Đã phân công): Gọi API startReceive trước (chỉ cho Warehouse Staff)
        await startReceive(order.purchaseOderId);
        window.showToast?.('Bắt đầu quá trình nhận hàng thành công!', 'success');
        navigate(`/goods-receipt-notes/${order.purchaseOderId}`);
      } else if (order.status === 5 || order.status === 7 || order.status === 8 || order.status === 9) {
        // Trạng thái = 5 (Đã giao đến), 7 (Đang tiếp nhận), 8 (Đã kiểm nhập), 9 (Hoàn thành): Chỉ navigate
        navigate(`/goods-receipt-notes/${order.purchaseOderId}`);
      }
    } catch (error) {
      console.error('Error handling goods receipt:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // Sử dụng extractErrorMessage để lấy message lỗi từ backend
      const errorMessage = extractErrorMessage(error) || 'Có lỗi xảy ra khi xử lý phiếu nhập kho';

      window.showToast?.(errorMessage, 'error');
    }
  };

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

  const visibleExtraFieldCount = React.useMemo(() => {
    // Count how many optional columns are actually visible
    return Object.entries(availableFields).reduce((count, [key, value]) => {
      if (!value) return count;
      // Hide "Người xác nhận đến" column for Sales Manager
      if (isSalesManager && key === 'hasArrivalConfirmedByName') return count;
      // Hide "Người tạo" và "Người duyệt" cho Warehouse Manager
      if (isWarehouseManager && (key === 'hasCreatedByName' || key === 'hasApprovalByName')) return count;
      return count + 1;
    }, 0);
  }, [availableFields, isSalesManager, isWarehouseManager]);

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

  // Use all data from backend (pagination is handled by backend)
  const paginatedPurchaseOrders = React.useMemo(() => {
    if (!purchaseOrders || !Array.isArray(purchaseOrders)) {
      return [];
    }

    // Backend already handles pagination, so return all data
    return purchaseOrders;
  }, [purchaseOrders]);

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
                <TableHead className="font-semibold text-slate-900 px-1 py-1 text-center w-6">
                  STT
                </TableHead>
                <TableHead className="font-semibold text-slate-900 px-4 py-2 min-w-[100px]">
                  Mã mua hàng
                </TableHead>
                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                  <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1 min-w-[140px]" onClick={() => handleSort("supplierId")}>
                    <span>Nhà cung cấp</span>
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
                {availableFields.hasCreatedByName && !isWarehouseManager && (
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
                {availableFields.hasApprovalByName && !isWarehouseManager && (
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
                {availableFields.hasArrivalConfirmedByName && !isSalesManager && (
                  <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                    <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1 min-w-[140px]" onClick={() => handleSort("arrivalConfirmedBy")}>
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
                    <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1 min-w-[100px]" onClick={() => handleSort("assignTo")}>
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
                  <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1 min-w-[120px]" onClick={() => handleSort("createdAt")}>
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
                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center min-w-[90px]">
                  <span>Trạng thái</span>
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
                    <TableCell className="px-2 py-4 text-slate-600 font-medium text-center">
                      {(pagination.current - 1) * pagination.pageSize + index + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-slate-700 font-bold">
                      {order.purchaseOderId || '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-slate-700 text-left">
                      <span className="font-bold">
                        {order.supplierName || order.supplierId || '-'}
                      </span>
                    </TableCell>
                    {availableFields.hasCreatedByName && !isWarehouseManager && (
                      <TableCell className="px-6 py-4 text-slate-700 text-center">
                        {order.createdByName || order.createdBy || '-'}
                      </TableCell>
                    )}
                    {availableFields.hasApprovalByName && !isWarehouseManager && (
                      <TableCell className="px-6 py-4 text-slate-700 text-center">
                        {order.approvalByName || order.approvalBy ? (
                          <span className="text-green-600 font-medium">
                            {order.approvalByName || order.approvalBy}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Chưa duyệt</span>
                        )}
                      </TableCell>
                    )}
                    {availableFields.hasArrivalConfirmedByName && !isSalesManager && (
                      <TableCell className="px-6 py-4 text-slate-700 text-center">
                        {order.arrivalConfirmedByName || order.arrivalConfirmedBy ? (
                          <span className="text-blue-600 font-medium">
                            {order.arrivalConfirmedByName || order.arrivalConfirmedBy}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Chưa xác nhận</span>
                        )}
                      </TableCell>
                    )}
                    {availableFields.hasAssignToName && (
                      <TableCell className="px-6 py-4 text-slate-700 text-center">
                        {order.assignToName || order.assignToByName || order.assignTo ? (
                          <span className="text-purple-600 font-medium">
                            {order.assignToName || order.assignToByName || order.assignTo}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Chưa phân công</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="px-6 py-4 text-slate-700 text-center">
                      {order.createdAt ? (() => {
                        const date = new Date(order.createdAt);
                        const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const dateStr = date.toLocaleDateString('vi-VN');
                        return `${time} ${dateStr}`;
                      })() : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <StatusDisplay status={order.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {/* View button - always visible for Sales Representative */}
                        {canPerformPurchaseOrderAction('view', order, hasPermission) && (
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Xem chi tiết"
                            onClick={() => handleViewClick(order)}
                          >
                            <Eye className="h-4 w-4 text-orange-500" />
                          </button>
                        )}

                        {/* Edit button - conditional based on API flags for Sales Representative */}
                        {canPerformPurchaseOrderAction('edit', order, hasPermission) && (
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Chỉnh sửa"
                            onClick={() => handleEditClick(order)}
                          >
                            <Edit className="h-4 w-4 text-orange-500" />
                          </button>
                        )}

                        {/* Goods Receipt button - for status 6, 7, 8, 9 - only for Warehouse Staff */}
                        {(order.status === 6 || order.status === 7 || order.status === 8 || order.status === 9) && hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS) && (
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title={order.status === 6 ? "Bắt đầu nhận hàng" : "Xem phiếu nhập kho"}
                            onClick={() => handleGoodsReceiptClick(order)}
                          >
                            <Package2 className={`h-4 w-4 ${order.status === 6 ? 'text-green-500' : 'text-blue-500'}`} />
                          </button>
                        )}

                        {/* Goods Receipt button - for status 5, 6, 7, 8, 9 (các trạng thái sau GoodsReceived) - for Warehouse Manager */}
                        {(order.status === 7 || order.status === 8 || order.status === 9) && hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM) && (
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Xem phiếu nhập kho"
                            onClick={() => handleGoodsReceiptClick(order)}
                          >
                            <Package2 className="h-4 w-4 text-blue-500" />
                          </button>
                        )}

                        {/* Delete button - conditional based on API flags for Sales Representative */}
                        {canPerformPurchaseOrderAction('delete', order, hasPermission) && (
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Xóa"
                            onClick={() => handleDeleteClick(order)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        )}

                        {/* Fallback for other roles using existing permission system */}
                        {!hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) &&
                          !hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_SM) &&
                          !hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM) &&
                          !hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS) && (
                            <>
                              <PermissionWrapper requiredPermission={PERMISSIONS.PURCHASE_ORDER_VIEW_DETAILS}>
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Xem chi tiết"
                                  onClick={() => handleViewClick(order)}
                                >
                                  <Eye className="h-4 w-4 text-orange-500" />
                                </button>
                              </PermissionWrapper>

                              {/* Goods Receipt button - for status 6, 7, 8, 9 - only for Warehouse Staff */}
                              {(order.status === 6 || order.status === 7 || order.status === 8 || order.status === 9) && hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS) && (
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title={order.status === 6 ? "Bắt đầu nhận hàng" : "Xem phiếu nhập kho"}
                                  onClick={() => handleGoodsReceiptClick(order)}
                                >
                                  <Package2 className={`h-4 w-4 ${order.status === 6 ? 'text-green-500' : 'text-blue-500'}`} />
                                </button>
                              )}

                              {/* Goods Receipt button - for status 5, 6, 7, 8, 9 (các trạng thái sau GoodsReceived) - for Warehouse Manager */}
                              {(order.status === 5 || order.status === 6 || order.status === 7 || order.status === 8 || order.status === 9) && hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM) && (
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Xem phiếu nhập kho"
                                  onClick={() => handleGoodsReceiptClick(order)}
                                >
                                  <Package2 className="h-4 w-4 text-blue-500" />
                                </button>
                              )}
                              {!order.isDisable && (
                                <PermissionWrapper requiredPermission={PERMISSIONS.PURCHASE_ORDER_UPDATE}>
                                  <button
                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                    title="Chỉnh sửa"
                                    onClick={() => handleEditClick(order)}
                                  >
                                    <Edit className="h-4 w-4 text-orange-500" />
                                  </button>
                                </PermissionWrapper>
                              )}
                              {!order.isDisable && (
                                <PermissionWrapper requiredPermission={PERMISSIONS.PURCHASE_ORDER_DELETE}>
                                  <button
                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                    title="Xóa"
                                    onClick={() => handleDeleteClick(order)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </button>
                                </PermissionWrapper>
                              )}
                            </>
                          )}
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
                  colSpan={6 + visibleExtraFieldCount + 2}
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
