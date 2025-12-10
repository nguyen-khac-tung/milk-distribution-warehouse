import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Package, User, Calendar, CheckCircle, XCircle, Clock, Truck, CheckSquare, FileText, Hash, Shield, Pencil, Eye } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import {
    getDisposalRequestDetail,
    updateDisposalRequestStatusPendingApproval,
    approveDisposalRequest,
    rejectDisposalRequest,
    assignDisposalRequestForPicking,
    createDisposalNote,
    getDetailDisposalNote
} from '../../services/DisposalService';
import { DISPOSAL_REQUEST_STATUS, canPerformDisposalRequestDetailAction } from '../../utils/permissions';
import { STATUS_LABELS } from '../../components/DisposalComponents/StatusDisplayDisposalRequest';
import UserInfoDisplay from '../../components/DisposalComponents/UserInfoDisplay';
import SubmitDraftModal from '../../components/DisposalComponents/SubmitDraftModal';
import ApprovalConfirmationModal from '../../components/DisposalComponents/ApprovalConfirmationModal';
import RejectionConfirmationModal from '../../components/DisposalComponents/RejectionConfirmationModal';
import AssignPickingModal from '../../components/DisposalComponents/AssignPickingModal';
import CreateDisposalNoteModal from '../../components/DisposalComponents/CreateDisposalNoteModal';
import { usePermissions } from '../../hooks/usePermissions';
import { cleanErrorMessage, extractErrorMessage } from '../../utils/Validation';
import { ComponentIcon } from '../../components/IconComponent/Icon';

const DisposalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [disposalRequest, setDisposalRequest] = useState(null);
    const [error, setError] = useState(null);
    const [hasDisposalNote, setHasDisposalNote] = useState(false);
    const [showSubmitDraftModal, setShowSubmitDraftModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showAssignPickingModal, setShowAssignPickingModal] = useState(false);
    const [showCreateDisposalNoteModal, setShowCreateDisposalNoteModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [approvalLoading, setApprovalLoading] = useState(false);
    const [rejectionLoading, setRejectionLoading] = useState(false);
    const [assignPickingLoading, setAssignPickingLoading] = useState(false);
    const [createDisposalNoteLoading, setCreateDisposalNoteLoading] = useState(false);
    const { hasPermission, isWarehouseManager, isWarehouseStaff } = usePermissions();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    useEffect(() => {
        const fetchDisposalRequestDetail = async () => {
            try {
                setLoading(true);
                const response = await getDisposalRequestDetail(id);
                if (response && response.success) {
                    setDisposalRequest(response.data);
                    // Check if disposal note exists
                    try {
                        const disposalNoteResponse = await getDetailDisposalNote(id);
                        if (disposalNoteResponse && disposalNoteResponse.success && disposalNoteResponse.data) {
                            setHasDisposalNote(true);
                        } else {
                            setHasDisposalNote(false);
                        }
                    } catch (err) {
                        // If error, means disposal note doesn't exist yet
                        setHasDisposalNote(false);
                    }
                } else {
                    setError('Không thể tải thông tin yêu cầu xuất hủy');
                }
            } catch (err) {
                setError(`Có lỗi xảy ra khi tải thông tin yêu cầu xuất hủy: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDisposalRequestDetail();
        }
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            1: 'bg-gray-100 text-gray-800', // Draft
            2: 'bg-yellow-100 text-yellow-800', // Pending Approval
            3: 'bg-red-100 text-red-800', // Rejected
            4: 'bg-blue-100 text-blue-800', // Approved
            5: 'bg-purple-100 text-purple-800', // Assigned for Picking
            6: 'bg-orange-100 text-orange-800', // Picking
            7: 'bg-emerald-100 text-emerald-800' // Completed
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const statusIcons = {
            1: <Clock className="h-4 w-4" />, // Draft
            2: <Clock className="h-4 w-4" />, // Pending Approval
            3: <XCircle className="h-4 w-4" />, // Rejected
            4: <CheckCircle className="h-4 w-4" />, // Approved
            5: <User className="h-4 w-4" />, // Assigned for Picking
            6: <Package className="h-4 w-4" />, // Picking
            7: <CheckCircle className="h-4 w-4" /> // Completed
        };
        return statusIcons[status] || <Clock className="h-4 w-4" />;
    };

    const canApprove = () => canPerformDisposalRequestDetailAction('approve', disposalRequest, hasPermission, userInfo);
    const canReject = () => canPerformDisposalRequestDetailAction('reject', disposalRequest, hasPermission, userInfo);
    const canSubmitDraft = () => canPerformDisposalRequestDetailAction('submit_pending_approval', disposalRequest, hasPermission, userInfo);
    const canAssignForPicking = () => canPerformDisposalRequestDetailAction('assign_for_picking', disposalRequest, hasPermission, userInfo);
    const canEdit = () => canPerformDisposalRequestDetailAction('edit', disposalRequest, hasPermission, userInfo);

    // Check if can create disposal note (Warehouse Staff only, when assigned and status is AssignedForPicking or Picking)
    const canCreateDisposalNote = () => {
        if (!disposalRequest) return false;
        if (!isWarehouseStaff) return false;

        const currentUserId = userInfo?.userId;
        const currentFullName = userInfo?.fullName || '';
        const currentUserName = userInfo?.userName || '';

        // Check by userId first
        const isAssignedToSelfById =
            disposalRequest?.assignTo?.userId === currentUserId ||
            disposalRequest?.assignTo?.id === currentUserId ||
            disposalRequest?.assignTo === currentUserId ||
            disposalRequest?.assignToId === currentUserId ||
            disposalRequest?.assignToUserId === currentUserId;

        // Check by name as fallback (in case backend doesn't return assignTo object)
        const assignToName = disposalRequest?.assignTo?.fullName || disposalRequest?.assignToName || '';
        const isAssignedToSelfByName = assignToName && (
            assignToName.toLowerCase().trim() === currentFullName.toLowerCase().trim() ||
            assignToName.toLowerCase().trim() === currentUserName.toLowerCase().trim()
        );

        const isAssignedToSelf = isAssignedToSelfById || isAssignedToSelfByName;

        const status = disposalRequest?.status;
        const canCreate = isAssignedToSelf &&
            (status === DISPOSAL_REQUEST_STATUS.AssignedForPicking ||
                status === DISPOSAL_REQUEST_STATUS.Picking ||
                status === 5 || status === "5" ||
                status === 6 || status === "6");

        return canCreate && !hasDisposalNote;
    };

    const handleSubmitDraftConfirm = async () => {
        setSubmitLoading(true);
        try {
            await updateDisposalRequestStatusPendingApproval({
                disposalRequestId: disposalRequest.disposalRequestId
            });

            if (window.showToast) {
                window.showToast("Gửi phê duyệt thành công!", "success");
            }

            setShowSubmitDraftModal(false);

            // Refresh data after successful submission
            const response = await getDisposalRequestDetail(id);
            if (response && response.success) {
                setDisposalRequest(response.data);
            }
        } catch (error) {
            console.error("Error submitting draft:", error);
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi nộp bản nháp")

            if (window.showToast) {
                window.showToast(message, "error");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleApprovalConfirm = async () => {
        setApprovalLoading(true);
        try {
            await approveDisposalRequest({
                disposalRequestId: disposalRequest.disposalRequestId
            });

            if (window.showToast) {
                window.showToast("Duyệt yêu cầu xuất hủy thành công!", "success");
            }
            setShowApprovalModal(false);
            const response = await getDisposalRequestDetail(id);
            if (response && response.success) {
                setDisposalRequest(response.data);
            }
        } catch (error) {
            console.error("Error approving disposal request:", error);
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi duyệt yêu cầu xuất hủy")

            if (window.showToast) {
                window.showToast(message, "error");
            }
        } finally {
            setApprovalLoading(false);
        }
    };

    const handleRejectionConfirm = async (rejectionReason) => {
        setRejectionLoading(true);
        try {
            await rejectDisposalRequest({
                disposalRequestId: disposalRequest.disposalRequestId,
                rejectionReason: rejectionReason
            });

            if (window.showToast) {
                window.showToast("Từ chối yêu cầu xuất hủy thành công!", "success");
            }

            setShowRejectionModal(false);

            // Refresh data after successful rejection
            const response = await getDisposalRequestDetail(id);
            if (response && response.success) {
                setDisposalRequest(response.data);
            }
        } catch (error) {
            console.error("Error rejecting disposal request:", error);
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi từ chối yêu cầu xuất hủy")

            if (window.showToast) {
                window.showToast(message, "error");
            }
        } finally {
            setRejectionLoading(false);
        }
    };

    const handleAssignPicking = async (assignTo) => {
        setAssignPickingLoading(true);
        try {
            await assignDisposalRequestForPicking({
                disposalRequestId: disposalRequest.disposalRequestId,
                assignTo: assignTo
            });

            if (window.showToast) {
                window.showToast("Phân công lấy hàng thành công!", "success");
            }
            setShowAssignPickingModal(false);
            const response = await getDisposalRequestDetail(id);
            if (response && response.success) {
                setDisposalRequest(response.data);
            }
        } catch (error) {
            console.error("Error assigning for picking:", error);
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi phân công lấy hàng")

            if (window.showToast) {
                window.showToast(message, "error");
            }
        } finally {
            setAssignPickingLoading(false);
        }
    };

    const handleCreateDisposalNote = async () => {
        setCreateDisposalNoteLoading(true);
        try {
            await createDisposalNote({
                disposalRequestId: disposalRequest.disposalRequestId
            });

            if (window.showToast) {
                window.showToast("Tạo phiếu xuất hủy thành công!", "success");
            }
            setShowCreateDisposalNoteModal(false);
            // Set hasDisposalNote to true after successful creation
            setHasDisposalNote(true);
            const response = await getDisposalRequestDetail(id);
            if (response && response.success) {
                setDisposalRequest(response.data);
            }
        } catch (error) {
            console.error("Error creating disposal note:", error);
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi tạo phiếu xuất hủy")

            if (window.showToast) {
                window.showToast(message, "error");
            }
        } finally {
            setCreateDisposalNoteLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-lg shadow-lg rounded-xl border border-gray-200 bg-white">
                    <CardContent className="p-8 text-center">

                        {/* Icon lỗi nổi bật */}
                        <div className="flex justify-center mb-4 mt-5">
                            <div className="bg-red-100 p-4 rounded-full shadow-inner">
                                <XCircle className="h-14 w-14 text-red-600" />
                            </div>
                        </div>

                        {/* Tiêu đề */}
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            Đã xảy ra lỗi
                        </h3>

                        {/* Mô tả lỗi */}
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            {cleanErrorMessage(error, "Không thể tải dữ liệu. Vui lòng thử lại sau.")}
                        </p>

                        {/* Thông tin kỹ thuật – nhỏ, tinh tế */}
                        <div className="text-xs text-gray-500 bg-gray-100 rounded-lg px-4 py-3 mb-6">
                            <p><span className="font-semibold">ID:</span> {id}</p>
                            <p><span className="font-semibold">URL:</span> /DisposalRequest/GetDisposalRequestDetail/{id}</p>
                        </div>

                        {/* Nút quay lại */}
                        <Button
                            onClick={() => navigate('/sales-orders')}
                            className="w-full h-[42px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all"
                        >
                            <ComponentIcon name="arrowBackCircleOutline" size={22} color="#fff" />
                            <span>Quay lại danh sách đơn xuất hủy</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!disposalRequest) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy</h3>
                        <p className="text-gray-600 mb-4">Yêu cầu xuất hủy không tồn tại hoặc đã bị xóa</p>
                        <Button onClick={() => navigate('/disposal')} variant="outline">
                            <ComponentIcon name="arrowBackCircleOutline" size={28} />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-6">
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
                                    <h1 className="text-2xl font-bold text-slate-600 m-0">YÊU CẦU XUẤT HỦY</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_0.8fr] gap-6 mt-4">
                    {/* Main Content - Left Side */}
                    <div>
                        <div className="bg-white border-2 border-gray-400 rounded-lg p-6 h-full flex flex-col">
                            {/* Title */}
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 uppercase">YÊU CẦU XUẤT HỦY</h1>
                            </div>

                            {/* General Information */}
                            <div className="bg-gray-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center space-x-2 mb-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-bold text-gray-800">Thông tin chung</h3>
                                </div>

                                {/* Grid 2 cột chính */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    {/* Cột trái */}
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <Hash className="h-4 w-4 text-green-600" />
                                                <label className="font-medium text-gray-700">Mã yêu cầu:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{disposalRequest.disposalRequestId || '—'}</span>
                                        </div>

                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                                <label className="font-medium text-gray-700">Thời gian dự kiến xuất hủy:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">
                                                {formatDate(disposalRequest.estimatedTimeDeparture)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cột phải */}
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <User className="h-4 w-4 text-blue-600" />
                                                <label className="font-medium text-gray-700">Người tạo:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{disposalRequest.createdBy?.fullName || disposalRequest.createdByName || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product List Table */}
                            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col">
                                <Table className="flex-1">
                                    <TableHeader>
                                        <TableRow className="bg-gray-100">
                                            <TableHead className="w-16 text-center font-semibold">STT</TableHead>
                                            <TableHead className="font-semibold">
                                                <div className="flex flex-col items-center">
                                                    <span className="whitespace-nowrap">Mã</span>
                                                    <span className="whitespace-nowrap">hàng hóa</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-semibold">Tên hàng hóa</TableHead>
                                            <TableHead className="font-semibold">Nhà cung cấp</TableHead>
                                            <TableHead className="text-center font-semibold leading-tight">
                                                <div className="flex flex-col items-center">
                                                    <span className="whitespace-nowrap">Đơn vị</span>
                                                    <span className="whitespace-nowrap">/thùng</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-center font-semibold">Số thùng</TableHead>
                                            <TableHead className="text-center font-semibold">Tổng số đơn vị</TableHead>
                                            <TableHead className="text-center font-semibold whitespace-nowrap">Đơn vị</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="flex-1">
                                        {disposalRequest.disposalRequestDetails && disposalRequest.disposalRequestDetails.length > 0 ? (
                                            disposalRequest.disposalRequestDetails.map((item, index) => (
                                                <TableRow key={item.disposalRequestDetailId} className="border-b">
                                                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                                    <TableCell className="text-gray-600 font-medium">{item.goods?.goodsCode || '-'}</TableCell>
                                                    <TableCell className="text-gray-600">{item.goods?.goodsName || '-'}</TableCell>
                                                    <TableCell className="text-gray-600">{item.goods?.companyName || '-'}</TableCell>
                                                    <TableCell className="text-center font-semibold">{item.goodsPacking?.unitPerPackage || '-'}</TableCell>
                                                    <TableCell className="text-center font-semibold">{item.packageQuantity || '-'}</TableCell>
                                                    <TableCell className="text-center font-semibold">
                                                        {(item.packageQuantity || 0) * (item.goodsPacking?.unitPerPackage || 0)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-600">{item.goods?.unitMeasureName || '-'}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                                    Không có hàng hóa nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {/* Total Row */}
                                        {disposalRequest.disposalRequestDetails && disposalRequest.disposalRequestDetails.length > 0 && (
                                            <TableRow className="bg-gray-100 font-bold border-t border-gray-300">
                                                <TableCell colSpan={5} className="text-right pr-2 bg-gray-100">Tổng:</TableCell>
                                                <TableCell className="text-center font-bold bg-gray-100">
                                                    {disposalRequest.disposalRequestDetails.reduce(
                                                        (sum, item) => sum + (item.packageQuantity || 0),
                                                        0
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center font-bold bg-gray-100">
                                                    {disposalRequest.disposalRequestDetails.reduce(
                                                        (sum, item) =>
                                                            sum + (item.packageQuantity || 0) * (item.goodsPacking?.unitPerPackage || 0),
                                                        0
                                                    )}
                                                </TableCell>
                                                <TableCell className="bg-gray-100"></TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Note Section */}
                            {disposalRequest.note && (
                                <div className="mt-4 bg-gray-50 border border-gray-300 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-semibold text-gray-800">Ghi chú:</h4>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{disposalRequest.note}</p>
                                </div>
                            )}

                            {/* Action Buttons at bottom of card */}
                            <div className="mt-6 flex justify-center space-x-4">
                                {canEdit() && (
                                    <>
                                        <Button
                                            onClick={() => navigate(`/disposal/update/${disposalRequest.disposalRequestId}`)}
                                            className="bg-amber-500 hover:bg-amber-600 text-white h-[38px] px-8"
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Cập nhật
                                        </Button>
                                        <Button
                                            onClick={() => setShowSubmitDraftModal(true)}
                                            className="bg-orange-600 hover:bg-orange-700 text-white h-[38px] px-8"
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            {disposalRequest?.status === DISPOSAL_REQUEST_STATUS.Rejected ? 'Gửi phê duyệt lại' : 'Gửi phê duyệt'}
                                        </Button>
                                    </>
                                )}

                                {canApprove() && (
                                    <Button
                                        onClick={() => setShowApprovalModal(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white h-[38px] px-8"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Duyệt yêu cầu
                                    </Button>
                                )}

                                {canReject() && (
                                    <Button
                                        onClick={() => setShowRejectionModal(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white h-[38px] px-8"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Từ chối yêu cầu
                                    </Button>
                                )}

                                {canAssignForPicking() && (
                                    <Button
                                        onClick={() => setShowAssignPickingModal(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8"
                                    >
                                        <Truck className="h-4 w-4 mr-2" />
                                        {disposalRequest?.status === DISPOSAL_REQUEST_STATUS.AssignedForPicking ? 'Phân công lại' : 'Phân công lấy hàng'}
                                    </Button>
                                )}

                                {canCreateDisposalNote() && (
                                    <Button
                                        onClick={() => setShowCreateDisposalNoteModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-[38px] px-8"
                                    >
                                        <Package className="h-4 w-4 mr-2" />
                                        Tạo phiếu xuất hủy
                                    </Button>
                                )}
                                {(isWarehouseManager || isWarehouseStaff) && hasDisposalNote && (
                                    <Button
                                        onClick={() => navigate(`/disposal-note-detail/${disposalRequest.disposalRequestId}`)}
                                        className="h-[38px] px-8 bg-green-700 hover:bg-green-900 text-white"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Xem phiếu xuất hủy
                                    </Button>
                                )}
                            </div>

                        </div>
                    </div>


                    {/* Right Sidebar */}
                    <div className="bg-gray-200 rounded-lg p-6 h-full">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <h3 className="font-bold text-gray-800">Tình trạng</h3>
                        </div>

                        {/* Status Display */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">Trạng thái</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(disposalRequest.status)}`}>
                                    {getStatusIcon(disposalRequest.status)}
                                    <span className="ml-1">{STATUS_LABELS[disposalRequest.status] || 'Không xác định'}</span>
                                </span>
                            </div>
                        </div>

                        <UserInfoDisplay
                            request={disposalRequest}
                            formatDate={(date) =>
                                new Date(date).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                            }
                            hasPermission={hasPermission}
                            userInfo={null}
                        />
                    </div>
                </div>
            </div>

            {/* Submit Draft Confirmation Modal */}
            <SubmitDraftModal
                isOpen={showSubmitDraftModal}
                onClose={() => setShowSubmitDraftModal(false)}
                onConfirm={handleSubmitDraftConfirm}
                disposalRequest={disposalRequest}
                loading={submitLoading}
            />

            {/* Approval Confirmation Modal */}
            <ApprovalConfirmationModal
                isOpen={showApprovalModal}
                onClose={() => setShowApprovalModal(false)}
                onConfirm={handleApprovalConfirm}
                disposalRequest={disposalRequest}
                loading={approvalLoading}
            />

            {/* Rejection Confirmation Modal */}
            <RejectionConfirmationModal
                isOpen={showRejectionModal}
                onClose={() => setShowRejectionModal(false)}
                onConfirm={handleRejectionConfirm}
                disposalRequest={disposalRequest}
                loading={rejectionLoading}
            />

            {/* Assign Picking Modal */}
            <AssignPickingModal
                isOpen={showAssignPickingModal}
                onClose={() => setShowAssignPickingModal(false)}
                onConfirm={handleAssignPicking}
                disposalRequest={disposalRequest}
                loading={assignPickingLoading}
            />

            {/* Create Disposal Note Modal */}
            <CreateDisposalNoteModal
                isOpen={showCreateDisposalNoteModal}
                onClose={() => setShowCreateDisposalNoteModal(false)}
                onConfirm={handleCreateDisposalNote}
                disposalRequest={disposalRequest}
                loading={createDisposalNoteLoading}
            />

        </div>
    );
};

export default DisposalDetail;
