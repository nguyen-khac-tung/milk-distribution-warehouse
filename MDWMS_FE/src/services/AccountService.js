import api from "./api";

export const getUserList = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: searchParams.filters || {}
        };

        console.log("User API - Search params received:", searchParams);
        console.log("User API - Request body sent:", body);
        
        const res = await api.post("/User/GetUserList", body);
        console.log("User API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error fetching user list:", error);
        return { data: [], totalCount: 0 };
    }
};

