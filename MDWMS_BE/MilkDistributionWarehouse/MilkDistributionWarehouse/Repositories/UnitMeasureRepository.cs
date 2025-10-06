using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUnitMeasureRepository
    {
        Task<List<UnitMeasure>> GetUnitMeasures();
        Task<int> CreateUnitMeasures(UnitMeasure unitMeasure);
        Task<int> UpdateUnitMeasure(UnitMeasure unitMeasure);
        Task<UnitMeasure?> GetUnitMeasureById(int unitMeasureId);
        Task<bool> IsDuplicatioByIdAndName(int unitMeasureId, string name);
    }
    public class UnitMeasureRepository : IUnitMeasureRepository
    {
        private readonly WarehouseContext _warehouseContext;
        public UnitMeasureRepository(WarehouseContext warehouseContext)
        {
            _warehouseContext = warehouseContext;
        }

        public async Task<List<UnitMeasure>> GetUnitMeasures()
        {
            return await _warehouseContext.UnitMeasures.ToListAsync();
        }

        public async Task<int> CreateUnitMeasures(UnitMeasure unitMeasure)
        {
            _warehouseContext.UnitMeasures.Add(unitMeasure);
            return await _warehouseContext.SaveChangesAsync();
        }

        public async Task<int> UpdateUnitMeasure(UnitMeasure unitMeasure)
        {
            _warehouseContext.UnitMeasures.Update(unitMeasure);
            return await _warehouseContext.SaveChangesAsync();
        }

        public async Task<UnitMeasure?> GetUnitMeasureById(int unitMeasureId)
        {
            return await _warehouseContext.UnitMeasures.FirstOrDefaultAsync(um => um.UnitMeasureId == unitMeasureId && um.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsDuplicatioByIdAndName(int unitMeasureId, string name)
        {
            return await _warehouseContext.UnitMeasures.AnyAsync(um => um.UnitMeasureId !=  unitMeasureId 
                    && um.Name.ToLower().Trim().Equals(name.ToLower().Trim()) 
                    && um.Status != CommonStatus.Deleted);
        }


    }
}
