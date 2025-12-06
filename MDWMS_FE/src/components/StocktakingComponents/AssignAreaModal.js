import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Users, User, CheckCircle2, Thermometer, Droplets, Sun, Package, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { getStocktakingArea } from '../../services/AreaServices';
import { getUserDropDownByRoleName } from '../../services/AccountService';
import { assignStocktakingAreas, reAssignAreaConfirm, createStocktaking, updateStocktaking } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import dayjs from 'dayjs';

const AssignAreaModal = ({
    isOpen,
    onClose,
    onSuccess,
    stocktakingSheetId,
    isReassign = false,
    stocktaking = null,
    formData = null, // Form data để tạo phiếu kiểm kê (chỉ dùng khi chưa có stocktakingSheetId)
    areasToReassign = [], // Danh sách khu vực cần phân công lại (nếu chỉ có 1 khu vực)
    selectedAreaIds = [] // Danh sách areaIds đã chọn trong form (để cập nhật vào stocktaking)
}) => {
    const [areas, setAreas] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [areaAssignments, setAreaAssignments] = useState({}); // { areaId: employeeId }
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const isFetchingRef = React.useRef(false);

    useEffect(() => {
        if (isOpen && !isFetchingRef.current) {
            isFetchingRef.current = true;
            fetchAreasAndEmployees();
            // Pre-select current assignments if reassigning
            if (isReassign && stocktaking?.stocktakingAreas) {
                const currentAssignments = {};
                stocktaking.stocktakingAreas.forEach((sa) => {
                    const areaId = sa.areaId || sa.stocktakingAreaId;
                    // Chỉ pre-select nếu khu vực này nằm trong danh sách cần phân công lại
                    // hoặc nếu không có areasToReassign (tức là phân công lại tất cả)
                    if (areaId && sa.assignTo && (areasToReassign.length === 0 || areasToReassign.includes(areaId))) {
                        currentAssignments[areaId] = sa.assignTo;
                    }
                });
                setAreaAssignments(currentAssignments);
            } else {
                setAreaAssignments({});
            }
        }

        // Reset ref khi modal đóng
        if (!isOpen) {
            isFetchingRef.current = false;
        }
    }, [isOpen]); // Chỉ phụ thuộc vào isOpen để tránh gọi API nhiều lần

    // Memoize areasToReassign và stocktakingAreas để tránh trigger useEffect không cần thiết
    const areasToReassignStr = useMemo(() => JSON.stringify(areasToReassign), [areasToReassign]);
    const stocktakingAreasStr = useMemo(() => {
        return stocktaking?.stocktakingAreas ? JSON.stringify(stocktaking.stocktakingAreas) : '';
    }, [stocktaking?.stocktakingAreas]);

    // Separate effect để update assignments khi stocktaking thay đổi (chỉ khi modal đã mở)
    useEffect(() => {
        if (isOpen && isReassign && stocktakingAreasStr) {
            try {
                const currentAssignments = {};
                const areasToReassignArray = JSON.parse(areasToReassignStr);
                const stocktakingAreas = JSON.parse(stocktakingAreasStr);
                stocktakingAreas.forEach((sa) => {
                    const areaId = sa.areaId || sa.stocktakingAreaId;
                    if (areaId && sa.assignTo && (areasToReassignArray.length === 0 || areasToReassignArray.includes(areaId))) {
                        currentAssignments[areaId] = sa.assignTo;
                    }
                });
                setAreaAssignments(currentAssignments);
            } catch (error) {
                console.error('Error parsing stocktaking areas:', error);
            }
        }
    }, [isOpen, isReassign, stocktakingAreasStr, areasToReassignStr]);

    const fetchAreasAndEmployees = async () => {
        setLoadingAreas(true);
        setLoadingEmployees(true);

        try {
            // Fetch stocktaking areas with detailed information
            // Only fetch if stocktakingSheetId is available
            if (stocktakingSheetId) {
                const areasResponse = await getStocktakingArea(stocktakingSheetId);
                const areasData = areasResponse?.data || areasResponse || [];
                setAreas(Array.isArray(areasData) ? areasData : []);
            } else {
                // If no stocktakingSheetId, set empty array
                setAreas([]);
            }

            // Fetch warehouse staff
            const employeesResponse = await getUserDropDownByRoleName('Warehouse Staff');
            const employeesData = employeesResponse?.data || employeesResponse || [];
            setEmployees(Array.isArray(employeesData) ? employeesData : []);
        } catch (error) {
            console.error('Error fetching areas and employees:', error);
            if (window.showToast) {
                window.showToast('Không thể tải danh sách khu vực và nhân viên', 'error');
            }
        } finally {
            setLoadingAreas(false);
            setLoadingEmployees(false);
            isFetchingRef.current = false;
        }
    };

    const handleAreaAssignmentChange = (areaId, employeeId) => {
        setAreaAssignments(prev => ({
            ...prev,
            [areaId]: employeeId
        }));
    };

    const handleSubmit = async () => {
        // Lọc areas để chỉ lấy các khu vực cần hiển thị
        const displayAreas = areasToReassign.length > 0
            ? areas.filter(area => {
                const areaId = area.areaId || area.id;
                return areasToReassign.includes(areaId);
            })
            : areas;

        // Validate: all areas must have an employee assigned
        const unassignedAreas = displayAreas.filter(area => !areaAssignments[area.areaId || area.id]);
        if (unassignedAreas.length > 0) {
            if (window.showToast) {
                window.showToast('Vui lòng phân công nhân viên cho tất cả các khu vực', 'error');
            }
            return;
        }

        setSubmitting(true);
        try {
            let finalStocktakingSheetId = stocktakingSheetId;

            // Nếu có formData và đang update (đã có stocktakingSheetId), cập nhật trước
            if (formData && stocktakingSheetId && formData.stocktakingSheetId) {
                try {
                    // Format date
                    let startTimeISO = null;
                    if (formData.startTime) {
                        const date = dayjs(formData.startTime);
                        startTimeISO = date.format('YYYY-MM-DDTHH:mm:ss');
                    }

                    // Format areaIds từ selectedAreaIds hoặc areasToReassign
                    const areaIdsToUpdate = selectedAreaIds.length > 0 
                        ? selectedAreaIds.map(areaId => ({ areaId: areaId }))
                        : (areasToReassign.length > 0 
                            ? areasToReassign.map(areaId => ({ areaId: areaId }))
                            : []);

                    const submitData = {
                        stocktakingSheetId: stocktakingSheetId,
                        startTime: startTimeISO,
                        note: formData.reason?.trim() || '',
                        areaIds: areaIdsToUpdate
                    };

                    await updateStocktaking(submitData);
                } catch (error) {
                    console.error('Error updating stocktaking:', error);
                    const errorMessage = extractErrorMessage(error);
                    if (window.showToast) {
                        window.showToast(errorMessage || 'Có lỗi xảy ra khi cập nhật phiếu kiểm kê', 'error');
                    }
                    throw error;
                }
            }

            // Nếu không có stocktakingSheetId, báo lỗi (trừ khi đang tạo mới)
            if (!finalStocktakingSheetId && !formData) {
                throw new Error('Không tìm thấy ID phiếu kiểm kê');
            }

            // Tiến hành phân công
            if (isReassign) {
                // Dùng API reAssignAreaConfirm cho tất cả khu vực
                const assignmentData = displayAreas?.map(area => {
                    const areaId = area.areaId || area.id;
                    return {
                        areaId: areaId,
                        assignTo: areaAssignments[areaId]
                    };
                });

                await reAssignAreaConfirm({
                    stocktakingSheetId: finalStocktakingSheetId,
                    stocktakingAreaReAssign: assignmentData
                });
            } else {
                // Use assignStocktakingAreas API for initial assignment
                const assignmentData = displayAreas?.map(area => {
                    const areaId = area.areaId || area.id;
                    return {
                        areaId: areaId,
                        assignTo: areaAssignments[areaId]
                    };
                });

                // Nếu đang tạo mới (có formData nhưng chưa có stocktakingSheetId), tạo phiếu trước khi phân công
                if (formData && !finalStocktakingSheetId) {
                    try {
                        // Format date
                        let startTimeISO = null;
                        if (formData.startTime) {
                            const date = dayjs(formData.startTime);
                            startTimeISO = date.format('YYYY-MM-DDTHH:mm:ss');
                        }

                        const submitData = {
                            startTime: startTimeISO,
                            note: formData.reason?.trim() || ''
                        };

                        const createResponse = await createStocktaking(submitData);
                        finalStocktakingSheetId = createResponse?.data?.stocktakingSheetId ||
                            createResponse?.stocktakingSheetId ||
                            createResponse?.data?.data?.stocktakingSheetId;

                        if (!finalStocktakingSheetId) {
                            throw new Error('Không thể lấy ID phiếu kiểm kê sau khi tạo');
                        }
                    } catch (error) {
                        console.error('Error creating stocktaking:', error);
                        const errorMessage = extractErrorMessage(error);
                        if (window.showToast) {
                            window.showToast(errorMessage || 'Có lỗi xảy ra khi tạo phiếu kiểm kê', 'error');
                        }
                        throw error;
                    }
                }

                // Phân công sau khi đã có stocktakingSheetId
                await assignStocktakingAreas({
                    stocktakingSheetId: finalStocktakingSheetId,
                    stocktakingAreaAssign: assignmentData
                });
            }

            // Hiển thị toast duy nhất
            if (window.showToast) {
                if (formData) {
                    // Vừa tạo/cập nhật vừa phân công
                    if (stocktakingSheetId) {
                        window.showToast('Thực hiện phân công thành công!', 'success');
                    } else {
                        window.showToast('Thực hiện phân công thành công', 'success');
                    }
                } else {
                    // Chỉ phân công
                    window.showToast(isReassign ? 'Phân công lại thành công!' : 'Phân công thành công!', 'success');
                }
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
                window.showToast(errorMessage || (isReassign ? 'Có lỗi xảy ra khi phân công lại' : 'Có lỗi xảy ra khi phân công'), 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-100">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <MapPin className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isReassign ? 'Phân công lại nhân viên theo khu vực' : 'Phân công nhân viên theo khu vực'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Chọn nhân viên cho từng khu vực kiểm kê</p>
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
                    {loadingAreas || loadingEmployees ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Areas and Employees Assignment */}
                            <div className="grid grid-cols-2 gap-6">
                                {(areasToReassign.length > 0
                                    ? areas.filter(area => {
                                        const areaId = area.areaId || area.id;
                                        return areasToReassign.includes(areaId);
                                    })
                                    : areas
                                )?.map((area) => {
                                    const areaId = area.areaId || area.id;
                                    const areaName = area.areaName || area.name || 'Khu vực';
                                    const selectedEmployeeId = areaAssignments[areaId];

                                    // Get current assignment info for this area
                                    const currentAssignment = isReassign && stocktaking?.stocktakingAreas
                                        ? stocktaking.stocktakingAreas.find(sa => sa.areaId === areaId)
                                        : null;
                                    const currentEmployeeName = currentAssignment?.assignToName ||
                                        currentAssignment?.assignToNavigation?.fullName ||
                                        currentAssignment?.assignToNavigation?.name ||
                                        '';

                                    return (
                                        <div
                                            key={areaId}
                                            className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-orange-300 transition-all shadow-sm flex flex-col"
                                            style={{ height: '450px' }}
                                        >
                                            <div className="flex-shrink-0 mb-3 pb-3 border-b border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 bg-orange-50 rounded-lg">
                                                        <MapPin className="h-4 w-4 text-orange-500" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-700 text-base">{areaName}</h4>
                                                </div>

                                                {/* Current Assignment Info - Chỉ hiển thị khi phân công lại */}
                                                {isReassign && currentAssignment && currentEmployeeName && (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <AlertCircle className="h-3 w-3 text-yellow-600" />
                                                            <span className="font-medium text-yellow-800 text-xs">Đã phân công:</span>
                                                        </div>
                                                        <div className="text-xs text-yellow-900 font-semibold ml-4">
                                                            {currentEmployeeName}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Area Information */}
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {area.availableLocationCount !== undefined && (
                                                        <div className="flex items-center gap-1 text-slate-600">
                                                            <Package className="h-3 w-3 text-blue-500" />
                                                            <span>Vị trí đã xếp pallet: <span className="font-semibold text-blue-600">{area.unAvailableLocationCount}</span></span>
                                                        </div>

                                                    )}
                                                    {area.unAvailableLocationCount !== undefined && (
                                                        <div className="flex items-center gap-1 text-slate-600">
                                                            <Package className="h-3 w-3 text-red-500" />
                                                            <span>Vị trí chưa xếp pallet: <span className="font-semibold text-red-600">{area.availableLocationCount}</span></span>
                                                        </div>
                                                    )}
                                                    {area.temperatureMin !== undefined && area.temperatureMax !== undefined && (
                                                        <div className="flex items-center gap-1 text-slate-600">
                                                            <Thermometer className="h-3 w-3 text-red-500" />
                                                            <span>Nhiệt độ: <span className="font-semibold text-red-600">{area.temperatureMin}°C - {area.temperatureMax}°C</span></span>
                                                        </div>
                                                    )}
                                                    {area.humidityMin !== undefined && area.humidityMax !== undefined && (
                                                        <div className="flex items-center gap-1 text-slate-600">
                                                            <Droplets className="h-3 w-3 text-cyan-500" />
                                                            <span>Độ ẩm: <span className="font-semibold text-cyan-600">{area.humidityMin}% - {area.humidityMax}%</span></span>
                                                        </div>
                                                    )}
                                                    {area.lightLevel && (
                                                        <div className="flex items-center gap-1 text-slate-600">
                                                            <Sun className="h-3 w-3 text-yellow-500" />
                                                            <span>Ánh sáng: <span className="font-semibold text-yellow-600">{area.lightLevel}</span></span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Employee Selection */}
                                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                                <label className="text-xs font-semibold text-slate-700 flex items-center gap-2 mb-2 flex-shrink-0">
                                                    <Users className="h-3.5 w-3.5 text-slate-500" />
                                                    Chọn nhân viên:
                                                </label>

                                                {/* Employee List Container - Scrollable area only */}
                                                <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
                                                    {/* Scrollable Employee List */}
                                                    <div className="flex-1 overflow-y-auto pr-1" style={{ paddingBottom: selectedEmployeeId ? '50px' : '0px' }}>
                                                        {employees.length === 0 ? (
                                                            <div className="text-center py-4 text-sm text-slate-400">
                                                                Không có nhân viên khả dụng
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {employees?.map((emp) => {
                                                                    const empId = emp.userId || emp.id;
                                                                    const empName = emp.fullName || emp.name || emp.userName || 'Nhân viên';
                                                                    const empPhone = emp.phone || '';
                                                                    const isSelected = selectedEmployeeId === empId;

                                                                    return (
                                                                        <div
                                                                            key={empId}
                                                                            onClick={() => handleAreaAssignmentChange(areaId, isSelected ? null : empId)}
                                                                            className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${isSelected
                                                                                ? 'border-orange-500 bg-orange-50 shadow-md'
                                                                                : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                                                                                }`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                                    <User className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                                                                                    <h5 className={`font-semibold text-xs truncate flex-1 ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>
                                                                                        {empName}
                                                                                    </h5>
                                                                                    {isSelected && (
                                                                                        <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                                                                    )}
                                                                                </div>
                                                                                {empPhone && (
                                                                                    <p className="text-xs text-slate-500 ml-5 truncate">
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
                                    );
                                })}
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
                            disabled={submitting || loadingAreas || loadingEmployees || (areasToReassign.length > 0
                                ? areas.filter(area => {
                                    const areaId = area.areaId || area.id;
                                    return areasToReassign.includes(areaId);
                                }).some(area => !areaAssignments[area.areaId || area.id])
                                : areas.some(area => !areaAssignments[area.areaId || area.id])
                            )}
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
                                    {isReassign ? 'Xác nhận phân công lại' : 'Xác nhận phân công'}
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

export default AssignAreaModal;

