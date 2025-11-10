"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Plus,
  Edit,
  ChevronDown,
  ShoppingCart,
  Package,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { getPurchaseOrderSaleManagers, getPurchaseOrderSaleRepresentatives, getPurchaseOrderWarehouseManagers, getPurchaseOrderWarehouseStaff } from "../../services/PurchaseOrderService"
import { getSalesOrderListSaleManager, getSalesOrderListSalesRepresentatives, getSalesOrderListWarehouseManager, getSalesOrderListWarehouseStaff } from "../../services/SalesOrderService"
import { PERMISSIONS } from "../../utils/permissions"
import { usePermissions } from "../../hooks/usePermissions"
import Loading from "../../components/Common/Loading"
import StatusDisplay, { PURCHASE_ORDER_STATUS, STATUS_LABELS as PO_STATUS_LABELS } from "../../components/PurchaseOrderComponents/StatusDisplay"
import StatusDisplaySaleOrder, { STATUS_LABELS as SO_STATUS_LABELS, SALE_ORDER_STATUS } from "../../components/SaleOrderCompoents/StatusDisplaySaleOrder"
import Pagination from "../../components/Common/Pagination"

export default function OrdersPage({ onClose }) {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const [activeOrderType, setActiveOrderType] = useState("purchase") // "purchase" or "sales"
  const [activeStatusTab, setActiveStatusTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // Map status tab to status number
  const getStatusFilter = () => {
    if (activeStatusTab === "all") return null
    if (activeOrderType === "purchase") {
      const statusMap = {
        "processing": PURCHASE_ORDER_STATUS.Receiving, // Đang tiếp nhận
        "completed": PURCHASE_ORDER_STATUS.Completed, // Đã nhập kho
        "shipping": PURCHASE_ORDER_STATUS.GoodsReceived, // Đã giao đến
        "pending": PURCHASE_ORDER_STATUS.PendingApproval, // Chờ duyệt
      }
      return statusMap[activeStatusTab]
    } else {
      const statusMap = {
        "processing": SALE_ORDER_STATUS.Picking, // Đang lấy hàng
        "completed": SALE_ORDER_STATUS.Completed, // Đã xuất kho
        "shipping": SALE_ORDER_STATUS.AssignedForPicking, // Đã phân công
        "pending": SALE_ORDER_STATUS.PendingApproval, // Chờ duyệt
      }
      return statusMap[activeStatusTab]
    }
  }

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const statusFilter = getStatusFilter()
      const params = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        search: searchQuery,
        filters: {
          ...(statusFilter && { status: statusFilter })
        }
      }

      let response
      if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_SM)) {
        response = await getPurchaseOrderSaleManagers(params)
      } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WM)) {
        response = await getPurchaseOrderWarehouseManagers(params)
      } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_WS)) {
        response = await getPurchaseOrderWarehouseStaff(params)
      } else if (hasPermission(PERMISSIONS.PURCHASE_ORDER_VIEW_RS)) {
        response = await getPurchaseOrderSaleRepresentatives(params)
      } else {
        response = await getPurchaseOrderSaleRepresentatives(params)
      }

      if (response?.data?.items) {
        setPurchaseOrders(response.data.items)
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount || 0
        }))
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      setPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch sales orders
  const fetchSalesOrders = async () => {
    try {
      setLoading(true)
      const statusFilter = getStatusFilter()
      const params = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        search: searchQuery,
        filters: {
          ...(statusFilter && { status: statusFilter })
        }
      }

      let response
      if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SM)) {
        response = await getSalesOrderListSaleManager(params)
      } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WM)) {
        response = await getSalesOrderListWarehouseManager(params)
      } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_WS)) {
        response = await getSalesOrderListWarehouseStaff(params)
      } else if (hasPermission(PERMISSIONS.SALES_ORDER_VIEW_SR)) {
        response = await getSalesOrderListSalesRepresentatives(params)
      } else {
        response = await getSalesOrderListSalesRepresentatives(params)
      }

      if (response?.data?.items) {
        setSalesOrders(response.data.items)
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount || 0
        }))
      }
    } catch (error) {
      console.error("Error fetching sales orders:", error)
      setSalesOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch data based on active order type
  useEffect(() => {
    // Reset pagination when changing order type or status
    setPagination(prev => ({ ...prev, current: 1 }))
  }, [activeOrderType, activeStatusTab])

  useEffect(() => {
    if (activeOrderType === "purchase") {
      fetchPurchaseOrders()
    } else {
      fetchSalesOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrderType, activeStatusTab, searchQuery, pagination.current, pagination.pageSize])

  // Get current orders based on active type
  const currentOrders = useMemo(() => {
    return activeOrderType === "purchase" ? purchaseOrders : salesOrders
  }, [activeOrderType, purchaseOrders, salesOrders])

  // Transform order data for display
  const displayOrders = useMemo(() => {
    return currentOrders.map(order => {
      if (activeOrderType === "purchase") {
        // Purchase order structure
        const details = order.purchaseOrderDetails || []
        const productNames = details.map(detail => detail.goodsName || detail.goods?.goodsName || "").filter(Boolean)
        return {
          id: order.purchaseOrderId || order.purchaseOderId || order.id,
          orderId: order.purchaseOrderCode || order.code || "",
          customerName: order.supplierName || order.supplier?.companyName || order.supplier?.name || "",
          phone: order.supplierPhone || order.supplier?.phone || "",
          quantity: order.totalQuantity || details.reduce((sum, d) => sum + (d.packageQuantity || 0), 0),
          productType: productNames.join(", ") || "N/A",
          status: order.status,
          createdAt: order.createdAt || "",
        }
      } else {
        // Sales order structure
        const details = order.salesOrderItemDetails || []
        const productNames = details.map(detail => detail.goodsName || detail.goods?.goodsName || "").filter(Boolean)
        return {
          id: order.salesOrderId || order.id,
          orderId: order.salesOrderCode || order.code || "",
          customerName: order.retailerName || order.retailer?.companyName || order.retailer?.name || "",
          phone: order.retailerPhone || order.retailer?.phone || "",
          quantity: order.totalQuantity || details.reduce((sum, d) => sum + (d.packageQuantity || 0), 0),
          productType: productNames.join(", ") || "N/A",
          status: order.status,
          createdAt: order.createdAt || "",
        }
      }
    })
  }, [currentOrders, activeOrderType])

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Đơn hàng</h2>
          <p className="text-sm text-gray-500">Quản lý đơn mua hàng và đơn bán hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white"
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
              variant="ghost"
              onClick={onClose}
              className="text-gray-600"
            >
              Đóng
            </Button>
          )}
        </div>
      </div>

        {/* Main Tabs: Purchase Orders vs Sales Orders */}
        <Card>
          <CardHeader className="p-4 pb-2">
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
          </CardHeader>
          <CardContent className="p-4">
            {/* Status Tabs */}
            <div className="mb-4">
              <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="w-full">
                <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="all"
                    className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Tất cả
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Chờ duyệt
                  </TabsTrigger>
                  <TabsTrigger
                    value="processing"
                    className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {activeOrderType === "purchase" ? "Đang tiếp nhận" : "Đang lấy hàng"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="shipping"
                    className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {activeOrderType === "purchase" ? "Đã giao đến" : "Đã phân công"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {activeOrderType === "purchase" ? "Đã nhập kho" : "Đã xuất kho"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-[400px] text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

              {/* Orders Table */}
              {loading ? (
                <Loading />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          <div className="flex items-center">
                            {activeOrderType === "purchase" ? "NHÀ CUNG CẤP" : "KHÁCH HÀNG"} <ChevronDown className="h-4 w-4 ml-1" />
                          </div>
                        </TableHead>
                        <TableHead className="whitespace-nowrap">MÃ ĐƠN HÀNG</TableHead>
                        <TableHead className="whitespace-nowrap">SỐ LƯỢNG</TableHead>
                        <TableHead className="whitespace-nowrap">LOẠI SẢN PHẨM</TableHead>
                        <TableHead className="whitespace-nowrap">TRẠNG THÁI</TableHead>
                        <TableHead className="whitespace-nowrap">THAO TÁC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            Không có đơn hàng nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-3">
                                  <AvatarFallback>
                                    {order.customerName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{order.customerName}</p>
                                  {order.phone && (
                                    <p className="text-xs text-gray-500">{order.phone}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{order.orderId}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={order.productType}>
                                {order.productType}
                              </div>
                            </TableCell>
                            <TableCell>
                              {activeOrderType === "purchase" ? (
                                <StatusDisplay status={order.status} />
                              ) : (
                                <StatusDisplaySaleOrder status={order.status} />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => {
                                    if (activeOrderType === "purchase") {
                                      navigate(`/purchase-orders/${order.id}`)
                                    } else {
                                      navigate(`/sales-orders/${order.id}`)
                                    }
                                  }}
                                  title="Xem chi tiết"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            {!loading && pagination.total > 0 && (
              <div className="mt-4">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}

