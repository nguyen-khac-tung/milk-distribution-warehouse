import { useState, useEffect, useRef, useMemo } from "react"
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
import { ChevronDown } from "lucide-react"
import { getStocktakingListForWarehouseManager } from "../../services/StocktakingService"
import { getGoodsReceiptReport, getGoodsIssueReport } from "../../services/DashboardService"
import dayjs from "dayjs"

export default function WarehouseEventCalendar() {
  const navigate = useNavigate()
  const [calendarEvents, setCalendarEvents] = useState([])
  const [allEvents, setAllEvents] = useState([]) // Store all fetched events
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDateEventsModal, setShowDateEventsModal] = useState(false)
  const [viewMode, setViewMode] = useState("month") // "month", "week", "day"
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch all calendar events (fetch all data, then filter by view mode)
  useEffect(() => {
    const fetchAllCalendarEvents = async () => {
      try {
        const events = []

        // Fetch stocktaking events - get all with large pageSize
        let stocktakingPage = 1
        let hasMoreStocktaking = true
        while (hasMoreStocktaking) {
          const stocktakingParams = {
            pageNumber: stocktakingPage,
            pageSize: 1000,
            filters: {}
          }

          const stocktakingResponse = await getStocktakingListForWarehouseManager(stocktakingParams).catch(() => ({ data: { items: [], totalCount: 0 } }))

          if (stocktakingResponse?.data?.items) {
            stocktakingResponse.data.items.forEach(item => {
              if (item.startTime) {
                try {
                  const eventDate = dayjs(item.startTime).startOf("day")
                  if (eventDate.isValid()) {
                    events.push({
                      date: eventDate.date(),
                      type: "stocktaking",
                      title: `Kiểm kê: ${item.stocktakingSheetId?.substring(0, 8) || "N/A"}`,
                      description: item.note || "Phiếu kiểm kê",
                      fullDate: eventDate.format("YYYY-MM-DD"),
                      orderId: item.stocktakingSheetId,
                      eventDate: eventDate
                    })
                  }
                } catch (error) {
                  console.error("Error parsing stocktaking date:", error, item)
                }
              }
            })

            const totalCount = stocktakingResponse?.data?.totalCount || 0
            const itemsCount = stocktakingResponse.data.items.length
            const fetchedCount = stocktakingPage * 1000

            // Stop if no more items or if we've fetched all items
            if (itemsCount === 0 || itemsCount < 1000) {
              hasMoreStocktaking = false
            } else if (totalCount > 0) {
              hasMoreStocktaking = fetchedCount < totalCount
            } else {
              // If no totalCount, stop if we got less than pageSize items
              hasMoreStocktaking = itemsCount >= 1000
            }
            stocktakingPage++
          } else {
            hasMoreStocktaking = false
          }
        }

        // Fetch purchase orders (nhập hàng) using getGoodsReceiptReport
        // Fetch with a wide date range (1 year ago to 1 year ahead) to get all data
        const fromDate = dayjs().subtract(1, "year").format("YYYY-MM-DD")
        const toDate = dayjs().add(1, "year").format("YYYY-MM-DD")

        const [receiptsResponse, issuesResponse] = await Promise.all([
          getGoodsReceiptReport({ fromDate, toDate }).catch(() => []),
          getGoodsIssueReport({ fromDate, toDate }).catch(() => [])
        ])

        // Handle response structure - normalize data
        const normalizeData = (response) => {
          if (Array.isArray(response)) return response
          if (response?.items && Array.isArray(response.items)) return response.items
          if (response?.data && Array.isArray(response.data)) return response.data
          if (response?.data?.items && Array.isArray(response.data.items)) return response.data.items
          return []
        }

        const receiptsList = normalizeData(receiptsResponse)
        const issuesList = normalizeData(issuesResponse)

        // Add purchase order events (goods receipts) - based on receiptDate
        receiptsList.forEach(receipt => {
          if (receipt.receiptDate) {
            try {
              const eventDate = dayjs(receipt.receiptDate).startOf("day")
              if (eventDate.isValid()) {
                events.push({
                  date: eventDate.date(),
                  type: "purchase",
                  title: `Nhập: ${receipt.goodsCode || receipt.goodsId || "N/A"}`,
                  description: receipt.supplierName || receipt.goodsName || "Đơn mua hàng",
                  fullDate: eventDate.format("YYYY-MM-DD"),
                  orderId: receipt.goodsId || receipt.id,
                  eventDate: eventDate
                })
              }
            } catch (error) {
              console.error("Error parsing receipt date:", error, receipt)
            }
          }
        })

        // Add sales order events (goods issues) - based on issueDate
        issuesList.forEach(issue => {
          if (issue.issueDate) {
            try {
              const eventDate = dayjs(issue.issueDate).startOf("day")
              if (eventDate.isValid()) {
                events.push({
                  date: eventDate.date(),
                  type: "sales",
                  title: `Xuất: ${issue.goodsCode || issue.goodsId || "N/A"}`,
                  description: issue.retailerName || issue.goodsName || "Đơn bán hàng",
                  fullDate: eventDate.format("YYYY-MM-DD"),
                  orderId: issue.goodsId || issue.id,
                  eventDate: eventDate
                })
              }
            } catch (error) {
              console.error("Error parsing issue date:", error, issue)
            }
          }
        })

        // Sort events by date
        events.sort((a, b) => {
          const dateA = dayjs(a.fullDate)
          const dateB = dayjs(b.fullDate)
          return dateA.diff(dateB)
        })

        setAllEvents(events)
      } catch (error) {
        console.error("Error fetching calendar events:", error)
        setAllEvents([])
      }
    }

    fetchAllCalendarEvents()
  }, []) // Only fetch once on mount

  // Filter events based on view mode
  useEffect(() => {
    let filteredEvents = []

    if (viewMode === "month") {
      // Filter events for current month
      filteredEvents = allEvents.filter(event => {
        if (!event.eventDate) return false
        return event.eventDate.month() === currentMonth.month() &&
          event.eventDate.year() === currentMonth.year()
      })
    } else if (viewMode === "week") {
      // Filter events for current week (Sunday to Saturday)
      const startOfWeek = currentMonth.startOf("week") // Sunday
      const endOfWeek = currentMonth.endOf("week") // Saturday

      filteredEvents = allEvents.filter(event => {
        if (!event.eventDate) return false
        const eventDay = event.eventDate.startOf("day")
        const startDay = startOfWeek.startOf("day")
        const endDay = endOfWeek.startOf("day")
        return (eventDay.isAfter(startDay, "day") || eventDay.isSame(startDay, "day")) &&
          (eventDay.isBefore(endDay, "day") || eventDay.isSame(endDay, "day"))
      })
    } else if (viewMode === "day") {
      // Filter events for current day
      filteredEvents = allEvents.filter(event => {
        if (!event.eventDate) return false
        return event.eventDate.isSame(currentMonth, "day")
      })
    }

    setCalendarEvents(filteredEvents)
  }, [allEvents, viewMode, currentMonth])

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

  const getNavigationLabel = () => {
    if (viewMode === "month") {
      return currentMonth.format("MM/YYYY")
    } else if (viewMode === "week") {
      const startOfWeek = currentMonth.startOf("week")
      const endOfWeek = currentMonth.endOf("week")
      return `${startOfWeek.format("DD/MM")} - ${endOfWeek.format("DD/MM/YYYY")}`
    } else if (viewMode === "day") {
      return currentMonth.format("DD/MM/YYYY")
    }
    return currentMonth.format("MM/YYYY")
  }

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentMonth(prev => prev.subtract(1, "month"))
    } else if (viewMode === "week") {
      setCurrentMonth(prev => prev.subtract(1, "week"))
    } else if (viewMode === "day") {
      setCurrentMonth(prev => prev.subtract(1, "day"))
    }
  }

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentMonth(prev => prev.add(1, "month"))
    } else if (viewMode === "week") {
      setCurrentMonth(prev => prev.add(1, "week"))
    } else if (viewMode === "day") {
      setCurrentMonth(prev => prev.add(1, "day"))
    }
  }

  // Memoize selected date events to ensure they update when selectedDate or allEvents change
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate || allEvents.length === 0) {
      return []
    }

    // Normalize selected date to start of day and format to YYYY-MM-DD for comparison
    const selectedDateNormalized = selectedDate.startOf("day")
    const selectedDateStr = selectedDateNormalized.format("YYYY-MM-DD")

    // Filter from allEvents to show all events for the selected date
    let events = allEvents.filter(e => {
      if (!e.fullDate && !e.eventDate) {
        return false
      }

      // Get event date string - always normalize to YYYY-MM-DD format
      let eventDateStr
      if (e.fullDate) {
        // fullDate might be a string or dayjs object
        if (typeof e.fullDate === 'string') {
          // Parse string and normalize to start of day
          const parsedDate = dayjs(e.fullDate).startOf("day")
          if (!parsedDate.isValid()) {
            return false
          }
          eventDateStr = parsedDate.format("YYYY-MM-DD")
        } else {
          // It's a dayjs object
          eventDateStr = dayjs(e.fullDate).startOf("day").format("YYYY-MM-DD")
        }
      } else if (e.eventDate) {
        // eventDate is a dayjs object
        eventDateStr = e.eventDate.startOf("day").format("YYYY-MM-DD")
      } else {
        return false
      }

      // Strict comparison - must match exactly
      return eventDateStr === selectedDateStr
    })

    // Sort events by time (if available) or by type
    events.sort((a, b) => {
      if (a.eventDate && b.eventDate) {
        return a.eventDate.diff(b.eventDate)
      }
      // If no eventDate, sort by type
      const typeOrder = { stocktaking: 1, purchase: 2, sales: 3 }
      return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0)
    })

    return events
  }, [selectedDate, allEvents])

  // Helper function to filter events for a specific date - used for both counting and rendering
  const getEventsForDate = (targetDate) => {
    if (!targetDate || allEvents.length === 0) {
      return []
    }

    const targetDateStr = targetDate.startOf("day").format("YYYY-MM-DD")

    const filtered = allEvents.filter(e => {
      if (!e.fullDate && !e.eventDate) {
        return false
      }

      let eventDateStr
      if (e.fullDate) {
        if (typeof e.fullDate === 'string') {
          const parsed = dayjs(e.fullDate).startOf("day")
          if (!parsed.isValid()) {
            return false
          }
          eventDateStr = parsed.format("YYYY-MM-DD")
        } else {
          eventDateStr = dayjs(e.fullDate).startOf("day").format("YYYY-MM-DD")
        }
      } else if (e.eventDate) {
        eventDateStr = e.eventDate.startOf("day").format("YYYY-MM-DD")
      } else {
        return false
      }

      return eventDateStr === targetDateStr
    })

    // Sort events
    filtered.sort((a, b) => {
      if (a.eventDate && b.eventDate) {
        return a.eventDate.diff(b.eventDate)
      }
      const typeOrder = { stocktaking: 1, purchase: 2, sales: 3 }
      return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0)
    })

    return filtered
  }

  const getEventListTitle = () => {
    // If a date is selected, show events for that specific date
    if (selectedDate) {
      return `Sự kiện trong ngày ${selectedDate.format("DD/MM/YYYY")}`
    }

    // Otherwise, show events based on viewMode
    if (viewMode === "month") {
      return `Sự kiện trong tháng ${currentMonth.format("MM/YYYY")}`
    } else if (viewMode === "week") {
      const startOfWeek = currentMonth.startOf("week")
      const endOfWeek = currentMonth.endOf("week")
      return `Sự kiện trong tuần ${startOfWeek.format("DD/MM")} - ${endOfWeek.format("DD/MM/YYYY")}`
    } else if (viewMode === "day") {
      return `Sự kiện trong ngày ${currentMonth.format("DD/MM/YYYY")}`
    }
    return "Sự kiện"
  }

  // Get events to display in the list below calendar
  const displayEvents = useMemo(() => {
    // If a date is selected, show only events for that date
    if (selectedDate) {
      return selectedDateEvents
    }

    // Otherwise, show events based on viewMode (calendarEvents)
    return calendarEvents
  }, [selectedDate, selectedDateEvents, calendarEvents])

  const getViewModeLabel = () => {
    switch (viewMode) {
      case "month":
        return "Tháng"
      case "week":
        return "Tuần"
      case "day":
        return "Ngày"
      default:
        return "Tháng"
    }
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    setDropdownOpen(false)
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Lịch sự kiện kho</CardTitle>
            <div ref={dropdownRef} className="relative">
              <Button
                variant="outline"
                className="h-8 w-[120px] text-xs justify-between"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>{getViewModeLabel()}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md">
                  <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleViewModeChange("month")}
                  >
                    Tháng
                  </div>
                  <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleViewModeChange("week")}
                  >
                    Tuần
                  </div>
                  <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleViewModeChange("day")}
                  >
                    Ngày
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-sm font-medium">
              {getNavigationLabel()}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {viewMode === "month" && (
            <>
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
                          const clickedDate = currentMonth.date(day).startOf("day")
                          // Update selectedDate to filter the list below
                          setSelectedDate(clickedDate)
                          // Optionally open modal (user can close it and still see filtered list)
                          setTimeout(() => {
                            setShowDateEventsModal(true)
                          }, 0)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            const clickedDate = currentMonth.date(day).startOf("day")
                            setSelectedDate(clickedDate)
                            setTimeout(() => {
                              setShowDateEventsModal(true)
                            }, 0)
                          }
                        }}
                        className={`py-1 px-1 relative w-full text-center rounded transition-colors border border-transparent touch-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${isToday ? "bg-orange-100 border-orange-200" : ""
                          } ${dayEvents.length > 0
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
            </>
          )}

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
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">
                {getEventListTitle()}
              </h4>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    setSelectedDate(null)
                    setShowDateEventsModal(false)
                  }}
                >
                  Xem tất cả
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-3">
              ({selectedDate
                ? getEventsForDate(selectedDate).length
                : displayEvents.length} sự kiện)
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(() => {
                // Always use verified events when selectedDate is set
                if (selectedDate) {
                  const verifiedEvents = getEventsForDate(selectedDate)
                  const selectedDateStr = selectedDate.startOf("day").format("YYYY-MM-DD")

                  // Double-check: Filter again to ensure no wrong dates slip through
                  const finalEvents = verifiedEvents.filter(e => {
                    if (!e.fullDate && !e.eventDate) return false

                    let eventDateStr
                    if (e.fullDate) {
                      if (typeof e.fullDate === 'string') {
                        const parsed = dayjs(e.fullDate).startOf("day")
                        if (!parsed.isValid()) return false
                        eventDateStr = parsed.format("YYYY-MM-DD")
                      } else {
                        eventDateStr = dayjs(e.fullDate).startOf("day").format("YYYY-MM-DD")
                      }
                    } else if (e.eventDate) {
                      eventDateStr = e.eventDate.startOf("day").format("YYYY-MM-DD")
                    } else {
                      return false
                    }

                    return eventDateStr === selectedDateStr
                  })

                  // CRITICAL: Only render finalEvents, nothing else
                  if (finalEvents.length === 0) {
                    return <p className="text-xs text-gray-500">Không có sự kiện</p>
                  }

                  return finalEvents.map((event, index) => {
                    // Create a truly unique key by combining all unique identifiers
                    const uniqueKey = `selected-${selectedDateStr}-${index}-${event.type}-${event.orderId || 'no-id'}-${event.fullDate || 'no-date'}-${event.title?.substring(0, 20) || 'no-title'}`

                    return (
                      <div
                        key={uniqueKey}
                        className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                        onClick={() => {
                          if (event.fullDate) {
                            const eventDate = dayjs(event.fullDate).startOf("day")
                            setSelectedDate(eventDate)
                          }
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full ${getEventColor(event.type)} mt-1.5 flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.fullDate ? dayjs(event.fullDate).format("DD/MM/YYYY") : `Ngày ${event.date}`} • {getEventTypeLabel(event.type)} • {event.description}
                          </p>
                        </div>
                      </div>
                    )
                  })
                }

                // Normal rendering when no date selected
                return displayEvents.length > 0 ? (
                  displayEvents.map((event, index) => {
                    // Create a truly unique key
                    const uniqueKey = `display-${index}-${event.type}-${event.orderId || 'no-id'}-${event.fullDate || 'no-date'}-${event.title?.substring(0, 20) || 'no-title'}`

                    return (
                      <div
                        key={uniqueKey}
                        className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                        onClick={() => {
                          if (event.fullDate) {
                            const eventDate = dayjs(event.fullDate).startOf("day")
                            setSelectedDate(eventDate)
                          }
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full ${getEventColor(event.type)} mt-1.5 flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.fullDate ? dayjs(event.fullDate).format("DD/MM/YYYY") : `Ngày ${event.date}`} • {getEventTypeLabel(event.type)} • {event.description}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-gray-500">Không có sự kiện</p>
                )
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Events Modal */}
      <Dialog open={showDateEventsModal} onOpenChange={setShowDateEventsModal}>
        <DialogContent className="sm:max-w-[500px]" key={selectedDate ? selectedDate.format("YYYY-MM-DD") : "no-date"}>
          <DialogHeader>
            <DialogTitle>
              Sự kiện ngày {selectedDate ? selectedDate.format("DD/MM/YYYY") : ""}
            </DialogTitle>
            <DialogDescription>
              Danh sách các sự kiện kho trong ngày này
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {selectedDate ? (
              selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Không có sự kiện nào trong ngày này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((event, index) => {
                    // Create a truly unique key for modal
                    const modalUniqueKey = `modal-${selectedDate?.format("YYYY-MM-DD") || 'no-date'}-${index}-${event.type}-${event.orderId || 'no-id'}-${event.fullDate || 'no-date'}-${event.title?.substring(0, 20) || 'no-title'}`

                    return (
                      <div
                        key={modalUniqueKey}
                        onClick={() => handleEventClick(event)}
                        className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${event.orderId ? "hover:shadow-md" : ""
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
                    )
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Vui lòng chọn ngày</p>
              </div>
            )}
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

