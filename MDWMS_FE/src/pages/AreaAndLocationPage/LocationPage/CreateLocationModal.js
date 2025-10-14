import React, { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { X } from "lucide-react"
import { createLocation } from "../../../services/LocationServices"
import { getAreas } from "../../../services/AreaServices"
import { validateAndShowError, extractErrorMessage } from "../../../utils/Validation"

export default function CreateLocationModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    areaId: "",
    locationCode: "",
    rack: "",
    row: "",
    column: "",
    isAvailable: true,
    status: 1,
  })
  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState([])
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
      const areasRes = await getAreas({ pageNumber: 1, pageSize: 100 })

      // Handle different response structures
      setAreas(areasRes?.items || areasRes?.data?.items || areasRes?.data || [])
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
    if (!formData.areaId || !formData.locationCode || !formData.rack || !formData.row || !formData.column) {
      window.showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error")
      return
    }

    try {
      setLoading(true)
      const payload = {
        AreaId: parseInt(formData.areaId),
        LocationCode: formData.locationCode,
        Rack: formData.rack,
        Row: parseInt(formData.row),
        Column: parseInt(formData.column),
        IsAvailable: formData.isAvailable,
        Status: formData.status,
      }

      const response = await createLocation(payload)
      console.log("Location created:", response)
      window.showToast("Thêm vị trí thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error creating location:", error)

      // Sử dụng extractErrorMessage để xử lý lỗi từ API
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi thêm vị trí")
      window.showToast(`Lỗi: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      areaId: "",
      locationCode: "",
      rack: "",
      row: "",
      column: "",
      isAvailable: true,
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
          <h1 className="text-2xl font-bold text-slate-800">Thêm vị trí mới</h1>
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
            {/* Row 1: Area & Location Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="areaId" className="text-sm font-medium text-slate-700">
                  Khu vực *
                </Label>
                <select
                  id="areaId"
                  value={formData.areaId}
                  onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                  className="h-12 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#237486] focus:ring-[#237486] focus:outline-none bg-white"
                  required
                >
                  <option value="">Chọn khu vực...</option>
                  {loadingData ? (
                    <option disabled>Đang tải...</option>
                  ) : (
                    areas.map((area) => (
                      <option key={area.areaId} value={area.areaId.toString()}>
                        {area.areaName || `Khu vực ${area.areaId}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationCode" className="text-sm font-medium text-slate-700">
                  Mã vị trí *
                </Label>
                <Input
                  id="locationCode"
                  placeholder="VD: A1-01"
                  value={formData.locationCode}
                  onChange={(e) => setFormData({ ...formData, locationCode: e.target.value })}
                  className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  maxLength={20}
                  required
                />
              </div>
            </div>

            {/* Row 2: Rack, Row, Column */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="rack" className="text-sm font-medium text-slate-700">
                  Kệ *
                </Label>
                <Input
                  id="rack"
                  placeholder="VD: Kệ A1"
                  value={formData.rack}
                  onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                  className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  maxLength={50}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="row" className="text-sm font-medium text-slate-700">
                  Hàng *
                </Label>
                <Input
                  id="row"
                  type="number"
                  min="1"
                  placeholder="VD: 1"
                  value={formData.row}
                  onChange={(e) => setFormData({ ...formData, row: e.target.value })}
                  className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="column" className="text-sm font-medium text-slate-700">
                  Cột *
                </Label>
                <Input
                  id="column"
                  type="number"
                  min="1"
                  placeholder="VD: 3"
                  value={formData.column}
                  onChange={(e) => setFormData({ ...formData, column: e.target.value })}
                  className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  required
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
                {loading ? "Đang thêm..." : loadingData ? "Đang tải..." : "Thêm"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
