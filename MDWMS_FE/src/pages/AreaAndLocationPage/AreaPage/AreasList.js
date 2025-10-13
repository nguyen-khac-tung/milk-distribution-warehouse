import React, { useEffect, useState, useRef } from "react";
import { Button, Form, message } from "antd";
import { getAreas, createArea, updateArea, deleteArea } from "../../../services/AreaServices";
import { getStorageCondition } from "../../../services/StorageConditionService";
import { Edit, Trash2, ChevronDown, Plus } from "lucide-react";
import DeleteModal from "../../../components/Common/DeleteModal";
import SearchBar from "../../../components/Common/SearchBar";
import FilterDropdown from "../../../components/Common/FilterDropdown";
import Pagination from "../../../components/Common/Pagination";
import CreateAreaModal from "./CreateAreaModal";
import UpdateAreaModal from "./UpdateAreaModal";
import { Card, CardContent } from "../../../components/ui/card";
import { Table as CustomTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { extractErrorMessage } from "../../../utils/Validation";

const AreaLists = () => {
    const [areas, setAreas] = useState([]);
    const [storageConditions, setStorageConditions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortField, setSortField] = useState("");
    const [sortAscending, setSortAscending] = useState(true);
    const searchQueryRef = useRef("");

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
            message.error("Không thể tải danh sách khu vực!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas(pagination.current, pagination.pageSize);
    }, []);

    useEffect(() => {
        const fetchStorageCondition = async () => {
            try {
                const data = await getStorageCondition();
                console.log("Fetch storageCondition: ", data)
                setStorageConditions(data?.data?.items || []);
            } catch {
                message.error("Không thể tải danh sách khu vực!");
            }
        };
        fetchStorageCondition();
    }, []);

    useEffect(() => {
        if (showUpdateModal && editingArea && storageConditions.length > 0) {
            form.setFieldsValue({
                storageConditionId: Number(editingArea.storageConditionId),
            });
        }
    }, [showUpdateModal, storageConditions]);


    // Search input change handler
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        searchQueryRef.current = value;
    };


    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
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
        form.resetFields();
        form.setFieldsValue({ status: 1 });
        setShowCreateModal(true);
    };

    // Mở modal sửa
    const handleOpenEdit = (record) => {
        console.log(">>> storageConditions hiện có:", storageConditions);
        console.log(">>> record.storageConditionId:", record.storageConditionId);
        setEditingArea(record);
        form.setFieldsValue({
            areaName: record.areaName,
            areaCode: record.areaCode,
            description: record.description,
            storageConditionId: record.storageConditionId,
            status: record.status,
        });
        setShowUpdateModal(true);
    };

    // Submit create
    const handleCreateSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                areaName: values.areaName,
                areaCode: values.areaCode,
                description: values.description,
                storageConditionId: Number(values.storageConditionId),
                status: 1,
            };

            await createArea(payload);
            window.showToast(`Đã tạo khu vực mới: ${payload.areaCode}`, "success");

            setShowCreateModal(false);
            fetchAreas(pagination.current, pagination.pageSize, {
                search: searchQuery,
                filters: {
                    status: statusFilter ? Number(statusFilter) : undefined
                }
            });
        } catch (error) {
            console.error("Error creating area:", error);
            const cleanMsg = extractErrorMessage(error);
            window.showToast(cleanMsg, "error");
        }
    };

    // Submit update
    const handleUpdateSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                areaName: values.areaName,
                areaCode: values.areaCode,
                description: values.description,
                storageConditionId: Number(values.storageConditionId),
                status: Number(values.status),
            };

            await updateArea(editingArea.areaId, payload);
            window.showToast(`Đã cập nhật khu vực: ${payload.areaCode}`, "success");

            setShowUpdateModal(false);
            fetchAreas(pagination.current, pagination.pageSize, {
                search: searchQuery,
                filters: {
                    status: statusFilter ? Number(statusFilter) : undefined
                }
            });
        } catch (error) {
            console.error("Error updating area:", error);
            const cleanMsg = extractErrorMessage(error);
            window.showToast(cleanMsg, "error");
        }
    };

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

    // Calculate stats
    const activeCount = Array.isArray(areas) ? areas.filter((a) => a.status === 1).length : 0;
    const inactiveCount = Array.isArray(areas) ? areas.filter((a) => a.status === 2).length : 0;


    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #f8fafc, #e2e8f0)", padding: "24px" }}>
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
                            <div style={{ fontSize: "30px", fontWeight: "bold", color: "#0f172a", marginTop: "8px" }}>{pagination.total}</div>
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
                                            {/* <TableHead style={{ fontWeight: "600", color: "white", padding: "12px 16px", border: 0 }}>
                                                Điều kiện lưu trữ
                                            </TableHead> */}
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
                                                            { value: "2", label: "Không hoạt động" }
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
                                                        backgroundColor: index % 2 === 0 ? "white" : "#f8fafc",
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
                                                    {/* <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0 }}>
                                                        {area?.storageConditionId || "—"}
                                                    </TableCell> */}
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0 }}>
                                                        {area?.description?.length > 30 ? area.description.slice(0, 30) + "..." : area?.description || "—"}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#374151", padding: "12px 16px", border: 0, textAlign: "center" }}>
                                                        <span style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "9999px",
                                                            fontSize: "12px",
                                                            fontWeight: "500",
                                                            backgroundColor: area?.status === 1 ? "#dcfce7" : area?.status === 2 ? "#fef3c7" : "#fef2f2",
                                                            color: area?.status === 1 ? "#166534" : area?.status === 2 ? "#d97706" : "#dc2626"
                                                        }}>
                                                            {area?.status === 1 ? 'Hoạt động' : area?.status === 2 ? 'Không hoạt động' : 'Đã xóa'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell style={{ color: "#64748b", padding: "12px 16px", border: 0, textAlign: "center" }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
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
                                                <TableCell colSpan={7} style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
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

            {/* Create Area Modal */}
            <CreateAreaModal
                isVisible={showCreateModal}
                onCancel={() => setShowCreateModal(false)}
                onSubmit={handleCreateSubmit}
                form={form}
                loading={loading}
                storageConditions={storageConditions}
            />

            {/* Update Area Modal */}
            <UpdateAreaModal
                isVisible={showUpdateModal}
                onCancel={() => setShowUpdateModal(false)}
                onSubmit={handleUpdateSubmit}
                form={form}
                loading={loading}
                storageConditions={storageConditions}
            />

            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                itemName={itemToDelete?.areaCode || ""}
            />
        </div>
    );
};

export default AreaLists;
