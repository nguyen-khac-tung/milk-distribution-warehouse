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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border-2 border-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Xác nhận xóa</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Bạn có chắc chắn muốn xóa <span className="font-semibold text-red-600">"{itemName}"</span> không?
            <br />
            <span className="text-sm text-gray-500 mt-2 block">Hành động này không thể hoàn tác.</span>
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-8 pt-0 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            Hủy
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={loading}
            className="h-[38px] px-8 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xóa...
              </div>
            ) : (
              "Xóa"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
