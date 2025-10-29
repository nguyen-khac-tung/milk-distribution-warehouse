import React from 'react';
import { UserCircle, UserCheck2, UserX2, UserCog, UserMinus } from 'lucide-react';
import { PURCHASE_ORDER_STATUS, PERMISSIONS } from '../../utils/permissions';

/**
 * Component hiển thị thông tin người tạo, duyệt, từ chối, giao cho, xác nhận cho Purchase Order
 * @param {Object} props
 * @param {Object} props.order - Purchase order
 * @param {Function} props.formatDate - Function format ngày tháng
 * @param {Function} props.hasPermission - Function kiểm tra quyền hạn
 * @param {Object} props.userInfo - Thông tin user hiện tại
 */
const UserInfoDisplay = ({
    order,
    formatDate,
    hasPermission,
    userInfo
}) => {
    if (!order) return null;

    const status = order.status;

    // Debug: Log để xem data thực tế
    console.log('UserInfoDisplay - Status:', status);
    console.log('UserInfoDisplay - approvalBy:', order.approvalBy);
    console.log('UserInfoDisplay - approvalByName:', order.approvalByName);
    console.log('UserInfoDisplay - updatedAt:', order.updatedAt);
    console.log('UserInfoDisplay - note:', order.note);

    // Logic hiển thị theo role và trạng thái
    const canViewApprovalInfo = () => {
        // Nhân viên kinh doanh ở trạng thái Draft và PendingApproval chỉ thấy "Tạo bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) &&
            (status === PURCHASE_ORDER_STATUS.Draft || status === PURCHASE_ORDER_STATUS.PendingApproval)) {
            return false;
        }
        // Nhân viên kinh doanh ở trạng thái Approved thấy "Duyệt bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.Approved) {
            return true;
        }
        // Nhân viên kinh doanh ở trạng thái Rejected không thấy "Duyệt bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.Rejected) {
            return false;
        }
        // Quản lý kinh doanh: nếu bị từ chối thì ẩn "Duyệt bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_SM) && status === PURCHASE_ORDER_STATUS.Rejected) {
            return false; // Ẩn "Duyệt bởi" khi bị từ chối
        }
        // Quản lý kho: nếu bị từ chối thì ẩn "Duyệt bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM) && status === PURCHASE_ORDER_STATUS.Rejected) {
            return false; // Ẩn "Duyệt bởi" khi bị từ chối
        }
        return true; // Các trường hợp khác đều thấy
    };

    const canViewRejectionInfo = () => {
        // Nhân viên kinh doanh ở trạng thái Draft và PendingApproval chỉ thấy "Tạo bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) &&
            (status === PURCHASE_ORDER_STATUS.Draft || status === PURCHASE_ORDER_STATUS.PendingApproval)) {
            return false;
        }
        // Nhân viên kinh doanh ở trạng thái Approved không thấy "Từ chối bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.Approved) {
            return false;
        }
        // Nhân viên kinh doanh ở trạng thái Rejected thấy "Từ chối bởi" và note
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.Rejected) {
            return true;
        }
        // Nhân viên kinh doanh ở trạng thái đã giao hàng không thấy "Từ chối bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) &&
            (status === PURCHASE_ORDER_STATUS.GoodsReceived ||
                status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
                status === PURCHASE_ORDER_STATUS.Receiving ||
                status === PURCHASE_ORDER_STATUS.Checked ||
                status === PURCHASE_ORDER_STATUS.Completed)) {
            return false;
        }
        // Quản lý kinh doanh: nếu đã duyệt, đã nhận hàng, hoặc đã giao hàng thì ẩn "Từ chối bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_SM) &&
            (status === PURCHASE_ORDER_STATUS.Approved ||
                status === PURCHASE_ORDER_STATUS.GoodsReceived ||
                status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
                status === PURCHASE_ORDER_STATUS.Receiving ||
                status === PURCHASE_ORDER_STATUS.Checked ||
                status === PURCHASE_ORDER_STATUS.Completed)) {
            return false; // Ẩn "Từ chối bởi" khi đã duyệt, nhận hàng, hoặc giao hàng
        }
        // Quản lý kho: nếu đã duyệt, đã nhận hàng, hoặc đã giao hàng thì ẩn "Từ chối bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM) &&
            (status === PURCHASE_ORDER_STATUS.Approved ||
                status === PURCHASE_ORDER_STATUS.GoodsReceived ||
                status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
                status === PURCHASE_ORDER_STATUS.Receiving ||
                status === PURCHASE_ORDER_STATUS.Checked ||
                status === PURCHASE_ORDER_STATUS.Completed)) {
            return false; // Ẩn "Từ chối bởi" khi đã duyệt, nhận hàng, hoặc giao hàng
        }
        // Nhân viên kho: nếu trạng thái là AssignedForReceiving (Đã phân công) thì ẩn "Từ chối bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS) && status === PURCHASE_ORDER_STATUS.AssignedForReceiving) {
            return false; // Ẩn "Từ chối bởi" khi đã phân công
        }
        // Nhân viên kho: nếu trạng thái là Receiving (Đang tiếp nhận) thì ẩn "Từ chối bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS) && status === PURCHASE_ORDER_STATUS.Receiving) {
            return false; // Ẩn "Từ chối bởi" khi đang tiếp nhận
        }
        return true; // Các trường hợp khác đều thấy
    };

    const canViewOtherInfo = () => {
        // Nhân viên kinh doanh ở trạng thái Draft và PendingApproval chỉ thấy "Tạo bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) &&
            (status === PURCHASE_ORDER_STATUS.Draft || status === PURCHASE_ORDER_STATUS.PendingApproval)) {
            return false;
        }
        // Nhân viên kinh doanh ở trạng thái Approved chỉ thấy "Tạo bởi" và "Duyệt bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.Approved) {
            return false;
        }
        // Nhân viên kinh doanh ở trạng thái Rejected chỉ thấy "Tạo bởi" và "Từ chối bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.Rejected) {
            return false;
        }
        // Nhân viên kinh doanh ở trạng thái GoodsReceived chỉ thấy "Tạo bởi" và "Duyệt bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.GoodsReceived) {
            return false;
        }
        // Nhân viên kinh doanh ở trạng thái AssignedForReceiving (Đã phân công) không thấy "Giao cho" và "Xác nhận hàng giao đến"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.AssignedForReceiving) {
            return false;
        }
        // Nhân viên kinh doanh ở trạng thái Receiving (Đã nhận hàng) chỉ thấy "Tạo bởi" và "Duyệt bởi"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) && status === PURCHASE_ORDER_STATUS.Receiving) {
            return false;
        }
        // Nhân viên kinh doanh ở các trạng thái khác thấy "Giao cho" và "Xác nhận hàng giao đến"
        if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS) &&
            status !== PURCHASE_ORDER_STATUS.Draft &&
            status !== PURCHASE_ORDER_STATUS.PendingApproval &&
            status !== PURCHASE_ORDER_STATUS.Approved &&
            status !== PURCHASE_ORDER_STATUS.Rejected &&
            status !== PURCHASE_ORDER_STATUS.GoodsReceived &&
            status !== PURCHASE_ORDER_STATUS.AssignedForReceiving &&
            status !== PURCHASE_ORDER_STATUS.Receiving) {
            return true;
        }
        return true; // Các trường hợp khác đều thấy
    };

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
                    <input
                        type="text"
                        value={order.createdByName || 'Chưa có thông tin'}
                        readOnly
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <input
                        type="text"
                        value={formatDate(order.createdAt)}
                        readOnly
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                </div>
            </div>

            {/* Duyệt bởi - Hiển thị khi có quyền xem */}
            {canViewApprovalInfo() && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <UserCheck2 className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Duyệt bởi</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <input
                            type="text"
                            value={(status === PURCHASE_ORDER_STATUS.Approved ||
                                status === PURCHASE_ORDER_STATUS.GoodsReceived ||
                                status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
                                status === PURCHASE_ORDER_STATUS.Receiving ||
                                status === PURCHASE_ORDER_STATUS.Checked ||
                                status === PURCHASE_ORDER_STATUS.Completed) ?
                                (order.approvalByName || 'Chưa có thông tin') : 'Chưa duyệt'}
                            readOnly
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                            type="text"
                            value={(status === PURCHASE_ORDER_STATUS.Approved ||
                                status === PURCHASE_ORDER_STATUS.GoodsReceived ||
                                status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
                                status === PURCHASE_ORDER_STATUS.Receiving ||
                                status === PURCHASE_ORDER_STATUS.Checked ||
                                status === PURCHASE_ORDER_STATUS.Completed) ?
                                (order.approvalByName ? formatDate(order.updatedAt) : 'Chưa có thông tin') : 'Chưa duyệt'}
                            readOnly
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Từ chối bởi - Hiển thị khi có quyền xem */}
            {canViewRejectionInfo() && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <UserX2 className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-700">Từ chối bởi</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <input
                            type="text"
                            value={status === PURCHASE_ORDER_STATUS.Rejected ? (order.approvalByName || order.approvalBy || (order.note ? order.note.match(/\[([^\]]+)\]/)?.[1] : null) || 'Chưa có thông tin') : 'Chưa từ chối'}
                            readOnly
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                            type="text"
                            value={status === PURCHASE_ORDER_STATUS.Rejected ? (order.updatedAt ? formatDate(order.updatedAt) : 'Chưa có thông tin') : 'Chưa từ chối'}
                            readOnly
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        {/* Hiển thị lý do từ chối nếu có */}
                        {status === PURCHASE_ORDER_STATUS.Rejected && order.rejectionReason && (
                            <div className="mt-2">
                                <label className="text-xs font-medium text-gray-600 block mb-1">Lý do từ chối:</label>
                                <textarea
                                    value={order.rejectionReason}
                                    readOnly
                                    className="w-full bg-red-50 border border-red-200 rounded px-2 py-1 text-sm text-red-800 resize-none"
                                    rows="2"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Giao cho - Ẩn khi ở trạng thái Draft */}
            {canViewOtherInfo() && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <UserCog className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Giao cho</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <input
                            type="text"
                            value={order.assignToByName || 'Chưa có thông tin'}
                            readOnly
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                            type="text"
                            value={order.assignToByName ? formatDate(order.updatedAt) : 'Chưa có thông tin'}
                            readOnly
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Xác nhận hàng giao đến - Ẩn khi ở trạng thái Draft */}
            {canViewOtherInfo() && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <UserMinus className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-gray-700">Xác nhận hàng giao đến</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <input
                            type="text"
                            value={order.arrivalConfirmedByName || 'Chưa có thông tin'}
                            readOnly
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                            type="text"
                            value={order.arrivalConfirmedByName ? formatDate(order.updatedAt) : 'Chưa có thông tin'}
                            readOnly
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserInfoDisplay;
