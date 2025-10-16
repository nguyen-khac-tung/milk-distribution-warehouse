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

// Create user
export const createUser = async (userData) => {
    try {
        const body = {
            email: userData.email,
            fullName: userData.fullName,
            doB: userData.doB,
            gender: userData.gender,
            phone: userData.phone,
            address: userData.address,
            roleId: userData.roleId
        };

        console.log("Create User API - Request body sent:", body);
        
        const res = await api.post("/User/CreateUser", body);
        console.log("Create User API - Response received:", res.data);

        // Return the response data directly
        return res.data;
    } catch (error) {
        console.error("Error creating user:", error);
        
        // Return error response in the same format as success
        return {
            success: false,
            status: 500,
            message: error?.response?.data?.message || "Failed to create user",
            data: null
        };
    }
};

// Get user detail
export const getUserDetail = async (userId) => {
    try {
        console.log("Get User Detail API - User ID:", userId);
        
        const res = await api.get(`/User/GetUserDetail/${userId}`);
        console.log("Get User Detail API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error fetching user detail:", error);
        return {
            success: false,
            status: 500,
            message: "Failed to fetch user detail",
            data: null
        };
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

