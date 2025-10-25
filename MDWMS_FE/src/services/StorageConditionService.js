import api from "./api";

export const getStorageCondition = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: searchParams.status ? { status: searchParams.status } : {}
        };
        const res = await api.post("/StorageCondition/StorageConditions", body);

        return res.data;
    } catch (error) {
        console.error("Error fetching StorageCondition:", error);
        return { data: [], totalCount: 0 };
    }
};

export const createStorageCondition = async (data) => {
    try {
        const body = {
            temperatureMin: data.temperatureMin,
            temperatureMax: data.temperatureMax,
            humidityMin: data.humidityMin,
            humidityMax: data.humidityMax,
            lightLevel: data.lightLevel,
        };
        const res = await api.post("/StorageCondition/Create", body);
        return res.data;
    } catch (error) {
        console.error("Error creating storage condition:", error);
        throw error;
    }
};

export const deleteStorageCondition = async (StorageConditionId) => {
    try {
        // Validate input
        if (!StorageConditionId) {
            throw new Error("StorageConditionId is required");
        }

        const res = await api.delete(`/StorageCondition/Delete/${StorageConditionId}`);
        return res.data;
    } catch (error) {
        console.error("Error deleting storage condition:", error);

        // Log more details about the error
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }

        throw error;
    }
};

export const updateStorageCondition = async (id, data) => {
    const body = {
        temperatureMin: data.temperatureMin || 0,
        temperatureMax: data.temperatureMax || 0,
        humidityMin: data.humidityMin || 0,
        humidityMax: data.humidityMax || 0,
        lightLevel: data.lightLevel || "",
        status: data.status || 1
    };

    try {
        const res = await api.put(`/StorageCondition/Update/${id}`, body);
        return res.data;
    } catch (error) {
        console.error("Error updating storage condition:", error);
        console.error("Request body was:", body);
        console.error("ID was:", id);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        throw error;
    }
};

// Update storage condition status
export const updateStorageConditionStatus = async (storageConditionId, status) => {
    try {
        // Validate input
        if (!storageConditionId) {
            throw new Error("StorageConditionId is required");
        }
        if (status === undefined || status === null) {
            throw new Error("Status is required");
        }

        const res = await api.put(`/StorageCondition/UpdateStatus/${storageConditionId}?status=${status}`);
        return res.data;
    } catch (error) {
        console.error("Error updating storage condition status:", error);

        // Log more details about the error
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }

        throw error;
    }
};

// Get storage conditions for dropdown
export const getStorageConditionsDropdown = async () => {
    try {
        const res = await api.get("/StorageCondition/StorageConditionsDropdown");
        return res.data;
    } catch (error) {
        console.error("Error fetching storage conditions dropdown:", error);
        return { status: 500, message: "Error fetching storage conditions", data: [] };
    }
};

