//lấy danh sách pallet
import api from "./api";

// Lấy danh sách Pallet
export const getPallets = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.status && { status: searchParams.status }),
                ...(searchParams.purchaseOrderId && { purchaseOrderId: searchParams.purchaseOrderId }),
                ...(searchParams.creatorId && searchParams.creatorId !== "" && { createBy: searchParams.creatorId }),
            }
        };
        console.log("PalletService - Request body:", body);
        const res = await api.post("/Pallet/Pallets", body);
        console.log("PalletService - Response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching pallets:", error);
        return { data: { items: [] }, totalCount: 0 };
    }
};

// Lấy chi tiết kệ kê hàng
export const getPalletDetail = async (palletId) => {
    try {
        const res = await api.get(`/Pallet/PalletDetail/${palletId}`);
        return res.data;
    } catch (error) {
        console.error("Error getting pallet detail:", error);
        throw error;
    }
};

// Cập nhật trạng thái kệ kê hàng
export const updatePalletStatus = async (palletId, status) => {
    // Validate palletId
    if (!palletId) {
        throw new Error('palletId is required');
    }

    if (typeof palletId !== 'string') {
        throw new Error(`Invalid palletId type: ${typeof palletId}, expected string`);
    }

    const body = {
        palletId: palletId,
        status: parseInt(status)
    };

    try {
        const res = await api.put('/Pallet/UpdateStatus', body);
        return res.data;
    } catch (error) {
        console.error("Error updating pallet status:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Request body was:", body);
        throw error;
    }
};

// Xóa kệ kê hàng
export const deletePallet = async (palletId) => {
    // Validate palletId
    if (!palletId) {
        throw new Error('palletId is required');
    }

    if (typeof palletId !== 'string') {
        throw new Error(`Invalid palletId type: ${typeof palletId}, expected string`);
    }

    try {
        const res = await api.delete(`/Pallet/Delete/${palletId}`);
        return res.data;
    } catch (error) {
        console.error("Error deleting pallet:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        throw error;
    }
};

// Tạo kệ kê hàng
export const createPallet = async (palletData) => {
    const body = {
        batchId: palletData.batchId,
        locationId: parseInt(palletData.locationId),
        packageQuantity: parseInt(palletData.packageQuantity),
        goodsPackingId: parseInt(palletData.goodsPackingId),
        goodsReceiptNoteId: palletData.goodsReceiptNoteId
    };

    try {
        const res = await api.post('/Pallet/Create', body);
        return res.data;
    } catch (error) {
        console.error("Error creating pallet:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Request body was:", body);
        throw error;
    }
};

// Cập nhật kệ kê hàng
export const updatePallet = async (palletId, palletData) => {
    // Validate palletId
    if (!palletId) {
        throw new Error('palletId is required');
    }

    if (typeof palletId !== 'string') {
        throw new Error(`Invalid palletId type: ${typeof palletId}, expected string`);
    }

    const body = {
        batchId: palletData.batchId,
        locationId: parseInt(palletData.locationId),
        packageQuantity: parseInt(palletData.packageQuantity),
        goodsPackingId: parseInt(palletData.goodsPackingId),
        goodsReceiptNoteId: palletData.goodsReceiptNoteId
    };

    try {
        const res = await api.put(`/Pallet/Update/${palletId}`, body);
        return res.data;
    } catch (error) {
        console.error("Error updating pallet:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Request body was:", body);
        throw error;
    }
};

// Tạo nhiều kệ kê hàng cùng lúc
export const createPalletsBulk = async (pallets = []) => {
    // Chuẩn hóa body theo API backend
    const body = {
        pallets: (pallets || []).map(p => ({
            batchId: p.batchId,
            locationId: p.locationId != null ? parseInt(p.locationId) : null,
            packageQuantity: parseInt(p.packageQuantity),
            goodsPackingId: parseInt(p.goodsPackingId),
            goodsReceiptNoteId: p.goodsReceiptNoteId
        }))
    };

    try {
        const res = await api.post('/Pallet/CreateBulk', body);
        return res.data;
    } catch (error) {
        console.error('Error creating pallets in bulk:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Request body was:', body);
        throw error;
    }
};
