import api from "./api";

export const getRetailers = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: searchParams.status ? { status: searchParams.status } : {}
        };
        const res = await api.post("/Retailer/Retailers", body);

        return res.data;
    } catch (error) {
        console.error("Error fetching retailers:", error);
        return { data: [], totalCount: 0 };
    }
};

export const getRetailerDetail = async (retailerId) => {
    try {
        const res = await api.get(`/Retailer/GetRetailerByRetailerId/${retailerId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching retailer detail:", error);
        throw error;
    }
};

// Create new retailer
export const createRetailer = async (retailerData) => {
    try {
        const res = await api.post('/Retailer/Create', retailerData);
        return res.data;
    } catch (error) {
        console.error("Error creating retailer:", error);
        throw error;
    }
};

// Update retailer
export const updateRetailer = async (retailerData) => {
    try {
        const res = await api.put('/Retailer/Update', retailerData);
        return res.data;
    } catch (error) {
        console.error("Error updating retailer:", error);
        throw error;
    }
};

// Delete retailer
export const deleteRetailer = async (retailerId) => {
    try {
        const res = await api.delete(`/Retailer/Delete/${retailerId}`);
        return res.data;
    } catch (error) {
        console.error("Error deleting retailer:", error);
        throw error;
    }
};

// Update retailer status
export const updateRetailerStatus = async (data) => {
    try {
        const body = {
            retailerId: data.retailerId,
            status: data.status
        };

        const res = await api.put("/Retailer/UpdateStatus", body);
        return res.data;
    } catch (error) {
        console.error("Error updating retailer status:", error);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        throw error;
    }
};

// Get retailers for dropdown
export const getRetailersDropdown = async () => {
    try {
        const res = await api.get("/Retailer/GetRetailerDropDown");
        // console.log("retailer:", res)
        return res.data;
    } catch (error) {
        console.error("Error fetching retailers dropdown:", error);
        return { status: 500, message: "Error fetching retailers", data: [] };
    }
};