import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Package, User, Calendar, CheckCircle, XCircle, Clock, Truck, CheckSquare, Trash2, Key, Building2, FileText, Hash, Shield, ShoppingCart, Users, UserCheck, UserX, TruckIcon, UserPlus, Store, UserCircle, UserCog, UserCheck2, UserX2, UserMinus, Mail, Phone, MapPin } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { getPurchaseOrderDetail } from '../../services/PurchaseOrderService';
import ApprovalConfirmationModal from '../../components/PurchaseOrderComponents/ApprovalConfirmationModal';
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
    const [approvalLoading, setApprovalLoading] = useState(false);

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
            9: 'bg-emerald-100 text-emerald-800' // Completed
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
            9: <CheckCircle className="h-3 w-3" /> // Completed
        };
        return statusIcons[status] || <Clock className="h-3 w-3" />;
    };

    const getStatusText = (status) => {
        const statusTexts = {
            1: 'Nháp',
            2: 'Chờ duyệt',
            3: 'Đã từ chối',
            4: 'Đã duyệt',
            5: 'Đã nhận hàng',
            6: 'Đã giao cho',
            7: 'Đang nhận hàng',
            8: 'Đã kiểm tra',
            9: 'Hoàn thành'
        };
        return statusTexts[status] || 'Không xác định';
    };
    const handleApprovalConfirm = async () => {
        setApprovalLoading(true);
        try {
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
            if (window.showToast) {
                window.showToast("Có lỗi xảy ra khi duyệt đơn hàng", "error");
            }
        } finally {
            setApprovalLoading(false);
        }
    };
    const canApprove = () => {
        return hasPermission(PERMISSIONS.PURCHASE_ORDER_APPROVAL_REQUEST) &&
            purchaseOrder?.status === PURCHASE_ORDER_STATUS.PendingApproval;
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
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
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
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
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
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/purchase-orders')}
                            className="flex items-center space-x-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Quay lại</span>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">ĐƠN NHẬP HÀNG</h1>
                            <p className="text-gray-600">Mã đơn hàng: {purchaseOrder.purchaseOderId}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Side */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border-2 border-gray-400 rounded-lg p-6 h-full flex flex-col">
                            {/* Title */}
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 uppercase">ĐƠN NHẬP HÀNG</h1>
                            </div>
                            {/* General Information */}
                            <div className="bg-gray-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center space-x-2 mb-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-bold text-gray-800">Thông tin chung</h3>
                                </div>
                                <div className="space-y-3">
                                    {/* Supplier and Address on same line */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Left: Supplier */}
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-2">
                                                <Store className="h-4 w-4 text-green-600" />
                                                <label className="text-sm font-medium text-gray-700">Nhà cung cấp:</label>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded border">
                                                {purchaseOrder.supplierName || 'Chưa có thông tin'}
                                            </span>
                                        </div>
                                        
                                        {/* Right: Address */}
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="h-4 w-4 text-red-600" />
                                                <label className="text-sm font-medium text-gray-700">Địa chỉ:</label>
                                            </div>
                                            <span className="text-sm text-gray-900 bg-gray-200 px-3 py-1 rounded border">
                                                {purchaseOrder.address || 'Chưa có thông tin'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Email and Phone on same line */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Left: Email */}
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-2">
                                                <Mail className="h-4 w-4 text-orange-600" />
                                                <label className="text-sm font-medium text-gray-700">Email:</label>
                                            </div>
                                            <span className="text-sm text-gray-900 bg-gray-200 px-3 py-1 rounded border">
                                                {purchaseOrder.email || 'Chưa có thông tin'}
                                            </span>
                                        </div>
                                        
                                        {/* Right: Phone */}
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-2">
                                                <Phone className="h-4 w-4 text-blue-600" />
                                                <label className="text-sm font-medium text-gray-700">SĐT:</label>
                                            </div>
                                            <span className="text-sm text-gray-900 bg-gray-200 px-3 py-1 rounded border">
                                                {purchaseOrder.phone || 'Chưa có thông tin'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {purchaseOrder.note && (
                                        <div className="flex items-start space-x-2">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="h-4 w-4 text-blue-600 mt-1" />
                                                <label className="text-sm font-medium text-gray-700">Ghi chú:</label>
                                            </div>
                                            <div className="text-sm text-gray-900 bg-gray-200 px-3 py-1 rounded border flex-1">
                                                {purchaseOrder.note}
                                            </div>
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
                                            <TableHead className="font-semibold">Tên hàng hóa</TableHead>
                                            <TableHead className="font-semibold">Mã hàng</TableHead>
                                            <TableHead className="text-center font-semibold">Đơn vị tính</TableHead>
                                            <TableHead className="text-center font-semibold">Đơn vị/thùng</TableHead>
                                            <TableHead className="text-center font-semibold">Số lượng</TableHead>
                                            <TableHead className="text-center font-semibold">Số thùng</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="flex-1">
                                        {purchaseOrder.purchaseOrderDetails && purchaseOrder.purchaseOrderDetails.length > 0 ? (
                                            purchaseOrder.purchaseOrderDetails.map((item, index) => {
                                                const numberOfBoxes = item.unitPerPacking > 0
                                                    ? Math.floor(item.packageQuantity / item.unitPerPacking)
                                                    : 0;
                                                return (
                                                    <TableRow key={item.purchaseOrderDetailId} className="border-b">
                                                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{item.goodsName}</TableCell>
                                                        <TableCell className="text-gray-600">{item.goodsCode || item.goodsId || '-'}</TableCell>
                                                        <TableCell className="text-center text-gray-600">{item.unitMeasureName || '-'}</TableCell>
                                                        <TableCell className="text-center text-gray-600">{item.unitPerPacking || '-'}</TableCell>
                                                        <TableCell className="text-center font-semibold">{item.packageQuantity || 0}</TableCell>
                                                        <TableCell className="text-center font-semibold">{numberOfBoxes}</TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                                    Không có sản phẩm nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {/* Total Row */}
                                        {purchaseOrder.purchaseOrderDetails && purchaseOrder.purchaseOrderDetails.length > 0 && (
                                            <TableRow className="bg-gray-100 font-bold border-t border-gray-300">
                                                <TableCell colSpan={5} className="text-right pr-2">Tổng:</TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {purchaseOrder.purchaseOrderDetails.reduce((sum, item) => sum + (item.packageQuantity || 0), 0)}
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {purchaseOrder.purchaseOrderDetails.reduce((sum, item) => {
                                                        const numberOfBoxes = item.unitPerPacking > 0
                                                            ? Math.floor(item.packageQuantity / item.unitPerPacking)
                                                            : 0;
                                                        return sum + numberOfBoxes;
                                                    }, 0)}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Action Button at bottom of card */}
                            {canApprove() && (
                                <div className="mt-6 flex justify-center">
                                    <Button
                                        onClick={() => setShowApprovalModal(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white h-[38px] px-8"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Xác nhận chờ duyệt
                                    </Button>
                                </div>
                            )}
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
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <UserCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-gray-700">Tạo bởi</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="text"
                                    value={purchaseOrder.createdByName || 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={formatDate(purchaseOrder.createdAt)}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <UserCheck2 className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">Duyệt bởi</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="text"
                                    value={purchaseOrder.approvalByName || 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={purchaseOrder.approvalByName ? formatDate(purchaseOrder.updatedAt) : 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <UserX2 className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium text-gray-700">Từ chối bởi</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="text"
                                    value="Chưa có thông tin"
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value="Chưa có thông tin"
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                        {/* Assign To */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <UserCog className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-700">Giao cho</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="text"
                                    value={purchaseOrder.assignToByName || 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={purchaseOrder.assignToByName ? formatDate(purchaseOrder.updatedAt) : 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                        {/* Entered By */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <UserMinus className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-medium text-gray-700">Xác nhận hàng giao đến</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="text"
                                    value={purchaseOrder.arrivalConfirmedByName || 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={purchaseOrder.arrivalConfirmedByName ? formatDate(purchaseOrder.updatedAt) : 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
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
        </div>
    );
};

export default PurchaseOrderDetail;
