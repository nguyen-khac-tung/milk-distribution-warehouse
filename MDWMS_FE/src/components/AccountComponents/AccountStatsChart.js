import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Building2, Users, UserCheck, UserX, Activity, BarChart3, ChevronDown, ChevronUp } from "lucide-react"
import { getRoleList } from "../../services/RoleService"

export default function AccountStatsChart({ 
  userStats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    roleStats: []
  },
  className = ""
}) {
  // State for toggle
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  
  // State for roles
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true)
        const response = await getRoleList()
        if (response?.data) {
          setRoles(response.data)
        }
      } catch (error) {
        console.error("Error fetching roles:", error)
        setRoles([])
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [])

  // Extract data from props
  const { totalUsers, activeUsers, inactiveUsers, roleStats = [] } = userStats

  // Calculate percentages
  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
  const inactivePercentage = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0

  // Toggle function
  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded)
  }

  // Helper function to get role display name
  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      "Warehouse Manager": "Quản lý kho",
      "Warehouse Staff": "Nhân viên kho",
      "Administrator": "Quản trị viên",
      "Business Owner": "Chủ doanh nghiệp",
      "Sales Representative": "Đại diện bán hàng",
      "Sale Manager": "Quản lý kinh doanh"
    }
    return roleMap[roleName] || roleName
  }

  // Helper function to get role data from roleStats
  const getRoleData = (roleName) => {
    const roleData = roleStats.find(stat => stat.roleName === roleName)
    return roleData || { count: 0, percentage: 0 }
  }

  // Helper function to get role color classes and styles
  const getRoleColorClasses = (roleName) => {
    const roleColorMap = {
      "Warehouse Manager": {
        dot: "bg-blue-500",
        text: "text-blue-600",
        gradient: "from-blue-400 to-blue-600",
        dotStyle: { backgroundColor: "#3b82f6" },
        textStyle: { color: "#2563eb" },
        gradientStyle: { background: "linear-gradient(to right, #60a5fa, #2563eb)" }
      },
      "Warehouse Staff": {
        dot: "bg-indigo-500",
        text: "text-indigo-600",
        gradient: "from-indigo-400 to-indigo-600",
        dotStyle: { backgroundColor: "#6366f1" },
        textStyle: { color: "#4f46e5" },
        gradientStyle: { background: "linear-gradient(to right, #818cf8, #4f46e5)" }
      },
      "Administrator": {
        dot: "bg-purple-500",
        text: "text-purple-600",
        gradient: "from-purple-400 to-purple-600",
        dotStyle: { backgroundColor: "#8b5cf6" },
        textStyle: { color: "#7c3aed" },
        gradientStyle: { background: "linear-gradient(to right, #a78bfa, #7c3aed)" }
      },
      "Business Owner": {
        dot: "bg-orange-500",
        text: "text-orange-600",
        gradient: "from-orange-400 to-orange-600",
        dotStyle: { backgroundColor: "#f97316" },
        textStyle: { color: "#ea580c" },
        gradientStyle: { background: "linear-gradient(to right, #fb923c, #ea580c)" }
      },
      "Sales Representative": {
        dot: "bg-emerald-500",
        text: "text-emerald-600",
        gradient: "from-emerald-400 to-emerald-600",
        dotStyle: { backgroundColor: "#10b981" },
        textStyle: { color: "#059669" },
        gradientStyle: { background: "linear-gradient(to right, #34d399, #059669)" }
      },
      "Sale Manager": {
        dot: "bg-teal-500",
        text: "text-teal-600",
        gradient: "from-teal-400 to-teal-600",
        dotStyle: { backgroundColor: "#14b8a6" },
        textStyle: { color: "#0d9488" },
        gradientStyle: { background: "linear-gradient(to right, #5eead4, #0d9488)" }
      }
    }
    return roleColorMap[roleName] || {
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
      <div className="hidden bg-blue-500 bg-indigo-500 bg-purple-500 bg-orange-500 bg-emerald-500 bg-teal-500 bg-gray-500"></div>
      <div className="hidden text-blue-600 text-indigo-600 text-purple-600 text-orange-600 text-emerald-600 text-teal-600 text-gray-600"></div>
      <div className="hidden from-blue-400 to-blue-600 from-indigo-400 to-indigo-600 from-purple-400 to-purple-600 from-orange-400 to-orange-600 from-emerald-400 to-emerald-600 from-teal-400 to-teal-600 from-gray-400 to-gray-600"></div>
      
      {/* Unified Statistics Card */}
      <Card className="bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-800 flex items-center text-xl">
              <BarChart3 className="h-6 w-6 mr-3 text-orange-500" />
              Thống kê người dùng hệ thống
            </CardTitle>
            <button
              onClick={toggleDetails}
              className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-all duration-200 group"
              title={isDetailsExpanded ? "Ẩn chi tiết" : "Hiện chi tiết"}
            >
              <span className="text-sm font-medium">
                {isDetailsExpanded ? "Ẩn chi tiết" : "Hiện chi tiết"}
              </span>
              {isDetailsExpanded ? (
                <ChevronUp className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>
          </div>
        </CardHeader>
        
          <CardContent className="p-6">
          {/* Top Section - Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-8">
            {/* Total Users */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-24 flex items-center justify-center">
              <div className="flex items-center w-full h-full">
                <div className="w-14 h-14 bg-orange-500 rounded-lg flex items-center justify-center mr-4 ml-6">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-slate-600 mb-1">Tổng người dùng</div>
                  <div className="text-2xl font-bold text-slate-900">{totalUsers}</div>
                </div>
                <div className="w-16 h-8 relative group mr-6">
                  <svg width="64" height="32" viewBox="0 0 64 32" className="w-full h-full">
                    <defs>
                      <linearGradient id="trendGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#f97316" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M2,24 Q8,18 16,22 T24,16 T32,20 T40,14 T48,18 T56,12 T62,16 L62,32 L2,32 Z"
                      fill="url(#trendGradient1)"
                      opacity="0.1"
                    />
                    <path
                      d="M2,24 Q8,18 16,22 T24,16 T32,20 T40,14 T48,18 T56,12 T62,16"
                      stroke="#f97316"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      className="animate-draw"
                    />
                    <circle cx="2" cy="24" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '0.5s'}} />
                    <circle cx="8" cy="18" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '0.8s'}} />
                    <circle cx="16" cy="22" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '1.1s'}} />
                    <circle cx="24" cy="16" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '1.4s'}} />
                    <circle cx="32" cy="20" r="2" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-3 transition-all cursor-pointer" style={{animationDelay: '1.7s'}} />
                    <circle cx="40" cy="14" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2s'}} />
                    <circle cx="48" cy="18" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.3s'}} />
                    <circle cx="56" cy="12" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.6s'}} />
                    <circle cx="62" cy="16" r="1.5" fill="#f97316" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.9s'}} />
                  </svg>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {totalUsers} tổng người dùng
                  </div>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-24 flex items-center justify-center">
              <div className="flex items-center w-full h-full">
                <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center mr-4 ml-6">
                  <UserCheck className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-slate-600 mb-1">Đang hoạt động</div>
                  <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
                </div>
                <div className="w-16 h-8 relative group mr-6">
                  <svg width="64" height="32" viewBox="0 0 64 32" className="w-full h-full">
                    <defs>
                      <linearGradient id="trendGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#22c55e" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M2,20 Q8,26 16,22 T24,28 T32,24 T40,30 T48,26 T56,32 T62,28 L62,32 L2,32 Z"
                      fill="url(#trendGradient2)"
                      opacity="0.1"
                    />
                    <path
                      d="M2,20 Q8,26 16,22 T24,28 T32,24 T40,30 T48,26 T56,32 T62,28"
                      stroke="#22c55e"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      className="animate-draw"
                    />
                    <circle cx="2" cy="20" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '0.5s'}} />
                    <circle cx="8" cy="26" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '0.8s'}} />
                    <circle cx="16" cy="22" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '1.1s'}} />
                    <circle cx="24" cy="28" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '1.4s'}} />
                    <circle cx="32" cy="24" r="2" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-3 transition-all cursor-pointer" style={{animationDelay: '1.7s'}} />
                    <circle cx="40" cy="30" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2s'}} />
                    <circle cx="48" cy="26" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.3s'}} />
                    <circle cx="56" cy="32" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.6s'}} />
                    <circle cx="62" cy="28" r="1.5" fill="#22c55e" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.9s'}} />
                  </svg>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {activeUsers} đang hoạt động
                  </div>
                </div>
              </div>
            </div>

            {/* Inactive Users */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-24 flex items-center justify-center">
              <div className="flex items-center w-full h-full">
                <div className="w-14 h-14 bg-red-500 rounded-lg flex items-center justify-center mr-4 ml-6">
                  <UserX className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-slate-600 mb-1">Ngừng hoạt động</div>
                  <div className="text-2xl font-bold text-red-600">{inactiveUsers}</div>
                </div>
                <div className="w-16 h-8 relative group mr-6">
                  <svg width="64" height="32" viewBox="0 0 64 32" className="w-full h-full">
                    <defs>
                      <linearGradient id="trendGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M2,28 Q8,24 16,26 T24,22 T32,24 T40,20 T48,22 T56,18 T62,20 L62,32 L2,32 Z"
                      fill="url(#trendGradient3)"
                      opacity="0.1"
                    />
                    <path
                      d="M2,28 Q8,24 16,26 T24,22 T32,24 T40,20 T48,22 T56,18 T62,20"
                      stroke="#ef4444"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      className="animate-draw"
                    />
                    <circle cx="2" cy="28" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '0.5s'}} />
                    <circle cx="8" cy="24" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '0.8s'}} />
                    <circle cx="16" cy="26" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '1.1s'}} />
                    <circle cx="24" cy="22" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '1.4s'}} />
                    <circle cx="32" cy="24" r="2" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-3 transition-all cursor-pointer" style={{animationDelay: '1.7s'}} />
                    <circle cx="40" cy="20" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2s'}} />
                    <circle cx="48" cy="22" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.3s'}} />
                    <circle cx="56" cy="18" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.6s'}} />
                    <circle cx="62" cy="20" r="1.5" fill="#ef4444" className="opacity-0 animate-fadeIn hover:r-2 transition-all cursor-pointer" style={{animationDelay: '2.9s'}} />
                  </svg>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {inactiveUsers} ngừng hoạt động
                  </div>
                </div>
              </div>
            </div>
      </div>

          {/* Bottom Section - Role Distribution and Status Overview */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-500 ease-in-out ${
            isDetailsExpanded 
              ? 'opacity-100 max-h-[1000px] overflow-visible' 
              : 'opacity-0 max-h-0 overflow-hidden'
          }`}>
      {/* Role Distribution */}
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
            <Building2 className="h-5 w-5 mr-2 text-orange-500" />
                <h3 className="text-lg font-semibold text-slate-800">Phân bố theo chức vụ</h3>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-slate-600">Đang tải...</span>
              </div>
                ) : (
                  roles.map((role, index) => {
                    const colorClasses = getRoleColorClasses(role.roleName)
                    const roleData = getRoleData(role.roleName)
                    const count = roleData.count || 0
                    const percentage = roleData.percentage || 0
                    const displayName = getRoleDisplayName(role.roleName)
                    
                    
                    return (
                      <div key={role.roleId || index} className="flex items-center justify-between py-2 hover:bg-slate-50 rounded-lg transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={colorClasses.dotStyle}
                          ></div>
                          <span className="text-slate-700 font-medium text-sm">{displayName}</span>
              </div>
                        <div className="flex items-center space-x-3">
                          <span 
                            className="text-2xl font-bold"
                            style={colorClasses.textStyle}
                          >{count}</span>
                          <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{ 
                                width: `${percentage}%`,
                                ...colorClasses.gradientStyle
                              }}
                ></div>
              </div>
                          <span className="text-slate-500 text-xs font-medium w-8 text-right">{percentage}%</span>
            </div>
              </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Status Overview */}
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <Activity className="h-5 w-5 mr-2 text-orange-500" />
                <h3 className="text-lg font-semibold text-slate-800">Tổng quan trạng thái</h3>
              </div>
              
              <div className="space-y-6">
                {/* Active Status */}
                <div className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-700 font-semibold">Hoạt động</span>
              </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold text-green-600">{activeUsers}</span>
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${activePercentage}%` }}
                ></div>
                    </div>
                    <span className="text-slate-500 text-sm font-medium w-12 text-right">{activePercentage}%</span>
              </div>
            </div>

                {/* Inactive Status */}
                <div className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-slate-700 font-semibold">Ngừng hoạt động</span>
              </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold text-red-600">{inactiveUsers}</span>
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                        className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${inactivePercentage}%` }}
                ></div>
                    </div>
                    <span className="text-slate-500 text-sm font-medium w-12 text-right">{inactivePercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
