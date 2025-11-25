import React, { useState, useEffect, useRef, useMemo } from "react";
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
    locationFails = {}, // Map locationId -> fails array
    loading = false
}) {
    const [rejectReasons, setRejectReasons] = useState({});
    const [errors, setErrors] = useState({});
    const isInitializedRef = useRef(false);
    const prevDepsRef = useRef({});

    // Memoize location details to avoid recalculating on every render
    const locationDetails = useMemo(() => {
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
    }, [selectedLocations, stocktakingAreas]);

    // Create stable dependency keys to avoid infinite loops
    const selectedLocationsKey = useMemo(() => JSON.stringify(selectedLocations), [selectedLocations]);
    const locationWarningsKey = useMemo(() => JSON.stringify(locationWarnings), [locationWarnings]);
    const locationFailsKey = useMemo(() => JSON.stringify(locationFails), [locationFails]);
    const stocktakingAreasKey = useMemo(() => JSON.stringify(stocktakingAreas), [stocktakingAreas]);

    // Reset state when modal opens/closes and auto-fill warnings
    useEffect(() => {
        // Create a stable key for current dependencies
        const currentDepsKey = `${isOpen}-${selectedLocationsKey}-${locationWarningsKey}-${locationFailsKey}-${stocktakingAreasKey}`;
        const prevDepsKey = prevDepsRef.current.key;

        // Only initialize if modal is open, not already initialized, and dependencies actually changed
        if (isOpen && (!isInitializedRef.current || currentDepsKey !== prevDepsKey)) {
            const initialReasons = {};

            // Calculate location details inside effect to avoid dependency issues
            const locationDetailsInEffect = [];
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
                        locationDetailsInEffect.push({
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

            // Auto-fill fails and warnings for each location
            locationDetailsInEffect.forEach((location) => {
                const locationId = location.stocktakingLocationId;
                const fails = locationFails[locationId] || [];
                const warnings = locationWarnings[locationId] || [];

                const messages = [];

                // Add fails first (errors)
                if (fails.length > 0) {
                    fails.forEach(fail => {
                        if (fail.palletId) {
                            messages.push(`[Lỗi]${fail.message}`);
                        } else {
                            messages.push(`[Lỗi] ${fail.message}`);
                        }
                    });
                }

                // Add warnings
                if (warnings.length > 0) {
                    warnings.forEach(warning => {
                        if (warning.palletId) {
                            messages.push(`[Cảnh báo]${warning.message}`);
                        } else {
                            messages.push(`[Cảnh báo] ${warning.message}`);
                        }
                    });
                }

                if (messages.length > 0) {
                    initialReasons[locationId] = messages.join('\n');
                } else {
                    initialReasons[locationId] = '';
                }
            });

            setRejectReasons(initialReasons);
            setErrors({});
            isInitializedRef.current = true;
            prevDepsRef.current.key = currentDepsKey;
        } else if (!isOpen) {
            // Reset when modal closes
            isInitializedRef.current = false;
            prevDepsRef.current.key = '';
            setRejectReasons({});
            setErrors({});
        }
    }, [isOpen, selectedLocationsKey, locationWarningsKey, locationFailsKey, stocktakingAreasKey, selectedLocations, stocktakingAreas]);

    if (!isOpen) return null;

    const isMultiple = locationDetails.length > 1;

    const handleReasonChange = (locationId, value) => {
        setRejectReasons(prev => ({
            ...prev,
            [locationId]: value
        }));
        // Validate and update error in real-time
        if (!value.trim()) {
            setErrors(prev => ({
                ...prev,
                [locationId]: "Vui lòng nhập lý do từ chối"
            }));
        } else {
            // Clear error when user enters valid text
            if (errors[locationId]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[locationId];
                    return newErrors;
                });
            }
        }
    };

    const handleReasonBlur = (locationId) => {
        const reason = rejectReasons[locationId] || "";
        if (!reason.trim()) {
            setErrors(prev => ({
                ...prev,
                [locationId]: "Vui lòng nhập lý do từ chối"
            }));
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
        return { isValid, errors: newErrors };
    };

    const handleConfirm = () => {
        // Validate all fields and show errors
        const { isValid, errors: validationErrors } = validateReasons();

        if (!isValid) {
            if (window.showToast) {
                window.showToast("Vui lòng nhập lý do từ chối cho tất cả các vị trí", "error");
            }
            // Scroll to first error field
            const firstErrorLocationId = Object.keys(validationErrors)[0];
            if (firstErrorLocationId) {
                setTimeout(() => {
                    const textarea = document.querySelector(`textarea[data-location-id="${firstErrorLocationId}"]`);
                    if (textarea) {
                        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        textarea.focus();
                    }
                }, 100);
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
                                        <p>Bạn cần nhập lý do từ chối cho từng vị trí. Lý do đã được tự động điền từ cảnh báo/lỗi (nếu có), bạn có thể chỉnh sửa hoặc thêm vào. Sau khi từ chối, các vị trí này sẽ được chuyển về trạng thái "Chờ kiểm kê" và cần được kiểm kê lại.</p>
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
                                                                data-location-id={locationId}
                                                                className={`w-full h-32 px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-y ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                                                    }`}
                                                                placeholder="Nhập lý do từ chối (bắt buộc). Bạn có thể chỉnh sửa hoặc thêm vào lý do đã được tự động điền."
                                                                maxLength={500}
                                                                value={rejectReasons[locationId] || ""}
                                                                onChange={(e) => handleReasonChange(locationId, e.target.value)}
                                                                onBlur={() => handleReasonBlur(locationId)}
                                                                disabled={loading}
                                                                required
                                                            />
                                                            <div className="flex justify-between items-start mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    {(rejectReasons[locationId] || "").length}/500 ký tự
                                                                </span>
                                                                {hasError && (
                                                                    <span className="text-xs text-red-500 font-medium flex-1 text-right ml-2">
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
                                                <p>Lý do đã được tự động điền từ cảnh báo/lỗi (nếu có), bạn có thể chỉnh sửa hoặc thêm vào. Sau khi từ chối, vị trí này sẽ được chuyển về trạng thái "Chờ kiểm kê" và cần được kiểm kê lại.</p>
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
                                                data-location-id={locationDetails[0].stocktakingLocationId}
                                                className={`w-full h-32 px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-y ${errors[locationDetails[0].stocktakingLocationId] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Nhập lý do từ chối (bắt buộc). Bạn có thể chỉnh sửa hoặc thêm vào lý do đã được tự động điền."
                                                maxLength={500}
                                                value={rejectReasons[locationDetails[0].stocktakingLocationId] || ""}
                                                onChange={(e) => handleReasonChange(locationDetails[0].stocktakingLocationId, e.target.value)}
                                                onBlur={() => handleReasonBlur(locationDetails[0].stocktakingLocationId)}
                                                disabled={loading}
                                                required
                                            />
                                            <div className="flex justify-between items-start mt-1">
                                                <span className="text-xs text-gray-500">
                                                    {(rejectReasons[locationDetails[0].stocktakingLocationId] || "").length}/500 ký tự
                                                </span>
                                                {errors[locationDetails[0].stocktakingLocationId] && (
                                                    <span className="text-xs text-red-500 font-medium flex-1 text-right ml-2">
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

