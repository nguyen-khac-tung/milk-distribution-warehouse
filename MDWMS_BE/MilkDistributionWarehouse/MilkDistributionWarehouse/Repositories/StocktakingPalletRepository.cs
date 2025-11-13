using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingPalletRepository
    {
        Task<StocktakingPallet?> GetStocktakingPalletByStocktakingLocationId(Guid stoctakingLocationId);
        Task<int> CreateStocktakingPalletBulk(List<StocktakingPallet> creates);
    }

    public class StocktakingPalletRepository : IStocktakingPalletRepository
    {
        private readonly WarehouseContext _context;
        public StocktakingPalletRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<StocktakingPallet?> GetStocktakingPalletByStocktakingLocationId(Guid stoctakingLocationId)
        {
            return await _context.StocktakingPallets
                .Include(sp => sp.Pallet)
                .FirstOrDefaultAsync(sp => sp.StocktakingLocationId == stoctakingLocationId);
        }

        public async Task<int> CreateStocktakingPalletBulk(List<StocktakingPallet> creates)
        {
            try
            {
                await _context.StocktakingPallets.AddRangeAsync(creates);
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
