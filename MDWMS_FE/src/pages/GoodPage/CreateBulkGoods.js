import React, { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X, Plus, Trash2, Package } from "lucide-react"
import CustomDropdown from "../../components/Common/CustomDropdown"
import { createGood } from "../../services/GoodService"
import { getCategoriesDropdown } from "../../services/CategoryService/CategoryServices"
import { getSuppliersDropdown } from "../../services/SupplierService"
import { getStorageConditionsDropdown } from "../../services/StorageConditionService"
import { getUnitMeasuresDropdown } from "../../services/UnitMeasureService"
import { validateAndShowError, extractErrorMessage, cleanErrorMessage } from "../../utils/Validation"
import Loading from "../../components/Common/Loading"

export default function CreateBulkGoods({ isOpen, onClose, onSuccess }) {
  const [goodsList, setGoodsList] = useState([
    {
      goodsCode: "",
      goodsName: "",
      categoryId: "",
      supplierId: "",
      storageConditionId: "",
      unitMeasureId: "",
      goodsPackingCreates: [{ unitPerPackage: "" }]
    }
  ])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [storageConditions, setStorageConditions] = useState([])
  const [unitMeasures, setUnitMeasures] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [errors, setErrors] = useState({})
  const [hasBackendErrors, setHasBackendErrors] = useState(false)
  const [successfulGoods, setSuccessfulGoods] = useState(new Set())
  const isCheckingDuplicates = useRef(false)

  // Default values state
  const [defaultValues, setDefaultValues] = useState({
    categoryId: "",
    supplierId: "",
    storageConditionId: "",
    unitMeasureId: ""
  })
  const [useDefaults, setUseDefaults] = useState(false)
  const [defaultFields, setDefaultFields] = useState({
    category: false,
    supplier: false,
    storageCondition: false,
    unitMeasure: false
  })

  // Load data for dropdowns
  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
    }
  }, [isOpen])

  // Apply default values to first goods item when defaults change
  useEffect(() => {
    if (useDefaults && goodsList.length > 0) {
      const firstGoods = goodsList[0]
      const updatedGoods = { ...firstGoods }

      if (defaultFields.category && defaultValues.categoryId) {
        updatedGoods.categoryId = defaultValues.categoryId
      }
      if (defaultFields.supplier && defaultValues.supplierId) {
        updatedGoods.supplierId = defaultValues.supplierId
      }
      if (defaultFields.storageCondition && defaultValues.storageConditionId) {
        updatedGoods.storageConditionId = defaultValues.storageConditionId
      }
      if (defaultFields.unitMeasure && defaultValues.unitMeasureId) {
        updatedGoods.unitMeasureId = defaultValues.unitMeasureId
      }

      const shouldUpdate =
        firstGoods.categoryId !== updatedGoods.categoryId ||
        firstGoods.supplierId !== updatedGoods.supplierId ||
        firstGoods.storageConditionId !== updatedGoods.storageConditionId ||
        firstGoods.unitMeasureId !== updatedGoods.unitMeasureId

      if (shouldUpdate) {
        const updatedGoodsList = [...goodsList]
        updatedGoodsList[0] = updatedGoods
        setGoodsList(updatedGoodsList)
      }
    }
  }, [defaultValues, useDefaults, defaultFields])

  // Check for duplicates when goodsList changes
  useEffect(() => {
    if (isCheckingDuplicates.current) return

    isCheckingDuplicates.current = true
    const newErrors = { ...errors }
    let hasDuplicates = false

    goodsList.forEach((goods, index) => {
      if (goods.goodsCode) {
        const duplicateIndex = goodsList.findIndex((g, i) => i !== index && g.goodsCode === goods.goodsCode)
        if (duplicateIndex !== -1) {
          newErrors[`${index}-goodsCode`] = "Mã hàng hóa đã tồn tại trong danh sách"
          hasDuplicates = true
        } else {
          // Clear duplicate error if no longer duplicate
          delete newErrors[`${index}-goodsCode`]
        }
      }
    })

    if (hasDuplicates || Object.keys(newErrors).length !== Object.keys(errors).length) {
      setErrors(newErrors)
      setHasBackendErrors(hasDuplicates)
    }

    isCheckingDuplicates.current = false
  }, [goodsList])

  const loadDropdownData = async () => {
    try {
      setLoadingData(true)
      const [categoriesRes, suppliersRes, storageConditionsRes, unitMeasuresRes] = await Promise.all([
        getCategoriesDropdown(),
        getSuppliersDropdown(),
        getStorageConditionsDropdown(),
        getUnitMeasuresDropdown()
      ])

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

  const addGoodsRow = () => {
    const newGoods = {
      goodsCode: "",
      goodsName: "",
      categoryId: (useDefaults && defaultFields.category) ? defaultValues.categoryId : "",
      supplierId: (useDefaults && defaultFields.supplier) ? defaultValues.supplierId : "",
      storageConditionId: (useDefaults && defaultFields.storageCondition) ? defaultValues.storageConditionId : "",
      unitMeasureId: (useDefaults && defaultFields.unitMeasure) ? defaultValues.unitMeasureId : "",
      goodsPackingCreates: [{ unitPerPackage: "" }]
    }
    const newGoodsList = [...goodsList, newGoods]
    setGoodsList(newGoodsList)

    // Re-check for duplicates after adding new row
    const newErrors = { ...errors }
    newGoodsList.forEach((goods, index) => {
      if (goods.goodsCode) {
        const duplicateIndex = newGoodsList.findIndex((g, i) => i !== index && g.goodsCode === goods.goodsCode)
        if (duplicateIndex !== -1) {
          newErrors[`${index}-goodsCode`] = "Mã hàng hóa đã tồn tại trong danh sách"
        }
      }
    })
    setErrors(newErrors)
    setHasBackendErrors(Object.keys(newErrors).length > 0)
  }

  const removeGoodsRow = (index) => {
    console.log('Removing goods at index:', index, 'Current goodsList length:', goodsList.length)

    if (goodsList.length > 1) {
      const newList = goodsList.filter((_, i) => i !== index)
      console.log('New list after removal:', newList)
      setGoodsList(newList)

      // Update successfulGoods set to remove the deleted index and re-index remaining indices
      const newSuccessfulGoods = new Set()
      successfulGoods.forEach(successIndex => {
        if (successIndex < index) {
          // Keep successful goods before the removed row
          newSuccessfulGoods.add(successIndex)
        } else if (successIndex > index) {
          // Re-index successful goods after the removed row
          newSuccessfulGoods.add(successIndex - 1)
        }
        // Skip the removed row (successIndex === index)
      })
      console.log('Updated successfulGoods:', newSuccessfulGoods)
      setSuccessfulGoods(newSuccessfulGoods)

      // Clear errors for removed row and re-index remaining errors
      const newErrors = {}
      Object.keys(errors).forEach(key => {
        const [errorIndex, field] = key.split('-')
        const errorIndexNum = parseInt(errorIndex)

        if (errorIndexNum < index) {
          // Keep errors for rows before the removed row
          newErrors[key] = errors[key]
        } else if (errorIndexNum > index) {
          // Re-index errors for rows after the removed row
          newErrors[`${errorIndexNum - 1}-${field}`] = errors[key]
        }
        // Skip errors for the removed row (errorIndexNum === index)
      })

      // Re-check for duplicates after removing row
      newList.forEach((goods, newIndex) => {
        if (goods.goodsCode) {
          const duplicateIndex = newList.findIndex((g, i) => i !== newIndex && g.goodsCode === goods.goodsCode)
          if (duplicateIndex !== -1) {
            newErrors[`${newIndex}-goodsCode`] = "Mã hàng hóa đã tồn tại trong danh sách"
          }
        }
      })

      setErrors(newErrors)
      setHasBackendErrors(Object.keys(newErrors).length > 0)
    } else {
      console.log('Cannot remove last remaining goods item')
    }
  }

  const updateGoodsRow = (index, field, value) => {
    const newList = [...goodsList]
    newList[index][field] = value
    setGoodsList(newList)

    // Clear error for this field
    const errorKey = `${index}-${field}`
    if (errors[errorKey]) {
      const newErrors = { ...errors }
      delete newErrors[errorKey]
      setErrors(newErrors)

      // Check if there are still backend errors
      const remainingBackendErrors = Object.keys(newErrors).some(key =>
        key.includes('-') && !key.includes('required')
      )
      setHasBackendErrors(remainingBackendErrors)
    }

    // Check for duplicate goods codes when goodsCode is updated
    if (field === 'goodsCode' && value) {
      const duplicateIndex = newList.findIndex((g, i) => i !== index && g.goodsCode === value)
      if (duplicateIndex !== -1) {
        const newErrors = { ...errors }
        newErrors[`${index}-goodsCode`] = "Mã hàng hóa đã tồn tại trong danh sách"
        setErrors(newErrors)
        setHasBackendErrors(true)
      }
    }
  }

  const addPackingRow = (goodsIndex) => {
    const newList = [...goodsList]
    if (!newList[goodsIndex].goodsPackingCreates) {
      newList[goodsIndex].goodsPackingCreates = []
    }
    newList[goodsIndex].goodsPackingCreates.push({ unitPerPackage: "" })
    setGoodsList(newList)
  }

  const removePackingRow = (goodsIndex, packingIndex) => {
    const newList = [...goodsList]
    if (newList[goodsIndex].goodsPackingCreates && newList[goodsIndex].goodsPackingCreates.length > 1) {
      newList[goodsIndex].goodsPackingCreates = newList[goodsIndex].goodsPackingCreates.filter((_, i) => i !== packingIndex)
      setGoodsList(newList)
    }
  }

  const updatePackingRow = (goodsIndex, packingIndex, field, value) => {
    const newList = [...goodsList]
    if (!newList[goodsIndex].goodsPackingCreates) {
      newList[goodsIndex].goodsPackingCreates = []
    }
    if (!newList[goodsIndex].goodsPackingCreates[packingIndex]) {
      newList[goodsIndex].goodsPackingCreates[packingIndex] = {}
    }
    newList[goodsIndex].goodsPackingCreates[packingIndex][field] = value
    setGoodsList(newList)

    // Clear error for this field
    const errorKey = `${goodsIndex}-packing-${packingIndex}-${field}`
    if (errors[errorKey]) {
      const newErrors = { ...errors }
      delete newErrors[errorKey]
      setErrors(newErrors)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    let isValid = true

    goodsList.forEach((goods, index) => {
      const requiredFields = ['goodsCode', 'goodsName', 'categoryId', 'supplierId', 'storageConditionId', 'unitMeasureId']

      requiredFields.forEach(field => {
        if (!goods[field]) {
          newErrors[`${index}-${field}`] = "Trường này là bắt buộc"
          isValid = false
        }
      })

      // Check for duplicate goods codes
      const duplicateIndex = goodsList.findIndex((g, i) => i !== index && g.goodsCode === goods.goodsCode)
      if (duplicateIndex !== -1 && goods.goodsCode) {
        newErrors[`${index}-goodsCode`] = "Mã hàng hóa đã tồn tại trong danh sách"
        isValid = false
      }

      // Validate packing - at least one packing is required and must have unitPerPackage
      if (!goods.goodsPackingCreates || goods.goodsPackingCreates.length === 0) {
        newErrors[`${index}-packing`] = "Vui lòng thêm ít nhất một quy cách đóng gói"
        isValid = false
      } else {
        goods.goodsPackingCreates.forEach((packing, packingIndex) => {
          if (!packing.unitPerPackage || packing.unitPerPackage === "" || Number(packing.unitPerPackage) <= 0) {
            newErrors[`${index}-packing-${packingIndex}-unitPerPackage`] = "Số đơn vị/bao phải lớn hơn 0"
            isValid = false
          }
        })
      }
    })

    setErrors(newErrors)
    setHasBackendErrors(Object.keys(newErrors).length > 0)
    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      window.showToast("Vui lòng kiểm tra lại thông tin", "error")
      return
    }

    try {
      setLoading(true)

      // Create goods one by one
      const results = []
      const errors = []
      const newErrors = {}

      for (let i = 0; i < goodsList.length; i++) {
        // Skip already successful goods
        if (successfulGoods.has(i)) {
          results.push({ index: i, success: true, data: null })
          continue
        }

        try {
          // Format data for API - convert to proper types and structure
          const goodsData = {
            goodsCode: goodsList[i].goodsCode,
            goodsName: goodsList[i].goodsName,
            categoryId: Number(goodsList[i].categoryId),
            supplierId: Number(goodsList[i].supplierId),
            storageConditionId: Number(goodsList[i].storageConditionId),
            unitMeasureId: Number(goodsList[i].unitMeasureId),
            goodsPackingCreates: (goodsList[i].goodsPackingCreates || []).map(packing => ({
              unitPerPackage: Number(packing.unitPerPackage) || 0
            })).filter(packing => packing.unitPerPackage > 0)
          }

          const response = await createGood(goodsData)
          results.push({ index: i, success: true, data: response })
        } catch (error) {
          console.error(`Error creating good ${i + 1}:`, error)

          // Extract backend error details
          let backendErrors = {}
          if (error.response?.data?.errors) {
            // Handle structured errors from backend
            const structuredErrors = error.response.data.errors
            Object.keys(structuredErrors).forEach(field => {
              if (Array.isArray(structuredErrors[field])) {
                // If it's an array, take the first error and clean it
                backendErrors[field] = cleanErrorMessage(structuredErrors[field][0])
              } else {
                // If it's a string, clean it directly
                backendErrors[field] = cleanErrorMessage(structuredErrors[field])
              }
            })
          } else if (error.response?.data?.message) {
            // If it's a single error message, convert to field errors
            const errorMessage = error.response.data.message.toLowerCase()

            // Check for duplicate goods code errors
            if (errorMessage.includes('goodsCode') || errorMessage.includes('mã hàng hóa') ||
              errorMessage.includes('đã tồn tại') || errorMessage.includes('duplicate') ||
              errorMessage.includes('already exists') || errorMessage.includes('trùng lặp')) {
              backendErrors.goodsCode = cleanErrorMessage(error.response.data.message)
            } else if (errorMessage.includes('goodsName') || errorMessage.includes('tên hàng hóa')) {
              backendErrors.goodsName = cleanErrorMessage(error.response.data.message)
            } else if (errorMessage.includes('category') || errorMessage.includes('danh mục')) {
              backendErrors.categoryId = cleanErrorMessage(error.response.data.message)
            } else if (errorMessage.includes('supplier') || errorMessage.includes('nhà cung cấp')) {
              backendErrors.supplierId = cleanErrorMessage(error.response.data.message)
            } else if (errorMessage.includes('storage') || errorMessage.includes('bảo quản')) {
              backendErrors.storageConditionId = cleanErrorMessage(error.response.data.message)
            } else if (errorMessage.includes('unit') || errorMessage.includes('đơn vị')) {
              backendErrors.unitMeasureId = cleanErrorMessage(error.response.data.message)
            } else {
              // General error - show as a general message
              backendErrors.general = cleanErrorMessage(error.response.data.message)
            }
          } else if (error.response?.data) {
            // Handle other error formats
            const errorData = error.response.data
            if (typeof errorData === 'string') {
              backendErrors.general = cleanErrorMessage(errorData)
            } else if (errorData.error) {
              backendErrors.general = cleanErrorMessage(errorData.error)
            }
          }

          // Add backend errors to form errors
          Object.keys(backendErrors).forEach(field => {
            if (field === 'general') {
              // For general errors, we'll show them in toast
              errors.push({ index: i, error: backendErrors[field] })
            } else {
              // For field-specific errors, show under the field
              newErrors[`${i}-${field}`] = backendErrors[field]
            }
          })

          // If no specific field errors, add general error
          if (Object.keys(backendErrors).length === 0) {
            const errorMessage = extractErrorMessage(error, "Lỗi khi tạo hàng hóa")
            errors.push({ index: i, error: errorMessage })
          }
        }
      }

      // Update errors state
      setErrors(prevErrors => ({ ...prevErrors, ...newErrors }))

      // Check if there are backend errors
      const hasBackendErrorsNow = Object.keys(newErrors).length > 0
      setHasBackendErrors(hasBackendErrorsNow)

      // Show results
      const newSuccessfulGoods = new Set([...successfulGoods, ...results.map(r => r.index)])
      setSuccessfulGoods(newSuccessfulGoods)

      if (results.length === goodsList.length) {
        // All goods created successfully
        window.showToast(`Đã tạo thành công ${results.length} hàng hóa!`, "success")
        setHasBackendErrors(false)
        setSuccessfulGoods(new Set())
        // Reset default values
        setDefaultValues({
          categoryId: "",
          supplierId: "",
          storageConditionId: "",
          unitMeasureId: ""
        })
        setUseDefaults(false)
        setDefaultFields({
          category: false,
          supplier: false,
          storageCondition: false,
          unitMeasure: false
        })
        // Call onSuccess to refresh the list before closing
        onSuccess && onSuccess()
        onClose && onClose()
      } else {
        // Some goods failed to create - don't close modal
        const errorMessages = errors.map(err => `Hàng hóa ${err.index + 1}: ${err.error}`).join('\n')
        const duplicateErrors = errors.filter(err =>
          err.error.includes('đã tồn tại') || err.error.includes('duplicate') ||
          err.error.includes('already exists') || err.error.includes('trùng lặp')
        )

        let toastMessage = `Tạo thành công ${results.length}/${goodsList.length} hàng hóa.\n\nCòn ${goodsList.length - results.length} hàng hóa cần sửa lỗi trước khi có thể đóng modal.`

        if (duplicateErrors.length > 0) {
          toastMessage += `\n\n Có ${duplicateErrors.length} hàng hóa bị trùng mã với dữ liệu trong hệ thống.`
        }

        window.showToast(toastMessage, "warning")

        setHasBackendErrors(true)
      }

    } catch (error) {
      console.error("Error in bulk create:", error)
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tạo hàng hóa")
      window.showToast(`Lỗi: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setGoodsList([{
      goodsCode: "",
      goodsName: "",
      categoryId: (useDefaults && defaultFields.category) ? defaultValues.categoryId : "",
      supplierId: (useDefaults && defaultFields.supplier) ? defaultValues.supplierId : "",
      storageConditionId: (useDefaults && defaultFields.storageCondition) ? defaultValues.storageConditionId : "",
      unitMeasureId: (useDefaults && defaultFields.unitMeasure) ? defaultValues.unitMeasureId : "",
      goodsPackingCreates: [{ unitPerPackage: "" }]
    }])
    setErrors({})
    setHasBackendErrors(false)
    setSuccessfulGoods(new Set())
    setDefaultValues({
      categoryId: "",
      supplierId: "",
      storageConditionId: "",
      unitMeasureId: ""
    })
    setUseDefaults(false)
    setDefaultFields({
      category: false,
      supplier: false,
      storageCondition: false,
      unitMeasure: false
    })
    // Call onSuccess to refresh the list when resetting
    onSuccess && onSuccess()
    onClose && onClose()
  }

  const handleClose = () => {
    if (hasBackendErrors) {
      window.showToast("Vui lòng sửa lỗi trước khi đóng modal hoặc nhấn Hủy để bỏ qua", "warning")
      return
    }
    // Reset default values when closing
    setDefaultValues({
      categoryId: "",
      supplierId: "",
      storageConditionId: "",
      unitMeasureId: ""
    })
    setUseDefaults(false)
    setDefaultFields({
      category: false,
      supplier: false,
      storageCondition: false,
      unitMeasure: false
    })
    // Call onSuccess to refresh the list when closing modal
    onSuccess && onSuccess()
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-slate-800">Thêm nhiều hàng hóa</h1>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Default Values Setup */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-orange-800">Thiết lập giá trị mặc định</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useDefaults"
                    checked={useDefaults}
                    onChange={(e) => setUseDefaults(e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useDefaults" className="text-sm font-medium text-orange-800">
                    Sử dụng giá trị mặc định
                  </label>
                </div>
              </div>

              {useDefaults && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Default Category */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="defaultCategory"
                        checked={defaultFields.category}
                        onChange={(e) => setDefaultFields(prev => ({ ...prev, category: e.target.checked }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="defaultCategory" className="text-sm font-medium text-orange-700">
                        Danh mục mặc định
                      </Label>
                    </div>
                    <CustomDropdown
                      value={defaultValues.categoryId}
                      onChange={(value) => setDefaultValues(prev => ({ ...prev, categoryId: value }))}
                      disabled={!defaultFields.category}
                      options={[
                        { value: "", label: "Chọn danh mục mặc định..." },
                        ...categories.map((category) => ({
                          value: category.categoryId.toString(),
                          label: category.categoryName
                        }))
                      ]}
                      placeholder="Chọn danh mục mặc định..."
                      loading={loadingData}
                    />
                  </div>

                  {/* Default Supplier */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="defaultSupplier"
                        checked={defaultFields.supplier}
                        onChange={(e) => setDefaultFields(prev => ({ ...prev, supplier: e.target.checked }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="defaultSupplier" className="text-sm font-medium text-orange-700">
                        Nhà cung cấp mặc định
                      </Label>
                    </div>
                    <CustomDropdown
                      value={defaultValues.supplierId}
                      onChange={(value) => setDefaultValues(prev => ({ ...prev, supplierId: value }))}
                      disabled={!defaultFields.supplier}
                      options={[
                        { value: "", label: "Chọn nhà cung cấp mặc định..." },
                        ...suppliers.map((supplier) => ({
                          value: supplier.supplierId.toString(),
                          label: supplier.companyName
                        }))
                      ]}
                      placeholder="Chọn nhà cung cấp mặc định..."
                      loading={loadingData}
                    />
                  </div>

                  {/* Default Storage Condition */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="defaultStorageCondition"
                        checked={defaultFields.storageCondition}
                        onChange={(e) => setDefaultFields(prev => ({ ...prev, storageCondition: e.target.checked }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="defaultStorageCondition" className="text-sm font-medium text-orange-700">
                        Điều kiện bảo quản mặc định
                      </Label>
                    </div>
                    <CustomDropdown
                      value={defaultValues.storageConditionId}
                      onChange={(value) => setDefaultValues(prev => ({ ...prev, storageConditionId: value }))}
                      disabled={!defaultFields.storageCondition}
                      options={[
                        { value: "", label: "Chọn điều kiện bảo quản mặc định..." },
                        ...storageConditions.map((condition) => ({
                          value: condition.storageConditionId?.toString() || condition.id?.toString() || "",
                          label: condition.lightLevel || `- Nhiệt độ: ${condition.temperatureMin}°C đến ${condition.temperatureMax}°C - Độ ẩm: ${condition.humidityMin}% đến ${condition.humidityMax}%`
                        }))
                      ]}
                      placeholder="Chọn điều kiện bảo quản mặc định..."
                      loading={loadingData}
                    />
                  </div>

                  {/* Default Unit Measure */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="defaultUnitMeasure"
                        checked={defaultFields.unitMeasure}
                        onChange={(e) => setDefaultFields(prev => ({ ...prev, unitMeasure: e.target.checked }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="defaultUnitMeasure" className="text-sm font-medium text-orange-700">
                        Đơn vị đo mặc định
                      </Label>
                    </div>
                    <CustomDropdown
                      value={defaultValues.unitMeasureId}
                      onChange={(value) => setDefaultValues(prev => ({ ...prev, unitMeasureId: value }))}
                      disabled={!defaultFields.unitMeasure}
                      options={[
                        { value: "", label: "Chọn đơn vị đo mặc định..." },
                        ...unitMeasures.map((unit) => ({
                          value: unit.unitMeasureId.toString(),
                          label: unit.name
                        }))
                      ]}
                      placeholder="Chọn đơn vị đo mặc định..."
                      loading={loadingData}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Hướng dẫn:</strong> Điền thông tin cho từng hàng hóa. Bạn có thể thêm/xóa hàng hóa bằng các nút bên dưới.
                Tất cả các trường có dấu <span className="text-red-500">*</span> là bắt buộc.
                {useDefaults && (
                  <span className="block mt-2 text-orange-600 font-medium">
                    ✓ Đã bật chế độ sử dụng giá trị mặc định. Các hàng hóa mới sẽ tự động điền sẵn các trường đã chọn checkbox.
                  </span>
                )}
                {hasBackendErrors && (
                  <span className="block mt-2 text-red-600 font-medium">
                    Có lỗi cần sửa. Vui lòng sửa lỗi trước khi có thể đóng modal hoặc nhấn "Hủy" để bỏ qua.
                  </span>
                )}
              </p>
            </div>

            {/* Goods List */}
            <div className="space-y-6">
              {goodsList.map((goods, index) => {
                const isSuccessful = successfulGoods.has(index)
                // Ensure goods has packing array (use local variable, don't mutate)
                const goodsWithPacking = {
                  ...goods,
                  goodsPackingCreates: goods.goodsPackingCreates && goods.goodsPackingCreates.length > 0
                    ? goods.goodsPackingCreates
                    : [{ unitPerPackage: "" }]
                }
                console.log(`Rendering goods ${index + 1}:`, goodsWithPacking, 'isSuccessful:', isSuccessful)
                return (
                  <Card key={index} className={`p-6 border ${isSuccessful ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-slate-700">
                          hàng hóa {index + 1}
                        </h3>
                        {isSuccessful && (
                          <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                            ✓ Đã tạo thành công
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {isSuccessful && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Clicking remove for successful goods at index:', index)
                              removeGoodsRow(index)
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Xóa khỏi danh sách
                          </Button>
                        )}
                        {goodsList.length > 1 && !isSuccessful && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Clicking remove for unsuccessful goods at index:', index)
                              removeGoodsRow(index)
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Xóa
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Goods Code */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Mã hàng hóa <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Nhập mã hàng hóa..."
                          value={goods.goodsCode}
                          onChange={(e) => updateGoodsRow(index, 'goodsCode', e.target.value)}
                          disabled={isSuccessful}
                          className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 ${errors[`${index}-goodsCode`] ? 'border-red-500' : ''
                            } ${isSuccessful ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                        {errors[`${index}-goodsCode`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${index}-goodsCode`].includes('đã tồn tại trong danh sách')
                              ? errors[`${index}-goodsCode`]
                              : `${errors[`${index}-goodsCode`]}`
                            }
                          </p>
                        )}
                      </div>

                      {/* Goods Name */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Tên hàng hóa <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Nhập tên hàng hóa..."
                          value={goods.goodsName}
                          onChange={(e) => updateGoodsRow(index, 'goodsName', e.target.value)}
                          disabled={isSuccessful}
                          className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 ${errors[`${index}-goodsName`] ? 'border-red-500' : ''
                            } ${isSuccessful ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                        {errors[`${index}-goodsName`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${index}-goodsName`].includes('Trường này là bắt buộc')
                              ? errors[`${index}-goodsName`]
                              : `${errors[`${index}-goodsName`]}`
                            }
                          </p>
                        )}
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Danh mục <span className="text-red-500">*</span>
                        </Label>
                        <CustomDropdown
                          value={goods.categoryId}
                          onChange={(value) => updateGoodsRow(index, 'categoryId', value)}
                          disabled={isSuccessful}
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
                        {errors[`${index}-categoryId`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${index}-categoryId`].includes('Trường này là bắt buộc')
                              ? errors[`${index}-categoryId`]
                              : `${errors[`${index}-categoryId`]}`
                            }
                          </p>
                        )}
                      </div>

                      {/* Supplier */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Nhà cung cấp <span className="text-red-500">*</span>
                        </Label>
                        <CustomDropdown
                          value={goods.supplierId}
                          onChange={(value) => updateGoodsRow(index, 'supplierId', value)}
                          disabled={isSuccessful}
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
                        {errors[`${index}-supplierId`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${index}-supplierId`].includes('Trường này là bắt buộc')
                              ? errors[`${index}-supplierId`]
                              : `${errors[`${index}-supplierId`]}`
                            }
                          </p>
                        )}
                      </div>

                      {/* Storage Condition */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Điều kiện bảo quản <span className="text-red-500">*</span>
                        </Label>
                        <CustomDropdown
                          value={goods.storageConditionId}
                          onChange={(value) => updateGoodsRow(index, 'storageConditionId', value)}
                          disabled={isSuccessful}
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
                        {errors[`${index}-storageConditionId`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${index}-storageConditionId`].includes('Trường này là bắt buộc')
                              ? errors[`${index}-storageConditionId`]
                              : `${errors[`${index}-storageConditionId`]}`
                            }
                          </p>
                        )}
                      </div>

                      {/* Unit Measure */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Đơn vị đo <span className="text-red-500">*</span>
                        </Label>
                        <CustomDropdown
                          value={goods.unitMeasureId}
                          onChange={(value) => updateGoodsRow(index, 'unitMeasureId', value)}
                          disabled={isSuccessful}
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
                        {errors[`${index}-unitMeasureId`] && (
                          <p className="text-sm text-red-500">
                            {errors[`${index}-unitMeasureId`].includes('Trường này là bắt buộc')
                              ? errors[`${index}-unitMeasureId`]
                              : `${errors[`${index}-unitMeasureId`]}`
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quy cách đóng gói */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-semibold text-slate-700">
                          Quy cách đóng gói <span className="text-red-500">*</span>
                        </Label>
                        {!isSuccessful && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addPackingRow(index)}
                            className="h-8 px-3 text-xs border-orange-500 text-orange-500 hover:bg-orange-50"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Thêm quy cách
                          </Button>
                        )}
                      </div>
                      {errors[`${index}-packing`] && (
                        <p className="text-sm text-red-500 mb-2">
                          {errors[`${index}-packing`]}
                        </p>
                      )}
                      <div className="space-y-3">
                        {goodsWithPacking.goodsPackingCreates.map((packing, packingIndex) => (
                          <div key={packingIndex} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <Label className="text-xs font-medium text-slate-600 mb-1 block">
                                Số đơn vị/bao <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="number"
                                placeholder="Nhập số đơn vị/bao..."
                                value={packing.unitPerPackage || ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === '' || value === '-') {
                                    updatePackingRow(index, packingIndex, 'unitPerPackage', '')
                                    return
                                  }
                                  const numValue = parseInt(value)
                                  if (!isNaN(numValue) && numValue > 0) {
                                    updatePackingRow(index, packingIndex, 'unitPerPackage', numValue)
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                                    e.preventDefault()
                                  }
                                }}
                                disabled={isSuccessful}
                                min="1"
                                className={`h-9 border-slate-300 focus:border-orange-500 focus:ring-orange-500 ${errors[`${index}-packing-${packingIndex}-unitPerPackage`] ? 'border-red-500' : ''} ${isSuccessful ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              />
                              {errors[`${index}-packing-${packingIndex}-unitPerPackage`] && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors[`${index}-packing-${packingIndex}-unitPerPackage`]}
                                </p>
                              )}
                            </div>
                            {!isSuccessful && goodsWithPacking.goodsPackingCreates.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePackingRow(index, packingIndex)}
                                className="h-9 px-3 mt-6 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Add Row Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={addGoodsRow}
                className="h-[38px] px-6 border-orange-500 text-orange-500 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm hàng hóa
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
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
                Thêm
                {/* {loading ? "Đang tạo..." : loadingData ? "Đang tải..." : hasBackendErrors ? `Tạo ${goodsList.length - successfulGoods.size} hàng hóa còn lại` : `Tạo ${goodsList.length} hàng hóa`} */}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}