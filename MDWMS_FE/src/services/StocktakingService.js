import api from "./api";

// Lấy danh sách Stocktaking Sheet cho Warehouse Manager
export const getStocktakingListForWarehouseManager = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.filters && { ...searchParams.filters })
            }
        };

        const res = await api.post("/StocktakingSheet/GetListForWarehouseManager", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking list for warehouse manager:", error);
        return { data: [], totalCount: 0 };
    }
};

// Lấy danh sách Stocktaking Sheet cho Warehouse Staff
export const getStocktakingListForWarehouseStaff = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.filters && { ...searchParams.filters })
            }
        };

        const res = await api.post("/StocktakingSheet/GetListForWarehouseStaff", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking list for warehouse staff:", error);
        return { data: [], totalCount: 0 };
    }
};

// Lấy danh sách Stocktaking Sheet cho Sale Manager
export const getStocktakingListForSaleManager = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: {
                ...(searchParams.filters && { ...searchParams.filters })
            }
        };

        const res = await api.post("/StocktakingSheet/GetListForSaleManager", body);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking list for sale manager:", error);
        return { data: [], totalCount: 0 };
    }
};

// Tạo phiếu kiểm kê
export const createStocktaking = async (data) => {
    try {
        const body = {
            startTime: data.startTime, // ISO string format
            note: data.note || ""
        };

        const res = await api.post("/StocktakingSheet/Create", body);
        return res.data;
    } catch (error) {
        console.error("Error creating stocktaking:", error);
        throw error;
    }
};

// Hủy phiếu kiểm kê
export const cancelStocktaking = async (stocktakingSheetId) => {
    try {
        const body = {
            stocktakingSheetId: stocktakingSheetId
        };
        const res = await api.put("/StocktakingSheet/Cancel", body);
        return res.data;
    } catch (error) {
        console.error("Error cancelling stocktaking:", error);
        throw error;
    }
};

// Xóa phiếu kiểm kê
export const deleteStocktaking = async (stocktakingSheetId) => {
    try {
        const res = await api.delete(`/StocktakingSheet/Delete/${stocktakingSheetId}`);
        return res.data;
    } catch (error) {
        console.error("Error deleting stocktaking:", error);
        throw error;
    }
};

// Lấy chi tiết phiếu kiểm kê
export const getStocktakingDetail = async (stocktakingSheetId) => {
    try {
        const res = await api.get(`/StocktakingSheet/GetDetail/${stocktakingSheetId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking detail:", error);
        throw error;
    }
};

// Cập nhật phiếu kiểm kê
export const updateStocktaking = async (data) => {
    try {
        const body = {
            stocktakingSheetId: data.stocktakingSheetId,
            startTime: data.startTime, // ISO string format
            note: data.note || ""
        };

        const res = await api.put("/StocktakingSheet/Update", body);
        return res.data;
    } catch (error) {
        console.error("Error updating stocktaking:", error);
        throw error;
    }
};

// Phân công nhân viên theo khu vực
export const assignStocktakingAreas = async (data) => {
    try {
        const body = {
            stocktakingSheetId: data.stocktakingSheetId,
            stocktakingAreaAssign: data.stocktakingAreaAssign || [] // Array of { areaId: number, assignTo: number }
        };

        const res = await api.put("/StocktakingSheet/AssignAreaConfirm", body);
        return res.data;
    } catch (error) {
        console.error("Error assigning stocktaking areas:", error);
        throw error;
    }
};

export const inProgressStocktaking = async (data) => {
    try {
        const body = {
            stocktakingSheetId: data.stocktakingSheetId
        };

        const res = await api.put("/StocktakingSheet/InProgress", body);
        return res.data;
    } catch (error) {
        console.error("Error setting stocktaking to in progress:", error);
        throw error;
    }
};



// Lấy chi tiết StocktakingArea theo stocktakingSheetId
export const getStocktakingAreaDetailBySheetId = async (stocktakingSheetId) => {
    try {
        const res = await api.get(`/StocktakingArea/GetDetailForWarehouseStaffByStocktakingSheetId/${stocktakingSheetId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking area detail:", error);
        throw error;
    }
};

// Lấy chi tiết StocktakingArea cho OtherRole theo stocktakingSheetId
export const getStocktakingAreaDetailForOtherRoleBySheetId = async (stocktakingSheetId) => {
    try {
        const res = await api.get(`/StocktakingArea/GetDetailForOtherRoleByStocktakingSheetId/${stocktakingSheetId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking area detail for other role:", error);
        throw error;
    }
};

// Phân công lại nhân viên theo khu vực
export const reAssignAreaConfirm = async (data) => {
    try {
        const body = {
            stocktakingSheetId: data.stocktakingSheetId,
            stocktakingAreaReAssign: data.stocktakingAreaReAssign || [] // Array of { areaId: number, assignTo: number }
        };

        const res = await api.put("/StocktakingSheet/ReAssignAreaConfirm", body);
        return res.data;
    } catch (error) {
        console.error("Error re-assigning stocktaking areas:", error);
        throw error;
    }
};

// Lấy chi tiết StocktakingPallet theo stocktakingLocationId
export const getStocktakingPalletDetail = async (stocktakingLocationId) => {
    try {
        const res = await api.get(`/StocktakingPallet/GetDetail/${stocktakingLocationId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking pallet detail:", error);
        throw error;
    }
};

// Lấy chi tiết StocktakingPallet theo stocktakingLocationId và locationCode
export const getStocktakingPalletDetailByLocationCode = async (stocktakingLocationId, locationCode) => {
    try {
        if (!stocktakingLocationId) {
            throw new Error("stocktakingLocationId is required");
        }
        if (!locationCode) {
            throw new Error("locationCode is required");
        }
        const res = await api.get(`/StocktakingPallet/GetDetail/${stocktakingLocationId}/${locationCode}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching stocktaking pallet detail by location code:", error);
        throw error;
    }
};

// Quét pallet trong kiểm kê
export const scannerStocktakingPallet = async (stocktakingLocationId, palletId) => {
    try {
        if (!stocktakingLocationId) {
            throw new Error("stocktakingLocationId is required");
        }
        if (!palletId) {
            throw new Error("palletId is required");
        }
        const res = await api.post("/StocktakingPallet/ScannerStocktakingPallet", {
            stocktakingLocationId: stocktakingLocationId,
            palletId: palletId
        });
        return res.data;
    } catch (error) {
        console.error("Error scanning stocktaking pallet:", error);
        throw error;
    }
};

// Đánh dấu pallet thiếu trong kiểm kê
export const missStocktakingPallet = async (data) => {
    try {
        if (!data.stocktakingPalletId) {
            throw new Error("stocktakingPalletId is required");
        }
        const body = {
            stocktakingPalletId: data.stocktakingPalletId,
            note: data.note || ""
        };
        const res = await api.put("/StocktakingPallet/MissStocktakingPallet", body);
        return res.data;
    } catch (error) {
        console.error("Error marking stocktaking pallet as miss:", error);
        throw error;
    }
};

// Đánh dấu pallet khớp trong kiểm kê
export const matchStocktakingPallet = async (data) => {
    try {
        if (!data.stocktakingPalletId) {
            throw new Error("stocktakingPalletId is required");
        }
        if (data.actualPackageQuantity === undefined || data.actualPackageQuantity === null) {
            throw new Error("actualPackageQuantity is required");
        }
        const body = {
            stocktakingPalletId: data.stocktakingPalletId,
            actualPackageQuantity: data.actualPackageQuantity,
            note: data.note || ""
        };
        const res = await api.put("/StocktakingPallet/MatchStocktakingPallet", body);
        return res.data;
    } catch (error) {
        console.error("Error marking stocktaking pallet as match:", error);
        throw error;
    }
};

// Đánh dấu pallet thừa trong kiểm kê
export const surplusStocktakingPallet = async (data) => {
    try {
        if (!data.stocktakingPalletId) {
            throw new Error("stocktakingPalletId is required");
        }
        if (data.actualPackageQuantity === undefined || data.actualPackageQuantity === null) {
            throw new Error("actualPackageQuantity is required");
        }
        const body = {
            stocktakingPalletId: data.stocktakingPalletId,
            actualPackageQuantity: data.actualPackageQuantity,
            note: data.note || ""
        };
        const res = await api.put("/StocktakingPallet/SuplusStocktakingPallet", body);
        return res.data;
    } catch (error) {
        console.error("Error marking stocktaking pallet as surplus:", error);
        throw error;
    }
};

// Hoàn tác pallet trong kiểm kê
export const undoStocktakingPallet = async (stocktakingPalletId) => {
    try {
        if (!stocktakingPalletId) {
            throw new Error("stocktakingPalletId is required");
        }
        const res = await api.get(`/StocktakingPallet/UndoStocktakingPalletRecord/${stocktakingPalletId}`);
        return res.data;
    } catch (error) {
        console.error("Error undoing stocktaking pallet:", error);
        throw error;
    }
};

// Xóa pallet trong kiểm kê
export const deleteStocktakingPallet = async (stocktakingPalletId) => {
    try {
        if (!stocktakingPalletId) {
            throw new Error("stocktakingPalletId is required");
        }
        const res = await api.delete(`/StocktakingPallet/Delete/${stocktakingPalletId}`);
        return res.data;
    } catch (error) {
        console.error("Error deleting stocktaking pallet:", error);
        throw error;
    }
};

// Xác nhận đã đếm vị trí kiểm kê
export const confirmStocktakingLocationCounted = async (stocktakingLocationId) => {
    try {
        if (!stocktakingLocationId) {
            throw new Error("stocktakingLocationId is required");
        }
        const body = {
            stocktakingLocationId: stocktakingLocationId
        };
        const res = await api.post("/StocktakingLocation/ConfirmCounted", body);
        return res.data;
    } catch (error) {
        console.error("Error confirming stocktaking location counted:", error);
        throw error;
    }
};

// Nộp kiểm kê (Submit stocktaking area)
export const submitStocktakingArea = async (stocktakingAreaId) => {
    try {
        if (!stocktakingAreaId) {
            throw new Error("stocktakingAreaId is required");
        }
        const body = {
            stocktakingAreaId: stocktakingAreaId
        };
        const res = await api.put("/StocktakingArea/Submit", body);
        return res.data;
    } catch (error) {
        console.error("Error submitting stocktaking area:", error);
        throw error;
    }
};

// Phân công lại khu vực kiểm kê (Re-assign stocktaking area)
export const reAssignStocktakingArea = async (stocktakingAreaId, assignTo) => {
    try {
        if (!stocktakingAreaId) {
            throw new Error("stocktakingAreaId is required");
        }
        if (assignTo === undefined || assignTo === null) {
            throw new Error("assignTo is required");
        }
        const body = {
            stocktakingAreaId: stocktakingAreaId,
            assignTo: assignTo
        };
        const res = await api.put("/StocktakingArea/ReAssignStocktakingArea", body);
        return res.data;
    } catch (error) {
        console.error("Error re-assigning stocktaking area:", error);
        throw error;
    }
};

// Từ chối bản ghi kiểm kê (Reject stocktaking location records)
export const rejectStocktakingLocationRecords = async (records) => {
    try {
        if (!records || !Array.isArray(records) || records.length === 0) {
            throw new Error("records is required and must be a non-empty array");
        }
        
        // Validate each record
        records.forEach((record, index) => {
            if (!record.stocktakingLocationId) {
                throw new Error(`Record at index ${index} is missing stocktakingLocationId`);
            }
            if (record.rejectReason === undefined || record.rejectReason === null) {
                throw new Error(`Record at index ${index} is missing rejectReason`);
            }
            if (record.locationId === undefined || record.locationId === null) {
                throw new Error(`Record at index ${index} is missing locationId`);
            }
        });

        const body = records.map(record => ({
            stocktakingLocationId: record.stocktakingLocationId,
            rejectReason: record.rejectReason || "",
            locationId: record.locationId
        }));

        const res = await api.put("/StocktakingLocation/RejectRecords", body);
        return res.data;
    } catch (error) {
        console.error("Error rejecting stocktaking location records:", error);
        throw error;
    }
};

// Hủy bản ghi kiểm kê (Cancel stocktaking location record)
export const cancelStocktakingLocationRecord = async (records) => {
    try {
        if (!records || !Array.isArray(records) || records.length === 0) {
            throw new Error("records is required and must be a non-empty array");
        }
        
        // Validate each record
        records.forEach((record, index) => {
            if (!record.stocktakingLocationId) {
                throw new Error(`Record at index ${index} is missing stocktakingLocationId`);
            }
            if (record.locationId === undefined || record.locationId === null) {
                throw new Error(`Record at index ${index} is missing locationId`);
            }
        });

        const body = records.map(record => ({
            stocktakingLocationId: record.stocktakingLocationId,
            locationId: record.locationId
        }));

        const res = await api.put("/StocktakingLocation/CancelRecord", body);
        return res.data;
    } catch (error) {
        console.error("Error canceling stocktaking location record:", error);
        throw error;
    }
};

// Duyệt khu vực kiểm kê (Approval stocktaking area)
export const approveStocktakingArea = async (stocktakingAreaId) => {
    try {
        if (!stocktakingAreaId) {
            throw new Error("stocktakingAreaId is required");
        }
        const body = {
            stocktakingAreaId: stocktakingAreaId
        };
        const res = await api.put("/StocktakingArea/Approval", body);
        return res.data;
    } catch (error) {
        console.error("Error approving stocktaking area:", error);
        throw error;
    }
};

// Hoàn thành phiếu kiểm kê (Complete stocktaking sheet)
export const completeStocktaking = async (data) => {
    try {
        if (!data.stocktakingSheetId) {
            throw new Error("stocktakingSheetId is required");
        }
        const body = {
            stocktakingSheetId: data.stocktakingSheetId,
            note: data.note || ""
        };

        const res = await api.put("/StocktakingSheet/Completed", body);
        return res.data;
    } catch (error) {
        console.error("Error completing stocktaking:", error);
        throw error;
    }
};