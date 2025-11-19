"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  BarChart,
  Search,
  Plus,
  Trash,
  ChevronDown,
  Bell,
  Home,
  CalendarIcon,
  MessageSquare,
  Star,
  Award,
  CreditCard,
  Utensils,
  ShoppingBag,
  Truck,
  Clock,
  DollarSign,
  Filter,
  Download,
  Printer,
  MoreHorizontal,
  Menu,
  TrendingUp,
  Package,
  ShoppingCart,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "../../components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu"
import { Progress } from "../../components/ui/progress"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Checkbox } from "../../components/ui/checkbox"
import { Textarea } from "../../components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
// import { useToast } from "@/components/ui/use-toast"
import {
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

import { getLocationReport, getGoodsReceiptReport, getGoodsIssueReport, getInventoryReport } from "../../services/DashboardService"
import { getAreaDropdown } from "../../services/AreaServices"
import WarehouseEventCalendar from "./WarehouseEventCalendar"
import WarehousePerformance from "./WarehousePerformance"
import ExpiringProducts from "./ExpiringProducts"
import RecentActivities from "./RecentActivities"
import dayjs from "dayjs"

export default function Dashboard({ activeSection = "dashboard", onSectionChange }) {
  const navigate = useNavigate()
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [locationReport, setLocationReport] = useState({
    totalLocations: 0,
    availableLocationCount: 0,
    areaDetails: []
  })
  const [locationReportLoading, setLocationReportLoading] = useState(true)
  const [selectedAreaId, setSelectedAreaId] = useState(null)
  const [areas, setAreas] = useState([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [purchaseOrdersData, setPurchaseOrdersData] = useState([])
  const [salesOrdersData, setSalesOrdersData] = useState([])
  const [purchaseOrdersStats, setPurchaseOrdersStats] = useState({ current: 0, previous: 0, change: 0 })
  const [salesOrdersStats, setSalesOrdersStats] = useState({ current: 0, previous: 0, change: 0 })
  const [chartLoading, setChartLoading] = useState(false)
  const [inventoryStats, setInventoryStats] = useState({ current: 0, previous: 0, change: 0 })
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [activityStats, setActivityStats] = useState({ emptyAreas: 0, fullAreas: 0, products: 0 })
  const [activityLoading, setActivityLoading] = useState(false)
  // const { toast } = useToast()

  // Mock toast function
  const toast = ({ title, description, variant }) => {
    console.log(`${title}: ${description}`)
  }

  // Map day of week to Vietnamese
  const getDayNameVietnamese = (dayOfWeek) => {
    const dayNames = {
      0: "CN", // Chủ nhật
      1: "T2", // Thứ hai
      2: "T3", // Thứ ba
      3: "T4", // Thứ tư
      4: "T5", // Thứ năm
      5: "T6", // Thứ sáu
      6: "T7", // Thứ bảy
    }
    return dayNames[dayOfWeek] || ""
  }

  // Get current week days (Sunday to Saturday)
  const getCurrentWeekDays = () => {
    const today = dayjs()
    const currentDayOfWeek = today.day() // 0 = Sunday, 6 = Saturday

    // Get Sunday of current week
    const sunday = today.subtract(currentDayOfWeek, "day")

    // Generate 7 days starting from Sunday
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = sunday.add(i, "day")
      weekDays.push({
        date: day,
        dayName: getDayNameVietnamese(day.day()),
        dayOfWeek: day.day(),
      })
    }

    return weekDays
  }

  // Fetch purchase and sales orders data for charts and stats
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        setChartLoading(true)
        const weekDays = getCurrentWeekDays()

        // Get current week date range (Sunday to Saturday)
        const sunday = weekDays[0].date
        const saturday = weekDays[6].date
        const fromDate = sunday.format('YYYY-MM-DD')
        const toDate = saturday.format('YYYY-MM-DD')

        // Get previous week date range for comparison
        const prevSunday = sunday.subtract(7, 'day')
        const prevSaturday = saturday.subtract(7, 'day')
        const prevFromDate = prevSunday.format('YYYY-MM-DD')
        const prevToDate = prevSaturday.format('YYYY-MM-DD')

        // Fetch current week data
        const [currentReceipts, currentIssues, previousReceipts, previousIssues] = await Promise.all([
          getGoodsReceiptReport({ fromDate, toDate }).catch(() => []),
          getGoodsIssueReport({ fromDate, toDate }).catch(() => []),
          getGoodsReceiptReport({ fromDate: prevFromDate, toDate: prevToDate }).catch(() => []),
          getGoodsIssueReport({ fromDate: prevFromDate, toDate: prevToDate }).catch(() => [])
        ])

        // Handle response structure
        const normalizeData = (response) => {
          if (Array.isArray(response)) return response
          if (response?.items && Array.isArray(response.items)) return response.items
          if (response?.data && Array.isArray(response.data)) return response.data
          if (response?.data?.items && Array.isArray(response.data.items)) return response.data.items
          return []
        }

        const currentReceiptsList = normalizeData(currentReceipts)
        const currentIssuesList = normalizeData(currentIssues)
        const previousReceiptsList = normalizeData(previousReceipts)
        const previousIssuesList = normalizeData(previousIssues)

        // Calculate stats
        const currentPurchaseCount = currentReceiptsList.length
        const previousPurchaseCount = previousReceiptsList.length
        const purchaseChange = previousPurchaseCount > 0
          ? ((currentPurchaseCount - previousPurchaseCount) / previousPurchaseCount * 100).toFixed(0)
          : currentPurchaseCount > 0 ? 100 : 0

        const currentSalesCount = currentIssuesList.length
        const previousSalesCount = previousIssuesList.length
        const salesChange = previousSalesCount > 0
          ? ((currentSalesCount - previousSalesCount) / previousSalesCount * 100).toFixed(0)
          : currentSalesCount > 0 ? 100 : 0

        setPurchaseOrdersStats({
          current: currentPurchaseCount,
          previous: previousPurchaseCount,
          change: parseFloat(purchaseChange)
        })

        setSalesOrdersStats({
          current: currentSalesCount,
          previous: previousSalesCount,
          change: parseFloat(salesChange)
        })

        // Group receipts by day of week
        const purchaseDataByDay = {}
        weekDays.forEach(day => {
          purchaseDataByDay[day.dayOfWeek] = 0
        })

        currentReceiptsList.forEach(receipt => {
          if (receipt.receiptDate) {
            const receiptDate = dayjs(receipt.receiptDate)
            const dayOfWeek = receiptDate.day()
            if (purchaseDataByDay.hasOwnProperty(dayOfWeek)) {
              purchaseDataByDay[dayOfWeek]++
            }
          }
        })

        const purchaseData = weekDays.map(day => ({
          name: day.dayName,
          value: purchaseDataByDay[day.dayOfWeek] || 0
        }))
        setPurchaseOrdersData(purchaseData)

        // Group issues by day of week (excluding Saturday)
        const salesDataByDay = {}
        weekDays.slice(0, 6).forEach(day => {
          salesDataByDay[day.dayOfWeek] = 0
        })

        currentIssuesList.forEach(issue => {
          if (issue.issueDate) {
            const issueDate = dayjs(issue.issueDate)
            const dayOfWeek = issueDate.day()
            if (salesDataByDay.hasOwnProperty(dayOfWeek)) {
              salesDataByDay[dayOfWeek]++
            }
          }
        })

        const salesData = weekDays.slice(0, 6).map(day => ({
          name: day.dayName,
          value: salesDataByDay[day.dayOfWeek] || 0
        }))
        setSalesOrdersData(salesData)

      } catch (error) {
        console.error("Error fetching orders data:", error)
        // Fallback to empty data
        const weekDays = getCurrentWeekDays()
        setPurchaseOrdersData(weekDays.map(day => ({ name: day.dayName, value: 0 })))
        setSalesOrdersData(weekDays.slice(0, 6).map(day => ({ name: day.dayName, value: 0 })))
      } finally {
        setChartLoading(false)
      }
    }

    if (activeSection === "dashboard") {
      fetchOrdersData()
    }
  }, [activeSection])

  // Fetch areas dropdown
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setAreasLoading(true)
        const response = await getAreaDropdown()
        // Handle response structure: { status, message, data: [...], success }
        // or { data: { data: [...] } } or direct array
        let areasList = []
        if (Array.isArray(response)) {
          areasList = response
        } else if (response?.data) {
          // Check if response.data is array or nested
          areasList = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        } else if (response?.items) {
          areasList = response.items
        }
        setAreas(areasList)
      } catch (error) {
        console.error("Error fetching areas:", error)
        setAreas([])
      } finally {
        setAreasLoading(false)
      }
    }

    if (activeSection === "dashboard") {
      fetchAreas()
    }
  }, [activeSection])

  // Fetch location report data
  useEffect(() => {
    const fetchLocationReport = async () => {
      try {
        setLocationReportLoading(true)
        // Khi có selectedAreaId: truyền areaId để lấy dữ liệu khu vực đó
        // Khi không có selectedAreaId: không truyền areaId để lấy tổng hợp tất cả khu vực
        const params = selectedAreaId ? { areaId: selectedAreaId } : {}
        const data = await getLocationReport(params)

        // Đảm bảo dữ liệu hợp lệ
        if (data) {
          setLocationReport({
            totalLocations: data.totalLocations || 0,
            availableLocationCount: data.availableLocationCount || 0,
            areaDetails: data.areaDetails || []
          })
        } else {
          setLocationReport({
            totalLocations: 0,
            availableLocationCount: 0,
            areaDetails: []
          })
        }
      } catch (error) {
        console.error("Error fetching location report:", error)
        setLocationReport({
          totalLocations: 0,
          availableLocationCount: 0,
          areaDetails: []
        })
      } finally {
        setLocationReportLoading(false)
      }
    }

    if (activeSection === "dashboard") {
      fetchLocationReport()
    }
  }, [activeSection, selectedAreaId])

  // Fetch inventory report data for stats
  useEffect(() => {
    const fetchInventoryStats = async () => {
      try {
        setInventoryLoading(true)

        // Fetch current inventory data - get all items to calculate total quantity
        // Note: Inventory report shows current stock, not weekly comparison
        const currentInventory = await getInventoryReport({
          pageNumber: 1,
          pageSize: 1000 // Get all items to calculate total
        }).catch(() => ({ items: [], totalCount: 0 }))

        // Calculate total package quantity from all items
        const currentCount = currentInventory?.items?.reduce((sum, item) =>
          sum + (item.totalPackageQuantity || 0), 0) || 0

        // For comparison, we can't easily get previous week data without date filter support
        // So we'll show current count and set previous to 0 or use current as baseline
        const previousCount = 0 // Placeholder - could be fetched separately if needed
        const change = 0 // No comparison data available

        setInventoryStats({
          current: currentCount,
          previous: previousCount,
          change: change
        })
      } catch (error) {
        console.error("Error fetching inventory stats:", error)
        setInventoryStats({ current: 0, previous: 0, change: 0 })
      } finally {
        setInventoryLoading(false)
      }
    }

    if (activeSection === "dashboard") {
      fetchInventoryStats()
    }
  }, [activeSection])

  // Fetch activity stats (empty areas, full areas, products)
  useEffect(() => {
    const fetchActivityStats = async () => {
      try {
        setActivityLoading(true)
        const locationData = await getLocationReport({})

        // Calculate empty and full areas from areaDetails
        const emptyAreas = locationData?.areaDetails?.filter(area =>
          area.availableLocationCount > 0
        ).length || 0

        const fullAreas = locationData?.areaDetails?.filter(area =>
          area.availableLocationCount === 0 && area.totalLocations > 0
        ).length || 0

        // Get total products - count unique goods codes from inventory report
        const inventoryData = await getInventoryReport({
          pageNumber: 1,
          pageSize: 1000 // Get all items to count unique products
        }).catch(() => ({ items: [] }))

        // Count unique goods codes (different products)
        const uniqueProducts = new Set(
          inventoryData?.items
            ?.map(item => item.goodsCode || item.goodCode)
            .filter(code => code) || []
        )
        const products = uniqueProducts.size

        setActivityStats({
          emptyAreas,
          fullAreas,
          products
        })
      } catch (error) {
        console.error("Error fetching activity stats:", error)
        setActivityStats({ emptyAreas: 0, fullAreas: 0, products: 0 })
      } finally {
        setActivityLoading(false)
      }
    }

    if (activeSection === "dashboard") {
      fetchActivityStats()
    }
  }, [activeSection])


  // Get selected area name for display
  const selectedAreaName = selectedAreaId
    ? areas.find(area => area.areaId === selectedAreaId)?.areaName || ""
    : ""

  // Transform data for pie chart - calculate total used and available
  const storagePieData = [
    {
      name: "Đã sử dụng",
      value: locationReport.totalLocations - locationReport.availableLocationCount,
      color: "#3B82F6"
    },
    {
      name: "Trống",
      value: locationReport.availableLocationCount,
      color: "#F59E0B"
    }
  ].filter(item => item.value > 0) // Only show items with value > 0


  const renderDashboard = () => {
    // Get current date in Vietnamese format
    const today = dayjs()
    const dayNames = {
      0: "Chủ nhật",
      1: "Thứ hai",
      2: "Thứ ba",
      3: "Thứ tư",
      4: "Thứ năm",
      5: "Thứ sáu",
      6: "Thứ bảy",
    }
    const currentDayName = dayNames[today.day()] || ""
    const formattedDate = today.format("DD/MM/YYYY")
    const currentDateDisplay = `${currentDayName}, ${formattedDate}`

    return (
      <>
        <div className="flex justify-end mb-4">
          <p className="text-sm text-gray-600">{currentDateDisplay}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-50 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-500"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Đơn mua hàng <span className="text-xs">(Tuần này)</span>
                </p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold mr-2">{purchaseOrdersStats.current}</h3>
                  {purchaseOrdersStats.change !== 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${purchaseOrdersStats.change > 0
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                      }`}>
                      {purchaseOrdersStats.change > 0 ? '+' : ''}{purchaseOrdersStats.change}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Tuần trước: {purchaseOrdersStats.previous}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-amber-50 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-amber-500"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Đơn bán hàng <span className="text-xs">(Tuần này)</span>
                </p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold mr-2">{salesOrdersStats.current}</h3>
                  {salesOrdersStats.change !== 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${salesOrdersStats.change > 0
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                      }`}>
                      {salesOrdersStats.change > 0 ? '+' : ''}{salesOrdersStats.change}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Tuần trước: {salesOrdersStats.previous}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-cyan-50 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-cyan-500"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Tồn kho <span className="text-xs">(Tuần này)</span>
                </p>
                {inventoryLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500 mr-2"></div>
                    <span className="text-xs text-gray-500">Đang tải...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <h3 className="text-2xl font-bold mr-2">{inventoryStats.current}(thùng)</h3>
                      {inventoryStats.change !== 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${inventoryStats.change > 0
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                          }`}>
                          {inventoryStats.change > 0 ? '+' : ''}{inventoryStats.change}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Tuần trước: {inventoryStats.previous}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-2">Hoạt động hôm nay</p>
              {activityLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="flex justify-between mb-2">
                  <div className="text-center">
                    <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                      <span>{activityStats.emptyAreas}</span>
                    </div>
                    <p className="text-xs">
                      Khu vực
                      <br />
                      Trống
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                      <span>{activityStats.fullAreas}</span>
                    </div>
                    <p className="text-xs">
                      Khu vực
                      <br />
                      Đầy
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                      <span>{activityStats.products}</span>
                    </div>
                    <p className="text-xs">Sản phẩm</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-medium">Đơn mua hàng</CardTitle>
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
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={purchaseOrdersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide={true} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow-sm">
                              <p className="text-xs">{`${payload[0].value} đơn`}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-medium">Đơn bán hàng</CardTitle>
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
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={salesOrdersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide={true} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow-sm">
                              <p className="text-xs">{`${payload[0].value} đơn`}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "white", stroke: "#3B82F6", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      fill="url(#colorUv)"
                    />
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-medium">Khu vực lưu trữ</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  key={`area-select-${selectedAreaId || 'all'}`}
                  value={selectedAreaId !== null && selectedAreaId !== undefined ? selectedAreaId.toString() : ""}
                  onValueChange={(value) => {
                    const newAreaId = value === "" || value === null || value === undefined ? null : parseInt(value)
                    setSelectedAreaId(newAreaId)
                  }}
                  disabled={areasLoading}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <span className="flex-1 text-left">
                      {selectedAreaId && selectedAreaName
                        ? selectedAreaName
                        : (areasLoading ? "Đang tải..." : "Tất cả khu vực")
                      }
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả khu vực</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.areaId} value={area.areaId.toString()}>
                        {area.areaName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xs mb-2">
                <div className="flex items-center justify-between">
                  <p>Tổng {locationReport.totalLocations} vị trí</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      <span>Đã sử dụng</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>Trống</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[180px] w-full relative">
                {locationReportLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : storagePieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={storagePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {storagePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0]
                              return (
                                <div className="bg-white p-2 border rounded shadow-sm">
                                  <p className="text-xs font-medium">{data.name}</p>
                                  <p className="text-xs">{`Số lượng: ${data.value}`}</p>
                                  <p className="text-xs">{`Tỷ lệ: ${((data.value / locationReport.totalLocations) * 100).toFixed(1)}%`}</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Text ở góc phải dưới cùng */}
                    <div className="absolute bottom-0 right-0 flex flex-col items-end gap-1">
                      <div className="text-xs font-medium text-blue-500">
                        Đã sử dụng: {locationReport.totalLocations > 0
                          ? (((locationReport.totalLocations - locationReport.availableLocationCount) / locationReport.totalLocations) * 100).toFixed(0)
                          : 0}%
                      </div>
                      <div className="text-xs font-medium text-amber-500">
                        Trống: {locationReport.totalLocations > 0
                          ? ((locationReport.availableLocationCount / locationReport.totalLocations) * 100).toFixed(0)
                          : 0}%
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Không có dữ liệu
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Report Section */}
        <Card className="mb-6">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-medium">Thống kê tồn kho</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-orange-50 p-3 rounded-full">
                  <Package className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Báo cáo tồn kho</h3>
                  <p className="text-sm text-gray-500">Xem chi tiết báo cáo tồn kho và thống kê</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/reports/inventory")}
                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
              >
                Xem báo cáo tồn kho
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders Section */}
        <Card className="mb-6">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-medium">
              Đơn hàng <span className="text-xs font-normal text-gray-500">(Quản lý đơn mua hàng và đơn bán hàng)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Đơn hàng</h3>
                  <p className="text-sm text-gray-500">Xem danh sách đơn mua hàng và đơn bán hàng</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/reports/orders")}
                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
              >
                Xem đơn hàng
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendar and Warehouse Statistics */}
        <div className="grid grid-cols-2 gap-6 items-stretch">
          <div>
            <WarehouseEventCalendar />
          </div>
          <div>
            <WarehousePerformance />
          </div>
        </div>

        {/* Warehouse Information Cards */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <ExpiringProducts />
          <RecentActivities onShowAllClick={() => navigate("/reports/orders")} />
        </div>
      </>
    )
  }

  const renderBillingSystem = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Billing System</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="h-[38px] px-4 flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="h-[38px] px-4 flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white flex items-center gap-1"
            onClick={() => setShowInvoiceDialog(true)}
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-50 p-3 rounded-full mr-4">
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold">Rs.125,000</h3>
              <p className="text-xs text-green-600">+12% from last month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-50 p-3 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Invoices</p>
              <h3 className="text-2xl font-bold">Rs.98,500</h3>
              <p className="text-xs text-green-600">78% of total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-amber-50 p-3 rounded-full mr-4">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <h3 className="text-2xl font-bold">Rs.26,500</h3>
              <p className="text-xs text-amber-600">22% of total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-medium">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.guest}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "Paid" ? "success" : "warning"}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Invoice details",
                                description: `Viewing details for invoice ${invoice.id}`,
                              })
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Invoice printed",
                                description: `Invoice ${invoice.id} sent to printer`,
                              })
                            }}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Invoice downloaded",
                                description: `Invoice ${invoice.id} downloaded as PDF`,
                              })
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Payment reminder sent",
                                description: `Reminder sent to ${invoice.guest}`,
                              })
                            }}
                          >
                            Send Reminder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a guest. Fill in all the required details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guest" className="text-right">
                Guest
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select guest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ram">Ram Kailash</SelectItem>
                  <SelectItem value="samira">Samira Karki</SelectItem>
                  <SelectItem value="jeevan">Jeevan Rai</SelectItem>
                  <SelectItem value="bindu">Bindu Sharma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">
                Room
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="101">101 - King Room</SelectItem>
                  <SelectItem value="102">102 - Queen Room</SelectItem>
                  <SelectItem value="201">201 - Deluxe Room</SelectItem>
                  <SelectItem value="301">301 - Suite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input id="date" type="date" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input id="amount" type="number" placeholder="0.00" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" placeholder="Invoice description" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
              className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              onClick={() => {
                toast({
                  title: "Invoice created",
                  description: "New invoice has been created successfully",
                })
                setShowInvoiceDialog(false)
              }}
              className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
            >
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  const renderFoodDelivery = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Food Delivery System</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="h-[38px] px-4 flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white flex items-center gap-1"
            onClick={() => setShowOrderDialog(true)}
          >
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-50 p-3 rounded-full mr-4">
              <Utensils className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold">42</h3>
              <p className="text-xs text-green-600">+8% from yesterday</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-50 p-3 rounded-full mr-4">
              <ShoppingBag className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <h3 className="text-2xl font-bold">35</h3>
              <p className="text-xs text-green-600">83% of total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-amber-50 p-3 rounded-full mr-4">
              <Truck className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <h3 className="text-2xl font-bold">7</h3>
              <p className="text-xs text-amber-600">17% of total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-medium">Active Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {foodOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.guest}</TableCell>
                        <TableCell>{order.room}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {order.items.map((item, index) => (
                              <span key={index} className="text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{order.total}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "Delivered"
                                ? "success"
                                : order.status === "Preparing"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Order details",
                                    description: `Viewing details for order ${order.id}`,
                                  })
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Order status updated",
                                    description: `Order ${order.id} marked as delivered`,
                                  })
                                }}
                              >
                                Mark as Delivered
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Order cancelled",
                                    description: `Order ${order.id} has been cancelled`,
                                    variant: "destructive",
                                  })
                                }}
                              >
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-medium">Phân bố sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {categoryData.map((entry, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-xs">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Place New Food Order</DialogTitle>
            <DialogDescription>Create a new food order for a guest. Select items from the menu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guest" className="text-right">
                Guest
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select guest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ram">Ram Kailash - Room 101</SelectItem>
                  <SelectItem value="samira">Samira Karki - Room 205</SelectItem>
                  <SelectItem value="jeevan">Jeevan Rai - Room 310</SelectItem>
                  <SelectItem value="bindu">Bindu Sharma - Room 402</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Menu Items</Label>
              <div className="col-span-3 border rounded-md p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="item1" />
                  <Label htmlFor="item1" className="flex justify-between w-full">
                    <span>Chicken Curry</span>
                    <span>Rs.450</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="item2" />
                  <Label htmlFor="item2" className="flex justify-between w-full">
                    <span>Vegetable Pasta</span>
                    <span>Rs.350</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="item3" />
                  <Label htmlFor="item3" className="flex justify-between w-full">
                    <span>Club Sandwich</span>
                    <span>Rs.250</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="item4" />
                  <Label htmlFor="item4" className="flex justify-between w-full">
                    <span>Naan Bread</span>
                    <span>Rs.50</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="item5" />
                  <Label htmlFor="item5" className="flex justify-between w-full">
                    <span>Rice</span>
                    <span>Rs.100</span>
                  </Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="special" className="text-right">
                Special Instructions
              </Label>
              <Textarea id="special" placeholder="Any special requests" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowOrderDialog(false)}
              className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              onClick={() => {
                toast({
                  title: "Order placed",
                  description: "Food order has been placed successfully",
                })
                setShowOrderDialog(false)
              }}
              className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
            >
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {activeSection === "dashboard" && renderDashboard()}
        {activeSection === "billing" && renderBillingSystem()}
        {activeSection === "food-delivery" && renderFoodDelivery()}
        {activeSection !== "dashboard" && activeSection !== "billing" && activeSection !== "food-delivery" && (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>This section is under development and will be available soon.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  The{" "}
                  {activeSection === "check-in-out"
                    ? "Check In-Out"
                    : activeSection === "rooms"
                      ? "Rooms"
                      : activeSection === "messages"
                        ? "Messages"
                        : activeSection === "customer-review"
                          ? "Customer Review"
                          : "Premium"}{" "}
                  module is currently being built. Please check back later.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => onSectionChange?.("dashboard")}
                  className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                >
                  Return to Dashboard
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}