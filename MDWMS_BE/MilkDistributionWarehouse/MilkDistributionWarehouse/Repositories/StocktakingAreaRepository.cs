using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingAreaRepository
    {
        Task<int?> CreateStocktakingAreaBulk(List<StocktakingArea> creates);
        Task<bool> IsStocktakingAreaAssignTo(int? areaId, Guid stocktakingSheetId, int assignTo);
    }
    public class StocktakingAreaRepository : IStocktakingAreaRepository
    {
        private readonly WarehouseContext _context;
        public StocktakingAreaRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<int?> CreateStocktakingAreaBulk(List<StocktakingArea> creates)
        {
            try
            {
                await _context.StocktakingAreas.AddRangeAsync(creates);
                await _context.SaveChangesAsync();
                return creates.Count;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<bool> IsStocktakingAreaAssignTo(int? areaId, Guid stocktakingSheetId, int assignTo)
        {
            return await _context.StocktakingAreas
                .AnyAsync(sa => sa.StocktakingSheetId == stocktakingSheetId 
                            && (areaId == null || areaId != sa.AreaId)
                            && sa.AssignTo == assignTo);
        }
    }
}
