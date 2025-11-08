import api from "./api";

// Lấy chi tiết Pick Allocation theo ID
export const getPickAllocationDetail = async (id) => {
    try {
        const res = await api.get(`/PickAllocation/GetPickAllocationDetail/${id}`);
        console.log("getPickAllocationDetail:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching Pick Allocation detail:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Xác nhận Pick Allocation
export const confirmPickAllocation = async (data) => {
    try {
        const res = await api.put(`/PickAllocation/ConfirmPickAllocation`, data);
        console.log("confirmPickAllocation:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error confirming Pick Allocation:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};
