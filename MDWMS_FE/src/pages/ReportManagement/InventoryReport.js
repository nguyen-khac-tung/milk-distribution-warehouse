"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Eye,
  ChevronDown,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Building2,
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
import { getInventoryReport, getInventoryLedgerReport } from "../../services/DashboardService"
import { getSuppliersDropdown } from "../../services/SupplierService"
import Loading from "../../components/Common/Loading"
import Pagination from "../../components/Common/Pagination"
import EmptyState from "../../components/Common/EmptyState"
import { Badge } from "../../components/ui/badge"
import InventorySearchFilter from "../../components/Common/InventorySearchFilter"
import InventoryDetailModal from "../../components/InventoryComponents/InventoryDetailModal"
import ExportInventoryReport from "../../components/InventoryComponents/ExportInventoryReport"

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

    // Handle full circle (360 degrees) - draw complete donut
    if (angle >= 359.9) {
      return (
        <g key={index}>
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill={color}
            stroke="white"
            strokeWidth="3"
            className="transition-all duration-500 ease-out hover:opacity-80"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="white"
            className="transition-all duration-500 ease-out hover:opacity-80"
          />
        </g>
      )
    }

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
  // Report type: "current" (tồn kho hiện tại) or "period" (tồn kho theo kỳ)
  const [reportType, setReportType] = useState("current")

  // Normalize function: lowercase, trim, and collapse multiple spaces into one
  const normalize = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // gom nhiều space thành 1 space
  };

  // Data states - store all raw data from API
  const [allInventoryData, setAllInventoryData] = useState([])
  const [allLedgerData, setAllLedgerData] = useState([])
  // Filtered and sorted data for display
  const [inventoryData, setInventoryData] = useState([])
  const [ledgerData, setLedgerData] = useState([])

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  // Supplier filter
  const [supplierFilter, setSupplierFilter] = useState("")
  const [showSupplierFilter, setShowSupplierFilter] = useState(false)
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")
  const [suppliers, setSuppliers] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [timeRange, setTimeRange] = useState("week") // week, month, year
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const searchTimeoutRef = useRef(null)
  const [sortField, setSortField] = useState("") // No default sort
  const [sortAscending, setSortAscending] = useState(true)

  // Date range for period report
  const [dateRange, setDateRange] = useState({
    fromDate: "",
    toDate: ""
  })

  // Filters for current inventory report
  const [quantityRange, setQuantityRange] = useState({
    value: "",
    type: "", // "below" or "above"
    min: "",
    max: ""
  })
  const [remainingDaysRange, setRemainingDaysRange] = useState({
    value: "",
    type: "", // "below" or "above"
    min: "",
    max: ""
  })
  const [statusFilter, setStatusFilter] = useState("") // "expired", "expiringSoon", "valid", ""

  // Fetch suppliers for dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await getSuppliersDropdown()
        let suppliersList = []
        if (Array.isArray(response)) {
          suppliersList = response
        } else if (response?.data && Array.isArray(response.data)) {
          suppliersList = response.data
        } else if (response?.items && Array.isArray(response.items)) {
          suppliersList = response.items
        }
        setSuppliers(suppliersList)
      } catch (error) {
        console.error("Error fetching suppliers:", error)
        setSuppliers([])
      }
    }
    fetchSuppliers()
  }, [])

  // Helper function to get default date range (first day of month to today)
  const getDefaultDateRange = () => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Format as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      fromDate: formatDate(firstDayOfMonth),
      toDate: formatDate(today)
    }
  }

  // Initial load on component mount
  useEffect(() => {
    // Set default date range for period report on mount
    if (reportType === "period" && !dateRange.fromDate && !dateRange.toDate) {
      setDateRange(getDefaultDateRange())
    }

    if (reportType === "current") {
      fetchInventoryData()
    } else {
      fetchLedgerData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch data when report type, timeRange, or date range changes (refetch from backend)
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }))
    if (reportType === "current") {
      fetchInventoryData()
    } else {
      fetchLedgerData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, timeRange, dateRange.fromDate, dateRange.toDate])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)

      // Build filters object - include timeRange
      const filters = {}
      if (timeRange) {
        filters.timeRange = timeRange
      }

      // Fetch all data with pagination to get all pages
      let allItems = []
      let page = 1
      let hasMore = true
      const pageSize = 1000

      while (hasMore) {
        const requestParams = {
          pageNumber: page,
          pageSize: pageSize,
          filters
        }

        const response = await getInventoryReport(requestParams)

        let itemsArray = []
        if (response && response.items) {
          itemsArray = Array.isArray(response.items) ? response.items : []
        } else if (response && Array.isArray(response)) {
          itemsArray = response
        }

        allItems = [...allItems, ...itemsArray]

        // Check if there are more pages
        const totalCount = response?.totalCount || 0
        if (itemsArray.length === 0 || itemsArray.length < pageSize) {
          hasMore = false
        } else if (totalCount > 0) {
          hasMore = (page * pageSize) < totalCount
        } else {
          hasMore = itemsArray.length >= pageSize
        }
        page++
      }

      setAllInventoryData(allItems)
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setAllInventoryData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLedgerData = async () => {
    try {
      setLoading(true)

      // Format dates for API (ISO 8601 format) - required for period report
      const fromDate = dateRange.fromDate ? new Date(dateRange.fromDate).toISOString() : ""
      const toDate = dateRange.toDate ? new Date(dateRange.toDate + "T23:59:59").toISOString() : ""

      // Build filters
      const filters = {}

      // Fetch all data with pagination to get all pages
      let allItems = []
      let page = 1
      let hasMore = true
      const pageSize = 1000

      while (hasMore) {
        const requestParams = {
          fromDate: fromDate,
          toDate: toDate,
          pageNumber: page,
          pageSize: pageSize,
          filters: filters
        }

        const response = await getInventoryLedgerReport(requestParams)

        let itemsArray = []
        if (response && response.items) {
          itemsArray = Array.isArray(response.items) ? response.items : []
        } else if (response && Array.isArray(response)) {
          itemsArray = response
        }

        allItems = [...allItems, ...itemsArray]

        // Check if there are more pages
        const totalCount = response?.totalCount || 0
        if (itemsArray.length === 0 || itemsArray.length < pageSize) {
          hasMore = false
        } else if (totalCount > 0) {
          hasMore = (page * pageSize) < totalCount
        } else {
          hasMore = itemsArray.length >= pageSize
        }
        page++
      }

      setAllLedgerData(allItems)
    } catch (error) {
      console.error("Error fetching ledger data:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setAllLedgerData([])
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
    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)
    // Hết hạn: ngày hết hạn <= ngày hôm nay (bao gồm cả hôm nay)
    return expiry <= today
  }

  const isExpiringSoon = (expiryDate, daysThreshold = 30) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    // Reset time to start of day for accurate calculation
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    // Sắp hết hạn: còn từ 1 đến daysThreshold ngày (chưa hết hạn và chưa đến ngày hết hạn)
    // Nếu hôm nay là ngày hết hạn (diffDays = 0) thì coi là hết hạn, không phải sắp hết hạn
    return diffDays > 0 && diffDays <= daysThreshold
  }

  // Calculate remaining days until expiry
  const getRemainingDays = (expiryDate) => {
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get status tooltip text
  const getStatusTooltip = (expiryDate) => {
    if (!expiryDate) return "Không có thông tin ngày hết hạn"
    const remainingDays = getRemainingDays(expiryDate)

    if (remainingDays < 0) {
      return `Sản phẩm đã hết hạn ${Math.abs(remainingDays)} ngày`
    } else if (remainingDays === 0) {
      return "Sản phẩm hết hạn hôm nay"
    } else {
      return `Sản phẩm còn ${remainingDays} ngày nữa sẽ hết hạn`
    }
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

  // Filter and sort data on frontend
  useEffect(() => {
    const sourceData = reportType === "current" ? allInventoryData : allLedgerData

    let filtered = [...sourceData]

    // Filter by search query
    const normalizedSearchQuery = normalize(searchQuery);
    if (normalizedSearchQuery) {
      filtered = filtered.filter(item => {
        const goodsCode = normalize(item.goodsCode || "")
        const goodsName = normalize(item.goodName || item.goodsName || "")
        const batchCode = normalize(item.batchCode || "")
        return goodsCode.includes(normalizedSearchQuery) ||
          goodsName.includes(normalizedSearchQuery) ||
          batchCode.includes(normalizedSearchQuery)
      })
    }

    // Filter by supplier (if supplierId exists in data)
    if (supplierFilter) {
      filtered = filtered.filter(item =>
        item.supplierId && item.supplierId.toString() === supplierFilter.toString()
      )
    }

    // Additional filters for current inventory report only
    if (reportType === "current") {
      // Filter by quantity range (số lượng thùng)
      if (quantityRange.value) {
        filtered = filtered.filter(item => {
          const quantity = item.totalPackageQuantity || 0
          const value = parseFloat(quantityRange.value)
          if (quantityRange.type === "below") {
            // Filter từ 1 đến value (dưới hoặc bằng value)
            return quantity >= 1 && quantity <= value
          } else if (quantityRange.type === "above") {
            // Filter từ value trở lên (trên hoặc bằng value)
            return quantity >= value
          }
          return true
        })
      } else if (quantityRange.min || quantityRange.max) {
        // Fallback cho trường hợp dùng min/max trực tiếp (tương thích ngược)
        filtered = filtered.filter(item => {
          const quantity = item.totalPackageQuantity || 0
          const min = quantityRange.min ? parseFloat(quantityRange.min) : 0
          const max = quantityRange.max ? parseFloat(quantityRange.max) : Infinity
          return quantity >= min && quantity <= max
        })
      }

      // Filter by remaining days range (hạn sử dụng còn bao nhiêu ngày)
      if (remainingDaysRange.value !== undefined && remainingDaysRange.value !== "") {
        filtered = filtered.filter(item => {
          const remainingDays = getRemainingDays(item.expiryDate)
          if (remainingDays === null) return false
          const value = parseFloat(remainingDaysRange.value)
          if (remainingDaysRange.type === "below") {
            // Filter dưới hoặc bằng value (có thể là số âm nếu đã hết hạn)
            return remainingDays <= value
          } else if (remainingDaysRange.type === "above") {
            // Filter trên hoặc bằng value
            return remainingDays >= value
          }
          return true
        })
      } else if (remainingDaysRange.min !== "" || remainingDaysRange.max !== "") {
        // Fallback cho trường hợp dùng min/max trực tiếp (tương thích ngược)
        filtered = filtered.filter(item => {
          const remainingDays = getRemainingDays(item.expiryDate)
          if (remainingDays === null) return false
          const min = remainingDaysRange.min !== "" ? parseFloat(remainingDaysRange.min) : -Infinity
          const max = remainingDaysRange.max !== "" ? parseFloat(remainingDaysRange.max) : Infinity
          return remainingDays >= min && remainingDays <= max
        })
      }

      // Filter by status (trạng thái)
      if (statusFilter) {
        filtered = filtered.filter(item => {
          if (statusFilter === "expired") {
            return isExpired(item.expiryDate)
          } else if (statusFilter === "expiringSoon") {
            return isExpiringSoon(item.expiryDate, 30)
          } else if (statusFilter === "valid") {
            return !isExpired(item.expiryDate) && !isExpiringSoon(item.expiryDate, 30)
          }
          return true
        })
      }
    }

    // Sort data
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue

        if (sortField === "goodsCode") {
          aValue = (a.goodsCode || "").toLowerCase()
          bValue = (b.goodsCode || "").toLowerCase()
        } else if (sortField === "goodsName") {
          aValue = (a.goodName || a.goodsName || "").toLowerCase()
          bValue = (b.goodName || b.goodsName || "").toLowerCase()
        } else if (sortField === "totalPackageQuantity") {
          aValue = a.totalPackageQuantity || 0
          bValue = b.totalPackageQuantity || 0
        } else if (sortField === "manufacturingDate") {
          aValue = a.manufacturingDate ? new Date(a.manufacturingDate).getTime() : 0
          bValue = b.manufacturingDate ? new Date(b.manufacturingDate).getTime() : 0
        } else if (sortField === "expiryDate") {
          aValue = a.expiryDate ? new Date(a.expiryDate).getTime() : 0
          bValue = b.expiryDate ? new Date(b.expiryDate).getTime() : 0
        } else if (sortField === "beginningInventoryPackages") {
          aValue = a.beginningInventoryPackages || 0
          bValue = b.beginningInventoryPackages || 0
        } else if (sortField === "inQuantityPackages") {
          aValue = a.inQuantityPackages || 0
          bValue = b.inQuantityPackages || 0
        } else if (sortField === "outQuantityPackages") {
          aValue = a.outQuantityPackages || 0
          bValue = b.outQuantityPackages || 0
        } else if (sortField === "stocktakingChangesPackages") {
          aValue = a.stocktakingChangesPackages || 0
          bValue = b.stocktakingChangesPackages || 0
        } else if (sortField === "endingInventoryPackages") {
          aValue = a.endingInventoryPackages || 0
          bValue = b.endingInventoryPackages || 0
        } else {
          aValue = a[sortField] || ""
          bValue = b[sortField] || ""
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortAscending
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        } else {
          return sortAscending
            ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0)
            : (aValue < bValue ? 1 : aValue > bValue ? -1 : 0)
        }
      })
    }

    // Update total count
    setPagination(prev => ({ ...prev, total: filtered.length }))

    // Apply pagination
    const startIndex = (pagination.current - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    const paginatedData = filtered.slice(startIndex, endIndex)

    if (reportType === "current") {
      setInventoryData(paginatedData)
    } else {
      setLedgerData(paginatedData)
    }
  }, [
    reportType,
    allInventoryData,
    allLedgerData,
    searchQuery,
    supplierFilter,
    quantityRange.value,
    quantityRange.type,
    quantityRange.min,
    quantityRange.max,
    remainingDaysRange.value,
    remainingDaysRange.type,
    remainingDaysRange.min,
    remainingDaysRange.max,
    statusFilter,
    sortField,
    sortAscending,
    pagination.current,
    pagination.pageSize
  ])

  // Reset pagination to page 1 when filters or sort change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }))
  }, [searchQuery, supplierFilter, quantityRange.value, quantityRange.type, quantityRange.min, quantityRange.max, remainingDaysRange.value, remainingDaysRange.type, remainingDaysRange.min, remainingDaysRange.max, statusFilter, sortField])

  // Close supplier filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSupplierFilter && !event.target.closest('.supplier-filter-dropdown')) {
        setShowSupplierFilter(false)
        setSupplierSearchTerm("")
      }
    }

    if (showSupplierFilter) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSupplierFilter])

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = normalize(supplierSearchTerm);
    if (!normalizedSearch) {
      return suppliers
    }
    return suppliers.filter(supplier =>
      normalize(supplier.companyName || '').includes(normalizedSearch)
    )
  }, [suppliers, supplierSearchTerm])

  const handleClearAllFilters = () => {
    setSearchQuery("")
    setTimeRange("week")
    setSupplierFilter("")
    setQuantityRange({ value: "", type: "", min: "", max: "" })
    setRemainingDaysRange({ value: "", type: "", min: "", max: "" })
    setStatusFilter("")
    setSortField("") // Reset to no sort
    setSortAscending(true)
    setDateRange({ fromDate: "", toDate: "" })
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleReportTypeChange = (type) => {
    setReportType(type)
    setPagination(prev => ({ ...prev, current: 1 }))
    // Reset date range when switching to current report
    if (type === "current") {
      setDateRange({ fromDate: "", toDate: "" })
    } else {
      // Set default date range (first day of month to today) when switching to period report
      setDateRange(getDefaultDateRange())
      // Clear ledger data when switching to period report to force fresh fetch
      setAllLedgerData([])
      setLedgerData([])
    }
    // Reset sort and filters when switching report type
    setSortField("")
    setSortAscending(true)
    setSupplierFilter("")
    setQuantityRange({ value: "", type: "", min: "", max: "" })
    setRemainingDaysRange({ value: "", type: "", min: "", max: "" })
    setStatusFilter("")
  }

  // Calculate chart data from ORIGINAL data (not filtered) - charts are independent of filters
  const calculateChartData = () => {
    // Use original data, not filtered data - charts show all data regardless of filters
    const dataToUse = reportType === "current" ? allInventoryData : allLedgerData
    if (!dataToUse || dataToUse.length === 0) {
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

    dataToUse.forEach(item => {
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

    // Count unique products (for total display)
    const uniqueProductsCount = productMap.size

    return {
      statusData: { expired, expiringSoon, valid },
      topProducts,
      totalQuantity,
      uniqueProductsCount
    }
  }

  const chartData = calculateChartData()
  const displayData = reportType === "current" ? inventoryData : ledgerData

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">
              {reportType === "current" ? "Báo cáo tồn kho hiện tại" : "Báo cáo tồn kho theo kỳ"}
            </h1>
            <p className="text-slate-600 mt-1">
              {reportType === "current"
                ? "Theo dõi tồn kho chi tiết hiện tại"
                : "Theo dõi tồn kho theo khoảng thời gian"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportInventoryReport
              reportType={reportType}
              searchQuery={searchQuery}
              timeRange={reportType === "current" ? timeRange : undefined}
              dateRange={reportType === "period" ? dateRange : undefined}
              sortField={sortField}
              sortAscending={sortAscending}
            />
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

        {/* Report Type Toggle */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Loại báo cáo:</span>
            <div className="flex gap-2">
              <Button
                variant={reportType === "current" ? "default" : "outline"}
                onClick={() => handleReportTypeChange("current")}
                className={`h-9 px-4 ${reportType === "current"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                Tồn kho hiện tại
              </Button>
              <Button
                variant={reportType === "period" ? "default" : "outline"}
                onClick={() => handleReportTypeChange("period")}
                className={`h-9 px-4 ${reportType === "period"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                Tồn kho theo kỳ
              </Button>
            </div>
          </div>

          {/* Date Range Picker for Period Report */}
          {reportType === "period" && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Từ ngày:</label>
                <input
                  type="date"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Đến ngày:</label>
                <input
                  type="date"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
                  min={dateRange.fromDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              {(dateRange.fromDate || dateRange.toDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange({ fromDate: "", toDate: "" })
                    setPagination(prev => ({ ...prev, current: 1 }))
                  }}
                  className="h-9 text-sm"
                >
                  Xóa lọc ngày
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Charts Section - Always show when there's original data, regardless of filters */}
        {!loading && reportType === "current" && allInventoryData.length > 0 && (
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
                <h3 className="text-lg font-semibold text-slate-700 mb-4">5 hàng hóa tồn kho</h3>
                <TopProductsChart data={chartData.topProducts} />
                {/* Total Products Summary - At bottom of chart card */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="text-center">
                    <div className="text-center text-gray-500 font-semibold py-2">
                      Tổng số hàng hóa tồn kho hiện tại
                    </div>
                    <div className="text-3xl font-semibold text-orange-500">
                      {chartData.uniqueProductsCount.toLocaleString("vi-VN")}
                    </div>
                    <div className="text-center text-gray-500 font-semibold py-2">hàng hóa</div>
                  </div>
                </div>
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
            searchPlaceholder={reportType === "current" ? "Tìm kiếm theo mã lô, tên hàng hóa..." : "Tìm kiếm theo mã hàng hóa, tên hàng hóa..."}
            timeRange={reportType === "current" ? timeRange : undefined}
            setTimeRange={reportType === "current" ? setTimeRange : undefined}
            onClearAll={handleClearAllFilters}
            showClearButton={true}
            showToggle={true}
            defaultOpen={true}
            searchWidth="w-80"
            supplierFilter={supplierFilter}
            setSupplierFilter={setSupplierFilter}
            showSupplierFilter={showSupplierFilter}
            setShowSupplierFilter={setShowSupplierFilter}
            supplierSearchTerm={supplierSearchTerm}
            setSupplierSearchTerm={setSupplierSearchTerm}
            suppliers={suppliers}
            filteredSuppliers={filteredSuppliers}
            reportType={reportType}
            quantityRange={quantityRange}
            setQuantityRange={setQuantityRange}
            remainingDaysRange={remainingDaysRange}
            setRemainingDaysRange={setRemainingDaysRange}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-8">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[140px]">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("goodsCode")}>
                          <span>Mã hàng hóa</span>
                          {sortField === "goodsCode" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("goodsName")}>
                          <span>Tên hàng hóa</span>
                          {sortField === "goodsName" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                        Đơn vị /thùng
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[100px]">
                        Đơn vị
                      </TableHead>
                      {reportType === "current" ? (
                        <>
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                            Mã lô
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[130px]">
                            <div className="flex items-center justify-center space-x-1 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("manufacturingDate")}>
                              <div className="flex flex-col items-center">
                                <span>Ngày</span>
                                <span>sản xuất</span>
                              </div>
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
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[130px]">
                            <div className="flex items-center justify-center space-x-1 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("expiryDate")}>
                              <div className="flex flex-col items-center">
                                <span>Ngày</span>
                                <span>hết hạn</span>
                              </div>
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
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("totalPackageQuantity")}>
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
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                            Trạng thái
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-20">
                            Hoạt động
                          </TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-24">
                            <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("beginningInventoryPackages")}>
                              <span>Tồn đầu kỳ</span>
                              {sortField === "beginningInventoryPackages" ? (
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
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-28">
                            <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("inQuantityPackages")}>
                              <span>Nhập trong kỳ</span>
                              {sortField === "inQuantityPackages" ? (
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
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-28">
                            <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("outQuantityPackages")}>
                              <span>Xuất trong kỳ</span>
                              {sortField === "outQuantityPackages" ? (
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
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-[120px]">
                            <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("stocktakingChangesPackages")}>
                              <span>Chênh lệch kiểm kê</span>
                              {sortField === "stocktakingChangesPackages" ? (
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
                          <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-24">
                            <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("endingInventoryPackages")}>
                              <span>Tồn cuối kỳ</span>
                              {sortField === "endingInventoryPackages" ? (
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
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.length === 0 ? (
                      <EmptyState
                        icon={Building2}
                        title="Không tìm thấy dữ liệu tồn kho"
                        description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                        colSpan={reportType === "current" ? 13 : 8}
                      />
                    ) : (
                      displayData.map((item, index) => {
                        const rowNumber = (pagination.current - 1) * pagination.pageSize + index + 1

                        if (reportType === "current") {
                          const expired = isExpired(item.expiryDate)
                          const expiringSoon = isExpiringSoon(item.expiryDate, 30) // Cảnh báo trong 30 ngày

                          // Create unique key by combining batchId, goodsId, manufacturingDate, expiryDate, and index
                          // This ensures uniqueness even if multiple items share the same batchId
                          const uniqueKey = item.batchId && item.goodsId && item.manufacturingDate && item.expiryDate
                            ? `current-${item.batchId}-${item.goodsId}-${item.manufacturingDate}-${item.expiryDate}-${index}`
                            : item.batchId && item.goodsId
                              ? `current-${item.batchId}-${item.goodsId}-${index}`
                              : item.batchId
                                ? `current-${item.batchId}-${index}`
                                : item.goodsId
                                  ? `current-${item.goodsId}-${rowNumber}-${index}`
                                  : `current-${rowNumber}-${index}`

                          return (
                            <TableRow
                              key={uniqueKey}
                              className="hover:bg-slate-50 border-b border-slate-200"
                            >
                              <TableCell className="px-2 py-4 text-center text-slate-600">
                                {rowNumber}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700 font-medium">
                                {item.goodsCode || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700 font-medium">
                                {item.goodName || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {item.unitPerPackage || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {item.unitOfMeasure || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {item.batchCode || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {formatDate(item.manufacturingDate)}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {formatDate(item.expiryDate)}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {item.totalPackageQuantity?.toLocaleString("vi-VN") || 0}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center">
                                {expired ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs bg-red-500 text-white cursor-help"
                                    title={getStatusTooltip(item.expiryDate)}
                                  >
                                    Hết hạn
                                  </Badge>
                                ) : expiringSoon ? (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-orange-100 text-orange-700 border-orange-300 cursor-help"
                                    title={getStatusTooltip(item.expiryDate)}
                                  >
                                    Sắp hết hạn
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 cursor-help"
                                    title={getStatusTooltip(item.expiryDate)}
                                  >
                                    Còn hạn
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center">
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
                        } else {
                          // Period report row
                          // Create unique key by combining goodsId, goodPackingId, and index
                          const uniqueKey = item.goodsId && item.goodPackingId
                            ? `period-${item.goodsId}-${item.goodPackingId}-${index}`
                            : item.goodsId
                              ? `period-${item.goodsId}-${index}`
                              : item.goodPackingId
                                ? `period-${item.goodPackingId}-${index}`
                                : `period-${rowNumber}-${index}`

                          return (
                            <TableRow
                              key={uniqueKey}
                              className="hover:bg-slate-50 border-b border-slate-200"
                            >
                              <TableCell className="px-2 py-4 text-center text-slate-600">
                                {rowNumber}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700 font-medium">
                                {item.goodsCode || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700 font-medium">
                                {item.goodsName || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {item.unitPerPackage || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {item.unitOfMeasure || "-"}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {(item.beginningInventoryPackages || 0).toLocaleString("vi-VN")}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {(item.inQuantityPackages || 0).toLocaleString("vi-VN")}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {(item.outQuantityPackages || 0).toLocaleString("vi-VN")}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {(item.stocktakingChangesPackages || 0).toLocaleString("vi-VN")}
                              </TableCell>
                              <TableCell className="px-2 py-4 text-center text-slate-700">
                                {(item.endingInventoryPackages || 0).toLocaleString("vi-VN")}
                              </TableCell>
                            </TableRow>
                          )
                        }
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
                onPageChange={handlePageChange}
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
