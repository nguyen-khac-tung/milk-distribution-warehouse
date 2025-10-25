using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUserOtpRepository
    {
        Task<UserOtp?> GetUserOtpByEmail(string email);
        Task<string> CreateUserOtp(UserOtp userOtp);
        Task<string> UpdateUserOtp(UserOtp userOtp);
    }


    public class UserOtpRepository : IUserOtpRepository
    {
        private readonly WarehouseContext _context;

        public UserOtpRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<UserOtp?> GetUserOtpByEmail(string email)
        {
            return await _context.UserOtps.Where(u => u.Email == email).FirstOrDefaultAsync();
        }

        public async Task<string> CreateUserOtp(UserOtp userOtp)
        {
            try
            {
                await _context.UserOtps.AddAsync(userOtp);
                await _context.SaveChangesAsync();
                return "";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        public async Task<string> UpdateUserOtp(UserOtp userOtp)
        {
            try
            {
                _context.UserOtps.Update(userOtp);
                await _context.SaveChangesAsync();
                return "";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }
    }
}
