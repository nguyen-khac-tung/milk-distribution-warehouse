import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Package, User, Calendar, CheckCircle, XCircle, Clock, Truck, CheckSquare, Key, Building2, FileText, Hash, Shield, ShoppingCart, Users, UserCheck, UserX, TruckIcon, Store, UserCircle, UserCog, UserCheck2, UserX2, UserMinus, Mail, MapPin, Phone } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { getSalesOrderDetail } from '../../services/SalesOrderService';
import { SALES_ORDER_STATUS } from '../../utils/permissions';
import { STATUS_LABELS } from '../../components/SaleOrderCompoents/StatusDisplaySaleOrder';

const SalesOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [salesOrder, setSalesOrder] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalesOrderDetail = async () => {
            try {
                setLoading(true);
                const response = await getSalesOrderDetail(id);
                if (response && response.success) {
                    setSalesOrder(response.data);
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
            4: 'bg-green-100 text-green-800', // Approved
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
                            <p>URL: /SalesOrder/GetSalesOrderDetail/{id}</p>
                        </div>
                        <Button onClick={() => navigate('/sales-orders')} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
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
                            onClick={() => navigate('/sales-orders')}
                            className="flex items-center space-x-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Quay lại</span>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">ĐƠN XUẤT HÀNG</h1>
                            <p className="text-gray-600">Mã xuất hàng: {salesOrder.salesOrderId}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Side */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border-2 border-gray-400 rounded-lg p-6 h-full flex flex-col">
                            {/* Title */}
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 uppercase">ĐƠN XUẤT HÀNG</h1>
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
                                                <Store className="h-4 w-4 text-green-600" />
                                                <label className="font-medium text-gray-700">Đại lý:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{salesOrder.retailerName || '—'}</span>
                                        </div>

                                        <div className="grid grid-cols-[auto_1fr] gap-x-2">
                                            <div className="flex items-center space-x-1">
                                                <MapPin className="h-4 w-4 text-red-600" />
                                                <label className="font-medium text-gray-700">Địa chỉ:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">{salesOrder.retailerAddress || '—'}</span>
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
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                                <label className="font-medium text-gray-700">Thời gian dự kiến xuất:</label>
                                            </div>
                                            <span className="font-semibold text-gray-900">
                                                {formatDate(salesOrder.estimatedTimeDeparture)}
                                            </span>
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
                                            <TableHead className="font-semibold">Tên hàng hóa</TableHead>
                                            <TableHead className="font-semibold">Mã hàng</TableHead>
                                            <TableHead className="text-center font-semibold">Đơn vị tính</TableHead>
                                            <TableHead className="text-center font-semibold">Số lượng thùng</TableHead>
                                            <TableHead className="text-center font-semibold">Số lượng đơn vị</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="flex-1">
                                        {salesOrder.salesOrderItemDetails && salesOrder.salesOrderItemDetails.length > 0 ? (
                                            salesOrder.salesOrderItemDetails.map((item, index) => (
                                                <TableRow key={item.salesOrderDetailId} className="border-b">
                                                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{item.goods.goodsName}</TableCell>
                                                    <TableCell className="text-gray-600">{item.goods.goodsCode}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{item.goods.unitMeasureName}</TableCell>
                                                    <TableCell className="text-center font-semibold">{item.packageQuantity}</TableCell>
                                                    <TableCell className="text-center font-semibold">
                                                        {item.packageQuantity * (item.goodsPacking?.unitPerPackage || 1)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                                    Không có sản phẩm nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {/* Total Row */}
                                        {salesOrder.salesOrderItemDetails && salesOrder.salesOrderItemDetails.length > 0 && (
                                            <TableRow className="bg-gray-100 font-bold border-t border-gray-300">
                                                <TableCell colSpan={4} className="text-right pr-2">Tổng:</TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {salesOrder.salesOrderItemDetails.reduce((sum, item) => sum + (item.packageQuantity || 0), 0)}
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {salesOrder.salesOrderItemDetails.reduce((sum, item) =>
                                                        sum + (item.packageQuantity * (item.goodsPacking?.unitPerPackage || 1)), 0)}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
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

                        {/* Created By */}
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
                                    value={salesOrder.createdBy?.fullName || 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={formatDate(salesOrder.createdAt)}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>

                        {/* Approval By */}
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
                                    value={salesOrder.approvalBy?.fullName || 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={salesOrder.approvalBy ? formatDate(salesOrder.updatedAt) : 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>

                        {/* Acknowledged By */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <UserX2 className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium text-gray-700">Xác nhận bởi</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="text"
                                    value={salesOrder.acknowledgedBy?.fullName || 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={salesOrder.acknowledgedBy ? formatDate(salesOrder.updatedAt) : 'Chưa có thông tin'}
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
                                    value={salesOrder.assignTo?.fullName || 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={salesOrder.assignTo ? formatDate(salesOrder.updatedAt) : 'Chưa có thông tin'}
                                    readOnly
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesOrderDetail;