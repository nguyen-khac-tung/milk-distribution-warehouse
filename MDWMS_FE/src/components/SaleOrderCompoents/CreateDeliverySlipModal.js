import React, { useState } from 'react';
import { X, Package, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

const CreateDeliverySlipModal = ({
  isOpen,
  onClose,
  onConfirm,
  saleOrder,
  loading = false
}) => {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onConfirm(note);
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tạo phiếu xuất kho
              </h3>
              <p className="text-sm text-gray-500">
                Tạo phiếu xuất kho cho đơn hàng
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

          {/* Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú phiếu xuất kho (tùy chọn)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho phiếu xuất kho..."
              className="w-full"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Warning Message */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-purple-800 mb-1">
                  Xác nhận tạo phiếu xuất kho
                </h4>
                <p className="text-sm text-purple-700">
                  Bạn có chắc chắn muốn tạo phiếu xuất kho cho đơn hàng này? Phiếu xuất kho sẽ được tạo và đơn hàng sẽ chuyển sang trạng thái "Đang lấy hàng".
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="h-[38px] px-8 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang tạo...
                </div>
              ) : (
                "Xác nhận tạo"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDeliverySlipModal;
