import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { X, Calendar } from "lucide-react";
import { createBatch } from "../../services/BatchService";
import { getGoodsDropdown } from "../../services/GoodService";
import { extractErrorMessage } from "../../utils/Validation";
import { Textarea } from "../../components/ui/textarea";
import FloatingDropdown from "../../components/Common/FloatingDropdown";

const CreateBatchModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        batchCode: "",
        goodsId: "",
        description: "",
        manufacturingDate: "",
        expiryDate: "",
    });
    const [loading, setLoading] = useState(false);
    const [goodsOptions, setGoodsOptions] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                batchCode: "",
                goodsId: "",
                description: "",
                manufacturingDate: "",
                expiryDate: "",
            });

            loadGoods();
        }
    }, [isOpen]);

    const loadGoods = async () => {
        try {
            const items = await getGoodsDropdown();
            setGoodsOptions(items);
        } catch (e) {
            console.error("Error loading goods for dropdown", e);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.batchCode || !formData.goodsId || !formData.manufacturingDate || !formData.expiryDate) {
            window.showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
            return;
        }
        try {
            setLoading(true);
            await createBatch({
                batchCode: formData.batchCode,
                goodsId: parseInt(formData.goodsId),
                description: formData.description,
                manufacturingDate: formData.manufacturingDate,
                expiryDate: formData.expiryDate,
            });
            window.showToast("Thêm lô hàng thành công!", "success");
            onSuccess && onSuccess();
            onClose && onClose();
        } catch (error) {
            const msg = extractErrorMessage(error, "Có lỗi xảy ra khi thêm lô hàng");
            window.showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-slate-800">Thêm lô hàng mới</h1>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="batchCode" className="text-sm font-medium text-slate-700">Mã lô hàng <span className="text-red-500">*</span></Label>
                                <Input id="batchCode" placeholder="Nhập mã lô..." value={formData.batchCode} onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })} className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="areaId" className="text-sm font-medium text-slate-700">
                                    Tên hàng hóa <span className="text-red-500">*</span>
                                </Label>
                                <FloatingDropdown
                                    value={formData.goodsId || null}
                                    onChange={(value) => setFormData({ ...formData, goodsId: value })}
                                    placeholder="Chọn hàng hóa..."
                                    options={goodsOptions.map((a) => ({
                                        value: a.goodsId.toString(),
                                        label: a.goodsName
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="manufacturingDate" className="text-sm font-medium text-slate-700">Ngày sản xuất <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Input id="manufacturingDate" type="date" value={formData.manufacturingDate} onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })} className="date-picker-input h-[38px] pr-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg" />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expiryDate" className="text-sm font-medium text-slate-700">Ngày hết hạn <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="date-picker-input h-[38px] pr-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg" />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                                Mô tả
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Nhập mô tả lô hàng..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-4 justify-end pt-6">
                            <Button type="button" variant="outline" className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white" onClick={onClose}>Hủy</Button>
                            <Button type="submit" disabled={loading} className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white">{loading ? "Đang thêm..." : "Thêm"}</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateBatchModal;