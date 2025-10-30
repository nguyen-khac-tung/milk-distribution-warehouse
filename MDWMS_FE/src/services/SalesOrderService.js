import api from "./api";

export const getSalesOrderListSalesRepresentatives = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending:
                searchParams.sortAscending !== undefined
                    ? searchParams.sortAscending
                    : true,
            filters: {
                ...(searchParams.status && { status: searchParams.status }),
                ...(searchParams.customerId && { customerId: searchParams.customerId }),
                ...(searchParams.salesRepId && { salesRepId: searchParams.salesRepId }),
                ...(searchParams.createdBy && { createdBy: searchParams.createdBy }),
                ...(searchParams.approvedBy && { approvedBy: searchParams.approvedBy }),
                ...(searchParams.assignedTo && { assignedTo: searchParams.assignedTo }),
                // Backend expects keys named fromDate / toDate (case-insensitive). Map frontend estimated date keys to those.
                ...(searchParams.fromEstimatedDate && { fromDate: searchParams.fromEstimatedDate }),
                ...(searchParams.toEstimatedDate && { toDate: searchParams.toEstimatedDate }),
            },
        };

        const res = await api.post(
            "/SalesOrder/GetSalesOrderListSalesRepresentatives",
            body
        );
        console.log("API GetSalesOrderList: ", res)
        return res.data;
    } catch (error) {
        console.error("Error fetching sales orders for representatives:", error);

        //Trích xuất lỗi thực tế từ backend nếu có
        if (error.response && error.response.data) {
            const Error = error.response.data;
            return {
                success: false,
                message: Error.message || "Lỗi từ máy chủ.",
                errors: Error.errors || null,
                statusCode: error.response.status,
            };
        }

        //Lỗi không có phản hồi từ server (ví dụ: network)
        return {
            success: false,
            message: "Không thể kết nối tới máy chủ. Vui lòng thử lại sau.",
            errors: null,
        };
    }
};

export const getSalesOrderListSaleManager = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending:
                searchParams.sortAscending !== undefined
                    ? searchParams.sortAscending
                    : true,
            filters: {
                ...(searchParams.status && { status: searchParams.status }),
                ...(searchParams.customerId && { customerId: searchParams.customerId }),
                ...(searchParams.salesRepId && { salesRepId: searchParams.salesRepId }),
                ...(searchParams.createdBy && { createdBy: searchParams.createdBy }),
                ...(searchParams.approvedBy && { approvedBy: searchParams.approvedBy }),
                ...(searchParams.assignedTo && { assignedTo: searchParams.assignedTo }),
                ...(searchParams.fromEstimatedDate && { fromDate: searchParams.fromEstimatedDate }),
                ...(searchParams.toEstimatedDate && { toDate: searchParams.toEstimatedDate }),
            },
        };

        const res = await api.post(
            "/SalesOrder/GetSalesOrderListSaleManager",
            body
        );
        console.log("API GetSalesOrderList: ", res)
        return res.data;
    } catch (error) {
        console.error("Error fetching sales orders for representatives:", error);

        //Trích xuất lỗi thực tế từ backend nếu có
        if (error.response && error.response.data) {
            const Error = error.response.data;
            return {
                success: false,
                message: Error.message || "Lỗi từ máy chủ.",
                errors: Error.errors || null,
                statusCode: error.response.status,
            };
        }

        //Lỗi không có phản hồi từ server (ví dụ: network)
        return {
            success: false,
            message: "Không thể kết nối tới máy chủ. Vui lòng thử lại sau.",
            errors: null,
        };
    }
};

export const getSalesOrderListWarehouseManager = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending:
                searchParams.sortAscending !== undefined
                    ? searchParams.sortAscending
                    : true,
            filters: {
                ...(searchParams.status && { status: searchParams.status }),
                ...(searchParams.customerId && { customerId: searchParams.customerId }),
                ...(searchParams.salesRepId && { salesRepId: searchParams.salesRepId }),
                ...(searchParams.createdBy && { createdBy: searchParams.createdBy }),
                ...(searchParams.approvedBy && { approvedBy: searchParams.approvedBy }),
                ...(searchParams.assignedTo && { assignedTo: searchParams.assignedTo }),
                ...(searchParams.fromEstimatedDate && { fromDate: searchParams.fromEstimatedDate }),
                ...(searchParams.toEstimatedDate && { toDate: searchParams.toEstimatedDate }),
            },
        };

        const res = await api.post(
            "/SalesOrder/GetSalesOrderListWarehouseManager",
            body
        );
        console.log("API GetSalesOrderList: ", res)
        return res.data;
    } catch (error) {
        console.error("Error fetching sales orders for representatives:", error);

        //Trích xuất lỗi thực tế từ backend nếu có
        if (error.response && error.response.data) {
            const Error = error.response.data;
            return {
                success: false,
                message: Error.message || "Lỗi từ máy chủ.",
                errors: Error.errors || null,
                statusCode: error.response.status,
            };
        }

        //Lỗi không có phản hồi từ server (ví dụ: network)
        return {
            success: false,
            message: "Không thể kết nối tới máy chủ. Vui lòng thử lại sau.",
            errors: null,
        };
    }
};

export const getSalesOrderListWarehouseStaff = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending:
                searchParams.sortAscending !== undefined
                    ? searchParams.sortAscending
                    : true,
            filters: {
                ...(searchParams.status && { status: searchParams.status }),
                ...(searchParams.customerId && { customerId: searchParams.customerId }),
                ...(searchParams.salesRepId && { salesRepId: searchParams.salesRepId }),
                ...(searchParams.createdBy && { createdBy: searchParams.createdBy }),
                ...(searchParams.approvedBy && { approvedBy: searchParams.approvedBy }),
                ...(searchParams.assignedTo && { assignedTo: searchParams.assignedTo }),
                ...(searchParams.fromEstimatedDate && { fromDate: searchParams.fromEstimatedDate }),
                ...(searchParams.toEstimatedDate && { toDate: searchParams.toEstimatedDate }),
            },
        };

        const res = await api.post(
            "/SalesOrder/GetSalesOrderListWarehouseStaff",
            body
        );
        console.log("API GetSalesOrderList: ", res)
        return res.data;
    } catch (error) {
        console.error("Error fetching sales orders for representatives:", error);

        //Trích xuất lỗi thực tế từ backend nếu có
        if (error.response && error.response.data) {
            const Error = error.response.data;
            return {
                success: false,
                message: Error.message || "Lỗi từ máy chủ.",
                errors: Error.errors || null,
                statusCode: error.response.status,
            };
        }

        //Lỗi không có phản hồi từ server (ví dụ: network)
        return {
            success: false,
            message: "Không thể kết nối tới máy chủ. Vui lòng thử lại sau.",
            errors: null,
        };
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

// Cập nhật trạng thái từ chối Sale Order
export const updateSaleOrderStatusReject = async (data) => {
    try {
        const res = await api.put("/SalesOrder/UpdateSalesOrderStatusReject", data);
        console.log("updateSaleOrderStatusReject:", res);
        return res.data;
    } catch (error) {
        console.error("Error rejecting sale order:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật trạng thái đơn hàng sang "Approved"
export const updateSaleOrderStatusApproval = async (data) => {
    try {
        const res = await api.put("/SalesOrder/UpdateSalesOrderStatusApproval", data);
        console.log("updateSaleOrderStatusApproval:", res);
        return res.data;
    } catch (error) {
        console.error("Error updating status to Approval:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật trạng thái đơn hàng sang "Assigned For Picking"
export const updateSaleOrderStatusAssignedForPicking = async (data) => {
    try {
        const res = await api.put("/SalesOrder/UpdateSalesOrderStatusAssignedForPicking", data);
        console.log("updateSaleOrderStatusAssignedForPicking:", res);
        return res.data;
    } catch (error) {
        console.error("Error updating status to AssignedForPicking:", error);
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
