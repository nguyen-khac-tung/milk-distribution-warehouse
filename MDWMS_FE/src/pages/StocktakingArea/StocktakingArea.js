import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, ChevronUp, ChevronDown, RefreshCw, MapPin, Clock, Calendar, User, Thermometer, Droplets, Sun, Check, RotateCcw } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { getStocktakingAreaDetailBySheetId, getStocktakingDetail, confirmStocktakingLocationCounted, submitStocktakingArea, cancelStocktakingLocationRecord } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import StatusDisplay from '../../components/StocktakingComponents/StatusDisplay';
import LocationStatusDisplay, { STOCK_LOCATION_STATUS } from './LocationStatusDisplay';
import ScanLocationStocktakingModal from '../../components/StocktakingComponents/ScanLocationStocktakingModal';
import ScanPalletStocktakingModal from '../../components/StocktakingComponents/ScanPalletStocktakingModal';
import ConfirmCountedModal from '../../components/StocktakingComponents/ConfirmCountedModal';
import dayjs from 'dayjs';

const StocktakingArea = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [stocktakingAreas, setStocktakingAreas] = useState([]);
    const [stocktakingDetail, setStocktakingDetail] = useState(null);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        detail: true,
        areas: {},
        check: {}
    });
    const [showScanModal, setShowScanModal] = useState(false);
    const [showPalletModal, setShowPalletModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [validatedLocationData, setValidatedLocationData] = useState(null);
    const [confirmingLocationId, setConfirmingLocationId] = useState(null);
    const [submittingArea, setSubmittingArea] = useState(false);
    const [cancelingLocationId, setCancelingLocationId] = useState(null);
    const [selectedLocations, setSelectedLocations] = useState(new Set());
    const [recheckingLocations, setRecheckingLocations] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [locationToConfirm, setLocationToConfirm] = useState(null);
    const isFetchingRef = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError('Không tìm thấy mã phiếu kiểm kê');
                setLoading(false);
                return;
            }

            // Tránh gọi API nhiều lần nếu đang fetch
            if (isFetchingRef.current) {
                return;
            }

            try {
                isFetchingRef.current = true;
                setLoading(true);

                // Lấy stocktakingAreaId từ query parameter nếu có
                const stocktakingAreaId = searchParams.get('stocktakingAreaId');

                // Fetch cả hai API song song
                const [areaResponse, detailResponse] = await Promise.all([
                    getStocktakingAreaDetailBySheetId(id, stocktakingAreaId),
                    getStocktakingDetail(id)
                ]);

                // Handle area data - API trả về mảng các areas
                const areaData = areaResponse?.data || areaResponse;
                if (areaData) {
                    // Kiểm tra xem là mảng hay object đơn
                    const areasArray = Array.isArray(areaData) ? areaData : [areaData];
                    setStocktakingAreas(areasArray);
                } else {
                    setStocktakingAreas([]);
                }

                // Handle detail data
                const detailData = detailResponse?.data || detailResponse;
                if (detailData) {
                    setStocktakingDetail(detailData);
                }

                if (!areaData && !detailData) {
                    setError('Không tìm thấy thông tin kiểm kê');
                }
            } catch (error) {
                console.error('Error fetching stocktaking data:', error);
                const errorMessage = extractErrorMessage(error);
                setError(errorMessage || 'Không thể tải thông tin kiểm kê');
                if (window.showToast) {
                    window.showToast(errorMessage || 'Không thể tải thông tin kiểm kê', 'error');
                }
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        };

        fetchData();
    }, [id, searchParams]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '-';
        try {
            const date = dayjs(dateTimeString);
            return date.format('DD/MM/YYYY, HH:mm:ss');
        } catch {
            return dateTimeString;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = dayjs(dateString);
            return date.format('DD/MM/YYYY');
        } catch {
            return dateString;
        }
    };

    const handleRefresh = async () => {
        if (!id || isFetchingRef.current) return;
        try {
            isFetchingRef.current = true;
            setLoading(true);
            
            // Lấy stocktakingAreaId từ query parameter nếu có
            const stocktakingAreaId = searchParams.get('stocktakingAreaId');
            
            const [areaResponse, detailResponse] = await Promise.all([
                getStocktakingAreaDetailBySheetId(id, stocktakingAreaId),
                getStocktakingDetail(id)
            ]);

            const areaData = areaResponse?.data || areaResponse;
            const detailData = detailResponse?.data || detailResponse;

            if (areaData) {
                const areasArray = Array.isArray(areaData) ? areaData : [areaData];
                setStocktakingAreas(areasArray);
            } else {
                setStocktakingAreas([]);
            }
            if (detailData) setStocktakingDetail(detailData);
        } catch (error) {
            console.error('Error refreshing data:', error);
            if (window.showToast) {
                window.showToast('Không thể làm mới dữ liệu', 'error');
            }
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    };

    const handleProceedLocation = (location) => {
        setSelectedLocation(location);
        setShowScanModal(true);
    };

    const handleRecheckLocation = async (location) => {
        if (!location?.stocktakingLocationId || !location?.locationId || cancelingLocationId === location.stocktakingLocationId) {
            return;
        }

        setCancelingLocationId(location.stocktakingLocationId);
        try {
            await cancelStocktakingLocationRecord([{
                stocktakingLocationId: location.stocktakingLocationId,
                locationId: location.locationId
            }]);

            if (window.showToast) {
                window.showToast('Hủy bản ghi kiểm kê thành công!', 'success');
            }

            // Refresh data sau khi cancel
            await handleRefresh();
        } catch (error) {
            console.error('Error canceling stocktaking location record:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi hủy bản ghi kiểm kê', 'error');
            }
        } finally {
            setCancelingLocationId(null);
        }
    };

    const handleLocationSelect = (locationId, event) => {
        event.stopPropagation(); // Ngăn chặn toggle expand khi click checkbox
        setSelectedLocations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(locationId)) {
                newSet.delete(locationId);
            } else {
                newSet.add(locationId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (areaId) => {
        if (!areaId) {
            // Nếu không có areaId, chọn tất cả locations từ tất cả areas
            const allLocationIds = stocktakingAreas.flatMap(area =>
                (area.stocktakingLocations || [])
                    .filter(loc => loc.status === STOCK_LOCATION_STATUS.Counted)
                    .map(loc => loc.stocktakingLocationId || loc.locationId)
                    .filter(id => id)
            );
            setSelectedLocations(new Set(allLocationIds));
            return;
        }

        const area = stocktakingAreas.find(a => a.stocktakingAreaId === areaId);
        if (!area || !area.stocktakingLocations || area.stocktakingLocations.length === 0) return;
        const allLocationIds = area.stocktakingLocations
            .filter(loc => loc.status === STOCK_LOCATION_STATUS.Counted)
            .map(loc => loc.stocktakingLocationId || loc.locationId)
            .filter(id => id);
        setSelectedLocations(prev => {
            const newSet = new Set(prev);
            allLocationIds.forEach(id => newSet.add(id));
            return newSet;
        });
    };

    const handleDeselectAll = () => {
        setSelectedLocations(new Set());
    };

    const handleRecheckLocations = async () => {
        if (selectedLocations.size === 0 || recheckingLocations) {
            return;
        }

        setRecheckingLocations(true);
        try {
            // Tìm tất cả locations từ tất cả areas
            const allLocations = stocktakingAreas.flatMap(area => area.stocktakingLocations || []);
            const locationsToCancel = allLocations.filter(loc => {
                const locationId = loc.stocktakingLocationId || loc.locationId;
                return selectedLocations.has(locationId) && loc.status === STOCK_LOCATION_STATUS.Counted;
            });

            if (locationsToCancel.length === 0) {
                if (window.showToast) {
                    window.showToast('Không có vị trí nào được chọn để kiểm kê lại', 'warning');
                }
                return;
            }

            // Gọi API cancel cho tất cả các location đã chọn
            const records = locationsToCancel.map(loc => ({
                stocktakingLocationId: loc.stocktakingLocationId,
                locationId: loc.locationId
            }));

            await cancelStocktakingLocationRecord(records);

            if (window.showToast) {
                window.showToast(`Hủy bản ghi kiểm kê thành công cho ${locationsToCancel.length} vị trí!`, 'success');
            }

            // Refresh data sau khi cancel
            await handleRefresh();

            // Clear selection sau khi thành công
            setSelectedLocations(new Set());
        } catch (error) {
            console.error('Error canceling stocktaking location records:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi hủy bản ghi kiểm kê', 'error');
            }
        } finally {
            setRecheckingLocations(false);
        }
    };

    const handleLocationValidated = (locationData) => {
        // Lưu dữ liệu location đã validate
        setValidatedLocationData(locationData);
        // Đóng modal location và mở modal pallet
        setShowScanModal(false);
        setShowPalletModal(true);
    };

    const handleScanModalClose = () => {
        setShowScanModal(false);
        setSelectedLocation(null);
    };

    const handlePalletModalClose = () => {
        setShowPalletModal(false);
        setValidatedLocationData(null);
        // Refresh data sau khi đóng modal pallet
        handleRefresh();
    };

    const handleConfirmCountedClick = (stocktakingLocationId) => {
        setLocationToConfirm(stocktakingLocationId);
        setShowConfirmModal(true);
    };

    const handleConfirmCounted = async () => {
        if (!locationToConfirm || confirmingLocationId === locationToConfirm) {
            return;
        }

        setConfirmingLocationId(locationToConfirm);
        setShowConfirmModal(false);
        try {
            await confirmStocktakingLocationCounted(locationToConfirm);

            if (window.showToast) {
                window.showToast('Xác nhận vị trí kiểm kê thành công!', 'success');
            }

            // Refresh data sau khi confirm
            await handleRefresh();
        } catch (error) {
            console.error('Error confirming counted:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi xác nhận đã đếm', 'error');
            }
        } finally {
            setConfirmingLocationId(null);
            setLocationToConfirm(null);
        }
    };

    const handleSubmitArea = async (areaId) => {
        if (!areaId || submittingArea) {
            return;
        }

        const area = stocktakingAreas.find(a => a.stocktakingAreaId === areaId);
        if (!area) {
            if (window.showToast) {
                window.showToast('Không tìm thấy khu vực kiểm kê', 'error');
            }
            return;
        }

        // Kiểm tra xem tất cả locations đã ở trạng thái "Đã kiểm" hoặc "Chờ duyệt" chưa
        const allLocations = area.stocktakingLocations || [];
        const allCountedOrPendingApproval = allLocations.length > 0 && allLocations.every(
            location => location.status === STOCK_LOCATION_STATUS.Counted ||
                location.status === STOCK_LOCATION_STATUS.PendingApproval
        );

        if (!allCountedOrPendingApproval) {
            if (window.showToast) {
                window.showToast('Vui lòng kiểm kê tất cả các vị trí trước khi nộp!', 'warning');
            }
            return;
        }

        setSubmittingArea(true);
        try {
            await submitStocktakingArea(areaId);

            if (window.showToast) {
                window.showToast('Nộp kiểm kê thành công!', 'success');
            }

            // Refresh data sau khi submit
            await handleRefresh();
        } catch (error) {
            console.error('Error submitting stocktaking area:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi nộp kiểm kê', 'error');
            }
        } finally {
            setSubmittingArea(false);
        }
    };

    const toggleArea = (areaId) => {
        setExpandedSections(prev => ({
            ...prev,
            areas: {
                ...prev.areas,
                [areaId]: !prev.areas[areaId]
            }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Loading size="large" text="Đang tải thông tin khu vực kiểm kê..." />
            </div>
        );
    }

    if (error || stocktakingAreas.length === 0) {
        return (
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center py-12">
                            <div className="text-red-500 text-lg font-semibold mb-2">
                                {error || 'Không tìm thấy thông tin khu vực kiểm kê'}
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
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
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
                                    Chi Tiết Kiểm Kê Kho
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chi Tiết Kiểm Kê Kho Section */}
                <Card className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-visible">
                    <div
                        className="p-6 border-b border-gray-200 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSection('detail')}
                    >
                        <CardTitle className="text-lg font-semibold text-slate-700 m-0">
                            Chi Tiết Kiểm Kê Kho
                        </CardTitle>
                        {expandedSections.detail ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </div>

                    {expandedSections.detail && (
                        <CardContent className="p-4 space-y-4">
                            {/* Thông tin kiểm kê */}
                            <div>
                                <h3 className="text-xs font-medium text-gray-500 mb-3">Thông tin kiểm kê</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Số khu vực */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            Số khu vực
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.length} khu vực
                                        </div>
                                    </div>

                                    {/* Trạng Thái */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <Clock className="h-4 w-4 text-orange-500" />
                                            Trạng Thái
                                        </div>
                                        <div>
                                            {stocktakingDetail?.status ? (
                                                <StatusDisplay status={stocktakingDetail.status} />
                                            ) : (
                                                <span className="text-base font-semibold text-gray-900">-</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ngày Kiểm Kê */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-green-500" />
                                            Ngày Kiểm Kê
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingDetail?.startTime ? formatDate(stocktakingDetail.startTime) : '-'}
                                        </div>
                                    </div>

                                    {/* Ngày Tạo */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-purple-500" />
                                            Ngày Tạo
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingDetail?.createdAt ? formatDateTime(stocktakingDetail.createdAt) : '-'}
                                        </div>
                                    </div>

                                    {/* Số vị trí có sẵn */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-emerald-500" />
                                            Số vị trí có sẵn
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.reduce((sum, area) => sum + (area.areaDetail?.availableLocationCount || 0), 0)}
                                        </div>
                                    </div>

                                    {/* Số vị trí không có sẵn */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-red-500" />
                                            Số vị trí không có sẵn
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.reduce((sum, area) => sum + (area.areaDetail?.unAvailableLocationCount || 0), 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin người */}
                            <div>
                                <h3 className="text-xs font-medium text-gray-500 mb-3">Thông tin người</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <User className="h-4 w-4 text-teal-500" />
                                            Người tạo
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingDetail?.createByName || stocktakingDetail?.createdBy || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <User className="h-4 w-4 text-indigo-500" />
                                            Người tiếp nhận
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.map(area => area.assignToName).filter(Boolean).join(', ') || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Điều kiện bảo quản */}
                            <div>
                                <h3 className="text-xs font-medium text-gray-500 mb-3">Điều kiện bảo quản</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Nhiệt độ */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <Thermometer className="h-4 w-4 text-red-600" />
                                            Nhiệt độ
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.map(area => {
                                                const temp = area.areaDetail;
                                                if (temp?.temperatureMin !== undefined && temp?.temperatureMax !== undefined) {
                                                    return `${temp.temperatureMin}°C - ${temp.temperatureMax}°C`;
                                                }
                                                return null;
                                            }).filter(Boolean).join(' / ') || '-'}
                                        </div>
                                    </div>

                                    {/* Độ ẩm */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <Droplets className="h-4 w-4 text-blue-600" />
                                            Độ ẩm
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.map(area => {
                                                const temp = area.areaDetail;
                                                if (temp?.humidityMin !== undefined && temp?.humidityMax !== undefined) {
                                                    return `${temp.humidityMin}% - ${temp.humidityMax}%`;
                                                }
                                                return null;
                                            }).filter(Boolean).join(' / ') || '-'}
                                        </div>
                                    </div>

                                    {/* Mức ánh sáng */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <Sun className="h-4 w-4 text-yellow-500" />
                                            Mức ánh sáng
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.map(area => area.areaDetail?.lightLevel).filter(Boolean).join(' / ') || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Kiểm Tra Section */}
                <Card className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <RefreshCw
                                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-orange-500 transition-colors"
                                onClick={handleRefresh}
                            />
                            <CardTitle className="text-lg font-semibold text-slate-700 m-0">
                                Kiểm Tra
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                className="flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] transition-colors bg-white text-slate-700"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span className="text-sm font-medium">Làm mới</span>
                            </button>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        <div className="space-y-6 p-6">
                            {stocktakingAreas.map((area, areaIndex) => {
                                const areaId = area.stocktakingAreaId;
                                const isAreaExpanded = expandedSections.areas[areaId] !== false; // Default expanded

                                // Phân loại locations thành 2 nhóm: Chưa kiểm kê và Đã kiểm kê
                                const unCheckedLocations = area.stocktakingLocations?.filter(
                                    location => location.status === STOCK_LOCATION_STATUS.Pending
                                ) || [];

                                const checkedLocations = area.stocktakingLocations?.filter(
                                    location => location.status !== STOCK_LOCATION_STATUS.Pending
                                ) || [];

                                // Kiểm tra xem có location nào cần hiển thị cột Xác Nhận không (chỉ trong Chưa kiểm kê)
                                const hasConfirmableLocation = unCheckedLocations.some(
                                    location => location.isAvailable === true && location.status === STOCK_LOCATION_STATUS.Pending
                                );

                                // Render function cho một row trong table
                                const renderLocationRow = (location, index, isUnchecked = false) => {
                                    const locationId = location.stocktakingLocationId || location.locationId || index;
                                    const isSelected = selectedLocations.has(locationId);
                                    const canSelect = location.status === STOCK_LOCATION_STATUS.Counted;
                                    const colSpanForRejectReason = isUnchecked ? (hasConfirmableLocation ? 5 : 4) : 5;

                                    return (
                                        <>
                                            <TableRow
                                                key={locationId}
                                                className={`hover:bg-slate-50 border-b border-slate-200 ${isSelected ? 'bg-orange-50' : ''}`}
                                            >
                                                <TableCell className="px-6 py-4 text-center text-slate-700 font-medium">
                                                    {index + 1}
                                                </TableCell>
                                                {!isUnchecked && (
                                                    <TableCell className="px-6 py-4">
                                                        {canSelect ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => handleLocationSelect(locationId, e)}
                                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell className="px-6 py-4 text-slate-700">
                                                    {location.locationCode || '-'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <LocationStatusDisplay status={location.status} />
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    {isUnchecked ? (
                                                        <Button
                                                            onClick={() => handleProceedLocation(location)}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 h-8"
                                                        >
                                                            Tiến Hành
                                                        </Button>
                                                    ) : location.status === STOCK_LOCATION_STATUS.Counted ? (
                                                        <Button
                                                            onClick={() => handleRecheckLocation(location)}
                                                            disabled={cancelingLocationId === location.stocktakingLocationId}
                                                            className="bg-orange-300 hover:bg-orange-400 text-white text-sm px-4 py-2 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {cancelingLocationId === location.stocktakingLocationId ? (
                                                                <div className="flex items-center gap-2">
                                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                                    <span>Đang hủy...</span>
                                                                </div>
                                                            ) : (
                                                                'Kiểm kê lại'
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                {isUnchecked && hasConfirmableLocation && (
                                                    <TableCell className="px-6 py-4 text-center">
                                                        {location.isAvailable === true && location.status === STOCK_LOCATION_STATUS.Pending ? (
                                                            <button
                                                                onClick={() => handleConfirmCountedClick(location.stocktakingLocationId)}
                                                                disabled={confirmingLocationId === location.stocktakingLocationId}
                                                                className="flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
                                                                title="Xác nhận trong hệ thống không có pallet và bên ngoài không có pallet"
                                                            >
                                                                {confirmingLocationId === location.stocktakingLocationId ? (
                                                                    <RefreshCw className="h-5 w-5 animate-spin text-green-600" strokeWidth={2.5} />
                                                                ) : (
                                                                    <Check className="h-5 w-5 text-green-600 font-bold" strokeWidth={3} />
                                                                )}
                                                            </button>
                                                        ) : null}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                            {isUnchecked && location.rejectReason && (
                                                <TableRow key={`${locationId}-reject`} className="bg-red-50">
                                                    <TableCell colSpan={colSpanForRejectReason} className="px-6 py-2">
                                                        <span className="text-xs text-red-600 italic font-medium">
                                                            Lý do từ chối: {location.rejectReason}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                };

                                const colSpanUnchecked = hasConfirmableLocation ? 5 : 4; // Thêm 1 cột cho STT
                                const colSpanChecked = 5; // Thêm 1 cột cho STT và 1 cột cho checkbox

                                return (
                                    <div key={areaId || areaIndex} className="border border-gray-200 rounded-lg bg-white">
                                        {/* Area Header */}
                                        <div
                                            className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                                            onClick={() => toggleArea(areaId)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-gray-900 mb-1">
                                                        {area.areaDetail?.areaName || `Khu vực ${areaIndex + 1}`}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {area.assignToName && `Người tiếp nhận: ${area.assignToName}`}
                                                        {(unCheckedLocations.length > 0 || checkedLocations.length > 0) &&
                                                            ` • ${unCheckedLocations.length + checkedLocations.length} vị trí`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                {isAreaExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Area Content */}
                                        {isAreaExpanded && (
                                            <div className="p-4 space-y-6">
                                                {/* Card Chưa kiểm kê */}
                                                <Card className="border border-slate-200 shadow-sm">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-lg font-semibold text-slate-700">
                                                            Chưa kiểm kê
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="overflow-x-auto">
                                                            <Table className="w-full">
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-16">
                                                                            STT
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                                            Vị Trí
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Trạng Thái
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Hành Động
                                                                        </TableHead>
                                                                        {hasConfirmableLocation && (
                                                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                                Xác Nhận
                                                                            </TableHead>
                                                                        )}
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {unCheckedLocations.length > 0 ? (
                                                                        unCheckedLocations.map((location, index) => renderLocationRow(location, index, true))
                                                                    ) : (
                                                                        <TableRow>
                                                                            <TableCell colSpan={colSpanUnchecked} className="px-6 py-8 text-center text-gray-500">
                                                                                Không có vị trí chưa kiểm kê
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Card Đã kiểm kê */}
                                                <Card className="border border-slate-200 shadow-sm">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-lg font-semibold text-slate-700">
                                                            Đã kiểm kê
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        {checkedLocations.length > 0 && (
                                                            <div className="mb-4 flex items-center justify-between pb-3 border-b border-gray-200">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleSelectAll(areaId)}
                                                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                                    >
                                                                        Chọn tất cả
                                                                    </button>
                                                                    <span className="text-gray-400">|</span>
                                                                    <button
                                                                        onClick={handleDeselectAll}
                                                                        className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                                                                    >
                                                                        Bỏ chọn tất cả
                                                                    </button>
                                                                    {selectedLocations.size > 0 && (
                                                                        <>
                                                                            <span className="text-gray-400">|</span>
                                                                            <div className="text-sm text-slate-600">
                                                                                Đã chọn: {selectedLocations.size} vị trí
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    onClick={handleRecheckLocations}
                                                                    disabled={selectedLocations.size === 0 || recheckingLocations}
                                                                    className={`flex items-center space-x-2 px-4 py-2 h-[38px] ${selectedLocations.size === 0 || recheckingLocations
                                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                                                                        } transition-colors`}
                                                                >
                                                                    {recheckingLocations ? (
                                                                        <>
                                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                                            <span className="text-sm font-medium">Đang xử lý...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <RotateCcw className="h-4 w-4" />
                                                                            <span className="text-sm font-medium">Kiểm kê lại</span>
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <div className="overflow-x-auto">
                                                            <Table className="w-full">
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-16">
                                                                            STT
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Chọn
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                                            Vị Trí
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Trạng Thái
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Hành Động
                                                                        </TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {checkedLocations.length > 0 ? (
                                                                        checkedLocations.map((location, index) => renderLocationRow(location, index, false))
                                                                    ) : (
                                                                        <TableRow>
                                                                            <TableCell colSpan={colSpanChecked} className="px-6 py-8 text-center text-gray-500">
                                                                                Không có vị trí đã kiểm kê
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>

                                                        {/* Button Nộp kiểm kê */}
                                                        {(() => {
                                                            const allLocations = area.stocktakingLocations || [];

                                                            // Kiểm tra card "Chưa kiểm kê" có rỗng không
                                                            const isUncheckedEmpty = unCheckedLocations.length === 0;

                                                            // Kiểm tra tất cả vị trí đều ở trạng thái "Đã kiểm" hoặc "Chờ duyệt"
                                                            const allCountedOrPendingApproval = allLocations.length > 0 && allLocations.every(
                                                                location => location.status === STOCK_LOCATION_STATUS.Counted ||
                                                                    location.status === STOCK_LOCATION_STATUS.PendingApproval
                                                            );

                                                            // Kiểm tra xem tất cả vị trí có đều ở trạng thái "Chờ duyệt" không
                                                            const allPendingApproval = allLocations.length > 0 && allLocations.every(
                                                                location => location.status === STOCK_LOCATION_STATUS.PendingApproval
                                                            );

                                                            // Disable nút khi:
                                                            // - Card "Chưa kiểm kê" còn > 0
                                                            // - Hoặc không phải tất cả vị trí đều ở trạng thái "Đã kiểm" hoặc "Chờ duyệt"
                                                            // - Hoặc tất cả vị trí đều ở trạng thái "Chờ duyệt"
                                                            // - Hoặc đang submit
                                                            const isDisabled = !isUncheckedEmpty || !allCountedOrPendingApproval || allLocations.length === 0 || allPendingApproval || submittingArea;

                                                            return (
                                                                <div className="flex justify-end pt-4 border-t">
                                                                    <Button
                                                                        onClick={() => handleSubmitArea(areaId)}
                                                                        disabled={isDisabled}
                                                                        className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        {submittingArea ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                                                <span>Đang nộp...</span>
                                                                            </div>
                                                                        ) : (
                                                                            'Nộp kiểm kê'
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })()}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Scan Location Modal */}
                <ScanLocationStocktakingModal
                    isOpen={showScanModal}
                    onClose={handleScanModalClose}
                    location={selectedLocation}
                    stocktakingLocationId={selectedLocation?.stocktakingLocationId}
                    onLocationValidated={handleLocationValidated}
                />

                {/* Scan Pallet Modal */}
                <ScanPalletStocktakingModal
                    isOpen={showPalletModal}
                    onClose={handlePalletModalClose}
                    stocktakingLocationId={validatedLocationData?.stocktakingLocationId}
                    locationCode={validatedLocationData?.locationCode}
                />

                {/* Confirm Counted Modal */}
                <ConfirmCountedModal
                    isOpen={showConfirmModal}
                    onClose={() => {
                        setShowConfirmModal(false);
                        setLocationToConfirm(null);
                    }}
                    onConfirm={handleConfirmCounted}
                    loading={confirmingLocationId === locationToConfirm}
                />
            </div>
        </div >
    );
};

export default StocktakingArea;

