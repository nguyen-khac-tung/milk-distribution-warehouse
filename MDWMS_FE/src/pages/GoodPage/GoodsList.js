import React, { useEffect, useState, useMemo } from "react";
import { getGoods, deleteGood, getGoodDetail, updateGoodStatus } from "../../services/GoodService";
import { getCategoriesDropdown } from "../../services/CategoryService/CategoryServices";
import { getSuppliersDropdown } from "../../services/SupplierService";
import { getUnitMeasuresDropdown } from "../../services/UnitMeasureService";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Plus, Edit, Trash2, Filter, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, Eye } from "lucide-react";
import CreateGood from "./CreateGoodModal";
import UpdateGoodModal from "./UpdateGoodModal";
import DeleteModal from "../../components/Common/DeleteModal";
import { ProductDetail } from "./ViewGoodModal";
import StatsCards from "../../components/Common/StatsCards";
import Loading from "../../components/Common/Loading";
import SearchFilterToggle from "../../components/Common/SearchFilterToggle";
import { StatusToggle } from "../../components/Common/SwitchToggle/StatusToggle";
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
  const [categoryFilter, setCategoryFilter] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [unitMeasureFilter, setUnitMeasureFilter] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [showSupplierFilter, setShowSupplierFilter] = useState(false)
  const [showUnitMeasureFilter, setShowUnitMeasureFilter] = useState(false)
  const [sortField, setSortField] = useState("goodsName")
  const [sortAscending, setSortAscending] = useState(true)
  const [goods, setGoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
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
  
  // Dropdown data for filters
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [unitMeasures, setUnitMeasures] = useState([])
  
  // Thống kê tổng (không thay đổi khi search/filter)
  const [totalStats, setTotalStats] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0
  })

  // Load dropdown data for filters
  const loadDropdownData = async () => {
    try {
      const [categoriesRes, suppliersRes, unitMeasuresRes] = await Promise.all([
        getCategoriesDropdown(),
        getSuppliersDropdown(),
        getUnitMeasuresDropdown()
      ])
      
      setCategories(categoriesRes?.data || [])
      setSuppliers(suppliersRes?.data || [])
      setUnitMeasures(unitMeasuresRes?.data || [])
    } catch (error) {
      console.error("Error loading dropdown data:", error)
    }
  }

  // Fetch tổng thống kê (không có search/filter)
  const fetchTotalStats = async () => {
    try {
      const response = await getGoods({
        pageNumber: 1,
        pageSize: 1000, // Lấy tất cả để đếm
        search: "",
        sortField: "",
        sortAscending: true,
        status: "",
        categoryId: "",
        supplierId: "",
        unitMeasureId: ""
      })

      if (response && response.data) {
        const allGoods = Array.isArray(response.data.items) ? response.data.items : []
        const activeCount = allGoods.filter((g) => g.status === 1).length
        const inactiveCount = allGoods.filter((g) => g.status === 2).length
        
        setTotalStats({
          totalCount: response.data.totalCount || allGoods.length,
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

      const requestParams = {
        pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : 1,
        pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : 10,
        search: searchParams.search !== undefined ? searchParams.search : "",
        sortField: searchParams.sortField || "",
        sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
        status: searchParams.status || "",
        categoryId: searchParams.categoryId || "",
        supplierId: searchParams.supplierId || "",
        unitMeasureId: searchParams.unitMeasureId || ""
      }

      console.log("fetchData - searchParams received:", searchParams)
      console.log("fetchData - requestParams built:", requestParams)
      console.log("fetchData - current state:", { searchQuery, statusFilter, categoryFilter, supplierFilter, unitMeasureFilter })

      const response = await getGoods(requestParams)
      console.log("fetchData - Full response:", response)

      if (response && response.data) {
        // API returns response.data.items (array) and response.data.totalCount
        const dataArray = Array.isArray(response.data.items) ? response.data.items : []
        console.log("fetchData - Data array from response:", dataArray)
        
        // Gọi API detail cho từng item để lấy isDisable
        const enrichedData = await Promise.all(
          dataArray.map(async (good) => {
            try {
              const detailResponse = await getGoodDetail(good.goodsId)
              if (detailResponse && detailResponse.status === 200 && detailResponse.data) {
                const enrichedGood = {
                  ...good,
                  isDisable: detailResponse.data.isDisable
                }
                return enrichedGood
              }
            } catch (error) {
              console.error(`Error fetching detail for ${good.goodsName}:`, error)
            }
            return good
          })
        )
        
        console.log("fetchData - Enriched data:", enrichedData)
        setGoods(enrichedData)
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.totalCount || enrichedData.length
        }))
      } else {
        console.log("fetchData - No data or success false")
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
      setSearchLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    // Load dropdown data for filters
    loadDropdownData()
    
    // Fetch tổng thống kê khi component mount
    fetchTotalStats()
    
    // Reset tất cả filter và sort về mặc định
    setSearchQuery("")
    setStatusFilter("")
    setCategoryFilter("")
    setSupplierFilter("")
    setUnitMeasureFilter("")
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
      status: "",
      categoryId: "",
      supplierId: "",
      unitMeasureId: ""
    })
  }, [])

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusFilter && !event.target.closest('.status-filter-dropdown')) {
        setShowStatusFilter(false)
      }
      if (showCategoryFilter && !event.target.closest('.category-filter-dropdown')) {
        setShowCategoryFilter(false)
      }
      if (showSupplierFilter && !event.target.closest('.supplier-filter-dropdown')) {
        setShowSupplierFilter(false)
      }
      if (showUnitMeasureFilter && !event.target.closest('.unit-measure-filter-dropdown')) {
        setShowUnitMeasureFilter(false)
      }
      if (showPageSizeFilter && !event.target.closest('.page-size-filter-dropdown')) {
        setShowPageSizeFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStatusFilter, showCategoryFilter, showSupplierFilter, showUnitMeasureFilter, showPageSizeFilter])

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
        status: statusFilter,
        categoryId: categoryFilter,
        supplierId: supplierFilter,
        unitMeasureId: unitMeasureFilter
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
      status: statusFilter,
      categoryId: categoryFilter,
      supplierId: supplierFilter,
      unitMeasureId: unitMeasureFilter
    })
    setPagination(prev => ({ ...prev, pageNumber: 1 }))
  }, [statusFilter])

  // Filter by category
  useEffect(() => {
    setSearchLoading(true)
    fetchData({
      pageNumber: 1,
      pageSize: pagination.pageSize,
      search: searchQuery || "",
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter,
      categoryId: categoryFilter,
      supplierId: supplierFilter,
      unitMeasureId: unitMeasureFilter
    })
    setPagination(prev => ({ ...prev, pageNumber: 1 }))
  }, [categoryFilter])

  // Filter by supplier
  useEffect(() => {
    setSearchLoading(true)
    fetchData({
      pageNumber: 1,
      pageSize: pagination.pageSize,
      search: searchQuery || "",
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter,
      categoryId: categoryFilter,
      supplierId: supplierFilter,
      unitMeasureId: unitMeasureFilter
    })
    setPagination(prev => ({ ...prev, pageNumber: 1 }))
  }, [supplierFilter])

  // Filter by unit measure
  useEffect(() => {
    setSearchLoading(true)
    fetchData({
      pageNumber: 1,
      pageSize: pagination.pageSize,
      search: searchQuery || "",
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter,
      categoryId: categoryFilter,
      supplierId: supplierFilter,
      unitMeasureId: unitMeasureFilter
    })
    setPagination(prev => ({ ...prev, pageNumber: 1 }))
  }, [unitMeasureFilter])

  // Sort when sortField or sortAscending changes
  useEffect(() => {
    setSearchLoading(true)
    fetchData({
      pageNumber: 1,
      pageSize: pagination.pageSize,
      search: searchQuery || "",
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter,
      categoryId: categoryFilter,
      supplierId: supplierFilter,
      unitMeasureId: unitMeasureFilter
    })
    setPagination(prev => ({ ...prev, pageNumber: 1 }))
  }, [sortField, sortAscending])


  // Remove client-side filtering since backend already handles search and filter
  const filteredGoods = useMemo(() => {
    // Just return the goods from API as they are already filtered
    return Array.isArray(goods) ? goods : []
  }, [goods])

  // Thống kê hiện tại (có thể thay đổi khi search/filter)
  const currentActiveCount = Array.isArray(goods) ? goods.filter((g) => g.status === 1).length : 0
  const currentInactiveCount = Array.isArray(goods) ? goods.filter((g) => g.status === 2).length : 0

  const handleCreateSuccess = () => {
    // Add small delay to ensure API has processed the new record
    setTimeout(() => {
      // Refresh tổng thống kê
      fetchTotalStats()
      
      // Reset về trang đầu và không có sort/filter để item mới hiển thị ở đầu
      setSearchQuery("")
      setStatusFilter("")
      setCategoryFilter("")
      setSupplierFilter("")
      setUnitMeasureFilter("")
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
        status: "",
        categoryId: "",
        supplierId: "",
        unitMeasureId: ""
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
        const goodDetail = response.data
        setGoodDetail(goodDetail)
        
        
        // Update isDisable status in the goods list
        setGoods(prevGoods => 
          prevGoods.map(item => 
            item.goodsId === good.goodsId 
              ? { ...item, isDisable: goodDetail.isDisable }
              : item
          )
        )
        
        console.log("Good detail set:", goodDetail)
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

      // Refresh tổng thống kê
      fetchTotalStats()
      
      // Refresh data after deletion, keeping current page or going to previous page if needed
      fetchData({
        pageNumber: targetPage,
        pageSize: pagination.pageSize,
        search: searchQuery || "",
        sortField: sortField,
        sortAscending: sortAscending,
        status: statusFilter,
        categoryId: categoryFilter,
        supplierId: supplierFilter,
        unitMeasureId: unitMeasureFilter
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
    // Refresh tổng thống kê
    fetchTotalStats()
    
    // Refresh data after successful update
    fetchData({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      search: searchQuery || "",
      sortField: sortField,
      sortAscending: sortAscending,
      status: statusFilter,
      categoryId: categoryFilter,
      supplierId: supplierFilter,
      unitMeasureId: unitMeasureFilter
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

  const handleCategoryFilter = (categoryId) => {
    setCategoryFilter(categoryId)
    setShowCategoryFilter(false)
  }

  const clearCategoryFilter = () => {
    setCategoryFilter("")
    setShowCategoryFilter(false)
  }

  const handleSupplierFilter = (supplierId) => {
    setSupplierFilter(supplierId)
    setShowSupplierFilter(false)
  }

  const clearSupplierFilter = () => {
    setSupplierFilter("")
    setShowSupplierFilter(false)
  }

  const handleUnitMeasureFilter = (unitMeasureId) => {
    setUnitMeasureFilter(unitMeasureId)
    setShowUnitMeasureFilter(false)
  }

  const clearUnitMeasureFilter = () => {
    setUnitMeasureFilter("")
    setShowUnitMeasureFilter(false)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setCategoryFilter("")
    setSupplierFilter("")
    setUnitMeasureFilter("")
    setShowStatusFilter(false)
    setShowCategoryFilter(false)
    setShowSupplierFilter(false)
    setShowUnitMeasureFilter(false)
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
      status: statusFilter,
      categoryId: categoryFilter,
      supplierId: supplierFilter,
      unitMeasureId: unitMeasureFilter
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

  const handleStatusChange = async (goodsId, newStatus, goodsName) => {
    try {
      // Update status via API
      await updateGoodStatus({
        goodsId: parseInt(goodsId),
        status: newStatus
      })

      // Show success message
      window.showToast(`Đã ${newStatus === 1 ? 'kích hoạt' : 'vô hiệu hóa'} hàng hóa: ${goodsName}`, "success")

      // Refresh data
      fetchData({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search: searchQuery || "",
        sortField: sortField,
        sortAscending: sortAscending,
        status: statusFilter,
        categoryId: categoryFilter,
        supplierId: supplierFilter,
        unitMeasureId: unitMeasureFilter
      })

      // Refresh total stats
      fetchTotalStats()
    } catch (error) {
      console.error("Error updating goods status:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật trạng thái hàng hóa")
      window.showToast(`Lỗi: ${cleanMsg}`, "error")
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-600">Quản lý Hàng hóa</h1>
            <p className="text-slate-600 mt-1">Quản lý các hàng hóa sản phẩm trong hệ thống</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 h-8 px-6 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-white" />
            Thêm hàng hóa
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalCount={totalStats.totalCount}
          activeCount={totalStats.activeCount}
          inactiveCount={totalStats.inactiveCount}
          totalLabel="Tổng hàng hóa"
          activeLabel="Đang hoạt động"
          inactiveLabel="Không hoạt động"
        />

        {/* Search and Table Combined */}
        <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
          <SearchFilterToggle
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo mã hoặc tên hàng hóa..."
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
            // Category Filter
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            showCategoryFilter={showCategoryFilter}
            setShowCategoryFilter={setShowCategoryFilter}
            categories={categories}
            onCategoryFilter={handleCategoryFilter}
            clearCategoryFilter={clearCategoryFilter}
            // Supplier Filter
            supplierFilter={supplierFilter}
            setSupplierFilter={setSupplierFilter}
            showSupplierFilter={showSupplierFilter}
            setShowSupplierFilter={setShowSupplierFilter}
            suppliers={suppliers}
            onSupplierFilter={handleSupplierFilter}
            clearSupplierFilter={clearSupplierFilter}
            // Unit Measure Filter
            unitMeasureFilter={unitMeasureFilter}
            setUnitMeasureFilter={setUnitMeasureFilter}
            showUnitMeasureFilter={showUnitMeasureFilter}
            setShowUnitMeasureFilter={setShowUnitMeasureFilter}
            unitMeasures={unitMeasures}
            onUnitMeasureFilter={handleUnitMeasureFilter}
            clearUnitMeasureFilter={clearUnitMeasureFilter}
            onClearAll={clearAllFilters}
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
                        Mã hàng hóa
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("goodsName")}>
                          <span>Tên hàng hóa</span>
                          {sortField === "goodsName" ? (
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
                        Danh mục
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Nhà cung cấp
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        Đơn vị tính
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
                    {filteredGoods.length > 0 ? (
                      filteredGoods.map((good, index) => (
                        <TableRow
                          key={index}
                          className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150 border-b border-slate-100"
                        >
                          <TableCell className="text-slate-600 px-6 py-3 text-left font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 px-6 py-3 text-left">
                            {good?.goodsCode || ''}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 px-6 py-3 text-left">
                            {good?.goodsName || ''}
                          </TableCell>
                          <TableCell className="text-slate-700 px-6 py-3 text-left">
                            {good?.categoryName || ''}
                          </TableCell>
                          <TableCell className="text-slate-700 px-6 py-3 text-left">
                            {good?.companyName || ''}
                          </TableCell>
                          <TableCell className="text-slate-700 px-6 py-3 text-left">
                            {good?.unitMeasureName || ''}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-center">
                            <div className="flex justify-center">
                              <StatusToggle
                                status={good?.status}
                                onStatusChange={handleStatusChange}
                                supplierId={good?.goodsId}
                                supplierName={good?.goodsName}
                                entityType="hàng hóa"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Xem chi tiết"
                                onClick={() => handleViewClick(good)}
                              >
                                <Eye className="h-4 w-4 text-orange-500" />
                              </button>
                              {!good?.isDisable && (
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Chỉnh sửa"
                                  onClick={() => handleUpdateClick(good)}
                                >
                                  <Edit className="h-4 w-4 text-orange-500" />
                                </button>
                              )}
                              <button
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
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
        {!loading && !searchLoading && pagination.totalCount > 0 && (
          <Card className="bg-gray-50">
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
                            status: statusFilter,
                            categoryId: categoryFilter,
                            supplierId: supplierFilter,
                            unitMeasureId: unitMeasureFilter
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
                            status: statusFilter,
                            categoryId: categoryFilter,
                            supplierId: supplierFilter,
                            unitMeasureId: unitMeasureFilter
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
                        className="flex items-center space-x-2 px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${pagination.pageSize === size ? 'bg-orange-500 text-white' : 'text-slate-700'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4" style={{zIndex: 99999}}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingDetail ? (
              <Loading size="large" text="Đang tải chi tiết hàng hóa..." />
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
