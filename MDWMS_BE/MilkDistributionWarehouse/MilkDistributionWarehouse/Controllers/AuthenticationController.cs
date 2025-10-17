using MilkDistributionWarehouse.Services;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Utilities;
using Microsoft.AspNetCore.Authorization;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly IAuthenticatonService _iAuthService;

        public AuthenticationController(IAuthenticatonService authenticaton)
        {
            _iAuthService = authenticaton;
        }

        [HttpPost("Login")]
        public async Task<IActionResult> DoLogin(LoginDto loginDto)
        {
            var (msg, authen) = await _iAuthService.Dologin(loginDto);
            if(msg.Length > 0) return ApiResponse<string>.ToResultError(msg);
            
            return ApiResponse<AuthenticationDto>.ToResultOk(authen);
        }

        [HttpPost("RefreshToken")]
        public async Task<IActionResult> GetNewJwtToken(RefreshTokenDto refreshTokenDto)
        {
            var (msg, jwtDto) = await _iAuthService.GetNewJwtToken(refreshTokenDto);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<JwtTokenDto>.ToResultOk(jwtDto);
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto forgotPasswordDto)
        {
            string msg = await _iAuthService.RequestForgotPassword(forgotPasswordDto.Email);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage("Mã OTP đã được gửi thành công!");
        }

        [HttpPost("VerifyOtp")]
        public async Task<IActionResult> VerifyOtp(VerifyOtpDto verifyOtpDto)
        {
            string msg = await _iAuthService.VerifyForgotPasswordOtp(verifyOtpDto);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage("Xác minh OTP thành công!");
        }

        [HttpPut("ResetPassword")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            var (msg, authenDto) = await _iAuthService.ResetPassword(resetPasswordDto);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<AuthenticationDto>.ToResultOk(authenDto, "Đặt lại mật khẩu thành công.");
        }

        [Authorize]
        [HttpPut("Logout")]
        public async Task<IActionResult> DoLogout()
        {
            string msg = await _iAuthService.DoLogout(User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize]
        [HttpPut("ChangePassword")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            var (msg, authenDto) = await _iAuthService.ChangePassword(User.GetUserId(), changePasswordDto);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<AuthenticationDto>.ToResultOk(authenDto, "Đổi mật khẩu thành công.");
        }
    }
}
