import React, { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        console.log("Login attempt with:", values); // Debug log
        setLoading(true);
        try {
            // Simulate login API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock login success (trim whitespace)
            if (values.username.trim() === "admin" && values.password.trim() === "123456") {
                localStorage.setItem("token", "mock-token");
                console.log("Login successful, token saved"); // Debug log
                message.success("Đăng nhập thành công!");
                // Use setTimeout to ensure message is shown before redirect
                setTimeout(() => {
                    window.location.href = "/admin/dashboard";
                }, 500);
            } else {
                console.log("Login failed: wrong credentials"); // Debug log
                message.error("Tên đăng nhập hoặc mật khẩu không đúng!");
            }
        } catch (error) {
            console.error("Login error:", error); // Debug log
            message.error("Có lỗi xảy ra khi đăng nhập!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex" }}>
            {/* Phần ảnh bên trái */}
            <div
                style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    padding: "40px",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {/* Background pattern */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        opacity: 0.3
                    }}
                />

                {/* Content */}
                <div style={{ textAlign: "center", zIndex: 1 }}>
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            background: "rgba(255, 255, 255, 0.2)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 30px",
                            backdropFilter: "blur(10px)"
                        }}
                    >
                        <UserOutlined style={{ fontSize: 60, color: "white" }} />
                    </div>

                    <Title level={1} style={{ color: "white", marginBottom: 16 }}>
                        Milk Warehouse
                    </Title>
                    <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 18 }}>
                        Hệ thống quản lý kho sữa
                    </Text>
                    <br />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>
                        Quản lý sản phẩm, đơn hàng và báo cáo hiệu quả
                    </Text>
                </div>
            </div>

            {/* Phần form bên phải */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px",
                    background: "#fafafa"
                }}
            >
                <div style={{ width: "100%", maxWidth: 400 }}>
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                        <Title level={2} style={{ marginBottom: 8 }}>
                            Đăng nhập
                        </Title>
                        <Text type="secondary">
                            Vui lòng nhập thông tin đăng nhập của bạn
                        </Text>
                    </div>

                    <Form
                        name="login"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            label="Tên đăng nhập"
                            name="username"
                            rules={[
                                { required: true, message: "Vui lòng nhập tên đăng nhập!" }
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="Nhập tên đăng nhập"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[
                                { required: true, message: "Vui lòng nhập mật khẩu!" }
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Nhập mật khẩu"
                            />
                        </Form.Item>

                        <div style={{ textAlign: "right", marginBottom: 16 }}>
                            <Button type="link" style={{ padding: 0 }}>
                                Quên mật khẩu?
                            </Button>
                        </div>

                        <Form.Item style={{ marginBottom: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                style={{ width: "100%", height: 45 }}
                            >
                                Đăng nhập
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{ textAlign: "center" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Demo: admin / 123456
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;