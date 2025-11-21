import { useState, useEffect } from "react"
import { AlertTriangle, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { getInventoryReport } from "../../services/DashboardService"
import dayjs from "dayjs"

export default function ExpiringProducts() {
  const [expiringProducts, setExpiringProducts] = useState([])
  const [expiringProductsLoading, setExpiringProductsLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState("30")

  // Mapping for display text
  const daysOptions = {
    "30": "Trong 30 ngày",
    "40": "Trong 40 ngày",
    "50": "Trong 50 ngày"
  }

  // Fetch expiring products based on selected days
  useEffect(() => {
    const fetchExpiringProducts = async () => {
      try {
        setExpiringProductsLoading(true)
        const days = parseInt(selectedDays)
        const targetDate = dayjs().add(days, "day").format("YYYY-MM-DD")
        const today = dayjs().format("YYYY-MM-DD")

        const params = {
          pageNumber: 1,
          pageSize: 100, // Get more items to filter client-side
          search: "",
          filters: {
            expiryDateFrom: today,
            expiryDateTo: targetDate
          }
        }

        const data = await getInventoryReport(params)

        // Filter and sort by expiry date - only show products that expire within selected days range
        if (data?.items && Array.isArray(data.items)) {
          const todayDate = dayjs().startOf("day")
          const targetDateObj = dayjs().add(days, "day").endOf("day")

          const expiring = data.items
            .filter(item => {
              if (!item.expiryDate) return false
              const expiryDate = dayjs(item.expiryDate).startOf("day")
              // Only include products that expire within the selected days range
              // expiryDate should be >= today and <= today + selectedDays
              return (expiryDate.isAfter(todayDate) || expiryDate.isSame(todayDate, "day")) &&
                (expiryDate.isBefore(targetDateObj) || expiryDate.isSame(targetDateObj, "day"))
            })
            .sort((a, b) => {
              const dateA = dayjs(a.expiryDate)
              const dateB = dayjs(b.expiryDate)
              return dateA.diff(dateB)
            })
            .slice(0, 5)

          setExpiringProducts(expiring)
        } else {
          setExpiringProducts([])
        }
      } catch (error) {
        console.error("Error fetching expiring products:", error)
        setExpiringProducts([])
      } finally {
        setExpiringProductsLoading(false)
      }
    }

    fetchExpiringProducts()
  }, [selectedDays])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Sản phẩm sắp hết hạn
        </CardTitle>
        <Select value={selectedDays} onValueChange={setSelectedDays}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <span className="flex-1 text-left">
              {daysOptions[selectedDays] || "Trong 30 ngày"}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Trong 30 ngày</SelectItem>
            <SelectItem value="40">Trong 40 ngày</SelectItem>
            <SelectItem value="50">Trong 50 ngày</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-4">
        {expiringProductsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : expiringProducts.length > 0 ? (
          <div className="space-y-3">
            {expiringProducts.map((product, index) => {
              const daysUntilExpiry = dayjs(product.expiryDate).diff(dayjs(), "day")
              const isUrgent = daysUntilExpiry <= 7
              const isWarning = daysUntilExpiry <= 14

              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {product.goodsName || product.goodName || product.productName || "Sản phẩm"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {product.goodsCode && (
                        <p className="text-xs text-gray-500">
                          Mã: {product.goodsCode}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Lô: {product.batchCode || product.batchNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isUrgent ? "text-red-600" : isWarning ? "text-amber-600" : "text-blue-600"}`}>
                      {daysUntilExpiry > 0 ? `Còn ${daysUntilExpiry} ngày` : "Đã hết hạn"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {dayjs(product.expiryDate).format("DD/MM/YYYY")}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            Không có sản phẩm sắp hết hạn
          </div>
        )}
      </CardContent>
    </Card>
  )
}

