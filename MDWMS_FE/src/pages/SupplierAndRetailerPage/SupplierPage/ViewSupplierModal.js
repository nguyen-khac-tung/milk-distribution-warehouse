import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Separator } from "../../../components/ui/separator"
import { Button } from "../../../components/ui/button"
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { getSupplierDetail } from "../../../services/SupplierService";
import { extractErrorMessage } from "../../../utils/Validation";


export function SupplierDetail({ supplier, onClose }) {
  const [supplierData, setSupplierData] = useState(supplier);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier?.supplierId) {
      loadSupplierDetail();
    }
  }, [supplier?.supplierId]);

  const loadSupplierDetail = async () => {
    try {
      setLoading(true);
      const response = await getSupplierDetail(supplier.supplierId);
      console.log("API Response:", response);
      const supplierInfo = response.data || response;
      console.log("Supplier Info:", supplierInfo);
      setSupplierData(supplierInfo);
    } catch (error) {
      console.error("Error loading supplier detail:", error);
      window.showToast(extractErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-400"></span>
          Đang hoạt động
        </span>
      case 2:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-red-400"></span>
          Ngừng hoạt động
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-gray-400"></span>
          Không xác định
        </span>
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Đang tải thông tin...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Chi tiết nhà cung cấp</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Đóng"
            >
              <ComponentIcon name="close" size={20} color="#6b7280" />
            </button>
          )}
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
          {/* Header Section */}
          <div className="mb-8 md:mb-12 relative">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <ComponentIcon name="building" size={40} color="#6b7280" />
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-balance">{supplierData.companyName}</h1>
                {getStatusBadge(supplierData.status)}
              </div>
              <div className="text-lg text-slate-600 font-medium">{supplierData.brandName}</div>
            </div>
          </div>

          <Separator className="mb-8 md:mb-12" />

          {/* Main Content Grid */}
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            {/* Supplier Information Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="building" size={30} color="#374151" />
                  Thông tin nhà cung cấp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="building" size={20} color="#6b7280" />} label="Tên công ty" value={supplierData.companyName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="tag" size={20} color="#6b7280" />} label="Tên thương hiệu" value={supplierData.brandName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="tax" size={20} color="#6b7280" />} label="Mã số thuế" value={supplierData.taxCode || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="mapPin" size={20} color="#6b7280" />} label="Địa chỉ" value={supplierData.address || 'N/A'} />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="streamlineplump" size={30} color="#374151" />
                  Thông tin liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="phone" size={20} color="#6b7280" />} label="Số điện thoại" value={supplierData.phone || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="email" size={20} color="#6b7280" />} label="Email" value={supplierData.email || 'N/A'} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Person Information Card */}
          <div className="mt-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="user" size={30} color="#374151" />
                  Thông tin người liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="people" size={20} color="#6b7280" />} label="Tên người liên hệ" value={supplierData.contactPersonName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="phone" size={20} color="#6b7280" />} label="Số điện thoại người liên hệ" value={supplierData.contactPersonPhone || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="email" size={20} color="#6b7280" />} label="Email người liên hệ" value={supplierData.contactPersonEmail || 'N/A'} />
                </div>
              </CardContent>
            </Card>
          </div>


        </div>

        {/* Close Button at Bottom */}
        {onClose && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground text-right">{value}</span>
    </div>
  )
}
