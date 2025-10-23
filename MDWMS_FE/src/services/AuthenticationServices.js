import api from "./api";
import { refreshApi } from "./axiosConfig";

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

            console.log("isFirstLogin:", userData.isFirstLogin);

            if (userData.isFirstLogin === true) {
                localStorage.setItem("tempUserId", userData.userId.toString());
                return {
                    success: true,
                    message: "Lần đầu đăng nhập, vui lòng đổi mật khẩu",
                    data: userData,
                    isFirstLogin: true,
                    redirectTo: "/change-password"
                };
            }

            // Chỉ lưu token và thông tin người dùng khi isFirstLogin = false
            if (userData.isFirstLogin === false) {
                console.log("Normal login - saving tokens to localStorage");
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
                console.log("localStorage after saving:", {
                    accessToken: localStorage.getItem("accessToken"),
                    refreshToken: localStorage.getItem("refreshToken"),
                    userInfo: localStorage.getItem("userInfo")
                });
            }

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

        if (error.response) {
            return {
                success: false,
                message: error.response.data?.message || "Đăng nhập thất bại",
                status: error.response.status
            };
        }

        return {
            success: false,
            message: "Vui lòng kiểm tra lại kết nối.",
            status: 0
        };
    }
};

// Làm mới access token
export const refreshAccessToken = async () => {
    try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Không tìm thấy refresh token.");

        const res = await refreshApi.post("/Authentication/RefreshToken", {
            token: refreshToken,
        });

        console.log("Refresh Token API response:", res.data);

        if (res.data?.success && res.data?.data?.token) {
            const newAccessToken = res.data.data.token;
            localStorage.setItem("accessToken", newAccessToken);
            return newAccessToken;
        } else {
            throw new Error("Không thể làm mới token.");
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Kiểm tra và làm mới token nếu cần (sử dụng lại logic interceptor)
export const validateAndRefreshToken = async () => {
    try {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        // Nếu không có token nào
        if (!accessToken && !refreshToken) {
            return false;
        }

        // Nếu có accessToken, kiểm tra xem có hết hạn không
        if (accessToken) {
            try {
                // Decode JWT để kiểm tra expiry
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                const currentTime = Math.floor(Date.now() / 1000);

                // Nếu token chưa hết hạn, return true
                if (payload.exp > currentTime) {
                    return true;
                }
            } catch (error) {
                console.log("Access token invalid, trying to refresh...");
            }
        }

        // Nếu accessToken hết hạn hoặc không có, thử refresh
        if (refreshToken) {
            try {
                console.log("Attempting to refresh token...");
                const newToken = await refreshAccessToken();
                console.log("Token refreshed successfully");
                return true;
            } catch (error) {
                console.error("Token refresh failed:", error);
                // Xóa tất cả token nếu refresh thất bại
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userInfo");
                return false;
            }
        }

        return false;
    } catch (error) {
        console.error("Token validation error:", error);
        return false;
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
        const response = await api.put("/Authentication/ResetPassword", {
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