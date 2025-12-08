import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { createLocation } from "../../../services/LocationServices";
import { getAreaDropdown } from "../../../services/AreaServices";
import { extractErrorMessage } from "../../../utils/Validation";
import FloatingDropdown from "../../../components/Common/FloatingDropdown";

export default function CreateLocationModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    areaId: "",
    rack: "",
    row: "",
    column: "",
    isAvailable: true,
  });
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      const areasRes = await getAreaDropdown({ pageNumber: 1, pageSize: 100 });
      setAreas(areasRes?.items || areasRes?.data?.items || areasRes?.data || []);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
      const errorMessage = extractErrorMessage(error, "Lỗi khi tải danh sách khu vực");
      window.showToast(errorMessage, "error");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.areaId || !formData.rack || !formData.row || !formData.column) {
      window.showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        areaId: parseInt(formData.areaId),
        rack: formData.rack,
        row: parseInt(formData.row),
        column: parseInt(formData.column),
        isAvailable: formData.isAvailable,
      };

      const response = await createLocation(payload);
      console.log("Location created:", response);
      window.showToast("Thêm vị trí thành công!", "success");
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (error) {
      console.error("Error creating location:", error);
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi thêm vị trí");
      window.showToast(`Lỗi: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ areaId: "", rack: "", row: "", column: "", isAvailable: true });
    onClose && onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-xl font-semibold text-slate-800">Thêm vị trí mới</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ComponentIcon name="close" size={20} color="#6b7280" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Row 1: Area */}
            <div className="grid grid-cols-1">
              <div className="flex flex-col gap-2">
                <Label htmlFor="areaId" className="text-sm font-medium text-slate-700">
                  Khu vực <span className="text-red-500">*</span>
                </Label>
                <FloatingDropdown
                  value={formData.areaId ? formData.areaId.toString() : null}
                  onChange={(value) => setFormData({
                    ...formData,
                    areaId: value ? parseInt(value) : null,
                  })}
                  options={[
                    ...areas.map((a) => ({
                      value: a.areaId.toString(),
                      label: a.areaName,
                    })),
                  ]}
                  placeholder="Chọn khu vực..."
                  loading={loadingData}
                />
              </div>
            </div>

            {/* Row 2: Rack, Row, Column */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rack */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="rack" className="text-sm font-medium text-slate-700">
                  Kệ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rack"
                  placeholder="Nhập tên kệ..."
                  value={formData.rack}
                  onChange={(e) =>
                    setFormData({ ...formData, rack: e.target.value })
                  }
                  className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                />
              </div>

              {/* Row */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="row" className="text-sm font-medium text-slate-700">
                  Hàng <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="row"
                  type="number"
                  min="1"
                  placeholder="Nhập số hàng..."
                  value={formData.row}
                  onChange={(e) =>
                    setFormData({ ...formData, row: e.target.value })
                  }
                  className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                />
              </div>

              {/* Column */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="column" className="text-sm font-medium text-slate-700">
                  Cột <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="column"
                  type="number"
                  min="1"
                  placeholder="Nhập số cột..."
                  value={formData.column}
                  onChange={(e) =>
                    setFormData({ ...formData, column: e.target.value })
                  }
                  className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md transition-all"
                onClick={handleReset}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingData}
                className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Đang thêm..." : "Thêm"}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};