import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"
import { Button } from "../../components/ui/button"
import { X, Lock } from "lucide-react";
import { ComponentIcon } from "../../components/IconComponent/Icon";
import Loading from "../../components/Common/Loading";
import ChangePasswordModal from "./ChangePasswordModal";
import { extractErrorMessage } from "../../utils/Validation";
import { getUserProfile } from "../../services/AccountService";

export function ViewProfileModal({ userId, onClose, isOpen }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await getUserProfile();
        
        if (result.success) {
          setUser(result.data);
        } else {
          setError(result.message || "Không thể tải thông tin người dùng");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isOpen])

  // Don't render if not open
  if (!isOpen) return null


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const formatGender = (gender) => {
    return gender ? 'Nam' : 'Nữ'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-4xl  max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
          <Loading size="large" text="Đang tải thông tin người dùng..." />
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-4xl  max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
          <div className="p-6 text-center">
            <p className="text-red-500 mb-4">{error || "Không tìm thấy thông tin người dùng"}</p>
            <Button onClick={onClose} className="bg-slate-800 hover:bg-slate-900">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-4xl  max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-slate-800">Thông tin cá nhân</h1>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* User Info */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <ComponentIcon name="schoolboyRunaway" size={40} color="#6b7280" />
                <h2 className="text-xl font-semibold text-slate-800">{user.fullName}</h2>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <ComponentIcon name="email" size={30} color="#6b7280" />
                <span className="text-sm font-medium">Email:</span> {user.email}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
              {/* Personal Information Card */}
              <Card className="bg-gray-50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <ComponentIcon name="people" size={40} color="#374151" />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <InfoRow icon={<ComponentIcon name="email" size={20} color="#6b7280" />} label="Email" value={user.email || 'N/A'} />
                    <InfoRow icon={<ComponentIcon name="europeanNameBadge" size={20} color="#6b7280" />} label="Họ và tên" value={user.fullName || 'N/A'} />
                    <InfoRow icon={<ComponentIcon name="calendar" size={20} color="#6b7280" />} label="Ngày sinh" value={formatDate(user.doB)} />
                    <InfoRow icon={<ComponentIcon name={user.gender ? "boy" : "girl"} size={20} color="#6b7280" />} label="Giới tính" value={formatGender(user.gender)} />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="bg-gray-50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <ComponentIcon name="phone" size={40} color="#374151" />
                    Thông tin liên hệ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <InfoRow icon={<ComponentIcon name="phone" size={20} color="#6b7280" />} label="Số điện thoại" value={user.phone || 'N/A'} />
                    <InfoRow icon={<ComponentIcon name="mapPin" size={20} color="#6b7280" />} label="Địa chỉ" value={user.address || 'N/A'} />
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>

          {/* Action Buttons - Fixed Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between">
            <Button
              onClick={() => setShowChangePassword(true)}
              className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Đổi mật khẩu
            </Button>
            <Button
              onClick={onClose}
              className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Đóng
            </Button>
          </div>
        </div>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
        />
      </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex items-center gap-2 text-slate-600 min-w-0">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-800 text-right">{value}</span>
    </div>
  )
}
