import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { updateLocation, getLocationDetail } from "../../../services/LocationServices";
import { getAreaDropdown } from "../../../services/AreaServices";
import { extractErrorMessage } from "../../../utils/Validation";
import CustomDropdown from "../../../components/Common/CustomDropdown";

export default function UpdateLocationModal({ isOpen, onClose, onSuccess, locationId, locationData }) {
  const [formData, setFormData] = useState({
    locationId: 0,
    areaId: "",
    rack: "",
    row: "",
    column: "",
    isAvailable: true,
  });

  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load dữ liệu khi mở modal
  useEffect(() => {
    if (isOpen) {
      loadAreas();
      loadLocation();
    }
  }, [isOpen, locationData]);

  // Lấy danh sách khu vực
  const loadAreas = async () => {
    try {
      setLoadingData(true);
      const res = await getAreaDropdown({ pageNumber: 1, pageSize: 100 });
      setAreas(res?.items || res?.data?.items || res?.data || []);
    } catch (error) {
      const msg = extractErrorMessage(error, "Lỗi khi tải khu vực");
      window.showToast(msg, "error");
    } finally {
      setLoadingData(false);
    }
  };

  // Lấy chi tiết location (nếu có)
  const loadLocation = async () => {
    try {
      setLoadingData(true);
      if (locationData) {
        setFormData({
          locationId: locationData.locationId || 0,
          areaId: locationData.areaId?.toString() || "",
          rack: locationData.rack || "",
          row: locationData.row?.toString() || "",
          column: locationData.column?.toString() || "",
          isAvailable: locationData.isAvailable ?? true,
        });
        return;
      }
      if (locationId) {
        const res = await getLocationDetail(locationId);
        const loc = res?.data || res;
        setFormData({
          locationId: loc.locationId || 0,
          areaId: loc.areaId?.toString() || "",
          rack: loc.rack || "",
          row: loc.row?.toString() || "",
          column: loc.column?.toString() || "",
          isAvailable: loc.isAvailable ?? true,
        });
      }
    } catch (error) {
      const msg = extractErrorMessage(error, "Lỗi khi tải thông tin vị trí");
      window.showToast(msg, "error");
    } finally {
      setLoadingData(false);
    }
  };

  // Submit cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.areaId || !formData.rack || !formData.row || !formData.column) {
      window.showToast("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        LocationId: formData.locationId,
        AreaId: parseInt(formData.areaId),
        Rack: formData.rack,
        Row: parseInt(formData.row),
        Column: parseInt(formData.column),
        IsAvailable: formData.isAvailable,
      };

      const res = await updateLocation(payload);
      window.showToast("Cập nhật vị trí thành công!", "success");

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (error) {
      const msg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật vị trí");
      window.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    onClose && onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-xl font-semibold text-slate-800">Cập nhật vị trí</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ComponentIcon name="close" size={20} color="#6b7280" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Grid fields */}
            <div className="flex flex-col gap-4">
              {/* Nhóm 1: Area + Availability */}
              <div className="flex gap-4">
                {/* Area */}
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="areaId" className="text-sm font-medium text-slate-700">
                    Khu vực <span className="text-red-500">*</span>
                  </Label>
                  <CustomDropdown
                    value={formData.areaId}
                    onChange={(value) => setFormData({ ...formData, areaId: value })}
                    options={[
                      { value: "", label: "Chọn khu vực..." },
                      ...areas.map((a) => ({ value: a.areaId.toString(), label: a.areaName })),
                    ]}
                    placeholder="Chọn khu vực..."
                    loading={loadingData}
                  />
                </div>

                {/* Availability */}
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="isAvailable" className="text-sm font-medium text-slate-700">
                    Tình trạng sử dụng <span className="text-red-500">*</span>
                  </Label>
                  <CustomDropdown
                    value={formData.isAvailable.toString()}
                    onChange={(value) =>
                      setFormData({ ...formData, isAvailable: value === "true" })
                    }
                    options={[
                      { value: "", label: "Chọn trạng thái..." },
                      { value: "true", label: "Trống" },
                      { value: "false", label: "Đang sử dụng" },
                    ]}
                    placeholder="Chọn trạng thái..."
                    loading={loadingData}
                  />
                </div>
              </div>

              {/* Nhóm 2: Rack + Row + Column */}
              <div className="flex gap-4">
                {/* Rack */}
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="rack" className="text-sm font-medium text-slate-700">
                    Kệ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rack"
                    placeholder="Nhập tên kệ..."
                    value={formData.rack}
                    onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                    className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  />
                </div>

                {/* Row */}
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="row" className="text-sm font-medium text-slate-700">
                    Hàng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="row"
                    type="number"
                    min="1"
                    placeholder="Nhập số hàng..."
                    value={formData.row}
                    onChange={(e) => setFormData({ ...formData, row: e.target.value })}
                    className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  />
                </div>

                {/* Column */}
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="column" className="text-sm font-medium text-slate-700">
                    Cột <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="column"
                    type="number"
                    min="1"
                    placeholder="Nhập số cột..."
                    value={formData.column}
                    onChange={(e) => setFormData({ ...formData, column: e.target.value })}
                    className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="h-10 px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md transition-all"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingData}
                className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
