import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card } from "../../components/ui/card"
import { X, Eye, EyeOff, Lock, CheckCircle, ArrowLeft } from "lucide-react"
import { updatePassword } from "../../services/AccountService"
import { extractErrorMessage } from "../../utils/Validation"

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear messages when user starts typing
    if (message || error) {
      setMessage("")
      setError("")
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại")
      return false
    }
    
    if (!formData.newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới")
      return false
    }
    
    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự")
      return false
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return false
    }
    
    if (formData.currentPassword === formData.newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại")
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError("")
    setMessage("")
    
    try {
      // Get userId from localStorage (first login uses tempUserId)
      const tempUserId = localStorage.getItem("tempUserId")
      const userInfo = localStorage.getItem("userInfo")
      const userId = tempUserId || (userInfo ? JSON.parse(userInfo).userId : 0)
      
      const response = await updatePassword({
        userId: userId,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })
      
      if (response.success) {
        setMessage("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.")
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        // Xóa tempUserId sau khi đổi mật khẩu thành công
        localStorage.removeItem("tempUserId")
        // Chuyển về trang login sau 2 giây
        setTimeout(() => {
          window.location.href = "/login"
        }, 2000)
      } else {
        const errorMsg = extractErrorMessage({ message: response.message })
        console.log("Response error - Original:", response.message)
        console.log("Response error - Cleaned:", errorMsg)
        setError(errorMsg || "Có lỗi xảy ra khi đổi mật khẩu")
      }
    } catch (err) {
      const errorMsg = extractErrorMessage(err)
      console.log("Original error:", err?.response?.data?.message || err?.message)
      console.log("Cleaned error:", errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #FFF3E0, #fcf7f8)" }}>
      <div className="w-full max-w-6xl">
        <div className="w-full h-[600px] bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl shadow-2xl flex overflow-hidden">
          {/* Left side - Form */}
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="w-full max-w-lg mx-4">
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                   Mật khẩu hiện tại <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                   Mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Messages */}
              {message && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 text-sm">{message}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <X className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </Button>

              {/* Back Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              </form>
            </div>
          </div>

          {/* Right side - User Guide */}
          <div className="hidden lg:flex flex-1 items-center justify-center p-12">
            <div className="text-center max-w-lg mx-4">
              <Lock className="w-24 h-24 text-orange-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Hướng dẫn đổi mật khẩu</h3>
              <div className="text-left space-y-3 text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 text-sm font-bold">1</span>
                  </div>
                  <p className="text-sm">Nhập mật khẩu hiện tại của bạn</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 text-sm font-bold">2</span>
                  </div>
                  <p className="text-sm">Tạo mật khẩu mới (ít nhất 8 ký tự)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 text-sm font-bold">3</span>
                  </div>
                  <p className="text-sm">Xác nhận mật khẩu mới</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 text-sm font-bold">4</span>
                  </div>
                  <p className="text-sm">Nhấn "Đổi mật khẩu" để hoàn tất</p>
                </div>
              </div>
              <div className="mt-8 p-6 pb-8 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 mb-3">
                  <strong>Yêu cầu mật khẩu mạnh:</strong>
                </p>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Ít nhất 8 ký tự</li>
                  <li>• Có chữ hoa và chữ thường</li>
                  <li>• Có số (0-9)</li>
                  <li>• Có ký tự đặc biệt (!@#$%^&*)</li>
                  <li>• Khác mật khẩu hiện tại</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}