
import React, { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X } from "lucide-react"
import { updateCategory } from "../../services/CategoryService/CategoryServices"
import { validateAndShowError, extractErrorMessage } from "../../utils/Validation"

export default function UpdateCategory({ isOpen, onClose, onSuccess, categoryData }) {
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    status: 1,
  })
  const [loading, setLoading] = useState(false)

  // Load data when modal opens
  React.useEffect(() => {
    if (isOpen && categoryData) {
      console.log("Loading category data for update:", categoryData)
      setFormData({
        categoryName: categoryData.categoryName || "",
        description: categoryData.description || "",
        status: categoryData.status !== undefined ? categoryData.status : 1,
      })
    }
  }, [isOpen, categoryData])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form data using utility function
    if (!validateAndShowError(formData)) {
      return
    }

    if (!categoryData || !categoryData.categoryId) {
      window.showToast("Không tìm thấy thông tin danh mục", "error")
      return
    }

    try {
      setLoading(true)

      // Only change status if user selected different from original
      const originalStatus = parseInt(categoryData.status)
      const selectedStatus = parseInt(formData.status)
      const statusChanged = originalStatus !== selectedStatus

      const updateData = {
        categoryName: formData.categoryName.trim(),
        description: formData.description.trim(),
        categoryId: parseInt(categoryData.categoryId),
        status: statusChanged ? selectedStatus : originalStatus // Keep original if not changed
      }

      console.log("Original status:", originalStatus, "Selected status:", selectedStatus)
      console.log("Status changed:", statusChanged)
      console.log("Update data:", updateData)
      console.log("Data validation:", {
        categoryName: updateData.categoryName.length > 0,
        description: updateData.description.length > 0,
        categoryId: !isNaN(updateData.categoryId),
        status: [1, 2].includes(updateData.status)
      })

      const response = await updateCategory(updateData)
      console.log("Category updated:", response)
      window.showToast("Cập nhật danh mục thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error updating category:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật danh mục")
      window.showToast(`Lỗi: ${cleanMsg}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      categoryName: "",
      description: "",
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
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật danh mục</h1>
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
              {/* Category Name */}
              <div className="space-y-2">
                <Label htmlFor="categoryName" className="text-sm font-medium text-slate-700">
                  Tên danh mục <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="categoryName"
                  placeholder="Nhập tên danh mục..."
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  className="h-8 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Mô tả
                </Label>
                <Input
                  id="description"
                  placeholder="Nhập mô tả danh mục..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-8 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
              </div>
            </div>

            {/* Status - Full width */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                Trạng thái <span className="text-red-500">*</span>
              </Label>
              <select
                id="status"
                value={formData.status || 1}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="h-8 w-full px-3 py-1 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 focus:outline-none bg-white text-sm flex items-center"
              >
                <option value={1} className="text-sm">Hoạt động</option>
                <option value={2} className="text-sm">Ngừng hoạt động</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                onClick={handleReset}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-8 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
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
