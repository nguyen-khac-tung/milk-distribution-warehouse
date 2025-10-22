import React, { useEffect, useState, useMemo } from "react";
import { getSuppliers, deleteSupplier, updateSupplierStatus } from "../../../services/SupplierService";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Plus, Edit, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Eye, Building2 } from "lucide-react";
import CreateSupplier from "./CreateSupplierModal";
import { SupplierDetail } from "./ViewSupplierModal";
import UpdateSupplier from "./UpdateSupplierModal";
import DeleteModal from "../../../components/Common/DeleteModal";
import { StatusToggle } from "../../../components/Common/SwitchToggle/StatusToggle";
import StatsCards from "../../../components/Common/StatsCards";
import Loading from "../../../components/Common/Loading";
import SearchFilterToggle from "../../../components/Common/SearchFilterToggle";
import { extractErrorMessage } from "../../../utils/Validation";
import EmptyState from "../../../components/Common/EmptyState";
import PermissionWrapper from "../../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../../utils/permissions";

// Type definition for Supplier
const Supplier = {
  supplierId: "",
  companyName: "",
  brandName: "",
  status: null,
  createdAt: "",
  updateAt: ""
};


export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [sortField, setSortField] = useState("companyName")
  const [sortAscending, setSortAscending] = useState(true)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [updateSupplierId, setUpdateSupplierId] = useState(null)
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
      const response = await getSuppliers({
        pageNumber: 1,
        pageSize: 1000, // Lấy tất cả để đếm
        search: "",
        sortField: "",
        sortAscending: true,
        status: "" // Không filter theo status
      })

      if (response && response.data) {
        // API returns response.data.items (array) and response.data.totalCount
        const dataArray = Array.isArray(response.data.items) ? response.data.items : []
        const totalCount = response.data.totalCount || dataArray.length

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


      const response = await getSuppliers({
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
        setSuppliers(dataArray)
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.totalCount || dataArray.length
        }))
      } else {
        setSuppliers([])
        setPagination(prev => ({ ...prev, totalCount: 0 }))
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      setSuppliers([])
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
  const filteredSuppliers = useMemo(() => {
    // Just return the suppliers from API as they are already filtered
    return Array.isArray(suppliers) ? suppliers : []
  }, [suppliers])

  const activeCount = Array.isArray(suppliers) ? suppliers.filter((s) => s.status === 1).length : 0
  const inactiveCount = Array.isArray(suppliers) ? suppliers.filter((s) => s.status === 2).length : 0

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

  const handleViewClick = (supplier) => {
    setItemToView(supplier)
    setShowViewModal(true)
  }

  const handleUpdateClick = (supplier) => {
    setUpdateSupplierId(supplier.supplierId)
    setShowUpdateModal(true)
  }

  const handleDeleteClick = (supplier) => {
    setItemToDelete(supplier)
    setShowDeleteModal(true)
  }

  const handleViewClose = () => {
    setShowViewModal(false)
    setItemToView(null)
  }

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false)
    setUpdateSupplierId(null)
    fetchData()
  }

  const handleUpdateCancel = () => {
    setShowUpdateModal(false)
    setUpdateSupplierId(null)
  }

  const handleDeleteConfirm = async () => {
    try {
      console.log("Deleting supplier:", itemToDelete)
      await deleteSupplier(itemToDelete?.supplierId)
      window.showToast(`Đã xóa nhà cung cấp: ${itemToDelete?.companyName || ''}`, "success")
      setShowDeleteModal(false)
      setItemToDelete(null)

      // Calculate if current page will be empty after deletion
      const currentPageItemCount = suppliers.length
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
      console.error("Error deleting supplier:", error)
      window.showToast("Có lỗi xảy ra khi xóa nhà cung cấp", "error")
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  const handleStatusChange = async (supplierId, newStatus) => {
    try {
      await updateSupplierStatus(supplierId, newStatus)

      // Update local state
      setSuppliers(prevSuppliers =>
        prevSuppliers.map(supplier =>
          supplier.supplierId === supplierId
            ? { ...supplier, status: newStatus }
            : supplier
        )
      )

      const statusText = newStatus === 1 ? "kích hoạt" : "ngừng hoạt động"
      window.showToast(`Đã ${statusText} nhà cung cấp thành công`, "success")
    } catch (error) {
      console.error("Error updating supplier status:", error)

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
            <h1 className="text-2xl font-bold text-slate-600">Quản lý Nhà cung cấp</h1>
            <p className="text-slate-600 mt-1">Quản lý các nhà cung cấp trong hệ thống</p>
          </div>
          <PermissionWrapper requiredPermission={PERMISSIONS.SUPPLIER_CREATE}>
            <Button
              className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="mr-2 h-4 w-4 text-white" />
              Thêm nhà cung cấp
            </Button>
          </PermissionWrapper>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalCount={totalStats.totalCount}
          activeCount={totalStats.activeCount}
          inactiveCount={totalStats.inactiveCount}
          totalLabel="Tổng nhà cung cấp"
          activeLabel="Đang hoạt động"
          inactiveLabel="Không hoạt động"
        />

        {/* Search and Table Combined */}
        <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
          <SearchFilterToggle
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo tên công ty hoặc thương hiệu..."
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
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("companyName")}>
                          <span>Tên công ty</span>
                          {sortField === "companyName" ? (
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
                        Thương hiệu
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Tên người liên hệ
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
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((supplier, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-slate-50 border-b border-slate-200"
                        >
                          <TableCell className="px-6 py-4 text-slate-600 font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">{supplier?.companyName || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">{supplier?.brandName || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">{supplier?.contactPersonName || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">{supplier?.contactPersonPhone || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <PermissionWrapper
                                requiredPermission={PERMISSIONS.SUPPLIER_UPDATE}
                                hide={false}
                                fallback={
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 ${supplier?.status === 1
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${supplier?.status === 1 ? 'bg-green-500' : 'bg-red-500'
                                      }`}></span>
                                    {supplier?.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                                  </span>
                                }
                              >
                                <StatusToggle
                                  status={supplier?.status}
                                  onStatusChange={handleStatusChange}
                                  supplierId={supplier?.supplierId}
                                  supplierName={supplier?.companyName}
                                  entityType="nhà cung cấp"
                                />
                              </PermissionWrapper>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <PermissionWrapper requiredPermission={PERMISSIONS.SUPPLIER_VIEW}>
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Xem chi tiết"
                                  onClick={() => handleViewClick(supplier)}
                                >
                                  <Eye className="h-4 w-4 text-orange-500" />
                                </button>
                              </PermissionWrapper>

                              <PermissionWrapper requiredPermission={PERMISSIONS.SUPPLIER_UPDATE}>
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Chỉnh sửa"
                                  onClick={() => handleUpdateClick(supplier)}
                                >
                                  <Edit className="h-4 w-4 text-orange-500" />
                                </button>
                              </PermissionWrapper>

                              <PermissionWrapper requiredPermission={PERMISSIONS.SUPPLIER_DELETE}>
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Xóa"
                                  onClick={() => handleDeleteClick(supplier)}
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
                        title="Không tìm thấy nhà cung cấp nào"
                        description={
                          searchQuery || statusFilter
                            ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                            : "Chưa có nhà cung cấp nào trong hệ thống"
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
                  Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} nhà cung cấp
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

      {/* Create Supplier Modal */}
      <CreateSupplier
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Update Supplier Modal */}
      <UpdateSupplier
        isOpen={showUpdateModal}
        onClose={handleUpdateCancel}
        onSuccess={handleUpdateSuccess}
        supplierId={updateSupplierId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.companyName || ""}
      />

      {/* View Supplier Detail Modal */}
      {showViewModal && itemToView && (
        <SupplierDetail
          supplier={itemToView}
          onClose={handleViewClose}
        />
      )}
    </div>
  )
}
