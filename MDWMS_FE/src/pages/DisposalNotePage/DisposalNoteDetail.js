import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Printer, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Barcode, Package, Send, ShieldCheck, MapPin, X } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { getDetailDisposalNote, submitDisposalNote, approveDisposalNote, rePickDisposalNoteDetail, rePickDisposalNoteDetailList } from '../../services/DisposalService';
import { getPickAllocationDetail, confirmPickAllocation } from '../../services/PickAllocationService';
import { getDisposalNoteStatusMeta, getDisposalItemStatusMeta, DISPOSAL_ITEM_STATUS, DISPOSAL_NOTE_STATUS } from './DisposalNoteStatus';
import { extractErrorMessage } from '../../utils/Validation';
import ScanPalletModal from '../../components/GoodsIssueNoteComponents/ScanPalletModal';
import { usePermissions } from '../../hooks/usePermissions';
import RePickModal from '../../components/GoodsIssueNoteComponents/RePickModal';
import RePickMultipleModal from '../../components/GoodsIssueNoteComponents/RePickMultipleModal';
import PickAllocationsTableStaff from '../../components/DisposalNoteComponents/PickAllocationsTableStaff';
import PickAllocationsTableManager from '../../components/DisposalNoteComponents/PickAllocationsTableManager';
import { ComponentIcon } from '../../components/IconComponent/Icon';

const DisposalNoteDetail = () => {
    const { id } = useParams(); // id là disposalRequestId
    const navigate = useNavigate();
    const { isWarehouseStaff, isWarehouseManager } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [disposalNote, setDisposalNote] = useState(null);
    const [error, setError] = useState(null);

    console.log("====:", disposalNote)
    // Get current user info from localStorage - useMemo to recalculate when needed
    const currentUserInfo = useMemo(() => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            return {
                userId: userInfo?.userId || userInfo?.id || null,
                fullName: userInfo?.fullName || userInfo?.fullname || userInfo?.name || null,
                userName: userInfo?.userName || userInfo?.username || null
            };
        } catch {
            return { userId: null, fullName: null, userName: null };
        }
    }, []);

    // Check if current user is assigned to this disposal request (AssignTo) - compare by name since backend doesn't return AssignTo ID
    const isAssigned = useMemo(() => {
        if (!disposalNote || !currentUserInfo) {
            return false;
        }

        // Check AssignToName (người được phân công) - DisposalNote có thể không có assignToName
        // Nếu không có assignToName, thì tất cả Warehouse Staff đều có thể xem
        const assignToName = disposalNote.assignToName || '';
        if (!assignToName) return true; // Nếu không có assignToName, cho phép tất cả staff

        const currentFullName = currentUserInfo.fullName || '';
        const currentUserName = currentUserInfo.userName || '';

        // Compare by full name (case-insensitive)
        const isMatch = assignToName.toLowerCase().trim() === currentFullName.toLowerCase().trim() ||
            assignToName.toLowerCase().trim() === currentUserName.toLowerCase().trim();

        return isMatch;
    }, [disposalNote, currentUserInfo]);

    const [expandedItems, setExpandedItems] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [confirmingPickId, setConfirmingPickId] = useState(null);
    const detailCardRefs = useRef({});
    const [showScanModal, setShowScanModal] = useState(false);
    const [pickDetailData, setPickDetailData] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [highlightedPickAllocationId, setHighlightedPickAllocationId] = useState(null);
    const [highlightedDetailId, setHighlightedDetailId] = useState(null);
    const [searchCode, setSearchCode] = useState('');
    const [searchError, setSearchError] = useState('');
    const [searching, setSearching] = useState(false);
    const searchTimeoutRef = useRef(null);

    // Modals for actions
    const [showRePickModal, setShowRePickModal] = useState(false);
    const [showRePickMultipleModal, setShowRePickMultipleModal] = useState(false);
    const [selectedItemForRePick, setSelectedItemForRePick] = useState(null);
    const [selectedDetailsForRePick, setSelectedDetailsForRePick] = useState([]);
    const [rejectReasons, setRejectReasons] = useState({});
    const [rePickLoading, setRePickLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [approveLoading, setApproveLoading] = useState(false);


    useEffect(() => {
        fetchDisposalNoteDetail();
    }, [id]);

    // Cleanup timeout khi unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Cleanup timeout khi unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const fetchDisposalNoteDetail = async (preserveExpandedState = false) => {
        setLoading(true);
        try {
            const response = await getDetailDisposalNote(id);

            if (response && response.success && response.data) {
                // Nếu cần giữ lại trạng thái mở, lưu lại danh sách các detailId đang mở
                let expandedDetailIds = new Set();
                if (preserveExpandedState && disposalNote?.disposalNoteDetails) {
                    disposalNote.disposalNoteDetails.forEach((detail, idx) => {
                        if (expandedItems[idx]) {
                            expandedDetailIds.add(detail.disposalNoteDetailId);
                        }
                    });
                }

                setDisposalNote(response.data);

                // Nếu cần giữ lại trạng thái, khôi phục lại các item đã mở dựa trên detailId
                if (preserveExpandedState && expandedDetailIds.size > 0) {
                    setExpandedItems(prev => {
                        const newExpanded = {};
                        response.data.disposalNoteDetails?.forEach((detail, idx) => {
                            if (expandedDetailIds.has(detail.disposalNoteDetailId)) {
                                newExpanded[idx] = true;
                            }
                        });
                        return newExpanded;
                    });
                } else if (!preserveExpandedState) {
                    // Chỉ reset khi không cần giữ lại trạng thái
                    setExpandedItems({});
                }
            } else {
                setError('Không tìm thấy phiếu xuất hủy cho yêu cầu này');
            }
        } catch (err) {
            console.error('Error fetching disposal note detail:', err);
            setError(`Có lỗi xảy ra: ${err.response?.data?.message || err.message || 'Không tìm thấy phiếu xuất hủy'}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleItemExpanded = (index) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleProceedPick = async (pickAllocationId) => {
        try {
            setConfirmingPickId(pickAllocationId);

            // Get pick allocation detail
            const pickDetailResponse = await getPickAllocationDetail(pickAllocationId);
            if (!pickDetailResponse || !pickDetailResponse.success || !pickDetailResponse.data) {
                throw new Error('Không thể lấy thông tin phân bổ lấy hàng');
            }

            const pickDetail = pickDetailResponse.data;
            setPickDetailData(pickDetail);
            setShowScanModal(true);
        } catch (error) {
            console.error('Error getting pick allocation detail:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi lấy thông tin phân bổ lấy hàng', 'error');
            }
        } finally {
            setConfirmingPickId(null);
        }
    };

    const handleConfirmPick = async (palletId) => {
        if (!palletId || !pickDetailData) return;

        try {
            setIsConfirming(true);

            const confirmData = {
                pickAllocationId: pickDetailData.pickAllocationId,
                palletId: palletId
            };

            await confirmPickAllocation(confirmData);

            if (window.showToast) {
                window.showToast('Xác nhận lấy hàng thành công!', 'success');
            }

            setShowScanModal(false);
            setPickDetailData(null);
            // Bỏ highlight sau khi quét thành công
            setHighlightedPickAllocationId(null);
            setHighlightedDetailId(null);

            // Refresh the disposal note to get updated status, nhưng giữ lại trạng thái mở của các card
            await fetchDisposalNoteDetail(true);
        } catch (error) {
            console.error('Error confirming pick:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi xác nhận lấy hàng', 'error');
            }
        } finally {
            setIsConfirming(false);
        }
    };

    const handleCloseModal = () => {
        setShowScanModal(false);
        setPickDetailData(null);
        // Bỏ highlight sau khi đóng modal
        setHighlightedPickAllocationId(null);
        setHighlightedDetailId(null);
    };

    // Thu thập tất cả pick allocations từ nhóm items
    const getAllPickAllocationsFromItems = (items) => {
        const allPickAllocations = [];
        items.forEach(detail => {
            if (detail.pickAllocations && detail.pickAllocations.length > 0) {
                allPickAllocations.push(...detail.pickAllocations);
            }
        });
        return allPickAllocations;
    };

    // Tìm trong TẤT CẢ items của phiếu, không chỉ nhóm hiện tại
    const handleSearch = async (searchValue) => {
        if (!searchValue || !searchValue.trim()) {
            setSearchError('');
            setHighlightedPickAllocationId(null);
            setHighlightedDetailId(null);
            setSearching(false);
            return;
        }

        if (!disposalNote || !disposalNote.disposalNoteDetails) {
            setSearchError('Không có dữ liệu để tìm kiếm');
            setSearching(false);
            return;
        }

        setSearching(true);
        setSearchError('');

        try {
            const trimmedValue = searchValue.trim();
            // Tìm trong TẤT CẢ items của phiếu, không chỉ nhóm hiện tại
            const allItems = disposalNote.disposalNoteDetails;
            const allPickAllocations = getAllPickAllocationsFromItems(allItems);

            // Bước 1: Tìm theo locationCode trước (nhanh hơn, không cần API)
            let foundPickAllocation = allPickAllocations.find(
                pick => pick.locationCode &&
                    pick.locationCode.trim().toLowerCase() === trimmedValue.toLowerCase()
            );

            // Bước 2: Nếu không tìm thấy theo locationCode, tìm theo palletId (cần gọi API)
            if (!foundPickAllocation) {
                for (const pick of allPickAllocations) {
                    try {
                        const response = await getPickAllocationDetail(pick.pickAllocationId);
                        if (response && response.success && response.data) {
                            const pickDetail = response.data;
                            if (pickDetail.palletId &&
                                pickDetail.palletId.trim().toLowerCase() === trimmedValue.toLowerCase()) {
                                foundPickAllocation = pick;
                                break;
                            }
                        }
                    } catch (error) {
                        // Bỏ qua lỗi và tiếp tục tìm
                        console.error(`Error checking pick allocation ${pick.pickAllocationId}:`, error);
                    }
                }
            }

            if (!foundPickAllocation) {
                setSearchError('Không tìm thấy vị trí hoặc pallet này');
                setHighlightedPickAllocationId(null);
                setHighlightedDetailId(null);
                return;
            }

            // Tìm detail chứa pick allocation này trong TẤT CẢ items
            const foundDetail = allItems.find(detail =>
                detail.pickAllocations &&
                detail.pickAllocations.some(p => p.pickAllocationId === foundPickAllocation.pickAllocationId)
            );

            if (!foundDetail) {
                setSearchError('Không tìm thấy sản phẩm chứa vị trí/pallet này');
                setHighlightedPickAllocationId(null);
                setHighlightedDetailId(null);
                return;
            }

            // Clear error và highlight
            setSearchError('');
            setHighlightedPickAllocationId(foundPickAllocation.pickAllocationId);
            setHighlightedDetailId(foundDetail.disposalNoteDetailId);

            // Tự động mở nhóm (status group) nếu đang đóng
            const detailStatus = foundDetail.status;
            if (expandedGroups[detailStatus] === false) {
                setExpandedGroups(prev => ({
                    ...prev,
                    [detailStatus]: true
                }));
            }

            // Tự động mở card detail nếu chưa mở
            const globalIndex = disposalNote.disposalNoteDetails.indexOf(foundDetail);
            if (globalIndex !== -1 && !expandedItems[globalIndex]) {
                setExpandedItems(prev => ({
                    ...prev,
                    [globalIndex]: true
                }));
            }

            // Scroll đến card detail sau khi mở nhóm và card (tăng timeout để đợi DOM update)
            setTimeout(() => {
                const cardElement = detailCardRefs.current[foundDetail.disposalNoteDetailId];
                if (cardElement) {
                    cardElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 500);

            // Tự động bỏ highlight sau 5 giây
            setTimeout(() => {
                setHighlightedPickAllocationId(null);
                setHighlightedDetailId(null);
            }, 5000);
        } finally {
            setSearching(false);
        }
    };

    // Helper function to add icons to status info
    const getStatusInfoWithIcon = (status) => {
        const statusInfo = getDisposalNoteStatusMeta(status);
        let icon;
        switch (status) {
            case 1:
                icon = <Clock className="h-4 w-4" />;
                break;
            case 2:
                icon = <AlertCircle className="h-4 w-4" />;
                break;
            case 3:
                icon = <CheckCircle className="h-4 w-4" />;
                break;
            default:
                icon = <Clock className="h-4 w-4" />;
        }
        return { ...statusInfo, icon };
    };

    // Calculate progress for each item
    const calculateItemProgress = (detail) => {
        if (!detail.pickAllocations || detail.pickAllocations.length === 0) {
            return { picked: 0, total: detail.requiredPackageQuantity || 0, totalQuantity: detail.requiredPackageQuantity || 0 };
        }

        const picked = detail.pickAllocations.filter(p => p.status === 2).length;
        const total = detail.pickAllocations.length;
        const totalQuantity = detail.pickAllocations.reduce((sum, p) => sum + (p.pickPackageQuantity || 0), 0);
        const pickedQuantity = detail.pickAllocations
            .filter(p => p.status === 2)
            .reduce((sum, p) => sum + (p.pickPackageQuantity || 0), 0);

        return { picked, total, totalQuantity, pickedQuantity };
    };

    const handleRefresh = async () => {
        await fetchDisposalNoteDetail();
        if (window.showToast) {
            window.showToast('Đã làm mới dữ liệu', 'success');
        }
    };

    // Handle Submit - Chỉ Warehouse Staff
    const handleSubmit = async () => {
        if (!disposalNote) return;

        try {
            setSubmitLoading(true);
            const response = await submitDisposalNote(disposalNote.disposalNoteId);

            if (response && response.success) {
                if (window.showToast) {
                    window.showToast('Nộp phiếu xuất hủy thành công!', 'success');
                }
                await fetchDisposalNoteDetail();
            }
        } catch (error) {
            console.error('Error submitting disposal note:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi nộp phiếu xuất hủy', 'error');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    // Handle Approve - Chỉ Warehouse Manager
    const handleApprove = async () => {
        if (!disposalNote) return;

        try {
            setApproveLoading(true);
            const response = await approveDisposalNote(disposalNote.disposalNoteId);

            if (response && response.success) {
                if (window.showToast) {
                    window.showToast('Duyệt phiếu xuất hủy thành công!', 'success');
                }
                await fetchDisposalNoteDetail();
            }
        } catch (error) {
            console.error('Error approving disposal note:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi duyệt phiếu xuất hủy', 'error');
            }
        } finally {
            setApproveLoading(false);
        }
    };

    // Handle RePick - Warehouse Staff dùng single endpoint
    const handleRePick = (detail) => {
        setSelectedItemForRePick(detail);
        setShowRePickModal(true);
    };

    const handleConfirmRePick = async (rejectionReason) => {
        if (!selectedItemForRePick) return;

        try {
            setRePickLoading(true);
            // Warehouse Staff: single item endpoint
            const response = await rePickDisposalNoteDetail({
                disposalNoteDetailId: selectedItemForRePick.disposalNoteDetailId,
                rejectionReason: rejectionReason || ''
            });

            if (response && response.success) {
                if (window.showToast) {
                    window.showToast('Yêu cầu lấy lại thành công!', 'success');
                }
                setShowRePickModal(false);
                setSelectedItemForRePick(null);
                // Giữ lại trạng thái mở của các card sau khi lấy lại
                await fetchDisposalNoteDetail(true);
            }
        } catch (error) {
            console.error('Error re-picking:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi lấy lại hàng', 'error');
            }
        } finally {
            setRePickLoading(false);
        }
    };

    const handleCloseRePickModal = () => {
        setShowRePickModal(false);
        setSelectedItemForRePick(null);
    };

    // Xử lý chọn/bỏ chọn detail để lấy lại (cho Manager - nhiều items)
    const handleSelectDetailForRePick = (detail, checked) => {
        if (checked) {
            setSelectedDetailsForRePick(prev => [...prev, detail]);
        } else {
            setSelectedDetailsForRePick(prev => prev.filter(d => d.disposalNoteDetailId !== detail.disposalNoteDetailId));
            // Xóa lý do khi bỏ chọn
            setRejectReasons(prev => {
                const newReasons = { ...prev };
                delete newReasons[detail.disposalNoteDetailId];
                return newReasons;
            });
        }
    };

    // Kiểm tra xem detail có được chọn không
    const isDetailSelectedForRePick = (detailId) => {
        return selectedDetailsForRePick.some(d => d.disposalNoteDetailId === detailId);
    };

    // Xử lý chọn tất cả details để lấy lại (chỉ áp dụng cho quản lý kho)
    const handleSelectAllForRePick = (checked, items) => {
        if (checked) {
            // Chỉ chọn các details có status PendingApproval
            const rejectableDetails = items.filter(d => d.status === DISPOSAL_ITEM_STATUS.PendingApproval);
            setSelectedDetailsForRePick(rejectableDetails);
            const initialReasons = {};
            rejectableDetails.forEach(detail => {
                initialReasons[detail.disposalNoteDetailId] = "";
            });
            setRejectReasons(initialReasons);
        } else {
            setSelectedDetailsForRePick([]);
            setRejectReasons({});
        }
    };

    // Mở modal lấy lại với danh sách details đã chọn
    const openRePickMultipleModal = () => {
        if (selectedDetailsForRePick.length === 0) {
            if (window.showToast) {
                window.showToast("Vui lòng chọn ít nhất một mặt hàng để lấy lại", "warning");
            }
            return;
        }
        // Khởi tạo rejectReasons cho các details đã chọn
        const initialReasons = {};
        selectedDetailsForRePick.forEach(detail => {
            initialReasons[detail.disposalNoteDetailId] = "";
        });
        setRejectReasons(initialReasons);
        setShowRePickMultipleModal(true);
    };

    // Xử lý lấy lại nhiều items - Chỉ Warehouse Manager
    const handleConfirmRePickMultiple = async () => {
        if (selectedDetailsForRePick.length === 0) return;

        // Validate: Manager phải có lý do cho tất cả items
        const missingReasons = selectedDetailsForRePick.filter(detail =>
            !rejectReasons[detail.disposalNoteDetailId] ||
            rejectReasons[detail.disposalNoteDetailId].trim() === ""
        );

        if (missingReasons.length > 0) {
            if (window.showToast) {
                window.showToast("Quản lý kho phải cung cấp lý do cho tất cả mặt hàng lấy lại", "error");
            }
            return;
        }

        try {
            setRePickLoading(true);
            // Tạo danh sách re-pick từ selectedDetailsForRePick và rejectReasons
            const rePickList = selectedDetailsForRePick.map(detail => ({
                disposalNoteDetailId: detail.disposalNoteDetailId,
                rejectionReason: rejectReasons[detail.disposalNoteDetailId] || ""
            }));

            const response = await rePickDisposalNoteDetailList(rePickList);

            if (response && response.success) {
                if (window.showToast) {
                    window.showToast('Yêu cầu lấy lại thành công!', 'success');
                }
                setShowRePickMultipleModal(false);
                setSelectedDetailsForRePick([]);
                setRejectReasons({});
                // Giữ lại trạng thái mở của các card sau khi lấy lại nhiều items
                await fetchDisposalNoteDetail(true);
            }
        } catch (error) {
            console.error('Error re-picking multiple:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi lấy lại hàng', 'error');
            }
        } finally {
            setRePickLoading(false);
        }
    };

    // Render status group card
    const renderStatusGroupCard = (statusCode, title, icon, iconBgColor, items) => {
        if (!items || items.length === 0) return null;

        const isGroupExpanded = expandedGroups[statusCode] ?? true; // mặc định mở
        const toggleGroupExpanded = () => {
            setExpandedGroups(prev => ({
                ...prev,
                [statusCode]: !isGroupExpanded
            }));
        };

        return (
            <Card key={statusCode} className="w-full bg-white border border-gray-200 shadow-sm">
                <div className="p-6">
                    {/* Header group (clickable để thu gọn/mở rộng) */}
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center gap-3 cursor-pointer select-none hover:bg-gray-50 rounded-lg px-3 py-2 transition flex-1"
                            onClick={toggleGroupExpanded}
                        >
                            <div className={`p-2 ${iconBgColor} rounded-lg flex items-center justify-center`}>
                                {icon}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-lg font-semibold text-gray-900 leading-none">{title}</h2>
                                <span className="text-sm text-gray-500 leading-none">({items.length} sản phẩm)</span>
                            </div>
                            <div className="text-gray-500 ml-auto">
                                {isGroupExpanded ? (
                                    <ChevronUp className="w-5 h-5" />
                                ) : (
                                    <ChevronDown className="w-5 h-5" />
                                )}
                            </div>
                        </div>
                        {/* Các nút hành động ở header nhóm */}
                        <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                            {/* Search bar tìm kiếm vị trí hoặc pallet - chỉ hiển thị cho Warehouse Staff, nhóm "Đang lấy hàng" */}
                            {isWarehouseStaff &&
                                statusCode === DISPOSAL_ITEM_STATUS.Picking && (
                                    <div className="flex flex-col bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Barcode className="w-4 h-4 text-gray-600" />
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={searchCode}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setSearchCode(value);
                                                        setSearchError('');

                                                        // Clear timeout cũ
                                                        if (searchTimeoutRef.current) {
                                                            clearTimeout(searchTimeoutRef.current);
                                                        }

                                                        const trimmedValue = value.trim();
                                                        if (!trimmedValue) {
                                                            setHighlightedPickAllocationId(null);
                                                            setHighlightedDetailId(null);
                                                            setSearching(false);
                                                            return;
                                                        }

                                                        // Debounce 500ms cho tìm kiếm
                                                        setSearching(true);
                                                        searchTimeoutRef.current = setTimeout(async () => {
                                                            await handleSearch(trimmedValue);
                                                        }, 500);
                                                    }}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && searchCode.trim()) {
                                                            // Clear timeout nếu đang debounce
                                                            if (searchTimeoutRef.current) {
                                                                clearTimeout(searchTimeoutRef.current);
                                                            }
                                                            await handleSearch(searchCode.trim());
                                                        }
                                                    }}
                                                    placeholder="Quét mã vị trí hoặc pallet nhanh"
                                                    className="w-64 px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                {searchCode && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSearchCode('');
                                                            setSearchError('');
                                                            setHighlightedPickAllocationId(null);
                                                            setHighlightedDetailId(null);
                                                            setSearching(false);
                                                            if (searchTimeoutRef.current) {
                                                                clearTimeout(searchTimeoutRef.current);
                                                            }
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-gray-500" />
                                                    </button>
                                                )}
                                            </div>
                                            {searching && (
                                                <RefreshCw className="w-4 h-4 text-gray-600 animate-spin" />
                                            )}
                                        </div>
                                        {searchError && (
                                            <span className="text-xs text-red-600 mt-1">{searchError}</span>
                                        )}
                                    </div>
                                )}
                            {/* Nút "Lấy lại" nhiều - chỉ hiển thị cho quản lý kho, nhóm "Chờ duyệt" và khi phiếu KHÔNG ở trạng thái "Đang lấy hàng" */}
                            {isWarehouseManager &&
                                statusCode === DISPOSAL_ITEM_STATUS.PendingApproval &&
                                disposalNote.status !== DISPOSAL_NOTE_STATUS.Picking && (
                                    <Button
                                        onClick={openRePickMultipleModal}
                                        className="h-[38px] px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={selectedDetailsForRePick.length === 0}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Lấy lại ({selectedDetailsForRePick.length})
                                    </Button>
                                )}
                        </div>
                    </div>

                    {/* Nội dung nhóm (ẩn/hiện theo state) */}
                    {isGroupExpanded && (
                        <div className="mt-4 space-y-4">
                            {/* Checkbox "Chọn tất cả" - chỉ cho Manager, nhóm "Chờ duyệt" và khi phiếu KHÔNG ở trạng thái "Đang lấy hàng" */}
                            {isWarehouseManager &&
                                statusCode === DISPOSAL_ITEM_STATUS.PendingApproval &&
                                disposalNote.status !== DISPOSAL_NOTE_STATUS.Picking &&
                                items.length > 0 && (
                                    <div className="flex items-center gap-2 mb-2 px-2">
                                        <input
                                            type="checkbox"
                                            checked={items.filter(d => d.status === DISPOSAL_ITEM_STATUS.PendingApproval).length > 0 &&
                                                selectedDetailsForRePick.length === items.filter(d => d.status === DISPOSAL_ITEM_STATUS.PendingApproval).length}
                                            onChange={(e) => handleSelectAllForRePick(e.target.checked, items)}
                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                        />
                                        <label className="text-sm text-gray-700 cursor-pointer">
                                            Chọn tất cả ({items.filter(d => d.status === DISPOSAL_ITEM_STATUS.PendingApproval).length} mặt hàng)
                                        </label>
                                    </div>
                                )}
                            {items.map((detail, index) => {
                                const detailStatusInfo = getDisposalItemStatusMeta(detail.status);
                                const progress = calculateItemProgress(detail);
                                const globalIndex = disposalNote.disposalNoteDetails.indexOf(detail);
                                const isExpanded = expandedItems[globalIndex];
                                const isSelected = isDetailSelectedForRePick(detail.disposalNoteDetailId);
                                const isDetailHighlighted = highlightedDetailId === detail.disposalNoteDetailId;

                                // Tính toán thông tin pick allocations cho Manager
                                const pickAllocations = detail.pickAllocations || [];
                                const hasPickAllocations = pickAllocations.length > 0;
                                const pickProgress = hasPickAllocations ? {
                                    picked: pickAllocations.filter(p => p.status === 2).length,
                                    total: pickAllocations.length,
                                    totalQuantity: pickAllocations.reduce((sum, p) => sum + (p.pickPackageQuantity || 0), 0),
                                    pickedQuantity: pickAllocations.filter(p => p.status === 2).reduce((sum, p) => sum + (p.pickPackageQuantity || 0), 0)
                                } : null;

                                return (
                                    <div
                                        key={detail.disposalNoteDetailId}
                                        ref={(el) => {
                                            if (el) {
                                                detailCardRefs.current[detail.disposalNoteDetailId] = el;
                                            }
                                        }}
                                        className={`border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 ${isDetailHighlighted
                                            ? 'border-yellow-400 border-2 shadow-lg bg-yellow-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        {/* Header sản phẩm - Compact và tích hợp thông tin pick allocations */}
                                        <div
                                            className="bg-white px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                                            onClick={() => toggleItemExpanded(globalIndex)}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {/* Checkbox - chỉ cho Manager, nhóm "Chờ duyệt" và khi phiếu KHÔNG ở trạng thái "Đang lấy hàng" */}
                                                    {isWarehouseManager &&
                                                        statusCode === DISPOSAL_ITEM_STATUS.PendingApproval &&
                                                        disposalNote.status !== DISPOSAL_NOTE_STATUS.Picking && (
                                                            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={(e) => handleSelectDetailForRePick(detail, e.target.checked)}
                                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                                />
                                                            </div>
                                                        )}

                                                    {/* Badge highlight khi được tìm thấy */}
                                                    {isDetailHighlighted && (
                                                        <div className="flex-shrink-0 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-md text-xs font-semibold">
                                                            Đã tìm thấy
                                                        </div>
                                                    )}

                                                    {/* Expand/Collapse icon */}
                                                    <div className="flex-shrink-0 p-1.5 bg-gray-100 rounded">
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-gray-600" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-gray-600" />
                                                        )}
                                                    </div>

                                                    {/* Thông tin sản phẩm */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className="text-base font-semibold text-gray-900 truncate">
                                                                {detail.goodsName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ({detail.goodsCode})
                                                            </div>
                                                            {/* Badge trạng thái */}
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${detailStatusInfo.color}`}>
                                                                {detailStatusInfo.label}
                                                            </span>
                                                        </div>

                                                        {/* Thông tin pick allocations - tích hợp vào header cho Manager */}
                                                        {isWarehouseManager && hasPickAllocations && pickProgress && (
                                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                                    <Package className="w-3.5 h-3.5" />
                                                                    <span>
                                                                        {pickProgress.pickedQuantity}/{pickProgress.totalQuantity} thùng
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                                    <CheckCircle className={`w-3.5 h-3.5 ${pickProgress.picked === pickProgress.total ? 'text-green-600' : 'text-gray-400'}`} />
                                                                    <span>
                                                                        {pickProgress.picked}/{pickProgress.total} vị trí
                                                                    </span>
                                                                </div>
                                                                {/* Progress bar nhỏ */}
                                                                {pickProgress.total > 0 && (
                                                                    <div className="flex-1 max-w-[120px] bg-gray-200 rounded-full h-1.5">
                                                                        <div
                                                                            className={`h-1.5 rounded-full transition-all ${pickProgress.picked === pickProgress.total ? 'bg-green-600' : 'bg-blue-600'
                                                                                }`}
                                                                            style={{ width: `${Math.round((pickProgress.picked / pickProgress.total) * 100)}%` }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Thông tin cho Staff */}
                                                        {!isWarehouseManager && (
                                                            <div className="text-sm text-gray-600 mt-1">
                                                                {progress.picked}/{progress.total} vị trí
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bên phải: Số lượng và actions */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-500">Tổng số lượng</div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {detail.requiredPackageQuantity} thùng
                                                        </div>
                                                    </div>

                                                    {/* RePick Button - Chỉ cho Warehouse Staff */}
                                                    {isWarehouseStaff &&
                                                        detail.status === DISPOSAL_ITEM_STATUS.Picked &&
                                                        isAssigned && (
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRePick(detail);
                                                                }}
                                                                className="flex items-center gap-2 h-8 bg-red-600 hover:bg-red-700 text-white shadow-sm rounded-lg px-3 text-sm"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5" />
                                                                Lấy lại
                                                            </Button>
                                                        )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chi tiết pickAllocations - Chỉ hiển thị khi expanded */}
                                        {isExpanded && (
                                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                                {/* Lý do từ chối/yêu cầu lấy lại */}
                                                {detail.rejectionReason && (
                                                    <div className="flex items-center gap-2 text-red-600 pb-3 mb-3 border-b border-red-200">
                                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                        <span className="text-sm">
                                                            <span className="font-semibold">Lý do lấy lại: </span>
                                                            <span className="italic">{detail.rejectionReason}</span>
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Warehouse Staff: Hiển thị bảng chi tiết đầy đủ */}
                                                {!isWarehouseManager ? (
                                                    <PickAllocationsTableStaff
                                                        pickAllocations={detail.pickAllocations}
                                                        statusCode={statusCode}
                                                        onProceedPick={handleProceedPick}
                                                        confirmingPickId={confirmingPickId}
                                                        isWarehouseStaff={isWarehouseStaff}
                                                        disposalNoteStatus={disposalNote.status}
                                                        highlightedPickAllocationId={highlightedPickAllocationId}
                                                    />
                                                ) : (
                                                    /* Warehouse Manager: Hiển thị bảng chi tiết (đã compact) */
                                                    <PickAllocationsTableManager
                                                        pickAllocations={detail.pickAllocations}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>
        );
    };


    if (loading) {
        return <Loading />;
    }

    if (error || !disposalNote) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi</h3>
                        <p className="text-gray-600 mb-4">{error || 'Không tìm thấy phiếu xuất hủy'}</p>
                        <Button onClick={() => navigate('/disposal')} variant="outline">
                            <ComponentIcon name="arrowBackCircleOutline" size={28} />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusInfo = getStatusInfoWithIcon(disposalNote.status);
    const totalItems = disposalNote.disposalNoteDetails?.length || 0;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div>
                <div className="max-w-7xl mx-auto px-6 py-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                        {/* Bên trái: Tiêu đề và nút quay lại */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/disposal')}
                                className="text-slate-600 hover:bg-slate-50"
                            >
                                <ComponentIcon name="arrowBackCircleOutline" size={28} />
                            </Button>

                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900 m-0">PHIẾU XUẤT HỦY</h1>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-sm font-medium ${statusInfo.color}`}
                                >
                                    {statusInfo.icon}
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>

                        {/* Bên phải: Các nút hành động */}
                        <div className="flex items-center gap-3">
                            {/* Nút làm mới */}
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                className="text-gray-600 hover:text-gray-900 flex items-center h-9 px-3 rounded-lg border-gray-300"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Làm mới
                            </Button>

                            {/* Nút In phiếu */}
                            <Button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-3"
                            >
                                <Printer className="w-4 h-4" />
                                In Phiếu
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-6">
                <div className="space-y-6">
                    {/* Thông tin chung */}
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Thông tin phiếu xuất hủy</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {/* Nhóm thông tin xử lý */}
                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-gray-100 pb-2">
                                        Thông tin xử lý
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500">Mã yêu cầu xuất hủy</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {disposalNote.disposalRequestId || "N/A"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Người tạo</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {disposalNote.createdByName || "N/A"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Người duyệt</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {disposalNote.approvalByName || "Chưa có"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Ngày dự kiến xuất hủy</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {disposalNote.estimatedTimeDeparture
                                                    ? new Date(
                                                        disposalNote.estimatedTimeDeparture
                                                    ).toLocaleDateString("vi-VN", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })
                                                    : "N/A"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Ngày tạo</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {disposalNote.createdAt
                                                    ? new Date(disposalNote.createdAt).toLocaleString("vi-VN", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nhóm thông tin yêu cầu xuất hủy */}
                                {/* <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-gray-100 pb-2">
                                        Thông tin yêu cầu xuất hủy
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                        <div className="sm:col-span-2">
                                            <div className="text-xs text-gray-500">Mã yêu cầu xuất hủy</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {disposalNote.disposalRequestId || "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </Card>

                    {/* Status Groups */}
                    {disposalNote.disposalNoteDetails && disposalNote.disposalNoteDetails.length > 0 && (
                        <>
                            {/* Picking - Status 1 */}
                            {renderStatusGroupCard(
                                DISPOSAL_ITEM_STATUS.Picking,
                                'Đang lấy hàng',
                                <Barcode className="w-5 h-5 text-orange-600" />,
                                'bg-orange-100',
                                disposalNote.disposalNoteDetails.filter(d => d.status === DISPOSAL_ITEM_STATUS.Picking)
                            )}

                            {/* Picked - Status 2 */}
                            {renderStatusGroupCard(
                                DISPOSAL_ITEM_STATUS.Picked,
                                'Đã lấy hàng',
                                <CheckCircle className="w-5 h-5 text-blue-600" />,
                                'bg-blue-100',
                                disposalNote.disposalNoteDetails.filter(d => d.status === DISPOSAL_ITEM_STATUS.Picked)
                            )}

                            {/* Pending Approval - Status 3 */}
                            {renderStatusGroupCard(
                                DISPOSAL_ITEM_STATUS.PendingApproval,
                                'Chờ duyệt',
                                <AlertCircle className="w-5 h-5 text-yellow-600" />,
                                'bg-yellow-100',
                                disposalNote.disposalNoteDetails.filter(d => d.status === DISPOSAL_ITEM_STATUS.PendingApproval)
                            )}

                            {/* Completed - Status 4 */}
                            {renderStatusGroupCard(
                                DISPOSAL_ITEM_STATUS.Completed,
                                'Hoàn thành',
                                <CheckCircle className="w-5 h-5 text-green-600" />,
                                'bg-green-100',
                                disposalNote.disposalNoteDetails.filter(d => d.status === DISPOSAL_ITEM_STATUS.Completed)
                            )}
                        </>
                    )}

                    {/* Actions Card - Nộp phiếu và Duyệt phiếu */}
                    {(() => {
                        // Submit: Warehouse Staff, status Picking, không còn items đang picking, và phải là người được phân công
                        const canShowSubmitButton = isWarehouseStaff &&
                            disposalNote.status === DISPOSAL_NOTE_STATUS.Picking &&
                            !disposalNote.disposalNoteDetails.some(
                                (d) => d.status === DISPOSAL_ITEM_STATUS.Picking
                            ) &&
                            isAssigned;

                        // Approve: Warehouse Manager, status PendingApproval
                        const canShowApproveButton = isWarehouseManager &&
                            disposalNote.status === DISPOSAL_NOTE_STATUS.PendingApproval;

                        if (!canShowSubmitButton && !canShowApproveButton) {
                            return null;
                        }

                        return (
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <div className="p-6">
                                    <div className="flex justify-end gap-3">
                                        {/* Nút Nộp phiếu - Chỉ Warehouse Staff và phải là người được phân công */}
                                        {canShowSubmitButton && (
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={submitLoading}
                                                className="flex items-center gap-2 h-[42px] px-6 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                                            >
                                                {submitLoading ? (
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                                Nộp phiếu
                                            </Button>
                                        )}

                                        {/* Nút Duyệt phiếu - Chỉ Warehouse Manager */}
                                        {canShowApproveButton && (
                                            <Button
                                                onClick={handleApprove}
                                                disabled={approveLoading}
                                                className="flex items-center gap-2 h-[42px] px-6 bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                                            >
                                                {approveLoading ? (
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <ShieldCheck className="w-5 h-5" />
                                                )}
                                                Duyệt phiếu
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })()}
                </div>
            </div>

            {/* Scan Pallet Modal */}
            <ScanPalletModal
                isOpen={showScanModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmPick}
                pickDetailData={pickDetailData}
                loading={isConfirming}
            />

            {/* RePick Modal */}
            <RePickModal
                isOpen={showRePickModal}
                onClose={handleCloseRePickModal}
                onConfirm={handleConfirmRePick}
                itemDetail={selectedItemForRePick}
                loading={rePickLoading}
            />

            {/* RePick Multiple Modal */}
            <RePickMultipleModal
                isOpen={showRePickMultipleModal}
                onCancel={() => {
                    setShowRePickMultipleModal(false);
                    setSelectedDetailsForRePick([]);
                    setRejectReasons({});
                }}
                onConfirm={handleConfirmRePickMultiple}
                selectedDetails={selectedDetailsForRePick}
                rejectReasons={rejectReasons}
                setRejectReasons={setRejectReasons}
                loading={rePickLoading}
            />
        </div>
    );
};

export default DisposalNoteDetail;
