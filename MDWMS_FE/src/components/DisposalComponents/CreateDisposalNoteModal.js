import React, { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

const CreateDisposalNoteModal = ({
  isOpen,
  onClose,
  onConfirm,
  disposalRequest,
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
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tạo phiếu xuất hủy
              </h3>
              <p className="text-sm text-gray-500">
                Tạo phiếu xuất hủy cho yêu cầu xuất hủy
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
          {/* Disposal Request Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-gray-900">Thông tin yêu cầu xuất hủy</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã yêu cầu:</span>
                <span className="font-medium">{disposalRequest?.disposalRequestId || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Người được phân công:</span>
                <span className="font-medium">{disposalRequest?.assignTo?.fullName || disposalRequest?.assignToName || '-'}</span>
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

          {/* Warning Message */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-indigo-800 mb-1">
                  Xác nhận tạo phiếu xuất hủy
                </h4>
                <p className="text-sm text-indigo-700">
                  Bạn có chắc chắn muốn tạo phiếu xuất hủy cho yêu cầu này? Phiếu xuất hủy sẽ được tạo và yêu cầu sẽ chuyển sang trạng thái "Đang lấy hàng".
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
              className="h-[38px] px-8 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
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

export default CreateDisposalNoteModal;

