import api from "./api";

// Lấy danh sách Area (phân trang, tìm kiếm, sort, filter)
export const getAreas = async (searchParams = {}) => {
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

        const res = await api.post("/Area/Areas", body);
        return res?.data?.data ?? res?.data ?? { items: [], totalCount: 0 };
    } catch (error) {
        console.error("Error fetching Areas:", error);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        return { items: [], totalCount: 0 };
    }
};

// Tạo mới Area
export const createArea = async (data) => {
    try {
        const body = {
            areaName: data.areaName,
            areaCode: data.areaCode,
            description: data.description,
            storageConditionId: data.storageConditionId,
            status: data.status,
        };

        const res = await api.post("/Area/Create", body);
        console.log("Area Create API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating Area:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật Area
export const updateArea = async (areaId, data) => {
    const body = {
        AreaName: data.areaName,
        AreaCode: data.areaCode,
        Description: data.description,
        StorageConditionId: data.storageConditionId,
        Status: data.status,
    };

    try {
        console.log("Sending update request:", body);
        const res = await api.put(`/Area/Update/${areaId}`, body);
        console.log("Area Update API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating Area:", error);
        if (error.response && error.response.data && error.response.data.message) {
            // Trả lại message lỗi từ BE
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Xóa Area
export const deleteArea = async (AreaId) => {
    try {
        const res = await api.delete(`/Area/Delete/${AreaId}`);
        console.log("Area Delete API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error deleting Area:", error);
        throw error;
    }
};
