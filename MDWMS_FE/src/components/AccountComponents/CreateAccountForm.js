import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { X } from "../../components/ui/icons";

const CreateAccountForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    birthDate: "",
    gender: "",
    phone: "",
    address: "",
    role: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      birthDate: "",
      gender: "",
      phone: "",
      address: "",
      role: "",
    });
    onSuccess?.();
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      fullName: "",
      email: "",
      birthDate: "",
      gender: "",
      phone: "",
      address: "",
      role: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-slate-800">Thêm người dùng mới</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">

        <form className="space-y-6" onSubmit={handleSubmit}>
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
                required
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
                required
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
                required
              />
            </div>
            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <Label htmlFor="gender" className="text-sm font-medium text-slate-700">
                  Chọn giới tính
                </Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="h-12 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="role" className="text-sm font-medium text-slate-700">
                  Chọn chức vụ
                </Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="h-12 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Chọn chức vụ</option>
                  <option value="sales-manager">Quản lý kinh doanh</option>
                  <option value="warehouse-manager">Quản lý kho</option>
                  <option value="warehouse-staff">Nhân viên kho</option>
                  <option value="sales-staff">Nhân viên kinh doanh</option>
                </select>
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
                required
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
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-40 h-12 border-2 border-slate-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
              onClick={handleCancel}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="w-40 h-12 bg-[#1a7b7b] hover:bg-[#156666] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Thêm
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export { CreateAccountForm };
