import { useEffect, useMemo, useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { useNavigate } from "react-router-dom"
import { getInventoryReport } from "../../services/DashboardService"

export default function WarehousePerformance() {
  const navigate = useNavigate()
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true)
        const response = await getInventoryReport({
          pageNumber: 1,
          pageSize: 500
        })

        if (Array.isArray(response)) {
          setInventoryData(response)
        } else if (Array.isArray(response?.items)) {
          setInventoryData(response.items)
        } else {
          setInventoryData([])
        }
      } catch (error) {
        console.error("Error fetching inventory summary:", error)
        setInventoryData([])
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryData()
  }, [])

  const summary = useMemo(() => calculateInventorySummary(inventoryData), [inventoryData])

  return (
    <Card className="h-full">
      <CardHeader className="relative p-4 pb-2 flex flex-col items-center gap-2 text-center">
        <Button
          variant="default"
          className="absolute right-4 top-4 whitespace-nowrap bg-orange-500 hover:bg-orange-600 text-white font-medium h-[38px] px-5 rounded-full shadow-sm"
          onClick={() => navigate("/reports/inventory")}
        >
          Xem báo cáo
        </Button>
        <CardTitle className="text-base font-medium">Tồn kho hiện tại</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Đang tải dữ liệu tồn kho...</div>
        ) : summary.totalLots === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">Không có dữ liệu tồn kho</div>
        ) : (
          <div className="space-y-6">
            <InventoryHighlights summary={summary} />
            <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-700">Phân bố trạng thái lô</p>
              </div>
              <StatusPieChart data={summary.statusData} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const InventoryHighlights = ({ summary }) => {
  const cards = [
    {
      label: "Tổng số lô",
      value: summary.totalLots.toLocaleString("vi-VN"),
      subLabel: "lô hàng"
    },
    {
      label: "Tổng số thùng",
      value: summary.totalQuantity.toLocaleString("vi-VN"),
      subLabel: "thùng"
    },
    {
      label: "Lô hết hạn",
      value: summary.statusData.expired.toLocaleString("vi-VN"),
      subLabel: "cần xử lý",
      accent: "text-red-600"
    },
    {
      label: "Sắp hết hạn",
      value: summary.statusData.expiringSoon.toLocaleString("vi-VN"),
      subLabel: "trong 30 ngày",
      accent: "text-orange-600"
    }
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((item, index) => (
        <div
          key={index}
          className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col gap-2"
        >
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-semibold text-slate-800 ${item.accent || ""}`}>{item.value}</p>
            <span className="text-xs text-slate-500">{item.subLabel}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const StatusPieChart = ({ data }) => {
  const { expired, expiringSoon, valid } = data
  const total = expired + expiringSoon + valid

  if (total === 0) {
    return <div className="text-center text-gray-500 py-8">Không có dữ liệu</div>
  }

  const size = 200
  const outerRadius = 80
  const innerRadius = 55
  const center = size / 2

  const segments = [
    { value: expired, color: "#ef4444", label: "Hết hạn" },
    { value: expiringSoon, color: "#f97316", label: "Sắp hết hạn" },
    { value: valid, color: "#22c55e", label: "Còn hạn" }
  ]

  const paths = []
  let cumulativeAngle = -90

  segments.forEach((segment, index) => {
    if (segment.value === 0) return
    const angle = (segment.value / total) * 360
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    cumulativeAngle = endAngle
    const largeArcFlag = angle > 180 ? 1 : 0
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = center + outerRadius * Math.cos(startRad)
    const y1 = center + outerRadius * Math.sin(startRad)
    const x2 = center + outerRadius * Math.cos(endRad)
    const y2 = center + outerRadius * Math.sin(endRad)
    const x3 = center + innerRadius * Math.cos(endRad)
    const y3 = center + innerRadius * Math.sin(endRad)
    const x4 = center + innerRadius * Math.cos(startRad)
    const y4 = center + innerRadius * Math.sin(startRad)

    paths.push(
      <path
        key={segment.label}
        d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`}
        fill={segment.color}
        stroke="white"
        strokeWidth="2"
        className="transition-all duration-300 ease-out hover:opacity-80"
      />
    )
  })

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-semibold text-slate-700">{total}</p>
          <p className="text-xs text-slate-500">lô hàng</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2 w-full">
        {segments.map(segment => (
          <div key={segment.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }}></span>
              <span className="text-slate-600">{segment.label}</span>
            </div>
            <div className="text-slate-700 font-semibold">
              {segment.value} ({((segment.value / total) * 100).toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const calculateInventorySummary = (data) => {
  const summary = {
    totalLots: data?.length || 0,
    totalQuantity: 0,
    statusData: { expired: 0, expiringSoon: 0, valid: 0 }
  }

  if (!Array.isArray(data) || data.length === 0) return summary

  data.forEach(item => {
    const quantity = Number(item.totalPackageQuantity) || 0
    summary.totalQuantity += quantity

    if (isExpired(item.expiryDate)) {
      summary.statusData.expired += 1
    } else if (isExpiringSoon(item.expiryDate)) {
      summary.statusData.expiringSoon += 1
    } else {
      summary.statusData.valid += 1
    }
  })

  return summary
}

const isExpired = (expiryDate) => {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  return expiry < today
}

const isExpiringSoon = (expiryDate, daysThreshold = 30) => {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= daysThreshold
}

