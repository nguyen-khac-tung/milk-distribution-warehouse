import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"
import { Button } from "../../components/ui/button"
import { ComponentIcon } from "../../components/IconComponent/Icon";
import { X } from "lucide-react";
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

  const getStatusBadge = (statusDinamic) => {
    switch (statusDinamic) {
      case "Unavailable":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <span className="w-2 h-2 rounded-full mr-2 bg-orange-500"></span>
          Không có sẵn
        </span>
      case "Available":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
          Có sẵn
        </span>
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <span className="w-2 h-2 rounded-full mr-2 bg-gray-400"></span>
          Không xác định
        </span>
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-5xl mx-4 max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-slate-600 font-medium">Đang tải thông tin...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalQuantity = backOrderData?.packageQuantity && backOrderData?.unitPerPackage
    ? parseInt(backOrderData.packageQuantity) * parseInt(backOrderData.unitPerPackage)
    : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl mx-4 max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <ComponentIcon name="shopping-cart" size={24} color="#3b82f6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Chi tiết đơn đặt hàng</h1>
              <p className="text-sm text-gray-500">Thông tin chi tiết về back order</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Đóng"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header Info Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                    <span className="text-sm text-gray-600 font-medium">Mã hàng chờ</span>
                    <div className="text-lg font-bold text-blue-600">#{backOrderData?.backOrderId || 'N/A'}</div>
                  </div>
                  {getStatusBadge(backOrderData?.statusDinamic)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Nhà bán lẻ:</span>
                  <span className="ml-2 text-base font-semibold text-gray-800">{backOrderData?.retailerName || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-[7fr_4fr]">
            {/* Left Column - BackOrder Info */}
            <div className="space-y-6">
              {/* Product Information */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader className="bg-blue-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ComponentIcon name="package" size={22} color="#374151" />
                    Thông tin sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <InfoRow
                      icon={<ComponentIcon name="package" size={20} color="#6b7280" />}
                      label="Tên sản phẩm"
                      value={backOrderData?.goodsName || 'N/A'}
                      isProductName={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Quantity Information */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader className="bg-green-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ComponentIcon name="hash" size={22} color="#374151" />
                    Thông tin số lượng
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <InfoRow
                      icon={<ComponentIcon name="box" size={20} color="#6b7280" />}
                      label="Số thùng"
                      value={backOrderData?.packageQuantity || 'N/A'}
                    />
                    <InfoRow
                      icon={<ComponentIcon name="layers" size={20} color="#6b7280" />}
                      label="Số đơn vị / thùng"
                      value={backOrderData?.unitPerPackage || 'N/A'}
                    />
                    <div className="pt-2 border-t border-gray-200">
                      <InfoRow
                        icon={<ComponentIcon name="calculator" size={20} color="#10b981" />}
                        label="Tổng số lượng"
                        value={totalQuantity > 0 ? totalQuantity.toLocaleString('vi-VN') : 'N/A'}
                        isTotal={true}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Retailer and Created By Info */}
            <div className="space-y-6">
              {/* Retailer Information */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader className="bg-purple-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ComponentIcon name="building" size={22} color="#374151" />
                    Nhà bán lẻ
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <InfoRow
                      icon={<ComponentIcon name="building" size={20} color="#6b7280" />}
                      label="Tên nhà bán lẻ"
                      value={backOrderData?.retailerName || 'N/A'}
                    />
                    {/* <InfoRow 
                      icon={<ComponentIcon name="hash" size={20} color="#6b7280" />} 
                      label="Mã nhà bán lẻ" 
                      value={backOrderData?.retailerId || 'N/A'}
                    /> */}
                  </div>
                </CardContent>
              </Card>

              {/* Created By Information */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader className="bg-amber-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ComponentIcon name="user" size={22} color="#374151" />
                    Người tạo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <InfoRow
                      icon={<ComponentIcon name="user" size={20} color="#6b7280" />}
                      label="Tên người tạo"
                      value={backOrderData?.createdByName || 'N/A'}
                    />
                    {/* <InfoRow
                      icon={<ComponentIcon name="hash" size={20} color="#6b7280" />}
                      label="Mã người tạo"
                      value={backOrderData?.createdBy || 'N/A'}
                    /> */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Close Button at Bottom */}
        {onClose && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end shadow-lg">
            <button
              onClick={onClose}
              className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, isProductName = false, isTotal = false }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${isProductName ? 'items-start' : 'items-center'}`}>
      <div className="flex items-center gap-2 text-muted-foreground min-w-0 flex-shrink-0">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={`text-sm font-semibold text-foreground text-right ${isProductName ? 'text-xs' : ''} ${isTotal ? 'text-green-600 text-base' : ''}`}>
        {value}
      </span>
    </div>
  )
}
