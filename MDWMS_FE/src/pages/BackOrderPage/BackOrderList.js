import React, { useEffect, useState, useMemo } from "react";
import { getBackOrders, deleteBackOrder, updateBackOrder, updateBackOrderStatus } from "../../services/BackOrderService";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Edit, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Eye, Building2 } from "lucide-react";
import CreateBackOrder from "./CreateBackOrderModal";
import { BackOrderDetail } from "./ViewBackOrderModal";
import UpdateBackOrder from "./UpdateBackOrderModal";
import DeleteModal from "../../components/Common/DeleteModal";
import { StatusToggle } from "../../components/Common/SwitchToggle/StatusToggle";
import StatsCards from "../../components/Common/StatsCards";
import Loading from "../../components/Common/Loading";
import SearchFilterToggle from "../../components/Common/SearchFilterToggle";
import { extractErrorMessage } from "../../utils/Validation";
import EmptyState from "../../components/Common/EmptyState";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../utils/permissions";

// Type definition for BackOrder
const BackOrder = {
    backOrderId: "",
    retailerName: "",
    goodsName: "",
    status: null,
    quantity: "",
    createdBy: ""
};


export default function BackOrderList() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [showStatusFilter, setShowStatusFilter] = useState(false)
    const [sortField, setSortField] = useState("retailerName")
    const [sortAscending, setSortAscending] = useState(true)
    const [isInitialMount, setIsInitialMount] = useState(true)
    const [backOrders, setBackOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)
    const [updateBackOrderId, setUpdateBackOrderId] = useState(null)
    const [itemToView, setItemToView] = useState(null)
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0
    })
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // Thống kê tổng (không thay đổi khi search/filter)
    const [totalStats, setTotalStats] = useState({
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0
    })

    // Fetch tổng thống kê (không có search/filter)
    const fetchTotalStats = async () => {
        try {
            const response = await getBackOrders({
                pageNumber: 1,
                pageSize: 1000, // Lấy tất cả để đếm
                search: "",
                sortField: "",
                sortAscending: true,
                status: "" // Không filter theo status
            })
            console.log("BackOrder: ", response)

            if (response) {
                const payload = response.data ?? response
                const dataArray = Array.isArray(payload.items) ? payload.items : []
                const totalCount = payload.totalCount || dataArray.length

                const activeCount = dataArray.filter((s) => s.status === 1).length
                const inactiveCount = dataArray.filter((s) => s.status === 2).length

                setTotalStats({
                    totalCount: totalCount,
                    activeCount: activeCount,
                    inactiveCount: inactiveCount
                })
            }
        } catch (error) {
            console.error("Error fetching total stats:", error)
        }
    }

    // Fetch data from API
    const fetchData = async (searchParams = {}) => {
        try {
            setLoading(true)


            const response = await getBackOrders({
                pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : 1,
                pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : 10,
                search: searchParams.search !== undefined ? searchParams.search : "",
                sortField: searchParams.sortField || "",
                sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
                status: searchParams.status
            })

            console.log("BackOrder response: ", response)

            if (response) {
                // Support response either wrapped in .data or direct
                const payload = response.data ?? response
                const dataArray = Array.isArray(payload.items) ? payload.items : []
                console.log("BackOrder items: ", dataArray)
                setBackOrders(dataArray)
                setPagination(prev => ({
                    ...prev,
                    totalCount: payload.totalCount || dataArray.length,
                    pageNumber: payload.pageNumber || prev.pageNumber
                }))
            } else {
                console.log("No data found in response")
                setBackOrders([])
                setPagination(prev => ({ ...prev, totalCount: 0 }))
            }
        } catch (error) {
            console.error("Error fetching backOrders:", error)
            setBackOrders([])
            setPagination(prev => ({ ...prev, totalCount: 0 }))
        } finally {
            setLoading(false)
            setSearchLoading(false)
        }
    }

    // Initial load
    useEffect(() => {
        // Fetch tổng thống kê khi component mount
        fetchTotalStats()

        // Reset tất cả filter và sort về mặc định
        setSearchQuery("")
        setStatusFilter("")
        setSortField("")
        setSortAscending(true)
        setPagination({
            pageNumber: 1,
            pageSize: 10,
            totalCount: 0
        })

        // Fetch dữ liệu hiển thị với không có sort/filter
        fetchData({
            pageNumber: 1,
            pageSize: 10,
            search: "",
            sortField: "",
            sortAscending: true,
            status: ""
        })

        // Mark as initialized after initial load
        setIsInitialized(true)
    }, [])

    // Close status filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusFilter && !event.target.closest('.status-filter-dropdown')) {
                setShowStatusFilter(false)
            }
            if (showPageSizeFilter && !event.target.closest('.page-size-filter-dropdown')) {
                setShowPageSizeFilter(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showStatusFilter, showPageSizeFilter])

    // Combined effect for search, filters, and sort
    useEffect(() => {
        // Skip if not initialized yet (avoid calling API during initial state setup)
        if (!isInitialized) return

        const timeoutId = setTimeout(() => {
            setSearchLoading(true)
            fetchData({
                pageNumber: 1,
                pageSize: pagination.pageSize,
                search: searchQuery || "",
                sortField: sortField,
                sortAscending: sortAscending,
                status: statusFilter
            })
            setPagination(prev => ({ ...prev, pageNumber: 1 }))
        }, searchQuery ? 500 : 0) // Only debounce for search, immediate for filters

        return () => clearTimeout(timeoutId)
    }, [searchQuery, statusFilter, sortField, sortAscending, isInitialized])

    // Remove client-side filtering since backend already handles search and filter
    const filteredBackOrders = useMemo(() => {
        // Just return the backOrders from API as they are already filtered
        return Array.isArray(backOrders) ? backOrders : []
    }, [backOrders])

    const activeCount = Array.isArray(backOrders) ? backOrders.filter((s) => s.status === 1).length : 0
    const inactiveCount = Array.isArray(backOrders) ? backOrders.filter((s) => s.status === 2).length : 0

    const handleCreateSuccess = () => {
        // Refresh tổng thống kê
        fetchTotalStats()

        // Reset về trang đầu và không có sort/filter để item mới hiển thị ở đầu
        setSearchQuery("")
        setStatusFilter("")
        setSortField("")
        setSortAscending(true)
        setPagination(prev => ({ ...prev, pageNumber: 1 }))

        // Refresh data after successful creation
        fetchData({
            pageNumber: 1,
            pageSize: pagination.pageSize,
            search: "",
            sortField: "",
            sortAscending: true,
            status: ""
        })
    }

    const handleViewClick = (backOrder) => {
        setItemToView(backOrder)
        setShowViewModal(true)
    }

    const handleUpdateClick = (backOrder) => {
        setUpdateBackOrderId(backOrder.backOrderId)
        setShowUpdateModal(true)
    }

    const handleDeleteClick = (backOrder) => {
        setItemToDelete(backOrder)
        setShowDeleteModal(true)
    }

    const handleViewClose = () => {
        setShowViewModal(false)
        setItemToView(null)
    }

    const handleUpdateSuccess = () => {
        setShowUpdateModal(false)
        setUpdateBackOrderId(null)
        fetchData()
    }

    const handleUpdateCancel = () => {
        setShowUpdateModal(false)
        setUpdateBackOrderId(null)
    }

    const handleDeleteConfirm = async () => {
        try {
            console.log("Deleting backOrder:", itemToDelete)
            await deleteBackOrder(itemToDelete?.backOrderId)
            window.showToast(`Đã xóa đơn đặt hàng: ${itemToDelete?.retailerName || ''}`, "success")
            setShowDeleteModal(false)
            setItemToDelete(null)

            // Calculate if current page will be empty after deletion
            const currentPageItemCount = backOrders.length
            const willPageBeEmpty = currentPageItemCount <= 1

            // If current page will be empty and we're not on page 1, go to previous page
            let targetPage = pagination.pageNumber
            if (willPageBeEmpty && pagination.pageNumber > 1) {
                targetPage = pagination.pageNumber - 1
                setPagination(prev => ({ ...prev, pageNumber: targetPage }))
            }

            // Refresh tổng thống kê
            fetchTotalStats()

            // Refresh data after deletion, keeping current page or going to previous page if needed
            await fetchData({
                pageNumber: targetPage,
                pageSize: pagination.pageSize,
                search: searchQuery || "",
                sortField: sortField,
                sortAscending: sortAscending,
                status: statusFilter
            })
        } catch (error) {
            console.error("Error deleting backOrder:", error)
            window.showToast("Có lỗi xảy ra khi xóa đơn đặt hàng", "error")
        }
    }

    const handleDeleteCancel = () => {
        setShowDeleteModal(false)
        setItemToDelete(null)
    }

    const handleStatusChange = async (backOrderId, newStatus) => {
        try {
            await updateBackOrderStatus({ backOrderId, status: newStatus })

            // Update local state
            setBackOrders(prevBackOrders =>
                prevBackOrders.map(backOrder =>
                    backOrder.backOrderId === backOrderId
                        ? { ...backOrder, status: newStatus }
                        : backOrder
                )
            )

            const statusText = newStatus === 1 ? "kích hoạt" : "ngừng hoạt động"
            window.showToast(`Đã ${statusText} đơn đặt hàng thành công`, "success")
        } catch (error) {
            console.error("Error updating backOrder status:", error)

            // Sử dụng extractErrorMessage để xử lý lỗi nhất quán
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật trạng thái")
            window.showToast(errorMessage, "error")
        }
    }


    const handleStatusFilter = (status) => {
        setStatusFilter(status)
        setShowStatusFilter(false)
    }

    const clearStatusFilter = () => {
        setStatusFilter("")
        setShowStatusFilter(false)
    }

    const handleClearAllFilters = () => {
        setSearchQuery("")
        setStatusFilter("")
        setShowStatusFilter(false)
    }

    const clearAllFilters = handleClearAllFilters

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 1 }))
        setShowPageSizeFilter(false)

        // Refresh data with new page size
        fetchData({
            pageNumber: 1,
            pageSize: newPageSize,
            search: searchQuery || "",
            sortField: sortField,
            sortAscending: sortAscending,
            status: statusFilter
        })
    }

    const handleSort = (field) => {
        if (sortField === field) {
            // Nếu đang sort field này, đảo ngược thứ tự
            setSortAscending(!sortAscending)
        } else {
            // Nếu chưa sort field này, set field mới và mặc định ascending
            setSortField(field)
            setSortAscending(true)
        }
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý đơn hàng chờ</h1>
                        <p className="text-slate-600 mt-1">Quản lý các đơn hàng chờ trong hệ thống</p>
                    </div>
                    <PermissionWrapper requiredPermission={PERMISSIONS.BACKORDER_CREATE}>
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus className="mr-2 h-4 w-4 text-white" />
                            Thêm đơn đặt hàng
                        </Button>
                    </PermissionWrapper>
                </div>

                {/* Stats Cards */}
                <StatsCards
                    totalCount={totalStats.totalCount}
                    activeCount={totalStats.activeCount}
                    inactiveCount={totalStats.inactiveCount}
                    totalLabel="Tổng đơn đặt hàng"
                    activeLabel="Đang xử lý"
                    inactiveLabel="Đã hoàn thành"
                />

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
                    <SearchFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo tên nhà bán lẻ hoặc sản phẩm..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: "1", label: "Đang xử lý" },
                            { value: "2", label: "Đã hoàn thành" }
                        ]}
                        onStatusFilter={handleStatusFilter}
                        clearStatusFilter={clearStatusFilter}
                        onClearAll={handleClearAllFilters}
                        searchWidth="w-80"
                        showToggle={true}
                        defaultOpen={true}
                        showClearButton={true}
                    />

                    {/* Table */}
                    <div className="w-full">
                        {loading ? (
                            <Loading size="large" text="Đang tải dữ liệu..." />
                        ) : searchLoading ? (
                            <Loading size="medium" text="Đang tìm kiếm..." />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-16">
                                                STT
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("retailerName")}>
                                                    <span>Tên nhà bán lẻ</span>
                                                    {sortField === "retailerName" ? (
                                                        sortAscending ? (
                                                            <ArrowUp className="h-4 w-4 text-orange-500" />
                                                        ) : (
                                                            <ArrowDown className="h-4 w-4 text-orange-500" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Tên sản phẩm
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Số lượng
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Người tạo
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-48">
                                                Trạng thái
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                                                Hoạt động
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBackOrders.length > 0 ? (
                                            filteredBackOrders.map((backOrder, index) => (
                                                <TableRow
                                                    key={index}
                                                    className="hover:bg-slate-50 border-b border-slate-200"
                                                >
                                                    <TableCell className="px-6 py-4 text-slate-600 font-medium">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700 font-medium">{backOrder?.retailerName || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{backOrder?.goodsName || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{backOrder?.quantity || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{backOrder?.createdBy || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <PermissionWrapper
                                                                requiredPermission={PERMISSIONS.BACKORDER_UPDATE}
                                                                hide={false}
                                                                fallback={
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 ${backOrder?.status === 1
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        <span className={`w-2 h-2 rounded-full ${backOrder?.status === 1 ? 'bg-green-500' : 'bg-red-500'
                                                                            }`}></span>
                                                                        {backOrder?.status === 1 ? 'Đang xử lý' : 'Đã hoàn thành'}
                                                                    </span>
                                                                }
                                                            >
                                                                <StatusToggle
                                                                    status={backOrder?.status}
                                                                    onStatusChange={handleStatusChange}
                                                                    supplierId={backOrder?.backOrderId}
                                                                    supplierName={backOrder?.retailerName}
                                                                    entityType="đơn đặt hàng"
                                                                />
                                                            </PermissionWrapper>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.BACKORDER_VIEW}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xem chi tiết"
                                                                    onClick={() => handleViewClick(backOrder)}
                                                                >
                                                                    <Eye className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>

                                                            <PermissionWrapper requiredPermission={PERMISSIONS.BACKORDER_UPDATE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Chỉnh sửa"
                                                                    onClick={() => handleUpdateClick(backOrder)}
                                                                >
                                                                    <Edit className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>

                                                            <PermissionWrapper requiredPermission={PERMISSIONS.BACKORDER_DELETE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xóa"
                                                                    onClick={() => handleDeleteClick(backOrder)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </button>
                                                            </PermissionWrapper>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <EmptyState
                                                icon={Building2}
                                                title="Không tìm thấy đơn đặt hàng nào"
                                                description={
                                                    searchQuery || statusFilter
                                                        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                                                        : "Chưa có đơn đặt hàng nào trong hệ thống"
                                                }
                                                actionText="Xóa bộ lọc"
                                                onAction={clearAllFilters}
                                                showAction={!!(searchQuery || statusFilter)}
                                                colSpan={7}
                                            />
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Pagination */}
                {!loading && !searchLoading && pagination.totalCount > 0 && (
                    <Card className="bg-gray-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-600">
                                    Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} đơn đặt hàng
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-[38px]"
                                            onClick={() => {
                                                if (pagination.pageNumber > 1) {
                                                    fetchData({
                                                        pageNumber: pagination.pageNumber - 1,
                                                        pageSize: pagination.pageSize,
                                                        search: searchQuery || "",
                                                        sortField: sortField,
                                                        sortAscending: sortAscending,
                                                        status: statusFilter
                                                    })
                                                    setPagination(prev => ({ ...prev, pageNumber: prev.pageNumber - 1 }))
                                                }
                                            }}
                                            disabled={pagination.pageNumber <= 1}
                                        >
                                            Trước
                                        </Button>
                                        <span className="text-sm text-slate-600">
                                            Trang {pagination.pageNumber} / {Math.ceil(pagination.totalCount / pagination.pageSize)}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-[38px]"
                                            onClick={() => {
                                                if (pagination.pageNumber < Math.ceil(pagination.totalCount / pagination.pageSize)) {
                                                    fetchData({
                                                        pageNumber: pagination.pageNumber + 1,
                                                        pageSize: pagination.pageSize,
                                                        search: searchQuery || "",
                                                        sortField: sortField,
                                                        sortAscending: sortAscending,
                                                        status: statusFilter
                                                    })
                                                    setPagination(prev => ({ ...prev, pageNumber: prev.pageNumber + 1 }))
                                                }
                                            }}
                                            disabled={pagination.pageNumber >= Math.ceil(pagination.totalCount / pagination.pageSize)}
                                        >
                                            Sau
                                        </Button>
                                    </div>

                                    {/* Page Size Selector */}
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-slate-600">Hiển thị:</span>
                                        <div className="relative page-size-filter-dropdown">
                                            <button
                                                onClick={() => setShowPageSizeFilter(!showPageSizeFilter)}
                                                className="flex items-center space-x-2 px-3 py-2 h-[38px] text-sm border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <span>{pagination.pageSize}</span>
                                                <ChevronDown className="h-4 w-4" />
                                            </button>

                                            {showPageSizeFilter && (
                                                <div className="absolute bottom-full right-0 mb-1 w-20 bg-white rounded-md shadow-lg border z-10">
                                                    <div className="py-1">
                                                        {[10, 20, 30, 40].map((size) => (
                                                            <button
                                                                key={size}
                                                                onClick={() => handlePageSizeChange(size)}
                                                                className={`w-full text-left px-3 py-2 h-[38px] text-sm hover:bg-slate-100 flex items-center justify-between ${pagination.pageSize === size ? 'bg-[#d97706] text-white' : 'text-slate-700'
                                                                    }`}
                                                            >
                                                                {size}
                                                                {pagination.pageSize === size && <span className="text-white">✓</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm text-slate-600">/ Trang</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create BackOrder Modal */}
            <CreateBackOrder
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Update BackOrder Modal */}
            <UpdateBackOrder
                isOpen={showUpdateModal}
                onClose={handleUpdateCancel}
                onSuccess={handleUpdateSuccess}
                backOrderId={updateBackOrderId}
            />

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                itemName={itemToDelete?.retailerName || ""}
            />

            {/* View BackOrder Detail Modal */}
            {showViewModal && itemToView && (
                <BackOrderDetail
                    backOrder={itemToView}
                    onClose={handleViewClose}
                />
            )}
        </div>
    )
}

