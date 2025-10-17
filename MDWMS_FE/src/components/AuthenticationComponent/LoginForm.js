import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Link, useNavigate } from "react-router-dom";
import { message, Spin } from "antd"; // dùng thông báo của antd cho tiện
import { login } from "../../services/AuthenticationServices"; // ✅ import service login
import { extractErrorMessage } from "../../utils/Validation";

export function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            window.showToast(extractErrorMessage("Vui lòng nhập đầy đủ thông tin đăng nhập."), "error");
            return;
        }

        setLoading(true);
        try {
            const res = await login({ email, password });
            console.log("Login response:", res);

            if (res.success) {
                // message.success("Đăng nhập thành công!");
                window.showToast(
                    `Đăng nhập thành công!`,
                    "success"
                );

                // Điều hướng sau khi đăng nhập thành công
                navigate("/admin/dashboard");
            } else {
                window.showToast(extractErrorMessage(res.message || "Đăng nhập thất bại!"), "error");
            }
        } catch (error) {
            console.error("Error in login form:", error);
            if (error.message === "Network Error" || !error.response) {
                window.showToast("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc server!", "error");
            }
            else if (error.response && error.response.data && error.response.data.message) {
                window.showToast(extractErrorMessage(error.response.data.message), "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Logo / Thương hiệu */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-8">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-[100px] h-[100px] object-contain"
                    />
                    <span className="text-xl font-semibold text-foreground">
                        HỆ THỐNG PHÂN PHỐI KHO SỮA
                    </span>
                </div>

                <h2 className="text-4xl font-serif text-foreground leading-tight">
                    Đăng nhập vào tài khoản của bạn
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                    Nhập thông tin đăng nhập để truy cập vào không gian làm việc
                </p>
            </div>

            {/* Form đăng nhập */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email <span style={{ color: "red" }}>*</span>
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="example@gmai.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">
                            Mật khẩu <span style={{ color: "red" }}>*</span>
                        </Label>
                        <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:underline"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Nhập mật khẩu của bạn"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11 pr-10"
                        />

                        {/* Eye toggle button */}
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            className="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground hover:text-foreground"
                        >
                            {/* single SVG with optional slash to avoid layout shift */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                                {showPassword && (
                                    // simple slash line across the icon when showing password (eye with slash)
                                    <line x1="3" y1="3" x2="21" y2="21" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 text-base login-button"
                    disabled={loading}
                >
                    {loading ? <Spin size="small" /> : "Đăng nhập"}
                </Button>
            </form>
        </div>
    );
}
