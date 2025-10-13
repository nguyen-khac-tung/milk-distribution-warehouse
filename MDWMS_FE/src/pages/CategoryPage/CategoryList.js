import React, { useEffect, useState, useMemo } from "react";
import { getCategory, deleteCategory } from "../../services/CategoryService/CategoryServices";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Plus, Edit, Trash2, Filter, ChevronDown } from "lucide-react";
import CreateCategory from "./CreateCategoryModal";
import UpdateCategory from "./UpdateCategoryModal";
import DeleteModal from "../../components/Common/DeleteModal";
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
  const [sortField, setSortField] = useState("")
  const [sortAscending, setSortAscending] = useState(true)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
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
  const filteredCategories = useMemo(() => {
    // Just return the categories from API as they are already filtered
    return Array.isArray(categories) ? categories : []
  }, [categories])

  const activeCount = Array.isArray(categories) ? categories.filter((c) => c.status === 1).length : 0
  const inactiveCount = Array.isArray(categories) ? categories.filter((c) => c.status === 2).length : 0

  const handleCreateSuccess = () => {
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
            <h1 className="text-3xl font-bold text-slate-900">Quản lý Danh mục</h1>
            <p className="text-slate-600 mt-1">Quản lý các danh mục sản phẩm trong hệ thống</p>
          </div>
          <Button
            className="bg-[#237486] hover:bg-[#1e5f6b] h-11 px-6 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm danh mục
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-[#237486]">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-600">Tổng danh mục</div>
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
                placeholder="Tìm kiếm theo tên hoặc mô tả danh mục..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
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
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-40">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 rounded p-1 -m-1" onClick={() => handleSort("categoryName")}>
                          <span>Tên danh mục</span>
                          <div className="flex flex-col">
                            <ChevronDown
                              className={`h-3 w-3 transition-colors ${sortField === "categoryName" && sortAscending
                                  ? 'text-white'
                                  : 'text-white/50'
                                }`}
                              style={{ transform: 'translateY(1px)' }}
                            />
                            <ChevronDown
                              className={`h-3 w-3 transition-colors ${sortField === "categoryName" && !sortAscending
                                  ? 'text-white'
                                  : 'text-white/50'
                                }`}
                              style={{ transform: 'translateY(-1px) rotate(180deg)' }}
                            />
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0">
                        Mô tả
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
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-40">
                        Ngày tạo
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 text-center">
                        Hoạt động
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category, index) => (
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
                          <TableCell className="font-medium text-slate-900 px-4 py-3 first:pl-6 last:pr-6 border-0 w-40">{category?.categoryName || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0">{category?.description || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0 w-40 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${category?.status === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {category?.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-600 px-4 py-3 first:pl-6 last:pr-6 border-0 w-40">{category?.createdAt || ''}</TableCell>
                          <TableCell className="text-slate-600 px-4 py-3 first:pl-6 last:pr-6 border-0 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => handleUpdateClick(category)}
                              >
                                <Edit className="h-4 w-4 text-[#1a7b7b]" />
                              </button>
                              <button
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
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
                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
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
        {!loading && pagination.totalCount > 0 && (
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
