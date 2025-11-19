import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { X, AlertCircle } from "lucide-react";

export default function RejectStocktakingLocationModal({
    isOpen,
    onClose,
    onConfirm,
    selectedLocations,
    stocktakingAreas,
    locationWarnings = {}, // Map locationId -> warnings array
    loading = false
}) {
    const [rejectReasons, setRejectReasons] = useState({});
    const [errors, setErrors] = useState({});

    // Get location details from stocktakingAreas
    const getLocationDetails = () => {
        const locations = [];
        selectedLocations.forEach((selectedLocationId) => {
            for (const area of stocktakingAreas) {
                const location = (area.stocktakingLocations || []).find(
                    loc => {
                        const locId = loc.stocktakingLocationId || loc.locationId;
                        return locId === selectedLocationId;
                    }
                );
                if (location) {
                    // stocktakingLocationId is the ID used for selection
                    const stocktakingLocationId = location.stocktakingLocationId || location.locationId;
                    // locationId is the actual location ID (not stocktaking location ID)
                    const actualLocationId = location.location?.locationId || location.locationId;

                    locations.push({
                        stocktakingLocationId: stocktakingLocationId,
                        locationId: actualLocationId,
                        locationCode: location.locationCode || location.location?.locationCode || location.locationName || '-',
                        status: location.status,
                        areaName: area.areaDetail?.areaName || 'N/A'
                    });
                    break;
                }
            }
        });
        return locations;
    };

    // Reset state when modal opens/closes and auto-fill warnings
    useEffect(() => {
        if (isOpen) {
            const initialReasons = {};
            
            // Get location details
            const locationDetails = [];
            selectedLocations.forEach((selectedLocationId) => {
                for (const area of stocktakingAreas) {
                    const location = (area.stocktakingLocations || []).find(
                        loc => {
                            const locId = loc.stocktakingLocationId || loc.locationId;
                            return locId === selectedLocationId;
                        }
                    );
                    if (location) {
                        const stocktakingLocationId = location.stocktakingLocationId || location.locationId;
                        locationDetails.push({
                            stocktakingLocationId: stocktakingLocationId,
                            locationId: location.location?.locationId || location.locationId,
                            locationCode: location.locationCode || location.location?.locationCode || location.locationName || '-',
                            status: location.status,
                            areaName: area.areaDetail?.areaName || 'N/A'
                        });
                        break;
                    }
                }
            });
            
            // Auto-fill warnings for each location
            locationDetails.forEach((location) => {
                const locationId = location.stocktakingLocationId;
                const warnings = locationWarnings[locationId] || [];
                
                if (warnings.length > 0) {
                    // Join all warning messages with newline
                    const warningMessages = warnings.map(w => w.message).join('\n');
                    initialReasons[locationId] = warningMessages;
                } else {
                    initialReasons[locationId] = '';
                }
            });
            
            setRejectReasons(initialReasons);
            setErrors({});
        }
    }, [isOpen, selectedLocations, locationWarnings, stocktakingAreas]);

    if (!isOpen) return null;

    const locationDetails = getLocationDetails();
    const isMultiple = locationDetails.length > 1;

    const handleReasonChange = (locationId, value) => {
        setRejectReasons(prev => ({
            ...prev,
            [locationId]: value
        }));
        // Clear error when user starts typing
        if (errors[locationId]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[locationId];
                return newErrors;
            });
        }
    };

    const validateReasons = () => {
        const newErrors = {};
        let isValid = true;

        locationDetails.forEach((location) => {
            const reason = rejectReasons[location.stocktakingLocationId] || "";
            if (!reason.trim()) {
                newErrors[location.stocktakingLocationId] = "Vui lòng nhập lý do từ chối";
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleConfirm = () => {
        if (!validateReasons()) {
            if (window.showToast) {
                window.showToast("Vui lòng nhập lý do từ chối cho tất cả các vị trí", "error");
            }
            return;
        }

        // Prepare records for API
        const records = locationDetails.map(location => ({
            stocktakingLocationId: location.stocktakingLocationId,
            rejectReason: rejectReasons[location.stocktakingLocationId] || "",
            locationId: location.locationId
        }));

        onConfirm(records);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000]">
            <div className={`bg-white rounded-xl shadow-2xl border border-gray-100 ${isMultiple ? 'max-w-5xl w-full mx-4' : 'max-w-2xl w-full mx-4'} max-h-[90vh] flex flex-col`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 border-2 border-orange-100">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {isMultiple ? `Từ chối kiểm kê (${locationDetails.length} vị trí)` : "Từ chối kiểm kê"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Vui lòng nhập lý do từ chối cho {isMultiple ? "các vị trí" : "vị trí"} đã chọn
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isMultiple ? (
                        <div className="space-y-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-orange-800">
                                        <p className="font-medium mb-1">Lưu ý:</p>
                                        <p>Bạn cần nhập lý do từ chối cho từng vị trí. Sau khi từ chối, các vị trí này sẽ được chuyển về trạng thái "Chờ kiểm kê" và cần được kiểm kê lại.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-100 hover:bg-gray-100">
                                            <TableHead className="font-semibold text-gray-700 text-center w-16">STT</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Khu vực</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Mã vị trí</TableHead>
                                            <TableHead className="font-semibold text-gray-700 min-w-[300px]">Lý do từ chối <span className="text-red-500">*</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {locationDetails.map((location, index) => {
                                            const locationId = location.stocktakingLocationId;
                                            const hasError = errors[locationId];
                                            return (
                                                <TableRow key={locationId} className="hover:bg-gray-50">
                                                    <TableCell className="text-center text-gray-600 text-sm">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-700">
                                                        {location.areaName}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-gray-900 text-sm">
                                                        {location.locationCode}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <textarea
                                                                className={`w-full h-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none ${hasError ? 'border-red-500' : 'border-gray-300'
                                                                    }`}
                                                                placeholder="Nhập lý do từ chối (bắt buộc)"
                                                                maxLength={500}
                                                                value={rejectReasons[locationId] || ""}
                                                                onChange={(e) => handleReasonChange(locationId, e.target.value)}
                                                                disabled={loading}
                                                                required
                                                            />
                                                            <div className="flex justify-between items-center mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    {(rejectReasons[locationId] || "").length}/500 ký tự
                                                                </span>
                                                                {hasError && (
                                                                    <span className="text-xs text-red-500">
                                                                        {errors[locationId]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {locationDetails.length > 0 && (
                                <>
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-orange-800">
                                                <p className="font-medium mb-1">Lưu ý:</p>
                                                <p>Sau khi từ chối, vị trí này sẽ được chuyển về trạng thái "Chờ kiểm kê" và cần được kiểm kê lại.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Khu vực
                                            </label>
                                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
                                                {locationDetails[0].areaName}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mã vị trí
                                            </label>
                                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
                                                {locationDetails[0].locationCode}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Lý do từ chối <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                className={`w-full h-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${errors[locationDetails[0].stocktakingLocationId] ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Nhập lý do từ chối (bắt buộc)"
                                                maxLength={500}
                                                value={rejectReasons[locationDetails[0].stocktakingLocationId] || ""}
                                                onChange={(e) => handleReasonChange(locationDetails[0].stocktakingLocationId, e.target.value)}
                                                disabled={loading}
                                                required
                                            />
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-xs text-gray-500">
                                                    {(rejectReasons[locationDetails[0].stocktakingLocationId] || "").length}/500 ký tự
                                                </span>
                                                {errors[locationDetails[0].stocktakingLocationId] && (
                                                    <span className="text-xs text-red-500">
                                                        {errors[locationDetails[0].stocktakingLocationId]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="h-[38px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
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
    );
}

