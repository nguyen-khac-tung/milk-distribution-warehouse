import React, { useEffect, useState, useRef } from "react";
import { Button } from "antd";
import { getAreas, deleteArea, getAreaDetail } from "../../../services/AreaServices";
import { Edit, Trash2, ChevronDown, Plus, Eye } from "lucide-react";
import DeleteModal from "../../../components/Common/DeleteModal";
import SearchBar from "../../../components/Common/SearchBar";
import FilterDropdown from "../../../components/Common/FilterDropdown";
import Pagination from "../../../components/Common/Pagination";
import Loading from "../../../components/Common/Loading";
import CreateAreaModal from "./CreateAreaModal";
import UpdateAreaModal from "./UpdateAreaModal";
import { Card, CardContent } from "../../../components/ui/card";
import { Table as CustomTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { extractErrorMessage } from "../../../utils/Validation";
import { ModalAreaDetail } from "./ViewAreaModal";

const AreaLists = () => {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // Stats states - không bị ảnh hưởng bởi filter
    const [totalStats, setTotalStats] = useState({
        total: 0,
        active: 0,
        inactive: 0
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [updateAreaId, setUpdateAreaId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const searchQueryRef = useRef("");
    const [areaDetail, setAreaDetail] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false)

    // Fetch total stats (không filter)
    const fetchTotalStats = async () => {
        try {
            const res = await getAreas({
                pageNumber: 1,
                pageSize: 1000, // Lấy tất cả để tính stats
                search: "",
                filters: {},
            });

            const payload = res ?? {};
            const allItems = Array.isArray(payload.items)
                ? payload.items
                : Array.isArray(payload.data?.items)
                    ? payload.data.items
                    : Array.isArray(payload.data)
                        ? payload.data
                        : [];

            const total = allItems.length;
            const active = allItems.filter((a) => a.status === 1).length;
            const inactive = allItems.filter((a) => a.status === 2).length;

            setTotalStats({ total, active, inactive });
        } catch (err) {
            console.log("Không thể tải thống kê tổng!", err);
        }
    };

    // Fetch list areas
    const fetchAreas = async (page = 1, pageSize = 10, params = {}) => {
        try {
            setLoading(true);
            const res = await getAreas({
                pageNumber: page,
                pageSize,
                search: params.search,
                filters: params.filters,
            });

            const payload = res ?? {};
            const items = Array.isArray(payload.items)
                ? payload.items
                : Array.isArray(payload.data?.items)
                    ? payload.data.items
                    : Array.isArray(payload.data)
                        ? payload.data
                        : [];
            const total = (payload.totalCount ?? payload.data?.totalCount) || 0;

            setAreas(items);
            setPagination({ current: page, pageSize, total });
        } catch (err) {
            console.log("Không thể tải danh sách khu vực!", err);
            window.showToast("Không thể tải danh sách khu vực!", "error");
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas(pagination.current, pagination.pageSize);
        fetchTotalStats(); // Load tổng stats
    }, []);

    // Search input change handler
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        searchQueryRef.current = value;
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchLoading(true);
            fetchAreas(1, pagination.pageSize, {
                search: searchQuery || "",
                filters: {
                    status: statusFilter ? Number(statusFilter) : undefined
                }
            });
            setPagination((p) => ({ ...p, current: 1 }));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, statusFilter]);

    // Filter handlers
    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setSearchLoading(true);
        fetchAreas(1, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: status ? Number(status) : undefined
            }
        });
        setPagination((p) => ({ ...p, current: 1 }));
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        setSearchLoading(true);
        fetchAreas(1, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: undefined
            }
        });
        setPagination((p) => ({ ...p, current: 1 }));
    };

    // Page handlers
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current: newPage }));
        fetchAreas(newPage, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            }
        });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
        fetchAreas(1, newPageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            }
        });
    };

    // Sort handler
    const handleSort = (field) => {
        if (sortField === field) {
            setSortAscending(!sortAscending);
        } else {
            setSortField(field);
            setSortAscending(true);
        }
    };

    // Mở modal thêm mới
    const handleOpenCreate = () => {
        setShowCreateModal(true);
    };

    // Mở modal sửa
    const handleOpenEdit = (record) => {
        setEditingArea(record);
        setUpdateAreaId(record.areaId);
        setShowUpdateModal(true);
    };

    // Handle create success
    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchAreas(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            }
        });
        fetchTotalStats(); // Cập nhật tổng stats
    };

    // Handle update success
    const handleUpdateSuccess = () => {
        setShowUpdateModal(false);
        setEditingArea(null);
        setUpdateAreaId(null);
        fetchAreas(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                status: statusFilter ? Number(statusFilter) : undefined
            }
        });
        fetchTotalStats(); // Cập nhật tổng stats
    };

    // Handle update cancel
    const handleUpdateCancel = () => {
        setShowUpdateModal(false);
        setEditingArea(null);
        setUpdateAreaId(null);
    };

    const handleViewClose = () => {
        setShowViewModal(false)
        setItemToView(null)
        setAreaDetail(null)
    }

    // Xem chi tiết khu vực
    const handleViewClick = async (area) => {
        try {
            console.log("Viewing area:", area)
            setItemToView(area)
            setLoadingDetail(true)
            setShowViewModal(true)

            // Gọi API để lấy chi tiết điều kiện bảo quản
            const response = await getAreaDetail(area.areaId)
            console.log("API Response Area:", response)

            // Handle API response structure
            if (response && response.data) {
                // Merge dữ liệu từ area list với chi tiết từ API
                const areaDetailData = {
                    ...area, // Dữ liệu cơ bản từ danh sách
                    ...response.data // Chi tiết điều kiện bảo quản từ API
                }
                setAreaDetail(areaDetailData)
                console.log("Area detail set:", areaDetailData)
            } else {
                // Fallback: sử dụng dữ liệu từ danh sách nếu API không trả về data
                setAreaDetail(area)
                console.log("Using fallback area data:", area)
            }
        } catch (error) {
            console.error("Error loading area detail:", error)
            // Fallback: sử dụng dữ liệu từ danh sách nếu API lỗi
            setAreaDetail(area)
            console.log("Using fallback area data due to error:", area)
        } finally {
            setLoadingDetail(false)
        }
    }

    // Xóa khu vực
    const handleDeleteConfirm = async () => {
        try {
            await deleteArea(itemToDelete?.areaId);
            window.showToast(
                `Đã xóa khu vực: ${itemToDelete?.areaCode || ""}`,
                "success"
            );

            setShowDeleteModal(false);
            setItemToDelete(null);

            fetchAreas(pagination.current, pagination.pageSize, {
                search: searchQuery,
                filters: {
                    status: statusFilter ? Number(statusFilter) : undefined,
                },
            });
            fetchTotalStats(); // Cập nhật tổng stats
        } catch (error) {
            console.error("Error deleting area:", error);

            // Lấy thông báo lỗi rõ ràng từ backend (nếu có)
            const cleanMsg =
                error?.response?.data?.message?.replace(/^\[.*?\]\s*/, "") ||
                error?.message ||
                "Có lỗi xảy ra khi xóa khu vực!";

            // Hiển thị lỗi chi tiết
            window.showToast(cleanMsg, "error");
        }
    };

    // Stats được lấy từ totalStats state (không bị ảnh hưởng bởi filter)
    const { total: totalCount, active: activeCount, inactive: inactiveCount } = totalStats;

    return (
        <div style={{ minHeight: "100vh", background: "#ffffff", padding: "24px" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#0f172a", margin: 0 }}>Quản lý Khu vực</h1>
                        <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Quản lý các khu vực lưu trữ trong hệ thống</p>
                    </div>
                    <Button
                        style={{
                            backgroundColor: "#237486",
                            borderColor: "#237486",
                            height: "44px",
                            padding: "0 24px",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                        onClick={handleOpenCreate}
                    >
                        <Plus style={{ marginRight: "8px", height: "16px", width: "16px" }} />
                        Thêm khu vực
                    </Button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <Card style={{ borderLeft: "4px solid #237486" }}>
                        <CardContent style={{ paddingTop: "24px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Tổng khu vực</div>
                            <div style={{ fontSize: "30px", fontWeight: "bold", color: "#0f172a", marginTop: "8px" }}>{totalCount}</div>
                        </CardContent>
                    </Card>
                    <Card style={{ borderLeft: "4px solid #237486" }}>
                        <CardContent style={{ paddingTop: "24px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Hoạt động</div>
                            <div style={{ fontSize: "30px", fontWeight: "bold", color: "#237486", marginTop: "8px" }}>{activeCount}</div>
                        </CardContent>
                    </Card>
                    <Card style={{ borderLeft: "4px solid #237486" }}>
                        <CardContent style={{ paddingTop: "24px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Ngừng hoạt động</div>
                            <div style={{ fontSize: "30px", fontWeight: "bold", color: "#64748b", marginTop: "8px" }}>{inactiveCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <SearchBar
                    placeholder="Tìm kiếm theo mã khu vực..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                />

                {/* Areas Table */}
                <Card style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", overflow: "hidden", padding: 0 }}>
                    <div style={{ width: "100%" }}>
                        {loading ? (
                            <Loading size="large" text="Đang tải dữ liệu..." />
                        ) : searchLoading ? (
                            <Loading size="medium" text="Đang tìm kiếm..." />
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <CustomTable style={{ width: "100%" }}>
                                    <TableHeader>
                                        <TableRow style={{ backgroundColor: "#237486", margin: 0, width: "100%" }}>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0, width: "80px" }}>
                                                STT
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0, width: "160px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "4px", margin: "-4px", borderRadius: "4px" }} onClick={() => handleSort("areaCode")}>
                                                    <span>Mã khu vực</span>
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <ChevronDown
                                                            style={{
                                                                height: "12px",
                                                                width: "12px",
                                                                color: sortField === "areaCode" && sortAscending ? "white" : "rgba(255,255,255,0.5)",
                                                                transform: "translateY(1px)"
                                                            }}
                                                        />
                                                        <ChevronDown
                                                            style={{
                                                                height: "12px",
                                                                width: "12px",
                                                                color: sortField === "areaCode" && !sortAscending ? "white" : "rgba(255,255,255,0.5)",
                                                                transform: "translateY(-1px) rotate(180deg)"
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0 }}>
                                                Tên khu vực
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0 }}>
                                                Mô tả
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0, width: "160px" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    <span>Trạng thái</span>
                                                    <FilterDropdown
                                                        type="status"
                                                        value={statusFilter}
                                                        onFilterChange={handleStatusFilter}
                                                        onClearFilter={clearStatusFilter}
                                                        options={[
                                                            { value: "1", label: "Hoạt động" },
                                                            { value: "2", label: "Ngừng hoạt động" }
                                                        ]}
                                                        placeholder="Tất cả"
                                                        className="status-filter-dropdown"
                                                        title="Lọc theo trạng thái"
                                                    />
                                                </div>
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0, textAlign: "center" }}>
                                                Hoạt động
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {areas.length > 0 ? (
                                            areas.map((area, index) => (
                                                <TableRow
                                                    key={area.areaId}
                                                    style={{
                                                        backgroundColor: "white",
                                                        margin: 0,
                                                        width: "100%"
                                                    }}
                                                >
                                                    <TableCell style={{ color: "#64748b", padding: "12px 16px", border: 0, width: "80px", textAlign: "center", fontWeight: "500" }}>
                                                        {(pagination.current - 1) * pagination.pageSize + index + 1}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: "500", color: "#0f172a", padding: "12px 16px", border: 0, width: "160px" }}>
                                                        {area?.areaCode || ''}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0 }}>
                                                        {area?.areaName || "—"}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0 }}>
                                                        {area?.description?.length > 30 ? area.description.slice(0, 30) + "..." : area?.description || "—"}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0, textAlign: "center" }}>
                                                        <span style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "9999px",
                                                            fontSize: "12px",
                                                            fontWeight: "500",
                                                            backgroundColor:
                                                                area?.status === 1
                                                                    ? "#dcfce7"
                                                                    : area?.status === 2
                                                                        ? "#fee2e2"
                                                                        : "#fee2e2",

                                                            color:
                                                                area?.status === 1
                                                                    ? "#166534"
                                                                    : area?.status === 2
                                                                        ? "#b91c1c"
                                                                        : "#b91c1c",

                                                        }}>
                                                            {area?.status === 1 ? 'Hoạt động' : area?.status === 2 ? 'Ngừng hoạt động' : 'Đã xóa'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell style={{ color: "#64748b", padding: "12px 16px", border: 0, textAlign: "center" }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                            <button
                                                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                                                title="Xem chi tiết"
                                                                onClick={() => handleViewClick(area)}
                                                            >
                                                                <Eye className="h-4 w-4 text-[#1a7b7b]" />
                                                            </button>
                                                            <button
                                                                style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", borderRadius: "4px" }}
                                                                title="Chỉnh sửa"
                                                                onClick={() => handleOpenEdit(area)}
                                                            >
                                                                <Edit style={{ height: "16px", width: "16px", color: "#1a7b7b" }} />
                                                            </button>
                                                            <button
                                                                style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", borderRadius: "4px" }}
                                                                title="Xóa"
                                                                onClick={() => {
                                                                    setItemToDelete(area);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                            >
                                                                <Trash2 style={{ height: "16px", width: "16px", color: "#ef4444" }} />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
                                                    Không tìm thấy khu vực nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </CustomTable>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Pagination */}
                {!loading && !searchLoading && (
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        showPageSize={true}
                        pageSizeOptions={[10, 20, 30, 40]}
                    />
                )}
            </div>

            {/* Create Area Modal */}
            <CreateAreaModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Update Area Modal */}
            <UpdateAreaModal
                isOpen={showUpdateModal}
                onClose={handleUpdateCancel}
                onSuccess={handleUpdateSuccess}
                areaId={updateAreaId}
                areaData={editingArea}
            />

            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                itemName={itemToDelete?.areaCode || ""}
            />

            {/* View Area Detail Modal */}
            {showViewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {loadingDetail ? (
                            <Loading size="large" text="Đang tải chi tiết khu vực..." />
                        ) : areaDetail ? (
                            <ModalAreaDetail
                                area={areaDetail}
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
    );
};

export default AreaLists;