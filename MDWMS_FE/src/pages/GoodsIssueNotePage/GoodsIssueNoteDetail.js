import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Printer, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Barcode, Package, Send, ShieldCheck } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { getDetailGoodsIssueNote, submitGoodsIssueNote, approveGoodsIssueNote, rePickGoodsIssueNoteDetail } from '../../services/GoodsIssueNoteService';
import { getPickAllocationDetail, confirmPickAllocation } from '../../services/PickAllocationService';
import { getGoodsIssueNoteStatusMeta, getIssueItemStatusMeta, getPickAllocationStatusMeta, ISSUE_ITEM_STATUS, GOODS_ISSUE_NOTE_STATUS } from './goodsIssueNoteStatus';
import { extractErrorMessage } from '../../utils/Validation';
import ScanPalletModal from '../../components/GoodsIssueNoteComponents/ScanPalletModal';
import { usePermissions } from '../../hooks/usePermissions';
import RePickModal from '../../components/GoodsIssueNoteComponents/RePickModal';
import PickAllocationsTableStaff from '../../components/GoodsIssueNoteComponents/PickAllocationsTableStaff';
import PickAllocationsTableManager from '../../components/GoodsIssueNoteComponents/PickAllocationsTableManager';
import BackCircleIcon from '../../components/Common/BackCircleIcon';

const GoodsIssueNoteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isWarehouseStaff, isWarehouseManager } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [goodsIssueNote, setGoodsIssueNote] = useState(null);
    const [error, setError] = useState(null);

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

    // Check if current user is assigned to this order (AssignTo) - compare by name since backend doesn't return AssignTo ID
    const isAssigned = useMemo(() => {
        if (!goodsIssueNote || !currentUserInfo) {
            return false;
        }

        // Check AssignToName (người được phân công) 
        const assignToName = goodsIssueNote.assignToName || '';
        const currentFullName = currentUserInfo.fullName || '';
        const currentUserName = currentUserInfo.userName || '';

        // Compare by full name (case-insensitive)
        const isMatch = assignToName.toLowerCase().trim() === currentFullName.toLowerCase().trim() ||
            assignToName.toLowerCase().trim() === currentUserName.toLowerCase().trim();

        return isMatch;
    }, [goodsIssueNote, currentUserInfo]);
    const [expandedItems, setExpandedItems] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [confirmingPickId, setConfirmingPickId] = useState(null);
    const [showScanModal, setShowScanModal] = useState(false);
    const [pickDetailData, setPickDetailData] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    // Modals for actions
    const [showRePickModal, setShowRePickModal] = useState(false);
    const [selectedItemForRePick, setSelectedItemForRePick] = useState(null);
    const [rePickLoading, setRePickLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [approveLoading, setApproveLoading] = useState(false);


    useEffect(() => {
        fetchGoodsIssueNoteDetail();
    }, [id]);

    const fetchGoodsIssueNoteDetail = async () => {
        setLoading(true);
        try {
            const response = await getDetailGoodsIssueNote(id);

            if (response && response.success && response.data) {
                setGoodsIssueNote(response.data);
                // Auto-expand all items by default
                const defaultExpanded = {};
                response.data.goodsIssueNoteDetails?.forEach((detail, idx) => {
                    defaultExpanded[idx] = true;
                });
                setExpandedItems(defaultExpanded);
            } else {
                setError('Không tìm thấy phiếu xuất kho cho đơn hàng này');
            }
        } catch (err) {
            console.error('Error fetching goods issue note detail:', err);
            setError(`Có lỗi xảy ra: ${err.response?.data?.message || err.message || 'Không tìm thấy phiếu xuất kho'}`);
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

            // Refresh the goods issue note to get updated status
            await fetchGoodsIssueNoteDetail();
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
    };

    // Helper function to add icons to status info
    const getStatusInfoWithIcon = (status) => {
        const statusInfo = getGoodsIssueNoteStatusMeta(status);
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
            return { picked: 0, total: detail.requiredPackageQuantity || 0 };
        }

        const picked = detail.pickAllocations.filter(p => p.status === 2).length;
        const total = detail.pickAllocations.length;

        return { picked, total };
    };

    const handleRefresh = async () => {
        await fetchGoodsIssueNoteDetail();
        if (window.showToast) {
            window.showToast('Đã làm mới dữ liệu', 'success');
        }
    };

    // Handle Submit
    const handleSubmit = async () => {
        if (!goodsIssueNote) return;

        try {
            setSubmitLoading(true);
            const response = await submitGoodsIssueNote(goodsIssueNote.goodsIssueNoteId);

            if (response && response.success) {
                if (window.showToast) {
                    window.showToast('Nộp phiếu xuất kho thành công!', 'success');
                }
                await fetchGoodsIssueNoteDetail();
            }
        } catch (error) {
            console.error('Error submitting goods issue note:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi nộp phiếu xuất kho', 'error');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    // Handle Approve
    const handleApprove = async () => {
        if (!goodsIssueNote) return;

        try {
            setApproveLoading(true);
            const response = await approveGoodsIssueNote(goodsIssueNote.goodsIssueNoteId);

            if (response && response.success) {
                if (window.showToast) {
                    window.showToast('Duyệt phiếu xuất kho thành công!', 'success');
                }
                await fetchGoodsIssueNoteDetail();
            }
        } catch (error) {
            console.error('Error approving goods issue note:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi duyệt phiếu xuất kho', 'error');
            }
        } finally {
            setApproveLoading(false);
        }
    };

    // Handle RePick
    const handleRePick = (detail) => {
        setSelectedItemForRePick(detail);
        setShowRePickModal(true);
    };

    const handleConfirmRePick = async (rejectionReason) => {
        if (!selectedItemForRePick) return;

        try {
            setRePickLoading(true);
            const response = await rePickGoodsIssueNoteDetail({
                goodsIssueNoteDetailId: selectedItemForRePick.goodsIssueNoteDetailId,
                rejectionReason: rejectionReason || ''
            });

            if (response && response.success) {
                if (window.showToast) {
                    window.showToast('Yêu cầu lấy lại thành công!', 'success');
                }
                setShowRePickModal(false);
                setSelectedItemForRePick(null);
                await fetchGoodsIssueNoteDetail();
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
            <Card key={statusCode} className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6">
                    {/* Header group (clickable để thu gọn/mở rộng) */}
                    <div
                        className="flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 rounded-lg px-3 py-2 transition"
                        onClick={toggleGroupExpanded}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 ${iconBgColor} rounded-lg flex items-center justify-center`}>
                                {icon}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-lg font-semibold text-gray-900 leading-none">{title}</h2>
                                <span className="text-sm text-gray-500 leading-none">({items.length} sản phẩm)</span>
                            </div>
                        </div>
                        <div className="text-gray-500">
                            {isGroupExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </div>
                    </div>

                    {/* Nội dung nhóm (ẩn/hiện theo state) */}
                    {isGroupExpanded && (
                        <div className="mt-4 space-y-4">
                            {items.map((detail, index) => {
                                const detailStatusInfo = getIssueItemStatusMeta(detail.status);
                                const progress = calculateItemProgress(detail);
                                const globalIndex = goodsIssueNote.goodsIssueNoteDetails.indexOf(detail);
                                const isExpanded = expandedItems[globalIndex];

                                return (
                                    <div key={detail.goodsIssueNoteDetailId} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                                        {/* Header sản phẩm */}
                                        <div
                                            className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                                            onClick={() => toggleItemExpanded(globalIndex)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-white rounded-lg">
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-5 w-5 text-blue-600" />
                                                        ) : (
                                                            <ChevronDown className="h-5 w-5 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            {detail.goodsName} ({detail.goodsCode})
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {progress.picked}/{progress.total} • Trạng thái: {detailStatusInfo.label}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-500 mb-1">Tổng số lượng</div>
                                                        <div className="text-base font-semibold text-gray-900">
                                                            {detail.requiredPackageQuantity} thùng
                                                            {detail.unitPerPackage &&
                                                                ` • ${detail.requiredPackageQuantity * detail.unitPerPackage} ${detail.unitPerPackage > 1 ? 'hộp' : 'hộp'
                                                                }`}
                                                        </div>
                                                    </div>
                                                    {/* RePick Button - Phân quyền theo role */}

                                                    {isWarehouseStaff &&
                                                        detail.status === ISSUE_ITEM_STATUS.Picked &&
                                                        isAssigned && (
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRePick(detail);
                                                                }}
                                                                className="flex items-center gap-2 h-9 bg-red-600 hover:bg-red-700 text-white shadow-sm rounded-lg px-3"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                Lấy lại
                                                            </Button>
                                                        )}

                                                    {/* Warehouse Manager button - Không ẩn khi có rejectionReason vì Manager có thể repick để yêu cầu lấy lại */}
                                                    {isWarehouseManager && detail.status === ISSUE_ITEM_STATUS.PendingApproval && (
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRePick(detail);
                                                            }}
                                                            className="flex items-center gap-2 h-9 bg-red-600 hover:bg-red-700 text-white shadow-sm rounded-lg px-3"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                            Lấy lại
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chi tiết pickAllocations */}
                                        {isExpanded && (
                                            <div className="p-6 bg-gray-50 border-t border-gray-200">
                                                {/* Lý do từ chối/yêu cầu lấy lại */}
                                                {detail.rejectionReason && (
                                                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                            <div className="flex-1">
                                                                <div className="text-sm font-semibold text-red-800 mb-1">
                                                                    Lý do yêu cầu lấy lại
                                                                </div>
                                                                <div className="text-sm text-red-700">
                                                                    {detail.rejectionReason}
                                                                </div>
                                                            </div>
                                                        </div>
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
                                                    />
                                                ) : (
                                                    /* Warehouse Manager: Hiển thị UI dạng card đơn giản */
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

    if (error || !goodsIssueNote) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi</h3>
                        <p className="text-gray-600 mb-4">{error || 'Không tìm thấy phiếu xuất kho'}</p>
                        <Button onClick={() => navigate('/sales-orders')} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusInfo = getStatusInfoWithIcon(goodsIssueNote.status);
    const totalItems = goodsIssueNote.goodsIssueNoteDetails?.length || 0;

    return (
        <div className="min-h-screen">
            {/* Header */}
            {/* <p className="text-gray-600 text-sm mt-1">
                Mã phiếu: {goodsIssueNote.goodsIssueNoteId}
            </p> */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Bên trái: Tiêu đề và nút quay lại */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/sales-orders')}
                                className="text-slate-600 hover:bg-slate-50"
                            >
                                <BackCircleIcon size={30} className="mr-2" />
                                {/* Quay lại */}
                            </Button>

                            <div className="flex items-center gap-3"> {/* Đã thay đổi items-baseline thành items-center */}
                                <p className="text-2xl font-bold text-gray-900 !m-0">
                                    PHIẾU XUẤT KHO
                                </p>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-sm font-medium ${statusInfo.color}`}
                                >
                                    {statusInfo.icon}
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>

                        {/* Bên phải: Các nút hành động */}
                        <div className="flex items-center gap-3"> {/* Đã loại bỏ py-1 */}
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
                                <h2 className="text-lg font-semibold text-gray-900">Thông tin phiếu xuất kho</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nhóm thông tin xử lý */}
                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-gray-100 pb-2">
                                        Thông tin xử lý
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500">Người tạo</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {goodsIssueNote.createdByName || "N/A"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Người duyệt</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {goodsIssueNote.approvalByName || "Chưa có"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Ngày tạo</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {goodsIssueNote.createdAt
                                                    ? new Date(goodsIssueNote.createdAt).toLocaleString("vi-VN", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "N/A"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Ngày dự kiến giao</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {goodsIssueNote.estimatedTimeDeparture
                                                    ? new Date(
                                                        goodsIssueNote.estimatedTimeDeparture
                                                    ).toLocaleDateString("vi-VN", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })
                                                    : "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nhóm thông tin nhà bán lẻ */}
                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-gray-100 pb-2">
                                        Thông tin nhà bán lẻ
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500">Tên nhà bán lẻ</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {goodsIssueNote.retailerName || "N/A"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Số điện thoại</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {goodsIssueNote.retailerPhone || "N/A"}
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <div className="text-xs text-gray-500">Địa chỉ</div>
                                            <div className="text-base font-medium text-gray-900">
                                                {goodsIssueNote.retailerAddress || "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Status Groups */}
                    {goodsIssueNote.goodsIssueNoteDetails && goodsIssueNote.goodsIssueNoteDetails.length > 0 && (
                        <>
                            {/* Picking - Status 1 */}
                            {renderStatusGroupCard(
                                ISSUE_ITEM_STATUS.Picking,
                                'Đang lấy hàng',
                                <Barcode className="w-5 h-5 text-orange-600" />,
                                'bg-orange-100',
                                goodsIssueNote.goodsIssueNoteDetails.filter(d => d.status === ISSUE_ITEM_STATUS.Picking)
                            )}

                            {/* Picked - Status 2 */}
                            {renderStatusGroupCard(
                                ISSUE_ITEM_STATUS.Picked,
                                'Đã lấy hàng',
                                <CheckCircle className="w-5 h-5 text-blue-600" />,
                                'bg-blue-100',
                                goodsIssueNote.goodsIssueNoteDetails.filter(d => d.status === ISSUE_ITEM_STATUS.Picked)
                            )}

                            {/* Pending Approval - Status 3 */}
                            {renderStatusGroupCard(
                                ISSUE_ITEM_STATUS.PendingApproval,
                                'Chờ duyệt',
                                <AlertCircle className="w-5 h-5 text-yellow-600" />,
                                'bg-yellow-100',
                                goodsIssueNote.goodsIssueNoteDetails.filter(d => d.status === ISSUE_ITEM_STATUS.PendingApproval)
                            )}

                            {/* Completed - Status 4 */}
                            {renderStatusGroupCard(
                                ISSUE_ITEM_STATUS.Completed,
                                'Hoàn thành',
                                <CheckCircle className="w-5 h-5 text-green-600" />,
                                'bg-green-100',
                                goodsIssueNote.goodsIssueNoteDetails.filter(d => d.status === ISSUE_ITEM_STATUS.Completed)
                            )}
                        </>
                    )}

                    {/* Actions Card - Nộp phiếu và Duyệt phiếu */}
                    {(() => {
                        const canShowSubmitButton = isWarehouseStaff &&
                            goodsIssueNote.status === GOODS_ISSUE_NOTE_STATUS.Picking &&
                            !goodsIssueNote.goodsIssueNoteDetails.some(
                                (d) => d.status === ISSUE_ITEM_STATUS.Picking
                            ) &&
                            isAssigned;

                        const canShowApproveButton = isWarehouseManager &&
                            goodsIssueNote.status === GOODS_ISSUE_NOTE_STATUS.PendingApproval;

                        if (!canShowSubmitButton && !canShowApproveButton) {
                            return null;
                        }

                        return (
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <div className="p-6">
                                    <div className="flex justify-end gap-3">
                                        {/* Nút Nộp phiếu (kho xuất) - Chỉ Warehouse Staff và phải là người được phân công */}
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

                                        {/* Nút Duyệt phiếu (quản lý) */}
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
        </div>
    );
};

export default GoodsIssueNoteDetail;
