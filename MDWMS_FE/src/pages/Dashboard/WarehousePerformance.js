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
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-64 h-60">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Outer arc - light grey background, full semi-circle, thin */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 20.6 100 A 80 80 0 1 1 172.8 66.9"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center">
                {(() => {
                  // Calculate average of all metrics (0-100%)
                  const avgPercentage = (
                    warehouseStats.spaceUtilization +
                    warehouseStats.orderCompletionRate +
                    warehouseStats.inventoryTurnover +
                    warehouseStats.averageProcessingTime
                  ) / 4

                  // Convert to rating (0-100% -> 0-5)
                  const rating = (avgPercentage / 100) * 5

                  // Calculate percentage change (based on average)
                  const percentageChange = Math.round(avgPercentage * 0.4)

                  return (
                    <>
                      <p className="text-3xl font-bold mb-2">
                        {rating.toFixed(1)}/5
                      </p>
                      <div className="px-2.5 py-1 bg-green-100 text-green-600 rounded-md text-sm font-medium inline-block">
                        +{percentageChange}%
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Sử dụng không gian</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${warehouseStats.spaceUtilization}%` }}
                />
              </div>
              <span className="text-sm">{warehouseStats.spaceUtilization}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Tỷ lệ hoàn thành đơn hàng</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${warehouseStats.orderCompletionRate}%` }}
                />
              </div>
              <span className="text-sm">{warehouseStats.orderCompletionRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Vòng quay tồn kho</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${warehouseStats.inventoryTurnover}%` }}
                />
              </div>
              <span className="text-sm">{warehouseStats.inventoryTurnover}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Hiệu quả xử lý</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${warehouseStats.averageProcessingTime}%` }}
                />
              </div>
              <span className="text-sm">{warehouseStats.averageProcessingTime}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

