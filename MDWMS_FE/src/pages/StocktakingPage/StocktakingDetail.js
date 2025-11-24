import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, FileText, Calendar, User, Hash, Clock, Users, Play, Edit, MapPin, Thermometer, Droplets, Sun, Package } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { getStocktakingDetail, inProgressStocktaking } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import StatusDisplay, { STOCKTAKING_STATUS } from '../../components/StocktakingComponents/StatusDisplay';
import AssignAreaModal from '../../components/StocktakingComponents/AssignAreaModal';
import AssignSingleAreaModal from '../../components/StocktakingComponents/AssignSingleAreaModal';
import AssignSingleAreaModalForCreate from '../../components/StocktakingComponents/AssignSingleAreaModalForCreate';
import AssignSingleAreaModalForReassign from '../../components/StocktakingComponents/AssignSingleAreaModalForReassign';
import StartStocktakingModal from '../../components/StocktakingComponents/StartStocktakingModal';
import SelectAreaModal from '../../components/StocktakingComponents/SelectAreaModal';
import { PERMISSIONS } from '../../utils/permissions';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { usePermissions } from '../../hooks/usePermissions';
import AreaStatusDisplay, { STOCK_AREA_STATUS } from '../StocktakingArea/AreaStatusDisplay';
import dayjs from 'dayjs';

const StocktakingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [stocktaking, setStocktaking] = useState(null);
    const [error, setError] = useState(null);

    // Assignment modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showSingleAreaModal, setShowSingleAreaModal] = useState(false);
    const [showSingleAreaReassignModal, setShowSingleAreaReassignModal] = useState(false);
    const [isReassign, setIsReassign] = useState(false);
    const [areasToReassign, setAreasToReassign] = useState([]); // Danh sách khu vực cần phân công lại (nếu chỉ có 1 khu vực)
    const [singleAreaIdToReassign, setSingleAreaIdToReassign] = useState(null); // areaId của khu vực duy nhất cần phân công lại

    // Start stocktaking modal state
    const [showStartStocktakingModal, setShowStartStocktakingModal] = useState(false);
    const [startStocktakingLoading, setStartStocktakingLoading] = useState(false);
    const [showSelectAreaModal, setShowSelectAreaModal] = useState(false);

    useEffect(() => {
        const fetchStocktakingDetail = async () => {
            if (!id) {
                setError('Không tìm thấy mã phiếu kiểm kê');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await getStocktakingDetail(id);
                // Handle different response structures
                const data = response?.data || response;

                if (data) {
                    setStocktaking(data);
                } else {
                    setError('Không tìm thấy thông tin phiếu kiểm kê');
                }
            } catch (error) {
                console.error('Error fetching stocktaking detail:', error);
                const errorMessage = extractErrorMessage(error);
                setError(errorMessage || 'Không thể tải thông tin phiếu kiểm kê');
                if (window.showToast) {
                    window.showToast(errorMessage || 'Không thể tải thông tin phiếu kiểm kê', 'error');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStocktakingDetail();
    }, [id]);

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '-';
        try {
            const date = dayjs(dateTimeString);
            return date.format('DD/MM/YYYY HH:mm');
        } catch {
            return dateTimeString;
        }
    };

    const handleStartAssignment = () => {
        // Check if it's reassignment (status is Assigned) or initial assignment (status is Draft)
        const isReassignMode = stocktaking?.status === STOCKTAKING_STATUS.Assigned;
        setIsReassign(isReassignMode);

        // Nếu là Draft (chưa phân công)
        if (!isReassignMode && stocktaking?.stocktakingAreas) {
            const totalAreas = stocktaking.stocktakingAreas.length;

            // Nếu chỉ có 1 khu vực, mở modal phân công 1 khu vực
            if (totalAreas === 1) {
                setShowSingleAreaModal(true);
                return;
            }
            // Nếu có 2+ khu vực, mở modal phân công nhiều khu vực
            if (totalAreas >= 2) {
                setShowAssignModal(true);
                return;
            }
        }

        // Kiểm tra trạng thái các khu vực khi reassign (status là Assigned)
        if (isReassignMode && stocktaking?.stocktakingAreas) {
            // Đếm số khu vực có trạng thái "Đã Phân Công" (status = 1)
            const assignedAreas = stocktaking.stocktakingAreas.filter(
                area => area.status === STOCK_AREA_STATUS.Assigned
            );
            const totalAreas = stocktaking.stocktakingAreas.length;

            // Nếu chỉ có 1 khu vực đã phân công, mở modal phân công lại 1 khu vực
            if (assignedAreas.length === 1) {
                const singleAreaId = assignedAreas[0].areaId;
                setSingleAreaIdToReassign(singleAreaId);
                setShowSingleAreaReassignModal(true);
                return;
            }

            // Nếu có 2+ khu vực đã phân công, mở modal phân công lại nhiều khu vực
            if (assignedAreas.length >= 2) {
                // Nếu chỉ có 1 khu vực "Đã Phân Công" trong tổng số nhiều khu vực, chỉ hiển thị khu vực đó
                if (assignedAreas.length === 1 && totalAreas > 1) {
                    const areasToReassignList = assignedAreas.map(area => area.areaId);
                    setAreasToReassign(areasToReassignList);
                } else {
                    // Nếu tất cả khu vực đều "Đã Phân Công", hiển thị tất cả
                    setAreasToReassign([]);
                }
                setShowAssignModal(true);
                return;
            }
        }
    };

    const handleAssignmentSuccess = () => {
        // Refresh stocktaking detail after successful assignment
        const fetchStocktakingDetail = async () => {
            if (!id) return;
            try {
                const response = await getStocktakingDetail(id);
                const data = response?.data || response;
                if (data) {
                    setStocktaking(data);
                }
            } catch (error) {
                console.error('Error refreshing stocktaking detail:', error);
            }
        };
        fetchStocktakingDetail();
    };

    const handleStartStocktaking = () => {
        // Kiểm tra số lượng khu vực
        const totalAreas = stocktaking?.stocktakingAreas?.length || 0;
        
        // Nếu có 2+ khu vực, hiển thị modal chọn khu vực
        if (totalAreas >= 2) {
            setShowSelectAreaModal(true);
        } else {
            // Nếu chỉ có 1 khu vực, hiển thị modal bắt đầu kiểm kê để xác nhận
            setShowStartStocktakingModal(true);
        }
    };

    const handleSelectAreaConfirm = async (areaId) => {
        if (!stocktaking?.stocktakingSheetId) {
            window.showToast?.('Không tìm thấy ID phiếu kiểm kê', 'error');
            return;
        }

        // Đảm bảo areaId là string và đúng format
        const stocktakingAreaId = String(areaId);
        console.log('handleSelectAreaConfirm - Received areaId:', {
            original: areaId,
            converted: stocktakingAreaId,
            type: typeof areaId
        });

        try {
            setStartStocktakingLoading(true);
            // Gọi API InProgress để update trạng thái
            await inProgressStocktaking({
                stocktakingSheetId: stocktaking.stocktakingSheetId
            });

            // Hiển thị thông báo thành công
            window.showToast?.('Bắt đầu quá trình kiểm kê thành công!', 'success');

            // Đóng modal chọn khu vực
            setShowSelectAreaModal(false);

            // Navigate sang trang StocktakingArea với stocktakingSheetId và stocktakingAreaId
            console.log('Navigating with stocktakingAreaId:', stocktakingAreaId);
            navigate(`/stocktaking-area/${stocktaking.stocktakingSheetId}?stocktakingAreaId=${stocktakingAreaId}`);
        } catch (error) {
            console.error('Error starting stocktaking process:', error);
            const errorMessage = extractErrorMessage(error) || 'Có lỗi xảy ra khi bắt đầu quá trình kiểm kê';
            window.showToast?.(errorMessage, 'error');
        } finally {
            setStartStocktakingLoading(false);
        }
    };

    const handleStartStocktakingConfirm = async () => {
        // Modal sẽ tự xử lý API call và navigation
        // Chỉ cần refresh data nếu cần
        const fetchStocktakingDetail = async () => {
            if (!id) return;
            try {
                const response = await getStocktakingDetail(id);
                const data = response?.data || response;
                if (data) {
                    setStocktaking(data);
                }
            } catch (error) {
                console.error('Error refreshing stocktaking detail:', error);
            }
        };
        // Không cần fetch vì sẽ navigate đi rồi
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Loading size="large" text="Đang tải thông tin phiếu kiểm kê..." />
            </div>
        );
    }

    if (error || !stocktaking) {
        return (
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center py-12">
                            <div className="text-red-500 text-lg font-semibold mb-2">
                                {error || 'Không tìm thấy thông tin phiếu kiểm kê'}
                            </div>
                            <Button
                                onClick={() => navigate('/stocktakings')}
                                className="mt-4 bg-orange-500 hover:bg-orange-600"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Quay lại danh sách
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6 p-6">
                {/* Header */}
                <Card className="shadow-sm border border-slate-200 overflow-visible bg-white">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/stocktakings')}
                                    className="flex items-center justify-center hover:opacity-80 transition-opacity p-0"
                                >
                                    <ComponentIcon name="arrowBackCircleOutline" size={28} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-600 m-0">
                                        Chi Tiết Phiếu Kiểm Kê
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Main Content */}
                <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
                    <div className="p-6 space-y-6">
                        {/* Information Card */}
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardHeader className="bg-gray-50 border-b border-gray-200">
                                <CardTitle className="text-xl font-semibold text-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-orange-500" />
                                        Thông Tin Phiếu Kiểm Kê
                                    </div>
                                    {stocktaking.status === STOCKTAKING_STATUS.Draft && (
                                        <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                                            <button
                                                onClick={() => navigate(`/stocktakings/update/${stocktaking.stocktakingSheetId}`)}
                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Cập nhật"
                                            >
                                                <Edit className="h-7 w-7 text-blue-500 hover:text-blue-600" />
                                            </button>
                                        </PermissionWrapper>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {/* General Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-orange-500" />
                                            Thông tin chung
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Mã phiếu kiểm kê */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Hash className="h-3 w-3" />
                                                    Mã phiếu kiểm kê
                                                </label>
                                                <div className="text-sm font-semibold text-slate-700">
                                                    {stocktaking.stocktakingSheetId || '-'}
                                                </div>
                                            </div>

                                            {/* Trạng thái */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Trạng thái
                                                </label>
                                                <div>
                                                    <StatusDisplay status={stocktaking.status} />
                                                </div>
                                            </div>

                                            {/* Thời gian bắt đầu */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Thời gian bắt đầu
                                                </label>
                                                <div className="text-sm text-slate-700">
                                                    {formatDateTime(stocktaking.startTime)}
                                                </div>
                                            </div>

                                            {/* Ngày tạo */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Ngày tạo
                                                </label>
                                                <div className="text-sm text-slate-700">
                                                    {formatDateTime(stocktaking.createdAt)}
                                                </div>
                                            </div>

                                            {/* Người tạo */}
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    Người tạo
                                                </label>
                                                <div className="text-sm text-slate-700">
                                                    {stocktaking.createByName || stocktaking.createdBy || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lý do kiểm kê */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-orange-500" />
                                            Lý do kiểm kê
                                        </h3>
                                        <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                            {stocktaking.note || (
                                                <span className="text-slate-400 italic">Chưa có lý do kiểm kê</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stocktaking Areas List - Show when areas exist */}
                        {stocktaking.stocktakingAreas && stocktaking.stocktakingAreas.length > 0 && (
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardHeader className="bg-gray-50 border-b border-gray-200">
                                    <CardTitle className="text-xl font-semibold text-slate-700 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-orange-500" />
                                        Danh Sách Khu Vực Được Phân Công
                                        <span className="text-sm font-normal text-slate-500 ml-2">
                                            ({stocktaking.stocktakingAreas.length} khu vực)
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {stocktaking.stocktakingAreas.map((area, index) => (
                                            <Card
                                                key={area.stocktakingAreaId || area.areaId}
                                                className="border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 bg-white"
                                            >
                                                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 pb-4 px-5 pt-5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-base shadow-md">
                                                                {index + 1}
                                                            </div>
                                                            <CardTitle className="text-xl font-bold text-slate-700 m-0">
                                                                {area.areaName || '-'}
                                                            </CardTitle>
                                                        </div>
                                                        {area.status && (
                                                            <AreaStatusDisplay status={area.status} />
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-5 space-y-4">
                                                    {/* Người được phân công */}
                                                    <div className="flex items-start gap-3 pt-5">
                                                        <div className="p-2 rounded-lg bg-slate-100">
                                                            <User className="h-5 w-5 text-slate-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                                                                Người được phân công
                                                            </div>
                                                            <div className="text-base font-bold text-slate-700">
                                                                {!area.status || (!area.assignName && !area.assignTo)
                                                                    ? 'Chưa phân công'
                                                                    : (area.assignName || `ID: ${area.assignTo}`)
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Vị trí đã xếp pallet và chưa xếp pallet */}
                                                    {(area.availableLocationCount !== undefined || area.unAvailableLocationCount !== undefined) && (
                                                        <div className="border-t border-slate-200 pt-3">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {/* Vị trí đã xếp pallet */}
                                                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                                                                    <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs text-blue-600 mb-0.5">
                                                                            Vị trí đã xếp pallet
                                                                        </div>
                                                                        <div className="text-base font-bold text-blue-700">
                                                                            {area.unAvailableLocationCount ?? 0}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Vị trí chưa xếp pallet */}
                                                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                                                                    <Package className="h-4 w-4 text-red-600 flex-shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs text-red-600 mb-0.5">
                                                                            Vị trí chưa xếp pallet
                                                                        </div>
                                                                        <div className="text-base font-bold text-red-700">
                                                                            {area.availableLocationCount ?? 0}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Điều kiện bảo quản */}
                                                    {(area.temperatureMin !== null || area.humidityMin !== null || area.lightLevel) && (
                                                        <div className="border-t border-slate-200 pt-4">
                                                            <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                                                                Điều kiện bảo quản
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2.5">
                                                                {area.temperatureMin !== null && area.temperatureMax !== null && (
                                                                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                                                                        <div className="p-2 rounded-md bg-blue-100">
                                                                            <Thermometer className="h-4 w-4 text-blue-600" />
                                                                        </div>
                                                                        <span className="text-sm font-semibold text-slate-700">
                                                                            Nhiệt độ: {area.temperatureMin}°C - {area.temperatureMax}°C
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {area.humidityMin !== null && area.humidityMax !== null && (
                                                                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-cyan-50 border border-cyan-100">
                                                                        <div className="p-2 rounded-md bg-cyan-100">
                                                                            <Droplets className="h-4 w-4 text-cyan-600" />
                                                                        </div>
                                                                        <span className="text-sm font-semibold text-slate-700">
                                                                            Độ ẩm: {area.humidityMin}% - {area.humidityMax}%
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {area.lightLevel && (
                                                                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-yellow-50 border border-yellow-100">
                                                                        <div className="p-2 rounded-md bg-yellow-100">
                                                                            <Sun className="h-4 w-4 text-yellow-600" />
                                                                        </div>
                                                                        <span className="text-sm font-semibold text-slate-700">
                                                                            Mức độ ánh sáng: {area.lightLevel}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Assignment Button - Only visible for Warehouse Manager */}
                        {/* Show "Bắt đầu phân công" button when status is Draft (1) */}
                        {stocktaking.status === STOCKTAKING_STATUS.Draft && (
                            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                                <div className="flex justify-center">
                                    <Button
                                        onClick={handleStartAssignment}
                                        className="h-[42px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Users className="mr-2 h-5 w-5" />
                                        Bắt đầu phân công theo khu vực
                                    </Button>
                                </div>
                            </PermissionWrapper>
                        )}

                        {/* Show "Phân công lại" button when status is Assigned (2) - for Warehouse Manager */}
                        {stocktaking.status === STOCKTAKING_STATUS.Assigned && (
                            <>
                                <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_REASSIGN_AREA}>
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={handleStartAssignment}
                                            className="h-[42px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                        >
                                            <Users className="mr-2 h-5 w-5" />
                                            Phân công lại theo khu vực
                                        </Button>
                                    </div>
                                </PermissionWrapper>

                                {/* Show "Bắt đầu kiểm kê" button for Warehouse Staff */}
                                {hasPermission(PERMISSIONS.STOCKTAKING_IN_PROGRESS) && (
                                    <div className="flex justify-center mt-4">
                                        <Button
                                            onClick={handleStartStocktaking}
                                            className="h-[42px] px-8 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                        >
                                            <Play className="mr-2 h-5 w-5" />
                                            Bắt đầu kiểm kê
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* No button shown when status is InProgress (4) or other statuses */}
                    </div>
                </Card>

                {/* Assign Area Modal - Only accessible for Warehouse Manager */}
                {(stocktaking?.status === STOCKTAKING_STATUS.Draft || stocktaking?.status === STOCKTAKING_STATUS.Assigned) && (
                    <>
                        {stocktaking?.status === STOCKTAKING_STATUS.Draft && (
                            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                                {/* Nếu có 1 khu vực, hiển thị modal phân công 1 khu vực */}
                                {stocktaking?.stocktakingAreas?.length === 1 ? (
                                    <AssignSingleAreaModalForCreate
                                        isOpen={showSingleAreaModal}
                                        onClose={() => setShowSingleAreaModal(false)}
                                        onSuccess={handleAssignmentSuccess}
                                        stocktakingSheetId={stocktaking?.stocktakingSheetId || id}
                                        areaId={stocktaking?.stocktakingAreas?.[0]?.areaId || null}
                                    />
                                ) : (
                                    /* Nếu có 2+ khu vực, hiển thị modal phân công nhiều khu vực */
                                    <AssignAreaModal
                                        isOpen={showAssignModal}
                                        onClose={() => setShowAssignModal(false)}
                                        onSuccess={handleAssignmentSuccess}
                                        stocktakingSheetId={stocktaking?.stocktakingSheetId || id}
                                        isReassign={isReassign}
                                        stocktaking={stocktaking}
                                    />
                                )}
                            </PermissionWrapper>
                        )}
                        {stocktaking?.status === STOCKTAKING_STATUS.Assigned && (
                            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_REASSIGN_AREA}>
                                {/* Nếu có 1 khu vực đã phân công, hiển thị modal phân công lại 1 khu vực */}
                                {singleAreaIdToReassign ? (
                                    <AssignSingleAreaModalForReassign
                                        isOpen={showSingleAreaReassignModal}
                                        onClose={() => {
                                            setShowSingleAreaReassignModal(false);
                                            setSingleAreaIdToReassign(null);
                                        }}
                                        onSuccess={handleAssignmentSuccess}
                                        stocktakingSheetId={stocktaking?.stocktakingSheetId || id}
                                        stocktaking={stocktaking}
                                        areaId={singleAreaIdToReassign}
                                    />
                                ) : (
                                    /* Nếu có 2+ khu vực đã phân công, hiển thị modal phân công lại nhiều khu vực */
                                    <AssignAreaModal
                                        isOpen={showAssignModal}
                                        onClose={() => setShowAssignModal(false)}
                                        onSuccess={handleAssignmentSuccess}
                                        stocktakingSheetId={stocktaking?.stocktakingSheetId || id}
                                        isReassign={isReassign}
                                        stocktaking={stocktaking}
                                        areasToReassign={areasToReassign}
                                    />
                                )}
                            </PermissionWrapper>
                        )}
                    </>
                )}

                {/* Start Stocktaking Modal - for Warehouse Staff */}
                {stocktaking?.status === STOCKTAKING_STATUS.Assigned && hasPermission(PERMISSIONS.STOCKTAKING_IN_PROGRESS) && (
                    <>
                        {/* Modal chọn khu vực khi có 2+ khu vực - bắt đầu kiểm kê ngay sau khi chọn */}
                        <SelectAreaModal
                            isOpen={showSelectAreaModal}
                            onClose={() => setShowSelectAreaModal(false)}
                            onConfirm={handleSelectAreaConfirm}
                            stocktakingSheetId={stocktaking?.stocktakingSheetId || id}
                            loading={startStocktakingLoading}
                        />
                        {/* Modal bắt đầu kiểm kê - chỉ hiển thị khi có 1 khu vực */}
                        <StartStocktakingModal
                            isOpen={showStartStocktakingModal}
                            onClose={() => setShowStartStocktakingModal(false)}
                            onConfirm={handleStartStocktakingConfirm}
                            stocktaking={stocktaking}
                            loading={startStocktakingLoading}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default StocktakingDetail;

