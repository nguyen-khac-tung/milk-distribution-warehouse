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

// Update user status
export const updateUserStatus = async (userId, status) => {
    try {
        const body = {
            userId: userId,
            status: status
        };

        console.log("Update User Status API - Request body sent:", body);
        
        const res = await api.put("/User/UpdateUserStatus", body);
        console.log("Update User Status API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error updating user status:", error);
        return {
            status: 500,
            message: "Failed to update user status",
            data: null
        };
    }
};

