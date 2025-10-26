import React from 'react';

// Định nghĩa các trạng thái đơn hàng mua
export const PURCHASE_ORDER_STATUS = {
  Draft: 1,
  PendingApproval: 2,
  Rejected: 3,
  Approved: 4,
  GoodsReceived: 5,
  AssignedForReceiving: 6,
  Receiving: 7,
  Inspected: 8,
  Completed: 9
};

// Chuyển đổi trạng thái sang tiếng Việt
export const STATUS_LABELS = {
  [PURCHASE_ORDER_STATUS.Draft]: 'Bản nháp',
  [PURCHASE_ORDER_STATUS.PendingApproval]: 'Chờ duyệt',
  [PURCHASE_ORDER_STATUS.Rejected]: 'Từ chối',
  [PURCHASE_ORDER_STATUS.Approved]: 'Đã duyệt',
  [PURCHASE_ORDER_STATUS.GoodsReceived]: 'Đã giao đến',
  [PURCHASE_ORDER_STATUS.AssignedForReceiving]: 'Đã phân công',
  [PURCHASE_ORDER_STATUS.Receiving]: 'Đã nhận hàng',
  [PURCHASE_ORDER_STATUS.Inspected]: 'Đã kiểm nhập',
  [PURCHASE_ORDER_STATUS.Completed]: 'Đã nhập kho'
};

// Màu sắc cho từng trạng thái
export const STATUS_COLORS = {
  [PURCHASE_ORDER_STATUS.Draft]: 'bg-gray-100 text-gray-800',
  [PURCHASE_ORDER_STATUS.PendingApproval]: 'bg-yellow-100 text-yellow-800',
  [PURCHASE_ORDER_STATUS.Rejected]: 'bg-red-100 text-red-800',
  [PURCHASE_ORDER_STATUS.Approved]: 'bg-blue-100 text-blue-800',
  [PURCHASE_ORDER_STATUS.GoodsReceived]: 'bg-green-100 text-green-800',
  [PURCHASE_ORDER_STATUS.AssignedForReceiving]: 'bg-purple-100 text-purple-800',
  [PURCHASE_ORDER_STATUS.Receiving]: 'bg-orange-100 text-orange-800',
  [PURCHASE_ORDER_STATUS.Inspected]: 'bg-indigo-100 text-indigo-800',
  [PURCHASE_ORDER_STATUS.Completed]: 'bg-emerald-100 text-emerald-800'
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
      <h3 className="text-lg font-semibold mb-4">Tất cả trạng thái đơn hàng mua:</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(PURCHASE_ORDER_STATUS).map((status) => (
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
