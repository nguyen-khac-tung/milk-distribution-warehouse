import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { X } from "lucide-react";

export default function CancelStocktakingModal({ isOpen, onClose, onConfirm, stocktakingSheetId }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await onConfirm();
        } catch (error) {
            console.error("Error in cancel confirmation:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border border-gray-100">
                {/* Header */}
                <div className="p-8 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 border-2 border-orange-100">
                        <X className="h-8 w-8 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Xác nhận hủy phiếu kiểm kê</h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Bạn có chắc chắn muốn hủy phiếu kiểm kê này<span className="font-semibold text-orange-600"></span> không?
                        <br />
                        <span className="text-sm text-gray-500 mt-2 block">Phiếu kiểm kê sẽ được chuyển sang trạng thái "Đã hủy".</span>
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
                        Đóng
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
                                Đang hủy...
                            </div>
                        ) : (
                            "Xác nhận hủy"
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}

