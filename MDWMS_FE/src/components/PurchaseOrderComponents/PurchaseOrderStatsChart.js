import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Package, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, Zap, Target, ArrowRight, Users } from "lucide-react"
import { Progress } from "antd"
import { PURCHASE_ORDER_STATUS, STATUS_LABELS } from "./StatusDisplay"

export default function PurchaseOrderStatsChart({ 
  purchaseOrderStats = {
    totalOrders: 0,
    draftOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    completedOrders: 0,
    goodsReceivedOrders: 0,
    assignedOrders: 0,
    receivingOrders: 0,
    inspectedOrders: 0,
    statusStats: []
  },
  className = ""
}) {
  // State for toggle
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  
  // Extract data from props
  const { 
    totalOrders, 
    draftOrders, 
    pendingOrders, 
    approvedOrders, 
    rejectedOrders, 
    completedOrders,
    goodsReceivedOrders,
    assignedOrders,
    receivingOrders,
    inspectedOrders,
    statusStats = [] 
  } = purchaseOrderStats

  // Calculate percentages
  const pendingPercentage = totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0
  const approvedPercentage = totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0
  const rejectedPercentage = totalOrders > 0 ? Math.round((rejectedOrders / totalOrders) * 100) : 0
  const completedPercentage = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

  // Toggle function
  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded)
  }

  // Helper function to get status display name
  const getStatusDisplayName = (status) => {
    return STATUS_LABELS[status] || "Không xác định"
  }

  // Helper function to get status color classes
  const getStatusColorClasses = (status) => {
    const statusColorMap = {
      [PURCHASE_ORDER_STATUS.Draft]: {
        dot: "bg-gray-500",
        text: "text-gray-600",
        gradient: "from-gray-400 to-gray-600",
        dotStyle: { backgroundColor: "#6b7280" },
        textStyle: { color: "#4b5563" },
        gradientStyle: { background: "linear-gradient(to right, #9ca3af, #4b5563)" }
      },
      [PURCHASE_ORDER_STATUS.PendingApproval]: {
        dot: "bg-yellow-500",
        text: "text-yellow-600",
        gradient: "from-yellow-400 to-yellow-600",
        dotStyle: { backgroundColor: "#eab308" },
        textStyle: { color: "#ca8a04" },
        gradientStyle: { background: "linear-gradient(to right, #facc15, #ca8a04)" }
      },
      [PURCHASE_ORDER_STATUS.Rejected]: {
        dot: "bg-red-500",
        text: "text-red-600",
        gradient: "from-red-400 to-red-600", 
        dotStyle: { backgroundColor: "#ef4444" },
        textStyle: { color: "#dc2626" },
        gradientStyle: { background: "linear-gradient(to right, #f87171, #dc2626)" }
      },
      [PURCHASE_ORDER_STATUS.Approved]: {
        dot: "bg-blue-500",
        text: "text-blue-600", 
        gradient: "from-blue-400 to-blue-600",
        dotStyle: { backgroundColor: "#3b82f6" },
        textStyle: { color: "#2563eb" },
        gradientStyle: { background: "linear-gradient(to right, #60a5fa, #2563eb)" }
      },
      [PURCHASE_ORDER_STATUS.GoodsReceived]: {
        dot: "bg-green-500",
        text: "text-green-600",
        gradient: "from-green-400 to-green-600",
        dotStyle: { backgroundColor: "#22c55e" },
        textStyle: { color: "#16a34a" },
        gradientStyle: { background: "linear-gradient(to right, #4ade80, #16a34a)" }
      },
      [PURCHASE_ORDER_STATUS.AssignedForReceiving]: {
        dot: "bg-purple-500",
        text: "text-purple-600",
        gradient: "from-purple-400 to-purple-600",
        dotStyle: { backgroundColor: "#a855f7" },
        textStyle: { color: "#9333ea" },
        gradientStyle: { background: "linear-gradient(to right, #c084fc, #9333ea)" }
      },
      [PURCHASE_ORDER_STATUS.Receiving]: {
        dot: "bg-orange-500",
        text: "text-orange-600",
        gradient: "from-orange-400 to-orange-600",
        dotStyle: { backgroundColor: "#f97316" },
        textStyle: { color: "#ea580c" },
        gradientStyle: { background: "linear-gradient(to right, #fb923c, #ea580c)" }
      },
      [PURCHASE_ORDER_STATUS.Inspected]: {
        dot: "bg-indigo-500",
        text: "text-indigo-600",
        gradient: "from-indigo-400 to-indigo-600",
        dotStyle: { backgroundColor: "#6366f1" },
        textStyle: { color: "#4f46e5" },
        gradientStyle: { background: "linear-gradient(to right, #818cf8, #4f46e5)" }
      },
      [PURCHASE_ORDER_STATUS.Completed]: {
        dot: "bg-emerald-500",
        text: "text-emerald-600",
        gradient: "from-emerald-400 to-emerald-600",
        dotStyle: { backgroundColor: "#10b981" },
        textStyle: { color: "#059669" },
        gradientStyle: { background: "linear-gradient(to right, #34d399, #059669)" }
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
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm font-semibold text-slate-700">
              <div className="p-1.5 bg-blue-100 rounded-lg mr-2">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              Phân tích chi tiết
            </CardTitle>
            <button
              onClick={toggleDetails}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-all duration-200 group text-sm h-[38px]"
              title={isDetailsExpanded ? "Ẩn chi tiết" : "Hiện chi tiết"}
            >
              <span className="font-medium">
                {isDetailsExpanded ? "Ẩn" : "Hiện"}
              </span>
              {isDetailsExpanded ? (
                <ChevronUp className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="p-3">
          {/* Modern Analytics Dashboard */}
          <div className={`transition-all duration-500 ease-in-out ${
            isDetailsExpanded 
              ? 'opacity-100 max-h-[800px] overflow-visible' 
              : 'opacity-0 max-h-0 overflow-hidden'
          }`}>
            


            {/* Compact Flowchart Diagram */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-md p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                  <Activity className="h-4 w-4 mr-1.5 text-slate-500" />
                  Thống kê đơn hàng
                </h3>
                  <div className="text-xs text-slate-500">
                  Tổng: <span className="font-semibold text-slate-700">{totalOrders}</span> đơn
                </div>
              </div>

              {/* Ultra Compact Flowchart SVG */}
              <div className="relative w-full h-auto bg-gradient-to-br from-slate-50 to-white rounded-md p-2 overflow-x-auto shadow-sm">
                <svg className="w-full h-auto" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    {/* Gradient Definitions */}
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8"/>
                    </linearGradient>
                    
                    {/* Static Flow Lines */}
                    <linearGradient id="staticFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="1"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6"/>
                    </linearGradient>
                    
                    
                    {/* Drop Shadow Filter */}
                    <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.2"/>
                    </filter>
                    
                    {/* Glow Effect */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Background Grid */}
                  <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  
                         {/* Centered Status Nodes - No Connection Lines */}
                         {[
                           { status: PURCHASE_ORDER_STATUS.Draft, count: purchaseOrderStats.draftOrders || 0, x: 200, y: 80, color: "gray", dotColor: "#6b7280", textColor: "#374151", gradient: "from-gray-400 to-gray-600" },
                           { status: PURCHASE_ORDER_STATUS.PendingApproval, count: purchaseOrderStats.pendingOrders || 0, x: 400, y: 80, color: "yellow", dotColor: "#eab308", textColor: "#ca8a04", gradient: "from-yellow-400 to-yellow-600" },
                           { status: PURCHASE_ORDER_STATUS.Approved, count: purchaseOrderStats.approvedOrders || 0, x: 600, y: 80, color: "green", dotColor: "#22c55e", textColor: "#16a34a", gradient: "from-green-400 to-green-600" },
                           { status: PURCHASE_ORDER_STATUS.GoodsReceived, count: purchaseOrderStats.goodsReceivedOrders || 0, x: 800, y: 80, color: "blue", dotColor: "#3b82f6", textColor: "#2563eb", gradient: "from-blue-400 to-blue-600" },
                           { status: PURCHASE_ORDER_STATUS.AssignedForReceiving, count: purchaseOrderStats.assignedOrders || 0, x: 100, y: 200, color: "purple", dotColor: "#a855f7", textColor: "#9333ea", gradient: "from-purple-400 to-purple-600" },
                           { status: PURCHASE_ORDER_STATUS.Receiving, count: purchaseOrderStats.receivingOrders || 0, x: 300, y: 200, color: "orange", dotColor: "#f97316", textColor: "#ea580c", gradient: "from-orange-400 to-orange-600" },
                           { status: PURCHASE_ORDER_STATUS.Inspected, count: purchaseOrderStats.inspectedOrders || 0, x: 500, y: 200, color: "indigo", dotColor: "#6366f1", textColor: "#4f46e5", gradient: "from-indigo-400 to-indigo-600" },
                           { status: PURCHASE_ORDER_STATUS.Completed, count: purchaseOrderStats.completedOrders || 0, x: 700, y: 200, color: "emerald", dotColor: "#10b981", textColor: "#059669", gradient: "from-emerald-400 to-emerald-600" },
                           { status: PURCHASE_ORDER_STATUS.Rejected, count: purchaseOrderStats.rejectedOrders || 0, x: 900, y: 200, color: "red", dotColor: "#ef4444", textColor: "#dc2626", gradient: "from-red-400 to-red-600" }
                         ].map((item, index) => {
                    const percentage = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
                    return (
                      <g key={item.status}>
                        {/* Outer Glow Circle */}
                        <circle 
                          cx={item.x} 
                          cy={item.y} 
                          r="45" 
                          fill="none" 
                          stroke={item.dotColor} 
                          strokeWidth="2"
                          opacity="0.3"
                          filter="url(#glow)"
                        />
                        
                        {/* Main Node Circle with Gradient */}
                        <circle 
                          cx={item.x} 
                          cy={item.y} 
                          r="35" 
                          fill="white" 
                          stroke={item.dotColor} 
                          strokeWidth="4"
                          filter="url(#dropshadow)"
                          className=""
                        />
                        
                        {/* Inner Gradient Circle */}
                        <circle 
                          cx={item.x} 
                          cy={item.y} 
                          r="25" 
                          fill={`url(#${item.color}Gradient)`}
                          opacity="0.1"
                        />
                        
                        {/* Count with Better Typography - Centered */}
                        <text 
                          x={item.x} 
                          y={item.y + 4} 
                          textAnchor="middle" 
                          className="text-lg font-bold"
                          fill={item.textColor}
                          filter="url(#dropshadow)"
                        >
                          {item.count}
                        </text>
                        
                        {/* Status Label with Background */}
                        <rect 
                          x={item.x - 60} 
                          y={item.y + 25} 
                          width="120" 
                          height="20" 
                          fill="white" 
                          stroke={item.dotColor} 
                          strokeWidth="1"
                          rx="10"
                          filter="url(#dropshadow)"
                        />
                        <text 
                          x={item.x} 
                          y={item.y + 38} 
                          textAnchor="middle" 
                          className="text-xs font-semibold"
                          fill={item.textColor}
                        >
                          {STATUS_LABELS[item.status]}
                        </text>
                        
                        {/* Percentage Badge */}
                        <circle 
                          cx={item.x + 45} 
                          cy={item.y - 25} 
                          r="15" 
                          fill={item.dotColor} 
                          opacity="0.9"
                          filter="url(#dropshadow)"
                        />
                        <text 
                          x={item.x + 45} 
                          y={item.y - 20} 
                          textAnchor="middle" 
                          className="text-xs font-bold fill-white"
                        >
                          {percentage}%
                        </text>
                      </g>
                    )
                  })}
                  
                </svg>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}