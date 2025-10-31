import api from "./api";

export const getUserList = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            Search: searchParams.search || "",
            SortField: searchParams.sortField || "",
            SortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true, // Đổi thành SortAscending (uppercase)
            Filters: searchParams.filters || {} // Đổi thành Filters (uppercase)
        };

        // Console log để debug dữ liệu filter và search
        // console.log("Search params:", searchParams);
        // console.log("Search term:", body.Search);
        // console.log("Filters:", body.Filters);
        // console.log("Request body:", body);
        // console.log("Request body JSON:", JSON.stringify(body, null, 2));

        const res = await api.post("/User/GetUserList", body);

        return res.data;
    } catch (error) {
        // Xử lý trường hợp backend trả về 400 khi danh sách trống
        if (error.response?.status === 400 &&
            error.response?.data?.message?.includes("Danh sách người dùng trống")) {
            // console.log("Backend trả về danh sách trống - đây là bình thường");
            return { data: [], totalCount: 0 };
        }

        // Chỉ log error thực sự
        // console.error("Error fetching user list:", error);
        // console.error("Error response:", error.response?.data);
        // console.error("Error status:", error.response?.status);
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


        const res = await api.post("/User/CreateUser", body);
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
            userId: passwordData.userId || 0,
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

// Get user dropdown by role name
export const getUserDropDownByRoleName = async (roleName) => {
    try {
        const res = await api.get(`/User/GetUserDropDownByRoleName/${roleName}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching user dropdown by role name:", error);
        return {
            success: false,
            status: 500,
            message: error?.response?.data?.message || "Failed to fetch user dropdown by role name",
            data: null
        };
    }
};

export const getUserDropDown = async () => {
    try {
        const res = await api.get(`User/GetAvailableReceiversDropDown`);
        return res.data;
    } catch (error) {
        console.error("Error fetching user dropdown by role name:", error);
        return {
            success: false,
            status: 500,
            message: error?.response?.data?.message || "Failed to fetch user dropdown by role name",
            data: null
        };
    }
};

// Lấy danh sách Picker khả dụng theo SalesOrderId
export const getAvailablePickersDropdown = async (salesOrderId) => {
    try {
        if (!salesOrderId) {
            throw new Error("Thiếu salesOrderId");
        }

        const res = await api.get(`/User/GetAvailablePickersDropDown/${salesOrderId}`);
        console.log("getAvailablePickersDropdown:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching available pickers:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};
