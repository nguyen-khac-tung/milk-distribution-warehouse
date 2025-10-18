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

// Update user
export const updateUser = async (userData) => {
    try {
        const body = {
            email: userData.email,
            fullName: userData.fullName,
            doB: userData.doB,
            gender: userData.gender,
            phone: userData.phone,
            address: userData.address,
            roleId: userData.roleId,
            userId: userData.userId
        };

        console.log("Update User API - Request body sent:", body);

        const res = await api.put("/User/UpdateUser", body);
        console.log("Update User API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error updating user:", error);
        return {
            success: false,
            status: 500,
            message: error?.response?.data?.message || "Failed to update user",
            data: null
        };
    }
};

// Update password
export const updatePassword = async (passwordData) => {
    try {
        const body = {
            oldPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
            confirmNewPassword: passwordData.confirmPassword
        };

        console.log("Update Password API - Request body sent:", { ...body, oldPassword: "***", newPassword: "***", confirmNewPassword: "***" });

        const res = await api.put("/Authentication/ChangePassword", body);
        console.log("Update Password API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error updating password:", error);
        return {
            success: false,
            status: 500,
            message: error?.response?.data?.message || "Failed to update password",
            data: null
        };
    }
};

// Delete user
export const deleteUser = async (userId) => {
    try {
        console.log("Delete User API - User ID:", userId);

        const res = await api.delete(`/User/DeleteUser/${userId}`);
        console.log("Delete User API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error deleting user:", error);
        return {
            success: false,
            status: 500,
            message: error?.response?.data?.message || "Failed to delete user",
            data: null
        };
    }
};

// Get user profile
export const getUserProfile = async () => {
    try {
        console.log("Get User Profile API - Fetching current user profile");

        const res = await api.get("/User/GetUserProfile");
        console.log("Get User Profile API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return {
            success: false,
            status: 500,
            message: error?.response?.data?.message || "Failed to fetch user profile",
            data: null
        };
    }
};
