import api from "./api";

export const getSalesOrderListSalesRepresentatives = async (params = {}) => {
    try {
        const payload = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            search: params.search || "",
            sortField: params.sortField || "",
            sortAscending: params.sortAscending ?? true,
            filters: {
                ...(params.status && { status: params.status }),
                ...(params.retailerId && { retailerId: params.retailerId }),
                ...(params.createdBy && { createdBy: params.createdBy }),
                ...(params.approvalBy && { approvalBy: params.approvalBy }),
                ...(params.fromEstimatedDate && { fromDate: params.fromEstimatedDate }),
                ...(params.toEstimatedDate && { toDate: params.toEstimatedDate }),
            },
        };

        const res = await api.post("/SalesOrder/GetSalesOrderListSalesRepresentatives", payload);
        console.log("getSalesOrderListSalesRepresentatives:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching sales orders for sales representatives:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const getSalesOrderListSaleManager = async (params = {}) => {
    try {
        const payload = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            search: params.search || "",
            sortField: params.sortField || "",
            sortAscending: params.sortAscending ?? true,
            filters: {
                ...(params.status && { status: params.status }),
                ...(params.retailerId && { retailerId: params.retailerId }),
                ...(params.createdBy && { createdBy: params.createdBy }),
                ...(params.approvalBy && { approvalBy: params.approvalBy }),
                ...(params.acknowledgedBy && { acknowledgedBy: params.acknowledgedBy }),
                ...(params.fromEstimatedDate && { fromDate: params.fromEstimatedDate }),
                ...(params.toEstimatedDate && { toDate: params.toEstimatedDate }),
            },
        };

        const res = await api.post("/SalesOrder/GetSalesOrderListSaleManager", payload);
        console.log("getSalesOrderListSaleManager:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching sales orders (Sale Manager):", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const getSalesOrderListWarehouseManager = async (params = {}) => {
    try {
        const body = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            search: params.search || "",
            sortField: params.sortField || "",
            sortAscending: params.sortAscending ?? true,
            filters: {
                ...(params.status && { status: params.status }),
                ...(params.retailerId && { retailerId: params.retailerId }),
                ...(params.createdBy && { createdBy: params.createdBy }),
                ...(params.approvalBy && { approvalBy: params.approvalBy }),
                ...(params.acknowledgedBy && { acknowledgedBy: params.acknowledgedBy }),
                ...(params.assignTo && { assignTo: params.assignTo }),
                ...(params.fromEstimatedDate && { fromDate: params.fromEstimatedDate }),
                ...(params.toEstimatedDate && { toDate: params.toEstimatedDate }),
            },
        };

        const res = await api.post("/SalesOrder/GetSalesOrderListWarehouseManager", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching sales orders for warehouse manager:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const getSalesOrderListWarehouseStaff = async (params = {}) => {
    try {
        const body = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            search: params.search || "",
            sortField: params.sortField || "",
            sortAscending: params.sortAscending ?? true,
            filters: {
                ...(params.status && { status: params.status }),
                ...(params.retailerId && { retailerId: params.retailerId }),
                ...(params.acknowledgedBy && { acknowledgedBy: params.acknowledgedBy }),
                ...(params.assignTo && { assignTo: params.assignTo }),
                ...(params.fromEstimatedDate && { fromDate: params.fromEstimatedDate }),
                ...(params.toEstimatedDate && { toDate: params.toEstimatedDate }),
            },
        };

        const res = await api.post("/SalesOrder/GetSalesOrderListWarehouseStaff", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching sales orders for warehouse staff:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

// Lấy chi tiết Sale Order
export const getSalesOrderDetail = async (id) => {
    try {
        const res = await api.get(`/SalesOrder/GetSalesOrderDetail/${id}`);
        console.log("getSaleOrderDetail: ", res);
        return res.data;
    } catch (error) {
        console.error("Error fetching sale order detail:", error);
        throw error;
    }
};

// Tạo mới Sale Order
export const createSaleOrder = async (data) => {
    try {
        console.log("createSaleOrder - request payload:", data);
        const res = await api.post("/SalesOrder/CreateSalesOrder", data);
        console.log("createSaleOrder - response:", res);
        return res.data;
    } catch (error) {
        console.error("Error creating sale order:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật thông tin Sale Order
export const updateSaleOrder = async (data) => {
    try {
        const res = await api.put("/SalesOrder/UpdateSalesOrder", data);
        console.log("updateSaleOrder response:", res);
        return res.data;
    } catch (error) {
        console.error("Error updating sale order:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Xóa Sale Order
export const deleteSaleOrder = async (id) => {
    try {
        const res = await api.delete(`/SalesOrder/DeleteSalesOrder/${id}`);
        console.log("deleteSaleOrder:", res);
        return res.data;
    } catch (error) {
        console.error("Error deleting sale order:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật trạng thái đơn hàng sang "Pending Approval"
export const updateSaleOrderStatusPendingApproval = async (data) => {
    try {
        const res = await api.put("/SalesOrder/UpdateSalesOrderStatusPendingApproval", data);
        console.log("updateSaleOrderStatusPendingApproval:", res);
        return res.data;
    } catch (error) {
        console.error("Error updating status to Pending Approval:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Duyệt đơn hàng
export const approveSalesOrder = async (data) => {
    try {
        const res = await api.put("/SalesOrder/UpdateSalesOrderStatusApproval", data);
        console.log("approveSalesOrder:", res);
        return res.data;
    } catch (error) {
        console.error("Error approving sales order:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Từ chối đơn hàng
export const rejectSalesOrder = async (data) => {
    try {
        const res = await api.put("/SalesOrder/UpdateSalesOrderStatusReject", data);
        console.log("rejectSalesOrder:", res);
        return res.data;
    } catch (error) {
        console.error("Error rejecting sales order:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Phân công lấy hàng
export const assignForPicking = async (data) => {
    try {
        const res = await api.put("/SalesOrder/UpdateSalesOrderStatusAssignedForPicking", data);
        console.log("assignForPicking:", res);
        return res.data;
    } catch (error) {
        console.error("Error assigning for picking:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Tạo phiếu xuất kho
export const createDeliverySlip = async (data) => {
    try {
        const res = await api.post("/SalesOrder/CreateDeliverySlip", data);
        console.log("createDeliverySlip:", res);
        return res.data;
    } catch (error) {
        console.error("Error creating delivery slip:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};
