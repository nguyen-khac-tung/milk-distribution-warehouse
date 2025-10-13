import React, { useState, useEffect, useRef } from "react";
import { Card, Typography, Button, Input, message } from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verifyOtp, forgotPassword } from "../../services/AuthenticationServices";

const { Title, Text } = Typography;

const VerifyOtpPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(90); // 1 phút 30 giây
    const [expired, setExpired] = useState(false);
    const inputRefs = useRef([]);

    // Đếm ngược
    useEffect(() => {
        if (timeLeft <= 0) {
            setExpired(true);
            return;
        }
        const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

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
        if (e.key === "Backspace" && !otp[index] && index > 0)
            inputRefs.current[index - 1].focus();
    };

    const handleSubmit = async () => {
        if (expired) {
            message.warning("Mã OTP đã hết hạn, vui lòng gửi lại!");
            return;
        }

        const otpCode = otp.join("");
        if (otpCode.length < 6) {
            message.warning("Vui lòng nhập đủ 6 số OTP!");
            return;
        }

        setLoading(true);
        try {
            const res = await verifyOtp(email, otpCode);
            window.showToast(res?.message || "Xác minh OTP thành công!", "success");

            // Sau khi xác minh thành công → chuyển sang Reset Password
            setTimeout(() => {
                navigate("/reset-password", { state: { email } });
            }, 1000);
        } catch (err) {
            const errorMsg =
                err?.response?.data?.message?.replace(/^\[.*?\]\s*/, "") ||
                err?.message ||
                "Mã OTP không hợp lệ!";
            window.showToast(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await forgotPassword(email);
            window.showToast("Đã gửi lại mã OTP!", "success");
            setTimeLeft(90);
            setExpired(false);
            setOtp(["", "", "", "", "", ""]);
        } catch (err) {
            const errorMsg =
                err?.response?.data?.message?.replace(/^\[.*?\]\s*/, "") ||
                err?.message ||
                "Không thể gửi lại mã OTP!";
            const cleanMsg = errorMsg.replace(/^\[[^\]]*\]\s*/, "")

            window.showToast(cleanMsg, "error");
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
                    maxWidth: 500,
                    borderRadius: 16,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                    textAlign: "center",
                    padding: "48px 40px",
                }}
            >
                <Title level={3} style={{ color: "#237486", marginBottom: 8 }}>
                    Nhập mã OTP
                </Title>
                <Text type="secondary">
                    Mã xác minh đã được gửi đến email: <b>{email}</b>
                </Text>

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
                            disabled={expired}
                            style={{
                                width: 48,
                                height: 48,
                                textAlign: "center",
                                fontSize: 22,
                                borderRadius: 8,
                                border: expired ? "1px solid #ccc" : "1px solid #d9d9d9",
                                backgroundColor: expired ? "#f5f5f5" : "white",
                            }}
                        />
                    ))}
                </div>

                {!expired ? (
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        Mã OTP sẽ hết hạn sau{" "}
                        <span style={{ color: "#237486", fontWeight: 600 }}>
                            {formatTime(timeLeft)}
                        </span>
                    </Text>
                ) : (
                    <Text type="danger" style={{ fontSize: 15 }}>
                        Mã OTP đã hết hạn!
                    </Text>
                )}

                <Button
                    type="primary"
                    block
                    loading={loading}
                    onClick={handleSubmit}
                    disabled={expired}
                    style={{
                        height: 42,
                        backgroundColor: "#237486",
                        borderColor: "#237486",
                        borderRadius: 8,
                        fontWeight: 500,
                        marginTop: 24,
                    }}
                >
                    Xác minh OTP
                </Button>

                {expired && (
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleResendOtp}
                        block
                        style={{
                            marginTop: 12,
                            height: 42,
                            borderRadius: 8,
                            borderColor: "#237486",
                            color: "#237486",
                            fontWeight: 500,
                        }}
                    >
                        Gửi lại mã OTP
                    </Button>
                )}

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
