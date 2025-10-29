import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"
import { Button } from "../../components/ui/button"
import { ComponentIcon } from "../../components/IconComponent/Icon";
import { getBackOrderDetail } from "../../services/BackOrderService";
import { extractErrorMessage } from "../../utils/Validation";


export function BackOrderDetail({ backOrder, onClose }) {
  const [backOrderData, setBackOrderData] = useState(backOrder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (backOrder?.backOrderId) {
      loadBackOrderDetail();
    }
  }, [backOrder?.backOrderId]);

  const loadBackOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await getBackOrderDetail(backOrder.backOrderId);
      console.log("API Response:", response);
      const backOrderInfo = response.data || response;
      console.log("BackOrder Info:", backOrderInfo);
      setBackOrderData(backOrderInfo);
    } catch (error) {
      console.error("Error loading backOrder detail:", error);
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
          Đang xử lý
        </span>
      case 2:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-blue-400"></span>
          Đã hoàn thành
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
          <h1 className="text-2xl font-bold text-slate-800">Chi tiết đơn đặt hàng</h1>
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
                <ComponentIcon name="shopping-cart" size={40} color="#6b7280" />
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-balance">
                  Đơn đặt hàng #{backOrderData.backOrderId}
                </h1>
                {getStatusBadge(backOrderData.status)}
              </div>
              <div className="text-lg text-slate-600 font-medium">
                {backOrderData.retailerName || 'N/A'}
              </div>
            </div>
          </div>

          <Separator className="mb-8 md:mb-12" />

          {/* Main Content Grid */}
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            {/* BackOrder Information Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="shopping-cart" size={30} color="#374151" />
                  Thông tin đơn đặt hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="hash" size={20} color="#6b7280" />} label="Mã đơn hàng" value={`#${backOrderData.backOrderId || 'N/A'}`} />
                  <InfoRow icon={<ComponentIcon name="package" size={20} color="#6b7280" />} label="Sản phẩm" value={backOrderData.goodsName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="hash" size={20} color="#6b7280" />} label="Số lượng" value={backOrderData.quantity || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="calendar" size={20} color="#6b7280" />} label="Ngày tạo" value={backOrderData.createdAt ? new Date(backOrderData.createdAt).toLocaleDateString('vi-VN') : 'N/A'} />
                </div>
              </CardContent>
            </Card>

            {/* Retailer Information Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="building" size={30} color="#374151" />
                  Thông tin nhà bán lẻ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="building" size={20} color="#6b7280" />} label="Tên nhà bán lẻ" value={backOrderData.retailerName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="user" size={20} color="#6b7280" />} label="Người tạo" value={backOrderData.createdBy || 'N/A'} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information Card */}
          <div className="mt-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ComponentIcon name="info" size={30} color="#374151" />
                  Thông tin bổ sung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <InfoRow icon={<ComponentIcon name="calendar" size={20} color="#6b7280" />} label="Ngày cập nhật" value={backOrderData.updatedAt ? new Date(backOrderData.updatedAt).toLocaleDateString('vi-VN') : 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="user" size={20} color="#6b7280" />} label="Người cập nhật" value={backOrderData.updatedBy || 'N/A'} />
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
