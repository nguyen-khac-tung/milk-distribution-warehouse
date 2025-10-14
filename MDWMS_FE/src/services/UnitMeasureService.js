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
        console.log("UnitMeasure API response:", res.data);
        console.log("Search params received:", searchParams);

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
        console.log("UnitMeasure API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating unit measure:", error);
        throw error;
    }
};

export const deleteUnitMeasure = async (unitMeasureId) => {
    try {
        const res = await api.delete(`/UnitMeasure/Delete/${unitMeasureId}`);
        console.log("UnitMeasure delete API response:", res.data);
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
        console.log("Sending update request:", body);
        console.log("Data types:", {
            name: typeof body.name,
            description: typeof body.description,
            unitMeasureId: typeof body.unitMeasureId,
            status: typeof body.status
        });

        const res = await api.put("/UnitMeasure/Update", body);
        console.log("UnitMeasure update API response:", res.data);
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

