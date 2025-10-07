using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUserRepository
    {
        public User? GetUserById(int userId);

        public User? GetUserByEmail(string email);
    }

    public class UserRepository: IUserRepository
    {
        private readonly WarehouseContext _context;

        public UserRepository(WarehouseContext context)
        {
            _context = context;
        }

        public User? GetUserByEmail(string email)
        {
            if(email.IsNullOrEmpty()) return null;
            return _context.Users
                .Include(u => u.Roles)
                .Where(u => u.Email == email && u.Status != CommonStatus.Deleted)
                .FirstOrDefault();
        }

        public User? GetUserById(int userId)
        {
            return _context.Users
                .Where(u => u.UserId == userId && u.Status != CommonStatus.Deleted)
                .FirstOrDefault();
        }
    }
}
