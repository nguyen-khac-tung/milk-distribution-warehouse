import React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Edit, Trash2, CheckCircle, UserPlus, FileText, XCircle } from "lucide-react";
import EmptyState from "../../components/Common/EmptyState";
import { Package } from "lucide-react";
import { PERMISSIONS, canPerformSalesOrderAction } from "../../utils/permissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import StatusDisplaySaleOrder from "../../components/SaleOrderCompoents/StatusDisplaySaleOrder";
import { usePermissions } from "../../hooks/usePermissions";

const SalesOrderTable = ({
    saleOrders,
    pagination,
    sortField,
    sortAscending,
    onSort,
    onView,
    onGoodsIssueNoteDetail,
    onEdit,
    onDelete,
    onClearFilters,
    loading,
}) => {
    const { hasPermission } = usePermissions();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    // Xác định cột nào tồn tại trong dữ liệu (tự động theo role)
    const availableFields = React.useMemo(() => {
        if (!saleOrders || saleOrders.length === 0) {
            return {
                hasApprovalByName: false,
                hasCreatedByName: false,
                hasAcknowledgedByName: false,
                hasAssignToName: false,
            };
        }

        const firstItem = saleOrders[0];
        return {
            hasApprovalByName: firstItem.approvalByName !== undefined,
            hasCreatedByName: firstItem.createdByName !== undefined,
            hasAcknowledgedByName: firstItem.acknowledgedByName !== undefined,
            hasAssignToName: firstItem.assignToName !== undefined,
        };
    }, [saleOrders]);

    const handleSort = (field) => {
        onSort(field);
    };

    const handleViewClick = (order) => {
        onView(order);
    };

    const handleDeleteClick = (order) => {
        onDelete(order);
    };

    const handleEditClick = (order) => {
        onEdit(order);
    };

    const handleGoodsIssueNoteDetailClick = (order) => {
        onGoodsIssueNoteDetail(order);
    };

    return (
        <div className="w-full">
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <div
                    className={`overflow-x-auto overflow-y-visible ${(saleOrders || []).length === 0 ? "max-h-96" : ""}`}
                >
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                {/* STT */}
                                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-16">
                                    STT
                                </TableHead>

                                {/* Nhà bán lẻ */}
                                <TableHead
                                    className="font-semibold text-slate-900 px-6 py-3 text-left"
                                    onClick={() => handleSort("retailerName")}
                                >
                                    <div className="flex items-center space-x-2 cursor-pointer">
                                        <span>Nhà bán lẻ</span>
                                        {sortField === "retailerName" ? (
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

                                {/* Người tạo */}
                                {availableFields.hasCreatedByName && (
                                    <TableHead
                                        className="font-semibold text-slate-900 px-6 py-3 text-center"
                                        onClick={() => handleSort("createdByName")}
                                    >
                                        <div className="flex items-center justify-center space-x-2 cursor-pointer">
                                            <span>Người tạo</span>
                                            {sortField === "createdByName" ? (
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

                                {/* Người duyệt */}
                                {availableFields.hasApprovalByName && (
                                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                        Người duyệt
                                    </TableHead>
                                )}

                                {/* Người xác nhận */}
                                {availableFields.hasAcknowledgedByName && (
                                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                        Người xác nhận
                                    </TableHead>
                                )}

                                {/* Giao cho */}
                                {availableFields.hasAssignToName && (
                                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                        Giao cho
                                    </TableHead>
                                )}

                                {/* Thời gian xuất kho */}
                                <TableHead
                                    className="font-semibold text-slate-900 px-6 py-3 text-center"
                                    onClick={() => handleSort("estimatedTimeDeparture")}
                                >
                                    <div className="flex items-center justify-center space-x-2 cursor-pointer">
                                        <span>Thời gian xuất kho</span>
                                        {sortField === "estimatedTimeDeparture" ? (
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

                                {/* Ngày tạo */}
                                <TableHead
                                    className="font-semibold text-slate-900 px-6 py-3 text-center"
                                    onClick={() => handleSort("createdAt")}
                                >
                                    <div className="flex items-center justify-center space-x-2 cursor-pointer">
                                        <span>Ngày tạo</span>
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

                                {/* Trạng thái */}
                                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                    Trạng thái
                                </TableHead>

                                {/* Thao tác */}
                                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-24">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {(saleOrders || []).length > 0 ? (
                                saleOrders.map((order, index) => (
                                    <TableRow
                                        key={order.salesOrderId || index}
                                        className="hover:bg-slate-50 border-b border-slate-200"
                                    >
                                        {/* STT */}
                                        <TableCell className="text-center px-6 py-4">
                                            {(pagination.current - 1) * pagination.pageSize + index + 1}
                                        </TableCell>

                                        {/* Nhà bán lẻ */}
                                        <TableCell className="text-left px-6 py-4 max-w-[180px] break-words whitespace-normal">
                                            {order?.retailerName || "-"}
                                        </TableCell>

                                        {/* Người tạo */}
                                        {availableFields.hasCreatedByName && (
                                            <TableCell className="text-center px-6 py-4">
                                                {order.createdByName || "-"}
                                            </TableCell>
                                        )}

                                        {/* Người duyệt */}
                                        {availableFields.hasApprovalByName && (
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

                                        {/* Người xác nhận */}
                                        {availableFields.hasAcknowledgedByName && (
                                            <TableCell className="px-6 py-4 text-slate-700 text-center">
                                                {order.acknowledgedByName || order.acknowledgedBy ? (
                                                    <span className="text-blue-600 font-medium">
                                                        {order.acknowledgedByName || order.acknowledgedBy}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">Chưa xác nhận</span>
                                                )}
                                            </TableCell>
                                        )}

                                        {/* Giao cho */}
                                        {availableFields.hasAssignToName && (
                                            <TableCell className="text-center px-6 py-4 text-purple-600 font-medium">
                                                {order.assignToName || "-"}
                                            </TableCell>
                                        )}

                                        {/* Thời gian xuất kho */}
                                        <TableCell className="text-center px-6 py-4">
                                            {order.estimatedTimeDeparture ? (
                                                <>
                                                    {new Date(order.estimatedTimeDeparture).toLocaleDateString("vi-VN")}
                                                </>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>

                                        {/* Ngày tạo */}
                                        <TableCell className="text-center px-6 py-4">
                                            {order.createdAt
                                                ? new Date(order.createdAt).toLocaleString("vi-VN", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })
                                                : "-"}
                                        </TableCell>

                                        {/* Trạng thái */}
                                        <TableCell className="text-center px-6 py-4">
                                            <StatusDisplaySaleOrder status={order.status} />
                                        </TableCell>

                                        {/* Thao tác */}
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                {/* View Button - Always visible for all roles */}
                                                <PermissionWrapper requiredPermission={PERMISSIONS.SALES_ORDER_VIEW_DETAILS}>
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Xem chi tiết"
                                                        onClick={() => handleViewClick(order)}
                                                    >
                                                        <Eye className="h-4 w-4 text-orange-500" />
                                                    </button>
                                                </PermissionWrapper>

                                                {/* Approve Button - Sale Manager for PendingApproval */}
                                                {/* {canPerformSalesOrderAction('approve', order, hasPermission, userInfo) && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Duyệt phiếu"
                                                        onClick={() => {
                                                            // TODO: Implement approve functionality
                                                            console.log('Approve order:', order.salesOrderId);
                                                        }}
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    </button>
                                                )} */}

                                                {/* Reject Button - Sale Manager for PendingApproval */}
                                                {/* {canPerformSalesOrderAction('reject', order, hasPermission, userInfo) && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Từ chối phiếu"
                                                        onClick={() => {
                                                            // TODO: Implement reject functionality
                                                            console.log('Reject order:', order.salesOrderId);
                                                        }}
                                                    >
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    </button>
                                                )} */}

                                                {/* Assign Button - Warehouse Manager */}
                                                {/* {canPerformSalesOrderAction('assign_for_picking', order, hasPermission, userInfo) && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title={order.status === 4 ? 'Phân công' : 'Phân công lại'}
                                                        onClick={() => {
                                                            // TODO: Implement assign functionality
                                                            console.log('Assign order:', order.salesOrderId);
                                                        }}
                                                    >
                                                        <UserPlus className="h-4 w-4 text-blue-500" />
                                                    </button>
                                                )} */}

                                                {/* Create Delivery Slip Button - Warehouse Staff */}
                                                {/* {canPerformSalesOrderAction('create_delivery_slip', order, hasPermission, userInfo) && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Tạo phiếu xuất kho"
                                                        onClick={() => {
                                                            // TODO: Implement create delivery slip functionality
                                                            console.log('Create delivery slip:', order.salesOrderId);
                                                        }}
                                                    >
                                                        <FileText className="h-4 w-4 text-purple-500" />
                                                    </button>
                                                )} */}

                                                {/* Submit Pending Approval Button - Sales Representative */}
                                                {/* {canPerformSalesOrderAction('submit_pending_approval', order, hasPermission, userInfo) && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Nộp bản nháp"
                                                        onClick={() => {
                                                            // TODO: Implement submit pending approval functionality
                                                            console.log('Submit pending approval:', order.salesOrderId);
                                                        }}
                                                    >
                                                        <FileText className="h-4 w-4 text-orange-500" />
                                                    </button>
                                                )} */}

                                                {/* View Delivery Slip Button - Warehouse Manager/Staff */}
                                                {canPerformSalesOrderAction('view_delivery_slip', order, hasPermission, userInfo) && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Xem phiếu xuất kho"
                                                        onClick={() => handleGoodsIssueNoteDetailClick(order)}
                                                    >
                                                        <FileText className="h-4 w-4 text-green-500" />
                                                    </button>
                                                )}

                                                {/* Edit Button - Sales Representative */}
                                                {canPerformSalesOrderAction('edit', order, hasPermission, userInfo) && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Chỉnh sửa"
                                                        onClick={() => handleEditClick(order)}
                                                    >
                                                        <Edit className="h-4 w-4 text-yellow-500" />
                                                    </button>
                                                )}

                                                {/* Delete Button - Sales Representative */}
                                                {canPerformSalesOrderAction('delete', order, hasPermission, userInfo) && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Xóa"
                                                        onClick={() => handleDeleteClick(order)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </button>
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
                                    onAction={onClearFilters}
                                    showAction={false}
                                    colSpan={5 + Object.values(availableFields).filter(Boolean).length + 3}
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default SalesOrderTable;
