﻿using BCrypt.Net;
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
        Task<(string, AuthenticationDto?)> Dologin(LoginDto loginDto);
        Task<(string, JwtTokenDto?)> GetNewJwtToken(RefreshTokenDto refreshTokenDto);
        Task<string> RequestForgotPassword(string email);
        Task<string> VerifyForgotPasswordOtp(VerifyOtpDto verifyOtp);
        Task<(string, AuthenticationDto?)> ResetPassword(ResetPasswordDto resetPasswordDto);
        Task<(string, AuthenticationDto?)> ChangePassword(int? userId, ChangePasswordDto changePasswordDto);
        Task<string> DoLogout(int? userId);
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

        public async Task<(string, AuthenticationDto?)> Dologin(LoginDto loginDto)
        {
            var user = await _userRepository.GetUserByEmail(loginDto.Email);
            if (user == null) return ("Email hoặc mật khẩu không đúng!".ToMessageForUser(), null);
            if (user.Status == CommonStatus.Inactive) return ("Tài khoản này đã bị vô hiệu".ToMessageForUser(), null);

            bool IsCorrectPassword = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password);
            if (!IsCorrectPassword) return ("Email hoặc mật khẩu không đúng!".ToMessageForUser(), null);

            var (msg, authen) = await GetAuthResponse(user);
            if (msg.Length > 0) return (msg, null);

            return ("", authen);
        }

        public async Task<(string, JwtTokenDto?)> GetNewJwtToken(RefreshTokenDto refreshTokenDto)
        {
            var refreshToken = await _refreshTokenRepository.GetRefreshTokenByToken(refreshTokenDto.Token);
            if (refreshToken == null || refreshToken.ExpiryDate < DateTime.Now || refreshToken.IsRevoked == true)
                return ("Refresh Token is not valid", null);

            var jwtDto = new JwtTokenDto
            {
                Token = GenerateJwtToken(refreshToken.User)
            };
            return ("", jwtDto);
        }

        public async Task<string> RequestForgotPassword(string email)
        {
            var user = await _userRepository.GetUserByEmail(email);
            if (user == null) return "Email không hợp lệ!".ToMessageForUser();
            if (user.Status == CommonStatus.Inactive) return "Tài khoản này đã bị vô hiệu hóa!".ToMessageForUser();

            try
            {
                var otp = await GenerateOtp(email);
                SendOtpByEmail(email, otp);
            }
            catch (Exception)
            {
                return "Có lỗi xảy ra trong quá trình gửi OTP. Vui lòng thử lại!".ToMessageForUser();
            }
            return "";
        }

        public async Task<string> VerifyForgotPasswordOtp(VerifyOtpDto verifyOtp)
        {
            var userOtp = await _userOtpRepository.GetUserOtpByEmail(verifyOtp.Email);
            if (userOtp == null || userOtp.OtpCode != verifyOtp.OtpCode || userOtp.UsedAt != null)
                return "Mã OTP không hợp lệ. Vui lòng thử lại!".ToMessageForUser();
            if (userOtp.ExpiresAt < DateTime.Now)
                return "Mã OTP đã hết hạn. Vui lòng thử lại!".ToMessageForUser();
            
            userOtp.UsedAt = DateTime.Now;
            var msg = await _userOtpRepository.UpdateUserOtp(userOtp);
            if (msg.Length > 0) return msg;

            return "";
        }

        public async Task<(string, AuthenticationDto?)> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            var user = await _userRepository.GetUserByEmail(resetPasswordDto.Email);
            if (user == null) return ("User not found", null);

            user.Password = BCrypt.Net.BCrypt.HashPassword(resetPasswordDto.NewPassword);
            var message = await _userRepository.UpdateUser(user);
            if(message.Length > 0) return (message, null);

            var (msg, authenDto) = await GetAuthResponse(user);
            if (msg.Length > 0) return (msg, null);

            return ("", authenDto);
        }

        public async Task<(string, AuthenticationDto?)> ChangePassword(int? userId, ChangePasswordDto changePasswordDto)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var user = await _userRepository.GetUserById(userId);
            if (user == null) return ("User not found", null);

            bool isOldPasswordCorrect = BCrypt.Net.BCrypt.Verify(changePasswordDto.OldPassword, user.Password);
            if(!isOldPasswordCorrect) return ("Mật khẩu cũ không chính xác!".ToMessageForUser(), null);

            user.Password = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
            var message = await _userRepository.UpdateUser(user);
            if (message.Length > 0) return (message, null);

            var (msg, authenDto) = await GetAuthResponse(user);
            if (msg.Length > 0) return (msg, null);

            return ("", authenDto);
        }

        public async Task<string> DoLogout(int? userId)
        {
            if (userId == null) return "Error is the UserId is null";
            var refreshToken = await _refreshTokenRepository.GetRefreshTokenByUserId(userId);
            if (refreshToken != null)
            {
                refreshToken.IsRevoked = true;
                var msg = await _refreshTokenRepository.UpdateRefreshToken(refreshToken);
                if(msg.Length > 0) return msg;
            }
            return "";
        }

        private async Task<string> GenerateOtp(string email)
        {
            var msg = string.Empty;
            var otpCode = new Random().Next(000000, 999999).ToString("D6");
            var otpExpires = DateTime.Now.AddMinutes(double.Parse(_iConfig["OtpCode:ExpireMinutes"]));
            var oldUserOtp = await _userOtpRepository.GetUserOtpByEmail(email);
            if (oldUserOtp == null)
            {
                var userOtp = new UserOtp()
                {
                    Email = email,
                    OtpCode = otpCode,
                    ExpiresAt = otpExpires,
                    CreatedAt = DateTime.Now,
                };
                msg = await _userOtpRepository.CreateUserOtp(userOtp);
            }
            else
            {
                oldUserOtp.OtpCode = otpCode;
                oldUserOtp.ExpiresAt = otpExpires;
                oldUserOtp.UsedAt = null;
                msg = await _userOtpRepository.UpdateUserOtp(oldUserOtp);
            }

            if (msg.Length > 0) throw new Exception(msg);

            return otpCode;
        }

        private async Task<(string, AuthenticationDto? auth)> GetAuthResponse(User user)
        {
            AuthenticationDto auth;
            try
            {
                auth = new AuthenticationDto()
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    FullName = user.FullName,
                    Roles = user.Roles.Select(u => u.RoleName).ToList(),
                    JwtToken = GenerateJwtToken(user),
                    RefreshToken = await GenerateRefreshToken(user)
                };
            }
            catch (Exception ex)
            {
                return (ex.Message, null);
            }
            return ("", auth);
        }

        private async Task<string> GenerateRefreshToken(User user)
        {
            var msg = string.Empty;
            var token = Guid.NewGuid().ToString();
            var oldRefreshToken = await _refreshTokenRepository.GetRefreshTokenByUserId(user.UserId);

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
                msg = await _refreshTokenRepository.CreateRefreshToken(newRefreshToken);
            }
            else
            {
                oldRefreshToken.Token = token;
                oldRefreshToken.ExpiryDate = DateTime.Now.AddDays(double.Parse(_iConfig["Refresh:ExpireDays"]));
                oldRefreshToken.IsRevoked = false;
                oldRefreshToken.UpdateAt = DateTime.Now;
                msg = await _refreshTokenRepository.UpdateRefreshToken(oldRefreshToken);
            }

            if (msg.Length > 0) throw new Exception(msg);

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

        private async Task SendOtpByEmail(string toEmail, string otpCode)
        {
            string uniqueId = DateTime.Now.Ticks.ToString();
            string emailBody = $@"
                <table cellpadding=""0"" cellspacing=""0"" border=""0"">
                    <tr>
                        <td>
                            Xin chào, <br><br>
                            Vui lòng sử dụng mã xác thực dưới đây để hoàn tất việc xác minh tài khoản của bạn. <br><br>
                            Mã xác thực của bạn là: <h2>{otpCode}</h2>
                            Lưu ý: Mã này chỉ có hiệu lực trong <strong>5 phút</strong>.
                            <span style='color:white; font-size:1px; display:none;'>{uniqueId}</span>
                        </td>
                    </tr>
                </table>";
            var msg = await _emailUtility.SendMail(toEmail, "Mã OTP xác minh tài khoản của bạn", emailBody);

            if (msg.Length > 0) throw new Exception(msg);
        }
    }
}
