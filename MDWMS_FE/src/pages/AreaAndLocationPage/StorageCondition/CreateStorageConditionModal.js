
import React, { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { X } from "lucide-react"
import { createStorageCondition } from "../../../services/StorageConditionService"
import { validateAndShowError, extractErrorMessage } from "../../../utils/Validation"

export default function CreateStorageCondition({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    temperatureMin: 0,
    temperatureMax: 0,
    humidityMin: 0,
    humidityMax: 0,
    lightLevel: "",
    status: 1,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation - only check if required fields are filled
    if (!formData.lightLevel) {
      window.showToast("Vui lòng chọn mức độ ánh sáng", "error")
      return
    }

    try {
      setLoading(true)
      const response = await createStorageCondition(formData)
      console.log("Storage condition created:", response)
      window.showToast("Thêm điều kiện bảo quản thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error creating storage condition:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi thêm điều kiện bảo quản")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      temperatureMin: 0,
      temperatureMax: 0,
      humidityMin: 0,
      humidityMax: 0,
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
          <h1 className="text-2xl font-bold text-slate-800">Thêm điều kiện bảo quản mới</h1>
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

            {/* Light Level */}
            <div className="space-y-2">
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
                {loading ? "Đang thêm..." : "Thêm"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
