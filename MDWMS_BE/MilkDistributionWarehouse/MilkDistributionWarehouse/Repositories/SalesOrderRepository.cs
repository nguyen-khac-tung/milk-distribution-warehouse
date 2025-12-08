using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualBasic;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{

    public interface ISalesOrderRepository
    {
        IQueryable<SalesOrder> GetAllSalesOrders();
        IQueryable<SalesOrder> GetListSalesOrdersByStatus(int status);
        Task<SalesOrder?> GetSalesOrderById(string? id);
        Task<bool> HasActiveSalesOrder(int retailerId);
        Task<bool> IsAllSalesOrderDraftOrEmpty(int retailerId);
        Task<List<SalesOrderDetail>> GetCommittedSaleOrderQuantities(List<int>? goodsIds);
        Task CreateSalesOrder(SalesOrder salesOrder);
        Task UpdateSalesOrder(SalesOrder salesOrder);
        Task DeleteSalesOrder(SalesOrder salesOrder);
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
                .Include(s => s.SalesOrderDetails)
                .OrderByDescending(s => s.CreatedAt)
                .AsNoTracking();
        }

        public IQueryable<SalesOrder> GetListSalesOrdersByStatus(int status)
        {
            return _context.SalesOrders
                    .Include(s => s.Retailer)
                    .Include(s => s.SalesOrderDetails)
                    .Where(s => s.Status == status);
        }

        public async Task<SalesOrder?> GetSalesOrderById(string? id)
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

        public async Task<bool> IsAllSalesOrderDraftOrEmpty(int retailerId)
        {
            var salesOrders = _context.SalesOrders.Where(so => so.RetailerId == retailerId);

            bool hasAny = await salesOrders.AnyAsync();
            if (!hasAny) return true; 

            return !await salesOrders.AnyAsync(so => so.Status != SalesOrderStatus.Draft);
        }

        public async Task<List<SalesOrderDetail>> GetCommittedSaleOrderQuantities(List<int>? goodsIds)
        {
            int[] inProgressStatuses = {
                SalesOrderStatus.PendingApproval,
                SalesOrderStatus.Approved,
                SalesOrderStatus.AssignedForPicking,
                SalesOrderStatus.Picking
            };

            return await _context.SalesOrders
                .Where(s => s.Status != null && inProgressStatuses.Contains((int)s.Status))
                .SelectMany(s => s.SalesOrderDetails)
                .Where(s => goodsIds == null || goodsIds.Contains(s.GoodsId ?? 0))
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task CreateSalesOrder(SalesOrder salesOrder)
        {
            await _context.SalesOrders.AddAsync(salesOrder);
        }

        public async Task UpdateSalesOrder(SalesOrder salesOrder)
        {
            _context.SalesOrders.Update(salesOrder);
            await Task.CompletedTask;
        }

        public async Task DeleteSalesOrder(SalesOrder salesOrder)
        {
            _context.SalesOrders.Remove(salesOrder);
            await Task.CompletedTask;
        }
    }
}
