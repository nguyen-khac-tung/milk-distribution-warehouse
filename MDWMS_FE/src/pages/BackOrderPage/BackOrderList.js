import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBackOrders, deleteBackOrder, updateBackOrder, updateBackOrderStatus } from "../../services/BackOrderService";
import { getGoodDetail } from "../../services/GoodService";
import { getSuppliersDropdown } from "../../services/SupplierService";
import { getAllRetailersDropdown } from "../../services/RetailerService";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Edit, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Eye, Building2, Plus } from "lucide-react";
import { BackOrderDetail } from "./ViewBackOrderModal";
import UpdateBackOrder from "./UpdateBackOrderModal";
import DeleteModal from "../../components/Common/DeleteModal";
import { StatusToggle } from "../../components/Common/SwitchToggle/StatusToggle";
import StatsCards from "../../components/Common/StatsCards";
import Loading from "../../components/Common/Loading";
import SearchFilterToggle from "../../components/Common/SearchFilterToggle";
import { extractErrorMessage } from "../../utils/Validation";
import EmptyState from "../../components/Common/EmptyState";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../utils/permissions";

// Type definition for BackOrder
const BackOrder = {
    backOrderId: "",
    retailerName: "",
    goodsName: "",
    status: null,
    quantity: "",
    createdBy: ""
};

// Map trạng thái động của tồn kho -> tiếng Việt
const STATUS_DYNAMIC_LABELS = {
    Available: "Có sẵn",
    Unavailable: "Không có sẵn",
};

const getStatusDynamicLabel = (statusDinamic) => {
    if (!statusDinamic) return "";
    return STATUS_DYNAMIC_LABELS[statusDinamic] || statusDinamic;
};


export default function BackOrderList() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [showStatusFilter, setShowStatusFilter] = useState(false)
    const [retailerFilter, setRetailerFilter] = useState("")
    const [showRetailerFilter, setShowRetailerFilter] = useState(false)
    const [sortField, setSortField] = useState("retailerName")
    const [sortAscending, setSortAscending] = useState(true)
    const [isInitialMount, setIsInitialMount] = useState(true)
    const [backOrders, setBackOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)
    const [updateBackOrderId, setUpdateBackOrderId] = useState(null)
    const [itemToView, setItemToView] = useState(null)
    const [selectedBackOrders, setSelectedBackOrders] = useState(new Set())
    const [suppliers, setSuppliers] = useState([])
    const [retailers, setRetailers] = useState([])
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0
    })
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [retailerSearchQuery, setRetailerSearchQuery] = useState("")
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
            const response = await getBackOrders({
                pageNumber: 1,
                pageSize: 1000, // Lấy tất cả để đếm
                search: "",
                sortField: "",
                sortAscending: true,
                status: "" // Không filter theo status
            })
            console.log("BackOrder: ", response)

            if (response) {
                const payload = response.data ?? response
                const dataArray = Array.isArray(payload.items) ? payload.items : []
                const totalCount = payload.totalCount || dataArray.length

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


            const response = await getBackOrders({
                pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : 1,
                pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : 10,
                search: searchParams.search !== undefined ? searchParams.search : "",
                sortField: searchParams.sortField || "",
                sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
                filters: {
                    status: searchParams.status || "",
                    retailerId: searchParams.retailerId || ""
                }
            })

            console.log("BackOrder response: ", response)

            if (response) {
                // Support response either wrapped in .data or direct
                const payload = response.data ?? response
                const dataArray = Array.isArray(payload.items) ? payload.items : []
                console.log("BackOrder items: ", dataArray)
                setBackOrders(dataArray)
                setPagination(prev => ({
                    ...prev,
                    totalCount: payload.totalCount || dataArray.length,
                    pageNumber: payload.pageNumber || prev.pageNumber
                }))
            } else {
                console.log("No data found in response")
                setBackOrders([])
                setPagination(prev => ({ ...prev, totalCount: 0 }))
            }
        } catch (error) {
            console.error("Error fetching backOrders:", error)
            setBackOrders([])
            setPagination(prev => ({ ...prev, totalCount: 0 }))
        } finally {
            setLoading(false)
            setSearchLoading(false)
        }
    }

    // Load suppliers on mount
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const response = await getSuppliersDropdown();
                const suppliersData = response?.data || response?.items || response || [];
                setSuppliers(suppliersData);
            } catch (error) {
                console.error("Error loading suppliers:", error);
                setSuppliers([]);
            }
        };
        loadSuppliers();
    }, []);

    // Load retailers on mount
    useEffect(() => {
        const loadRetailers = async () => {
            try {
                const response = await getAllRetailersDropdown();
                const retailersData = response?.data || response?.items || response || [];
                setRetailers(Array.isArray(retailersData) ? retailersData : []);
            } catch (error) {
                console.error("Error loading retailers:", error);
                setRetailers([]);
            }
        };
        loadRetailers();
    }, []);

    // Initial load
    useEffect(() => {
        // Fetch tổng thống kê khi component mount
        fetchTotalStats()

        // Reset tất cả filter và sort về mặc định
        setSearchQuery("")
        setStatusFilter("")
        setRetailerFilter("")
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
            retailerId: ""
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
            if (showRetailerFilter && !event.target.closest('.retailer-filter-dropdown')) {
                setShowRetailerFilter(false)
                setRetailerSearchQuery("")
            }
            if (showPageSizeFilter && !event.target.closest('.page-size-filter-dropdown')) {
                setShowPageSizeFilter(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showStatusFilter, showRetailerFilter, showPageSizeFilter])

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
                retailerId: retailerFilter
            })
            setPagination(prev => ({ ...prev, pageNumber: 1 }))
        }, searchQuery ? 500 : 0) // Only debounce for search, immediate for filters

        return () => clearTimeout(timeoutId)
    }, [searchQuery, statusFilter, retailerFilter, sortField, sortAscending, isInitialized])

    // Remove client-side filtering since backend already handles search and filter
    const filteredBackOrders = useMemo(() => {
        // Just return the backOrders from API as they are already filtered
        return Array.isArray(backOrders) ? backOrders : []
    }, [backOrders])

    const activeCount = Array.isArray(backOrders) ? backOrders.filter((s) => s.status === 1).length : 0
    const inactiveCount = Array.isArray(backOrders) ? backOrders.filter((s) => s.status === 2).length : 0

    const handleViewClick = (backOrder) => {
        setItemToView(backOrder)
        setShowViewModal(true)
    }

    const handleUpdateClick = (backOrder) => {
        setUpdateBackOrderId(backOrder.backOrderId)
        setShowUpdateModal(true)
    }

    const handleDeleteClick = (backOrder) => {
        setItemToDelete(backOrder)
        setShowDeleteModal(true)
    }

    const handleViewClose = () => {
        setShowViewModal(false)
        setItemToView(null)
    }

    const handleUpdateSuccess = () => {
        setShowUpdateModal(false)
        setUpdateBackOrderId(null)
        fetchData({
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            search: searchQuery || "",
            sortField: sortField,
            sortAscending: sortAscending,
            status: statusFilter,
            retailerId: retailerFilter
        })
    }

    const handleUpdateCancel = () => {
        setShowUpdateModal(false)
        setUpdateBackOrderId(null)
    }

    const handleDeleteConfirm = async () => {
        try {
            console.log("Deleting backOrder:", itemToDelete)
            await deleteBackOrder(itemToDelete?.backOrderId)
            window.showToast(`Đã xóa đơn đặt hàng: ${itemToDelete?.retailerName || ''}`, "success")
            setShowDeleteModal(false)
            setItemToDelete(null)

            // Calculate if current page will be empty after deletion
            const currentPageItemCount = backOrders.length
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
                status: statusFilter,
                retailerId: retailerFilter
            })
        } catch (error) {
            console.error("Error deleting backOrder:", error)
            window.showToast("Có lỗi xảy ra khi xóa đơn đặt hàng", "error")
        }
    }

    const handleDeleteCancel = () => {
        setShowDeleteModal(false)
        setItemToDelete(null)
    }

    const handleStatusChange = async (backOrderId, newStatus) => {
        try {
            await updateBackOrderStatus({ backOrderId, status: newStatus })

            // Update local state
            setBackOrders(prevBackOrders =>
                prevBackOrders.map(backOrder =>
                    backOrder.backOrderId === backOrderId
                        ? { ...backOrder, status: newStatus }
                        : backOrder
                )
            )

            const statusText = newStatus === 1 ? "kích hoạt" : "ngừng hoạt động"
            window.showToast(`Đã ${statusText} đơn đặt hàng thành công`, "success")
        } catch (error) {
            console.error("Error updating backOrder status:", error)

            // Sử dụng extractErrorMessage để xử lý lỗi nhất quán
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật trạng thái")
            window.showToast(errorMessage, "error")
        }
    }


    const handleStatusFilter = (status) => {
        setStatusFilter(status)
        setShowStatusFilter(false)
        setStatusSearchQuery("") // Clear search when selecting
    }

    const clearStatusFilter = () => {
        setStatusFilter("")
        setShowStatusFilter(false)
        setStatusSearchQuery("")
    }

    const handleRetailerFilter = (retailerId) => {
        setRetailerFilter(retailerId)
        setShowRetailerFilter(false)
        setRetailerSearchQuery("") // Clear search when selecting
    }

    const clearRetailerFilter = () => {
        setRetailerFilter("")
        setShowRetailerFilter(false)
        setRetailerSearchQuery("")
    }

    // Filter retailers based on search query
    const filteredRetailers = useMemo(() => {
        if (!retailerSearchQuery) return retailers
        const query = retailerSearchQuery.toLowerCase()
        return retailers.filter(retailer => {
            const retailerName = (retailer.companyName || retailer.retailerName || "").toLowerCase()
            return retailerName.includes(query)
        })
    }, [retailers, retailerSearchQuery])

    // Filter status options based on search query
    const filteredStatusOptions = useMemo(() => {
        const statusOptions = [
            { value: "", label: "Tất cả trạng thái" },
            { value: "1", label: "Đang xử lý" },
            { value: "2", label: "Đã hoàn thành" }
        ]
        if (!statusSearchQuery) return statusOptions
        const query = statusSearchQuery.toLowerCase()
        return statusOptions.filter(option => 
            option.label.toLowerCase().includes(query)
        )
    }, [statusSearchQuery])

    const handleClearAllFilters = () => {
        setSearchQuery("")
        setStatusFilter("")
        setShowStatusFilter(false)
        setStatusSearchQuery("")
        setRetailerFilter("")
        setShowRetailerFilter(false)
        setRetailerSearchQuery("")
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
            status: statusFilter,
            retailerId: retailerFilter
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

    // Xử lý checkbox cho từng đơn
    const handleCheckboxChange = (backOrderId, checked) => {
        setSelectedBackOrders(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(backOrderId);
            } else {
                newSet.delete(backOrderId);
            }
            return newSet;
        });
    };

    // Xử lý select all (chỉ chọn các đơn có statusDinamic === 'Available')
    const handleSelectAll = (checked) => {
        if (checked) {
            const availableBackOrderIds = filteredBackOrders
                .filter(bo => bo.statusDinamic === 'Available')
                .map(bo => bo.backOrderId);
            setSelectedBackOrders(new Set(availableBackOrderIds));
        } else {
            setSelectedBackOrders(new Set());
        }
    };

    // Kiểm tra xem có tất cả các đơn "Có sẵn" được chọn không
    const availableBackOrders = filteredBackOrders.filter(bo => bo.statusDinamic === 'Available');
    const allAvailableSelected = availableBackOrders.length > 0 &&
        availableBackOrders.every(bo => selectedBackOrders.has(bo.backOrderId));

    // Xử lý tạo đơn từ các đơn đã chọn
    const handleCreateOrder = async () => {
        if (selectedBackOrders.size === 0) {
            window.showToast("Vui lòng chọn ít nhất một đơn hàng có sẵn", "error");
            return;
        }

        try {
            // Lấy thông tin các đơn đã chọn
            const selectedOrders = filteredBackOrders.filter(bo => selectedBackOrders.has(bo.backOrderId));

            // Kiểm tra xem tất cả các đơn đã chọn có cùng retailer không
            const retailerIds = [...new Set(selectedOrders.map(order => order.retailerId))];
            if (retailerIds.length > 1) {
                window.showToast("Vui lòng chọn các đơn hàng của cùng một nhà bán lẻ", "error");
                return;
            }

            // Lấy thông tin supplier từ goodsId cho mỗi đơn
            const itemsWithSupplier = await Promise.all(
                selectedOrders.map(async (order, index) => {
                    try {
                        // Lấy thông tin goods để có supplierId
                        const goodsDetail = await getGoodDetail(order.goodsId);
                        const goodsData = goodsDetail?.data || goodsDetail;
                        const supplierId = goodsData?.supplierId;

                        // Tìm supplierName từ suppliers list
                        const supplier = suppliers.find(s => s.supplierId === supplierId);
                        const supplierName = supplier?.companyName || "";

                        return {
                            id: Date.now() + index,
                            supplierName: supplierName,
                            goodsName: order.goodsName || "",
                            quantity: order.packageQuantity?.toString() || "",
                            goodsPackingId: order.goodsPackingId?.toString() || "",
                        };
                    } catch (error) {
                        console.error(`Error getting supplier for goodsId ${order.goodsId}:`, error);
                        return {
                            id: Date.now() + index,
                            supplierName: "",
                            goodsName: order.goodsName || "",
                            quantity: order.packageQuantity?.toString() || "",
                            goodsPackingId: order.goodsPackingId?.toString() || "",
                        };
                    }
                })
            );

            // Format dữ liệu để truyền vào CreateSaleOrder
            const initialData = {
                retailerId: retailerIds[0],
                retailerName: selectedOrders[0]?.retailerName || "",
                items: itemsWithSupplier
            };

            // Lưu vào localStorage để truyền sang CreateSaleOrder
            localStorage.setItem('saleOrderFromBackOrder', JSON.stringify(initialData));

            // Điều hướng sang màn hình tạo đơn
            navigate("/sales-orders/create");
        } catch (error) {
            console.error("Error preparing order data:", error);
            window.showToast("Có lỗi xảy ra khi chuẩn bị dữ liệu đơn hàng", "error");
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý đơn bổ sung</h1>
                        <p className="text-slate-600 mt-1">Quản lý các đơn bổ sung trong hệ thống</p>
                    </div>
                    {selectedBackOrders.size > 0 && (
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                            onClick={handleCreateOrder}
                        >
                            <Plus className="mr-2 h-4 w-4 text-white" />
                            Tạo đơn ({selectedBackOrders.size})
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <StatsCards
                    totalCount={totalStats.totalCount}
                    activeCount={totalStats.activeCount}
                    inactiveCount={totalStats.inactiveCount}
                    totalLabel="Tổng đơn bổ sung"
                    activeLabel="Đang xử lý"
                    inactiveLabel="Đã hoàn thành"
                />

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 overflow-hidden bg-gray-50">
                    <SearchFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo tên nhà bán lẻ hoặc sản phẩm..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: "1", label: "Đang xử lý" },
                            { value: "2", label: "Đã hoàn thành" }
                        ]}
                        onStatusFilter={handleStatusFilter}
                        clearStatusFilter={clearStatusFilter}
                        retailerFilter={retailerFilter}
                        setRetailerFilter={setRetailerFilter}
                        showRetailerFilter={showRetailerFilter}
                        setShowRetailerFilter={setShowRetailerFilter}
                        retailers={retailers}
                        onRetailerFilter={handleRetailerFilter}
                        clearRetailerFilter={clearRetailerFilter}
                        onClearAll={handleClearAllFilters}
                        searchWidth="w-80"
                        showToggle={true}
                        defaultOpen={true}
                        showClearButton={true}
                        enableRetailerSearch={true}
                        enableStatusSearch={true}
                        retailerSearchQuery={retailerSearchQuery}
                        setRetailerSearchQuery={setRetailerSearchQuery}
                        statusSearchQuery={statusSearchQuery}
                        setStatusSearchQuery={setStatusSearchQuery}
                        filteredRetailers={filteredRetailers}
                        filteredStatusOptions={filteredStatusOptions}
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
                                                <Checkbox
                                                    checked={allAvailableSelected}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    disabled={availableBackOrders.length === 0}
                                                />
                                            </TableHead>
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
                                                Tên sản phẩm
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Quy cách đóng gói
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Số thùng
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Tổng đơn vị
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left">
                                                Đơn vị
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-[150px]">
                                                Người tạo
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-left w-[140px]">
                                                Trạng thái kho
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-900 px-6 py-3 text-center w-32">
                                                Hoạt động
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBackOrders.length > 0 ? (
                                            filteredBackOrders.map((backOrder, index) => (
                                                <TableRow
                                                    key={index}
                                                    className="hover:bg-slate-50 border-b border-slate-200"
                                                >
                                                    <TableCell className="px-6 py-4">
                                                        {backOrder.statusDinamic === 'Available' ? (
                                                            <Checkbox
                                                                checked={selectedBackOrders.has(backOrder.backOrderId)}
                                                                onChange={(e) => handleCheckboxChange(backOrder.backOrderId, e.target.checked)}
                                                            />
                                                        ) : (
                                                            <div className="w-4"></div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-600 font-medium">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700 font-medium">{backOrder?.retailerName || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{backOrder?.goodsName || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{backOrder?.unitPerPackage ?? ''}{backOrder?.unitMeasureName ? ' ' + backOrder.unitMeasureName : ''}/thùng</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{backOrder?.packageQuantity ?? ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{(() => {
                                                        const up = parseInt(backOrder?.unitPerPackage ?? 0);
                                                        const pq = parseInt(backOrder?.packageQuantity ?? 0);
                                                        if (isNaN(up) || isNaN(pq)) return '';
                                                        return up * pq;
                                                    })()}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{backOrder?.unitMeasureName || ''}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-700">{backOrder?.createdByName || backOrder?.createdBy || ''}</TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${backOrder?.statusDinamic === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {getStatusDynamicLabel(backOrder?.statusDinamic)}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <PermissionWrapper requiredPermission={PERMISSIONS.BACKORDER_VIEW}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xem chi tiết"
                                                                    onClick={() => handleViewClick(backOrder)}
                                                                >
                                                                    <Eye className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>

                                                            <PermissionWrapper requiredPermission={PERMISSIONS.BACKORDER_UPDATE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Chỉnh sửa"
                                                                    onClick={() => handleUpdateClick(backOrder)}
                                                                >
                                                                    <Edit className="h-4 w-4 text-orange-500" />
                                                                </button>
                                                            </PermissionWrapper>

                                                            <PermissionWrapper requiredPermission={PERMISSIONS.BACKORDER_DELETE}>
                                                                <button
                                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Xóa"
                                                                    onClick={() => handleDeleteClick(backOrder)}
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
                                                title="Không tìm thấy đơn đặt hàng nào"
                                                description={
                                                    searchQuery || statusFilter || retailerFilter
                                                        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                                                        : "Chưa có đơn đặt hàng nào trong hệ thống"
                                                }
                                                actionText="Xóa bộ lọc"
                                                onAction={clearAllFilters}
                                                showAction={!!(searchQuery || statusFilter || retailerFilter)}
                                                colSpan={10}
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
                                    Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} đơn đặt hàng
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
                                                        retailerId: retailerFilter
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
                                                        retailerId: retailerFilter
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

            {/* Update BackOrder Modal */}
            <UpdateBackOrder
                isOpen={showUpdateModal}
                onClose={handleUpdateCancel}
                onSuccess={handleUpdateSuccess}
                backOrderId={updateBackOrderId}
            />

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                itemName={"đơn bổ sung này"}
            />

            {/* View BackOrder Detail Modal */}
            {showViewModal && itemToView && (
                <BackOrderDetail
                    backOrder={itemToView}
                    onClose={handleViewClose}
                />
            )}
        </div>
    )
}

