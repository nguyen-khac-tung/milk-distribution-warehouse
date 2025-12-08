
import React, { useState, useEffect } from "react"
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
  const [validationErrors, setValidationErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all required fields
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[0-9+\-\s()]+$/

    if (!formData.companyName?.trim()) {
      errors.companyName = "Vui lòng nhập tên công ty"
    }

    if (!formData.brandName?.trim()) {
      errors.brandName = "Vui lòng nhập tên thương hiệu"
    }

    if (!formData.taxCode?.trim()) {
      errors.taxCode = "Vui lòng nhập mã số thuế"
    }

    if (!formData.address?.trim()) {
      errors.address = "Vui lòng nhập địa chỉ"
    }

    if (!formData.email?.trim()) {
      errors.email = "Vui lòng nhập email"
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Email không hợp lệ"
    }

    if (!formData.phone?.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại"
    } else if (!phoneRegex.test(formData.phone)) {
      errors.phone = "Số điện thoại không hợp lệ"
    }

    if (!formData.contactPersonName?.trim()) {
      errors.contactPersonName = "Vui lòng nhập tên người liên hệ"
    }

    if (!formData.contactPersonPhone?.trim()) {
      errors.contactPersonPhone = "Vui lòng nhập số điện thoại người liên hệ"
    } else if (!phoneRegex.test(formData.contactPersonPhone)) {
      errors.contactPersonPhone = "Số điện thoại người liên hệ không hợp lệ"
    }

    if (!formData.contactPersonEmail?.trim()) {
      errors.contactPersonEmail = "Vui lòng nhập email người liên hệ"
    } else if (!emailRegex.test(formData.contactPersonEmail)) {
      errors.contactPersonEmail = "Email người liên hệ không hợp lệ"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    // Clear validation errors if validation passes
    setValidationErrors({})

    try {
      setLoading(true)
      const response = await createSupplier(formData)
      window.showToast("Thêm nhà cung cấp thành công!", "success")
      // Reset form data after successful creation
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
      setValidationErrors({})
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
    setValidationErrors({})
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
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value })
                      if (validationErrors.companyName) {
                        setValidationErrors({ ...validationErrors, companyName: undefined })
                      }
                    }}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  />
                  {validationErrors.companyName && (
                    <p className="text-sm text-red-500 font-medium">{validationErrors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandName" className="text-sm font-medium text-slate-700">
                    Tên thương hiệu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brandName"
                    placeholder="Nhập tên thương hiệu..."
                    value={formData.brandName}
                    onChange={(e) => {
                      setFormData({ ...formData, brandName: e.target.value })
                      if (validationErrors.brandName) {
                        setValidationErrors({ ...validationErrors, brandName: undefined })
                      }
                    }}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  />
                  {validationErrors.brandName && (
                    <p className="text-sm text-red-500 font-medium">{validationErrors.brandName}</p>
                  )}
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
                    onChange={(e) => {
                      setFormData({ ...formData, taxCode: e.target.value })
                      if (validationErrors.taxCode) {
                        setValidationErrors({ ...validationErrors, taxCode: undefined })
                      }
                    }}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  />
                  {validationErrors.taxCode && (
                    <p className="text-sm text-red-500 font-medium">{validationErrors.taxCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                    Địa chỉ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Nhập địa chỉ..."
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value })
                      if (validationErrors.address) {
                        setValidationErrors({ ...validationErrors, address: undefined })
                      }
                    }}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-red-500 font-medium">{validationErrors.address}</p>
                  )}
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
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (validationErrors.email) {
                        setValidationErrors({ ...validationErrors, email: undefined })
                      }
                    }}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500 font-medium">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Nhập số điện thoại..."
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (validationErrors.phone) {
                        setValidationErrors({ ...validationErrors, phone: undefined })
                      }
                    }}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500 font-medium">{validationErrors.phone}</p>
                  )}
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
                      onChange={(e) => {
                        setFormData({ ...formData, contactPersonName: e.target.value })
                        if (validationErrors.contactPersonName) {
                          setValidationErrors({ ...validationErrors, contactPersonName: undefined })
                        }
                      }}
                      className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    />
                    {validationErrors.contactPersonName && (
                      <p className="text-sm text-red-500 font-medium">{validationErrors.contactPersonName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPersonPhone" className="text-sm font-medium text-slate-700">
                      Số điện thoại người liên hệ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPersonPhone"
                      placeholder="Nhập số điện thoại người liên hệ..."
                      value={formData.contactPersonPhone}
                      onChange={(e) => {
                        setFormData({ ...formData, contactPersonPhone: e.target.value })
                        if (validationErrors.contactPersonPhone) {
                          setValidationErrors({ ...validationErrors, contactPersonPhone: undefined })
                        }
                      }}
                      className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    />
                    {validationErrors.contactPersonPhone && (
                      <p className="text-sm text-red-500 font-medium">{validationErrors.contactPersonPhone}</p>
                    )}
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
                      onChange={(e) => {
                        setFormData({ ...formData, contactPersonEmail: e.target.value })
                        if (validationErrors.contactPersonEmail) {
                          setValidationErrors({ ...validationErrors, contactPersonEmail: undefined })
                        }
                      }}
                      className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    />
                    {validationErrors.contactPersonEmail && (
                      <p className="text-sm text-red-500 font-medium">{validationErrors.contactPersonEmail}</p>
                    )}
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
