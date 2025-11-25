import axios from "axios";

// Base axios instance cho tất cả API calls
export const baseApi = axios.create({
    baseURL: "https://api.khophanphoisua.id.vn/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Axios instance riêng cho refresh token để tránh circular dependency
export const refreshApi = axios.create({
    baseURL: "https://api.khophanphoisua.id.vn/api",
    headers: {
        "Content-Type": "application/json",
    },
});
