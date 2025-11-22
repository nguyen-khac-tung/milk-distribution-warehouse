import { baseApi } from "./axiosConfig";
import { refreshAccessToken } from "./AuthenticationServices";

const api = baseApi;

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Biến để tránh gọi refresh token nhiều lần đồng thời
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Kiểm tra nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Nếu đang refresh token, thêm request vào queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Thử làm mới token
                const newToken = await refreshAccessToken();

                // Cập nhật header với token mới
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Xử lý queue
                processQueue(null, newToken);

                // Retry request gốc với token mới
                return api(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);

                // Lỗi token: 400 (refresh token hết hạn), 401 (unauthorized), 403 (forbidden)
                const isTokenError = refreshError.response?.status === 400 ||
                    refreshError.response?.status === 401 ||
                    refreshError.response?.status === 403;

                if (isTokenError) {
                    // Token không hợp lệ, đăng xuất user
                    processQueue(refreshError, null);

                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("userInfo");

                    window.location.href = "/login";
                } else {
                    // Lỗi network tạm thời, reject request nhưng không đăng xuất
                    processQueue(refreshError, null);
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        console.error("API error:", error);
        throw error;
    }
);

export default api;
