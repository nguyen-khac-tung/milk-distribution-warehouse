using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetUserById(int? userId);
        Task<User?> GetUserByEmail(string email);
        Task<string> UpdateUser(User user);
    }

    public class UserRepository : IUserRepository
    {
        private readonly WarehouseContext _context;

        public UserRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByEmail(string email)
        {
            if (email.IsNullOrEmpty()) return null;
            return await _context.Users
                .Include(u => u.Roles)
                .Where(u => u.Email == email && u.Status != CommonStatus.Deleted)
                .FirstOrDefaultAsync();
        }

        public async Task<User?> GetUserById(int? userId)
        {
            return await _context.Users
                .Include(u => u.Roles)
                .Where(u => u.UserId == userId && u.Status != CommonStatus.Deleted)
                .FirstOrDefaultAsync();
        }

        public async Task<string> UpdateUser(User user)
        {
            try
            {
                _context.Users.Update(user);
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
