
import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X } from "lucide-react"
import CustomDropdown from "../../components/Common/CustomDropdown"
import { updateGood, getGoodDetail } from "../../services/GoodService"
import { getCategoriesDropdown } from "../../services/CategoryService/CategoryServices"
import { getSuppliersDropdown } from "../../services/SupplierService"
import { getStorageConditionsDropdown } from "../../services/StorageConditionService"
import { getUnitMeasuresDropdown } from "../../services/UnitMeasureService"
import { validateAndShowError, extractErrorMessage } from "../../utils/Validation"

export default function UpdateGoodModal({ isOpen, onClose, onSuccess, goodId }) {
  const [formData, setFormData] = useState({
    goodsId: 0,
    goodsName: "",
    categoryId: 0,
    supplierId: 0,
    storageConditionId: 0,
    unitMeasureId: 0,
  })
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [storageConditions, setStorageConditions] = useState([])
  const [unitMeasures, setUnitMeasures] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Load data for dropdowns and good details
  useEffect(() => {
    if (isOpen && goodId) {
      // Reset formData khi mở modal
      setFormData({
        goodsId: 0,
        goodsName: "",
        categoryId: 0,
        supplierId: 0,
        storageConditionId: 0,
        unitMeasureId: 0,
      })
      
      loadDropdownData().then(() => {
        // Đợi một chút để đảm bảo state đã được update
        setTimeout(() => {
          loadGoodData()
        }, 100)
      })
    }
  }, [isOpen, goodId])

  // Effect để đảm bảo formData được update khi dropdown data thay đổi
  useEffect(() => {
    if (categories.length > 0 && storageConditions.length > 0 && formData.categoryId === 0 && formData.storageConditionId === 0) {
      // Nếu dropdown data đã load nhưng formData vẫn chưa được set, load lại good data
      if (goodId) {
        loadGoodData()
      }
    }
  }, [categories, storageConditions])

  const loadGoodData = async () => {
    try {
      setLoadingData(true)
      const response = await getGoodDetail(goodId)
      
      if (response && response.data) {
        const good = response.data
        const newFormData = {
          goodsId: good.goodsId || 0,
          goodsName: good.goodsName || "",
          categoryId: good.categoryId || 0,
          supplierId: good.supplierId || 0,
          storageConditionId: good.storageConditionId || 0,
          unitMeasureId: good.unitMeasureId || 0,
        }
        setFormData(newFormData)
      }
    } catch (error) {
      console.error("Error loading good data:", error)
      const errorMessage = extractErrorMessage(error, "Lỗi khi tải thông tin hàng hóa")
      window.showToast(errorMessage, "error")
    } finally {
      setLoadingData(false)
    }
  }

  const loadDropdownData = async () => {
    try {
      setLoadingData(true)
      const [categoriesRes, suppliersRes, storageConditionsRes, unitMeasuresRes] = await Promise.all([
        getCategoriesDropdown(),
        getSuppliersDropdown(),
        getStorageConditionsDropdown(),
        getUnitMeasuresDropdown()
      ])

      // Handle dropdown response structures (data is directly an array)
      setCategories(categoriesRes?.data || [])
      setSuppliers(suppliersRes?.data || [])
      setStorageConditions(storageConditionsRes?.data || [])
      setUnitMeasures(unitMeasuresRes?.data || [])
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
    if (!formData.goodsName || !formData.categoryId ||
      !formData.supplierId || !formData.storageConditionId || !formData.unitMeasureId) {
      window.showToast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    try {
      setLoading(true)
      const response = await updateGood(formData)
      console.log("Good updated:", response)
      window.showToast("Cập nhật hàng hóa thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error updating good:", error)

      // Sử dụng extractErrorMessage để xử lý lỗi từ API
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật hàng hóa")
      window.showToast(`Lỗi: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }


  const handleReset = () => {
    setFormData({
      goodsId: 0,
      goodsName: "",
      categoryId: 0,
      supplierId: 0,
      storageConditionId: 0,
      unitMeasureId: 0,
    })
    onClose && onClose()
  }


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật hàng hóa</h1>
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
            {/* Row 1: Goods Name */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="goodsName" className="text-sm font-medium text-slate-700">
                  Tên hàng hóa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="goodsName"
                  placeholder="Nhập tên hàng hóa..."
                  value={formData.goodsName}
                  onChange={(e) => setFormData({ ...formData, goodsName: e.target.value })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Row 2: Category & Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-sm font-medium text-slate-700">
                  Danh mục <span className="text-red-500">*</span>
                </Label>
                <CustomDropdown
                  value={formData.categoryId}
                  onChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
                  options={[
                    { value: 0, label: "Chọn danh mục..." },
                    ...categories.map((category) => ({
                      value: category.categoryId,
                      label: category.categoryName
                    }))
                  ]}
                  placeholder="Chọn danh mục..."
                  loading={loadingData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierId" className="text-sm font-medium text-slate-700">
                  Nhà cung cấp <span className="text-red-500">*</span>
                </Label>
                <CustomDropdown
                  value={formData.supplierId}
                  onChange={(value) => setFormData({ ...formData, supplierId: parseInt(value) })}
                  options={[
                    { value: 0, label: "Chọn nhà cung cấp..." },
                    ...suppliers.map((supplier) => ({
                      value: supplier.supplierId,
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
                  Điều kiện bảo quản <span className="text-red-500">*</span>
                </Label>
                <CustomDropdown
                  value={formData.storageConditionId}
                  onChange={(value) => setFormData({ ...formData, storageConditionId: parseInt(value) })}
                  options={[
                    { value: 0, label: "Chọn điều kiện bảo quản..." },
                    ...storageConditions.map((condition) => ({
                      value: condition.storageConditionId || condition.id || 0,
                      label: condition.lightLevel || `- Nhiệt độ: ${condition.temperatureMin}°C đến ${condition.temperatureMax}°C - Độ ẩm: ${condition.humidityMin}% đến ${condition.humidityMax}%`
                    }))
                  ]}
                  placeholder="Chọn điều kiện bảo quản..."
                  loading={loadingData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitMeasureId" className="text-sm font-medium text-slate-700">
                  Đơn vị đo <span className="text-red-500">*</span>
                </Label>
                <CustomDropdown
                  value={formData.unitMeasureId}
                  onChange={(value) => setFormData({ ...formData, unitMeasureId: parseInt(value) })}
                  options={[
                    { value: 0, label: "Chọn đơn vị đo..." },
                    ...unitMeasures.map((unit) => ({
                      value: unit.unitMeasureId,
                      label: unit.name
                    }))
                  ]}
                  placeholder="Chọn đơn vị đo..."
                  loading={loadingData}
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
                {loading ? "Đang cập nhật..." : loadingData ? "Đang tải..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
