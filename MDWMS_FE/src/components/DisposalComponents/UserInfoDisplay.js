import React from 'react';
import { UserCircle, UserCheck2, UserX2, UserCog } from 'lucide-react';
import { DISPOSAL_REQUEST_STATUS, PERMISSIONS } from '../../utils/permissions';

/**
 * Hiển thị thông tin người tạo, duyệt, từ chối, phân công cho Disposal Request theo role/quyền
 */
const UserInfoDisplay = ({ request, formatDate, hasPermission, userInfo }) => {
    if (!request) return null;

    const status = request.status;

    const canViewApprovalInfo = () => {
        // Warehouse Manager: ẩn khi Rejected
        if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM)) {
            return status !== DISPOSAL_REQUEST_STATUS.Rejected;
        }
        // Sale Manager: hiển thị khi Approved trở lên
        if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM)) {
            return status === DISPOSAL_REQUEST_STATUS.Approved ||
                status === DISPOSAL_REQUEST_STATUS.AssignedForPicking ||
                status === DISPOSAL_REQUEST_STATUS.Picking ||
                status === DISPOSAL_REQUEST_STATUS.Completed;
        }
        // Warehouse Staff: hiển thị khi Assigned trở lên
        if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS)) {
            return status === DISPOSAL_REQUEST_STATUS.AssignedForPicking ||
                status === DISPOSAL_REQUEST_STATUS.Picking ||
                status === DISPOSAL_REQUEST_STATUS.Completed;
        }
        return true;
    };

    const canViewRejectionInfo = () => {
        // Tất cả roles: hiển thị khi Rejected
        return status === DISPOSAL_REQUEST_STATUS.Rejected;
    };

    const canViewAssignInfo = () => {
        // Warehouse Manager/Staff thấy khi đã Assigned/Picking/Completed
        if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WM)) {
            return status === DISPOSAL_REQUEST_STATUS.AssignedForPicking ||
                status === DISPOSAL_REQUEST_STATUS.Picking ||
                status === DISPOSAL_REQUEST_STATUS.Completed ||
                status === DISPOSAL_REQUEST_STATUS.Approved; // để quản lý kho xem sau khi duyệt
        }
        // Warehouse Staff: chỉ thấy khi đã Assigned/Picking/Completed
        if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_WS)) {
            return status === DISPOSAL_REQUEST_STATUS.AssignedForPicking ||
                status === DISPOSAL_REQUEST_STATUS.Picking ||
                status === DISPOSAL_REQUEST_STATUS.Completed;
        }
        // Sale Manager: có thể xem khi Approved trở lên
        if (hasPermission(PERMISSIONS.DISPOSAL_REQUEST_VIEW_SM)) {
            return status === DISPOSAL_REQUEST_STATUS.Approved ||
                status === DISPOSAL_REQUEST_STATUS.AssignedForPicking ||
                status === DISPOSAL_REQUEST_STATUS.Picking ||
                status === DISPOSAL_REQUEST_STATUS.Completed;
        }
        return true;
    };

    const getCreatedByName = () => request.createdBy?.fullName || request.createdByName || 'Chưa có thông tin';
    const getCreatedAt = () => formatDate(request.createdAt);

    const getApprovedByName = () => request.approvalBy?.fullName || request.approvalByName || 'Chưa có thông tin';
    const getApprovedAt = () => request.approvalBy ? formatDate(request.approvalAt || request.updateAt) : 'Chưa có thông tin';

    const getRejectedByName = () => request.approvalBy?.fullName || request.approvalByName || 'Chưa có thông tin';

    const getRejectedAt = () => request.approvalBy ? formatDate(request.approvalAt || request.updateAt) : 'Chưa có thông tin';

    const getAssignToName = () => request.assignTo?.fullName || request.assignToName || 'Chưa có thông tin';

    const getAssignedAt = () => request.assignTo ? formatDate(request.assignAt || request.updateAt) : 'Chưa có thông tin';

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
                        <input type="text" value={status === DISPOSAL_REQUEST_STATUS.Rejected ? 'Chưa duyệt' : getApprovedByName()} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                        <input type="text" value={status === DISPOSAL_REQUEST_STATUS.Rejected ? 'Chưa duyệt' : getApprovedAt()} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
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
                        <input type="text" value={status === DISPOSAL_REQUEST_STATUS.Rejected ? getRejectedByName() : 'Chưa từ chối'} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                        <input type="text" value={status === DISPOSAL_REQUEST_STATUS.Rejected ? getRejectedAt() : 'Chưa từ chối'} readOnly className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm" />
                        {status === DISPOSAL_REQUEST_STATUS.Rejected && request.rejectionReason && (
                            <div className="mt-2">
                                <label className="text-xs font-medium text-gray-600 block mb-1">Lý do từ chối:</label>
                                <textarea value={request.rejectionReason} readOnly className="w-full bg-red-50 border border-red-200 rounded px-2 py-1 text-sm text-red-800 resize-none" rows="2" />
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

