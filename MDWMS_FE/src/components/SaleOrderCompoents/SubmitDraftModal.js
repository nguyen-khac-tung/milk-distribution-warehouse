import React from 'react';
import { X, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

const SubmitDraftModal = ({
  isOpen,
  onClose,
  onConfirm,
  saleOrder,
  loading = false
}) => {
  const handleConfirm = () => {
    onConfirm();
  };
  console.log("aaaaa", saleOrder)
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Gửi phê duyệt
              </h3>
              <p className="text-sm text-gray-500">
                Gửi đơn hàng để chờ phê duyệt
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
              {/* <div className="flex justify-between">
                <span className="text-gray-600">Mã xuất hàng:</span>
                <span className="font-medium">{saleOrder?.salesOrderId || '-'}</span>
              </div> */}
              <div className="flex justify-between">
                <span className="text-gray-600">Nhà bán lẻ:</span>
                <span className="font-medium">{saleOrder?.retailerName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Người tạo:</span>
                <span className="font-medium">{saleOrder?.createdBy?.fullName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thời gian dự kiến xuất:</span>
                <span className="font-medium">
                  {saleOrder?.estimatedTimeDeparture
                    ? new Date(saleOrder.estimatedTimeDeparture).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-orange-800 mb-1">
                  Xác nhận gửi phê duyệt
                </h4>
                <p className="text-sm text-orange-700">
                  Bạn có chắc chắn muốn nộp bản nháp này? Đơn hàng sẽ chuyển sang trạng thái "Chờ duyệt" và cần được phê duyệt trước khi có thể tiếp tục xử lý.
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
              className="h-[38px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang nộp...
                </div>
              ) : (
                "Xác nhận gửi"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitDraftModal;
