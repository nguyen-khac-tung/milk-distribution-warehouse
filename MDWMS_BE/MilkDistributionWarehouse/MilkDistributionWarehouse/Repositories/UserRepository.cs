using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUserRepository
    {
        public User? GetUserById(int userId);
    }

    public class UserRepository: IUserRepository
    {
        private readonly WarehouseContext _context;

        public UserRepository(WarehouseContext context)
        {
            _context = context;
        }

        public User? GetUserById(int userId)
        {
            return _context.Users
                .Where(u => u.UserId == userId && u.Status != CommonStatus.Deleted)
                .FirstOrDefault();
        }
    }
}
