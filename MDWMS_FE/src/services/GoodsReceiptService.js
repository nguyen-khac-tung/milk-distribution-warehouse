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

export const verifyRecord = async ({ goodsReceiptNoteDetailId, deliveredPackageQuantity, rejectPackageQuantity, note }) => {
    try {
        const body = {
            goodsReceiptNoteDetailId,
            deliveredPackageQuantity,
            rejectPackageQuantity,
            note
        };
        const res = await api.put('/GoodsReceiptNoteDetail/VerifyRecord', body);
        return res.data;
    } catch (error) {
        console.error('Error verifying record:', error);
        throw error;
    }
};

export const cancelGoodsReceiptNoteDetail = async (goodsReceiptNoteDetailId) => {
    try {
        const body = { goodsReceiptNoteDetailId };
        const res = await api.put('/GoodsReceiptNoteDetail/CancelRecord', body);
        return res.data;
    } catch (error) {
        console.error('Error cancelling goods receipt note detail:', error);
        throw error;
    }
};

export const submitGoodsReceiptNote = async (goodsReceiptNoteId) => {
    try {
        const body = { goodsReceiptNoteId };
        const res = await api.put('/GoodsReceiptNote/Submit', body);
        return res.data;
    } catch (error) {
        console.error('Error submitting goods receipt note:', error);
        throw error;
    }
};

export const rejectGoodsReceiptNoteDetail = async ({ goodsReceiptNoteDetailId, rejectionReason }) => {
    try {
        const body = { goodsReceiptNoteDetailId, rejectionReason };
        const res = await api.put('/GoodsReceiptNoteDetail/RejectRecord', body);
        return res.data;
    } catch (error) {
        console.error('Error rejecting goods receipt note detail:', error);
        throw error;
    }
};

export const approveGoodsReceiptNote = async (goodsReceiptNoteId) => {
    try {
        const body = { goodsReceiptNoteId };
        const res = await api.put('/GoodsReceiptNote/Approve', body);
        return res.data;
    } catch (error) {
        console.error('Error approving goods receipt note:', error);
        throw error;
    }
};


