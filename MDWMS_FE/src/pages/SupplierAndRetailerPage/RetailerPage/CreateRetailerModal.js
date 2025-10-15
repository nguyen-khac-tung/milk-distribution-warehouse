
import React, { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { X } from "lucide-react"
import { createRetailer } from "../../../services/RetailerService"
import { validateAndShowError, extractErrorMessage } from "../../../utils/Validation"

export default function CreateRetailer({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    retailerName: "",
    taxCode: "",
    email: "",
    address: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation - check if required fields are filled
    if (!formData.retailerName?.trim() || !formData.taxCode?.trim() || 
        !formData.email?.trim() || !formData.address?.trim() || !formData.phone?.trim()) {
      window.showToast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      window.showToast("Email không hợp lệ", "error")
      return
    }

    // Phone validation (basic)
    const phoneRegex = /^[0-9+\-\s()]+$/
    if (!phoneRegex.test(formData.phone)) {
      window.showToast("Số điện thoại không hợp lệ", "error")
      return
    }

    try {
      setLoading(true)
      const response = await createRetailer(formData)
      console.log("Retailer created:", response)
      window.showToast("Thêm nhà bán lẻ thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error creating retailer:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi thêm nhà bán lẻ")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      retailerName: "",
      taxCode: "",
      email: "",
      address: "",
      phone: "",
    })
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{zIndex: 99999}}>
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Thêm nhà bán lẻ mới</h1>
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
            {/* Form Fields - 2 column layout */}
            <div className="space-y-4">
              {/* Row 1: Retailer Name & Tax Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retailerName" className="text-sm font-medium text-slate-700">
                    Tên nhà bán lẻ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="retailerName"
                    placeholder="Nhập tên nhà bán lẻ..."
                    value={formData.retailerName}
                    onChange={(e) => setFormData({ ...formData, retailerName: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxCode" className="text-sm font-medium text-slate-700">
                    Mã số thuế <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="taxCode"
                    placeholder="Nhập mã số thuế..."
                    value={formData.taxCode}
                    onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Nhập số điện thoại..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Row 3: Address - Full width */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                  Địa chỉ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Nhập địa chỉ..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
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
                disabled={loading}
                className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Đang thêm..." : "Thêm"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
