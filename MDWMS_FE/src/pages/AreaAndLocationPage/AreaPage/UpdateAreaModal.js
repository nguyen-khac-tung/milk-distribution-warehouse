import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { updateArea, getAreaDetail } from "../../../services/AreaServices";
import { getStorageConditionsDropdown } from "../../../services/StorageConditionService";
import { extractErrorMessage } from "../../../utils/Validation";
import CustomDropdown from "../../../components/Common/CustomDropdown";

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
      const res = await getStorageConditionsDropdown({ pageNumber: 1, pageSize: 50 });
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
        <div className="px-6 py-6">
          <form className="space-y-8" onSubmit={handleSubmit}>

            {/* 2-column grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-5">
                {/* Area Name */}
                <div className="space-y-2">
                  <Label htmlFor="areaName" className="text-sm font-medium text-gray-700">
                    Tên khu vực <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="areaName"
                    placeholder="Nhập tên khu vực..."
                    value={formData.areaName}
                    onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
                    className="h-9 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                    required
                  />
                </div>


                {/* Storage Condition */}
                <div className="space-y-2">
                  <Label htmlFor="storageConditionId" className="text-sm font-medium text-gray-700">
                    Điều kiện bảo quản <span className="text-red-500">*</span>
                  </Label>
                  <CustomDropdown
                    value={formData.storageConditionId?.toString() || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, storageConditionId: value })
                    }
                    options={[
                      { value: "", label: "Chọn điều kiện bảo quản..." },
                      ...storageConditions.map((condition) => ({
                        value: condition.storageConditionId.toString(),
                        label: `- Nhiệt độ: ${condition.temperatureMin}°C đến ${condition.temperatureMax}°C - Độ ẩm: ${condition.humidityMin}% đến ${condition.humidityMax}%`,
                      })),
                    ]}
                    placeholder="Chọn điều kiện bảo quản..."
                    loading={loadingData}
                  />
                </div>

              </div>

              {/* Right column */}
              <div className="space-y-5">
                {/* Area Code */}
                <div className="space-y-2">
                  <Label htmlFor="areaCode" className="text-sm font-medium text-gray-700">
                    Mã khu vực <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="areaCode"
                    placeholder="Nhập mã khu vực..."
                    value={formData.areaCode}
                    onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                    className="h-9 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Mô tả
              </Label>
              <textarea
                id="description"
                placeholder="Nhập mô tả khu vực..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 focus:outline-none text-sm resize-y"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-all"
                onClick={handleReset}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingData}
                className="h-9 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-60"
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
