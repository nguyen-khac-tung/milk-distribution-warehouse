import React from 'react';
import { UserCircle, UserCheck2, UserX2, UserCog } from 'lucide-react';
import { SALES_ORDER_STATUS, PERMISSIONS } from '../../utils/permissions';

/**
 * Hiển thị thông tin người tạo, duyệt, từ chối, phân công cho Sales Order theo role/quyền
 */
const UserInfoDisplay = ({ order, formatDate, hasPermission, userInfo }) => {
    if (!order) return null;

    const status = order.status;

    const canViewApprovalInfo = () => {
        // Sales Rep: chỉ thấy duyệt khi trạng thái Approved trở lên
        if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SR)) {
            return status === SALES_ORDER_STATUS.Approved ||
                status === SALES_ORDER_STATUS.AssignedForPicking ||
                status === SALES_ORDER_STATUS.Picking ||
                status === SALES_ORDER_STATUS.Completed;
        }
        // Sale Manager, Warehouse roles: ẩn khi Rejected
        return status !== SALES_ORDER_STATUS.Rejected;
    };

    const canViewRejectionInfo = () => {
        // Sales Rep: chỉ thấy khi Rejected
        if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SR)) {
            return status === SALES_ORDER_STATUS.Rejected;
        }
        // Các role khác: hiển thị khi Rejected
        return status === SALES_ORDER_STATUS.Rejected;
    };

    const canViewAssignInfo = () => {
        // Warehouse Staff/Manager thấy khi đã Assigned/Picking/Completed
        if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WM)) {
            return status === SALES_ORDER_STATUS.AssignedForPicking ||
                status === SALES_ORDER_STATUS.Picking ||
                status === SALES_ORDER_STATUS.Completed ||
                status === SALES_ORDER_STATUS.Approved; // để quản lý kho xem sau khi duyệt
        }
        // Sales Rep: chỉ thấy khi đã Assigned/Picking/Completed
        if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SR)) {
            return status === SALES_ORDER_STATUS.AssignedForPicking ||
                status === SALES_ORDER_STATUS.Picking ||
                status === SALES_ORDER_STATUS.Completed;
        }
        // Sale Manager: có thể xem khi Approved trở lên
        if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SM)) {
            return status === SALES_ORDER_STATUS.Approved ||
                status === SALES_ORDER_STATUS.AssignedForPicking ||
                status === SALES_ORDER_STATUS.Picking ||
                status === SALES_ORDER_STATUS.Completed;
        }
        return true;
    };

    const getCreatedByName = () => order.createdBy?.fullName || order.createdByName || 'Chưa có thông tin';
    const getCreatedAt = () => formatDate(order.createdAt);

    const getApprovedByName = () => order.approvalBy?.fullName || order.approvalByName || 'Chưa có thông tin';
    const getApprovedAt = () => order.approvalBy ? formatDate(order.approvedAt || order.updatedAt) : 'Chưa có thông tin';

    const getRejectedByName = () => order.approvalBy?.fullName || order.approvalByName || 'Chưa có thông tin';
    const getRejectedAt = () => order.approvalBy ? formatDate(order.approvedAt || order.updatedAt) : 'Chưa có thông tin';

    const getAssignToName = () => order.assignTo?.fullName || order.assignToByName || 'Chưa có thông tin';
    const getAssignedAt = () => order.assignTo ? formatDate(order.assignedAt || order.updatedAt) : 'Chưa có thông tin';

    return (
        <div className="space-y-4">
            {/* Tạo bởi - Luôn hiển thị */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <UserCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Tạo bởi</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <input type="text" value={getCreatedByName()} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                    <input type="text" value={getCreatedAt()} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
            </div>

            {/* Duyệt bởi */}
            {canViewApprovalInfo() && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <UserCheck2 className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Duyệt bởi</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <input type="text" value={status === SALES_ORDER_STATUS.Rejected ? 'Chưa duyệt' : getApprovedByName()} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                        <input type="text" value={status === SALES_ORDER_STATUS.Rejected ? 'Chưa duyệt' : getApprovedAt()} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                    </div>
                </div>
            )}

            {/* Từ chối bởi */}
            {canViewRejectionInfo() && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <UserX2 className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-700">Từ chối bởi</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <input type="text" value={status === SALES_ORDER_STATUS.Rejected ? getRejectedByName() : 'Chưa từ chối'} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                        <input type="text" value={status === SALES_ORDER_STATUS.Rejected ? getRejectedAt() : 'Chưa từ chối'} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                        {status === SALES_ORDER_STATUS.Rejected && order.rejectionReason && (
                            <div className="mt-2">
                                <label className="text-xs font-medium text-gray-600 block mb-1">Lý do từ chối:</label>
                                <textarea value={order.rejectionReason} readOnly className="w-full bg-red-50 border border-red-200 rounded px-2 py-1 text-sm text-red-800 resize-none" rows="2" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Giao cho */}
            {canViewAssignInfo() && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <UserCog className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Giao cho</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <input type="text" value={getAssignToName()} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                        <input type="text" value={getAssignedAt()} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserInfoDisplay;


