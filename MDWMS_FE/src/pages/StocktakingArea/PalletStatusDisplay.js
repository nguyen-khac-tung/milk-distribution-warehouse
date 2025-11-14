import React from 'react';

// Trạng thái pallet trong kiểm kê (theo backend StockPalletStatus)
export const STOCK_PALLET_STATUS = {
    Unscanned: 1,        // Chưa quét
    Matched: 2,          // Đúng pallet
    Missing: 3,           // Thiếu pallet
    Surplus: 4           // Thừa pallet
};

// Chuyển đổi trạng thái sang tiếng Việt
export const PALLET_STATUS_LABELS = {
    [STOCK_PALLET_STATUS.Unscanned]: 'Chưa quét',
    [STOCK_PALLET_STATUS.Matched]: 'Đúng pallet',
    [STOCK_PALLET_STATUS.Missing]: 'Thiếu pallet',
    [STOCK_PALLET_STATUS.Surplus]: 'Thừa pallet'
};

// Màu sắc cho từng trạng thái
export const PALLET_STATUS_COLORS = {
    [STOCK_PALLET_STATUS.Unscanned]: 'bg-gray-100 text-gray-800',
    [STOCK_PALLET_STATUS.Matched]: 'bg-green-100 text-green-800',
    [STOCK_PALLET_STATUS.Missing]: 'bg-red-100 text-red-800',
    [STOCK_PALLET_STATUS.Surplus]: 'bg-yellow-100 text-yellow-800'
};

// Component hiển thị trạng thái pallet
const PalletStatusDisplay = ({ status, className = '' }) => {
    const statusLabel = PALLET_STATUS_LABELS[status] || 'Không xác định';
    const statusColor = PALLET_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${className}`}
        >
            {statusLabel}
        </span>
    );
};

export default PalletStatusDisplay;

