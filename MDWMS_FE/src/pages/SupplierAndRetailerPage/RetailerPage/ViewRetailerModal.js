import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Separator } from "../../../components/ui/separator"
import { Button } from "../../../components/ui/button"
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { getRetailerDetail } from "../../../services/RetailerService";
import { extractErrorMessage } from "../../../utils/Validation";


export function RetailerDetail({ retailer, onClose }) {
  const [retailerData, setRetailerData] = useState(retailer);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (retailer?.retailerId) {
      loadRetailerDetail();
    }
  }, [retailer?.retailerId]);

  const loadRetailerDetail = async () => {
    try {
      setLoading(true);
      const response = await getRetailerDetail(retailer.retailerId);
      console.log("API Response:", response);
      const retailerInfo = response.data || response;
      console.log("Retailer Info:", retailerInfo);
      setRetailerData(retailerInfo);
    } catch (error) {
      console.error("Error loading retailer detail:", error);
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
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{zIndex: 99999}}>
        <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Đang tải thông tin...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{zIndex: 99999}}>
      <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Chi tiết nhà bán lẻ</h1>
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
                <ComponentIcon name="retailer" size={40} color="#6b7280" />
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-balance">{retailerData.retailerName}</h1>
                {getStatusBadge(retailerData.status)}
              </div>
              <div className="text-lg text-slate-600 font-medium">{retailerData.retailerName}</div>
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
                  <InfoRow icon={<ComponentIcon name="retailer" size={20} color="#6b7280" />} label="Tên nhà bán lẻ" value={retailerData.retailerName || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="tax" size={20} color="#6b7280" />} label="Mã số thuế" value={retailerData.taxCode || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="mapPin" size={20} color="#6b7280" />} label="Địa chỉ" value={retailerData.address || 'N/A'} />
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
                  <InfoRow icon={<ComponentIcon name="phone" size={20} color="#6b7280" />} label="Số điện thoại" value={retailerData.phone || 'N/A'} />
                  <InfoRow icon={<ComponentIcon name="email" size={20} color="#6b7280" />} label="Email" value={retailerData.email || 'N/A'} />
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