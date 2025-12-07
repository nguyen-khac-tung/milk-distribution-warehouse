import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Package, User, Calendar, CheckCircle, XCircle, Clock, Truck, CheckSquare, FileText, Hash, Shield, ShoppingCart, Users, UserCheck, UserX, TruckIcon, Store, UserCircle, UserCog, UserCheck2, UserX2, UserMinus, Mail, MapPin, Phone, Pencil, Eye } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { getSalesOrderDetail, updateSaleOrderStatusPendingApproval, approveSalesOrder, rejectSalesOrder, assignForPicking } from '../../services/SalesOrderService';
import { SALES_ORDER_STATUS, canPerformSalesOrderDetailAction } from '../../utils/permissions';
import { STATUS_LABELS } from '../../components/SaleOrderCompoents/StatusDisplaySaleOrder';
import UserInfoDisplay from '../../components/SaleOrderCompoents/UserInfoDisplay';
import SubmitDraftModal from '../../components/SaleOrderCompoents/SubmitDraftModal';
import ApprovalConfirmationModal from '../../components/SaleOrderCompoents/ApprovalConfirmationModal';
import RejectionConfirmationModal from '../../components/SaleOrderCompoents/RejectionConfirmationModal';
import AssignPickingModal from '../../components/SaleOrderCompoents/AssignPickingModal';
import CreateDeliverySlipModal from '../../components/SaleOrderCompoents/CreateDeliverySlipModal';
import { usePermissions } from '../../hooks/usePermissions';
import { cleanErrorMessage, extractErrorMessage } from '../../utils/Validation';
import { createGoodsIssueNote, getDetailGoodsIssueNote } from '../../services/GoodsIssueNoteService';
import { ComponentIcon } from '../../components/IconComponent/Icon';

const SalesOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [salesOrder, setSalesOrder] = useState(null);
    const [error, setError] = useState(null);
    const [hasGoodsIssueNote, setHasGoodsIssueNote] = useState(false);
    const [showSubmitDraftModal, setShowSubmitDraftModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showAssignPickingModal, setShowAssignPickingModal] = useState(false);
    const [showCreateDeliverySlipModal, setShowCreateDeliverySlipModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [approvalLoading, setApprovalLoading] = useState(false);
    const [rejectionLoading, setRejectionLoading] = useState(false);
    const [assignPickingLoading, setAssignPickingLoading] = useState(false);
    const [createDeliverySlipLoading, setCreateDeliverySlipLoading] = useState(false);
    const { hasPermission, isWarehouseManager, isWarehouseStaff } = usePermissions();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    useEffect(() => {
        const fetchSalesOrderDetail = async () => {
            try {
                setLoading(true);
                const response = await getSalesOrderDetail(id);
                if (response && response.success) {
                    setSalesOrder(response.data);
                    // Check if goods issue note exists
                    try {
                        const goodsIssueNoteResponse = await getDetailGoodsIssueNote(id);
                        if (goodsIssueNoteResponse && goodsIssueNoteResponse.success && goodsIssueNoteResponse.data) {
                            setHasGoodsIssueNote(true);
                        } else {
                            setHasGoodsIssueNote(false);
                        }
                    } catch (err) {
                        // If error, means goods issue note doesn't exist yet
                        setHasGoodsIssueNote(false);
                    }
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
            fetchSalesOrderDetail();
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

    const canApprove = () => canPerformSalesOrderDetailAction('approve', salesOrder, hasPermission, userInfo);
    const canReject = () => canPerformSalesOrderDetailAction('reject', salesOrder, hasPermission, userInfo);
    const canSubmitDraft = () => canPerformSalesOrderDetailAction('submit_pending_approval', salesOrder, hasPermission, userInfo);
    const canAssignForPicking = () => canPerformSalesOrderDetailAction('assign_for_picking', salesOrder, hasPermission, userInfo);
    const canCreateDeliverySlip = () => canPerformSalesOrderDetailAction('create_delivery_slip', salesOrder, hasPermission, userInfo);

    const handleSubmitDraftConfirm = async () => {
        setSubmitLoading(true);
        try {
            await updateSaleOrderStatusPendingApproval({
                salesOrderId: salesOrder.salesOrderId
            });

            if (window.showToast) {
                window.showToast("Gửi phê duyệt thành công!", "success");
            }

            setShowSubmitDraftModal(false);

            // Refresh data after successful submission
            const response = await getSalesOrderDetail(id);
            if (response && response.success) {
                setSalesOrder(response.data);
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

    const handleApprovalConfirm = async (approvalNote = "") => {
        setApprovalLoading(true);
        try {
            await approveSalesOrder({
                salesOrderId: salesOrder.salesOrderId
            });

            if (window.showToast) {
                window.showToast("Duyệt đơn hàng thành công!", "success");
            }
            setShowApprovalModal(false);
            const response = await getSalesOrderDetail(id);
            if (response && response.success) {
                setSalesOrder(response.data);
            }
        } catch (error) {
            console.error("Error approving sales order:", error);
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi duyệt đơn hàng")

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
            await rejectSalesOrder({
                salesOrderId: salesOrder.salesOrderId,
                rejectionReason: rejectionReason
            });

            if (window.showToast) {
                window.showToast("Từ chối đơn hàng thành công!", "success");
            }

            setShowRejectionModal(false);

            // Refresh data after successful rejection
            const response = await getSalesOrderDetail(id);
            if (response && response.success) {
                setSalesOrder(response.data);
            }
        } catch (error) {
            console.error("Error rejecting sales order:", error);
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi từ chối đơn hàng")

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
            await assignForPicking({
                salesOrderId: salesOrder.salesOrderId,
                assignTo: assignTo
            });

            if (window.showToast) {
                window.showToast("Phân công lấy hàng thành công!", "success");
            }
            setShowAssignPickingModal(false);
            const response = await getSalesOrderDetail(id);
            if (response && response.success) {
                setSalesOrder(response.data);
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

    const handleCreateDeliverySlip = async (note) => {
        setCreateDeliverySlipLoading(true);
        try {
            await createGoodsIssueNote({
                salesOrderId: salesOrder.salesOrderId,
                note: note
            });

            if (window.showToast) {
                window.showToast("Tạo phiếu xuất kho thành công!", "success");
            }
            setShowCreateDeliverySlipModal(false);
            // Set hasGoodsIssueNote to true after successful creation
            setHasGoodsIssueNote(true);
            const response = await getSalesOrderDetail(id);
            if (response && response.success) {
                setSalesOrder(response.data);
            }
        } catch (error) {
            console.error("Error creating delivery slip:", error);
            if (window.showToast) {
                window.showToast("", "error");
            }
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi tạo phiếu xuất kho")

            if (window.showToast) {
                window.showToast(message, "error");
            }
        } finally {
            setCreateDeliverySlipLoading(false);
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
                            <p><span className="font-semibold">URL:</span> /SalesOrder/GetSalesOrderDetail/{id}</p>
                        </div>

                        {/* Nút quay lại */}
                        <Button
                            onClick={() => navigate('/sales-orders')}
                            className="w-full h-[42px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all"
                        >
                            <ComponentIcon name="arrowBackCircleOutline" size={22} color="#fff" />
                            <span>Quay lại danh sách đơn bán hàng</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!salesOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy</h3>
                        <p className="text-gray-600 mb-4">Đơn hàng không tồn tại hoặc đã bị xóa</p>
                        <Button onClick={() => navigate('/sales-orders')} variant="outline">
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
                                    onClick={() => navigate('/sales-orders')}
                                    className="text-slate-600 hover:bg-slate-50"
                                >
                                    <ComponentIcon name="arrowBackCircleOutline" size={28} />
                                    {/* Quay lại */}
                                </Button>

                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-slate-600 m-0">ĐƠN BÁN HÀNG</h1>
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
                                <h1 className="text-2xl font-bold text-gray-900 uppercase">ĐƠN BÁN HÀNG</h1>
                            </div>

                            {/* General Information */}
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
                                                <Hash className="h-4 w-4 text-gray-600" />
                                                <label className="font-medium text-gray-700">Mã bán hàng:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{salesOrder.salesOrderId || '—'}</span>
                                        </div>

                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <Store className="h-4 w-4 text-green-600" />
                                                <label className="font-medium text-gray-700">Nhà bán lẻ:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{salesOrder.retailerName || '—'}</span>
                                        </div>

                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                                <label className="font-medium text-gray-700">Thời gian dự kiến xuất:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">
                                                {formatDate(salesOrder.estimatedTimeDeparture)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cột phải */}
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <Phone className="h-4 w-4 text-blue-600" />
                                                <label className="font-medium text-gray-700">SĐT:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{salesOrder.retailerPhone || '—'}</span>
                                        </div>

                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <Mail className="h-4 w-4 text-orange-600" />
                                                <label className="font-medium text-gray-700">Email:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{salesOrder.retailerEmail || '—'}</span>
                                        </div>

                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <MapPin className="h-4 w-4 text-red-600" />
                                                <label className="font-medium text-gray-700">Địa chỉ:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{salesOrder.retailerAddress || '—'}</span>
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
                                            <TableHead className="font-semibold">Mã hàng hóa</TableHead>
                                            <TableHead className="font-semibold">Tên hàng hóa</TableHead>
                                            <TableHead className="text-center font-semibold leading-tight">
                                                <div className="flex flex-col items-center">
                                                    <span className="whitespace-nowrap">Đơn vị</span>
                                                    <span className="whitespace-nowrap">/thùng</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-center font-semibold">Số thùng</TableHead>
                                            <TableHead className="text-center font-semibold max-w-[100px]">Tổng số đơn vị</TableHead>
                                            <TableHead className="text-center font-semibold whitespace-nowrap">Đơn vị</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="flex-1">
                                        {salesOrder.salesOrderItemDetails && salesOrder.salesOrderItemDetails.length > 0 ? (
                                            salesOrder.salesOrderItemDetails.map((item, index) => (
                                                <TableRow key={item.salesOrderDetailId} className="border-b">
                                                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{item.goods.goodsCode}</TableCell>
                                                    <TableCell className="text-left">{item.goods.goodsName}</TableCell>
                                                    <TableCell className="text-center font-semibold">{item.goodsPacking.unitPerPackage}</TableCell>
                                                    <TableCell className="text-center font-semibold">{item.packageQuantity}</TableCell>
                                                    <TableCell className="text-center font-semibold">{item.packageQuantity * item.goodsPacking.unitPerPackage}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{item.goods.unitMeasureName}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                                    Không có hàng hóa nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {/* Total Row */}
                                        {salesOrder.salesOrderItemDetails && salesOrder.salesOrderItemDetails.length > 0 && (
                                            <TableRow className="bg-gray-100 font-bold border-t border-gray-300">
                                                <TableCell colSpan={4} className="text-right pr-2 bg-gray-100">Tổng:</TableCell>
                                                <TableCell className="text-center font-bold bg-gray-100">
                                                    {salesOrder.salesOrderItemDetails.reduce(
                                                        (sum, item) => sum + item.packageQuantity,
                                                        0
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center font-bold bg-gray-100">
                                                    {salesOrder.salesOrderItemDetails.reduce(
                                                        (sum, item) =>
                                                            sum + item.packageQuantity * (item.goodsPacking?.unitPerPackage || 1),
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
                            {salesOrder.note && (
                                <div className="mt-4 bg-gray-50 border border-gray-300 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-semibold text-gray-800">Ghi chú:</h4>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{salesOrder.note}</p>
                                </div>
                            )}

                            {/* Action Buttons at bottom of card */}
                            <div className="mt-6 flex justify-center space-x-4">
                                {canSubmitDraft() && (
                                    <>
                                        <Button
                                            onClick={() => navigate(`/sales-orders/update/${salesOrder.salesOrderId}`)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white h-[38px] px-8"
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Cập nhật
                                        </Button>
                                        <Button
                                            onClick={() => setShowSubmitDraftModal(true)}
                                            className="bg-orange-600 hover:bg-orange-700 text-white h-[38px] px-8"
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            {salesOrder?.status === SALES_ORDER_STATUS.Rejected ? 'Gửi phê duyệt lại' : 'Gửi phê duyệt'}
                                        </Button>
                                    </>
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

                                {canAssignForPicking() && (
                                    <Button
                                        onClick={() => setShowAssignPickingModal(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8"
                                    >
                                        <Truck className="h-4 w-4 mr-2" />
                                        {salesOrder?.status === SALES_ORDER_STATUS.AssignedForPicking ? 'Phân công lại' : 'Phân công lấy hàng'}
                                    </Button>
                                )}

                                {canCreateDeliverySlip() && (
                                    <Button
                                        onClick={() => setShowCreateDeliverySlipModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-[38px] px-8"
                                    >
                                        <Package className="h-4 w-4 mr-2" />
                                        Tạo phiếu xuất kho
                                    </Button>
                                )}
                                {(isWarehouseManager || isWarehouseStaff) && hasGoodsIssueNote && (
                                    <Button
                                        onClick={() => navigate(`/goods-issue-note-detail/${salesOrder.salesOrderId}`)}
                                        className="h-[38px] px-8 bg-green-700 hover:bg-green-900 text-white"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Xem phiếu xuất kho
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
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(salesOrder.status)}`}>
                                    {getStatusIcon(salesOrder.status)}
                                    <span className="ml-1">{STATUS_LABELS[salesOrder.status] || 'Không xác định'}</span>
                                </span>
                            </div>
                        </div>

                        <UserInfoDisplay
                            order={salesOrder}
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
                saleOrder={salesOrder}
                loading={submitLoading}
            />

            {/* Approval Confirmation Modal */}
            <ApprovalConfirmationModal
                isOpen={showApprovalModal}
                onClose={() => setShowApprovalModal(false)}
                onConfirm={handleApprovalConfirm}
                saleOrder={salesOrder}
                loading={approvalLoading}
            />

            {/* Rejection Confirmation Modal */}
            <RejectionConfirmationModal
                isOpen={showRejectionModal}
                onClose={() => setShowRejectionModal(false)}
                onConfirm={handleRejectionConfirm}
                saleOrder={salesOrder}
                loading={rejectionLoading}
            />

            {/* Assign Picking Modal */}
            <AssignPickingModal
                isOpen={showAssignPickingModal}
                onClose={() => setShowAssignPickingModal(false)}
                onConfirm={handleAssignPicking}
                saleOrder={salesOrder}
                loading={assignPickingLoading}
            />

            {/* Create Delivery Slip Modal */}
            <CreateDeliverySlipModal
                isOpen={showCreateDeliverySlipModal}
                onClose={() => setShowCreateDeliverySlipModal(false)}
                onConfirm={handleCreateDeliverySlip}
                saleOrder={salesOrder}
                loading={createDeliverySlipLoading}
            />


        </div>
    );
};

export default SalesOrderDetail;