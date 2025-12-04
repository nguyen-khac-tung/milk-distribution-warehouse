using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualBasic;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Utilities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsRepository
    {
        IQueryable<Good> GetGoods();
        Task<Good?> CreateGoods(Good good);
        Task<Good?> UpdateGoods(Good good);
        IQueryable<Good?> GetGoodsById(int goodsId);
        Task<Good?> GetGoodsByGoodsId(int goodsId);
        Task<bool> IsDuplicationCode(int? goodIds, string goodsCode);
        Task<List<Good>?> GetActiveGoodsBySupplierId(int supplierId);
        Task<Category?> GetInactiveCategoryByGoodsIdAsync(int goodsId);
        Task<IEnumerable<dynamic>> GetExpiredGoodsForDisposal();
        Task<UnitMeasure?> GetInactiveUnitMeasureByGoodsIdAsync(int goodsId);
        Task<StorageCondition?> GetInactiveStorageConditionByGoodsIdAsync(int goodsId);
        Task<bool> IsGoodsUsedInBatch(int goodsId);
        Task<bool> IsGoodsUsedInSaleOrder(int goodsId);
        Task<bool> IsGoodUsedInPurchaseOrder(int goodsId);
        Task<bool> HasGoodsUsedInBatchNotExpiry(int goodsId);
        Task<bool> IsGoodsUsedInPurchaseOrderWithExcludedStatusesAsync(int goodsId, params int[] excludedStatuses);
        Task<bool> IsGoodsUsedInSalesOrderWithExcludedStatusesAsync(int goodsId, params int[] excludedStatuses);
        Task<bool> VerifyStorageConditionUsage(int storageConditionId);
        Task<bool> HasActiveGoods(int supplierId);
        Task<bool> IsGoodsActiveOrInActive(int supplierId);
        Task<IEnumerable<LowStockGoodsDto>> GetLowStockGoods(int quantityThreshold);
        Task<List<string>> GetExistingGoodsCode(List<string> goodsCode);
        Task<int> CreateGoodsBulk(List<Good> goods);
        Task<bool> IsDuplicationNameAndSupplier(string goodsName, int supplierId);
        Task<bool> AreInActiveGoods(List<PurchaseOrderDetailCreate> purchaseOrderDetails);
    }
    public class GoodsRepository : IGoodsRepository
    {
        private readonly WarehouseContext _warehouseContext;
        public GoodsRepository(WarehouseContext warehouseContext)
        {
            _warehouseContext = warehouseContext;
        }

        public IQueryable<Good> GetGoods()
        {
            return _warehouseContext.Goods.Where(g => g.Status != CommonStatus.Deleted).OrderByDescending(g => g.CreatedAt).AsNoTracking();
        }
        public IQueryable<Good?> GetGoodsById(int goodsId)
        {
            return _warehouseContext.Goods.Where(g => g.Status != CommonStatus.Deleted).AsNoTracking();
        }

        public async Task<Good?> GetGoodsByGoodsId(int goodsId)
        {
            return await _warehouseContext.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId && g.Status != CommonStatus.Deleted);
        }

        public async Task<Good?> CreateGoods(Good good)
        {
            try
            {
                _warehouseContext.Goods.Add(good);
                await _warehouseContext.SaveChangesAsync();
                return good;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Good?> UpdateGoods(Good good)
        {
            try
            {
                _warehouseContext.Goods.Update(good);
                await _warehouseContext.SaveChangesAsync();
                return good;
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> IsDuplicationCode(int? goodsId, string goodsCode)
        {
            goodsCode = goodsCode.ToLower().Trim();

            return await _warehouseContext.Goods.AnyAsync(g =>
                g.GoodsCode.ToLower().Trim() == goodsCode &&
                g.Status != CommonStatus.Deleted &&
                (goodsId == null || g.GoodsId != goodsId));
        }

        public async Task<bool> IsDuplicationNameAndSupplier(string goodsName, int supplierId)
        {
            return await _warehouseContext.Goods
                .AnyAsync(g => g.Status != CommonStatus.Deleted
                && g.SupplierId == supplierId && g.GoodsName.Equals(goodsName));
        }

        public async Task<List<Good>?> GetActiveGoodsBySupplierId(int supplierId)
        {
            return await _warehouseContext.Goods
                .Include(g => g.UnitMeasure)
                .Include(g => g.GoodsPackings)
                .Include(g => g.Batches)
                    .ThenInclude(b => b.Pallets)
                        .ThenInclude(p => p.GoodsPacking)
                .Where(g => g.SupplierId == supplierId && g.Status == CommonStatus.Active)
                .ToListAsync();
        }

        public async Task<IEnumerable<dynamic>> GetExpiredGoodsForDisposal()
        {
            var today = DateOnly.FromDateTime(DateTimeUtility.Now());

            var groupedPallets = await _warehouseContext.Pallets
                                .Include(p => p.Batch)
                                    .ThenInclude(b => b.Goods)
                                        .ThenInclude(g => g.UnitMeasure)
                                .Include(p => p.Batch)
                                    .ThenInclude(b => b.Goods)
                                        .ThenInclude(g => g.Supplier)
                                .Include(p => p.GoodsPacking)
                                .Where(p => p.Batch.ExpiryDate <= today && p.PackageQuantity > 0 && p.Status == CommonStatus.Active)
                                .GroupBy(p => new { p.Batch.Goods.GoodsId, p.GoodsPacking.GoodsPackingId })
                                .AsNoTracking()
                                .ToListAsync();

            return groupedPallets.Select(g => new
            {
                Goods = g.FirstOrDefault()?.Batch?.Goods,
                GoodsPacking = g.FirstOrDefault()?.GoodsPacking,
                TotalExpiredPackageQuantity = g.Sum(p => p.PackageQuantity ?? 0)
            });
        }

        public async Task<IEnumerable<LowStockGoodsDto>> GetLowStockGoods(int quantityThreshold)
        {
            var groups = await _warehouseContext.Pallets
                .Include(p => p.Batch).ThenInclude(b => b.Goods).ThenInclude(g => g.UnitMeasure)
                .Include(p => p.GoodsPacking)
                .Where(p => p.Status == CommonStatus.Active && p.PackageQuantity > 0)
                .GroupBy(p => new { p.Batch.GoodsId, p.GoodsPackingId })
                .Where(g => g.Sum(p => p.PackageQuantity) < quantityThreshold)
                .AsNoTracking()
                .ToListAsync();

            return groups.Select(g => new LowStockGoodsDto
            {
                GoodsCode = g.FirstOrDefault()?.Batch.Goods.GoodsCode,
                GoodsName = g.FirstOrDefault()?.Batch.Goods.GoodsName,
                UnitMeasureName = g.FirstOrDefault()?.Batch.Goods.UnitMeasure.Name,
                UnitPerPackage = g.FirstOrDefault()?.GoodsPacking.UnitPerPackage,
                TotalPackage = g.Sum(p => p.PackageQuantity ?? 0)
            });
        }

        public async Task<Category?> GetInactiveCategoryByGoodsIdAsync(int goodsId)
        {
            return await _warehouseContext.Goods
                .Where(g => g.GoodsId == goodsId && g.Category.Status == CommonStatus.Inactive)
                .Select(g => g.Category)
                .FirstOrDefaultAsync();
        }

        public async Task<UnitMeasure?> GetInactiveUnitMeasureByGoodsIdAsync(int goodsId)
        {
            return await _warehouseContext.Goods
                    .Where(g => g.GoodsId == goodsId && g.UnitMeasure.Status == CommonStatus.Inactive)
                    .Select(g => g.UnitMeasure)
                    .FirstOrDefaultAsync();
        }

        public async Task<StorageCondition?> GetInactiveStorageConditionByGoodsIdAsync(int goodsId)
        {
            return await _warehouseContext.Goods
                    .Where(g => g.GoodsId == goodsId && g.StorageCondition.Status == CommonStatus.Inactive)
                    .Select(g => g.StorageCondition)
                    .FirstOrDefaultAsync();
        }

        public async Task<bool> HasGoodsUsedInBatchNotExpiry(int goodsId)
        {
            return await _warehouseContext.Batchs.AnyAsync(b => b.GoodsId == goodsId && b.ExpiryDate > DateOnly.FromDateTime(DateTimeUtility.Now()));
        }

        public async Task<bool> IsGoodsUsedInPurchaseOrderWithExcludedStatusesAsync(int goodsId, params int[] excludedStatuses)
        {
            return await _warehouseContext.PurchaseOderDetails
                .AnyAsync(pod => pod.GoodsId == goodsId
                && !excludedStatuses.Contains((int)pod.PurchaseOder.Status));
        }

        public async Task<bool> IsGoodsUsedInSalesOrderWithExcludedStatusesAsync(int goodsId, params int[] excludedStatuses)
        {
            return await _warehouseContext.SalesOrderDetails
                 .AnyAsync(so => so.GoodsId == goodsId
                 && !excludedStatuses.Contains((int)so.SalesOrder.Status));
        }

        public async Task<bool> IsGoodUsedInPurchaseOrder(int goodsId)
        {
            return await _warehouseContext.PurchaseOderDetails.AnyAsync(pod => pod.GoodsId == goodsId);
        }

        public async Task<bool> IsGoodsUsedInSaleOrder(int goodsId)
        {
            return await _warehouseContext.SalesOrderDetails.AnyAsync(sod => sod.GoodsId == goodsId);
        }

        public async Task<bool> IsGoodsUsedInBatch(int goodsId)
        {
            return await _warehouseContext.Batchs.AnyAsync(b => b.GoodsId == goodsId);
        }

        public Task<bool> VerifyStorageConditionUsage(int storageConditionId)
        {
            return _warehouseContext.Goods.AnyAsync(g => g.StorageConditionId == storageConditionId && g.Status != CommonStatus.Deleted);
        }

        public async Task<bool> HasActiveGoods(int supplierId)
        {
            return await _warehouseContext.Goods
                .AnyAsync(g => g.SupplierId == supplierId && g.Status == CommonStatus.Active);
        }

        public async Task<bool> IsGoodsActiveOrInActive(int supplierId)
        {
            return await _warehouseContext.Goods
                .AnyAsync(g => g.SupplierId == supplierId && (g.Status == CommonStatus.Active || g.Status == CommonStatus.Inactive));
        }

        public async Task<List<string>> GetExistingGoodsCode(List<string> goodsCode)
        {
            return await _warehouseContext.Goods
                .Where(g => goodsCode.Contains(g.GoodsCode))
                .Select(g => g.GoodsCode)
                .ToListAsync();
        }

        public async Task<int> CreateGoodsBulk(List<Good> goods)
        {
            try
            {
                await _warehouseContext.AddRangeAsync(goods);
                return await _warehouseContext.SaveChangesAsync();
            }
            catch
            {
                return 0;
            }
        }

        public async Task<bool> AreInActiveGoods(List<PurchaseOrderDetailCreate> purchaseOrderDetails)
        {
            var goodsIds = purchaseOrderDetails.Select(pod => pod.GoodsId).Distinct().ToList();
            return await _warehouseContext.Goods
                .AnyAsync(g => goodsIds.Contains(g.GoodsId) && g.Status == CommonStatus.Inactive);
        }
    }
}
