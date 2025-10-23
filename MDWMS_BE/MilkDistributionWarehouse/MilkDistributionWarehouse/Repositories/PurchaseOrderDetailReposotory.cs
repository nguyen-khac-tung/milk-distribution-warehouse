using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPurchaseOrderDetailRepository
    {
        IQueryable<PurchaseOderDetail> GetPurchaseOrderDetail();
        Task<int> CreatePODetailBulk(List<PurchaseOderDetail> creates);
    }

    public class PurchaseOrderDetailReposotory : IPurchaseOrderDetailRepository
    {
        private readonly WarehouseContext _context;
        public PurchaseOrderDetailReposotory(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<PurchaseOderDetail> GetPurchaseOrderDetail()
        {
            return _context.PurchaseOderDetails.AsNoTracking();
        }

        public async Task<int> CreatePODetailBulk(List<PurchaseOderDetail> creates)
        {
            try
            {
                await _context.PurchaseOderDetails.AddRangeAsync(creates);
                await _context.SaveChangesAsync();
                return creates.Count();
            }
            catch
            {
                return 0;
            }
        }

    }
}
