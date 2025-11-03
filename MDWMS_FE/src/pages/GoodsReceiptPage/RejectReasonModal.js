import React from "react";
import { Button } from "../../components/ui/button";

export default function RejectReasonModal({ isOpen, reason, setReason, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nhập lý do từ chối</h3>
        <textarea
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          placeholder="Nhập lý do từ chối (tối đa 255 ký tự)"
          maxLength={255}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-4 mt-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel}
            className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Hủy
          </Button>
          <Button 
            type="button"
            onClick={onConfirm}
            className="h-[38px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Từ chối
          </Button>
        </div>
      </div>
    </div>
  );
}


