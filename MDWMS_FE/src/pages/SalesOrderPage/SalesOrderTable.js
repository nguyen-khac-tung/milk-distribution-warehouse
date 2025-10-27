import React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Edit, Trash2 } from "lucide-react";
import EmptyState from "../../components/Common/EmptyState";
import { Package } from "lucide-react";
import { PERMISSIONS } from "../../utils/permissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import StatusDisplaySaleOrder from "../../components/SaleOrderCompoents/StatusDisplaySaleOrder";

const SalesOrderTable = ({
    saleOrders,
    pagination,
    sortField,
    sortAscending,
    onSort,
    onView,
    onEdit,
    onDelete,
    onClearFilters,
    loading,
}) => {

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

                                {/* Đại lý */}
                                <TableHead
                                    className="font-semibold text-slate-900 px-6 py-3 text-left"
                                    onClick={() => handleSort("retailerName")}
                                >
                                    <div className="flex items-center space-x-2 cursor-pointer">
                                        <span>Đại lý</span>
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

                                {/* Người duyệt */}
                                {availableFields.hasApprovalByName && (
                                    <TableHead
                                        className="font-semibold text-slate-900 px-6 py-3 text-center"
                                        onClick={() => handleSort("approvalByName")}
                                    >
                                        <div className="flex items-center justify-center space-x-2 cursor-pointer">
                                            <span>Người duyệt</span>
                                            {sortField === "approvalByName" ? (
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

                                {/* Người tạo */}
                                {availableFields.hasCreatedByName && (
                                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                        Người tạo
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
                                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                    Ngày tạo
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

                                        {/* Đại lý */}
                                        <TableCell className="text-left px-6 py-4">
                                            {order?.retailerContact?.retailerName || "-"}
                                        </TableCell>

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

                                        {/* Người tạo */}
                                        {availableFields.hasCreatedByName && (
                                            <TableCell className="text-center px-6 py-4">
                                                {order.createdByName || "-"}
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
                                                    {new Date(order.estimatedTimeDeparture).toLocaleTimeString("vi-VN", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}{" "}
                                                    {new Date(order.estimatedTimeDeparture).toLocaleDateString("vi-VN")}
                                                </>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>

                                        {/* Ngày tạo */}
                                        <TableCell className="text-center px-6 py-4">
                                            {order.createdAt
                                                ? new Date(order.createdAt).toLocaleDateString("vi-VN")
                                                : "-"}
                                        </TableCell>

                                        {/* Trạng thái */}
                                        <TableCell className="text-center px-6 py-4">
                                            <StatusDisplaySaleOrder status={order.status} />
                                        </TableCell>

                                        {/* Thao tác */}
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <PermissionWrapper requiredPermission={PERMISSIONS.SALES_ORDER_VIEW_DETAILS}>
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Xem chi tiết"
                                                        onClick={() => handleViewClick(order)}
                                                    >
                                                        <Eye className="h-4 w-4 text-orange-500" />
                                                    </button>
                                                </PermissionWrapper>
                                                {!order.isDisable && (
                                                    <PermissionWrapper requiredPermission={PERMISSIONS.SALES_ORDER_UPDATE}>
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
                                                    <PermissionWrapper requiredPermission={PERMISSIONS.SALES_ORDER_DELETE}>
                                                        <button
                                                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                            title="Xóa"
                                                        // onClick={() => handleDeleteClick(order)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </button>
                                                    </PermissionWrapper>
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
