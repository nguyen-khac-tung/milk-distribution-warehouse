using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingLocationRepository
    {
        Task<List<StocktakingLocation>> GetLocationsByAreaIdsAsync(List<int> areaIds);
        Task<List<StocktakingLocation>> GetLocationsBySheetAndAssignToAsync(Guid? sheetId, List<int> assignToIds);
        Task<int> CreateStocktakingLocationBulk(List<StocktakingLocation> creates);
        Task<bool> AreExistStocklocationByAllStockAreaIdsAsync(List<Guid> stockAreaIds);
        Task<bool> AnyStocktakingLocationByStockAreaId(Guid stocktakingAreaId);
        Task<bool> AnyStocktakingLocationSameStockSheetAsync(Guid stockSheetId, Guid stockAreaId, int assignTo);
    }
    public class StocktakingLocationRepository : IStocktakingLocationRepository
    {
        private readonly WarehouseContext _context;
        public StocktakingLocationRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<int> CreateStocktakingLocationBulk(List<StocktakingLocation> creates)
        {
            try
            {
                await _context.StocktakingLocations.AddRangeAsync(creates);
                await _context.SaveChangesAsync();
                return creates.Count;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<bool> AreExistStocklocationByAllStockAreaIdsAsync(List<Guid> stockAreaIds)
        {
            var existingStockAreaIds = await _context.StocktakingLocations
                .Where(sl => sl.StocktakingAreaId.HasValue)
                .Select(sl => sl.StocktakingAreaId)
                .Distinct()
                .ToListAsync();

            return stockAreaIds.All(id => existingStockAreaIds.Contains(id));
        }

        public async Task<bool> AnyStocktakingLocationByStockAreaId(Guid stocktakingAreaId)
        {
            return await _context.StocktakingLocations.AnyAsync(sl => sl.StocktakingAreaId == stocktakingAreaId);
        }

        public async Task<bool> AnyStocktakingLocationSameStockSheetAsync(Guid stockSheetId, Guid stockAreaId, int assignTo)
        {
            return await _context.StocktakingLocations
                .AnyAsync(sl =>
                    sl.StocktakingArea != null &&
                    sl.StocktakingArea.StocktakingSheetId == stockSheetId &&
                    sl.StocktakingAreaId != stockAreaId &&
                    sl.StocktakingArea.AssignTo == assignTo
                );
        }

        public async Task<List<StocktakingLocation>> GetLocationsByAreaIdsAsync(List<int> areaIds)
        {
            return await _context.StocktakingLocations
                .Include(sl => sl.StocktakingArea)
                .Where(sl => 
                            sl.StocktakingArea.AreaId.HasValue &&
                            areaIds.Contains(sl.StocktakingArea.AreaId.Value)
                      )
                .ToListAsync();
        }

        public async Task<List<StocktakingLocation>> GetLocationsBySheetAndAssignToAsync(Guid? sheetId, List<int> assignToIds)
        {
            return await _context.StocktakingLocations
                .Where(sl =>
                            sl.StocktakingArea.StocktakingSheetId == sheetId &&
                            sl.StocktakingArea.AssignTo.HasValue &&
                            assignToIds.Contains(sl.StocktakingArea.AssignTo.Value)
                        )
                .ToListAsync();
        }
    }
}
