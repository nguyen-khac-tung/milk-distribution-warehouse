import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import {
    MailOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/AuthenticationServices";

const { Title, Text } = Typography;

const ForgotPasswordPage = () => {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const lastTime = localStorage.getItem("lastForgotTime");
        if (lastTime) {
            const diff = Math.floor((Date.now() - parseInt(lastTime)) / 1000);
            const remain = 60 - diff;
            if (remain > 0) setTimer(remain);
        }
    }, []);

    // Đếm ngược tg
    useEffect(() => {
        if (timer > 0) {
            const countdown = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(countdown);
        }
    }, [timer]);

    const onFinish = async (values) => {
        if (timer > 0) {
            window.showToast(`Vui lòng chờ ${timer}s trước khi gửi lại.`, "error");
            return;
        }

        setLoading(true);
        try {
            const res = await forgotPassword(values.email);
            const successMsg =
                res?.message || "Đã gửi email khôi phục mật khẩu!";
            window.showToast(successMsg);
            setEmailSent(true);
            setTimer(60);

            // Lưu thời gian gửi email để chống spam
            localStorage.setItem("lastForgotTime", Date.now().toString());

            setTimeout(() => {
                navigate("/verify-otp", { state: { email: values.email } });
            }, 1500);
        } catch (err) {
            const errorMsg =
                err?.response?.data?.message?.replace(/^\[.*?\]\s*/, "") ||
                err?.message ||
                "Có lỗi xảy ra, vui lòng thử lại!";
            window.showToast(errorMsg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#fcf7f8",
                padding: 20,
            }}
        >
            <Card
                style={{
                    width: "100%",
                    maxWidth: 560,
                    borderRadius: 20,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
                    textAlign: "center",
                    padding: "60px 50px",
                    backgroundColor: "#fff",
                }}
            >
                {!emailSent ? (
                    <>
                        <Title
                            level={2}
                            style={{
                                color: "#237486",
                                marginBottom: 12,
                                fontWeight: 700,
                            }}
                        >
                            Quên mật khẩu
                        </Title>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 16,
                                lineHeight: 1.6,
                                color: "#666",
                            }}
                        >
                            Nhập địa chỉ email và chúng tôi sẽ gửi cho bạn liên
                            kết để đặt lại mật khẩu.
                        </Text>

                        <Form
                            layout="vertical"
                            size="large"
                            onFinish={onFinish}
                            style={{ marginTop: 36, textAlign: "left" }}
                        >
                            <Form.Item
                                label={<strong>Email</strong>}
                                name="email"
                                rules={[
                                    { required: true, message: "Vui lòng nhập email!" },
                                    { type: "email", message: "Email không hợp lệ!" },
                                ]}
                            >
                                <Input
                                    prefix={
                                        <MailOutlined
                                            style={{ color: "#237486" }}
                                        />
                                    }
                                    placeholder="vd: example@gmail.com"
                                    style={{
                                        height: 48,
                                        borderRadius: 10,
                                        fontSize: 16,
                                    }}
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                disabled={timer > 0}
                                style={{
                                    height: 48,
                                    backgroundColor:
                                        timer > 0 ? "#cccccc" : "#237486",
                                    borderColor:
                                        timer > 0 ? "#cccccc" : "#237486",
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    fontSize: 16,
                                }}
                            >
                                {timer > 0
                                    ? `Gửi lại sau ${timer}s`
                                    : "Gửi email khôi phục"}
                            </Button>
                        </Form>

                        <div style={{ marginTop: 20, textAlign: "center" }}>
                            <Link
                                to="/login"
                                style={{
                                    color: "#237486",
                                    fontSize: 15,
                                    display: "inline-flex",
                                    alignItems: "center",
                                }}
                            >
                                <ArrowLeftOutlined style={{ marginRight: 6 }} />
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <CheckCircleOutlined
                            style={{
                                fontSize: 72,
                                color: "#28a745",
                                marginBottom: 20,
                            }}
                        />
                        <Title
                            level={2}
                            style={{ color: "#237486", marginBottom: 12 }}
                        >
                            Email đã được gửi!
                        </Title>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 16,
                                lineHeight: 1.6,
                                color: "#666",
                            }}
                        >
                            Vui lòng kiểm tra hộp thư của bạn để đặt lại mật khẩu.
                        </Text>

                        <Button
                            type="primary"
                            block
                            style={{
                                marginTop: 28,
                                backgroundColor:
                                    timer > 0 ? "#ccc" : "#237486",
                                borderColor:
                                    timer > 0 ? "#ccc" : "#237486",
                                borderRadius: 10,
                                height: 48,
                                fontSize: 16,
                                fontWeight: 600,
                            }}
                            disabled={timer > 0}
                            onClick={() => {
                                setTimer(60);
                                localStorage.setItem("lastForgotTime", Date.now().toString());
                            }}
                        >
                            {timer > 0
                                ? `Gửi lại sau ${timer}s`
                                : "Gửi lại email"}
                        </Button>

                        <div style={{ marginTop: 24 }}>
                            <Link
                                to="/login"
                                style={{
                                    color: "#237486",
                                    textDecoration: "none",
                                    fontWeight: 500,
                                    fontSize: 15,
                                }}
                            >
                                <ArrowLeftOutlined style={{ marginRight: 6 }} />
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;
