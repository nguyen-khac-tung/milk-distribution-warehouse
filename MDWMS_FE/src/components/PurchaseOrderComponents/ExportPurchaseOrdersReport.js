import { Download } from "lucide-react"
import { Button } from "../ui/button"
import { getGoodsReceiptReport } from "../../services/DashboardService"
import * as XLSX from "xlsx"
import dayjs from "dayjs"

/**
 * Helper function to format date
 */
const formatDate = (dateString) => {
    if (!dateString) return "-"
    return dayjs(dateString).format('DD/MM/YYYY')
}

/**
 * Export Purchase Orders Report Component
 * 
 * @param {Object} props
 * @param {string} props.searchQuery - Search query string
 * @param {string} props.supplierFilter - Selected supplier ID
 * @param {string} props.dateRange - Date range object with fromDate and toDate
 * @param {string} props.sortField - Field to sort by
 * @param {boolean} props.sortAscending - Sort direction
 * @param {Function} props.onExportStart - Optional callback when export starts
 * @param {Function} props.onExportComplete - Optional callback when export completes
 * @param {Function} props.onExportError - Optional callback when export fails
 */
export default function ExportPurchaseOrdersReport({
    searchQuery = "",
    supplierFilter = "",
    dateRange = {
        fromDate: dayjs().startOf('month').format('YYYY-MM-DD'),
        toDate: dayjs().endOf('month').format('YYYY-MM-DD')
    },
    sortField = "",
    sortAscending = true,
    onExportStart,
    onExportComplete,
    onExportError
}) {
    const handleExport = async () => {
        try {
            // Hiển thị loading
            if (window.showToast) {
                window.showToast("Đang xuất báo cáo đơn mua hàng...", "info")
            }

            // Callback khi bắt đầu export
            if (onExportStart) {
                onExportStart()
            }

            // Format dates to YYYY-MM-DD format for API
            const fromDate = dateRange.fromDate ? dayjs(dateRange.fromDate).format('YYYY-MM-DD') : null
            const toDate = dateRange.toDate ? dayjs(dateRange.toDate).format('YYYY-MM-DD') : null

            // Build filters for backend
            const filters = {}
            if (supplierFilter) {
                filters.supplierId = supplierFilter.toString()
            }

            // Fetch tất cả dữ liệu (không phân trang) - fetch nhiều lần nếu cần
            let allData = []
            let currentPage = 1
            const pageSize = 1000 // Fetch từng batch 1000 items
            let hasMoreData = true

            while (hasMoreData) {
                const requestParams = {
                    fromDate: fromDate,
                    toDate: toDate,
                    pageNumber: currentPage,
                    pageSize: pageSize,
                    search: searchQuery || "",
                    sortField: sortField || "",
                    sortAscending: sortAscending,
                    filters: filters
                }

                const response = await getGoodsReceiptReport(requestParams)

                // Handle response structure - API returns PageResult
                let pageData = []
                if (response && response.items) {
                    pageData = Array.isArray(response.items) ? response.items : []
                } else if (response && Array.isArray(response)) {
                    pageData = response
                } else if (response && response.data && Array.isArray(response.data)) {
                    pageData = response.data
                } else if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
                    pageData = response.data.items
                }

                if (pageData && pageData.length > 0) {
                    allData = [...allData, ...pageData]

                    // Kiểm tra xem còn dữ liệu không
                    const totalCount = response.totalCount || 0
                    const totalPages = response.totalPages || 1
                    hasMoreData = currentPage < totalPages && pageData.length === pageSize
                    currentPage++
                } else {
                    hasMoreData = false
                }
            }

            // Apply client-side filters if needed (backup) - chỉ khi backend chưa filter
            let filteredData = allData
            if (searchQuery && searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase()
                filteredData = allData.filter(order => {
                    const supplierName = (order.supplierName || '').toLowerCase()
                    const goodsCode = (order.goodsCode || '').toLowerCase()
                    const goodsName = (order.goodsName || '').toLowerCase()
                    return supplierName.includes(query) || goodsCode.includes(query) || goodsName.includes(query)
                })
            }

            if (supplierFilter) {
                filteredData = filteredData.filter(order => {
                    return order.supplierId && order.supplierId.toString() === supplierFilter
                })
            }

            if (!filteredData || filteredData.length === 0) {
                if (window.showToast) {
                    window.showToast("Không có dữ liệu để xuất báo cáo", "warning")
                }
                if (onExportError) {
                    onExportError(new Error("Không có dữ liệu để xuất báo cáo"))
                }
                return
            }

            // Chuẩn bị dữ liệu cho Excel với tiêu đề tiếng Việt
            const excelData = filteredData.map((item, index) => {
                return {
                    "STT": index + 1,
                    "Nhà cung cấp": item.supplierName || "-",
                    "Mã đơn mua hàng": item.purchaseOderId || "-",
                    "Mã hàng hóa": item.goodsCode || "-",
                    "Tên hàng hóa": item.goodsName || "-",
                    "Số thùng": item.totalPackageQuantity || 0,
                    "Tổng số đơn vị": item.totalUnitQuantity || 0,
                    "Đơn vị tính": item.unitOfMeasure || "-",
                    "Đơn vị/thùng": item.unitPerPackage || "-",
                    "Ngày nhập": item.receiptDate ? formatDate(item.receiptDate) : "-"
                }
            })

            // Tạo workbook và worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo đơn mua hàng")

            // Đặt độ rộng cột
            const columnWidths = [
                { wch: 5 },   // STT
                { wch: 25 },  // Nhà cung cấp
                { wch: 18 },  // Mã đơn mua hàng
                { wch: 15 },  // Mã hàng hóa
                { wch: 30 },  // Tên hàng hóa
                { wch: 12 },  // Số thùng
                { wch: 15 },  // Tổng số đơn vị
                { wch: 12 },  // Đơn vị tính
                { wch: 12 },  // Đơn vị/thùng
                { wch: 15 }   // Ngày nhập
            ]
            worksheet['!cols'] = columnWidths

            // Tạo tên file với ngày tháng
            const fileName = `Bao_cao_don_mua_hang_${dayjs().format('DDMMYYYY_HHmmss')}.xlsx`

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

