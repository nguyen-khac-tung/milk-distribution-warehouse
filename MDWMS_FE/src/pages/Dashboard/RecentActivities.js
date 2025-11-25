import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, ShoppingCart, Package } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { getGoodsReceiptReport, getGoodsIssueReport } from "../../services/DashboardService"
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
  const navigate = useNavigate()
  const [recentActivities, setRecentActivities] = useState([])
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false)

  // Fetch recent warehouse activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setRecentActivitiesLoading(true)

        // Get date range for last 7 days
        const toDate = dayjs().format('YYYY-MM-DD')
        const fromDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD')

        // Fetch recent receipts and issues
        const [receipts, issues] = await Promise.all([
          getGoodsReceiptReport({ fromDate, toDate }).catch(() => []),
          getGoodsIssueReport({ fromDate, toDate }).catch(() => [])
        ])

        // Handle response structure
        const normalizeData = (response) => {
          if (Array.isArray(response)) return response
          if (response?.items && Array.isArray(response.items)) return response.items
          if (response?.data && Array.isArray(response.data)) return response.data
          if (response?.data?.items && Array.isArray(response.data.items)) return response.data.items
          return []
        }

        const receiptsList = normalizeData(receipts)
        const issuesList = normalizeData(issues)

        const activities = []

        // Add receipts (purchase orders)
        receiptsList.forEach(receipt => {
          activities.push({
            type: "purchase",
            id: receipt.goodsId || receipt.id,
            code: receipt.goodsCode || `GR-${receipt.goodsId}`,
            goodsName: receipt.goodsName || "",
            date: receipt.receiptDate || receipt.createdAt,
            supplierName: receipt.supplierName || "",
            purchaseOrderId: receipt.purchaseOderId || receipt.purchaseOrderId,
          })
        })

        // Add issues (sales orders)
        issuesList.forEach(issue => {
          activities.push({
            type: "sales",
            id: issue.goodsId || issue.id,
            code: issue.goodsCode || `GI-${issue.goodsId}`,
            goodsName: issue.goodsName || "",
            date: issue.issueDate || issue.createdAt,
            retailerName: issue.retailerName || "",
            salesOrderId: issue.salesOderId || issue.salesOrderId,
          })
        })

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

              const handleClick = () => {
                if (isPurchase && activity.purchaseOrderId) {
                  navigate(`/goods-receipt-notes/${activity.purchaseOrderId}`)
                } else if (!isPurchase && activity.salesOrderId) {
                  navigate(`/goods-issue-note-detail/${activity.salesOrderId}`)
                }
              }

              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={handleClick}
                >
                  <div className={`p-2 rounded-full ${isPurchase ? "bg-blue-100" : "bg-green-100"}`}>
                    {isPurchase ? (
                      <ShoppingCart className={`h-4 w-4 ${isPurchase ? "text-blue-600" : "text-green-600"}`} />
                    ) : (
                      <Package className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isPurchase && activity.purchaseOrderId && (
                      <p className="text-xs font-semibold text-gray-800 mb-1">
                        Mã đơn mua: {activity.purchaseOrderId}
                      </p>
                    )}
                    {!isPurchase && activity.salesOrderId && (
                      <p className="text-xs font-semibold text-gray-800 mb-1">
                        Mã đơn bán: {activity.salesOrderId}
                      </p>
                    )}
                    {activity.goodsName && (
                      <p className="text-xs text-gray-600 mt-0.5 truncate">
                        {activity.goodsName}
                      </p>
                    )}
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

