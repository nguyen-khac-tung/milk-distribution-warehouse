
import React, { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { Textarea } from "../../components/ui/textarea"
import { X } from "lucide-react"
import { updateUnitMeasure } from "../../services/UnitMeasureService"
import { extractErrorMessage } from "../../utils/Validation"

export default function UpdateUnitMeasure({ isOpen, onClose, onSuccess, unitMeasureData }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  // Load data when modal opens
  React.useEffect(() => {
    if (isOpen && unitMeasureData) {
      setFormData({
        name: unitMeasureData.name || "",
        description: unitMeasureData.description || "",
      })
      setValidationErrors({})
    }
  }, [isOpen, unitMeasureData])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!unitMeasureData || !unitMeasureData.unitMeasureId) {
      window.showToast("Không tìm thấy thông tin đơn vị", "error")
      return
    }

    // Validate form data
    const errors = {}

    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Vui lòng nhập tên đơn vị"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    // Clear validation errors if validation passes
    setValidationErrors({})

    try {
      setLoading(true)

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        unitMeasureId: parseInt(unitMeasureData.unitMeasureId),
        status: unitMeasureData.status // Keep original status
      }

      const response = await updateUnitMeasure(updateData)
      window.showToast("Cập nhật đơn vị thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error updating unit measure:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật đơn vị")
      window.showToast(`Lỗi: ${cleanMsg}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
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
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật đơn vị</h1>
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
            {/* Form Fields - 2 rows layout */}
            <div className="space-y-4">
              {/* Row 1: Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Tên đơn vị <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nhập tên đơn vị..."
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    setValidationErrors(prev => ({ ...prev, name: '' }))
                  }}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.name}</p>
                )}
              </div>

              {/* Row 2: Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Mô tả
                </Label>
                <Textarea
                  id="description"
                  placeholder="Nhập mô tả đơn vị..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[80px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg resize-none"
                />
              </div>
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
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
