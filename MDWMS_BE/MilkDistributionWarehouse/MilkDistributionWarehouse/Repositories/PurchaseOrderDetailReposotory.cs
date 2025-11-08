using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPurchaseOrderDetailRepository
    {
        IQueryable<PurchaseOderDetail> GetPurchaseOrderDetail();
        Task<int> CreatePODetailBulk(List<PurchaseOderDetail> creates);
        Task<int> DeletePODetailBulk(List<PurchaseOderDetail> poDetailsToDelete);
        Task<List<PurchaseOderDetail>> GetPurchaseOrderDetailsByPurchaseOrderId(string purchaseOrderId);
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

        public async Task<List<PurchaseOderDetail>> GetPurchaseOrderDetailsByPurchaseOrderId(string purchaseOrderId)
        {
            return await _context.PurchaseOderDetails
                .Where(pod => pod.PurchaseOderId.Equals(purchaseOrderId))
                .ToListAsync();
        } 

        public async Task<int> CreatePODetailBulk(List<PurchaseOderDetail> poDetailsToCreate)
        {
            try
            {
                await _context.PurchaseOderDetails.AddRangeAsync(poDetailsToCreate);
                await _context.SaveChangesAsync();
                return poDetailsToCreate.Count();
            }
            catch
            {
                return 0;
            }
        }

        public async Task<int> DeletePODetailBulk(List<PurchaseOderDetail> poDetailsToDelete)
        {
            try
            {
                _context.PurchaseOderDetails.RemoveRange(poDetailsToDelete);
                await _context.SaveChangesAsync();
                return poDetailsToDelete.Count();
            }
            catch
            {
                return 0;
            }
        }

    }
}
