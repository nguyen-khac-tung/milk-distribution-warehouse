import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Progress } from "../../components/ui/progress"
import { getLocationReport } from "../../services/DashboardService"

export default function WarehousePerformance() {
  const [warehouseStats, setWarehouseStats] = useState({
    spaceUtilization: 0,
    orderCompletionRate: 0,
    inventoryTurnover: 0,
    averageProcessingTime: 0
  })
  const [timeRange, setTimeRange] = useState("Tuần này")

  // Calculate warehouse statistics
  useEffect(() => {
    const calculateWarehouseStats = async () => {
      try {
        // Fetch location report to get space utilization
        const locationData = await getLocationReport().catch(() => ({
          totalLocations: 0,
          availableLocationCount: 0
        }))

        // Calculate space utilization
        let spaceUtilization = 0
        if (locationData?.totalLocations > 0) {
          const usedLocations = locationData.totalLocations - locationData.availableLocationCount
          spaceUtilization = Math.round((usedLocations / locationData.totalLocations) * 100)
        }

        // Mock data for other stats (can be replaced with actual API calls)
        const orderCompletionRate = 85
        const inventoryTurnover = 12
        const averageProcessingTime = 75

        setWarehouseStats({
          spaceUtilization,
          orderCompletionRate,
          inventoryTurnover,
          averageProcessingTime
        })
      } catch (error) {
        console.error("Error calculating warehouse stats:", error)
        // Set default values on error
        setWarehouseStats({
          spaceUtilization: 0,
          orderCompletionRate: 0,
          inventoryTurnover: 0,
          averageProcessingTime: 0
        })
      }
    }

    calculateWarehouseStats()
  }, [timeRange])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-base font-medium">Hiệu suất kho</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              {timeRange} <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTimeRange("Tuần này")}>
              Tuần này
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange("Tháng này")}>
              Tháng này
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange("Năm nay")}>
              Năm nay
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-24">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              {/* Background arc */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke="#e5e7eb" 
                strokeWidth="8" 
                strokeLinecap="round"
              />
              {/* Progress arc - calculated based on percentage */}
              {(() => {
                const percentage = warehouseStats.spaceUtilization
                const angle = (percentage / 100) * 180 // 0-180 degrees
                const radians = (angle * Math.PI) / 180
                const radius = 40
                const centerX = 50
                const centerY = 50
                const startX = 10
                const startY = 50
                const endX = centerX + radius * Math.cos(Math.PI - radians)
                const endY = centerY - radius * Math.sin(Math.PI - radians)
                const largeArcFlag = percentage > 50 ? 1 : 0
                
                return (
                  <path 
                    d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="8" 
                    strokeLinecap="round"
                  />
                )
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium">Hiệu suất</p>
                <p className="text-2xl font-bold">{warehouseStats.spaceUtilization}%</p>
                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded">Sử dụng không gian</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Sử dụng không gian</span>
            <div className="flex items-center gap-2">
              <Progress value={warehouseStats.spaceUtilization} className="h-2 w-32" />
              <span className="text-sm">{warehouseStats.spaceUtilization}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Tỷ lệ hoàn thành đơn hàng</span>
            <div className="flex items-center gap-2">
              <Progress value={warehouseStats.orderCompletionRate} className="h-2 w-32" />
              <span className="text-sm">{warehouseStats.orderCompletionRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Vòng quay tồn kho</span>
            <div className="flex items-center gap-2">
              <Progress value={warehouseStats.inventoryTurnover} className="h-2 w-32" />
              <span className="text-sm">{warehouseStats.inventoryTurnover}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Hiệu quả xử lý</span>
            <div className="flex items-center gap-2">
              <Progress value={warehouseStats.averageProcessingTime} className="h-2 w-32" />
              <span className="text-sm">{warehouseStats.averageProcessingTime}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

