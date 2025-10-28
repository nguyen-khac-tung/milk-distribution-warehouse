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
                ...(searchParams.createdAt && { createdAt: searchParams.createdAt })
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
                ...(searchParams.createdAt && { createdAt: searchParams.createdAt })
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
                ...(searchParams.createdAt && { createdAt: searchParams.createdAt })
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
                ...(searchParams.createdAt && { createdAt: searchParams.createdAt })
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
        const res = await api.get(`/PurchaseOrder/GetPurchaseOrderBySupplierId/${supplierId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching draft purchase orders by supplier:", error);
        return { data: [] };
    }
};

// Lấy danh sách đóng gói hàng hóa theo ID hàng hóa
export const getGoodsPackingByGoodsId = async (goodsId) => {
    try {
        const res = await api.get(`/GoodsPacking/GetGoodsPackingByGoodsId/${goodsId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching goods packing by goods ID:", error);
        throw error;
    }
};

// Submit Purchase Order
export const submitPurchaseOrder = async (purchaseOrderId, status, note) => {
    try {
        const data = {
            purchaseOrderId: purchaseOrderId,
            status: status,
            note: note
        };
        
        const res = await api.put('/PurchaseOrder/SubmitPerchaseOrder', data);
        return res.data;
    } catch (error) {
        console.error("Error submitting purchase order:", error);
        throw error;
    }
};


