import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"
import { Button } from "../../components/ui/button"
import { ComponentIcon } from "../../components/IconComponent/Icon";


export function ProductDetail({ product, onClose }) {
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
                <ComponentIcon name="productVariant" size={20} color="#6b7280" />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">{product.goodsName}</h1>
                {getStatusBadge(product.status)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ComponentIcon name="qrcode" size={20} color="#6b7280" />
                <span className="font-mono text-sm">{product.goodsCode}</span>
              </div>
            </div>
          </div>

          <Separator className="mb-8 md:mb-12" />

          {/* Main Content Grid */}
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            {/* Product Information Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="package" size={40} color="#374151" />
                  Thông tin sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="box" size={20} color="#6b7280" />} label="Đơn vị đo" value={product.unitMeasureName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="category" size={20} color="#6b7280" />} label="Danh mục" value={product.categoryName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="tag" size={20} color="#6b7280" />} label="Thương hiệu" value={product.brandName || 'N/A'} />
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="supplier" size={40} color="#374151" />
                  Thông tin nhà cung cấp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="building" size={20} color="#6b7280" />} label="Công ty" value={product.companyName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="mapPin" size={20} color="#6b7280" />} label="Địa chỉ" value={product.address || 'N/A'} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Storage Conditions Card - Full Width */}
          <Card className="mt-6 md:mt-8 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ComponentIcon name="storageCondition" size={40} color="#374151" />
                Điều kiện bảo quản
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ComponentIcon name="thermometer" size={40} color="#6b7280" />
                    <span className="text-sm font-medium">Nhiệt độ</span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">{product.temperatureMin || 'N/A'}°C</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-2xl font-bold text-foreground">{product.temperatureMax || 'N/A'}°C</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Khoảng nhiệt độ khuyến nghị</p>
                  </div>
                </div>

                {/* Humidity */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ComponentIcon name="droplets" size={40} color="#6b7280" />
                    <span className="text-sm font-medium">Độ ẩm</span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">{product.humidityMin || 'N/A'}%</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-2xl font-bold text-foreground">{product.humidityMax || 'N/A'}%</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Khoảng độ ẩm khuyến nghị</p>
                  </div>
                </div>

                {/* Light Level */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ComponentIcon name="sun" size={40} color="#6b7280" />
                    <span className="text-sm font-medium">Ánh sáng</span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">{product.lightLevel || 'N/A'}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Mức độ ánh sáng</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
