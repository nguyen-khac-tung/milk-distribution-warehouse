using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPurchaseOrderRepositoy
    {
        IQueryable<PurchaseOrder> GetPurchaseOrder();
        IQueryable<PurchaseOrder?> GetPurchaseOrderByPurchaseOrderId();
        Task<PurchaseOrder?> CreatePurchaseOrder(PurchaseOrder create);
        Task<PurchaseOrder?> UpdatePurchaseOrder(PurchaseOrder update);
        Task<PurchaseOrder?> DeletePurchaseOrder(PurchaseOrder purchaseOrder);
        Task<bool> HasActivePurchaseOrder(int supplierId);
        Task<bool> IsAllPurchaseOrderDraftOrEmpty(int supplierId);
        Task<PurchaseOrder?> GetPurchaseOrderByPurchaserOrderId(Guid purchaseOrderId);
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

        public IQueryable<PurchaseOrder?> GetPurchaseOrderByPurchaseOrderId()
        {
            return _context.PurchaseOrders.AsNoTracking();
        }

        public async Task<PurchaseOrder?> GetPurchaseOrderByPurchaserOrderId(Guid purchaseOrderId)
        {
            return await _context.PurchaseOrders.FirstOrDefaultAsync(po => po.PurchaseOderId == purchaseOrderId);
        }

        public async Task<PurchaseOrder?> CreatePurchaseOrder(PurchaseOrder create)
        {
            try
            {
                await _context.PurchaseOrders.AddAsync(create);
                await _context.SaveChangesAsync();
                return create;
            }
            catch
            {
                return null;
            }
        }

        public async Task<PurchaseOrder?> UpdatePurchaseOrder(PurchaseOrder update)
        {
            try
            {
                _context.PurchaseOrders.Update(update);
                await _context.SaveChangesAsync();
                return update;
            }
            catch
            {
                return null;
            }
        }

        public async Task<PurchaseOrder?> DeletePurchaseOrder(PurchaseOrder purchaseOrder)
        {
            try
            {
                _context.PurchaseOrders.Remove(purchaseOrder);
                await _context.SaveChangesAsync();
                return purchaseOrder;
            }
            catch
            {
                return null;
            }
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
