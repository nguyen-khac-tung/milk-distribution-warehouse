import React from "react";
import { LogoutOutlined, UserOutlined, BellOutlined } from "@ant-design/icons";
import { Avatar } from "antd";

const user = {
    name: "Nguyễn Văn A",
    avatar: null // Có thể thay bằng link ảnh nếu có
};

const HeaderBar = ({ onLogout }) => {
    return (
        <div
            style={{
                height: 64,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                boxShadow: "0 2px 8px #f0f1f2",
                position: "sticky",
                top: 0,
                zIndex: 100,
            }}
        >
            <div style={{ display: "flex", alignItems: "center" }}>
                <Avatar icon={<UserOutlined />} src={user.avatar} style={{ marginRight: 8 }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>{user.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <BellOutlined
                    style={{ fontSize: 22, color: "#1890ff", cursor: "pointer" }}
                    title="Thông báo"
                />
                <LogoutOutlined
                    style={{ fontSize: 22, color: "#ff4d4f", cursor: "pointer" }}
                    title="Đăng xuất"
                    onClick={onLogout}
                />
            </div>
        </div>
    );
};

export default HeaderBar;
