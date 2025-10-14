import api from "../api";

export const getCategory = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: searchParams.status ? { status: searchParams.status } : {}
        };


        const res = await api.post("/Category/Categories", body);
        console.log("Category API response:", res.data);
        console.log("Search params received:", searchParams);

        return res.data;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return { data: [], totalCount: 0 };
    }
};


export const createCategory = async (data) => {
    try {
        const body = {
            categoryName: data.categoryName,
            description: data.description
        };
        const res = await api.post("/Category/Create", body);
        console.log("Category API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating category:", error);
        throw error;
    }
};

export const deleteCategory = async (categoryId) => {
    try {
        const res = await api.delete(`/Category/Delete/${categoryId}`);
        console.log("Category delete API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
};

export const updateCategory = async (data) => {
    const body = {
        categoryName: data.categoryName,
        description: data.description,
        categoryId: data.categoryId,
        status: data.status
    };

    try {
        console.log("Sending update request:", body);
        console.log("Data types:", {
            categoryName: typeof body.categoryName,
            description: typeof body.description,
            categoryId: typeof body.categoryId,
            status: typeof body.status
        });

        const res = await api.put("/Category/Update", body);
        console.log("Category update API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating category:", error);
        console.error("Request body was:", body);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        throw error;
    }
};

