import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const ConfirmOrderedModal = ({
    isOpen,
    onClose,
    onConfirm,
    purchaseOrder,
    loading = false,
    mode = 'confirm' // 'confirm' or 'change'
}) => {
    const [estimatedTimeArrival, setEstimatedTimeArrival] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [reasonError, setReasonError] = useState('');

    // Khởi tạo estimatedTimeArrival từ purchaseOrder nếu có
    useEffect(() => {
        if (isOpen && purchaseOrder?.estimatedTimeArrival) {
            // Chuyển đổi từ ISO string hoặc Date object sang YYYY-MM-DD format
            const dateValue = new Date(purchaseOrder.estimatedTimeArrival);
            if (!isNaN(dateValue.getTime())) {
                const year = dateValue.getFullYear();
                const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                const day = String(dateValue.getDate()).padStart(2, '0');
                setEstimatedTimeArrival(`${year}-${month}-${day}`);
            }
        } else if (isOpen && !purchaseOrder?.estimatedTimeArrival) {
            // Reset về rỗng nếu không có giá trị
            setEstimatedTimeArrival('');
        }
    }, [isOpen, purchaseOrder?.estimatedTimeArrival]);

    const handleConfirm = () => {
        // Validate date
        if (!estimatedTimeArrival) {
            setError('Vui lòng nhập ngày dự kiến nhập');
            return;
        }

        // Validate reason khi mode="change"
        if (mode === 'change' && !reason.trim()) {
            setReasonError('Vui lòng nhập lý do thay đổi ngày dự kiến nhập');
            return;
        }

        // Lấy ngày đã chọn và giờ hiện tại
        const selectedDate = new Date(estimatedTimeArrival);
        const now = new Date();

        // So sánh chỉ theo ngày (không tính giờ)
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (selectedDateOnly < todayOnly) {
            setError('Ngày dự kiến nhập không thể là ngày trong quá khứ');
            return;
        }

        setError('');
        setReasonError('');

        // Lấy giờ hiện tại
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentSeconds = now.getSeconds();
        const currentMilliseconds = now.getMilliseconds();

        // Tạo Date object với ngày đã chọn và giờ hiện tại
        const finalDateTime = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            currentHours,
            currentMinutes,
            currentSeconds,
            currentMilliseconds
        );

        // Convert to ISO string
        const isoString = finalDateTime.toISOString();

        // Nếu mode="change", truyền cả reason
        if (mode === 'change') {
            onConfirm(isoString, reason.trim());
        } else {
            onConfirm(isoString);
        }
    };

    const handleClose = () => {
        setEstimatedTimeArrival('');
        setReason('');
        setError('');
        setReasonError('');
        onClose();
    };

    if (!isOpen) return null;

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${mode === 'change' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                            {mode === 'change' ? (
                                <Calendar className="h-6 w-6 text-blue-600" />
                            ) : (
                                <ShoppingCart className="h-6 w-6 text-yellow-600" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {mode === 'change' ? 'Thay đổi ngày dự kiến nhập' : 'Xác nhận Đã đặt hàng'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {mode === 'change'
                                    ? 'Thay đổi ngày dự kiến nhập cho đơn hàng'
                                    : 'Xác nhận đơn hàng đã được đặt và nhập ngày dự kiến nhập'}
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
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Mã đơn hàng:</span>
                                <p className="font-medium text-gray-900 break-words">{purchaseOrder?.purchaseOderId || '-'}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Nhà cung cấp:</span>
                                <p className="font-medium text-gray-900 break-words">{purchaseOrder?.supplierName || '-'}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Người tạo:</span>
                                <p className="font-medium text-gray-900">{purchaseOrder?.createdByName || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Date Input */}
                    <div className="mb-4">
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
                            className={`w-[180px] max-w-[180px] flex-shrink-0 ${error ? 'border-red-500' : ''}`}
                            disabled={loading}
                            style={{ width: '180px', maxWidth: '180px' }}
                        />
                        {error && (
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        )}
                    </div>

                    {/* Reason Input - chỉ hiển thị khi mode="change" */}
                    {mode === 'change' && (
                        <div className="mb-4">
                            <Label htmlFor="reason" className="flex items-center space-x-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">Lý do thay đổi *</span>
                            </Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    setReasonError('');
                                }}
                                placeholder="Nhập lý do thay đổi ngày dự kiến nhập..."
                                className={`w-full min-h-[80px] ${reasonError ? 'border-red-500' : ''}`}
                                disabled={loading}
                            />
                            {reasonError && (
                                <p className="text-sm text-red-600 mt-1">{reasonError}</p>
                            )}
                        </div>
                    )}

                    {/* Warning Message */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-yellow-800 mb-1">
                                    {mode === 'change' ? 'Thay đổi ngày dự kiến nhập' : 'Xác nhận đã đặt hàng'}
                                </h4>
                                <p className="text-sm text-yellow-700">
                                    {mode === 'change'
                                        ? 'Bạn có chắc chắn muốn thay đổi ngày dự kiến nhập cho đơn hàng này?'
                                        : 'Bạn có chắc chắn muốn xác nhận đơn hàng này đã được đặt? Hành động này không thể hoàn tác.'}
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
                            className={`h-[38px] px-8 font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 ${mode === 'change'
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {mode === 'change' ? 'Đang thay đổi...' : 'Đang xác nhận...'}
                                </div>
                            ) : (
                                mode === 'change' ? 'Thay đổi ngày dự kiến nhập' : 'Xác nhận Đã đặt hàng'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmOrderedModal;

