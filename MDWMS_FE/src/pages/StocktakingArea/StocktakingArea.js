import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, ChevronUp, ChevronDown, RefreshCw, MapPin, Clock, Calendar, User, Thermometer, Droplets, Sun } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { getStocktakingAreaDetailBySheetId, getStocktakingDetail } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import StatusDisplay from '../../components/StocktakingComponents/StatusDisplay';
import LocationStatusDisplay from './LocationStatusDisplay';
import dayjs from 'dayjs';

const StocktakingArea = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stocktakingArea, setStocktakingArea] = useState(null);
    const [stocktakingDetail, setStocktakingDetail] = useState(null);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        detail: true,
        check: true
    });
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

                // Fetch cả hai API song song
                const [areaResponse, detailResponse] = await Promise.all([
                    getStocktakingAreaDetailBySheetId(id),
                    getStocktakingDetail(id)
                ]);

                // Handle area data
                const areaData = areaResponse?.data || areaResponse;
                if (areaData) {
                    setStocktakingArea(areaData);
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
    }, [id]);

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
            const [areaResponse, detailResponse] = await Promise.all([
                getStocktakingAreaDetailBySheetId(id),
                getStocktakingDetail(id)
            ]);

            const areaData = areaResponse?.data || areaResponse;
            const detailData = detailResponse?.data || detailResponse;

            if (areaData) setStocktakingArea(areaData);
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
        // TODO: Implement logic to proceed with location checking
        console.log('Proceed with location:', location);
        if (window.showToast) {
            window.showToast(`Bắt đầu kiểm tra vị trí: ${location.locationCode}`, 'info');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Loading size="large" text="Đang tải thông tin khu vực kiểm kê..." />
            </div>
        );
    }

    if (error || !stocktakingArea) {
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
                                    {/* Khu Vực */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            Khu Vực
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingArea?.areaDetail?.areaName || '-'}
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
                                            {stocktakingArea?.areaDetail?.availableLocationCount ?? '-'}
                                        </div>
                                    </div>

                                    {/* Số vị trí không có sẵn */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-red-500" />
                                            Số vị trí không có sẵn
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingArea?.areaDetail?.unAvailableLocationCount ?? '-'}
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
                                            {stocktakingArea?.assignToName || '-'}
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
                                            {stocktakingArea?.areaDetail?.temperatureMin !== undefined && stocktakingArea?.areaDetail?.temperatureMax !== undefined
                                                ? `${stocktakingArea.areaDetail.temperatureMin}°C - ${stocktakingArea.areaDetail.temperatureMax}°C`
                                                : '-'}
                                        </div>
                                    </div>

                                    {/* Độ ẩm */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <Droplets className="h-4 w-4 text-blue-600" />
                                            Độ ẩm
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingArea?.areaDetail?.humidityMin !== undefined && stocktakingArea?.areaDetail?.humidityMax !== undefined
                                                ? `${stocktakingArea.areaDetail.humidityMin}% - ${stocktakingArea.areaDetail.humidityMax}%`
                                                : '-'}
                                        </div>
                                    </div>

                                    {/* Mức ánh sáng */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <Sun className="h-4 w-4 text-yellow-500" />
                                            Mức ánh sáng
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingArea?.areaDetail?.lightLevel || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Kiểm Tra Section */}
                <Card className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div
                        className="p-6 border-b border-gray-200 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSection('check')}
                    >
                        <div className="flex items-center gap-3">
                            <RefreshCw
                                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-orange-500 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRefresh();
                                }}
                            />
                            <CardTitle className="text-lg font-semibold text-slate-700 m-0">
                                Kiểm Tra
                            </CardTitle>
                        </div>
                        {expandedSections.check ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </div>

                    {expandedSections.check && (
                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
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
                                    {stocktakingArea?.stocktakingLocations && stocktakingArea.stocktakingLocations.length > 0 ? (
                                        stocktakingArea.stocktakingLocations.map((location, index) => (
                                            <TableRow
                                                key={location.stocktakingLocationId || index}
                                                className="hover:bg-slate-50 border-b border-slate-200"
                                            >
                                                <TableCell className="px-6 py-4 text-slate-700">
                                                    {location.locationCode || '-'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <LocationStatusDisplay status={location.status} />
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <Button
                                                        onClick={() => handleProceedLocation(location)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 h-8"
                                                    >
                                                        Tiến Hành
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                Không có vị trí nào để kiểm tra
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default StocktakingArea;

