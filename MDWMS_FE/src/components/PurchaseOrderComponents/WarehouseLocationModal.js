import { createPortal } from "react-dom"
import { Warehouse, MapPin, X } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"

const WarehouseLocationModal = ({ isOpen, onClose, locationData = [], loading = false }) => {
    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 99999, top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-100 relative z-[100000]">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                                <Warehouse className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Thông Tin Vị Trí Kho</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Xem số lượng vị trí còn trống trong từng khu vực</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                <p className="text-slate-600">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : locationData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                                <MapPin className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-slate-600 text-lg">Không có dữ liệu vị trí kho</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium mb-1">Tổng Khu Vực</p>
                                            <p className="text-2xl font-bold text-blue-700">{locationData.length}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                                            <Warehouse className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-600 font-medium mb-1">Tổng Vị Trí</p>
                                            <p className="text-2xl font-bold text-green-700">
                                                {locationData.reduce((sum, area) => sum + (area.totalLocations || 0), 0)}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                                            <MapPin className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-orange-600 font-medium mb-1">Vị Trí Còn Trống</p>
                                            <p className="text-2xl font-bold text-orange-700">
                                                {locationData.reduce((sum, area) => sum + (area.availableLocationCount || 0), 0)}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center">
                                            <MapPin className="h-6 w-6 text-orange-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                                            <TableHead className="text-slate-700 font-semibold">STT</TableHead>
                                            <TableHead className="text-slate-700 font-semibold">Tên Khu Vực</TableHead>
                                            <TableHead className="text-slate-700 font-semibold text-right">Tổng Vị Trí</TableHead>
                                            <TableHead className="text-slate-700 font-semibold text-right">Đã Sử Dụng</TableHead>
                                            <TableHead className="text-slate-700 font-semibold text-right">Còn Trống</TableHead>
                                            <TableHead className="text-slate-700 font-semibold text-right">Tỷ Lệ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {locationData.map((area, index) => {
                                            const used = (area.totalLocations || 0) - (area.availableLocationCount || 0);
                                            const percentage = area.totalLocations > 0 
                                                ? ((area.availableLocationCount || 0) / area.totalLocations * 100).toFixed(1)
                                                : 0;
                                            const isLowCapacity = percentage < 20;
                                            const isMediumCapacity = percentage >= 20 && percentage < 50;
                                            
                                            return (
                                                <TableRow key={area.areaId} className="hover:bg-gray-50">
                                                    <TableCell className="text-slate-700">{index + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-3 w-3 rounded-full ${isLowCapacity ? 'bg-red-500' : isMediumCapacity ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                            <span className="font-medium text-slate-700">{area.areaName || 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-slate-700 font-medium">
                                                        {area.totalLocations || 0}
                                                    </TableCell>
                                                    <TableCell className="text-right text-slate-600">
                                                        {used}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`font-semibold ${isLowCapacity ? 'text-red-600' : isMediumCapacity ? 'text-yellow-600' : 'text-green-600'}`}>
                                                            {area.availableLocationCount || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full ${isLowCapacity ? 'bg-red-500' : isMediumCapacity ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className={`text-sm font-medium min-w-[45px] text-right ${isLowCapacity ? 'text-red-600' : isMediumCapacity ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                {percentage}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Lưu ý</h4>
                                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                            <li>Vị trí còn trống là số lượng vị trí có thể sử dụng trong từng khu vực</li>
                                            <li>Màu đỏ: Dưới 20% còn trống (cần chú ý)</li>
                                            <li>Màu vàng: 20-50% còn trống (trung bình)</li>
                                            <li>Màu xanh: Trên 50% còn trống (đủ chỗ)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg"
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default WarehouseLocationModal;

