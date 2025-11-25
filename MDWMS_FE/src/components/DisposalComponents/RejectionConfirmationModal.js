import React, { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

const RejectionConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  disposalRequest,
  loading = false,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirm = () => {
    if (rejectionReason.trim()) {
      onConfirm(rejectionReason);
    }
  };

  const handleClose = () => {
    setRejectionReason('');
    onClose();
  };

  if (!isOpen) return null;

  const isDisabled = loading || !rejectionReason.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Từ chối yêu cầu xuất hủy
              </h3>
              <p className="text-sm text-gray-500">
                Xác nhận từ chối yêu cầu xuất hủy
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
        <div className="p-4">
          {/* Disposal Request Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-gray-900">
                Thông tin yêu cầu xuất hủy
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã yêu cầu:</span>
                <span className="font-medium">
                  {disposalRequest?.disposalRequestId || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Người tạo:</span>
                <span className="font-medium">
                  {disposalRequest?.createdBy?.fullName || disposalRequest?.createdByName || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thời gian dự kiến xuất hủy:</span>
                <span className="font-medium">
                  {disposalRequest?.estimatedTimeDeparture
                    ? new Date(disposalRequest.estimatedTimeDeparture).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối yêu cầu xuất hủy..."
              className="w-full"
              rows={2}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Vui lòng nhập lý do từ chối để người tạo yêu cầu có thể hiểu và chỉnh sửa.
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">
                  Xác nhận từ chối yêu cầu xuất hủy
                </h4>
                <p className="text-sm text-red-700">
                  Bạn có chắc chắn muốn từ chối yêu cầu xuất hủy này? Yêu cầu sẽ chuyển sang trạng thái
                  <span className="font-semibold"> "Đã từ chối"</span> và người tạo có thể chỉnh sửa để gửi lại.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              Hủy
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isDisabled}
              className={`h-[38px] px-6 font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 ${isDisabled
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-md'
                }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang từ chối...
                </div>
              ) : (
                'Xác nhận từ chối'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionConfirmationModal;

