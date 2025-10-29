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

// Bắt đầu quá trình nhận hàng
export const startReceive = async (purchaseOrderId) => {
    try {
        const data = {
            purchaseOrderId: purchaseOrderId
        };
        
        const res = await api.post('/GoodsReceiptNote/StartReceive', data);
        return res.data;
    } catch (error) {
        console.error("Error starting receive process:", error);
        throw error;
    }
};



// // Hoàn thành kiểm nhập
// export const completeReceiving = async (goodsReceiptNoteId, note = "") => {
//     try {
//         const data = {
//             goodsReceiptNoteId: goodsReceiptNoteId,
//             note: note
//         };

//         const res = await api.put('/GoodsReceiptNote/CompleteReceiving', data);
//         return res.data;
//     } catch (error) {
//         console.error("Error completing receiving:", error);
//         throw error;
//     }
// };

// // Hoàn thành sắp xếp
// export const completeArranging = async (goodsReceiptNoteId, note = "") => {
//     try {
//         const data = {
//             goodsReceiptNoteId: goodsReceiptNoteId,
//             note: note
//         };

//         const res = await api.put('/GoodsReceiptNote/CompleteArranging', data);
//         return res.data;
//     } catch (error) {
//         console.error("Error completing arranging:", error);
//         throw error;
//     }
// };
