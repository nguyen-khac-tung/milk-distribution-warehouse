import api from "./api";

export const createGood = async (goodData) => {
    try {
        const res = await api.post("Goods/Create", goodData);
        console.log("Create good response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating good:", error);
        throw error;
    }
};

export const getGoods = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.status && { status: searchParams.status }),
                ...(searchParams.categoryId && { categoryId: searchParams.categoryId }),
                ...(searchParams.supplierId && { supplierId: searchParams.supplierId }),
                ...(searchParams.unitMeasureId && { unitMeasureId: searchParams.unitMeasureId })
            }
        };

        console.log("Goods API - Search params received:", searchParams);
        console.log("Goods API - Request body sent:", body);
        
        const res = await api.post("/Goods/Goods", body);
        console.log("Goods API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error fetching goods:", error);
        return { data: [], totalCount: 0 };
    }
};

export const updateGood = async (goodData) => {
    try {
        const res = await api.put("/Goods/Update", goodData);
        console.log("Update good response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating good:", error);
        throw error;
    }
};

export const deleteGood = async (goodId) => {
    try {
        const res = await api.delete(`/Goods/Delete/${goodId}`);
        console.log("Delete good response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error deleting good:", error);
        throw error;
    }
};

export const getGoodDetail = async (goodId) => {
    try {
        const res = await api.get(`/Goods/GoodsByGoodsId/${goodId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching good detail:", error);
        throw error;
    }
};

// Update goods status
export const updateGoodStatus = async (data) => {
    try {
        const body = {
            goodsId: data.goodsId,
            status: data.status
        };

        console.log("Sending status update request:", body);
        const res = await api.put("/Goods/UpdateStatus", body);
        console.log("Goods status update API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating goods status:", error);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        throw error;
    }
};