import React, { useState, useEffect } from 'react';
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

const GoodsIssueNoteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isWarehouseStaff, isWarehouseManager } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [goodsIssueNote, setGoodsIssueNote] = useState(null);
    const [error, setError] = useState(null);
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
                                                    {/* <span className={`px-3 py-1 rounded-full text-xs font-medium ${detailStatusInfo.color}`}>
                                                        {detailStatusInfo.label}
                                                    </span> */}
                                                    {/* RePick Button - Show for Picked and PendingApproval status */}
                                                    {(detail.status === ISSUE_ITEM_STATUS.Picked || detail.status === ISSUE_ITEM_STATUS.PendingApproval) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRePick(detail);
                                                            }}
                                                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                                        >
                                                            <RefreshCw className="h-3 w-3 mr-1" />
                                                            Lấy lại
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chi tiết pickAllocations */}
                                        {isExpanded && (
                                            <div className="p-6 bg-gray-50 border-t border-gray-200">
                                                {detail.pickAllocations && detail.pickAllocations.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-white">
                                                                    <TableHead className="w-16 text-center font-semibold">STT</TableHead>
                                                                    <TableHead className="font-semibold text-center">Kệ</TableHead>
                                                                    <TableHead className="font-semibold text-center">Hàng</TableHead>
                                                                    <TableHead className="font-semibold text-center">Cột</TableHead>
                                                                    <TableHead className="font-semibold">Khu vực</TableHead>
                                                                    <TableHead className="font-semibold text-left">Mã vị trí</TableHead>
                                                                    <TableHead className="font-semibold text-center">Số lượng</TableHead>
                                                                    <TableHead className="font-semibold text-center">Trạng thái</TableHead>
                                                                    {statusCode !== ISSUE_ITEM_STATUS.Completed && (
                                                                        <TableHead className="font-semibold text-center w-32">Hành động</TableHead>
                                                                    )}
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {detail.pickAllocations.map((pick, pickIndex) => {
                                                                    const pickStatusInfo = getPickAllocationStatusMeta(pick.status);
                                                                    const isPicked = pick.status === 2;

                                                                    return (
                                                                        <TableRow
                                                                            key={pick.pickAllocationId}
                                                                            className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${isPicked ? 'bg-green-50' : ''
                                                                                }`}
                                                                        >
                                                                            <TableCell className="text-center text-gray-900 font-medium">
                                                                                {pickIndex + 1}
                                                                            </TableCell>
                                                                            <TableCell className="text-center text-gray-900 font-semibold">
                                                                                {pick.rack}
                                                                            </TableCell>
                                                                            <TableCell className="text-center text-gray-900 font-semibold">
                                                                                {pick.row}
                                                                            </TableCell>
                                                                            <TableCell className="text-center text-gray-900 font-semibold">
                                                                                {pick.column}
                                                                            </TableCell>
                                                                            <TableCell className="text-gray-900 font-medium">
                                                                                {pick.areaName}
                                                                            </TableCell>
                                                                            <TableCell className="text-gray-700">
                                                                                {pick.locationCode}
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-semibold text-gray-900">
                                                                                {pick.pickPackageQuantity} thùng
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${pickStatusInfo.color}`}>
                                                                                    {pickStatusInfo.label}
                                                                                </span>
                                                                            </TableCell>
                                                                            {statusCode !== ISSUE_ITEM_STATUS.Completed && (
                                                                                <TableCell className="text-center">
                                                                                    {!isPicked && statusCode === ISSUE_ITEM_STATUS.Picking && isWarehouseStaff && (
                                                                                        <Button
                                                                                            onClick={() => handleProceedPick(pick.pickAllocationId)}
                                                                                            disabled={confirmingPickId === pick.pickAllocationId}
                                                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-auto"
                                                                                            size="sm"
                                                                                        >
                                                                                            {confirmingPickId === pick.pickAllocationId ? (
                                                                                                <>
                                                                                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                                                                    Đang xử lý...
                                                                                                </>
                                                                                            ) : (
                                                                                                <>
                                                                                                    <Barcode className="h-3 w-3 mr-1" />
                                                                                                    Lấy hàng
                                                                                                </>
                                                                                            )}
                                                                                        </Button>
                                                                                    )}
                                                                                    {isPicked && <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />}
                                                                                </TableCell>
                                                                            )}
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500">Không có thông tin lấy hàng</div>
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
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
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Quay lại
                            </Button>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">PHIẾU XUẤT KHO</h1>
                                {/* <p className="text-gray-600 text-sm mt-1">
                                    Mã phiếu: {goodsIssueNote.goodsIssueNoteId}
                                </p> */}
                            </div>
                        </div>

                        {/* Bên phải: Trạng thái + các nút hành động */}
                        <div className="flex items-center gap-3 py-1">
                            {/* Trạng thái phiếu */}
                            <span
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}
                            >
                                {statusInfo.icon}
                                {statusInfo.label}
                            </span>

                            {/* Nút làm mới */}
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                className="text-gray-600 hover:text-gray-900 flex items-center h-9 px-3 rounded-lg border-gray-300"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Làm mới
                            </Button>

                            {/* Nút Nộp phiếu (kho xuất) */}
                            {isWarehouseStaff &&
                                goodsIssueNote.status === GOODS_ISSUE_NOTE_STATUS.Picking &&
                                !goodsIssueNote.goodsIssueNoteDetails.some(
                                    (d) => d.status === ISSUE_ITEM_STATUS.Picking
                                ) && (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitLoading}
                                        className="flex items-center gap-2 h-9 bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-lg px-3"
                                    >
                                        {submitLoading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        Nộp phiếu
                                    </Button>
                                )}

                            {/* Nút Duyệt phiếu (quản lý) */}
                            {isWarehouseManager &&
                                goodsIssueNote.status === GOODS_ISSUE_NOTE_STATUS.PendingApproval && (
                                    <Button
                                        onClick={handleApprove}
                                        disabled={approveLoading}
                                        className="flex items-center gap-2 h-9 bg-purple-600 hover:bg-purple-700 text-white shadow-sm rounded-lg px-3"
                                    >
                                        {approveLoading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-4 h-4" />
                                        )}
                                        Duyệt phiếu
                                    </Button>
                                )}

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
            <div className="max-w-7xl mx-auto px-6 py-6">
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-xs text-gray-500 mb-1">Người tạo</div>
                                    <div className="text-base font-semibold text-gray-900">{goodsIssueNote.createdByName || 'N/A'}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-xs text-gray-500 mb-1">Người duyệt</div>
                                    <div className="text-base font-semibold text-gray-900">{goodsIssueNote.approvalByName || 'Chưa có'}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-xs text-gray-500 mb-1">Ngày tạo</div>
                                    <div className="text-base font-semibold text-gray-900">
                                        {goodsIssueNote.createdAt
                                            ? new Date(goodsIssueNote.createdAt).toLocaleString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : 'N/A'}
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
