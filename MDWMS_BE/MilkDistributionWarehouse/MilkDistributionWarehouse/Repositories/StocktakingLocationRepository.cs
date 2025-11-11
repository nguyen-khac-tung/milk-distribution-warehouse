using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingLocationRepository
    {
        Task<int> CreateStocktakingLocationBulk(List<StocktakingLocation> creates);
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
    }
}
