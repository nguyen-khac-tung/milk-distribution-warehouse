import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, ChevronUp, ChevronDown, RefreshCw, Calendar, User, MapPin, Clock, Thermometer, Droplets, Sun, RotateCcw, CheckCircle2, AlertTriangle, Edit2, Save, X, Search, Package } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { getStocktakingAreaDetailForOtherRoleBySheetId, getStocktakingDetail, getStocktakingPalletDetail, rejectStocktakingLocationRecords, approveStocktakingArea, completeStocktaking, updateStocktakingLocationRecords } from '../../services/StocktakingService';
import { usePermissions } from '../../hooks/usePermissions';
import { extractErrorMessage } from '../../utils/Validation';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import StatusDisplay, { STOCKTAKING_STATUS } from '../../components/StocktakingComponents/StatusDisplay';
import LocationStatusDisplay, { STOCK_LOCATION_STATUS } from './LocationStatusDisplay';
import AreaStatusDisplay, { STOCK_AREA_STATUS } from './AreaStatusDisplay';
import PalletStatusDisplay from './PalletStatusDisplay';
import RejectStocktakingLocationModal from '../../components/StocktakingComponents/RejectStocktakingLocationModal';
import dayjs from 'dayjs';

const StocktakingAreaDetailForOther = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stocktakingAreas, setStocktakingAreas] = useState([]);
    const [stocktakingDetail, setStocktakingDetail] = useState(null);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        detail: true,
        areas: {},
        sheets: {}
    });
    const [locationPackages, setLocationPackages] = useState({});
    const [loadingPackages, setLoadingPackages] = useState({});
    const [selectedLocations, setSelectedLocations] = useState(new Set());
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [approvingAreas, setApprovingAreas] = useState(new Set());
    const [locationWarnings, setLocationWarnings] = useState({}); // Map locationId -> warnings array
    const isFetchingRef = useRef(false);
    const { isWarehouseManager, isSaleManager } = usePermissions();
    const [completingStocktaking, setCompletingStocktaking] = useState(false);
    const [completeNote, setCompleteNote] = useState('');
    const [editingNotes, setEditingNotes] = useState({}); // Map locationId -> note value
    const [updatingNotes, setUpdatingNotes] = useState(new Set()); // Set of locationIds being updated
    const [searchTerms, setSearchTerms] = useState({}); // Lưu search term đang active (đã tìm) cho mỗi area
    const [searchInputs, setSearchInputs] = useState({}); // Lưu giá trị input cho mỗi area
    const [searchErrors, setSearchErrors] = useState({}); // Lưu error message cho mỗi area
    const locationRefs = useRef({}); // Refs để scroll đến location được tìm thấy
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

    const handleDeletePackage = (packageId) => {
        // TODO: Implement delete package logic
        console.log('Delete package:', packageId);
        if (window.showToast) {
            window.showToast('Chức năng xóa gói hàng đang được phát triển', 'info');
        }
    };

    // Helper function để tìm areaId từ locationId
    const getAreaIdByLocationId = (locationId) => {
        for (const area of stocktakingAreas) {
            const location = (area.stocktakingLocations || []).find(
                loc => (loc.stocktakingLocationId || loc.locationId) === locationId
            );
            if (location) {
                return area.stocktakingAreaId;
            }
        }
        return null;
    };

    const handleLocationSelect = (locationId, areaStatus, currentAreaId, event) => {
        event.stopPropagation(); // Ngăn chặn toggle expand khi click checkbox

        // Chỉ cho phép chọn các vị trí khi khu vực ở trạng thái Chờ duyệt
        if (areaStatus !== STOCK_AREA_STATUS.PendingApproval) {
            return;
        }

        // Kiểm tra xem đã có vị trí nào được chọn chưa
        if (selectedLocations.size > 0) {
            // Lấy areaId của vị trí đầu tiên đã được chọn
            const firstSelectedLocationId = Array.from(selectedLocations)[0];
            const selectedAreaId = getAreaIdByLocationId(firstSelectedLocationId);

            // Nếu đang cố chọn vị trí ở khu vực khác
            if (selectedAreaId && selectedAreaId !== currentAreaId) {
                const selectedArea = stocktakingAreas.find(a => a.stocktakingAreaId === selectedAreaId);
                const selectedAreaName = selectedArea?.areaDetail?.areaName || 'khu vực đã chọn';

                if (window.showToast) {
                    window.showToast(
                        `Bạn đã chọn vị trí ở ${selectedAreaName}. Vui lòng bỏ chọn trước khi chọn vị trí ở khu vực khác.`,
                        'error'
                    );
                }
                return;
            }
        }

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
        if (selectedLocations.size === 0) {
            if (window.showToast) {
                window.showToast('Vui lòng chọn ít nhất một vị trí để kiểm kê lại', 'warning');
            }
            return;
        }
        setIsRejectModalOpen(true);
    };

    const handleRejectConfirm = async (records) => {
        if (!records || records.length === 0) {
            if (window.showToast) {
                window.showToast('Không có dữ liệu để xử lý', 'error');
            }
            return;
        }

        try {
            setIsRejecting(true);
            await rejectStocktakingLocationRecords(records);

            if (window.showToast) {
                window.showToast(`Đã từ chối ${records.length} vị trí kiểm kê thành công`, 'success');
            }

            // Close modal and clear selection
            setIsRejectModalOpen(false);
            setSelectedLocations(new Set());

            // Refresh data
            await handleRefresh();
        } catch (error) {
            console.error('Error rejecting stocktaking locations:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Không thể từ chối kiểm kê vị trí', 'error');
            }
        } finally {
            setIsRejecting(false);
        }
    };

    const handleRejectCancel = () => {
        setIsRejectModalOpen(false);
    };

    const handleSelectAll = (areaId) => {
        if (!areaId) return;
        const area = stocktakingAreas.find(a => a.stocktakingAreaId === areaId);
        if (!area || !area.stocktakingLocations || area.stocktakingLocations.length === 0) return;

        // Chỉ chọn tất cả vị trí khi khu vực ở trạng thái Chờ duyệt
        if (area.status !== STOCK_AREA_STATUS.PendingApproval) {
            return;
        }

        // Kiểm tra xem đã có vị trí nào được chọn ở khu vực khác chưa
        if (selectedLocations.size > 0) {
            const firstSelectedLocationId = Array.from(selectedLocations)[0];
            const selectedAreaId = getAreaIdByLocationId(firstSelectedLocationId);

            // Nếu đang cố chọn vị trí ở khu vực khác
            if (selectedAreaId && selectedAreaId !== areaId) {
                const selectedArea = stocktakingAreas.find(a => a.stocktakingAreaId === selectedAreaId);
                const selectedAreaName = selectedArea?.areaDetail?.areaName || 'khu vực đã chọn';

                if (window.showToast) {
                    window.showToast(
                        `Bạn đã chọn vị trí ở ${selectedAreaName}. Vui lòng bỏ chọn trước khi chọn vị trí ở khu vực khác.`,
                        'error'
                    );
                }
                return;
            }
        }

        const allLocationIds = area.stocktakingLocations
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

    const handleApproveArea = async (areaId, event) => {
        event?.stopPropagation(); // Ngăn chặn toggle expand khi click nút

        if (!areaId) {
            if (window.showToast) {
                window.showToast('Không tìm thấy mã khu vực', 'error');
            }
            return;
        }

        try {
            setApprovingAreas(prev => new Set(prev).add(areaId));
            const response = await approveStocktakingArea(areaId);

            // Lấy data từ response - response có thể là response.data hoặc response trực tiếp
            const responseData = response?.data || response;

            // Lấy warnings và fails từ response data
            const warnings = responseData?.stocktakingLocationWarmings || [];
            const fails = responseData?.stocktakingLocationFails || [];

            // Gộp cả warnings và fails lại, thêm type để phân biệt
            const allAlerts = [
                ...warnings.map(w => ({ ...w, alertType: 'warning' })),
                ...fails.map(f => ({ ...f, alertType: 'fail' }))
            ];

            // Tạo map locationId -> alerts (warnings + fails)
            const alertsMap = {};
            allAlerts.forEach(alert => {
                const locationId = alert.stocktakingLocationId;
                if (!alertsMap[locationId]) {
                    alertsMap[locationId] = [];
                }
                alertsMap[locationId].push(alert);
            });

            // Cập nhật state warnings (giữ tên state cũ để không phá vỡ UI)
            setLocationWarnings(prev => ({
                ...prev,
                ...alertsMap
            }));

            // Hiển thị thông báo
            if (fails.length > 0 && warnings.length > 0) {
                if (window.showToast) {
                    window.showToast(`Có ${fails.length} lỗi và ${warnings.length} cảnh báo cần kiểm tra.`, 'warning');
                }
            } else if (fails.length > 0) {
                if (window.showToast) {
                    window.showToast(`Có ${fails.length} lỗi cần kiểm tra.`, 'error');
                }
            } else if (warnings.length > 0) {
                if (window.showToast) {
                    window.showToast(`Có ${warnings.length} cảnh báo cần kiểm tra.`, 'warning');
                }
            } else {
                if (window.showToast) {
                    window.showToast('Duyệt khu vực kiểm kê thành công', 'success');
                }
            }

            // Refresh data
            await handleRefresh();
        } catch (error) {
            console.error('Error approving stocktaking area:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Không thể duyệt khu vực kiểm kê', 'error');
            }
        } finally {
            setApprovingAreas(prev => {
                const newSet = new Set(prev);
                newSet.delete(areaId);
                return newSet;
            });
        }
    };

    const handleCompleteStocktaking = async () => {
        if (!id) {
            if (window.showToast) {
                window.showToast('Không tìm thấy mã phiếu kiểm kê', 'error');
            }
            return;
        }

        try {
            setCompletingStocktaking(true);
            await completeStocktaking({
                stocktakingSheetId: id,
                note: completeNote
            });

            if (window.showToast) {
                window.showToast('Hoàn thành phiếu kiểm kê thành công', 'success');
            }

            // Clear note
            setCompleteNote('');

            // Refresh data
            await handleRefresh();
        } catch (error) {
            console.error('Error completing stocktaking:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Không thể hoàn thành phiếu kiểm kê', 'error');
            }
        } finally {
            setCompletingStocktaking(false);
        }
    };

    const handleNoteChange = (locationId, value) => {
        setEditingNotes(prev => ({
            ...prev,
            [locationId]: value
        }));
    };

    const handleStartEditNote = (locationId, currentNote, event) => {
        event?.stopPropagation();
        setEditingNotes(prev => ({
            ...prev,
            [locationId]: currentNote || ''
        }));
    };

    const handleCancelEditNote = (locationId, event) => {
        event?.stopPropagation();
        setEditingNotes(prev => {
            const newNotes = { ...prev };
            delete newNotes[locationId];
            return newNotes;
        });
    };

    const handleUpdateNote = async (locationId, event) => {
        event?.stopPropagation();

        if (!locationId) {
            if (window.showToast) {
                window.showToast('Không tìm thấy mã vị trí', 'error');
            }
            return;
        }

        const note = editingNotes[locationId] || '';

        try {
            setUpdatingNotes(prev => new Set(prev).add(locationId));
            await updateStocktakingLocationRecords({
                stocktakingLocationId: locationId,
                note: note
            });

            if (window.showToast) {
                window.showToast('Cập nhật ghi chú thành công', 'success');
            }

            // Clear editing state
            setEditingNotes(prev => {
                const newNotes = { ...prev };
                delete newNotes[locationId];
                return newNotes;
            });

            // Refresh data
            await handleRefresh();
        } catch (error) {
            console.error('Error updating note:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Không thể cập nhật ghi chú', 'error');
            }
        } finally {
            setUpdatingNotes(prev => {
                const newSet = new Set(prev);
                newSet.delete(locationId);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Loading size="large" text="Đang tải thông tin chi tiết đơn kiểm kê..." />
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

    const toggleArea = (areaId) => {
        setExpandedSections(prev => ({
            ...prev,
            areas: {
                ...prev.areas,
                [areaId]: !prev.areas[areaId]
            }
        }));
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
        const foundLocation = allLocations.find(loc => {
            const locationCode = loc.locationCode || loc.location?.locationCode || loc.locationName || '';
            return locationCode.toLowerCase().includes(trimmedTerm);
        });

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
                                            Vị trí đã xếp pallet
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.reduce((sum, area) => sum + (area.areaDetail?.unAvailableLocationCount || 0), 0)}
                                        </div>
                                    </div>

                                    {/* Số vị trí không có sẵn */}
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-red-500" />
                                            Vị trí chưa xếp pallet
                                        </div>
                                        <div className="text-base font-semibold text-gray-900">
                                            {stocktakingAreas.reduce((sum, area) => sum + (area.areaDetail?.availableLocationCount || 0), 0)}
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
                                <div className="space-y-4">
                                    {stocktakingAreas.map((area, areaIndex) => {
                                        const areaDetail = area.areaDetail;
                                        const areaName = areaDetail?.areaName || `Khu vực ${areaIndex + 1}`;

                                        return (
                                            <div key={area.stocktakingAreaId || areaIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="text-sm font-semibold text-gray-700 mb-3">
                                                    {areaName}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                                    {/* Nhiệt độ */}
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                                            <Thermometer className="h-4 w-4 text-red-600" />
                                                            Nhiệt độ
                                                        </div>
                                                        <div className="text-base font-semibold text-gray-900">
                                                            {areaDetail?.temperatureMin !== undefined && areaDetail?.temperatureMax !== undefined
                                                                ? `${areaDetail.temperatureMin}°C - ${areaDetail.temperatureMax}°C`
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
                                                            {areaDetail?.humidityMin !== undefined && areaDetail?.humidityMax !== undefined
                                                                ? `${areaDetail.humidityMin}% - ${areaDetail.humidityMax}%`
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
                                                            {areaDetail?.lightLevel || '-'}
                                                        </div>
                                                    </div>

                                                    {/* Vị trí đã xếp pallet */}
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                                            <Package className="h-4 w-4 text-blue-600" />
                                                            Vị trí đã xếp pallet
                                                        </div>
                                                        <div className="text-base font-semibold text-gray-900">
                                                            {areaDetail?.unAvailableLocationCount ?? 0}
                                                        </div>
                                                    </div>

                                                    {/* Vị trí chưa xếp pallet */}
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1.5">
                                                            <Package className="h-4 w-4 text-red-600" />
                                                            Vị trí chưa xếp pallet
                                                        </div>
                                                        <div className="text-base font-semibold text-gray-900">
                                                            {areaDetail?.availableLocationCount ?? 0}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] ${selectedLocations.size === 0
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
                        <div className="space-y-6 p-6">
                            {stocktakingAreas.map((area, areaIndex) => {
                                const areaId = area.stocktakingAreaId;
                                const isAreaExpanded = expandedSections.areas[areaId] || false;
                                const stocktakingLocations = area.stocktakingLocations || [];
                                const hasLocations = stocktakingLocations.length > 0;
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
                                                    <div className="flex-shrink-0 w-8 text-center">
                                                        <div className="text-sm font-bold text-gray-600">
                                                            {areaIndex + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {area.areaDetail?.areaName || `Khu vực ${areaIndex + 1}`}
                                                            </div>
                                                            {area.status && (
                                                                <AreaStatusDisplay status={area.status} />
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {area.assignToName && `Người tiếp nhận: ${area.assignToName}`}
                                                            {hasLocations && ` • ${stocktakingLocations.length} vị trí`}
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

                                        {/* Locations List */}
                                        {isAreaExpanded && (
                                            <div className="p-4 space-y-4">
                                                {hasLocations && (() => {
                                                    // Chỉ hiển thị nút chọn tất cả khi khu vực ở trạng thái Chờ duyệt
                                                    const isAreaPendingApproval = area.status === STOCK_AREA_STATUS.PendingApproval;

                                                    if (!isAreaPendingApproval) return null;

                                                    return (
                                                        <div className="mb-4 flex items-center justify-between pb-3 border-b border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleSelectAll(areaId)}
                                                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Chọn tất cả ({stocktakingLocations.length} vị trí)
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
                                                    );
                                                })()}
                                                {hasLocations ? (
                                                    stocktakingLocations.map((location, index) => {
                                                        const locationId = location.stocktakingLocationId || location.locationId || index;
                                                        const isExpanded = expandedSections.sheets[locationId] || false;
                                                        const packages = locationPackages[locationId] || [];
                                                        const isLoading = loadingPackages[locationId] || false;
                                                        const isSelected = selectedLocations.has(locationId);
                                                        const areaStatus = area.status;
                                                        const isAreaPendingApproval = areaStatus === STOCK_AREA_STATUS.PendingApproval;
                                                        const warnings = locationWarnings[locationId] || [];
                                                        const hasWarnings = warnings.length > 0;
                                                        const hasFails = warnings.some(w => w.alertType === 'fail');
                                                        const hasOnlyWarnings = hasWarnings && !hasFails;

                                                        // Check if location matches search term
                                                        const locationCode = location.locationCode || location.location?.locationCode || location.locationName || '';
                                                        const isHighlighted = currentSearchTerm &&
                                                            locationCode.toLowerCase().includes(currentSearchTerm);
                                                        const refKey = `${areaId}-${locationId}`;

                                                        return (
                                                            <div
                                                                key={locationId}
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        locationRefs.current[refKey] = el;
                                                                    }
                                                                }}
                                                                className={`border rounded-lg transition-colors ${hasFails
                                                                    ? 'border-red-500 border-2'
                                                                    : hasOnlyWarnings
                                                                        ? 'border-yellow-500 border-2'
                                                                        : 'border-gray-200'
                                                                    } ${isHighlighted
                                                                        ? 'bg-green-300 hover:bg-green-400 border-l-4 border-l-green-500'
                                                                        : isExpanded
                                                                            ? 'bg-gray-50'
                                                                            : 'bg-white'
                                                                    } ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
                                                            >
                                                                {/* Location Header */}
                                                                <div
                                                                    className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors"
                                                                    onClick={() => toggleSheet(location)}
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1">
                                                                        <div className="flex-shrink-0 w-6 text-center">
                                                                            <div className="text-xs font-bold text-gray-600">
                                                                                {index + 1}
                                                                            </div>
                                                                        </div>
                                                                        {isAreaPendingApproval ? (
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={(e) => handleLocationSelect(locationId, areaStatus, areaId, e)}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-4 h-4"></div>
                                                                        )}
                                                                        {hasWarnings && (
                                                                            <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${hasFails ? 'text-red-500' : 'text-yellow-500'}`} />
                                                                        )}
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
                                                                                    {area.assignToName || 'N/A'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4 flex items-center gap-2">
                                                                        {isExpanded ? (
                                                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                                                        ) : (
                                                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Warnings Display */}
                                                                {hasWarnings && (() => {
                                                                    const fails = warnings.filter(w => w.alertType === 'fail');
                                                                    const warningsOnly = warnings.filter(w => w.alertType === 'warning');

                                                                    return (
                                                                        <div className={`px-4 pb-3 border-b ${fails.length > 0 ? 'border-red-200' : 'border-yellow-200'}`}>
                                                                            {fails.length > 0 && (
                                                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                                                                                    <div className="flex items-start gap-2 mb-2">
                                                                                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                                                        {fails.map((fail, failIndex) => (
                                                                                            <div key={failIndex} className="text-xs text-red-700 pl-6">
                                                                                                <span className="font-medium"> </span> {fail.message}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {warningsOnly.length > 0 && (
                                                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                                                    <div className="flex items-start gap-2 mb-2">
                                                                                        <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                                                                        {warningsOnly.map((warning, warningIndex) => (
                                                                                            <div key={warningIndex} className="text-xs text-yellow-700 pl-6">
                                                                                                <span className="font-medium"></span> {warning.message}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}

                                                                {/* Note Section */}
                                                                <div className="px-4 pb-3 border-b border-gray-200" onClick={(e) => e.stopPropagation()}>
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="flex-1">
                                                                            <div className="text-xs text-gray-500 mb-1">Ghi chú</div>
                                                                            {editingNotes.hasOwnProperty(locationId) ? (
                                                                                <div className="flex items-start gap-2">
                                                                                    <textarea
                                                                                        value={editingNotes[locationId] || ''}
                                                                                        onChange={(e) => handleNoteChange(locationId, e.target.value)}
                                                                                        placeholder="Nhập ghi chú..."
                                                                                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                                                                        rows={2}
                                                                                        disabled={updatingNotes.has(locationId)}
                                                                                    />
                                                                                    <div className="flex items-center gap-1 mt-1">
                                                                                        <button
                                                                                            onClick={(e) => handleUpdateNote(locationId, e)}
                                                                                            disabled={updatingNotes.has(locationId)}
                                                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                            title="Lưu ghi chú"
                                                                                        >
                                                                                            {updatingNotes.has(locationId) ? (
                                                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                                                            ) : (
                                                                                                <Save className="h-4 w-4" />
                                                                                            )}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={(e) => handleCancelEditNote(locationId, e)}
                                                                                            disabled={updatingNotes.has(locationId)}
                                                                                            className="p-1.5 text-gray-500 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                            title="Hủy"
                                                                                        >
                                                                                            <X className="h-4 w-4" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-start gap-2">
                                                                                    <div className="flex-1 min-h-[2rem] px-2 py-1.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-transparent">
                                                                                        {location.note || <span className="text-gray-400 italic">Chưa có ghi chú</span>}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => handleStartEditNote(locationId, location.note, e)}
                                                                                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors mt-1"
                                                                                        title="Chỉnh sửa ghi chú"
                                                                                    >
                                                                                        <Edit2 className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
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
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500">
                                                        Không có vị trí kiểm kê nào
                                                    </div>
                                                )}

                                                {/* Nút Duyệt - chỉ hiển thị cho quản lý kho khi khu vực ở trạng thái Chờ duyệt */}
                                                {isWarehouseManager && area.status === STOCK_AREA_STATUS.PendingApproval && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                                        <Button
                                                            onClick={(e) => handleApproveArea(areaId, e)}
                                                            disabled={approvingAreas.has(areaId)}
                                                            className="flex items-center space-x-2 px-4 py-2 h-[38px] bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {approvingAreas.has(areaId) ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                    <span className="text-sm font-medium">Đang duyệt...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    <span className="text-sm font-medium">Duyệt</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Nút Hoàn thành cho quản lý kinh doanh khi trạng thái là Đã duyệt */}
                            {isSaleManager &&
                                stocktakingDetail?.status === STOCKTAKING_STATUS.Approved && (
                                    <div className="pt-6 mt-6 border-t border-gray-200">
                                        <div className="flex flex-col gap-3">
                                            <textarea
                                                value={completeNote}
                                                onChange={(e) => setCompleteNote(e.target.value)}
                                                placeholder="Ghi chú (tùy chọn)..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                                rows={2}
                                                disabled={completingStocktaking}
                                            />
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleCompleteStocktaking}
                                                    disabled={completingStocktaking}
                                                    className="flex items-center space-x-2 px-4 py-2 h-[38px] bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {completingStocktaking ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            <span className="text-sm font-medium">Đang xử lý...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span className="text-sm font-medium">Hoàn thành</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reject Stocktaking Location Modal */}
            <RejectStocktakingLocationModal
                isOpen={isRejectModalOpen}
                onClose={handleRejectCancel}
                onConfirm={handleRejectConfirm}
                selectedLocations={Array.from(selectedLocations)}
                stocktakingAreas={stocktakingAreas}
                locationWarnings={locationWarnings}
                loading={isRejecting}
            />
        </div>
    );
};
export default StocktakingAreaDetailForOther;

