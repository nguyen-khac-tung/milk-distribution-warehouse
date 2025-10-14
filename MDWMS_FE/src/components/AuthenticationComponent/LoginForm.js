import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { message, Spin } from "antd"; // dùng thông báo của antd cho tiện
import { login } from "../../services/AuthenticationServices"; // ✅ import service login

export function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            message.warning("Vui lòng nhập đầy đủ thông tin đăng nhập.");
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

                // ✅ Điều hướng sau khi đăng nhập thành công
                navigate("/admin/dashboard");
            } else {
                message.error(res.message || "Đăng nhập thất bại!");
            }
        } catch (error) {
            console.error("Error in login form:", error);
            message.error("Không thể đăng nhập. Vui lòng thử lại sau!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Logo / Thương hiệu */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 login-logo rounded flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-primary-foreground"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
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
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="ban@vidu.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">
                            Mật khẩu
                        </Label>
                        <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:underline"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Nhập mật khẩu của bạn"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11"
                    />
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
