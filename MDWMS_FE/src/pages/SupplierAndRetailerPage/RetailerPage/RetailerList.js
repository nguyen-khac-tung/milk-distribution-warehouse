import React, { useEffect, useState, useMemo } from "react";
import { getRetailers, getRetailerDetail, deleteRetailer, updateRetailerStatus } from "../../../services/RetailerService";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Plus, Edit, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Eye, Store } from "lucide-react";
import { RetailerDetail } from "./ViewRetailerModal";
import DeleteModal from "../../../components/Common/DeleteModal";
import CreateRetailer from "./CreateRetailerModal";
import UpdateRetailerModal from "./UpdateRetailerModal";
import StatsCards from "../../../components/Common/StatsCards";
import Loading from "../../../components/Common/Loading";
import SearchFilterToggle from "../../../components/Common/SearchFilterToggle";
import { StatusToggle } from "../../../components/Common/SwitchToggle/StatusToggle";
import { extractErrorMessage } from "../../../utils/Validation";
import EmptyState from "../../../components/Common/EmptyState";

// Type definition for Retailer
const Retailer = {
  retailerId: "",
  companyName: "",
  brandName: "",
  status: null,
  createdAt: "",
  updateAt: ""
};


export default function RetailersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [sortField, setSortField] = useState("retailerName")
  const [sortAscending, setSortAscending] = useState(true)
  const [retailers, setRetailers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [itemToUpdate, setItemToUpdate] = useState(null)
  const [updateRetailerId, setUpdateRetailerId] = useState(null)
  const [itemToView, setItemToView] = useState(null)
  const [retailerDetail, setRetailerDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0
  })
  const [showPageSizeFilter, setShowPageSizeFilter] = useState(false)
  
  // Thống kê tổng (không thay đổi khi search/filter)
  const [totalStats, setTotalStats] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0
  })

  // Fetch tổng thống kê (không có search/filter)
  const fetchTotalStats = async () => {
    try {
      const response = await getRetailers({
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

        const activeCount = dataArray.filter((r) => r.status === 1).length
        const inactiveCount = dataArray.filter((r) => r.status === 2).length
        
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


      const response = await getRetailers({
        pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : 1,
        pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : 10,
        search: searchParams.search !== undefined ? searchParams.search : "",
        sortField: searchParams.sortField || "",
        sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
        status: searchParams.status
      })

      if (response && response.data) {
        // API returns response.data.items (array) and response.data.totalCount
        const dataArray = Array.isArray(response.data.items) ? response.data.items : []
        setRetailers(dataArray)
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.totalCount || dataArray.length
        }))
      } else {
        setRetailers([])
        setPagination(prev => ({ ...prev, totalCount: 0 }))
      }
    } catch (error) {
      console.error("Error fetching retailers:", error)
      setRetailers([])
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

  // Search with debounce
  useEffect(() => {
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
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Filter by status
  useEffect(() => {
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
  }, [statusFilter])

  // Sort when sortField or sortAscending changes
  useEffect(() => {
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
  }, [sortField, sortAscending])

  // Remove client-side filtering since backend already handles search and filter
  const filteredRetailers = useMemo(() => {
    // Just return the retailers from API as they are already filtered
    return Array.isArray(retailers) ? retailers : []
  }, [retailers])

  const activeCount = Array.isArray(retailers) ? retailers.filter((r) => r.status === 1).length : 0
  const inactiveCount = Array.isArray(retailers) ? retailers.filter((r) => r.status === 2).length : 0

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

  const handleViewClick = async (retailer) => {
    try {
      console.log("Viewing retailer:", retailer)
      setItemToView(retailer)
      setLoadingDetail(true)
      setShowViewModal(true)

      const response = await getRetailerDetail(retailer.retailerId)
      console.log("API Response:", response)

      // Handle API response structure: { status: 200, message: "Success", data: {...} }
      if (response && response.status === 200 && response.data) {
        setRetailerDetail(response.data)
        console.log("Retailer detail set:", response.data)
      } else {
        console.log("Invalid response structure:", response)
        window.showToast("Không thể tải chi tiết nhà bán lẻ", "error")
        setShowViewModal(false)
      }
    } catch (error) {
      console.error("Error fetching retailer detail:", error)
      window.showToast("Có lỗi xảy ra khi tải chi tiết nhà bán lẻ", "error")
      setShowViewModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleUpdateClick = (retailer) => {
    setItemToUpdate(retailer)
    setUpdateRetailerId(retailer.retailerId)
    setShowUpdateModal(true)
  }

  const handleDeleteClick = (retailer) => {
    setItemToDelete(retailer)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      console.log("Deleting retailer:", itemToDelete)
      await deleteRetailer(itemToDelete?.retailerId)
      window.showToast(`Đã xóa nhà bán lẻ: ${itemToDelete?.retailerName || ''}`, "success")
      setShowDeleteModal(false)
      setItemToDelete(null)

      // Calculate if current page will be empty after deletion
      const currentPageItemCount = retailers.length
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
      fetchData({
        pageNumber: targetPage,
        pageSize: pagination.pageSize,
        search: searchQuery || "",
        sortField: sortField,
        sortAscending: sortAscending,
        status: statusFilter
      })
    } catch (error) {
      console.error("Error deleting retailer:", error)

      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi xóa nhà bán lẻ")
      window.showToast(errorMessage, "error")
    }
  }

  const handleUpdateCancel = () => {
    setShowUpdateModal(false)
    setItemToUpdate(null)
    setUpdateRetailerId(null)
  }

  const handleUpdateSuccess = () => {
    // Refresh data after successful update
    fetchData({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      search: searchQuery || "",
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter
    })
    setShowUpdateModal(false)
    setItemToUpdate(null)
    setUpdateRetailerId(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
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
      setSortAscending(!sortAscending)
    } else {
      setSortField(field)
      setSortAscending(true)
    }
  }

  const handleViewClose = () => {
    setShowViewModal(false)
    setItemToView(null)
    setRetailerDetail(null)
  }

  const handleStatusChange = async (retailerId, newStatus, retailerName) => {
    try {
      // Update status via API
      await updateRetailerStatus({
        retailerId: parseInt(retailerId),
        status: newStatus
      })
      
      // Show success message
      window.showToast(`Đã ${newStatus === 1 ? 'kích hoạt' : 'vô hiệu hóa'} nhà bán lẻ: ${retailerName}`, "success")
      
      // Refresh data
      fetchData({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search: searchQuery || "",
        sortField: sortField,
        sortAscending: sortAscending,
        status: statusFilter
      })
      
      // Refresh total stats
      fetchTotalStats()
    } catch (error) {
      console.error("Error updating retailer status:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật trạng thái nhà bán lẻ")
      window.showToast(`Lỗi: ${cleanMsg}`, "error")
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Quản lý Nhà bán lẻ</h1>
            <p className="text-slate-600 mt-1">Quản lý các nhà bán lẻ trong hệ thống</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-white" />
            Thêm nhà bán lẻ
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalCount={totalStats.totalCount}
          activeCount={totalStats.activeCount}
          inactiveCount={totalStats.inactiveCount}
          totalLabel="Tổng nhà bán lẻ"
          activeLabel="Đang hoạt động"
          inactiveLabel="Không hoạt động"
        />

        {/* Search and Table Combined */}
        <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
          <SearchFilterToggle
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo tên nhà bán lẻ..."
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            showStatusFilter={showStatusFilter}
            setShowStatusFilter={setShowStatusFilter}
            statusOptions={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "1", label: "Hoạt động" },
              { value: "2", label: "Ngừng hoạt động" }
            ]}
            onStatusFilter={handleStatusFilter}
            clearStatusFilter={clearStatusFilter}
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
                        Số điện thoại
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
                    {filteredRetailers.length > 0 ? (
                      filteredRetailers.map((retailer, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-slate-50 border-b border-slate-200"
                        >
                          <TableCell className="px-6 py-4 text-slate-600 font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">{retailer?.retailerName || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">{retailer?.phone || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <StatusToggle
                                status={retailer?.status}
                                onStatusChange={handleStatusChange}
                                supplierId={retailer?.retailerId}
                                supplierName={retailer?.retailerName}
                                entityType="nhà bán lẻ"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Xem chi tiết"
                                onClick={() => handleViewClick(retailer)}
                              >
                                <Eye className="h-4 w-4 text-orange-500" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => handleUpdateClick(retailer)}
                              >
                                <Edit className="h-4 w-4 text-orange-500" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Xóa"
                                onClick={() => handleDeleteClick(retailer)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyState
                        icon={Store}
                        title="Không tìm thấy nhà bán lẻ nào"
                        description={
                          searchQuery || statusFilter
                            ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                            : "Chưa có nhà bán lẻ nào trong hệ thống"
                        }
                        actionText="Xóa bộ lọc"
                        onAction={clearAllFilters}
                        showAction={!!(searchQuery || statusFilter)}
                        colSpan={5}
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
                  Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} nhà bán lẻ
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
                        className="flex items-center space-x-2 px-3 py-2 h-[38px] text-sm border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <span>{pagination.pageSize}</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {showPageSizeFilter && (
                        <div className="absolute bottom-full right-0 mb-1 w-20 bg-gray-50 rounded-md shadow-lg border z-10">
                          <div className="py-1">
                            {[10, 20, 30, 40].map((size) => (
                              <button
                                key={size}
                                onClick={() => handlePageSizeChange(size)}
                                className={`w-full text-left px-3 py-2 h-[38px] text-sm hover:bg-slate-100 flex items-center justify-between ${pagination.pageSize === size ? 'bg-orange-500 text-white' : 'text-slate-700'
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

      {/* Create Retailer Modal */}
      <CreateRetailer
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Update Retailer Modal */}
      <UpdateRetailerModal
        isOpen={showUpdateModal}
        onClose={handleUpdateCancel}
        onSuccess={handleUpdateSuccess}
        retailerId={updateRetailerId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.retailerName || ""}
      />

      {/* View Retailer Detail Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4" style={{zIndex: 99999}}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingDetail ? (
              <Loading size="large" text="Đang tải chi tiết nhà bán lẻ..." />
            ) : retailerDetail ? (
              <RetailerDetail
                retailer={retailerDetail}
                onClose={handleViewClose}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Không có dữ liệu để hiển thị</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
