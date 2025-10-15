import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Building2, Users, UserCheck, UserX, TrendingUp, Activity } from "lucide-react"

export default function AccountStatsChart({ 
  totalUsers = 0,
  activeUsers = 0,
  inactiveUsers = 0,
  warehouseManagers = 0,
  salesManagers = 0,
  warehouseStaff = 0,
  salesStaff = 0,
  className = ""
}) {
  // Calculate percentages
  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
  const inactivePercentage = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0

  // Calculate role percentages
  const warehouseManagerPercentage = totalUsers > 0 ? Math.round((warehouseManagers / totalUsers) * 100) : 0
  const salesManagerPercentage = totalUsers > 0 ? Math.round((salesManagers / totalUsers) * 100) : 0
  const warehouseStaffPercentage = totalUsers > 0 ? Math.round((warehouseStaff / totalUsers) * 100) : 0
  const salesStaffPercentage = totalUsers > 0 ? Math.round((salesStaff / totalUsers) * 100) : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Tổng người dùng</p>
                <p className="text-3xl font-bold text-orange-700 mt-2">{totalUsers}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-orange-600 text-sm">100% tổng số</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Đang hoạt động</p>
                <p className="text-3xl font-bold text-green-700 mt-2">{activeUsers}</p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm">{activePercentage}% tổng số</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users Card */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Ngừng hoạt động</p>
                <p className="text-3xl font-bold text-red-700 mt-2">{inactiveUsers}</p>
                <div className="flex items-center mt-2">
                  <UserX className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600 text-sm">{inactivePercentage}% tổng số</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <UserX className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-orange-500" />
            Phân bố theo chức vụ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Warehouse Manager */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 font-medium text-sm">Quản lý kho</span>
                <span className="text-blue-600 text-xs">{warehouseManagerPercentage}%</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">{warehouseManagers}</div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${warehouseManagerPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Sales Manager */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-700 font-medium text-sm">Quản lý kinh doanh</span>
                <span className="text-purple-600 text-xs">{salesManagerPercentage}%</span>
              </div>
              <div className="text-2xl font-bold text-purple-800">{salesManagers}</div>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${salesManagerPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Warehouse Staff */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-indigo-700 font-medium text-sm">Nhân viên kho</span>
                <span className="text-indigo-600 text-xs">{warehouseStaffPercentage}%</span>
              </div>
              <div className="text-2xl font-bold text-indigo-800">{warehouseStaff}</div>
              <div className="w-full bg-indigo-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${warehouseStaffPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Sales Staff */}
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-teal-700 font-medium text-sm">Nhân viên kinh doanh</span>
                <span className="text-teal-600 text-xs">{salesStaffPercentage}%</span>
              </div>
              <div className="text-2xl font-bold text-teal-800">{salesStaff}</div>
              <div className="w-full bg-teal-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${salesStaffPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-orange-500" />
            Tổng quan trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 text-sm">Hoạt động</span>
                <span className="text-slate-600 text-sm">{activeUsers} người ({activePercentage}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${activePercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="flex-1 ml-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 text-sm">Ngừng hoạt động</span>
                <span className="text-slate-600 text-sm">{inactiveUsers} người ({inactivePercentage}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${inactivePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
