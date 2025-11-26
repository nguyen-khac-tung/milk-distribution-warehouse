
import React, { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card } from "../../../components/ui/card"
import { X } from "lucide-react"
import { createSupplier } from "../../../services/SupplierService"
import { validateAndShowError, extractErrorMessage } from "../../../utils/Validation"

export default function CreateSupplier({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    companyName: "",
    brandName: "",
    email: "",
    phone: "",
    taxCode: "",
    address: "",
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation - check if required fields are filled
    if (!formData.companyName?.trim() || !formData.brandName?.trim() ||
      !formData.email?.trim() || !formData.phone?.trim() ||
      !formData.taxCode?.trim() || !formData.address?.trim() ||
      !formData.contactPersonName?.trim() || !formData.contactPersonPhone?.trim() ||
      !formData.contactPersonEmail?.trim()) {
      window.showToast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      window.showToast("Email không hợp lệ", "error")
      return
    }

    // Contact person email validation
    if (!emailRegex.test(formData.contactPersonEmail)) {
      window.showToast("Email người liên hệ không hợp lệ", "error")
      return
    }

    // Phone validation (basic)
    const phoneRegex = /^[0-9+\-\s()]+$/
    if (!phoneRegex.test(formData.phone)) {
      window.showToast("Số điện thoại không hợp lệ", "error")
      return
    }

    // Contact person phone validation
    if (!phoneRegex.test(formData.contactPersonPhone)) {
      window.showToast("Số điện thoại người liên hệ không hợp lệ", "error")
      return
    }

    try {
      setLoading(true)
      const response = await createSupplier(formData)
      window.showToast("Thêm nhà cung cấp thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error creating supplier:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi thêm nhà cung cấp")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      companyName: "",
      brandName: "",
      email: "",
      phone: "",
      taxCode: "",
      address: "",
      contactPersonName: "",
      contactPersonPhone: "",
      contactPersonEmail: "",
    })
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Thêm nhà cung cấp mới</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form id="supplier-form" className="space-y-6" onSubmit={handleSubmit}>
            {/* Form Fields - 2 column layout */}
            <div className="space-y-4">
              {/* Row 1: Company Name & Brand Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                    Tên công ty <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Nhập tên công ty..."
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandName" className="text-sm font-medium text-slate-700">
                    Tên thương hiệu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brandName"
                    placeholder="Nhập tên thương hiệu..."
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Tax Code & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Row 3: Email & Phone */}
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

              {/* Contact Person Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Thông tin người liên hệ</h3>

                {/* Row 4: Contact Person Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName" className="text-sm font-medium text-slate-700">
                      Tên người liên hệ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPersonName"
                      placeholder="Nhập tên người liên hệ..."
                      value={formData.contactPersonName}
                      onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                      className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPersonPhone" className="text-sm font-medium text-slate-700">
                      Số điện thoại người liên hệ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPersonPhone"
                      placeholder="Nhập số điện thoại người liên hệ..."
                      value={formData.contactPersonPhone}
                      onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                      className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Row 5: Contact Person Email */}
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonEmail" className="text-sm font-medium text-slate-700">
                      Email người liên hệ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPersonEmail"
                      type="email"
                      placeholder="Nhập email người liên hệ..."
                      value={formData.contactPersonEmail}
                      onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                      className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
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
            form="supplier-form"
          >
            {loading ? "Đang thêm..." : "Thêm"}
          </Button>
        </div>
      </div>
    </div>
  )
}
