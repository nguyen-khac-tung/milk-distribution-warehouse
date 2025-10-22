import api from "./api";

// Lấy danh sách Purchase Order cho Sales Representative
export const getPurchaseOrderSaleRepresentatives = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.status && { status: searchParams.status }),
                ...(searchParams.supplierId && { supplierId: searchParams.supplierId }),
                ...(searchParams.approvalBy && { approvalBy: searchParams.approvalBy }),
                ...(searchParams.createdBy && { createdBy: searchParams.createdBy }),
                ...(searchParams.arrivalConfirmedBy && { arrivalConfirmedBy: searchParams.arrivalConfirmedBy }),
                ...(searchParams.assignTo && { assignTo: searchParams.assignTo }),
                ...(searchParams.fromDate && { fromDate: searchParams.fromDate }),
                ...(searchParams.toDate && { toDate: searchParams.toDate })
            }
        };
        const res = await api.post("/PurchaseOrder/GetPurchaseOrderSaleRepresentatives", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching retailers:", error);
        return { data: [], totalCount: 0 };
    }
};

// // Tạo Purchase Order
// export const createPurchaseOrder = async (data) => {
//     try {
//         const res = await api.post("/PurchaseOrder/Create", data);
//         return res.data;
//     } catch (error) {
//         console.error("Error creating purchase order:", error);
//         throw error;
//     }
// };

// // Cập nhật Purchase Order
// export const updatePurchaseOrder = async (id, data) => {
//     try {
//         const res = await api.put(`/PurchaseOrder/Update/${id}`, data);
//         return res.data;
//     } catch (error) {
//         console.error("Error updating purchase order:", error);
//         throw error;
//     }
// };

// // Xóa Purchase Order
// export const deletePurchaseOrder = async (id) => {
//     try {
//         const res = await api.delete(`/PurchaseOrder/Delete/${id}`);
//         return res.data;
//     } catch (error) {
//         console.error("Error deleting purchase order:", error);
//         throw error;
//     }
// };

// // Lấy chi tiết Purchase Order
// export const getPurchaseOrderDetail = async (id) => {
//     try {
//         const res = await api.get(`/PurchaseOrder/GetById/${id}`);
//         return res.data;
//     } catch (error) {
//         console.error("Error fetching purchase order detail:", error);
//         throw error;
//     }
// };

// // Submit request
// export const submitPurchaseOrderRequest = async (id) => {
//     try {
//         const res = await api.post(`/PurchaseOrder/SubmitRequest/${id}`);
//         return res.data;
//     } catch (error) {
//         console.error("Error submitting purchase order request:", error);
//         throw error;
//     }
// };

// // Approval request
// export const approvalPurchaseOrderRequest = async (id, data) => {
//     try {
//         const res = await api.post(`/PurchaseOrder/ApprovalRequest/${id}`, data);
//         return res.data;
//     } catch (error) {
//         console.error("Error approval purchase order request:", error);
//         throw error;
//     }
// };

// // Confirm delivery
// export const confirmPurchaseOrderDelivery = async (id) => {
//     try {
//         const res = await api.post(`/PurchaseOrder/ConfirmDelivery/${id}`);
//         return res.data;
//     } catch (error) {
//         console.error("Error confirming purchase order delivery:", error);
//         throw error;
//     }
// };

// // Assign receiving
// export const assignPurchaseOrderReceiving = async (id, data) => {
//     try {
//         const res = await api.post(`/PurchaseOrder/AssignReceiving/${id}`, data);
//         return res.data;
//     } catch (error) {
//         console.error("Error assigning purchase order receiving:", error);
//         throw error;
//     }
// };

