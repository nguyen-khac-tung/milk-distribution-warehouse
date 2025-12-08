
import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X } from "lucide-react"
import CustomDropdown from "../../components/Common/CustomDropdown"
import { createUser } from "../../services/AccountService"
import { getRoleList } from "../../services/RoleService"
import { validateAndShowError, extractErrorMessage } from "../../utils/Validation"
import FloatingDropdown from "../../components/Common/FloatingDropdown"

export default function CreateAccount({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    doB: "",
    gender: true,
    phone: "",
    address: "",
    roleId: 0,
  })
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState([])
  const [validationErrors, setValidationErrors] = useState({})

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: "",
        fullName: "",
        doB: "",
        gender: true,
        phone: "",
        address: "",
        roleId: 0,
      })
      setValidationErrors({})
    }
  }, [isOpen])

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoleList()
        if (response && response.data) {
          setRoles(response.data)
        }
      } catch (error) {
        console.error("Error fetching roles:", error)
      }
    }

    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all required fields
    const errors = {}

    if (!formData.email || formData.email.trim() === "") {
      errors.email = "Vui lòng nhập email"
    }

    if (!formData.fullName || formData.fullName.trim() === "") {
      errors.fullName = "Vui lòng nhập họ và tên"
    }

    if (!formData.phone || formData.phone.trim() === "") {
      errors.phone = "Vui lòng nhập số điện thoại"
    }

    if (!formData.address || formData.address.trim() === "") {
      errors.address = "Vui lòng nhập địa chỉ"
    }

    if (!formData.roleId || formData.roleId === 0) {
      errors.roleId = "Vui lòng chọn chức vụ"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    // Clear validation errors if validation passes
    setValidationErrors({})

    try {
      setLoading(true)

      const response = await createUser(formData)

      // Check if response is successful
      if (response && (response.success !== false && response.status !== 500)) {
        window.showToast("Thêm người dùng thành công!", "success")
        // Reset form data after successful creation
        setFormData({
          email: "",
          fullName: "",
          doB: "",
          gender: true,
          phone: "",
          address: "",
          roleId: 0,
        })
        setValidationErrors({})
        onSuccess && onSuccess()
        onClose && onClose()
      } else {
        const errorMessage = extractErrorMessage({ response: { data: response } }, "Có lỗi xảy ra khi thêm người dùng")
        window.showToast(errorMessage, "error")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi thêm người dùng")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      email: "",
      fullName: "",
      doB: "",
      gender: true,
      phone: "",
      address: "",
      roleId: 0,
    })
    setValidationErrors({})
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Thêm người dùng mới</h1>
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
            {/* Row 1: Email and Full Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nhập họ và tên..."
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value })
                    if (validationErrors.fullName) {
                      setValidationErrors({ ...validationErrors, fullName: undefined })
                    }
                  }}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
                {validationErrors.fullName && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.fullName}</p>
                )}
              </div>
            </div>

            {/* Row 2: Date of Birth and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="doB" className="text-sm font-medium text-slate-700">
                  Ngày sinh
                </Label>
                <Input
                  id="doB"
                  type="date"
                  value={formData.doB}
                  onChange={(e) => setFormData({ ...formData, doB: e.target.value })}
                  className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-slate-700">
                  Giới tính
                </Label>
                <CustomDropdown
                  value={formData.gender}
                  onChange={(value) => setFormData({ ...formData, gender: value === "true" })}
                  options={[
                    { value: true, label: "Nam" },
                    { value: false, label: "Nữ" }
                  ]}
                  placeholder="Chọn giới tính..."
                />
              </div>
            </div>

            {/* Row 3: Phone and Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
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

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                  Địa chỉ<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  type="text"
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

            {/* Row 4: Role */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="roleId" className="text-sm font-medium text-slate-700">
                  Chức vụ <span className="text-red-500">*</span>
                </Label>
                <FloatingDropdown
                  value={formData.roleId !== 0 ? formData.roleId : null}
                  onChange={(value) => {
                    setFormData({
                      ...formData,
                      roleId: value ? parseInt(value) : 0
                    });

                    if (validationErrors.roleId) {
                      setValidationErrors({
                        ...validationErrors,
                        roleId: undefined
                      });
                    }
                  }}
                  placeholder="Chọn chức vụ..."
                  options={[
                    ...roles.map(role => ({
                      value: role.roleId,
                      label: role.description
                    }))
                  ]}
                />
                {validationErrors.roleId && (
                  <p className="text-sm text-red-500 font-medium">{validationErrors.roleId}</p>
                )}
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
