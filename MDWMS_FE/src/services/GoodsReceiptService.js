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

// Từ chối danh sách bản ghi (nhiều records cùng lúc)
export const rejectGoodsReceiptNoteDetailList = async (rejectList) => {
    try {
        // rejectList là mảng các object có format: [{ goodsReceiptNoteDetailId: string, rejectionReason: string }, ...]
        const res = await api.put('/GoodsReceiptNoteDetail/RejectRecordList', rejectList);
        return res.data;
    } catch (error) {
        console.error('Error rejecting goods receipt note detail list:', error);
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

// Lấy danh sách pallet theo Goods Receipt Note ID
export const getGoodRNDPallet = async (grnId) => {
    try {
        const res = await api.get(`/GoodsReceiptNoteDetail/GoodRNDPallet/${grnId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching goods receipt note pallet:', error);
        throw error;
    }
};

// Lấy danh sách pallet theo Goods Receipt Note ID (từ Pallet service)
export const getPalletByGRNID = async (grnid) => {
    try {
        const res = await api.get(`/Pallet/GetPalletByGRNID?grnid=${grnid}`);
        return res.data;
    } catch (error) {
        // Không log lỗi 400/404 vì đây là trường hợp bình thường khi chưa có pallet
        if (error?.response?.status !== 400 && error?.response?.status !== 404) {
            console.error('Error fetching pallet by GRN ID:', error);
        }
        throw error;
    }
};

// Lấy danh sách vị trí gợi ý cho pallet
export const getLocationSuggest = async (palletId) => {
    try {
        const res = await api.get(`/Location/LocationSuggest?palletId=${palletId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching location suggestions:', error);
        throw error;
    }
};



