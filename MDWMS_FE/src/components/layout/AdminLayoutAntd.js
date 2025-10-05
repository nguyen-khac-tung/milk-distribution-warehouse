import React from "react";
import Sidebar from "./SidebarAntd";

const AdminLayout = ({ children }) => {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ flex: 1, padding: 24, background: "#f5f5f5" }}>{children}</main>
        </div>
    );
};

export default AdminLayout;
