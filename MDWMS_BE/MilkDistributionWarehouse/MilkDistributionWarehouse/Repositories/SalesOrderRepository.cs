using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{

    public interface ISalesOrderRepository
    {
        IQueryable<SalesOrder> GetAllSalesOrders();
        Task<SalesOrder?> GetSalesOrderById(Guid? id);
        Task<bool> HasActiveSalesOrder(int retailerId);
        Task<bool> IsAllSalesOrderDraffOrEmpty(int retailerId);
    }
    public class SalesOrderRepository : ISalesOrderRepository
    {
        private readonly WarehouseContext _context;
        public SalesOrderRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<SalesOrder> GetAllSalesOrders()
        {
            return _context.SalesOrders
                .Include(s => s.Retailer)
                .Include(s => s.CreatedByNavigation)
                .Include(s => s.ApprovalByNavigation)
                .Include(s => s.AcknowledgedByNavigation)
                .Include(s => s.AssignToNavigation)
                .AsNoTracking();
        }

        public async Task<SalesOrder?> GetSalesOrderById(Guid? id)
        {
            return await _context.SalesOrders
                .Include(s => s.Retailer)
                .Include(s => s.CreatedByNavigation)
                .Include(s => s.ApprovalByNavigation)
                .Include(s => s.AcknowledgedByNavigation)
                .Include(s => s.AssignToNavigation)
                .Include(s => s.SalesOrderDetails)
                    .ThenInclude(d => d.Goods)
                        .ThenInclude(g => g.Supplier)
                .Include(s => s.SalesOrderDetails)
                    .ThenInclude(d => d.Goods)
                        .ThenInclude(g => g.UnitMeasure)
                .Include(s => s.SalesOrderDetails)
                    .ThenInclude(d => d.GoodsPacking)
                .Where(s => s.SalesOrderId == id).FirstOrDefaultAsync();
        }

        public async Task<bool> HasActiveSalesOrder(int retailerId)
        {
            return await _context.SalesOrders
                .AnyAsync(so => so.RetailerId == retailerId
                && so.Status != SalesOrderStatus.Draft 
                && so.Status != SalesOrderStatus.Completed);
        }

        public async Task<bool> IsAllSalesOrderDraffOrEmpty(int retailerId)
        {
            var salesOrder = _context.SalesOrders.Where(so => so.RetailerId == retailerId);
            return !await salesOrder.AnyAsync(so => so.Status != SalesOrderStatus.Draft);
        }
    }
}
