using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Utilities;
using System.Linq;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IBackOrderRepository
    {
        IQueryable<BackOrder>? GetBackOrders();
        Task<BackOrder?> GetBackOrderById(Guid backOrderId);
        Task<int> GetAvailableQuantity(int? goodsId, int? goodsPackingId);
        Task<Dictionary<(int, int), int>> GetAvailableQuantitiesAsync(List<(int GoodsId, int GoodsPackingId)> pairs);
        Task<(BackOrder? BackOrder, bool IsNew, int? PreviousPackageQuantity)> CreateBackOrder(BackOrder entity);
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
                    .ThenInclude(g => g.UnitMeasure)
                .Include(bo => bo.Retailer)
                .Include(bo => bo.GoodsPacking)
                .Include(bo => bo.CreatedByNavigation)
                .OrderByDescending(bo => bo.CreatedAt)
                .AsSplitQuery()
                .AsNoTracking();
        }

        public async Task<BackOrder?> GetBackOrderById(Guid backOrderId)
        {
            return await _context.BackOrders
                .Include(bo => bo.Goods)
                    .ThenInclude(g => g.UnitMeasure)
                .Include(bo => bo.Goods)
                    .ThenInclude(g => g.Category)
                .Include(bo => bo.Goods)
                    .ThenInclude(g => g.Supplier)
                .Include(bo => bo.Retailer)
                .Include(bo => bo.GoodsPacking)
                .Include(bo => bo.CreatedByNavigation)
                .AsSplitQuery()
                .AsNoTracking()
                .FirstOrDefaultAsync(bo => bo.BackOrderId == backOrderId);
        }

        public async Task<int> GetAvailableQuantity(int? goodsId, int? goodsPackingId)
        {
            if (goodsId == null || goodsPackingId == null)
                return 0;

            // Sum on-hand packages from pallets
            var onHand = await _context.Pallets
                .AsNoTracking()
                .Where(p => p.Batch.GoodsId == goodsId
                        && p.GoodsPackingId == goodsPackingId
                        && p.Batch.ExpiryDate >= DateOnly.FromDateTime(DateTimeUtility.Now())
                        && p.Status == CommonStatus.Active)
                .SumAsync(p => p.PackageQuantity) ?? 0;

            // Sum committed packages from active sales orders (Approved / AssignedForPicking / Picking)
            var committedStatuses = new[] {
                Constants.SalesOrderStatus.Approved,
                Constants.SalesOrderStatus.AssignedForPicking,
                Constants.SalesOrderStatus.Picking
            };

            var committed = await (from so in _context.SalesOrders
                                   join sod in _context.SalesOrderDetails on so.SalesOrderId equals sod.SalesOrderId
                                   where so.Status.HasValue && committedStatuses.Contains(so.Status.Value)
                                         && sod.GoodsId == goodsId
                                         && sod.GoodsPackingId == goodsPackingId
                                   select sod.PackageQuantity)
                                  .SumAsync() ?? 0;

            var available = onHand - committed;
            return available > 0 ? available : 0;
        }

        public async Task<Dictionary<(int, int), int>> GetAvailableQuantitiesAsync(List<(int GoodsId, int GoodsPackingId)> pairs)
        {
            if (pairs == null || pairs.Count == 0)
                return new Dictionary<(int, int), int>();

            var goodsIds = pairs.Select(p => p.GoodsId).Distinct().ToList();
            var packingIds = pairs.Select(p => p.GoodsPackingId).Distinct().ToList();

            // Get on-hand totals grouped by goods & packing
            var onHandQuery = await _context.Pallets
                .AsNoTracking()
                .Where(p => p.Status == CommonStatus.Active
                        && p.Batch.GoodsId.HasValue
                        && goodsIds.Contains(p.Batch.GoodsId.Value)
                        && p.GoodsPackingId.HasValue
                        && packingIds.Contains(p.GoodsPackingId.Value)
                        && p.Batch.ExpiryDate >= DateOnly.FromDateTime(DateTimeUtility.Now()))
                .GroupBy(p => new { p.Batch.GoodsId, p.GoodsPackingId })
                .Select(g => new
                {
                    g.Key.GoodsId,
                    g.Key.GoodsPackingId,
                    Total = g.Sum(x => x.PackageQuantity)
                })
                .ToListAsync();

            // Get committed totals from active sales orders grouped by goods & packing
            var committedStatuses = new[] {
                Constants.SalesOrderStatus.Approved,
                Constants.SalesOrderStatus.AssignedForPicking,
                Constants.SalesOrderStatus.Picking
            };

            var committedQuery = await (from so in _context.SalesOrders
                                        join sod in _context.SalesOrderDetails on so.SalesOrderId equals sod.SalesOrderId
                                        where so.Status.HasValue && committedStatuses.Contains(so.Status.Value)
                                              && sod.GoodsId.HasValue && goodsIds.Contains(sod.GoodsId.Value)
                                              && sod.GoodsPackingId.HasValue && packingIds.Contains(sod.GoodsPackingId.Value)
                                        group sod by new { sod.GoodsId, sod.GoodsPackingId } into g
                                        select new
                                        {
                                            GoodsId = g.Key.GoodsId,
                                            GoodsPackingId = g.Key.GoodsPackingId,
                                            Total = g.Sum(x => x.PackageQuantity)
                                        }).ToListAsync();

            var onHandDict = onHandQuery.ToDictionary(
                x => (x.GoodsId ?? 0, x.GoodsPackingId ?? 0),
                x => x.Total ?? 0
            );

            var committedDict = committedQuery.ToDictionary(
                x => (x.GoodsId ?? 0, x.GoodsPackingId ?? 0),
                x => x.Total ?? 0
            );

            var result = new Dictionary<(int, int), int>();

            foreach (var pair in pairs)
            {
                var key = (pair.GoodsId, pair.GoodsPackingId);
                onHandDict.TryGetValue(key, out var onHandVal);
                committedDict.TryGetValue(key, out var committedVal);
                var available = (onHandVal) - (committedVal);
                if (available < 0) available = 0;
                result[key] = available;
            }

            return result;
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

        public async Task<(BackOrder? BackOrder, bool IsNew, int? PreviousPackageQuantity)> CreateBackOrder(BackOrder entity)
        {
            var existing = await _context.BackOrders
                .FirstOrDefaultAsync(b => b.RetailerId == entity.RetailerId
                                       && b.GoodsId == entity.GoodsId
                                       && b.GoodsPackingId == entity.GoodsPackingId);

            if (existing != null)
            {
                var previousQty = existing.PackageQuantity;
                var addQty = entity.PackageQuantity ?? 0;
                existing.PackageQuantity = (existing.PackageQuantity ?? 0) + addQty;
                existing.UpdateAt = DateTimeUtility.Now();

                _context.BackOrders.Update(existing);
                await _context.SaveChangesAsync();
                return (existing, false, previousQty);
            }

            await _context.BackOrders.AddAsync(entity);
            await _context.SaveChangesAsync();
            return (entity, true, null);
        }

        public async Task<BackOrder?> UpdateBackOrder(BackOrder entity)
        {
            var existing = await _context.BackOrders
                .FirstOrDefaultAsync(x => x.BackOrderId == entity.BackOrderId);

            if (existing == null) return null;

            _context.Entry(existing).CurrentValues.SetValues(entity);
            await _context.SaveChangesAsync();
            return existing; 
        }

        public Task<bool> ExistsRetailer(int? retailerId)
        {
            return _context.Retailers
                .AsNoTracking()
                .AnyAsync(r => r.RetailerId == retailerId.Value && r.Status == CommonStatus.Active);
        }

        public Task<bool> ExistsGoods(int? goodsId)
        {
            return _context.Goods
                .AsNoTracking()
                .AnyAsync(g => g.GoodsId == goodsId.Value && g.Status == CommonStatus.Active);
        }
    }
}