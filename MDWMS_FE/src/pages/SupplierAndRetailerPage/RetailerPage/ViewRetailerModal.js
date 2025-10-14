import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Separator } from "../../../components/ui/separator"
import { Button } from "../../../components/ui/button"
import { ComponentIcon } from "../../../components/IconComponent/Icon";


export function RetailerDetail({ retailer, onClose }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Đang hoạt động</span>
      case 2:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Ngừng hoạt động</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Không xác định</span>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
        {/* Close Button - Fixed at top right */}
        {onClose && (
          <button
            onClick={onClose}
            className="fixed top-6 right-6 h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center z-20 bg-white shadow-lg border border-gray-200"
            aria-label="Đóng"
          >
            <ComponentIcon name="close" size={16} color="#6b7280" />
          </button>
        )}

        <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
          {/* Header Section */}
          <div className="mb-8 md:mb-12 relative">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <ComponentIcon name="retailer" size={40} color="#6b7280" />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">{retailer.retailerName}</h1>
                {getStatusBadge(retailer.status)}
              </div>
            </div>
          </div>

          <Separator className="mb-8 md:mb-12" />

          {/* Main Content Grid */}
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            {/* Retailer Information Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="retailer" size={30} color="#374151" />
                  Thông tin nhà bán lẻ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="building" size={20} color="#6b7280" />} label="Tên nhà bán lẻ" value={retailer.retailerName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="tax" size={20} color="#6b7280" />} label="Mã số thuế" value={retailer.taxCode || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="mapPin" size={20} color="#6b7280" />} label="Địa chỉ" value={retailer.address || 'N/A'} />
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
                  <InfoRow icon={<ComponentIcon name="phone" size={20} color="#6b7280" />} label="Số điện thoại" value={retailer.phone || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="email" size={20} color="#6b7280" />} label="Email" value={retailer.email || 'N/A'} />
                </div>
              </CardContent>
            </Card>
          </div>


        </div>

        {/* Close Button at Bottom - Fixed */}
        {onClose && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-pink-50 border border-red-300 text-red-600 rounded-md hover:bg-pink-100 hover:border-red-400 transition-colors shadow-sm"
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
