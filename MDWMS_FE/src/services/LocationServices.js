import api from "./api";
import { extractErrorMessage } from '../utils/Validation';

// Lấy danh sách Location (phân trang, tìm kiếm, sort, filter)
export const getLocations = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending:
                searchParams.sortAscending !== undefined
                    ? searchParams.sortAscending
                    : true,
            filters: {}
        };

        // Add filter parameters to filters object only when they have values
        if (searchParams.status !== undefined && searchParams.status !== "" && searchParams.status !== null) {
            body.filters.status = String(searchParams.status);
        }
        if (searchParams.isAvailable !== undefined && searchParams.isAvailable !== "" && searchParams.isAvailable !== null) {
            body.filters.isAvailable = String(searchParams.isAvailable);
        }
        if (searchParams.areaId !== undefined && searchParams.areaId !== "" && searchParams.areaId !== null) {
            body.filters.areaId = String(searchParams.areaId);
        }

        const res = await api.post("/Location/Locations", body);

        const payload = res?.data?.data ?? res?.data ?? { items: [], totalCount: 0 };
        return payload;
    } catch (error) {
        console.error("Error fetching locations:", error);
        return { items: [], totalCount: 0 };
    }
};

// Tạo mới Location
export const createLocation = async (data) => {
    try {
        const body = {
            areaId: data.areaId,
            rack: data.rack,
            row: data.row,
            column: data.column,
            isAvailable: data.isAvailable,
        };

        const res = await api.post("/Location/Create", body);
        console.log("Location Create API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating location:", error);
        if (error.response && error.response.data && error.response.data.message) {
            // Trả lại message lỗi từ BE
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật Location
export const updateLocation = async (data) => {
    const body = {
        LocationId: data.LocationId,
        AreaId: data.AreaId,
        LocationCode: data.LocationCode,
        Rack: data.Rack,
        Row: data.Row,
        Column: data.Column,
        IsAvailable: data.IsAvailable,
    };

    try {
        const res = await api.put(`/Location/Update/${data.LocationId}`, body);
        console.log("Location Update API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating location:", error);
        if (error.response && error.response.data && error.response.data.message) {
            // Trả lại message lỗi từ BE
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Lấy chi tiết Location theo ID
export const getLocationDetail = async (locationId) => {
    try {
        const res = await api.get(`/Location/GetById/${locationId}`);
        console.log("Location Detail API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching Location detail:", error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Xóa Location
export const deleteLocation = async (locationId) => {
    try {
        const res = await api.delete(`/Location/Delete/${locationId}`);
        console.log("Location Delete API response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error deleting location:", error);
        throw error;
    }
};

// Update location status
export const updateLocationStatus = async (locationId, status) => {
    try {
        const res = await api.put(`/Location/UpdateStatus/${locationId}?status=${status}`);
        console.log("Update location status response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating location status:", error);
        throw error;
    }
};

// Tạo nhiều Location cùng lúc
export const createMultipleLocations = async (locations) => {
    try {
        if (!Array.isArray(locations) || locations.length === 0) {
            throw new Error("Danh sách location không hợp lệ hoặc trống.");
        }

        const body = {
            locations: locations.map((loc) => ({
                areaId: loc.areaId,
                rack: loc.rack,
                row: loc.row,
                column: loc.column,
                isAvailable: loc.isAvailable,
            })),
        };

        const res = await api.post("/Location/CreateMultiple", body);

        console.log("CreateMultiple Locations API response:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error creating multiple locations:", error);

        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Validate location code
export const validateLocationCode = async (locationCode, palletId) => {
    try {
        // Convert palletId to string if provided
        const palletIdString = palletId != null ? String(palletId) : "";

        const response = await api.post(`/Location/LocationPallet`, {
            locationCode: locationCode,
            palletId: palletIdString
        });

        if (response.status === 200 && response.data) {
            // Lấy message từ response nếu có
            const responseMessage = response.data.message || response.data.Message || "";

            if (response.data.success === true && response.data.data && response.data.data.locationId) {
                return {
                    success: true,
                    data: response.data.data,
                    message: responseMessage || "Mã vị trí hợp lệ"
                };
            }
            else if (response.data.data && response.data.data.locationId) {
                return {
                    success: true,
                    data: response.data.data,
                    message: responseMessage || "Mã vị trí hợp lệ"
                };
            }
            else if (response.data.locationId) {
                return {
                    success: true,
                    data: response.data,
                    message: responseMessage || "Mã vị trí hợp lệ"
                };
            }

            // Nếu response có message nhưng không thành công
            if (responseMessage) {
                return {
                    success: false,
                    data: null,
                    message: responseMessage
                };
            }
        }

        return {
            success: false,
            data: null,
            message: "Mã vị trí không tồn tại"
        };
    } catch (error) {
        console.error("Error validating location code:", error);
        const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi kiểm tra mã vị trí");

        return {
            success: false,
            data: null,
            message: errorMessage
        };
    }
};


