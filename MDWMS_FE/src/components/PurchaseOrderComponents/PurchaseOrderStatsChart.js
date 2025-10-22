import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Package, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, Zap, Target, ArrowRight } from "lucide-react"

export default function PurchaseOrderStatsChart({ 
  purchaseOrderStats = {
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    shippedOrders: 0,
    statusStats: []
  },
  className = ""
}) {
  // State for toggle
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  
  // Extract data from props
  const { totalOrders, pendingOrders, approvedOrders, rejectedOrders, shippedOrders, statusStats = [] } = purchaseOrderStats

  // Calculate percentages
  const pendingPercentage = totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0
  const approvedPercentage = totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0
  const rejectedPercentage = totalOrders > 0 ? Math.round((rejectedOrders / totalOrders) * 100) : 0
  const shippedPercentage = totalOrders > 0 ? Math.round((shippedOrders / totalOrders) * 100) : 0

  // Toggle function
  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded)
  }

  // Helper function to get status display name
  const getStatusDisplayName = (status) => {
    const statusMap = {
      1: "Chờ duyệt",
      2: "Đã xuất", 
      3: "Từ chối",
      4: "Đã duyệt"
    }
    return statusMap[status] || "Không xác định"
  }

  // Helper function to get status color classes
  const getStatusColorClasses = (status) => {
    const statusColorMap = {
      1: {
        dot: "bg-yellow-500",
        text: "text-yellow-600",
        gradient: "from-yellow-400 to-yellow-600",
        dotStyle: { backgroundColor: "#eab308" },
        textStyle: { color: "#ca8a04" },
        gradientStyle: { background: "linear-gradient(to right, #facc15, #ca8a04)" }
      },
      2: {
        dot: "bg-blue-500",
        text: "text-blue-600", 
        gradient: "from-blue-400 to-blue-600",
        dotStyle: { backgroundColor: "#3b82f6" },
        textStyle: { color: "#2563eb" },
        gradientStyle: { background: "linear-gradient(to right, #60a5fa, #2563eb)" }
      },
      3: {
        dot: "bg-red-500",
        text: "text-red-600",
        gradient: "from-red-400 to-red-600", 
        dotStyle: { backgroundColor: "#ef4444" },
        textStyle: { color: "#dc2626" },
        gradientStyle: { background: "linear-gradient(to right, #f87171, #dc2626)" }
      },
      4: {
        dot: "bg-green-500",
        text: "text-green-600",
        gradient: "from-green-400 to-green-600",
        dotStyle: { backgroundColor: "#22c55e" },
        textStyle: { color: "#16a34a" },
        gradientStyle: { background: "linear-gradient(to right, #4ade80, #16a34a)" }
      }
    }
    return statusColorMap[status] || {
      dot: "bg-gray-500",
      text: "text-gray-600",
      gradient: "from-gray-400 to-gray-600",
      dotStyle: { backgroundColor: "#6b7280" },
      textStyle: { color: "#4b5563" },
      gradientStyle: { background: "linear-gradient(to right, #9ca3af, #4b5563)" }
    }
  }

  return (
    <div className={`${className}`}>
      {/* Tailwind CSS classes for dynamic colors - ensure they are included in build */}
      <div className="hidden bg-yellow-500 bg-blue-500 bg-red-500 bg-green-500 bg-gray-500 bg-orange-500 bg-purple-500"></div>
      <div className="hidden text-yellow-600 text-blue-600 text-red-600 text-green-600 text-gray-600 text-orange-600 text-purple-600"></div>
      <div className="hidden from-yellow-400 to-yellow-600 from-blue-400 to-blue-600 from-red-400 to-red-600 from-green-400 to-green-600 from-gray-400 to-gray-600 from-orange-400 to-orange-600 from-purple-400 to-purple-600"></div>
      

      {/* Detailed Analytics Card */}
      <Card className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-base font-semibold text-slate-700">
              <Activity className="h-4 w-4 mr-2 text-slate-600" />
              Phân tích chi tiết
            </CardTitle>
            <button
              onClick={toggleDetails}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-all duration-200 group text-sm"
              title={isDetailsExpanded ? "Ẩn chi tiết" : "Hiện chi tiết"}
            >
              <span className="font-medium">
                {isDetailsExpanded ? "Ẩn chi tiết" : "Hiện chi tiết"}
              </span>
              {isDetailsExpanded ? (
                <ChevronUp className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* Modern Analytics Dashboard */}
          <div className={`transition-all duration-500 ease-in-out ${
            isDetailsExpanded 
              ? 'opacity-100 max-h-[800px] overflow-visible' 
              : 'opacity-0 max-h-0 overflow-hidden'
          }`}>
            
            {/* Status Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { 
                  status: 1, 
                  label: "Chờ duyệt", 
                  count: pendingOrders, 
                  percentage: pendingPercentage,
                  color: "yellow",
                  icon: Clock
                },
                { 
                  status: 2, 
                  label: "Đã xuất", 
                  count: shippedOrders, 
                  percentage: shippedPercentage,
                  color: "blue",
                  icon: Package
                },
                { 
                  status: 3, 
                  label: "Từ chối", 
                  count: rejectedOrders, 
                  percentage: rejectedPercentage,
                  color: "red",
                  icon: XCircle
                },
                { 
                  status: 4, 
                  label: "Đã duyệt", 
                  count: approvedOrders, 
                  percentage: approvedPercentage,
                  color: "green",
                  icon: CheckCircle
                }
              ].map((item) => {
                const IconComponent = item.icon
                return (
                  <div key={item.status} className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <IconComponent className={`h-5 w-5 ${
                        item.color === 'yellow' ? 'text-yellow-500' :
                        item.color === 'blue' ? 'text-blue-500' :
                        item.color === 'red' ? 'text-red-500' :
                        'text-green-500'
                      }`} />
                      <span className="text-xs text-slate-500">{item.percentage}%</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 mb-1">{item.count}</div>
                    <div className="text-xs text-slate-600">{item.label}</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                          item.color === 'yellow' ? 'bg-yellow-500' :
                          item.color === 'blue' ? 'bg-blue-500' :
                          item.color === 'red' ? 'bg-red-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approval Rate Chart */}
              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">Tỷ lệ duyệt</h3>
                  <Target className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0}%
                  </div>
                  <div className="text-xs text-slate-500">
                    {approvedOrders} / {totalOrders} đơn hàng
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Processing Flow */}
              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">Luồng xử lý</h3>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">Chờ duyệt</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{pendingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">Đã xuất</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{shippedOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">Đã duyệt</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{approvedOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">Từ chối</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{rejectedOrders}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-800">{totalOrders}</div>
                  <div className="text-xs text-slate-600">Tổng đơn hàng</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{approvedOrders + shippedOrders}</div>
                  <div className="text-xs text-slate-600">Đã xử lý</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">{pendingOrders}</div>
                  <div className="text-xs text-slate-600">Chờ duyệt</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{rejectedOrders}</div>
                  <div className="text-xs text-slate-600">Từ chối</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}