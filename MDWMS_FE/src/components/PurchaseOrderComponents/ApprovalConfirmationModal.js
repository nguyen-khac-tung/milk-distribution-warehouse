import React from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

const ApprovalConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  purchaseOrder,
  loading = false 
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

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
            <div className="p-2 bg-blue-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận đơn hàng
              </h3>
              <p className="text-sm text-gray-500">
                Duyệt đơn hàng chờ phê duyệt
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
          {/* Purchase Order Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-gray-900">Thông tin đơn hàng</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-medium">{purchaseOrder?.purchaseOderId || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nhà cung cấp:</span>
                <span className="font-medium">{purchaseOrder?.supplierName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Người tạo:</span>
                <span className="font-medium">{purchaseOrder?.createdByName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="font-medium">
                  {purchaseOrder?.createdAt ? new Date(purchaseOrder.createdAt).toLocaleDateString('vi-VN') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">
                  Xác nhận duyệt đơn hàng
                </h4>
                <p className="text-sm text-amber-700">
                  Bạn có chắc chắn muốn duyệt đơn hàng này? Hành động này sẽ chuyển đơn hàng sang trạng thái "Đã duyệt" và không thể hoàn tác.
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
               className="h-[38px] px-8 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
             >
               {loading ? (
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   Đang xử lý...
                 </div>
               ) : (
                 "Xác nhận duyệt"
               )}
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalConfirmationModal;
