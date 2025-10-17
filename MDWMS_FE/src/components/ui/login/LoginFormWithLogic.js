import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../../services/AuthenticationServices";
import { extractErrorMessage } from "../../../utils/Validation";
import { cn } from "../../../utils/cn";

const FormStateMessage = ({ children }) => {
    return <div className="relative">{children}</div>;
};

const SubmissionStateMessage = ({ value, reset }) => {
    React.useEffect(() => {
        if (value?.success === false) {
            const timer = setTimeout(() => {
                reset();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [value, reset]);

    return (
        <FormStateMessage>
            {value?.success === true && (
                <div
                    className={cn(
                        "relative w-max rounded-full backdrop-blur-sm border px-4 py-1.5 lg:py-2 text-xs bg-green-500/20 border-green-500 text-green-500",
                        "absolute top-0 left-0 right-0 mx-auto w-max flex items-center gap-2"
                    )}
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium leading-none tracking-tight">{value.data}</span>
                </div>
            )}
        </FormStateMessage>
    )
}

export const LoginFormWithLogic = ({
    input,
    submit,
}) => {
    const [submissionState, setSubmissionState] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            setSubmissionState({ success: false, message: "Vui lòng nhập đầy đủ thông tin đăng nhập." });
            return;
        }

        setLoading(true);
        try {
            const res = await login({ email, password });
            console.log("Login response:", res);

            if (res.success) {
                setSubmissionState({ success: true, data: "Đăng nhập thành công!" });
                window.showToast("Đăng nhập thành công!", "success");
                navigate("/admin/dashboard");
            } else {
                setSubmissionState({ success: false, message: extractErrorMessage(res.message || "Đăng nhập thất bại!") });
                window.showToast(extractErrorMessage(res.message || "Đăng nhập thất bại!"), "error");
            }
        } catch (error) {
            console.error("Error in login form:", error);
            let errorMessage = "Đăng nhập thất bại!";
            
            if (error.message === "Network Error" || !error.response) {
                errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc server!";
            } else if (error.response && error.response.data && error.response.data.message) {
                errorMessage = extractErrorMessage(error.response.data.message);
            }
            
            setSubmissionState({ success: false, message: errorMessage });
            window.showToast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative pt-4 lg:pt-6">
            <SubmissionStateMessage value={submissionState} reset={() => setSubmissionState(null)} />

            {submissionState?.success === false && (
                <div
                    className={cn(
                        "relative w-max rounded-full backdrop-blur-sm border px-4 py-1.5 lg:py-2 text-xs bg-red-500/20 border-red-500 text-red-500",
                        "absolute top-0 left-0 right-0 mx-auto w-max flex items-center gap-2"
                    )}
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium leading-none tracking-tight">{submissionState.message}</span>
                </div>
            )}

            <div className="space-y-2">
                {/* Email Field */}
                <div className="relative">
                    <label className="block text-sm font-medium text-white mb-1">Email *</label>
                    {input({ 
                        value: email, 
                        onChange: (e) => setEmail(e.target.value),
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
                            onChange={(e) => setPassword(e.target.value)}
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
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </>
                                ) : (
                                    <>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

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
