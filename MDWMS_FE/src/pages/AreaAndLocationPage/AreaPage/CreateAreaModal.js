import React, { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { X } from "lucide-react"
import { createArea } from "../../../services/AreaServices"
import { getStorageCondition } from "../../../services/StorageConditionService"
import { validateAndShowError, extractErrorMessage } from "../../../utils/Validation"

export default function CreateAreaModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    areaName: "",
    areaCode: "",
    description: "",
    storageConditionId: "",
    status: 1,
  })
  const [loading, setLoading] = useState(false)
  const [storageConditions, setStorageConditions] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Load data for dropdowns
  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
    }
  }, [isOpen])

  const loadDropdownData = async () => {
    try {
      setLoadingData(true)
      const storageConditionsRes = await getStorageCondition({ pageNumber: 1, pageSize: 10 })

      // Handle different response structures
      setStorageConditions(storageConditionsRes?.data?.items || storageConditionsRes?.data || [])
    } catch (error) {
      console.error("Error loading dropdown data:", error)
      const errorMessage = extractErrorMessage(error, "Lỗi khi tải dữ liệu dropdown")
      window.showToast(errorMessage, "error")
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.areaName || !formData.areaCode || !formData.storageConditionId) {
      window.showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error")
      return
    }

    try {
      setLoading(true)
      const response = await createArea(formData)
      console.log("Area created:", response)
      window.showToast("Thêm khu vực thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error creating area:", error)

      // Sử dụng extractErrorMessage để xử lý lỗi từ API
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi thêm khu vực")
      window.showToast(`Lỗi: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      areaName: "",
      areaCode: "",
      description: "",
      storageConditionId: "",
      status: 1,
    })
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Thêm khu vực mới</h1>
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
                  onChange={(e) => setFormData({ ...formData, storageConditionId: e.target.value })}
                  className="h-[38px] w-full px-3 py-1 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 focus:outline-none bg-white text-sm flex items-center"
                  required
                >
                  <option value="">Chọn điều kiện bảo quản...</option>
                  {loadingData ? (
                    <option disabled>Đang tải...</option>
                  ) : (
                    storageConditions.map((condition) => (
                      <option
                        key={condition.storageConditionId}
                        value={condition.storageConditionId.toString()}
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
                disabled={loading || loadingData}
                className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Đang thêm..." : loadingData ? "Đang tải..." : "Thêm"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
