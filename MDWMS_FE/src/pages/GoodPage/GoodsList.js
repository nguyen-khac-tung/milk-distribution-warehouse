import React, { useEffect, useState, useMemo } from "react";
import { getGoods, deleteGood, getGoodDetail, updateGoodStatus } from "../../services/GoodService";
import { getCategoriesDropdown } from "../../services/CategoryService/CategoryServices";
import { getSuppliersDropdown } from "../../services/SupplierService";
import { getUnitMeasuresDropdown } from "../../services/UnitMeasureService";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Plus, Trash2, Filter, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, Eye, Package } from "lucide-react";
import CreateGood from "./CreateGoodModal";
import CreateBulkGoods from "./CreateBulkGoods";
import UpdateGoodModal from "./UpdateGoodModal";
import DeleteModal from "../../components/Common/DeleteModal";
import { ProductDetail } from "./ViewGoodModal";
import EditButton from "./EditButton";
import StatsCards from "../../components/Common/StatsCards";
import Loading from "../../components/Common/Loading";
import SearchFilterToggle from "../../components/Common/SearchFilterToggle";
import { StatusToggle } from "../../components/Common/SwitchToggle/StatusToggle";
import { extractErrorMessage } from "../../utils/Validation";
import EmptyState from "../../components/Common/EmptyState";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../utils/permissions";

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
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
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
  const [isInitialized, setIsInitialized] = useState(false)
  const [statsLoaded, setStatsLoaded] = useState(false)

  // Search queries for filter dropdowns
  const [statusSearchQuery, setStatusSearchQuery] = useState("")
  const [categorySearchQuery, setCategorySearchQuery] = useState("")
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("")
  const [unitMeasureSearchQuery, setUnitMeasureSearchQuery] = useState("")

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
    // Chỉ fetch stats nếu chưa load hoặc khi cần refresh
    if (statsLoaded) return

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
        setStatsLoaded(true)
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

      const requestParams = {
        pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : 1,
        pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : 10,
        search: normalizedSearch,
        sortField: searchParams.sortField || "",
        sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
        status: searchParams.status || "",
        categoryId: searchParams.categoryId || "",
        supplierId: searchParams.supplierId || "",
        unitMeasureId: searchParams.unitMeasureId || ""
      }

      const response = await getGoods(requestParams)

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

    // Mark as initialized after initial load
    setIsInitialized(true)
  }, []) // Empty dependency array - only run once on mount

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
        status: statusFilter,
        categoryId: categoryFilter,
        supplierId: supplierFilter,
        unitMeasureId: unitMeasureFilter
      })
      setPagination(prev => ({ ...prev, pageNumber: 1 }))
    }, searchQuery ? 500 : 0) // Only debounce for search, immediate for filters

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, categoryFilter, supplierFilter, unitMeasureFilter, sortField, sortAscending, isInitialized])


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
      // Reset stats loaded flag để refresh stats
      setStatsLoaded(false)
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
      setItemToView(good)
      setLoadingDetail(true)
      setShowViewModal(true)

      const response = await getGoodDetail(good.goodsId)

      // Handle API response structure: { status: 200, message: "Success", data: {...} }
      if (response && response.status === 200 && response.data) {
        const goodDetail = response.data
        setGoodDetail(goodDetail)
      } else {
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

      // Reset stats loaded flag để refresh stats
      setStatsLoaded(false)
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
    // Reset stats loaded flag để refresh stats
    setStatsLoaded(false)
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

  // Filter retailers, categories, suppliers, unit measures based on search query
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery) return categories
    const query = categorySearchQuery.toLowerCase()
    return categories.filter(category => {
      const categoryName = (category.categoryName || "").toLowerCase()
      return categoryName.includes(query)
    })
  }, [categories, categorySearchQuery])

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchQuery) return suppliers
    const query = supplierSearchQuery.toLowerCase()
    return suppliers.filter(supplier => {
      const supplierName = (supplier.companyName || "").toLowerCase()
      return supplierName.includes(query)
    })
  }, [suppliers, supplierSearchQuery])

  const filteredUnitMeasures = useMemo(() => {
    if (!unitMeasureSearchQuery) return unitMeasures
    const query = unitMeasureSearchQuery.toLowerCase()
    return unitMeasures.filter(unit => {
      const unitName = (unit.name || "").toLowerCase()
      return unitName.includes(query)
    })
  }, [unitMeasures, unitMeasureSearchQuery])

  const filteredStatusOptions = useMemo(() => {
    const statusOptions = [
      { value: "", label: "Tất cả trạng thái" },
      { value: "1", label: "Đang Phân Phối" },
      { value: "2", label: "Ngừng Phân Phối" }
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

  const handleCategoryFilter = (categoryId) => {
    setCategoryFilter(categoryId)
    setShowCategoryFilter(false)
    setCategorySearchQuery("")
  }

  const clearCategoryFilter = () => {
    setCategoryFilter("")
    setShowCategoryFilter(false)
    setCategorySearchQuery("")
  }

  const handleSupplierFilter = (supplierId) => {
    setSupplierFilter(supplierId)
    setShowSupplierFilter(false)
    setSupplierSearchQuery("")
  }

  const clearSupplierFilter = () => {
    setSupplierFilter("")
    setShowSupplierFilter(false)
    setSupplierSearchQuery("")
  }

  const handleUnitMeasureFilter = (unitMeasureId) => {
    setUnitMeasureFilter(unitMeasureId)
    setShowUnitMeasureFilter(false)
    setUnitMeasureSearchQuery("")
  }

  const clearUnitMeasureFilter = () => {
    setUnitMeasureFilter("")
    setShowUnitMeasureFilter(false)
    setUnitMeasureSearchQuery("")
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setStatusSearchQuery("")
    setCategoryFilter("")
    setCategorySearchQuery("")
    setSupplierFilter("")
    setSupplierSearchQuery("")
    setUnitMeasureFilter("")
    setUnitMeasureSearchQuery("")
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
      window.showToast(`Đã ${newStatus === 1 ? 'bắt đầu phân phối' : 'ngừng phân phối'} hàng hóa: ${goodsName}`, "success")

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

      // Reset stats loaded flag để refresh stats
      setStatsLoaded(false)
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
            <h1 className="text-2xl font-bold text-slate-600">Quản Lý Hàng Hóa</h1>
            <p className="text-slate-600 mt-1">Quản lý các hàng hóa hàng hóa trong hệ thống</p>
          </div>
          <div className="flex space-x-3">
            <PermissionWrapper requiredPermission={PERMISSIONS.GOODS_CREATE}>
              <Button
                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                onClick={() => setShowBulkCreateModal(true)}
              >
                <Package className="mr-2 h-4 w-4 text-white" />
                Thêm nhiều hàng hóa
              </Button>
            </PermissionWrapper>
            <PermissionWrapper requiredPermission={PERMISSIONS.GOODS_CREATE}>
              <Button
                className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="mr-2 h-4 w-4 text-white" />
                Thêm hàng hóa
              </Button>
            </PermissionWrapper>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalCount={totalStats.totalCount}
          activeCount={totalStats.activeCount}
          inactiveCount={totalStats.inactiveCount}
          totalLabel="Tổng hàng hóa"
          activeLabel="Đang Phân Phối"
          inactiveLabel="Ngừng Phân Phối"
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
              { value: "1", label: "Đang Phân Phối" },
              { value: "2", label: "Ngừng Phân Phối" }
            ]}
            onStatusFilter={handleStatusFilter}
            clearStatusFilter={clearStatusFilter}
            enableStatusSearch={true}
            statusSearchQuery={statusSearchQuery}
            setStatusSearchQuery={setStatusSearchQuery}
            filteredStatusOptions={filteredStatusOptions}
            // Category Filter
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            showCategoryFilter={showCategoryFilter}
            setShowCategoryFilter={setShowCategoryFilter}
            categories={categories}
            onCategoryFilter={handleCategoryFilter}
            clearCategoryFilter={clearCategoryFilter}
            enableCategorySearch={true}
            categorySearchQuery={categorySearchQuery}
            setCategorySearchQuery={setCategorySearchQuery}
            filteredCategories={filteredCategories}
            // Supplier Filter
            supplierFilter={supplierFilter}
            setSupplierFilter={setSupplierFilter}
            showSupplierFilter={showSupplierFilter}
            setShowSupplierFilter={setShowSupplierFilter}
            suppliers={suppliers}
            onSupplierFilter={handleSupplierFilter}
            clearSupplierFilter={clearSupplierFilter}
            enableSupplierSearch={true}
            supplierSearchQuery={supplierSearchQuery}
            setSupplierSearchQuery={setSupplierSearchQuery}
            filteredSuppliers={filteredSuppliers}
            // Unit Measure Filter
            unitMeasureFilter={unitMeasureFilter}
            setUnitMeasureFilter={setUnitMeasureFilter}
            showUnitMeasureFilter={showUnitMeasureFilter}
            setShowUnitMeasureFilter={setShowUnitMeasureFilter}
            unitMeasures={unitMeasures}
            onUnitMeasureFilter={handleUnitMeasureFilter}
            clearUnitMeasureFilter={clearUnitMeasureFilter}
            enableUnitMeasureSearch={true}
            unitMeasureSearchQuery={unitMeasureSearchQuery}
            setUnitMeasureSearchQuery={setUnitMeasureSearchQuery}
            filteredUnitMeasures={filteredUnitMeasures}
            onClearAll={clearAllFilters}
          />


          {/* Table */}
          <div className="w-full min-h-[200px]">
            {loading ? (
              <Loading size="large" text="Đang tải dữ liệu..." />
            ) : searchLoading ? (
              <Loading size="medium" text="Đang tìm kiếm..." />
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left min-w-[30px]">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1 min-w-[140px]" onClick={() => handleSort("goodsCode")}>
                          <span>Mã hàng hóa</span>
                          {sortField === "goodsCode" ? (
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left min-w-[120px]">
                        Danh mục
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1" onClick={() => handleSort("companyName")}>
                          <span>Nhà cung cấp</span>
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
                      <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left min-w-[120px]">
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
                          className="hover:bg-slate-50 border-b border-slate-200 min-h-[60px]"
                        >
                          <TableCell className="px-6 py-4 text-slate-600 font-medium">
                            {(pagination.pageNumber - 1) * pagination.pageSize + (index + 1)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">{good?.goodsCode || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-medium">{good?.goodsName || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">{good?.categoryName || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">{good?.companyName || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700">{good?.unitMeasureName || ''}</TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <PermissionWrapper
                                requiredPermission={PERMISSIONS.GOODS_UPDATE}
                                hide={false}
                                fallback={
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 ${good?.status === 1
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${good?.status === 1 ? 'bg-green-500' : 'bg-red-500'
                                      }`}></span>
                                    {good?.status === 1 ? 'Đang Phân Phối' : 'Ngừng Phân Phối'}
                                  </span>
                                }
                              >
                                <StatusToggle
                                  status={good?.status}
                                  onStatusChange={handleStatusChange}
                                  supplierId={good?.goodsId}
                                  supplierName={good?.goodsName}
                                  entityType="hàng hóa"
                                />
                              </PermissionWrapper>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <PermissionWrapper requiredPermission={PERMISSIONS.GOODS_VIEW}>
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Xem chi tiết"
                                  onClick={() => handleViewClick(good)}
                                >
                                  <Eye className="h-4 w-4 text-orange-500" />
                                </button>
                              </PermissionWrapper>

                              <EditButton
                                good={good}
                                onUpdateClick={handleUpdateClick}
                              />

                              <PermissionWrapper requiredPermission={PERMISSIONS.GOODS_DELETE}>
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                  title="Xóa"
                                  onClick={() => handleDeleteClick(good)}
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
                        title="Không tìm thấy hàng hóa nào"
                        description={
                          searchQuery || statusFilter || categoryFilter || supplierFilter || unitMeasureFilter
                            ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                            : "Chưa có hàng hóa nào trong hệ thống"
                        }
                        actionText="Xóa bộ lọc"
                        onAction={clearAllFilters}
                        showAction={!!(searchQuery || statusFilter || categoryFilter || supplierFilter || unitMeasureFilter)}
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
                  Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} hàng hóa
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
                      className="h-[38px]"
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

      {/* Create Good Modal */}
      <CreateGood
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Create Bulk Goods Modal */}
      <CreateBulkGoods
        isOpen={showBulkCreateModal}
        onClose={() => setShowBulkCreateModal(false)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4" style={{ zIndex: 99999 }}>
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
