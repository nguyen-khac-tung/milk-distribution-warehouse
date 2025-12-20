import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"
import { Button } from "../../components/ui/button"
import { X } from "lucide-react";
import { ComponentIcon } from "../../components/IconComponent/Icon";


export function ProductDetail({ product, onClose }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Đang phân phối</span>
      case 2:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Ngừng phân phối</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Không xác định</span>
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Chi tiết hàng hóa</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Info */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <ComponentIcon name="productVariant" size={20} color="#6b7280" />
              <h2 className="text-xl font-semibold text-slate-800">{product.goodsName}</h2>
              {getStatusBadge(product.status)}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ComponentIcon name="qrcode" size={16} color="#6b7280" />
              <span className="text-sm font-medium">Mã hàng hóa:</span> {product.goodsCode}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            {/* Product Information Card */}
            <Card className="bg-gray-50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <ComponentIcon name="package" size={20} color="#374151" />
                  Thông tin hàng hóa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <InfoRow icon={<ComponentIcon name="box" size={16} color="#6b7280" />} label="Đơn vị" value={product.unitMeasureName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="category" size={16} color="#6b7280" />} label="Danh mục" value={product.categoryName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="tag" size={16} color="#6b7280" />} label="Thương hiệu" value={product.brandName || 'N/A'} />
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information Card */}
            <Card className="bg-gray-50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <ComponentIcon name="supplier" size={20} color="#374151" />
                  Thông tin nhà cung cấp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <InfoRow icon={<ComponentIcon name="building" size={16} color="#6b7280" />} label="Công ty" value={product.companyName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="mapPin" size={16} color="#6b7280" />} label="Địa chỉ" value={product.address || 'N/A'} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Packing Information Card - Full Width */}
          {product.goodsPackings && product.goodsPackings.length > 0 && (
            <Card className="mt-6 bg-gray-50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <ComponentIcon name="package" size={20} color="#374151" />
                  Thông tin đóng gói
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {product.goodsPackings.map((packing, index) => (
                    <div key={packing.goodsPackingId || index} className="rounded-lg bg-white p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <ComponentIcon name="box" size={20} color="#6b7280" />
                        <span className="text-sm font-medium text-slate-600">Đóng gói</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-800">{packing.unitPerPackage}</span>
                        <span className="text-slate-500 text-sm">{product.unitMeasureName || 'đơn vị'}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Số {product.unitMeasureName || 'đơn vị'} trên 1 thùng</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Storage Conditions Card - Full Width */}
          <Card className="mt-6 bg-gray-50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <ComponentIcon name="storageCondition" size={20} color="#374151" />
                Điều kiện bảo quản
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ComponentIcon name="thermometer" size={40} color="#6b7280" />
                    <span className="text-sm font-medium">Nhiệt độ</span>
                  </div>
                  <div className="rounded-lg bg-white p-4 border border-gray-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-800">{product.temperatureMin || 'N/A'}°C</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-2xl font-bold text-slate-800">{product.temperatureMax || 'N/A'}°C</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Khoảng nhiệt độ khuyến nghị</p>
                  </div>
                </div>

                {/* Humidity */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ComponentIcon name="droplets" size={40} color="#6b7280" />
                    <span className="text-sm font-medium">Độ ẩm</span>
                  </div>
                  <div className="rounded-lg bg-white p-4 border border-gray-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-800">{product.humidityMin || 'N/A'}%</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-2xl font-bold text-slate-800">{product.humidityMax || 'N/A'}%</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Khoảng độ ẩm khuyến nghị</p>
                  </div>
                </div>

                {/* Light Level */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ComponentIcon name="sun" size={40} color="#6b7280" />
                    <span className="text-sm font-medium">Ánh sáng</span>
                  </div>
                  <div className="rounded-lg bg-white p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-slate-800">{product.lightLevel || 'N/A'}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Mức độ ánh sáng</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Action Buttons - Fixed Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <Button
            onClick={onClose}
            className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Đóng
          </Button>
        </div>
      </div>
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
