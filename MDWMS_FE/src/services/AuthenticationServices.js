import api from "./api";

// Đăng nhập
export const login = async (data) => {
    try {
        const body = {
            email: data.email,
            password: data.password,
        };

        const res = await api.post("/Authentication/Login", body);
        console.log("Login API response:", res.data);

        if (res.data?.success && res.data?.data) {
            const userData = res.data.data;

            // 🔹 Lưu token và thông tin người dùng
            localStorage.setItem("accessToken", userData.jwtToken);
            localStorage.setItem("refreshToken", userData.refreshToken);
            localStorage.setItem(
                "userInfo",
                JSON.stringify({
                    userId: userData.userId,
                    email: userData.email,
                    fullName: userData.fullName,
                    roles: userData.roles,
                })
            );

            return {
                success: true,
                message: res.data.message || "Đăng nhập thành công",
                data: userData,
            };
        } else {
            return {
                success: false,
                message: res.data?.message || "Đăng nhập thất bại",
            };
        }
    } catch (error) {
        console.error("Error during login:", error);
        return {
            success: false,
            message:
                error.response?.data?.message ||
                "Lỗi hệ thống, vui lòng thử lại.",
        };
    }
};

// Làm mới access token
export const refreshAccessToken = async () => {
    try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Không tìm thấy refresh token.");

        const res = await api.post("/Authentication/RefreshToken", {
            refreshToken,
        });

        console.log("Refresh Token API response:", res.data);

        if (res.data?.success && res.data?.data?.jwtToken) {
            const newAccessToken = res.data.data.jwtToken;
            localStorage.setItem("accessToken", newAccessToken);
            return newAccessToken;
        } else {
            throw new Error("Không thể làm mới token.");
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
    }
};

// Đăng xuất
export const logout = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        await api.get("/Authentication/Logout", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        console.warn("Logout API failed, vẫn xóa localStorage.", error);
    } finally {
        // Dù có lỗi vẫn xóa dữ liệu cục bộ
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");
    }
};

// Gửi yêu cầu quên mật khẩu
export const forgotPassword = async (email) => {
    try {
        const response = await api.post("/Authentication/ForgotPassword", { email });
        return response.data;
    } catch (error) {
        console.error("Forgot Password API failed:", error);
        if (error.response && error.response.data && error.response.data.message) {
            // Trả lại message lỗi từ BE
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Xác minh OTP
export const verifyOtp = async (email, otpCode) => {
    try {
        const response = await api.post("/Authentication/VerifyOtp", {
            email,
            otpCode,
        });
        return response.data;
    } catch (error) {
        console.error("Verify OTP API failed:", error);
        const message =
            error.response?.data?.message?.replace(/^\[.*?\]\s*/, "") ||
            "Xác minh OTP thất bại. Vui lòng thử lại!";
        throw new Error(message);
    }
};

// Đặt lại mật khẩu
export const resetPassword = async ({ email, newPassword, confirmNewPassword }) => {
    try {
        const response = await api.post("/Authentication/ResetPassword", {
            email,
            newPassword,
            confirmNewPassword,
        });
        return response.data;
    } catch (error) {
        console.error("Reset Password API failed:", error);
        const message =
            error.response?.data?.message?.replace(/^\[.*?\]\s*/, "") ||
            "Không thể đặt lại mật khẩu. Vui lòng thử lại!";
        throw new Error(message);
    }
};