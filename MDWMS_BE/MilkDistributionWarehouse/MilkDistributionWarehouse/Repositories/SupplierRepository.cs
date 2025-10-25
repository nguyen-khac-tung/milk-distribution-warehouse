using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ISupplierRepository
    {
        IQueryable<Supplier> GetSuppliers();
        Task<Supplier?> GetSupplierBySupplierId(int supplierId);
        Task<Supplier?> CreateSupplier(Supplier create);
        Task<Supplier?> UpdateSupplier(Supplier update);
        Task<bool> IsDuplicationCompanyName(int? supplierId, string companyName);
        Task<bool> IsDuplicationBrandName(int? supplierId, string brandName);
        Task<bool> IsDuplicationTaxCode(int? supplierId, string taxCode);
        Task<bool> IsDuplicationEmail(int? supplierId, string email);
        Task<bool> IsDuplicationPhone(int? supplierId, string phone);

    }
    public class SupplierRepository : ISupplierRepository
    {
        private readonly WarehouseContext _context;

        public SupplierRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<Supplier> GetSuppliers()
        {
            return _context.Suppliers
                .Where(s => s.Status != CommonStatus.Deleted)
                .OrderByDescending(s => s.CreatedAt).AsNoTracking();
        }

        public async Task<Supplier?> GetSupplierBySupplierId(int supplierId)
        {
            return await _context.Suppliers
                .FirstOrDefaultAsync(s => s.SupplierId == supplierId && s.Status != CommonStatus.Deleted);
        }

        public async Task<Supplier?> CreateSupplier(Supplier create)
        {
            try
            {
                await _context.Suppliers.AddAsync(create);
                await _context.SaveChangesAsync();
                return create;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Supplier?> UpdateSupplier(Supplier update)
        {
            try
            {
                _context.Suppliers.Update(update);
                await _context.SaveChangesAsync();
                return update;
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> IsDuplicationCompanyName(int? supplierId, string companyName)
        {
            return await _context.Suppliers
                .AnyAsync(s => (supplierId == null || s.SupplierId != supplierId) 
                && s.CompanyName.ToLower().Trim().Equals(companyName.ToLower().Trim()));
        }

        public async Task<bool> IsDuplicationBrandName(int? supplierId, string brandName)
        {
            return await _context.Suppliers
                .AnyAsync(s => (supplierId == null || s.SupplierId != supplierId)
                && s.BrandName.ToLower().Trim().Equals(brandName.ToLower().Trim()));
        }

        public async Task<bool> IsDuplicationTaxCode(int? supplierId, string taxCode)
        {
            return await _context.Suppliers
                .AnyAsync(s => (supplierId == null || s.SupplierId != supplierId)
                && s.TaxCode.ToLower().Trim().Equals(taxCode.ToLower().Trim()));
        }

        public async Task<bool> IsDuplicationEmail(int? supplierId, string email)
        {
            return await _context.Suppliers
                .AnyAsync(s => (supplierId == null || s.SupplierId != supplierId)
                && s.Email.ToLower().Trim().Equals(email.ToLower().Trim()));
        }

        public async Task<bool> IsDuplicationPhone(int? supplierId, string phone)
        {
            return await _context.Suppliers
                .AnyAsync(s => (supplierId == null || s.SupplierId != supplierId)
                && s.Phone.ToLower().Trim().Equals(phone.ToLower().Trim()));
        }
    }
}
