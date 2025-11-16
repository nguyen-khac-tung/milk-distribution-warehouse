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