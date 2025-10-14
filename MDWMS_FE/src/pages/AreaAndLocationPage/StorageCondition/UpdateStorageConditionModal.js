
import React, { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { X } from "lucide-react"
import { updateStorageCondition } from "../../../services/StorageConditionService"
import { validateAndShowError, extractErrorMessage } from "../../../utils/Validation"

export default function UpdateStorageCondition({ isOpen, onClose, onSuccess, storageConditionData }) {
  const [formData, setFormData] = useState({
    temperatureMin: "",
    temperatureMax: "",
    humidityMin: "",
    humidityMax: "",
    lightLevel: "",
    status: 1,
  })
  const [loading, setLoading] = useState(false)

  // Load data when modal opens
  React.useEffect(() => {
    if (isOpen && storageConditionData) {
      console.log("Loading storage condition data for update:", storageConditionData)
      setFormData({
        temperatureMin: storageConditionData.temperatureMin ?? 0,
        temperatureMax: storageConditionData.temperatureMax ?? 0,
        humidityMin: storageConditionData.humidityMin ?? 0,
        humidityMax: storageConditionData.humidityMax ?? 0,
        lightLevel: storageConditionData.lightLevel || "",
        status: storageConditionData.status !== undefined ? storageConditionData.status : 1,
      })
    }
  }, [isOpen, storageConditionData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation - only check if required fields are filled
    if (!formData.lightLevel) {
      window.showToast("Vui lòng chọn mức độ ánh sáng", "error")
      return
    }
    
    if (!formData.status || (formData.status !== 1 && formData.status !== 2)) {
      window.showToast("Vui lòng chọn trạng thái", "error")
      return
    }

    if (!storageConditionData || !storageConditionData.storageConditionId) {
      window.showToast("Không tìm thấy thông tin điều kiện bảo quản", "error")
      return
    }

    try {
      setLoading(true)
      
      const updateData = {
        temperatureMin: isNaN(parseFloat(formData.temperatureMin)) ? 0 : parseFloat(formData.temperatureMin),
        temperatureMax: isNaN(parseFloat(formData.temperatureMax)) ? 0 : parseFloat(formData.temperatureMax),
        humidityMin: isNaN(parseFloat(formData.humidityMin)) ? 0 : parseFloat(formData.humidityMin),
        humidityMax: isNaN(parseFloat(formData.humidityMax)) ? 0 : parseFloat(formData.humidityMax),
        lightLevel: formData.lightLevel,
        status: parseInt(formData.status)
      }
      
      console.log("Update data:", updateData)
      console.log("Storage condition ID:", storageConditionData.storageConditionId)
      console.log("Form data before processing:", formData)
      console.log("Status value:", formData.status, "Type:", typeof formData.status)
      
      const response = await updateStorageCondition(storageConditionData.storageConditionId, updateData)
      console.log("Storage condition updated:", response)
      window.showToast("Cập nhật điều kiện bảo quản thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error updating storage condition:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật điều kiện bảo quản")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      temperatureMin: "",
      temperatureMax: "",
      humidityMin: "",
      humidityMax: "",
      lightLevel: "",
      status: 1,
    })
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật điều kiện bảo quản</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Temperature Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Nhiệt độ (°C) *
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="temperatureMin" className="text-xs text-slate-600">
                    Tối thiểu
                  </Label>
                  <Input
                    id="temperatureMin"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.temperatureMin === 0 ? "" : formData.temperatureMin}
                    onChange={(e) => setFormData({ ...formData, temperatureMin: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                    className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="temperatureMax" className="text-xs text-slate-600">
                    Tối đa
                  </Label>
                  <Input
                    id="temperatureMax"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.temperatureMax === 0 ? "" : formData.temperatureMax}
                    onChange={(e) => setFormData({ ...formData, temperatureMax: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                    className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  />
                </div>
              </div>
            </div>

            {/* Humidity Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Độ ẩm (%) *
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="humidityMin" className="text-xs text-slate-600">
                    Tối thiểu
                  </Label>
                  <Input
                    id="humidityMin"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.humidityMin === 0 ? "" : formData.humidityMin}
                    onChange={(e) => setFormData({ ...formData, humidityMin: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                    className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="humidityMax" className="text-xs text-slate-600">
                    Tối đa
                  </Label>
                  <Input
                    id="humidityMax"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.humidityMax === 0 ? "" : formData.humidityMax}
                    onChange={(e) => setFormData({ ...formData, humidityMax: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                    className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  />
                </div>
              </div>
            </div>

            {/* Light Level and Status */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="lightLevel" className="text-sm font-medium text-slate-700">
                    Mức độ ánh sáng *
                  </Label>
                  <select
                    id="lightLevel"
                    value={formData.lightLevel}
                    onChange={(e) => setFormData({ ...formData, lightLevel: e.target.value })}
                    className="h-12 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#237486] focus:ring-[#237486] focus:outline-none bg-white"
                    required
                  >
                    <option value="">Chọn mức độ ánh sáng</option>
                    <option value="Normal">Bình thường</option>
                    <option value="Low">Thấp</option>
                    <option value="High">Cao</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                    Trạng thái *
                  </Label>
                  <select
                    id="status"
                    value={formData.status !== undefined ? formData.status : 1}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                    className="h-12 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#237486] focus:ring-[#237486] focus:outline-none bg-white"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={2}>Ngừng hoạt động</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-6">
              <Button
                type="button"
                variant="outline"
                className="w-40 h-12 border-2 border-slate-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                onClick={handleReset}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-40 h-12 bg-[#237486] hover:bg-[#1e5f6b] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
