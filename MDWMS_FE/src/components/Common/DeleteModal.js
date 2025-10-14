import React, { useState } from "react";
import { Button } from "../ui/button";

export default function DeleteModal({ isOpen, onClose, onConfirm, itemName }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } catch (error) {
      console.error("Error in delete confirmation:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Xác nhận xóa</h2>
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa <span className="font-semibold text-gray-900">"{itemName}"</span> không?
            <br />
            Hành động này không thể hoàn tác.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </div>
    </div>
  );
}
