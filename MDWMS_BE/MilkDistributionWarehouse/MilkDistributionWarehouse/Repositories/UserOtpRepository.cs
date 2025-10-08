using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUserOtpRepository {
        public UserOtp? GetUserOtpByEmail(string email);
        public void CreateUserOtp(UserOtp userOtp);
        public void UpdateUserOtp(UserOtp userOtp);
    }


    public class UserOtpRepository : IUserOtpRepository
    {
        private readonly WarehouseContext _context;

        public UserOtpRepository(WarehouseContext context)
        {
            _context = context;
        }

        public UserOtp? GetUserOtpByEmail(string email)
        {
            return _context.UserOtps.Where(u => u.Email == email).FirstOrDefault();
        }

        public void CreateUserOtp(UserOtp userOtp)
        {
            _context.UserOtps.Add(userOtp);
            _context.SaveChanges();
        }

        public void UpdateUserOtp(UserOtp userOtp)
        {
            _context.UserOtps.Update(userOtp);
            _context.SaveChanges();
        }
    }
}
