import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X, Barcode, Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { getStocktakingPalletDetailByLocationCode, scannerStocktakingPallet, missStocktakingPallet, matchStocktakingPallet, surplusStocktakingPallet, deleteStocktakingPallet, undoStocktakingPallet, confirmStocktakingLocationCounted } from "../../services/StocktakingService";
import { extractErrorMessage } from "../../utils/Validation";
import PalletStatusDisplay, { STOCK_PALLET_STATUS } from "../../pages/StocktakingArea/PalletStatusDisplay";
import DeletePalletConfirmModal from "./DeletePalletConfirmModal";

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
    const [savingPallets, setSavingPallets] = useState(new Set());
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [palletToDelete, setPalletToDelete] = useState(null);
    const scanTimeoutRef = useRef(null);
    const matchTimeoutRef = useRef({});
    const surplusTimeoutRef = useRef({});

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
            // Cleanup tất cả match timeouts
            Object.values(matchTimeoutRef.current).forEach(timeout => {
                if (timeout) clearTimeout(timeout);
            });
            // Cleanup tất cả surplus timeouts
            Object.values(surplusTimeoutRef.current).forEach(timeout => {
                if (timeout) clearTimeout(timeout);
            });
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
        if (!pallet || !pallet.stocktakingPalletId) {
            window.showToast?.("Thông tin pallet không hợp lệ", "error");
            return;
        }

        try {
            setLoading(true);
            const note = pallet.note || "";

            await missStocktakingPallet({
                stocktakingPalletId: pallet.stocktakingPalletId,
                note: note
            });

            // Reload danh sách pallet sau khi đánh dấu thành công
            await loadPallets();

            if (window.showToast) {
                window.showToast("Đánh dấu pallet thiếu thành công!", "success");
            }

            // Gọi callback nếu có
            if (onSuccess) {
                onSuccess({
                    stocktakingLocationId,
                    locationCode,
                    action: "markMissing",
                    pallet: pallet
                });
            }
        } catch (error) {
            console.error("Error marking pallet as missing:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi đánh dấu pallet thiếu");
            window.showToast?.(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUndoMissing = async (pallet) => {
        if (!pallet || !pallet.stocktakingPalletId) {
            window.showToast?.("Thông tin pallet không hợp lệ", "error");
            return;
        }

        try {
            setSavingPallets(prev => new Set(prev).add(pallet.stocktakingPalletId));

            await undoStocktakingPallet(pallet.stocktakingPalletId);

            // Reload danh sách pallet sau khi hoàn tác thành công
            await loadPallets();

            // Clear input để quét lại pallet
            setPalletCode("");

            if (window.showToast) {
                window.showToast("Hoàn tác đánh dấu thiếu thành công!", "success");
            }

            // Gọi callback nếu có
            if (onSuccess) {
                onSuccess({
                    stocktakingLocationId,
                    locationCode,
                    action: "undoMissing",
                    pallet: pallet
                });
            }
        } catch (error) {
            console.error("Error undoing missing pallet:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi hoàn tác đánh dấu thiếu");
            window.showToast?.(errorMessage, "error");
        } finally {
            setSavingPallets(prev => {
                const newSet = new Set(prev);
                newSet.delete(pallet.stocktakingPalletId);
                return newSet;
            });
        }
    };

    const handleSurplusPallet = async (pallet) => {
        if (!pallet || !pallet.stocktakingPalletId) {
            window.showToast?.("Thông tin pallet không hợp lệ", "error");
            return;
        }

        // Validate số lượng thực tế
        const actualQuantity = pallet.actualPackageQuantity;
        if (actualQuantity === undefined || actualQuantity === null || actualQuantity < 0) {
            window.showToast?.("Vui lòng nhập số lượng thực tế hợp lệ (>= 0)", "error");
            return;
        }

        try {
            setSavingPallets(prev => new Set(prev).add(pallet.stocktakingPalletId));

            await surplusStocktakingPallet({
                stocktakingPalletId: pallet.stocktakingPalletId,
                actualPackageQuantity: actualQuantity,
                note: pallet.note || ""
            });

            // Reload danh sách pallet sau khi đánh dấu thành công
            await loadPallets();

            if (window.showToast) {
                window.showToast("Đánh dấu pallet thừa thành công!", "success");
            }

            // Gọi callback nếu có
            if (onSuccess) {
                onSuccess({
                    stocktakingLocationId,
                    locationCode,
                    action: "surplus",
                    pallet: pallet
                });
            }
        } catch (error) {
            console.error("Error marking pallet as surplus:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi đánh dấu pallet thừa");
            window.showToast?.(errorMessage, "error");
        } finally {
            setSavingPallets(prev => {
                const newSet = new Set(prev);
                newSet.delete(pallet.stocktakingPalletId);
                return newSet;
            });
        }
    };

    const handleUpdateUnexpectedActual = (pallet, actualQuantity) => {
        // Chỉ cập nhật số lượng thực tế trong state cho pallet không mong đợi, không tự động lưu
        // Không cho phép số lượng âm
        let quantity;
        if (actualQuantity === '' || actualQuantity === null || actualQuantity === undefined) {
            quantity = '';
        } else {
            quantity = Math.max(0, Number(actualQuantity) || 0);
        }
        const updatedPallets = unexpectedPallets.map(p =>
            p.stocktakingPalletId === pallet.stocktakingPalletId
                ? { ...p, actualPackageQuantity: quantity }
                : p
        );
        setUnexpectedPallets(updatedPallets);
    };

    const handleUpdateUnexpectedNote = (pallet, note) => {
        // Chỉ cập nhật ghi chú trong state cho pallet không mong đợi, không tự động lưu
        const updatedPallets = unexpectedPallets.map(p =>
            p.stocktakingPalletId === pallet.stocktakingPalletId
                ? { ...p, note: note }
                : p
        );
        setUnexpectedPallets(updatedPallets);
    };

    const handleDeleteUnexpected = (pallet) => {
        if (!pallet || !pallet.stocktakingPalletId) {
            window.showToast?.("Thông tin pallet không hợp lệ", "error");
            return;
        }

        // Mở modal xác nhận xóa
        setPalletToDelete(pallet);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!palletToDelete || !palletToDelete.stocktakingPalletId) {
            setDeleteModalOpen(false);
            setPalletToDelete(null);
            return;
        }

        try {
            setSavingPallets(prev => new Set(prev).add(palletToDelete.stocktakingPalletId));

            await deleteStocktakingPallet(palletToDelete.stocktakingPalletId);

            // Reload danh sách pallet sau khi xóa thành công
            await loadPallets();

            // Clear input để quét lại pallet
            setPalletCode("");

            if (window.showToast) {
                window.showToast("Xóa pallet không mong đợi thành công!", "success");
            }

            // Gọi callback nếu có
            if (onSuccess) {
                onSuccess({
                    stocktakingLocationId,
                    locationCode,
                    action: "delete",
                    pallet: palletToDelete
                });
            }

            // Đóng modal và reset
            setDeleteModalOpen(false);
            setPalletToDelete(null);
        } catch (error) {
            console.error("Error deleting unexpected pallet:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi xóa pallet");
            window.showToast?.(errorMessage, "error");
        } finally {
            setSavingPallets(prev => {
                const newSet = new Set(prev);
                newSet.delete(palletToDelete.stocktakingPalletId);
                return newSet;
            });
        }
    };

    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setPalletToDelete(null);
    };

    const handleMatchPallet = async (pallet) => {
        if (!pallet || !pallet.stocktakingPalletId) {
            window.showToast?.("Thông tin pallet không hợp lệ", "error");
            return;
        }

        // Validate số lượng thực tế
        const actualQuantity = pallet.actualPackageQuantity;
        if (actualQuantity === undefined || actualQuantity === null || actualQuantity < 0) {
            window.showToast?.("Vui lòng nhập số lượng thực tế hợp lệ (>= 0)", "error");
            return;
        }

        try {
            setSavingPallets(prev => new Set(prev).add(pallet.stocktakingPalletId));

            await matchStocktakingPallet({
                stocktakingPalletId: pallet.stocktakingPalletId,
                actualPackageQuantity: actualQuantity,
                note: pallet.note || ""
            });

            // Reload danh sách pallet sau khi đánh dấu thành công
            await loadPallets();

            if (window.showToast) {
                window.showToast("Đánh dấu pallet khớp thành công!", "success");
            }

            // Gọi callback nếu có
            if (onSuccess) {
                onSuccess({
                    stocktakingLocationId,
                    locationCode,
                    action: "match",
                    pallet: pallet
                });
            }
        } catch (error) {
            console.error("Error matching pallet:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi đánh dấu pallet khớp");
            window.showToast?.(errorMessage, "error");
        } finally {
            setSavingPallets(prev => {
                const newSet = new Set(prev);
                newSet.delete(pallet.stocktakingPalletId);
                return newSet;
            });
        }
    };

    const handleUpdateActual = (pallet, actualQuantity) => {
        // Chỉ cập nhật số lượng thực tế trong state, không tự động lưu
        // Không cho phép số lượng âm
        let quantity;
        if (actualQuantity === '' || actualQuantity === null || actualQuantity === undefined) {
            quantity = '';
        } else {
            quantity = Math.max(0, Number(actualQuantity) || 0);
        }
        const updatedPallets = expectedPallets.map(p =>
            p.stocktakingPalletId === pallet.stocktakingPalletId
                ? { ...p, actualPackageQuantity: quantity }
                : p
        );
        setExpectedPallets(updatedPallets);
    };

    const handleUpdateNote = (pallet, note) => {
        // Chỉ cập nhật ghi chú trong state, không tự động lưu
        const updatedPallets = expectedPallets.map(p =>
            p.stocktakingPalletId === pallet.stocktakingPalletId
                ? { ...p, note: note }
                : p
        );
        setExpectedPallets(updatedPallets);
    };

    const handleConfirm = async () => {
        try {
            setLoading(true);

            // Kiểm tra nếu cả pallet dự kiến và không mong đợi đều rỗng, gọi API confirm location counted
            if (expectedPallets.length === 0 && unexpectedPallets.length === 0) {
                if (stocktakingLocationId) {
                    await confirmStocktakingLocationCounted(stocktakingLocationId);
                    if (window.showToast) {
                        window.showToast("Xác nhận đã kiểm kê thành công! (Không có pallet)", "success");
                    }

                    // Gọi callback nếu có
                    if (onSuccess) {
                        onSuccess({
                            action: "confirm",
                            stocktakingLocationId: stocktakingLocationId
                        });
                    }

                    // Đóng modal sau khi confirm
                    handleReset();
                    return;
                }
            }

            // Lưu tất cả pallet không mong đợi (đã được quét vào) - gọi surplusStocktakingPallet
            const surplusPromises = unexpectedPallets
                .map(pallet => {
                    // Sử dụng số lượng thực tế nếu có, nếu không thì dùng số lượng dự kiến, mặc định là 0
                    const actualQuantity = pallet.actualPackageQuantity !== null &&
                        pallet.actualPackageQuantity !== undefined
                        ? pallet.actualPackageQuantity
                        : (pallet.expectedPackageQuantity ?? 0);

                    return surplusStocktakingPallet({
                        stocktakingPalletId: pallet.stocktakingPalletId,
                        actualPackageQuantity: actualQuantity,
                        note: pallet.note || ""
                    });
                });

            // Lưu tất cả pallet dự kiến có số lượng thực tế (match)
            const matchPromises = expectedPallets
                .filter(p =>
                    p.actualPackageQuantity !== null &&
                    p.actualPackageQuantity !== undefined &&
                    p.actualPackageQuantity >= 0 &&
                    p.status !== STOCK_PALLET_STATUS.Missing
                )
                .map(pallet =>
                    matchStocktakingPallet({
                        stocktakingPalletId: pallet.stocktakingPalletId,
                        actualPackageQuantity: pallet.actualPackageQuantity,
                        note: pallet.note || ""
                    })
                );

            // Thực hiện tất cả các promise song song
            await Promise.all([...matchPromises, ...surplusPromises]);

            // Reload danh sách pallet sau khi lưu thành công
            await loadPallets();

            if (window.showToast) {
                window.showToast("Xác nhận thành công!", "success");
            }

            // Gọi callback nếu có
            if (onSuccess) {
                onSuccess({
                    stocktakingLocationId,
                    locationCode,
                    expectedPallets,
                    unexpectedPallets,
                    action: "confirm"
                });
            }

            // Đóng modal
            handleReset();
        } catch (error) {
            console.error("Error confirming pallets:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi xác nhận");
            window.showToast?.(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setPalletCode("");
        onClose && onClose();
    };

    if (!isOpen) return null;

    // Kiểm tra xem vị trí đã được quyết định chưa (có pallet Matched hoặc có pallet không mong đợi)
    const isLocationDecided =
        expectedPallets.some(p => p.status === STOCK_PALLET_STATUS.Matched) ||
        unexpectedPallets.length > 0;

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
                                placeholder={isLocationDecided ? "Vị trí này đã được quét xong" : "Quét mã pallet hoặc nhập mã"}
                                value={palletCode}
                                onChange={(e) => handlePalletCodeChange(e.target.value)}
                                className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled={loading || scanningPallet || isLocationDecided}
                                autoFocus={!isLocationDecided}
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
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (value === '' || value === '-') {
                                                                    handleUpdateActual(pallet, '');
                                                                    return;
                                                                }
                                                                const numValue = parseInt(value);
                                                                if (!isNaN(numValue)) {
                                                                    handleUpdateActual(pallet, numValue);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                // Ngăn chặn nhập dấu trừ và các ký tự không hợp lệ
                                                                if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className="w-20 h-8 text-center border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded"
                                                            min="0"
                                                            disabled={!pallet.status || pallet.status === STOCK_PALLET_STATUS.Unscanned || pallet.status === STOCK_PALLET_STATUS.Missing}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 max-w-xs">
                                                        <Input
                                                            type="text"
                                                            value={pallet.note || ''}
                                                            onChange={(e) => handleUpdateNote(pallet, e.target.value)}
                                                            placeholder="Nhập ghi chú"
                                                            className="h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded truncate"
                                                            title={pallet.note || ''}
                                                            disabled={!pallet.status || pallet.status === STOCK_PALLET_STATUS.Unscanned || pallet.status === STOCK_PALLET_STATUS.Missing}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {pallet.status === STOCK_PALLET_STATUS.Missing ? (
                                                                <Button
                                                                    onClick={() => handleUndoMissing(pallet)}
                                                                    disabled={loading || scanningPallet || savingPallets.has(pallet.stocktakingPalletId)}
                                                                    className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {savingPallets.has(pallet.stocktakingPalletId) ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                            <span>Đang xử lý...</span>
                                                                        </div>
                                                                    ) : (
                                                                        "Hoàn tác"
                                                                    )}
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    onClick={() => handleMarkMissing(pallet)}
                                                                    disabled={loading || scanningPallet || pallet.status === STOCK_PALLET_STATUS.Matched || unexpectedPallets.length > 0}
                                                                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Thiếu
                                                                </Button>
                                                            )}
                                                        </div>
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
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (value === '' || value === '-') {
                                                                    handleUpdateUnexpectedActual(pallet, '');
                                                                    return;
                                                                }
                                                                const numValue = parseInt(value);
                                                                if (!isNaN(numValue)) {
                                                                    handleUpdateUnexpectedActual(pallet, numValue);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                // Ngăn chặn nhập dấu trừ và các ký tự không hợp lệ
                                                                if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className="w-20 h-8 text-center border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded"
                                                            min="0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 max-w-xs">
                                                        <Input
                                                            type="text"
                                                            value={pallet.note || ''}
                                                            onChange={(e) => handleUpdateUnexpectedNote(pallet, e.target.value)}
                                                            placeholder="Nhập ghi chú"
                                                            className="h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded truncate"
                                                            title={pallet.note || ''}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleDeleteUnexpected(pallet)}
                                                            disabled={savingPallets.has(pallet.stocktakingPalletId)}
                                                            className="text-red-500 hover:text-red-700 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Xóa pallet không mong đợi"
                                                        >
                                                            {savingPallets.has(pallet.stocktakingPalletId) ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
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
                        className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleConfirm}
                        disabled={
                            loading ||
                            scanningPallet ||
                            (expectedPallets.length > 0 &&
                                expectedPallets.every(p => !p.status || p.status === STOCK_PALLET_STATUS.Unscanned) &&
                                unexpectedPallets.length === 0)
                        }
                    >
                        {loading ? "Đang xử lý..." : "Xác nhận"}
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeletePalletConfirmModal
                isOpen={deleteModalOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                palletId={palletToDelete?.palletId || ''}
                loading={palletToDelete ? savingPallets.has(palletToDelete.stocktakingPalletId) : false}
            />
        </div>,
        document.body
    );
}

