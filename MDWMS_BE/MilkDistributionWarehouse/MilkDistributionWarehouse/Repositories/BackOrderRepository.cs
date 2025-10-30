using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Linq;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IBackOrderRepository
    {
        IQueryable<BackOrder>? GetBackOrders();
        Task<BackOrder?> GetBackOrderById(Guid backOrderId);
        Task<int> GetAvailableQuantity(int? goodsId, int? goodsPackingId);
        Task<Dictionary<(int, int), int>> GetAvailableQuantitiesAsync(List<(int GoodsId, int GoodsPackingId)> pairs);
        Task<BackOrder?> CreateBackOrder(BackOrder entity);
        Task<BackOrder?> UpdateBackOrder(BackOrder entity);
        Task<BackOrder?> DeleteBackOrder(Guid backOrderId);
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
                .Include(bo => bo.GoodsPacking)
                .Include(bo => bo.CreatedByNavigation)
                .OrderByDescending(bo => bo.CreatedAt)
                .AsSplitQuery()
                .AsNoTracking();
        }

        public async Task<BackOrder?> GetBackOrderById(Guid backOrderId)
        {
            var query = from bo in _context.BackOrders
                       .Include(bo => bo.Goods)
                       .Include(bo => bo.Retailer)
                       .Include(bo => bo.GoodsPacking)
                       .Include(bo => bo.CreatedByNavigation)
                       .AsSplitQuery()
                       .AsNoTracking()
                       where bo.BackOrderId == backOrderId
                       select bo;

            return await query.FirstOrDefaultAsync();
        }

        public async Task<int> GetAvailableQuantity(int? goodsId, int? goodsPackingId)
        {
            if (goodsId == null || goodsPackingId == null)
                return 0;

            return await _context.Pallets
                .AsNoTracking()
                .Where(p => p.Batch.GoodsId == goodsId
                        && p.GoodsPackingId == goodsPackingId
                        && p.Status == CommonStatus.Active)
                .SumAsync(p => p.PackageQuantity) ?? 0;
        }

        public async Task<Dictionary<(int, int), int>> GetAvailableQuantitiesAsync(List<(int GoodsId, int GoodsPackingId)> pairs)
        {
            if (pairs == null || pairs.Count == 0)
                return new Dictionary<(int, int), int>();

            var goodsIds = pairs.Select(p => p.GoodsId).Distinct().ToList();
            var packingIds = pairs.Select(p => p.GoodsPackingId).Distinct().ToList();

            // Optimize by using a single query with optimized filters
            var quantities = await _context.Pallets
                .AsNoTracking()
                .Where(p => p.Status == CommonStatus.Active
                        && p.Batch.GoodsId.HasValue
                        && goodsIds.Contains(p.Batch.GoodsId.Value)
                        && p.GoodsPackingId.HasValue
                        && packingIds.Contains(p.GoodsPackingId.Value))
                .GroupBy(p => new { p.Batch.GoodsId, p.GoodsPackingId })
                .Select(g => new
                {
                    g.Key.GoodsId,
                    g.Key.GoodsPackingId,
                    Total = g.Sum(x => x.PackageQuantity)
                })
                .ToDictionaryAsync(
                    x => (x.GoodsId ?? 0, x.GoodsPackingId ?? 0),
                    x => x.Total ?? 0
                );

            return quantities;
        }

        public async Task<BackOrder?> DeleteBackOrder(Guid backOrderId)
        {
            var backOrder = await _context.BackOrders.FindAsync(backOrderId);
            if (backOrder != null)
            {
                _context.BackOrders.Remove(backOrder);
                await _context.SaveChangesAsync();
            }
            return backOrder;
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