using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingLocationRepository
    {
        Task<int> CreateStocktakingLocationBulk(List<StocktakingLocation> creates);
        Task<bool> AreExistStocklocationByAllStockAreaIdsAsync(List<Guid> stockAreaIds);
        Task<bool> AnyStocktakingLocationByStockAreaId(Guid stocktakingAreaId);
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
    }
}
