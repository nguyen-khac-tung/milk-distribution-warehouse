import React from 'react';
import { X, FileText, AlertCircle, Download, Printer } from 'lucide-react';
import { Button } from '../ui/button';

const ViewDeliverySlipModal = ({
  isOpen,
  onClose,
  saleOrder,
  loading = false
}) => {
  const handleClose = () => {
    onClose();
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download delivery slip for:', saleOrder?.salesOrderId);
  };

  const handlePrint = () => {
    // TODO: Implement print functionality
    console.log('Print delivery slip for:', saleOrder?.salesOrderId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Phiếu xuất kho
              </h3>
              <p className="text-sm text-gray-500">
                Xem thông tin phiếu xuất kho
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Sale Order Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-gray-900">Thông tin đơn hàng</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-medium">{saleOrder?.salesOrderId || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nhà bán lẻ:</span>
                <span className="font-medium">{saleOrder?.retailerName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Người được phân công:</span>
                <span className="font-medium">{saleOrder?.assignTo?.fullName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thời gian dự kiến xuất:</span>
                <span className="font-medium">
                  {saleOrder?.estimatedTimeDeparture ? new Date(saleOrder.estimatedTimeDeparture).toLocaleDateString('vi-VN') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Slip Content */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
            <div className="text-center mb-4">
              <h4 className="text-lg font-bold text-gray-900">PHIẾU XUẤT KHO</h4>
              <p className="text-sm text-gray-600">Mã phiếu: {saleOrder?.salesOrderId || '-'}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Ngày tạo:</span>
                  <span className="ml-2">{new Date().toLocaleDateString('vi-VN')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Trạng thái:</span>
                  <span className="ml-2 text-green-600 font-semibold">Đang lấy hàng</span>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700">Nhà bán lẻ:</span>
                <span className="ml-2">{saleOrder?.retailerName || '-'}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Địa chỉ giao hàng:</span>
                <span className="ml-2">{saleOrder?.retailerAddress || '-'}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Người nhận:</span>
                <span className="ml-2">{saleOrder?.retailerName || '-'}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Số điện thoại:</span>
                <span className="ml-2">{saleOrder?.retailerPhone || '-'}</span>
              </div>
            </div>
          </div>

          {/* Product List */}
          {saleOrder?.salesOrderItemDetails && saleOrder.salesOrderItemDetails.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
              <h5 className="font-semibold text-gray-900 mb-3">Danh sách sản phẩm</h5>
              <div className="space-y-2">
                {saleOrder.salesOrderItemDetails.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="font-medium">{item.goods?.goodsName || '-'}</span>
                      <span className="text-gray-600 ml-2">({item.goods?.goodsCode || '-'})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{item.packageQuantity || 0} thùng</span>
                      <span className="text-gray-600 ml-2">
                        ({item.packageQuantity * (item.goodsPacking?.unitPerPackage || 1)} đơn vị)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="h-[38px] px-8 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Tải xuống
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="h-[38px] px-8 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              In phiếu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDeliverySlipModal;
