"use client"

import { useState, useEffect, useRef } from "react"
import {
  Download,
  Eye,
  ChevronDown,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { getInventoryReport } from "../../services/DashboardService"
import { getAreaDropdown } from "../../services/AreaServices"
import Loading from "../../components/Common/Loading"
import Pagination from "../../components/Common/Pagination"
import { Badge } from "../../components/ui/badge"
import InventorySearchFilter from "../../components/Common/InventorySearchFilter"
import InventoryDetailModal from "../../components/InventoryComponents/InventoryDetailModal"

// Donut Chart Component for Status Distribution
const StatusPieChart = ({ data }) => {
  const { expired, expiringSoon, valid } = data
  const total = expired + expiringSoon + valid

  if (total === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Không có dữ liệu
      </div>
    )
  }

  const size = 240
  const outerRadius = 90
  const innerRadius = 60
  const centerX = size / 2
  const centerY = size / 2

  // Calculate angles
  const expiredAngle = (expired / total) * 360
  const expiringSoonAngle = (expiringSoon / total) * 360
  const validAngle = (valid / total) * 360

  const statusItems = [
    { angle: expiredAngle, color: "#ef4444", label: "Hết hạn", value: expired },
    { angle: expiringSoonAngle, color: "#f97316", label: "Sắp hết hạn", value: expiringSoon },
    { angle: validAngle, color: "#22c55e", label: "Còn hạn", value: valid }
  ]

  const createDonutArc = (startAngle, angle, color, index) => {
    if (angle === 0) return null

    const endAngle = startAngle + angle
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = centerX + outerRadius * Math.cos(startRad)
    const y1 = centerY + outerRadius * Math.sin(startRad)
    const x2 = centerX + outerRadius * Math.cos(endRad)
    const y2 = centerY + outerRadius * Math.sin(endRad)

    const x3 = centerX + innerRadius * Math.cos(endRad)
    const y3 = centerY + innerRadius * Math.sin(endRad)
    const x4 = centerX + innerRadius * Math.cos(startRad)
    const y4 = centerY + innerRadius * Math.sin(startRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    return (
      <path
        key={index}
        d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`}
        fill={color}
        stroke="white"
        strokeWidth="3"
        className="transition-all duration-500 ease-out hover:opacity-80"
      />
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <defs>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
            </filter>
          </defs>
          {statusItems.map((item, index) => {
            const startAngle = index === 0
              ? -90
              : statusItems.slice(0, index).reduce((sum, i) => sum + i.angle, -90)
            return createDonutArc(startAngle, item.angle, item.color, index)
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-700">{total}</div>
            <div className="text-sm text-slate-500 mt-1">Tổng số lô</div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-4 w-full flex-wrap">
        {statusItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors min-w-[120px]">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-700">{item.value}</div>
              <div className="text-xs text-slate-500">
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Time Series Chart Component for Inventory Trend
const InventoryTrendChart = ({ data, timeRange }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Không có dữ liệu
      </div>
    )
  }

  // Group data by time period
  const groupDataByTime = () => {
    const grouped = new Map()

    data.forEach(item => {
      if (!item.expiryDate) return

      const date = new Date(item.expiryDate)
      let key = ""

      if (timeRange === "week") {
        // Group by day of week
        const dayOfWeek = date.getDay()
        const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
        key = dayNames[dayOfWeek]
      } else if (timeRange === "month") {
        // Group by week of month
        const weekOfMonth = Math.ceil(date.getDate() / 7)
        key = `Tuần ${weekOfMonth}`
      } else {
        // Group by month
        const month = date.getMonth() + 1
        key = `Tháng ${month}`
      }

      const quantity = item.totalPackageQuantity || 0
      if (grouped.has(key)) {
        grouped.set(key, grouped.get(key) + quantity)
      } else {
        grouped.set(key, quantity)
      }
    })

    // Create all periods for proper display
    let allPeriods = []
    if (timeRange === "week") {
      allPeriods = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    } else if (timeRange === "month") {
      allPeriods = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"]
    } else {
      allPeriods = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)
    }

    return allPeriods.map(label => ({
      label,
      quantity: grouped.get(label) || 0
    }))
  }

  const chartData = groupDataByTime()
  const maxQuantity = Math.max(...chartData.map(item => item.quantity), 1)
  const chartHeight = 250
  const chartWidth = 1000
  const padding = 60
  const barSpacing = 12

  return (
    <div className="w-full overflow-x-auto">
      <div className="relative" style={{ height: `${chartHeight}px`, minWidth: `${chartWidth}px` }}>
        <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          <defs>
            {/* Gradient for bars */}
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="1" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
            </linearGradient>
            {/* Shadow filter */}
            <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => {
            const yPos = padding + (chartHeight - padding * 2) / 4 * i
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={yPos}
                  x2={chartWidth - padding}
                  y2={yPos}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                {/* Y-axis labels */}
                <text
                  x={padding - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-xs fill-slate-500"
                >
                  {Math.round(maxQuantity - (maxQuantity / 4) * i).toLocaleString("vi-VN")}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {chartData.map((item, index) => {
            const availableWidth = chartWidth - padding * 2
            const barWidth = (availableWidth / chartData.length) - barSpacing
            const barHeight = ((item.quantity / maxQuantity) * (chartHeight - padding * 2 - 30))
            const xPosition = padding + (index * (availableWidth / chartData.length)) + barSpacing / 2
            const yPosition = chartHeight - padding - barHeight - 10

            return (
              <g key={index}>
                <rect
                  x={xPosition}
                  y={chartHeight - padding - 10}
                  width={barWidth}
                  height="0"
                  fill="url(#barGradient)"
                  rx="6"
                  filter="url(#barShadow)"
                  className="transition-all duration-500 ease-out hover:opacity-90 cursor-pointer"
                >
                  <animate
                    attributeName="height"
                    from="0"
                    to={barHeight}
                    dur="0.6s"
                    begin={`${index * 0.1}s`}
                    fill="freeze"
                  />
                  <animate
                    attributeName="y"
                    from={chartHeight - padding - 10}
                    to={yPosition}
                    dur="0.6s"
                    begin={`${index * 0.1}s`}
                    fill="freeze"
                  />
                </rect>
                {/* Value label on top */}
                {item.quantity > 0 && (
                  <text
                    x={xPosition + barWidth / 2}
                    y={yPosition - 8}
                    textAnchor="middle"
                    className="text-xs font-bold fill-slate-700"
                  >
                    {item.quantity >= 1000 ? (item.quantity / 1000).toFixed(1) + "k" : item.quantity.toLocaleString("vi-VN")}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-start mt-4" style={{ minWidth: `${chartWidth}px`, paddingLeft: `${padding}px`, paddingRight: `${padding}px` }}>
        {chartData.map((item, index) => {
          const availableWidth = chartWidth - padding * 2
          const labelWidth = availableWidth / chartData.length
          return (
            <div
              key={index}
              className="text-xs font-medium text-slate-600 text-center"
              style={{ width: `${labelWidth}px` }}
            >
              {item.label}
            </div>
          )
        })}
      </div>

      {/* Legend and Summary */}
      <div className="mt-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-b from-orange-500 to-orange-600"></div>
            <span className="text-sm text-slate-600">Số lượng tồn kho (thùng)</span>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          Tổng: <span className="font-semibold text-slate-700">
            {chartData.reduce((sum, item) => sum + item.quantity, 0).toLocaleString("vi-VN")} thùng
          </span>
        </div>
      </div>
    </div>
  )
}

// Bar Chart Component for Top Products
const TopProductsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Không có dữ liệu
      </div>
    )
  }

  const maxQuantity = Math.max(...data.map(item => item.quantity))

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = maxQuantity > 0 ? (item.quantity / maxQuantity) * 100 : 0
        const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]
        const color = colors[index % colors.length]

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700 font-medium truncate flex-1 mr-2">
                {item.name.length > 30 ? `${item.name.substring(0, 30)}...` : item.name}
              </span>
              <span className="text-slate-600 font-semibold whitespace-nowrap">
                {item.quantity.toLocaleString("vi-VN")} thùng
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function InventoryReport({ onClose }) {
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [areaId, setAreaId] = useState("")
  const [areas, setAreas] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [timeRange, setTimeRange] = useState("week") // week, month, year
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const searchTimeoutRef = useRef(null)
  const [sortField, setSortField] = useState("batchCode")
  const [sortAscending, setSortAscending] = useState(true)

  // Fetch areas for dropdown
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await getAreaDropdown()
        let areasList = []
        if (Array.isArray(response)) {
          areasList = response
        } else if (response?.data) {
          areasList = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        } else if (response?.items) {
          areasList = response.items
        }
        setAreas(areasList)
      } catch (error) {
        console.error("Error fetching areas:", error)
        setAreas([])
      }
    }
    fetchAreas()
  }, [])

  // Initial load on component mount
  useEffect(() => {
    fetchInventoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch data when search or filters change (with debounce for search)
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Reset to page 1 when search or filters change
    setPagination(prev => ({ ...prev, current: 1 }))

    const fetchData = () => {
      fetchInventoryData()
    }

    // Debounce search queries (500ms), immediate for other changes
    if (searchQuery && searchQuery.trim() !== "") {
      searchTimeoutRef.current = setTimeout(fetchData, 500)
    } else {
      // Immediate fetch for empty search, timeRange, areaId changes
      fetchData()
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, timeRange, areaId])

  // Fetch data when pagination changes
  useEffect(() => {
    fetchInventoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize])

  // Fetch data when sort changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }))
    fetchInventoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortAscending])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)

      // Build filters object - include timeRange (areaId is passed as query parameter, not in filters)
      const filters = {}
      if (timeRange) {
        filters.timeRange = timeRange
      }

      const requestParams = {
        areaId: areaId ? parseInt(areaId) : undefined, // Convert to integer for query parameter
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        search: searchQuery || "",
        sortField: sortField,
        sortAscending: sortAscending,
        filters
      }


      const response = await getInventoryReport(requestParams)

      if (response && response.items) {
        // Handle response with items array (even if empty)
        const itemsArray = Array.isArray(response.items) ? response.items : []
        setInventoryData(itemsArray)
        setPagination(prev => ({
          ...prev,
          total: response.totalCount || itemsArray.length || 0
        }))
      } else if (response && Array.isArray(response)) {
        // Handle case where response is directly an array
        setInventoryData(response)
        setPagination(prev => ({
          ...prev,
          total: response.length || 0
        }))
      } else {
        setInventoryData([])
        setPagination(prev => ({ ...prev, total: 0 }))
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setInventoryData([])
      setPagination(prev => ({ ...prev, total: 0 }))
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }))
  }

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ ...prev, pageSize: size, current: 1 }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    return expiry < today
  }

  const isExpiringSoon = (expiryDate, daysThreshold = 30) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    // Sắp hết hạn: còn từ 0 đến daysThreshold ngày (và chưa hết hạn)
    return diffDays >= 0 && diffDays <= daysThreshold
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export inventory report")
  }

  const handleViewClick = (item) => {
    setSelectedItem(item)
    setIsDetailModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setSelectedItem(null)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle ascending/descending if same field
      setSortAscending(!sortAscending)
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortAscending(true)
    }
  }

  const handleClearAllFilters = () => {
    setSearchQuery("")
    setTimeRange("week")
    setAreaId("")
    setSortField("batchCode")
    setSortAscending(true)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  // Calculate chart data from inventory data
  const calculateChartData = () => {
    if (!inventoryData || inventoryData.length === 0) {
      return {
        statusData: { expired: 0, expiringSoon: 0, valid: 0 },
        topProducts: [],
        totalQuantity: 0
      }
    }

    // Status distribution
    let expired = 0
    let expiringSoon = 0
    let valid = 0

    // Product quantity aggregation
    const productMap = new Map()

    inventoryData.forEach(item => {
      // Count status
      if (isExpired(item.expiryDate)) {
        expired++
      } else if (isExpiringSoon(item.expiryDate, 30)) {
        expiringSoon++
      } else {
        valid++
      }

      // Aggregate by product
      const productKey = item.goodName || item.goodsCode || "Unknown"
      const quantity = item.totalPackageQuantity || 0
      if (productMap.has(productKey)) {
        productMap.set(productKey, productMap.get(productKey) + quantity)
      } else {
        productMap.set(productKey, quantity)
      }
    })

    // Get top 5 products
    const topProducts = Array.from(productMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    const totalQuantity = Array.from(productMap.values()).reduce((sum, qty) => sum + qty, 0)

    return {
      statusData: { expired, expiringSoon, valid },
      topProducts,
      totalQuantity
    }
  }

  const chartData = calculateChartData()

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Báo cáo tồn kho hiện tại</h1>
            <p className="text-slate-600 mt-1">Theo dõi tồn kho chi tiết hiện tại</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
            {onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white"
              >
                Đóng
              </Button>
            )}
          </div>
        </div>

        {/* Charts Section */}
        {!loading && inventoryData.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution Pie Chart */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Phân bố trạng thái</h3>
                <div className="flex items-center justify-center">
                  <StatusPieChart data={chartData.statusData} />
                </div>
              </div>

              {/* Top Products Bar Chart */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Top 5 sản phẩm tồn kho</h3>
                <TopProductsChart data={chartData.topProducts} />
              </div>
            </div>

            {/* Inventory Trend Chart */}
            {/* <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-700">
                  Xu hướng tồn kho
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      {timeRange === "week" ? "Theo tuần" : timeRange === "month" ? "Theo tháng" : "Theo năm"}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTimeRange("week")}>
                      Theo tuần
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeRange("month")}>
                      Theo tháng
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeRange("year")}>
                      Theo năm
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <InventoryTrendChart data={inventoryData} timeRange={timeRange} />
            </div> */}
          </>
        )}

        {/* Inventory Table */}
        <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <InventorySearchFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo mã lô, tên sản phẩm..."
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            // timeRangeOptions={[
            //   { value: "week", label: "Tuần này" },
            //   { value: "month", label: "Tháng này" },
            //   { value: "year", label: "Năm nay" }
            // ]}
            areaId={areaId}
            setAreaId={setAreaId}
            areas={areas}
            onClearAll={handleClearAllFilters}
            showClearButton={true}
            showToggle={true}
            defaultOpen={true}
            searchWidth="w-80"
          />
          <div className="w-full">
            {loading ? (
              <div className="p-8">
                <Loading />
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-16">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Mã sản phẩm
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Tên sản phẩm
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        Đơn vị/thùng
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        Đơn vị
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Mã lô
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("manufacturingDate")}>
                          <span>Ngày sản xuất</span>
                          {sortField === "manufacturingDate" ? (
                            sortAscending ? (
                              <ArrowUp className="h-4 w-4 text-orange-500" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-orange-500" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("expiryDate")}>
                          <span>Ngày hết hạn</span>
                          {sortField === "expiryDate" ? (
                            sortAscending ? (
                              <ArrowUp className="h-4 w-4 text-orange-500" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-orange-500" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("totalPackageQuantity")}>
                          <span>Số lượng thùng</span>
                          {sortField === "totalPackageQuantity" ? (
                            sortAscending ? (
                              <ArrowUp className="h-4 w-4 text-orange-500" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-orange-500" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        Trạng thái
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                        Hoạt động
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center text-gray-500 py-8">
                          Không có dữ liệu tồn kho
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventoryData.map((item, index) => {
                        const rowNumber = (pagination.current - 1) * pagination.pageSize + index + 1
                        const expired = isExpired(item.expiryDate)
                        const expiringSoon = isExpiringSoon(item.expiryDate, 30) // Cảnh báo trong 30 ngày

                        return (
                          <TableRow
                            key={item.batchId || index}
                            className="hover:bg-slate-50 border-b border-slate-200"
                          >
                            <TableCell className="px-6 py-4 text-slate-600 font-medium">
                              {rowNumber}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700 font-medium">
                              {item.goodsCode || "-"}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700">
                              {item.goodName || "-"}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700 text-center font-medium">
                              {item.unitPerPackage || "-"}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700 text-center font-medium">
                              {item.unitOfMeasure || "-"}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700 font-medium">
                              {item.batchCode || "-"}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700">
                              {formatDate(item.manufacturingDate)}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700">
                              {formatDate(item.expiryDate)}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700 text-right font-medium">
                              {item.totalPackageQuantity?.toLocaleString("vi-VN") || 0}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center">
                              {expired ? (
                                <Badge variant="destructive" className="text-xs bg-red-500 text-white">
                                  Hết hạn
                                </Badge>
                              ) : expiringSoon ? (
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                                  Sắp hết hạn
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  Còn hạn
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Xem chi tiết"
                                  onClick={() => handleViewClick(item)}
                                >
                                  <Eye className="h-4 w-4 text-orange-500" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          {!loading && pagination.total > 0 && (
            <div className="bg-gray-50 border-t border-slate-200 p-4">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showPageSize={true}
                pageSizeOptions={[10, 20, 30, 50]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Inventory Detail Modal */}
      <InventoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        item={selectedItem}
      />
    </div>
  )
}
