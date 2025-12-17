import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { getPallets, deletePallet } from "../../services/PalletService";

import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Edit, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Eye, Package, Printer } from "lucide-react";
import Loading from "../../components/Common/Loading";
import SearchFilterToggle from "../../components/Common/SearchFilterToggle";
import { extractErrorMessage } from "../../utils/Validation";
import EmptyState from "../../components/Common/EmptyState";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../utils/permissions";
import StatsCards from "../../components/Common/StatsCards";
import { PalletDetail } from "./ViewPalletModal";
import DeleteModal from "../../components/Common/DeleteModal";
import UpdatePalletModal from "./UpdatePalletModal";
import { useReactToPrint } from "react-to-print";
import { usePermissions } from "../../hooks/usePermissions";
import { PrintablePalletLabel, PrintableMultiplePalletLabels } from "../../components/PalletComponents/PrintPalletLabel";

const Pallet = {
    palletId: "",
    goodsReceiptNoteId: "",
    goodsPackingId: 0,
    packageQuantity: 0,
    unitPerPackage: 0,
    createBy: 0,
    createByName: "",
    batchId: "",
    batchCode: "",
    goodId: 0,
    locationId: 0,
    locationCode: "",
    status: null
};

export default function PalletList() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [showStatusFilter, setShowStatusFilter] = useState(false)

    const [sortField, setSortField] = useState("")
    const [sortAscending, setSortAscending] = useState(true)
    const [isInitialMount, setIsInitialMount] = useState(true)
    const [pallets, setPallets] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)
    const [updatePalletId, setUpdatePalletId] = useState(null)
    const [itemToView, setItemToView] = useState(null)
    const [viewPalletId, setViewPalletId] = useState(null)
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0
    })
    const [showPageSizeFilter, setShowPageSizeFilter] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [hasUserInteracted, setHasUserInteracted] = useState(false)
    const [statusSearchQuery, setStatusSearchQuery] = useState("")

    const [totalStats, setTotalStats] = useState({
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0
    })
    const [selectedPallets, setSelectedPallets] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const printRef = useRef(null);

    const { hasAnyPermission } = usePermissions();

    // Kiểm tra quyền in
    const hasPrintPermission = hasAnyPermission([PERMISSIONS.PALLET_PRINT_BARCODE]);

    // Normalize function: lowercase, trim, and collapse multiple spaces into one
    const normalize = (str) => {
        if (!str) return "";
        return str
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " "); // gom nhiều space thành 1 space
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Phiếu dán mã pallet",
        pageStyle: `
            @page { 
                size: A4; 
                margin: 10mm; 
            } 
            body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                margin: 0;
                padding: 0;
            }
            .print-container {
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
            }
        `,
    });

    const calculateStats = (dataArray) => {
        const totalCount = dataArray.length
        const activeCount = dataArray.filter((p) => p.status === 1).length
        const inactiveCount = dataArray.filter((p) => p.status === 2).length
        setTotalStats({
            totalCount: totalCount,
            activeCount: activeCount,
            inactiveCount: inactiveCount
        })
    }

    // Fetch dữ liệu thống kê tổng (không filter)
    const fetchStatsData = async () => {
        try {
            const response = await getPallets({
                pageNumber: 1,
                pageSize: 1000, // Lấy tất cả để tính stats
                search: "",
                sortField: "",
                sortAscending: true,
                status: ""
            })

            if (response && response.data) {
                const dataArray = Array.isArray(response.data.items) ? response.data.items : []
                calculateStats(dataArray)
            }
        } catch (error) {
            console.error("Error fetching stats data:", error)
        }
    }
    const fetchData = async (searchParams = {}) => {
        try {
            setLoading(true)
            // Normalize search query trước khi gọi API
            const normalizedSearch = searchParams.search !== undefined ? normalize(searchParams.search) : "";
            const response = await getPallets({
                pageNumber: searchParams.pageNumber !== undefined ? searchParams.pageNumber : 1,
                pageSize: searchParams.pageSize !== undefined ? searchParams.pageSize : 10,
                search: normalizedSearch,
                sortField: searchParams.sortField || "",
                sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
                status: searchParams.status
            })

            if (response && response.data) {
                const dataArray = Array.isArray(response.data.items) ? response.data.items : []
                setPallets(dataArray)
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.totalCount || dataArray.length
                }))
                // Không tính stats từ dữ liệu đã filter
            } else {
                setPallets([])
                setPagination(prev => ({ ...prev, totalCount: 0 }))
            }
        } catch (error) {
            setPallets([])
            setPagination(prev => ({ ...prev, totalCount: 0 }))
        } finally {
            setLoading(false)
            setSearchLoading(false)
        }
    }
    useEffect(() => {
        const initializeData = async () => {
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

            // Load danh sách người tạo


            // Fetch dữ liệu thống kê tổng (không filter)
            await fetchStatsData();

            // Fetch dữ liệu hiển thị (có filter)
            await fetchData({
                pageNumber: 1,
                pageSize: 10,
                search: "",
                sortField: "",
                sortAscending: true,
                status: ""
            })

            // Mark as initialized after all data is loaded
            setIsInitialized(true)
        }

        initializeData()
    }, [])
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

    useEffect(() => {
        if (!isInitialized) {
            return
        }

        // Skip if this is the first time after initialization and no user interaction yet
        if (!hasUserInteracted) {
            return
        }

        const timeoutId = setTimeout(() => {
            setSearchLoading(true)
            // Normalize search query trước khi gọi API
            const normalizedSearch = normalize(searchQuery);
            const params = {
                pageNumber: 1,
                pageSize: pagination.pageSize,
                search: normalizedSearch,
                sortField: sortField,
                sortAscending: sortAscending,
                status: statusFilter,
                status: statusFilter
            }
            fetchData(params)
            setPagination(prev => ({ ...prev, pageNumber: 1 }))
        }, searchQuery ? 500 : 0)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [searchQuery, statusFilter, sortField, sortAscending, isInitialized, hasUserInteracted])

    // Track search query changes to detect user interaction
    useEffect(() => {
        if (isInitialized && searchQuery !== "") {
            setHasUserInteracted(true)
        }
    }, [searchQuery, isInitialized])

    const filteredPallets = useMemo(() => {
        return Array.isArray(pallets) ? pallets : []
    }, [pallets])

    // Cập nhật selectAll khi selectedPallets thay đổi
    useEffect(() => {
        if (selectedPallets.length === 0) {
            setSelectAll(false);
        } else if (selectedPallets.length === filteredPallets.length && filteredPallets.length > 0) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedPallets, filteredPallets]);

    // Xử lý chọn/bỏ chọn tất cả
    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        if (checked) {
            setSelectedPallets([...filteredPallets]);
        } else {
            setSelectedPallets([]);
        }
    };

    // Xử lý chọn/bỏ chọn một pallet
    const handleSelectPallet = (pallet, checked) => {
        if (checked) {
            setSelectedPallets(prev => [...prev, pallet]);
        } else {
            setSelectedPallets(prev => prev.filter(p => p.palletId !== pallet.palletId));
        }
    };

    // Kiểm tra xem một pallet có được chọn không
    const isPalletSelected = (pallet) => {
        return selectedPallets.some(p => p.palletId === pallet.palletId);
    };

    // In nhiều pallet đã chọn
    const handlePrintSelected = () => {
        if (selectedPallets.length === 0) {
            window.showToast("Vui lòng chọn ít nhất một pallet để in", "warning");
            return;
        }
        // Hiển thị modal preview trước khi in
        setShowPrintPreview(true);
    };

    // Xác nhận in từ modal preview
    const handleConfirmPrint = () => {
        setShowPrintPreview(false);
        setTimeout(() => handlePrint(), 100);
    };


    const handleViewClick = (pallet) => {
        setItemToView(pallet)
        setShowViewModal(true)
    }
    const handleUpdateClick = (pallet) => {
        setUpdatePalletId(pallet.palletId)
        setShowUpdateModal(true)
    }

    const handleUpdateSuccess = () => {
        setShowUpdateModal(false)
        setUpdatePalletId(null)
        // Refresh the pallet list and stats
        fetchStatsData()
        fetchData()
    }
    const handleDeleteClick = (pallet) => {
        setItemToDelete(pallet)
        setShowDeleteModal(true)
    }
    const handleViewClose = () => {
        setShowViewModal(false)
        setItemToView(null)
        setViewPalletId(null)
    }
    const handleViewPallet = (palletId) => {
        setViewPalletId(palletId)
        setShowViewModal(true)
    }
    const handleUpdateCancel = () => {
        setShowUpdateModal(false)
        setUpdatePalletId(null)
    }
    const handleDeleteConfirm = async () => {
        try {
            await deletePallet(itemToDelete?.palletId)

            window.showToast(`Đã xóa pallet: ${itemToDelete?.batchCode || ''}`, "success")
            setShowDeleteModal(false)
            setItemToDelete(null)

            const currentPageItemCount = pallets.length
            const willPageBeEmpty = currentPageItemCount <= 1
            let targetPage = pagination.pageNumber
            if (willPageBeEmpty && pagination.pageNumber > 1) {
                targetPage = pagination.pageNumber - 1
                setPagination(prev => ({ ...prev, pageNumber: targetPage }))
            }

            // Refresh data after deletion, keeping current page or going to previous page if needed
            await fetchStatsData()
            const normalizedSearch = normalize(searchQuery);
            await fetchData({
                pageNumber: targetPage,
                pageSize: pagination.pageSize,
                search: normalizedSearch,
                sortField: sortField,
                sortAscending: sortAscending,
                status: statusFilter
            })
        } catch (error) {
            console.error("Error deleting pallet:", error)
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi xóa pallet")
            window.showToast(errorMessage, "error")
        }
    }

    const handleDeleteCancel = () => {
        setShowDeleteModal(false)
        setItemToDelete(null)
    }

    // Filter status and creator options based on search queries
    const filteredStatusOptions = useMemo(() => {
        const statusOptions = [
            { value: "", label: "Tất cả trạng thái" },
            { value: "1", label: "Đã đưa vào vị trí" },
            { value: "2", label: "Chưa đưa vào vị trí" }
        ]
        if (!statusSearchQuery) return statusOptions
        const normalizedQuery = normalize(statusSearchQuery)
        return statusOptions.filter(option =>
            normalize(option.label).includes(normalizedQuery)
        )
    }, [statusSearchQuery])



    const handleStatusFilter = (status) => {
        setHasUserInteracted(true)
        setStatusFilter(status)
        setShowStatusFilter(false)
        setStatusSearchQuery("")
    }
    const clearStatusFilter = () => {
        setHasUserInteracted(true)
        setStatusFilter("")
        setShowStatusFilter(false)
        setStatusSearchQuery("")
    }

    const handleClearAllFilters = () => {
        setHasUserInteracted(true)
        setSearchQuery("")
        setStatusFilter("")
        setStatusSearchQuery("")
        setShowStatusFilter(false)
    }
    const clearAllFilters = handleClearAllFilters
    const handlePageSizeChange = (newPageSize) => {
        setHasUserInteracted(true)
        setPagination(prev => ({ ...prev, pageSize: newPageSize, pageNumber: 1 }))
        setShowPageSizeFilter(false)
        const normalizedSearch = normalize(searchQuery);
        fetchData({
            pageNumber: 1,
            pageSize: newPageSize,
            search: normalizedSearch,
            sortField: sortField,
            sortAscending: sortAscending,
            status: statusFilter
        })
    }
    const handleSort = (field) => {
        setHasUserInteracted(true)
        if (sortField === field) {
            setSortAscending(!sortAscending)
        } else {
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
                        <h1 className="text-2xl font-bold text-slate-600">Quản lý Pallet</h1>
                        <p className="text-slate-600 mt-1">Quản lý các pallet trong hệ thống</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasPrintPermission && selectedPallets.length > 0 && (
                            <>
                                <Button
                                    className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white transition-colors duration-200"
                                    onClick={handlePrintSelected}
                                >
                                    <Printer className="mr-2 h-4 w-4 text-white" />
                                    In đã chọn ({selectedPallets.length})
                                </Button>
                                <Button
                                    className="bg-slate-800 hover:bg-slate-900 h-[38px] px-6 text-white transition-colors duration-200"
                                    onClick={() => {
                                        setSelectedPallets([]);
                                        setSelectAll(false);
                                    }}
                                >
                                    Bỏ chọn tất cả
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <StatsCards
                    totalCount={totalStats.totalCount}
                    activeCount={totalStats.activeCount}
                    inactiveCount={totalStats.inactiveCount}
                    totalLabel="Tổng pallet"
                    activeLabel="Đã đưa vào vị trí"
                    inactiveLabel="Chưa đưa vào vị trí"
                />

                {/* Search and Table Combined */}
                <Card className="shadow-sm border border-slate-200 bg-gray-50">
                    <SearchFilterToggle
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Tìm kiếm theo mã batch, mã vị trí, mã hàng hóa hoặc tên hàng hóa..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        showStatusFilter={showStatusFilter}
                        setShowStatusFilter={setShowStatusFilter}
                        statusOptions={[
                            { value: "", label: "Tất cả trạng thái" },
                            { value: "1", label: "Đã đưa vào vị trí" },
                            { value: "2", label: "Chưa đưa vào vị trí" }
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
                    {loading ? (
                        <div className="w-full">
                            <Loading size="large" text="Đang tải dữ liệu..." />
                        </div>
                    ) : searchLoading ? (
                        <div className="w-full">
                            <Loading size="medium" text="Đang tìm kiếm..." />
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-slate-200">
                                        {hasPrintPermission && (
                                            <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center w-8">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAll}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                            </TableHead>
                                        )}
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                                            STT
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-left min-w-[150px]">
                                            Mã Pallet
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-left min-w-[100px]">
                                            Mã hàng hóa
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-left min-w-[120px]">
                                            <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("goodName")}>
                                                <span>Tên hàng hóa</span>
                                                {sortField === "goodName" ? (
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
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-left min-w-[120px]">
                                            <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("batchCode")}>
                                                <span>Mã lô</span>
                                                {sortField === "batchCode" ? (
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
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-left">
                                            Mã vị trí
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center min-w-[100px]">
                                            <div className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-1 -mx-1 -my-1" onClick={() => handleSort("packageQuantity")}>
                                                <span>Số lượng thùng</span>
                                                {sortField === "packageQuantity" ? (
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
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                                            Đơn vị /thùng
                                        </TableHead>

                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                                            Trạng thái
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-900 px-2 py-3 text-center">
                                            Hoạt động
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPallets.length > 0 ? (
                                        filteredPallets.map((pallet, index) => (
                                            <TableRow
                                                key={index}
                                                className="hover:bg-slate-50 border-b border-slate-200"
                                            >
                                                {hasPrintPermission && (
                                                    <TableCell className="px-2 py-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isPalletSelected(pallet)}
                                                            onChange={(e) => handleSelectPallet(pallet, e.target.checked)}
                                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell className="px-2 py-4 text-center text-slate-700">
                                                    {(pagination.pageNumber - 1) * pagination.pageSize + index + 1}
                                                </TableCell>
                                                <TableCell className="px-2 py-4 text-slate-700 font-medium">
                                                    <div className="break-words whitespace-normal">
                                                        {pallet?.palletId || ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-slate-700 font-medium">
                                                    <div className="break-words whitespace-normal">
                                                        {pallet?.goodCode || ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-slate-700">
                                                    <div className="break-words whitespace-normal">
                                                        {pallet?.goodName || ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-slate-700 font-medium">
                                                    <div className="break-words whitespace-normal">
                                                        {pallet?.batchCode || ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-slate-700">
                                                    <div className="break-words whitespace-normal">
                                                        {pallet?.locationCode || ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center text-slate-700">
                                                    {pallet?.packageQuantity || 0}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center text-slate-700">
                                                    {pallet?.unitPerPackage || 0}
                                                </TableCell>

                                                <TableCell className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 break-words whitespace-normal ${pallet?.status === 1
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pallet?.status === 1 ? 'bg-green-500' : 'bg-red-500'
                                                                }`}></span>
                                                            <span>{pallet?.status === 1 ? 'Đã đưa vào vị trí' : 'Chưa đưa vào vị trí'}</span>
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <PermissionWrapper requiredPermission={PERMISSIONS.PALLET_VIEW}>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Xem chi tiết"
                                                                onClick={() => handleViewPallet(pallet.palletId)}
                                                            >
                                                                <Eye className="h-4 w-4 text-orange-500" />
                                                            </button>
                                                        </PermissionWrapper>

                                                        <PermissionWrapper requiredPermission={PERMISSIONS.PALLET_UPDATE}>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Chỉnh sửa"
                                                                onClick={() => handleUpdateClick(pallet)}
                                                            >
                                                                <Edit className="h-4 w-4 text-orange-500" />
                                                            </button>
                                                        </PermissionWrapper>

                                                        <PermissionWrapper requiredPermission={PERMISSIONS.PALLET_DELETE}>
                                                            <button
                                                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                                title="Xóa"
                                                                onClick={() => handleDeleteClick(pallet)}
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
                                            title="Không tìm thấy pallet nào"
                                            description={
                                                searchQuery || statusFilter
                                                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                                                    : "Chưa có pallet nào trong hệ thống"
                                            }
                                            actionText="Xóa bộ lọc"
                                            onAction={clearAllFilters}
                                            showAction={!!(searchQuery || statusFilter)}
                                            colSpan={hasPrintPermission ? 11 : 10}
                                        />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>

                {/* Pagination */}
                {!loading && !searchLoading && pagination.totalCount > 0 && (
                    <Card className="bg-gray-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-600">
                                    Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} pallet
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-[38px]"
                                            onClick={() => {
                                                if (pagination.pageNumber > 1) {
                                                    const normalizedSearch = normalize(searchQuery);
                                                    fetchData({
                                                        pageNumber: pagination.pageNumber - 1,
                                                        pageSize: pagination.pageSize,
                                                        search: normalizedSearch,
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
                                                    const normalizedSearch = normalize(searchQuery);
                                                    fetchData({
                                                        pageNumber: pagination.pageNumber + 1,
                                                        pageSize: pagination.pageSize,
                                                        search: normalizedSearch,
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

            {/* View Pallet Detail Modal */}
            {showViewModal && (
                <PalletDetail
                    palletId={viewPalletId}
                    onClose={handleViewClose}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    itemName={"pallet"}
                />
            )}

            {/* Update Pallet Modal */}
            {showUpdateModal && (
                <UpdatePalletModal
                    isOpen={showUpdateModal}
                    onClose={() => {
                        setShowUpdateModal(false)
                        setUpdatePalletId(null)
                    }}
                    pallet={pallets.find(p => p.palletId === updatePalletId)}
                    goodsId={pallets.find(p => p.palletId === updatePalletId)?.goodId}
                    onSuccess={handleUpdateSuccess}
                />
            )}

            {/* Modal Preview In */}
            {showPrintPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Xem trước barcode ({selectedPallets.length} pallet)
                            </h3>
                            <button
                                onClick={() => setShowPrintPreview(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <PrintableMultiplePalletLabels pallets={selectedPallets} />
                        </div>
                        <div className="flex items-center justify-end gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowPrintPreview(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmPrint}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                In ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vùng in phiếu - căn giữa khi in */}
            <div className="print-wrapper">
                <div ref={printRef} className="print-container">
                    {selectedPallets.length > 1 ? (
                        <PrintableMultiplePalletLabels pallets={selectedPallets} />
                    ) : selectedPallets.length === 1 ? (
                        <PrintablePalletLabel pallet={selectedPallets[0]} />
                    ) : null}
                </div>
            </div>
        </div>
    )
}