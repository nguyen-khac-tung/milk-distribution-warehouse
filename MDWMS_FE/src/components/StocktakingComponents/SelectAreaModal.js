import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { X, MapPin, RefreshCw, AlertCircle, Thermometer, Droplets, Sun, User } from "lucide-react";
import { getStocktakingAreaById, getStocktakingAreaDetailBySheetId } from "../../services/StocktakingService";
import { extractErrorMessage } from "../../utils/Validation";
import AreaStatusDisplay, { STOCK_AREA_STATUS } from "../../pages/StocktakingArea/AreaStatusDisplay";

export default function SelectAreaModal({
    isOpen,
    onClose,
    onConfirm,
    stocktakingSheetId,
    loading = false
}) {
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        if (isOpen && stocktakingSheetId) {
            fetchAreas();
        } else {
            setAreas([]);
            setSelectedAreaId(null);
        }
    }, [isOpen, stocktakingSheetId]);

    const fetchAreas = async () => {
        if (!stocktakingSheetId) return;

        try {
            setLoadingAreas(true);
            const response = await getStocktakingAreaById(stocktakingSheetId);
            const areasData = response?.data || response || [];
            const areasArray = Array.isArray(areasData) ? areasData : [areasData];
            setAreas(areasArray);
        } catch (error) {
            console.error("Error fetching areas:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tải danh sách khu vực");
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setLoadingAreas(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedAreaId) {
            if (window.showToast) {
                window.showToast("Vui lòng chọn một khu vực", "warning");
            }
            return;
        }

        // Tìm area được chọn để log thông tin
        const selectedArea = areas.find(area =>
            area.stocktakingAreaId === selectedAreaId ||
            String(area.stocktakingAreaId) === String(selectedAreaId)
        );

        if (selectedArea) {
            const areaName = selectedArea.areaDetail?.areaName || "Unknown";
            console.log("Confirming area selection:", {
                areaName: areaName,
                stocktakingAreaId: selectedAreaId,
                fullArea: selectedArea
            });
        }

        if (onConfirm) {
            onConfirm(selectedAreaId);
        }
    };

    const handleViewDetail = async () => {
        if (!selectedAreaId || !stocktakingSheetId) {
            if (window.showToast) {
                window.showToast("Vui lòng chọn một khu vực", "warning");
            }
            return;
        }

        try {
            setLoadingDetail(true);
            // Truyền stocktakingAreaId như query parameter
            const response = await getStocktakingAreaDetailBySheetId(stocktakingSheetId, selectedAreaId);
            console.log("Stocktaking area detail:", response);

            if (window.showToast) {
                window.showToast("Xem chi tiết phiếu kiểm kê thành công", "success");
            }

            // Đóng modal và navigate đến trang chi tiết với stocktakingAreaId như query parameter
            onClose();
            navigate(`/stocktaking-area/${stocktakingSheetId}?stocktakingAreaId=${selectedAreaId}`);
        } catch (error) {
            console.error("Error fetching stocktaking area detail:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tải chi tiết phiếu kiểm kê");
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleClose = () => {
        setSelectedAreaId(null);
        if (onClose) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 border-2 border-green-100">
                            <MapPin className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Chọn khu vực kiểm kê
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Vui lòng chọn khu vực bạn muốn bắt đầu kiểm kê
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading || loadingAreas}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loadingAreas ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
                                <p className="text-sm text-gray-500">Đang tải danh sách khu vực...</p>
                            </div>
                        </div>
                    ) : areas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500">Không có khu vực nào để chọn</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {areas.map((area) => {
                                // Đảm bảo lấy đúng stocktakingAreaId từ area object
                                const areaId = area.stocktakingAreaId;
                                const areaDetail = area.areaDetail || {};
                                const areaName = areaDetail.areaName || `Khu vực ${areaDetail.areaId || areaId}`;
                                const assignToName = area.assignToName || areaDetail.assignName || "-";
                                const assignTo = area.assignTo || areaDetail.assignTo;
                                const status = area.status;
                                const temperatureMin = areaDetail.temperatureMin;
                                const temperatureMax = areaDetail.temperatureMax;
                                const humidityMin = areaDetail.humidityMin;
                                const humidityMax = areaDetail.humidityMax;
                                const lightLevel = areaDetail.lightLevel;
                                const availableLocationCount = areaDetail.availableLocationCount || 0;
                                const unAvailableLocationCount = areaDetail.unAvailableLocationCount || 0;
                                // So sánh với cả string và number để đảm bảo match
                                const isSelected = selectedAreaId === areaId || String(selectedAreaId) === String(areaId);

                                const handleAreaClick = (e) => {
                                    e.stopPropagation();
                                    console.log("Selected area:", areaName, "with stocktakingAreaId:", areaId);
                                    setSelectedAreaId(areaId);
                                };

                                return (
                                    <div
                                        key={areaId}
                                        onClick={handleAreaClick}
                                        className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                            ? "border-green-500 bg-green-50 shadow-md"
                                            : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                                ? "border-green-500 bg-green-500"
                                                : "border-gray-300"
                                                }`}>
                                                {isSelected && (
                                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {/* Header: Area Name with Status */}
                                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                    <MapPin className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                    <h3 className="font-bold text-lg text-gray-900">{areaName}</h3>
                                                    {status !== undefined && status !== null && (
                                                        <AreaStatusDisplay status={status} />
                                                    )}
                                                </div>

                                                {/* Assign To */}
                                                {assignToName && assignToName !== "-" && (
                                                    <div className="flex items-center gap-2 mb-3 text-sm">
                                                        <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                        <span className="text-gray-600">
                                                            Người được phân công: <span className="font-semibold text-gray-900">{assignToName}</span>
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Temperature */}
                                                {(temperatureMin !== undefined || temperatureMax !== undefined) && (
                                                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                                        <Thermometer className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                                        <span>
                                                            Nhiệt độ: {temperatureMin !== undefined ? `${temperatureMin}°C` : ""}
                                                            {temperatureMin !== undefined && temperatureMax !== undefined ? " - " : ""}
                                                            {temperatureMax !== undefined ? `${temperatureMax}°C` : ""}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Humidity */}
                                                {(humidityMin !== undefined || humidityMax !== undefined) && (
                                                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                                        <Droplets className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                        <span>
                                                            Độ ẩm: {humidityMin !== undefined ? `${humidityMin}%` : ""}
                                                            {humidityMin !== undefined && humidityMax !== undefined ? " - " : ""}
                                                            {humidityMax !== undefined ? `${humidityMax}%` : ""}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Light Level */}
                                                {lightLevel && (
                                                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                                        <Sun className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                                        <span>Mức ánh sáng: <span className="font-medium">{lightLevel}</span></span>
                                                    </div>
                                                )}

                                                {/* Location Count */}
                                                {(availableLocationCount > 0 || unAvailableLocationCount > 0) && (
                                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                                                        <span>Vị trí khả dụng: <span className="font-semibold text-green-600">{availableLocationCount}</span></span>
                                                        <span>Vị trí không khả dụng: <span className="font-semibold text-red-600">{unAvailableLocationCount}</span></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading || loadingAreas || loadingDetail}
                        className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        Hủy
                    </Button>
                    {(() => {
                        // Tìm area được chọn để kiểm tra trạng thái
                        const selectedArea = selectedAreaId ? areas.find(area =>
                            area.stocktakingAreaId === selectedAreaId ||
                            String(area.stocktakingAreaId) === String(selectedAreaId)
                        ) : null;

                        const areaStatus = selectedArea?.status;
                        // Chỉ khi status = 1 (Đã Phân Công) -> hiển thị "Bắt đầu kiểm kê"
                        // Tất cả các trạng thái khác (2, 3, 4) -> hiển thị "Chi tiết phiếu kiểm kê"
                        const isAssigned = areaStatus === STOCK_AREA_STATUS.Assigned || areaStatus === 1;

                        if (isAssigned) {
                            return (
                                <Button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={loading || loadingAreas || loadingDetail || !selectedAreaId}
                                    className="h-[38px] px-8 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </div>
                                    ) : (
                                        "Bắt đầu kiểm kê"
                                    )}
                                </Button>
                            );
                        } else {
                            return (
                                <Button
                                    type="button"
                                    onClick={handleViewDetail}
                                    disabled={loading || loadingAreas || loadingDetail || !selectedAreaId}
                                    className="h-[38px] px-8 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingDetail ? (
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Đang tải...
                                        </div>
                                    ) : (
                                        "Chi tiết phiếu kiểm kê"
                                    )}
                                </Button>
                            );
                        }
                    })()}
                </div>
            </div>
        </div>,
        document.body
    );
}

