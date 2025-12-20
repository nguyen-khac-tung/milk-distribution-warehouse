import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { ComponentIcon } from "../../components/IconComponent/Icon"
import { X } from "lucide-react"
import { getBackOrderDetail } from "../../services/BackOrderService"
import { extractErrorMessage } from "../../utils/Validation"

export function BackOrderDetail({ backOrder, onClose }) {
  const [backOrderData, setBackOrderData] = useState(backOrder)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (backOrder?.backOrderId) loadBackOrderDetail()
  }, [backOrder?.backOrderId])

  const loadBackOrderDetail = async () => {
    try {
      setLoading(true)
      const response = await getBackOrderDetail(backOrder.backOrderId)
      const backOrderInfo = response.data || response
      setBackOrderData(backOrderInfo)
    } catch (error) {
      window.showToast(extractErrorMessage(error), "error")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      Unavailable: { label: "Không có sẵn", color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
      Available: { label: "Có sẵn", color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
      Default: { label: "Không xác định", color: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-400" }
    }
    const s = map[status] || map.Default
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${s.color}`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${s.dot}`}></span>
        {s.label}
      </span>
    )
  }

  const totalQuantity = backOrderData?.packageQuantity && backOrderData?.unitPerPackage
    ? parseInt(backOrderData.packageQuantity) * parseInt(backOrderData.unitPerPackage)
    : 0

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto bg-white rounded-xl shadow-xl relative">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ComponentIcon name="shopping-cart" size={22} color="#3b82f6" />
            Chi tiết đơn bổ sung
          </h1>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Summary */}
        <div className="p-5 space-y-3 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Trạng thái</p>
            </div>
            {getStatusBadge(backOrderData?.statusDinamic)}
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-5 grid gap-6 lg:grid-cols-[6.5fr_5.5fr]">

          {/* Left */}
          <div className="space-y-6">

            {/* Product */}
            <SimpleCard title="Thông tin hàng hóa" icon="package" color="blue">
              <InfoRow label="Tên hàng hóa" value={backOrderData?.goodsName} />
              <InfoRow label="Tên phân loại" value={backOrderData?.categoryName} />
              <InfoRow label="Thương hiệu" value={backOrderData?.brandName} />
            </SimpleCard>

            {/* Quantity */}
            <SimpleCard title="Thông tin số lượng" icon="batch" color="green">
              <InfoRow label="Số thùng" value={backOrderData?.packageQuantity} />
              <InfoRow label="Quy cách" value={backOrderData?.unitPerPackage ? `${backOrderData.unitPerPackage} ${backOrderData.unitMeasureName || ""}/thùng` : "N/A"} />
              <InfoRow label="Đơn vị" value={backOrderData?.unitMeasureName} />
              <div className="pt-2 border-t border-gray-200">
                <InfoRow label="Tổng số lượng" value={totalQuantity ? `${totalQuantity.toLocaleString("vi-VN")} ${backOrderData?.unitMeasureName}` : "N/A"} highlight />
              </div>
            </SimpleCard>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Supplier */}
            <SimpleCard title="Thông tin nhà cung cấp" icon="supplier" color="purple">
              <InfoRow label="Tên công ty" value={backOrderData?.companyName} />
            </SimpleCard>

            {/* Retailer */}
            <SimpleCard title="Thông tin nhà bán lẻ" icon="retailer" color="blue">
              <InfoRow label="Tên nhà bán lẻ" value={backOrderData?.retailerName} />
            </SimpleCard>

            {/* Creator */}
            <SimpleCard title="Người tạo" icon="user" color="amber">
              <InfoRow label="Tên người tạo" value={backOrderData?.createdByName} />
            </SimpleCard>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4 flex justify-end shadow-sm">
          <button onClick={onClose} className="h-[38px] px-7 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition shadow">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function SimpleCard({ title, icon, color, children }) {
  const colorMap = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    amber: "bg-amber-50"
  }
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className={`${colorMap[color]} border-b border-gray-200`}>
        <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
          <ComponentIcon name={icon} size={18} color="#374151" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {children}
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-green-600 text-base" : "text-gray-800"}`}>{value || "N/A"}</span>
    </div>
  )
}
