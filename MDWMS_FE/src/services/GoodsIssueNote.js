import api from "./api";

// Tạo mới phiếu xuất kho theo salesOrderId
export const createGoodsIssueNote = async (data) => {
    try {
        const body = {
            salesOrderId: data.salesOrderId,
        };

        const res = await api.post("/GoodsIssueNote/CreateGoodsIssueNote", body);
        console.log("createGoodsIssueNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating goods issue note:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Lấy chi tiết phiếu xuất kho theo goodsIssueNoteId
export const getDetailGoodsIssueNote = async (goodsIssueNoteId) => {
    try {
        if (!goodsIssueNoteId) {
            throw new Error("Thiếu goodsIssueNoteId");
        }

        const res = await api.get(`/GoodsIssueNote/GetDetailGoodsIssueNote/${goodsIssueNoteId}`);
        console.log("getDetailGoodsIssueNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching goods issue note detail:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};
