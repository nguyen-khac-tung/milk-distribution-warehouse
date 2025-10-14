import React, { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { ComponentIcon } from "../../../components/IconComponent/Icon"
import { updateArea, getAreaDetail } from "../../../services/AreaServices"
import { getStorageCondition } from "../../../services/StorageConditionService"
import { validateAndShowError, extractErrorMessage } from "../../../utils/Validation"

export default function UpdateAreaModal({ isOpen, onClose, onSuccess, areaId, areaData }) {
  const [formData, setFormData] = useState({
    areaId: 0,
    areaName: "",
    areaCode: "",
    description: "",
    storageConditionId: 0,
    status: 0,
  })
  const [loading, setLoading] = useState(false)
  const [storageConditions, setStorageConditions] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Load data for dropdowns and area details
  useEffect(() => {
    if (isOpen) {
      loadAreaData()
      loadDropdownData()
    }
  }, [isOpen, areaData])

  const loadAreaData = async () => {
    try {
      setLoadingData(true)
      
      // Ưu tiên sử dụng areaData từ props
      if (areaData) {
        setFormData({
          areaId: areaData.areaId || 0,
          areaName: areaData.areaName || "",
          areaCode: areaData.areaCode || "",
          description: areaData.description || "",
          storageConditionId: areaData.storageConditionId || 0,
          status: areaData.status || 0,
        })
        return
      }

      // Nếu không có areaData, thử gọi API
      if (areaId) {
        const response = await getAreaDetail(areaId)
        if (response && response.data) {
          const area = response.data
          setFormData({
            areaId: area.areaId || 0,
            areaName: area.areaName || "",
            areaCode: area.areaCode || "",
            description: area.description || "",
            storageConditionId: area.storageConditionId || 0,
            status: area.status || 0,
          })
        }
      }
    } catch (error) {
      console.error("Error loading area data:", error)
      const errorMessage = extractErrorMessage(error, "Lỗi khi tải thông tin khu vực")
      window.showToast(errorMessage, "error")
    } finally {
      setLoadingData(false)
    }
  }

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
    if (!formData.areaName || !formData.areaCode || !formData.storageConditionId || formData.status === 0) {
      window.showToast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    try {
      setLoading(true)
      const response = await updateArea(areaId, formData)
      console.log("Area updated:", response)
      window.showToast("Cập nhật khu vực thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error updating area:", error)

      // Sử dụng extractErrorMessage để xử lý lỗi từ API
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật khu vực")
      window.showToast(`Lỗi: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      areaId: 0,
      areaName: "",
      areaCode: "",
      description: "",
      storageConditionId: 0,
      status: 0,
    })
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật khu vực</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ComponentIcon name="close" size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Row 1: Area Name & Area Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="areaName" className="text-sm font-medium text-slate-700">
                  Tên khu vực *
                </Label>
                <Input
                  id="areaName"
                  placeholder="VD: Khu A"
                  value={formData.areaName}
                  onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
                  className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaCode" className="text-sm font-medium text-slate-700">
                  Mã khu vực *
                </Label>
                <Input
                  id="areaCode"
                  placeholder="VD: A1"
                  value={formData.areaCode}
                  onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                  className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  required
                />
              </div>
            </div>

            {/* Row 2: Storage Condition & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storageConditionId" className="text-sm font-medium text-slate-700">
                  Điều kiện bảo quản *
                </Label>
                <select
                  id="storageConditionId"
                  value={formData.storageConditionId}
                  onChange={(e) => setFormData({ ...formData, storageConditionId: parseInt(e.target.value) })}
                  className="h-12 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#237486] focus:ring-[#237486] focus:outline-none bg-white"
                  required
                >
                  <option value={0}>Chọn điều kiện bảo quản...</option>
                  {loadingData ? (
                    <option disabled>Đang tải...</option>
                  ) : (
                    storageConditions.map((condition) => (
                      <option
                        key={condition.storageConditionId}
                        value={condition.storageConditionId}
                      >
                        {condition.conditionName} - Nhiệt độ: {condition.temperatureMin}°C đến {condition.temperatureMax}°C - Độ ẩm: {condition.humidityMin}% đến {condition.humidityMax}%
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                  Trạng thái *
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  className="h-12 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#237486] focus:ring-[#237486] focus:outline-none bg-white"
                  required
                >
                  <option value={0}>Chọn trạng thái...</option>
                  <option value={1}>Hoạt động</option>
                  <option value={2}>Không hoạt động</option>
                </select>
              </div>
            </div>

            {/* Row 3: Description */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Mô tả
                </Label>
                <textarea
                  id="description"
                  placeholder="Nhập mô tả khu vực..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-24 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#237486] focus:ring-[#237486] focus:outline-none bg-white resize-none"
                                rows={3}
                />
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
                disabled={loading || loadingData}
                className="w-40 h-12 bg-[#237486] hover:bg-[#1e5f6b] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Đang cập nhật..." : loadingData ? "Đang tải..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
