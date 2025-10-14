
import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X } from "lucide-react"
import CustomDropdown from "../../components/Common/CustomDropdown"
import { createGood } from "../../services/GoodService"
import { getCategory } from "../../services/CategoryService/CategoryServices"
import { getSuppliersDropdown } from "../../services/SupplierService"
import { getStorageCondition } from "../../services/StorageConditionService"
import { getUnitMeasure } from "../../services/UnitMeasureService"
import { validateAndShowError, extractErrorMessage } from "../../utils/Validation"

export default function CreateGood({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    goodsCode: "",
    goodsName: "",
    categoryId: "",
    supplierId: "",
    storageConditionId: "",
    unitMeasureId: "",
  })
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [storageConditions, setStorageConditions] = useState([])
  const [unitMeasures, setUnitMeasures] = useState([])
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
      const [categoriesRes, suppliersRes, storageConditionsRes, unitMeasuresRes] = await Promise.all([
        getCategory({ pageNumber: 1, pageSize: 10 }),
        getSuppliersDropdown(),
        getStorageCondition({ pageNumber: 1, pageSize: 10 }),
        getUnitMeasure({ pageNumber: 1, pageSize: 10 })
      ])

      // Handle different response structures
      setCategories(categoriesRes?.data?.items || categoriesRes?.data || [])
      setSuppliers(suppliersRes?.data?.items || suppliersRes?.data || [])
      setStorageConditions(storageConditionsRes?.data?.items || storageConditionsRes?.data || [])
      setUnitMeasures(unitMeasuresRes?.data?.items || unitMeasuresRes?.data || [])
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
    if (!formData.goodsCode || !formData.goodsName || !formData.categoryId ||
      !formData.supplierId || !formData.storageConditionId || !formData.unitMeasureId) {
      window.showToast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    try {
      setLoading(true)
      const response = await createGood(formData)
      console.log("Good created:", response)
      window.showToast("Thêm hàng hóa thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error creating good:", error)

      // Sử dụng extractErrorMessage để xử lý lỗi từ API
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi thêm hàng hóa")
      window.showToast(`Lỗi: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      goodsCode: "",
      goodsName: "",
      categoryId: "",
      supplierId: "",
      storageConditionId: "",
      unitMeasureId: "",
    })
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Thêm hàng hóa mới</h1>
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
            {/* Row 1: Goods Code & Goods Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="goodsCode" className="text-sm font-medium text-slate-700">
                  Mã hàng hóa *
                </Label>
                <Input
                  id="goodsCode"
                  placeholder="Nhập mã hàng hóa..."
                  value={formData.goodsCode}
                  onChange={(e) => setFormData({ ...formData, goodsCode: e.target.value })}
                  className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goodsName" className="text-sm font-medium text-slate-700">
                  Tên hàng hóa *
                </Label>
                <Input
                  id="goodsName"
                  placeholder="Nhập tên hàng hóa..."
                  value={formData.goodsName}
                  onChange={(e) => setFormData({ ...formData, goodsName: e.target.value })}
                  className="h-12 border-slate-300 focus:border-[#237486] focus:ring-[#237486]"
                  required
                />
              </div>
            </div>

            {/* Row 2: Category & Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-sm font-medium text-slate-700">
                  Danh mục *
                </Label>
                <CustomDropdown
                  value={formData.categoryId}
                  onChange={(value) => setFormData({ ...formData, categoryId: value })}
                  options={[
                    { value: "", label: "Chọn danh mục..." },
                    ...categories.map((category) => ({
                      value: category.categoryId.toString(),
                      label: category.categoryName
                    }))
                  ]}
                  placeholder="Chọn danh mục..."
                  loading={loadingData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierId" className="text-sm font-medium text-slate-700">
                  Nhà cung cấp *
                </Label>
                <CustomDropdown
                  value={formData.supplierId}
                  onChange={(value) => setFormData({ ...formData, supplierId: value })}
                  options={[
                    { value: "", label: "Chọn nhà cung cấp..." },
                    ...suppliers.map((supplier) => ({
                      value: supplier.supplierId.toString(),
                      label: supplier.companyName
                    }))
                  ]}
                  placeholder="Chọn nhà cung cấp..."
                  loading={loadingData}
                />
              </div>
            </div>

            {/* Row 3: Storage Condition & Unit Measure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storageConditionId" className="text-sm font-medium text-slate-700">
                  Điều kiện bảo quản *
                </Label>
                <CustomDropdown
                  value={formData.storageConditionId}
                  onChange={(value) => setFormData({ ...formData, storageConditionId: value })}
                  options={[
                    { value: "", label: "Chọn điều kiện bảo quản..." },
                    ...storageConditions.map((condition) => ({
                      value: condition.storageConditionId.toString(),
                      label: `- Nhiệt độ: ${condition.temperatureMin}°C đến ${condition.temperatureMax}°C - Độ ẩm: ${condition.humidityMin}% đến ${condition.humidityMax}%`
                    }))
                  ]}
                  placeholder="Chọn điều kiện bảo quản..."
                  loading={loadingData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitMeasureId" className="text-sm font-medium text-slate-700">
                  Đơn vị đo *
                </Label>
                <CustomDropdown
                  value={formData.unitMeasureId}
                  onChange={(value) => setFormData({ ...formData, unitMeasureId: value })}
                  options={[
                    { value: "", label: "Chọn đơn vị đo..." },
                    ...unitMeasures.map((unit) => ({
                      value: unit.unitMeasureId.toString(),
                      label: unit.name
                    }))
                  ]}
                  placeholder="Chọn đơn vị đo..."
                  loading={loadingData}
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
