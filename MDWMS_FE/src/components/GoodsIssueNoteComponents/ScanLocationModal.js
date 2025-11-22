import React, { useState, useEffect, useRef } from 'react';
import { X, Barcode, Info, RefreshCw, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { Button } from '../ui/button';

const ScanLocationModal = ({
    isOpen,
    onClose,
    onLocationFound,
    pickAllocations = [],
    loading = false,
}) => {
    const [scanLocationCode, setScanLocationCode] = useState('');
    const [validationStatus, setValidationStatus] = useState(null); // 'valid', 'invalid', null
    const [foundPickAllocation, setFoundPickAllocation] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Reset khi mở modal
            setScanLocationCode('');
            setValidationStatus(null);
            setFoundPickAllocation(null);
            // Focus vào input sau khi modal mở
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    }, [isOpen]);

    // Validate location code khi nhập
    useEffect(() => {
        if (!scanLocationCode.trim()) {
            setValidationStatus(null);
            setFoundPickAllocation(null);
            return;
        }

        // Tìm pick allocation có locationCode khớp (case-insensitive)
        const trimmedCode = scanLocationCode.trim();
        const found = pickAllocations.find(
            pick => pick.locationCode && 
            pick.locationCode.trim().toLowerCase() === trimmedCode.toLowerCase()
        );

        if (found) {
            setFoundPickAllocation(found);
            setValidationStatus('valid');
        } else {
            setFoundPickAllocation(null);
            setValidationStatus('invalid');
        }
    }, [scanLocationCode, pickAllocations]);

    const handleConfirm = () => {
        if (!foundPickAllocation) {
            return;
        }

        // Gọi callback với pick allocation tìm được
        onLocationFound(foundPickAllocation);
        handleClose();
    };

    const handleClose = () => {
        setScanLocationCode('');
        setValidationStatus(null);
        setFoundPickAllocation(null);
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && foundPickAllocation && !loading) {
            handleConfirm();
        }
    };

    if (!isOpen) return null;

    const isDisabled = loading || !foundPickAllocation;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <MapPin className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Quét mã vị trí
                            </h3>
                            <p className="text-sm text-gray-500">
                                Tìm kiếm vị trí để quét pallet
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
                    {/* Scan Location Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã vị trí <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={scanLocationCode}
                                onChange={(e) => setScanLocationCode(e.target.value.trim())}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập hoặc quét mã vị trí..."
                                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                                disabled={loading}
                            />

                            {/* Nút X xoá nội dung */}
                            {scanLocationCode && (
                                <button
                                    type="button"
                                    onClick={() => setScanLocationCode("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 focus:outline-none"
                                    disabled={loading}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Validation message */}
                        {scanLocationCode && (
                            <div className={`mt-2 flex items-center gap-2 text-sm ${
                                validationStatus === 'valid' ? 'text-green-600' :
                                validationStatus === 'invalid' ? 'text-red-600' :
                                'text-gray-600'
                            }`}>
                                {validationStatus === 'valid' ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                        <p className="m-0">
                                            Tìm thấy vị trí: <span className="font-semibold">{foundPickAllocation?.locationCode}</span>
                                        </p>
                                    </>
                                ) : validationStatus === 'invalid' ? (
                                    <>
                                        <XCircle className="w-4 h-4 flex-shrink-0" />
                                        <p className="m-0">
                                            Không tìm thấy vị trí này trong danh sách
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Info className="w-4 h-4 flex-shrink-0" />
                                        <p className="m-0">
                                            Nhập hoặc quét mã vị trí để tìm kiếm
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Thông tin chi tiết nếu tìm thấy */}
                        {foundPickAllocation && (
                            <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Khu vực</div>
                                        <div className="font-medium text-gray-900">{foundPickAllocation.areaName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Số lượng</div>
                                        <div className="font-medium text-gray-900">{foundPickAllocation.pickPackageQuantity} thùng</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Kệ - Hàng - Cột</div>
                                        <div className="font-medium text-gray-900">
                                            {foundPickAllocation.rack} - {foundPickAllocation.row} - {foundPickAllocation.column}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Trạng thái</div>
                                        <div className="font-medium text-gray-900">
                                            {foundPickAllocation.status === 2 ? 'Đã quét' : 'Chưa quét'}
                                        </div>
                                    </div>
                                </div>
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
                            className={`h-[38px] px-6 font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 ${
                                isDisabled
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
                                    <Barcode className="w-4 h-4" />
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

export default ScanLocationModal;

