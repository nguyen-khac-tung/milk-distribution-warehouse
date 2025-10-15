import api from "./api";

// Get list of roles
export const getRoleList = async () => {
    try {        
        const res = await api.get("/Role/GetRoles");
        console.log("Role API - Response received:", res.data);

        return res.data;
    } catch (error) {
        console.error("Error fetching role list:", error);
        return { 
            status: 500, 
            message: "Failed to fetch roles", 
            data: [] 
        };
    }
};





