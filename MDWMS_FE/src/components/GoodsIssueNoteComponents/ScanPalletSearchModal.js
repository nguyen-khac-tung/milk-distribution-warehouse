import React, { useState, useEffect, useRef } from 'react';
import { X, Barcode, Info, RefreshCw, CheckCircle, XCircle, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { getPickAllocationDetail } from '../../services/PickAllocationService';

const ScanPalletSearchModal = ({
    isOpen,
    onClose,
    onPalletFound,
    pickAllocations = [],
    loading = false,
}) => {
    const [scanPalletId, setScanPalletId] = useState('');
    const [validationStatus, setValidationStatus] = useState(null); // 'valid', 'invalid', 'checking'
    const [foundPickAllocation, setFoundPickAllocation] = useState(null);
    const [checkingPallet, setCheckingPallet] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Reset khi mở modal
            setScanPalletId('');
            setValidationStatus(null);
            setFoundPickAllocation(null);
            setCheckingPallet(false);
            // Focus vào input sau khi modal mở
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    }, [isOpen]);

    // Tìm kiếm pallet trong danh sách pick allocations
    const searchPallet = async (palletId) => {
        if (!palletId || !palletId.trim()) {
            setValidationStatus(null);
            setFoundPickAllocation(null);
            return;
        }

        const trimmedPalletId = palletId.trim();
        setCheckingPallet(true);
        setValidationStatus('checking');

        try {
            // Tìm trong tất cả pick allocations chưa được quét (status !== 2)
            const unScannedPicks = pickAllocations.filter(p => p.status !== 2);
            
            // Gọi API để lấy detail của từng pick allocation và kiểm tra palletId
            let found = null;
            for (const pick of unScannedPicks) {
                try {
                    const response = await getPickAllocationDetail(pick.pickAllocationId);
                    if (response && response.success && response.data) {
                        const pickDetail = response.data;
                        if (pickDetail.palletId && 
                            pickDetail.palletId.trim().toLowerCase() === trimmedPalletId.toLowerCase()) {
                            found = {
                                ...pick,
                                palletId: pickDetail.palletId,
                                pickDetailData: pickDetail
                            };
                            break;
                        }
                    }
                } catch (error) {
                    // Bỏ qua lỗi và tiếp tục tìm
                    console.error(`Error checking pick allocation ${pick.pickAllocationId}:`, error);
                }
            }

            if (found) {
                setFoundPickAllocation(found);
                setValidationStatus('valid');
            } else {
                setFoundPickAllocation(null);
                setValidationStatus('invalid');
            }
        } catch (error) {
            console.error('Error searching pallet:', error);
            setFoundPickAllocation(null);
            setValidationStatus('invalid');
        } finally {
            setCheckingPallet(false);
        }
    };

    // Debounce search khi nhập
    useEffect(() => {
        if (!scanPalletId.trim()) {
            setValidationStatus(null);
            setFoundPickAllocation(null);
            return;
        }

        const timeoutId = setTimeout(() => {
            searchPallet(scanPalletId);
        }, 500); // Debounce 500ms

        return () => clearTimeout(timeoutId);
    }, [scanPalletId]);

    const handleConfirm = () => {
        if (!foundPickAllocation) {
            return;
        }

        // Gọi callback với pick allocation tìm được
        onPalletFound(foundPickAllocation);
        handleClose();
    };

    const handleClose = () => {
        setScanPalletId('');
        setValidationStatus(null);
        setFoundPickAllocation(null);
        setCheckingPallet(false);
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && foundPickAllocation && !loading && !checkingPallet) {
            handleConfirm();
        }
    };

    if (!isOpen) return null;

    const isDisabled = loading || !foundPickAllocation || checkingPallet;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-full">
                            <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Quét mã pallet
                            </h3>
                            <p className="text-sm text-gray-500">
                                Tìm kiếm pallet để quét nhanh
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading || checkingPallet}
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Scan Pallet Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã Pallet <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={scanPalletId}
                                onChange={(e) => setScanPalletId(e.target.value.trim())}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập hoặc quét mã pallet..."
                                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
                                disabled={loading || checkingPallet}
                            />

                            {/* Nút X xoá nội dung */}
                            {scanPalletId && (
                                <button
                                    type="button"
                                    onClick={() => setScanPalletId("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 focus:outline-none"
                                    disabled={loading || checkingPallet}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Validation message */}
                        {scanPalletId && (
                            <div className={`mt-2 flex items-center gap-2 text-sm ${
                                validationStatus === 'valid' ? 'text-green-600' :
                                validationStatus === 'invalid' ? 'text-red-600' :
                                validationStatus === 'checking' ? 'text-blue-600' :
                                'text-gray-600'
                            }`}>
                                {validationStatus === 'valid' ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                        <p className="m-0">
                                            Tìm thấy pallet: <span className="font-semibold">{foundPickAllocation?.palletId}</span>
                                        </p>
                                    </>
                                ) : validationStatus === 'invalid' ? (
                                    <>
                                        <XCircle className="w-4 h-4 flex-shrink-0" />
                                        <p className="m-0">
                                            Không tìm thấy pallet này trong danh sách chưa quét
                                        </p>
                                    </>
                                ) : validationStatus === 'checking' ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
                                        <p className="m-0">
                                            Đang tìm kiếm...
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Info className="w-4 h-4 flex-shrink-0" />
                                        <p className="m-0">
                                            Nhập hoặc quét mã pallet để tìm kiếm
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Thông tin chi tiết nếu tìm thấy */}
                        {foundPickAllocation && foundPickAllocation.pickDetailData && (
                            <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Tên hàng hóa</div>
                                        <div className="font-medium text-gray-900">{foundPickAllocation.pickDetailData.goodsName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Mã lô</div>
                                        <div className="font-medium text-gray-900">{foundPickAllocation.pickDetailData.batchCode || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Số lượng cần lấy</div>
                                        <div className="font-medium text-gray-900">{foundPickAllocation.pickDetailData.pickPackageQuantity || 0} thùng</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Vị trí</div>
                                        <div className="font-medium text-gray-900">{foundPickAllocation.locationCode || 'N/A'}</div>
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
                            disabled={loading || checkingPallet}
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
                                    ? 'bg-green-300 cursor-not-allowed text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
                            }`}
                        >
                            {loading || checkingPallet ? (
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

export default ScanPalletSearchModal;

