import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Badge } from "../../components/ui/badge"
import { getStocktakingListForWarehouseManager } from "../../services/StocktakingService"
import { getPurchaseOrderWarehouseManagers } from "../../services/PurchaseOrderService"
import { getSalesOrderListWarehouseManager } from "../../services/SalesOrderService"
import dayjs from "dayjs"

export default function WarehouseEventCalendar() {
  const navigate = useNavigate()
  const [calendarEvents, setCalendarEvents] = useState([])
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDateEventsModal, setShowDateEventsModal] = useState(false)

  // Fetch calendar events (stocktaking, purchase orders, sales orders)
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        // Fetch events for current month
        const startOfMonth = currentMonth.startOf("month")
        const endOfMonth = currentMonth.endOf("month")
        const startOfMonthStr = startOfMonth.format("YYYY-MM-DD")
        const endOfMonthStr = endOfMonth.format("YYYY-MM-DD")
        
        const events = []
        
        // Fetch stocktaking events
        const stocktakingParams = {
          pageNumber: 1,
          pageSize: 50,
          filters: {
            startTimeFrom: startOfMonthStr,
            startTimeTo: endOfMonthStr
          }
        }
        
        const stocktakingResponse = await getStocktakingListForWarehouseManager(stocktakingParams).catch(() => ({ data: { items: [] } }))
        
        // Add stocktaking events
        if (stocktakingResponse?.data?.items) {
          stocktakingResponse.data.items.forEach(item => {
            if (item.startTime) {
              try {
                const eventDate = dayjs(item.startTime)
                if (eventDate.isValid()) {
                  // Only add if in current month
                  if (eventDate.month() === currentMonth.month() && eventDate.year() === currentMonth.year()) {
                    events.push({
                      date: eventDate.date(),
                      type: "stocktaking",
                      title: `Kiểm kê: ${item.stocktakingSheetId?.substring(0, 8) || "N/A"}`,
                      description: item.note || "Phiếu kiểm kê",
                      fullDate: eventDate.format("YYYY-MM-DD"),
                      orderId: item.stocktakingSheetId
                    })
                  }
                }
              } catch (error) {
                console.error("Error parsing stocktaking date:", error, item)
              }
            }
          })
        }
        
        // Fetch purchase orders (nhập hàng)
        const purchaseParams = {
          pageNumber: 1,
          pageSize: 100,
          search: "",
          filters: {}
        }
        
        const purchaseResponse = await getPurchaseOrderWarehouseManagers(purchaseParams).catch(() => ({ data: { items: [] } }))
        
        // Add purchase order events (based on EstimatedTimeArrival)
        if (purchaseResponse?.data?.items) {
          purchaseResponse.data.items.forEach(order => {
            if (order.estimatedTimeArrival) {
              try {
                const eventDate = dayjs(order.estimatedTimeArrival)
                if (eventDate.isValid()) {
                  // Only add if in current month
                  if (eventDate.month() === currentMonth.month() && eventDate.year() === currentMonth.year()) {
                    events.push({
                      date: eventDate.date(),
                      type: "purchase",
                      title: `Nhập: ${order.purchaseOrderCode || order.purchaseOrderId || "N/A"}`,
                      description: order.supplierName || "Đơn mua hàng",
                      fullDate: eventDate.format("YYYY-MM-DD"),
                      orderId: order.purchaseOrderId
                    })
                  }
                }
              } catch (error) {
                console.error("Error parsing purchase order date:", error, order)
              }
            }
          })
        }
        
        // Fetch sales orders (xuất hàng)
        const salesParams = {
          pageNumber: 1,
          pageSize: 100,
          search: "",
          filters: {}
        }
        
        const salesResponse = await getSalesOrderListWarehouseManager(salesParams).catch(() => ({ data: { items: [] } }))
        
        // Add sales order events (based on EstimatedTimeDeparture)
        if (salesResponse?.data?.items) {
          salesResponse.data.items.forEach(order => {
            if (order.estimatedTimeDeparture) {
              try {
                const eventDate = dayjs(order.estimatedTimeDeparture)
                if (eventDate.isValid()) {
                  // Only add if in current month
                  if (eventDate.month() === currentMonth.month() && eventDate.year() === currentMonth.year()) {
                    events.push({
                      date: eventDate.date(),
                      type: "sales",
                      title: `Xuất: ${order.salesOrderCode || order.salesOrderId || "N/A"}`,
                      description: order.retailerName || "Đơn bán hàng",
                      fullDate: eventDate.format("YYYY-MM-DD"),
                      orderId: order.salesOrderId
                    })
                  }
                }
              } catch (error) {
                console.error("Error parsing sales order date:", error, order)
              }
            }
          })
        }
        
        // Sort events by date
        events.sort((a, b) => {
          const dateA = dayjs(a.fullDate)
          const dateB = dayjs(b.fullDate)
          return dateA.diff(dateB)
        })
        
        setCalendarEvents(events)
      } catch (error) {
        console.error("Error fetching calendar events:", error)
        setCalendarEvents([])
      }
    }

    fetchCalendarEvents()
  }, [currentMonth])

  const getEventColor = (type) => {
    switch (type) {
      case "stocktaking":
        return "bg-orange-500"
      case "purchase":
        return "bg-blue-500"
      case "sales":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getEventTypeLabel = (type) => {
    switch (type) {
      case "stocktaking":
        return "Kiểm kê"
      case "purchase":
        return "Nhập hàng"
      case "sales":
        return "Xuất hàng"
      default:
        return "Sự kiện"
    }
  }

  const handleEventClick = (event) => {
    if (!event.orderId) return
    
    if (event.type === "stocktaking") {
      navigate(`/stocktakings/${event.orderId}`)
    } else if (event.type === "purchase") {
      navigate(`/purchase-orders/${event.orderId}`)
    } else if (event.type === "sales") {
      navigate(`/sales-orders/${event.orderId}`)
    }
    setShowDateEventsModal(false)
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-medium">Lịch sự kiện kho</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentMonth(prev => prev.subtract(1, "month"))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-sm font-medium">
              {currentMonth.format("MM/YYYY")}
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentMonth(prev => prev.add(1, "month"))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            <div className="py-1 font-medium text-gray-600">CN</div>
            <div className="py-1 font-medium text-gray-600">T2</div>
            <div className="py-1 font-medium text-gray-600">T3</div>
            <div className="py-1 font-medium text-gray-600">T4</div>
            <div className="py-1 font-medium text-gray-600">T5</div>
            <div className="py-1 font-medium text-gray-600">T6</div>
            <div className="py-1 font-medium text-gray-600">T7</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {(() => {
              const firstDayOfMonth = currentMonth.startOf("month")
              const lastDayOfMonth = currentMonth.endOf("month")
              const daysInMonth = lastDayOfMonth.date()
              const startingDayOfWeek = firstDayOfMonth.day()
              const days = []
              
              // Add empty cells for days before month starts
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(<div key={`empty-${i}`} className="py-1 text-gray-400"></div>)
              }
              
              // Add days of month
              for (let day = 1; day <= daysInMonth; day++) {
                const currentDayDate = currentMonth.date(day)
                const currentDayDateStr = currentDayDate.format("YYYY-MM-DD")
                // Filter events by full date string for accurate matching
                const dayEvents = calendarEvents.filter(e => {
                  if (!e.fullDate) return false
                  return e.fullDate === currentDayDateStr
                })
                const isToday = currentDayDate.isSame(dayjs(), "day")
                
                // Count event types for this day
                const stocktakingCount = dayEvents.filter(e => e.type === "stocktaking").length
                const purchaseCount = dayEvents.filter(e => e.type === "purchase").length
                const salesCount = dayEvents.filter(e => e.type === "sales").length
                
                days.push(
                  <button
                    key={day}
                    type="button"
                    tabIndex={0}
                    aria-label={`Chọn ngày ${day} tháng ${currentMonth.month() + 1}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const clickedDate = currentMonth.date(day)
                      setSelectedDate(clickedDate)
                      setShowDateEventsModal(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        e.stopPropagation()
                        const clickedDate = currentMonth.date(day)
                        setSelectedDate(clickedDate)
                        setShowDateEventsModal(true)
                      }
                    }}
                    className={`py-1 px-1 relative w-full text-center rounded transition-colors border border-transparent touch-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                      isToday ? "bg-orange-100 border-orange-200" : ""
                    } ${
                      dayEvents.length > 0 
                        ? "hover:bg-blue-50 hover:border-blue-200 cursor-pointer active:bg-blue-100" 
                        : "hover:bg-gray-50 hover:border-gray-200 cursor-pointer active:bg-gray-100"
                    }`}
                    style={{ 
                      minHeight: "32px",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      pointerEvents: "auto"
                    }}
                  >
                    <span className={isToday ? "font-bold text-orange-600" : "text-slate-700"}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-0.5 pointer-events-none z-10"
                      >
                        {stocktakingCount > 0 && (
                          <span className="w-1 h-1 bg-orange-500 rounded-full" title={`${stocktakingCount} kiểm kê`}></span>
                        )}
                        {purchaseCount > 0 && (
                          <span className="w-1 h-1 bg-blue-500 rounded-full" title={`${purchaseCount} nhập`}></span>
                        )}
                        {salesCount > 0 && (
                          <span className="w-1 h-1 bg-green-500 rounded-full" title={`${salesCount} xuất`}></span>
                        )}
                      </div>
                    )}
                  </button>
                )
              }
              
              return days
            })()}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="text-gray-600">Kiểm kê</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-gray-600">Nhập</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-600">Xuất</span>
            </div>
          </div>

          <div className="mt-6 border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">
              Sự kiện trong tháng {currentMonth.format("MM/YYYY")}
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              ({calendarEvents.length} sự kiện)
            </p>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {calendarEvents.length > 0 ? (
                calendarEvents.slice(0, 5).map((event, index) => {
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full ${getEventColor(event.type)} mt-1.5 flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ngày {event.date} • {getEventTypeLabel(event.type)} • {event.description}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-gray-500">Không có sự kiện</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Events Modal */}
      <Dialog open={showDateEventsModal} onOpenChange={setShowDateEventsModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Sự kiện ngày {selectedDate ? selectedDate.format("DD/MM/YYYY") : ""}
            </DialogTitle>
            <DialogDescription>
              Danh sách các sự kiện kho trong ngày này
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {selectedDate && (() => {
              // Format selected date to YYYY-MM-DD for comparison
              const selectedDateStr = selectedDate.format("YYYY-MM-DD")
              
              const selectedDateEvents = calendarEvents.filter(e => {
                if (!e.fullDate) return false
                // Compare using string format YYYY-MM-DD
                return e.fullDate === selectedDateStr
              })

              if (selectedDateEvents.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <p>Không có sự kiện nào trong ngày này</p>
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                  {selectedDateEvents.map((event, index) => (
                    <div
                      key={index}
                      onClick={() => handleEventClick(event)}
                      className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                        event.orderId ? "hover:shadow-md" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)} mt-1 flex-shrink-0`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">
                              {event.title}
                            </p>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {event.description}
                          </p>
                          {event.fullDate && (
                            <p className="text-xs text-gray-400 mt-1">
                              {dayjs(event.fullDate).format("DD/MM/YYYY HH:mm")}
                            </p>
                          )}
                          {event.orderId && (
                            <p className="text-xs text-blue-600 mt-2">
                              Click để xem chi tiết →
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDateEventsModal(false)}
              className="h-[38px] px-6"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

