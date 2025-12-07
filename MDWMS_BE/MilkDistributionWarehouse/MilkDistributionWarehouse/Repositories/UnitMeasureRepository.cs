using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUnitMeasureRepository
    {
        IQueryable<UnitMeasure> GetUnitMeasures();
        Task<UnitMeasure?> CreateUnitMeasures(UnitMeasure unitMeasure);
        Task<UnitMeasure?> UpdateUnitMeasure(UnitMeasure unitMeasure);
        Task<UnitMeasure?> GetUnitMeasureById(int unitMeasureId);
        Task<bool> IsUnitMeasureContainingGoods(int unitMeasureId);
        Task<bool> IsDuplicationUnitMeasureName(int? unitMeasureId, string name);
        Task<bool> IsUnitMeasureContainGooddAllInActice(int unitMeasureId);
        Task<bool> IsActiveUnitMeasure(int unitMeasureId);
        Task<bool> HasUnitMeasureInUse(int unitMeasureId);
    }
    public class UnitMeasureRepository : IUnitMeasureRepository
    {
        private readonly WarehouseContext _warehouseContext;
        public UnitMeasureRepository(WarehouseContext warehouseContext)
        {
            _warehouseContext = warehouseContext;
        }

        public IQueryable<UnitMeasure> GetUnitMeasures()
        {
            return _warehouseContext.UnitMeasures.Where(um => um.Status != CommonStatus.Deleted)
                .OrderByDescending(um => um.CreatedAt).AsNoTracking();
        }

        public async Task<UnitMeasure?> CreateUnitMeasures(UnitMeasure unitMeasure)
        {
            try
            {
                _warehouseContext.UnitMeasures.Add(unitMeasure);
                await _warehouseContext.SaveChangesAsync();
                return unitMeasure;
            }
            catch
            {
                return null;
            }
        }

        public async Task<UnitMeasure?> UpdateUnitMeasure(UnitMeasure unitMeasure)
        {
            try
            {
                _warehouseContext.UnitMeasures.Update(unitMeasure);
                await _warehouseContext.SaveChangesAsync();
                return unitMeasure;
            }
            catch
            {
                return null;
            }
        }

        public async Task<UnitMeasure?> GetUnitMeasureById(int unitMeasureId)
        {
            return await _warehouseContext.UnitMeasures.FirstOrDefaultAsync(um => um.UnitMeasureId == unitMeasureId && um.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsDuplicationUnitMeasureName(int? unitMeasureId, string name)
        {
            return await _warehouseContext.UnitMeasures.AnyAsync(um => um.Name.ToLower().Trim().Equals(name.ToLower().Trim()) 
                                                                && um.Status != CommonStatus.Deleted 
                                                                && (unitMeasureId == null || um.UnitMeasureId != unitMeasureId));
        }

        public async Task<bool> IsUnitMeasureContainingGoods(int unitMeasureId)
        {
            return await _warehouseContext.Goods.AnyAsync(g => g.UnitMeasureId == unitMeasureId && g.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsUnitMeasureContainGooddAllInActice(int unitMeasureId)
        {
            IQueryable<Good> goods = _warehouseContext.Goods.Where(g => g.UnitMeasureId == unitMeasureId && g.Status != CommonStatus.Deleted);

            return !(await goods.AnyAsync(g => g.Status != CommonStatus.Inactive));
        }

        public async Task<bool> IsActiveUnitMeasure(int unitMeasureId)
        {
            return await _warehouseContext.UnitMeasures
                .AnyAsync(um => um.UnitMeasureId == unitMeasureId &&
                        um.Status == CommonStatus.Active);
        }

        public async Task<bool> HasUnitMeasureInUse(int unitMeasureId)
        {
            bool hasInPurchaseOrder = await _warehouseContext.PurchaseOderDetails
                .Join(_warehouseContext.Goods,
                    pod => pod.GoodsId,
                    g => g.GoodsId,
                    (pod, g) => new { pod, g })
                .Join(_warehouseContext.PurchaseOrders,
                    x => x.pod.PurchaseOderId,
                    po => po.PurchaseOderId,
                    (x, po) => new { x.g, po })
                .AnyAsync(x => x.g.UnitMeasureId == unitMeasureId 
                    && x.g.Status != CommonStatus.Deleted
                    && x.po.Status != PurchaseOrderStatus.Draft 
                    && x.po.Status != PurchaseOrderStatus.Rejected);

            if (hasInPurchaseOrder) return true;

            bool hasInSalesOrder = await _warehouseContext.SalesOrderDetails
                .Where(sod => sod.GoodsId.HasValue)
                .Join(_warehouseContext.Goods,
                    sod => sod.GoodsId.Value,
                    g => g.GoodsId,
                    (sod, g) => new { sod, g })
                .Join(_warehouseContext.SalesOrders,
                    x => x.sod.SalesOrderId,
                    so => so.SalesOrderId,
                    (x, so) => new { x.g, so })
                .AnyAsync(x => x.g.UnitMeasureId == unitMeasureId 
                    && x.g.Status != CommonStatus.Deleted
                    && x.so.Status != SalesOrderStatus.Draft 
                    && x.so.Status != SalesOrderStatus.Rejected);

            if (hasInSalesOrder) return true;

            bool hasInDisposalRequest = await _warehouseContext.DisposalRequestDetails
                .Where(drd => drd.GoodsId.HasValue)
                .Join(_warehouseContext.Goods,
                    drd => drd.GoodsId.Value,
                    g => g.GoodsId,
                    (drd, g) => new { drd, g })
                .Join(_warehouseContext.DisposalRequests,
                    x => x.drd.DisposalRequestId,
                    dr => dr.DisposalRequestId,
                    (x, dr) => new { x.g, dr })
                .AnyAsync(x => x.g.UnitMeasureId == unitMeasureId 
                    && x.g.Status != CommonStatus.Deleted
                    && x.dr.Status != DisposalRequestStatus.Draft 
                    && x.dr.Status != DisposalRequestStatus.Rejected);

            return hasInDisposalRequest;
        }
    }
}
