import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import {
    MailOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/AuthenticationServices";
import { extractErrorMessage } from "../../utils/Validation";

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
            const successMsg = res?.message || "Đã gửi email khôi phục mật khẩu!";
            window.showToast(successMsg);
            setEmailSent(true);
            setTimer(60);
            localStorage.setItem("lastForgotTime", Date.now().toString());

            setTimeout(() => {
                navigate("/verify-otp", { state: { email: values.email } });
            }, 1500);
        } catch (err) {
            const errorMessage = extractErrorMessage(err, "Có lỗi xảy ra vui lòng thử lại!")
            window.showToast(errorMessage, "error");
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
                background: "linear-gradient(135deg, #FFF3E0, #fcf7f8)",
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
                                color: "#FE9F43",
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
                            Nhập địa chỉ email và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
                        </Text>

                        <Form
                            layout="vertical"
                            size="large"
                            onFinish={onFinish}
                            style={{ marginTop: 36, textAlign: "left" }}
                        >
                            <Form.Item
                                label={
                                    <strong>
                                        Email <span style={{ color: "red" }}>*</span>
                                    </strong>
                                }
                                required={false}
                                name="email"
                                rules={[
                                    { required: true, message: "Vui lòng nhập email!" },
                                    { type: "email", message: "Email không hợp lệ!" },
                                ]}
                            >
                                <Input
                                    prefix={
                                        <MailOutlined
                                            style={{ color: "#FE9F43" }}
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
                                        timer > 0 ? "#cccccc" : "#FE9F43",
                                    borderColor:
                                        timer > 0 ? "#cccccc" : "#FE9F43",
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
                                color: "#4CAF50",
                                marginBottom: 20,
                            }}
                        />
                        <Title
                            level={2}
                            style={{ color: "#FE9F43", marginBottom: 12 }}
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
                                    timer > 0 ? "#ccc" : "#FE9F43",
                                borderColor:
                                    timer > 0 ? "#ccc" : "#FE9F43",
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
                                    color: "#FE9F43",
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
