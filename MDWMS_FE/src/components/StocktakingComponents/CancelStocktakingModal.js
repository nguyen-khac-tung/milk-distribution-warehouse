import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { X, AlertTriangle } from "lucide-react";

export default function CancelStocktakingModal({
    isOpen,
    onClose,
    onConfirm,
    loading = false
}) {
    const [note, setNote] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setNote("");
            setError("");
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!note || !note.trim()) {
            setError("Vui lòng nhập lý do hủy bỏ");
            return;
        }
        setError("");
        onConfirm(note.trim());
    };

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000]"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                margin: 0,
                padding: 0,
                zIndex: 100000,
                overflow: 'hidden'
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full mx-4">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 border-2 border-red-100">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Hủy bỏ kết quả kiểm kê
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Bạn có chắc chắn muốn hủy bỏ kết quả kiểm kê này không?
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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700">
                                <p className="font-medium mb-1">Cảnh báo:</p>
                                <p>Hành động này sẽ hủy bỏ toàn bộ kết quả kiểm kê. Bạn không thể hoàn tác sau khi xác nhận.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lý do hủy bỏ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => {
                                setNote(e.target.value);
                                if (error && e.target.value.trim()) {
                                    setError("");
                                }
                            }}
                            placeholder="Nhập lý do hủy bỏ kết quả kiểm kê..."
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                                error ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={loading}
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-500">{error}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                    <Button
                        onClick={onClose}
                        disabled={loading}
                        variant="outline"
                        className="px-4 py-2 h-[38px] border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || !note || !note.trim()}
                        className="px-4 py-2 h-[38px] bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                <span>Đang xử lý...</span>
                            </>
                        ) : (
                            "Xác nhận hủy bỏ"
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
