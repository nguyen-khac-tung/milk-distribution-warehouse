import React, { useState, useEffect, useRef } from "react";
import { Card, Typography, Button, Input, message } from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verifyOtp, forgotPassword } from "../../services/AuthenticationServices";
import { extractErrorMessage } from "../../utils/Validation";

const { Title, Text } = Typography;

const VerifyOtpPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);

    // FE chỉ đếm ngược để giới hạn "gửi lại mã" → không liên quan đến hết hạn thật
    const [resendTimer, setResendTimer] = useState(60);
    const inputRefs = useRef([]);

    // Đếm ngược resend
    useEffect(() => {
        if (resendTimer <= 0) return;
        const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendTimer]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleChange = (value, index) => {
        if (/^\d?$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            if (value && index < 5) inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async () => {
        const otpCode = otp.join("");
        if (otpCode.length < 6) {
            message.warning("Vui lòng nhập đủ 6 số OTP!");
            return;
        }

        setLoading(true);
        try {
            const res = await verifyOtp(email, otpCode);
            window.showToast(res?.message || "Xác minh OTP thành công!", "success");
            setTimeout(() => {
                navigate("/reset-password", { state: { email } });
            }, 1000);
        } catch (err) {
            const errorMessage = extractErrorMessage(err, "Mã OTP không hợp lệ hoặc đã hết hạn!");
            window.showToast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await forgotPassword(email);
            window.showToast("Đã gửi lại mã OTP!", "success");
            setResendTimer(60);
            setOtp(["", "", "", "", "", ""]);
        } catch (err) {
            const errorMessage = extractErrorMessage(err, "Có lỗi xảy ra vui lòng thử lại!");
            window.showToast(errorMessage, "error");
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
                    maxWidth: 500,
                    borderRadius: 16,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                    textAlign: "center",
                    padding: "48px 40px",
                }}
            >
                <Title level={3} style={{ color: "#FE9F43", marginBottom: 8, fontSize: 32 }}>
                    Nhập mã OTP
                </Title>
                <Text type="secondary">
                    Mã xác minh đã được gửi đến email: <b>{email}</b>
                </Text>

                {/* Ô nhập OTP */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 10,
                        marginTop: 30,
                        marginBottom: 20,
                    }}
                >
                    {otp.map((digit, index) => (
                        <Input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            value={digit}
                            onChange={(e) => handleChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            maxLength={1}
                            style={{
                                width: 48,
                                height: 48,
                                textAlign: "center",
                                fontSize: 22,
                                borderRadius: 8,
                                border: "1px solid #d9d9d9",
                            }}
                        />
                    ))}
                </div>

                {/* Thông báo thời gian gửi lại */}
                {resendTimer > 0 ? (
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        Bạn có thể gửi lại mã sau{" "}
                        <span style={{ color: "#FE9F43", fontWeight: 600 }}>
                            {formatTime(resendTimer)}
                        </span>
                    </Text>
                ) : (
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        Bạn có thể gửi lại mã ngay bây giờ
                    </Text>
                )}

                {/* Nút xác minh */}
                <Button
                    type="primary"
                    block
                    loading={loading}
                    onClick={handleSubmit}
                    style={{
                        height: 42,
                        backgroundColor: "#FE9F43",
                        borderColor: "#FE9F43",
                        borderRadius: 8,
                        fontWeight: 500,
                        marginTop: 24,
                    }}
                >
                    Xác minh OTP
                </Button>

                {/* Nút gửi lại mã OTP */}
                <Button
                    icon={<ReloadOutlined />}
                    onClick={handleResendOtp}
                    block
                    disabled={resendTimer > 0}
                    style={{
                        marginTop: 12,
                        height: 42,
                        borderRadius: 8,
                        borderColor: "#FE9F43",
                        color: resendTimer > 0 ? "#999" : "#FE9F43",
                        fontWeight: 500,
                    }}
                >
                    Gửi lại mã OTP
                </Button>

                {/* Quay lại */}
                <div style={{ marginTop: 20 }}>
                    <Link to="/forgot-password" style={{ color: "#333" }}>
                        <ArrowLeftOutlined /> Quay lại
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default VerifyOtpPage;
