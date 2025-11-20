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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Building2,
  RotateCcw,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { getGoodsReceiptReport, getGoodsIssueReport } from "../../services/DashboardService"
import { getSuppliersDropdown } from "../../services/SupplierService"
import { getAllRetailersDropdown } from "../../services/RetailerService"
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
  const [sortField, setSortField] = useState("")
  const [sortAscending, setSortAscending] = useState(true)
  // Supplier filter (only for purchase orders)
  const [supplierFilter, setSupplierFilter] = useState("")
  const [showSupplierFilter, setShowSupplierFilter] = useState(false)
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")
  const [suppliers, setSuppliers] = useState([])
  // Retailer filter (only for sales orders)
  const [retailerFilter, setRetailerFilter] = useState("")
  const [showRetailerFilter, setShowRetailerFilter] = useState(false)
  const [retailerSearchTerm, setRetailerSearchTerm] = useState("")
  const [retailers, setRetailers] = useState([])

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

      // Apply supplier filter client-side
      if (supplierFilter) {
        filteredOrders = filteredOrders.filter(order => {
          return order.supplierId && order.supplierId.toString() === supplierFilter
        })
      }

      // Apply sorting client-side
      if (sortField) {
        filteredOrders = [...filteredOrders].sort((a, b) => {
          let aValue, bValue

          if (sortField === "goodsName") {
            aValue = (a.goodsName || '').toLowerCase()
            bValue = (b.goodsName || '').toLowerCase()
          } else if (sortField === "totalPackageQuantity") {
            aValue = a.totalPackageQuantity || 0
            bValue = b.totalPackageQuantity || 0
          } else {
            return 0
          }

          if (aValue < bValue) return sortAscending ? -1 : 1
          if (aValue > bValue) return sortAscending ? 1 : -1
          return 0
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

      // Apply retailer filter client-side
      if (retailerFilter) {
        filteredOrders = filteredOrders.filter(order => {
          return order.retailerId && order.retailerId.toString() === retailerFilter
        })
      }

      // Apply sorting client-side
      if (sortField) {
        filteredOrders = [...filteredOrders].sort((a, b) => {
          let aValue, bValue

          if (sortField === "goodsName") {
            aValue = (a.goodsName || '').toLowerCase()
            bValue = (b.goodsName || '').toLowerCase()
          } else if (sortField === "totalPackageQuantity") {
            aValue = a.totalPackageQuantity || 0
            bValue = b.totalPackageQuantity || 0
          } else {
            return 0
          }

          if (aValue < bValue) return sortAscending ? -1 : 1
          if (aValue > bValue) return sortAscending ? 1 : -1
          return 0
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

  // Fetch suppliers dropdown
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

  // Fetch retailers dropdown
  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        const response = await getAllRetailersDropdown()
        let retailersList = []
        if (Array.isArray(response)) {
          retailersList = response
        } else if (response?.data && Array.isArray(response.data)) {
          retailersList = response.data
        } else if (response?.items && Array.isArray(response.items)) {
          retailersList = response.items
        }
        setRetailers(retailersList)
      } catch (error) {
        console.error("Error fetching retailers:", error)
        setRetailers([])
      }
    }
    fetchRetailers()
  }, [])

  // Filter suppliers based on search term
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm.trim()) {
      return suppliers
    }
    const query = supplierSearchTerm.toLowerCase().trim()
    return suppliers.filter(supplier =>
      (supplier.companyName || '').toLowerCase().includes(query)
    )
  }, [suppliers, supplierSearchTerm])

  // Filter retailers based on search term
  const filteredRetailers = useMemo(() => {
    if (!retailerSearchTerm.trim()) {
      return retailers
    }
    const query = retailerSearchTerm.toLowerCase().trim()
    return retailers.filter(retailer =>
      (retailer.retailerName || '').toLowerCase().includes(query)
    )
  }, [retailers, retailerSearchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSupplierFilter && !event.target.closest('.supplier-filter-dropdown')) {
        setShowSupplierFilter(false)
        setSupplierSearchTerm("")
      }
      if (showRetailerFilter && !event.target.closest('.retailer-filter-dropdown')) {
        setShowRetailerFilter(false)
        setRetailerSearchTerm("")
      }
    }

    if (showSupplierFilter || showRetailerFilter) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSupplierFilter, showRetailerFilter])

  // Fetch data based on active order type
  useEffect(() => {
    // Reset pagination and filters when changing order type
    setPagination(prev => ({ ...prev, current: 1 }))
    setSupplierFilter("")
    setRetailerFilter("")
  }, [activeOrderType])

  useEffect(() => {
    if (activeOrderType === "purchase") {
      fetchPurchaseOrders()
    } else {
      fetchSalesOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrderType, searchQuery, pagination.current, pagination.pageSize, dateRange, sortField, sortAscending, supplierFilter, retailerFilter])

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

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle ascending/descending if same field
      setSortAscending(!sortAscending)
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortAscending(true)
    }
    // Reset to page 1 when sorting
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }))
  }

  const handleClearAllFilters = () => {
    setSearchQuery("")
    setSupplierFilter("")
    setRetailerFilter("")
    setSortField("")
    setSortAscending(true)
    setDateRange({
      fromDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      toDate: dayjs().endOf('month').format('YYYY-MM-DD')
    })
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const hasActiveFilters = () => {
    return !!(
      searchQuery ||
      supplierFilter ||
      retailerFilter ||
      sortField ||
      dateRange.fromDate !== dayjs().startOf('month').format('YYYY-MM-DD') ||
      dateRange.toDate !== dayjs().endOf('month').format('YYYY-MM-DD')
    )
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
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-[400px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo nhà cung cấp, mã sản phẩm, tên sản phẩm..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {/* Supplier Filter - Only show for purchase orders */}
                {activeOrderType === "purchase" && suppliers.length > 0 && (
                  <div className="relative supplier-filter-dropdown">
                    <button
                      onClick={() => {
                        setShowSupplierFilter(!showSupplierFilter)
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-md transition-colors
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                        ${supplierFilter ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {supplierFilter ? suppliers.find(s => s.supplierId.toString() === supplierFilter)?.companyName || "Chọn nhà cung cấp" : "Tất cả nhà cung cấp"}
                      </span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </button>

                    {showSupplierFilter && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm nhà cung cấp..."
                              value={supplierSearchTerm}
                              onChange={(e) => setSupplierSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {/* Dropdown List */}
                        <div className="py-1 overflow-y-auto max-h-48">
                          <button
                            onClick={() => {
                              setSupplierFilter("")
                              setShowSupplierFilter(false)
                              setSupplierSearchTerm("")
                              setPagination(prev => ({ ...prev, current: 1 }))
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                          >
                            Tất cả nhà cung cấp
                          </button>
                          {filteredSuppliers.length > 0 ? filteredSuppliers.map((supplier) => (
                            <button
                              key={supplier.supplierId}
                              onClick={() => {
                                setSupplierFilter(supplier.supplierId.toString())
                                setShowSupplierFilter(false)
                                setSupplierSearchTerm("")
                                setPagination(prev => ({ ...prev, current: 1 }))
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${supplierFilter === supplier.supplierId.toString()
                                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                                  : 'text-slate-700'
                                }`}
                            >
                              {supplier.companyName}
                            </button>
                          )) : (
                            <div className="px-3 py-2 text-sm text-slate-500">
                              {suppliers.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Retailer Filter - Only show for sales orders */}
                {activeOrderType === "sales" && retailers.length > 0 && (
                  <div className="relative retailer-filter-dropdown">
                    <button
                      onClick={() => {
                        setShowRetailerFilter(!showRetailerFilter)
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-md transition-colors
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                        ${retailerFilter ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {retailerFilter ? retailers.find(r => r.retailerId.toString() === retailerFilter)?.retailerName || "Chọn nhà bán lẻ" : "Tất cả nhà bán lẻ"}
                      </span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </button>

                    {showRetailerFilter && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm nhà bán lẻ..."
                              value={retailerSearchTerm}
                              onChange={(e) => setRetailerSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {/* Dropdown List */}
                        <div className="py-1 overflow-y-auto max-h-48">
                          <button
                            onClick={() => {
                              setRetailerFilter("")
                              setShowRetailerFilter(false)
                              setRetailerSearchTerm("")
                              setPagination(prev => ({ ...prev, current: 1 }))
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                          >
                            Tất cả nhà bán lẻ
                          </button>
                          {filteredRetailers.length > 0 ? filteredRetailers.map((retailer) => (
                            <button
                              key={retailer.retailerId}
                              onClick={() => {
                                setRetailerFilter(retailer.retailerId.toString())
                                setShowRetailerFilter(false)
                                setRetailerSearchTerm("")
                                setPagination(prev => ({ ...prev, current: 1 }))
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${
                                retailerFilter === retailer.retailerId.toString() 
                                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                  : 'text-slate-700'
                              }`}
                            >
                              {retailer.retailerName}
                            </button>
                          )) : (
                            <div className="px-3 py-2 text-sm text-slate-500">
                              {retailers.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                {/* Clear Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-[38px] px-3 text-sm text-slate-600 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Bỏ lọc
                </Button>
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
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("goodsName")}>
                          <span>Tên sản phẩm</span>
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("totalPackageQuantity")}>
                          <span>Số thùng</span>
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
                        Tổng số đơn vị
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        Đơn vị tính
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                        {activeOrderType === "purchase" ? "Ngày nhập" : "Ngày xuất"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
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
                            <TableCell className="px-6 py-4 text-center text-slate-700">
                              {activeOrderType === "purchase"
                                ? (order.receiptDate ? dayjs(order.receiptDate).format('DD/MM/YYYY') : '-')
                                : (order.issueDate ? dayjs(order.issueDate).format('DD/MM/YYYY') : '-')
                              }
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

