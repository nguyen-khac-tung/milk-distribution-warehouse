
import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X, Plus, Trash2 } from "lucide-react"
import CustomDropdown from "../../components/Common/CustomDropdown"
import { createGood } from "../../services/GoodService"
import { getCategoriesDropdown } from "../../services/CategoryService/CategoryServices"
import { getSuppliersDropdown } from "../../services/SupplierService"
import { getStorageConditionsDropdown } from "../../services/StorageConditionService"
import { getUnitMeasuresDropdown } from "../../services/UnitMeasureService"
import { validateAndShowError, extractErrorMessage } from "../../utils/Validation"
import FloatingDropdown from "../../components/Common/FloatingDropdown"

export default function CreateGood({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    goodsCode: "",
    goodsName: "",
    categoryId: "",
    supplierId: "",
    storageConditionId: "",
    unitMeasureId: "",
  })
  const [goodsPackingCreates, setGoodsPackingCreates] = useState([
    { unitPerPackage: "" }
  ])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [storageConditions, setStorageConditions] = useState([])
  const [unitMeasures, setUnitMeasures] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [packingErrors, setPackingErrors] = useState({})

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

  // Functions to manage goodsPackingCreates
  const addPackingItem = () => {
    setGoodsPackingCreates([...goodsPackingCreates, { unitPerPackage: "" }])
  }

  const removePackingItem = (index) => {
    if (goodsPackingCreates.length > 1) {
      setGoodsPackingCreates(goodsPackingCreates.filter((_, i) => i !== index))
      // Remove error for this index and reindex remaining errors
      const newPackingErrors = {}
      goodsPackingCreates.forEach((_, i) => {
        if (i !== index && packingErrors[i]) {
          const newIndex = i > index ? i - 1 : i
          newPackingErrors[newIndex] = packingErrors[i]
        }
      })
      setPackingErrors(newPackingErrors)
    }
  }

  const updatePackingItem = (index, value) => {
    const updatedPackings = goodsPackingCreates.map((item, i) =>
      i === index ? { ...item, unitPerPackage: value } : item
    )
    setGoodsPackingCreates(updatedPackings)
    // Clear error for this packing item when user starts typing
    if (packingErrors[index]) {
      setPackingErrors({ ...packingErrors, [index]: undefined })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all required fields
    const errors = {}
    const packingErrs = {}

    if (!formData.goodsCode?.trim()) {
      errors.goodsCode = "Vui lòng nhập mã hàng hóa"
    }

    if (!formData.goodsName?.trim()) {
      errors.goodsName = "Vui lòng nhập tên hàng hóa"
    }

    if (!formData.categoryId || formData.categoryId === "") {
      errors.categoryId = "Vui lòng chọn danh mục"
    }

    if (!formData.supplierId || formData.supplierId === "") {
      errors.supplierId = "Vui lòng chọn nhà cung cấp"
    }

    if (!formData.storageConditionId || formData.storageConditionId === "") {
      errors.storageConditionId = "Vui lòng chọn điều kiện bảo quản"
    }

    if (!formData.unitMeasureId || formData.unitMeasureId === "") {
      errors.unitMeasureId = "Vui lòng chọn đơn vị đo"
    }

    // Validate goodsPackingCreates
    let hasPackingError = false
    goodsPackingCreates.forEach((packing, index) => {
      if (!packing.unitPerPackage || packing.unitPerPackage === "" || isNaN(packing.unitPerPackage) || parseInt(packing.unitPerPackage) <= 0) {
        packingErrs[index] = "Vui lòng nhập số lượng hợp lệ (> 0)"
        hasPackingError = true
      }
    })

    if (hasPackingError || goodsPackingCreates.length === 0) {
      if (goodsPackingCreates.length === 0) {
        errors.packing = "Vui lòng nhập ít nhất một thông tin đóng gói"
      }
      setPackingErrors(packingErrs)
    }

    if (Object.keys(errors).length > 0 || hasPackingError) {
      setValidationErrors(errors)
      return
    }

    // Clear validation errors if validation passes
    setValidationErrors({})
    setPackingErrors({})

    // Filter valid packings for submission
    const validPackings = goodsPackingCreates.filter(packing =>
      packing.unitPerPackage && !isNaN(packing.unitPerPackage) && parseInt(packing.unitPerPackage) > 0
    )

    try {
      setLoading(true)
      const submitData = {
        ...formData,
        goodsPackingCreates: validPackings.map(packing => ({
          unitPerPackage: parseInt(packing.unitPerPackage)
        }))
      }

      const response = await createGood(submitData)
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
    setGoodsPackingCreates([{ unitPerPackage: "" }])
    setValidationErrors({})
    setPackingErrors({})
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
                  Mã hàng hóa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="goodsCode"
                  placeholder="Nhập mã hàng hóa..."
                  value={formData.goodsCode}
                  onChange={(e) => {
                    setFormData({ ...formData, goodsCode: e.target.value })
                    if (validationErrors.goodsCode) {
                      setValidationErrors({ ...validationErrors, goodsCode: undefined })
                    }
                  }}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
                {validationErrors.goodsCode && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.goodsCode}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="goodsName" className="text-sm font-medium text-slate-700">
                  Tên hàng hóa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="goodsName"
                  placeholder="Nhập tên hàng hóa..."
                  value={formData.goodsName}
                  onChange={(e) => {
                    setFormData({ ...formData, goodsName: e.target.value })
                    if (validationErrors.goodsName) {
                      setValidationErrors({ ...validationErrors, goodsName: undefined })
                    }
                  }}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
                {validationErrors.goodsName && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.goodsName}</p>
                )}
              </div>
            </div>

            {/* Row 2: Category & Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-sm font-medium text-slate-700">
                  Danh mục <span className="text-red-500">*</span>
                </Label>
                <FloatingDropdown
                  value={formData.categoryId ? formData.categoryId.toString() : null}
                  onChange={(value) => {
                    setFormData({ ...formData, categoryId: value ? parseInt(value) : null });
                    if (validationErrors.categoryId) {
                      setValidationErrors({ ...validationErrors, categoryId: undefined });
                    }
                  }}
                  options={categories.map((category) => ({
                    value: category.categoryId.toString(),
                    label: category.categoryName,
                  }))}
                  placeholder="Chọn danh mục..."
                  loading={loadingData}
                />
                {validationErrors.categoryId && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.categoryId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierId" className="text-sm font-medium text-slate-700">
                  Nhà cung cấp <span className="text-red-500">*</span>
                </Label>
                <FloatingDropdown
                  value={formData.supplierId ? formData.supplierId.toString() : null}
                  onChange={(value) => {
                    setFormData({ ...formData, supplierId: value ? parseInt(value) : null });
                    if (validationErrors.supplierId) {
                      setValidationErrors({ ...validationErrors, supplierId: undefined });
                    }
                  }}
                  options={suppliers.map((supplier) => ({
                    value: supplier.supplierId.toString(),
                    label: supplier.companyName,
                  }))}
                  placeholder="Chọn nhà cung cấp..."
                  loading={loadingData}
                />
                {validationErrors.supplierId && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.supplierId}</p>
                )}
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
                  onChange={(value) => {
                    setFormData({ ...formData, storageConditionId: value })
                    if (validationErrors.storageConditionId) {
                      setValidationErrors({ ...validationErrors, storageConditionId: undefined })
                    }
                  }}
                  options={[
                    { value: "", label: "Chọn điều kiện bảo quản..." },
                    ...storageConditions.map((condition) => ({
                      value: condition.storageConditionId?.toString() || condition.id?.toString() || "",
                      label: condition.lightLevel || `- Nhiệt độ: ${condition.temperatureMin}°C đến ${condition.temperatureMax}°C - Độ ẩm: ${condition.humidityMin}% đến ${condition.humidityMax}%`
                    }))
                  ]}
                  placeholder="Chọn điều kiện bảo quản..."
                  loading={loadingData}
                />
                {validationErrors.storageConditionId && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.storageConditionId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitMeasureId" className="text-sm font-medium text-slate-700">
                  Đơn vị đo <span className="text-red-500">*</span>
                </Label>
                <FloatingDropdown
                  value={formData.unitMeasureId ? formData.unitMeasureId.toString() : null}
                  onChange={(value) => {
                    setFormData({ ...formData, unitMeasureId: value ? parseInt(value) : null });
                    if (validationErrors.unitMeasureId) {
                      setValidationErrors({ ...validationErrors, unitMeasureId: undefined });
                    }
                  }}
                  options={unitMeasures.map((unit) => ({
                    value: unit.unitMeasureId.toString(),
                    label: unit.name,
                  }))}
                  placeholder="Chọn đơn vị đo..."
                  loading={loadingData}
                />
                {validationErrors.unitMeasureId && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.unitMeasureId}</p>
                )}
              </div>
            </div>

            {/* Goods Packing Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">
                  Thông tin đóng gói <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  onClick={addPackingItem}
                  className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Thêm đóng gói
                </Button>
              </div>

              <Card className="p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goodsPackingCreates.map((packing, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-medium text-slate-600">
                          Số {unitMeasures.find(unit => unit.unitMeasureId.toString() === formData.unitMeasureId)?.name || 'đơn vị'} trên 1 thùng
                        </Label>
                        <Input
                          type="number"
                          placeholder="Nhập số lượng..."
                          value={packing.unitPerPackage}
                          onChange={(e) => updatePackingItem(index, e.target.value)}
                          className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                          min="1"
                        />
                        {packingErrors[index] && (
                          <p className="text-sm text-red-500 font-medium">{packingErrors[index]}</p>
                        )}
                      </div>
                      {goodsPackingCreates.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removePackingItem(index)}
                          className="h-[38px] w-[38px] p-0 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {validationErrors.packing && (
                  <p className="text-sm text-red-500 font-medium mt-3">{validationErrors.packing}</p>
                )}

                <p className="text-xs text-slate-500 mt-3">
                  * Nhập số lượng {unitMeasures.find(unit => unit.unitMeasureId.toString() === formData.unitMeasureId)?.name || 'đơn vị'} có trong mỗi thùng đóng gói
                </p>
              </Card>
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
