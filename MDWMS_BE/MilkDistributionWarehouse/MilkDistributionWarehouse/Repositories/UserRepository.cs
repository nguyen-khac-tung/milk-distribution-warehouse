using DocumentFormat.OpenXml.Spreadsheet;
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
        Task<string> CheckUserDependencies(int userId);
        Task<User?> GetUserByEmail(string email);
        Task<User?> GetUserByPhone(string phone);
        Task<List<User>?> GetUsersByRoleId(int? roleId);
        Task<User?> GetAssignToStockArea(string stocktakingSheetId, int areaId);
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

        public async Task<User?> GetUserByPhone(string phone)
        {
            if (phone.IsNullOrEmpty()) return null;
            return await _context.Users
                .Where(u => u.Phone == phone && u.Status != CommonStatus.Deleted)
                .FirstOrDefaultAsync();
        }
        public async Task<User?> GetUserById(int? userId)
        {
            return await _context.Users
                .Include(u => u.Roles)
                .Where(u => u.UserId == userId && u.Status != CommonStatus.Deleted)
                .FirstOrDefaultAsync();
        }

        public async Task<string> CheckUserDependencies(int userId)
        {
            var hasPO = await _context.PurchaseOrders.AnyAsync(x =>
                x.CreatedBy == userId ||
                x.ApprovalBy == userId ||
                x.ArrivalConfirmedBy == userId ||
                x.AssignTo == userId);
            if (hasPO) return "Không thể xóa do người dùng này có liên quan đến lịch sử đơn đặt hàng mua.";

            var hasSO = await _context.SalesOrders.AnyAsync(x =>
                x.CreatedBy == userId ||
                x.AcknowledgedBy == userId ||
                x.ApprovalBy == userId ||
                x.AssignTo == userId);
            if (hasSO) return "Không thể xóa do người dùng này có liên quan đến lịch sử đơn hàng bán.";

            var hasDR = await _context.DisposalRequests.AnyAsync(x =>
                x.CreatedBy == userId ||
                x.ApprovalBy == userId ||
                x.AssignTo == userId);
            if (hasDR) return "Không thể xóa do người dùng này có liên quan đến lịch sử yêu cầu hủy hàng.";

            var hasGIN = await _context.GoodsIssueNotes.AnyAsync(x => x.CreatedBy == userId || x.ApprovalBy == userId);
            if (hasGIN) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu xuất hàng.";

            var hasGRN = await _context.GoodsReceiptNotes.AnyAsync(x => x.CreatedBy == userId || x.ApprovalBy == userId);
            if (hasGRN) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu nhập hàng.";

            var hasDN = await _context.DisposalNotes.AnyAsync(x => x.CreatedBy == userId || x.ApprovalBy == userId);
            if (hasDN) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu hủy hàng.";

            var hasSheet = await _context.StocktakingSheets.AnyAsync(s => s.CreatedBy == userId);
            var hasArea = await _context.StocktakingAreas.AnyAsync(a => a.AssignTo == userId);
            if (hasSheet || hasArea) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu kiểm kê.";

            var hasPallet = await _context.Pallets.AnyAsync(p => p.CreateBy == userId);
            if (hasPallet) return "Không thể xóa do người dùng này có liên quan đến lịch sử các pallet.";

            var hasBackOrder = await _context.BackOrders.AnyAsync(b => b.CreatedBy == userId);
            if (hasBackOrder) return "Không thể xóa do người dùng này có liên quan đến lịch sử đơn trả hàng.";

            return "";
        }

        public async Task<List<User>?> GetUsersByRoleId(int? roleId)
        {
            return await _context.Users
                .Where(u => u.Roles.Any(r => r.RoleId == roleId) && u.Status == CommonStatus.Active)
                .ToListAsync();
        }

        public async Task<User?> GetAssignToStockArea(string stocktakingSheetId, int areaId)
        {
            return await _context.Users
                .Include(u => u.StocktakingAreas)
                .FirstOrDefaultAsync(u => 
                            u.StocktakingAreas.Any(sa => sa.StocktakingSheetId.Equals(stocktakingSheetId) && sa.AreaId == areaId)
                );
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
