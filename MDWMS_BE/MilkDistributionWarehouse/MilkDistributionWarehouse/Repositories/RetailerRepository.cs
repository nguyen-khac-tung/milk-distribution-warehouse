using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IRetailerRepository
    {
        IQueryable<Retailer> GetRetailers();
        Task<Retailer?> GetRetailerByRetailerId(int retailerId);
    }

    public class RetailerRepository : IRetailerRepository
    {
        private readonly WarehouseContext _context;

        public RetailerRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<Retailer> GetRetailers()
        {
            return _context.Retailers
                .Where(r => r.Status != CommonStatus.Deleted)
                .OrderByDescending(r => r.CreatedAt)
                .AsNoTracking();
        }

        public async Task<Retailer?> GetRetailerByRetailerId(int retailerId)
        {
            return await _context.Retailers
                .FirstOrDefaultAsync(r => r.RetailerId == retailerId && r.Status != CommonStatus.Deleted);
        }
    }

}
