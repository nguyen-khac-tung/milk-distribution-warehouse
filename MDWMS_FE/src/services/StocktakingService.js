import api from "./api";

// Lấy danh sách Stocktaking Sheet cho Warehouse Manager
export const getStocktakingListForWarehouseManager = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.filters && { ...searchParams.filters })
            }
        };

        const res = await api.post("/StocktakingSheet/GetListForWarehouseManager", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking list for warehouse manager:", error);
        return { data: [], totalCount: 0 };
    }
};

// Lấy danh sách Stocktaking Sheet cho Warehouse Staff
export const getStocktakingListForWarehouseStaff = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.filters && { ...searchParams.filters })
            }
        };

        const res = await api.post("/StocktakingSheet/GetListForWarehouseStaff", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking list for warehouse staff:", error);
        return { data: [], totalCount: 0 };
    }
};

// Lấy danh sách Stocktaking Sheet cho Sale Manager
export const getStocktakingListForSaleManager = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.filters && { ...searchParams.filters })
            }
        };

        const res = await api.post("/StocktakingSheet/GetListForSaleManager", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking list for sale manager:", error);
        return { data: [], totalCount: 0 };
    }
};

// Hủy phiếu kiểm kê
export const cancelStocktaking = async (stocktakingSheetId) => {
    try {
        const res = await api.put(`/StocktakingSheet/Cancel/${stocktakingSheetId}`);
        return res.data;
    } catch (error) {
        console.error("Error cancelling stocktaking:", error);
        throw error;
    }
};