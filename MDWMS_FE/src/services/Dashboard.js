import api from "./api";

// Lấy báo cáo tồn kho
export const getInventoryReport = async () => {
    try {
        const res = await api.get("/Report/InventoryReport");
        return res?.data?.data ?? res?.data;
    } catch (error) {
        console.error("Error fetching inventory report:", error);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
        }
        throw error;
    }
};