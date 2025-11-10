import api from "./api";

// Lấy báo cáo tồn kho
export const getInventoryReport = async (params = {}) => {
    try {
        const { areaId, pageNumber = 1, pageSize = 10, search = "", sortField = "", sortAscending = true, filters = {} } = params;
        
        // Build query string for areaId (note: backend uses 'areald' not 'areaId')
        const queryParams = areaId ? `?areald=${areaId}` : "";
        
        // Build request body - backend uses 1-based pageNumber
        const body = {
            pageNumber: pageNumber, // Backend uses 1-based index
            pageSize,
            search,
            sortField,
            sortAscending,
            filters
        };
        const res = await api.post(`/Report/InventoryReport${queryParams}`, body);
        // Handle response structure - check multiple possible structures
        if (res?.data) {
            // Case 1: res.data.data.items (nested structure)
            if (res.data.data && res.data.data.items && Array.isArray(res.data.data.items)) {
                return {
                    items: res.data.data.items,
                    totalCount: res.data.data.totalCount || res.data.data.items.length || 0,
                    pageNumber: res.data.data.pageNumber || pageNumber,
                    pageSize: res.data.data.pageSize || pageSize
                };
            }
            // Case 2: res.data.items (direct structure)
            if (res.data.items && Array.isArray(res.data.items)) {
                return {
                    items: res.data.items,
                    totalCount: res.data.totalCount || res.data.items.length || 0,
                    pageNumber: res.data.pageNumber || pageNumber,
                    pageSize: res.data.pageSize || pageSize
                };
            }
            // Case 3: res.data.data is array
            if (Array.isArray(res.data.data)) {
                return {
                    items: res.data.data,
                    totalCount: res.data.totalCount || res.data.data.length || 0,
                    pageNumber: res.data.pageNumber || pageNumber,
                    pageSize: res.data.pageSize || pageSize
                };
            }
            // Case 4: res.data is array directly
            if (Array.isArray(res.data)) {
                return {
                    items: res.data,
                    totalCount: res.data.length || 0,
                    pageNumber: pageNumber,
                    pageSize: pageSize
                };
            }
        }        
        return {
            items: [],
            totalCount: 0,
            pageNumber: pageNumber,
            pageSize: pageSize
        };
    } catch (error) {
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
            console.error("Error response headers:", error.response.headers);
        }
        if (error.request) {
            console.error("Error request:", error.request);
        }
        return {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10
        };
    }
};