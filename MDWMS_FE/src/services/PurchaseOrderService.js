import api from "./api";

// Lấy danh sách Purchase Order cho Sales Managers
export const getPurchaseOrderSaleManagers = async (searchParams = {}) => {
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

        const res = await api.post("/PurchaseOrder/GetPurchaseOrderSaleManagers", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching purchase orders for sales managers:", error);
        return { data: [], totalCount: 0 };
    }
};

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

// Lấy danh sách Purchase Order cho Warehouse Managers
export const getPurchaseOrderWarehouseManagers = async (searchParams = {}) => {
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

        const res = await api.post("/PurchaseOrder/GetPurchaseOrderWarehouseManagers", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching purchase orders for warehouse managers:", error);
        return { data: [], totalCount: 0 };
    }
};

// Lấy danh sách Purchase Order cho Warehouse Staff
export const getPurchaseOrderWarehouseStaff = async (searchParams = {}) => {
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

        const res = await api.post("/PurchaseOrder/GetPurchaseOrderWarehouseStaff", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching purchase orders for warehouse staff:", error);
        return { data: [], totalCount: 0 };
    }
};

// Tạo Purchase Order
export const createPurchaseOrder = async (data) => {
    try {
        const res = await api.post("/PurchaseOrder/CreatePurchaseOrder", data);
        return res.data;
    } catch (error) {
        console.error("Error creating purchase order:", error);
        throw error;
    }
};

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


// Lấy chi tiết Purchase Order
export const getPurchaseOrderDetail = async (id) => {
    try {
        const res = await api.get(`/PurchaseOrder/GetPurchaseOrder/${id}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching purchase order detail:", error);
        throw error;
    }
};

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

// Lấy danh sách hàng hóa theo nhà cung cấp
export const getGoodsDropDownBySupplierId = async (supplierId) => {
    try {
        const res = await api.get(`/Goods/GetGoodsDropDownBySupplierId/${supplierId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching goods by supplier:", error);
        throw error;
    }
};

// Xóa đơn nhập hàng
export const deletePurchaseOrder = async (purchaseOrderId) => {
    try {
        const res = await api.delete(`/PurchaseOrder/DeletePurchaseOrder/${purchaseOrderId}`);
        return res.data;
    } catch (error) {
        console.error("Error deleting purchase order:", error);
        throw error;
    }
};

// Cập nhật đơn nhập hàng
export const updatePurchaseOrder = async (updateData) => {
    try {
        const res = await api.put('/PurchaseOrder/UpdatePurchaseOrder', updateData);
        return res.data;
    } catch (error) {
        console.error("Error updating purchase order:", error);
        throw error;
    }
};

// Lấy đơn nháp theo nhà cung cấp
export const getDraftPurchaseOrdersBySupplier = async (supplierId) => {
    try {
        const body = {
            pageNumber: 1,
            pageSize: 100,
            search: "",
            sortField: "",
            sortAscending: true,
            filters: {
                status: 1, // Draft status
                supplierId: supplierId
            }
        };

        const res = await api.post("/PurchaseOrder/GetPurchaseOrderSaleManagers", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching draft purchase orders by supplier:", error);
        return { data: [], totalCount: 0 };
    }
};

