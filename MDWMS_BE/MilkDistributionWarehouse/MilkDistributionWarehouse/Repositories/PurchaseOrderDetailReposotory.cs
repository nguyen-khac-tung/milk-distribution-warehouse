using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPurchaseOrderDetailRepository
    {
        Task<List<PurchaseOderDetail>> GetPurchaseOrderDetailByPurchaseOrderId(Guid purchaseOrderId);
    }

    public class PurchaseOrderDetailReposotory : IPurchaseOrderDetailRepository
    {
        private readonly WarehouseContext _context;
        public PurchaseOrderDetailReposotory(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<List<PurchaseOderDetail>> GetPurchaseOrderDetailByPurchaseOrderId(Guid purchaseOrderId)
        {
            return await _context.PurchaseOderDetails.Where(pod => pod.PurchaseOderId == purchaseOrderId).ToListAsync();
        }

    }
}
