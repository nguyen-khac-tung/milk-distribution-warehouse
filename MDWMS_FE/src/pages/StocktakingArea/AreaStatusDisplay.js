import React from 'react';

// Trạng thái khu vực trong kiểm kê (theo backend StockAreaStatus)
export const STOCK_AREA_STATUS = {
    Assigned: 1,            // Đã Phân Công
    Pending: 2,             // Đang kiểm kê
    PendingApproval: 3,     // Chờ duyệt
    Completed: 4,           // Đã hoàn thành
    Cancelled: 5            // Đã huỷ
};

// Chuyển đổi trạng thái sang tiếng Việt
export const AREA_STATUS_LABELS = {
    [STOCK_AREA_STATUS.Assigned]: 'Đã Phân Công',
    [STOCK_AREA_STATUS.Pending]: 'Đang kiểm kê',
    [STOCK_AREA_STATUS.PendingApproval]: 'Chờ duyệt',
    [STOCK_AREA_STATUS.Completed]: 'Đã hoàn thành',
    [STOCK_AREA_STATUS.Cancelled]: 'Đã huỷ'
};

// Màu sắc cho từng trạng thái
export const AREA_STATUS_COLORS = {
    [STOCK_AREA_STATUS.Assigned]: 'bg-blue-100 text-blue-800',
    [STOCK_AREA_STATUS.Pending]: 'bg-orange-200 text-orange-800',
    [STOCK_AREA_STATUS.PendingApproval]: 'bg-yellow-100 text-yellow-800',
    [STOCK_AREA_STATUS.Completed]: 'bg-green-100 text-green-800',
    [STOCK_AREA_STATUS.Cancelled]: 'bg-red-100 text-red-800'
};

// Component hiển thị trạng thái khu vực
const AreaStatusDisplay = ({ status, className = '' }) => {
    const statusLabel = AREA_STATUS_LABELS[status] || 'Không xác định';
    const statusColor = AREA_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${className}`}
        >
            {statusLabel}
        </span>
    );
};

export default AreaStatusDisplay;

