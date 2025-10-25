import api from "./api";

export const getUnitMeasure = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: searchParams.status ? { status: searchParams.status } : {}
        };
        const res = await api.post("UnitMeasure/UnitMeasures", body);

        return res.data;
    } catch (error) {
        console.error("Error fetching UnitMeasure:", error);
        return { data: [], totalCount: 0 };
    }
};


export const createUnitMeasure = async (data) => {
    try {
        const body = {
            name: data.name,
            description: data.description
        };
        const res = await api.post("/UnitMeasure/Create", body);
        return res.data;
    } catch (error) {
        console.error("Error creating unit measure:", error);
        throw error;
    }
};

export const deleteUnitMeasure = async (unitMeasureId) => {
    try {
        const res = await api.delete(`/UnitMeasure/Delete/${unitMeasureId}`);
        return res.data;
    } catch (error) {
        console.error("Error deleting unit measure:", error);
        throw error;
    }
};

export const updateUnitMeasure = async (data) => {
    const body = {
        name: data.name,
        description: data.description,
        unitMeasureId: data.unitMeasureId,
        status: data.status
    };

    try {
        const res = await api.put("/UnitMeasure/Update", body);
        return res.data;
    } catch (error) {
        console.error("Error updating unit measure:", error);
        console.error("Request body was:", body);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        throw error;
    }
};

export const updateUnitMeasureStatus = async (data) => {
    const body = {
        unitMeasureId: data.unitMeasureId,
        status: data.status
    };

    try {
        const res = await api.post("/UnitMeasure/UpdateUnitMeasureStatus", body);
        return res.data;
    } catch (error) {
        console.error("Error updating unit measure status:", error);
        console.error("Request body was:", body);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        throw error;
    }
};

// Get unit measures for dropdown
export const getUnitMeasuresDropdown = async () => {
    try {
        const res = await api.get("/UnitMeasure/GetUnitMeasureDropDown");
        return res.data;
    } catch (error) {
        console.error("Error fetching unit measures dropdown:", error);
        return { status: 500, message: "Error fetching unit measures", data: [] };
    }
};

