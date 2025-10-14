import React from "react"
import { Card, CardContent } from "../ui/card"

export default function StatsCards({ 
  totalCount = 0, 
  activeCount = 0, 
  inactiveCount = 0,
  totalLabel = "Tổng hàng hóa",
  activeLabel = "Đang hoạt động", 
  inactiveLabel = "Không hoạt động",
  className = ""
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <Card className="border-l-4 border-l-[#237486]">
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-slate-600">{totalLabel}</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{totalCount}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-[#237486]">
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-slate-600">{activeLabel}</div>
          <div className="text-3xl font-bold text-[#237486] mt-2">{activeCount}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-[#237486]">
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-slate-600">{inactiveLabel}</div>
          <div className="text-3xl font-bold text-slate-600 mt-2">{inactiveCount}</div>
        </CardContent>
      </Card>
    </div>
  )
}
