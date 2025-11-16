import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, ChevronUp, ChevronDown, RefreshCw, Calendar, User, X, MapPin, Clock, Thermometer, Droplets, Sun, RotateCcw } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { getStocktakingAreaDetailForOtherRoleBySheetId, getStocktakingDetail, getStocktakingPalletDetail } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import StatusDisplay from '../../components/StocktakingComponents/StatusDisplay';
import LocationStatusDisplay from './LocationStatusDisplay';
import PalletStatusDisplay from './PalletStatusDisplay';
import dayjs from 'dayjs';

const StocktakingAreaDetailForOther = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stocktakingArea, setStocktakingArea] = useState(null);
    const [stocktakingDetail, setStocktakingDetail] = useState(null);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        detail: true,
        sheets: {}
    });
    const [locationPackages, setLocationPackages] = useState({});
    const [loadingPackages, setLoadingPackages] = useState({});
    const [selectedLocations, setSelectedLocations] = useState(new Set());
    const isFetchingRef = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError('Không tìm thấy mã phiếu kiểm kê');
                setLoading(false);
                return;
            }

            if (isFetchingRef.current) {
                return;
            }

            try {
                isFetchingRef.current = true;
                setLoading(true);

                // Fetch cả hai API song song
                const [areaResponse, detailResponse] = await Promise.all([
                    getStocktakingAreaDetailForOtherRoleBySheetId(id),
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

    const toggleSheet = async (location) => {
        const locationId = location.stocktakingLocationId || location.locationId;
        const isCurrentlyExpanded = expandedSections.sheets[locationId] || false;

        // Toggle expanded state
        setExpandedSections(prev => ({
            ...prev,
            sheets: {
                ...prev.sheets,
                [locationId]: !isCurrentlyExpanded
            }
        }));

        // If expanding and haven't loaded packages yet, fetch them
        if (!isCurrentlyExpanded && !locationPackages[locationId] && locationId) {
            try {
                setLoadingPackages(prev => ({ ...prev, [locationId]: true }));
                const response = await getStocktakingPalletDetail(locationId);
                const packagesData = response?.data || response;

                // Handle both array and single object response
                let packages = [];
                if (Array.isArray(packagesData)) {
                    packages = packagesData;
                } else if (packagesData) {
                    // If it's a single object, check if it has nested array or is the object itself
                    if (packagesData.stocktakingPallets && Array.isArray(packagesData.stocktakingPallets)) {
                        packages = packagesData.stocktakingPallets;
                    } else if (packagesData.pallets && Array.isArray(packagesData.pallets)) {
                        packages = packagesData.pallets;
                    } else {
                        // Single object response
                        packages = [packagesData];
                    }
                }

                setLocationPackages(prev => ({
                    ...prev,
                    [locationId]: packages
                }));
            } catch (error) {
                console.error('Error fetching pallet detail:', error);
                const errorMessage = extractErrorMessage(error);
                if (window.showToast) {
                    window.showToast(errorMessage || 'Không thể tải danh sách gói hàng', 'error');
                }
                setLocationPackages(prev => ({
                    ...prev,
                    [locationId]: []
                }));
            } finally {
                setLoadingPackages(prev => ({ ...prev, [locationId]: false }));
            }
        }
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
                getStocktakingAreaDetailForOtherRoleBySheetId(id),
                getStocktakingDetail(id)
            ]);

            const areaData = areaResponse?.data || areaResponse;
            const detailData = detailResponse?.data || detailResponse;

            if (areaData) setStocktakingArea(areaData);
            if (detailData) setStocktakingDetail(detailData);

            // Clear cached packages to force reload when expanded
            setLocationPackages({});
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

    const handleDeletePackage = (packageId) => {
        // TODO: Implement delete package logic
        console.log('Delete package:', packageId);
        if (window.showToast) {
            window.showToast('Chức năng xóa gói hàng đang được phát triển', 'info');
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

    const handleRecheckLocations = () => {
        // TODO: Implement API call để kiểm kê lại các vị trí đã chọn
        const selectedIds = Array.from(selectedLocations);
        console.log('Kiểm kê lại các vị trí:', selectedIds);
        if (window.showToast) {
            window.showToast(`Đang kiểm kê lại ${selectedIds.length} vị trí...`, 'info');
        }
        // Sau khi gọi API thành công, có thể clear selection
        // setSelectedLocations(new Set());
    };

    const handleSelectAll = () => {
        if (stocktakingLocations.length === 0) return;
        const allLocationIds = stocktakingLocations.map(loc => 
            loc.stocktakingLocationId || loc.locationId
        );
        setSelectedLocations(new Set(allLocationIds));
    };

    const handleDeselectAll = () => {
        setSelectedLocations(new Set());
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Loading size="large" text="Đang tải thông tin chi tiết đơn kiểm kê..." />
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
                                {error || 'Không tìm thấy thông tin đơn kiểm kê'}
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

    // Extract stocktaking locations from area data
    const stocktakingLocations = stocktakingArea?.stocktakingLocations || [];

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
                                    Chi tiết đơn kiểm kê kho
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chi tiết đơn hàng Section */}
                <Card className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-visible">
                    <div
                        className="p-6 border-b border-gray-200 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSection('detail')}
                    >
                        <CardTitle className="text-lg font-semibold text-slate-700 m-0">
                            Chi tiết đơn hàng
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

                {/* Phiếu kiểm kê Section */}
                <Card className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-slate-700 m-0">
                            Phiếu kiểm kê
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            {selectedLocations.size > 0 && (
                                <div className="text-sm text-slate-600 mr-2">
                                    Đã chọn: {selectedLocations.size} vị trí
                                </div>
                            )}
                            <Button
                                onClick={handleRecheckLocations}
                                disabled={selectedLocations.size === 0}
                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] ${
                                    selectedLocations.size === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                                } transition-colors`}
                            >
                                <RotateCcw className="h-4 w-4" />
                                <span className="text-sm font-medium">Kiểm kê lại</span>
                            </Button>
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
                        <div className="space-y-4 p-6">
                            {stocktakingLocations && stocktakingLocations.length > 0 && (
                                <div className="mb-4 flex items-center justify-between pb-3 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSelectAll}
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
                                    </div>
                                </div>
                            )}
                            {stocktakingLocations && stocktakingLocations.length > 0 ? (
                                stocktakingLocations.map((location, index) => {
                                    const locationId = location.stocktakingLocationId || location.locationId || index;
                                    const isExpanded = expandedSections.sheets[locationId] || false;
                                    const packages = locationPackages[locationId] || [];
                                    const isLoading = loadingPackages[locationId] || false;
                                    const isSelected = selectedLocations.has(locationId);

                                    return (
                                        <div
                                            key={locationId}
                                            className={`border border-gray-200 rounded-lg ${isExpanded ? 'bg-gray-50' : 'bg-white'} ${isSelected ? 'ring-2 ring-orange-500' : ''} transition-colors`}
                                        >
                                            {/* Location Header */}
                                            <div
                                                className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors"
                                                onClick={() => toggleSheet(location)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleLocationSelect(locationId, e)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                                                    />
                                                    <div className="flex-1 grid grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Vị trí</div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {location.locationCode || location.location?.locationCode || location.locationName || '-'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Trạng thái</div>
                                                        <div>
                                                            {location.status ? (
                                                                <LocationStatusDisplay status={location.status} />
                                                            ) : (
                                                                <span className="text-sm text-gray-900">-</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Người kiểm tra</div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {stocktakingArea?.assignToName || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                </div>
                                                <div className="ml-4">
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Packages Table */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-200 p-4">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                                        Kệ kê hàng tại vị trí này
                                                    </h4>
                                                    {isLoading ? (
                                                        <div className="flex justify-center items-center py-8">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                                        </div>
                                                    ) : packages.length > 0 ? (
                                                        <div className="overflow-x-auto">
                                                            <Table className="w-full">
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                                                        <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                                            Mã pallet
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                                            Mã sản phẩm
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                                            Tên sản phẩm
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                                            Số lô
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">
                                                                            Số thùng dự kiến
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">
                                                                            Số thùng thực tế
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">
                                                                            Trạng thái
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">
                                                                            Hoạt động
                                                                        </TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {packages.map((pkg, pkgIndex) => {
                                                                        const pkgId = pkg.stocktakingPalletId || pkg.palletId || pkgIndex;
                                                                        const goodsName = pkg.gooodsName || pkg.gooodsName || pkg.pallet?.gooodsName || pkg.pallet?.gooodsName || '-';
                                                                        const goodsCode = pkg.goodsCode || pkg.goodCode || pkg.pallet?.goodsCode || pkg.pallet?.goodCode || '';
                                                                        const batchCode = pkg.batchCode || pkg.pallet?.batchCode || pkg.batch?.batchCode || pkg.lot || '-';
                                                                        const expected = pkg.expectedPackageQuantity ?? pkg.expectedQuantity ?? 0;
                                                                        const actual = pkg.actualPackageQuantity ?? pkg.actualQuantity ?? null;
                                                                        const status = pkg.status || 1;

                                                                        return (
                                                                            <TableRow
                                                                                key={pkgId}
                                                                                className="hover:bg-slate-50 border-b border-slate-200"
                                                                            >
                                                                                <TableCell className="px-4 py-3 text-slate-700">
                                                                                    {pkg.palletId || pkg.id || String(pkgId).substring(0, 4)}
                                                                                </TableCell>
                                                                                <TableCell className="px-4 py-3 text-slate-700">
                                                                                    {goodsCode || '-'}
                                                                                </TableCell>
                                                                                <TableCell className="px-4 py-3 text-slate-700">
                                                                                    {goodsName || '-'}
                                                                                </TableCell>
                                                                                <TableCell className="px-4 py-3 text-slate-700">
                                                                                    {batchCode}
                                                                                </TableCell>
                                                                                <TableCell className="px-4 py-3 text-center text-slate-700">
                                                                                    {expected}
                                                                                </TableCell>
                                                                                <TableCell className="px-4 py-3 text-center text-slate-700">
                                                                                    {actual !== null && actual !== undefined ? actual : '-'}
                                                                                </TableCell>
                                                                                <TableCell className="px-4 py-3 text-center">
                                                                                    <PalletStatusDisplay status={status} />
                                                                                </TableCell>
                                                                                <TableCell className="px-4 py-3 text-center">
                                                                                    <button
                                                                                        onClick={() => handleDeletePackage(pkgId)}
                                                                                        className="text-red-500 hover:text-red-700 transition-colors"
                                                                                        title="Xóa"
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-gray-500">
                                                            Không có gói hàng nào tại vị trí này
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Không có vị trí kiểm kê nào
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
export default StocktakingAreaDetailForOther;

