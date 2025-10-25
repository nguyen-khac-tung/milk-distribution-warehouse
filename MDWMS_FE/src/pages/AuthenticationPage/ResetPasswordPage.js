import React, { useState } from "react";
import { Form, Input, Button, Typography, Card, Progress } from "antd";
import {
    LockOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/AuthenticationServices";

const { Title, Text } = Typography;

// Hàm đánh giá độ mạnh mật khẩu
const checkPasswordStrength = (password) => {
    let score = 0;
    const rules = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    Object.values(rules).forEach((r) => r && score++);

    let level = "Yếu";
    let color = "red";
    if (score >= 3 && score < 5) {
        level = "Trung bình";
        color = "orange";
    } else if (score === 5) {
        level = "Mạnh";
        color = "#28a745";
    }

    return { score, level, color, rules };
};

const ResetPasswordPage = () => {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        level: "Yếu",
        color: "red",
        rules: {},
    });

    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await resetPassword({
                email,
                newPassword: values.newPassword,
                confirmNewPassword: values.confirmNewPassword,
            });
            const msg = res?.message || "Đặt lại mật khẩu thành công!";
            window.showToast(msg);
            setDone(true);

            setTimeout(() => navigate("/login"), 4000);
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

    const renderRule = (label, condition) => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: condition ? "#28a745" : "#999",
                fontSize: 14,
            }}
        >
            {condition ? "✓" : "•"} {label}
        </div>
    );

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
                    maxWidth: 540,
                    borderRadius: 16,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                    textAlign: "center",
                    padding: "0px 40px",
                }}
            >
                {!done ? (
                    <>
                        <Title level={3} style={{ color: "#FE9F43", marginBottom: 8, fontSize: 32 }}>
                            Đặt lại mật khẩu
                        </Title>
                        <Text style={{ fontSize: 16 }} type="secondary">
                            Nhập mật khẩu mới cho tài khoản{" "}
                            <strong style={{ color: "#000" }}>{email || "của bạn"}</strong>.
                        </Text>

                        <Form
                            layout="vertical"
                            size="large"
                            onFinish={onFinish}
                            style={{ marginTop: 24 }}
                        >
                            <Form.Item
                                label={
                                    <>
                                        Mật khẩu mới <span style={{ color: "red" }}> *</span>
                                    </>
                                }
                                required={false}
                                name="newPassword"
                                rules={[
                                    { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Nhập mật khẩu mới"
                                    onChange={(e) =>
                                        setPasswordStrength(
                                            checkPasswordStrength(e.target.value)
                                        )
                                    }
                                />
                            </Form.Item>

                            {/* Thang đo độ mạnh */}
                            <Progress
                                percent={(passwordStrength.score / 5) * 100}
                                showInfo={false}
                                strokeColor={passwordStrength.color}
                                style={{ marginBottom: 6 }}
                            />
                            <Text
                                style={{
                                    color: passwordStrength.color,
                                    fontWeight: 500,
                                }}
                            >
                                {passwordStrength.level}
                            </Text>

                            {/* Danh sách yêu cầu hiển thị 2 cột, giống hình */}
                            <div
                                style={{
                                    marginTop: 10,
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    textAlign: "left",
                                    rowGap: 6,
                                    marginBottom: 12,
                                }}
                            >
                                {renderRule("Ít nhất 8 ký tự", passwordStrength.rules.length)}
                                {renderRule("1 chữ thường", passwordStrength.rules.lower)}
                                {renderRule("1 chữ hoa", passwordStrength.rules.upper)}
                                {renderRule("1 số", passwordStrength.rules.number)}
                                {renderRule(
                                    "1 ký tự đặc biệt",
                                    passwordStrength.rules.special
                                )}
                            </div>

                            <Form.Item
                                label={
                                    <>
                                        Xác nhận mật khẩu <span style={{ color: "red" }}>*</span>
                                    </>
                                }
                                required={false}
                                name="confirmNewPassword"
                                dependencies={["newPassword"]}
                                rules={[
                                    { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("newPassword") === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                "Mật khẩu xác nhận không khớp!"
                                            );
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                disabled={passwordStrength.score < 5}
                                style={{
                                    height: 42,
                                    backgroundColor:
                                        passwordStrength.score < 5
                                            ? "#ccc"
                                            : "#FE9F43",
                                    borderColor:
                                        passwordStrength.score < 5
                                            ? "#ccc"
                                            : "#FE9F43",
                                    borderRadius: 8,
                                    fontWeight: 500,
                                }}
                            >
                                Đặt lại mật khẩu
                            </Button>
                        </Form>

                        <div style={{ marginTop: 16, textAlign: "center" }}>
                            <Link
                                to="/login"
                                style={{
                                    color: "#333",
                                    fontSize: 15,
                                }}
                            >
                                <ArrowLeftOutlined /> Quay lại đăng nhập
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <CheckCircleOutlined
                            style={{ fontSize: 60, color: "#28a745", marginBottom: 16 }}
                        />
                        <Title level={3} style={{ color: "#FE9F43", marginBottom: 8 }}>
                            Thành công!
                        </Title>
                        <Text type="secondary">
                            Mật khẩu của bạn đã được thay đổi. Đang chuyển về trang đăng nhập...
                        </Text>
                    </>
                )}
            </Card>
        </div>
    );
};

export default ResetPasswordPage;
