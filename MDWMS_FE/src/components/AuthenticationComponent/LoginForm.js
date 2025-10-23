import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { login } from "../../services/AuthenticationServices";
import { cleanErrorMessage, extractErrorMessage } from "../../utils/Validation";

export function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setErrorMessage("Vui lòng nhập đầy đủ thông tin đăng nhập.");
            return;
        }

        setLoading(true);
        try {
            const res = await login({ email, password });
            console.log("Login response:", res);

            if (res.success) {
                if (res.isFirstLogin === true) {
                    // Lần đầu đăng nhập, chuyển đến trang đổi mật khẩu
                    window.showToast(res.message, "info");
                    navigate("/change-password");
                } else {
                    // Đăng nhập bình thường
                    window.showToast("Đăng nhập thành công!", "success");
                    navigate("/");
                }
            } else {
                const m = cleanErrorMessage(res.message || "Sai email hoặc mật khẩu.");
                setErrorMessage(m);
            }
        } catch (error) {
            console.error("Error in login form:", error);
            const m = extractErrorMessage(error, "Đã xảy ra lỗi khi đăng nhập.");
            setErrorMessage(m);
        }
        finally {
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
                        onChange={(e) => { setEmail(e.target.value); setErrorMessage(""); }}
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
                            onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                            required
                            className="h-11 pr-10"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            className="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground hover:text-foreground"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                                {showPassword && (
                                    <line x1="3" y1="3" x2="21" y2="21" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {errorMessage && (
                    <div className="text-sm text-red-600 mt-2">
                        {errorMessage}
                    </div>
                )}

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
