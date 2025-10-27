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

// Tạo Sale Order
export const createSaleOrder = async (data) => {
    try {
        const res = await api.post("/SaleOrder/CreateSaleOrder", data);
        return res.data;
    } catch (error) {
        console.error("Error creating sale order:", error);
        throw error;
    }
};