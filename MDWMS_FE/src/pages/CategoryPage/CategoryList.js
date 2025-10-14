import React, { useEffect, useState, useMemo } from "react";
import { getCategory, deleteCategory } from "../../services/CategoryService/CategoryServices";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Edit, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import CreateCategory from "./CreateCategoryModal";
import UpdateCategory from "./UpdateCategoryModal";
import DeleteModal from "../../components/Common/DeleteModal";
import StatsCards from "../../components/Common/StatsCards";
import Loading from "../../components/Common/Loading";
import SearchFilterToggle from "../../components/Common/SearchFilterToggle";
import { extractErrorMessage } from "../../utils/Validation";

// Type definition for Category
const Category = {
  categoryName: "",
  description: "",
  status: null,
  createdAt: "",
  updateAt: ""
};


export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [sortField, setSortField] = useState("categoryName")
  const [sortAscending, setSortAscending] = useState(true)
  const [categories, setCategories] = useState([])
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

  // Thống kê tổng (không thay đổi khi search/filter)
  const [totalStats, setTotalStats] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0
  })

  // Fetch tổng thống kê (không có search/filter)
  const fetchTotalStats = async () => {
    try {
      const response = await getCategory({
        pageNumber: 1,
        pageSize: 1000, // Lấy tất cả để đếm
        search: "",
        sortField: "",
        sortAscending: true,
        status: "" // Không filter theo status
      })

      if (response && response.data) {
        const allCategories = Array.isArray(response.data.items) ? response.data.items : []
        const activeCount = allCategories.filter((c) => c.status === 1).length
        const inactiveCount = allCategories.filter((c) => c.status === 2).length

        setTotalStats({
          totalCount: response.data.totalCount || allCategories.length,
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


      const response = await getCategory({
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
        setCategories(dataArray)
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.totalCount || dataArray.length
        }))
      } else {
        setCategories([])
        setPagination(prev => ({ ...prev, totalCount: 0 }))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([])
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

    // Fetch dữ liệu hiển thị
    fetchData({
      pageNumber: 1,
      pageSize: 10,
      search: "",
      sortField: "categoryName",
      sortAscending: true,
      status: ""
    })

    // Mark initial mount as complete
    setIsInitialMount(false)
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
    // Skip on initial mount
    if (isInitialMount) {
      return
    }

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
  }, [searchQuery, isInitialMount])

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
  const filteredCategories = useMemo(() => {
    // Just return the categories from API as they are already filtered
    return Array.isArray(categories) ? categories : []
  }, [categories])

  const activeCount = Array.isArray(categories) ? categories.filter((c) => c.status === 1).length : 0
  const inactiveCount = Array.isArray(categories) ? categories.filter((c) => c.status === 2).length : 0

  const handleCreateSuccess = () => {
    // Refresh tổng thống kê
    fetchTotalStats()

    // Set sort to categoryName descending to show new record at top
    setSortField("categoryName")
    setSortAscending(false)

    // Refresh data after successful creation with new sort
    fetchData({
      pageNumber: 1,
      pageSize: pagination.pageSize,
      search: searchQuery || "",
      sortField: "categoryName",
      sortAscending: false,
      status: statusFilter
    })
  }

  const handleUpdateClick = (category) => {
    setItemToUpdate(category)
    setShowUpdateModal(true)
  }

  const handleDeleteClick = (category) => {
    setItemToDelete(category)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      console.log("Deleting category:", itemToDelete)
      await deleteCategory(itemToDelete?.categoryId)
      window.showToast(`Đã xóa danh mục: ${itemToDelete?.categoryName || ''}`, "success")
      setShowDeleteModal(false)
      setItemToDelete(null)

      // Calculate if current page will be empty after deletion
      const currentPageItemCount = categories.length
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
      console.error("Error deleting category:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi xóa danh mục")
      window.showToast(`Lỗi: ${cleanMsg}`, "error")
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
            <h1 className="text-2xl font-bold text-slate-600">Quản lý Danh mục</h1>
            <p className="text-slate-600 mt-1">Quản lý các danh mục sản phẩm trong hệ thống</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 h-8 px-6 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-white" />
            Thêm danh mục
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalCount={totalStats.totalCount}
          activeCount={totalStats.activeCount}
          inactiveCount={totalStats.inactiveCount}
          totalLabel="Tổng danh mục"
          activeLabel="Đang hoạt động"
          inactiveLabel="Không hoạt động"
        />

        {/* Search and Table Combined */}
        <Card className="shadow-sm border border-slate-200 overflow-hidden">
          <SearchFilterToggle
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo tên hoặc mô tả danh mục..."
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
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-16">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("categoryName")}>
                          <span>Tên danh mục</span>
                          {sortField === "categoryName" ? (
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
                        Mô tả
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
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category, index) => (
                        <TableRow
                          key={index}
                          className="bg-white hover:bg-slate-50 transition-colors duration-150 border-b border-slate-100"
                        >
                          <TableCell className="text-slate-600 px-6 py-3 text-left font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 px-6 py-3 text-left">
                            {category?.categoryName || ''}
                          </TableCell>
                          <TableCell className="text-slate-700 px-6 py-3 text-left">
                            {category?.description || ''}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category?.status === 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${category?.status === 1 ? 'bg-green-400' : 'bg-red-400'
                                }`}></span>
                              {category?.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => handleUpdateClick(category)}
                              >
                                <Edit className="h-4 w-4 text-[#d97706]" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                title="Xóa"
                                onClick={() => handleDeleteClick(category)}
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
                          Không tìm thấy danh mục nào
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
        {!loading && !searchLoading && pagination.totalCount > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} danh mục
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
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
                      className="h-8"
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
                        className="flex items-center space-x-2 px-3 py-2 h-8 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${pagination.pageSize === size ? 'bg-[#d97706] text-white' : 'text-slate-700'
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

      {/* Create Category Modal */}
      <CreateCategory
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Update Category Modal */}
      <UpdateCategory
        isOpen={showUpdateModal}
        onClose={handleUpdateCancel}
        onSuccess={handleCreateSuccess}
        categoryData={itemToUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.categoryName || ""}
      />
    </div>
  )
}
