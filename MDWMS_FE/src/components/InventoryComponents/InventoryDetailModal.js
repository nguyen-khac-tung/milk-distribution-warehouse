import React from 'react';
import { X, Package, MapPin, Calendar, Building2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const InventoryDetailModal = ({ isOpen, onClose, item }) => {
    if (!isOpen || !item) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    };

    const pallets = item.pallets || [];
    const locations = item.locations || [];

    // Tính số hộp từ số thùng và quy cách đóng gói
    const totalPackageQuantity = item.totalPackageQuantity || 0;
    const unitPerPackage = item.unitPerPackage || 0;
    const totalBoxQuantity = totalPackageQuantity * unitPerPackage;
    // Lấy tên đơn vị từ UnitMeasure (có thể là unitMeasureName hoặc unitOfMeasure)
    const unitMeasureName = item.unitMeasureName || item.unitOfMeasure || 'Hộp';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <Package className="h-6 w-6 text-orange-500" />
                        <div>
                            <h2 className="text-xl font-bold text-slate-700">Chi tiết tồn kho</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {item.goodName || item.goodsCode || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Thông tin cơ bản */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-orange-500" />
                            Thông tin lô hàng
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Mã lô</div>
                                <div className="text-sm font-semibold text-gray-900">{item.batchCode || '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Mã hàng hóa</div>
                                <div className="text-sm font-semibold text-gray-900">{item.goodsCode || '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Tên hàng hóa</div>
                                <div className="text-sm font-semibold text-gray-900">{item.goodName || '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Ngày sản xuất
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {formatDate(item.manufacturingDate)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Ngày hết hạn
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {formatDate(item.expiryDate)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Tổng số lượng</div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {totalPackageQuantity.toLocaleString("vi-VN")} thùng
                                </div>
                                {unitPerPackage > 0 && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        ({totalBoxQuantity.toLocaleString("vi-VN")} {unitMeasureName})
                                    </div>
                                )}
                            </div>
                            {item.companyName && (
                                <div className="col-span-2 md:col-span-3">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        Nhà cung cấp
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">{item.companyName}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Danh sách Pallet */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-500" />
                            Danh sách Pallet ({pallets.length})
                        </h3>
                        {pallets.length > 0 ? (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                    Mã Pallet
                                                </TableHead>
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                    Mã phiếu nhập
                                                </TableHead>
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                    Vị trí
                                                </TableHead>
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-right">
                                                    Số lượng
                                                </TableHead>
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                    Người tạo
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pallets.map((pallet, index) => (
                                                <TableRow
                                                    key={pallet.palletId || index}
                                                    className="hover:bg-slate-50 border-b border-slate-200"
                                                >
                                                    <TableCell className="px-4 py-3 text-slate-700 font-medium">
                                                        {pallet.palletId || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.goodsReceiptNoteId || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.locationCode || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700 text-right font-medium">
                                                        {pallet.packageQuantity?.toLocaleString("vi-VN") || 0}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {pallet.createByName || pallet.createBy || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 border border-slate-200 rounded-lg">
                                Không có pallet nào
                            </div>
                        )}
                    </div>

                    {/* Danh sách Vị trí */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-green-500" />
                            Danh sách Vị trí ({locations.length})
                        </h3>
                        {locations.length > 0 ? (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                    Mã vị trí
                                                </TableHead>
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                    Khu vực
                                                </TableHead>
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-left">
                                                    Rack
                                                </TableHead>
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">
                                                    Hàng
                                                </TableHead>
                                                <TableHead className="font-semibold text-slate-900 px-4 py-3 text-center">
                                                    Cột
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {locations.map((location, index) => (
                                                <TableRow
                                                    key={location.locationId || index}
                                                    className="hover:bg-slate-50 border-b border-slate-200"
                                                >
                                                    <TableCell className="px-4 py-3 text-slate-700 font-medium">
                                                        {location.locationCode || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        <div>
                                                            <div className="font-medium">{location.areaName || '-'}</div>
                                                            <div className="text-xs text-gray-500">{location.areaCode || '-'}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700">
                                                        {location.rack || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700 text-center">
                                                        {location.row || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-slate-700 text-center">
                                                        {location.column || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 border border-slate-200 rounded-lg">
                                Không có vị trí nào
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 bg-slate-50">
                    <Button
                        onClick={onClose}
                        className="h-[38px] bg-orange-500 hover:bg-orange-600 text-white px-6"
                    >
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InventoryDetailModal;

