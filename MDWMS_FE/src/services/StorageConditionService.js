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
        console.log("StorageCondition API response:", res.data);
        console.log("Search params received:", searchParams);

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
        console.log("StorageCondition API response:", res.data);
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

        console.log("Deleting StorageCondition with ID:", StorageConditionId);
        const res = await api.delete(`/StorageCondition/Delete/${StorageConditionId}`);
        console.log("StorageCondition delete API response:", res.data);
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
        console.log("Sending update request for ID:", id);
        console.log("Update data:", body);
        console.log("Data types:", {
            temperatureMin: typeof body.temperatureMin,
            temperatureMax: typeof body.temperatureMax,
            humidityMin: typeof body.humidityMin,
            humidityMax: typeof body.humidityMax,
            lightLevel: typeof body.lightLevel,
            status: typeof body.status
        });

        const res = await api.put(`/StorageCondition/Update/${id}`, body);
        console.log("StorageCondition update API response:", res.data);
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

