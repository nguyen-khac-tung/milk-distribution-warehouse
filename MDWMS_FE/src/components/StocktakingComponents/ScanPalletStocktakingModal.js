import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X, Barcode, Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { getStocktakingPalletDetailByLocationCode, scannerStocktakingPallet } from "../../services/StocktakingService";
import { extractErrorMessage } from "../../utils/Validation";
import PalletStatusDisplay, { STOCK_PALLET_STATUS } from "../../pages/StocktakingArea/PalletStatusDisplay";

export default function ScanPalletStocktakingModal({
    isOpen,
    onClose,
    onSuccess,
    stocktakingLocationId,
    locationCode
}) {
    const [palletCode, setPalletCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [scanningPallet, setScanningPallet] = useState(false);
    const [expectedPallets, setExpectedPallets] = useState([]);
    const [unexpectedPallets, setUnexpectedPallets] = useState([]);
    const [loadingPallets, setLoadingPallets] = useState(false);
    const scanTimeoutRef = useRef(null);

    useEffect(() => {
        if (isOpen && stocktakingLocationId && locationCode) {
            // Reset form khi mở modal
            setPalletCode("");
            loadPallets();
        }

        // Cleanup timeout khi unmount hoặc đóng modal
        return () => {
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        };
    }, [isOpen, stocktakingLocationId, locationCode]);

    const loadPallets = async () => {
        if (!stocktakingLocationId || !locationCode) return;

        try {
            setLoadingPallets(true);
            const response = await getStocktakingPalletDetailByLocationCode(stocktakingLocationId, locationCode);
            const pallets = response?.data || response || [];

            // Phân loại pallet: expected (status = Unscanned hoặc Missing) và unexpected (status = Surplus)
            const expected = pallets.filter(p =>
                !p.status ||
                p.status === STOCK_PALLET_STATUS.Unscanned ||
                p.status === STOCK_PALLET_STATUS.Missing ||
                p.status === STOCK_PALLET_STATUS.Matched
            );
            const unexpected = pallets.filter(p =>
                p.status === STOCK_PALLET_STATUS.Surplus
            );

            setExpectedPallets(expected);
            setUnexpectedPallets(unexpected);
        } catch (error) {
            console.error("Error loading pallets:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tải danh sách pallet");
            window.showToast?.(errorMessage, "error");
        } finally {
            setLoadingPallets(false);
        }
    };

    const handleScanPallet = async (palletIdToScan = null) => {
        const palletId = palletIdToScan || palletCode;

        if (!palletId || typeof palletId !== 'string' || !palletId.trim()) {
            window.showToast?.("Vui lòng nhập mã pallet", "error");
            return;
        }

        const trimmedPalletId = palletId.trim();

        if (!stocktakingLocationId) {
            window.showToast?.("Thiếu thông tin stocktakingLocationId", "error");
            return;
        }

        try {
            setScanningPallet(true);
            await scannerStocktakingPallet(stocktakingLocationId, trimmedPalletId);

            // Reload danh sách pallet sau khi quét thành công
            await loadPallets();

            // Clear input
            setPalletCode("");

            if (window.showToast) {
                window.showToast("Quét pallet thành công!", "success");
            }
        } catch (error) {
            console.error("Error scanning pallet:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi quét pallet");
            window.showToast?.(errorMessage, "error");
        } finally {
            setScanningPallet(false);
        }
    };

    // Tự động quét khi nhập (debounce 500ms)
    const handlePalletCodeChange = (value) => {
        const stringValue = value != null ? String(value) : "";
        setPalletCode(stringValue);

        // Clear timeout cũ
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
        }

        // Tự động quét sau 500ms
        if (stringValue && typeof stringValue === 'string' && stringValue.trim()) {
            scanTimeoutRef.current = setTimeout(() => {
                handleScanPallet(stringValue);
            }, 500);
        }
    };

    const handleMarkMissing = async (pallet) => {
        // TODO: Implement API call để đánh dấu pallet là thiếu
        console.log("Mark missing:", pallet);
        if (window.showToast) {
            window.showToast("Chức năng đánh dấu thiếu đang được phát triển", "info");
        }
    };

    const handleDeleteUnexpected = async (pallet) => {
        // TODO: Implement API call để xóa pallet không mong đợi
        console.log("Delete unexpected:", pallet);
        if (window.showToast) {
            window.showToast("Chức năng xóa pallet đang được phát triển", "info");
        }
    };

    const handleUpdateActual = (pallet, actualQuantity) => {
        // TODO: Implement API call để cập nhật số lượng thực tế
        console.log("Update actual:", pallet, actualQuantity);
        if (window.showToast) {
            window.showToast("Chức năng cập nhật số lượng đang được phát triển", "info");
        }
    };

    const handleReset = () => {
        setPalletCode("");
        onClose && onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 99999, top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleReset();
                }
            }}
        >
            <div
                className="w-full max-w-6xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden relative z-[100000] max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h1 className="text-xl font-semibold text-slate-800">Quét vị trí</h1>
                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="p-2 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-6">
                        {/* Input quét mã pallet */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="palletCode" className="text-sm font-medium text-slate-700">
                                Quét Mã Pallet
                            </Label>
                            <Input
                                id="palletCode"
                                placeholder="Quét mã pallet hoặc nhập mã"
                                value={palletCode}
                                onChange={(e) => handlePalletCodeChange(e.target.value)}
                                className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                                disabled={loading || scanningPallet}
                                autoFocus
                            />
                        </div>

                        {/* Pallet dự kiến */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">Pallet dự kiến</h3>
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Mã pallet</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Mã sản phẩm</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Tên sản phẩm</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Lô</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">Dự Kiến</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">Thực Tế</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Ghi chú</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">Hành Động</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">Trạng Thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingPallets ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="px-4 py-8 text-center">
                                                    <div className="flex justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : expectedPallets.length > 0 ? (
                                            expectedPallets.map((pallet, index) => (
                                                <TableRow key={pallet.stocktakingPalletId || index} className="hover:bg-slate-50 border-b border-slate-200">
                                                    <TableCell className="px-2 py-3 text-slate-700 w-32">
                                                        <div className="text-xs truncate" title={pallet.palletId || '-'}>
                                                            {pallet.palletId || '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.goodsCode || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.gooodsName || pallet.goodsName || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.batchCode || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center text-slate-700">
                                                        {pallet.expectedPackageQuantity ?? 0}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <Input
                                                            type="number"
                                                            value={pallet.actualPackageQuantity ?? ''}
                                                            onChange={(e) => handleUpdateActual(pallet, parseInt(e.target.value) || 0)}
                                                            className="w-20 h-8 text-center border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded"
                                                            min="0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 max-w-xs">
                                                        <Input
                                                            type="text"
                                                            value={pallet.note || ''}
                                                            onChange={(e) => {
                                                                const updatedPallets = expectedPallets.map(p =>
                                                                    p.stocktakingPalletId === pallet.stocktakingPalletId
                                                                        ? { ...p, note: e.target.value }
                                                                        : p
                                                                );
                                                                setExpectedPallets(updatedPallets);
                                                            }}
                                                            placeholder="Nhập ghi chú"
                                                            className="h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded truncate"
                                                            title={pallet.note || ''}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <Button
                                                            onClick={() => handleMarkMissing(pallet)}
                                                            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 h-8"
                                                        >
                                                            Thiếu
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <PalletStatusDisplay status={pallet.status || STOCK_PALLET_STATUS.Unscanned} />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                                    Không có pallet dự kiến
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Pallet không mong đợi */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">Pallet không mong đợi</h3>
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Mã pallet</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Mã sản phẩm</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Tên sản phẩm</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Lô</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">Dự Kiến</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">Thực Tế</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">Ghi chú</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">Xóa</TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">Trạng Thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {unexpectedPallets.length > 0 ? (
                                            unexpectedPallets.map((pallet, index) => (
                                                <TableRow key={pallet.stocktakingPalletId || index} className="hover:bg-slate-50 border-b border-slate-200">
                                                    <TableCell className="px-2 py-3 text-slate-700 w-32">
                                                        <div className="text-xs truncate" title={pallet.palletId || '-'}>
                                                            {pallet.palletId || '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.goodsCode || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.gooodsName || pallet.goodsName || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.batchCode || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center text-slate-700">
                                                        {pallet.expectedPackageQuantity ?? 0}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <Input
                                                            type="number"
                                                            value={pallet.actualPackageQuantity ?? ''}
                                                            onChange={(e) => handleUpdateActual(pallet, parseInt(e.target.value) || 0)}
                                                            className="w-20 h-8 text-center border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded"
                                                            min="0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 max-w-xs">
                                                        <Input
                                                            type="text"
                                                            value={pallet.note || ''}
                                                            onChange={(e) => {
                                                                const updatedPallets = unexpectedPallets.map(p =>
                                                                    p.stocktakingPalletId === pallet.stocktakingPalletId
                                                                        ? { ...p, note: e.target.value }
                                                                        : p
                                                                );
                                                                setUnexpectedPallets(updatedPallets);
                                                            }}
                                                            placeholder="Nhập ghi chú"
                                                            className="h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded truncate"
                                                            title={pallet.note || ''}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleDeleteUnexpected(pallet)}
                                                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <PalletStatusDisplay status={pallet.status || STOCK_PALLET_STATUS.Surplus} />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                                    Không có pallet không mong đợi
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md transition-all"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md transition-all"
                        onClick={() => {
                            if (onSuccess) {
                                onSuccess({
                                    stocktakingLocationId,
                                    locationCode,
                                    expectedPallets,
                                    unexpectedPallets
                                });
                            }
                            handleReset();
                        }}
                        disabled={loading || scanningPallet}
                    >
                        Xác nhận
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}

