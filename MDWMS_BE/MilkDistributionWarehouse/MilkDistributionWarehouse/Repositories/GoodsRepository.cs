using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualBasic;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
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
        Task<Category?> GetInactiveCategoryByGoodsIdAsync(int goodsId);
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

        public async Task<bool> IsGoodInUseAnyTransaction(int goodsId)
        {
            var checkBatch = await HasGoodsUsedInBatchNotExpiry(goodsId);

            var excludedStatuses = new[] { PurchaseOrderStatus.Draft, PurchaseOrderStatus.Completed };

            var checkPurchaseOrder = await IsGoodsUsedInPurchaseOrderWithExcludedStatusesAsync(goodsId, excludedStatuses);

            var checkSalesOrder = await IsGoodsUsedInSalesOrderWithExcludedStatusesAsync(goodsId, excludedStatuses);

            return checkBatch || checkPurchaseOrder || checkSalesOrder;
        }

        public async Task<bool> IsGoodInUseAnyTransactionToUpdate(int goodsId)
        {
            var checkBatch = await IsGoodsUsedInBatch(goodsId);

            var checkPurchaseOrder = await IsGoodsUsedInPurchaseOrderWithExcludedStatusesAsync(goodsId, PurchaseOrderStatus.Draft);

            var checkSalesOrder =  await IsGoodsUsedInSalesOrderWithExcludedStatusesAsync(goodsId, SalesOrderStatus.Draft);

            return checkBatch || checkPurchaseOrder || checkSalesOrder;
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
            return await _warehouseContext.Batchs.AnyAsync(b => b.GoodsId == goodsId && b.ExpiryDate > DateTime.Now);
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
    }
}
