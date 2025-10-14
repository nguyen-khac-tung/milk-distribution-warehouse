import api from "./api";

export const getSuppliers = async (searchParams = {}) => {
    try {
        const body = {
            pageNumber: searchParams.pageNumber || 1,
            pageSize: searchParams.pageSize || 10,
            search: searchParams.search || "",
            sortField: searchParams.sortField || "",
            sortAscending: searchParams.sortAscending !== undefined ? searchParams.sortAscending : true,
            filters: searchParams.status ? { status: searchParams.status } : {}
        };
        const res = await api.post("/Supplier/Suppliers", body);
        console.log("Supplier API response:", res.data);
        console.log("Search params received:", searchParams);

        return res.data;
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return { data: [], totalCount: 0 };
    }
};

export const getSuppliersDropdown = async () => {
    try {
        const res = await api.get("/Supplier/GetSupplierDropDown");
        console.log("Supplier API response:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return { data: [], totalCount: 0 };
    }
};

export const getSupplierDetail = async (supplierId) => {
    try {
        const res = await api.get(`/Supplier/GetSupplierBySupplierId/${supplierId}`);
        console.log("Get supplier detail response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error fetching supplier detail:", error);
        throw error;
    }
};

// Create new supplier
export const createSupplier = async (supplierData) => {
    try {
        const res = await api.post('/Supplier/Create', supplierData);
        console.log("Create supplier response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error creating supplier:", error);
        throw error;
    }
};

// Update supplier
export const updateSupplier = async (supplierData) => {
    try {
        const res = await api.put('/Supplier/Update', supplierData);
        console.log("Update supplier response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating supplier:", error);
        throw error;
    }
};

// Delete supplier
export const deleteSupplier = async (supplierId) => {
    try {
        const res = await api.delete(`/Supplier/Delete/${supplierId}`);
        console.log("Delete supplier response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error deleting supplier:", error);
        throw error;
    }
};

// Update supplier status
export const updateSupplierStatus = async (supplierId, status) => {
    try {
        const res = await api.put('/Supplier/UpdateStatus', { 
            SupplierId: supplierId,
            Status: status 
        });
        console.log("Update supplier status response:", res.data);
        return res.data;
    } catch (error) {
        console.error("Error updating supplier status:", error);
        throw error;
    }
};