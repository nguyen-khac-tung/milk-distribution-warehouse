import React, { useEffect, useState, useMemo } from "react";
import { getStorageCondition, deleteStorageCondition, updateStorageCondition, updateStorageConditionStatus } from "../../../services/StorageConditionService";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Plus, Edit, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Thermometer } from "lucide-react";
import CreateStorageCondition from "./CreateStorageConditionModal";
import UpdateStorageCondition from "./UpdateStorageConditionModal";
import DeleteModal from "../../../components/Common/DeleteModal";
import StatsCards from "../../../components/Common/StatsCards";
import Loading from "../../../components/Common/Loading";
import SearchFilterToggle from "../../../components/Common/SearchFilterToggle";
import { StatusToggle } from "../../../components/Common/SwitchToggle/StatusToggle";
import { extractErrorMessage } from "../../../utils/Validation";
import EmptyState from "../../../components/Common/EmptyState";

// Type definition for StorageCondition
const StorageCondition = {
  storageConditionId: "",
  temperatureMin: "",
  temperatureMax: "",
  humidityMin: "",
  humidityMax: "",
  lightLevel: "",
  status: null,
  createdAt: "",
  updateAt: "",
};


export default function StorageConditionPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [sortField, setSortField] = useState("")
  const [sortAscending, setSortAscending] = useState(true)
  const [storageConditions, setStorageConditions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [itemToUpdate, setItemToUpdate] = useState(null)
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0
  })
  const [showPageSizeFilter, setShowPageSizeFilter] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [statusSearchQuery, setStatusSearchQuery] = useState("")

  // Thống kê tổng (không thay đổi khi search/filter)
  const [totalStats, setTotalStats] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0
  })

  // Fetch tổng thống kê (không có search/filter)
  const fetchTotalStats = async () => {
    try {
      const response = await getStorageCondition({
        pageNumber: 1,
        pageSize: 1000, // Lấy tất cả để đếm
        search: "",
        sortField: "",
        sortAscending: true,
        status: "" // Không filter theo status
      })

      if (response && response.data) {
        // Xử lý cấu trúc response tương tự như fetchData
        let allStorageConditions = [];
        let totalCount = 0;

        if (Array.isArray(response.data.items)) {
          allStorageConditions = response.data.items;
          totalCount = response.data.totalCount || allStorageConditions.length;
        } else if (Array.isArray(response.data)) {
          allStorageConditions = response.data;
          totalCount = allStorageConditions.length;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          allStorageConditions = response.data.data;
          totalCount = response.data.totalCount || allStorageConditions.length;
        }

        const activeCount = allStorageConditions.filter((s) => s.status === 1).length
        const inactiveCount = allStorageConditions.filter((s) => s.status === 2).length

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

  // Normalize function: lowercase, trim, and collapse multiple spaces into one
  const normalize = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // gom nhiều space thành 1 space
  };

  // Fetch data from API
  const fetchData = async (searchParams = {}) => {
    try {
      setLoading(true)
      // Normalize search query trước khi gọi API (nhưng vẫn giữ nguyên giá trị trong input khi đang gõ)
      const searchValue = searchParams.search !== undefined ? searchParams.search : "";
      const normalizedSearch = normalize(searchValue);
      const response = await getStorageCondition({
        pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : 1,
        pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : 10,
        search: normalizedSearch,
        sortField: searchParams.sortField || "",
        sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
        status: searchParams.status
      })

      if (response && response.data) {
        // Check different possible response structures
        let dataArray = [];
        let totalCount = 0;

        if (Array.isArray(response.data.items)) {
          // Structure: { data: { items: [...], totalCount: number } }
          dataArray = response.data.items;
          totalCount = response.data.totalCount || dataArray.length;
        } else if (Array.isArray(response.data)) {
          // Structure: { data: [...] }
          dataArray = response.data;
          totalCount = dataArray.length;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Structure: { data: { data: [...], totalCount: number } }
          dataArray = response.data.data;
          totalCount = response.data.totalCount || dataArray.length;
        }

        setStorageConditions(dataArray)
        setPagination(prev => ({
          ...prev,
          totalCount: totalCount
        }))
      } else {
        setStorageConditions([])
        setPagination(prev => ({ ...prev, totalCount: 0 }))
      }
    } catch (error) {
      console.error("Error fetching storage conditions:", error)
      setStorageConditions([])
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
        setStatusSearchQuery("")
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
  const filteredStorageConditions = useMemo(() => {
    // Just return the storage conditions from API as they are already filtered
    return Array.isArray(storageConditions) ? storageConditions : []
  }, [storageConditions])

  const activeCount = Array.isArray(storageConditions) ? storageConditions.filter((c) => c.status === 1).length : 0
  const inactiveCount = Array.isArray(storageConditions) ? storageConditions.filter((c) => c.status === 2).length : 0

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

  const handleUpdateClick = (storageCondition) => {
    setItemToUpdate(storageCondition)
    setShowUpdateModal(true)
  }

  const handleDeleteClick = (storageCondition) => {
    setItemToDelete(storageCondition)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    try {

      if (!itemToDelete?.storageConditionId) {
        window.showToast("Không tìm thấy ID của điều kiện bảo quản", "error")
        return
      }

      await deleteStorageCondition(itemToDelete?.storageConditionId)
      window.showToast(`Đã xóa điều kiện bảo quản: ${itemToDelete?.lightLevel || ''}`, "success")
      setShowDeleteModal(false)
      setItemToDelete(null)

      // Calculate if current page will be empty after deletion
      const currentPageItemCount = storageConditions.length
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
        pageSize: 10,
        search: searchQuery || "",
        sortField: sortField,
        sortAscending: sortAscending,
        status: statusFilter
      })
    } catch (error) {
      console.error("Error deleting storage condition:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi xóa điều kiện bảo quản")
      window.showToast(cleanMsg, "error")
    }
  }

  const handleUpdateCancel = () => {
    setShowUpdateModal(false)
    setItemToUpdate(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  // Filter status options based on search query
  const filteredStatusOptions = useMemo(() => {
    const statusOptions = [
      { value: "", label: "Tất cả trạng thái" },
      { value: "1", label: "Hoạt động" },
      { value: "2", label: "Ngừng hoạt động" }
    ]
    if (!statusSearchQuery) return statusOptions
    const query = statusSearchQuery.toLowerCase()
    return statusOptions.filter(option =>
      option.label.toLowerCase().includes(query)
    )
  }, [statusSearchQuery])

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setShowStatusFilter(false)
    setStatusSearchQuery("")
  }

  const clearStatusFilter = () => {
    setStatusFilter("")
    setShowStatusFilter(false)
    setStatusSearchQuery("")
  }

  const handleClearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setStatusSearchQuery("")
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

  const handleStatusChange = async (storageConditionId, newStatus, lightLevel) => {
    try {
      // Update status via API
      await updateStorageConditionStatus(parseInt(storageConditionId), newStatus)

      // Show success message
      window.showToast(`Đã ${newStatus === 1 ? 'kích hoạt' : 'vô hiệu hóa'} điều kiện bảo quản: ${lightLevel}`, "success")

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
      console.error("Error updating storage condition status:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật trạng thái điều kiện bảo quản")
      window.showToast(`Lỗi: ${cleanMsg}`, "error")
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Quản lý Điều kiện Bảo quản</h1>
            <p className="text-slate-600 mt-1">Quản lý các điều kiện bảo quản hàng hóa trong hệ thống</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-white" />
            Thêm điều kiện bảo quản
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalCount={totalStats.totalCount}
          activeCount={totalStats.activeCount}
          inactiveCount={totalStats.inactiveCount}
          totalLabel="Tổng điều kiện bảo quản"
          activeLabel="Đang hoạt động"
          inactiveLabel="Không hoạt động"
        />

        {/* Search and Table Combined */}
        <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
          <SearchFilterToggle
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo mức độ ánh sáng..."
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
            enableStatusSearch={true}
            statusSearchQuery={statusSearchQuery}
            setStatusSearchQuery={setStatusSearchQuery}
            filteredStatusOptions={filteredStatusOptions}
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
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("temperatureMin")}>
                          <span>Nhiệt độ (°C)</span>
                          {sortField === "temperatureMin" ? (
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
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("humidityMin")}>
                          <span>Độ ẩm (%)</span>
                          {sortField === "humidityMin" ? (
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
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("lightLevel")}>
                          <span>Mức độ ánh sáng</span>
                          {sortField === "lightLevel" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-48">
                        Trạng thái
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                        Hoạt động
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStorageConditions.length > 0 ? (
                      filteredStorageConditions.map((storageCondition, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-slate-50 border-b border-slate-200"
                        >
                          <TableCell className="px-6 py-4 text-slate-600 font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">
                            <span className="text-sm font-semibold text-slate-700">
                              {storageCondition?.temperatureMin ?? 0} - {storageCondition?.temperatureMax ?? 0}°C
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">
                            <span className="text-sm font-semibold text-slate-700">
                              {storageCondition?.humidityMin ?? 0} - {storageCondition?.humidityMax ?? 0}%
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">
                            {storageCondition?.lightLevel || ''}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <StatusToggle
                                status={storageCondition?.status}
                                onStatusChange={handleStatusChange}
                                supplierId={storageCondition?.storageConditionId}
                                supplierName={storageCondition?.lightLevel}
                                entityType="điều kiện bảo quản"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => handleUpdateClick(storageCondition)}
                              >
                                <Edit className="h-4 w-4 text-orange-500" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Xóa"
                                onClick={() => handleDeleteClick(storageCondition)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyState
                        icon={Thermometer}
                        title="Không tìm thấy điều kiện bảo quản nào"
                        description={
                          searchQuery || statusFilter
                            ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                            : "Chưa có điều kiện bảo quản nào trong hệ thống"
                        }
                        actionText="Xóa bộ lọc"
                        onAction={clearAllFilters}
                        showAction={!!(searchQuery || statusFilter)}
                        colSpan={6}
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
                  Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} điều kiện bảo quản
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
                        <div className="absolute bottom-full right-0 mb-1 w-20 bg-gray-50 rounded-md shadow-lg border z-10">
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

      {/* Create Storage Condition Modal */}
      <CreateStorageCondition
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Update Storage Condition Modal */}
      <UpdateStorageCondition
        isOpen={showUpdateModal}
        onClose={handleUpdateCancel}
        onSuccess={handleCreateSuccess}
        storageConditionData={itemToUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.lightLevel || ""}
      />
    </div>
  )
}
