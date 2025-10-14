import React, { useEffect, useState, useCallback } from "react";
import { Button } from "antd";
import { getLocations, deleteLocation } from "../../../services/LocationServices";
import { getAreas } from "../../../services/AreaServices";
import { Edit, Trash2, ChevronDown, Plus } from "lucide-react";
import DeleteModal from "../../../components/Common/DeleteModal";
import SearchBar from "../../../components/Common/SearchBar";
import FilterDropdown from "../../../components/Common/FilterDropdown";
import Pagination from "../../../components/Common/Pagination";
import CreateLocationModal from "./CreateLocationModal";
import UpdateLocationModal from "./UpdateLocationModal";
import { Card, CardContent } from "../../../components/ui/card";
import { Table as CustomTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { extractErrorMessage } from "../../../utils/Validation";


const LocationList = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [globalStats, setGlobalStats] = useState({ total: 0, available: 0, unavailable: 0 });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [updateLocationId, setUpdateLocationId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [statusTypeFilter, setStatusTypeFilter] = useState("");
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);

    const fetchLocations = async (page = 1, pageSize = 10, params = {}) => {
        try {
            setLoading(true);
            console.log("Fetching with params:", {
                pageNumber: page,
                pageSize,
                search: params.search,
                isAvailable: params.filters?.isAvailable,
                status: params.filters?.status,
            });
            const res = await getLocations({
                pageNumber: page,
                pageSize,
                search: params.search,
                isAvailable: params.filters?.isAvailable,
                areaId: params.filters?.areaId,
                status: params.filters?.status,
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

            setLocations(items);
            setPagination({ current: page, pageSize, total });
        } catch (err) {
            console.log("Không thể tải danh sách vị trí!", err);
            window.showToast("Không thể tải danh sách vị trí!", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await getLocations({ pageNumber: 1, pageSize: 1 });
            const payload = res ?? {};
            const total = (payload.totalCount ?? payload.data?.totalCount) || 0;

            let available = 0;
            let unavailable = 0;

            // If total is reasonable (<=1000) fetch all and compute counts client-side.
            if (total <= 1000 && total > 0) {
                const allRes = await getLocations({ pageNumber: 1, pageSize: total });
                const items = Array.isArray(allRes.items)
                    ? allRes.items
                    : Array.isArray(allRes.data?.items)
                        ? allRes.data.items
                        : Array.isArray(allRes.data)
                            ? allRes.data
                            : [];
                available = items.filter((l) => l.isAvailable === true).length;
                unavailable = items.filter((l) => l.isAvailable === false).length;
            } else {
                // Fallback: request counts via filtered calls which return totalCount for each filter
                const availRes = await getLocations({ pageNumber: 1, pageSize: 1, isAvailable: true });
                const availTotal = (availRes.totalCount ?? availRes.data?.totalCount) || 0;
                const unavailRes = await getLocations({ pageNumber: 1, pageSize: 1, isAvailable: false });
                const unavailTotal = (unavailRes.totalCount ?? unavailRes.data?.totalCount) || 0;
                available = availTotal;
                unavailable = unavailTotal;
            }

            setGlobalStats({ total, available, unavailable });
        } catch (err) {
            console.error("Error fetching global stats:", err);
        }
    };

    useEffect(() => {
        fetchLocations(1, 10);
        // Also fetch global stats once on mount
        fetchStats();
    }, []);

    // Callback khi filter thay đổi
    const handleFilterChange = useCallback((params) => {
        setPagination((p) => ({ ...p, current: 1 }));
        fetchLocations(1, pagination.pageSize, params);
    }, [pagination.pageSize]);

    // Search input change handler
    const handleSearchInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleFilterChange({
                search: searchQuery,
                filters: {
                    isAvailable: statusFilter ? statusFilter === "true" : undefined,
                    status: statusTypeFilter ? Number(statusTypeFilter) : undefined
                }
            });
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, statusFilter, statusTypeFilter, handleFilterChange]);

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        handleFilterChange({
            search: searchQuery,
            filters: {
                isAvailable: status ? status === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
    };

    const clearStatusFilter = () => {
        setStatusFilter("");
        handleFilterChange({
            search: searchQuery,
            filters: {
                isAvailable: undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
    };

    const handleStatusTypeFilter = (status) => {
        setStatusTypeFilter(status);
        handleFilterChange({
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: status ? Number(status) : undefined
            }
        });
    };

    const clearStatusTypeFilter = () => {
        setStatusTypeFilter("");
        handleFilterChange({
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: undefined
            }
        });
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current: newPage }));
        fetchLocations(newPage, pagination.pageSize, {
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
        fetchLocations(1, newPageSize, {
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortAscending(!sortAscending);
        } else {
            setSortField(field);
            setSortAscending(true);
        }
    };

    // Open modal for create
    const handleOpenCreate = () => {
        setShowCreateModal(true);
    };

    // Open modal for update
    const handleOpenEdit = (record) => {
        console.log("Editing record:", record);
        setEditingLocation(record);
        setUpdateLocationId(record.locationId);
        setShowUpdateModal(true);
    };

    // Handle create success
    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchLocations(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
        fetchStats(); // Cập nhật tổng stats
    };

    // Handle update success
    const handleUpdateSuccess = () => {
        setShowUpdateModal(false);
        setEditingLocation(null);
        setUpdateLocationId(null);
        fetchLocations(pagination.current, pagination.pageSize, {
            search: searchQuery,
            filters: {
                isAvailable: statusFilter ? statusFilter === "true" : undefined,
                status: statusTypeFilter ? Number(statusTypeFilter) : undefined
            }
        });
        fetchStats(); // Cập nhật tổng stats
    };

    // Handle update cancel
    const handleUpdateCancel = () => {
        setShowUpdateModal(false);
        setEditingLocation(null);
        setUpdateLocationId(null);
    };

    //Delete location
    const handleDeleteConfirm = async () => {
        try {
            await deleteLocation(itemToDelete?.locationId);
            window.showToast(`Đã xóa vị trí: ${itemToDelete?.locationCode || ""}`, "success");
            setShowDeleteModal(false);
            setItemToDelete(null);
            fetchLocations(pagination.current, pagination.pageSize, {
                search: searchQuery,
                filters: {
                    isAvailable: statusFilter ? statusFilter === "true" : undefined,
                    status: statusTypeFilter ? Number(statusTypeFilter) : undefined
                }
            });
            // refresh global stats
            fetchStats();
        } catch (error) {
            window.showToast("Có lỗi xảy ra khi xóa vị trí", "error");
        }
    };


    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #f8fafc, #e2e8f0)", padding: "24px" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#0f172a", margin: 0 }}>Quản lý Vị trí</h1>
                        <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Quản lý các vị trí lưu trữ trong hệ thống</p>
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
                        Thêm vị trí
                    </Button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <Card style={{ borderLeft: "4px solid #237486" }}>
                        <CardContent style={{ paddingTop: "24px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Tổng vị trí</div>
                            <div style={{ fontSize: "30px", fontWeight: "bold", color: "#0f172a", marginTop: "8px" }}>{globalStats.total}</div>
                        </CardContent>
                    </Card>
                    <Card style={{ borderLeft: "4px solid #237486" }}>
                        <CardContent style={{ paddingTop: "24px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Trống</div>
                            <div style={{ fontSize: "30px", fontWeight: "bold", color: "#237486", marginTop: "8px" }}>{globalStats.available}</div>
                        </CardContent>
                    </Card>
                    <Card style={{ borderLeft: "4px solid #237486" }}>
                        <CardContent style={{ paddingTop: "24px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Đang sử dụng</div>
                            <div style={{ fontSize: "30px", fontWeight: "bold", color: "#64748b", marginTop: "8px" }}>{globalStats.unavailable}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <SearchBar
                    placeholder="Tìm kiếm theo mã vị trí..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                />

                {/* Locations Table */}
                <Card style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", overflow: "hidden", padding: 0 }}>
                    <div style={{ width: "100%" }}>
                        {loading ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
                                <div style={{ color: "#64748b" }}>Đang tải dữ liệu...</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <CustomTable style={{ width: "100%" }}>
                                    <TableHeader>
                                        <TableRow style={{ backgroundColor: "#237486", margin: 0, width: "100%" }}>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0, width: "80px" }}>
                                                STT
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0, width: "160px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "4px", margin: "-4px", borderRadius: "4px" }} onClick={() => handleSort("locationCode")}>
                                                    <span>Mã vị trí</span>
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <ChevronDown
                                                            style={{
                                                                height: "12px",
                                                                width: "12px",
                                                                color: sortField === "locationCode" && sortAscending ? "white" : "rgba(255,255,255,0.5)",
                                                                transform: "translateY(1px)"
                                                            }}
                                                        />
                                                        <ChevronDown
                                                            style={{
                                                                height: "12px",
                                                                width: "12px",
                                                                color: sortField === "locationCode" && !sortAscending ? "white" : "rgba(255,255,255,0.5)",
                                                                transform: "translateY(-1px) rotate(180deg)"
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0 }}>
                                                Khu vực
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0 }}>
                                                Kệ
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0 }}>
                                                Hàng
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0 }}>
                                                Cột
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0, width: "160px" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    <span>Tình trạng</span>
                                                    <FilterDropdown
                                                        type="status"
                                                        value={statusFilter}
                                                        onFilterChange={handleStatusFilter}
                                                        onClearFilter={clearStatusFilter}
                                                        options={[
                                                            { value: "true", label: "Trống" },
                                                            { value: "false", label: "Đang sử dụng" }
                                                        ]}
                                                        placeholder="Tất cả"
                                                        className="status-filter-dropdown"
                                                        title="Lọc theo tình trạng"
                                                    />
                                                </div>
                                            </TableHead>
                                            <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0, width: "160px" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    <span>Trạng thái</span>
                                                    <FilterDropdown
                                                        type="statusType"
                                                        value={statusTypeFilter}
                                                        onFilterChange={handleStatusTypeFilter}
                                                        onClearFilter={clearStatusTypeFilter}
                                                        options={[
                                                            { value: "1", label: "Hoạt động" },
                                                            { value: "2", label: "Ngừng hoạt động" }
                                                        ]}
                                                        placeholder="Tất cả"
                                                        className="status-type-filter-dropdown"
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
                                        {locations.length > 0 ? (
                                            locations.map((location, index) => (
                                                <TableRow
                                                    key={location.locationId}
                                                    style={{
                                                        backgroundColor: index % 2 === 0 ? "white" : "#f8fafc",
                                                        margin: 0,
                                                        width: "100%"
                                                    }}
                                                >
                                                    <TableCell style={{ color: "#64748b", padding: "12px 16px", border: 0, width: "80px", textAlign: "center", fontWeight: "500" }}>
                                                        {(pagination.current - 1) * pagination.pageSize + index + 1}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: "500", color: "#0f172a", padding: "12px 16px", border: 0, width: "160px" }}>
                                                        {location?.locationCode || ''}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0 }}>
                                                        {location?.areaNameDto?.areaName || "—"}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0 }}>
                                                        {location?.rack || ''}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0 }}>
                                                        {location?.row || ''}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0 }}>
                                                        {location?.column || ''}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0, width: "160px", textAlign: "center" }}>
                                                        <span style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "9999px",
                                                            fontSize: "12px",
                                                            fontWeight: "500",
                                                            backgroundColor: location?.isAvailable ? "#dcfce7" : "#fef2f2",
                                                            color: location?.isAvailable ? "#166534" : "#dc2626"
                                                        }}>
                                                            {location?.isAvailable ? 'Trống' : 'Đang sử dụng'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0, textAlign: "center" }}>
                                                        <span style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "9999px",
                                                            fontSize: "12px",
                                                            fontWeight: "500",
                                                            backgroundColor: location?.status === 1 ? "#dcfce7" : location?.status === 2 ? "#fef3c7" : "#fef2f2",
                                                            color: location?.status === 1 ? "#166534" : location?.status === 2 ? "#d97706" : "#dc2626"
                                                        }}>
                                                            {location?.status === 1 ? 'Hoạt động' : location?.status === 2 ? 'Ngừng hoạt động' : 'Đã xóa'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell style={{ color: "#64748b", padding: "12px 16px", border: 0, textAlign: "center" }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                            <button
                                                                style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", borderRadius: "4px" }}
                                                                title="Chỉnh sửa"
                                                                onClick={() => handleOpenEdit(location)}
                                                            >
                                                                <Edit style={{ height: "16px", width: "16px", color: "#1a7b7b" }} />
                                                            </button>
                                                            <button
                                                                style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", borderRadius: "4px" }}
                                                                title="Xóa"
                                                                onClick={() => {
                                                                    setItemToDelete(location);
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
                                                <TableCell colSpan={9} style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
                                                    Không tìm thấy vị trí nào
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
                {!loading && (
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

            {/* Create Location Modal */}
            <CreateLocationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Update Location Modal */}
            <UpdateLocationModal
                isOpen={showUpdateModal}
                onClose={handleUpdateCancel}
                onSuccess={handleUpdateSuccess}
                locationId={updateLocationId}
                locationData={editingLocation}
            />

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                itemName={itemToDelete?.locationCode || ""}
            />
        </div>
    );
};

export default LocationList;
