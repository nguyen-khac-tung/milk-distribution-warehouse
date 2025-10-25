import api from "./api";

// Lấy danh sách Batch (phân trang, tìm kiếm, sort, filter)
export const getBatches = async (searchParams = {}) => {
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
            // Build filters object: support status
            filters: {},
        };

        // Handle filters from searchParams.filters object
        if (searchParams.filters) {
            if (searchParams.filters.status !== undefined && searchParams.filters.status !== "") {
                body.filters.status = searchParams.filters.status.toString();
            }
        }

        // Also support direct status parameter for backward compatibility
        if (searchParams.status !== undefined && searchParams.status !== "") {
            body.filters.status = searchParams.status.toString();
        }

        const res = await api.post("/Batch/GetBatchList", body);
        return res?.data?.data ?? res?.data ?? { items: [], totalCount: 0 };
    } catch (error) {
        console.error("Error fetching Batchs:", error);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        return { items: [], totalCount: 0 };
    }
};

// Tạo mới batch
export const createBatch = async (data) => {
    try {
        const body = {
            batchCode: data.batchCode,
            goodsId: data.goodsId,
            description: data.description,
            manufacturingDate: data.manufacturingDate,
            expiryDate: data.expiryDate,
        };

        const res = await api.post("/Batch/Create", body);
        console.log("Batch Create API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating Batch:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật Batch
export const updateBatch = async (data) => {
    try {
        const body = {
            batchId: data.batchId,
            batchCode: data.batchCode,
            goodsId: data.goodsId,
            description: data.description,
            manufacturingDate: data.manufacturingDate,
            expiryDate: data.expiryDate,
        };

        console.log("Sending update request:", body);
        const res = await api.put("/Batch/Update", body);
        return res.data;
    } catch (error) {
        console.error("Error updating batch:", error);
        throw new Error(
            error?.response?.data?.message || "Lỗi khi cập nhật batch"
        );
    }
};


// Xóa Batch
export const deleteBatch = async (batchId) => {
    try {
        const res = await api.delete(`/Batch/Delete/${batchId}`);
        console.log("Batch Delete API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error deleting batch:", error);
        throw error;
    }
};

// Update batchs status
export const updateBatchStatus = async (data) => {
    try {
        const body = {
            batchId: data.batchId,
            status: data.status,
        };

        const res = await api.put("/Batch/UpdateStatus", body);
        console.log("Batch status update API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating batch status:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Lấy dropdown batch theo goodsId
export const getBatchDropdown = async (goodsId) => {
    try {
        const res = await api.get(`/Batch/DropDown/${goodsId}`);
        console.log("Batch dropdown response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching batch dropdown:", error);
        throw error;
    }
};

// Lấy chi tiết Batch theo ID
export const getBatchDetail = async (batchId) => {
    try {
        // If backend supports direct detail endpoint
        const res = await api.get(`/Batch/BatchByBatchId/${batchId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching batch detail:", error);
        throw error;
    }
};