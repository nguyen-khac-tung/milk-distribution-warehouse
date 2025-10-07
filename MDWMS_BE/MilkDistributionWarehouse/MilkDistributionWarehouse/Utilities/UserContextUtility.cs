using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MilkDistributionWarehouse.Utilities
{
    public static class UserContextUtility
    {
        public static int? GetUserId(this ClaimsPrincipal user)
        {
            var userId = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
                user.FindFirstValue(ClaimTypes.NameIdentifier);
            if(userId == null) return null;

            return int.Parse(userId);
        }

        public static string? GetUserEmail(this ClaimsPrincipal user)
        {
            return user.FindFirstValue(JwtRegisteredClaimNames.Email);
        }

        public static string? GetUserName(this ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Name);
        }

        public static List<string>? GetUserRole(this ClaimsPrincipal user)
        {
            return user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        }
    }
}
