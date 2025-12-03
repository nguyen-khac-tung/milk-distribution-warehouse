
import React, { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { X } from "lucide-react"
import CustomDropdown from "../../../components/Common/CustomDropdown"
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
  const [validationErrors, setValidationErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all required fields
    const errors = {}

    if (!formData.temperatureMin || formData.temperatureMin === 0 || formData.temperatureMin === "") {
      errors.temperatureMin = "Vui lòng nhập nhiệt độ tối thiểu"
    }

    if (!formData.temperatureMax || formData.temperatureMax === 0 || formData.temperatureMax === "") {
      errors.temperatureMax = "Vui lòng nhập nhiệt độ tối đa"
    }

    if (!formData.humidityMin || formData.humidityMin === 0 || formData.humidityMin === "") {
      errors.humidityMin = "Vui lòng nhập độ ẩm tối thiểu"
    }

    if (!formData.humidityMax || formData.humidityMax === 0 || formData.humidityMax === "") {
      errors.humidityMax = "Vui lòng nhập độ ẩm tối đa"
    }

    if (!formData.lightLevel || formData.lightLevel === "") {
      errors.lightLevel = "Vui lòng chọn mức độ ánh sáng"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    // Clear validation errors if validation passes
    setValidationErrors({})

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
    setValidationErrors({})
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
                  onChange={(e) => {
                    setFormData({ ...formData, temperatureMin: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })
                    if (validationErrors.temperatureMin) {
                      setValidationErrors({ ...validationErrors, temperatureMin: undefined })
                    }
                  }}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
                {validationErrors.temperatureMin && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.temperatureMin}</p>
                )}
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
                  onChange={(e) => {
                    setFormData({ ...formData, temperatureMax: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })
                    if (validationErrors.temperatureMax) {
                      setValidationErrors({ ...validationErrors, temperatureMax: undefined })
                    }
                  }}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
                {validationErrors.temperatureMax && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.temperatureMax}</p>
                )}
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
                  onChange={(e) => {
                    setFormData({ ...formData, humidityMin: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })
                    if (validationErrors.humidityMin) {
                      setValidationErrors({ ...validationErrors, humidityMin: undefined })
                    }
                  }}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
                {validationErrors.humidityMin && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.humidityMin}</p>
                )}
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
                  onChange={(e) => {
                    setFormData({ ...formData, humidityMax: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })
                    if (validationErrors.humidityMax) {
                      setValidationErrors({ ...validationErrors, humidityMax: undefined })
                    }
                  }}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
                {validationErrors.humidityMax && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.humidityMax}</p>
                )}
              </div>
            </div>

            {/* Row 3: Light Level */}
            <div className="space-y-2">
              <Label htmlFor="lightLevel" className="text-sm font-medium text-slate-700">
                Mức độ ánh sáng <span className="text-red-500">*</span>
              </Label>
              <CustomDropdown
                value={formData.lightLevel}
                onChange={(value) => {
                  setFormData({ ...formData, lightLevel: value })
                  if (validationErrors.lightLevel) {
                    setValidationErrors({ ...validationErrors, lightLevel: undefined })
                  }
                }}
                options={[
                  { value: "", label: "Chọn mức độ ánh sáng..." },
                  { value: "Normal", label: "Bình thường" },
                  { value: "Low", label: "Thấp" },
                  { value: "High", label: "Cao" }
                ]}
                placeholder="Chọn mức độ ánh sáng..."
              />
              {validationErrors.lightLevel && (
                <p className="text-sm text-red-500 font-medium">{validationErrors.lightLevel}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6">
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
                disabled={loading}
                className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
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
