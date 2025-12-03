import React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Edit, Trash2, FileText } from "lucide-react";
import EmptyState from "../Common/EmptyState";
import { Package } from "lucide-react";
import { PERMISSIONS, DISPOSAL_REQUEST_STATUS } from "../../utils/permissions";
import PermissionWrapper from "../Common/PermissionWrapper";
import StatusDisplayDisposalRequest from "./StatusDisplayDisposalRequest";

const DisposalTable = ({
    disposalRequests,
    pagination,
    sortField,
    sortAscending,
    onSort,
    onView,
    onEdit,
    onDelete,
    onViewDisposalNote,
    onClearFilters,
    loading,
    isWarehouseManager,
    isWarehouseStaff,
}) => {
    // Xác định cột nào tồn tại trong dữ liệu (tự động theo role)
    const availableFields = React.useMemo(() => {
        if (!disposalRequests || disposalRequests.length === 0) {
            return {
                hasApprovalByName: false,
                hasCreatedByName: false,
                hasAssignToName: false,
            };
        }

        const firstItem = disposalRequests[0];
        return {
            hasApprovalByName: firstItem.approvalByName !== undefined,
            hasCreatedByName: firstItem.createdByName !== undefined,
            hasAssignToName: firstItem.assignToName !== undefined,
        };
    }, [disposalRequests]);

    const handleSort = (field) => {
        onSort(field);
    };

    const handleViewClick = (request) => {
        onView(request);
    };

    const handleDeleteClick = (request) => {
        onDelete(request);
    };

    const handleEditClick = (request) => {
        onEdit(request);
    };

    const handleViewDisposalNoteClick = (request) => {
        if (onViewDisposalNote) {
            onViewDisposalNote(request);
        }
    };

    return (
        <div className="w-full">
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <div
                    className={`overflow-x-auto overflow-y-visible ${(disposalRequests || []).length === 0 ? "max-h-96" : ""}`}
                >
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                {/* STT */}
                                <TableHead className="font-semibold text-slate-900 px-4 py-2 text-center w-10">
                                    STT
                                </TableHead>

                                {/* Mã yêu cầu */}
                                <TableHead
                                    className="font-semibold text-slate-900 px-6 py-3 text-left"
                                    onClick={() => handleSort("disposalRequestId")}
                                >
                                    <div className="flex items-center space-x-2 cursor-pointer">
                                        <span>Mã yêu cầu</span>
                                        {sortField === "disposalRequestId" ? (
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

                                {/* Giao cho */}
                                {availableFields.hasAssignToName && (
                                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                        Giao cho
                                    </TableHead>
                                )}

                                {/* Thời gian xuất hủy */}
                                <TableHead
                                    className="font-semibold text-slate-900 px-6 py-3 text-center"
                                    onClick={() => handleSort("estimatedTimeDeparture")}
                                >
                                    <div className="flex items-center justify-center space-x-2 cursor-pointer max-w-[100px]">
                                        <span>Thời gian xuất hủy</span>
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
                            {(disposalRequests || []).length > 0 ? (
                                disposalRequests.map((request, index) => (
                                    <TableRow
                                        key={request.disposalRequestId || index}
                                        className="hover:bg-slate-50 border-b border-slate-200"
                                    >
                                        {/* STT */}
                                        <TableCell className="text-center px-6 py-4">
                                            {(pagination.current - 1) * pagination.pageSize + index + 1}
                                        </TableCell>

                                        {/* Mã yêu cầu */}
                                        <TableCell className="text-left px-6 py-4 max-w-[180px] break-words whitespace-normal">
                                            {request?.disposalRequestId || "-"}
                                        </TableCell>

                                        {/* Người tạo */}
                                        {availableFields.hasCreatedByName && (
                                            <TableCell className="text-center px-6 py-4">
                                                {request.createdByName || "-"}
                                            </TableCell>
                                        )}

                                        {/* Người duyệt */}
                                        {availableFields.hasApprovalByName && (
                                            <TableCell className="px-6 py-4 text-slate-700 text-center">
                                                {request.approvalByName || request.approvalBy ? (
                                                    <span className="text-green-600 font-medium">
                                                        {request.approvalByName || request.approvalBy}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">Chưa duyệt</span>
                                                )}
                                            </TableCell>
                                        )}

                                        {/* Giao cho */}
                                        {availableFields.hasAssignToName && (
                                            <TableCell className="text-center px-6 py-4 text-purple-600 font-medium">
                                                {request.assignToName || "-"}
                                            </TableCell>
                                        )}

                                        {/* Thời gian xuất hủy */}
                                        <TableCell className="text-center px-6 py-4">
                                            {request.estimatedTimeDeparture ? (
                                                <>
                                                    {new Date(request.estimatedTimeDeparture).toLocaleDateString("vi-VN")}
                                                </>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>

                                        {/* Ngày tạo */}
                                        <TableCell className="text-center px-6 py-4">
                                            {request.createdAt
                                                ? new Date(request.createdAt).toLocaleString("vi-VN", {
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
                                            <StatusDisplayDisposalRequest status={request.status} />
                                        </TableCell>

                                        {/* Thao tác */}
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                {/* View Button - Always visible for all roles */}
                                                <PermissionWrapper requiredPermission={PERMISSIONS.DISPOSAL_REQUEST_VIEW_DETAILS}>
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Xem chi tiết"
                                                        onClick={() => handleViewClick(request)}
                                                    >
                                                        <Eye className="h-4 w-4 text-orange-500" />
                                                    </button>
                                                </PermissionWrapper>

                                                {/* View Disposal Note Button - Warehouse Manager and Warehouse Staff - Only show when disposal note exists (status >= Picking, because disposal note is created when warehouse staff clicks "Tạo phiếu xuất hủy") */}
                                                {(isWarehouseManager || isWarehouseStaff) && 
                                                 request.status && 
                                                 request.status >= DISPOSAL_REQUEST_STATUS.Picking && (
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Xem phiếu xuất hủy"
                                                        onClick={() => handleViewDisposalNoteClick(request)}
                                                    >
                                                        <FileText className="h-4 w-4 text-green-600" />
                                                    </button>
                                                )}

                                                {/* Edit Button - Warehouse Manager for Draft/Rejected */}
                                                {(request.status === 1 || request.status === 3) && (
                                                    <PermissionWrapper requiredPermission={PERMISSIONS.DISPOSAL_REQUEST_UPDATE}>
                                                        <button
                                                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                            title="Chỉnh sửa"
                                                            onClick={() => handleEditClick(request)}
                                                        >
                                                            <Edit className="h-4 w-4 text-yellow-500" />
                                                        </button>
                                                    </PermissionWrapper>
                                                )}

                                                {/* Delete Button - Warehouse Manager for Draft */}
                                                {request.status === 1 && (
                                                    <PermissionWrapper requiredPermission={PERMISSIONS.DISPOSAL_REQUEST_DELETE}>
                                                        <button
                                                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                            title="Xóa"
                                                            onClick={() => handleDeleteClick(request)}
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
                                    title="Không tìm thấy yêu cầu xuất hủy nào"
                                    description="Chưa có yêu cầu xuất hủy nào trong hệ thống"
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

export default DisposalTable;

