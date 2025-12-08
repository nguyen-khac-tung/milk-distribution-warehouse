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
    }
}
