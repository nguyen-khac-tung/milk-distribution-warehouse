import api from "./api";

// Lấy báo cáo tồn kho
export const getInventoryReport = async (params = {}) => {
    try {
        const { areaId, pageNumber = 1, pageSize = 10, search = "", sortField = "", sortAscending = true, filters = {} } = params;

        // Build query string for areaId (query parameter)
        const queryParams = new URLSearchParams();
        if (areaId) {
            queryParams.append('areaId', areaId);
        }
        const queryString = queryParams.toString();
        const url = `/Report/InventoryReport${queryString ? `?${queryString}` : ''}`;

        // Build request body - backend uses 1-based pageNumber
        const body = {
            pageNumber: pageNumber, // Backend uses 1-based index
            pageSize,
            search,
            sortField,
            sortAscending,
            filters
        };
        const res = await api.post(url, body);
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

// Lấy báo cáo vị trí
export const getLocationReport = async (params = {}) => {
    try {
        const { areaId } = params;

        // Build query string for areaId
        const queryParams = areaId ? `?areaId=${areaId}` : "";

        // Build request body - backend doesn't use it but kept for compatibility
        const body = {
            pageNumber: 1,
            pageSize: 10,
            search: "",
            sortField: "",
            sortAscending: true,
            filters: {}
        };

        const res = await api.post(`/Report/LocationReport${queryParams}`, body);

        // Handle response structure
        if (res?.data) {
            // Case 1: res.data.data (nested structure)
            if (res.data.data) {
                return {
                    totalLocations: res.data.data.totalLocations || 0,
                    availableLocationCount: res.data.data.availableLocationCount || 0,
                    areaDetails: res.data.data.areaDetails || []
                };
            }
            // Case 2: res.data (direct structure)
            if (res.data.totalLocations !== undefined) {
                return {
                    totalLocations: res.data.totalLocations || 0,
                    availableLocationCount: res.data.availableLocationCount || 0,
                    areaDetails: res.data.areaDetails || []
                };
            }
        }

        return {
            totalLocations: 0,
            availableLocationCount: 0,
            areaDetails: []
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
            totalLocations: 0,
            availableLocationCount: 0,
            areaDetails: []
        };
    }
};

// Lấy báo cáo nhập kho
export const getGoodsReceiptReport = async (params = {}) => {
    try {
        const { fromDate, toDate, pageNumber = 1, pageSize = 10, search = "", sortField = "", sortAscending = true, filters = {} } = params;

        // Build query string for fromDate and toDate
        const queryParams = new URLSearchParams();
        if (fromDate) {
            queryParams.append('fromDate', fromDate);
        }
        if (toDate) {
            queryParams.append('toDate', toDate);
        }

        const queryString = queryParams.toString();
        const url = `/Report/GoodsReceiptReport${queryString ? `?${queryString}` : ''}`;

        // Build request body with pagination and filters
        const body = {
            pageNumber: pageNumber,
            pageSize,
            search,
            sortField,
            sortAscending,
            filters
        };

        const res = await api.post(url, body);

        // Handle response structure - check for PageResult structure
        if (res?.data) {
            // Case 1: res.data.data.items (nested PageResult structure)
            if (res.data.data && res.data.data.items && Array.isArray(res.data.data.items)) {
                return {
                    items: res.data.data.items,
                    totalCount: res.data.data.totalCount || 0,
                    pageNumber: res.data.data.pageNumber || pageNumber,
                    pageSize: res.data.data.pageSize || pageSize,
                    totalPages: res.data.data.totalPages,
                    hasPreviousPage: res.data.data.hasPreviousPage,
                    hasNextPage: res.data.data.hasNextPage
                };
            }
            // Case 2: res.data.items (direct PageResult structure)
            if (res.data.items && Array.isArray(res.data.items)) {
                return {
                    items: res.data.items,
                    totalCount: res.data.totalCount || 0,
                    pageNumber: res.data.pageNumber || pageNumber,
                    pageSize: res.data.pageSize || pageSize,
                    totalPages: res.data.totalPages,
                    hasPreviousPage: res.data.hasPreviousPage,
                    hasNextPage: res.data.hasNextPage
                };
            }
            // Case 3: res.data.data is array (legacy structure)
            if (Array.isArray(res.data.data)) {
                return {
                    items: res.data.data,
                    totalCount: res.data.totalCount || res.data.data.length || 0,
                    pageNumber: res.data.pageNumber || pageNumber,
                    pageSize: res.data.pageSize || pageSize,
                    totalPages: res.data.totalPages,
                    hasPreviousPage: res.data.hasPreviousPage,
                    hasNextPage: res.data.hasNextPage
                };
            }
            // Case 4: res.data is array directly (legacy structure)
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
        // Check if error is "No data found" - this is a normal case, not a real error
        const isNoDataError = error.response?.status === 400 &&
            (error.response?.data?.message?.toLowerCase().includes('no goods receipt data found') ||
                error.response?.data?.message?.toLowerCase().includes('no data found'));

        if (!isNoDataError) {
            // Only log real errors, not "no data found" cases
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                console.error("Error response headers:", error.response.headers);
            }
            if (error.request) {
                console.error("Error request:", error.request);
            }
            console.error("Error fetching goods receipt report:", error);
        }
        return {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10
        };
    }
};

// Lấy báo cáo xuất kho
export const getGoodsIssueReport = async (params = {}) => {
    try {
        const { fromDate, toDate, pageNumber = 1, pageSize = 10, search = "", sortField = "", sortAscending = true, filters = {} } = params;

        // Build query string for fromDate and toDate
        const queryParams = new URLSearchParams();
        if (fromDate) {
            queryParams.append('fromDate', fromDate);
        }
        if (toDate) {
            queryParams.append('toDate', toDate);
        }

        const queryString = queryParams.toString();
        const url = `/Report/GoodsIssueReport${queryString ? `?${queryString}` : ''}`;

        // Build request body with pagination and filters
        const body = {
            pageNumber: pageNumber,
            pageSize,
            search,
            sortField,
            sortAscending,
            filters
        };

        const res = await api.post(url, body);

        // Handle response structure - check for PageResult structure
        if (res?.data) {
            // Case 1: res.data.data.items (nested PageResult structure)
            if (res.data.data && res.data.data.items && Array.isArray(res.data.data.items)) {
                return {
                    items: res.data.data.items,
                    totalCount: res.data.data.totalCount || 0,
                    pageNumber: res.data.data.pageNumber || pageNumber,
                    pageSize: res.data.data.pageSize || pageSize,
                    totalPages: res.data.data.totalPages,
                    hasPreviousPage: res.data.data.hasPreviousPage,
                    hasNextPage: res.data.data.hasNextPage
                };
            }
            // Case 2: res.data.items (direct PageResult structure)
            if (res.data.items && Array.isArray(res.data.items)) {
                return {
                    items: res.data.items,
                    totalCount: res.data.totalCount || 0,
                    pageNumber: res.data.pageNumber || pageNumber,
                    pageSize: res.data.pageSize || pageSize,
                    totalPages: res.data.totalPages,
                    hasPreviousPage: res.data.hasPreviousPage,
                    hasNextPage: res.data.hasNextPage
                };
            }
            // Case 3: res.data.data is array (legacy structure)
            if (Array.isArray(res.data.data)) {
                return {
                    items: res.data.data,
                    totalCount: res.data.totalCount || res.data.data.length || 0,
                    pageNumber: res.data.pageNumber || pageNumber,
                    pageSize: res.data.pageSize || pageSize,
                    totalPages: res.data.totalPages,
                    hasPreviousPage: res.data.hasPreviousPage,
                    hasNextPage: res.data.hasNextPage
                };
            }
            // Case 4: res.data is array directly (legacy structure)
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
        // Check if error is "No data found" - this is a normal case, not a real error
        const isNoDataError = error.response?.status === 400 &&
            (error.response?.data?.message?.toLowerCase().includes('no goods issue data found') ||
                error.response?.data?.message?.toLowerCase().includes('no data found'));

        if (!isNoDataError) {
            // Only log real errors, not "no data found" cases
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                console.error("Error response headers:", error.response.headers);
            }
            if (error.request) {
                console.error("Error request:", error.request);
            }
            console.error("Error fetching goods issue report:", error);
        }
        return {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10
        };
    }
};

// Lấy báo cáo sổ cái tồn kho
export const getInventoryLedgerReport = async (params = {}) => {
    try {
        const { fromDate, toDate, pageNumber = 1, pageSize = 10, search = "", sortField = "", sortAscending = true, filters = {} } = params;

        // Build query string for fromDate and toDate
        const queryParams = new URLSearchParams();
        if (fromDate) {
            queryParams.append('fromDate', fromDate);
        }
        if (toDate) {
            queryParams.append('toDate', toDate);
        }

        const queryString = queryParams.toString();
        const url = `/Report/InventoryLedgerReport${queryString ? `?${queryString}` : ''}`;

        // Build request body with pagination and filters
        const body = {
            pageNumber: pageNumber,
            pageSize: pageSize,
            search: search,
            sortField: sortField,
            sortAscending: sortAscending,
            filters: filters
        };

        const res = await api.post(url, body);

        // Handle response structure - backend returns PageResult
        if (res?.data) {
            // Case 1: res.data.data (nested structure with PageResult)
            if (res.data.data && res.data.data.items) {
                return {
                    items: res.data.data.items || [],
                    totalCount: res.data.data.totalCount || 0,
                    pageNumber: res.data.data.pageNumber || pageNumber,
                    pageSize: res.data.data.pageSize || pageSize
                };
            }
            // Case 2: res.data has PageResult structure directly
            if (res.data.items) {
                return {
                    items: res.data.items || [],
                    totalCount: res.data.totalCount || 0,
                    pageNumber: res.data.pageNumber || pageNumber,
                    pageSize: res.data.pageSize || pageSize
                };
            }
            // Case 3: res.data.data is array (fallback)
            if (Array.isArray(res.data.data)) {
                return {
                    items: res.data.data,
                    totalCount: res.data.data.length || 0,
                    pageNumber: pageNumber,
                    pageSize: pageSize
                };
            }
            // Case 4: res.data is array directly (fallback)
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
        console.error("Error fetching inventory ledger report:", error);
        throw error;
    }
};
