using BCrypt.Net;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using Online_Learning.Services.Ultilities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MilkDistributionWarehouse.Services
{
    public interface IAuthenticatonService
    {
        public string Dologin(LoginDto loginDto, out AuthenticationDto authen);
        public string GetNewJwtToken(RefreshTokenDto refreshTokenDto, out JwtTokenDto jwtDto);
        public string RequestForgotPassword(string email);
        public string VerifyForgotPasswordOtp(VerifyOtpDto verifyOtp);
        public string ResetPassword(ResetPasswordDto resetPasswordDto, out AuthenticationDto authenDto);
        public string DoLogout(int? userId);
    }


    public class AuthenticatonService : IAuthenticatonService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUserOtpRepository _userOtpRepository;
        private readonly EmailUtility _emailUtility;
        private readonly IConfiguration _iConfig;

        public AuthenticatonService(IUserRepository userRepository,
                                    IRefreshTokenRepository refreshTokenRepository,
                                    IUserOtpRepository userOtpRepository,
                                    EmailUtility emailUtility,
                                    IConfiguration configuration)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _userOtpRepository = userOtpRepository;
            _emailUtility = emailUtility;
            _iConfig = configuration;
        }

        public string Dologin(LoginDto loginDto, out AuthenticationDto authen)
        {
            authen = new AuthenticationDto();
            var user = _userRepository.GetUserByEmail(loginDto.Email);
            if (user == null) return "Email hoặc mật khẩu không đúng!".ToMessageForUser();
            if (user.Status == CommonStatus.Inactive) return "Tài khoản này đã bị vô hiệu".ToMessageForUser();

            bool IsCorrectPassword = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password);
            if (!IsCorrectPassword) return "Email hoặc mật khẩu không đúng!".ToMessageForUser();

            authen = GetAuthResponse(user);
            return "";
        }

        public string GetNewJwtToken(RefreshTokenDto refreshTokenDto, out JwtTokenDto jwtDto)
        {
            jwtDto = new JwtTokenDto();
            var refreshToken = _refreshTokenRepository.GetRefreshTokenByToken(refreshTokenDto.Token);
            if (refreshToken == null || refreshToken.ExpiryDate < DateTime.Now || refreshToken.IsRevoked == true)
                return "Refresh Token is not valid";

            jwtDto.Token = GenerateJwtToken(refreshToken.User);
            return "";
        }

        public string RequestForgotPassword(string email)
        {
            var user = _userRepository.GetUserByEmail(email);
            if (user == null) return "Email không tồn tại trong hệ thống!".ToMessageForUser();
            if (user.Status == CommonStatus.Inactive) return "Tài khoản này đã bị vô hiệu".ToMessageForUser();

            try
            {
                var otp = GenerateOtp(email);
                SendOtpByEmail(email, otp);
            }
            catch (Exception ex)
            {
                return "Có lỗi xảy ra trong quá trình gửi OTP. Vui lòng thử lại".ToMessageForUser();
            }
            return "";
        }

        public string VerifyForgotPasswordOtp(VerifyOtpDto verifyOtp)
        {
            var userOtp = _userOtpRepository.GetUserOtpByEmail(verifyOtp.Email);
            if (userOtp == null || userOtp.OtpCode != verifyOtp.OtpCode || userOtp.UsedAt != null)
                return "Mã OTP không hợp lệ. Vui lòng thử lại!".ToMessageForUser();
            if (userOtp.ExpiresAt < DateTime.Now)
                return "Mã OTP đã hết hạn. Vui lòng thử lại!".ToMessageForUser();

            return "";
        }

        public string ResetPassword(ResetPasswordDto resetPasswordDto, out AuthenticationDto authenDto)
        {
            authenDto = new AuthenticationDto();
            var user = _userRepository.GetUserByEmail(resetPasswordDto.Email);
            if (user == null) return "User not found";

            user.Password = BCrypt.Net.BCrypt.HashPassword(resetPasswordDto.NewPassword);
            _userRepository.UpdateUser(user);

            authenDto = GetAuthResponse(user);
            return "";
        }

        public string DoLogout(int? userId)
        {
            if (userId == null) return "Error is the UserId is null";
            var refreshToken = _refreshTokenRepository.GetRefreshTokenByUserId(userId);
            if (refreshToken != null)
            {
                refreshToken.IsRevoked = true;
                _refreshTokenRepository.UpdateRefreshToken(refreshToken);
            }
            return "";
        }

        private string GenerateOtp(string email)
        {
            var otpCode = new Random().Next(000000, 999999).ToString();
            var otpExpires = DateTime.Now.AddMinutes(double.Parse(_iConfig["OtpCode:ExpireMinutes"]));
            var oldUserOtp = _userOtpRepository.GetUserOtpByEmail(email);
            if (oldUserOtp == null)
            {
                var userOtp = new UserOtp()
                {
                    Email = email,
                    OtpCode = otpCode,
                    ExpiresAt = otpExpires,
                    CreatedAt = DateTime.Now,
                };
                _userOtpRepository.CreateUserOtp(userOtp);
            }
            else
            {
                oldUserOtp.OtpCode = otpCode;
                oldUserOtp.ExpiresAt = otpExpires;
                oldUserOtp.UsedAt = null;
                _userOtpRepository.UpdateUserOtp(oldUserOtp);
            }
            return otpCode;
        }

        private AuthenticationDto GetAuthResponse(User user)
        {
            var auth = new AuthenticationDto()
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                Roles = user.Roles.Select(u => u.RoleName).ToList(),
                JwtToken = GenerateJwtToken(user),
                RefreshToken = GenerateRefreshToken(user)
            };
            return auth;
        }

        private string GenerateRefreshToken(User user)
        {
            var token = Guid.NewGuid().ToString();
            var oldRefreshToken = _refreshTokenRepository.GetRefreshTokenByUserId(user.UserId);

            if (oldRefreshToken == null)
            {
                var newRefreshToken = new RefreshToken
                {
                    Token = token,
                    ExpiryDate = DateTime.Now.AddDays(double.Parse(_iConfig["Refresh:ExpireDays"])),
                    IsRevoked = false,
                    UpdateAt = DateTime.Now,
                    UserId = user.UserId,
                    CreateAt = DateTime.Now
                };
                _refreshTokenRepository.CreateRefreshToken(newRefreshToken);
            }
            else
            {
                oldRefreshToken.Token = token;
                oldRefreshToken.ExpiryDate = DateTime.Now.AddDays(double.Parse(_iConfig["Refresh:ExpireDays"]));
                oldRefreshToken.IsRevoked = false;
                oldRefreshToken.UpdateAt = DateTime.Now;
                _refreshTokenRepository.UpdateRefreshToken(oldRefreshToken);
            }

            return token;
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_iConfig["Jwt:Key"]));

            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName)
            };

            foreach (var role in user.Roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role.RoleName));
            }

            var token = new JwtSecurityToken(
                issuer: _iConfig["Jwt:Issuer"],
                audience: _iConfig["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(double.Parse(_iConfig["Jwt:ExpireMinutes"])),
                signingCredentials: credentials
                );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private void SendOtpByEmail(string toEmail, string otpCode)
        {
            string emailBody = $"Your verification code is: <h2>{otpCode}</h2>This code will expire in 5 minutes.";
            _emailUtility.SendMail(toEmail, "Account Verification OTP", emailBody);
        }
    }
}
