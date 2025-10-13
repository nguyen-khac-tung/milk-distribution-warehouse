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
        Task<Retailer?> CreateRetailer(Retailer retailer);
        Task<Retailer?> UpdateRetailer(Retailer retailer);
        Task<bool> IsDupliationRetailerName(int? retailerId, string retailerName);
        Task<bool> IsDuplicationTaxCode(int? retailerId, string taxCode);
        Task<bool> IsDuplicationPhone(int? retailerId, string phone);
        Task<bool> IsDuplicationEmail(int? retailerId, string email);
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

        public async Task<Retailer?> CreateRetailer(Retailer retailer)
        {
            try
            {
                await _context.Retailers.AddAsync(retailer);
                await _context.SaveChangesAsync();
                return retailer;
            }catch
            {
                return null;
            }
        }

        public async Task<Retailer?> UpdateRetailer(Retailer retailer)
        {
            try
            {
                _context.Retailers.Update(retailer);
                await _context.SaveChangesAsync();
                return retailer;
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> IsDupliationRetailerName(int? retailerId, string retailerName)
        {
            return await _context.Retailers
                .AnyAsync(r => (retailerId == null || r.RetailerId != retailerId)
                && r.RetailerName.ToLower().Trim().Equals(retailerName.ToLower().Trim()));
        }

        public async Task<bool> IsDuplicationTaxCode(int? retailerId, string taxCode)
        {
            return await _context.Retailers
                .AnyAsync(r => (retailerId == null || r.RetailerId != retailerId)
                && r.TaxCode.ToLower().Trim().Equals(taxCode.ToLower().Trim()));
        }

        public async Task<bool> IsDuplicationPhone(int? retailerId, string phone)
        {
            return await _context.Retailers
                .AnyAsync(r => (retailerId == null || r.RetailerId != retailerId)
                && r.Phone.ToLower().Trim().Equals(phone.ToLower().Trim()));
        }

        public async Task<bool> IsDuplicationEmail(int? retailerId, string email)
        {
            return await _context.Retailers
                .AnyAsync(r => (retailerId == null || r.RetailerId != retailerId)
                && r.Email.ToLower().Trim().Equals(email.ToLower().Trim()));
        }
    }

}
