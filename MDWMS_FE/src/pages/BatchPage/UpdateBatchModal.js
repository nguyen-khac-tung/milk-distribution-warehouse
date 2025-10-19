import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { X, Calendar } from "lucide-react";
import { getBatchDetail, updateBatch } from "../../services/BatchService";
import { getGoodsDropdown } from "../../services/GoodService";
import { extractErrorMessage } from "../../utils/Validation";
import CustomDropdown from "../../components/Common/CustomDropdown";

const UpdateBatchModal = ({ isOpen, onClose, onSuccess, batchId, batchData }) => {
    const [formData, setFormData] = useState({
        batchId: 0,
        batchCode: "",
        goodsId: "",
        manufacturingDate: "",
        expiryDate: "",
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [goodsOptions, setGoodsOptions] = useState([]);

    useEffect(() => {
        if (isOpen && batchId) {
            loadGoods();
            loadData();
        }
    }, [isOpen, batchId]);

    const loadGoods = async () => {
        try {
            const items = await getGoodsDropdown();
            setGoodsOptions(items);
        } catch (e) {
            console.error("Error loading goods for dropdown", e);
        }
    };

    const loadData = async () => {
        try {
            setLoadingData(true);

            let data;
            if (batchData) {
                data = batchData;
            } else {
                const res = await getBatchDetail(batchId);
                data = res?.data || res;
            }

            setFormData({
                batchId: data.batchId || 0,
                batchCode: data.batchCode || "",
                goodsId: data.goodsId && data.goodsId > 0 ? data.goodsId.toString() : "",
                manufacturingDate: data.manufacturingDate || "",
                expiryDate: data.expiryDate || "",
            });
        } catch (error) {
            const msg = extractErrorMessage(error, "Lỗi khi tải thông tin lô hàng");
            window.showToast(msg, "error");
        } finally {
            setLoadingData(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await updateBatch({
                batchId: formData.batchId,
                batchCode: formData.batchCode,
                goodsId: parseInt(formData.goodsId || 0),
                manufacturingDate: formData.manufacturingDate,
                expiryDate: formData.expiryDate,
            });
            window.showToast("Cập nhật lô hàng thành công!", "success");
            onSuccess && onSuccess();
        } catch (error) {
            const msg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật lô hàng");
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
                    <h1 className="text-2xl font-bold text-slate-800">Cập nhật lô hàng</h1>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="batchCode" className="text-sm font-medium text-slate-700">Mã lô hàng <span className="text-red-500">*</span></Label>
                                <Input id="batchCode" value={formData.batchCode} onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })} className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="areaId" className="text-sm font-medium text-slate-700">
                                    Chọn hàng hóa <span className="text-red-500">*</span>
                                </Label>
                                <CustomDropdown
                                    value={formData.goodsId?.toString() || ""}
                                    onChange={(value) => setFormData({ ...formData, goodsId: value ? Number(value) : null })}
                                    options={[
                                        { value: "", label: "Chọn hàng hóa..." },
                                        ...goodsOptions.map((a) => ({
                                            value: a.goodsId.toString(),
                                            label: a.goodsName,
                                        })),
                                    ]}
                                />
                            </div>
                            {/* <div className="space-y-2">
                                <Label htmlFor="goodsId" className="text-sm font-medium text-slate-700">Hàng hóa</Label>
                                <select id="goodsId" value={formData.goodsId} onChange={(e) => setFormData({ ...formData, goodsId: e.target.value })} className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg px-3 text-sm">
                                    <option value="">Chọn hàng hóa...</option>
                                    {goodsOptions.map(g => (
                                        <option key={g.goodsId} value={g.goodsId}>{g.goodsName}</option>
                                    ))}
                                </select>
                            </div> */}
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

                        <div className="flex gap-4 justify-end pt-6">
                            <Button type="button" variant="outline" className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white" onClick={onClose}>Hủy</Button>
                            <Button type="submit" disabled={loading || loadingData} className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white">{loading ? "Đang cập nhật..." : loadingData ? "Đang tải..." : "Cập nhật"}</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateBatchModal;