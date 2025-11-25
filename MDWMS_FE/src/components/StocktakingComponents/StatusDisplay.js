import React from 'react';

// Định nghĩa các trạng thái phiếu kiểm kê
export const STOCKTAKING_STATUS = {
    Draft: 1,                    // Nháp
    Assigned: 2,                 // Đã phân công
    Cancelled: 3,                // Đã huỷ
    InProgress: 4,               // Đang kiểm kê
    PendingApproval: 5,          // Chờ duyệt
    Approved: 6,                 // Đã duyệt
    Completed: 7                 // Đã hoàn thành
};

// Chuyển đổi trạng thái sang tiếng Việt
export const STATUS_LABELS = {
    [STOCKTAKING_STATUS.Draft]: 'Nháp',
    [STOCKTAKING_STATUS.Assigned]: 'Đã phân công',
    [STOCKTAKING_STATUS.Cancelled]: 'Đã huỷ',
    [STOCKTAKING_STATUS.InProgress]: 'Đang kiểm kê',
    [STOCKTAKING_STATUS.PendingApproval]: 'Chờ duyệt',
    [STOCKTAKING_STATUS.Approved]: 'Đã duyệt',
    [STOCKTAKING_STATUS.Completed]: 'Đã hoàn thành'
};

// Màu sắc cho từng trạng thái
export const STATUS_COLORS = {
    [STOCKTAKING_STATUS.Draft]: 'bg-gray-100 text-gray-800',
    [STOCKTAKING_STATUS.Assigned]: 'bg-blue-100 text-blue-800',
    [STOCKTAKING_STATUS.Cancelled]: 'bg-red-100 text-red-800',
    [STOCKTAKING_STATUS.InProgress]: 'bg-orange-100 text-orange-800',
    [STOCKTAKING_STATUS.PendingApproval]: 'bg-yellow-100 text-yellow-800',
    [STOCKTAKING_STATUS.Approved]: 'bg-green-100 text-green-800',
    [STOCKTAKING_STATUS.Completed]: 'bg-emerald-100 text-emerald-800'
};

// Component hiển thị trạng thái
const StatusDisplay = ({ status, className = '' }) => {
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

// Component hiển thị danh sách tất cả trạng thái (để test)
const AllStatusDisplay = () => {
    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-4">Tất cả trạng thái phiếu kiểm kê:</h3>
            <div className="grid grid-cols-2 gap-2">
                {Object.values(STOCKTAKING_STATUS).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                        <span className="text-sm font-mono">{status}:</span>
                        <StatusDisplay status={status} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusDisplay;
export { AllStatusDisplay };

