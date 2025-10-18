import axios from "axios";
import { refreshAccessToken } from "./AuthenticationServices";

const api = axios.create({
    baseURL: "https://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Kiểm tra nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Thử làm mới token
                const newToken = await refreshAccessToken();

                // Cập nhật header với token mới
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Retry request gốc với token mới
                return api(originalRequest);
            } catch (refreshError) {
                // Nếu refresh token cũng thất bại, đăng xuất user
                console.error("Token refresh failed:", refreshError);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userInfo");

                // Redirect về trang login
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        console.error("API error:", error);
        throw error;
    }
);

export default api;
