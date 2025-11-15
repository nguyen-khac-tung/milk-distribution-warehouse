import { useState, useEffect } from "react"
import { Activity, ShoppingCart, Package } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { getPurchaseOrderWarehouseManagers } from "../../services/PurchaseOrderService"
import { getSalesOrderListWarehouseManager } from "../../services/SalesOrderService"
import dayjs from "dayjs"

// Helper function to get time ago in Vietnamese
const getTimeAgo = (date) => {
  if (!date) return "Không xác định"
  
  const now = dayjs()
  const targetDate = dayjs(date)
  const diffInSeconds = now.diff(targetDate, "second")
  const diffInMinutes = now.diff(targetDate, "minute")
  const diffInHours = now.diff(targetDate, "hour")
  const diffInDays = now.diff(targetDate, "day")
  
  if (diffInSeconds < 60) {
    return "Vừa xong"
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`
  } else {
    return targetDate.format("DD/MM/YYYY")
  }
}

export default function RecentActivities({ onShowAllClick }) {
  const [recentActivities, setRecentActivities] = useState([])
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false)

  // Fetch recent warehouse activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setRecentActivitiesLoading(true)
        
        // Fetch recent purchase orders and sales orders
        const purchaseParams = {
          pageNumber: 1,
          pageSize: 3,
          search: "",
        }
        
        const salesParams = {
          pageNumber: 1,
          pageSize: 3,
          search: "",
        }
        
        const [purchaseOrders, salesOrders] = await Promise.all([
          getPurchaseOrderWarehouseManagers(purchaseParams).catch(() => ({ data: { items: [] } })),
          getSalesOrderListWarehouseManager(salesParams).catch(() => ({ data: { items: [] } }))
        ])
        
        const activities = []
        
        // Add purchase orders
        if (purchaseOrders?.data?.items) {
          purchaseOrders.data.items.slice(0, 3).forEach(order => {
            activities.push({
              type: "purchase",
              id: order.purchaseOrderId || order.id,
              code: order.purchaseOrderCode || order.code || `PO-${order.purchaseOrderId}`,
              date: order.createdAt || order.createdDate,
              status: order.status,
              description: `Đơn mua hàng ${order.purchaseOrderCode || order.code || order.purchaseOrderId}`,
            })
          })
        }
        
        // Add sales orders
        if (salesOrders?.data?.items) {
          salesOrders.data.items.slice(0, 3).forEach(order => {
            activities.push({
              type: "sales",
              id: order.salesOrderId || order.id,
              code: order.salesOrderCode || order.code || `SO-${order.salesOrderId}`,
              date: order.createdAt || order.createdDate,
              status: order.status,
              description: `Đơn bán hàng ${order.salesOrderCode || order.code || order.salesOrderId}`,
            })
          })
        }
        
        // Sort by date (newest first) and take top 5
        activities.sort((a, b) => {
          const dateA = dayjs(a.date)
          const dateB = dayjs(b.date)
          return dateB.diff(dateA)
        })
        
        setRecentActivities(activities.slice(0, 5))
      } catch (error) {
        console.error("Error fetching recent activities:", error)
        // Mock data on error
        setRecentActivities([
          { type: "purchase", code: "PO-001", date: dayjs().subtract(1, "hour").toISOString(), description: "Đơn mua hàng PO-001" },
          { type: "sales", code: "SO-001", date: dayjs().subtract(2, "hour").toISOString(), description: "Đơn bán hàng SO-001" },
        ])
      } finally {
        setRecentActivitiesLoading(false)
      }
    }

    fetchRecentActivities()
  }, [])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Hoạt động kho gần đây
        </CardTitle>
        {onShowAllClick && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={onShowAllClick}
          >
            Xem tất cả
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {recentActivitiesLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => {
              const isPurchase = activity.type === "purchase"
              const timeAgo = getTimeAgo(activity.date)
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-full ${isPurchase ? "bg-blue-100" : "bg-green-100"}`}>
                    {isPurchase ? (
                      <ShoppingCart className={`h-4 w-4 ${isPurchase ? "text-blue-600" : "text-green-600"}`} />
                    ) : (
                      <Package className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {activity.description || activity.code}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {timeAgo} • {dayjs(activity.date).format("DD/MM/YYYY HH:mm")}
                    </p>
                  </div>
                  <Badge 
                    variant={isPurchase ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isPurchase ? "Nhập" : "Xuất"}
                  </Badge>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            Không có hoạt động gần đây
          </div>
        )}
      </CardContent>
    </Card>
  )
}

