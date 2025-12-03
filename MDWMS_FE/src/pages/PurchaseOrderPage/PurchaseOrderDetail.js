import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Package, User, Calendar, CheckCircle, XCircle, Clock, Truck, CheckSquare, Trash2, Key, Building2, FileText, Hash, Shield, ShoppingCart, Users, UserCheck, UserX, TruckIcon, UserPlus, Store, UserCircle, UserCog, UserCheck2, UserX2, UserMinus, Mail, Phone, MapPin, Play, Edit } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { getPurchaseOrderDetail, submitPurchaseOrder, approvePurchaseOrder, rejectPurchaseOrder, confirmGoodsReceived, assignForReceiving, startReceive, reAssignForReceiving, updatePurchaseOrderAsOrdered, changeDeliveryDate } from '../../services/PurchaseOrderService';
import { extractErrorMessage } from '../../utils/Validation';
import ApprovalConfirmationModal from '../../components/PurchaseOrderComponents/ApprovalConfirmationModal';
import RejectionConfirmationModal from '../../components/PurchaseOrderComponents/RejectionConfirmationModal';
import SubmitDraftConfirmationModal from '../../components/PurchaseOrderComponents/SubmitDraftConfirmationModal';
import ConfirmGoodsReceivedModal from '../../components/PurchaseOrderComponents/ConfirmGoodsReceivedModal';
import AssignReceivingModal from '../../components/PurchaseOrderComponents/AssignReceivingModal';
import StartReceiveModal from '../../components/PurchaseOrderComponents/StartReceiveModal';
import ConfirmOrderedModal from '../../components/PurchaseOrderComponents/ConfirmOrderedModal';
import UserInfoDisplay from '../../components/PurchaseOrderComponents/UserInfoDisplay';
import { PURCHASE_ORDER_STATUS } from '../../utils/permissions';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

const PurchaseOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [purchaseOrder, setPurchaseOrder] = useState(null);
    const [error, setError] = useState(null);

    // Modal states
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showSubmitDraftModal, setShowSubmitDraftModal] = useState(false);
    const [showConfirmGoodsReceivedModal, setShowConfirmGoodsReceivedModal] = useState(false);
    const [showAssignReceivingModal, setShowAssignReceivingModal] = useState(false);
    const [showStartReceiveModal, setShowStartReceiveModal] = useState(false);
    const [showConfirmOrderedModal, setShowConfirmOrderedModal] = useState(false);
    const [showChangeDeliveryDateModal, setShowChangeDeliveryDateModal] = useState(false);
    const [approvalLoading, setApprovalLoading] = useState(false);
    const [rejectionLoading, setRejectionLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [confirmGoodsReceivedLoading, setConfirmGoodsReceivedLoading] = useState(false);
    const [assignReceivingLoading, setAssignReceivingLoading] = useState(false);
    const [startReceiveLoading, setStartReceiveLoading] = useState(false);
    const [confirmOrderedLoading, setConfirmOrderedLoading] = useState(false);
    const [changeDeliveryDateLoading, setChangeDeliveryDateLoading] = useState(false);

    useEffect(() => {
        const fetchPurchaseOrderDetail = async () => {
            try {
                setLoading(true);
                const response = await getPurchaseOrderDetail(id);
                if (response && response.success) {
                    setPurchaseOrder(response.data);
                } else {
                    setError('Không thể tải thông tin đơn hàng');
                }
            } catch (err) {
                setError(`Có lỗi xảy ra khi tải thông tin đơn hàng: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPurchaseOrderDetail();
        }
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            1: 'bg-gray-100 text-gray-800', // Draft
            2: 'bg-yellow-100 text-yellow-800', // Pending Approval
            3: 'bg-red-100 text-red-800', // Rejected
            4: 'bg-green-100 text-green-800', // Approved
            5: 'bg-blue-100 text-blue-800', // Goods Received
            6: 'bg-purple-100 text-purple-800', // Assigned for Receiving
            7: 'bg-orange-100 text-orange-800', // Receiving
            8: 'bg-indigo-100 text-indigo-800', // Inspected
            9: 'bg-emerald-100 text-emerald-800', // Completed
            10: 'bg-green-100 text-green-800', // Ordered
            11: 'bg-cyan-100 text-cyan-800' // AwaitingArrival
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const statusIcons = {
            1: <Clock className="h-3 w-3" />, // Draft
            2: <Clock className="h-3 w-3" />, // Pending Approval
            3: <XCircle className="h-3 w-3" />, // Rejected
            4: <CheckCircle className="h-3 w-3" />, // Approved
            5: <Truck className="h-3 w-3" />, // Goods Received
            6: <User className="h-3 w-3" />, // Assigned for Receiving
            7: <Package className="h-3 w-3" />, // Receiving
            8: <CheckSquare className="h-3 w-3" />, // Inspected
            9: <CheckCircle className="h-3 w-3" />, // Completed
            10: <ShoppingCart className="h-3 w-3" />, // Ordered
            11: <Clock className="h-3 w-3" /> // AwaitingArrival
        };
        return statusIcons[status] || <Clock className="h-3 w-3" />;
    };

    const getStatusText = (status) => {
        const statusTexts = {
            1: 'Bản nháp',
            2: 'Chờ duyệt',
            3: 'Đã từ chối',
            4: 'Đã duyệt',
            5: 'Đã giao đến',
            6: 'Đã phân công',
            7: 'Đang tiếp nhận',
            8: 'Đã kiểm nhập',
            9: 'Đã nhập kho',
            10: 'Đã đặt hàng',
            11: 'Chờ đến'
        };
        return statusTexts[status] || 'Không xác định';
    };
    const handleApprovalConfirm = async () => {
        setApprovalLoading(true);
        try {
            await approvePurchaseOrder(
                purchaseOrder.purchaseOderId
            );

            if (window.showToast) {
                window.showToast("Duyệt đơn hàng thành công!", "success");
            }
            setShowApprovalModal(false);
            const response = await getPurchaseOrderDetail(id);
            if (response && response.success) {
                setPurchaseOrder(response.data);
            }
        } catch (error) {
            console.error("Error approving purchase order:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi duyệt đơn hàng";
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setApprovalLoading(false);
        }
    };

    const handleRejectionConfirm = async (rejectionReason) => {
        setRejectionLoading(true);
        try {
            await rejectPurchaseOrder(
                purchaseOrder.purchaseOderId,
                rejectionReason
            );

            if (window.showToast) {
                window.showToast("Từ chối đơn hàng thành công!", "success");
            }

            setShowRejectionModal(false);

            // Refresh data after successful rejection
            const response = await getPurchaseOrderDetail(id);
            if (response && response.success) {
                setPurchaseOrder(response.data);
            }
        } catch (error) {
            console.error("Error rejecting purchase order:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi từ chối đơn hàng";
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setRejectionLoading(false);
        }
    };
    const canApprove = () => {
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_APPROVE) &&
            //Chỉ có thể duyệt khi đơn hàng đang chờ duyệt
            purchaseOrder?.status === PURCHASE_ORDER_STATUS.PendingApproval;
    };

    const canReject = () => {
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_REJECT) &&
            purchaseOrder?.status === PURCHASE_ORDER_STATUS.PendingApproval;
    };

    const canConfirmGoodsReceived = () => {
        // Không cho phép nếu đã xác nhận giao đến rồi
        if (purchaseOrder?.arrivalConfirmedBy || purchaseOrder?.arrivalConfirmedAt) {
            return false;
        }

        // Cho phép xác nhận giao đến khi:
        // - Approved: đã duyệt (cho phép xác nhận giao đến)
        // - Ordered: đã đặt hàng (có thể xác nhận giao đến trước hoặc sau phân công)
        // - AssignedForReceiving: đã phân công (cho phép xác nhận giao đến sau khi phân công)
        // - AwaitingArrival: Chờ đến (nhân viên/QL kho có thể xác nhận đến)
        // Không cho phép khi status là GoodsReceived (đã xác nhận)
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_CONFIRM_GOODS_RECEIVED) &&
            purchaseOrder?.status !== PURCHASE_ORDER_STATUS.GoodsReceived &&
            (purchaseOrder?.status === PURCHASE_ORDER_STATUS.Approved ||
                purchaseOrder?.status === PURCHASE_ORDER_STATUS.Ordered ||
                purchaseOrder?.status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
                purchaseOrder?.status === PURCHASE_ORDER_STATUS.AwaitingArrival);
    };

    const canAssignReceiving = () => {
        // Cho phép phân công khi status là Ordered hoặc GoodsReceived
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_ASSIGN_FOR_RECEIVING) &&
            (purchaseOrder?.status === PURCHASE_ORDER_STATUS.Ordered ||
                purchaseOrder?.status === PURCHASE_ORDER_STATUS.GoodsReceived);
    };

    const canReAssignReceiving = () => {
        if (!hasPermission(PERMISSIONS.PURCHASE_ORDER_REASSIGN_FOR_RECEIVING)) {
            return false;
        }

        // Kiểm tra xem đã có người được giao chưa
        const hasBeenAssigned = purchaseOrder?.assignToByName ||
            purchaseOrder?.assignedAt ||
            purchaseOrder?.assignTo ||
            purchaseOrder?.assignToById;

        // Backend cho phép reAssign khi status là AssignedForReceiving hoặc AwaitingArrival
        // Cho phép hiển thị nút "Giao lại" khi:
        // 1. Status là AssignedForReceiving (đã giao, chưa xác nhận đến)
        // 2. Status là AwaitingArrival (Chờ đến) VÀ đã có người được giao trước đó
        // 3. Status là GoodsReceived (đã xác nhận đến) VÀ đã có người được giao trước đó
        //    -> Khi quản lý kho giao trước rồi mới xác nhận đến, vẫn phải hiển thị nút Giao lại
        return purchaseOrder?.status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
            (purchaseOrder?.status === PURCHASE_ORDER_STATUS.AwaitingArrival && hasBeenAssigned) ||
            (purchaseOrder?.status === PURCHASE_ORDER_STATUS.GoodsReceived && hasBeenAssigned);
    };

    const canStartReceive = () => {
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_START_RECEIVE) &&
            purchaseOrder?.status === PURCHASE_ORDER_STATUS.AssignedForReceiving;
    };

    const canConfirmOrdered = () => {
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_CONFIRM_ORDERED) &&
            purchaseOrder?.status === PURCHASE_ORDER_STATUS.Approved;
    };

    const canSubmitDraft = () => {
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_SUBMIT_DRAFT) &&
            purchaseOrder?.status === PURCHASE_ORDER_STATUS.Draft &&
            purchaseOrder?.isDisableButton === false;
    };

    const canResubmit = () => {
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_SUBMIT_DRAFT) &&
            purchaseOrder?.status === PURCHASE_ORDER_STATUS.Rejected &&
            purchaseOrder?.isDisableButton === false;
    };

    const canEdit = () => {
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_UPDATE) &&
            (purchaseOrder?.status === PURCHASE_ORDER_STATUS.Draft ||
                purchaseOrder?.status === PURCHASE_ORDER_STATUS.Rejected);
    };

    const canChangeDeliveryDate = () => {
        // Chỉ nhân viên kinh doanh (Sales Representative) mới có quyền thay đổi ngày dự kiến nhập
        if (!hasPermission(PERMISSIONS.PURCHASE_ORDER_CHANGE_DELIVERY_DATE)) {
            return false;
        }

        // Cho phép khi status là Ordered (10)
        if (purchaseOrder?.status === PURCHASE_ORDER_STATUS.Ordered) {
            return true;
        }

        // Cho phép khi status là AwaitingArrival (11)
        if (purchaseOrder?.status === PURCHASE_ORDER_STATUS.AwaitingArrival) {
            return true;
        }

        // Cho phép khi status là AssignedForReceiving (6) VÀ chưa xác nhận giao đến
        if (purchaseOrder?.status === PURCHASE_ORDER_STATUS.AssignedForReceiving) {
            // Không cho phép nếu đã xác nhận giao đến
            if (purchaseOrder?.arrivalConfirmedBy || purchaseOrder?.arrivalConfirmedAt) {
                return false;
            }
            // Cho phép nếu chưa xác nhận giao đến
            return true;
        }

        return false;
    };

    const handleSubmitDraftConfirm = async () => {
        setSubmitLoading(true);
        try {
            await submitPurchaseOrder(
                purchaseOrder.purchaseOderId
            );

            if (window.showToast) {
                const message = purchaseOrder.status === PURCHASE_ORDER_STATUS.Rejected
                    ? "Gửi lại phê duyệt đơn hàng thành công!"
                    : "Gửi phê duyệt thành công!";
                window.showToast(message, "success");
            }

            setShowSubmitDraftModal(false);

            // Refresh data after successful submission
            const response = await getPurchaseOrderDetail(id);
            if (response && response.success) {
                setPurchaseOrder(response.data);
            }
        } catch (error) {
            console.error("Error submitting draft:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi nộp bản nháp";
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleConfirmGoodsReceived = async () => {
        setConfirmGoodsReceivedLoading(true);
        try {
            await confirmGoodsReceived(
                purchaseOrder.purchaseOderId
            );

            if (window.showToast) {
                window.showToast("Xác nhận đã tiếp nhận thành công!", "success");
            }
            setShowConfirmGoodsReceivedModal(false);
            const response = await getPurchaseOrderDetail(id);
            if (response && response.success) {
                setPurchaseOrder(response.data);
            }
        } catch (error) {
            console.error("Error confirming goods received:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi xác nhận đã tiếp nhận";
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setConfirmGoodsReceivedLoading(false);
        }
    };

    const handleAssignReceiving = async (assignTo) => {
        setAssignReceivingLoading(true);
        try {
            // Kiểm tra xem đã có người được giao chưa
            const hasBeenAssigned = purchaseOrder?.assignToByName ||
                purchaseOrder?.assignedAt ||
                purchaseOrder?.assignTo ||
                purchaseOrder?.assignToById;

            // Backend cho phép reAssign khi status là AssignedForReceiving hoặc AwaitingArrival
            // Khi status là GoodsReceived, phải dùng assignForReceiving (backend sẽ tự động cập nhật người được giao)
            const shouldUseReAssign = purchaseOrder?.status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
                purchaseOrder?.status === PURCHASE_ORDER_STATUS.AwaitingArrival;

            // Kiểm tra xem có phải là "giao lại" về mặt logic (đã có người được giao trước đó)
            const isReassignLogic = shouldUseReAssign ||
                (purchaseOrder?.status === PURCHASE_ORDER_STATUS.GoodsReceived && hasBeenAssigned);

            if (shouldUseReAssign) {
                await reAssignForReceiving(
                    purchaseOrder.purchaseOderId,
                    assignTo
                );
            } else {
                // Khi status là GoodsReceived và đã có người được giao, vẫn dùng assignForReceiving
                // nhưng hiển thị message là "Giao lại"
                await assignForReceiving(
                    purchaseOrder.purchaseOderId,
                    assignTo
                );
            }

            if (window.showToast) {
                window.showToast(
                    isReassignLogic
                        ? "Giao lại nhiệm vụ nhận hàng thành công!"
                        : "Giao nhiệm vụ nhận hàng thành công!",
                    "success"
                );
            }
            setShowAssignReceivingModal(false);
            const response = await getPurchaseOrderDetail(id);
            if (response && response.success) {
                setPurchaseOrder(response.data);
            }
        } catch (error) {
            console.error("Error assigning for receiving:", error);
            const hasBeenAssigned = purchaseOrder?.assignToByName ||
                purchaseOrder?.assignedAt ||
                purchaseOrder?.assignTo ||
                purchaseOrder?.assignToById;
            const shouldUseReAssign = purchaseOrder?.status === PURCHASE_ORDER_STATUS.AssignedForReceiving ||
                purchaseOrder?.status === PURCHASE_ORDER_STATUS.AwaitingArrival;
            const isReassignLogic = shouldUseReAssign ||
                (purchaseOrder?.status === PURCHASE_ORDER_STATUS.GoodsReceived && hasBeenAssigned);
            const errorMessage = extractErrorMessage(error) ||
                (isReassignLogic
                    ? "Có lỗi xảy ra khi giao lại nhiệm vụ nhận hàng"
                    : "Có lỗi xảy ra khi giao nhiệm vụ nhận hàng");
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setAssignReceivingLoading(false);
        }
    };

    const handleStartReceive = async () => {
        setStartReceiveLoading(true);
        try {
            await startReceive(
                purchaseOrder.purchaseOderId
            );

            if (window.showToast) {
                window.showToast("Bắt đầu tiếp nhận thành công!", "success");
            }
            setShowStartReceiveModal(false);
            const response = await getPurchaseOrderDetail(id);
            if (response && response.success) {
                setPurchaseOrder(response.data);
            }
        } catch (error) {
            console.error("Error starting receive:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi bắt đầu tiếp nhận";
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setStartReceiveLoading(false);
        }
    };

    const handleConfirmOrdered = async (estimatedTimeArrival) => {
        setConfirmOrderedLoading(true);
        try {
            await updatePurchaseOrderAsOrdered(
                purchaseOrder.purchaseOderId,
                estimatedTimeArrival
            );

            if (window.showToast) {
                window.showToast("Xác nhận đã đặt hàng thành công!", "success");
            }
            setShowConfirmOrderedModal(false);
            const response = await getPurchaseOrderDetail(id);
            if (response && response.success) {
                setPurchaseOrder(response.data);
            }
        } catch (error) {
            console.error("Error confirming ordered:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi xác nhận đã đặt hàng";
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setConfirmOrderedLoading(false);
        }
    };

    const handleChangeDeliveryDate = async (estimatedTimeArrival, reason = '') => {
        setChangeDeliveryDateLoading(true);
        try {
            await changeDeliveryDate(
                purchaseOrder.purchaseOderId,
                estimatedTimeArrival,
                reason
            );

            if (window.showToast) {
                window.showToast("Thay đổi ngày dự kiến nhập thành công!", "success");
            }
            setShowChangeDeliveryDateModal(false);
            const response = await getPurchaseOrderDetail(id);
            if (response && response.success) {
                setPurchaseOrder(response.data);
            }
        } catch (error) {
            console.error("Error changing delivery date:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi thay đổi ngày dự kiến nhập";
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setChangeDeliveryDateLoading(false);
        }
    };
    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="text-xs text-gray-500 mb-4">
                            <p>ID: {id}</p>
                            <p>URL: /PurchaseOrder/GetPurchaseOrder/{id}</p>
                        </div>
                        <Button onClick={() => navigate('/purchase-orders')} variant="outline">
                            <ComponentIcon name="arrowBackCircleOutline" size={18} />
                            <span className="ml-2">Quay lại</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    if (!purchaseOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy</h3>
                        <p className="text-gray-600 mb-4">Đơn hàng không tồn tại hoặc đã bị xóa</p>
                        <Button onClick={() => navigate('/purchase-orders')} variant="outline">
                            <ComponentIcon name="arrowBackCircleOutline" size={18} />
                            <span className="ml-2">Quay lại</span>
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
                <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/purchase-orders')}
                            className="flex items-center justify-center hover:opacity-80 transition-opacity p-0"
                        >
                            <ComponentIcon name="arrowBackCircleOutline" size={28} />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-600 m-0">ĐƠN MUA HÀNG</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_0.8fr] gap-6 mt-4">
                    {/* Main Content - Left Side */}
                    <div>
                        <div className="bg-white border-2 border-gray-400 rounded-lg p-6 h-full flex flex-col">
                            {/* Title */}
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 uppercase">ĐƠN MUA HÀNG</h1>
                            </div>
                            {/* General Information */}
                            <div className="bg-gray-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center space-x-2 mb-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-bold text-gray-800">Thông tin chung</h3>
                                </div>
                                <div className="space-y-3">
                                    {/* Supplier and Address on same line */}
                                    <div className="grid grid-cols-[1.2fr_1fr] gap-4">
                                        {/* Left: Supplier */}
                                        <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                                            <div className="flex items-center space-x-2 min-w-0">
                                                <Store className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap leading-normal">Nhà cung cấp:</label>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded border break-words leading-normal">
                                                {purchaseOrder.supplierName || 'Chưa có thông tin'}
                                            </span>
                                        </div>

                                        {/* Right: Address */}
                                        <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                                            <div className="flex items-center space-x-2 min-w-0">
                                                <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap leading-normal">Địa chỉ:</label>
                                            </div>
                                            <span className="text-sm text-gray-900 bg-gray-200 px-3 py-1 rounded border break-words leading-normal">
                                                {purchaseOrder.address || 'Chưa có thông tin'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Email and Phone on same line */}
                                    <div className="grid grid-cols-[1.2fr_1fr] gap-4">
                                        {/* Left: Email */}
                                        <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                                            <div className="flex items-center space-x-2 min-w-0">
                                                <Mail className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap leading-normal">Email:</label>
                                            </div>
                                            <span className="text-sm text-gray-900 bg-gray-200 px-3 py-1 rounded border break-words leading-normal">
                                                {purchaseOrder.email || 'Chưa có thông tin'}
                                            </span>
                                        </div>

                                        {/* Right: Phone */}
                                        <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                                            <div className="flex items-center space-x-2 min-w-0">
                                                <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap leading-normal">SĐT:</label>
                                            </div>
                                            <span className="text-sm text-gray-900 bg-gray-200 px-3 py-1 rounded border break-words leading-normal">
                                                {purchaseOrder.phone || 'Chưa có thông tin'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Estimated Time Arrival */}
                                    {purchaseOrder.estimatedTimeArrival && (
                                        <div className="grid grid-cols-[1.2fr_1fr] gap-4">
                                            <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
                                                <div className="flex items-center space-x-2 min-w-0">
                                                    <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap leading-normal">Ngày dự kiến nhập:</label>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded border break-words leading-normal">
                                                    {purchaseOrder.estimatedTimeArrival ? new Date(purchaseOrder.estimatedTimeArrival).toLocaleDateString('vi-VN', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    }) : 'Chưa có thông tin'}
                                                </span>
                                            </div>
                                            <div></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Product List Table */}
                            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col">
                                <Table className="flex-1">
                                    <TableHeader>
                                        <TableRow className="bg-gray-100">
                                            <TableHead className="w-16 text-center font-semibold">STT</TableHead>
                                            <TableHead className="font-semibold" style={{ minWidth: '120px' }}>Mã hàng hóa</TableHead>
                                            <TableHead className="font-semibold" style={{ minWidth: '120px' }}>Tên hàng hóa</TableHead>
                                            <TableHead className="text-center font-semibold" style={{ minWidth: '119px' }}>Đơn vị/thùng</TableHead>
                                            <TableHead className="text-center font-semibold">Số thùng</TableHead>
                                            <TableHead className="text-center font-semibold" style={{ minWidth: '110px' }}>Tổng số đơn vị</TableHead>
                                            <TableHead className="text-center font-semibold" style={{ minWidth: '110px' }}>Đơn vị</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="flex-1">
                                        {purchaseOrder.purchaseOrderDetails && purchaseOrder.purchaseOrderDetails.length > 0 ? (
                                            purchaseOrder.purchaseOrderDetails.map((item, index) => {
                                                // packageQuantity là số thùng, tính số đơn vị = số thùng × đơn vị/thùng
                                                const totalUnits = item.unitPerPacking > 0
                                                    ? (item.packageQuantity || 0) * item.unitPerPacking
                                                    : 0;
                                                return (
                                                    <TableRow key={item.purchaseOrderDetailId} className="border-b">
                                                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                                        <TableCell className="font-semibold">{item.goodsCode || item.goodsId || '-'}</TableCell>
                                                        <TableCell className="text-gray-600">{item.goodsName}</TableCell>
                                                        <TableCell className="text-center text-gray-600">{item.unitPerPacking || '-'}</TableCell>
                                                        <TableCell className="text-center font-semibold">{item.packageQuantity || 0}</TableCell>
                                                        <TableCell className="text-center font-semibold">{totalUnits}</TableCell>
                                                        <TableCell className="text-center text-gray-600">{item.unitMeasureName || '-'}</TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                                    Không có hàng hóa nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {/* Total Row */}
                                        {purchaseOrder.purchaseOrderDetails && purchaseOrder.purchaseOrderDetails.length > 0 && (
                                            <TableRow className="bg-gray-100 font-bold border-t border-gray-300">
                                                <TableCell colSpan={4} className="text-right pr-2">Tổng:</TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {purchaseOrder.purchaseOrderDetails.reduce((sum, item) => sum + (item.packageQuantity || 0), 0)}
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {purchaseOrder.purchaseOrderDetails.reduce((sum, item) => {
                                                        const totalUnits = item.unitPerPacking > 0
                                                            ? (item.packageQuantity || 0) * item.unitPerPacking
                                                            : 0;
                                                        return sum + totalUnits;
                                                    }, 0)}
                                                </TableCell>
                                                <TableCell className="text-center"></TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Ghi chú */}
                            {(purchaseOrder.note || (canSubmitDraft() || canResubmit())) && (
                                <div className="bg-gray-200 rounded-lg p-4 mt-6">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <FileText className="h-4 w-4 text-gray-600" />
                                        <h3 className="text-sm font-semibold text-gray-700">Ghi chú:</h3>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-300 min-h-[60px]">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {purchaseOrder.note || 'Không có ghi chú'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Action Buttons at bottom of card */}
                            <div className="mt-6 flex justify-center space-x-4">
                                {canEdit() && (
                                    <Button
                                        onClick={() => navigate(`/purchase-orders/update/${purchaseOrder.purchaseOderId}`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Cập nhật
                                    </Button>
                                )}

                                {canSubmitDraft() && (
                                    <Button
                                        onClick={() => setShowSubmitDraftModal(true)}
                                        className="bg-orange-600 hover:bg-orange-700 text-white h-[38px] px-8"
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Gửi phê duyệt
                                    </Button>
                                )}

                                {canResubmit() && (
                                    <Button
                                        onClick={() => setShowSubmitDraftModal(true)}
                                        className="bg-orange-600 hover:bg-orange-700 text-white h-[38px] px-8"
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Gửi phê duyệt
                                    </Button>
                                )}

                                {canApprove() && (
                                    <Button
                                        onClick={() => setShowApprovalModal(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white h-[38px] px-8"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Duyệt đơn hàng
                                    </Button>
                                )}

                                {canReject() && (
                                    <Button
                                        onClick={() => setShowRejectionModal(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white h-[38px] px-8"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Từ chối đơn hàng
                                    </Button>
                                )}

                                {canConfirmGoodsReceived() && (
                                    <Button
                                        onClick={() => setShowConfirmGoodsReceivedModal(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8"
                                    >
                                        <Package className="h-4 w-4 mr-2" />
                                        Xác nhận hàng đã đến
                                    </Button>
                                )}
                                {(canAssignReceiving() || canReAssignReceiving()) && (
                                    <Button
                                        onClick={() => setShowAssignReceivingModal(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white h-[38px] px-8"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        {canReAssignReceiving() ? 'Giao lại cho nhân viên' : 'Giao cho nhân viên'}
                                    </Button>
                                )}
                                {canStartReceive() && (
                                    <Button
                                        onClick={() => setShowStartReceiveModal(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white h-[38px] px-8"
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Bắt đầu tiếp nhận
                                    </Button>
                                )}

                                {canConfirmOrdered() && (
                                    <Button
                                        onClick={() => setShowConfirmOrderedModal(true)}
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white h-[38px] px-8"
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Xác nhận đã đặt hàng
                                    </Button>
                                )}

                                {canChangeDeliveryDate() && (
                                    <Button
                                        onClick={() => setShowChangeDeliveryDateModal(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8"
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Thay đổi ngày dự kiến nhập
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-200 rounded-lg p-6 h-full">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <h3 className="font-bold text-gray-800">Tình trạng</h3>
                        </div>

                        {/* Status Display */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span className="text-xs font-medium text-gray-700">Trạng thái đơn hàng</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(purchaseOrder.status)}`}>
                                    {getStatusIcon(purchaseOrder.status)}
                                    <span>{getStatusText(purchaseOrder.status)}</span>
                                </span>
                            </div>
                        </div>

                        {/* User Information Display */}
                        <UserInfoDisplay
                            order={purchaseOrder}
                            formatDate={formatDate}
                            hasPermission={hasPermission}
                            userInfo={null}
                        />
                    </div>
                </div>
            </div>
            {/* Approval Confirmation Modal */}
            <ApprovalConfirmationModal
                isOpen={showApprovalModal}
                onClose={() => setShowApprovalModal(false)}
                onConfirm={handleApprovalConfirm}
                purchaseOrder={purchaseOrder}
                loading={approvalLoading}
            />

            {/* Rejection Confirmation Modal */}
            <RejectionConfirmationModal
                isOpen={showRejectionModal}
                onClose={() => setShowRejectionModal(false)}
                onConfirm={handleRejectionConfirm}
                purchaseOrder={purchaseOrder}
                loading={rejectionLoading}
            />

            {/* Confirm Goods Received Modal */}
            <ConfirmGoodsReceivedModal
                isOpen={showConfirmGoodsReceivedModal}
                onClose={() => setShowConfirmGoodsReceivedModal(false)}
                onConfirm={handleConfirmGoodsReceived}
                purchaseOrder={purchaseOrder}
                loading={confirmGoodsReceivedLoading}
            />
            <AssignReceivingModal
                isOpen={showAssignReceivingModal}
                onClose={() => setShowAssignReceivingModal(false)}
                onConfirm={handleAssignReceiving}
                purchaseOrder={purchaseOrder}
                loading={assignReceivingLoading}
            />

            {/* Start Receive Modal */}
            <StartReceiveModal
                isOpen={showStartReceiveModal}
                onClose={() => setShowStartReceiveModal(false)}
                onConfirm={handleStartReceive}
                purchaseOrder={purchaseOrder}
                loading={startReceiveLoading}
            />

            {/* Submit Draft Confirmation Modal */}
            <SubmitDraftConfirmationModal
                isOpen={showSubmitDraftModal}
                onClose={() => setShowSubmitDraftModal(false)}
                onConfirm={handleSubmitDraftConfirm}
                purchaseOrder={purchaseOrder}
                loading={submitLoading}
            />

            {/* Confirm Ordered Modal */}
            <ConfirmOrderedModal
                isOpen={showConfirmOrderedModal}
                onClose={() => setShowConfirmOrderedModal(false)}
                onConfirm={handleConfirmOrdered}
                purchaseOrder={purchaseOrder}
                loading={confirmOrderedLoading}
                mode="confirm"
            />

            {/* Change Delivery Date Modal */}
            <ConfirmOrderedModal
                isOpen={showChangeDeliveryDateModal}
                onClose={() => setShowChangeDeliveryDateModal(false)}
                onConfirm={handleChangeDeliveryDate}
                purchaseOrder={purchaseOrder}
                loading={changeDeliveryDateLoading}
                mode="change"
            />
        </div>
    );
};
export default PurchaseOrderDetail;
