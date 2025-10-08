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
        public IResult DoLogin(LoginDto loginDto)
        {
            string msg = _iAuthService.Dologin(loginDto, out AuthenticationDto authen);
            if(msg.Length > 0) return ApiResponse<string>.ToResultError(msg);
            
            return ApiResponse<AuthenticationDto>.ToResultOk(authen);
        }

        [HttpPost("RefreshToken")]
        public IResult GetNewJwtToken(RefreshTokenDto refreshTokenDto)
        {
            string msg = _iAuthService.GetNewJwtToken(refreshTokenDto, out JwtTokenDto jwtDto);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<JwtTokenDto>.ToResultOk(jwtDto);
        }

        [HttpPost("ForgotPassword")]
        public IResult ForgotPassword(ForgotPasswordDto forgotPasswordDto)
        {
            string msg = _iAuthService.RequestForgotPassword(forgotPasswordDto.Email);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOk();
        }

        [HttpPost("VerifyOtp")]
        public IResult VerifyOtp(VerifyOtpDto verifyOtpDto)
        {
            string msg = _iAuthService.VerifyForgotPasswordOtp(verifyOtpDto);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOk();
        }

        [HttpPost("ResetPassword")]
        public IResult ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            string msg = _iAuthService.ResetPassword(resetPasswordDto, out AuthenticationDto authenDto);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<AuthenticationDto>.ToResultOk(authenDto);
        }

        [HttpGet("Logout")]
        public IResult DoLogout()
        {
            string msg = _iAuthService.DoLogout(User.GetUserId());
            if(msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOk();
        }

    }
}
