import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../../services/AuthenticationServices";
import { cleanErrorMessage, extractErrorMessage } from "../../../utils/Validation";
import { cn } from "../../../utils/cn";


export const LoginFormWithLogic = ({
    input,
    submit,
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                window.showToast("Đăng nhập thành công!", "success");
                navigate("/admin/dashboard");
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
        <form onSubmit={handleSubmit} className="relative pt-4 lg:pt-6">
            <div className="space-y-2">
                {/* Email Field */}
                <div className="relative">
                    <label className="block text-sm font-medium text-white mb-1">Email *</label>
                    {input({
                        value: email,
                        onChange: (e) => { setEmail(e.target.value); setErrorMessage(""); },
                        type: "email",
                        required: true,
                        placeholder: "example@gmail.com"
                    })}
                </div>

                {/* Password Field */}
                <div className="relative">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-white">Mật khẩu *</label>
                        <Link to="/forgot-password" className="text-sm text-white hover:underline">Quên mật khẩu?</Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                            placeholder="Nhập mật khẩu của bạn"
                            className="w-full h-11 px-6 pr-12 border-2 border-white/50 rounded-full bg-white/20 text-white placeholder-white/70 focus:outline-none focus:border-white/80 min-w-72 md:min-w-80 lg:min-w-96"
                            required
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                {showPassword ? (
                                    <>
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {errorMessage && (
                    <div className="text-base font-bold text-red-500 mt-2 text-center">
                        {errorMessage}
                    </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                    {submit({
                        type: "submit",
                        children: loading ? "Đang đăng nhập..." : "Đăng nhập",
                        disabled: loading
                    })}
                </div>
            </div>
        </form>
    );
};
