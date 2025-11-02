import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { usePermissions } from '../../hooks/usePermissions';

const RePickModal = ({
    isOpen,
    onClose,
    onConfirm,
    itemDetail,
    loading = false,
}) => {
    const { isWarehouseStaff, isWarehouseManager } = usePermissions();
    const [rejectionReason, setRejectionReason] = useState('');

    const handleConfirm = () => {
        // Warehouse Manager must provide reason, Staff doesn't
        if (isWarehouseManager && !rejectionReason.trim()) {
            return;
        }
        onConfirm(rejectionReason);
    };

    const handleClose = () => {
        setRejectionReason('');
        onClose();
    };

    if (!isOpen) return null;

    const isDisabled = loading || (isWarehouseManager && !rejectionReason.trim());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                            <RefreshCcw className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Yêu cầu lấy lại
                            </h3>
                            <p className="text-sm text-gray-500">
                                Yêu cầu lấy lại hàng hóa
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Item Info */}
                    {itemDetail && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                <span className="font-medium text-gray-900">
                                    Thông tin hàng hóa
                                </span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tên hàng hóa:</span>
                                    <span className="font-medium">
                                        {itemDetail.goodsName || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã hàng:</span>
                                    <span className="font-medium">
                                        {itemDetail.goodsCode || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Số lượng:</span>
                                    <span className="font-medium">
                                        {itemDetail.requiredPackageQuantity || 0} thùng
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lý do {isWarehouseManager && <span className="text-red-500">*</span>}
                        </label>
                        <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={isWarehouseManager ? "Nhập lý do yêu cầu lấy lại (bắt buộc)..." : "Nhập lý do yêu cầu lấy lại (tùy chọn)..."}
                            className="w-full"
                            rows={2}
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {isWarehouseManager
                                ? 'Quản lý kho phải cung cấp lý do khi yêu cầu lấy lại hàng.'
                                : 'Nhập lý do để người lấy hàng hiểu và xử lý.'}
                        </p>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-orange-800 mb-1">
                                    Xác nhận yêu cầu lấy lại
                                </h4>
                                <p className="text-sm text-orange-700">
                                    Yêu cầu này sẽ chuyển trạng thái hàng hóa về <span className="font-semibold">"Đang lấy hàng"</span> và reset tất cả các pallet chưa được quét.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                        <Button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                            Hủy
                        </Button>

                        <Button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isDisabled}
                            className={`h-[38px] px-6 font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 ${
                                isDisabled
                                    ? 'bg-orange-300 cursor-not-allowed text-white'
                                    : 'bg-orange-600 hover:bg-orange-700 text-white hover:shadow-md'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <RefreshCcw className="w-4 h-4" />
                                    Xác nhận
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RePickModal;

