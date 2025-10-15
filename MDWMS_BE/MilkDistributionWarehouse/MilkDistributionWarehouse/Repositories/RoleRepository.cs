using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IRoleRepository
    {
        Task<List<Role>?> GetRoles();
        Task<Role?> GetRoleById(int? id);
    }

    public class RoleRepository : IRoleRepository
    {
        private readonly WarehouseContext _context;

        public RoleRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<List<Role>?> GetRoles()
        {
            return await _context.Roles.ToListAsync();
        }

        public async Task<Role?> GetRoleById(int? id)
        {
            return await _context.Roles
                .Where(r => r.RoleId == id)
                .FirstOrDefaultAsync();
        }
    }
}
