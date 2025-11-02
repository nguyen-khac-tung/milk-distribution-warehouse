import React, { useState } from 'react';
import { X, Barcode, Info, RefreshCw, CheckCircle, Box, Package, XCircle } from 'lucide-react';
import { Button } from '../ui/button';

const ScanPalletModal = ({
    isOpen,
    onClose,
    onConfirm,
    pickDetailData,
    loading = false,
}) => {
    const [scanPalletId, setScanPalletId] = useState('');

    const handleConfirm = () => {
        if (scanPalletId.trim()) {
            onConfirm(scanPalletId);
        }
    };

    const handleClose = () => {
        setScanPalletId('');
        onClose();
    };

    if (!isOpen) return null;

    const isDisabled = loading || !scanPalletId.trim();

    // Check if scanned pallet ID matches expected pallet ID
    const isPalletIdMatch = pickDetailData && scanPalletId.trim() === pickDetailData.palletId;
    const hasEnteredPalletId = scanPalletId.trim().length > 0;

    // Determine validation status
    const getValidationStatus = () => {
        if (!hasEnteredPalletId) return null; // No validation when empty
        return isPalletIdMatch ? 'valid' : 'invalid';
    };

    const validationStatus = getValidationStatus();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Barcode className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Quét Pallet
                            </h3>
                            <p className="text-sm text-gray-500">
                                Xác nhận lấy hàng
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
                    {/* Pick Allocation Info */}
                    {pickDetailData && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <Box className="h-5 w-5 text-blue-500" />
                                <span className="font-medium text-gray-900">
                                    Thông tin phân bổ lấy hàng
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Tên hàng hóa</div>
                                    <div className="font-medium text-gray-900">{pickDetailData.goodsName}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Mã lô</div>
                                    <div className="font-medium text-gray-900">{pickDetailData.batchCode}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Hạn sử dụng</div>
                                    <div className="font-medium text-gray-900">
                                        {pickDetailData.expiryDate
                                            ? new Date(pickDetailData.expiryDate).toLocaleDateString('vi-VN')
                                            : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Số đơn vị/thùng</div>
                                    <div className="font-medium text-gray-900">{pickDetailData.unitPerPackage}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Tổng số thùng trên pallet</div>
                                    <div className="font-medium text-gray-900">
                                        {pickDetailData.palletPackageQuantity} thùng
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Số thùng cần lấy</div>
                                    <div className="font-medium text-orange-600">
                                        {pickDetailData.pickPackageQuantity} thùng
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scan Pallet Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã Pallet <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={scanPalletId}
                                onChange={(e) => setScanPalletId(e.target.value.trim())}
                                onKeyDown={(e) => e.key === 'Enter' && !isDisabled && handleConfirm()}
                                placeholder="Nhập hoặc quét mã pallet..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                                autoFocus
                                disabled={loading}
                            />
                            {scanPalletId && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setScanPalletId("")}
                                    className="text-gray-500 hover:text-red-600"
                                    disabled={loading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {pickDetailData && (
                            <div className={`mt-2 flex items-center gap-2 text-sm leading-none ${validationStatus === 'valid' ? 'text-green-600' :
                                validationStatus === 'invalid' ? 'text-red-600' :
                                    'text-gray-600'
                                }`}>
                                {validationStatus === 'valid' ? (
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                ) : validationStatus === 'invalid' ? (
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                ) : (
                                    <Info className="w-4 h-4 flex-shrink-0" />
                                )}
                                <p className="m-0 leading-none">
                                    Pallet dự kiến:{' '}
                                    <span className="font-semibold">{pickDetailData.palletId}</span>
                                </p>
                            </div>
                        )}
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
                            className={`h-[38px] px-6 font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 ${isDisabled
                                ? 'bg-blue-300 cursor-not-allowed text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
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

export default ScanPalletModal;

