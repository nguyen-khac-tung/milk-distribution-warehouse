import React from 'react';

// Định nghĩa các trạng thái đơn hàng
export const SALE_ORDER_STATUS = {
    Draft: 1,
    PendingApproval: 2,
    Rejected: 3,
    Approved: 4,
    AssignedForPicking: 5,
    Picking: 6,
    Completed: 7,
};

// Nhãn tiếng Việt
export const STATUS_LABELS = {
    [SALE_ORDER_STATUS.Draft]: 'Bản nháp',
    [SALE_ORDER_STATUS.PendingApproval]: 'Chờ duyệt',
    [SALE_ORDER_STATUS.Rejected]: 'Từ chối',
    [SALE_ORDER_STATUS.Approved]: 'Đã duyệt',
    [SALE_ORDER_STATUS.AssignedForPicking]: 'Đã phân công',
    [SALE_ORDER_STATUS.Picking]: 'Đang lấy hàng',
    [SALE_ORDER_STATUS.Completed]: 'Đã xuất kho',
};

// Màu sắc
export const STATUS_COLORS = {
    [SALE_ORDER_STATUS.Draft]: 'bg-gray-100 text-gray-800',
    [SALE_ORDER_STATUS.PendingApproval]: 'bg-yellow-100 text-yellow-800',
    [SALE_ORDER_STATUS.Rejected]: 'bg-red-100 text-red-800',
    [SALE_ORDER_STATUS.Approved]: 'bg-blue-100 text-blue-800',
    [SALE_ORDER_STATUS.AssignedForPicking]: 'bg-purple-100 text-purple-800',
    [SALE_ORDER_STATUS.Picking]: 'bg-orange-100 text-orange-800',
    [SALE_ORDER_STATUS.Completed]: 'bg-emerald-100 text-emerald-800',
};

const StatusDisplaySaleOrder = ({ status, className = '' }) => {
    const statusLabel = STATUS_LABELS[status] || 'Không xác định';
    const statusColor = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${className}`}
        >
            {statusLabel}
        </span>
    );
};

const AllStatusDisplay = () => (
    <div className="space-y-2">
        <h3 className="text-lg font-semibold mb-4">Tất cả trạng thái đơn hàng:</h3>
        <div className="grid grid-cols-2 gap-2">
            {Object.values(SALE_ORDER_STATUS).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{status}:</span>
                    <StatusDisplaySaleOrder status={status} />
                </div>
            ))}
        </div>
    </div>
);

export default StatusDisplaySaleOrder;
export { AllStatusDisplay };
