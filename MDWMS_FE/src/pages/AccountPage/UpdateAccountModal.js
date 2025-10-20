
import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X } from "lucide-react"
import CustomDropdown from "../../components/Common/CustomDropdown"
import { updateUser, getUserDetail } from "../../services/AccountService"
import { getRoleList } from "../../services/RoleService"
import { validateAndShowError, extractErrorMessage } from "../../utils/Validation"

export default function UpdateAccount({ isOpen, onClose, onSuccess, userData }) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    doB: "",
    gender: true,
    phone: "",
    address: "",
    roleId: 0,
    userId: 0,
  })
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState([])
  const [userDetail, setUserDetail] = useState(null)

  // Load user data from API when modal opens
  useEffect(() => {
    const fetchUserDetail = async () => {
      if (isOpen && userData) {
        try {
          setLoading(true)
          const userId = userData.userId || userData.id

          const response = await getUserDetail(userId)

          if (response && response.data) {
            setUserDetail(response.data)

            // Handle roleId - check both roleId and roles array
            let roleId = response.data.roleId || 0
            if (!roleId && response.data.roles && response.data.roles.length > 0) {
              // If roleId is not available, try to get it from roles array
              const firstRole = response.data.roles[0]
              if (firstRole.roleId) {
                roleId = firstRole.roleId
              } else if (firstRole.roleName) {
                // If we have roleName, we'll need to find the matching roleId from roles list
                // This will be handled after roles are loaded
                roleId = 0 // Temporary, will be updated when roles load
              }
            }

            setFormData({
              email: response.data.email || "",
              fullName: response.data.fullName || "",
              doB: response.data.doB || "",
              gender: response.data.gender !== undefined ? response.data.gender : true,
              phone: response.data.phone || "",
              address: response.data.address || "",
              roleId: roleId,
              userId: response.data.userId || response.data.id || userId,
            })
          } else {
            // Fallback to props data if API fails
            setFormData({
              email: userData.email || "",
              fullName: userData.fullName || "",
              doB: userData.doB || "",
              gender: userData.gender !== undefined ? userData.gender : true,
              phone: userData.phone || "",
              address: userData.address || "",
              roleId: userData.roleId || 0,
              userId: userData.userId || userData.id || 0,
            })
          }
        } catch (error) {
          // Fallback to props data if API fails
          setFormData({
            email: userData.email || "",
            fullName: userData.fullName || "",
            doB: userData.doB || "",
            gender: userData.gender !== undefined ? userData.gender : true,
            phone: userData.phone || "",
            address: userData.address || "",
            roleId: userData.roleId || 0,
            userId: userData.userId || userData.id || 0,
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserDetail()
  }, [isOpen, userData])

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoleList()
        if (response && response.data) {
          setRoles(response.data)

          // If we have userDetail with roleName but no roleId, map it now
          if (userDetail && userDetail.roles && userDetail.roles.length > 0 && formData.roleId === 0) {
            const userRoleName = userDetail.roles[0].roleName || userDetail.roles[0]

            const matchingRole = response.data.find(role =>
              role.roleName === userRoleName ||
              role.roleName?.toLowerCase() === userRoleName?.toLowerCase()
            )

            if (matchingRole) {
              setFormData(prev => ({
                ...prev,
                roleId: matchingRole.roleId
              }))
            }
          }
        }
      } catch (error) {
        // Handle error silently
      }
    }

    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen, userDetail, formData.roleId])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.email || !formData.fullName || !formData.phone || !formData.roleId || !formData.userId) {
      window.showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error")
      return
    }

    try {
      setLoading(true)

      const response = await updateUser(formData)

      // Check if response is successful
      if (response && (response.success !== false && response.status !== 500)) {
        window.showToast("Cập nhật người dùng thành công!", "success")
        onSuccess && onSuccess()
        onClose && onClose()
      } else {
        const errorMessage = extractErrorMessage({ response: { data: response } }, "Có lỗi xảy ra khi cập nhật người dùng")
        window.showToast(errorMessage, "error")
      }
    } catch (error) {
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật người dùng")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (userDetail) {
      setFormData({
        email: userDetail.email || "",
        fullName: userDetail.fullName || "",
        doB: userDetail.doB || "",
        gender: userDetail.gender !== undefined ? userDetail.gender : true,
        phone: userDetail.phone || "",
        address: userDetail.address || "",
        roleId: userDetail.roleId || 0,
        userId: userDetail.userId || userDetail.id || 0,
      })
    } else if (userData) {
      setFormData({
        email: userData.email || "",
        fullName: userData.fullName || "",
        doB: userData.doB || "",
        gender: userData.gender !== undefined ? userData.gender : true,
        phone: userData.phone || "",
        address: userData.address || "",
        roleId: userData.roleId || 0,
        userId: userData.userId || userData.id || 0,
      })
    } else {
      setFormData({
        email: "",
        fullName: "",
        doB: "",
        gender: true,
        phone: "",
        address: "",
        roleId: 0,
        userId: 0,
      })
    }
    onClose && onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật thông tin người dùng</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-slate-600">Đang tải dữ liệu người dùng...</p>
              </div>
            </div>
          ) : (
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
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
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
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
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                  />
                </div>
              </div>

              {/* Row 4: Role */}
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="roleId" className="text-sm font-medium text-slate-700">
                    Chức vụ <span className="text-red-500">*</span>
                  </Label>
                  <CustomDropdown
                    value={formData.roleId}
                    onChange={(value) => setFormData({ ...formData, roleId: parseInt(value) })}
                    options={[
                      { value: 0, label: "Chọn chức vụ..." },
                      ...roles.map(role => ({
                        value: role.roleId,
                        label: role.roleName
                      }))
                    ]}
                    placeholder="Chọn chức vụ..."
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
                  {loading ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
