"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown,
  Download,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { getInventoryReport } from "../../services/Dashboard"

export default function InventoryReport({ onClose }) {
  const [inventoryData, setInventoryData] = useState([
    { name: "Sun", value: 8 },
    { name: "Mon", value: 10 },
    { name: "Tue", value: 12 },
    { name: "Wed", value: 11 },
    { name: "Thu", value: 9 },
    { name: "Fri", value: 11 },
    { name: "Sat", value: 12 },
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      const data = await getInventoryReport()
      // Transform data nếu cần
      if (data && Array.isArray(data)) {
        setInventoryData(data)
      }
    } catch (error) {
      console.error("Error fetching inventory report:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Báo cáo tồn kho</h2>
          <p className="text-sm text-gray-500">Theo dõi tồn kho theo thời gian</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <Download className="h-4 w-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Inventory Chart Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <CardTitle className="text-base font-medium">Tồn kho</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                tuần này <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Tháng này</DropdownMenuItem>
              <DropdownMenuItem>Năm nay</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-[400px] w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={inventoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis hide={true} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border rounded shadow-sm">
                            <p className="text-xs">{`${payload[0].value}K sản phẩm`}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

