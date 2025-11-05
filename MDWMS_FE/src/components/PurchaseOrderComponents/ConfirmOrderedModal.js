import React, { useState } from 'react';
import { X, ShoppingCart, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const ConfirmOrderedModal = ({
    isOpen,
    onClose,
    onConfirm,
    purchaseOrder,
    loading = false
}) => {
    const [estimatedTimeArrival, setEstimatedTimeArrival] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        // Validate date
        if (!estimatedTimeArrival) {
            setError('Vui lòng nhập ngày dự kiến nhập');
            return;
        }

        const selectedDate = new Date(estimatedTimeArrival);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            setError('Ngày dự kiến nhập không thể là ngày trong quá khứ');
            return;
        }

        setError('');
        onConfirm(estimatedTimeArrival);
    };

    const handleClose = () => {
        setEstimatedTimeArrival('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                            <ShoppingCart className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Xác nhận Đã đặt hàng
                            </h3>
                            <p className="text-sm text-gray-500">
                                Xác nhận đơn hàng đã được đặt và nhập ngày dự kiến nhập
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
                <div className="p-6">
                    {/* Purchase Order Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
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
                        </div>
                    </div>

                    {/* Date Input */}
                    <div className="mb-6">
                        <Label htmlFor="estimatedTimeArrival" className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Ngày dự kiến nhập *</span>
                        </Label>
                        <Input
                            id="estimatedTimeArrival"
                            type="date"
                            value={estimatedTimeArrival}
                            onChange={(e) => {
                                setEstimatedTimeArrival(e.target.value);
                                setError('');
                            }}
                            min={today}
                            className={`w-full ${error ? 'border-red-500' : ''}`}
                            disabled={loading}
                        />
                        {error && (
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        )}
                    </div>

                    {/* Warning Message */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-yellow-800 mb-1">
                                    Xác nhận đã đặt hàng
                                </h4>
                                <p className="text-sm text-yellow-700">
                                    Bạn có chắc chắn muốn xác nhận đơn hàng này đã được đặt? Hành động này không thể hoàn tác.
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
                            disabled={loading}
                            className="h-[38px] px-8 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang xác nhận...
                                </div>
                            ) : (
                                "Xác nhận Đã đặt hàng"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmOrderedModal;

