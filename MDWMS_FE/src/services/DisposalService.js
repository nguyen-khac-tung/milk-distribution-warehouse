import api from "./api";

//
export const getDisposalRequestListWarehouseManager = async (params = {}) => {
    try {
        const payload = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            search: params.search || "",
            sortField: params.sortField || "",
            sortAscending: params.sortAscending ?? true,
            filters: {
                ...(params.status && { status: params.status }),
                ...(params.assignTo && { assignTo: params.assignTo }),
                ...(params.createdBy && { createdBy: params.createdBy }),
                ...(params.approvalBy && { approvalBy: params.approvalBy }),
                ...(params.fromEstimatedDate && { fromDate: params.fromEstimatedDate }),
                ...(params.toEstimatedDate && { toDate: params.toEstimatedDate }),
            },
        };

        const res = await api.post(
            "/DisposalRequest/GetDisposalRequestListWarehouseManager",
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error fetching disposal requests for warehouse manager:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const getDisposalRequestListSaleManager = async (params = {}) => {
    try {
        const payload = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            search: params.search || "",
            sortField: params.sortField || "",
            sortAscending: params.sortAscending ?? true,
            filters: {
                ...(params.status && { status: params.status }),
                ...(params.createdBy && { createdBy: params.createdBy }),
                ...(params.approvalBy && { approvalBy: params.approvalBy }),
                ...(params.fromEstimatedDate && { fromDate: params.fromEstimatedDate }),
                ...(params.toEstimatedDate && { toDate: params.toEstimatedDate }),
            },
        };

        const res = await api.post(
            "/DisposalRequest/GetDisposalRequestListSaleManager",
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error fetching disposal requests for sale manager:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

//
export const getDisposalRequestListWarehouseStaff = async (params = {}) => {
    try {
        const payload = {
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            search: params.search || "",
            sortField: params.sortField || "",
            sortAscending: params.sortAscending ?? true,
            filters: {
                ...(params.status && { status: params.status }),
                ...(params.createdBy && { createdBy: params.createdBy }),
                ...(params.approvalBy && { approvalBy: params.approvalBy }),
                ...(params.fromEstimatedDate && { fromDate: params.fromEstimatedDate }),
                ...(params.toEstimatedDate && { toDate: params.toEstimatedDate }),
            },
        };

        const res = await api.post(
            "/DisposalRequest/GetDisposalRequestListWarehouseStaff",
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error fetching disposal requests for warehouse staff:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const getDisposalRequestDetail = async (disposalRequestId) => {
    try {
        const res = await api.get(
            `/DisposalRequest/GetDisposalRequestDetail/${disposalRequestId}`
        );

        return res.data;
    } catch (error) {
        console.error("Error fetching disposal request detail:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const getExpiredGoodsForDisposal = async () => {
    try {
        const res = await api.get(`/DisposalRequest/GetExpiredGoodsForDisposal`);
        return res.data;
    } catch (error) {
        console.error("Error fetching expired goods for disposal:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const createDisposalRequest = async (payload) => {
    try {
        const res = await api.post(
            `/DisposalRequest/CreateDisposalRequest`,
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error creating disposal request:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const updateDisposalRequest = async (payload) => {
    try {
        const res = await api.put(
            `/DisposalRequest/UpdateDisposalRequest`,
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error updating disposal request:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const deleteDisposalRequest = async (disposalRequestId) => {
    try {
        const res = await api.delete(
            `/DisposalRequest/DeleteDisposalRequest/${disposalRequestId}`
        );

        return res.data;
    } catch (error) {
        console.error("Error deleting disposal request:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const updateDisposalRequestStatusPendingApproval = async (payload) => {
    try {
        const res = await api.put(
            `/DisposalRequest/UpdateStatusPendingApproval`,
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error updating disposal request status to pending approval:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const approveDisposalRequest = async (payload) => {
    try {
        const res = await api.put(
            `/DisposalRequest/UpdateStatusApproval`,
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error approving disposal request:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const rejectDisposalRequest = async (payload) => {
    try {
        const res = await api.put(
            `/DisposalRequest/UpdateStatusReject`,
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error rejecting disposal request:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const assignDisposalRequestForPicking = async (payload) => {
    try {
        const res = await api.put(
            `/DisposalRequest/UpdateStatusAssignedForPicking`,
            payload
        );

        return res.data;
    } catch (error) {
        console.error("Error assigning disposal request for picking:", error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

// Tạo mới phiếu xuất hủy theo disposalRequestId
export const createDisposalNote = async (data) => {
    try {
        const body = {
            disposalRequestId: data.disposalRequestId,
        };

        const res = await api.post("/DisposalNote/CreateDisposalNote", body);
        console.log("createDisposalNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating disposal note:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Lấy chi tiết phiếu xuất hủy theo Disposal Request ID
export const getDetailDisposalNote = async (disposalRequestId) => {
    try {
        const res = await api.get(`/DisposalNote/GetDetailDisposalNote/${disposalRequestId}`);
        console.log("getDetailDisposalNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching Disposal Note detail:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Gửi phiếu xuất hủy (Submit)
export const submitDisposalNote = async (disposalNoteId) => {
    try {
        const res = await api.put(`/DisposalNote/SubmitDisposalNote`, {
            disposalNoteId,
        });
        console.log("submitDisposalNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error submitting Disposal Note:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Duyệt phiếu xuất hủy
export const approveDisposalNote = async (disposalNoteId) => {
    try {
        const res = await api.put(`/DisposalNote/ApproveDisposalNote`, {
            disposalNoteId,
        });
        console.log("approveDisposalNote:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error approving Disposal Note:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Re-pick lại một chi tiết phiếu xuất hủy
export const rePickDisposalNoteDetail = async (data) => {
    try {
        const res = await api.put(`/DisposalNoteDetail/RePickDisposalNoteDetail`, data);
        console.log("rePickDisposalNoteDetail:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error re-picking disposal note detail:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Re-pick danh sách chi tiết phiếu xuất hủy (dành cho quản lý kho)
export const rePickDisposalNoteDetailList = async (items) => {
    try {
        const res = await api.put(`/DisposalNoteDetail/RePickDisposalNoteDetailList`, items);
        console.log("rePickDisposalNoteDetailList:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error re-picking disposal note detail list:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};