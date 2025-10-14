"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

export default function AdminPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    birthDate: "",
    gender: "",
    phone: "",
    address: "",
    role: "",
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-800">Thêm người dùng mới</h1>

        <form className="space-y-6">
          {/* Row 1: Full Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                Nhập họ và tên
              </Label>
              <Input
                id="fullName"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-12 border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Nhập Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nguyenvana@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* Row 2: Birth Date, Gender, and Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-sm font-medium text-slate-700">
                Chọn ngày sinh
              </Label>
              <Input
                id="birthDate"
                type="date"
                placeholder="1999/09/21"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="h-12 border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <Label htmlFor="gender" className="text-sm font-medium text-slate-700">
                  Chọn giới tính
                </Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="!h-12 w-full border-slate-300 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Nam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="role" className="text-sm font-medium text-slate-700">
                  Chọn hức vụ
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="!h-12 w-full border-slate-300 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Quản lý kinh doanh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales-manager">Quản lý kinh doanh</SelectItem>
                    <SelectItem value="warehouse-manager">Quản lý kho</SelectItem>
                    <SelectItem value="warehouse-staff">Nhân viên kho</SelectItem>
                    <SelectItem value="sales-staff">Nhân viên kinh doanh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Row 3: Phone and Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Nhập số điện thoại
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0999777555"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-12 border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                Nhập địa chỉ
              </Label>
              <Input
                id="address"
                placeholder="Hà Nội"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-12 border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-40 h-12 border-2 border-slate-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                setFormData({
                  fullName: "",
                  email: "",
                  birthDate: "",
                  gender: "",
                  phone: "",
                  address: "",
                  role: "",
                })
              }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="w-40 h-12 bg-[#1a7b7b] hover:bg-[#156666] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
              onClick={(e) => {
                e.preventDefault()
                console.log("[v0] Form submitted:", formData)
              }}
            >
              Thêm
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
