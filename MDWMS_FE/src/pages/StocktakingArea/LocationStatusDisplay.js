import React from 'react';

// Trạng thái location trong kiểm kê (theo backend StockLocationStatus)
export const STOCK_LOCATION_STATUS = {
    Pending: 1,             // Đang chờ
    Counted: 2,             // Đã kiểm
    PendingApproval: 3,     // Chờ duyệt
    Completed: 4,           // Đã hoàn thành
    Cancelled: 5            // Đã huỷ
};

// Chuyển đổi trạng thái sang tiếng Việt
export const LOCATION_STATUS_LABELS = {
    [STOCK_LOCATION_STATUS.Pending]: 'Đang chờ',
    [STOCK_LOCATION_STATUS.Counted]: 'Đã kiểm',
    [STOCK_LOCATION_STATUS.PendingApproval]: 'Chờ duyệt',
    [STOCK_LOCATION_STATUS.Completed]: 'Đã hoàn thành',
    [STOCK_LOCATION_STATUS.Cancelled]: 'Đã huỷ'
};

// Màu sắc cho từng trạng thái
export const LOCATION_STATUS_COLORS = {
    [STOCK_LOCATION_STATUS.Pending]: 'bg-gray-100 text-gray-800',
    [STOCK_LOCATION_STATUS.Counted]: 'bg-blue-100 text-blue-800',
    [STOCK_LOCATION_STATUS.PendingApproval]: 'bg-yellow-100 text-yellow-800',
    [STOCK_LOCATION_STATUS.Completed]: 'bg-green-100 text-green-800',
    [STOCK_LOCATION_STATUS.Cancelled]: 'bg-red-100 text-red-800'
};

// Component hiển thị trạng thái location
const LocationStatusDisplay = ({ status, className = '' }) => {
    const statusLabel = LOCATION_STATUS_LABELS[status] || 'Không xác định';
    const statusColor = LOCATION_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${className}`}
        >
            {statusLabel}
        </span>
    );
};

export default LocationStatusDisplay;

