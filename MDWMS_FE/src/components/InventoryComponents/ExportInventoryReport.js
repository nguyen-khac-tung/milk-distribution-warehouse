import { Download } from "lucide-react"
import { Button } from "../ui/button"
import { getInventoryReport } from "../../services/DashboardService"
import * as XLSX from "xlsx"
import dayjs from "dayjs"

/**
 * Helper function to format date
 */
const formatDate = (dateString) => {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}

/**
 * Helper function to check if item is expired
 */
const isExpired = (expiryDate) => {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  return expiry < today
}

/**
 * Helper function to check if item is expiring soon
 */
const isExpiringSoon = (expiryDate, daysThreshold = 30) => {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  // Sắp hết hạn: còn từ 0 đến daysThreshold ngày (và chưa hết hạn)
  return diffDays >= 0 && diffDays <= daysThreshold
}

/**
 * Export Inventory Report Component
 * 
 * @param {Object} props
 * @param {string} props.searchQuery - Search query string
 * @param {string} props.areaId - Selected area ID
 * @param {string} props.timeRange - Time range filter (week, month, year)
 * @param {string} props.sortField - Field to sort by
 * @param {boolean} props.sortAscending - Sort direction
 * @param {Function} props.onExportStart - Optional callback when export starts
 * @param {Function} props.onExportComplete - Optional callback when export completes
 * @param {Function} props.onExportError - Optional callback when export fails
 */
export default function ExportInventoryReport({
  searchQuery = "",
  areaId = "",
  timeRange = "week",
  sortField = "batchCode",
  sortAscending = true,
  onExportStart,
  onExportComplete,
  onExportError
}) {
  const handleExport = async () => {
    try {
      // Hiển thị loading
      if (window.showToast) {
        window.showToast("Đang xuất báo cáo...", "info")
      }

      // Callback khi bắt đầu export
      if (onExportStart) {
        onExportStart()
      }

      // Fetch tất cả dữ liệu để export (không phân trang)
      const filters = {}
      if (timeRange) {
        filters.timeRange = timeRange
      }

      const requestParams = {
        areaId: areaId ? parseInt(areaId) : undefined,
        pageNumber: 1,
        pageSize: 10000, // Lấy tất cả dữ liệu
        search: searchQuery || "",
        sortField: sortField,
        sortAscending: sortAscending,
        filters
      }

      const response = await getInventoryReport(requestParams)

      let allData = []
      if (response && response.items) {
        allData = Array.isArray(response.items) ? response.items : []
      } else if (response && Array.isArray(response)) {
        allData = response
      }

      if (!allData || allData.length === 0) {
        if (window.showToast) {
          window.showToast("Không có dữ liệu để xuất báo cáo", "warning")
        }
        if (onExportError) {
          onExportError(new Error("Không có dữ liệu để xuất báo cáo"))
        }
        return
      }

      // Chuẩn bị dữ liệu cho Excel với tiêu đề tiếng Việt
      const excelData = allData.map((item, index) => {
        const expired = isExpired(item.expiryDate)
        const expiringSoon = isExpiringSoon(item.expiryDate, 30)

        let statusText = "Còn hạn"
        if (expired) {
          statusText = "Hết hạn"
        } else if (expiringSoon) {
          statusText = "Sắp hết hạn"
        }

        return {
          "STT": index + 1,
          "Mã sản phẩm": item.goodsCode || "-",
          "Tên sản phẩm": item.goodName || "-",
          "Đơn vị/thùng": item.unitPerPackage || "-",
          "Đơn vị": item.unitOfMeasure || "-",
          "Mã lô": item.batchCode || "-",
          "Ngày sản xuất": item.manufacturingDate ? formatDate(item.manufacturingDate) : "-",
          "Ngày hết hạn": item.expiryDate ? formatDate(item.expiryDate) : "-",
          "Số lượng thùng": item.totalPackageQuantity || 0,
          "Trạng thái": statusText
        }
      })

      // Tạo workbook và worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo tồn kho")

      // Đặt độ rộng cột
      const columnWidths = [
        { wch: 5 },   // STT
        { wch: 15 },  // Mã sản phẩm
        { wch: 30 },  // Tên sản phẩm
        { wch: 12 },  // Đơn vị/thùng
        { wch: 10 },  // Đơn vị
        { wch: 15 },  // Mã lô
        { wch: 15 },  // Ngày sản xuất
        { wch: 15 },  // Ngày hết hạn
        { wch: 15 },  // Số lượng thùng
        { wch: 15 }   // Trạng thái
      ]
      worksheet['!cols'] = columnWidths

      // Tạo tên file với ngày tháng
      const fileName = `Bao_cao_ton_kho_${dayjs().format('DDMMYYYY_HHmmss')}.xlsx`

      // Xuất file
      XLSX.writeFile(workbook, fileName)

      if (window.showToast) {
        window.showToast("Xuất báo cáo Excel thành công!", "success")
      }

      // Callback khi hoàn thành export
      if (onExportComplete) {
        onExportComplete(fileName)
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      if (window.showToast) {
        window.showToast("Có lỗi xảy ra khi xuất báo cáo", "error")
      }
      if (onExportError) {
        onExportError(error)
      }
    }
  }

  return (
    <Button
      className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
      onClick={handleExport}
    >
      <Download className="h-4 w-4 mr-2" />
      Xuất báo cáo
    </Button>
  )
}

