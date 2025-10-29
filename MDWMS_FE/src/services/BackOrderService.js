import api from "./api";

// Lấy danh sách BackOrder (phân trang, tìm kiếm, sort, filter)
export const getBackOrders = async (searchParams = {}) => {
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
            filters: {},
        };

        // Xử lý filters nếu có
        if (searchParams.filters) {
            Object.entries(searchParams.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== "") {
                    body.filters[key] = value.toString();
                }
            });
        }

        const res = await api.post("/BackOrder/BackOrders", body);
        console.log("log data backorder: ", res)
        return res?.data?.data ?? res?.data ?? { items: [], totalCount: 0 };
    } catch (error) {
        console.error("Error fetching BackOrders:", error);
        if (error.response) {
            console.error("Error response:", error.response.data);
        }
        return { items: [], totalCount: 0 };
    }
};

// Tạo mới BackOrder
export const createBackOrder = async (data) => {
    try {
        const body = {
            retailerId: data.retailerId,
            goodsId: data.goodsId,
            quantity: data.quantity,
        };

        const res = await api.post("/BackOrder/Create", body);
        console.log("BackOrder Create API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating BackOrder:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật BackOrder
export const updateBackOrder = async (id, data) => {
    try {
        const body = {
            retailerId: data.retailerId,
            goodsId: data.goodsId,
            quantity: data.quantity,
        };

        const res = await api.put(`/BackOrder/Update/${id}`, body);
        console.log("BackOrder Update API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating BackOrder:", error);
        throw new Error(
            error?.response?.data?.message || "Lỗi khi cập nhật BackOrder"
        );
    }
};

// Xóa BackOrder
export const deleteBackOrder = async (id) => {
    try {
        const res = await api.delete(`/BackOrder/Delete/${id}`);
        console.log("BackOrder Delete API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error deleting BackOrder:", error);
        throw error;
    }
};

// Cập nhật trạng thái BackOrder
export const updateBackOrderStatus = async (data) => {
    try {
        const body = {
            backOrderId: data.backOrderId,
            status: data.status,
        };

        const res = await api.put("/BackOrder/UpdateStatus", body);
        console.log("BackOrder status update API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating BackOrder status:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Lấy chi tiết BackOrder theo ID
export const getBackOrderDetail = async (id) => {
    try {
        const res = await api.get(`/BackOrder/BackOrderDetail/${id}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching BackOrder detail:", error);
        throw error;
    }
};

// Lấy danh sách dropdown BackOrder
export const getBackOrderDropdown = async () => {
    try {
        const res = await api.get("/BackOrder/GetBackOrderDropdown");
        console.log("BackOrder dropdown response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching BackOrder dropdown:", error);
        throw error;
    }
};
