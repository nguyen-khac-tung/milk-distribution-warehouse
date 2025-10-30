import api from "./api";

// Lấy phiếu nhập kho theo Purchase Order ID
export const getGoodsReceiptNoteByPurchaseOrderId = async (purchaseOrderId) => {
    try {
        const res = await api.get(`/GoodsReceiptNote/GetGRNByPurchaseOrderId/${purchaseOrderId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching goods receipt note by purchase order ID:", error);
        throw error;
    }
};

export const confirmInspection = async (payload) => {
    try {
        const res = await api.put('/GoodsReceiptNoteDetail/ConfirmInspection', payload);
        return res.data;
    } catch (error) {
        console.error('Error confirming inspection:', error);
        throw error;
    }
};


