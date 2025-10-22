import React, { useState } from "react";
import { Input, Button, Card } from "antd";
import { changePassword } from "../../services/AuthenticationServices";
import { useNavigate } from "react-router-dom";
import { cleanErrorMessage } from "../../utils/Validation";

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async () => {
        // Reset lỗi cũ
        setErrors({});

        // Validate client trước
        const newErrors = {};
        if (!oldPassword) newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
        if (!newPassword) newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
        if (newPassword && newPassword.length < 6)
            newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
        if (newPassword !== confirmPassword)
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const res = await changePassword({
                userId: userInfo.userId,
                oldPassword,
                newPassword,
                confirmNewPassword: confirmPassword,
            });

            if (res.success) {
                localStorage.setItem("forceChangePassword", "false");
                window.showToast("Đổi mật khẩu thành công!", "success");
                navigate("/dashboard");
            } else {
                const cleanedMsg = cleanErrorMessage(res.message || "Sai email hoặc mật khẩu.");
                setErrors({ server: cleanedMsg });
            }
        } catch (err) {
            setErrors({ server: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Card title="Đổi mật khẩu" className="w-[400px] shadow-md">
                <div className="space-y-4">
                    {/* Mật khẩu hiện tại */}
                    <div>
                        <Input.Password
                            placeholder="Mật khẩu hiện tại"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        {errors.oldPassword && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.oldPassword}
                            </p>
                        )}
                    </div>

                    {/* Mật khẩu mới */}
                    <div>
                        <Input.Password
                            placeholder="Mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        {errors.newPassword && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.newPassword}
                            </p>
                        )}
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div>
                        <Input.Password
                            placeholder="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* Lỗi từ server (VD: không có ký tự đặc biệt) */}
                    {errors.server && (
                        <p className="text-red-600 text-sm mt-2 text-center">
                            {errors.server}
                        </p>
                    )}

                    <Button
                        type="primary"
                        block
                        loading={loading}
                        onClick={handleSubmit}
                    >
                        Xác nhận
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ChangePassword;
