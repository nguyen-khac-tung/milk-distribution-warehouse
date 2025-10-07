using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MilkDistributionWarehouse.Services
{
    public interface IAuthenticatonService
    {
        public string Dologin(LoginDto loginDto, out AuthenticationDto authen);
        public string GetNewJwtToken(RefreshTokenDto refreshTokenDto, out JwtTokenDto jwtDto);
        public string DoLogout(int? userId);
    }


    public class AuthenticatonService : IAuthenticatonService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IConfiguration _iConfig;

        public AuthenticatonService(IUserRepository userRepository,
                                    IRefreshTokenRepository refreshTokenRepository,
                                    IConfiguration configuration)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
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
    }
}
