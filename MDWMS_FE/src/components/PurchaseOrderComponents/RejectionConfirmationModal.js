import React, { useState } from 'react';
import { X, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

const RejectionConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    purchaseOrder,
    loading = false
}) => {
    const [rejectionReason, setRejectionReason] = useState('');

    const handleConfirm = () => {
        if (rejectionReason.trim()) {
            onConfirm(rejectionReason.trim());
        }
    };

    const handleClose = () => {
        setRejectionReason('');
        onClose();
    };

    const isReasonValid = rejectionReason.trim().length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Từ chối đơn hàng
                            </h3>
                            <p className="text-sm text-gray-500">
                                Từ chối đơn hàng chờ phê duyệt
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
                    {/* Purchase Order Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            <span className="font-medium text-gray-900">Thông tin đơn hàng</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Mã đơn hàng:</span>
                                <span className="font-medium">{purchaseOrder?.purchaseOderId || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Nhà cung cấp:</span>
                                <span className="font-medium">{purchaseOrder?.supplierName || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Người tạo:</span>
                                <span className="font-medium">{purchaseOrder?.createdByName || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ngày tạo:</span>
                                <span className="font-medium">
                                    {purchaseOrder?.createdAt ? new Date(purchaseOrder.createdAt).toLocaleDateString('vi-VN') : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lý do từ chối <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Nhập lý do từ chối đơn hàng..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                            rows="2"
                            maxLength="500"
                            disabled={loading}
                        />
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                                {rejectionReason.length}/500 ký tự
                            </span>
                            {!isReasonValid && rejectionReason.length > 0 && (
                                <span className="text-xs text-red-500">
                                    Vui lòng nhập lý do từ chối
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-3">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-red-800 mb-1">
                                    Xác nhận từ chối đơn hàng
                                </h4>
                                <p className="text-sm text-red-700">
                                    Bạn có chắc chắn muốn từ chối đơn hàng này? Hành động này sẽ chuyển đơn hàng sang trạng thái "Đã từ chối" và không thể hoàn tác.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                            className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading || !isReasonValid}
                            className="h-[38px] px-8 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang xử lý...
                                </div>
                            ) : (
                                "Xác nhận từ chối"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RejectionConfirmationModal;
