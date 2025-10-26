import React, { useEffect, useState, useMemo } from "react";
import { getPallets, updatePalletStatus, deletePallet } from "../../services/PalletService";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Edit, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Eye, Package } from "lucide-react";
import Loading from "../../components/Common/Loading";
import SearchFilterToggle from "../../components/Common/SearchFilterToggle";
import { extractErrorMessage } from "../../utils/Validation";
import EmptyState from "../../components/Common/EmptyState";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../utils/permissions";
import StatsCards from "../../components/Common/StatsCards";
import { StatusToggle } from "../../components/Common/SwitchToggle/StatusToggle";
import { PalletDetail } from "./ViewPalletModal";
import DeleteModal from "../../components/Common/DeleteModal";

const Pallet = {
    palletId: "",
    purchaseOrderId: "",
    packageQuantity: 0,
    unitsPerPackage: 0,
    createBy: 0,
    createByName: "",
    batchId: "",
    batchCode: "",
    locationId: 0,
    locationCode: "",
    status: null
};

export default function PalletList() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [showStatusFilter, setShowStatusFilter] = useState(false)
    const [sortField, setSortField] = useState("")
    const [sortAscending, setSortAscending] = useState(true)
    const [isInitialMount, setIsInitialMount] = useState(true)
    const [pallets, setPallets] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)
    const [updatePalletId, setUpdatePalletId] = useState(null)
    const [itemToView, setItemToView] = useState(null)
    const [viewPalletId, setViewPalletId] = useState(null)
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0
    })
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [totalStats, setTotalStats] = useState({
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0
    })
    const fetchTotalStats = async () => {
        try {
            const response = await getPallets({
                pageNumber: 1,
                pageSize: 1000,
                search: "",
                sortField: "",
                sortAscending: true,
                status: ""
            })
            if (response && response.data) {
                // API returns response.data.items (array) and response.data.totalCount
                const dataArray = Array.isArray(response.data.items) ? response.data.items : []
                const totalCount = response.data.totalCount || dataArray.length
                const activeCount = dataArray.filter((p) => p.status === 1).length
                const inactiveCount = dataArray.filter((p) => p.status === 2).length
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
    const fetchData = async (searchParams = {}) => {
        try {
            setLoading(true)
            const response = await getPallets({
                pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : 1,
                pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : 10,
                search: searchParams.search !== undefined ? searchParams.search : "",
                sortField: searchParams.sortField || "",
                sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
                status: searchParams.status
            })

            if (response && response.data) {
                const dataArray = Array.isArray(response.data.items) ? response.data.items : []
                setPallets(dataArray)
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.totalCount || dataArray.length
                }))
            } else {
                setPallets([])
                setPagination(prev => ({ ...prev, totalCount: 0 }))
            }
        } catch (error) {
            setPallets([])
            setPagination(prev => ({ ...prev, totalCount: 0 }))
        } finally {
            setLoading(false)
            setSearchLoading(false)
        }
    }
    useEffect(() => {
        const initializeData = async () => {
            // Fetch tổng thống kê
            await fetchTotalStats()

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

            // Fetch dữ liệu hiển thị
            await fetchData({
                pageNumber: 1,
                pageSize: 10,
                search: "",
                sortField: "",
                sortAscending: true,
                status: ""
            })

            // Mark as initialized after all data is loaded
            setIsInitialized(true)
        }

        initializeData()
    }, [])
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

    useEffect(() => {
        if (!isInitialized) return
        const timeoutId = setTimeout(() => {
            setSearchLoading(true)
            const params = {
                pageNumber: 1,
                pageSize: pagination.pageSize,
                search: searchQuery || "",
                sortField: sortField,
                sortAscending: sortAscending,
                status: statusFilter
            }
            fetchData(params)
            setPagination(prev => ({ ...prev, pageNumber: 1 }))
        }, searchQuery ? 500 : 0)

        return () => clearTimeout(timeoutId)
    }, [searchQuery, statusFilter, sortField, sortAscending, isInitialized])
    const filteredPallets = useMemo(() => {
        return Array.isArray(pallets) ? pallets : []
    }, [pallets])

    const activeCount = Array.isArray(pallets) ? pallets.filter((p) => p.status === 1).length : 0
    const inactiveCount = Array.isArray(pallets) ? pallets.filter((p) => p.status === 2).length : 0

    const handleViewClick = (pallet) => {
        setItemToView(pallet)
        setShowViewModal(true)
    }
    const handleUpdateClick = (pallet) => {
        setUpdatePalletId(pallet.palletId)
        setShowUpdateModal(true)
    }
    const handleDeleteClick = (pallet) => {
        setItemToDelete(pallet)
        setShowDeleteModal(true)
    }
    const handleViewClose = () => {
        setShowViewModal(false)
        setItemToView(null)
        setViewPalletId(null)
    }
    const handleViewPallet = (palletId) => {
        setViewPalletId(palletId)
        setShowViewModal(true)
    }
    const handleUpdateSuccess = () => {
        setShowUpdateModal(false)
        setUpdatePalletId(null)
        fetchData()
    }
    const handleUpdateCancel = () => {
        setShowUpdateModal(false)
        setUpdatePalletId(null)
    }
    const handleDeleteConfirm = async () => {
        try {
            await deletePallet(itemToDelete?.palletId)

            window.showToast(`Đã xóa kệ kê hàng: ${itemToDelete?.batchCode || ''}`, "success")
            setShowDeleteModal(false)
            setItemToDelete(null)

            const currentPageItemCount = pallets.length
            const willPageBeEmpty = currentPageItemCount <= 1
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
            console.error("Error deleting pallet:", error)
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi xóa kệ kê hàng")
            window.showToast(errorMessage, "error")
        }
    }

    const handleDeleteCancel = () => {
        setShowDeleteModal(false)
        setItemToDelete(null)
    }

    const handleStatusChange = async (palletId, newStatus) => {
        try {
            await updatePalletStatus(palletId, newStatus)
            setPallets(prevPallets =>
                prevPallets.map(pallet =>
                    pallet.palletId === palletId
                        ? { ...pallet, status: newStatus }
                        : pallet
                )
            )

            const statusText = newStatus === 1 ? "còn sử dụng" : "không còn sử dụng"
            window.showToast(`Đã cập nhật kệ kê hàng thành ${statusText}`, "success")
        } catch (error) {
            console.error("Error updating pallet status:", error)
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
            setSortAscending(!sortAscending)
        } else {
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
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý Kệ Kê Hàng</h1>
                        <p className="text-slate-600 mt-1">Quản lý các kệ kê hàng trong hệ thống</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <StatsCards
                    totalCount={totalStats.totalCount}
                    activeCount={totalStats.activeCount}
                    inactiveCount={totalStats.inactiveCount}
                    totalLabel="Tổng kệ kê hàng"
                    activeLabel="Còn sử dụng"
                    inactiveLabel="Không còn sử dụng"
                />

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
                    <SearchFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo mã batch hoặc mã vị trí..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: "1", label: "Còn sử dụng" },
                            { value: "2", label: "Không còn sử dụng" }
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
                                                <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("batchCode")}>
                                                    <span>Mã lô hàng</span>
                                                    {sortField === "batchCode" ? (
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
                                                Mã vị trí
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Số lượng thùng
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Đơn vị/thùng
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
                                        {filteredPallets.length > 0 ? (
                                            filteredPallets.map((pallet, index) => (
                                                <TableRow
                                                    key={index}
                                                    className="hover:bg-slate-50 border-b border-slate-200"
                                                >
                                                    <TableCell className="px-6 py-4 text-slate-600 font-medium">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700 font-medium">{pallet?.batchCode || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{pallet?.locationCode || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{pallet?.packageQuantity || 0}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{pallet?.unitsPerPackage || 0}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{pallet?.createByName || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <PermissionWrapper
                                                                requiredPermission={PERMISSIONS.PALLET_UPDATE_STATUS}
                                                                hide={false}
                                                                fallback={
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 ${pallet?.status === 1
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        <span className={`w-2 h-2 rounded-full ${pallet?.status === 1 ? 'bg-green-500' : 'bg-red-500'
                                                                            }`}></span>
                                                                        {pallet?.status === 1 ? 'Còn sử dụng' : 'Không còn sử dụng'}
                                                                    </span>
                                                                }
                                                            >
                                                                <StatusToggle
                                                                    status={pallet?.status}
                                                                    onStatusChange={handleStatusChange}
                                                                    palletId={pallet?.palletId}
                                                                    palletName={pallet?.batchCode}
                                                                    entityType="kệ kê hàng"
                                                                />
                                                            </PermissionWrapper>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.PALLET_VIEW}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xem chi tiết"
                                                                    onClick={() => handleViewPallet(pallet.palletId)}
                                                                >
                                                                    <Eye className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>

                                                            <PermissionWrapper requiredPermission={PERMISSIONS.PALLET_UPDATE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Chỉnh sửa"
                                                                    onClick={() => handleUpdateClick(pallet)}
                                                                >
                                                                    <Edit className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>

                                                            <PermissionWrapper requiredPermission={PERMISSIONS.PALLET_DELETE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xóa"
                                                                    onClick={() => handleDeleteClick(pallet)}
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
                                                icon={Package}
                                                title="Không tìm thấy kệ kê hàng nào"
                                                description={
                                                    searchQuery || statusFilter
                                                        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                                                        : "Chưa có kệ kê hàng nào trong hệ thống"
                                                }
                                                actionText="Xóa bộ lọc"
                                                onAction={clearAllFilters}
                                                showAction={!!(searchQuery || statusFilter)}
                                                colSpan={8}
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
                                    Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} kệ kê hàng
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

            {/* View Kệ Kê Hàng Detail Modal */}
            {showViewModal && (
                <PalletDetail
                    palletId={viewPalletId}
                    onClose={handleViewClose}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    itemName={"kệ kê hàng"}
                />
            )}

            {/* TODO: Add modals for Update Kệ Kê Hàng */}
            {/* Update Kệ Kê Hàng Modal */}
        </div>
    )
}