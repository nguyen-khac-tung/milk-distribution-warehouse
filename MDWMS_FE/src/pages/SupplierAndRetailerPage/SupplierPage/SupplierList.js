import React, { useEffect, useState, useMemo } from "react";
import { getSuppliers, deleteSupplier, updateSupplierStatus } from "../../../services/SupplierService";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Search, Plus, Edit, Trash2, Filter, ChevronDown, Eye } from "lucide-react";
import CreateSupplier from "./CreateSupplierModal";
import { SupplierDetail } from "./ViewSupplierModal";
import UpdateSupplier from "./UpdateSupplierModal";
import DeleteModal from "../../../components/Common/DeleteModal";
import { StatusToggle } from "../../../components/Common/SwitchToggle/StatusToggle";
import { extractErrorMessage } from "../../../utils/Validation";

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
  const [sortField, setSortField] = useState("")
  const [sortAscending, setSortAscending] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
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
    }
  }

  // Initial load
  useEffect(() => {
    fetchData({
      pageNumber: 1,
      pageSize: 10,
      search: searchQuery || "",
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter
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
  const filteredSuppliers = useMemo(() => {
    // Just return the suppliers from API as they are already filtered
    return Array.isArray(suppliers) ? suppliers : []
  }, [suppliers])

  const activeCount = Array.isArray(suppliers) ? suppliers.filter((s) => s.status === 1).length : 0
  const inactiveCount = Array.isArray(suppliers) ? suppliers.filter((s) => s.status === 2).length : 0

  const handleCreateSuccess = () => {
    // Set sort to companyName descending to show new record at top
    setSortField("companyName")
    setSortAscending(false)

    // Refresh data after successful creation with new sort
    fetchData({
      pageNumber: 1,
      pageSize: pagination.pageSize,
      search: searchQuery || "",
      sortField: "companyName",
      sortAscending: false,
      status: statusFilter
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

      // Refresh data after deletion, keeping current page or going to previous page if needed
      await fetchData({
        pageNumber: targetPage,
        pageSize: pagination.pageSize,
        searchQuery: searchQuery,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý Nhà cung cấp</h1>
            <p className="text-slate-600 mt-1">Quản lý các nhà cung cấp trong hệ thống</p>
          </div>
          <Button
            className="bg-[#237486] hover:bg-[#1e5f6b] h-11 px-6 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhà cung cấp
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-[#237486]">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-600">Tổng nhà cung cấp</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{pagination.totalCount}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-[#237486]">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-600">Đang hoạt động</div>
              <div className="text-3xl font-bold text-[#237486] mt-2">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-[#237486]">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-600">Không hoạt động</div>
              <div className="text-3xl font-bold text-slate-600 mt-2">{inactiveCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Tìm kiếm theo tên công ty hoặc thương hiệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card className="shadow-lg overflow-hidden p-0">
          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Đang tải dữ liệu...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-[#237486] hover:bg-[#237486] m-0 w-full">
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-20">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-96">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 rounded p-1 -m-1" onClick={() => handleSort("companyName")}>
                          <span>Tên công ty</span>
                          <div className="flex flex-col">
                            <ChevronDown
                              className={`h-3 w-3 transition-colors ${sortField === "companyName" && sortAscending
                                  ? 'text-white'
                                  : 'text-white/50'
                                }`}
                              style={{ transform: 'translateY(1px)' }}
                            />
                            <ChevronDown
                              className={`h-3 w-3 transition-colors ${sortField === "companyName" && !sortAscending
                                  ? 'text-white'
                                  : 'text-white/50'
                                }`}
                              style={{ transform: 'translateY(-1px) rotate(180deg)' }}
                            />
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0">
                        Thương hiệu
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-40">
                        <div className="flex items-center justify-center space-x-2">
                          <span>Trạng thái</span>
                          <div className="relative status-filter-dropdown">
                            <button
                              onClick={() => setShowStatusFilter(!showStatusFilter)}
                              className={`p-1 rounded hover:bg-white/20 transition-colors ${statusFilter ? 'bg-white/30' : ''
                                }`}
                              title="Lọc theo trạng thái"
                            >
                              <Filter className="h-4 w-4" />
                            </button>

                            {showStatusFilter && (
                              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                                <div className="py-1">
                                  <button
                                    onClick={clearStatusFilter}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Tất cả
                                    {!statusFilter && <span className="text-[#237486]">✓</span>}
                                  </button>
                                  <button
                                    onClick={() => handleStatusFilter("1")}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Hoạt động
                                    {statusFilter === "1" && <span className="text-[#237486]">✓</span>}
                                  </button>
                                  <button
                                    onClick={() => handleStatusFilter("2")}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Ngừng hoạt động
                                    {statusFilter === "2" && <span className="text-[#237486]">✓</span>}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 text-center">
                        Hoạt động
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((supplier, index) => (
                        <TableRow
                          key={index}
                          className={`
                            ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                            hover:bg-[#e6f4f4] transition-colors duration-150 m-0 w-full
                          `}
                        >
                          <TableCell className="text-slate-600 px-4 py-3 first:pl-6 last:pr-6 border-0 w-20 text-center font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 px-4 py-3 first:pl-6 last:pr-6 border-0 w-96">{supplier?.companyName || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0">{supplier?.brandName || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0 w-40 text-center">
                            <div className="flex justify-center">
                              <StatusToggle
                                status={supplier?.status}
                                onStatusChange={handleStatusChange}
                                supplierId={supplier?.supplierId}
                                supplierName={supplier?.companyName}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 px-4 py-3 first:pl-6 last:pr-6 border-0 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title="Xem chi tiết"
                                onClick={() => handleViewClick(supplier)}
                              >
                                <Eye className="h-4 w-4 text-[#1a7b7b]" />
                              </button>
                              <button 
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => handleUpdateClick(supplier)}
                              >
                                <Edit className="h-4 w-4 text-[#1a7b7b]" />
                              </button>
                              <button 
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title="Xóa"
                                onClick={() => handleDeleteClick(supplier)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Không tìm thấy nhà cung cấp nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

        {/* Pagination */}
        {!loading && pagination.totalCount > 0 && (
          <Card>
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
                        className="flex items-center space-x-2 px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#237486] focus:border-[#237486]"
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
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${pagination.pageSize === size ? 'bg-[#237486] text-white' : 'text-slate-700'
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
