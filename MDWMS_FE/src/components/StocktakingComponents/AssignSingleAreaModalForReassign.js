import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Users, User, CheckCircle2, Thermometer, Droplets, Sun, Package, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { getStocktakingArea } from '../../services/AreaServices';
import { getUserDropDownByRoleName } from '../../services/AccountService';
import { reAssignStocktakingArea } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';

const AssignSingleAreaModalForReassign = ({
    isOpen,
    onClose,
    onSuccess,
    stocktakingSheetId,
    stocktaking = null,
    areaId // areaId (int) của khu vực cần phân công lại
}) => {
    const [area, setArea] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [loadingArea, setLoadingArea] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const isFetchingRef = useRef(false);

    // Memoize stocktakingAreas để tránh trigger useEffect không cần thiết
    const stocktakingAreasStr = useMemo(() => {
        return stocktaking?.stocktakingAreas ? JSON.stringify(stocktaking.stocktakingAreas) : '';
    }, [stocktaking?.stocktakingAreas]);

    useEffect(() => {
        if (isOpen && !isFetchingRef.current) {
            isFetchingRef.current = true;
            fetchAreaAndEmployees();
        }

        // Reset ref khi modal đóng
        if (!isOpen) {
            isFetchingRef.current = false;
        }
    }, [isOpen]); // Chỉ phụ thuộc vào isOpen để tránh gọi API nhiều lần

    // Separate effect để pre-select assignment khi stocktaking thay đổi (chỉ khi modal đã mở)
    useEffect(() => {
        if (isOpen && stocktakingAreasStr && areaId) {
            try {
                const stocktakingAreas = JSON.parse(stocktakingAreasStr);
                const currentAssignment = stocktakingAreas.find(
                    sa => sa.areaId === areaId
                );
                if (currentAssignment?.assignTo) {
                    setSelectedEmployeeId(currentAssignment.assignTo);
                }
            } catch (error) {
                console.error('Error parsing stocktaking areas:', error);
            }
        }
    }, [isOpen, stocktakingAreasStr, areaId]);

    const fetchAreaAndEmployees = async () => {
        setLoadingArea(true);
        setLoadingEmployees(true);

        try {
            // Fetch stocktaking areas
            if (stocktakingSheetId) {
                const areasResponse = await getStocktakingArea(stocktakingSheetId);
                const areasData = areasResponse?.data || areasResponse || [];
                const areasArray = Array.isArray(areasData) ? areasData : [];

                // Tìm khu vực cần phân công lại
                const targetArea = areasArray.find(a => (a.areaId || a.id) === areaId);
                setArea(targetArea || null);
            } else {
                setArea(null);
            }

            // Fetch warehouse staff
            const employeesResponse = await getUserDropDownByRoleName('Warehouse Staff');
            const employeesData = employeesResponse?.data || employeesResponse || [];
            setEmployees(Array.isArray(employeesData) ? employeesData : []);
        } catch (error) {
            console.error('Error fetching area and employees:', error);
            if (window.showToast) {
                window.showToast('Không thể tải thông tin khu vực và nhân viên', 'error');
            }
        } finally {
            setLoadingArea(false);
            setLoadingEmployees(false);
            isFetchingRef.current = false;
        }
    };

    const handleEmployeeSelect = (employeeId) => {
        setSelectedEmployeeId(selectedEmployeeId === employeeId ? null : employeeId);
    };

    const handleSubmit = async () => {
        if (!selectedEmployeeId) {
            if (window.showToast) {
                window.showToast('Vui lòng chọn nhân viên cho khu vực', 'error');
            }
            return;
        }

        if (!stocktakingSheetId) {
            throw new Error('Không tìm thấy ID phiếu kiểm kê');
        }

        setSubmitting(true);
        try {
            // Tìm stocktakingAreaId từ stocktaking data
            const areaData = stocktaking?.stocktakingAreas?.find(
                sa => sa.areaId === areaId
            );
            const stocktakingAreaId = areaData?.stocktakingAreaId || areaData?.id;

            if (!stocktakingAreaId) {
                throw new Error('Không tìm thấy ID khu vực kiểm kê');
            }

            // Gọi API phân công lại
            await reAssignStocktakingArea(stocktakingAreaId, selectedEmployeeId);

            // Hiển thị toast
            if (window.showToast) {
                window.showToast('Phân công lại thành công!', 'success');
            }

            // Đóng modal trước khi gọi onSuccess để tránh trigger useEffect
            onClose();

            // Gọi onSuccess sau khi đóng modal
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi phân công lại', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const areaName = area?.areaName || area?.name || 'Khu vực';
    const currentAssignment = stocktaking?.stocktakingAreas?.find(
        sa => sa.areaId === areaId
    );
    const currentEmployeeName = currentAssignment?.assignToName ||
        currentAssignment?.assignToNavigation?.fullName ||
        currentAssignment?.assignToNavigation?.name ||
        '';

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-100">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <MapPin className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Phân công lại nhân viên
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Chọn nhân viên cho khu vực kiểm kê</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={submitting}
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loadingArea || loadingEmployees ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : !area ? (
                        <div className="text-center py-12 text-gray-500">
                            Không tìm thấy thông tin khu vực
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Area Information Card - Larger */}
                            <div className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:border-orange-300 transition-all shadow-sm flex flex-col" style={{ height: '450px' }}>
                                <div className="flex-shrink-0 mb-4 pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-orange-50 rounded-lg">
                                            <MapPin className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700">{areaName}</h3>
                                    </div>

                                    {/* Current Assignment Info */}
                                    {currentEmployeeName && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                <span className="font-medium text-yellow-800 text-sm">Đã phân công:</span>
                                            </div>
                                            <div className="text-sm text-yellow-900 font-semibold ml-6">
                                                {currentEmployeeName}
                                            </div>
                                        </div>
                                    )}

                                    {/* Area Details */}
                                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                                        {area.unAvailableLocationCount !== undefined && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Package className="h-4 w-4 text-blue-500" />
                                                <span>Vị trí đã xếp pallet: <span className="font-semibold text-blue-600">{area.unAvailableLocationCount}</span></span>
                                            </div>
                                        )}
                                        {area.availableLocationCount !== undefined && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Package className="h-4 w-4 text-red-500" />
                                                <span>Vị trí chưa xếp pallet: <span className="font-semibold text-red-600">{area.availableLocationCount}</span></span>
                                            </div>
                                        )}
                                        {area.temperatureMin !== undefined && area.temperatureMax !== undefined && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Thermometer className="h-4 w-4 text-red-500" />
                                                <span>Nhiệt độ: <span className="font-semibold text-red-600">{area.temperatureMin}°C - {area.temperatureMax}°C</span></span>
                                            </div>
                                        )}
                                        {area.humidityMin !== undefined && area.humidityMax !== undefined && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Droplets className="h-4 w-4 text-cyan-500" />
                                                <span>Độ ẩm: <span className="font-semibold text-cyan-600">{area.humidityMin}% - {area.humidityMax}%</span></span>
                                            </div>
                                        )}
                                        {area.lightLevel && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Sun className="h-4 w-4 text-yellow-500" />
                                                <span>Ánh sáng: <span className="font-semibold text-yellow-600">{area.lightLevel}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Employee Selection */}
                                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3 flex-shrink-0">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        Chọn nhân viên:
                                    </label>

                                    {/* Employee List Container - Scrollable area only */}
                                    <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
                                        {/* Scrollable Employee List */}
                                        <div className="flex-1 overflow-y-auto pr-2" style={{ paddingBottom: selectedEmployeeId ? '50px' : '0px' }}>
                                            {employees.length === 0 ? (
                                                <div className="text-center py-4 text-sm text-slate-400">
                                                    Không có nhân viên khả dụng
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-3">
                                                    {employees.map((emp) => {
                                                        const empId = emp.userId || emp.id;
                                                        const empName = emp.fullName || emp.name || emp.userName || 'Nhân viên';
                                                        const empPhone = emp.phone || '';
                                                        const isSelected = selectedEmployeeId === empId;

                                                        return (
                                                            <div
                                                                key={empId}
                                                                onClick={() => handleEmployeeSelect(empId)}
                                                                className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${isSelected
                                                                    ? 'border-orange-500 bg-orange-50 shadow-md'
                                                                    : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <User className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                                                                        <h5 className={`font-semibold text-sm truncate flex-1 ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>
                                                                            {empName}
                                                                        </h5>
                                                                        {isSelected && (
                                                                            <CheckCircle2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    {empPhone && (
                                                                        <p className="text-xs text-slate-500 ml-6 truncate">
                                                                            {empPhone}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        {/* Selected Employee Summary - Fixed at bottom */}
                                        {selectedEmployeeId && (
                                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-green-50 border-2 border-green-200 rounded-lg">
                                                <div className="flex items-center gap-1.5 text-green-700">
                                                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span className="text-xs font-medium truncate">
                                                        Đã phân công: {employees.find(emp => (emp.userId || emp.id) === selectedEmployeeId)?.fullName || employees.find(emp => (emp.userId || emp.id) === selectedEmployeeId)?.name || 'Nhân viên'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
                    <div className="flex justify-end gap-3">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            disabled={submitting}
                            className="h-[38px] px-6 border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || loadingArea || loadingEmployees || !selectedEmployeeId}
                            className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang phân công...
                                </div>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Xác nhận phân công lại
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AssignSingleAreaModalForReassign;

