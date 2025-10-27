using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IBackOrderRepository
    {
        IQueryable<BackOrder>? GetBackOrders();
        Task<BackOrder?> GetBackOrderById(Guid backOrderId);
        Task<BackOrder?> CreateBackOrder(BackOrder entity);
        Task<BackOrder?> UpdateBackOrder(BackOrder entity);
        Task<List<BackOrder>> GetActiveBackOrdersAsync();
        Task<bool> ExistsRetailer(int? retailerId);
        Task<bool> ExistsGoods(int? goodsId);
    }

    public class BackOrderRepository : IBackOrderRepository
    {
        private readonly WarehouseContext _context;

        public BackOrderRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<BackOrder>? GetBackOrders()
        {
            return _context.BackOrders
                .Include(bo => bo.Goods)
                .Include(bo => bo.Retailer)
                .Where(bo => bo.Status != CommonStatus.Deleted)
                .OrderByDescending(bo => bo.CreatedAt)
                .AsNoTracking();
        }

        public async Task<BackOrder?> GetBackOrderById(Guid backOrderId)
        {
            return await _context.BackOrders
                .Include(bo => bo.Goods)
                .Include(bo => bo.Retailer)
                .FirstOrDefaultAsync(bo => bo.BackOrderId == backOrderId && bo.Status != CommonStatus.Deleted);
        }

        public async Task<BackOrder?> CreateBackOrder(BackOrder entity)
        {
            await _context.BackOrders.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<BackOrder?> UpdateBackOrder(BackOrder entity)
        {
            _context.BackOrders.Attach(entity);
            _context.Entry(entity).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<List<BackOrder>> GetActiveBackOrdersAsync()
        {
            return await _context.BackOrders
                .Where(bo => bo.Status == CommonStatus.Active)
                .OrderBy(bo => bo.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public Task<bool> ExistsRetailer(int? retailerId)
        {
            return _context.Retailers
                .AsNoTracking()
                .AnyAsync(r => r.RetailerId == retailerId.Value && r.Status != CommonStatus.Deleted);
        }

        public Task<bool> ExistsGoods(int? goodsId)
        {
            return _context.Goods
                .AsNoTracking()
                .AnyAsync(g => g.GoodsId == goodsId.Value && g.Status != CommonStatus.Deleted);
        }
    }
}