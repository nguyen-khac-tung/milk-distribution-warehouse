import React, { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { X } from "lucide-react"
import { updateRetailer, getRetailerDetail } from "../../../services/RetailerService"
import { validateAndShowError, extractErrorMessage } from "../../../utils/Validation"
import { DisableFieldWrapper } from "../../../components/Common/DisableFieldWrapper"

export default function UpdateRetailerModal({ isOpen, onClose, onSuccess, retailerId }) {
  const [formData, setFormData] = useState({
    retailerId: 0,
    retailerName: "",
    taxCode: "",
    email: "",
    address: "",
    phone: "",
    isDisable: false,
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && retailerId) {
      loadRetailerData()
    }
  }, [isOpen, retailerId])

  const loadRetailerData = async () => {
    try {
      setLoadingData(true)
      const response = await getRetailerDetail(retailerId)
      console.log("API Response:", response);

      // API trả về { data: {...}, message: "", status: 200, success: true }
      const retailerInfo = response.data || response;
      console.log("Retailer Info:", retailerInfo);

      if (retailerInfo) {
        setFormData({
          retailerId: retailerInfo.retailerId || 0,
          retailerName: retailerInfo.retailerName || "",
          taxCode: retailerInfo.taxCode || "",
          email: retailerInfo.email || "",
          address: retailerInfo.address || "",
          phone: retailerInfo.phone || "",
          isDisable: retailerInfo.status === 2, // 2 = inactive
        })
      }
    } catch (error) {
      console.error("Error loading retailer data:", error)
      const errorMessage = extractErrorMessage(error, "Lỗi khi tải thông tin nhà bán lẻ")
      window.showToast(errorMessage, "error")
    } finally {
      setLoadingData(false)
    }
  }

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
      const response = await updateRetailer(formData)
      console.log("Retailer updated:", response)
      window.showToast("Cập nhật nhà bán lẻ thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error updating retailer:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật nhà bán lẻ")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      retailerId: 0,
      retailerName: "",
      taxCode: "",
      email: "",
      address: "",
      phone: "",
      isDisable: false,
    })
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật nhà bán lẻ</h1>
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
                <DisableFieldWrapper
                  isDisabled={formData.isDisable}
                  label="Tên nhà bán lẻ"
                  id="retailerName"
                  placeholder="Nhập tên nhà bán lẻ..."
                  value={formData.retailerName}
                  onChange={(e) => setFormData({ ...formData, retailerName: e.target.value })}
                  required
                />

                <DisableFieldWrapper
                  isDisabled={formData.isDisable}
                  label="Mã số thuế"
                  id="taxCode"
                  placeholder="Nhập mã số thuế..."
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  required
                />
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
                    className="h-8 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
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
                    className="h-8 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
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
                  className="h-8 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  required
                />
              </div>
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
                disabled={loading || loadingData}
                className="h-8 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
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