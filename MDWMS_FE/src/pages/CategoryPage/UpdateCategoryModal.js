
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-sm font-medium text-slate-700">
                Tên danh mục *
              </Label>
              <Input
                id="categoryName"
                placeholder="Nhập tên danh mục..."
                value={formData.categoryName}
                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
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
                placeholder="Nhập mô tả danh mục..."
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
