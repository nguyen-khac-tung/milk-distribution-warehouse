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
                ...(searchParams.batchId && { batchId: searchParams.batchId }),
                ...(searchParams.locationId && { locationId: searchParams.locationId }),
                ...(searchParams.createBy && { createBy: searchParams.createBy }),
                ...(searchParams.fromDate && { fromDate: searchParams.fromDate }),
                ...(searchParams.toDate && { toDate: searchParams.toDate })
            }
        };

        const res = await api.post("/Pallet/Pallets", body);
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
    console.log("updatePalletStatus called with:", { palletId, status });

    // Validate palletId is a valid UUID
    if (!palletId) {
        throw new Error('palletId is required');
    }

    if (typeof palletId !== 'string') {
        throw new Error(`Invalid palletId type: ${typeof palletId}, expected string`);
    }

    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(palletId)) {
        throw new Error(`Invalid palletId format: ${palletId}, expected UUID`);
    }

    const body = {
        palletId: palletId,
        status: parseInt(status)
    };

    try {
        ;
        return { success: true, message: "Status updated successfully (simulated)" };
    } catch (error) {
        console.error("Error updating pallet status:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Request body was:", body);
        throw error;
    }
};

