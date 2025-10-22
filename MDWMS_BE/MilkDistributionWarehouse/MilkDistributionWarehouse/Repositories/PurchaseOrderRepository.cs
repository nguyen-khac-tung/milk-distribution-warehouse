using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPurchaseOrderRepositoy
    {
        IQueryable<PurchaseOrder> GetPurchaseOrder();
        Task<bool> HasActivePurchaseOrder(int supplierId);
        Task<bool> IsAllPurchaseOrderDraftOrEmpty(int supplierId);
    }
    public class PurchaseOrderRepository : IPurchaseOrderRepositoy
    {
        private readonly WarehouseContext _context;
        public PurchaseOrderRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<PurchaseOrder> GetPurchaseOrder()
        {
            return _context.PurchaseOrders.OrderByDescending(po => po.CreatedAt).AsNoTracking();
        }

        public async Task<bool> HasActivePurchaseOrder(int supplierId)
        {
            return await _context.PurchaseOrders
                .AnyAsync(po => po.SupplierId == supplierId 
                && po.Status != PurchaseOrderStatus.Draft && po.Status != PurchaseOrderStatus.Completed);
        }

        public async Task<bool> IsAllPurchaseOrderDraftOrEmpty(int supplierId)
        {
            var purchaseOrders = _context.PurchaseOrders.Where(po => po.SupplierId == supplierId);
            return !await purchaseOrders.AnyAsync(po => po.Status != PurchaseOrderStatus.Draft);
        }
    }
}
