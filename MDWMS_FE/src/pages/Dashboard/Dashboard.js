"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  BarChart,
  Search,
  Trash,
  ChevronDown,
  Bell,
  Home,
  CalendarIcon,
  MessageSquare,
  Star,
  Award,
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
// import { useToast } from "@/components/ui/use-toast"
import {
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
  Legend,
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
  const [locationReport, setLocationReport] = useState({
    totalLocations: 0,
    availableLocationCount: 0,
    areaDetails: []
  })
  const [locationReportLoading, setLocationReportLoading] = useState(true)
  const [selectedAreaId, setSelectedAreaId] = useState(null)
  const [areas, setAreas] = useState([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [ordersChartData, setOrdersChartData] = useState([])
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

  // Get current week days (Monday to Sunday)
  const getCurrentWeekDays = () => {
    const today = dayjs()
    const currentDayOfWeek = today.day() // 0 = Sunday, 6 = Saturday

    // Determine how many days to subtract to reach Monday
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
    const monday = today.subtract(daysFromMonday, "day")

    // Generate 7 days starting from Monday
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = monday.add(i, "day")
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

        // Get current week date range (Monday to Sunday)
        const startOfWeek = weekDays[0].date
        const endOfWeek = weekDays[6].date
        const fromDate = startOfWeek.format('YYYY-MM-DD')
        const toDate = endOfWeek.format('YYYY-MM-DD')

        // Get previous week date range for comparison
        const prevStartOfWeek = startOfWeek.subtract(7, 'day')
        const prevEndOfWeek = endOfWeek.subtract(7, 'day')
        const prevFromDate = prevStartOfWeek.format('YYYY-MM-DD')
        const prevToDate = prevEndOfWeek.format('YYYY-MM-DD')

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

        // Group receipts and issues by day of week (Monday to Sunday)
        const purchaseDataByDay = {}
        const salesDataByDay = {}
        weekDays.forEach(day => {
          purchaseDataByDay[day.dayOfWeek] = 0
          salesDataByDay[day.dayOfWeek] = 0
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

        currentIssuesList.forEach(issue => {
          if (issue.issueDate) {
            const issueDate = dayjs(issue.issueDate)
            const dayOfWeek = issueDate.day()
            if (salesDataByDay.hasOwnProperty(dayOfWeek)) {
              salesDataByDay[dayOfWeek]++
            }
          }
        })

        const combinedOrdersData = weekDays.map(day => ({
          name: day.dayName,
          sales: salesDataByDay[day.dayOfWeek] || 0,
          purchase: purchaseDataByDay[day.dayOfWeek] || 0
        }))
        setOrdersChartData(combinedOrdersData)

      } catch (error) {
        console.error("Error fetching orders data:", error)
        // Fallback to empty data
        const weekDays = getCurrentWeekDays()
        setOrdersChartData(weekDays.map(day => ({
          name: day.dayName,
          sales: 0,
          purchase: 0
        })))
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-medium">Đơn mua & bán hàng</CardTitle>
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
              <div className="h-[240px] w-full">
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={ordersChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border rounded shadow-sm text-xs space-y-1">
                                <p className="font-medium">{payload[0].payload.name}</p>
                                {payload.map(item => (
                                  <p key={item.dataKey} className="flex justify-between gap-4">
                                    <span>{item.name}</span>
                                    <span>{item.value} đơn</span>
                                  </p>
                                ))}
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend
                        formatter={(value) => value}
                        wrapperStyle={{ fontSize: "12px" }}
                        verticalAlign="top"
                        align="right"
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="Đơn bán hàng"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "white", stroke: "#3B82F6", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="purchase"
                        name="Đơn mua hàng"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "white", stroke: "#EF4444", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                )}
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

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            {
              id: "inventory",
              badge: "Thống kê tồn kho",
              title: "Báo cáo tồn kho",
              description: "Xem chi tiết báo cáo tồn kho và thống kê",
              icon: <Package className="h-5 w-5 text-orange-500" />,
              iconBg: "bg-orange-50",
              action: () => navigate("/reports/inventory"),
              actionLabel: "Xem báo cáo"
            },
            {
              id: "orders",
              badge: "Đơn hàng",
              title: "Quản lý đơn mua/bán",
              description: "Xem danh sách đơn mua hàng và đơn bán hàng",
              icon: <ShoppingCart className="h-5 w-5 text-blue-500" />,
              iconBg: "bg-blue-50",
              action: () => navigate("/reports/orders"),
              actionLabel: "Xem đơn hàng"
            }
          ].map(link => (
            <Card key={link.id} className="border border-dashed shadow-none">
              <CardContent className="p-6 flex items-center justify-between gap-6 min-h-[110px]">
                <div className="flex items-center gap-4 mt-4">
                  <div className={`${link.iconBg} p-2.5 rounded-full flex-shrink-0`}>
                    {link.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">
                      {link.badge}
                    </p>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{link.title}</h3>
                    <p className="text-sm text-gray-500">{link.description}</p>
                  </div>
                </div>
                <Button
                  onClick={link.action}
                  className="whitespace-nowrap bg-orange-500 hover:bg-orange-600 h-[38px] px-5 flex-shrink-0"
                >
                  {link.actionLabel}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {activeSection === "dashboard" && renderDashboard()}
        {activeSection !== "dashboard" && (
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