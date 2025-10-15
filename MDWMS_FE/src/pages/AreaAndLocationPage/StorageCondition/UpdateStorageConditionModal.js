import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { updateLocation, getLocationDetail } from "../../../services/LocationServices";
import { getAreas } from "../../../services/AreaServices";
import { extractErrorMessage } from "../../../utils/Validation";

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
      const res = await getAreas({ pageNumber: 1, pageSize: 100 });
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

      console.log("Payload gửi lên:", payload);

      const res = await updateLocation(payload);
      console.log("Update response:", res);
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Row 1: Temperature Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="temperatureMin" className="text-sm font-medium text-slate-700">
                  Nhiệt độ tối thiểu (°C) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="temperatureMin"
                  type="number"
                  step="0.1"
                  placeholder="Nhập nhiệt độ tối thiểu..."
                  value={formData.temperatureMin === 0 ? "" : formData.temperatureMin}
                  onChange={(e) => setFormData({ ...formData, temperatureMin: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperatureMax" className="text-sm font-medium text-slate-700">
                  Nhiệt độ tối đa (°C) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="temperatureMax"
                  type="number"
                  step="0.1"
                  placeholder="Nhập nhiệt độ tối đa..."
                  value={formData.temperatureMax === 0 ? "" : formData.temperatureMax}
                  onChange={(e) => setFormData({ ...formData, temperatureMax: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Row 2: Humidity Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="humidityMin" className="text-sm font-medium text-slate-700">
                  Độ ẩm tối thiểu (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="humidityMin"
                  type="number"
                  step="0.1"
                  placeholder="Nhập độ ẩm tối thiểu..."
                  value={formData.humidityMin === 0 ? "" : formData.humidityMin}
                  onChange={(e) => setFormData({ ...formData, humidityMin: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="humidityMax" className="text-sm font-medium text-slate-700">
                  Độ ẩm tối đa (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="humidityMax"
                  type="number"
                  step="0.1"
                  placeholder="Nhập độ ẩm tối đa..."
                  value={formData.humidityMax === 0 ? "" : formData.humidityMax}
                  onChange={(e) => setFormData({ ...formData, humidityMax: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Availability */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="isAvailable" className="text-sm font-medium text-slate-700">
                Tình trạng sử dụng
              </Label>
              <select
                id="isAvailable"
                value={formData.isAvailable.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, isAvailable: e.target.value === "true" })
                }
                className="h-10 px-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 bg-white text-sm"
              >
                <option value="true">Trống</option>
                <option value="false">Đang sử dụng</option>
              </select>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            onClick={handleReset}
            className="h-10 px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md transition-all"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </div>
      </form>
    </div>
      </div >
    </div >
  );
}
