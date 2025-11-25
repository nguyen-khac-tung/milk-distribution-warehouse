import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Edit, X, Trash2, PlayCircle, FileText } from 'lucide-react';
import EmptyState from '../../components/Common/EmptyState';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { PERMISSIONS } from '../../utils/permissions';
import { Package } from 'lucide-react';
import StatusDisplay, { STOCKTAKING_STATUS } from '../../components/StocktakingComponents/StatusDisplay';
import { usePermissions } from '../../hooks/usePermissions';

const StocktakingTable = ({
    stocktakings,
    pagination,
    sortField,
    sortAscending,
    onSort,
    onView,
    onEdit,
    onCancel,
    onDelete,
    onClearFilters,
    onStartStocktaking,
    loading
}) => {
    const { isWarehouseManager, isWarehouseStaff } = usePermissions();
    const navigate = useNavigate();

    // Detect available fields in data
    const availableFields = useMemo(() => {
        if (!stocktakings || stocktakings.length === 0) {
            return {
                hasCreateByName: false,
                hasStartTime: false,
                hasStatus: false
            };
        }

        const firstItem = stocktakings[0];
        return {
            hasCreateByName: firstItem.createByName !== undefined || firstItem.createdBy !== undefined,
            hasStartTime: firstItem.startTime !== undefined,
            hasStatus: firstItem.status !== undefined
        };
    }, [stocktakings]);

    const handleSort = (field) => {
        onSort(field);
    };

    const handleViewClick = (stocktaking) => {
        onView(stocktaking);
    };

    const handleEditClick = (stocktaking) => {
        onEdit(stocktaking);
    };

    const handleCancelClick = (stocktaking) => {
        onCancel(stocktaking);
    };

    const handleDeleteClick = (stocktaking) => {
        onDelete(stocktaking);
    };

    const handleStartStocktakingClick = (stocktaking) => {
        onStartStocktaking(stocktaking);
    };

    const handleViewDetailForOtherClick = (stocktaking) => {
        if (stocktaking?.stocktakingSheetId) {
            navigate(`/stocktaking-area-detail-other/${stocktaking.stocktakingSheetId}`);
        }
    };

    // Use all data from backend (pagination is handled by backend)
    const paginatedStocktakings = useMemo(() => {
        if (!stocktakings || !Array.isArray(stocktakings)) {
            return [];
        }

        // Backend already handles pagination, so return all data
        return stocktakings;
    }, [stocktakings]);

    return (
        <div className="w-full">
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <div className={`overflow-x-auto overflow-y-visible ${(paginatedStocktakings || []).length === 0 ? 'max-h-96' : ''}`}>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-16">
                                    STT
                                </TableHead>
                                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                    <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("stocktakingSheetId")}>
                                        <span>Mã phiếu kiểm kê</span>
                                        {sortField === "stocktakingSheetId" ? (
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
                                {availableFields.hasCreateByName && (
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
                                {availableFields.hasStartTime && (
                                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("startTime")}>
                                            <span>Thời gian bắt đầu</span>
                                            {sortField === "startTime" ? (
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
                                {availableFields.hasStatus && (
                                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                        <span>Trạng thái</span>
                                    </TableHead>
                                )}
                                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                    <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("createdAt")}>
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
                                <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(paginatedStocktakings || []).length > 0 ? (
                                (paginatedStocktakings || []).map((stocktaking, index) => (
                                    <TableRow
                                        key={index}
                                        className="hover:bg-slate-50 border-b border-slate-200 min-h-[60px]"
                                    >
                                        <TableCell className="px-6 py-4 text-slate-600 font-medium text-center">
                                            {(pagination.current - 1) * pagination.pageSize + index + 1}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-slate-700 text-left">
                                            <span className="font-bold">
                                                {stocktaking.stocktakingSheetId || '-'}
                                            </span>
                                        </TableCell>
                                        {availableFields.hasCreateByName && (
                                            <TableCell className="px-6 py-4 text-slate-700 text-center">
                                                {stocktaking.createByName || stocktaking.createdBy || '-'}
                                            </TableCell>
                                        )}
                                        {availableFields.hasStartTime && (
                                            <TableCell className="px-6 py-4 text-slate-700 text-center">
                                                {stocktaking.startTime ? (() => {
                                                    const date = new Date(stocktaking.startTime);
                                                    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                                    const dateStr = date.toLocaleDateString('vi-VN');
                                                    return `${time} ${dateStr}`;
                                                })() : '-'}
                                            </TableCell>
                                        )}
                                        {availableFields.hasStatus && (
                                            <TableCell className="px-6 py-4 text-center">
                                                <StatusDisplay status={stocktaking.status} />
                                            </TableCell>
                                        )}
                                        <TableCell className="px-6 py-4 text-slate-700 text-center">
                                            {stocktaking.createdAt ? (() => {
                                                const date = new Date(stocktaking.createdAt);
                                                const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                                const dateStr = date.toLocaleDateString('vi-VN');
                                                return `${time} ${dateStr}`;
                                            })() : '-'}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                {/* Icon bắt đầu / xem lại kiểm kê dựa trên stockAreaStarted
                                                    stockAreaStarted === 1 hoặc === 3: Chưa bắt đầu -> icon xanh lá "Bắt đầu kiểm kê" (cần gọi API)
                                                    stockAreaStarted === 2: Đã bắt đầu -> icon xanh dương "Xem chi tiết kiểm kê" (chỉ xem)
                                                */}
                                                {(() => {
                                                    const stockAreaStarted = stocktaking.stockAreaStarted;
                                                    const status = stocktaking.status;

                                                    let shouldShowIcon = false;
                                                    let isNotStarted = false; // true = chưa bắt đầu (1 hoặc 3), false = đã bắt đầu (2)

                                                    if (stockAreaStarted !== undefined && stockAreaStarted !== null) {
                                                        // Có giá trị từ API
                                                        // 1 hoặc 3 = chưa bắt đầu -> icon xanh lá "Bắt đầu kiểm kê"
                                                        // 2 = đã bắt đầu -> icon xanh dương "Xem chi tiết kiểm kê"
                                                        shouldShowIcon = stockAreaStarted === 1 || stockAreaStarted === 2 || stockAreaStarted === 3 ||
                                                            stockAreaStarted === '1' || stockAreaStarted === '2' || stockAreaStarted === '3';
                                                        isNotStarted = stockAreaStarted === 1 || stockAreaStarted === 3 ||
                                                            stockAreaStarted === '1' || stockAreaStarted === '3'; // 1 hoặc 3 = chưa bắt đầu
                                                    } else {
                                                        // Fallback dựa trên status nếu không có giá trị từ API
                                                        // Status Assigned (2) = chưa bắt đầu
                                                        if (status === STOCKTAKING_STATUS.Assigned || status === 2 || status === '2') {
                                                            shouldShowIcon = true;
                                                            isNotStarted = true; // Chưa bắt đầu, cần gọi API
                                                        } else if (status === STOCKTAKING_STATUS.InProgress || status === 4 || status === '4' ||
                                                            status === STOCKTAKING_STATUS.PendingApproval || status === 5 || status === '5' ||
                                                            status === STOCKTAKING_STATUS.Approved || status === 6 || status === '6' ||
                                                            status === STOCKTAKING_STATUS.Completed || status === 7 || status === '7') {
                                                            shouldShowIcon = true;
                                                            isNotStarted = false; // Đã bắt đầu, chỉ xem
                                                        }
                                                    }

                                                    return shouldShowIcon && (
                                                        <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_IN_PROGRESS}>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title={isNotStarted ? "Bắt đầu kiểm kê" : "Xem chi tiết kiểm kê"}
                                                                onClick={() => handleStartStocktakingClick(stocktaking)}
                                                            >
                                                                <PlayCircle className={`h-4 w-4 ${isNotStarted ? 'text-green-500' : 'text-blue-500'}`} />
                                                            </button>
                                                        </PermissionWrapper>
                                                    );
                                                })()}
                                                <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_DETAILS}>
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Xem chi tiết"
                                                        onClick={() => handleViewClick(stocktaking)}
                                                    >
                                                        <Eye className="h-4 w-4 text-orange-500" />
                                                    </button>
                                                </PermissionWrapper>
                                                {/* Icon xem chi tiết đơn kiểm kê kho - hiển thị cho các trạng thái khác (có permission, trừ nhân viên kho ở các trạng thái đã xử lý riêng) */}
                                                {(!isWarehouseStaff ||
                                                    (stocktaking.status !== STOCKTAKING_STATUS.PendingApproval &&
                                                        stocktaking.status !== 5 &&
                                                        stocktaking.status !== '5' &&
                                                        stocktaking.status !== STOCKTAKING_STATUS.Approved &&
                                                        stocktaking.status !== 6 &&
                                                        stocktaking.status !== '6' &&
                                                        stocktaking.status !== STOCKTAKING_STATUS.Completed &&
                                                        stocktaking.status !== 7 &&
                                                        stocktaking.status !== '7')) &&
                                                    (stocktaking.status === STOCKTAKING_STATUS.InProgress ||
                                                        stocktaking.status === 4 ||
                                                        stocktaking.status === '4' ||
                                                        stocktaking.status === STOCKTAKING_STATUS.PendingApproval ||
                                                        stocktaking.status === 5 ||
                                                        stocktaking.status === '5' ||
                                                        stocktaking.status === STOCKTAKING_STATUS.Approved ||
                                                        stocktaking.status === 6 ||
                                                        stocktaking.status === '6' ||
                                                        stocktaking.status === STOCKTAKING_STATUS.Completed ||
                                                        stocktaking.status === 7 ||
                                                        stocktaking.status === '7') && (
                                                        <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_AREA_VIEW_DETAILS_FOR_OTHER}>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Xem chi tiết đơn kiểm kê kho"
                                                                onClick={() => handleViewDetailForOtherClick(stocktaking)}
                                                            >
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                            </button>
                                                        </PermissionWrapper>
                                                    )}
                                                {isWarehouseManager && (stocktaking.status === STOCKTAKING_STATUS.Draft || stocktaking.status === 1 || stocktaking.status === '1') && (
                                                    <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_UPDATE}>
                                                        <button
                                                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                            title="Chỉnh sửa"
                                                            onClick={() => handleEditClick(stocktaking)}
                                                        >
                                                            <Edit className="h-4 w-4 text-orange-500" />
                                                        </button>
                                                    </PermissionWrapper>
                                                )}
                                                {isWarehouseManager && (
                                                    (stocktaking.status === STOCKTAKING_STATUS.Assigned || stocktaking.status === 2 || stocktaking.status === '2') ||
                                                    (stocktaking.status === STOCKTAKING_STATUS.InProgress || stocktaking.status === 4 || stocktaking.status === '4') ||
                                                    (stocktaking.status === STOCKTAKING_STATUS.PendingApproval || stocktaking.status === 5 || stocktaking.status === '5')
                                                ) && (
                                                        <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_DELETE}>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Hủy phiếu kiểm kê"
                                                                onClick={() => handleCancelClick(stocktaking)}
                                                            >
                                                                <X className="h-4 w-4 text-red-500" />
                                                            </button>
                                                        </PermissionWrapper>
                                                    )}
                                                {isWarehouseManager && (stocktaking.status === STOCKTAKING_STATUS.Draft || stocktaking.status === 1 || stocktaking.status === '1') && (
                                                    <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_DELETE}>
                                                        <button
                                                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                            title="Xóa phiếu kiểm kê"
                                                            onClick={() => handleDeleteClick(stocktaking)}
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
                                    title="Không tìm thấy phiếu kiểm kê nào"
                                    description="Chưa có phiếu kiểm kê nào trong hệ thống"
                                    actionText="Xóa bộ lọc"
                                    onAction={onClearFilters}
                                    showAction={false}
                                    colSpan={2 + Object.values(availableFields).filter(Boolean).length + 3}
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default StocktakingTable;

