import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { updateArea, getAreaDetail } from "../../../services/AreaServices";
import { getStorageCondition } from "../../../services/StorageConditionService";
import { extractErrorMessage } from "../../../utils/Validation";

export default function UpdateAreaModal({ isOpen, onClose, onSuccess, areaId, areaData }) {
  const [formData, setFormData] = useState({
    areaName: "",
    areaCode: "",
    description: "",
    storageConditionId: 0,
  });
  const [loading, setLoading] = useState(false);
  const [storageConditions, setStorageConditions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load dropdowns + data
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
      loadAreaData();
    }
  }, [isOpen, areaId, areaData]);

  const loadAreaData = async () => {
    try {
      setLoadingData(true);
      if (areaData) {
        setFormData({
          areaName: areaData.areaName || "",
          areaCode: areaData.areaCode || "",
          description: areaData.description || "",
          storageConditionId: areaData.storageCondition?.storageConditionId || areaData.storageConditionId || 0,
        });
        return;
      }
      if (areaId) {
        const res = await getAreaDetail(areaId);
        if (res && res.data) {
          const area = res.data;
          setFormData({
            areaName: area.areaName || "",
            areaCode: area.areaCode || "",
            description: area.description || "",
            storageConditionId: area.storageConditionId || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error loading area:", error);
      window.showToast(extractErrorMessage(error, "Không thể tải dữ liệu khu vực"), "error");
    } finally {
      setLoadingData(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      const res = await getStorageCondition({ pageNumber: 1, pageSize: 50 });
      setStorageConditions(res?.data?.items || res?.data || []);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
      window.showToast(extractErrorMessage(error, "Không thể tải danh sách điều kiện bảo quản"), "error");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.areaName || !formData.areaCode || !formData.storageConditionId) {
      window.showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await updateArea(areaId, formData);
      window.showToast("Cập nhật khu vực thành công!", "success");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Error updating area:", error);
      window.showToast(extractErrorMessage(error, "Có lỗi khi cập nhật khu vực"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      areaName: "",
      areaCode: "",
      description: "",
      storageConditionId: 0,
    });
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Cập nhật khu vực</h1>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ComponentIcon name="close" size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Form Fields - 1 column layout */}
            <div className="space-y-4">
              {/* Area Name */}
              <div className="space-y-2">
                <Label htmlFor="areaName" className="text-sm font-medium text-slate-700">
                  Tên khu vực <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="areaName"
                  placeholder="Nhập tên khu vực..."
                  value={formData.areaName}
                  onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>

              {/* Area Code */}
              <div className="space-y-2">
                <Label htmlFor="areaCode" className="text-sm font-medium text-slate-700">
                  Mã khu vực <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="areaCode"
                  placeholder="Nhập mã khu vực..."
                  value={formData.areaCode}
                  onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>

              {/* Storage Condition */}
              <div className="space-y-2">
                <Label htmlFor="storageConditionId" className="text-sm font-medium text-slate-700">
                  Điều kiện bảo quản <span className="text-red-500">*</span>
                </Label>
                <select
                  id="storageConditionId"
                  value={formData.storageConditionId}
                  onChange={(e) => setFormData({ ...formData, storageConditionId: parseInt(e.target.value) })}
                  className="h-[38px] w-full px-3 py-1 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 focus:outline-none bg-white text-sm flex items-center"
                  required
                >
                  <option value={0}>Chọn điều kiện bảo quản...</option>
                  {loadingData ? (
                    <option disabled>Đang tải...</option>
                  ) : (
                    storageConditions.map((condition) => (
                      <option
                        key={condition.storageConditionId}
                        value={condition.storageConditionId}
                      >
                        {condition.conditionName} - Nhiệt độ: {condition.temperatureMin}°C đến {condition.temperatureMax}°C - Độ ẩm: {condition.humidityMin}% đến {condition.humidityMax}%
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Mô tả
                </Label>
                <Input
                  id="description"
                  placeholder="Nhập mô tả khu vực..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Mô tả
              </Label>
              <select
                id="status"
                value={formData.status || 1}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="h-[38px] w-full px-3 py-1 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 focus:outline-none bg-white text-sm flex items-center"
              >
                <option value={1} className="text-sm">Hoạt động</option>
                <option value={2} className="text-sm">Ngừng hoạt động</option>
              </select>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                onClick={handleReset}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingData}
                className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Đang cập nhật..." : loadingData ? "Đang tải..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
