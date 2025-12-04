import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, ChevronUp, ChevronDown, RefreshCw, MapPin, Clock, Calendar, User, Thermometer, Droplets, Sun, Check, RotateCcw, Search, Package, Printer } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { getStocktakingAreaDetailBySheetId, getStocktakingDetail, confirmStocktakingLocationCounted, submitStocktakingArea, cancelStocktakingLocationRecord, getStocktakingPalletDetail, exportStocktakingAreaWord } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import StatusDisplay from '../../components/StocktakingComponents/StatusDisplay';
import LocationStatusDisplay, { STOCK_LOCATION_STATUS } from './LocationStatusDisplay';
import PalletStatusDisplay from './PalletStatusDisplay';
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
        check: {},
        sheets: {}
    });
    const [locationPackages, setLocationPackages] = useState({});
    const [loadingPackages, setLoadingPackages] = useState({});
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
    const [searchTerms, setSearchTerms] = useState({}); // Lưu search term đang active (đã tìm) cho mỗi area
    const [searchInputs, setSearchInputs] = useState({}); // Lưu giá trị input cho mỗi area
    const [searchErrors, setSearchErrors] = useState({}); // Lưu error message cho mỗi area
    const locationRefs = useRef({}); // Refs để scroll đến location được tìm thấy
    const isFetchingRef = useRef(false);
    const searchInputTimers = useRef({}); // Timer để detect scanner input (input nhanh)
    const lastInputTime = useRef({}); // Thời gian input cuối cùng cho mỗi area
    const highlightTimers = useRef({}); // Timer để tự động clear highlight sau 5 giây

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

    const toggleSheet = async (location) => {
        const locationId = location.stocktakingLocationId || location.locationId;
        if (!locationId) return;

        const isCurrentlyExpanded = expandedSections.sheets[locationId] || false;
        const willBeExpanded = !isCurrentlyExpanded;

        // Toggle expanded state
        setExpandedSections(prev => ({
            ...prev,
            sheets: {
                ...prev.sheets,
                [locationId]: willBeExpanded
            }
        }));

        // Chỉ gọi API khi expand (mở ra) và chưa có data trong cache
        if (willBeExpanded && !locationPackages[locationId]) {
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

    const handleSearchLocation = (areaId, searchTerm) => {
        if (!searchTerm || !searchTerm.trim()) {
            setSearchTerms(prev => {
                const newTerms = { ...prev };
                delete newTerms[areaId];
                return newTerms;
            });
            setSearchErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[areaId];
                return newErrors;
            });
            return;
        }

        const trimmedTerm = searchTerm.trim().toLowerCase();

        // Clear error trước
        setSearchErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[areaId];
            return newErrors;
        });

        // Tìm location trong area này
        const area = stocktakingAreas.find(a => a.stocktakingAreaId === areaId);
        if (!area) return;

        const allLocations = area.stocktakingLocations || [];
        const foundLocation = allLocations.find(loc =>
            loc.locationCode && loc.locationCode.toLowerCase().includes(trimmedTerm)
        );

        if (foundLocation) {
            // Set search term để highlight
            setSearchTerms(prev => ({
                ...prev,
                [areaId]: trimmedTerm
            }));

            // Đảm bảo area được expand
            setExpandedSections(prev => ({
                ...prev,
                areas: {
                    ...prev.areas,
                    [areaId]: true
                }
            }));

            // Scroll đến location sau một chút delay để đảm bảo DOM đã render
            setTimeout(() => {
                const locationId = foundLocation.stocktakingLocationId || foundLocation.locationId;
                const refKey = `${areaId}-${locationId}`;
                if (locationRefs.current[refKey]) {
                    locationRefs.current[refKey].scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100);

            // Tự động clear highlight sau 5 giây
            if (highlightTimers.current[areaId]) {
                clearTimeout(highlightTimers.current[areaId]);
            }
            highlightTimers.current[areaId] = setTimeout(() => {
                setSearchTerms(prev => {
                    const newTerms = { ...prev };
                    delete newTerms[areaId];
                    return newTerms;
                });
                delete highlightTimers.current[areaId];
            }, 5000);
        } else {
            // Không tìm thấy - hiển thị error dưới input, không show toast
            setSearchErrors(prev => ({
                ...prev,
                [areaId]: 'Không tìm thấy vị trí với mã này'
            }));
            // Clear search term để không highlight
            setSearchTerms(prev => {
                const newTerms = { ...prev };
                delete newTerms[areaId];
                return newTerms;
            });
        }
    };

    const handleSearchInputChange = (areaId, value) => {
        // Xử lý giá trị để loại bỏ tab và whitespace không cần thiết
        let cleanedValue = value
            .replace(/\t/g, ' ') // Thay tab bằng space
            .replace(/\n/g, ' ') // Thay newline bằng space
            .replace(/\r/g, ' '); // Thay carriage return bằng space

        // Nếu có nhiều từ (có thể do paste), lấy từ đầu tiên
        const words = cleanedValue.split(/\s+/);
        if (words.length > 1 && words[0] === words[1]) {
            // Loại bỏ duplicate
            cleanedValue = words[0];
        } else if (words.length > 1) {
            // Lấy từ đầu tiên nếu có nhiều từ
            cleanedValue = words[0];
        } else {
            cleanedValue = cleanedValue.trim();
        }

        setSearchInputs(prev => ({
            ...prev,
            [areaId]: cleanedValue
        }));

        // Clear timer cũ nếu có
        if (searchInputTimers.current[areaId]) {
            clearTimeout(searchInputTimers.current[areaId]);
        }

        const now = Date.now();
        const lastTime = lastInputTime.current[areaId] || 0;
        const timeDiff = now - lastTime;
        lastInputTime.current[areaId] = now;

        // Nếu input quá nhanh (dưới 50ms giữa các ký tự) hoặc giá trị đủ dài, có thể là scanner
        // Scanner thường input rất nhanh và kèm Enter, nhưng để an toàn ta sẽ auto-search sau khi không có input trong 300ms
        if (cleanedValue && cleanedValue.trim().length > 0) {
            searchInputTimers.current[areaId] = setTimeout(() => {
                // Nếu input dừng lại và có giá trị, tự động tìm kiếm (hỗ trợ scanner không có Enter)
                if (cleanedValue && cleanedValue.trim().length >= 3) { // Chỉ auto-search nếu có ít nhất 3 ký tự
                    handleSearchLocation(areaId, cleanedValue);
                }
            }, 300); // Đợi 300ms sau khi ngừng input
        }
    };

    const handleSearchPaste = (areaId, e) => {
        // Khi paste (thường từ scanner), tự động tìm kiếm
        e.preventDefault(); // Ngăn paste mặc định để xử lý thủ công
        const pastedValue = e.clipboardData.getData('text');
        if (pastedValue) {
            // Xử lý giá trị paste: loại bỏ whitespace, tab, newline
            let cleanedValue = pastedValue
                .replace(/\t/g, ' ') // Thay tab bằng space
                .replace(/\n/g, ' ') // Thay newline bằng space
                .replace(/\r/g, ' ') // Thay carriage return bằng space
                .trim(); // Loại bỏ space đầu cuối

            // Nếu có nhiều từ (có thể do paste từ Excel hoặc có tab), lấy từ đầu tiên
            const words = cleanedValue.split(/\s+/);
            cleanedValue = words[0] || cleanedValue;

            // Loại bỏ duplicate nếu có (ví dụ: "A01-Rack1-R01-C04	A01-Rack1-R01-C04" -> "A01-Rack1-R01-C04")
            if (words.length > 1 && words[0] === words[1]) {
                cleanedValue = words[0];
            }

            if (cleanedValue) {
                setSearchInputs(prev => ({
                    ...prev,
                    [areaId]: cleanedValue
                }));
                // Tự động tìm kiếm sau khi paste
                setTimeout(() => {
                    handleSearchLocation(areaId, cleanedValue);
                }, 100);
            }
        }
    };

    const clearSearch = (areaId) => {
        setSearchTerms(prev => {
            const newTerms = { ...prev };
            delete newTerms[areaId];
            return newTerms;
        });
        setSearchInputs(prev => {
            const newInputs = { ...prev };
            delete newInputs[areaId];
            return newInputs;
        });
        setSearchErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[areaId];
            return newErrors;
        });
        // Clear highlight timer nếu có
        if (highlightTimers.current[areaId]) {
            clearTimeout(highlightTimers.current[areaId]);
            delete highlightTimers.current[areaId];
        }
    };

    const handleExportReceipt = async (stocktakingAreaId) => {
        if (!stocktakingAreaId) {
            window.showToast?.("Không tìm thấy mã khu vực kiểm kê", "error");
            return;
        }

        try {
            const { file, fileName } = await exportStocktakingAreaWord(stocktakingAreaId);

            // Tạo URL từ blob và tải xuống
            const url = window.URL.createObjectURL(new Blob([file]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            window.showToast?.("Xuất phiếu thành công!", "success");
        } catch (error) {
            console.error("Error exporting stocktaking area:", error);
            const errorMessage = extractErrorMessage(error, "Xuất phiếu thất bại, vui lòng thử lại!");
            window.showToast?.(errorMessage, "error");
        }
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
                        <div className="flex items-center gap-2">
                            {stocktakingAreas.length > 0 && stocktakingAreas[0]?.stocktakingAreaId && (
                                <Button
                                    onClick={() => handleExportReceipt(stocktakingAreas[0].stocktakingAreaId)}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 h-[38px] px-4 text-white"
                                >
                                    <Printer className="w-4 h-4" />
                                    Xuất Phiếu
                                </Button>
                            )}
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
                                            Vị trí chưa xếp pallet
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.reduce((sum, area) => sum + (area.areaDetail?.availableLocationCount || 0), 0)}
                                        </div>
                                    </div>

                                    {/* Số vị trí không có sẵn */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-red-500" />
                                            Vị trí đã xếp pallet
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    const isExpanded = expandedSections.sheets[locationId] || false;
                                    const packages = locationPackages[locationId] || [];
                                    const isLoading = loadingPackages[locationId] || false;

                                    // Check if location matches search term
                                    const locationCode = location.locationCode || '';
                                    const isHighlighted = currentSearchTerm &&
                                        locationCode.toLowerCase().includes(currentSearchTerm);
                                    const refKey = `${areaId}-${locationId}`;

                                    return (
                                        <>
                                            <TableRow
                                                key={locationId}
                                                ref={(el) => {
                                                    if (el) {
                                                        locationRefs.current[refKey] = el;
                                                    }
                                                }}
                                                className={`border-b border-slate-200 transition-colors ${isHighlighted
                                                    ? 'bg-green-300 hover:bg-green-400 border-l-4 border-l-green-500'
                                                    : isSelected
                                                        ? 'bg-orange-50 hover:bg-orange-100'
                                                        : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                {!isUnchecked && (
                                                    <TableCell
                                                        className="px-6 py-4 text-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
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
                                                <TableCell className="px-6 py-4 text-center text-slate-700 font-medium">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-slate-700 text-center">
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRecheckLocation(location);
                                                            }}
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
                                                {!isUnchecked && (
                                                    <TableCell
                                                        className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSheet(location);
                                                        }}
                                                        title={isExpanded ? "Thu gọn" : "Mở rộng"}
                                                    >
                                                        <div className="flex items-center justify-center">
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
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
                                            {!isUnchecked && isExpanded && (
                                                <TableRow key={`${locationId}-packages`}>
                                                    <TableCell colSpan={6} className="px-0 py-0">
                                                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                                                Pallet tại vị trí này
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
                                                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left min-w-[140px]">
                                                                                    Mã pallet
                                                                                </TableHead>
                                                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left min-w-[140px]">
                                                                                    Mã hàng hóa
                                                                                </TableHead>
                                                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left min-w-[140px]">
                                                                                    Tên hàng hóa
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
                                                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                                                    Ghi chú
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
                                                                                const note = pkg.note || pkg.notes || pkg.description || pkg.remark || pkg.pallet?.note || pkg.pallet?.notes || '';

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
                                                                                        <TableCell className="px-4 py-3 text-slate-700">
                                                                                            {note || '-'}
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
                                                    </TableCell>
                                                </TableRow>
                                            )}
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
                                const colSpanChecked = 6; // Thêm 1 cột cho STT, 1 cột cho checkbox, và 1 cột cho chi tiết

                                const currentSearchTerm = searchTerms[areaId] || '';
                                const currentSearchInput = searchInputs[areaId] || '';
                                const currentSearchError = searchErrors[areaId] || '';

                                return (
                                    <div key={areaId || areaIndex} className="border border-gray-200 rounded-lg bg-white">
                                        {/* Area Header */}
                                        <div className="p-4 border-b border-gray-200">
                                            <div
                                                className="flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer -mx-4 -mt-4 px-4 pt-4 pb-4"
                                                onClick={(e) => {
                                                    // Chỉ toggle khi click vào phần không phải search
                                                    if (!e.target.closest('.search-container')) {
                                                        toggleArea(areaId);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
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
                                                {/* Search Bar - cùng dòng */}
                                                <div
                                                    className="search-container flex flex-col items-end gap-1 ml-4"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="relative w-64">
                                                        <input
                                                            type="text"
                                                            placeholder="Nhập hoặc quét mã vị trí..."
                                                            value={currentSearchInput}
                                                            onChange={(e) => handleSearchInputChange(areaId, e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    // Tự động tìm kiếm khi nhấn Enter (hỗ trợ cả quét và nhập)
                                                                    handleSearchLocation(areaId, currentSearchInput);
                                                                }
                                                            }}
                                                            onPaste={(e) => handleSearchPaste(areaId, e)}
                                                            autoComplete="off"
                                                            className={`w-full px-3 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm ${currentSearchError ? 'border-red-500' : 'border-slate-300'}`}
                                                        />
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                            {(currentSearchInput || currentSearchTerm) && (
                                                                <button
                                                                    onClick={() => {
                                                                        clearSearch(areaId);
                                                                        setSearchErrors(prev => {
                                                                            const newErrors = { ...prev };
                                                                            delete newErrors[areaId];
                                                                            return newErrors;
                                                                        });
                                                                    }}
                                                                    className="text-gray-400 hover:text-gray-600 text-xl leading-none w-5 h-5 flex items-center justify-center"
                                                                    title="Xóa tìm kiếm"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleSearchLocation(areaId, currentSearchInput)}
                                                                className="text-orange-500 hover:text-orange-600 p-1 flex items-center justify-center"
                                                                title="Tìm kiếm"
                                                            >
                                                                <Search className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {currentSearchError && (
                                                        <div className="text-xs text-red-500 mt-0.5 w-64 text-right">
                                                            {currentSearchError}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    {isAreaExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
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
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
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
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Chọn
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-16">
                                                                            STT
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Vị Trí
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Trạng Thái
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Hành Động
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                                                                            Chi tiết
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

