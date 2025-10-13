
import React, { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X } from "lucide-react"
import { updateUnitMeasure } from "../../services/UnitMeasureService"
import { validateAndShowError, extractErrorMessage } from "../../utils/Validation"

export default function UpdateUnitMeasure({ isOpen, onClose, onSuccess, unitMeasureData }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: 1,
  })
  const [loading, setLoading] = useState(false)

  // Load data when modal opens
  React.useEffect(() => {
    if (isOpen && unitMeasureData) {
      console.log("Loading unit measure data for update:", unitMeasureData)
      setFormData({
        name: unitMeasureData.name || "",
        description: unitMeasureData.description || "",
        status: unitMeasureData.status !== undefined ? unitMeasureData.status : 1,
      })
    }
  }, [isOpen, unitMeasureData])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form data using utility function
    if (!validateAndShowError(formData)) {
      return
    }

    if (!unitMeasureData || !unitMeasureData.unitMeasureId) {
      window.showToast("Không tìm thấy thông tin đơn vị đo", "error")
      return
    }

    try {
      setLoading(true)

      // Only change status if user selected different from original
      const originalStatus = parseInt(unitMeasureData.status)
      const selectedStatus = parseInt(formData.status)
      const statusChanged = originalStatus !== selectedStatus

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        unitMeasureId: parseInt(unitMeasureData.unitMeasureId),
        status: statusChanged ? selectedStatus : originalStatus // Keep original if not changed
      }

      console.log("Original status:", originalStatus, "Selected status:", selectedStatus)
      console.log("Status changed:", statusChanged)
      console.log("Update data:", updateData)
      console.log("Data validation:", {
        name: updateData.name.length > 0,
        description: updateData.description.length > 0,
        unitMeasureId: !isNaN(updateData.unitMeasureId),
        status: [1, 2].includes(updateData.status)
      })

      const response = await updateUnitMeasure(updateData)
      console.log("Unit measure updated:", response)
      window.showToast("Cập nhật đơn vị đo thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error updating unit measure:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật đơn vị đo")
      window.showToast(`Lỗi: ${cleanMsg}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
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
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật đơn vị đo</h1>
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
            {/* Unit Measure Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Tên đơn vị đo *
              </Label>
              <Input
                id="name"
                placeholder="Nhập tên đơn vị đo..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Mô tả *
              </Label>
              <Input
                id="description"
                placeholder="Nhập mô tả đơn vị đo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                Trạng thái *
              </Label>
              <select
                id="status"
                value={formData.status || 1}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="h-12 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#237486] focus:ring-[#237486] focus:outline-none bg-white"
              >
                <option value={1}>Hoạt động</option>
                <option value={2}>Ngừng hoạt động</option>
              </select>
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
