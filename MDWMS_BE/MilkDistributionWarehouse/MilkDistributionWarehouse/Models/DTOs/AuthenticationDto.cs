using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Email không được để trống!")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ!")]
        [MaxLength(255, ErrorMessage = "Độ dài email không được vượt quá 255 ký tự.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống!")]
        public string Password { get; set; }
    }

    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "Email không được để trống!")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ!")]
        [MaxLength(255, ErrorMessage = "Độ dài email không được vượt quá 255 ký tự.")]
        public string Email { get; set; }
    }

    public class VerifyOtpDto
    {
        [Required(ErrorMessage = "Email không được bỏ trống.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [MaxLength(255, ErrorMessage = "Độ dài email không được vượt quá 255 ký tự.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Otp không được để trống!")]
        [MaxLength(255, ErrorMessage = "Độ dài OTP không được vượt quá 6 ký tự.")]
        public string OtpCode { get; set; }
    }

    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "Email không được để trống!")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống!")]
        [StringLength(20, MinimumLength = 6, ErrorMessage = "Mật khẩu có độ dài 6 đến 20 ký tự")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=<>?]).+$", ErrorMessage = "Mật khẩu chứa ít nhất một chữ hoa và một ký tự đặc biệt.")]
        public string NewPassword { get; set; }

        [Required(ErrorMessage = "Mật khẩu xác nhận không được để trống!")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không trùng!")]
        public string ConfirmNewPassword { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "Mật khẩu không được để trống!")]
        public string OldPassword { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống!")]
        [StringLength(20, MinimumLength = 6, ErrorMessage = "Mật khẩu có độ dài 6 đến 20 ký tự")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=<>?]).+$", ErrorMessage = "Mật khẩu chứa ít nhất một chữ hoa và một ký tự đặc biệt.")]
        public string NewPassword { get; set; }

        [Required(ErrorMessage = "Mật khẩu xác nhận không được để trống!")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không trùng!")]
        public string ConfirmNewPassword { get; set; }
    }

    public class AuthenticationDto
    {
        public string JwtToken { get; set; }
        public string RefreshToken { get; set; }
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public List<string> Roles { get; set; } = new List<string>(); 
    }

    public class JwtTokenDto
    {
        public string Token { get; set; }
    }

    public class RefreshTokenDto
    {
        public string Token { get; set; }
    }

}
