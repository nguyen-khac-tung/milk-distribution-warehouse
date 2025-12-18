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
import EmptyState from "../../components/Common/EmptyState"
import ExportPurchaseOrdersReport from "../../components/PurchaseOrderComponents/ExportPurchaseOrdersReport"
import ExportSalesOrdersReport from "../../components/SaleOrderCompoents/ExportSalesOrdersReport"
import PermissionWrapper from "../../components/Common/PermissionWrapper"
import { PERMISSIONS } from "../../utils/permissions"

export default function OrdersPage({ onClose }) {
  const navigate = useNavigate()
  const [activeOrderType, setActiveOrderType] = useState("purchase") // "purchase" or "sales"
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)

  // Normalize function: lowercase, trim, and collapse multiple spaces into one
  const normalize = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // gom nhiều space thành 1 space
  };
  // Store all raw data from API (no filtering/sorting)
  const [allPurchaseOrders, setAllPurchaseOrders] = useState([])
  const [allSalesOrders, setAllSalesOrders] = useState([])
  // Store filtered and sorted data for display
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

  // Fetch all purchase orders (only date filter on backend, search/sort on frontend)
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)

      // Format dates to YYYY-MM-DD format for API
      const fromDate = dateRange.fromDate ? dayjs(dateRange.fromDate).format('YYYY-MM-DD') : null
      const toDate = dateRange.toDate ? dayjs(dateRange.toDate).format('YYYY-MM-DD') : null

      // Fetch with date range filter on backend, use pagination to get all pages
      let allOrders = []
      let page = 1
      let hasMore = true
      const pageSize = 1000

      while (hasMore) {
        const response = await getGoodsReceiptReport({
          fromDate: fromDate,
          toDate: toDate,
          pageNumber: page,
          pageSize: pageSize
        })

        // Handle response structure
        let orders = []
        if (response && response.items) {
          orders = Array.isArray(response.items) ? response.items : []
        } else if (response && Array.isArray(response)) {
          orders = response
        }

        allOrders = [...allOrders, ...orders]

        // Check if there are more pages
        const totalCount = response?.totalCount || 0
        if (orders.length === 0 || orders.length < pageSize) {
          hasMore = false
        } else if (totalCount > 0) {
          hasMore = (page * pageSize) < totalCount
        } else {
          hasMore = orders.length >= pageSize
        }
        page++
      }

      setAllPurchaseOrders(allOrders)
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      setAllPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch all sales orders (only date filter on backend, search/sort on frontend)
  const fetchSalesOrders = async () => {
    try {
      setLoading(true)

      // Format dates to YYYY-MM-DD format for API
      const fromDate = dateRange.fromDate ? dayjs(dateRange.fromDate).format('YYYY-MM-DD') : null
      const toDate = dateRange.toDate ? dayjs(dateRange.toDate).format('YYYY-MM-DD') : null

      // Fetch with date range filter on backend, use pagination to get all pages
      let allOrders = []
      let page = 1
      let hasMore = true
      const pageSize = 1000

      while (hasMore) {
        const response = await getGoodsIssueReport({
          fromDate: fromDate,
          toDate: toDate,
          pageNumber: page,
          pageSize: pageSize
        })

        // Handle response structure
        let orders = []
        if (response && response.items) {
          orders = Array.isArray(response.items) ? response.items : []
        } else if (response && Array.isArray(response)) {
          orders = response
        }

        allOrders = [...allOrders, ...orders]

        // Check if there are more pages
        const totalCount = response?.totalCount || 0
        if (orders.length === 0 || orders.length < pageSize) {
          hasMore = false
        } else if (totalCount > 0) {
          hasMore = (page * pageSize) < totalCount
        } else {
          hasMore = orders.length >= pageSize
        }
        page++
      }

      setAllSalesOrders(allOrders)
    } catch (error) {
      console.error("Error fetching sales orders:", error)
      setAllSalesOrders([])
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
    const normalizedSearch = normalize(supplierSearchTerm);
    if (!normalizedSearch) {
      return suppliers
    }
    return suppliers.filter(supplier =>
      normalize(supplier.companyName || '').includes(normalizedSearch)
    )
  }, [suppliers, supplierSearchTerm])

  // Filter retailers based on search term
  const filteredRetailers = useMemo(() => {
    const normalizedSearch = normalize(retailerSearchTerm);
    if (!normalizedSearch) {
      return retailers
    }
    return retailers.filter(retailer =>
      normalize(retailer.retailerName || '').includes(normalizedSearch)
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

  // Reset pagination to page 1 when filters or sort change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }))
  }, [searchQuery, supplierFilter, retailerFilter, dateRange.fromDate, dateRange.toDate, sortField])

  // Fetch data based on active order type and date range (refetch when date range changes)
  useEffect(() => {
    // Reset pagination and filters when changing order type
    setPagination(prev => ({ ...prev, current: 1 }))
    setSupplierFilter("")
    setRetailerFilter("")
    if (activeOrderType === "purchase") {
      fetchPurchaseOrders()
    } else {
      fetchSalesOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrderType, dateRange.fromDate, dateRange.toDate])

  // Filter and sort data on frontend
  useEffect(() => {
    const sourceData = activeOrderType === "purchase" ? allPurchaseOrders : allSalesOrders

    let filtered = [...sourceData]

    // Filter by search query
    const normalizedSearchQuery = normalize(searchQuery);
    if (normalizedSearchQuery) {
      filtered = filtered.filter(order => {
        const supplierName = normalize(order.supplierName || "")
        const retailerName = normalize(order.retailerName || "")
        const goodsCode = normalize(order.goodsCode || "")
        const goodsName = normalize(order.goodsName || "")
        return supplierName.includes(normalizedSearchQuery) ||
          retailerName.includes(normalizedSearchQuery) ||
          goodsCode.includes(normalizedSearchQuery) ||
          goodsName.includes(normalizedSearchQuery)
      })
    }

    // Filter by supplier (for purchase orders)
    if (activeOrderType === "purchase" && supplierFilter) {
      filtered = filtered.filter(order =>
        order.supplierId && order.supplierId.toString() === supplierFilter.toString()
      )
    }

    // Filter by retailer (for sales orders)
    if (activeOrderType === "sales" && retailerFilter) {
      filtered = filtered.filter(order =>
        order.retailerId && order.retailerId.toString() === retailerFilter.toString()
      )
    }

    // Note: Date range filtering is done on backend, so we don't filter by date here

    // Sort data
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue

        if (sortField === "goodsName") {
          aValue = (a.goodsName || "").toLowerCase()
          bValue = (b.goodsName || "").toLowerCase()
        } else if (sortField === "goodsCode") {
          aValue = (a.goodsCode || "").toLowerCase()
          bValue = (b.goodsCode || "").toLowerCase()
        } else if (sortField === "supplierName") {
          aValue = (a.supplierName || "").toLowerCase()
          bValue = (b.supplierName || "").toLowerCase()
        } else if (sortField === "retailerName") {
          aValue = (a.retailerName || "").toLowerCase()
          bValue = (b.retailerName || "").toLowerCase()
        } else if (sortField === "totalPackageQuantity") {
          aValue = a.totalPackageQuantity || 0
          bValue = b.totalPackageQuantity || 0
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

    if (activeOrderType === "purchase") {
      setPurchaseOrders(paginatedData)
    } else {
      setSalesOrders(paginatedData)
    }
  }, [
    activeOrderType,
    allPurchaseOrders,
    allSalesOrders,
    searchQuery,
    supplierFilter,
    retailerFilter,
    sortField,
    sortAscending,
    pagination.current,
    pagination.pageSize
  ])

  // Get current orders based on active type
  const currentOrders = useMemo(() => {
    return activeOrderType === "purchase" ? purchaseOrders : salesOrders
  }, [activeOrderType, purchaseOrders, salesOrders])

  // Transform order data for display
  const displayOrders = useMemo(() => {
    return currentOrders.map((order, index) => {
      if (activeOrderType === "purchase") {
        // GoodsReceiptReport structure
        // Create unique key by combining multiple fields
        const uniqueId = order.goodsId && order.supplierId && order.receiptDate
          ? `${order.goodsId}-${order.supplierId}-${order.receiptDate}-${index}`
          : order.goodsId && order.supplierId
            ? `${order.goodsId}-${order.supplierId}-${index}`
            : order.goodsId
              ? `${order.goodsId}-${index}`
              : order.id
                ? `${order.id}-${index}`
                : `purchase-${index}`

        return {
          id: uniqueId,
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
        // Create unique key by combining multiple fields
        const uniqueId = order.goodsId && order.retailerId && order.issueDate
          ? `${order.goodsId}-${order.retailerId}-${order.issueDate}-${index}`
          : order.goodsId && order.retailerId
            ? `${order.goodsId}-${order.retailerId}-${index}`
            : order.goodsId
              ? `${order.goodsId}-${index}`
              : order.id
                ? `${order.id}-${index}`
                : `sales-${index}`

        return {
          id: uniqueId,
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

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }))
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


  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600"> Báo cáo xuất/nhập kho</h1>
          </div>
          <div className="flex items-center gap-2">
            {activeOrderType === "purchase" ? (
              <ExportPurchaseOrdersReport
                searchQuery={searchQuery}
                supplierFilter={supplierFilter}
                dateRange={dateRange}
                sortField={sortField}
                sortAscending={sortAscending}
              />
            ) : (
              <ExportSalesOrdersReport
                searchQuery={searchQuery}
                retailerFilter={retailerFilter}
                dateRange={dateRange}
                sortField={sortField}
                sortAscending={sortAscending}
              />
            )}
            <PermissionWrapper requiredPermission={activeOrderType === "purchase" ? PERMISSIONS.PURCHASE_ORDER_CREATE : PERMISSIONS.SALES_ORDER_CREATE}>
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
                {activeOrderType === "purchase" ? "Tạo đơn nhập kho" : "Tạo đơn xuất kho"}
              </Button>
            </PermissionWrapper>
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
                  Nhập kho
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Xuất kho
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
                    placeholder="Tìm kiếm theo nhà cung cấp, mã hàng hóa, tên hàng hóa..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm truncate"
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
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${retailerFilter === retailer.retailerId.toString()
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
                      className="w-[150px] h-[38px]"
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
                      className="w-[150px] h-[38px]"
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-8">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-left min-w-[100px]">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("goodsCode")}>
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-left w-40">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("goodsName")}>
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-left w-40">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort(activeOrderType === "purchase" ? "supplierName" : "retailerName")}>
                          <span>{activeOrderType === "purchase" ? "Nhà cung cấp" : "Nhà bán lẻ"}</span>
                          {sortField === (activeOrderType === "purchase" ? "supplierName" : "retailerName") ? (
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[120px]">
                        {/* {activeOrderType === "purchase" ? "Ngày nhập" : "Ngày xuất"} */}
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort(activeOrderType === "purchase" ? "receiptDate" : "issueDate")}>
                          <span>{activeOrderType === "purchase" ? "Ngày nhập" : "Ngày xuất"}</span>
                          {sortField === (activeOrderType === "purchase" ? "receiptDate" : "issueDate") ? (
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[140px]">
                        Đơn vị/thùng
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[110px]">
                        <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("totalPackageQuantity")}>
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
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[130px]">
                        Tổng số đơn vị
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[110px]">
                        Đơn vị tính
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayOrders.length === 0 ? (
                      <EmptyState
                        icon={Package}
                        title="Không tìm thấy đơn hàng nào"
                        description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                        colSpan={10}
                      />
                    ) : (
                      displayOrders.map((order, index) => {
                        const stt = (pagination.current - 1) * pagination.pageSize + index + 1
                        return (
                          <TableRow
                            key={order.id}
                            className="hover:bg-slate-50 border-b border-slate-200"
                          >
                            <TableCell className="px-2 py-4 text-center text-slate-700">
                              {stt}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-slate-700 font-medium">
                              {order.goodsCode}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-slate-700">
                              <div className="font-medium break-words">
                                {order.goodsName}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-slate-700">
                              <p className="max-w-[150px] truncate" title={activeOrderType === "purchase" ? order.supplierName : order.retailerName}>
                                {activeOrderType === "purchase" ? order.supplierName : order.retailerName}
                              </p>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center text-slate-700">
                              {activeOrderType === "purchase"
                                ? (order.receiptDate ? dayjs(order.receiptDate).format('DD/MM/YYYY') : '-')
                                : (order.issueDate ? dayjs(order.issueDate).format('DD/MM/YYYY') : '-')
                              }
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center text-slate-700">
                              {order.unitPerPackage || '-'}
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
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

