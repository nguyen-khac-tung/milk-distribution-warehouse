using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingLocationRepository
    {
        Task<List<StocktakingLocation>> GetLocationsByStockSheetIdAreaIdsAsync(string stockSheetId, List<int> areaIds);
        Task<List<StocktakingLocation>> GetLocationsBySheetAndAssignToAsync(string? sheetId, List<int> assignToIds);
        Task<StocktakingLocation?> GetStocktakingLocationById(Guid stocktakingLocationId);
        Task<int> CreateStocktakingLocationBulk(List<StocktakingLocation> creates);
        Task<int> UpdateStocktakingLocation(StocktakingLocation stocktakingLocation);
        Task<bool> AreExistStocklocationByAllStockAreaIdsAsync(List<Guid> stockAreaIds);
        Task<bool> AnyStocktakingLocationByStockAreaId(Guid stocktakingAreaId);
        Task<bool> AnyStocktakingLocationSameStockSheetAsync(string stockSheetId, Guid stockAreaId, int assignTo);
        Task<bool> IsExistStocktakingLocationByStockLocationIdAndLocationCode(Guid stocktakingLocationId, string locationCode);
        Task<bool> AnyStocktakingLocationPendingStatus(Guid stocktakingAreaId);
    }
    public class StocktakingLocationRepository : IStocktakingLocationRepository
    {
        private readonly WarehouseContext _context;
        public StocktakingLocationRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<List<StocktakingLocation>> GetLocationsByStockSheetIdAreaIdsAsync(string stockSheetId, List<int> areaIds)
        {
            return await _context.StocktakingLocations
                .Include(sl => sl.StocktakingArea)
                .Where(sl => sl.StocktakingArea.StocktakingSheetId.Equals(stockSheetId) &&
                            sl.StocktakingArea.AreaId.HasValue &&
                            areaIds.Contains(sl.StocktakingArea.AreaId.Value)
                      )
                .ToListAsync();
        }

        public async Task<List<StocktakingLocation>> GetLocationsBySheetAndAssignToAsync(string? sheetId, List<int> assignToIds)
        {
            return await _context.StocktakingLocations
                .Where(sl =>
                            sl.StocktakingArea.StocktakingSheetId.Equals(sheetId) &&
                            sl.StocktakingArea.AssignTo.HasValue &&
                            assignToIds.Contains(sl.StocktakingArea.AssignTo.Value)
                        )
                .ToListAsync();
        }

        public async Task<StocktakingLocation?> GetStocktakingLocationById(Guid stocktakingLocationId)
        {
            return await _context.StocktakingLocations
                .FirstOrDefaultAsync(sl => sl.StocktakingLocationId == stocktakingLocationId);
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

        public async Task<int> UpdateStocktakingLocation(StocktakingLocation stocktakingLocation)
        {
            try
            {
                _context.StocktakingLocations.Update(stocktakingLocation);
                await _context.SaveChangesAsync();
                return 1;
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

        public async Task<bool> AnyStocktakingLocationSameStockSheetAsync(string stockSheetId, Guid stockAreaId, int assignTo)
        {
            return await _context.StocktakingLocations
                .AnyAsync(sl =>
                    sl.StocktakingArea != null &&
                    sl.StocktakingArea.StocktakingSheetId.Equals(stockSheetId) &&
                    sl.StocktakingAreaId != stockAreaId &&
                    sl.StocktakingArea.AssignTo == assignTo
                );
        }

        public async Task<bool> IsExistStocktakingLocationByStockLocationIdAndLocationCode(Guid stocktakingLocationId, string locationCode)
        {
            return await _context.StocktakingLocations
                .Include(sl => sl.Location)
                .AnyAsync(sl =>
                        sl.StocktakingLocationId == stocktakingLocationId &&
                        sl.Location.LocationCode.Equals(locationCode)
                );
        }

        public async Task<bool> AnyStocktakingLocationPendingStatus(Guid stocktakingAreaId)
        {
            return await _context.StocktakingLocations
                .AnyAsync(sl =>
                            sl.StocktakingAreaId == stocktakingAreaId &&
                            sl.Status == StockLocationStatus.Pending
                            );
        }
    }
}
