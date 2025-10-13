import api from "./api";

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

        console.log("Sending request body:", body);
        console.log("Search params:", searchParams);

        const res = await api.post("/Location/Locations", body);
        console.log("Location API response:", res.data);
        console.log("Search params received:", searchParams);

        // API sometimes returns the payload directly in res.data or nested in res.data.data
        // Normalize to an object with { items, totalCount, ... }
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
            LocationId: data.LocationId,
            AreaId: data.AreaId,
            LocationCode: data.LocationCode,
            Rack: data.Rack,
            Row: data.Row,
            Column: data.Column,
            IsAvailable: data.IsAvailable,
            Status: data.Status,
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
        Status: data.Status,
    };

    try {
        console.log("Sending update request:", body);
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
