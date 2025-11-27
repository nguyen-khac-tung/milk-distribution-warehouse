import { getFileNameFromHeader } from "../utils/Validation";
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

// Lấy chi tiết phiếu xuất kho theo Sales Order ID
export const getDetailGoodsIssueNote = async (salesOrderId) => {
    try {
        const res = await api.get(`/GoodsIssueNote/GetDetailGoodsIssueNote/${salesOrderId}`);
        console.log("getDetailGoodsIssueNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching Goods Issue Note detail:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Gửi phiếu xuất kho (Submit)
export const submitGoodsIssueNote = async (goodsIssueNoteId) => {
    try {
        const res = await api.put(`/GoodsIssueNote/SubmitGoodsIssueNote`, {
            goodsIssueNoteId,
        });
        console.log("submitGoodsIssueNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error submitting Goods Issue Note:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Duyệt phiếu xuất kho
export const approveGoodsIssueNote = async (goodsIssueNoteId) => {
    try {
        const res = await api.put(`/GoodsIssueNote/ApproveGoodsIssueNote`, {
            goodsIssueNoteId,
        });
        console.log("approveGoodsIssueNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error approving Goods Issue Note:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Re-pick lại một chi tiết phiếu xuất kho
export const rePickGoodsIssueNoteDetail = async (data) => {
    try {
        const res = await api.put(`/GoodsIssueNoteDetail/RePickGoodsIssueNoteDetail`, data);
        console.log("rePickGoodsIssueNoteDetail:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error re-picking goods issue note detail:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Re-pick danh sách chi tiết phiếu xuất kho (dành cho quản lý kho)
export const rePickGoodsIssueNoteDetailList = async (items) => {
    try {
        const res = await api.put(`/GoodsIssueNoteDetail/RePickGoodsIssueNoteDetailList`, items);
        console.log("rePickGoodsIssueNoteDetailList:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error re-picking goods issue note detail list:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Xuất phiếu xuất kho ra file Word
export const exportGoodsIssueNoteWord = async (salesOrderId) => {
    try {
        const response = await api.get(
            `/GoodsIssueNote/ExportGoodsIssueNoteWord/${salesOrderId}`,
            { responseType: "blob" }
        );

        const cd = response.headers["content-disposition"];
        const fileName = getFileNameFromHeader(cd) || `phieu-xuat-kho.docx`;

        return { file: response.data, fileName };
    } catch (error) {

        // đọc lỗi từ blob (ApiResponse)
        if (error.response?.data instanceof Blob) {
            const text = await error.response.data.text();
            try {
                const parsed = JSON.parse(text);
                if (parsed?.message) throw new Error(parsed.message);
            } catch { }
        }

        throw error;
    }
};
