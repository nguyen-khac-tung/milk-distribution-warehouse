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
        return res.data;
    } catch (error) {
        console.error("Error creating category:", error);
        throw error;
    }
};

export const deleteCategory = async (categoryId) => {
    try {
        const res = await api.delete(`/Category/Delete/${categoryId}`);
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
        const res = await api.put("/Category/Update", body);
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

export const updateCategoryStatus = async (data) => {
    try {
        const body = {
            categoryId: data.categoryId,
            status: data.status
        };

        const res = await api.put("/Category/UpdateStatus", body);
        return res.data;
    } catch (error) {
        console.error("Error updating category status:", error);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        throw error;
    }
};

// Get categories for dropdown
export const getCategoriesDropdown = async () => {
    try {
        const res = await api.get("/Category/GetCategoriesDropDown");
        return res.data;
    } catch (error) {
        console.error("Error fetching categories dropdown:", error);
        return { status: 500, message: "Error fetching categories", data: [] };
    }
};

