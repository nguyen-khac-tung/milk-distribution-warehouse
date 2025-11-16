"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Plus,
  ChevronDown,
  ShoppingCart,
  Package,
  Eye,
  Download,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { getGoodsReceiptReport, getGoodsIssueReport } from "../../services/DashboardService"
import dayjs from "dayjs"
import { DatePicker, ConfigProvider } from 'antd'
import locale from 'antd/locale/vi_VN'
import Loading from "../../components/Common/Loading"
import Pagination from "../../components/Common/Pagination"

export default function OrdersPage({ onClose }) {
  const navigate = useNavigate()
  const [activeOrderType, setActiveOrderType] = useState("purchase") // "purchase" or "sales"
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  // Date range for report APIs (default: current month - from first day to last day)
  const [dateRange, setDateRange] = useState({
    fromDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    toDate: dayjs().endOf('month').format('YYYY-MM-DD')
  })

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)

      // Format dates to YYYY-MM-DD format for API
      const fromDate = dateRange.fromDate ? dayjs(dateRange.fromDate).format('YYYY-MM-DD') : null
      const toDate = dateRange.toDate ? dayjs(dateRange.toDate).format('YYYY-MM-DD') : null

      const response = await getGoodsReceiptReport({
        fromDate: fromDate,
        toDate: toDate
      })

      // Handle response structure - API may return array or object with items
      let orders = []
      if (Array.isArray(response)) {
        orders = response
      } else if (response?.items && Array.isArray(response.items)) {
        orders = response.items
      } else if (response?.data && Array.isArray(response.data)) {
        orders = response.data
      } else if (response?.data?.items && Array.isArray(response.data.items)) {
        orders = response.data.items
      }

      // Apply search filter client-side if needed
      let filteredOrders = orders
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredOrders = orders.filter(order => {
          const supplierName = (order.supplierName || '').toLowerCase()
          const goodsCode = (order.goodsCode || '').toLowerCase()
          const goodsName = (order.goodsName || '').toLowerCase()
          return supplierName.includes(query) || goodsCode.includes(query) || goodsName.includes(query)
        })
      }


      // Apply pagination client-side
      const startIndex = (pagination.current - 1) * pagination.pageSize
      const endIndex = startIndex + pagination.pageSize
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

      setPurchaseOrders(paginatedOrders)
      setPagination(prev => ({
        ...prev,
        total: filteredOrders.length
      }))
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      setPurchaseOrders([])
      setPagination(prev => ({ ...prev, total: 0 }))
    } finally {
      setLoading(false)
    }
  }

  // Fetch sales orders
  const fetchSalesOrders = async () => {
    try {
      setLoading(true)

      // Format dates to YYYY-MM-DD format for API
      const fromDate = dateRange.fromDate ? dayjs(dateRange.fromDate).format('YYYY-MM-DD') : null
      const toDate = dateRange.toDate ? dayjs(dateRange.toDate).format('YYYY-MM-DD') : null

      const response = await getGoodsIssueReport({
        fromDate: fromDate,
        toDate: toDate
      })

      // Handle response structure - API may return array or object with items
      let orders = []
      if (Array.isArray(response)) {
        orders = response
      } else if (response?.items && Array.isArray(response.items)) {
        orders = response.items
      } else if (response?.data && Array.isArray(response.data)) {
        orders = response.data
      } else if (response?.data?.items && Array.isArray(response.data.items)) {
        orders = response.data.items
      }

      // Apply search filter client-side if needed
      let filteredOrders = orders
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredOrders = orders.filter(order => {
          const retailerName = (order.retailerName || '').toLowerCase()
          const goodsCode = (order.goodsCode || '').toLowerCase()
          const goodsName = (order.goodsName || '').toLowerCase()
          return retailerName.includes(query) || goodsCode.includes(query) || goodsName.includes(query)
        })
      }


      // Apply pagination client-side
      const startIndex = (pagination.current - 1) * pagination.pageSize
      const endIndex = startIndex + pagination.pageSize
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

      setSalesOrders(paginatedOrders)
      setPagination(prev => ({
        ...prev,
        total: filteredOrders.length
      }))
    } catch (error) {
      console.error("Error fetching sales orders:", error)
      setSalesOrders([])
      setPagination(prev => ({ ...prev, total: 0 }))
    } finally {
      setLoading(false)
    }
  }

  // Fetch data based on active order type
  useEffect(() => {
    // Reset pagination when changing order type
    setPagination(prev => ({ ...prev, current: 1 }))
  }, [activeOrderType])

  useEffect(() => {
    if (activeOrderType === "purchase") {
      fetchPurchaseOrders()
    } else {
      fetchSalesOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrderType, searchQuery, pagination.current, pagination.pageSize, dateRange])

  // Get current orders based on active type
  const currentOrders = useMemo(() => {
    return activeOrderType === "purchase" ? purchaseOrders : salesOrders
  }, [activeOrderType, purchaseOrders, salesOrders])

  // Transform order data for display
  const displayOrders = useMemo(() => {
    return currentOrders.map((order, index) => {
      if (activeOrderType === "purchase") {
        // GoodsReceiptReport structure
        return {
          id: order.goodsId || order.id || index,
          supplierId: order.supplierId,
          supplierName: order.supplierName || "",
          goodsId: order.goodsId,
          goodsCode: order.goodsCode || "",
          goodsName: order.goodsName || "",
          totalPackageQuantity: order.totalPackageQuantity || 0,
          totalUnitQuantity: order.totalUnitQuantity || 0,
          unitOfMeasure: order.unitOfMeasure || "",
          receiptDate: order.receiptDate || "",
          unitPerPackage: order.unitPerPackage || 0,
        }
      } else {
        // GoodsIssueReport structure
        return {
          id: order.goodsId || order.id || index,
          retailerId: order.retailerId,
          retailerName: order.retailerName || "",
          goodsId: order.goodsId,
          goodsCode: order.goodsCode || "",
          goodsName: order.goodsName || "",
          totalPackageQuantity: order.totalPackageQuantity || 0,
          totalUnitQuantity: order.totalUnitQuantity || 0,
          unitOfMeasure: order.unitOfMeasure || "",
          issueDate: order.issueDate || "",
          unitPerPackage: order.unitPerPackage || 0,
        }
      }
    })
  }, [currentOrders, activeOrderType])

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }))
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export orders report", { activeOrderType, dateRange })
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Đơn hàng</h1>
            <p className="text-slate-600 mt-1">Quản lý đơn mua hàng và đơn bán hàng</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
              onClick={() => {
                if (activeOrderType === "purchase") {
                  navigate("/purchase-orders/create")
                } else {
                  navigate("/sales-orders/create")
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeOrderType === "purchase" ? "Tạo đơn mua hàng" : "Tạo đơn bán hàng"}
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

        {/* Main Tabs: Purchase Orders vs Sales Orders */}
        <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 pb-2 border-b border-slate-200">
            <Tabs value={activeOrderType} onValueChange={setActiveOrderType} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="purchase" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Đơn mua hàng
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Đơn bán hàng
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="p-4">
            {/* Search and Date Pickers */}
            <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo nhà cung cấp, mã sản phẩm, tên sản phẩm..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-[400px] text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <ConfigProvider locale={locale}>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 whitespace-nowrap">Từ ngày:</label>
                    <DatePicker
                      format="DD/MM/YYYY"
                      value={dateRange.fromDate ? dayjs(dateRange.fromDate) : null}
                      onChange={(date) => {
                        setDateRange(prev => ({
                          ...prev,
                          fromDate: date ? date.format('YYYY-MM-DD') : ''
                        }))
                      }}
                      className="w-[150px]"
                      placeholder="Chọn ngày"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 whitespace-nowrap">Đến ngày:</label>
                    <DatePicker
                      format="DD/MM/YYYY"
                      value={dateRange.toDate ? dayjs(dateRange.toDate) : null}
                      onChange={(date) => {
                        setDateRange(prev => ({
                          ...prev,
                          toDate: date ? date.format('YYYY-MM-DD') : ''
                        }))
                      }}
                      className="w-[150px]"
                      placeholder="Chọn ngày"
                    />
                  </div>
                </ConfigProvider>
              </div>
            </div>
          </div>
          <div className="w-full">
            {/* Orders Table */}
            {loading ? (
              <div className="p-8">
                <Loading />
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-16">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        {activeOrderType === "purchase" ? "Nhà cung cấp" : "Khách hàng"}
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Mã sản phẩm
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Tên sản phẩm
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        Số thùng
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                       Tổng số đơn vị
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        Đơn vị tính
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          Không có dữ liệu nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayOrders.map((order, index) => {
                        const stt = (pagination.current - 1) * pagination.pageSize + index + 1
                        return (
                          <TableRow
                            key={order.id}
                            className="hover:bg-slate-50 border-b border-slate-200"
                          >
                            <TableCell className="px-6 py-4 text-center text-slate-700">
                              {stt}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700">
                              <p className="font-medium">
                                {activeOrderType === "purchase" ? order.supplierName : order.retailerName}
                              </p>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700 font-medium">
                              {order.goodsCode}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700">
                              <div className="max-w-xs truncate" title={order.goodsName}>
                                {order.goodsName}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center text-slate-700">
                              {order.totalPackageQuantity}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center text-slate-700">
                              {order.totalUnitQuantity}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center text-slate-700">
                              {order.unitOfMeasure || '-'}
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

