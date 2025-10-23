using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUserRepository
    {
        IQueryable<User> GetUsers();
        Task<User?> GetUserById(int? userId);
        Task<User?> GetUserByIdWithAssociations(int? userId);
        Task<User?> GetUserByEmail(string email);
        Task<string> CreateUser(User user);
        Task<string> UpdateUser(User user);

    }

    public class UserRepository : IUserRepository
    {
        private readonly WarehouseContext _context;

        public UserRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<User> GetUsers()
        {
            return _context.Users
                .Include(u => u.Roles)
                .Where(u => u.Status != CommonStatus.Deleted)
                .OrderByDescending(u => u.CreateAt)
                .AsNoTracking();
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

        public async Task<User?> GetUserByIdWithAssociations(int? userId)
        {
            return await _context.Users
                .Include(u => u.Batches)
                .Include(u => u.Pallets)
                .Include(u => u.GoodsIssueNotes)
                .Include(u => u.GoodsReceiptNotes)
                .Include(u => u.PurchaseOrderCreatedByNavigations)
                .Include(u => u.SalesOrderCreatedByNavigations)
                .Include(u => u.SalesOrderAcknowledgedByNavigations)
                .Include(u => u.SalesOrderApprovalByNavigations)
                .Include(u => u.SalesOrderAssignToNavigations)
                .Include(u => u.StocktakingSheets)
                .Where(u => u.UserId == userId && u.Status != CommonStatus.Deleted)
                .FirstOrDefaultAsync();
        }

        public async Task<string> CreateUser(User user)
        {
            try
            {
                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();
                return "";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
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
