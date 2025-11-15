"use client"

import { useState, useEffect, useRef } from "react"
import {
  Download,
  Eye,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { getInventoryReport } from "../../services/DashboardService"
import { getAreaDropdown } from "../../services/AreaServices"
import Loading from "../../components/Common/Loading"
import Pagination from "../../components/Common/Pagination"
import { Badge } from "../../components/ui/badge"
import InventorySearchFilter from "../../components/Common/InventorySearchFilter"

export default function InventoryReport({ onClose }) {
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [areaId, setAreaId] = useState("")
  const [areas, setAreas] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [timeRange, setTimeRange] = useState("week") // week, month, year
  const searchTimeoutRef = useRef(null)

  // Fetch areas for dropdown
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await getAreaDropdown()
        let areasList = []
        if (Array.isArray(response)) {
          areasList = response
        } else if (response?.data) {
          areasList = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        } else if (response?.items) {
          areasList = response.items
        }
        setAreas(areasList)
      } catch (error) {
        console.error("Error fetching areas:", error)
        setAreas([])
      }
    }
    fetchAreas()
  }, [])

  // Initial load on component mount
  useEffect(() => {
    fetchInventoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch data when search or filters change (with debounce for search)
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Reset to page 1 when search or filters change
    setPagination(prev => ({ ...prev, current: 1 }))

    const fetchData = () => {
      fetchInventoryData()
    }

    // Debounce search queries (500ms), immediate for other changes
    if (searchQuery && searchQuery.trim() !== "") {
      searchTimeoutRef.current = setTimeout(fetchData, 500)
    } else {
      // Immediate fetch for empty search, timeRange, areaId changes
      fetchData()
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, timeRange, areaId])

  // Fetch data when pagination changes
  useEffect(() => {
    fetchInventoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      
      // Build filters object - include timeRange (areaId is passed as query parameter, not in filters)
      const filters = {}
      if (timeRange) {
        filters.timeRange = timeRange
      }

      const requestParams = {
        areaId: areaId ? parseInt(areaId) : undefined, // Convert to integer for query parameter
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        search: searchQuery || "",
        sortField: "batchCode",
        sortAscending: true,
        filters
      }


      const response = await getInventoryReport(requestParams)
      
      if (response && response.items) {
        // Handle response with items array (even if empty)
        const itemsArray = Array.isArray(response.items) ? response.items : []
        setInventoryData(itemsArray)
        setPagination(prev => ({
          ...prev,
          total: response.totalCount || itemsArray.length || 0
        }))
      } else if (response && Array.isArray(response)) {
        // Handle case where response is directly an array
        setInventoryData(response)
        setPagination(prev => ({
          ...prev,
          total: response.length || 0
        }))
      } else {
        setInventoryData([])
        setPagination(prev => ({ ...prev, total: 0 }))
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setInventoryData([])
      setPagination(prev => ({ ...prev, total: 0 }))
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }))
  }

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ ...prev, pageSize: size, current: 1 }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    return expiry < today
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export inventory report")
  }

  const handleViewClick = (item) => {
    // TODO: Implement view detail functionality
    console.log("View inventory detail:", item)
    // Could navigate to batch detail page or show modal
  }

  const handleClearAllFilters = () => {
    setSearchQuery("")
    setTimeRange("week")
    setAreaId("")
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Báo cáo tồn kho</h1>
            <p className="text-slate-600 mt-1">Theo dõi tồn kho chi tiết theo lô</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
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

        {/* Inventory Table */}
        <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <InventorySearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Tìm kiếm theo mã lô, tên sản phẩm..."
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          timeRangeOptions={[
            { value: "week", label: "Tuần này" },
            { value: "month", label: "Tháng này" },
            { value: "year", label: "Năm nay" }
          ]}
          areaId={areaId}
          setAreaId={setAreaId}
          areas={areas}
          onClearAll={handleClearAllFilters}
          showClearButton={true}
          showToggle={true}
          defaultOpen={true}
          searchWidth="w-80"
        />
        <div className="w-full">
          {loading ? (
            <div className="p-8">
              <Loading />
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-16">
                      STT
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                      Mã sản phẩm
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                      Tên sản phẩm
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                      Mã lô
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                      Ngày sản xuất
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                      Ngày hết hạn
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-right">
                      Số lượng thùng
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                      Số pallet
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center">
                      Số vị trí
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                      Hoạt động
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                        Không có dữ liệu tồn kho
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventoryData.map((item, index) => {
                      const rowNumber = (pagination.current - 1) * pagination.pageSize + index + 1
                      const expired = isExpired(item.expiryDate)

                      return (
                        <TableRow
                          key={item.batchId || index}
                          className="hover:bg-slate-50 border-b border-slate-200"
                        >
                          <TableCell className="px-6 py-4 text-slate-600 font-medium">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">
                            {item.goodsCode || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">
                            {item.goodName || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">
                            {item.batchCode || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">
                            {formatDate(item.manufacturingDate)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">
                            <div className="flex items-center gap-2">
                              <span>{formatDate(item.expiryDate)}</span>
                              {expired && (
                                <Badge variant="destructive" className="text-xs">
                                  Hết hạn
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 text-right font-medium">
                            {item.totalPackageQuantity?.toLocaleString("vi-VN") || 0}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {item.palletIds?.length || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {item.locationCodes?.length || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Xem chi tiết"
                                onClick={() => handleViewClick(item)}
                              >
                                <Eye className="h-4 w-4 text-orange-500" />
                              </button>
                            </div>
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
              onPageSizeChange={handlePageSizeChange}
              showPageSize={true}
              pageSizeOptions={[10, 20, 30, 50]}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
