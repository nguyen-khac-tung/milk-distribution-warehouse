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

    }
}
