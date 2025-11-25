import React from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { X, AlertCircle, RefreshCw } from "lucide-react";

export default function ConfirmCountedModal({
    isOpen,
    onClose,
    onConfirm,
    loading = false
}) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full mx-4">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 border-2 border-orange-100">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Xác nhận
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Bạn có chắc chắn muốn xác nhận vị trí này?
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-orange-800">
                                <p className="font-medium mb-1">Lưu ý:</p>
                                <p>Xác nhận này áp dụng cho trường hợp trong hệ thống không có pallet và bên ngoài cũng không có pallet.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
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
                        onClick={onConfirm}
                        disabled={loading}
                        className="h-[38px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Đang xử lý...
                            </div>
                        ) : (
                            "Xác nhận"
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}

