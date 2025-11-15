import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { getInventoryReport } from "../../services/DashboardService"
import dayjs from "dayjs"

export default function ExpiringProducts() {
  const [expiringProducts, setExpiringProducts] = useState([])
  const [expiringProductsLoading, setExpiringProductsLoading] = useState(false)

  // Fetch expiring products (within 30 days)
  useEffect(() => {
    const fetchExpiringProducts = async () => {
      try {
        setExpiringProductsLoading(true)
        // Get inventory report and filter by expiry date
        const thirtyDaysFromNow = dayjs().add(30, "day").format("YYYY-MM-DD")
        const today = dayjs().format("YYYY-MM-DD")
        
        const params = {
          pageNumber: 1,
          pageSize: 5, // Top 5 expiring products
          search: "",
          filters: {
            expiryDateFrom: today,
            expiryDateTo: thirtyDaysFromNow
          }
        }
        
        const data = await getInventoryReport(params)
        
        // Filter and sort by expiry date
        if (data?.items && Array.isArray(data.items)) {
          const expiring = data.items
            .filter(item => item.expiryDate)
            .sort((a, b) => {
              const dateA = dayjs(a.expiryDate)
              const dateB = dayjs(b.expiryDate)
              return dateA.diff(dateB)
            })
            .slice(0, 5)
          
          setExpiringProducts(expiring)
        } else {
          // Mock data if no API data
          setExpiringProducts([
            { goodsName: "Sữa tươi nguyên chất", batchCode: "BATCH001", expiryDate: dayjs().add(5, "day").format("YYYY-MM-DD"), quantity: 120 },
            { goodsName: "Sữa chua Hy Lạp", batchCode: "BATCH002", expiryDate: dayjs().add(10, "day").format("YYYY-MM-DD"), quantity: 85 },
            { goodsName: "Phô mai Mozzarella", batchCode: "BATCH003", expiryDate: dayjs().add(15, "day").format("YYYY-MM-DD"), quantity: 200 },
            { goodsName: "Bơ thực vật", batchCode: "BATCH004", expiryDate: dayjs().add(20, "day").format("YYYY-MM-DD"), quantity: 150 },
            { goodsName: "Sữa đặc có đường", batchCode: "BATCH005", expiryDate: dayjs().add(25, "day").format("YYYY-MM-DD"), quantity: 300 },
          ])
        }
      } catch (error) {
        console.error("Error fetching expiring products:", error)
        // Mock data on error
        setExpiringProducts([
          { goodsName: "Sữa tươi nguyên chất", batchCode: "BATCH001", expiryDate: dayjs().add(5, "day").format("YYYY-MM-DD"), quantity: 120 },
          { goodsName: "Sữa chua Hy Lạp", batchCode: "BATCH002", expiryDate: dayjs().add(10, "day").format("YYYY-MM-DD"), quantity: 85 },
        ])
      } finally {
        setExpiringProductsLoading(false)
      }
    }

    fetchExpiringProducts()
  }, [])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Sản phẩm sắp hết hạn
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          Trong 30 ngày
        </Badge>
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

