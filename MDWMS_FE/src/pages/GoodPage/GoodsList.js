import React, { useEffect, useState, useMemo } from "react";
import { getGoods, deleteGood, getGoodDetail } from "../../services/GoodService";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Plus, Edit, Trash2, Filter, ChevronDown, Eye } from "lucide-react";
import CreateGood from "./CreateGoodModal";
import UpdateGoodModal from "./UpdateGoodModal";
import DeleteModal from "../../components/Common/DeleteModal";
import { ProductDetail } from "./ViewGoodModal";
import { extractErrorMessage } from "../../utils/Validation";

// Type definition for Good
const Good = {
  goodsId: "",
  goodsCode: "",
  goodsName: "",
  categoryId: "",
  supplierId: "",
  storageConditionId: "",
  unitMeasureId: "",
  status: null,
};


export default function GoodsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [sortField, setSortField] = useState("")
  const [sortAscending, setSortAscending] = useState(true)
  const [goods, setGoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [itemToUpdate, setItemToUpdate] = useState(null)
  const [updateGoodId, setUpdateGoodId] = useState(null)
  const [itemToView, setItemToView] = useState(null)
  const [goodDetail, setGoodDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
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

      const response = await getGoods({
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
        setGoods(dataArray)
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.totalCount || dataArray.length
        }))
      } else {
        setGoods([])
        setPagination(prev => ({ ...prev, totalCount: 0 }))
      }
    } catch (error) {
      console.error("Error fetching goods:", error)
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tải danh sách hàng hóa")
      window.showToast(errorMessage, "error")
      setGoods([])
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
  const filteredGoods = useMemo(() => {
    // Just return the goods from API as they are already filtered
    return Array.isArray(goods) ? goods : []
  }, [goods])

  const activeCount = Array.isArray(goods) ? goods.filter((g) => g.status === 1).length : 0
  const inactiveCount = Array.isArray(goods) ? goods.filter((g) => g.status === 2).length : 0

  const handleCreateSuccess = () => {
    // Add small delay to ensure API has processed the new record
    setTimeout(() => {
      // Refresh data after successful creation
      fetchData({
        pageNumber: 1,
        pageSize: pagination.pageSize,
        search: searchQuery || "",
        sortField: sortField,
        sortAscending: sortAscending,
        status: statusFilter
      })
    }, 500)
  }

  const handleViewClick = async (good) => {
    try {
      console.log("Viewing good:", good)
      setItemToView(good)
      setLoadingDetail(true)
      setShowViewModal(true)

      const response = await getGoodDetail(good.goodsId)
      console.log("API Response:", response)

      // Handle API response structure: { status: 200, message: "Success", data: {...} }
      if (response && response.status === 200 && response.data) {
        setGoodDetail(response.data)
        console.log("Good detail set:", response.data)
      } else {
        console.log("Invalid response structure:", response)
        window.showToast("Không thể tải chi tiết hàng hóa", "error")
        setShowViewModal(false)
      }
    } catch (error) {
      console.error("Error fetching good detail:", error)
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tải chi tiết hàng hóa")
      window.showToast(errorMessage, "error")
      setShowViewModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleUpdateClick = (good) => {
    setItemToUpdate(good)
    setUpdateGoodId(good.goodsId)
    setShowUpdateModal(true)
  }

  const handleDeleteClick = (good) => {
    setItemToDelete(good)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      console.log("Deleting good:", itemToDelete)
      await deleteGood(itemToDelete?.goodsId)
      window.showToast(`Đã xóa hàng hóa: ${itemToDelete?.goodsName || ''}`, "success")
      setShowDeleteModal(false)
      setItemToDelete(null)

      // Calculate if current page will be empty after deletion
      const currentPageItemCount = goods.length
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
      console.error("Error deleting good:", error)

      // Sử dụng extractErrorMessage để xử lý lỗi từ API
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi xóa hàng hóa")
      window.showToast(`Lỗi: ${errorMessage}`, "error")
    }
  }

  const handleUpdateCancel = () => {
    setShowUpdateModal(false)
    setItemToUpdate(null)
    setUpdateGoodId(null)
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
    setUpdateGoodId(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  const handleViewClose = () => {
    setShowViewModal(false)
    setItemToView(null)
    setGoodDetail(null)
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
            <h1 className="text-3xl font-bold text-slate-900">Quản lý Hàng hóa</h1>
            <p className="text-slate-600 mt-1">Quản lý các hàng hóa sản phẩm trong hệ thống</p>
          </div>
          <Button
            className="bg-[#237486] hover:bg-[#1e5f6b] h-11 px-6 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm hàng hóa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-[#237486]">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-600">Tổng hàng hóa</div>
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
                placeholder="Tìm kiếm theo mã hoặc tên hàng hóa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Goods Table */}
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
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-32">
                        Mã hàng hóa
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-48">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 rounded p-1 -m-1" onClick={() => handleSort("goodsName")}>
                          <span>Tên hàng hóa</span>
                          <div className="flex flex-col">
                            <ChevronDown
                              className={`h-3 w-3 transition-colors ${sortField === "goodsName" && sortAscending
                                  ? 'text-white'
                                  : 'text-white/50'
                                }`}
                              style={{ transform: 'translateY(1px)' }}
                            />
                            <ChevronDown
                              className={`h-3 w-3 transition-colors ${sortField === "goodsName" && !sortAscending
                                  ? 'text-white'
                                  : 'text-white/50'
                                }`}
                              style={{ transform: 'translateY(-1px) rotate(180deg)' }}
                            />
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-24">
                        Danh mục
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-32">
                        Nhà cung cấp
                      </TableHead>
                      <TableHead className="font-semibold text-white px-4 py-3 first:pl-6 last:pr-6 border-0 w-24">
                        Đơn vị tính
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
                    {filteredGoods.length > 0 ? (
                      filteredGoods.map((good, index) => (
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
                          <TableCell className="font-medium text-slate-900 px-4 py-3 first:pl-6 last:pr-6 border-0 w-32">{good?.goodsCode || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0 w-48">{good?.goodsName || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0 w-24 text-center">{good?.categoryName || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0 w-32 text-center">{good?.companyName || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0 w-24 text-center">{good?.unitMeasureName || ''}</TableCell>
                          <TableCell className="text-slate-700 px-4 py-3 first:pl-6 last:pr-6 border-0 w-40 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${good?.status === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {good?.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-600 px-4 py-3 first:pl-6 last:pr-6 border-0 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title="Xem chi tiết"
                                onClick={() => handleViewClick(good)}
                              >
                                <Eye className="h-4 w-4 text-[#1a7b7b]" />
                              </button>
                              <button
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => handleUpdateClick(good)}
                              >
                                <Edit className="h-4 w-4 text-[#1a7b7b]" />
                              </button>
                              <button
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title="Xóa"
                                onClick={() => handleDeleteClick(good)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                          Không tìm thấy hàng hóa nào
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
                  Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} hàng hóa
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

      {/* Create Good Modal */}
      <CreateGood
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Update Good Modal */}
      <UpdateGoodModal
        isOpen={showUpdateModal}
        onClose={handleUpdateCancel}
        onSuccess={handleUpdateSuccess}
        goodId={updateGoodId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.goodsName || ""}
      />

      {/* View Good Detail Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Đang tải chi tiết hàng hóa...</div>
              </div>
            ) : goodDetail ? (
              <ProductDetail
                product={goodDetail}
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
